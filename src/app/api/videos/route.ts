import { NextResponse } from "next/server";
import { z } from "zod";
import { db, getBrand, getProfile } from "@/lib/db";
import { enqueueVideo } from "@/lib/pipeline";
import type { VideoSpec } from "@/lib/types";
import { id } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sceneSchema = z.object({
  id: z.string(),
  kind: z.enum(["hook", "problem", "feature", "benefit", "social", "cta"]),
  voiceover: z.string().min(1),
  headline: z.string().min(1),
  sub: z.string().optional(),
  image: z.string().nullable().optional(),
});

const bodySchema = z.object({
  product: z.object({
    url: z.string().default(""),
    title: z.string().min(2),
    description: z.string().default(""),
    images: z.array(z.string()).default([]),
    price: z.string().optional(),
    brand: z.string().optional(),
  }),
  voiceId: z.string(),
  avatarId: z.string().nullable().optional(),
  aspect: z.enum(["9:16", "1:1", "16:9"]),
  tone: z.enum(["energetic", "friendly", "premium", "direct"]),
  language: z.enum(["en", "zh"]),
  music: z.boolean().default(true),
  duration: z.number().min(10).max(90).default(30),
  scenes: z.array(sceneSchema).optional(),
});

const COST = 12;

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "参数不完整", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const profile = getProfile();
  if (profile.credits < COST) {
    return NextResponse.json(
      { error: "积分不足，请先充值" },
      { status: 402 },
    );
  }

  const brand = getBrand();
  const now = Date.now();
  const projectId = id("prj");
  const videoId = id("vid");
  const title = body.product.title.slice(0, 70);

  const spec: VideoSpec = {
    product: body.product,
    scenes: body.scenes,
    voiceId: body.voiceId,
    avatarId: body.avatarId ?? null,
    aspect: body.aspect,
    tone: body.tone,
    language: body.language,
    music: body.music,
    brand,
    duration: body.duration,
  };

  const conn = db();
  conn
    .prepare(
      "INSERT INTO projects (id, title, product_url, status, created_at, updated_at) VALUES (?,?,?,?,?,?)",
    )
    .run(projectId, title, body.product.url, "active", now, now);
  conn
    .prepare(
      "INSERT INTO videos (id, project_id, status, stage, progress, aspect, spec, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
    )
    .run(
      videoId,
      projectId,
      "queued",
      "排队中",
      0,
      body.aspect,
      JSON.stringify(spec),
      now,
      now,
    );
  conn.prepare("UPDATE profile SET credits = credits - ? WHERE id = 1").run(COST);
  enqueueVideo(videoId);

  return NextResponse.json({ videoId, projectId, creditsLeft: profile.credits - COST });
}
