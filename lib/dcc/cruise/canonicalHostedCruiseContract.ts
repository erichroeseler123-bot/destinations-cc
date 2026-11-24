/**
 * Canonical Entity & Page Ownership Contract (v1.0.0)
 *
 * Governing Rule:
 * Every fact, review, message, booking, page, and calculation has exactly one
 * authoritative owner. Other systems may reference or display it via canonical IDs,
 * never independently recreate or copy it.
 */

export const CANONICAL_HOSTED_CRUISE_CONTRACT_VERSION = "2026-11-15.v1" as const;

export const SYSTEM_OF_RECORD_OWNERSHIP = {
  ships_and_cruise_lines: "dcc",
  physical_sailing_schedule: "dcc",
  port_facts_and_timing: "dcc",
  hosted_organizer_identity: "dcc",
  hosted_franchise_identity: "dcc",
  official_booking_source: "dcc",
  hosted_programming_facts: "dcc",
  public_organizer_description: "dcc",
  reviews: "cruise_promenade",
  review_moderation: "cruise_promenade_with_dcc_admin_control",
  planner_activities: "cruise_promenade",
  private_members: "rollcall_usa",
  private_messages: "rollcall_usa",
  live_operator_inventory: "operator_cached_by_dcc",
  booking_order: "actual_seller",
  affiliate_routing: "dcc_commercial_registry",
  tour_product_description: "operator_or_specialist_site",
  analytics: "shared_event_ledger_summarized_by_dcc",
} as const;

export type CanonicalCruiseLineCode =
  | "rccl"
  | "ccl"
  | "ncl"
  | "cel"
  | "pcl"
  | "hal"
  | "msc"
  | "dcl"
  | "vv"
  | "tui"
  | "uniworld"
  | "amadeus"
  | "atlas"
  | "windstar"
  | "ak"
  | "gaysail"
  | "azamara"
  | "ponant"
  | "explora"
  | "viking"
  | "amawaterways"
  | "sonesta";

const LINE_CODE_ALIASES: Record<string, CanonicalCruiseLineCode> = {
  rccl: "rccl",
  "royal-caribbean": "rccl",
  "royal caribbean": "rccl",
  "royal caribbean international": "rccl",
  ccl: "ccl",
  carnival: "ccl",
  "carnival cruise line": "ccl",
  ncl: "ncl",
  norwegian: "ncl",
  "norwegian cruise line": "ncl",
  cel: "cel",
  celebrity: "cel",
  "celebrity cruises": "cel",
  pcl: "pcl",
  princess: "pcl",
  "princess cruises": "pcl",
  hal: "hal",
  holland: "hal",
  "holland-america": "hal",
  "holland america": "hal",
  "holland america line": "hal",
  msc: "msc",
  "msc cruises": "msc",
  dcl: "dcl",
  disney: "dcl",
  "disney cruise line": "dcl",
  vv: "vv",
  virgin: "vv",
  "virgin-voyages": "vv",
  "virgin voyages": "vv",
  tui: "tui",
  "tui-cruises": "tui",
  "tui cruises": "tui",
  "tui cruises (mein schiff)": "tui",
  "mein-schiff": "tui",
  "mein schiff": "tui",
  uniworld: "uniworld",
  "uniworld boutique river cruises": "uniworld",
  "uniworld boutique river cruise collection": "uniworld",
  amadeus: "amadeus",
  "amadeus river cruises": "amadeus",
  atlas: "atlas",
  "atlas ocean voyages": "atlas",
  windstar: "windstar",
  "windstar cruises": "windstar",
  ak: "ak",
  "abercrombie & kent": "ak",
  "abercrombie and kent": "ak",
  gaysail: "gaysail",
  "gaysail fleet": "gaysail",
  "gaysail catamaran & yacht fleet": "gaysail",
  azamara: "azamara",
  "azamara cruises": "azamara",
  ponant: "ponant",
  explora: "explora",
  viking: "viking",
  "viking ocean cruises": "viking",
  amawaterways: "amawaterways",
  sonesta: "sonesta",
  "sonesta nile cruises": "sonesta",
  "explora journeys": "explora",
};

export function tryNormalizeCanonicalCruiseLineCode(
  raw: string | null | undefined,
): CanonicalCruiseLineCode | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  return LINE_CODE_ALIASES[key] ?? null;
}

export function normalizeCanonicalCruiseLineCode(raw: string): CanonicalCruiseLineCode {
  const mapped = tryNormalizeCanonicalCruiseLineCode(raw);
  if (!mapped) {
    throw new Error(`Unsupported canonical cruise line identifier: "${raw}"`);
  }
  return mapped;
}

export interface DatedShipOperatorRegistryEntry {
  shipSlug: string;
  canonicalLineCode: CanonicalCruiseLineCode;
  sourceUrl: string;
  verifiedAtIso: string;
  effectiveFromIsoDate: string;
  effectiveThroughIsoDate?: string | null;
}

export function isValidDatedShipOperatorRegistryEntry(
  entry: DatedShipOperatorRegistryEntry | null | undefined,
): entry is DatedShipOperatorRegistryEntry {
  if (!entry || typeof entry !== "object") return false;
  const slug = typeof entry.shipSlug === "string" ? entry.shipSlug.trim().toLowerCase() : "";
  if (!slug || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) return false;
  if (!tryNormalizeCanonicalCruiseLineCode(entry.canonicalLineCode)) return false;
  const src = typeof entry.sourceUrl === "string" ? entry.sourceUrl.trim() : "";
  if (!/^https:\/\/[^\s]+$/i.test(src)) return false;
  const ver = typeof entry.verifiedAtIso === "string" ? entry.verifiedAtIso.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}(?:T.+)?$/.test(ver) || !Number.isFinite(Date.parse(ver))) return false;
  const from = typeof entry.effectiveFromIsoDate === "string" ? entry.effectiveFromIsoDate.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return false;
  if (entry.effectiveThroughIsoDate !== undefined && entry.effectiveThroughIsoDate !== null) {
    const through = String(entry.effectiveThroughIsoDate).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(through) || through < from) return false;
  }
  return true;
}

export type PhysicalSailingLineResolutionSource =
  | "verified_sailing_record"
  | "cruise_line_alias_resolver"
  | "dated_ship_operator_registry"
  | "unresolved";

export interface UnresolvedPhysicalSailingFindingContext {
  shipSlug: string;
  sailDate: string;
  verifiedSailingCruiseLine?: string | null;
  cruiseLineInput?: string | null;
  reason: "unrecognized_or_missing_line_code" | "ambiguous_dated_ship_operator";
  sourceContext?: string;
  isSyntheticTest?: boolean;
}

export interface PhysicalSailingIdResolutionResult {
  physicalSailingId: string | null;
  lineCode: CanonicalCruiseLineCode | null;
  resolutionSource: PhysicalSailingLineResolutionSource;
  verificationFindingId: string | null;
}

/**
 * Resolves canonical `physicalSailingId` (`sailing:<lineCode>:<shipSlug>:<YYYY-MM-DD>`)
 * strictly in the approved 4-step order:
 *   1. Verified physical-sailing record's canonical cruise-line field.
 *   2. DCC's existing cruise-line alias/canonicalization resolver.
 *   3. Dated ship/operator registry ONLY when unambiguous (`matches.length === 1`) for `sailDate`.
 *   4. Otherwise return `physicalSailingId: null` and record a verification finding.
 *
 * Never infers `lineCode` from `shipSlug` or ship name alone.
 */
export function resolvePhysicalSailingIdStrict(input: {
  shipSlug: string;
  sailDate: string;
  verifiedSailingCruiseLine?: string | null;
  cruiseLineInput?: string | null;
  datedShipRegistry?: ReadonlyArray<DatedShipOperatorRegistryEntry>;
  sourceContext?: string;
  isSyntheticTest?: boolean;
  onUnresolvedFinding?: (ctx: UnresolvedPhysicalSailingFindingContext) => string | null;
}): PhysicalSailingIdResolutionResult {
  const cleanShip = String(input.shipSlug || "").trim().toLowerCase();
  const cleanDate = String(input.sailDate || "").trim();
  if (!cleanShip || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(cleanShip) || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error(`Invalid physical sailing components: ship="${input.shipSlug}", date="${input.sailDate}"`);
  }

  // Step 1: Verified physical-sailing record's canonical cruise-line field
  const step1Line = tryNormalizeCanonicalCruiseLineCode(input.verifiedSailingCruiseLine);
  if (step1Line) {
    return {
      physicalSailingId: `sailing:${step1Line}:${cleanShip}:${cleanDate}`,
      lineCode: step1Line,
      resolutionSource: "verified_sailing_record",
      verificationFindingId: null,
    };
  }

  // Step 2: DCC's existing cruise-line alias/canonicalization resolver
  const step2Line = tryNormalizeCanonicalCruiseLineCode(input.cruiseLineInput);
  if (step2Line) {
    return {
      physicalSailingId: `sailing:${step2Line}:${cleanShip}:${cleanDate}`,
      lineCode: step2Line,
      resolutionSource: "cruise_line_alias_resolver",
      verificationFindingId: null,
    };
  }

  // Step 3: Explicitly sourced dated ship/operator registry ONLY when exactly one assignment is effective on `sailDate`
  let ambiguousDatedMatch = false;
  if (Array.isArray(input.datedShipRegistry) && input.datedShipRegistry.length > 0) {
    const matches = input.datedShipRegistry.filter((entry) => {
      if (!isValidDatedShipOperatorRegistryEntry(entry)) return false;
      if (entry.shipSlug.trim().toLowerCase() !== cleanShip) return false;
      if (cleanDate < entry.effectiveFromIsoDate) return false;
      if (entry.effectiveThroughIsoDate && cleanDate > entry.effectiveThroughIsoDate) {
        return false;
      }
      return true;
    });
    if (matches.length === 1) {
      const step3Line = matches[0]!.canonicalLineCode;
      return {
        physicalSailingId: `sailing:${step3Line}:${cleanShip}:${cleanDate}`,
        lineCode: step3Line,
        resolutionSource: "dated_ship_operator_registry",
        verificationFindingId: null,
      };
    }
    if (matches.length > 1) {
      ambiguousDatedMatch = true;
    }
  }

  // Step 4: Return null and record a verification finding (never guess from ship name)
  const reason = ambiguousDatedMatch
    ? "ambiguous_dated_ship_operator"
    : "unrecognized_or_missing_line_code";
  const verificationFindingId = input.onUnresolvedFinding
    ? input.onUnresolvedFinding({
        shipSlug: cleanShip,
        sailDate: cleanDate,
        verifiedSailingCruiseLine: input.verifiedSailingCruiseLine ?? null,
        cruiseLineInput: input.cruiseLineInput ?? null,
        reason,
        sourceContext: input.sourceContext,
        isSyntheticTest: input.isSyntheticTest,
      })
    : null;

  return {
    physicalSailingId: null,
    lineCode: null,
    resolutionSource: "unresolved",
    verificationFindingId,
  };
}

export function buildPhysicalSailingId(
  lineInput: string,
  shipSlug: string,
  sailDate: string,
): string {
  const lineCode = normalizeCanonicalCruiseLineCode(lineInput);
  const cleanShip = shipSlug.trim().toLowerCase();
  const cleanDate = sailDate.trim();
  if (!cleanShip || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error(`Invalid physical sailing components: ship="${shipSlug}", date="${sailDate}"`);
  }
  return `sailing:${lineCode}:${cleanShip}:${cleanDate}`;
}

export function buildHostedOrganizerId(organizerSlug: string): string {
  const clean = organizerSlug.trim().toLowerCase();
  if (!clean || !/^[a-z0-9-]+$/.test(clean)) {
    throw new Error(`Invalid canonical organizerSlug: "${organizerSlug}"`);
  }
  return `hosted-organizer:${clean}`;
}

export function buildHostedFranchiseId(franchiseSlug: string): string {
  const clean = franchiseSlug.trim().toLowerCase();
  if (!clean || !/^[a-z0-9-]+$/.test(clean)) {
    throw new Error(`Invalid canonical franchiseSlug: "${franchiseSlug}"`);
  }
  return `hosted-franchise:${clean}`;
}

export function buildHostedSailingId(
  organizerSlug: string,
  lineInput: string,
  shipSlug: string,
  sailDate: string,
): string {
  const lineCode = normalizeCanonicalCruiseLineCode(lineInput);
  const cleanOrg = organizerSlug.trim().toLowerCase();
  const cleanShip = shipSlug.trim().toLowerCase();
  const cleanDate = sailDate.trim();
  if (!cleanOrg || !cleanShip || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    throw new Error(
      `Invalid hosted sailing ID components: org="${organizerSlug}", ship="${shipSlug}", date="${sailDate}"`,
    );
  }
  return `hosted-sailing:${cleanOrg}:${lineCode}:${cleanShip}:${cleanDate}`;
}

export function buildPrivateCommunityId(
  organizerSlugOrIndependent: string,
  shipSlug: string,
  sailDate: string,
): string {
  const scope = organizerSlugOrIndependent.trim().toLowerCase() || "independent";
  const cleanShip = shipSlug.trim().toLowerCase();
  const cleanDate = sailDate.trim();
  return `community:${scope}:${cleanShip}:${cleanDate}`;
}

export function buildReputationOrganizerEntityId(organizerSlug: string): string {
  const clean = organizerSlug.trim().toLowerCase();
  if (!clean || !/^[a-z0-9-]+$/.test(clean)) {
    throw new Error(`Invalid canonical organizerSlug for reputation entity: "${organizerSlug}"`);
  }
  return `rep:hosted-organizer:${clean}`;
}

export function buildReputationFranchiseEntityId(franchiseSlug: string): string {
  const clean = franchiseSlug.trim().toLowerCase();
  if (!clean || !/^[a-z0-9-]+$/.test(clean)) {
    throw new Error(`Invalid canonical franchiseSlug for reputation entity: "${franchiseSlug}"`);
  }
  return `rep:hosted-franchise:${clean}`;
}

export function buildReputationHostedSailingEntityId(
  organizerSlug: string,
  sailingSlug: string,
): string {
  const cleanOrg = organizerSlug.trim().toLowerCase();
  const cleanSailing = sailingSlug.trim().toLowerCase();
  if (!cleanOrg || !cleanSailing) {
    throw new Error(
      `Invalid hosted sailing reputation components: org="${organizerSlug}", sailing="${sailingSlug}"`,
    );
  }
  return `rep:hosted-sailing:${cleanOrg}:${cleanSailing}`;
}

export interface CanonicalTravelerPlanReference {
  sailingId: string;
  physicalSailingId?: string;
  hostedSailingId?: string;
  communityId: string;
}

export function buildTravelerPlanReference(input: {
  lineInput: string;
  shipSlug: string;
  sailDate: string;
  organizerSlug?: string | null;
  includePhysicalSailingId?: boolean;
}): CanonicalTravelerPlanReference {
  const physicalSailingId = buildPhysicalSailingId(input.lineInput, input.shipSlug, input.sailDate);
  if (input.organizerSlug && input.organizerSlug.trim()) {
    const org = input.organizerSlug.trim().toLowerCase();
    return {
      sailingId: physicalSailingId,
      ...(input.includePhysicalSailingId ? { physicalSailingId } : {}),
      hostedSailingId: buildHostedSailingId(org, input.lineInput, input.shipSlug, input.sailDate),
      communityId: buildPrivateCommunityId(org, input.shipSlug, input.sailDate),
    };
  }
  return {
    sailingId: physicalSailingId,
    ...(input.includePhysicalSailingId ? { physicalSailingId } : {}),
    communityId: buildPrivateCommunityId("independent", input.shipSlug, input.sailDate),
  };
}

export const HOSTED_CRUISE_THEME_SLUGS = [
  "lgbtq-cruises",
  "bear-cruises",
  "music-cruises",
  "business-and-networking",
  "crafting-and-hobbies",
  "food-and-wine",
  "dance-cruises",
  "wellness",
  "faith-communities",
  "recovery-and-sober-cruises",
  "family-reunions",
  "weddings-and-celebrations",
] as const;

export type HostedCruiseThemeSlug = (typeof HOSTED_CRUISE_THEME_SLUGS)[number];

