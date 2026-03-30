import { NextRequest, NextResponse } from "next/server";
import { buildDccReturnUrl, emitDccEvent, getHandoffIdFromSearchParams, getOrCreateHandoffId } from "@/lib/dcc";

export async function GET(request: NextRequest) {
  const handoffId = getOrCreateHandoffId(getHandoffIdFromSearchParams(request.nextUrl.searchParams));
  const dccReturn =
    request.nextUrl.searchParams.get("dcc_return") || buildDccReturnUrl("/red-rocks-shuttle", handoffId);

  await emitDccEvent({
    handoffId,
    satelliteId: "redrocksfastpass",
    eventType: "handoff_viewed",
    source: "redrocksfastpass",
    sourcePath: "/handoff/dcc",
    status: "received",
    stage: "landing",
    attribution: {
      sourceSlug: request.nextUrl.searchParams.get("source_slug") || undefined,
      sourcePage: request.nextUrl.searchParams.get("source_page") || undefined,
      topicSlug: request.nextUrl.searchParams.get("topic") || undefined,
    },
    booking: {
      citySlug: "denver",
      venueSlug: "red-rocks-amphitheatre",
      productSlug: "red-rocks-fast-pass",
      eventDate: request.nextUrl.searchParams.get("date") || undefined,
    },
  });

  const target = new URL("/", request.url);
  target.searchParams.set("dcc_handoff_id", handoffId);
  target.searchParams.set("dcc_return", dccReturn);
  return NextResponse.redirect(target);
}
