"use client";

import React, { useEffect, useState } from "react";
import { LOW_BANDWIDTH_JUNEAU_OFFLINE_STORAGE_KEY } from "@/lib/dcc/lowBandwidthJuneauReplan";

export interface OfflineJuneauPlanSnapshot {
  checkedAtIso: string;
  ship: string;
  date: string;
  arrivalTime: string;
  allAboardTime: string;
  berth: string;
  partySize: number;
  flightCanceled: boolean;
  summaryHeadline: string;
  primaryHandoffHref: string;
  options: Array<{
    optionId: string;
    title: string;
    statusBadgeLabel: string;
    earliestCheckInLocal: string | null;
    estimatedGangwayReturnLocal: string | null;
    marginBeforeAllAboardMinutes: number | null;
    handoffHref: string;
  }>;
}

export default function JuneauLowBandwidthOfflineBridge({
  snapshot,
}: {
  snapshot: OfflineJuneauPlanSnapshot;
}) {
  const [isOffline, setIsOffline] = useState(false);
  const [cachedSnapshot, setCachedSnapshot] =
    useState<OfflineJuneauPlanSnapshot>(snapshot);
  const [offlineGateNotice, setOfflineGateNotice] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncOnlineStatus = () => {
      const offlineNow = navigator.onLine === false;
      setIsOffline(offlineNow);
      if (!offlineNow) {
        setOfflineGateNotice(null);
      }
    };

    syncOnlineStatus();

    try {
      if (navigator.onLine !== false) {
        window.localStorage.setItem(
          LOW_BANDWIDTH_JUNEAU_OFFLINE_STORAGE_KEY,
          JSON.stringify(snapshot),
        );
        setCachedSnapshot(snapshot);
      } else {
        const raw = window.localStorage.getItem(
          LOW_BANDWIDTH_JUNEAU_OFFLINE_STORAGE_KEY,
        );
        if (raw) {
          const parsed = JSON.parse(raw) as OfflineJuneauPlanSnapshot;
          if (parsed && parsed.checkedAtIso) {
            setCachedSnapshot(parsed);
          }
        }
      }
    } catch {
      // Ignore storage quota / privacy mode errors on restricted ship Wi-Fi portals
    }

    const handleLinkClick = (event: MouseEvent) => {
      if (navigator.onLine !== false) return;
      const target = (event.target as HTMLElement | null)?.closest(
        "[data-dcc-requires-connection='true']",
      );
      if (target) {
        event.preventDefault();
        setOfflineGateNotice(
          `Offline copy — showing last saved plan checked at ${cachedSnapshot.checkedAtIso}. Updated availability and booking require an active connection.`,
        );
      }
    };

    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);
    document.addEventListener("click", handleLinkClick);

    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
      document.removeEventListener("click", handleLinkClick);
    };
  }, [snapshot, cachedSnapshot.checkedAtIso]);

  return (
    <div
      data-testid="dcc-juneau-offline-plan-status"
      data-offline-storage-key={LOW_BANDWIDTH_JUNEAU_OFFLINE_STORAGE_KEY}
      data-checked-at={cachedSnapshot.checkedAtIso}
      data-connection-state={isOffline ? "offline" : "online"}
      className={`rounded-xl border p-3 text-xs leading-5 ${
        isOffline
          ? "border-amber-400/50 bg-amber-950/60 text-amber-100"
          : "border-emerald-400/30 bg-emerald-950/25 text-zinc-200"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">
          {isOffline
            ? `OFFLINE COPY ACTIVE — Last saved plan checked at ${cachedSnapshot.checkedAtIso}`
            : `Offline copy saved locally · Plan checked at ${cachedSnapshot.checkedAtIso}`}
        </p>
        <span className="font-mono text-[11px] text-cyan-200">
          Target: &le;50 KB compressed · Text-first weak Wi-Fi mode
        </span>
      </div>
      <p className="mt-1 text-zinc-300">
        Saved plan: <strong>{cachedSnapshot.ship}</strong> ({cachedSnapshot.date}) · Arrival{" "}
        <strong>{cachedSnapshot.arrivalTime}</strong> · All-aboard{" "}
        <strong>{cachedSnapshot.allAboardTime || "Unconfirmed"}</strong> · Berth{" "}
        <strong>{cachedSnapshot.berth}</strong> · Party of{" "}
        <strong>{cachedSnapshot.partySize}</strong>.{" "}
        <strong className="text-amber-200">
          An offline copy shows your last saved plan and when it was checked. Updated availability and booking need a connection.
        </strong>
      </p>
      {offlineGateNotice && (
        <p
          role="alert"
          data-testid="dcc-juneau-offline-connection-required-alert"
          className="mt-2 rounded-lg border border-rose-400/50 bg-rose-950/70 px-3 py-2 font-bold text-rose-100"
        >
          {offlineGateNotice}
        </p>
      )}
    </div>
  );
}
