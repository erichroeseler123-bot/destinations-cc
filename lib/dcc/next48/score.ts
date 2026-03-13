import type { Next48CandidateItem } from "@/lib/dcc/next48/types";

const MS_HOUR = 60 * 60 * 1000;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function recencyScore(startAt: Date, now: Date): number {
  const deltaHours = (startAt.getTime() - now.getTime()) / MS_HOUR;
  if (deltaHours <= 0) return 1;
  return clamp01(1 - deltaHours / 48);
}

export function scoreNext48Item(item: Next48CandidateItem, now: Date): number {
  const recency = recencyScore(new Date(item.startAt), now);
  const significance = clamp01(item.significance);
  const actionability = clamp01(item.actionability);
  const localRelevance = clamp01(item.localRelevance);

  const raw =
    recency * 0.35 +
    significance * 0.25 +
    actionability * 0.2 +
    localRelevance * 0.2;

  return Number(raw.toFixed(4));
}
