import path from "node:path";
import { db, getBrand, MEDIA_DIR } from "../src/lib/db";
import { processVideo } from "../src/lib/pipeline";
import type { VideoSpec } from "../src/lib/types";
import { id } from "../src/lib/utils";

/**
 * Generates a demo video directly through the pipeline.
 * Usage: pnpm tsx scripts/render-demo.ts
 *        pnpm tsx scripts/render-demo.ts --url=https://... --zh
 */
const args = process.argv.slice(2);
const zh = args.includes("--zh");
const urlArg = args.find((a) => a.startsWith("--url="))?.slice(6);
const aspect = args.includes("--wide") ? "16:9" : args.includes("--square") ? "1:1" : "9:16";

const product = {
  url: urlArg ?? "https://www.allbirds.com/products/mens-wool-runners",
  title: "Men's Wool Runner",
  description:
    "The original wool sneaker that started it all. Naturally breathable, temperature-regulating merino wool keeps feet cool in summer and warm in winter. Machine washable, with a carbon-negative sole and all-day cushioning.",
  images: [
    "https://www.allbirds.com/cdn/shop/files/Allbirds_WL_RN_SF_PDP_Natural_Grey_LAT.png?v=1751143404",
  ],
  price: "USD 110",
  brand: "Allbirds",
};

const spec: VideoSpec = {
  product,
  voiceId: zh ? "tingting" : "samantha",
  avatarId: "ava",
  aspect,
  tone: "energetic",
  language: zh ? "zh" : "en",
  music: true,
  brand: getBrand(),
  duration: 30,
};

const now = Date.now();
const projectId = id("prj");
const videoId = id("vid");

db()
  .prepare(
    "INSERT INTO projects (id, title, product_url, status, created_at, updated_at) VALUES (?,?,?,?,?,?)",
  )
  .run(projectId, product.title, product.url, "active", now, now);
db()
  .prepare(
    "INSERT INTO videos (id, project_id, status, stage, progress, aspect, spec, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
  )
  .run(videoId, projectId, "queued", "排队中", 0, spec.aspect, JSON.stringify(spec), now, now);

console.log("video", videoId);

async function main() {
  const started = Date.now();
  let peakRss = process.memoryUsage().rss;
  const baseline = peakRss;
  const sampler = setInterval(() => {
    peakRss = Math.max(peakRss, process.memoryUsage().rss);
  }, 100);
  await processVideo(videoId);
  clearInterval(sampler);
  console.log(
    "worker rss baseline",
    (baseline / 1048576).toFixed(0) + "MB",
    "peak",
    (peakRss / 1048576).toFixed(0) + "MB",
  );
  const row = db()
    .prepare("SELECT output, duration FROM videos WHERE id = ?")
    .get(videoId) as { output: string; duration: number };
  console.log(
    "done in",
    ((Date.now() - started) / 1000).toFixed(1) + "s",
    "->",
    path.relative(MEDIA_DIR, row.output),
    row.duration?.toFixed(1) + "s",
  );
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
