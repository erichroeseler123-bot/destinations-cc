import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { setViatorClientForTests } from "../../lib/viator/client";
import {
  GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID,
  acquireCatalogRefreshExecutionLease,
  clearDurableCatalogCachesForTests,
  mapPgRowToDurableTourRecord,
  normalizeCatalogTourPickupAndMeeting,
  releaseCatalogRefreshExecutionLease,
  resetCatalogRefreshExecutionLeaseForTests,
  setCatalogSqlQueryExecutorForTests,
  type DurableTourRecord,
} from "../../lib/dcc/catalog/durableCatalogStore";
const GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY = "viator_products_modified_since";
const GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY =
  "viator_availability_schedules_modified_since";
import {
  GET,
  POST,
  SCHEDULED_CATALOG_REFRESH_CRON,
  SCHEDULED_CATALOG_REFRESH_DEFAULT_COUNT,
  SCHEDULED_CATALOG_REFRESH_DEFAULT_PRODUCT_MAX_PAGES,
  SCHEDULED_CATALOG_REFRESH_DEFAULT_PRODUCT_MAX_REQUESTS,
  SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_MAX_PAGES,
  SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_MAX_REQUESTS,
  isCatalogRefreshCronPaused,
  maxDuration,
} from "../../app/api/cron/catalog-refresh/route";

const REPO_ROOT = process.cwd();

