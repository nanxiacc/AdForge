import { Check, Coins, Sparkles } from "lucide-react";
import { db, getProfile } from "@/lib/db";
import type { VideoRow } from "@/lib/types";
import { Badge, Card, LinkButton, Progress } from "@/components/ui";
import { STATUS_META } from "@/lib/status";

export const dynamic = "force-dynamic";

const plans = [
  {
    name: "Starter",
    price: "¥0",
    credits: 120,
    features: ["120 积分", "约 10 条视频", "全部声音与画幅", "1080p 无水印"],
  },
  {
    name: "Studio",
    price: "¥199",
    credits: 600,
    features: ["600 积分 / 月", "约 50 条视频", "品牌库 + 批量", "优先生成队列"],
    highlight: true,
  },
  {
    name: "Scale",
    price: "定制",
    credits: 0,
    features: ["开放 API", "自定义数字人", "私有化渲染", "专属支持"],
  },
];

export default function BillingPage() {
  const profile = getProfile();
  const used = db()
    .prepare("SELECT COUNT(*) AS n FROM videos")
    .get() as { n: number };
  const rows = db()
    .prepare(
      `SELECT v.*, p.title AS project_title FROM videos v
       JOIN projects p ON p.id = v.project_id
       ORDER BY v.created_at DESC LIMIT 12`,
    )
    .all() as unknown as (VideoRow & { project_title: string })[];

  const totalCredits = 120 + Math.max(0, 0);
  const usedCredits = (used.n ?? 0) * 12;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[24px] font-bold tracking-[-0.03em] text-white sm:text-[28px]">
          积分与计费
        </h1>
        <p className="mt-1 text-[13px] text-white/35">
          每条视频 12 积分，包含脚本、配音、字幕与 1080p 渲染。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/40">剩余积分</span>
            <Coins className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-3 text-[32px] font-bold tracking-tight text-white">
            {profile.credits}
          </p>
          <Progress
            value={(profile.credits / (profile.credits + usedCredits || 1)) * 100}
            className="mt-3"
          />
          <p className="mt-2 text-[11px] text-white/25">
            已消耗 {usedCredits} · 共 {profile.credits + usedCredits}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/40">本月生成</span>
            <Sparkles className="h-4 w-4 text-white/25" />
          </div>
          <p className="mt-3 text-[32px] font-bold tracking-tight text-white">
            {used.n ?? 0}
          </p>
          <p className="mt-2 text-[11px] text-white/25">条视频 · 均按成功出片计</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/40">当前套餐</span>
            <Badge tone="accent">{profile.plan}</Badge>
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-tight text-white">
            {profile.plan === "Studio" ? "Studio" : profile.plan}
          </p>
          <p className="mt-2 text-[11px] text-white/25">
            续费日期：下月 1 日 · 可随时升级
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <Card
            key={p.name}
            className={
              p.highlight
                ? "relative border-accent/40 bg-accent/[0.05] p-6"
                : "p-6"
            }
          >
            {p.highlight ? (
              <span className="absolute right-5 top-5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-ink">
                推荐
              </span>
            ) : null}
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/40">
              {p.name}
            </p>
            <p className="mt-3 text-[30px] font-bold tracking-tight text-white">
              {p.price}
            </p>
            <p className="mt-1 text-[11px] text-white/30">
              {p.credits ? `${p.credits} 积分` : "按需报价"}
            </p>
            <ul className="mt-5 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[12.5px] text-white/60">
                  <Check className="h-3.5 w-3.5 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <LinkButton
              href={p.name === "Scale" ? "/studio" : "/studio/create"}
              variant={p.highlight ? "primary" : "outline"}
              size="sm"
              className="mt-6 w-full"
            >
              {p.name === "Scale" ? "联系我们" : p.name === "Starter" ? "继续创作" : "升级套餐"}
            </LinkButton>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-3.5 text-[12px] font-semibold text-white/60">
          最近消耗
        </div>
        {rows.length ? (
          <div className="divide-y divide-white/[0.06]">
            {rows.map((r) => {
              const meta = STATUS_META[r.status];
              return (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] text-white/75">
                      {r.project_title}
                    </p>
                    <p className="text-[10.5px] text-white/25">
                      {new Date(r.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <span className="w-16 text-right text-[12px] text-white/40">
                    {r.status === "done" ? "-12" : "0"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-[12px] text-white/25">
            还没有消耗记录。
          </p>
        )}
      </Card>
    </div>
  );
}
