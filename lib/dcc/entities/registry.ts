import entitiesJson from "@/data/entities/entities.v1.json";
import { DccEntityRegistrySchema, type DccEntity, type DccEntityType } from "@/lib/dcc/entities/types";

const registry = DccEntityRegistrySchema.parse(entitiesJson);

const byKey = new Map<string, DccEntity>(registry.entities.map((entity) => [entity.entityKey, entity]));
const byTypeSlug = new Map<string, DccEntity>(
  registry.entities.map((entity) => [`${entity.type}:${entity.slug}`, entity])
);

function defaultCanonicalPath(entity: DccEntity): string {
  switch (entity.type) {
    case "city":
      return `/cities/${entity.slug}`;
    case "port":
      return `/ports/${entity.slug}`;
    case "venue":
      return `/venues/${entity.slug}`;
    case "attraction":
      return `/attractions/${entity.slug}`;
    case "route":
      return `/routes/${entity.slug}`;
    default: {
      const exhaustive: never = entity.type;
      return `/${exhaustive}/${entity.slug}`;
    }
  }
}

export function listEntities(): DccEntity[] {
  return registry.entities;
}

export function getEntityByKey(entityKey: string): DccEntity | null {
  return byKey.get(entityKey) || null;
}

export function getEntityByTypeSlug(type: DccEntityType, slug: string): DccEntity | null {
  return byTypeSlug.get(`${type}:${slug}`) || null;
}

export function listEntitiesByTier(minTier = 0): DccEntity[] {
  return registry.entities.filter((entity) => entity.tier >= minTier);
}

export function listEntitiesByType(type: DccEntityType): DccEntity[] {
  return registry.entities.filter((entity) => entity.type === type);
}

export function getEntityCanonicalPath(entity: DccEntity): string {
  return entity.canonicalPath || defaultCanonicalPath(entity);
}

export function isEntityActive(entity: DccEntity): boolean {
  return entity.status === "active" || entity.status === "authority";
}
