import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { db, MEDIA_DIR, publicUrl, getBrand } from "../db";
import type {
  PublicVideo,
  Scene,
  VideoRow,
  VideoSpec,
  VideoStatus,
} from "../types";
import { ASPECTS } from "../types";
import { download } from "../ffmpeg";
import { AVATARS, avatarSvg, getAvatar } from "../avatars";
import { getVoice } from "../voices";
import { ensureDir } from "../utils";
import { generateScenes } from "../providers/llm";
import { synthesize } from "../providers/tts";
import { renderSceneStill, renderAvatarImage } from "./stills";
import { groupCues, renderCaptionPng } from "./captions";
import { padSceneAudio, concatAudio, mixVoice } from "./audio";
import { buildMusicBed } from "./music";
import {
  concatScenes,
  makeThumb,
  muxAudio,
  renderSceneVideo,
} from "./render";

export function setVideoState(
  id: string,
  patch: Partial<Pick<VideoRow, "status" | "stage" | "progress" | "error" | "output" | "thumb" | "duration" | "script">>,
) {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (!entries.length) return;
  const sets = entries.map(([k]) => `${k} = ?`).join(", ");
  db()
    .prepare(`UPDATE videos SET ${sets}, updated_at = ? WHERE id = ?`)
    .run(...entries.map(([, v]) => v as string | number), Date.now(), id);
}

function log(videoId: string, msg: string) {
  if (process.env.ADFORGE_DEBUG) {
    console.log(`[${videoId.slice(0, 8)}] ${msg}`);
  }
}

async function downloadImages(
  spec: VideoSpec,
  dir: string,
): Promise<{ map: Map<string, string>; list: string[] }> {
  ensureDir(dir);
  const map = new Map<string, string>();
  const list: string[] = [];
  let i = 0;
  for (const url of spec.product.images.slice(0, 6)) {
    const dest = path.join(dir, `img-${i++}.jpg`);
    const res = await download(url, dest, spec.product.url || undefined);
    if (!res.ok) continue;
    try {
      const meta = await sharp(dest).metadata();
      if (!meta.width || !meta.height) throw new Error("no size");
      if (meta.width < 240 || meta.height < 240) throw new Error("too small");
      map.set(url, dest);
      list.push(dest);
    } catch {
      fs.rmSync(dest, { force: true });
    }
  }
  return { map, list };
}

function pickImage(scene: Scene, index: number, spec: VideoSpec, map: Map<string, string>, list: string[]): string | undefined {
  if (scene.image && map.has(scene.image)) return map.get(scene.image);
  if (list.length) return list[index % list.length];
  return undefined;
}

