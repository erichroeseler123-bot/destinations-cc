import { NextResponse } from "next/server";
import {
  buildCruisePayload,
  normalizeCruiseSortMode,
} from "@/lib/dcc/internal/cruisePayload";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolved = await params;
  const { searchParams } = new URL(request.url);
  const sortMode = normalizeCruiseSortMode(searchParams.get("sort"));
  const dateStart = searchParams.get("start") || undefined;
  const dateEnd = searchParams.get("end") || undefined;

  const payload = await buildCruisePayload({
    type: "ship",
    value: resolved.slug,
    dateStart,
    dateEnd,
    sortMode,
  });

  return NextResponse.json(payload, { status: 200 });
}
