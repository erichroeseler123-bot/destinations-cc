"use client";

import { useMemo, useState } from "react";
import {
  buildDec15BenchmarkPreviewCases,
  type Dec15PreviewCase,
  DENVER_VAIL_GTFS_METADATA_PUBLIC,
  evaluateDenverVailBusCheck,
  LUGGAGE_OPTIONS,
  type LuggageOptionId,
  MIN_UNION_STATION_TRANSFER_MINUTES,
} from "@/lib/dcc/transit/denverVailBusChecker";

interface VailBusCatchCheckerProps {
  basePartnerDestinationUrl?: string;
  initialPreviewCases?: Dec15PreviewCase[];
}

export default function VailBusCatchChecker({
  initialPreviewCases,
}: VailBusCatchCheckerProps) {
  const [arrivalDate, setArrivalDate] = useState<string>("2026-12-15");
  const [arrivalTime, setArrivalTime] = useState<string>("15:10");
  const [luggage, setLuggage] = useState<LuggageOptionId>("skis_and_checked");
  const [baggageEstimateMinutes, setBaggageEstimateMinutes] =
    useState<number>(45);

  const liveResult = useMemo(
    () =>
      evaluateDenverVailBusCheck({
        arrivalDate,
        arrivalTime,
        luggage,
        baggageEstimateMinutes,
      }),
    [arrivalDate, arrivalTime, luggage, baggageEstimateMinutes],
  );

  const previewCases = useMemo(
    () => initialPreviewCases ?? buildDec15BenchmarkPreviewCases(),
    [initialPreviewCases],
  );

  function handleLuggageChange(nextLuggage: LuggageOptionId) {
    setLuggage(nextLuggage);
    setBaggageEstimateMinutes(LUGGAGE_OPTIONS[nextLuggage].defaultBaggageMinutes);
  }

  function applyPreset(preset: {
    arrivalDate: string;
    arrivalTime: string;
    luggage: LuggageOptionId;
    baggageEstimateMinutes?: number;
  }) {
    setArrivalDate(preset.arrivalDate);
    setArrivalTime(preset.arrivalTime);
    setLuggage(preset.luggage);
    setBaggageEstimateMinutes(
      preset.baggageEstimateMinutes ??
        LUGGAGE_OPTIONS[preset.luggage].defaultBaggageMinutes,
    );
  }

  const defaultBaggageMinutes = LUGGAGE_OPTIONS[luggage].defaultBaggageMinutes;
  const rtdCal = liveResult.serviceCalendars.rtdALine;
  const westCal = liveResult.serviceCalendars.bustangWest;
  const pegaCal = liveResult.serviceCalendars.pegasus;

  return (
    <section
      aria-label="Can I still catch the bus to Vail checker"
      data-testid="vail-bus-catch-checker"
      className="rounded-3xl border border-emerald-400/30 bg-slate-950/95 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
              DEN → Union Station → Vail Transit Cutoff Checker
            </span>
            <span
              data-testid="vail-bus-checker-schedule-badge"
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider ${
                liveResult.scheduleStatusLabel === "scheduled"
                  ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200"
                  : "border-amber-400/40 bg-amber-500/15 text-amber-200"
              }`}
            >
              {liveResult.scheduleStatusLabel}
            </span>
          </div>
          <h2 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white">
            Can I still catch the bus to Vail?
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-300">
            Scoped to{" "}
            <strong className="text-white">
              Denver Airport (DEN) → Union Station → Vail Transportation Center
            </strong>
            . Applies RTD A Line, CDOT Bustang West Line, and CDOT Pegasus service
            calendars and holiday exceptions separately for your arrival date, with a
            strict{" "}
            <strong className="text-emerald-300">
              {MIN_UNION_STATION_TRANSFER_MINUTES}-minute minimum transfer
            </strong>{" "}
            at Union Station.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[11px] font-mono text-zinc-300">
          <div>
            GTFS window: {DENVER_VAIL_GTFS_METADATA_PUBLIC.validStartDate} →{" "}
            {DENVER_VAIL_GTFS_METADATA_PUBLIC.validEndDate}
          </div>
          <div className="mt-0.5 text-zinc-400">
            Refresh before Jan. 2: <code>{DENVER_VAIL_GTFS_METADATA_PUBLIC.refreshCommand}</code>
          </div>
        </div>
      </div>

      {/* Quick Scenario Presets */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Load case:
        </span>
        <button
          type="button"
          data-testid="preset-dec15-1510-fits"
          onClick={() =>
            applyPreset({
              arrivalDate: "2026-12-15",
              arrivalTime: "15:10",
              luggage: "skis_and_checked",
              baggageEstimateMinutes: 45,
            })
          }
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            arrivalDate === "2026-12-15" &&
            arrivalTime === "15:10" &&
            luggage === "skis_and_checked" &&
            baggageEstimateMinutes === 45
              ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
              : "border-white/15 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
          }`}
        >
          Dec. 15 · 3:10 p.m. (Fits)
        </button>
        <button
          type="button"
          data-testid="preset-dec15-1540-11min-fails"
          onClick={() =>
            applyPreset({
              arrivalDate: "2026-12-15",
              arrivalTime: "15:40",
              luggage: "skis_and_checked",
              baggageEstimateMinutes: 45,
            })
          }
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            arrivalDate === "2026-12-15" &&
            arrivalTime === "15:40" &&
            luggage === "skis_and_checked" &&
            baggageEstimateMinutes === 45
              ? "border-amber-400 bg-amber-500/20 text-amber-100"
              : "border-white/15 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
          }`}
        >
          Dec. 15 · 3:40 p.m. (11 min at Union Station fails)
        </button>
        <button
          type="button"
          data-testid="preset-dec15-1605-misses"
          onClick={() =>
            applyPreset({
              arrivalDate: "2026-12-15",
              arrivalTime: "16:05",
              luggage: "skis_and_checked",
              baggageEstimateMinutes: 45,
            })
          }
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            arrivalDate === "2026-12-15" &&
            arrivalTime === "16:05" &&
            luggage === "skis_and_checked" &&
            baggageEstimateMinutes === 45
              ? "border-rose-400 bg-rose-500/20 text-rose-100"
              : "border-white/15 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
          }`}
        >
          Dec. 15 · 4:05 p.m. (Misses)
        </button>
        <button
          type="button"
          data-testid="preset-thanksgiving-20261126"
          onClick={() =>
            applyPreset({
              arrivalDate: "2026-11-26",
              arrivalTime: "16:05",
              luggage: "skis_and_personal",
              baggageEstimateMinutes: 45,
            })
          }
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            arrivalDate === "2026-11-26" &&
            arrivalTime === "16:05" &&
            luggage === "skis_and_personal"
              ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
              : "border-white/15 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
          }`}
        >
          Thanksgiving · 4:05 p.m. (Pegasus unavailable)
        </button>
        <button
          type="button"
          data-testid="preset-christmas-20261225"
          onClick={() =>
            applyPreset({
              arrivalDate: "2026-12-25",
              arrivalTime: "16:05",
              luggage: "skis_and_personal",
              baggageEstimateMinutes: 45,
            })
          }
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            arrivalDate === "2026-12-25" &&
            arrivalTime === "16:05" &&
            luggage === "skis_and_personal"
              ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
              : "border-white/15 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
          }`}
        >
          Christmas · 4:05 p.m. (Pegasus unavailable)
        </button>
        <button
          type="button"
          data-testid="preset-christmas-1300-west-1630"
          onClick={() =>
            applyPreset({
              arrivalDate: "2026-12-25",
              arrivalTime: "13:00",
              luggage: "skis_and_checked",
              baggageEstimateMinutes: 45,
            })
          }
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            arrivalDate === "2026-12-25" &&
            arrivalTime === "13:00" &&
            luggage === "skis_and_checked"
              ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
              : "border-white/15 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
          }`}
        >
          Christmas · 1:00 p.m. (4:30 p.m. West Line)
        </button>
        <button
          type="button"
          data-testid="preset-newyears-20270101"
          onClick={() =>
            applyPreset({
              arrivalDate: "2027-01-01",
              arrivalTime: "15:10",
              luggage: "skis_and_checked",
              baggageEstimateMinutes: 45,
            })
          }
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            arrivalDate === "2027-01-01"
              ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
              : "border-white/15 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
          }`}
        >
          New Year&rsquo;s Day (Jan. 1)
        </button>
        <button
          type="button"
          data-testid="preset-jan3-20270103-missing"
          onClick={() =>
            applyPreset({
              arrivalDate: "2027-01-03",
              arrivalTime: "15:10",
              luggage: "skis_and_checked",
              baggageEstimateMinutes: 45,
            })
          }
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            arrivalDate === "2027-01-03"
              ? "border-amber-400 bg-amber-500/20 text-amber-100"
              : "border-white/15 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
          }`}
        >
          Jan. 3 (Outside feed window)
        </button>
      </div>

      {/* Inputs: Arrival Date, Local Arrival Time, Luggage, Editable Baggage Estimate */}
      <div className="mt-5 grid gap-4 md:grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <label className="block text-xs text-zinc-300">
          <span className="font-semibold uppercase tracking-wider text-zinc-400">
            Arrival date
          </span>
          <input
            type="date"
            data-testid="checker-arrival-date-input"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          />
        </label>

        <label className="block text-xs text-zinc-300">
          <span className="font-semibold uppercase tracking-wider text-zinc-400">
            Local arrival time (DEN)
          </span>
          <input
            type="time"
            data-testid="checker-arrival-time-input"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          />
        </label>

        <label className="block text-xs text-zinc-300">
          <span className="font-semibold uppercase tracking-wider text-zinc-400">
            Luggage
          </span>
          <select
            data-testid="checker-luggage-select"
            value={luggage}
            onChange={(e) =>
              handleLuggageChange(e.target.value as LuggageOptionId)
            }
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            {Object.values(LUGGAGE_OPTIONS).map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="block text-xs text-zinc-300">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="checker-baggage-estimate-input"
              className="font-semibold uppercase tracking-wider text-zinc-400"
            >
              Editable baggage estimate (min)
            </label>
            {baggageEstimateMinutes !== defaultBaggageMinutes && (
              <button
                type="button"
                onClick={() => setBaggageEstimateMinutes(defaultBaggageMinutes)}
                className="text-[11px] text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
              >
                Reset ({defaultBaggageMinutes}m)
              </button>
            )}
          </div>
          <input
            id="checker-baggage-estimate-input"
            type="number"
            min={0}
            max={240}
            step={5}
            data-testid="checker-baggage-estimate-input"
            value={baggageEstimateMinutes}
            onChange={(e) =>
              setBaggageEstimateMinutes(
                Math.max(0, Math.min(240, Number(e.target.value) || 0)),
              )
            }
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          />
          <p className="mt-1 text-[11px] text-zinc-400">
            Deplane + Level 5 bag/ski claim + walk to DEN Station (#34476)
          </p>
        </div>
      </div>

      {/* Live Verdict Banner */}
      <div
        data-testid="vail-bus-checker-live-verdict"
        data-verdict={liveResult.verdict}
        data-schedule-status={liveResult.scheduleStatusLabel}
        className={`mt-5 rounded-2xl border p-5 ${
          liveResult.verdict === "fits"
            ? "border-emerald-400/40 bg-emerald-950/25"
            : liveResult.verdict === "fits_pegasus_only"
              ? "border-cyan-400/40 bg-cyan-950/25"
              : liveResult.verdict === "schedule_needs_verification"
                ? "border-amber-400/40 bg-amber-950/30"
                : "border-rose-400/40 bg-rose-950/25"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              data-testid="vail-bus-checker-verdict-badge"
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                liveResult.verdict === "fits"
                  ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/40"
                  : liveResult.verdict === "fits_pegasus_only"
                    ? "bg-cyan-400/20 text-cyan-200 border border-cyan-400/40"
                    : liveResult.verdict === "schedule_needs_verification"
                      ? "bg-amber-400/20 text-amber-200 border border-amber-400/40"
                      : "bg-rose-400/20 text-rose-200 border border-rose-400/40"
              }`}
            >
              {liveResult.verdictBadge}
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-0.5 text-[11px] font-mono text-zinc-300">
              Status: {liveResult.scheduleStatusLabel}
            </span>
          </div>

          {liveResult.scheduleStatusLabel === "scheduled" && (
            <span className="text-xs font-mono text-zinc-300">
              Transit fare: {liveResult.combinedFareLabel}
            </span>
          )}
        </div>

        {/* Per-Operator Service Calendar & Holiday Exception Strip */}
        <div
          data-testid="checker-operator-service-calendars"
          className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono"
        >
          <span className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-zinc-200">
            RTD A Line:{" "}
            <strong>
              {rtdCal.inFeedWindow
                ? rtdCal.activeRouteServiceIds.join("+") || "none"
                : "out of window"}
            </strong>
            {rtdCal.holidayExceptionSummary
              ? ` · ${rtdCal.holidayExceptionSummary}`
              : ""}
          </span>
          <span className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-zinc-200">
            Bustang West:{" "}
            <strong>
              {westCal.inFeedWindow
                ? westCal.activeRouteServiceIds.join("+") || "none"
                : "out of window"}
            </strong>
            {westCal.holidayExceptionSummary
              ? ` · ${westCal.holidayExceptionSummary}`
              : ""}
          </span>
          <span className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-zinc-200">
            Pegasus:{" "}
            <strong>
              {pegaCal.inFeedWindow
                ? pegaCal.activeRouteServiceIds.join("+") || "unavailable"
                : "out of window"}
            </strong>
            {pegaCal.holidayExceptionSummary
              ? ` · ${pegaCal.holidayExceptionSummary}`
              : ""}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-zinc-100">
          {liveResult.verdictSummary}
        </p>

        {/* 4 Required Step Outputs: Editable baggage estimate, A Line train, Time to transfer to Gate B19, Scheduled arrival in Vail */}
        {liveResult.scheduleStatusLabel === "scheduled" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div
              data-testid="checker-step-baggage"
              className="rounded-xl border border-white/10 bg-black/35 p-3.5"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                1. Editable baggage estimate
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {liveResult.input.baggageEstimateMinutes} min
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                Lands {liveResult.input.arrivalTime12h} → platform ready{" "}
                <strong className="text-white">
                  {liveResult.denPlatformReadyTime12h}
                </strong>{" "}
                ({liveResult.denPlatformReadyTime24h})
              </p>
            </div>

            <div
              data-testid="checker-step-a-line"
              className="rounded-xl border border-white/10 bg-black/35 p-3.5"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                2. RTD A Line train
              </p>
              {liveResult.aLineTrain ? (
                <>
                  <p className="mt-1 text-lg font-bold text-white">
                    {liveResult.aLineTrain.dep12h} →{" "}
                    {liveResult.aLineTrain.arr12h}
                  </p>
                  <p className="mt-1 text-xs text-zinc-300">
                    DEN Station (#34476) → Union Station Track 1 (#34667) ·{" "}
                    <span className="font-mono">
                      svc {liveResult.aLineTrain.serviceId} · trip{" "}
                      {liveResult.aLineTrain.tripId}
                    </span>
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm font-semibold text-rose-200">
                  No qualifying A Line departure
                </p>
              )}
            </div>

            <div
              data-testid="checker-step-gate-b19-transfer"
              className={`rounded-xl border p-3.5 ${
                liveResult.gateB19Transfer.passesMinimum
                  ? "border-emerald-400/30 bg-emerald-950/30"
                  : "border-rose-400/35 bg-rose-950/30"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                3. Time to transfer to Gate B19
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {liveResult.gateB19Transfer.minutes !== null
                  ? liveResult.gateB19Transfer.minutes >= 0
                    ? `${liveResult.gateB19Transfer.minutes} minutes`
                    : `Misses by ${Math.abs(liveResult.gateB19Transfer.minutes)} min`
                  : "N/A"}
              </p>
              <p className="mt-1 text-xs text-zinc-200">
                {liveResult.gateB19Transfer.statusText}
              </p>
            </div>

            <div
              data-testid="checker-step-vail-arrival"
              className="rounded-xl border border-white/10 bg-black/35 p-3.5"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                4. Scheduled arrival in Vail
              </p>
              {liveResult.scheduledVailArrival12h ? (
                <>
                  <p className="mt-1 text-lg font-bold text-emerald-300">
                    {liveResult.scheduledVailArrival12h}{" "}
                    <span className="text-xs font-mono text-zinc-300">
                      ({liveResult.scheduledVailArrival24h})
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-300">
                    Vail Transportation Center (#35174) ·{" "}
                    {liveResult.scheduledVailArrivalRouteLabel}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-base font-bold text-rose-300">
                    Misses last 5:15 p.m. bus
                  </p>
                  <p className="mt-1 text-xs text-zinc-300">
                    Last Bustang West Line departs Gate B19 (#34316) at 5:15 p.m.
                    (17:15)
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div
            data-testid="checker-schedule-needs-verification-box"
            className="mt-4 rounded-xl border border-amber-400/35 bg-black/35 p-4 text-xs text-amber-100"
          >
            <strong>Schedule needs verification:</strong> Published RTD A Line and
            CDOT Bustang/Pegasus GTFS schedules in this build cover{" "}
            <code>{DENVER_VAIL_GTFS_METADATA_PUBLIC.validStartDate}</code> through{" "}
            <code>{DENVER_VAIL_GTFS_METADATA_PUBLIC.validEndDate}</code>. Run{" "}
            <code>{DENVER_VAIL_GTFS_METADATA_PUBLIC.refreshCommand}</code> (documented
            in <code>{DENVER_VAIL_GTFS_METADATA_PUBLIC.refreshRunbookPath}</code>)
            when RTD posts the post-Jan. 2 runboard, or check GoSno availability below.
          </div>
        )}

        {/* Show Pegasus ONLY when its schedule and luggage rules fit */}
        {liveResult.pegasusConnection && (
          <div
            data-testid="checker-pegasus-option"
            className="mt-4 rounded-xl border border-cyan-400/35 bg-cyan-950/30 p-4 text-xs text-cyan-100"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="uppercase tracking-wider text-cyan-200">
                CDOT Pegasus Shuttle Van Option (Schedule &amp; Compact Luggage Fit ·
                scheduled)
              </strong>
              <span className="font-mono">
                Svc {liveResult.pegasusConnection.trip.serviceId} · Trip{" "}
                {liveResult.pegasusConnection.trip.tripId} · $20.00 bus fare
              </span>
            </div>
            <p className="mt-1.5 leading-5">
              Boards streetside at{" "}
              <strong>{liveResult.pegasusConnection.boardingStopLabel}</strong> at{" "}
              <strong>
                {liveResult.pegasusConnection.trip.dep12h} (
                {liveResult.pegasusConnection.trip.dep24h})
              </strong>{" "}
              ({liveResult.pegasusConnection.transferMinutes} min transfer after A
              Line arrival, meeting the {MIN_UNION_STATION_TRANSFER_MINUTES}-minute
              minimum) → scheduled arrival at{" "}
              <strong>Vail Transportation Center (#35174)</strong> at{" "}
              <strong>
                {liveResult.pegasusConnection.trip.arr12h} (
                {liveResult.pegasusConnection.trip.arr24h})
              </strong>
              . Allowed only because your luggage ({liveResult.input.luggage.shortLabel}
              ) has no full-size suitcase exceeding 16&Prime;×16&Prime;×12&Prime;.
            </p>
          </div>
        )}

        {/* If transit misses (or schedule needs verification), offer Check GoSno availability */}
        {(liveResult.verdict === "misses" ||
          liveResult.verdict === "schedule_needs_verification") && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/40 p-4">
            <div className="text-xs text-zinc-200">
              <strong className="text-white">
                {liveResult.verdict === "misses"
                  ? "Public transit to Vail does not fit this arrival:"
                  : "Transit schedule is not verified for this date:"}
              </strong>{" "}
              Carries your selected date ({liveResult.input.arrivalDate}) to GoSno so
              you can enter group size and gear directly.
            </div>
            <a
              href={liveResult.gosnoAvailabilityUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="vail-bus-checker-gosno-cta"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-cyan-300 transition"
            >
              Check GoSno availability ↗
            </a>
          </div>
        )}

        {/* Assumptions behind the verdict */}
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Assumptions behind this verdict ({liveResult.scheduleStatusLabel})
          </p>
          <ul className="mt-2 space-y-1.5 text-xs leading-5 text-zinc-300">
            {liveResult.assumptions.map((assumption, idx) => (
              <li key={idx}>• {assumption}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dec. 15 Preview Benchmark Cases (3:10 p.m. fits, 11 min at Union Station fails, 4:05 p.m. misses) */}
      <div className="mt-7 border-t border-white/10 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Dec. 15 Benchmark Verdicts · Skis + Checked Suitcase (45-min baggage
              estimate)
            </p>
            <h3 className="mt-1 text-lg font-bold text-white">
              How the 15-minute Union Station transfer minimum separates a catchable
              bus from a missed connection
            </h3>
          </div>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-mono text-cyan-200">
            All benchmark results labeled: scheduled
          </span>
        </div>

        <div
          data-testid="dec15-benchmark-cases-grid"
          className="mt-4 grid gap-4 md:grid-cols-3"
        >
          {previewCases.map((bench) => {
            const r = bench.result;
            const isFits = r.verdict === "fits";
            return (
              <article
                key={bench.id}
                data-testid={`benchmark-card-${bench.id}`}
                className={`flex flex-col justify-between rounded-2xl border p-4 ${
                  isFits
                    ? "border-emerald-400/35 bg-emerald-950/20"
                    : "border-rose-400/35 bg-rose-950/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        isFits
                          ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/40"
                          : "bg-rose-400/20 text-rose-200 border border-rose-400/40"
                      }`}
                    >
                      {bench.title}
                    </span>
                    <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] font-mono uppercase text-cyan-200">
                      {r.scheduleStatusLabel}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-zinc-300">
                    {bench.subtitle}
                  </p>

                  <dl className="mt-3 space-y-1.5 rounded-xl border border-white/10 bg-black/35 p-3 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-400">DEN landing:</dt>
                      <dd className="font-semibold text-white">
                        {r.input.arrivalTime12h} ({r.input.arrivalTime24h})
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-400">Baggage estimate:</dt>
                      <dd className="font-semibold text-white">
                        {r.input.baggageEstimateMinutes} min → ready{" "}
                        {r.denPlatformReadyTime12h}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-400">RTD A Line (#34476):</dt>
                      <dd className="font-semibold text-white">
                        {r.aLineTrain
                          ? `${r.aLineTrain.dep12h} → ${r.aLineTrain.arr12h}`
                          : "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-400">Transfer to Gate B19:</dt>
                      <dd
                        className={`font-bold ${
                          r.gateB19Transfer.passesMinimum
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {r.gateB19Transfer.minutes !== null
                          ? r.gateB19Transfer.minutes >= 0
                            ? `${r.gateB19Transfer.minutes} min ${
                                r.gateB19Transfer.passesMinimum
                                  ? "(≥ 15m min)"
                                  : "(fails 15m min)"
                              }`
                            : `${r.gateB19Transfer.minutes} min (19m late)`
                          : "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-400">Scheduled Vail arrival:</dt>
                      <dd className="font-bold text-white">
                        {r.scheduledVailArrival12h
                          ? `${r.scheduledVailArrival12h} (${r.scheduledVailArrival24h})`
                          : "Misses 5:15 p.m. bus"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 text-[11px] leading-5 text-zinc-300">
                    <p className="font-semibold text-zinc-200">Assumptions:</p>
                    <ul className="mt-1 space-y-1 text-zinc-400">
                      <li>
                        • 45m ski + suitcase claim ({r.input.arrivalTime12h} →{" "}
                        {r.denPlatformReadyTime12h} at DEN Station #34476)
                      </li>
                      <li>
                        • 37m A Line ride (svc {r.aLineTrain?.serviceId}, trip{" "}
                        {r.aLineTrain?.tripId}) to Union Station Track 1 (#34667)
                      </li>
                      <li>
                        • 15m minimum transfer (10m walk to Gate B19 #34316 + 5m
                        coach bay cutoff) before 5:15 p.m. Bustang (svc{" "}
                        {r.activeServiceIds.bustangWest}, #116053731)
                      </li>
                      <li>
                        • Pegasus (7:30 p.m.) excluded: checked suitcase exceeds
                        16&Prime;×16&Prime;×12&Prime;
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    data-testid={`load-benchmark-${bench.id}`}
                    onClick={() => applyPreset(bench.input)}
                    className="text-xs font-semibold text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
                  >
                    Load in checker ↑
                  </button>
                  {!isFits && (
                    <a
                      href={r.gosnoAvailabilityUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`benchmark-gosno-cta-${bench.id}`}
                      className="rounded-lg bg-cyan-400 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-950 hover:bg-cyan-300"
                    >
                      Check GoSno availability ↗
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
