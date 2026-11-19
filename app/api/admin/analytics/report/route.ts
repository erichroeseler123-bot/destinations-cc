import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAccess";
import { verifyCollectorServerAuth } from "@/lib/dcc/analytics/collector";
import type {
  AnalyticsEnvironment,
  CanonicalAnalyticsSiteId,
  ContentFamily,
} from "@/lib/dcc/analytics/contract";
import {
  buildNetworkAndTripAnalyticsReport,
  type AnalyticsWindowPreset,
} from "@/lib/dcc/analytics/reporting";
import { runAnalyticsWorker } from "@/lib/dcc/analytics/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedReportReader(request: NextRequest): boolean {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || null;
  if (isValidAdminSession(session)) return true;
  if (verifyCollectorServerAuth(request.headers)) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedReportReader(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const rawWindow = sp.get("window") || "28d";
  const windowPreset: AnalyticsWindowPreset =
    rawWindow === "24h" || rawWindow === "7d" || rawWindow === "28d" ? rawWindow : "28d";

  const rawEnv = sp.get("env") || (process.env.VERCEL_ENV === "production" ? "production" : "preview");
  const environment: AnalyticsEnvironment =
    rawEnv === "production" || rawEnv === "preview" || rawEnv === "development" || rawEnv === "test"
      ? rawEnv
      : "preview";

  const siteId = (sp.get("site") || "all") as CanonicalAnalyticsSiteId | "all";
  const contentFamily = (sp.get("family") || "all") as ContentFamily | "all";
  const startIso = sp.get("startIso") || undefined;
  const endIso = sp.get("endIso") || undefined;
  const asOfWatermarkIso = sp.get("watermarkIso") || undefined;

  if (sp.get("processPending") === "1") {
    try {
      await runAnalyticsWorker();
    } catch {
      // If store is in outage, buildNetworkAndTripAnalyticsReport will surface stale/unavailable cleanly
    }
  }

  const report = await buildNetworkAndTripAnalyticsReport({
    environment,
    windowPreset,
    siteId,
    contentFamily,
    startIso,
    endIso,
    asOfWatermarkIso,
    bypassCache: sp.get("bypassCache") === "1",
  });

  const status = report.dataStatus === "unavailable" ? 503 : 200;
  return NextResponse.json(report, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-DCC-Analytics-Backend": `${report.backendInfo.backend}:${report.backendInfo.databaseName}`,
    },
  });
}
