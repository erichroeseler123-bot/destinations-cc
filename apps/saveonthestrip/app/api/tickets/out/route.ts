import { NextRequest, NextResponse } from "next/server";
import { emitDccEvent, getHandoffIdFromSearchParams } from "@/lib/dcc";
import { resolveTicketOutboundDestination } from "@/lib/outbound";

export const runtime = "nodejs";

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const resolved = resolveTicketOutboundDestination(
    sp.get("target"),
    sp.get("affiliateTarget"),
  );

  if (!resolved.ok) {
    return NextResponse.json(
      { ok: false, error: resolved.error },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const handoffId =
    getHandoffIdFromSearchParams(sp) || `sots-clickout-${Date.now()}`;
  const sourcePath = sp.get("sourcePath") || "/shows";
  const sourceSlug = sp.get("sourceSlug") || "saveonthestrip-shows";
  const sourcePage = sp.get("sourcePage") || sourcePath;
  const topicSlug = sp.get("topicSlug") || "vegas-shows";
  const eventDate = sp.get("eventDate") || undefined;
  const quantity = parsePositiveInt(sp.get("partySize") || sp.get("party_size"));

  try {
    await emitDccEvent({
      handoffId,
      satelliteId: "saveonthestrip",
      eventType: "ticket_clickout",
      source: "saveonthestrip",
      sourcePath,
      status: "clickout",
      stage: "ticket_affiliate",
      attribution: {
        sourceSlug,
        sourcePage,
        topicSlug,
      },
      booking: {
        citySlug: "las-vegas",
        eventDate,
        quantity,
      },
      metadata: {
        affiliateTarget: resolved.provider,
        eventId: sp.get("eventId") || undefined,
        eventName: sp.get("eventName") || undefined,
        affiliateWrapped: resolved.affiliateWrapped,
      },
    });
  } catch {
    // Never block a traveler's ticket clickout if telemetry is unreachable.
  }

  const response = NextResponse.redirect(resolved.destination, 307);
  response.headers.set("cache-control", "no-store");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  return response;
}
