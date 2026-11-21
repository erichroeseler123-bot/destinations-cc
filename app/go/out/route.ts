import { NextResponse } from "next/server";
import { resolveOrGenerateW3cTraceparent } from "@/lib/dcc/machine";
import {
  buildProviderAffiliateHandoffUrl,
  createCommercialHandoff,
  generateOpaqueClickId,
  generateOpaqueHandoffId,
  getSharedHandoffLedgerSummary,
  type CommercialProvider,
} from "@/lib/dcc/commerce";
import { getDurableTourByIdOrAlias } from "@/lib/dcc/catalog/durableCatalogStore";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";
import { bridgeLegacyEventToV2Collector } from "@/lib/dcc/analytics/collector";
import { scheduleServerlessAfterTask } from "@/lib/dcc/analytics/serverlessLifecycle";

function readCookieFromHeader(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]).trim() : undefined;
}

export const dynamic = "force-dynamic";

const APPROVED_OUTBOUND_HOSTS = new Set([
  "www.viator.com",
  "viator.com",
  "www.getyourguide.com",
  "getyourguide.com",
  "fareharbor.com",
  "www.fareharbor.com",
  "www.pacwhale.com",
  "pacwhale.com",
  "www.pacificwhale.org",
  "pacificwhale.org",
  "www.alaskataxi.com",
  "alaskataxi.com",
  "www.alaskacruisetransfer.com",
  "alaskacruisetransfer.com",
  "www.allenmarine.com",
  "allenmarine.com",
  "www.juneautours.com",
  "juneautours.com",
  "juneauwhalewatch.rezgo.com",
  "juneautours.rezgo.com",
  "coastalhelicopters.com",
  "www.coastalhelicopters.com",
  "juneauflightdeck.com",
  "www.juneauflightdeck.com",
  "lastfrontiershoreexcursions.com",
  "www.lastfrontiershoreexcursions.com",
  "welcometoneworleanstours.com",
  "www.welcometoneworleanstours.com",
  "welcometotheswamp.com",
  "www.welcometotheswamp.com",
  "gosno.co",
  "www.gosno.co",
  "partyatredrocks.com",
  "www.partyatredrocks.com",
  "originalwisconsinducks.com",
  "www.originalwisconsinducks.com",
  "dellsboats.com",
  "www.dellsboats.com",
  "jetboatadv.com",
  "www.jetboatadv.com",
  "dellsghostboat.com",
  "www.dellsghostboat.com",
  "wisdells.com",
  "www.wisdells.com",
]);

function extractProductCodeFromOutboundUrl(parsed: URL): string {
  const host = parsed.hostname.toLowerCase();
  if (host.includes("viator.com")) {
    const m = parsed.pathname.match(/\/tours\/[^/]+\/[^/]+\/d\d+-([A-Za-z0-9_]+)/i);
    if (m?.[1]) return m[1];
  }
  if (host.includes("getyourguide.com")) {
    const m = /(?:[-/]t|tour_id=)(\d+)(?:[/&?]|$)/i.exec(parsed.toString());
    if (m?.[1]) return `t${m[1]}`;
  }
  return "";
}

