import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { Aspect, BrandKit, Scene, VideoSpec } from "../types";
import { ASPECTS } from "../types";
import { alpha, escapeXml, hasCJK, measure, wrapText } from "../utils";

const FONT =
  "Helvetica Neue, Helvetica, Arial, PingFang SC, Hiragino Sans GB, sans-serif";

interface TextOpts {
  text: string;
  x: number;
  top: number;
  size: number;
  color: string;
  weight?: number;
  tracking?: number;
  lineHeight?: number;
  maxWidth: number;
  maxLines?: number;
  anchor?: "start" | "middle";
  uppercase?: boolean;
  stroke?: boolean;
  align?: "left" | "center";
}

function textBlock(o: TextOpts): { svg: string; height: number } {
  const weight = o.weight ?? 700;
  const text = o.uppercase ? o.text.toUpperCase() : o.text;
  const lines = wrapText(text, o.maxWidth, o.size, weight, o.maxLines ?? 3);
  const lh = (o.lineHeight ?? 1.08) * o.size;
  const anchor = o.anchor ?? "start";
  const tx = anchor === "middle" ? o.x : o.x;

  const strokeColor = "rgba(0,0,0,0.55)";
  let strokeEls = "";
  let fillEls = "";
  lines.forEach((line, i) => {
    const y = o.top + o.size * 0.82 + i * lh;
    const common = `x="${tx}" y="${y}" text-anchor="${anchor}" font-family="${FONT}" font-size="${o.size}" font-weight="${weight}" letter-spacing="${o.tracking ?? 0}"`;
    if (o.stroke !== false) {
      strokeEls += `<text ${common} fill="none" stroke="${strokeColor}" stroke-width="${Math.round(o.size * 0.1)}" stroke-linejoin="round">${escapeXml(line)}</text>`;
    }
    fillEls += `<text ${common} fill="${o.color}">${escapeXml(line)}</text>`;
  });
  return {
    svg: strokeEls + fillEls,
    height: lines.length * lh,
  };
}

function pill(opts: {
  x: number;
  y: number;
  text: string;
  size: number;
  bg: string;
  fg: string;
  padX?: number;
  h?: number;
}): string {
  const padX = opts.padX ?? opts.size * 0.85;
  const h = opts.h ?? opts.size * 2.05;
  const w = measure(opts.text, opts.size, 700) + padX * 2;
  return `<g>
    <rect x="${opts.x}" y="${opts.y}" width="${w}" height="${h}" rx="${h / 2}" fill="${opts.bg}"/>
    <text x="${opts.x + w / 2}" y="${opts.y + h / 2 + opts.size * 0.34}" text-anchor="middle" font-family="${FONT}" font-size="${opts.size}" font-weight="700" letter-spacing="${opts.size * 0.06}" fill="${opts.fg}">${escapeXml(opts.text.toUpperCase())}</text>
  </g>`;
}

function svgDoc(w: number, h: number, body: string): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  );
}

async function gradientFallback(
  w: number,
  h: number,
  brand: BrandKit,
): Promise<Buffer> {
  const svg = svgDoc(
    w,
    h,
    `<defs>
      <radialGradient id="g1" cx="0.2" cy="0.15" r="0.9">
        <stop offset="0" stop-color="${brand.primary}" stop-opacity="0.55"/>
        <stop offset="0.55" stop-color="${brand.primary}" stop-opacity="0.08"/>
        <stop offset="1" stop-color="${brand.ink}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#141418"/>
        <stop offset="1" stop-color="#050506"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g2)"/>
    <rect width="${w}" height="${h}" fill="url(#g1)"/>
    <circle cx="${w * 0.86}" cy="${h * 0.2}" r="${w * 0.22}" fill="${brand.primary}" opacity="0.08"/>`,
  );
  return sharp(svg).png().toBuffer();
}

