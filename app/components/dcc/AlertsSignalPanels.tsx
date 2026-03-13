"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { serializeAliveFilter } from "@/lib/dcc/taxonomy/lanes";
import type { PlaceDiscoveryCard } from "@/lib/dcc/graph/placeActionGraph";

type Props = {
  allPulse: PlaceDiscoveryCard[];
};

function actionScore(row: PlaceDiscoveryCard): number {
  return (
    (row.action_counts.tours || 0) +
    (row.action_counts.cruises || 0) +
    (row.action_counts.transport || 0) +
    (row.action_counts.events || 0)
  );
}

function rankRows(rows: PlaceDiscoveryCard[], limit: number, actionBackedOnly: boolean): PlaceDiscoveryCard[] {
  const sorted = [...rows].sort((a, b) => actionScore(b) - actionScore(a));
  if (actionBackedOnly) {
    return sorted.filter((row) => actionScore(row) > 0).slice(0, limit);
  }

  const actionBacked = sorted.filter((row) => actionScore(row) > 0);
  const fallback = sorted.filter((row) => actionScore(row) === 0);
  return [...actionBacked, ...fallback].slice(0, limit);
}

export default function AlertsSignalPanels({ allPulse }: Props) {
  const [actionBackedOnly, setActionBackedOnly] = useState(true);

  const degrading = useMemo(
    () => rankRows(allPulse.filter((row) => row.trend === "degrading"), 8, actionBackedOnly),
    [allPulse, actionBackedOnly]
  );
  const improving = useMemo(
    () => rankRows(allPulse.filter((row) => row.trend === "improving"), 6, actionBackedOnly),
    [allPulse, actionBackedOnly]
  );
  const normal = useMemo(
    () => rankRows(allPulse.filter((row) => row.trend === "normal"), 6, actionBackedOnly),
    [allPulse, actionBackedOnly]
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Alerts Filter</p>
          <p className="text-sm text-zinc-300">Prioritize places with real tours/cruises/transport inventory.</p>
        </div>
        <button
          type="button"
          onClick={() => setActionBackedOnly((value) => !value)}
          className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
        >
          {actionBackedOnly ? "Showing action-backed only" : "Showing all signal rows"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-rose-200">Degrading Now</p>
            <h2 className="text-2xl font-bold">Signals worth checking before you commit</h2>
          </div>
          <div className="space-y-3">
            {degrading.length > 0 ? (
              degrading.map((row) => (
                <Link
                  key={row.place_id}
                  href={`/nodes/${row.place_slug}?alive=${encodeURIComponent(
                    serializeAliveFilter(["tours", "cruises", "transport", "events"])
                  )}`}
                  className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-black/30"
                >
                  <div className="font-semibold text-zinc-100">{row.title}</div>
                  <div className="mt-1 text-sm text-zinc-300">
                    trend {row.trend} • tours {row.action_counts.tours} • cruises {row.action_counts.cruises} • transport {row.action_counts.transport}
                  </div>
                  {row.latest_event ? (
                    <div className="mt-2 text-xs uppercase tracking-wider text-rose-200">
                      latest event: {row.latest_event}
                    </div>
                  ) : null}
                </Link>
              ))
            ) : (
              <p className="text-sm text-zinc-400">No degrading rows matched the current filter.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Stable / Improving</p>
            <h2 className="text-2xl font-bold">Cleaner planning surfaces right now</h2>
          </div>
          <div className="space-y-3">
            {[...improving, ...normal].slice(0, 8).map((row) => (
              <Link
                key={`${row.place_id}:${row.trend}`}
                href={`/nodes/${row.place_slug}?alive=${encodeURIComponent(serializeAliveFilter(["tours", "cruises"]))}`}
                className="block rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-black/30"
              >
                <div className="font-semibold text-zinc-100">{row.title}</div>
                <div className="mt-1 text-sm text-zinc-300">
                  trend {row.trend} • tours {row.action_counts.tours} • cruises {row.action_counts.cruises}
                </div>
              </Link>
            ))}
            {[...improving, ...normal].length === 0 ? (
              <p className="text-sm text-zinc-400">No stable/improving rows matched the current filter.</p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
