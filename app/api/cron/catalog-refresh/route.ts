import { NextRequest, NextResponse } from "next/server";
import { verifyEarthOSAuthorization } from "@/lib/dcc/earthos/auth";
import { getDurableCatalogSummaryReport } from "@/lib/dcc/catalog/durableCatalogStore";
import {
  runIncrementalScheduleAndPricingRefresh,
  runIncrementalViatorCatalogRefresh,
  runResumableDestinationBackfillBatch,
} from "@/lib/dcc/catalog/ingest";

export const dynamic = "force-dynamic";

export const SCHEDULED_CATALOG_REFRESH_PATH = "/api/cron/catalog-refresh";
export const SCHEDULED_CATALOG_REFRESH_CRON = "0 */4 * * *";

function isAuthorizedCatalogCron(request: NextRequest): {
  authorized: boolean;
  method: string;
} {
  const authHeader = request.headers.get("authorization") || "";
  const adminHeader = request.headers.get("x-dcc-admin-secret") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || adminHeader.trim();

  const secrets = [
    process.env.CRON_SECRET,
    process.env.DCC_COMMERCE_ADMIN_SECRET,
    process.env.EARTHOS_MAINTENANCE_TOKEN,
  ]
    .map((s) => (s || "").trim())
    .filter(Boolean);

  if (token && secrets.includes(token)) {
    return { authorized: true, method: "bearer_or_admin_secret" };
  }
  return { authorized: false, method: "none" };
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

  try {
    const sp = request.nextUrl.searchParams;
    const mode = sp.get("mode") || "full_pipeline";
    const count = sp.get("count") ? Number(sp.get("count")) : 50;
    const scheduleLimit = sp.get("scheduleLimit") ? Number(sp.get("scheduleLimit")) : 12;
    const backfillDestinationsLimit = sp.get("backfillDestinations")
      ? Number(sp.get("backfillDestinations"))
      : 2;
    const backfillPages = sp.get("backfillPages") ? Number(sp.get("backfillPages")) : 2;
    const explicitDest = sp.get("destination");

    if (mode === "backfill_only") {
      const backfillRun = await runResumableDestinationBackfillBatch({
        destinations: explicitDest ? [explicitDest] : undefined,
        maxDestinationsPerRun: Number.isFinite(backfillDestinationsLimit)
          ? backfillDestinationsLimit
          : 2,
        perDestinationLimit: 50,
        maxPagesPerDestination: Number.isFinite(backfillPages) ? backfillPages : 2,
      });
      const summary = await getDurableCatalogSummaryReport();
      return NextResponse.json(
        {
          ok: true,
          scheduledRefreshCadence: {
            endpoint: SCHEDULED_CATALOG_REFRESH_PATH,
            cron: SCHEDULED_CATALOG_REFRESH_CRON,
            mode: "backfill_only",
          },
          backfillRun,
          summary,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (mode === "schedules_only") {
      const schedRun = await runIncrementalScheduleAndPricingRefresh({
        limit: Number.isFinite(scheduleLimit) ? scheduleLimit : 12,
        destinationSlug: explicitDest || undefined,
      });
      const summary = await getDurableCatalogSummaryReport();
      return NextResponse.json(
        {
          ok: true,
          scheduledRefreshCadence: {
            endpoint: SCHEDULED_CATALOG_REFRESH_PATH,
            cron: SCHEDULED_CATALOG_REFRESH_CRON,
            mode: "schedules_only",
          },
          schedulePricingRun: schedRun,
          summary,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Default ("full_pipeline" or "incremental_and_schedules"):
    // 1. Resume incomplete destination backfill tails from durable Postgres checkpoints
    const backfillRun =
      mode === "incremental_only"
        ? null
        : await runResumableDestinationBackfillBatch({
            destinations: explicitDest ? [explicitDest] : undefined,
            maxDestinationsPerRun: Number.isFinite(backfillDestinationsLimit)
              ? backfillDestinationsLimit
              : 2,
            perDestinationLimit: 50,
            maxPagesPerDestination: Number.isFinite(backfillPages) ? backfillPages : 1,
          });

    // 2. Run product change stream (/products/modified-since) + separate availability/pricing change stream (/availability/schedules/modified-since)
    const incrementalRun = await runIncrementalViatorCatalogRefresh({
      cursor: sp.get("cursor") || undefined,
      count: Number.isFinite(count) ? count : 50,
      scheduleRefreshLimit: Number.isFinite(scheduleLimit) ? scheduleLimit : 12,
      includeScheduleAndPricingRefresh: true,
    });
    const summary = await getDurableCatalogSummaryReport();

    return NextResponse.json(
      {
        ok: true,
        scheduledRefreshCadence: {
          endpoint: SCHEDULED_CATALOG_REFRESH_PATH,
          cron: SCHEDULED_CATALOG_REFRESH_CRON,
          mode,
          streams: [
            "postgres_resumable_destination_backfill",
            "viator_products_modified_since",
            "viator_availability_schedules_modified_since_and_pg_queue",
          ],
        },
        backfillRun,
        incrementalRun,
        summary,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
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

