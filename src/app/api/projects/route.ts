import { NextResponse } from "next/server";
import { db, publicUrl } from "@/lib/db";
import { toPublicVideo } from "@/lib/pipeline";
import type { ProjectRow, VideoRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const projects = db()
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC LIMIT 60")
    .all() as unknown as ProjectRow[];
  const videos = db()
    .prepare("SELECT * FROM videos ORDER BY created_at DESC LIMIT 200")
    .all() as unknown as VideoRow[];

  const grouped = new Map<string, VideoRow[]>();
  for (const v of videos) {
    const list = grouped.get(v.project_id) ?? [];
    list.push(v);
    grouped.set(v.project_id, list);
  }

  return NextResponse.json({
    projects: projects.map((p) => ({
      ...p,
      coverUrl: publicUrl(p.cover),
      videos: (grouped.get(p.id) ?? []).map(toPublicVideo),
    })),
  });
}
