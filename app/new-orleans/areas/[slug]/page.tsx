import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/app/components/dcc/JsonLd";
import FrenchQuarterCommercialHub from "../FrenchQuarterCommercialHub";
import WnoTurnaroundTimingCalculator from "../../components/WnoTurnaroundTimingCalculator";
import WnoSourcesAndFreshnessDisclosure from "../../components/WnoSourcesAndFreshnessDisclosure";
import OperatorIdentityMark from "../../components/OperatorIdentityMark";
import { buildWnoAreaDetailJsonLd } from "../../lib/structuredData";
import { normalizeWtnoTourPath } from "../../lib/wtnoDirectoryHelpers";
import {
  NEW_ORLEANS_PLACES,
  findNewOrleansPlaceBySlug,
  getNewOrleansDirectorySnapshot,
} from "@/lib/dcc/shared/newOrleansDirectoryData";

export function generateStaticParams() {
  return NEW_ORLEANS_PLACES.filter((p) => Boolean(p.publicPlaceSlug)).map((p) => ({
    slug: p.publicPlaceSlug!,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = findNewOrleansPlaceBySlug(slug);
  if (!found) return {};

  const { place, gate } = found;
  const title = `${place.name} Tours, Logistics & Operators | Welcome to New Orleans Tours`;
  const description = place.hook;

  return {
    title,
    description,
    alternates: { canonical: `/areas/${slug}` },
    robots: {
      index: gate.indexable,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `/areas/${slug}`,
      type: "website",
    },
  };
}

function formatPlaceTypeBadge(placeType: string): string {
  switch (placeType) {
    case "historic_site_or_museum":
      return "Independent Historic Site / Museum (Not a Bus Operator)";
    case "river_road_heritage_corridor":
      return "Great River Road Historical & Enslavement Heritage Corridor";
    case "bayou_or_wetland_corridor":
      return "Wetland & Bayou Excursion Basin";
    case "cruise_turnaround_terminal":
      return "Port NOLA Cruise Turnaround Terminal";
    case "airport_transfer_corridor":
      return "Regional Airport Transfer Corridor";
    case "riverfront_wharf_or_dock":
      return "Mississippi Riverfront Excursion Wharves";
    default:
      return "Walkable New Orleans Neighborhood";
  }
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = findNewOrleansPlaceBySlug(slug);
  if (!found) {
    notFound();
  }

  const { place, gate } = found;
  const snapshot = getNewOrleansDirectorySnapshot();

  // Held draft areas render cleanly with explicit noindex status and helpful navigation to verified areas
  if (!gate.indexable) {
    return (
      <div
        data-wno-surface="directory-warm"
        className="min-h-screen bg-[#faf6ee] px-6 py-14 text-[#1e1915]"
      >
        <div className="mx-auto max-w-4xl">
          <Link href="/areas" className="text-sm font-semibold text-[#163828] underline">
            ← All Verified New Orleans Areas &amp; Basins
          </Link>
          <div
            data-testid="held-place-noindex-banner"
            className="mt-6 rounded-2xl border border-[#b8893a]/50 bg-[#fffdf9] p-6 md:p-8"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#8a6220]">
              Area Guide Pending Local Verification
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#163828] md:text-5xl">
              {place.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              This micro-corridor or neighborhood record is held out of search indexing until
              verified local tour meeting points, active operator schedules, and municipal facility
              citations are completed.
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-[#4a4138]">
              {gate.holdDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <Link
                href="/areas/french-quarter"
                className="wno-dir-primary-btn rounded-full bg-[#163828] px-5 py-2.5 font-bold text-[#faf6ee]"
              >
                Explore French Quarter Hub →
              </Link>
              <Link
                href="/areas"
                className="wno-dir-secondary-btn rounded-full border border-[#163828] bg-[#faf6ee] px-5 py-2.5 font-semibold text-[#163828]"
              >
                Browse All 16 Verified Places →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const localOperators = snapshot.operators.filter(
    (entry) =>
      entry.gate.indexable &&
      (entry.operator.publicPlaceSlugs.includes(slug) ||
        entry.operator.servedPlaceIds.includes(place.placeId)),
  );

  const localProducts = snapshot.operators
    .filter((entry) => entry.gate.indexable)
    .flatMap((entry) => entry.products)
    .filter(
      (prod) =>
        !prod.isCommerciallyHeld &&
        Boolean(prod.verifiedAt) &&
        (prod.placeSlug === slug ||
          prod.visitedHistoricSiteIds?.includes(place.placeId)),
    );

  const areaComparisons = snapshot.areaCategories.filter(
    (c) => c.areaSlug === slug && c.gate.indexable,
  );
  const consolidatedAreaCategories = snapshot.areaCategories.filter(
    (c) => c.areaSlug === slug && !c.gate.indexable,
  );

  const drive = place.driveEstimateFromFrenchQuarter;
  const outboundMax = drive ? drive.typicalMinutesMax : 15;
  const primaryCoord = place.meetingAndAccessPoints[0];

  const areaJsonLd = buildWnoAreaDetailJsonLd({
    slug,
    name: place.name,
    description: place.hook,
    image: place.heroImage,
    latitude: primaryCoord?.latitude ?? null,
    longitude: primaryCoord?.longitude ?? null,
  });

  const canonicalAppendix = (
    <div
      data-wno-surface="directory-warm"
      data-testid="canonical-area-directory-section"
      className="bg-[#faf6ee] text-[#1e1915]"
    >
      {slug !== "french-quarter" && (
        <section className="wno-dir-hero border-b-2 border-[#b8893a] bg-[#163828] px-6 py-12 md:py-16 text-[#faf6ee]">
          <div className="mx-auto max-w-6xl">
            <nav
              aria-label="Breadcrumb"
              className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#faf6ee]/75"
            >
              <Link href="/" className="hover:text-[#e4c17a] hover:underline">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/areas" className="hover:text-[#e4c17a] hover:underline">
                Areas &amp; Basins
              </Link>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-[#e4c17a]">{place.name}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <span className="wno-pill-brass">
                  {formatPlaceTypeBadge(place.placeType)}
                </span>
                <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-[#faf6ee] md:text-6xl">
                  {place.name}
                </h1>
                <p className="mt-2 text-sm font-medium text-[#e4c17a]">
                  {place.subRegionLabel}
                </p>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#efe7d8] md:text-lg">
                  {place.overview}
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#e4c17a]/40 bg-[#0f291d] shadow-xl">
                <div className="aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={place.heroImage}
                    alt={place.heroImageAlt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="px-4 py-2 text-[11px] text-[#efe7d8]/80">
                  {place.heroImageCredit}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-14">
        {slug === "french-quarter" && (
          <div className="mb-8 border-t border-[#1e1915]/12 pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              French Quarter Logistics, Wharves &amp; Verified Operators
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#163828]">
              Check-in points, streetcar access &amp; local companies in the Vieux Carré
            </h2>
            <p className="mt-3 max-w-4xl text-base leading-relaxed text-[#4a4138]">
              {place.overview}
            </p>
          </div>
        )}

        {/* TRAFFIC-QUALIFIED DRIVE-TIME PLANNING ESTIMATE */}
        {drive && (
          <div
            data-testid="traffic-qualified-drive-estimate"
            className="rounded-2xl border border-[#b8893a]/45 bg-[#fffdf9] p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              Traffic-Qualified Drive-Time Planning Estimate (Not a Guarantee)
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-3 text-sm">
              <div className="rounded-xl bg-[#faf6ee] p-3.5">
                <span className="text-xs font-medium text-[#6b5a45]">Origin &amp; Distance</span>
                <p className="mt-0.5 font-semibold text-[#1e1915]">
                  {drive.originLabel}: {drive.distanceMilesMin}–{drive.distanceMilesMax} miles
                </p>
              </div>
              <div className="rounded-xl bg-[#faf6ee] p-3.5">
                <span className="text-xs font-medium text-[#6b5a45]">Typical vs. Peak Traffic</span>
                <p className="mt-0.5 font-semibold text-[#163828]">
                  {drive.typicalMinutesMin}–{drive.typicalMinutesMax} mins typical (up to{" "}
                  {drive.peakTrafficMinutesMax} mins peak)
                </p>
              </div>
              <div className="rounded-xl bg-[#faf6ee] p-3.5">
                <span className="text-xs font-medium text-[#6b5a45]">Return Uber / Lyft Reality</span>
                <p className="mt-0.5 font-semibold text-[#6b2737]">
                  {drive.rideshareReturnAvailability === "none_rely_on_shuttle_or_car"
                    ? "No reliable return rideshare — use car or shuttle"
                    : drive.rideshareReturnAvailability === "limited_outbound_unreliable_return"
                      ? "Outbound possible; return pickups unreliable"
                      : "Regulated airport taxi & rideshare zones active"}
                </p>
              </div>
            </div>
            <p className="mt-3.5 text-xs leading-relaxed text-[#4a4138]">
              <strong className="text-[#1e1915]">Primary Route:</strong> {drive.primaryRouteSummary}.{" "}
              {drive.trafficQualificationNote}
            </p>
          </div>
        )}

        {/* HISTORICAL & ENSLAVEMENT GOVERNANCE CONTEXT FOR RIVER ROAD / MUSEUMS */}
        {place.historicSiteGovernance && (
          <div
            data-testid="historic-site-enslavement-context"
            className="mt-8 rounded-2xl border border-[#6b2737]/30 bg-[#fffdf9] p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6b2737]">
              Historical &amp; Enslavement Context · Independent Museum Governance
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#163828]">
              {place.historicSiteGovernance.legalEntityName} (
              {place.historicSiteGovernance.taxOrHeritageDesignation})
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              {place.historicSiteGovernance.enslavementHistorySummary}
            </p>
            <p className="mt-3 text-xs text-[#4a4138]">
              <strong className="text-[#1e1915]">Site Address:</strong>{" "}
              {place.historicSiteGovernance.physicalStreetAddress} ·{" "}
              <strong className="text-[#1e1915]">Phone:</strong>{" "}
              {place.historicSiteGovernance.officialSitePhone} ·{" "}
              <a
                href={place.historicSiteGovernance.officialSiteWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#163828] underline"
              >
                Official Museum / Historic Site Website ↗
              </a>{" "}
              · <em>Independent historic site/museum entity, separate from licensed bus operators.</em>
            </p>
          </div>
        )}

        {/* PORT NOLA CRUISE TERMINAL LOGISTICS */}
        {place.cruiseTerminalLogistics && (
          <div
            data-testid="port-nola-terminal-logistics"
            className="mt-8 rounded-2xl border border-[#163828]/25 bg-[#fffdf9] p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#163828]">
              Official Port NOLA Cruise Terminal Logistics
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#163828]">
              {place.cruiseTerminalLogistics.streetAddress}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 text-xs leading-relaxed text-[#4a4138]">
              <div className="rounded-xl bg-[#faf6ee] p-4">
                <p>
                  <strong className="text-[#1e1915]">Primary Cruise Lines:</strong>{" "}
                  {place.cruiseTerminalLogistics.primaryCruiseLines.join(", ")}
                </p>
                <p className="mt-2">
                  <strong className="text-[#1e1915]">Official Parking Facility:</strong>{" "}
                  {place.cruiseTerminalLogistics.officialParkingFacility}
                </p>
                <p className="mt-1">{place.cruiseTerminalLogistics.parkingNotes}</p>
              </div>
              <div className="rounded-xl bg-[#faf6ee] p-4">
                <p>
                  <strong className="text-[#1e1915]">Vehicle Drop-Off Routing:</strong>{" "}
                  {place.cruiseTerminalLogistics.dropOffRoutingNotes}
                </p>
                <p className="mt-2">
                  <strong className="text-[#1e1915]">Turnaround Luggage Rule:</strong>{" "}
                  {place.cruiseTerminalLogistics.luggageStorageNotes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VERIFIED MEETING POINTS, WHARVES & DOCKS */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              Access &amp; Pickup Rules
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#163828]">
              Getting here &amp; check-in
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              {place.accessAndTransitSummary}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              {place.pickupAndArrivalNotes}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#6b5a45]">
              <strong className="text-[#1e1915]">Seasonal &amp; Event Advisory:</strong>{" "}
              {place.weatherOrSeasonalAdvice}
            </p>
          </div>

          <div className="rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              Verified Docks, Wharves &amp; Check-In Points
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#163828]">
              Exact departure addresses
            </h2>
            <ul className="mt-4 space-y-3 text-xs text-[#4a4138]">
              {place.meetingAndAccessPoints.map((mp) => (
                <li
                  key={mp.locationId}
                  className="border-b border-[#1e1915]/10 pb-3 last:border-b-0"
                >
                  <strong className="text-[#1e1915]">{mp.name}</strong>
                  <p className="mt-1">{mp.transitOrWalkNotes}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* DISTINCT GEOGRAPHIC RELATIONSHIPS */}
        {place.relationships.length > 0 && (
          <div className="mt-10 rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              Nearby Areas &amp; Geographic Context
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#163828]">
              How {place.name} relates to nearby basins, sites &amp; terminals
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {place.relationships.map((rel) => {
                const targetEntry = rel.targetPublicSlug
                  ? findNewOrleansPlaceBySlug(rel.targetPublicSlug)
                  : null;
                const canLinkTarget = Boolean(
                  rel.targetPublicSlug && targetEntry?.gate.indexable,
                );
                return (
                  <div
                    key={rel.targetPlaceId}
                    className="rounded-xl border border-[#1e1915]/10 bg-[#faf6ee] p-4 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-[#163828]">{rel.targetName}</strong>
                      <span className="font-semibold text-[#8a6220]">
                        {rel.distanceOrTransitSummary}
                      </span>
                    </div>
                    <p className="mt-2 leading-relaxed text-[#4a4138]">
                      {rel.geographicExplanation}
                    </p>
                    {canLinkTarget && (
                      <Link
                        href={`/areas/${rel.targetPublicSlug}`}
                        className="mt-2 inline-block font-bold text-[#163828] underline hover:text-[#6b2737]"
                      >
                        View {rel.targetName} guide →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AREA-CATEGORY COMPARISONS */}
        {areaComparisons.length > 0 && (
          <div className="mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              Side-by-Side Category Comparisons
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {areaComparisons.map((cmp) => (
                <Link
                  key={cmp.category.categorySlug}
                  href={`/areas/${slug}/${cmp.category.categorySlug}`}
                  className="wno-dir-card rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6 hover:border-[#b8893a]"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8a6220]">
                    {cmp.operatorCount} Verified Operators · {cmp.productCount} Active Tours
                  </p>
                  <h3 className="mt-1.5 font-serif text-xl font-bold text-[#163828]">
                    {cmp.comparison?.h1}
                  </h3>
                  <p className="mt-2 text-xs font-semibold text-[#6b2737]">
                    Compare vessel types, pickup windows &amp; check-in addresses →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CONSOLIDATED IN-AREA CATEGORY COVERAGE (HELD STANDALONE INTERSECTIONS) */}
        {consolidatedAreaCategories.length > 0 && (
          <div
            data-testid="consolidated-parent-area-categories"
            className="mt-10 rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              Included Experience Types in {place.name}
            </p>
            <div className="mt-3 space-y-3">
              {consolidatedAreaCategories.map((heldCat) => (
                <div key={heldCat.category.categorySlug}>
                  <h3 className="font-serif text-xl font-bold text-[#163828]">
                    {heldCat.category.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#4a4138]">
                    {heldCat.category.summary} Verified operators ({heldCat.operatorCount}) and
                    active tours ({heldCat.productCount}) for this category are listed directly
                    below on this {place.name} guide.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOCAL VERIFIED OPERATORS */}
        {localOperators.length > 0 && (
          <div className="mt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              Verified Operators Serving {place.name}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#163828]">
              Compare licensed companies operating in or to {place.name}
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {localOperators.map(({ operator }) => (
                <Link
                  key={operator.operatorId}
                  href={`/operators/${operator.slug}`}
                  className="wno-dir-card flex flex-col justify-between rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-5 hover:border-[#b8893a]"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <OperatorIdentityMark name={operator.name} size="sm" variant="on-light" />
                      <h3 className="font-serif text-lg font-bold text-[#163828]">
                        {operator.name}
                      </h3>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-[#4a4138]">
                      {operator.tagline}
                    </p>
                  </div>
                  <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-[#6b2737]">
                    Operator profile &amp; dock rules →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE VERIFIED TOURS */}
        {localProducts.length > 0 && (
          <div className="mt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              Tours &amp; Departure Boarding Locations
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#163828]">
              Tours currently available for {place.name}
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {localProducts.map((prod) => {
                const targetHref = normalizeWtnoTourPath(
                  prod.wnoPublicTourPath || `/operators/${prod.operatorSlug}`,
                );
                return (
                  <article
                    key={prod.productId}
                    className="wno-dir-card flex flex-col justify-between rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8a6220]">
                        {prod.operatorName} · {prod.durationLabel}
                      </p>
                      <h3 className="mt-1.5 font-serif text-xl font-bold text-[#163828]">
                        {prod.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-[#4a4138]">
                        {prod.summary}
                      </p>
                      <p className="mt-3 text-xs text-[#1e1915]">
                        <strong>Boarding / Check-In:</strong>{" "}
                        {prod.boardingLocationResolution.primaryBoardingWharfOrDock}
                      </p>
                      {prod.boardingLocationResolution.companionOrAlternateBoardingRule && (
                        <p className="mt-1.5 rounded-lg bg-[#faf6ee] px-3 py-1.5 text-[11px] text-[#6b2737]">
                          {prod.boardingLocationResolution.companionOrAlternateBoardingRule}
                        </p>
                      )}
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#1e1915]/10 pt-4">
                      <span className="text-xs font-bold text-[#163828]">
                        {prod.priceDisplayLabel}
                      </span>
                      <Link
                        href={targetHref}
                        className="wno-dir-primary-btn rounded-full bg-[#163828] px-4 py-2 text-xs font-bold text-[#faf6ee]"
                      >
                        View Tour &amp; Booking →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* PORT NOLA & MSY TIMING-FIT CALCULATOR */}
        <WnoTurnaroundTimingCalculator
          areaName={place.name}
          outboundTransferMinutesMax={outboundMax}
          tours={localProducts.map((p) => ({
            productId: p.productId,
            title: p.title,
            operatorName: p.operatorName,
            durationMinutes: p.durationMinutes,
            durationLabel: p.durationLabel,
            luggageCompatibleForTurnaround: p.luggageCompatibleForTurnaround,
            href: normalizeWtnoTourPath(
              p.wnoPublicTourPath || `/operators/${p.operatorSlug}`,
            ),
          }))}
        />

        {/* CALM SOURCES & FRESHNESS DISCLOSURE */}
        <WnoSourcesAndFreshnessDisclosure
          verifiedAt={place.verifiedAt}
          sources={place.officialLocalSources}
        />
      </div>
    </div>
  );

  if (slug === "french-quarter") {
    return (
      <>
        <JsonLd data={areaJsonLd} />
        <FrenchQuarterCommercialHub />
        {canonicalAppendix}
      </>
    );
  }

  return (
    <>
      <JsonLd data={areaJsonLd} />
      {canonicalAppendix}
    </>
  );
}
