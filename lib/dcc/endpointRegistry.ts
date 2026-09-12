/**
 * DCC Endpoint Source Registry & Hydration Engine
 * 
 * Manages registered DCC endpoints, spatial service-area matching,
 * DCC Core v2 wire validation, and live HTTPS hydration without inventory duplication.
 */

export type Coordinate = { lat: number; lng: number };

export type GeographicArea = {
  name: string;
  // Bounding box: [minLat, minLng, maxLat, maxLng]
  bbox?: [number, number, number, number];
  // Center + radius in kilometers
  circle?: { center: Coordinate; radiusKm: number };
};

export type DccSourceRegistryEntry = {
  id: string;
  name: string;
  endpointUrl: string;
  profile?: string;
  description: string;
  serviceAreas: GeographicArea[];
};

export type DccValidationResult = {
  valid: boolean;
  errors: Array<{ code: string; message: string }>;
  passthroughContainers: string[];
};

export type HydratedDccEndpoint = {
  id: string;
  name: string;
  endpointUrl: string;
  checkedAt: string;
  available: boolean;
  status: "fresh" | "stale" | "unavailable";
  httpStatus?: number;
  error?: string;
  validation?: DccValidationResult;
  payload?: {
    protocol: string;
    core: string;
    self: string;
    id: string;
    claims: Array<{ predicate: string; value: unknown; as_of?: string; evidence?: Array<{ type: string; pointer: string; as_of?: string }> }>;
    state: Array<{ predicate: string; value: unknown; as_of?: string; fresh_until?: string; evidence?: unknown[] }>;
    actions: Array<{ action_id: string; method: string; target: string; input?: unknown; auth?: string }>;
    links: Array<{ rel: string; target: string }>;
    [key: string]: unknown;
  } | null;
  asOf?: string | null;
  freshUntil?: string | null;
  isFresh?: boolean;
  matchedRegion?: string;
};

// ============================================================================
// 1. DCC Source Registry
// ============================================================================

export const DCC_SOURCE_REGISTRY: DccSourceRegistryEntry[] = [
  {
    id: "gosno",
    name: "GoSno",
    endpointUrl: "https://gosno.co/.well-known/dcc",
    profile: "tourism/transportation-v1",
    description: "Mountain transportation, private shuttles, and airport connectivity across Colorado Rockies and Big Sky Montana.",
    serviceAreas: [
      {
        name: "Colorado Rocky Mountains Corridor & Hubs",
        bbox: [38.0, -107.5, 41.0, -104.4],
      },
      {
        name: "Big Sky & Gallatin Corridor Hubs",
        bbox: [45.0, -111.7, 46.0, -110.8],
      },
    ],
  },
  {
    id: "vibe-around-town",
    name: "Vibe Around Town",
    endpointUrl: "https://vibearoundtown.com/.well-known/dcc",
    profile: "tourism/private-excursions-v1",
    description: "Licensed private excursions, custom island tours, and cruise port transportation across St. Thomas, St. John, and St. Croix.",
    serviceAreas: [
      {
        name: "U.S. Virgin Islands & Cruise Ports (St. Thomas, St. John, St. Croix)",
        bbox: [17.5, -65.1, 18.5, -64.4],
      },
    ],
  },
];

// ============================================================================
// 2. Spatial Discovery
// ============================================================================

function haversineKm(a: Coordinate, b: Coordinate): number {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

function coordinateInArea(coord: Coordinate, area: GeographicArea): boolean {
  if (area.bbox) {
    const [minLat, minLng, maxLat, maxLng] = area.bbox;
    if (coord.lat >= minLat && coord.lat <= maxLat && coord.lng >= minLng && coord.lng <= maxLng) {
      return true;
    }
  }
  if (area.circle) {
    const distance = haversineKm(coord, area.circle.center);
    if (distance <= area.circle.radiusKm) {
      return true;
    }
  }
  return false;
}

export function discoverDccEndpoints(coord: Coordinate): DccSourceRegistryEntry[] {
  return DCC_SOURCE_REGISTRY.filter((entry) =>
    entry.serviceAreas.some((area) => coordinateInArea(coord, area)),
  );
}

// ============================================================================
// 3. DCC Core v2 Constitutional Validator
// ============================================================================

const KNOWN_CONTAINERS = new Set(["claims", "state", "actions", "links"]);
const REQUIRED_ENVELOPE = ["protocol", "core", "self", "id"];

export function validateDccCoreV2(payload: unknown): DccValidationResult {
  const errors: Array<{ code: string; message: string }> = [];
  const passthroughContainers: string[] = [];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      valid: false,
      errors: [{ code: "INVALID_PAYLOAD", message: "Response payload must be a JSON object" }],
      passthroughContainers,
    };
  }

  const obj = payload as Record<string, unknown>;

  for (const field of REQUIRED_ENVELOPE) {
    if (obj[field] === undefined || obj[field] === null) {
      errors.push({ code: "MISSING_ENVELOPE_FIELD", message: `Missing required envelope field: "${field}"` });
    }
  }

  if (obj.protocol !== undefined && obj.protocol !== "dcc") {
    errors.push({ code: "INVALID_PROTOCOL", message: `Protocol must be "dcc", got "${obj.protocol}"` });
  }

  if (obj.core !== undefined && String(obj.core) !== "2") {
    errors.push({ code: "INVALID_CORE_VERSION", message: `Core version must be "2", got "${obj.core}"` });
  }

  if (typeof obj.self === "string") {
    try {
      new URL(obj.self);
    } catch {
      errors.push({ code: "INVALID_SELF_URL", message: `self address "${obj.self}" is not a valid URL` });
    }
  }

  if (typeof obj.id === "string") {
    if (!obj.id.includes(":") && !obj.id.startsWith("http")) {
      errors.push({ code: "MALFORMED_IDENTITY", message: `Identity "${obj.id}" lacks namespace separator or URI scheme` });
    }
  }

  if (obj.claims !== undefined && !Array.isArray(obj.claims)) {
    errors.push({ code: "MALFORMED_CLAIMS", message: '"claims" must be an array' });
  }
  if (obj.state !== undefined && !Array.isArray(obj.state)) {
    errors.push({ code: "MALFORMED_STATE", message: '"state" must be an array' });
  }
  if (obj.actions !== undefined && !Array.isArray(obj.actions)) {
    errors.push({ code: "MALFORMED_ACTIONS", message: '"actions" must be an array' });
  }
  if (obj.links !== undefined && !Array.isArray(obj.links)) {
    errors.push({ code: "MALFORMED_LINKS", message: '"links" must be an array' });
  }

  for (const key of Object.keys(obj)) {
    if (!REQUIRED_ENVELOPE.includes(key) && !KNOWN_CONTAINERS.has(key)) {
      passthroughContainers.push(key);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    passthroughContainers,
  };
}

