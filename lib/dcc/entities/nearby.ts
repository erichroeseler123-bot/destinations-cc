import haversine from "haversine";
import { getEntityByKey, listEntitiesByTier } from "@/lib/dcc/entities/registry";
import type { DccEntity } from "@/lib/dcc/entities/types";

export type NearbyActiveSpot = {
  entityKey: string;
  name: string;
  type: DccEntity["type"];
  tier: DccEntity["tier"];
  distanceKm: number;
  canonicalPath: string;
};

function getCanonicalPath(entity: DccEntity): string {
  if (entity.canonicalPath) return entity.canonicalPath;
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

export function getNearbyActiveSpots(options: {
  anchorEntityKey: string;
  radiusKm?: number;
  limit?: number;
  minTier?: 2 | 3;
}): NearbyActiveSpot[] {
  const anchor = getEntityByKey(options.anchorEntityKey);
  if (!anchor) return [];

  const radiusKm = options.radiusKm ?? 120;
  const limit = options.limit ?? 12;
  const minTier = options.minTier ?? 2;

  const candidates = listEntitiesByTier(minTier)
    .filter((entity) => entity.entityKey !== anchor.entityKey)
    .filter((entity) => entity.status === "active" || entity.status === "authority");

  const rows = candidates
    .map((entity) => {
      const distanceKm = haversine(
        { latitude: anchor.lat, longitude: anchor.lng },
        { latitude: entity.lat, longitude: entity.lng },
        { unit: "km" }
      );

      return {
        entityKey: entity.entityKey,
        name: entity.name,
        type: entity.type,
        tier: entity.tier,
        distanceKm,
        canonicalPath: getCanonicalPath(entity),
      };
    })
    .filter((row) => Number.isFinite(row.distanceKm) && row.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return rows;
}