export const HOSTED_VISUAL_KEYS = [
  "sail-away-deck-meetup",
  "juneau-whale-watch-crew",
  "fleet-hero",
  "port-costa-maya",
  "port-san-juan",
  "port-cabo-san-lucas",
  "port-bermuda",
  "port-curacao",
  "port-barbados",
  "port-aruba",
  "port-ketchikan",
  "port-sitka",
  "port-vancouver",
  "port-new-orleans",
  "port-puerto-plata",
  "port-victoria-bc",
  "port-st-maarten",
  "port-miami",
  "port-nassau",
  "port-cozumel",
  "port-roatan",
  "region-mediterranean",
  "region-northern-europe",
  "region-asia-pacific",
  "port-bimini-alice-town",
  "port-catalina-avalon-bright",
  "port-cocoa-beach-pier",
  "port-fort-lauderdale-las-olas",
  "port-galveston-pleasure-pier",
  "port-glacier-bay-margerie",
  "port-grand-cayman-seven-mile",
  "port-hubbard-glacier",
  "port-key-west-harbor",
  "port-miami-biscayne-skyline",
  "port-mykonos-little-venice",
  "port-new-orleans-jackson-square",
  "port-rhodes-lindos",
  "port-roatan-west-bay",
  "port-rome-st-peters",
  "port-san-francisco-golden-gate",
  "port-santorini-oia",
  "port-seward-resurrection-bay",
  "port-valletta-panorama",
  "port-yokohama-minato-mirai",
  "ship-adventure-of-the-seas-profile",
  "ship-adventure-of-the-seas-st-croix",
  "ship-allure-of-the-seas-nassau",
  "ship-brilliant-lady-alt",
  "ship-brilliant-lady-prince-rupert",
  "ship-carnival-venezia-ny",
  "ship-carnival-venezia-wide",
  "ship-celebrity-apex-stockholm",
  "ship-celebrity-ascent-antigua",
  "ship-celebrity-beyond",
  "ship-celebrity-constellation-palma",
  "ship-celebrity-edge-juneau",
  "ship-celebrity-edge-port-everglades",
  "ship-celebrity-equinox",
  "ship-celebrity-solstice-melbourne",
  "ship-eurodam-curacao",
  "ship-eurodam-glacier-bay",
  "ship-eurodam-half-moon-cay",
  "ship-harmony-of-the-seas",
  "ship-icon-of-the-seas-caribbean",
  "ship-icon-of-the-seas-cozumel",
  "ship-icon-of-the-seas-miami",
  "ship-independence-of-the-seas-miami",
  "ship-mariner-of-the-seas",
  "ship-msc-world-america",
  "ship-navigator-of-the-seas-los-angeles",
  "ship-nieuw-statendam",
  "ship-norwegian-breakaway",
  "ship-norwegian-epic-cannes",
  "ship-norwegian-escape-port-canaveral",
  "ship-norwegian-luna-miami",
  "ship-oasis-of-the-seas-ft-lauderdale",
  "ship-oasis-of-the-seas-port-canaveral",
  "ship-resilient-lady-san-juan",
  "ship-rhapsody-of-the-seas-rhodes",
  "ship-ruby-princess",
  "ship-scarlet-lady",
  "ship-symphony-of-the-seas",
  "ship-symphony-of-the-seas-nassau",
  "ship-valiant-lady",
  "ship-voyager-of-the-seas",
  "ship-westerdam",
  "ship-uniworld-ss-maria-theresa",
  "ship-amadeus-riva-budapest",
  "port-budapest-parliament-danube",
  "port-cologne-rhine-panorama",
  "port-passau-danube-old-town",
  "port-porto-douro-ribeira",
  "yacht-sailing-catamaran-greece",
  "port-hvar-harbor-dalmatia",
  "port-hydra-harbor-sailboats",
  "ship-star-clippers-royal-clipper",
  "port-bora-bora-lagoon-polynesia",
  "port-virgin-islands-white-bay-catamarans",
  "ship-ponant-le-champlain",
  "port-antarctica-paradise-bay-glaciers",
  "ship-azamara-journey",
  "port-galapagos-bartolome-island",
  "port-nile-aswan-feluccas",
  "ship-mein-schiff-1",
  "ship-mein-schiff-6-lisbon",
  "ship-explorer-of-the-seas",
  "ship-wonder-of-the-seas",
  "ship-celebrity-reflection-santorini",
  "ship-celebrity-summit",
  "ship-norwegian-prima",
  "ship-norwegian-pearl",
  "ship-majestic-princess",
  "ship-discovery-princess",
  "port-barcelona-port-vell",
  "port-palma-de-mallorca-cathedral",
  "port-ibiza-dalt-vila-harbor",
  "port-marseille-vieux-port",
  "port-lisbon-belem-tagus",
  "port-positano-amalfi-coast",
  "port-puerto-vallarta-los-muertos",
  "port-aruba-eagle-beach",
  "port-san-diego-bay-skyline",
  "port-provincetown-harbor",
  "port-flam-aurlandsfjord-norway",
  "port-amazon-pacaya-samiria",
  "port-krabi-railay-thailand",
  "port-dubrovnik-old-port",
  "port-rhine-gorge-lorelei",
  "port-rouen-seine-panorama",
  "port-edinburgh-calton-hill",
  "ship-norwegian-gem",
  "ship-norwegian-jade",
  "ship-norwegian-joy",
  "ship-norwegian-jewel",
  "ship-msc-divina",
  "ship-msc-magnifica",
  "ship-msc-seascape",
  "ship-msc-poesia",
  "ship-freedom-of-the-seas",
  "ship-brilliance-of-the-seas",
  "ship-serenade-of-the-seas",
  "ship-carnival-magic",
  "ship-carnival-breeze",
  "ship-carnival-glory",
  "ship-carnival-horizon",
  "ship-celebrity-millennium",
  "ship-celebrity-infinity",
  "ship-celebrity-silhouette",
  "ship-koningsdam",
] as const;

export type HostedVisualKey = (typeof HOSTED_VISUAL_KEYS)[number];

export interface HostedCruiseThemeDefinition {
  themeSlug: HostedCruiseThemeSlug;
  label: string;
  shortLabel: string;
  heroHeadline: string;
  description: string;
  searchIntentExamples: string[];
  visualKey: HostedVisualKey;
}

export const HOSTED_CRUISE_THEMES: ReadonlyArray<HostedCruiseThemeDefinition> = [
  {
    themeSlug: "lgbtq-cruises",
    label: "LGBTQ+ cruises",
    shortLabel: "LGBTQ+",
    heroHeadline: "LGBTQ+ Hosted Cruises & Full-Ship Charters",
    description:
      "Compare full-ship LGBTQ+ charters and hosted group voyages side by side, check verified port schedules, read community-specific traveler reviews, and plan shore days together after booking with the official organizer.",
    searchIntentExamples: ["gay cruises 2027", "LGBTQ+ Alaska cruises 2027", "lesbian cruises 2027"],
    visualKey: "sail-away-deck-meetup",
  },
  {
    themeSlug: "bear-cruises",
    label: "Bear cruises",
    shortLabel: "Bear",
    heroHeadline: "Bear Group Cruises & Hosted Sailings",
    description:
      "Discover upcoming bear group cruises and welcoming community voyages, verify every port window, book directly through the official group host, and coordinate excursions with shipmates before embarkation.",
    searchIntentExamples: ["bear cruises 2027", "Arno bear cruise 2028"],
    visualKey: "port-costa-maya",
  },
  {
    themeSlug: "music-cruises",
    label: "Music cruises",
    shortLabel: "Music",
    heroHeadline: "Music & Festival Cruises at Sea",
    description:
      "Explore concert charters, fan voyages, and live-music group sailings—then see which shore excursions fit between onboard performances.",
    searchIntentExamples: ["music cruises 2027", "blues and bluegrass cruises"],
    visualKey: "port-curacao",
  },
  {
    themeSlug: "business-and-networking",
    label: "Business and networking",
    shortLabel: "Business & CE",
    heroHeadline: "Business, Mastermind & Continuing-Education Cruises",
    description:
      "Find professional conferences, CE/CLE/CPE voyages, and founder networking sailings with sea-day sessions and open port days you can coordinate together.",
    searchIntentExamples: ["CE cruises 2027", "networking cruises 2027"],
    visualKey: "port-san-juan",
  },
  {
    themeSlug: "crafting-and-hobbies",
    label: "Crafting and hobbies",
    shortLabel: "Crafting & Hobbies",
    heroHeadline: "Quilting, Knitting, Scrapbooking & Hobby Cruises",
    description:
      "Compare educator-led quilting, knitting, stamping, bridge, and hobby voyages where sea-day workshops pair with relaxed group shore excursions.",
    searchIntentExamples: ["quilting cruises 2027", "knitting cruises 2027"],
    visualKey: "port-ketchikan",
  },
  {
    themeSlug: "food-and-wine",
    label: "Food and wine",
    shortLabel: "Food & Wine",
    heroHeadline: "Winemaker & Culinary Hosted Cruises",
    description:
      "Sail with winemakers, wine clubs, and culinary hosts—combining sea-day tastings with shared food and coastal excursions in port.",
    searchIntentExamples: ["wine cruises 2027", "winery hosted cruises"],
    visualKey: "region-mediterranean",
  },
  {
    themeSlug: "dance-cruises",
    label: "Dance cruises",
    shortLabel: "Dance",
    heroHeadline: "Social Dance, Swing, Ballroom & Country Cruises",
    description:
      "Discover hosted West Coast Swing, ballroom, country, and line-dance cruises with sea-day workshops and group shore days.",
    searchIntentExamples: ["swing dance cruises 2027", "ballroom dance cruises"],
    visualKey: "port-cabo-san-lucas",
  },
  {
    themeSlug: "wellness",
    label: "Wellness",
    shortLabel: "Wellness & Active",
    heroHeadline: "Wellness, Pickleball & Active Renewal Cruises",
    description:
      "Find active sports clinics, pickleball voyages, and restorative group retreats at sea with balanced port-day adventures.",
    searchIntentExamples: ["pickleball cruises 2027", "wellness cruises"],
    visualKey: "port-barbados",
  },
  {
    themeSlug: "faith-communities",
    label: "Faith communities",
    shortLabel: "Faith",
    heroHeadline: "Faith Community, Gospel Music & Study Cruises",
    description:
      "Explore hosted Christian music, Bible study, and faith-fellowship voyages with verified port windows and group shore coordination.",
    searchIntentExamples: ["Christian cruises 2027", "Footsteps of Paul cruise 2027"],
    visualKey: "juneau-whale-watch-crew",
  },
  {
    themeSlug: "recovery-and-sober-cruises",
    label: "Recovery and sober cruises",
    shortLabel: "Sober & Recovery",
    heroHeadline: "Sober & Recovery Community Cruises",
    description:
      "Find recovery meetings, sober travel groups and fellowship at sea. Each departure identifies whether the program covers the hosted group or the entire ship.",
    searchIntentExamples: ["sober cruises 2027", "recovery cruises"],
    visualKey: "port-sitka",
  },
  {
    themeSlug: "family-reunions",
    label: "Family reunions",
    shortLabel: "Family & Friends",
    heroHeadline: "Hosted Family Reunion & Multi-Generational Cruises",
    description:
      "Advisor-hosted friends-and-family sailings and multi-generational group voyages where everyone can see the daily plan without 40-person group texts.",
    searchIntentExamples: ["family reunion cruises 2027"],
    visualKey: "region-northern-europe",
  },
  {
    themeSlug: "weddings-and-celebrations",
    label: "Weddings and celebrations",
    shortLabel: "Celebrations & Social",
    heroHeadline: "Milestone Celebrations, Alumni & Social Group Cruises",
    description:
      "Retirement milestones, holiday singles voyages, and celebratory group sailings built around shared memories ashore and at sea.",
    searchIntentExamples: ["celebration group cruises 2027", "singles Valentine cruise 2027"],
    visualKey: "port-bermuda",
  },
];

export type ListingTrustState =
  | "independent_listing"
  | "claimed_by_organizer"
  | "information_verified"
  | "official_organizer_partnership";

export type HostedFamilyPolicy =
  | "adults_only"
  | "family_friendly"
  | "mixed_group"
  | "not_verified";

export type HostedCabinAvailabilityStatus =
  | "available"
  | "limited"
  | "waitlist"
  | "sold_out"
  | "independent_cabins"
  | "not_verified";

export type HostedSailingLifecycleStatus = "upcoming" | "completed" | "cancelled";

export const HOSTED_EXPERIENCE_CLASSIFICATION_SLUGS = [
  "full_ship_charter",
  "hosted_group_sailing",
  "river_cruise",
  "small_ship_yacht_expedition",
  "cruise_line_produced_lgbtq",
] as const;

export type HostedExperienceClassification =
  (typeof HOSTED_EXPERIENCE_CLASSIFICATION_SLUGS)[number];

export interface HostedExperienceClassificationDefinition {
  classification: HostedExperienceClassification;
  label: string;
  shortLabel: string;
  description: string;
}

export const HOSTED_EXPERIENCE_CLASSIFICATIONS: ReadonlyArray<HostedExperienceClassificationDefinition> = [
  {
    classification: "full_ship_charter",
    label: "Full-ship charter",
    shortLabel: "Full-Ship Charter",
    description:
      "Private full-vessel ocean buyout operated by an independent charterer with custom ship-wide entertainment, open dining, and dedicated community programming.",
  },
  {
    classification: "hosted_group_sailing",
    label: "Hosted group on a regular sailing",
    shortLabel: "Hosted Group Sailing",
    description:
      "Contracted group cabin block aboard a scheduled commercial ocean cruise with private group hosts, mixers, group dining, and credentialed access to host events.",
  },
  {
    classification: "river_cruise",
    label: "River cruise",
    shortLabel: "River Cruise",
    description:
      "European, Mekong, Amazon, or Nile boutique riverboat charter or hosted river program docking in historic riverfront city centers.",
  },
  {
    classification: "small_ship_yacht_expedition",
    label: "Small-ship, yacht, or expedition charter",
    shortLabel: "Small-Ship / Yacht / Expedition",
    description:
      "Intimate sailing catamarans, tall-masted yachts, luxury superyachts, or polar/island expedition vessels (~10 to ~225 guests).",
  },
  {
    classification: "cruise_line_produced_lgbtq",
    label: "Cruise-line-produced LGBTQ+ sailing",
    shortLabel: "Cruise-Line LGBTQ+ Sailing",
    description:
      "Official LGBTQ+ themed voyage produced, marketed, and sold directly in-house by the cruise line itself rather than an independent third-party charter company.",
  },
];

export type HostedOrganizerType =
  | "independent_charter_operator"
  | "hosted_group_organizer"
  | "travel_agency_hosted_brand"
  | "small_ship_yacht_operator"
  | "river_cruise_operator_program"
  | "cruise_line_themed_program";

export type HostedTypicalCharterModel =
  | "full_ship_charter"
  | "hosted_group_block"
  | "mixed"
  | "cruise_line_themed_sailing"
  | "not_verified";

export type HostedDepartureAnnouncementStatus =
  | "active_upcoming_departures"
  | "no_currently_announced_departure"
  | "not_yet_verified";

export type HostedRecordVerificationState =
  | "verified"
  | "no_announced_departure"
  | "schedule_hold"
  | "not_yet_verified"
  | "held_insufficient_evidence";

export interface HostedProgramSubBrand {
  subBrandSlug: string;
  subBrandName: string;
  officialUrl: string;
  relationshipSummary: string;
  intendedAudience: string;
  atmosphereAndPolicySummary: string;
}

export const HOSTED_HOLD_REASON_CODES = [
  "UNANNOUNCED_FUTURE_DEPARTURE",
  "COMING_SOON_UNRELEASED",
  "BROKEN_OFFICIAL_BOOKING_OR_PAGE_404",
  "CONFLICTING_OFFICIAL_ITINERARY_COPY",
  "UNVERIFIED_PORT_CLOCK_WINDOWS",
  "WAF_OR_UNVERIFIABLE_SOURCE",
  "MISSING_SUBSTANTIVE_HOSTED_FACTS",
  "DUPLICATE_BOILERPLATE_CONTENT",
  "MISSING_FUNCTIONAL_SAILING_PATHWAY",
  "ORPHAN_MISSING_INTERNAL_LINKS",
] as const;

