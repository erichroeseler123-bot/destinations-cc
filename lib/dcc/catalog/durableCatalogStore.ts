import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { DCC_VIATOR_PRODUCT_MAPPINGS } from "@/lib/viator/mappings";
import { getWidgetPlacementReport } from "./widgetPlacements";
import {
  deduplicatePickupExceptionsForReviewDesk,
  enrichTourRecordFromViatorProductDetailAndLocations,
  extractViatorLocationRefsFromProductDetail,
  normalizeCatalogBatchPickupAndMeeting,
  normalizeCatalogTourPickupAndMeeting,
  queueCatalogPickupExceptionsToReviewDesk,
  type CatalogPickupExceptionCode,
  type CatalogPickupExceptionRecord,
} from "./pickupNormalizer";

export {
  deduplicatePickupExceptionsForReviewDesk,
  enrichTourRecordFromViatorProductDetailAndLocations,
  extractViatorLocationRefsFromProductDetail,
  normalizeCatalogBatchPickupAndMeeting,
  normalizeCatalogTourPickupAndMeeting,
  queueCatalogPickupExceptionsToReviewDesk,
  type CatalogPickupExceptionCode,
  type CatalogPickupExceptionRecord,
};

export type TourCapabilityTier =
  | "discovery_only"
  | "attributable_referral"
  | "live_check_referral"
  | "live_check_direct"
  | "api_booking";

export type LocationPrecision = "exact" | "approximate" | "unknown";

export type PickupLocationRecord = {
  ref?: string;
  name: string;
  address?: string | null;
  lat: number | null;
  lng: number | null;
  precision: LocationPrecision;
  pickupType?: "HOTEL" | "CRUISE_PORT" | "MEETING_POINT" | "AIRPORT" | "OTHER";
};

export type TourAgeBandRecord = {
  ageBand: "ADULT" | "CHILD" | "INFANT" | "YOUTH" | "SENIOR" | "TRAVELER";
  startAge: number;
  endAge: number;
  minTravelersPerBooking?: number;
  maxTravelersPerBooking?: number;
};

export type PriceBasis = "per_person" | "flat_rate_per_vehicle" | "per_group" | "unknown";

export type PickupFulfillmentType =
  | "pier_pickup"
  | "hotel_pickup"
  | "downtown_shuttle_departure"
  | "self_drive"
  | "walkable_from_pier"
  | "unknown";

export type TransferTimeSource =
  | "verified_pier_pickup"
  | "verified_meeting_point"
  | "planning_estimate"
  | "unknown";

export type TourProductOptionRecord = {
  optionCode: string;
  title: string;
  description: string | null;
  includesPickup: boolean | null;
  pickupFulfillmentType?: PickupFulfillmentType;
  meetingPointName?: string | null;
  meetingPointLat?: number | null;
  meetingPointLng?: number | null;
  transferBeforeMinutes?: number | null;
  transferAfterMinutes?: number | null;
  transferTimeSource?: TransferTimeSource;
  transferEvidenceSource?: string | null;
  applicableBerthOrMeetingPoint?: string | null;
  planningEstimateTransferMinutes?: number | null;
  durationMinutes: number | null;
  fromPriceCents: number | null;
  priceBasis: PriceBasis;
  scheduledStartTimes: string[];
};

export type TourConstraintsRecord = {
  maxPassengerWeightLbs?: number | null;
  combinedWeightThresholdLbs?: number | null;
  maxPassengers?: number | null;
  wheelchairAccessible?: boolean | null;
  minAgeYears?: number | null;
  physicalDifficulty?: "EASY" | "MODERATE" | "CHALLENGING" | "UNKNOWN" | null;
  cruiseBufferBeforeMinutes?: number | null;
  cruiseBufferAfterMinutes?: number | null;
  transferTimeSource?: TransferTimeSource;
  transferEvidenceSource?: string | null;
  applicableBerthOrMeetingPoint?: string | null;
  planningEstimateTransferMinutes?: number | null;
  weatherDependent?: boolean | null;
  requiresClosedToeShoes?: boolean | null;
};

export type ChannelOffer = {
  channelId:
    | "viator"
    | "fareharbor"
    | "operator_direct"
    | "welcometoneworleanstours"
    | "welcometotheswamp"
    | "juneau-flight-deck"
    | "cruisepromenade"
    | "hotel_concierge"
    | "dcc"
    | "gosno"
    | "partyatredrocks";
  provider: "viator" | "fareharbor" | "operator_direct" | "gosno" | "parr";
  providerProductCode: string;
  capabilityTier: TourCapabilityTier;
  commissionAuthorized: boolean;
  fromPriceCents: number | null;
  priceBasis?: PriceBasis;
  currency: string;
  freeCancellation: boolean | null;
  cancellationCutoffHours: number | null;
  cancellationSummary: string | null;
  inclusions: string[];
  exclusions: string[];
  bookingUrl: string;
  defaultCampaign?: string;
};

export type TourProvenanceRecord = {
  sourceSystem: string;
  sourceEndpoint: string;
  fetchedAt: string;
  modifiedSinceCursor?: string | null;
  lastScheduleRefreshAt?: string | null;
  contentSha256: string;
  rawFieldsVerified: {
    durationKnown: boolean;
    cancellationKnown: boolean;
    pickupKnown: boolean;
    meetingCoordinatesKnown: boolean;
    ageBandsKnown: boolean;
  };
};

export type DurableTourRecord = {
  tourId: string;
  compatibilityAliases: string[];
  destinationSlug: string;
  portSlug: string | null;
  earthosDestinationNodeId: string;
  timeZone: string;
  title: string;
  summary: string | null;
  category: string;
  tags: string[];
  primaryProvider: "viator" | "fareharbor" | "operator_direct" | "gosno" | "parr";
  providerProductCode: string;
  operatorName: string | null;
  operatorCode: string | null;
  capabilityTier: TourCapabilityTier;
  commissionAuthorized: boolean;
  /** Explicit null when unknown — NEVER default to 180 minutes */
  durationMinutes: number | null;
  durationRawText: string | null;
  fromPriceCents: number | null;
  priceBasis?: PriceBasis;
  currency: string;
  /** Explicit null when unknown — NEVER default to true */
  freeCancellation: boolean | null;
  cancellationPolicyType: "STANDARD" | "ALL_SALES_FINAL" | "CUSTOM" | "UNKNOWN" | null;
  cancellationCutoffHours: number | null;
  cancellationSummary: string | null;
  /** Explicit null when unknown */
  hasHotelPickup: boolean | null;
  /** True if the lowest-priced option includes hotel pickup; false if hotel pickup is an optional upgrade; null if unknown */
  lowestPriceIncludesPickup?: boolean | null;
  pickupFulfillmentType?: PickupFulfillmentType;
  pickupType:
    | "HOTEL_PICKUP"
    | "MEETING_POINT_ONLY"
    | "HOTEL_OR_MEETING_POINT"
    | "CRUISE_PIER_PICKUP"
    | "DOWNTOWN_SHUTTLE_DEPARTURE"
    | "UNKNOWN"
    | null;
  pickupSummary: string | null;
  meetingPointName: string | null;
  meetingPointAddress: string | null;
  /** Explicit null when unknown — NEVER substitute city center as a meeting point */
  meetingPointLat: number | null;
  meetingPointLng: number | null;
  locationPrecision: LocationPrecision;
  pickupLocations: PickupLocationRecord[];
  ageBands: TourAgeBandRecord[];
  constraints: TourConstraintsRecord;
  channelOffers: ChannelOffer[];
  productOptions?: TourProductOptionRecord[];
  serviceDetails?: Record<string, unknown>;
  inclusions: string[];
  exclusions: string[];
  primaryImageUrl: string | null;
  ratingAverage: number | null;
  reviewCount: number | null;
  bookingUrl: string;
  provenance: TourProvenanceRecord;
  quarantined?: boolean;
  quarantineReason?: string | null;
  retiredAt?: string | null;
  retirementReason?: string | null;
  active: boolean;
  lastVerifiedAt: string;
  updatedAt: string;
  createdAt: string;
};

/**
 * Acceptance fixtures, unsupported operator-direct listings, and deprecated hardcoded GoSno/PARR rows
 * that are strictly quarantined from the public catalog and matcher.
 */
export const QUARANTINED_TOUR_IDS = new Set<string>([
  "dcc:tour:nola:lafitte-custom-bayou-charter-unknowns",
  "dcc:tour:nola:preservation-hall-jazz-session",
  "dcc:tour:nola:steamboat-natchez-jazz-cruise",
  "dcc:tour:nola:cajun-encounters-honey-island-swamp",
  "dcc:tour:gosno:winter-park-express-shuttle",
  "dcc:tour:parr:red-rocks-amphitheatre-shuttle",
]);

export function isQuarantinedTourRecord(rec: Pick<DurableTourRecord, "tourId" | "quarantined">): boolean {
  if (rec.quarantined === true) return true;
  if (QUARANTINED_TOUR_IDS.has(rec.tourId)) return true;
  return false;
}

export type CatalogSyncRunRecord = {
  runId: string;
  provider: string;
  destinationSlug: string;
  status: "running" | "completed" | "failed";
  cursorValue: string | null;
  importedCount: number;
  updatedCount: number;
  rejectedCount: number;
  upstreamRequestCount: number;
  rejectionReasons: Record<string, number>;
  metadata: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
};

export type EarthOSDestinationNode = {
  destinationSlug: string;
  portSlug: string | null;
  displayName: string;
  region:
    | "gulf_coast"
    | "alaska"
    | "caribbean"
    | "us_mainland_ports"
    | "colorado_rockies"
    | "hawaii"
    | "iceland_north_atlantic";
  earthosDestinationNodeId: string;
  timeZone: string;
  viatorDestinationId: number;
  hubLat: number;
  hubLng: number;
  cruisePierName: string | null;
  cruisePierLat: number | null;
  cruisePierLng: number | null;
  specialistSites: string[];
};

export const EARTHOS_DESTINATION_NODES: Record<string, EarthOSDestinationNode> = {
  "new-orleans": {
    destinationSlug: "new-orleans",
    portSlug: "new-orleans",
    displayName: "New Orleans, Louisiana",
    region: "gulf_coast",
    earthosDestinationNodeId: "earthos:node:us-la-new-orleans",
    timeZone: "America/Chicago",
    viatorDestinationId: 675,
    hubLat: 29.9584,
    hubLng: -90.0644,
    cruisePierName: "Port of New Orleans Erato / Julia Street Cruise Terminal",
    cruisePierLat: 29.9392,
    cruisePierLng: -90.0611,
    specialistSites: ["welcometoneworleanstours", "welcometotheswamp", "dcc", "cruisepromenade"],
  },
  juneau: {
    destinationSlug: "juneau",
    portSlug: "juneau",
    displayName: "Juneau, Alaska",
    region: "alaska",
    earthosDestinationNodeId: "earthos:node:us-ak-juneau",
    timeZone: "America/Juneau",
    viatorDestinationId: 941,
    hubLat: 58.3019,
    hubLng: -134.4197,
    cruisePierName: "Juneau Cruise Ship Terminal / AJ Dock",
    cruisePierLat: 58.2995,
    cruisePierLng: -134.4068,
    specialistSites: ["juneau-flight-deck", "last-frontier-shore-excursions", "dcc", "cruisepromenade"],
  },
  skagway: {
    destinationSlug: "skagway",
    portSlug: "skagway",
    displayName: "Skagway, Alaska",
    region: "alaska",
    earthosDestinationNodeId: "earthos:node:us-ak-skagway",
    timeZone: "America/Juneau",
    viatorDestinationId: 943,
    hubLat: 59.4583,
    hubLng: -135.3139,
    cruisePierName: "Skagway Railroad / Broadway / Ore Dock",
    cruisePierLat: 59.4508,
    cruisePierLng: -135.3186,
    specialistSites: ["last-frontier-shore-excursions", "dcc", "cruisepromenade"],
  },
  ketchikan: {
    destinationSlug: "ketchikan",
    portSlug: "ketchikan",
    displayName: "Ketchikan, Alaska",
    region: "alaska",
    earthosDestinationNodeId: "earthos:node:us-ak-ketchikan",
    timeZone: "America/Sitka",
    viatorDestinationId: 942,
    hubLat: 55.3422,
    hubLng: -131.6461,
    cruisePierName: "Ketchikan Downtown Berths 1-4 / Ward Cove",
    cruisePierLat: 55.3418,
    cruisePierLng: -131.6475,
    specialistSites: ["last-frontier-shore-excursions", "dcc", "cruisepromenade"],
  },
  seward: {
    destinationSlug: "seward",
    portSlug: "seward",
    displayName: "Seward, Alaska",
    region: "alaska",
    earthosDestinationNodeId: "earthos:node:us-ak-seward",
    timeZone: "America/Anchorage",
    viatorDestinationId: 4368,
    hubLat: 60.1042,
    hubLng: -149.4422,
    cruisePierName: "Seward Cruise Ship Terminal",
    cruisePierLat: 60.1245,
    cruisePierLng: -149.4337,
    specialistSites: ["last-frontier-shore-excursions", "dcc", "cruisepromenade"],
  },
  denali: {
    destinationSlug: "denali",
    portSlug: null,
    displayName: "Denali National Park, Alaska",
    region: "alaska",
    earthosDestinationNodeId: "earthos:node:us-ak-denali",
    timeZone: "America/Anchorage",
    viatorDestinationId: 22364,
    hubLat: 63.7305,
    hubLng: -148.9144,
    cruisePierName: null,
    cruisePierLat: null,
    cruisePierLng: null,
    specialistSites: ["last-frontier-shore-excursions", "dcc"],
  },
  cozumel: {
    destinationSlug: "cozumel",
    portSlug: "cozumel",
    displayName: "Cozumel, Mexico",
    region: "caribbean",
    earthosDestinationNodeId: "earthos:node:mx-roo-cozumel",
    timeZone: "America/Cancun",
    viatorDestinationId: 632,
    hubLat: 20.5083,
    hubLng: -86.9458,
    cruisePierName: "Puerta Maya / International Pier / Punta Langosta",
    cruisePierLat: 20.4764,
    cruisePierLng: -86.9739,
    specialistSites: ["dcc", "cruisepromenade"],
  },
  roatan: {
    destinationSlug: "roatan",
    portSlug: "roatan",
    displayName: "Roatan, Honduras",
    region: "caribbean",
    earthosDestinationNodeId: "earthos:node:hn-ib-roatan",
    timeZone: "America/Tegucigalpa",
    viatorDestinationId: 4132,
    hubLat: 16.3298,
    hubLng: -86.5300,
    cruisePierName: "Port of Roatan Coxen Hole / Mahogany Bay",
    cruisePierLat: 16.3168,
    cruisePierLng: -86.5367,
    specialistSites: ["dcc", "cruisepromenade"],
  },
  nassau: {
    destinationSlug: "nassau",
    portSlug: "nassau",
    displayName: "Nassau, Bahamas",
    region: "caribbean",
    earthosDestinationNodeId: "earthos:node:bs-np-nassau",
    timeZone: "America/Nassau",
    viatorDestinationId: 420,
    hubLat: 25.0782,
    hubLng: -77.3431,
    cruisePierName: "Nassau Cruise Port (Prince George Wharf)",
    cruisePierLat: 25.0805,
    cruisePierLng: -77.3408,
    specialistSites: ["dcc", "cruisepromenade"],
  },
  "st-thomas": {
    destinationSlug: "st-thomas",
    portSlug: "st-thomas",
    displayName: "St. Thomas, US Virgin Islands",
    region: "caribbean",
    earthosDestinationNodeId: "earthos:node:vi-st-thomas",
    timeZone: "America/St_Thomas",
    viatorDestinationId: 965,
    hubLat: 18.3381,
    hubLng: -64.9312,
    cruisePierName: "Havensight (WICO) / Crown Bay Cruise Dock",
    cruisePierLat: 18.3323,
    cruisePierLng: -64.9207,
    specialistSites: ["dcc", "cruisepromenade"],
  },
  "grand-cayman": {
    destinationSlug: "grand-cayman",
    portSlug: "grand-cayman",
    displayName: "Grand Cayman, Cayman Islands",
    region: "caribbean",
    earthosDestinationNodeId: "earthos:node:ky-grand-cayman",
    timeZone: "America/Cayman",
    viatorDestinationId: 31,
    hubLat: 19.2952,
    hubLng: -81.3831,
    cruisePierName: "George Town Royal Watler Tender Terminal",
    cruisePierLat: 19.2952,
    cruisePierLng: -81.3831,
    specialistSites: ["dcc", "cruisepromenade"],
  },
  miami: {
    destinationSlug: "miami",
    portSlug: "miami",
    displayName: "Miami, Florida",
    region: "us_mainland_ports",
    earthosDestinationNodeId: "earthos:node:us-fl-miami",
    timeZone: "America/New_York",
    viatorDestinationId: 662,
    hubLat: 25.7617,
    hubLng: -80.1918,
    cruisePierName: "PortMiami Cruise Terminals",
    cruisePierLat: 25.7781,
    cruisePierLng: -80.1704,
    specialistSites: ["dcc", "cruisepromenade"],
  },
  seattle: {
    destinationSlug: "seattle",
    portSlug: "seattle",
    displayName: "Seattle, Washington",
    region: "us_mainland_ports",
    earthosDestinationNodeId: "earthos:node:us-wa-seattle",
    timeZone: "America/Los_Angeles",
    viatorDestinationId: 704,
    hubLat: 47.6062,
    hubLng: -122.3321,
    cruisePierName: "Bell Street Pier 66 / Smith Cove Pier 91",
    cruisePierLat: 47.6122,
    cruisePierLng: -122.3516,
    specialistSites: ["dcc", "cruisepromenade"],
  },
  tampa: {
    destinationSlug: "tampa",
    portSlug: "tampa",
    displayName: "Tampa, Florida",
    region: "us_mainland_ports",
    earthosDestinationNodeId: "earthos:node:us-fl-tampa",
    timeZone: "America/New_York",
    viatorDestinationId: 666,
    hubLat: 27.9506,
    hubLng: -82.4572,
    cruisePierName: "Port Tampa Bay Channelside Terminals 2, 3 & 6",
    cruisePierLat: 27.9438,
    cruisePierLng: -82.4452,
    specialistSites: ["dcc", "cruisepromenade"],
  },
  "denver-colorado": {
    destinationSlug: "denver-colorado",
    portSlug: null,
    displayName: "Denver, Red Rocks & Colorado Mountain Corridor",
    region: "colorado_rockies",
    earthosDestinationNodeId: "earthos:node:us-co-denver",
    timeZone: "America/Denver",
    viatorDestinationId: 4837,
    hubLat: 39.7527,
    hubLng: -105.0002,
    cruisePierName: null,
    cruisePierLat: null,
    cruisePierLng: null,
    specialistSites: ["gosno", "partyatredrocks", "dcc"],
  },
  kahului: {
    destinationSlug: "kahului",
    portSlug: "kahului",
    displayName: "Kahului (Maui), Hawaiʻi",
    region: "hawaii",
    earthosDestinationNodeId: "earthos:node:us-hi-kahului",
    timeZone: "Pacific/Honolulu",
    viatorDestinationId: 671,
    hubLat: 20.8947,
    hubLng: -156.47,
    cruisePierName: "Kahului Harbor Cruise Terminal (Pier 1 / Pier 2)",
    cruisePierLat: 20.8947,
    cruisePierLng: -156.47,
    specialistSites: ["dcc", "cruisepromenade"],
  },
  reykjavik: {
    destinationSlug: "reykjavik",
    portSlug: "reykjavik",
    displayName: "Reykjavík, Iceland",
    region: "iceland_north_atlantic",
    earthosDestinationNodeId: "earthos:node:is-1-reykjavik",
    timeZone: "Atlantic/Reykjavik",
    viatorDestinationId: 905,
    hubLat: 64.1466,
    hubLng: -21.9426,
    cruisePierName: "Faxaflóahafnir — Skarfabakki (312/313) & Miðbakki Cruise Terminals",
    cruisePierLat: 64.1558,
    cruisePierLng: -21.8697,
    specialistSites: ["dcc", "cruisepromenade"],
  },
};

export function resolveEarthOSDestinationNode(slugOrName: string): EarthOSDestinationNode | null {
  const norm = slugOrName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (EARTHOS_DESTINATION_NODES[norm]) {
    return EARTHOS_DESTINATION_NODES[norm];
  }
  const aliases: Record<string, string> = {
    nola: "new-orleans",
    "new-orleans-la": "new-orleans",
    "port-of-new-orleans": "new-orleans",
    "juneau-ak": "juneau",
    "skagway-ak": "skagway",
    "ketchikan-ak": "ketchikan",
    "seward-ak": "seward",
    "denali-national-park": "denali",
    "cozumel-mexico": "cozumel",
    "roatan-honduras": "roatan",
    "isla-roatan": "roatan",
    "nassau-bahamas": "nassau",
    "st-thomas-usvi": "st-thomas",
    "charlotte-amalie": "st-thomas",
    "grand-cayman-cayman-islands": "grand-cayman",
    "george-town": "grand-cayman",
    "miami-fl": "miami",
    "port-miami": "miami",
    "seattle-wa": "seattle",
    "tampa-fl": "tampa",
    denver: "denver-colorado",
    "winter-park": "denver-colorado",
    "red-rocks": "denver-colorado",
    colorado: "denver-colorado",
    maui: "kahului",
    "kahului-maui": "kahului",
    "kahului-harbor": "kahului",
    "maalaea-harbor": "kahului",
    maalaea: "kahului",
    "reykjavik-iceland": "reykjavik",
    skarfabakki: "reykjavik",
    midbakki: "reykjavik",
    rek: "reykjavik",
  };
  const mapped = aliases[norm];
  return mapped ? EARTHOS_DESTINATION_NODES[mapped] || null : null;
}

export function getCompatibilityAliasesForViatorCode(viatorCode: string): string[] {
  const codeNorm = viatorCode.trim().toUpperCase();
  const matched = DCC_VIATOR_PRODUCT_MAPPINGS.filter(
    (m) => m.viatorCode.trim().toUpperCase() === codeNorm,
  ).map((m) => m.internalId);
  return Array.from(new Set([codeNorm, ...matched]));
}

const SNAPSHOT_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "catalog",
  "universal-tour-catalog.snapshot.json",
);

export type UniversalCatalogSnapshotFile = {
  schemaVersion: "dcc_universal_tour_catalog_v1";
  generatedAt: string;
  records: DurableTourRecord[];
  syncRuns: CatalogSyncRunRecord[];
};

let memoryCatalogCache: DurableTourRecord[] | null = null;
let memorySyncRunsCache: CatalogSyncRunRecord[] | null = null;
let pgSchemaReadyPromise: Promise<void> | null = null;
let pgSchemaReadyForUrl: string | null = null;
let pgHydratedFromSnapshot = false;

