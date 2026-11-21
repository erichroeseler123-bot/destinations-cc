import { NextResponse } from "next/server";
import { resolveOrGenerateW3cTraceparent } from "@/lib/dcc/machine";
import {
  buildProviderAffiliateHandoffUrl,
  createCommercialHandoff,
  generateOpaqueClickId,
  generateOpaqueHandoffId,
  type CommercialProvider,
} from "@/lib/dcc/commerce";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";
import { bridgeLegacyEventToV2Collector } from "@/lib/dcc/analytics/collector";
import { scheduleServerlessAfterTask } from "@/lib/dcc/analytics/serverlessLifecycle";

function readCookieFromHeader(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]).trim() : undefined;
}

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

  const isJsonMode = sp.get("mode") === "json";
  const isInspectMode = sp.get("inspect") === "1";

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

  let parsedDestination: URL;
  try {
    parsedDestination = new URL(productDestinationUrl);
    if (parsedDestination.protocol !== "https:") {
      return NextResponse.json(
        { ok: false, error: "INVALID_TARGET_URL" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_TARGET_URL" },
      { status: 400 },
    );
  }

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
  const idempotencyKey =
    sp.get("idempotencyKey")?.trim() || sp.get("idempotency_key")?.trim() || null;
  const intendedDepartureTime =
    sp.get("departureTime")?.trim() || sp.get("time")?.trim() || null;
  let sourcePage =
    sp.get("sourcePage")?.trim() || sp.get("originatingPage")?.trim() || null;
  if (!sourcePage) {
    const refererRaw = request.headers.get("referer")?.trim();
    if (refererRaw) {
      try {
        const refUrl = new URL(refererRaw);
        sourcePage = refUrl.pathname || "/";
      } catch {
        sourcePage = null;
      }
    }
  }
  const isQaTraffic =
    sp.get("qa") === "1" ||
    sp.get("qa") === "true" ||
    sp.get("isQaTraffic") === "1" ||
    sp.get("isQaTraffic") === "true" ||
    Boolean(idempotencyKey && /^qa[_-]/i.test(idempotencyKey));

  const handoffMetadata =
    isQaTraffic || sourcePage
      ? {
          ...(isQaTraffic ? { isQaTraffic: true } : {}),
          ...(sourcePage ? { originatingPage: sourcePage, sourcePage } : {}),
        }
      : null;

  const cookieHeader = request.headers.get("cookie");
  const browserSeed = readCookieFromHeader(cookieHeader, "_dcc_aid");
  const sessionSeed = readCookieFromHeader(cookieHeader, "_dcc_asid");
  const clonedHeaders = new Headers(request.headers);
  const cruiseShip = sp.get("cruiseShip")?.trim() || null;

  // Browser redirect fast path when no idempotency lookup is required before redirecting
  if (!isJsonMode && !isInspectMode && !idempotencyKey) {
    const preGeneratedHandoffId = generateOpaqueHandoffId();
    const preGeneratedClickId = generateOpaqueClickId({ isTest: isQaTraffic });
    const intendedDepartureId = intendedOption?.startsWith("dep-") ? intendedOption : null;

    let urlBuilt;
    try {
      urlBuilt = buildProviderAffiliateHandoffUrl({
        originatingSite,
        provider,
        providerAccount,
        productCode,
        productDestinationUrl,
        handoffId: preGeneratedHandoffId,
        clickId: preGeneratedClickId,
        campaign,
        receiptId,
        intendedDate,
        intendedDepartureId,
        intendedDepartureTime,
        partySize,
        quotedPriceAmount,
      });
    } catch (err) {
      const status =
        err && typeof err === "object" && "statusCode" in err
          ? Number((err as { statusCode?: number }).statusCode) || 400
          : 400;
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : "INVALID_TARGET_URL" },
        { status },
      );
    }

    bridgeLegacyEventToV2Collector({
      rawSite: originatingSite,
      rawEventName: "booking_handoff_initiated",
      eventId: `go_handoff_${urlBuilt.clickId}`,
      visitorId: browserSeed,
      sessionId: sessionSeed,
      sourcePage: sourcePage || "/go/commerce/handoff",
      targetPath: urlBuilt.outboundAffiliateUrl,
      handoffId: preGeneratedHandoffId,
      travelDateHint: intendedDate,
      isTest: isQaTraffic,
      metadata: {
        provider,
        productCode,
        clickId: urlBuilt.clickId,
      },
      headers: clonedHeaders,
    });

    scheduleServerlessAfterTask(async () => {
      try {
        await syncDurableLedgerWithPostgres();
        await createCommercialHandoff({
          handoffId: preGeneratedHandoffId,
          clickId: urlBuilt.clickId,
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
          intendedDepartureTime,
          partySize,
          partyDetails: partySize
            ? {
                totalGuests: partySize,
                cruiseShip,
                portDate: intendedDate,
              }
            : null,
          quotedPriceAmount,
          quotedPriceCurrency: quotedPriceAmount !== null ? "USD" : null,
          approvedPartnerAttribution: partnerId ? { partnerId } : null,
          callerClientId: isQaTraffic
            ? "qa:public_traveler_browser"
            : "client:public_traveler_browser",
          traceparent,
          metadata: handoffMetadata,
        });
        await syncDurableLedgerWithPostgres({ forcePushLocal: true });
      } catch {
        // Non-blocking commercial ledger persistence; Analytics v2 milestone is scheduled independently above.
      }
    });

    return NextResponse.redirect(urlBuilt.outboundAffiliateUrl, {
      status: 307,
      headers: {
        "Cache-Control": "no-store",
        traceparent,
        "X-DCC-Handoff-Id": preGeneratedHandoffId,
        "X-DCC-Click-Id": urlBuilt.clickId,
        "X-DCC-Provider": provider,
        "X-DCC-Provider-Account": urlBuilt.providerAccount,
      },
    });
  }

  await syncDurableLedgerWithPostgres();
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
    idempotencyKey,
    intendedDate,
    intendedOption,
    intendedDepartureTime,
    partySize,
    partyDetails: partySize
      ? {
          totalGuests: partySize,
          cruiseShip,
          portDate: intendedDate,
        }
      : null,
    quotedPriceAmount,
    quotedPriceCurrency: quotedPriceAmount !== null ? "USD" : null,
    approvedPartnerAttribution: partnerId ? { partnerId } : null,
    callerClientId: isQaTraffic
      ? "qa:public_traveler_browser"
      : "client:public_traveler_browser",
    traceparent,
    metadata: handoffMetadata,
  });
  await syncDurableLedgerWithPostgres({ forcePushLocal: true });

  if (!isInspectMode) {
    bridgeLegacyEventToV2Collector({
      rawSite: originatingSite,
      rawEventName: "booking_handoff_initiated",
      eventId: `go_handoff_${handoff.clickId}`,
      visitorId: browserSeed,
      sessionId: sessionSeed,
      sourcePage: sourcePage || "/go/commerce/handoff",
      targetPath: handoff.outboundAffiliateUrl,
      handoffId: handoff.handoffId,
      travelDateHint: intendedDate,
      isTest: isQaTraffic,
      metadata: {
        provider: handoff.provider,
        productCode,
        clickId: handoff.clickId,
      },
      headers: clonedHeaders,
    });
  }

  if (isJsonMode || isInspectMode) {
    return NextResponse.json(
      {
        ok: true,
        handoff_id: handoff.handoffId,
        click_id: handoff.clickId,
        duplicateSubmission: Boolean(handoff.duplicateSubmission),
        isQaTraffic,
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
          "X-DCC-Click-Id": handoff.clickId,
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
      "X-DCC-Click-Id": handoff.clickId,
      "X-DCC-Provider": handoff.provider,
      "X-DCC-Provider-Account": handoff.providerAccount,
    },
  });
}
