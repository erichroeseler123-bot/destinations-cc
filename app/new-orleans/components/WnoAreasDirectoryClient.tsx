"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { WnoPlaceFilterCategory } from "../lib/wtnoDirectoryHelpers";

export interface WnoAreaDirectoryCardItem {
  placeId: string;
  slug: string;
  name: string;
  subRegionLabel: string;
  parishOrJurisdiction: string;
  placeTypeLabel: string;
  filterGroup: Exclude<WnoPlaceFilterCategory, "all">;
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
  hook: string;
  driveSummary: string | null;
  ctaLabel: string;
}

const FILTER_OPTIONS: ReadonlyArray<{
  id: WnoPlaceFilterCategory;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "swamp-basins", label: "Swamp & Bayou Basins" },
  { id: "walkable-neighborhoods", label: "Walkable Neighborhoods" },
  { id: "river-road-history", label: "River Road & Historic Sites" },
  { id: "cruise-and-airport", label: "Cruise & Airport Terminals" },
];

const GROUP_SECTIONS: ReadonlyArray<{
  id: Exclude<WnoPlaceFilterCategory, "all">;
  eyebrow: string;
  title: string;
  lead: string;
}> = [
  {
    id: "swamp-basins",
    eyebrow: "Distinct Wetland Corridors",
    title: "Three separate Louisiana swamp & bayou basins",
    lead: "Honey Island (northeast across Lake Pontchartrain), Jean Lafitte / Barataria & Luling (south and west on the Westbank), and Manchac (northwest between Lakes Pontchartrain and Maurepas) lie in opposite directions from Downtown New Orleans.",
  },
  {
    id: "walkable-neighborhoods",
    eyebrow: "City Core & Riverboat Wharves",
    title: "Walkable New Orleans neighborhoods & French Quarter riverfront wharves",
    lead: "Walking tours, culinary tastings, and steamboat cruises assemble at exact street corners and riverfront wharves—while out-of-town shuttles stage at licensed commercial hotels.",
  },
  {
    id: "river-road-history",
    eyebrow: "Historical & Enslavement Education Corridor",
    title: "Great River Road & independent museums / historic estates",
    lead: "Whitney Plantation, Laura Plantation, and Oak Alley Plantation are independent historic sites and non-profit museums along LA-18—modeled distinctly from the licensed New Orleans bus and minibus companies that provide round-trip transportation.",
  },
  {
    id: "cruise-and-airport",
    eyebrow: "Turnaround & Air Gateways",
    title: "Port NOLA cruise terminals (Erato vs. Julia) & MSY Airport",
    lead: "Carnival's Erato Street Terminal and NCL / Royal Caribbean's Julia Street Terminal use different addresses and parking garages, while MSY Airport sits 14–16 miles west along I-10.",
  },
];

