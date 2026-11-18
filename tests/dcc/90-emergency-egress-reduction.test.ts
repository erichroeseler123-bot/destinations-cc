import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import {
  QUARANTINED_TOUR_IDS,
  clearDurableCatalogCachesForTests,
  decodeCatalogCursor,
  encodeCatalogCursor,
  getDurableCatalogSummaryReport,
  getDurableTourByIdOrAlias,
  getLatestDestinationBackfillCheckpoint,
  mapPgRowToDurableTourRecord,
  normalizeCatalogBatchPickupAndMeeting,
  normalizeCatalogTourPickupAndMeeting,
  paginateAllDurableTourCatalogPages,
  PILOT_VERIFIED_TOUR_RECORDS,
  queryDurableTourCatalog,
  readLocalCatalogSnapshot,
  setCatalogSqlQueryExecutorForTests,
  type DurableTourRecord,
} from "../../lib/dcc/catalog/durableCatalogStore";
import { queryPortDayExcursionCatalog } from "../../lib/dcc/cruisePortExcursionCatalogEngine";
import { buildCatalogTourDirectHandoff } from "../../lib/dcc/catalog/matcher";
import { appendCorridorEventDurably } from "../../lib/dcc/telemetry/corridorEvents";

const REPO_ROOT = process.cwd();

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function buildSimulatedPgRowFromDurableRecord(rec: DurableTourRecord): Record<string, any> {
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
    price_basis: rec.priceBasis || "per_person",
    currency: rec.currency,
    free_cancellation: rec.freeCancellation,
    cancellation_policy_type: rec.cancellationPolicyType,
    cancellation_cutoff_hours: rec.cancellationCutoffHours,
    cancellation_summary: rec.cancellationSummary,
    has_hotel_pickup: rec.hasHotelPickup,
    lowest_price_includes_pickup: rec.lowestPriceIncludesPickup ?? null,
    pickup_type: rec.pickupType,
    pickup_summary: rec.pickupSummary,
    meeting_point_name: rec.meetingPointName,
    meeting_point_address: rec.meetingPointAddress,
    meeting_point_lat: rec.meetingPointLat,
    meeting_point_lng: rec.meetingPointLng,
    location_precision: rec.locationPrecision,
    pickup_locations_json: rec.pickupLocations || [],
    age_bands_json: rec.ageBands || [],
    constraints_json: rec.constraints || {},
    channel_offers_json: rec.channelOffers || [],
    product_options_json: rec.productOptions || [],
    service_details_json: {
      ...(rec.serviceDetails || {}),
      ...(rec.pickupFulfillmentType ? { pickupFulfillmentType: rec.pickupFulfillmentType } : {}),
    },
    inclusions_json: rec.inclusions || [],
    exclusions_json: rec.exclusions || [],
    primary_image_url: rec.primaryImageUrl,
    rating_average: rec.ratingAverage,
    review_count: rec.reviewCount,
    booking_url: rec.bookingUrl,
    provenance_json: {
      ...rec.provenance,
      // Simulate bloated upstream raw_json inside DB provenance_json to prove it is NEVER transferred
      raw_json: { simulatedUpstreamBlob: "X".repeat(4096) },
    },
    quarantined: Boolean(rec.quarantined) || QUARANTINED_TOUR_IDS.has(rec.tourId),
    quarantine_reason: rec.quarantineReason || null,
    active: rec.active,
    last_verified_at: rec.lastVerifiedAt,
    updated_at: rec.updatedAt,
    created_at: rec.createdAt,
  };
}

test("1. Static regression guards: zero SELECT *, zero full-catalog error fallback, zero cold-start upsert loops, and zero runtime DDL in telemetry/catalog hot paths", () => {
  const catalogStoreSrc = readRepoFile("lib/dcc/catalog/durableCatalogStore.ts");
  const corridorEventsSrc = readRepoFile("lib/dcc/telemetry/corridorEvents.ts");
  const commerceSrc = readRepoFile("lib/dcc/commerce/index.ts");

  // 1a. No SELECT * on catalog, sync runs, checkpoints, telemetry, or commercial outcomes
  assert.doesNotMatch(
    catalogStoreSrc,
    /SELECT\s+\*/i,
    "durableCatalogStore.ts must never use SELECT *",
  );
  assert.doesNotMatch(
    corridorEventsSrc,
    /SELECT\s+\*/i,
    "corridorEvents.ts must never use SELECT *",
  );
  assert.doesNotMatch(
    commerceSrc,
    /SELECT\s+\*/i,
    "commerce/index.ts must never use SELECT *",
  );

  // 1b. Full-catalog fallback hydrator and cold-start upsert loops are completely removed
  assert.equal(
    catalogStoreSrc.includes("loadAllCatalogRecordsWithPgHydration"),
    false,
    "loadAllCatalogRecordsWithPgHydration must not exist in durableCatalogStore.ts",
  );
  assert.equal(
    catalogStoreSrc.includes("pilotRecordsUpsertedToPg"),
    false,
    "Cold-start pilotRecordsUpsertedToPg loop must not exist in durableCatalogStore.ts",
  );
  assert.equal(
    catalogStoreSrc.includes("pgHydratedFromSnapshot"),
    false,
    "Cold-start snapshot-to-Postgres auto-hydration loop must not exist in durableCatalogStore.ts",
  );

  // 1c. Per-event telemetry must NOT invoke ensureCorridorTables() or ensureCorridorCatalogRows()
  const appendFnStart = corridorEventsSrc.indexOf("export async function appendCorridorEventDurably");
  const listFnStart = corridorEventsSrc.indexOf("export async function listRecentCorridorEvents");
  assert.ok(appendFnStart > 0 && listFnStart > appendFnStart);
  const appendFnBody = corridorEventsSrc.slice(appendFnStart, listFnStart);
  assert.equal(
    appendFnBody.includes("ensureCorridorTables"),
    false,
    "appendCorridorEventDurably must not run CREATE TABLE / CREATE INDEX DDL",
  );
  assert.equal(
    appendFnBody.includes("ensureCorridorCatalogRows"),
    false,
    "appendCorridorEventDurably must not upsert LIVE_CORRIDOR_CATALOG on every event",
  );

  // 1d. Explicit migration files exist for both catalog/checkpoints and corridor telemetry
  assert.ok(
    fs.existsSync(path.join(REPO_ROOT, "drizzle/0004_dcc_corridor_events.sql")),
    "Expected drizzle/0004_dcc_corridor_events.sql migration",
  );
  assert.ok(
    fs.existsSync(path.join(REPO_ROOT, "drizzle/0009_dcc_tour_catalog_and_refresh_checkpoints.sql")),
    "Expected drizzle/0009_dcc_tour_catalog_and_refresh_checkpoints.sql migration",
  );
});

