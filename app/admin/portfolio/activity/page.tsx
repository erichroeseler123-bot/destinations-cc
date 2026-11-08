import Link from "next/link";
import { getHandoffAnalyticsSnapshot } from "@/lib/dcc/handoffAnalytics";
import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import {
  DCC_PORTFOLIO_NETWORK_SITES,
  resolveActivePortfolioSiteId,
} from "@/lib/dcc/portfolioNetworkRegistry";
import { buildUnifiedPortfolioFunnelReport } from "@/lib/dcc/commerce/portfolioFunnelReport";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type SiteSpec = {
  id: string;
  label: string;
  consoleHref: string;
  external?: boolean;
};

const CONSOLE_HREF_BY_SITE: Record<string, { href: string; external?: boolean }> = {
  welcometoneworleanstours: { href: "/internal/dashboard/wno-revenue-opportunity" },
  partyatredrocks: { href: "https://www.partyatredrocks.com/admin/parr-inventory", external: true },
  gosno: { href: "https://gosno.co/admin/operations-queue", external: true },
  cruisepromenade: { href: "https://cruisepromenade.com/internal/dashboard/", external: true },
  vibearoundtown: { href: "https://vibearoundtown.com/admin", external: true },
};

const SITES: SiteSpec[] = DCC_PORTFOLIO_NETWORK_SITES.map((site) => {
  const target = CONSOLE_HREF_BY_SITE[site.site_id] || { href: "/admin/satellite-handoffs" };
  return {
    id: site.site_id,
    label: site.site_name,
    consoleHref: target.href,
    external: target.external,
  };
});

function metadataOf(event: any) {
  return event?.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, any> : {};
}

function siteOf(event: any) {
  const meta = metadataOf(event);
  if (event?.corridorId === "wno-commerce") return "welcometoneworleanstours";
  const resolved = resolveActivePortfolioSiteId(String(meta.site || meta.satelliteId || ""));
  return resolved || String(meta.site || "");
}

function originalName(event: any) {
  return String(metadataOf(event).original_event_name || event?.eventName || "");
}

