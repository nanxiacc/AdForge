import type { VideoStatus } from "./types";

export const STATUS_META: Record<
  VideoStatus,
  { label: string; tone: "default" | "accent" | "success" | "warn" | "danger" }
> = {
  queued: { label: "排队中", tone: "default" },
  analyzing: { label: "解析素材", tone: "accent" },
  scripting: { label: "写脚本", tone: "accent" },
  voicing: { label: "配音中", tone: "accent" },
  assembling: { label: "合成画面", tone: "accent" },
  rendering: { label: "渲染中", tone: "accent" },
  done: { label: "已完成", tone: "success" },
  failed: { label: "失败", tone: "danger" },
};

export function isBusy(status: string) {
  return ["queued", "analyzing", "scripting", "voicing", "assembling", "rendering"].includes(
    status,
  );
}
