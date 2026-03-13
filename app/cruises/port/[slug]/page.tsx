import Link from "next/link";
import { notFound } from "next/navigation";
import DiagnosticsBlock from "@/app/components/DiagnosticsBlock";
import StatGrid from "@/app/components/StatGrid";
import BookableToursSection from "@/app/components/dcc/BookableToursSection";
import CruiseSpecialtyLaneSection from "@/app/components/dcc/CruiseSpecialtyLaneSection";
import CruisePortHybridSection from "@/app/components/dcc/CruisePortHybridSection";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
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

const BASE_URL = "https://destinationcommandcenter.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return listCruisePortSlugs().map((slug) => ({ slug }));
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

function JsonLd({
  portTitle,
  canonicalPortSlug,
  isAlaskaPortContext,
  sailings,
  geo,
  address,
}: {
  portTitle: string;
  canonicalPortSlug: string;
  isAlaskaPortContext: boolean;
  sailings: Awaited<ReturnType<typeof buildCruisePayload>>["cruises"];
  geo: { latitude: number; longitude: number } | null;
  address: { addressLocality: string; addressRegion?: string; addressCountry: string } | null;
}) {
  const pageUrl = `${BASE_URL}/cruises/port/${canonicalPortSlug}`;
  const faq = [
    {
      q: `When is the best time to plan ${portTitle} cruise excursions?`,
      a: `Plan excursions after checking confirmed departure windows for sailings into ${portTitle}. Build buffer time before and after tour activities.`,
    },
    {
      q: `Can I book shore excursions for ${portTitle} online?`,
      a: `Yes. Compare shore excursion options and transfer routes from the ${portTitle} port page and linked booking partners.`,
    },
    {
      q: `Should I keep extra buffer time in ${portTitle}?`,
      a: `Yes. Port traffic, weather, and tender timing can shift schedules, so avoid tight reservation chains.`,
    },
  ];

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${portTitle} Cruise Schedule`,
        description:
          "Cruise port schedule, route context, and shore excursion planning with booking handoffs.",
      },
      {
        "@type": "TouristDestination",
        name: portTitle,
        url: pageUrl,
        touristType: isAlaskaPortContext
          ? ["Cruise travelers", "Shore excursion buyers", "Alaska route planners"]
          : ["Cruise travelers", "Shore excursion buyers"],
        geo: geo
          ? {
              "@type": "GeoCoordinates",
              latitude: geo.latitude,
              longitude: geo.longitude,
            }
          : undefined,
        address: address
          ? {
              "@type": "PostalAddress",
              addressLocality: address.addressLocality,
              addressRegion: address.addressRegion,
              addressCountry: address.addressCountry,
            }
          : undefined,
      },
      {
        "@type": "ItemList",
        name: `${portTitle} upcoming sailings`,
        itemListElement: sailings.slice(0, 24).map((sailing, idx) => ({
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function CruisePortPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const payload = await buildCruisePayload({
    type: "port",
    value: resolved.slug,
  });

  if (!payload || payload.cruises.length === 0) {
    return notFound();
  }

  const canonicalPortSlug = payload.query.value;
  const portTitle = toTitle(canonicalPortSlug);
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

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-10">
      <JsonLd
        portTitle={portTitle}
        canonicalPortSlug={canonicalPortSlug}
        isAlaskaPortContext={isAlaskaPortContext}
        sailings={payload.cruises}
        geo={geo}
        address={address}
      />
      <header className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Cruise Port View</p>
        <h1 className="text-4xl font-black tracking-tight">{portTitle} Cruise Schedule</h1>
        <p className="text-zinc-300 max-w-3xl">
          Truth-first port schedule context from the cruise cache, with excursion discovery and booking handoffs where relevant.
        </p>
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
        <Link href="/" className="text-zinc-400 hover:text-zinc-200 text-sm">
          Back to home →
        </Link>
      </footer>
    </main>
  );
}
