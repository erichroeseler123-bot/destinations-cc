import type { MissionListItem } from "@/lib/dcc/earthos/workflows/types";
import { statusTone } from "./dashboardUtils";

export function StatusPill({ mission }: { mission: MissionListItem }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${statusTone(
          mission.status,
          {
            isStale: mission.isStale,
            isOverdueApproval: mission.isOverdueApproval,
          },
        )}`}
      >
        {mission.status}
      </span>

      {mission.isStale ? (
        <span className="inline-flex rounded-full border border-rose-300/30 bg-rose-300/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-100">
          Stale
        </span>
      ) : null}

      {mission.isOverdueApproval ? (
        <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-50">
          Overdue
        </span>
      ) : null}
    </div>
  );
}
