import { NextRequest, NextResponse } from "next/server";
import { logDiscoveryRequest } from "@/lib/dcc/discoveryTelemetry";
import { isIndexableCoordinate } from "@/lib/dcc/locationDiscovery";
import { readLocationIntelligence } from "@/lib/dcc/locationIntelligence";
import { normalizeGaugeStatuses, readHydroMarine } from "@/lib/dcc/hydroMarine";
import { readExtendedCoordinateFeeds } from "@/lib/dcc/extendedCoordinateFeeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseCoordinate(value: string, min: number, max: number) {
  const decoded = decodeURIComponent(value);
  if (!/^-?\d+(?:\.\d+)?$/.test(decoded)) return null;
  const number = Number(decoded);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function canonical(value: number) {
  return value.toFixed(5);
}

async function readOptionalLegacy(origin: string, lat: number, lng: number, timezone: string) {
  const url = new URL("/api/public/city-live", origin);
  url.searchParams.set("city", "location");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("timezone", timezone || "auto");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 120 },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

type RouteContext = { params: Promise<{ lat: string; lng: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const raw = await context.params;
  const lat = parseCoordinate(raw.lat, -90, 90);
  const lng = parseCoordinate(raw.lng, -180, 180);

  if (lat == null || lng == null) {
    return NextResponse.json(
      { ok: false, schema: "dcc-location-v2", error: "Valid latitude (-90..90) and longitude (-180..180) are required." },
      { status: 400, headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } },
    );
  }

  const origin = request.nextUrl.origin;
  const canonicalLat = canonical(lat);
  const canonicalLng = canonical(lng);
  const canonicalPage = `/location/${canonicalLat}/${canonicalLng}`;
  const canonicalApi = `/api/location/${canonicalLat}/${canonicalLng}`;
  const indexable = isIndexableCoordinate(lat, lng);

  logDiscoveryRequest({
    surface: "location_api",
    path: canonicalApi,
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
    coordinate: `${canonicalLat},${canonicalLng}`,
    indexable,
  });

  try {
    const [intelligence, hydroMarine, extended, legacy] = await Promise.all([
      readLocationIntelligence({ lat, lng }),
      readHydroMarine({ lat, lng }),
      readExtendedCoordinateFeeds({ lat, lng }),
      readOptionalLegacy(origin, lat, lng, request.nextUrl.searchParams.get("timezone") || "auto"),
    ]);

    const normalizedGauges = (intelligence.water.nearbyGauges || []).map(normalizeGaugeStatuses);
    const now = {
      ...intelligence.now,
      marine: hydroMarine.marine?.current || null,
    };
    const conditions = {
      ...intelligence.conditions,
      globalRiverDischarge: hydroMarine.river || null,
      marine: hydroMarine.marine || null,
    };
    const water = {
      ...intelligence.water,
      nearbyGauges: normalizedGauges,
      globalRiverDischarge: hydroMarine.river || null,
      marine: hydroMarine.marine || null,
      coops: extended.coastal.coops,
      ndbc: extended.coastal.ndbc,
    };
    const winterHours = (conditions.next12Hours || []).filter(
      (hour: any) => Number(hour?.snowDepthM || 0) > 0 || Number(hour?.snowfall || 0) > 0,
    );
    const winter = {
      active: Number(now.weather?.snowfall || 0) > 0 || winterHours.length > 0,
      currentSnowfallCm: Number(now.weather?.snowfall || 0),
      maxSnowDepthCm: Math.max(0, ...winterHours.map((hour: any) => Number(hour?.snowDepthM || 0) * 100)),
      hours: winterHours,
    };
    const sources = [...intelligence.sources, ...hydroMarine.sources, ...extended.sources];

    return NextResponse.json(
      {
        ok: true,
        schema: "dcc-location-v2",
        schemaVersion: 2,
        coordinate: { lat, lng, precision_decimals: 5 },
        location: {
          id: `coordinate:${canonicalLat}:${canonicalLng}`,
          name: "Coordinate location",
          displayName: `${canonicalLat}, ${canonicalLng}`,
          lat,
          lng,
          timezone: intelligence.identity.timezone,
          elevationM: intelligence.identity.elevationM,
        },
        canonical: {
          page: canonicalPage,
          api: canonicalApi,
          absolutePage: `${origin}${canonicalPage}`,
          absoluteApi: `${origin}${canonicalApi}`,
        },
        checkedAt: intelligence.checkedAt,
        modules: {
          identity: intelligence.identity,
          now,
          conditions,
          hazards: intelligence.hazards,
          water,
          winter,
          nearby: extended.nearby,
          aviation: extended.aviation,
          coastal: extended.coastal,
          official: intelligence.official,
          events: legacy?.ticketmaster || null,
          machineFeeds: legacy?.machineFeeds || [],
          providerSlots: legacy?.providerSlots || {},
          officialLiveLinks: legacy?.officialLiveLinks || [],
        },
        weather: now.weather,
        alerts: intelligence.hazards.alerts,
        earthquakes: intelligence.hazards.earthquakes,
        events: legacy?.ticketmaster || null,
        machineFeeds: legacy?.machineFeeds || [],
        providerSlots: legacy?.providerSlots || {},
        nearby: extended.nearby,
        aviation: extended.aviation,
        coastal: extended.coastal,
        sources,
        discovery: {
          agent: `${origin}/agent.json`,
          llms: `${origin}/llms.txt`,
          openapi: `${origin}/openapi.json`,
          developers: `${origin}/developers`,
        },
        indexing: {
          eligible: indexable,
          policy: indexable ? "quality-gated-known-location" : "available-but-noindex",
        },
        policy: {
          coordinateIsCanonicalKey: true,
          dynamicFactsMayChange: true,
          sourceSpecificCaching: true,
          responseCacheSeconds: 60,
          machineApiReverseGeocoding: false,
          marineRequiresLocalNonNullModelData: true,
          nearbyInfrastructureIsBoundedAndCached: true,
          trafficRequiresEfficientRegionalPublicCoverage: true,
          interpretation:
            "DCC assembles current public machine-readable context for this coordinate. Missing modules indicate unavailable mapped coverage, not proof that a real-world phenomenon is absent.",
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=15, s-maxage=60, stale-while-revalidate=240",
          "Access-Control-Allow-Origin": "*",
          "X-DCC-Schema": "dcc-location-v2",
          "X-DCC-Coordinate": `${canonicalLat},${canonicalLng}`,
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        schema: "dcc-location-v2",
        schemaVersion: 2,
        coordinate: { lat, lng, precision_decimals: 5 },
        canonical: {
          page: canonicalPage,
          api: canonicalApi,
          absolutePage: `${origin}${canonicalPage}`,
          absoluteApi: `${origin}${canonicalApi}`,
        },
        checkedAt: new Date().toISOString(),
        error: "Location intelligence sources are temporarily unavailable.",
        detail: error instanceof Error ? error.message : undefined,
      },
      { status: 503, headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "X-DCC-Schema": "dcc-location-v2" } },
    );
  }
}
