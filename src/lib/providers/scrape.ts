import * as cheerio from "cheerio";
import { execFile } from "node:child_process";
import fs from "node:fs";
import type { ProductInfo } from "../types";
import { UA } from "../ffmpeg";

const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function clean(s: string | undefined | null): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function absolute(src: string, base: string): string | null {
  try {
    const u = new URL(src, base);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function usableImage(url: string): boolean {
  if (/\.svg(\?|$)/i.test(url)) return false;
  if (/sprite|icon|favicon|logo[-_]?\d|pixel|spacer|1x1|loading|placeholder/i.test(url))
    return false;
  return /\.(jpe?g|png|webp|avif)(\?|$)/i.test(url) || /cdn|image|photo|media/i.test(url);
}

async function fetchHtmlRaw(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(18_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!/html/i.test(type)) throw new Error(`Not HTML (${type})`);
  return res.text();
}

function fetchWithChrome(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CHROME)) return reject(new Error("Chrome not found"));
    execFile(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--virtual-time-budget=9000",
        "--dump-dom",
        url,
      ],
      { maxBuffer: 24 * 1024 * 1024, timeout: 30_000 },
      (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout);
      },
    );
  });
}

interface JsonLdProduct {
  name?: string;
  description?: string;
  image?: string | string[] | { url?: string }[];
  brand?: string | { name?: string };
  offers?:
    | { price?: string | number; priceCurrency?: string }
    | { price?: string | number; priceCurrency?: string }[];
}

function collectJsonLd($: cheerio.CheerioAPI): JsonLdProduct | null {
  const scripts = $('script[type="application/ld+json"]').toArray();
  const queue: unknown[] = [];
  for (const el of scripts) {
    try {
      const parsed = JSON.parse($(el).text());
      queue.push(parsed);
    } catch {
      /* ignore malformed blocks */
    }
  }
  const seen: unknown[] = [];
  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== "object" || seen.includes(node)) continue;
    seen.push(node);
    const obj = node as Record<string, unknown>;
    const type = obj["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.some((t) => String(t).toLowerCase() === "product")) {
      return obj as JsonLdProduct;
    }
    for (const key of ["@graph", "itemListElement", "mainEntity", "hasVariant"]) {
      const v = obj[key];
      if (Array.isArray(v)) queue.push(...v);
      else if (v && typeof v === "object") queue.push(v);
    }
  }
  return null;
}

function pickImages(
  $: cheerio.CheerioAPI,
  base: string,
  ld: JsonLdProduct | null,
): string[] {
  const out: string[] = [];
  const add = (raw?: string | null) => {
    if (!raw) return;
    const v = absolute(raw.trim(), base);
    if (!v || !usableImage(v)) return;
    if (out.some((o) => o.split("?")[0] === v.split("?")[0])) return;
    out.push(v);
  };

  const og = $('meta[property="og:image"]').attr("content");
  add(og);
  add($('meta[name="twitter:image"]').attr("content"));

  const ldImage = ld?.image;
  if (typeof ldImage === "string") add(ldImage);
  else if (Array.isArray(ldImage)) {
    for (const img of ldImage) {
      if (typeof img === "string") add(img);
      else if (img && typeof img === "object") add(img.url);
    }
  }

  $("img").each((_, el) => {
    if (out.length >= 8) return;
    const node = $(el);
    const srcset = node.attr("srcset") || node.attr("data-srcset");
    if (srcset) {
      const best = srcset
        .split(",")
        .map((p) => p.trim().split(/\s+/))
        .sort((a, b) => parseFloat(b[1] || "0") - parseFloat(a[1] || "0"))[0];
      add(best?.[0]);
    }
    add(node.attr("src"));
    add(node.attr("data-src"));
    add(node.attr("data-original"));
  });

  return out.slice(0, 8);
}

export async function scrapeProduct(url: string): Promise<ProductInfo> {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  let html = "";
  try {
    html = await fetchHtmlRaw(normalized);
  } catch {
    html = await fetchWithChrome(normalized);
  }

  const $ = cheerio.load(html);
  const ld = collectJsonLd($);

  const rawTitle =
    clean(ld?.name) ||
    clean($('meta[property="og:title"]').attr("content")) ||
    clean($("h1").first().text()) ||
    clean($("title").text());

  const siteName =
    clean($('meta[property="og:site_name"]').attr("content")) ||
    clean(new URL(normalized).hostname.replace(/^www\./, ""));

  const title = rawTitle
    .replace(/\s*[|·—–]\s*[^|·—–]{2,28}$/u, "")
    .replace(/^Buy\s+/i, "")
    .trim();

  const description =
    clean(ld?.description) ||
    clean($('meta[property="og:description"]').attr("content")) ||
    clean($('meta[name="description"]').attr("content")) ||
    clean($("p").first().text()).slice(0, 400);

  debugText($.root().text(), "body");

  const images = pickImages($, normalized, ld);

  let price: string | undefined;
  const offer = Array.isArray(ld?.offers) ? ld?.offers?.[0] : ld?.offers;
  if (offer?.price) {
    const cur = offer.priceCurrency ?? "";
    price = `${cur} ${offer.price}`.trim();
  } else {
    const metaPrice =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[property="og:price:amount"]').attr("content");
    const metaCur =
      $('meta[property="product:price:currency"]').attr("content") || "";
    if (metaPrice) price = `${metaCur} ${metaPrice}`.trim();
  }

  const brand =
    (typeof ld?.brand === "string" ? ld.brand : ld?.brand?.name) || siteName;

  if (!title) throw new Error("没有抓取到商品标题，请手动填写");

  return {
    url: normalized,
    title: title.slice(0, 120),
    description: description.slice(0, 1200),
    images,
    price,
    brand,
  };
}

function debugText(text: string, label: string) {
  if (process.env.ADFORGE_DEBUG) {
    console.log(`[scrape] ${label}: ${text.trim().length} chars`);
  }
}

export function analyzeUrl(input: string): Promise<ProductInfo> {
  return scrapeProduct(input);
}
