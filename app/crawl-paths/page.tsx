import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/dcc/jsonld";
import {
  listCruiseCanonicalPortSlugs,
  listCruiseEmbarkCanonicalPortSlugs,
  listCruiseShipSlugs,
} from "@/lib/dcc/internal/cruisePayload";
import {
  getAttractionsManifest,
  getCategoriesManifest,
  getCityManifest,
  listManifestCitySlugs,
} from "@/lib/dcc/manifests/cityExpansion";
import { PORT_AUTHORITY_CONFIG } from "@/src/data/port-authority-config";
import { OVERLAY_REGISTRY } from "@/src/data/overlay-registry";
import { ROAD_TRIPS_REGISTRY } from "@/src/data/road-trips-registry";
import { ROAD_TRIP_OVERLAYS_REGISTRY } from "@/src/data/road-trip-overlays-registry";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Crawl Paths and Discovery Links | Destination Command Center",
  description:
    "Plain-link crawl map for Destination Command Center, connecting core hubs to city guides, attractions, category pages, and tours.",
  alternates: { canonical: "/crawl-paths" },
  openGraph: {
    title: "Crawl Paths and Discovery Links | Destination Command Center",
    description:
      "Plain-link crawl map for Destination Command Center, connecting core hubs to city guides, attractions, category pages, and tours.",
    url: "https://destinationcommandcenter.com/crawl-paths",
    type: "website",
  },
};

const CORE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/cities", label: "Cities" },
  { href: "/usa", label: "USA" },
  { href: "/tours", label: "Tours" },
  { href: "/authority", label: "Authority" },
  { href: "/ports", label: "Ports" },
  { href: "/alerts", label: "Alerts" },
];

