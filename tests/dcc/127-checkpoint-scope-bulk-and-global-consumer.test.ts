import assert from "node:assert/strict";
import test from "node:test";
import { setViatorClientForTests } from "@/lib/viator/client";
import {
  GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY,
  GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY,
  SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0,
  CLOBBERED_POST_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C1,
  buildDestinationScheduleRefreshStreamKey,
} from "@/lib/dcc/catalog/checkpointContract";
import {
  clearDurableCatalogCachesForTests,
  getDestinationScheduleRefreshCheckpoint,
  getGlobalRefreshCheckpoint,
  setCatalogSqlQueryExecutorForTests,
  upsertRefreshCheckpoint,
  type CatalogRefreshCheckpointRecord,
} from "@/lib/dcc/catalog/durableCatalogStore";
import {
  runDestinationBoundedBulkScheduleRefresh,
  runGlobalScheduleModifiedSinceRefresh,
  runIncrementalScheduleAndPricingRefresh,
} from "@/lib/dcc/catalog/ingest";

type SimTourRow = Record<string, any>;
type SimCkptRow = {
  stream_key: string;
  provider: string;
  destination_slug: string | null;
  cursor_value: string | null;
  next_start_offset: number | null;
  provider_total_count: number | null;
  status: string;
  metadata_json: Record<string, any>;
  updated_at: string;
};

function makeSimTourRow(params: {
  destinationSlug: string;
  code: string;
  fromPriceCents?: number;
  optionCodes?: string[];
}): SimTourRow {
  const codeUpper = params.code.toUpperCase();
  const opts = (params.optionCodes || ["DEFAULT"]).map((optCode) => ({
    optionCode: optCode,
    title: optCode === "DEFAULT" ? `Tour ${codeUpper}` : `Option ${optCode}`,
    description: null,
    includesPickup: false,
    pickupFulfillmentType: "unknown",
    meetingPointName: null,
    meetingPointLat: null,
    meetingPointLng: null,
    transferBeforeMinutes: null,
    transferAfterMinutes: null,
    transferTimeSource: "unknown",
    transferEvidenceSource: null,
    applicableBerthOrMeetingPoint: null,
    planningEstimateTransferMinutes: 45,
    durationMinutes: 120,
    fromPriceCents: params.fromPriceCents ?? 10000,
    priceBasis: "per_person",
    scheduledStartTimes: ["09:00"],
  }));
  return {
    tour_id: `viator:${params.destinationSlug}:${codeUpper}`,
    compatibility_aliases: [codeUpper],
    destination_slug: params.destinationSlug,
    port_slug: params.destinationSlug,
    earthos_destination_node_id: `node:${params.destinationSlug}`,
    time_zone: "America/Juneau",
    title: `Tour ${codeUpper}`,
    summary: `Summary for ${codeUpper}`,
    category: "Guided Sightseeing & Excursions",
    tags: [],
    primary_provider: "viator",
    provider_product_code: codeUpper,
    operator_name: "Test Operator",
    operator_code: "OP1",
    capability_tier: "handoff",
    commission_authorized: true,
    duration_minutes: 120,
    duration_raw_text: "2 hours",
    from_price_cents: params.fromPriceCents ?? 10000,
    price_basis: "per_person",
    currency: "USD",
    free_cancellation: true,
    cancellation_policy_type: "STANDARD",
    cancellation_cutoff_hours: 24,
    cancellation_summary: "Free cancellation up to 24 hours before start",
    has_hotel_pickup: false,
    lowest_price_includes_pickup: false,
    pickup_type: "MEETING_POINT",
    pickup_summary: "Meet on site",
    meeting_point_name: "Harbor Dock",
    meeting_point_address: "100 Harbor Way",
    meeting_point_lat: 58.3,
    meeting_point_lng: -134.4,
    location_precision: "exact_coordinates",
    pickup_locations_json: [],
    age_bands_json: [{ ageBand: "ADULT", startAge: 18, endAge: 99 }],
    constraints_json: {
      cruiseBufferBeforeMinutes: null,
      cruiseBufferAfterMinutes: null,
      transferTimeSource: "unknown",
      transferEvidenceSource: null,
      applicableBerthOrMeetingPoint: null,
      planningEstimateTransferMinutes: 45,
    },
    channel_offers_json: [],
    product_options_json: opts,
    service_details_json: { pickupFulfillmentType: "unknown" },
    inclusions_json: ["Guide"],
    exclusions_json: [],
    primary_image_url: null,
    rating_average: 4.8,
    review_count: 42,
    booking_url: `https://www.viator.com/tours/x/${codeUpper}`,
    provenance_json: {
      sourceSystem: "viator",
      sourceEndpoint: "seed",
      fetchedAt: "2026-11-01T00:00:00.000Z",
    },
    quarantined: false,
    quarantine_reason: null,
    active: true,
    last_verified_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
    created_at: "2026-11-01T00:00:00.000Z",
  };
}

