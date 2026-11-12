import { NextRequest, NextResponse } from "next/server";
import {
  buildLfsePublicJuneauAvailabilityView,
  loadLfseJuneauNormalizedSupplierFeed,
} from "@/lib/dccJuneauSupplierFeed";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawDate = (searchParams.get("date") || "").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : "2027-07-15";
  const activitySlug = (searchParams.get("activity") || "").trim() || undefined;
  const rawParty = searchParams.get("partySize");
  const parsedParty =
    rawParty !== null && rawParty.trim() !== ""
      ? Number.parseInt(rawParty.trim(), 10)
      : null;
  const partySize =
    typeof parsedParty === "number" && Number.isFinite(parsedParty) && parsedParty >= 1
      ? Math.min(99, parsedParty)
      : null;
  const shipArrivalTime =
    (searchParams.get("shipArrival") || searchParams.get("claa_arrival") || "").trim() || null;
  const shipAllAboardTime =
    (searchParams.get("allAboard") || searchParams.get("all_aboard") || "").trim() || null;

  const feed = await loadLfseJuneauNormalizedSupplierFeed({
    date,
    activitySlug,
    shipArrivalTime: shipArrivalTime || undefined,
    shipAllAboardTime: shipAllAboardTime || undefined,
    revalidateSeconds: 120,
  });

  const view = buildLfsePublicJuneauAvailabilityView(feed, {
    partySize,
    shipArrivalTime,
    shipAllAboardTime,
    allAboardConfirmed: Boolean(shipAllAboardTime),
  });
  return NextResponse.json(view, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const rawDate = typeof body.date === "string" ? body.date.trim() : "";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : "2027-07-15";
    const activitySlug =
      typeof body.activity === "string" && body.activity.trim()
        ? body.activity.trim()
        : undefined;
    const rawParty = Number(body.partySize);
    const partySize =
      Number.isFinite(rawParty) && rawParty >= 1 ? Math.min(99, Math.trunc(rawParty)) : 1;
    const cardId = typeof body.cardId === "string" ? body.cardId.trim() : "";
    const rezgoUid = typeof body.rezgoUid === "string" ? body.rezgoUid.trim() : "";
    const departureTime24 =
      typeof body.departureTime24 === "string" ? body.departureTime24.trim() : "";
    const shipArrivalTime =
      typeof body.shipArrival === "string" && body.shipArrival.trim()
        ? body.shipArrival.trim()
        : null;
    const shipAllAboardTime =
      typeof body.allAboard === "string" && body.allAboard.trim()
        ? body.allAboard.trim()
        : null;

    // Bypass local cache right before opening checkout so we verify live availability
    const freshFeed = await loadLfseJuneauNormalizedSupplierFeed({
      date,
      activitySlug,
      shipArrivalTime: shipArrivalTime || undefined,
      shipAllAboardTime: shipAllAboardTime || undefined,
      bypassCache: true,
    });

    const refreshedView = buildLfsePublicJuneauAvailabilityView(freshFeed, {
      partySize,
      shipArrivalTime,
      shipAllAboardTime,
      allAboardConfirmed: Boolean(shipAllAboardTime),
    });
    const matchedCard = refreshedView.cards.find((c) => c.cardId === cardId);
    const allQualifyingDeps = matchedCard
      ? [
          ...matchedCard.recommendedDepartures,
          ...matchedCard.confirmTimingDepartures,
          ...matchedCard.otherAvailableTimes,
        ]
      : [];
    const matchedDep = allQualifyingDeps.find(
      (d) =>
        (rezgoUid && d.rezgoUid === rezgoUid) ||
        (!rezgoUid && departureTime24 && d.departureTime24 === departureTime24),
    );

    const noun = partySize === 1 ? "person" : "people";
    if (!matchedDep || !matchedDep.checkoutHref) {
      return NextResponse.json(
        {
          ok: true,
          available: false,
          partySize,
          message: `No departure currently has enough availability for ${partySize} ${noun}.`,
          checkoutHref: null,
          refreshedView,
        },
        { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        available: true,
        partySize,
        message: `Available for your group of ${partySize}`,
        checkoutHref: matchedDep.checkoutHref,
        requiresReducedBufferConfirmation: matchedDep.requiresReducedBufferConfirmation,
        reducedBufferWarningLabel: matchedDep.requiresReducedBufferConfirmation
          ? matchedDep.timingStatusLabel
          : null,
        refreshedView,
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        available: false,
        message: "Unable to verify live availability right now. Please try again.",
        checkoutHref: null,
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