async function background(
  imagePath: string | undefined,
  w: number,
  h: number,
  brand: BrandKit,
  blur: number,
  brightness: number,
): Promise<Buffer> {
  if (!imagePath || !fs.existsSync(imagePath)) {
    return gradientFallback(w, h, brand);
  }
  try {
    let img = sharp(imagePath)
      .flatten({ background: brand.ink })
      .resize(w, h, { fit: "cover", position: "attention" });
    if (blur > 0.3) img = img.blur(blur);
    return await img
      .modulate({ brightness, saturation: 0.92 })
      .png()
      .toBuffer();
  } catch {
    return gradientFallback(w, h, brand);
  }
}

async function roundedBuffer(
  file: string,
  w: number,
  h: number,
  radius: number,
): Promise<Buffer> {
  const inner = await sharp(file)
    .resize(w, h, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const mask = svgDoc(
    w,
    h,
    `<rect width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="#fff"/>`,
  );
  return sharp(inner)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function productCard(
  file: string | undefined,
  w: number,
  h: number,
  radius: number,
): Promise<Buffer> {
  const pad = Math.round(Math.min(w, h) * 0.06);
  const card = await sharp(
    svgDoc(
      w,
      h,
      `<rect width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="#FBFAF7"/>`,
    ),
  )
    .png()
    .toBuffer();

  if (!file || !fs.existsSync(file)) return card;
  try {
    const img = await sharp(file)
      .resize(w - pad * 2, h - pad * 2, {
        fit: "contain",
        background: { r: 251, g: 250, b: 247, alpha: 0 },
      })
      .png()
      .toBuffer();
    const rounded = await sharp(img)
      .composite([
        {
          input: svgDoc(
            w - pad * 2,
            h - pad * 2,
            `<rect width="${w - pad * 2}" height="${h - pad * 2}" rx="${radius * 0.6}" fill="#fff"/>`,
          ),
          blend: "dest-in",
        },
      ])
      .png()
      .toBuffer();
    return sharp(card)
      .composite([{ input: rounded, top: pad, left: pad }])
      .png()
      .toBuffer();
  } catch {
    return card;
  }
}

async function shadowFor(w: number, h: number, radius: number): Promise<Buffer> {
  const pad = 60;
  const svg = svgDoc(
    w + pad * 2,
    h + pad * 2,
    `<rect x="${pad}" y="${pad}" width="${w}" height="${h}" rx="${radius}" fill="rgba(0,0,0,0.55)"/>`,
  );
  return sharp(svg).blur(22).png().toBuffer();
}

async function circularImage(
  file: string,
  d: number,
  ring: string,
): Promise<Buffer> {
  const size = d + 16;
  const inner = await sharp(file)
    .resize(d, d, { fit: "cover" })
    .png()
    .toBuffer();
  const mask = svgDoc(
    d,
    d,
    `<circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}" fill="#fff"/>`,
  );
  const rounded = await sharp(inner)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const ringSvg = svgDoc(
    size,
    size,
    `<circle cx="${size / 2}" cy="${size / 2}" r="${d / 2 + 5}" fill="${ring}"/>`,
  );
  return sharp(ringSvg)
    .composite([{ input: rounded, top: 8, left: 8 }])
    .png()
    .toBuffer();
}

export interface SceneStillInput {
  scene: Scene;
  spec: VideoSpec;
  imagePath?: string;
  avatarPath?: string;
  index: number;
  out: string;
}

export async function renderSceneStill(
  input: SceneStillInput,
): Promise<string> {
  const { scene, spec } = input;
  const brand = spec.brand;
  const { w, h } = ASPECTS[spec.aspect];
  const M = Math.round(w * 0.062);
  const isHero = scene.kind === "hook";
  const isCta = scene.kind === "cta";
  const isType = scene.kind === "problem";
  const isQuote = scene.kind === "social";
  const accent = brand.primary;
  const ink = "#0B0B0C";
  const paper = "#F7F6F2";
  const ctaLabel = (
    spec.language === "zh"
      ? hasCJK(brand.cta)
        ? brand.cta
        : "立即购买"
      : hasCJK(brand.cta)
        ? "SHOP NOW"
        : brand.cta || "SHOP NOW"
  ).toUpperCase();

  let cutoutImage = false;
  if (input.imagePath) {
    try {
      const meta = await sharp(input.imagePath).metadata();
      cutoutImage = Boolean(meta.hasAlpha);
    } catch {
      cutoutImage = false;
    }
  }

  let base: sharp.Sharp;
  const composites: sharp.OverlayOptions[] = [];

  if (isCta) {
    const svg = svgDoc(
      w,
      h,
      `<defs>
        <linearGradient id="cta" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${accent}"/>
          <stop offset="1" stop-color="${alpha(accent, 0.82)}"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#cta)"/>
      <circle cx="${w * 0.9}" cy="${h * 0.1}" r="${w * 0.3}" fill="#fff" opacity="0.14"/>
      <circle cx="${w * 0.05}" cy="${h * 0.9}" r="${w * 0.34}" fill="${ink}" opacity="0.05"/>`,
    );
    base = sharp(svg).png();
  } else if (isType) {
    const svg = svgDoc(
      w,
      h,
      `<defs>
        <radialGradient id="tg" cx="0.5" cy="0.42" r="0.75">
          <stop offset="0" stop-color="${accent}" stop-opacity="0.22"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="${ink}"/>
      <rect width="${w}" height="${h}" fill="url(#tg)"/>`,
    );
    base = sharp(svg).png();
  } else if (isQuote) {
    const svg = svgDoc(
      w,
      h,
      `<rect width="${w}" height="${h}" fill="${paper}"/>
       <circle cx="${w * 0.82}" cy="${h * 0.18}" r="${w * 0.26}" fill="${accent}" opacity="0.25"/>`,
    );
    base = sharp(svg).png();
  } else if (isHero) {
    base = sharp(
      await background(cutoutImage ? undefined : input.imagePath, w, h, brand, 0, 0.9),
    );
  } else {
    base = sharp(
      await background(cutoutImage ? undefined : input.imagePath, w, h, brand, 30, 0.42),
    );
  }

  // Transparent product shots are placed as a cut-out instead of a backdrop.
  if (isHero && cutoutImage && input.imagePath) {
    try {
      const boxW = Math.round(w * 0.94);
      const boxH = Math.round(h * 0.38);
      const cut = await sharp(input.imagePath)
        .resize(boxW, boxH, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      composites.push({
        input: cut,
        top: Math.round(h * 0.07),
        left: Math.round((w - boxW) / 2),
      });
    } catch {
      /* keep the gradient backdrop */
    }
  }

  let text = "";

  // Top brand row (all layouts except CTA which uses its own).
  if (!isCta) {
    text += `<text x="${M}" y="${Math.round(h * 0.062)}" font-family="${FONT}" font-size="${Math.round(w * 0.024)}" font-weight="700" letter-spacing="${w * 0.004}" fill="rgba(255,255,255,0.82)">${escapeXml(
      (brand.name || "ADFORGE").toUpperCase(),
    )}</text>`;
  }

  if (isHero) {
    text += `<defs>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(0,0,0,0.45)"/>
        <stop offset="0.35" stop-color="rgba(0,0,0,0)"/>
        <stop offset="0.62" stop-color="rgba(0,0,0,0.15)"/>
        <stop offset="1" stop-color="rgba(0,0,0,0.9)"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#scrim)"/>`;

    const size = Math.round(Math.min(h * 0.062, w * 0.125));
    const block = textBlock({
      text: scene.headline,
      x: M,
      top: Math.round(h * 0.5),
      size,
      color: "#FFFFFF",
      weight: 800,
      tracking: -size * 0.02,
      lineHeight: 1.02,
      maxWidth: w - M * 2,
      maxLines: 3,
      uppercase: true,
    });
    text += pill({
      x: M,
      y: Math.round(h * 0.5) - Math.round(size * 0.95),
      text: spec.language === "zh" ? "新品" : "NEW",
      size: Math.round(w * 0.017),
      bg: accent,
      fg: ink,
    });
    text += block.svg;
    if (scene.sub) {
      const sub = textBlock({
        text: scene.sub,
        x: M,
        top: Math.round(h * 0.5) + block.height + Math.round(size * 0.22),
        size: Math.round(w * 0.028),
        color: "rgba(255,255,255,0.82)",
        weight: 500,
        lineHeight: 1.35,
        maxWidth: w - M * 2,
        maxLines: 2,
        stroke: false,
      });
      text += sub.svg;
    }
  } else if (isCta) {
    const logoText = textBlock({
      text: brand.name || "ADFORGE",
      x: w / 2,
      top: Math.round(h * 0.12),
      size: Math.round(w * 0.03),
      color: alpha(ink, 0.72),
      weight: 700,
      tracking: w * 0.006,
      maxWidth: w - M * 2,
      maxLines: 1,
      anchor: "middle",
      uppercase: true,
      stroke: false,
    });
    text += logoText.svg;

    const size = Math.round(Math.min(h * 0.1, w * 0.19));
    const block = textBlock({
      text: scene.headline,
      x: w / 2,
      top: Math.round(h * 0.36),
      size,
      color: ink,
      weight: 800,
      tracking: -size * 0.02,
      lineHeight: 1.0,
      maxWidth: w - M * 2,
      maxLines: 3,
      anchor: "middle",
      uppercase: true,
      stroke: false,
    });
    text += block.svg;

    const pillH = Math.round(h * 0.062);
    const pillLabel = (brand.domain || scene.sub || ctaLabel).toUpperCase();
    const pillW = Math.min(
      w - M * 2,
      Math.round(measure(pillLabel, Math.round(pillH * 0.42), 700) + pillH * 1.6),
    );
    const pillY = Math.round(h * 0.36) + block.height + Math.round(h * 0.055);
    text += `<g>
      <rect x="${(w - pillW) / 2}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${ink}"/>
      <text x="${w / 2}" y="${pillY + pillH / 2 + pillH * 0.19}" text-anchor="middle" font-family="${FONT}" font-size="${Math.round(pillH * 0.42)}" font-weight="700" letter-spacing="${pillH * 0.02}" fill="${accent}">${escapeXml(
        pillLabel,
      )}</text>
    </g>`;
  } else if (isType) {
    const size = Math.round(Math.min(h * 0.062, w * 0.125));
    const block = textBlock({
      text: scene.headline,
      x: w / 2,
      top: Math.round(h * 0.3),
      size,
      color: "#FFFFFF",
      weight: 800,
      tracking: -size * 0.02,
      lineHeight: 1.04,
      maxWidth: w - M * 2,
      maxLines: 3,
      anchor: "middle",
      uppercase: true,
    });
    text += block.svg;
    text += `<rect x="${w / 2 - w * 0.06}" y="${Math.round(h * 0.3) + block.height + h * 0.04}" width="${w * 0.12}" height="${Math.max(6, h * 0.006)}" rx="4" fill="${accent}"/>`;
    if (scene.sub) {
      const sub = textBlock({
        text: scene.sub,
        x: w / 2,
        top: Math.round(h * 0.3) + block.height + h * 0.075,
        size: Math.round(w * 0.026),
        color: "rgba(255,255,255,0.62)",
        weight: 500,
        lineHeight: 1.45,
        maxWidth: w - M * 2.4,
        maxLines: 3,
        anchor: "middle",
        stroke: false,
      });
      text += sub.svg;
    }
  } else if (isQuote) {
    text += `<text x="${M}" y="${Math.round(h * 0.3)}" font-family="Georgia, serif" font-size="${Math.round(h * 0.16)}" fill="${alpha(accent, 0.9)}">“</text>`;
    const size = Math.round(Math.min(h * 0.052, w * 0.105));
    const block = textBlock({
      text: scene.headline,
      x: w / 2,
      top: Math.round(h * 0.34),
      size,
      color: ink,
      weight: 700,
      lineHeight: 1.16,
      maxWidth: w - M * 2.2,
      maxLines: 4,
      anchor: "middle",
      stroke: false,
    });
    text += block.svg;
    if (scene.sub) {
      const sub = textBlock({
        text: scene.sub,
        x: w / 2,
        top: Math.round(h * 0.34) + block.height + h * 0.04,
        size: Math.round(w * 0.024),
        color: alpha(ink, 0.55),
        weight: 500,
        lineHeight: 1.4,
        maxWidth: w - M * 2.4,
        maxLines: 3,
        anchor: "middle",
        stroke: false,
      });
      text += sub.svg;
    }
    if (input.avatarPath) {
      const d = Math.round(w * 0.16);
      const circle = await circularImage(input.avatarPath, d, paper);
      composites.push({
        input: circle,
        top: Math.round(h * 0.58),
        left: Math.round((w - (d + 16)) / 2),
      });
    }
  } else {
    // split layout: headline top, product card middle, captions carry the VO
    const pipD = input.avatarPath ? Math.round(w * 0.17) : 0;
    const size = Math.round(Math.min(h * 0.038, w * 0.078));
    const block = textBlock({
      text: scene.headline,
      x: M,
      top: Math.round(h * 0.115),
      size,
      color: "#FFFFFF",
      weight: 800,
      tracking: -size * 0.02,
      lineHeight: 1.06,
      maxWidth: w - M * 2 - (pipD ? pipD + 16 : 0),
      maxLines: 3,
      uppercase: true,
    });
    text += `<rect x="${M}" y="${Math.round(h * 0.085)}" width="${Math.round(w * 0.09)}" height="${Math.max(5, h * 0.005)}" rx="3" fill="${accent}"/>`;
    text += block.svg;

    const cardW = Math.round(w - M * 2);
    const cardH = Math.round(Math.min(h * 0.4, cardW * 0.92));
    const cardY = Math.round(h * 0.315);
    const cardX = M;
    const shadow = await shadowFor(cardW, cardH, Math.round(w * 0.035));
    composites.push({
      input: shadow,
      top: cardY - 60 + 14,
      left: cardX - 60 + 6,
    });
    const card = await productCard(
      input.imagePath,
      cardW,
      cardH,
      Math.round(w * 0.035),
    );
    composites.push({ input: card, top: cardY, left: cardX });

    if (input.avatarPath) {
      const d = Math.round(w * 0.17);
      const circle = await circularImage(input.avatarPath, d, accent);
      composites.push({
        input: circle,
        top: Math.round(h * 0.075),
        left: Math.round(w - M - d - 16),
      });
      text += `<text x="${Math.round(w - M - d / 2)}" y="${Math.round(h * 0.075) + d + 26}" text-anchor="middle" font-family="${FONT}" font-size="${Math.round(w * 0.018)}" font-weight="600" fill="rgba(255,255,255,0.75)">${escapeXml(
        spec.avatarName ?? "Creator",
      )}</text>`;
    }
  }

  text += `<text x="${M}" y="${h - Math.round(h * 0.028)}" font-family="${FONT}" font-size="${Math.round(w * 0.018)}" font-weight="500" fill="rgba(255,255,255,0.28)">${escapeXml(
    brand.domain ?? "",
  )}</text>`;

  composites.push({ input: svgDoc(w, h, text), top: 0, left: 0 });

  await base
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(input.out);

  return input.out;
}

export async function renderAvatarImage(
  avatarSvgString: string,
  out: string,
  size = 1400,
): Promise<string> {
  const svg = avatarSvgString.replace(
    /width="400" height="400"/,
    `width="${size}" height="${size}"`,
  );
  await sharp(Buffer.from(svg)).png().toFile(out);
  return out;
}

export function aspectDir(root: string, aspect: Aspect) {
  return path.join(root, aspect.replace(":", "x"));
}