export default function WnoAreasDirectoryClient({
  places,
}: {
  places: readonly WnoAreaDirectoryCardItem[];
}) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<WnoPlaceFilterCategory>("all");

  const countsByGroup = useMemo(() => {
    const counts: Record<WnoPlaceFilterCategory, number> = {
      all: places.length,
      "swamp-basins": 0,
      "walkable-neighborhoods": 0,
      "river-road-history": 0,
      "cruise-and-airport": 0,
    };
    for (const item of places) {
      counts[item.filterGroup] += 1;
    }
    return counts;
  }, [places]);

  const normalizedQuery = query.trim().toLowerCase();
  const isFiltered = normalizedQuery !== "" || activeFilter !== "all";

  const visiblePlaces = useMemo(() => {
    return places.filter((item) => {
      if (activeFilter !== "all" && item.filterGroup !== activeFilter) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = `${item.name} ${item.subRegionLabel} ${item.parishOrJurisdiction} ${item.placeTypeLabel} ${item.hook}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [places, activeFilter, normalizedQuery]);

  function resetFilters() {
    setQuery("");
    setActiveFilter("all");
  }

  function renderPlaceCard(item: WnoAreaDirectoryCardItem) {
    return (
      <article
        key={item.placeId}
        data-testid={`area-directory-card-${item.slug}`}
        className="wno-dir-card group flex flex-col overflow-hidden rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9]"
      >
        <Link
          href={`/areas/${item.slug}`}
          className="wno-dir-card-media relative block aspect-[16/10] w-full overflow-hidden bg-[#eae1d0]"
        >
          <img
            src={item.heroImage}
            alt={item.heroImageAlt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="wno-dir-card-credit absolute bottom-2 right-2 rounded bg-[#1e1915]/75 px-2 py-0.5 text-[10px] font-medium text-[#faf6ee]">
            {item.heroImageCredit}
          </span>
        </Link>

        <div className="flex flex-1 flex-col justify-between p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a6220]">
              {item.placeTypeLabel}
            </p>
            <h3 className="mt-1.5 font-serif text-2xl font-bold leading-snug text-[#163828]">
              <Link
                href={`/areas/${item.slug}`}
                className="hover:text-[#6b2737] focus-visible:underline"
              >
                {item.name}
              </Link>
            </h3>
            <p className="mt-1 text-xs font-medium text-[#6b5a45]">
              {item.subRegionLabel}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
              {item.hook}
            </p>
          </div>

          <div className="mt-5 border-t border-[#1e1915]/10 pt-3.5">
            {item.driveSummary && (
              <p className="mb-2.5 rounded-lg border border-[#b8893a]/25 bg-[#faf6ee] px-3 py-2 text-xs font-medium text-[#4a4138]">
                {item.driveSummary}
              </p>
            )}
            <Link
              href={`/areas/${item.slug}`}
              className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#163828] hover:text-[#6b2737]"
            >
              {item.ctaLabel} →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div>
      {/* Calm Search & Filter Bar */}
      <section
        aria-label="Filter New Orleans areas"
        data-testid="areas-search-filter-controls"
        className="wno-dir-filter-bar rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-5 md:p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-md">
            <label
              htmlFor="wno-areas-search-input"
              className="block text-xs font-bold uppercase tracking-[0.12em] text-[#8a6220]"
            >
              Search by neighborhood, bayou, museum, or terminal
            </label>
            <input
              id="wno-areas-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., French Quarter, Honey Island, Whitney, Erato..."
              className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-4 py-2.5 text-sm text-[#1e1915] placeholder:text-[#786b5d]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#4a4138]">
            <span data-testid="areas-visible-count">
              Showing <strong>{visiblePlaces.length}</strong> of{" "}
              <strong>{places.length}</strong> areas
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                data-testid="areas-reset-filters"
                className="wno-dir-reset-btn ml-2 rounded-full border border-[#6b2737]/35 bg-[#faf6ee] px-3 py-1.5 text-xs font-bold text-[#6b2737] hover:bg-[#6b2737] hover:text-[#faf6ee]"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter by place type"
          className="mt-4 flex flex-wrap gap-2"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = activeFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                data-active={active ? "true" : "false"}
                onClick={() => setActiveFilter(opt.id)}
                className="wno-dir-filter-pill"
              >
                {opt.label} ({countsByGroup[opt.id]})
              </button>
            );
          })}
        </div>
      </section>

      {visiblePlaces.length === 0 ? (
        <div
          data-testid="areas-empty-state"
          className="mt-8 rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-8 text-center"
        >
          <p className="font-serif text-2xl font-bold text-[#163828]">
            No matching New Orleans areas found
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[#4a4138]">
            Try searching for a broader area such as French Quarter, Jean Lafitte, Honey Island,
            River Road, or Port NOLA—or clear your active filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="wno-dir-primary-btn mt-5 inline-flex items-center rounded-full bg-[#163828] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#faf6ee]"
          >
            Reset filters
          </button>
        </div>
      ) : !isFiltered ? (
        <div className="space-y-14 mt-10">
          {GROUP_SECTIONS.map((group) => {
            const groupItems = places.filter((p) => p.filterGroup === group.id);
            if (groupItems.length === 0) return null;
            return (
              <section key={group.id}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6220]">
                  {group.eyebrow}
                </p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-[#163828]">
                  {group.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4a4138]">
                  {group.lead}
                </p>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groupItems.map(renderPlaceCard)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visiblePlaces.map(renderPlaceCard)}
        </div>
      )}
    </div>
  );
}
