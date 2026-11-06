import { NextRequest, NextResponse } from "next/server";
import {
  authenticateCommerceAdminRequest,
  getFunnelMetricsReport,
  listAttributionRecordsForPlacement,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { getDurableCatalogSummaryReport } from "@/lib/dcc/catalog/durableCatalogStore";
import { getWidgetPlacementReport } from "@/lib/dcc/catalog/widgetPlacements";
import { HOTEL_CONCIERGE_CONFIGS } from "@/lib/dcc/catalog/hotelConfigs";
import {
  readDurableLedgerState,
  runDurableLedgerTransaction,
  syncDurableLedgerWithPostgres,
} from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

function formatPlacementFunnelSummary(funnel: ReturnType<typeof getFunnelMetricsReport>) {
  return {
    production: {
      planOpens: funnel.production.planOpens,
      guestVisits: funnel.production.guestVisits,
      guideVisits: funnel.production.guideVisits,
      storefrontVisits: funnel.production.storefrontVisits,
      recommendationsIssued: funnel.production.recommendationsIssued,
      recommendationOnlyRecords: funnel.production.recommendationOnlyRecords,
      outboundClicks: funnel.production.actualOutboundClicks,
      viatorClicks: funnel.production.viatorClicks,
      providerConfirmedBookings: funnel.production.confirmedPaidBookings,
      paidCommissionsCount: funnel.production.paidCommissionsCount,
      paidCommissionUsd: funnel.production.settledReconciledCommissionUsd,
      duplicateDeliveriesIgnored: funnel.production.duplicateDeliveriesIgnored,
      grossConfirmedRevenueUsd: funnel.production.grossConfirmedRevenueUsd,
      estimatedUnsettledCommissionUsd: funnel.production.estimatedUnsettledCommissionUsd,
      settledCommissionUsd: funnel.production.settledReconciledCommissionUsd,
      reversedCommissionUsd: funnel.production.reversedCommissionUsd,
    },
    test: {
      planOpens: funnel.test.planOpens,
      guestVisits: funnel.test.guestVisits,
      guideVisits: funnel.test.guideVisits,
      storefrontVisits: funnel.test.storefrontVisits,
      recommendationsIssued: funnel.test.recommendationsIssued,
      recommendationOnlyRecords: funnel.test.recommendationOnlyRecords,
      outboundClicks: funnel.test.actualOutboundClicks,
      viatorClicks: funnel.test.viatorClicks,
      providerConfirmedBookings: funnel.test.confirmedPaidBookings,
      paidCommissionsCount: funnel.test.paidCommissionsCount,
      paidCommissionUsd: funnel.test.settledReconciledCommissionUsd,
      duplicateDeliveriesIgnored: funnel.test.duplicateDeliveriesIgnored,
      grossConfirmedRevenueUsd: funnel.test.grossConfirmedRevenueUsd,
      estimatedUnsettledCommissionUsd: funnel.test.estimatedUnsettledCommissionUsd,
      settledCommissionUsd: funnel.test.settledReconciledCommissionUsd,
      reversedCommissionUsd: funnel.test.reversedCommissionUsd,
    },
  };
}

export async function GET(request: NextRequest) {
  let adminActor: string | null = null;
  try {
    const auth = authenticateCommerceAdminRequest(request);
    if (auth.authorized) {
      adminActor = auth.actor;
    }
  } catch {
    adminActor = null;
  }
  const isAuthenticatedAdmin = Boolean(adminActor);

  const ledgerState = await syncDurableLedgerWithPostgres();

  const sp = request.nextUrl.searchParams;
  const requestedPlacementId =
    sp.get("placementId")?.trim() ||
    sp.get("placement_id")?.trim() ||
    sp.get("placement")?.trim() ||
    "nola-hotel-monteleone-demo-pilot";
  const explicitPropertyParam =
    sp.get("property")?.trim() ||
    sp.get("propertySlug")?.trim() ||
    null;
  const requestedPropertySlug =
    explicitPropertyParam ||
    (requestedPlacementId === "nola-hotel-monteleone-demo-pilot"
      ? "hotel-monteleone-nola"
      : null);

  const [
    overallFunnel,
    placementFunnel,
    wnoSwampFunnel,
    wnoTransFunnel,
    wttsTransFunnel,
    dccSwampFunnel,
    winterPlannerFunnel,
    catalogSummary,
  ] = await Promise.all([
    Promise.resolve(getFunnelMetricsReport()),
    Promise.resolve(
      getFunnelMetricsReport({
        placementId: requestedPlacementId,
        propertySlug: explicitPropertyParam,
      }),
    ),
    Promise.resolve(getFunnelMetricsReport({ placementId: "fp-wno-swamp-tours" })),
    Promise.resolve(getFunnelMetricsReport({ placementId: "fp-wno-swamp-transportation" })),
    Promise.resolve(getFunnelMetricsReport({ placementId: "fp-wtts-transportation" })),
    Promise.resolve(getFunnelMetricsReport({ placementId: "fp-dcc-nola-swamp-tours" })),
    Promise.resolve(getFunnelMetricsReport({ placementId: "fp-cp-winter-excursion-planner" })),
    getDurableCatalogSummaryReport(),
  ]);

  const placementRecords = listAttributionRecordsForPlacement({
    placementId: requestedPlacementId,
    propertySlug: explicitPropertyParam,
    limit: 50,
  });

  const hotelConfig = requestedPropertySlug
    ? HOTEL_CONCIERGE_CONFIGS[requestedPropertySlug] || null
    : null;
  const placementApproval =
    ledgerState.placementApprovalsById?.[requestedPlacementId] || null;
  const isApprovedLive = placementApproval?.status === "verified_partner_live";
  const placementReport = catalogSummary.widgetPlacements ?? getWidgetPlacementReport();

  const recentLedgerActivity = isAuthenticatedAdmin
    ? {
        accessLevel: "admin_full" as const,
        redactedForPublic: false,
        visitorSessionsCount: placementRecords.visitors.length,
        attributionRecordsCount: placementRecords.attributionRecords.length,
        visitors: placementRecords.visitors.slice(0, 15),
        attributionRecords: placementRecords.attributionRecords
          .slice(0, 15)
          .map((r) => ({
            clickId: r.clickId,
            placementId: r.placementId,
            propertySlug: r.propertySlug,
            surface: r.surface,
            trafficClass: r.trafficClass,
            isTest: r.isTest,
            recordStage: r.recordStage,
            followedAt: r.followedAt,
            clickCount: r.clickCount,
            duplicateDeliveryCount: r.duplicateDeliveryCount || 0,
            provider: r.provider,
            productCode: r.productCode,
            outboundPartnerUrl: r.outboundPartnerUrl,
            reconciliationState: r.reconciliationState,
            reconciledOutcomes: r.reconciledOutcomes,
            createdAt: r.createdAt,
          })),
      }
    : {
        accessLevel: "public_aggregate_only" as const,
        redactedForPublic: true,
        visitorSessionsCount: placementRecords.visitors.length,
        attributionRecordsCount: placementRecords.attributionRecords.length,
        note: "Visitor records, click IDs, outbound URLs, and booking details are restricted behind commerce admin authentication.",
      };

  return NextResponse.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      accessLevel: isAuthenticatedAdmin ? "admin_full" : "public_aggregate_only",
      authenticatedAdmin: isAuthenticatedAdmin,
      ...(isAuthenticatedAdmin ? { authenticatedActorId: adminActor } : {}),
      pilotPlacement: {
        placementId: requestedPlacementId,
        propertySlug: requestedPropertySlug,
        propertyName: isApprovedLive
          ? (
              hotelConfig?.propertyName ||
              "Hotel Monteleone — French Quarter"
            ).replace(/\s*\(Demo Preset\)/i, "")
          : hotelConfig?.propertyName ||
            (requestedPlacementId.startsWith("fp-")
              ? `First-Party Placement (${requestedPlacementId})`
              : "Hotel Monteleone — French Quarter (Demo Preset)"),
        isDemoPreset: requestedPlacementId.startsWith("fp-")
          ? false
          : !isApprovedLive && (hotelConfig?.isDemoPreset ?? true),
        demoStatusLabel: requestedPlacementId.startsWith("fp-")
          ? "FIRST-PARTY LIVE PLACEMENT"
          : isApprovedLive
            ? "APPROVED PARTNER PLACEMENT — Live"
            : hotelConfig?.demoStatusLabel ||
              "DEMO PRESET — Pending Hotel Approval",
        approvalStatus: requestedPlacementId.startsWith("fp-")
          ? "live_first_party"
          : isApprovedLive
            ? "verified_partner_live"
            : "unverified_demo_preset_pending_hotel_approval",
        approvedAt: placementApproval?.approvedAt || null,
        approvedBy: placementApproval?.approvedBy || null,
        standaloneGuestLink:
          "https://www.destinationcommandcenter.com/embed/concierge?destination=new-orleans&property=hotel-monteleone-nola&surface=hotel_concierge&pickupMode=hotel_pickup&category=Swamp+%26+Bayou&placementId=nola-hotel-monteleone-demo-pilot",
        embedLoaderUrl:
          "https://www.destinationcommandcenter.com/embed/dcc-concierge-widget.js",
        activationEndpoint:
          "POST https://www.destinationcommandcenter.com/api/v1/concierge/telemetry (action: 'activate_placement')",
        funnelByTrafficClass: formatPlacementFunnelSummary(placementFunnel),
        ...(isAuthenticatedAdmin
          ? {
              providerAttributionMechanism: {
                viator: {
                  payoutAccount: {
                    pid: "P00306962",
                    mcid: "42383",
                    accessTier: "full_access",
                    activeCommissionRatePercent: 8.0,
                    verifiedPayableOffers: [
                      {
                        tourId: "dcc:tour:viator:15200P6",
                        productCode: "15200P6",
                        title: "New Orleans Swamp Tour Boat Adventure with Transportation",
                        operatorName: "Louisiana Tour Company",
                        verifiedHotelMonteleonePickupRef:
                          "LOC-6eKJ+or5y8o99Qw0C8xWyGAjWJk3qp08H7OnT0MLhOs= (214 Royal St)",
                        retailPrice2AdultsUsd: 120.0,
                        partnerNetPrice2AdultsUsd: 110.4,
                        verifiedCommission2AdultsUsd: 9.6,
                      },
                      {
                        tourId: "dcc:tour:viator:6953SWAMPTRANS",
                        productCode: "6953SWAMPTRANS",
                        title: "New Orleans Swamp and Bayou Boat Tour with Transportation",
                        operatorName: "Cajun Encounters Tour Co.",
                        retailPrice2AdultsUsd: 151.04,
                        partnerNetPrice2AdultsUsd: 138.96,
                        verifiedCommission2AdultsUsd: 12.08,
                      },
                    ],
                  },
                  bookingUrlPattern:
                    "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Boat-Adventure-With-Pickup/d675-15200P6?mcid=42383&pid=P00306962&medium=api&api_version=2.0&campaign=<surface>-<placementId>-<optionCode>-clk_<24hex>",
                  supportedWebhookAndBatchEndpoint:
                    "POST https://www.destinationcommandcenter.com/api/v1/commerce/click-attribution (action: 'reconcile_webhook' | 'reconcile_csv')",
                  providerReport:
                    "Viator Partner API v2 /bookings/modified-since & Affiliate Campaign Booking Report ('campaign' containing <placementId>-...-clk_<24hex>)",
                },
                fareharbor: {
                  jeanLafitte763318AsnStatus:
                    "pending_operator_asn_activation (is_affiliate_rules_applied: false on aktourcenter & welcometoneworleanstours)",
                  bookingUrlPattern:
                    "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/availability/<slotPk>/book/?asn=aktourcenter&ref=<placementId>-clk_<24hex>&custom-tracking=<placementId>-clk_<24hex>&full-items=yes",
                  onlineBookingReferencesField:
                    "booking.online_booking_references: ['<placementId>-clk_<24hex>', 'asn:aktourcenter']",
                  hotelPickupVerificationField:
                    "customFieldInstance12258400 = number:22056428 (Hotel Monteleone, 214 Royal St)",
                  supportedWebhookEndpoint:
                    "POST https://www.destinationcommandcenter.com/api/v1/commerce/click-attribution (action: 'reconcile_webhook')",
                  supportedCsvBatchEndpoint:
                    "POST https://www.destinationcommandcenter.com/api/v1/commerce/click-attribution (action: 'reconcile_csv')",
                  providerReport:
                    "FareHarbor Dashboard -> Reports -> Bookings -> Affiliate / ASN ('aktourcenter' or 'welcometoneworleanstours') export by online_booking_references / Reference ('ref' / 'custom-tracking' containing <placementId>-clk_<24hex>)",
                },
              },
            }
          : {}),
        recentLedgerActivity,
      },
      firstPartySalesTestPlacements: {
        "fp-wno-swamp-tours": {
          liveUrl: "https://www.welcometoneworleanstours.com/swamp-tours",
          surface: "welcometoneworleanstours",
          offerTourId: "dcc:tour:viator:15200P6",
          secondaryPayableOfferTourId: "dcc:tour:viator:6953SWAMPTRANS",
          pendingDirectFareHarborOfferTourId: "dcc:tour:fh:jeanlafitteswamptour:763318",
          funnelByTrafficClass: formatPlacementFunnelSummary(wnoSwampFunnel),
        },
        "fp-wno-swamp-transportation": {
          liveUrl: "https://www.welcometoneworleanstours.com/guides/best-swamp-tour-with-transportation",
          surface: "welcometoneworleanstours",
          offerTourId: "dcc:tour:viator:15200P6",
          secondaryPayableOfferTourId: "dcc:tour:viator:6953SWAMPTRANS",
          pendingDirectFareHarborOfferTourId: "dcc:tour:fh:jeanlafitteswamptour:763318",
          funnelByTrafficClass: formatPlacementFunnelSummary(wnoTransFunnel),
        },
        "fp-wtts-transportation": {
          liveUrl: "https://welcometotheswamp.com/transportation",
          surface: "welcometotheswamp",
          offerTourId: "dcc:tour:viator:15200P6",
          secondaryPayableOfferTourId: "dcc:tour:viator:6953SWAMPTRANS",
          pendingDirectFareHarborOfferTourId: "dcc:tour:fh:jeanlafitteswamptour:763318",
          funnelByTrafficClass: formatPlacementFunnelSummary(wttsTransFunnel),
        },
        "fp-dcc-nola-swamp-tours": {
          liveUrl: "https://www.destinationcommandcenter.com/new-orleans/swamp-tours",
          surface: "dcc",
          offerTourId: "dcc:tour:viator:15200P6",
          secondaryPayableOfferTourId: "dcc:tour:viator:6953SWAMPTRANS",
          pendingDirectFareHarborOfferTourId: "dcc:tour:fh:jeanlafitteswamptour:763318",
          funnelByTrafficClass: formatPlacementFunnelSummary(dccSwampFunnel),
        },
        "fp-cp-winter-excursion-planner": {
          liveUrl: "https://cruisepromenade.com/p/INDY-2027-01-24",
          dccPlannerUrl: "https://www.destinationcommandcenter.com/cruises/winter-excursion-planner?plan=INDY-2027-01-24",
          surface: "cruisepromenade",
          shareablePlanCode: "INDY-2027-01-24",
          sailingId: "ID07MIA-1982128855",
          sailDate: "2027-01-24",
          savedOfferTourIds: ["dcc:tour:viator:254526P1", "dcc:tour:viator:7452P2"],
          funnelByTrafficClass: formatPlacementFunnelSummary(winterPlannerFunnel),
        },
      },
      overallFunnel: formatPlacementFunnelSummary(overallFunnel),
      widgetPlacements: {
        firstPartyInstallationsCount:
          placementReport.firstPartyInstallationsCount,
        observedExternalEmbedsCount:
          placementReport.observedExternalEmbedsCount,
        approvedExternalPartnerPlacementsCount:
          placementReport.approvedExternalPartnerPlacementsCount +
          Object.values(readDurableLedgerState().placementApprovalsById || {}).filter(
            (p) => p.status === "verified_partner_live",
          ).length,
      },
      catalogCoverage: catalogSummary.destinationCoverageBreakdown,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateCommerceAdminRequest(request);
    await syncDurableLedgerWithPostgres();
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const action =
      typeof body.action === "string"
        ? body.action.trim()
        : "activate_placement";
    if (
      action !== "activate_placement" &&
      action !== "set_placement_status"
    ) {
      return NextResponse.json(
        { ok: false, error: `Unsupported action '${action}'.` },
        { status: 400 },
      );
    }
    const placementId =
      typeof body.placementId === "string" && body.placementId.trim()
        ? body.placementId.trim()
        : "nola-hotel-monteleone-demo-pilot";
    const propertySlug =
      typeof body.propertySlug === "string" && body.propertySlug.trim()
        ? body.propertySlug.trim()
        : "hotel-monteleone-nola";
    const status: "demo_preset" | "verified_partner_live" =
      body.status === "demo_preset" ? "demo_preset" : "verified_partner_live";
    const approvedBy =
      typeof body.approvedBy === "string" && body.approvedBy.trim()
        ? body.approvedBy.trim()
        : auth.actor;
    const approvedDomain =
      typeof body.approvedDomain === "string" && body.approvedDomain.trim()
        ? body.approvedDomain.trim()
        : "hotelmonteleone.com";
    const nowIso = new Date().toISOString();

    const record = runDurableLedgerTransaction((state) => {
      state.placementApprovalsById = state.placementApprovalsById || {};
      const updated = {
        placementId,
        propertySlug,
        status,
        approvedBy: status === "verified_partner_live" ? approvedBy : null,
        approvedDomain:
          status === "verified_partner_live" ? approvedDomain : null,
        approvedAt: status === "verified_partner_live" ? nowIso : null,
        updatedAt: nowIso,
      };
      state.placementApprovalsById[placementId] = updated;
      return updated;
    });

    await syncDurableLedgerWithPostgres({ forcePushLocal: true });

    return NextResponse.json(
      {
        ok: true,
        placementApproval: record,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const statusCode =
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 401;
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized placement status update.",
      },
      { status: statusCode, headers: { "Cache-Control": "no-store" } },
    );
  }
}

