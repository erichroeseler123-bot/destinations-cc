import { NextRequest, NextResponse } from "next/server";
import { emitDccEvent, getHandoffIdFromSearchParams } from "@/lib/dcc";
import { resolveTourOutboundDestination } from "@/lib/outbound";

export const runtime = "nodejs";

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const resolved = resolveTourOutboundDestination(sp.get("target"));

  if (!resolved.ok) {
    return NextResponse.json(
      { ok: false, error: resolved.error },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const handoffId =
    getHandoffIdFromSearchParams(sp) || `sots-clickout-${Date.now()}`;
  const sourcePath = sp.get("sourcePath") || "/tours";
  const sourceSlug = sp.get("sourceSlug") || "saveonthestrip-tours";
  const sourcePage = sp.get("sourcePage") || sourcePath;
  const topicSlug = sp.get("topicSlug") || "vegas-tours";
  const productSlug = sp.get("productSlug") || undefined;
  const eventDate = sp.get("eventDate") || sp.get("date") || undefined;
  const quantity = parsePositiveInt(sp.get("partySize") || sp.get("party_size"));

  try {
    await emitDccEvent({
      handoffId,
      satelliteId: "saveonthestrip",
      eventType: "tour_clickout",
      source: "saveonthestrip",
      sourcePath,
      status: "clickout",
      stage: "tour_operator",
      attribution: {
        sourceSlug,
        sourcePage,
        topicSlug,
      },
      booking: {
        citySlug: "las-vegas",
        productSlug,
        eventDate,
        quantity,
      },
      metadata: {
        company: sp.get("company") || undefined,
        itemPk: sp.get("itemPk") || undefined,
        area: sp.get("area") || undefined,
        affiliateWrapped: resolved.affiliateWrapped,
      },
    });
  } catch {
    // Never block a traveler's booking clickout if telemetry is unreachable.
  }

  const response = NextResponse.redirect(resolved.destination, 307);
  response.headers.set("cache-control", "no-store");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  return response;
}
