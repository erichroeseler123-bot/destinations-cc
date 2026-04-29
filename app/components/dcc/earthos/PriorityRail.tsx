import Link from "next/link";
import type { MissionListItem } from "@/lib/dcc/earthos/workflows/types";
import { formatRelativeTime, summarizePriority } from "./dashboardUtils";

function PrioritySection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: MissionListItem[];
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">{title}</div>
          <p className="mt-2 text-sm text-zinc-300">{subtitle}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white">
          {items.length}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-500">
            Nothing urgent here.
          </div>
        ) : (
          items.slice(0, 4).map((mission) => (
            <Link
              key={mission.id}
              href={`/dashboard/missions/${mission.id}`}
              className="block rounded-2xl border border-white/8 bg-black/20 px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="text-sm font-bold text-white">{mission.mission}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                {mission.entity} · {mission.region}
              </div>
              <div className="mt-2 text-sm text-zinc-300">
                {mission.currentStep || "No active step"} · {formatRelativeTime(mission.lastCheckpointAt || mission.updatedAt)}
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

export function PriorityRail({ missions }: { missions: MissionListItem[] }) {
  const priority = summarizePriority(missions);

  return (
    <aside className="space-y-5">
      <PrioritySection
        title="Needs Approval"
        subtitle="Paused missions waiting on operator sign-off."
        items={priority.needsApproval}
      />
      <PrioritySection
        title="Failures"
        subtitle="Hard failures that need inspection before the lane moves again."
        items={priority.failures}
      />
      <PrioritySection
        title="Stale Running"
        subtitle="Runs that have not checkpointed inside the stale threshold."
        items={priority.staleRuns}
      />
    </aside>
  );
}
