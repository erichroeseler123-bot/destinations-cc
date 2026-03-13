import { buildLivePulseFeed } from "@/lib/dcc/livePulse/feed";
import type { Next48CandidateItem, Next48EntityType, Next48SourceContext } from "@/lib/dcc/next48/types";

function toCategory(category: "operational" | "vibe"): Next48CandidateItem["category"] {
  if (category === "vibe") return "nightlife";
  return "festivals";
}

export function buildNext48LivePulseOverlayItems(
  context: Next48SourceContext
): Next48CandidateItem[] {
  const entityType: Next48EntityType = context.entityType;
  if (entityType !== "city" && entityType !== "port") return [];
  const feed = buildLivePulseFeed(
    {
      entityType,
      entitySlug: context.slug,
      target: "next48-overlay",
      limit: 6,
    },
    context.now
  );

  return feed.items.map((item) => ({
    id: `live-pulse-${item.id}`,
    source: "live-pulse",
    category: toCategory(item.category),
    title: item.title,
    startAt: item.startTime,
    venueOrArea: item.location,
    image: item.imageUrl || "/images/authority/cities/denver/hero.webp",
    whyItMatters: `${item.description} Action: ${item.actionHint}`,
    significance: Math.max(0.4, Math.min(1, item.score)),
    actionability: 0.9,
    localRelevance: 0.95,
    authorityCta: {
      label: "Open Live Pulse",
      href: entityType === "city" ? `/cities/${context.slug}` : `/ports/${context.slug}`,
      kind: "internal",
    },
    executionCta: item.linkUrl
      ? {
          label: "Open source",
          href: item.linkUrl,
          kind: item.linkUrl.startsWith("/") ? "internal" : "external",
        }
      : undefined,
  }));
}
