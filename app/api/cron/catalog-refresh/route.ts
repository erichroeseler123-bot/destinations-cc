import { NextRequest, NextResponse } from "next/server";
import { verifyEarthOSAuthorization } from "@/lib/dcc/earthos/auth";
import {
  GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID,
  acquireCatalogRefreshExecutionLease,
  getDurableCatalogSummaryReport,
  releaseCatalogRefreshExecutionLease,
} from "@/lib/dcc/catalog/durableCatalogStore";
import {
  runDestinationBoundedBulkScheduleRefresh,
  runIncrementalScheduleAndPricingRefresh,
  runIncrementalViatorCatalogRefresh,
  runResumableDestinationBackfillBatch,
} from "@/lib/dcc/catalog/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const SCHEDULED_CATALOG_REFRESH_PATH = "/api/cron/catalog-refresh";
export const SCHEDULED_CATALOG_REFRESH_CRON = "*/15 * * * *";

export const SCHEDULED_CATALOG_REFRESH_DEFAULT_COUNT = 500;
export const SCHEDULED_CATALOG_REFRESH_DEFAULT_PRODUCT_MAX_PAGES = 6;
export const SCHEDULED_CATALOG_REFRESH_DEFAULT_PRODUCT_MAX_REQUESTS = 10;
export const SCHEDULED_CATALOG_REFRESH_DEFAULT_PRODUCT_TIME_BUDGET_MS = 30_000;
export const SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_MAX_PAGES = 12;
export const SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_MAX_REQUESTS = 16;
export const SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_TIME_BUDGET_MS = 65_000;
export const SCHEDULED_CATALOG_REFRESH_LEASE_DURATION_MS = 135_000;

function isControlledNonProdCronVerification(request?: NextRequest): boolean {
  if (process.env.VERCEL_ENV === "production") {
    return false;
  }
  return request?.headers.get("x-dcc-controlled-global-verification")?.trim() === "1";
}

/**
 * Emergency egress circuit-breaker: keeps `/api/cron/catalog-refresh` paused by default
 * until `DCC_CATALOG_REFRESH_ENABLED=1` is explicitly set, preventing scheduled cron ticks
 * from initiating catalog refresh while allowing controlled non-Production Preview gates.
 */
export function isCatalogRefreshCronPaused(request?: NextRequest): boolean {
  if (
    request?.headers.get("x-dcc-resume-catalog-refresh")?.trim() === "1" &&
    process.env.DCC_ALLOW_HEADER_CATALOG_REFRESH_RESUME === "1"
  ) {
    return false;
  }
  if (isControlledNonProdCronVerification(request)) {
    return false;
  }
  return process.env.DCC_CATALOG_REFRESH_ENABLED !== "1";
}

function isAuthorizedCatalogCron(request: NextRequest): {
  authorized: boolean;
  method: string;
} {
  const authHeader = request.headers.get("authorization") || "";
  const adminHeader = request.headers.get("x-dcc-admin-secret") || "";
  const internalHeader = request.headers.get("x-internal-secret") || "";
  const token =
    authHeader.replace(/^Bearer\s+/i, "").trim() ||
    adminHeader.trim() ||
    internalHeader.trim();

  const secrets = [
    process.env.CRON_SECRET,
    process.env.DCC_COMMERCE_ADMIN_SECRET,
    process.env.INTERNAL_API_SECRET,
    process.env.EARTHOS_MAINTENANCE_TOKEN,
  ]
    .map((s) => (s || "").trim())
    .filter(Boolean);

  if (token && secrets.includes(token)) {
    return { authorized: true, method: "bearer_or_admin_secret" };
  }
  return { authorized: false, method: "none" };
}

function parsePositiveIntParam(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), min), max);
}