function createSimulatedPgHarness(initialTours: SimTourRow[], initialCheckpoints: SimCkptRow[] = []) {
  let tours = new Map<string, SimTourRow>(
    initialTours.map((r) => [r.tour_id, structuredClone(r)]),
  );
  let checkpoints = new Map<string, SimCkptRow>(
    initialCheckpoints.map((c) => [c.stream_key, structuredClone(c)]),
  );
  let syncRuns = new Map<string, Record<string, any>>();

  let txSnapshot: {
    tours: Map<string, SimTourRow>;
    checkpoints: Map<string, SimCkptRow>;
  } | null = null;

  const metrics = {
    catalogUpdatesExecuted: 0,
    checkpointWritesExecuted: 0,
    transactionsCommitted: 0,
    transactionsRolledBack: 0,
    selectStarDetected: 0,
  };

  function enforceMigration0010CheckpointConstraints(
    nextRow: SimCkptRow,
    existingRow?: SimCkptRow,
  ) {
    if (existingRow && existingRow.destination_slug !== nextRow.destination_slug) {
      const err: any = new Error(
        `checkpoint_scope_violation: cannot mutate destination_slug on existing stream_key ${existingRow.stream_key}`,
      );
      err.code = "23514";
      throw err;
    }
    const isGlobal =
      nextRow.stream_key === GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY ||
      nextRow.stream_key === GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY ||
      nextRow.stream_key.endsWith("_modified_since") ||
      nextRow.provider === "viator_incremental" ||
      nextRow.provider === "viator_schedule_pricing";

    if (isGlobal) {
      if (nextRow.destination_slug !== null) {
        const err: any = new Error(
          `violates check constraint "dcc_catalog_refresh_checkpoints_global_keys_chk"`,
        );
        err.code = "23514";
        throw err;
      }
    } else {
      if (
        !nextRow.destination_slug ||
        nextRow.destination_slug.trim() === "" ||
        nextRow.destination_slug !== nextRow.destination_slug.trim().toLowerCase()
      ) {
        const err: any = new Error(
          `violates check constraint "dcc_catalog_refresh_checkpoints_global_keys_chk"`,
        );
        err.code = "23514";
        throw err;
      }
    }

    const isDestSchedKey = nextRow.stream_key.startsWith("viator_destination_schedule_refresh:");
    const isDestSchedProvider = nextRow.provider === "viator_destination_schedule_refresh";
    if (isDestSchedKey || isDestSchedProvider) {
      if (
        !isDestSchedKey ||
        !isDestSchedProvider ||
        !nextRow.destination_slug ||
        nextRow.stream_key !== `viator_destination_schedule_refresh:${nextRow.destination_slug}`
      ) {
        const err: any = new Error(
          `violates check constraint "dcc_catalog_refresh_checkpoints_dest_schedule_key_chk"`,
        );
        err.code = "23514";
        throw err;
      }
    }
  }

  const executor = async (queryText: string, params: unknown[] = []): Promise<Record<string, any>[]> => {
    const q = queryText.trim();
    if (/SELECT\s+\*/i.test(q)) {
      metrics.selectStarDetected += 1;
    }

    if (q === "BEGIN") {
      txSnapshot = {
        tours: new Map(Array.from(tours.entries()).map(([k, v]) => [k, structuredClone(v)])),
        checkpoints: new Map(
          Array.from(checkpoints.entries()).map(([k, v]) => [k, structuredClone(v)]),
        ),
      };
      return [];
    }
    if (q === "COMMIT") {
      txSnapshot = null;
      metrics.transactionsCommitted += 1;
      return [];
    }
    if (q === "ROLLBACK") {
      if (txSnapshot) {
        tours = txSnapshot.tours;
        checkpoints = txSnapshot.checkpoints;
        txSnapshot = null;
      }
      metrics.transactionsRolledBack += 1;
      return [];
    }

    // 1. Checkpoint SELECT
    if (q.includes("FROM dcc_catalog_refresh_checkpoints") && q.includes("WHERE stream_key = $1")) {
      const key = String(params[0] || "");
      const row = checkpoints.get(key);
      return row ? [structuredClone(row)] : [];
    }

    // 2. Checkpoint INSERT ... ON CONFLICT
    if (q.includes("INSERT INTO dcc_catalog_refresh_checkpoints")) {
      const streamKey = String(params[0]);
      const nextRow: SimCkptRow = {
        stream_key: streamKey,
        provider: String(params[1]),
        destination_slug: params[2] == null ? null : String(params[2]),
        cursor_value: params[3] == null ? null : String(params[3]),
        next_start_offset: typeof params[4] === "number" ? params[4] : null,
        provider_total_count: typeof params[5] === "number" ? params[5] : null,
        status: String(params[6]),
        metadata_json: JSON.parse(String(params[7] || "{}")),
        updated_at: String(params[8]),
      };
      enforceMigration0010CheckpointConstraints(nextRow, checkpoints.get(streamKey));
      checkpoints.set(streamKey, nextRow);
      metrics.checkpointWritesExecuted += 1;
      return [];
    }

    // 3. Narrow destination codes SELECT
    if (
      q.includes("SELECT UPPER(provider_product_code) AS code") &&
      q.includes("LOWER(destination_slug) = $2")
    ) {
      const excl = new Set((params[0] as string[]) || []);
      const slug = String(params[1] || "").toLowerCase();
      const prov = String(params[2] || "viator");
      return Array.from(tours.values())
        .filter(
          (r) =>
            r.active &&
            !r.quarantined &&
            !excl.has(r.tour_id) &&
            r.destination_slug.toLowerCase() === slug &&
            r.primary_provider === prov,
        )
        .sort((a, b) => a.provider_product_code.localeCompare(b.provider_product_code))
        .map((r) => ({ code: r.provider_product_code.toUpperCase() }));
    }

    // 4. Narrow global active codes SELECT
    if (
      q.includes("SELECT UPPER(provider_product_code) AS code") &&
      q.includes("primary_provider = $2") &&
      !q.includes("destination_slug")
    ) {
      const excl = new Set((params[0] as string[]) || []);
      const prov = String(params[1] || "viator");
      return Array.from(tours.values())
        .filter((r) => r.active && !r.quarantined && !excl.has(r.tour_id) && r.primary_provider === prov)
        .map((r) => ({ code: r.provider_product_code.toUpperCase() }));
    }

    // 5. Destination + codes tour projection SELECT
    if (
      q.includes("FROM dcc_tour_catalog") &&
      q.includes("LOWER(destination_slug) = $2") &&
      q.includes("UPPER(provider_product_code) = ANY($4::text[])")
    ) {
      const excl = new Set((params[0] as string[]) || []);
      const slug = String(params[1] || "").toLowerCase();
      const prov = String(params[2] || "viator");
      const codeSet = new Set(((params[3] as string[]) || []).map((c) => c.toUpperCase()));
      return Array.from(tours.values())
        .filter(
          (r) =>
            r.active &&
            !r.quarantined &&
            !excl.has(r.tour_id) &&
            r.destination_slug.toLowerCase() === slug &&
            r.primary_provider === prov &&
            codeSet.has(r.provider_product_code.toUpperCase()),
        )
        .map((r) => structuredClone(r));
    }

    // 6. Global codes tour projection SELECT
    if (
      q.includes("FROM dcc_tour_catalog") &&
      q.includes("primary_provider = $2") &&
      q.includes("UPPER(provider_product_code) = ANY($3::text[])")
    ) {
      const excl = new Set((params[0] as string[]) || []);
      const prov = String(params[1] || "viator");
      const codeSet = new Set(((params[2] as string[]) || []).map((c) => c.toUpperCase()));
      return Array.from(tours.values())
        .filter(
          (r) =>
            r.active &&
            !r.quarantined &&
            !excl.has(r.tour_id) &&
            r.primary_provider === prov &&
            codeSet.has(r.provider_product_code.toUpperCase()),
        )
        .map((r) => structuredClone(r));
    }

    // 7. Targeted catalog UPDATE (refresh)
    if (q.includes("UPDATE dcc_tour_catalog") && q.includes("WHERE tour_id = $1")) {
      const tourId = String(params[0]);
      const slug = String(params[1]).toLowerCase();
      const existing = tours.get(tourId);
      if (existing && existing.destination_slug.toLowerCase() === slug) {
        existing.title = params[2];
        existing.summary = params[3];
        existing.duration_minutes = params[4];
        existing.duration_raw_text = params[5];
        existing.from_price_cents = params[6];
        existing.price_basis = params[7];
        existing.currency = params[8];
        existing.free_cancellation = params[9];
        existing.cancellation_policy_type = params[10];
        existing.cancellation_cutoff_hours = params[11];
        existing.cancellation_summary = params[12];
        existing.has_hotel_pickup = params[13];
        existing.lowest_price_includes_pickup = params[14];
        existing.pickup_type = params[15];
        existing.pickup_summary = params[16];
        existing.meeting_point_name = params[17];
        existing.meeting_point_address = params[18];
        existing.meeting_point_lat = params[19];
        existing.meeting_point_lng = params[20];
        existing.location_precision = params[21];
        existing.constraints_json = {
          ...(existing.constraints_json || {}),
          ...JSON.parse(String(params[22] || "{}")),
        };
        existing.product_options_json = JSON.parse(String(params[23] || "[]"));
        existing.service_details_json = {
          ...(existing.service_details_json || {}),
          ...JSON.parse(String(params[24] || "{}")),
        };
        existing.provenance_json = {
          ...(existing.provenance_json || {}),
          ...JSON.parse(String(params[25] || "{}")),
        };
        existing.last_verified_at = params[26];
        existing.updated_at = params[27];
        metrics.catalogUpdatesExecuted += 1;
      }
      return [];
    }

    // 8. Retirement UPDATE
    if (q.includes("UPDATE dcc_tour_catalog") && q.includes("SET active = false")) {
      const patch = JSON.parse(String(params[0] || "{}"));
      const codeUpper = String(params[1] || "").toUpperCase();
      const hasDest = q.includes("LOWER(destination_slug) = $3");
      const destSlug = hasDest ? String(params[2] || "").toLowerCase() : null;
      const updatedAt = String(hasDest ? params[3] : params[2]);
      for (const row of tours.values()) {
        if (
          row.primary_provider === "viator" &&
          row.provider_product_code.toUpperCase() === codeUpper &&
          (!destSlug || row.destination_slug.toLowerCase() === destSlug)
        ) {
          row.active = false;
          row.service_details_json = { ...(row.service_details_json || {}), ...patch };
          row.updated_at = updatedAt;
          metrics.catalogUpdatesExecuted += 1;
        }
      }
      return [];
    }

    // 9. Sync runs INSERT
    if (q.includes("INSERT INTO dcc_catalog_sync_runs")) {
      syncRuns.set(String(params[0]), {
        run_id: params[0],
        provider: params[1],
        destination_slug: params[2],
        status: params[3],
        cursor_value: params[4],
        updated_count: params[6],
        rejected_count: params[7],
        upstream_request_count: params[8],
        metadata_json: JSON.parse(String(params[10] || "{}")),
      });
      return [];
    }

    return [];
  };

  return {
    executor,
    metrics,
    getTour: (tourId: string) => tours.get(tourId),
    getAllTours: () => Array.from(tours.values()),
    getCheckpoint: (key: string) => checkpoints.get(key),
  };
}

