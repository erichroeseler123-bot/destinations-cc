import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST as catalogRoutePost } from "@/app/api/v1/tours/catalog/route";
import {
  buildAvailabilitySchedulesModifiedSinceEndpointPath,
  buildProductsModifiedSinceEndpointPath,
  setViatorClientForTests,
  type ViatorProductsModifiedSinceInput,
  type ViatorSchedulesModifiedSinceInput,
} from "@/lib/viator/client";
import {
  GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY,
  GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY,
  assertViatorIso8601UtcTimestamp,
  extractLiteralProviderNextCursor,
  validateViatorModifiedSinceSelector,
  type ViatorModifiedSinceEntrySelector,
} from "@/lib/dcc/catalog/checkpointContract";
import {
  clearDurableCatalogCachesForTests,
  getGlobalRefreshCheckpoint,
  setCatalogSqlQueryExecutorForTests,
} from "@/lib/dcc/catalog/durableCatalogStore";
import {
  runGlobalScheduleModifiedSinceRefresh,
  runIncrementalScheduleAndPricingRefresh,
  runIncrementalViatorCatalogRefresh,
} from "@/lib/dcc/catalog/ingest";

// ---------------------------------------------------------------------------
// 1. Compile-time Type-Layer Mutual Exclusion Proof (Verified by `tsc --noEmit`)
// ---------------------------------------------------------------------------
function _compileTimeTypeMutualExclusionProof() {
  const validCursorOnly: ViatorModifiedSinceEntrySelector = { cursor: "OPAQUE_PROVIDER_TOKEN_1" };
  const validModifiedSinceOnly: ViatorModifiedSinceEntrySelector = {
    modifiedSince: "2026-11-18T18:20:00Z",
  };
  const validEmpty: ViatorModifiedSinceEntrySelector = {};

  // @ts-expect-error — cursor and modifiedSince are mutually exclusive at the type layer
  const invalidSelectorBoth: ViatorModifiedSinceEntrySelector = {
    cursor: "OPAQUE_PROVIDER_TOKEN_1",
    modifiedSince: "2026-11-18T18:20:00Z",
  };

  // @ts-expect-error — ViatorSchedulesModifiedSinceInput forbids combining cursor and modifiedSince
  const invalidSchedClientInput: ViatorSchedulesModifiedSinceInput = {
    cursor: "OPAQUE_PROVIDER_TOKEN_1",
    modifiedSince: "2026-11-18T18:20:00Z",
  };

  // @ts-expect-error — ViatorProductsModifiedSinceInput forbids combining cursor and modifiedSince
  const invalidProdClientInput: ViatorProductsModifiedSinceInput = {
    cursor: "OPAQUE_PROVIDER_TOKEN_1",
    modifiedSince: "2026-11-18T18:20:00Z",
    count: 500,
  };

  void validCursorOnly;
  void validModifiedSinceOnly;
  void validEmpty;
  void invalidSelectorBoth;
  void invalidSchedClientInput;
  void invalidProdClientInput;
}
void _compileTimeTypeMutualExclusionProof;

// ---------------------------------------------------------------------------
// Simulated Postgres Harness for Atomic Transaction & Rollback Verification
// ---------------------------------------------------------------------------
type SimRow = Record<string, any>;

