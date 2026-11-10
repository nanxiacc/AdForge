import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { ASSET_DIR } from "@/lib/db";
import { AVATARS, avatarSvg, getAvatar } from "@/lib/avatars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const avatar = getAvatar(id);
  if (!avatar) return new NextResponse("not found", { status: 404 });

  const dir = path.join(ASSET_DIR, "avatars");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${avatar.id}.png`);
  if (!fs.existsSync(file)) {
    await sharp(Buffer.from(avatarSvg(avatar)))
      .resize(800, 800)
      .png()
      .toFile(file);
  }
  const buf = fs.readFileSync(file);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(buf.byteLength),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
