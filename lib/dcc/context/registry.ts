import { isExcludedPortfolioSite } from "../portfolioNetworkRegistry";

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
  aliases?: string[];
}

export interface CanonicalOwnerEntry {
  id: string;
  name: string;
  canonicalDomain: string;
  allowedDestinations: string[]; // Strict destination binding
  productCategories: string[];
  aliases?: string[];
  enabled?: boolean;
}

export interface PortSafetyProfile {
  destination: string;
  timezone: string;
  defaultBufferMinutes: number;
  operatorModifiers?: Record<string, { bufferMinutes: number; reason: string }>;
}

const FEASTLY_DESTINATIONS = [
  "wisconsin-dells",
  "door-county",
  "gatlinburg",
  "lake-tahoe",
  "outer-banks",
  "destin-panama-city-beach",
  "big-bear",
  "branson",
  "broken-bow",
  "lake-of-the-ozarks",
  "scottsdale",
  "nashville",
  "hamptons",
  "lake-geneva",
  "minocqua",
  "gulf-shores",
  "myrtle-beach",
  "park-city",
];

export const DCC_SOURCE_SITES: Record<string, SourceSiteEntry> = {
  cruisepromenade: {
    id: "cruisepromenade",
    name: "Cruise Promenade",
    canonicalDomain: "cruisepromenade.com",
    role: "feeder",
    specialty: "cruise_itinerary_and_passenger_planning",
    aliases: ["cruise-promenade"],
  },
  lastfrontier: {
    id: "lastfrontier",
    name: "Last Frontier Shore Excursions",
    canonicalDomain: "lastfrontiershoreexcursions.com",
    role: "hybrid",
    specialty: "alaska_shore_excursions_and_port_comparisons",
    aliases: ["lastfrontiershoreexcursions", "last-frontier-shore-excursions"],
  },
  juneauflightdeck: {
    id: "juneauflightdeck",
    name: "Juneau Flight Deck",
    canonicalDomain: "juneauflightdeck.com",
    role: "hybrid",
    specialty: "juneau_helicopter_and_flightseeing_comparisons",
    aliases: ["juneau-flight-deck", "jfd"],
  },
  wno: {
    id: "wno",
    name: "Welcome to New Orleans",
    canonicalDomain: "welcometoneworleanstours.com",
    role: "feeder",
    specialty: "new_orleans_tours_and_culture",
    aliases: ["welcometoneworleanstours", "wno-tours"],
  },
  parr: {
    id: "parr",
    name: "Party at Red Rocks",
    canonicalDomain: "partyatredrocks.com",
    role: "hybrid",
    specialty: "concert_transportation_and_events",
    aliases: ["partyatredrocks", "party-at-red-rocks"],
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
  dcc: {
    id: "dcc",
    name: "Destination Command Center",
    canonicalDomain: "destinationcommandcenter.com",
    role: "authority",
    specialty: "cross_portfolio_decision_assurance_and_trip_context",
    aliases: ["destinationcommandcenter", "destination-command-center"],
  },
  welcometotheswamp: {
    id: "welcometotheswamp",
    name: "Welcome to the Swamp",
    canonicalDomain: "welcometotheswamp.com",
    role: "hybrid",
    specialty: "new_orleans_bayou_and_swamp_comparisons",
    aliases: ["welcome-to-the-swamp", "wts"],
  },
  vibearoundtown: {
    id: "vibearoundtown",
    name: "Vibing Around Tour Co.",
    canonicalDomain: "vibearoundtown.com",
    role: "hybrid",
    specialty: "cruise_port_private_local_driver_marketplace",
    aliases: ["vibing-around", "vibe-around-town"],
  },
  gosno: {
    id: "gosno",
    name: "GoSno",
    canonicalDomain: "gosno.co",
    role: "hybrid",
    specialty: "colorado_and_big_sky_private_mountain_transportation",
    aliases: ["gosno-production"],
  },
  feastlyspread: {
    id: "feastlyspread",
    name: "FeastlySpread",
    canonicalDomain: "feastlyspread.com",
    role: "hybrid",
    specialty: "vacation_rental_catering_spreads",
    aliases: ["feastly", "feastly-spread"],
  },
  "420friendlyairportpickup": {
    id: "420friendlyairportpickup",
    name: "420 Friendly Airport Pickup",
    canonicalDomain: "420friendlyairportpickup.com",
    role: "feeder",
    specialty: "denver_airport_transfer_with_dispensary_stop_context",
    aliases: ["420-airport-pickup", "420-friendly-airport-pickup"],
  },
};

export const DCC_CANONICAL_OWNERS: Record<string, CanonicalOwnerEntry> = {
  juneauflightdeck: {
    id: "juneauflightdeck",
    name: "Juneau Flight Deck",
    canonicalDomain: "juneauflightdeck.com",
    allowedDestinations: ["juneau"],
    productCategories: ["helicopter", "flightseeing", "glacier_landing"],
    aliases: ["juneau-flight-deck", "juneau_flight_deck", "jfd"],
    enabled: true,
  },
  lastfrontier: {
    id: "lastfrontier",
    name: "Last Frontier Shore Excursions",
    canonicalDomain: "lastfrontiershoreexcursions.com",
    allowedDestinations: ["juneau", "skagway", "ketchikan", "sitka", "icy-strait-point"],
    productCategories: ["shore_excursions", "whale_watching", "custom_charter"],
    aliases: [
      "lastfrontiershoreexcursions",
      "last-frontier-shore-excursions",
      "last_frontier",
      "last_frontier_shore_excursions",
    ],
    enabled: true,
  },
  cruisepromenade: {
    id: "cruisepromenade",
    name: "Cruise Promenade",
    canonicalDomain: "cruisepromenade.com",
    allowedDestinations: [
      "juneau",
      "skagway",
      "ketchikan",
      "sitka",
      "icy-strait-point",
      "new-orleans",
      "st-thomas",
      "st-john",
      "st-croix",
    ],
    productCategories: ["cruise_itinerary", "port_planning", "shared_cruise_plan"],
    aliases: ["cruise-promenade", "cruise_promenade"],
    enabled: true,
  },
  gosno: {
    id: "gosno",
    name: "GoSno Production",
    canonicalDomain: "gosno.co",
    allowedDestinations: [
      "denver",
      "morrison",
      "colorado-springs",
      "copper-mountain",
      "vail",
      "breckenridge",
      "big-sky",
    ],
    productCategories: ["mountain_shuttle", "airport_transfer", "flat_rate_corridor"],
    aliases: ["gosno-production", "gosno_production"],
    enabled: true,
  },
  partyatredrocks: {
    id: "partyatredrocks",
    name: "Party at Red Rocks",
    canonicalDomain: "partyatredrocks.com",
    allowedDestinations: ["morrison", "denver"],
    productCategories: ["concert_shuttle", "venue_pass"],
    aliases: ["parr", "party-at-red-rocks", "party_at_red_rocks"],
    enabled: true,
  },
  welcometotheswamp: {
    id: "welcometotheswamp",
    name: "Welcome to the Swamp",
    canonicalDomain: "welcometotheswamp.com",
    allowedDestinations: ["new-orleans"],
    productCategories: ["bayou_airboat", "swamp_tour"],
    aliases: ["welcome-to-the-swamp", "welcome_to_the_swamp", "wts"],
    enabled: true,
  },
  wno: {
    id: "wno",
    name: "Welcome to New Orleans",
    canonicalDomain: "welcometoneworleanstours.com",
    allowedDestinations: ["new-orleans"],
    productCategories: ["city_tour", "swamp_tour", "riverboat_cruise", "walking_tour"],
    aliases: [
      "welcometoneworleanstours",
      "wno-tours",
      "welcome-to-new-orleans",
      "welcome_to_new_orleans",
    ],
    enabled: true,
  },
  dcc: {
    id: "dcc",
    name: "Destination Command Center",
    canonicalDomain: "destinationcommandcenter.com",
    allowedDestinations: [
      "juneau",
      "skagway",
      "ketchikan",
      "sitka",
      "icy-strait-point",
      "denver",
      "morrison",
      "colorado-springs",
      "copper-mountain",
      "vail",
      "breckenridge",
      "big-sky",
      "new-orleans",
      "st-thomas",
      "st-john",
      "st-croix",
      "chetek",
      "eau-claire",
      ...FEASTLY_DESTINATIONS,
    ],
    productCategories: ["helicopter", "shore_excursions", "swamp_tour", "mountain_shuttle"],
    aliases: ["destinationcommandcenter", "destination-command-center", "destination_command_center"],
    enabled: true,
  },
  "vibing-around": {
    id: "vibing-around",
    name: "Vibe Around Town",
    canonicalDomain: "vibearoundtown.com",
    allowedDestinations: [
      "juneau",
      "skagway",
      "ketchikan",
      "st-thomas",
      "st-john",
      "st-croix",
      "denver",
      "morrison",
      "new-orleans",
      "chetek",
      "wisconsin-dells",
    ],
    productCategories: ["private_driver", "micro_fleet", "custom_tour"],
    aliases: ["vibearoundtown", "vibe-around-town", "vibe_around_town", "vibing_around"],
    enabled: true,
  },
  feastlyspread: {
    id: "feastlyspread",
    name: "FeastlySpread",
    canonicalDomain: "feastlyspread.com",
    allowedDestinations: FEASTLY_DESTINATIONS,
    productCategories: ["vacation_rental_catering", "coverage_request_inquiry"],
    aliases: ["feastly", "feastly-spread", "feastly_spread"],
    enabled: true,
  },
  brinkberry: {
    id: "brinkberry",
    name: "Brinkberry",
    canonicalDomain: "brinkberry.com",
    allowedDestinations: [
      "chetek",
      "eau-claire",
      "wisconsin-dells",
      "door-county",
      "morrison",
      "denver",
    ],
    productCategories: ["regional_events", "concert_feeder", "group_stay_feeder"],
    enabled: true,
  },
  "420friendlyairportpickup": {
    id: "420friendlyairportpickup",
    name: "420 Friendly Airport Pickup",
    canonicalDomain: "420friendlyairportpickup.com",
    allowedDestinations: [
      "denver",
      "colorado-springs",
      "morrison",
      "copper-mountain",
      "vail",
      "breckenridge",
    ],
    productCategories: ["airport_transfer", "dispensary_stop_transfer"],
    aliases: [
      "420-airport-pickup",
      "420-friendly-airport-pickup",
      "420_airport_pickup",
      "420_friendly_airport_pickup",
    ],
    enabled: true,
  },
  disabled_portfolio_owner: {
    id: "disabled_portfolio_owner",
    name: "Disabled Portfolio Owner (Test/Suspended)",
    canonicalDomain: "disabled-owner.destinationcommandcenter.invalid",
    allowedDestinations: ["juneau", "denver", "new-orleans", "wisconsin-dells"],
    productCategories: ["suspended_owner"],
    aliases: [
      "disabled-owner",
      "disabled_owner",
      "disabled-portfolio-owner",
      "disabled-portfolio-owner.example.com",
    ],
    enabled: false,
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
  sitka: {
    destination: "sitka",
    timezone: "America/Anchorage",
    defaultBufferMinutes: 75,
  },
  "icy-strait-point": {
    destination: "icy-strait-point",
    timezone: "America/Anchorage",
    defaultBufferMinutes: 60,
  },
  "st-thomas": {
    destination: "st-thomas",
    timezone: "America/St_Thomas",
    defaultBufferMinutes: 60,
  },
  "st-john": {
    destination: "st-john",
    timezone: "America/St_Thomas",
    defaultBufferMinutes: 90,
  },
  "st-croix": {
    destination: "st-croix",
    timezone: "America/St_Thomas",
    defaultBufferMinutes: 60,
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
  "colorado-springs": {
    destination: "colorado-springs",
    timezone: "America/Denver",
    defaultBufferMinutes: 60,
  },
  "copper-mountain": {
    destination: "copper-mountain",
    timezone: "America/Denver",
    defaultBufferMinutes: 120,
  },
  vail: {
    destination: "vail",
    timezone: "America/Denver",
    defaultBufferMinutes: 120,
  },
  breckenridge: {
    destination: "breckenridge",
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
  "eau-claire": {
    destination: "eau-claire",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  "wisconsin-dells": {
    destination: "wisconsin-dells",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  "door-county": {
    destination: "door-county",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  gatlinburg: {
    destination: "gatlinburg",
    timezone: "America/New_York",
    defaultBufferMinutes: 0,
  },
  "lake-tahoe": {
    destination: "lake-tahoe",
    timezone: "America/Los_Angeles",
    defaultBufferMinutes: 0,
  },
  "outer-banks": {
    destination: "outer-banks",
    timezone: "America/New_York",
    defaultBufferMinutes: 0,
  },
  "destin-panama-city-beach": {
    destination: "destin-panama-city-beach",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  "big-bear": {
    destination: "big-bear",
    timezone: "America/Los_Angeles",
    defaultBufferMinutes: 0,
  },
  branson: {
    destination: "branson",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  "broken-bow": {
    destination: "broken-bow",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  "lake-of-the-ozarks": {
    destination: "lake-of-the-ozarks",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  scottsdale: {
    destination: "scottsdale",
    timezone: "America/Phoenix",
    defaultBufferMinutes: 0,
  },
  nashville: {
    destination: "nashville",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  hamptons: {
    destination: "hamptons",
    timezone: "America/New_York",
    defaultBufferMinutes: 0,
  },
  "lake-geneva": {
    destination: "lake-geneva",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  minocqua: {
    destination: "minocqua",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  "gulf-shores": {
    destination: "gulf-shores",
    timezone: "America/Chicago",
    defaultBufferMinutes: 0,
  },
  "myrtle-beach": {
    destination: "myrtle-beach",
    timezone: "America/New_York",
    defaultBufferMinutes: 0,
  },
  "park-city": {
    destination: "park-city",
    timezone: "America/Denver",
    defaultBufferMinutes: 0,
  },
};

export function resolveSourceSite(identifier: string): SourceSiteEntry | null {
  if (!identifier || isExcludedPortfolioSite(identifier)) return null;
  const id = identifier.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  if (DCC_SOURCE_SITES[id]) return DCC_SOURCE_SITES[id];
  for (const site of Object.values(DCC_SOURCE_SITES)) {
    if (site.canonicalDomain.toLowerCase() === id) return site;
    if (site.aliases?.some((alias) => alias.toLowerCase() === id)) return site;
  }
  return null;
}

export function isValidSourceSite(identifier: string): boolean {
  return resolveSourceSite(identifier) !== null;
}

export function resolveCanonicalOwner(identifier: string): CanonicalOwnerEntry | null {
  if (!identifier || isExcludedPortfolioSite(identifier)) return null;
  const id = identifier.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  if (DCC_CANONICAL_OWNERS[id]) return DCC_CANONICAL_OWNERS[id];
  for (const owner of Object.values(DCC_CANONICAL_OWNERS)) {
    if (owner.canonicalDomain.toLowerCase() === id) return owner;
    if (owner.aliases?.some((alias) => alias.toLowerCase() === id)) return owner;
  }
  return null;
}

export function isValidCanonicalOwner(identifier: string): boolean {
  return resolveCanonicalOwner(identifier) !== null;
}

export function isOwnerEnabled(
  identifier: string,
  runtimeDisabledOwners?: string[]
): boolean {
  const owner = resolveCanonicalOwner(identifier);
  if (!owner) return false;
  if (owner.enabled === false) return false;
  const envDisabled = (process.env.DCC_DISABLED_OWNERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allDisabled = [...envDisabled, ...(runtimeDisabledOwners || [])];
  for (const disabledId of allDisabled) {
    const resolvedDisabled = resolveCanonicalOwner(disabledId);
    if (resolvedDisabled && resolvedDisabled.id === owner.id) {
      return false;
    }
    if (disabledId.toLowerCase() === owner.id.toLowerCase()) {
      return false;
    }
  }
  return true;
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
 * Authoritative minimum buffers come strictly from DCC (`DCC_SAFETY_PROFILES`).
 * A client may request an additional preference buffer (`additionalPreferenceBufferMinutes >= 0`),
 * which is added on top of the DCC minimum floor, and may NEVER reduce the DCC minimum.
 */
export function resolveAuthoritativeBuffer(
  destination: string,
  additionalPreferenceBufferMinutes?: number | null,
  operatorModifierKey?: string | null
): number {
  const profile = getAuthoritativeSafetyProfile(destination);
  let authoritativeFloor = profile.defaultBufferMinutes;

  if (operatorModifierKey && profile.operatorModifiers && profile.operatorModifiers[operatorModifierKey]) {
    authoritativeFloor = profile.operatorModifiers[operatorModifierKey].bufferMinutes;
  }

  if (
    typeof additionalPreferenceBufferMinutes === "number" &&
    Number.isFinite(additionalPreferenceBufferMinutes) &&
    additionalPreferenceBufferMinutes > 0
  ) {
    return authoritativeFloor + Math.min(240, Math.round(additionalPreferenceBufferMinutes));
  }

  return authoritativeFloor; // Enforce authoritative safety floor
}

export const ALLOWED_DCC_DOMAINS = [
  "destinationcommandcenter.com",
  "cruisepromenade.com",
  "lastfrontiershoreexcursions.com",
  "juneauflightdeck.com",
  "welcometoneworleanstours.com",
  "welcometotheswamp.com",
  "vibearoundtown.com",
  "gosno.co",
  "feastlyspread.com",
  "brinkberry.com",
  "partyatredrocks.com",
  "420friendlyairportpickup.com",
  "bluehillsoutpost.com",
  "welcometothedells.com",
] as const;

export function isAllowedOrigin(originHeader: string | null | undefined): boolean {
  if (!originHeader) return true; // Server-to-server or direct calls without browser origin
  try {
    const url = new URL(originHeader);
    const protocol = url.protocol.toLowerCase();
    const host = url.hostname.toLowerCase();
    const port = url.port;
    const isProd = process.env.NODE_ENV === "production" && process.env.APP_ENV !== "staging";

    if (isExcludedPortfolioSite(host)) {
      return false;
    }

    // Reject non-standard protocols
    if (protocol !== "https:" && protocol !== "http:") {
      return false;
    }

    if (!isProd) {
      if (
        (host === "localhost" || host === "127.0.0.1") &&
        (protocol === "http:" || protocol === "https:")
      ) {
        return true;
      }
      if (host.endsWith(".vercel.app") && protocol === "https:") {
        return true;
      }
    }

    // In production, require HTTPS and standard port
    if (isProd && (protocol !== "https:" || (port !== "" && port !== "443"))) {
      return false;
    }

    // Exact domain or authentic subdomain with leading dot (e.g., www.cruisepromenade.com)
    return ALLOWED_DCC_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}