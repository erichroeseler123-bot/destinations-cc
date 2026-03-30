import Link from "next/link";
import { LIVE_PULSE_SIGNAL_CATALOG, type LivePulseEntityType, type LivePulseSignalType, type LivePulseVisibilityScope } from "@/lib/dcc/livePulse/types";
import { readRuntimeSignals, sweepExpiredSignals } from "@/lib/dcc/livePulse/store";

export const dynamic = "force-dynamic";

type SearchParams = {
  created?: string;
  error?: string;
};

const ENTITY_TYPES: LivePulseEntityType[] = ["city", "port", "venue", "event"];
const VISIBILITY_SCOPES: LivePulseVisibilityScope[] = ["entity-only", "city-feed", "next48-overlay"];
const SIGNAL_TYPES = Object.keys(LIVE_PULSE_SIGNAL_CATALOG) as LivePulseSignalType[];

function formatStatusMessage(sp: SearchParams) {
  if (sp.created === "1") {
    return {
      tone: "success" as const,
      text: "Live Pulse signal created. It will self-expire within two hours.",
    };
  }

  if (!sp.error) return null;

  const messages: Record<string, string> = {
    unauthorized: "Admin session missing or expired.",
    missing_fields: "Entity, slug, signal type, location, and visibility are required.",
    invalid_entity_type: "Entity type is invalid.",
    invalid_signal_type: "Signal type is invalid.",
    invalid_visibility_scope: "Visibility scope is invalid.",
  };

  return {
    tone: "error" as const,
    text: messages[sp.error] || "Could not create the signal.",
  };
}

export default async function LivePulseAdminPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) || {};
  sweepExpiredSignals(new Date());

  const signals = readRuntimeSignals().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const activeSignals = signals.filter((signal) => signal.status === "active");
  const recentSignals = signals.slice(0, 40);
  const message = formatStatusMessage(sp);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Live Pulse Admin</h1>
            <p className="mt-2 text-zinc-300">
              Internal-only short-lived signals for live conditions. Every signal expires within two hours.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/satellite-handoffs"
              className="inline-flex items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Satellite Handoffs
            </Link>
            <Link
              href="/admin/argo-waitlist"
              className="inline-flex items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Argo Waitlist
            </Link>
          </div>
        </div>

        {message ? (
          <div
            className={`mt-6 rounded-2xl border px-5 py-4 text-sm ${
              message.tone === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                : "border-rose-400/30 bg-rose-500/10 text-rose-100"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Create signal</div>
            <h2 className="mt-2 text-2xl font-bold">Post a live condition</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">
              This is internal-only. It does not open public posting. Trust tier is fixed to DCC verified, and the duration is capped at two hours.
            </p>

            <form action="/admin/live-pulse/create" method="post" className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-zinc-300">
                  Entity type
                  <select
                    name="entityType"
                    required
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-white"
                    defaultValue="city"
                  >
                    {ENTITY_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-zinc-300">
                  Entity slug
                  <input
                    type="text"
                    name="entitySlug"
                    required
                    placeholder="denver or juneau"
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-zinc-300">
                  Signal type
                  <select
                    name="signalType"
                    required
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-white"
                    defaultValue="great_right_now"
                  >
                    {SIGNAL_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {LIVE_PULSE_SIGNAL_CATALOG[value].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-zinc-300">
                  Visibility
                  <select
                    name="visibilityScope"
                    required
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-white"
                    defaultValue="entity-only"
                  >
                    {VISIBILITY_SCOPES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="text-sm text-zinc-300">
                Location label
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="Red Rocks Lower South Lot or Juneau Dock"
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
                />
              </label>

              <label className="text-sm text-zinc-300">
                Note
                <textarea
                  name="note"
                  rows={3}
                  maxLength={140}
                  placeholder="Short operator note. Keep it factual."
                  className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-zinc-300">
                  Action hint
                  <input
                    type="text"
                    name="actionHint"
                    placeholder="Use north gate instead."
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
                  />
                </label>
                <label className="text-sm text-zinc-300">
                  Optional link
                  <input
                    type="url"
                    name="linkUrl"
                    placeholder="https://..."
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-white placeholder:text-zinc-500"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                Source will be stored as <code>DCC Admin</code>, trust tier will be <code>dcc-verified</code>, and the signal will expire automatically within two hours.
              </div>

              <div>
                <button
                  type="submit"
                  className="min-h-11 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
                >
                  Post Live Signal
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Active now</div>
              <div className="mt-3 text-3xl font-black text-white">{activeSignals.length}</div>
              <p className="mt-2 text-sm text-zinc-300">Signals currently visible to DCC live experiences.</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">How to use it</div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-300">
                <li>Use it for short operational or vibe signals, not long editorial notes.</li>
                <li>Prefer concrete conditions like lines, parking, weather, and crowd pressure.</li>
                <li>Use `next48-overlay` only when the signal should influence the What&apos;s Live experience.</li>
              </ul>
            </section>
          </aside>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="text-2xl font-bold">Recent signals</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-black/30 text-zinc-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Signal</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Visibility</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                </tr>
              </thead>
              <tbody>
                {recentSignals.map((signal) => (
                  <tr key={signal.id} className="border-b border-white/10">
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          signal.status === "active"
                            ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                            : "border border-white/10 bg-white/5 text-zinc-300"
                        }`}
                      >
                        {signal.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div>{signal.entityType}</div>
                      <div className="mt-1 font-mono text-xs text-cyan-200">{signal.entitySlug}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div>{LIVE_PULSE_SIGNAL_CATALOG[signal.signalType].label}</div>
                      <div className="mt-1 text-xs text-zinc-500">{signal.note || signal.description}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{signal.location}</td>
                    <td className="px-4 py-3 text-zinc-300">{signal.visibilityScope}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div>{signal.sourceName}</div>
                      <div className="mt-1 text-xs text-zinc-500">{signal.trustTier}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{new Date(signal.expiresAt).toLocaleString()}</td>
                  </tr>
                ))}
                {recentSignals.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-zinc-400" colSpan={7}>
                      No live-pulse signals have been posted yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
