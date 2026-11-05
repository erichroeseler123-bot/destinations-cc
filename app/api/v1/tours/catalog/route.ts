import { NextRequest, NextResponse } from "next/server";
import {
  EARTHOS_DESTINATION_NODES,
  getDurableCatalogSummaryReport,
  getDurableTourByIdOrAlias,
  queryDurableTourCatalog,
  type TourCapabilityTier,
} from "@/lib/dcc/catalog/durableCatalogStore";
import { runUniversalCatalogIngestion } from "@/lib/dcc/catalog/ingest";

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
      destinations?: string[];
      perDestinationLimit?: number;
      enrichDetailLimitPerDestination?: number;
    };

    const syncRes = await runUniversalCatalogIngestion({
      destinations: body.destinations,
      perDestinationLimit: body.perDestinationLimit ?? 10,
      enrichDetailLimitPerDestination: body.enrichDetailLimitPerDestination ?? 3,
    });
    const summary = await getDurableCatalogSummaryReport();

    return NextResponse.json(
      {
        ok: true,
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
