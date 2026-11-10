import { NextResponse } from "next/server";
import { VOICES } from "@/lib/voices";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    voices: VOICES.map((v) => ({
      id: v.id,
      name: v.name,
      locale: v.locale,
      lang: v.lang,
      gender: v.gender,
      blurb: v.blurb,
    })),
  });
}
