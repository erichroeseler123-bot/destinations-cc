"use client";

import React, { useMemo, useState } from "react";
import {
  DEFAULT_ST_THOMAS_SCENARIO_INPUT,
  evaluateStThomasPortDayScenario,
  parseStThomasScenarioFromSearchParams,
  type StThomasArrivalDock,
  type StThomasExcursionFocus,
  type StThomasMobilityLevel,
  type StThomasOptionFitStatus,
  type StThomasPortDayScenarioInput,
} from "@/lib/dcc/stThomasPortDayEngine";

interface StThomasPortDayPlannerProps {
  initialSearchParams?: Record<string, string | string[] | undefined>;
}

const FIT_BADGE_CLASSES: Record<StThomasOptionFitStatus, string> = {
  fits_comfortably:
    "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  qualified_needs_confirmation:
    "border-sky-400/40 bg-sky-500/15 text-sky-200",
  tight_buffer: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  does_not_fit: "border-rose-400/40 bg-rose-500/15 text-rose-200",
};

export default function StThomasPortDayPlanner({
  initialSearchParams,
}: StThomasPortDayPlannerProps) {
  const [input, setInput] = useState<Required<StThomasPortDayScenarioInput>>(
    () =>
      initialSearchParams
        ? parseStThomasScenarioFromSearchParams(initialSearchParams)
        : DEFAULT_ST_THOMAS_SCENARIO_INPUT,
  );
  const [childAgesText, setChildAgesText] = useState<string>(() =>
    (initialSearchParams
      ? parseStThomasScenarioFromSearchParams(initialSearchParams).childAges
      : DEFAULT_ST_THOMAS_SCENARIO_INPUT.childAges
    ).join(", "),
  );

  const evaluation = useMemo(
    () => evaluateStThomasPortDayScenario(input),
    [input],
  );

  const handleChildAgesChange = (raw: string) => {
    setChildAgesText(raw);
    const parsed = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 17);
    setInput((prev) => ({ ...prev, childAges: parsed }));
  };

  const selectedDockRule =
    evaluation.publicAnswer.dockRules[input.arrivalDock];

  return (
    <section
      id="st-thomas-port-day-checker"
      data-testid="st-thomas-port-day-checker"
      className="max-w-6xl mx-auto px-6 py-10 space-y-8"
    >
      {/* Public Answer Block */}
      <div className="rounded-3xl border border-cyan-400/25 bg-slate-900/90 p-6 md:p-8 space-y-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            St. Thomas Public Answer • Winter 2026/2027 Sailing Guide
          </span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Includes $0 Self-Guided &amp; Regulated Ferry Paths • 0% Commercial Bias
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
          {evaluation.publicAnswer.question}
        </h2>

        <p className="text-sm md:text-base leading-relaxed text-zinc-200">
          {evaluation.publicAnswer.directAnswer}
        </p>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-xs md:text-sm text-emerald-100">
          <strong className="font-bold text-emerald-200">
            Free &amp; Self-Guided Option Summary:{" "}
          </strong>
          {evaluation.publicAnswer.freeAndSelfGuidedSummary}
        </div>
      </div>

      {/* Interactive Actual-Trip Checker */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300 font-bold">
              Actual-Trip Port-Day Checker
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-1">
              Check Excursion &amp; Ferry Fit for Your Ship Schedule
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setInput({
                  ...DEFAULT_ST_THOMAS_SCENARIO_INPUT,
                  arrivalDock: "havensight_wico",
                  shipArrivalTime: "08:00",
                  allAboardTime: "16:30",
                })
              }
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
            >
              Preset: WICO 8.5h Call
            </button>
            <button
              type="button"
              onClick={() =>
                setInput({
                  ...DEFAULT_ST_THOMAS_SCENARIO_INPUT,
                  arrivalDock: "crown_bay",
                  shipArrivalTime: "08:00",
                  allAboardTime: "13:15",
                })
              }
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
            >
              Preset: Crown Bay Short 5.25h Call
            </button>
            <button
              type="button"
              onClick={() =>
                setInput({
                  ...DEFAULT_ST_THOMAS_SCENARIO_INPUT,
                  arrivalDock: "unknown_dock",
                  excursionFocus: "st_john_ferry_or_catamaran",
                })
              }
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
            >
              Preset: Unknown Dock + St. John Check
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">
              Sailing Date (America/St_Thomas)
            </span>
            <input
              type="date"
              value={input.travelDate ?? ""}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  travelDate: e.target.value || null,
                }))
              }
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">
              St. Thomas Cruise Berth / Dock
            </span>
            <select
              value={input.arrivalDock}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  arrivalDock: e.target.value as StThomasArrivalDock,
                }))
              }
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="havensight_wico">
                Havensight (WICO — West Indian Co. Dock)
              </option>
              <option value="crown_bay">
                Crown Bay (AMSS/AMNS — Austin Monsanto Terminal)
              </option>
              <option value="charlotte_amalie_tender">
                Charlotte Amalie Harbor Tender (IANCH/OANCH)
              </option>
              <option value="unknown_dock">
                Unknown Dock (Apply Conservative Transfer Buffer)
              </option>
            </select>
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">
              Ship Arrival Time (AST)
            </span>
            <input
              type="time"
              value={input.shipArrivalTime}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  shipArrivalTime: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">
              All-Aboard Time (AST)
            </span>
            <input
              type="time"
              value={input.allAboardTime}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  allAboardTime: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">
              Excursion or Beach Focus
            </span>
            <select
              value={input.excursionFocus}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  excursionFocus: e.target.value as StThomasExcursionFocus,
                }))
              }
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="any_excursion_or_beach">
                Compare All Excursions, Beaches &amp; Free Walks
              </option>
              <option value="st_john_ferry_or_catamaran">
                St. John Ferry (Trunk Bay) or Catamaran Snorkel
              </option>
              <option value="mangrove_lagoon_kayak_snorkel">
                Mangrove Lagoon / Cas Cay Kayak, Hike &amp; Snorkel
              </option>
              <option value="magens_or_lindbergh_beach">
                Magens Bay or Lindbergh (Emerald) Beach Day
              </option>
              <option value="free_or_self_guided_walk">
                Free / Self-Guided Walk or Low-Cost Public Beach Only
              </option>
            </select>
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">
              Mobility &amp; Terrain Profile
            </span>
            <select
              value={input.mobilityLevel}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  mobilityLevel: e.target.value as StThomasMobilityLevel,
                }))
              }
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="unspecified">Standard Cruise Mobility</option>
              <option value="light_walking">
                Light Walking (Skip Active Paddle / Steep Climbs)
              </option>
              <option value="step_free_wheelchair">
                Step-Free Wheelchair Required
              </option>
              <option value="active_stairs_and_paddle">
                Active Stairs, Kayaking &amp; Reef Snorkel OK
              </option>
            </select>
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">Adults (12+)</span>
            <input
              type="number"
              min={1}
              max={20}
              value={input.adults}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  adults: Math.max(1, Number(e.target.value) || 1),
                }))
              }
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">
              Child Ages (comma-separated, e.g. 6, 10)
            </span>
            <input
              type="text"
              placeholder="None"
              value={childAgesText}
              onChange={(e) => handleChildAgesChange(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        {/* Selected Dock Rule Banner */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2 text-xs text-zinc-300">
          <div className="font-bold text-white text-sm">
            Active Berth Profile: {selectedDockRule.officialName} (
            {selectedDockRule.dockCode}) • {evaluation.dayOfWeekLabel}
          </div>
          <p>{selectedDockRule.walkabilityToDowntown}</p>
          <ul className="list-disc pl-5 space-y-1 text-amber-200/90">
            {selectedDockRule.watchouts.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>

        {/* Verdict Banner */}
        <div
          data-testid="st-thomas-verdict-banner"
          className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm font-semibold text-cyan-100"
        >
          {evaluation.conciseVerdict}
        </div>

        {/* St. John Day-Trip Ferry Leg Check Banner */}
        <div
          data-testid="st-john-ferry-leg-status-banner"
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 space-y-1 text-xs text-zinc-200"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold uppercase tracking-wider text-amber-300">
              Main Destination: St. Thomas • St. John Day-Trip Ferry Leg Check (VIPA Notice Ended{" "}
              {evaluation.stJohnDayTripChoice.ferryLegs.temporaryVipaNoticeWindow.temporaryVipaNoticeEndedOn})
            </span>
            <span className="rounded bg-amber-500/30 px-2 py-0.5 font-bold text-amber-100">
              {evaluation.stJohnDayTripChoice.ferryLegs.statusLabel}
            </span>
          </div>
          <p>
            <strong>Outbound (Red Hook → Cruz Bay):</strong>{" "}
            {evaluation.stJohnDayTripChoice.ferryLegs.outboundLeg.selectedDepartureTime ??
              "No fitting boat"}{" "}
            • <strong>Return (Cruz Bay → Red Hook):</strong>{" "}
            {evaluation.stJohnDayTripChoice.ferryLegs.returnLeg.selectedReturnDepartureTime ??
              "No fitting boat"}{" "}
            • <strong>Both Ferry Legs Fit:</strong>{" "}
            {evaluation.stJohnDayTripChoice.bothFerryLegsFit ? "Yes" : "No"}
          </p>
          {evaluation.stJohnDayTripChoice.ferryLegs.returnLeg.unresolvedReason ? (
            <p className="text-amber-200/90">
              {evaluation.stJohnDayTripChoice.ferryLegs.returnLeg.unresolvedReason}
            </p>
          ) : null}
        </div>

        {/* Viable Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
            Fitting Options ({evaluation.recommendedOptions.length})
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            {evaluation.recommendedOptions.map((opt) => (
              <div
                key={opt.optionId}
                data-testid={`stt-viable-option-${opt.optionId}`}
                className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${FIT_BADGE_CLASSES[opt.fitStatus]}`}
                    >
                      {opt.fitBadgeLabel}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {opt.productCode ? (
                        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-200">
                          {opt.productCode} • {opt.timing.activityDurationMinutes}m • $
                          {opt.listingPriceUsd}
                        </span>
                      ) : null}
                      {opt.isFreeOrSelfGuided ? (
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                          Free / Self-Guided Option
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <h5 className="text-base font-bold text-white">{opt.title}</h5>
                  <p className="text-xs text-amber-200/90">
                    <strong>Pickup / Meeting ({opt.pickupMode}):</strong>{" "}
                    {opt.pickupSummary}
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {opt.conciseVerdict}
                  </p>
                  <p className="text-xs text-cyan-200/90 leading-relaxed">
                    <strong>Dock Note:</strong> {opt.dockComparisonNote}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-zinc-300">
                  <div className="flex justify-between">
                    <span>Required Port Window:</span>
                    <strong className="text-white">
                      {opt.timing.totalRequiredMinutes} min (Back at pier ~
                      {opt.timing.estimatedBackAtPierTime})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Party Total (Incl. Taxi/Ferry):</span>
                    <strong className="text-white">
                      ${opt.estimatedCostTotalPartyUsd.toFixed(2)} ($
                      {opt.estimatedCostPerAdultUsd.toFixed(2)}/adult)
                    </strong>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {opt.costBasisSummary}
                  </p>
                  {opt.bookingHandoffUrl ? (
                    <a
                      href={opt.bookingHandoffUrl}
                      className="mt-2 inline-flex items-center justify-center w-full rounded-xl bg-cyan-500/20 border border-cyan-400/30 px-4 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/30"
                    >
                      {opt.bookingChannelLabel} →
                    </a>
                  ) : (
                    <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-[11px] text-zinc-300">
                      {opt.bookingChannelLabel}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eliminated Options */}
        {evaluation.eliminatedOptions.length > 0 ? (
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-rose-300">
              Eliminated for This Trip Window ({evaluation.eliminatedOptions.length})
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              {evaluation.eliminatedOptions.map((opt) => (
                <div
                  key={opt.optionId}
                  data-testid={`stt-eliminated-option-${opt.optionId}`}
                  className="rounded-2xl border border-rose-500/25 bg-slate-950/60 p-4 space-y-1.5 opacity-90"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-rose-200">
                      {opt.shortLabel}
                    </span>
                    <span className="rounded-full border border-rose-400/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
                      {opt.fitBadgeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">{opt.conciseVerdict}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Unknown & Unconfirmed Facts Disclosure */}
        <div
          data-testid="st-thomas-unknown-facts"
          className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
              Unsupported or Unconfirmed Facts Marked as Unknown (
              {evaluation.unknownFacts.length})
            </h4>
            <span className="text-[11px] text-amber-200/80 font-mono">
              status: &quot;unknown&quot;
            </span>
          </div>
          <ul className="space-y-2 text-xs text-amber-100/90">
            {evaluation.unknownFacts.map((fact) => (
              <li
                key={fact.factId}
                className="rounded-xl border border-amber-300/15 bg-black/25 p-3 space-y-1"
              >
                <div className="font-semibold text-amber-200">
                  [{fact.status.toUpperCase()}] {fact.summary}
                </div>
                <div className="text-zinc-300">{fact.impactOnDecision}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
