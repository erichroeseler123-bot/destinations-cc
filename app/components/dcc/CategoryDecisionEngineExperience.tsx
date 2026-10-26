"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDecisionEngineById } from "@/lib/dcc/decisionEngines/registry";
import type {
  DecisionEngineCategoryId,
  DecisionResult,
  EvaluatedViableOption,
  QuestionDefinition,
} from "@/lib/dcc/decisionEngines/types";

export interface CategoryDecisionEngineExperienceProps {
  engineId: DecisionEngineCategoryId;
  initialAnswers?: Record<string, unknown>;
  initialResult: DecisionResult<Record<string, unknown>>;
}

function parseQuerySearchParamsForQuestions(
  search: string,
  questions: QuestionDefinition[],
): Record<string, unknown> {
  const params = new URLSearchParams(search);
  const parsed: Record<string, unknown> = {};
  const qMap = new Map(questions.map((q) => [q.questionId, q]));
  for (const [key, rawVal] of params.entries()) {
    const q = qMap.get(key);
    if (!q) continue;
    if (rawVal === "null" || rawVal === "") {
      parsed[key] = null;
    } else if (q.inputType === "boolean") {
      parsed[key] = rawVal === "true";
    } else if (
      q.inputType === "number" ||
      (q.inputType === "select" && typeof q.defaultValue === "number")
    ) {
      const n = Number(rawVal);
      if (!Number.isNaN(n)) parsed[key] = n;
    } else {
      parsed[key] = rawVal;
    }
  }
  return parsed;
}

function formatSellerBadge(sellerType: string): string {
  switch (sellerType) {
    case "direct_operator":
      return "Direct Operator";
    case "dcc_owned_specialist":
      return "DCC Owned Specialist Site";
    case "affiliate_marketplace":
      return "Approved Affiliate Seller";
    case "public_or_diy":
      return "Official Public / Noncommercial Resource";
    default:
      return sellerType;
  }
}

