import React from "react";
import {
  CDOT_I70_VERIFIED_FACTS,
  COLORADO_TRANSFER_FACT_COMPARISON,
} from "@/lib/dcc/coloradoFactComparison";

export default function ColoradoFactComparisonTable() {
  return (
    <section
      id="colorado-fact-comparison"
      data-testid="dcc-colorado-fact-comparison"
      className="rounded-3xl border border-cyan-400/35 bg-[#0a131c] p-6 md:p-8 text-white space-y-6 shadow-2xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5 max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Verified Traveler Fact Comparison · Same Road = Same Verified Road Conditions
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            Compare DEN–Mountain Options on 6 Facts You Can Use: Pickup Wait, Rental Collection, Parking, Vehicle &amp; Gear Fit, Confirmed Pricing, and Availability
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {
              CDOT_I70_VERIFIED_FACTS.sharedI70RoadConditionBaseline
                .equalRoadTreatmentStatement
            }
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 text-xs">
          <a
            href={CDOT_I70_VERIFIED_FACTS.ejmtMetering.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 font-bold text-cyan-200 hover:bg-cyan-500/20"
          >
            CDOT EJMT Tunnel Metering Guide ↗
          </a>
          <a
            href={
              CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties.officialUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 font-bold text-amber-200 hover:bg-amber-500/20"
          >
            CDOT Code 15/16 Traction Law ($100 + $33 Surcharge) ↗
          </a>
        </div>
      </div>

      {/* Verified CDOT Metering & Passenger Penalty Evidence Callouts */}
      <div className="grid gap-4 md:grid-cols-2 text-xs">
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-1.5">
          <p className="font-black uppercase tracking-wider text-cyan-300">
            1. CDOT Eisenhower–Johnson Memorial Tunnel (EJMT) Metering (Shared Road Fact)
          </p>
          <p className="text-zinc-200 leading-relaxed">
            {CDOT_I70_VERIFIED_FACTS.ejmtMetering.ruleSummary}{" "}
            {CDOT_I70_VERIFIED_FACTS.ejmtMetering.sharedRoadImplication}
          </p>
          <p className="text-[11px] text-cyan-200/80 font-mono">
            Source:{" "}
            <a
              href={CDOT_I70_VERIFIED_FACTS.ejmtMetering.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {CDOT_I70_VERIFIED_FACTS.ejmtMetering.officialUrl}
            </a>{" "}
            · Checked {CDOT_I70_VERIFIED_FACTS.ejmtMetering.verifiedAt}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1.5">
          <p className="font-black uppercase tracking-wider text-amber-300">
            2. CDOT Passenger Traction Law (C.R.S. &sect; 42-4-106) Fine &amp; Surcharge
          </p>
          <p className="text-zinc-200 leading-relaxed">
            {
              CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties
                .penaltySummary
            }
          </p>
          <p className="text-[11px] text-amber-200/80 font-mono">
            Source:{" "}
            <a
              href={
                CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties
                  .officialUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {
                CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties
                  .officialUrl
              }
            </a>{" "}
            · Checked{" "}
            {CDOT_I70_VERIFIED_FACTS.passengerTractionLawPenalties.verifiedAt}
          </p>
        </div>
      </div>

      {/* 6-Dimension + Shared Road Condition Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-zinc-400">
              <th className="py-3 pr-3 min-w-[160px]">Transfer Option</th>
              <th className="py-3 px-3 min-w-[170px]">1. Pickup Wait</th>
              <th className="py-3 px-3 min-w-[170px]">2. Rental Collection</th>
              <th className="py-3 px-3 min-w-[140px]">3. Parking</th>
              <th className="py-3 px-3 min-w-[210px]">4. Vehicle &amp; Gear Fit</th>
              <th className="py-3 px-3 min-w-[190px]">5. Confirmed Pricing</th>
              <th className="py-3 px-3 min-w-[180px]">6. Availability</th>
              <th className="py-3 pl-3 min-w-[190px]">Shared I-70 Road Conditions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {COLORADO_TRANSFER_FACT_COMPARISON.map((row) => (
              <tr
                key={row.optionId}
                data-testid={`co-fact-row-${row.optionId}`}
              >
                <td className="py-3.5 pr-3 align-top">
                  <div className="font-bold text-white">{row.optionName}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-400">
                    {row.operatorOrAuthority}
                  </div>
                  <a
                    href={row.nextStepUrl}
                    className="mt-2 inline-block rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-bold text-cyan-100 hover:bg-cyan-500/25"
                  >
                    {row.nextStepLabel}
                  </a>
                </td>
                <td className="py-3.5 px-3 align-top text-zinc-200 leading-5">
                  {row.pickupWait}
                </td>
                <td className="py-3.5 px-3 align-top text-zinc-200 leading-5">
                  {row.rentalCollection}
                </td>
                <td className="py-3.5 px-3 align-top text-zinc-200 leading-5">
                  {row.parking}
                </td>
                <td className="py-3.5 px-3 align-top text-zinc-200 leading-5">
                  {row.vehicleAndGearFit}
                </td>
                <td className="py-3.5 px-3 align-top text-zinc-200 leading-5">
                  {row.confirmedPricing}
                </td>
                <td className="py-3.5 px-3 align-top text-zinc-200 leading-5">
                  {row.availability}
                </td>
                <td className="py-3.5 pl-3 align-top text-zinc-300 leading-5">
                  {row.sharedRoadConditions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
