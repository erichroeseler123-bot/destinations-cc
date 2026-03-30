import { NextRequest, NextResponse } from "next/server";
import { buildDccReturnUrl, emitDccEvent, getHandoffIdFromSearchParams, getOrCreateHandoffId } from "@/lib/dcc";

export async function GET(request: NextRequest) {
  const handoffId = getOrCreateHandoffId(getHandoffIdFromSearchParams(request.nextUrl.searchParams));
  const parrUrl = new URL("https://www.partyatredrocks.com/book/red-rocks-amphitheatre");
  parrUrl.searchParams.set("dcc_handoff_id", handoffId);
  parrUrl.searchParams.set("source", "redrocksfastpass");
  parrUrl.searchParams.set("source_slug", "redrocksfastpass-network");
  parrUrl.searchParams.set("source_page", "/handoff/partner/partyatredrocks");
  parrUrl.searchParams.set("topic", "concert-transport");
  parrUrl.searchParams.set("partner_satellite", "redrocksfastpass");
  parrUrl.searchParams.set("partner_handoff_id", handoffId);
  parrUrl.searchParams.set(
    "dcc_return",
    request.nextUrl.searchParams.get("dcc_return") || buildDccReturnUrl("/red-rocks-shuttle", handoffId)
  );

  await emitDccEvent({
    handoffId,
    satelliteId: "redrocksfastpass",
    eventType: "forwarded_to_partner",
    source: "redrocksfastpass",
    sourcePath: "/handoff/partner/partyatredrocks",
    status: "redirected",
    stage: "partner_handoff",
    attribution: {
      sourceSlug: request.nextUrl.searchParams.get("source_slug") || "redrocksfastpass-network",
      sourcePage: request.nextUrl.searchParams.get("source_page") || "/checkout",
      topicSlug: request.nextUrl.searchParams.get("topic") || "concert-transport",
    },
    booking: {
      citySlug: "denver",
      venueSlug: "red-rocks-amphitheatre",
      productSlug: "red-rocks-fast-pass",
      eventDate: request.nextUrl.searchParams.get("date") || undefined,
    },
    partner: {
      fromSite: "redrocksfastpass",
      toSite: "partyatredrocks",
      partnerHandoffId: handoffId,
      reason: request.nextUrl.searchParams.get("reason") || "overflow_or_upgrade",
    },
  });

  return NextResponse.redirect(parrUrl);
}