// ============================================================================
// 4. Live HTTPS Hydration (Direct, Short-Lived Caching with Visible Timestamps)
// ============================================================================

export async function fetchAndHydrateDccEndpoint(
  entry: DccSourceRegistryEntry,
  options: { timeoutMs?: number; revalidateSeconds?: number } = {},
): Promise<HydratedDccEndpoint> {
  const checkedAt = new Date().toISOString();
  const timeoutMs = options.timeoutMs ?? 5000;
  const revalidateSeconds = options.revalidateSeconds ?? 60;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(entry.endpointUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "DestinationCommandCenter/2.0 (+https://destinationcommandcenter.com/developers)",
      },
      next: { revalidate: revalidateSeconds },
    });

    if (!res.ok) {
      return {
        id: entry.id,
        name: entry.name,
        endpointUrl: entry.endpointUrl,
        checkedAt,
        available: false,
        status: "unavailable",
        httpStatus: res.status,
        error: `HTTP ${res.status} ${res.statusText}`,
        payload: null,
      };
    }

    const json = (await res.json()) as any;
    const validation = validateDccCoreV2(json);

    if (!validation.valid) {
      return {
        id: entry.id,
        name: entry.name,
        endpointUrl: entry.endpointUrl,
        checkedAt,
        available: false,
        status: "unavailable",
        httpStatus: res.status,
        error: `DCC Core v2 Validation Failed: ${validation.errors.map((e) => e.message).join("; ")}`,
        validation,
        payload: json,
      };
    }

    const now = Date.now();
    let latestAsOf: string | null = null;
    let earliestFreshUntil: string | null = null;
    let isFresh = true;

    if (Array.isArray(json.state)) {
      for (const item of json.state) {
        if (item.as_of) {
          if (!latestAsOf || new Date(item.as_of).getTime() > new Date(latestAsOf).getTime()) {
            latestAsOf = item.as_of;
          }
        }
        if (item.fresh_until) {
          if (!earliestFreshUntil || new Date(item.fresh_until).getTime() < new Date(earliestFreshUntil).getTime()) {
            earliestFreshUntil = item.fresh_until;
          }
          if (new Date(item.fresh_until).getTime() < now) {
            isFresh = false;
          }
        }
      }
    }

    const status: "fresh" | "stale" = isFresh ? "fresh" : "stale";

    return {
      id: entry.id,
      name: entry.name,
      endpointUrl: entry.endpointUrl,
      checkedAt,
      available: true,
      status,
      httpStatus: res.status,
      validation,
      payload: json,
      asOf: latestAsOf,
      freshUntil: earliestFreshUntil,
      isFresh,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network request failed";
    return {
      id: entry.id,
      name: entry.name,
      endpointUrl: entry.endpointUrl,
      checkedAt,
      available: false,
      status: "unavailable",
      error: message,
      payload: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function readApplicableDccEndpoints(
  coord: Coordinate,
  options: { timeoutMs?: number; revalidateSeconds?: number } = {},
): Promise<HydratedDccEndpoint[]> {
  const discovered = discoverDccEndpoints(coord);
  if (discovered.length === 0) return [];

  return Promise.all(
    discovered.map(async (entry) => {
      const matchedArea = entry.serviceAreas.find((area) => coordinateInArea(coord, area));
      const res = await fetchAndHydrateDccEndpoint(entry, options);
      return {
        ...res,
        matchedRegion: matchedArea?.name,
      };
    }),
  );
}