export type HostedHoldReasonCode = (typeof HOSTED_HOLD_REASON_CODES)[number];

export function formatHostedHoldReasonCodeLabel(code: HostedHoldReasonCode): string {
  switch (code) {
    case "UNANNOUNCED_FUTURE_DEPARTURE":
      return "No announced future departure on official source";
    case "COMING_SOON_UNRELEASED":
      return "Marked coming soon without finalized live booking release";
    case "BROKEN_OFFICIAL_BOOKING_OR_PAGE_404":
      return "Official departure or booking URL broken / 404";
    case "CONFLICTING_OFFICIAL_ITINERARY_COPY":
      return "Conflicting port sequence, dates, or cloned copy on official source";
    case "UNVERIFIED_PORT_CLOCK_WINDOWS":
      return "Missing verified day-by-day port schedule or arrival/departure windows";
    case "WAF_OR_UNVERIFIABLE_SOURCE":
      return "Official subpage blocked by WAF or unverifiable primary source";
    case "MISSING_SUBSTANTIVE_HOSTED_FACTS":
      return "Insufficient substantive cruise-specific programming, audience, or differentiators";
    case "DUPLICATE_BOILERPLATE_CONTENT":
      return "High shingle overlap / duplicate boilerplate across sibling departures";
    case "MISSING_FUNCTIONAL_SAILING_PATHWAY":
      return "Missing functional traveler group-plan pathway on sailing page";
    case "ORPHAN_MISSING_INTERNAL_LINKS":
      return "Not reachable from category hub, franchise page, and organizer page";
  }
}

export interface CanonicalHeldHostedEvidenceRecord {
  holdId: string;
  organizerSlug: string;
  organizerName: string;
  franchiseId?: string; // hosted-franchise:<franchiseSlug>
  franchiseSlug?: string;
  reasonCode?: HostedHoldReasonCode;
  candidateTitle: string;
  candidateDatesOrVessel: string;
  checkedSourceUrl: string;
  checkedAt: string;
  holdReason: string;
}

export type HostedFranchiseRelationshipType =
  | "flagship_one_to_one"
  | "organizer_program_collection"
  | "producer_owned_franchise"
  | "sub_brand_program"
  | "co_produced_brand"
  | "cruise_line_themed_series";

export function formatHostedFranchiseRelationshipLabel(
  rel: HostedFranchiseRelationshipType | null | undefined,
): string {
  switch (rel) {
    case "organizer_program_collection":
      return "Cruise programs listed under this organizer";
    case "flagship_one_to_one":
      return "Flagship recurring cruise series (1:1 separate canonical franchise entity)";
    case "producer_owned_franchise":
      return "Producer-operated recurring festival / cruise franchise";
    case "sub_brand_program":
      return "Dedicated program / sub-brand series";
    case "co_produced_brand":
      return "Co-produced artist or partner cruise franchise";
    case "cruise_line_themed_series":
      return "Cruise-line-produced recurring themed series";
    default:
      return "Recurring cruise series";
  }
}

/**
 * Canonical Recurring Cruise Franchise / Series Entity (`hosted-franchise:<slug>`)
 *
 * Architectural Invariant:
 * Organizer/Producer (`hosted-organizer:<slug>`) and Franchise (`hosted-franchise:<slug>`)
 * are ALWAYS separate canonical entity types—even when they currently have a 1:1
 * relationship. Their entity IDs, entity-scoped reviews (`rep:hosted-organizer:*` vs
 * `rep:hosted-franchise:*`), DCC field provenance, and future multi-series extensibility
 * are never collapsed.
 */
export interface CanonicalHostedFranchiseFactRecord {
  franchiseId: string; // hosted-franchise:<franchiseSlug>
  reputationFranchiseEntityId: string; // rep:hosted-franchise:<franchiseSlug>
  franchiseSlug: string;
  aliases: string[];
  franchiseName: string;
  shortName: string;
  producerOrganizerId: string; // hosted-organizer:<producerOrganizerSlug>
  producerOrganizerSlug: string;
  relationshipToProducer: HostedFranchiseRelationshipType;
  primaryClassification: HostedExperienceClassification;
  primaryTheme: HostedCruiseThemeSlug;
  secondaryThemes: HostedCruiseThemeSlug[];
  tagline: string;
  independentSummary: string;
  intendedAudience: string;
  programmingAndLineupModel: string | null;
  atmosphereSummary: string | null;
  heroVisualKey: HostedVisualKey;
  officialWebsiteUrl: string;
  officialDomain: string;
  departureAnnouncementStatus: HostedDepartureAnnouncementStatus;
  primarySourceUrl: string;
  verifiedSourceCheckedAt: string;
  verificationState: HostedRecordVerificationState;
}

export const CURATED_HOSTED_COMPARISON_SLUGS = [
  "lgbtq-cruise-market-guide",
  "full-ship-lgbtq-charters",
  "bear-daddy-and-silver-fox-cruises",
  "lgbtq-river-and-small-ship-cruises",
  "hosted-lgbtq-groups-and-family-sailings",
  "music-and-festival-cruises-guide",
] as const;

export type CuratedHostedComparisonSlug = (typeof CURATED_HOSTED_COMPARISON_SLUGS)[number];

export interface HostedOfficialSocialLinks {
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
}

export interface HostedAuthorizedReviewProfileLink {
  platform: string;
  label: string;
  url: string;
  authorizationBasis: "official_site_linked" | "organizer_workspace_supplied";
}

export interface CanonicalHostedOrganizerFactRecord {
  organizerId: string; // hosted-organizer:<organizerSlug>
  reputationEntityId: string; // rep:hosted-organizer:<organizerSlug>
  organizerSlug: string;
  aliases: string[]; // previous/alternate slugs resolving to this single identity
  knownBrandAliases: string[]; // verified display/brand/event names associated with this organizer
  organizerName: string;
  shortName: string;
  categoryLabel: string;
  organizerType?: HostedOrganizerType;
  primaryClassification?: HostedExperienceClassification;
  supportedClassifications?: HostedExperienceClassification[];
  subBrands?: HostedProgramSubBrand[];
  primaryTheme: HostedCruiseThemeSlug;
  secondaryThemes: HostedCruiseThemeSlug[];
  tagline: string;
  independentSummary: string;
  organizerProvidedDescription: string | null;
  designedForAudience: string;
  audienceFocusTags?: string[];
  typicalHostedProgramming: string | null;
  generalAtmosphereSummary?: string | null;
  typicalCharterModel: HostedTypicalCharterModel;
  vesselTypeSummary?: string | null;
  approximateScaleSummary?: string | null;
  publishedStartingPriceSummary?: string | null;
  inclusionsSummary?: string | null;
  soloSupportSummary: string | null;
  soloFriendly: boolean | null;
  familyPolicy: HostedFamilyPolicy;
  accessibilitySummary?: string | null;
  officialAccessibilityUrl?: string | null;
  departureAnnouncementStatus?: HostedDepartureAnnouncementStatus;
  goodForTags: string[];
  heroVisualKey: HostedVisualKey;
  officialWebsiteUrl: string;
  officialDomain: string;
  reservationPortalDomain?: string;
  publicContactPageUrl: string;
  officialSocialLinks: HostedOfficialSocialLinks;
  cabinSellerIdentity: string;
  officialReservationPathSummary: string;
  cancellationAndParticipationPolicy: string | null;
  officialPolicyUrl: string | null;
  publicReviewProfileLinks: HostedAuthorizedReviewProfileLink[];
  pinnedSailingSlugs?: string[];
  nonAffiliationNotice: string;
  cabinBookingPolicyNote: string;
  primarySourceUrl?: string;
  verifiedSourceCheckedAt: string;
  verificationState?: HostedRecordVerificationState;
  comparableOrganizerSlugs: string[];
}

export interface CanonicalHostedSailingFactRecord {
  hostedSailingId: string; // hosted-sailing:<organizerSlug>:<lineCode>:<shipSlug>:<sailDate>
  reputationSailingEntityId: string; // rep:hosted-sailing:<organizerSlug>:<sailingSlug>
  organizerSlug: string;
  franchiseId?: string; // hosted-franchise:<franchiseSlug>
  franchiseSlug?: string;
  sailingSlug: string;
  sailingAliases?: string[];
  subBrandSlug?: string | null;
  subBrandName?: string | null;
  organizerType?: HostedOrganizerType;
  experienceClassification?: HostedExperienceClassification;
  physicalSailingId: string; // sailing:<lineCode>:<shipSlug>:<sailDate>
  communityId?: string; // community:<organizerSlug>:<shipSlug>:<sailDate>
  canonicalLineCode: CanonicalCruiseLineCode;
  canonicalShipSlug: string;
  canonicalSailDate: string;
  sailingTitle: string;
  /** The scope of the organizer's alcohol policy for this particular departure. */
  alcoholPolicyScope?: "hosted_group_only" | "whole_ship_alcohol_free" | "not_disclosed";
  alcoholPolicySourceUrl?: string;
  shortHeadline: string;
  editionSubtitle: string;
  anticipationHook: string;
  primaryTheme: HostedCruiseThemeSlug;
  secondaryThemes: HostedCruiseThemeSlug[];
  visualKey: HostedVisualKey;
  regionLabel: string;
  vesselType?: string | null;
  approximateVesselScale?: string | null;
  officialSailingPageUrl: string;
  officialReservationFormUrl: string;
  officialCruiseId?: string;
  cabinSellerLabel: string;
  cabinBookingCtaLabel: string;
  cabinAvailabilityStatus: HostedCabinAvailabilityStatus;
  cabinAvailabilityNote: string;
  verifiedStartingPriceUsd: number | null;
  publishedPriceDisplay?: string | null;
  verifiedPriceNote: string | null;
  inclusionsSummary?: string | null;
  approximateGroupSizeLabel: string | null;
  fullShipCharter: boolean | null;
  typicalAudience: string;
  audienceFocusTags?: string[];
  announcedHostedProgramming: string | null;
  programmingSourceUrl: string | null;
  soloSupport: string | null;
  soloFriendly: boolean | null;
  familyPolicy: HostedFamilyPolicy;
  accessibilitySummary?: string | null;
  communityAtmosphereSummary: string | null;
  officialReviewSources?: HostedAuthorizedReviewProfileLink[];
  goodForTags: string[];
  lifecycleStatus: HostedSailingLifecycleStatus;
  cancelledReason?: string;
  primarySourceUrl?: string;
  organizerSourceCheckedAt: string;
  verificationState?: HostedRecordVerificationState;
  portScheduleVerificationMode?: "clocked_port_windows" | "official_day_by_day_route";
  /**
   * Optional fail-closed hold reason: when non-empty, the hosted page stays
   * `noindex` and is excluded from sitemaps even if a vendor ship row exists.
   */
  scheduleHoldReason?: string;
  scheduleHoldReasonCode?: HostedHoldReasonCode;
}

export interface CanonicalHostedCatalogChangeEvent {
  eventId: string;
  occurredAt: string;
  entityType: "physical_sailing" | "hosted_organizer" | "hosted_franchise" | "hosted_sailing";
  entityId: string;
  summary: string;
  preservesCommunityIdentity: true;
}

export interface CanonicalHostedCatalogSnapshot {
  contractVersion: typeof CANONICAL_HOSTED_CRUISE_CONTRACT_VERSION;
  snapshotId: string;
  generatedAt: string;
  owner: "dcc";
  consumerCanonicalHost: "https://cruisepromenade.com";
  themes: ReadonlyArray<HostedCruiseThemeDefinition>;
  organizers: ReadonlyArray<CanonicalHostedOrganizerFactRecord>;
  franchises?: ReadonlyArray<CanonicalHostedFranchiseFactRecord>;
  hostedSailings: ReadonlyArray<CanonicalHostedSailingFactRecord>;
  recentChangeEvents: ReadonlyArray<CanonicalHostedCatalogChangeEvent>;
  heldInsufficientEvidenceItems?: ReadonlyArray<CanonicalHeldHostedEvidenceRecord>;
}

/**
 * Entity-Scoped Reviews & Q&A
 * Every stored review attaches to EXACTLY ONE primary subject so ship food
 * never lowers an organizer's score, producer operations never collapse into
 * recurring franchise reviews, and tour issues never lower ship scores.
 */
export type HostedReviewPrimarySubjectType =
  | "organizer"
  | "franchise"
  | "hosted_sailing"
  | "ship"
  | "cruise_line"
  | "tour";

export type ReviewModerationStatus =
  | "pending_moderation"
  | "approved"
  | "rejected";

export type ReviewerVerificationBadge =
  | "verified_sailing_member"
  | "verified_email_traveler";

export interface EntityScopedReviewRecord {
  reviewId: string;
  submissionGroupId: string;
  primarySubjectType: HostedReviewPrimarySubjectType;
  primarySubjectId: string;
  organizerSlug?: string;
  sailingSlug?: string;
  authorDisplayName: string;
  verificationBadge: ReviewerVerificationBadge;
  overallRating: 1 | 2 | 3 | 4 | 5;
  dimensionRatings: Record<string, 1 | 2 | 3 | 4 | 5>;
  headline: string;
  writtenExperience: string;
  sailedDateLabel?: string;
  wouldSailAgain: boolean | null;
  photoUrls: string[];
  helpfulCount: number;
  moderationStatus: ReviewModerationStatus;
  organizerResponse?: {
    responderName: string;
    responderRole: string;
    body: string;
    respondedAt: string;
  };
  createdAt: string;
  approvedAt?: string;
}

export interface EntityScopedReviewAggregate {
  primarySubjectType: HostedReviewPrimarySubjectType;
  primarySubjectId: string;
  approvedReviewCount: number;
  averageRating: number | null;
  bayesianConfidenceScore: number;
  dimensionAverages: Record<string, number>;
  verifiedMemberReviewCount: number;
}

export function computeEntityReviewAggregate(
  reviews: ReadonlyArray<EntityScopedReviewRecord>,
  subjectType: HostedReviewPrimarySubjectType,
  subjectId: string,
): EntityScopedReviewAggregate {
  const matching = reviews.filter(
    (r) =>
      r.moderationStatus === "approved" &&
      r.primarySubjectType === subjectType &&
      r.primarySubjectId === subjectId,
  );

  const count = matching.length;
  if (count === 0) {
    return {
      primarySubjectType: subjectType,
      primarySubjectId: subjectId,
      approvedReviewCount: 0,
      averageRating: null,
      bayesianConfidenceScore: 0,
      dimensionAverages: {},
      verifiedMemberReviewCount: 0,
    };
  }

  const sum = matching.reduce((acc, r) => acc + r.overallRating, 0);
  const avg = Math.round((sum / count) * 10) / 10;

  // Bayesian confidence score toward neutral prior 3.8 with weight m=5
  const m = 5;
  const prior = 3.8;
  const bayesian = Math.round((((count / (count + m)) * (sum / count) + (m / (count + m)) * prior) / 5) * 1000) / 1000;

  const dimSums: Record<string, { total: number; n: number }> = {};
  for (const r of matching) {
    for (const [k, v] of Object.entries(r.dimensionRatings || {})) {
      if (typeof v === "number" && v >= 1 && v <= 5) {
        if (!dimSums[k]) dimSums[k] = { total: 0, n: 0 };
        dimSums[k].total += v;
        dimSums[k].n += 1;
      }
    }
  }
  const dimensionAverages: Record<string, number> = {};
  for (const [k, stat] of Object.entries(dimSums)) {
    if (stat.n > 0) {
      dimensionAverages[k] = Math.round((stat.total / stat.n) * 10) / 10;
    }
  }

  return {
    primarySubjectType: subjectType,
    primarySubjectId: subjectId,
    approvedReviewCount: count,
    averageRating: avg,
    bayesianConfidenceScore: bayesian,
    dimensionAverages,
    verifiedMemberReviewCount: matching.filter(
      (r) => r.verificationBadge === "verified_sailing_member",
    ).length,
  };
}

export interface HostedQuestionAnswerItem {
  answerId: string;
  authorDisplayName: string;
  isOfficialOrganizerAnswer: boolean;
  isVerifiedSailingMember: boolean;
  body: string;
  createdAt: string;
}

