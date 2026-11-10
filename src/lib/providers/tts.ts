import fs from "node:fs";
import path from "node:path";
import { ffmpeg, ffprobeDuration } from "../ffmpeg";
import type { Voice } from "../voices";
import { hasCJK } from "../utils";

export interface WordCue {
  text: string;
  start: number;
  end: number;
}

export interface SpeechResult {
  audioPath: string;
  duration: number;
  words: WordCue[];
  provider: string;
}

function estimateWords(
  text: string,
  duration: number,
): WordCue[] {
  const tokens: string[] = [];
  if (hasCJK(text)) {
    const chars = Array.from(text.replace(/\s+/g, ""));
    for (let i = 0; i < chars.length; i += 2) {
      tokens.push(chars.slice(i, i + 2).join(""));
    }
  } else {
    tokens.push(...text.split(/\s+/).filter(Boolean));
  }
  if (!tokens.length) return [];

  const weights = tokens.map((t) => {
    const pause = /[,.;:!?，。；：！？—]$/.test(t) ? 2.2 : 1;
    return (hasCJK(t) ? 1 : Math.max(1, t.length * 0.5)) * pause;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const start = 0.08;
  const usable = Math.max(0.3, duration - start - 0.12);

  let cursor = start;
  return tokens.map((t, i) => {
    const d = (weights[i] / total) * usable;
    const cue = { text: t, start: cursor, end: cursor + d };
    cursor += d;
    return cue;
  });
}

async function macSay(
  text: string,
  voice: Voice,
  workDir: string,
  index: number,
): Promise<{ wav: string; provider: string }> {
  const aiff = path.join(workDir, `vo-${index}.aiff`);
  const wav = path.join(workDir, `vo-${index}.wav`);
  const tmpTxt = path.join(workDir, `vo-${index}.txt`);
  fs.writeFileSync(tmpTxt, text, "utf8");
  // `say -f` avoids any shell/arg length issues with long copy.
  const { spawn } = await import("node:child_process");
  const sayArgs = [
    "-v",
    voice.say,
    "-r",
    String(voice.rate),
    "-f",
    tmpTxt,
    "-o",
    aiff,
  ];
  const code: number = await new Promise((resolve) => {
    const child = spawn("say", sayArgs, { stdio: "ignore" });
    child.on("error", () => resolve(1));
    child.on("close", (c) => resolve(c ?? 1));
  });
  if (code !== 0) {
    // Fall back to the system default voice if the chosen one is missing.
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        "say",
        ["-r", String(voice.rate), "-f", tmpTxt, "-o", aiff],
        { stdio: "ignore" },
      );
      child.on("error", reject);
      child.on("close", (c) =>
        c === 0 ? resolve() : reject(new Error(`say exited ${c}`)),
      );
    });
  }
  await ffmpeg(["-i", aiff, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", wav]);
  fs.rmSync(tmpTxt, { force: true });
  fs.rmSync(aiff, { force: true });
  return { wav, provider: "macos-say" };
}

async function openaiTts(
  text: string,
  voice: Voice,
  workDir: string,
  index: number,
): Promise<{ wav: string; provider: string }> {
  const key = process.env.OPENAI_API_KEY!;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const res = await fetch(`${baseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ADFORGE_TTS_MODEL ?? "gpt-4o-mini-tts",
      voice: process.env.ADFORGE_TTS_VOICE ?? "alloy",
      input: text,
      response_format: "mp3",
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}`);
  const mp3 = path.join(workDir, `vo-${index}.mp3`);
  fs.writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  const wav = path.join(workDir, `vo-${index}.wav`);
  await ffmpeg(["-i", mp3, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", wav]);
  fs.rmSync(mp3, { force: true });
  return { wav, provider: "openai" };
}

/**
 * Synthesises one scene's voiceover and returns word-level cues.
 * Local macOS `say` is the default so the pipeline runs with zero keys.
 */
export async function synthesize(
  text: string,
  voice: Voice,
  workDir: string,
  index: number,
): Promise<SpeechResult> {
  const trainer = process.env.ADFORGE_TTS;
  const useOpenAI =
    trainer === "openai" || (!trainer && Boolean(process.env.OPENAI_API_KEY));

  const { wav, provider } = useOpenAI
    ? await openaiTts(text, voice, workDir, index)
    : await macSay(text, voice, workDir, index);

  const duration = await ffprobeDuration(wav);
  return {
    audioPath: wav,
    duration,
    words: estimateWords(text, duration),
    provider,
  };
}