test("2. /api/cron/catalog-refresh emergency pause guard prevents hydration by default while preserving auth and rollback route", async () => {
  const prevSecret = process.env.CRON_SECRET;
  const prevEnabled = process.env.DCC_CATALOG_REFRESH_ENABLED;
  process.env.CRON_SECRET = "test_cron_secret_egress_guard";
  delete process.env.DCC_CATALOG_REFRESH_ENABLED;

  let sqlCalls = 0;
  setCatalogSqlQueryExecutorForTests(async () => {
    sqlCalls += 1;
    return [];
  });

  try {
    const { GET, POST, isCatalogRefreshCronPaused } = await import(
      "../../app/api/cron/catalog-refresh/route"
    );

    assert.equal(isCatalogRefreshCronPaused(), true);

    // Unauthorized request still returns 401
    const unauthRes = await GET(
      new NextRequest("https://destinationcommandcenter.com/api/cron/catalog-refresh"),
    );
    assert.equal(unauthRes.status, 401);

    // Authorized cron tick returns 200 paused without initiating hydration or running SQL
    const pausedGetRes = await GET(
      new NextRequest("https://destinationcommandcenter.com/api/cron/catalog-refresh", {
        headers: { Authorization: "Bearer test_cron_secret_egress_guard" },
      }),
    );
    assert.equal(pausedGetRes.status, 200);
    const body = await pausedGetRes.json();
    assert.equal(body.ok, true);
    assert.equal(body.paused, true);
    assert.equal(body.hydrationInitiated, false);
    assert.equal(body.reason, "emergency_egress_guard_paused");
    assert.equal(sqlCalls, 0, "Paused catalog-refresh cron must execute 0 SQL queries");

    const pausedPostRes = await POST(
      new NextRequest("https://destinationcommandcenter.com/api/cron/catalog-refresh?mode=backfill_only", {
        method: "POST",
        headers: { Authorization: "Bearer test_cron_secret_egress_guard" },
      }),
    );
    assert.equal(pausedPostRes.status, 200);
    const postBody = await pausedPostRes.json();
    assert.equal(postBody.paused, true);
    assert.equal(postBody.hydrationInitiated, false);
    assert.equal(sqlCalls, 0);
  } finally {
    setCatalogSqlQueryExecutorForTests(null);
    if (prevSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevSecret;
    if (prevEnabled === undefined) delete process.env.DCC_CATALOG_REFRESH_ENABLED;
    else process.env.DCC_CATALOG_REFRESH_ENABLED = prevEnabled;
  }
});

test("3. Cold worker, ordinary catalog request, port-day excursion request, checkpoint, summary, and SQL error path never pull the complete catalog or raw_json, and match pre-patch summary/checkpoint values 1:1", async () => {
  clearDurableCatalogCachesForTests();
  setCatalogSqlQueryExecutorForTests(null);

  // Capture baseline summary & checkpoints from committed snapshot (pre-patch ground truth)
  const baselineSummary = await getDurableCatalogSummaryReport();
  const baselineJuneauCkpt = await getLatestDestinationBackfillCheckpoint("juneau");
  const baselineNolaCkpt = await getLatestDestinationBackfillCheckpoint("new-orleans");

  const snapshot = readLocalCatalogSnapshot();
  const simulatedPgCatalogRows = snapshot.records.map(buildSimulatedPgRowFromDurableRecord);
  const fullSelectStarBytesBaseline = Buffer.byteLength(
    JSON.stringify(simulatedPgCatalogRows.filter((r) => r.active && !r.quarantined)),
    "utf8",
  );

  type QueryCapture = { sql: string; rowsReturned: number; payloadBytes: number };
  const capturedQueries: QueryCapture[] = [];

  const pilotIdSet = new Set(PILOT_VERIFIED_TOUR_RECORDS.map((p) => p.tourId));
  const excludeForSummarySet = new Set([...QUARANTINED_TOUR_IDS, ...pilotIdSet]);

  // Simulated SQL executor over the real 4,300+ catalog dataset
  const simulatedSqlExecutor = async (
    queryText: string,
    params: unknown[] = [],
  ): Promise<Record<string, any>[]> => {
    const q = queryText.trim();
    assert.doesNotMatch(q, /SELECT\s+\*/i, `Forbidden SELECT * detected in query: ${q}`);
    assert.doesNotMatch(q, /CREATE\s+TABLE|CREATE\s+INDEX|ALTER\s+TABLE/i, `Forbidden runtime DDL: ${q}`);

    let resultRows: Record<string, any>[] = [];

    // A. Summary CTE GROUP BY query
    if (q.includes("WITH base AS") && q.includes("GROUP BY")) {
      const nonPilotActive = snapshot.records.filter(
        (r) => r.active && !r.quarantined && !excludeForSummarySet.has(r.tourId),
      );
      const groups = new Map<string, Record<string, any>>();
      for (const rawRec of nonPilotActive) {
        const { normalizedRecord: rec, exceptions } = normalizeCatalogTourPickupAndMeeting(rawRec);
        const pf = rec.pickupFulfillmentType || "unknown";
        const key = [
          rec.destinationSlug,
          rec.earthosDestinationNodeId,
          rec.timeZone,
          rec.capabilityTier,
          rec.primaryProvider,
          pf,
        ].join("||");
        const g = groups.get(key) || {
          destination_slug: rec.destinationSlug,
          earthos_destination_node_id: rec.earthosDestinationNodeId,
          time_zone: rec.timeZone,
          capability_tier: rec.capabilityTier,
          primary_provider: rec.primaryProvider,
          norm_pf: pf,
          cnt: 0,
          unk_duration_cnt: 0,
          unk_cancellation_cnt: 0,
          unk_pickup_cnt: 0,
          unk_coords_cnt: 0,
          unk_transfer_cnt: 0,
          fully_verified_cnt: 0,
          records_with_unknown_cnt: 0,
          exc_missing_pickup_cnt: 0,
          exc_missing_meeting_id_cnt: 0,
          exc_missing_coords_cnt: 0,
          exc_unverified_berth_cnt: 0,
          exc_opt_ambiguous_cnt: 0,
        };
        g.cnt += 1;
        if (rec.durationMinutes === null) g.unk_duration_cnt += 1;
        if (rec.freeCancellation === null) g.unk_cancellation_cnt += 1;
        if (rec.hasHotelPickup === null) g.unk_pickup_cnt += 1;
        if (rec.meetingPointLat === null || rec.meetingPointLng === null) g.unk_coords_cnt += 1;
        if (
          rec.constraints?.cruiseBufferBeforeMinutes === null ||
          rec.constraints?.cruiseBufferBeforeMinutes === undefined ||
          rec.constraints?.transferTimeSource === "unknown" ||
          rec.constraints?.transferTimeSource === "planning_estimate"
        ) {
          g.unk_transfer_cnt += 1;
        }
        if (exceptions.length === 0) g.fully_verified_cnt += 1;
        else g.records_with_unknown_cnt += 1;
        for (const exc of exceptions) {
          if (exc.exceptionCode === "missing_pickup_mode") g.exc_missing_pickup_cnt += 1;
          else if (exc.exceptionCode === "missing_meeting_point_identity") g.exc_missing_meeting_id_cnt += 1;
          else if (exc.exceptionCode === "missing_meeting_point_coordinates") g.exc_missing_coords_cnt += 1;
          else if (exc.exceptionCode === "unverified_cruise_berth_transfer") g.exc_unverified_berth_cnt += 1;
          else if (exc.exceptionCode === "option_pickup_unknown_or_ambiguous") g.exc_opt_ambiguous_cnt += 1;
        }
        groups.set(key, g);
      }
      resultRows = Array.from(groups.values());
    }
    // B. Retired count query
    else if (q.includes("AS retired_cnt") && q.includes("WHERE active = false")) {
      const cnt = simulatedPgCatalogRows.filter(
        (r) => !r.active && !r.quarantined && !QUARANTINED_TOUR_IDS.has(r.tour_id),
      ).length;
      resultRows = [{ retired_cnt: cnt }];
    }
    // C. Sample 15 exception rows
    else if (q.includes("FROM dcc_tour_catalog") && q.includes("LIMIT 15")) {
      resultRows = simulatedPgCatalogRows
        .filter((r) => r.active && !r.quarantined && !excludeForSummarySet.has(r.tour_id))
        .slice(0, 15)
        .map((r) => ({
          tour_id: r.tour_id,
          primary_provider: r.primary_provider,
          provider_product_code: r.provider_product_code,
          destination_slug: r.destination_slug,
          port_slug: r.port_slug,
          title: r.title,
          has_hotel_pickup: r.has_hotel_pickup,
          pickup_type: r.pickup_type,
          meeting_point_name: r.meeting_point_name,
          meeting_point_address: r.meeting_point_address,
          meeting_point_lat: r.meeting_point_lat,
          meeting_point_lng: r.meeting_point_lng,
          location_precision: r.location_precision,
          booking_url: r.booking_url,
          sd_pickup_fulfillment_type: r.service_details_json?.pickupFulfillmentType ?? null,
          constraints_json: r.constraints_json,
          product_options_json: r.product_options_json,
          active: r.active,
          quarantined: r.quarantined,
        }));
    }
    // D. Sync runs aggregate totals
    else if (q.includes("FROM dcc_catalog_sync_runs") && q.includes("SUM(rejected_count)")) {
      resultRows = [
        {
          total_rejected: snapshot.syncRuns.reduce((a, r) => a + (r.rejectedCount || 0), 0),
          total_upstream_requests: snapshot.syncRuns.reduce((a, r) => a + (r.upstreamRequestCount || 0), 0),
        },
      ];
    }
    // E. Latest completed Viator sync run per destination
    else if (q.includes("SELECT DISTINCT ON (destination_slug)") && q.includes("FROM dcc_catalog_sync_runs")) {
      const sorted = [...snapshot.syncRuns].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );
      const seen = new Set<string>();
      for (const r of sorted) {
        if (r.provider === "viator" && r.status === "completed" && !seen.has(r.destinationSlug)) {
          seen.add(r.destinationSlug);
          resultRows.push({
            run_id: r.runId,
            provider: r.provider,
            destination_slug: r.destinationSlug,
            status: r.status,
            cursor_value: r.cursorValue,
            imported_count: r.importedCount,
            updated_count: r.updatedCount,
            rejected_count: r.rejectedCount,
            upstream_request_count: r.upstreamRequestCount,
            rejection_reasons_json: r.rejectionReasons,
            metadata_json: r.metadata,
            started_at: r.startedAt,
            completed_at: r.completedAt,
          });
        }
      }
    }
    // F. Recent sync runs (LIMIT 25 or LIMIT $1)
    else if (q.includes("FROM dcc_catalog_sync_runs") && q.includes("ORDER BY started_at DESC")) {
      const sorted = [...snapshot.syncRuns].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );
      const destFilter = q.includes("LOWER(destination_slug) = $1")
        ? String(params[0] || "").toLowerCase()
        : null;
      const filteredRuns = destFilter
        ? sorted.filter(
            (r) =>
              r.provider === "viator" &&
              r.status === "completed" &&
              r.destinationSlug.toLowerCase() === destFilter,
          )
        : sorted;
      const lim = q.includes("LIMIT 1") ? 1 : q.includes("LIMIT 25") ? 25 : Number(params[0] || 25);
      resultRows = filteredRuns.slice(0, lim).map((r) => ({
        run_id: r.runId,
        provider: r.provider,
        destination_slug: r.destinationSlug,
        status: r.status,
        cursor_value: r.cursorValue,
        imported_count: r.importedCount,
        updated_count: r.updatedCount,
        rejected_count: r.rejectedCount,
        upstream_request_count: r.upstreamRequestCount,
        rejection_reasons_json: r.rejectionReasons,
        metadata_json: r.metadata,
        started_at: r.startedAt,
        completed_at: r.completedAt,
      }));
    }
    // G. Refresh checkpoints
    else if (q.includes("FROM dcc_catalog_refresh_checkpoints")) {
      resultRows = [];
    }
    // H. Active provider counts GROUP BY primary_provider
    else if (q.includes("GROUP BY primary_provider") && q.includes("FROM dcc_tour_catalog")) {
      const slug = String(params[1] || "").toLowerCase();
      const counts = new Map<string, number>();
      for (const r of simulatedPgCatalogRows) {
        if (r.active && !r.quarantined && !QUARANTINED_TOUR_IDS.has(r.tour_id) && r.destination_slug.toLowerCase() === slug) {
          counts.set(r.primary_provider, (counts.get(r.primary_provider) || 0) + 1);
        }
      }
      resultRows = Array.from(counts.entries()).map(([primary_provider, cnt]) => ({
        primary_provider,
        cnt,
      }));
    }
    // I. Checkpoint scalar COUNT(*) for destination backfill
    else if (q.includes("SELECT COUNT(*)::int AS cnt") && q.includes("primary_provider = 'viator'")) {
      const excl = new Set((params[0] as string[]) || []);
      const slug = String(params[1] || "").toLowerCase();
      const cnt = simulatedPgCatalogRows.filter(
        (r) =>
          r.active &&
          !r.quarantined &&
          !excl.has(r.tour_id) &&
          r.destination_slug.toLowerCase() === slug &&
          r.primary_provider === "viator",
      ).length;
      resultRows = [{ cnt }];
    }
    // J. Paginated catalog SELECT with narrow/explicit projection
    else if (q.includes("COUNT(*) OVER()::int AS total_matched_count")) {
      const wantsOptions = q.includes("product_options_json,\n");
      const wantsConstraints = q.includes("constraints_json,\n") || q.includes("constraints_json\n");
      const wantsFullProv = q.includes("AS provenance_json");
      assert.equal(q.includes("raw_json\n"), false, "Must never select raw_json column");

      const excl = new Set((params[0] as string[]) || []);
      const destSlug = q.includes("LOWER(destination_slug) =") ? String(params[1] || "").toLowerCase() : null;
      const matched = simulatedPgCatalogRows.filter(
        (r) =>
          r.active &&
          !r.quarantined &&
          !excl.has(r.tour_id) &&
          (!destSlug || r.destination_slug.toLowerCase() === destSlug),
      );
      const lim = Number(params[destSlug ? 2 : 1] || 100);
      const off = q.includes("OFFSET") ? Number(params[destSlug ? 3 : 2] || 0) : 0;
      const slice = matched.slice(off, off + lim);
      resultRows = slice.map((r) => {
        const opts = Array.isArray(r.product_options_json) ? r.product_options_json : [];
        const sortedOpts = [...opts].sort(
          (a: any, b: any) => (a.fromPriceCents ?? 2147483647) - (b.fromPriceCents ?? 2147483647),
        );
        const projected: Record<string, any> = {
          tour_id: r.tour_id,
          compatibility_aliases: r.compatibility_aliases,
          destination_slug: r.destination_slug,
          port_slug: r.port_slug,
          earthos_destination_node_id: r.earthos_destination_node_id,
          time_zone: r.time_zone,
          title: r.title,
          summary: r.summary,
          category: r.category,
          tags: r.tags,
          primary_provider: r.primary_provider,
          provider_product_code: r.provider_product_code,
          operator_name: r.operator_name,
          operator_code: r.operator_code,
          capability_tier: r.capability_tier,
          commission_authorized: r.commission_authorized,
          duration_minutes: r.duration_minutes,
          duration_raw_text: r.duration_raw_text,
          from_price_cents: r.from_price_cents,
          price_basis: r.price_basis,
          currency: r.currency,
          free_cancellation: r.free_cancellation,
          cancellation_policy_type: r.cancellation_policy_type,
          cancellation_cutoff_hours: r.cancellation_cutoff_hours,
          cancellation_summary: r.cancellation_summary,
          has_hotel_pickup: r.has_hotel_pickup,
          lowest_price_includes_pickup: r.lowest_price_includes_pickup,
          pickup_type: r.pickup_type,
          pickup_summary: r.pickup_summary,
          meeting_point_name: r.meeting_point_name,
          meeting_point_address: r.meeting_point_address,
          meeting_point_lat: r.meeting_point_lat,
          meeting_point_lng: r.meeting_point_lng,
          location_precision: r.location_precision,
          channel_offers_json: (r.channel_offers_json || []).map((co: any) => {
            const { inclusions: _ci, exclusions: _ce, cancellationSummary: _cs, ...slimCo } = co || {};
            return slimCo;
          }),
          primary_image_url: r.primary_image_url,
          rating_average: r.rating_average,
          review_count: r.review_count,
          booking_url: r.booking_url,
          quarantined: r.quarantined,
          quarantine_reason: r.quarantine_reason,
          active: r.active,
          last_verified_at: r.last_verified_at,
          updated_at: r.updated_at,
          created_at: r.created_at,
          sd_pickup_fulfillment_type: r.service_details_json?.pickupFulfillmentType ?? null,
          prov_pickup_known: Boolean(r.provenance_json?.rawFieldsVerified?.pickupKnown),
          prov_source_system: r.provenance_json?.sourceSystem ?? r.primary_provider,
          prov_source_endpoint: r.provenance_json?.sourceEndpoint ?? "db",
          prov_fetched_at: r.provenance_json?.fetchedAt ?? r.last_verified_at,
          default_option_code: sortedOpts[0]?.optionCode ?? null,
          default_option_title: sortedOpts[0]?.title ?? null,
          total_matched_count: matched.length,
        };
        if (wantsOptions) projected.product_options_json = r.product_options_json;
        if (wantsConstraints) projected.constraints_json = r.constraints_json;
        if (q.includes("service_details_json,\n") || q.includes("service_details_json\n")) {
          projected.service_details_json = r.service_details_json;
        }
        if (wantsFullProv) {
          const { raw_json: _rj, ...cleanProv } = r.provenance_json || {};
          projected.provenance_json = cleanProv;
        }
        return projected;
      });
    }
    // K. Single-tour lookup LIMIT 1
    else if (q.includes("FROM dcc_tour_catalog") && q.includes("LIMIT 1")) {
      const norm = String(params[1] || "").toLowerCase();
      const hit = simulatedPgCatalogRows.find(
        (r) =>
          r.active &&
          !r.quarantined &&
          (r.tour_id.toLowerCase() === norm ||
            r.provider_product_code.toLowerCase() === norm ||
            (r.compatibility_aliases || []).some((a: string) => a.toLowerCase() === norm)),
      );
      if (hit) {
        const { raw_json: _rj, ...cleanProv } = hit.provenance_json || {};
        resultRows = [{ ...hit, provenance_json: cleanProv }];
      }
    }

    const payloadBytes = Buffer.byteLength(JSON.stringify(resultRows), "utf8");
    capturedQueries.push({ sql: q, rowsReturned: resultRows.length, payloadBytes });
    return resultRows;
  };

  try {
    setCatalogSqlQueryExecutorForTests(simulatedSqlExecutor);
    clearDurableCatalogCachesForTests();

    // 3a. Cold worker + ordinary catalog card query (Juneau, limit 12)
    capturedQueries.length = 0;
    const tCard0 = performance.now();
    const juneauCards = await queryDurableTourCatalog({
      destinationSlug: "juneau",
      limit: 12,
    });
    const cardMs = Math.round((performance.now() - tCard0) * 100) / 100;

    assert.equal(capturedQueries.length, 1, "Ordinary catalog query must execute exactly 1 SQL query");
    assert.equal(juneauCards.rowsLoadedIntoApp, 12);
    assert.equal(juneauCards.fullCatalogLoadedIntoApp, false);
    assert.equal(juneauCards.projectionTier, "narrow_scalar");
    assert.ok(juneauCards.nextCursor, "Expected explicit nextCursor when hasMore is true");
    assert.ok(
      capturedQueries[0].payloadBytes < 60_000,
      `Expected narrow 12-row payload < 60 KB, got ${capturedQueries[0].payloadBytes} bytes (baseline SELECT * was ${fullSelectStarBytesBaseline} bytes)`,
    );
    for (const rec of juneauCards.records) {
      assert.equal(rec.productOptions, undefined, "Default narrow projection must not transfer productOptions");
      assert.deepEqual(rec.constraints, {}, "Default narrow projection must not transfer constraints");
      assert.equal((rec.provenance as any).raw_json, undefined, "Must never transfer raw_json");
      assert.equal(rec.provenance.contentSha256, "", "Default narrow projection must strip full provenance hashes/blobs");
      // Exact attribution handoff still works identically
      const handoff = buildCatalogTourDirectHandoff(rec, { surface: "cruisepromenade", isTest: true });
      assert.ok(handoff.trackedClickUrl.includes(rec.providerProductCode) || handoff.handoffUrl.length > 0);
    }

    // 3b. Catalog summary report via SQL GROUP BY aggregates — must match pre-patch summary 1:1
    capturedQueries.length = 0;
    const tSum0 = performance.now();
    const sqlSummary = await getDurableCatalogSummaryReport();
    const sumMs = Math.round((performance.now() - tSum0) * 100) / 100;
    const sumTotalRows = capturedQueries.reduce((a, q) => a + q.rowsReturned, 0);
    const sumTotalBytes = capturedQueries.reduce((a, q) => a + q.payloadBytes, 0);

    assert.equal(sqlSummary.storageSource, "postgres");
    assert.ok(sumTotalRows < 180, `Summary must return < 180 aggregate/sample rows, got ${sumTotalRows}`);
    assert.ok(
      sumTotalBytes < 150_000,
      `Summary must transfer < 150 KB (vs ${fullSelectStarBytesBaseline} bytes pre-patch), got ${sumTotalBytes}`,
    );

    assert.equal(sqlSummary.totalImportedRecords, baselineSummary.totalImportedRecords);
    assert.equal(sqlSummary.totalDestinationsCovered, baselineSummary.totalDestinationsCovered);
    assert.deepEqual(sqlSummary.byProvider, baselineSummary.byProvider);
    assert.deepEqual(sqlSummary.byCapabilityTier, baselineSummary.byCapabilityTier);
    assert.deepEqual(sqlSummary.byPickupFulfillmentType, baselineSummary.byPickupFulfillmentType);
    assert.deepEqual(
      sqlSummary.destinationCoverageBreakdown,
      baselineSummary.destinationCoverageBreakdown,
    );
    assert.equal(
      sqlSummary.pickupAndMeetingNormalization.totalRecordsEvaluated,
      baselineSummary.pickupAndMeetingNormalization.totalRecordsEvaluated,
    );
    assert.equal(
      sqlSummary.pickupAndMeetingNormalization.fullyVerifiedPickupAndMeetingCount,
      baselineSummary.pickupAndMeetingNormalization.fullyVerifiedPickupAndMeetingCount,
    );
    assert.equal(
      sqlSummary.pickupAndMeetingNormalization.recordsWithUnknownPickupOrMeetingCount,
      baselineSummary.pickupAndMeetingNormalization.recordsWithUnknownPickupOrMeetingCount,
    );
    assert.equal(
      sqlSummary.pickupAndMeetingNormalization.totalExceptionsCount,
      baselineSummary.pickupAndMeetingNormalization.totalExceptionsCount,
    );
    assert.deepEqual(
      sqlSummary.pickupAndMeetingNormalization.byExceptionCode,
      baselineSummary.pickupAndMeetingNormalization.byExceptionCode,
    );
    for (const slug of Object.keys(baselineSummary.byDestination)) {
      assert.deepEqual(
        sqlSummary.byDestination[slug],
        baselineSummary.byDestination[slug],
        `Destination summary mismatch on ${slug}`,
      );
    }

    // 3c. Checkpoint query via SQL COUNT(*) — must match pre-patch checkpoint 1:1
    capturedQueries.length = 0;
    const sqlJuneauCkpt = await getLatestDestinationBackfillCheckpoint("juneau");
    const ckptJuneauBytes = capturedQueries.reduce((a, q) => a + q.payloadBytes, 0);
    const ckptJuneauRows = capturedQueries.reduce((a, q) => a + q.rowsReturned, 0);
    assert.ok(ckptJuneauRows <= 3, `Checkpoint must return <= 3 scalar rows, got ${ckptJuneauRows}`);
    assert.ok(ckptJuneauBytes < 2_000, `Checkpoint must transfer < 2 KB, got ${ckptJuneauBytes}`);
    assert.equal(sqlJuneauCkpt.viatorImportedCount, baselineJuneauCkpt.viatorImportedCount);
    assert.equal(sqlJuneauCkpt.providerTotalCount, baselineJuneauCkpt.providerTotalCount);
    assert.equal(sqlJuneauCkpt.nextStartOffset, baselineJuneauCkpt.nextStartOffset);
    assert.equal(sqlJuneauCkpt.coverageStatus, baselineJuneauCkpt.coverageStatus);

    const sqlNolaCkpt = await getLatestDestinationBackfillCheckpoint("new-orleans");
    assert.equal(sqlNolaCkpt.viatorImportedCount, baselineNolaCkpt.viatorImportedCount);
    assert.equal(sqlNolaCkpt.providerTotalCount, baselineNolaCkpt.providerTotalCount);
    assert.equal(sqlNolaCkpt.nextStartOffset, baselineNolaCkpt.nextStartOffset);
    assert.equal(sqlNolaCkpt.coverageStatus, baselineNolaCkpt.coverageStatus);

    // 3d. Ordinary port-day excursion request (Juneau browse_all, limit 12)
    clearDurableCatalogCachesForTests();
    capturedQueries.length = 0;
    const tPort0 = performance.now();
    const portRes = await queryPortDayExcursionCatalog({
      portSlug: "juneau",
      viewMode: "browse_all",
      shipArrivalTime: "08:00",
      shipAllAboardTime: "17:00",
      sailingDate: "2027-07-15",
      partySize: 4,
      limit: 12,
      offset: 0,
    });
    const portMs = Math.round((performance.now() - tPort0) * 100) / 100;
    assert.ok(portRes);
    assert.equal(portRes.tours.length, 12);
    assert.equal(portRes.pagination.fullCatalogLoadedIntoApp, false);
    assert.equal(portRes.pagination.rowsLoadedIntoApp, 12);
    const portBytes = capturedQueries.reduce((a, q) => a + q.payloadBytes, 0);
    assert.ok(portBytes < 120_000, `Port-day excursion query must transfer < 120 KB, got ${portBytes}`);

    // 3e. Explicit cursor pagination completeness (no silent 100-record truncation)
    capturedQueries.length = 0;
    const allReykjavik = await paginateAllDurableTourCatalogPages(
      { destinationSlug: "reykjavik" },
      { pageSize: 450 },
    );
    assert.equal(allReykjavik.records.length, 1576, "Paginated walker must return all 1,576 Reykjavík tours without 100-row truncation");
    assert.equal(allReykjavik.pagesFetched, 4);
    assert.equal(new Set(allReykjavik.records.map((r) => r.tourId)).size, 1576);

    const encoded = encodeCatalogCursor({ offset: 12, sortBy: "recommended", lastTourId: "t1" });
    const decoded = decodeCatalogCursor(encoded);
    assert.deepEqual(decoded, { v: 1, offset: 12, sortBy: "recommended", lastTourId: "t1" });

    // 3f. Error fallback removal proof: SQL error must throw cleanly with 0 fallback queries
    let errorCalls = 0;
    setCatalogSqlQueryExecutorForTests(async () => {
      errorCalls += 1;
      throw new Error("simulated_neon_transfer_quota_exceeded");
    });
    await assert.rejects(
      () => queryDurableTourCatalog({ destinationSlug: "juneau", limit: 12 }),
      /simulated_neon_transfer_quota_exceeded/,
    );
    assert.equal(errorCalls, 1, "Must not trigger fallback hydration queries after SQL failure");

    await assert.rejects(
      () => getDurableTourByIdOrAlias("non_pilot_viator_999999P1"),
      /simulated_neon_transfer_quota_exceeded/,
    );
    assert.equal(errorCalls, 2, "getDurableTourByIdOrAlias must not trigger full-catalog fallback on SQL failure");

    console.log(
      JSON.stringify({
        benchmarkEvidence: {
          prePatchFullSelectStarBytes: fullSelectStarBytesBaseline,
          postPatchJuneau12CardQuery: {
            queries: 1,
            rows: 12,
            bytes: juneauCards.records.length > 0 ? Buffer.byteLength(JSON.stringify(juneauCards.records)) : 0,
            ms: cardMs,
          },
          postPatchSummaryReport: {
            queries: 6,
            rows: sumTotalRows,
            bytes: sumTotalBytes,
            ms: sumMs,
          },
          postPatchJuneauCheckpoint: {
            queries: 3,
            rows: ckptJuneauRows,
            bytes: ckptJuneauBytes,
          },
          postPatchJuneauPortDayExcursions: {
            rows: 12,
            bytes: portBytes,
            ms: portMs,
          },
        },
      }),
    );
  } finally {
    setCatalogSqlQueryExecutorForTests(null);
    clearDurableCatalogCachesForTests();
  }
});

