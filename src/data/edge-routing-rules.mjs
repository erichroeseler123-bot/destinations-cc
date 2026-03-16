const DCC_CANONICAL_HOST = "destinationcommandcenter.com";
const DCC_WWW_HOST = "www.destinationcommandcenter.com";

/**
 * Prefix-based edge routing rules for satellite handoff.
 * Add new city/intent routes here; do not hardcode in next.config.mjs.
 */
export const SATELLITE_EDGE_ROUTES = [
  {
    id: "wta-juneau-whale-watching",
    prefix: "/juneau-whale-watching",
    targetOrigin: "https://welcome-to-alaska-tours.com",
  },
  {
    id: "wta-juneau-shore-excursions",
    prefix: "/juneau-shore-excursions",
    targetOrigin: "https://welcome-to-alaska-tours.com",
  },
  {
    id: "wta-ketchikan-shore-excursions",
    prefix: "/ketchikan-shore-excursions",
    targetOrigin: "https://welcome-to-alaska-tours.com",
  },
  {
    id: "gosno-ski-shuttle",
    prefix: "/ski-shuttle",
    targetOrigin: "https://gosno.co",
  },
  {
    id: "gosno-denver-to-vail-shuttle",
    prefix: "/denver-to-vail-shuttle",
    targetOrigin: "https://gosno.co",
  },
  {
    id: "gosno-denver-to-aspen-shuttle",
    prefix: "/denver-to-aspen-shuttle",
    targetOrigin: "https://gosno.co",
  },
];

/**
 * City-level defaults for monetized lane handoff.
 * Authority/discovery routes remain on DCC by default.
 */
export const CITY_SATELLITE_DEFAULTS = [
  // Add entries only when a city has a matching satellite brand.
  // Example:
  // {
  //   city: "miami",
  //   targetOrigin: "https://welcometomiami.com",
  //   monetizedLanes: ["tours", "day-trips", "helicopter"],
  // },
];

export function normalizeEdgePrefix(prefix) {
  if (typeof prefix !== "string" || prefix.length === 0) return null;
  const trimmed = prefix.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed === "/") return "/";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function buildSatelliteRedirects(hosts = [DCC_CANONICAL_HOST, DCC_WWW_HOST]) {
  const redirects = [];

  for (const route of SATELLITE_EDGE_ROUTES) {
    const prefix = normalizeEdgePrefix(route.prefix);
    if (!prefix || !route.targetOrigin) continue;

    for (const host of hosts) {
      redirects.push({
        source: prefix,
        has: [{ type: "header", key: "host", value: host }],
        destination: `${route.targetOrigin}${prefix}`,
        permanent: false,
      });

      redirects.push({
        source: `${prefix}/:path*`,
        has: [{ type: "header", key: "host", value: host }],
        destination: `${route.targetOrigin}${prefix}/:path*`,
        permanent: false,
      });
    }
  }

  return redirects;
}

function normalizeCitySlug(city) {
  if (typeof city !== "string") return null;
  const slug = city.trim().toLowerCase();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null;
  return slug;
}

function normalizeMonetizedLanes(lanes) {
  if (!Array.isArray(lanes) || lanes.length === 0) return [];
  const normalized = [];
  for (const lane of lanes) {
    if (typeof lane !== "string") continue;
    const value = lane.trim().toLowerCase();
    if (!value) continue;
    if (!/^[a-z0-9-]+$/.test(value)) continue;
    if (!normalized.includes(value)) normalized.push(value);
  }
  return normalized;
}

export function buildCitySatelliteRedirects(hosts = [DCC_CANONICAL_HOST, DCC_WWW_HOST]) {
  const redirects = [];

  for (const route of CITY_SATELLITE_DEFAULTS) {
    const city = normalizeCitySlug(route.city);
    const lanes = normalizeMonetizedLanes(route.monetizedLanes);
    if (!city || !route.targetOrigin || lanes.length === 0) continue;

    const lanePattern = lanes.join("|");

    for (const host of hosts) {
      redirects.push({
        source: `/${city}/:lane(${lanePattern})`,
        has: [{ type: "header", key: "host", value: host }],
        destination: `${route.targetOrigin}/:lane?city=${city}&source=dcc-router`,
        permanent: false,
      });

      redirects.push({
        source: `/${city}/:lane(${lanePattern})/:path*`,
        has: [{ type: "header", key: "host", value: host }],
        destination: `${route.targetOrigin}/:lane/:path*?city=${city}&source=dcc-router`,
        permanent: false,
      });
    }
  }

  return redirects;
}
