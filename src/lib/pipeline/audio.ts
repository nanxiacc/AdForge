import fs from "node:fs";
import path from "node:path";
import { ffmpeg } from "../ffmpeg";

export async function padSceneAudio(
  voiceWav: string,
  sceneDuration: number,
  out: string,
  lead = 0.35,
): Promise<string> {
  await ffmpeg([
    "-i",
    voiceWav,
    "-af",
    `adelay=${Math.round(lead * 1000)}:all=1,apad`,
    "-t",
    sceneDuration.toFixed(3),
    "-ar",
    "48000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    out,
  ]);
  return out;
}

export async function concatAudio(
  files: string[],
  workDir: string,
  out: string,
): Promise<string> {
  const list = path.join(workDir, "audio-list.txt");
  fs.writeFileSync(
    list,
    files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"),
  );
  await ffmpeg([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    list,
    "-ar",
    "48000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    out,
  ]);
  return out;
}

export async function mixVoice(
  voiceWav: string,
  musicWav: string | null,
  duration: number,
  out: string,
): Promise<string> {
  if (musicWav && fs.existsSync(musicWav)) {
    const fadeOut = Math.max(0, duration - 2.6);
    await ffmpeg([
      "-i",
      voiceWav,
      "-i",
      musicWav,
      "-filter_complex",
      `[0:a]loudnorm=I=-15:TP=-1.5:LRA=11[v];` +
        `[1:a]volume=0.16,afade=t=in:st=0:d=1.4,afade=t=out:st=${fadeOut.toFixed(2)}:d=2.4[m];` +
        `[v][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]`,
      "-map",
      "[a]",
      "-t",
      duration.toFixed(3),
      "-ar",
      "48000",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      out,
    ]);
  } else {
    await ffmpeg([
      "-i",
      voiceWav,
      "-af",
      "loudnorm=I=-15:TP=-1.5:LRA=11",
      "-t",
      duration.toFixed(3),
      "-ar",
      "48000",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      out,
    ]);
  }
  return out;
}
