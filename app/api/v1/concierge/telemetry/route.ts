import { NextRequest, NextResponse } from "next/server";
import {
  getFunnelMetricsReport,
  listAttributionRecordsForPlacement,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { getDurableCatalogSummaryReport } from "@/lib/dcc/catalog/durableCatalogStore";
import { getWidgetPlacementReport } from "@/lib/dcc/catalog/widgetPlacements";
import { HOTEL_CONCIERGE_CONFIGS } from "@/lib/dcc/catalog/hotelConfigs";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await syncDurableLedgerWithPostgres();

  const sp = request.nextUrl.searchParams;
  const requestedPlacementId =
    sp.get("placementId")?.trim() ||
    sp.get("placement_id")?.trim() ||
    sp.get("placement")?.trim() ||
    "nola-hotel-monteleone-demo-pilot";
  const requestedPropertySlug =
    sp.get("property")?.trim() ||
    sp.get("propertySlug")?.trim() ||
    "hotel-monteleone-nola";

  const [overallFunnel, placementFunnel, catalogSummary] = await Promise.all([
    Promise.resolve(getFunnelMetricsReport()),
    Promise.resolve(
      getFunnelMetricsReport({
        placementId: requestedPlacementId,
        propertySlug: requestedPropertySlug,
      }),
    ),
    getDurableCatalogSummaryReport(),
  ]);

  const placementRecords = listAttributionRecordsForPlacement({
    placementId: requestedPlacementId,
    propertySlug: requestedPropertySlug,
    limit: 50,
  });

  const hotelConfig = HOTEL_CONCIERGE_CONFIGS[requestedPropertySlug] || null;
  const placementReport = catalogSummary.widgetPlacements ?? getWidgetPlacementReport();

  return NextResponse.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      pilotPlacement: {
        placementId: requestedPlacementId,
        propertySlug: requestedPropertySlug,
        propertyName:
          hotelConfig?.propertyName ||
          "Hotel Monteleone — French Quarter (Demo Preset)",
        isDemoPreset: hotelConfig?.isDemoPreset ?? true,
        demoStatusLabel:
          hotelConfig?.demoStatusLabel ||
          "DEMO PRESET — Pending Hotel Approval",
        approvalStatus: "unverified_demo_preset_pending_hotel_approval",
        standaloneGuestLink:
          "https://www.destinationcommandcenter.com/embed/concierge?destination=new-orleans&property=hotel-monteleone-nola&surface=hotel_concierge&pickupMode=hotel_pickup&category=Swamp+%26+Bayou&placementId=nola-hotel-monteleone-demo-pilot",
        embedLoaderUrl:
          "https://www.destinationcommandcenter.com/embed/dcc-concierge-widget.js",
        funnelByTrafficClass: {
          production: {
            guestVisits: placementFunnel.production.guestVisits,
            recommendationsIssued: placementFunnel.production.recommendationsIssued,
            recommendationOnlyRecords:
              placementFunnel.production.recommendationOnlyRecords,
            outboundClicks: placementFunnel.production.actualOutboundClicks,
            providerConfirmedBookings:
              placementFunnel.production.confirmedPaidBookings,
            grossConfirmedRevenueUsd:
              placementFunnel.production.grossConfirmedRevenueUsd,
            estimatedUnsettledCommissionUsd:
              placementFunnel.production.estimatedUnsettledCommissionUsd,
            settledCommissionUsd:
              placementFunnel.production.settledReconciledCommissionUsd,
            reversedCommissionUsd:
              placementFunnel.production.reversedCommissionUsd,
          },
          test: {
            guestVisits: placementFunnel.test.guestVisits,
            recommendationsIssued: placementFunnel.test.recommendationsIssued,
            recommendationOnlyRecords:
              placementFunnel.test.recommendationOnlyRecords,
            outboundClicks: placementFunnel.test.actualOutboundClicks,
            providerConfirmedBookings:
              placementFunnel.test.confirmedPaidBookings,
            grossConfirmedRevenueUsd:
              placementFunnel.test.grossConfirmedRevenueUsd,
            estimatedUnsettledCommissionUsd:
              placementFunnel.test.estimatedUnsettledCommissionUsd,
            settledCommissionUsd:
              placementFunnel.test.settledReconciledCommissionUsd,
            reversedCommissionUsd: placementFunnel.test.reversedCommissionUsd,
          },
        },
        providerAttributionMechanism: {
          fareharbor: {
            bookingUrlPattern:
              "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/availability/<slotPk>/book/?asn=aktourcenter&ref=nola-hotel-monteleone-demo-pilot-clk_<24hex>&custom-tracking=nola-hotel-monteleone-demo-pilot-clk_<24hex>&full-items=yes",
            hotelPickupVerificationField:
              "customFieldInstance12258400 = number:22056428 (Hotel Monteleone, 214 Royal St)",
            supportedWebhookEndpoint:
              "POST https://www.destinationcommandcenter.com/api/v1/commerce/click-attribution (action: 'reconcile_webhook')",
            supportedCsvBatchEndpoint:
              "POST https://www.destinationcommandcenter.com/api/v1/commerce/click-attribution (action: 'reconcile_csv')",
            providerReport:
              "FareHarbor Dashboard -> Reports -> Bookings -> Affiliate / ASN ('aktourcenter') export by Reference ('ref' / 'custom-tracking' containing nola-hotel-monteleone-demo-pilot-clk_<24hex>)",
          },
          viator: {
            bookingUrlPattern:
              "https://www.viator.com/tours/...?pid=P00296995&mcid=42383&medium=api&campaign=hotel_concierge-nola-hotel-monteleone-demo-pilot-<optionCode>-clk_<24hex>",
            supportedWebhookAndBatchEndpoint:
              "POST https://www.destinationcommandcenter.com/api/v1/commerce/click-attribution (action: 'reconcile_webhook' | 'reconcile_csv')",
            providerReport:
              "Viator Partner API v2 /bookings/modified-since & Affiliate Campaign Booking Report ('campaign' containing nola-hotel-monteleone-demo-pilot-...-clk_<24hex>)",
          },
        },
        recentLedgerActivity: {
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
              provider: r.provider,
              productCode: r.productCode,
              outboundPartnerUrl: r.outboundPartnerUrl,
              reconciliationState: r.reconciliationState,
              reconciledOutcomes: r.reconciledOutcomes,
              createdAt: r.createdAt,
            })),
        },
      },
      overallFunnel: {
        production: {
          guestVisits: overallFunnel.production.guestVisits,
          recommendationsIssued: overallFunnel.production.recommendationsIssued,
          recommendationOnlyRecords:
            overallFunnel.production.recommendationOnlyRecords,
          outboundClicks: overallFunnel.production.actualOutboundClicks,
          providerConfirmedBookings:
            overallFunnel.production.confirmedPaidBookings,
          grossConfirmedRevenueUsd:
            overallFunnel.production.grossConfirmedRevenueUsd,
          estimatedUnsettledCommissionUsd:
            overallFunnel.production.estimatedUnsettledCommissionUsd,
          settledCommissionUsd:
            overallFunnel.production.settledReconciledCommissionUsd,
          reversedCommissionUsd: overallFunnel.production.reversedCommissionUsd,
        },
        test: {
          guestVisits: overallFunnel.test.guestVisits,
          recommendationsIssued: overallFunnel.test.recommendationsIssued,
          recommendationOnlyRecords:
            overallFunnel.test.recommendationOnlyRecords,
          outboundClicks: overallFunnel.test.actualOutboundClicks,
          providerConfirmedBookings: overallFunnel.test.confirmedPaidBookings,
          grossConfirmedRevenueUsd:
            overallFunnel.test.grossConfirmedRevenueUsd,
          estimatedUnsettledCommissionUsd:
            overallFunnel.test.estimatedUnsettledCommissionUsd,
          settledCommissionUsd:
            overallFunnel.test.settledReconciledCommissionUsd,
          reversedCommissionUsd: overallFunnel.test.reversedCommissionUsd,
        },
      },
      widgetPlacements: {
        firstPartyInstallationsCount:
          placementReport.firstPartyInstallationsCount,
        observedExternalEmbedsCount:
          placementReport.observedExternalEmbedsCount,
        approvedExternalPartnerPlacementsCount:
          placementReport.approvedExternalPartnerPlacementsCount,
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
