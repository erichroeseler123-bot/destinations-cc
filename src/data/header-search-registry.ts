import { getHeaderEntrySurfaces } from "@/src/data/entry-surfaces";
import type { EntrySurface } from "@/src/data/entry-surfaces-types";

export type HeaderSearchEntry = EntrySurface;

export function getHeaderSearchEntries(): HeaderSearchEntry[] {
  return getHeaderEntrySurfaces();
}