export async function processVideo(videoId: string): Promise<void> {
  const row = db().prepare("SELECT * FROM videos WHERE id = ?").get(videoId) as
    | VideoRow
    | undefined;
  if (!row) throw new Error("video not found");

  const spec = JSON.parse(row.spec) as VideoSpec;
  if (!spec.brand) spec.brand = getBrand();

  const workDir = ensureDir(path.join(MEDIA_DIR, "videos", videoId));
  const stillDir = ensureDir(path.join(workDir, "stills"));
  const capDir = ensureDir(path.join(workDir, "captions"));
  const audioDir = ensureDir(path.join(workDir, "audio"));

  try {
    // 1. assets -----------------------------------------------------------
    setVideoState(videoId, {
      status: "analyzing",
      stage: "解析商品素材",
      progress: 6,
      error: null,
    });
    const { map, list } = await downloadImages(spec, path.join(workDir, "images"));
    log(videoId, `images: ${list.length}`);

    let avatarPath: string | undefined;
    const avatar = getAvatar(spec.avatarId);
    if (avatar) {
      avatarPath = path.join(workDir, `avatar-${avatar.id}.png`);
      await renderAvatarImage(avatarSvg(avatar), avatarPath, 1400);
      spec.avatarName = avatar.name;
    }

    // 2. script -----------------------------------------------------------
    setVideoState(videoId, {
      status: "scripting",
      stage: "生成广告脚本",
      progress: 16,
    });
    let scenes = spec.scenes?.length ? spec.scenes : null;
    if (!scenes) {
      const generated = await generateScenes(spec.product, {
        tone: spec.tone,
        language: spec.language,
        brand: spec.brand,
        duration: spec.duration,
      });
      scenes = generated.scenes;
      log(videoId, `script via ${generated.engine}`);
    }
    setVideoState(videoId, { script: JSON.stringify(scenes), progress: 26 });

    // 3. voice ------------------------------------------------------------
    const voice = getVoice(spec.voiceId);
    const lead = 0.35;
    const tail = 0.55;
    const sceneTimings: { duration: number; words: ReturnType<typeof groupCues> }[] = [];
    const paddedAudio: string[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      setVideoState(videoId, {
        status: "voicing",
        stage: `录制配音 ${i + 1}/${scenes.length}`,
        progress: Math.round(28 + (i / scenes.length) * 32),
      });
      const speech = await synthesize(scene.voiceover, voice, audioDir, i);
      const duration = Math.max(2.4, speech.duration + lead + tail);
      const padded = path.join(audioDir, `scene-${i}.wav`);
      await padSceneAudio(speech.audioPath, duration, padded, lead);
      paddedAudio.push(padded);
      sceneTimings.push({
        duration,
        words: groupCues(speech.words, spec.language),
      });
    }

    const totalDuration = sceneTimings.reduce((a, s) => a + s.duration, 0);
    log(videoId, `voice total ${totalDuration.toFixed(1)}s`);

    // 4. stills + captions ------------------------------------------------
    const stills: string[] = [];
    const captionLayout: { png: string; cue: { text: string; start: number; end: number } }[][] = [];

    for (let i = 0; i < scenes.length; i++) {
      setVideoState(videoId, {
        status: "assembling",
        stage: `合成画面 ${i + 1}/${scenes.length}`,
        progress: Math.round(62 + (i / scenes.length) * 16),
      });
      const scene = scenes[i];
      const still = path.join(stillDir, `scene-${i}.png`);
      await renderSceneStill({
        scene,
        spec,
        imagePath: pickImage(scene, i, spec, map, list),
        avatarPath,
        index: i,
        out: still,
      });
      stills.push(still);

      if (scene.kind === "cta") {
        captionLayout.push([]);
        continue;
      }
      const cues = sceneTimings[i].words;
      const items: { png: string; cue: { text: string; start: number; end: number } }[] = [];
      for (let c = 0; c < cues.length; c++) {
        const png = path.join(capDir, `s${i}-c${c}.png`);
        await renderCaptionPng(cues[c].text, spec.aspect, png);
        items.push({ png, cue: cues[c] });
      }
      captionLayout.push(items);
    }

    // 5. render -----------------------------------------------------------
    const clips: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      setVideoState(videoId, {
        status: "rendering",
        stage: `渲染片段 ${i + 1}/${scenes.length}`,
        progress: Math.round(80 + (i / scenes.length) * 14),
      });
      const clip = path.join(workDir, `clip-${i}.mp4`);
      await renderSceneVideo({
        still: stills[i],
        duration: sceneTimings[i].duration,
        aspect: spec.aspect,
        captions: captionLayout[i],
        out: clip,
        index: i,
      });
      clips.push(clip);
    }

    const silent = path.join(workDir, "silent.mp4");
    await concatScenes(clips, workDir, silent);

    const voiceTrack = path.join(audioDir, "voice.wav");
    await concatAudio(paddedAudio, audioDir, voiceTrack);

    let music: string | null = null;
    if (spec.music) {
      music = path.join(audioDir, "music.wav");
      buildMusicBed(totalDuration, music, spec.tone === "premium" ? "warm" : "bright");
    }

    const audio = path.join(workDir, "audio.m4a");
    await mixVoice(voiceTrack, music, totalDuration, audio);

    const final = path.join(workDir, "final.mp4");
    await muxAudio(silent, audio, final);

    const thumb = path.join(workDir, "thumb.jpg");
    await makeThumb(final, thumb, Math.min(1.4, totalDuration * 0.2));

    const { w, h } = ASPECTS[spec.aspect];
    log(videoId, `done ${totalDuration.toFixed(1)}s ${w}x${h}`);

    setVideoState(videoId, {
      status: "done",
      stage: "完成",
      progress: 100,
      output: final,
      thumb,
      duration: totalDuration,
      error: null,
    });

    db()
      .prepare("UPDATE videos SET spec = ?, updated_at = ? WHERE id = ?")
      .run(JSON.stringify(spec), Date.now(), videoId);
    db()
      .prepare("UPDATE projects SET cover = ?, updated_at = ? WHERE id = ?")
      .run(thumb, Date.now(), row.project_id);

    // Keep intermediate images but drop the heavy per-scene clips.
    for (const clip of clips) fs.rmSync(clip, { force: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(videoId, `FAILED ${message}`);
    setVideoState(videoId, {
      status: "failed",
      stage: "生成失败",
      error: message.slice(0, 600),
    });
    throw err;
  }
}

export function toPublicVideo(row: VideoRow): PublicVideo {
  const { spec, script, output, thumb, ...rest } = row;
  return {
    ...rest,
    spec: JSON.parse(spec) as VideoSpec,
    script: script ? (JSON.parse(script) as Scene[]) : null,
    outputUrl: publicUrl(output),
    thumbUrl: publicUrl(thumb),
  };
}

export function enqueueVideo(videoId: string) {
  db()
    .prepare(
      "INSERT INTO jobs (id, video_id, status, attempts, run_at) VALUES (?, ?, 'queued', 0, ?)",
    )
    .run(`job_${videoId}_${Date.now()}`, videoId, Date.now());
}

export function avatarList() {
  return AVATARS;
}
