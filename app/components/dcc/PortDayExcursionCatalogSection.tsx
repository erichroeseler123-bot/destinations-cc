"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  PortDayExcursionCatalogResponse,
  PortDayExcursionCard,
  PortDayExcursionViewMode,
  PortDayExcursionCategoryFilter,
  PortDaySeatAvailabilityEvaluation,
} from "@/lib/dcc/cruisePortExcursionCatalogEngine";

interface PortDayExcursionCatalogSectionProps {
  portSlug: string;
  initialCatalogData?: PortDayExcursionCatalogResponse | null;
  initialViewMode?: PortDayExcursionViewMode;
  initialCategory?: PortDayExcursionCategoryFilter;
  initialShipArrivalTime?: string;
  initialShipAllAboardTime?: string;
  initialShipDepartureTime?: string | null;
  initialSailingDate?: string;
  initialShipSlug?: string | null;
  initialSailingId?: string | null;
  initialPartySize?: number;
  initialShip?: string;
  initialCruiseSailingDate?: string;
}

const CATEGORY_OPTIONS: Array<{
  id: PortDayExcursionCategoryFilter;
  label: string;
}> = [
  { id: "all", label: "All Tours" },
  { id: "sightseeing", label: "Sightseeing" },
  { id: "wildlife", label: "Wildlife" },
  { id: "food", label: "Food" },
  { id: "culture", label: "Culture" },
  { id: "adventure", label: "Adventure" },
  { id: "family", label: "Family" },
];

