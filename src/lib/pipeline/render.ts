import fs from "node:fs";
import path from "node:path";
import type { CaptionCue } from "./captions";
import { ffmpeg } from "../ffmpeg";
import { ASPECTS, type Aspect } from "../types";

export interface SceneRenderInput {
  still: string;
  duration: number;
  aspect: Aspect;
  captions: { png: string; cue: CaptionCue }[];
  out: string;
  index: number;
}

export async function renderSceneVideo(
  input: SceneRenderInput,
): Promise<string> {
  const { w, h } = ASPECTS[input.aspect];
  const fps = 30;
  const args: string[] = [];
  args.push("-loop", "1", "-framerate", String(fps), "-t", input.duration.toFixed(3), "-i", input.still);

  for (const cap of input.captions) {
    args.push("-loop", "1", "-framerate", String(fps), "-t", input.duration.toFixed(3), "-i", cap.png);
  }

  const dir = input.index % 2 === 0 ? "+" : "-";
  const zoom =
    dir === "+"
      ? `'min(1+0.00055*on,1.10)'`
      : `'max(1.10-0.00055*on,1.0)'`;

  let filter =
    `[0:v]scale=${w * 2}:${h * 2}:force_original_aspect_ratio=increase,` +
    `crop=${w * 2}:${h * 2},` +
    `zoompan=z=${zoom}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${w}x${h}:fps=${fps},` +
    `setsar=1,format=yuv420p[v0]`;

  input.captions.forEach((cap, i) => {
    const start = Math.max(0, cap.cue.start);
    const end = Math.min(input.duration, cap.cue.end + 0.08);
    filter += `;[v${i}][${i + 1}:v]overlay=0:0:enable='between(t,${start.toFixed(2)},${end.toFixed(2)})'[v${i + 1}]`;
  });

  const last = `v${input.captions.length}`;
  args.push(
    "-filter_complex",
    filter,
    "-map",
    `[${last}]`,
    "-t",
    input.duration.toFixed(3),
    "-r",
    String(fps),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "21",
    "-pix_fmt",
    "yuv420p",
    "-an",
    input.out,
  );

  await ffmpeg(args, 12 * 60 * 1000);
  return input.out;
}

export async function concatScenes(
  scenes: string[],
  workDir: string,
  out: string,
): Promise<string> {
  const list = path.join(workDir, "scenes.txt");
  fs.writeFileSync(
    list,
    scenes.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"),
  );
  await ffmpeg([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    list,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    out,
  ]);
  return out;
}

export async function muxAudio(
  video: string,
  audio: string,
  out: string,
): Promise<string> {
  await ffmpeg([
    "-i",
    video,
    "-i",
    audio,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "copy",
    "-shortest",
    "-movflags",
    "+faststart",
    out,
  ]);
  return out;
}

export async function makeThumb(
  video: string,
  out: string,
  at = 1.2,
): Promise<string> {
  await ffmpeg([
    "-ss",
    at.toFixed(2),
    "-i",
    video,
    "-frames:v",
    "1",
    "-vf",
    "scale=720:-2",
    "-q:v",
    "3",
    out,
  ]);
  return out;
}
