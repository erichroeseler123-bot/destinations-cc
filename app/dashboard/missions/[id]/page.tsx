import Link from "next/link";
import { notFound } from "next/navigation";
import { ApprovalPanel } from "@/app/components/dcc/earthos/ApprovalPanel";
import { ContextualAlert } from "@/app/components/dcc/earthos/ContextualAlert";
import { PublishMissionButton } from "@/app/components/dcc/earthos/PublishMissionButton";
import { getWorkflowMission } from "@/lib/dcc/earthos/workflows/service";
import { formatDuration, formatRelativeTime, statusTone } from "@/app/components/dcc/earthos/dashboardUtils";

export const metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function stepKind(stepName: string): "durable" | "standard" {
  const lowered = stepName.toLowerCase();
  if (
    lowered.includes("mcp") ||
    lowered.includes("fetch") ||
    lowered.includes("scan") ||
    lowered.includes("synth")
  ) {
    return "durable";
  }

  return "standard";
}

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mission = await getWorkflowMission(id);

  if (!mission) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-[#f5c66c] hover:text-[#ffd989]">
              Back to Mission Control
            </Link>
            <div className="mt-4 text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">
              {mission.entity} · {mission.region}
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{mission.mission}</h1>
            <div className="mt-3 text-sm text-zinc-400">{mission.id}</div>
          </div>

          <div
            className={`inline-flex rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] ${statusTone(
              mission.status,
              {
                isStale: mission.isStale,
                isOverdueApproval: mission.isOverdueApproval,
              },
            )}`}
          >
            {mission.status}
          </div>
        </div>

        {mission.status === "completed" && mission.intelligence ? (
          <div className="mt-6">
            <PublishMissionButton missionId={mission.id} existingPath={mission.publication?.path || null} />
          </div>
        ) : null}

        <ContextualAlert mission={mission} />

        {mission.status === "waiting" && mission.waitingForEvent ? (
          <ApprovalPanel missionId={mission.id} eventName={mission.waitingForEvent} />
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Current Step</div>
            <div className="mt-3 text-lg font-bold text-white">{mission.currentStep || "No active step"}</div>
          </article>
          <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Last Checkpoint</div>
            <div className="mt-3 text-lg font-bold text-white">
              {formatRelativeTime(mission.lastCheckpointAt || mission.updatedAt)}
            </div>
          </article>
          <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Age</div>
            <div className="mt-3 text-lg font-bold text-white">{formatDuration(mission.durationMs)}</div>
          </article>
          <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Waiting Event</div>
            <div className="mt-3 text-lg font-bold text-white">{mission.waitingForEvent || "None"}</div>
          </article>
        </section>

        {mission.error ? (
          <section className="mt-8 rounded-[1.6rem] border border-rose-400/20 bg-rose-400/10 p-6 text-rose-100">
            <div className="text-[11px] font-black uppercase tracking-[0.24em]">Failure Block</div>
            <div className="mt-3 text-lg font-bold">{mission.error.message}</div>
            {mission.error.step ? <div className="mt-2 text-sm text-rose-100/80">Step: {mission.error.step}</div> : null}
          </section>
        ) : null}

        {mission.result || mission.payload ? (
          <section className="mt-8 rounded-[1.6rem] border border-cyan-300/20 bg-cyan-300/10 p-6 text-cyan-50">
            <div className="text-[11px] font-black uppercase tracking-[0.24em]">Briefing Output</div>
            <h2 className="mt-2 text-2xl font-black">Mission briefing and context</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[1.2rem] border border-cyan-300/15 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100/70">Result</div>
                <pre className="mt-3 overflow-x-auto text-xs leading-6 text-cyan-50/90">
                  {JSON.stringify(mission.result || {}, null, 2)}
                </pre>
              </div>
              <div className="rounded-[1.2rem] border border-cyan-300/15 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100/70">Payload</div>
                <pre className="mt-3 overflow-x-auto text-xs leading-6 text-cyan-50/90">
                  {JSON.stringify(mission.payload || {}, null, 2)}
                </pre>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.92),rgba(10,9,8,0.96))] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f5c66c]">Step Timeline</div>
            <h2 className="mt-2 text-2xl font-black text-white">Durable checkpoints and retries</h2>
          </div>
          <div className="space-y-4 px-6 py-6">
            {mission.steps.map((step) => (
              <article key={step.id} className="rounded-[1.3rem] border border-white/8 bg-black/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-bold text-white">{step.name}</div>
                      {stepKind(step.name) === "durable" ? (
                        <span className="inline-flex animate-pulse rounded-full border border-cyan-300/30 bg-cyan-300/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100">
                          Durable
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{step.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${statusTone(
                        step.status,
                      )}`}
                    >
                      {step.status}
                    </span>
                    {step.retryCount > 0 ? (
                      <span className="inline-flex rounded-full border border-rose-300/30 bg-rose-300/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-100">
                        {step.retryCount} retries
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-zinc-300 md:grid-cols-3">
                  <div>Started: {step.startedAt ? new Date(step.startedAt).toLocaleString() : "Unknown"}</div>
                  <div>Ended: {step.endedAt ? new Date(step.endedAt).toLocaleString() : "Still active"}</div>
                  <div>Error: {step.errorMessage || "None"}</div>
                </div>
                {step.outputPreview ? (
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/8 bg-black/30 p-4 text-xs leading-6 text-zinc-300">
                    {step.outputPreview}
                  </pre>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
