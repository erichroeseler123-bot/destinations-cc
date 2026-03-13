import { getMediaEntryByPath, getGalleryAssets, getHeroAsset, getSectionAssets } from "@/lib/dcc/media/registry";
import type { EntitySurfaceIndexEntry, SurfaceMediaModule } from "@/lib/dcc/surfaces/types";

export function resolveMediaModule(entity: EntitySurfaceIndexEntry): {
  data: SurfaceMediaModule;
  warning?: string;
} {
  const entry = getMediaEntryByPath(entity.canonicalPath);
  if (!entry) {
    return {
      data: { hero: null, gallery: [], section: [] },
      warning: `Media manifest entry missing for ${entity.canonicalPath}`,
    };
  }

  return {
    data: {
      hero: getHeroAsset(entry),
      gallery: getGalleryAssets(entry),
      section: getSectionAssets(entry),
    },
  };
}