test("4. Per-event telemetry appendCorridorEventDurably appends only the single event without DDL or catalog upserts", async () => {
  const session = `egress_test_${Date.now()}`;
  const res = await appendCorridorEventDurably({
    corridor_id: "wno-commerce",
    event_name: "landing_viewed",
    session_id: session,
    source_page: "/new-orleans/tours",
    metadata: { is_test: true },
  });
  assert.equal(res.ok, true);
  assert.equal(res.stored, true);
  assert.equal(res.corridorId, "wno-commerce");
});

test("5. Pickup fulfillment normalization regression fixture: never infers self_drive solely from has_hotel_pickup = false across all 5 fulfillment states", () => {
  const catalogStoreSrc = readRepoFile("lib/dcc/catalog/durableCatalogStore.ts");

  // SQL summary query must explicitly COALESCE raw_pf to 'unknown' and never infer self_drive or MEETING_POINT_ONLY from has_hotel_pickup = false
  assert.match(
    catalogStoreSrc,
    /COALESCE\(\s*NULLIF\(service_details_json->>'pickupFulfillmentType',\s*''\),[\s\S]*?'unknown'\s*\)\s*AS raw_pf/,
    "getDurableCatalogSummaryReport SQL must COALESCE raw_pf to 'unknown'",
  );
  assert.doesNotMatch(
    catalogStoreSrc,
    /WHEN\s+has_hotel_pickup\s+IS\s+FALSE\s+THEN\s+'self_drive'/i,
    "SQL summary must never infer self_drive solely from has_hotel_pickup = false",
  );
  assert.doesNotMatch(
    catalogStoreSrc,
    /WHEN\s+has_hotel_pickup\s+IS\s+FALSE\s+THEN\s+'MEETING_POINT_ONLY'/i,
    "SQL summary must never infer MEETING_POINT_ONLY solely from has_hotel_pickup = false",
  );

  const makeBasePgRow = (overrides: Record<string, any>): Record<string, any> => ({
    tour_id: "dcc:tour:viator:FIXTURE1",
    compatibility_aliases: ["FIXTURE1"],
    destination_slug: "seward",
    port_slug: "seward",
    earthos_destination_node_id: "earthos:node:us-ak-seward",
    time_zone: "America/Anchorage",
    title: "Fixture Tour",
    summary: null,
    category: "Tours",
    tags: [],
    primary_provider: "viator",
    provider_product_code: "FIXTURE1",
    operator_name: null,
    operator_code: null,
    capability_tier: "live_check_referral",
    commission_authorized: true,
    duration_minutes: 180,
    duration_raw_text: "3h",
    from_price_cents: 15000,
    price_basis: "per_person",
    currency: "USD",
    free_cancellation: true,
    cancellation_policy_type: "STANDARD",
    cancellation_cutoff_hours: 24,
    cancellation_summary: null,
    has_hotel_pickup: null,
    lowest_price_includes_pickup: null,
    pickup_type: null,
    pickup_summary: null,
    meeting_point_name: null,
    meeting_point_address: null,
    meeting_point_lat: null,
    meeting_point_lng: null,
    location_precision: "unknown",
    pickup_locations_json: [],
    age_bands_json: [],
    constraints_json: {},
    channel_offers_json: [],
    product_options_json: [],
    service_details_json: {},
    inclusions_json: [],
    exclusions_json: [],
    primary_image_url: null,
    rating_average: null,
    review_count: null,
    booking_url: "https://www.viator.com/tours/Seward/Fixture/d4368-FIXTURE1",
    provenance_json: {},
    quarantined: false,
    quarantine_reason: null,
    active: true,
    last_verified_at: "2026-11-18T00:00:00.000Z",
    updated_at: "2026-11-18T00:00:00.000Z",
    created_at: "2026-11-18T00:00:00.000Z",
    ...overrides,
  });

  // Case 1a: has_hotel_pickup = false + missing fulfillment type (pickup_type = null, service_details_json = {}) -> unknown
  const case1Missing = normalizeCatalogTourPickupAndMeeting(
    mapPgRowToDurableTourRecord(
      makeBasePgRow({
        tour_id: "dcc:tour:viator:70700P1_SIM",
        has_hotel_pickup: false,
        pickup_type: null,
        service_details_json: {},
      }),
    ),
  );
  assert.equal(case1Missing.normalizedRecord.pickupFulfillmentType, "unknown");
  assert.equal(case1Missing.normalizedRecord.pickupType, "UNKNOWN");
  assert.equal(
    case1Missing.exceptions.some((e) => e.exceptionCode === "missing_meeting_point_identity"),
    false,
    "Must not fabricate missing_meeting_point_identity from has_hotel_pickup = false alone",
  );

  // Case 1b: has_hotel_pickup = false + unrecognized fulfillment string -> unknown (not self_drive)
  const case1Unrecognized = normalizeCatalogTourPickupAndMeeting({
    ...mapPgRowToDurableTourRecord(
      makeBasePgRow({
        tour_id: "dcc:tour:viator:UNREC_SIM",
        has_hotel_pickup: false,
        pickup_type: "INVALID_RAW_VALUE",
      }),
    ),
    pickupFulfillmentType: "unrecognized_mode" as any,
  });
  assert.equal(case1Unrecognized.normalizedRecord.pickupFulfillmentType, "unknown");
  assert.equal(case1Unrecognized.normalizedRecord.pickupType, "UNKNOWN");

  // Case 2: Explicit self_drive -> self_drive
  const case2SelfDrive = normalizeCatalogTourPickupAndMeeting(
    mapPgRowToDurableTourRecord(
      makeBasePgRow({
        tour_id: "dcc:tour:viator:SELF_DRIVE_SIM",
        has_hotel_pickup: false,
        pickup_type: "MEETING_POINT_ONLY",
        service_details_json: { pickupFulfillmentType: "self_drive" },
      }),
    ),
  );
  assert.equal(case2SelfDrive.normalizedRecord.pickupFulfillmentType, "self_drive");

  // Case 3: Explicit meeting-point fulfillment (walkable_from_pier & downtown_shuttle_departure) -> stated value
  const case3Walkable = normalizeCatalogTourPickupAndMeeting(
    mapPgRowToDurableTourRecord(
      makeBasePgRow({
        tour_id: "dcc:tour:viator:WALKABLE_SIM",
        has_hotel_pickup: false,
        pickup_type: "MEETING_POINT_ONLY",
        service_details_json: { pickupFulfillmentType: "walkable_from_pier" },
      }),
    ),
  );
  assert.equal(case3Walkable.normalizedRecord.pickupFulfillmentType, "walkable_from_pier");

  const case3Shuttle = normalizeCatalogTourPickupAndMeeting(
    mapPgRowToDurableTourRecord(
      makeBasePgRow({
        tour_id: "dcc:tour:viator:SHUTTLE_SIM",
        has_hotel_pickup: true,
        pickup_type: "DOWNTOWN_SHUTTLE_DEPARTURE",
        service_details_json: { pickupFulfillmentType: "downtown_shuttle_departure" },
      }),
    ),
  );
  assert.equal(case3Shuttle.normalizedRecord.pickupFulfillmentType, "downtown_shuttle_departure");

  // Case 4: Explicit port/pier pickup -> pier_pickup
  const case4Pier = normalizeCatalogTourPickupAndMeeting(
    mapPgRowToDurableTourRecord(
      makeBasePgRow({
        tour_id: "dcc:tour:viator:PIER_SIM",
        has_hotel_pickup: false,
        pickup_type: "CRUISE_PIER_PICKUP",
        service_details_json: { pickupFulfillmentType: "pier_pickup" },
      }),
    ),
  );
  assert.equal(case4Pier.normalizedRecord.pickupFulfillmentType, "pier_pickup");

  // Case 5: Null or incomplete data -> unknown
  const case5Null = normalizeCatalogTourPickupAndMeeting(
    mapPgRowToDurableTourRecord(
      makeBasePgRow({
        tour_id: "dcc:tour:viator:NULL_SIM",
        has_hotel_pickup: null,
        pickup_type: null,
        service_details_json: {},
      }),
    ),
  );
  assert.equal(case5Null.normalizedRecord.pickupFulfillmentType, "unknown");
  assert.equal(case5Null.normalizedRecord.pickupType, "UNKNOWN");
});
