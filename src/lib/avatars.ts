export interface Avatar {
  id: string;
  name: string;
  tag: string;
  lang: "en" | "zh" | "any";
  bg: [string, string];
  skin: string;
  hair: string;
  hairStyle: "long" | "bob" | "short" | "bun" | "curly" | "wavy";
  shirt: string;
  accent: string;
  note: string;
}

export const AVATARS: Avatar[] = [
  {
    id: "ava",
    name: "Ava",
    tag: "Creator · US",
    lang: "en",
    bg: ["#241B45", "#6D4AFF"],
    skin: "#F0C3A6",
    hair: "#2B1B16",
    hairStyle: "long",
    shirt: "#F2EDE4",
    accent: "#D8FF4F",
    note: "自然种草，适合美妆与生活方式",
  },
  {
    id: "noah",
    name: "Noah",
    tag: "Creator · UK",
    lang: "en",
    bg: ["#0F2E2B", "#2FA38A"],
    skin: "#C98F6B",
    hair: "#1B1512",
    hairStyle: "short",
    shirt: "#12201F",
    accent: "#7DFFD3",
    note: "沉稳讲解，适合 3C 与工具类",
  },
  {
    id: "mia",
    name: "Mia",
    tag: "Creator · AU",
    lang: "en",
    bg: ["#3A1526", "#E0559A"],
    skin: "#E8B08D",
    hair: "#5A2A18",
    hairStyle: "bob",
    shirt: "#FFE9C9",
    accent: "#FFD166",
    note: "轻快有活力，适合服饰与食品",
  },
  {
    id: "leo",
    name: "Leo",
    tag: "Creator · CA",
    lang: "en",
    bg: ["#142033", "#3C7BD9"],
    skin: "#8D5A3B",
    hair: "#101010",
    hairStyle: "curly",
    shirt: "#E8EDF5",
    accent: "#9CD2FF",
    note: "亲和邻家感，适合家居与健身",
  },
  {
    id: "sora",
    name: "Sora",
    tag: "Creator · JP",
    lang: "any",
    bg: ["#2B1B3A", "#B06BFF"],
    skin: "#F4CDB4",
    hair: "#241A2E",
    hairStyle: "wavy",
    shirt: "#1C1520",
    accent: "#F0B7FF",
    note: "中性气质，适合潮流与设计品",
  },
  {
    id: "lin",
    name: "林岚",
    tag: "Creator · CN",
    lang: "zh",
    bg: ["#2C1A1A", "#D9663F"],
    skin: "#F2C6A8",
    hair: "#1D1310",
    hairStyle: "bun",
    shirt: "#F6EFE6",
    accent: "#FFB08A",
    note: "普通话口播，适合国货与母婴",
  },
  {
    id: "kai",
    name: "Kai",
    tag: "Creator · SG",
    lang: "any",
    bg: ["#10222B", "#2E8FA8"],
    skin: "#D9A277",
    hair: "#15100E",
    hairStyle: "short",
    shirt: "#0D171C",
    accent: "#8FE9FF",
    note: "干净利落，适合 SaaS 与课程",
  },
  {
    id: "zoe",
    name: "Zoe",
    tag: "Creator · US",
    lang: "en",
    bg: ["#2A2410", "#C9A227"],
    skin: "#B97950",
    hair: "#2A1710",
    hairStyle: "curly",
    shirt: "#FBF4E4",
    accent: "#FFE08A",
    note: "真实感强，适合测评与对比",
  },
];

export function getAvatar(id?: string | null): Avatar | undefined {
  return AVATARS.find((a) => a.id === id);
}

/** Flat vector portrait used until a real avatar provider is connected. */
export function avatarSvg(a: Avatar): string {
  const hairBack =
    a.hairStyle === "long" || a.hairStyle === "wavy"
      ? `<path d="M120 180c0-58 36-96 80-96s80 38 80 96v96c0 10-16 12-20 2-7-15-9-40-9-60 0 0-16 14-51 14s-51-14-51-14c0 20-2 45-9 60-4 10-20 8-20-2z" fill="${a.hair}"/>`
      : a.hairStyle === "bob"
        ? `<path d="M122 182c0-58 34-96 78-96s78 38 78 96v44c0 14-20 18-26 5-5-11-6-26-6-38-14 8-30 12-46 12s-32-4-46-12c0 12-1 27-6 38-6 13-26 9-26-5z" fill="${a.hair}"/>`
        : a.hairStyle === "bun"
          ? `<circle cx="200" cy="86" r="26" fill="${a.hair}"/><path d="M128 180c0-56 32-92 72-92s72 36 72 92v34c0 12-18 16-23 4-5-11-6-24-6-36-13 8-27 12-43 12s-30-4-43-12c0 12-1 25-6 36-5 12-23 8-23-4z" fill="${a.hair}"/>`
          : a.hairStyle === "curly"
            ? `<g fill="${a.hair}"><circle cx="146" cy="132" r="30"/><circle cx="174" cy="108" r="30"/><circle cx="204" cy="100" r="31"/><circle cx="234" cy="110" r="30"/><circle cx="258" cy="138" r="28"/><circle cx="136" cy="166" r="24"/><circle cx="266" cy="170" r="24"/></g>`
            : `<path d="M130 178c0-56 30-92 70-92s70 36 70 92c0 12-6 20-12 12-10-14-14-30-16-40-12 10-26 14-42 14s-30-4-42-14c-2 10-6 26-16 40-6 8-12 0-12-12z" fill="${a.hair}"/>`;

  const fringe =
    a.hairStyle === "short"
      ? `<path d="M138 164c4-40 30-66 62-66s58 26 62 66c-18-18-38-26-62-26s-44 8-62 26z" fill="${a.hair}"/>`
      : a.hairStyle === "bun"
        ? `<path d="M142 158c8-34 30-54 58-54s50 20 58 54c-16-12-36-18-58-18s-42 6-58 18z" fill="${a.hair}"/>`
        : a.hairStyle === "curly"
          ? ""
          : `<path d="M140 168c4-38 28-62 60-62s56 24 60 62c-16-16-36-24-60-24s-44 8-60 24z" fill="${a.hair}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a.bg[0]}"/>
      <stop offset="1" stop-color="${a.bg[1]}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.32" cy="0.22" r="0.75">
      <stop offset="0" stop-color="${a.accent}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${a.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect width="400" height="400" fill="url(#glow)"/>
  <circle cx="332" cy="72" r="54" fill="${a.accent}" opacity="0.16"/>
  <path d="M84 400c0-62 46-104 116-104s116 42 116 104z" fill="${a.shirt}"/>
  <path d="M186 268h28v46h-28z" fill="${a.skin}"/>
  ${hairBack}
  <ellipse cx="200" cy="182" rx="62" ry="76" fill="${a.skin}"/>
  ${fringe}
  <ellipse cx="176" cy="184" rx="5" ry="7" fill="#20161A"/>
  <ellipse cx="224" cy="184" rx="5" ry="7" fill="#20161A"/>
  <path d="M164 168c6-5 14-6 20-2" stroke="${a.hair}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M216 166c6-4 14-3 20 2" stroke="${a.hair}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M186 214c8 8 20 8 28 0" stroke="#8A4A45" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse cx="154" cy="206" rx="13" ry="8" fill="#E88A7A" opacity="0.28"/>
  <ellipse cx="246" cy="206" rx="13" ry="8" fill="#E88A7A" opacity="0.28"/>
  <path d="M148 300c14-10 30-14 52-14s38 4 52 14" stroke="${a.accent}" stroke-width="4" fill="none" opacity="0.7"/>
</svg>`;
}
