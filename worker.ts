import { db } from "./src/lib/db";
import { processVideo } from "./src/lib/pipeline";

const POLL_MS = 700;

function log(msg: string) {
  console.log(`[worker] ${new Date().toISOString().slice(11, 19)} ${msg}`);
}

// Recover jobs that were interrupted by a restart.
db().prepare("UPDATE jobs SET status = 'queued' WHERE status = 'running'").run();
db()
  .prepare("UPDATE videos SET status = 'queued', stage = '排队中' WHERE status IN ('analyzing','scripting','voicing','assembling','rendering')")
  .run();

type Job = { id: string; video_id: string; attempts: number };

function claim(): Job | null {
  const now = Date.now();
  const job = db()
    .prepare(
      "SELECT id, video_id, attempts FROM jobs WHERE status = 'queued' AND run_at <= ? ORDER BY run_at ASC LIMIT 1",
    )
    .get(now) as Job | undefined;
  if (!job) return null;
  const res = db()
    .prepare("UPDATE jobs SET status = 'running' WHERE id = ? AND status = 'queued'")
    .run(job.id);
  return Number(res.changes) > 0 ? job : null;
}

function finish(job: Job, ok: boolean, error?: string) {
  if (ok) {
    db().prepare("UPDATE jobs SET status = 'done' WHERE id = ?").run(job.id);
    return;
  }
  const attempts = job.attempts + 1;
  if (attempts < 2) {
    db()
      .prepare(
        "UPDATE jobs SET status = 'queued', attempts = ?, run_at = ? WHERE id = ?",
      )
      .run(attempts, Date.now() + 1500, job.id);
  } else {
    db()
      .prepare("UPDATE jobs SET status = 'failed', attempts = ?, error = ? WHERE id = ?")
      .run(attempts, error?.slice(0, 500) ?? null, job.id);
  }
}

let running = true;

async function tick() {
  const job = claim();
  if (!job) return;
  log(`start ${job.video_id}`);
  try {
    await processVideo(job.video_id);
    finish(job, true);
    log(`done ${job.video_id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(`error ${job.video_id}: ${message}`);
    finish(job, false, message);
  }
}

async function main() {
  log("online — watching jobs");
  while (running) {
    try {
      await tick();
    } catch (err) {
      log(`tick failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    running = false;
    log("shutting down");
    setTimeout(() => process.exit(0), 300);
  });
}

void main();
