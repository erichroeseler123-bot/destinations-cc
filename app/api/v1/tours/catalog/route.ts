import { NextRequest, NextResponse } from "next/server";
import {
  EARTHOS_DESTINATION_NODES,
  getDurableCatalogSummaryReport,
  getDurableTourByIdOrAlias,
  normalizeCatalogBatchPickupAndMeeting,
  queueCatalogPickupExceptionsToReviewDesk,
  queryDurableTourCatalog,
  type TourCapabilityTier,
} from "@/lib/dcc/catalog/durableCatalogStore";
import {
  runIncrementalScheduleAndPricingRefresh,
  runIncrementalViatorCatalogRefresh,
  runUniversalCatalogIngestion,
} from "@/lib/dcc/catalog/ingest";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-DCC-Admin-Secret",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    if (sp.get("summary") === "true" || sp.get("summary") === "1") {
      const report = await getDurableCatalogSummaryReport();
      return NextResponse.json(
        {
          ok: true,
          ...report,
          earthosDestinations: EARTHOS_DESTINATION_NODES,
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    const singleId = sp.get("id") || sp.get("tourId") || sp.get("alias");
    if (singleId) {
      const tour = await getDurableTourByIdOrAlias(singleId);
      if (!tour) {
        return NextResponse.json(
          { ok: false, error: "tour_not_found", requestedId: singleId },
          { status: 404, headers: CORS_HEADERS },
        );
      }
      return NextResponse.json({ ok: true, tour }, { status: 200, headers: CORS_HEADERS });
    }

    const approvedRaw = sp.get("approvedTourIds") || "";
    const approvedTourIds = approvedRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const limitRaw = sp.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;

    const result = await queryDurableTourCatalog({
      destinationSlug: sp.get("destination") || sp.get("destinationSlug") || undefined,
      portSlug: sp.get("port") || sp.get("portSlug") || undefined,
      earthosDestinationNodeId: sp.get("earthosNodeId") || undefined,
      provider: sp.get("provider") || undefined,
      capabilityTier: (sp.get("capabilityTier") as TourCapabilityTier) || undefined,
      category: sp.get("category") || undefined,
      approvedTourIds: approvedTourIds.length > 0 ? approvedTourIds : undefined,
      includeDiscoveryOnly: sp.get("includeDiscoveryOnly") !== "false",
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    if (sp.get("exceptions") === "true" || sp.get("exceptions") === "1") {
      const batch = normalizeCatalogBatchPickupAndMeeting(result.records);
      const shouldQueue =
        sp.get("queueReviewDesk") === "true" || sp.get("queueReviewDesk") === "1";
      const reviewDeskQueue = shouldQueue
        ? await queueCatalogPickupExceptionsToReviewDesk(batch.exceptions, {
            maxRowsToQueue: Number(sp.get("maxQueue") || 100),
          })
        : null;
      return NextResponse.json(
        {
          ok: true,
          storageSource: result.storageSource,
          summary: batch.summary,
          exceptions: batch.exceptions.slice(0, limit ?? 100),
          reviewDeskQueue: reviewDeskQueue
            ? {
                queuedCount: reviewDeskQueue.queuedCount,
                persistedToDurableStore: reviewDeskQueue.persistedToDurableStore,
              }
            : null,
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        storageSource: result.storageSource,
        totalMatched: result.totalMatched,
        count: result.records.length,
        records: result.records,
      },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "catalog_query_failed",
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const adminHeader = request.headers.get("x-dcc-admin-secret") || "";
    const expectedSecret =
      process.env.DCC_COMMERCE_ADMIN_SECRET || process.env.CRON_SECRET || "";

    const token = authHeader.replace(/^Bearer\s+/i, "").trim() || adminHeader.trim();
    if (!expectedSecret || token !== expectedSecret) {
      return NextResponse.json(
        { ok: false, error: "unauthorized_catalog_sync" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      mode?:
        | "full_or_paginated"
        | "incremental_refresh"
        | "schedule_pricing_refresh"
        | "normalize_pickup_and_queue_review_desk";
      cursor?: string;
      count?: number;
      scheduleRefreshLimit?: number;
      destinations?: string[];
      perDestinationLimit?: number;
      enrichDetailLimitPerDestination?: number;
      startOffset?: number;
      maxPagesPerDestination?: number;
      resumeFromCheckpoint?: boolean;
      maxRowsToQueue?: number;
    };

    if (body.mode === "normalize_pickup_and_queue_review_desk") {
      const result = await queryDurableTourCatalog({
        destinationSlug: body.destinations?.[0],
      });
      const batch = normalizeCatalogBatchPickupAndMeeting(result.records);
      const reviewDeskResult = await queueCatalogPickupExceptionsToReviewDesk(
        batch.exceptions,
        { maxRowsToQueue: body.maxRowsToQueue ?? 250 },
      );
      return NextResponse.json(
        {
          ok: true,
          mode: "normalize_pickup_and_queue_review_desk",
          summary: batch.summary,
          queuedToReviewDeskCount: reviewDeskResult.queuedCount,
          persistedToDurableStore: reviewDeskResult.persistedToDurableStore,
          sampleExceptions: batch.exceptions.slice(0, 20),
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    if (body.mode === "schedule_pricing_refresh") {
      const schedRun = await runIncrementalScheduleAndPricingRefresh({
        limit: body.scheduleRefreshLimit ?? body.count ?? 15,
        destinationSlug: body.destinations?.[0],
      });
      const summary = await getDurableCatalogSummaryReport();
      return NextResponse.json(
        {
          ok: true,
          mode: "schedule_pricing_refresh",
          schedulePricingRun: schedRun,
          summary,
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    if (body.mode === "incremental_refresh") {
      const incRun = await runIncrementalViatorCatalogRefresh({
        cursor: body.cursor,
        count: body.count,
        scheduleRefreshLimit: body.scheduleRefreshLimit,
      });
      const summary = await getDurableCatalogSummaryReport();
      return NextResponse.json(
        {
          ok: true,
          mode: "incremental_refresh",
          incrementalRun: incRun,
          summary,
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    const syncRes = await runUniversalCatalogIngestion({
      destinations: body.destinations,
      perDestinationLimit: body.perDestinationLimit ?? 12,
      enrichDetailLimitPerDestination: body.enrichDetailLimitPerDestination ?? 6,
      startOffset: body.startOffset,
      maxPagesPerDestination: body.maxPagesPerDestination,
      resumeFromCheckpoint: body.resumeFromCheckpoint,
    });
    const summary = await getDurableCatalogSummaryReport();

    return NextResponse.json(
      {
        ok: true,
        mode: "full_or_paginated",
        upsertedCount: syncRes.upsertedCount,
        persistedToPostgres: syncRes.persistedToPostgres,
        summary,
      },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "catalog_sync_failed",
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
