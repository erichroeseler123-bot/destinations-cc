import { buildNext48Feed, isNext48Supported } from "@/lib/dcc/next48/feed";
import type { Next48EntityType } from "@/lib/dcc/next48/types";
import type { EntitySurfaceIndexEntry, SurfaceNext48Module } from "@/lib/dcc/surfaces/types";

function asNext48EntityType(entityType: EntitySurfaceIndexEntry["entityType"]): Next48EntityType | null {
  if (entityType === "city" || entityType === "port") return entityType;
  return null;
}

export async function resolveNext48Module(entity: EntitySurfaceIndexEntry, now = new Date()): Promise<{
  data: SurfaceNext48Module;
  warning?: string;
}> {
  const type = asNext48EntityType(entity.entityType);
  if (!type) {
    return {
      data: { supported: false, feed: null },
      warning: `Next48 not supported for entity type ${entity.entityType}`,
    };
  }

  const supported = isNext48Supported(type, entity.slug);
  if (!supported) {
    return {
      data: { supported: false, feed: null },
      warning: `Next48 support not configured for ${entity.key}`,
    };
  }

  const feed = await buildNext48Feed({ entityType: type, slug: entity.slug, now });
  return {
    data: { supported: true, feed },
  };
}
