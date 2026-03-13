import { NextResponse } from "next/server";
import {
  buildCruisePayload,
  normalizeCruiseSortMode,
} from "@/lib/dcc/internal/cruisePayload";
import type { CruisePayload } from "@/lib/dcc/cruise/schema";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ query: string }> }
) {
  const resolved = await params;
  const { searchParams } = new URL(request.url);

  const type = (searchParams.get("type") || "search") as CruisePayload["query"]["type"];
  const sortMode = normalizeCruiseSortMode(searchParams.get("sort"));
  const dateStart = searchParams.get("start") || undefined;
  const dateEnd = searchParams.get("end") || undefined;

  const payload = await buildCruisePayload({
    type,
    value: resolved.query,
    dateStart,
    dateEnd,
    sortMode,
  });
  return NextResponse.json(payload, { status: 200 });
}

export async function POST() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
