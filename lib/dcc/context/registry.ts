/**
 * Authoritative Server-Side Registry of Known DCC Entities.
 * Used to validate source sites, canonical owners, destinations, and safety buffers.
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
  destination: string;
  productCategories: string[];
}

export interface PortSafetyProfile {
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
    destination: "juneau",
    productCategories: ["helicopter", "flightseeing", "glacier_landing"],
  },
  lastfrontier: {
    id: "lastfrontier",
    name: "Last Frontier Shore Excursions",
    canonicalDomain: "lastfrontiershoreexcursions.com",
    destination: "alaska_ports",
    productCategories: ["shore_excursions", "whale_watching", "custom_charter"],
  },
  gosno: {
    id: "gosno",
    name: "GoSno Production",
    canonicalDomain: "gosno.co",
    destination: "colorado_montana",
    productCategories: ["mountain_shuttle", "airport_transfer", "flat_rate_corridor"],
  },
  partyatredrocks: {
    id: "partyatredrocks",
    name: "Party at Red Rocks",
    canonicalDomain: "partyatredrocks.com",
    destination: "morrison",
    productCategories: ["concert_shuttle", "venue_pass"],
  },
  welcometotheswamp: {
    id: "welcometotheswamp",
    name: "Welcome to the Swamp",
    canonicalDomain: "welcometotheswamp.com",
    destination: "new_orleans",
    productCategories: ["bayou_airboat", "swamp_tour"],
  },
  "vibing-around": {
    id: "vibing-around",
    name: "Vibe Around Town",
    canonicalDomain: "vibearoundtown.com",
    destination: "multi_market",
    productCategories: ["private_driver", "micro_fleet", "custom_tour"],
  },
};

export const DCC_SAFETY_PROFILES: Record<string, PortSafetyProfile> = {
  juneau: {
    timezone: "America/Anchorage",
    defaultBufferMinutes: 90,
    operatorModifiers: {
      auke_bay_heliport: { bufferMinutes: 90, reason: "Requires 25-minute shuttle transit to cruise docks" },
      downtown_floatplane: { bufferMinutes: 60, reason: "Adjacent to Franklin & Marine Park docks" },
      mendenhall_hiking: { bufferMinutes: 75, reason: "15-minute valley transit" },
    },
  },
  skagway: {
    timezone: "America/Anchorage",
    defaultBufferMinutes: 60,
    operatorModifiers: {
      ore_dock: { bufferMinutes: 45, reason: "Direct walkable pier" },
      klondike_highway: { bufferMinutes: 75, reason: "Mountain pass customs & road buffer" },
    },
  },
  ketchikan: {
    timezone: "America/Anchorage",
    defaultBufferMinutes: 75,
    operatorModifiers: {
      ward_cove: { bufferMinutes: 90, reason: "Requires 20-minute bus transfer from Berth 4" },
      downtown_berths: { bufferMinutes: 60, reason: "Downtown waterfront berths 1-3" },
    },
  },
  morrison: {
    timezone: "America/Denver",
    defaultBufferMinutes: 60,
  },
  denver: {
    timezone: "America/Denver",
    defaultBufferMinutes: 60,
  },
  "copper-mountain": {
    timezone: "America/Denver",
    defaultBufferMinutes: 120,
  },
  "big-sky": {
    timezone: "America/Denver",
    defaultBufferMinutes: 90,
  },
  "new-orleans": {
    timezone: "America/Chicago",
    defaultBufferMinutes: 45,
  },
  chetek: {
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  "wisconsin-dells": {
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
};

export function isValidSourceSite(siteId: string): boolean {
  return siteId in DCC_SOURCE_SITES;
}

export function isValidCanonicalOwner(ownerId: string): boolean {
  return ownerId in DCC_CANONICAL_OWNERS;
}

export function resolveDestinationSafetyProfile(destination: string): PortSafetyProfile {
  return (
    DCC_SAFETY_PROFILES[destination] || {
      timezone: "UTC",
      defaultBufferMinutes: 60,
    }
  );
}