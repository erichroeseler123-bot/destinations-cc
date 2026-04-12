import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdventureLaneSection from "@/app/components/dcc/AdventureLaneSection";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import CityToursSection from "@/app/components/dcc/CityToursSection";
import CityMoneyLaneSection from "@/app/components/dcc/CityMoneyLaneSection";
import CityLiveEventsSection from "@/app/components/dcc/CityLiveEventsSection";
import CitySportsSection from "@/app/components/dcc/CitySportsSection";
import DecisionEngineTemplate from "@/app/components/dcc/DecisionEngineTemplate";
import ManifestCityHubPage from "@/app/components/dcc/ManifestCityHubPage";
import CityHero from "@/app/components/dcc/CityHero";
import CityTimePanel from "@/app/components/dcc/CityTimePanel";
import LocationMapCard from "@/app/components/dcc/LocationMapCard";
import WeatherPanel from "@/app/components/dcc/WeatherPanel";
import SubtleAffiliateModules from "@/app/components/dcc/SubtleAffiliateModules";
import AirportLinksSection from "@/app/components/dcc/AirportLinksSection";
import StationLinksSection from "@/app/components/dcc/StationLinksSection";
import { getAirportsByCitySlug } from "@/lib/dcc/airports";
import { getStationsByCitySlug } from "@/lib/dcc/stations";
import { getCityBySlug } from "@/lib/data/locations";
import { getCityAdventureLane } from "@/src/data/city-adventure-lanes";
import { getCityMoneyLane } from "@/src/data/city-money-lanes";
import { getCityAuthorityConfig } from "@/src/data/city-authority-config";
import { getDecisionEnginePageByPath } from "@/src/data/decision-engine-pages";
import { getTeamsByCity } from "@/src/data/sports-teams-config";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import { getCityManifest } from "@/lib/dcc/manifests/cityExpansion";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildCityJsonLd,
} from "@/lib/dcc/jsonld";
import { buildCityClusterNarrative } from "@/lib/dcc/seoCopy";
import { buildNoindexRobots } from "@/lib/seo/indexingPolicy";
import { resolveCanonicalCityKey } from "@/src/data/city-aliases";
import { getTransportGuideHrefForCitySlug } from "@/src/data/transport-directory";

type Params = { city: string };

