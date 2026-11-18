"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { OperatorIdentityMark } from "./OperatorIdentityMark";

export interface LfseOperatorDirectoryCardItem {
  operatorId: string;
  slug: string;
  name: string;
  tagline: string;
  cruiseLogisticsSummary: string;
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
  ports: ReadonlyArray<{ slug: string; name: string }>;
  categories: ReadonlyArray<{ slug: string; label: string }>;
  ownershipBadges: readonly string[];
  liveDirectConnected: boolean;
  activeToursCount: number;
  yearEstablished?: number | null;
}

export interface LfseOperatorsDirectoryClientProps {
  items: readonly LfseOperatorDirectoryCardItem[];
  portOptions: ReadonlyArray<{ slug: string; name: string }>;
  categoryOptions: ReadonlyArray<{ slug: string; label: string }>;
}

export function LfseOperatorsDirectoryClient({
  items,
  portOptions,
  categoryOptions,
}: LfseOperatorsDirectoryClientProps) {
  const [query, setQuery] = useState("");
  const [selectedPort, setSelectedPort] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const normalizedQuery = query.trim().toLowerCase();
  const hasActiveFilters =
    normalizedQuery.length > 0 ||
    selectedPort !== "all" ||
    selectedCategory !== "all";

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (
        selectedPort !== "all" &&
        !item.ports.some((p) => p.slug === selectedPort)
      ) {
        return false;
      }
      if (
        selectedCategory !== "all" &&
        !item.categories.some((c) => c.slug === selectedCategory)
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      const searchable = [
        item.name,
        item.slug,
        item.tagline,
        item.cruiseLogisticsSummary,
        ...item.ports.map((p) => p.name),
        ...item.categories.map((c) => c.label),
        ...item.ownershipBadges,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [items, selectedPort, selectedCategory, normalizedQuery]);

  function handleReset() {
    setQuery("");
    setSelectedPort("all");
    setSelectedCategory("all");
  }

  return (
    <div data-testid="lfse-operators-directory-client">
      <div className="lfse-filter-bar">
        <div className="lfse-operators-controls-grid">
          <label className="lfse-filter-field" htmlFor="lfse-operators-search">
            <span className="lfse-filter-label">Search local operators</span>
            <input
              id="lfse-operators-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company, port, harbor, or excursion type..."
              className="lfse-filter-input"
              data-testid="lfse-operators-search-input"
            />
          </label>

          <label className="lfse-filter-field" htmlFor="lfse-operators-port-filter">
            <span className="lfse-filter-label">Port or community</span>
            <select
              id="lfse-operators-port-filter"
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              className="lfse-filter-select"
              data-testid="lfse-operators-port-select"
            >
              <option value="all">All Southeast Alaska Ports</option>
              {portOptions.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="lfse-filter-field" htmlFor="lfse-operators-category-filter">
            <span className="lfse-filter-label">Excursion category</span>
            <select
              id="lfse-operators-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="lfse-filter-select"
              data-testid="lfse-operators-category-select"
            >
              <option value="all">All Excursion Categories</option>
              {categoryOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="lfse-filter-status-row" style={{ marginTop: 12 }}>
          <p
            className="lfse-filter-count"
            aria-live="polite"
            data-testid="lfse-operators-result-count"
          >
            Showing <strong>{visibleItems.length}</strong> of{" "}
            <strong>{items.length}</strong> verified local operators
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="lfse-reset-btn"
              data-testid="lfse-operators-reset-btn"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="lfse-empty-state" data-testid="lfse-operators-empty-state">
          <h3>No matching local operators</h3>
          <p>
            No verified companies matched that combination of search terms, port, and
            category. Reset your filters to browse all {items.length} Southeast Alaska
            operators.
          </p>
          <button type="button" onClick={handleReset} className="button small">
            Reset filters
          </button>
        </div>
      ) : (
        <div className="lfse-cards-grid" data-testid="lfse-operators-cards-grid">
          {visibleItems.map((op) => (
            <article key={op.operatorId} className="card lfse-directory-card">
              <div>
                <div className="lfse-card-media">
                  <img
                    src={op.heroImage}
                    alt={op.heroImageAlt}
                    width={640}
                    height={380}
                    loading="lazy"
                  />
                  <span className="lfse-card-credit">{op.heroImageCredit}</span>
                </div>

                <div className="lfse-card-meta-row">
                  {op.ports.map((port) => (
                    <Link
                      key={port.slug}
                      href={`/ports/${port.slug}`}
                      className="chip lfse-chip-link"
                    >
                      {port.name}
                    </Link>
                  ))}
                  {op.yearEstablished ? (
                    <span className="chip">Est. {op.yearEstablished}</span>
                  ) : null}
                </div>

                {(op.liveDirectConnected || op.ownershipBadges.length > 0) && (
                  <div className="lfse-card-meta-row">
                    {op.liveDirectConnected && (
                      <span className="badge badge-safety">
                        Live Availability + Direct Checkout
                      </span>
                    )}
                    {op.ownershipBadges.slice(0, 2).map((label) => (
                      <span key={label} className="badge badge-safety">
                        {label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="lfse-operator-card-heading">
                  <OperatorIdentityMark name={op.name} size="md" />
                  <h3>
                    <Link href={`/operators/${op.slug}`}>{op.name}</Link>
                  </h3>
                </div>

                <p>{op.tagline}</p>

                <p className="lfse-operator-pickup-snippet">
                  <strong>Pier &amp; Harbor Pickup:</strong> {op.cruiseLogisticsSummary}
                </p>
              </div>

              <div className="lfse-card-footer lfse-card-footer--split">
                <span className="lfse-card-footer-meta">
                  {op.activeToursCount}{" "}
                  {op.activeToursCount === 1 ? "verified tour" : "verified tours"}
                </span>
                <Link
                  href={`/operators/${op.slug}`}
                  className="lfse-card-action-link"
                >
                  View Operator Profile →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
