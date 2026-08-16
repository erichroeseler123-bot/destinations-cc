import Link from "next/link";
import { getHandoffAnalyticsSnapshot } from "@/lib/dcc/handoffAnalytics";
import { readRuntimeSignals, sweepExpiredSignals } from "@/lib/dcc/livePulse/store";
import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import { listWorkflowMissions } from "@/lib/dcc/earthos/workflows/service";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type ConsoleCard = {
  name: string;
  site: string;
  href: string;
  purpose: string;
  status: "live" | "existing" | "legacy";
  note?: string;
  external?: boolean;
};

const consoles: ConsoleCard[] = [
  { name: "DCC Command View", site: "Destination Command Center", href: "/command", purpose: "Public network pulse, corridor health, destination status, alerts, tactical recommendations, and event stream.", status: "live" },
  { name: "Portfolio Handoffs", site: "Destination Command Center", href: "/admin/satellite-handoffs", purpose: "Cross-site handoffs, lifecycle events, failures, revenue, partner outcomes, and source-page performance.", status: "live" },
  { name: "Live Pulse Admin", site: "Destination Command Center", href: "/admin/live-pulse", purpose: "Post and inspect short-lived destination signals for cities, ports, venues, and events.", status: "live" },
  { name: "EarthOS Mission Control", site: "Destination Command Center", href: "/internal/dashboard", purpose: "Mission queue, running/completed/failed states, approvals, launch panel, and priority rail.", status: "existing" },
  { name: "WNO Revenue Opportunity", site: "Welcome to New Orleans Tours", href: "/internal/dashboard/wno-revenue-opportunity", purpose: "Entry sessions, tour-detail opens, FareHarbor opens, funnel ratios, top sources, pages, and products.", status: "live" },
  { name: "WNO Concierge QA", site: "Welcome to New Orleans Tours", href: "/new-orleans/admin/qa", purpose: "Internal chooser and tour QA surface for the New Orleans storefront.", status: "existing" },
  { name: "Vibing Around Admin", site: "Vibe Around Town", href: "https://vibearoundtown.com/admin", purpose: "Admin dashboard backed by Supabase admin authentication, with driver and marketplace operations.", status: "existing", external: true, note: "Private reservation/driver counts stay behind Vibe admin auth. DCC shows network activity here without weakening that boundary." },
  { name: "Founding Driver Applications", site: "Vibe Around Town", href: "https://vibearoundtown.com/admin/drivers", purpose: "Review founding driver applications and recruiting pipeline state.", status: "existing", external: true, note: "Requires a valid Vibe Around Town admin user." },
  { name: "GoSno Operations Queue", site: "GoSno", href: "https://gosno.co/admin/operations-queue", purpose: "Manual-intervention queue for payment/provisioning issues, Rezdy IDs, retries, resolutions, and refund escalation.", status: "existing", external: true, note: "Private exception details remain in GoSno. DCC shows handoff/network activity and portfolio alerts." },
  { name: "PARR Inventory", site: "Party at Red Rocks", href: "https://www.partyatredrocks.com/admin/parr-inventory", purpose: "PARR-owned fleet inventory console and service-day capacity board.", status: "existing", external: true },
  { name: "Friend Fleet Inventory", site: "Party at Red Rocks", href: "https://www.partyatredrocks.com/admin/friend-fleet-inventory", purpose: "Partner/friend fleet inventory surface kept separate from PARR-owned capacity.", status: "existing", external: true },
  { name: "Cruise Promenade Command Center", site: "Cruise Promenade", href: "https://cruisepromenade.com/internal/dashboard/", purpose: "Older command-center UI with network KPIs, decision quality, conversion funnel, port money map, expansion queue, SEO acquisition, and plan virality.", status: "legacy", external: true, note: "DCC now receives planner-save/share telemetry; the old dashboard is retained as a specialist historical interface." },
];

const tone = {
  live: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
  existing: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  legacy: "border-amber-400/20 bg-amber-500/10 text-amber-100",
};

function pct(n: number, d: number) {
  return d ? `${Math.round((n / d) * 100)}%` : "—";
}

function metadataOf(event: any) {
  return event?.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, any> : {};
}

function siteOf(event: any) {
  return String(metadataOf(event).site || "");
}

function originalName(event: any) {
  return String(metadataOf(event).original_event_name || event?.eventName || "");
}

