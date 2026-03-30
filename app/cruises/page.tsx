import type { Metadata } from "next";
import Link from "next/link";
import DiagnosticsBlock from "@/app/components/DiagnosticsBlock";
import StatGrid from "@/app/components/StatGrid";
import StaleWarning from "@/app/components/StaleWarning";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import JsonLd from "@/app/components/dcc/JsonLd";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import {
  listCruiseCanonicalPortSlugs,
  listCruiseEmbarkCanonicalPortSlugs,
} from "@/lib/dcc/internal/cruisePayload";
import { getCruiseHealthSummary } from "@/lib/dcc/internal/cruiseHealthSummary";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";
import { CRUISE_SPECIALTY_LANES } from "@/src/data/cruise-specialty-lanes";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";

const SAMPLE_SHIPS = ["icon-of-the-seas", "viking-octantis", "carnival-jubilee"];
const PAGE_URL = "https://destinationcommandcenter.com/cruises";

export const metadata: Metadata = {
  title: "Cruise Explorer | Understand The Cruise That Fits You",
  description:
    "Understand how cruise types actually differ, then move into a fit-first decision surface before you worry about booking.",
  keywords: [
    "what cruise should I take",
    "best cruise line",
    "cruise planner",
    "cruise ships",
    "cruise embarkation guides",
  ],
  alternates: { canonical: "/cruises" },
  openGraph: {
    title: "Cruise Explorer",
    description:
      "A cruise understanding hub that explains the major cruise lanes and routes users into a fit-first decision surface.",
    url: PAGE_URL,
    type: "website",
  },
};

