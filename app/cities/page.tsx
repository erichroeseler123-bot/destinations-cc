import type { Metadata } from "next";
import Link from "next/link";
import { getAllCityHubs } from "@/lib/data/locations";
import CitiesSearchClient from "./CitiesSearchClient";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import StatGrid from "@/app/components/StatGrid";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import { buildNoindexRobots } from "@/lib/seo/indexingPolicy";

export const dynamic = "force-static";

const baseMetadata: Metadata = {
  title: "City Guides and Destinations | Destination Command Center",
  description:
    "Use the DCC city network to route into the right city guide, live plan, and transportation-aware travel surface.",
  alternates: { canonical: "/cities" },
  robots: buildNoindexRobots(),
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}): Promise<Metadata> {
  await searchParams;
  return baseMetadata;
}

export default async function CitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) || {};
  const cities = getAllCityHubs()
    .slice()
    .sort((a, b) => (b.metrics?.population ?? 0) - (a.metrics?.population ?? 0));
  const expansionSlugs = new Set([
    "washington-dc",
    "boston",
    "seattle",
    "honolulu",
    "phoenix",
    "scottsdale",
    "san-antonio",
    "tampa",
    "portland",
    "salt-lake-city",
  ]);
  const expandedCities = cities.filter((city) => expansionSlugs.has(city.slug));

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
          <p className="text-xs uppercase tracking-wider text-zinc-500">City routing</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Use the city network to start in the right place
          </h1>
          <p className="max-w-3xl text-zinc-300">
            Use the DCC city network when the real question is which city surface should shape the trip first, then route into the right guide, live plan, or transportation lane.
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
                Travelers narrowing the right city before moving into tours, live events, neighborhoods, and destination fit.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Typical use</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">
                Use this page to move from a broad destination question into the city guide that should shape the trip next.
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
              { label: "Newly expanded", value: expandedCities.length },
              { label: "Tourism-heavy", value: tourismHeavy },
              { label: "Event-heavy", value: eventHeavy },
              { label: "Nightlife-heavy", value: nightlifeHeavy },
            ]}
          />
        </section>

        {expandedCities.length ? (
          <section className="rounded-2xl border border-[#f5c66c]/20 bg-[#f5c66c]/10 p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-[#f5c66c]">Fresh rollout</p>
              <h2 className="text-2xl font-bold">Newly expanded city hubs</h2>
              <p className="text-sm text-zinc-200">
                These city nodes were promoted into the live DCC rollout and now surface as first-class city hubs instead of staying buried in manifest-only coverage.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {expandedCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/${city.slug}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-black/30"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-[#f5c66c]">Expansion lane</div>
                  <div className="mt-2 text-lg font-bold text-zinc-100">{city.name}</div>
                  <p className="mt-1 text-sm text-zinc-300">
                    {city.admin?.country || "—"}
                    {city.admin?.region_code ? ` • ${city.admin.region_code}` : ""}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">/{city.slug}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <PoweredByViator
          compact
          disclosure
          body="DCC helps travelers discover tours and activities in the right destination context. When you want to book, you can book with DCC via Viator, a trusted global travel experiences platform."
        />

        <CitiesSearchClient cities={cities as any} initialQuery={resolvedSearchParams?.q || ""} />

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
