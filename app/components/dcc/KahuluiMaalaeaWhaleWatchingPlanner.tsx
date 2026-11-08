"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW,
  evaluateKahuluiMaalaeaPortDay,
  type KahuluiMaalaeaTripEvaluation,
} from "@/lib/dcc/decisionEngines/hawaiiWhaleWatchingEngine";

export interface KahuluiMaalaeaWhaleWatchingPlannerProps {
  initialScenarioFilter?: "all" | "fits" | "runs_too_late" | "missing_operator_info";
  initialShipArrivalTime?: string;
  initialShipAllAboardTime?: string;
  initialShipDepartureTime?: string;
  contextSurface?: "kahului_port_page" | "hawaii_whale_engine";
}

function renderAllAboardFitBadge(trip: KahuluiMaalaeaTripEvaluation) {
  const { status, verdictBadgeLabel } = trip.allAboardFit;
  if (status === "fits_all_aboard") {
    return (
      <span
        data-testid={`all-aboard-fit-badge-${trip.tripId}`}
        data-fit-status="fits_all_aboard"
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200"
      >
        <span>✓</span>
        <span>{verdictBadgeLabel}</span>
      </span>
    );
  }
  if (status === "runs_too_late") {
    return (
      <span
        data-testid={`all-aboard-fit-badge-${trip.tripId}`}
        data-fit-status="runs_too_late"
        className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/50 bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-200"
      >
        <span>✕</span>
        <span>{verdictBadgeLabel}</span>
      </span>
    );
  }
  return (
    <span
      data-testid={`all-aboard-fit-badge-${trip.tripId}`}
      data-fit-status="needs_verification"
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-200"
    >
      <span>⚠</span>
      <span>{verdictBadgeLabel}</span>
    </span>
  );
}

function renderSeatAvailabilityBadge(trip: KahuluiMaalaeaTripEvaluation) {
  const { status, badgeLabel } = trip.seatAvailability;
  if (status === "live_seats_verified") {
    return (
      <span
        data-testid={`seat-availability-badge-${trip.tripId}`}
        data-seat-status="live_seats_verified"
        className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/50 bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-200"
      >
        <span>🎟</span>
        <span>{badgeLabel}</span>
      </span>
    );
  }
  if (status === "check_live_seats_on_fareharbor") {
    return (
      <span
        data-testid={`seat-availability-badge-${trip.tripId}`}
        data-seat-status="check_live_seats_on_fareharbor"
        className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/50 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-200"
      >
        <span>🎟</span>
        <span>{badgeLabel}</span>
      </span>
    );
  }
  return (
    <span
      data-testid={`seat-availability-badge-${trip.tripId}`}
      data-seat-status="unverified_operator_inventory"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/40 bg-slate-700/50 px-3 py-1 text-xs font-semibold text-slate-200"
    >
      <span>🎟</span>
      <span>{badgeLabel}</span>
    </span>
  );
}

