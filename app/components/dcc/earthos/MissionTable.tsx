import Link from "next/link";
import type { MissionListItem } from "@/lib/dcc/earthos/workflows/types";
import { actionLabel, formatDuration, formatRelativeTime } from "./dashboardUtils";
import { StatusPill } from "./StatusPill";

function riskTone(riskLevel: MissionListItem["intelligence"] extends infer T
  ? T extends { riskLevel: infer R }
    ? R
    : never
  : never) {
  if (riskLevel === "High") {
    return "border-rose-400/30 bg-rose-400/12 text-rose-100";
  }

  if (riskLevel === "Watch") {
    return "border-amber-300/30 bg-amber-300/12 text-amber-50";
  }

  return "border-cyan-300/30 bg-cyan-300/12 text-cyan-100";
}

export function MissionTable({ missions }: { missions: MissionListItem[] }) {
  return (
    <section className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.92),rgba(10,9,8,0.96))] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f5c66c]">Mission Table</div>
        <h2 className="mt-2 text-2xl font-black text-white">EarthOS active mission surface</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Running, waiting, failed, and completed missions rendered from the live workflow contract with a seeded fallback.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-zinc-200">
          <thead className="bg-black/20 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Entity</th>
              <th className="px-6 py-4">Region</th>
              <th className="px-6 py-4">Mission</th>
              <th className="px-6 py-4">Current Step</th>
              <th className="px-6 py-4">Last Checkpoint</th>
              <th className="px-6 py-4">Age</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => (
              <tr key={mission.id} className="border-t border-white/8 align-top">
                <td className="px-6 py-4">
                  <StatusPill mission={mission} />
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold uppercase tracking-[0.14em] text-white">{mission.entity}</div>
                </td>
                <td className="px-6 py-4 text-zinc-300">{mission.region}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-white">{mission.mission}</div>
                  {mission.intelligence ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${riskTone(
                          mission.intelligence.riskLevel,
                        )}`}
                      >
                        {mission.intelligence.riskLevel}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">
                        {mission.intelligence.headline}
                      </span>
                    </div>
                  ) : null}
                  {mission.intelligence ? (
                    <div className="mt-2 text-xs text-zinc-500">
                      Alerts {mission.intelligence.dccSignals.alertCount}
                      {mission.intelligence.dccSignals.graphHealth !== null
                        ? ` · Graph ${mission.intelligence.dccSignals.graphHealth}`
                        : ""}
                    </div>
                  ) : null}
                  <div className="mt-1 text-xs text-zinc-500">{mission.id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-100">{mission.currentStep || "No active step"}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {mission.progressPercent !== null ? `${mission.progressPercent}% complete` : "Progress unknown"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-100">
                    {formatRelativeTime(mission.lastCheckpointAt || mission.updatedAt)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {mission.lastCheckpointAt
                      ? new Date(mission.lastCheckpointAt).toLocaleString()
                      : "No checkpoint recorded"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-100">{formatDuration(mission.durationMs)}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Started {formatRelativeTime(mission.startedAt)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/missions/${mission.id}`}
                    className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:border-[#f5c66c]/40 hover:bg-white/10"
                  >
                    {actionLabel(mission)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
