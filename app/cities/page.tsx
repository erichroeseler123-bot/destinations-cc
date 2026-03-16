import type { Metadata } from "next";
import Link from "next/link";
import { getAllCities } from "@/lib/data/locations";
import CitiesSearchClient from "./CitiesSearchClient";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import StatGrid from "@/app/components/StatGrid";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "City Guides and Destinations | Destination Command Center",
  description:
    "Browse city guides, destination pages, shows, tours, attractions, and transportation planning from Destination Command Center.",
  alternates: { canonical: "/cities" },
};

export default function CitiesPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const cities = getAllCities()
    .slice()
    .sort((a, b) => (b.metrics?.population ?? 0) - (a.metrics?.population ?? 0));

  const getModes = (city: (typeof cities)[number]) => ((city as { modes?: string[] }).modes || []);
  const tourismHeavy = cities.filter((city) => getModes(city).includes("tourism-heavy")).length;
  const eventHeavy = cities.filter((city) => getModes(city).includes("event-heavy")).length;
  const nightlifeHeavy = cities.filter((city) => getModes(city).includes("nightlife-heavy")).length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <CinematicBackdrop />
      <div className="relative max-w-7xl mx-auto px-6 py-16 space-y-8">
        <header className="space-y-3">
          <RouteHeroMark eyebrow="Destination Command Center" title="CITIES" tone="cyan" />
          <p className="text-xs uppercase tracking-wider text-zinc-500">Destination discovery</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            City guides and destination hubs
          </h1>
          <p className="max-w-3xl text-zinc-300">
            Browse the DCC city network for travel guides, shows, attractions, tours, and transportation-aware planning.
          </p>
          <p className="max-w-3xl text-sm text-zinc-500">
            {SITE_IDENTITY.name} helps travelers find what is happening in a place and how to get there.
          </p>
        </header>

        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Trip Planning Snapshot</p>
            <h2 className="text-2xl font-bold">What this hub helps you decide quickly</h2>
            <p className="text-sm text-zinc-200">
              Which city page is the right starting point for shows, attractions, transportation, nightlife, or broader trip planning.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Best for</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Travelers comparing cities before drilling into tours, live events, neighborhoods, and destination fit.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Typical use</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Use this page to move from a broad destination question into a specific city guide with real local context.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Good companion pages</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Tours • Alerts & Trends • Transportation • Ports
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">City network snapshot</h2>
            <p className="text-sm text-zinc-400">
              A quick read on how the current city set skews across travel demand, events, and nightlife.
            </p>
          </div>
          <StatGrid
            items={[
              { label: "Cities listed", value: cities.length.toLocaleString() },
              { label: "Tourism-heavy", value: tourismHeavy },
              { label: "Event-heavy", value: eventHeavy },
              { label: "Nightlife-heavy", value: nightlifeHeavy },
            ]}
          />
        </section>

        <PoweredByViator
          compact
          disclosure
          body="DCC helps travelers discover tours and activities in the right destination context. When you want to book, you can book with DCC via Viator, a trusted global travel experiences platform."
        />

        <CitiesSearchClient cities={cities as any} initialQuery={searchParams?.q || ""} />

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/tours" className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 hover:bg-cyan-500/20">
            <div className="font-semibold text-cyan-100">Tours hub</div>
            <p className="mt-2 text-sm text-zinc-300">
              Move from a city idea into tours and activities when you already know the destination.
            </p>
          </Link>
          <Link href="/alerts" className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 hover:bg-amber-500/20">
            <div className="font-semibold text-amber-100">Alerts & Trends</div>
            <p className="mt-2 text-sm text-zinc-300">
              Check live signal pressure before you lock in a city day, port call, or weather-sensitive plan.
            </p>
          </Link>
          <Link href="/authority" className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 hover:bg-emerald-500/20">
            <div className="font-semibold text-emerald-100">Planning hubs</div>
            <p className="mt-2 text-sm text-zinc-300">
              See how the main DCC surfaces fit together when you are not sure where to start.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
