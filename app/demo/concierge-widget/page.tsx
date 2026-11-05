import React from "react";
import Link from "next/link";
import DccConciergeWidget from "@/app/components/dcc/DccConciergeWidget";
import { getFunnelMetricsReport } from "@/lib/dcc/commerce/opaqueAttributionLedger";
import { readDurableLedgerState } from "@/lib/dcc/storage/durableTransactionalStore";
import { getDurableCatalogSummaryReport } from "@/lib/dcc/catalog/durableCatalogStore";

export const dynamic = "force-dynamic";

export default async function ConciergeWidgetDemoPage() {
  const [funnelReport, catalogSummary] = await Promise.all([
    Promise.resolve(getFunnelMetricsReport()),
    getDurableCatalogSummaryReport(),
  ]);

  const ledgerState = readDurableLedgerState();
  let productionReconciledCommissionUsd = 0;
  for (const click of Object.values(ledgerState.opaqueClicksById || {})) {
    const isTestRecord = Boolean(
      click.isTest ||
        click.trafficClass === "test" ||
        click.decisionReceiptId ===
          "rcpt:sha256:bc44b315bdcb8ed5d4a806ed2ed729b76b26621a1a28bb1eda5596271d22ead0" ||
        click.reconciledOutcomes.some(
          (o) =>
            o.isTest ||
            o.trafficClass === "test" ||
            /^(TEST|SIM|QA|SANDBOX|E2E)[-_]|[-_](E2E|TEST|SIM|QA|SANDBOX)[-_]/i.test(
              o.providerBookingRef,
            ),
        ),
    );
    if (isTestRecord) continue;
    for (const outcome of click.reconciledOutcomes) {
      if (
        outcome.eventType === "BOOKING_CONFIRMED" ||
        outcome.eventType === "BOOKING_FULFILLED"
      ) {
        const comm = outcome.paidCommissionUsd ?? outcome.estimatedCommissionUsd ?? 0;
        if (typeof comm === "number" && Number.isFinite(comm)) {
          productionReconciledCommissionUsd += comm;
        }
      }
    }
  }

  const scriptSnippet = `<div id="dcc-concierge-widget-root"></div>
<script
  src="https://www.destinationcommandcenter.com/embed/dcc-concierge-widget.js"
  data-destination="new-orleans"
  data-property="hotel-monteleone-nola"
  data-surface="hotel_concierge"
  data-pickup-mode="hotel_pickup"
  async
></script>`;

  const iframeSnippet = `<iframe
  src="https://www.destinationcommandcenter.com/embed/concierge?destination=new-orleans&property=hotel-monteleone-nola&surface=hotel_concierge&pickupMode=hotel_pickup"
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
                Engineering Demonstration & Partner Integration Sandbox
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-mono text-emerald-300">
                engineeringWidgetStatus: production_ready
              </span>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-mono text-slate-300">
                externalPartnerPlacementsLive: 0
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
                href="/embed/concierge?destination=new-orleans&property=hotel-monteleone-nola&surface=hotel_concierge"
                target="_blank"
                className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-1.5 font-semibold text-cyan-300 hover:bg-cyan-500/30"
              >
                Open Raw External Embed (/embed/concierge) ↗
              </Link>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Configurable Multi-Surface Concierge Widget — Distribution & Verification
            </h1>
            <p className="mt-1.5 text-sm text-slate-300 max-w-4xl leading-relaxed">
              This page demonstrates the shared trip-matching concierge widget powering{" "}
              <strong>Destination Command Center</strong>, <strong>Cruise Promenade</strong>,{" "}
              <strong>Welcome to the Swamp</strong>, <strong>Welcome to New Orleans Tours</strong>,
              and external hotel concierge desks. External partner placement is tracked separately
              from engineering completion, and QA/test interactions are strictly excluded from
              production commercial totals.
            </p>
          </div>

          {/* Separate Engineering, Placement & Commercial Telemetry Grid */}
          <div
            data-testid="commercial-telemetry-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2"
          >
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[11px] uppercase font-semibold text-slate-400">
                Shared Catalog Coverage
              </div>
              <div className="mt-1 text-2xl font-extrabold text-white">
                {catalogSummary.totalImportedRecords} Tours
              </div>
              <div className="mt-1 text-xs text-emerald-400">
                {Object.keys(catalogSummary.byDestination).length} EarthOS destinations active
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[11px] uppercase font-semibold text-slate-400">
                External Partner Placements
              </div>
              <div
                data-testid="external-partner-placements-count"
                className="mt-1 text-2xl font-extrabold text-amber-300"
              >
                0 Live External
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Engineering embed ready · Partner outreach tracked separately
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-[11px] uppercase font-semibold text-slate-400">
                Qualified Referrals (Prod)
              </div>
              <div
                data-testid="prod-qualified-referrals"
                className="mt-1 text-2xl font-extrabold text-cyan-300"
              >
                {funnelReport.production.followedHandoffs}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                QA/Test referrals excluded ({funnelReport.test.followedHandoffs} test)
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
                ${productionReconciledCommissionUsd.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Commercial milestone: 1st attributed booking on new surface
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Configurable Concierge Widget */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              1. Interactive Multi-Surface Concierge Widget (Live Matcher)
            </h2>
            <span className="text-xs text-slate-400">
              Switch surfaces, pickup fulfillment modes, and destinations below
            </span>
          </div>
          <DccConciergeWidget
            initialDestination="new-orleans"
            initialPropertySlug="hotel-monteleone-nola"
            initialSurface="hotel_concierge"
          />
        </section>

        {/* Partner Installation Instructions & Live External Iframe Verification */}
        <section
          data-testid="partner-installation-instructions"
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6"
        >
          <div>
            <h2 className="text-lg font-bold text-white">
              2. Partner Installation Instructions & External Embed Verification
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Hotel concierges, cruise port desks, and partner travel sites can embed the exact
              matcher above using either the lightweight loader script or a responsive{" "}
              <code className="text-cyan-300">&lt;iframe&gt;</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wide text-emerald-400">
                Option A — Single-Tag JavaScript Embed Loader
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
                Option B — Direct Responsive Iframe Embed
              </div>
              <pre
                data-testid="embed-iframe-snippet"
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200 overflow-x-auto"
              >
                {iframeSnippet}
              </pre>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wide text-amber-300">
              Live External Embed Preview (Rendered via /embed/concierge)
            </div>
            <iframe
              data-testid="live-concierge-embed-iframe"
              src="/embed/concierge?destination=juneau&property=baranof-downtown-juneau&surface=hotel_concierge&pickupMode=pier_pickup"
              title="Live External Embed Preview — Juneau Cruise Pier Pickup"
              className="w-full min-h-[680px] rounded-xl border border-slate-800 bg-slate-950"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
