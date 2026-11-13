import type { Metadata } from "next";
import Link from "next/link";
import TrackedCruisePromenadeLink from "@/app/components/dcc/TrackedCruisePromenadeLink";
import JsonLd from "@/app/components/dcc/JsonLd";
import PageActionBar from "@/app/components/dcc/PageActionBar";
import {
  CRUISE_SHORE_EXCURSION_DECISIONS,
  CRUISE_SHORE_EXCURSION_FAQ,
  CRUISE_SHORE_EXCURSION_REGIONS,
  CRUISE_SHORE_EXCURSION_VIDEOS,
} from "@/src/data/cruise-shore-excursions-guide";
import { buildMapsSearchUrl, type PageAction } from "@/src/lib/page-actions";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/dcc/jsonld";

const PAGE_URL = "https://destinationcommandcenter.com/cruises/shore-excursions";

export const metadata: Metadata = {
  title: "Cruise Shore Excursions Guide | Best Regions, Booking Strategy, and Reality Checks",
  description:
    "Practical cruise shore excursion guidance covering Alaska, Caribbean, Mediterranean, independent vs ship-booked decisions, and recent traveler reality checks.",
  keywords: [
    "cruise shore excursions",
    "best cruise excursions",
    "ship booked vs independent excursions",
    "shore excursion planning",
    "cruise port tours",
  ],
  alternates: { canonical: "/cruises/shore-excursions" },
  openGraph: {
    title: "Cruise Shore Excursions Guide",
    description:
      "High-signal shore excursion picks, booking tradeoffs, and recent traveler evidence for cruise planning.",
    url: PAGE_URL,
    type: "website",
  },
};

