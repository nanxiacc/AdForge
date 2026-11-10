import Link from "next/link";
import { Clapperboard, ExternalLink, Play } from "lucide-react";
import { db, publicUrl } from "@/lib/db";
import type { ProjectRow, VideoRow } from "@/lib/types";
import { Badge, Card, EmptyState, LinkButton } from "@/components/ui";
import { STATUS_META, isBusy } from "@/lib/status";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = db()
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC")
    .all() as unknown as ProjectRow[];
  const videos = db()
    .prepare("SELECT * FROM videos ORDER BY created_at DESC")
    .all() as unknown as VideoRow[];

  const byProject = new Map<string, VideoRow[]>();
  for (const v of videos) {
    const list = byProject.get(v.project_id) ?? [];
    list.push(v);
    byProject.set(v.project_id, list);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-white sm:text-[28px]">
            项目
          </h1>
          <p className="mt-1 text-[13px] text-white/35">
            每个商品一个项目，所有画幅与版本都在这里。
          </p>
        </div>
        <LinkButton href="/studio/create" size="sm">
          新建视频
        </LinkButton>
      </div>

      {projects.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const list = byProject.get(p.id) ?? [];
            const latest = list[0];
            const cover = publicUrl(p.cover) ?? publicUrl(latest?.thumb ?? null);
            const meta = latest ? STATUS_META[latest.status] : null;
            return (
              <Link
                key={p.id}
                href={`/studio/projects/${p.id}`}
                className="group overflow-hidden rounded-2xl border border-line bg-surface/70 transition hover:border-white/20"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#121216]">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={p.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(100%_100%_at_20%_0%,#242040,#0c0c10)]">
                      <Clapperboard className="h-6 w-6 text-white/15" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-2">
                    {meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : null}
                    {list.length > 1 ? <Badge>{list.length} 个版本</Badge> : null}
                  </div>
                  {isBusy(latest?.status ?? "") ? (
                    <div className="absolute inset-x-3 bottom-3">
                      <div className="h-1 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${latest?.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                  <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                    <Play className="ml-0.5 h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="p-4">
                  <p className="line-clamp-1 text-[13.5px] font-semibold text-white/90">
                    {p.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-white/30">
                    {p.product_url ? (
                      <>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{p.product_url}</span>
                      </>
                    ) : (
                      "手动创建"
                    )}
                  </p>
                  <p className="mt-3 text-[10.5px] uppercase tracking-wider text-white/20">
                    {latest?.aspect ?? "—"} ·{" "}
                    {latest?.duration ? `${latest.duration.toFixed(1)}s` : "—"} ·{" "}
                    {new Date(p.updated_at).toLocaleDateString("zh-CN", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Clapperboard className="h-5 w-5" />}
          title="还没有项目"
          body="从一条商品链接开始，生成你的第一条广告。"
          action={
            <LinkButton href="/studio/create" size="sm">
              新建视频
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
