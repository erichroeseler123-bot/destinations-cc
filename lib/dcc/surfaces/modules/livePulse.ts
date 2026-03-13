import { buildLivePulseFeed } from "@/lib/dcc/livePulse/feed";
import type { LivePulseQuery } from "@/lib/dcc/livePulse/types";
import type { EntitySurfaceIndexEntry, SurfaceLivePulseModule } from "@/lib/dcc/surfaces/types";

function toLivePulseQuery(entity: EntitySurfaceIndexEntry): LivePulseQuery | null {
  switch (entity.entityType) {
    case "city":
      return {
        entityType: "city",
        entitySlug: entity.slug,
        target: "city-feed",
        limit: 8,
      };
    case "port":
      return {
        entityType: "port",
        entitySlug: entity.slug,
        target: "entity",
        limit: 8,
      };
    case "venue":
      return {
        entityType: "venue",
        entitySlug: entity.slug,
        target: "entity",
        limit: 8,
      };
    default:
      return null;
  }
}

export function resolveLivePulseModule(entity: EntitySurfaceIndexEntry, now = new Date()): {
  data: SurfaceLivePulseModule;
  warning?: string;
} {
  const query = toLivePulseQuery(entity);
  if (!query) {
    return {
      data: { supported: false, feed: null },
      warning: `Live Pulse not supported for entity type ${entity.entityType}`,
    };
  }

  const feed = buildLivePulseFeed(query, now);
  return {
    data: { supported: true, feed },
  };
}
