import { NextRequest, NextResponse } from "next/server";
import { matchToursForTrip, type TripMatchRequest } from "@/lib/dcc/catalog/matcher";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-DCC-Client-Id",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function parseBooleanParam(val: string | null): boolean | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const norm = val.trim().toLowerCase();
  if (norm === "true" || norm === "1" || norm === "yes") return true;
  if (norm === "false" || norm === "0" || norm === "no") return false;
  return undefined;
}

function parseNumberParam(val: string | null): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const childAgesRaw = sp.get("childAges") || sp.get("childrenAges") || "";
    const childAges = childAgesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 17);

    const approvedRaw = sp.get("approvedTourIds") || "";
    const approvedTourIds = approvedRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const matchReq: TripMatchRequest = {
      destination: sp.get("destination") || sp.get("port") || sp.get("portSlug") || "new-orleans",
      portSlug: sp.get("portSlug") || sp.get("port") || undefined,
      date: sp.get("date") || undefined,
      adults: parseNumberParam(sp.get("adults")),
      childAges,
      seniors: parseNumberParam(sp.get("seniors")),
      infants: parseNumberParam(sp.get("infants")),
      youths: parseNumberParam(sp.get("youths")),
      requiresHotelPickup: parseBooleanParam(sp.get("requiresHotelPickup")),
      hotelName: sp.get("hotelName") || undefined,
      hotelLat: parseNumberParam(sp.get("hotelLat")),
      hotelLng: parseNumberParam(sp.get("hotelLng")),
      approvedTourIds: approvedTourIds.length > 0 ? approvedTourIds : undefined,
      category: sp.get("category") || undefined,
      maxPassengerWeightLbs: parseNumberParam(sp.get("maxPassengerWeightLbs")),
      requiresWheelchair: parseBooleanParam(sp.get("requiresWheelchair")),
      shipArrival: sp.get("shipArrival") || undefined,
      shipDeparture: sp.get("shipDeparture") || undefined,
      allAboardTime: sp.get("allAboardTime") || undefined,
      flightArrivalTime: sp.get("flightArrivalTime") || undefined,
      surface: (sp.get("surface") as TripMatchRequest["surface"]) || "dcc",
      propertySlug: sp.get("propertySlug") || undefined,
      enableShortlistLiveCheck: parseBooleanParam(sp.get("enableShortlistLiveCheck")),
      shortlistMaxCount: parseNumberParam(sp.get("shortlistMaxCount")),
      includeDiscoveryOnly: parseBooleanParam(sp.get("includeDiscoveryOnly")),
      limit: parseNumberParam(sp.get("limit")),
      isTest: parseBooleanParam(sp.get("isTest")),
    };

    const result = await matchToursForTrip(matchReq);
    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "trip_match_failed",
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<TripMatchRequest>;
    const matchReq: TripMatchRequest = {
      destination: body.destination || body.portSlug || "new-orleans",
      portSlug: body.portSlug,
      date: body.date,
      adults: body.adults,
      childAges: Array.isArray(body.childAges) ? body.childAges : [],
      seniors: body.seniors,
      infants: body.infants,
      youths: body.youths,
      requiresHotelPickup: body.requiresHotelPickup,
      hotelName: body.hotelName,
      hotelLat: body.hotelLat,
      hotelLng: body.hotelLng,
      approvedTourIds: body.approvedTourIds,
      category: body.category,
      maxPassengerWeightLbs: body.maxPassengerWeightLbs,
      requiresWheelchair: body.requiresWheelchair,
      shipArrival: body.shipArrival,
      shipDeparture: body.shipDeparture,
      allAboardTime: body.allAboardTime,
      flightArrivalTime: body.flightArrivalTime,
      surface: body.surface || "dcc",
      propertySlug: body.propertySlug,
      enableShortlistLiveCheck: body.enableShortlistLiveCheck,
      shortlistMaxCount: body.shortlistMaxCount,
      includeDiscoveryOnly: body.includeDiscoveryOnly,
      limit: body.limit,
      isTest: body.isTest,
    };

    const result = await matchToursForTrip(matchReq);
    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "trip_match_failed",
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
