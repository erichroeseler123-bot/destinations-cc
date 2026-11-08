import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import { buildUnifiedPortfolioFunnelReport } from "@/lib/dcc/commerce/portfolioFunnelReport";
import { buildRiverboatComparisonFunnelReport } from "@/lib/wno/riverboatComparisonFunnel";

export const dynamic = "force-dynamic";

function pct(n: number, d: number) {
  return d ? `${Math.round((n / d) * 100)}%` : "—";
}

function countBy<T extends string>(values: T[]) {
  const map = new Map<string, number>();
  for (const value of values) map.set(value || "unknown", (map.get(value || "unknown") || 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function isWithinWindow(iso: string | null | undefined, startMs: number, endMs: number): boolean {
  if (!iso) return false;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) && ms >= startMs && ms <= endMs;
}

export default async function WnoRevenueOpportunityPage() {
  const [all, unifiedReport, riverboatFunnel] = await Promise.all([
    listRecentProductionCorridorEvents(10000),
    buildUnifiedPortfolioFunnelReport({ windowPreset: "28d" }),
    buildRiverboatComparisonFunnelReport({ windowDays: 28 }),
  ]);

  const startMs = Date.parse(unifiedReport.reportingWindow.startIso);
  const endMs = Date.parse(unifiedReport.reportingWindow.endIso);

  const events = all.filter(
    (event: any) =>
      event.corridorId === "wno-commerce" &&
      isWithinWindow(event.occurredAt || event.createdAt, startMs, endMs),
  );
  const landing = events.filter((event: any) => event.eventName === "landing_viewed");
  const product = events.filter((event: any) => event.eventName === "product_opened");
  const booking = events.filter((event: any) => event.eventName === "booking_opened");

  const wnoSpoke = unifiedReport.spokes.find(
    (spoke) => spoke.siteId === "welcometoneworleanstours",
  );
  const wnoTraces = unifiedReport.entryToCheckoutTraces.filter(
    (trace) => trace.destinationSiteId === "welcometoneworleanstours",
  );

  const sources = countBy(landing.map((event: any) => event.sourcePage || "unknown"));
  const entryPaths = countBy(landing.map((event: any) => event.landingPath || "unknown"));
  const products = countBy(booking.map((event: any) => event.clickedProductSlug || "unknown"));

  return (
    <main className="min-h-screen bg-[#0e0e10] px-6 py-14 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
          DCC · WNO commerce intelligence · {unifiedReport.reportingWindow.label} ({unifiedReport.reportingWindow.startIso.slice(0, 10)} → {unifiedReport.reportingWindow.endIso.slice(0, 10)})
        </p>
        <h1 className="mt-3 text-4xl font-black">New Orleans checkout-referral &amp; funnel dashboard</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300">
          Separates unique visitors, entry pageview events, tour-detail opens, storefront arrivals, and <strong>FareHarbor checkout referrals</strong> inside the shared 28-day reporting window. A FareHarbor checkout referral is outbound checkout intent — provider-confirmed bookings, commissions earned, and payouts received remain <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-amber-200">unknown</code> until verified provider outcome callbacks or settlement records exist.
        </p>

        <section className="mt-10 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Metric label="Unique visitors (28d)" value={wnoSpoke?.uniqueVisitors ?? 0} />
          <Metric label="Entry pageviews" value={landing.length} />
          <Metric label="Storefront arrivals" value={wnoSpoke?.storefrontArrivals ?? 0} />
          <Metric label="Tour-detail opens" value={product.length} />
          <Metric label="FareHarbor checkout referrals" value={wnoSpoke?.outboundClicks.fareharborCheckoutReferrals ?? booking.length} />
          <Metric label="Provider confirmations" value={String(wnoSpoke?.providerConfirmations ?? "unknown")} />
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="Owned gross sales" value={`$${(wnoSpoke?.ownedGrossSalesUsd ?? 0).toLocaleString()}`} />
          <Metric label="Commissions earned" value={String(wnoSpoke?.commissionsEarnedUsd ?? "unknown")} />
          <Metric label="Payouts received" value={String(wnoSpoke?.payoutsReceivedUsd ?? "unknown")} />
        </section>

        <section className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                Dedicated Comparison Funnel · /compare/{riverboatFunnel.comparisonSlug}
              </p>
              <h2 className="mt-1 text-xl font-bold">
                Steamboat NATCHEZ (FH 561220) vs Riverboat CITY of NEW ORLEANS (FH 694782)
              </h2>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              comparison visit → boat selected → checkout opened → provider-confirmed booking
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <Metric label="1. Comparison visits" value={riverboatFunnel.stages.comparisonVisits.totalEvents} />
            <Metric label="2. Boat selected" value={riverboatFunnel.stages.boatSelected.totalEvents} />
            <Metric label="3. Checkout opened (561220 / 694782)" value={riverboatFunnel.stages.checkoutOpened.primaryItems561220And694782Events} />
            <Metric label="4. Provider-confirmed bookings" value={riverboatFunnel.stages.providerConfirmedBookings.totalConfirmedBookings} />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="py-2 pr-4">Vessel</th>
                  <th className="py-2 pr-4">Detail route</th>
                  <th className="py-2 pr-4">FareHarbor item / flow</th>
                  <th className="py-2 pr-4">Boat selected</th>
                  <th className="py-2 pr-4">Tour detail opens</th>
                  <th className="py-2 pr-4">Checkout opened (primary item)</th>
                  <th className="py-2 pr-4">Checkout opened (from comparison)</th>
                  <th className="py-2 pr-4">Provider-confirmed bookings</th>
                  <th className="py-2">Confirmed gross USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[riverboatFunnel.vessels.natchez, riverboatFunnel.vessels.cityOfNewOrleans].map((v) => (
                  <tr key={v.vesselKey}>
                    <td className="py-2.5 pr-4 font-bold text-amber-200">{v.vesselLabel}</td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-300">{v.tourDetailPath}</td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-300">
                      {v.primaryFareHarborItemId} / {v.primaryFareHarborFlowId}
                    </td>
                    <td className="py-2.5 pr-4">{v.boatSelectedEvents} ({v.boatSelectedUniqueSessions} sess)</td>
                    <td className="py-2.5 pr-4">{v.tourDetailOpenedEvents}</td>
                    <td className="py-2.5 pr-4 font-bold text-white">{v.checkoutOpenedPrimaryItemEvents}</td>
                    <td className="py-2.5 pr-4 text-amber-300">{v.checkoutOpenedFromComparisonSessions}</td>
                    <td className="py-2.5 pr-4 font-mono text-emerald-300">{v.providerConfirmedBookingsCount}</td>
                    <td className="py-2.5 font-mono text-emerald-300">${v.confirmedGrossSalesUsd.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {riverboatFunnel.entryPageBreakdown.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Riverboat comparison funnel by visitor entry page (preserved into checkout)
              </h3>
              <table className="mt-2 w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400">
                    <th className="py-2 pr-4">Entry page</th>
                    <th className="py-2 pr-4">Comparison visits</th>
                    <th className="py-2 pr-4">Natchez selected</th>
                    <th className="py-2 pr-4">City selected</th>
                    <th className="py-2 pr-4">Natchez checkout (561220)</th>
                    <th className="py-2 pr-4">City checkout (694782)</th>
                    <th className="py-2">Provider-confirmed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {riverboatFunnel.entryPageBreakdown.slice(0, 12).map((row) => (
                    <tr key={row.entryPage}>
                      <td className="py-2 pr-4 font-mono text-zinc-200">{row.entryPage}</td>
                      <td className="py-2 pr-4">{row.comparisonVisits}</td>
                      <td className="py-2 pr-4">{row.natchezSelected}</td>
                      <td className="py-2 pr-4">{row.citySelected}</td>
                      <td className="py-2 pr-4 font-bold text-white">{row.natchezCheckoutOpened561220}</td>
                      <td className="py-2 pr-4 font-bold text-white">{row.cityCheckoutOpened694782}</td>
                      <td className="py-2 font-mono text-emerald-300">{row.providerConfirmedBookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <Rank title="Top entry sources (preserving exact page)" rows={sources.slice(0, 12)} />
          <Rank title="Top entry pages (never collapsed)" rows={entryPaths.slice(0, 12)} />
          <Rank title="Products with FareHarbor checkout referrals" rows={products.slice(0, 12)} />
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-bold">Entry-to-checkout attribution trace (WNO)</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Preserves the exact DCC entry page without collapsing unrecognized entry pages into <code className="text-zinc-200">/new-orleans/tours</code>.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="py-2 pr-4">DCC entry page</th>
                  <th className="py-2 pr-4">Checkout channel</th>
                  <th className="py-2 pr-4">Unique visitors</th>
                  <th className="py-2 pr-4">Storefront clicks</th>
                  <th className="py-2 pr-4">Storefront arrivals</th>
                  <th className="py-2 pr-4">Checkout referrals</th>
                  <th className="py-2 pr-4">Provider confirmations</th>
                  <th className="py-2">Commissions / Payouts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {wnoTraces.map((trace) => (
                  <tr key={trace.traceKey}>
                    <td className="py-2.5 pr-4 font-mono text-zinc-200">{trace.dccEntryPage}</td>
                    <td className="py-2.5 pr-4 text-amber-200">{trace.checkoutChannelLabel}</td>
                    <td className="py-2.5 pr-4">{trace.uniqueVisitors}</td>
                    <td className="py-2.5 pr-4">{trace.outboundStorefrontClicks}</td>
                    <td className="py-2.5 pr-4">{trace.storefrontArrivals}</td>
                    <td className="py-2.5 pr-4 font-bold text-white">{trace.checkoutReferrals}</td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-400">{String(trace.providerConfirmations)}</td>
                    <td className="py-2.5 font-mono text-zinc-400">
                      {String(trace.commissionsEarnedUsd)} / {String(trace.payoutsReceivedUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-bold">Funnel ratios (28d window)</h2>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div>Entry → product: <strong>{pct(product.length, landing.length)}</strong></div>
            <div>Product → FareHarbor checkout referral: <strong>{pct(booking.length, product.length)}</strong></div>
            <div>Entry → FareHarbor checkout referral: <strong>{pct(booking.length, landing.length)}</strong></div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="text-xs uppercase tracking-wider text-zinc-400">{label}</div><div className="mt-2 text-3xl font-black">{value}</div></div>;
}

function Rank({ title, rows }: { title: string; rows: [string, number][] }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><h2 className="font-bold">{title}</h2><ol className="mt-4 space-y-3 text-sm">{rows.length ? rows.map(([label, count]) => <li key={label} className="flex justify-between gap-4"><span className="break-all text-zinc-300">{label}</span><strong>{count}</strong></li>) : <li className="text-zinc-500">No production events yet.</li>}</ol></div>;
}
