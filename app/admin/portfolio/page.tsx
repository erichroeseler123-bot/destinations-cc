import Link from "next/link";
import { getHandoffAnalyticsSnapshot } from "@/lib/dcc/handoffAnalytics";
import { readRuntimeSignals, sweepExpiredSignals } from "@/lib/dcc/livePulse/store";
import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import { listWorkflowMissions } from "@/lib/dcc/earthos/workflows/service";
import {
  listPortfolioSupplierConnections,
  type SupplierConnectionRecord,
} from "@/lib/dcc/operatorOnboardingStore";

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
  { name: "Portfolio Activity", site: "Destination Command Center", href: "/admin/portfolio/activity", purpose: "Shows recent activity, handoffs, and booking intent by site.", status: "live" },
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

function formatLastChecked(isoString: string | null | undefined) {
  if (!isoString) return "Not checked";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Not checked";
  return `${date.toISOString().slice(0, 10)} · ${date.toISOString().slice(11, 19)} UTC`;
}

function pickParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | null {
  if (!params) return null;
  const val = params[key];
  if (typeof val === "string" && val.trim()) return val.trim();
  if (Array.isArray(val) && typeof val[0] === "string" && val[0].trim()) {
    return val[0].trim();
  }
  return null;
}

export default async function PortfolioDesktopPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = props?.searchParams
    ? await props.searchParams
    : undefined;
  const checkSavedParam = pickParam(resolvedSearchParams, "checkSaved");
  const checkErrorParam = pickParam(resolvedSearchParams, "checkError");
  const checkedCompanyId = pickParam(resolvedSearchParams, "checkedCompany");
  const checkedProductId = pickParam(resolvedSearchParams, "checkedProduct");
  const checkedType = pickParam(resolvedSearchParams, "checkType");
  const checkedAtParam = pickParam(resolvedSearchParams, "checkedAt");

  const [events, missions, supplierConnections] = await Promise.all([
    listRecentProductionCorridorEvents(10000),
    listWorkflowMissions(),
    listPortfolioSupplierConnections(),
  ]);

  const recentCheckBannerProduct =
    checkedCompanyId && checkedProductId
      ? supplierConnections
          .find((c) => c.companyId === checkedCompanyId)
          ?.productsAndBookingLinks.find((p) => p.productId === checkedProductId)
      : undefined;
  const recentCheckRecord =
    checkSavedParam !== "0" &&
    recentCheckBannerProduct &&
    checkedType === "booking_link"
      ? recentCheckBannerProduct.bookingLinkCheck
      : checkSavedParam !== "0" &&
          recentCheckBannerProduct &&
          checkedType === "live_inventory"
        ? recentCheckBannerProduct.liveInventoryCheck
        : null;

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

  const checkoutVerifiedCount = supplierConnections.filter(
    (s) => s.checkoutVerified.verified,
  ).length;
  const livePricesAndSeatsVerifiedCount = supplierConnections.filter(
    (s) => s.livePricesAndSeatsVerified.verified,
  ).length;
  const plannerDisplayVerifiedCount = supplierConnections.filter(
    (s) => s.plannerLiveDisplayVerified.verified,
  ).length;
  const supplierAttentionCount = supplierConnections.filter(
    (s) => !s.checkoutVerified.verified || !s.livePricesAndSeatsVerified.verified,
  ).length;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-[#f5c66c]">DCC Portfolio Desktop</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Portfolio cockpit</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 md:text-base">
              One protected screen for supplier connections, network activity, money signals, site handoffs, live conditions, mission attention, and the specialist admin consoles already built across the portfolio.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/portfolio/activity" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Portfolio activity →</Link>
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

        <section id="supplier-connections" data-testid="portfolio-supplier-connections" className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#f5c66c]">Catalog + Operator Readiness</div>
              <h2 className="mt-2 text-2xl font-black">Supplier Connections</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                Unifies the DCC storefront catalog and operator readiness records (<code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-200">lib/dcc/operatorOnboardingStore.ts</code>) and saves every product check durably in DCC&apos;s Postgres database (<code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-200">earthos_control_map_findings</code>). Tracks <strong>Checkout reachable</strong>, <strong>Live inventory verified</strong>, and <strong>Displayed in DCC planner</strong> as separate statuses with real check timestamps (<code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-200">Not checked</code> when no record exists).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <MiniMetric label="Companies" value={supplierConnections.length} />
              <MiniMetric label="Checkout reachable" value={`${checkoutVerifiedCount}/${supplierConnections.length}`} />
              <MiniMetric label="Live inventory" value={`${livePricesAndSeatsVerifiedCount}/${supplierConnections.length}`} />
              <MiniMetric label="In DCC planner" value={`${plannerDisplayVerifiedCount}/${supplierConnections.length}`} />
              <MiniMetric label="Needs attention" value={supplierAttentionCount} />
            </div>
          </div>

          {checkSavedParam === "0" || checkErrorParam ? (
            <div
              data-testid="supplier-check-error-banner"
              className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/10 p-4 text-xs leading-5 text-rose-100"
            >
              <div className="font-black uppercase tracking-[0.14em] text-rose-300">
                Check persistence failed — result was not saved
              </div>
              <div className="mt-1 text-rose-100/90">
                {checkErrorParam || "Database write did not succeed."}
              </div>
            </div>
          ) : null}

          {recentCheckRecord ? (
            <div
              data-testid="supplier-check-saved-banner"
              className="mt-4 rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-4 text-xs leading-5 text-emerald-100"
            >
              <div className="font-black uppercase tracking-[0.14em] text-emerald-300">
                Saved {recentCheckRecord.checkType === "booking_link" ? "booking link check" : "live inventory check"} · {formatLastChecked(recentCheckRecord.checkedAt || checkedAtParam)} · DB finding: {recentCheckRecord.findingId || "verified"}
              </div>
              <div className="mt-1 font-bold text-white">
                {recentCheckRecord.productTitle} ({recentCheckRecord.productId}) — {recentCheckRecord.statusLabel}
              </div>
              <div className="mt-0.5 text-emerald-100/90">{recentCheckRecord.whatItProves}</div>
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-black/20">
            <table className="w-full min-w-[1260px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">
                  <th className="px-4 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Products and booking links</th>
                  <th className="px-4 py-3.5">Checkout reachable</th>
                  <th className="px-4 py-3.5">Live inventory verified</th>
                  <th className="px-4 py-3.5">Displayed in DCC planner</th>
                  <th className="px-4 py-3.5">Last checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {supplierConnections.map((company) => (
                  <SupplierConnectionRow key={company.companyId} company={company} />
                ))}
              </tbody>
            </table>
          </div>
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

function SupplierConnectionRow({ company }: { company: SupplierConnectionRecord }) {
  const checkoutTone = company.checkoutVerified.verified
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
    : company.checkoutVerified.checkedAt
      ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";

  const seatsTone = company.livePricesAndSeatsVerified.verified
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
    : company.livePricesAndSeatsVerified.checkedAt
      ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";

  const plannerTone = company.plannerLiveDisplayVerified.verified
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
    : "border-cyan-400/25 bg-cyan-500/10 text-cyan-100";

  return (
    <tr data-testid={`supplier-connection-row-${company.companyId}`} className="align-top">
      <td className="px-4 py-4">
        <div className="font-black text-white">{company.companyName}</div>
        <div className="mt-1 text-xs text-zinc-400">{company.market}</div>
        <div className="mt-2 inline-flex rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
          {company.bookingSystem}
        </div>
        {company.providerShortname ? (
          <div className="mt-1.5 text-[11px] font-mono text-zinc-500">
            shortname: {company.providerShortname}
          </div>
        ) : null}
      </td>

      <td className="px-4 py-4" data-testid={`supplier-products-${company.companyId}`}>
        <ul className="space-y-3">
          {company.productsAndBookingLinks.map((prod) => {
            const isGoSno = company.companyId === "gosno" || company.providerShortname === "gosno";
            const defaultRoute = prod.productId.includes("breckenridge")
              ? "DEN-BRECKENRIDGE"
              : "DEN-VAIL";
            const defaultPickupDate = isGoSno ? "2026-12-15" : "2026-11-18";
            const defaultPickupTime = "10:00";
            const defaultPartySize = prod.productId.includes("quote")
              ? 16
              : prod.productId.includes("breckenridge")
                ? 6
                : isGoSno
                  ? 4
                  : 2;
            const defaultVehicleClass = prod.productId.includes("quote")
              ? "van"
              : prod.productId.includes("breckenridge")
                ? "suv"
                : "suv";

            return (
              <li
                key={prod.productId}
                data-testid={`supplier-product-item-${prod.productId}`}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-white">{prod.title}</div>
                  <span className="font-mono text-[11px] text-zinc-500">{prod.productId}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <Link
                    href={prod.dccPageHref}
                    className="inline-flex items-center rounded border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 font-semibold text-cyan-200 hover:bg-cyan-500/20"
                  >
                    DCC page: {prod.dccPageHref} →
                  </Link>
                  {prod.bookingHref ? (
                    <a
                      href={prod.bookingHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-200 hover:bg-emerald-500/20"
                    >
                      {prod.bookingLinkLabel} ↗
                    </a>
                  ) : (
                    <span className="inline-flex items-center rounded border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                      {prod.bookingLinkLabel}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 grid gap-2 rounded-md border border-white/10 bg-black/30 p-2 text-[11px] leading-4 text-zinc-300">
                  <div data-testid={`product-booking-check-${prod.productId}`}>
                    <span className="font-bold text-zinc-200">Booking link check: </span>
                    {prod.bookingLinkCheck ? (
                      <>
                        <span className={prod.bookingLinkCheck.verified ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"}>
                          {prod.bookingLinkCheck.statusLabel}
                        </span>{" "}
                        <span className="font-mono text-zinc-400">
                          ({formatLastChecked(prod.bookingLinkCheck.checkedAt)})
                        </span>
                        <div className="mt-0.5 text-zinc-400">{prod.bookingLinkCheck.whatItProves}</div>
                      </>
                    ) : (
                      <span className="font-mono text-zinc-400">Not checked</span>
                    )}
                  </div>
                  <div data-testid={`product-inventory-check-${prod.productId}`}>
                    <span className="font-bold text-zinc-200">Live inventory check: </span>
                    {prod.liveInventoryCheck ? (
                      <>
                        <span className={prod.liveInventoryCheck.verified ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"}>
                          {prod.liveInventoryCheck.statusLabel}
                        </span>{" "}
                        <span className="font-mono text-zinc-400">
                          ({formatLastChecked(prod.liveInventoryCheck.checkedAt)})
                        </span>
                        {prod.liveInventoryCheck.failureReason ? (
                          <span className="ml-1.5 rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] text-amber-200">
                            reason: {prod.liveInventoryCheck.failureReason}
                          </span>
                        ) : null}
                        <div className="mt-0.5 text-zinc-400">{prod.liveInventoryCheck.whatItProves}</div>
                      </>
                    ) : (
                      <span className="font-mono text-zinc-400">Not checked</span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <form action="/admin/portfolio/supplier-check" method="post">
                    <input type="hidden" name="companyId" value={company.companyId} />
                    <input type="hidden" name="productId" value={prod.productId} />
                    <input type="hidden" name="checkType" value="booking_link" />
                    <button
                      type="submit"
                      data-testid={`action-check-booking-link-${prod.productId}`}
                      className="inline-flex items-center rounded-md border border-white/20 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/15"
                    >
                      Check booking link
                    </button>
                  </form>
                  <form action="/admin/portfolio/supplier-check" method="post" className="flex flex-wrap items-center gap-1.5">
                    <input type="hidden" name="companyId" value={company.companyId} />
                    <input type="hidden" name="productId" value={prod.productId} />
                    <input type="hidden" name="checkType" value="live_inventory" />
                    {isGoSno ? (
                      <>
                        <input type="hidden" name="route" value={defaultRoute} />
                        <input type="hidden" name="pickupDate" value={defaultPickupDate} />
                        <input type="hidden" name="pickupTime" value={defaultPickupTime} />
                        <input type="hidden" name="partySize" value={String(defaultPartySize)} />
                        <input type="hidden" name="vehicleClass" value={defaultVehicleClass} />
                      </>
                    ) : (
                      <>
                        <input type="hidden" name="pickupDate" value={defaultPickupDate} />
                        <input type="hidden" name="partySize" value={String(defaultPartySize)} />
                      </>
                    )}
                    <button
                      type="submit"
                      data-testid={`action-check-live-inventory-${prod.productId}`}
                      className="inline-flex items-center rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-100 hover:bg-cyan-500/20"
                    >
                      Check live inventory
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </td>

      <td className="px-4 py-4" data-testid={`supplier-checkout-verified-${company.companyId}`}>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${checkoutTone}`}>
          {company.checkoutVerified.verified
            ? "Yes · Reachable"
            : company.checkoutVerified.checkedAt
              ? "No · Check Failed"
              : "Not checked"}
        </span>
        <div className="mt-2 text-xs font-bold text-zinc-200">{company.checkoutVerified.label}</div>
        <div className="mt-1 font-mono text-[11px] text-zinc-500">{company.checkoutVerified.code}</div>
        <div
          data-testid={`supplier-checkout-what-it-proves-${company.companyId}`}
          className="mt-2 rounded-md border border-white/10 bg-black/30 p-2 text-xs leading-5 text-zinc-300"
        >
          <strong className="block text-[10px] uppercase tracking-[0.12em] text-zinc-400">
            What this check proves
          </strong>
          {company.checkoutVerified.whatItProves}
        </div>
        <div className="mt-1.5 font-mono text-[11px] text-zinc-400">
          Checked: {formatLastChecked(company.checkoutVerified.checkedAt)}
        </div>
      </td>

      <td className="px-4 py-4" data-testid={`supplier-live-prices-seats-verified-${company.companyId}`}>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${seatsTone}`}>
          {company.livePricesAndSeatsVerified.verified
            ? "Yes · Trip Inventory Verified"
            : company.livePricesAndSeatsVerified.checkedAt
              ? "No · Check Provider"
              : "Not checked"}
        </span>
        <div className="mt-2 text-xs font-bold text-zinc-200">{company.livePricesAndSeatsVerified.label}</div>
        <div className="mt-1 font-mono text-[11px] text-zinc-500">{company.livePricesAndSeatsVerified.code}</div>
        <div
          data-testid={`supplier-live-what-it-proves-${company.companyId}`}
          className="mt-2 rounded-md border border-white/10 bg-black/30 p-2 text-xs leading-5 text-zinc-300"
        >
          <strong className="block text-[10px] uppercase tracking-[0.12em] text-zinc-400">
            What this check proves
          </strong>
          {company.livePricesAndSeatsVerified.whatItProves}
        </div>
        <div className="mt-1.5 font-mono text-[11px] text-zinc-400">
          Checked: {formatLastChecked(company.livePricesAndSeatsVerified.checkedAt)}
        </div>
      </td>

      <td className="px-4 py-4" data-testid={`supplier-planner-live-display-${company.companyId}`}>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${plannerTone}`}>
          {company.plannerLiveDisplayVerified.verified
            ? "Yes · Displayed in Planner"
            : "No · Static / Handoff"}
        </span>
        <div className="mt-2 text-xs font-bold text-zinc-200">
          {company.plannerLiveDisplayVerified.statusLabel}
        </div>
        <div className="mt-2 rounded-md border border-white/10 bg-black/30 p-2 text-xs leading-5 text-zinc-300">
          <strong className="block text-[10px] uppercase tracking-[0.12em] text-zinc-400">
            Separate planner display status
          </strong>
          {company.plannerLiveDisplayVerified.whatItProves}
        </div>
      </td>

      <td className="px-4 py-4" data-testid={`supplier-last-checked-${company.companyId}`}>
        <div
          data-testid={`supplier-last-checked-label-${company.companyId}`}
          className="font-mono text-xs font-bold text-white"
        >
          {formatLastChecked(company.lastChecked)}
        </div>
        {company.lastChecked ? (
          <div className="mt-0.5 font-mono text-[11px] text-zinc-500">{company.lastChecked}</div>
        ) : null}
        <div className="mt-2 space-y-1 border-t border-white/10 pt-2 font-mono text-[11px] text-zinc-400">
          <div>Booking links: {formatLastChecked(company.bookingLinksLastChecked)}</div>
          <div>Live inventory: {formatLastChecked(company.liveInventoryLastChecked)}</div>
        </div>
        {company.needsAttentionNote ? (
          <div className="mt-2.5 max-w-xs rounded-lg border border-amber-300/20 bg-amber-400/10 p-2 text-xs leading-5 text-amber-100">
            <strong className="block text-[10px] uppercase tracking-[0.12em] text-amber-300">Needs attention</strong>
            {company.needsAttentionNote}
          </div>
        ) : (
          <div className="mt-2.5 text-xs text-emerald-300">All readiness gates verified.</div>
        )}
      </td>
    </tr>
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