function makeTourRow(destinationSlug: string, code: string, priceCents = 12000): SimRow {
  const upper = code.toUpperCase();
  return {
    tour_id: `dcc:tour:viator:${upper}`,
    compatibility_aliases: [upper],
    destination_slug: destinationSlug,
    port_slug: destinationSlug,
    earthos_destination_node_id: `earthos:node:${destinationSlug}`,
    time_zone: "America/New_York",
    title: `Tour ${upper}`,
    summary: `Summary for ${upper}`,
    category: "Guided Sightseeing & Excursions",
    tags: [],
    primary_provider: "viator",
    provider_product_code: upper,
    operator_name: "Operator",
    operator_code: "OP",
    capability_tier: "live_check_referral",
    commission_authorized: true,
    duration_minutes: 120,
    duration_raw_text: "2 hours",
    from_price_cents: priceCents,
    price_basis: "per_person",
    currency: "USD",
    free_cancellation: true,
    cancellation_policy_type: "STANDARD",
    cancellation_cutoff_hours: 24,
    cancellation_summary: "Free cancellation up to 24 hours before start.",
    has_hotel_pickup: false,
    lowest_price_includes_pickup: false,
    pickup_type: "UNKNOWN",
    pickup_summary: null,
    meeting_point_name: "Harbor Pier",
    meeting_point_address: "1 Harbor Pier",
    meeting_point_lat: 25.77,
    meeting_point_lng: -80.19,
    location_precision: "exact",
    pickup_locations_json: [],
    age_bands_json: [{ ageBand: "ADULT", startAge: 18, endAge: 99 }],
    constraints_json: {
      cruiseBufferBeforeMinutes: null,
      cruiseBufferAfterMinutes: null,
      transferTimeSource: "unknown",
      transferEvidenceSource: null,
      applicableBerthOrMeetingPoint: null,
      planningEstimateTransferMinutes: 30,
    },
    channel_offers_json: [],
    product_options_json: [
      {
        optionCode: "DEFAULT",
        title: `Tour ${upper}`,
        description: null,
        includesPickup: false,
        pickupFulfillmentType: "unknown",
        meetingPointName: "Harbor Pier",
        meetingPointLat: 25.77,
        meetingPointLng: -80.19,
        transferBeforeMinutes: null,
        transferAfterMinutes: null,
        transferTimeSource: "unknown",
        transferEvidenceSource: null,
        applicableBerthOrMeetingPoint: null,
        planningEstimateTransferMinutes: 30,
        durationMinutes: 120,
        fromPriceCents: priceCents,
        priceBasis: "per_person",
        scheduledStartTimes: ["09:00"],
      },
    ],
    service_details_json: { pickupFulfillmentType: "unknown" },
    inclusions_json: [],
    exclusions_json: [],
    primary_image_url: null,
    rating_average: 4.9,
    review_count: 25,
    booking_url: `https://www.viator.com/tours/x/${upper}`,
    provenance_json: {
      sourceSystem: "viator",
      sourceEndpoint: "seed",
      fetchedAt: "2026-11-18T18:00:00.000Z",
    },
    quarantined: false,
    quarantine_reason: null,
    active: true,
    last_verified_at: "2026-11-18T18:00:00.000Z",
    updated_at: "2026-11-18T18:00:00.000Z",
    created_at: "2026-11-18T18:00:00.000Z",
  };
}

