import sharp from "sharp";
import type { WordCue } from "../providers/tts";
import { ASPECTS, type Aspect } from "../types";
import { escapeXml, hasCJK, measure, wrapText } from "../utils";

export interface CaptionCue {
  text: string;
  start: number;
  end: number;
}

export function groupCues(
  words: WordCue[],
  language: "en" | "zh",
): CaptionCue[] {
  const maxChars = language === "zh" ? 13 : 18;
  const maxWords = language === "zh" ? 5 : 4;
  const cues: CaptionCue[] = [];
  let buf: WordCue[] = [];
  let chars = 0;

  const flush = () => {
    if (!buf.length) return;
    const text = (language === "zh" ? "" : " ") + buf.map((w) => w.text).join(language === "zh" ? "" : " ");
    cues.push({
      text: text.trim(),
      start: buf[0].start,
      end: buf[buf.length - 1].end + 0.12,
    });
    buf = [];
    chars = 0;
  };

  for (const w of words) {
    const gap = buf.length ? w.start - buf[buf.length - 1].end : 0;
    const nextLen = chars + Array.from(w.text).length;
    if (buf.length && (nextLen > maxChars || buf.length >= maxWords || gap > 0.45)) {
      flush();
    }
    buf.push(w);
    chars += Array.from(w.text).length;
    if (/[.!?。！？]$/.test(w.text)) flush();
  }
  flush();
  return cues;
}

const FONT =
  "Helvetica Neue, Helvetica, Arial, PingFang SC, Hiragino Sans GB, sans-serif";

export async function renderCaptionPng(
  text: string,
  aspect: Aspect,
  out: string,
): Promise<string> {
  const { w, h } = ASPECTS[aspect];
  const size = Math.round(h * (aspect === "16:9" ? 0.046 : 0.032));
  const maxTextWidth = Math.round(w * 0.72);
  const lines = wrapText(text, maxTextWidth, size, 800, 2);
  const lineH = size * 1.16;
  const padX = size * 0.62;
  const padY = size * 0.42;

  const widths = lines.map((l) => measure(l, size, 800));
  const boxW = Math.min(w * 0.92, Math.max(...widths) + padX * 2);
  const boxH = lines.length * lineH + padY * 2;
  const boxX = (w - boxW) / 2;
  const anchorTop = h * (aspect === "16:9" ? 0.775 : aspect === "1:1" ? 0.775 : 0.785);
  const boxY = anchorTop;

  let textEls = "";
  lines.forEach((line, i) => {
    const y = boxY + padY + size * 0.82 + i * lineH;
    const tl = widths[i];
    textEls += `<text x="${w / 2 + 2}" y="${y + 2}" text-anchor="middle" textLength="${tl}" lengthAdjust="spacingAndGlyphs" font-family="${FONT}" font-size="${size}" font-weight="800" fill="rgba(0,0,0,0.4)">${escapeXml(line.toUpperCase())}</text>`;
    textEls += `<text x="${w / 2}" y="${y}" text-anchor="middle" textLength="${tl}" lengthAdjust="spacingAndGlyphs" font-family="${FONT}" font-size="${size}" font-weight="800" fill="#FFFFFF">${escapeXml(line.toUpperCase())}</text>`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${size * 0.34}" fill="rgba(8,8,10,0.74)"/>
    ${textEls}
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(out);
  return out;
}