export async function GET(request: Request) {
  const traceparent = resolveOrGenerateW3cTraceparent(request);
  const url = new URL(request.url);
  const sp = url.searchParams;

  const isJsonMode = sp.get("mode") === "json";
  const isInspectMode = sp.get("inspect") === "1";
  const skipV2Analytics = sp.get("skipV2Analytics") === "1";
  const isTest =
    sp.get("qa") === "1" ||
    sp.get("isTest") === "1" ||
    sp.get("isTest") === "true" ||
    request.headers.get("x-qa-test") === "1";

  const rawTarget =
    sp.get("u")?.trim() ||
    sp.get("target")?.trim() ||
    sp.get("url")?.trim() ||
    "";
  const productCode =
    sp.get("product")?.trim() ||
    sp.get("offer")?.trim() ||
    sp.get("productCode")?.trim() ||
    sp.get("t")?.replace(/^viator:/i, "").trim() ||
    "";
  const optionCode =
    sp.get("option")?.trim() ||
    sp.get("optionCode")?.trim() ||
    null;
  const departureTime =
    sp.get("departureTime")?.trim() ||
    sp.get("time")?.trim() ||
    null;
  const portSlug =
    sp.get("port")?.trim() ||
    sp.get("property")?.trim() ||
    null;
  const surface =
    sp.get("surface")?.trim() ||
    sp.get("s")?.trim() ||
    "dcc_port_day_catalog";

  const explicitOrigin =
    sp.get("originatingSite")?.trim() ||
    sp.get("source_site")?.trim() ||
    sp.get("site")?.trim() ||
    sp.get("origin")?.trim() ||
    "";
  const corridor = sp.get("corridor")?.trim() || null;
  const surfaceLower = surface.toLowerCase();
  const isCruisePromenadeOrigin =
    explicitOrigin.toLowerCase().includes("cruisepromenade") ||
    surfaceLower.includes("cruisepromenade") ||
    surfaceLower.startsWith("cp_");

  const resolvedOriginatingSite =
    explicitOrigin ||
    (isCruisePromenadeOrigin
      ? "cruisepromenade.com"
      : request.headers.get("referer") ||
        url.hostname ||
        "destinationcommandcenter.com");

  const defaultTagPrefix = isCruisePromenadeOrigin ? "cp_port_day" : "dcc_port_day";
  const trackingTag =
    sp.get("trackingTag")?.trim() ||
    sp.get("c")?.trim() ||
    (productCode
      ? `${defaultTagPrefix}_${portSlug || "port"}_${productCode}${optionCode ? `_${optionCode}` : ""}`
      : `${defaultTagPrefix}_handoff`);

  if (!rawTarget && !productCode) {
    return NextResponse.json(
      { ok: false, error: "MISSING_TARGET_URL_OR_PRODUCT" },
      { status: 400 },
    );
  }

  // Fast pre-redirect validation: only hit `dcc_tour_catalog` before redirecting when `rawTarget`
  // is missing, when inspecting JSON metadata, or if a non-allowlisted host needs catalog verification.
  let preliminaryTarget: URL | null = null;
  if (rawTarget) {
    try {
      preliminaryTarget = new URL(rawTarget);
    } catch {
      return NextResponse.json(
        { ok: false, error: "INVALID_TARGET_URL" },
        { status: 400 },
      );
    }
  }

  const needsPreRedirectCatalogLookup =
    !preliminaryTarget ||
    !APPROVED_OUTBOUND_HOSTS.has(preliminaryTarget.hostname.toLowerCase()) ||
    isJsonMode ||
    isInspectMode;

  let catalogTour: Awaited<ReturnType<typeof getDurableTourByIdOrAlias>> = null;
  if (productCode && needsPreRedirectCatalogLookup) {
    try {
      catalogTour = await getDurableTourByIdOrAlias(productCode, {
        projection: "handoff_minimal",
      });
    } catch {
      catalogTour = null;
    }
  }

  const resolvedTargetUrl = rawTarget || catalogTour?.bookingUrl || "";
  if (!resolvedTargetUrl) {
    const acceptHeader = request.headers.get("accept") || "";
    const isBrowserNavigation =
      !isJsonMode &&
      !isInspectMode &&
      acceptHeader.includes("text/html") &&
      !acceptHeader.includes("application/json");

    if (isBrowserNavigation) {
      const safeFallbackPath = portSlug
        ? `/ports/${encodeURIComponent(portSlug)}`
        : `/tours?q=${encodeURIComponent(productCode)}`;
      return NextResponse.redirect(new URL(safeFallbackPath, request.url), {
        status: 302,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          traceparent,
          "X-DCC-Handoff-Fallback": "unresolved_destination",
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: "MISSING_TARGET_URL_OR_PRODUCT" },
      { status: 400 },
    );
  }

  let parsedTarget: URL;
  try {
    parsedTarget = preliminaryTarget ?? new URL(resolvedTargetUrl);
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_TARGET_URL" },
      { status: 400 },
    );
  }

  const hostLower = parsedTarget.hostname.toLowerCase();
  const isCatalogHost = (() => {
    if (!catalogTour?.bookingUrl) return false;
    try {
      return new URL(catalogTour.bookingUrl).hostname.toLowerCase() === hostLower;
    } catch {
      return false;
    }
  })();

  if (
    parsedTarget.protocol !== "https:" ||
    (!APPROVED_OUTBOUND_HOSTS.has(hostLower) && !isCatalogHost)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAPPROVED_CHECKOUT_DESTINATION",
        host: parsedTarget.hostname,
      },
      { status: 403 },
    );
  }

  const provider: CommercialProvider = hostLower.includes("viator.com")
    ? "viator"
    : hostLower.includes("getyourguide.com")
      ? "getyourguide"
      : hostLower.includes("fareharbor.com")
        ? "fareharbor"
        : "direct";

  const incomingPid = parsedTarget.searchParams.get("pid");
  const incomingPartnerId = parsedTarget.searchParams.get("partner_id");
  const incomingAsn = parsedTarget.searchParams.get("asn");
  const incomingRefId = parsedTarget.searchParams.get("refid");
  const providerAccount =
    provider === "viator"
      ? incomingPid && incomingPid !== "P00290915"
        ? incomingPid
        : process.env.NEXT_PUBLIC_VIATOR_PID || "P00306962"
      : provider === "getyourguide"
        ? incomingPartnerId ||
          process.env.GETYOURGUIDE_PARTNER_ID ||
          process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID ||
          "F2MMUUH"
        : incomingRefId || incomingAsn || null;

  if (provider === "viator") {
    parsedTarget.searchParams.set("pid", providerAccount || "P00306962");
    parsedTarget.searchParams.set("mcid", process.env.NEXT_PUBLIC_VIATOR_MCID || "42383");
    parsedTarget.searchParams.set("medium", "api");
  } else if (provider === "getyourguide") {
    parsedTarget.searchParams.set("partner_id", providerAccount || "F2MMUUH");
  }

  const originatingPage =
    sp.get("originatingPage")?.trim() ||
    (portSlug ? `/ports/${portSlug}` : null);
  const intendedDate = sp.get("date")?.trim() || null;
  const partySize = Number(sp.get("partySize") || sp.get("adults") || 2) || 2;
  const effectiveProductCode =
    productCode ||
    catalogTour?.providerProductCode ||
    extractProductCodeFromOutboundUrl(parsedTarget) ||
    "dcc-product";

  const requestedHandoffId = sp.get("handoffId")?.trim() || "";
  const preGeneratedHandoffId = /^hndf_[0-9a-f]{24}$/i.test(requestedHandoffId)
    ? requestedHandoffId.toLowerCase()
    : generateOpaqueHandoffId();
  const requestedClickId = sp.get("clickId")?.trim() || "";
  const preGeneratedClickId = /^clk_(?:[0-9a-f]{24}|qa_[0-9a-f]{20})$/i.test(requestedClickId)
    ? requestedClickId.toLowerCase()
    : generateOpaqueClickId({ isTest });

  const cookieHeader = request.headers.get("cookie");
  const browserSeed = readCookieFromHeader(cookieHeader, "_dcc_aid");
  const sessionSeed = readCookieFromHeader(cookieHeader, "_dcc_asid");
  const clonedHeaders = new Headers(request.headers);
  const preparedDestinationUrl = parsedTarget.toString();

  // Browser 302 fast path: build exact affiliate destination synchronously (0ms ledger/DB wait),
  // return 302 immediately, and persist ledger + Analytics v2 in Next.js `after()`!
  if (!isJsonMode && !isInspectMode) {
    const intendedDepartureId = optionCode?.startsWith("dep-") ? optionCode : null;
    const intendedDepartureTime =
      departureTime ||
      (optionCode && /^\d{1,2}:\d{2}$/.test(optionCode) ? optionCode : null);

    const urlBuilt = buildProviderAffiliateHandoffUrl({
      originatingSite: resolvedOriginatingSite,
      provider,
      providerAccount,
      productCode: effectiveProductCode,
      productDestinationUrl: preparedDestinationUrl,
      handoffId: preGeneratedHandoffId,
      clickId: preGeneratedClickId,
      campaign: trackingTag,
      intendedDate,
      intendedDepartureId,
      intendedDepartureTime,
      partySize,
    });

    const outboundUrlObj = new URL(urlBuilt.outboundAffiliateUrl);
    const resolvedCampaign =
      outboundUrlObj.searchParams.get("campaign") ||
      outboundUrlObj.searchParams.get("cmp") ||
      urlBuilt.attributionParameterValue ||
      trackingTag;
    const resolvedClickId =
      outboundUrlObj.searchParams.get("click_id") || urlBuilt.clickId;
    const resolvedAccountHeader =
      outboundUrlObj.searchParams.get("pid") ||
      outboundUrlObj.searchParams.get("partner_id") ||
      urlBuilt.providerAccount ||
      "";

    if (!skipV2Analytics) {
      bridgeLegacyEventToV2Collector({
        rawSite: resolvedOriginatingSite,
        rawEventName: "booking_handoff_initiated",
        eventId: `go_out_${urlBuilt.clickId}`,
        visitorId: browserSeed,
        sessionId: sessionSeed,
        sourcePage: originatingPage || "/go/out",
        targetPath: urlBuilt.outboundAffiliateUrl,
        handoffId: preGeneratedHandoffId,
        travelDateHint: intendedDate,
        isTest,
        metadata: {
          provider,
          productCode:
            effectiveProductCode !== "dcc-product" ? effectiveProductCode : undefined,
          portSlug: portSlug || undefined,
          surface,
          clickId: urlBuilt.clickId,
        },
        headers: clonedHeaders,
      });
    }

    scheduleServerlessAfterTask(async () => {
      try {
        await syncDurableLedgerWithPostgres();
        const resolvedCatalogTour =
          catalogTour ||
          (productCode
            ? await getDurableTourByIdOrAlias(productCode, { projection: "handoff_minimal" }).catch(
                () => null,
              )
            : null);

        await createCommercialHandoff({
          handoffId: preGeneratedHandoffId,
          clickId: urlBuilt.clickId,
          originatingSite: resolvedOriginatingSite,
          targetSite: parsedTarget.hostname,
          provider,
          providerAccount,
          productCode: effectiveProductCode,
          productTitle: resolvedCatalogTour?.title || null,
          productDestinationUrl: preparedDestinationUrl,
          campaign: trackingTag,
          intendedDate,
          intendedOption: optionCode,
          intendedDepartureTime: departureTime,
          partySize,
          callerClientId: isTest ? `qa:${surface}` : `client:${surface}`,
          traceparent,
          metadata: {
            portSlug,
            corridor,
            optionCode,
            surface,
            trackingTag,
            originatingPage,
            ...(isTest ? { isQaTraffic: true } : {}),
          },
        });

        await syncDurableLedgerWithPostgres({ forcePushLocal: true });
      } catch {
        // Non-blocking commercial ledger persistence; Analytics v2 milestone is scheduled independently above.
      }
    });

    return NextResponse.redirect(urlBuilt.outboundAffiliateUrl, {
      status: 302,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        traceparent,
        "X-DCC-Handoff-Id": preGeneratedHandoffId,
        "X-DCC-Click-Id": resolvedClickId,
        "X-DCC-Originating-Site": resolvedOriginatingSite,
        "X-DCC-Provider": provider,
        "X-DCC-Provider-Account": resolvedAccountHeader,
        "X-DCC-Attribution-Campaign": resolvedCampaign,
      },
    });
  }

  // JSON / Inspect mode: synchronous ledger creation + summary
  await syncDurableLedgerWithPostgres();
  const handoff = await createCommercialHandoff({
    handoffId: preGeneratedHandoffId,
    clickId: preGeneratedClickId,
    originatingSite: resolvedOriginatingSite,
    targetSite: parsedTarget.hostname,
    provider,
    providerAccount,
    productCode: effectiveProductCode,
    productTitle: catalogTour?.title || null,
    productDestinationUrl: preparedDestinationUrl,
    campaign: trackingTag,
    intendedDate,
    intendedOption: optionCode,
    intendedDepartureTime: departureTime,
    partySize,
    callerClientId: isTest ? `qa:${surface}` : `client:${surface}`,
    traceparent,
    metadata: {
      portSlug,
      corridor,
      optionCode,
      surface,
      trackingTag,
      originatingPage,
      ...(isTest ? { isQaTraffic: true } : {}),
    },
  });

  await syncDurableLedgerWithPostgres({ forcePushLocal: true });

  if (!isInspectMode && !skipV2Analytics) {
    bridgeLegacyEventToV2Collector({
      rawSite: resolvedOriginatingSite,
      rawEventName: "booking_handoff_initiated",
      eventId: `go_out_${handoff.clickId}`,
      visitorId: browserSeed,
      sessionId: sessionSeed,
      sourcePage: originatingPage || "/go/out",
      targetPath: handoff.outboundAffiliateUrl,
      handoffId: handoff.handoffId,
      travelDateHint: intendedDate,
      isTest,
      metadata: {
        provider: handoff.provider,
        productCode:
          effectiveProductCode !== "dcc-product" ? effectiveProductCode : undefined,
        portSlug: portSlug || undefined,
        surface,
        clickId: handoff.clickId,
      },
      headers: clonedHeaders,
    });
  }

  const outboundUrlObj = new URL(handoff.outboundAffiliateUrl);
  const resolvedCampaign =
    outboundUrlObj.searchParams.get("campaign") ||
    outboundUrlObj.searchParams.get("cmp") ||
    handoff.attributionParameterValue ||
    trackingTag;
  const resolvedClickId =
    outboundUrlObj.searchParams.get("click_id") || handoff.clickId;
  const resolvedPid =
    outboundUrlObj.searchParams.get("pid") ||
    outboundUrlObj.searchParams.get("partner_id") ||
    handoff.providerAccount ||
    "";

  const ledgerSummary = await getSharedHandoffLedgerSummary({
    originatingSite: handoff.originatingSite,
    portSlug,
  });
  return NextResponse.json(
    {
      ok: true,
      handoff: {
        ...handoff,
        resolvedOutboundCampaign: resolvedCampaign,
        resolvedOutboundClickId: resolvedClickId,
        resolvedProviderAccount: resolvedPid,
        portSlug,
        surface,
        originatingPage,
      },
      ledgerSummary,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        traceparent,
        "X-DCC-Handoff-Id": handoff.handoffId,
        "X-DCC-Click-Id": handoff.clickId,
        "X-DCC-Originating-Site": handoff.originatingSite,
        "X-DCC-Provider": handoff.provider,
        "X-DCC-Provider-Account": handoff.providerAccount,
        "X-DCC-Attribution-Campaign": resolvedCampaign,
      },
    },
  );
}
