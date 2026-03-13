import { NextResponse } from "next/server";
import { buildEarthSignals } from "@/lib/dcc/external/earthSignals";

export const runtime = "nodejs";

function asInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ place: string }> }
) {
  const resolved = await params;
  const { searchParams } = new URL(request.url);
  const days = asInt(searchParams.get("days"), 7);
  const radius_km = asInt(searchParams.get("radius_km"), 500);

  const payload = await buildEarthSignals({
    slug: resolved.place,
    days,
    radius_km,
  });

  if (!payload) {
    return NextResponse.json(
      { error: "place_not_found_or_missing_coordinates", place: resolved.place },
      { status: 404 }
    );
  }

  return NextResponse.json(payload, { status: 200 });
}
