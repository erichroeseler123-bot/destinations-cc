import type { MissionDetail } from "@/lib/dcc/earthos/workflows/types";

function getTone(mission: MissionDetail): string {
  if (mission.status === "failed") {
    return "border-rose-500/35 bg-rose-950/30 text-rose-50";
  }

  if (mission.status === "completed") {
    return "border-emerald-400/35 bg-emerald-500/12 text-emerald-50";
  }

  if (mission.intelligence?.riskLevel === "High") {
    return "border-rose-500/40 bg-rose-950/40 text-rose-50 shadow-[0_22px_50px_rgba(190,24,93,0.18)]";
  }

  if (mission.intelligence?.riskLevel === "Watch") {
    return "border-amber-400/35 bg-amber-950/24 text-amber-50";
  }

  return "border-cyan-400/30 bg-cyan-500/10 text-cyan-50";
}

export function ContextualAlert({ mission }: { mission: MissionDetail }) {
  const intelligence = mission.intelligence;

  if (!intelligence && mission.status === "running") {
    return null;
  }

  const headline = intelligence?.headline || (mission.status === "failed" ? "MISSION TERMINATED" : "MISSION ACTIVE");
  const action =
    intelligence?.recommendedAction || (mission.status === "completed" ? "Dispatch complete" : "Monitor");
  const briefing =
    intelligence?.briefing ||
    mission.error?.message ||
    "EarthOS has not produced a synthesized briefing for this mission yet.";

  return (
    <section className={`mt-8 rounded-[1.7rem] border p-6 ${getTone(mission)}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] opacity-75">
            State Of The Mission
          </div>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em]">{headline}</h2>
          <p className="mt-4 text-sm leading-7 text-white/80">{briefing}</p>
        </div>

        <div className="min-w-[180px] rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
            Recommended Action
          </div>
          <div className="mt-3 text-lg font-bold text-white">{action}</div>
          {intelligence ? (
            <div className="mt-4 text-xs uppercase tracking-[0.18em] text-white/55">
              Alerts {intelligence.dccSignals.alertCount}
              {intelligence.dccSignals.graphHealth !== null
                ? ` · Graph ${intelligence.dccSignals.graphHealth}`
                : ""}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