function makeViatorSchedulePayload(code: string, priceDollars: number, optionCodes = ["DEFAULT"]) {
  return {
    productCode: code,
    currency: "USD",
    summary: { fromPrice: priceDollars },
    bookableItems: optionCodes.map((optCode, idx) => ({
      productOptionCode: optCode,
      seasons: [
        {
          startDate: "2027-05-01",
          pricingRecords: [
            {
              timedEntries: [{ startTime: "09:30" }],
              pricingDetails: [
                {
                  ageBand: "ADULT",
                  price: { original: { recommendedRetailPrice: priceDollars + idx * 10 } },
                },
              ],
            },
          ],
        },
      ],
    })),
  };
}

function makeViatorProductPayload(code: string, title?: string, optionCodes = ["DEFAULT"]) {
  return {
    status: "ACTIVE",
    productCode: code,
    title: title || `Tour ${code}`,
    pricingInfo: { type: "PER_PERSON" },
    itinerary: { duration: { fixedDurationInMinutes: 120 } },
    productOptions: optionCodes.map((optCode) => ({
      productOptionCode: optCode,
      title: optCode === "DEFAULT" ? `Tour ${code}` : `Option ${optCode} with Hotel Pickup`,
      description: optCode === "DEFAULT" ? null : "Includes hotel pickup",
    })),
  };
}

