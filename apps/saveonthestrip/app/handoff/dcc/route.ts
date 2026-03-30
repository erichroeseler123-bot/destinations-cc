import { NextRequest, NextResponse } from "next/server";
import { emitDccEvent, getHandoffIdFromSearchParams } from "@/lib/dcc";

export async function GET(request: NextRequest) {
  const handoffId = getHandoffIdFromSearchParams(request.nextUrl.searchParams);
  if (!handoffId) {
    return NextResponse.json({ ok: false, error: "missing_handoff_id" }, { status: 400 });
  }

  await emitDccEvent({
    handoffId,
    satelliteId: "saveonthestrip",
    eventType: "handoff_viewed",
    source: "saveonthestrip",
    sourcePath: "/handoff/dcc",
    status: "received",
    stage: "landing",
    attribution: {
      sourceSlug: request.nextUrl.searchParams.get("source_slug") || undefined,
      sourcePage: request.nextUrl.searchParams.get("source_page") || undefined,
      topicSlug: request.nextUrl.searchParams.get("topic") || undefined,
    },
    booking: {
      citySlug: "las-vegas",
      eventDate: request.nextUrl.searchParams.get("date") || undefined,
    },
  });

  return NextResponse.redirect(new URL("/", request.url));
}
