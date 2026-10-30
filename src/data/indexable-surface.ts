import { discoverableLocationPaths } from "@/lib/dcc/locationDiscovery";

/**
 * Public DCC search identity.
 *
 * Keep indexing explicit: coordinate references and the published swamp-tour
 * decision cluster are public search surfaces. Adding a route to the sitemap
 * does not override the proxy's X-Robots-Tag, so published search entry pages
 * must also be allowed here. Utility and unpromoted routes remain excluded.
 */
const COORDINATE_NATIVE_PUBLIC_PATHS = [
  "/",
  "/about",
  "/developers",
  "/widget",
  "/pricing",
  "/juneau",
  "/ports",
  "/ports/juneau",
  "/red-rocks",
  "/venues",
  "/venues/red-rocks-amphitheatre",
  "/routes/denver-breckenridge",
  "/routes/denver-red-rocks",
  "/transportation/colorado",
  "/regions/colorado",
  "/cities/denver",
  "/new-orleans",
  "/ports/new-orleans",
  "/vegas",
] as const;

// These existing, self-canonical pages are already listed in the DCC sitemap.
// Do not use a /guides/* prefix: unknown and unpublished guides stay noindex.
const PUBLISHED_SWAMP_SEARCH_PATHS = [
  "/guides",
  "/guides/category/new-orleans",
  "/new-orleans-swamp-tours",
  "/guides/new-orleans-airboat-vs-covered-swamp-boat",
  "/guides/new-orleans-swamp-tour-with-kids",
  "/guides/new-orleans-swamp-tour-pickup-vs-self-drive",
  "/guides/new-orleans-small-vs-large-airboat",
  "/guides/best-time-of-day-for-new-orleans-swamp-tour",
  "/guides/is-a-new-orleans-swamp-tour-worth-it",
] as const;

const INDEXABLE_SURFACE_SET = new Set<string>([
  ...COORDINATE_NATIVE_PUBLIC_PATHS,
  ...PUBLISHED_SWAMP_SEARCH_PATHS,
  ...discoverableLocationPaths(),
]);

export const INDEXABLE_SURFACE_PATHS = [...INDEXABLE_SURFACE_SET].sort((a, b) =>
  a.localeCompare(b),
);

export function isIndexableSurfacePath(pathname: string): boolean {
  return INDEXABLE_SURFACE_SET.has(pathname);
}