export default function PortDayExcursionCatalogSection({
  portSlug,
  initialCatalogData = null,
  initialViewMode = "browse_all",
  initialCategory = "all",
  initialShipArrivalTime,
  initialShipAllAboardTime,
  initialShipDepartureTime,
  initialSailingDate,
  initialShipSlug,
  initialSailingId,
  initialPartySize = 2,
  initialShip = "",
  initialCruiseSailingDate = "",
}: PortDayExcursionCatalogSectionProps) {
  const [data, setData] = useState<PortDayExcursionCatalogResponse | null>(initialCatalogData);
  const [viewMode, setViewMode] = useState<PortDayExcursionViewMode>(
    initialCatalogData?.viewMode || initialViewMode
  );
  const [category, setCategory] = useState<PortDayExcursionCategoryFilter>(
    initialCatalogData?.category || initialCategory
  );
  const [shipArrival, setShipArrival] = useState<string>(
    initialShipArrivalTime ||
      initialCatalogData?.sailingWindow.shipArrivalTime ||
      "08:00"
  );
  const [allAboard, setAllAboard] = useState<string>(
    initialShipAllAboardTime ||
      initialCatalogData?.sailingWindow.shipAllAboardTime ||
      "17:30"
  );
  const [shipDeparture] = useState<string | null>(
    initialShipDepartureTime ??
      initialCatalogData?.sailingWindow.shipDepartureTime ??
      null
  );
  const [sailingDate, setSailingDate] = useState<string>(
    initialSailingDate ||
      initialCatalogData?.sailingWindow.sailingDate ||
      "2027-07-15"
  );
  const [shipSlug] = useState<string | null>(
    initialShipSlug ?? initialCatalogData?.sailingWindow.shipSlug ?? null
  );
  const [sailingId] = useState<string | null>(
    initialSailingId ?? initialCatalogData?.sailingWindow.sailingId ?? null
  );
  const [partySize, setPartySize] = useState<number>(
    initialCatalogData?.sailingWindow.partySize || initialPartySize
  );
  const [ship, setShip] = useState<string>(initialShip);
  const [cruiseSailingDate, setCruiseSailingDate] = useState<string>(
    initialCruiseSailingDate
  );
  const [sortBy, setSortBy] = useState<
    "recommended" | "rating_desc" | "price_asc" | "duration_asc"
  >("recommended");
  const [offset, setOffset] = useState<number>(0);
  const limit = 12;

  const [loading, setLoading] = useState<boolean>(!initialCatalogData);
  const [error, setError] = useState<string | null>(null);

  const [liveSeatStates, setLiveSeatStates] = useState<
    Record<string, PortDaySeatAvailabilityEvaluation>
  >({});
  const [checkingTourIds, setCheckingTourIds] = useState<Record<string, boolean>>({});
  const [handoffLoggedIds, setHandoffLoggedIds] = useState<Record<string, string>>({});

  const buildPlanWithMyGroupHref = useCallback(
    (tourCode?: string) => {
      const params = new URLSearchParams({
        port: portSlug,
        port_date: sailingDate,
        party_size: String(partySize),
      });
      if (ship.trim()) params.set("ship", ship.trim());
      if (cruiseSailingDate.trim()) {
        params.set("sailing_date", cruiseSailingDate.trim());
      }
      if (tourCode) params.set("tour_code", tourCode);
      return `/go/dcc-to-cruise-promenade?${params.toString()}`;
    },
    [portSlug, sailingDate, partySize, ship, cruiseSailingDate]
  );

  const fetchCatalog = useCallback(
    async (opts?: {
      nextViewMode?: PortDayExcursionViewMode;
      nextCategory?: PortDayExcursionCategoryFilter;
      nextOffset?: number;
      nextSortBy?: "recommended" | "rating_desc" | "price_asc" | "duration_asc";
      nextShipArrival?: string;
      nextAllAboard?: string;
      nextSailingDate?: string;
      nextPartySize?: number;
      nextShip?: string;
      nextCruiseSailingDate?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          port: portSlug,
          viewMode: opts?.nextViewMode ?? viewMode,
          category: opts?.nextCategory ?? category,
          shipArrival: opts?.nextShipArrival ?? shipArrival,
          allAboard: opts?.nextAllAboard ?? allAboard,
          date: opts?.nextSailingDate ?? sailingDate,
          partySize: String(opts?.nextPartySize ?? partySize),
          limit: String(limit),
          offset: String(opts?.nextOffset ?? offset),
          sortBy: opts?.nextSortBy ?? sortBy,
        });
        const nextShipVal = (opts?.nextShip ?? (ship || shipSlug || "")).trim();
        const nextCruiseSailDateVal = (
          opts?.nextCruiseSailingDate ?? cruiseSailingDate
        ).trim();
        if (shipDeparture) {
          params.set("shipDeparture", shipDeparture);
        }
        if (nextShipVal) {
          params.set("ship", nextShipVal);
        }
        if (sailingId) {
          params.set("sailing", sailingId);
        }
        if (nextCruiseSailDateVal) {
          params.set("sailing_date", nextCruiseSailDateVal);
        }
        const res = await fetch(
          `/api/v1/cruise/port-day-excursions?${params.toString()}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} fetching shore excursion catalog`);
        }
        const json: PortDayExcursionCatalogResponse = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err?.message || "Failed to load shore excursion catalog.");
      } finally {
        setLoading(false);
      }
    },
    [
      portSlug,
      viewMode,
      category,
      shipArrival,
      allAboard,
      shipDeparture,
      sailingDate,
      shipSlug,
      sailingId,
      partySize,
      ship,
      cruiseSailingDate,
      offset,
      sortBy,
    ]
  );

  useEffect(() => {
    if (!initialCatalogData) {
      void fetchCatalog();
    }
  }, [initialCatalogData, fetchCatalog]);

  const handleVerifyLiveAvailability = async (tour: PortDayExcursionCard) => {
    const key = tour.tourId;
    setCheckingTourIds((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/v1/cruise/port-day-excursions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portSlug,
          tourId: tour.tourId,
          productCode: tour.productCode,
          optionCode: tour.optionCode || tour.timeFit.selectedOptionCode,
          date: sailingDate,
          partySize,
          departureTime: tour.timeFit.selectedDepartureTime,
        }),
      });
      const json = await res.json();
      if (json?.seatAvailability) {
        setLiveSeatStates((prev) => ({
          ...prev,
          [key]: json.seatAvailability,
        }));
      }
    } catch {
      // Fallback handled by existing state
    } finally {
      setCheckingTourIds((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleTrackHandoffClick = (tour: PortDayExcursionCard) => {
    setHandoffLoggedIds((prev) => ({
      ...prev,
      [tour.tourId]: new Date().toLocaleTimeString(),
    }));
  };

  const portProfile = data?.port;
  const tours = data?.tours || [];

  return (
    <section
      id="shared-port-day-excursion-catalog"
      data-testid="shared-port-day-excursion-catalog"
      className="mx-auto max-w-6xl space-y-6 rounded-3xl border border-cyan-500/30 bg-slate-950/95 p-6 text-slate-100 shadow-2xl"
    >
      {/* Header & Provider Reconciliation Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
              Shared Shore-Excursion Catalog · {portProfile?.batchLabel || "Cruise Port Rollout"}
            </span>
            {portProfile?.viatorDestinationId ? (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Viator Destination ID: {portProfile.viatorDestinationId} ({portProfile.viatorDestinationName})
              </span>
            ) : null}
            {data?.pagination ? (
              <span
                data-testid="sql-pagination-telemetry"
                className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-mono text-violet-200"
              >
                SQL Query: {data.pagination.sqlQueryMs}ms · Rows loaded into app:{" "}
                {data.pagination.rowsLoadedIntoApp} / {data.pagination.totalMatchedInSql} ·
                Full catalog in app: {String(data.pagination.fullCatalogLoadedIntoApp)}
              </span>
            ) : null}
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {portProfile?.portName || portSlug} Port-Day Shore Excursions & All-Aboard Fit Checker
          </h2>

          <p className="max-w-3xl text-sm text-slate-300">
            Pier baseline:{" "}
            <strong className="text-white">
              {portProfile?.defaultPierName || "Cruise Terminal"}
            </strong>{" "}
            ({portProfile?.defaultPierAddress || "Port arrival berth"}). Evaluates departure
            times, check-in cutoffs, meeting points, round-trip pier transfers, and return
            buffers against your ship&apos;s all-aboard time while keeping{" "}
            <strong className="text-cyan-300">Time Fit</strong> and{" "}
            <strong className="text-emerald-300">Seat Availability</strong> strictly separate.
          </p>
        </div>

        {/* Provider Count Reconciliation Box */}
        {data?.providerCounts ? (
          <div
            data-testid="provider-reconciliation-box"
            className="min-w-[290px] max-w-[440px] rounded-2xl border border-white/10 bg-slate-900/90 p-4 text-xs"
          >
            <div className="font-bold uppercase tracking-wider text-cyan-300">
              Active SQL Inventory &amp; Authorized Catalog Reconciliation
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-slate-950/80 p-2">
                <div className="text-[11px] text-slate-400">Viator SQL</div>
                <div className="text-base font-black text-white">
                  {data.providerCounts.viator.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/80 p-2">
                <div className="text-[11px] text-slate-400">Direct Op</div>
                <div className="text-base font-black text-emerald-300">
                  {data.providerCounts.operator_direct.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/80 p-2">
                <div className="text-[11px] text-slate-400">Active Total</div>
                <div className="text-base font-black text-cyan-300">
                  {data.providerCounts.total.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/80 p-2">
                <div className="text-[11px] text-slate-400">Source Total</div>
                <div className="text-base font-black text-violet-300">
                  {data.providerCounts.authorizedSourceTotal.toLocaleString()}
                </div>
              </div>
            </div>
            {data.providerCounts.reconciliationBreakdown?.currentActiveInventoryExplanation ? (
              <div className="mt-2 text-[11px] leading-snug text-slate-300">
                {data.providerCounts.reconciliationBreakdown.currentActiveInventoryExplanation}
              </div>
            ) : null}
            {data.sharedHandoffLedgerSummary ? (
              <div
                data-testid="shared-handoff-ledger-summary"
                className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 pt-2 text-[11px] text-slate-300"
              >
                <span>
                  <strong className="text-cyan-300">Redirects:</strong>{" "}
                  {data.sharedHandoffLedgerSummary.redirects.total}
                </span>
                <span>
                  <strong className="text-emerald-300">Confirmed Bookings:</strong>{" "}
                  {String(
                    data.sharedHandoffLedgerSummary.providerConfirmedBookings.displayValue
                  )}
                </span>
                <span>
                  <strong className="text-amber-300">Earned Commissions:</strong>{" "}
                  {typeof data.sharedHandoffLedgerSummary.earnedCommissions
                    .displayValue === "number"
                    ? `$${data.sharedHandoffLedgerSummary.earnedCommissions.displayValue.toFixed(
                        2
                      )}`
                    : data.sharedHandoffLedgerSummary.earnedCommissions.displayValue}
                </span>
              </div>
            ) : null}
            {data.providerCounts.pendingOperatorNotes &&
            data.providerCounts.pendingOperatorNotes.length > 0 ? (
              <div className="mt-2.5 rounded-xl border border-amber-400/30 bg-amber-950/40 p-2 text-[11px] leading-relaxed text-amber-200">
                {data.providerCounts.pendingOperatorNotes[0]}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* View Mode Tabs & Sailing Window Controls */}
      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="space-y-2 lg:col-span-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Port-Day View Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="tab-browse-all-tours"
                onClick={() => {
                  setViewMode("browse_all");
                  setOffset(0);
                  void fetchCatalog({ nextViewMode: "browse_all", nextOffset: 0 });
                }}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  viewMode === "browse_all"
                    ? "bg-cyan-500 text-slate-950 shadow-lg"
                    : "border border-white/15 bg-slate-950/70 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Browse all tours (
                {data?.pagination.totalMatchedInSql?.toLocaleString() || "…"})
              </button>
              <button
                type="button"
                data-testid="tab-fits-my-sailing"
                onClick={() => {
                  setViewMode("fits_sailing");
                  setOffset(0);
                  void fetchCatalog({ nextViewMode: "fits_sailing", nextOffset: 0 });
                }}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  viewMode === "fits_sailing"
                    ? "bg-emerald-500 text-slate-950 shadow-lg"
                    : "border border-white/15 bg-slate-950/70 text-slate-200 hover:bg-slate-800"
                }`}
              >
                Fits my sailing ({data?.summary.fitsSailingCountOnPage ?? "…"} on page)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:col-span-7">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400">
                Ship Arrival
              </label>
              <input
                type="time"
                value={shipArrival}
                onChange={(e) => setShipArrival(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-2.5 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400">
                All-Aboard
              </label>
              <input
                type="time"
                value={allAboard}
                onChange={(e) => setAllAboard(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-2.5 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400">
                Port Date
              </label>
              <input
                type="date"
                value={sailingDate}
                onChange={(e) => setSailingDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-2.5 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400">
                Party Size
              </label>
              <select
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-2.5 py-2 text-xs text-white"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex items-end sm:col-span-1">
              <button
                type="button"
                onClick={() => {
                  setOffset(0);
                  void fetchCatalog({ nextOffset: 0 });
                }}
                className="w-full rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
              >
                Recalculate
              </button>
            </div>
          </div>
        </div>

        {/* Group Sailing Handoff Row */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-white/10 pt-3">
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 md:max-w-xl">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400">
                Ship Name (optional for full sailing match)
              </label>
              <input
                type="text"
                value={ship}
                onChange={(e) => setShip(e.target.value)}
                placeholder="e.g. Icon of the Seas or Symphony of the Seas"
                className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-2.5 py-2 text-xs text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400">
                Cruise Embarkation Date (optional)
              </label>
              <input
                type="date"
                value={cruiseSailingDate}
                onChange={(e) => setCruiseSailingDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-2.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={buildPlanWithMyGroupHref()}
              data-testid="dcc-plan-with-my-group-cta"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/20 px-4 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30 transition shadow-sm"
            >
              Plan with my group →
            </a>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Sort Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              data-testid={`category-pill-${cat.id}`}
              onClick={() => {
                setCategory(cat.id);
                setOffset(0);
                void fetchCatalog({ nextCategory: cat.id, nextOffset: 0 });
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                category === cat.id
                  ? "bg-cyan-400 text-slate-950"
                  : "border border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Sort in SQL:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              const nextSort = e.target.value as
                | "recommended"
                | "rating_desc"
                | "price_asc"
                | "duration_asc";
              setSortBy(nextSort);
              setOffset(0);
              void fetchCatalog({ nextSortBy: nextSort, nextOffset: 0 });
            }}
            className="rounded-xl border border-white/15 bg-slate-900 px-3 py-1.5 text-xs text-white"
          >
            <option value="recommended">Recommended (Quality + Fit)</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="price_asc">Lowest Price</option>
            <option value="duration_asc">Shortest Duration</option>
          </select>
        </div>
      </div>

      {/* Page Status Summary Bar */}
      {data?.summary ? (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3.5 text-xs sm:grid-cols-4">
          <div>
            <span className="text-slate-400">Fits My Sailing:</span>{" "}
            <strong className="text-emerald-400">
              {data.summary.fitsSailingCountOnPage}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Runs Too Late:</span>{" "}
            <strong className="text-rose-400">
              {data.summary.runsTooLateCountOnPage}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Needs Verification:</span>{" "}
            <strong className="text-amber-300">
              {data.summary.needsVerificationCountOnPage ??
                data.summary.missingOperatorInfoCountOnPage}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Live Availability Capable:</span>{" "}
            <strong className="text-cyan-300">
              {data.summary.liveAvailabilitySupportedCountOnPage}
            </strong>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/50 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">
          Querying Neon SQL excursion catalog and evaluating port-day timing fit…
        </div>
      ) : tours.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center text-sm text-slate-300">
          No tours on this page matched the current filter. Switch to{" "}
          <button
            type="button"
            onClick={() => {
              setViewMode("browse_all");
              setCategory("all");
              setOffset(0);
              void fetchCatalog({
                nextViewMode: "browse_all",
                nextCategory: "all",
                nextOffset: 0,
              });
            }}
            className="font-bold text-cyan-300 underline"
          >
            Browse all tours
          </button>{" "}
          or adjust your ship arrival and all-aboard times.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {tours.map((tour) => {
            const seatState = liveSeatStates[tour.tourId] || tour.seatAvailability;
            const isCheckingSeat = Boolean(checkingTourIds[tour.tourId]);
            const handoffTimestamp = handoffLoggedIds[tour.tourId];

            const fitBadgeClass =
              tour.timeFit.status === "fits"
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                : tour.timeFit.status === "runs_too_late"
                  ? "border-rose-400/40 bg-rose-500/15 text-rose-300"
                  : "border-amber-400/40 bg-amber-500/15 text-amber-200";

            const seatBadgeClass =
              seatState.status === "live_verified" && seatState.available
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                : seatState.status === "sold_out"
                  ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                  : "border-sky-400/40 bg-sky-500/15 text-sky-200";

            return (
              <article
                key={tour.tourId}
                data-testid={`excursion-card-${tour.productCode || tour.tourId}`}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-lg"
              >
                <div className="space-y-3">
                  {/* Provider + Product Code + Categories */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-lg border border-white/15 bg-slate-950 px-2.5 py-1 font-semibold text-cyan-300">
                        {tour.provider === "operator_direct"
                          ? `Direct Operator · ${tour.operatorName}`
                          : `Viator Partner API · ${tour.productCode}`}
                      </span>
                      {tour.categories.map((c) => (
                        <span
                          key={c}
                          className="rounded-lg bg-white/5 px-2 py-0.5 text-[11px] capitalize text-slate-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="font-bold text-white">
                      {tour.fromPriceUsd !== null
                        ? `From $${tour.fromPriceUsd.toFixed(2)}`
                        : "Check price"}
                    </div>
                  </div>

                  {/* Title & Rating */}
                  <div>
                    <h3 className="text-lg font-bold leading-snug text-white">
                      {tour.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Supplier: {tour.operatorName}</span>
                      {tour.durationMinutes ? (
                        <span>
                          · Duration: {Math.round((tour.durationMinutes / 60) * 10) / 10} hrs (
                          {tour.durationMinutes} min)
                        </span>
                      ) : null}
                      {tour.rating ? (
                        <span className="text-amber-300">
                          · ★ {tour.rating.toFixed(1)} ({tour.reviewCount.toLocaleString()}{" "}
                          reviews)
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* SEPARATE STATUS 1 & STATUS 2 PILLS */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div
                      data-testid={`time-fit-badge-${tour.productCode || tour.tourId}`}
                      className={`rounded-xl border px-3 py-2 text-xs ${fitBadgeClass}`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        1. Sailing Time Fit (Separate from Seats)
                      </div>
                      <div className="mt-0.5 font-bold">{tour.timeFit.statusLabel}</div>
                    </div>

                    <div
                      data-testid={`seat-availability-badge-${tour.productCode || tour.tourId}`}
                      className={`rounded-xl border px-3 py-2 text-xs ${seatBadgeClass}`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        2. Seat Availability ({partySize} guests · {sailingDate})
                      </div>
                      <div className="mt-0.5 font-bold">{seatState.statusLabel}</div>
                    </div>
                  </div>

                  {/* Detailed Timing Verification Breakdown */}
                  <div className="space-y-1.5 rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-300">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-slate-400">Selected Departure:</span>
                      <span className="font-semibold text-white">
                        {tour.timeFit.selectedDepartureTime
                          ? `${tour.timeFit.selectedDepartureTime}${
                              tour.timeFit.selectedOptionCode
                                ? ` (Option ${tour.timeFit.selectedOptionCode})`
                                : ""
                            }`
                          : "Needs verification (missing departure time)"}
                        {tour.timeFit.fittingDepartureTimes.length > 1
                          ? ` (Fits: ${tour.timeFit.fittingDepartureTimes.join(", ")})`
                          : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-slate-400">Check-In Cutoff:</span>
                      <span className="font-semibold text-white">
                        {tour.timeFit.checkInCutoffMinutes !== null
                          ? `${tour.timeFit.checkInCutoffMinutes} min before departure${
                              tour.timeFit.latestCheckInTime
                                ? ` (Check in by ${tour.timeFit.latestCheckInTime})`
                                : ""
                            }`
                          : "Needs verification (missing check-in cutoff)"}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-slate-400">Meeting Point / Pickup:</span>
                      <span className="font-semibold text-white">
                        {tour.timeFit.meetingPointName ||
                          "Needs verification (missing operator meeting point)"}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-slate-400">Round-Trip Pier Transfer:</span>
                      <span className="font-semibold text-white">
                        {tour.timeFit.roundTripTransferMinutes !== null
                          ? `${tour.timeFit.oneWayTransferMinutes}m each way (${tour.timeFit.roundTripTransferMinutes}m round-trip)`
                          : "Needs verification (missing verified pier transfer)"}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-slate-400">Return to Pier vs All-Aboard:</span>
                      <span
                        className={`font-semibold ${
                          tour.timeFit.status === "fits"
                            ? "text-emerald-300"
                            : tour.timeFit.status === "runs_too_late"
                              ? "text-rose-300"
                              : "text-amber-300"
                        }`}
                      >
                        {tour.timeFit.estimatedBackAtPierTime
                          ? `Back at pier ${tour.timeFit.estimatedBackAtPierTime} (${
                              (tour.timeFit.bufferBeforeAllAboardMinutes ?? 0) >= 0
                                ? `+${tour.timeFit.bufferBeforeAllAboardMinutes}m buffer`
                                : `${tour.timeFit.bufferBeforeAllAboardMinutes}m past`
                            } vs ${allAboard}${
                              tour.timeFit.shipDepartureTime &&
                              tour.timeFit.returnBufferReconciliation
                                ?.bufferBeforeShipDepartureMinutes !== null &&
                              tour.timeFit.returnBufferReconciliation
                                ?.bufferBeforeShipDepartureMinutes !== undefined
                                ? ` · +${tour.timeFit.returnBufferReconciliation.bufferBeforeShipDepartureMinutes}m vs ${tour.timeFit.shipDepartureTime} departure`
                                : ""
                            })`
                          : "Needs verification (cannot compute return buffer without full evidence)"}
                      </span>
                    </div>
                    <p className="pt-1 text-[11px] leading-relaxed text-slate-400">
                      {tour.timeFit.reasonSummary}
                    </p>
                  </div>

                  {/* Live Seat Availability Details & Verify Button */}
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-200">
                          {seatState.detailNote}
                        </div>
                        {seatState.status === "live_verified" &&
                        seatState.options.length > 0 ? (
                          <div className="text-[11px] text-emerald-300">
                            Provider-confirmed option:{" "}
                            {seatState.options
                              .map(
                                (o) =>
                                  `${o.optionCode} (${o.startTime}${
                                    o.priceUsd !== null
                                      ? ` · $${o.priceUsd.toFixed(2)}/guest`
                                      : ""
                                  })`
                              )
                              .join(" · ")}
                          </div>
                        ) : (
                          <div className="text-[11px] text-cyan-300">
                            <a
                              href={
                                seatState.dccTrackedHref || tour.handoff.dccTrackedHref
                              }
                              target="_blank"
                              rel="sponsored nofollow noopener noreferrer"
                              className="underline hover:text-cyan-200"
                            >
                              Check availability on exact product ({tour.productCode || tour.tourId}) ↗
                            </a>
                          </div>
                        )}
                      </div>

                      {seatState.supportsLiveCheck ? (
                        <button
                          type="button"
                          data-testid={`verify-live-availability-btn-${tour.productCode || tour.tourId}`}
                          disabled={isCheckingSeat}
                          onClick={() => void handleVerifyLiveAvailability(tour)}
                          className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50 transition"
                        >
                          {isCheckingSeat
                            ? "Checking live API…"
                            : seatState.status === "live_verified"
                              ? "Re-verify Live Availability"
                              : "Verify Live Availability"}
                        </button>
                      ) : (
                        <a
                          href={seatState.dccTrackedHref || tour.handoff.dccTrackedHref}
                          target="_blank"
                          rel="sponsored nofollow noopener noreferrer"
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/10"
                        >
                          Check availability ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exact Tour / Option Handoff Actions (Tracked Separately from Confirmed Bookings) */}
                <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={tour.handoff.dccTrackedHref}
                      target="_blank"
                      rel="sponsored nofollow noopener noreferrer"
                      data-testid={`exact-product-handoff-${tour.productCode || tour.tourId}`}
                      onClick={() => handleTrackHandoffClick(tour)}
                      className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 text-center text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                    >
                      {seatState.supportsLiveCheck && seatState.status !== "live_verified"
                        ? `Check Availability & Book Exact Tour (${tour.productCode || tour.optionCode || "Direct"}) ↗`
                        : `Open Exact Tour Checkout (${tour.productCode || tour.optionCode || "Direct"}) ↗`}
                    </a>
                    <a
                      href={`/tours/${encodeURIComponent(tour.productCode || tour.tourId)}`}
                      data-testid={`tour-detail-link-${tour.productCode || tour.tourId}`}
                      className="rounded-xl border border-cyan-400/35 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-slate-800 transition"
                    >
                      Tour Details →
                    </a>
                    <a
                      href={buildPlanWithMyGroupHref(tour.productCode || tour.tourId)}
                      data-testid={`dcc-card-plan-with-my-group-${tour.productCode || tour.tourId}`}
                      className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 transition"
                    >
                      Plan with my group →
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>
                      Handoff tracking:{" "}
                      <code className="text-slate-300">
                        {tour.handoff.handoffTrackingTag}
                      </code>{" "}
                      (tracked separately from confirmed bookings · credit:{" "}
                      <code className="text-cyan-300">
                        {tour.handoff.referralCreditStatus}
                      </code>
                      )
                    </span>
                    {handoffTimestamp ? (
                      <span className="font-semibold text-emerald-300">
                        ✓ Handoff recorded ({handoffTimestamp})
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* SQL Pagination Footer */}
      {data?.pagination ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-slate-300">
          <div>
            Showing offset <strong>{data.pagination.offset}</strong> –{" "}
            <strong>
              {data.pagination.offset + data.pagination.rowsLoadedIntoApp}
            </strong>{" "}
            of <strong>{data.pagination.totalMatchedInSql.toLocaleString()}</strong>{" "}
            SQL-matched tours in Neon (`dcc_tour_catalog`).
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={offset === 0 || loading}
              onClick={() => {
                const prevOffset = Math.max(0, offset - limit);
                setOffset(prevOffset);
                void fetchCatalog({ nextOffset: prevOffset });
              }}
              className="rounded-xl border border-white/15 bg-slate-900 px-3.5 py-2 font-bold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              ← Previous Page
            </button>
            <span className="px-2 font-semibold">
              Page {data.pagination.page}
            </span>
            <button
              type="button"
              disabled={!data.pagination.hasMore || loading}
              onClick={() => {
                const nextOff = data.pagination.nextOffset ?? offset + limit;
                setOffset(nextOff);
                void fetchCatalog({ nextOffset: nextOff });
              }}
              className="rounded-xl border border-white/15 bg-slate-900 px-3.5 py-2 font-bold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              Next Page →
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
