import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { NextResponse } from "next/server";
import { ASSET_DIR } from "@/lib/db";
import { ffmpeg } from "@/lib/ffmpeg";
import { getVoice } from "@/lib/voices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function say(text: string, voice: string, rate: number, out: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "say",
      ["-v", voice, "-r", String(rate), "-o", out, text],
      { timeout: 20_000 },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const voice = getVoice(id);
  const dir = path.join(ASSET_DIR, "voice-previews");
  fs.mkdirSync(dir, { recursive: true });
  const mp3 = path.join(dir, `${voice.id}.mp3`);

  if (!fs.existsSync(mp3)) {
    const aiff = path.join(dir, `${voice.id}.aiff`);
    const text =
      voice.lang === "zh"
        ? `你好，我是${voice.name}。这就是你的广告听起来的样子。`
        : `Hi, I'm ${voice.name}. This is how your ad could sound.`;
    await say(text, voice.say, voice.rate, aiff);
    await ffmpeg(["-i", aiff, "-c:a", "libmp3lame", "-b:a", "128k", mp3]);
    fs.rmSync(aiff, { force: true });
  }

  const buf = fs.readFileSync(mp3);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(buf.byteLength),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
