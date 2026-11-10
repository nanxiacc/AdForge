import Link from "next/link";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span
        className="relative flex items-center justify-center rounded-[10px] bg-accent text-ink transition-transform duration-300 group-hover:rotate-6"
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.56}
          height={size * 0.56}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M13.2 2 4 14h6.4L9.6 22 20 9.4h-6.8L13.2 2Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="text-[17px] font-bold tracking-[-0.03em] text-white">
        AdForge
      </span>
    </Link>
  );
}
