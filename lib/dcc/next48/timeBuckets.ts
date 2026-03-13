import { NEXT48_BUCKET_ORDER, type Next48BucketKey } from "@/lib/dcc/next48/types";

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;
const MAX_FUTURE_WINDOW_MS = 48 * MS_HOUR;
const NOW_GRACE_MS = 2 * MS_HOUR;
const NOW_LOOKBACK_MS = 3 * MS_HOUR;

export function isWithinNext48Hours(startAt: Date, now: Date): boolean {
  const delta = startAt.getTime() - now.getTime();
  return delta <= MAX_FUTURE_WINDOW_MS && delta >= -NOW_LOOKBACK_MS;
}

export function getBucketForTime(startAt: Date, now: Date): Next48BucketKey | null {
  if (!isWithinNext48Hours(startAt, now)) return null;

  const delta = startAt.getTime() - now.getTime();
  if (delta <= NOW_GRACE_MS && delta >= -NOW_LOOKBACK_MS) {
    return "now";
  }

  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startDay = new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate()).getTime();

  if (startDay === nowDay) {
    return "tonight";
  }

  if (startDay === nowDay + MS_DAY) {
    return "tomorrow";
  }

  return "later-48h";
}

export function createEmptyBuckets<T>(): Record<Next48BucketKey, T[]> {
  return {
    now: [],
    tonight: [],
    tomorrow: [],
    "later-48h": [],
  };
}

export function sortBucketsByOrder<T>(
  buckets: Record<Next48BucketKey, T[]>
): Array<{ key: Next48BucketKey; items: T[] }> {
  return NEXT48_BUCKET_ORDER.map((key) => ({ key, items: buckets[key] || [] }));
}
