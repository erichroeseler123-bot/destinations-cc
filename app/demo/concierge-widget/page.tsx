import React from "react";
import Link from "next/link";
import Script from "next/script";
import DccConciergeWidget from "@/app/components/dcc/DccConciergeWidget";
import {
  getFunnelMetricsReport,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { getDurableCatalogSummaryReport } from "@/lib/dcc/catalog/durableCatalogStore";
import { getWidgetPlacementReport } from "@/lib/dcc/catalog/widgetPlacements";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";

export const dynamic = "force-dynamic";

type DemoPageProps = {
  searchParams?: Promise<{
    placementId?: string;
    property?: string;
  }>;
};

export default async function ConciergeWidgetDemoPage({ searchParams }: DemoPageProps) {
  await syncDurableLedgerWithPostgres();
  const query = searchParams ? await searchParams : {};
  const pilotPlacementId =
    query.placementId?.trim() || "nola-hotel-monteleone-demo-pilot";
  const explicitProperty = query.property?.trim() || null;
  const pilotPropertySlug = explicitProperty || "hotel-monteleone-nola";

  const [
    funnelReport,
    pilotFunnelReport,
    wnoSwampFunnel,
    wnoTransFunnel,
    wttsTransFunnel,
    dccSwampFunnel,
    catalogSummary,
  ] = await Promise.all([
    Promise.resolve(getFunnelMetricsReport()),
    Promise.resolve(
      getFunnelMetricsReport({
        placementId: pilotPlacementId,
        propertySlug: explicitProperty,
      }),
    ),
    Promise.resolve(getFunnelMetricsReport({ placementId: "fp-wno-swamp-tours" })),
    Promise.resolve(getFunnelMetricsReport({ placementId: "fp-wno-swamp-transportation" })),
    Promise.resolve(getFunnelMetricsReport({ placementId: "fp-wtts-transportation" })),
    Promise.resolve(getFunnelMetricsReport({ placementId: "fp-dcc-nola-swamp-tours" })),
    getDurableCatalogSummaryReport(),
  ]);
  const placementReport = catalogSummary.widgetPlacements ?? getWidgetPlacementReport();

  const standaloneGuestLink = `https://www.destinationcommandcenter.com/embed/concierge?destination=new-orleans&property=hotel-monteleone-nola&surface=hotel_concierge&pickupMode=hotel_pickup&category=Swamp+%26+Bayou&placementId=${encodeURIComponent(pilotPlacementId)}`;

  const scriptSnippet = `<div id="dcc-concierge-widget-root"></div>
<script
  src="https://www.destinationcommandcenter.com/embed/dcc-concierge-widget.js"
  data-destination="new-orleans"
  data-property="hotel-monteleone-nola"
  data-placement-id="${pilotPlacementId}"
  data-surface="hotel_concierge"
  data-pickup-mode="hotel_pickup"
  data-category="Swamp & Bayou"
  async
></script>`;

  const iframeSnippet = `<iframe
  src="https://www.destinationcommandcenter.com/embed/concierge?destination=new-orleans&property=hotel-monteleone-nola&surface=hotel_concierge&pickupMode=hotel_pickup&category=Swamp+%26+Bayou&placementId=${encodeURIComponent(pilotPlacementId)}"
  title="Destination Command Center — Tour & Excursion Concierge Widget"
  style="width:100%;min-height:780px;border:0;border-radius:16px;overflow:hidden;"
  loading="lazy"
></iframe>`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Demonstration & Commercial Status Banner */}
        <section
          data-testid="concierge-demo-banner"
          className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-300">
                Engineering Demonstration & Partner Integration Sandbox (Test Traffic Mode)
              </span>
              <span
                data-testid="demo-preset-status-pill"
                className="rounded-full bg-amber-500/25 border border-amber-400/50 px-3 py-1 text-xs font-bold text-amber-200"
              >
                DEMO PRESET — Hotel Monteleone Pending Partner Approval
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-mono text-emerald-300">
                engineeringWidgetStatus: production_ready
              </span>
              <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-xs font-mono text-cyan-300">
                firstPartyInstallations: {placementReport.firstPartyInstallationsCount}
              </span>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-mono text-slate-300">
                observedExternalEmbeds: {placementReport.observedExternalEmbedsCount}
              </span>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-mono text-slate-300">
                approvedExternalPartnerPlacements: {placementReport.approvedExternalPartnerPlacementsCount}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Link
                href="/tours"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 hover:border-slate-500"
              >
                ← Back to /tours
              </Link>
              <Link
                href={`/api/v1/concierge/telemetry?placementId=${encodeURIComponent(pilotPlacementId)}`}
                target="_blank"
                className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 font-semibold text-emerald-300 hover:bg-emerald-500/30"
              >
                Live Aggregate JSON Telemetry (/api/v1/concierge/telemetry) ↗
              </Link>
              <Link
                href={`/embed/concierge?destination=new-orleans&property=hotel-monteleone-nola&surface=hotel_concierge&pickupMode=hotel_pickup&category=Swamp+%26+Bayou&placementId=${encodeURIComponent(pilotPlacementId)}&isTest=true`}
                target="_blank"
                className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-1.5 font-semibold text-cyan-300 hover:bg-cyan-500/30"
              >
                Open Standalone Guest Link (/embed/concierge) ↗
              </Link>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              New Orleans Hotel Pilot & Multi-Surface Concierge Funnel Report
            </h1>
            <p className="mt-1.5 text-sm text-slate-300 max-w-4xl leading-relaxed">
              This public dashboard reports <strong>aggregate-only</strong> funnel metrics for the{" "}
              <strong>Hotel Monteleone — French Quarter (Demo Preset)</strong> pilot placement (
              <code className="text-indigo-300">{pilotPlacementId}</code>) and live first-party Jean
              Lafitte hotel-pickup sales placements. Guest visits, checkout clicks,
              provider-confirmed bookings, and settled commissions are separated below for both{" "}
              <code className="text-emerald-300">production</code> and{" "}
              <code className="text-amber-300">test</code> traffic. Individual visitor records, click
              IDs, outbound URLs, and booking details require commerce admin authentication.
            </p>
          </div>

          {/* Dedicated Pilot Placement Funnel Report */}
          <div
            data-testid="pilot-placement-funnel-report"
            className="rounded-xl border border-indigo-500/40 bg-slate-950/90 p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Pilot Placement Funnel Report (Aggregate-Only) — {pilotPlacementId} ({pilotPropertySlug})
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tracks visits and handoffs from both the standalone guest link and the{" "}
                  <code>/embed/dcc-concierge-widget.js</code> script loader.
                </p>
              </div>
              <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                Status: Demo Preset (Pending Hotel Approval)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5">
                <div className="text-[11px] uppercase font-semibold text-slate-400">
                  1. Guest Visits (Placement)
                </div>
                <div
                  data-testid="pilot-prod-guest-visits"
                  className="mt-1 text-2xl font-extrabold text-white"
                >
                  {pilotFunnelReport.production.guestVisits} Prod
                </div>
                <div
                  data-testid="pilot-test-guest-visits"
                  className="mt-1 text-xs text-amber-300 font-mono"
                >
                  {pilotFunnelReport.test.guestVisits} Test / QA Visits
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5">
                <div className="text-[11px] uppercase font-semibold text-slate-400">
                  2. Checkout Clicks (Placement)
                </div>
                <div
                  data-testid="pilot-prod-outbound-clicks"
                  className="mt-1 text-2xl font-extrabold text-cyan-300"
                >
                  {pilotFunnelReport.production.actualOutboundClicks} Prod
                </div>
                <div
                  data-testid="pilot-test-outbound-clicks"
                  className="mt-1 text-xs text-amber-300 font-mono"
                >
                  {pilotFunnelReport.test.actualOutboundClicks} Test Clicks ·{" "}
                  {pilotFunnelReport.production.recommendationOnlyRecords +
                    pilotFunnelReport.test.recommendationOnlyRecords}{" "}
                  unfollowed recs
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5">
                <div className="text-[11px] uppercase font-semibold text-slate-400">
                  3. Provider-Confirmed Bookings
                </div>
                <div
                  data-testid="pilot-prod-confirmed-bookings"
                  className="mt-1 text-2xl font-extrabold text-emerald-400"
                >
                  {pilotFunnelReport.production.confirmedPaidBookings} Prod ($
                  {pilotFunnelReport.production.grossConfirmedRevenueUsd.toFixed(2)})
                </div>
                <div
                  data-testid="pilot-test-confirmed-bookings"
                  className="mt-1 text-xs text-amber-300 font-mono"
                >
                  {pilotFunnelReport.test.confirmedPaidBookings} Test ($
                  {pilotFunnelReport.test.grossConfirmedRevenueUsd.toFixed(2)}) ·{" "}
                  {pilotFunnelReport.production.duplicateDeliveriesIgnored +
                    pilotFunnelReport.test.duplicateDeliveriesIgnored}{" "}
                  replay dupes ignored
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5">
                <div className="text-[11px] uppercase font-semibold text-slate-400">
                  4. Settled Commission vs Unsettled
                </div>
                <div
                  data-testid="pilot-prod-settled-commission"
                  className="mt-1 text-2xl font-extrabold text-emerald-300"
                >
                  ${pilotFunnelReport.production.settledReconciledCommissionUsd.toFixed(2)} Settled (Prod)
                </div>
                <div
                  data-testid="pilot-test-settled-commission"
                  className="mt-1 text-xs text-amber-300 font-mono"
                >
                  Settled (Test): ${pilotFunnelReport.test.settledReconciledCommissionUsd.toFixed(2)} ·
                  Unsettled (Confirmed): $
                  {(
                    pilotFunnelReport.production.estimatedUnsettledCommissionUsd +
                    pilotFunnelReport.test.estimatedUnsettledCommissionUsd
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            {/* First-Party Sales Test Placements Summary */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase text-emerald-300">
                  First-Party Jean Lafitte Hotel-Pickup Sales Test Placements (Live Aggregate Funnel)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Public Access: Aggregate-Only (Visitor records, click IDs, outbound URLs &amp; booking refs gated behind admin auth)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1.5 pr-3">Placement ID</th>
                      <th className="py-1.5 pr-3">Live First-Party Page</th>
                      <th className="py-1.5 pr-3">Guest Visits (Prod / Test)</th>
                      <th className="py-1.5 pr-3">Checkout Clicks (Prod / Test)</th>
                      <th className="py-1.5 pr-3">Confirmed Bookings (Prod / Test)</th>
                      <th className="py-1.5 pr-3">Settled Commission (Prod / Test)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        id: "fp-wno-swamp-tours",
                        url: "https://www.welcometoneworleanstours.com/swamp-tours",
                        report: wnoSwampFunnel,
                      },
                      {
                        id: "fp-wno-swamp-transportation",
                        url: "https://www.welcometoneworleanstours.com/guides/best-swamp-tour-with-transportation",
                        report: wnoTransFunnel,
                      },
                      {
                        id: "fp-wtts-transportation",
                        url: "https://welcometotheswamp.com/transportation",
                        report: wttsTransFunnel,
                      },
                      {
                        id: "fp-dcc-nola-swamp-tours",
                        url: "https://www.destinationcommandcenter.com/new-orleans/swamp-tours",
                        report: dccSwampFunnel,
                      },
                    ].map((row) => (
                      <tr key={row.id} className="border-b border-slate-900">
                        <td className="py-1.5 pr-3 text-indigo-300">{row.id}</td>
                        <td className="py-1.5 pr-3 text-cyan-300">{row.url}</td>
                        <td className="py-1.5 pr-3">
                          {row.report.production.guestVisits} Prod / {row.report.test.guestVisits} Test
                        </td>
                        <td className="py-1.5 pr-3">
                          {row.report.production.actualOutboundClicks} Prod / {row.report.test.actualOutboundClicks} Test
                        </td>
                        <td className="py-1.5 pr-3 text-emerald-300">
                          {row.report.production.confirmedPaidBookings} Prod / {row.report.test.confirmedPaidBookings} Test
                        </td>
                        <td className="py-1.5 pr-3 text-emerald-300">
                          ${row.report.production.settledReconciledCommissionUsd.toFixed(2)} Prod / $
                          {row.report.test.settledReconciledCommissionUsd.toFixed(2)} Test
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Separate Engineering, Placement & Commercial Telemetry Grid */}
          <div
            data-testid="commercial-telemetry-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2"
          >
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[11px] uppercase font-semibold text-slate-400">
                Shared Catalog Coverage
              </div>
              <div className="mt-1 text-2xl font-extrabold text-white">
                {catalogSummary.totalImportedRecords} Tours
              </div>
              <div className="mt-1 text-xs text-emerald-400">
                {catalogSummary.destinationCoverageBreakdown.completeDestinationsCount}/
                {catalogSummary.destinationCoverageBreakdown.totalDestinations} complete provider catalogs
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[11px] uppercase font-semibold text-slate-400">
                Widget Placements
              </div>
              <div
                data-testid="external-partner-placements-count"
                className="mt-1 text-2xl font-extrabold text-amber-300"
              >
                {placementReport.approvedExternalPartnerPlacementsCount} Approved Ext
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {placementReport.firstPartyInstallationsCount} first-party ·{" "}
                {placementReport.observedExternalEmbedsCount} observed unverified
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[11px] uppercase font-semibold text-slate-400">
                Recommendations Issued (Prod)
              </div>
              <div
                data-testid="prod-recommendations-issued"
                className="mt-1 text-2xl font-extrabold text-slate-200"
              >
                {funnelReport.production.recommendationsIssued}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {funnelReport.production.recommendationOnlyRecords} unfollowed ·{" "}
                {funnelReport.test.recommendationsIssued} test excluded
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[11px] uppercase font-semibold text-slate-400">
                Actual Outbound Clicks (Prod)
              </div>
              <div
                data-testid="prod-qualified-referrals"
                className="mt-1 text-2xl font-extrabold text-cyan-300"
              >
                {funnelReport.production.actualOutboundClicks}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Followed handoffs only ({funnelReport.test.actualOutboundClicks} test excluded)
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[11px] uppercase font-semibold text-slate-400">
                Confirmed Bookings (Prod)
              </div>
              <div
                data-testid="prod-confirmed-bookings"
                className="mt-1 text-2xl font-extrabold text-emerald-400"
              >
                {funnelReport.production.confirmedPaidBookings}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Gross Prod Rev: ${funnelReport.production.grossConfirmedRevenueUsd.toFixed(2)} (
                {funnelReport.test.confirmedPaidBookings} QA excluded)
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[11px] uppercase font-semibold text-slate-400">
                Reconciled Commission (Prod)
              </div>
              <div
                data-testid="prod-reconciled-commission"
                className="mt-1 text-2xl font-extrabold text-emerald-300"
              >
                ${funnelReport.production.settledReconciledCommissionUsd.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Settled only · Est unsettled: $
                {funnelReport.production.estimatedUnsettledCommissionUsd.toFixed(2)} · Reversed: $
                {funnelReport.production.reversedCommissionUsd.toFixed(2)}
              </div>
            </div>
          </div>
        </section>

        {/* Partner Package: Standalone Guest Link First + Embed Loader */}
        <section
          data-testid="partner-installation-instructions"
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6"
        >
          <div>
            <h2 className="text-lg font-bold text-white">
              1. New Orleans Hotel Pilot Partner Package (Standalone Link First + Script Embed)
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              {placementReport.verificationPolicy}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/15 p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-300">
              Step 1 (Immediate Desk / Pre-Arrival Email Share) — Standalone Guest Link
            </div>
            <p className="text-xs text-slate-300">
              Share directly in pre-arrival guest emails, SMS, QR codes at the concierge desk, or
              digital guestbooks without editing website code. Carries{" "}
              <code>placementId={pilotPlacementId}</code> into the attribution ledger:
            </p>
            <pre
              data-testid="standalone-guest-link"
              className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-emerald-300 overflow-x-auto"
            >
              {standaloneGuestLink}
            </pre>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wide text-emerald-400">
                Step 2 (Website Embed) — Live /embed/dcc-concierge-widget.js Loader
              </div>
              <pre
                data-testid="embed-script-snippet"
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200 overflow-x-auto"
              >
                {scriptSnippet}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wide text-cyan-400">
                Alternative — Direct Responsive Iframe Embed
              </div>
              <pre
                data-testid="embed-iframe-snippet"
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200 overflow-x-auto"
              >
                {iframeSnippet}
              </pre>
            </div>
          </div>

          {/* Live Mounted Script Loader Verification Container */}
          <div className="pt-2 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wide text-amber-300">
              Live Mounted Partner Loader (/embed/dcc-concierge-widget.js with data-placement-id=&quot;{pilotPlacementId}&quot;)
            </div>
            <div
              id="dcc-concierge-widget-root"
              data-testid="dcc-concierge-widget-script-root"
              className="w-full rounded-xl border border-slate-800 bg-slate-950"
            />
            <Script
              id="dcc-concierge-partner-loader"
              src="/embed/dcc-concierge-widget.js"
              data-destination="new-orleans"
              data-property="hotel-monteleone-nola"
              data-placement-id={pilotPlacementId}
              data-surface="hotel_concierge"
              data-pickup-mode="hotel_pickup"
              data-category="Swamp & Bayou"
              data-date="2026-11-18"
              data-is-test="true"
              strategy="afterInteractive"
            />
          </div>
        </section>

        {/* Interactive Configurable Concierge Widget */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              2. Interactive Multi-Surface Concierge Widget (Direct Component — Marked as Test Traffic)
            </h2>
            <span className="text-xs text-slate-400">
              Switch surfaces, pickup fulfillment modes, and destinations below
            </span>
          </div>
          <DccConciergeWidget
            initialDestination="new-orleans"
            initialPropertySlug="hotel-monteleone-nola"
            initialPlacementId={pilotPlacementId}
            initialSurface="hotel_concierge"
            isTest={true}
          />
        </section>
      </div>
    </main>
  );
}
