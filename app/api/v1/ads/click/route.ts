import { NextResponse } from "next/server";
import {
  getOpaqueClickAttributionById,
  issueOpaqueClickAttribution,
  recordOutboundClickFollow,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await syncDurableLedgerWithPostgres();
  const url = new URL(request.url);
  const clickId = url.searchParams.get("clickId")?.trim() || "";
  const isTestParam = url.searchParams.get("isTest") === "true";
  const targetParam = url.searchParams.get("target")?.trim() || "";
  const placementIdParam =
    url.searchParams.get("placementId")?.trim() ||
    url.searchParams.get("placement")?.trim() ||
    null;
  const propertySlugParam =
    url.searchParams.get("property")?.trim() ||
    url.searchParams.get("propertySlug")?.trim() ||
    null;

  if (!clickId) {
    return NextResponse.json(
      { ok: false, error: "MISSING_CLICK_ID" },
      { status: 400 },
    );
  }

  const userAgent = request.headers.get("user-agent");
  const referer = request.headers.get("referer");

  let updated =
    recordOutboundClickFollow(clickId, {
      userAgent,
      referer,
      isTest: isTestParam,
      placementId: placementIdParam,
      propertySlug: propertySlugParam,
    }) ?? getOpaqueClickAttributionById(clickId);

  if (!updated && targetParam && /^https?:\/\//i.test(targetParam)) {
    const provider = targetParam.includes("viator.com")
      ? "viator"
      : targetParam.includes("fareharbor.com")
        ? "fareharbor"
        : targetParam.includes("gosno.co")
          ? "rezdy"
          : "direct";
    updated = issueOpaqueClickAttribution({
      clickId,
      decisionReceiptId: `rcpt:dcc:click:${clickId}`,
      recommendedOperatorId: provider,
      recommendedOperatorName: provider,
      evidenceVersion: "dcc_catalog_v2",
      originatingSite: "destinationcommandcenter.com",
      originatingPage: referer || "/tours",
      placementId: placementIdParam,
      propertySlug: propertySlugParam,
      provider,
      productCode: clickId,
      productDestinationUrl: targetParam,
      isTest: isTestParam,
      recordStage: "outbound_click",
    });
  }

  if (!updated || !updated.outboundPartnerUrl) {
    return NextResponse.json(
      { ok: false, error: "CLICK_ATTRIBUTION_NOT_FOUND", clickId },
      { status: 404 },
    );
  }

  await syncDurableLedgerWithPostgres();
  return NextResponse.redirect(updated.outboundPartnerUrl, 302);
}
