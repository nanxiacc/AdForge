import { NextResponse } from "next/server";
import { db, getBrand, getProfile, publicUrl } from "@/lib/db";
import { toPublicVideo } from "@/lib/pipeline";
import type { ProjectRow, VideoRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const profile = getProfile();
  const projects = db()
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC LIMIT 24")
    .all() as unknown as ProjectRow[];

  const recent = db()
    .prepare("SELECT * FROM videos ORDER BY created_at DESC LIMIT 12")
    .all() as unknown as VideoRow[];

  const stats = db()
    .prepare(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) AS done FROM videos",
    )
    .get() as { total: number; done: number };

  return NextResponse.json({
    profile,
    brand: getBrand(),
    projects: projects.map((p) => ({ ...p, coverUrl: publicUrl(p.cover) })),
    recent: recent.map(toPublicVideo),
    stats: {
      total: stats.total ?? 0,
      done: stats.done ?? 0,
      credits: profile.credits,
    },
  });
}
