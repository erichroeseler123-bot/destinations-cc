import type { NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";
import { buildProviderImageAsset } from "@/src/lib/media/resolver";

export type UnsplashPhoto = {
  urls?: {
    regular?: string;
    small?: string;
    thumb?: string;
  };
  alt_description?: string | null;
  user?: {
    name?: string;
    links?: {
      html?: string;
    };
  };
};

export function unsplashPhotoToMedia(photo: UnsplashPhoto, fallbackAlt: string): NodeImageSet {
  const attribution =
    photo.user?.name
      ? {
          label: `Photo by ${photo.user.name} on Unsplash`,
          href: photo.user.links?.html,
        }
      : { label: "Unsplash" };

  const image = buildProviderImageAsset(
    "unsplash",
    photo.urls?.regular || photo.urls?.small || photo.urls?.thumb,
    photo.alt_description || fallbackAlt,
    attribution,
  );

  return {
    hero: image,
    card: image,
    gallery: image ? [image] : [],
  };
}

export function selectUnsplashImage(photos: UnsplashPhoto[], fallbackAlt: string): NodeImageAsset | null {
  for (const photo of photos) {
    const image = unsplashPhotoToMedia(photo, fallbackAlt).hero;
    if (image) return image;
  }
  return null;
}