export default async function PortfolioDesktopPage() {
  const [events, missions] = await Promise.all([
    listRecentProductionCorridorEvents(10000),
    listWorkflowMissions(),
  ]);

  sweepExpiredSignals(new Date());
  const signals = readRuntimeSignals();
  const activeSignals = signals.filter((signal) => signal.status === "active");
  const snapshot = getHandoffAnalyticsSnapshot(500);

  const portfolioEvents = events.filter((event: any) => event.corridorId === "portfolio-network");
  const wno = events.filter((event: any) => event.corridorId === "wno-commerce");
  const wnoLanding = wno.filter((event: any) => event.eventName === "landing_viewed");
  const wnoProduct = wno.filter((event: any) => event.eventName === "product_opened");
  const wnoBooking = wno.filter((event: any) => event.eventName === "booking_opened");

  const cruise = portfolioEvents.filter((event: any) => siteOf(event) === "cruise-promenade");
  const cruisePlannerSaves = cruise.filter((event: any) => originalName(event) === "planner_saved").length;
  const cruisePlannerShares = cruise.filter((event: any) => originalName(event) === "planner_shared").length;

  const vibe = portfolioEvents.filter((event: any) => siteOf(event) === "vibing-around");
  const vibeHandoffs = vibe.filter((event: any) => originalName(event).includes("handoff")).length;

  const gosno = portfolioEvents.filter((event: any) => siteOf(event) === "gosno");
  const gosnoBookingIntent = gosno.filter((event: any) => event.eventName === "booking_opened").length;

  const parrHandoffs = snapshot.bySatellite.partyatredrocks || 0;
  const gosnoHandoffs = snapshot.bySatellite.gosno || 0;
  const alaskaHandoffs = snapshot.bySatellite["welcome-to-alaska"] || 0;
  const vegasHandoffs = snapshot.bySatellite.saveonthestrip || 0;

  const missionWaiting = missions.filter((mission: any) => mission.status === "waiting").length;
  const missionFailed = missions.filter((mission: any) => mission.status === "failed").length;
  const attention = snapshot.urgentAlerts.length + missionWaiting + missionFailed;

  const counts = {
    live: consoles.filter((x) => x.status === "live").length,
    existing: consoles.filter((x) => x.status === "existing").length,
    legacy: consoles.filter((x) => x.status === "legacy").length,
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-[#f5c66c]">DCC Portfolio Desktop</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Portfolio cockpit</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 md:text-base">
              One protected screen for network activity, money signals, site handoffs, live conditions, mission attention, and the specialist admin consoles already built across the portfolio.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/satellite-handoffs" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Handoffs →</Link>
            <Link href="/command" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-black">Command View →</Link>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Tracked handoffs" value={snapshot.totalHandoffs} detail={`${snapshot.completed} completed`} />
          <Metric label="Gross handoff revenue" value={`$${snapshot.grossRevenue.toLocaleString()}`} detail={`$${snapshot.partnerRevenue.toLocaleString()} partner revenue`} />
          <Metric label="Needs attention" value={attention} detail={`${snapshot.urgentAlerts.length} alerts · ${missionWaiting} approvals · ${missionFailed} failed missions`} alert={attention > 0} />
          <Metric label="Active live signals" value={activeSignals.length} detail={`${signals.length} stored signals`} />
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Money + demand</div>
              <h2 className="mt-2 text-2xl font-black">What the portfolio is doing</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SiteMetricCard
              site="Welcome to New Orleans Tours"
              headline={`${wnoBooking.length} FareHarbor opens`}
              stats={[`Entry sessions: ${wnoLanding.length}`, `Tour opens: ${wnoProduct.length}`, `Entry → FareHarbor: ${pct(wnoBooking.length, wnoLanding.length)}`]}
              href="/internal/dashboard/wno-revenue-opportunity"
              source="Direct DCC commerce telemetry"
            />
            <SiteMetricCard
              site="Cruise Promenade"
              headline={`${cruisePlannerSaves} planner saves`}
              stats={[`Planner shares: ${cruisePlannerShares}`, `Network events: ${cruise.length}`, "Planner state is now flowing into DCC"]}
              href="https://cruisepromenade.com/internal/dashboard/"
              external
              source="DCC portfolio telemetry"
            />
            <SiteMetricCard
              site="Vibing Around"
              headline={`${vibe.length} DCC network events`}
              stats={[`Context handoffs: ${vibeHandoffs}`, "Driver/application detail remains private", "Open Vibe admin for operational records"]}
              href="https://vibearoundtown.com/admin"
              external
              source="DCC network telemetry + protected Vibe admin"
            />
            <SiteMetricCard
              site="GoSno"
              headline={`${gosnoHandoffs} tracked handoffs`}
              stats={[`Network events: ${gosno.length}`, `Booking-intent events: ${gosnoBookingIntent}`, "Exception details remain inside GoSno ops"]}
              href="https://gosno.co/admin/operations-queue"
              external
              source="DCC handoffs + network telemetry"
            />
            <SiteMetricCard
              site="Party at Red Rocks"
              headline={`${parrHandoffs} tracked handoffs`}
              stats={["PARR-owned fleet console exists", "Friend-fleet console stays separate", "Capacity actions remain inside PARR"]}
              href="https://www.partyatredrocks.com/admin/parr-inventory"
              external
              source="DCC satellite handoff telemetry"
            />
            <SiteMetricCard
              site="Alaska + Vegas satellites"
              headline={`${alaskaHandoffs + vegasHandoffs} tracked handoffs`}
              stats={[`Alaska: ${alaskaHandoffs}`, `Save On The Strip: ${vegasHandoffs}`, `Portfolio-network events: ${portfolioEvents.length}`]}
              href="/admin/satellite-handoffs"
              source="DCC satellite + portfolio telemetry"
            />
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Network attention</div>
            <h2 className="mt-2 text-2xl font-black">What needs a human</h2>
            <div className="mt-5 space-y-3">
              {snapshot.urgentAlerts.slice(0, 6).map((alert: any) => (
                <div key={alert.id} className={`rounded-xl border p-4 ${alert.severity === "high" ? "border-rose-400/30 bg-rose-500/10" : "border-amber-300/20 bg-amber-400/10"}`}>
                  <div className="flex items-center justify-between gap-4"><strong>{alert.label}</strong><span className="text-[10px] uppercase tracking-[0.16em] text-zinc-300">{alert.kind?.replaceAll?.("_", " ") || "alert"}</span></div>
                  <p className="mt-1 text-sm text-zinc-300">{alert.detail}</p>
                </div>
              ))}
              {snapshot.urgentAlerts.length === 0 && missionWaiting === 0 && missionFailed === 0 ? <p className="text-sm text-zinc-400">No urgent DCC handoff or mission alerts right now.</p> : null}
              {missionWaiting > 0 ? <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm"><strong>{missionWaiting} mission{missionWaiting === 1 ? "" : "s"}</strong> waiting for approval.</div> : null}
              {missionFailed > 0 ? <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm"><strong>{missionFailed} mission{missionFailed === 1 ? "" : "s"}</strong> failed and need review.</div> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Admin inventory</div>
            <h2 className="mt-2 text-2xl font-black">Interfaces recovered</h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <MiniMetric label="Active" value={counts.live} />
              <MiniMetric label="Existing" value={counts.existing} />
              <MiniMetric label="Legacy" value={counts.legacy} />
            </div>
            <p className="mt-5 text-sm leading-6 text-zinc-300">The cockpit summarizes what DCC can safely know. Private reservation, driver, refund, and fleet actions stay inside the specialist admin that owns them.</p>
          </div>
        </section>

        <section className="mt-8">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Deep consoles</div>
          <h2 className="mt-2 text-2xl font-black">Open the specialist tool when you need to act</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {consoles.map((console) => (
              <article key={`${console.site}:${console.name}`} className="flex min-h-[230px] flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div><div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{console.site}</div><h3 className="mt-2 text-xl font-black">{console.name}</h3></div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone[console.status]}`}>{console.status}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-300">{console.purpose}</p>
                {console.note ? <p className="mt-3 text-xs leading-5 text-amber-100/80">{console.note}</p> : null}
                <div className="mt-auto pt-6">
                  {console.external ? <a href={console.href} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Open console ↗</a> : <Link href={console.href} className="inline-flex min-h-10 items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Open console →</Link>}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, detail, alert = false }: { label: string; value: number | string; detail?: string; alert?: boolean }) {
  return <div className={`rounded-2xl border p-5 ${alert ? "border-amber-300/30 bg-amber-400/10" : "border-white/10 bg-white/[0.04]"}`}><div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</div><div className="mt-2 text-3xl font-black">{value}</div>{detail ? <div className="mt-2 text-xs text-zinc-400">{detail}</div> : null}</div>;
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center"><div className="text-2xl font-black">{value}</div><div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</div></div>;
}

function SiteMetricCard({ site, headline, stats, href, source, external = false }: { site: string; headline: string; stats: string[]; href: string; source: string; external?: boolean }) {
  const body = <><div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{site}</div><div className="mt-2 text-2xl font-black text-white">{headline}</div><ul className="mt-4 space-y-2 text-sm text-zinc-300">{stats.map((stat) => <li key={stat}>• {stat}</li>)}</ul><div className="mt-5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">{source}</div></>;
  return external ? <a href={href} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/25 hover:bg-white/[0.07]">{body}</a> : <Link href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/25 hover:bg-white/[0.07]">{body}</Link>;
}
