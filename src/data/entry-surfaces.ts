import rawEntrySurfaces from "@/data/generated/entry-surfaces.json";
import type { EntrySurface } from "@/src/data/entry-surfaces-types";
import { isVisibleSurfacePath } from "@/src/data/visible-surface";

const ENTRY_SURFACES = [...(rawEntrySurfaces as EntrySurface[])].sort((a, b) => b.rankScore - a.rankScore);

function getVisibleEntries(flag: "showInHeader" | "showInHomepage" | "showInCommand") {
  return ENTRY_SURFACES.filter(
    (entry) => entry[flag] && isVisibleSurfacePath(entry.path) && isVisibleSurfacePath(entry.canonicalPath)
  );
}

export function getAllEntrySurfaces(): EntrySurface[] {
  return ENTRY_SURFACES;
}

export function getHeaderEntrySurfaces(): EntrySurface[] {
  return getVisibleEntries("showInHeader");
}

export function getHomepageEntrySurfaces(): EntrySurface[] {
  return getVisibleEntries("showInHomepage");
}

export function getCommandEntrySurfaces(): EntrySurface[] {
  return getVisibleEntries("showInCommand");
}

export function getEntrySurfaceByPath(path: string) {
  return ENTRY_SURFACES.find((entry) => entry.path === path || entry.canonicalPath === path) ?? null;
}
