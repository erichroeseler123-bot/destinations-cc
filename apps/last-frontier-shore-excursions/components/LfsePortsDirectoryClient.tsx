"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

export type LfseDestinationFilterKey =
  | "all"
  | "cruise_port_town"
  | "cruise_terminal"
  | "community_harbor"
  | "scenic_cruising"
  | "gateway_community";

export interface LfsePortDirectoryCardItem {
  placeId: string;
  slug: string;
  name: string;
  subRegionLabel: string;
  destinationTypeKey: Exclude<LfseDestinationFilterKey, "all">;
  destinationTypeLabel:
    | "Cruise Port Town"
    | "Cruise Terminal"
    | "Community & Harbor"
    | "Scenic Cruising — Non-Disembarkation"
    | "Gateway Community";
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
  hook: string;
  typicalPortHours: string;
  facilitiesCount: number;
  operatorsCount: number;
  toursCount: number;
  isScenicNonDisembarkation: boolean;
}

const DESTINATION_FILTER_OPTIONS: ReadonlyArray<{
  key: LfseDestinationFilterKey;
  label: string;
}> = [
  { key: "all", label: "All Destinations" },
  { key: "cruise_port_town", label: "Cruise Port Town" },
  { key: "cruise_terminal", label: "Cruise Terminal" },
  { key: "community_harbor", label: "Community & Harbor" },
  { key: "scenic_cruising", label: "Scenic Cruising — Non-Disembarkation" },
  { key: "gateway_community", label: "Gateway Community" },
];

export function LfsePortsDirectoryClient({
  items,
}: {
  items: readonly LfsePortDirectoryCardItem[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LfseDestinationFilterKey>("all");

  const normalizedQuery = query.trim().toLowerCase();
  const hasActiveFilters = normalizedQuery.length > 0 || filter !== "all";

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.destinationTypeKey !== filter) {
        return false;
      }
      if (!normalizedQuery) return true;
      const searchable = [
        item.name,
        item.slug,
        item.subRegionLabel,
        item.destinationTypeLabel,
        item.hook,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [items, filter, normalizedQuery]);

  function handleReset() {
    setQuery("");
    setFilter("all");
  }

  return (
    <div data-testid="lfse-ports-directory-client">
      <div className="lfse-filter-bar">
        <div className="lfse-filter-search-row">
          <label className="lfse-filter-field" htmlFor="lfse-ports-search">
            <span className="lfse-filter-label">Search Southeast Alaska destinations</span>
            <input
              id="lfse-ports-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by town, island, fjord, terminal, or harbor..."
              className="lfse-filter-input"
              data-testid="lfse-ports-search-input"
            />
          </label>

          <div className="lfse-filter-status-row">
            <p
              className="lfse-filter-count"
              aria-live="polite"
              data-testid="lfse-ports-result-count"
            >
              Showing <strong>{visibleItems.length}</strong> of{" "}
              <strong>{items.length}</strong> verified destinations
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="lfse-reset-btn"
                data-testid="lfse-ports-reset-btn"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        <div
          className="lfse-filter-pills"
          role="group"
          aria-label="Filter by destination type"
        >
          {DESTINATION_FILTER_OPTIONS.map((opt) => {
            const isSelected = filter === opt.key;
            const count =
              opt.key === "all"
                ? items.length
                : items.filter((i) => i.destinationTypeKey === opt.key).length;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilter(opt.key)}
                aria-pressed={isSelected}
                className={`lfse-filter-pill ${
                  isSelected ? "lfse-filter-pill--active" : ""
                }`}
              >
                {opt.label} <span className="lfse-filter-pill-count">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="lfse-empty-state" data-testid="lfse-ports-empty-state">
          <h3>No matching Southeast Alaska destinations</h3>
          <p>
            Try searching for a broader region (such as Inside Passage, Lynn Canal, or Icy
            Strait) or clear your active destination-type filter to view all{" "}
            {items.length} verified guides.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="button small"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="lfse-cards-grid" data-testid="lfse-ports-cards-grid">
          {visibleItems.map((item) => (
            <Link
              key={item.placeId}
              href={`/ports/${item.slug}`}
              className="card lfse-directory-card"
            >
              <div>
                <div className="lfse-card-media">
                  <img
                    src={item.heroImage}
                    alt={item.heroImageAlt}
                    width={640}
                    height={400}
                    loading="lazy"
                  />
                  <span className="lfse-card-credit">{item.heroImageCredit}</span>
                </div>

                <div className="lfse-card-meta-row">
                  <span
                    className={`badge ${
                      item.isScenicNonDisembarkation ? "badge-warning" : "badge-safety"
                    }`}
                  >
                    {item.destinationTypeLabel}
                  </span>
                  <span className="chip">{item.subRegionLabel}</span>
                </div>

                <h3>{item.name}</h3>
                <p>{item.hook}</p>
              </div>

              <div className="lfse-card-footer">
                <div className="chips">
                  {item.operatorsCount > 0 ? (
                    <span className="chip">
                      {item.operatorsCount}{" "}
                      {item.operatorsCount === 1 ? "local operator" : "local operators"}
                    </span>
                  ) : (
                    <span className="chip">
                      {item.isScenicNonDisembarkation
                        ? "Onboard Ranger & Fjord Guide"
                        : "Ferry & Air Gateway Guide"}
                    </span>
                  )}
                  {item.toursCount > 0 && (
                    <span className="chip">
                      {item.toursCount} {item.toursCount === 1 ? "excursion" : "excursions"}
                    </span>
                  )}
                  <span className="chip">
                    {item.facilitiesCount}{" "}
                    {item.facilitiesCount === 1 ? "access point" : "docks & landings"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
