"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import OperatorIdentityMark from "./OperatorIdentityMark";

export interface WnoOperatorDirectoryCardItem {
  operatorId: string;
  slug: string;
  name: string;
  tagline: string;
  officialPhone: string | null;
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
  activeTourCount: number;
  areaSlugs: readonly string[];
  areaLabels: readonly string[];
  categorySlugs: readonly string[];
  categoryLabels: readonly string[];
  badgeLabel: string | null;
}

export interface WnoFilterOption {
  slug: string;
  label: string;
}

export default function WnoOperatorsDirectoryClient({
  operators,
  areaOptions,
  categoryOptions,
}: {
  operators: readonly WnoOperatorDirectoryCardItem[];
  areaOptions: readonly WnoFilterOption[];
  categoryOptions: readonly WnoFilterOption[];
}) {
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const normalizedQuery = query.trim().toLowerCase();
  const isFiltered =
    normalizedQuery !== "" || areaFilter !== "all" || categoryFilter !== "all";

  const visibleOperators = useMemo(() => {
    return operators.filter((op) => {
      if (areaFilter !== "all" && !op.areaSlugs.includes(areaFilter)) {
        return false;
      }
      if (categoryFilter !== "all" && !op.categorySlugs.includes(categoryFilter)) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = `${op.name} ${op.tagline} ${op.areaLabels.join(" ")} ${op.categoryLabels.join(" ")} ${op.badgeLabel || ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [operators, areaFilter, categoryFilter, normalizedQuery]);

  function resetFilters() {
    setQuery("");
    setAreaFilter("all");
    setCategoryFilter("all");
  }

  return (
    <div>
      {/* Calm Search & Filter Controls */}
      <section
        aria-label="Filter New Orleans tour operators"
        data-testid="operators-search-filter-controls"
        className="wno-dir-filter-bar rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-5 md:p-6"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="wno-operators-search-input"
              className="block text-xs font-bold uppercase tracking-[0.12em] text-[#8a6220]"
            >
              Search by company, boat, or area
            </label>
            <input
              id="wno-operators-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Steamboat, Airboat, Southern Style..."
              className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-3.5 py-2.5 text-sm text-[#1e1915] placeholder:text-[#786b5d]"
            />
          </div>

          <div>
            <label
              htmlFor="wno-operators-area-select"
              className="block text-xs font-bold uppercase tracking-[0.12em] text-[#8a6220]"
            >
              Operating Area
            </label>
            <select
              id="wno-operators-area-select"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-3.5 py-2.5 text-sm text-[#1e1915]"
            >
              <option value="all">All New Orleans Areas</option>
              {areaOptions.map((opt) => (
                <option key={opt.slug} value={opt.slug}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="wno-operators-category-select"
              className="block text-xs font-bold uppercase tracking-[0.12em] text-[#8a6220]"
            >
              Tour Category
            </label>
            <select
              id="wno-operators-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-3.5 py-2.5 text-sm text-[#1e1915]"
            >
              <option value="all">All Experience Categories</option>
              {categoryOptions.map((opt) => (
                <option key={opt.slug} value={opt.slug}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#1e1915]/10 pt-3.5 text-xs font-semibold text-[#4a4138]">
          <span data-testid="operators-visible-count">
            Showing <strong>{visibleOperators.length}</strong> of{" "}
            <strong>{operators.length}</strong> verified operators
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              data-testid="operators-reset-filters"
              className="wno-dir-reset-btn rounded-full border border-[#6b2737]/35 bg-[#faf6ee] px-3.5 py-1.5 text-xs font-bold text-[#6b2737] hover:bg-[#6b2737] hover:text-[#faf6ee]"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      {visibleOperators.length === 0 ? (
        <div
          data-testid="operators-empty-state"
          className="mt-8 rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-8 text-center"
        >
          <p className="font-serif text-2xl font-bold text-[#163828]">
            No matching tour operators found
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[#4a4138]">
            Try choosing a broader operating area or experience category, or clear your search to
            browse all {operators.length} verified New Orleans operators.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="wno-dir-primary-btn mt-5 inline-flex items-center rounded-full bg-[#163828] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#faf6ee]"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleOperators.map((op) => (
            <article
              key={op.operatorId}
              data-testid={`operator-directory-card-${op.slug}`}
              className="wno-dir-card group flex flex-col overflow-hidden rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9]"
            >
              <Link
                href={`/operators/${op.slug}`}
                className="wno-dir-card-media relative block aspect-[16/10] w-full overflow-hidden bg-[#eae1d0]"
              >
                <img
                  src={op.heroImage}
                  alt={op.heroImageAlt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="wno-dir-card-credit absolute bottom-2 right-2 rounded bg-[#1e1915]/75 px-2 py-0.5 text-[10px] font-medium text-[#faf6ee]">
                  {op.heroImageCredit}
                </span>
              </Link>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <div className="flex items-center gap-3">
                    <OperatorIdentityMark name={op.name} size="sm" variant="on-light" />
                    <div className="min-w-0">
                      {op.badgeLabel && (
                        <p className="truncate text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8a6220]">
                          {op.badgeLabel}
                        </p>
                      )}
                      <h3 className="font-serif text-xl font-bold leading-snug text-[#163828]">
                        <Link
                          href={`/operators/${op.slug}`}
                          className="hover:text-[#6b2737] focus-visible:underline"
                        >
                          {op.name}
                        </Link>
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-[#4a4138]">
                    {op.tagline}
                  </p>

                  {op.areaLabels.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {op.areaLabels.slice(0, 3).map((areaLabel) => (
                        <span
                          key={areaLabel}
                          className="rounded-md border border-[#1e1915]/10 bg-[#faf6ee] px-2 py-0.5 text-[11px] font-medium text-[#4a4138]"
                        >
                          {areaLabel}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#1e1915]/10 pt-3.5 text-xs">
                  <span className="font-semibold text-[#6b2737]">
                    {op.activeTourCount} verified {op.activeTourCount === 1 ? "tour" : "tours"}
                  </span>
                  <Link
                    href={`/operators/${op.slug}`}
                    className="font-bold uppercase tracking-wider text-[#163828] hover:text-[#6b2737]"
                  >
                    Tours &amp; dock guide →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
