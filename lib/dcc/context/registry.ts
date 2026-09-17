/**
 * Authoritative Server-Side Registry of Known DCC Entities.
 * Synchronized with dcc-protocol specification standards.
 */

export interface SourceSiteEntry {
  id: string;
  name: string;
  canonicalDomain: string;
  role: "feeder" | "hybrid" | "authority";
  specialty: string;
}

export interface CanonicalOwnerEntry {
  id: string;
  name: string;
  canonicalDomain: string;
  allowedDestinations: string[]; // Strict destination binding
  productCategories: string[];
}

export interface PortSafetyProfile {
  destination: string;
  timezone: string;
  defaultBufferMinutes: number;
  operatorModifiers?: Record<string, { bufferMinutes: number; reason: string }>;
}

export const DCC_SOURCE_SITES: Record<string, SourceSiteEntry> = {
  cruisepromenade: {
    id: "cruisepromenade",
    name: "Cruise Promenade",
    canonicalDomain: "cruisepromenade.com",
    role: "feeder",
    specialty: "cruise_itinerary_and_passenger_planning",
  },
  wta: {
    id: "wta",
    name: "Welcome to Alaska",
    canonicalDomain: "welcometoalaskatours.com",
    role: "feeder",
    specialty: "alaska_destination_authority_and_seo",
  },
  wno: {
    id: "wno",
    name: "Welcome to New Orleans",
    canonicalDomain: "welcometoneworleanstours.com",
    role: "feeder",
    specialty: "new_orleans_tours_and_culture",
  },
  parr: {
    id: "parr",
    name: "Party at Red Rocks",
    canonicalDomain: "partyatredrocks.com",
    role: "hybrid",
    specialty: "concert_transportation_and_events",
  },
  bluehills: {
    id: "bluehills",
    name: "Blue Hills Outpost",
    canonicalDomain: "bluehillsoutpost.com",
    role: "feeder",
    specialty: "wisconsin_northwoods_cabin_lake_guides",
  },
  brinkberry: {
    id: "brinkberry",
    name: "Brinkberry",
    canonicalDomain: "brinkberry.com",
    role: "feeder",
    specialty: "chippewa_valley_community_events",
  },
  dells: {
    id: "dells",
    name: "Welcome to the Dells",
    canonicalDomain: "welcometothedells.com",
    role: "feeder",
    specialty: "wisconsin_dells_family_and_groups",
  },
};

export const DCC_CANONICAL_OWNERS: Record<string, CanonicalOwnerEntry> = {
  juneauflightdeck: {
    id: "juneauflightdeck",
    name: "Juneau Flight Deck",
    canonicalDomain: "juneauflightdeck.com",
    allowedDestinations: ["juneau"],
    productCategories: ["helicopter", "flightseeing", "glacier_landing"],
  },
  lastfrontier: {
    id: "lastfrontier",
    name: "Last Frontier Shore Excursions",
    canonicalDomain: "lastfrontiershoreexcursions.com",
    allowedDestinations: ["juneau", "skagway", "ketchikan"],
    productCategories: ["shore_excursions", "whale_watching", "custom_charter"],
  },
  gosno: {
    id: "gosno",
    name: "GoSno Production",
    canonicalDomain: "gosno.co",
    allowedDestinations: ["denver", "morrison", "copper-mountain", "big-sky"],
    productCategories: ["mountain_shuttle", "airport_transfer", "flat_rate_corridor"],
  },
  partyatredrocks: {
    id: "partyatredrocks",
    name: "Party at Red Rocks",
    canonicalDomain: "partyatredrocks.com",
    allowedDestinations: ["morrison", "denver"],
    productCategories: ["concert_shuttle", "venue_pass"],
  },
  welcometotheswamp: {
    id: "welcometotheswamp",
    name: "Welcome to the Swamp",
    canonicalDomain: "welcometotheswamp.com",
    allowedDestinations: ["new-orleans"],
    productCategories: ["bayou_airboat", "swamp_tour"],
  },
  "vibing-around": {
    id: "vibing-around",
    name: "Vibe Around Town",
    canonicalDomain: "vibearoundtown.com",
    allowedDestinations: ["juneau", "skagway", "ketchikan", "denver", "morrison", "new-orleans", "chetek", "wisconsin-dells"],
    productCategories: ["private_driver", "micro_fleet", "custom_tour"],
  },
};

