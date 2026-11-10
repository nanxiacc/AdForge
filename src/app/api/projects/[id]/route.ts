import { NextResponse } from "next/server";
import { db, publicUrl } from "@/lib/db";
import { toPublicVideo } from "@/lib/pipeline";
import type { ProjectRow, VideoRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = db().prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | ProjectRow
    | undefined;
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const videos = db()
    .prepare("SELECT * FROM videos WHERE project_id = ? ORDER BY created_at DESC")
    .all(id) as unknown as VideoRow[];

  return NextResponse.json({
    project: { ...project, coverUrl: publicUrl(project.cover) },
    videos: videos.map(toPublicVideo),
  });
}
