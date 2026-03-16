import Link from "next/link";
import type { Metadata } from "next";
import CityGrid from "@/app/components/CityGrid";
import HomeCitySearch from "@/app/components/HomeCitySearch";
import FeaturedIntel from "@/app/components/FeaturedIntel";
import { getAllCities } from "@/lib/data/locations";
import { pickCitySlugByName, topCities } from "@/lib/data/cityPick";
import { getPlanetaryEvents, getPlanetarySummary } from "@/lib/dcc/memory/resolve";
import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { serializeAliveFilter } from "@/lib/dcc/taxonomy/lanes";
import { SITE_IDENTITY } from "@/src/data/site-identity";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/dcc/jsonld";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: SITE_IDENTITY.homepageTitle,
  description: SITE_IDENTITY.homepageDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_IDENTITY.name,
    description: SITE_IDENTITY.homepageDescription,
    url: SITE_IDENTITY.siteUrl,
    type: "website",
  },
};

export default function HomePage() {
  const cities = getAllCities();

  const vegas = pickCitySlugByName("Las Vegas") || "cities?q=las%20vegas";
  const miami = pickCitySlugByName("Miami") || "cities?q=miami";

  const topUS = topCities({ country: "US", limit: 18 });
  const topGlobal = topCities({ limit: 18 });
  const planetarySummary = getPlanetarySummary();
  const planetaryRecent = getPlanetaryEvents(10);
  const graphPulse = listPlaceGraphSummaries(8);
  const graphHealth = getGraphHealth();

  return (
    <main className="min-h-screen text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [buildOrganizationJsonLd(), buildWebsiteJsonLd()],
        }}
      />
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-14">
        <section
          id="featured-hubs"
          className="relative overflow-hidden rounded-[2rem] border border-[#f5c66c]/20 bg-[linear-gradient(180deg,rgba(20,17,15,0.92),rgba(10,10,10,0.88))] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.45)] md:p-14"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,198,108,0.2),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.08),transparent_22%)]" />
          <div className="relative space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#f5c66c]">
                Premium destination intelligence
              </p>
              <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] md:text-6xl">
                {SITE_IDENTITY.homepageHeroTitle}
              </h1>
              <p className="max-w-3xl text-lg font-medium leading-relaxed text-[#f8f4ed]/88 md:text-2xl">
                {SITE_IDENTITY.homepageHeroSummary}
              </p>
              <p className="max-w-2xl text-sm uppercase tracking-[0.18em] text-[#efe5d3]/70">
                Live city context, high-intent travel pages, and command-center style trip planning.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
              <HomeCitySearch cities={cities as any} />

              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5c66c]">
                  Network status
                </div>
                <div className="mt-4 grid gap-4">
                  <div>
                    <div className="text-3xl font-black text-white">{topUS.length}</div>
                    <div className="text-sm text-[#f8f4ed]/66">Top US hubs highlighted</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">{graphHealth.places}</div>
                    <div className="text-sm text-[#f8f4ed]/66">Places indexed in graph pulse</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">{planetarySummary?.count ?? 0}</div>
                    <div className="text-sm text-[#f8f4ed]/66">Recent timeline events</div>
                  </div>
                </div>
              </div>
            </div>

            <FeaturedIntel />

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/cities"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#f8f4ed] transition hover:bg-white/[0.1]"
              >
                Browse All Cities
              </Link>
              <Link
                href="/usa"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#f8f4ed] transition hover:bg-white/[0.1]"
              >
                USA Tourist Cities
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#f8f4ed] transition hover:bg-white/[0.1]"
              >
                About DCC
              </Link>
              <Link
                href={vegas.startsWith("cities?") ? `/${vegas}` : `/${vegas}`}
                className="inline-flex items-center justify-center rounded-full border border-[#f5c66c]/20 bg-[linear-gradient(180deg,#f5c66c,#21c6da)] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#120f0b] shadow-[0_18px_38px_rgba(245,198,108,0.12)] transition hover:scale-[1.02]"
              >
                Explore Las Vegas
              </Link>
              <Link
                href={miami.startsWith("cities?") ? `/${miami}` : `/${miami}`}
                className="inline-flex items-center justify-center rounded-full border border-[#d29a3a]/30 bg-[#d29a3a]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#efe5d3] transition hover:bg-[#d29a3a]/15"
              >
                Explore Miami
              </Link>
            </div>
          </div>
        </section>

        <CityGrid
          title="Top USA Cities"
          subtitle="Fast entry points to high-intent destination pages with a warmer editorial presentation."
          cities={topUS}
        />

        <CityGrid
          title="Top Global Cities"
          subtitle="High-volume global hubs framed more like featured venue guides than utilitarian directory links."
          cities={topGlobal}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/about"
            className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.86),rgba(15,13,12,0.92))] p-6 transition hover:border-[#f5c66c]/30 hover:bg-white/[0.04]"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">Authority</div>
            <div className="mt-3 text-xl font-black uppercase">About DCC</div>
            <div className="mt-2 text-sm text-[#f8f4ed]/70">What the platform covers and how it helps travelers.</div>
            <div className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#efe5d3]">Open guide</div>
          </Link>

          <Link
            href="/ports"
            className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.86),rgba(15,13,12,0.92))] p-6 transition hover:border-[#f5c66c]/30 hover:bg-white/[0.04]"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">Embarkation</div>
            <div className="mt-3 text-xl font-black uppercase">Ports Directory</div>
            <div className="mt-2 text-sm text-[#f8f4ed]/70">Cruise ports, embarkation guides, and nearby planning.</div>
            <div className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#efe5d3]">Open directory</div>
          </Link>

          <Link
            href="/tours"
            className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.86),rgba(15,13,12,0.92))] p-6 transition hover:border-[#f5c66c]/30 hover:bg-white/[0.04]"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">Experiences</div>
            <div className="mt-3 text-xl font-black uppercase">Tours Hub</div>
            <div className="mt-2 text-sm text-[#f8f4ed]/70">Browse tour catalog and city tour pages.</div>
            <div className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#efe5d3]">Open tours</div>
          </Link>
        </section>

        <section id="trend-watch" className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 space-y-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <header className="space-y-1">
            <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">Trend Watch</div>
            <h2 className="text-2xl font-black uppercase">What&apos;s Alive Now</h2>
            <p className="text-sm text-[#f8f4ed]/66">
              Fresh destination activity, alerts, and place updates.
            </p>
          </header>
          <div>
            <Link
              href="/alerts"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#f8f4ed] transition hover:bg-white/10"
            >
              Open alerts hub
              <span className="text-[#f5c66c]">→</span>
            </Link>
          </div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#f8f4ed]/46">
            places={graphHealth.places} • edges={graphHealth.edges} • stale={graphHealth.stale ? "yes" : "no"}
          </p>
          {graphPulse.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {graphPulse.map((row) => (
                <Link
                  key={row.place_id}
                  href={`/nodes/${row.place_slug}?alive=${encodeURIComponent(serializeAliveFilter(["tours", "cruises"]))}`}
                  className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4 transition hover:border-[#f5c66c]/30 hover:bg-black/30"
                >
                  <div className="font-bold uppercase text-zinc-100">{row.title}</div>
                  <div className="mt-1 text-xs text-[#f8f4ed]/60">
                    tours {row.action_counts.tours} • cruises {row.action_counts.cruises} • trend {row.trend}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#f8f4ed]/46">No graph pulse entries available yet.</p>
          )}
        </section>

        <section id="planetary-timeline" className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 space-y-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <header className="space-y-1">
            <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">Timeline</div>
            <h2 className="text-2xl font-black uppercase">Planetary Timeline</h2>
            <p className="text-sm text-[#f8f4ed]/66">
              Recent destination updates across the network.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
            <div className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#f8f4ed]/46">Events</div>
              <div className="text-xl font-black text-[#f5c66c]">
                {planetarySummary?.count ?? 0}
              </div>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#f8f4ed]/46">Active Places</div>
              <div className="text-xl font-black text-[#f5c66c]">
                {planetarySummary?.unique_places ?? 0}
              </div>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#f8f4ed]/46">Window Days</div>
              <div className="text-xl font-black text-[#f5c66c]">
                {planetarySummary?.window_days ?? 0}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm uppercase tracking-[0.22em] text-[#f8f4ed]/46">Latest 10 Events</h3>
            {planetaryRecent.length > 0 ? (
              <div className="space-y-2">
                {planetaryRecent.map((ev) => {
                  const dt = new Date(ev.timestamp);
                  const ts = Number.isNaN(dt.getTime())
                    ? ev.timestamp
                    : dt.toISOString().replace("T", " ").slice(0, 16);
                  return (
                    <div
                      key={ev.id}
                      className="rounded-[1rem] border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[#f8f4ed]/46">{ts}</div>
                      <div className="mt-1 text-sm text-[#f8f4ed]">
                        {ev.title} <span className="text-[#f8f4ed]/46">({ev.event_type})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#f8f4ed]/46">No planetary events yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