function eventTime(event: any): Date | null {
  const raw = event?.occurredAt || event?.occurred_at || event?.createdAt || event?.created_at || null;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ageLabel(date: Date | null) {
  if (!date) return "No event timestamp";
  const ms = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(ms / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function freshness(date: Date | null, count: number): "active" | "quiet" | "stale" | "unseen" {
  if (!count) return "unseen";
  if (!date) return "quiet";
  const ageHours = (Date.now() - date.getTime()) / 3600000;
  if (ageHours <= 24) return "active";
  if (ageHours <= 168) return "quiet";
  return "stale";
}

const freshnessTone = {
  active: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  quiet: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
  stale: "border-amber-400/25 bg-amber-500/10 text-amber-100",
  unseen: "border-white/10 bg-white/[0.04] text-zinc-300",
};

function formatUsdOrUnknown(val: number | "unknown"): string {
  if (val === "unknown") return "unknown";
  return `$${val.toLocaleString()}`;
}

export default async function PortfolioActivityPage() {
  const [events, unifiedReport] = await Promise.all([
    listRecentProductionCorridorEvents(10000),
    buildUnifiedPortfolioFunnelReport({ windowPreset: "28d" }),
  ]);

  const startMs = Date.parse(unifiedReport.reportingWindow.startIso);
  const endMs = Date.parse(unifiedReport.reportingWindow.endIso);
  const windowedEvents = events.filter((event: any) => {
    const dt = eventTime(event);
    if (!dt) return false;
    const ms = dt.getTime();
    return ms >= startMs && ms <= endMs;
  });

  const portfolioEvents = windowedEvents.filter(
    (event: any) => event.corridorId === "portfolio-network" || event.corridorId === "wno-commerce",
  );
  const snapshot = getHandoffAnalyticsSnapshot(500, {
    startIso: unifiedReport.reportingWindow.startIso,
    endIso: unifiedReport.reportingWindow.endIso,
  });

  const spokeBySiteId = new Map(unifiedReport.spokes.map((s) => [s.siteId, s]));

  const siteRows = SITES.map((site) => {
    const siteEvents = portfolioEvents.filter((event: any) => siteOf(event) === site.id);
    const latest = [...siteEvents]
      .map((event) => ({ event, date: eventTime(event) }))
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0] || null;
    const handoffs = siteEvents.filter((event: any) => originalName(event).includes("handoff")).length;
    const bookingIntent = siteEvents.filter((event: any) => event.eventName === "booking_opened" || originalName(event).includes("booking") || originalName(event).includes("checkout")).length;
    const recommendations = siteEvents.filter((event: any) => event.eventName === "recommendation_rendered" || originalName(event).includes("recommend")).length;
    const spokeReport = spokeBySiteId.get(site.id);
    const totalActivityCount =
      siteEvents.length +
      (spokeReport?.outboundClicks.total || 0) +
      (spokeReport?.storefrontArrivals || 0);
    const status = freshness(latest?.date || null, totalActivityCount);
    return { ...site, siteEvents, latest, handoffs, bookingIntent, recommendations, status, spokeReport };
  });

  const active = siteRows.filter((row) => row.status === "active").length;
  const stale = siteRows.filter((row) => row.status === "stale").length;
  const unseen = siteRows.filter((row) => row.status === "unseen").length;

  const latestPortfolio = [...portfolioEvents]
    .map((event) => ({ event, date: eventTime(event) }))
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
    .slice(0, 30);

  const wnoFareHarborReferrals = unifiedReport.totals.outboundClicks.fareharborCheckoutReferrals;
  const attentionCount = snapshot.urgentAlerts.length + stale + unseen;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-[#f5c66c]">DCC Portfolio Desktop</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Portfolio activity</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 md:text-base">
              Which of the 12 active portfolio spokes are talking to DCC inside the shared reporting window ({unifiedReport.reportingWindow.label}: {unifiedReport.reportingWindow.startIso.slice(0, 10)} → {unifiedReport.reportingWindow.endIso.slice(0, 10)}), separating unique visitors, outbound clicks, storefront arrivals, provider-confirmed bookings, and revenue by commercial model.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/portfolio" className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-black hover:bg-white/10">← Portfolio cockpit</Link>
            <Link href="/admin/satellite-handoffs" className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-3 text-sm font-black text-black">Open handoffs →</Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Windowed events (28d)" value={portfolioEvents.length} />
          <Metric label="Active ≤24h" value={active} />
          <Metric label="Stale >7d" value={stale} alert={stale > 0} />
          <Metric label="No telemetry seen" value={unseen} alert={unseen > 0} />
          <Metric label="Needs inspection" value={attentionCount} alert={attentionCount > 0} />
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Commercial signal ({unifiedReport.reportingWindow.label})</div>
              <h2 className="mt-2 text-2xl font-black">DCC is seeing real intent — separated from confirmed revenue</h2>
            </div>
            <div className="text-sm text-zinc-300">
              WNO FareHarbor checkout referrals (intent only): <strong className="text-white">{wnoFareHarborReferrals}</strong> · Owned gross sales: <strong className="text-white">{formatUsdOrUnknown(unifiedReport.totals.ownedGrossSalesUsd)}</strong> · Commissions earned: <strong className="text-white">{formatUsdOrUnknown(unifiedReport.totals.commissionsEarnedUsd)}</strong> · Payouts received: <strong className="text-white">{formatUsdOrUnknown(unifiedReport.totals.payoutsReceivedUsd)}</strong>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Site-by-site network health (12 active spokes)</div>
          <h2 className="mt-2 text-2xl font-black">Every active property on one board</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {siteRows.map((row) => (
              <article key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{row.id}</div>
                    <h3 className="mt-2 text-xl font-black">{row.label}</h3>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${freshnessTone[row.status]}`}>{row.status}</span>
                </div>
                <div className="mt-5 grid grid-cols-4 gap-2">
                  <MiniMetric label="Visitors" value={row.spokeReport?.uniqueVisitors ?? 0} />
                  <MiniMetric label="Clicks" value={row.spokeReport?.outboundClicks.total ?? 0} />
                  <MiniMetric label="Arrivals" value={row.spokeReport?.storefrontArrivals ?? 0} />
                  <MiniMetric label="Confirmed" value={row.spokeReport?.providerConfirmations ?? "unknown"} />
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                  <div className="flex justify-between gap-3"><span>Last seen</span><strong className="text-white">{ageLabel(row.latest?.date || null)}</strong></div>
                  <div className="mt-2 flex justify-between gap-3"><span>Checkout referrals</span><span className="text-zinc-200">{row.spokeReport?.outboundClicks.checkoutReferrals ?? 0}</span></div>
                  <div className="mt-2 flex justify-between gap-3"><span>Owned sales / Comm.</span><span>{formatUsdOrUnknown(row.spokeReport?.ownedGrossSalesUsd ?? 0)} / {formatUsdOrUnknown(row.spokeReport?.commissionsEarnedUsd ?? 0)}</span></div>
                </div>
                <div className="mt-4">
                  {row.external ? (
                    <a href={row.consoleHref} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">Open site console ↗</a>
                  ) : (
                    <Link href={row.consoleHref} className="inline-flex min-h-10 items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">Inspect in DCC →</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_360px]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Recent network stream</div>
              <h2 className="mt-2 text-2xl font-black">Latest cross-site activity</h2>
            </div>
            <div className="divide-y divide-white/10">
              {latestPortfolio.map(({ event, date }: any, index) => (
                <div key={`${event.eventId || event.id || index}`} className="grid gap-2 px-6 py-4 md:grid-cols-[180px_1fr_120px] md:items-center">
                  <div>
                    <div className="text-sm font-bold text-white">{siteOf(event) || "unknown-site"}</div>
                    <div className="mt-1 text-xs text-zinc-500">{event.sourcePage || event.landingPath || "—"}</div>
                  </div>
                  <div className="text-sm text-zinc-300">{originalName(event) || event.eventName}</div>
                  <div className="text-xs text-zinc-500 md:text-right">{ageLabel(date)}</div>
                </div>
              ))}
              {latestPortfolio.length === 0 ? <div className="px-6 py-8 text-sm text-zinc-400">No portfolio-network events recorded yet.</div> : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.07] p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Inspection queue</div>
              <h2 className="mt-2 text-xl font-black">Quiet lanes</h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                {siteRows.filter((row) => row.status === "stale" || row.status === "unseen").map((row) => (
                  <div key={row.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3"><strong className="text-white">{row.label}</strong><span className="text-[10px] uppercase tracking-[0.14em] text-amber-200">{row.status}</span></div>
                    <div className="mt-1 text-xs text-zinc-400">Last seen: {ageLabel(row.latest?.date || null)}</div>
                  </div>
                ))}
                {siteRows.every((row) => row.status !== "stale" && row.status !== "unseen") ? <p>No stale or unseen portfolio lanes right now.</p> : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Rule of thumb</div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">Active means DCC saw the property in the last 24 hours. Quiet means within seven days. Stale means the network has not heard from it for more than seven days. Unseen means this telemetry window contains no event for that site.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, alert = false }: { label: string; value: number | string; alert?: boolean }) {
  return <div className={`rounded-2xl border p-5 ${alert ? "border-amber-300/30 bg-amber-400/10" : "border-white/10 bg-white/[0.04]"}`}><div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</div><div className="mt-2 text-3xl font-black">{value}</div></div>;
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</div><div className="mt-1 text-lg font-black">{value}</div></div>;
}
