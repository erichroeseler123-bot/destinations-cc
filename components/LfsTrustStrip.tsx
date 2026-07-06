import React from "react";

export default function LfsTrustStrip() {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 md:p-6 flex gap-4 items-start shadow-sm max-w-3xl mx-auto">
      <div className="bg-sky-100 text-sky-600 rounded-2xl p-3 shrink-0 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-slate-900 text-sm">
          Built with cruise timing in mind
        </h4>
        <p className="text-slate-600 text-xs leading-relaxed">
          Last Frontier Shore Excursions organizes Alaska shore excursions around port location,
          tour duration, transfer time, and return-to-ship planning. Final availability, meeting
          instructions, and timing are confirmed by the tour provider at booking.
        </p>
      </div>
    </div>
  );
}
