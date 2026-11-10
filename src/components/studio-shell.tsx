"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  CreditCard,
  LayoutDashboard,
  Palette,
  Plus,
  Users,
} from "lucide-react";
import { Logo } from "./logo";
import { cn } from "./ui";

const items = [
  { href: "/studio", label: "概览", icon: LayoutDashboard, exact: true },
  { href: "/studio/create", label: "新建视频", icon: Plus },
  { href: "/studio/projects", label: "项目", icon: Clapperboard },
  { href: "/studio/assets", label: "素材库", icon: Users },
  { href: "/studio/brand", label: "品牌库", icon: Palette },
  { href: "/studio/billing", label: "积分与计费", icon: CreditCard },
];

export function StudioShell({
  profile,
  children,
}: {
  profile: { email: string; plan: string; credits: number };
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/[0.07] bg-[#0a0a0c] md:flex">
        <div className="flex h-16 items-center px-5">
          <Logo size={26} />
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                  active
                    ? "bg-white/[0.07] text-white"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/80",
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition",
                    active ? "text-accent" : "text-white/35 group-hover:text-white/60",
                  )}
                />
                {item.label}
                {item.href === "/studio/create" ? (
                  <span className="ml-auto rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    12
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 mb-3 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.14em] text-white/35">
              {profile.plan}
            </span>
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-white/50">
              {profile.credits} 积分
            </span>
          </div>
          <p className="mt-2 truncate text-[12px] text-white/50">{profile.email}</p>
          <Link
            href="/studio/billing"
            className="mt-3 flex items-center justify-between rounded-lg bg-white/[0.05] px-2.5 py-2 text-[11px] font-medium text-white/70 transition hover:bg-white/[0.09]"
          >
            充值积分
            <span className="text-accent">→</span>
          </Link>
        </div>
      </aside>

      <div className="md:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-ink/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
            <div className="md:hidden">
              <Logo size={24} />
            </div>
            <div className="hidden text-[13px] text-white/35 md:block">
              {items.find((i) => isActive(i.href, i.exact))?.label ?? "工作台"}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/studio/billing"
                className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/55 transition hover:text-white sm:flex"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {profile.credits} 积分
              </Link>
              <Link
                href="/studio/create"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-[12px] font-semibold text-ink transition hover:bg-[#e4ff7a]"
              >
                <Plus className="h-3.5 w-3.5" />
                新建视频
              </Link>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
            {items.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] transition",
                    active ? "bg-white/[0.08] text-white" : "text-white/40",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
