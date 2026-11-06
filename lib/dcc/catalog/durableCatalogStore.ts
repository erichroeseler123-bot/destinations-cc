import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { DCC_VIATOR_PRODUCT_MAPPINGS } from "@/lib/viator/mappings";
import { getWidgetPlacementReport } from "./widgetPlacements";

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
  region: "gulf_coast" | "alaska" | "caribbean" | "us_mainland_ports" | "colorado_rockies";
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
};

export function resolveEarthOSDestinationNode(slugOrName: string): EarthOSDestinationNode | null {
  const norm = slugOrName
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
      for (const rec of recordsToPersistInPg) {
        await upsertSingleTourToPg(sql, rec);
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
      "Guided covered bayou boat excursion through the Jean Lafitte National Historical Park and Barataria Preserve with confirmed round-trip shuttle pickup at Hotel Monteleone (214 Royal St, French Quarter — FareHarbor pickup option #22056428).",
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
    commissionAuthorized: true,
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
      "Round-trip French Quarter hotel shuttle pickup confirmed at Hotel Monteleone (214 Royal St — FareHarbor pickup option #22056428, +$30/person), or self-drive to 6601 Leo Kerner Lafitte Pkwy ($32/adult).",
    meetingPointName:
      "Hotel Monteleone — Royal Street Main Entrance (214 Royal St) / Jean Lafitte Barataria Dock",
    meetingPointAddress:
      "214 Royal St, New Orleans, LA 70130 (Shuttle) / 6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072 (Dock)",
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
        name: "Jean Lafitte Swamp Tour Dock (Barataria Preserve)",
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
        "Hotel Monteleone (214 Royal St, French Quarter — FareHarbor Pickup Option #22056428) <-> Jean Lafitte Barataria Dock (6601 Leo Kerner Lafitte Pkwy)",
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
        commissionAuthorized: true,
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
        commissionAuthorized: true,
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
          "90-minute guided covered bayou boat tour ($32/adult) plus round-trip hotel shuttle pickup at Hotel Monteleone (+$30/person; FareHarbor hotel pickup option #22056428).",
        includesPickup: true,
        pickupFulfillmentType: "hotel_pickup",
        meetingPointName:
          "Hotel Monteleone — Royal Street Main Entrance (214 Royal St, New Orleans, LA 70130)",
        meetingPointLat: 29.9542,
        meetingPointLng: -90.0681,
        transferBeforeMinutes: 45,
        transferAfterMinutes: 45,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource: "fareharbor_custom_field_12258400:hotel_monteleone_22056428",
        applicableBerthOrMeetingPoint:
          "Hotel Monteleone (214 Royal St, French Quarter — FareHarbor Pickup Option #22056428)",
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
          "90-minute guided covered bayou boat tour ($32/adult) meeting directly at the Barataria Preserve dock (no hotel shuttle).",
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
      fareharborHotelPickupCustomFieldId: 12258400,
      fareharborHotelMonteleoneOptionValue: "number:22056428",
      fareharborTransportationCountCustomFieldId: 12210745,
      onlineBookingFeeRate: 0.06,
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
];

function mergePilotVerifiedRecords(records: DurableTourRecord[]): DurableTourRecord[] {
  const byId = new Map<string, DurableTourRecord>();
  for (const r of records) {
    byId.set(r.tourId, r);
  }
  for (const pilot of PILOT_VERIFIED_TOUR_RECORDS) {
    byId.set(pilot.tourId, pilot);
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

export type DurableCatalogQueryFilter = {
  destinationSlug?: string;
  portSlug?: string;
  earthosDestinationNodeId?: string;
  provider?: string;
  capabilityTier?: TourCapabilityTier;
  category?: string;
  approvedTourIds?: string[];
  includeDiscoveryOnly?: boolean;
  limit?: number;
};

export async function queryDurableTourCatalog(filter: DurableCatalogQueryFilter = {}): Promise<{
  records: DurableTourRecord[];
  totalMatched: number;
  storageSource: "postgres" | "snapshot_hydrated_to_postgres" | "local_snapshot";
}> {
  const { records: allRecords, source } = await loadAllCatalogRecordsWithPgHydration();

  const resolvedDest = filter.destinationSlug
    ? resolveEarthOSDestinationNode(filter.destinationSlug)?.destinationSlug ||
      filter.destinationSlug.toLowerCase()
    : null;
  const resolvedPort = filter.portSlug
    ? resolveEarthOSDestinationNode(filter.portSlug)?.portSlug || filter.portSlug.toLowerCase()
    : null;
  const approvedSet =
    Array.isArray(filter.approvedTourIds) && filter.approvedTourIds.length > 0
      ? new Set(filter.approvedTourIds.map((id) => id.trim().toLowerCase()))
      : null;

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
    if (filter.category) {
      const recCat = rec.category.trim().toLowerCase();
      const filterCat = filter.category
        .trim()
        .toLowerCase()
        .replace(/\s+(?:tours|excursions)$/i, "");
      if (!recCat.includes(filterCat) && !filterCat.includes(recCat)) {
        return false;
      }
    }
    if (approvedSet) {
      const idMatch = approvedSet.has(rec.tourId.toLowerCase());
      const codeMatch = approvedSet.has(rec.providerProductCode.toLowerCase());
      const aliasMatch = rec.compatibilityAliases.some((a) => approvedSet.has(a.toLowerCase()));
      if (!idMatch && !codeMatch && !aliasMatch) {
        return false;
      }
    }
    return true;
  });

  const limit = filter.limit && filter.limit > 0 ? filter.limit : filtered.length;
  return {
    records: filtered.slice(0, limit),
    totalMatched: filtered.length,
    storageSource: source,
  };
}

export async function getDurableTourByIdOrAlias(idOrAlias: string): Promise<DurableTourRecord | null> {
  const norm = idOrAlias.trim().toLowerCase();
  if (!norm) return null;
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
