import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DiagnosticsBlock from "@/app/components/DiagnosticsBlock";
import StatGrid from "@/app/components/StatGrid";
import JsonLd from "@/app/components/dcc/JsonLd";
import BookableToursSection from "@/app/components/dcc/BookableToursSection";
import CruiseSpecialtyLaneSection from "@/app/components/dcc/CruiseSpecialtyLaneSection";
import CruisePortHybridSection from "@/app/components/dcc/CruisePortHybridSection";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import SatelliteHandoffStatusCard from "@/app/components/dcc/SatelliteHandoffStatusCard";
import NextStepEngine from "@/app/components/dcc/NextStepEngine";
import AirportLinksSection from "@/app/components/dcc/AirportLinksSection";
import StationLinksSection from "@/app/components/dcc/StationLinksSection";
import LocationMapCard from "@/app/components/dcc/LocationMapCard";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import {
  buildCruisePayload,
  listCruisePortSlugs,
  slugifyCruiseRoute,
} from "@/lib/dcc/internal/cruisePayload";
import { buildDccWtaHandoffHref } from "@/lib/dcc/internal/handoff";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import { isAlaskaCruisePortSlug } from "@/lib/dcc/cruise/shipRegistry";
import { ACTION_LABELS } from "@/lib/dcc/actionLabels";
import { getCruisePortAddress, getCruisePortGeo } from "@/src/data/cruise-port-geo";
import { getCruiseSpecialtyLanesForPort } from "@/src/data/cruise-specialty-lanes";
import { buildPortTrackedHref } from "@/src/lib/port-analytics";
import { getPortRecommendationActions } from "@/lib/dcc/handoffAnalytics";
import { getAirportsByPortSlug } from "@/lib/dcc/airports";
import { getStationsByPortSlug } from "@/lib/dcc/stations";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPlaceJsonLd,
} from "@/lib/dcc/jsonld";

const BASE_URL = "https://destinationcommandcenter.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return listCruisePortSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const portTitle = toTitle(resolved.slug);
  return {
    title: `${portTitle} Shore Excursions and Cruise Port Guide`,
    description: `Cruise port schedule, shore excursions, and timing guidance for ${portTitle}, with direct paths into excursion and transfer planning.`,
    keywords: [
      `${portTitle} cruise port`,
      `${portTitle} shore excursions`,
      `${portTitle} port guide`,
      `${portTitle} cruise transfers`,
      `${portTitle} things to do from port`,
    ],
    alternates: { canonical: `/cruises/port/${resolved.slug}` },
    openGraph: {
      title: `${portTitle} Shore Excursions and Cruise Port Guide`,
      description: `Cruise port schedule, shore excursions, and timing guidance for ${portTitle}, with direct paths into excursion and transfer planning.`,
      url: `${BASE_URL}/cruises/port/${resolved.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${portTitle} Shore Excursions and Cruise Port Guide`,
      description: `Cruise port schedule, shore excursions, and timing guidance for ${portTitle}, with direct paths into excursion and transfer planning.`,
    },
  };
}

function toTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function fmtDate(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toISOString().slice(0, 10);
}