function prettyCity(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildDefaultBookableIntents(cityKey: string, cityName: string) {
  return [
    { label: `${cityName} day tours`, href: `/tours?city=${encodeURIComponent(cityKey)}&q=${encodeURIComponent(`${cityName} day tours`)}` },
    { label: `${cityName} food tours`, href: `/tours?city=${encodeURIComponent(cityKey)}&q=${encodeURIComponent(`${cityName} food tour`)}` },
    { label: `${cityName} night tours`, href: `/tours?city=${encodeURIComponent(cityKey)}&q=${encodeURIComponent(`${cityName} night tour`)}` },
    { label: `${cityName} walking tours`, href: `/tours?city=${encodeURIComponent(cityKey)}&q=${encodeURIComponent(`${cityName} walking tour`)}` },
    { label: `${cityName} attractions`, href: `/tours?city=${encodeURIComponent(cityKey)}&q=${encodeURIComponent(`${cityName} attractions`)}` },
    { label: `${cityName} activities`, href: `/tours?city=${encodeURIComponent(cityKey)}&q=${encodeURIComponent(`${cityName} activities`)}` },
  ];
}

function SectionCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
    >
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">Destination lane</div>
      <div className="mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">{title}</div>
      <p className="mt-3 text-sm leading-6 text-white/70">{desc}</p>
      <div className="mt-5 text-sm font-bold text-[#3df3ff]">Explore →</div>
    </Link>
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city } = await params;
  if (!city || city.length < 2) notFound();
  const cityKey = resolveCanonicalCityKey(city);
  const manifest = getCityManifest(cityKey);
  const cityNode = getCityBySlug(cityKey);
  if (manifest) {
    return {
      title: manifest.metadata?.title || `${manifest.name} Travel Guide | Destination Command Center`,
      description:
        manifest.metadata?.description || `Discover tours, attractions, and trip-planning ideas in ${manifest.name}.`,
      keywords: manifest.metadata?.keywords,
      alternates: { canonical: `/${cityKey}` },
      openGraph: {
        title: manifest.metadata?.title || `${manifest.name} Travel Guide`,
        description:
          manifest.metadata?.description || `Discover tours, attractions, and trip-planning ideas in ${manifest.name}.`,
        url: `https://destinationcommandcenter.com/${cityKey}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: manifest.metadata?.title || `${manifest.name} Travel Guide`,
        description:
          manifest.metadata?.description || `Discover tours, attractions, and trip-planning ideas in ${manifest.name}.`,
      },
      robots: buildNoindexRobots(),
    };
  }
  const config = getCityAuthorityConfig(cityKey);
  const cityName = prettyCity(cityKey);

  if (!config && !cityNode) notFound();

  if (!config) {
    return {
      title: `${cityName} Travel Hub | Tours, Attractions, and Logistics`,
      description: `Plan ${cityName} with decision-first routing for tours, attractions, day trips, and event timing.`,
      alternates: { canonical: `/${cityKey}` },
      robots: buildNoindexRobots(),
    };
  }

  return {
    title: config.seoTitle,
    description: config.seoDescription,
    keywords: config.keywords,
    alternates: { canonical: config.canonicalPath },
    openGraph: {
      title: config.heroTitle,
      description: config.seoDescription,
      url: `https://destinationcommandcenter.com${config.canonicalPath}`,
      type: "website",
      images: [config.openGraphImage],
    },
    twitter: {
      card: "summary_large_image",
      title: config.heroTitle,
      description: config.seoDescription,
      images: [config.openGraphImage],
    },
    robots: buildNoindexRobots(),
  };
}

