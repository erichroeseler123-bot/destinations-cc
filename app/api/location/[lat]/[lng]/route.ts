import { NextRequest, NextResponse } from "next/server";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "location";
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

type RouteContext = {
  params: Promise<{ lat: string; lng: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const raw = await context.params;
  const lat = parseCoordinate(raw.lat, -90, 90);
  const lng = parseCoordinate(raw.lng, -180, 180);

  if (lat == null || lng == null) {
    return NextResponse.json(
      { ok: false, schema: "dcc-location-v1", error: "Valid latitude (-90..90) and longitude (-180..180) are required." },
      { status: 400, headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } },
    );
  }

  const origin = request.nextUrl.origin;
  const canonicalLat = canonical(lat);
  const canonicalLng = canonical(lng);
  const canonicalPage = `/location/${canonicalLat}/${canonicalLng}`;
  const canonicalApi = `/api/location/${canonicalLat}/${canonicalLng}`;
  let location: any = null;

  try {
    const reverseUrl = new URL("/api/public/location-resolve", origin);
    reverseUrl.searchParams.set("lat", String(lat));
    reverseUrl.searchParams.set("lng", String(lng));
    const reverse = await fetchJson(reverseUrl.toString());
    location = Array.isArray(reverse?.results) ? reverse.results[0] || null : null;
  } catch {
    location = null;
  }

  const cityName = location?.city || location?.name || "location";
  const liveUrl = new URL("/api/public/city-live", origin);
  liveUrl.searchParams.set("city", slugify(cityName));
  liveUrl.searchParams.set("lat", String(lat));
  liveUrl.searchParams.set("lng", String(lng));
  liveUrl.searchParams.set("timezone", request.nextUrl.searchParams.get("timezone") || "auto");

  const common = {
    schema: "dcc-location-v1",
    schemaVersion: 1,
    coordinate: { lat, lng, precision_decimals: 5 },
    location: location || {
      id: `coordinate:${canonicalLat}:${canonicalLng}`,
      name: "Coordinate location",
      displayName: `${canonicalLat}, ${canonicalLng}`,
      lat,
      lng,
    },
    canonical: {
      page: canonicalPage,
      api: canonicalApi,
      absolutePage: `${origin}${canonicalPage}`,
      absoluteApi: `${origin}${canonicalApi}`,
    },
    discovery: {
      agent: `${origin}/agent.json`,
      llms: `${origin}/llms.txt`,
      openapi: `${origin}/openapi.json`,
      developers: `${origin}/developers`,
    },
  };

  try {
    const live = await fetchJson(liveUrl.toString());
    return NextResponse.json(
      {
        ok: true,
        ...common,
        checkedAt: live?.checkedAt || new Date().toISOString(),
        cityNow: live?.cityNow || null,
        weather: live?.weather || null,
        events: live?.ticketmaster || null,
        machineFeeds: live?.machineFeeds || [],
        providerSlots: live?.providerSlots || {},
        officialLiveLinks: live?.officialLiveLinks || [],
        districtNow: live?.districtNow || null,
        districtIntents: live?.districtIntents || [],
        policy: {
          dynamicDataStored: false,
          cache: "no-store",
          coordinateIsCanonicalKey: true,
          interpretation:
            "This response aggregates current public or configured machine-readable sources for this coordinate. Missing modules indicate unavailable mapped coverage, not proof of absence in the physical world.",
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Access-Control-Allow-Origin": "*",
          "X-DCC-Schema": "dcc-location-v1",
          "X-DCC-Coordinate": `${canonicalLat},${canonicalLng}`,
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        ...common,
        checkedAt: new Date().toISOString(),
        error: "Live location sources are temporarily unavailable.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          "X-DCC-Schema": "dcc-location-v1",
        },
      },
    );
  }
}
