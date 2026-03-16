import { NextResponse } from "next/server";
import { getProductCacheStatus, getReviewCacheStatus, getTaxonomyCacheStatus } from "@/lib/viator/cache-status";
import { getViatorPublicConfig, getViatorServerConfig } from "@/lib/viator/config";
import { getViatorRuntimeCapabilityProbe, getViatorRuntimeSnapshot } from "@/lib/viator/runtime";
import tours from "@/data/tours.json";

export const runtime = "nodejs";

function getSampleProductCode(): string | null {
  const rows = Array.isArray(tours) ? tours : [];
  const sample = rows.find((row) => row && typeof row === "object" && typeof (row as { product_code?: unknown }).product_code === "string");
  const productCode = sample && typeof sample === "object" ? (sample as { product_code?: unknown }).product_code : null;
  return typeof productCode === "string" ? productCode : null;
}

export async function GET() {
  const publicConfig = getViatorPublicConfig();
  const serverConfig = getViatorServerConfig();
  const probe = await getViatorRuntimeCapabilityProbe();
  const snapshot = await getViatorRuntimeSnapshot();
  const sampleProductCode = getSampleProductCode();

  return NextResponse.json(
    {
      generated_at: new Date().toISOString(),
      config: {
        accessTier: publicConfig.accessTier,
        locale: publicConfig.locale,
        medium: publicConfig.medium,
        apiConfigured: Boolean(serverConfig.apiKey),
        sourcePolicy: serverConfig.sourcePolicy,
      },
      capabilities: {
        canUseSearch: snapshot.capabilities.canUseSearch,
        canUseModifiedSince: snapshot.capabilities.canUseModifiedSince,
        canUseSchedules: snapshot.capabilities.canUseSchedules,
        canUseBooking: snapshot.capabilities.canUseBooking,
        canUseAmendments: snapshot.capabilities.canUseAmendments,
      },
      caches: {
        taxonomy: getTaxonomyCacheStatus(),
        reviews: getReviewCacheStatus(),
        sampleProductReviewCache: getProductCacheStatus(sampleProductCode),
      },
      probe,
      snapshot,
    },
    { status: 200 }
  );
}
