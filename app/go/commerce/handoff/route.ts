import { NextResponse } from "next/server";
import { resolveOrGenerateW3cTraceparent } from "@/lib/dcc/machine";
import {
  createCommercialHandoff,
  type CommercialProvider,
} from "@/lib/dcc/commerce";

export const dynamic = "force-dynamic";

const ALLOWED_PROVIDERS = new Set<CommercialProvider>([
  "viator",
  "fareharbor",
  "getyourguide",
  "rezdy",
  "square",
  "direct",
]);

export async function GET(request: Request) {
  const traceparent = resolveOrGenerateW3cTraceparent(request);
  const url = new URL(request.url);
  const sp = url.searchParams;

  const originatingSite =
    sp.get("site")?.trim() ||
    sp.get("originatingSite")?.trim() ||
    request.headers.get("referer") ||
    url.hostname ||
    "destinationcommandcenter.com";

  const providerRaw = (sp.get("provider")?.trim().toLowerCase() ||
    "viator") as CommercialProvider;
  const provider: CommercialProvider = ALLOWED_PROVIDERS.has(providerRaw)
    ? providerRaw
    : "viator";

  const providerAccount =
    sp.get("account")?.trim() ||
    sp.get("pid")?.trim() ||
    sp.get("asn")?.trim() ||
    sp.get("partner_id")?.trim() ||
    null;

  const productCode =
    sp.get("product")?.trim() ||
    sp.get("productCode")?.trim() ||
    sp.get("item")?.trim() ||
    "dcc-product";

  const productTitle = sp.get("title")?.trim() || null;

  const productDestinationUrl =
    sp.get("target")?.trim() ||
    sp.get("url")?.trim() ||
    sp.get("destinationUrl")?.trim() ||
    `https://www.viator.com/searchResults/all?text=${encodeURIComponent(productCode)}`;

  const campaign = sp.get("campaign")?.trim() || null;
  const contextId = sp.get("ctx")?.trim() || sp.get("contextId")?.trim() || null;
  const evaluationRunId =
    sp.get("evaluationRunId")?.trim() || sp.get("evalRunId")?.trim() || null;
  const receiptId = sp.get("receiptId")?.trim() || sp.get("receipt")?.trim() || null;
  const intendedDate = sp.get("date")?.trim() || sp.get("intendedDate")?.trim() || null;
  const intendedOption =
    sp.get("option")?.trim() || sp.get("intendedOption")?.trim() || null;

  const partySizeRaw = Number(
    sp.get("partySize") || sp.get("guests") || sp.get("adults") || "",
  );
  const partySize =
    Number.isFinite(partySizeRaw) && partySizeRaw > 0
      ? Math.round(partySizeRaw)
      : null;

  const priceRaw = Number(sp.get("price") || sp.get("quotedPriceAmount") || "");
  const quotedPriceAmount =
    Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : null;

  const partnerId = sp.get("partnerId")?.trim() || sp.get("partner")?.trim() || null;
  const targetSite = sp.get("targetSite")?.trim() || null;

  const handoff = await createCommercialHandoff({
    originatingSite,
    targetSite,
    provider,
    providerAccount,
    productCode,
    productTitle,
    productDestinationUrl,
    campaign,
    contextId,
    evaluationRunId,
    receiptId,
    intendedDate,
    intendedOption,
    partySize,
    partyDetails: partySize
      ? {
          totalGuests: partySize,
          cruiseShip: sp.get("cruiseShip")?.trim() || null,
          portDate: intendedDate,
        }
      : null,
    quotedPriceAmount,
    quotedPriceCurrency: quotedPriceAmount !== null ? "USD" : null,
    approvedPartnerAttribution: partnerId ? { partnerId } : null,
    callerClientId: "client:public_traveler_browser",
    traceparent,
  });

  if (sp.get("mode") === "json" || sp.get("inspect") === "1") {
    return NextResponse.json(
      {
        ok: true,
        handoff_id: handoff.handoffId,
        handoff,
        redirectTarget: handoff.outboundAffiliateUrl,
        traceparent,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          traceparent,
          "X-DCC-Handoff-Id": handoff.handoffId,
          "X-DCC-Provider": handoff.provider,
          "X-DCC-Provider-Account": handoff.providerAccount,
        },
      },
    );
  }

  return NextResponse.redirect(handoff.outboundAffiliateUrl, {
    status: 307,
    headers: {
      "Cache-Control": "no-store",
      traceparent,
      "X-DCC-Handoff-Id": handoff.handoffId,
      "X-DCC-Provider": handoff.provider,
      "X-DCC-Provider-Account": handoff.providerAccount,
    },
  });
}
