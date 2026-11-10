"use client";

import { useRef, useState } from "react";
import { Mic2, Pause, Play, Sparkles, Users } from "lucide-react";
import { AVATARS } from "@/lib/avatars";
import { VOICES } from "@/lib/voices";
import { Badge, Card, cn } from "@/components/ui";

export default function AssetsPage() {
  const [tab, setTab] = useState<"avatars" | "voices">("avatars");
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function preview(id: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playing === id) {
      setPlaying(null);
      return;
    }
    const audio = new Audio(`/api/voices/${id}/preview`);
    audioRef.current = audio;
    setPlaying(id);
    audio.onended = () => setPlaying(null);
    audio.onerror = () => setPlaying(null);
    void audio.play().catch(() => setPlaying(null));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-white sm:text-[28px]">
          素材库
        </h1>
        <p className="mt-1 text-[13px] text-white/35">
          内置数字人与声音，可直接用于任意项目。
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setTab("avatars")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] font-medium transition",
            tab === "avatars"
              ? "bg-white/[0.08] text-white"
              : "text-white/40 hover:text-white/70",
          )}
        >
          <Users className="h-4 w-4" /> 数字人
          <span className="text-[10px] text-white/25">{AVATARS.length}</span>
        </button>
        <button
          onClick={() => setTab("voices")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] font-medium transition",
            tab === "voices"
              ? "bg-white/[0.08] text-white"
              : "text-white/40 hover:text-white/70",
          )}
        >
          <Mic2 className="h-4 w-4" /> 声音
          <span className="text-[10px] text-white/25">{VOICES.length}</span>
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/[0.05] px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p className="text-[12px] leading-relaxed text-white/55">
          当前数字人为离线矢量形象，用于跑通全链路；接入 HeyGen / D-ID 后，同一接口会返回真人
          口型视频，脚本与流程不变。
        </p>
      </div>

      {tab === "avatars" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {AVATARS.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <div className="relative aspect-square bg-white/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/avatars/${a.id}/image`}
                  alt={a.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-2.5 top-2.5">
                  <Badge tone="accent">{a.tag}</Badge>
                </span>
              </div>
              <div className="p-3.5">
                <p className="text-[13px] font-semibold text-white/90">{a.name}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/35">{a.note}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {VOICES.map((v) => (
            <Card key={v.id} className="flex items-center gap-4 p-4">
              <button
                onClick={() => preview(v.id)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/75 transition hover:bg-accent hover:text-ink"
                aria-label={`试听 ${v.name}`}
              >
                {playing === v.id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-semibold text-white/90">{v.name}</p>
                  <span className="text-[10px] uppercase tracking-wider text-white/25">
                    {v.locale}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11.5px] text-white/35">{v.blurb}</p>
              </div>
              <Badge>{v.gender === "female" ? "女声" : "男声"}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
