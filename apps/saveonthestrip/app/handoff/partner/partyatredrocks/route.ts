import { NextRequest, NextResponse } from "next/server";
import { buildDccReturnUrl, emitDccEvent, getHandoffIdFromSearchParams } from "@/lib/dcc";

export async function GET(request: NextRequest) {
  const handoffId = getHandoffIdFromSearchParams(request.nextUrl.searchParams);
  if (!handoffId) {
    return NextResponse.json({ ok: false, error: "missing_handoff_id" }, { status: 400 });
  }

  const parrUrl = new URL("https://www.partyatredrocks.com/book/red-rocks-amphitheatre");
  parrUrl.searchParams.set("dcc_handoff_id", handoffId);
  parrUrl.searchParams.set("source", "dcc");
  parrUrl.searchParams.set("source_slug", "saveonthestrip-network-forward");
  parrUrl.searchParams.set("source_page", "/handoff/partner/partyatredrocks");
  parrUrl.searchParams.set("topic", "concert-transport");
  parrUrl.searchParams.set("venue", "red-rocks-amphitheatre");
  parrUrl.searchParams.set("partner_satellite", "saveonthestrip");
  parrUrl.searchParams.set("partner_reason", "traveler_reuse");
  parrUrl.searchParams.set("partner_handoff_id", handoffId);
  parrUrl.searchParams.set(
    "dcc_return",
    request.nextUrl.searchParams.get("dcc_return") || buildDccReturnUrl("/vegas", handoffId)
  );

  await emitDccEvent({
    handoffId,
    satelliteId: "saveonthestrip",
    eventType: "forwarded_to_partner",
    source: "saveonthestrip",
    sourcePath: "/handoff/partner/partyatredrocks",
    status: "forwarded",
    stage: "partner_handoff",
    attribution: {
      sourceSlug: "saveonthestrip-network-forward",
      sourcePage: "/handoff/partner/partyatredrocks",
      topicSlug: "concert-transport",
    },
    booking: {
      citySlug: "las-vegas",
      venueSlug: "red-rocks-amphitheatre",
    },
    partner: {
      fromSite: "saveonthestrip",
      toSite: "partyatredrocks",
      partnerHandoffId: handoffId,
      reason: "traveler_reuse",
    },
  });

  return NextResponse.redirect(parrUrl);
}