const VEGAS_VERTICALS = [
  { href: "/vegas", label: "Vegas hub" },
  { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
  { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
  { href: "/las-vegas/casinos", label: "Las Vegas casinos" },
  { href: "/las-vegas/pools", label: "Las Vegas pools" },
  { href: "/las-vegas/helicopter-tours", label: "Las Vegas helicopter tours" },
  { href: "/las-vegas/best-day-trips", label: "Las Vegas day trips" },
  { href: "/las-vegas/shows", label: "Las Vegas shows" },
];

export default function CrawlPathsPage() {
  const citySlugs = listManifestCitySlugs().slice(0, 24);
  const cityEntries = citySlugs.map((slug) => ({
    slug,
    city: getCityManifest(slug),
    categories: (getCategoriesManifest(slug)?.categories || []).slice(0, 4),
    attractions: (getAttractionsManifest(slug)?.attractions || []).slice(0, 4),
  }));
  const cruisePorts = listCruiseCanonicalPortSlugs().slice(0, 10);
  const embarkPorts = listCruiseEmbarkCanonicalPortSlugs().slice(0, 8);
  const cruiseShips = listCruiseShipSlugs().slice(0, 8);
  const authorityPorts = Object.keys(PORT_AUTHORITY_CONFIG).slice(0, 10);
  const overlays = OVERLAY_REGISTRY.slice(0, 12);
  const roadTrips = ROAD_TRIPS_REGISTRY.slice(0, 8);
  const roadTripOverlays = ROAD_TRIP_OVERLAYS_REGISTRY.slice(0, 8);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": "https://destinationcommandcenter.com/crawl-paths",
              url: "https://destinationcommandcenter.com/crawl-paths",
              name: "Crawl Paths and Discovery Links",
              description:
                "Plain-link crawl map for Destination Command Center, connecting core hubs to city guides, attractions, category pages, and tours.",
            },
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Crawl Paths", item: "/crawl-paths" },
            ]),
          ],
        }}
      />

      <div className="mx-auto max-w-7xl space-y-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.26em] text-cyan-300">Discovery Map</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Crawl paths and internal discovery links</h1>
          <p className="max-w-4xl text-zinc-300">
            This page exists as a plain-link crawl ladder so search engines can move from core site hubs into city guides, then into attraction and category pages without relying only on search, scripts, or parameterized pages.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold">Core hubs</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {CORE_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/84 transition hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">City crawl ladders</h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-zinc-400">
              Each block links a city hub to the main supporting surfaces that are easiest to crawl and most likely to capture long-tail searches.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {cityEntries.map(({ slug, city, categories, attractions }) => {
              const cityName = city?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
              return (
                <section key={slug} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <h3 className="text-xl font-bold">{cityName}</h3>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link href={`/${slug}`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
                      {cityName} guide
                    </Link>
                    <Link href={`/${slug}/tours`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
                      {cityName} tours
                    </Link>
                    <Link href={`/${slug}/attractions`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
                      {cityName} attractions
                    </Link>
                    <Link href={`/${slug}/things-to-do`} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
                      Things to do in {cityName}
                    </Link>
                  </div>

                  {categories.length ? (
                    <div className="mt-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Category pages</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {categories.map((item) => (
                          <Link
                            key={item.slug}
                            href={`/${slug}/${item.slug}`}
                            className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/78 hover:bg-white/10"
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {attractions.length ? (
                    <div className="mt-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Attraction pages</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attractions.map((item) => (
                          <Link
                            key={item.slug}
                            href={`/${slug}/${item.slug}`}
                            className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/78 hover:bg-white/10"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold">Cruises and ports</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-zinc-400">
            These links create a direct crawl path into the cruise explorer, departure ports, cruise ports, ships, and port authority pages.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Cruise hubs</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/cruises" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                  Cruises
                </Link>
                <Link href="/cruises/tendering" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                  Cruise tendering
                </Link>
                <Link href="/cruises/shore-excursions" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                  Shore excursions
                </Link>
                <Link href="/ports" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                  Ports directory
                </Link>
              </div>
              <div className="mt-5 text-xs uppercase tracking-[0.2em] text-cyan-300">Departure ports</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {embarkPorts.map((slug) => (
                  <Link key={slug} href={`/cruises/from/${slug}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                    {slug}
                  </Link>
                ))}
              </div>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Cruise ports and ships</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {cruisePorts.map((slug) => (
                  <Link key={slug} href={`/cruises/port/${slug}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                    {slug}
                  </Link>
                ))}
              </div>
              <div className="mt-5 text-xs uppercase tracking-[0.2em] text-cyan-300">Ships</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {cruiseShips.map((slug) => (
                  <Link key={slug} href={`/cruises/ship/${slug}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                    {slug}
                  </Link>
                ))}
              </div>
            </article>
          </div>
          <div className="mt-5">
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Port authority pages</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {authorityPorts.map((slug) => (
                <Link key={slug} href={`/ports/${slug}`} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/78 hover:bg-white/10">
                  {slug}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold">Las Vegas verticals</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-zinc-400">
            Vegas has enough standalone demand that these pages deserve a direct crawl ladder outside the general city path.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {VEGAS_VERTICALS.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/84 hover:bg-white/10">
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold">Overlay discovery</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-zinc-400">
            Overlay pages target traveler constraints and intent modifiers like pet-friendly, accessibility, smoking rules, and family fit.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {overlays.map((item) => (
              <Link key={item.slug} href={item.canonicalPath} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/84 hover:bg-white/10">
                {item.overlayType} {item.citySlug}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold">Road trips and scenic routes</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-zinc-400">
            These pages create an alternate crawl path into route-based intent, scenic-drive overlays, and stop-by-stop travel planning.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Road-trip routes</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/road-trips" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                  Road trips hub
                </Link>
                {roadTrips.map((item) => (
                  <Link key={item.slug} href={`/road-trips/${item.slug}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                    {item.title}
                  </Link>
                ))}
              </div>
            </article>
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Road-trip overlays</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {roadTripOverlays.map((item) => (
                  <Link key={item.slug} href={item.canonicalPath} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                    {item.overlayType} route
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
