"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  HOTEL_CONCIERGE_CONFIGS,
  type HotelConciergePropertyConfig,
} from "@/lib/dcc/catalog/hotelConfigs";
import type { MatchedTourOption, TripMatchResponse } from "@/lib/dcc/catalog/matcher";

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
  embedMode?: boolean;
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

function formatPrice(cents: number | null, currency = "USD"): string {
  if (cents === null || !Number.isFinite(cents)) return "Price on request / check live";
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  }).format(dollars);
}

export default function DccConciergeWidget({
  initialDestination = "new-orleans",
  initialPropertySlug = "hotel-monteleone-nola",
  initialSurface = "hotel_concierge",
  embedMode = false,
}: DccConciergeWidgetProps) {
  const defaultHotel =
    HOTEL_CONCIERGE_CONFIGS[initialPropertySlug] || HOTEL_CONCIERGE_CONFIGS["hotel-monteleone-nola"];

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
  const [showHotelConfigPanel, setShowHotelConfigPanel] = useState<boolean>(embedMode);

  // Guest trip constraints
  const [date, setDate] = useState<string>("2026-11-18");
  const [adults, setAdults] = useState<number>(2);
  const [childAgesText, setChildAgesText] = useState<string>("7, 11");
  const [requiresHotelPickup, setRequiresHotelPickup] = useState<boolean>(
    defaultHotel.defaultRequiresHotelPickup,
  );
  const [shipArrival, setShipArrival] = useState<string>("");
  const [allAboardTime, setAllAboardTime] = useState<string>("");
  const [maxWeightLbs, setMaxWeightLbs] = useState<string>("");
  const [requiresWheelchair, setRequiresWheelchair] = useState<boolean>(false);
  const [enableShortlistLiveCheck, setEnableShortlistLiveCheck] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<TripMatchResponse | null>(null);

  const handleSelectPresetHotel = (slug: string) => {
    const preset: HotelConciergePropertyConfig | undefined = HOTEL_CONCIERGE_CONFIGS[slug];
    if (!preset) return;
    setPropertySlug(preset.propertySlug);
    setPropertyName(preset.propertyName);
    setDestination(preset.destinationSlug);
    setHotelLat(String(preset.lat));
    setHotelLng(String(preset.lng));
    setRequiresHotelPickup(preset.defaultRequiresHotelPickup);
    setApprovedTourIds(preset.approvedTourIds);
  };

  const toggleApprovedTourId = (tourId: string) => {
    setApprovedTourIds((prev) =>
      prev.includes(tourId) ? prev.filter((id) => id !== tourId) : [...prev, tourId],
    );
  };

  const runTripMatch = useCallback(async () => {
    setLoading(true);
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
        date: date.trim() || undefined,
        adults,
        childAges,
        requiresHotelPickup,
        hotelName: propertyName,
        hotelLat: Number.isFinite(latNum) ? latNum : undefined,
        hotelLng: Number.isFinite(lngNum) ? lngNum : undefined,
        approvedTourIds:
          filterToApprovedOnly && approvedTourIds.length > 0 ? approvedTourIds : undefined,
        shipArrival: shipArrival.trim() || undefined,
        allAboardTime: allAboardTime.trim() || undefined,
        maxPassengerWeightLbs: weightNum && Number.isFinite(weightNum) ? weightNum : undefined,
        requiresWheelchair,
        surface,
        propertySlug: surface === "hotel_concierge" ? propertySlug : undefined,
        enableShortlistLiveCheck,
        shortlistMaxCount: 3,
      };

      const res = await fetch("/api/v1/tours/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setMatchResult(data as TripMatchResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run trip matching");
    } finally {
      setLoading(false);
    }
  }, [
    destination,
    date,
    adults,
    childAgesText,
    requiresHotelPickup,
    propertyName,
    hotelLat,
    hotelLng,
    filterToApprovedOnly,
    approvedTourIds,
    shipArrival,
    allAboardTime,
    maxWeightLbs,
    requiresWheelchair,
    surface,
    propertySlug,
    enableShortlistLiveCheck,
  ]);

  useEffect(() => {
    void runTripMatch();
  }, [runTripMatch]);

  const allOptionsForHotelToggle: MatchedTourOption[] = matchResult
    ? [...matchResult.options, ...matchResult.ineligibleOptions]
    : [];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/95 text-slate-100 shadow-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Destination / Cruise Port
            </label>
            <select
              aria-label="Destination or Cruise Port"
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
              aria-label="Travel Date"
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
              value={adults}
              onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Children&apos;s Ages (comma-sep)
            </label>
            <input
              type="text"
              placeholder="e.g. 5, 9"
              aria-label="Children's Ages"
              value={childAgesText}
              onChange={(e) => setChildAgesText(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void runTripMatch()}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-4 py-2 text-xs font-bold text-slate-950 transition"
            >
              {loading ? "Matching Tours…" : "Match Tours & Check"}
            </button>
          </div>
        </div>

        {/* Secondary Constraints Row */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresHotelPickup}
              onChange={(e) => setRequiresHotelPickup(e.target.checked)}
              className="rounded border-slate-700"
            />
            Require Hotel / Shuttle Pickup
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-cyan-300 cursor-pointer">
            <input
              type="checkbox"
              checked={enableShortlistLiveCheck}
              onChange={(e) => setEnableShortlistLiveCheck(e.target.checked)}
              className="rounded border-slate-700"
            />
            Check Live Availability for Top Shortlist
          </label>

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
        <div className="m-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Matched Options List */}
      <div className="p-6 space-y-4">
        {matchResult?.options.map((opt) => (
          <div
            key={opt.tourId}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 hover:border-slate-700 transition"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                      opt.suitability === "recommended"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {opt.suitability === "recommended" ? "Recommended Match" : "Needs Confirmation"} (Score{" "}
                    {opt.matchScore})
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
                {opt.summary && <p className="text-xs text-slate-300 leading-relaxed">{opt.summary}</p>}
              </div>

              <div className="text-right">
                <div className="text-lg font-extrabold text-emerald-400">
                  {formatPrice(opt.pricing.fromPriceCents, opt.pricing.currency)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Channel: <span className="font-mono text-slate-200">{opt.pricing.selectedChannelId}</span>
                </div>
                <div className="mt-2">
                  <a
                    href={opt.bookingPath.handoffUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 transition"
                  >
                    {opt.capabilityTier === "discovery_only"
                      ? "Visit Operator Site ↗"
                      : "Book / Continue via Tracked Path ↗"}
                  </a>
                </div>
                {opt.bookingPath.clickId && (
                  <div className="mt-1 text-[10px] font-mono text-slate-400">
                    Trace ID: {opt.bookingPath.clickId}
                  </div>
                )}
              </div>
            </div>

            {/* Key Facts Row with Explicit Unknown Preservation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
              <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                <div className="text-[10px] uppercase text-slate-400">Duration</div>
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
                <div className="text-[10px] uppercase text-slate-400">Pickup & Meeting Coordinates</div>
                <div className="font-semibold text-white mt-0.5">
                  {opt.pickupAndLocation.hasHotelPickup === true
                    ? "Hotel / Shuttle Pickup Offered"
                    : opt.pickupAndLocation.hasHotelPickup === false
                      ? "Meeting Point Only"
                      : "Pickup Coverage Unknown"}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {opt.pickupAndLocation.locationPrecision === "exact" &&
                  opt.pickupAndLocation.meetingPointLat !== null
                    ? `Coords: ${opt.pickupAndLocation.meetingPointLat.toFixed(4)}, ${opt.pickupAndLocation.meetingPointLng?.toFixed(4)}${opt.pickupAndLocation.distanceFromGuestKm !== null ? ` (${opt.pickupAndLocation.distanceFromGuestKm} km)` : ""}`
                    : "Coordinates: Explicit Unknown (No fake city-center fallback)"}
                </div>
              </div>

              <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                <div className="text-[10px] uppercase text-slate-400">Party & Shortlist Live Status</div>
                <div className="font-semibold text-white mt-0.5">
                  {opt.partyCompositionApplied.paxMix
                    .map((p) => `${p.numberOfTravelers}x ${p.ageBand}`)
                    .join(", ")}
                </div>
                <div className="text-[11px] text-cyan-300 mt-0.5">{opt.shortlistLiveCheck.note}</div>
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

            {/* Distinct Channel-Specific Offers */}
            {opt.channelOffers.length > 1 && (
              <div className="pt-2 border-t border-slate-800/60">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                  Distinct Channel Offers Preserved on Underlying Tour Identity:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {opt.channelOffers.map((co, idx) => (
                    <div
                      key={`${co.channelId}-${idx}`}
                      className="rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span>{co.channelId}</span>
                        <span className="text-emerald-400">
                          {formatPrice(co.fromPriceCents, co.currency)}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        Provider: <span className="font-mono">{co.provider}</span> ({co.capabilityTier})
                      </div>
                      <div className="text-slate-400">
                        Cancel:{" "}
                        {co.freeCancellation === true
                          ? `Free (${co.cancellationCutoffHours || 24}h)`
                          : co.freeCancellation === false
                            ? `Strict (${co.cancellationCutoffHours || 0}h)`
                            : "Unknown"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
