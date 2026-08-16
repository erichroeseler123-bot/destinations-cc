import Link from "next/link";
import { getHandoffAnalyticsSnapshot } from "@/lib/dcc/handoffAnalytics";
import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type SiteSpec = {
  id: string;
  label: string;
  consoleHref: string;
  external?: boolean;
};

const SITES: SiteSpec[] = [
  { id: "cruise-promenade", label: "Cruise Promenade", consoleHref: "https://cruisepromenade.com/internal/dashboard/", external: true },
  { id: "vibing-around", label: "Vibing Around", consoleHref: "https://vibearoundtown.com/admin", external: true },
  { id: "gosno", label: "GoSno", consoleHref: "https://gosno.co/admin/operations-queue", external: true },
  { id: "party-at-red-rocks", label: "Party at Red Rocks", consoleHref: "https://www.partyatredrocks.com/admin/parr-inventory", external: true },
  { id: "last-frontier", label: "Last Frontier Shore Excursions", consoleHref: "/admin/satellite-handoffs" },
  { id: "juneau-flight-deck", label: "Juneau Flight Deck", consoleHref: "/admin/satellite-handoffs" },
  { id: "welcome-to-the-swamp", label: "Welcome to the Swamp", consoleHref: "/admin/satellite-handoffs" },
  { id: "welcome-to-the-dells", label: "Welcome to the Dells", consoleHref: "/admin/satellite-handoffs" },
  { id: "french-quarter-orientation", label: "French Quarter Orientation", consoleHref: "/admin/satellite-handoffs" },
  { id: "shuttleya", label: "ShuttleYa", consoleHref: "/admin/satellite-handoffs" },
  { id: "420-airport-pickup", label: "420 Friendly Airport Pickup", consoleHref: "/admin/satellite-handoffs" },
  { id: "save-on-the-strip", label: "Save On The Strip", consoleHref: "/admin/satellite-handoffs" },
];

function metadataOf(event: any) {
  return event?.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, any> : {};
}

function siteOf(event: any) {
  return String(metadataOf(event).site || "");
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

export default async function PortfolioActivityPage() {
  const events = await listRecentProductionCorridorEvents(10000);
  const portfolioEvents = events.filter((event: any) => event.corridorId === "portfolio-network");
  const wnoEvents = events.filter((event: any) => event.corridorId === "wno-commerce");
  const snapshot = getHandoffAnalyticsSnapshot(500);

  const siteRows = SITES.map((site) => {
    const siteEvents = portfolioEvents.filter((event: any) => siteOf(event) === site.id);
    const latest = [...siteEvents]
      .map((event) => ({ event, date: eventTime(event) }))
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0] || null;
    const handoffs = siteEvents.filter((event: any) => originalName(event).includes("handoff")).length;
    const bookingIntent = siteEvents.filter((event: any) => event.eventName === "booking_opened" || originalName(event).includes("booking") || originalName(event).includes("checkout")).length;
    const recommendations = siteEvents.filter((event: any) => event.eventName === "recommendation_rendered" || originalName(event).includes("recommend")).length;
    const status = freshness(latest?.date || null, siteEvents.length);
    return { ...site, siteEvents, latest, handoffs, bookingIntent, recommendations, status };
  });

  const active = siteRows.filter((row) => row.status === "active").length;
  const stale = siteRows.filter((row) => row.status === "stale").length;
  const unseen = siteRows.filter((row) => row.status === "unseen").length;

  const latestPortfolio = [...portfolioEvents]
    .map((event) => ({ event, date: eventTime(event) }))
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
    .slice(0, 30);

  const wnoFareHarbor = wnoEvents.filter((event: any) => event.eventName === "booking_opened").length;
  const attentionCount = snapshot.urgentAlerts.length + stale + unseen;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-[#f5c66c]">DCC Portfolio Desktop</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Portfolio activity</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 md:text-base">
              Which properties are talking to DCC, what kind of intent they are producing, and which network lanes have gone quiet enough to deserve inspection.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/portfolio" className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-black hover:bg-white/10">← Portfolio cockpit</Link>
            <Link href="/admin/satellite-handoffs" className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 py-3 text-sm font-black text-black">Open handoffs →</Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Portfolio events" value={portfolioEvents.length} />
          <Metric label="Active ≤24h" value={active} />
          <Metric label="Stale >7d" value={stale} alert={stale > 0} />
          <Metric label="No telemetry seen" value={unseen} alert={unseen > 0} />
          <Metric label="Needs inspection" value={attentionCount} alert={attentionCount > 0} />
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Commercial signal</div>
              <h2 className="mt-2 text-2xl font-black">DCC is seeing real intent</h2>
            </div>
            <div className="text-sm text-zinc-300">WNO FareHarbor opens: <strong className="text-white">{wnoFareHarbor}</strong> · Handoff revenue: <strong className="text-white">${snapshot.grossRevenue.toLocaleString()}</strong></div>
          </div>
        </section>

        <section className="mt-8">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Site-by-site network health</div>
          <h2 className="mt-2 text-2xl font-black">Every property on one board</h2>
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
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <MiniMetric label="Events" value={row.siteEvents.length} />
                  <MiniMetric label="Handoffs" value={row.handoffs} />
                  <MiniMetric label="Intent" value={row.bookingIntent} />
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
                  <div className="flex justify-between gap-3"><span>Last seen</span><strong className="text-white">{ageLabel(row.latest?.date || null)}</strong></div>
                  <div className="mt-2 flex justify-between gap-3"><span>Last event</span><span className="max-w-[60%] truncate text-right text-zinc-200">{row.latest ? originalName(row.latest.event) : "—"}</span></div>
                  <div className="mt-2 flex justify-between gap-3"><span>Recommendations</span><span>{row.recommendations}</span></div>
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