export interface HostedPublicQuestionRecord {
  questionId: string;
  targetType: "organizer" | "hosted_sailing";
  organizerSlug: string;
  sailingSlug?: string;
  authorDisplayName: string;
  questionText: string;
  moderationStatus: ReviewModerationStatus;
  helpfulCount: number;
  answers: HostedQuestionAnswerItem[];
  createdAt: string;
}

/**
 * Published Zero-Commercial-Weight Organic Ranking
 */
export type HostedVesselCategoryFilter =
  | "ocean_ship"
  | "river_ship"
  | "small_ship_expedition"
  | "yacht_catamaran";

export interface HostedCatalogSearchCriteria {
  query?: string;
  theme?: HostedCruiseThemeSlug | "";
  classification?: HostedExperienceClassification | "";
  organizerType?: HostedOrganizerType | "";
  vesselCategory?: HostedVesselCategoryFilter | "";
  audienceFocus?: string;
  subBrandSlug?: string;
  hasDisclosedPriceOnly?: boolean;
  destination?: string;
  departureMonth?: string; // YYYY-MM
  departurePort?: string;
  organizerSlug?: string;
  cruiseLineOrShip?: string;
  soloFriendlyOnly?: boolean;
  familyPolicy?: HostedFamilyPolicy | "";
  cabinAvailability?: HostedCabinAvailabilityStatus | "";
  minNights?: number;
  maxNights?: number;
  maxVerifiedPriceUsd?: number;
}

export interface RankableHostedSailingCandidate {
  hostedSailingId: string;
  organizerSlug: string;
  organizerName: string;
  franchiseSlug?: string;
  franchiseName?: string;
  sailingTitle?: string;
  primaryTheme: HostedCruiseThemeSlug;
  secondaryThemes: HostedCruiseThemeSlug[];
  experienceClassification?: HostedExperienceClassification;
  organizerType?: HostedOrganizerType;
  vesselCategory?: HostedVesselCategoryFilter;
  audienceFocusTags?: string[];
  subBrandSlug?: string | null;
  subBrandName?: string | null;
  hasDisclosedPrice?: boolean;
  regionLabel: string;
  itineraryPortsText: string;
  departurePort: string;
  sailDate: string;
  nights: number | null;
  shipName: string;
  shipSlug: string;
  cruiseLine: string;
  soloFriendly: boolean | null;
  familyPolicy: HostedFamilyPolicy;
  cabinAvailabilityStatus: HostedCabinAvailabilityStatus;
  verifiedStartingPriceUsd: number | null;
  everyPortDayVerified: boolean;
  everySourceVerified: boolean;
  reviewAggregate: EntityScopedReviewAggregate;
  dataCompletenessRatio: number; // 0..1
  sourceVerifiedAtIso: string;
  answeredQuestionsCount: number;
  communityParticipantCount: number;
  /** Explicitly accepted so tests can prove they have ZERO effect on organic score. */
  hasAffiliateCommission?: boolean;
  isClaimedByOrganizer?: boolean;
}

export interface RankedHostedSailingResult<T extends RankableHostedSailingCandidate> {
  item: T;
  totalScore: number;
  breakdown: {
    criteriaMatch: number;
    verifiedScheduleAndOrganizer: number;
    bookingAvailability: number;
    reviewQualityConfidence: number;
    dataCompleteness: number;
    freshness: number;
    communityUsefulness: number;
    travelerInterest: number;
    affiliateCommissionWeight: 0;
    claimedStatusAutoBoostWeight: 0;
  };
}

export function filterAndRankHostedSailings<T extends RankableHostedSailingCandidate>(
  candidates: ReadonlyArray<T>,
  criteria: HostedCatalogSearchCriteria = {},
  now: Date = new Date(),
): Array<RankedHostedSailingResult<T>> {
  const q = (criteria.query || "").trim().toLowerCase();
  const dest = (criteria.destination || "").trim().toLowerCase();
  const month = (criteria.departureMonth || "").trim();
  const depPort = (criteria.departurePort || "").trim().toLowerCase();
  const orgFilter = (criteria.organizerSlug || "").trim().toLowerCase();
  const lineOrShip = (criteria.cruiseLineOrShip || "").trim().toLowerCase();
  const audFocus = (criteria.audienceFocus || "").trim().toLowerCase();
  const subBrand = (criteria.subBrandSlug || "").trim().toLowerCase();

  const filtered = candidates.filter((c) => {
    if (criteria.theme) {
      const matchesTheme =
        c.primaryTheme === criteria.theme || c.secondaryThemes.includes(criteria.theme);
      if (!matchesTheme) return false;
    }
    if (criteria.classification && c.experienceClassification !== criteria.classification) {
      return false;
    }
    if (criteria.organizerType && c.organizerType !== criteria.organizerType) {
      return false;
    }
    if (criteria.vesselCategory && c.vesselCategory !== criteria.vesselCategory) {
      return false;
    }
    if (audFocus) {
      const tags = (c.audienceFocusTags || []).map((t) => t.toLowerCase());
      if (!tags.includes(audFocus)) return false;
    }
    if (subBrand) {
      if ((c.subBrandSlug || "").toLowerCase() !== subBrand) return false;
    }
    if (criteria.hasDisclosedPriceOnly) {
      const disclosed = c.hasDisclosedPrice ?? c.verifiedStartingPriceUsd !== null;
      if (!disclosed) return false;
    }
    if (dest) {
      const hay = `${c.regionLabel} ${c.itineraryPortsText} ${c.departurePort}`.toLowerCase();
      if (!hay.includes(dest)) return false;
    }
    if (month && !c.sailDate.startsWith(month)) {
      return false;
    }
    if (depPort && !c.departurePort.toLowerCase().includes(depPort)) {
      return false;
    }
    if (orgFilter && c.organizerSlug.toLowerCase() !== orgFilter) {
      return false;
    }
    if (lineOrShip) {
      const hay = `${c.cruiseLine} ${c.shipName} ${c.shipSlug}`.toLowerCase();
      if (!hay.includes(lineOrShip)) return false;
    }
    if (criteria.soloFriendlyOnly && c.soloFriendly !== true) {
      return false;
    }
    if (criteria.familyPolicy && c.familyPolicy !== criteria.familyPolicy) {
      return false;
    }
    if (criteria.cabinAvailability && c.cabinAvailabilityStatus !== criteria.cabinAvailability) {
      return false;
    }
    if (typeof criteria.minNights === "number" && criteria.minNights > 0) {
      if (c.nights === null || c.nights < criteria.minNights) return false;
    }
    if (typeof criteria.maxNights === "number" && criteria.maxNights > 0) {
      if (c.nights === null || c.nights > criteria.maxNights) return false;
    }
    if (typeof criteria.maxVerifiedPriceUsd === "number" && criteria.maxVerifiedPriceUsd > 0) {
      if (
        c.verifiedStartingPriceUsd === null ||
        c.verifiedStartingPriceUsd > criteria.maxVerifiedPriceUsd
      ) {
        return false;
      }
    }
    if (q) {
      const hay = [
        c.organizerName,
        c.organizerSlug,
        c.franchiseName || "",
        c.franchiseSlug || "",
        c.sailingTitle || "",
        c.shipName,
        c.cruiseLine,
        c.regionLabel,
        c.itineraryPortsText,
        c.departurePort,
        c.primaryTheme,
        ...c.secondaryThemes,
      ]
        .join(" ")
        .toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);
      if (!tokens.every((tok) => hay.includes(tok))) return false;
    }
    return true;
  });

  const AVAILABILITY_POINTS: Record<HostedCabinAvailabilityStatus, number> = {
    available: 14,
    limited: 12,
    independent_cabins: 10,
    waitlist: 6,
    not_verified: 5,
    sold_out: 1,
  };

  const results: Array<RankedHostedSailingResult<T>> = filtered.map((item) => {
    let criteriaMatch = 20;
    if (criteria.theme && item.primaryTheme === criteria.theme) criteriaMatch += 6;
    if (
      q &&
      (item.organizerName.toLowerCase().includes(q) ||
        (item.franchiseName || "").toLowerCase().includes(q))
    ) {
      criteriaMatch += 4;
    }

    const verifiedScheduleAndOrganizer =
      (item.everyPortDayVerified ? 14 : 0) + (item.everySourceVerified ? 10 : 0);

    const bookingAvailability = AVAILABILITY_POINTS[item.cabinAvailabilityStatus] ?? 5;

    const reviewQualityConfidence = Math.round(item.reviewAggregate.bayesianConfidenceScore * 16 * 100) / 100;

    const dataCompleteness = Math.round(Math.max(0, Math.min(1, item.dataCompletenessRatio)) * 12 * 100) / 100;

    const verifiedMs = Date.parse(item.sourceVerifiedAtIso);
    const ageDays = Number.isFinite(verifiedMs)
      ? Math.max(0, (now.getTime() - verifiedMs) / 86_400_000)
      : 365;
    const freshness = ageDays <= 30 ? 8 : ageDays <= 90 ? 6 : ageDays <= 180 ? 4 : 1;

    const communityUsefulness = Math.min(5, item.answeredQuestionsCount * 1.5);
    const travelerInterest = Math.min(5, Math.log2(1 + Math.max(0, item.communityParticipantCount)));

    const totalScore =
      Math.round(
        (criteriaMatch +
          verifiedScheduleAndOrganizer +
          bookingAvailability +
          reviewQualityConfidence +
          dataCompleteness +
          freshness +
          communityUsefulness +
          travelerInterest) *
          100,
      ) / 100;

    return {
      item,
      totalScore,
      breakdown: {
        criteriaMatch,
        verifiedScheduleAndOrganizer,
        bookingAvailability,
        reviewQualityConfidence,
        dataCompleteness,
        freshness,
        communityUsefulness,
        travelerInterest: Math.round(travelerInterest * 100) / 100,
        affiliateCommissionWeight: 0,
        claimedStatusAutoBoostWeight: 0,
      },
    };
  });

  return results.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (a.item.sailDate !== b.item.sailDate) return a.item.sailDate.localeCompare(b.item.sailDate);
    return a.item.hostedSailingId.localeCompare(b.item.hostedSailingId);
  });
}

/**
 * Automated Redundancy & Entity-Separation Safeguards (14 Invariants)
 */
export type RedundancySafeguardCode =
  | "DUPLICATE_PHYSICAL_SAILING_ID"
  | "DUPLICATED_ITINERARY_IN_HOSTED_RECORD"
  | "COMPETING_HOSTED_INTENT_CANONICAL"
  | "DCC_COMPETING_CONSUMER_CANONICAL"
  | "HOSTED_PORT_SCHEDULE_DIVERGENCE"
  | "PRIVATE_ROLLCALL_PII_IN_PUBLIC_OUTPUT"
  | "REVIEW_TOTAL_PAGE_API_MISMATCH"
  | "ORGANIZER_RATING_CONFLATED_WITH_SHIP_OR_TOUR"
  | "FILTER_OR_PRIVATE_URL_IN_SITEMAP"
  | "STALE_SOURCE_PRESENTED_AS_LIVE"
  | "RENAMED_ORGANIZER_DUPLICATE_IDENTITY"
  | "CANCELLED_SAILING_SILENTLY_REPLACED"
  | "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY"
  | "FRANCHISE_RATING_CONFLATED_WITH_ORGANIZER_OR_SHIP";

export interface SafeguardViolation {
  code: RedundancySafeguardCode;
  message: string;
  entityId?: string;
}

export interface RedundancyValidationInput {
  physicalSailings?: ReadonlyArray<{
    physicalSailingId: string;
    shipSlug: string;
    sailDate: string;
    portSequenceSignature?: string;
  }>;
  organizers: ReadonlyArray<CanonicalHostedOrganizerFactRecord>;
  franchises?: ReadonlyArray<CanonicalHostedFranchiseFactRecord>;
  hostedSailings: ReadonlyArray<CanonicalHostedSailingFactRecord & Record<string, unknown>>;
  renderedHostedPortSignatures?: ReadonlyArray<{
    hostedSailingId: string;
    physicalSailingId: string;
    portSequenceSignature: string;
  }>;
  dccConsumerCanonicalUrls?: ReadonlyArray<string>;
  cpConsumerCanonicalUrls?: ReadonlyArray<string>;
  publicSerializedPayloads?: ReadonlyArray<string>;
  reviewPageVsApiComparisons?: ReadonlyArray<{
    entityId: string;
    pageCount: number;
    apiCount: number;
    pageAverage: number | null;
    apiAverage: number | null;
  }>;
  reviewsSample?: ReadonlyArray<EntityScopedReviewRecord>;
  sitemapUrls?: ReadonlyArray<string>;
  liveInventoryClaims?: ReadonlyArray<{
    entityId: string;
    claimedLive: boolean;
    retrievedAtIso: string;
    maxAgeMinutes: number;
  }>;
  previousHistoricalHostedSailings?: ReadonlyArray<{
    hostedSailingId: string;
    organizerSlug: string;
    sailingSlug: string;
    physicalSailingId: string;
  }>;
  now?: Date;
}

const PRIVATE_LEAK_PATTERNS = [
  /\brc_cruise_part=/i,
  /\bCONFIDENTIAL_DM_/i,
  /"privateAlertEmail"\s*:/i,
  /"invitationCodeHash"\s*:/i,
  /"memberVerificationCodeHash"\s*:/i,
  /"dmBody"\s*:/i,
];

