import { notFound } from "next/navigation";
import OverlayPageTemplate, { buildOverlayMetadata } from "@/app/components/dcc/OverlayPageTemplate";
import { getCityRegistryNode } from "@/src/data/cities-registry";
import { ENTITIES_REGISTRY } from "@/src/data/entities-registry";
import { getOverlayRegistryNodeByTypeAndCity, listOverlayCitySlugsByType } from "@/src/data/overlay-registry";

type Params = { city: string };

export function generateStaticParams() {
  return listOverlayCitySlugsByType("kid-friendly").map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const overlay = getOverlayRegistryNodeByTypeAndCity("kid-friendly", city);
  const cityNode = getCityRegistryNode(city);
  if (!overlay || !cityNode) return {};
  return buildOverlayMetadata(cityNode, overlay);
}

export default async function KidFriendlyOverlayPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const overlay = getOverlayRegistryNodeByTypeAndCity("kid-friendly", city);
  const cityNode = getCityRegistryNode(city);
  if (!overlay || !cityNode) notFound();

  const entities = overlay.resultSlugs
    .map((slug) => ENTITIES_REGISTRY.find((entity) => entity.slug === slug))
    .filter((entity): entity is NonNullable<typeof entity> => Boolean(entity));

  return <OverlayPageTemplate city={cityNode} overlay={overlay} entities={entities} />;
}