test("1. Checkpoint contract & DB constraints reject invalid global and destination permutations", async (t) => {
  const harness = createSimulatedPgHarness(
    [],
    [
      {
        stream_key: GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY,
        provider: "viator_schedule_pricing",
        destination_slug: null,
        cursor_value: SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0,
        next_start_offset: null,
        provider_total_count: 7656,
        status: "completed",
        metadata_json: { checkpointContractVersion: "v2" },
        updated_at: "2026-11-18T16:48:53.000Z",
      },
    ],
  );
  clearDurableCatalogCachesForTests();
  setCatalogSqlQueryExecutorForTests(harness.executor);
  t.after(() => {
    setCatalogSqlQueryExecutorForTests(null);
    setViatorClientForTests(null);
    clearDurableCatalogCachesForTests();
  });

  // Global key carrying a destination -> rejected
  await assert.rejects(
    () =>
      upsertRefreshCheckpoint({
        streamKey: GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY,
        provider: "viator_schedule_pricing",
        destinationSlug: "juneau",
        cursorValue: "BAD",
        nextStartOffset: null,
        providerTotalCount: 100,
        status: "completed",
        metadata: {},
      }),
    /checkpoint_scope_violation/,
  );

  await assert.rejects(
    () =>
      upsertRefreshCheckpoint({
        streamKey: GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY,
        provider: "viator_incremental",
        destinationSlug: "skagway",
        cursorValue: "BAD",
        nextStartOffset: null,
        providerTotalCount: 100,
        status: "completed",
        metadata: {},
      }),
    /checkpoint_scope_violation/,
  );

  // Destination key with missing or mismatched destination -> rejected
  await assert.rejects(
    () =>
      upsertRefreshCheckpoint({
        streamKey: buildDestinationScheduleRefreshStreamKey("skagway"),
        provider: "viator_destination_schedule_refresh",
        destinationSlug: null,
        cursorValue: "BAD",
        nextStartOffset: null,
        providerTotalCount: 65,
        status: "completed",
        metadata: {},
      }),
    /checkpoint_scope_violation/,
  );

  await assert.rejects(
    () =>
      upsertRefreshCheckpoint({
        streamKey: buildDestinationScheduleRefreshStreamKey("skagway"),
        provider: "viator_destination_schedule_refresh",
        destinationSlug: "juneau",
        cursorValue: "BAD",
        nextStartOffset: null,
        providerTotalCount: 65,
        status: "completed",
        metadata: {},
      }),
    /checkpoint_scope_violation/,
  );

  // Global cursor remains untouched at C0
  const globalAfter = await getGlobalRefreshCheckpoint(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY);
  assert.equal(globalAfter?.cursorValue, SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0);
  assert.equal(globalAfter?.destinationSlug, null);
});

