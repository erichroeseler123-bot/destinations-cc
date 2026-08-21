import { NextRequest, NextResponse } from "next/server";
import { logDiscoveryRequest } from "@/lib/dcc/discoveryTelemetry";
import { isIndexableCoordinate } from "@/lib/dcc/locationDiscovery";
import { readLocationIntelligence } from "@/lib/dcc/locationIntelligence";
import { normalizeGaugeStatuses, readHydroMarine } from "@/lib/dcc/hydroMarine";
import { readExtendedCoordinateFeeds } from "@/lib/dcc/extendedCoordinateFeeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NATURAL_EVENT_RELEVANCE_KM = 500;

type Scope = "core" | "extended" | "full";

function parseCoordinate(value: string, min: number, max: number) {
  const decoded = decodeURIComponent(value);
  if (!/^-?\d+(?:\.\d+)?$/.test(decoded)) return null;
  const number = Number(decoded);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function canonical(value: number) {
  return value.toFixed(5);
}

function requestedScope(request: NextRequest): Scope {
  const explicit = request.nextUrl.searchParams.get("scope");
  if (explicit === "core" || explicit === "extended" || explicit === "full") return explicit;
  const sameOriginBrowserFetch = request.headers.get("sec-fetch-site") === "same-origin";
  return sameOriginBrowserFetch ? "core" : "full";
}

async function readOptionalLegacy(origin: string, lat: number, lng: number, timezone: string) {
  const url = new URL("/api/public/city-live", origin);
  url.searchParams.set("city", "location");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("timezone", timezone || "auto");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
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
  const startedAt = Date.now();
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
  const scope = requestedScope(request);

  logDiscoveryRequest({
    surface: "location_api",
    path: canonicalApi,
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
    coordinate: `${canonicalLat},${canonicalLng}`,
    indexable,
  });

  console.log(JSON.stringify({
    level: "info",
    msg: "dcc_location_start",
    route: canonicalApi,
    coordinate: `${canonicalLat},${canonicalLng}`,
    scope,
    requestId: request.headers.get("x-vercel-id"),
  }));

  try {
    const intelligencePromise = readLocationIntelligence({ lat, lng });
    const enrichmentPromise = scope === "core"
      ? Promise.resolve([
          { river: null, marine: null, sources: [] },
          { nearby: [], aviation: [], coastal: { coops: [], ndbc: [] }, sources: [] },
          null,
        ] as const)
      : Promise.all([
          readHydroMarine({ lat, lng }),
          readExtendedCoordinateFeeds({ lat, lng }),
          readOptionalLegacy(origin, lat, lng, request.nextUrl.searchParams.get("timezone") || "auto"),
        ]);

    const [intelligence, enrichment] = await Promise.all([intelligencePromise, enrichmentPromise]);
    const [hydroMarine, extended, legacy] = enrichment as any;

    const normalizedGauges = (intelligence.water.nearbyGauges || []).map(normalizeGaugeStatuses);
    const naturalEvents = (intelligence.hazards.naturalEvents || []).filter(
      (event: any) => Number.isFinite(event?.distanceKm) && event.distanceKm <= NATURAL_EVENT_RELEVANCE_KM,
    );
    const hazards = { ...intelligence.hazards, naturalEvents };
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
      coops: extended.coastal?.coops || [],
      ndbc: extended.coastal?.ndbc || [],
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
    const sources = [...intelligence.sources, ...(hydroMarine.sources || []), ...(extended.sources || [])];

    const payload = {
      ok: true,
      schema: "dcc-location-v2",
      schemaVersion: 2,
      scope,
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
        hazards,
        water,
        winter,
        nearby: extended.nearby || [],
        aviation: extended.aviation || [],
        coastal: extended.coastal || { coops: [], ndbc: [] },
        official: intelligence.official,
        events: legacy?.ticketmaster || null,
        machineFeeds: legacy?.machineFeeds || [],
        providerSlots: legacy?.providerSlots || {},
        officialLiveLinks: legacy?.officialLiveLinks || [],
      },
      weather: now.weather,
      alerts: hazards.alerts,
      earthquakes: hazards.earthquakes,
      events: legacy?.ticketmaster || null,
      machineFeeds: legacy?.machineFeeds || [],
      providerSlots: legacy?.providerSlots || {},
      nearby: extended.nearby || [],
      aviation: extended.aviation || [],
      coastal: extended.coastal || { coops: [], ndbc: [] },
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
        responseCacheSeconds: scope === "core" ? 120 : 60,
        machineApiReverseGeocoding: false,
        marineRequiresLocalNonNullModelData: true,
        naturalEventRelevanceKm: NATURAL_EVENT_RELEVANCE_KM,
        nearbyInfrastructureIsBoundedAndCached: true,
        trafficRequiresEfficientRegionalPublicCoverage: true,
        browserCoreFirst: true,
        fullMachineContractByDefaultForDirectRequests: true,
        interpretation:
          "DCC assembles current public machine-readable context for this coordinate. Missing modules indicate unavailable mapped coverage, not proof that a real-world phenomenon is absent.",
      },
    };

    console.log(JSON.stringify({
      level: "info",
      msg: "dcc_location_done",
      route: canonicalApi,
      coordinate: `${canonicalLat},${canonicalLng}`,
      scope,
      ms: Date.now() - startedAt,
      sourceCount: sources.length,
    }));

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": scope === "core"
          ? "public, max-age=30, s-maxage=120, stale-while-revalidate=300"
          : "public, max-age=15, s-maxage=60, stale-while-revalidate=240",
        "Access-Control-Allow-Origin": "*",
        "X-DCC-Schema": "dcc-location-v2",
        "X-DCC-Scope": scope,
        "X-DCC-Coordinate": `${canonicalLat},${canonicalLng}`,
        "X-DCC-Natural-Event-Relevance-Km": String(NATURAL_EVENT_RELEVANCE_KM),
      },
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      msg: "dcc_location_failed",
      route: canonicalApi,
      coordinate: `${canonicalLat},${canonicalLng}`,
      scope,
      ms: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      {
        ok: false,
        schema: "dcc-location-v2",
        schemaVersion: 2,
        scope,
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
      { status: 503, headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "X-DCC-Schema": "dcc-location-v2", "X-DCC-Scope": scope } },
    );
  }
}
