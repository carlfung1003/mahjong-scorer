import { NextResponse } from "next/server";
import { detectTilesFromImage } from "@/lib/vision";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json() as { imageBase64?: string; mediaType?: string };
    if (!body.imageBase64) {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
    }
    const mediaType = (body.mediaType ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";
    const detection = await detectTilesFromImage({ imageBase64: body.imageBase64, mediaType });
    return NextResponse.json(detection);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
