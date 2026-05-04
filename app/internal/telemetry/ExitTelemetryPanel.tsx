"use client";

import { useEffect, useMemo, useState } from "react";

type ExitType = "confidence" | "decision" | "direct" | "fallback";
type DecisionPageType = "helicopter" | "whale" | "420" | "vegas" | "cruise";

type ExitEvent = {
  event: string;
  timestamp?: string;
  page?: string;
  surface?: string;
  exit_type?: ExitType;
  page_type?: DecisionPageType;
  cta_role?: string;
  destination?: string;
  time_to_exit_ms?: number;
};

const LOCAL_EVENT_BUFFER_KEY = "dcc_telemetry_buffer_v1";

function readBufferedExitEvents(): ExitEvent[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_EVENT_BUFFER_KEY);
    const parsed = raw ? (JSON.parse(raw) as ExitEvent[]) : [];
    return parsed.filter((event) => event.event === "dcc_exit_clicked");
  } catch {
    return [];
  }
}

function percentage(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function formatMs(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value / 1000).toFixed(1)}s`;
}

export default function ExitTelemetryPanel() {
  const [events, setEvents] = useState<ExitEvent[]>([]);

  useEffect(() => {
    function refresh() {
      setEvents(readBufferedExitEvents());
    }

    refresh();

    function handleEvent() {
      refresh();
    }

    window.addEventListener("dcc:dcc_exit_clicked", handleEvent as EventListener);
    window.addEventListener("storage", handleEvent);
    return () => {
      window.removeEventListener("dcc:dcc_exit_clicked", handleEvent as EventListener);
      window.removeEventListener("storage", handleEvent);
    };
  }, []);

  const summary = useMemo(() => {
    const counts: Record<ExitType, number> = {
      confidence: 0,
      decision: 0,
      direct: 0,
      fallback: 0,
    };

    for (const event of events) {
      if (event.exit_type && event.exit_type in counts) {
        counts[event.exit_type] += 1;
      }
    }

    const total = events.length;
    return {
      total,
      counts,
      decisionScore: total ? Math.round((((counts.confidence + counts.direct) / total) * 100)) : 0,
    };
  }, [events]);

  const byPage = useMemo(() => {
    const pageMap = new Map<
      string,
      { total: number; confidence: number; decision: number; direct: number; fallback: number; totalTime: number; timedCount: number }
    >();

    for (const event of events) {
      const page = event.page || "(unknown)";
      const row = pageMap.get(page) || {
        total: 0,
        confidence: 0,
        decision: 0,
        direct: 0,
        fallback: 0,
        totalTime: 0,
        timedCount: 0,
      };
      row.total += 1;
      if (event.exit_type && event.exit_type in row) {
        row[event.exit_type] += 1;
      }
      if (typeof event.time_to_exit_ms === "number" && Number.isFinite(event.time_to_exit_ms)) {
        row.totalTime += event.time_to_exit_ms;
        row.timedCount += 1;
      }
      pageMap.set(page, row);
    }

    return [...pageMap.entries()]
      .map(([page, row]) => ({
        page,
        ...row,
        decisionScore: row.total ? Math.round((((row.confidence + row.direct) / row.total) * 100)) : 0,
        avgTimeToExitMs: row.timedCount ? Math.round(row.totalTime / row.timedCount) : null,
        fallbackRate: row.total ? row.fallback / row.total : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
  }, [events]);

  const byPageType = useMemo(() => {
    const typeMap = new Map<
      string,
      { total: number; confidence: number; decision: number; direct: number; fallback: number; totalTime: number; timedCount: number }
    >();

    for (const event of events) {
      const pageType = event.page_type || "(untyped)";
      const row = typeMap.get(pageType) || {
        total: 0,
        confidence: 0,
        decision: 0,
        direct: 0,
        fallback: 0,
        totalTime: 0,
        timedCount: 0,
      };
      row.total += 1;
      if (event.exit_type && event.exit_type in row) {
        row[event.exit_type] += 1;
      }
      if (typeof event.time_to_exit_ms === "number" && Number.isFinite(event.time_to_exit_ms)) {
        row.totalTime += event.time_to_exit_ms;
        row.timedCount += 1;
      }
      typeMap.set(pageType, row);
    }

    return [...typeMap.entries()]
      .map(([pageType, row]) => ({
        pageType,
        ...row,
        decisionScore: row.total ? Math.round((((row.confidence + row.direct) / row.total) * 100)) : 0,
        avgTimeToExitMs: row.timedCount ? Math.round(row.totalTime / row.timedCount) : null,
      }))
      .sort((a, b) => b.total - a.total);
  }, [events]);

  const topWeakPages = useMemo(
    () =>
      [...byPage]
        .filter((row) => row.total >= 1)
        .sort((a, b) => b.fallbackRate - a.fallbackRate)
        .slice(0, 5),
    [byPage]
  );

  const topMoneyPages = useMemo(
    () =>
      [...byPage]
        .filter((row) => row.total >= 1)
        .sort((a, b) => b.decisionScore - a.decisionScore)
        .slice(0, 5),
    [byPage]
  );

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Decision Exit Quality</div>
          <p className="mt-2 text-sm text-zinc-300">
            Local buffered `dcc_exit_clicked` events from answer-first heroes and exit cards.
          </p>
        </div>
        <div className="text-sm text-zinc-300">{summary.total} tracked exits</div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Decision Score</div>
          <div className="mt-2 text-3xl font-black text-cyan-200">{summary.decisionScore}%</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Confidence</div>
          <div className="mt-2 text-3xl font-black text-white">{summary.counts.confidence}</div>
          <div className="mt-1 text-xs text-zinc-500">{percentage(summary.counts.confidence, summary.total)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Decision</div>
          <div className="mt-2 text-3xl font-black text-white">{summary.counts.decision}</div>
          <div className="mt-1 text-xs text-zinc-500">{percentage(summary.counts.decision, summary.total)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Direct</div>
          <div className="mt-2 text-3xl font-black text-white">{summary.counts.direct}</div>
          <div className="mt-1 text-xs text-zinc-500">{percentage(summary.counts.direct, summary.total)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Fallback</div>
          <div className="mt-2 text-3xl font-black text-white">{summary.counts.fallback}</div>
          <div className="mt-1 text-xs text-zinc-500">{percentage(summary.counts.fallback, summary.total)}</div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full table-auto text-left text-sm">
          <thead className="border-b border-white/10 bg-black/30 text-zinc-300">
            <tr>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">Page</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">Decision Score</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">Confidence</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">Decision</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">Direct</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">Fallback</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">Avg. Time To Exit</th>
              <th className="px-3 py-3 font-semibold whitespace-nowrap">Total</th>
            </tr>
          </thead>
          <tbody>
            {byPage.map((row) => (
              <tr key={row.page} className="border-b border-white/10">
                <td className="px-3 py-3 text-zinc-200">{row.page}</td>
                <td className="px-3 py-3 whitespace-nowrap text-cyan-200">{row.decisionScore}%</td>
                <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{row.confidence}</td>
                <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{row.decision}</td>
                <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{row.direct}</td>
                <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{row.fallback}</td>
                <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{formatMs(row.avgTimeToExitMs)}</td>
                <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{row.total}</td>
              </tr>
            ))}
            {byPage.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-zinc-400" colSpan={8}>
                  No buffered decision-exit events yet. Browse a few answer-first pages and come back here.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">By Page Type</div>
          <div className="mt-3 space-y-3">
            {byPageType.map((row) => (
              <div key={row.pageType} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-zinc-100">{row.pageType}</div>
                  <div className="text-cyan-200">{row.decisionScore}%</div>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  confidence {row.confidence} • decision {row.decision} • direct {row.direct} • fallback {row.fallback}
                </div>
                <div className="mt-1 text-xs text-zinc-500">avg exit {formatMs(row.avgTimeToExitMs)}</div>
              </div>
            ))}
            {byPageType.length === 0 ? <p className="text-sm text-zinc-400">No typed corridor data yet.</p> : null}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Top Weak Pages</div>
          <div className="mt-3 space-y-3">
            {topWeakPages.map((row) => (
              <div key={row.page} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="font-semibold text-zinc-100">{row.page}</div>
                <div className="mt-1 text-xs text-amber-200">fallback {percentage(row.fallback, row.total)}</div>
                <div className="mt-1 text-xs text-zinc-500">decision score {row.decisionScore}%</div>
              </div>
            ))}
            {topWeakPages.length === 0 ? <p className="text-sm text-zinc-400">No weak pages yet.</p> : null}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Top Money Pages</div>
          <div className="mt-3 space-y-3">
            {topMoneyPages.map((row) => (
              <div key={row.page} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="font-semibold text-zinc-100">{row.page}</div>
                <div className="mt-1 text-xs text-emerald-200">decision score {row.decisionScore}%</div>
                <div className="mt-1 text-xs text-zinc-500">avg exit {formatMs(row.avgTimeToExitMs)}</div>
              </div>
            ))}
            {topMoneyPages.length === 0 ? <p className="text-sm text-zinc-400">No strong pages yet.</p> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
