import { getEntityRegistryNode, type DccEntityType } from "@/src/data/entities-registry";
import { resolveDccMedia } from "@/lib/dcc/mediaResolver";
import { getMediaRegistryImageSet } from "@/src/data/media-registry";

export type PublicMediaFeed = {
  version: string;
  ok: true;
  entity: string;
  status: "resolved";
  last_updated: string;
  site: {
    id: string;
    name: string;
    url: string;
  };
  node: {
    slug: string;
    entityType: DccEntityType;
    title: string;
    summary: string;
    citySlug: string;
    districtSlug?: string;
    canonicalPath: string;
    updatedAt: string;
  };
  assets: ReturnType<typeof buildSerializableImageSet>;
  imageSet: ReturnType<typeof buildSerializableImageSet>;
};

const VERSION = "2026-03-19";
const SITE = {
  id: "destinationcommandcenter",
  name: "Destination Command Center",
  url: "https://www.destinationcommandcenter.com",
};

function buildSerializableImageSet(
  imageSet: NonNullable<ReturnType<typeof getEntityRegistryNode>>["imageSet"],
) {
  return {
    hero: imageSet?.hero
      ? {
          src: imageSet.hero.src,
          alt: imageSet.hero.alt,
          source: imageSet.hero.source,
          attribution: imageSet.hero.attribution,
          sourceId: imageSet.hero.sourceId,
          pageUrl: imageSet.hero.pageUrl,
          license: imageSet.hero.license,
          licenseUrl: imageSet.hero.licenseUrl,
          providerTermsBucket: imageSet.hero.providerTermsBucket,
          canIndex: imageSet.hero.canIndex,
          hotlinkOnly: imageSet.hero.hotlinkOnly,
          width: imageSet.hero.width,
          height: imageSet.hero.height,
          priority: imageSet.hero.priority,
        }
      : null,
    card: imageSet?.card
      ? {
          src: imageSet.card.src,
          alt: imageSet.card.alt,
          source: imageSet.card.source,
          attribution: imageSet.card.attribution,
          sourceId: imageSet.card.sourceId,
          pageUrl: imageSet.card.pageUrl,
          license: imageSet.card.license,
          licenseUrl: imageSet.card.licenseUrl,
          providerTermsBucket: imageSet.card.providerTermsBucket,
          canIndex: imageSet.card.canIndex,
          hotlinkOnly: imageSet.card.hotlinkOnly,
          width: imageSet.card.width,
          height: imageSet.card.height,
          priority: imageSet.card.priority,
        }
      : null,
    gallery: (imageSet?.gallery || []).map((image) => ({
      src: image.src,
      alt: image.alt,
      source: image.source,
      attribution: image.attribution,
      sourceId: image.sourceId,
      pageUrl: image.pageUrl,
      license: image.license,
      licenseUrl: image.licenseUrl,
      providerTermsBucket: image.providerTermsBucket,
      canIndex: image.canIndex,
      hotlinkOnly: image.hotlinkOnly,
      width: image.width,
      height: image.height,
      priority: image.priority,
    })),
  };
}

export async function getPublicMediaFeed(slug: string, entityType?: DccEntityType): Promise<PublicMediaFeed | null> {
  const entity = getEntityRegistryNode(slug, entityType);
  const registryOnlyImageSet =
    !entity && entityType ? getMediaRegistryImageSet([`${entityType}:${slug}`]) : null;
  if (!entity && !registryOnlyImageSet) return null;

  const imageSet = entity
    ? await resolveDccMedia({
        entityType: entity.entityType,
        slug: entity.slug,
        name: entity.title,
        summary: entity.summary,
        sourceHints: {
          wikimediaTitle: entity.title,
        },
      })
    : registryOnlyImageSet;
  if (!imageSet) return null;

  const fallbackTitle = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const fallbackEntityType = entityType || "attraction";

  return {
    version: VERSION,
    ok: true,
    entity: `${entity?.entityType || fallbackEntityType}:${entity?.slug || slug}`,
    status: "resolved",
    last_updated: new Date().toISOString(),
    site: SITE,
    node: {
      slug: entity?.slug || slug,
      entityType: entity?.entityType || fallbackEntityType,
      title: entity?.title || fallbackTitle,
      summary: entity?.summary || `${fallbackTitle} media entry from the Destination Command Center registry.`,
      citySlug: entity?.citySlug || "",
      districtSlug: entity?.districtSlug,
      canonicalPath: entity?.canonicalPath || "",
      updatedAt: entity?.updatedAt || VERSION,
    },
    assets: buildSerializableImageSet(imageSet),
    imageSet: buildSerializableImageSet(imageSet),
  };
}

export const PUBLIC_MEDIA_ENTITY_TYPES: DccEntityType[] = [
  "hotel",
  "casino",
  "venue",
  "attraction",
  "restaurant",
  "team",
  "artist",
  "beach",
  "pool",
];
