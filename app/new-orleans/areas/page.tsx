import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import { getNewOrleansDirectorySnapshot } from "@/lib/dcc/shared/newOrleansDirectoryData";
import WnoAreasDirectoryClient, {
  type WnoAreaDirectoryCardItem,
} from "../components/WnoAreasDirectoryClient";
import { buildWnoAreasHubJsonLd } from "../lib/structuredData";
import { classifyWnoPlaceFilterGroup } from "../lib/wtnoDirectoryHelpers";

export const metadata: Metadata = {
  title:
    "New Orleans Areas, Swamp Basins, River Road Museums & Port NOLA Terminals",
  description:
    "Explore verified New Orleans tour departure areas: Honey Island, Jean Lafitte / Barataria, Manchac, River Road slavery museums & historic estates, Erato & Julia Cruise Terminals, MSY Airport, and urban neighborhoods.",
  alternates: { canonical: "/areas" },
  robots: { index: true, follow: true },
};

function placeTypeShortLabel(placeType: string): string {
  switch (placeType) {
    case "bayou_or_wetland_corridor":
      return "Swamp & Bayou Basin";
    case "historic_site_or_museum":
      return "Independent Historic Site / Museum";
    case "river_road_heritage_corridor":
      return "River Road Heritage Corridor";
    case "cruise_turnaround_terminal":
      return "Port NOLA Cruise Terminal";
    case "airport_transfer_corridor":
      return "Airport Transfer Corridor";
    case "riverfront_wharf_or_dock":
      return "Mississippi Riverfront Wharves";
    default:
      return "Walkable Neighborhood";
  }
}

function placeCardCtaLabel(placeType: string): string {
  switch (placeType) {
    case "bayou_or_wetland_corridor":
      return "Docks, drive times & swamp operators";
    case "historic_site_or_museum":
    case "river_road_heritage_corridor":
      return "Site context & round-trip shuttles";
    case "cruise_turnaround_terminal":
    case "airport_transfer_corridor":
      return "Terminal parking, luggage & timing";
    default:
      return "Meeting points & local tours";
  }
}

