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

interface CuratedLocalPlace {
  id: string;
  name: string;
  displayName: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  type: string;
  keywords: string[];
}

const DENVER_RED_ROCKS_LOCAL_PLACES: CuratedLocalPlace[] = [
  {
    id: "dcc-denver-union-station-lodo",
    name: "Union Station / LoDo (Downtown Denver)",
    displayName: "Union Station & LoDo, 1701 Wynkoop St, Denver, CO 80202, USA",
    city: "Denver",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    lat: 39.7527,
    lng: -105.0002,
    type: "neighborhood",
    keywords: ["union station", "lodo", "downtown", "downtown denver", "80202", "wynkoop"],
  },
  {
    id: "dcc-denver-sheraton-downtown",
    name: "Sheraton Denver Downtown Hotel",
    displayName: "Sheraton Denver Downtown Hotel, 1550 Court Pl, Denver, CO 80202, USA",
    city: "Denver",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    lat: 39.7422,
    lng: -104.9892,
    type: "hotel",
    keywords: ["sheraton", "1550 court", "16th street", "80202", "downtown hotel"],
  },
  {
    id: "dcc-denver-rino-five-points",
    name: "RiNo Art District / Five Points",
    displayName: "RiNo Art District, Larimer St, Denver, CO 80205, USA",
    city: "Denver",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    lat: 39.7645,
    lng: -104.9794,
    type: "neighborhood",
    keywords: ["rino", "river north", "five points", "larimer", "80205", "brighton blvd"],
  },
  {
    id: "dcc-denver-capitol-hill-colfax",
    name: "Capitol Hill / Colfax Corridor",
    displayName: "Capitol Hill & East Colfax Ave, Denver, CO 80203, USA",
    city: "Denver",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    lat: 39.7368,
    lng: -104.9798,
    type: "neighborhood",
    keywords: ["capitol hill", "cap hill", "colfax", "80203", "80218", "ogden", "fillmore"],
  },
  {
    id: "dcc-denver-cherry-creek",
    name: "Cherry Creek, Denver",
    displayName: "Cherry Creek, Denver, CO 80206, USA",
    city: "Denver",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    lat: 39.7186,
    lng: -104.9536,
    type: "neighborhood",
    keywords: ["cherry creek", "80206", "80209", "halcyon", "moxy cherry creek"],
  },
  {
    id: "dcc-denver-highlands-lohi",
    name: "LoHi / Denver Highlands",
    displayName: "Lower Highland (LoHi), Denver, CO 80211, USA",
    city: "Denver",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    lat: 39.7618,
    lng: -105.0132,
    type: "neighborhood",
    keywords: ["lohi", "highlands", "lower highland", "80211", "80212", "tejon"],
  },
  {
    id: "dcc-golden-downtown",
    name: "Golden Downtown / Foothills",
    displayName: "Downtown Golden, 12th St & Washington Ave, Golden, CO 80401, USA",
    city: "Golden",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    lat: 39.7555,
    lng: -105.2211,
    type: "city",
    keywords: ["golden", "trailhead taphouse", "80401", "table mountain inn", "eddy hotel", "12th st"],
  },
  {
    id: "dcc-morrison-lakewood-west",
    name: "Lakewood / Green Mountain / Morrison",
    displayName: "West Lakewood & Morrison Road Corridor, CO 80228 / 80465, USA",
    city: "Lakewood",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    lat: 39.6882,
    lng: -105.1531,
    type: "neighborhood",
    keywords: ["lakewood", "morrison", "green mountain", "belmar", "80226", "80228", "80465", "origin hotel red rocks"],
  },
  {
    id: "dcc-denver-tech-center",
    name: "Denver Tech Center (DTC) / Greenwood Village",
    displayName: "Denver Tech Center, Greenwood Village, CO 80111, USA",
    city: "Greenwood Village",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    lat: 39.6172,
    lng: -104.8966,
    type: "neighborhood",
    keywords: ["dtc", "tech center", "greenwood village", "80111", "80112", "centennial", "englewood"],
  },
  {
    id: "dcc-boulder-downtown",
    name: "Boulder (Pearl Street / CU Boulder)",
    displayName: "Downtown Boulder, Pearl St, Boulder, CO 80302, USA",
    city: "Boulder",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    lat: 40.0176,
    lng: -105.2797,
    type: "city",
    keywords: ["boulder", "pearl street", "80302", "80303", "st julien"],
  },
];

