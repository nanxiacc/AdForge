import { NextResponse } from "next/server";
import { AVATARS } from "@/lib/avatars";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    avatars: AVATARS.map((a) => ({
      id: a.id,
      name: a.name,
      tag: a.tag,
      lang: a.lang,
      note: a.note,
      image: `/api/avatars/${a.id}/image`,
    })),
  });
}
