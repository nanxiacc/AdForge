import { db } from "@/lib/db";
import { toPublicVideo } from "@/lib/pipeline";
import type { VideoRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = () => {
        if (closed) return;
        const row = db()
          .prepare("SELECT * FROM videos WHERE id = ?")
          .get(id) as VideoRow | undefined;
        if (!row) {
          controller.enqueue(encoder.encode(`event: error\ndata: {}\n\n`));
          controller.close();
          closed = true;
          return;
        }
        const payload = JSON.stringify(toPublicVideo(row));
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        if (row.status === "done" || row.status === "failed") {
          controller.enqueue(encoder.encode(`event: end\ndata: {}\n\n`));
          controller.close();
          closed = true;
        }
      };

      send();
      const timer = setInterval(send, 800);
      const stop = () => {
        clearInterval(timer);
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      // 3 minute ceiling
      setTimeout(stop, 180_000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
