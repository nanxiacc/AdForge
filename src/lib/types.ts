export type Aspect = "9:16" | "1:1" | "16:9";
export type Tone = "energetic" | "friendly" | "premium" | "direct";
export type Language = "en" | "zh";
export type SceneKind =
  | "hook"
  | "problem"
  | "feature"
  | "benefit"
  | "social"
  | "cta";

export type VideoStatus =
  | "queued"
  | "analyzing"
  | "scripting"
  | "voicing"
  | "assembling"
  | "rendering"
  | "done"
  | "failed";

export interface Scene {
  id: string;
  kind: SceneKind;
  /** What the voiceover says. */
  voiceover: string;
  /** Big on-screen text. */
  headline: string;
  sub?: string;
  /** Source image URL used as the scene backdrop. */
  image?: string | null;
}

export interface ProductInfo {
  url: string;
  title: string;
  description: string;
  images: string[];
  price?: string;
  brand?: string;
}

export interface BrandKit {
  id: string;
  name: string;
  logo?: string | null;
  primary: string;
  ink: string;
  paper: string;
  cta: string;
  domain?: string;
}

export interface VideoSpec {
  product: ProductInfo;
  scenes?: Scene[];
  voiceId: string;
  avatarId?: string | null;
  avatarName?: string | null;
  aspect: Aspect;
  tone: Tone;
  language: Language;
  music: boolean;
  brand: BrandKit;
  duration: number;
}

export interface ProjectRow {
  id: string;
  title: string;
  product_url: string;
  status: string;
  cover: string | null;
  created_at: number;
  updated_at: number;
}

export interface VideoRow {
  id: string;
  project_id: string;
  status: VideoStatus;
  stage: string;
  progress: number;
  error: string | null;
  aspect: Aspect;
  duration: number | null;
  output: string | null;
  thumb: string | null;
  spec: string;
  script: string | null;
  created_at: number;
  updated_at: number;
}

export interface PublicVideo
  extends Omit<VideoRow, "spec" | "script" | "output" | "thumb"> {
  spec: VideoSpec;
  script: Scene[] | null;
  outputUrl: string | null;
  thumbUrl: string | null;
}

export interface JobRow {
  id: string;
  video_id: string;
  status: "queued" | "running" | "done" | "failed";
  attempts: number;
  run_at: number;
}

export const ASPECTS: Record<Aspect, { w: number; h: number; label: string }> = {
  "9:16": { w: 1080, h: 1920, label: "竖版 9:16" },
  "1:1": { w: 1080, h: 1080, label: "方形 1:1" },
  "16:9": { w: 1920, h: 1080, label: "横版 16:9" },
};

export const TONES: { id: Tone; label: string; hint: string }[] = [
  { id: "energetic", label: "高能", hint: "TikTok 式快节奏，强钩子" },
  { id: "friendly", label: "亲和", hint: "像朋友种草，口语化" },
  { id: "premium", label: "高级", hint: "克制、质感、品牌感" },
  { id: "direct", label: "直给", hint: "卖点 + 行动指令，转化优先" },
];

export const SCENE_LABEL: Record<SceneKind, string> = {
  hook: "钩子",
  problem: "痛点",
  feature: "卖点",
  benefit: "收益",
  social: "口碑",
  cta: "行动",
};
