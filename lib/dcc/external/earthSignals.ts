import nodes from "@/data/nodes.json";
import { getNodeBySlug, getNodesByAlias } from "@/lib/dcc/registry";
import { nasaEonetAdapter, noaaAdapter } from "@/lib/dcc/providers/adapters";

type LegacyNode = {
  slug: string;
  lat?: number;
  lng?: number;
  name?: string;
};

export type EarthSignalResult = {
  place: {
    slug: string;
    name: string;
    lat: number;
    lon: number;
  };
  noaa: {
    available: boolean;
    source: string;
    fallback_reason: string | null;
    forecast: Array<{
      start: string;
      end: string;
      temperature: number | null;
      temperatureUnit: string | null;
      windSpeed: string | null;
      windDirection: string | null;
      shortForecast: string | null;
    }>;
  };
  nasa: {
    source: string;
    days: number;
    radius_km: number;
    total_open_events: number;
    nearby_events: Array<{
      id: string;
      title: string;
      categories: string[];
      distance_km: number;
      latest_at: string | null;
      source_urls: string[];
      geometry_type: string | null;
    }>;
  };
  diagnostics: {
    generated_at: string;
  };
};

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const aa =
    s1 * s1 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return r * c;
}

function lookupPlace(slug: string): { slug: string; name: string; lat: number; lon: number } | null {
  const canonical = getNodeBySlug(slug) || getNodesByAlias(slug)[0] || null;
  const lat = canonical?.geo?.lat;
  const lon = canonical?.geo?.lon;
  if (canonical && typeof lat === "number" && typeof lon === "number") {
    return {
      slug: canonical.slug,
      name: canonical.display_name || canonical.name,
      lat,
      lon,
    };
  }

  const legacy = (nodes as LegacyNode[]).find((n) => n.slug === slug) || null;
  if (legacy && typeof legacy.lat === "number" && typeof legacy.lng === "number") {
    return {
      slug: legacy.slug,
      name: legacy.name || legacy.slug,
      lat: legacy.lat,
      lon: legacy.lng,
    };
  }

  return null;
}

async function fetchNoaaForecast(lat: number, lon: number): Promise<EarthSignalResult["noaa"]> {
  const result = await noaaAdapter.fetch({ lat, lon, periods: 12 });
  return {
    available: result.ok && result.data.length > 0,
    source: result.diagnostics.source,
    fallback_reason: result.diagnostics.fallback_reason,
    forecast: result.data,
  };
}

async function fetchNasaEonetNearby(
  lat: number,
  lon: number,
  days: number,
  radiusKm: number
): Promise<EarthSignalResult["nasa"]> {
  const result = await nasaEonetAdapter.fetch({ days });
  const events = result.data;
  const nearby = events
    .map((ev) => {
      if (!ev.coordinates) return null;
      const [eventLon, eventLat] = ev.coordinates;
      const d = haversineKm(lat, lon, eventLat, eventLon);
      if (d > radiusKm) return null;
      return {
        id: ev.id,
        title: ev.title,
        categories: ev.categories,
        distance_km: Number(d.toFixed(1)),
        latest_at: ev.latest_at,
        source_urls: ev.source_urls.slice(0, 3),
        geometry_type: ev.geometry_type,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => a.distance_km - b.distance_km || a.title.localeCompare(b.title))
    .slice(0, 12);

  return {
    source: result.diagnostics.source,
    days,
    radius_km: radiusKm,
    total_open_events: events.length,
    nearby_events: nearby,
  };
}

export async function buildEarthSignals(input: {
  slug: string;
  days: number;
  radius_km: number;
}): Promise<EarthSignalResult | null> {
  const place = lookupPlace(input.slug);
  if (!place) return null;
  const days = Math.max(1, Math.min(input.days, 30));
  const radius = Math.max(50, Math.min(input.radius_km, 2500));

  const [noaa, nasa] = await Promise.all([
    fetchNoaaForecast(place.lat, place.lon),
    fetchNasaEonetNearby(place.lat, place.lon, days, radius),
  ]);

  return {
    place,
    noaa,
    nasa,
    diagnostics: {
      generated_at: new Date().toISOString(),
    },
  };
}
