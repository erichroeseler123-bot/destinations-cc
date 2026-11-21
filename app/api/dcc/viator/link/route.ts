import { NextRequest, NextResponse } from "next/server";
import { getDurableTourByIdOrAlias } from "@/lib/dcc/catalog/durableCatalogStore";
import { generateDccTrackedUrl } from "@/lib/dcc/internal/dccViatorAdapter";
import { buildViatorSearchUrl } from "@/lib/viator/links";
import { readVerifiedProductFromCache } from "@/lib/viator/verified-product-cache";
import { resolveViatorCodeForSite } from "@/lib/viator/mappings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const siteId = searchParams.get("siteId");
  const internalId = searchParams.get("internalId");
  const pageType = searchParams.get("pageType") || "guide";
  const customCampaign = searchParams.get("campaign") || undefined;

  if (!siteId || !internalId) {
    return NextResponse.json(
      { error: "Missing required query parameters: siteId, internalId" },
      { status: 400 }
    );
  }

  const viatorCode = resolveViatorCodeForSite(siteId, internalId);
  if (!viatorCode) {
    return NextResponse.json(
      { error: `Unknown product mapping for site "${siteId}" and internal ID "${internalId}".` },
      { status: 404 }
    );
  }

  const cached = readVerifiedProductFromCache(viatorCode);
  const durableTour = cached?.stable.canonicalViatorUrl
    ? null
    : await getDurableTourByIdOrAlias(viatorCode, { projection: "handoff_minimal" });
  const canonicalUrl =
    cached?.stable.canonicalViatorUrl ||
    durableTour?.bookingUrl ||
    buildViatorSearchUrl(viatorCode, { campaign: customCampaign });

  const trackedUrl = generateDccTrackedUrl({
    siteId,
    internalProductId: internalId,
    canonicalUrl,
    pageType,
    customCampaign,
  });

  return NextResponse.json({
    siteId,
    internalId,
    viatorCode,
    isExactProduct: Boolean(cached?.stable.canonicalViatorUrl || durableTour?.bookingUrl),
    trackedUrl,
  });
}
