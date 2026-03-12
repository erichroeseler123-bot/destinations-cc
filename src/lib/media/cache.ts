import type { MediaRecord } from "@/src/lib/media/types";

const mediaCache = new Map<string, MediaRecord>();

function cacheKey(entityType: MediaRecord["entityType"], slug: string) {
  return `${entityType}:${slug}`;
}

export function getCachedMediaRecord(entityType: MediaRecord["entityType"], slug: string): MediaRecord | null {
  return mediaCache.get(cacheKey(entityType, slug)) || null;
}

export function setCachedMediaRecord(record: MediaRecord): MediaRecord {
  mediaCache.set(cacheKey(record.entityType, record.slug), record);
  return record;
}

export function clearCachedMediaRecord(entityType: MediaRecord["entityType"], slug: string) {
  mediaCache.delete(cacheKey(entityType, slug));
}
