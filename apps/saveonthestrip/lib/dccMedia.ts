import { cache } from "react";

type DccImageAsset = {
  src: string;
  alt: string;
  source: string;
  attribution?: {
    label: string;
    href?: string;
  };
};

type NodeImageSet = {
  hero?: DccImageAsset | null;
  card?: DccImageAsset | null;
  gallery?: DccImageAsset[];
};

type DccAgentManifest = {
  machineReadable?: {
    mediaFeedTemplate?: string;
  };
};

type DccMediaFeedResponse = {
  ok?: boolean;
  imageSet?: NodeImageSet | null;
};

const DCC_AGENT_MANIFEST_URL = "https://www.destinationcommandcenter.com/agent.json";
const DCC_PUBLIC_BASE_URL = "https://www.destinationcommandcenter.com";

function absolutizeImageSet(imageSet: NodeImageSet | null | undefined): NodeImageSet | null {
  if (!imageSet) return null;

  const absolutize = (src?: string) =>
    src && src.startsWith("/") ? `${DCC_PUBLIC_BASE_URL}${src}` : src;

  return {
    hero: imageSet.hero
      ? {
          ...imageSet.hero,
          src: absolutize(imageSet.hero.src) || imageSet.hero.src,
        }
      : null,
    card: imageSet.card
      ? {
          ...imageSet.card,
          src: absolutize(imageSet.card.src) || imageSet.card.src,
        }
      : null,
    gallery: (imageSet.gallery || []).map((image) => ({
      ...image,
      src: absolutize(image.src) || image.src,
    })),
  };
}

const getDccAgentManifest = cache(async (): Promise<DccAgentManifest | null> => {
  try {
    const response = await fetch(DCC_AGENT_MANIFEST_URL, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return (await response.json()) as DccAgentManifest;
  } catch {
    return null;
  }
});

export const getDccImageSet = cache(
  async (entityType: string, slug: string, fallback: NodeImageSet | null = null): Promise<NodeImageSet | null> => {
    const manifest = await getDccAgentManifest();
    const template = manifest?.machineReadable?.mediaFeedTemplate;
    if (!template) return fallback;

    const url = template
      .replace("{entityType}", encodeURIComponent(entityType))
      .replace("{slug}", encodeURIComponent(slug));

    try {
      const response = await fetch(url, {
        next: { revalidate: 3600 },
      });
      if (!response.ok) return fallback;
      const data = (await response.json()) as DccMediaFeedResponse;
      return absolutizeImageSet(data.imageSet) || fallback;
    } catch {
      return fallback;
    }
  },
);