test("2. Destination bulk refresh isolates Juneau, Skagway, and >500-code synthetic destination with exact 1+1 request counts and resumable chunks", async (t) => {
  const juneauRows = ["JUN001", "JUN002", "JUN003"].map((c) =>
    makeSimTourRow({ destinationSlug: "juneau", code: c, fromPriceCents: 10000 }),
  );
  const skagwayRows = ["SKG001", "SKG002"].map((c) =>
    makeSimTourRow({ destinationSlug: "skagway", code: c, fromPriceCents: 12000 }),
  );
  const megaRows = Array.from({ length: 620 }, (_, idx) => {
    const code = `MEGA${String(idx + 1).padStart(4, "0")}`;
    return makeSimTourRow({ destinationSlug: "synthetic-megaport", code, fromPriceCents: 9000 });
  });

  const harness = createSimulatedPgHarness(
    [...juneauRows, ...skagwayRows, ...megaRows],
    [
      {
        stream_key: GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY,
        provider: "viator_schedule_pricing",
        destination_slug: null,
        cursor_value: SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0,
        next_start_offset: null,
        provider_total_count: 625,
        status: "completed",
        metadata_json: { checkpointContractVersion: "v2" },
        updated_at: "2026-11-18T16:48:53.000Z",
      },
    ],
  );

  const apiCalls = {
    modifiedSinceCalls: 0,
    productsModifiedSinceCalls: 0,
    productsBulkBatches: [] as number[],
    schedulesBulkBatches: [] as number[],
  };

  clearDurableCatalogCachesForTests();
  setCatalogSqlQueryExecutorForTests(harness.executor);
  setViatorClientForTests({
    async getAvailabilitySchedulesModifiedSince() {
      apiCalls.modifiedSinceCalls += 1;
      throw new Error("Destination bulk refresh MUST NEVER call getAvailabilitySchedulesModifiedSince");
    },
    async getProductsModifiedSince() {
      apiCalls.productsModifiedSinceCalls += 1;
      throw new Error("Destination bulk refresh MUST NEVER call getProductsModifiedSince");
    },
    async getProductsBulk(codes: string[]) {
      assert.ok(codes.length <= 500, `Expected <=500 codes, got ${codes.length}`);
      apiCalls.productsBulkBatches.push(codes.length);
      return codes.map((c) => makeViatorProductPayload(c));
    },
    async getAvailabilitySchedulesBulk(codes: string[]) {
      assert.ok(codes.length <= 500, `Expected <=500 codes, got ${codes.length}`);
      apiCalls.schedulesBulkBatches.push(codes.length);
      return {
        availabilitySchedules: codes.map((c) => makeViatorSchedulePayload(c, 155)),
      };
    },
  });

  t.after(() => {
    setCatalogSqlQueryExecutorForTests(null);
    setViatorClientForTests(null);
    clearDurableCatalogCachesForTests();
  });

  // A. Run Juneau via runIncrementalScheduleAndPricingRefresh({ destinationSlug: "juneau" })
  const juneauRun = await runIncrementalScheduleAndPricingRefresh({ destinationSlug: "juneau" });
  assert.equal(juneauRun.status, "completed");
  assert.equal(juneauRun.upstreamRequestCount, 2);
  assert.equal(apiCalls.modifiedSinceCalls, 0);
  assert.equal(apiCalls.productsModifiedSinceCalls, 0);

  // Skagway & MegaPort catalog rows must still have untouched prices (12000 & 9000)
  assert.equal(harness.getTour("viator:skagway:SKG001")?.from_price_cents, 12000);
  assert.equal(harness.getTour("viator:synthetic-megaport:MEGA0001")?.from_price_cents, 9000);
  // Age bands & inclusions preserved untouched by narrow targeted UPDATE
  assert.deepEqual(harness.getTour("viator:juneau:JUN001")?.inclusions_json, ["Guide"]);

  // Global cursor still at C0
  const globalCkpt1 = await getGlobalRefreshCheckpoint(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY);
  assert.equal(globalCkpt1?.cursorValue, SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0);

  // B. Run Skagway -> independent from Juneau
  const juneauCkptBeforeSkagway = await getDestinationScheduleRefreshCheckpoint("juneau");
  const skagwayRun = await runDestinationBoundedBulkScheduleRefresh({ destinationSlug: "skagway" });
  assert.equal(skagwayRun.status, "completed");
  assert.equal(skagwayRun.upstreamRequestCount, 2);
  const juneauCkptAfterSkagway = await getDestinationScheduleRefreshCheckpoint("juneau");
  const skagwayCkpt = await getDestinationScheduleRefreshCheckpoint("skagway");
  assert.equal(juneauCkptAfterSkagway?.cursorValue, juneauCkptBeforeSkagway?.cursorValue);
  assert.equal(skagwayCkpt?.destinationSlug, "skagway");
  assert.notEqual(skagwayCkpt?.streamKey, juneauCkptAfterSkagway?.streamKey);

  // C. Run >500-code synthetic-megaport (620 codes) in resumable chunks (Chunk 1 = 500, Chunk 2 = 120)
  const megaChunk1 = await runDestinationBoundedBulkScheduleRefresh({
    destinationSlug: "synthetic-megaport",
    chunkSize: 500,
    maxChunksPerRun: 1,
    resume: true,
  });
  assert.equal(megaChunk1.status as string, "in_progress");
  assert.equal(megaChunk1.upstreamRequestCount, 2);
  assert.equal(megaChunk1.updatedCount, 500);

  const megaCkptMid = await getDestinationScheduleRefreshCheckpoint("synthetic-megaport");
  assert.equal(megaCkptMid?.status, "in_progress");
  assert.equal(megaCkptMid?.nextStartOffset, 500);
  assert.equal(typeof (megaCkptMid?.metadata as any)?.codeSetHash, "string");
  assert.equal((megaCkptMid?.metadata as any)?.chunkPosition?.chunkIndex, 0);
  assert.equal((megaCkptMid?.metadata as any)?.chunkPosition?.totalChunks, 2);

  // Resume Chunk 2 (remaining 120 codes)
  const megaChunk2 = await runDestinationBoundedBulkScheduleRefresh({
    destinationSlug: "synthetic-megaport",
    chunkSize: 500,
    maxChunksPerRun: 1,
    resume: true,
  });
  assert.equal(megaChunk2.status, "completed");
  assert.equal(megaChunk2.upstreamRequestCount, 2);
  assert.equal(megaChunk2.updatedCount, 120);

  const megaCkptDone = await getDestinationScheduleRefreshCheckpoint("synthetic-megaport");
  assert.equal(megaCkptDone?.status, "completed");
  assert.equal(megaCkptDone?.nextStartOffset, null);
  assert.equal((megaCkptDone?.metadata as any)?.counts?.updatedCount, 620);

  // D. Re-running completed synthetic-megaport with identical upstream data is 100% idempotent (0 DB tour updates)
  const updatesBeforeIdempotentRerun = harness.metrics.catalogUpdatesExecuted;
  const megaIdempotent = await runDestinationBoundedBulkScheduleRefresh({
    destinationSlug: "synthetic-megaport",
    chunkSize: 500,
  });
  assert.equal(megaIdempotent.status, "completed");
  assert.equal(megaIdempotent.updatedCount, 0);
  assert.equal(megaIdempotent.upstreamRequestCount, 4); // 2 chunks * (1+1)
  assert.equal(harness.metrics.catalogUpdatesExecuted, updatesBeforeIdempotentRerun);
  assert.equal(harness.metrics.selectStarDetected, 0);
});

