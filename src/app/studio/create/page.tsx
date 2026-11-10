"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  FileText,
  Link2,
  Loader2,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { AVATARS } from "@/lib/avatars";
import { VOICES } from "@/lib/voices";
import {
  ASPECTS,
  TONES,
  type Aspect,
  type Language,
  type ProductInfo,
  type PublicVideo,
  type Tone,
} from "@/lib/types";
import { Badge, Button, Card, Input, Label, LinkButton, Progress, Spinner, Textarea, cn } from "@/components/ui";

const COST = 12;

const STATUS_STEPS = [
  { key: "analyzing", label: "解析商品素材", at: 6 },
  { key: "scripting", label: "生成广告脚本", at: 16 },
  { key: "voicing", label: "合成配音", at: 28 },
  { key: "assembling", label: "排版画面与字幕", at: 62 },
  { key: "rendering", label: "渲染成片", at: 80 },
];

const EXAMPLES = [
  "https://www.allbirds.com/products/mens-wool-runners",
  "https://www.glossier.com/products/milky-jelly-cleanser",
];

function Section({
  index,
  title,
  desc,
  children,
  right,
}: {
  index: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] text-accent/70">{index}</span>
            <h2 className="text-[15px] font-semibold text-white">{title}</h2>
          </div>
          {desc ? <p className="mt-1 text-[12px] text-white/35">{desc}</p> : null}
        </div>
        {right}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function Pill({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-[12.5px] font-medium transition",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-line bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/80",
        className,
      )}
    >
      {children}
    </button>
  );
}

function CreateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialUrl = params.get("url") ?? "";

  const [phase, setPhase] = useState<"compose" | "running" | "done">("compose");
  const [url, setUrl] = useState(initialUrl);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tone, setTone] = useState<Tone>("energetic");
  const [language, setLanguage] = useState<Language>("en");
  const [voiceId, setVoiceId] = useState("samantha");
  const [avatarId, setAvatarId] = useState<string | null>("ava");
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [duration, setDuration] = useState(30);
  const [music, setMusic] = useState(true);

  const [videoId, setVideoId] = useState<string | null>(null);
  const [video, setVideo] = useState<PublicVideo | null>(null);
  const [creating, setCreating] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const autoAnalyzed = useRef(false);

  const analyze = useCallback(async (target?: string) => {
    const value = (target ?? url).trim();
    if (!value) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "解析失败");
      setProduct(data.product as ProductInfo);
      setUrl(data.product.url ?? value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败");
    } finally {
      setAnalyzing(false);
    }
  }, [url]);

  useEffect(() => {
    if (initialUrl && !autoAnalyzed.current) {
      autoAnalyzed.current = true;
      void analyze(initialUrl);
    }
  }, [initialUrl, analyze]);

  // Live progress via SSE with polling fallback.
  useEffect(() => {
    if (phase !== "running" || !videoId) return;
    let closed = false;
    const es = new EventSource(`/api/videos/${videoId}/events`);
    es.onmessage = (e) => {
      try {
        const next = JSON.parse(e.data) as PublicVideo;
        setVideo(next);
        if (next.status === "done") {
          setPhase("done");
          es.close();
        }
        if (next.status === "failed") {
          setError(next.error ?? "生成失败");
          setPhase("compose");
          es.close();
        }
      } catch {
        /* ignore malformed frames */
      }
    };
    es.onerror = () => {
      if (closed) return;
      es.close();
    };

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`);
        const next = (await res.json()) as PublicVideo;
        if (!res.ok) return;
        setVideo(next);
        if (next.status === "done") {
          setPhase("done");
          clearInterval(poll);
        }
        if (next.status === "failed") {
          setError(next.error ?? "生成失败");
          setPhase("compose");
          clearInterval(poll);
        }
      } catch {
        /* network hiccup */
      }
    }, 2500);

    return () => {
      closed = true;
      es.close();
      clearInterval(poll);
    };
  }, [phase, videoId]);

  const voices = useMemo(() => {
    const same = VOICES.filter((v) => v.lang === language);
    return [...same, ...VOICES.filter((v) => v.lang !== language)];
  }, [language]);

  function switchLanguage(next: Language) {
    setLanguage(next);
    if (next === "zh") setVoiceId("tingting");
    else if (!VOICES.find((v) => v.id === voiceId)?.lang.startsWith("en")) setVoiceId("samantha");
  }

  async function previewVoice(id: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingVoice === id) {
      setPlayingVoice(null);
      return;
    }
    const audio = new Audio(`/api/voices/${id}/preview`);
    audioRef.current = audio;
    setPlayingVoice(id);
    audio.onended = () => setPlayingVoice(null);
    audio.onerror = () => setPlayingVoice(null);
    try {
      await audio.play();
    } catch {
      setPlayingVoice(null);
    }
  }

  async function generate() {
    if (!product?.title) {
      setError("请先解析链接或手动填写商品信息");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          voiceId,
          avatarId,
          aspect,
          tone,
          language,
          music,
          duration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "创建失败");
      setVideoId(data.videoId);
      setVideo(null);
      setPhase("running");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  function reset() {
    setPhase("compose");
    setVideo(null);
    setVideoId(null);
    setError(null);
  }

  const currentStep = video
    ? STATUS_STEPS.findIndex((s) => s.key === video.status)
    : -1;

  const avatar = AVATARS.find((a) => a.id === avatarId);
  const voice = VOICES.find((v) => v.id === voiceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/studio")}
            className="mb-2 flex items-center gap-1.5 text-[12px] text-white/35 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 工作台
          </button>
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-white sm:text-[28px]">
            新建视频
          </h1>
          <p className="mt-1 text-[13px] text-white/35">
            一条链接，六段脚本，一条 1080p 广告。
          </p>
        </div>
        <div className="hidden items-center gap-1.5 text-[11px] text-white/30 sm:flex">
          {["商品", "创意", "生成"].map((s, i) => (
            <span key={s} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRight className="h-3 w-3" /> : null}
              <span
                className={cn(
                  i === 0 && phase === "compose" && "text-white",
                  i === 1 && phase === "compose" && product && "text-white",
                  i === 2 && phase !== "compose" && "text-white",
                )}
              >
                {s}
              </span>
            </span>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-[12.5px] text-rose-200">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-200/60 hover:text-rose-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {phase === "running" ? (
        <RunningView video={video} stepIndex={currentStep} />
      ) : phase === "done" && video ? (
        <ResultView video={video} onReset={reset} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Section
              index="01"
              title="商品"
              desc="粘贴链接自动抓取，也可以手动填写。"
              right={
                product ? (
                  <button
                    onClick={() => void analyze()}
                    className="flex items-center gap-1 text-[11px] text-white/35 transition hover:text-white"
                  >
                    <RefreshCw className="h-3 w-3" /> 重新解析
                  </button>
                ) : null
              }
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void analyze();
                    }}
                    placeholder="https://your-store.com/products/..."
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => void analyze()} disabled={analyzing || !url.trim()}>
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {analyzing ? "解析中" : "解析链接"}
                </Button>
              </div>

              {!product ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-white/30">
                  <span>试试：</span>
                  {EXAMPLES.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setUrl(e);
                        void analyze(e);
                      }}
                      className="max-w-full truncate rounded-md border border-white/10 px-2 py-1 transition hover:border-white/25 hover:text-white/70"
                    >
                      {e.replace("https://", "")}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setProduct({
                        url: "",
                        title: "",
                        description: "",
                        images: [],
                      })
                    }
                    className="ml-auto text-white/50 underline decoration-white/20 underline-offset-2 transition hover:text-white"
                  >
                    手动填写
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {product.images.length ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {product.images.slice(0, 6).map((src, i) => (
                        <div
                          key={src + i}
                          className={cn(
                            "h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white/[0.03]",
                            product.images[i] === src ? "border-accent/60" : "border-line",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget.parentElement as HTMLElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                    <div>
                      <Label>商品标题</Label>
                      <Input
                        value={product.title}
                        onChange={(e) =>
                          setProduct({ ...product, title: e.target.value })
                        }
                        placeholder="例如：Merino Wool Runners"
                      />
                    </div>
                    <div>
                      <Label>价格</Label>
                      <Input
                        value={product.price ?? ""}
                        onChange={(e) =>
                          setProduct({ ...product, price: e.target.value })
                        }
                        placeholder="$98"
                      />
                    </div>
                  </div>
                  <div>
                    <Label hint={`${product.description.length}/1200`}>
                      卖点描述
                    </Label>
                    <Textarea
                      rows={3}
                      value={product.description}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          description: e.target.value.slice(0, 1200),
                        })
                      }
                      placeholder="材质、使用场景、差异化卖点…"
                    />
                  </div>
                </div>
              )}
            </Section>

            <Section index="02" title="创意方向" desc="决定脚本语气与节奏。">
              <div className="grid gap-4">
                <div>
                  <Label>语气</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TONES.map((t) => (
                      <Pill
                        key={t.id}
                        active={tone === t.id}
                        onClick={() => setTone(t.id)}
                        className="text-left"
                      >
                        <span className="block font-semibold">{t.label}</span>
                        <span className="mt-0.5 block text-[10.5px] opacity-60">
                          {t.hint}
                        </span>
                      </Pill>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>语言</Label>
                    <div className="flex gap-2">
                      <Pill active={language === "en"} onClick={() => switchLanguage("en")}>
                        English
                      </Pill>
                      <Pill active={language === "zh"} onClick={() => switchLanguage("zh")}>
                        中文
                      </Pill>
                    </div>
                  </div>
                  <div>
                    <Label>目标时长</Label>
                    <div className="flex gap-2">
                      {[20, 30, 45].map((d) => (
                        <Pill key={d} active={duration === d} onClick={() => setDuration(d)}>
                          {d}s
                        </Pill>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMusic((m) => !m)}
                  className="flex items-center justify-between rounded-xl border border-line bg-white/[0.02] px-3.5 py-3 text-left transition hover:border-white/20"
                >
                  <span className="flex items-center gap-2.5 text-[13px] text-white/70">
                    <Music2 className="h-4 w-4 text-white/35" />
                    背景配乐
                    <span className="text-[11px] text-white/25">离线合成，自动压低音量</span>
                  </span>
                  <span
                    className={cn(
                      "relative h-5 w-9 rounded-full transition",
                      music ? "bg-accent" : "bg-white/15",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-ink transition",
                        music ? "left-[18px]" : "left-0.5",
                      )}
                    />
                  </span>
                </button>
              </div>
            </Section>

            <Section
              index="03"
              title="出镜与声音"
              desc="不接真人视频时，数字人形象会以画中画出现。"
              right={
                <button
                  onClick={() => setAvatarId(null)}
                  className={cn(
                    "rounded-lg border px-2 py-1 text-[11px] transition",
                    avatarId === null
                      ? "border-accent text-accent"
                      : "border-line text-white/35 hover:text-white/70",
                  )}
                >
                  不出镜
                </button>
              }
            >
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                {AVATARS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAvatarId(a.id)}
                    className={cn(
                      "group w-[104px] shrink-0 overflow-hidden rounded-xl border text-left transition",
                      avatarId === a.id
                        ? "border-accent ring-1 ring-accent/40"
                        : "border-line hover:border-white/25",
                    )}
                  >
                    <div className="aspect-square overflow-hidden bg-white/[0.04]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/avatars/${a.id}/image`}
                        alt={a.name}
                        className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="truncate text-[11.5px] font-semibold text-white/85">
                        {a.name}
                      </p>
                      <p className="truncate text-[9.5px] text-white/30">{a.tag}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {voices.slice(0, 6).map((v) => (
                  <div
                    key={v.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                      voiceId === v.id
                        ? "border-accent/70 bg-accent/[0.06]"
                        : "border-line bg-white/[0.02] hover:border-white/20",
                    )}
                  >
                    <button
                      onClick={() => void previewVoice(v.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition hover:bg-accent hover:text-ink"
                      aria-label={`试听 ${v.name}`}
                    >
                      {playingVoice === v.id ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="ml-0.5 h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setVoiceId(v.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="flex items-center gap-2 text-[12.5px] font-medium text-white/85">
                        {v.name}
                        <span className="text-[10px] uppercase text-white/25">
                          {v.locale}
                        </span>
                      </p>
                      <p className="truncate text-[10.5px] text-white/30">{v.blurb}</p>
                    </button>
                    {voiceId === v.id ? (
                      <Check className="h-4 w-4 shrink-0 text-accent" />
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-white/25">
                共 {voices.length} 个声音可用 · 试听会即时合成
              </p>
            </Section>

            <Section index="04" title="画幅" desc="同一脚本可按不同画幅重新渲染。">
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(ASPECTS) as Aspect[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3 transition",
                      aspect === a
                        ? "border-accent bg-accent/[0.06]"
                        : "border-line hover:border-white/20",
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-[3px] border",
                        aspect === a ? "border-accent/70 bg-accent/20" : "border-white/20",
                        a === "9:16" ? "h-10 w-6" : a === "1:1" ? "h-8 w-8" : "h-6 w-11",
                      )}
                    />
                    <span className="text-[11.5px] text-white/60">{ASPECTS[a].label}</span>
                  </button>
                ))}
              </div>
            </Section>
          </div>

          {/* summary rail */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <span className="text-[12px] font-semibold text-white/70">预览</span>
                <Badge>9:16 → MP4</Badge>
              </div>
              <div className="p-4">
                <div
                  className={cn(
                    "relative mx-auto overflow-hidden rounded-xl bg-[radial-gradient(120%_90%_at_20%_10%,#2b2350_0%,#14121c_55%,#0a0a0c_100%)]",
                    aspect === "9:16"
                      ? "aspect-[9/16] max-w-[190px]"
                      : aspect === "1:1"
                        ? "aspect-square max-w-[230px]"
                        : "aspect-video",
                  )}
                >
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <span className="mb-2 w-fit rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink">
                      {TONES.find((t) => t.id === tone)?.label}
                    </span>
                    <p className="text-[20px] font-extrabold uppercase leading-[0.98] tracking-[-0.02em] text-white">
                      {product?.title
                        ? product.title.slice(0, 26)
                        : "YOUR PRODUCT, ON SCREEN"}
                    </p>
                    <p className="mt-2 text-[10px] text-white/45">
                      {voice?.name} · {avatar ? avatar.name : "无出镜"} · {duration}s
                    </p>
                  </div>
                  {avatar ? (
                    <div className="absolute right-3 top-3 h-12 w-12 overflow-hidden rounded-full ring-2 ring-accent/70">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/avatars/${avatar.id}/image`}
                        alt={avatar.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2 border-t border-white/[0.06] px-4 py-4 text-[12px]">
                <Row k="商品" v={product?.title || "待解析"} />
                <Row k="声音" v={`${voice?.name ?? "—"} · ${voice?.locale ?? ""}`} />
                <Row k="数字人" v={avatar?.name ?? "不出镜"} />
                <Row k="画幅" v={`${aspect} · 1080p`} />
                <Row k="字幕" v="词级对齐" />
                <Row k="配乐" v={music ? "已开启" : "关闭"} />
              </div>

              <div className="border-t border-white/[0.06] p-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-[12px] text-white/40">本次消耗</span>
                  <span className="text-[16px] font-semibold text-white">
                    {COST}
                    <span className="ml-1 text-[11px] font-normal text-white/30">积分</span>
                  </span>
                </div>
                <Button
                  className="w-full"
                  size="md"
                  onClick={() => void generate()}
                  disabled={creating || !product?.title}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {creating ? "创建中" : "生成视频"}
                </Button>
                <p className="mt-2.5 text-center text-[10.5px] text-white/25">
                  预计 3–5 分钟 · 可随时离开，任务在后台继续
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-white/30">{k}</span>
      <span className="truncate text-right text-white/70">{v}</span>
    </div>
  );
}

function RunningView({
  video,
  stepIndex,
}: {
  video: PublicVideo | null;
  stepIndex: number;
}) {
  const progress = video?.progress ?? 2;
  const stage = video?.stage ?? "排队中";
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-2 text-[12px] text-accent">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          流水线运行中
        </div>
        <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] text-white">
          {stage}
        </h2>
        <p className="mt-1 text-[13px] text-white/35">
          渲染在后台进行，关闭页面也不会中断。
        </p>

        <div className="mt-6 flex items-end justify-between">
          <span className="text-[42px] font-bold leading-none tracking-tight text-white">
            {Math.round(progress)}
            <span className="ml-1 text-[16px] font-normal text-white/30">%</span>
          </span>
          <span className="text-[11px] text-white/30">
            {video ? `约 ${Math.max(1, Math.ceil((100 - progress) / 18))} 分钟剩余` : "连接中…"}
          </span>
        </div>
        <Progress value={progress} className="mt-4 h-2" />

        <div className="mt-8 space-y-3">
          {STATUS_STEPS.map((s, i) => {
            const done = stepIndex > i || progress >= 100;
            const active = stepIndex === i;
            return (
              <div
                key={s.key}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition",
                  active
                    ? "border-accent/30 bg-accent/[0.05]"
                    : "border-white/[0.06] bg-white/[0.01]",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    done
                      ? "bg-accent text-ink"
                      : active
                        ? "bg-accent/15 text-accent"
                        : "bg-white/[0.05] text-white/25",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[13px]",
                    active ? "text-white" : done ? "text-white/55" : "text-white/30",
                  )}
                >
                  {s.label}
                </span>
                {active ? <Spinner className="ml-auto h-3.5 w-3.5" /> : null}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-white/60">
          <FileText className="h-4 w-4 text-white/30" />
          脚本分镜
        </div>
        <div className="mt-4 space-y-3">
          {video?.script?.length ? (
            video.script.map((s) => (
              <div key={s.id} className="rounded-xl border border-white/[0.06] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-accent/70">
                    {s.kind}
                  </span>
                  <span className="text-[10px] text-white/20">{s.id}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] font-medium text-white/85">
                  {s.headline}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-white/40">
                  {s.voiceover}
                </p>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="shimmer h-16 rounded-xl" />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ResultView({
  video,
  onReset,
}: {
  video: PublicVideo;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge tone="success">
                <Check className="h-3 w-3" /> 已完成
              </Badge>
              <h2 className="mt-2 text-[17px] font-semibold text-white">
                {video.spec.product.title}
              </h2>
            </div>
            <span className="text-[11px] text-white/30">
              {video.aspect} · {video.duration ? `${video.duration.toFixed(1)}s` : ""}
            </span>
          </div>
        </div>
        <div className="bg-black/40 p-4 sm:p-6">
          <div
            className={cn(
              "mx-auto max-h-[560px] overflow-hidden rounded-xl bg-black",
              video.aspect === "9:16"
                ? "aspect-[9/16] max-w-[300px]"
                : video.aspect === "1:1"
                  ? "aspect-square max-w-[420px]"
                  : "aspect-video",
            )}
          >
            {video.outputUrl ? (
              <video
                key={video.outputUrl}
                src={video.outputUrl}
                poster={video.thumbUrl ?? undefined}
                controls
                playsInline
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-5 py-4">
          <a
            href={video.outputUrl ?? "#"}
            download
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-[13px] font-semibold text-ink transition hover:bg-[#e4ff7a]"
          >
            <Download className="h-4 w-4" /> 下载 MP4
          </a>
          <Button variant="outline" size="md" onClick={onReset}>
            <RefreshCw className="h-4 w-4" /> 再做一条
          </Button>
          <LinkButton
            href={`/studio/projects/${video.project_id}`}
            variant="ghost"
            size="md"
            className="ml-auto"
          >
            查看项目 <ChevronRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white/60">
            <FileText className="h-4 w-4 text-white/30" />
            脚本与分镜
          </div>
          <div className="mt-4 space-y-3">
            {video.script?.map((s, i) => (
              <div key={s.id} className="rounded-xl border border-white/[0.06] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-accent/70">
                    {s.kind}
                  </span>
                  <span className="text-[10px] text-white/20">{i + 1}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] font-medium text-white/85">
                  {s.headline}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-white/40">
                  {s.voiceover}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-white/30">
          <Spinner />
        </div>
      }
    >
      <CreateInner />
    </Suspense>
  );
}
