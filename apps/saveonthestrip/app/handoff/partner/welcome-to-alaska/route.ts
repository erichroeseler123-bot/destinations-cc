import { NextRequest, NextResponse } from "next/server";
import { buildDccReturnUrl, emitDccEvent, getHandoffIdFromSearchParams } from "@/lib/dcc";

export async function GET(request: NextRequest) {
  const handoffId = getHandoffIdFromSearchParams(request.nextUrl.searchParams);
  if (!handoffId) {
    return NextResponse.json({ ok: false, error: "missing_handoff_id" }, { status: 400 });
  }

  const wtaUrl = new URL("https://welcometoalaskatours.com/handoff/dcc");
  wtaUrl.searchParams.set("dcc_handoff_id", handoffId);
  wtaUrl.searchParams.set("source", "dcc");
  wtaUrl.searchParams.set("source_slug", "saveonthestrip-network-forward");
  wtaUrl.searchParams.set("source_page", "/handoff/partner/welcome-to-alaska");
  wtaUrl.searchParams.set("topic", "shore-excursions");
  wtaUrl.searchParams.set("port", request.nextUrl.searchParams.get("port") || "juneau-alaska");
  wtaUrl.searchParams.set("partner_satellite", "saveonthestrip");
  wtaUrl.searchParams.set("partner_reason", "traveler_reuse");
  wtaUrl.searchParams.set("partner_handoff_id", handoffId);
  wtaUrl.searchParams.set(
    "dcc_return",
    request.nextUrl.searchParams.get("dcc_return") || buildDccReturnUrl("/vegas", handoffId)
  );

  await emitDccEvent({
    handoffId,
    satelliteId: "saveonthestrip",
    eventType: "forwarded_to_partner",
    source: "saveonthestrip",
    sourcePath: "/handoff/partner/welcome-to-alaska",
    status: "forwarded",
    stage: "partner_handoff",
    attribution: {
      sourceSlug: "saveonthestrip-network-forward",
      sourcePage: "/handoff/partner/welcome-to-alaska",
      topicSlug: "shore-excursions",
    },
    booking: {
      citySlug: "las-vegas",
      portSlug: request.nextUrl.searchParams.get("port") || "juneau-alaska",
    },
    partner: {
      fromSite: "saveonthestrip",
      toSite: "welcome-to-alaska",
      partnerHandoffId: handoffId,
      reason: "traveler_reuse",
    },
  });

  return NextResponse.redirect(wtaUrl);
}