export default async function CruisesPage() {
  const samplePorts = listCruiseCanonicalPortSlugs().slice(0, 8);
  const departurePorts = listCruiseEmbarkCanonicalPortSlugs().slice(0, 6);
  const health = getCruiseHealthSummary();
  const graphHealth = getGraphHealth();
  const pulse = listPlaceGraphSummaries(6);

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path: "/cruises",
              headline: "Cruise Explorer",
              description:
                "Understand how cruise types actually differ, then move into a fit-first decision surface before you worry about booking.",
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Cruises", item: "/cruises" },
            ]),
          ],
        }}
      />
      <CinematicBackdrop />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-4">
          <RouteHeroMark eyebrow="Destination Command Center" title="CRUISE DECISION HUB" tone="cyan" />
          <p className="dcc-hero-enter dcc-hero-enter-2 text-xs uppercase tracking-wider text-zinc-500">DCC Cruises</p>
          <h1 className="dcc-hero-enter dcc-hero-enter-3 text-4xl font-black tracking-tight">Cruises vary more than people expect.</h1>
          <p className="dcc-hero-enter dcc-hero-enter-4 max-w-3xl text-zinc-300">
            The biggest mistake usually is not booking a cruise. It is choosing the wrong one for how you actually travel. Use this hub to understand the real cruise lanes, then move into a fit-first satellite that helps you decide what kind of trip makes sense before any booking pressure exists.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/cruises/fit"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition hover:bg-cyan-200"
            >
              Figure Out What Fits You
            </Link>
            <Link
              href="/cruises/shore-excursions"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
            >
              Explore Cruise Lanes
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">What this page does</div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                Cruise search intent usually hides a harder question underneath it: do you want scenery, ship energy, low-friction logistics, premium calm, or the cheapest possible way onto the water? People often compare lines before they have answered that part.
              </p>
              <p>
                This hub exists to stop that comparison drift. It explains the major cruise planning lanes clearly, then hands off into a dedicated fit surface so the next decision feels informed instead of random.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Decision sequence</div>
            <div className="mt-4 space-y-3 text-sm text-cyan-50">
              <p>1. Understand what actually changes the trip.</p>
              <p>2. Figure out what kind of cruise fits you.</p>
              <p>3. Only then move into a narrower port, ship, or excursion lane.</p>
            </div>
            <Link href="/cruises/fit" className="mt-5 inline-flex text-sm font-semibold text-cyan-100 underline-offset-4 hover:underline">
              Open the cruise fit satellite
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h2 className="text-base font-semibold">Embarkation first</h2>
            <p className="mt-2 text-sm text-zinc-300">Start with departure ports when airport transfers, pre-cruise nights, and arrival friction matter most.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h2 className="text-base font-semibold">Ship first</h2>
            <p className="mt-2 text-sm text-zinc-300">Use ship profiles when onboard fit, line identity, or crowd feel matters more than the departure city.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h2 className="text-base font-semibold">Port-day buyer</h2>
            <p className="mt-2 text-sm text-zinc-300">Move into shore-excursion and port pages when the stop itself is the real decision.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h2 className="text-base font-semibold">Constraint-heavy trip</h2>
            <p className="mt-2 text-sm text-zinc-300">Use logistics guides when timing, transfers, or mobility friction could break the day.</p>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Best next move</div>
              <h2 className="mt-2 text-2xl font-black">Use the fit satellite before you compare too many ships.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
                The fit page is where broad cruise curiosity turns into a clearer recommendation. It is not a booking tool. It is the place where someone finally understands what kind of cruise matches how they travel.
              </p>
            </div>
            <Link
              href="/cruises/fit"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-500/10 px-5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Start with fit
            </Link>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Cruises From Popular Ports</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {departurePorts.map((port) => (
                <Link
                  key={port}
                  href={`/cruises/from/${port}`}
                  className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  /cruises/from/{port}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Ship Profiles</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SAMPLE_SHIPS.map((ship) => (
                <Link
                  key={ship}
                  href={`/cruises/ship/${ship}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-200 transition hover:bg-white/10"
                >
                  /cruises/ship/{ship}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Cruise Ports</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {samplePorts.map((port) => (
              <Link
                key={port}
                href={`/cruises/port/${port}`}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-200 transition hover:bg-white/10"
              >
                /cruises/port/{port}
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Specialty Cruise Lanes</h2>
          <div className="grid gap-3">
            {CRUISE_SPECIALTY_LANES.map((lane) => (
              <article key={lane.key} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Specialty lane</p>
                  <h3 className="mt-1 text-xl font-bold">{lane.title}</h3>
                  <p className="mt-2 text-zinc-300">{lane.description}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/cruises/themed/${lane.key}`}
                    className="rounded-xl bg-fuchsia-500 px-4 py-2.5 font-semibold text-white hover:bg-fuchsia-400"
                  >
                    Open themed lane
                  </Link>
                  <Link
                    href={lane.ctaHref}
                    className="rounded-xl border border-white/15 px-4 py-2.5 font-semibold text-zinc-100 hover:bg-white/10"
                  >
                    {lane.ctaLabel}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Provider Health</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <StatGrid
              items={[
                {
                  label: "Configured providers",
                  value: `${health.totals.providers_configured}/${health.totals.providers_total}`,
                },
                { label: "Live rows", value: health.totals.live_rows },
                { label: "Provider errors", value: health.totals.provider_errors },
                {
                  label: "Snapshot age (minutes)",
                  value:
                    health.status.age_minutes !== null
                      ? health.status.age_minutes.toFixed(1)
                      : "n/a",
                },
              ]}
            />
            {!health.status.exists ? (
              <p className="text-sm text-amber-300">No live provider snapshot available.</p>
            ) : null}
            <StaleWarning
              stale={health.status.exists && health.status.stale}
              message="Provider health snapshot is stale. Refresh automation may be behind."
            />
            <div className="space-y-2">
              {health.providerRows.map((row) => (
                <div
                  key={row.provider}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300"
                >
                  <span className="font-medium">{row.provider}</span>
                  {" • "}
                  {row.configured ? (row.ok ? "ok" : "error") : "not configured"}
                  {" • rows="}
                  {row.live_rows}
                  {row.error ? ` • ${row.error}` : ""}
                </div>
              ))}
            </div>
            <DiagnosticsBlock diagnostics={health.diagnostics} title="Health Diagnostics" />
            <Link href="/alerts" className="inline-block text-xs text-cyan-300 hover:text-cyan-200">
              Open alerts hub →
            </Link>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">What&apos;s Alive Here Now</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-sm text-zinc-400">
              graph_places={graphHealth.places} • graph_edges={graphHealth.edges} • graph_stale=
              {graphHealth.stale ? "yes" : "no"}
            </p>
            {pulse.length === 0 ? (
              <p className="text-sm text-zinc-500">No graph pulse entries available yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {pulse.map((row) => (
                  <Link
                    key={row.place_id}
                    href={`/nodes/${row.place_slug}`}
                    className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300 hover:bg-black/30"
                  >
                    <span className="font-medium">{row.title}</span>
                    <span className="text-zinc-500">
                      {" "}• tours {row.action_counts.tours} • cruises {row.action_counts.cruises} • trend {row.trend}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/crawl-paths" className="inline-block text-xs text-cyan-300 hover:text-cyan-200">
              Open crawl paths →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
