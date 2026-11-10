import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdForge — 一条链接，成片广告",
  description:
    "把任意商品链接变成可投放的短视频广告：自动抓取商品、生成脚本、配音、数字人出镜、1080p 成片。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-ink text-[#F2F2F0]">{children}</body>
    </html>
  );
}