export const DCC_SAFETY_PROFILES: Record<string, PortSafetyProfile> = {
  juneau: {
    destination: "juneau",
    timezone: "America/Anchorage",
    defaultBufferMinutes: 90,
    operatorModifiers: {
      auke_bay_heliport: { bufferMinutes: 90, reason: "Requires 25-minute shuttle transit to cruise docks" },
      downtown_floatplane: { bufferMinutes: 60, reason: "Adjacent to Franklin & Marine Park docks" },
      mendenhall_hiking: { bufferMinutes: 75, reason: "15-minute valley transit" },
    },
  },
  skagway: {
    destination: "skagway",
    timezone: "America/Anchorage",
    defaultBufferMinutes: 60,
    operatorModifiers: {
      ore_dock: { bufferMinutes: 45, reason: "Direct walkable pier" },
      klondike_highway: { bufferMinutes: 75, reason: "Mountain pass customs & road buffer" },
    },
  },
  ketchikan: {
    destination: "ketchikan",
    timezone: "America/Anchorage",
    defaultBufferMinutes: 75,
    operatorModifiers: {
      ward_cove: { bufferMinutes: 90, reason: "Requires 20-minute bus transfer from Berth 4" },
      downtown_berths: { bufferMinutes: 60, reason: "Downtown waterfront berths 1-3" },
    },
  },
  morrison: {
    destination: "morrison",
    timezone: "America/Denver",
    defaultBufferMinutes: 60,
  },
  denver: {
    destination: "denver",
    timezone: "America/Denver",
    defaultBufferMinutes: 60,
  },
  "copper-mountain": {
    destination: "copper-mountain",
    timezone: "America/Denver",
    defaultBufferMinutes: 120,
  },
  "big-sky": {
    destination: "big-sky",
    timezone: "America/Denver",
    defaultBufferMinutes: 90,
  },
  "new-orleans": {
    destination: "new-orleans",
    timezone: "America/Chicago",
    defaultBufferMinutes: 45,
  },
  chetek: {
    destination: "chetek",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  "wisconsin-dells": {
    destination: "wisconsin-dells",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
};

export function resolveSourceSite(identifier: string): SourceSiteEntry | null {
  if (!identifier) return null;
  const id = identifier.trim().toLowerCase();
  if (DCC_SOURCE_SITES[id]) return DCC_SOURCE_SITES[id];
  for (const site of Object.values(DCC_SOURCE_SITES)) {
    if (site.canonicalDomain.toLowerCase() === id) return site;
  }
  return null;
}

export function isValidSourceSite(identifier: string): boolean {
  return resolveSourceSite(identifier) !== null;
}

export function resolveCanonicalOwner(identifier: string): CanonicalOwnerEntry | null {
  if (!identifier) return null;
  const id = identifier.trim().toLowerCase();
  if (DCC_CANONICAL_OWNERS[id]) return DCC_CANONICAL_OWNERS[id];
  for (const owner of Object.values(DCC_CANONICAL_OWNERS)) {
    if (owner.canonicalDomain.toLowerCase() === id) return owner;
  }
  return null;
}

export function isValidCanonicalOwner(identifier: string): boolean {
  return resolveCanonicalOwner(identifier) !== null;
}

export function isValidDestination(destination: string): boolean {
  if (!destination) return false;
  return destination.trim().toLowerCase() in DCC_SAFETY_PROFILES;
}

export function isOwnerValidForDestination(ownerIdentifier: string, destination: string): boolean {
  const owner = resolveCanonicalOwner(ownerIdentifier);
  if (!owner) return false;
  return owner.allowedDestinations.includes(destination.trim().toLowerCase());
}

export function getAuthoritativeSafetyProfile(destination: string): PortSafetyProfile {
  const profile = DCC_SAFETY_PROFILES[destination];
  if (!profile) {
    throw new Error(`Unknown destination '${destination}': no authoritative safety profile registered.`);
  }
  return profile;
}

/**
 * Calculates authoritative safety buffer.
 * Client override is ONLY permitted if it INCREASES safety (greater buffer).
 * Client attempts to reduce the buffer below the authoritative safety floor are strictly ignored and clamped.
 */
export function resolveAuthoritativeBuffer(
  destination: string,
  clientRequestedBuffer?: number | null,
  operatorModifierKey?: string | null
): number {
  const profile = getAuthoritativeSafetyProfile(destination);
  let authoritativeFloor = profile.defaultBufferMinutes;

  if (operatorModifierKey && profile.operatorModifiers && profile.operatorModifiers[operatorModifierKey]) {
    authoritativeFloor = profile.operatorModifiers[operatorModifierKey].bufferMinutes;
  }

  if (typeof clientRequestedBuffer === "number" && clientRequestedBuffer > authoritativeFloor) {
    return clientRequestedBuffer; // Client requested stricter safety
  }

  return authoritativeFloor; // Enforce authoritative safety floor
}

export const ALLOWED_DCC_DOMAINS = [
  "cruisepromenade.com",
  "welcometoalaskatours.com",
  "welcometoneworleanstours.com",
  "partyatredrocks.com",
  "bluehillsoutpost.com",
  "brinkberry.com",
  "welcometothedells.com",
  "juneauflightdeck.com",
  "lastfrontiershoreexcursions.com",
  "gosno.co",
  "welcometotheswamp.com",
  "vibearoundtown.com",
  "destinationcommandcenter.com",
] as const;

export function isAllowedOrigin(originHeader: string | null | undefined): boolean {
  if (!originHeader) return true; // Server-to-server or direct requests without origin
  try {
    const url = new URL(originHeader);
    const host = url.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".vercel.app")
    ) {
      return true;
    }

    return ALLOWED_DCC_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}