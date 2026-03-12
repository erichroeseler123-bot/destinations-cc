import { notFound } from "next/navigation";
import OverlayCategoryPageTemplate, { buildOverlayCategoryMetadata } from "@/app/components/dcc/OverlayCategoryPageTemplate";
import { getCityRegistryNode } from "@/src/data/cities-registry";
import { ENTITIES_REGISTRY, type DccEntityType } from "@/src/data/entities-registry";
import {
  getOverlayRegistryNodeByTypeAndCity,
  listOverlayCategoriesByTypeAndCity,
  listOverlayCitySlugsByType,
} from "@/src/data/overlay-registry";

type Params = { category: string; city: string };

const CATEGORY_TO_ENTITY_TYPE: Record<string, DccEntityType> = {
  hotels: "hotel",
  attractions: "attraction",
  beaches: "beach",
  pools: "pool",
  casinos: "casino",
  venues: "venue",
};

export function generateStaticParams() {
  return listOverlayCitySlugsByType("smoking").flatMap((city) =>
    listOverlayCategoriesByTypeAndCity("smoking", city).map((category) => ({
      category: `${category}s`.replace("attractionss", "attractions").replace("beachs", "beaches"),
      city,
    }))
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const overlay = getOverlayRegistryNodeByTypeAndCity("smoking", city);
  const cityNode = getCityRegistryNode(city);
  if (!overlay || !cityNode) return {};
  return buildOverlayCategoryMetadata(cityNode, overlay, category, `/smoking/${category}/${city}`);
}

export default async function SmokingOverlayCategoryPage({ params }: { params: Promise<Params> }) {
  const { category, city } = await params;
  const overlay = getOverlayRegistryNodeByTypeAndCity("smoking", city);
  const cityNode = getCityRegistryNode(city);
  const entityType = CATEGORY_TO_ENTITY_TYPE[category];
  if (!overlay || !cityNode || !entityType) notFound();

  const entities = overlay.resultSlugs
    .map((slug) => ENTITIES_REGISTRY.find((entity) => entity.slug === slug && entity.entityType === entityType))
    .filter((entity): entity is NonNullable<typeof entity> => Boolean(entity));

  if (!entities.length) notFound();

  return (
    <OverlayCategoryPageTemplate
      city={cityNode}
      overlay={overlay}
      category={category}
      entities={entities}
      canonicalPath={`/smoking/${category}/${city}`}
    />
  );
}
