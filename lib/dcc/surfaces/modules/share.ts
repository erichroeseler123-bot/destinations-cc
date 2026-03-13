import type { EntitySurfaceIndexEntry, SurfaceShareModule } from "@/lib/dcc/surfaces/types";

export function resolveShareModule(entity: EntitySurfaceIndexEntry): {
  data: SurfaceShareModule;
} {
  const cards: SurfaceShareModule["cards"] = [];

  if (entity.entityType === "city" || entity.entityType === "port") {
    cards.push({ kind: "weekend", enabled: true, context: entity.key });
    cards.push({ kind: "next48", enabled: true, context: entity.key });
  }

  if (entity.entityType === "venue") {
    cards.push({ kind: "livePulse", enabled: true, context: entity.key });
  }

  if (cards.length === 0) {
    cards.push({ kind: "weekend", enabled: false, context: entity.key });
  }

  return { data: { cards } };
}
