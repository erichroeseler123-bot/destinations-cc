import { NextResponse } from "next/server";
import { buildInternalPlacePayload } from "@/lib/dcc/internal/placePayload";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ place: string }> }
) {
  const resolvedParams = await params;
  const place = resolvedParams.place;
  const payload = await buildInternalPlacePayload(place);

  if (!payload) {
    return NextResponse.json(
      { error: "place_not_found", place },
      { status: 404 }
    );
  }

  return NextResponse.json(payload, { status: 200 });
}
