import { discoverableLocationPaths } from "@/lib/dcc/locationDiscovery";
import { getRootPathsByPublishState } from "@/src/data/route-governance";

const INDEXABLE_SURFACE_SET = new Set<string>([
  ...getRootPathsByPublishState("indexable", "promoted"),
  ...discoverableLocationPaths(),
]);

export const INDEXABLE_SURFACE_PATHS = [...INDEXABLE_SURFACE_SET].sort((a, b) =>
  a.localeCompare(b),
);

export function isIndexableSurfacePath(pathname: string): boolean {
  return INDEXABLE_SURFACE_SET.has(pathname);
}
