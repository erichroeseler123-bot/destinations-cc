import type { MissionListItem, MissionStatus } from "@/lib/dcc/earthos/workflows/types";

export function formatRelativeTime(input: string | null): string {
  if (!input) return "No checkpoint";

  const value = new Date(input).getTime();
  if (!Number.isFinite(value)) return input;

  const deltaMs = Date.now() - value;
  const minutes = Math.max(0, Math.round(deltaMs / 60000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return "Unknown";

  const totalMinutes = Math.max(0, Math.round(durationMs / 60000));
  if (totalMinutes < 60) return `${totalMinutes}m`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function statusTone(
  status: MissionStatus,
  flags?: { isStale?: boolean; isOverdueApproval?: boolean },
): string {
  if (flags?.isStale) return "border-rose-400/30 bg-rose-400/12 text-rose-100";
  if (status === "failed") return "border-rose-400/30 bg-rose-400/12 text-rose-100";
  if (flags?.isOverdueApproval) return "border-amber-300/30 bg-amber-300/14 text-amber-50";
  if (status === "waiting") return "border-amber-300/30 bg-amber-300/12 text-amber-50";
  if (status === "running") return "border-cyan-300/30 bg-cyan-300/12 text-cyan-100";
  return "border-emerald-400/30 bg-emerald-400/12 text-emerald-100";
}

export function actionLabel(mission: MissionListItem): string {
  if (mission.status === "waiting") return "Review";
  if (mission.status === "failed" || mission.isStale) return "Inspect";
  if (mission.status === "completed") return "Open Brief";
  return "View";
}

export function summarizePriority(missions: MissionListItem[]) {
  return {
    needsApproval: missions.filter((mission) => mission.status === "waiting"),
    failures: missions.filter((mission) => mission.status === "failed"),
    staleRuns: missions.filter((mission) => mission.isStale),
  };
}
