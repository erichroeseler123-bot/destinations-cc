"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  HOTEL_CONCIERGE_CONFIGS,
  type HotelConciergePropertyConfig,
} from "@/lib/dcc/catalog/hotelConfigs";
import type { MatchedTourOption, TripMatchResponse } from "@/lib/dcc/catalog/matcher";
import type { PickupFulfillmentType } from "@/lib/dcc/catalog/durableCatalogStore";

export type DccConciergeWidgetProps = {
  initialDestination?: string;
  initialPropertySlug?: string;
  initialSurface?:
    | "dcc"
    | "hotel_concierge"
    | "cruisepromenade"
    | "welcometoneworleanstours"
    | "welcometotheswamp"
    | "juneau-flight-deck";
  initialPickupMode?: "any" | PickupFulfillmentType;
  initialDate?: string;
  initialChildAges?: string;
  initialCategory?: string;
  initialShipArrival?: string;
  initialAllAboardTime?: string;
  embedMode?: boolean;
  isTest?: boolean;
  parentOrigin?: string;
  theme?: "dark" | "light";
};

const DESTINATION_OPTIONS = [
  { slug: "new-orleans", label: "New Orleans, LA (earthos:node:us-la-new-orleans)" },
  { slug: "juneau", label: "Juneau, AK (earthos:node:us-ak-juneau)" },
  { slug: "skagway", label: "Skagway, AK (earthos:node:us-ak-skagway)" },
  { slug: "ketchikan", label: "Ketchikan, AK (earthos:node:us-ak-ketchikan)" },
  { slug: "seward", label: "Seward, AK (earthos:node:us-ak-seward)" },
  { slug: "denali", label: "Denali National Park, AK (earthos:node:us-ak-denali)" },
  { slug: "cozumel", label: "Cozumel, Mexico (earthos:node:mx-roo-cozumel)" },
  { slug: "roatan", label: "Roatan, Honduras (earthos:node:hn-ib-roatan)" },
  { slug: "nassau", label: "Nassau, Bahamas (earthos:node:bs-np-nassau)" },
  { slug: "st-thomas", label: "St. Thomas, USVI (earthos:node:vi-st-thomas)" },
  { slug: "grand-cayman", label: "Grand Cayman (earthos:node:ky-grand-cayman)" },
  { slug: "miami", label: "Miami, FL (earthos:node:us-fl-miami)" },
  { slug: "seattle", label: "Seattle, WA (earthos:node:us-wa-seattle)" },
  { slug: "tampa", label: "Tampa, FL (earthos:node:us-fl-tampa)" },
  { slug: "denver-colorado", label: "Denver / Winter Park / Red Rocks, CO (earthos:node:us-co-denver)" },
];

export function getMinTravelDateIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDefaultFutureTravelDateIso(daysAhead = 14): string {
  const target = new Date(Date.now() + daysAhead * 86_400_000);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatPrice(cents: number | null, currency = "USD"): string {
  if (cents === null || !Number.isFinite(cents)) return "Price on request / check live";
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  }).format(dollars);
}

function getPickupFulfillmentBadgeClasses(mode?: PickupFulfillmentType | null): string {
  switch (mode) {
    case "pier_pickup":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    case "hotel_pickup":
      return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    case "downtown_shuttle_departure":
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "self_drive":
      return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    default:
      return "bg-slate-800 text-slate-300 border-slate-700";
  }
}

