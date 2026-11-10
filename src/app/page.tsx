import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Boxes,
  Check,
  Clapperboard,
  Download,
  Globe2,
  Layers,
  Mic2,
  Play,
  ScanLine,
  Sparkles,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UrlCta } from "@/components/url-cta";
import { Badge, LinkButton } from "@/components/ui";
import { getShowcase } from "@/lib/showcase";

export const dynamic = "force-dynamic";

const steps = [
  {
    n: "01",
    title: "粘贴链接",
    body: "输入商品页、独立站或 App Store 链接，自动识别标题、卖点、价格与主图。",
    icon: ScanLine,
  },
  {
    n: "02",
    title: "生成脚本",
    body: "按钩子、痛点、卖点、收益、行动五段式写出可直接口播的广告脚本。",
    icon: Wand2,
  },
  {
    n: "03",
    title: "配音出镜",
    body: "选择声音与数字人，逐句合成配音，自动对齐字幕与画面节奏。",
    icon: AudioLines,
  },
  {
    n: "04",
    title: "导出成片",
    body: "FFmpeg 合成 1080p 竖版 / 方形 / 横版，直接下载投放。",
    icon: Download,
  },
];

const features = [
  {
    title: "URL → 成片",
    body: "一条链接跑完整条产线，不用写 prompt，也不用剪辑。",
    icon: Zap,
  },
  {
    title: "五段式广告脚本",
    body: "钩子、痛点、卖点、收益、行动。可接大模型，也可零密钥用内置模板。",
    icon: Wand2,
  },
  {
    title: "9 种声音",
    body: "英音、美音、澳音、普通话、台湾腔、粤语，逐句合成并生成词级时间轴。",
    icon: Mic2,
  },
  {
    title: "数字人出镜",
    body: "内置 8 位创作者形象，支持画中画与全屏口播；可切换 HeyGen 等真人视频。",
    icon: Users,
  },
  {
    title: "品牌一致性",
    body: "品牌色、Logo、CTA 文案进入每一帧，批量出片也不跑偏。",
    icon: Layers,
  },
  {
    title: "多规格批量",
    body: "同一脚本一次渲染 9:16 / 1:1 / 16:9，适配 TikTok、Reels、Shorts。",
    icon: Boxes,
  },
];

const pricing = [
  {
    name: "Starter",
    price: "¥0",
    unit: "/ 永久",
    body: "先跑通一条完整广告",
    features: ["120 积分", "10 条视频", "9 种声音", "1080p 导出"],
    cta: "免费开始",
    href: "/studio",
    highlight: false,
  },
  {
    name: "Studio",
    price: "¥199",
    unit: "/ 月",
    body: "给持续投放的团队",
    features: ["600 积分 / 月", "50 条视频", "品牌库 + 批量渲染", "优先生成队列"],
    cta: "进入工作台",
    href: "/studio",
    highlight: true,
  },
  {
    name: "Scale",
    price: "定制",
    unit: "",
    body: "API 与私有化部署",
    features: ["开放 API", "自定义数字人", "私有化渲染", "专属支持"],
    cta: "联系我们",
    href: "/studio/billing",
    highlight: false,
  },
];

