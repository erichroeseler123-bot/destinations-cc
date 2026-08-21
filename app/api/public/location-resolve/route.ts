import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USER_AGENT = "DestinationCommandCenter/1.0 (https://destinationcommandcenter.com)";

function validCoordinate(value: string | null, min: number, max: number) {
  if (value == null || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function cityFromAddress(address: Record<string, unknown> | undefined) {
  if (!address) return null;
  for (const key of ["city", "town", "village", "municipality", "county"]) {
    const value = address[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function regionFromAddress(address: Record<string, unknown> | undefined) {
  if (!address) return null;
  for (const key of ["state", "region", "state_district"]) {
    const value = address[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeResult(row: any) {
  const lat = Number(row?.lat);
  const lng = Number(row?.lon);
  const address = row?.address && typeof row.address === "object" ? row.address : undefined;
  return {
    id: String(row?.place_id || row?.osm_id || `${lat}:${lng}`),
    name: cityFromAddress(address) || String(row?.name || row?.display_name || "Selected location").split(",")[0],
    displayName: String(row?.display_name || row?.name || "Selected location"),
    city: cityFromAddress(address),
    region: regionFromAddress(address),
    country: typeof address?.country === "string" ? address.country : null,
    countryCode: typeof address?.country_code === "string" ? address.country_code.toUpperCase() : null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    type: row?.type || row?.category || null,
  };
}

async function fetchNominatim(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`nominatim_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = (searchParams.get("q") || "").trim().slice(0, 180);
  const lat = validCoordinate(searchParams.get("lat"), -90, 90);
  const lng = validCoordinate(searchParams.get("lng"), -180, 180);

  try {
    if (lat != null && lng != null) {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lng));
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("zoom", "12");
      const row = await fetchNominatim(url);
      return NextResponse.json(
        { ok: true, mode: "reverse", results: [normalizeResult(row)] },
        { headers: { "Cache-Control": "private, max-age=0, no-store" } },
      );
    }

    if (!q) {
      return NextResponse.json({ ok: false, error: "Provide q or valid lat/lng." }, { status: 400 });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", q);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    const rows = await fetchNominatim(url);
    const results = (Array.isArray(rows) ? rows : [])
      .map(normalizeResult)
      .filter((result) => typeof result.lat === "number" && typeof result.lng === "number");

    return NextResponse.json(
      { ok: true, mode: "search", query: q, results },
      { headers: { "Cache-Control": "private, max-age=0, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "location_lookup_failed" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
