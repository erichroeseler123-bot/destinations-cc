import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DiagnosticsBlock from "@/app/components/DiagnosticsBlock";
import StatGrid from "@/app/components/StatGrid";
import JsonLd from "@/app/components/dcc/JsonLd";
import CruiseSpecialtyLaneSection from "@/app/components/dcc/CruiseSpecialtyLaneSection";
import ShipAuthoritySection from "@/app/components/dcc/ShipAuthoritySection";
import {
  buildCruisePayload,
  listCruiseShipSlugs,
  slugifyCruiseRoute,
} from "@/lib/dcc/internal/cruisePayload";
import { ACTION_LABELS } from "@/lib/dcc/actionLabels";
import { getCruiseSpecialtyLanesForShip } from "@/src/data/cruise-specialty-lanes";
import { getShipAuthorityConfig } from "@/src/data/ship-authority-config";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/dcc/jsonld";
import ShipOutpostConsole from "./ShipOutpostConsole";

const BASE_URL = "https://destinationcommandcenter.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return listCruiseShipSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const shipTitle = toTitle(resolved.slug);
  return {
    title: `${shipTitle} Cruise Sailings and Ship Guide`,
    description: `Upcoming sailings, embarkation context, themed cruise fit, and ship-planning guidance for ${shipTitle}.`,
    keywords: [
      `${shipTitle} cruises`,
      `${shipTitle} sailings`,
      `${shipTitle} ship guide`,
      `${shipTitle} embarkation ports`,
      `${shipTitle} cruise itinerary`,
    ],
    alternates: { canonical: `/cruises/ship/${resolved.slug}` },
    openGraph: {
      title: `${shipTitle} Cruise Sailings and Ship Guide`,
      description: `Upcoming sailings, embarkation context, themed cruise fit, and ship-planning guidance for ${shipTitle}.`,
      url: `${BASE_URL}/cruises/ship/${resolved.slug}`,
      type: "website",
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

export default async function CruiseShipPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const payload = await buildCruisePayload({
    type: "ship",
    value: resolved.slug,
  });

  if (!payload || payload.cruises.length === 0) {
    return notFound();
  }

  if (resolved.slug === "icon-of-the-seas" || resolved.slug === "carnival-jubilee" || resolved.slug === "viking-octantis") {
    return <ShipOutpostConsole payload={payload} shipSlug={resolved.slug} />;
  }

  const first = payload.cruises[0];
  const shipTitle = first.ship || toTitle(resolved.slug);
  const shipSlug = slugifyCruiseRoute(shipTitle);
  const shipConfig = getShipAuthorityConfig(shipSlug);
  const specialtyLanes = getCruiseSpecialtyLanesForShip(shipSlug);
  const faq = [
    {
      question: `How do I compare upcoming sailings for ${shipTitle}?`,
      answer: `Use departure date, duration, and embark port together. Then compare price and availability before booking.`,
    },
    {
      question: `Where can I find embark port details for ${shipTitle}?`,
      answer: `Each sailing links to embark-port pages with schedule context and excursion planning.`,
    },
    {
      question: `Should I book ${shipTitle} sailings early?`,
      answer: `For high-demand dates and cabin classes, earlier booking usually improves inventory options and pricing stability.`,
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 space-y-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildArticleJsonLd({
              path: `/cruises/ship/${shipSlug}`,
              headline: `${shipTitle} Cruise Sailings`,
              description:
                "Cruise ship profile with upcoming sailings, route context, and booking links.",
            }),
            {
              "@type": "Product",
              name: shipTitle,
              category: "Cruise Ship",
              url: `${BASE_URL}/cruises/ship/${shipSlug}`,
              offers:
                typeof payload.cruises[0]?.starting_price?.amount === "number"
                  ? {
                      "@type": "Offer",
                      price: payload.cruises[0].starting_price.amount,
                      priceCurrency: payload.cruises[0].starting_price.currency || "USD",
                    }
                  : undefined,
            },
            {
              "@type": "ItemList",
              name: `${shipTitle} upcoming sailings`,
              itemListElement: payload.cruises.slice(0, 24).map((sailing, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                item: {
                  "@type": "Trip",
                  name: `${shipTitle} • ${fmtDate(sailing.departure_date)}`,
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
              { name: shipTitle, item: `/cruises/ship/${shipSlug}` },
            ]),
            buildFaqJsonLd(faq),
          ],
        }}
      />
      <header className="space-y-3 border-b border-slate-700 pb-8">
        <p className="text-xs uppercase tracking-wider text-cyan-400 font-bold">Cruise Ship View</p>
        <h1 className="text-4xl font-black tracking-tight text-white">{shipTitle}</h1>
        <p className="text-zinc-100 max-w-3xl text-sm leading-relaxed">
          Truth-first ship profile view with upcoming sailings, onboard highlights, and optional external booking actions.
        </p>
        {specialtyLanes.length ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {specialtyLanes.map((lane) => (
              <Link
                key={lane.key}
                href={`/cruises/themed/${lane.key}`}
                className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/15 px-3 py-1 text-xs font-semibold text-fuchsia-300 hover:bg-fuchsia-500/25 transition-all"
              >
                {lane.title}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {shipConfig ? <ShipAuthoritySection ship={shipConfig} /> : null}

      <CruiseSpecialtyLaneSection
        title={`${shipTitle} themed cruise fit`}
        description={`This ship is currently mapped into themed cruise lanes that help users move from ship browsing into niche cruise selection and relevant shore-day intent.`}
        lanes={specialtyLanes}
        contextType="ship"
        contextName={shipTitle}
      />

      <section className="rounded-2xl border border-slate-700 bg-slate-950 p-6 space-y-3">
        <h2 className="text-xl font-bold text-white">Context</h2>
        <p className="text-zinc-100 text-sm leading-relaxed">
          {payload.context.risk_summary || "No risk summary available for this ship yet."}
        </p>
        {payload.context.recent_observations?.length ? (
          <ul className="text-sm text-zinc-300 space-y-1">
            {payload.context.recent_observations.map((obs, i) => (
              <li key={`${obs}-${i}`}>• {obs}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">No recent observations yet.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-950 p-6">
        <h2 className="text-2xl font-bold text-white">How to use this ship page</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4 text-sm leading-relaxed text-zinc-100">
            <p>
              Ship pages are strongest when the traveler already knows the vessel or line and wants to compare upcoming sailings, departure ports, or the type of trip the ship supports best. That is a different search from a port-first or region-first cruise query.
            </p>
            <p>
              This page helps narrow the decision into sailings, embarkation ports, and themed cruise lanes instead of pushing everything into one broad cruise search.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#111625] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-400 font-bold">Best next clicks</div>
            <div className="mt-4 grid gap-3">
              <Link href="/cruises" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-[#1a233b] hover:border-cyan-800 transition-all text-center">
                Cruise explorer
              </Link>
              <Link href="/ports" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-[#1a233b] hover:border-cyan-800 transition-all text-center">
                Ports directory
              </Link>
              {specialtyLanes.slice(0, 2).map((lane) => (
                <Link key={lane.key} href={`/cruises/themed/${lane.key}`} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-[#1a233b] hover:border-cyan-800 transition-all text-center">
                  {lane.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-950 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white">Upcoming Sailings</h2>
          <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
            {payload.summary?.total_results ?? payload.cruises.length} results
          </span>
        </div>
        <StatGrid
          items={[
            { label: "Sort mode", value: payload.summary?.sort_mode || "departure" },
            { label: "Ship slug", value: shipSlug },
          ]}
        />

        <div className="space-y-4">
          {payload.cruises.map((sailing) => (
            <article
              key={sailing.sailing_id}
              className="rounded-xl border border-slate-800 bg-[#111625] p-5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {sailing.line} • {fmtDate(sailing.departure_date)}
                  </h3>
                  <p className="text-sm text-zinc-300 font-medium">
                    {sailing.duration_days} days • {sailing.availability_status || "availability n/a"}
                  </p>
                </div>
                {typeof sailing.starting_price?.amount === "number" ? (
                  <div className="text-right">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Starting From</div>
                    <div className="text-amber-400 font-bold text-lg">
                      {sailing.starting_price.currency} {sailing.starting_price.amount}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="text-sm text-zinc-300">
                Route: {sailing.ports.map((p) => p.port_name).join(" -> ")}
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-xs text-zinc-400">
                <div>
                  Amenities:{" "}
                  {[...sailing.amenities.activities, ...sailing.amenities.entertainment]
                    .slice(0, 4)
                    .join(", ") || "n/a"}
                </div>
                <div>
                  Demand: {sailing.sailing_context?.demand_level || "n/a"}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <Link
                  href={`/cruises/port/${slugifyCruiseRoute(sailing.embark_port.port_name)}`}
                  className="text-cyan-400 font-bold hover:underline"
                >
                  Embark port details →
                </Link>
                {sailing.external_booking_url ? (
                  <a
                    href={sailing.external_booking_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored nofollow"
                    className="text-amber-400 font-bold hover:underline"
                  >
                    {ACTION_LABELS.providerSite} →
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-950 p-6">
        <h2 className="text-2xl font-bold text-white">Best-fit ship planning lanes</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-800 bg-[#111625] p-4">
            <h3 className="font-bold text-white">Ship-first buyer</h3>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">Best when the traveler cares more about the vessel than the port or destination headline.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-[#111625] p-4">
            <h3 className="font-bold text-white">Date and price compare</h3>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">Use this page to compare future sailings without losing the ship context.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-[#111625] p-4">
            <h3 className="font-bold text-white">Embark-port question</h3>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">Jump into departure ports when the sailing works but the logistics still need to be judged.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-[#111625] p-4">
            <h3 className="font-bold text-white">Niche cruise fit</h3>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">Themed lanes help when the ship’s value depends on a niche interest, not just the itinerary.</p>
          </article>
        </div>
      </section>
      <DiagnosticsBlock
        diagnostics={payload.diagnostics}
        extraLine={payload.summary?.sort_mode ? `sort_mode=${payload.summary.sort_mode}` : null}
      />

      <footer className="pt-4">
        <Link href="/cruises" className="text-zinc-400 hover:text-zinc-200 text-sm">
          Back to cruises →
        </Link>
      </footer>
    </main>
  );
}