function makeDurableTourFixture(
  code: string,
  destinationSlug: string,
  fromPriceCents: number,
): DurableTourRecord {
  const base: DurableTourRecord = {
    tourId: `dcc:tour:viator:${code}`,
    compatibilityAliases: [code, `viator:${code}`],
    destinationSlug,
    portSlug: destinationSlug,
    earthosDestinationNodeId: `earthos:node:${destinationSlug}`,
    timeZone: "America/Juneau",
    title: `Scheduled Refresh Fixture ${code}`,
    summary: `Verified fixture for ${code}`,
    category: "Shore Excursions",
    tags: ["viator"],
    primaryProvider: "viator",
    providerProductCode: code,
    operatorName: "Fixture Operator",
    operatorCode: "fixture-op",
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 180,
    durationRawText: "3 hours",
    fromPriceCents,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "Free cancellation up to 24 hours before start.",
    hasHotelPickup: true,
    lowestPriceIncludesPickup: true,
    pickupType: "HOTEL",
    pickupFulfillmentType: "hotel_pickup",
    pickupSummary: "Hotel pickup included",
    meetingPointName: "Main Dock",
    meetingPointAddress: "100 Harbor Way",
    meetingPointLat: 58.3019,
    meetingPointLng: -134.4197,
    locationPrecision: "exact_coordinates",
    pickupLocations: [],
    ageBands: [{ ageBand: "ADULT", minAge: 13, maxAge: 99 }],
    constraints: {
      cruiseBufferBeforeMinutes: 45,
      cruiseBufferAfterMinutes: 60,
      transferTimeSource: "verified_coordinates",
    },
    channelOffers: [
      {
        channel: "viator",
        providerProductCode: code,
        bookingUrl: `https://www.viator.com/tours/x/${code}`,
        fromPriceCents,
        currency: "USD",
        commissionAuthorized: true,
      },
    ],
    productOptions: [
      {
        optionCode: "TG1",
        title: "Morning Departure",
        description: "Standard option",
        fromPriceCents,
        priceBasis: "per_person",
        pickupIncluded: true,
        pickupFulfillmentType: "hotel_pickup",
        scheduledStartTimes: ["09:00"],
      },
    ],
    serviceDetails: {
      pickupFulfillmentType: "hotel_pickup",
      viatorProductCode: code,
    },
    inclusions: ["Guide"],
    exclusions: ["Gratuities"],
    primaryImageUrl: "https://media.tacdn.com/media/fixture.jpg",
    ratingAverage: 4.9,
    reviewCount: 55,
    bookingUrl: `https://www.viator.com/tours/x/${code}`,
    provenance: {
      sourceSystem: "viator_partner_v2",
      sourceEndpoint: "/products/bulk+/availability/schedules/bulk",
      fetchedAt: "2026-11-18T00:00:00.000Z",
      contentSha256: "init_sha",
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
    lastVerifiedAt: "2026-11-18T00:00:00.000Z",
    updatedAt: "2026-11-18T00:00:00.000Z",
    createdAt: "2026-11-18T00:00:00.000Z",
  };
  return normalizeCatalogTourPickupAndMeeting(base).normalizedRecord;
}

function recordToPgRow(rec: DurableTourRecord): Record<string, any> {
  return {
    tour_id: rec.tourId,
    compatibility_aliases: rec.compatibilityAliases,
    destination_slug: rec.destinationSlug,
    port_slug: rec.portSlug,
    earthos_destination_node_id: rec.earthosDestinationNodeId,
    time_zone: rec.timeZone,
    title: rec.title,
    summary: rec.summary,
    category: rec.category,
    tags: rec.tags,
    primary_provider: rec.primaryProvider,
    provider_product_code: rec.providerProductCode,
    operator_name: rec.operatorName,
    operator_code: rec.operatorCode,
    capability_tier: rec.capabilityTier,
    commission_authorized: rec.commissionAuthorized,
    duration_minutes: rec.durationMinutes,
    duration_raw_text: rec.durationRawText,
    from_price_cents: rec.fromPriceCents,
    price_basis: rec.priceBasis,
    currency: rec.currency,
    free_cancellation: rec.freeCancellation,
    cancellation_policy_type: rec.cancellationPolicyType,
    cancellation_cutoff_hours: rec.cancellationCutoffHours,
    cancellation_summary: rec.cancellationSummary,
    has_hotel_pickup: rec.hasHotelPickup,
    lowest_price_includes_pickup: rec.lowestPriceIncludesPickup,
    pickup_type: rec.pickupType,
    pickup_summary: rec.pickupSummary,
    meeting_point_name: rec.meetingPointName,
    meeting_point_address: rec.meetingPointAddress,
    meeting_point_lat: rec.meetingPointLat,
    meeting_point_lng: rec.meetingPointLng,
    location_precision: rec.locationPrecision,
    pickup_locations_json: rec.pickupLocations,
    age_bands_json: rec.ageBands,
    constraints_json: rec.constraints,
    channel_offers_json: rec.channelOffers,
    product_options_json: rec.productOptions,
    service_details_json: rec.serviceDetails,
    inclusions_json: rec.inclusions,
    exclusions_json: rec.exclusions,
    primary_image_url: rec.primaryImageUrl,
    rating_average: rec.ratingAverage,
    review_count: rec.reviewCount,
    booking_url: rec.bookingUrl,
    provenance_json: rec.provenance,
    quarantined: rec.quarantined,
    quarantine_reason: rec.quarantineReason,
    active: rec.active,
    last_verified_at: rec.lastVerifiedAt,
    updated_at: rec.updatedAt,
    created_at: rec.createdAt,
  };
}

function createSimulatedCronPostgresState(initialTours: DurableTourRecord[]) {
  const catalogByTourId = new Map<string, Record<string, any>>();
  for (const t of initialTours) {
    catalogByTourId.set(t.tourId, structuredClone(recordToPgRow(t)));
  }
  const checkpointsByKey = new Map<string, Record<string, any>>();
  const syncRunsById = new Map<string, Record<string, any>>();
  let catalogUpdateStatements = 0;

  let stagedCatalog: Map<string, Record<string, any>> | null = null;
  let stagedCheckpoints: Map<string, Record<string, any>> | null = null;
  let inTx = false;

  const executor = async (queryText: string, params: unknown[] = []): Promise<Record<string, any>[]> => {
    const q = queryText.trim();
    const catMap = inTx && stagedCatalog ? stagedCatalog : catalogByTourId;
    const ckptMap = inTx && stagedCheckpoints ? stagedCheckpoints : checkpointsByKey;

    if (q === "BEGIN") {
      inTx = true;
      stagedCatalog = new Map(
        Array.from(catalogByTourId.entries()).map(([k, v]) => [k, structuredClone(v)]),
      );
      stagedCheckpoints = new Map(
        Array.from(checkpointsByKey.entries()).map(([k, v]) => [k, structuredClone(v)]),
      );
      return [];
    }
    if (q === "COMMIT") {
      if (inTx && stagedCatalog && stagedCheckpoints) {
        catalogByTourId.clear();
        for (const [k, v] of stagedCatalog.entries()) catalogByTourId.set(k, v);
        checkpointsByKey.clear();
        for (const [k, v] of stagedCheckpoints.entries()) checkpointsByKey.set(k, v);
      }
      inTx = false;
      stagedCatalog = null;
      stagedCheckpoints = null;
      return [];
    }
    if (q === "ROLLBACK") {
      inTx = false;
      stagedCatalog = null;
      stagedCheckpoints = null;
      return [];
    }

    // Distributed lease lock acquire
    if (
      q.includes("INSERT INTO dcc_catalog_sync_runs") &&
      params[0] === GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID
    ) {
      const holderId = String(params[1]);
      const leaseExpiresAtIso = String(params[2]);
      const acquiredAtIso = String(params[3]);
      const nowMs = Date.parse(acquiredAtIso) || Date.now();
      const existing = syncRunsById.get(GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID);
      const existingExpMs = existing?.metadata_json?.leaseExpiresAt
        ? Date.parse(String(existing.metadata_json.leaseExpiresAt))
        : 0;
      if (
        !existing ||
        existing.status !== "running" ||
        !Number.isFinite(existingExpMs) ||
        existingExpMs <= nowMs
      ) {
        syncRunsById.set(GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID, {
          run_id: GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID,
          provider: "dcc_cron_lock",
          destination_slug: "multi-destination",
          status: "running",
          cursor_value: null,
          metadata_json: {
            holderId,
            leaseExpiresAt: leaseExpiresAtIso,
            acquiredAt: acquiredAtIso,
          },
          started_at: acquiredAtIso,
          completed_at: null,
        });
        return [{ run_id: GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID }];
      }
      return [];
    }

    // Distributed lease lock release
    if (
      q.includes("UPDATE dcc_catalog_sync_runs") &&
      params[0] === GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID
    ) {
      const releasedAtIso = String(params[1]);
      const holderId = String(params[2]);
      const existing = syncRunsById.get(GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID);
      if (existing && existing.metadata_json?.holderId === holderId) {
        existing.status = "completed";
        existing.completed_at = releasedAtIso;
        return [{ run_id: GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID }];
      }
      return [];
    }

    // Active provider codes
    if (
      (q.includes("SELECT UPPER(provider_product_code) AS code") ||
        q.includes("SELECT provider_product_code")) &&
      q.includes("FROM dcc_tour_catalog")
    ) {
      const prov = String(params[1] || "viator").toLowerCase();
      return Array.from(catMap.values())
        .filter(
          (r) =>
            r.active && !r.quarantined && String(r.primary_provider).toLowerCase() === prov,
        )
        .map((r) => ({
          code: String(r.provider_product_code).toUpperCase(),
          provider_product_code: r.provider_product_code,
        }));
    }

    // Lookup by provider product codes
    if (
      q.includes("FROM dcc_tour_catalog") &&
      (q.includes("UPPER(provider_product_code) = ANY($3::text[])") ||
        q.includes("UPPER(provider_product_code) = ANY($2::text[])"))
    ) {
      const hasQuarantinedFirst = q.includes("UPPER(provider_product_code) = ANY($3::text[])");
      const prov = String(params[hasQuarantinedFirst ? 1 : 0] || "viator").toLowerCase();
      const rawCodes = (params[hasQuarantinedFirst ? 2 : 1] as string[]) || [];
      const codes = new Set(rawCodes.map((c) => c.toUpperCase()));
      return Array.from(catMap.values())
        .filter(
          (r) =>
            r.active &&
            !r.quarantined &&
            String(r.primary_provider).toLowerCase() === prov &&
            codes.has(String(r.provider_product_code).toUpperCase()),
        )
        .map((r) => ({
          ...structuredClone(r),
          sd_pickup_fulfillment_type: r.service_details_json?.pickupFulfillmentType ?? null,
          prov_pickup_known: Boolean(r.provenance_json?.rawFieldsVerified?.pickupKnown),
          prov_source_system: r.provenance_json?.sourceSystem ?? r.primary_provider,
          prov_source_endpoint: r.provenance_json?.sourceEndpoint ?? "db",
          prov_fetched_at: r.provenance_json?.fetchedAt ?? r.last_verified_at,
        }));
    }

    // Global / stream checkpoint SELECT
    if (q.includes("FROM dcc_catalog_refresh_checkpoints") && q.includes("WHERE stream_key = $1")) {
      const key = String(params[0]);
      const hit = ckptMap.get(key);
      if (!hit) return [];
      return [structuredClone(hit)];
    }

    // Checkpoint UPSERT
    if (q.includes("INSERT INTO dcc_catalog_refresh_checkpoints")) {
      const row = {
        stream_key: String(params[0]),
        provider: String(params[1]),
        destination_slug: params[2] === null || params[2] === undefined ? null : String(params[2]),
        cursor_value: params[3] === null || params[3] === undefined ? null : String(params[3]),
        next_start_offset: params[4] === null || params[4] === undefined ? null : Number(params[4]),
        provider_total_count: params[5] === null || params[5] === undefined ? null : Number(params[5]),
        status: String(params[6]),
        metadata_json: typeof params[7] === "string" ? JSON.parse(params[7]) : params[7] || {},
        updated_at: params[8] ? String(params[8]) : new Date().toISOString(),
      };
      ckptMap.set(row.stream_key, row);
      return [];
    }

    // Catalog targeted refresh UPDATE
    if (q.startsWith("UPDATE dcc_tour_catalog") && q.includes("WHERE tour_id = $1")) {
      catalogUpdateStatements += 1;
      const tourId = String(params[0]);
      const existing = catMap.get(tourId);
      if (existing) {
        const servicePatch = JSON.parse(String(params[24] || "{}"));
        const provPatch = JSON.parse(String(params[25] || "{}"));
        const constraintsPatch = JSON.parse(String(params[22] || "{}"));
        catMap.set(tourId, {
          ...existing,
          title: params[2],
          summary: params[3],
          duration_minutes: params[4],
          duration_raw_text: params[5],
          from_price_cents: params[6],
          price_basis: params[7],
          currency: params[8],
          free_cancellation: params[9],
          cancellation_policy_type: params[10],
          cancellation_cutoff_hours: params[11],
          cancellation_summary: params[12],
          has_hotel_pickup: params[13],
          lowest_price_includes_pickup: params[14],
          pickup_type: params[15],
          pickup_summary: params[16],
          meeting_point_name: params[17],
          meeting_point_address: params[18],
          meeting_point_lat: params[19],
          meeting_point_lng: params[20],
          location_precision: params[21],
          constraints_json: { ...(existing.constraints_json || {}), ...constraintsPatch },
          product_options_json: JSON.parse(String(params[23] || "[]")),
          service_details_json: { ...(existing.service_details_json || {}), ...servicePatch },
          provenance_json: { ...(existing.provenance_json || {}), ...provPatch },
          last_verified_at: params[26],
          updated_at: params[27],
        });
      }
      return [];
    }

    // Catalog UPSERT
    if (q.includes("INSERT INTO dcc_tour_catalog")) {
      catalogUpdateStatements += 1;
      const tourId = String(params[0]);
      const existing = catMap.get(tourId) || {};
      const updated: Record<string, any> = {
        ...existing,
        tour_id: tourId,
        compatibility_aliases: params[1],
        destination_slug: params[2],
        port_slug: params[3],
        earthos_destination_node_id: params[4],
        time_zone: params[5],
        title: params[6],
        summary: params[7],
        category: params[8],
        tags: params[9],
        primary_provider: params[10],
        provider_product_code: params[11],
        operator_name: params[12],
        operator_code: params[13],
        capability_tier: params[14],
        commission_authorized: params[15],
        duration_minutes: params[16],
        duration_raw_text: params[17],
        from_price_cents: params[18],
        price_basis: params[19],
        currency: params[20],
        free_cancellation: params[21],
        cancellation_policy_type: params[22],
        cancellation_cutoff_hours: params[23],
        cancellation_summary: params[24],
        has_hotel_pickup: params[25],
        lowest_price_includes_pickup: params[26],
        pickup_type: params[27],
        pickup_summary: params[28],
        meeting_point_name: params[29],
        meeting_point_address: params[30],
        meeting_point_lat: params[31],
        meeting_point_lng: params[32],
        location_precision: params[33],
        pickup_locations_json: JSON.parse(String(params[34] || "[]")),
        age_bands_json: JSON.parse(String(params[35] || "[]")),
        constraints_json: JSON.parse(String(params[36] || "{}")),
        channel_offers_json: JSON.parse(String(params[37] || "[]")),
        product_options_json: JSON.parse(String(params[38] || "[]")),
        service_details_json: JSON.parse(String(params[39] || "{}")),
        inclusions_json: JSON.parse(String(params[40] || "[]")),
        exclusions_json: JSON.parse(String(params[41] || "[]")),
        primary_image_url: params[42],
        rating_average: params[43],
        review_count: params[44],
        booking_url: params[45],
        provenance_json: JSON.parse(String(params[46] || "{}")),
        quarantined: params[48],
        quarantine_reason: params[49],
        active: params[50],
        last_verified_at: params[51],
        updated_at: params[52],
        created_at: existing.created_at || params[53],
      };
      catMap.set(tourId, updated);
      return [];
    }

    // Record sync run
    if (q.includes("INSERT INTO dcc_catalog_sync_runs")) {
      const runId = String(params[0]);
      syncRunsById.set(runId, {
        run_id: runId,
        provider: params[1],
        destination_slug: params[2],
        status: params[3],
        cursor_value: params[4],
        imported_count: params[5],
        updated_count: params[6],
        rejected_count: params[7],
        upstream_request_count: params[8],
        rejection_reasons_json: JSON.parse(String(params[9] || "{}")),
        metadata_json: JSON.parse(String(params[10] || "{}")),
        started_at: params[11],
        completed_at: params[12],
      });
      return [];
    }

    return [];
  };

  return {
    executor,
    catalogByTourId,
    checkpointsByKey,
    syncRunsById,
    getCatalogUpdateStatements: () => catalogUpdateStatements,
    resetCatalogUpdateStatements: () => {
      catalogUpdateStatements = 0;
    },
    getTourRecord: (tourId: string) => {
      const row = catalogByTourId.get(tourId);
      return row ? mapPgRowToDurableTourRecord(row) : null;
    },
  };
}

test("1. Cron cadence, maxDuration, count=500 default, backfill decoupling, and Production verification block", async () => {
  const vercelJson = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "vercel.json"), "utf8"));
  const cronEntry = vercelJson.crons.find((c: any) => c.path === "/api/cron/catalog-refresh");
  assert.ok(cronEntry, "Expected /api/cron/catalog-refresh in vercel.json");
  assert.equal(cronEntry.schedule, "*/15 * * * *");
  assert.equal(SCHEDULED_CATALOG_REFRESH_CRON, "*/15 * * * *");
  assert.equal(maxDuration, 120);
  assert.equal(SCHEDULED_CATALOG_REFRESH_DEFAULT_COUNT, 500);

  // Verify 4-hour daytime capacity reconciliation:
  // 4 ticks/hr * 4 hours = 16 ticks per 4-hour window.
  const ticksPerFourHours = 16;
  const fourHourSchedulePagesCapacity =
    ticksPerFourHours * SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_MAX_PAGES;
  const fourHourProductPagesCapacity =
    ticksPerFourHours * SCHEDULED_CATALOG_REFRESH_DEFAULT_PRODUCT_MAX_PAGES;
  assert.ok(
    fourHourSchedulePagesCapacity >= 160,
    `4-hour schedule capacity (${fourHourSchedulePagesCapacity} pages) must comfortably exceed Viator daytime load (60-80 pages)`,
  );
  assert.ok(fourHourProductPagesCapacity >= 64);
  assert.ok(
    SCHEDULED_CATALOG_REFRESH_DEFAULT_PRODUCT_MAX_REQUESTS +
      SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_MAX_REQUESTS <=
      30,
    "Per-tick combined upstream request ceiling must remain tightly bounded inside 120s maxDuration",
  );

  // Verify Production strictly blocks x-dcc-controlled-global-verification while paused
  const prevSecret = process.env.CRON_SECRET;
  const prevEnabled = process.env.DCC_CATALOG_REFRESH_ENABLED;
  const prevVercelEnv = process.env.VERCEL_ENV;
  process.env.CRON_SECRET = "cron_hardening_secret";
  delete process.env.DCC_CATALOG_REFRESH_ENABLED;
  process.env.VERCEL_ENV = "production";

  try {
    const prodOverrideReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/cron/catalog-refresh",
      {
        headers: {
          Authorization: "Bearer cron_hardening_secret",
          "x-dcc-controlled-global-verification": "1",
        },
      },
    );
    assert.equal(isCatalogRefreshCronPaused(prodOverrideReq), true);
    const res = await GET(prodOverrideReq);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.paused, true);
  } finally {
    if (prevSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevSecret;
    if (prevEnabled === undefined) delete process.env.DCC_CATALOG_REFRESH_ENABLED;
    else process.env.DCC_CATALOG_REFRESH_ENABLED = prevEnabled;
    if (prevVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercelEnv;
  }
});

