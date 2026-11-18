"use client";

import React, { useState } from "react";
import {
  evaluateNewOrleansTurnaroundAndFlightFit,
  type NewOrleansTravelerWindowScenario,
} from "@/lib/dcc/shared/newOrleansDirectoryExtensionContract";
import { normalizeWtnoTourPath } from "../lib/wtnoDirectoryHelpers";

export interface TimingCalculatorTourItem {
  productId: string;
  title: string;
  operatorName: string;
  durationMinutes: number;
  durationLabel: string;
  luggageCompatibleForTurnaround: boolean;
  href: string;
}

export default function WnoTurnaroundTimingCalculator({
  areaName,
  outboundTransferMinutesMax,
  tours,
}: {
  areaName: string;
  outboundTransferMinutesMax: number;
  tours: readonly TimingCalculatorTourItem[];
}) {
  const [scenario, setScenario] = useState<NewOrleansTravelerWindowScenario>(
    "post_cruise_debarkation_before_msy_flight",
  );
  const [windowHours, setWindowHours] = useState<number>(6);
  const [unstoredLuggage, setUnstoredLuggage] = useState<boolean>(false);

  if (!tours.length) return null;

  return (
    <section
      data-testid="wno-turnaround-timing-calculator"
      className="mt-12 rounded-2xl border border-[#1e1915]/15 bg-[#fffdf9] p-6 md:p-8 text-[#1e1915]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6220]">
        Port NOLA &amp; MSY Turnaround Timing-Fit Check
      </p>
      <h2 className="mt-2 font-serif text-2xl md:text-3xl font-bold text-[#163828]">
        Check whether {areaName} tours fit your cruise or flight window
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-[#4a4138]">
        Uses traffic-qualified corridor transfer ranges (planning estimates—never guaranteed) plus a
        mandatory 120-minute Port NOLA embarkation buffer (Erato St Carnival / Julia St NCL &amp;
        Royal Caribbean) or 150-minute MSY domestic flight buffer.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="wno-turnaround-scenario"
            className="block text-xs font-semibold uppercase tracking-wider text-[#4a4138]"
          >
            Travel Day Scenario
          </label>
          <select
            id="wno-turnaround-scenario"
            value={scenario}
            onChange={(e) =>
              setScenario(e.target.value as NewOrleansTravelerWindowScenario)
            }
            className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-3 py-2.5 text-xs text-[#1e1915]"
          >
            <option value="post_cruise_debarkation_before_msy_flight">
              Post-Cruise Debarkation → MSY Flight (150m buffer)
            </option>
            <option value="same_day_port_nola_embarkation">
              Same-Day Port NOLA Embarkation (120m buffer)
            </option>
            <option value="hotel_stay_full_or_half_day">
              Hotel Stay Day (No Cruise/Flight Cutoff)
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="wno-turnaround-hours"
            className="block text-xs font-semibold uppercase tracking-wider text-[#4a4138]"
          >
            Available Window: {windowHours} Hours ({windowHours * 60} mins)
          </label>
          <input
            id="wno-turnaround-hours"
            type="range"
            min={3}
            max={10}
            step={0.5}
            value={windowHours}
            onChange={(e) => setWindowHours(Number(e.target.value))}
            className="mt-3 w-full accent-[#163828]"
          />
        </div>

        <div className="flex items-center pt-4">
          <label className="inline-flex items-start gap-2.5 text-xs text-[#4a4138]">
            <input
              type="checkbox"
              checked={unstoredLuggage}
              onChange={(e) => setUnstoredLuggage(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#163828]"
            />
            <span>
              We will be carrying unstored full-size cruise suitcases
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {tours.slice(0, 5).map((tour) => {
          const fit = evaluateNewOrleansTurnaroundAndFlightFit({
            scenario,
            availableWindowMinutes: Math.round(windowHours * 60),
            productDurationMinutes: tour.durationMinutes,
            outboundTransferMinutesMax,
            hasUnstoredLuggage: unstoredLuggage,
            luggageCompatibleForTurnaround: tour.luggageCompatibleForTurnaround,
          });

          const badgeStyle =
            fit.status === "fits_with_buffer"
              ? "border-[#163828]/35 bg-[#f2f7f4] text-[#163828]"
              : fit.status === "tight_verify_schedule"
                ? "border-[#b8893a]/50 bg-[#fdf6e6] text-[#8a6220]"
                : "border-[#6b2737]/40 bg-[#6b2737]/10 text-[#6b2737]";

          const badgeLabel =
            fit.status === "fits_with_buffer"
              ? "Fits With Buffer"
              : fit.status === "tight_verify_schedule"
                ? "Tight — Verify Earliest Slot"
                : "Not Recommended";

          const resolvedHref = normalizeWtnoTourPath(tour.href);

          return (
            <div
              key={tour.productId}
              className="flex flex-col justify-between gap-3 rounded-xl border border-[#1e1915]/12 bg-[#faf6ee] p-4 md:flex-row md:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${badgeStyle}`}
                  >
                    {badgeLabel}
                  </span>
                  <span className="text-xs font-medium text-[#6b5a45]">
                    {tour.operatorName} · {tour.durationLabel}
                  </span>
                </div>
                <p className="mt-1 font-serif text-lg font-bold text-[#163828]">{tour.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#4a4138]">{fit.explanation}</p>
              </div>
              <a
                href={resolvedHref}
                className="wno-dir-secondary-btn shrink-0 rounded-full border border-[#163828] bg-[#fffdf9] px-4 py-2 text-xs font-bold text-[#163828] hover:bg-[#163828] hover:text-[#faf6ee]"
              >
                Inspect Details →
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
