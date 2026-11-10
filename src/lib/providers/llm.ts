import type {
  BrandKit,
  Language,
  ProductInfo,
  Scene,
  SceneKind,
  Tone,
} from "../types";
import { hasCJK, wrapText } from "../utils";

interface BuildOptions {
  tone: Tone;
  language: Language;
  brand: BrandKit;
  duration: number;
}

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "with",
  "your",
  "you",
  "our",
  "to",
  "of",
  "in",
  "on",
  "is",
  "are",
  "it",
  "this",
  "that",
]);

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。！？])\s+|\s*[•·]\s*/)
    .map((s) => s.trim().replace(/^[-–—\s]+/, ""))
    .filter((s) => s.length >= 30 && s.length <= 190 && !/https?:\/\//.test(s));
}

function shortTitle(title: string, max = 46): string {
  const raw = title.replace(/["“”]/g, "").trim();
  // Drop variant tails (" - Size 8", " | White") so the ad reads like a product.
  const head = raw.split(/\s+[-–—|]\s+/)[0].trim();
  const t = head.length >= 10 ? head : raw;
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.6 ? cut.slice(0, at) : cut).trim() + "…";
}

function keyPhrase(sentence: string, words = 4): string {
  if (hasCJK(sentence)) return sentence.slice(0, 10);
  const parts = sentence
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w.toLowerCase()));
  return parts.slice(0, words).join(" ").toUpperCase() || "THE DIFFERENCE";
}

function featureLines(p: ProductInfo, language: Language): [string, string] {
  const found = sentences(p.description);
  const cjk = hasCJK(p.description);

  if (language === "zh" && cjk) {
    return [
      found[0] ?? "从设计到用料，每一处都在为体验让路。",
      found[1] ?? "用过一次，就很难再回到从前。",
    ];
  }
  if (language === "en" && !cjk) {
    return [
      found[0] ?? "Every detail is built around how you actually use it.",
      found[1] ?? "The kind of upgrade you notice every single day.",
    ];
  }
  if (language === "zh") {
    return [
      "从设计到用料，每一处都在为体验让路。",
      "用过一次，就很难再回到从前。",
    ];
  }
  return [
    "Every detail is built around how you actually use it.",
    "The kind of upgrade you notice every single day.",
  ];
}

function makeScenes(
  specs: {
    kind: SceneKind;
    vo: string;
    hl: string;
    sub?: string;
  }[],
  images: string[],
): Scene[] {
  return specs.map((s, i) => ({
    id: `s${i + 1}`,
    kind: s.kind,
    voiceover: s.vo,
    headline: s.hl.slice(0, 60),
    sub: s.sub?.slice(0, 110),
    image: images.length ? images[i % images.length] : null,
  }));
}

