import { NextResponse } from "next/server";
import { getPlaceLiveSummary } from "@/lib/dcc/graph/placeLiveSummary";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ place: string }> }
) {
  const resolved = await params;
  const summary = await getPlaceLiveSummary(resolved.place);
  if (!summary) {
    return NextResponse.json(
      { error: "place_live_summary_not_found", place: resolved.place },
      { status: 404 }
    );
  }
  return NextResponse.json(summary, { status: 200 });
}
