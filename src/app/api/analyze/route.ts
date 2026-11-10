import { NextResponse } from "next/server";
import { analyzeUrl } from "@/lib/providers/scrape";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const url = (body.url ?? "").trim();
    if (!url) {
      return NextResponse.json({ error: "请填写商品链接" }, { status: 400 });
    }
    const product = await analyzeUrl(url);
    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "解析失败";
    return NextResponse.json({ error: `解析失败：${message}` }, { status: 422 });
  }
}
