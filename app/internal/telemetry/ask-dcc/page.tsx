import type { Metadata } from "next";
import Link from "next/link";
import { listRecentProductionCorridorEvents } from "@/lib/dcc/telemetry/corridorEvents";
import { getTelemetryDashboardSnapshot } from "@/lib/dcc/telemetry/queries";
import { buildNoindexRobots } from "@/lib/seo/indexingPolicy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Ask DCC Learning | Internal Telemetry",
  robots: buildNoindexRobots(),
};

type CountRow = { value: string; count: number };

function topCounts(values: string[], limit = 12): CountRow[] {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) || 0) + 1);
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

function metadataNumber(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function metadataStrings(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString();
}

export default async function AskDccTelemetryPage() {
  const [events, dashboard] = await Promise.all([
    listRecentProductionCorridorEvents(10000),
    getTelemetryDashboardSnapshot(null),
  ]);
  const askEvents = events.filter((event) => event.corridorId === "ask-dcc");
  const submitted = askEvents.filter((event) => event.eventName === "destination_selected" && metadataString(event.metadata, "ask_stage") === "question_submitted");
  const answered = askEvents.filter((event) => event.eventName === "recommendation_rendered" && metadataString(event.metadata, "ask_stage") === "answer_rendered");
  const offered = askEvents.filter((event) => event.eventName === "handoff_viewed" && metadataString(event.metadata, "ask_stage") === "handoff_offered");
  const clicked = askEvents.filter((event) => event.eventName === "recommendation_clicked" && metadataString(event.metadata, "ask_stage") === "handoff_clicked");
  const sessions = new Set(askEvents.map((event) => event.sessionId).filter(Boolean));
  const aiAnswers = answered.filter((event) => metadataString(event.metadata, "answer_mode") === "ai");
  const graphAnswers = answered.filter((event) => metadataString(event.metadata, "answer_mode") === "graph");
  const noMatchAnswers = answered.filter((event) => metadataNumber(event.metadata, "source_count") === 0);
  const sourceSlugs = topCounts(answered.flatMap((event) => metadataStrings(event.metadata, "source_slugs")));
  const handoffSites = topCounts(offered.map((event) => metadataString(event.metadata, "handoff_site")));
  const questions = topCounts(submitted.map((event) => metadataString(event.metadata, "question")), 20);
  const noMatchQuestions = topCounts(noMatchAnswers.map((event) => metadataString(event.metadata, "question")), 20);
  const askHandoffSummaries = dashboard.recentSummaries.filter((summary) => summary.handoffId.startsWith("ask_"));
  const converted = askHandoffSummaries.filter((summary) => ["booking_completed", "partner_booking_completed"].includes(summary.latestEventType));
  const recognizedRevenue = converted.reduce((sum, summary) => sum + Number(summary.bookingAmount || 0), 0);
  const clickSessions = new Set(clicked.map((event) => event.sessionId).filter(Boolean));
  const convertedSessions = new Set(converted.map((summary) => summary.handoffId));
  const clickToConversion = Array.from(clickSessions).filter((id) => convertedSessions.has(id!)).length;

  const cards = [
    ["Questions", submitted.length],
    ["Sessions", sessions.size],
    ["Answers", answered.length],
    ["No strong match", noMatchAnswers.length],
    ["Handoffs offered", offered.length],
    ["Handoffs clicked", clicked.length],
    ["Attributed bookings", converted.length],
    ["Attributed revenue", recognizedRevenue ? `$${recognizedRevenue.toFixed(2)}` : "$0.00"],
  ] as const;

  return (
    <main className="min-h-screen bg-[#090d13] px-5 py-12 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Internal · learning loop</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Ask DCC intelligence</h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-400">Question → evidence → answer mode → governed handoff → click → downstream booking signal, joined by the Ask DCC handoff ID.</p>
          </div>
          <Link href="/internal/telemetry" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-600">Main telemetry →</Link>
        </div>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-[#0d131d] p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6">
            <p className="text-xs font-black uppercase tracking-wider text-cyan-300">Answer engine</p>
            <p className="mt-4 text-2xl font-black text-white">AI {aiAnswers.length} · Graph {graphAnswers.length}</p>
            <p className="mt-2 text-sm text-slate-400">AI synthesis share: {percent(aiAnswers.length, answered.length)}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6">
            <p className="text-xs font-black uppercase tracking-wider text-amber-300">Handoff funnel</p>
            <p className="mt-4 text-2xl font-black text-white">{percent(clicked.length, offered.length)} click-through</p>
            <p className="mt-2 text-sm text-slate-400">{clicked.length} clicks from {offered.length} offers.</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Commercial outcome</p>
            <p className="mt-4 text-2xl font-black text-white">{percent(clickToConversion, clickSessions.size)} click-to-booking</p>
            <p className="mt-2 text-sm text-slate-400">Only conversions that return the same `dcc_handoff_id` count here.</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6">
            <h2 className="text-xl font-black text-white">What people are asking</h2>
            <p className="mt-2 text-sm text-slate-400">Demand signal for new decision nodes and better matching.</p>
            <div className="mt-5 space-y-2">
              {questions.length ? questions.map((row) => <div key={row.value} className="flex gap-4 rounded-xl border border-slate-800 px-4 py-3"><span className="min-w-8 font-black text-cyan-300">{row.count}</span><span className="text-sm text-slate-300">{row.value}</span></div>) : <p className="text-sm text-slate-500">No Ask DCC traffic recorded yet.</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-900/40 bg-amber-950/10 p-6">
            <h2 className="text-xl font-black text-white">Content gaps</h2>
            <p className="mt-2 text-sm text-slate-400">Questions that produced zero published decision-guide matches. These are candidates for the governed research queue—not automatic pages.</p>
            <div className="mt-5 space-y-2">
              {noMatchQuestions.length ? noMatchQuestions.map((row) => <div key={row.value} className="flex gap-4 rounded-xl border border-amber-900/30 px-4 py-3"><span className="min-w-8 font-black text-amber-300">{row.count}</span><span className="text-sm text-slate-300">{row.value}</span></div>) : <p className="text-sm text-slate-500">No unmatched questions yet.</p>}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6">
            <h2 className="text-xl font-black text-white">Guides doing the work</h2>
            <div className="mt-5 space-y-2">{sourceSlugs.length ? sourceSlugs.map((row) => <div key={row.value} className="flex justify-between gap-4 border-b border-slate-800 py-2 text-sm"><span className="text-slate-300">{row.value}</span><strong className="text-white">{row.count}</strong></div>) : <p className="text-sm text-slate-500">No source usage yet.</p>}</div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6">
            <h2 className="text-xl font-black text-white">Where DCC sends people</h2>
            <div className="mt-5 space-y-2">{handoffSites.length ? handoffSites.map((row) => <div key={row.value} className="flex justify-between gap-4 border-b border-slate-800 py-2 text-sm"><span className="text-slate-300">{row.value}</span><strong className="text-white">{row.count}</strong></div>) : <p className="text-sm text-slate-500">No handoffs offered yet.</p>}</div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-[#0d131d] p-6">
          <h2 className="text-xl font-black text-white">Recent Ask DCC event stream</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500"><tr><th className="pb-3">Time</th><th className="pb-3">Stage</th><th className="pb-3">Session</th><th className="pb-3">Target / question</th></tr></thead>
              <tbody>
                {askEvents.slice(0, 80).map((event) => (
                  <tr key={event.eventId} className="border-t border-slate-800 align-top">
                    <td className="py-3 pr-4 text-slate-500">{formatDate(event.occurredAt)}</td>
                    <td className="py-3 pr-4 font-bold text-slate-200">{metadataString(event.metadata, "ask_stage") || event.eventName}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">{event.sessionId || "—"}</td>
                    <td className="py-3 text-slate-300">{metadataString(event.metadata, "question") || metadataString(event.metadata, "handoff_site") || event.targetPath || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
