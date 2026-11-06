import { NextResponse } from "next/server";
import {
  getDurableTourByIdOrAlias,
  PILOT_VERIFIED_TOUR_RECORDS,
  type DurableTourRecord,
} from "@/lib/dcc/catalog/durableCatalogStore";
import { buildFareHarborDatePreselectedUrl } from "@/lib/dcc/catalog/matcher";
import {
  deriveServerReferralIdForOffer,
  extractClickIdFromTrackingValue,
  generateOpaqueClickId,
  getOpaqueClickAttributionById,
  isQaReferralId,
  issueOpaqueClickAttribution,
  recordOutboundClickFollow,
  verifyApprovedCheckoutHandoffSignature,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";
import { resolveShareableWinterSailingPlan } from "@/lib/dcc/winterExcursionPlanner";
import { appendViatorAttribution } from "@/lib/viator/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APPROVED_PROVIDER_HOSTS = new Set([
  "www.viator.com",
  "viator.com",
  "fareharbor.com",
  "www.fareharbor.com",
  "gosno.co",
  "www.gosno.co",
  "partyatredrocks.com",
  "www.partyatredrocks.com",
]);

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

async function resolveApprovedCatalogOffer(
  offerParam: string,
  parsedTarget: URL | null,
): Promise<DurableTourRecord | null> {
  if (offerParam) {
    const byOffer = await getDurableTourByIdOrAlias(offerParam);
    if (byOffer) return byOffer;
  }

  if (parsedTarget) {
    const viatorPathMatch = parsedTarget.pathname.match(/\/d\d+-([A-Za-z0-9_]+)$/i);
    if (viatorPathMatch?.[1]) {
      const byPathCode = await getDurableTourByIdOrAlias(viatorPathMatch[1]);
      if (byPathCode) return byPathCode;
    }

    const fhItemMatch = parsedTarget.pathname.match(/\/items\/(\d+)/i);
    if (fhItemMatch?.[1]) {
      const byFhItem = await getDurableTourByIdOrAlias(fhItemMatch[1]);
      if (byFhItem) return byFhItem;
    }

    const dccCode =
      parsedTarget.searchParams.get("dcc_product_code")?.trim() ||
      parsedTarget.searchParams.get("viator_product")?.trim() ||
      parsedTarget.searchParams.get("item")?.trim() ||
      "";
    if (dccCode) {
      const byQueryCode = await getDurableTourByIdOrAlias(dccCode);
      if (byQueryCode) return byQueryCode;
    }

    const targetNormHost = normalizeHost(parsedTarget.hostname);
    const targetPathLower = parsedTarget.pathname.toLowerCase().replace(/\/+$/, "");
    for (const rec of PILOT_VERIFIED_TOUR_RECORDS) {
      if (!rec.bookingUrl) continue;
      try {
        const recUrl = new URL(rec.bookingUrl);
        if (
          normalizeHost(recUrl.hostname) === targetNormHost &&
          recUrl.pathname.toLowerCase().replace(/\/+$/, "") === targetPathLower
        ) {
          return rec;
        }
      } catch {
        // ignore malformed seed URL
      }
    }
  }

  return null;
}