export default function CategoryDecisionEngineExperience({
  engineId,
  initialAnswers,
  initialResult,
}: CategoryDecisionEngineExperienceProps) {
  const engine = useMemo(() => getDecisionEngineById(engineId), [engineId]);

  const [answers, setAnswers] = useState<Record<string, unknown>>(() => ({
    ...(engine?.defaultExampleInput as Record<string, unknown>),
    ...(initialAnswers ?? {}),
  }));

  const [presetNote, setPresetNote] = useState<string | null>(null);
  const hasUserUpdatedRef = useRef(false);

  useEffect(() => {
    if (!engine || typeof window === "undefined") return;
    if (window.location.search.length > 1) {
      const fromUrl = parseQuerySearchParamsForQuestions(
        window.location.search,
        engine.questions,
      );
      if (Object.keys(fromUrl).length > 0) {
        setAnswers((prev) => ({ ...prev, ...fromUrl }));
      }
    }
  }, [engine]);

  useEffect(() => {
    if (!engine || !hasUserUpdatedRef.current || typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    for (const q of engine.questions) {
      const val = answers[q.questionId];
      if (val === null || val === undefined || val === "") {
        params.delete(q.questionId);
      } else {
        params.set(q.questionId, String(val));
      }
    }
    const qs = params.toString();
    const nextUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [engine, answers]);

  const evaluation = useMemo<DecisionResult<Record<string, unknown>>>(() => {
    if (!engine) return initialResult;
    try {
      return engine.evaluate(answers) as DecisionResult<Record<string, unknown>>;
    } catch {
      return initialResult;
    }
  }, [engine, answers, initialResult]);

  if (!engine) {
    return null;
  }

  const updateAnswersFromUser = (
    updater:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>),
  ) => {
    hasUserUpdatedRef.current = true;
    setAnswers(updater);
  };

  const handleQuestionChange = (q: QuestionDefinition, rawVal: string | boolean) => {
    setPresetNote(null);
    updateAnswersFromUser((prev) => {
      if (q.inputType === "boolean") {
        return { ...prev, [q.questionId]: Boolean(rawVal) };
      }
      if (q.inputType === "number") {
        const str = String(rawVal).trim();
        if (str === "") {
          return { ...prev, [q.questionId]: null };
        }
        const num = Number(str);
        return {
          ...prev,
          [q.questionId]: Number.isNaN(num) ? q.defaultValue : num,
        };
      }
      if (q.inputType === "date") {
        const str = String(rawVal).trim();
        return { ...prev, [q.questionId]: str.length > 0 ? str : null };
      }
      if (q.inputType === "select" && typeof q.defaultValue === "number") {
        const num = Number(rawVal);
        return {
          ...prev,
          [q.questionId]: Number.isNaN(num) ? q.defaultValue : num,
        };
      }
      return { ...prev, [q.questionId]: rawVal };
    });
  };

  const commercialViableOptions = evaluation.viableOptions.filter(
    (opt) => opt.optionKind !== "public_or_diy",
  );
  const noncommercialViableOptions = evaluation.viableOptions.filter(
    (opt) => opt.optionKind === "public_or_diy",
  );

  return (
    <div
      className="mx-auto max-w-6xl px-4 py-8 text-slate-100"
      data-testid={`category-decision-engine-${engine.engineId}`}
    >
      {/* Hero & Machine-Readable Governance Header */}
      <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-cyan-300">
          <span className="rounded-full border border-cyan-500/40 bg-cyan-950/60 px-3 py-1">
            DCC Category Decision Engine · v{engine.version}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-slate-300">
            {engine.destinationName}
          </span>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-950/50 px-3 py-1 text-emerald-300">
            Zero Commercial Ranking Bias
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
          {engine.title}
        </h1>
        <p className="mt-3 text-lg font-medium text-cyan-200">
          {engine.heroQuestion}
        </p>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-300">
          {engine.summaryDescription}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>
            Engine ID: <code className="text-slate-200">{engine.engineId}</code>
          </span>
          <span>·</span>
          <a
            href={`/api/v1/decision-engines/${engine.engineId}`}
            className="text-cyan-300 underline hover:text-cyan-200"
          >
            Engine Definition JSON
          </a>
          <span>·</span>
          <a
            href={`/api/v1/decision-engines/${engine.engineId}/evaluate`}
            className="text-cyan-300 underline hover:text-cyan-200"
          >
            Deterministic Evaluate API
          </a>
          <span>·</span>
          <a
            href="/api/v1/decision-engines"
            className="text-cyan-300 underline hover:text-cyan-200"
          >
            All DCC Decision Engines
          </a>
        </div>
      </header>

      {/* PART 1: Pre-Question Category Reference Guide (Useful before answering any questions) */}
      <section
        aria-label="Category Reference Guide"
        className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        data-testid="pre-question-reference-guide"
      >
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white">
              1. Category Reference Guide & Cross-Option Comparison
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Review verified operating rules, vessel/experience types, departure harbors, and side-by-side specifications before running your personalized evaluation below.
            </p>
          </div>
          <span className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
            Sources verified: {evaluation.evidenceHealth.currentCount}/
            {engine.sourceRecords.length} current
          </span>
        </div>

        {/* Important Decision Factors */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {engine.referenceGuide.importantDecisionFactors.map((factor) => (
            <div
              key={factor.title}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <h3 className="text-sm font-semibold text-cyan-300">
                {factor.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                {factor.detail}
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                Sources: {factor.sourceIds.join(", ")}
              </div>
            </div>
          ))}
        </div>

        {/* Major Vessel / Experience Types & Departure Locations */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-200">
              Major Boat / Experience Types
            </h3>
            <div className="space-y-3">
              {engine.referenceGuide.experienceAndVesselTypes.map((item) => (
                <div
                  key={item.typeName}
                  className="border-b border-slate-800/80 pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="text-sm font-semibold text-white">
                    {item.typeName}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-300">
                    <span className="text-slate-400">Stability & Capacity:</span>{" "}
                    {item.capacityAndStability}
                  </div>
                  <div className="mt-0.5 text-xs text-emerald-300">
                    <span className="text-slate-400">Best for:</span> {item.bestFor}
                  </div>
                  <div className="mt-0.5 text-xs text-amber-300">
                    <span className="text-slate-400">Limitation:</span>{" "}
                    {item.limitations}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-200">
                Departure Harbors & Staging Corridors
              </h3>
              <div className="space-y-2.5">
                {engine.referenceGuide.departureLocations.map((loc) => (
                  <div
                    key={`${loc.islandOrRegion}-${loc.harborOrArea}`}
                    className="border-b border-slate-800/80 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="text-xs font-semibold text-cyan-200">
                      {loc.islandOrRegion} — {loc.harborOrArea}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-300">
                      {loc.logisticsNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="mb-2.5 text-sm font-bold uppercase tracking-wider text-slate-200">
                Common Tradeoffs & Operational Dependencies
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {engine.referenceGuide.commonTradeoffs.map((t) => (
                  <li key={t.tradeoff}>
                    <strong className="text-white">{t.tradeoff}:</strong>{" "}
                    {t.explanation}
                  </li>
                ))}
                {engine.referenceGuide.operationalDependencies.map((dep) => (
                  <li key={dep.dependency} className="text-amber-200/90">
                    <strong className="text-amber-300">
                      Operational Dependency ({dep.dependency}):
                    </strong>{" "}
                    {dep.impact}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Cross-Option Reference Comparison Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
          <table
            className="w-full min-w-[760px] border-collapse text-left text-xs"
            data-testid="cross-option-comparison-table"
          >
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-200">
                <th className="p-3 font-semibold">Candidate Option</th>
                {engine.comparisonDimensions.map((dim) => (
                  <th key={dim.dimensionId} className="p-3 font-semibold">
                    {dim.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {engine.candidateOptions.map((opt) => (
                <tr key={opt.optionId} className="hover:bg-slate-900/50">
                  <td className="p-3 font-semibold text-white">
                    <div>{opt.shortLabel}</div>
                    <div className="mt-0.5 text-[11px] font-normal text-slate-400">
                      {opt.actualOperators.join(", ")}
                    </div>
                  </td>
                  {engine.comparisonDimensions.map((dim) => (
                    <td key={dim.dimensionId} className="p-3 text-slate-300">
                      {opt.comparisonValues[dim.dimensionId] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PART 2: Interactive Category Decision Engine Questionnaire */}
      <section
        aria-label="Interactive Decision Engine"
        className="mb-10 rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-xl"
        data-testid="interactive-questionnaire-section"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">
              2. Check Your Specific Trip Constraints
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Hard constraints (seasonality, island/harbor, time window & return buffer, child age, pregnancy/spinal safety, mobility, rough-water exclusions, budget) eliminate incompatible options first. Preferences rank only viable options.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPresetNote(null);
              updateAnswersFromUser({
                ...(engine.defaultExampleInput as Record<string, unknown>),
              });
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            Reset to Labeled Example
          </button>
        </div>

        {/* Representative Quick Scenario Presets for Hawaii Whale Watching */}
        {engine.engineId === "hawaii-whale-watching" && (
          <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Test Representative Traveler Scenarios:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="preset-hi-hotel-comfort"
                onClick={() => {
                  setPresetNote(
                    "Scenario: Waikīkī hotel guest on Oʻahu requiring operator shuttle pickup and maximum hull stability.",
                  );
                  updateAnswersFromUser({
                    ...(engine.defaultExampleInput as Record<string, unknown>),
                    island: "oahu",
                    departureArea: "honolulu_kewalo",
                    travelDate: "2027-02-10",
                    travelMonth: 2,
                    startingPoint: "hotel_resort",
                    needsHotelOrPierTransfer: true,
                    seasicknessOrRoughWaterConcern: "high_concern",
                    priorityMode: "comfort_and_stability",
                  });
                }}
                className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-xs text-cyan-200 hover:bg-cyan-900/50"
              >
                1. Hotel Guest Prioritizing Stability (Oʻahu)
              </button>
              <button
                type="button"
                data-testid="preset-hi-cruise-strict"
                onClick={() => {
                  setPresetNote(
                    "Scenario: Maui cruise passenger with 240-minute total window and strict 60-minute all-aboard buffer.",
                  );
                  updateAnswersFromUser({
                    ...(engine.defaultExampleInput as Record<string, unknown>),
                    island: "maui",
                    departureArea: "any",
                    travelDate: "2027-02-14",
                    travelMonth: 2,
                    startingPoint: "cruise_ship_pier",
                    availableWindowMinutes: 240,
                    cruiseReturnBufferMinutes: 60,
                  });
                }}
                className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-xs text-cyan-200 hover:bg-cyan-900/50"
              >
                2. Cruise Passenger w/ Strict Buffer (Maui)
              </button>
              <button
                type="button"
                data-testid="preset-hi-young-children"
                onClick={() => {
                  setPresetNote(
                    "Scenario: Family on Maui with a 2-year-old toddler (eliminates RIB raft 5+ and Trilogy 3+).",
                  );
                  updateAnswersFromUser({
                    ...(engine.defaultExampleInput as Record<string, unknown>),
                    island: "maui",
                    travelDate: "2027-02-18",
                    travelMonth: 2,
                    groupSize: 4,
                    youngestChildAgeYears: 2,
                  });
                }}
                className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-xs text-cyan-200 hover:bg-cyan-900/50"
              >
                3. Family w/ 2-Yr-Old Child
              </button>
              <button
                type="button"
                data-testid="preset-hi-wheelchair"
                onClick={() => {
                  setPresetNote(
                    "Scenario: Traveler requiring step-free wheelchair ramp boarding on Maui.",
                  );
                  updateAnswersFromUser({
                    ...(engine.defaultExampleInput as Record<string, unknown>),
                    island: "maui",
                    travelDate: "2027-02-20",
                    travelMonth: 2,
                    mobilityLevel: "step_free_wheelchair",
                  });
                }}
                className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-xs text-cyan-200 hover:bg-cyan-900/50"
              >
                4. Step-Free Wheelchair Access
              </button>
              <button
                type="button"
                data-testid="preset-hi-rough-water"
                onClick={() => {
                  setPresetNote(
                    "Scenario: Traveler concerned about rough water & afternoon trade-wind chop.",
                  );
                  updateAnswersFromUser({
                    ...(engine.defaultExampleInput as Record<string, unknown>),
                    island: "maui",
                    travelDate: "2027-02-22",
                    travelMonth: 2,
                    seasicknessOrRoughWaterConcern: "high_concern",
                    departureTimeOfDay: "afternoon_trades",
                  });
                }}
                className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-xs text-cyan-200 hover:bg-cyan-900/50"
              >
                5. High Seasickness / Rough-Water Concern
              </button>
              <button
                type="button"
                data-testid="preset-hi-unverified-date"
                onClick={() => {
                  setPresetNote(
                    "Scenario: Far-future date (2028-02-15) beyond verified 2026–2027 operator tariff schedules.",
                  );
                  updateAnswersFromUser({
                    ...(engine.defaultExampleInput as Record<string, unknown>),
                    island: "maui",
                    travelDate: "2028-02-15",
                    travelMonth: 2,
                  });
                }}
                className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-2.5 py-1 text-xs text-amber-200 hover:bg-amber-900/50"
              >
                6. Unverified Future Schedule Date (2028)
              </button>
              <button
                type="button"
                data-testid="preset-hi-offseason-none"
                onClick={() => {
                  setPresetNote(
                    "Scenario: Off-season August travel date (2026-08-15) when North Pacific humpbacks have migrated back to Alaska.",
                  );
                  updateAnswersFromUser({
                    ...(engine.defaultExampleInput as Record<string, unknown>),
                    island: "maui",
                    travelDate: "2026-08-15",
                    travelMonth: 8,
                  });
                }}
                className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-2.5 py-1 text-xs text-rose-200 hover:bg-rose-900/50"
              >
                7. No Tour Responsibly Recommended (August Off-Season)
              </button>
            </div>
            {presetNote && (
              <div className="mt-2 text-xs font-medium text-cyan-300">
                Active Scenario: {presetNote}
              </div>
            )}
          </div>
        )}

        {/* Questions Form Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {engine.questions.map((q) => {
            const currentVal = answers[q.questionId];
            return (
              <div
                key={q.questionId}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5"
              >
                <label
                  htmlFor={`q-${engine.engineId}-${q.questionId}`}
                  className="block text-xs font-semibold text-white"
                >
                  {q.label}
                  {q.requiredForPersonalizedVerdict && (
                    <span className="ml-1.5 rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] font-normal text-cyan-300">
                      Key Input
                    </span>
                  )}
                </label>
                <p className="mt-1 text-[11px] text-slate-400">{q.helpText}</p>

                <div className="mt-2">
                  {q.inputType === "select" && q.options ? (
                    <select
                      id={`q-${engine.engineId}-${q.questionId}`}
                      value={currentVal === null || currentVal === undefined ? "" : String(currentVal)}
                      onChange={(e) => handleQuestionChange(q, e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    >
                      {q.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : q.inputType === "boolean" ? (
                    <select
                      id={`q-${engine.engineId}-${q.questionId}`}
                      value={currentVal ? "true" : "false"}
                      onChange={(e) =>
                        handleQuestionChange(q, e.target.value === "true")
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  ) : q.inputType === "date" ? (
                    <input
                      id={`q-${engine.engineId}-${q.questionId}`}
                      type="date"
                      value={typeof currentVal === "string" ? currentVal : ""}
                      onChange={(e) => handleQuestionChange(q, e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  ) : q.inputType === "time" ? (
                    <input
                      id={`q-${engine.engineId}-${q.questionId}`}
                      type="time"
                      value={typeof currentVal === "string" ? currentVal : ""}
                      onChange={(e) => handleQuestionChange(q, e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  ) : (
                    <input
                      id={`q-${engine.engineId}-${q.questionId}`}
                      type="number"
                      min={q.min}
                      max={q.max}
                      placeholder="Optional"
                      value={
                        currentVal === null || currentVal === undefined
                          ? ""
                          : String(currentVal)
                      }
                      onChange={(e) => handleQuestionChange(q, e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PART 3: Example Scenario Banner & Decision Verdict */}
      <section
        aria-label="Decision Verdict"
        className="mb-8"
        data-testid="decision-verdict-section"
      >
        {evaluation.isExampleScenario && evaluation.exampleScenarioBanner && (
          <div
            className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-200"
            data-testid="example-scenario-banner"
          >
            <strong className="font-semibold text-amber-100">
              Labeled Example Scenario:{" "}
            </strong>
            {evaluation.exampleScenarioBanner}
          </div>
        )}

        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Deterministic Decision Summary
          </div>
          <h2
            className="mt-1 text-xl font-bold text-white"
            data-testid="concise-verdict-heading"
          >
            {evaluation.conciseVerdict}
          </h2>

          {evaluation.noTourResponsiblyRecommendedReason && (
            <div
              className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-200"
              data-testid="no-tour-recommended-alert"
            >
              <strong className="font-semibold text-rose-100">
                Why no commercial tour is recommended for these inputs:{" "}
              </strong>
              {evaluation.noTourResponsiblyRecommendedReason}
            </div>
          )}

          {evaluation.decisionChangingWarnings.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Decision-Changing Operational & Schedule Notes
              </div>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-amber-100">
                {evaluation.decisionChangingWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* PART 4: Viable Commercial Options */}
      <section
        aria-label="Viable Tour Options"
        className="mb-10"
        data-testid="viable-options-section"
      >
        <h2 className="mb-4 text-xl font-bold text-white">
          3. Viable Commercial Options ({commercialViableOptions.length})
        </h2>

        {commercialViableOptions.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
            No commercial tour passed every hard constraint for your current inputs. Inspect the Eliminated Options section below to see exact reasons and what input change would open options.
          </div>
        ) : (
          <div className="space-y-5">
            {commercialViableOptions.map((opt: EvaluatedViableOption, idx: number) => (
              <div
                key={opt.optionId}
                data-testid={`viable-option-card-${opt.optionId}`}
                className={`rounded-2xl border p-5 ${
                  idx === 0
                    ? "border-emerald-500/50 bg-slate-900/95 shadow-lg"
                    : "border-slate-800 bg-slate-900/75"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          opt.fitTier === "best_fit"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : opt.fitTier === "qualified_fit"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        }`}
                      >
                        {opt.fitTier === "best_fit"
                          ? "Best Fit for Your Constraints"
                          : opt.fitTier === "qualified_fit"
                            ? "Qualified Fit (Needs Confirmation)"
                            : "Viable Alternative"}
                      </span>
                      <span className="text-xs text-slate-400">
                        Preference Score: {opt.preferenceScore} pts (0 commercial weight)
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-white">
                      {opt.title}
                    </h3>
                    <div className="mt-0.5 text-xs text-slate-300">
                      Actual Operator(s):{" "}
                      <strong className="text-white">
                        {opt.actualOperators.join(", ")}
                      </strong>{" "}
                      · Vessel/Vehicle: {opt.vesselOrVehicleType}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold text-emerald-300">
                      ${opt.indicativePriceUsd.min}–${opt.indicativePriceUsd.max}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {opt.indicativePriceUsd.basisLabel}
                    </div>
                  </div>
                </div>

                {/* Why It Fits & Tradeoffs */}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <div className="text-xs font-semibold text-emerald-300">
                      Why This Option Fits Your Inputs
                    </div>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-slate-200">
                      {opt.whyItFits.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <div className="text-xs font-semibold text-amber-300">
                      Key Tradeoffs & Limitations
                    </div>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-slate-300">
                      {opt.tradeoffs.limitations.map((lim) => (
                        <li key={lim}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recent Dated Review Evidence (Truthful 180-day status; never fabricates summaries when no recent reviews exist) */}
                {opt.reviewEvidence && (
                  <div
                    className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3.5 text-xs"
                    data-testid={`review-evidence-${opt.optionId}`}
                  >
                    {opt.reviewEvidence.summaryResult.state === "thematic_summary" ||
                    opt.reviewEvidence.summaryResult.state === "limited_recent_data" ? (
                      <>
                        <div className="font-semibold text-cyan-200">
                          Recent Dated Guest Review Evidence (
                          {opt.reviewEvidence.summaryResult.eligibleRecentCount}{" "}
                          verified reviews between{" "}
                          {opt.reviewEvidence.summaryResult.coveredDateRange?.earliest ?? "—"}{" "}
                          and{" "}
                          {opt.reviewEvidence.summaryResult.coveredDateRange?.latest ?? "—"})
                        </div>
                        <div className="mt-1 text-slate-300">
                          {opt.reviewEvidence.summaryResult.positives.length > 0 && (
                            <span>
                              Recurring themes:{" "}
                              {opt.reviewEvidence.summaryResult.positives
                                .map((t) => `${t.topicLabel} (${t.supportingReviewIds.length})`)
                                .join(", ")}
                              .{" "}
                            </span>
                          )}
                          <span className="text-slate-400">
                            {opt.reviewEvidence.summaryResult.statusDetail}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-300">
                        <strong className="text-cyan-200">
                          {opt.reviewEvidence.summaryResult.state === "no_recent_reviews"
                            ? "No recent reviews found"
                            : "Recent reviews unavailable"}:
                        </strong>{" "}
                        {opt.reviewEvidence.summaryResult.statusDetail} (No review summary generated when 180-day recent reviews are absent.)
                      </div>
                    )}
                  </div>
                )}

                {/* Booking Destinations (Displayed AFTER decision evidence) */}
                <div className="mt-4 border-t border-slate-800 pt-3.5">
                  <div className="mb-2 text-xs font-semibold text-slate-300">
                    Booking & Execution Options (Listed after decision fit — commercial status never alters ranking):
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {opt.bookingDestinations.map((dest) => (
                      <a
                        key={dest.destinationId}
                        href={dest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-col rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs hover:border-cyan-400"
                      >
                        <span className="font-semibold text-cyan-300">
                          {dest.label} →
                        </span>
                        <span className="mt-0.5 text-[11px] text-slate-400">
                          {formatSellerBadge(dest.sellerType)}: {dest.sellerName}{" "}
                          · Operator: {dest.actualOperatorName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {dest.relationshipDisclosure}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PART 5: Noncommercial / Public Alternatives */}
      {noncommercialViableOptions.length > 0 && (
        <section
          aria-label="Noncommercial Alternatives"
          className="mb-10"
          data-testid="noncommercial-alternatives-section"
        >
          <h2 className="mb-3 text-xl font-bold text-white">
            4. Official Noncommercial & Self-Guided Alternatives (
            {noncommercialViableOptions.length})
          </h2>
          <div className="space-y-4">
            {noncommercialViableOptions.map((opt) => (
              <div
                key={opt.optionId}
                data-testid={`noncommercial-option-${opt.optionId}`}
                className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-teal-200">
                    {opt.title}
                  </h3>
                  <span className="rounded-full border border-teal-500/40 bg-teal-950 px-3 py-0.5 text-xs font-semibold text-teal-300">
                    {opt.indicativePriceUsd.basisLabel}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-200">
                  {opt.timingCalculation.summary}
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold text-teal-300">
                      Strengths
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-200">
                      {opt.tradeoffs.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-amber-300">
                      Important Limitations vs. Boat/Flight Tours
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-300">
                      {opt.tradeoffs.limitations.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {opt.bookingDestinations.map((dest) => (
                    <a
                      key={dest.destinationId}
                      href={dest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-teal-500/40 bg-slate-950 px-3 py-1.5 text-xs font-medium text-teal-300 hover:border-teal-300"
                    >
                      {dest.label} ({dest.sellerName}) →
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PART 6: Eliminated Options & Exact Reasons */}
      <section
        aria-label="Eliminated Options"
        className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        data-testid="eliminated-options-section"
      >
        <h2 className="text-xl font-bold text-white">
          5. Eliminated Options & Exact Hard-Constraint Reasons (
          {evaluation.eliminatedOptions.length})
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          A high preference score never overrides a failed hard constraint. Every eliminated option shows why it was ruled out and what input change would make it viable.
        </p>

        {evaluation.eliminatedOptions.length === 0 ? (
          <p className="mt-3 text-xs text-emerald-300">
            All candidate options in this category passed your current hard constraints.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {evaluation.eliminatedOptions.map((elim) => (
              <div
                key={elim.optionId}
                data-testid={`eliminated-option-${elim.optionId}`}
                className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-rose-200">
                    {elim.title}
                  </div>
                  <span className="text-[11px] text-rose-300">
                    Failed rules: {elim.failedHardConstraintIds.join(", ")}
                  </span>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-200">
                  {elim.eliminationReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                {elim.whatInputChangeWouldAlterResult.length > 0 && (
                  <div className="mt-2 text-xs text-cyan-200">
                    <strong>How to unlock:</strong>{" "}
                    {elim.whatInputChangeWouldAlterResult.join(" ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PART 7: Unknown or Stale Facts & Expandable Sources / Methodology */}
      <section
        aria-label="Unknown Facts, Sources, and Methodology"
        className="space-y-4"
        data-testid="sources-and-methodology-section"
      >
        {evaluation.unknownOrStaleFacts.length > 0 && (
          <div
            className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4"
            data-testid="unknown-or-stale-facts-panel"
          >
            <h3 className="text-sm font-bold text-amber-200">
              Explicit Unknowns, Unverified Schedules & Stale-Source Qualifications (
              {evaluation.unknownOrStaleFacts.length})
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-200">
              {evaluation.unknownOrStaleFacts.map((fact) => (
                <li key={fact.factId}>
                  <span className="rounded bg-amber-900/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-200">
                    {fact.category}
                  </span>{" "}
                  <strong>{fact.summary}</strong> — {fact.impactOnDecision}
                </li>
              ))}
            </ul>
          </div>
        )}

        <details
          open
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <summary className="cursor-pointer text-base font-bold text-white">
            6. Verified Sources, Claim Classifications & Decision Methodology (
            {evaluation.sourceReferences.length} Sources)
          </summary>

          <div className="mt-4 space-y-4 text-xs text-slate-300">
            <div>
              <h4 className="font-semibold text-cyan-300">
                Deterministic Evaluation Methodology
              </h4>
              <ul className="mt-1.5 space-y-1 pl-4">
                {engine.referenceGuide.methodologySteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
              <p className="mt-2 text-slate-400">
                {evaluation.commercialNeutrality.disclosure}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-200">
                    <th className="py-2 pr-3">Source ID & Organization</th>
                    <th className="py-2 pr-3">Document / Rule</th>
                    <th className="py-2 pr-3">Freshness Category</th>
                    <th className="py-2 pr-3">Verified / Expires</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {evaluation.sourceReferences.map((src) => (
                    <tr key={src.sourceId}>
                      <td className="py-2 pr-3 font-medium text-white">
                        <div>{src.sourceOrganization}</div>
                        <code className="text-[10px] text-slate-400">
                          {src.sourceId}
                        </code>
                      </td>
                      <td className="py-2 pr-3">
                        <a
                          href={src.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-300 underline hover:text-cyan-200"
                        >
                          {src.sourceTitle}
                        </a>
                      </td>
                      <td className="py-2 pr-3 text-slate-400">
                        {src.freshnessCategory}
                      </td>
                      <td className="py-2 pr-3 text-slate-400">
                        Verified: {src.verifiedAt.slice(0, 10)} · Expires:{" "}
                        {src.expiresAt.slice(0, 10)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            src.status === "current"
                              ? "bg-emerald-950 text-emerald-300"
                              : "bg-amber-950 text-amber-300"
                          }`}
                        >
                          {src.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
