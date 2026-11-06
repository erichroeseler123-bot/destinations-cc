"use client";

import React, { useMemo, useState } from "react";
import {
  evaluateWinterPortDayScenario,
  type WinterPortFitStatus,
  type WinterReleasePortSlug,
} from "@/lib/dcc/winterPorts/fivePortWinterReleaseEngine";

interface WinterPortDayPlannerProps {
  portSlug: Exclude<WinterReleasePortSlug, "st-thomas">;
}

const FIT_BADGE_CLASSES: Record<WinterPortFitStatus, string> = {
  fits_comfortably:
    "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  qualified_needs_confirmation:
    "border-amber-400/40 bg-amber-500/20 text-amber-200",
  tight_buffer: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  does_not_fit: "border-rose-400/40 bg-rose-500/15 text-rose-200",
};

const DOCK_SELECT_OPTIONS: Record<
  Exclude<WinterReleasePortSlug, "st-thomas">,
  Array<{ value: string; label: string }>
> = {
  nassau: [
    {
      value: "prince_george_wharf_ncp",
      label: "Prince George Wharf — Inner Berths 1–4 (20m exit walk)",
    },
    {
      value: "prince_george_wharf_outer",
      label: "Prince George Wharf — Outer Mega-Ship Berths 5–6 (25m exit walk)",
    },
  ],
  cozumel: [
    {
      value: "puerta_maya",
      label: "Puerta Maya Cruise Terminal (4.5 mi South)",
    },
    {
      value: "international_ssa",
      label: "International Pier — SSA México (3.5 mi South)",
    },
    {
      value: "punta_langosta",
      label: "Punta Langosta Pier (Downtown San Miguel)",
    },
  ],
  roatan: [
    {
      value: "coxen_hole_port_of_roatan",
      label: "Port of Roatán — Town Center at Coxen Hole (Gate #1/#3)",
    },
    {
      value: "mahogany_bay_dixon_cove",
      label: "Mahogany Bay Cruise Center — Dixon Cove (400m hill gate walk)",
    },
  ],
  "grand-cayman": [
    {
      value: "george_town_royal_watler_tender",
      label: "George Town Harbour — Royal Watler / North / South Tender (40m tender)",
    },
    {
      value: "spotts_bay_weather_tender",
      label: "Spotts Bay Alternative Weather Tender (Nor'wester Swell Diversion)",
    },
  ],
};

export default function WinterPortDayPlanner({
  portSlug,
}: WinterPortDayPlannerProps) {
  const dockChoices = DOCK_SELECT_OPTIONS[portSlug];
  const [shipArrivalTime, setShipArrivalTime] = useState("08:00");
  const [allAboardTime, setAllAboardTime] = useState(
    portSlug === "grand-cayman" ? "16:00" : portSlug === "cozumel" ? "17:00" : "16:30",
  );
  const [arrivalDock, setArrivalDock] = useState(dockChoices[0]!.value);
  const [adults, setAdults] = useState(2);

  const evaluation = useMemo(
    () =>
      evaluateWinterPortDayScenario({
        portSlug,
        shipArrivalTime,
        allAboardTime,
        arrivalDock,
        adults,
      }),
    [portSlug, shipArrivalTime, allAboardTime, arrivalDock, adults],
  );

  return (
    <section
      id={`${portSlug}-port-day-checker`}
      data-testid={`${portSlug}-port-day-checker`}
      className="max-w-6xl mx-auto px-6 py-10 space-y-8"
    >
      <div className="rounded-3xl border border-cyan-400/25 bg-slate-900/90 p-6 md:p-8 space-y-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            {evaluation.portName} Public Answer • Five-Port Winter Release
          </span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Modeled on St. Thomas • Includes $0 Self-Guided Option • 0% Commercial Bias
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

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">
              Assigned Pier / Tender Landing
            </span>
            <select
              value={arrivalDock}
              onChange={(e) => setArrivalDock(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            >
              {dockChoices.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">
              Ship Arrival ({evaluation.timeZone})
            </span>
            <input
              type="time"
              value={shipArrivalTime}
              onChange={(e) => setShipArrivalTime(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">
              All-Aboard Cutoff ({evaluation.timeZone})
            </span>
            <input
              type="time"
              value={allAboardTime}
              onChange={(e) => setAllAboardTime(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-200">Adults</span>
            <input
              type="number"
              min={1}
              max={20}
              value={adults}
              onChange={(e) =>
                setAdults(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm font-semibold text-cyan-100">
          {evaluation.conciseVerdict}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {evaluation.recommendedOptions.map((opt) => (
            <div
              key={opt.optionId}
              className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${FIT_BADGE_CLASSES[opt.fitStatus]}`}
                  >
                    {opt.fitBadgeLabel}
                  </span>
                  {opt.productCode ? (
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-200">
                      {opt.productCode} • {opt.activityDurationMinutes}m • $
                      {opt.listingPriceUsd}
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                      Free / Self-Guided Option
                    </span>
                  )}
                </div>
                <h5 className="text-base font-bold text-white">{opt.title}</h5>
                <p className="text-xs text-amber-200/90">
                  <strong>Pickup / Meeting ({opt.pickupMode}):</strong>{" "}
                  {opt.pickupSummary}
                </p>
                <p className="text-xs text-zinc-300">{opt.conciseVerdict}</p>
                <p className="text-xs text-cyan-200/90">
                  <strong>Pier / Tender Note:</strong> {opt.dockComparisonNote}
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
                {opt.checkoutUrl ? (
                  <a
                    href={opt.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center justify-center w-full rounded-xl bg-cyan-500/20 border border-cyan-400/30 px-4 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/30"
                  >
                    Book Exact Listing {opt.productCode} (${opt.listingPriceUsd}) →
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
