import {
  VEGAS_RELATIONSHIP_PAGES,
  type VegasRelationshipAnchorType,
  type VegasRelationshipPath,
  type VegasRelationshipResultType,
} from "@/src/data/vegas-relationships";

export type DccRelationshipPath =
  | VegasRelationshipPath
  | "venues-near"
  | "restaurants-near"
  | "pools-near"
  | "best-for";

export type DccRelationshipAnchorType =
  | VegasRelationshipAnchorType
  | "venue"
  | "district"
  | "beach"
  | "pool";

export type DccRelationshipResultType =
  | VegasRelationshipResultType
  | "venue"
  | "restaurant"
  | "pool"
  | "beach";

export type DccRelationshipGuidance = {
  title: string;
  body: string;
};

export type DccRelationshipRegistryNode = {
  slug: string;
  path: DccRelationshipPath;
  citySlug: string;
  title: string;
  summary: string;
  anchorType: DccRelationshipAnchorType;
  anchorSlug: string;
  resultType: DccRelationshipResultType;
  resultSlugs: string[];
  guidance: DccRelationshipGuidance[];
  relatedLinks: Array<{ href: string; label: string }>;
  overlayTags?: string[];
  districtNote?: string;
};

export const RELATIONSHIP_REGISTRY: DccRelationshipRegistryNode[] = VEGAS_RELATIONSHIP_PAGES.map((page) => ({
  citySlug: "las-vegas",
  ...page,
}));

export function getRelationshipRegistryNode(path: DccRelationshipPath, slug: string) {
  return RELATIONSHIP_REGISTRY.find((page) => page.path === path && page.slug === slug) ?? null;
}

export function getRelationshipRegistryNodesByCity(citySlug: string) {
  return RELATIONSHIP_REGISTRY.filter((page) => page.citySlug === citySlug);
}
