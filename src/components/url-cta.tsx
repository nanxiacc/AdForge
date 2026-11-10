"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Link2 } from "lucide-react";
import { cn } from "./ui";

export function UrlCta({
  size = "lg",
  placeholder = "粘贴商品链接，例如 https://shop.example.com/product",
  className,
}: {
  size?: "md" | "lg";
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = url.trim();
    router.push(
      clean
        ? `/studio/create?url=${encodeURIComponent(clean)}`
        : "/studio/create",
    );
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex w-full items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] p-1.5 pl-4 backdrop-blur transition focus-within:border-accent/50 focus-within:bg-white/[0.06]",
        size === "lg" ? "h-16" : "h-13",
        className,
      )}
    >
      <Link2 className="h-4 w-4 shrink-0 text-white/35" />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/30"
        aria-label="商品链接"
      />
      <button
        type="submit"
        className={cn(
          "group inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 font-semibold text-ink transition hover:bg-[#e4ff7a]",
          size === "lg" ? "h-13 text-[14px]" : "h-10 text-[13px]",
        )}
      >
        生成广告
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
