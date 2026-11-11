"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import JuneauLowBandwidthReplanView from "@/app/components/dcc/JuneauLowBandwidthReplanView";

const SENSITIVE_QUERY_KEYS = new Set([
  "ctx",
  "dcc_ctx",
  "name",
  "fullName",
  "firstName",
  "lastName",
  "email",
  "phone",
  "weight",
  "passengerWeight",
  "weights",
  "accessibility",
  "medicalNotes",
  "cabin",
  "cabinNumber",
  "stateroom",
  "stateroomNumber",
  "bookingRef",
  "reservationNumber",
  "pnr",
]);

export function DefaultJuneauReplanBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/25 bg-[#071521] px-5 py-3.5 text-xs text-zinc-200">
      <span>
        <strong>Already on ship Wi-Fi or dealing with a schedule change?</strong> Check excursion timing or flight-cancellation backups in our lightweight replanner.
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/ports/juneau#shared-port-day-excursion-catalog"
          className="rounded-lg bg-cyan-400 px-3.5 py-1.5 font-black uppercase tracking-wider text-slate-950 hover:bg-cyan-300"
        >
          Browse Juneau Excursions →
        </Link>
        <Link
          href="/juneau/replan"
          className="rounded-lg border border-cyan-300/40 bg-cyan-500/15 px-3.5 py-1.5 font-bold text-cyan-100 hover:bg-cyan-500/25"
        >
          Open Ship-Delay Replanner →
        </Link>
      </div>
    </div>
  );
}

export default function JuneauQueryReplanSlot() {
  const searchParams = useSearchParams();
  const sp: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) {
    if (SENSITIVE_QUERY_KEYS.has(k)) continue;
    if (v.startsWith("dcc_ctx_")) continue;
    sp[k] = v;
  }

  const isTextFirstOnly =
    sp.low_bw === "1" || sp.low_bw === "true" || sp.mode === "replan";

  const hasActiveReplanQuery = Boolean(
    isTextFirstOnly ||
      sp.ship ||
      sp.arrival ||
      sp.all_aboard ||
      sp.flight_canceled ||
      sp.date ||
      sp.berth,
  );

  if (hasActiveReplanQuery) {
    return (
      <JuneauLowBandwidthReplanView
        searchParams={sp}
        fullPageMode={isTextFirstOnly}
        actionPath="/juneau/replan"
      />
    );
  }

  return <DefaultJuneauReplanBanner />;
}
