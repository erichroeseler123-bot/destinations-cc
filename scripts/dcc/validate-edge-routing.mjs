import {
  CITY_SATELLITE_DEFAULTS,
  SATELLITE_EDGE_ROUTES,
  normalizeEdgePrefix,
} from "../../src/data/edge-routing-rules.mjs";

const DCC_HOSTS = new Set(["destinationcommandcenter.com", "www.destinationcommandcenter.com"]);

const errors = [];
const warnings = [];

function push(list, message, routeId = null) {
  list.push(routeId ? `[${routeId}] ${message}` : message);
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

const seenIds = new Set();
const seenPrefixes = new Map();

for (const route of SATELLITE_EDGE_ROUTES) {
  if (!route || typeof route !== "object") {
    push(errors, "Route entry must be an object");
    continue;
  }

  if (!route.id || typeof route.id !== "string") {
    push(errors, "Route id is required and must be a string");
    continue;
  }

  if (seenIds.has(route.id)) {
    push(errors, "Duplicate route id", route.id);
  }
  seenIds.add(route.id);

  const prefix = normalizeEdgePrefix(route.prefix);
  if (!prefix || prefix === "/") {
    push(errors, "Route prefix must be a non-root path like /city-intent", route.id);
  } else if (seenPrefixes.has(prefix)) {
    push(errors, `Duplicate route prefix (${prefix})`, route.id);
  } else {
    seenPrefixes.set(prefix, route.id);
  }

  if (!route.targetOrigin || typeof route.targetOrigin !== "string" || !isHttpsUrl(route.targetOrigin)) {
    push(errors, "targetOrigin must be a valid https URL", route.id);
  } else {
    const host = new URL(route.targetOrigin).hostname.toLowerCase();
    if (DCC_HOSTS.has(host)) {
      push(errors, "targetOrigin cannot point back to DCC host (redirect loop risk)", route.id);
    }
  }
}

const prefixes = Array.from(seenPrefixes.keys()).sort((a, b) => a.length - b.length);
for (let i = 0; i < prefixes.length; i += 1) {
  for (let j = i + 1; j < prefixes.length; j += 1) {
    const a = prefixes[i];
    const b = prefixes[j];
    if (b.startsWith(`${a}/`)) {
      push(
        warnings,
        `Overlapping prefixes (${a} and ${b}) can cause broad-match handoff behavior`,
        `${seenPrefixes.get(a)}:${seenPrefixes.get(b)}`,
      );
    }
  }
}

const seenCities = new Set();
for (const route of CITY_SATELLITE_DEFAULTS) {
  if (!route || typeof route !== "object") {
    push(errors, "City default entry must be an object");
    continue;
  }

  if (!route.city || typeof route.city !== "string" || !/^[a-z0-9-]+$/.test(route.city)) {
    push(errors, "city is required and must be a slug (lowercase alphanumeric + hyphen)");
    continue;
  }

  if (seenCities.has(route.city)) {
    push(errors, `Duplicate city default (${route.city})`);
  }
  seenCities.add(route.city);

  if (!route.targetOrigin || typeof route.targetOrigin !== "string" || !isHttpsUrl(route.targetOrigin)) {
    push(errors, "city default targetOrigin must be a valid https URL", route.city);
  } else {
    const host = new URL(route.targetOrigin).hostname.toLowerCase();
    if (DCC_HOSTS.has(host)) {
      push(errors, "city default targetOrigin cannot point back to DCC host (redirect loop risk)", route.city);
    }
  }

  if (!Array.isArray(route.monetizedLanes) || route.monetizedLanes.length === 0) {
    push(errors, "monetizedLanes must be a non-empty array", route.city);
    continue;
  }

  const laneSet = new Set();
  for (const lane of route.monetizedLanes) {
    if (typeof lane !== "string" || !/^[a-z0-9-]+$/.test(lane)) {
      push(errors, `Invalid monetized lane (${String(lane)})`, route.city);
      continue;
    }
    if (laneSet.has(lane)) {
      push(warnings, `Duplicate monetized lane ignored (${lane})`, route.city);
    }
    laneSet.add(lane);
  }
}

const result = {
  ok: errors.length === 0,
  routes: SATELLITE_EDGE_ROUTES.length,
  cityDefaults: CITY_SATELLITE_DEFAULTS.length,
  errorsCount: errors.length,
  warningsCount: warnings.length,
  errors,
  warnings,
};

console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exit(1);
