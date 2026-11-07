import React from "react";
import {
  MSY_OFFICIAL_TAXI_FARE_SOURCE_URL,
  MSY_TAXI_REFERENCE_TABLE,
  computeMsyAirportTaxiFare,
} from "@/lib/dcc/msyTaxiAndColoradoSeasonal";

export default function MsyTaxiFareScheduleCard({
  verifiedPrivateVanQuoteUsd = null,
}: {
  verifiedPrivateVanQuoteUsd?: number | null;
}) {
  const fivePaxQuote = computeMsyAirportTaxiFare({
    passengers: 5,
    verifiedPrivateVanQuoteUsd,
  });

  return (
    <section
      data-testid="dcc-msy-taxi-fare-schedule-card"
      className="rounded-3xl border border-cyan-500/35 bg-zinc-900/90 p-5 md:p-7 space-y-4 text-white shadow-xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
            Official MSY Airport Taxi Rate · New Orleans City Code Sec. 162-609
          </p>
          <h2 className="mt-1 text-xl md:text-2xl font-black text-white">
            MSY to the CBD or French Quarter (West of Elysian Fields Ave)
          </h2>
        </div>
        <a
          href={MSY_OFFICIAL_TAXI_FARE_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 transition"
        >
          Official FlyMSY Taxi Schedule (flymsy.com/taxis-2/) ↗
        </a>
      </div>

      <p className="text-sm text-zinc-200 leading-relaxed">
        From Louis Armstrong New Orleans International Airport (<strong>MSY</strong>) to the{" "}
        <strong>CBD or French Quarter west of Elysian Fields</strong>, the posted fare is{" "}
        <strong>$36 total for one or two passengers</strong> and{" "}
        <strong>$15 per person for three or more</strong> (<strong>$45 for 3</strong>,{" "}
        <strong>$60 for 4</strong>, and{" "}
        <strong>$75 for five when one suitable cab can carry the group and its luggage</strong>).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-zinc-400">
              <th className="py-2 pr-3">Party Size</th>
              <th className="py-2 px-3">Posted MSY Taxi Total</th>
              <th className="py-2 px-3">Official Rate Basis</th>
              <th className="py-2 pl-3">Vehicle &amp; Luggage Fit Rule</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {MSY_TAXI_REFERENCE_TABLE.map((row) => (
              <tr
                key={row.passengers}
                data-testid={`msy-taxi-row-${row.passengers}`}
              >
                <td className="py-2 pr-3 font-bold text-white">
                  {row.passengers} {row.passengers === 1 ? "Passenger" : "Passengers"}
                </td>
                <td className="py-2 px-3 font-mono font-black text-emerald-300">
                  ${row.postedTaxiFareUsd} total (${row.perPassengerEffectiveUsd.toFixed(0)}/pax)
                </td>
                <td className="py-2 px-3 text-zinc-200">{row.postedTaxiFormulaLabel}</td>
                <td className="py-2 pl-3 text-zinc-300">{row.singleCabSuitabilityNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-amber-400/30 bg-amber-950/25 p-3.5 text-xs text-amber-100">
        <strong>Private Van Comparison Note:</strong> {fivePaxQuote.privateVanComparisonSummary}
      </div>
    </section>
  );
}
