import React from "react";
import type {
  CompactTripRecheckCardModel,
  JuneauTideTelemetryState,
} from "@/lib/dcc/sharedTripRecheck";

export default function SharedTripRecheckCard({
  card,
  tides,
  compact = false,
  testId = "dcc-shared-trip-recheck-card",
}: {
  card: CompactTripRecheckCardModel;
  tides?: JuneauTideTelemetryState | null;
  compact?: boolean;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      data-corridor-id={card.corridorId}
      className={`rounded-2xl border border-cyan-400/40 bg-slate-950/85 ${
        compact ? "p-3.5 space-y-2.5" : "p-4 sm:p-5 space-y-3.5"
      } text-white`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
          DCC Shared Trip Recheck · What Changed / What Still Fits / Next Step
        </span>
        {tides && (
          <span
            data-testid="dcc-recheck-tide-badge"
            data-tide-status={tides.status}
            data-tide-gate={tides.tideGateStatus}
            className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
              tides.available
                ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                : "border-amber-400/40 bg-amber-500/15 text-amber-200"
            }`}
          >
            NOAA Station {tides.stationId} ({tides.datum}) ·{" "}
            {tides.available ? `Date ${tides.requestedDate}` : "Tide Feed Timeout"}
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3 text-xs">
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
            1. What Changed
          </div>
          <p
            data-testid={`${testId}-what-changed`}
            className="text-zinc-200 leading-relaxed"
          >
            {card.whatChanged}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
            2. What Still Fits
          </div>
          <p
            data-testid={`${testId}-what-still-fits`}
            className="text-zinc-200 leading-relaxed"
          >
            {card.whatStillFits}
          </p>
        </div>

        <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/25 p-3 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
              3. Next Step
            </div>
            <p
              data-testid={`${testId}-next-step`}
              className="text-zinc-200 leading-relaxed"
            >
              {card.nextStep}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={card.primaryNextActionHref}
              data-testid={`${testId}-primary-cta`}
              data-dcc-requires-connection="true"
              className="inline-block rounded-lg bg-emerald-400 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-950 hover:bg-emerald-300 transition"
            >
              {card.primaryNextActionLabel}
            </a>
            {card.secondaryNextActionHref && card.secondaryNextActionLabel && (
              <a
                href={card.secondaryNextActionHref}
                data-testid={`${testId}-secondary-cta`}
                className="inline-block rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 hover:bg-white/15 transition"
              >
                {card.secondaryNextActionLabel}
              </a>
            )}
          </div>
        </div>
      </div>

      {tides && (
        <div
          data-testid="dcc-recheck-tide-summary"
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-zinc-300 flex flex-wrap items-center justify-between gap-2"
        >
          <span>
            <strong>
              Tides ({tides.stationName} · Station {tides.stationId} · Datum{" "}
              {tides.datum}):
            </strong>{" "}
            {tides.tideSummaryText}
          </span>
          <span className="text-zinc-400">{tides.neverAllClearNote}</span>
        </div>
      )}
    </div>
  );
}