function createSimPg(initialTours: SimRow[], initialCheckpoints: SimRow[]) {
  let tours = new Map<string, SimRow>(initialTours.map((r) => [r.tour_id, structuredClone(r)]));
  let checkpoints = new Map<string, SimRow>(
    initialCheckpoints.map((c) => [c.stream_key, structuredClone(c)]),
  );
  let txBackup: { tours: Map<string, SimRow>; checkpoints: Map<string, SimRow> } | null = null;
  const stats = {
    catalogWrites: 0,
    checkpointWrites: 0,
    commits: 0,
    rollbacks: 0,
  };

  const executor = async (queryText: string, params: unknown[] = []): Promise<SimRow[]> => {
    const q = queryText.trim();
    if (q === "BEGIN") {
      txBackup = {
        tours: new Map(Array.from(tours.entries()).map(([k, v]) => [k, structuredClone(v)])),
        checkpoints: new Map(
          Array.from(checkpoints.entries()).map(([k, v]) => [k, structuredClone(v)]),
        ),
      };
      return [];
    }
    if (q === "COMMIT") {
      txBackup = null;
      stats.commits += 1;
      return [];
    }
    if (q === "ROLLBACK") {
      if (txBackup) {
        tours = txBackup.tours;
        checkpoints = txBackup.checkpoints;
        txBackup = null;
      }
      stats.rollbacks += 1;
      return [];
    }
    if (q.includes("FROM dcc_catalog_refresh_checkpoints") && q.includes("WHERE stream_key = $1")) {
      const row = checkpoints.get(String(params[0]));
      return row ? [structuredClone(row)] : [];
    }
    if (q.includes("INSERT INTO dcc_catalog_refresh_checkpoints")) {
      const streamKey = String(params[0]);
      const destSlug = params[2] == null ? null : String(params[2]);
      if (
        (streamKey === GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY ||
          streamKey === GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY) &&
        destSlug !== null
      ) {
        throw new Error("checkpoint_scope_violation: global cursor requires destination_slug IS NULL");
      }
      checkpoints.set(streamKey, {
        stream_key: streamKey,
        provider: String(params[1]),
        destination_slug: destSlug,
        cursor_value: params[3] == null ? null : String(params[3]),
        next_start_offset: typeof params[4] === "number" ? params[4] : null,
        provider_total_count: typeof params[5] === "number" ? params[5] : null,
        status: String(params[6]),
        metadata_json: JSON.parse(String(params[7] || "{}")),
        updated_at: String(params[8]),
      });
      stats.checkpointWrites += 1;
      return [];
    }
    if (q.includes("SELECT UPPER(provider_product_code) AS code") && q.includes("primary_provider = $2")) {
      return Array.from(tours.values())
        .filter((r) => r.active && !r.quarantined && r.primary_provider === params[1])
        .map((r) => ({ code: String(r.provider_product_code).toUpperCase() }));
    }
    if (q.includes("FROM dcc_tour_catalog") && q.includes("UPPER(provider_product_code) = ANY($3::text[])")) {
      const codeSet = new Set(((params[2] as string[]) || []).map((c) => c.toUpperCase()));
      return Array.from(tours.values())
        .filter((r) => r.active && !r.quarantined && codeSet.has(r.provider_product_code.toUpperCase()))
        .map((r) => structuredClone(r));
    }
    if (q.includes("UPDATE dcc_tour_catalog") && q.includes("WHERE tour_id = $1")) {
      const existing = tours.get(String(params[0]));
      if (existing) {
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
        stats.catalogWrites += 1;
      }
      return [];
    }
    if (q.includes("UPDATE dcc_tour_catalog") && q.includes("SET active = false")) {
      const patch = JSON.parse(String(params[0] || "{}"));
      const codeUpper = String(params[1] || "").toUpperCase();
      for (const row of tours.values()) {
        if (row.provider_product_code.toUpperCase() === codeUpper) {
          row.active = false;
          row.service_details_json = { ...(row.service_details_json || {}), ...patch };
          stats.catalogWrites += 1;
        }
      }
      return [];
    }
    return [];
  };

  return {
    executor,
    stats,
    getTour: (id: string) => tours.get(id),
    getCheckpoint: (key: string) => checkpoints.get(key),
  };
}

