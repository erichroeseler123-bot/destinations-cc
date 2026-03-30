import { normalizeNext48Items } from "@/lib/dcc/next48/normalize";
import { createEmptyBuckets } from "@/lib/dcc/next48/timeBuckets";
import { fetchConcertItems } from "@/lib/dcc/next48/sources/concerts";
import { fetchSportsItems } from "@/lib/dcc/next48/sources/sports";
import { fetchFestivalItems } from "@/lib/dcc/next48/sources/festivals";
import { fetchTourItems } from "@/lib/dcc/next48/sources/tours";
import { fetchCuratedItems } from "@/lib/dcc/next48/sources/curated";
import { buildNext48LivePulseOverlayItems } from "@/lib/dcc/livePulse/next48";
import { NEXT48_SUPPORTED, isSupportedNext48Entity } from "@/lib/dcc/next48/supported";
import {
  NEXT48_FILTERS,
  type Next48CandidateItem,
  type Next48Feed,
  type Next48SourceResult,
  type Next48SourceContext,
  type Next48SourceName,
} from "@/lib/dcc/next48/types";

export function isNext48Supported(entityType: "city" | "port", slug: string): boolean {
  return isSupportedNext48Entity(entityType, slug);
}

export async function buildNext48Feed(context: Next48SourceContext): Promise<Next48Feed> {
  const buckets = createEmptyBuckets<ReturnType<typeof normalizeNext48Items>[number]>();

  const sourceCalls: Array<{ source: Next48SourceName; run: () => Promise<Next48SourceResult> }> = [
    { source: "concerts", run: () => fetchConcertItems(context) },
    { source: "sports", run: () => fetchSportsItems(context) },
    { source: "festivals", run: () => fetchFestivalItems(context) },
    { source: "tours", run: () => fetchTourItems(context) },
    { source: "curated", run: () => fetchCuratedItems(context) },
  ];

  const settled = await Promise.allSettled(sourceCalls.map((call) => call.run()));

  const combinedItems: Next48CandidateItem[] = [];
  const sourceDiagnostics: Next48Feed["sourceDiagnostics"] = [];

  settled.forEach((result, index) => {
    const source = sourceCalls[index]?.source;
    if (!source) return;

    if (result.status === "fulfilled") {
      const payload = result.value;
      combinedItems.push(...payload.items);
      sourceDiagnostics.push({
        source,
        status: "ok",
        itemCount: payload.items.length,
      });
    } else {
      sourceDiagnostics.push({
        source,
        status: "error",
        itemCount: 0,
        error: String(result.reason || "source failed"),
      });
    }
  });

  const livePulseItems = buildNext48LivePulseOverlayItems(context);
  combinedItems.push(...livePulseItems);
  sourceDiagnostics.push({
    source: "live-pulse",
    status: "ok",
    itemCount: livePulseItems.length,
  });

  const normalized = normalizeNext48Items(combinedItems, context.now);
  for (const item of normalized) {
    buckets[item.bucket].push(item);
  }

  const counts = {
    now: buckets.now.length,
    tonight: buckets.tonight.length,
    tomorrow: buckets.tomorrow.length,
    "later-48h": buckets["later-48h"].length,
  };

  return {
    entityType: context.entityType,
    slug: context.slug,
    generatedAt: context.now.toISOString(),
    buckets,
    counts,
    totalItems: normalized.length,
    sourceDiagnostics,
    availableFilters: NEXT48_FILTERS,
  };
}
