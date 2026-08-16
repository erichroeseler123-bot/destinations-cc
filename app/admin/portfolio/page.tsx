import Link from "next/link";

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
  {
    name: "DCC Command View",
    site: "Destination Command Center",
    href: "/command",
    purpose: "Public network pulse, corridor health, destination status, alerts, tactical recommendations, and event stream.",
    status: "live",
  },
  {
    name: "Portfolio Handoffs",
    site: "Destination Command Center",
    href: "/admin/satellite-handoffs",
    purpose: "Cross-site handoffs, lifecycle events, failures, revenue, partner outcomes, and source-page performance.",
    status: "live",
  },
  {
    name: "Live Pulse Admin",
    site: "Destination Command Center",
    href: "/admin/live-pulse",
    purpose: "Post and inspect short-lived destination signals for cities, ports, venues, and events.",
    status: "live",
  },
  {
    name: "EarthOS Mission Control",
    site: "Destination Command Center",
    href: "/internal/dashboard",
    purpose: "Mission queue, running/completed/failed states, approvals, launch panel, and priority rail.",
    status: "existing",
  },
  {
    name: "WNO Revenue Opportunity",
    site: "Welcome to New Orleans Tours",
    href: "/internal/dashboard/wno-revenue-opportunity",
    purpose: "Entry sessions, tour-detail opens, FareHarbor opens, funnel ratios, top sources, pages, and products.",
    status: "live",
  },
  {
    name: "WNO Concierge QA",
    site: "Welcome to New Orleans Tours",
    href: "/new-orleans/admin/qa",
    purpose: "Internal chooser and tour QA surface for the New Orleans storefront.",
    status: "existing",
  },
  {
    name: "Vibing Around Admin",
    site: "Vibe Around Town",
    href: "https://vibearoundtown.com/admin",
    purpose: "Admin dashboard backed by Supabase admin authentication, with driver and marketplace operations.",
    status: "existing",
    external: true,
    note: "Requires a valid Vibe Around Town admin user.",
  },
  {
    name: "Founding Driver Applications",
    site: "Vibe Around Town",
    href: "https://vibearoundtown.com/admin/drivers",
    purpose: "Review founding driver applications and recruiting pipeline state.",
    status: "existing",
    external: true,
    note: "Requires a valid Vibe Around Town admin user.",
  },
  {
    name: "GoSno Operations Queue",
    site: "GoSno",
    href: "https://gosno.co/admin/operations-queue",
    purpose: "Manual-intervention queue for payment/provisioning issues, Rezdy IDs, retries, resolutions, and refund escalation.",
    status: "existing",
    external: true,
  },
  {
    name: "PARR Inventory",
    site: "Party at Red Rocks",
    href: "https://www.partyatredrocks.com/admin/parr-inventory",
    purpose: "PARR-owned fleet inventory console and service-day capacity board.",
    status: "existing",
    external: true,
  },
  {
    name: "Friend Fleet Inventory",
    site: "Party at Red Rocks",
    href: "https://www.partyatredrocks.com/admin/friend-fleet-inventory",
    purpose: "Partner/friend fleet inventory surface kept separate from PARR-owned capacity.",
    status: "existing",
    external: true,
  },
  {
    name: "Cruise Promenade Command Center",
    site: "Cruise Promenade",
    href: "https://cruisepromenade.com/internal/dashboard/",
    purpose: "Older command-center UI with network KPIs, decision quality, conversion funnel, port money map, expansion queue, SEO acquisition, and plan virality.",
    status: "legacy",
    external: true,
    note: "Substantial existing UI; needs live-route verification and data-source cleanup before treating it as authoritative.",
  },
];

const tone = {
  live: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
  existing: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
  legacy: "border-amber-400/20 bg-amber-500/10 text-amber-100",
};

export default function PortfolioDesktopPage() {
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
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">One front door for the admin UIs we already built</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 md:text-base">
              This is the archaeology index: use the existing consoles instead of rebuilding them. Green is already part of the active DCC operating layer, cyan is a real existing admin surface, and amber is an older interface worth recovering selectively.
            </p>
          </div>
          <Link href="/command" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-black">
            Open public Command View →
          </Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Active DCC consoles" value={counts.live} />
          <Metric label="Existing site admins" value={counts.existing} />
          <Metric label="Legacy dashboards found" value={counts.legacy} />
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {consoles.map((console) => (
            <article key={`${console.site}:${console.name}`} className="flex min-h-[260px] flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{console.site}</div>
                  <h2 className="mt-2 text-xl font-black">{console.name}</h2>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone[console.status]}`}>
                  {console.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-300">{console.purpose}</p>
              {console.note ? <p className="mt-3 text-xs leading-5 text-amber-100/80">{console.note}</p> : null}
              <div className="mt-auto pt-6">
                {console.external ? (
                  <a href={console.href} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                    Open console ↗
                  </a>
                ) : (
                  <Link href={console.href} className="inline-flex min-h-10 items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                    Open console →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-[#f5c66c]/20 bg-[#f5c66c]/[0.06] p-6">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#f5c66c]">What becomes the master desktop</div>
          <h2 className="mt-2 text-2xl font-black">DCC Admin is the shell; site consoles remain specialist tools.</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-300">
            The next consolidation step is not to rewrite GoSno, Vibe, PARR, WNO, or Cruise Promenade admin logic. It is to surface their health, key counts, and alerts here while keeping deep operational actions inside the specialist console that already owns them.
          </p>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}
