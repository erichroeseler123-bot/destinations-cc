import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { DCC_VIATOR_PRODUCT_MAPPINGS } from "@/lib/viator/mappings";

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

export type TourProductOptionRecord = {
  optionCode: string;
  title: string;
  description: string | null;
  includesPickup: boolean | null;
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
  pickupType:
    | "HOTEL_PICKUP"
    | "MEETING_POINT_ONLY"
    | "HOTEL_OR_MEETING_POINT"
    | "CRUISE_PIER_PICKUP"
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
  if (!pgSchemaReadyPromise) {
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
      ${JSON.stringify(record.serviceDetails || {})}::jsonb,
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
  for (const rec of records) {
    if (isQuarantinedTourRecord(rec)) {
      byId.delete(rec.tourId);
    } else {
      const existing = byId.get(rec.tourId);
      if (
        existing &&
        (!rec.productOptions || rec.productOptions.length === 0) &&
        existing.productOptions &&
        existing.productOptions.length > 0
      ) {
        byId.set(rec.tourId, {
          ...rec,
          productOptions: existing.productOptions,
          lowestPriceIncludesPickup:
            rec.lowestPriceIncludesPickup ?? existing.lowestPriceIncludesPickup,
          hasHotelPickup: rec.hasHotelPickup ?? existing.hasHotelPickup,
          ageBands:
            rec.ageBands && rec.ageBands.length > 0 ? rec.ageBands : existing.ageBands,
        });
      } else {
        byId.set(rec.tourId, rec);
      }
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
      for (const rec of records) {
        await upsertSingleTourToPg(sql, byId.get(rec.tourId) || rec);
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
      records: memoryCatalogCache.filter((r) => r.active && !isQuarantinedTourRecord(r)),
      source: memoryCatalogSource,
    };
  }

  if (shouldUsePostgres()) {
    try {
      await ensureCatalogSchema();
      const sql = getSqlClient();
      const rows = await sql`
        SELECT * FROM dcc_tour_catalog WHERE active = true AND quarantined = false ORDER BY destination_slug, tour_id
      `;
      if (rows.length > 0) {
        const mapped = rows.map(mapPgRowToDurableTourRecord).filter((r) => r.active && !isQuarantinedTourRecord(r));
        memoryCatalogCache = mapped;
        memoryCatalogLoadedAt = Date.now();
        memoryCatalogSource = "postgres";
        return { records: mapped, source: "postgres" };
      }

      // If Postgres is empty on first query (e.g., fresh production DB), auto-hydrate from committed snapshot
      const snapshot = readLocalCatalogSnapshot();
      const activeSnapshotRecords = snapshot.records.filter((r) => r.active && !isQuarantinedTourRecord(r));
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
      records: memoryCatalogCache.filter((r) => r.active && !isQuarantinedTourRecord(r)),
      source: "local_snapshot",
    };
  }
  const snapshot = readLocalCatalogSnapshot();
  const activeRecords = snapshot.records.filter((r) => r.active && !isQuarantinedTourRecord(r));
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
    if (
      filter.category &&
      !rec.category.toLowerCase().includes(filter.category.trim().toLowerCase())
    ) {
      return false;
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

export async function getDurableCatalogSummaryReport() {
  const { records, source } = await loadAllCatalogRecordsWithPgHydration();
  const snapshot = readLocalCatalogSnapshot();

  let syncRuns = snapshot.syncRuns;
  if (shouldUsePostgres()) {
    try {
      const sql = getSqlClient();
      const rows = await sql`
        SELECT * FROM dcc_catalog_sync_runs ORDER BY started_at DESC LIMIT 50
      `;
      if (rows.length > 0) {
        syncRuns = rows.map((r: any) => ({
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
        }));
      }
    } catch {
      // Fallback to snapshot syncRuns
    }
  }

  // Index latest Viator sync run per destination to report sampled vs complete coverage
  const sortedSyncRuns = [...syncRuns].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
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
      providerTotalAvailableCount: number | null;
      importedCount: number;
      nextCursor: string | null;
      byCapabilityTier: Record<string, number>;
      byProvider: Record<string, number>;
      explicitUnknownCounts: {
        unknownDuration: number;
        unknownCancellation: number;
        unknownPickup: number;
        unknownMeetingCoordinates: number;
      };
    }
  > = {};

  const byCapabilityTier: Record<string, number> = {};
  const byProvider: Record<string, number> = {};

  for (const rec of records) {
    if (isQuarantinedTourRecord(rec)) continue;
    byCapabilityTier[rec.capabilityTier] = (byCapabilityTier[rec.capabilityTier] || 0) + 1;
    byProvider[rec.primaryProvider] = (byProvider[rec.primaryProvider] || 0) + 1;

    if (!byDestination[rec.destinationSlug]) {
      const latestRun = latestSyncByDestination.get(rec.destinationSlug);
      const rawProviderTotal = latestRun?.metadata?.providerTotalCount;
      const providerTotalAvailableCount =
        typeof rawProviderTotal === "number" && Number.isFinite(rawProviderTotal)
          ? rawProviderTotal
          : null;
      byDestination[rec.destinationSlug] = {
        total: 0,
        earthosNodeId: rec.earthosDestinationNodeId,
        timeZone: rec.timeZone,
        coverageStatus: "sampled",
        providerTotalAvailableCount,
        importedCount: 0,
        nextCursor: latestRun?.cursorValue || null,
        byCapabilityTier: {},
        byProvider: {},
        explicitUnknownCounts: {
          unknownDuration: 0,
          unknownCancellation: 0,
          unknownPickup: 0,
          unknownMeetingCoordinates: 0,
        },
      };
    }
    const d = byDestination[rec.destinationSlug];
    d.total += 1;
    d.importedCount += 1;
    d.byCapabilityTier[rec.capabilityTier] = (d.byCapabilityTier[rec.capabilityTier] || 0) + 1;
    d.byProvider[rec.primaryProvider] = (d.byProvider[rec.primaryProvider] || 0) + 1;

    if (rec.durationMinutes === null) d.explicitUnknownCounts.unknownDuration += 1;
    if (rec.freeCancellation === null) d.explicitUnknownCounts.unknownCancellation += 1;
    if (rec.hasHotelPickup === null) d.explicitUnknownCounts.unknownPickup += 1;
    if (rec.meetingPointLat === null || rec.meetingPointLng === null) {
      d.explicitUnknownCounts.unknownMeetingCoordinates += 1;
    }
  }

  const sampledDestinations: string[] = [];
  const completeDestinations: string[] = [];

  for (const [slug, destStats] of Object.entries(byDestination)) {
    const viatorImported = destStats.byProvider["viator"] || 0;
    const latestRun = latestSyncByDestination.get(slug);
    const runCoverage = latestRun?.metadata?.coverageStatus;
    if (
      runCoverage === "complete" ||
      (destStats.providerTotalAvailableCount !== null &&
        destStats.providerTotalAvailableCount > 0 &&
        viatorImported >= destStats.providerTotalAvailableCount)
    ) {
      destStats.coverageStatus = "complete";
      completeDestinations.push(slug);
    } else {
      destStats.coverageStatus = "sampled";
      sampledDestinations.push(slug);
    }
  }

  const totalRejectedRecords = syncRuns.reduce((acc, r) => acc + (r.rejectedCount || 0), 0);
  const totalUpstreamRequests = syncRuns.reduce((acc, r) => acc + (r.upstreamRequestCount || 0), 0);

  return {
    storageSource: source,
    totalImportedRecords: records.length,
    totalDestinationsCovered: Object.keys(byDestination).length,
    quarantinedRecordsExcludedCount: QUARANTINED_TOUR_IDS.size,
    quarantinedTourIds: Array.from(QUARANTINED_TOUR_IDS),
    destinationCoverageBreakdown: {
      totalDestinations: Object.keys(byDestination).length,
      sampledDestinationsCount: sampledDestinations.length,
      completeDestinationsCount: completeDestinations.length,
      sampledDestinations,
      completeDestinations,
    },
    totalRejectedRecords,
    totalUpstreamRequestsDuringSync: totalUpstreamRequests,
    byCapabilityTier,
    byProvider,
    byDestination,
    recentSyncRuns: syncRuns.slice(0, 20),
    wtaStatus: "paused",
  };
}
