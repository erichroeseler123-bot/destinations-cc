"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { TravelReferenceNode } from "@/lib/dcc/travelReference";
import {
  buildJuneauScenarioQueryString,
  DEFAULT_JUNEAU_SCENARIO_INPUT,
  evaluateJuneauPortDayScenario,
  parseJuneauScenarioFromSearchParams,
  type JuneauArrivalDock,
  type JuneauEvaluatedOptionFit,
  type JuneauFactBasisType,
  type JuneauGoalMode,
  type JuneauMobilityLevel,
  type JuneauPortDayScenarioInput,
  type JuneauWeatherInputState,
} from "@/lib/dcc/juneauPortDayEngine";

interface JuneauPortDayPlannerProps {
  node: TravelReferenceNode;
  initialSearchParams?: Record<string, string | string[] | undefined>;
}

const FIT_BADGE_STYLES: Record<
  JuneauEvaluatedOptionFit,
  { badgeClass: string; borderClass: string }
> = {
  fits_comfortably: {
    badgeClass: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    borderClass: "border-emerald-500/30 bg-slate-900/80",
  },
  tight_buffer: {
    badgeClass: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    borderClass: "border-amber-500/30 bg-slate-900/80",
  },
  withdrawn_or_qualified_evidence: {
    badgeClass: "border-sky-400/40 bg-sky-500/15 text-sky-200",
    borderClass: "border-sky-500/30 bg-slate-900/80",
  },
  does_not_fit: {
    badgeClass: "border-rose-400/40 bg-rose-500/15 text-rose-200",
    borderClass: "border-rose-500/25 bg-slate-950/60 opacity-90",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  public_free_or_municipal: "Public / Municipal / Free",
  direct_operator_shuttle: "Direct Operator Shuttle",
  guided_single_activity: "Guided Single Excursion",
  two_activity_combo: "Two-Activity Combination",
};

const BASIS_BADGE_MAP: Record<
  JuneauFactBasisType,
  { label: string; className: string }
> = {
  sourced_fact: {
    label: "Sourced Fact",
    className: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  },
  operator_estimate: {
    label: "Operator Estimate",
    className: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200",
  },
  dcc_estimate: {
    label: "DCC Estimate",
    className: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  },
  traveler_assumption: {
    label: "Traveler Assumption",
    className: "border-indigo-400/40 bg-indigo-500/15 text-indigo-200",
  },
};

export default function JuneauPortDayPlanner({
  node,
  initialSearchParams,
}: JuneauPortDayPlannerProps) {
  const [input, setInput] = useState<JuneauPortDayScenarioInput>(() =>
    initialSearchParams
      ? parseJuneauScenarioFromSearchParams(initialSearchParams)
      : DEFAULT_JUNEAU_SCENARIO_INPUT
  );
  const [showAdvancedAssumptions, setShowAdvancedAssumptions] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  // Sync from browser URL query params on mount so shared links re-evaluate against current evidence
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.search && window.location.search.length > 1) {
      const parsed = parseJuneauScenarioFromSearchParams(
        new URLSearchParams(window.location.search)
      );
      setInput(parsed);
      if (
        parsed.mobilityLevel !== DEFAULT_JUNEAU_SCENARIO_INPUT.mobilityLevel ||
        parsed.weatherCondition !== DEFAULT_JUNEAU_SCENARIO_INPUT.weatherCondition ||
        parsed.returnBufferMinutes !== DEFAULT_JUNEAU_SCENARIO_INPUT.returnBufferMinutes ||
        parsed.budgetMaxPerPersonUsd !== null ||
        parsed.overnightPortCall === true
      ) {
        setShowAdvancedAssumptions(true);
      }
    }
  }, []);

  const evaluation = useMemo(
    () => evaluateJuneauPortDayScenario(input, { node }),
    [input, node]
  );

  const applyPreset = (
    preset: Partial<JuneauPortDayScenarioInput>,
    openAdvanced = false
  ) => {
    setInput({
      ...DEFAULT_JUNEAU_SCENARIO_INPUT,
      ...preset,
    });
    if (openAdvanced) {
      setShowAdvancedAssumptions(true);
    }
  };

  const handleShareScenario = () => {
    if (typeof window === "undefined") return;
    const qs = buildJuneauScenarioQueryString(input);
    const nextUrl = `${window.location.pathname}?${qs}#port-day-decision-engine`;
    window.history.replaceState(null, "", nextUrl);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.origin + nextUrl).catch(() => {});
    }
    setCopiedShareUrl(true);
    setTimeout(() => setCopiedShareUrl(false), 3000);
  };

  const norm = evaluation.normalizedInput;
  const tzRes = evaluation.timezoneResolution;

  return (
    <section
      id="port-day-decision-engine"
      aria-label="Juneau Port-Day Decision Engine"
      data-timezone={evaluation.timezone}
      data-tz-abbr={tzRes.tzAbbreviation}
      data-utc-offset={tzRes.utcOffsetString}
      className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-5 sm:p-6 md:p-8 shadow-2xl"
    >
      {/* Header & Concise Answer First */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            <span>Interactive Decision Engine</span>
            <span className="text-slate-500">•</span>
            <span>
              {evaluation.timezone} ({tzRes.tzAbbreviation} UTC{tzRes.utcOffsetString})
            </span>
            <span className="text-slate-500">•</span>
            <span>Commercial Independence</span>
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
            What Can I Realistically Do in Juneau During My Port Window?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Enter your trip date, ship arrival, all-aboard deadline, and cruise berth to test whether
            single activities or two-activity combinations fit your schedule—and compare public/free,
            direct operator, and optional partner paths side by side.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShareScenario}
            className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
          >
            {copiedShareUrl ? "Scenario Link Copied" : "Share / Bookmark Scenario"}
          </button>
          <a
            href="#sources-and-verification"
            className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Inspect Sources ({node.evidenceRegistry.length})
          </a>
        </div>
      </div>

      {/* Input Validation Errors Banner when invalid time/date entered */}
      {evaluation.inputValidationErrors.length > 0 && (
        <div
          role="alert"
          data-input-validation-errors="true"
          className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-950/40 p-4 text-xs leading-relaxed text-rose-100"
        >
          <div className="font-bold uppercase tracking-wider text-rose-300">
            Input Validation Notice
          </div>
          <ul className="mt-1 space-y-1">
            {evaluation.inputValidationErrors.map((err) => (
              <li key={err}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Concise Bottom-Line Verdict Banner */}
      <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-950/30 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">
            Concise Answer for {norm.travelDate || `Month ${norm.travelMonth}`} ({tzRes.tzAbbreviation} UTC{tzRes.utcOffsetString})
          </span>
          {tzRes.dstTransitionNote && (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
              {tzRes.dstTransitionNote}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-base font-semibold leading-relaxed text-white">
          {evaluation.conciseBottomLine}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          <strong className="text-cyan-200">
            {evaluation.weatherAndTelemetryAdvisory.headline}:
          </strong>{" "}
          {evaluation.weatherAndTelemetryAdvisory.explanation}{" "}
          {evaluation.weatherAndTelemetryAdvisory.neverAllClearRule}
        </p>
        <p className="mt-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-200">
          <strong className="text-amber-300">
            Fits Time Budget ≠ Confirmed Operation or Availability:
          </strong>{" "}
          A mathematical time fit shows that an option fits your port hours after transfers and buffer; it never guarantees operator dispatch, seat availability, wheelchair/trail accessibility, or guaranteed ship return.
        </p>
      </div>

      {/* Explicit Verification Limitation Alert when telemetry fails or claims are withdrawn */}
      {(norm.weatherCondition === "provider_telemetry_unavailable" ||
        evaluation.evidenceHealth.hasWithdrawnOrConflictedClaims) && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-950/40 p-4 text-xs leading-relaxed text-amber-100"
        >
          <span className="font-bold uppercase tracking-wider text-amber-300">
            Verification Limitation (Not an All-Clear):{" "}
          </span>
          {norm.weatherCondition === "provider_telemetry_unavailable"
            ? `${evaluation.weatherAndTelemetryAdvisory.explanation} ${evaluation.weatherAndTelemetryAdvisory.neverAllClearRule}`
            : "One or more supporting claims have expired or conflicted evidence. Affected conclusions below are explicitly qualified while unrelated supported facts remain available."}
        </div>
      )}

      {/* Quick Scenario Presets */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Quick Scenarios:
        </span>
        <button
          type="button"
          onClick={() =>
            applyPreset({
              travelDate: "2026-07-15",
              shipArrivalTime: "08:00",
              allAboardTime: "16:30",
              arrivalDock: "downtown_walkoff",
              goalMode: "any_single_or_combo",
            })
          }
          className="rounded-lg border border-white/10 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 hover:border-cyan-400/40 hover:text-white"
        >
          Standard 8.5h Call (08:00–16:30, Jul 15)
        </button>
        <button
          type="button"
          onClick={() =>
            applyPreset({
              travelDate: "2026-07-15",
              shipArrivalTime: "07:00",
              allAboardTime: "12:30",
              arrivalDock: "aj_dock",
              goalMode: "two_activity_combo",
            })
          }
          className="rounded-lg border border-white/10 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 hover:border-cyan-400/40 hover:text-white"
        >
          Short 5.5h Call + 2-Activity Test (07:00–12:30, AJ Dock)
        </button>
        <button
          type="button"
          onClick={() =>
            applyPreset({
              travelDate: "2026-08-10",
              shipArrivalTime: "11:00",
              allAboardTime: "19:00",
              arrivalDock: "unknown_dock",
              goalMode: "any_single_or_combo",
            })
          }
          className="rounded-lg border border-white/10 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 hover:border-cyan-400/40 hover:text-white"
        >
          Unconfirmed Berth Call (11:00–19:00, Unknown Dock)
        </button>
        <button
          type="button"
          onClick={() =>
            applyPreset({
              travelDate: "2026-07-15",
              goalMode: "public_or_free_only",
            })
          }
          className="rounded-lg border border-white/10 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 hover:border-cyan-400/40 hover:text-white"
        >
          Public / Free Alternatives Only
        </button>
      </div>

      {/* Primary Progressive Inputs (Always Visible) */}
      <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            1. Trip Date
          </span>
          <input
            type="date"
            aria-label="Trip Date"
            value={norm.travelDate || "2026-07-15"}
            onChange={(e) => {
              const nextDate = e.target.value || "2026-07-15";
              const parsedMonth = Number(nextDate.slice(5, 7));
              setInput((prev) => ({
                ...prev,
                travelDate: nextDate,
                travelMonth:
                  Number.isFinite(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
                    ? parsedMonth
                    : prev.travelMonth,
              }));
            }}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          />
          <span className="mt-1 block text-[11px] text-slate-400">
            Sets {tzRes.tzAbbreviation} (UTC{tzRes.utcOffsetString}) &amp; season
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            2. Ship Arrival
          </span>
          <input
            type="time"
            aria-label="Ship Arrival Time"
            value={norm.shipArrivalTime}
            onChange={(e) =>
              setInput((prev) => ({
                ...prev,
                shipArrivalTime: e.target.value || "08:00",
              }))
            }
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          />
          <span className="mt-1 block text-[11px] text-slate-400">
            Local time (America/Juneau)
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            3. All-Aboard Deadline
          </span>
          <input
            type="time"
            aria-label="All-Aboard Deadline"
            value={norm.allAboardTime}
            onChange={(e) =>
              setInput((prev) => ({
                ...prev,
                allAboardTime: e.target.value || "16:30",
              }))
            }
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          />
          <span className="mt-1 block text-[11px] text-slate-400">
            Usually 30 min before departure
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            4. Cruise Berth / Arrival Mode
          </span>
          <select
            aria-label="Cruise Berth or Arrival Mode"
            value={norm.arrivalDock}
            onChange={(e) =>
              setInput((prev) => ({
                ...prev,
                arrivalDock: e.target.value as JuneauArrivalDock,
              }))
            }
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            <option value="downtown_walkoff">
              Cruise Ship Terminal / Alaska Steamship (Downtown)
            </option>
            <option value="franklin_dock">South Franklin Street Dock</option>
            <option value="aj_dock">AJ Dock (~1.2 mi South — Shuttle Required)</option>
            <option value="tender_anchor">Anchored Out (Water Tender Required)</option>
            <option value="unknown_dock">
              Unknown Berth — Not Yet Confirmed (Conservative Buffer)
            </option>
            <option value="independent_air_ferry">
              Independent Traveler (JNU Airport / AMHS Ferry)
            </option>
          </select>
          <span className="mt-1 block text-[11px] text-slate-400">
            Determines disembark + dock queue time
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            5. Trip Goal / Scope
          </span>
          <select
            aria-label="Trip Goal"
            value={norm.goalMode}
            onChange={(e) =>
              setInput((prev) => ({
                ...prev,
                goalMode: e.target.value as JuneauGoalMode,
              }))
            }
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            <option value="any_single_or_combo">
              Compare All (Single, 2-Activity &amp; Public/Free)
            </option>
            <option value="single_activity_focus">Single Primary Activity Only</option>
            <option value="two_activity_combo">Fit Two Activities in One Port Day</option>
            <option value="public_or_free_only">
              Public, Municipal &amp; Free Options Only
            </option>
          </select>
          <span className="mt-1 block text-[11px] text-slate-400">
            Filters or highlights matching options
          </span>
        </label>
      </div>

      {/* Progressive Disclosure Toggle for Secondary Constraints & Assumptions */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowAdvancedAssumptions((prev) => !prev)}
          aria-expanded={showAdvancedAssumptions}
          className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
        >
          <span>
            {showAdvancedAssumptions
              ? "Hide Adjustable Assumptions (Buffer, Mobility, Overnight, Weather & Budget)"
              : "Change Assumptions (Return Buffer, Mobility, Overnight Call, Weather & Budget)"}
          </span>
          <span className="text-cyan-300">
            [Buffer: {norm.returnBufferMinutes}m • Date: {norm.travelDate || `M${norm.travelMonth}`} •{" "}
            {norm.overnightPortCall ? "Overnight Call • " : ""}
            Mobility: {norm.mobilityLevel.replace(/_/g, " ")}]
          </span>
        </button>

        {showAdvancedAssumptions && (
          <div className="mt-3 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/80 p-4 md:grid-cols-3 lg:grid-cols-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Return Buffer (Minutes)
              </span>
              <select
                aria-label="Return Buffer Minutes"
                value={norm.returnBufferMinutes}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    returnBufferMinutes: Number(e.target.value),
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                <option value={45}>45 min (Aggressive)</option>
                <option value={60}>60 min (Standard Cruise Buffer)</option>
                <option value={75}>75 min (Conservative)</option>
                <option value={90}>90 min (High-Margin / Two-Activity)</option>
                <option value={120}>120 min (Extra Cushion)</option>
              </select>
              <span className="mt-1 block text-[11px] text-slate-400">
                Cushion before {norm.allAboardTime} all-aboard
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Mobility &amp; Walking
              </span>
              <select
                aria-label="Mobility Level"
                value={norm.mobilityLevel}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    mobilityLevel: e.target.value as JuneauMobilityLevel,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                <option value="unspecified">Not Specified (Verify Walking Distance)</option>
                <option value="step_free_wheelchair">
                  Step-Free / Wheelchair / Minimal Walking
                </option>
                <option value="light_walking_1mi">Light Walking (Up to 1 mile)</option>
                <option value="active_walking_3mi">
                  Active Walking (3+ miles / trails OK)
                </option>
              </select>
              <span className="mt-1 block text-[11px] text-slate-400">
                Unset mobility is never assumed to be 3-mile capable
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Port Window Span
              </span>
              <select
                aria-label="Overnight Port Call"
                value={norm.overnightPortCall ? "overnight" : "same_day"}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    overnightPortCall: e.target.value === "overnight",
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                <option value="same_day">Same-Day Port Call</option>
                <option value="overnight">Overnight Call (Next-Day All-Aboard)</option>
              </select>
              <span className="mt-1 block text-[11px] text-slate-400">
                Adds +24h when ship stays overnight
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Weather / Ceiling Assumption
              </span>
              <select
                aria-label="Weather or Ceiling Condition"
                value={norm.weatherCondition}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    weatherCondition: e.target.value as JuneauWeatherInputState,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                <option value="unknown_or_forecast_only">
                  Forecast Only / Unconfirmed Ceiling
                </option>
                <option value="clear_high_ceiling">Clear / High Ceiling Reported</option>
                <option value="low_ceiling_rain_fog">
                  Low Ceiling / Fog / Heavy Rain
                </option>
                <option value="provider_telemetry_unavailable">
                  Telemetry Feed Unreachable (Test Degraded Mode)
                </option>
              </select>
              <span className="mt-1 block text-[11px] text-slate-400">
                Affects flightseeing vs surface reliability
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Max Budget / Person (USD)
              </span>
              <input
                type="number"
                min={0}
                step={25}
                placeholder="No limit"
                aria-label="Maximum Budget Per Person USD"
                value={norm.budgetMaxPerPersonUsd ?? ""}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setInput((prev) => ({
                    ...prev,
                    budgetMaxPerPersonUsd:
                      val === "" ? null : Math.max(0, Number(val)),
                  }));
                }}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Leave blank to compare all price tiers
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Evaluated Options List */}
      <div className="mt-6 space-y-5">
        {evaluation.options.map((option) => {
          const style = FIT_BADGE_STYLES[option.fitStatus];
          const minPrice = option.bookingTransparency.indicativePriceRangePerPersonUsd.min;
          const maxPrice = option.bookingTransparency.indicativePriceRangePerPersonUsd.max;
          const usableWindowAfterBuffer =
            option.timing.totalPortWindowMinutes -
            option.timing.requiredReturnBufferMinutes;

          return (
            <article
              key={option.optionId}
              data-option-id={option.optionId}
              data-fit-status={option.fitStatus}
              data-double-counting-status={option.timing.durationAudit.doubleCountingStatus}
              className={`rounded-2xl border p-5 transition ${style.borderClass}`}
            >
              {/* Option Header */}
              <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${style.badgeClass}`}
                    >
                      {option.fitBadgeLabel}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-200">
                      {CATEGORY_LABELS[option.category] ?? option.category}
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-0.5 text-xs text-slate-300">
                      {option.corridor}
                    </span>
                    {option.category === "public_free_or_municipal" && (
                      <span className="rounded-full border border-teal-400/30 bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-200">
                        Public / Municipal Option
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-white md:text-xl">
                    {option.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-200">
                    {option.conciseVerdict}
                  </p>
                </div>

                <div className="shrink-0 rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2.5 lg:text-right">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">
                    Indicative Cost Basis
                  </div>
                  <div className="text-base font-bold text-white">
                    {minPrice === 0 && maxPrice === 0
                      ? "$0 (Free)"
                      : `$${minPrice}–$${maxPrice} / person`}
                  </div>
                  <div className="mt-0.5 max-w-xs text-[11px] text-slate-400">
                    {option.bookingTransparency.priceBasis}
                  </div>
                </div>
              </div>

              {/* Claim Qualification Alert if a supporting citation is stale/expired/conflicted */}
              {option.evidenceQualificationNote && (
                <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-950/40 p-3 text-xs text-amber-100">
                  <span className="font-bold text-amber-300">
                    Evidence Status Qualification:{" "}
                  </span>
                  {option.evidenceQualificationNote}
                </div>
              )}

              {/* Compact Time Summary Strip + Expandable Non-Double-Counted Time Math */}
              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-3.5">
                <div className="grid gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-lg border border-white/5 bg-slate-900/90 p-2.5">
                    <div className="text-slate-400">Gross Port Window</div>
                    <div className="mt-0.5 font-semibold text-white">
                      {option.timing.totalPortWindowMinutes} min ({option.timing.tzAbbreviation})
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-slate-900/90 p-2.5">
                    <div className="text-slate-400">Usable Window (After Buffer)</div>
                    <div className="mt-0.5 font-semibold text-white">
                      {usableWindowAfterBuffer} min
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-slate-900/90 p-2.5">
                    <div className="text-slate-400">
                      Total Required (incl. {option.timing.requiredReturnBufferMinutes}m buffer)
                    </div>
                    <div className="mt-0.5 font-semibold text-white">
                      {option.timing.totalRequiredMinutes} min
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-slate-900/90 p-2.5">
                    <div className="text-slate-400">Net Schedule Margin</div>
                    <div
                      className={`mt-0.5 font-bold ${
                        option.timing.netMarginMinutes >= 45
                          ? "text-emerald-300"
                          : option.timing.netMarginMinutes >= 0
                          ? "text-amber-300"
                          : "text-rose-300"
                      }`}
                    >
                      {option.timing.netMarginMinutes >= 0
                        ? `+${option.timing.netMarginMinutes} min spare`
                        : `${option.timing.netMarginMinutes} min short`}
                    </div>
                  </div>
                </div>

                <details className="mt-2.5 text-xs text-slate-300">
                  <summary className="cursor-pointer font-semibold text-cyan-300 hover:text-cyan-200">
                    Inspect Step-by-Step Time Math &amp; Non-Double-Counted Duration Audit (Shore-Ready{" "}
                    {option.timing.earliestShoreReadyTime} → Est. Back at Dock{" "}
                    {option.timing.estimatedBackAtDockTime}, Buffer Cutoff{" "}
                    {option.timing.targetAllAboardBufferCutoffTime})
                  </summary>
                  <div className="mt-2.5 space-y-2 border-t border-white/10 pt-2.5">
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Disembark/Dock:{" "}
                        <strong className="text-white">
                          {option.timing.disembarkationAndDockMinutes}m
                        </strong>
                      </span>
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Check-In Lead:{" "}
                        <strong className="text-white">
                          {option.timing.checkInLeadMinutes}m
                        </strong>
                      </span>
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Outbound Transfer:{" "}
                        <strong className="text-white">
                          {option.timing.outboundTransferMinutes}m
                        </strong>
                      </span>
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        On-Site/On-Water Activity:{" "}
                        <strong className="text-white">
                          {option.timing.activityDurationMinutes}m
                        </strong>
                      </span>
                      {option.timing.interActivityTransferMinutes > 0 && (
                        <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                          Inter-Activity Link:{" "}
                          <strong className="text-white">
                            {option.timing.interActivityTransferMinutes}m
                          </strong>
                        </span>
                      )}
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Return Transfer:{" "}
                        <strong className="text-white">
                          {option.timing.returnTransferMinutes}m
                        </strong>
                      </span>
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Dock Queue:{" "}
                        <strong className="text-white">
                          {option.timing.returnDockQueueMinutes}m
                        </strong>
                      </span>
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Return Buffer:{" "}
                        <strong className="text-white">
                          {option.timing.requiredReturnBufferMinutes}m
                        </strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-200/90">
                      <strong>Duration Decomposition (No Double-Counting):</strong>{" "}
                      {option.timing.durationAudit.decompositionNote} (Advertised dock-to-dock:{" "}
                      {option.timing.durationAudit.advertisedDockToDockMinutes}m ={" "}
                      {option.timing.durationAudit.checkInLeadMinutes}m check-in +{" "}
                      {option.timing.durationAudit.outboundTransferMinutes}m outbound +{" "}
                      {option.timing.durationAudit.onSiteOrOnWaterActivityMinutes}m core activity +{" "}
                      {option.timing.durationAudit.interActivityTransferMinutes}m inter-activity +{" "}
                      {option.timing.durationAudit.returnTransferMinutes}m return).
                    </p>
                    <p className="text-[11px] italic text-slate-400">
                      {option.operationalGuaranteeSeparation.separationStatement}
                    </p>
                  </div>
                </details>
              </div>

              {/* 4-Column Structured Explanations: Reasons/Tradeoffs, Assumptions, Uncertainties, Sensitivity */}
              <div className="mt-4 grid gap-4 text-xs md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5">
                  <div className="font-bold uppercase tracking-wider text-emerald-300">
                    Supported Reasons &amp; Tradeoffs
                  </div>
                  <ul className="mt-2 space-y-1.5 text-slate-200">
                    {option.supportedReasonsAndTradeoffs.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5">
                  <div className="font-bold uppercase tracking-wider text-slate-300">
                    Assumptions Used
                  </div>
                  <ul className="mt-2 space-y-1.5 text-slate-300">
                    {option.assumptionsUsed.map((assumption) => (
                      <li key={assumption}>• {assumption}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5">
                  <div className="font-bold uppercase tracking-wider text-amber-300">
                    Uncertain / Needs Confirmation
                  </div>
                  <ul className="mt-2 space-y-1.5 text-slate-200">
                    {option.uncertainOrNeedsConfirmation.map((unc) => (
                      <li key={unc}>• {unc}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5">
                  <div className="font-bold uppercase tracking-wider text-cyan-300">
                    What Input Change Alters Result
                  </div>
                  <ul className="mt-2 space-y-1.5 text-slate-200">
                    {option.whatInputChangeWouldAlterResult.map((change) => (
                      <li key={change}>→ {change}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Expandable 8-Field Fact Provenance Audit (Sourced Facts vs Operator/DCC Estimates vs Traveler Assumptions) */}
              <details
                className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs"
                data-option-fact-audit={option.optionId}
              >
                <summary className="cursor-pointer font-semibold text-slate-200 hover:text-white">
                  Inspect Fact Provenance Audit ({option.inputAudit.length} Decision Inputs: Sourced Facts vs. Operator/DCC Estimates vs. Traveler Assumptions)
                </summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {option.inputAudit.map((entry) => {
                    const badge = BASIS_BADGE_MAP[entry.basisType];
                    return (
                      <div
                        key={`${option.optionId}-${entry.field}`}
                        data-audit-field={entry.field}
                        data-basis-type={entry.basisType}
                        className="rounded-lg border border-white/10 bg-slate-900/90 p-2.5 space-y-1"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-bold text-white">{entry.label}</span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-200">
                          {entry.valueSummary}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {entry.verificationNote}
                        </div>
                        {entry.citationIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {entry.citationIds.map((cid) => (
                              <a
                                key={cid}
                                href={`#cite-${cid}`}
                                className="font-mono text-[10px] text-cyan-300 hover:underline"
                              >
                                [{cid}]
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>

              {/* Inline Supporting Evidence Citations */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-400">
                  Supporting Evidence:
                </span>
                {option.supportingCitations.map((cite) => (
                  <a
                    key={cite.citationId}
                    href={`#cite-${cite.citationId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 hover:bg-cyan-500/20"
                  >
                    <span>[{cite.citationId}]</span>
                    <span className="text-[10px] uppercase text-slate-300">
                      ({cite.evidenceStatus})
                    </span>
                  </a>
                ))}
              </div>

              {/* Recent 180-Day Review Summary (Clean single-line when unavailable) */}
              <div
                className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs"
                data-review-summary-state={option.recentReviewSummary.state}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold uppercase tracking-wider text-cyan-300">
                    {option.recentReviewSummary.statusHeadline}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {option.recentReviewSummary.state === "unavailable"
                      ? "180-day verified review feed unavailable"
                      : `Window: ${option.recentReviewSummary.windowStartDate} → ${option.recentReviewSummary.windowEndDate} (${option.recentReviewSummary.eligibleRecentCount} eligible)`}
                  </span>
                </div>
                {option.recentReviewSummary.state !== "unavailable" && (
                  <p className="mt-1 text-slate-300">
                    {option.recentReviewSummary.statusDetail}
                  </p>
                )}
                {option.recentReviewSummary.state === "thematic_summary" && (
                  <div className="grid gap-2 md:grid-cols-2 pt-2">
                    {option.recentReviewSummary.positives.map((pos) => (
                      <div
                        key={`pos-${pos.themeId}`}
                        className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 p-2.5 text-emerald-100"
                      >
                        <strong>+ {pos.topicLabel}:</strong> {pos.statement}{" "}
                        <span className="font-mono text-[10px] text-emerald-300">
                          [{pos.supportingReviewIds.join(", ")}]
                        </span>
                      </div>
                    ))}
                    {option.recentReviewSummary.negatives.map((neg) => (
                      <div
                        key={`neg-${neg.themeId}`}
                        className="rounded-lg border border-rose-500/25 bg-rose-950/20 p-2.5 text-rose-100"
                      >
                        <strong>− {neg.topicLabel}:</strong> {neg.statement}{" "}
                        <span className="font-mono text-[10px] text-rose-300">
                          [{neg.supportingReviewIds.join(", ")}]
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional & Transparent Booking / Direct Alternatives (Placed AFTER Decision Info) */}
              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/70 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-300">
                    Optional Booking &amp; Direct Provider Links (Presented After Decision Facts)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Commercial links never affect fit status or ranking
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-300 space-y-1">
                  <div>
                    <strong className="text-slate-100">Actual Operators:</strong>{" "}
                    {option.bookingTransparency.actualOperators.join(", ")}
                  </div>
                  <div>
                    <strong className="text-slate-100">Inclusions:</strong>{" "}
                    {option.bookingTransparency.inclusions.join("; ")} •{" "}
                    <strong className="text-slate-100">Meeting:</strong>{" "}
                    {option.bookingTransparency.meetingArrangements}
                  </div>
                  <div>
                    <strong className="text-slate-100">Cancellation:</strong>{" "}
                    {option.bookingTransparency.cancellationConditions} •{" "}
                    <span className="text-slate-400">
                      (Verified {option.bookingTransparency.detailsVerifiedAt}:{" "}
                      {option.bookingTransparency.detailsFreshnessNote})
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
                  {option.bookingTransparency.channels.map((book) => (
                    <div
                      key={`${option.optionId}-${book.label}`}
                      className="flex flex-col justify-between rounded-lg border border-white/10 bg-slate-900/90 p-3 text-xs"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-200">
                            {book.channelType.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {book.operatorOrProviderName}
                          </span>
                        </div>
                        <a
                          href={book.url}
                          target={book.url.startsWith("http") ? "_blank" : undefined}
                          rel={
                            book.url.startsWith("http")
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="mt-1.5 inline-block font-semibold text-cyan-300 underline decoration-cyan-400/50 underline-offset-4 hover:text-cyan-200"
                        >
                          {book.label}
                        </a>
                      </div>
                      <div className="mt-2 border-t border-white/5 pt-1.5 text-[10px] text-slate-400">
                        {book.relationshipDisclosure}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Footer Methodology & Coverage Limits */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-300">
        <p>
          <strong className="text-white">Coverage &amp; Independence Disclosure:</strong>{" "}
          {evaluation.coverageDisclosures.coverageLimits.join(" ")}{" "}
          {evaluation.coverageDisclosures.commercialIndependenceStatement}
        </p>
      </div>
    </section>
  );
}
