import { discoverableLocationPaths } from "@/lib/dcc/locationDiscovery";

/**
 * Public DCC search identity.
 *
 * DCC is a coordinate-intelligence product. Legacy travel, corridor, tour,
 * venue, port and operator-handoff routes may remain available as secondary
 * applications, but they must not define the root DCC site's crawl/index
 * surface or appear in the canonical DCC sitemap.
 */
const COORDINATE_NATIVE_PUBLIC_PATHS = [
  "/",
  "/about",
  "/developers",
] as const;

const INDEXABLE_SURFACE_SET = new Set<string>([
  ...COORDINATE_NATIVE_PUBLIC_PATHS,
  ...discoverableLocationPaths(),
]);

export const INDEXABLE_SURFACE_PATHS = [...INDEXABLE_SURFACE_SET].sort((a, b) =>
  a.localeCompare(b),
);

export function isIndexableSurfacePath(pathname: string): boolean {
  return INDEXABLE_SURFACE_SET.has(pathname);
}
