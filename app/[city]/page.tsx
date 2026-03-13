import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdventureLaneSection from "@/app/components/dcc/AdventureLaneSection";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import CityToursSection from "@/app/components/dcc/CityToursSection";
import CityMoneyLaneSection from "@/app/components/dcc/CityMoneyLaneSection";
import CityLiveEventsSection from "@/app/components/dcc/CityLiveEventsSection";
import CitySportsSection from "@/app/components/dcc/CitySportsSection";
import DecisionEngineTemplate from "@/app/components/dcc/DecisionEngineTemplate";
import { getCityAdventureLane } from "@/src/data/city-adventure-lanes";
import { getCityMoneyLane } from "@/src/data/city-money-lanes";
import { getCityAuthorityConfig } from "@/src/data/city-authority-config";
import { getDecisionEnginePageByPath } from "@/src/data/decision-engine-pages";
import { getTeamsByCity } from "@/src/data/sports-teams-config";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";

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
      className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-md hover:bg-white/[0.09] transition"
    >
      <div className="text-lg font-bold bg-gradient-to-r from-cyan-200 to-emerald-200 bg-clip-text text-transparent">
        {title}
      </div>
      <p className="mt-2 text-sm text-zinc-300">{desc}</p>
      <div className="mt-4 text-sm text-zinc-200">Explore →</div>
    </Link>
  );
}

function CityJsonLd({
  city,
  cityName,
  description,
  faq,
  touristType,
}: {
  city: string;
  cityName: string;
  description: string;
  faq: Array<{ q: string; a: string }>;
  touristType: string[];
}) {
  const pageUrl = `https://destinationcommandcenter.com/${city}`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${cityName} Travel Guide`,
        description,
      },
      {
        "@type": "TouristDestination",
        name: cityName,
        url: pageUrl,
        touristType,
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city } = await params;
  const cityKey = (city || "").toLowerCase();
  const config = getCityAuthorityConfig(cityKey);
  const cityName = prettyCity(cityKey);

  if (!config) {
    return {
      title: `${cityName} Travel Hub | Tours, Attractions, and Logistics`,
      description: `Plan ${cityName} with decision-first routing for tours, attractions, day trips, and event timing.`,
      alternates: { canonical: `/${cityKey}` },
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
  };
}

export default async function CityHubPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;

  if (!city || city.length < 2) notFound();

  const cityKey = city.toLowerCase();
  const cityName = prettyCity(cityKey);
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
        <CityJsonLd
          city={cityKey}
          cityName={config.cityName}
          description={config.seoDescription}
          faq={config.faq}
          touristType={config.structuredDataHints || ["City travelers"]}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-16 space-y-8">
          <header className="space-y-3">
            <RouteHeroMark eyebrow="Destination Command Center" title={`${config.cityName.toUpperCase()} ROUTE NODE`} tone={tone} />
            <p className="dcc-hero-enter dcc-hero-enter-2 text-xs uppercase tracking-[0.22em] text-zinc-400">DCC Destination Layer</p>
            <h1 className="dcc-hero-enter dcc-hero-enter-3 text-4xl font-black tracking-tight md:text-6xl">{config.heroTitle}</h1>
            <p className="dcc-hero-enter dcc-hero-enter-4 max-w-3xl text-zinc-300">{config.heroDescription}</p>
            <p className="dcc-hero-enter dcc-hero-enter-4 text-xs text-zinc-400">{config.trustLine}</p>
          </header>

          {decisionPage ? <DecisionEngineTemplate page={decisionPage} /> : null}

          <CityToursSection
            cityKey={cityKey}
            cityName={config.cityName}
            products={viatorAction.products}
            fallbacks={cityTourFallbacks}
          />

          <section className="grid gap-3 sm:grid-cols-2">
            {config.pillars.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-200">
                {item}
              </div>
            ))}
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

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">{config.cityName} FAQ</h2>
            <div className="mt-4 space-y-3">
              {config.faq.map((item) => (
                <article key={item.q} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="font-semibold">{item.q}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Linked Authority Pages</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {config.linkedPages.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-200 hover:bg-white/10"
                >
                  {item.label} Link
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
      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <RouteHeroMark eyebrow="Destination Command Center" title={`${cityName.toUpperCase()} CITY NODE`} tone="emerald" />
        <div className="dcc-hero-enter dcc-hero-enter-2 text-xs tracking-[0.35em] uppercase text-zinc-500">
          Destination Command Center • City node
        </div>

        <h1 className="dcc-hero-enter dcc-hero-enter-3 mt-4 text-4xl md:text-6xl font-black leading-[0.95] bg-gradient-to-r from-white via-cyan-100 to-emerald-100 bg-clip-text text-transparent">
          {cityName}
        </h1>

        <p className="dcc-hero-enter dcc-hero-enter-4 mt-4 max-w-2xl text-zinc-300">
          Your hub for tours, attractions, day trips, and high-signal logistics. This page is designed to route you to
          the right decision page fast.
        </p>

        {decisionPage ? (
          <div className="mt-8">
            <DecisionEngineTemplate page={decisionPage} />
          </div>
        ) : null}

        <div className="mt-8">
          <CityToursSection
            cityKey={cityKey}
            cityName={cityName}
            products={viatorAction.products}
            fallbacks={cityTourFallbacks}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10"
            href={`/cities?q=${encodeURIComponent(cityKey)}`}
          >
            Search cities
          </Link>
          <Link className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10" href="/authority">
            Authority hub
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionCard href={`/${cityKey}/tours`} title="Tours" desc="High-demand tours by category with clear intent and booking paths." />
          <SectionCard href={`/${cityKey}/attractions`} title="Attractions" desc="Landmarks, must-dos, and quick-hit experiences — curated for time." />
          <SectionCard href={`/${cityKey}/day-trips`} title="Day trips" desc="Best escapes within a practical radius — with timing buffers." />
          <SectionCard href={`/${cityKey}/shows`} title="Shows" desc="Events and performances worth planning around." />
          <SectionCard href={`/${cityKey}/helicopter`} title="Helicopter" desc="Aerial experiences and scenic flights (when available)." />
          <SectionCard href="/authority" title="Decision + logistics" desc="Weather, timing, pickup patterns, and failure modes that ruin trips." />
        </div>

        {sportsTeams.length ? (
          <div className="mt-10">
            <CitySportsSection cityName={cityName} citySlug={cityKey} teams={sportsTeams} />
          </div>
        ) : null}

        {(cityKey === "denver" || cityKey === "idaho-springs" || cityKey === "morrison") && (
          <div className="mt-12 rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-xs uppercase tracking-widest text-zinc-400">Colorado micro-routes</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10" href="/mighty-argo-shuttle">
                Argo mine tour shuttle from Denver
              </Link>
              <Link className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10" href="/mighty-argo">
                Mighty Argo Guide
              </Link>
              <Link className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10" href="/regions/colorado">
                Colorado region
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
