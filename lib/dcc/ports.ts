import legacyPortsData from "@/data/ports.generated.json";
import cruisePortDirectoryData from "@/data/cruise-port-directory.json";
import type { DccNode } from "./schema";
import {
  getNodeBySlugInClass,
  getNodesByClass,
  loadBySlugClassIndex,
} from "./registry";

export type PortView = {
  slug: string;
  name: string;
  area?: string;
  region?: string;
  city?: string;
  country?: string;
  tags?: string[];
  passenger_volume?: number;
  lat?: number;
  lon?: number;
  lng?: number;
};

const LEGACY_FALLBACK_ENABLED = process.env.DCC_LEGACY_FALLBACK !== "false";

function areaFromNode(node: DccNode): string {
  if (node.admin?.locality) return node.admin.locality;
  const areaTag = (node.tags || []).find((t) => t.startsWith("area:"));
  if (areaTag) return areaTag.replace(/^area:/, "");
  return "Other";
}

function countryFromNode(node: DccNode): string {
  return node.admin?.country_name || node.admin?.country_code || "Unknown";
}

const PORT_GEO_FALLBACK_BY_SLUG: Record<string, { lat: number; lon: number }> = {
  juneau: { lat: 58.2989, lon: -134.4053 },
  "new-orleans": { lat: 29.9395, lon: -90.0617 },
  ketchikan: { lat: 55.3422, lon: -131.6461 },
  skagway: { lat: 59.4501, lon: -135.3208 },
  sitka: { lat: 57.0531, lon: -135.33 },
  icystraitpoint: { lat: 58.1328, lon: -135.4436 },
  miami: { lat: 25.7781, lon: -80.1791 },
  "port-canaveral": { lat: 28.4105, lon: -80.6186 },
  tampa: { lat: 27.9428, lon: -82.4451 },
  "key-west": { lat: 24.5592, lon: -81.8077 },
  "fort-lauderdale": { lat: 26.0912, lon: -80.1189 },
  "st-thomas": { lat: 18.3303, lon: -64.9221 },
  nassau: { lat: 25.0782, lon: -77.3386 },
  cozumel: { lat: 20.4763, lon: -86.9736 },
  roatan: { lat: 16.3168, lon: -86.5376 },
  "grand-cayman": { lat: 19.295, lon: -81.3838 },
  "george-town-grand-cayman": { lat: 19.295, lon: -81.3838 },
  seattle: { lat: 47.6114, lon: -122.3508 },
  vancouver: { lat: 49.2888, lon: -123.1111 },
  kahului: { lat: 20.8947, lon: -156.47 },
  reykjavik: { lat: 64.1558, lon: -21.8697 },
};

const LEGACY_COORDS_BY_SLUG = new Map<string, { lat: number; lon: number }>(
  (legacyPortsData as Array<{ slug: string; lat?: number; lon?: number }>)
    .filter((p) => typeof p.lat === "number" && typeof p.lon === "number")
    .map((p) => [p.slug, { lat: p.lat!, lon: p.lon! }]),
);

function toPortView(node: DccNode): PortView {
  const area = areaFromNode(node);
  const legacyCoord =
    LEGACY_COORDS_BY_SLUG.get(node.slug) || PORT_GEO_FALLBACK_BY_SLUG[node.slug];
  const lat =
    typeof node.geo?.lat === "number" ? node.geo.lat : legacyCoord?.lat;
  const lon =
    typeof node.geo?.lon === "number" ? node.geo.lon : legacyCoord?.lon;
  return {
    slug: node.slug,
    name: node.display_name || node.name,
    area,
    region: area,
    city: node.display_name || node.name,
    country: countryFromNode(node),
    tags: node.tags || [],
    passenger_volume: node.metrics?.passenger_volume ?? undefined,
    lat,
    lon,
    lng: lon,
  };
}

function getLegacyPorts(): PortView[] {
  return (legacyPortsData as Array<PortView & { lat?: number; lon?: number }>).map((p) => {
    const fallback = PORT_GEO_FALLBACK_BY_SLUG[p.slug];
    const lat = typeof p.lat === "number" ? p.lat : fallback?.lat;
    const lon = typeof p.lon === "number" ? p.lon : fallback?.lon;
    const lng = typeof p.lng === "number" ? p.lng : lon;
    return {
      ...p,
      lat,
      lon,
      lng,
    };
  });
}

function getCanonicalPorts(): PortView[] {
  const portNodes = getNodesByClass("port");
  return portNodes.map(toPortView);
}

export function getEffectivePorts(): PortView[] {
  try {
    const canonical = getCanonicalPorts();
    if (canonical.length > 0) {
      if (!LEGACY_FALLBACK_ENABLED) return canonical;
      const seen = new Set(canonical.map((p) => p.slug));
      const extras = getLegacyPorts().filter((p) => !seen.has(p.slug));
      return [...canonical, ...extras];
    }
  } catch {
    // no-op: fall through
  }
  return LEGACY_FALLBACK_ENABLED ? getLegacyPorts() : [];
}

export function getPortBySlug(slug: string): PortView | null {
  try {
    const canonical = getNodeBySlugInClass(slug, "port");
    if (canonical) return toPortView(canonical);
  } catch {
    // no-op: fall through
  }
  if (!LEGACY_FALLBACK_ENABLED) return null;
  const direct = getLegacyPorts().find((p) => p.slug === slug);
  if (direct) return direct;
  if (slug === "grand-cayman") {
    const gc = getLegacyPorts().find(
      (p) => p.slug === "george-town-grand-cayman",
    );
    if (gc) {
      return {
        ...gc,
        slug: "grand-cayman",
        name: "Grand Cayman (George Town)",
      };
    }
  }
  const dirEntry = (
    cruisePortDirectoryData.ports as Array<{
      slug: string;
      name: string;
      area?: string;
      country?: string;
    }>
  ).find((p) => p.slug === slug);
  if (dirEntry) {
    const fallback = PORT_GEO_FALLBACK_BY_SLUG[dirEntry.slug];
    return {
      slug: dirEntry.slug,
      name: dirEntry.name,
      area: dirEntry.area || dirEntry.country || "Cruise Port",
      region: dirEntry.area || dirEntry.country || "Cruise Port",
      city: dirEntry.name,
      country: dirEntry.country || "Unknown",
      tags: ["port-reference"],
      lat: fallback?.lat,
      lon: fallback?.lon,
      lng: fallback?.lon,
    };
  }
  return null;
}

export function getPortSlugs(): string[] {
  const slugs = new Set<string>();
  if (LEGACY_FALLBACK_ENABLED) {
    for (const p of getLegacyPorts()) slugs.add(p.slug);
    slugs.add("grand-cayman");
  }
  try {
    const bySlugClass = loadBySlugClassIndex();
    Object.keys(bySlugClass.port || {}).forEach((s) => slugs.add(s));
  } catch {
    // no-op
  }
  return Array.from(slugs);
}
