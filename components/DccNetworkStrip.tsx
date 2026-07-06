import React from "react";

export default function DccNetworkStrip() {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm max-w-5xl mx-auto my-6">
      <div className="space-y-1 max-w-3xl">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Part of the Destination Command Center network
        </h4>
        <p className="text-slate-600 text-xs leading-relaxed">
          Last Frontier Shore Excursions is listed in the Destination Command Center network for
          cruise-port travel planning, provider routing, and public site verification.
        </p>
      </div>
      <div className="shrink-0">
        <a
          href="https://www.destinationcommandcenter.com/network/last-frontier-shore-excursions"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm"
        >
          View network record
        </a>
      </div>
    </div>
  );
}
