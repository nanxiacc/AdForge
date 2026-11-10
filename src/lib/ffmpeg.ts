import { spawn } from "node:child_process";
import fs from "node:fs";

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export function run(
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number; cwd?: string } = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        child.kill("SIGKILL");
        settled = true;
        reject(new Error(`${cmd} timed out after ${opts.timeoutMs ?? 0}ms`));
      }
    }, opts.timeoutMs ?? 15 * 60 * 1000);

    child.stdout.on("data", (d) => {
      stdout += String(d);
    });
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

export async function ffmpeg(args: string[], timeoutMs = 10 * 60 * 1000) {
  const res = await run("ffmpeg", ["-hide_banner", "-y", ...args], { timeoutMs });
  if (res.code !== 0) {
    throw new Error(
      `ffmpeg failed (${res.code}): ${res.stderr.split("\n").slice(-12).join("\n")}`,
    );
  }
  return res;
}

export async function ffprobeDuration(file: string): Promise<number> {
  const res = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  if (res.code !== 0) throw new Error(`ffprobe failed: ${res.stderr}`);
  const n = Number.parseFloat(res.stdout.trim());
  return Number.isFinite(n) ? n : 0;
}

export async function ffprobeSize(
  file: string,
): Promise<{ width: number; height: number }> {
  const res = await run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "csv=s=x:p=0",
    file,
  ]);
  const [w, h] = res.stdout.trim().split("x").map(Number);
  return { width: w || 0, height: h || 0 };
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function download(
  url: string,
  dest: string,
  referer?: string,
): Promise<{ ok: boolean; bytes: number; type: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        ...(referer ? { Referer: referer } : {}),
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return { ok: false, bytes: 0, type: "" };
    const type = res.headers.get("content-type") ?? "";
    if (!/image|octet-stream/i.test(type)) return { ok: false, bytes: 0, type };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 1200) return { ok: false, bytes: 0, type };
    fs.writeFileSync(dest, buf);
    return { ok: true, bytes: buf.byteLength, type };
  } catch {
    return { ok: false, bytes: 0, type: "" };
  }
}

export { UA };
