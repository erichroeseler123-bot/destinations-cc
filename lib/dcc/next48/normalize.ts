import { scoreNext48Item } from "@/lib/dcc/next48/score";
import { getBucketForTime } from "@/lib/dcc/next48/timeBuckets";
import type { Next48CandidateItem, Next48Item } from "@/lib/dcc/next48/types";

export function normalizeNext48Items(items: Next48CandidateItem[], now: Date): Next48Item[] {
  const out: Next48Item[] = [];

  for (const item of items) {
    const startAt = new Date(item.startAt);
    if (Number.isNaN(startAt.getTime())) continue;

    const bucket = getBucketForTime(startAt, now);
    if (!bucket) continue;

    out.push({
      ...item,
      bucket,
      score: scoreNext48Item(item, now),
    });
  }

  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  return out;
}