function PhonePreview({
  videoUrl,
  thumbUrl,
}: {
  videoUrl: string | null;
  thumbUrl: string | null;
}) {
  return (
    <div className="relative mx-auto w-[286px] sm:w-[318px]">
      <div className="absolute -inset-10 -z-10 rounded-full bg-accent/12 blur-3xl" />
      <div className="relative aspect-[9/16] overflow-hidden rounded-[2.6rem] border-[9px] border-[#1b1b20] bg-[#0c0c0f] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={thumbUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(120%_90%_at_20%_10%,#3a2d6b_0%,#15131f_55%,#08080a_100%)]">
            <div className="absolute inset-x-6 top-16">
              <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                new drop
              </span>
              <p className="mt-3 text-[34px] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-white">
                Stop
                <br />
                scrolling
              </p>
              <p className="mt-3 max-w-[180px] text-[12px] leading-snug text-white/60">
                你的商品，值得一条能打的竖版广告。
              </p>
            </div>
            <div className="absolute inset-x-6 bottom-16 rounded-xl bg-black/55 px-3 py-2 text-center text-[12px] font-bold uppercase tracking-wide text-white">
              这条视频由 AdForge 生成
            </div>
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
          </div>
        )}
        {videoUrl ? null : (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3 text-[10px] font-semibold text-white/70">
            <span>9:41</span>
            <span className="h-1 w-12 rounded-full bg-white/25" />
            <span>5G</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <span className="h-1 w-24 rounded-full bg-white/40" />
        </div>
      </div>

      {videoUrl ? null : (
        <>
          <div className="absolute -left-10 top-24 hidden rounded-xl border border-line bg-surface/95 px-3 py-2 text-[11px] shadow-xl backdrop-blur sm:block">
            <span className="flex items-center gap-1.5 text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              脚本 · 6 场
            </span>
          </div>
          <div className="absolute -right-10 top-1/2 hidden rounded-xl border border-line bg-surface/95 px-3 py-2 text-[11px] shadow-xl backdrop-blur sm:block">
            <span className="flex items-center gap-1.5 text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              配音 · 已完成
            </span>
          </div>
          <div className="absolute -right-6 bottom-24 hidden rounded-xl border border-line bg-surface/95 px-3 py-2 text-[11px] shadow-xl backdrop-blur sm:block">
            <span className="flex items-center gap-1.5 text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              1080p · 导出
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function LandingPage() {
  const showcase = getShowcase(3);
  const hero = showcase[0];

  return (
    <div className="relative overflow-clip">
      {/* nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-[13px] text-white/55 md:flex">
            <a href="#workflow" className="transition hover:text-white">
              工作流
            </a>
            <a href="#features" className="transition hover:text-white">
              能力
            </a>
            <a href="#showcase" className="transition hover:text-white">
              成片
            </a>
            <a href="#pricing" className="transition hover:text-white">
              定价
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/studio"
              className="hidden text-[13px] font-medium text-white/65 transition hover:text-white sm:block"
            >
              登录
            </Link>
            <LinkButton href="/studio" size="sm" className="px-4">
              开始创作
            </LinkButton>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_30%,transparent_75%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(216,255,79,0.14),transparent)] blur-2xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pb-28 lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/60">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              URL → 成片 · 全自动 · 本地可跑
            </div>

            <h1 className="mt-6 text-[44px] font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-[62px] lg:text-[72px]">
              把一条商品链接，
              <br />
              变成<span className="text-accent">能投的广告</span>。
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/50 sm:text-[16px]">
              AdForge 自动抓取商品页、写五段式脚本、合成配音与字幕、渲染 1080p
              竖版成片。你只需要一个链接，剩下的交给流水线。
            </p>

            <div className="mt-8 max-w-xl">
              <UrlCta />
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-white/35">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-accent" />
                  无需 API Key
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-accent" />
                  9:16 / 1:1 / 16:9
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-accent" />
                  约 4 分钟出片
                </span>
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              {[
                { k: "1080p", v: "竖版成片" },
                { k: "9", v: "内置声音" },
                { k: "8", v: "数字人形象" },
                { k: "0", v: "必需密钥" },
              ].map((s) => (
                <div key={s.v} className="flex items-baseline gap-2">
                  <span className="text-[22px] font-bold tracking-tight text-white">
                    {s.k}
                  </span>
                  <span className="text-[12px] text-white/35">{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="animate-floaty">
              <PhonePreview
                videoUrl={hero?.videoUrl ?? null}
                thumbUrl={hero?.thumbUrl ?? null}
              />
            </div>
            {hero ? (
              <Link
                href={`/studio/projects`}
                className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-[12px] text-white/40 transition hover:text-white"
              >
                <Play className="h-3.5 w-3.5" />
                {hero.title.slice(0, 30)} · 看真实成片
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* marquee */}
      <section className="border-y border-white/[0.06] bg-white/[0.02] py-5">
        <div className="relative overflow-hidden">
          <div className="flex w-max animate-marquee gap-12 pr-12 text-[12px] uppercase tracking-[0.2em] text-white/25">
            {[
              "DTC 品牌",
              "跨境独立站",
              "TikTok Shop",
              "应用推广",
              "代理商批量出片",
              "本地生活",
              "课程与 SaaS",
              "DTC 品牌",
              "跨境独立站",
              "TikTok Shop",
              "应用推广",
              "代理商批量出片",
              "本地生活",
              "课程与 SaaS",
            ].map((t, i) => (
              <span key={i} className="flex items-center gap-3 whitespace-nowrap">
                <span className="h-1 w-1 rounded-full bg-accent/50" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* workflow */}
      <section id="workflow" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Badge tone="accent">工作流</Badge>
            <h2 className="mt-4 max-w-xl text-[32px] font-bold leading-tight tracking-[-0.03em] text-white sm:text-[44px]">
              一条链接，四步成片。
            </h2>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-white/40">
            每一步都有进度与中间产物可查。脚本、配音、画面分镜都会留档，方便二次修改。
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="group relative overflow-hidden rounded-2xl border border-line bg-surface/60 p-6 transition hover:border-white/20 hover:bg-surface"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-white/70 transition group-hover:bg-accent group-hover:text-ink">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-[11px] text-white/25">{s.n}</span>
              </div>
              <h3 className="mt-6 text-[16px] font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/40">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* features */}
      <section id="features" className="relative border-y border-white/[0.06] bg-[#0a0a0d]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-2xl">
            <Badge tone="accent">能力</Badge>
            <h2 className="mt-4 text-[32px] font-bold leading-tight tracking-[-0.03em] text-white sm:text-[44px]">
              不是模板拼接，是一条真正的广告产线。
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-white/40">
              从抓取、脚本、配音、字幕到渲染，每一步都可替换成你自己的模型或供应商。
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="bg-[#0c0c0f] p-7 transition hover:bg-[#111116]">
                <f.icon className="h-5 w-5 text-accent" />
                <h3 className="mt-5 text-[15px] font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/40">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* showcase */}
      <section id="showcase" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Badge tone="accent">成片</Badge>
            <h2 className="mt-4 text-[32px] font-bold leading-tight tracking-[-0.03em] text-white sm:text-[44px]">
              流水线真实产出。
            </h2>
          </div>
          <LinkButton href="/studio/projects" variant="outline" size="sm">
            查看全部项目
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {showcase.length
            ? showcase.slice(0, 3).map((v) => (
                <Link
                  key={v.id}
                  href="/studio/projects"
                  className="group overflow-hidden rounded-2xl border border-line bg-surface/60"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#131318]">
                    {v.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbUrl}
                        alt={v.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-ink">
                        <Play className="ml-0.5 h-5 w-5" />
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="line-clamp-2 text-[14px] font-semibold text-white">
                        {v.title}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-wider text-white/50">
                        {v.aspect} · {v.duration ? `${v.duration.toFixed(1)}s` : "—"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            : [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-line bg-surface/60"
                >
                  <div className="relative flex aspect-[4/5] flex-col justify-end bg-[radial-gradient(120%_100%_at_20%_0%,#2a2450_0%,#111018_55%,#0b0b0e_100%)] p-5">
                    <span className="absolute left-5 top-5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                      样例
                    </span>
                    <p className="text-[26px] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-white">
                      {["Stop scrolling", "Meet the upgrade", "Your sign to switch"][i]}
                    </p>
                    <p className="mt-2 text-[12px] text-white/40">
                      生成你的第一条视频后，这里会展示真实成片。
                    </p>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="border-y border-white/[0.06] bg-[#0a0a0d]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="text-center">
            <Badge tone="accent">定价</Badge>
            <h2 className="mt-4 text-[32px] font-bold tracking-[-0.03em] text-white sm:text-[44px]">
              按条计费，不养闲人。
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[14px] text-white/40">
              每条 12 积分，包含脚本、配音、字幕与 1080p 渲染。
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {pricing.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-3xl border p-7 ${
                  p.highlight
                    ? "border-accent/40 bg-accent/[0.06]"
                    : "border-line bg-surface/60"
                }`}
              >
                {p.highlight ? (
                  <span className="absolute right-6 top-6 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                    推荐
                  </span>
                ) : null}
                <h3 className="text-[14px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  {p.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[38px] font-bold tracking-tight text-white">
                    {p.price}
                  </span>
                  <span className="text-[13px] text-white/35">{p.unit}</span>
                </div>
                <p className="mt-1 text-[13px] text-white/40">{p.body}</p>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-[13px] text-white/65"
                    >
                      <Check className="h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <LinkButton
                  href={p.href}
                  variant={p.highlight ? "primary" : "outline"}
                  className="mt-7 w-full"
                >
                  {p.cta}
                </LinkButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_100%,rgba(216,255,79,0.16),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:px-8">
          <Sparkles className="mx-auto h-6 w-6 text-accent" />
          <h2 className="mt-6 text-[36px] font-extrabold leading-tight tracking-[-0.035em] text-white sm:text-[54px]">
            下一条爆款，从一个链接开始。
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[14px] text-white/45">
            不用剪辑、不用写 prompt、不用等排期。粘贴链接，四分钟后下载成片。
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <UrlCta />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[12px] text-white/30">
            <span className="flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5" /> 中英文脚本
            </span>
            <span className="flex items-center gap-1.5">
              <Clapperboard className="h-3.5 w-3.5" /> 9:16 / 1:1 / 16:9
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> 无水印 MP4
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Logo size={24} />
            <span className="text-[12px] text-white/25">
              URL to video ads, end to end.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[12px] text-white/35">
            <Link href="/studio" className="transition hover:text-white">
              工作台
            </Link>
            <Link href="/studio/assets" className="transition hover:text-white">
              素材库
            </Link>
            <Link href="/studio/billing" className="transition hover:text-white">
              计费
            </Link>
            <span className="text-white/20">
              © {new Date().getFullYear()} AdForge
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
