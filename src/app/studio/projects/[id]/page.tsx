import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  Film,
  AlertTriangle,
} from "lucide-react";
import { db, publicUrl } from "@/lib/db";
import type { ProjectRow, Scene, VideoRow } from "@/lib/types";
import { Badge, Card, Progress } from "@/components/ui";
import { RetryButton } from "@/components/retry-button";
import { STATUS_META, isBusy } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = db().prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | ProjectRow
    | undefined;
  if (!project) notFound();

  const videos = db()
    .prepare("SELECT * FROM videos WHERE project_id = ? ORDER BY created_at DESC")
    .all(id) as unknown as VideoRow[];

  const latest = videos[0];
  const meta = latest ? STATUS_META[latest.status] : null;
  const scenes: Scene[] = latest?.script ? JSON.parse(latest.script) : [];
  const busy = isBusy(latest?.status ?? "");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/studio/projects"
          className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-white/35 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> 全部项目
        </Link>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <h1 className="truncate text-[24px] font-bold tracking-[-0.03em] text-white sm:text-[28px]">
              {project.title}
            </h1>
            {project.product_url ? (
              <a
                href={project.product_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-1 text-[12px] text-white/30 transition hover:text-white/70"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{project.product_url}</span>
              </a>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : null}
            {latest ? (
              <Badge>
                {latest.aspect} · {latest.duration ? `${latest.duration.toFixed(1)}s` : "—"}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            {latest?.status === "done" && latest.output ? (
              <>
                <div className="bg-black/50 p-4 sm:p-6">
                  <div
                    className={`mx-auto overflow-hidden rounded-xl bg-black ${
                      latest.aspect === "9:16"
                        ? "aspect-[9/16] max-h-[560px] max-w-[300px]"
                        : latest.aspect === "1:1"
                          ? "aspect-square max-w-[440px]"
                          : "aspect-video"
                    }`}
                  >
                    <video
                      src={publicUrl(latest.output) ?? undefined}
                      poster={publicUrl(latest.thumb) ?? undefined}
                      controls
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-5 py-4">
                  <a
                    href={publicUrl(latest.output) ?? "#"}
                    download
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-[13px] font-semibold text-ink transition hover:bg-[#e4ff7a]"
                  >
                    <Download className="h-4 w-4" /> 下载 MP4
                  </a>
                  <Link
                    href={`/studio/create?url=${encodeURIComponent(project.product_url)}`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-[13px] font-medium text-white/80 transition hover:border-white/30"
                  >
                    <Film className="h-4 w-4" /> 再生成一版
                  </Link>
                  <span className="ml-auto text-[11px] text-white/25">
                    {new Date(latest.created_at).toLocaleString("zh-CN")}
                  </span>
                </div>
              </>
            ) : latest?.status === "failed" ? (
              <div className="p-8">
                <div className="flex items-center gap-2 text-rose-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-[13px] font-semibold">生成失败</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 font-mono text-[11.5px] leading-relaxed text-rose-200/80">
                  {latest.error}
                </p>
                <div className="mt-4">
                  <RetryButton videoId={latest.id} />
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex items-center gap-2 text-[13px] text-white/60">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  {latest?.stage ?? "排队中"}
                </div>
                <p className="mt-2 text-[42px] font-bold tracking-tight text-white">
                  {latest?.progress ?? 0}%
                </p>
                <Progress value={latest?.progress ?? 0} className="mt-3 h-1.5" />
                <p className="mt-4 text-[12px] text-white/30">
                  任务在后台渲染，完成后自动刷新。
                </p>
                <div className="mt-5">
                  <RetryButton videoId={latest?.id ?? ""} />
                </div>
              </div>
            )}
          </Card>

          {latest?.error && latest.status === "done" ? (
            <p className="text-[11px] text-white/30">{latest.error}</p>
          ) : null}

          {videos.length > 1 ? (
            <Card className="p-5">
              <h2 className="text-[13px] font-semibold text-white/70">历史版本</h2>
              <div className="mt-3 divide-y divide-white/[0.06]">
                {videos.map((v) => {
                  const m = STATUS_META[v.status];
                  const thumb = publicUrl(v.thumb);
                  return (
                    <div key={v.id} className="flex items-center gap-3 py-2.5">
                      <div className="h-10 w-10 overflow-hidden rounded-md bg-white/[0.05]">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-white/70">
                          {v.aspect} · {v.duration ? `${v.duration.toFixed(1)}s` : "—"}
                        </p>
                        <p className="text-[10.5px] text-white/25">
                          {new Date(v.created_at).toLocaleString("zh-CN")}
                        </p>
                      </div>
                      <Badge tone={m.tone}>{m.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/35">
              脚本分镜
            </h2>
            <div className="mt-4 space-y-3">
              {scenes.length ? (
                scenes.map((s, i) => (
                  <div key={s.id} className="rounded-xl border border-white/[0.06] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-accent/70">
                        {s.kind}
                      </span>
                      <span className="text-[10px] text-white/20">{i + 1}</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] font-semibold text-white/85">
                      {s.headline}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-white/40">
                      {s.voiceover}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-white/30">脚本生成后会显示在这里。</p>
              )}
            </div>
          </Card>

          {latest ? (
            <Card className="p-5">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/35">
                规格
              </h2>
              <dl className="mt-3 space-y-2.5 text-[12px]">
                {[
                  ["画幅", `${latest.aspect} · 1080p`],
                  ["时长", latest.duration ? `${latest.duration.toFixed(1)}s` : "—"],
                  ["语言", latest.spec ? JSON.parse(latest.spec).language : "—"],
                  ["语气", latest.spec ? JSON.parse(latest.spec).tone : "—"],
                  ["数字人", latest.spec ? JSON.parse(latest.spec).avatarName ?? "不出镜" : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-white/30">{k}</dt>
                    <dd className="text-white/70">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-accent">
                <Check className="h-3.5 w-3.5" />
                无水印 · 可商用
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