export default async function CityHubPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;

  if (!city || city.length < 2) notFound();

  const cityKey = resolveCanonicalCityKey(city);
  const cityName = prettyCity(cityKey);
  const nearbyAirports = getAirportsByCitySlug(cityKey);
  const nearbyStations = getStationsByCitySlug(cityKey);
  const transportGuideHref = getTransportGuideHrefForCitySlug(cityKey);
  const cityAffiliateHrefs =
    cityKey === "las-vegas"
      ? {
          stays_nearby: "/las-vegas/hotels",
          airport_transfer: transportGuideHref ?? undefined,
        }
      : {
          airport_transfer: transportGuideHref ?? undefined,
        };
  const manifest = getCityManifest(cityKey);
  const cityNode = getCityBySlug(cityKey);
  if (!manifest && !cityNode && !getCityAuthorityConfig(cityKey)) notFound();
  const fallbackTimezone = cityNode?.tz;
  const fallbackLat = cityNode?.geo?.lat;
  const fallbackLng = cityNode?.geo?.lon;
  if (manifest) {
    const viatorAction = await getViatorActionForPlace({
      slug: cityKey,
      name: manifest.name,
      citySlug: cityKey,
    });

    return (
      <>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              buildCityJsonLd({
                path: `/${cityKey}`,
                name: manifest.name,
                description:
                  manifest.metadata?.description ||
                  `Discover tours, attractions, and trip-planning ideas in ${manifest.name}.`,
                address: {
                  locality: manifest.name,
                  country: "US",
                },
                geo: {
                  lat: manifest.lat ?? manifest.coordinates?.lat,
                  lng: manifest.lng ?? manifest.coordinates?.lng,
                },
                touristTypes: ["City-break travelers", "Experience-focused travelers"],
              }),
              buildBreadcrumbJsonLd([
                { name: "Home", item: "/" },
                { name: manifest.name, item: `/${cityKey}` },
              ]),
              ...(manifest.faq?.length
                ? [
                    {
                      "@context": "https://schema.org",
                      "@type": "FAQPage",
                      mainEntity: manifest.faq.map((item) => ({
                        "@type": "Question",
                        name: item.q,
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: item.a,
                        },
                      })),
                    },
                  ]
                : []),
            ],
          }}
        />
        <ManifestCityHubPage manifest={manifest} products={viatorAction.products} />
      </>
    );
  }
  const config = getCityAuthorityConfig(cityKey);
  const moneyLane = getCityMoneyLane(cityKey);
  const adventureLane = getCityAdventureLane(cityKey);
  const sportsTeams = getTeamsByCity(cityKey);
  const viatorAction = await getViatorActionForPlace({
    slug: cityKey,
    name: config?.cityName || cityName,
    citySlug: cityKey,
  });
  const cityTourFallbacks = moneyLane
    ? moneyLane.intents.map((intent) => ({
        title: intent.label,
        query: intent.query,
      }))
    : buildDefaultBookableIntents(cityKey, cityName).map((intent) => ({
        title: intent.label,
        query: decodeURIComponent(intent.href.split("&q=")[1] || intent.label),
      }));
  const decisionPage = getDecisionEnginePageByPath(`/${cityKey}`);

  if (config) {
    const tone = cityKey === "las-vegas" || cityKey === "nashville" ? "amber" : "cyan";
    return (
      <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
        <CinematicBackdrop />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              buildCityJsonLd({
                path: config.canonicalPath,
                name: config.cityName,
                description: config.seoDescription,
                address: {
                  locality: config.cityName,
                  country: "US",
                },
                touristTypes: config.structuredDataHints || ["City travelers"],
              }),
              buildBreadcrumbJsonLd([
                { name: "Home", item: "/" },
                { name: config.cityName, item: config.canonicalPath },
              ]),
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: config.faq.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: item.a,
                  },
                })),
              },
            ],
          }}
        />
        <div className="relative mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pb-14 pt-10 sm:px-6 lg:px-8">
          <CityHero
            cityName={config.cityName}
            eyebrow={`${config.cityName} travel guide`}
            title={config.heroTitle}
            summary={config.heroDescription}
            trustLine={config.trustLine}
            primaryCtaLabel="Browse Tours"
            primaryCtaHref={`/${cityKey}/tours`}
            secondaryCtaLabel="Explore Things to Do"
            secondaryCtaHref={`/${cityKey}/things-to-do`}
            heroTint={tone === "amber" ? "warm" : "cool"}
            timezone={fallbackTimezone}
            weatherLat={fallbackLat}
            weatherLng={fallbackLng}
          />

          {(fallbackTimezone || (typeof fallbackLat === "number" && typeof fallbackLng === "number")) ? (
            <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,26,0.96),rgba(6,9,18,0.96))] p-6 sm:p-8">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">
                Local Intel
              </div>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] sm:text-3xl">
                Local time, timezone, and current conditions
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
                Start with the local clock and weather before locking in tours, shows, or same-day logistics around {config.cityName}.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {fallbackTimezone ? <CityTimePanel cityName={config.cityName} timezone={fallbackTimezone} showWeekday /> : null}
                {typeof fallbackLat === "number" && typeof fallbackLng === "number" ? (
                  <WeatherPanel locationLabel={config.cityName} lat={fallbackLat} lng={fallbackLng} />
                ) : null}
              </div>
            </section>
          ) : null}

          {typeof fallbackLat === "number" && typeof fallbackLng === "number" ? (
            <LocationMapCard
              label={config.cityName}
              lat={fallbackLat}
              lng={fallbackLng}
              description={`Use this as a fast location anchor for ${config.cityName}. DCC stays lightweight here, then hands the traveler into a full map app only when directions or neighborhood orientation are needed.`}
              nearbyLinks={[
                { href: `/${cityKey}/attractions`, label: "Attractions" },
                { href: `/${cityKey}/things-to-do`, label: "Things to do" },
                { href: `/${cityKey}/tours`, label: "Tours" },
              ]}
            />
          ) : null}

          <AirportLinksSection
            title={`Airports that shape ${config.cityName} arrivals`}
            intro={`Use airport pages when the first real trip problem is arrival timing, transfer friction, or deciding how to enter ${config.cityName} without breaking the day.`}
            airports={nearbyAirports}
          />

          <StationLinksSection
            title={`Train and bus stations that shape ${config.cityName} arrivals`}
            intro={`Use station pages when the traveler is rail-first or bus-first and the real decision is how to route into ${config.cityName}, a port, or a venue corridor without wasting the first move.`}
            stations={nearbyStations}
          />

          {decisionPage ? <DecisionEngineTemplate page={decisionPage} /> : null}

          <CityToursSection
            cityKey={cityKey}
            cityName={config.cityName}
            products={viatorAction.products}
            fallbacks={cityTourFallbacks}
          />

          <SubtleAffiliateModules
            context={{ surface: "city", priority: 65 }}
            hrefs={cityAffiliateHrefs}
            intro={`Keep these as optional utilities around ${config.cityName}. They should support the trip, not dominate the page.`}
          />

          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,11,18,0.96),rgba(10,9,20,0.96))] p-6 sm:p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">
              City fundamentals
            </div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] sm:text-3xl">
              Build the day around the real trip shape
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              {buildCityClusterNarrative(config.cityName)}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {config.pillars.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/10 bg-[#0b1224] p-5 text-white/82">
                  {item}
                </div>
              ))}
            </div>
          </section>

          {moneyLane ? <CityMoneyLaneSection config={moneyLane} tone={cityKey === "nashville" ? "amber" : "cyan"} /> : null}

          {adventureLane ? <AdventureLaneSection config={adventureLane} /> : null}

          {sportsTeams.length ? <CitySportsSection cityName={config.cityName} citySlug={cityKey} teams={sportsTeams} /> : null}

          <CityLiveEventsSection
            citySlug={cityKey}
            cityName={config.cityName}
            venues={config.eventVenues}
            ticketQueries={config.eventQueries}
            festivals={config.festivals}
          />

          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,24,0.98),rgba(6,9,18,0.98))] p-6 sm:p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">FAQ</div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em]">{config.cityName} FAQ</h2>
            <div className="mt-4 space-y-3">
              {config.faq.map((item) => (
                <article key={item.q} className="rounded-[24px] border border-white/10 bg-[#0b1224] p-5">
                  <h3 className="font-black uppercase tracking-[-0.02em] text-white">{item.q}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{item.a}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-6 sm:p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Linked Pages</div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em]">Linked Authority Pages</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {config.linkedPages.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="rounded-[24px] border border-white/10 bg-[#0b1224] px-5 py-4 text-white/82 transition hover:bg-white/10"
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">Authority link</div>
                  <div className="mt-2 font-black uppercase tracking-[-0.02em]">{item.label}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <CinematicBackdrop />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pb-14 pt-10 sm:px-6 lg:px-8">
        <CityHero
          cityName={cityName}
          eyebrow={`${cityName} travel guide`}
          title={`${cityName} tours, attractions, and trip planning`}
          summary={`Use this city hub to move into tours, attractions, day trips, and practical travel planning for ${cityName}.`}
          primaryCtaLabel="Browse Tours"
          primaryCtaHref={`/${cityKey}/tours`}
          secondaryCtaLabel="Explore Attractions"
          secondaryCtaHref={`/${cityKey}/attractions`}
          heroTint="emerald"
          timezone={fallbackTimezone}
          weatherLat={fallbackLat}
          weatherLng={fallbackLng}
        />

        {(fallbackTimezone || (typeof fallbackLat === "number" && typeof fallbackLng === "number")) ? (
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,26,0.96),rgba(6,9,18,0.96))] p-6 sm:p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">
              Local Intel
            </div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] sm:text-3xl">
              Local time, timezone, and current conditions
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {fallbackTimezone ? <CityTimePanel cityName={cityName} timezone={fallbackTimezone} showWeekday /> : null}
              {typeof fallbackLat === "number" && typeof fallbackLng === "number" ? (
                <WeatherPanel locationLabel={cityName} lat={fallbackLat} lng={fallbackLng} />
              ) : null}
            </div>
          </section>
        ) : null}

        {typeof fallbackLat === "number" && typeof fallbackLng === "number" ? (
          <LocationMapCard
            label={cityName}
            lat={fallbackLat}
            lng={fallbackLng}
            description={`Use this as a fast location anchor for ${cityName}. DCC keeps the map layer light and lets the traveler open a full navigation app only when location intent becomes real.`}
            nearbyLinks={[
              { href: `/${cityKey}/attractions`, label: "Attractions" },
              { href: `/${cityKey}/day-trips`, label: "Day trips" },
              { href: `/${cityKey}/tours`, label: "Tours" },
            ]}
          />
        ) : null}

        <AirportLinksSection
          title={`Airports that shape ${cityName} arrivals`}
          intro={`Use airport pages when the first real trip problem is arrival timing, transfer friction, or deciding how to enter ${cityName} without breaking the day.`}
          airports={nearbyAirports}
        />

        {decisionPage ? <DecisionEngineTemplate page={decisionPage} /> : null}

        <CityToursSection
          cityKey={cityKey}
          cityName={cityName}
          products={viatorAction.products}
          fallbacks={cityTourFallbacks}
        />

        <SubtleAffiliateModules
          context={{ surface: "city", priority: 55 }}
          hrefs={cityAffiliateHrefs}
          intro={`These are optional trip-support tools for ${cityName}. They stay secondary to the main city discovery flow.`}
        />

        <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,11,18,0.96),rgba(10,9,20,0.96))] p-6 sm:p-8">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">
          Quick routes
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-200 hover:bg-white/10"
            href={`/cities?q=${encodeURIComponent(cityKey)}`}
          >
            Search cities
          </Link>
          <Link className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-200 hover:bg-white/10" href="/authority">
            Authority hub
          </Link>
        </div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-6 sm:p-8">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">
          Destination lanes
        </div>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] sm:text-3xl">
          Move into the right part of the trip
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
          {buildCityClusterNarrative(cityName)}
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard href={`/${cityKey}/tours`} title="Tours" desc="High-demand tours by category with clear intent and booking paths." />
          <SectionCard href={`/${cityKey}/attractions`} title="Attractions" desc="Landmarks, must-dos, and quick-hit experiences — curated for time." />
          <SectionCard href={`/${cityKey}/day-trips`} title="Day trips" desc="Best escapes within a practical radius — with timing buffers." />
          <SectionCard href={`/${cityKey}/shows`} title="Shows" desc="Events and performances worth planning around." />
          <SectionCard href={`/${cityKey}/helicopter`} title="Helicopter" desc="Aerial experiences and scenic flights (when available)." />
          <SectionCard href="/authority" title="Decision + logistics" desc="Weather, timing, pickup patterns, and failure modes that ruin trips." />
        </div>
        </section>

        {sportsTeams.length ? <CitySportsSection cityName={cityName} citySlug={cityKey} teams={sportsTeams} /> : null}

        {(cityKey === "denver" || cityKey === "idaho-springs" || cityKey === "morrison") && (
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,24,0.98),rgba(6,9,18,0.98))] p-6 sm:p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">Colorado micro-routes</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-200 hover:bg-white/10" href="/mighty-argo-shuttle">
                Argo mine tour shuttle from Denver
              </Link>
              <Link className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-200 hover:bg-white/10" href="/mighty-argo">
                Mighty Argo Guide
              </Link>
              <Link className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-200 hover:bg-white/10" href="/regions/colorado">
                Colorado region
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
