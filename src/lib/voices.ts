import type { Language } from "./types";

export interface Voice {
  id: string;
  name: string;
  locale: string;
  lang: Language;
  gender: "female" | "male";
  say: string;
  blurb: string;
  rate: number;
}

/**
 * Local voices are driven by macOS `say`, so the studio works with zero API keys.
 * Swapping in ElevenLabs/OpenAI later only touches lib/providers/tts.ts.
 */
export const VOICES: Voice[] = [
  {
    id: "samantha",
    name: "Samantha",
    locale: "en-US",
    lang: "en",
    gender: "female",
    say: "Samantha",
    blurb: "自然、亲切，适合种草口播",
    rate: 185,
  },
  {
    id: "daniel",
    name: "Daniel",
    locale: "en-GB",
    lang: "en",
    gender: "male",
    say: "Daniel",
    blurb: "沉稳英音，适合质感品牌",
    rate: 178,
  },
  {
    id: "karen",
    name: "Karen",
    locale: "en-AU",
    lang: "en",
    gender: "female",
    say: "Karen",
    blurb: "轻快澳音，UGC 感强",
    rate: 190,
  },
  {
    id: "moira",
    name: "Moira",
    locale: "en-IE",
    lang: "en",
    gender: "female",
    say: "Moira",
    blurb: "温柔爱尔兰口音",
    rate: 176,
  },
  {
    id: "rishi",
    name: "Rishi",
    locale: "en-IN",
    lang: "en",
    gender: "male",
    say: "Rishi",
    blurb: "清晰南亚口音，适合讲解",
    rate: 182,
  },
  {
    id: "tessa",
    name: "Tessa",
    locale: "en-ZA",
    lang: "en",
    gender: "female",
    say: "Tessa",
    blurb: "清亮南非口音",
    rate: 184,
  },
  {
    id: "tingting",
    name: "婷婷",
    locale: "zh-CN",
    lang: "zh",
    gender: "female",
    say: "Tingting",
    blurb: "标准普通话，女声",
    rate: 175,
  },
  {
    id: "meijia",
    name: "美佳",
    locale: "zh-TW",
    lang: "zh",
    gender: "female",
    say: "Meijia",
    blurb: "台湾腔，柔和自然",
    rate: 170,
  },
  {
    id: "sinji",
    name: "善怡",
    locale: "zh-HK",
    lang: "zh",
    gender: "female",
    say: "Sinji",
    blurb: "粤语女声",
    rate: 170,
  },
];

export function getVoice(id: string): Voice {
  return VOICES.find((v) => v.id === id) ?? VOICES[0];
}