function isAutomatedTestRuntime(): boolean {
  if (process.env.NODE_ENV === "test") return true;
  if (process.env.DCC_DISABLE_PG_SYNC_IN_TESTS === "1") return true;
  if (Array.isArray(process.execArgv) && process.execArgv.some((arg) => arg.includes("--test"))) {
    return true;
  }
  if (Array.isArray(process.argv) && process.argv.some((arg) => arg === "--test" || arg.endsWith(".test.ts"))) {
    return true;
  }
  return false;
}

function shouldUsePostgres(): boolean {
  if (isAutomatedTestRuntime() && process.env.DCC_ENABLE_PG_SYNC_IN_TESTS !== "1") {
    return false;
  }
  const url = String(process.env.DATABASE_URL || "").trim();
  return Boolean(url && !url.includes("[SENSITIVE]"));
}

function getSqlClient() {
  const url = String(process.env.DATABASE_URL || "").trim();
  if (!url || url.includes("[SENSITIVE]")) {
    throw new Error("DATABASE_URL is not configured or is redacted.");
  }
  return neon(url);
}

export async function ensureCatalogSchema(): Promise<void> {
  if (!shouldUsePostgres()) return;
  const currentUrl = String(process.env.DATABASE_URL || "").trim();
  if (!pgSchemaReadyPromise || pgSchemaReadyForUrl !== currentUrl) {
    pgSchemaReadyForUrl = currentUrl;
    pgSchemaReadyPromise = (async () => {
      const sql = getSqlClient();
      const existingCheck = await sql.query(
        `SELECT to_regclass('public.dcc_tour_catalog') AS t_catalog,
                to_regclass('public.dcc_catalog_sync_runs') AS t_runs,
                to_regclass('public.dcc_catalog_refresh_checkpoints') AS t_ckpts`,
      );
      if (
        existingCheck.length > 0 &&
        existingCheck[0].t_catalog &&
        existingCheck[0].t_runs &&
        existingCheck[0].t_ckpts
      ) {
        return;
      }
      await sql.query(`
        CREATE TABLE IF NOT EXISTS dcc_tour_catalog (
          tour_id TEXT PRIMARY KEY,
          compatibility_aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
          destination_slug TEXT NOT NULL,
          port_slug TEXT,
          earthos_destination_node_id TEXT NOT NULL,
          time_zone TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT,
          category TEXT NOT NULL,
          tags JSONB NOT NULL DEFAULT '[]'::jsonb,
          primary_provider TEXT NOT NULL,
          provider_product_code TEXT NOT NULL,
          operator_name TEXT,
          operator_code TEXT,
          capability_tier TEXT NOT NULL,
          commission_authorized BOOLEAN NOT NULL DEFAULT false,
          duration_minutes INTEGER,
          duration_raw_text TEXT,
          from_price_cents INTEGER,
          price_basis TEXT NOT NULL DEFAULT 'per_person',
          currency TEXT NOT NULL DEFAULT 'USD',
          free_cancellation BOOLEAN,
          cancellation_policy_type TEXT,
          cancellation_cutoff_hours INTEGER,
          cancellation_summary TEXT,
          has_hotel_pickup BOOLEAN,
          lowest_price_includes_pickup BOOLEAN,
          pickup_type TEXT,
          pickup_summary TEXT,
          meeting_point_name TEXT,
          meeting_point_address TEXT,
          meeting_point_lat DOUBLE PRECISION,
          meeting_point_lng DOUBLE PRECISION,
          location_precision TEXT NOT NULL DEFAULT 'unknown',
          pickup_locations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
          age_bands_json JSONB NOT NULL DEFAULT '[]'::jsonb,
          constraints_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          channel_offers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
          product_options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
          service_details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          inclusions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
          exclusions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
          primary_image_url TEXT,
          rating_average DOUBLE PRECISION,
          review_count INTEGER,
          booking_url TEXT NOT NULL,
          provenance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          quarantined BOOLEAN NOT NULL DEFAULT false,
          quarantine_reason TEXT,
          active BOOLEAN NOT NULL DEFAULT true,
          last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await sql.query(`ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS price_basis TEXT NOT NULL DEFAULT 'per_person'`);
      await sql.query(`ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS lowest_price_includes_pickup BOOLEAN`);
      await sql.query(`ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS product_options_json JSONB NOT NULL DEFAULT '[]'::jsonb`);
      await sql.query(`ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS service_details_json JSONB NOT NULL DEFAULT '{}'::jsonb`);
      await sql.query(`ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS quarantined BOOLEAN NOT NULL DEFAULT false`);
      await sql.query(`ALTER TABLE dcc_tour_catalog ADD COLUMN IF NOT EXISTS quarantine_reason TEXT`);
      await sql.query(
        `CREATE INDEX IF NOT EXISTS dcc_tour_catalog_destination_slug_idx ON dcc_tour_catalog (destination_slug)`,
      );
      await sql.query(`CREATE INDEX IF NOT EXISTS dcc_tour_catalog_port_slug_idx ON dcc_tour_catalog (port_slug)`);
      await sql.query(
        `CREATE INDEX IF NOT EXISTS dcc_tour_catalog_provider_idx ON dcc_tour_catalog (primary_provider, provider_product_code)`,
      );
      await sql.query(
        `CREATE INDEX IF NOT EXISTS dcc_tour_catalog_capability_tier_idx ON dcc_tour_catalog (capability_tier)`,
      );
      await sql.query(
        `CREATE INDEX IF NOT EXISTS dcc_tour_catalog_earthos_node_idx ON dcc_tour_catalog (earthos_destination_node_id)`,
      );
      await sql.query(`
        CREATE TABLE IF NOT EXISTS dcc_catalog_sync_runs (
          run_id TEXT PRIMARY KEY,
          provider TEXT NOT NULL,
          destination_slug TEXT NOT NULL,
          status TEXT NOT NULL,
          cursor_value TEXT,
          imported_count INTEGER NOT NULL DEFAULT 0,
          updated_count INTEGER NOT NULL DEFAULT 0,
          rejected_count INTEGER NOT NULL DEFAULT 0,
          upstream_request_count INTEGER NOT NULL DEFAULT 0,
          rejection_reasons_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          completed_at TIMESTAMPTZ
        )
      `);
      await sql.query(
        `CREATE INDEX IF NOT EXISTS dcc_catalog_sync_runs_provider_dest_idx ON dcc_catalog_sync_runs (provider, destination_slug)`,
      );
      await sql.query(`
        CREATE TABLE IF NOT EXISTS dcc_catalog_refresh_checkpoints (
          stream_key TEXT PRIMARY KEY,
          provider TEXT NOT NULL,
          destination_slug TEXT,
          cursor_value TEXT,
          next_start_offset INTEGER,
          provider_total_count INTEGER,
          status TEXT NOT NULL DEFAULT 'idle',
          metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await sql.query(
        `CREATE INDEX IF NOT EXISTS dcc_catalog_refresh_checkpoints_provider_idx ON dcc_catalog_refresh_checkpoints (provider, destination_slug)`,
      );
    })().catch((err) => {
      pgSchemaReadyPromise = null;
      throw err;
    });
  }
  await pgSchemaReadyPromise;
}

export function readLocalCatalogSnapshot(): UniversalCatalogSnapshotFile {
  try {
    if (fs.existsSync(SNAPSHOT_FILE_PATH)) {
      const raw = fs.readFileSync(SNAPSHOT_FILE_PATH, "utf8");
      const parsed = JSON.parse(raw) as UniversalCatalogSnapshotFile;
      if (Array.isArray(parsed.records)) {
        return {
          schemaVersion: "dcc_universal_tour_catalog_v1",
          generatedAt: parsed.generatedAt || new Date().toISOString(),
          records: parsed.records,
          syncRuns: Array.isArray(parsed.syncRuns) ? parsed.syncRuns : [],
        };
      }
    }
  } catch (err) {
    console.warn("[durableCatalogStore] Failed to read local catalog snapshot:", err);
  }
  return {
    schemaVersion: "dcc_universal_tour_catalog_v1",
    generatedAt: new Date().toISOString(),
    records: [],
    syncRuns: [],
  };
}

export function writeLocalCatalogSnapshot(
  records: DurableTourRecord[],
  syncRuns: CatalogSyncRunRecord[],
): void {
  memoryCatalogCache = records;
  memorySyncRunsCache = syncRuns;
  try {
    fs.mkdirSync(path.dirname(SNAPSHOT_FILE_PATH), { recursive: true });
    const payload: UniversalCatalogSnapshotFile = {
      schemaVersion: "dcc_universal_tour_catalog_v1",
      generatedAt: new Date().toISOString(),
      records,
      syncRuns,
    };
    fs.writeFileSync(SNAPSHOT_FILE_PATH, JSON.stringify(payload, null, 2), "utf8");
  } catch (err) {
    // On read-only serverless filesystems, writing to disk may fail; Postgres + memory cache remain authoritative
  }
}

function mapPgRowToDurableTourRecord(row: Record<string, any>): DurableTourRecord {
  const tourId = String(row.tour_id);
  const quarantined = Boolean(row.quarantined) || QUARANTINED_TOUR_IDS.has(tourId);
  return {
    tourId,
    compatibilityAliases: Array.isArray(row.compatibility_aliases) ? row.compatibility_aliases : [],
    destinationSlug: String(row.destination_slug),
    portSlug: row.port_slug ? String(row.port_slug) : null,
    earthosDestinationNodeId: String(row.earthos_destination_node_id),
    timeZone: String(row.time_zone),
    title: String(row.title),
    summary: row.summary ? String(row.summary) : null,
    category: String(row.category),
    tags: Array.isArray(row.tags) ? row.tags : [],
    primaryProvider: row.primary_provider,
    providerProductCode: String(row.provider_product_code),
    operatorName: row.operator_name ? String(row.operator_name) : null,
    operatorCode: row.operator_code ? String(row.operator_code) : null,
    capabilityTier: row.capability_tier,
    commissionAuthorized: Boolean(row.commission_authorized),
    durationMinutes:
      typeof row.duration_minutes === "number" && Number.isFinite(row.duration_minutes)
        ? row.duration_minutes
        : null,
    durationRawText: row.duration_raw_text ? String(row.duration_raw_text) : null,
    fromPriceCents:
      typeof row.from_price_cents === "number" && Number.isFinite(row.from_price_cents)
        ? row.from_price_cents
        : null,
    priceBasis: (row.price_basis as PriceBasis) || "per_person",
    currency: String(row.currency || "USD"),
    freeCancellation: typeof row.free_cancellation === "boolean" ? row.free_cancellation : null,
    cancellationPolicyType: row.cancellation_policy_type || null,
    cancellationCutoffHours:
      typeof row.cancellation_cutoff_hours === "number" ? row.cancellation_cutoff_hours : null,
    cancellationSummary: row.cancellation_summary ? String(row.cancellation_summary) : null,
    hasHotelPickup: typeof row.has_hotel_pickup === "boolean" ? row.has_hotel_pickup : null,
    lowestPriceIncludesPickup:
      typeof row.lowest_price_includes_pickup === "boolean" ? row.lowest_price_includes_pickup : null,
    pickupFulfillmentType:
      (row.service_details_json &&
      typeof row.service_details_json === "object" &&
      typeof row.service_details_json.pickupFulfillmentType === "string"
        ? (row.service_details_json.pickupFulfillmentType as PickupFulfillmentType)
        : row.pickup_type === "CRUISE_PIER_PICKUP"
          ? "pier_pickup"
          : row.pickup_type === "DOWNTOWN_SHUTTLE_DEPARTURE"
            ? "downtown_shuttle_departure"
            : row.pickup_type === "HOTEL_PICKUP"
              ? "hotel_pickup"
              : row.pickup_type === "MEETING_POINT_ONLY"
                ? "self_drive"
                : undefined),
    pickupType: row.pickup_type || null,
    pickupSummary: row.pickup_summary ? String(row.pickup_summary) : null,
    meetingPointName: row.meeting_point_name ? String(row.meeting_point_name) : null,
    meetingPointAddress: row.meeting_point_address ? String(row.meeting_point_address) : null,
    meetingPointLat:
      typeof row.meeting_point_lat === "number" && Number.isFinite(row.meeting_point_lat)
        ? row.meeting_point_lat
        : null,
    meetingPointLng:
      typeof row.meeting_point_lng === "number" && Number.isFinite(row.meeting_point_lng)
        ? row.meeting_point_lng
        : null,
    locationPrecision: (row.location_precision as LocationPrecision) || "unknown",
    pickupLocations: Array.isArray(row.pickup_locations_json) ? row.pickup_locations_json : [],
    ageBands: Array.isArray(row.age_bands_json) ? row.age_bands_json : [],
    constraints:
      row.constraints_json && typeof row.constraints_json === "object" ? row.constraints_json : {},
    channelOffers: Array.isArray(row.channel_offers_json) ? row.channel_offers_json : [],
    productOptions: Array.isArray(row.product_options_json) ? row.product_options_json : [],
    serviceDetails:
      row.service_details_json && typeof row.service_details_json === "object"
        ? row.service_details_json
        : {},
    inclusions: Array.isArray(row.inclusions_json) ? row.inclusions_json : [],
    exclusions: Array.isArray(row.exclusions_json) ? row.exclusions_json : [],
    primaryImageUrl: row.primary_image_url ? String(row.primary_image_url) : null,
    ratingAverage:
      typeof row.rating_average === "number" && Number.isFinite(row.rating_average)
        ? row.rating_average
        : null,
    reviewCount:
      typeof row.review_count === "number" && Number.isFinite(row.review_count)
        ? row.review_count
        : null,
    bookingUrl: String(row.booking_url),
    provenance:
      row.provenance_json && typeof row.provenance_json === "object"
        ? (row.provenance_json as TourProvenanceRecord)
        : {
            sourceSystem: row.primary_provider,
            sourceEndpoint: "db",
            fetchedAt: new Date().toISOString(),
            contentSha256: "",
            rawFieldsVerified: {
              durationKnown: row.duration_minutes !== null,
              cancellationKnown: row.free_cancellation !== null,
              pickupKnown: row.has_hotel_pickup !== null,
              meetingCoordinatesKnown: row.meeting_point_lat !== null,
              ageBandsKnown: Array.isArray(row.age_bands_json) && row.age_bands_json.length > 0,
            },
          },
    quarantined,
    quarantineReason: row.quarantine_reason ? String(row.quarantine_reason) : null,
    retiredAt:
      row.service_details_json && typeof row.service_details_json?.retiredAt === "string"
        ? row.service_details_json.retiredAt
        : null,
    retirementReason:
      row.service_details_json && typeof row.service_details_json?.retirementReason === "string"
        ? row.service_details_json.retirementReason
        : null,
    active: Boolean(row.active) && !quarantined,
    lastVerifiedAt: row.last_verified_at
      ? new Date(row.last_verified_at).toISOString()
      : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

async function upsertSingleTourToPg(sql: ReturnType<typeof getSqlClient>, record: DurableTourRecord): Promise<void> {
  const isQuarantined = isQuarantinedTourRecord(record);
  await sql`
    INSERT INTO dcc_tour_catalog (
      tour_id, compatibility_aliases, destination_slug, port_slug,
      earthos_destination_node_id, time_zone, title, summary,
      category, tags, primary_provider, provider_product_code,
      operator_name, operator_code, capability_tier, commission_authorized,
      duration_minutes, duration_raw_text, from_price_cents, price_basis, currency,
      free_cancellation, cancellation_policy_type, cancellation_cutoff_hours, cancellation_summary,
      has_hotel_pickup, lowest_price_includes_pickup, pickup_type, pickup_summary,
      meeting_point_name, meeting_point_address, meeting_point_lat, meeting_point_lng,
      location_precision, pickup_locations_json, age_bands_json,
      constraints_json, channel_offers_json, product_options_json, service_details_json,
      inclusions_json, exclusions_json,
      primary_image_url, rating_average, review_count, booking_url,
      provenance_json, quarantined, quarantine_reason, active, last_verified_at, updated_at, created_at
    ) VALUES (
      ${record.tourId},
      ${JSON.stringify(record.compatibilityAliases)}::jsonb,
      ${record.destinationSlug},
      ${record.portSlug},
      ${record.earthosDestinationNodeId},
      ${record.timeZone},
      ${record.title},
      ${record.summary},
      ${record.category},
      ${JSON.stringify(record.tags)}::jsonb,
      ${record.primaryProvider},
      ${record.providerProductCode},
      ${record.operatorName},
      ${record.operatorCode},
      ${record.capabilityTier},
      ${record.commissionAuthorized},
      ${record.durationMinutes},
      ${record.durationRawText},
      ${record.fromPriceCents},
      ${record.priceBasis || "per_person"},
      ${record.currency},
      ${record.freeCancellation},
      ${record.cancellationPolicyType},
      ${record.cancellationCutoffHours},
      ${record.cancellationSummary},
      ${record.hasHotelPickup},
      ${record.lowestPriceIncludesPickup ?? null},
      ${record.pickupType},
      ${record.pickupSummary},
      ${record.meetingPointName},
      ${record.meetingPointAddress},
      ${record.meetingPointLat},
      ${record.meetingPointLng},
      ${record.locationPrecision},
      ${JSON.stringify(record.pickupLocations)}::jsonb,
      ${JSON.stringify(record.ageBands)}::jsonb,
      ${JSON.stringify(record.constraints)}::jsonb,
      ${JSON.stringify(record.channelOffers)}::jsonb,
      ${JSON.stringify(record.productOptions || [])}::jsonb,
      ${JSON.stringify({
        ...(record.serviceDetails || {}),
        ...(record.pickupFulfillmentType ? { pickupFulfillmentType: record.pickupFulfillmentType } : {}),
        ...(record.retiredAt ? { retiredAt: record.retiredAt } : {}),
        ...(record.retirementReason ? { retirementReason: record.retirementReason } : {}),
      })}::jsonb,
      ${JSON.stringify(record.inclusions)}::jsonb,
      ${JSON.stringify(record.exclusions)}::jsonb,
      ${record.primaryImageUrl},
      ${record.ratingAverage},
      ${record.reviewCount},
      ${record.bookingUrl},
      ${JSON.stringify(record.provenance)}::jsonb,
      ${isQuarantined},
      ${record.quarantineReason || (isQuarantined ? "quarantined_fixture_or_unsupported_operator_listing" : null)},
      ${record.active && !isQuarantined},
      ${record.lastVerifiedAt}::timestamptz,
      ${record.updatedAt}::timestamptz,
      ${record.createdAt}::timestamptz
    )
    ON CONFLICT (tour_id) DO UPDATE SET
      compatibility_aliases = EXCLUDED.compatibility_aliases,
      destination_slug = EXCLUDED.destination_slug,
      port_slug = EXCLUDED.port_slug,
      earthos_destination_node_id = EXCLUDED.earthos_destination_node_id,
      time_zone = EXCLUDED.time_zone,
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      category = EXCLUDED.category,
      tags = EXCLUDED.tags,
      primary_provider = EXCLUDED.primary_provider,
      provider_product_code = EXCLUDED.provider_product_code,
      operator_name = EXCLUDED.operator_name,
      operator_code = EXCLUDED.operator_code,
      capability_tier = EXCLUDED.capability_tier,
      commission_authorized = EXCLUDED.commission_authorized,
      duration_minutes = EXCLUDED.duration_minutes,
      duration_raw_text = EXCLUDED.duration_raw_text,
      from_price_cents = EXCLUDED.from_price_cents,
      price_basis = EXCLUDED.price_basis,
      currency = EXCLUDED.currency,
      free_cancellation = EXCLUDED.free_cancellation,
      cancellation_policy_type = EXCLUDED.cancellation_policy_type,
      cancellation_cutoff_hours = EXCLUDED.cancellation_cutoff_hours,
      cancellation_summary = EXCLUDED.cancellation_summary,
      has_hotel_pickup = EXCLUDED.has_hotel_pickup,
      lowest_price_includes_pickup = EXCLUDED.lowest_price_includes_pickup,
      pickup_type = EXCLUDED.pickup_type,
      pickup_summary = EXCLUDED.pickup_summary,
      meeting_point_name = EXCLUDED.meeting_point_name,
      meeting_point_address = EXCLUDED.meeting_point_address,
      meeting_point_lat = EXCLUDED.meeting_point_lat,
      meeting_point_lng = EXCLUDED.meeting_point_lng,
      location_precision = EXCLUDED.location_precision,
      pickup_locations_json = EXCLUDED.pickup_locations_json,
      age_bands_json = EXCLUDED.age_bands_json,
      constraints_json = EXCLUDED.constraints_json,
      channel_offers_json = EXCLUDED.channel_offers_json,
      product_options_json = EXCLUDED.product_options_json,
      service_details_json = EXCLUDED.service_details_json,
      inclusions_json = EXCLUDED.inclusions_json,
      exclusions_json = EXCLUDED.exclusions_json,
      primary_image_url = EXCLUDED.primary_image_url,
      rating_average = EXCLUDED.rating_average,
      review_count = EXCLUDED.review_count,
      booking_url = EXCLUDED.booking_url,
      provenance_json = EXCLUDED.provenance_json,
      quarantined = EXCLUDED.quarantined,
      quarantine_reason = EXCLUDED.quarantine_reason,
      active = EXCLUDED.active,
      last_verified_at = EXCLUDED.last_verified_at,
      updated_at = now()
  `;
}

export async function upsertDurableTourRecords(records: DurableTourRecord[]): Promise<{
  upsertedCount: number;
  persistedToPostgres: boolean;
}> {
  const snapshot = readLocalCatalogSnapshot();
  const byId = new Map<string, DurableTourRecord>(
    snapshot.records.filter((r) => !isQuarantinedTourRecord(r)).map((r) => [r.tourId, r]),
  );
  const recordsToPersistInPg: DurableTourRecord[] = [];
  for (const rec of records) {
    if (isQuarantinedTourRecord(rec)) {
      byId.delete(rec.tourId);
    } else {
      const existing = byId.get(rec.tourId);
      const effectiveTourId =
        existing &&
        existing.destinationSlug !== rec.destinationSlug &&
        rec.primaryProvider === "viator"
          ? `viator:${rec.destinationSlug}:${rec.providerProductCode}`
          : rec.tourId;
      const targetExisting = byId.get(effectiveTourId);
      const recordWithId: DurableTourRecord =
        effectiveTourId !== rec.tourId ? { ...rec, tourId: effectiveTourId } : rec;

      if (
        targetExisting &&
        (!recordWithId.productOptions || recordWithId.productOptions.length === 0) &&
        targetExisting.productOptions &&
        targetExisting.productOptions.length > 0
      ) {
        byId.set(effectiveTourId, {
          ...recordWithId,
          productOptions: targetExisting.productOptions,
          lowestPriceIncludesPickup:
            recordWithId.lowestPriceIncludesPickup ?? targetExisting.lowestPriceIncludesPickup,
          hasHotelPickup: recordWithId.hasHotelPickup ?? targetExisting.hasHotelPickup,
          ageBands:
            recordWithId.ageBands && recordWithId.ageBands.length > 0
              ? recordWithId.ageBands
              : targetExisting.ageBands,
        });
      } else {
        byId.set(effectiveTourId, recordWithId);
      }
      recordsToPersistInPg.push(byId.get(effectiveTourId) || recordWithId);
    }
  }
  const merged = Array.from(byId.values());
  writeLocalCatalogSnapshot(merged, snapshot.syncRuns);

  let persistedToPostgres = false;
  if (shouldUsePostgres()) {
    try {
      await ensureCatalogSchema();
      const sql = getSqlClient();
      const quarantinedArray = Array.from(QUARANTINED_TOUR_IDS);
      if (quarantinedArray.length > 0) {
        await sql`
          UPDATE dcc_tour_catalog
          SET quarantined = true,
              quarantine_reason = COALESCE(quarantine_reason, 'quarantined_fixture_or_unsupported_operator_listing'),
              active = false,
              updated_at = now()
          WHERE tour_id = ANY(${quarantinedArray})
        `;
      }
      const batchSize = 25;
      for (let i = 0; i < recordsToPersistInPg.length; i += batchSize) {
        const chunk = recordsToPersistInPg.slice(i, i + batchSize);
        await Promise.all(chunk.map((rec) => upsertSingleTourToPg(sql, rec)));
      }
      persistedToPostgres = true;
    } catch (err) {
      console.error("[durableCatalogStore] Failed upserting tour records to Postgres:", err);
    }
  }

  return {
    upsertedCount: records.length,
    persistedToPostgres,
  };
}

export async function recordCatalogSyncRun(run: CatalogSyncRunRecord): Promise<void> {
  const snapshot = readLocalCatalogSnapshot();
  const byRunId = new Map<string, CatalogSyncRunRecord>(snapshot.syncRuns.map((r) => [r.runId, r]));
  byRunId.set(run.runId, run);
  writeLocalCatalogSnapshot(snapshot.records, Array.from(byRunId.values()));

  if (shouldUsePostgres()) {
    try {
      await ensureCatalogSchema();
      const sql = getSqlClient();
      await sql`
        INSERT INTO dcc_catalog_sync_runs (
          run_id, provider, destination_slug, status, cursor_value,
          imported_count, updated_count, rejected_count, upstream_request_count,
          rejection_reasons_json, metadata_json, started_at, completed_at
        ) VALUES (
          ${run.runId},
          ${run.provider},
          ${run.destinationSlug},
          ${run.status},
          ${run.cursorValue},
          ${run.importedCount},
          ${run.updatedCount},
          ${run.rejectedCount},
          ${run.upstreamRequestCount},
          ${JSON.stringify(run.rejectionReasons)}::jsonb,
          ${JSON.stringify(run.metadata)}::jsonb,
          ${run.startedAt}::timestamptz,
          ${run.completedAt}::timestamptz
        )
        ON CONFLICT (run_id) DO UPDATE SET
          status = EXCLUDED.status,
          cursor_value = EXCLUDED.cursor_value,
          imported_count = EXCLUDED.imported_count,
          updated_count = EXCLUDED.updated_count,
          rejected_count = EXCLUDED.rejected_count,
          upstream_request_count = EXCLUDED.upstream_request_count,
          rejection_reasons_json = EXCLUDED.rejection_reasons_json,
          metadata_json = EXCLUDED.metadata_json,
          completed_at = EXCLUDED.completed_at
      `;
    } catch (err) {
      console.error("[durableCatalogStore] Failed recording sync run in Postgres:", err);
    }
  }
}

let memoryCatalogLoadedAt = 0;
let memoryCatalogSource: "postgres" | "snapshot_hydrated_to_postgres" | "local_snapshot" = "local_snapshot";
let pilotRecordsUpsertedToPg = false;

export const PILOT_VERIFIED_TOUR_RECORDS: DurableTourRecord[] = [
  {
    tourId: "dcc:tour:viator:15200P6",
    compatibilityAliases: [
      "15200P6",
      "viator:15200P6",
      "louisiana-tour-company-swamp-tour-hotel-pickup",
    ],
    destinationSlug: "new-orleans",
    portSlug: "new-orleans",
    earthosDestinationNodeId: "earthos:node:us-la-new-orleans",
    timeZone: "America/Chicago",
    title: "New Orleans Swamp Tour Boat Adventure with Transportation",
    summary:
      "Covered bayou swamp boat excursion through the Barataria Bayou with confirmed round-trip French Quarter & Downtown hotel shuttle pickup (including Hotel Monteleone, 214 Royal St — Viator pickup location LOC-6eKJ+or5y8o99Qw0C8xWyGAjWJk3qp08H7OnT0MLhOs=) and active 8.0% partner commission on Viator account P00306962 (mcid=42383).",
    category: "Swamp & Bayou",
    tags: [
      "swamp",
      "bayou",
      "alligators",
      "hotel-pickup",
      "hotel-monteleone",
      "barataria",
      "covered-boat",
      "viator",
    ],
    primaryProvider: "viator",
    providerProductCode: "15200P6",
    operatorName: "Louisiana Tour Company",
    operatorCode: "louisiana-tour-company",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 240,
    durationRawText:
      "4 hours door-to-door (approx. 1 hour 45 minutes on-water covered bayou boat tour + round-trip French Quarter/Downtown hotel shuttle)",
    fromPriceCents: 6000,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: true,
    lowestPriceIncludesPickup: true,
    pickupFulfillmentType: "hotel_pickup",
    pickupType: "HOTEL_PICKUP",
    pickupSummary:
      "Round-trip French Quarter & Downtown hotel shuttle pickup included in base price ($60.00/adult · $120.00 total for 2 adults, $0 booking fee). Confirmed Hotel Monteleone pickup at 214 Royal St (LOC-6eKJ+or5y8o99Qw0C8xWyGAjWJk3qp08H7OnT0MLhOs=).",
    meetingPointName:
      "Hotel Monteleone — Royal Street Main Entrance (214 Royal St, New Orleans, LA 70130)",
    meetingPointAddress: "214 Royal St, New Orleans, LA 70130",
    meetingPointLat: 29.954222,
    meetingPointLng: -90.06776,
    locationPrecision: "exact",
    pickupLocations: [
      {
        ref: "LOC-6eKJ+or5y8o99Qw0C8xWyGAjWJk3qp08H7OnT0MLhOs=",
        name: "Hotel Monteleone",
        address: "214 Royal St, New Orleans, LA 70130",
        lat: 29.954222,
        lng: -90.06776,
        precision: "exact",
        pickupType: "HOTEL",
      },
      {
        ref: "LOC-6eKJ+or5y8o99Qw0C8xWyDM3b0u2p7B8xWyGAjWJk3o=",
        name: "French Quarter / CBD Hotel Shuttle Zone",
        address: "French Quarter & Downtown New Orleans, LA",
        lat: 29.9546,
        lng: -90.068,
        precision: "exact",
        pickupType: "HOTEL",
      },
    ],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 13,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 15,
      },
      {
        ageBand: "CHILD",
        startAge: 4,
        endAge: 12,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 15,
      },
      {
        ageBand: "INFANT",
        startAge: 0,
        endAge: 3,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 15,
      },
    ],
    constraints: {
      wheelchairAccessible: false,
      minAgeYears: 0,
      physicalDifficulty: "EASY",
      cruiseBufferBeforeMinutes: 75,
      cruiseBufferAfterMinutes: 45,
      transferTimeSource: "verified_meeting_point",
      transferEvidenceSource:
        "viator_pickup_location_loc_monteleone_214_royal_st:15200P6",
      applicableBerthOrMeetingPoint:
        "Hotel Monteleone (214 Royal St, French Quarter — Viator Pickup Ref LOC-6eKJ+or5y8o99Qw0C8xWyGAjWJk3qp08H7OnT0MLhOs=) <-> Barataria Bayou Covered Boat Dock (round-trip shuttle included)",
      planningEstimateTransferMinutes: 30,
      weatherDependent: true,
      requiresClosedToeShoes: false,
    },
    channelOffers: [
      {
        channelId: "hotel_concierge",
        provider: "viator",
        providerProductCode: "15200P6",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 6000,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "Guided covered bayou swamp boat tour ($60.00/adult)",
          "Round-trip French Quarter & Downtown hotel shuttle pickup (including Hotel Monteleone, 214 Royal St)",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Boat-Adventure-With-Pickup/d675-15200P6?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-new-orleans-15200p6&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
      {
        channelId: "welcometoneworleanstours",
        provider: "viator",
        providerProductCode: "15200P6",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 6000,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "Guided covered bayou swamp boat tour ($60.00/adult)",
          "Round-trip French Quarter & Downtown hotel shuttle pickup (including Hotel Monteleone, 214 Royal St)",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Boat-Adventure-With-Pickup/d675-15200P6?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=wno-swamp-tours-15200p6&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
      {
        channelId: "dcc",
        provider: "viator",
        providerProductCode: "15200P6",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 6000,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "Guided covered bayou swamp boat tour ($60.00/adult)",
          "Round-trip French Quarter & Downtown hotel shuttle pickup (including Hotel Monteleone, 214 Royal St)",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Boat-Adventure-With-Pickup/d675-15200P6?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-new-orleans-15200p6&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
    ],
    productOptions: [
      {
        optionCode: "TG10",
        title: "9:40am Tour (Hotel Pickup 8:00am–8:30am)",
        description:
          "Hotel pickup begins at 8:00am (pickup window 8:00am–8:30am at Hotel Monteleone, 214 Royal St, and participating French Quarter/CBD hotels). Round-trip shuttle included.",
        includesPickup: true,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName:
          "Hotel Monteleone — Royal Street Main Entrance (214 Royal St, New Orleans, LA 70130)",
        meetingPointLat: 29.954222,
        meetingPointLng: -90.06776,
        transferBeforeMinutes: 75,
        transferAfterMinutes: 45,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource:
          "viator_pickup_location_loc_monteleone_214_royal_st:15200P6",
        applicableBerthOrMeetingPoint:
          "Hotel Monteleone (214 Royal St, French Quarter — Pickup 8:00am–8:30am) <-> Barataria Bayou Dock (round-trip return shuttle included)",
        planningEstimateTransferMinutes: 30,
        durationMinutes: 240,
        fromPriceCents: 6000,
        priceBasis: "per_person",
        scheduledStartTimes: ["08:00"],
      },
      {
        optionCode: "TG9",
        title: "12:10pm Tour (Hotel Pickup 10:20am–10:50am)",
        description:
          "Hotel pickup begins at 10:20am (pickup window 10:20am–10:50am at Hotel Monteleone, 214 Royal St, and participating French Quarter/CBD hotels). Round-trip shuttle included.",
        includesPickup: true,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName:
          "Hotel Monteleone — Royal Street Main Entrance (214 Royal St, New Orleans, LA 70130)",
        meetingPointLat: 29.954222,
        meetingPointLng: -90.06776,
        transferBeforeMinutes: 75,
        transferAfterMinutes: 45,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource:
          "viator_pickup_location_loc_monteleone_214_royal_st:15200P6",
        applicableBerthOrMeetingPoint:
          "Hotel Monteleone (214 Royal St, French Quarter — Pickup 10:20am–10:50am) <-> Barataria Bayou Dock (round-trip return shuttle included)",
        planningEstimateTransferMinutes: 30,
        durationMinutes: 240,
        fromPriceCents: 6000,
        priceBasis: "per_person",
        scheduledStartTimes: ["10:20"],
      },
      {
        optionCode: "TG3",
        title: "2:10pm Tour (Hotel Pickup 12:30pm–1:00pm)",
        description:
          "Hotel pickup begins at 12:30pm (pickup window 12:30pm–1:00pm at Hotel Monteleone, 214 Royal St, and participating French Quarter/CBD hotels). Round-trip shuttle included.",
        includesPickup: true,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName:
          "Hotel Monteleone — Royal Street Main Entrance (214 Royal St, New Orleans, LA 70130)",
        meetingPointLat: 29.954222,
        meetingPointLng: -90.06776,
        transferBeforeMinutes: 75,
        transferAfterMinutes: 45,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource:
          "viator_pickup_location_loc_monteleone_214_royal_st:15200P6",
        applicableBerthOrMeetingPoint:
          "Hotel Monteleone (214 Royal St, French Quarter — Pickup 12:30pm–1:00pm) <-> Barataria Bayou Dock (round-trip return shuttle included)",
        planningEstimateTransferMinutes: 30,
        durationMinutes: 240,
        fromPriceCents: 6000,
        priceBasis: "per_person",
        scheduledStartTimes: ["12:30"],
      },
      {
        optionCode: "TG11",
        title: "4:15pm Tour (Hotel Pickup 3:00pm–3:30pm)",
        description:
          "Hotel pickup begins at 3:00pm (pickup window 3:00pm–3:30pm at Hotel Monteleone, 214 Royal St, and participating French Quarter/CBD hotels). Round-trip shuttle included.",
        includesPickup: true,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName:
          "Hotel Monteleone — Royal Street Main Entrance (214 Royal St, New Orleans, LA 70130)",
        meetingPointLat: 29.954222,
        meetingPointLng: -90.06776,
        transferBeforeMinutes: 75,
        transferAfterMinutes: 45,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource:
          "viator_pickup_location_loc_monteleone_214_royal_st:15200P6",
        applicableBerthOrMeetingPoint:
          "Hotel Monteleone (214 Royal St, French Quarter — Pickup 3:00pm–3:30pm) <-> Barataria Bayou Dock (round-trip return shuttle included)",
        planningEstimateTransferMinutes: 30,
        durationMinutes: 240,
        fromPriceCents: 6000,
        priceBasis: "per_person",
        scheduledStartTimes: ["15:00"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "hotel_pickup",
      viatorProductCode: "15200P6",
      viatorPartnerPid: "P00306962",
      viatorMcid: "42383",
      commissionStatus: "active_verified_viator_partner",
      commissionRatePercent: 8.0,
      verifiedRetailPrice2AdultsUsd: 120.0,
      verifiedPartnerNet2AdultsUsd: 110.4,
      verifiedCommission2AdultsUsd: 9.6,
      hotelMonteleonePickupRef: "LOC-6eKJ+or5y8o99Qw0C8xWyGAjWJk3qp08H7OnT0MLhOs=",
    },
    inclusions: [
      "Guided covered swamp boat tour in the Barataria Bayou",
      "Round-trip hotel shuttle pickup at Hotel Monteleone (214 Royal St) and participating French Quarter/Downtown hotels",
    ],
    exclusions: ["Gratuities"],
    primaryImageUrl:
      "https://media.tacdn.com/media/attractions-splice-spp-674x446/07/38/c6/92.jpg",
    ratingAverage: 4.7,
    reviewCount: 731,
    bookingUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Boat-Adventure-With-Pickup/d675-15200P6?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-new-orleans-15200p6&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    provenance: {
      sourceSystem: "viator_partner_v2_live",
      sourceEndpoint: "https://api.viator.com/partner/availability/check",
      fetchedAt: "2026-11-06T10:27:43.000Z",
      contentSha256: "viator_15200p6_monteleone_payable_8pct_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-06T10:27:43.000Z",
    updatedAt: "2026-11-06T10:27:43.000Z",
    createdAt: "2026-11-06T10:27:43.000Z",
  },
  {
    tourId: "dcc:tour:fh:jeanlafitteswamptour:763318",
    compatibilityAliases: [
      "jeanlafitteswamptour:763318",
      "fh-jeanlafitte-swamp-tour-763318",
    ],
    destinationSlug: "new-orleans",
    portSlug: "new-orleans",
    earthosDestinationNodeId: "earthos:node:us-la-new-orleans",
    timeZone: "America/Chicago",
    title: "Jean Lafitte Swamp Tour (with Hotel Monteleone Shuttle Pickup)",
    summary:
      "Guided covered bayou boat excursion through the Jean Lafitte National Historical Park and Barataria Preserve with confirmed round-trip shuttle pickup at Hotel Monteleone (214 Royal St, French Quarter — FareHarbor pickup option #22056428). Direct FareHarbor ASN commission arrangement is currently pending operator activation.",
    category: "Swamp & Bayou",
    tags: [
      "swamp",
      "bayou",
      "alligators",
      "hotel-pickup",
      "hotel-monteleone",
      "barataria",
      "fareharbor",
    ],
    primaryProvider: "fareharbor",
    providerProductCode: "jeanlafitteswamptour:763318",
    operatorName: "Jean Lafitte Swamp Tours",
    operatorCode: "jeanlafitteswamptour",
    capabilityTier: "live_check_direct",
    commissionAuthorized: false,
    durationMinutes: 90,
    durationRawText:
      "1 hour 30 minutes on-water tour (approx. 3 hours total with round-trip French Quarter hotel shuttle)",
    fromPriceCents: 3200,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: true,
    lowestPriceIncludesPickup: false,
    pickupFulfillmentType: "hotel_pickup",
    pickupType: "HOTEL_OR_MEETING_POINT",
    pickupSummary:
      "Round-trip French Quarter hotel shuttle pickup at Hotel Monteleone (214 Royal St, New Orleans, LA 70130 — FareHarbor pickup option #22056428 'Hotel Monteleone', +$30/person; exact Royal St entrance vs adjacent French Quarter corner curb staging pending operator & hotel confirmation), or separate self-drive option at 6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072 ($32/adult).",
    meetingPointName:
      "Hotel Monteleone (214 Royal St, French Quarter — FareHarbor Pickup Option #22056428)",
    meetingPointAddress: "214 Royal St, New Orleans, LA 70130",
    meetingPointLat: 29.9542,
    meetingPointLng: -90.0681,
    locationPrecision: "exact",
    pickupLocations: [
      {
        ref: "fh_custom_field_12258400:22056428",
        name: "Hotel Monteleone (214 Royal St, French Quarter — FareHarbor Option #22056428)",
        address: "214 Royal St, New Orleans, LA 70130",
        lat: 29.9542,
        lng: -90.0681,
        precision: "exact",
        pickupType: "HOTEL",
      },
      {
        ref: "fh_dock:6601_leo_kerner",
        name: "Jean Lafitte Swamp Tour Dock (Barataria Preserve — Self-Drive Option Only)",
        address: "6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072",
        lat: 29.7495,
        lng: -90.1112,
        precision: "exact",
        pickupType: "MEETING_POINT",
      },
    ],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 13,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 30,
      },
      {
        ageBand: "CHILD",
        startAge: 4,
        endAge: 12,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 30,
      },
    ],
    constraints: {
      wheelchairAccessible: true,
      minAgeYears: 0,
      physicalDifficulty: "EASY",
      cruiseBufferBeforeMinutes: 45,
      cruiseBufferAfterMinutes: 45,
      transferTimeSource: "verified_meeting_point",
      transferEvidenceSource: "fareharbor_custom_field_12258400:hotel_monteleone_22056428",
      applicableBerthOrMeetingPoint:
        "Hotel Monteleone (214 Royal St, New Orleans, LA 70130 — FareHarbor Pickup Option #22056428)",
      planningEstimateTransferMinutes: 45,
      weatherDependent: true,
      requiresClosedToeShoes: false,
    },
    channelOffers: [
      {
        channelId: "hotel_concierge",
        provider: "fareharbor",
        providerProductCode: "jeanlafitteswamptour:763318",
        capabilityTier: "live_check_direct",
        commissionAuthorized: false,
        fromPriceCents: 6200,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "90-minute guided covered swamp boat tour ($32/adult)",
          "Round-trip hotel shuttle pickup at Hotel Monteleone (+$30/person)",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/?asn=aktourcenter&full-items=yes",
      },
      {
        channelId: "dcc",
        provider: "fareharbor",
        providerProductCode: "jeanlafitteswamptour:763318",
        capabilityTier: "live_check_direct",
        commissionAuthorized: false,
        fromPriceCents: 3200,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: ["90-minute guided covered swamp boat tour"],
        exclusions: ["Optional round-trip hotel shuttle (+$30/person)", "Gratuities"],
        bookingUrl:
          "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/?asn=aktourcenter&full-items=yes",
      },
    ],
    productOptions: [
      {
        optionCode: "WITH_HOTEL_PICKUP",
        title: "Swamp Boat Tour + Hotel Monteleone Round-Trip Shuttle ($32 Tour + $30 Shuttle)",
        description:
          "90-minute guided covered bayou boat tour ($32/adult) plus round-trip hotel shuttle pickup at Hotel Monteleone (214 Royal St, New Orleans, LA 70130; +$30/person via FareHarbor hotel pickup option #22056428).",
        includesPickup: true,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName:
          "Hotel Monteleone (214 Royal St, New Orleans, LA 70130 — FareHarbor Option #22056428)",
        meetingPointLat: 29.9542,
        meetingPointLng: -90.0681,
        transferBeforeMinutes: 45,
        transferAfterMinutes: 45,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource: "fareharbor_custom_field_12258400:hotel_monteleone_22056428",
        applicableBerthOrMeetingPoint:
          "Hotel Monteleone (214 Royal St, New Orleans, LA 70130 — FareHarbor Pickup Option #22056428)",
        planningEstimateTransferMinutes: 45,
        durationMinutes: 90,
        fromPriceCents: 6200,
        priceBasis: "per_person",
        scheduledStartTimes: ["10:00", "12:00"],
      },
      {
        optionCode: "SELF_DRIVE_6601",
        title: "Self-Drive / Meet on Site (6601 Leo Kerner Lafitte Pkwy)",
        description:
          "90-minute guided covered bayou boat tour ($32/adult) meeting directly at the Barataria Preserve dock at 6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072 (no hotel shuttle).",
        includesPickup: false,
        pickupFulfillmentType: "self_drive",
        meetingPointName:
          "Jean Lafitte Swamp Tour Dock (6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072)",
        meetingPointLat: 29.7495,
        meetingPointLng: -90.1112,
        transferBeforeMinutes: null,
        transferAfterMinutes: null,
        transferTimeSource: "planning_estimate",
        transferEvidenceSource: null,
        applicableBerthOrMeetingPoint:
          "Self-Drive to 6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072",
        planningEstimateTransferMinutes: 35,
        durationMinutes: 90,
        fromPriceCents: 3200,
        priceBasis: "per_person",
        scheduledStartTimes: ["10:00", "12:00"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "hotel_pickup",
      fareharborShortname: "jeanlafitteswamptour",
      fareharborItemPk: 763318,
      fareharborAsnPartner: "aktourcenter",
      fareharborIsAffiliateRulesApplied: false,
      commissionStatus: "pending_operator_asn_activation",
      fareharborHotelPickupCustomFieldId: 12258400,
      fareharborHotelMonteleoneOptionValue: "number:22056428",
      fareharborTransportationCountCustomFieldId: 12210745,
      onlineBookingFeeRate: 0.06,
      pickupAddressResolution: {
        hotelMonteleoneShuttleOptionAddress: "214 Royal St, New Orleans, LA 70130",
        fareHarborOptionId: 22056428,
        fareHarborOptionTitle: "Hotel Monteleone",
        selfDriveDockOptionAddress: "6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072",
        whyTwoAddressesAppearedInReports:
          "1) In the catalog record, the Hotel Monteleone shuttle option (214 Royal St, New Orleans, LA 70130) and the self-drive Barataria dock option (6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072) were previously concatenated into a single meetingPointAddress string; they are now strictly separated by option (WITH_HOTEL_PICKUP vs SELF_DRIVE_6601). 2) In narrative notes, 810 Toulouse St was cited as a French Quarter motorcoach corner staging stop because FareHarbor Option #22056428 is titled 'Hotel Monteleone' with blank description/booking_notes; exact boarding (214 Royal St main entrance vs adjacent French Quarter corner curb) must be confirmed in writing by Jean Lafitte Swamp Tours and Hotel Monteleone before live placement.",
      },
    },
    inclusions: [
      "90-minute guided covered swamp boat tour",
      "Optional round-trip hotel shuttle pickup at Hotel Monteleone (+$30/person)",
    ],
    exclusions: ["Gratuities"],
    primaryImageUrl: null,
    ratingAverage: 4.8,
    reviewCount: 940,
    bookingUrl:
      "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/?asn=aktourcenter&full-items=yes",
    provenance: {
      sourceSystem: "fareharbor_asn_live",
      sourceEndpoint:
        "https://fareharbor.com/api/v1/companies/jeanlafitteswamptour/items/763318/availabilities/date/2026-11-18/?asn=aktourcenter",
      fetchedAt: "2026-11-05T23:00:00.000Z",
      contentSha256: "fh_jeanlafitteswamptour_763318_monteleone_22056428",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-05T23:00:00.000Z",
    updatedAt: "2026-11-05T23:00:00.000Z",
    createdAt: "2026-11-05T23:00:00.000Z",
  },
  {
    tourId: "dcc:tour:viator:5199KSML",
    compatibilityAliases: [
      "5199KSML",
      "viator:5199KSML",
      "st-thomas-mangrove-lagoon-kayak-and-snorkel-5199ksml",
    ],
    destinationSlug: "st-thomas",
    portSlug: "st-thomas",
    earthosDestinationNodeId: "earthos:node:vi-st-thomas",
    timeZone: "America/St_Thomas",
    title: "St Thomas Mangrove Lagoon Kayak and Snorkel Tour in the US Virgin Islands",
    summary:
      "2-hour 30-minute (150-minute) guided mangrove kayak and coral reef snorkel tour in the St. Thomas Mangrove Lagoon Wildlife Sanctuary & Marine Reserve, meeting at Virgin Islands Ecotours Marina (6526 Estate Nadir, St. Thomas, VI 00802). Kept strictly separate from 5199P27 (the 3-hour Cas Cay Kayak, Hike & Snorkel Adventure).",
    category: "Water & Wildlife",
    tags: [
      "kayak",
      "snorkel",
      "mangrove-lagoon",
      "st-thomas",
      "vi-ecotours",
      "5199ksml",
      "self-drive",
    ],
    primaryProvider: "viator",
    providerProductCode: "5199KSML",
    operatorName: "Virgin Islands Ecotours",
    operatorCode: "virgin-islands-ecotours",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 150,
    durationRawText: "2 hours 30 minutes (150 minutes on-water kayak & snorkel; does not include Cas Cay island hike or pier transfer)",
    fromPriceCents: 8900,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: false,
    lowestPriceIncludesPickup: false,
    pickupFulfillmentType: "self_drive",
    pickupType: "MEETING_POINT_ONLY",
    pickupSummary:
      "Meet on site at Virgin Islands Ecotours Mangrove Lagoon Marina (6526 Estate Nadir, St. Thomas, VI 00802) 15 minutes before departure. Pier/hotel pickup is NOT included in 5199KSML (separate listing 5199PRTSTTKSML includes shore-excursion transportation).",
    meetingPointName: "Virgin Islands Ecotours Mangrove Lagoon Marina (6526 Estate Nadir)",
    meetingPointAddress: "6526 Estate Nadir, St. Thomas, VI 00802",
    meetingPointLat: 18.3168,
    meetingPointLng: -64.8781,
    locationPrecision: "exact",
    pickupLocations: [],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 13,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 16,
      },
      {
        ageBand: "CHILD",
        startAge: 6,
        endAge: 12,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 16,
      },
    ],
    constraints: {
      wheelchairAccessible: false,
      minAgeYears: 6,
      physicalDifficulty: "MODERATE",
      cruiseBufferBeforeMinutes: 40,
      cruiseBufferAfterMinutes: 60,
      transferTimeSource: "verified_meeting_point",
      transferEvidenceSource: "viecotours_estate_nadir_marina_meeting_point:5199KSML",
      applicableBerthOrMeetingPoint:
        "Virgin Islands Ecotours Marina (6526 Estate Nadir, St. Thomas, VI 00802 — ~20–25m taxi from WICO / ~35m taxi from Crown Bay)",
      planningEstimateTransferMinutes: 25,
      weatherDependent: true,
      requiresClosedToeShoes: false,
    },
    channelOffers: [
      {
        channelId: "dcc",
        provider: "viator",
        providerProductCode: "5199KSML",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 8900,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: ["2.5-hour guided mangrove kayak & coral reef snorkel", "Kayak, paddle, life vest, and snorkel gear"],
        exclusions: ["Cruise pier or hotel transportation (meet at 6526 Estate Nadir)", "Cas Cay island hike (see 5199P27)", "Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/St-Thomas/St-Thomas-Mangrove-Lagoon-Kayak-and-Snorkel-Tour/d965-5199KSML?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199ksml&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
    ],
    productOptions: [
      {
        optionCode: "5199KSML_DEFAULT",
        title: "St Thomas Mangrove Lagoon Kayak and Snorkel Tour (2h 30m • Meet at Estate Nadir Marina)",
        description:
          "150-minute guided kayak and snorkel in the Mangrove Lagoon Sanctuary ($89.00/person; meet at 6526 Estate Nadir).",
        includesPickup: false,
        pickupFulfillmentType: "self_drive",
        meetingPointName: "Virgin Islands Ecotours Mangrove Lagoon Marina (6526 Estate Nadir)",
        meetingPointLat: 18.3168,
        meetingPointLng: -64.8781,
        transferBeforeMinutes: 25,
        transferAfterMinutes: 25,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource: "viecotours_estate_nadir_marina_meeting_point:5199KSML",
        applicableBerthOrMeetingPoint: "Virgin Islands Ecotours Marina (6526 Estate Nadir, St. Thomas)",
        planningEstimateTransferMinutes: 25,
        durationMinutes: 150,
        fromPriceCents: 8900,
        priceBasis: "per_person",
        scheduledStartTimes: ["09:30", "13:00"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "self_drive",
      viatorProductCode: "5199KSML",
      distinctFromProductCode: "5199P27",
      includesCasCayHike: false,
    },
    inclusions: ["2.5-hour guided kayak and snorkel tour", "Snorkel gear and safety equipment"],
    exclusions: ["Round-trip taxi/shuttle to 6526 Estate Nadir", "Gratuities"],
    primaryImageUrl:
      "https://media.tacdn.com/media/attractions-splice-spp-674x446/0b/df/a8/1d.jpg",
    ratingAverage: 4.8,
    reviewCount: 412,
    bookingUrl:
      "https://www.viator.com/tours/St-Thomas/St-Thomas-Mangrove-Lagoon-Kayak-and-Snorkel-Tour/d965-5199KSML?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199ksml&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    provenance: {
      sourceSystem: "viator_partner_v2_live",
      sourceEndpoint: "https://api.viator.com/partner/products/5199KSML",
      fetchedAt: "2026-11-06T12:00:00.000Z",
      contentSha256: "viator_5199ksml_150m_89usd_estate_nadir_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-06T12:00:00.000Z",
    updatedAt: "2026-11-06T12:00:00.000Z",
    createdAt: "2026-11-06T12:00:00.000Z",
  },
  {
    tourId: "dcc:tour:viator:5199P27",
    compatibilityAliases: [
      "5199P27",
      "viator:5199P27",
      "cas-cay-kayak-hike-and-snorkel-5199p27",
    ],
    destinationSlug: "st-thomas",
    portSlug: "st-thomas",
    earthosDestinationNodeId: "earthos:node:vi-st-thomas",
    timeZone: "America/St_Thomas",
    title: "Cas Cay Kayak, Hike, and Snorkel Adventure in St. Thomas",
    summary:
      "3-hour (180-minute) guided mangrove kayak, Cas Cay deserted island hike (volcanic cliffs, tidal pool & marine blowhole), and coral reef snorkel adventure meeting at Virgin Islands Ecotours Marina (6526 Estate Nadir, St. Thomas, VI 00802). Kept strictly separate from 5199KSML (the 2.5-hour Kayak & Snorkel tour without the Cas Cay hike).",
    category: "Water & Wildlife",
    tags: [
      "kayak",
      "hike",
      "snorkel",
      "cas-cay",
      "mangrove-lagoon",
      "st-thomas",
      "vi-ecotours",
      "5199p27",
      "self-drive",
    ],
    primaryProvider: "viator",
    providerProductCode: "5199P27",
    operatorName: "Virgin Islands Ecotours",
    operatorCode: "virgin-islands-ecotours",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 180,
    durationRawText: "3 hours (180 minutes total for guided kayak, Cas Cay island hike, and mangrove reef snorkel; meet at 6526 Estate Nadir)",
    fromPriceCents: 9900,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: false,
    lowestPriceIncludesPickup: false,
    pickupFulfillmentType: "self_drive",
    pickupType: "MEETING_POINT_ONLY",
    pickupSummary:
      "Meet on site at Virgin Islands Ecotours Mangrove Lagoon Marina (6526 Estate Nadir, St. Thomas, VI 00802) 15 minutes before departure. Pier/hotel pickup is NOT included in base rate.",
    meetingPointName: "Virgin Islands Ecotours Mangrove Lagoon Marina (6526 Estate Nadir)",
    meetingPointAddress: "6526 Estate Nadir, St. Thomas, VI 00802",
    meetingPointLat: 18.3168,
    meetingPointLng: -64.8781,
    locationPrecision: "exact",
    pickupLocations: [],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 13,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 16,
      },
      {
        ageBand: "CHILD",
        startAge: 6,
        endAge: 12,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 16,
      },
    ],
    constraints: {
      wheelchairAccessible: false,
      minAgeYears: 6,
      physicalDifficulty: "MODERATE",
      cruiseBufferBeforeMinutes: 40,
      cruiseBufferAfterMinutes: 60,
      transferTimeSource: "verified_meeting_point",
      transferEvidenceSource: "viecotours_estate_nadir_marina_meeting_point:5199P27",
      applicableBerthOrMeetingPoint:
        "Virgin Islands Ecotours Marina (6526 Estate Nadir, St. Thomas, VI 00802 — ~20–25m taxi from WICO / ~35m taxi from Crown Bay)",
      planningEstimateTransferMinutes: 25,
      weatherDependent: true,
      requiresClosedToeShoes: false,
    },
    channelOffers: [
      {
        channelId: "dcc",
        provider: "viator",
        providerProductCode: "5199P27",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 9900,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "3-hour guided mangrove kayak, Cas Cay wildlife sanctuary hike & coral reef snorkel",
          "Kayak, paddle, life vest, snorkel gear, and bottled water",
        ],
        exclusions: ["Cruise pier or hotel transportation (meet at 6526 Estate Nadir)", "Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/St-Thomas/Cas-Cay-Kayak-Hike-and-Snorkel-in-St-Thomas/d965-5199P27?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199p27&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
    ],
    productOptions: [
      {
        optionCode: "5199P27_DEFAULT",
        title: "Cas Cay Kayak, Hike, and Snorkel Adventure (3h • Meet at Estate Nadir Marina)",
        description:
          "180-minute guided kayak, Cas Cay island hike, and mangrove reef snorkel ($99.00/person; meet at 6526 Estate Nadir).",
        includesPickup: false,
        pickupFulfillmentType: "self_drive",
        meetingPointName: "Virgin Islands Ecotours Mangrove Lagoon Marina (6526 Estate Nadir)",
        meetingPointLat: 18.3168,
        meetingPointLng: -64.8781,
        transferBeforeMinutes: 25,
        transferAfterMinutes: 25,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource: "viecotours_estate_nadir_marina_meeting_point:5199P27",
        applicableBerthOrMeetingPoint: "Virgin Islands Ecotours Marina (6526 Estate Nadir, St. Thomas)",
        planningEstimateTransferMinutes: 25,
        durationMinutes: 180,
        fromPriceCents: 9900,
        priceBasis: "per_person",
        scheduledStartTimes: ["09:00", "10:30", "13:30"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "self_drive",
      viatorProductCode: "5199P27",
      distinctFromProductCode: "5199KSML",
      includesCasCayHike: true,
    },
    inclusions: ["3-hour guided kayak, Cas Cay hike, and snorkel tour", "Snorkel gear and safety equipment"],
    exclusions: ["Round-trip taxi/shuttle to 6526 Estate Nadir", "Gratuities"],
    primaryImageUrl:
      "https://media.tacdn.com/media/attractions-splice-spp-674x446/07/36/f2/4b.jpg",
    ratingAverage: 4.9,
    reviewCount: 685,
    bookingUrl:
      "https://www.viator.com/tours/St-Thomas/Cas-Cay-Kayak-Hike-and-Snorkel-in-St-Thomas/d965-5199P27?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-5199p27&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    provenance: {
      sourceSystem: "viator_partner_v2_live",
      sourceEndpoint: "https://api.viator.com/partner/products/5199P27",
      fetchedAt: "2026-11-06T12:00:00.000Z",
      contentSha256: "viator_5199p27_180m_99usd_estate_nadir_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-06T12:00:00.000Z",
    updatedAt: "2026-11-06T12:00:00.000Z",
    createdAt: "2026-11-06T12:00:00.000Z",
  },
  {
    tourId: "dcc:tour:viator:254526P1",
    compatibilityAliases: [
      "254526P1",
      "viator:254526P1",
      "nassau-swimming-pigs-beach-club-254526p1",
    ],
    destinationSlug: "nassau",
    portSlug: "nassau",
    earthosDestinationNodeId: "earthos:node:bs-np-nassau",
    timeZone: "America/Nassau",
    title: "Nassau Swimming Pigs and Private Beach Club Escape",
    summary:
      "4-hour (240-minute) Bahamas speedboat and private Rose Island beach club excursion to meet the famous swimming pigs, with optional round-trip Nassau Cruise Port (Prince George Wharf) terminal shuttle pickup (Option TG4, $169.00/adult · $338.00 total for 2 adults) or self-transfer to Montague Foreshore Dock (Option TG8, $149.00/adult · $298.00 total for 2 adults).",
    category: "Water & Wildlife",
    tags: [
      "swimming-pigs",
      "rose-island",
      "beach-club",
      "nassau",
      "pier-pickup",
      "shore-excursion",
      "viator",
    ],
    primaryProvider: "viator",
    providerProductCode: "254526P1",
    operatorName: "Pieces of 8 Tours Bahamas",
    operatorCode: "pieces-of-8-bahamas",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 240,
    durationRawText: "4 hours (240 minutes) plus 15-minute Prince George Wharf terminal shuttle each way on Option TG4",
    fromPriceCents: 14900,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: true,
    lowestPriceIncludesPickup: false,
    pickupFulfillmentType: "pier_pickup",
    pickupType: "CRUISE_PIER_PICKUP",
    pickupSummary:
      "Option TG4 ($169.00/adult · $338.00 total for 2 adults) includes round-trip Nassau Cruise Port (Prince George Wharf Terminal Gate) shuttle pickup (15m transfer each way). Option TG8 ($149.00/adult · $298.00 total for 2 adults) meets directly at Montague Foreshore Marina.",
    meetingPointName: "Nassau Cruise Port — Prince George Wharf Excursion Terminal Gate",
    meetingPointAddress: "Woodes Rodgers Walk, Prince George Wharf, Nassau, Bahamas",
    meetingPointLat: 25.0805,
    meetingPointLng: -77.3408,
    locationPrecision: "exact",
    pickupLocations: [
      {
        ref: "nassau_prince_george_wharf_gate",
        name: "Nassau Cruise Port (Prince George Wharf Excursion Gate)",
        address: "Woodes Rodgers Walk, Nassau, Bahamas",
        lat: 25.0805,
        lng: -77.3408,
        precision: "exact",
        pickupType: "CRUISE_PORT",
      },
    ],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 12,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 15,
      },
      {
        ageBand: "CHILD",
        startAge: 4,
        endAge: 11,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 15,
      },
    ],
    constraints: {
      wheelchairAccessible: false,
      minAgeYears: 4,
      physicalDifficulty: "EASY",
      cruiseBufferBeforeMinutes: 15,
      cruiseBufferAfterMinutes: 15,
      transferTimeSource: "verified_pier_pickup",
      transferEvidenceSource: "verified_landmark_registry:nassau_prince_george_wharf_terminal_pickup:254526P1",
      applicableBerthOrMeetingPoint:
        "Nassau Cruise Port (Prince George Wharf Terminal Gate) <-> Montague Foreshore Marina (15m verified shuttle each way)",
      planningEstimateTransferMinutes: 15,
      weatherDependent: true,
      requiresClosedToeShoes: false,
    },
    channelOffers: [
      {
        channelId: "cruisepromenade",
        provider: "viator",
        providerProductCode: "254526P1",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 16900,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "4-hour Rose Island private beach club & swimming pigs interaction",
          "Round-trip Nassau Cruise Port (Prince George Wharf) shuttle on Option TG4",
          "Lunch & open bar at private beach club",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/Nassau/Pigs-cant-fly-but-they-do-swim/d420-254526P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=cp-nassau-254526p1&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
      {
        channelId: "dcc",
        provider: "viator",
        providerProductCode: "254526P1",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 16900,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "4-hour Rose Island private beach club & swimming pigs interaction",
          "Round-trip Nassau Cruise Port (Prince George Wharf) shuttle on Option TG4",
          "Lunch & open bar at private beach club",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/Nassau/Pigs-cant-fly-but-they-do-swim/d420-254526P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-nassau-254526p1&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
    ],
    productOptions: [
      {
        optionCode: "TG4",
        title: "Tour With Cruise Pier Pickup & Drop-Off (Prince George Wharf)",
        description:
          "4-hour Nassau Swimming Pigs & Rose Island Private Beach Club with round-trip shuttle pickup at Nassau Cruise Port (Prince George Wharf Terminal Gate; 15m transfer each way).",
        includesPickup: true,
        pickupFulfillmentType: "pier_pickup",
        meetingPointName: "Nassau Cruise Port — Prince George Wharf Excursion Terminal Gate",
        meetingPointLat: 25.0805,
        meetingPointLng: -77.3408,
        transferBeforeMinutes: 15,
        transferAfterMinutes: 15,
        transferTimeSource: "verified_pier_pickup",
        transferEvidenceSource: "verified_landmark_registry:nassau_prince_george_wharf_terminal_pickup:254526P1:TG4",
        applicableBerthOrMeetingPoint:
          "Nassau Cruise Port (Prince George Wharf Terminal Gate) <-> Montague Foreshore Boat Dock (15m shuttle each way)",
        planningEstimateTransferMinutes: 15,
        durationMinutes: 240,
        fromPriceCents: 16900,
        priceBasis: "per_person",
        scheduledStartTimes: ["10:00"],
      },
      {
        optionCode: "TG8",
        title: "Tour Without Pickup (Meet at Montague Foreshore Dock)",
        description:
          "4-hour Nassau Swimming Pigs & Rose Island Private Beach Club meeting directly at Montague Foreshore Marina (no pier shuttle included).",
        includesPickup: false,
        pickupFulfillmentType: "self_drive",
        meetingPointName: "Montague Foreshore Marina, Eastern Rd, Nassau, Bahamas",
        meetingPointLat: 25.0725,
        meetingPointLng: -77.3065,
        transferBeforeMinutes: null,
        transferAfterMinutes: null,
        transferTimeSource: "planning_estimate",
        transferEvidenceSource: null,
        applicableBerthOrMeetingPoint: "Self-transfer (~15–20m taxi) from Prince George Wharf to Montague Foreshore Marina",
        planningEstimateTransferMinutes: 20,
        durationMinutes: 240,
        fromPriceCents: 14900,
        priceBasis: "per_person",
        scheduledStartTimes: ["10:00"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "pier_pickup",
      viatorProductCode: "254526P1",
      verifiedPortSlug: "nassau",
    },
    inclusions: [
      "4-hour swimming pigs & private beach club experience",
      "Round-trip Nassau Cruise Port shuttle (Option TG4)",
    ],
    exclusions: ["Gratuities"],
    primaryImageUrl:
      "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/0b/df/a8/1d.jpg",
    ratingAverage: 4.8,
    reviewCount: 512,
    bookingUrl:
      "https://www.viator.com/tours/Nassau/Pigs-cant-fly-but-they-do-swim/d420-254526P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-nassau-254526p1&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    provenance: {
      sourceSystem: "viator_partner_v2_live",
      sourceEndpoint: "https://api.viator.com/partner/availability/check",
      fetchedAt: "2026-11-06T12:00:00.000Z",
      contentSha256: "viator_254526p1_nassau_tg4_pier_pickup_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-06T12:00:00.000Z",
    updatedAt: "2026-11-06T12:00:00.000Z",
    createdAt: "2026-11-06T12:00:00.000Z",
  },
  {
    tourId: "dcc:tour:viator:7452P2",
    compatibilityAliases: [
      "7452P2",
      "viator:7452P2",
      "st-thomas-turtle-cove-catamaran-snorkel-7452p2",
    ],
    destinationSlug: "st-thomas",
    portSlug: "st-thomas",
    earthosDestinationNodeId: "earthos:node:vi-st-thomas",
    timeZone: "America/St_Thomas",
    title: "Turtle Cove Catamaran Snorkel and Sail at Little Buck Island STT",
    summary:
      "3-hour (180-minute) sailing catamaran and green sea turtle snorkel excursion to Turtle Cove at Little Buck Island Wildlife Refuge, meeting at Marriott's Frenchman's Cove Dock (7338 Estate Bakkeroe, Charlotte Amalie, St. Thomas 00802). Requires 30-minute check-in before departure plus independent travel (taxi/safari) both ways from the guest's actual cruise berth (Havensight WICO ~15–20m or Crown Bay ~30–35m each way; $119.00/adult · $238.00 total for 2 adults).",
    category: "Water & Wildlife",
    tags: [
      "catamaran",
      "turtle-cove",
      "buck-island",
      "snorkel",
      "st-thomas",
      "frenchmans-cove",
      "meeting-point",
      "viator",
    ],
    primaryProvider: "viator",
    providerProductCode: "7452P2",
    operatorName: "The VI Cat",
    operatorCode: "the-vi-cat",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 180,
    durationRawText:
      "3 hours (180 minutes) plus 30-minute mandatory check-in at Marriott's Frenchman's Cove Dock and independent travel both ways from the guest's actual cruise berth (Havensight WICO ~15–20m or Crown Bay ~30–35m each way)",
    fromPriceCents: 11900,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: false,
    lowestPriceIncludesPickup: false,
    pickupFulfillmentType: "self_drive",
    pickupType: "MEETING_POINT_ONLY",
    pickupSummary:
      "Meet at Marriott's Frenchman's Cove Dock (7338 Estate Bakkeroe, Charlotte Amalie, St. Thomas 00802). Mandatory 30-minute check-in prior to departure (12:30 PM check-in for 1:00 PM sail) plus independent taxi/safari travel both ways from the guest's actual cruise berth (Havensight WICO ~15–20m or Crown Bay ~30–35m each way; $119.00/adult · $238.00 total for 2 adults).",
    meetingPointName: "Marriott's Frenchman's Cove Dock",
    meetingPointAddress: "7338 Estate Bakkeroe, Charlotte Amalie, St. Thomas 00802, USVI",
    meetingPointLat: 18.3228,
    meetingPointLng: -64.9219,
    locationPrecision: "exact",
    pickupLocations: [],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 13,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 15,
      },
      {
        ageBand: "CHILD",
        startAge: 4,
        endAge: 12,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 15,
      },
    ],
    constraints: {
      wheelchairAccessible: false,
      minAgeYears: 4,
      physicalDifficulty: "EASY",
      cruiseBufferBeforeMinutes: null,
      cruiseBufferAfterMinutes: null,
      transferTimeSource: "planning_estimate",
      transferEvidenceSource: null,
      applicableBerthOrMeetingPoint:
        "Meet at Marriott's Frenchman's Cove Dock (7338 Estate Bakkeroe) · 30m mandatory check-in + independent travel both ways from guest's actual cruise berth (Havensight WICO ~15–20m or Crown Bay ~30–35m taxi each way)",
      planningEstimateTransferMinutes: 55,
      weatherDependent: true,
      requiresClosedToeShoes: false,
    },
    channelOffers: [
      {
        channelId: "cruisepromenade",
        provider: "viator",
        providerProductCode: "7452P2",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 11900,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "3-hour Turtle Cove & Little Buck Island catamaran sail and snorkel",
          "Snorkel gear, rum punch, snacks, and instruction",
        ],
        exclusions: [
          "Independent taxi/safari transportation both ways between your cruise berth (Havensight WICO or Crown Bay) and Marriott's Frenchman's Cove Dock",
          "Gratuities",
        ],
        bookingUrl:
          "https://www.viator.com/tours/St-Thomas/St-Thomas-Catamaran-Sail-Buck-Island-National-Wildlife-Refuge/d965-7452P2?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=cp-st-thomas-7452p2&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
      {
        channelId: "dcc",
        provider: "viator",
        providerProductCode: "7452P2",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 11900,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "3-hour Turtle Cove & Little Buck Island catamaran sail and snorkel",
          "Snorkel gear, rum punch, snacks, and instruction",
        ],
        exclusions: [
          "Independent taxi/safari transportation both ways between your cruise berth (Havensight WICO or Crown Bay) and Marriott's Frenchman's Cove Dock",
          "Gratuities",
        ],
        bookingUrl:
          "https://www.viator.com/tours/St-Thomas/St-Thomas-Catamaran-Sail-Buck-Island-National-Wildlife-Refuge/d965-7452P2?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-7452p2&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
    ],
    productOptions: [
      {
        optionCode: "DEFAULT",
        title: "Turtle Cove Catamaran Snorkel & Sail (Meet at Marriott's Frenchman's Cove Dock · 30m Check-In + Independent Berth Travel)",
        description:
          "3-hour catamaran snorkel at Little Buck Island National Wildlife Refuge. Meet at Marriott's Frenchman's Cove Dock (7338 Estate Bakkeroe, Charlotte Amalie, St. Thomas 00802). Requires 30-minute check-in before departure plus independent travel both ways from your actual cruise berth (Havensight WICO ~15–20m or Crown Bay ~30–35m each way).",
        includesPickup: false,
        pickupFulfillmentType: "self_drive",
        meetingPointName: "Marriott's Frenchman's Cove Dock (7338 Estate Bakkeroe, Charlotte Amalie, St. Thomas 00802)",
        meetingPointLat: 18.3228,
        meetingPointLng: -64.9219,
        transferBeforeMinutes: null,
        transferAfterMinutes: null,
        transferTimeSource: "planning_estimate",
        transferEvidenceSource: null,
        applicableBerthOrMeetingPoint:
          "Meet at Marriott's Frenchman's Cove Dock (7338 Estate Bakkeroe) · 30m mandatory check-in + independent travel both ways from guest's actual cruise berth (Havensight WICO ~15–20m or Crown Bay ~30–35m taxi each way)",
        planningEstimateTransferMinutes: 55,
        durationMinutes: 180,
        fromPriceCents: 11900,
        priceBasis: "per_person",
        scheduledStartTimes: ["09:00", "13:00"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "self_drive",
      viatorProductCode: "7452P2",
      verifiedPortSlug: "st-thomas",
      checkInBeforeDepartureMinutes: 30,
      independentBerthTransferNote:
        "30-minute check-in at Marriott's Frenchman's Cove Dock plus independent travel both ways from guest's actual cruise berth (Havensight WICO ~15–20m or Crown Bay ~30–35m taxi each way).",
    },
    inclusions: [
      "3-hour catamaran sail and sea turtle snorkel at Little Buck Island",
      "Snorkel equipment, drinks & snacks",
    ],
    exclusions: [
      "Independent taxi/safari transportation both ways between your cruise berth (Havensight WICO or Crown Bay) and Marriott's Frenchman's Cove Dock",
      "Gratuities",
    ],
    primaryImageUrl:
      "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/07/36/f2/4b.jpg",
    ratingAverage: 4.8,
    reviewCount: 472,
    bookingUrl:
      "https://www.viator.com/tours/St-Thomas/St-Thomas-Catamaran-Sail-Buck-Island-National-Wildlife-Refuge/d965-7452P2?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-st-thomas-7452p2&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    provenance: {
      sourceSystem: "viator_partner_v2_live",
      sourceEndpoint: "https://api.viator.com/partner/availability/check",
      fetchedAt: "2026-11-06T16:30:00.000Z",
      contentSha256: "viator_7452p2_st_thomas_frenchmans_cove_meeting_point_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-06T16:30:00.000Z",
    updatedAt: "2026-11-06T16:30:00.000Z",
    createdAt: "2026-11-06T12:00:00.000Z",
  },
  {
    tourId: "dcc:tour:viator:5553274P1",
    compatibilityAliases: [
      "5553274P1",
      "viator:5553274P1",
      "cozumel-jade-caverns-atv-5553274p1",
    ],
    destinationSlug: "cozumel",
    portSlug: "cozumel",
    earthosDestinationNodeId: "earthos:node:mx-roo-cozumel",
    timeZone: "America/Cancun",
    title: "Jade Caverns and Mayan Village Cozumel ATV Tour",
    summary:
      "3.5-hour (210-minute) guided jungle ATV ride to the Jade Caverns cenote and El Cedral Mayan Village with verified cruise pier pickup at Puerta Maya, SSA International Pier, and Punta Langosta ($79.00/adult · $158.00 total for 2 adults).",
    category: "Adventure & Off-Road",
    tags: [
      "atv",
      "jade-caverns",
      "cenote",
      "cozumel",
      "pier-pickup",
      "viator",
    ],
    primaryProvider: "viator",
    providerProductCode: "5553274P1",
    operatorName: "Wild Tours Cozumel",
    operatorCode: "wild-tours-cozumel",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 210,
    durationRawText: "3 hours 30 minutes (210 minutes) plus 15-minute Cozumel cruise pier transfer each way",
    fromPriceCents: 7900,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: true,
    lowestPriceIncludesPickup: true,
    pickupFulfillmentType: "pier_pickup",
    pickupType: "CRUISE_PIER_PICKUP",
    pickupSummary:
      "Includes designated cruise pier pickup outside Puerta Maya, SSA International Pier, and Punta Langosta (15m transfer each way; $79.00/adult · $158.00 total for 2 adults).",
    meetingPointName: "Puerta Maya / SSA International Pier / Punta Langosta Excursion Zone",
    meetingPointAddress: "Costera Sur Km 4.5, Cozumel, Q.R., Mexico",
    meetingPointLat: 20.4764,
    meetingPointLng: -86.9739,
    locationPrecision: "exact",
    pickupLocations: [
      {
        ref: "cozumel_puerta_maya_international_pier",
        name: "Puerta Maya & SSA International Cruise Pier Gate",
        address: "Costera Sur Km 4.5, Cozumel, Q.R., Mexico",
        lat: 20.4764,
        lng: -86.9739,
        precision: "exact",
        pickupType: "CRUISE_PORT",
      },
    ],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 16,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 15,
      },
      {
        ageBand: "CHILD",
        startAge: 8,
        endAge: 15,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 15,
      },
    ],
    constraints: {
      wheelchairAccessible: false,
      minAgeYears: 8,
      physicalDifficulty: "MODERATE",
      cruiseBufferBeforeMinutes: 15,
      cruiseBufferAfterMinutes: 15,
      transferTimeSource: "verified_pier_pickup",
      transferEvidenceSource: "verified_landmark_registry:cozumel_puerta_maya_international_pier_pickup:5553274P1",
      applicableBerthOrMeetingPoint:
        "Puerta Maya / SSA International Pier / Punta Langosta Excursion Gate (15m verified transfer each way)",
      planningEstimateTransferMinutes: 15,
      weatherDependent: true,
      requiresClosedToeShoes: true,
    },
    channelOffers: [
      {
        channelId: "cruisepromenade",
        provider: "viator",
        providerProductCode: "5553274P1",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 7900,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "3.5-hour guided ATV adventure to Jade Caverns cenote & El Cedral",
          "Cruise pier pickup & drop-off (Puerta Maya / International Pier / Punta Langosta)",
          "Helmet, goggles, and bilingual guide",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/Cozumel/Cozumel-ATV-Tour-to-Jade-Caverns/d632-5553274P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=cp-cozumel-5553274p1&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
      {
        channelId: "dcc",
        provider: "viator",
        providerProductCode: "5553274P1",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 7900,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "3.5-hour guided ATV adventure to Jade Caverns cenote & El Cedral",
          "Cruise pier pickup & drop-off (Puerta Maya / International Pier / Punta Langosta)",
          "Helmet, goggles, and bilingual guide",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/Cozumel/Cozumel-ATV-Tour-to-Jade-Caverns/d632-5553274P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-cozumel-5553274p1&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
    ],
    productOptions: [
      {
        optionCode: "TG1",
        title: "Jade Caverns & Mayan Village ATV Tour with Cruise Pier Pickup",
        description:
          "210-minute Cozumel ATV tour to Jade Caverns cenote with verified 15-minute transfer from Puerta Maya / SSA International Pier / Punta Langosta.",
        includesPickup: true,
        pickupFulfillmentType: "pier_pickup",
        meetingPointName: "Puerta Maya / SSA International Pier / Punta Langosta Excursion Gate",
        meetingPointLat: 20.4764,
        meetingPointLng: -86.9739,
        transferBeforeMinutes: 15,
        transferAfterMinutes: 15,
        transferTimeSource: "verified_pier_pickup",
        transferEvidenceSource: "verified_landmark_registry:cozumel_puerta_maya_international_pier_pickup:5553274P1",
        applicableBerthOrMeetingPoint:
          "Puerta Maya / SSA International Pier / Punta Langosta Excursion Gate (15m transfer each way)",
        planningEstimateTransferMinutes: 15,
        durationMinutes: 210,
        fromPriceCents: 7900,
        priceBasis: "per_person",
        scheduledStartTimes: ["09:00", "10:00", "11:00", "12:00"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "pier_pickup",
      viatorProductCode: "5553274P1",
      verifiedPortSlug: "cozumel",
    },
    inclusions: [
      "3.5-hour ATV jungle & cenote tour",
      "Cruise pier pickup & return transfer",
    ],
    exclusions: ["Gratuities"],
    primaryImageUrl:
      "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/15/79/4b/2d.jpg",
    ratingAverage: 4.86,
    reviewCount: 49,
    bookingUrl:
      "https://www.viator.com/tours/Cozumel/Cozumel-ATV-Tour-to-Jade-Caverns/d632-5553274P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-cozumel-5553274p1&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    provenance: {
      sourceSystem: "viator_partner_v2_live",
      sourceEndpoint: "https://api.viator.com/partner/availability/check",
      fetchedAt: "2026-11-06T12:00:00.000Z",
      contentSha256: "viator_5553274p1_cozumel_pier_pickup_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-06T12:00:00.000Z",
    updatedAt: "2026-11-06T12:00:00.000Z",
    createdAt: "2026-11-06T12:00:00.000Z",
  },
  {
    tourId: "dcc:tour:viator:62963P76",
    compatibilityAliases: [
      "62963P76",
      "viator:62963P76",
      "roatan-zipline-monkey-sloths-62963p76",
    ],
    destinationSlug: "roatan",
    portSlug: "roatan",
    earthosDestinationNodeId: "earthos:node:hn-ib-roatan",
    timeZone: "America/Tegucigalpa",
    title: "Roatan Zip Line Adventure with Monkey & Sloths Combo",
    summary:
      "3-hour (180-minute) Jungle Top 16-line canopy zip line and monkey & sloth sanctuary excursion with verified cruise port pickup at Port of Roatán (Coxen Hole) and Mahogany Bay Cruise Center ($65.00/adult · $130.00 total for 2 adults).",
    category: "Adventure & Wildlife",
    tags: [
      "zipline",
      "monkeys",
      "sloths",
      "roatan",
      "pier-pickup",
      "viator",
    ],
    primaryProvider: "viator",
    providerProductCode: "62963P76",
    operatorName: "Jungle Top Adventures Roatán",
    operatorCode: "jungle-top-roatan",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 180,
    durationRawText: "3 hours (180 minutes) plus 15-minute Coxen Hole / Mahogany Bay cruise port transfer each way",
    fromPriceCents: 6500,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: true,
    lowestPriceIncludesPickup: true,
    pickupFulfillmentType: "pier_pickup",
    pickupType: "CRUISE_PIER_PICKUP",
    pickupSummary:
      "Includes direct cruise terminal pickup outside Port of Roatán (Coxen Hole Gate 1) and Mahogany Bay Cruise Center (15m transfer each way; $65.00/adult · $130.00 total for 2 adults).",
    meetingPointName: "Port of Roatán (Coxen Hole) & Mahogany Bay Cruise Center Excursion Gate",
    meetingPointAddress: "Carretera Principal Coxen Hole / Mahogany Bay, Roatán, Honduras",
    meetingPointLat: 16.3168,
    meetingPointLng: -86.5367,
    locationPrecision: "exact",
    pickupLocations: [
      {
        ref: "roatan_coxen_hole_mahogany_bay_pier",
        name: "Port of Roatán (Coxen Hole) & Mahogany Bay Excursion Gate",
        address: "Coxen Hole / Mahogany Bay, Roatán, Honduras",
        lat: 16.3168,
        lng: -86.5367,
        precision: "exact",
        pickupType: "CRUISE_PORT",
      },
    ],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 12,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 15,
      },
      {
        ageBand: "CHILD",
        startAge: 5,
        endAge: 11,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 15,
      },
    ],
    constraints: {
      wheelchairAccessible: false,
      minAgeYears: 5,
      physicalDifficulty: "MODERATE",
      cruiseBufferBeforeMinutes: 15,
      cruiseBufferAfterMinutes: 15,
      transferTimeSource: "verified_pier_pickup",
      transferEvidenceSource: "verified_landmark_registry:roatan_coxen_hole_mahogany_bay_pier_pickup:62963P76",
      applicableBerthOrMeetingPoint:
        "Port of Roatán (Coxen Hole) & Mahogany Bay Cruise Center Excursion Gate (15m verified transfer each way)",
      planningEstimateTransferMinutes: 15,
      weatherDependent: true,
      requiresClosedToeShoes: true,
    },
    channelOffers: [
      {
        channelId: "cruisepromenade",
        provider: "viator",
        providerProductCode: "62963P76",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 6500,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "3-hour 16-line Jungle Top canopy zip line & suspension bridges",
          "Monkey & sloth wildlife sanctuary visit",
          "Round-trip Coxen Hole / Mahogany Bay cruise port pickup",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/Roatan/Roatan-Zip-Line-Adventure-with-Monkeys-and-Sloths-Sanctuary/d4132-62963P76?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=cp-roatan-62963p76&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
      {
        channelId: "dcc",
        provider: "viator",
        providerProductCode: "62963P76",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 6500,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "3-hour 16-line Jungle Top canopy zip line & suspension bridges",
          "Monkey & sloth wildlife sanctuary visit",
          "Round-trip Coxen Hole / Mahogany Bay cruise port pickup",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/Roatan/Roatan-Zip-Line-Adventure-with-Monkeys-and-Sloths-Sanctuary/d4132-62963P76?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-roatan-62963p76&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
    ],
    productOptions: [
      {
        optionCode: "TG1",
        title: "Zip Line Adventure + Monkey & Sloths Sanctuary with Cruise Port Pickup",
        description:
          "180-minute Roatán zip line and wildlife sanctuary tour with verified 15-minute round-trip shuttle from Port of Roatán (Coxen Hole) or Mahogany Bay.",
        includesPickup: true,
        pickupFulfillmentType: "pier_pickup",
        meetingPointName: "Port of Roatán (Coxen Hole) & Mahogany Bay Cruise Center Excursion Gate",
        meetingPointLat: 16.3168,
        meetingPointLng: -86.5367,
        transferBeforeMinutes: 15,
        transferAfterMinutes: 15,
        transferTimeSource: "verified_pier_pickup",
        transferEvidenceSource: "verified_landmark_registry:roatan_coxen_hole_mahogany_bay_pier_pickup:62963P76",
        applicableBerthOrMeetingPoint:
          "Port of Roatán (Coxen Hole) & Mahogany Bay Cruise Center Excursion Gate (15m transfer each way)",
        planningEstimateTransferMinutes: 15,
        durationMinutes: 180,
        fromPriceCents: 6500,
        priceBasis: "per_person",
        scheduledStartTimes: ["09:00", "10:00"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "pier_pickup",
      viatorProductCode: "62963P76",
      verifiedPortSlug: "roatan",
    },
    inclusions: [
      "16-line canopy zip line & monkey/sloth sanctuary",
      "Round-trip Coxen Hole / Mahogany Bay cruise port pickup",
    ],
    exclusions: ["Gratuities"],
    primaryImageUrl:
      "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/12/80/8a/91.jpg",
    ratingAverage: 4.77,
    reviewCount: 44,
    bookingUrl:
      "https://www.viator.com/tours/Roatan/Roatan-Zip-Line-Adventure-with-Monkeys-and-Sloths-Sanctuary/d4132-62963P76?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-roatan-62963p76&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    provenance: {
      sourceSystem: "viator_partner_v2_live",
      sourceEndpoint: "https://api.viator.com/partner/availability/check",
      fetchedAt: "2026-11-06T12:00:00.000Z",
      contentSha256: "viator_62963p76_roatan_pier_pickup_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-06T12:00:00.000Z",
    updatedAt: "2026-11-06T12:00:00.000Z",
    createdAt: "2026-11-06T12:00:00.000Z",
  },
  {
    tourId: "dcc:tour:viator:10309P3",
    compatibilityAliases: [
      "10309P3",
      "viator:10309P3",
      "grand-cayman-stingray-city-starfish-reef-10309p3",
    ],
    destinationSlug: "grand-cayman",
    portSlug: "grand-cayman",
    earthosDestinationNodeId: "earthos:node:ky-grand-cayman",
    timeZone: "America/Cayman",
    title: "Stingray City and Starfish Experience with Coral Reef Snorkeling",
    summary:
      "3.5-hour (210-minute) North Sound boat excursion to Stingray City Sandbar, Starfish Point, and Barrier Reef snorkeling with verified George Town Royal Watler Tender Terminal pickup ($69.00/adult · $138.00 total for 2 adults). Accounts for 45-minute ship-to-shore tender clearance plus 20-minute marina shuttle each way.",
    category: "Water & Wildlife",
    tags: [
      "stingray-city",
      "starfish-point",
      "coral-reef",
      "snorkel",
      "grand-cayman",
      "tender-port",
      "pier-pickup",
      "viator",
    ],
    primaryProvider: "viator",
    providerProductCode: "10309P3",
    operatorName: "Cayman Snorkel Co. / Stingray City Charters",
    operatorCode: "cayman-stingray-charters",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 210,
    durationRawText:
      "3 hours 30 minutes (210 minutes) plus 45-minute ship-to-shore tender clearance and 20-minute George Town tender terminal shuttle each way",
    fromPriceCents: 6900,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: true,
    lowestPriceIncludesPickup: true,
    pickupFulfillmentType: "pier_pickup",
    pickupType: "CRUISE_PIER_PICKUP",
    pickupSummary:
      "Includes pickup at George Town Royal Watler / North & South Tender Terminals (requires 45m ship-to-shore tender clearance + 20m North Sound marina shuttle each way; $69.00/adult · $138.00 total for 2 adults).",
    meetingPointName: "George Town Royal Watler Tender Terminal Excursion Gate",
    meetingPointAddress: "Harbour Dr, George Town, Grand Cayman, Cayman Islands",
    meetingPointLat: 19.2952,
    meetingPointLng: -81.3831,
    locationPrecision: "exact",
    pickupLocations: [
      {
        ref: "grand_cayman_royal_watler_tender_terminal",
        name: "George Town Royal Watler Tender Terminal",
        address: "Harbour Dr, George Town, Grand Cayman",
        lat: 19.2952,
        lng: -81.3831,
        precision: "exact",
        pickupType: "CRUISE_PORT",
      },
    ],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 12,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 15,
      },
      {
        ageBand: "CHILD",
        startAge: 4,
        endAge: 11,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 15,
      },
    ],
    constraints: {
      wheelchairAccessible: false,
      minAgeYears: 4,
      physicalDifficulty: "EASY",
      cruiseBufferBeforeMinutes: 20,
      cruiseBufferAfterMinutes: 20,
      transferTimeSource: "verified_pier_pickup",
      transferEvidenceSource:
        "verified_landmark_registry:grand_cayman_george_town_royal_watler_tender_terminal:10309P3",
      applicableBerthOrMeetingPoint:
        "George Town Royal Watler Tender Terminal (45m ship-to-shore tender clearance + 20m North Sound marina shuttle each way)",
      planningEstimateTransferMinutes: 20,
      weatherDependent: true,
      requiresClosedToeShoes: false,
    },
    channelOffers: [
      {
        channelId: "cruisepromenade",
        provider: "viator",
        providerProductCode: "10309P3",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 6900,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "3.5-hour Stingray City Sandbar, Starfish Point & Coral Reef Snorkel",
          "Round-trip shuttle from George Town Royal Watler Tender Terminal",
          "Snorkel gear, life vest, and stingray interaction",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/Grand-Cayman/Stingray-City-With-Two-Snorkeling-Stops-Grand-Cayman/d50495-10309P3?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=cp-grand-cayman-10309p3&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
      {
        channelId: "dcc",
        provider: "viator",
        providerProductCode: "10309P3",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 6900,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "3.5-hour Stingray City Sandbar, Starfish Point & Coral Reef Snorkel",
          "Round-trip shuttle from George Town Royal Watler Tender Terminal",
          "Snorkel gear, life vest, and stingray interaction",
        ],
        exclusions: ["Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/Grand-Cayman/Stingray-City-With-Two-Snorkeling-Stops-Grand-Cayman/d50495-10309P3?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-grand-cayman-10309p3&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
    ],
    productOptions: [
      {
        optionCode: "TG1",
        title: "Stingray City, Starfish Point & Reef Snorkel with Tender Terminal Pickup",
        description:
          "210-minute Grand Cayman Stingray City & Starfish Point tour with 20m shuttle from George Town Royal Watler Tender Terminal (accounts for 45m ship-to-shore tender clearance).",
        includesPickup: true,
        pickupFulfillmentType: "pier_pickup",
        meetingPointName: "George Town Royal Watler Tender Terminal Excursion Gate",
        meetingPointLat: 19.2952,
        meetingPointLng: -81.3831,
        transferBeforeMinutes: 20,
        transferAfterMinutes: 20,
        transferTimeSource: "verified_pier_pickup",
        transferEvidenceSource:
          "verified_landmark_registry:grand_cayman_george_town_royal_watler_tender_terminal:10309P3",
        applicableBerthOrMeetingPoint:
          "George Town Royal Watler Tender Terminal (45m tender clearance + 20m North Sound marina shuttle each way)",
        planningEstimateTransferMinutes: 20,
        durationMinutes: 210,
        fromPriceCents: 6900,
        priceBasis: "per_person",
        scheduledStartTimes: ["09:00", "12:00"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "pier_pickup",
      viatorProductCode: "10309P3",
      verifiedPortSlug: "grand-cayman",
      tenderPort: true,
      tenderClearanceMinutes: 45,
    },
    inclusions: [
      "3.5-hour Stingray City, Starfish Point & Coral Reef Snorkel",
      "George Town Royal Watler Tender Terminal shuttle pickup & return",
    ],
    exclusions: ["Gratuities"],
    primaryImageUrl:
      "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/0b/1f/3c/fc.jpg",
    ratingAverage: 4.86,
    reviewCount: 400,
    bookingUrl:
      "https://www.viator.com/tours/Grand-Cayman/Stingray-City-With-Two-Snorkeling-Stops-Grand-Cayman/d50495-10309P3?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-grand-cayman-10309p3&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    provenance: {
      sourceSystem: "viator_partner_v2_live",
      sourceEndpoint: "https://api.viator.com/partner/availability/check",
      fetchedAt: "2026-11-06T12:00:00.000Z",
      contentSha256: "viator_10309p3_grand_cayman_tender_pier_pickup_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-06T12:00:00.000Z",
    updatedAt: "2026-11-06T12:00:00.000Z",
    createdAt: "2026-11-06T12:00:00.000Z",
  },
  {
    tourId: "dcc:tour:viator:8013P3",
    compatibilityAliases: [
      "8013P3",
      "viator:8013P3",
      "all-day-city-plantation-combo",
      "southernstyle-city-plantation-combo",
    ],
    destinationSlug: "new-orleans",
    portSlug: "new-orleans",
    earthosDestinationNodeId: "earthos:node:us-la-new-orleans",
    timeZone: "America/Chicago",
    title: "Oak Alley Plantation and New Orleans City Tour",
    summary:
      "7-hour (420-minute) combo excursion combining a narrated New Orleans City, Cemetery & Garden District sightseeing tour with a guided Oak Alley Plantation tour along Great River Road, including French Quarter / Downtown hotel pickup ($110.00/adult).",
    category: "Combo & Multi-Stop",
    tags: [
      "city-tour",
      "oak-alley",
      "plantation",
      "combo",
      "hotel-pickup",
      "new-orleans",
      "viator",
    ],
    primaryProvider: "viator",
    providerProductCode: "8013P3",
    operatorName: "Southern Style Tours",
    operatorCode: "southernstyletours",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 420,
    durationRawText: "7 hours (420 minutes) including round-trip Great River Road transport and French Quarter/Downtown hotel pickup",
    fromPriceCents: 11000,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: true,
    lowestPriceIncludesPickup: true,
    pickupFulfillmentType: "hotel_pickup",
    pickupType: "HOTEL_PICKUP",
    pickupSummary:
      "Includes round-trip pickup from participating French Quarter and Downtown New Orleans hotels (including Hotel Monteleone at 214 Royal St).",
    meetingPointName: "Participating French Quarter / Downtown New Orleans Hotels (e.g. 214 Royal St)",
    meetingPointAddress: "214 Royal St, New Orleans, LA 70130",
    meetingPointLat: 29.954222,
    meetingPointLng: -90.06776,
    locationPrecision: "exact",
    pickupLocations: [
      {
        ref: "nola_french_quarter_downtown_hotel_pickup",
        name: "French Quarter & Downtown New Orleans Hotel Pickup Zone",
        address: "214 Royal St, New Orleans, LA 70130",
        lat: 29.954222,
        lng: -90.06776,
        precision: "exact",
        pickupType: "HOTEL",
      },
    ],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 13,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 14,
      },
      {
        ageBand: "CHILD",
        startAge: 4,
        endAge: 12,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 14,
      },
    ],
    constraints: {
      wheelchairAccessible: false,
      minAgeYears: 0,
      physicalDifficulty: "EASY",
      cruiseBufferBeforeMinutes: 30,
      cruiseBufferAfterMinutes: 45,
      transferTimeSource: "verified_meeting_point",
      transferEvidenceSource: "viator_partner_v2_live:8013P3",
      applicableBerthOrMeetingPoint:
        "French Quarter & Downtown New Orleans Hotel Pickup <-> Oak Alley Plantation & City Sightseeing Route",
      planningEstimateTransferMinutes: 30,
      weatherDependent: false,
      requiresClosedToeShoes: false,
    },
    channelOffers: [
      {
        channelId: "dcc",
        provider: "viator",
        providerProductCode: "8013P3",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 11000,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "Guided New Orleans City & Cemetery sightseeing tour",
          "Oak Alley Plantation admission and mansion tour",
          "Round-trip French Quarter / Downtown hotel pickup",
        ],
        exclusions: ["Lunch", "Gratuities"],
        bookingUrl:
          "https://www.viator.com/tours/New-Orleans/Combo-Oak-Alley-Plantation-and-New-Orleans-City-Tour/d675-8013P3?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-new-orleans-8013p3&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
    ],
    productOptions: [
      {
        optionCode: "DEFAULT",
        title: "Oak Alley Plantation and New Orleans City Tour with Hotel Pickup",
        description:
          "Full-day combo combining the morning New Orleans City Tour and afternoon Oak Alley Plantation Tour with French Quarter/Downtown hotel pickup.",
        includesPickup: true,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName: "Participating French Quarter / Downtown New Orleans Hotels",
        meetingPointLat: 29.954222,
        meetingPointLng: -90.06776,
        transferBeforeMinutes: 30,
        transferAfterMinutes: 45,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource: "viator_partner_v2_live:8013P3",
        applicableBerthOrMeetingPoint: "French Quarter / Downtown New Orleans Hotel Pickup",
        planningEstimateTransferMinutes: 30,
        durationMinutes: 420,
        fromPriceCents: 11000,
        priceBasis: "per_person",
        scheduledStartTimes: ["08:30"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "hotel_pickup",
      viatorProductCode: "8013P3",
      viatorPartnerPid: "P00306962",
      viatorMcid: "42383",
      commissionStatus: "active_verified_viator_partner",
    },
    inclusions: [
      "Guided New Orleans City & Cemetery sightseeing tour",
      "Oak Alley Plantation admission and mansion tour",
      "Round-trip French Quarter / Downtown hotel pickup",
    ],
    exclusions: ["Lunch", "Gratuities"],
    primaryImageUrl:
      "https://media.tacdn.com/media/attractions-splice-spp-674x446/06/74/7d/11.jpg",
    ratingAverage: 4.5,
    reviewCount: 68,
    bookingUrl:
      "https://www.viator.com/tours/New-Orleans/Combo-Oak-Alley-Plantation-and-New-Orleans-City-Tour/d675-8013P3?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-new-orleans-8013p3&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    provenance: {
      sourceSystem: "viator_partner_v2_live",
      sourceEndpoint: "https://api.viator.com/partner/products/8013P3",
      fetchedAt: "2026-11-06T18:00:00.000Z",
      contentSha256: "viator_8013p3_southern_style_city_oak_alley_combo_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-06T18:00:00.000Z",
    updatedAt: "2026-11-06T18:00:00.000Z",
    createdAt: "2026-11-06T18:00:00.000Z",
  },
  {
    tourId: "dcc:tour:viator:3780GHOSTS",
    compatibilityAliases: [
      "3780GHOSTS",
      "viator:3780GHOSTS",
      "ghosts-spirits-walking-tour",
    ],
    destinationSlug: "new-orleans",
    portSlug: "new-orleans",
    earthosDestinationNodeId: "earthos:node:us-la-new-orleans",
    timeZone: "America/Chicago",
    title: "French Quarter Ghosts and Spirits Walking Tour",
    summary:
      "2-hour (120-minute) evening French Quarter haunted history walking tour with a licensed local guide, departing from the Gray Line Lighthouse Ticket Office at Toulouse Street Wharf (400 Toulouse St, New Orleans, LA 70130; $27.00/adult).",
    category: "Walking & History",
    tags: [
      "ghost-tour",
      "haunted",
      "walking-tour",
      "french-quarter",
      "new-orleans",
      "viator",
    ],
    primaryProvider: "viator",
    providerProductCode: "3780GHOSTS",
    operatorName: "Gray Line New Orleans",
    operatorCode: "neworleanssteamboatcompany",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 120,
    durationRawText: "2 hours (120 minutes) guided walking tour departing from 400 Toulouse St",
    fromPriceCents: 2700,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
    hasHotelPickup: false,
    lowestPriceIncludesPickup: false,
    pickupFulfillmentType: "self_drive",
    pickupType: "MEETING_POINT_ONLY",
    pickupSummary:
      "Meet at the Gray Line Lighthouse Ticket Office at 400 Toulouse St (Toulouse Street Wharf behind JAX Brewery, French Quarter, New Orleans, LA 70130).",
    meetingPointName: "Gray Line Lighthouse Ticket Office (400 Toulouse St, French Quarter)",
    meetingPointAddress: "400 Toulouse St, New Orleans, LA 70130",
    meetingPointLat: 29.9565,
    meetingPointLng: -90.0633,
    locationPrecision: "exact",
    pickupLocations: [],
    ageBands: [
      {
        ageBand: "ADULT",
        startAge: 13,
        endAge: 99,
        minTravelersPerBooking: 1,
        maxTravelersPerBooking: 15,
      },
      {
        ageBand: "CHILD",
        startAge: 6,
        endAge: 12,
        minTravelersPerBooking: 0,
        maxTravelersPerBooking: 15,
      },
    ],
    constraints: {
      wheelchairAccessible: true,
      minAgeYears: 6,
      physicalDifficulty: "EASY",
      cruiseBufferBeforeMinutes: 15,
      cruiseBufferAfterMinutes: 15,
      transferTimeSource: "verified_meeting_point",
      transferEvidenceSource: "viator_partner_v2_live:3780GHOSTS",
      applicableBerthOrMeetingPoint:
        "Gray Line Lighthouse Ticket Office (400 Toulouse St, French Quarter, New Orleans, LA 70130)",
      planningEstimateTransferMinutes: 15,
      weatherDependent: true,
      requiresClosedToeShoes: false,
    },
    channelOffers: [
      {
        channelId: "dcc",
        provider: "viator",
        providerProductCode: "3780GHOSTS",
        capabilityTier: "live_check_referral",
        commissionAuthorized: true,
        fromPriceCents: 2700,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "2-hour guided French Quarter ghost & haunted history walking tour",
          "Licensed local historian guide",
        ],
        exclusions: ["Gratuities", "Food and drinks"],
        bookingUrl:
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Ghosts-and-Spirits-Walking-Tour/d675-3780GHOSTS?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-new-orleans-3780ghosts&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
      },
    ],
    productOptions: [
      {
        optionCode: "DEFAULT",
        title: "French Quarter Ghosts & Spirits Evening Walking Tour",
        description:
          "2-hour evening walking tour departing from the Gray Line Lighthouse Ticket Office at 400 Toulouse St.",
        includesPickup: false,
        pickupFulfillmentType: "self_drive",
        meetingPointName: "Gray Line Lighthouse Ticket Office (400 Toulouse St, French Quarter)",
        meetingPointLat: 29.9565,
        meetingPointLng: -90.0633,
        transferBeforeMinutes: 15,
        transferAfterMinutes: 15,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource: "viator_partner_v2_live:3780GHOSTS",
        applicableBerthOrMeetingPoint: "400 Toulouse St, New Orleans, LA 70130",
        planningEstimateTransferMinutes: 15,
        durationMinutes: 120,
        fromPriceCents: 2700,
        priceBasis: "per_person",
        scheduledStartTimes: ["17:00", "20:00"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "self_drive",
      viatorProductCode: "3780GHOSTS",
      viatorPartnerPid: "P00306962",
      viatorMcid: "42383",
      commissionStatus: "active_verified_viator_partner",
    },
    inclusions: [
      "2-hour guided French Quarter ghost & haunted history walking tour",
      "Licensed local historian guide",
    ],
    exclusions: ["Gratuities", "Food and drinks"],
    primaryImageUrl:
      "https://media.tacdn.com/media/attractions-splice-spp-674x446/07/71/3d/e9.jpg",
    ratingAverage: 4.5,
    reviewCount: 194,
    bookingUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Ghosts-and-Spirits-Walking-Tour/d675-3780GHOSTS?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=dcc-new-orleans-3780ghosts&utm_source=destinationcommandcenter&utm_medium=affiliate&utm_campaign=cities&locale=en-US",
    provenance: {
      sourceSystem: "viator_partner_v2_live",
      sourceEndpoint: "https://api.viator.com/partner/products/3780GHOSTS",
      fetchedAt: "2026-11-06T18:00:00.000Z",
      contentSha256: "viator_3780ghosts_grayline_french_quarter_ghosts_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-06T18:00:00.000Z",
    updatedAt: "2026-11-06T18:00:00.000Z",
    createdAt: "2026-11-06T18:00:00.000Z",
  },
  {
    tourId: "dcc:tour:operator:pacwhale-maalaea-whale-watch",
    compatibilityAliases: [
      "PACWHALE-MAALAEA-WHALE-WATCH",
      "pacwhale-eco-adventures-maalaea-whale-watch",
      "kahului-maalaea-pacwhale-whale-watch",
    ],
    destinationSlug: "kahului",
    portSlug: "kahului",
    earthosDestinationNodeId: "earthos:node:us-hi-kahului",
    timeZone: "Pacific/Honolulu",
    title: "PacWhale Eco-Adventures: Original Maʻalaea Harbor Whale Watch (Naturalist Catamaran)",
    summary:
      "2-hour marine naturalist-led humpback whale watch departing from Maʻalaea Harbor (check in 45 minutes prior at PacWhale Ocean Store, 300 Maʻalaea Rd, Suite 108; 50-minute round-trip ground transfer from Kahului Harbor Cruise Terminal Pier 1/2).",
    category: "Whale Watching & Marine Wildlife",
    tags: ["wildlife", "family", "sightseeing", "whale-watching", "maalaea-harbor", "kahului", "pacwhale"],
    primaryProvider: "operator_direct",
    providerProductCode: "PACWHALE-MAALAEA-2HR",
    operatorName: "PacWhale Eco-Adventures (Pacific Whale Foundation)",
    operatorCode: "pacwhale-eco-adventures",
    capabilityTier: "attributable_referral",
    commissionAuthorized: true,
    durationMinutes: 120,
    durationRawText: "2 hours on water (+ 45m check-in cutoff + 50m round-trip transfer from Kahului Harbor)",
    fromPriceCents: 9346,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation or reschedule up to 24 hours before departure; guaranteed whale sighting or free return voucher.",
    hasHotelPickup: false,
    lowestPriceIncludesPickup: false,
    pickupType: "MEETING_POINT_ONLY",
    pickupFulfillmentType: "self_drive",
    pickupSummary:
      "Meet at PacWhale Ocean Store, Harbor Shops at Maʻalaea (300 Maʻalaea Rd, Suite 108, Wailuku, HI 96793) 45 minutes before departure. Allow 25 minutes each way (50 minutes round-trip) by taxi/rideshare from Kahului Harbor Cruise Terminal (Pier 1/2).",
    meetingPointName: "PacWhale Ocean Store — Harbor Shops at Maʻalaea (300 Maʻalaea Rd, Suite 108)",
    meetingPointAddress: "300 Maʻalaea Rd, Suite 108, Wailuku, HI 96793",
    meetingPointLat: 20.7922,
    meetingPointLng: -156.5113,
    locationPrecision: "exact",
    pickupLocations: [
      {
        name: "PacWhale Ocean Store — Harbor Shops at Maʻalaea",
        address: "300 Maʻalaea Rd, Suite 108, Wailuku, HI 96793",
        lat: 20.7922,
        lng: -156.5113,
        precision: "exact",
        pickupType: "MEETING_POINT",
      },
    ],
    ageBands: [
      { ageBand: "ADULT", startAge: 13, endAge: 99 },
      { ageBand: "CHILD", startAge: 3, endAge: 12 },
    ],
    constraints: {
      wheelchairAccessible: true,
      cruiseBufferBeforeMinutes: 25,
      cruiseBufferAfterMinutes: 25,
      transferTimeSource: "verified_meeting_point",
      transferEvidenceSource: "verified_landmark_registry:kahului_to_maalaea_harbor_300_maalaea_rd",
      applicableBerthOrMeetingPoint:
        "Kahului Harbor Cruise Terminal (Pier 1/2) <-> PacWhale Ocean Store, 300 Maʻalaea Rd (25m each way / 50m round-trip; 45m check-in cutoff)",
      planningEstimateTransferMinutes: 25,
      weatherDependent: true,
      requiresClosedToeShoes: false,
    },
    channelOffers: [
      {
        channelId: "dcc",
        provider: "operator_direct",
        providerProductCode: "PACWHALE-MAALAEA-2HR",
        capabilityTier: "attributable_referral",
        commissionAuthorized: true,
        fromPriceCents: 9346,
        priceBasis: "per_person",
        currency: "USD",
        freeCancellation: true,
        cancellationCutoffHours: 24,
        cancellationSummary: "Free cancellation up to 24 hours before scheduled departure.",
        inclusions: [
          "2-hour certified Marine Naturalist humpback whale watch from Maʻalaea Harbor",
          "Underwater hydrophone audio &guaranteed whale sighting policy",
        ],
        exclusions: ["Round-trip taxi/rideshare between Kahului Harbor and Maʻalaea Harbor (25m each way)"],
        bookingUrl:
          "https://www.pacificwhale.org/cruises/maui-whalewatch/?utm_source=destinationcommandcenter&utm_medium=referral&utm_campaign=dcc-kahului-maalaea-whale-watch",
      },
    ],
    productOptions: [
      {
        optionCode: "MAALAEA-1100",
        title: "11:00 AM Maʻalaea Harbor Whale Watch (Fits 08:00–17:00 Kahului Cruise Call)",
        description:
          "Check in by 10:15 AM at PacWhale Ocean Store (300 Maʻalaea Rd); returns to Maʻalaea slip at 1:00 PM and back at Kahului Pier by ~1:25 PM (3h 05m buffer before 4:30 PM all-aboard).",
        includesPickup: false,
        pickupFulfillmentType: "self_drive",
        meetingPointName: "PacWhale Ocean Store — Harbor Shops at Maʻalaea (300 Maʻalaea Rd)",
        meetingPointLat: 20.7922,
        meetingPointLng: -156.5113,
        transferBeforeMinutes: 25,
        transferAfterMinutes: 25,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource: "verified_landmark_registry:kahului_to_maalaea_harbor_300_maalaea_rd",
        applicableBerthOrMeetingPoint: "300 Maʻalaea Rd, Suite 108, Wailuku, HI 96793",
        planningEstimateTransferMinutes: 25,
        durationMinutes: 120,
        fromPriceCents: 9346,
        priceBasis: "per_person",
        scheduledStartTimes: ["09:00", "11:00", "13:30", "14:30"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "self_drive",
      checkInCutoffMinutes: 45,
      roundTripTransferMinutes: 50,
    },
    inclusions: [
      "2-hour certified Marine Naturalist humpback whale watch from Maʻalaea Harbor",
      "Underwater hydrophone audio & guaranteed whale sighting policy",
    ],
    exclusions: ["Round-trip taxi/rideshare between Kahului Harbor and Maʻalaea Harbor (25m each way)"],
    primaryImageUrl: null,
    ratingAverage: 4.8,
    reviewCount: 1420,
    bookingUrl:
      "https://www.pacificwhale.org/cruises/maui-whalewatch/?utm_source=destinationcommandcenter&utm_medium=referral&utm_campaign=dcc-kahului-maalaea-whale-watch",
    provenance: {
      sourceSystem: "pacwhale_published_schedule_v1",
      sourceEndpoint: "https://www.pacificwhale.org/cruises/maui-whalewatch/",
      fetchedAt: "2026-11-07T18:00:00.000Z",
      contentSha256: "pacwhale_maalaea_2hr_whale_watch_verified",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: true,
      },
    },
    quarantined: false,
    quarantineReason: null,
    active: true,
    lastVerifiedAt: "2026-11-07T18:00:00.000Z",
    updatedAt: "2026-11-07T18:00:00.000Z",
    createdAt: "2026-11-07T18:00:00.000Z",
  },
];

function mergePilotVerifiedRecords(records: DurableTourRecord[]): DurableTourRecord[] {
  const byId = new Map<string, DurableTourRecord>();
  for (const r of records) {
    byId.set(r.tourId, normalizeCatalogTourPickupAndMeeting(r).normalizedRecord);
  }
  for (const pilot of PILOT_VERIFIED_TOUR_RECORDS) {
    byId.set(pilot.tourId, normalizeCatalogTourPickupAndMeeting(pilot).normalizedRecord);
  }
  return Array.from(byId.values());
}

async function loadAllCatalogRecordsWithPgHydration(): Promise<{
  records: DurableTourRecord[];
  source: "postgres" | "snapshot_hydrated_to_postgres" | "local_snapshot";
}> {
  if (
    memoryCatalogCache &&
    memoryCatalogCache.length > 0 &&
    Date.now() - memoryCatalogLoadedAt < 60_000
  ) {
    return {
      records: mergePilotVerifiedRecords(
        memoryCatalogCache.filter((r) => r.active && !isQuarantinedTourRecord(r)),
      ),
      source: memoryCatalogSource,
    };
  }

  if (shouldUsePostgres()) {
    try {
      await ensureCatalogSchema();
      const sql = getSqlClient();
      if (!pilotRecordsUpsertedToPg) {
        pilotRecordsUpsertedToPg = true;
        for (const pilot of PILOT_VERIFIED_TOUR_RECORDS) {
          await upsertSingleTourToPg(sql, pilot);
        }
      }
      const rows = await sql`
        SELECT * FROM dcc_tour_catalog WHERE active = true AND quarantined = false ORDER BY destination_slug, tour_id
      `;
      if (rows.length > 0) {
        const mapped = mergePilotVerifiedRecords(
          rows.map(mapPgRowToDurableTourRecord).filter((r) => r.active && !isQuarantinedTourRecord(r)),
        );
        memoryCatalogCache = mapped;
        memoryCatalogLoadedAt = Date.now();
        memoryCatalogSource = "postgres";
        return { records: mapped, source: "postgres" };
      }

      // If Postgres is empty on first query (e.g., fresh production DB), auto-hydrate from committed snapshot
      const snapshot = readLocalCatalogSnapshot();
      const activeSnapshotRecords = mergePilotVerifiedRecords(
        snapshot.records.filter((r) => r.active && !isQuarantinedTourRecord(r)),
      );
      if (activeSnapshotRecords.length > 0 && !pgHydratedFromSnapshot) {
        pgHydratedFromSnapshot = true;
        for (const rec of activeSnapshotRecords) {
          await upsertSingleTourToPg(sql, rec);
        }
        for (const run of snapshot.syncRuns) {
          await recordCatalogSyncRun(run);
        }
        memoryCatalogCache = activeSnapshotRecords;
        memoryCatalogLoadedAt = Date.now();
        memoryCatalogSource = "snapshot_hydrated_to_postgres";
        return { records: activeSnapshotRecords, source: "snapshot_hydrated_to_postgres" };
      }
    } catch (err) {
      console.warn("[durableCatalogStore] Falling back to snapshot after Postgres query error:", err);
    }
  }

  if (memoryCatalogCache && memoryCatalogCache.length > 0) {
    return {
      records: mergePilotVerifiedRecords(
        memoryCatalogCache.filter((r) => r.active && !isQuarantinedTourRecord(r)),
      ),
      source: "local_snapshot",
    };
  }
  const snapshot = readLocalCatalogSnapshot();
  const activeRecords = mergePilotVerifiedRecords(
    snapshot.records.filter((r) => r.active && !isQuarantinedTourRecord(r)),
  );
  memoryCatalogCache = activeRecords;
  return { records: activeRecords, source: "local_snapshot" };
}

export type DurableCatalogSortBy =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "duration_asc"
  | "title_asc";

export type DurableCatalogQueryFilter = {
  destinationSlug?: string;
  portSlug?: string;
  earthosDestinationNodeId?: string;
  provider?: string;
  capabilityTier?: TourCapabilityTier;
  category?: string;
  searchQuery?: string;
  approvedTourIds?: string[];
  includeDiscoveryOnly?: boolean;
  requireVerifiedCruiseLogistics?: boolean;
  sortBy?: DurableCatalogSortBy;
  limit?: number;
  offset?: number;
  page?: number;
};

export function hasVerifiedCruisePortLogistics(rec: DurableTourRecord): boolean {
  const hasDuration = typeof rec.durationMinutes === "number" && rec.durationMinutes > 0;
  const hasMeetingPoint =
    Boolean(rec.meetingPointName && rec.meetingPointName.trim()) &&
    Boolean(
      rec.constraints?.applicableBerthOrMeetingPoint &&
        rec.constraints.applicableBerthOrMeetingPoint.trim(),
    ) &&
    rec.pickupFulfillmentType !== "unknown" &&
    rec.pickupType !== "UNKNOWN" &&
    rec.provenance?.rawFieldsVerified?.pickupKnown === true;
  const hasTransfer =
    (rec.constraints?.transferTimeSource === "verified_pier_pickup" ||
      rec.constraints?.transferTimeSource === "verified_meeting_point") &&
    Boolean(
      rec.constraints?.transferEvidenceSource &&
        rec.constraints.transferEvidenceSource.trim(),
    ) &&
    typeof rec.constraints?.cruiseBufferBeforeMinutes === "number" &&
    Number.isFinite(rec.constraints.cruiseBufferBeforeMinutes);
  const hasSchedule =
    (Array.isArray(rec.productOptions) &&
      rec.productOptions.some(
        (opt) =>
          Array.isArray(opt.scheduledStartTimes) && opt.scheduledStartTimes.length > 0,
      )) ||
    (Array.isArray((rec.serviceDetails as any)?.verifiedDepartureTimesLocal) &&
      (rec.serviceDetails as any).verifiedDepartureTimesLocal.length > 0);
  return hasDuration && hasMeetingPoint && hasTransfer && hasSchedule;
}

export type DurableCatalogQueryResult = {
  records: DurableTourRecord[];
  totalMatched: number;
  storageSource: "postgres" | "snapshot_hydrated_to_postgres" | "local_snapshot";
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
  executedInSql: boolean;
  rowsLoadedIntoApp: number;
  fullCatalogLoadedIntoApp: boolean;
  sqlQueryMs: number | null;
};

export const SHORE_EXCURSION_CATEGORY_FACET_PATTERNS: Record<string, string> = {
  sightseeing:
    "sightseeing|golden circle|south coast|city tour|panoramic|highlights|bus tour|hop-on|walking tour|scenic|landmark|lagoon|sky lagoon|blue lagoon|waterfall|geyser|trolley|tram|harbor cruise|island tour",
  wildlife:
    "wildlife|whale|puffin|dolphin|seal|marine|bird|turtle|bear|eagle|nature|reef|snorkeling|swamp|alligator|safari|stingray|sea lion",
  food:
    "food|culinary|tasting|beer|brewery|distillery|wine|dining|gastronomy|cooking|lunch|dinner|bakery|chocolate|coffee|cocktail|feast|salmon bake",
  culture:
    "culture|cultural|history|historical|museum|heritage|viking|folklore|saga|ghost|jazz|plantation|architecture|art|local|native|totem|mayan|ruins",
  adventure:
    "adventure|glacier|ice cave|snowmobile|atv|buggy|zipline|kayak|rafting|snorkel|scuba|diving|hiking|trek|volcano|lava|caving|helicopter|airboat|4x4|super jeep|horseback|jet boat|catamaran|rib boat",
  family:
    "family|all ages|kid|children|easy|aquarium|zoo|whale|lagoon|museum|train|tram|trolley|boat tour|puffin|show|beach|glass bottom|park",
};

function matchesCatalogCategoryFilter(rec: DurableTourRecord, rawCategory: string): boolean {
  const recCat = rec.category.trim().toLowerCase();
  const filterCat = rawCategory
    .trim()
    .toLowerCase()
    .replace(/\s+(?:tours|excursions)$/i, "");
  if (!filterCat || filterCat === "all") return true;
  if (recCat.includes(filterCat) || filterCat.includes(recCat)) {
    return true;
  }
  const facetPattern = SHORE_EXCURSION_CATEGORY_FACET_PATTERNS[filterCat];
  if (facetPattern) {
    const regex = new RegExp(facetPattern, "i");
    if (
      regex.test(rec.category) ||
      regex.test(rec.title) ||
      (rec.summary && regex.test(rec.summary)) ||
      rec.tags.some((t) => regex.test(t))
    ) {
      return true;
    }
  }
  return false;
}

function getNormalizedPilotMap(): Map<string, DurableTourRecord> {
  const map = new Map<string, DurableTourRecord>();
  for (const pilot of PILOT_VERIFIED_TOUR_RECORDS) {
    if (!isQuarantinedTourRecord(pilot) && pilot.active) {
      map.set(pilot.tourId, normalizeCatalogTourPickupAndMeeting(pilot).normalizedRecord);
    }
  }
  return map;
}

export async function syncPilotVerifiedRecordsToPostgres(): Promise<number> {
  if (!shouldUsePostgres()) return 0;
  await ensureCatalogSchema();
  const sql = getSqlClient();
  const normalizedPilots = PILOT_VERIFIED_TOUR_RECORDS.map(
    (p) => normalizeCatalogTourPickupAndMeeting(p).normalizedRecord,
  );
  await Promise.all(normalizedPilots.map((pilot) => upsertSingleTourToPg(sql, pilot)));
  pilotRecordsUpsertedToPg = true;
  return normalizedPilots.length;
}

function buildSqlOrderByClause(sortBy: DurableCatalogSortBy = "recommended"): string {
  switch (sortBy) {
    case "price_asc":
      return "from_price_cents ASC NULLS LAST, COALESCE(rating_average, 0) DESC, tour_id ASC";
    case "price_desc":
      return "from_price_cents DESC NULLS LAST, COALESCE(rating_average, 0) DESC, tour_id ASC";
    case "rating_desc":
      return "COALESCE(rating_average, 0) DESC, COALESCE(review_count, 0) DESC, from_price_cents ASC NULLS LAST, tour_id ASC";
    case "duration_asc":
      return "duration_minutes ASC NULLS LAST, from_price_cents ASC NULLS LAST, tour_id ASC";
    case "title_asc":
      return "LOWER(title) ASC, tour_id ASC";
    case "recommended":
    default:
      return "destination_slug ASC, commission_authorized DESC, COALESCE(rating_average, 0) DESC, COALESCE(review_count, 0) DESC, from_price_cents ASC NULLS LAST, tour_id ASC";
  }
}

function sortCatalogRecordsInJs(
  records: DurableTourRecord[],
  sortBy: DurableCatalogSortBy = "recommended",
): DurableTourRecord[] {
  const copy = [...records];
  copy.sort((a, b) => {
    switch (sortBy) {
      case "price_asc": {
        const pa = a.fromPriceCents ?? Number.MAX_SAFE_INTEGER;
        const pb = b.fromPriceCents ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0) || a.tourId.localeCompare(b.tourId);
      }
      case "price_desc": {
        const pa = a.fromPriceCents ?? -1;
        const pb = b.fromPriceCents ?? -1;
        if (pa !== pb) return pb - pa;
        return (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0) || a.tourId.localeCompare(b.tourId);
      }
      case "rating_desc": {
        const ra = a.ratingAverage ?? 0;
        const rb = b.ratingAverage ?? 0;
        if (ra !== rb) return rb - ra;
        const rca = a.reviewCount ?? 0;
        const rcb = b.reviewCount ?? 0;
        if (rca !== rcb) return rcb - rca;
        return (a.fromPriceCents ?? Number.MAX_SAFE_INTEGER) - (b.fromPriceCents ?? Number.MAX_SAFE_INTEGER);
      }
      case "duration_asc": {
        const da = a.durationMinutes ?? Number.MAX_SAFE_INTEGER;
        const db = b.durationMinutes ?? Number.MAX_SAFE_INTEGER;
        if (da !== db) return da - db;
        return (a.fromPriceCents ?? Number.MAX_SAFE_INTEGER) - (b.fromPriceCents ?? Number.MAX_SAFE_INTEGER);
      }
      case "title_asc":
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase()) || a.tourId.localeCompare(b.tourId);
      case "recommended":
      default: {
        const destCmp = a.destinationSlug.localeCompare(b.destinationSlug);
        if (destCmp !== 0) return destCmp;
        if (a.commissionAuthorized !== b.commissionAuthorized) {
          return a.commissionAuthorized ? -1 : 1;
        }
        const ra = a.ratingAverage ?? 0;
        const rb = b.ratingAverage ?? 0;
        if (ra !== rb) return rb - ra;
        const rca = a.reviewCount ?? 0;
        const rcb = b.reviewCount ?? 0;
        if (rca !== rcb) return rcb - rca;
        const pa = a.fromPriceCents ?? Number.MAX_SAFE_INTEGER;
        const pb = b.fromPriceCents ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return a.tourId.localeCompare(b.tourId);
      }
    }
  });
  return copy;
}

export async function queryDurableTourCatalog(
  filter: DurableCatalogQueryFilter = {},
): Promise<DurableCatalogQueryResult> {
  const resolvedDest = filter.destinationSlug
    ? resolveEarthOSDestinationNode(filter.destinationSlug)?.destinationSlug ||
      filter.destinationSlug.toLowerCase()
    : null;
  const resolvedPort = filter.portSlug
    ? resolveEarthOSDestinationNode(filter.portSlug)?.portSlug || filter.portSlug.toLowerCase()
    : null;
  const approvedList =
    Array.isArray(filter.approvedTourIds) && filter.approvedTourIds.length > 0
      ? Array.from(new Set(filter.approvedTourIds.map((id) => id.trim().toLowerCase()).filter(Boolean)))
      : null;

  const requestedLimit =
    typeof filter.limit === "number" && Number.isFinite(filter.limit) && filter.limit > 0
      ? Math.floor(filter.limit)
      : null;
  const requestedOffset =
    typeof filter.offset === "number" && Number.isFinite(filter.offset) && filter.offset >= 0
      ? Math.floor(filter.offset)
      : typeof filter.page === "number" &&
          Number.isFinite(filter.page) &&
          filter.page > 1 &&
          requestedLimit !== null
        ? (Math.floor(filter.page) - 1) * requestedLimit
        : 0;
  const sortBy: DurableCatalogSortBy = filter.sortBy || "recommended";

  if (shouldUsePostgres()) {
    try {
      const sql = getSqlClient();
      const params: unknown[] = [];
      const addParam = (val: unknown): string => {
        params.push(val);
        return `$${params.length}`;
      };

      const pQuarantined = addParam(Array.from(QUARANTINED_TOUR_IDS));
      const whereClauses: string[] = [
        "active = true",
        "quarantined = false",
        `NOT (tour_id = ANY(${pQuarantined}::text[]))`,
      ];

      if (filter.includeDiscoveryOnly === false) {
        whereClauses.push("capability_tier <> 'discovery_only'");
      }
      if (resolvedDest) {
        const pDest = addParam(resolvedDest);
        whereClauses.push(`LOWER(destination_slug) = ${pDest}`);
      }
      if (resolvedPort) {
        const pPort = addParam(resolvedPort);
        whereClauses.push(`LOWER(COALESCE(port_slug, '')) = ${pPort}`);
      }
      if (filter.earthosDestinationNodeId) {
        const pNode = addParam(filter.earthosDestinationNodeId);
        whereClauses.push(`earthos_destination_node_id = ${pNode}`);
      }
      if (filter.provider) {
        const pProv = addParam(filter.provider);
        whereClauses.push(`primary_provider = ${pProv}`);
      }
      if (filter.capabilityTier) {
        const pTier = addParam(filter.capabilityTier);
        whereClauses.push(`capability_tier = ${pTier}`);
      }
      if (filter.category) {
        const filterCat = filter.category
          .trim()
          .toLowerCase()
          .replace(/\s+(?:tours|excursions)$/i, "");
        if (filterCat && filterCat !== "all") {
          const pCat = addParam(filterCat);
          const facetPattern = SHORE_EXCURSION_CATEGORY_FACET_PATTERNS[filterCat];
          if (facetPattern) {
            const pRegex = addParam(facetPattern);
            whereClauses.push(
              `(POSITION(${pCat} IN LOWER(category)) > 0 OR POSITION(LOWER(category) IN ${pCat}) > 0 OR LOWER(category) ~ ${pRegex} OR LOWER(title) ~ ${pRegex} OR LOWER(COALESCE(summary, '')) ~ ${pRegex} OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(tags) t WHERE LOWER(t) ~ ${pRegex}))`,
            );
          } else {
            whereClauses.push(
              `(POSITION(${pCat} IN LOWER(category)) > 0 OR POSITION(LOWER(category) IN ${pCat}) > 0)`,
            );
          }
        }
      }
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const pSearch = addParam(`%${filter.searchQuery.trim()}%`);
        whereClauses.push(
          `(title ILIKE ${pSearch} OR COALESCE(summary, '') ILIKE ${pSearch} OR category ILIKE ${pSearch} OR provider_product_code ILIKE ${pSearch} OR COALESCE(operator_name, '') ILIKE ${pSearch})`,
        );
      }
      if (approvedList && approvedList.length > 0) {
        const pApproved = addParam(approvedList);
        whereClauses.push(
          `(LOWER(tour_id) = ANY(${pApproved}::text[]) OR LOWER(provider_product_code) = ANY(${pApproved}::text[]) OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(compatibility_aliases) a WHERE LOWER(a) = ANY(${pApproved}::text[])))`,
        );
      }
      if (filter.requireVerifiedCruiseLogistics) {
        whereClauses.push(
          `duration_minutes IS NOT NULL AND duration_minutes > 0`,
          `COALESCE(TRIM(meeting_point_name), '') <> ''`,
          `COALESCE(TRIM(constraints_json->>'applicableBerthOrMeetingPoint'), '') <> ''`,
          `COALESCE(constraints_json->>'transferTimeSource', '') IN ('verified_pier_pickup', 'verified_meeting_point')`,
          `COALESCE(TRIM(constraints_json->>'transferEvidenceSource'), '') <> ''`,
          `(constraints_json->>'cruiseBufferBeforeMinutes') IS NOT NULL`,
          `COALESCE(pickup_type, 'UNKNOWN') <> 'UNKNOWN'`,
          `COALESCE((provenance_json->'rawFieldsVerified'->>'pickupKnown')::boolean, false) = true`,
          `(jsonb_array_length(COALESCE(product_options_json, '[]'::jsonb)) > 0 OR jsonb_typeof(service_details_json->'verifiedDepartureTimesLocal') = 'array')`,
        );
      }

      const whereSql = whereClauses.join(" AND ");
      const orderBySql = buildSqlOrderByClause(sortBy);
      const countFilterParams = [...params];

      let paginationSql = "";
      if (requestedLimit !== null) {
        const pLimit = addParam(requestedLimit);
        paginationSql += ` LIMIT ${pLimit}`;
      }
      if (requestedOffset > 0) {
        const pOffset = addParam(requestedOffset);
        paginationSql += ` OFFSET ${pOffset}`;
      }

      const querySql = `
        SELECT *, COUNT(*) OVER()::int AS total_matched_count
        FROM dcc_tour_catalog
        WHERE ${whereSql}
        ORDER BY ${orderBySql}${paginationSql}
      `;

      const t0 = performance.now();
      const rows = (await sql.query(querySql, params)) as Record<string, any>[];
      const sqlQueryMs = Math.round((performance.now() - t0) * 100) / 100;

      let totalMatched = rows.length > 0 ? Number(rows[0].total_matched_count ?? rows.length) : 0;
      if (rows.length === 0 && requestedOffset > 0) {
        const countRows = (await sql.query(
          `SELECT COUNT(*)::int AS cnt FROM dcc_tour_catalog WHERE ${whereSql}`,
          countFilterParams,
        )) as Record<string, any>[];
        totalMatched = countRows.length > 0 ? Number(countRows[0].cnt ?? 0) : 0;
      }

      const pilotMap = getNormalizedPilotMap();
      const mappedRecords = rows
        .map((r) => {
          const tourId = String(r.tour_id);
          if (pilotMap.has(tourId)) {
            return pilotMap.get(tourId)!;
          }
          return normalizeCatalogTourPickupAndMeeting(mapPgRowToDurableTourRecord(r)).normalizedRecord;
        })
        .filter(
          (r) =>
            r.active &&
            !isQuarantinedTourRecord(r) &&
            (!filter.requireVerifiedCruiseLogistics || hasVerifiedCruisePortLogistics(r)),
        );

      const effectiveLimit = requestedLimit ?? totalMatched;
      const hasMore = requestedOffset + mappedRecords.length < totalMatched;

      return {
        records: mappedRecords,
        totalMatched,
        storageSource: "postgres",
        limit: effectiveLimit,
        offset: requestedOffset,
        hasMore,
        nextOffset: hasMore ? requestedOffset + mappedRecords.length : null,
        executedInSql: true,
        rowsLoadedIntoApp: rows.length,
        fullCatalogLoadedIntoApp: false,
        sqlQueryMs,
      };
    } catch (err) {
      console.warn(
        "[durableCatalogStore] SQL catalog query failed, falling back to snapshot:",
        err,
      );
    }
  }

  const { records: allRecords, source } = await loadAllCatalogRecordsWithPgHydration();
  const approvedSet = approvedList ? new Set(approvedList) : null;
  const searchLower = filter.searchQuery?.trim().toLowerCase() || "";

  const filtered = allRecords.filter((rec) => {
    if (!rec.active || isQuarantinedTourRecord(rec)) return false;
    if (filter.includeDiscoveryOnly === false && rec.capabilityTier === "discovery_only") {
      return false;
    }
    if (resolvedDest && rec.destinationSlug.toLowerCase() !== resolvedDest) {
      return false;
    }
    if (resolvedPort && (rec.portSlug || "").toLowerCase() !== resolvedPort) {
      return false;
    }
    if (
      filter.earthosDestinationNodeId &&
      rec.earthosDestinationNodeId !== filter.earthosDestinationNodeId
    ) {
      return false;
    }
    if (filter.provider && rec.primaryProvider !== filter.provider) {
      return false;
    }
    if (filter.capabilityTier && rec.capabilityTier !== filter.capabilityTier) {
      return false;
    }
    if (filter.category && !matchesCatalogCategoryFilter(rec, filter.category)) {
      return false;
    }
    if (searchLower) {
      const hay = `${rec.title} ${rec.summary || ""} ${rec.category} ${rec.providerProductCode} ${rec.operatorName || ""}`.toLowerCase();
      if (!hay.includes(searchLower)) return false;
    }
    if (approvedSet) {
      const idMatch = approvedSet.has(rec.tourId.toLowerCase());
      const codeMatch = approvedSet.has(rec.providerProductCode.toLowerCase());
      const aliasMatch = rec.compatibilityAliases.some((a) => approvedSet.has(a.toLowerCase()));
      if (!idMatch && !codeMatch && !aliasMatch) {
        return false;
      }
    }
    if (filter.requireVerifiedCruiseLogistics && !hasVerifiedCruisePortLogistics(rec)) {
      return false;
    }
    return true;
  });

  const sorted = sortCatalogRecordsInJs(filtered, sortBy);
  const effectiveLimit = requestedLimit ?? sorted.length;
  const pageRecords = sorted.slice(requestedOffset, requestedOffset + effectiveLimit);
  const hasMore = requestedOffset + pageRecords.length < sorted.length;

  return {
    records: pageRecords,
    totalMatched: sorted.length,
    storageSource: source,
    limit: effectiveLimit,
    offset: requestedOffset,
    hasMore,
    nextOffset: hasMore ? requestedOffset + pageRecords.length : null,
    executedInSql: false,
    rowsLoadedIntoApp: pageRecords.length,
    fullCatalogLoadedIntoApp: requestedLimit === null,
    sqlQueryMs: null,
  };
}

export async function getDurableTourByIdOrAlias(idOrAlias: string): Promise<DurableTourRecord | null> {
  const norm = idOrAlias.trim().toLowerCase();
  if (!norm) return null;
  if (QUARANTINED_TOUR_IDS.has(idOrAlias.trim())) return null;

  for (const pilot of PILOT_VERIFIED_TOUR_RECORDS) {
    if (
      !isQuarantinedTourRecord(pilot) &&
      pilot.active &&
      (pilot.tourId.toLowerCase() === norm ||
        pilot.providerProductCode.toLowerCase() === norm ||
        pilot.compatibilityAliases.some((a) => a.toLowerCase() === norm))
    ) {
      return normalizeCatalogTourPickupAndMeeting(pilot).normalizedRecord;
    }
  }

  if (shouldUsePostgres()) {
    try {
      const sql = getSqlClient();
      const quarantinedArray = Array.from(QUARANTINED_TOUR_IDS);
      const rows = (await sql.query(
        `
          SELECT *
          FROM dcc_tour_catalog
          WHERE active = true
            AND quarantined = false
            AND NOT (tour_id = ANY($1::text[]))
            AND (
              LOWER(tour_id) = $2
              OR LOWER(provider_product_code) = $2
              OR EXISTS (
                SELECT 1
                FROM jsonb_array_elements_text(compatibility_aliases) a
                WHERE LOWER(a) = $2
              )
            )
          LIMIT 1
        `,
        [quarantinedArray, norm],
      )) as Record<string, any>[];
      if (rows.length > 0) {
        const mapped = normalizeCatalogTourPickupAndMeeting(
          mapPgRowToDurableTourRecord(rows[0]),
        ).normalizedRecord;
        if (mapped.active && !isQuarantinedTourRecord(mapped)) {
          return mapped;
        }
      }
      return null;
    } catch (err) {
      console.warn("[durableCatalogStore] SQL getDurableTourByIdOrAlias fallback:", err);
    }
  }

  const { records } = await loadAllCatalogRecordsWithPgHydration();
  return (
    records.find(
      (r) =>
        !isQuarantinedTourRecord(r) &&
        (r.tourId.toLowerCase() === norm ||
          r.providerProductCode.toLowerCase() === norm ||
          r.compatibilityAliases.some((a) => a.toLowerCase() === norm)),
    ) || null
  );
}

export type CatalogRefreshCheckpointRecord = {
  streamKey: string;
  provider: string;
  destinationSlug: string | null;
  cursorValue: string | null;
  nextStartOffset: number | null;
  providerTotalCount: number | null;
  status: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
};

const memoryCheckpointsByStream = new Map<string, CatalogRefreshCheckpointRecord>();

export async function loadSyncRunsWithPgHydration(): Promise<CatalogSyncRunRecord[]> {
  const snapshot = readLocalCatalogSnapshot();
  const byRunId = new Map<string, CatalogSyncRunRecord>();
  for (const r of snapshot.syncRuns) {
    byRunId.set(r.runId, r);
  }
  if (shouldUsePostgres()) {
    try {
      await ensureCatalogSchema();
      const sql = getSqlClient();
      const rows = await sql`
        SELECT * FROM dcc_catalog_sync_runs ORDER BY started_at DESC LIMIT 250
      `;
      for (const r of rows as any[]) {
        const mapped: CatalogSyncRunRecord = {
          runId: String(r.run_id),
          provider: String(r.provider),
          destinationSlug: String(r.destination_slug),
          status: r.status,
          cursorValue: r.cursor_value ? String(r.cursor_value) : null,
          importedCount: Number(r.imported_count || 0),
          updatedCount: Number(r.updated_count || 0),
          rejectedCount: Number(r.rejected_count || 0),
          upstreamRequestCount: Number(r.upstream_request_count || 0),
          rejectionReasons: r.rejection_reasons_json || {},
          metadata: r.metadata_json || {},
          startedAt: new Date(r.started_at).toISOString(),
          completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
        };
        byRunId.set(mapped.runId, mapped);
      }
    } catch {
      // Fallback to snapshot syncRuns
    }
  }
  return Array.from(byRunId.values()).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

export async function upsertRefreshCheckpoint(
  checkpoint: Omit<CatalogRefreshCheckpointRecord, "updatedAt"> & { updatedAt?: string },
): Promise<CatalogRefreshCheckpointRecord> {
  const nowIso = checkpoint.updatedAt || new Date().toISOString();
  const full: CatalogRefreshCheckpointRecord = {
    ...checkpoint,
    updatedAt: nowIso,
  };
  memoryCheckpointsByStream.set(full.streamKey, full);

  if (shouldUsePostgres()) {
    try {
      await ensureCatalogSchema();
      const sql = getSqlClient();
      await sql`
        INSERT INTO dcc_catalog_refresh_checkpoints (
          stream_key, provider, destination_slug, cursor_value,
          next_start_offset, provider_total_count, status, metadata_json, updated_at
        ) VALUES (
          ${full.streamKey},
          ${full.provider},
          ${full.destinationSlug},
          ${full.cursorValue},
          ${full.nextStartOffset},
          ${full.providerTotalCount},
          ${full.status},
          ${JSON.stringify(full.metadata)}::jsonb,
          ${full.updatedAt}::timestamptz
        )
        ON CONFLICT (stream_key) DO UPDATE SET
          provider = EXCLUDED.provider,
          destination_slug = EXCLUDED.destination_slug,
          cursor_value = EXCLUDED.cursor_value,
          next_start_offset = EXCLUDED.next_start_offset,
          provider_total_count = EXCLUDED.provider_total_count,
          status = EXCLUDED.status,
          metadata_json = EXCLUDED.metadata_json,
          updated_at = EXCLUDED.updated_at
      `;
    } catch (err) {
      console.warn("[durableCatalogStore] Failed upserting refresh checkpoint to Postgres:", err);
    }
  }
  return full;
}

export async function getRefreshCheckpoint(
  streamKey: string,
): Promise<CatalogRefreshCheckpointRecord | null> {
  if (shouldUsePostgres()) {
    try {
      await ensureCatalogSchema();
      const sql = getSqlClient();
      const rows = await sql`
        SELECT * FROM dcc_catalog_refresh_checkpoints WHERE stream_key = ${streamKey} LIMIT 1
      `;
      if (rows.length > 0) {
        const r = rows[0] as any;
        const mapped: CatalogRefreshCheckpointRecord = {
          streamKey: String(r.stream_key),
          provider: String(r.provider),
          destinationSlug: r.destination_slug ? String(r.destination_slug) : null,
          cursorValue: r.cursor_value ? String(r.cursor_value) : null,
          nextStartOffset:
            typeof r.next_start_offset === "number" && Number.isFinite(r.next_start_offset)
              ? r.next_start_offset
              : null,
          providerTotalCount:
            typeof r.provider_total_count === "number" && Number.isFinite(r.provider_total_count)
              ? r.provider_total_count
              : null,
          status: String(r.status || "idle"),
          metadata: r.metadata_json || {},
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
        };
        memoryCheckpointsByStream.set(streamKey, mapped);
        return mapped;
      }
    } catch {
      // Fallback to memory or syncRuns
    }
  }
  return memoryCheckpointsByStream.get(streamKey) || null;
}

export async function getLatestDestinationBackfillCheckpoint(destinationSlug: string): Promise<{
  destinationSlug: string;
  nextStartOffset: number;
  providerTotalCount: number | null;
  viatorImportedCount: number;
  coverageStatus: "sampled" | "complete";
  cursorValue: string | null;
  source: "postgres_checkpoint_table" | "postgres_sync_runs" | "snapshot_sync_runs";
}> {
  const { records, source: recordSource } = await loadAllCatalogRecordsWithPgHydration();
  const viatorImportedCount = records.filter(
    (r) =>
      r.destinationSlug === destinationSlug &&
      r.primaryProvider === "viator" &&
      r.active &&
      !isQuarantinedTourRecord(r),
  ).length;

  const ckpt = await getRefreshCheckpoint(`viator_backfill:${destinationSlug}`);
  const syncRuns = await loadSyncRunsWithPgHydration();
  const priorRun = syncRuns.find(
    (r) =>
      r.provider === "viator" &&
      r.destinationSlug === destinationSlug &&
      r.status === "completed",
  );

  const rawProviderTotal =
    ckpt?.providerTotalCount ??
    (typeof priorRun?.metadata?.providerTotalCount === "number"
      ? (priorRun.metadata.providerTotalCount as number)
      : null);
  const providerTotalCount =
    typeof rawProviderTotal === "number" && Number.isFinite(rawProviderTotal) && rawProviderTotal > 0
      ? rawProviderTotal
      : null;

  const isComplete =
    providerTotalCount !== null && viatorImportedCount >= providerTotalCount;

  const savedNextFromCkpt = ckpt?.nextStartOffset;
  const savedNextFromRun =
    typeof priorRun?.metadata?.nextStartOffset === "number"
      ? (priorRun.metadata.nextStartOffset as number)
      : null;

  let nextStartOffset =
    savedNextFromCkpt ??
    savedNextFromRun ??
    (viatorImportedCount > 0 ? viatorImportedCount + 1 : 1);
  if (providerTotalCount !== null && nextStartOffset > providerTotalCount) {
    nextStartOffset = 1;
  }

  return {
    destinationSlug,
    nextStartOffset: Math.max(1, nextStartOffset),
    providerTotalCount,
    viatorImportedCount,
    coverageStatus: isComplete ? "complete" : "sampled",
    cursorValue: ckpt?.cursorValue ?? priorRun?.cursorValue ?? null,
    source: ckpt
      ? "postgres_checkpoint_table"
      : recordSource === "postgres"
        ? "postgres_sync_runs"
        : "snapshot_sync_runs",
  };
}

export async function getDurableCatalogSummaryReport() {
  const { records, source } = await loadAllCatalogRecordsWithPgHydration();
  const snapshot = readLocalCatalogSnapshot();
  const sortedSyncRuns = await loadSyncRunsWithPgHydration();

  const latestSyncByDestination = new Map<string, CatalogSyncRunRecord>();
  for (const run of sortedSyncRuns) {
    if (run.provider === "viator" && run.status === "completed") {
      if (!latestSyncByDestination.has(run.destinationSlug)) {
        latestSyncByDestination.set(run.destinationSlug, run);
      }
    }
  }

  const byDestination: Record<
    string,
    {
      total: number;
      earthosNodeId: string;
      timeZone: string;
      coverageStatus: "sampled" | "complete";
      connectedProviderCatalogCoverageStatus:
        | "sampled_provider_catalog"
        | "complete_provider_catalog";
      connectedProviderCatalogCoverageLabel: string;
      providerTotalAvailableCount: number | null;
      importedCount: number;
      viatorImportedCount: number;
      viatorCoveragePercent: number | null;
      nextCursor: string | null;
      nextStartOffset: number | null;
      byCapabilityTier: Record<string, number>;
      byProvider: Record<string, number>;
      byPickupFulfillmentType: Record<string, number>;
      explicitUnknownCounts: {
        unknownDuration: number;
        unknownCancellation: number;
        unknownPickup: number;
        unknownMeetingCoordinates: number;
        unknownTransferBuffer: number;
      };
    }
  > = {};

  const byCapabilityTier: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  const byPickupFulfillmentType: Record<string, number> = {};

  for (const rec of records) {
    if (isQuarantinedTourRecord(rec)) continue;
    byCapabilityTier[rec.capabilityTier] = (byCapabilityTier[rec.capabilityTier] || 0) + 1;
    byProvider[rec.primaryProvider] = (byProvider[rec.primaryProvider] || 0) + 1;
    const pfType = rec.pickupFulfillmentType || "unknown";
    byPickupFulfillmentType[pfType] = (byPickupFulfillmentType[pfType] || 0) + 1;

    if (!byDestination[rec.destinationSlug]) {
      const latestRun = latestSyncByDestination.get(rec.destinationSlug);
      const rawProviderTotal = latestRun?.metadata?.providerTotalCount;
      const providerTotalAvailableCount =
        typeof rawProviderTotal === "number" && Number.isFinite(rawProviderTotal)
          ? rawProviderTotal
          : null;
      const rawNextStart = latestRun?.metadata?.nextStartOffset;
      const nextStartOffset =
        typeof rawNextStart === "number" && Number.isFinite(rawNextStart)
          ? rawNextStart
          : null;
      byDestination[rec.destinationSlug] = {
        total: 0,
        earthosNodeId: rec.earthosDestinationNodeId,
        timeZone: rec.timeZone,
        coverageStatus: "sampled",
        connectedProviderCatalogCoverageStatus: "sampled_provider_catalog",
        connectedProviderCatalogCoverageLabel: "Sampled coverage of connected provider catalog",
        providerTotalAvailableCount,
        importedCount: 0,
        viatorImportedCount: 0,
        viatorCoveragePercent: null,
        nextCursor: latestRun?.cursorValue || null,
        nextStartOffset,
        byCapabilityTier: {},
        byProvider: {},
        byPickupFulfillmentType: {},
        explicitUnknownCounts: {
          unknownDuration: 0,
          unknownCancellation: 0,
          unknownPickup: 0,
          unknownMeetingCoordinates: 0,
          unknownTransferBuffer: 0,
        },
      };
    }
    const d = byDestination[rec.destinationSlug];
    d.total += 1;
    d.importedCount += 1;
    if (rec.primaryProvider === "viator") {
      d.viatorImportedCount += 1;
    }
    d.byCapabilityTier[rec.capabilityTier] = (d.byCapabilityTier[rec.capabilityTier] || 0) + 1;
    d.byProvider[rec.primaryProvider] = (d.byProvider[rec.primaryProvider] || 0) + 1;
    d.byPickupFulfillmentType[pfType] = (d.byPickupFulfillmentType[pfType] || 0) + 1;

    if (rec.durationMinutes === null) d.explicitUnknownCounts.unknownDuration += 1;
    if (rec.freeCancellation === null) d.explicitUnknownCounts.unknownCancellation += 1;
    if (rec.hasHotelPickup === null) d.explicitUnknownCounts.unknownPickup += 1;
    if (rec.meetingPointLat === null || rec.meetingPointLng === null) {
      d.explicitUnknownCounts.unknownMeetingCoordinates += 1;
    }
    if (
      rec.constraints?.cruiseBufferBeforeMinutes === null ||
      rec.constraints?.cruiseBufferBeforeMinutes === undefined ||
      rec.constraints?.transferTimeSource === "unknown" ||
      rec.constraints?.transferTimeSource === "planning_estimate"
    ) {
      d.explicitUnknownCounts.unknownTransferBuffer += 1;
    }
  }

  const sampledDestinations: string[] = [];
  const completeDestinations: string[] = [];
  const alaskaSlugs = ["juneau", "skagway", "ketchikan", "seward", "denali"];
  const alaskaCompleteDestinations: string[] = [];

  for (const [slug, destStats] of Object.entries(byDestination)) {
    const viatorImported = destStats.byProvider["viator"] || 0;
    const directCount = destStats.importedCount - viatorImported;
    destStats.viatorImportedCount = viatorImported;
    if (
      destStats.providerTotalAvailableCount !== null &&
      destStats.providerTotalAvailableCount > 0
    ) {
      destStats.viatorCoveragePercent =
        Math.min(
          100,
          Math.round((viatorImported / destStats.providerTotalAvailableCount) * 1000) / 10,
        );
    }
    // Completeness is strictly defined as coverage of the connected provider's (Viator) catalog total for that destination
    if (
      destStats.providerTotalAvailableCount !== null &&
      destStats.providerTotalAvailableCount > 0 &&
      viatorImported >= destStats.providerTotalAvailableCount
    ) {
      destStats.coverageStatus = "complete";
      destStats.connectedProviderCatalogCoverageStatus = "complete_provider_catalog";
      destStats.connectedProviderCatalogCoverageLabel = `Complete coverage of connected Viator catalog (${viatorImported}/${destStats.providerTotalAvailableCount}, 100%)${directCount > 0 ? ` + ${directCount} authorized direct operator offers` : ""}`;
      completeDestinations.push(slug);
      if (alaskaSlugs.includes(slug)) {
        alaskaCompleteDestinations.push(slug);
      }
    } else {
      destStats.coverageStatus = "sampled";
      destStats.connectedProviderCatalogCoverageStatus = "sampled_provider_catalog";
      const pctStr =
        destStats.viatorCoveragePercent !== null ? `${destStats.viatorCoveragePercent}%` : "unknown %";
      destStats.connectedProviderCatalogCoverageLabel = `Sampled coverage of connected Viator catalog (${viatorImported}/${destStats.providerTotalAvailableCount ?? "?"} imported, ${pctStr})${directCount > 0 ? ` + ${directCount} authorized direct operator offers` : ""}`;
      sampledDestinations.push(slug);
    }
  }

  const totalRejectedRecords = sortedSyncRuns.reduce((acc, r) => acc + (r.rejectedCount || 0), 0);
  const totalUpstreamRequests = sortedSyncRuns.reduce(
    (acc, r) => acc + (r.upstreamRequestCount || 0),
    0,
  );
  const retiredRecordsCount = snapshot.records.filter(
    (r) => !isQuarantinedTourRecord(r) && r.active === false,
  ).length;
  const pickupNormalization = normalizeCatalogBatchPickupAndMeeting(
    records.filter((r) => !isQuarantinedTourRecord(r)),
  );

  return {
    storageSource: source,
    totalImportedRecords: records.length,
    totalDestinationsCovered: Object.keys(byDestination).length,
    quarantinedRecordsExcludedCount: QUARANTINED_TOUR_IDS.size,
    quarantinedTourIds: Array.from(QUARANTINED_TOUR_IDS),
    retiredRecordsExcludedCount: retiredRecordsCount,
    destinationCoverageBreakdown: {
      coverageBasis: "connected_provider_catalog_total",
      coverageBasisDescription:
        "Completeness measures imported active products against the connected provider's (Viator Partner API v2) total available catalog count for each destination, plus authorized direct operator feeds (FareHarbor, GoSno, PARR).",
      totalDestinations: Object.keys(byDestination).length,
      sampledDestinationsCount: sampledDestinations.length,
      completeDestinationsCount: completeDestinations.length,
      sampledDestinations,
      completeDestinations,
      alaskaCompleteDestinationsCount: alaskaCompleteDestinations.length,
      alaskaTotalDestinationsCount: alaskaSlugs.length,
      alaskaCompleteDestinations,
    },
    pickupAndMeetingNormalization: {
      ...pickupNormalization.summary,
      sampleReviewDeskExceptions: pickupNormalization.exceptions.slice(0, 15),
      reviewDeskSyncOrigin: "catalog_pickup_normalizer_exception_queue",
    },
    totalRejectedRecords,
    totalUpstreamRequestsDuringSync: totalUpstreamRequests,
    byCapabilityTier,
    byProvider,
    byPickupFulfillmentType,
    byDestination,
    recentSyncRuns: sortedSyncRuns.slice(0, 25),
    widgetPlacements: getWidgetPlacementReport(),
    wtaStatus: "paused",
  };
}

export async function retireDurableTourRecord(
  tourIdOrProviderCode: string,
  reason = "retired_or_inactive_in_provider_feed",
): Promise<{ retired: boolean; tourId: string | null }> {
  const norm = tourIdOrProviderCode.trim().toLowerCase();
  if (!norm) return { retired: false, tourId: null };

  const snapshot = readLocalCatalogSnapshot();
  const nowIso = new Date().toISOString();
  let matchedTourId: string | null = null;

  const updatedRecords = snapshot.records.map((rec) => {
    const isMatch =
      rec.tourId.toLowerCase() === norm ||
      rec.providerProductCode.toLowerCase() === norm ||
      rec.compatibilityAliases.some((a) => a.toLowerCase() === norm);
    if (!isMatch) return rec;
    matchedTourId = rec.tourId;
    return {
      ...rec,
      active: false,
      retiredAt: nowIso,
      retirementReason: reason,
      updatedAt: nowIso,
    };
  });

  if (matchedTourId) {
    writeLocalCatalogSnapshot(updatedRecords, snapshot.syncRuns);
    memoryCatalogCache = updatedRecords.filter((r) => r.active && !isQuarantinedTourRecord(r));
  }

  if (shouldUsePostgres()) {
    try {
      await ensureCatalogSchema();
      const sql = getSqlClient();
      const rows = await sql`
        UPDATE dcc_tour_catalog
        SET active = false,
            service_details_json = COALESCE(service_details_json, '{}'::jsonb) || ${JSON.stringify({
              retiredAt: nowIso,
              retirementReason: reason,
            })}::jsonb,
            updated_at = now()
        WHERE LOWER(tour_id) = ${norm}
           OR LOWER(provider_product_code) = ${norm}
        RETURNING tour_id
      `;
      if (rows.length > 0 && !matchedTourId) {
        matchedTourId = String(rows[0].tour_id);
      }
      memoryCatalogCache = null;
    } catch (err) {
      console.error("[durableCatalogStore] Failed retiring record in Postgres:", err);
    }
  }

  return { retired: Boolean(matchedTourId), tourId: matchedTourId };
}