export default async function CruisePortPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ dcc_handoff_id?: string }>;
}) {
  const resolved = await params;
  const resolvedSearch = await searchParams;
  const handoffId = resolvedSearch?.dcc_handoff_id || null;
  const payload = await buildCruisePayload({
    type: "port",
    value: resolved.slug,
  });

  if (!payload || payload.cruises.length === 0) {
    return notFound();
  }

  const canonicalPortSlug = payload.query.value;
  const portTitle = toTitle(canonicalPortSlug);
  const nearbyAirports = getAirportsByPortSlug(canonicalPortSlug);
  const nearbyStations = getStationsByPortSlug(canonicalPortSlug);
  const isAlaskaPortContext = isAlaskaCruisePortSlug(canonicalPortSlug);
  const geo = getCruisePortGeo(canonicalPortSlug);
  const address = getCruisePortAddress(canonicalPortSlug);
  const bookingIntents = [
    `${portTitle} shore excursions`,
    `${portTitle} whale watching`,
    `${portTitle} port transfers`,
    `${portTitle} day tours`,
    `${portTitle} cruise transportation`,
    `${portTitle} top things to do`,
  ];
  const specialtyLanes = getCruiseSpecialtyLanesForPort(canonicalPortSlug);
  const viatorAction = await getViatorActionForPlace({
    slug: canonicalPortSlug,
    name: portTitle,
    citySlug: canonicalPortSlug,
  });
  const faq = [
    {
      question: `When is the best time to plan ${portTitle} cruise excursions?`,
      answer: `Plan excursions after checking confirmed departure windows for sailings into ${portTitle}. Build buffer time before and after tour activities.`,
    },
    {
      question: `Can I book shore excursions for ${portTitle} online?`,
      answer: `Yes. Compare shore excursion options and transfer routes from the ${portTitle} port page and linked booking partners.`,
    },
    {
      question: `Should I keep extra buffer time in ${portTitle}?`,
      answer: `Yes. Port traffic, weather, and tender timing can shift schedules, so avoid tight reservation chains.`,
    },
  ];
  const nextActions = getPortRecommendationActions(canonicalPortSlug);
  const primaryExcursionQuery = `${portTitle} shore excursions`;

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildPlaceJsonLd({
              path: `/cruises/port/${canonicalPortSlug}`,
              name: `${portTitle} Cruise Port`,
              description:
                "Cruise port schedule, route context, and shore excursion planning with booking handoffs.",
              address: address
                ? {
                    locality: address.addressLocality,
                    region: address.addressRegion,
                    country: address.addressCountry,
                  }
                : undefined,
              geo: geo
                ? {
                    lat: geo.latitude,
                    lng: geo.longitude,
                  }
                : undefined,
              touristTypes: isAlaskaPortContext
                ? ["Cruise travelers", "Shore excursion buyers", "Alaska route planners"]
                : ["Cruise travelers", "Shore excursion buyers"],
            }),
            {
              "@type": "ItemList",
              name: `${portTitle} upcoming sailings`,
              itemListElement: payload.cruises.slice(0, 24).map((sailing, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                item: {
                  "@type": "Trip",
                  name: `${sailing.line} • ${sailing.ship}`,
                  departureTime: sailing.departure_date,
                  provider: {
                    "@type": "Organization",
                    name: sailing.line,
                  },
                  offers:
                    typeof sailing.starting_price?.amount === "number"
                      ? {
                          "@type": "Offer",
                          price: sailing.starting_price.amount,
                          priceCurrency: sailing.starting_price.currency || "USD",
                        }
                      : undefined,
                },
              })),
            },
            buildBreadcrumbJsonLd([
              { name: "Cruises", item: "/cruises" },
              { name: "Ports", item: "/ports" },
              { name: portTitle, item: `/cruises/port/${canonicalPortSlug}` },
            ]),
            buildFaqJsonLd(faq),
          ],
        }}
      />
      <header className="space-y-3 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(61,243,255,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,176,124,0.14),transparent_28%),linear-gradient(180deg,rgba(9,15,31,0.96),rgba(7,11,25,0.96))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
        <div className="inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#8fd0ff]">
          Cruise port excursion page
        </div>
        <p className="mt-4 text-xs uppercase tracking-wider text-zinc-500">Cruise Port View</p>
        <h1 className="text-4xl font-black tracking-tight">{portTitle} Cruise Schedule</h1>
        <p className="text-zinc-300 max-w-3xl">
          Truth-first port schedule context from the cruise cache, with excursion discovery and booking handoffs where relevant.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/tours?q=${encodeURIComponent(primaryExcursionQuery)}`}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#62f6ff]"
          >
            Browse Shore Excursions
          </Link>
          <Link
            href={`/cruises/from/${canonicalPortSlug}`}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/6 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
          >
            Cruises From {portTitle}
          </Link>
        </div>
        {isAlaskaPortContext ? (
          <p className="text-sm text-cyan-300">
            Alaska port context detected: WTA handoff links include canonical ship and port payload metadata.
          </p>
        ) : null}
        <p className="text-sm text-zinc-500">
          Canonical route: /cruises/port/{canonicalPortSlug}
        </p>
        {specialtyLanes.length ? (
          <div className="flex flex-wrap gap-2">
            {specialtyLanes.map((lane) => (
              <Link
                key={lane.key}
                href={`/cruises/themed/${lane.key}`}
                className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-sm font-medium text-fuchsia-200 hover:bg-fuchsia-500/20"
              >
                {lane.title}
              </Link>
            ))}
          </div>
        ) : null}
        <PoweredByViator
          compact
          disclosure
          body={`Use DCC to evaluate ${portTitle} timing, excursion windows, and transfer options. When you're ready to book tours, DCC hands off to Viator as the booking partner.`}
        />
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <h2 className="text-xl font-semibold">Context</h2>
        <p className="text-zinc-300">
          {payload.context.risk_summary || "No risk summary available for this route yet."}
        </p>
        {payload.context.recent_observations?.length ? (
          <ul className="text-sm text-zinc-400 space-y-1">
            {payload.context.recent_observations.map((obs, i) => (
              <li key={`${obs}-${i}`}>• {obs}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No recent observations yet.</p>
        )}
      </section>

      {geo ? (
        <LocationMapCard
          title={`${portTitle} port map and directions`}
          label={`${portTitle} cruise port`}
          lat={geo.latitude}
          lng={geo.longitude}
          description={`Use this as a fast location anchor for ${portTitle}. DCC keeps the port page lightweight, then hands the traveler into a full map app only when transfer, dock, or excursion direction context is needed.`}
          nearbyLinks={[
            { href: "/ports", label: "Ports" },
            { href: `/cruises/from/${canonicalPortSlug}`, label: "Cruises from port" },
            { href: "/cruises/shore-excursions", label: "Shore excursions" },
          ]}
        />
      ) : null}

      <AirportLinksSection
        title={`Airports that shape ${portTitle} cruise timing`}
        intro={`Use airport pages when the real question is airport-to-port buffer, hotel staging, or whether the arrival path is simple enough for the day you want.`}
        airports={nearbyAirports}
      />

      <StationLinksSection
        title={`Train and bus stations that shape ${portTitle} cruise timing`}
        intro={`Use station pages when the traveler is rail-first or bus-first and the real question is how to route into ${portTitle}, a hotel staging area, or the embarkation side of the trip.`}
        stations={nearbyStations}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">How to use this port page</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4 text-sm leading-7 text-zinc-300">
            <p>
              Port pages work best when the traveler already knows the stop and needs to answer what fits the usable shore window. That usually means comparing shore excursions, transfer friction, tendering risk, and whether the best plan is to stay close to port or commit to one bigger outing.
            </p>
            <p>
              This page is stronger than a generic tours result because it keeps the decision tied to real cruise timing and port-specific context.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best next clicks</div>
            <div className="mt-4 grid gap-3">
              <Link href="/ports" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                Ports directory
              </Link>
              <Link href={`/cruises/from/${canonicalPortSlug}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                Cruises from {portTitle}
              </Link>
              <Link href="/cruises/shore-excursions" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                Shore excursions guide
              </Link>
              <Link href="/cruises/tendering" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">
                Tendering guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      <BookableToursSection
        cityName={portTitle}
        title="Book Shore Excursions & Port Activities"
        description={`Use DCC to compare ${portTitle} excursion windows, transfers, and day tours, then continue into secure booking with Viator.`}
        primaryLabel="Browse Shore Excursions"
        primaryHref={`/tours?q=${encodeURIComponent(`${portTitle} shore excursions`)}`}
        secondaryLabel="Browse Port Transfers"
        secondaryHref={`/tours?q=${encodeURIComponent(`${portTitle} cruise transfer`)}`}
        intents={bookingIntents.map((intent) => ({
          label: intent,
          href: `/tours?q=${encodeURIComponent(intent)}`,
        }))}
        eyebrow="Book with DCC via Viator"
      />

      <ViatorTourGrid
        placeName={portTitle}
        title={`Popular ${portTitle} shore excursions`}
        description={`Rendered from the existing DCC Viator action layer for ${portTitle}. When live product data is missing, this section falls back to tracked Viator search routes.`}
        products={viatorAction.products}
        fallbacks={bookingIntents.map((intent) => ({
          label: intent,
          query: intent,
        }))}
        linkBuilder={({ href, intentQuery, categoryLabel }: { href: string; intentQuery: string; categoryLabel?: string }) =>
          buildPortTrackedHref({
            href,
            port: canonicalPortSlug,
            lane: "authority",
            sourceSection: "port_excursions_category",
            intentQuery,
            categoryLabel,
          })
        }
      />

      <CruiseSpecialtyLaneSection
        title={`${portTitle} specialty cruise lanes`}
        description={`This port currently appears in themed cruise lanes that connect niche cruise demand with shore excursions, logistics planning, and bookable handoffs.`}
        lanes={specialtyLanes}
        contextType="port"
        contextName={portTitle}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Best-fit port planning lanes</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-semibold">Excursion-first</h3>
            <p className="mt-2 text-sm text-zinc-300">Use this page when the stop is mainly about choosing the right shore day.</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-semibold">Transfer-sensitive</h3>
            <p className="mt-2 text-sm text-zinc-300">Best when port traffic, return timing, or ride logistics can change what is realistic.</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-semibold">Tender or crowd risk</h3>
            <p className="mt-2 text-sm text-zinc-300">Useful when the ship day may lose effective time to boarding friction or congestion.</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="font-semibold">Stay close to port</h3>
            <p className="mt-2 text-sm text-zinc-300">Choose conservative excursions when the schedule or port layout does not reward a long inland route.</p>
          </article>
        </div>
      </section>

      <SatelliteHandoffStatusCard handoffId={handoffId} title="WTA Handoff Status" />

      <NextStepEngine
        title={`${portTitle} best next step`}
        description="DCC should decide whether this port day stays authority-first or moves into execution now."
        actions={nextActions}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Port Sailings</h2>
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            {payload.summary?.total_results ?? payload.cruises.length} results
          </span>
        </div>
        <StatGrid
          items={[
            { label: "Sort mode", value: payload.summary?.sort_mode || "departure" },
            { label: "Port slug", value: canonicalPortSlug },
          ]}
        />

        <div className="space-y-4">
          {payload.cruises.map((sailing) => {
            const handoffHref = buildDccWtaHandoffHref({
              sourceSlug: "dcc-cruises-port",
              topicSlug: "shore-excursions",
              portSlug: canonicalPortSlug,
              cruiseShip: sailing.ship,
              cruiseShipSlug: sailing.ship_slug,
              date: fmtDate(sailing.departure_date),
              source: "dcc",
              version: "1",
            });
            return (
              <article
                key={sailing.sailing_id}
                className="rounded-xl border border-white/10 bg-black/20 p-5 space-y-3"
              >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">
                    {sailing.line} • {sailing.ship}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Departs {fmtDate(sailing.departure_date)} • {sailing.duration_days} days •{" "}
                    {sailing.availability_status || "availability n/a"}
                  </p>
                </div>
                {typeof sailing.starting_price?.amount === "number" ? (
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Starting From</div>
                    <div className="text-cyan-300 font-semibold">
                      {sailing.starting_price.currency} {sailing.starting_price.amount}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="text-sm text-zinc-300">
                Route: {sailing.ports.map((p) => p.port_name).join(" -> ")}
              </div>

              <div className="pt-1 flex flex-wrap gap-4 text-sm">
                <Link
                  href={`/cruises/ship/${slugifyCruiseRoute(sailing.ship_slug || sailing.ship)}`}
                  className="text-zinc-300 hover:text-zinc-100"
                >
                  Ship profile →
                </Link>
                <a
                  href={handoffHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-200 text-sm"
                >
                  WTA handoff →
                </a>
                {sailing.external_booking_url ? (
                  <a
                    href={sailing.external_booking_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored nofollow"
                    className="text-cyan-300 hover:text-cyan-200 text-sm"
                  >
                    {ACTION_LABELS.providerSite} →
                  </a>
                ) : null}
              </div>
              </article>
            );
          })}
        </div>
      </section>

      <CruisePortHybridSection
        portSlug={canonicalPortSlug}
        portTitle={portTitle}
        isAlaskaPort={isAlaskaPortContext}
      />

      <DiagnosticsBlock
        diagnostics={payload.diagnostics}
        extraLine={payload.summary?.sort_mode ? `sort_mode=${payload.summary.sort_mode}` : null}
      />

      <footer className="pt-4">
        <div className="flex flex-wrap gap-4">
          <Link href="/" className="text-zinc-400 hover:text-zinc-200 text-sm">
            Back to home →
          </Link>
          <Link href="/cruises/shore-excursions" className="text-zinc-400 hover:text-zinc-200 text-sm">
            Shore excursions hub →
          </Link>
        </div>
      </footer>
    </main>
  );
}