function matchCuratedDenverPlaces(query: string): Omit<CuratedLocalPlace, "keywords">[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return DENVER_RED_ROCKS_LOCAL_PLACES.filter((place) => {
    if (place.name.toLowerCase().includes(normalized)) return true;
    if (place.displayName.toLowerCase().includes(normalized)) return true;
    return place.keywords.some((kw) => kw.includes(normalized) || normalized.includes(kw));
  }).map(({ keywords: _kw, ...rest }) => rest);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = (searchParams.get("q") || "").trim().slice(0, 180);
  const bias = (searchParams.get("bias") || "").trim().toLowerCase();
  const isDenverBias = bias === "denver" || bias === "red-rocks" || bias === "colorado";
  const lat = validCoordinate(searchParams.get("lat"), -90, 90);
  const lng = validCoordinate(searchParams.get("lng"), -180, 180);

  try {
    if (lat != null && lng != null) {
      try {
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
      } catch {
        // Fallback reverse coordinate label when offline or rate-limited
        return NextResponse.json(
          {
            ok: true,
            mode: "reverse",
            results: [
              {
                id: `gps:${lat.toFixed(4)}:${lng.toFixed(4)}`,
                name: `Current Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
                displayName: `GPS Coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                city: isDenverBias ? "Denver Metro" : null,
                region: isDenverBias ? "Colorado" : null,
                country: "United States",
                countryCode: "US",
                lat,
                lng,
                type: "gps",
              },
            ],
          },
          { headers: { "Cache-Control": "private, max-age=0, no-store" } },
        );
      }
    }

    if (!q) {
      return NextResponse.json({ ok: false, error: "Provide q or valid lat/lng." }, { status: 400 });
    }

    const curatedMatches = isDenverBias ? matchCuratedDenverPlaces(q) : [];

    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", isDenverBias && /^\d{5}$/.test(q) ? `${q}, Colorado, USA` : q);
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "6");
      if (isDenverBias) {
        url.searchParams.set("countrycodes", "us");
        url.searchParams.set("viewbox", "-105.65,40.15,-104.55,39.45");
      }
      const rows = await fetchNominatim(url);
      const nominatimResults = (Array.isArray(rows) ? rows : [])
        .map(normalizeResult)
        .filter((result) => typeof result.lat === "number" && typeof result.lng === "number");

      if (isDenverBias) {
        nominatimResults.sort((a, b) => {
          const aCo = a.region === "Colorado" ? 1 : 0;
          const bCo = b.region === "Colorado" ? 1 : 0;
          return bCo - aCo;
        });
      }

      const merged = [...curatedMatches];
      for (const item of nominatimResults) {
        const duplicate = merged.some(
          (m) =>
            m.name.toLowerCase() === String(item.name || "").toLowerCase() ||
            (m.lat != null &&
              item.lat != null &&
              Math.abs(m.lat - item.lat) < 0.003 &&
              Math.abs((m.lng || 0) - (item.lng || 0)) < 0.003),
        );
        if (!duplicate) {
          merged.push(item as any);
        }
      }

      return NextResponse.json(
        { ok: true, mode: "search", query: q, bias: bias || null, results: merged.slice(0, 8) },
        { headers: { "Cache-Control": "private, max-age=0, no-store" } },
      );
    } catch (error) {
      if (curatedMatches.length > 0) {
        return NextResponse.json(
          { ok: true, mode: "search", query: q, bias: bias || null, results: curatedMatches },
          { headers: { "Cache-Control": "private, max-age=0, no-store" } },
        );
      }
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "location_lookup_failed" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