async function handleCatalogRefreshCron(request: NextRequest) {
  const directAuth = isAuthorizedCatalogCron(request);
  if (!directAuth.authorized) {
    const earthAuth = await verifyEarthOSAuthorization(request);
    if (!earthAuth.authorized) {
      return NextResponse.json(
        {
          ok: false,
          error: "unauthorized_catalog_refresh_cron",
          message:
            "Valid Authorization: Bearer <CRON_SECRET | DCC_COMMERCE_ADMIN_SECRET> or X-DCC-Admin-Secret header required.",
        },
        { status: 401 },
      );
    }
  }

  if (isCatalogRefreshCronPaused(request)) {
    return NextResponse.json(
      {
        ok: true,
        paused: true,
        hydrationInitiated: false,
        reason: "emergency_egress_guard_paused",
        resumeControl: "Set DCC_CATALOG_REFRESH_ENABLED=1 to resume scheduled catalog refresh.",
        scheduledRefreshCadence: {
          endpoint: SCHEDULED_CATALOG_REFRESH_PATH,
          cron: SCHEDULED_CATALOG_REFRESH_CRON,
          maxDurationSeconds: maxDuration,
          defaultPageCount: SCHEDULED_CATALOG_REFRESH_DEFAULT_COUNT,
          mode: request.nextUrl.searchParams.get("mode") || "full_pipeline",
          status: "paused",
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const sp = request.nextUrl.searchParams;
    const mode = sp.get("mode") || "full_pipeline";
    const allowControlledGlobalExecution = isControlledNonProdCronVerification(request);
    const count = parsePositiveIntParam(
      sp.get("count"),
      SCHEDULED_CATALOG_REFRESH_DEFAULT_COUNT,
      1,
      500,
    );
    const includeSummary = sp.get("includeSummary") !== "0";
    const explicitDest = sp.get("destination");

    if (mode === "backfill_only") {
      const backfillDestinationsLimit = parsePositiveIntParam(
        sp.get("backfillDestinations"),
        2,
        1,
        17,
      );
      const backfillPages = parsePositiveIntParam(sp.get("backfillPages"), 2, 1, 20);
      const backfillRun = await runResumableDestinationBackfillBatch({
        destinations: explicitDest ? [explicitDest] : undefined,
        maxDestinationsPerRun: backfillDestinationsLimit,
        perDestinationLimit: 50,
        maxPagesPerDestination: backfillPages,
      });
      const summary = includeSummary ? await getDurableCatalogSummaryReport() : null;
      return NextResponse.json(
        {
          ok: true,
          scheduledRefreshCadence: {
            endpoint: SCHEDULED_CATALOG_REFRESH_PATH,
            cron: SCHEDULED_CATALOG_REFRESH_CRON,
            maxDurationSeconds: maxDuration,
            mode: "backfill_only",
          },
          backfillRun,
          summary,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (mode === "destination_bulk_refresh") {
      if (!explicitDest || !explicitDest.trim()) {
        return NextResponse.json(
          { ok: false, error: "destination_query_param_required_for_destination_bulk_refresh" },
          { status: 400 },
        );
      }
      const chunkSize = parsePositiveIntParam(sp.get("chunkSize"), 500, 1, 500);
      const maxChunks = sp.get("maxChunks")
        ? parsePositiveIntParam(sp.get("maxChunks"), 1, 1, 20)
        : undefined;
      const bulkRun = await runDestinationBoundedBulkScheduleRefresh({
        destinationSlug: explicitDest,
        chunkSize,
        maxChunksPerRun: maxChunks,
      });
      const summary = includeSummary ? await getDurableCatalogSummaryReport() : null;
      return NextResponse.json(
        {
          ok: true,
          scheduledRefreshCadence: {
            endpoint: SCHEDULED_CATALOG_REFRESH_PATH,
            cron: SCHEDULED_CATALOG_REFRESH_CRON,
            maxDurationSeconds: maxDuration,
            mode: "destination_bulk_refresh",
          },
          destinationBulkRun: bulkRun,
          summary,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (mode === "schedules_only" && explicitDest && explicitDest.trim()) {
      const chunkSize = parsePositiveIntParam(sp.get("chunkSize"), 500, 1, 500);
      const maxChunks = sp.get("maxChunks")
        ? parsePositiveIntParam(sp.get("maxChunks"), 1, 1, 20)
        : undefined;
      const schedRun = await runDestinationBoundedBulkScheduleRefresh({
        destinationSlug: explicitDest,
        chunkSize,
        maxChunksPerRun: maxChunks,
      });
      const summary = includeSummary ? await getDurableCatalogSummaryReport() : null;
      return NextResponse.json(
        {
          ok: true,
          scheduledRefreshCadence: {
            endpoint: SCHEDULED_CATALOG_REFRESH_PATH,
            cron: SCHEDULED_CATALOG_REFRESH_CRON,
            maxDurationSeconds: maxDuration,
            mode: "schedules_only",
          },
          schedulePricingRun: schedRun,
          summary,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Global stream execution ("full_pipeline", "incremental_only", or global "schedules_only"):
    // Enforce strict distributed + in-process mutual-exclusion lease to prevent overlapping cron ticks.
    const lease = await acquireCatalogRefreshExecutionLease({
      leaseDurationMs: SCHEDULED_CATALOG_REFRESH_LEASE_DURATION_MS,
    });
    if (!lease.acquired) {
      return NextResponse.json(
        {
          ok: true,
          paused: false,
          skippedOverlap: true,
          hydrationInitiated: false,
          reason: "concurrent_catalog_refresh_in_progress",
          upstreamRequestCount: 0,
          lease: {
            acquired: false,
            lockRunId: GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID,
            reason: lease.reason,
          },
          scheduledRefreshCadence: {
            endpoint: SCHEDULED_CATALOG_REFRESH_PATH,
            cron: SCHEDULED_CATALOG_REFRESH_CRON,
            maxDurationSeconds: maxDuration,
            mode,
            status: "skipped_overlap",
          },
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    try {
      if (mode === "schedules_only") {
        const scheduleMaxPages = parsePositiveIntParam(
          sp.get("scheduleMaxPages") ?? sp.get("maxPages"),
          SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_MAX_PAGES,
          1,
          50,
        );
        const scheduleMaxRequests = parsePositiveIntParam(
          sp.get("scheduleMaxRequests") ?? sp.get("maxRequests"),
          SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_MAX_REQUESTS,
          1,
          100,
        );
        const scheduleTimeBudgetMs = parsePositiveIntParam(
          sp.get("scheduleTimeBudgetMs") ?? sp.get("timeBudgetMs"),
          SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_TIME_BUDGET_MS,
          1_000,
          105_000,
        );
        const rawScheduleCursor = sp.get("scheduleCursor") ?? sp.get("cursor");
        const rawScheduleModifiedSince =
          sp.get("scheduleModifiedSince") ?? sp.get("modifiedSince");

        const schedRun = await runIncrementalScheduleAndPricingRefresh({
          ...(rawScheduleModifiedSince
            ? { modifiedSince: rawScheduleModifiedSince }
            : rawScheduleCursor
              ? { scheduleCursor: rawScheduleCursor }
              : {}),
          count,
          maxPagesPerRun: scheduleMaxPages,
          maxUpstreamRequestsPerRun: scheduleMaxRequests,
          timeBudgetMs: scheduleTimeBudgetMs,
          allowControlledGlobalExecution,
        });
        const summary = includeSummary ? await getDurableCatalogSummaryReport() : null;
        return NextResponse.json(
          {
            ok: true,
            skippedOverlap: false,
            scheduledRefreshCadence: {
              endpoint: SCHEDULED_CATALOG_REFRESH_PATH,
              cron: SCHEDULED_CATALOG_REFRESH_CRON,
              maxDurationSeconds: maxDuration,
              defaultPageCount: SCHEDULED_CATALOG_REFRESH_DEFAULT_COUNT,
              mode: "schedules_only",
              streams: ["viator_availability_schedules_modified_since"],
            },
            lease: {
              acquired: true,
              lockRunId: GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID,
              holderId: lease.holderId,
              leaseExpiresAt: lease.leaseExpiresAt,
            },
            schedulePricingRun: schedRun,
            summary,
          },
          { status: 200, headers: { "Cache-Control": "no-store" } },
        );
      }

      // Default ("full_pipeline" or "incremental_only"):
      // Legacy destination backfill (`runResumableDestinationBackfillBatch`) is intentionally
      // decoupled and NEVER invoked on the global scheduled cron path.
      const productMaxPages = parsePositiveIntParam(
        sp.get("maxPages"),
        SCHEDULED_CATALOG_REFRESH_DEFAULT_PRODUCT_MAX_PAGES,
        1,
        50,
      );
      const productMaxRequests = parsePositiveIntParam(
        sp.get("maxRequests"),
        SCHEDULED_CATALOG_REFRESH_DEFAULT_PRODUCT_MAX_REQUESTS,
        1,
        100,
      );
      const productTimeBudgetMs = parsePositiveIntParam(
        sp.get("timeBudgetMs"),
        SCHEDULED_CATALOG_REFRESH_DEFAULT_PRODUCT_TIME_BUDGET_MS,
        1_000,
        90_000,
      );
      const scheduleMaxPages = parsePositiveIntParam(
        sp.get("scheduleMaxPages"),
        SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_MAX_PAGES,
        1,
        50,
      );
      const scheduleMaxRequests = parsePositiveIntParam(
        sp.get("scheduleMaxRequests"),
        SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_MAX_REQUESTS,
        1,
        100,
      );
      const scheduleTimeBudgetMs = parsePositiveIntParam(
        sp.get("scheduleTimeBudgetMs"),
        SCHEDULED_CATALOG_REFRESH_DEFAULT_SCHEDULE_TIME_BUDGET_MS,
        1_000,
        90_000,
      );

      const rawCursor = sp.get("cursor");
      const rawModifiedSince = sp.get("modifiedSince");
      const includeSchedules = mode !== "incremental_only";

      const incrementalRun = await runIncrementalViatorCatalogRefresh({
        ...(rawModifiedSince
          ? { modifiedSince: rawModifiedSince }
          : rawCursor
            ? { cursor: rawCursor }
            : {}),
        count,
        maxPagesPerRun: productMaxPages,
        maxUpstreamRequestsPerRun: productMaxRequests,
        timeBudgetMs: productTimeBudgetMs,
        includeScheduleAndPricingRefresh: includeSchedules,
        scheduleCount: count,
        scheduleMaxPagesPerRun: scheduleMaxPages,
        scheduleMaxUpstreamRequestsPerRun: scheduleMaxRequests,
        scheduleTimeBudgetMs,
        allowControlledGlobalExecution,
      });
      const summary = includeSummary ? await getDurableCatalogSummaryReport() : null;

      return NextResponse.json(
        {
          ok: true,
          skippedOverlap: false,
          scheduledRefreshCadence: {
            endpoint: SCHEDULED_CATALOG_REFRESH_PATH,
            cron: SCHEDULED_CATALOG_REFRESH_CRON,
            maxDurationSeconds: maxDuration,
            defaultPageCount: SCHEDULED_CATALOG_REFRESH_DEFAULT_COUNT,
            mode,
            streams: includeSchedules
              ? [
                  "viator_products_modified_since",
                  "viator_availability_schedules_modified_since",
                ]
              : ["viator_products_modified_since"],
          },
          lease: {
            acquired: true,
            lockRunId: GLOBAL_CATALOG_REFRESH_LOCK_RUN_ID,
            holderId: lease.holderId,
            leaseExpiresAt: lease.leaseExpiresAt,
          },
          backfillRun: null,
          incrementalRun,
          summary,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    } finally {
      await releaseCatalogRefreshExecutionLease(lease.holderId);
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "scheduled_catalog_refresh_failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleCatalogRefreshCron(request);
}

export async function POST(request: NextRequest) {
  return handleCatalogRefreshCron(request);
}