export default function NewOrleansAreasDirectoryPage() {
  const snapshot = getNewOrleansDirectorySnapshot();
  const qualifiedPlaces = snapshot.places.filter((entry) => entry.gate.indexable);

  const qualifiedComparisons = snapshot.areaCategories.filter(
    (entry) => entry.gate.indexable,
  );

  const areaCards: WnoAreaDirectoryCardItem[] = qualifiedPlaces.map(({ place }) => {
    const drive = place.driveEstimateFromFrenchQuarter;
    let driveSummary: string | null = null;
    if (drive) {
      driveSummary = `Planning drive: ${drive.typicalMinutesMin}–${drive.typicalMinutesMax} min typical (up to ${drive.peakTrafficMinutesMax}m peak · ${drive.distanceMilesMin}–${drive.distanceMilesMax} mi)`;
    } else if (place.historicSiteGovernance?.physicalStreetAddress) {
      driveSummary = place.historicSiteGovernance.physicalStreetAddress;
    } else if (place.cruiseTerminalLogistics?.streetAddress) {
      driveSummary = place.cruiseTerminalLogistics.streetAddress;
    }

    return {
      placeId: place.placeId,
      slug: place.publicPlaceSlug!,
      name: place.name,
      subRegionLabel: place.subRegionLabel,
      parishOrJurisdiction: place.parishOrJurisdiction,
      placeTypeLabel: placeTypeShortLabel(place.placeType),
      filterGroup: classifyWnoPlaceFilterGroup(place.placeType),
      heroImage: place.heroImage,
      heroImageAlt: place.heroImageAlt,
      heroImageCredit: place.heroImageCredit,
      hook: place.hook,
      driveSummary,
      ctaLabel: placeCardCtaLabel(place.placeType),
    };
  });

  const schemaData = buildWnoAreasHubJsonLd({
    places: qualifiedPlaces.map(({ place }) => ({
      slug: place.publicPlaceSlug!,
      name: place.name,
      description: place.hook,
    })),
  });

  return (
    <div
      data-wno-surface="directory-warm"
      className="min-h-screen bg-[#faf6ee] text-[#1e1915]"
    >
      <JsonLd data={schemaData} />

      {/* Warm Deep Cypress Hero Header */}
      <section className="wno-dir-hero border-b-2 border-[#b8893a] bg-[#163828] px-6 py-14 md:py-18 text-[#faf6ee]">
        <div className="mx-auto max-w-6xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#faf6ee]/75"
          >
            <Link href="/" className="hover:text-[#e4c17a] underline-offset-4 hover:underline">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-[#e4c17a]">Areas &amp; Basins</span>
          </nav>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e4c17a]">
            Neighborhoods, Bayous &amp; River Road
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-[#faf6ee] md:text-6xl">
            New Orleans neighborhoods, wetland basins, River Road museums &amp; cruise terminals
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#efe7d8]">
            Every tour around New Orleans is shaped by real bridge crossings, dock addresses, and
            terminal rules. Explore Honey Island, Jean Lafitte &amp; Barataria, Manchac, River Road
            historic museums, Erato vs. Julia Cruise Terminals, and French Quarter riverboat wharves
            with realistic planning drive ranges.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5 text-xs">
            <span className="wno-pill-brass">
              {`${qualifiedPlaces.length} Departure Areas & Landmarks`}
            </span>
            <span className="wno-pill-burgundy">
              3 Distinct Swamp Basins Mapped
            </span>
            <Link
              href="/operators"
              className="inline-flex items-center rounded-full border border-[#e4c17a]/50 bg-[#faf6ee]/10 px-3.5 py-1.5 font-semibold text-[#faf6ee] hover:bg-[#b8893a]/25"
            >
              {`Browse ${snapshot.counts.operatorsQualifiedIndexable} Local Tour Operators →`}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <WnoAreasDirectoryClient places={areaCards} />

        {/* QUALIFIED AREA-CATEGORY COMPARISONS */}
        {qualifiedComparisons.length > 0 && (
          <section className="mt-16 border-t border-[#1e1915]/12 pt-12">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6220]">
              Side-by-Side Area Comparisons
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#163828]">
              Compare operators, boat types &amp; meeting points by area
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4a4138]">
              Where multiple verified companies serve the same corridor, compare dock addresses,
              pickup windows, and age policies side by side.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {qualifiedComparisons.map((item) => (
                <Link
                  key={`${item.areaSlug}-${item.category.categorySlug}`}
                  href={`/areas/${item.areaSlug}/${item.category.categorySlug}`}
                  className="wno-dir-card flex flex-col justify-between rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6 transition hover:border-[#b8893a]"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#8a6220]">
                      {item.areaName} · {item.operatorCount} operators · {item.productCount} tours
                    </p>
                    <h3 className="mt-2 font-serif text-xl font-bold text-[#163828]">
                      {item.comparison?.h1 || `${item.areaName} ${item.category.name}`}
                    </h3>
                  </div>
                  <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-[#6b2737]">
                    Open comparison guide →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Warm Traveler Next-Step Strip */}
        <section className="mt-16 rounded-2xl bg-[#163828] p-7 md:p-9 text-[#faf6ee]">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e4c17a]">
                Need Schedule or Hotel-Pickup Guidance?
              </p>
              <h2 className="mt-1.5 font-serif text-2xl md:text-3xl font-bold text-[#faf6ee]">
                Match the right departure area to your hotel or cruise day
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#efe7d8]">
                Compare local operators directly or use Help Me Choose to narrow down tours by
                pickup zone, group ages, and available hours.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/operators"
                className="rounded-full border border-[#e4c17a] bg-[#faf6ee]/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#faf6ee] hover:bg-[#faf6ee]/20"
              >
                Explore Local Operators
              </Link>
              <Link
                href="/help-me-choose"
                className="rounded-full bg-[#b8893a] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#163828] hover:bg-[#ca9a46]"
              >
                Open Help Me Choose →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
