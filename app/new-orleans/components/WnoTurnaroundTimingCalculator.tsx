"use client";

import React, { useState } from "react";
import {
  evaluateNewOrleansTurnaroundAndFlightFit,
  type NewOrleansTravelerWindowScenario,
} from "@/lib/dcc/shared/newOrleansDirectoryExtensionContract";

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
      className="mt-10 rounded-xl border border-[#d4af37]/30 bg-[#121016] p-6 md:p-8 text-[#fdfbf7]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
        Port NOLA &amp; MSY Turnaround Timing-Fit Check
      </p>
      <h2 className="mt-2 font-serif text-2xl md:text-3xl">
        Check whether {areaName} tours fit your cruise or flight window
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-white/75">
        Uses traffic-qualified corridor transfer ranges (planning estimates—never guaranteed) plus a
        mandatory 120-minute Port NOLA embarkation buffer (Erato St Carnival / Julia St NCL &amp;
        Royal Caribbean) or 150-minute MSY domestic flight buffer.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/80">
            Travel Day Scenario
          </label>
          <select
            value={scenario}
            onChange={(e) =>
              setScenario(e.target.value as NewOrleansTravelerWindowScenario)
            }
            className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#080708] px-3 py-2.5 text-xs text-white"
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/80">
            Available Window: {windowHours} Hours ({windowHours * 60} mins)
          </label>
          <input
            type="range"
            min={3}
            max={10}
            step={0.5}
            value={windowHours}
            onChange={(e) => setWindowHours(Number(e.target.value))}
            className="mt-3 w-full accent-[#d4af37]"
          />
        </div>

        <div className="flex items-center pt-4">
          <label className="inline-flex items-start gap-2.5 text-xs text-white/85">
            <input
              type="checkbox"
              checked={unstoredLuggage}
              onChange={(e) => setUnstoredLuggage(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#d4af37]"
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
              ? "border-emerald-400/40 bg-emerald-950/40 text-emerald-300"
              : fit.status === "tight_verify_schedule"
                ? "border-amber-400/40 bg-amber-950/40 text-amber-300"
                : "border-rose-400/40 bg-rose-950/40 text-rose-300";

          const badgeLabel =
            fit.status === "fits_with_buffer"
              ? "Fits With Buffer"
              : fit.status === "tight_verify_schedule"
                ? "Tight — Verify Earliest Slot"
                : "Not Recommended";

          return (
            <div
              key={tour.productId}
              className="flex flex-col justify-between gap-3 rounded-lg border border-white/15 bg-[#0b090e] p-4 md:flex-row md:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${badgeStyle}`}
                  >
                    {badgeLabel}
                  </span>
                  <span className="text-xs text-white/65">
                    {tour.operatorName} · {tour.durationLabel}
                  </span>
                </div>
                <p className="mt-1 font-semibold text-white">{tour.title}</p>
                <p className="mt-1 text-xs text-white/70">{fit.explanation}</p>
              </div>
              <a
                href={tour.href}
                className="shrink-0 rounded border border-[#d4af37]/50 px-3.5 py-2 text-xs font-semibold text-[#d4af37] hover:bg-[#d4af37]/10"
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