test("3. Global modified-since consumer stays disabled by default, processes >12 matches atomically, survives failure injections without advancing cursor, and replays (C0, C1] idempotently", async (t) => {
  // Seed 25 active DCC tours across multiple destinations to prove >12 per-page matches are processed
  const seededTours: SimTourRow[] = [];
  for (let i = 1; i <= 25; i++) {
    const dest = i <= 10 ? "skagway" : i <= 20 ? "ketchikan" : "cozumel";
    const code = `GLB${String(i).padStart(3, "0")}`;
    seededTours.push(makeSimTourRow({ destinationSlug: dest, code, fromPriceCents: 10000 }));
  }

  const harness = createSimulatedPgHarness(seededTours, [
    {
      stream_key: GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY,
      provider: "viator_schedule_pricing",
      destination_slug: null,
      cursor_value: SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0,
      next_start_offset: null,
      provider_total_count: 25,
      status: "completed",
      metadata_json: { checkpointContractVersion: "v2" },
      updated_at: "2026-11-18T16:48:53.000Z",
    },
  ]);

  let scheduleStreamCalls = 0;
  let productBulkCalls = 0;
  let perProductScheduleCalls = 0;
  let injectTransientStream429Once = false;

  clearDurableCatalogCachesForTests();
  setCatalogSqlQueryExecutorForTests(harness.executor);
  setViatorClientForTests({
    async getProductSchedules() {
      perProductScheduleCalls += 1;
      throw new Error("Global consumer MUST reuse availabilitySchedules[] and never call getProductSchedules");
    },
    async getProductsBulk(codes: string[]) {
      productBulkCalls += 1;
      return codes.map((c) => makeViatorProductPayload(c, undefined, ["DEFAULT", "VIP_PICKUP"]));
    },
    async getAvailabilitySchedulesModifiedSince(cursor?: string) {
      scheduleStreamCalls += 1;
      if (injectTransientStream429Once) {
        injectTransientStream429Once = false;
        throw new Error("viator_http_429:rate_limited");
      }
      if (cursor === SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0) {
        // 500-item global stream page containing all 25 DCC codes + 475 non-DCC global Viator codes.
        // GLB025 introduces a brand-new option code VIP_PICKUP so ONLY 1 code genuinely requires /products/bulk!
        const nonDcc = Array.from({ length: 475 }, (_, idx) =>
          makeViatorSchedulePayload(`WORLD${idx + 1}`, 99),
        );
        const dccSchedules = Array.from({ length: 25 }, (_, idx) => {
          const code = `GLB${String(idx + 1).padStart(3, "0")}`;
          const opts = code === "GLB025" ? ["DEFAULT", "VIP_PICKUP"] : ["DEFAULT"];
          return makeViatorSchedulePayload(code, 185, opts);
        });
        return {
          nextCursor: CLOBBERED_POST_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C1,
          availabilitySchedules: [...nonDcc, ...dccSchedules],
        };
      }
      return {
        nextCursor: cursor,
        availabilitySchedules: [],
      };
    },
  });

  const prevRefreshEnv = process.env.DCC_CATALOG_REFRESH_ENABLED;
  const prevVercelEnv = process.env.VERCEL_ENV;
  delete process.env.DCC_CATALOG_REFRESH_ENABLED;
  delete process.env.VERCEL_ENV;

  t.after(() => {
    if (prevRefreshEnv === undefined) delete process.env.DCC_CATALOG_REFRESH_ENABLED;
    else process.env.DCC_CATALOG_REFRESH_ENABLED = prevRefreshEnv;
    if (prevVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercelEnv;
    setCatalogSqlQueryExecutorForTests(null);
    setViatorClientForTests(null);
    clearDurableCatalogCachesForTests();
  });

  // A. Disabled by default when DCC_CATALOG_REFRESH_ENABLED is unset
  const pausedDefault = await runGlobalScheduleModifiedSinceRefresh();
  assert.equal(pausedDefault.status as string, "paused");
  assert.equal(pausedDefault.upstreamRequestCount, 0);
  assert.equal(scheduleStreamCalls, 0);

  // Blocked in VERCEL_ENV=production even if allowControlledGlobalExecution=true is passed
  process.env.VERCEL_ENV = "production";
  const pausedInProd = await runGlobalScheduleModifiedSinceRefresh({
    allowControlledGlobalExecution: true,
  });
  assert.equal(pausedInProd.status as string, "paused");
  assert.equal(scheduleStreamCalls, 0);
  process.env.VERCEL_ENV = "preview";

  // B. Failure injection MID-PROCESSING (after 10 of 25 items) -> cursor MUST stay at C0, 0 DB tour updates
  await assert.rejects(
    () =>
      runGlobalScheduleModifiedSinceRefresh({
        allowControlledGlobalExecution: true,
        maxPagesPerRun: 1,
        retryBaseDelayMs: 20,
        midPageProcessingHook: ({ itemIndex }) => {
          if (itemIndex === 10) {
            throw new Error("INJECTED_MID_PROCESSING_FAILURE");
          }
        },
      }),
    /INJECTED_MID_PROCESSING_FAILURE/,
  );
  assert.equal(
    (await getGlobalRefreshCheckpoint(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY))?.cursorValue,
    SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0,
  );
  assert.equal(harness.metrics.catalogUpdatesExecuted, 0);

  // C. Failure injection BEFORE COMMIT -> cursor MUST stay at C0, 0 DB tour updates
  await assert.rejects(
    () =>
      runGlobalScheduleModifiedSinceRefresh({
        allowControlledGlobalExecution: true,
        maxPagesPerRun: 1,
        retryBaseDelayMs: 20,
        beforePageCommitHook: () => {
          throw new Error("INJECTED_BEFORE_COMMIT_FAILURE");
        },
      }),
    /INJECTED_BEFORE_COMMIT_FAILURE/,
  );
  assert.equal(
    (await getGlobalRefreshCheckpoint(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY))?.cursorValue,
    SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0,
  );
  assert.equal(harness.metrics.catalogUpdatesExecuted, 0);

  // D. Failure injection MID-TRANSACTION (after 5 SQL UPDATE statements inside BEGIN) -> ROLLBACK leaves cursor at C0 and all 25 tours untouched!
  await assert.rejects(
    () =>
      runGlobalScheduleModifiedSinceRefresh({
        allowControlledGlobalExecution: true,
        maxPagesPerRun: 1,
        retryBaseDelayMs: 20,
        midPageTransactionHook: (stmtIdx) => {
          if (stmtIdx === 5) {
            throw new Error("INJECTED_MID_TRANSACTION_FAILURE");
          }
        },
      }),
    /INJECTED_MID_TRANSACTION_FAILURE/,
  );
  assert.equal(harness.metrics.transactionsRolledBack, 1);
  assert.equal(
    (await getGlobalRefreshCheckpoint(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY))?.cursorValue,
    SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0,
  );
  assert.equal(harness.getTour("viator:skagway:GLB001")?.from_price_cents, 10000);

  // E. Replay (C0, C1] cleanly (with 1 transient 429 retry) -> all 25 matches (>12!) updated & cursor moves to C1 atomically!
  scheduleStreamCalls = 0;
  productBulkCalls = 0;
  injectTransientStream429Once = true;

  const cleanReplay = await runGlobalScheduleModifiedSinceRefresh({
    allowControlledGlobalExecution: true,
    maxPagesPerRun: 5,
    retryBaseDelayMs: 20,
  });
  assert.equal(cleanReplay.status, "completed");
  assert.equal(cleanReplay.updatedCount, 25, "All 25 matches (> LIMIT 12) must be updated");
  assert.equal(cleanReplay.cursorValue, CLOBBERED_POST_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C1);
  assert.equal(perProductScheduleCalls, 0);
  assert.equal(productBulkCalls, 1, "Only 1 /products/bulk call for GLB025's new option code");
  // 2 pages scanned (Page 0: C0->C1 with 1 retry = 2 attempts; Page 1: C1->empty = 1 attempt) + 1 productBulk = 4 upstream requests
  assert.equal(cleanReplay.upstreamRequestCount, 4);
  assert.equal((cleanReplay.metadata as any)?.retryAttemptsTotal, 1);
  assert.equal((cleanReplay.metadata as any)?.streamDrained, true);

  const globalAfterClean = await getGlobalRefreshCheckpoint(
    GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY,
  );
  assert.equal(globalAfterClean?.cursorValue, CLOBBERED_POST_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C1);
  assert.equal(globalAfterClean?.destinationSlug, null);
  assert.equal(harness.getTour("viator:skagway:GLB001")?.from_price_cents, 18500);
  assert.equal(harness.getTour("viator:cozumel:GLB025")?.from_price_cents, 18500);

  // F. Replaying the already-committed (C0, C1] page produces 0 duplicate records and 0 row updates (zero churn)
  const updatesBeforeCommittedReplay = harness.metrics.catalogUpdatesExecuted;
  const totalToursBefore = harness.getAllTours().length;

  const idempotentReplay = await runGlobalScheduleModifiedSinceRefresh({
    allowControlledGlobalExecution: true,
    scheduleCursor: SAVED_PRE_JUNEAU_GLOBAL_SCHEDULE_CURSOR_C0,
    maxPagesPerRun: 1,
    retryBaseDelayMs: 20,
  });
  assert.equal(idempotentReplay.status, "completed");
  assert.equal(idempotentReplay.updatedCount, 0);
  assert.equal((idempotentReplay.metadata as any)?.unchangedCount, 25);
  assert.equal(harness.metrics.catalogUpdatesExecuted, updatesBeforeCommittedReplay);
  assert.equal(harness.getAllTours().length, totalToursBefore);
});