function buildEnglish(
  p: ProductInfo,
  b: BrandKit,
  tone: Tone,
): Scene[] {
  const name = shortTitle(p.title);
  const [f1, f2] = featureLines(p, "en");
  const cta = hasCJK(b.cta) ? "SHOP NOW" : b.cta || "SHOP NOW";

  const base: Record<Tone, Parameters<typeof makeScenes>[0]> = {
    energetic: [
      { kind: "hook", vo: `Stop scrolling. This is ${name}.`, hl: "STOP SCROLLING", sub: name },
      { kind: "problem", vo: `You don't need another compromise. You need this.`, hl: "THERE IS A BETTER WAY" },
      { kind: "feature", vo: f1, hl: "BUILT FOR REAL LIFE", sub: f1 },
      { kind: "feature", vo: f2, hl: "THE DETAILS MATTER", sub: f2 },
      { kind: "benefit", vo: `Small upgrade. Completely different result.`, hl: "THE DIFFERENCE IS REAL" },
      { kind: "cta", vo: `Tap the link and get ${name} today.`, hl: cta, sub: b.domain },
    ],
    friendly: [
      { kind: "hook", vo: `Okay, I have to talk about ${name}.`, hl: "OKAY, HEAR ME OUT", sub: name },
      { kind: "problem", vo: `I thought every option was the same. Then I tried this.`, hl: "I WAS WRONG" },
      { kind: "feature", vo: f1, hl: "THIS CHANGED THE ROUTINE", sub: f1 },
      { kind: "feature", vo: f2, hl: "THE LITTLE THINGS ADD UP", sub: f2 },
      { kind: "social", vo: `If you've been on the fence, this is your sign.`, hl: "THIS IS YOUR SIGN" },
      { kind: "cta", vo: `Link's right here — go treat yourself.`, hl: cta, sub: b.domain },
    ],
    premium: [
      { kind: "hook", vo: `Meet ${name}.`, hl: name, sub: "CONSIDERED IN EVERY DETAIL" },
      { kind: "problem", vo: `Designed for people who notice the difference.`, hl: "FOR THE DETAIL-OBSESSED" },
      { kind: "feature", vo: f1, hl: "LESS NOISE. MORE SIGNAL.", sub: f1 },
      { kind: "feature", vo: f2, hl: "MADE TO BE KEPT", sub: f2 },
      { kind: "benefit", vo: `Quiet luxury. Loud results.`, hl: "QUIET LUXURY" },
      { kind: "cta", vo: `Discover ${name} at the link.`, hl: cta, sub: b.domain },
    ],
    direct: [
      { kind: "hook", vo: `${name}. Here's what it does.`, hl: name, sub: p.price },
      { kind: "feature", vo: f1, hl: "WHAT IT DOES", sub: f1 },
      { kind: "feature", vo: f2, hl: "WHY IT WORKS", sub: f2 },
      { kind: "benefit", vo: `Built to last. Priced to make sense.`, hl: "NO GIMMICKS" },
      { kind: "social", vo: `Try it once. You'll get it.`, hl: "TRY IT ONCE" },
      { kind: "cta", vo: `Order now at the link.`, hl: cta, sub: b.domain },
    ],
  };

  return makeScenes(base[tone], p.images);
}

function buildChinese(p: ProductInfo, b: BrandKit, tone: Tone): Scene[] {
  const name = shortTitle(p.title, 26);
  const [f1, f2] = featureLines(p, "zh");
  const cta = hasCJK(b.cta) ? b.cta : "立即购买";

  const base: Record<Tone, Parameters<typeof makeScenes>[0]> = {
    energetic: [
      { kind: "hook", vo: `别划走，今天说个狠的：${name}。`, hl: "别划走", sub: name },
      { kind: "problem", vo: `还在用老办法？真的该换了。`, hl: "真的该换了" },
      { kind: "feature", vo: f1, hl: "为真实生活而做", sub: f1 },
      { kind: "feature", vo: f2, hl: "细节见真章", sub: f2 },
      { kind: "benefit", vo: `一点点升级，结果完全不一样。`, hl: "用过就回不去了" },
      { kind: "cta", vo: `点下方链接，把${name}带回家。`, hl: cta, sub: b.domain },
    ],
    friendly: [
      { kind: "hook", vo: `说真的，我必须安利一下${name}。`, hl: "听我说完", sub: name },
      { kind: "problem", vo: `以前我觉得都差不多，直到用了这个。`, hl: "我错了" },
      { kind: "feature", vo: f1, hl: "日常体验直接拉满", sub: f1 },
      { kind: "feature", vo: f2, hl: "细节真的会说话", sub: f2 },
      { kind: "social", vo: `如果你一直在犹豫，这就是信号。`, hl: "就是现在" },
      { kind: "cta", vo: `链接放这儿了，冲就完事。`, hl: cta, sub: b.domain },
    ],
    premium: [
      { kind: "hook", vo: `认识一下，${name}。`, hl: name, sub: "每一处，都经过推敲" },
      { kind: "problem", vo: `为那些在意差别的人而设计。`, hl: "为在意的人而做" },
      { kind: "feature", vo: f1, hl: "少一点噪音", sub: f1 },
      { kind: "feature", vo: f2, hl: "多一点质感", sub: f2 },
      { kind: "benefit", vo: `安静的质感，响亮的结果。`, hl: "质感自会说话" },
      { kind: "cta", vo: `在链接里，发现${name}。`, hl: cta, sub: b.domain },
    ],
    direct: [
      { kind: "hook", vo: `${name}，一句话讲清楚。`, hl: name, sub: p.price },
      { kind: "feature", vo: f1, hl: "它解决什么", sub: f1 },
      { kind: "feature", vo: f2, hl: "为什么有效", sub: f2 },
      { kind: "benefit", vo: `扎实做工，价格也讲道理。`, hl: "不玩虚的" },
      { kind: "social", vo: `试一次，你就懂了。`, hl: "试一次就懂" },
      { kind: "cta", vo: `现在下单，链接在下面。`, hl: cta, sub: b.domain },
    ],
  };

  return makeScenes(base[tone], p.images);
}

