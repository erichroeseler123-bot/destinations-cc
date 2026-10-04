import Link from "next/link";

export default function LiveSeatDropsBadge({
  compact = false,
  showLink = true,
}: {
  compact?: boolean;
  showLink?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-sky-950/40 backdrop-blur-md ${
        compact ? "p-3 text-xs" : "p-4 md:p-5"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Live 10:00 AM Inventory Sweep
              </span>
              <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Active Today
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-0.5 mb-0">
              <strong className="text-amber-400 font-bold">Automated Daily Sweep</strong> active for 2026 Alaska Cruise Season
              <span className="hidden md:inline text-slate-300 text-xs font-normal">
                {" "}
                • Monitoring TEMSCO, Coastal &amp; NorthStar inventory at 10:00 AM AKDT
              </span>
            </p>
          </div>
        </div>

        {showLink && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/helicopter-waitlist"
              className="text-xs font-bold text-sky-300 hover:text-white bg-sky-950/60 hover:bg-sky-900 border border-sky-500/40 rounded-xl px-3 py-1.5 transition flex items-center gap-1"
            >
              <span>Scan Your Cruise Date</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
