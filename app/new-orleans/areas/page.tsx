import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getNewOrleansDirectorySnapshot } from "@/lib/dcc/shared/newOrleansDirectoryData";

export const metadata: Metadata = {
  title:
    "New Orleans Areas, Swamp Basins, River Road Museums & Port NOLA Terminals",
  description:
    "Explore verified New Orleans tour departure areas: Honey Island, Jean Lafitte / Barataria, Manchac, River Road slavery museums & historic estates, Erato & Julia Cruise Terminals, MSY Airport, and urban neighborhoods.",
  alternates: { canonical: "/areas" },
  robots: { index: true, follow: true },
};

export default function NewOrleansAreasDirectoryPage() {
  const snapshot = getNewOrleansDirectorySnapshot();
  const qualifiedPlaces = snapshot.places.filter((entry) => entry.gate.indexable);

  const wetlandBasins = qualifiedPlaces.filter(
    (e) => e.place.placeType === "bayou_or_wetland_corridor",
  );
  const riverRoadAndMuseums = qualifiedPlaces.filter(
    (e) =>
      e.place.placeType === "river_road_heritage_corridor" ||
      e.place.placeType === "historic_site_or_museum",
  );
  const terminalsAndAirport = qualifiedPlaces.filter(
    (e) =>
      e.place.placeType === "cruise_turnaround_terminal" ||
      e.place.placeType === "airport_transfer_corridor",
  );
  const urbanAndRiverfront = qualifiedPlaces.filter(
    (e) =>
      e.place.placeType === "urban_neighborhood" ||
      e.place.placeType === "riverfront_wharf_or_dock",
  );

  const qualifiedComparisons = snapshot.areaCategories.filter(
    (entry) => entry.gate.indexable,
  );

  return (
    <div data-wno-surface="directory-dark" className="min-h-screen bg-[#080708] px-6 py-14 text-[#fdfbf7]">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d4af37]">
          Greater New Orleans Canonical Place Directory
        </p>
        <h1 className="mt-3 font-serif text-4xl md:text-6xl">
          New Orleans neighborhoods, wetland basins, River Road museums &amp; cruise terminals
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-white/80">
          Every tour around New Orleans is shaped by real bridge crossings, dock addresses, and
          terminal rules. We keep Honey Island, Jean Lafitte / Barataria, Manchac, River Road
          historic museums, Erato vs. Julia Cruise Terminals, and French Quarter riverboat wharves
          distinct—with traffic-qualified planning drive ranges rather than generic city-center
          promises.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/80">
          <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3.5 py-1.5 font-semibold text-[#d4af37]">
            {snapshot.counts.placesQualifiedIndexable} Verified Public Places
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5">
            {snapshot.counts.operatorsQualifiedIndexable} Verified Local Operators
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5">
            {snapshot.counts.placesHeldNoindex} Draft Micro-Areas Held Unindexed Until Verified
          </span>
        </div>

        {/* 1. THREE DISTINCT SWAMP / WETLAND BASINS */}
        <section className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
            Distinct Wetland Corridors
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            Three separate Louisiana swamp &amp; bayou basins
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-white/75">
            Honey Island (northeast across Lake Pontchartrain), Jean Lafitte / Barataria &amp;
            Luling (south and west on the Westbank), and Manchac (northwest between Lakes
            Pontchartrain and Maurepas) lie in opposite directions from Downtown New Orleans.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {wetlandBasins.map(({ place }) => {
              const drive = place.driveEstimateFromFrenchQuarter;
              return (
                <Link
                  key={place.placeId}
                  href={`/areas/${place.publicPlaceSlug}`}
                  className="flex flex-col justify-between rounded-xl border border-white/15 bg-[#121016] p-6 transition hover:border-[#d4af37]"
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                      {place.parishOrJurisdiction}
                    </span>
                    <h3 className="mt-2 font-serif text-2xl text-white">
                      {place.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/75">
                      {place.hook}
                    </p>
                  </div>
                  {drive && (
                    <div className="mt-5 border-t border-white/10 pt-3 text-xs text-amber-200/90">
                      Planning drive: {drive.typicalMinutesMin}–{drive.typicalMinutesMax} min typical
                      (up to {drive.peakTrafficMinutesMax}m peak traffic · {drive.distanceMilesMin}–
                      {drive.distanceMilesMax} mi)
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* 2. RIVER ROAD & DISTINCT HISTORIC SITES / MUSEUMS */}
        <section className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
            Historical &amp; Enslavement Education Corridor
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            Great River Road &amp; independent slavery museums / historic estates
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-white/75">
            Whitney Plantation, Laura Plantation, and Oak Alley Plantation are independent historic
            sites and non-profit museums along LA-18—modeled distinctly from the licensed New Orleans
            bus and minibus companies that provide round-trip transportation.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {riverRoadAndMuseums.map(({ place }) => {
              const drive = place.driveEstimateFromFrenchQuarter;
              return (
                <Link
                  key={place.placeId}
                  href={`/areas/${place.publicPlaceSlug}`}
                  className="flex flex-col justify-between rounded-xl border border-white/15 bg-[#121016] p-6 transition hover:border-[#d4af37]"
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                      {place.placeType === "historic_site_or_museum"
                        ? "Independent Historic Site / Museum"
                        : "Heritage Corridor"}
                    </span>
                    <h3 className="mt-2 font-serif text-2xl text-white">
                      {place.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/75">
                      {place.hook}
                    </p>
                  </div>
                  {drive && (
                    <div className="mt-5 border-t border-white/10 pt-3 text-xs text-white/70">
                      {place.historicSiteGovernance?.physicalStreetAddress} · Planning drive:{" "}
                      {drive.typicalMinutesMin}–{drive.typicalMinutesMax} min (not a guarantee; zero
                      return rideshare)
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* 3. PORT NOLA CRUISE TERMINALS & MSY AIRPORT */}
        <section className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
            Turnaround &amp; Air Gateways
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            Port NOLA cruise terminals (Erato vs. Julia) &amp; MSY Airport
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {terminalsAndAirport.map(({ place }) => (
              <Link
                key={place.placeId}
                href={`/areas/${place.publicPlaceSlug}`}
                className="flex flex-col justify-between rounded-xl border border-white/15 bg-[#121016] p-6 transition hover:border-[#d4af37]"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                    {place.subRegionLabel}
                  </span>
                  <h3 className="mt-2 font-serif text-2xl text-white">
                    {place.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">
                    {place.hook}
                  </p>
                </div>
                <span className="mt-5 inline-block text-xs font-semibold text-[#d4af37]">
                  Terminal parking, luggage &amp; timing rules →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. WALKABLE NEIGHBORHOODS & RIVERFRONT WHARVES */}
        <section className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
            City Core &amp; Riverboat Wharves
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            Urban neighborhoods &amp; French Quarter riverfront wharves
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {urbanAndRiverfront.map(({ place }) => (
              <Link
                key={place.placeId}
                href={`/areas/${place.publicPlaceSlug}`}
                className="flex flex-col justify-between rounded-xl border border-white/15 bg-[#121016] p-6 transition hover:border-[#d4af37]"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37]">
                    {place.subRegionLabel}
                  </span>
                  <h3 className="mt-2 font-serif text-2xl text-white">
                    {place.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">
                    {place.hook}
                  </p>
                </div>
                <span className="mt-5 inline-block text-xs font-semibold text-[#d4af37]">
                  Meeting points &amp; local operators →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. QUALIFIED AREA-CATEGORY COMPARISONS */}
        {qualifiedComparisons.length > 0 && (
          <section className="mt-14 border-t border-white/15 pt-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
              Multi-Operator Area Comparisons
            </p>
            <h2 className="mt-2 font-serif text-3xl">
              Side-by-side operator &amp; logistics comparisons by area
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {qualifiedComparisons.map((item) => (
                <Link
                  key={`${item.areaSlug}-${item.category.categorySlug}`}
                  href={`/areas/${item.areaSlug}/${item.category.categorySlug}`}
                  className="rounded-lg border border-white/15 bg-[#121016] p-5 hover:border-[#d4af37]"
                >
                  <p className="text-xs text-[#d4af37]">
                    {item.areaName} · {item.operatorCount} verified operators ·{" "}
                    {item.productCount} tours
                  </p>
                  <h3 className="mt-1 font-semibold text-white">
                    {item.comparison?.h1 || `${item.areaName} ${item.category.name}`}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
