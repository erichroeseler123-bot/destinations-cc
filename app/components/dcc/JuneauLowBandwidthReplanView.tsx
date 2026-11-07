import React from "react";
import Link from "next/link";
import { CLAA_JUNEAU_PORT_SCHEDULE } from "@/lib/dcc/cruiseTimingGate";
import {
  evaluateLowBandwidthJuneauReplan,
  type LowBandwidthJuneauPlanEvaluation,
} from "@/lib/dcc/lowBandwidthJuneauReplan";
import JuneauLowBandwidthOfflineBridge, {
  type OfflineJuneauPlanSnapshot,
} from "@/app/components/dcc/JuneauLowBandwidthOfflineBridge";
import SharedTripRecheckCard from "@/app/components/dcc/SharedTripRecheckCard";

export default function JuneauLowBandwidthReplanView({
  searchParams,
  evaluationOverride,
  fullPageMode = false,
  actionPath = "/juneau/replan",
}: {
  searchParams?: Record<string, string | string[] | undefined>;
  evaluationOverride?: LowBandwidthJuneauPlanEvaluation;
  fullPageMode?: boolean;
  actionPath?: string;
}) {
  const plan =
    evaluationOverride || evaluateLowBandwidthJuneauReplan(searchParams);
  const { input } = plan;

  const snapshot: OfflineJuneauPlanSnapshot = {
    checkedAtIso: plan.checkedAtIso,
    ship: input.ship,
    date: input.date,
    arrivalTime: input.arrivalTime,
    allAboardTime: input.allAboardTime,
    berth: input.berth,
    partySize: input.partySize,
    flightCanceled: input.flightCanceled,
    summaryHeadline: plan.summaryHeadline,
    primaryHandoffHref: plan.primaryHandoffHref,
    options: plan.options.map((opt) => ({
      optionId: opt.optionId,
      title: opt.title,
      statusBadgeLabel: opt.timing.statusBadgeLabel,
      earliestCheckInLocal: opt.timing.earliestCheckInLocal,
      estimatedGangwayReturnLocal: opt.timing.estimatedGangwayReturnLocal,
      marginBeforeAllAboardMinutes: opt.timing.marginBeforeAllAboardMinutes,
      handoffHref: opt.handoffHref,
    })),
  };

  return (
    <section
      id="juneau-low-bandwidth-replan"
      data-testid="dcc-juneau-low-bandwidth-replan"
      data-calculation-engine={plan.calculationEngine}
      data-compressed-budget-bytes={plan.compressedTargetBytes}
      className="rounded-2xl border border-cyan-400/40 bg-[#071521] p-4 sm:p-5 text-white space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
            DCC Weak Wi-Fi &amp; Ship Delay Replanner · Text-First (&le;50 KB Target)
          </p>
          <h2 className="mt-1 text-lg sm:text-xl font-black text-white">
            Plans changed on ship Wi-Fi? Update arrival or all-aboard time to see what still fits
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {!fullPageMode ? (
            <Link
              href={`/juneau/replan?ship=${encodeURIComponent(input.ship)}&date=${encodeURIComponent(input.date)}&arrival=${encodeURIComponent(input.arrivalTime)}&all_aboard=${encodeURIComponent(input.allAboardTime)}&berth=${encodeURIComponent(input.berth)}&party_size=${input.partySize}${input.flightCanceled ? "&flight_canceled=1" : ""}`}
              className="rounded-lg border border-cyan-300/40 bg-cyan-500/15 px-3 py-1.5 font-bold text-cyan-100 hover:bg-cyan-500/25"
            >
              Open Standalone Ultra-Light View (/juneau/replan) →
            </Link>
          ) : (
            <Link
              href="/juneau"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-semibold text-zinc-200 hover:bg-white/15"
            >
              ← Full Juneau Reference Guide
            </Link>
          )}
        </div>
      </div>

      {/* Offline Copy & Connection Status Bridge */}
      <JuneauLowBandwidthOfflineBridge snapshot={snapshot} />

      {/* Quick CLAA Ship Schedule Presets */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-bold text-zinc-300 mr-1">CLAA Ship Presets:</span>
        {CLAA_JUNEAU_PORT_SCHEDULE.map((entry) => (
          <Link
            key={entry.scheduleId}
            href={`${actionPath}?ship=${encodeURIComponent(entry.shipName)}&date=${entry.serviceDate}&arrival=${entry.claaArrivalLocal}&all_aboard=${entry.confirmedAllAboardLocal || ""}&berth=${entry.berthCode}&party_size=${input.partySize}${input.flightCanceled ? "&flight_canceled=1" : ""}`}
            className="rounded border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 hover:border-cyan-300/50"
          >
            {entry.shipName} ({entry.claaArrivalLocal}–{entry.confirmedAllAboardLocal || "Confirm"} · {entry.berthCode})
          </Link>
        ))}
        <Link
          href={`${actionPath}?ship=${encodeURIComponent(input.ship)}&date=${input.date}&arrival=${input.arrivalTime}&all_aboard=${input.allAboardTime}&berth=${input.berth}&party_size=${input.partySize}&flight_canceled=1`}
          className="rounded border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/25"
        >
          My Flight Was Canceled (Open Surface Backup)
        </Link>
      </div>

      {/* Pure HTML GET Form — Works on 2G / Weak Ship Wi-Fi Without Heavy JS */}
      <form
        method="GET"
        action={actionPath}
        data-testid="dcc-juneau-replan-form"
        className="grid gap-3 rounded-xl border border-white/10 bg-black/35 p-3.5 sm:grid-cols-3 lg:grid-cols-7 text-xs"
      >
        <label className="block">
          <span className="font-bold text-zinc-200">Ship Name</span>
          <input
            type="text"
            name="ship"
            defaultValue={input.ship}
            className="mt-1 w-full rounded border border-white/20 bg-zinc-900 px-2.5 py-1.5 text-white"
          />
        </label>
        <label className="block">
          <span className="font-bold text-zinc-200">Port Date</span>
          <input
            type="date"
            name="date"
            defaultValue={input.date}
            className="mt-1 w-full rounded border border-white/20 bg-zinc-900 px-2.5 py-1.5 text-white"
          />
        </label>
        <label className="block">
          <span className="font-bold text-cyan-200">Updated Arrival (AKDT)</span>
          <input
            type="time"
            name="arrival"
            defaultValue={input.arrivalTime}
            className="mt-1 w-full rounded border border-cyan-400/40 bg-zinc-900 px-2.5 py-1.5 font-bold text-white"
          />
        </label>
        <label className="block">
          <span className="font-bold text-cyan-200">Confirmed All-Aboard</span>
          <input
            type="time"
            name="all_aboard"
            defaultValue={input.allAboardTime}
            placeholder="HH:MM"
            className="mt-1 w-full rounded border border-cyan-400/40 bg-zinc-900 px-2.5 py-1.5 font-bold text-white"
          />
        </label>
        <label className="block">
          <span className="font-bold text-zinc-200">Berth / Dock</span>
          <select
            name="berth"
            defaultValue={input.berth}
            className="mt-1 w-full rounded border border-white/20 bg-zinc-900 px-2 py-1.5 text-white"
          >
            <option value="CT">CT (Cruise Terminal Walk-Off · 60m buffer)</option>
            <option value="FKL">FKL (South Franklin Walk-Off · 60m buffer)</option>
            <option value="AS">AS (Alaska Steamship Walk-Off · 60m buffer)</option>
            <option value="AJ">AJ Dock (1.2 mi Shuttle · 90m buffer)</option>
            <option value="ACT">ACT Dock (Shuttle · 90m buffer)</option>
            <option value="TENDER">TENDER (Anchored Tender · 90m buffer)</option>
            <option value="UNKNOWN">UNKNOWN (Confirm Ship Timing)</option>
          </select>
        </label>
        <label className="block">
          <span className="font-bold text-zinc-200">Party Size</span>
          <input
            type="number"
            name="party_size"
            min={1}
            max={18}
            defaultValue={input.partySize}
            className="mt-1 w-full rounded border border-white/20 bg-zinc-900 px-2.5 py-1.5 text-white"
          />
        </label>
        <div className="flex flex-col justify-between gap-1.5">
          <label className="inline-flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-amber-200">
            <input
              type="checkbox"
              name="flight_canceled"
              value="1"
              defaultChecked={input.flightCanceled}
            />
            <span>Flight Canceled</span>
          </label>
          {input.dccContextId ? (
            <input type="hidden" name="ctx" value={input.dccContextId} />
          ) : null}
          <button
            type="submit"
            className="w-full rounded bg-cyan-400 px-3 py-1.5 font-black uppercase tracking-wider text-slate-950 hover:bg-cyan-300"
          >
            Update Plan
          </button>
        </div>
      </form>

      {/* Unified What Changed / What Still Fits / Next Step Card + NOAA Station 9452210 Tides */}
      <SharedTripRecheckCard
        card={plan.recheckCard}
        tides={plan.tides}
        compact
        testId="dcc-juneau-replan-recheck-card"
      />

      {/* Decision Verdict & Primary Juneau Flight Deck Handoff */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/40 p-3.5">
        <div className="space-y-1 max-w-3xl">
          <p
            data-testid="dcc-juneau-replan-verdict"
            className="text-sm font-black text-white"
          >
            {plan.summaryHeadline}
          </p>
          <p className="text-xs text-zinc-300">{plan.summaryDetail}</p>
          <p className="text-[11px] text-zinc-400">
            PAJN Weather Context ({plan.backupFlow.pajnMetar.stationId}):{" "}
            <code className="text-cyan-200">{plan.backupFlow.pajnMetar.rawMetar}</code> —{" "}
            {plan.backupFlow.pajnMetar.contextNote}
          </p>
        </div>
        <a
          href={plan.primaryHandoffHref}
          data-testid="dcc-juneau-replan-primary-handoff"
          data-dcc-requires-connection="true"
          className="rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-emerald-300"
        >
          {plan.primaryHandoffLabel}
        </a>
      </div>

      {/* Text-First Table of What Still Fits */}
      <div id="fitting-options" className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/15 text-[11px] uppercase tracking-wider text-zinc-400">
              <th className="py-2 pr-3">Excursion / Backup Option</th>
              <th className="py-2 px-3">Cruise Window Fit</th>
              <th className="py-2 px-3">Check-In &amp; Gangway Return</th>
              <th className="py-2 px-3">Buffer &amp; Weather Rule</th>
              <th className="py-2 pl-3">Next Step</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {plan.options.map((opt) => {
              const badgeColor = opt.deprioritizedByFlightCancel
                ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                : opt.timing.status === "FITS_CRUISE_WINDOW"
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                  : opt.timing.status === "CONFIRM_SHIP_TIMING"
                    ? "border-sky-400/40 bg-sky-500/15 text-sky-200"
                    : "border-rose-400/40 bg-rose-500/15 text-rose-200";

              const statusText = opt.deprioritizedByFlightCancel
                ? "Paused (Flight Canceled Pivot)"
                : opt.timing.statusBadgeLabel;

              return (
                <tr key={opt.optionId} data-testid={`replan-row-${opt.optionId}`}>
                  <td className="py-2.5 pr-3 align-top">
                    <div className="font-bold text-white">{opt.title}</div>
                    <div className="text-[11px] text-zinc-400">
                      {opt.categoryLabel} · {opt.durationLabel} · {opt.priceFromLabel}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold ${badgeColor}`}
                    >
                      {statusText}
                    </span>
                    <div className="mt-1 text-[11px] text-zinc-300">
                      {opt.timing.reason}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 align-top font-mono text-[11px] text-zinc-200">
                    <div>
                      Earliest check-in:{" "}
                      <strong>{opt.timing.earliestCheckInLocal || "Confirm"}</strong>
                    </div>
                    <div>
                      Est. gangway return:{" "}
                      <strong>
                        {opt.timing.estimatedGangwayReturnLocal || "Confirm"}
                      </strong>
                    </div>
                    <div>
                      All-aboard cutoff:{" "}
                      <strong>{opt.timing.confirmedAllAboardLocal || "Unconfirmed"}</strong>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 align-top text-[11px] text-zinc-300">
                    <div>
                      Required DCC buffer:{" "}
                      <strong>{opt.timing.dccBufferMinutes} min</strong>
                    </div>
                    <div className="text-zinc-400">{opt.weatherResilienceLabel}</div>
                  </td>
                  <td className="py-2.5 pl-3 align-top">
                    <a
                      href={opt.allowedNextStepHref}
                      data-testid={`replan-handoff-${opt.optionId}`}
                      data-allowed-next-step={opt.allowedNextStepType}
                      data-dcc-requires-connection={
                        opt.flightDeckHandoffAllowed ? "true" : undefined
                      }
                      className={
                        opt.flightDeckHandoffAllowed
                          ? "inline-block rounded-lg border border-cyan-300/40 bg-cyan-500/15 px-3 py-1.5 text-[11px] font-bold text-cyan-100 hover:bg-cyan-500/25"
                          : "inline-block rounded-lg border border-amber-300/40 bg-amber-500/15 px-3 py-1.5 text-[11px] font-bold text-amber-100 hover:bg-amber-500/25"
                      }
                    >
                      {opt.allowedNextStepLabel}
                    </a>
                    <div className="mt-1 text-[10px] text-zinc-400">
                      {opt.flightDeckHandoffAllowed
                        ? "Carries ship, arrival, all-aboard & party size"
                        : "Preserves ship, arrival, all-aboard & berth"}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
