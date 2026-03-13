import { NextResponse } from "next/server";
import { getPlaceActionGraphBySlug } from "@/lib/dcc/graph/placeActionGraph";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ place: string }> }
) {
  const resolved = await params;
  const graph = getPlaceActionGraphBySlug(resolved.place);
  if (!graph) {
    return NextResponse.json(
      { error: "place_graph_not_found", place: resolved.place },
      { status: 404 }
    );
  }
  return NextResponse.json(graph, { status: 200 });
}
