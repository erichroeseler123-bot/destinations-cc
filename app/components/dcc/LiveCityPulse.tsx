"use client";

import { useEffect, useMemo, useState } from "react";

type LaneKey = "events" | "tours" | "transport" | "cruises" | "stays" | "food";

type LiveSummary = {
  action_counts?: Partial<Record<LaneKey, number>> & Record<string, number | undefined>;
  providers?: string[];
  trend?: string | null;
  latest_event_type?: string | null;
  freshness?: {
    graph_stale?: boolean;
    action_sources_stale?: boolean;
  };
};

const LANES: Array<{ key: LaneKey; label: string }> = [
  { key: "events", label: "Events" },
  { key: "tours", label: "Experiences" },
  { key: "transport", label: "Movement" },
  { key: "cruises", label: "Cruise" },
  { key: "food", label: "Food" },
  { key: "stays", label: "Stays" },
];

function deriveSignal(summary: LiveSummary | null) {
  if (!summary) return "Reading the city";
  const counts = summary.action_counts || {};
  const ranked = LANES
    .map((lane) => ({ ...lane, value: Number(counts[lane.key] || 0) }))
    .sort((a, b) => b.value - a.value);
  const leader = ranked[0];
  if (!leader || leader.value <= 0) return "Quiet signal";
  if (leader.key === "events") return "Event energy";
  if (leader.key === "transport") return "City in motion";
  if (leader.key === "cruises") return "Port-day energy";
  if (leader.key === "food") return "Food-forward";
  if (leader.key === "stays") return "Visitor activity";
  return "Experience energy";
}

export default function LiveCityPulse({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const [summary, setSummary] = useState<LiveSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "unavailable">("loading");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/internal/${encodeURIComponent(citySlug)}/live-summary`, {
          cache: "no-store",
          headers: { "x-dcc-surface": "city-pulse" },
        });
        if (!response.ok) throw new Error(`live-summary ${response.status}`);
        const payload = (await response.json()) as LiveSummary;
        if (cancelled) return;
        setSummary(payload);
        setUpdatedAt(new Date());
        setStatus("live");
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    };

    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [citySlug]);

  const visibleLanes = useMemo(() => {
    const counts = summary?.action_counts || {};
    return LANES
      .map((lane) => ({ ...lane, value: Number(counts[lane.key] || 0) }))
      .filter((lane) => lane.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [summary]);

  const stale = Boolean(summary?.freshness?.graph_stale || summary?.freshness?.action_sources_stale);

  return (
    <aside className="rounded-[26px] border border-cyan-300/20 bg-black/35 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">Live city pulse</p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[-0.03em] text-white">
            {deriveSignal(summary)}
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/72">
          <span className={`h-2 w-2 rounded-full ${status === "live" && !stale ? "bg-emerald-300" : status === "loading" ? "bg-amber-300" : "bg-zinc-500"}`} />
          {status === "live" ? (stale ? "refreshing" : "live") : status}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/68">
        A current read on {cityName}. Dynamic signals are fetched live and treated as disposable, not permanent destination facts.
      </p>

      {visibleLanes.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {visibleLanes.map((lane) => (
            <div key={lane.key} className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/48">{lane.label}</div>
              <div className="mt-1 text-lg font-black text-white">{lane.value}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/38">live signals</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/58">
          {status === "loading" ? "Reading current city sources…" : "No current signal inventory is available from the live graph yet."}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/42">
        {summary?.trend ? <span>Trend: {summary.trend}</span> : null}
        {summary?.latest_event_type ? <span>Latest: {summary.latest_event_type}</span> : null}
        {summary?.providers?.length ? <span>{summary.providers.length} live source{summary.providers.length === 1 ? "" : "s"}</span> : null}
        {updatedAt ? <span>Checked {updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> : null}
      </div>
    </aside>
  );
}
