"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { OperatorIdentityMark } from "@/components/OperatorIdentityMark";
import { SEAK_FISHING_LODGES_PATH } from "@/lib/fishingLodgesConfig";
import { trackFishingLodgeDirectoryEvent } from "@/lib/fishingLodgesTelemetry";
import {
  SOUTHEAST_ALASKA_LODGE_SUBREGION_LABELS,
  type LodgeOperationArchetype,
  type LodgeStayFormat,
  type ProvisionStatus,
  type RemainingAvailabilityState,
  type SoutheastAlaskaFishingLodgeRecord,
  type SoutheastAlaskaLodgeSubregion,
  type TriStateFact,
} from "../../../lib/dcc/shared/southeastAlaskaFishingLodgesContract";
import styles from "@/app/southeast-alaska/fishing-lodges/fishing-lodges.module.css";

export interface LfseFishingLodgesDirectoryClientProps {
  lodges: readonly SoutheastAlaskaFishingLodgeRecord[];
  initialCompareSlugs?: readonly string[];
  initialPrintMode?: boolean;
}

const ARCHETYPE_LABELS: Record<LodgeOperationArchetype, string> = {
  all_inclusive_guided_lodge: "All-Inclusive Guided Lodge",
  self_guided_or_hybrid_lodge: "Self-Guided or Hybrid Guided/Unguided",
  modular_lodging_plus_separate_charters: "Lodge Stay + Separate Local Charters",
  diy_boat_rental_with_lodging_partner: "Self-Guided Boat Rental + Partner Hotel",
  whole_property_private_stay_services_separate:
    "Whole-Lodge Private Stay (Services Separate)",
};

const AVAILABILITY_LABELS: Record<RemainingAvailabilityState, string> = {
  not_checked_contact_official_channel: "Check directly with the lodge",
  static_page_note_only_unverified_live:
    "General note on website — confirm current openings directly",
  verified_live_feed: "Live availability shown",
};

const PROVISION_STATUS_LABELS: Record<ProvisionStatus, string> = {
  included_in_published_package: "Included in package",
  extra_charge_published: "Extra fee (published rate)",
  extra_charge_quote_required: "Extra cost — request quote",
  arranged_separately_by_guest_or_group: "Arranged separately",
  not_provided: "Not provided by lodge",
  conflicting_official_pages_confirm:
    "Official pages differ — confirm before booking",
  unknown: "Not listed — confirm with lodge",
};

function formatBathroomSummary(
  cfg: SoutheastAlaskaFishingLodgeRecord["accommodation"]["bathroomConfiguration"],
): string {
  if (cfg === "private_ensuite_documented") return "Private bathroom";
  if (cfg === "private_or_group_shared_documented")
    return "Private or shared group bathroom";
  return "Bathroom setup not listed — confirm with lodge";
}

function formatNonAnglerHeadline(val: TriStateFact): string {
  if (val === "yes") return "Dedicated guided non-fishing outings offered";
  if (val === "no") return "Fishing-focused — no lodge-run non-angler tours";
  return "Guided non-angler outings not confirmed — ask before booking";
}

/**
 * Returns a concise booking-role explanation when property, operator, seller,
 * or core services involve distinct parties or affect how a traveler books.
 */
function summarizeBookingDistinction(
  lodge: SoutheastAlaskaFishingLodgeRecord,
): string | null {
  if (lodge.stayFormat === "whole_lodge_private_property") {
    return `${lodge.accommodation.relationshipExplanation}`;
  }
  if (
    lodge.accommodation.propertyName !==
      lodge.operatingCompany.legalOrDisplayName ||
    lodge.operatingCompany.legalOrDisplayName !== lodge.packageSeller.sellerName
  ) {
    return lodge.accommodation.relationshipExplanation;
  }
  if (
    lodge.operationArchetype === "modular_lodging_plus_separate_charters"
  ) {
    return lodge.accommodation.relationshipExplanation;
  }
  if (lodge.operatingCompany.separationDisambiguationNote) {
    return lodge.operatingCompany.separationDisambiguationNote;
  }
  return null;
}

