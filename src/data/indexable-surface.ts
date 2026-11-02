import {
  getPublicationManifestEntry,
  listIndexablePublicationEntries,
} from "@/src/data/publication-manifest";

/**
 * Public DCC search identity.
 *
 * Derived directly from the compiled versioned publication manifest
 * (`src/data/publication-manifest.ts`) so `proxy.ts` and `app/sitemap.xml`
 * consume the exact same indexable set and never contradict one another.
 */
export const INDEXABLE_SURFACE_PATHS = listIndexablePublicationEntries().map(
  (entry) => entry.route,
);

const INDEXABLE_SURFACE_SET = new Set<string>(INDEXABLE_SURFACE_PATHS);

export function isIndexableSurfacePath(pathname: string): boolean {
  const manifestEntry = getPublicationManifestEntry(pathname);
  if (manifestEntry) {
    return (
      manifestEntry.acceptanceState === "public_indexable" &&
      manifestEntry.indexingState === "index_follow" &&
      manifestEntry.includeInSitemap &&
      manifestEntry.blockingReasonCodes.length === 0
    );
  }
  return INDEXABLE_SURFACE_SET.has(pathname);
}

