"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  buildRedRocksStayingPlace,
  evaluateRedRocksRidePlan,
  RED_ROCKS_MIKE_NOV_14_SHOW,
  RED_ROCKS_STAYING_PRESETS,
  resolveRedRocksShow,
  trackRedRocksProviderClick,
  trackRedRocksRideComparison,
  type RedRocksStayingPlace,
} from "@/lib/dcc/redRocksRidePlanner";

interface LocationSearchCandidate {
  id: string;
  name: string;
  displayName: string;
  city: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
}

export function RedRocksConcertRidePlanner() {
  const searchParams = useSearchParams();

  const initialShow = useMemo(() => {
    return resolveRedRocksShow({
      artist: searchParams?.get("artist"),
      date: searchParams?.get("date"),
      event: searchParams?.get("event"),
      doors: searchParams?.get("doors"),
      showtime: searchParams?.get("showtime"),
    });
  }, [searchParams]);

  const initialPartySize = useMemo(() => {
    const raw =
      searchParams?.get("partySize") ||
      searchParams?.get("guests") ||
      searchParams?.get("party_size");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 20
      ? Math.round(parsed)
      : 6;
  }, [searchParams]);

  const initialStaying = useMemo<RedRocksStayingPlace>(() => {
    const stayingQuery = searchParams?.get("staying")?.trim().toLowerCase();
    if (stayingQuery) {
      const matched = RED_ROCKS_STAYING_PRESETS.find(
        (p) =>
          p.name.toLowerCase().includes(stayingQuery) ||
          p.city.toLowerCase().includes(stayingQuery),
      );
      if (matched) {
        return buildRedRocksStayingPlace({ ...matched, source: "preset" });
      }
    }
    return buildRedRocksStayingPlace({
      ...RED_ROCKS_STAYING_PRESETS[0],
      source: "preset",
    });
  }, [searchParams]);

  const [selectedShow, setSelectedShow] = useState(initialShow);
  const [staying, setStaying] = useState<RedRocksStayingPlace>(initialStaying);
  const [partySize, setPartySize] = useState<number>(initialPartySize);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchCandidate[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastTrackedEventLabel, setLastTrackedEventLabel] = useState<
    string | null
  >(null);

  useEffect(() => {
    setSelectedShow(initialShow);
  }, [initialShow]);

  useEffect(() => {
    setPartySize(initialPartySize);
  }, [initialPartySize]);

  const plan = useMemo(() => {
    return evaluateRedRocksRidePlan({
      show: selectedShow,
      staying,
      partySize,
    });
  }, [selectedShow, staying, partySize]);

  // Track ride comparison as a separate event whenever show, staying place, or party size changes
  useEffect(() => {
    const evt = trackRedRocksRideComparison(plan);
    setLastTrackedEventLabel(
      `red_rocks_ride_comparison (${evt.artist} · ${evt.date} · ${evt.partySize} going · ${evt.recommendedVehicle === "suburban" ? "$399 Suburban" : "$599 Van"})`,
    );
  }, [plan]);

  async function handleLocationSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/public/location-resolve?q=${encodeURIComponent(q)}&bias=denver`,
      );
      const data = await res.json();
      if (!res.ok || !data?.ok || !Array.isArray(data.results)) {
        setSearchError("Could not resolve that location. Try a Denver/Golden hotel, neighborhood, or ZIP code.");
        setSearchResults([]);
      } else if (data.results.length === 0) {
        setSearchError("No matching places found. Try a hotel name, street address, or Denver/Golden ZIP code.");
        setSearchResults([]);
      } else {
        setSearchResults(data.results);
        const first = data.results[0];
        if (typeof first.lat === "number" && typeof first.lng === "number") {
          setStaying(
            buildRedRocksStayingPlace({
              id: first.id,
              name: first.name || q,
              displayName: first.displayName || first.name || q,
              city: first.city,
              region: first.region,
              lat: first.lat,
              lng: first.lng,
              source: "search",
            }),
          );
        }
      }
    } catch {
      setSearchError("Location lookup unavailable right now. Choose a staying area preset below.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleUseGpsLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setSearchError("Device location is not supported in this browser.");
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(
            `/api/public/location-resolve?lat=${lat}&lng=${lng}&bias=denver`,
          );
          const data = await res.json();
          const first = data?.results?.[0];
          setStaying(
            buildRedRocksStayingPlace({
              id: first?.id || `gps-${lat.toFixed(4)}-${lng.toFixed(4)}`,
              name: first?.name || "Current GPS Location",
              displayName:
                first?.displayName ||
                `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              city: first?.city || null,
              region: first?.region || "Colorado",
              lat,
              lng,
              source: "gps",
            }),
          );
        } catch {
          setStaying(
            buildRedRocksStayingPlace({
              name: "Current GPS Location",
              displayName: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              lat,
              lng,
              source: "gps",
            }),
          );
        } finally {
          setIsSearching(false);
        }
      },
      () => {
        setIsSearching(false);
        setSearchError(
          "Location permission was declined. Search your hotel, neighborhood, or ZIP code instead.",
        );
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  function handleProviderClick(
    surface: "private_overview" | "direct_vehicle_option",
  ) {
    const evt = trackRedRocksProviderClick(plan, surface);
    setLastTrackedEventLabel(
      `red_rocks_provider_click → ${surface} (${evt.artist} · ${evt.date} · ${evt.partySize} going · $${evt.publishedPriceUsd})`,
    );
  }

  return (
    <section
      id="ride-planner"
      aria-label="Red Rocks Concert Ride Comparison and Planner"
      className="mx-auto max-w-5xl px-4 pt-6 pb-2 sm:px-6"
    >
      <div className="rounded-2xl border border-amber-300 bg-white p-5 shadow-sm sm:p-6">
        {/* Top Bar: Selected Show + Official Venue Time vs. Pickup Time Separation */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                Red Rocks Concert Ride Planner
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                Selected Show Pre-Filled
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
              {plan.show.artist}{" "}
              {plan.show.supportActs ? (
                <span className="text-base font-normal text-slate-600">
                  {plan.show.supportActs}
                </span>
              ) : null}
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-semibold">{plan.show.dateDisplay}</span> ·
              Red Rocks Amphitheatre (Morrison, CO · 6,450 ft) ·{" "}
              <a
                href={plan.show.officialEventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sky-700 underline hover:text-sky-900"
              >
                Official Venue Event Listing ↗
              </a>
            </p>
          </div>

          {/* Separate Venue Show Time vs. Operator Pickup Time Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 lg:max-w-md">
            <div className="font-semibold text-slate-900">
              Show Time &amp; Pickup Time Are Separate
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 bg-white p-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Official Venue Time
                </div>
                <div className="mt-0.5 text-sm font-bold text-slate-900">
                  Doors {plan.show.venueDoorsDisplay} · Show{" "}
                  {plan.show.venueShowtimeDisplay}
                </div>
                {plan.show.parrListingTimeDisplay ? (
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    (PARR listing shows {plan.show.parrListingTimeDisplay}; DCC
                    uses official venue time)
                  </div>
                ) : null}
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-amber-900">
                  Operator Pickup Time
                </div>
                <div className="mt-0.5 text-xs font-semibold text-slate-900">
                  Separate from showtime
                </div>
                <div className="mt-0.5 text-[11px] text-slate-700">
                  Get any pickup deadline from operator (
                  {plan.handoff.operatorContact.phone})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inputs: 1. Where is the group staying? 2. How many are going? */}
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          {/* Where is the group staying? */}
          <div className="lg:col-span-7">
            <label
              htmlFor="rr-staying-input"
              className="block text-sm font-semibold text-slate-900"
            >
              1. Where is your group staying?
            </label>
            <p className="mt-0.5 text-xs text-slate-600">
              Search a Denver/Golden hotel, neighborhood, address, or ZIP code,
              or use your current location.
            </p>

            <form
              onSubmit={handleLocationSearch}
              className="mt-2 flex flex-wrap gap-2"
            >
              <input
                id="rr-staying-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Sheraton Denver Downtown, RiNo, Golden, or 80202"
                className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {isSearching ? "Finding…" : "Find Place"}
              </button>
              <button
                type="button"
                onClick={handleUseGpsLocation}
                disabled={isSearching}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Use GPS
              </button>
            </form>

            {searchError ? (
              <p className="mt-1.5 text-xs text-rose-700">{searchError}</p>
            ) : null}

            {searchResults.length > 1 ? (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Matches near Denver / Red Rocks:
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {searchResults.slice(0, 5).map((cand) => (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => {
                        if (
                          typeof cand.lat === "number" &&
                          typeof cand.lng === "number"
                        ) {
                          setStaying(
                            buildRedRocksStayingPlace({
                              id: cand.id,
                              name: cand.name,
                              displayName: cand.displayName,
                              city: cand.city,
                              region: cand.region,
                              lat: cand.lat,
                              lng: cand.lng,
                              source: "search",
                            }),
                          );
                        }
                      }}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-left text-xs text-slate-800 hover:border-sky-500 hover:bg-sky-50"
                    >
                      {cand.name}
                      {cand.city ? ` (${cand.city})` : ""}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Quick staying area presets */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                Quick areas:
              </span>
              {RED_ROCKS_STAYING_PRESETS.map((preset) => {
                const isSelected = staying.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      setStaying(
                        buildRedRocksStayingPlace({
                          ...preset,
                          source: "preset",
                        }),
                      )
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      isSelected
                        ? "bg-sky-700 text-white"
                        : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">
                Selected staying location:
              </span>{" "}
              {staying.displayName} ·{" "}
              <span className="font-medium text-slate-900">
                {staying.straightLineDistanceLabel}
              </span>{" "}
              · {staying.estimatedPreShowDriveMinutes.label}
            </div>
          </div>

          {/* How many are going? */}
          <div className="lg:col-span-5">
            <label
              htmlFor="rr-party-size-select"
              className="block text-sm font-semibold text-slate-900"
            >
              2. How many are going?
            </label>
            <p className="mt-0.5 text-xs text-slate-600">
              Party at Red Rocks publishes $399 for a Suburban up to 6 and $599
              for a van up to 10, subject to availability.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPartySize(6)}
                data-testid="party-size-6-btn"
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  partySize === 6
                    ? "bg-sky-700 text-white shadow-sm"
                    : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                Group of 6 ($399 Suburban)
              </button>
              <button
                type="button"
                onClick={() => setPartySize(8)}
                data-testid="party-size-8-btn"
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  partySize === 8
                    ? "bg-sky-700 text-white shadow-sm"
                    : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                Group of 8 ($599 Van)
              </button>
              <select
                id="rr-party-size-select"
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14].map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? "person" : "people"} going
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-xs text-slate-800">
              <div className="font-semibold text-slate-900">
                Group of {partySize} Vehicle Fit:
              </div>
              <p className="mt-1">{plan.parrRecommendation.summary}</p>
            </div>
          </div>
        </div>

        {/* 3-Way Ride Comparison Cards: Parking vs. Rideshare vs. Party at Red Rocks Private Tailgate & Ride */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">
              3. Compare Parking, Rideshare &amp; Party at Red Rocks’ Private
              Tailgate and Ride
            </h3>
            <span className="text-xs text-slate-500">
              General post-show pickup: Jurassic Lot by Entrance 2 · Overnight
              vehicles: move before 10:00 a.m. next day
            </span>
          </div>

          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {plan.comparisonCards.map((card) => {
              const isParr = card.modeId === "parr_private";
              return (
                <article
                  key={card.modeId}
                  data-testid={`ride-card-${card.modeId}`}
                  className={`flex flex-col justify-between rounded-xl border p-4 ${
                    isParr
                      ? "border-sky-600 bg-sky-50/40 shadow-sm"
                      : "border-slate-200 bg-slate-50/60"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isParr
                            ? "bg-sky-700 text-white"
                            : "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {card.badge}
                      </span>
                    </div>

                    <h4 className="mt-2 text-base font-bold text-slate-900">
                      {card.title}
                    </h4>

                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-slate-900">
                        {card.priceHeadline}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-600">
                      {card.perPersonLabel}
                    </div>

                    <p className="mt-2.5 rounded-lg border border-slate-200/80 bg-white p-2.5 text-xs text-slate-800">
                      <span className="font-semibold">Group fit:</span>{" "}
                      {card.groupFitSummary}
                    </p>

                    <div className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                      <div>
                        <span className="font-semibold text-slate-900">
                          Show vs. pickup timing:
                        </span>{" "}
                        {card.showTimeVsPickupNote}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">
                          Post-show pickup / exit:
                        </span>{" "}
                        {card.postShowPickupSummary}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">
                          Rule &amp; logistics:
                        </span>{" "}
                        {card.overnightOrLotRule}
                      </div>
                    </div>

                    <ul className="mt-3 space-y-1 border-t border-slate-200 pt-2.5 text-xs text-slate-700">
                      {card.bullets.map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 space-y-2 pt-2">
                    <a
                      href={card.ctaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`cta-${card.modeId}`}
                      onClick={() => {
                        if (card.isExternalProviderHandoff) {
                          handleProviderClick("private_overview");
                        }
                      }}
                      className={`inline-flex w-full items-center justify-center rounded-lg px-3.5 py-2.5 text-center text-xs font-bold transition ${
                        isParr
                          ? "bg-sky-700 text-white hover:bg-sky-800"
                          : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {card.ctaLabel}
                    </a>

                    {card.secondaryCtaHref && card.secondaryCtaLabel ? (
                      <a
                        href={card.secondaryCtaHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`cta-secondary-${card.modeId}`}
                        onClick={() => {
                          if (card.isExternalProviderHandoff) {
                            handleProviderClick("direct_vehicle_option");
                          }
                        }}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-sky-300 bg-white px-3 py-2 text-center text-xs font-semibold text-sky-900 hover:bg-sky-50"
                      >
                        {card.secondaryCtaLabel}
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Handoff Verification Summary (What Populates on Arrival at Party at Red Rocks) */}
        <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
          <summary className="cursor-pointer font-semibold text-slate-900">
            Handoff Verification for Group of {partySize} (What populates on
            arrival at Party at Red Rocks + Separate Event Tracking)
          </summary>
          <div className="mt-3 space-y-2">
            <p>
              <span className="font-semibold text-slate-900">
                Tracked Provider Link (Private Overview):
              </span>{" "}
              <code className="break-all rounded bg-white px-1.5 py-0.5 text-[11px] text-slate-800">
                {plan.handoff.privateOverviewUrl}
              </code>
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                Direct Vehicle Link (
                {plan.parrRecommendation.vehicleType === "suburban"
                  ? "Suburban $399 up to 6"
                  : "Van $599 up to 10"}
                ):
              </span>{" "}
              <code className="break-all rounded bg-white px-1.5 py-0.5 text-[11px] text-slate-800">
                {plan.handoff.directVehicleOptionUrl}
              </code>
            </p>
            <div className="overflow-x-auto pt-1">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-1.5 pr-3 font-semibold">Field</th>
                    <th className="py-1.5 pr-3 font-semibold">Value Sent</th>
                    <th className="py-1.5 pr-3 font-semibold">
                      Populates on Arrival?
                    </th>
                    <th className="py-1.5 font-semibold">
                      Verified Behavior on partyatredrocks.com
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {plan.handoff.fieldsAudit.map((row) => (
                    <tr key={row.field}>
                      <td className="py-1.5 pr-3 font-medium text-slate-900">
                        {row.field}
                      </td>
                      <td className="py-1.5 pr-3 font-mono text-[11px] text-slate-800">
                        {row.valueSent}
                      </td>
                      <td className="py-1.5 pr-3">
                        {row.populatesOnArrival ? (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-900">
                            Yes (Populates)
                          </span>
                        ) : (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                            Entered in Checkout
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 text-slate-700">
                        {row.behaviorOnPartyAtRedRocks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lastTrackedEventLabel ? (
              <p className="pt-1 text-[11px] text-slate-500">
                Latest tracked telemetry event:{" "}
                <code className="font-mono text-slate-700">
                  {lastTrackedEventLabel}
                </code>
              </p>
            ) : null}
          </div>
        </details>
      </div>
    </section>
  );
}
