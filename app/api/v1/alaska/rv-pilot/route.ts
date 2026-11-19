import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ALASKA_RV_CONTRACT_VERSION,
  ALASKA_RV_PLANNER_INTEGRATION_CONTRACT_VERSION,
} from "@/lib/dcc/shared/alaskaRvContract";
import { getAlaskaRvPilotSnapshot } from "@/lib/dcc/shared/alaskaRvKenaiPilotData";

export const dynamic = "force-dynamic";

const BASE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
  "Access-Control-Expose-Headers":
    "ETag, X-DCC-Alaska-RV-Schema, X-DCC-CP-RV-Integration-Contract, X-Robots-Tag",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "X-Robots-Tag": "noindex, nofollow",
  "X-DCC-Alaska-RV-Schema": ALASKA_RV_CONTRACT_VERSION,
  "X-DCC-CP-RV-Integration-Contract": ALASKA_RV_PLANNER_INTEGRATION_CONTRACT_VERSION,
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: BASE_HEADERS });
}

async function handleRequest(request: NextRequest, headOnly: boolean) {
  const { searchParams } = new URL(request.url);
  const placeParam = (searchParams.get("place") || "").trim().toLowerCase();
  const includeHeldParam = searchParams.get("includeHeld");
  const includeHeld =
    includeHeldParam === null
      ? false
      : includeHeldParam !== "0" && includeHeldParam !== "false";

  const snapshot = getAlaskaRvPilotSnapshot();

  if (placeParam) {
    const matchedPlace = snapshot.places.find(
      (p) => p.slug.toLowerCase() === placeParam || p.placeId.toLowerCase() === placeParam,
    );
    if (!matchedPlace) {
      return NextResponse.json(
        {
          ok: false,
          error: `Unknown Alaska RV pilot place "${placeParam}".`,
        },
        { status: 404, headers: BASE_HEADERS },
      );
    }
  }

  const targetPlaceIds = placeParam
    ? new Set(
        snapshot.places
          .filter((p) => p.slug.toLowerCase() === placeParam || p.placeId.toLowerCase() === placeParam)
          .map((p) => p.placeId),
      )
    : null;

  const filteredOperators = snapshot.rentalOperators.filter((op) => {
    if (!includeHeld && op.publicationStatus !== "published_pilot") return false;
    if (targetPlaceIds && !targetPlaceIds.has(op.depotPlaceId)) return false;
    return true;
  });

  const filteredCampgrounds = snapshot.campgrounds.filter((cg) => {
    if (targetPlaceIds && !targetPlaceIds.has(cg.placeId)) return false;
    return true;
  });

  const filteredServiceStops = snapshot.serviceStops.filter((st) => {
    if (targetPlaceIds && !targetPlaceIds.has(st.placeId)) return false;
    return true;
  });

  const filteredActivities = snapshot.activities.filter((act) => {
    if (targetPlaceIds && !targetPlaceIds.has(act.placeId)) return false;
    return true;
  });

  const bodyObj = {
    ok: true,
    ...snapshot,
    places: targetPlaceIds
      ? snapshot.places.filter((p) => targetPlaceIds.has(p.placeId))
      : snapshot.places,
    rentalOperators: filteredOperators,
    campgrounds: filteredCampgrounds,
    serviceStops: filteredServiceStops,
    activities: filteredActivities,
  };

  const rawJson = JSON.stringify(bodyObj);
  const etag = `"sha256-${crypto.createHash("sha256").update(rawJson).digest("hex")}"`;
  const headers = { ...BASE_HEADERS, ETag: etag };

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  if (headOnly) {
    return new NextResponse(null, { status: 200, headers });
  }

  return new NextResponse(rawJson, {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function GET(request: NextRequest) {
  return handleRequest(request, false);
}

export async function HEAD(request: NextRequest) {
  return handleRequest(request, true);
}
