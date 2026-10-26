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
  const allReviewsUnavailable = evaluation.options.every(
    (o) => o.recentReviewSummary.state === "unavailable"
  );

  return (
    <section
      id="port-day-decision-engine"
      aria-label="Juneau Port-Day Decision Engine"
      data-timezone={evaluation.timezone}
      data-tz-abbr={tzRes.tzAbbreviation}
      data-utc-offset={tzRes.utcOffsetString}
      data-example-scenario={evaluation.isExampleScenario ? "true" : "false"}
      className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-5 sm:p-6 md:p-8 shadow-2xl"
    >
      {/* 1. Lead with the Question */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            <span>Juneau Port-Day Planner</span>
            <span className="text-slate-500">•</span>
            <span>
              {evaluation.timezone} ({tzRes.tzAbbreviation} UTC{tzRes.utcOffsetString})
            </span>
          </div>
          <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white md:text-3xl">
            What can I realistically do during my Juneau port stop?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            Enter your cruise date, ship arrival, all-aboard time, and dock below to see which single
            excursions, two-activity valley combinations, or independent downtown options fit your hours.
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
            Sources &amp; Verification ({node.evidenceRegistry.length})
          </a>
        </div>
      </div>

      {/* 2. Essential Inputs First */}
      <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              1. Your Trip Date
            </span>
            {!norm.travelDate && (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                Enter Date
              </span>
            )}
          </div>
          <input
            type="date"
            aria-label="Trip Date"
            value={norm.travelDate ?? ""}
            onChange={(e) => {
              const rawVal = e.target.value.trim();
              if (!rawVal) {
                setInput((prev) => ({
                  ...prev,
                  travelDate: null,
                  travelMonth: 7,
                }));
                return;
              }
              const parsedMonth = Number(rawVal.slice(5, 7));
              setInput((prev) => ({
                ...prev,
                travelDate: rawVal,
                travelMonth:
                  Number.isFinite(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
                    ? parsedMonth
                    : prev.travelMonth,
              }));
            }}
            className="mt-1.5 w-full rounded-xl border border-cyan-400/40 bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          />
          <span className="mt-1 block text-[11px] text-slate-400">
            {norm.travelDate
              ? `Using ${norm.travelDate} (${tzRes.tzAbbreviation} UTC${tzRes.utcOffsetString})`
              : "No date entered yet — showing peak-summer example"}
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
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
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            3. All-Aboard Time
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
            Usually 30 min before ship sails
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            4. Cruise Berth / Dock
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
              Downtown Berth (AS / Cruise Terminal CTF)
            </option>
            <option value="franklin_dock">South Franklin Street Dock</option>
            <option value="aj_dock">AJ Dock (~1.2 mi South — Shuttle)</option>
            <option value="tender_anchor">Anchored Out (Water Tender)</option>
            <option value="unknown_dock">
              Dock Unknown (Use Conservative Estimate)
            </option>
            <option value="independent_air_ferry">
              Independent Traveler (No Cruise Ship)
            </option>
          </select>
          <span className="mt-1 block text-[11px] text-slate-400">
            Sets disembark &amp; return queue allowance
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            5. Activity Preference
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
              Compare All Options
            </option>
            <option value="single_activity_focus">One Primary Activity</option>
            <option value="two_activity_combo">Two Activities (Keep Single Alternatives Visible)</option>
            <option value="public_or_free_only">
              Public, Municipal &amp; Free Only
            </option>
          </select>
          <span className="mt-1 block text-[11px] text-slate-400">
            Prioritizes matching options
          </span>
        </label>
      </div>

      {/* Secondary Assumptions & Example Presets */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowAdvancedAssumptions((prev) => !prev)}
          aria-expanded={showAdvancedAssumptions}
          className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
        >
          <span>
            {showAdvancedAssumptions
              ? "Hide More Filters (Return Buffer, Walking/Accessibility, Overnight, Weather Assumption & Budget)"
              : "Adjust Return Buffer, Walking/Accessibility, Overnight Call, Weather Assumption or Budget"}
          </span>
          <span className="text-cyan-300">
            [Buffer: {norm.returnBufferMinutes}m •{" "}
            {norm.overnightPortCall ? "Overnight • " : ""}
            Walking/Access: {norm.mobilityLevel === "unspecified" ? "Any" : norm.mobilityLevel.replace(/_/g, " ")}]
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Try an Example:
          </span>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                travelDate: null,
                shipArrivalTime: "08:00",
                allAboardTime: "16:30",
                arrivalDock: "downtown_walkoff",
                goalMode: "any_single_or_combo",
              })
            }
            className="rounded-lg border border-white/10 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-200 hover:border-cyan-400/40 hover:text-white"
          >
            8.5h Peak Summer (Example)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                travelDate: null,
                shipArrivalTime: "07:00",
                allAboardTime: "12:30",
                arrivalDock: "aj_dock",
                goalMode: "two_activity_combo",
              })
            }
            className="rounded-lg border border-white/10 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-200 hover:border-cyan-400/40 hover:text-white"
          >
            Short 5.5h AJ Dock Call
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                travelDate: null,
                shipArrivalTime: "11:00",
                allAboardTime: "19:00",
                arrivalDock: "unknown_dock",
                goalMode: "any_single_or_combo",
              })
            }
            className="rounded-lg border border-white/10 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-200 hover:border-cyan-400/40 hover:text-white"
          >
            Unknown Dock (8h Call)
          </button>
        </div>
      </div>

      {showAdvancedAssumptions && (
        <div className="mt-3 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/80 p-4 md:grid-cols-3 lg:grid-cols-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Return Buffer Before All-Aboard
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
              <option value={45}>45 min (Tight Cushion)</option>
              <option value={60}>60 min (Standard Cushion)</option>
              <option value={75}>75 min (Conservative)</option>
              <option value={90}>90 min (Recommended Default)</option>
              <option value={120}>120 min (Extra Cushion)</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Walking &amp; Accessibility Need
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
              <option value="unspecified">Any Walking Distance (Not Specified)</option>
              <option value="step_free_wheelchair">
                Need Step-Free / Wheelchair Access
              </option>
              <option value="light_walking_1mi">Up to 1 Mile Walking / Few Steps</option>
              <option value="active_walking_3mi">
                3+ Miles Walking / Active Trails OK
              </option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Overnight Port Stay
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
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Scenario Weather Assumption
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
                No Weather Assumption (Standard)
              </option>
              <option value="clear_high_ceiling">Assume Clear Skies (What-If)</option>
              <option value="low_ceiling_rain_fog">
                Assume Low Clouds / Rain / Fog (What-If)
              </option>
              <option value="provider_telemetry_unavailable">
                Simulate Weather Feed Outage
              </option>
            </select>
            <span className="mt-1 block text-[11px] text-slate-400">
              Scenario assumption only — not live weather
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
          </label>
        </div>
      )}

      {/* Input Validation Errors Banner when invalid time/date entered */}
      {evaluation.inputValidationErrors.length > 0 && (
        <div
          role="alert"
          data-input-validation-errors="true"
          className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-950/40 p-4 text-xs leading-relaxed text-rose-100"
        >
          <div className="font-bold uppercase tracking-wider text-rose-300">
            Please Check Your Port Hours or Date
          </div>
          <ul className="mt-1 space-y-1">
            {evaluation.inputValidationErrors.map((err) => (
              <li key={err}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Concise Answer Banner (Clearly Labeled Example Scenario until Traveler Enters Date) */}
      <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-950/30 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {evaluation.isExampleScenario ? (
              <span
                data-example-scenario-badge="true"
                className="rounded-full border border-amber-400/50 bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-200"
              >
                Example Scenario — Enter Your Trip Date Above
              </span>
            ) : (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Personalized Date: {norm.travelDate} ({tzRes.tzAbbreviation} UTC{tzRes.utcOffsetString})
              </span>
            )}
          </div>
          {tzRes.dstTransitionNote && (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
              {tzRes.dstTransitionNote}
            </span>
          )}
        </div>

        {evaluation.exampleScenarioNotice && (
          <p className="mt-2 text-xs font-medium text-amber-200">
            {evaluation.exampleScenarioNotice}
          </p>
        )}

        <p className="mt-1.5 text-base font-semibold leading-relaxed text-white">
          {evaluation.conciseBottomLine}
        </p>

        {evaluation.weatherAndTelemetryAdvisory.isTravelerScenarioAssumption && (
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            <strong className="text-cyan-200">
              {evaluation.weatherAndTelemetryAdvisory.headline}:
            </strong>{" "}
            {evaluation.weatherAndTelemetryAdvisory.explanation}{" "}
            {evaluation.weatherAndTelemetryAdvisory.neverAllClearRule}
          </p>
        )}
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

      {/* 4. Compact Option Comparisons */}
      <div className="mt-5 space-y-4">
        {evaluation.options.map((option) => {
          const style = FIT_BADGE_STYLES[option.fitStatus];
          const minPrice = option.bookingTransparency.indicativePriceRangePerPersonUsd.min;
          const maxPrice = option.bookingTransparency.indicativePriceRangePerPersonUsd.max;

          return (
            <article
              key={option.optionId}
              data-option-id={option.optionId}
              data-fit-status={option.fitStatus}
              data-double-counting-status={option.timing.durationAudit.doubleCountingStatus}
              className={`rounded-2xl border p-4 sm:p-5 transition ${style.borderClass}`}
            >
              {/* Compact Option Header */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1.5">
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
                  </div>
                  <h3 className="text-lg font-bold text-white md:text-xl">
                    {option.title}
                  </h3>
                  <p className="text-sm text-slate-200">
                    {option.conciseVerdict}
                  </p>
                </div>

                <div className="shrink-0 rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-2.5 lg:text-right">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">
                    Planning Price Range
                  </div>
                  <div className="text-base font-bold text-white">
                    {minPrice === 0 && maxPrice === 0
                      ? "$0 (Free)"
                      : `$${minPrice}–$${maxPrice} / person`}
                  </div>
                  <div className="mt-0.5 max-w-xs text-[11px] text-slate-400">
                    {option.bookingTransparency.durationLabel.split("(")[0].trim()}
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

              {/* Plain-Language Status Separation (Time Fit, Schedule, Dock/Transfer, Preference, Accessibility) */}
              <div
                data-plain-language-statuses={option.optionId}
                className="mt-3 flex flex-wrap gap-2"
              >
                {option.plainLanguageStatuses.map((statusText) => (
                  <span
                    key={statusText}
                    className="rounded-lg border border-white/10 bg-slate-950/70 px-2.5 py-1 text-xs font-medium text-slate-200"
                  >
                    {statusText}
                  </span>
                ))}
              </div>

              {/* Compact Summary Grid: Why It Works / Tradeoff + Walking & Boarding + Citations */}
              <div className="mt-3 grid gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3.5 text-xs md:grid-cols-2">
                <div>
                  <div className="font-semibold text-emerald-300">
                    Why It Works &amp; Key Tradeoff
                  </div>
                  <ul className="mt-1 space-y-1 text-slate-200">
                    {option.supportedReasonsAndTradeoffs.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="font-semibold text-cyan-300">
                      Walking, Boarding &amp; Accessibility
                    </div>
                    <p className="mt-1 text-slate-200">
                      {option.accessibilityDetails.walkingAndTerrain}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {option.accessibilityDetails.confirmationNote}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Sources:
                    </span>
                    {option.supportingCitations.map((cite) => (
                      <a
                        key={cite.citationId}
                        href={`#cite-${cite.citationId}`}
                        className="inline-flex items-center gap-1 rounded border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-200 hover:bg-cyan-500/20"
                      >
                        [{cite.citationId}]
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Only render recent review block on individual card when recent reviews are present or checked */}
              {option.recentReviewSummary.state !== "unavailable" && (
                <div
                  className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs"
                  data-review-summary-state={option.recentReviewSummary.state}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold uppercase tracking-wider text-cyan-300">
                      {option.recentReviewSummary.statusHeadline}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Window: {option.recentReviewSummary.windowStartDate} →{" "}
                      {option.recentReviewSummary.windowEndDate} (
                      {option.recentReviewSummary.eligibleRecentCount} eligible)
                    </span>
                  </div>
                  <p className="mt-1 text-slate-300">
                    {option.recentReviewSummary.statusDetail}
                  </p>
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
              )}

              {/* Expandable Section 1: Detailed Time Calculations, Assumptions & 8-Input Evidence Audit */}
              <details
                className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs"
                data-option-fact-audit={option.optionId}
              >
                <summary className="cursor-pointer font-semibold text-cyan-300 hover:text-cyan-200">
                  Time Breakdown, Planning Assumptions &amp; Source Audit (Est. Back at Dock{" "}
                  {option.timing.estimatedBackAtDockRangeText} •{" "}
                  {option.timing.netMarginMinutes >= 0
                    ? `+${option.timing.netMarginMinutes} min margin`
                    : `${option.timing.netMarginMinutes} min deficit`}
                  )
                </summary>
                <div className="mt-3 space-y-3 border-t border-white/10 pt-3 text-slate-300">
                  <div>
                    <div className="font-semibold text-white">
                      {option.timing.durationAudit.decompositionLabel}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Port Window:{" "}
                        <strong className="text-white">
                          {option.timing.totalPortWindowMinutes}m ({option.timing.tzAbbreviation})
                        </strong>
                      </span>
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Disembark Allowance:{" "}
                        <strong className="text-white">
                          {option.timing.disembarkationAndDockMinutes}m
                        </strong>
                      </span>
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Check-In:{" "}
                        <strong className="text-white">
                          {option.timing.checkInLeadMinutes}m
                        </strong>
                      </span>
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Outbound Transfer:{" "}
                        <strong className="text-white">
                          {option.timing.outboundTransferMinutes}m ({option.timing.durationAudit.outboundTransferRangeMinutes.min}–{option.timing.durationAudit.outboundTransferRangeMinutes.max}m est.)
                        </strong>
                      </span>
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Core Activity:{" "}
                        <strong className="text-white">
                          {option.timing.activityDurationMinutes}m
                        </strong>
                      </span>
                      {option.timing.interActivityTransferMinutes > 0 && (
                        <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                          Valley Link:{" "}
                          <strong className="text-white">
                            {option.timing.interActivityTransferMinutes}m
                          </strong>
                        </span>
                      )}
                      <span className="rounded-md border border-white/10 bg-slate-900 px-2 py-1">
                        Return Transfer:{" "}
                        <strong className="text-white">
                          {option.timing.returnTransferMinutes}m ({option.timing.durationAudit.returnTransferRangeMinutes.min}–{option.timing.durationAudit.returnTransferRangeMinutes.max}m est.)
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
                    <p className="mt-2 text-[11px] text-slate-300">
                      {option.timing.durationAudit.decompositionNote}
                    </p>
                    <p className="mt-1 text-[11px] text-amber-200/90">
                      <strong>Transfer &amp; Return Time Uncertainty:</strong>{" "}
                      {option.timing.durationAudit.transferAndReturnUncertaintyNote}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2.5">
                      <div className="font-semibold text-white">Assumptions Used</div>
                      <ul className="mt-1 space-y-1 text-[11px]">
                        {option.assumptionsUsed.map((assumption) => (
                          <li key={assumption}>• {assumption}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2.5">
                      <div className="font-semibold text-amber-300">
                        Needs Confirmation
                      </div>
                      <ul className="mt-1 space-y-1 text-[11px]">
                        {option.uncertainOrNeedsConfirmation.map((unc) => (
                          <li key={unc}>• {unc}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-900/70 p-2.5">
                      <div className="font-semibold text-cyan-300">
                        What Changes This Result
                      </div>
                      <ul className="mt-1 space-y-1 text-[11px]">
                        {option.whatInputChangeWouldAlterResult.map((change) => (
                          <li key={change}>→ {change}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 8-Input Evidence Basis Grid */}
                  <div>
                    <div className="font-semibold text-white">
                      Source &amp; Estimate Basis for All {option.inputAudit.length} Planning Inputs
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
                  </div>
                </div>
              </details>

              {/* Expandable Section 2: Optional Booking & Official Provider Links */}
              <details className="mt-2 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs">
                <summary className="cursor-pointer font-semibold text-slate-200 hover:text-white">
                  Optional Booking &amp; Direct Provider Links ({option.bookingTransparency.channels.length} options —{" "}
                  {option.bookingTransparency.priceBasis})
                </summary>
                <div className="mt-3 space-y-2.5 border-t border-white/10 pt-3">
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>
                      <strong className="text-slate-100">Operators:</strong>{" "}
                      {option.bookingTransparency.actualOperators.join(", ")}
                    </div>
                    <div>
                      <strong className="text-slate-100">Inclusions:</strong>{" "}
                      {option.bookingTransparency.inclusions.join("; ")} •{" "}
                      <strong className="text-slate-100">Meeting Point:</strong>{" "}
                      {option.bookingTransparency.meetingArrangements}
                    </div>
                    <div>
                      <strong className="text-slate-100">Cancellation Terms:</strong>{" "}
                      {option.bookingTransparency.cancellationConditions}{" "}
                      <span className="text-slate-400">
                        ({option.bookingTransparency.detailsFreshnessNote})
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2.5 md:grid-cols-2">
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
              </details>
            </article>
          );
        })}
      </div>

      {/* Concise Footer Disclosures (Single-place disclosure for reviews & coverage) */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-300 space-y-1.5">
        <p>
          <strong className="text-amber-300">
            Time Fit vs. Operational Confirmation:
          </strong>{" "}
          Fitting your time budget means the activity, estimated transfers, check-in, and return buffer fit within your port hours. It does not confirm operator departure schedules, seat availability, individual accessibility, or weather dispatch.
        </p>
        {allReviewsUnavailable && (
          <p data-review-summary-state="unavailable">
            <strong className="text-slate-200">Recent 180-Day Guest Reviews:</strong>{" "}
            Recent reviews unavailable (third-party review cache is not currently populated for Juneau; DCC omits review summaries rather than displaying sample or unverified text).
          </p>
        )}
        <p>
          <strong className="text-white">Coverage &amp; Independence:</strong>{" "}
          {evaluation.coverageDisclosures.coverageLimits.join(" ")}{" "}
          {evaluation.coverageDisclosures.commercialIndependenceStatement}
        </p>
      </div>
    </section>
  );
}