export default function KahuluiMaalaeaWhaleWatchingPlanner({
  initialScenarioFilter = "all",
  initialShipArrivalTime = KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW.shipArrivalTime,
  initialShipAllAboardTime = KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW.shipAllAboardTime,
  initialShipDepartureTime = KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW.shipDepartureTime,
  contextSurface = "kahului_port_page",
}: KahuluiMaalaeaWhaleWatchingPlannerProps) {
  const [scenarioFilter, setScenarioFilter] = useState<
    "all" | "fits" | "runs_too_late" | "missing_operator_info"
  >(initialScenarioFilter);
  const [shipArrivalTime, setShipArrivalTime] = useState(initialShipArrivalTime);
  const [shipAllAboardTime, setShipAllAboardTime] = useState(
    initialShipAllAboardTime,
  );
  const [shipDepartureTime, setShipDepartureTime] = useState(
    initialShipDepartureTime,
  );
  const [cruiseReturnBufferMinutes, setCruiseReturnBufferMinutes] = useState(
    KAHULUI_MAALAEA_DEFAULT_SAILING_WINDOW.cruiseReturnBufferMinutes,
  );

  const comparison = useMemo(
    () =>
      evaluateKahuluiMaalaeaPortDay({
        shipArrivalTime,
        shipAllAboardTime,
        shipDepartureTime,
        cruiseReturnBufferMinutes,
      }),
    [
      shipArrivalTime,
      shipAllAboardTime,
      shipDepartureTime,
      cruiseReturnBufferMinutes,
    ],
  );

  const visibleTrips = useMemo(() => {
    if (scenarioFilter === "all") return comparison.trips;
    return comparison.trips.filter((t) => t.scenarioRole === scenarioFilter);
  }, [comparison.trips, scenarioFilter]);

  return (
    <section
      id="kahului-maalaea-whale-watching"
      data-testid="kahului-maalaea-whale-watching-planner"
      className="space-y-6 rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 text-zinc-100 shadow-xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-200">
              Maui Port-Day Verification · Kahului Harbor (OGG) → Maʻalaea Harbor
            </span>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
              Reuses DCC Hawaiʻi Whale-Watching Engine (hi-whale-maui-pacwhale-catamaran)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Kahului Harbor → Maʻalaea Whale Watching All-Aboard &amp; Logistics Checker
          </h2>
          <p className="max-w-3xl text-sm text-zinc-300">
            Verifies real Maʻalaea Harbor departures, check-in location (
            <strong>
              PacWhale Ocean Store, Maʻalaea Harbor Shops, 300 Maʻalaea Rd
            </strong>
            ), <strong>45-minute check-in cutoff</strong>, and{" "}
            <strong>
              25-minute each-way / 50-minute round-trip ground transfer
            </strong>{" "}
            (+5m pier gate clearance each way) against your ship’s all-aboard time at Kahului Harbor.{" "}
            <strong>
              All-aboard schedule fit and live seat availability are evaluated and displayed separately.
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {contextSurface === "kahului_port_page" ? (
            <Link
              href="/hawaii/whale-watching"
              className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 font-semibold text-cyan-200 hover:bg-cyan-500/25"
            >
              Open Full Hawaiʻi Whale-Watching Engine →
            </Link>
          ) : (
            <Link
              href="/ports/kahului"
              className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 font-semibold text-cyan-200 hover:bg-cyan-500/25"
            >
              Open Kahului Cruise Port Page (/ports/kahului) →
            </Link>
          )}
          <a
            href="/go/dcc-to-cruise-promenade?port=kahului&party_size=2"
            data-testid="kahului-plan-with-my-group-cta"
            className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 font-semibold text-emerald-200 hover:bg-emerald-500/25"
          >
            Plan with my group →
          </a>
        </div>
      </div>

      {/* Sailing Window & Scenario Filter Controls */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-slate-950/70 p-4 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-7">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Kahului Harbor Ship Schedule Window (Pier 1 / Pier 2)
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="space-y-1 text-xs text-zinc-300">
              <span>Ship Arrival</span>
              <input
                type="time"
                aria-label="Ship Arrival Time"
                value={shipArrivalTime}
                onChange={(e) => setShipArrivalTime(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-2.5 py-1.5 text-sm font-semibold text-white"
              />
            </label>
            <label className="space-y-1 text-xs text-zinc-300">
              <span>Ship All-Aboard</span>
              <input
                type="time"
                aria-label="Ship All-Aboard Time"
                value={shipAllAboardTime}
                onChange={(e) => setShipAllAboardTime(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-2.5 py-1.5 text-sm font-semibold text-white"
              />
            </label>
            <label className="space-y-1 text-xs text-zinc-300">
              <span>Ship Departure</span>
              <input
                type="time"
                aria-label="Ship Departure Time"
                value={shipDepartureTime}
                onChange={(e) => setShipDepartureTime(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-2.5 py-1.5 text-sm font-semibold text-white"
              />
            </label>
            <label className="space-y-1 text-xs text-zinc-300">
              <span>Return Buffer (min)</span>
              <input
                type="number"
                aria-label="Cruise Return Buffer Minutes"
                min={30}
                max={120}
                step={15}
                value={cruiseReturnBufferMinutes}
                onChange={(e) =>
                  setCruiseReturnBufferMinutes(
                    Math.max(30, Number(e.target.value) || 60),
                  )
                }
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-2.5 py-1.5 text-sm font-semibold text-white"
              />
            </label>
          </div>
        </div>

        <div className="space-y-2 lg:col-span-5">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Filter Verified Scenarios
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setScenarioFilter("all")}
              data-testid="filter-scenario-all"
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                scenarioFilter === "all"
                  ? "border-cyan-400 bg-cyan-500/25 text-white"
                  : "border-white/15 bg-slate-900 text-zinc-300 hover:bg-slate-800"
              }`}
            >
              All 3 Scenarios ({comparison.summaryCounts.totalEvaluated})
            </button>
            <button
              type="button"
              onClick={() => setScenarioFilter("fits")}
              data-testid="filter-scenario-fits"
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                scenarioFilter === "fits"
                  ? "border-emerald-400 bg-emerald-500/25 text-emerald-100"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
              }`}
            >
              1. Fits ({comparison.summaryCounts.fitsCount})
            </button>
            <button
              type="button"
              onClick={() => setScenarioFilter("runs_too_late")}
              data-testid="filter-scenario-runs-too-late"
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                scenarioFilter === "runs_too_late"
                  ? "border-rose-400 bg-rose-500/25 text-rose-100"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
              }`}
            >
              2. Runs Too Late ({comparison.summaryCounts.runsTooLateCount})
            </button>
            <button
              type="button"
              onClick={() => setScenarioFilter("missing_operator_info")}
              data-testid="filter-scenario-missing-info"
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                scenarioFilter === "missing_operator_info"
                  ? "border-amber-400 bg-amber-500/25 text-amber-100"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
              }`}
            >
              3. Missing Info ({comparison.summaryCounts.needsVerificationCount})
            </button>
          </div>
        </div>
      </div>

      {/* Trip Cards */}
      <div className="space-y-4">
        {visibleTrips.map((trip) => {
          const tl = trip.allAboardFit.timeline;
          const log = trip.verifiedLogistics;
          return (
            <article
              key={trip.tripId}
              data-testid={`kahului-maalaea-trip-card-${trip.tripId}`}
              data-scenario-role={trip.scenarioRole}
              data-all-aboard-status={trip.allAboardFit.status}
              data-seat-status={trip.seatAvailability.status}
              className="space-y-4 rounded-xl border border-white/15 bg-slate-950/85 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300">
                    <span className="font-bold uppercase tracking-wider">
                      Scenario:{" "}
                      {trip.scenarioRole === "fits"
                        ? "1 · Trip That Fits All-Aboard"
                        : trip.scenarioRole === "runs_too_late"
                          ? "2 · Trip That Runs Too Late"
                          : "3 · Missing Operator Information"}
                    </span>
                    {trip.fareHarborItemId ? (
                      <span className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                        FareHarbor Item #{trip.fareHarborItemId}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {trip.productTitle}
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Operator: <strong>{trip.operatorName}</strong> ·{" "}
                    {trip.publishedPriceNote}
                  </p>
                </div>

                {/* Two Strictly Separate Status Badges: All-Aboard Fit vs Seat Availability */}
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  {renderAllAboardFitBadge(trip)}
                  {renderSeatAvailabilityBadge(trip)}
                </div>
              </div>

              {/* Verified 4-Point Maʻalaea Logistics Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-xs">
                  <div className="font-bold uppercase tracking-wider text-cyan-300">
                    1. Maʻalaea Departure
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {log.maalaeaDepartureDisplay}
                  </div>
                  <div className="mt-0.5 text-zinc-300">
                    {log.activityDurationMinutes
                      ? `${log.activityDurationMinutes} min (2.0 hrs) on water · Returns ${tl.maalaeaDockReturnDisplay}`
                      : "Duration unconfirmed"}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-xs">
                  <div className="font-bold uppercase tracking-wider text-cyan-300">
                    2. Pickup / Meeting Point
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {log.meetingPointConfirmed
                      ? "PacWhale Ocean Store (300 Maʻalaea Rd)"
                      : "Missing / Unconfirmed Slip"}
                  </div>
                  <div className="mt-0.5 text-zinc-300">
                    {log.pickupOrMeetingPoint}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-xs">
                  <div className="font-bold uppercase tracking-wider text-cyan-300">
                    3. Check-In Cutoff
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {log.checkInCutoffDisplay}
                  </div>
                  <div className="mt-0.5 text-zinc-300">
                    {log.checkInLeadMinutes !== null
                      ? `Mandatory check-in inside Ocean Store before crew slip escort`
                      : "Operator check-in lead time not disclosed"}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-3 text-xs">
                  <div className="font-bold uppercase tracking-wider text-cyan-300">
                    4. Round-Trip Transfer
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {log.roadTransferEachWayMinutes !== null &&
                    log.roadTransferRoundTripMinutes !== null
                      ? `${log.roadTransferEachWayMinutes}m each way (${log.roadTransferRoundTripMinutes}m RT)`
                      : "Unverified transfer"}
                  </div>
                  <div className="mt-0.5 text-zinc-300">
                    {log.effectiveTransferEachWayMinutes !== null &&
                    log.effectiveTransferRoundTripMinutes !== null
                      ? `Kahului Pier ↔ Maʻalaea via Hwy 380/30 (${log.effectiveTransferEachWayMinutes}m each way / ${log.effectiveTransferRoundTripMinutes}m RT incl. ${log.pierGateAllowanceEachWayMinutes}m pier gate)`
                      : "Kahului Harbor ↔ Maʻalaea transfer window not confirmed"}
                  </div>
                </div>
              </div>

              {/* Separate All-Aboard Fit vs Seat Availability Comparison Box */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div
                  data-testid={`all-aboard-fit-panel-${trip.tripId}`}
                  className="rounded-lg border border-white/10 bg-slate-900/60 p-3.5 text-xs space-y-1.5"
                >
                  <div className="font-bold uppercase tracking-wider text-emerald-300">
                    All-Aboard Schedule Fit Check
                  </div>
                  <p className="text-zinc-200 leading-relaxed">
                    {trip.allAboardFit.summary}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-zinc-300">
                    <span>
                      Ship Arrival: <strong>{tl.shipArrivalDisplay}</strong> (Exit{" "}
                      {tl.earliestPierExitDisplay})
                    </span>
                    <span>·</span>
                    <span>
                      Leave Kahului Pier:{" "}
                      <strong>{tl.latestLeaveKahuluiPierDisplay}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Planned Pier Return:{" "}
                      <strong>{tl.plannedKahuluiPierReturnDisplay}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      All-Aboard: <strong>{tl.shipAllAboardDisplay}</strong>
                    </span>
                  </div>
                </div>

                <div
                  data-testid={`seat-availability-panel-${trip.tripId}`}
                  className="rounded-lg border border-sky-500/25 bg-sky-950/25 p-3.5 text-xs space-y-1.5"
                >
                  <div className="font-bold uppercase tracking-wider text-sky-300">
                    Seat Availability Check (Displayed Separately)
                  </div>
                  <p className="text-zinc-200 leading-relaxed">
                    {trip.seatAvailability.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {trip.seatAvailability.bookingUrl ? (
                      <a
                        href={trip.seatAvailability.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`seat-availability-cta-${trip.tripId}`}
                        className="inline-flex items-center gap-1 rounded-md border border-sky-400/50 bg-sky-500/20 px-3 py-1 font-bold text-sky-100 hover:bg-sky-500/30"
                      >
                        {trip.seatAvailability.actionLabel} →
                      </a>
                    ) : (
                      <span
                        data-testid={`seat-availability-cta-${trip.tripId}`}
                        className="inline-flex items-center rounded-md border border-amber-400/40 bg-amber-500/15 px-3 py-1 font-bold text-amber-200"
                      >
                        Needs verification — hold out of confirmed trip plan
                      </span>
                    )}
                    <a
                      href={trip.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 underline hover:text-cyan-200"
                    >
                      Operator source page
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
