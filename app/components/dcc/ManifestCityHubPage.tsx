import Link from "next/link";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import type { ViatorActionProduct } from "@/lib/dcc/action/viator";
import type { CityManifest } from "@/lib/dcc/manifests/cityExpansion";
import { getAttractionsManifest, getCategoriesManifest } from "@/lib/dcc/manifests/cityExpansion";
import { buildAttractionCardDescription, buildCityClusterNarrative, buildLongTailKeywords } from "@/lib/dcc/seoCopy";
import HeroVisual from "@/app/components/dcc/HeroVisual";
import CityHero from "@/app/components/dcc/CityHero";
import CityTimePanel from "@/app/components/dcc/CityTimePanel";
import LocationMapCard from "@/app/components/dcc/LocationMapCard";
import WeatherPanel from "@/app/components/dcc/WeatherPanel";
import AirportLinksSection from "@/app/components/dcc/AirportLinksSection";
import StationLinksSection from "@/app/components/dcc/StationLinksSection";
import { getAirportsByCitySlug } from "@/lib/dcc/airports";
import { getStationsByCitySlug } from "@/lib/dcc/stations";

export default function ManifestCityHubPage({
  manifest,
  products,
}: {
  manifest: CityManifest;
  products: ViatorActionProduct[];
}) {
  const citySlug = manifest.slug;
  const cityName = manifest.name;
  const hero = manifest.hero || {};
  const fallbackQueries =
    manifest.featuredTours?.fallbackQueries?.map((query) => ({
      label: query,
      query,
    })) || [];
  const categoryLinks = (getCategoriesManifest(citySlug)?.categories || []).slice(0, 6);
  const attractionLinks = (getAttractionsManifest(citySlug)?.attractions || []).slice(0, 6);
  const searchPhrases = buildLongTailKeywords(
    cityName,
    "things to do",
    categoryLinks.slice(0, 3).map((item) => item.title.toLowerCase())
  );
  const nearbyPlanningLinks = [
    ...categoryLinks.slice(0, 2).map((item) => ({
      href: `/${citySlug}/${item.slug}`,
      label: item.title,
    })),
    ...attractionLinks.slice(0, 1).map((item) => ({
      href: `/${citySlug}/${item.slug}`,
      label: item.name,
    })),
    ...(manifest.planningLinks || []).slice(0, 1).map((item) => ({
      href: item.href,
      label: item.title,
    })),
  ].slice(0, 4);
  const mapLat = manifest.lat ?? manifest.coordinates?.lat;
  const mapLng = manifest.lng ?? manifest.coordinates?.lng;
  const nearbyAirports = getAirportsByCitySlug(citySlug);
  const nearbyStations = getStationsByCitySlug(citySlug);

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pb-14 pt-10 sm:px-6 lg:px-8">
        <CityHero
          cityName={cityName}
          eyebrow={hero.eyebrow || `${cityName} travel guide`}
          title={hero.title || `${cityName} tours, attractions, and travel guide`}
          summary={hero.summary || `Discover tours, attractions, and trip-planning ideas in ${cityName}.`}
          trustLine={hero.trustLine}
          primaryCtaLabel={hero.primaryCtaLabel || "Browse Tours"}
          primaryCtaHref={hero.primaryCtaHref || `/${citySlug}/tours`}
          secondaryCtaLabel={hero.secondaryCtaLabel || "Explore Things to Do"}
          secondaryCtaHref={hero.secondaryCtaHref || `/${citySlug}/things-to-do`}
          heroImage={manifest.heroImage || hero.image?.src}
          heroImageAlt={manifest.heroImageAlt || hero.image?.alt}
          heroImagePosition={manifest.heroImagePosition}
          heroTint={manifest.heroTint || "cool"}
          timezone={manifest.timezone}
          weatherLat={manifest.lat ?? manifest.coordinates?.lat}
          weatherLng={manifest.lng ?? manifest.coordinates?.lng}
        />

        {(manifest.timezone || (typeof (manifest.lat ?? manifest.coordinates?.lat) === "number" && typeof (manifest.lng ?? manifest.coordinates?.lng) === "number")) ? (
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,26,0.96),rgba(6,9,18,0.96))] p-6 sm:p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">
              Local Intel
            </div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] sm:text-3xl">
              Local time, timezone, and current conditions
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
              Start with the local clock and weather so the rest of the day fits how {cityName} actually moves.
            </p>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="grid gap-4 sm:grid-cols-2">
                {manifest.timezone ? <CityTimePanel cityName={cityName} timezone={manifest.timezone} showWeekday /> : null}
                {typeof (manifest.lat ?? manifest.coordinates?.lat) === "number" &&
                typeof (manifest.lng ?? manifest.coordinates?.lng) === "number" ? (
                  <WeatherPanel
                    locationLabel={cityName}
                    lat={manifest.lat ?? manifest.coordinates?.lat ?? 0}
                    lng={manifest.lng ?? manifest.coordinates?.lng ?? 0}
                  />
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(manifest.planningLinks || []).slice(0, 4).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
                  >
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">
                      Planning path
                    </div>
                    <h3 className="mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/70">{item.description}</p>
                    <div className="mt-5 text-sm font-bold text-[#3df3ff]">Open guide →</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {typeof mapLat === "number" && typeof mapLng === "number" ? (
          <LocationMapCard
            label={cityName}
            lat={mapLat}
            lng={mapLng}
            description={`Use this as a fast location anchor for ${cityName}. DCC keeps the first render lightweight, then lets the traveler open full directions only when neighborhood and movement context are real.`}
            nearbyLinks={nearbyPlanningLinks}
          />
        ) : null}

        <AirportLinksSection
          title={`Airports that shape ${cityName} arrivals`}
          intro={`Use airport pages when the first real decision is how to get into ${cityName}, not which attraction or tour comes next.`}
          airports={nearbyAirports}
        />

        <StationLinksSection
          title={`Train and bus stations that shape ${cityName} arrivals`}
          intro={`Use station pages when the traveler is rail-first or bus-first and the real decision is how to route into ${cityName}, downtown, or the right next planning surface.`}
          stations={nearbyStations}
        />

        {manifest.tourCategories?.length ? (
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,26,0.96),rgba(6,9,18,0.96))] p-6 sm:p-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Tour categories</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">Popular ways visitors explore {cityName}</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {manifest.tourCategories.map((item) => (
                <article key={item.slug} className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                  {item.icon ? <div className="text-2xl">{item.icon}</div> : null}
                  <h3 className="mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{item.description}</p>
                  <Link href={`/${citySlug}/${item.slug}`} className="mt-5 inline-flex text-sm font-bold text-[#3df3ff]">
                    Open guide →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {(categoryLinks.length || attractionLinks.length) ? (
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,32,0.96),rgba(7,11,24,0.98))] p-6 sm:p-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Search paths</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">Low-friction ways to narrow a {cityName} trip</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
                Visitors usually do better when they move from a broad city search into one clear attraction or one clear tour type. These pages are built to support that narrower intent.
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">
                {buildCityClusterNarrative(cityName)}
              </p>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {categoryLinks.length ? (
                <article className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">Tour type guides</div>
                  <div className="mt-2 text-xl font-black uppercase tracking-[-0.03em] text-white">Best category pages for easier rankings</div>
                  <p className="mt-3 text-sm leading-6 text-white/70">
                    These are stronger long-tail targets than a generic city query because they match visitors who already know the kind of experience they want.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {categoryLinks.map((item) => (
                      <Link key={item.slug} href={`/${citySlug}/${item.slug}`} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/82 transition hover:bg-white/10">
                        {item.title} in {cityName}
                      </Link>
                    ))}
                  </div>
                </article>
              ) : null}
              {attractionLinks.length ? (
                <article className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">Attraction guides</div>
                  <div className="mt-2 text-xl font-black uppercase tracking-[-0.03em] text-white">Specific places that deserve their own page</div>
                  <p className="mt-3 text-sm leading-6 text-white/70">
                    Attraction-level pages help capture searches around landmarks, districts, and named stops that are often easier to rank than the city head term alone.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {attractionLinks.map((item) => (
                      <Link key={item.slug} href={`/${citySlug}/${item.slug}`} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/82 transition hover:bg-white/10">
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>
            {searchPhrases.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {searchPhrases.map((phrase) => (
                  <span key={phrase} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/72">
                    {phrase}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {manifest.topAttractions?.length ? (
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-6 sm:p-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Top attractions</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">Start with the places that shape the trip</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {manifest.topAttractions.map((item) => (
                <article key={item.slug} className="overflow-hidden rounded-[26px] border border-white/10 bg-[#0b1224] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                  <HeroVisual
                    canonicalPath={`/${citySlug}/${item.slug}`}
                    fallbackTitle={item.title}
                    fallbackSubtitle={item.description || buildAttractionCardDescription(cityName, item.title)}
                  />
                  <div className="p-5">
                    <h3 className="text-xl font-black uppercase tracking-[-0.03em] text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/70">{item.description || buildAttractionCardDescription(cityName, item.title)}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={`/${citySlug}/${item.slug}`} className="text-sm font-bold text-[#3df3ff]">
                        Open guide →
                      </Link>
                      <Link href={`/${citySlug}/${item.slug}/tours`} className="text-sm text-white/68 hover:text-white/88">
                        Guided experiences →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <ViatorTourGrid
          placeName={cityName}
          title={manifest.featuredTours?.title || `Featured ${cityName} tours`}
          description={
            manifest.featuredTours?.description ||
            `Helpful guided experiences and local tours for visitors exploring ${cityName}.`
          }
          products={products}
          fallbacks={fallbackQueries}
          ctaLabel="View experience"
        />

        {manifest.planningLinks?.length ? (
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,11,18,0.96),rgba(10,9,20,0.96))] p-6 sm:p-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">Travel planning</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">Plan beyond one booking</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {manifest.planningLinks.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
                  <h3 className="text-lg font-black uppercase tracking-[-0.03em] text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{item.description}</p>
                  <div className="mt-5 text-sm font-bold text-[#3df3ff]">Explore →</div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {manifest.faq?.length ? (
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,24,0.98),rgba(6,9,18,0.98))] p-6 sm:p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">FAQ</div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em]">{cityName} FAQ</h2>
            <div className="mt-4 space-y-3">
              {manifest.faq.map((item) => (
                <article key={item.q} className="rounded-[24px] border border-white/10 bg-[#0b1224] p-5">
                  <h3 className="font-black uppercase tracking-[-0.02em] text-white">{item.q}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{item.a}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
