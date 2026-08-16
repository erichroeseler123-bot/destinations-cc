"use client";

import { useEffect, useMemo, useState } from "react";

const VISIT_KEY = "dcc_portfolio_last_visit_v1";

type ChangeEvent = {
  occurredAt: string;
  site: string;
  eventName: string;
};

type Snapshot = {
  trackedHandoffs: number;
  completedHandoffs: number;
  grossRevenue: number;
  attention: number;
  wnoFareHarborOpens: number;
  cruisePlannerSaves: number;
  cruisePlannerShares: number;
};

function formatWhen(value: string | null) {
  if (!value) return "first visit on this browser";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "previous visit";
  return date.toLocaleString();
}

function readableSite(site: string) {
  const labels: Record<string, string> = {
    "cruise-promenade": "Cruise Promenade",
    "vibing-around": "Vibing Around",
    gosno: "GoSno",
    "party-at-red-rocks": "Party at Red Rocks",
    "last-frontier": "Last Frontier",
    "juneau-flight-deck": "Juneau Flight Deck",
    "welcome-to-the-swamp": "Welcome to the Swamp",
    "welcome-to-the-dells": "Welcome to the Dells",
    "french-quarter-orientation": "French Quarter Orientation",
    shuttleya: "ShuttleYa",
    "420-airport-pickup": "420 Friendly Airport Pickup",
    "save-on-the-strip": "Save On The Strip",
    wno: "Welcome to New Orleans Tours",
  };
  return labels[site] || site || "DCC";
}

export default function SinceLastVisit({ events, snapshot }: { events: ChangeEvent[]; snapshot: Snapshot }) {
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const previous = window.localStorage.getItem(VISIT_KEY);
    setLastVisit(previous);
    setReady(true);
    window.localStorage.setItem(VISIT_KEY, new Date().toISOString());
  }, []);

  const changes = useMemo(() => {
    if (!ready || !lastVisit) return events.slice(0, 12);
    const threshold = new Date(lastVisit).getTime();
    if (!Number.isFinite(threshold)) return events.slice(0, 12);
    return events.filter((event) => new Date(event.occurredAt).getTime() > threshold).slice(0, 20);
  }, [events, lastVisit, ready]);

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of changes) map.set(event.site, (map.get(event.site) || 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [changes]);

  return (
    <section className="mt-8 rounded-2xl border border-[#f5c66c]/20 bg-[#f5c66c]/[0.055] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#f5c66c]">Since your last visit</div>
          <h2 className="mt-2 text-2xl font-black">{!ready ? "Checking recent changes…" : changes.length ? `${changes.length} new network event${changes.length === 1 ? "" : "s"}` : "No new tracked network events"}</h2>
          <p className="mt-2 text-sm text-zinc-300">Compared with {formatWhen(lastVisit)}. This marker is stored only in this browser.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <Mini label="Handoffs" value={snapshot.trackedHandoffs} />
          <Mini label="Completed" value={snapshot.completedHandoffs} />
          <Mini label="Revenue" value={`$${snapshot.grossRevenue.toLocaleString()}`} />
          <Mini label="Attention" value={snapshot.attention} alert={snapshot.attention > 0} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">What moved</div>
          <div className="mt-3 space-y-2">
            {!ready ? <p className="text-sm text-zinc-400">Loading your browser visit marker…</p> : null}
            {ready && grouped.length ? grouped.slice(0, 8).map(([site, count]) => (
              <div key={site} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                <span className="font-semibold text-zinc-100">{readableSite(site)}</span>
                <span className="text-zinc-300">{count} new event{count === 1 ? "" : "s"}</span>
              </div>
            )) : null}
            {ready && !grouped.length ? <p className="text-sm text-zinc-400">Nothing new has arrived in DCC telemetry since your previous visit.</p> : null}
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">Current commercial pulse</div>
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            <Pulse label="WNO FareHarbor opens" value={snapshot.wnoFareHarborOpens} />
            <Pulse label="Cruise planner saves" value={snapshot.cruisePlannerSaves} />
            <Pulse label="Cruise planner shares" value={snapshot.cruisePlannerShares} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Mini({ label, value, alert = false }: { label: string; value: number | string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${alert ? "border-amber-300/30 bg-amber-400/10" : "border-white/10 bg-black/20"}`}>
      <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</div>
      <div className="mt-1 font-black text-white">{value}</div>
    </div>
  );
}

function Pulse({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"><span>{label}</span><strong className="text-white">{value}</strong></div>;
}
