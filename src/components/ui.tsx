import { clsx, type ClassValue } from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

type ButtonVariant = "primary" | "outline" | "ghost" | "soft" | "dark";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-ink hover:bg-[#e4ff7a] shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_10px_30px_-12px_rgba(216,255,79,0.55)]",
  outline:
    "border border-white/15 text-white hover:border-white/30 hover:bg-white/[0.04]",
  ghost: "text-white/70 hover:text-white hover:bg-white/[0.06]",
  soft: "bg-white/[0.07] text-white hover:bg-white/[0.12]",
  dark: "bg-ink text-white hover:bg-[#17171b]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-lg gap-1.5",
  md: "h-11 px-5 text-[14px] rounded-xl gap-2",
  lg: "h-13 px-7 text-[15px] rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-[-0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-[-0.01em] transition-all duration-200",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Card({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface/80",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "success" | "warn" | "danger";
  className?: string;
}) {
  const tones = {
    default: "bg-white/[0.06] text-white/65 border-white/10",
    accent: "bg-accent/12 text-accent border-accent/25",
    success: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    warn: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    danger: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-white/[0.03] px-3.5 text-[14px] text-white placeholder:text-white/30 outline-none transition focus:border-accent/60 focus:bg-white/[0.05]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-line bg-white/[0.03] px-3.5 py-3 text-[14px] leading-relaxed text-white placeholder:text-white/30 outline-none transition focus:border-accent/60 focus:bg-white/[0.05]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  children,
  hint,
  className,
}: {
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-baseline justify-between", className)}>
      <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/45">
        {children}
      </label>
      {hint ? <span className="text-[11px] text-white/30">{hint}</span> : null}
    </div>
  );
}

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/8", className)}>
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-accent",
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-white/50">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[15px] font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-white/45">
        {body}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