export function LfseFishingLodgesDirectoryClient({
  lodges,
  initialCompareSlugs = [],
  initialPrintMode = false,
}: LfseFishingLodgesDirectoryClientProps) {
  const validInitialCompare = useMemo(() => {
    const validSet = new Set(lodges.map((l) => l.slug));
    const deduped: string[] = [];
    for (const raw of initialCompareSlugs) {
      const s = raw.trim().toLowerCase();
      if (validSet.has(s) && !deduped.includes(s) && deduped.length < 4) {
        deduped.push(s);
      }
    }
    return deduped;
  }, [lodges, initialCompareSlugs]);

  const [stayFormatFilter, setStayFormatFilter] = useState<
    "all" | LodgeStayFormat
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [subRegionFilter, setSubRegionFilter] = useState<
    "all" | SoutheastAlaskaLodgeSubregion
  >("all");
  const [archetypeFilter, setArchetypeFilter] = useState<
    "all" | LodgeOperationArchetype
  >("all");
  const [accessModeFilter, setAccessModeFilter] = useState<
    | "all"
    | "floatplane_or_commuter_air"
    | "lodge_boat_or_ferry"
    | "road_or_courtesy_van"
  >("all");
  const [rateVisibilityFilter, setRateVisibilityFilter] = useState<
    "all" | "published_2027" | "published_any" | "quote_required"
  >("all");
  const [selectedCompareSlugs, setSelectedCompareSlugs] =
    useState<string[]>(validInitialCompare);
  const [printSheetMode, setPrintSheetMode] = useState<boolean>(
    Boolean(initialPrintMode && validInitialCompare.length > 0),
  );

  useEffect(() => {
    trackFishingLodgeDirectoryEvent({
      event: "lfse_lodge_page_view",
      pagePath: SEAK_FISHING_LODGES_PATH,
      compareCount: validInitialCompare.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCount = lodges.length;
  const individualCount = useMemo(
    () =>
      lodges.filter((l) => l.stayFormat === "individual_rooms_or_cabins")
        .length,
    [lodges],
  );
  const wholeLodgeCount = useMemo(
    () =>
      lodges.filter((l) => l.stayFormat === "whole_lodge_private_property")
        .length,
    [lodges],
  );

  function syncCompareUrl(nextSlugs: string[]) {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (nextSlugs.length > 0) {
        url.searchParams.set("compare", nextSlugs.join(","));
      } else {
        url.searchParams.delete("compare");
      }
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Non-blocking
    }
  }

  function toggleCompare(slug: string) {
    setSelectedCompareSlugs((prev) => {
      let next: string[];
      if (prev.includes(slug)) {
        next = prev.filter((s) => s !== slug);
      } else {
        if (prev.length >= 4) return prev;
        next = [...prev, slug];
      }
      syncCompareUrl(next);
      trackFishingLodgeDirectoryEvent({
        event: "lfse_lodge_compare_used",
        action: prev.includes(slug) ? "remove_lodge" : "add_lodge",
        lodgeSlug: slug,
        compareCount: next.length,
      });
      return next;
    });
  }

  function applyComparePreset(
    presetSlugs: readonly string[],
    presetName: string,
  ) {
    const validSet = new Set(lodges.map((l) => l.slug));
    const next = presetSlugs.filter((s) => validSet.has(s)).slice(0, 4);
    setSelectedCompareSlugs(next);
    syncCompareUrl(next);
    trackFishingLodgeDirectoryEvent({
      event: "lfse_lodge_compare_used",
      action: `preset:${presetName}`,
      compareCount: next.length,
    });
    if (typeof document !== "undefined") {
      const el = document.getElementById("lodge-comparison-panel");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function clearCompare() {
    setSelectedCompareSlugs([]);
    setPrintSheetMode(false);
    syncCompareUrl([]);
  }

  function handlePrintComparison() {
    trackFishingLodgeDirectoryEvent({
      event: "lfse_lodge_printable_compare_used",
      action: "print_comparison_table",
      compareCount: selectedCompareSlugs.length,
    });
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  const filteredLodges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lodges.filter((lodge) => {
      if (stayFormatFilter !== "all" && lodge.stayFormat !== stayFormatFilter) {
        return false;
      }
      if (subRegionFilter !== "all" && lodge.subRegion !== subRegionFilter) {
        return false;
      }
      if (
        archetypeFilter !== "all" &&
        lodge.operationArchetype !== archetypeFilter
      ) {
        return false;
      }
      if (accessModeFilter !== "all") {
        const modes = lodge.accessConnections.map((a) => a.transferMode);
        if (
          accessModeFilter === "floatplane_or_commuter_air" &&
          !modes.some(
            (m) =>
              m === "charter_or_scheduled_floatplane" ||
              m === "wheeled_commuter_aircraft",
          )
        ) {
          return false;
        }
        if (
          accessModeFilter === "lodge_boat_or_ferry" &&
          !modes.some(
            (m) => m === "lodge_boat_or_catamaran" || m === "ferry_corridor",
          )
        ) {
          return false;
        }
        if (
          accessModeFilter === "road_or_courtesy_van" &&
          !modes.includes("road_or_courtesy_van")
        ) {
          return false;
        }
      }
      if (rateVisibilityFilter !== "all") {
        if (
          rateVisibilityFilter === "published_2027" &&
          !lodge.packages.some(
            (p) => p.applicableSeason === "2027" && p.priceAmountUsd !== null,
          )
        ) {
          return false;
        }
        if (
          rateVisibilityFilter === "published_any" &&
          !lodge.packages.some((p) => p.priceAmountUsd !== null)
        ) {
          return false;
        }
        if (
          rateVisibilityFilter === "quote_required" &&
          !lodge.packages.every((p) => p.priceState === "quote_required")
        ) {
          return false;
        }
      }

      if (!q) return true;
      const haystack = [
        lodge.displayName,
        lodge.headlineSummary,
        lodge.accommodation.propertyName,
        lodge.accommodation.actualLocationLabel,
        lodge.accommodation.gatewayLabel,
        lodge.operatingCompany.legalOrDisplayName,
        ...(lodge.operatingCompany.legacyOrBuildingAliases || []),
        lodge.packageSeller.sellerName,
        lodge.fishingProgram.targetSpeciesSummary,
        SOUTHEAST_ALASKA_LODGE_SUBREGION_LABELS[lodge.subRegion],
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [
    lodges,
    stayFormatFilter,
    subRegionFilter,
    archetypeFilter,
    accessModeFilter,
    rateVisibilityFilter,
    searchQuery,
  ]);

  const selectedLodges = useMemo(() => {
    const bySlug = new Map(lodges.map((l) => [l.slug, l]));
    return selectedCompareSlugs
      .map((slug) => bySlug.get(slug))
      .filter((l): l is SoutheastAlaskaFishingLodgeRecord => Boolean(l));
  }, [lodges, selectedCompareSlugs]);

  const hasActiveFilters =
    stayFormatFilter !== "all" ||
    subRegionFilter !== "all" ||
    archetypeFilter !== "all" ||
    accessModeFilter !== "all" ||
    rateVisibilityFilter !== "all" ||
    searchQuery.trim().length > 0;

  function resetAllFilters() {
    setStayFormatFilter("all");
    setSubRegionFilter("all");
    setArchetypeFilter("all");
    setAccessModeFilter("all");
    setRateVisibilityFilter("all");
    setSearchQuery("");
  }

  return (
    <div
      className={
        printSheetMode && selectedLodges.length > 0
          ? styles.printSheetModeActive
          : undefined
      }
      data-testid="lodge-directory-root"
    >
      {printSheetMode && selectedLodges.length > 0 && (
        <div
          className={styles.printModeToolbar}
          data-testid="printable-sheet-toolbar"
        >
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--deep)" }}>
            Printable Lodge Comparison ({selectedLodges.length}{" "}
            {selectedLodges.length === 1 ? "Lodge" : "Lodges"})
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handlePrintComparison}
              className="button small"
              style={{ cursor: "pointer" }}
            >
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={() => setPrintSheetMode(false)}
              className="button secondary small"
              style={{ cursor: "pointer" }}
              data-testid="exit-print-sheet-mode-btn"
            >
              ← Back to Directory
            </button>
          </div>
        </div>
      )}

      {/* Print-only header */}
      <div className={styles.printOnlyHeader}>
        <h1 style={{ margin: "0 0 4px", fontSize: 19 }}>
          Southeast Alaska Fishing Lodges — Side-by-Side Trip Comparison
        </h1>
        <p style={{ margin: 0, fontSize: 10.5 }}>
          Last Frontier Shore Excursions (official lodge pages checked Nov 19,
          2026). Rates reflect published package dates and occupancy only;
          confirm current openings, air/ferry transfers, taxes, and fishing
          licenses directly before booking.
        </p>
      </div>

      {/* 1. Stay Format & Trip Filters */}
      <div
        className={`card ${styles.noPrint}`}
        style={{ background: "#ffffff", marginBottom: 22 }}
        data-testid="lodge-directory-controls"
      >
        <div
          className={styles.stayFormatSwitchRow}
          role="group"
          aria-label="Filter by stay format (individual rooms vs. whole-lodge private stays)"
        >
          <span className={styles.stayFormatLabel}>Stay Type:</span>
          <button
            type="button"
            onClick={() => {
              setStayFormatFilter("all");
              trackFishingLodgeDirectoryEvent({
                event: "lfse_lodge_directory_filter",
                stayFormat: "all",
              });
            }}
            className={`${styles.formatPillBtn} ${
              stayFormatFilter === "all" ? styles.formatPillBtnActive : ""
            }`}
            aria-pressed={stayFormatFilter === "all"}
            data-testid="filter-stay-format-all"
          >
            All Stays ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setStayFormatFilter("individual_rooms_or_cabins");
              trackFishingLodgeDirectoryEvent({
                event: "lfse_lodge_directory_filter",
                stayFormat: "individual_rooms_or_cabins",
              });
            }}
            className={`${styles.formatPillBtn} ${
              stayFormatFilter === "individual_rooms_or_cabins"
                ? styles.formatPillBtnActive
                : ""
            }`}
            aria-pressed={stayFormatFilter === "individual_rooms_or_cabins"}
            data-testid="filter-stay-format-individual"
          >
            Individual Rooms, Cabins &amp; Suites ({individualCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setStayFormatFilter("whole_lodge_private_property");
              trackFishingLodgeDirectoryEvent({
                event: "lfse_lodge_directory_filter",
                stayFormat: "whole_lodge_private_property",
              });
            }}
            className={`${styles.formatPillBtn} ${
              stayFormatFilter === "whole_lodge_private_property"
                ? styles.formatPillBtnActive
                : ""
            }`}
            aria-pressed={stayFormatFilter === "whole_lodge_private_property"}
            data-testid="filter-stay-format-whole-lodge"
          >
            Whole-Lodge Private Stays ({wholeLodgeCount})
          </button>
        </div>

        <div className={styles.filterControlsGrid}>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              fontSize: 13,
            }}
          >
            <strong>Search Lodge, Town, Island or Fish</strong>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Sitka, Elfin Cove, Longliner, halibut..."
              data-testid="lodge-search-input"
              style={{
                padding: "9px 11px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                fontSize: 13.5,
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              fontSize: 13,
            }}
          >
            <strong>Region &amp; Gateway Town</strong>
            <select
              value={subRegionFilter}
              onChange={(e) => {
                const next = e.target.value as
                  | "all"
                  | SoutheastAlaskaLodgeSubregion;
                setSubRegionFilter(next);
                trackFishingLodgeDirectoryEvent({
                  event: "lfse_lodge_directory_filter",
                  subRegion: next,
                });
              }}
              data-testid="lodge-subregion-select"
              style={{
                padding: "9px 11px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "#ffffff",
                fontSize: 13.5,
              }}
            >
              <option value="all">All Southeast Alaska Areas</option>
              {(
                Object.entries(SOUTHEAST_ALASKA_LODGE_SUBREGION_LABELS) as [
                  SoutheastAlaskaLodgeSubregion,
                  string,
                ][]
              ).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              fontSize: 13,
            }}
          >
            <strong>Trip Style</strong>
            <select
              value={archetypeFilter}
              onChange={(e) =>
                setArchetypeFilter(
                  e.target.value as "all" | LodgeOperationArchetype,
                )
              }
              data-testid="lodge-archetype-select"
              style={{
                padding: "9px 11px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "#ffffff",
                fontSize: 13.5,
              }}
            >
              <option value="all">All Guided &amp; Self-Guided Styles</option>
              {(
                Object.entries(ARCHETYPE_LABELS) as [
                  LodgeOperationArchetype,
                  string,
                ][]
              ).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              fontSize: 13,
            }}
          >
            <strong>How You Get There</strong>
            <select
              value={accessModeFilter}
              onChange={(e) =>
                setAccessModeFilter(
                  e.target.value as
                    | "all"
                    | "floatplane_or_commuter_air"
                    | "lodge_boat_or_ferry"
                    | "road_or_courtesy_van",
                )
              }
              data-testid="lodge-access-select"
              style={{
                padding: "9px 11px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "#ffffff",
                fontSize: 13.5,
              }}
            >
              <option value="all">All Transfer Types</option>
              <option value="floatplane_or_commuter_air">
                Floatplane or Small Plane
              </option>
              <option value="lodge_boat_or_ferry">Lodge Boat or Ferry</option>
              <option value="road_or_courtesy_van">
                Road System or Courtesy Shuttle
              </option>
            </select>
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              fontSize: 13,
            }}
          >
            <strong>Published Rates</strong>
            <select
              value={rateVisibilityFilter}
              onChange={(e) =>
                setRateVisibilityFilter(
                  e.target.value as
                    | "all"
                    | "published_2027"
                    | "published_any"
                    | "quote_required",
                )
              }
              data-testid="lodge-rate-select"
              style={{
                padding: "9px 11px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "#ffffff",
                fontSize: 13.5,
              }}
            >
              <option value="all">All Lodges</option>
              <option value="published_2027">2027 Rates Listed Online</option>
              <option value="published_any">Rates Listed Online</option>
              <option value="quote_required">Request a Quote</option>
            </select>
          </label>
        </div>

        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--line)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13.5, color: "var(--ink)" }}>
            Showing <strong>{filteredLodges.length}</strong> of{" "}
            <strong>{totalCount}</strong> properties
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  marginLeft: 10,
                  background: "transparent",
                  border: "none",
                  color: "var(--accent)",
                  fontWeight: 700,
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Reset filters
              </button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{ fontSize: 12.5, fontWeight: 700, color: "var(--muted)" }}
            >
              Sample comparisons:
            </span>
            <button
              type="button"
              className="button secondary small"
              style={{ cursor: "pointer" }}
              data-testid="preset-compare-four-models"
              onClick={() =>
                applyComparePreset(
                  [
                    "favorite-bay-lodge",
                    "bear-track-inn",
                    "fish-baranof-sitka",
                    "boardwalk-lodge",
                  ],
                  "four_distinct_stay_models",
                )
              }
            >
              Compare 4 Trip Styles (Guided · Inn + Charter · DIY Boat · Whole
              Lodge)
            </button>
            <button
              type="button"
              className="button secondary small"
              style={{ cursor: "pointer" }}
              onClick={() =>
                applyComparePreset(
                  [
                    "pybus-point-lodge",
                    "elfin-cove-resort",
                    "tanaku-lodge",
                    "shelter-lodge",
                  ],
                  "juneau_and_cross_sound",
                )
              }
            >
              Compare Juneau &amp; Elfin Cove Fly-In Lodges
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sticky Selection Bar when 1–4 Lodges Are Selected */}
      {selectedLodges.length > 0 && (
        <div
          className={`${styles.compareStickyBar} ${styles.noPrint}`}
          data-testid="compare-sticky-bar"
        >
          <div className={styles.compareChipsList}>
            <strong style={{ fontSize: 13.5 }}>
              Comparing {selectedLodges.length} of 4:
            </strong>
            {selectedLodges.map((l) => (
              <span key={l.slug} className={styles.compareSelectedChip}>
                {l.displayName}
                <button
                  type="button"
                  className={styles.compareRemoveBtn}
                  onClick={() => toggleCompare(l.slug)}
                  aria-label={`Remove ${l.displayName} from comparison`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a
              href="#lodge-comparison-panel"
              className="button small"
              style={{ background: "var(--accent)", color: "#ffffff" }}
            >
              View Comparison ↓
            </a>
            <button
              type="button"
              onClick={handlePrintComparison}
              className="button secondary small"
              style={{ cursor: "pointer" }}
              data-testid="print-comparison-btn"
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={clearCompare}
              className="button secondary small"
              style={{
                cursor: "pointer",
                background: "transparent",
                color: "#ffffff",
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 3. Traveler-Ordered Side-by-Side Comparison Matrix */}
      {selectedLodges.length > 0 && (
        <section
          id="lodge-comparison-panel"
          className={styles.comparisonPanel}
          aria-label="Side-by-side Southeast Alaska fishing lodge comparison"
          data-testid="lodge-comparison-panel"
        >
          <div className={`${styles.comparisonHeader} ${styles.noPrint}`}>
            <div>
              <p className="eyebrow" style={{ color: "var(--forest)" }}>
                Side-by-Side Comparison ({selectedLodges.length} of 4 Lodges)
              </p>
              <h2 style={{ margin: "4px 0 6px" }}>
                Compare Price, What&apos;s Included, Fishing, Non-Angler Options
                &amp; Access
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  color: "var(--muted)",
                  maxWidth: 780,
                }}
              >
                Rates are shown with their published dates, stay length, and
                occupancy—alongside extra costs to budget for or confirm by
                quote.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setPrintSheetMode(true);
                  trackFishingLodgeDirectoryEvent({
                    event: "lfse_lodge_printable_compare_used",
                    action: "open_printable_sheet_view",
                    compareCount: selectedCompareSlugs.length,
                  });
                }}
                className="button secondary small"
                style={{ cursor: "pointer" }}
                data-testid="open-print-sheet-view-btn"
              >
                Printable View
              </button>
              <button
                type="button"
                onClick={handlePrintComparison}
                className="button small"
                style={{ cursor: "pointer" }}
              >
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={clearCompare}
                className="button secondary small"
                style={{ cursor: "pointer" }}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className={styles.comparisonTableWrap}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th className={styles.comparisonRowLabel}>What to Compare</th>
                  {selectedLodges.map((lodge) => (
                    <th key={lodge.slug}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <span
                          className={`badge ${
                            lodge.stayFormat === "whole_lodge_private_property"
                              ? "badge-warning"
                              : "badge-safety"
                          }`}
                          style={{ alignSelf: "flex-start" }}
                        >
                          {lodge.stayFormat === "whole_lodge_private_property"
                            ? "Whole-Lodge Private Stay"
                            : "Rooms / Cabins"}
                        </span>
                        <Link
                          href={`${SEAK_FISHING_LODGES_PATH}/${lodge.slug}`}
                          style={{
                            color: "var(--deep)",
                            fontWeight: 800,
                            fontSize: 15,
                            textDecoration: "underline",
                          }}
                        >
                          {lodge.displayName}
                        </Link>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "var(--muted)",
                          }}
                        >
                          {ARCHETYPE_LABELS[lodge.operationArchetype]}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 1. Price & Duration */}
                <tr>
                  <td className={styles.comparisonRowLabel}>
                    Price &amp; Stay Length
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 11.5,
                        color: "var(--muted)",
                        marginTop: 3,
                      }}
                    >
                      Published rates for specific dates &amp; occupancy
                    </div>
                  </td>
                  {selectedLodges.map((lodge) => (
                    <td key={lodge.slug}>
                      {lodge.packages.map((pkg) => (
                        <div
                          key={pkg.packageId}
                          style={{
                            marginBottom: 8,
                            paddingBottom: 8,
                            borderBottom: "1px dashed var(--line)",
                          }}
                        >
                          <strong style={{ color: "var(--deep)" }}>
                            {pkg.priceDisplayLabel}
                          </strong>
                          <div style={{ fontSize: 12 }}>
                            {pkg.durationSummaryLabel} ·{" "}
                            {pkg.applicableSeason ===
                            "season_not_stated_on_source"
                              ? "Season year not listed on page — confirm for your dates"
                              : `${pkg.applicableSeason} season (${pkg.applicableDatesLabel})`}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            {pkg.occupancyAndSharingBasis}
                          </div>
                          <div style={{ fontSize: 11.8, color: "var(--muted)" }}>
                            <strong>Taxes:</strong> {pkg.taxDetailNote}
                          </div>
                        </div>
                      ))}
                      <div style={{ fontSize: 12 }}>
                        <strong>Openings:</strong>{" "}
                        {
                          AVAILABILITY_LABELS[
                            lodge.packages[0]!.remainingAvailabilityState
                          ]
                        }
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 2. Inclusions & Accommodations */}
                <tr>
                  <td className={styles.comparisonRowLabel}>
                    What&apos;s Included &amp; Rooms
                  </td>
                  {selectedLodges.map((lodge) => (
                    <td key={lodge.slug}>
                      <ul style={{ margin: "0 0 8px", paddingLeft: 16 }}>
                        {lodge.packages[0]!.verifiedInclusions.map(
                          (inc, idx) => (
                            <li key={idx} style={{ marginBottom: 3 }}>
                              {inc}
                            </li>
                          ),
                        )}
                      </ul>
                      <div style={{ fontSize: 12 }}>
                        <strong>Rooms:</strong>{" "}
                        {lodge.accommodation.roomAndCabinSummary}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 3 }}>
                        <strong>Bathrooms:</strong>{" "}
                        {formatBathroomSummary(
                          lodge.accommodation.bathroomConfiguration,
                        )}{" "}
                        · <strong>Meals:</strong>{" "}
                        {lodge.accommodation.mealProvisionSummary}
                      </div>
                      <div
                        style={{
                          fontSize: 11.8,
                          color: "var(--muted)",
                          marginTop: 3,
                        }}
                      >
                        <strong>Group fit:</strong>{" "}
                        {lodge.accommodation.groupSizeGuidanceNote}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 3. Fishing Arrangements */}
                <tr>
                  <td className={styles.comparisonRowLabel}>
                    Fishing Arrangements
                  </td>
                  {selectedLodges.map((lodge) => (
                    <td key={lodge.slug}>
                      <div>
                        <strong>Waters &amp; target fish:</strong>{" "}
                        {lodge.fishingProgram.waterTypes.join(" + ")} —{" "}
                        {lodge.fishingProgram.targetSpeciesSummary}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <strong>Boats &amp; gear:</strong>{" "}
                        {lodge.fishingProgram.vesselsAndEquipmentSummary}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <strong>Fish processing:</strong>{" "}
                        {lodge.fishingProgram.fishProcessingAndBoxesSummary}
                      </div>
                      <div
                        style={{
                          marginTop: 5,
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        <strong>Licenses, stamps &amp; rules:</strong>{" "}
                        {lodge.fishingProgram.scopedRequirements
                          .map(
                            (r) =>
                              `${r.requirementName} (${r.applicableActivityAndDateScope})`,
                          )
                          .join("; ")}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 4. Non-Angler Options */}
                <tr>
                  <td className={styles.comparisonRowLabel}>
                    Non-Angler &amp; Companion Options
                  </td>
                  {selectedLodges.map((lodge) => (
                    <td key={lodge.slug}>
                      <div>
                        <strong>
                          {formatNonAnglerHeadline(
                            lodge.nonFishingContext
                              .simultaneousNonAnglerActivitiesProven,
                          )}
                        </strong>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12.2 }}>
                        {lodge.nonFishingContext.simultaneousNonAnglerExplanation}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        <strong>On-site gear:</strong>{" "}
                        {lodge.nonFishingContext.onSiteUnguidedEquipment.summary}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 5. Access & Baggage */}
                <tr>
                  <td className={styles.comparisonRowLabel}>
                    Getting There &amp; Baggage
                  </td>
                  {selectedLodges.map((lodge) => {
                    const primaryAccess = lodge.accessConnections[0]!;
                    return (
                      <td key={lodge.slug}>
                        <div>
                          <strong>Location:</strong>{" "}
                          {lodge.accommodation.actualLocationLabel}
                        </div>
                        <div>
                          <strong>Gateway:</strong>{" "}
                          {lodge.accommodation.gatewayLabel}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <strong>Transfer:</strong> {primaryAccess.legTitle} (
                          {primaryAccess.durationLabel}) —{" "}
                          <em>
                            {
                              PROVISION_STATUS_LABELS[
                                primaryAccess.provisionStatus
                              ]
                            }
                          </em>
                        </div>
                        {primaryAccess.provisionStatus ===
                          "conflicting_official_pages_confirm" && (
                          <div className={styles.conflictAlert}>
                            Confirm before booking:{" "}
                            {primaryAccess.publishedTransferRateNote}
                          </div>
                        )}
                        <div style={{ marginTop: 4, fontSize: 12 }}>
                          <strong>Baggage &amp; fish boxes:</strong>{" "}
                          {primaryAccess.scopedBaggageAndFreightRule.ruleSummary}
                        </div>
                        <div
                          style={{
                            marginTop: 3,
                            fontSize: 11.8,
                            color: "var(--muted)",
                          }}
                        >
                          <strong>Arrival timing:</strong>{" "}
                          {primaryAccess.reportingAndOvernightBufferNote}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 6. Additional Costs, Booking Roles & Direct Link */}
                <tr>
                  <td className={styles.comparisonRowLabel}>
                    Additional Costs &amp; Who You Book With
                  </td>
                  {selectedLodges.map((lodge) => {
                    const bookingDistinction =
                      summarizeBookingDistinction(lodge);
                    return (
                      <td key={lodge.slug}>
                        <ul style={{ margin: "0 0 8px", paddingLeft: 16 }}>
                          {lodge.packages[0]!.knownExclusionsAndAdditionalCharges.map(
                            (item, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>
                                <strong>{item.itemLabel}:</strong>{" "}
                                {item.publishedAmountNote ? (
                                  <span>{item.publishedAmountNote} — </span>
                                ) : null}
                                <span>{item.scopeAndRuleNote}</span>
                                {item.chargeStatus ===
                                  "conflicting_official_pages_confirm" && (
                                  <div className={styles.conflictAlert}>
                                    Official pages differ — confirm in writing
                                    before paying a deposit.
                                  </div>
                                )}
                              </li>
                            ),
                          )}
                        </ul>

                        {bookingDistinction && (
                          <div
                            style={{
                              padding: "7px 9px",
                              borderRadius: 8,
                              background: "#f6f8f8",
                              border: "1px solid var(--line)",
                              fontSize: 12,
                              marginBottom: 8,
                            }}
                          >
                            <strong>Booking setup:</strong> {bookingDistinction}
                          </div>
                        )}

                        <div
                          className={styles.noPrint}
                          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                        >
                          <Link
                            href={`${SEAK_FISHING_LODGES_PATH}/${lodge.slug}`}
                            className="button secondary small"
                          >
                            Full Details →
                          </Link>
                          <a
                            href={
                              lodge.packageSeller.officialBookingOrInquiryUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button small"
                            onClick={() =>
                              trackFishingLodgeDirectoryEvent({
                                event: "lfse_lodge_official_outbound_click",
                                lodgeSlug: lodge.slug,
                                targetUrl:
                                  lodge.packageSeller
                                    .officialBookingOrInquiryUrl,
                              })
                            }
                          >
                            {lodge.packageSeller.primaryCtaLabel} ↗
                          </a>
                        </div>
                        <div
                          style={{
                            fontSize: 11.2,
                            color: "var(--muted)",
                            marginTop: 5,
                          }}
                        >
                          Free listing · Checked {lodge.verifiedAt} ·{" "}
                          {lodge.operatingCompany.officialWebsite}
                          {lodge.operatingCompany.officialPhone
                            ? ` · ${lodge.operatingCompany.officialPhone}`
                            : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. Directory Cards Grid */}
      {filteredLodges.length === 0 ? (
        <div
          className={`card ${styles.noPrint}`}
          style={{ textAlign: "center", padding: "36px 24px" }}
        >
          <h3 style={{ margin: "0 0 8px" }}>
            No lodges match these exact filters
          </h3>
          <p style={{ margin: "0 0 14px", color: "var(--muted)" }}>
            Try widening your stay type, region, or rate filter to view all{" "}
            {totalCount} properties.
          </p>
          <div>
            <button
              type="button"
              className="button secondary"
              onClick={resetAllFilters}
              style={{ cursor: "pointer" }}
            >
              Show All {totalCount} Properties
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`lfse-cards-grid ${
            selectedLodges.length > 0 ? styles.noPrint : ""
          }`}
          data-testid="lodge-cards-grid"
        >
          {filteredLodges.map((lodge) => {
            const leadPkg = lodge.packages[0]!;
            const leadAccess = lodge.accessConnections[0]!;
            const isSelected = selectedCompareSlugs.includes(lodge.slug);
            const compareFull = !isSelected && selectedCompareSlugs.length >= 4;
            const isWholeProperty =
              lodge.stayFormat === "whole_lodge_private_property";
            const bookingDistinction = summarizeBookingDistinction(lodge);
            const hasTransferConflict =
              leadAccess.provisionStatus ===
              "conflicting_official_pages_confirm";

            return (
              <article
                key={lodge.lodgeId}
                className={`${styles.lodgeCard} ${
                  isWholeProperty ? styles.lodgeCardWholeProperty : ""
                }`}
                data-testid={`lodge-card-${lodge.slug}`}
              >
                <div>
                  {/* Regional Scenery Image with Concise Disclosure */}
                  <div className={styles.visualContextBox}>
                    <img
                      src={lodge.visualRepresentation.imagePath}
                      alt={lodge.visualRepresentation.imageAlt}
                      width={640}
                      height={360}
                      loading="lazy"
                    />
                    <div className={styles.visualContextOverlayBadge}>
                      <span className={styles.contextPhotoTag}>
                        {lodge.visualRepresentation.visualDisclosureBadge}
                      </span>
                    </div>
                    <span className={styles.contextCreditFooter}>
                      {lodge.visualRepresentation.imageCredit}
                    </span>
                  </div>

                  {/* Badges */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      className={`badge ${
                        isWholeProperty ? "badge-warning" : "badge-safety"
                      }`}
                    >
                      {isWholeProperty
                        ? "Whole-Lodge Private Stay · Services Separate"
                        : ARCHETYPE_LABELS[lodge.operationArchetype]}
                    </span>
                    <span className="chip">
                      {lodge.accommodation.gatewayLabel}
                    </span>
                  </div>

                  {/* Title & Monogram */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <OperatorIdentityMark name={lodge.displayName} size="sm" />
                    <h3 style={{ margin: 0, fontSize: 19, lineHeight: 1.22 }}>
                      <Link
                        href={`${SEAK_FISHING_LODGES_PATH}/${lodge.slug}`}
                        style={{ color: "var(--deep)" }}
                      >
                        {lodge.displayName}
                      </Link>
                    </h3>
                  </div>

                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: 13.8,
                      color: "var(--muted)",
                    }}
                  >
                    {lodge.headlineSummary}
                  </p>

                  {/* Price & Stay Length First */}
                  <div className={styles.priceCalloutBox}>
                    <span className={styles.priceHeadline}>
                      {leadPkg.priceDisplayLabel}
                    </span>
                    <span className={styles.priceScopeSub}>
                      {leadPkg.durationSummaryLabel} ·{" "}
                      {leadPkg.applicableSeason === "season_not_stated_on_source"
                        ? "Confirm season year with lodge"
                        : `${leadPkg.applicableSeason} season`}{" "}
                      · {leadPkg.occupancyAndSharingBasis}
                    </span>
                  </div>

                  {/* Concise Location, Access & Booking-Role Note */}
                  <div className={styles.roleMiniBox}>
                    <div className={styles.roleMiniRow}>
                      <strong>Location:</strong>{" "}
                      {lodge.accommodation.actualLocationLabel}
                    </div>
                    <div className={styles.roleMiniRow}>
                      <strong>Getting there:</strong> {leadAccess.legTitle} (
                      <em>
                        {PROVISION_STATUS_LABELS[leadAccess.provisionStatus]}
                      </em>
                      )
                    </div>
                    {bookingDistinction && (
                      <div className={styles.roleMiniRow}>
                        <strong>Booking setup:</strong> {bookingDistinction}
                      </div>
                    )}
                    {hasTransferConflict && (
                      <div className={styles.conflictAlert}>
                        Official pages differ on whether Ketchikan–Klawock
                        flights are included — confirm before booking.
                      </div>
                    )}
                  </div>

                  <div className="chips" style={{ marginTop: 8 }}>
                    <span className="chip">
                      {lodge.fishingProgram.waterTypes.join(" + ")}
                    </span>
                    <span className="chip">Free listing</span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className={styles.cardActionsRow}>
                  <button
                    type="button"
                    onClick={() => toggleCompare(lodge.slug)}
                    disabled={compareFull}
                    className={`${styles.compareToggleBtn} ${
                      isSelected ? styles.compareToggleBtnSelected : ""
                    }`}
                    aria-pressed={isSelected}
                    data-testid={`compare-toggle-${lodge.slug}`}
                  >
                    {isSelected
                      ? "✓ Comparing"
                      : compareFull
                        ? "Max 4 Selected"
                        : "+ Compare"}
                  </button>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <a
                      href={lodge.packageSeller.officialBookingOrInquiryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12.8,
                        fontWeight: 700,
                        color: "var(--muted)",
                        textDecoration: "underline",
                      }}
                      onClick={() =>
                        trackFishingLodgeDirectoryEvent({
                          event: "lfse_lodge_official_outbound_click",
                          lodgeSlug: lodge.slug,
                          targetUrl:
                            lodge.packageSeller.officialBookingOrInquiryUrl,
                        })
                      }
                    >
                      {lodge.packageSeller.primaryCtaLabel} ↗
                    </a>
                    <Link
                      href={`${SEAK_FISHING_LODGES_PATH}/${lodge.slug}`}
                      style={{
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: "var(--forest)",
                      }}
                    >
                      View Lodge →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
