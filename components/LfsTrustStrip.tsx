import Link from "next/link";
import React from "react";

export default function LfsTrustStrip() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-sm max-w-5xl mx-auto">
      <div className="flex gap-4 items-start">
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
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
            Built for a cruise day, not a generic vacation day
          </p>
          <h4 className="font-black text-slate-900 text-base md:text-lg">
            Pick the one Alaska experience you would be disappointed to miss. Build the rest of the day around it.
          </h4>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed max-w-3xl">
            Compare the experience, total tour time, meeting point, transportation, and the margin you want before sailing. Final availability, meeting instructions, and operating decisions are confirmed by the tour provider at booking.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/tours?q=whale%20watching" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 hover:border-sky-300 hover:text-sky-700 transition">
          Whales & wildlife →
        </Link>
        <Link href="/tours?q=glacier" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 hover:border-sky-300 hover:text-sky-700 transition">
          Glaciers & ice →
        </Link>
        <Link href="/tours?q=railway" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 hover:border-sky-300 hover:text-sky-700 transition">
          Railway & scenery →
        </Link>
        <Link href="/tours?q=flightseeing" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 hover:border-sky-300 hover:text-sky-700 transition">
          Flightseeing →
        </Link>
      </div>
    </div>
  );
}
