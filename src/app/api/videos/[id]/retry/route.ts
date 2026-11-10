import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enqueueVideo, setVideoState } from "@/lib/pipeline";
import type { VideoRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = db().prepare("SELECT * FROM videos WHERE id = ?").get(id) as
    | VideoRow
    | undefined;
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (row.status === "queued" || row.status === "rendering") {
    return NextResponse.json({ error: "任务进行中" }, { status: 409 });
  }
  setVideoState(id, { status: "queued", stage: "排队中", progress: 0, error: null });
  enqueueVideo(id);
  return NextResponse.json({ ok: true });
}
