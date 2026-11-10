import Link from "next/link";
import { ArrowUpRight, Clapperboard, Coins, Layers, Sparkles } from "lucide-react";
import { db, getProfile, publicUrl } from "@/lib/db";
import type { ProjectRow, VideoRow } from "@/lib/types";
import { Badge, Card, EmptyState, LinkButton, Progress } from "@/components/ui";
import { UrlCta } from "@/components/url-cta";
import { STATUS_META, isBusy } from "@/lib/status";

export const dynamic = "force-dynamic";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const profile = getProfile();
  const stats = db()
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS done,
              SUM(CASE WHEN status IN ('queued','analyzing','scripting','voicing','assembling','rendering') THEN 1 ELSE 0 END) AS active
       FROM videos`,
    )
    .get() as { total: number; done: number; active: number };

  const projects = db()
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC LIMIT 6")
    .all() as unknown as ProjectRow[];

  const videos = db()
    .prepare(
      `SELECT v.*, p.title AS project_title FROM videos v
       JOIN projects p ON p.id = v.project_id
       ORDER BY v.created_at DESC LIMIT 8`,
    )
    .all() as unknown as (VideoRow & { project_title: string })[];

  const hour = new Date().getHours();
  const greeting = hour < 6 ? "夜深了" : hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/30">
            {greeting} · {profile.plan}
          </p>
          <h1 className="mt-2 text-[26px] font-bold tracking-[-0.03em] text-white sm:text-[32px]">
            把今天的产品，变成明天的广告。
          </h1>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-white/30">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          流水线在线 · 本地渲染
        </div>
      </div>

      <Card className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="accent">
              <Sparkles className="h-3 w-3" />
              URL → 成片
            </Badge>
            <h2 className="mt-3 text-[18px] font-semibold text-white">
              粘贴商品链接，开始一条新广告
            </h2>
            <p className="mt-1 text-[13px] text-white/40">
              自动抓取标题、卖点、价格与主图，生成 6 段式脚本并渲染成片。
            </p>
          </div>
          <div className="w-full lg:max-w-xl">
            <UrlCta size="md" />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "剩余积分",
            value: profile.credits,
            hint: "每条视频消耗 12",
            icon: Coins,
          },
          {
            label: "已生成视频",
            value: stats.total ?? 0,
            hint: `${stats.done ?? 0} 条完成`,
            icon: Clapperboard,
          },
          {
            label: "进行中",
            value: stats.active ?? 0,
            hint: stats.active ? "渲染队列运行中" : "当前空闲",
            icon: Layers,
          },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <span className="text-[12px] text-white/40">{s.label}</span>
              <s.icon className="h-4 w-4 text-white/20" />
            </div>
            <p className="mt-3 text-[30px] font-bold tracking-tight text-white">
              {s.value}
            </p>
            <p className="mt-1 text-[11px] text-white/30">{s.hint}</p>
          </Card>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-white">最近生成</h2>
          <Link
            href="/studio/projects"
            className="flex items-center gap-1 text-[12px] text-white/40 transition hover:text-white"
          >
            全部项目 <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {videos.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {videos.map((v) => {
              const meta = STATUS_META[v.status] ?? STATUS_META.queued;
              const cover = publicUrl(v.thumb);
              return (
                <Link
                  key={v.id}
                  href={`/studio/projects/${v.project_id}`}
                  className="group overflow-hidden rounded-2xl border border-line bg-surface/70 transition hover:border-white/20"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#121216]">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={v.project_title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-[11px] text-white/20">
                          {isBusy(v.status) ? "生成中…" : "无预览"}
                        </span>
                      </div>
                    )}
                    <div className="absolute left-2.5 top-2.5">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    {isBusy(v.status) ? (
                      <div className="absolute inset-x-3 bottom-3">
                        <Progress value={v.progress} />
                      </div>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-[12.5px] font-medium text-white/85">
                      {v.project_title}
                    </p>
                    <p className="mt-1 text-[10.5px] uppercase tracking-wider text-white/30">
                      {v.aspect} · {v.duration ? `${v.duration.toFixed(1)}s` : "—"} ·{" "}
                      {fmtDate(v.created_at)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Clapperboard className="h-5 w-5" />}
            title="还没有成片"
            body="粘贴一个商品链接，四分钟后这里会出现你的第一条广告。"
            action={
              <LinkButton href="/studio/create" size="sm">
                新建视频
              </LinkButton>
            }
          />
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-white">项目</h2>
          <Link
            href="/studio/projects"
            className="flex items-center gap-1 text-[12px] text-white/40 transition hover:text-white"
          >
            查看全部 <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {projects.length ? (
          <Card className="divide-y divide-white/[0.06] overflow-hidden">
            {projects.map((p) => {
              const cover = publicUrl(p.cover);
              return (
                <Link
                  key={p.id}
                  href={`/studio/projects/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
                >
                  <div className="h-10 w-10 overflow-hidden rounded-lg bg-white/[0.05]">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white/85">
                      {p.title}
                    </p>
                    <p className="truncate text-[11px] text-white/30">
                      {p.product_url || "手动创建"}
                    </p>
                  </div>
                  <span className="text-[11px] text-white/25">
                    {fmtDate(p.updated_at)}
                  </span>
                </Link>
              );
            })}
          </Card>
        ) : (
          <EmptyState
            icon={<Layers className="h-5 w-5" />}
            title="项目会出现在这里"
            body="每条视频都属于一个项目，方便按商品复盘与二次修改。"
          />
        )}
      </section>
    </div>
  );
}
