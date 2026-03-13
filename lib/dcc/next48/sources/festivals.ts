import { getNext48CuratedSeed } from "@/src/data/next48-curated";
import type {
  Next48CandidateItem,
  Next48SourceContext,
  Next48SourceResult,
} from "@/lib/dcc/next48/types";

function toStartIso(now: Date, startsInHours: number): string {
  return new Date(now.getTime() + startsInHours * 60 * 60 * 1000).toISOString();
}

export async function fetchFestivalItems(
  context: Next48SourceContext
): Promise<Next48SourceResult> {
  if (context.debugFailSource === "festivals") {
    throw new Error("debug failure for festivals source");
  }

  const seed = getNext48CuratedSeed(context.entityType, context.slug);
  if (!seed) return { source: "festivals", status: "ok", items: [] };

  const items: Next48CandidateItem[] = seed.items
    .filter((item) => item.source === "festivals")
    .map((item) => ({
      id: item.id,
      source: "festivals",
      category: item.category,
      title: item.title,
      startAt: toStartIso(context.now, item.startsInHours),
      venueOrArea: item.venueOrArea,
      image: item.image,
      whyItMatters: item.whyItMatters,
      significance: item.significance,
      actionability: item.actionability,
      localRelevance: item.localRelevance,
      authorityCta: item.authorityCta,
      executionCta: item.executionCta,
    }));

  return { source: "festivals", status: "ok", items };
}
