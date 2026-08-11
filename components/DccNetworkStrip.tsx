import React from "react";

export default function DccNetworkStrip() {
  return (
    <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm max-w-5xl mx-auto my-6">
      <div className="space-y-2 max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-400">
          Want to research the port before you pick a tour?
        </p>
        <h4 className="font-black text-white text-base md:text-lg">
          Open the Alaska view in Destination Command Center.
        </h4>
        <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
          Use DCC for the bigger picture — port context, what different parts of the stop feel like, logistics, and how an excursion fits into the rest of your cruise day. Come back here when you are ready to compare bookable tours.
        </p>
      </div>
      <div className="shrink-0 flex flex-wrap gap-2">
        <a
          href="https://www.destinationcommandcenter.com/alaska?from=last-frontier-shore-excursions"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-sky-500 hover:bg-sky-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-sm"
        >
          Research Alaska in DCC
        </a>
        <a
          href="https://www.destinationcommandcenter.com/network/last-frontier-shore-excursions"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition"
        >
          Network record
        </a>
      </div>
    </div>
  );
}
