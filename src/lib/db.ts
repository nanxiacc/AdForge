import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { BrandKit } from "./types";

export const DATA_DIR =
  process.env.ADFORGE_DATA_DIR ?? path.join(process.cwd(), "var");
export const MEDIA_DIR = path.join(DATA_DIR, "media");
export const ASSET_DIR = path.join(DATA_DIR, "assets");
export const TMP_DIR = path.join(DATA_DIR, "tmp");

for (const dir of [DATA_DIR, MEDIA_DIR, ASSET_DIR, TMP_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

let cached: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (cached) return cached;
  const conn = new DatabaseSync(path.join(DATA_DIR, "adforge.db"));
  conn.exec("PRAGMA journal_mode = WAL");
  conn.exec("PRAGMA foreign_keys = ON");
  conn.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      product_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      cover TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      stage TEXT NOT NULL DEFAULT '排队中',
      progress INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      aspect TEXT NOT NULL DEFAULT '9:16',
      duration REAL,
      output TEXT,
      thumb TEXT,
      spec TEXT NOT NULL,
      script TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      attempts INTEGER NOT NULL DEFAULT 0,
      run_at INTEGER NOT NULL,
      error TEXT
    );
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      primary_color TEXT NOT NULL,
      ink TEXT NOT NULL,
      paper TEXT NOT NULL,
      cta TEXT NOT NULL,
      domain TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      email TEXT NOT NULL,
      plan TEXT NOT NULL,
      credits INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_videos_project ON videos(project_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status, run_at);
  `);

  const now = Date.now();
  const hasProfile = conn.prepare("SELECT COUNT(*) AS n FROM profile").get() as {
    n: number;
  };
  if (!hasProfile.n) {
    conn
      .prepare(
        "INSERT INTO profile (id, email, plan, credits, created_at) VALUES (1, ?, ?, ?, ?)",
      )
      .run("founder@adforge.local", "Studio", 120, now);
  }

  const hasBrand = conn.prepare("SELECT COUNT(*) AS n FROM brands").get() as {
    n: number;
  };
  if (!hasBrand.n) {
    const kit: BrandKit = {
      id: "default",
      name: "AdForge Demo",
      primary: "#D8FF4F",
      ink: "#0B0B0C",
      paper: "#F7F6F2",
      cta: "立即购买",
      domain: "adforge.local",
      logo: null,
    };
    conn
      .prepare(
        "INSERT INTO brands (id, name, logo, primary_color, ink, paper, cta, domain, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
      )
      .run(
        kit.id,
        kit.name,
        null,
        kit.primary,
        kit.ink,
        kit.paper,
        kit.cta,
        kit.domain ?? null,
        now,
      );
  }

  cached = conn;
  return conn;
}

export function nowMs() {
  return Date.now();
}

export function getProfile() {
  return db().prepare("SELECT * FROM profile WHERE id = 1").get() as {
    id: number;
    email: string;
    plan: string;
    credits: number;
    created_at: number;
  };
}

export function getBrand(id = "default"): BrandKit {
  const row = db().prepare("SELECT * FROM brands WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) {
    return {
      id: "default",
      name: "AdForge Demo",
      primary: "#D8FF4F",
      ink: "#0B0B0C",
      paper: "#F7F6F2",
      cta: "立即购买",
      logo: null,
    };
  }
  return {
    id: row.id as string,
    name: row.name as string,
    logo: (row.logo as string) ?? null,
    primary: row.primary_color as string,
    ink: row.ink as string,
    paper: row.paper as string,
    cta: row.cta as string,
    domain: (row.domain as string) ?? undefined,
  };
}

export function publicUrl(file: string | null): string | null {
  if (!file) return null;
  const rel = path.relative(MEDIA_DIR, file);
  if (rel.startsWith("..")) return null;
  return "/api/media/" + rel.split(path.sep).join("/");
}