export function localScenes(
  product: ProductInfo,
  opts: BuildOptions,
): Scene[] {
  return opts.language === "zh"
    ? buildChinese(product, opts.brand, opts.tone)
    : buildEnglish(product, opts.brand, opts.tone);
}

function coerceScenes(raw: unknown, product: ProductInfo): Scene[] | null {
  if (!Array.isArray(raw)) return null;
  const kinds: SceneKind[] = [
    "hook",
    "problem",
    "feature",
    "benefit",
    "social",
    "cta",
  ];
  const out: Scene[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] as Record<string, unknown>;
    if (!item || typeof item !== "object") return null;
    const vo = String(item.voiceover ?? "").trim();
    const hl = String(item.headline ?? "").trim();
    if (!vo || !hl) return null;
    out.push({
      id: `s${i + 1}`,
      kind: kinds.includes(item.kind as SceneKind)
        ? (item.kind as SceneKind)
        : "feature",
      voiceover: vo,
      headline: hl,
      sub: item.sub ? String(item.sub) : undefined,
      image: product.images.length
        ? product.images[i % product.images.length]
        : null,
    });
  }
  return out.length >= 3 ? out.slice(0, 8) : null;
}

async function llmScenes(
  product: ProductInfo,
  opts: BuildOptions,
): Promise<Scene[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.ADFORGE_LLM_MODEL ?? "gpt-4o-mini";
  const lang = opts.language === "zh" ? "Simplified Chinese" : "English";

  const prompt = `You are a direct-response video ad writer. Write a ${Math.round(
    opts.duration,
  )}s short-form ad for the product below, in ${lang}, tone: ${opts.tone}.
Return ONLY JSON: {"scenes":[{"kind":"hook|problem|feature|benefit|social|cta","voiceover":"...","headline":"...","sub":"..."}]}
Rules: 6 scenes; voiceover 8-22 words each, spoken, no emojis, no hashtags, no fake statistics; headline max 6 words, ALL CAPS for English; sub max 12 words, optional.

Product: ${JSON.stringify({
    title: product.title,
    description: product.description,
    price: product.price,
    brand: opts.brand.name,
  })}`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    const parsed = JSON.parse(text) as { scenes?: unknown };
    return coerceScenes(parsed.scenes, product);
  } catch {
    return null;
  }
}

export async function generateScenes(
  product: ProductInfo,
  opts: BuildOptions,
): Promise<{ scenes: Scene[]; engine: "llm" | "template" }> {
  const llm = await llmScenes(product, opts);
  if (llm) return { scenes: llm, engine: "llm" };
  return { scenes: localScenes(product, opts), engine: "template" };
}

/** Trims a scene's on-screen sub copy so long scraped sentences stay legible. */
export function tidySub(sub: string | undefined): string | undefined {
  if (!sub) return undefined;
  const lines = wrapText(sub, 46, 20);
  return lines.join(" ");
}