export default function CruiseShoreExcursionsPage() {
  const actions: PageAction[] = [
    { href: "/cruises", label: "Back to Cruise Explorer", kind: "internal" },
    { href: "/ports", label: "Open Ports Directory", kind: "internal" },
    { href: buildMapsSearchUrl("cruise port shore excursions"), label: "Open port excursion search in Maps", kind: "external" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(180deg,_#111318_0%,_#090a0d_100%)] text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path: "/cruises/shore-excursions",
              headline: "Cruise Shore Excursions Guide",
              description:
                "Practical cruise shore excursion guidance across Alaska, Caribbean, Europe, and long-haul ports, with booking strategy and recent traveler reality checks.",
              dateModified: "2026-03-12",
            }),
            buildBreadcrumbJsonLd([
              { name: "Cruises", item: "/cruises" },
              { name: "Shore Excursions Guide", item: "/cruises/shore-excursions" },
            ]),
            buildFaqJsonLd(CRUISE_SHORE_EXCURSION_FAQ),
          ],
        }}
      />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-16">
        <header className="space-y-5">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">DCC Cruise Excursions Guide</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Cruise Shore Excursions Guide</h1>
          <p className="max-w-4xl text-lg text-zinc-200">
            Shore excursions work best when you plan around transfer friction, crowd pressure, weather, and actual usable port time. Use this guide to separate high-value picks from overrated bus days.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <PageActionBar title="Useful excursion actions" actions={actions} />

        {/* DCC Cruise Shore Excursions Decision & Evidence Brief */}
        <section
          aria-label="DCC Cruise Shore Excursions Decision & Evidence Brief"
          data-testid="dcc-cruise-authority-brief"
          data-dcc-authority-market="cruise-ports"
          className="rounded-[1.75rem] border border-emerald-400/30 bg-emerald-950/20 p-6 md:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                DCC Public Authority · Direct Answer &amp; Verified Port Timing Evidence
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white md:text-3xl">
                How to Choose a Cruise Shore Excursion Without Missing All-Aboard
              </h2>
            </div>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              Verified Dock Clearance · 2-Hour Buffer Rule · Cruise Promenade Handoff
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                1. Berth &amp; Tender Friction Changes Your Real Clock (Juneau / Ketchikan)
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                In Juneau, downtown walk-off docks (<strong>CT, FKL, AS</strong>) clear in <strong>20–25 min</strong>, whereas <strong>AJ Dock requires a 35-min shuttle transfer</strong> and <strong>anchor/tender calls require ~50 min outbound + ~40 min return queue</strong>. Always deduct dock clearance + DCC&apos;s <strong>mandatory 2-hour (120-minute) recommended return-to-ship buffer</strong> before booking independent excursions.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                2. Juneau Whale Watching vs. Helicopter Glacier Landing Windows
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                <strong>Auke Bay Whale Watching</strong> requires <strong>210–240 min dock-to-dock</strong> (including 25–30 min road transfer each way). <strong>Mendenhall Helicopter Glacier Landings</strong> require <strong>180–255 min dock-to-dock</strong> (including mandatory 30–45 min flight check-in/weigh-in at JNU heliport). Never stack both unless your ship is berthed <strong>9+ hours</strong> at a walk-off pier.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs text-zinc-200">
              <thead className="border-b border-white/10 bg-white/[0.04] uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Port / Excursion Corridor</th>
                  <th className="px-4 py-3">Dock-to-Dock Window</th>
                  <th className="px-4 py-3">Berth / Transfer Constraint</th>
                  <th className="px-4 py-3">Verified Status / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="px-4 py-3 font-semibold text-white">Juneau · Auke Bay Whale Watching</td>
                  <td className="px-4 py-3 text-emerald-300">210–240 min total</td>
                  <td className="px-4 py-3">25–30m transfer to Auke Bay each way + 90m ship buffer</td>
                  <td className="px-4 py-3">Safe on 7h+ port call; tight on tender calls</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-white">Juneau · Helicopter Glacier Landing (JNU)</td>
                  <td className="px-4 py-3 text-cyan-300">180–255 min total</td>
                  <td className="px-4 py-3">30–45m mandatory pre-flight weigh-in &amp; safety briefing</td>
                  <td className="px-4 py-3">High ceiling/visibility dependency; book morning slot</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-white">Eastern Caribbean · Nassau &amp; St. Thomas (`INDY-2027-01-24`)</td>
                  <td className="px-4 py-3 text-amber-300">Verified Port Call Windows</td>
                  <td className="px-4 py-3">Nassau (`254526P1` $150) &amp; St. Thomas (`7452P2` $89.99)</td>
                  <td className="px-4 py-3">San Juan held in preview until exact ship berth window locks</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/25 bg-black/40 p-4">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                Recommended Next Step · Cruise Promenade Sailing &amp; Port Planner
              </div>
              <p className="text-xs text-zinc-300">
                Inspect sailing-specific port windows, verified shore excursions, and safety holds where port timing is unresolved on <strong>Cruise Promenade</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <TrackedCruisePromenadeLink
                href="https://cruisepromenade.com/p/INDY-2027-01-24?src=dcc-authority-cruise&from=dcc-cruises-shore-excursions"
                testId="dcc-authority-to-cp-indy"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-950 hover:bg-emerald-300"
              >
                Open Cruise Promenade Sailing Plan (`INDY-2027-01-24`) →
              </TrackedCruisePromenadeLink>
              <TrackedCruisePromenadeLink
                href="https://cruisepromenade.com?src=dcc-authority-cruise&from=dcc-cruises-shore-excursions"
                testId="dcc-authority-to-cp-home"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/15"
              >
                Explore Cruise Promenade →
              </TrackedCruisePromenadeLink>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Best for</p>
            <p className="mt-2 text-lg font-semibold">Cruisers comparing regions, operators, and day types</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">What changes most</p>
            <p className="mt-2 text-lg font-semibold">Crowds, transfer time, operator quality, and weather risk</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Planning rule</p>
            <p className="mt-2 text-lg font-semibold">Do not treat every port day like a generic tours marketplace</p>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-bold">How to use this shore-excursions guide</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                Shore-excursion searches usually look simple, but the real decision is whether the stop supports an easy beach day, a wildlife or scenery priority, a bus-heavy inland route, or a port day that should stay close to the ship because of timing and friction.
              </p>
              <p>
                This page is meant to answer that strategy question first, then push travelers into region-specific examples, port pages, or tendering guidance depending on what will actually shape the day.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">Best next clicks</div>
              <div className="mt-4 grid gap-3">
                <a href="https://cruisepromenade.com/p/INDY-2027-01-24?src=dcc-authority-cruise" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20">Cruise Promenade Sailing Planner →</a>
                <Link href="/ports" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Ports directory</Link>
                <Link href="/cruises/tendering" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Tendering guide</Link>
                <Link href="/ports/juneau" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Juneau example</Link>
                <Link href="/ports/santorini" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Santorini example</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-bold">Region-by-region high-signal picks</h2>
          <div className="mt-5 space-y-5">
            {CRUISE_SHORE_EXCURSION_REGIONS.map((region) => (
              <article key={region.title} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <h3 className="text-xl font-bold text-zinc-100">{region.title}</h3>
                <p className="mt-3 max-w-3xl text-sm text-zinc-300">{region.summary}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {region.picks.map((pick) => (
                    <div key={pick.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <h4 className="text-lg font-semibold text-zinc-100">{pick.title}</h4>
                      <p className="mt-2 text-sm text-zinc-300">{pick.body}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-bold">How to decide between ship-booked and independent</h2>
            <div className="mt-4 space-y-3">
              {CRUISE_SHORE_EXCURSION_DECISIONS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-lg font-semibold text-zinc-100">{item.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{item.body}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-2xl font-bold">Common excursion failure modes</h2>
            <ul className="mt-4 space-y-3 text-zinc-300">
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Too much coach time relative to actual destination time.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Crowd compression at the most famous stops and photo points.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Weak operator quality hidden behind a familiar headline attraction.</li>
              <li className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">Weather or tendering friction that shrinks the useful shore window.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-bold">Best-fit excursion planning lanes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Scenery-first stop</h3>
              <p className="mt-2 text-sm text-zinc-300">Choose fewer transfers and more direct landscape payoff when the port is famous for views or wildlife.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Easy beach day</h3>
              <p className="mt-2 text-sm text-zinc-300">Not every port needs a complicated tour. Simple beach or reef plans often outperform coach-heavy itineraries.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">History or inland route</h3>
              <p className="mt-2 text-sm text-zinc-300">Use more caution when the attraction is far from port and timing buffers start eating the day.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Constraint-heavy port</h3>
              <p className="mt-2 text-sm text-zinc-300">Tendering, crowd pressure, and weather can make conservative excursion choices the better value.</p>
            </article>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Reality Check Videos</p>
          <h2 className="mt-2 text-2xl font-bold">Recent traveler footage worth using as evidence</h2>
          <p className="mt-3 max-w-3xl text-sm text-zinc-400">
            These are illustrative references from recent traveler footage, not official cruise-line guidance. Conditions vary by ship, line, port, operator, and weather.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {CRUISE_SHORE_EXCURSION_VIDEOS.map((video) => (
              <a
                key={video.href}
                href={video.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{video.source}</p>
                <h3 className="mt-2 text-lg font-semibold text-zinc-100">{video.title}</h3>
                <p className="mt-3 text-sm text-zinc-300">{video.whyItMatters}</p>
                <p className="mt-4 text-sm font-semibold text-emerald-200">Open video evidence →</p>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-2xl font-bold">Common shore excursion questions</h2>
          <div className="mt-4 space-y-3">
            {CRUISE_SHORE_EXCURSION_FAQ.map((item) => (
              <details key={item.question} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <summary className="cursor-pointer list-none font-semibold text-zinc-100">{item.question}</summary>
                <p className="mt-3 text-sm text-zinc-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/ports/juneau" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Alaska example: Juneau</h2>
            <p className="mt-2 text-zinc-300">
              Compare whale watching, glacier access, and wildlife timing against the real transfer and weather constraints.
            </p>
          </Link>
          <Link href="/ports/cozumel-mexico" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Caribbean example: Cozumel</h2>
            <p className="mt-2 text-zinc-300">
              Use a reef-and-beach-heavy port to compare simple water days against bus-heavy inland alternatives.
            </p>
          </Link>
          <Link href="/ports/santorini" className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Mediterranean example: Santorini</h2>
            <p className="mt-2 text-zinc-300">
              Good reference when crowd timing and cable-car pressure change the value of the shore day.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
