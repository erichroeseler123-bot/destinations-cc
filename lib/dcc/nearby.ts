import { getNodeBySlug, getNodesByAlias, getNodesByClass } from "@/lib/dcc/registry";
import { getPlaceActionGraphBySlug } from "@/lib/dcc/graph/placeActionGraph";
import type { DccNode } from "@/lib/dcc/schema";

type NearbyClass = "place" | "port";

export type NearbyPoint = {
  id: string;
  class: NearbyClass;
  subclass?: string | null;
  slug: string;
  name: string;
  display_name?: string | null;
  canonical_path: string;
  distance_km: number;
  country_code?: string | null;
  admin1_code?: string | null;
  tags: string[];
};

export type NearbyActivity = {
  place_id: string;
  place_slug: string;
  place_name: string;
  distance_km: number;
  counts: {
    tours: number;
    cruises: number;
    events: number;
    transport: number;
  };
};

export type NearbyResult = {
  center: {
    lat: number;
    lon: number;
    source: "coordinates" | "slug";
    slug?: string;
  };
  radius_km: number;
  pois: NearbyPoint[];
  activities: {
    total_places_with_actions: number;
    top_places: NearbyActivity[];
  };
  transport: NearbyPoint[];
  diagnostics: {
    candidate_nodes: number;
    generated_at: string;
  };
};

type CachedGeoNode = {
  node: DccNode;
  lat: number;
  lon: number;
};

let GEO_CACHE: CachedGeoNode[] | null = null;

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

function getGeoNodes(): CachedGeoNode[] {
  if (GEO_CACHE) return GEO_CACHE;
  const out: CachedGeoNode[] = [];
  const seen = new Set<string>();
  for (const cls of ["place", "port"] as const) {
    const nodes = getNodesByClass(cls);
    for (const node of nodes) {
      if (seen.has(node.id)) continue;
      const lat = node.geo?.lat;
      const lon = node.geo?.lon;
      if (typeof lat !== "number" || typeof lon !== "number") continue;
      seen.add(node.id);
      out.push({ node, lat, lon });
    }
  }
  GEO_CACHE = out;
  return out;
}

function normalizeCenterFromSlug(slug: string): { lat: number; lon: number; slug: string } | null {
  const node =
    getNodeBySlug(slug) ||
    getNodesByAlias(slug)[0] ||
    null;
  const lat = node?.geo?.lat;
  const lon = node?.geo?.lon;
  if (!node || typeof lat !== "number" || typeof lon !== "number") return null;
  return { lat, lon, slug: node.slug };
}

function toNearbyPoint(node: DccNode, distance_km: number): NearbyPoint {
  return {
    id: node.id,
    class: node.class === "port" ? "port" : "place",
    subclass: node.subclass ?? null,
    slug: node.slug,
    name: node.name,
    display_name: node.display_name ?? null,
    canonical_path: node.links?.canonical_path || `/nodes/${node.slug}`,
    distance_km: Number(distance_km.toFixed(2)),
    country_code: node.admin?.country_code ?? null,
    admin1_code: node.admin?.admin1_code ?? null,
    tags: node.tags || [],
  };
}

export function findNearby(input: {
  lat?: number | null;
  lon?: number | null;
  slug?: string | null;
  radius_km?: number | null;
  limit?: number | null;
}): NearbyResult | null {
  const radius = Math.max(1, Math.min(Number(input.radius_km ?? 25), 500));
  const limit = Math.max(1, Math.min(Number(input.limit ?? 12), 100));

  let centerLat = input.lat;
  let centerLon = input.lon;
  let centerSource: "coordinates" | "slug" = "coordinates";
  let canonicalSlug: string | undefined;

  if (typeof centerLat !== "number" || typeof centerLon !== "number") {
    if (!input.slug) return null;
    const fromSlug = normalizeCenterFromSlug(input.slug);
    if (!fromSlug) return null;
    centerLat = fromSlug.lat;
    centerLon = fromSlug.lon;
    canonicalSlug = fromSlug.slug;
    centerSource = "slug";
  }

  const matches = getGeoNodes()
    .map((entry) => ({
      entry,
      d: haversineKm(centerLat as number, centerLon as number, entry.lat, entry.lon),
    }))
    .filter((x) => x.d <= radius)
    .sort((a, b) => a.d - b.d || a.entry.node.slug.localeCompare(b.entry.node.slug));

  const pois = matches
    .map(({ entry, d }) => toNearbyPoint(entry.node, d))
    .filter((p) => p.class === "place")
    .slice(0, limit);

  const transport = matches
    .map(({ entry, d }) => toNearbyPoint(entry.node, d))
    .filter((p) => p.class === "port")
    .slice(0, limit);

  const top_places: NearbyActivity[] = [];
  for (const p of pois) {
    const graph = getPlaceActionGraphBySlug(p.slug);
    if (!graph) continue;
    const total =
      graph.counts.tours +
      graph.counts.cruises +
      graph.counts.events +
      graph.counts.transport;
    if (total === 0) continue;
    top_places.push({
      place_id: graph.place_id,
      place_slug: graph.place_slug,
      place_name: graph.place_name,
      distance_km: p.distance_km,
      counts: {
        tours: graph.counts.tours,
        cruises: graph.counts.cruises,
        events: graph.counts.events,
        transport: graph.counts.transport,
      },
    });
  }

  top_places.sort((a, b) => {
    const scoreA = a.counts.tours + a.counts.cruises + a.counts.events + a.counts.transport;
    const scoreB = b.counts.tours + b.counts.cruises + b.counts.events + b.counts.transport;
    return scoreB - scoreA || a.distance_km - b.distance_km || a.place_slug.localeCompare(b.place_slug);
  });

  return {
    center: {
      lat: Number((centerLat as number).toFixed(6)),
      lon: Number((centerLon as number).toFixed(6)),
      source: centerSource,
      slug: canonicalSlug,
    },
    radius_km: radius,
    pois,
    activities: {
      total_places_with_actions: top_places.length,
      top_places: top_places.slice(0, 8),
    },
    transport,
    diagnostics: {
      candidate_nodes: getGeoNodes().length,
      generated_at: new Date().toISOString(),
    },
  };
}