export function validateHostedCruiseRedundancySafeguards(
  input: RedundancyValidationInput,
): { valid: boolean; violations: SafeguardViolation[] } {
  const violations: SafeguardViolation[] = [];
  const now = input.now || new Date();

  // 1. Two physical sailings using different IDs for the same ship/date
  const physicalByTuple = new Map<string, string>();
  for (const ps of input.physicalSailings || []) {
    const tuple = `${ps.shipSlug.toLowerCase()}|${ps.sailDate}`;
    const prev = physicalByTuple.get(tuple);
    if (prev && prev !== ps.physicalSailingId) {
      violations.push({
        code: "DUPLICATE_PHYSICAL_SAILING_ID",
        entityId: ps.physicalSailingId,
        message: `Physical sailing ${tuple} has conflicting IDs "${prev}" and "${ps.physicalSailingId}".`,
      });
    } else {
      physicalByTuple.set(tuple, ps.physicalSailingId);
    }
  }

  // Also check physicalSailingId consistency across hostedSailings referencing the same ship+date
  for (const hs of input.hostedSailings) {
    const tuple = `${hs.canonicalShipSlug.toLowerCase()}|${hs.canonicalSailDate}`;
    const prev = physicalByTuple.get(tuple);
    if (prev && prev !== hs.physicalSailingId) {
      violations.push({
        code: "DUPLICATE_PHYSICAL_SAILING_ID",
        entityId: hs.hostedSailingId,
        message: `Hosted sailing "${hs.hostedSailingId}" references "${hs.physicalSailingId}" instead of "${prev}" for ${tuple}.`,
      });
    } else {
      physicalByTuple.set(tuple, hs.physicalSailingId);
    }
  }

  // 2. Manual itinerary duplication inside a hosted-sailing record
  for (const hs of input.hostedSailings) {
    if (
      "itinerary" in hs ||
      "itineraryDays" in hs ||
      "portDays" in hs ||
      "ports" in hs
    ) {
      const val =
        hs.itinerary ?? hs.itineraryDays ?? hs.portDays ?? hs.ports;
      if (val !== undefined) {
        violations.push({
          code: "DUPLICATED_ITINERARY_IN_HOSTED_RECORD",
          entityId: hs.hostedSailingId,
          message: `Hosted sailing "${hs.hostedSailingId}" illegally embeds an itinerary array instead of referencing "${hs.physicalSailingId}".`,
        });
      }
    }
  }

  // 3. Two canonical pages targeting the same organizer + physical sailing intent
  const intentToSailingId = new Map<string, string>();
  const pathToSailingId = new Map<string, string>();
  for (const hs of input.hostedSailings) {
    const intentKey = `${hs.organizerSlug.toLowerCase()}|${hs.physicalSailingId}`;
    const prevIntent = intentToSailingId.get(intentKey);
    if (prevIntent && prevIntent !== hs.hostedSailingId) {
      violations.push({
        code: "COMPETING_HOSTED_INTENT_CANONICAL",
        entityId: hs.hostedSailingId,
        message: `Duplicate hosted sailing canonicals "${prevIntent}" and "${hs.hostedSailingId}" target the same organizer/sailing intent (${intentKey}).`,
      });
    } else {
      intentToSailingId.set(intentKey, hs.hostedSailingId);
    }

    const pathKey = `/hosted-cruises/${hs.organizerSlug.toLowerCase()}/${hs.sailingSlug.toLowerCase()}`;
    const prevPath = pathToSailingId.get(pathKey);
    if (prevPath && prevPath !== hs.hostedSailingId) {
      violations.push({
        code: "COMPETING_HOSTED_INTENT_CANONICAL",
        entityId: hs.hostedSailingId,
        message: `Duplicate hosted sailing path "${pathKey}" claimed by "${prevPath}" and "${hs.hostedSailingId}".`,
      });
    } else {
      pathToSailingId.set(pathKey, hs.hostedSailingId);
    }
  }

  // 4. DCC and CP publishing competing consumer canonicals
  for (const dccUrl of input.dccConsumerCanonicalUrls || []) {
    if (/\/hosted-cruises(\/|$)/i.test(dccUrl) || /reviews/i.test(dccUrl)) {
      violations.push({
        code: "DCC_COMPETING_CONSUMER_CANONICAL",
        entityId: dccUrl,
        message: `DCC published a competing consumer hosted-cruise canonical URL: "${dccUrl}".`,
      });
    }
  }

  // 5. Hosted page inventing a different port schedule from its physical sailing
  const physicalSignatureMap = new Map<string, string>();
  for (const ps of input.physicalSailings || []) {
    if (ps.portSequenceSignature !== undefined) {
      physicalSignatureMap.set(ps.physicalSailingId, ps.portSequenceSignature);
    }
  }
  for (const rendered of input.renderedHostedPortSignatures || []) {
    const expected = physicalSignatureMap.get(rendered.physicalSailingId);
    if (expected !== undefined && expected !== rendered.portSequenceSignature) {
      violations.push({
        code: "HOSTED_PORT_SCHEDULE_DIVERGENCE",
        entityId: rendered.hostedSailingId,
        message: `Hosted sailing "${rendered.hostedSailingId}" port schedule "${rendered.portSequenceSignature}" diverged from physical sailing "${expected}".`,
      });
    }
  }

  // 6. Private RollCall data in public HTML or JSON-LD schema
  for (const payload of input.publicSerializedPayloads || []) {
    for (const regex of PRIVATE_LEAK_PATTERNS) {
      if (regex.test(payload)) {
        violations.push({
          code: "PRIVATE_ROLLCALL_PII_IN_PUBLIC_OUTPUT",
          message: `Public HTML/JSON-LD matched prohibited private RollCall/PII pattern ${String(regex)}.`,
        });
      }
    }
  }

  // 7. Review totals differing between page and API
  for (const cmp of input.reviewPageVsApiComparisons || []) {
    if (cmp.pageCount !== cmp.apiCount || cmp.pageAverage !== cmp.apiAverage) {
      violations.push({
        code: "REVIEW_TOTAL_PAGE_API_MISMATCH",
        entityId: cmp.entityId,
        message: `Review summary mismatch for "${cmp.entityId}": page=(${cmp.pageCount}, ${cmp.pageAverage}) vs api=(${cmp.apiCount}, ${cmp.apiAverage}).`,
      });
    }
  }

  // 8. Organizer rating including ship, franchise, or tour ratings
  if (input.reviewsSample && input.reviewsSample.length > 0) {
    const orgIds = new Set(input.organizers.map((o) => o.organizerId));
    for (const orgId of orgIds) {
      const agg = computeEntityReviewAggregate(input.reviewsSample, "organizer", orgId);
      const strictOrgReviews = input.reviewsSample.filter(
        (r) =>
          r.moderationStatus === "approved" &&
          r.primarySubjectType === "organizer" &&
          r.primarySubjectId === orgId,
      );
      if (agg.approvedReviewCount !== strictOrgReviews.length) {
        violations.push({
          code: "ORGANIZER_RATING_CONFLATED_WITH_SHIP_OR_TOUR",
          entityId: orgId,
          message: `Organizer aggregate for "${orgId}" included non-organizer reviews.`,
        });
      }
    }

    if (input.franchises) {
      for (const fr of input.franchises) {
        const agg = computeEntityReviewAggregate(input.reviewsSample, "franchise", fr.franchiseId);
        const strictFrReviews = input.reviewsSample.filter(
          (r) =>
            r.moderationStatus === "approved" &&
            r.primarySubjectType === "franchise" &&
            r.primarySubjectId === fr.franchiseId,
        );
        if (agg.approvedReviewCount !== strictFrReviews.length) {
          violations.push({
            code: "FRANCHISE_RATING_CONFLATED_WITH_ORGANIZER_OR_SHIP",
            entityId: fr.franchiseId,
            message: `Franchise aggregate for "${fr.franchiseId}" included non-franchise reviews.`,
          });
        }
      }
    }
  }

  // 9. Filter, UTM, dynamic comparison query, planner code, or chat room URL entering a sitemap
  const allowedCuratedComparisonPaths = new Set<string>([
    "/hosted-cruises/comparisons",
    ...CURATED_HOSTED_COMPARISON_SLUGS.map((slug) => `/hosted-cruises/comparisons/${slug}`),
  ]);
  for (const url of input.sitemapUrls || []) {
    let pathname = "";
    try {
      pathname = new URL(url).pathname;
    } catch {
      pathname = url;
    }
    const isInvalidCuratedComparison =
      /^\/hosted-cruises\/comparisons(\/|$)/i.test(pathname) &&
      !allowedCuratedComparisonPaths.has(pathname.toLowerCase());
    if (
      url.includes("?") ||
      /utm_/i.test(url) ||
      /\/p\//i.test(url) ||
      /\/cruise\/group\//i.test(url) ||
      /\/hosted-cruises\/compare(\/|$)/i.test(pathname) ||
      isInvalidCuratedComparison
    ) {
      violations.push({
        code: "FILTER_OR_PRIVATE_URL_IN_SITEMAP",
        entityId: url,
        message: `Non-canonical filter, UTM, comparison query, planner, or chat URL entered sitemap: "${url}".`,
      });
    }
  }

  // 10. Stale source presented as live
  for (const inv of input.liveInventoryClaims || []) {
    if (!inv.claimedLive) continue;
    const ts = Date.parse(inv.retrievedAtIso);
    const ageMin = Number.isFinite(ts) ? (now.getTime() - ts) / 60_000 : Infinity;
    if (ageMin > inv.maxAgeMinutes) {
      violations.push({
        code: "STALE_SOURCE_PRESENTED_AS_LIVE",
        entityId: inv.entityId,
        message: `Entity "${inv.entityId}" presented ${Math.round(ageMin)}m-old cache as live (max ${inv.maxAgeMinutes}m).`,
      });
    }
  }

  // 11. Renamed organizer creating a second identity
  const slugAndAliasOwners = new Map<string, string>();
  const domainOwners = new Map<string, string>();
  for (const org of input.organizers) {
    const allSlugs = [org.organizerSlug, ...(org.aliases || [])].map((s) =>
      s.trim().toLowerCase(),
    );
    for (const s of allSlugs) {
      const existing = slugAndAliasOwners.get(s);
      if (existing && existing !== org.organizerId) {
        violations.push({
          code: "RENAMED_ORGANIZER_DUPLICATE_IDENTITY",
          entityId: org.organizerId,
          message: `Organizer slug/alias "${s}" is claimed by both "${existing}" and "${org.organizerId}".`,
        });
      } else {
        slugAndAliasOwners.set(s, org.organizerId);
      }
    }
    const dom = org.officialDomain.trim().toLowerCase();
    const prevDomOwner = domainOwners.get(dom);
    if (prevDomOwner && prevDomOwner !== org.organizerId) {
      violations.push({
        code: "RENAMED_ORGANIZER_DUPLICATE_IDENTITY",
        entityId: org.organizerId,
        message: `Official domain "${dom}" is claimed by two separate organizer records: "${prevDomOwner}" and "${org.organizerId}".`,
      });
    } else {
      domainOwners.set(dom, org.organizerId);
    }
  }

  // 12. Cancelled sailing silently replaced or dropped instead of marked cancelled
  const currentById = new Map(input.hostedSailings.map((h) => [h.hostedSailingId, h]));
  const currentByPath = new Map(
    input.hostedSailings.map((h) => [`${h.organizerSlug}|${h.sailingSlug}`, h]),
  );
  for (const hist of input.previousHistoricalHostedSailings || []) {
    const byId = currentById.get(hist.hostedSailingId);
    const byPath = currentByPath.get(`${hist.organizerSlug}|${hist.sailingSlug}`);
    if (!byId) {
      violations.push({
        code: "CANCELLED_SAILING_SILENTLY_REPLACED",
        entityId: hist.hostedSailingId,
        message: `Historical hosted sailing "${hist.hostedSailingId}" disappeared instead of transitioning to lifecycleStatus="cancelled" or "completed".`,
      });
    } else if (byId.physicalSailingId !== hist.physicalSailingId) {
      violations.push({
        code: "CANCELLED_SAILING_SILENTLY_REPLACED",
        entityId: hist.hostedSailingId,
        message: `Hosted sailing "${hist.hostedSailingId}" silently swapped physical sailing "${hist.physicalSailingId}" for "${byId.physicalSailingId}".`,
      });
    }
    if (byPath && byPath.hostedSailingId !== hist.hostedSailingId) {
      violations.push({
        code: "CANCELLED_SAILING_SILENTLY_REPLACED",
        entityId: hist.hostedSailingId,
        message: `Hosted path "${hist.organizerSlug}/${hist.sailingSlug}" silently replaced "${hist.hostedSailingId}" with "${byPath.hostedSailingId}".`,
      });
    }
  }

  // 13. Separate Canonical Entities for Organizer/Producer and Franchise (even when 1:1)
  if (input.franchises) {
    const orgBySlug = new Map(
      input.organizers.map((o) => [o.organizerSlug.toLowerCase(), o]),
    );
    const frById = new Map<string, CanonicalHostedFranchiseFactRecord>();
    const frSlugOwners = new Map<string, string>();
    const orgLinkedFranchiseCount = new Map<string, number>();

    for (const fr of input.franchises) {
      if (!/^hosted-franchise:[a-z0-9-]+$/.test(fr.franchiseId)) {
        violations.push({
          code: "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY",
          entityId: fr.franchiseId,
          message: `Franchise "${fr.franchiseSlug}" must use canonical "hosted-franchise:<slug>" entity ID (got "${fr.franchiseId}").`,
        });
      }
      if (!/^rep:hosted-franchise:[a-z0-9-]+$/.test(fr.reputationFranchiseEntityId)) {
        violations.push({
          code: "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY",
          entityId: fr.franchiseId,
          message: `Franchise "${fr.franchiseSlug}" must use distinct "rep:hosted-franchise:<slug>" reputation ID (got "${fr.reputationFranchiseEntityId}").`,
        });
      }
      const producer = orgBySlug.get(fr.producerOrganizerSlug.toLowerCase());
      if (!producer || producer.organizerId !== fr.producerOrganizerId) {
        violations.push({
          code: "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY",
          entityId: fr.franchiseId,
          message: `Franchise "${fr.franchiseId}" references unknown or mismatched producer "${fr.producerOrganizerId}" (${fr.producerOrganizerSlug}).`,
        });
      } else {
        if (
          fr.franchiseId === producer.organizerId ||
          fr.reputationFranchiseEntityId === producer.reputationEntityId
        ) {
          violations.push({
            code: "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY",
            entityId: fr.franchiseId,
            message: `Organizer "${producer.organizerId}" and Franchise "${fr.franchiseId}" collapsed canonical or reputation entity IDs.`,
          });
        }
        orgLinkedFranchiseCount.set(
          producer.organizerId,
          (orgLinkedFranchiseCount.get(producer.organizerId) ?? 0) + 1,
        );
      }

      frById.set(fr.franchiseId, fr);
      for (const s of [fr.franchiseSlug, ...(fr.aliases || [])].map((x) =>
        x.trim().toLowerCase(),
      )) {
        const prevOwner = frSlugOwners.get(s);
        if (prevOwner && prevOwner !== fr.franchiseId) {
          violations.push({
            code: "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY",
            entityId: fr.franchiseId,
            message: `Franchise slug/alias "${s}" claimed by both "${prevOwner}" and "${fr.franchiseId}".`,
          });
        } else {
          frSlugOwners.set(s, fr.franchiseId);
        }
      }
    }

    for (const org of input.organizers) {
      if ((orgLinkedFranchiseCount.get(org.organizerId) ?? 0) === 0) {
        violations.push({
          code: "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY",
          entityId: org.organizerId,
          message: `Organizer "${org.organizerId}" lacks a separate canonical Franchise record (even 1:1 organizers must maintain a distinct hosted-franchise:<slug> entity).`,
        });
      }
    }

    for (const hs of input.hostedSailings) {
      if (!hs.franchiseId || !hs.franchiseSlug) {
        violations.push({
          code: "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY",
          entityId: hs.hostedSailingId,
          message: `Hosted sailing "${hs.hostedSailingId}" is missing explicit franchiseId / franchiseSlug.`,
        });
        continue;
      }
      const fr = frById.get(hs.franchiseId);
      if (!fr || fr.franchiseSlug !== hs.franchiseSlug) {
        violations.push({
          code: "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY",
          entityId: hs.hostedSailingId,
          message: `Hosted sailing "${hs.hostedSailingId}" references invalid franchise "${hs.franchiseId}" (${hs.franchiseSlug}).`,
        });
      } else if (fr.producerOrganizerSlug.toLowerCase() !== hs.organizerSlug.toLowerCase()) {
        violations.push({
          code: "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY",
          entityId: hs.hostedSailingId,
          message: `Hosted sailing "${hs.hostedSailingId}" links organizer "${hs.organizerSlug}" to franchise "${fr.franchiseId}" owned by "${fr.producerOrganizerSlug}".`,
        });
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

// ============================================================================
// Phase A: Formal 9-Point Publication Gate & Empirical Physical-Sailing Reuse
// ============================================================================

export const BANNED_GENERIC_HOSTED_FILLER_REGEX =
  /\b(sunset\s+mixer|sunset\s+sail-away\s+mixer|cocktail\s+mixer|hosted\s+dinner|group\s+beach\s+day|onboard\s+social\s+event)s?\b/i;

export type HostedPublicationGateCheckId =
  | "confirmed_organizer_and_franchise"
  | "confirmed_physical_sailing"
  | "official_booking_or_contact_link"
  | "verified_ship_and_dates"
  | "meaningfully_complete_itinerary"
  | "source_evidence_and_verification_date"
  | "substantive_unique_facts"
  | "functional_sailing_pathway"
  | "internal_link_reachability";

export interface HostedPublicationGateCheckResult {
  checkNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  checkId: HostedPublicationGateCheckId;
  passed: boolean;
  reasonCode: HostedHoldReasonCode | null;
  detail: string;
}

export type HostedSailingTravelerPathwayKind =
  | "join_group_plan"
  | "request_group_access"
  | "open_group_plan"
  | "completed_edition_continuity"
  | "none";

export interface HostedPublicationGateEvaluationInput {
  organizer: CanonicalHostedOrganizerFactRecord | null | undefined;
  franchise: CanonicalHostedFranchiseFactRecord | null | undefined;
  sailing: CanonicalHostedSailingFactRecord;
  physicalSchedule: {
    resolved: boolean;
    physicalSailingId: string;
    shipSlug: string;
    shipName: string;
    sailDate: string;
    returnDate: string | null;
    nights: number | null;
    isExpired: boolean;
    hasCompletePortItinerary: boolean;
    daysCount: number;
    portDaysCount: number;
    hasUnknownDayTypes: boolean;
    everyPortDayVerified: boolean;
    embarkPortLabel: string;
    portStopsSummary: string;
    scheduleSourceUrl: string | null;
  } | null;
  siblingSailingsCompositeTexts?: ReadonlyArray<{
    hostedSailingId: string;
    compositeText: string;
  }>;
  sailingPathway: {
    hasFunctionalSailingPathway: boolean;
    pathwayKind: HostedSailingTravelerPathwayKind;
    enrollmentApiPath: string | null;
    communityId: string | null;
    /**
     * Explicit proof field for User Correction #2:
     * A populated comparison matrix adds value on hubs, but CANNOT substitute
     * for a functional traveler pathway on the sailing page itself.
     */
    hasPopulatedComparisonMatrix?: boolean;
  };
  internalLinkReachability: {
    linkedFromCategoryHub: boolean;
    linkedFromFranchisePage: boolean;
    linkedFromOrganizerPage: boolean;
  };
}

export interface HostedPublicationGateEvaluationResult {
  passed: boolean;
  eligibleForSitemap: boolean;
  recommendedRobots: "index, follow" | "noindex, follow";
  primaryHoldReasonCode: HostedHoldReasonCode | null;
  checks: ReadonlyArray<HostedPublicationGateCheckResult>;
  failedCheckIds: ReadonlyArray<HostedPublicationGateCheckId>;
  substantiveFactsBreakdown: {
    hasCruiseSpecificProgrammingAndAudience: boolean;
    hasExplicitEntityRelationship: boolean;
    hasVerifiedOfficialLinks: boolean;
    hasItineraryAndEmbarkationContext: boolean;
    structuredDifferentiatorCount: number;
    structuredDifferentiatorsPresent: string[];
    containsBannedGenericFiller: boolean;
    maxSiblingFourWordShingleJaccard: number;
    shingleDuplicateSafeguardThreshold: number;
  };
}

export function buildFourWordShingles(rawText: string): Set<string> {
  const words = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const shingles = new Set<string>();
  if (words.length < 4) {
    if (words.length > 0) shingles.add(words.join(" "));
    return shingles;
  }
  for (let i = 0; i <= words.length - 4; i++) {
    shingles.add(`${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`);
  }
  return shingles;
}

export function computeFourWordShingleJaccard(textA: string, textB: string): number {
  const setA = buildFourWordShingles(textA);
  const setB = buildFourWordShingles(textB);
  if (setA.size === 0 && setB.size === 0) return 0;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  if (union <= 0) return 0;
  return Math.round((intersection / union) * 1000) / 1000;
}

export function buildHostedSailingSubstantiveCompositeText(
  sailing: CanonicalHostedSailingFactRecord,
): string {
  return [
    sailing.sailingTitle,
    sailing.editionSubtitle,
    sailing.anticipationHook,
    sailing.announcedHostedProgramming || "",
    sailing.communityAtmosphereSummary || "",
    sailing.cabinAvailabilityNote || "",
    sailing.soloSupport || "",
  ]
    .filter(Boolean)
    .join(" ");
}

function isExternalHttpsUrl(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("https://")) return false;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    return Boolean(
      host &&
        host.includes(".") &&
        host !== "localhost" &&
        !host.endsWith(".localhost") &&
        !host.endsWith(".invalid"),
    );
  } catch {
    return false;
  }
}

export const SHINGLE_DUPLICATE_SAFEGUARD_MAX_JACCARD = 0.72 as const;

export function evaluateHostedPublicationGate(
  input: HostedPublicationGateEvaluationInput,
): HostedPublicationGateEvaluationResult {
  const { organizer, franchise, sailing, physicalSchedule, sailingPathway, internalLinkReachability } =
    input;
  const checks: HostedPublicationGateCheckResult[] = [];

  // Check #1: Confirmed Organizer/Producer AND separate Franchise entity
  const orgValid = Boolean(
    organizer &&
      /^hosted-organizer:[a-z0-9-]+$/.test(organizer.organizerId) &&
      /^rep:hosted-organizer:[a-z0-9-]+$/.test(organizer.reputationEntityId) &&
      organizer.organizerSlug === sailing.organizerSlug,
  );
  const frValid = Boolean(
    franchise &&
      organizer &&
      /^hosted-franchise:[a-z0-9-]+$/.test(franchise.franchiseId) &&
      /^rep:hosted-franchise:[a-z0-9-]+$/.test(franchise.reputationFranchiseEntityId) &&
      franchise.franchiseId !== organizer.organizerId &&
      franchise.reputationFranchiseEntityId !== organizer.reputationEntityId &&
      franchise.producerOrganizerId === organizer.organizerId &&
      sailing.franchiseId === franchise.franchiseId &&
      sailing.franchiseSlug === franchise.franchiseSlug,
  );
  const check1Passed = orgValid && frValid;
  checks.push({
    checkNumber: 1,
    checkId: "confirmed_organizer_and_franchise",
    passed: check1Passed,
    reasonCode: check1Passed ? null : "MISSING_SUBSTANTIVE_HOSTED_FACTS",
    detail: check1Passed
      ? `Confirmed distinct Producer (${organizer!.organizerId}) and Franchise (${franchise!.franchiseId}).`
      : "Missing or collapsed canonical Organizer/Producer and Franchise entity linkage.",
  });

  // Check #2: Confirmed physical sailing (upcoming & active)
  const check2Passed = Boolean(
    physicalSchedule &&
      physicalSchedule.resolved &&
      /^sailing:[a-z0-9]+:[a-z0-9-]+:\d{4}-\d{2}-\d{2}$/.test(sailing.physicalSailingId) &&
      physicalSchedule.physicalSailingId === sailing.physicalSailingId &&
      sailing.lifecycleStatus === "upcoming" &&
      !physicalSchedule.isExpired,
  );
  checks.push({
    checkNumber: 2,
    checkId: "confirmed_physical_sailing",
    passed: check2Passed,
    reasonCode: check2Passed ? null : "UNVERIFIED_PORT_CLOCK_WINDOWS",
    detail: check2Passed
      ? `Confirmed active physical sailing ${sailing.physicalSailingId}.`
      : sailing.lifecycleStatus !== "upcoming" || physicalSchedule?.isExpired
        ? "Sailing is completed, expired, or cancelled (held from active sitemap indexation)."
        : "Physical ship sailing record is missing or unresolved.",
  });

  // Check #3: Official booking & contact links
  const check3Passed = Boolean(
    organizer &&
      isExternalHttpsUrl(sailing.officialSailingPageUrl) &&
      isExternalHttpsUrl(sailing.officialReservationFormUrl) &&
      isExternalHttpsUrl(organizer.publicContactPageUrl) &&
      isExternalHttpsUrl(organizer.officialWebsiteUrl),
  );
  checks.push({
    checkNumber: 3,
    checkId: "official_booking_or_contact_link",
    passed: check3Passed,
    reasonCode: check3Passed ? null : "BROKEN_OFFICIAL_BOOKING_OR_PAGE_404",
    detail: check3Passed
      ? `Verified external HTTPS official sailing, reservation, and contact URLs.`
      : "Missing or invalid official HTTPS booking, sailing, or contact URL.",
  });

  // Check #4: Verified ship and dates
  const check4Passed = Boolean(
    physicalSchedule &&
      sailing.canonicalShipSlug.trim().length > 0 &&
      physicalSchedule.shipName.trim().length > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(sailing.canonicalSailDate) &&
      physicalSchedule.sailDate === sailing.canonicalSailDate &&
      physicalSchedule.returnDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(physicalSchedule.returnDate) &&
      physicalSchedule.returnDate >= sailing.canonicalSailDate &&
      typeof physicalSchedule.nights === "number" &&
      physicalSchedule.nights >= 1,
  );
  checks.push({
    checkNumber: 4,
    checkId: "verified_ship_and_dates",
    passed: check4Passed,
    reasonCode: check4Passed ? null : "UNANNOUNCED_FUTURE_DEPARTURE",
    detail: check4Passed
      ? `Verified vessel ${physicalSchedule!.shipName} (${sailing.canonicalSailDate} to ${physicalSchedule!.returnDate}, ${physicalSchedule!.nights} nights).`
      : "Missing or inconsistent ship identity, departure/return dates, or duration.",
  });

  // Check #5: Meaningfully complete itinerary (zero embedded itinerary duplication)
  const rawRecord = sailing as unknown as Record<string, unknown>;
  const hasEmbeddedItinerary =
    rawRecord.itinerary !== undefined ||
    rawRecord.itineraryDays !== undefined ||
    rawRecord.portDays !== undefined ||
    rawRecord.ports !== undefined;
  const check5Passed = Boolean(
    !hasEmbeddedItinerary &&
      physicalSchedule &&
      physicalSchedule.hasCompletePortItinerary &&
      physicalSchedule.daysCount >= 2 &&
      physicalSchedule.portDaysCount >= 1 &&
      !physicalSchedule.hasUnknownDayTypes &&
      physicalSchedule.everyPortDayVerified,
  );
  checks.push({
    checkNumber: 5,
    checkId: "meaningfully_complete_itinerary",
    passed: check5Passed,
    reasonCode: check5Passed ? null : "UNVERIFIED_PORT_CLOCK_WINDOWS",
    detail: check5Passed
      ? `Verified ${physicalSchedule!.daysCount} itinerary days (${physicalSchedule!.portDaysCount} port calls) inherited from ${sailing.physicalSailingId}.`
      : "Itinerary is incomplete, contains unverified port windows/unknown days, or embeds duplicated itinerary arrays.",
  });

  // Check #6: Source evidence and verification date
  const checkedAtValid = Number.isFinite(Date.parse(sailing.organizerSourceCheckedAt));
  const effectivePrimarySource = sailing.primarySourceUrl || sailing.officialSailingPageUrl;
  const hasScheduleHold = Boolean(sailing.scheduleHoldReason && sailing.scheduleHoldReason.trim());
  const check6Passed = Boolean(
    !hasScheduleHold &&
      checkedAtValid &&
      isExternalHttpsUrl(effectivePrimarySource) &&
      physicalSchedule &&
      isExternalHttpsUrl(physicalSchedule.scheduleSourceUrl) &&
      (sailing.verificationState === undefined || sailing.verificationState === "verified"),
  );
  checks.push({
    checkNumber: 6,
    checkId: "source_evidence_and_verification_date",
    passed: check6Passed,
    reasonCode: check6Passed
      ? null
      : (sailing.scheduleHoldReasonCode ?? "UNVERIFIED_PORT_CLOCK_WINDOWS"),
    detail: check6Passed
      ? `Verified primary organizer source (${effectivePrimarySource}) and schedule source checked at ${sailing.organizerSourceCheckedAt}.`
      : hasScheduleHold
        ? `Held by explicit scheduleHoldReason: ${sailing.scheduleHoldReason}`
        : "Missing primary-source URL, schedule provenance URL, or valid ISO verification timestamp.",
  });

  // Check #7: Substantive unique facts + secondary 4-word shingle duplicate safeguard
  const programmingOrContextText = [
    (sailing.announcedHostedProgramming || "").trim(),
    (sailing.anticipationHook || "").trim(),
  ]
    .filter((t) => t.length > 0 && t.toLowerCase() !== "group activities and time together")
    .join(" ");
  const audienceText = (sailing.typicalAudience || "").trim();
  const compositeText = buildHostedSailingSubstantiveCompositeText(sailing);
  const containsBannedGenericFiller = BANNED_GENERIC_HOSTED_FILLER_REGEX.test(compositeText);

  const hasCruiseSpecificProgrammingAndAudience =
    programmingOrContextText.length >= 25 &&
    audienceText.length >= 15 &&
    !containsBannedGenericFiller;

  const effectiveOrgType =
    sailing.organizerType ??
    organizer?.organizerType ??
    (organizer?.typicalCharterModel === "full_ship_charter"
      ? "independent_charter_operator"
      : organizer?.typicalCharterModel === "hosted_group_block"
        ? "hosted_group_organizer"
        : undefined);
  const effectiveClassification =
    sailing.experienceClassification ??
    organizer?.primaryClassification ??
    (sailing.fullShipCharter === true
      ? "full_ship_charter"
      : sailing.fullShipCharter === false
        ? "hosted_group_sailing"
        : undefined);
  const hasExplicitEntityRelationship = Boolean(
    effectiveOrgType &&
      effectiveClassification &&
      sailing.cabinSellerLabel &&
      sailing.cabinSellerLabel.trim().length >= 3 &&
      franchise?.relationshipToProducer,
  );

  const hasVerifiedOfficialLinks =
    isExternalHttpsUrl(sailing.officialSailingPageUrl) &&
    isExternalHttpsUrl(sailing.officialReservationFormUrl);

  const embarkLabel = (physicalSchedule?.embarkPortLabel || "").trim();
  const portStops = (physicalSchedule?.portStopsSummary || "").trim();
  const hasItineraryAndEmbarkationContext = Boolean(
    sailing.regionLabel.trim().length >= 3 &&
      embarkLabel.length >= 3 &&
      embarkLabel.toLowerCase() !== "see official itinerary" &&
      portStops.length >= 3,
  );

  const structuredDifferentiatorsPresent: string[] = [];
  if (sailing.fullShipCharter !== null) {
    structuredDifferentiatorsPresent.push("charter_vs_group_block_model");
  }
  if (
    (sailing.vesselType && sailing.vesselType.trim().length >= 3) ||
    (sailing.approximateVesselScale && sailing.approximateVesselScale.trim().length >= 3) ||
    (sailing.approximateGroupSizeLabel && sailing.approximateGroupSizeLabel.trim().length >= 3) ||
    (organizer?.vesselTypeSummary && organizer.vesselTypeSummary.trim().length >= 3)
  ) {
    structuredDifferentiatorsPresent.push("vessel_scale_or_group_size");
  }
  if (
    sailing.verifiedStartingPriceUsd !== null ||
    (sailing.publishedPriceDisplay && sailing.publishedPriceDisplay.trim().length >= 3) ||
    (sailing.inclusionsSummary && sailing.inclusionsSummary.trim().length >= 10) ||
    (organizer?.inclusionsSummary && organizer.inclusionsSummary.trim().length >= 10)
  ) {
    structuredDifferentiatorsPresent.push("pricing_or_inclusions");
  }
  if (
    (sailing.soloSupport && sailing.soloSupport.trim().length >= 10 && sailing.soloFriendly !== null) ||
    (organizer?.soloSupportSummary && organizer.soloSupportSummary.trim().length >= 10)
  ) {
    structuredDifferentiatorsPresent.push("solo_traveler_support");
  }
  if (sailing.familyPolicy && sailing.familyPolicy !== "not_verified") {
    structuredDifferentiatorsPresent.push("family_or_age_policy");
  }
  if (
    (sailing.accessibilitySummary && sailing.accessibilitySummary.trim().length >= 10) ||
    (organizer?.accessibilitySummary && organizer.accessibilitySummary.trim().length >= 10)
  ) {
    structuredDifferentiatorsPresent.push("accessibility_disclosure");
  }
  if (
    (organizer?.cancellationAndParticipationPolicy &&
      organizer.cancellationAndParticipationPolicy.trim().length >= 20) ||
    (organizer?.officialReservationPathSummary &&
      organizer.officialReservationPathSummary.trim().length >= 20)
  ) {
    structuredDifferentiatorsPresent.push("reservation_and_participation_policy");
  }

  let maxSiblingJaccard = 0;
  for (const sib of input.siblingSailingsCompositeTexts || []) {
    if (sib.hostedSailingId === sailing.hostedSailingId) continue;
    const sim = computeFourWordShingleJaccard(compositeText, sib.compositeText);
    if (sim > maxSiblingJaccard) maxSiblingJaccard = sim;
  }

  const substantiveFactsMet =
    hasCruiseSpecificProgrammingAndAudience &&
    hasExplicitEntityRelationship &&
    hasVerifiedOfficialLinks &&
    hasItineraryAndEmbarkationContext &&
    structuredDifferentiatorsPresent.length >= 2;

  const shingleSafeguardMet = maxSiblingJaccard < SHINGLE_DUPLICATE_SAFEGUARD_MAX_JACCARD;
  const check7Passed = substantiveFactsMet && shingleSafeguardMet;

  checks.push({
    checkNumber: 7,
    checkId: "substantive_unique_facts",
    passed: check7Passed,
    reasonCode: check7Passed
      ? null
      : !substantiveFactsMet
        ? "MISSING_SUBSTANTIVE_HOSTED_FACTS"
        : "DUPLICATE_BOILERPLATE_CONTENT",
    detail: check7Passed
      ? `Substantive facts verified (${structuredDifferentiatorsPresent.length} structured differentiators; max sibling 4-shingle Jaccard ${maxSiblingJaccard}).`
      : !substantiveFactsMet
        ? `Failed substantive unique facts requirement (programming/audience=${hasCruiseSpecificProgrammingAndAudience}, relationship=${hasExplicitEntityRelationship}, links=${hasVerifiedOfficialLinks}, embark/itinerary=${hasItineraryAndEmbarkationContext}, differentiators=${structuredDifferentiatorsPresent.length}/2, bannedFiller=${containsBannedGenericFiller}).`
        : `Failed shingle duplicate-content safeguard (max sibling 4-word shingle Jaccard ${maxSiblingJaccard} >= ${SHINGLE_DUPLICATE_SAFEGUARD_MAX_JACCARD}).`,
  });

  // Check #8: Mandatory functional traveler pathway on EVERY sailing page
  // (A populated comparison matrix CANNOT substitute for sailing-page utility!)
  const validActivePathwayKinds = new Set<HostedSailingTravelerPathwayKind>([
    "join_group_plan",
    "request_group_access",
    "open_group_plan",
  ]);
  const check8Passed = Boolean(
    sailingPathway.hasFunctionalSailingPathway &&
      validActivePathwayKinds.has(sailingPathway.pathwayKind) &&
      sailingPathway.enrollmentApiPath &&
      sailingPathway.enrollmentApiPath.startsWith("/api/v2/hosted-cruises/") &&
      sailingPathway.communityId &&
      /^community:[a-z0-9-]+:[a-z0-9-]+:\d{4}-\d{2}-\d{2}$/.test(sailingPathway.communityId),
  );
  checks.push({
    checkNumber: 8,
    checkId: "functional_sailing_pathway",
    passed: check8Passed,
    reasonCode: check8Passed ? null : "MISSING_FUNCTIONAL_SAILING_PATHWAY",
    detail: check8Passed
      ? `Active sailing-page traveler pathway (${sailingPathway.pathwayKind}) wired to ${sailingPathway.communityId}.`
      : sailingPathway.hasPopulatedComparisonMatrix
        ? "Missing functional traveler pathway on sailing page (comparison matrix presence cannot substitute for Join Group Plan utility)."
        : "Missing functional Join Group Plan / group-access pathway on sailing page.",
  });

  // Check #9: Internal-link reachability from Category Hub, Franchise Page, and Organizer Page
  const check9Passed = Boolean(
    internalLinkReachability.linkedFromCategoryHub &&
      internalLinkReachability.linkedFromFranchisePage &&
      internalLinkReachability.linkedFromOrganizerPage,
  );
  checks.push({
    checkNumber: 9,
    checkId: "internal_link_reachability",
    passed: check9Passed,
    reasonCode: check9Passed ? null : "ORPHAN_MISSING_INTERNAL_LINKS",
    detail: check9Passed
      ? "Linked from theme category hub, recurring franchise page, and producer/organizer profile."
      : `Orphan risk: categoryHub=${internalLinkReachability.linkedFromCategoryHub}, franchisePage=${internalLinkReachability.linkedFromFranchisePage}, organizerPage=${internalLinkReachability.linkedFromOrganizerPage}.`,
  });

  const failedChecks = checks.filter((c) => !c.passed);
  const passed = failedChecks.length === 0;

  return {
    passed,
    eligibleForSitemap: passed,
    recommendedRobots: passed ? "index, follow" : "noindex, follow",
    primaryHoldReasonCode: passed ? null : (failedChecks[0]?.reasonCode ?? "MISSING_SUBSTANTIVE_HOSTED_FACTS"),
    checks,
    failedCheckIds: failedChecks.map((c) => c.checkId),
    substantiveFactsBreakdown: {
      hasCruiseSpecificProgrammingAndAudience,
      hasExplicitEntityRelationship,
      hasVerifiedOfficialLinks,
      hasItineraryAndEmbarkationContext,
      structuredDifferentiatorCount: structuredDifferentiatorsPresent.length,
      structuredDifferentiatorsPresent,
      containsBannedGenericFiller,
      maxSiblingFourWordShingleJaccard: maxSiblingJaccard,
      shingleDuplicateSafeguardThreshold: SHINGLE_DUPLICATE_SAFEGUARD_MAX_JACCARD,
    },
  };
}

export interface PhysicalSailingReuseMetrics {
  totalHostedDepartures: number;
  distinctPhysicalSailings: number;
  sharedPhysicalSailingsCount: number;
  multiGroupHostedDeparturesCount: number;
  empiricalMultiGroupDepartureSharePct: number;
  distinctShipsCount: number;
  top15ShipsHostedDeparturesCount: number;
  top15ShipsDepartureSharePct: number;
  topShipsByHostedDepartureCount: ReadonlyArray<{
    shipSlug: string;
    lineCode: CanonicalCruiseLineCode;
    hostedDeparturesCount: number;
    distinctPhysicalSailingsCount: number;
  }>;
  sharedPhysicalSailings: ReadonlyArray<{
    physicalSailingId: string;
    shipSlug: string;
    sailDate: string;
    hostedDepartureIds: string[];
    organizerSlugs: string[];
  }>;
  methodologyNote: string;
}

export function computePhysicalSailingReuseMetrics(
  hostedSailings: ReadonlyArray<
    Pick<
      CanonicalHostedSailingFactRecord,
      | "hostedSailingId"
      | "organizerSlug"
      | "physicalSailingId"
      | "canonicalLineCode"
      | "canonicalShipSlug"
      | "canonicalSailDate"
    >
  >,
): PhysicalSailingReuseMetrics {
  const totalHostedDepartures = hostedSailings.length;
  const byPhysical = new Map<
    string,
    {
      physicalSailingId: string;
      shipSlug: string;
      sailDate: string;
      hostedDepartureIds: string[];
      organizerSlugs: string[];
    }
  >();
  const byShip = new Map<
    string,
    {
      shipSlug: string;
      lineCode: CanonicalCruiseLineCode;
      hostedDeparturesCount: number;
      physicalIds: Set<string>;
    }
  >();

  for (const hs of hostedSailings) {
    const existingPhys = byPhysical.get(hs.physicalSailingId);
    if (existingPhys) {
      existingPhys.hostedDepartureIds.push(hs.hostedSailingId);
      if (!existingPhys.organizerSlugs.includes(hs.organizerSlug)) {
        existingPhys.organizerSlugs.push(hs.organizerSlug);
      }
    } else {
      byPhysical.set(hs.physicalSailingId, {
        physicalSailingId: hs.physicalSailingId,
        shipSlug: hs.canonicalShipSlug,
        sailDate: hs.canonicalSailDate,
        hostedDepartureIds: [hs.hostedSailingId],
        organizerSlugs: [hs.organizerSlug],
      });
    }

    const shipKey = hs.canonicalShipSlug.toLowerCase();
    const existingShip = byShip.get(shipKey);
    if (existingShip) {
      existingShip.hostedDeparturesCount += 1;
      existingShip.physicalIds.add(hs.physicalSailingId);
    } else {
      byShip.set(shipKey, {
        shipSlug: hs.canonicalShipSlug,
        lineCode: hs.canonicalLineCode,
        hostedDeparturesCount: 1,
        physicalIds: new Set([hs.physicalSailingId]),
      });
    }
  }

  const sharedPhysicalSailings = Array.from(byPhysical.values())
    .filter((p) => p.hostedDepartureIds.length >= 2)
    .sort((a, b) => b.hostedDepartureIds.length - a.hostedDepartureIds.length);

  const multiGroupHostedDeparturesCount = sharedPhysicalSailings.reduce(
    (sum, item) => sum + item.hostedDepartureIds.length,
    0,
  );

  const sortedShips = Array.from(byShip.values())
    .map((s) => ({
      shipSlug: s.shipSlug,
      lineCode: s.lineCode,
      hostedDeparturesCount: s.hostedDeparturesCount,
      distinctPhysicalSailingsCount: s.physicalIds.size,
    }))
    .sort((a, b) => {
      if (b.hostedDeparturesCount !== a.hostedDeparturesCount) {
        return b.hostedDeparturesCount - a.hostedDeparturesCount;
      }
      return a.shipSlug.localeCompare(b.shipSlug);
    });

  const top15Ships = sortedShips.slice(0, 15);
  const top15Count = top15Ships.reduce((sum, s) => sum + s.hostedDeparturesCount, 0);

  return {
    totalHostedDepartures,
    distinctPhysicalSailings: byPhysical.size,
    sharedPhysicalSailingsCount: sharedPhysicalSailings.length,
    multiGroupHostedDeparturesCount,
    empiricalMultiGroupDepartureSharePct:
      totalHostedDepartures > 0
        ? Math.round((multiGroupHostedDeparturesCount / totalHostedDepartures) * 1000) / 10
        : 0,
    distinctShipsCount: sortedShips.length,
    top15ShipsHostedDeparturesCount: top15Count,
    top15ShipsDepartureSharePct:
      totalHostedDepartures > 0
        ? Math.round((top15Count / totalHostedDepartures) * 1000) / 10
        : 0,
    topShipsByHostedDepartureCount: top15Ships,
    sharedPhysicalSailings,
    methodologyNote:
      "Empirically computed from verified hosted-departure records in DCC rather than assumed percentages.",
  };
}

// ============================================================================
// Stage 1: Ship-Page Publication Gate (9 Checks) & Event Schema Qualification
// ============================================================================

export const SHIP_PUBLICATION_GATE_CHECK_IDS = [
  "canonical_ship_and_line_identity",
  "verified_ship_facts",
  "useful_traveler_content",
  "upcoming_sailing_relationships",
  "correct_canonical_metadata",
  "internal_link_reachability",
  "structured_data_parity",
  "no_identity_conflict",
  "no_thin_placeholder_presentation",
] as const;

export type ShipPublicationGateCheckId =
  (typeof SHIP_PUBLICATION_GATE_CHECK_IDS)[number];

export const SHIP_HOLD_REASON_CODES = [
  "missing_canonical_ship_identity",
  "unverified_ship_facts",
  "insufficient_traveler_content",
  "no_upcoming_sailings_or_port_guides",
  "invalid_canonical_metadata",
  "orphan_ship_page",
  "structured_data_parity_failure",
  "unresolved_ship_identity_conflict",
  "thin_placeholder_ship_page",
] as const;

export type ShipHoldReasonCode = (typeof SHIP_HOLD_REASON_CODES)[number];

export interface ShipPublicationGateInput {
  shipSlug: string;
  shipName: string;
  cruiseLineName: string;
  canonicalLineCode: CanonicalCruiseLineCode | null;
  shipClass: string | null;
  passengerCapacity: number | null;
  debutYear: number | null;
  homeports: ReadonlyArray<string>;
  specSourceUrl: string | null;
  summaryDescription: string;
  dockAndTimingGuidance: string;
  curatedPortGuideCount: number;
  verifiedItineraryPortCount: number;
  upcomingIndexablePhysicalSailingCount: number;
  upcomingIndexableHostedSailingCount: number;
  canonicalPath: string;
  hasDistinctTitleAndDescription: boolean;
  linkedFromFleetHubOrLineOrSailing: boolean;
  hasTruthfulStructuredDataParity: boolean;
  usesDeprecatedTouristTripRootType?: boolean;
  identityConflictNote: string | null;
  hasShipSafeHeroVisual: boolean;
}

export interface ShipPublicationGateCheckResult {
  checkId: ShipPublicationGateCheckId;
  passed: boolean;
  holdReasonCode: ShipHoldReasonCode | null;
  detail: string;
}

export interface ShipPublicationGateEvaluationResult {
  passed: boolean;
  robotsDirective: "index, follow" | "noindex, follow";
  includeInSitemap: boolean;
  primaryHoldReasonCode: ShipHoldReasonCode | null;
  holdReasonCodes: ShipHoldReasonCode[];
  checks: ShipPublicationGateCheckResult[];
}

export function evaluateShipPublicationGate(
  input: ShipPublicationGateInput,
): ShipPublicationGateEvaluationResult {
  const checks: ShipPublicationGateCheckResult[] = [];

  const hasIdentity =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.shipSlug.trim()) &&
    input.shipName.trim().length >= 3 &&
    input.cruiseLineName.trim().length >= 3 &&
    input.cruiseLineName.trim().toLowerCase() !== "cruise line" &&
    input.canonicalLineCode !== null;
  checks.push({
    checkId: "canonical_ship_and_line_identity",
    passed: hasIdentity,
    holdReasonCode: hasIdentity ? null : "missing_canonical_ship_identity",
    detail: hasIdentity
      ? `Canonical vessel "${input.shipName}" (${input.shipSlug}) mapped to ${input.cruiseLineName} (${input.canonicalLineCode}).`
      : "Missing canonical vessel slug, ship name, or verified cruise line identity.",
  });

  const hasVerifiedShipFacts =
    Boolean(input.shipClass && input.shipClass.trim().length >= 3) &&
    typeof input.passengerCapacity === "number" &&
    input.passengerCapacity >= 50 &&
    typeof input.debutYear === "number" &&
    input.debutYear >= 1980 &&
    input.debutYear <= 2030 &&
    input.homeports.length >= 1 &&
    Boolean(input.specSourceUrl && input.specSourceUrl.startsWith("https://"));
  checks.push({
    checkId: "verified_ship_facts",
    passed: hasVerifiedShipFacts,
    holdReasonCode: hasVerifiedShipFacts ? null : "unverified_ship_facts",
    detail: hasVerifiedShipFacts
      ? `Verified ship specs (${input.shipClass}, ${input.passengerCapacity} guests, debut ${input.debutYear}) backed by ${input.specSourceUrl}.`
      : "Vessel lacks complete official source-backed class, guest capacity, debut year, or homeport facts.",
  });

  const combinedCopyLength =
    input.summaryDescription.trim().length + input.dockAndTimingGuidance.trim().length;
  const hasUsefulContent =
    input.summaryDescription.trim().length >= 80 &&
    input.dockAndTimingGuidance.trim().length >= 50 &&
    combinedCopyLength >= 150 &&
    !/coming soon|tbd|placeholder/i.test(
      `${input.summaryDescription} ${input.dockAndTimingGuidance}`,
    );
  checks.push({
    checkId: "useful_traveler_content",
    passed: hasUsefulContent,
    holdReasonCode: hasUsefulContent ? null : "insufficient_traveler_content",
    detail: hasUsefulContent
      ? `Substantive vessel overview and pier/all-aboard planning guidance (${combinedCopyLength} chars).`
      : "Summary or dock/timing traveler guidance is missing or too thin.",
  });

  const totalRelationships =
    input.upcomingIndexablePhysicalSailingCount +
    input.upcomingIndexableHostedSailingCount +
    input.curatedPortGuideCount;
  const hasRelationships = totalRelationships >= 1;
  checks.push({
    checkId: "upcoming_sailing_relationships",
    passed: hasRelationships,
    holdReasonCode: hasRelationships ? null : "no_upcoming_sailings_or_port_guides",
    detail: hasRelationships
      ? `${input.upcomingIndexablePhysicalSailingCount} physical sailings, ${input.upcomingIndexableHostedSailingCount} hosted departures, ${input.curatedPortGuideCount} curated ship-port excursion guides.`
      : "No upcoming indexable physical sailings, hosted departures, or curated ship-port guides.",
  });

  const expectedCanonical = `/cruise-ships/${input.shipSlug.trim().toLowerCase()}`;
  const hasCanonicalMeta =
    input.canonicalPath === expectedCanonical && input.hasDistinctTitleAndDescription;
  checks.push({
    checkId: "correct_canonical_metadata",
    passed: hasCanonicalMeta,
    holdReasonCode: hasCanonicalMeta ? null : "invalid_canonical_metadata",
    detail: hasCanonicalMeta
      ? `Canonical locked to ${expectedCanonical} with distinct title and description.`
      : `Expected canonical ${expectedCanonical} with distinct metadata (received ${input.canonicalPath}).`,
  });

  checks.push({
    checkId: "internal_link_reachability",
    passed: input.linkedFromFleetHubOrLineOrSailing,
    holdReasonCode: input.linkedFromFleetHubOrLineOrSailing ? null : "orphan_ship_page",
    detail: input.linkedFromFleetHubOrLineOrSailing
      ? "Reachable from /cruise-ships directory, cruise-line hub, or indexable sailing pages."
      : "Orphan ship page without internal incoming links.",
  });

  const structuredDataOk =
    input.hasTruthfulStructuredDataParity && !input.usesDeprecatedTouristTripRootType;
  checks.push({
    checkId: "structured_data_parity",
    passed: structuredDataOk,
    holdReasonCode: structuredDataOk ? null : "structured_data_parity_failure",
    detail: structuredDataOk
      ? "Truthful WebPage + BreadcrumbList + Organization + ItemList JSON-LD matches visible content."
      : "Structured data is missing, mismatched, or misrepresents ship profile as TouristTrip.",
  });

  const noConflict = !input.identityConflictNote || input.identityConflictNote.trim().length === 0;
  checks.push({
    checkId: "no_identity_conflict",
    passed: noConflict,
    holdReasonCode: noConflict ? null : "unresolved_ship_identity_conflict",
    detail: noConflict
      ? "No vessel or cruise-line identity conflict."
      : `Unresolved vessel identity conflict: ${input.identityConflictNote}`,
  });

  const distinctPortDepth = Math.max(
    input.curatedPortGuideCount,
    input.verifiedItineraryPortCount,
  );
  const notThinPlaceholder = distinctPortDepth >= 2 && input.hasShipSafeHeroVisual;
  checks.push({
    checkId: "no_thin_placeholder_presentation",
    passed: notThinPlaceholder,
    holdReasonCode: notThinPlaceholder ? null : "thin_placeholder_ship_page",
    detail: notThinPlaceholder
      ? `Rich multi-port presentation (${distinctPortDepth} verified ports) with ship-safe visual asset.`
      : `Insufficient verified port depth (${distinctPortDepth} ports) or missing ship-safe visual.`,
  });

  const holdReasonCodes = checks
    .filter((c) => !c.passed && c.holdReasonCode !== null)
    .map((c) => c.holdReasonCode as ShipHoldReasonCode);
  const passed = holdReasonCodes.length === 0;

  return {
    passed,
    robotsDirective: passed ? "index, follow" : "noindex, follow",
    includeInSitemap: passed,
    primaryHoldReasonCode: holdReasonCodes[0] ?? null,
    holdReasonCodes,
    checks,
  };
}

const GENUINE_EVENT_PROGRAMMING_PATTERN =
  /\b(concert|concerts|festival|music|stage|stages|lineup|artist|artists|band|bands|performances?|headliner|dj|djs|party|parties|ball|tea dance|cabaret|comedy|comedian|drag|workshop|workshops|conference|summit|keynote|seminar|classes|clinic|tournament|mastermind|continuing education|\bce\b|\bcme\b|\bcle\b|quilting|knitting|craft|dance|tasting|winemaker|hosted events|themed nights|private events)\b/i;

const GENERIC_VACATION_PACKAGE_ONLY_PATTERN =
  /^(group activities and time together\.?|group shore excursions and casual welcome meetups\.?|vacation package\.?|cruise vacation\.?|hosted cabin block\.?|not disclosed\.?|not yet verified\.?)$/i;

/**
 * Explicit manual-evidence allowlist entry required before ANY hosted departure
 * may emit Google-facing `Event` structured data.
 *
 * Policy Rule:
 * - Never emit `Event` markup automatically based only on named concerts, workshops,
 *   festivals, or themed programming.
 * - Rich Results Test validation alone is NOT sufficient evidence of Google Event
 *   policy eligibility.
 * - `Offer`, price, availability, `Review`, and `AggregateRating` remain disabled
 *   unless each item independently qualifies, is explicitly enabled here, and matches
 *   visible content on the page.
 */
export interface HostedEventSchemaManualAllowlistEntry {
  hostedSailingId: string;
  approvedBy: string;
  approvedAtIso: string;
  publicEventQualificationEvidence: string;
  physicalLocationPolicyEvidence: string;
  visibleContentParityVerified: boolean;
  richResultsTestAloneInsufficientAcknowledged: boolean;
  allowOffersMarkup?: boolean;
  allowAggregateRatingMarkup?: boolean;
}

export interface HostedFranchiseEventSeriesManualAllowlistEntry {
  franchiseId: string;
  approvedBy: string;
  approvedAtIso: string;
  manualSeriesPolicyEvidence: string;
  visibleContentParityVerified: boolean;
  richResultsTestAloneInsufficientAcknowledged: boolean;
  allowAggregateRatingMarkup?: boolean;
}

/**
 * Production Release Allowlist (Default: Empty `[]`):
 * All hosted departures emit `WebPage` + `BreadcrumbList` with truthful
 * `Organization` / `Place` relationships until individually audited and added here.
 */
export const EXPLICIT_HOSTED_EVENT_SCHEMA_ALLOWLIST: ReadonlyArray<HostedEventSchemaManualAllowlistEntry> =
  [];

export const EXPLICIT_FRANCHISE_EVENT_SERIES_ALLOWLIST: ReadonlyArray<HostedFranchiseEventSeriesManualAllowlistEntry> =
  [];

export interface HostedEventSchemaQualificationInput {
  hostedSailingId?: string;
  isIndexable: boolean;
  isSynthetic?: boolean;
  lifecycleStatus: HostedSailingLifecycleStatus;
  isExpired: boolean;
  experienceClassification: HostedExperienceClassification;
  primaryTheme: HostedCruiseThemeSlug;
  sailingTitle: string;
  announcedHostedProgramming: string | null;
  typicalHostedProgramming?: string | null;
  startDateIso: string;
  endDateIso: string | null;
  embarkLocationName: string;
  organizerName: string;
  officialOrganizerUrl: string;
  officialSailingPageUrl: string;
  verifiedStartingPriceUsd: number | null;
  visiblePriceDisplayed: boolean;
  approvedReviewCount: number;
  averageRating: number | null;
  visibleRatingDisplayed: boolean;
}

export interface HostedEventSchemaQualificationResult {
  qualifiesForEventSchema: boolean;
  primarySchemaType: "Event" | "WebPage";
  includeOffers: boolean;
  includeAggregateRating: boolean;
  explicitlyAllowlisted: boolean;
  disqualificationReason: string | null;
  policyNote: string;
}

export function qualifiesHostedDepartureForEventSchema(
  input: HostedEventSchemaQualificationInput,
  allowlist: ReadonlyArray<HostedEventSchemaManualAllowlistEntry> = EXPLICIT_HOSTED_EVENT_SCHEMA_ALLOWLIST,
): HostedEventSchemaQualificationResult {
  const allowEntry = input.hostedSailingId
    ? allowlist.find((entry) => entry.hostedSailingId === input.hostedSailingId) ?? null
    : null;

  const hasCompleteManualEvidence = Boolean(
    allowEntry &&
      allowEntry.approvedBy.trim().length >= 2 &&
      /^\d{4}-\d{2}-\d{2}/.test(allowEntry.approvedAtIso) &&
      allowEntry.publicEventQualificationEvidence.trim().length >= 30 &&
      allowEntry.physicalLocationPolicyEvidence.trim().length >= 30 &&
      allowEntry.visibleContentParityVerified === true &&
      allowEntry.richResultsTestAloneInsufficientAcknowledged === true,
  );

  if (!allowEntry || !hasCompleteManualEvidence) {
    return {
      qualifiesForEventSchema: false,
      primarySchemaType: "WebPage",
      includeOffers: false,
      includeAggregateRating: false,
      explicitlyAllowlisted: false,
      disqualificationReason: !allowEntry
        ? "Hosted departure is not on EXPLICIT_HOSTED_EVENT_SCHEMA_ALLOWLIST; automatic Event markup from programming keywords is disabled."
        : "Allowlist entry lacks complete manual public-event, physical-location, or visible-parity evidence (Rich Results Test validation alone is insufficient).",
      policyNote:
        "Emit WebPage + BreadcrumbList with truthful Organization and Place relationships; keep Offer, price, availability, Review, and AggregateRating disabled.",
    };
  }

  if (!input.isIndexable || input.isSynthetic) {
    return {
      qualifiesForEventSchema: false,
      primarySchemaType: "WebPage",
      includeOffers: false,
      includeAggregateRating: false,
      explicitlyAllowlisted: true,
      disqualificationReason: "Sailing is non-indexable or synthetic.",
      policyNote:
        "Emit WebPage + BreadcrumbList only; non-indexable/held departures do not emit Event markup.",
    };
  }

  if (input.lifecycleStatus !== "upcoming" || input.isExpired) {
    return {
      qualifiesForEventSchema: false,
      primarySchemaType: "WebPage",
      includeOffers: false,
      includeAggregateRating: false,
      explicitlyAllowlisted: true,
      disqualificationReason: "Sailing is completed, expired, or cancelled.",
      policyNote:
        "Emit WebPage + BreadcrumbList only; past or cancelled departures are not represented as active upcoming Events.",
    };
  }

  const validDates =
    /^\d{4}-\d{2}-\d{2}$/.test(input.startDateIso) &&
    (!input.endDateIso ||
      (/^\d{4}-\d{2}-\d{2}$/.test(input.endDateIso) &&
        input.endDateIso >= input.startDateIso));
  const validLocationAndOrg =
    input.embarkLocationName.trim().length >= 2 &&
    !/^see official itinerary$/i.test(input.embarkLocationName.trim()) &&
    input.organizerName.trim().length >= 2 &&
    input.officialOrganizerUrl.startsWith("https://");

  if (!validDates || !validLocationAndOrg) {
    return {
      qualifiesForEventSchema: false,
      primarySchemaType: "WebPage",
      includeOffers: false,
      includeAggregateRating: false,
      explicitlyAllowlisted: true,
      disqualificationReason:
        "Missing verified ISO start/end dates, physical embarkation port, or official organizer URL.",
      policyNote:
        "Google Event structured data requires visible, verified startDate, physical location, and organizer.",
    };
  }

  const programmingText = (input.announcedHostedProgramming || "").trim();
  const isGenericTripCopy =
    programmingText.length < 35 ||
    GENERIC_VACATION_PACKAGE_ONLY_PATTERN.test(programmingText);
  const hasSpecificEventProgramming =
    !isGenericTripCopy && GENUINE_EVENT_PROGRAMMING_PATTERN.test(programmingText);

  if (!hasSpecificEventProgramming) {
    return {
      qualifiesForEventSchema: false,
      primarySchemaType: "WebPage",
      includeOffers: false,
      includeAggregateRating: false,
      explicitlyAllowlisted: true,
      disqualificationReason:
        "Departure describes an ordinary cruise vacation or generic group block without specific named festival, concert, conference, workshop, or themed event programming.",
      policyNote:
        "Per Google Event guidelines, ordinary trip/vacation packages must not be marked up as Event; emit WebPage + BreadcrumbList instead.",
    };
  }

  const includeOffers =
    allowEntry.allowOffersMarkup === true &&
    typeof input.verifiedStartingPriceUsd === "number" &&
    Number.isFinite(input.verifiedStartingPriceUsd) &&
    input.verifiedStartingPriceUsd > 0 &&
    input.visiblePriceDisplayed &&
    input.officialSailingPageUrl.startsWith("https://");

  const includeAggregateRating =
    allowEntry.allowAggregateRatingMarkup === true &&
    input.approvedReviewCount > 0 &&
    typeof input.averageRating === "number" &&
    Number.isFinite(input.averageRating) &&
    input.averageRating >= 1 &&
    input.averageRating <= 5 &&
    input.visibleRatingDisplayed;

  return {
    qualifiesForEventSchema: true,
    primarySchemaType: "Event",
    includeOffers,
    includeAggregateRating,
    explicitlyAllowlisted: true,
    disqualificationReason: null,
    policyNote:
      "Explicitly allowlisted with manual public-event, location, and visible-parity evidence. Rich Results Test validation alone is never sufficient; rich results are never promised.",
  };
}

export interface HostedFranchiseEventSeriesQualificationInput {
  franchiseId?: string;
  isStandaloneIndexable: boolean;
  isSynthetic?: boolean;
  franchiseName: string;
  programmingAndLineupModel: string | null;
  officialWebsiteUrl: string;
  qualifyingUpcomingEventCount: number;
  approvedReviewCount: number;
  averageRating: number | null;
  visibleRatingDisplayed: boolean;
}

export interface HostedFranchiseEventSeriesQualificationResult {
  qualifiesForEventSeriesSchema: boolean;
  primarySchemaType: "EventSeries" | "CollectionPage";
  includeAggregateRating: boolean;
  explicitlyAllowlisted: boolean;
  disqualificationReason: string | null;
  vocabularyNote: string;
}

export function qualifiesFranchiseForEventSeriesSchema(
  input: HostedFranchiseEventSeriesQualificationInput,
  allowlist: ReadonlyArray<HostedFranchiseEventSeriesManualAllowlistEntry> = EXPLICIT_FRANCHISE_EVENT_SERIES_ALLOWLIST,
): HostedFranchiseEventSeriesQualificationResult {
  const allowEntry = input.franchiseId
    ? allowlist.find((entry) => entry.franchiseId === input.franchiseId) ?? null
    : null;

  const hasManualSeriesEvidence = Boolean(
    allowEntry &&
      allowEntry.approvedBy.trim().length >= 2 &&
      /^\d{4}-\d{2}-\d{2}/.test(allowEntry.approvedAtIso) &&
      allowEntry.manualSeriesPolicyEvidence.trim().length >= 30 &&
      allowEntry.visibleContentParityVerified === true &&
      allowEntry.richResultsTestAloneInsufficientAcknowledged === true,
  );

  if (!allowEntry || !hasManualSeriesEvidence) {
    return {
      qualifiesForEventSeriesSchema: false,
      primarySchemaType: "CollectionPage",
      includeAggregateRating: false,
      explicitlyAllowlisted: false,
      disqualificationReason:
        "Franchise is not on EXPLICIT_FRANCHISE_EVENT_SERIES_ALLOWLIST; emit CollectionPage + BreadcrumbList by default.",
      vocabularyNote:
        "Emit CollectionPage + BreadcrumbList by default; preserve Franchise, Producer, and HostedDeparture relationships in DCC's canonical graph and machine contracts.",
    };
  }

  const progText = (input.programmingAndLineupModel || "").trim();
  const hasEventProgramming =
    progText.length >= 35 &&
    !GENERIC_VACATION_PACKAGE_ONLY_PATTERN.test(progText) &&
    GENUINE_EVENT_PROGRAMMING_PATTERN.test(progText);

  if (
    !input.isStandaloneIndexable ||
    input.isSynthetic ||
    input.qualifyingUpcomingEventCount < 1 ||
    !hasEventProgramming ||
    !input.officialWebsiteUrl.startsWith("https://")
  ) {
    return {
      qualifiesForEventSeriesSchema: false,
      primarySchemaType: "CollectionPage",
      includeAggregateRating: false,
      explicitlyAllowlisted: true,
      disqualificationReason: !input.isStandaloneIndexable
        ? "Franchise is 1:1 flagship or non-indexable."
        : input.qualifyingUpcomingEventCount < 1
          ? "Franchise has no upcoming edition qualifying as an allowlisted scheduled Event."
          : "Franchise describes general group travel rather than a recurring programmed festival/conference series.",
      vocabularyNote:
        "Emit CollectionPage + BreadcrumbList; EventSeries requires both explicit manual allowlisting and at least one allowlisted upcoming Event.",
    };
  }

  const includeAggregateRating =
    allowEntry.allowAggregateRatingMarkup === true &&
    input.approvedReviewCount > 0 &&
    typeof input.averageRating === "number" &&
    Number.isFinite(input.averageRating) &&
    input.averageRating >= 1 &&
    input.averageRating <= 5 &&
    input.visibleRatingDisplayed;

  return {
    qualifiesForEventSeriesSchema: true,
    primarySchemaType: "EventSeries",
    includeAggregateRating,
    explicitlyAllowlisted: true,
    disqualificationReason: null,
    vocabularyNote:
      "Schema.org EventSeries entity semantics only (explicitly allowlisted; separate from Google rich-result eligibility; rich results are never promised).",
  };
}
