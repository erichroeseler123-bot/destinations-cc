export const dynamicParams = true;
export const revalidate = 3600;

import type { Metadata } from "next";
import Link from "next/link";
import { getPortBySlug, getPortSlugs } from "@/lib/dcc/ports";
import { getCruisePortReference, getCruisePortViatorSearch } from "@/lib/dcc/cruisePortDirectory";
import {
  buildPortPageMetadata,
  renderPortPage,
} from "@/app/ports/[slug]/PortPageShared";

import KahuluiMaalaeaWhaleWatchingPlanner from "@/app/components/dcc/KahuluiMaalaeaWhaleWatchingPlanner";
import PortDayExcursionCatalogSection from "@/app/components/dcc/PortDayExcursionCatalogSection";
import {
  resolveCruisePortExcursionProfile,
  queryPortDayExcursionCatalog,
  type PortDayExcursionViewMode,
  type PortDayExcursionCategoryFilter,
} from "@/lib/dcc/cruisePortExcursionCatalogEngine";

function getReferencePage(slug: string) {
  const reference = getCruisePortReference(slug);
  return reference && !getPortBySlug(slug) ? reference : null;
}

export async function generateStaticParams() {
  return getPortSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const reference = getReferencePage(slug);
  if (!reference) return buildPortPageMetadata(slug, false);
  const isKahului = reference.slug === "kahului";
  const isReykjavik = reference.slug === "reykjavik";
  const excursionProfile = resolveCruisePortExcursionProfile(reference.slug);
  return {
    title: isKahului
      ? "Kahului Harbor → Maʻalaea Whale Watching & Cruise Port Guide | Destination Command Center"
      : isReykjavik
        ? "Reykjavík Cruise Port (Skarfabakki & Miðbakki) Shore Excursions & All-Aboard Fit Checker | Destination Command Center"
        : `${reference.name} cruise port | Destination Command Center`,
    description: isKahului
      ? "Kahului Harbor (Maui) cruise port guide and Maʻalaea Harbor whale-watching all-aboard checker: verified PacWhale Ocean Store meeting point (300 Maʻalaea Rd), 45-minute check-in cutoff, 50-minute round-trip transfer, all-aboard schedule fit, and separate seat availability."
      : isReykjavik
        ? "Reykjavík cruise port shore-excursion catalog (Viator destination 905 · 1,576 reconciled tours) with Skarfabakki & Miðbakki pier transfer checks, departure & check-in cutoffs, all-aboard fit verification, and separate live seat availability."
        : `Cruise-line port references and planning links for ${reference.name}.`,
    alternates: { canonical: `/ports/${reference.slug}` },
    robots: { index: Boolean(isKahului || isReykjavik || excursionProfile), follow: true },
  };
}

export default async function PortPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    scenario?: string;
    shipArrival?: string;
    allAboard?: string;
    shipDeparture?: string;
    viewMode?: string;
    category?: string;
    date?: string;
    partySize?: string;
  }>;
}) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const reference = getReferencePage(slug);
  if (!reference) return renderPortPage(slug, false);
  const viatorUrl = getCruisePortViatorSearch(reference);
  const isKahului = reference.slug === "kahului";
  const excursionProfile = resolveCruisePortExcursionProfile(reference.slug);
  const initialScenarioFilter =
    query.scenario === "fits" ||
    query.scenario === "runs_too_late" ||
    query.scenario === "missing_operator_info"
      ? query.scenario
      : "all";

  const initialViewMode: PortDayExcursionViewMode =
    query.viewMode === "fits_sailing" || query.viewMode === "fits"
      ? "fits_sailing"
      : "browse_all";

  const initialCategory: PortDayExcursionCategoryFilter =
    query.category === "sightseeing" ||
    query.category === "wildlife" ||
    query.category === "food" ||
    query.category === "culture" ||
    query.category === "adventure" ||
    query.category === "family"
      ? query.category
      : "all";

  const initialPartySize = query.partySize ? Math.max(1, Number(query.partySize) || 2) : 2;

  const initialCatalogData = excursionProfile
    ? await queryPortDayExcursionCatalog({
        portSlug: reference.slug,
        viewMode: initialViewMode,
        category: initialCategory,
        shipArrivalTime: query.shipArrival,
        shipAllAboardTime: query.allAboard,
        sailingDate: query.date,
        partySize: initialPartySize,
        limit: 12,
        offset: 0,
      })
    : null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-14 text-zinc-100">
      <Link href="/ports" className="text-sm text-cyan-300">← Browse cruise ports</Link>
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-cyan-300">Cruise port reference</p>
        <h1 className="text-4xl font-bold">{reference.name}</h1>
        <p className="text-zinc-300">
          {[...new Set([reference.area, reference.country].filter(Boolean))].join(" · ")}
        </p>
        <p className="text-zinc-300">
          Check your sailing for the arrival, terminal or tender landing, and all-aboard time before choosing a shore excursion.
        </p>
      </header>

      {isKahului ? (
        <KahuluiMaalaeaWhaleWatchingPlanner
          contextSurface="kahului_port_page"
          initialScenarioFilter={initialScenarioFilter}
          initialShipArrivalTime={query.shipArrival}
          initialShipAllAboardTime={query.allAboard}
          initialShipDepartureTime={query.shipDeparture}
        />
      ) : null}

      {excursionProfile ? (
        <PortDayExcursionCatalogSection
          portSlug={reference.slug}
          initialCatalogData={initialCatalogData}
          initialViewMode={initialViewMode}
          initialCategory={initialCategory}
          initialShipArrivalTime={query.shipArrival}
          initialShipAllAboardTime={query.allAboard}
          initialSailingDate={query.date}
          initialPartySize={initialPartySize}
        />
      ) : null}

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Cruise-line port information</h2>
        <ul className="space-y-2 text-sm text-cyan-300">
          {reference.sources.map((source) => (
            <li key={source.url}><a href={source.url}>{source.line}</a></li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Plan the port day</h2>
        <a href={`/go/dcc-to-cruise-promenade?port=${reference.slug}`} className="block text-cyan-300">
          Open Cruise Promenade
        </a>
        {viatorUrl ? (
          <>
            <a href={viatorUrl} rel="sponsored nofollow" className="block text-cyan-300">Browse shore excursions on Viator</a>
            <p className="text-sm text-zinc-400">
              Marketplace search. Confirm the departure, pickup, return time, and availability for your sailing. DCC may earn a commission.
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}