test("1. Validation, request-construction, and HTTP route layers enforce cursor vs modifiedSince mutual exclusion and strict ISO-8601 UTC", async () => {
  // Valid ISO-8601 UTC timestamps
  assert.equal(assertViatorIso8601UtcTimestamp("2026-11-18T18:20:00Z"), "2026-11-18T18:20:00Z");
  assert.equal(
    assertViatorIso8601UtcTimestamp("2026-11-18T18:20:00.737043Z"),
    "2026-11-18T18:20:00.737043Z",
  );

  // Rejects non-UTC offsets, pre-encoded colons, impossible dates, Base64 strings, future dates
  assert.throws(
    () => assertViatorIso8601UtcTimestamp("2026-11-18T11:20:00-07:00"),
    /viator_modified_since_invalid_iso8601_utc/,
  );
  assert.throws(
    () => assertViatorIso8601UtcTimestamp("2026-11-18T18:20:00+00:00"),
    /viator_modified_since_invalid_iso8601_utc/,
  );
  assert.throws(
    () => assertViatorIso8601UtcTimestamp("2026-11-18T18%3A20%3A00Z"),
    /viator_modified_since_preencoded_timestamp/,
  );
  assert.throws(
    () => assertViatorIso8601UtcTimestamp("2026-02-30T00:00:00Z"),
    /viator_modified_since_invalid_calendar_date/,
  );
  assert.throws(
    () => assertViatorIso8601UtcTimestamp("MTc5MzQ4MTA1OTAwMDAwMHwxMDA1MzlQOQ=="),
    /viator_modified_since_invalid_iso8601_utc/,
  );
  assert.throws(
    () => assertViatorIso8601UtcTimestamp("2099-01-01T00:00:00Z"),
    /viator_modified_since_future_timestamp/,
  );

  // Mutual exclusion in validator
  assert.throws(
    () =>
      validateViatorModifiedSinceSelector({
        cursor: "MTc5MzQ4NTE3MDAwMDAwMHw3MTg3NlAz",
        modifiedSince: "2026-11-18T18:20:00Z",
      }),
    /viator_modified_since_and_cursor_mutually_exclusive/,
  );
  assert.throws(
    () =>
      validateViatorModifiedSinceSelector({
        cursor: "",
        modifiedSince: "2026-11-18T18:20:00Z",
      }),
    /viator_modified_since_and_cursor_mutually_exclusive/,
  );

  // Request-construction URLs encode colons once (%3A) and never combine cursor + modified-since
  assert.equal(
    buildAvailabilitySchedulesModifiedSinceEndpointPath({
      modifiedSince: "2026-11-18T18:20:00Z",
      count: 500,
    }),
    "/availability/schedules/modified-since?count=500&modified-since=2026-11-18T18%3A20%3A00Z",
  );
  assert.equal(
    buildAvailabilitySchedulesModifiedSinceEndpointPath({
      cursor: "MTc5MzQ4NTE3MDAwMDAwMHw3MTg3NlAz+/",
      count: 500,
    }),
    "/availability/schedules/modified-since?count=500&cursor=MTc5MzQ4NTE3MDAwMDAwMHw3MTg3NlAz%2B%2F",
  );
  assert.equal(
    buildProductsModifiedSinceEndpointPath({
      modifiedSince: "2026-11-18T18:20:00Z",
      count: 500,
    }),
    "/products/modified-since?count=500&modified-since=2026-11-18T18%3A20%3A00Z",
  );
  assert.equal(
    buildProductsModifiedSinceEndpointPath({
      cursor: "MTU3NDA0MzU1NQ==",
      count: 500,
    }),
    "/products/modified-since?count=500&cursor=MTU3NDA0MzU1NQ%3D%3D",
  );

  assert.throws(
    () =>
      buildAvailabilitySchedulesModifiedSinceEndpointPath({
        cursor: "ABC",
        modifiedSince: "2026-11-18T18:20:00Z",
      } as any),
    /viator_modified_since_and_cursor_mutually_exclusive/,
  );
  assert.throws(
    () =>
      buildProductsModifiedSinceEndpointPath({
        cursor: "ABC",
        modifiedSince: "2026-11-18T18:20:00Z",
      } as any),
    /viator_modified_since_and_cursor_mutually_exclusive/,
  );

  // Literal provider cursor extraction
  assert.equal(
    extractLiteralProviderNextCursor({ nextCursor: "PROVIDER_OPAQUE_TOKEN_99==" }),
    "PROVIDER_OPAQUE_TOKEN_99==",
  );
  assert.equal(extractLiteralProviderNextCursor({}), null);

  // HTTP route rejects cursor + modifiedSince with 400 and rejects destination_bulk_refresh + modifiedSince with 400
  const prevAdminSecret = process.env.DCC_COMMERCE_ADMIN_SECRET;
  process.env.DCC_COMMERCE_ADMIN_SECRET = "test-gate0-secret";
  try {
    const bothReq = new NextRequest("http://localhost/api/v1/tours/catalog", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-dcc-admin-secret": "test-gate0-secret",
      },
      body: JSON.stringify({
        mode: "global_schedule_modified_since",
        cursor: "OPAQUE_CURSOR",
        modifiedSince: "2026-11-18T18:20:00Z",
      }),
    });
    const bothRes = await catalogRoutePost(bothReq);
    assert.equal(bothRes.status, 400);
    const bothJson: any = await bothRes.json();
    assert.match(String(bothJson.error), /viator_modified_since_and_cursor_mutually_exclusive/);

    const destWithModSinceReq = new NextRequest("http://localhost/api/v1/tours/catalog", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-dcc-admin-secret": "test-gate0-secret",
      },
      body: JSON.stringify({
        mode: "destination_bulk_refresh",
        destinationSlug: "miami",
        modifiedSince: "2026-11-18T18:20:00Z",
      }),
    });
    const destRes = await catalogRoutePost(destWithModSinceReq);
    assert.equal(destRes.status, 400);
    const destJson: any = await destRes.json();
    assert.match(String(destJson.error), /checkpoint_scope_violation/);

    await assert.rejects(
      runIncrementalScheduleAndPricingRefresh({
        destinationSlug: "miami",
        modifiedSince: "2026-11-18T18:20:00Z",
      }),
      /checkpoint_scope_violation/,
    );
  } finally {
    if (prevAdminSecret === undefined) delete process.env.DCC_COMMERCE_ADMIN_SECRET;
    else process.env.DCC_COMMERCE_ADMIN_SECRET = prevAdminSecret;
  }
});

