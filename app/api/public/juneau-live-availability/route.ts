import { NextRequest, NextResponse } from "next/server";
import {
  buildNormalizedJuneauSupplierFeed,
  buildPublicJuneauLiveAvailabilityView,
  revalidatePublicJuneauDepartureBeforeCheckout,
} from "@/lib/dcc/liveSlots/rezgoReadOnly";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, max-age=0",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDate = (searchParams.get("date") || "").trim();
    const serviceDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : "2027-05-24";

    const rawParty = searchParams.get("partySize");
    const parsedParty =
      rawParty !== null && rawParty.trim() !== ""
        ? Number.parseInt(rawParty.trim(), 10)
        : null;
    const partySize =
      typeof parsedParty === "number" && Number.isFinite(parsedParty) && parsedParty >= 1
        ? Math.min(99, parsedParty)
        : null;

    const shipArrival =
      searchParams.get("shipArrival") || searchParams.get("claa_arrival") || null;
    const shipAllAboard =
      searchParams.get("allAboard") || searchParams.get("all_aboard") || null;
    const activitySlug = searchParams.get("activity") || null;
    const rawOrigin = (searchParams.get("surface") || "dcc").trim().toLowerCase();
    const originSurface: "dcc" | "lfse" | "cp" =
      rawOrigin === "lfse" ? "lfse" : rawOrigin === "cp" ? "cp" : "dcc";

    const feed = await buildNormalizedJuneauSupplierFeed({
      searchDate: serviceDate,
      shipArrivalTime: shipArrival,
      shipAllAboardTime: shipAllAboard,
      allAboardConfirmed: Boolean(shipAllAboard),
    });

    const view = buildPublicJuneauLiveAvailabilityView(feed, {
      partySize,
      shipArrivalTime: shipArrival,
      shipAllAboardTime: shipAllAboard,
      allAboardConfirmed: Boolean(shipAllAboard),
      originSurface,
      activitySlug,
    });

    return NextResponse.json(view, { status: 200, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        operatorName: "Juneau Tours & Whale Watch",
        serviceDate: null,
        enteredPartySize: null,
        partySizePrompt: "How many people are going?",
        shipArrivalTime: null,
        shipAllAboardTime: null,
        cards: [],
      },
      { status: 200, headers: CORS_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const rawDate = typeof body.date === "string" ? body.date.trim() : "";
    const serviceDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : "2027-05-24";
    const rawParty = Number(body.partySize);
    const partySize =
      Number.isFinite(rawParty) && rawParty >= 1 ? Math.min(99, Math.trunc(rawParty)) : 1;

    const cardId = typeof body.cardId === "string" ? body.cardId.trim() : null;
    const rezgoUid = typeof body.rezgoUid === "string" ? body.rezgoUid.trim() : null;
    const departureTime24 =
      typeof body.departureTime24 === "string" ? body.departureTime24.trim() : null;
    const shipArrival =
      typeof body.shipArrival === "string" && body.shipArrival.trim()
        ? body.shipArrival.trim()
        : null;
    const shipAllAboard =
      typeof body.allAboard === "string" && body.allAboard.trim()
        ? body.allAboard.trim()
        : null;

    const revalidated = await revalidatePublicJuneauDepartureBeforeCheckout({
      serviceDate,
      partySize,
      cardId,
      rezgoUid,
      departureTime24,
      shipArrivalTime: shipArrival,
      shipAllAboardTime: shipAllAboard,
      allAboardConfirmed: Boolean(shipAllAboard),
    });

    const refreshedFeed = await buildNormalizedJuneauSupplierFeed({
      searchDate: serviceDate,
      shipArrivalTime: shipArrival,
      shipAllAboardTime: shipAllAboard,
      allAboardConfirmed: Boolean(shipAllAboard),
    });
    const refreshedView = buildPublicJuneauLiveAvailabilityView(refreshedFeed, {
      partySize,
      shipArrivalTime: shipArrival,
      shipAllAboardTime: shipAllAboard,
      allAboardConfirmed: Boolean(shipAllAboard),
    });

    return NextResponse.json(
      {
        ...revalidated,
        refreshedView,
      },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        available: false,
        message: "Unable to verify live availability right now. Please try again.",
        checkoutHref: null,
      },
      { status: 200, headers: CORS_HEADERS },
    );
  }
}
