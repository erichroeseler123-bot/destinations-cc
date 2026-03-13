import { NextResponse } from "next/server";
import { findNearby } from "@/lib/dcc/nearby";

export const runtime = "nodejs";

function parseNumber(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseNumber(searchParams.get("lat"));
  const lon = parseNumber(searchParams.get("lon"));
  const slug = searchParams.get("slug");
  const radius_km = parseNumber(searchParams.get("radius_km"));
  const limit = parseNumber(searchParams.get("limit"));

  const result = findNearby({
    lat,
    lon,
    slug,
    radius_km,
    limit,
  });

  if (!result) {
    return NextResponse.json(
      {
        error: "invalid_center",
        message: "Provide lat/lon or a slug with known coordinates.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json(result, { status: 200 });
}
