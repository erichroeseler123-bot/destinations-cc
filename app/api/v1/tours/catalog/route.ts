import { NextRequest, NextResponse } from "next/server";
import {
  validateViatorModifiedSinceSelector,
  type ViatorModifiedSinceEntrySelector,
} from "@/lib/dcc/catalog/checkpointContract";
import {
  EARTHOS_DESTINATION_NODES,
  getDurableCatalogSummaryReport,
  getDurableTourByIdOrAlias,
  normalizeCatalogBatchPickupAndMeeting,
  paginateAllDurableTourCatalogPages,
  queueCatalogPickupExceptionsToReviewDesk,
  queryDurableTourCatalog,
  type DurableCatalogSortBy,
  type TourCapabilityTier,
} from "@/lib/dcc/catalog/durableCatalogStore";
import {
  runDestinationBoundedBulkScheduleRefresh,
  runGlobalScheduleModifiedSinceRefresh,
  runIncrementalScheduleAndPricingRefresh,
  runIncrementalViatorCatalogRefresh,
  runUniversalCatalogIngestion,
} from "@/lib/dcc/catalog/ingest";
import { buildCatalogTourDirectHandoff } from "@/lib/dcc/catalog/matcher";
import { authenticateCommerceAdminRequest } from "@/lib/dcc/commerce/opaqueAttributionLedger";

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
    if (sp.get("queueReviewDesk") === "true" || sp.get("queueReviewDesk") === "1") {
      return NextResponse.json(
        {
          ok: false,
          error: "catalog_get_is_read_only",
          message:
            "GET /api/v1/tours/catalog is strictly read-only. Review Desk writes require an authenticated POST /api/v1/tours/catalog request.",
        },
        { status: 405, headers: CORS_HEADERS },
      );
    }

    if (sp.get("summary") === "true" || sp.get("summary") === "1") {
      const report = await getDurableCatalogSummaryReport();
      return NextResponse.json(
        {
          ok: true,
          readOnly: true,
          ...report,
          earthosDestinations: EARTHOS_DESTINATION_NODES,
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    const surface = sp.get("surface") || "cruisepromenade";
    const propertySlug = sp.get("propertySlug") || sp.get("property") || undefined;
    const placementId = sp.get("placementId") || sp.get("placement") || undefined;
    const sailingCode = sp.get("sailing") || sp.get("sailingCode") || undefined;
    const date = sp.get("date") || undefined;
    const adultsRaw = sp.get("adults");
    const adults = adultsRaw && Number.isFinite(Number(adultsRaw)) ? Number(adultsRaw) : 2;
    const isTest = sp.get("isTest") === "true" || sp.get("isTest") === "1";

    const singleId = sp.get("id") || sp.get("tourId") || sp.get("alias");
    if (singleId) {
      const tour = await getDurableTourByIdOrAlias(singleId);
      if (!tour) {
        return NextResponse.json(
          { ok: false, error: "tour_not_found", requestedId: singleId },
          { status: 404, headers: CORS_HEADERS },
        );
      }
      const bookingPath = buildCatalogTourDirectHandoff(tour, {
        surface,
        propertySlug,
        placementId,
        sailingCode,
        date,
        adults,
        isTest,
      });
      return NextResponse.json(
        { ok: true, readOnly: true, tour: { ...tour, bookingPath }, bookingPath },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    const approvedRaw = sp.get("approvedTourIds") || "";
    const approvedTourIds = approvedRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const isExceptionsRequest = sp.get("exceptions") === "true" || sp.get("exceptions") === "1";
    const limitRaw = sp.get("limit");
    const parsedLimit = limitRaw ? Number(limitRaw) : undefined;
    const limit =
      parsedLimit !== undefined && Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 500)
        : 100;
    const cursor = sp.get("cursor") || undefined;
    const offsetRaw = sp.get("offset");
    const offset = offsetRaw ? Number(offsetRaw) : undefined;
    const pageRaw = sp.get("page");
    const page = pageRaw ? Number(pageRaw) : undefined;
    const sortByRaw = (sp.get("sortBy") || sp.get("sort") || "") as DurableCatalogSortBy;
    const searchQuery = sp.get("q") || sp.get("search") || undefined;

    const baseFilter = {
      destinationSlug:
        sp.get("destination") ||
        sp.get("destinationSlug") ||
        sp.get("market") ||
        undefined,
      portSlug: sp.get("port") || sp.get("portSlug") || undefined,
      earthosDestinationNodeId: sp.get("earthosNodeId") || undefined,
      provider: sp.get("provider") || undefined,
      capabilityTier: (sp.get("capabilityTier") as TourCapabilityTier) || undefined,
      category: sp.get("category") || undefined,
      searchQuery,
      approvedTourIds: approvedTourIds.length > 0 ? approvedTourIds : undefined,
      includeDiscoveryOnly: sp.get("includeDiscoveryOnly") !== "false",
      includeProductOptions:
        sp.get("includeOptions") === "true" || sp.get("includeOptions") === "1",
      includeConstraints:
        sp.get("includeConstraints") === "true" || sp.get("includeConstraints") === "1",
      includeFullProvenance:
        sp.get("includeProvenance") === "true" || sp.get("includeProvenance") === "1",
      sortBy: sortByRaw || undefined,
    };

    if (isExceptionsRequest) {
      const paged = await paginateAllDurableTourCatalogPages(
        {
          ...baseFilter,
          includeProductOptions: true,
          includeConstraints: true,
        },
        { pageSize: 250 },
      );
      const batch = normalizeCatalogBatchPickupAndMeeting(paged.records);
      return NextResponse.json(
        {
          ok: true,
          readOnly: true,
          storageSource: paged.storageSource,
          pagesEvaluated: paged.pagesFetched,
          summary: batch.summary,
          exceptions: batch.exceptions.slice(0, parsedLimit ?? 100),
          reviewDeskQueue: null,
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    const result = await queryDurableTourCatalog({
      ...baseFilter,
      cursor,
      limit: Number.isFinite(limit) ? limit : 100,
      offset: Number.isFinite(offset) ? offset : undefined,
      page: Number.isFinite(page) ? page : undefined,
    });

    const enrichedRecords = result.records.map((rec) => ({
      ...rec,
      bookingPath: buildCatalogTourDirectHandoff(rec, {
        surface,
        propertySlug,
        placementId,
        sailingCode,
        date,
        adults,
        isTest,
      }),
    }));

    return NextResponse.json(
      {
        ok: true,
        readOnly: true,
        storageSource: result.storageSource,
        projectionTier: result.projectionTier,
        executedInSql: result.executedInSql,
        rowsLoadedIntoApp: result.rowsLoadedIntoApp,
        fullCatalogLoadedIntoApp: result.fullCatalogLoadedIntoApp,
        sqlQueryMs: result.sqlQueryMs,
        totalMatched: result.totalMatched,
        count: enrichedRecords.length,
        returnedCount: enrichedRecords.length,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
        nextOffset: result.nextOffset,
        cursorApplied: result.cursorApplied,
        nextCursor: result.nextCursor,
        records: enrichedRecords,
        tours: enrichedRecords,
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
    let isAuthorized = false;
    try {
      const auth = authenticateCommerceAdminRequest(request);
      isAuthorized = Boolean(auth.authorized);
    } catch {
      const authHeader = request.headers.get("authorization") || "";
      const adminHeader = request.headers.get("x-dcc-admin-secret") || "";
      const expectedSecret =
        process.env.DCC_COMMERCE_ADMIN_SECRET ||
        process.env.CRON_SECRET ||
        process.env.INTERNAL_API_SECRET ||
        "";
      const token = authHeader.replace(/^Bearer\s+/i, "").trim() || adminHeader.trim();
      isAuthorized = Boolean(expectedSecret && token === expectedSecret);
    }
    if (!isAuthorized) {
      return NextResponse.json(
        { ok: false, error: "unauthorized_catalog_sync" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const body = (await request.json().catch(() => ({}))) as ViatorModifiedSinceEntrySelector & {
      mode?:
        | "full_or_paginated"
        | "incremental_refresh"
        | "global_products_modified_since"
        | "schedule_pricing_refresh"
        | "global_schedule_modified_since"
        | "destination_bulk_refresh"
        | "normalize_pickup_and_queue_review_desk";
      count?: number;
      scheduleRefreshLimit?: number;
      includeScheduleAndPricingRefresh?: boolean;
      destinations?: string[];
      destinationSlug?: string;
      chunkSize?: number;
      maxChunksPerRun?: number;
      maxPagesPerRun?: number;
      timeBudgetMs?: number;
      allowControlledGlobalVerification?: boolean;
      forceRestart?: boolean;
      runId?: string;
      perDestinationLimit?: number;
      enrichDetailLimitPerDestination?: number;
      startOffset?: number;
      maxPagesPerDestination?: number;
      resumeFromCheckpoint?: boolean;
      maxRowsToQueue?: number;
    };

    const rawBody = body as Record<string, unknown>;
    const selector = validateViatorModifiedSinceSelector({
      cursor: rawBody.cursor,
      modifiedSince: rawBody.modifiedSince,
    });

    if (body.mode === "normalize_pickup_and_queue_review_desk") {
      const paged = await paginateAllDurableTourCatalogPages(
        {
          destinationSlug: body.destinations?.[0],
          includeProductOptions: true,
          includeConstraints: true,
        },
        { pageSize: 250 },
      );
      const batch = normalizeCatalogBatchPickupAndMeeting(paged.records);
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

    if (body.mode === "destination_bulk_refresh") {
      if (selector.mode !== "none") {
        return NextResponse.json(
          {
            ok: false,
            error: "checkpoint_scope_violation: destination_bulk_refresh cannot accept global cursor or modifiedSince",
          },
          { status: 400, headers: CORS_HEADERS },
        );
      }
      const targetDest = (body.destinationSlug || body.destinations?.[0] || "").trim();
      if (!targetDest) {
        return NextResponse.json(
          { ok: false, error: "destination_slug_required_for_destination_bulk_refresh" },
          { status: 400, headers: CORS_HEADERS },
        );
      }
      const bulkRun = await runDestinationBoundedBulkScheduleRefresh({
        destinationSlug: targetDest,
        chunkSize: body.chunkSize,
        maxChunksPerRun: body.maxChunksPerRun,
        resume: body.resumeFromCheckpoint !== false,
        forceRestart: body.forceRestart,
        runId: body.runId,
      });
      const summary = await getDurableCatalogSummaryReport();
      return NextResponse.json(
        {
          ok: true,
          mode: "destination_bulk_refresh",
          destinationBulkRun: bulkRun,
          summary,
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    const explicitNonProdGlobalOverride =
      body.allowControlledGlobalVerification === true &&
      request.headers.get("x-dcc-controlled-global-verification")?.trim() === "1" &&
      process.env.VERCEL_ENV !== "production";

    if (body.mode === "global_schedule_modified_since") {
      const globalRun = await runGlobalScheduleModifiedSinceRefresh({
        ...(selector.mode === "modified_since"
          ? { modifiedSince: selector.modifiedSince }
          : selector.mode === "cursor"
            ? { scheduleCursor: selector.cursor }
            : {}),
        count: body.count,
        maxPagesPerRun: body.maxPagesPerRun ?? 1,
        timeBudgetMs: body.timeBudgetMs,
        runId: body.runId,
        allowControlledGlobalExecution: explicitNonProdGlobalOverride,
      });
      const paused = Boolean((globalRun.metadata as any)?.paused);
      const summary = paused ? null : await getDurableCatalogSummaryReport();
      return NextResponse.json(
        {
          ok: true,
          paused,
          mode: "global_schedule_modified_since",
          globalScheduleRun: globalRun,
          ...(summary ? { summary } : {}),
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    if (body.mode === "schedule_pricing_refresh") {
      const targetDest = (body.destinationSlug || body.destinations?.[0] || "").trim();
      if (targetDest && selector.mode !== "none") {
        return NextResponse.json(
          {
            ok: false,
            error: "checkpoint_scope_violation: destination schedule refresh cannot accept global cursor or modifiedSince",
          },
          { status: 400, headers: CORS_HEADERS },
        );
      }
      const schedRun = await runIncrementalScheduleAndPricingRefresh({
        ...(selector.mode === "modified_since"
          ? { modifiedSince: selector.modifiedSince }
          : selector.mode === "cursor"
            ? { scheduleCursor: selector.cursor }
            : {}),
        limit: body.scheduleRefreshLimit ?? body.count ?? 15,
        count: body.count,
        destinationSlug: targetDest || undefined,
        chunkSize: body.chunkSize,
        maxChunksPerRun: body.maxChunksPerRun,
        maxPagesPerRun: body.maxPagesPerRun,
        timeBudgetMs: body.timeBudgetMs,
        resume: body.resumeFromCheckpoint !== false,
        allowControlledGlobalExecution: targetDest ? undefined : explicitNonProdGlobalOverride,
      });
      const paused = Boolean((schedRun.metadata as any)?.paused);
      const summary = paused ? null : await getDurableCatalogSummaryReport();
      return NextResponse.json(
        {
          ok: true,
          paused,
          mode: "schedule_pricing_refresh",
          schedulePricingRun: schedRun,
          ...(summary ? { summary } : {}),
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    if (body.mode === "global_products_modified_since" || body.mode === "incremental_refresh") {
      const isDedicatedProductMode = body.mode === "global_products_modified_since";
      const incRun = await runIncrementalViatorCatalogRefresh({
        ...(selector.mode === "modified_since"
          ? { modifiedSince: selector.modifiedSince }
          : selector.mode === "cursor"
            ? { cursor: selector.cursor }
            : {}),
        count: body.count,
        maxPagesPerRun: body.maxPagesPerRun ?? (isDedicatedProductMode ? 1 : undefined),
        timeBudgetMs: body.timeBudgetMs,
        runId: body.runId,
        scheduleRefreshLimit: body.scheduleRefreshLimit,
        includeScheduleAndPricingRefresh: isDedicatedProductMode
          ? body.includeScheduleAndPricingRefresh === true
          : body.includeScheduleAndPricingRefresh,
        allowControlledGlobalExecution: explicitNonProdGlobalOverride,
      });
      const paused = Boolean((incRun.metadata as any)?.paused);
      const summary = paused ? null : await getDurableCatalogSummaryReport();
      return NextResponse.json(
        {
          ok: true,
          paused,
          mode: body.mode,
          incrementalRun: incRun,
          ...(isDedicatedProductMode ? { globalProductsRun: incRun } : {}),
          ...(summary ? { summary } : {}),
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
    const errMsg = err instanceof Error ? err.message : "catalog_sync_failed";
    const isClientValidationErr =
      errMsg.startsWith("viator_modified_since_") || errMsg.startsWith("checkpoint_scope_violation:");
    return NextResponse.json(
      {
        ok: false,
        error: errMsg,
      },
      { status: isClientValidationErr ? 400 : 500, headers: CORS_HEADERS },
    );
  }
}
