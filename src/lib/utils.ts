import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";

export function id(prefix = ""): string {
  const raw = crypto.randomBytes(9).toString("base64url");
  return prefix ? `${prefix}_${raw}` : raw;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** #RRGGBB -> rgba() with alpha */
export function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full.slice(0, 6), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export function isHex(v: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}

export function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableOn(hex: string): string {
  return luminance(hex) > 0.55 ? "#0B0B0C" : "#FFFFFF";
}

const CJK = /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/;

export function hasCJK(s: string) {
  return CJK.test(s);
}

/** Rough advance width of a string at a given font size. */
export function measure(text: string, size: number, weight = 700): number {
  let w = 0;
  for (const ch of text) {
    if (/\s/.test(ch)) w += size * 0.28;
    else if (CJK.test(ch)) w += size * 1.0;
    else if (/[A-Z0-9]/.test(ch)) w += size * 0.64;
    else if (/[a-z]/.test(ch)) w += size * 0.54;
    else w += size * 0.34;
  }
  return w * (weight >= 800 ? 1.1 : 1);
}

export function wrapText(
  text: string,
  maxWidth: number,
  size: number,
  weight = 700,
  maxLines = 3,
): string[] {
  const words = hasCJK(text)
    ? Array.from(text)
    : text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";

  const pushCur = () => {
    if (cur.trim()) lines.push(cur.trim());
    cur = "";
  };

  for (const word of words) {
    const sep = hasCJK(text) || !cur ? "" : " ";
    const next = cur + (cur ? sep : "") + word;
    if (measure(next, size, weight) > maxWidth && cur) {
      pushCur();
      cur = word;
    } else {
      cur = next;
    }
  }
  pushCur();

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[\s,.;:!?，。；：！？]+$/, "") + "…";
    return kept;
  }
  return lines;
}

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function safeFileName(name: string) {
  return name.replace(/[^\w.-]+/g, "_").slice(0, 80);
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function fileSizeMB(file: string) {
  try {
    return Math.round((fs.statSync(file).size / 1024 / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}

export function relMedia(file: string, dataDir: string) {
  return path.relative(dataDir, file).split(path.sep).join("/");
}
