import type { NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";
import { buildProviderImageAsset } from "@/src/lib/media/resolver";

export type BandsintownArtist = {
  id?: string | number;
  name?: string;
  image_url?: string | null;
  thumb_url?: string | null;
  url?: string | null;
};

export function bandsintownArtistToMedia(artist: BandsintownArtist): NodeImageSet {
  const image = buildProviderImageAsset(
    "bandsintown",
    artist.image_url || artist.thumb_url,
    artist.name || "Bandsintown artist",
    artist.url ? { label: "Bandsintown", href: artist.url } : { label: "Bandsintown" },
  );

  return {
    hero: image,
    card: image,
    gallery: image ? [image] : [],
  };
}

export function selectBandsintownArtistImage(artists: BandsintownArtist[]): NodeImageAsset | null {
  for (const artist of artists) {
    const image = buildProviderImageAsset(
      "bandsintown",
      artist.image_url || artist.thumb_url,
      artist.name || "Bandsintown artist",
      artist.url ? { label: "Bandsintown", href: artist.url } : { label: "Bandsintown" },
    );
    if (image) return image;
  }
  return null;
}