test("2. Multi-tick resumability, count=500 default, zero legacy backfill calls, and replay idempotency via /api/cron/catalog-refresh", async () => {
  const sim = createSimulatedCronPostgresState([
    makeDurableTourFixture("1001P1", "juneau", 12000),
    makeDurableTourFixture("1002P2", "skagway", 15000),
  ]);
  sim.checkpointsByKey.set(GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY, {
    stream_key: GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY,
    provider: "viator_incremental",
    destination_slug: null,
    cursor_value: "PROD_C0_OPAQUE",
    next_start_offset: null,
    provider_total_count: 2,
    status: "completed",
    metadata_json: {},
    updated_at: "2026-11-18T18:00:00.000Z",
  });
  sim.checkpointsByKey.set(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY, {
    stream_key: GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY,
    provider: "viator_schedule_pricing",
    destination_slug: null,
    cursor_value: "SCHED_C0_OPAQUE",
    next_start_offset: null,
    provider_total_count: 2,
    status: "completed",
    metadata_json: {},
    updated_at: "2026-11-18T18:00:00.000Z",
  });

  const prevSecret = process.env.CRON_SECRET;
  const prevEnabled = process.env.DCC_CATALOG_REFRESH_ENABLED;
  const prevVercelEnv = process.env.VERCEL_ENV;
  process.env.CRON_SECRET = "cron_hardening_secret";
  delete process.env.DCC_CATALOG_REFRESH_ENABLED;
  process.env.VERCEL_ENV = "preview";

  const observedProductCounts: number[] = [];
  const observedScheduleCounts: number[] = [];
  const observedProductCursors: Array<string | undefined> = [];
  const observedScheduleCursors: Array<string | undefined> = [];
  let legacySearchCalls = 0;

  setCatalogSqlQueryExecutorForTests(sim.executor);
  clearDurableCatalogCachesForTests();
  resetCatalogRefreshExecutionLeaseForTests();

  setViatorClientForTests({
    async searchProducts() {
      legacySearchCalls += 1;
      throw new Error("Legacy destination backfill searchProducts must never run in full_pipeline");
    },
    async getProductsModifiedSince(params: any) {
      observedProductCounts.push(params.count);
      observedProductCursors.push(params.cursor);
      if (params.cursor === "PROD_C0_OPAQUE") {
        return {
          products: [
            {
              productCode: "1001P1",
              status: "ACTIVE",
              title: "Scheduled Refresh Fixture 1001P1 Updated",
            },
          ],
          nextCursor: "PROD_C1_OPAQUE",
        };
      }
      return { products: [], nextCursor: "PROD_C1_OPAQUE" };
    },
    async getAvailabilitySchedulesBulk(codes: string[]) {
      return {
        availabilitySchedules: codes.map((c) => ({
          productCode: c,
          currency: "USD",
          summary: { fromPrice: 135.0 },
          bookableItems: [
            {
              productOptionCode: "TG1",
              seasons: [
                {
                  startDate: "2027-05-01",
                  pricingRecords: [
                    {
                      timedEntries: [{ startTime: "09:00" }],
                      pricingDetails: [
                        {
                          pricingPackageType: "PER_PERSON",
                          ageBand: "ADULT",
                          price: { original: { recommendedRetailPrice: 135.0 } },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        })),
      };
    },
    async getAvailabilitySchedulesModifiedSince(params: any) {
      observedScheduleCounts.push(params.count);
      observedScheduleCursors.push(params.cursor);
      if (params.cursor === "SCHED_C0_OPAQUE") {
        return {
          availabilitySchedules: [
            {
              productCode: "999999P9",
              currency: "USD",
              summary: { fromPrice: 99 },
              bookableItems: [],
            },
          ],
          nextCursor: "SCHED_C1_OPAQUE",
        };
      }
      if (params.cursor === "SCHED_C1_OPAQUE") {
        return {
          availabilitySchedules: [
            {
              productCode: "1002P2",
              currency: "USD",
              summary: { fromPrice: 165.0 },
              bookableItems: [
                {
                  productOptionCode: "TG1",
                  seasons: [
                    {
                      startDate: "2027-05-01",
                      pricingRecords: [
                        {
                          timedEntries: [{ startTime: "09:00" }],
                          pricingDetails: [
                            {
                              pricingPackageType: "PER_PERSON",
                              ageBand: "ADULT",
                              price: { original: { recommendedRetailPrice: 165.0 } },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          nextCursor: "SCHED_C2_OPAQUE",
        };
      }
      return { availabilitySchedules: [] };
    },
  });

  try {
    // Tick 1: maxPages=1, scheduleMaxPages=1 -> processesPROD_C0->PROD_C1 and SCHED_C0->SCHED_C1, leaving SCHED continuationPending=true
    const tick1Res = await GET(
      new NextRequest(
        "https://preview.destinationcommandcenter.com/api/cron/catalog-refresh?maxPages=1&scheduleMaxPages=1&includeSummary=0",
        {
          headers: {
            Authorization: "Bearer cron_hardening_secret",
            "x-dcc-controlled-global-verification": "1",
          },
        },
      ),
    );
    assert.equal(tick1Res.status, 200);
    const tick1 = await tick1Res.json();
    assert.equal(tick1.ok, true);
    assert.equal(tick1.skippedOverlap, false);
    assert.equal(tick1.backfillRun, null, "Legacy backfillRun must be null on full_pipeline");
    assert.equal(legacySearchCalls, 0);
    assert.deepEqual(observedProductCounts, [500]);
    assert.deepEqual(observedScheduleCounts, [500]);
    assert.equal(
      sim.checkpointsByKey.get(GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY)?.cursor_value,
      "PROD_C1_OPAQUE",
    );
    assert.equal(
      sim.checkpointsByKey.get(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY)?.cursor_value,
      "SCHED_C1_OPAQUE",
    );
    assert.equal(
      sim.checkpointsByKey.get(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY)?.status,
      "in_progress",
    );
    assert.equal(sim.getTourRecord("dcc:tour:viator:1001P1")?.fromPriceCents, 13500);

    // Tick 2: automatically resumes from PROD_C1_OPAQUE and SCHED_C1_OPAQUE and drains both!
    const tick2Res = await GET(
      new NextRequest(
        "https://preview.destinationcommandcenter.com/api/cron/catalog-refresh?maxPages=2&scheduleMaxPages=3&includeSummary=0",
        {
          headers: {
            Authorization: "Bearer cron_hardening_secret",
            "x-dcc-controlled-global-verification": "1",
          },
        },
      ),
    );
    const tick2 = await tick2Res.json();
    assert.equal(tick2.ok, true);
    assert.deepEqual(observedProductCursors, ["PROD_C0_OPAQUE", "PROD_C1_OPAQUE"]);
    assert.deepEqual(observedScheduleCursors, [
      "SCHED_C0_OPAQUE",
      "SCHED_C1_OPAQUE",
      "SCHED_C2_OPAQUE",
    ]);
    assert.equal(
      sim.checkpointsByKey.get(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY)?.cursor_value,
      "SCHED_C2_OPAQUE",
    );
    assert.equal(
      sim.checkpointsByKey.get(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY)?.status,
      "completed",
    );
    assert.equal(sim.getTourRecord("dcc:tour:viator:1002P2")?.fromPriceCents, 16500);

    // Replay Idempotency Proof: rewind both checkpoints to C0 and re-run over identical payloads -> 0 dirty updates!
    sim.checkpointsByKey.get(GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY)!.cursor_value =
      "PROD_C0_OPAQUE";
    sim.checkpointsByKey.get(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY)!.cursor_value =
      "SCHED_C0_OPAQUE";
    sim.resetCatalogUpdateStatements();

    const replayRes = await POST(
      new NextRequest(
        "https://preview.destinationcommandcenter.com/api/cron/catalog-refresh?maxPages=3&scheduleMaxPages=3&includeSummary=0",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer cron_hardening_secret",
            "x-dcc-controlled-global-verification": "1",
          },
        },
      ),
    );
    const replayBody = await replayRes.json();
    assert.equal(replayBody.ok, true);
    assert.equal(replayBody.incrementalRun.updatedCount, 0);
    assert.equal(replayBody.incrementalRun.metadata.schedulePricingRefreshedCount, 0);
    assert.equal(
      sim.getCatalogUpdateStatements(),
      0,
      "Idempotent replay must execute 0 catalog UPDATE/INSERT statements",
    );
  } finally {
    setViatorClientForTests(null);
    setCatalogSqlQueryExecutorForTests(null);
    clearDurableCatalogCachesForTests();
    resetCatalogRefreshExecutionLeaseForTests();
    if (prevSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevSecret;
    if (prevEnabled === undefined) delete process.env.DCC_CATALOG_REFRESH_ENABLED;
    else process.env.DCC_CATALOG_REFRESH_ENABLED = prevEnabled;
    if (prevVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercelEnv;
  }
});

test("3. Request ceilings (maxRequests & scheduleMaxRequests) stop cleanly without exceeding budget or committing partial pages", async () => {
  const sim = createSimulatedCronPostgresState([
    makeDurableTourFixture("2001P1", "juneau", 10000),
  ]);
  sim.checkpointsByKey.set(GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY, {
    stream_key: GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY,
    provider: "viator_incremental",
    destination_slug: null,
    cursor_value: "REQ_PROD_C0",
    next_start_offset: null,
    provider_total_count: 1,
    status: "completed",
    metadata_json: {},
    updated_at: "2026-11-18T18:00:00.000Z",
  });

  const prevSecret = process.env.CRON_SECRET;
  const prevVercelEnv = process.env.VERCEL_ENV;
  process.env.CRON_SECRET = "cron_hardening_secret";
  process.env.VERCEL_ENV = "preview";

  let totalUpstreamCalls = 0;
  setCatalogSqlQueryExecutorForTests(sim.executor);
  clearDurableCatalogCachesForTests();
  resetCatalogRefreshExecutionLeaseForTests();

  setViatorClientForTests({
    async getProductsModifiedSince() {
      totalUpstreamCalls += 1;
      return {
        products: [{ productCode: "2001P1", status: "ACTIVE", title: "Needs Bulk Schedule" }],
        nextCursor: "REQ_PROD_C1",
      };
    },
    async getAvailabilitySchedulesBulk() {
      totalUpstreamCalls += 1;
      return { availabilitySchedules: [] };
    },
  });

  try {
    // Setting maxRequests=1 when Page 0 has an active match requiring a 2nd bulk schedule call:
    // Must stop BEFORE the bulk call (1 total call <= 1 ceiling) AND leave cursor at REQ_PROD_C0 (0 partial writes)!
    const res = await GET(
      new NextRequest(
        "https://preview.destinationcommandcenter.com/api/cron/catalog-refresh?mode=incremental_only&maxPages=5&maxRequests=1&includeSummary=0",
        {
          headers: {
            Authorization: "Bearer cron_hardening_secret",
            "x-dcc-controlled-global-verification": "1",
          },
        },
      ),
    );
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(totalUpstreamCalls, 1, "Must never exceed maxRequests=1 ceiling");
    assert.equal(body.incrementalRun.upstreamRequestCount, 1);
    assert.equal(
      body.incrementalRun.metadata.stoppedReason,
      "max_requests_budget_reached_before_bulk",
    );
    assert.equal(body.incrementalRun.metadata.continuationPending, true);
    assert.equal(
      sim.checkpointsByKey.get(GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY)?.cursor_value,
      "REQ_PROD_C0",
      "Checkpoint must not advance when page stops before required bulk enrichment",
    );
  } finally {
    setViatorClientForTests(null);
    setCatalogSqlQueryExecutorForTests(null);
    clearDurableCatalogCachesForTests();
    resetCatalogRefreshExecutionLeaseForTests();
    if (prevSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevSecret;
    if (prevVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercelEnv;
  }
});

test("4. Non-overlap distributed & in-process lease rejects concurrent invocations with 0 upstream calls and recovers on release/expiry", async () => {
  const sim = createSimulatedCronPostgresState([]);
  const prevSecret = process.env.CRON_SECRET;
  const prevVercelEnv = process.env.VERCEL_ENV;
  process.env.CRON_SECRET = "cron_hardening_secret";
  process.env.VERCEL_ENV = "preview";

  setCatalogSqlQueryExecutorForTests(sim.executor);
  clearDurableCatalogCachesForTests();
  resetCatalogRefreshExecutionLeaseForTests();

  let resolveSlowStream!: () => void;
  const slowStreamStarted = new Promise<void>((resolve) => {
    setViatorClientForTests({
      async getAvailabilitySchedulesModifiedSince() {
        resolve();
        await new Promise<void>((r) => {
          resolveSlowStream = r;
        });
        return { availabilitySchedules: [] };
      },
    });
  });

  try {
    const reqA = new NextRequest(
      "https://preview.destinationcommandcenter.com/api/cron/catalog-refresh?mode=schedules_only&scheduleCursor=C_LOCK_TEST&maxPages=1&includeSummary=0",
      {
        headers: {
          Authorization: "Bearer cron_hardening_secret",
          "x-dcc-controlled-global-verification": "1",
        },
      },
    );
    const reqB = new NextRequest(
      "https://preview.destinationcommandcenter.com/api/cron/catalog-refresh?mode=schedules_only&scheduleCursor=C_LOCK_TEST&maxPages=1&includeSummary=0",
      {
        headers: {
          Authorization: "Bearer cron_hardening_secret",
          "x-dcc-controlled-global-verification": "1",
        },
      },
    );

    const inFlightA = GET(reqA);
    await slowStreamStarted;

    // Concurrent Invocation B arrives while Invocation A holds the lease
    const resB = await GET(reqB);
    const bodyB = await resB.json();
    assert.equal(resB.status, 200);
    assert.equal(bodyB.ok, true);
    assert.equal(bodyB.skippedOverlap, true);
    assert.equal(bodyB.reason, "concurrent_catalog_refresh_in_progress");
    assert.equal(bodyB.upstreamRequestCount, 0);

    // Let Invocation A complete
    resolveSlowStream();
    const resA = await inFlightA;
    const bodyA = await resA.json();
    assert.equal(bodyA.ok, true);
    assert.equal(bodyA.skippedOverlap, false);

    // Verify expired DB lease from a crashed container is safely reclaimed
    sim.syncRunsById.set(GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID, {
      run_id: GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID,
      provider: "dcc_cron_lock",
      destination_slug: "global",
      status: "running",
      cursor_value: "crashed_worker_holder",
      metadata_json: {
        leaseExpiresAt: new Date(Date.now() - 5_000).toISOString(),
      },
      started_at: new Date(Date.now() - 140_000).toISOString(),
      completed_at: null,
    });
    const reclaimed = await acquireCatalogRefreshExecutionLease({ leaseDurationMs: 30_000 });
    assert.equal(reclaimed.acquired, true);
    await releaseCatalogRefreshExecutionLease(reclaimed.holderId);
  } finally {
    setViatorClientForTests(null);
    setCatalogSqlQueryExecutorForTests(null);
    clearDurableCatalogCachesForTests();
    resetCatalogRefreshExecutionLeaseForTests();
    if (prevSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevSecret;
    if (prevVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercelEnv;
  }
});
