import { getCityRegistryNode, type DccCityRegistryNode } from "@/src/data/cities-registry";
import {
  getEntityRegistryNodesBySlugs,
  getEntityRegistryNodesBySlugsAndType,
  type DccEntityRegistryNode,
  type DccEntityType,
} from "@/src/data/entities-registry";
import {
  getOverlayRegistryNodeByTypeAndCity,
  listOverlayCategoriesByTypeAndCity,
  listOverlayCitySlugsByType,
  type DccOverlayRegistryNode,
  type DccOverlayType,
} from "@/src/data/overlay-registry";

const OVERLAY_CATEGORY_TO_ENTITY_TYPE: Record<string, DccEntityType> = {
  hotels: "hotel",
  attractions: "attraction",
  beaches: "beach",
  pools: "pool",
  casinos: "casino",
  venues: "venue",
};

type OverlayPageData = {
  city: DccCityRegistryNode;
  overlay: DccOverlayRegistryNode;
  entities: DccEntityRegistryNode[];
};

type OverlayCategoryPageData = OverlayPageData & {
  category: string;
  entityType: DccEntityType;
};

function pluralizeOverlayCategory(entityType: string) {
  return `${entityType}s`.replace("attractionss", "attractions").replace("beachs", "beaches");
}

export function getOverlayStaticParams(overlayType: DccOverlayType) {
  return listOverlayCitySlugsByType(overlayType).map((city) => ({ city }));
}

export function getOverlayPageData(overlayType: DccOverlayType, citySlug: string): OverlayPageData | null {
  const overlay = getOverlayRegistryNodeByTypeAndCity(overlayType, citySlug);
  const city = getCityRegistryNode(citySlug);
  if (!overlay || !city) return null;

  return {
    city,
    overlay,
    entities: getEntityRegistryNodesBySlugs(overlay.resultSlugs),
  };
}

export function getOverlayCategoryStaticParams(overlayType: DccOverlayType) {
  return listOverlayCitySlugsByType(overlayType).flatMap((city) =>
    listOverlayCategoriesByTypeAndCity(overlayType, city).map((category) => ({
      category: pluralizeOverlayCategory(category),
      city,
    })),
  );
}

export function getOverlayCategoryPageData(
  overlayType: DccOverlayType,
  citySlug: string,
  category: string,
): OverlayCategoryPageData | null {
  const overlay = getOverlayRegistryNodeByTypeAndCity(overlayType, citySlug);
  const city = getCityRegistryNode(citySlug);
  const entityType = OVERLAY_CATEGORY_TO_ENTITY_TYPE[category];
  if (!overlay || !city || !entityType) return null;

  const entities = getEntityRegistryNodesBySlugsAndType(overlay.resultSlugs, entityType);
  if (!entities.length) return null;

  return {
    city,
    overlay,
    category,
    entityType,
    entities,
  };
}
