import { NextResponse } from "next/server";
import { z } from "zod";
import { db, getBrand } from "@/lib/db";
import { isHex } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ brand: getBrand() });
}

const schema = z.object({
  name: z.string().min(1).max(60),
  primary: z.string().refine(isHex, "颜色格式错误"),
  ink: z.string().refine(isHex, "颜色格式错误"),
  paper: z.string().refine(isHex, "颜色格式错误"),
  cta: z.string().min(1).max(30),
  domain: z.string().max(60).optional(),
});

export async function PUT(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 });
  }
  const b = parsed.data;
  db()
    .prepare(
      "UPDATE brands SET name = ?, primary_color = ?, ink = ?, paper = ?, cta = ?, domain = ?, updated_at = ? WHERE id = 'default'",
    )
    .run(b.name, b.primary, b.ink, b.paper, b.cta, b.domain ?? null, Date.now());
  return NextResponse.json({ brand: getBrand() });
}
