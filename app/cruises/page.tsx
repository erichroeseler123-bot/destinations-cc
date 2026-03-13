import type { Metadata } from "next";
import Link from "next/link";
import DiagnosticsBlock from "@/app/components/DiagnosticsBlock";
import StatGrid from "@/app/components/StatGrid";
import StaleWarning from "@/app/components/StaleWarning";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import {
  listCruiseCanonicalPortSlugs,
  listCruiseEmbarkCanonicalPortSlugs,
} from "@/lib/dcc/internal/cruisePayload";
import { getCruiseHealthSummary } from "@/lib/dcc/internal/cruiseHealthSummary";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";
import { CRUISE_SPECIALTY_LANES } from "@/src/data/cruise-specialty-lanes";

const SAMPLE_SHIPS = ["icon-of-the-seas", "viking-octantis", "carnival-jubilee"];
const PAGE_URL = "https://destinationcommandcenter.com/cruises";

export const metadata: Metadata = {
  title: "Cruise Explorer | Ports, Ships, and Route Intelligence",
  description:
    "Explore cruise ports and ship profiles with logistics-first context and linked destination authority pages.",
  alternates: { canonical: "/cruises" },
  openGraph: {
    title: "Cruise Explorer",
    description:
      "Port-level cruise intelligence with practical route context and connected destination hubs.",
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
      <CinematicBackdrop />
      <div className="relative max-w-4xl mx-auto px-6 py-16 space-y-8">
      <header className="space-y-2">
        <RouteHeroMark eyebrow="Destination Command Center" title="CRUISE ROUTE ENGINE" tone="cyan" />
        <p className="dcc-hero-enter dcc-hero-enter-2 text-xs uppercase tracking-wider text-zinc-500">DCC Cruises</p>
        <h1 className="dcc-hero-enter dcc-hero-enter-3 text-4xl font-black tracking-tight">Cruise Explorer</h1>
        <p className="dcc-hero-enter dcc-hero-enter-4 text-zinc-300">
          Explore cruise schedules by port with truth-first context and optional external booking actions.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Link
          href="/mighty-argo-shuttle"
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-zinc-200"
        >
          Argo Shuttle Layer
        </Link>
        <Link
          href="/vegas"
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-zinc-200"
        >
          Vegas Layer
        </Link>
        <Link
          href="/alaska"
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-zinc-200"
        >
          Alaska Layer
        </Link>
        <Link
          href="/national-parks"
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-zinc-200"
        >
          National Parks Map
        </Link>
        <Link
          href="/new-orleans"
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-zinc-200"
        >
          New Orleans Layer
        </Link>
        <Link
          href="/cruises/tendering"
          className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-3 text-cyan-100"
        >
          Tendering Guide
        </Link>
        <Link
          href="/cruises/shore-excursions"
          className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-3 text-emerald-100"
        >
          Shore Excursions Guide
        </Link>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        {samplePorts.map((port) => (
          <Link
            key={port}
            href={`/cruises/port/${port}`}
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-zinc-200"
          >
            /cruises/port/{port}
          </Link>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Cruises From Popular Ports</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {departurePorts.map((port) => (
            <Link
              key={port}
              href={`/cruises/from/${port}`}
              className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-3 text-cyan-100"
            >
              /cruises/from/{port}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Ship Profiles</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {SAMPLE_SHIPS.map((ship) => (
            <Link
              key={ship}
              href={`/cruises/ship/${ship}`}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-zinc-200"
            >
              /cruises/ship/{ship}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Specialty Cruise Lanes</h2>
        <div className="grid gap-3">
          {CRUISE_SPECIALTY_LANES.map((lane) => (
            <article
              key={lane.key}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Specialty lane</p>
                <h3 className="text-xl font-bold mt-1">{lane.title}</h3>
                <p className="text-zinc-300 mt-2">{lane.description}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/cruises/themed/${lane.key}`}
                  className="rounded-xl bg-fuchsia-500 px-4 py-2.5 text-white font-semibold hover:bg-fuchsia-400"
                >
                  Open themed lane
                </Link>
                <Link
                  href={lane.ctaHref}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-zinc-100 font-semibold hover:bg-white/10"
                >
                  {lane.ctaLabel}
                </Link>
              </div>

              {lane.organizers?.length ? (
                <p className="text-sm text-zinc-400">
                  Organizers: {lane.organizers.join(", ")}
                </p>
              ) : null}

              <div className="grid sm:grid-cols-3 gap-2">
                {lane.intents.map((intent) => (
                  <Link
                    key={intent.query}
                    href={`/tours?q=${encodeURIComponent(intent.query)}`}
                    className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200 hover:bg-black/30"
                  >
                    {intent.label}
                  </Link>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Featured Ports</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lane.featuredPortSlugs.map((slug) => (
                      <Link
                        key={slug}
                        href={`/cruises/port/${slug}`}
                        className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-zinc-200 hover:bg-white/10"
                      >
                        {slug}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Featured Ships</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lane.featuredShipSlugs.map((slug) => (
                      <Link
                        key={slug}
                        href={`/cruises/ship/${slug}`}
                        className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-zinc-200 hover:bg-white/10"
                      >
                        {slug}
                      </Link>
                    ))}
                  </div>
                </div>
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
            <p className="text-sm text-amber-300">
              No live provider snapshot available.
            </p>
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
          <Link
            href="/api/internal/cruises/providers/health"
            className="inline-block text-xs text-cyan-300 hover:text-cyan-200"
          >
            View raw health JSON →
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
            <div className="grid sm:grid-cols-2 gap-2">
              {pulse.map((row) => (
                <Link
                  key={row.place_id}
                  href={`/nodes/${row.place_slug}`}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300 hover:bg-black/30"
                >
                  <span className="font-medium">{row.title}</span>
                  <span className="text-zinc-500">
                    {" "}
                    • tours {row.action_counts.tours} • cruises {row.action_counts.cruises} • trend{" "}
                    {row.trend}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/api/internal/graph/health"
            className="inline-block text-xs text-cyan-300 hover:text-cyan-200"
          >
            View graph health JSON →
          </Link>
        </div>
      </section>
      </div>
    </main>
  );
}