export async function GET(request: Request) {
  await syncDurableLedgerWithPostgres();
  const url = new URL(request.url);
  const rawClickId =
    url.searchParams.get("clickId")?.trim() ||
    url.searchParams.get("referralId")?.trim() ||
    "";
  const targetParam = url.searchParams.get("target")?.trim() || "";
  const offerParam =
    url.searchParams.get("offer")?.trim() ||
    url.searchParams.get("productCode")?.trim() ||
    url.searchParams.get("tourId")?.trim() ||
    "";
  const optionParam =
    url.searchParams.get("option")?.trim() ||
    url.searchParams.get("optionCode")?.trim() ||
    "";
  const sailingParam =
    url.searchParams.get("sailing")?.trim() ||
    url.searchParams.get("plan")?.trim() ||
    url.searchParams.get("planCode")?.trim() ||
    "";
  const placementIdParam =
    url.searchParams.get("placementId")?.trim() ||
    url.searchParams.get("placement")?.trim() ||
    null;
  const propertySlugParam =
    url.searchParams.get("property")?.trim() ||
    url.searchParams.get("propertySlug")?.trim() ||
    null;
  const dateParam = url.searchParams.get("date")?.trim() || null;
  const adultsParam = url.searchParams.get("adults")?.trim() || null;
  const departureTimeParam = url.searchParams.get("departureTime")?.trim() || null;
  const sigParam = url.searchParams.get("sig")?.trim() || null;

  if (!rawClickId && !offerParam) {
    return NextResponse.json(
      { ok: false, error: "MISSING_CLICK_ID" },
      { status: 400 },
    );
  }

  const incomingClickId = rawClickId
    ? extractClickIdFromTrackingValue(rawClickId) ||
      (/^clk_(?:qa_)?[0-9a-f]{20,24}$/i.test(rawClickId) ? rawClickId.toLowerCase() : "")
    : "";

  if (rawClickId && !incomingClickId) {
    return NextResponse.json(
      { ok: false, error: "INVALID_REFERRAL_ID_FORMAT", clickId: rawClickId },
      { status: 400 },
    );
  }

  const isTestParam =
    url.searchParams.get("isTest") === "true" ||
    url.searchParams.get("trafficClass") === "test" ||
    isQaReferralId(incomingClickId);

  let parsedTarget: URL | null = null;
  if (targetParam) {
    try {
      parsedTarget = new URL(targetParam);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAPPROVED_CHECKOUT_DESTINATION",
          reason: "INVALID_TARGET_URL",
        },
        { status: 403 },
      );
    }

    if (
      parsedTarget.protocol !== "https:" ||
      !APPROVED_PROVIDER_HOSTS.has(parsedTarget.hostname.toLowerCase())
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAPPROVED_CHECKOUT_DESTINATION",
          reason: "UNAPPROVED_PROVIDER_HOST",
          host: parsedTarget.hostname,
        },
        { status: 403 },
      );
    }
  }

  const catalogRecord = await resolveApprovedCatalogOffer(offerParam, parsedTarget);

  // If both a target URL and an approved catalog offer exist, verify the target matches the catalog offer
  if (parsedTarget && catalogRecord && catalogRecord.bookingUrl) {
    const expectedUrl = new URL(catalogRecord.bookingUrl);
    const sameHost =
      normalizeHost(parsedTarget.hostname) === normalizeHost(expectedUrl.hostname);
    const targetPathLower = parsedTarget.pathname.toLowerCase();
    const codeLower = catalogRecord.providerProductCode.toLowerCase();
    const matchesProductPath =
      catalogRecord.primaryProvider === "viator"
        ? targetPathLower.endsWith(`-${codeLower}`) ||
          targetPathLower === expectedUrl.pathname.toLowerCase()
        : catalogRecord.primaryProvider === "fareharbor"
          ? targetPathLower.includes(`/items/${codeLower}`)
          : sameHost;

    if (!sameHost || !matchesProductPath) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAPPROVED_CHECKOUT_DESTINATION",
          reason: "TARGET_DOES_NOT_MATCH_APPROVED_OFFER",
          offer: catalogRecord.providerProductCode,
        },
        { status: 403 },
      );
    }
  }

  // Enforce sailing itinerary port verification if a sailing code is specified
  if (sailingParam && catalogRecord) {
    const normalizedSailing = sailingParam.trim().toUpperCase();
    if (
      normalizedSailing === "INDY-2027-01-24" ||
      normalizedSailing === "WESTERN-2027-01-24"
    ) {
      const plan = resolveShareableWinterSailingPlan(normalizedSailing);
      const allowedPorts = new Set(
        plan.itineraryDays
          .filter((d) => d.stopType === "port" && d.portSlug)
          .map((d) => d.portSlug as string),
      );
      const offerPort = (
        catalogRecord.portSlug ||
        catalogRecord.destinationSlug ||
        ""
      ).toLowerCase();
      if (offerPort && !allowedPorts.has(offerPort)) {
        return NextResponse.json(
          {
            ok: false,
            error: "UNAPPROVED_CHECKOUT_DESTINATION",
            reason: "OFFER_NOT_ON_SAILING_ITINERARY",
            sailing: plan.planCode,
            offer: catalogRecord.providerProductCode,
            offerPort,
          },
          { status: 403 },
        );
      }
    }
  }

  // Verify HMAC handoff signature if provided
  if (sigParam) {
    const sigValid = verifyApprovedCheckoutHandoffSignature(
      {
        clickId: incomingClickId,
        offer: offerParam || catalogRecord?.providerProductCode || "",
        option: optionParam || "DEFAULT",
        sailing: sailingParam,
        placementId: placementIdParam || "",
        property: propertySlugParam || catalogRecord?.destinationSlug || "",
        date: dateParam || "",
        adults: adultsParam || "2",
      },
      sigParam,
    );
    if (!sigValid) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAPPROVED_CHECKOUT_DESTINATION",
          reason: "INVALID_HANDOFF_SIGNATURE",
        },
        { status: 403 },
      );
    }
  }

  const userAgent = request.headers.get("user-agent");
  const referer = request.headers.get("referer");
  const isAutomatedUa = Boolean(
    userAgent &&
      (/^(node|undici|curl\/|python-requests)/i.test(userAgent.trim()) ||
        /headlesschrome|playwright|puppeteer/i.test(userAgent)),
  );
  const effectiveIsTest = Boolean(isTestParam || isAutomatedUa);

  const existingRecord = incomingClickId
    ? getOpaqueClickAttributionById(incomingClickId)
    : null;

  if (existingRecord && parsedTarget && !catalogRecord) {
    try {
      const existingUrl = new URL(existingRecord.outboundPartnerUrl);
      if (
        normalizeHost(parsedTarget.hostname) !== normalizeHost(existingUrl.hostname) ||
        parsedTarget.pathname.toLowerCase() !== existingUrl.pathname.toLowerCase()
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "UNAPPROVED_CHECKOUT_DESTINATION",
            reason: "TARGET_MISMATCH_WITH_ISSUED_REFERRAL",
          },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAPPROVED_CHECKOUT_DESTINATION",
          reason: "INVALID_ISSUED_REFERRAL_URL",
        },
        { status: 403 },
      );
    }
  }

  if (!existingRecord && !catalogRecord) {
    if (targetParam) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAPPROVED_CHECKOUT_DESTINATION",
          reason: "OFFER_NOT_IN_APPROVED_CATALOG",
        },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "CLICK_ATTRIBUTION_NOT_FOUND", clickId: incomingClickId },
      { status: 404 },
    );
  }

  // Check if incomingClickId is a shared deterministic offer template ID or has already been consumed by a prior guest click
  const templateOfferCode = offerParam || catalogRecord?.providerProductCode || "";
  const isDeterministicOfferTemplate = Boolean(
    incomingClickId &&
      templateOfferCode &&
      (incomingClickId ===
        deriveServerReferralIdForOffer({
          sailingCode: sailingParam || "",
          productCode: templateOfferCode,
          optionCode: optionParam || "DEFAULT",
          placementId: placementIdParam || "",
          propertySlug: propertySlugParam || catalogRecord?.destinationSlug || "",
          date: dateParam || "",
          adults: Number(adultsParam) || 2,
          isTest: false,
        }) ||
        incomingClickId ===
          deriveServerReferralIdForOffer({
            sailingCode: "cruisepromenade",
            productCode: templateOfferCode,
            optionCode: optionParam || "DEFAULT",
            placementId: placementIdParam || "",
            propertySlug: propertySlugParam || catalogRecord?.destinationSlug || "",
            date: dateParam || "",
            adults: Number(adultsParam) || 2,
            isTest: false,
          }) ||
        incomingClickId ===
          deriveServerReferralIdForOffer({
            sailingCode: "wno",
            productCode: templateOfferCode,
            optionCode: optionParam || "DEFAULT",
            placementId: placementIdParam || "",
            propertySlug: propertySlugParam || catalogRecord?.destinationSlug || "",
            date: dateParam || "",
            adults: Number(adultsParam) || 2,
            isTest: false,
          })),
  );

  const alreadyConsumedByAnotherClick = Boolean(
    existingRecord &&
      (existingRecord.followedAt ||
        (existingRecord.clickCount || 0) >= 1 ||
        Boolean(existingRecord.isTest) !== Boolean(effectiveIsTest)),
  );

  const shouldMintFreshPerIntentClickId = Boolean(
    !incomingClickId ||
      isDeterministicOfferTemplate ||
      alreadyConsumedByAnotherClick ||
      Boolean(isQaReferralId(incomingClickId)) !== Boolean(effectiveIsTest),
  );

  const effectiveClickId = shouldMintFreshPerIntentClickId
    ? generateOpaqueClickId({ isTest: effectiveIsTest })
    : incomingClickId;

  let updated =
    !shouldMintFreshPerIntentClickId && existingRecord
      ? recordOutboundClickFollow(effectiveClickId, {
          userAgent,
          referer,
          isTest: effectiveIsTest,
          placementId: placementIdParam,
          propertySlug: propertySlugParam,
        })
      : null;

  if (!updated && catalogRecord && catalogRecord.bookingUrl) {
    let resolvedDestinationUrl = catalogRecord.bookingUrl;
    const effectiveOptionCode =
      optionParam ||
      catalogRecord.productOptions?.[0]?.optionCode ||
      "DEFAULT";
    const effectiveAdults =
      adultsParam && Number.isFinite(Number(adultsParam))
        ? Math.max(1, Math.round(Number(adultsParam)))
        : 2;

    if (catalogRecord.primaryProvider === "viator") {
      resolvedDestinationUrl = appendViatorAttribution(resolvedDestinationUrl, {
        preserveExistingCampaign: false,
        campaign: effectiveClickId,
      });
    } else if (catalogRecord.primaryProvider === "fareharbor") {
      const asnRefTag = `${placementIdParam || propertySlugParam || catalogRecord.destinationSlug}-${effectiveClickId}`.slice(
        0,
        120,
      );
      resolvedDestinationUrl = buildFareHarborDatePreselectedUrl(
        resolvedDestinationUrl,
        dateParam,
        null,
        asnRefTag,
      );
    }

    const destObj = new URL(resolvedDestinationUrl);
    if (dateParam) {
      destObj.searchParams.set("date", dateParam);
      destObj.searchParams.set("dcc_date", dateParam);
    }
    destObj.searchParams.set("adults", String(effectiveAdults));
    destObj.searchParams.set("dcc_adults", String(effectiveAdults));
    if (effectiveOptionCode) {
      destObj.searchParams.set("optionCode", effectiveOptionCode);
      destObj.searchParams.set("dcc_option_code", effectiveOptionCode);
    }
    if (departureTimeParam) {
      destObj.searchParams.set("departureTime", departureTimeParam);
      destObj.searchParams.set("dcc_departure_time", departureTimeParam);
    }
    if (placementIdParam) {
      destObj.searchParams.set("placementId", placementIdParam);
      destObj.searchParams.set("dcc_placement_id", placementIdParam);
    }

    const provider =
      catalogRecord.primaryProvider === "fareharbor"
        ? "fareharbor"
        : catalogRecord.primaryProvider === "viator"
          ? "viator"
          : catalogRecord.primaryProvider === "gosno"
            ? "rezdy"
            : "direct";

    updated = issueOpaqueClickAttribution({
      clickId: effectiveClickId,
      decisionReceiptId: `rcpt:dcc:click:${catalogRecord.tourId}:${effectiveOptionCode}`,
      recommendedOperatorId:
        catalogRecord.operatorCode || catalogRecord.primaryProvider,
      recommendedOperatorName:
        catalogRecord.operatorName || catalogRecord.primaryProvider,
      evidenceVersion: "dcc_catalog_v2",
      originatingSite: "destinationcommandcenter.com",
      originatingPage: referer || `/tours/${catalogRecord.destinationSlug}`,
      placementId: placementIdParam,
      propertySlug: propertySlugParam || catalogRecord.destinationSlug,
      provider,
      productCode: catalogRecord.providerProductCode,
      productDestinationUrl: destObj.toString(),
      isTest: effectiveIsTest,
      recordStage: "outbound_click",
    });
  } else if (!updated && existingRecord) {
    updated = issueOpaqueClickAttribution({
      clickId: effectiveClickId,
      decisionReceiptId: existingRecord.decisionReceiptId,
      recommendedOperatorId: existingRecord.recommendedOperatorId,
      recommendedOperatorName: existingRecord.recommendedOperatorName,
      recommendedVehicleClassId: existingRecord.recommendedVehicleClassId,
      evidenceVersion: existingRecord.evidenceVersion,
      applicabilityModelVersion: existingRecord.applicabilityModelVersion,
      applicabilityOutcomeHash: existingRecord.applicabilityOutcomeHash,
      originatingSite: existingRecord.originatingSite,
      originatingPage: referer || existingRecord.originatingPage,
      placementId: placementIdParam || existingRecord.placementId,
      propertySlug: propertySlugParam || existingRecord.propertySlug,
      surface: existingRecord.surface,
      tripDetails: existingRecord.tripDetails,
      provider: existingRecord.provider,
      productCode: existingRecord.productCode,
      productDestinationUrl: existingRecord.outboundPartnerUrl,
      isTest: effectiveIsTest,
      recordStage: "outbound_click",
    });
  }

  if (!updated || !updated.outboundPartnerUrl) {
    return NextResponse.json(
      { ok: false, error: "CLICK_ATTRIBUTION_NOT_FOUND", clickId: effectiveClickId },
      { status: 404 },
    );
  }

  // Always enforce the single per-intent referral ID on outbound Viator URLs
  const finalRedirectObj = new URL(updated.outboundPartnerUrl);
  if (normalizeHost(finalRedirectObj.hostname) === "viator.com") {
    finalRedirectObj.searchParams.set("campaign", updated.clickId);
    finalRedirectObj.searchParams.set("click_id", updated.clickId);
    if (dateParam && !finalRedirectObj.searchParams.get("date")) {
      finalRedirectObj.searchParams.set("date", dateParam);
      finalRedirectObj.searchParams.set("dcc_date", dateParam);
    }
    if (adultsParam && !finalRedirectObj.searchParams.get("adults")) {
      finalRedirectObj.searchParams.set("adults", adultsParam);
      finalRedirectObj.searchParams.set("dcc_adults", adultsParam);
    }
    if (optionParam && !finalRedirectObj.searchParams.get("optionCode")) {
      finalRedirectObj.searchParams.set("optionCode", optionParam);
      finalRedirectObj.searchParams.set("dcc_option_code", optionParam);
    }
    if (departureTimeParam && !finalRedirectObj.searchParams.get("departureTime")) {
      finalRedirectObj.searchParams.set("departureTime", departureTimeParam);
      finalRedirectObj.searchParams.set("dcc_departure_time", departureTimeParam);
    }
    if (placementIdParam && !finalRedirectObj.searchParams.get("placementId")) {
      finalRedirectObj.searchParams.set("placementId", placementIdParam);
      finalRedirectObj.searchParams.set("dcc_placement_id", placementIdParam);
    }
  }

  await syncDurableLedgerWithPostgres({ forcePushLocal: true });
  return NextResponse.redirect(finalRedirectObj.toString(), {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      "X-DCC-Referral-Id": updated.clickId,
      "X-DCC-Click-Id": updated.clickId,
    },
  });
}
