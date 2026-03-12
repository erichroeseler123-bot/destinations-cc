export * from "@/src/data/cities-registry";
export * from "@/src/data/entities-registry";
export * from "@/src/data/relationship-registry";
export * from "@/src/data/overlay-registry";

import { CITIES_REGISTRY, getLiveCityRegistryNodes } from "@/src/data/cities-registry";
import { ENTITIES_REGISTRY } from "@/src/data/entities-registry";
import { OVERLAY_REGISTRY } from "@/src/data/overlay-registry";
import { RELATIONSHIP_REGISTRY } from "@/src/data/relationship-registry";

export type DccRegistryCounts = {
  cities: number;
  entities: number;
  relationships: number;
  overlays: number;
};

export function getDccRegistryCounts(): DccRegistryCounts {
  return {
    cities: CITIES_REGISTRY.length,
    entities: ENTITIES_REGISTRY.length,
    relationships: RELATIONSHIP_REGISTRY.length,
    overlays: OVERLAY_REGISTRY.length,
  };
}

export function getDccLiveCityMachine() {
  return getLiveCityRegistryNodes().map((city) => ({
    ...city,
    entityCount: ENTITIES_REGISTRY.filter((entity) => entity.citySlug === city.slug).length,
    relationshipCount: RELATIONSHIP_REGISTRY.filter((relationship) => relationship.citySlug === city.slug).length,
    overlayCount: OVERLAY_REGISTRY.filter((overlay) => overlay.citySlug === city.slug).length,
  }));
}