export default function DccConciergeWidget({
  initialDestination = "new-orleans",
  initialPropertySlug = "hotel-monteleone-nola",
  initialSurface = "hotel_concierge",
  initialPickupMode,
  initialDate,
  initialChildAges = "",
  initialCategory,
  initialShipArrival = "",
  initialAllAboardTime = "",
  embedMode = false,
  isTest = false,
  parentOrigin,
}: DccConciergeWidgetProps) {
  const defaultHotel =
    HOTEL_CONCIERGE_CONFIGS[initialPropertySlug] || HOTEL_CONCIERGE_CONFIGS["hotel-monteleone-nola"];
  const minDateIso = getMinTravelDateIso();

  const [surface, setSurface] = useState<string>(initialSurface);
  const [propertySlug, setPropertySlug] = useState<string>(defaultHotel.propertySlug);
  const [propertyName, setPropertyName] = useState<string>(defaultHotel.propertyName);
  const [destination, setDestination] = useState<string>(
    initialDestination || defaultHotel.destinationSlug,
  );
  const [hotelLat, setHotelLat] = useState<string>(String(defaultHotel.lat));
  const [hotelLng, setHotelLng] = useState<string>(String(defaultHotel.lng));
  const [filterToApprovedOnly, setFilterToApprovedOnly] = useState<boolean>(false);
  const [approvedTourIds, setApprovedTourIds] = useState<string[]>(defaultHotel.approvedTourIds);
  const [showHotelConfigPanel, setShowHotelConfigPanel] = useState<boolean>(false);

  // Guest trip constraints — default to a future date (+14 days) and 0 children (empty string)
  const [date, setDate] = useState<string>(
    () => initialDate || getDefaultFutureTravelDateIso(14),
  );
  const [adults, setAdults] = useState<number>(2);
  const [childAgesText, setChildAgesText] = useState<string>(initialChildAges);
  const [pickupMode, setPickupMode] = useState<"any" | PickupFulfillmentType>(
    initialPickupMode || (defaultHotel.defaultRequiresHotelPickup ? "hotel_pickup" : "any"),
  );
  const [shipArrival, setShipArrival] = useState<string>(initialShipArrival);
  const [allAboardTime, setAllAboardTime] = useState<string>(initialAllAboardTime);
  const [maxWeightLbs, setMaxWeightLbs] = useState<string>("");
  const [requiresWheelchair, setRequiresWheelchair] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [checkingLiveShortlist, setCheckingLiveShortlist] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<TripMatchResponse | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectPresetHotel = (slug: string) => {
    const preset: HotelConciergePropertyConfig | undefined = HOTEL_CONCIERGE_CONFIGS[slug];
    if (!preset) return;
    setPropertySlug(preset.propertySlug);
    setPropertyName(preset.propertyName);
    setDestination(preset.destinationSlug);
    setHotelLat(String(preset.lat));
    setHotelLng(String(preset.lng));
    setPickupMode(preset.defaultRequiresHotelPickup ? "hotel_pickup" : "any");
    setApprovedTourIds(preset.approvedTourIds);
  };

  const toggleApprovedTourId = (tourId: string) => {
    setApprovedTourIds((prev) =>
      prev.includes(tourId) ? prev.filter((id) => id !== tourId) : [...prev, tourId],
    );
  };

  const runTripMatch = useCallback(
    async (withShortlistLiveCheck = false) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const trimmedDate = date.trim();
      if (trimmedDate && /^\d{4}-\d{2}-\d{2}$/.test(trimmedDate) && trimmedDate < minDateIso) {
        setError(
          `Selected travel date (${trimmedDate}) is in the past (today is ${minDateIso}). Please choose today or a future travel date.`,
        );
        setLoading(false);
        setCheckingLiveShortlist(false);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      if (withShortlistLiveCheck) {
        setCheckingLiveShortlist(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const childAges = childAgesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map(Number)
          .filter((n) => Number.isFinite(n) && n >= 0 && n <= 17);

        const latNum = Number(hotelLat);
        const lngNum = Number(hotelLng);
        const weightNum = maxWeightLbs.trim() ? Number(maxWeightLbs) : undefined;

        const payload = {
          destination,
          date: trimmedDate || undefined,
          adults,
          childAges,
          pickupMode,
          requiresHotelPickup: pickupMode === "hotel_pickup",
          requiresPierPickup: pickupMode === "pier_pickup",
          hotelName: propertyName,
          hotelLat: Number.isFinite(latNum) ? latNum : undefined,
          hotelLng: Number.isFinite(lngNum) ? lngNum : undefined,
          approvedTourIds:
            filterToApprovedOnly && approvedTourIds.length > 0 ? approvedTourIds : undefined,
          category: initialCategory || undefined,
          shipArrival: shipArrival.trim() || undefined,
          allAboardTime: allAboardTime.trim() || undefined,
          maxPassengerWeightLbs: weightNum && Number.isFinite(weightNum) ? weightNum : undefined,
          requiresWheelchair,
          surface,
          propertySlug: surface === "hotel_concierge" ? propertySlug : undefined,
          enableShortlistLiveCheck: withShortlistLiveCheck,
          shortlistMaxCount: 4,
          isTest: isTest || undefined,
          parentOrigin: parentOrigin || undefined,
        };

        const res = await fetch("/api/v1/tours/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.message || data.error || `HTTP ${res.status}`);
        }
        setMatchResult(data as TripMatchResponse);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to run trip matching");
      } finally {
        if (abortRef.current === controller) {
          setLoading(false);
          setCheckingLiveShortlist(false);
        }
      }
    },
    [
      destination,
      date,
      minDateIso,
      adults,
      childAgesText,
      pickupMode,
      propertyName,
      hotelLat,
      hotelLng,
      filterToApprovedOnly,
      approvedTourIds,
      initialCategory,
      shipArrival,
      allAboardTime,
      maxWeightLbs,
      requiresWheelchair,
      surface,
      propertySlug,
      isTest,
      parentOrigin,
    ],
  );

  // Stage 1: Debounced catalog match (enableShortlistLiveCheck=false) when filters change.
  // Prevents firing repeated live-check requests on every keystroke!
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      void runTripMatch(false);
    }, 450);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [runTripMatch]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const allOptionsForHotelToggle: MatchedTourOption[] = matchResult
    ? [...matchResult.options, ...matchResult.ineligibleOptions]
    : [];

  return (
    <div
      data-testid="dcc-concierge-widget"
      data-embed-mode={embedMode ? "true" : "false"}
      className="rounded-2xl border border-slate-800 bg-slate-950/95 text-slate-100 shadow-2xl overflow-hidden"
    >
      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              Shared Tour Catalog & Trip-Matching Service
            </span>
            <span className="inline-flex items-center rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-mono text-cyan-300 border border-cyan-500/30">
              {matchResult?.destination.earthosDestinationNodeId || "earthos:node:us-la-new-orleans"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-slate-300">
              TZ: {matchResult?.destination.timeZone || "America/Chicago"}
            </span>
          </div>
          <h2 className="mt-1.5 text-xl font-bold text-white">
            {surface === "hotel_concierge"
              ? `Hotel Concierge Desk — ${propertyName}`
              : surface === "welcometotheswamp"
                ? "Welcome to the Swamp — Shared Trip Matcher"
                : surface === "welcometoneworleanstours"
                  ? "Welcome to New Orleans Tours — Shared Trip Matcher"
                  : surface === "cruisepromenade"
                    ? "Cruise Promenade Shore Excursion Matcher"
                    : "Destination Command Center — Universal Trip Matcher"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-400">Presentation Surface:</label>
          <select
            aria-label="Presentation Surface"
            data-testid="concierge-surface-select"
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            <option value="hotel_concierge">Hotel Concierge Widget</option>
            <option value="dcc">DCC Flagship (destinationcommandcenter.com)</option>
            <option value="welcometotheswamp">Welcome to the Swamp (WTS)</option>
            <option value="welcometoneworleanstours">Welcome to New Orleans (WNO)</option>
            <option value="cruisepromenade">Cruise Promenade</option>
          </select>

          <button
            type="button"
            onClick={() => setShowHotelConfigPanel((v) => !v)}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
          >
            {showHotelConfigPanel ? "Hide Hotel Config" : "Configure Hotel Property & Approved Tours"}
          </button>
        </div>
      </div>

      {/* Configurable Hotel Property & Approved Tours Panel */}
      {showHotelConfigPanel && (
        <div className="border-b border-amber-500/30 bg-amber-950/15 px-6 py-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-amber-300">
              Hotel Property Configuration & Approved Tour Selection
            </h3>
            <span className="text-xs text-slate-400">
              Configure hotel coordinates, pickup defaults, and approved tour whitelist
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Preset Partner Property</label>
              <select
                aria-label="Preset Partner Property"
                value={propertySlug}
                onChange={(e) => handleSelectPresetHotel(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
              >
                {Object.values(HOTEL_CONCIERGE_CONFIGS).map((cfg) => (
                  <option key={cfg.propertySlug} value={cfg.propertySlug}>
                    {cfg.propertyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Property Display Name</label>
              <input
                type="text"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Property Latitude</label>
              <input
                type="text"
                value={hotelLat}
                onChange={(e) => setHotelLat(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Property Longitude</label>
              <input
                type="text"
                value={hotelLng}
                onChange={(e) => setHotelLng(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={filterToApprovedOnly}
                onChange={(e) => setFilterToApprovedOnly(e.target.checked)}
                className="rounded border-slate-600"
              />
              Restrict guest results strictly to Hotel-Approved Tours ({approvedTourIds.length} selected)
            </label>

            {allOptionsForHotelToggle.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allOptionsForHotelToggle.slice(0, 8).map((opt) => {
                  const isApproved =
                    approvedTourIds.includes(opt.tourId) ||
                    approvedTourIds.includes(opt.providerProductCode) ||
                    opt.compatibilityAliases.some((a) => approvedTourIds.includes(a));
                  return (
                    <button
                      key={opt.tourId}
                      type="button"
                      onClick={() => toggleApprovedTourId(opt.tourId)}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium border transition ${
                        isApproved
                          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200"
                          : "border-slate-700 bg-slate-900 text-slate-400"
                      }`}
                    >
                      {isApproved ? "✓ Approved: " : "+ Approve: "}
                      {opt.title.slice(0, 32)}…
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest Circumstances Input Form */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Destination / Cruise Port
            </label>
            <select
              aria-label="Destination or Cruise Port"
              data-testid="concierge-destination-select"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            >
              {DESTINATION_OPTIONS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Travel Date</label>
            <input
              type="date"
              min={minDateIso}
              aria-label="Travel Date"
              data-testid="concierge-date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Adults (18+)</label>
            <input
              type="number"
              min={1}
              max={20}
              aria-label="Adults"
              data-testid="concierge-adults-input"
              value={adults}
              onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Children&apos;s Ages (optional)
            </label>
            <input
              type="text"
              placeholder="None (or e.g. 7, 11)"
              aria-label="Children's Ages"
              data-testid="concierge-children-input"
              value={childAgesText}
              onChange={(e) => setChildAgesText(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Pickup / Fulfillment Mode
            </label>
            <select
              aria-label="Pickup or Fulfillment Mode"
              data-testid="concierge-pickup-mode-select"
              value={pickupMode}
              onChange={(e) => setPickupMode(e.target.value as "any" | PickupFulfillmentType)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            >
              <option value="any">Any Pickup / Meeting Mode</option>
              <option value="hotel_pickup">Door-to-Door Hotel Pickup</option>
              <option value="pier_pickup">Cruise Pier Pickup</option>
              <option value="downtown_shuttle_departure">Downtown Shuttle Departure</option>
              <option value="self_drive">Self-Drive / Meet on Site</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              data-testid="concierge-verify-shortlist-btn"
              onClick={() => void runTripMatch(true)}
              disabled={checkingLiveShortlist}
              className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-3 py-2 text-xs font-bold text-slate-950 transition"
            >
              {checkingLiveShortlist ? "Verifying Live…" : "Verify Shortlist Live"}
            </button>
          </div>
        </div>

        {/* Secondary Constraints Row */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">Ship Arrival:</span>
            <input
              type="text"
              placeholder="08:00"
              value={shipArrival}
              onChange={(e) => setShipArrival(e.target.value)}
              className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
            />
            <span className="text-[11px] text-slate-400 whitespace-nowrap">All-Aboard:</span>
            <input
              type="text"
              placeholder="16:30"
              value={allAboardTime}
              onChange={(e) => setAllAboardTime(e.target.value)}
              className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">Max Passenger Wt (lbs):</span>
            <input
              type="number"
              placeholder="e.g. 260"
              value={maxWeightLbs}
              onChange={(e) => setMaxWeightLbs(e.target.value)}
              className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresWheelchair}
              onChange={(e) => setRequiresWheelchair(e.target.checked)}
              className="rounded border-slate-700"
            />
            Requires Wheelchair Access
          </label>

          <div className="text-right text-[11px] text-slate-400">
            {loading
              ? "Updating catalog candidates…"
              : checkingLiveShortlist
                ? "Running date-specific live checks…"
                : "Stage 1: Instant Catalog · Click Verify Shortlist Live for date-specific checks"}
          </div>
        </div>
      </div>

      {/* Metrics & Telemetry Strip */}
      {matchResult && (
        <div className="border-b border-slate-800 bg-slate-900/30 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Storage:{" "}
              <strong className="font-mono text-emerald-400">
                {matchResult.metrics.storageSource}
              </strong>
            </span>
            <span>
              Cached Search:{" "}
              <strong className="font-mono text-white">
                {matchResult.metrics.cachedCatalogSearchMs}ms
              </strong>
            </span>
            <span>
              Shortlist Live Check:{" "}
              <strong className="font-mono text-cyan-300">
                {matchResult.metrics.shortlistLiveCheckMs}ms ({matchResult.metrics.shortlistCheckedCount}{" "}
                checked, {matchResult.metrics.upstreamRequestsMade} upstream reqs)
              </strong>
            </span>
            <span>
              Supported Transfer Evidence:{" "}
              <strong
                data-testid="concierge-supported-transfer-count"
                className="font-mono text-emerald-300"
              >
                {matchResult.metrics.supportedVerifiedTransferCount}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-semibold">
              {matchResult.metrics.eligibleCount} Recommended
            </span>
            <span className="text-amber-300 font-semibold">
              {matchResult.metrics.needsConfirmationCount} Needs Confirmation
            </span>
            {matchResult.metrics.ineligibleCount > 0 && (
              <span className="text-rose-400 font-semibold">
                {matchResult.metrics.ineligibleCount} Filtered Out
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div
          data-testid="concierge-validation-error"
          className="m-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200"
        >
          {error}
        </div>
      )}

      {/* Matched Options List */}
      <div className="p-6 space-y-4">
        {matchResult?.options.map((opt) => {
          const bound = opt.boundOffer;
          const pickupBadgeClass = getPickupFulfillmentBadgeClasses(
            bound?.pickupFulfillmentType ?? opt.pickupAndLocation.pickupFulfillmentType,
          );
          const transferSource =
            opt.cruiseScheduleFit?.transferTimeSource || bound?.transferTimeSource || "unknown";
          const verifiedTransferMins =
            opt.cruiseScheduleFit?.transferBeforeMinutes ?? bound?.transferBeforeMinutes ?? null;
          const planningEstimateMins =
            opt.cruiseScheduleFit?.planningEstimateTransferMinutes ??
            bound?.planningEstimateTransferMinutes ??
            null;
          const berthOrMeeting =
            opt.cruiseScheduleFit?.applicableBerthOrMeetingPoint ??
            bound?.applicableBerthOrMeetingPoint ??
            opt.pickupAndLocation.applicableBerthOrMeetingPoint ??
            null;
          const transferEvidence =
            opt.cruiseScheduleFit?.transferEvidenceSource ??
            bound?.transferEvidenceSource ??
            opt.pickupAndLocation.transferEvidenceSource ??
            null;
          const preselection = opt.bookingPath.checkoutPreselection;

          return (
            <div
              key={opt.tourId}
              data-testid={`concierge-tour-card-${opt.providerProductCode}`}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        opt.suitability === "recommended"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {opt.suitability === "recommended" ? "Recommended Match" : "Needs Confirmation"}{" "}
                      (Score {opt.matchScore})
                    </span>

                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300 border border-slate-700">
                      {opt.capabilityTier}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        opt.commissionAuthorized
                          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {opt.commissionAuthorized
                        ? `Authorized (${opt.primaryProvider})`
                        : "Non-Commission Operator Discovery"}
                    </span>

                    <span className="text-[11px] font-mono text-slate-500">{opt.tourId}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{opt.title}</h3>

                  {/* Bound Option, Pickup Fulfillment & Transfer Provenance Badge Strip */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {bound?.optionTitle && (
                      <span
                        data-testid="concierge-bound-option-badge"
                        className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-200"
                      >
                        Option: {bound.optionTitle}
                        {bound.optionCode ? ` (${bound.optionCode})` : ""}
                      </span>
                    )}

                    <span
                      data-testid="concierge-pickup-badge"
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${pickupBadgeClass}`}
                    >
                      {bound?.pickupBadgeLabel || "Pickup / Meeting Point Unverified"}
                    </span>

                    <span
                      data-testid="concierge-transfer-badge"
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        (transferSource === "verified_pier_pickup" ||
                          transferSource === "verified_meeting_point") &&
                        verifiedTransferMins !== null
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : transferSource === "planning_estimate"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {(transferSource === "verified_pier_pickup" ||
                        transferSource === "verified_meeting_point") &&
                      verifiedTransferMins !== null
                        ? `Verified Pier Transfer (${verifiedTransferMins}m)`
                        : transferSource === "planning_estimate" && planningEstimateMins !== null
                          ? `Planning Estimate (~${planningEstimateMins}m transfer, unverified)`
                          : "Transfer Time Unknown"}
                    </span>

                    {berthOrMeeting && (
                      <span
                        data-testid="concierge-berth-meeting-point"
                        className="rounded-md bg-slate-800/90 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300"
                      >
                        Berth / Hub: {berthOrMeeting}
                      </span>
                    )}

                    {bound?.departureTime && (
                      <span
                        data-testid="concierge-bound-departure-badge"
                        className="rounded-md bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[11px] font-mono text-cyan-300"
                      >
                        Departs: {bound.departureTime} ({bound.date || date})
                      </span>
                    )}
                  </div>

                  {opt.summary && (
                    <p className="text-xs text-slate-300 leading-relaxed">{opt.summary}</p>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-lg font-extrabold text-emerald-400">
                    {formatPrice(opt.pricing.fromPriceCents, opt.pricing.currency)}
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      {opt.pricing.priceBasis === "flat_rate_per_vehicle"
                        ? "/ vehicle"
                        : "/ person"}
                    </span>
                  </div>
                  {opt.pricing.totalPartyPriceCents !== null &&
                    opt.pricing.totalPartyPriceCents !== undefined && (
                      <div
                        data-testid="concierge-total-party-price"
                        className="text-xs font-bold text-emerald-300"
                      >
                        Total Party ({bound?.totalGuests || adults} guests):{" "}
                        {formatPrice(opt.pricing.totalPartyPriceCents, opt.pricing.currency)}
                      </div>
                    )}
                  <div className="text-[11px] text-slate-400">
                    Channel:{" "}
                    <span className="font-mono text-slate-200">
                      {opt.pricing.selectedChannelId}
                    </span>
                  </div>
                  <div className="mt-2">
                    <a
                      href={opt.bookingPath.handoffUrl}
                      data-tracked-click-url={opt.bookingPath.trackedClickUrl}
                      onClick={() => {
                        if (
                          opt.bookingPath.trackedClickUrl &&
                          opt.bookingPath.trackedClickUrl.startsWith("/api/v1/ads/click")
                        ) {
                          try {
                            void fetch(opt.bookingPath.trackedClickUrl, {
                              method: "GET",
                              keepalive: true,
                            });
                          } catch {
                            // non-blocking click follow telemetry
                          }
                        }
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="concierge-bound-checkout-link"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 transition"
                    >
                      {opt.capabilityTier === "discovery_only"
                        ? "Visit Operator Site ↗"
                        : `Continue to Checkout (${bound?.optionCode || opt.primaryProvider}) ↗`}
                    </a>
                  </div>
                  {opt.bookingPath.clickId && (
                    <div className="mt-1 text-[10px] font-mono text-slate-400">
                      Trace ID: {opt.bookingPath.clickId}
                    </div>
                  )}
                </div>
              </div>

              {/* Checkout Selection Summary (explains provider preselection vs manual checkout selections) */}
              {preselection && (
                <div
                  data-testid="concierge-checkout-preselection-summary"
                  className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3.5 py-2.5 text-xs space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-cyan-300">
                      Checkout Selection Summary ({preselection.provider.toUpperCase()}):
                    </span>
                    <span className="rounded bg-slate-900/90 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                      {preselection.preselectionSupport}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {preselection.travelerActionSummary}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-300 pt-0.5">
                    <span>
                      <strong>Date to Select:</strong>{" "}
                      <code className="text-emerald-300">
                        {preselection.requiredSelectionsAtCheckout.date || date || "Select date"}
                      </code>
                    </span>
                    <span>
                      <strong>Travelers:</strong>{" "}
                      <code className="text-emerald-300">
                        {preselection.requiredSelectionsAtCheckout.partySummary}
                      </code>
                    </span>
                    {preselection.requiredSelectionsAtCheckout.optionTitle && (
                      <span>
                        <strong>Option:</strong>{" "}
                        <code className="text-emerald-300">
                          {preselection.requiredSelectionsAtCheckout.optionTitle}
                          {preselection.requiredSelectionsAtCheckout.optionCode
                            ? ` (${preselection.requiredSelectionsAtCheckout.optionCode})`
                            : ""}
                        </code>
                      </span>
                    )}
                    {preselection.requiredSelectionsAtCheckout.departureTime && (
                      <span>
                        <strong>Departure:</strong>{" "}
                        <code className="text-emerald-300">
                          {preselection.requiredSelectionsAtCheckout.departureTime}
                        </code>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Cheaper / Alternative Option Tradeoffs */}
              {Array.isArray(opt.alternativeOptionTradeoffs) &&
                opt.alternativeOptionTradeoffs.length > 0 && (
                  <div
                    data-testid="concierge-option-tradeoffs"
                    className="rounded-lg border border-amber-500/25 bg-amber-950/15 px-3.5 py-2.5 text-xs space-y-1.5"
                  >
                    <div className="font-bold text-amber-300">
                      Alternative Options & Pickup Tradeoffs Preserved ({opt.alternativeOptionTradeoffs.length})
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {opt.alternativeOptionTradeoffs.slice(0, 3).map((alt) => (
                        <li key={alt.optionCode} className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[11px] text-amber-200">
                            [{alt.optionCode}]
                          </span>
                          <span className="font-semibold text-white">{alt.title}:</span>
                          <span>{alt.tradeoffSummary}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Key Facts Row with Explicit Unknown Preservation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                  <div className="text-[10px] uppercase text-slate-400">Duration (Bound Option)</div>
                  <div className="font-semibold text-white mt-0.5">
                    {opt.duration.durationMinutes !== null ? (
                      opt.duration.durationRawText || `${opt.duration.durationMinutes} mins`
                    ) : (
                      <span className="text-amber-300">Unknown (Not assumed 3h)</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                  <div className="text-[10px] uppercase text-slate-400">Cancellation Policy</div>
                  <div className="font-semibold text-white mt-0.5">
                    {opt.cancellation.freeCancellation === true ? (
                      <span className="text-emerald-300">
                        Free cancellation ({opt.cancellation.cutoffHours || 24}h)
                      </span>
                    ) : opt.cancellation.freeCancellation === false ? (
                      <span className="text-rose-300">Non-refundable / Strict</span>
                    ) : (
                      <span className="text-amber-300">Unknown (Not assumed free)</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                  <div className="text-[10px] uppercase text-slate-400">
                    Pickup, Berth & Evidence
                  </div>
                  <div className="font-semibold text-white mt-0.5">
                    {bound?.pickupBadgeLabel ||
                      (opt.pickupAndLocation.hasHotelPickup === true
                        ? "Hotel / Shuttle Pickup Offered"
                        : opt.pickupAndLocation.hasHotelPickup === false
                          ? "Meeting Point Only"
                          : "Pickup Coverage Unknown")}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {opt.pickupAndLocation.locationPrecision === "exact" &&
                    opt.pickupAndLocation.meetingPointLat !== null
                      ? `Coords: ${opt.pickupAndLocation.meetingPointLat.toFixed(4)}, ${opt.pickupAndLocation.meetingPointLng?.toFixed(4)}${opt.pickupAndLocation.distanceFromGuestKm !== null ? ` (${opt.pickupAndLocation.distanceFromGuestKm} km)` : ""}`
                      : "Coordinates: Explicit Unknown (No fake city-center fallback)"}
                  </div>
                  {transferEvidence && (
                    <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                      Source: {transferEvidence}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                  <div className="text-[10px] uppercase text-slate-400">
                    Party & Shortlist Live Status
                  </div>
                  <div className="font-semibold text-white mt-0.5">
                    {opt.partyCompositionApplied.paxMix
                      .map((p) => `${p.numberOfTravelers}x ${p.ageBand}`)
                      .join(", ")}
                  </div>
                  <div className="text-[11px] text-cyan-300 mt-0.5">
                    {opt.shortlistLiveCheck.note}
                  </div>
                </div>
              </div>

              {/* Explanations & Explicit Unknown Warnings */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {opt.explanations.map((exp, idx) => (
                    <li key={idx}>{exp}</li>
                  ))}
                </ul>

                {opt.missingInformation.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {opt.missingInformation.map((m) => (
                      <span
                        key={m}
                        className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-mono text-amber-300"
                      >
                        missing: {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
