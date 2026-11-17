import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FrenchQuarterCommercialHub from "../FrenchQuarterCommercialHub";
import WnoTurnaroundTimingCalculator from "../../components/WnoTurnaroundTimingCalculator";
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
      <div data-wno-surface="directory-dark" className="min-h-screen bg-[#080708] px-6 py-14 text-[#fdfbf7]">
        <div className="mx-auto max-w-4xl">
          <Link href="/areas" className="text-sm text-[#d4af37] underline">
            ← All Verified New Orleans Areas &amp; Basins
          </Link>
          <div
            data-testid="held-place-noindex-banner"
            className="mt-6 rounded-xl border border-amber-400/40 bg-amber-950/30 p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Unindexed Draft Area Record · Verification Pending
            </p>
            <h1 className="mt-2 font-serif text-3xl md:text-5xl">{place.name}</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              This micro-corridor or neighborhood record is intentionally held out of public search
              sitemaps (<code>noindex, follow</code>) until verified local tour meeting points,
              active operator schedules, and municipal facility citations are completed.
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-amber-100/90">
              {gate.holdDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <Link
                href="/areas/french-quarter"
                className="rounded bg-[#d4af37] px-4 py-2.5 font-bold text-[#080708]"
              >
                Explore French Quarter Hub →
              </Link>
              <Link
                href="/areas"
                className="rounded border border-white/20 px-4 py-2.5 font-semibold text-white"
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

  const canonicalAppendix = (
    <section
      data-wno-surface="directory-dark"
      data-testid="canonical-area-directory-section"
      className="bg-[#080708] px-6 py-14 text-[#fdfbf7]"
    >
      <div className="mx-auto max-w-6xl">
        {slug !== "french-quarter" && (
          <>
            <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/60">
              <Link href="/" className="hover:text-[#d4af37]">
                Home
              </Link>
              <span>/</span>
              <Link href="/areas" className="hover:text-[#d4af37]">
                Areas &amp; Basins
              </Link>
              <span>/</span>
              <span className="text-[#d4af37]">{place.name}</span>
            </nav>

            <div className="overflow-hidden rounded-xl border border-white/15 aspect-[16/9] max-h-[340px] mb-8">
              <img
                src={place.heroImage}
                alt={place.heroImageAlt}
                className="h-full w-full object-cover"
              />
            </div>

            <span className="inline-block rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              {formatPlaceTypeBadge(place.placeType)}
            </span>
            <h1 className="mt-4 font-serif text-4xl md:text-6xl">{place.name}</h1>
            <p className="mt-2 text-sm font-medium text-white/65">
              {place.subRegionLabel} · Verified {place.verifiedAt}
            </p>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-white/85">
              {place.overview}
            </p>
          </>
        )}

        {/* TRAFFIC-QUALIFIED DRIVE-TIME PLANNING ESTIMATE */}
        {drive && (
          <div
            data-testid="traffic-qualified-drive-estimate"
            className="mt-8 rounded-xl border border-amber-400/35 bg-amber-950/20 p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
              Traffic-Qualified Drive-Time Planning Estimate (Not a Guarantee)
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <span className="text-xs text-white/60">Origin &amp; Distance</span>
                <p className="font-semibold text-white">
                  {drive.originLabel}: {drive.distanceMilesMin}–{drive.distanceMilesMax} miles
                </p>
              </div>
              <div>
                <span className="text-xs text-white/60">Typical vs. Peak Traffic</span>
                <p className="font-semibold text-amber-200">
                  {drive.typicalMinutesMin}–{drive.typicalMinutesMax} mins typical (up to{" "}
                  {drive.peakTrafficMinutesMax} mins peak)
                </p>
              </div>
              <div>
                <span className="text-xs text-white/60">Return Uber / Lyft Reality</span>
                <p className="font-semibold text-white">
                  {drive.rideshareReturnAvailability === "none_rely_on_shuttle_or_car"
                    ? "No reliable return rideshare — use car or shuttle"
                    : drive.rideshareReturnAvailability === "limited_outbound_unreliable_return"
                      ? "Outbound possible; return pickups unreliable"
                      : "Regulated airport taxi & rideshare zones active"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/80">
              <strong>Primary Route:</strong> {drive.primaryRouteSummary}.{" "}
              {drive.trafficQualificationNote}
            </p>
          </div>
        )}

        {/* HISTORICAL & ENSLAVEMENT GOVERNANCE CONTEXT FOR RIVER ROAD / MUSEUMS */}
        {place.historicSiteGovernance && (
          <div
            data-testid="historic-site-enslavement-context"
            className="mt-8 rounded-xl border border-[#d4af37]/40 bg-[#141018] p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Historical &amp; Enslavement Context · Entity Governance
            </p>
            <h2 className="mt-2 font-serif text-2xl">
              {place.historicSiteGovernance.legalEntityName} (
              {place.historicSiteGovernance.taxOrHeritageDesignation})
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              {place.historicSiteGovernance.enslavementHistorySummary}
            </p>
            <p className="mt-3 text-xs text-white/70">
              <strong>Site Address:</strong> {place.historicSiteGovernance.physicalStreetAddress} ·{" "}
              <strong>Phone:</strong> {place.historicSiteGovernance.officialSitePhone} ·{" "}
              <a
                href={place.historicSiteGovernance.officialSiteWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d4af37] underline"
              >
                Official Museum / Historic Site Website ↗
              </a>{" "}
              · <em>Modeled as a historic site/museum entity, separate from licensed bus operators.</em>
            </p>
          </div>
        )}

        {/* PORT NOLA CRUISE TERMINAL LOGISTICS */}
        {place.cruiseTerminalLogistics && (
          <div
            data-testid="port-nola-terminal-logistics"
            className="mt-8 rounded-xl border border-sky-400/35 bg-sky-950/20 p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">
              Official Port NOLA Cruise Terminal Logistics
            </p>
            <h2 className="mt-2 font-serif text-2xl">
              {place.cruiseTerminalLogistics.streetAddress}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 text-xs leading-relaxed text-white/85">
              <div>
                <p>
                  <strong className="text-white">Primary Cruise Lines:</strong>{" "}
                  {place.cruiseTerminalLogistics.primaryCruiseLines.join(", ")}
                </p>
                <p className="mt-2">
                  <strong className="text-white">Official Parking Facility:</strong>{" "}
                  {place.cruiseTerminalLogistics.officialParkingFacility}
                </p>
                <p className="mt-1 text-white/75">
                  {place.cruiseTerminalLogistics.parkingNotes}
                </p>
              </div>
              <div>
                <p>
                  <strong className="text-white">Vehicle Drop-Off Routing:</strong>{" "}
                  {place.cruiseTerminalLogistics.dropOffRoutingNotes}
                </p>
                <p className="mt-2">
                  <strong className="text-white">Turnaround Luggage Rule:</strong>{" "}
                  {place.cruiseTerminalLogistics.luggageStorageNotes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VERIFIED MEETING POINTS, WHARVES & DOCKS */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/15 bg-[#121016] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Access &amp; Pickup Rules
            </p>
            <h2 className="mt-2 font-serif text-2xl">Getting here &amp; check-in</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              {place.accessAndTransitSummary}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              {place.pickupAndArrivalNotes}
            </p>
            <p className="mt-3 text-xs text-white/60">
              <strong>Seasonal &amp; Event Advisory:</strong> {place.weatherOrSeasonalAdvice}
            </p>
          </div>

          <div className="rounded-xl border border-white/15 bg-[#121016] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Verified Docks, Wharves &amp; Check-In Points
            </p>
            <h2 className="mt-2 font-serif text-2xl">Exact physical coordinates</h2>
            <ul className="mt-4 space-y-3 text-xs text-white/85">
              {place.meetingAndAccessPoints.map((mp) => (
                <li key={mp.locationId} className="border-b border-white/10 pb-3 last:border-b-0">
                  <strong className="text-white">{mp.name}</strong>
                  <p className="mt-1 text-white/70">{mp.transitOrWalkNotes}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* DISTINCT GEOGRAPHIC RELATIONSHIPS */}
        {place.relationships.length > 0 && (
          <div className="mt-10 rounded-xl border border-white/15 bg-[#121016] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Geographic Relationships &amp; Disambiguation
            </p>
            <h2 className="mt-2 font-serif text-2xl">
              How {place.name} relates to nearby basins, sites &amp; terminals
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {place.relationships.map((rel) => (
                <div
                  key={rel.targetPlaceId}
                  className="rounded-lg border border-white/10 bg-[#0b090e] p-4 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-white">{rel.targetName}</strong>
                    <span className="text-[#d4af37]">{rel.distanceOrTransitSummary}</span>
                  </div>
                  <p className="mt-2 leading-relaxed text-white/75">
                    {rel.geographicExplanation}
                  </p>
                  {rel.targetPublicSlug && (
                    <Link
                      href={`/areas/${rel.targetPublicSlug}`}
                      className="mt-2 inline-block font-semibold text-[#d4af37] underline"
                    >
                      View {rel.targetName} guide →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AREA-CATEGORY COMPARISONS */}
        {areaComparisons.length > 0 && (
          <div className="mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Multi-Operator Category Comparisons
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {areaComparisons.map((cmp) => (
                <Link
                  key={cmp.category.categorySlug}
                  href={`/areas/${slug}/${cmp.category.categorySlug}`}
                  className="rounded-xl border border-[#d4af37]/35 bg-[#121016] p-5 hover:border-[#d4af37]"
                >
                  <p className="text-xs text-[#d4af37]">
                    {cmp.operatorCount} Verified Operators · {cmp.productCount} Active Tours
                  </p>
                  <h3 className="mt-1 font-serif text-xl text-white">
                    {cmp.comparison?.h1}
                  </h3>
                  <p className="mt-2 text-xs text-white/75">
                    Compare vessel types, pickup windows, and check-in addresses →
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
            className="mt-10 rounded-xl border border-white/15 bg-[#121016] p-6"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Consolidated Category Coverage Within {place.name}
            </p>
            <div className="mt-3 space-y-3">
              {consolidatedAreaCategories.map((heldCat) => (
                <div key={heldCat.category.categorySlug}>
                  <h3 className="font-serif text-xl text-white">{heldCat.category.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/80">
                    {heldCat.category.summary} Verified operators ({heldCat.operatorCount}) and
                    active tours ({heldCat.productCount}) for this category are consolidated directly
                    on this {place.name} directory page below rather than split onto a separate
                    sub-page.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOCAL VERIFIED OPERATORS */}
        {localOperators.length > 0 && (
          <div className="mt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Verified Operators Serving {place.name}
            </p>
            <h2 className="mt-2 font-serif text-3xl">
              Compare licensed companies operating in or to {place.name}
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {localOperators.map(({ operator }) => (
                <Link
                  key={operator.operatorId}
                  href={`/operators/${operator.slug}`}
                  className="flex flex-col justify-between rounded-xl border border-white/15 bg-[#121016] p-5 hover:border-[#d4af37]"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white">{operator.name}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/75">
                      {operator.tagline}
                    </p>
                  </div>
                  <span className="mt-4 inline-block text-xs font-semibold text-[#d4af37]">
                    Canonical operator profile &amp; dock rules →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE VERIFIED TOURS */}
        {localProducts.length > 0 && (
          <div className="mt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Verified Tours &amp; Departure-Level Boarding Locations
            </p>
            <h2 className="mt-2 font-serif text-3xl">
              Tours currently available for {place.name}
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {localProducts.map((prod) => {
                const targetHref =
                  prod.wnoPublicTourPath || `/operators/${prod.operatorSlug}`;
                return (
                  <article
                    key={prod.productId}
                    className="flex flex-col justify-between rounded-xl border border-white/15 bg-[#121016] p-6"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#d4af37]">
                        {prod.operatorName} · {prod.durationLabel}
                      </p>
                      <h3 className="mt-1 font-serif text-xl text-white">{prod.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-white/75">
                        {prod.summary}
                      </p>
                      <p className="mt-3 text-xs text-white/80">
                        <strong>Boarding / Check-In:</strong>{" "}
                        {prod.boardingLocationResolution.primaryBoardingWharfOrDock}
                      </p>
                      {prod.boardingLocationResolution.companionOrAlternateBoardingRule && (
                        <p className="mt-1 text-[11px] text-amber-200/85">
                          {prod.boardingLocationResolution.companionOrAlternateBoardingRule}
                        </p>
                      )}
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <span className="text-xs font-semibold text-white/90">
                        {prod.priceDisplayLabel}
                      </span>
                      <Link
                        href={targetHref}
                        className="rounded bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#080708]"
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
            href: p.wnoPublicTourPath || `/operators/${p.operatorSlug}`,
          }))}
        />

        {/* OFFICIAL LOCAL SOURCES & PROVENANCE */}
        <div className="mt-12 border-t border-white/15 pt-8 text-xs text-white/70">
          <p className="font-bold uppercase tracking-wider text-white/90">
            Official Local Tourism, Civic &amp; Primary Sources (Verified {place.verifiedAt})
          </p>
          <ul className="mt-3 space-y-1.5">
            {place.officialLocalSources.map((src) => (
              <li key={src.url}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4af37] underline"
                >
                  {src.label}
                </a>{" "}
                (checked {src.checkedAt})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  if (slug === "french-quarter") {
    return (
      <>
        <FrenchQuarterCommercialHub />
        {canonicalAppendix}
      </>
    );
  }

  return canonicalAppendix;
}
