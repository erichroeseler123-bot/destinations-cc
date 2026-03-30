import type { NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";
import { getMediaRegistryImageSet } from "@/src/data/media-registry";

export function buildLocalImageAsset(src: string, alt: string): NodeImageAsset {
  return {
    src,
    alt,
    source: "local",
    providerTermsBucket: "owned",
    canIndex: true,
    hotlinkOnly: false,
    priority: 100,
  };
}

export function buildLocalImageSet(input: {
  hero?: { src: string; alt: string };
  card?: { src: string; alt: string };
  gallery?: Array<{ src: string; alt: string }>;
}): NodeImageSet {
  return {
    hero: input.hero ? buildLocalImageAsset(input.hero.src, input.hero.alt) : null,
    card: input.card ? buildLocalImageAsset(input.card.src, input.card.alt) : null,
    gallery: (input.gallery || []).map((item) => buildLocalImageAsset(item.src, item.alt)),
  };
}

const LEGACY_LOCAL_FALLBACK_IMAGE_SETS: Record<string, NodeImageSet> = {
  "city:las-vegas": buildLocalImageSet({
    hero: {
      src: "/images/las-vegas/attractions/strip-landmark.svg",
      alt: "Las Vegas Strip landmark artwork",
    },
    card: {
      src: "/images/las-vegas/attractions/fountains-of-bellagio.svg",
      alt: "Bellagio fountains artwork",
    },
  }),
  "city:denver": buildLocalImageSet({
    hero: {
      src: "/images/authority/cities/denver/hero.webp",
      alt: "Denver skyline and foothills photography",
    },
    card: {
      src: "/images/authority/cities/denver/section-1.webp",
      alt: "Denver city photography",
    },
  }),
  "city:miami": buildLocalImageSet({
    hero: {
      src: "/images/miami/beaches/hero.svg",
      alt: "Miami beach coastline artwork",
    },
    card: {
      src: "/images/miami/beaches/south-beach.svg",
      alt: "South Beach artwork",
    },
  }),
  "hotel:bellagio": buildLocalImageSet({
    hero: {
      src: "/images/las-vegas/hotels/bellagio-hero.svg",
      alt: "Bellagio hotel artwork",
    },
    card: {
      src: "/images/las-vegas/hotels/bellagio-card.svg",
      alt: "Bellagio hotel artwork",
    },
  }),
  "hotel:caesars-palace": buildLocalImageSet({
    hero: {
      src: "/images/las-vegas/hotels/caesars-hero.svg",
      alt: "Caesars Palace hotel artwork",
    },
    card: {
      src: "/images/las-vegas/hotels/caesars-card.svg",
      alt: "Caesars Palace hotel artwork",
    },
  }),
  "hotel:mgm-grand": buildLocalImageSet({
    hero: {
      src: "/images/las-vegas/hotels/mgm-grand-hero.svg",
      alt: "MGM Grand hotel artwork",
    },
    card: {
      src: "/images/las-vegas/hotels/mgm-grand-card.svg",
      alt: "MGM Grand hotel artwork",
    },
  }),
  "hotel:venetian": buildLocalImageSet({
    hero: {
      src: "/images/las-vegas/hotels/venetian-hero.svg",
      alt: "Venetian hotel artwork",
    },
    card: {
      src: "/images/las-vegas/hotels/venetian-card.svg",
      alt: "Venetian hotel artwork",
    },
  }),
  "hotel:wynn": buildLocalImageSet({
    hero: {
      src: "/images/las-vegas/hotels/wynn-hero.svg",
      alt: "Wynn Las Vegas hotel artwork",
    },
    card: {
      src: "/images/las-vegas/hotels/wynn-card.svg",
      alt: "Wynn Las Vegas hotel artwork",
    },
  }),
  "attraction:sphere-las-vegas": buildLocalImageSet({
    hero: {
      src: "/images/las-vegas/attractions/sphere-las-vegas.svg",
      alt: "Sphere Las Vegas artwork",
    },
    card: {
      src: "/images/las-vegas/attractions/sphere-las-vegas.svg",
      alt: "Sphere Las Vegas artwork",
    },
  }),
  "attraction:fremont-street-experience": buildLocalImageSet({
    hero: {
      src: "/images/las-vegas/attractions/fremont-street-experience.svg",
      alt: "Fremont Street Experience artwork",
    },
    card: {
      src: "/images/las-vegas/attractions/fremont-street-experience.svg",
      alt: "Fremont Street Experience artwork",
    },
  }),
  "venue:red-rocks-amphitheatre": buildLocalImageSet({
    hero: {
      src: "/images/authority/venues/red-rocks-amphitheatre/hero.webp",
      alt: "Red Rocks Amphitheatre photography",
    },
    card: {
      src: "/images/authority/venues/red-rocks-amphitheatre/section-1.webp",
      alt: "Red Rocks Amphitheatre photography",
    },
  }),
};

export function getLocalFallbackImageSet(key: string): NodeImageSet | null {
  return getMediaRegistryImageSet([key]) || LEGACY_LOCAL_FALLBACK_IMAGE_SETS[key] || null;
}

export function getLocalFallbackImageSetForEntity(entityType: string, slug: string): NodeImageSet | null {
  return getLocalFallbackImageSet(`${entityType}:${slug}`);
}
