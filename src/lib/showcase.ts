import { db, publicUrl } from "./db";
import type { Aspect } from "./types";

export interface ShowcaseItem {
  id: string;
  title: string;
  thumbUrl: string | null;
  videoUrl: string | null;
  aspect: Aspect;
  duration: number | null;
}

export function getShowcase(limit = 4): ShowcaseItem[] {
  try {
    const rows = db()
      .prepare(
        `SELECT v.id, v.thumb, v.output, v.aspect, v.duration, p.title
         FROM videos v JOIN projects p ON p.id = v.project_id
         WHERE v.status = 'done' AND v.output IS NOT NULL
         ORDER BY v.created_at DESC LIMIT ?`,
      )
      .all(limit) as unknown as {
      id: string;
      thumb: string | null;
      output: string | null;
      aspect: Aspect;
      duration: number | null;
      title: string;
    }[];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      thumbUrl: publicUrl(r.thumb),
      videoUrl: publicUrl(r.output),
      aspect: r.aspect,
      duration: r.duration,
    }));
  } catch {
    return [];
  }
}