test("2. availability/schedules/modified-since: Page 1 via modified-since -> Page 2 via provider cursor only, atomic rollback, ceiling, and replay idempotency", async (t) => {
  const sim = createSimPg(
    [makeTourRow("miami", "MIA101", 10000), makeTourRow("reykjavik", "REK202", 15000)],
    [
      {
        stream_key: GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY,
        provider: "viator_schedule_pricing",
        destination_slug: null,
        cursor_value: "OLD_STALE_SCHEDULE_CURSOR_0",
        next_start_offset: null,
        provider_total_count: 2,
        status: "completed",
        metadata_json: {},
        updated_at: "2026-10-31T21:10:59.000Z",
      },
    ],
  );
  setCatalogSqlQueryExecutorForTests(sim.executor);

  const recordedPaths: string[] = [];
  const PROVIDER_SCHED_CURSOR_P1 = "PROV_OPAQUE_SCHED_CURSOR_PAGE_1==";
  const PROVIDER_SCHED_CURSOR_P2 = "PROV_OPAQUE_SCHED_CURSOR_PAGE_2==";

  setViatorClientForTests({
    async getAvailabilitySchedulesModifiedSince(input) {
      const path = buildAvailabilitySchedulesModifiedSinceEndpointPath(input);
      recordedPaths.push(path);
      if (input?.modifiedSince === "2026-11-18T18:20:00Z") {
        assert.equal(input.cursor, undefined);
        return {
          nextCursor: PROVIDER_SCHED_CURSOR_P1,
          availabilitySchedules: [
            {
              productCode: "MIA101",
              currency: "USD",
              summary: { fromPrice: 135 },
              bookableItems: [
                {
                  productOptionCode: "DEFAULT",
                  seasons: [
                    {
                      startDate: "2026-11-20",
                      pricingRecords: [
                        {
                          timedEntries: [{ startTime: "09:00" }],
                          pricingDetails: [
                            {
                              ageBand: "ADULT",
                              price: { original: { recommendedRetailPrice: 135 } },
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
        };
      }
      if (input?.cursor === PROVIDER_SCHED_CURSOR_P1) {
        assert.equal(input.modifiedSince, undefined);
        return {
          nextCursor: PROVIDER_SCHED_CURSOR_P2,
          availabilitySchedules: [
            {
              productCode: "REK202",
              currency: "USD",
              summary: { fromPrice: 175 },
              bookableItems: [
                {
                  productOptionCode: "DEFAULT",
                  seasons: [
                    {
                      startDate: "2026-11-20",
                      pricingRecords: [
                        {
                          timedEntries: [{ startTime: "10:30" }],
                          pricingDetails: [
                            {
                              ageBand: "ADULT",
                              price: { original: { recommendedRetailPrice: 175 } },
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
        };
      }
      return { availabilitySchedules: [] };
    },
  });

  t.after(() => {
    setCatalogSqlQueryExecutorForTests(null);
    setViatorClientForTests(null);
    clearDurableCatalogCachesForTests();
  });

  // A. Failure injection mid-transaction on Page 1 rolls back BOTH catalog row AND cursor
  await assert.rejects(
    runGlobalScheduleModifiedSinceRefresh({
      allowControlledGlobalExecution: true,
      modifiedSince: "2026-11-18T18:20:00Z",
      count: 500,
      maxPagesPerRun: 1,
      midPageTransactionHook: (stmtIdx) => {
        if (stmtIdx === 1) throw new Error("INJECTED_SCHED_TX_ABORT");
      },
    }),
    /INJECTED_SCHED_TX_ABORT/,
  );
  assert.equal(sim.stats.rollbacks, 1);
  assert.equal(sim.getTour("dcc:tour:viator:MIA101")?.from_price_cents, 10000);
  assert.equal(
    (await getGlobalRefreshCheckpoint(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY))?.cursorValue,
    "OLD_STALE_SCHEDULE_CURSOR_0",
  );

  // B. Request ceiling: maxPagesPerRun = 1 executes ONLY Page 1 with modified-since and commits PROVIDER_SCHED_CURSOR_P1
  recordedPaths.length = 0;
  const page1Run = await runGlobalScheduleModifiedSinceRefresh({
    allowControlledGlobalExecution: true,
    modifiedSince: "2026-11-18T18:20:00Z",
    count: 500,
    maxPagesPerRun: 1,
  });
  assert.deepEqual(recordedPaths, [
    "/availability/schedules/modified-since?count=500&modified-since=2026-11-18T18%3A20%3A00Z",
  ]);
  assert.equal(page1Run.updatedCount, 1);
  assert.equal(sim.getTour("dcc:tour:viator:MIA101")?.from_price_cents, 13500);
  const ckptAfterP1 = await getGlobalRefreshCheckpoint(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY);
  assert.equal(ckptAfterP1?.cursorValue, PROVIDER_SCHED_CURSOR_P1);
  assert.equal(ckptAfterP1?.destinationSlug, null);
  assert.equal(ckptAfterP1?.status, "in_progress");

  // C. Page 2 continuation from persisted checkpoint uses ONLY ?cursor=PROVIDER_SCHED_CURSOR_P1 (no modified-since)
  const page2Run = await runGlobalScheduleModifiedSinceRefresh({
    allowControlledGlobalExecution: true,
    count: 500,
    maxPagesPerRun: 2,
  });
  assert.deepEqual(recordedPaths.slice(1), [
    `/availability/schedules/modified-since?count=500&cursor=${encodeURIComponent(PROVIDER_SCHED_CURSOR_P1)}`,
    `/availability/schedules/modified-since?count=500&cursor=${encodeURIComponent(PROVIDER_SCHED_CURSOR_P2)}`,
  ]);
  assert.equal(page2Run.updatedCount, 1);
  assert.equal(sim.getTour("dcc:tour:viator:REK202")?.from_price_cents, 17500);
  const ckptAfterDrain = await getGlobalRefreshCheckpoint(GLOBAL_SCHEDULES_MODIFIED_SINCE_STREAM_KEY);
  assert.equal(ckptAfterDrain?.cursorValue, PROVIDER_SCHED_CURSOR_P2);
  assert.equal(ckptAfterDrain?.status, "completed");

  // D. Replay idempotency: re-running from modifiedSince = 2026-11-18T18:20:00Z across both pages produces 0 catalog writes
  const writesBeforeReplay = sim.stats.catalogWrites;
  const replayRun = await runGlobalScheduleModifiedSinceRefresh({
    allowControlledGlobalExecution: true,
    modifiedSince: "2026-11-18T18:20:00Z",
    count: 500,
    maxPagesPerRun: 3,
  });
  assert.equal(replayRun.updatedCount, 0);
  assert.equal((replayRun.metadata as any)?.unchangedCount, 2);
  assert.equal(sim.stats.catalogWrites, writesBeforeReplay);
});

test("3. products/modified-since: Page 1 via modified-since -> Page 2 via provider cursor only, refusal on missing cursor, rollback, and idempotency", async (t) => {
  const sim = createSimPg(
    [makeTourRow("cozumel", "CZM301", 8000), makeTourRow("seattle", "SEA402", 9500)],
    [
      {
        stream_key: GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY,
        provider: "viator_incremental",
        destination_slug: null,
        cursor_value: "OLD_STALE_PRODUCT_CURSOR_0",
        next_start_offset: null,
        provider_total_count: 2,
        status: "completed",
        metadata_json: {},
        updated_at: "2026-11-05T17:43:52.000Z",
      },
    ],
  );
  setCatalogSqlQueryExecutorForTests(sim.executor);

  const recordedProdPaths: string[] = [];
  const PROVIDER_PROD_CURSOR_P1 = "PROV_OPAQUE_PROD_CURSOR_PAGE_1==";
  const PROVIDER_PROD_CURSOR_P2 = "PROV_OPAQUE_PROD_CURSOR_PAGE_2==";
  let simulateMissingNextCursorOnAnchor = false;

  setViatorClientForTests({
    async getProductsModifiedSince(input) {
      const path = buildProductsModifiedSinceEndpointPath(input);
      recordedProdPaths.push(path);
      if (simulateMissingNextCursorOnAnchor) {
        return { products: [] };
      }
      if (input?.modifiedSince === "2026-11-18T18:20:00Z") {
        assert.equal(input.cursor, undefined);
        return {
          nextCursor: PROVIDER_PROD_CURSOR_P1,
          products: [
            {
              productCode: "CZM301",
              status: "ACTIVE",
              title: "Cozumel Reef Snorkel Updated",
              description: "Summary for CZM301",
              pricingInfo: { type: "PER_PERSON" },
              itinerary: { duration: { fixedDurationInMinutes: 180 } },
              productOptions: [{ productOptionCode: "DEFAULT", title: "Tour CZM301" }],
            },
          ],
        };
      }
      if (input?.cursor === PROVIDER_PROD_CURSOR_P1) {
        assert.equal(input.modifiedSince, undefined);
        return {
          nextCursor: PROVIDER_PROD_CURSOR_P2,
          products: [
            {
              productCode: "SEA402",
              status: "INACTIVE",
            },
          ],
        };
      }
      return { products: [] };
    },
    async getAvailabilitySchedulesBulk(codes) {
      return {
        availabilitySchedules: codes.map((code) => ({
          productCode: code,
          currency: "USD",
          summary: { fromPrice: 80 },
          bookableItems: [
            {
              productOptionCode: "DEFAULT",
              seasons: [
                {
                  startDate: "2026-11-20",
                  pricingRecords: [
                    {
                      timedEntries: [{ startTime: "09:00" }],
                      pricingDetails: [
                        {
                          ageBand: "ADULT",
                          price: { original: { recommendedRetailPrice: 80 } },
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
  });

  t.after(() => {
    setCatalogSqlQueryExecutorForTests(null);
    setViatorClientForTests(null);
    clearDurableCatalogCachesForTests();
  });

  // A. Refuses to fabricate or overwrite cursor if Page 0 modified-since returns no nextCursor
  simulateMissingNextCursorOnAnchor = true;
  await assert.rejects(
    runIncrementalViatorCatalogRefresh({
      allowControlledGlobalExecution: true,
      includeScheduleAndPricingRefresh: false,
      modifiedSince: "2026-11-18T18:20:00Z",
      count: 500,
      maxPagesPerRun: 1,
    }),
    /viator_modified_since_no_provider_cursor_returned/,
  );
  simulateMissingNextCursorOnAnchor = false;
  assert.equal(
    (await getGlobalRefreshCheckpoint(GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY))?.cursorValue,
    "OLD_STALE_PRODUCT_CURSOR_0",
  );

  // B. Mid-transaction failure rolls back both catalog update and product stream cursor
  await assert.rejects(
    runIncrementalViatorCatalogRefresh({
      allowControlledGlobalExecution: true,
      includeScheduleAndPricingRefresh: false,
      modifiedSince: "2026-11-18T18:20:00Z",
      count: 500,
      maxPagesPerRun: 1,
      midPageTransactionHook: (stmtIdx) => {
        if (stmtIdx === 1) throw new Error("INJECTED_PROD_TX_ABORT");
      },
    }),
    /INJECTED_PROD_TX_ABORT/,
  );
  assert.equal(sim.getTour("dcc:tour:viator:CZM301")?.title, "Tour CZM301");
  assert.equal(
    (await getGlobalRefreshCheckpoint(GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY))?.cursorValue,
    "OLD_STALE_PRODUCT_CURSOR_0",
  );

  // C. Multi-page execution (maxPagesPerRun = 3): Page 1 uses modified-since, Page 2 & 3 use ONLY provider-returned cursors
  recordedProdPaths.length = 0;
  const prodRun = await runIncrementalViatorCatalogRefresh({
    allowControlledGlobalExecution: true,
    includeScheduleAndPricingRefresh: false,
    modifiedSince: "2026-11-18T18:20:00Z",
    count: 500,
    maxPagesPerRun: 3,
  });
  assert.deepEqual(recordedProdPaths, [
    "/products/modified-since?count=500&modified-since=2026-11-18T18%3A20%3A00Z",
    `/products/modified-since?count=500&cursor=${encodeURIComponent(PROVIDER_PROD_CURSOR_P1)}`,
    `/products/modified-since?count=500&cursor=${encodeURIComponent(PROVIDER_PROD_CURSOR_P2)}`,
  ]);
  assert.equal(prodRun.updatedCount, 1);
  assert.equal((prodRun.metadata as any)?.retiredCount, 1);
  assert.equal(sim.getTour("dcc:tour:viator:CZM301")?.title, "Cozumel Reef Snorkel Updated");
  assert.equal(sim.getTour("dcc:tour:viator:SEA402")?.active, false);
  const prodCkpt = await getGlobalRefreshCheckpoint(GLOBAL_PRODUCTS_MODIFIED_SINCE_STREAM_KEY);
  assert.equal(prodCkpt?.cursorValue, PROVIDER_PROD_CURSOR_P2);
  assert.equal(prodCkpt?.destinationSlug, null);
  assert.equal(prodCkpt?.status, "completed");

  // D. Replay idempotency: re-running produces 0 catalog writes
  const writesBeforeReplay = sim.stats.catalogWrites;
  const prodReplay = await runIncrementalViatorCatalogRefresh({
    allowControlledGlobalExecution: true,
    includeScheduleAndPricingRefresh: false,
    modifiedSince: "2026-11-18T18:20:00Z",
    count: 500,
    maxPagesPerRun: 3,
  });
  assert.equal(prodReplay.updatedCount, 0);
  assert.equal((prodReplay.metadata as any)?.retiredCount, 0);
  assert.equal((prodReplay.metadata as any)?.unchangedCount, 1);
  assert.equal(sim.stats.catalogWrites, writesBeforeReplay);
});
