import {
  getRiverOpsOutboundTarget,
  type RiverOpsOutboundTarget,
} from "./content";

const SLUG_ALIASES: Readonly<Record<string, string>> = {
  "jet-boat-adventures": "jet-boat-primary",
  "original-wisconsin-ducks": "ducks-primary",
  "sunset-dinner-cruise": "sunset-dinner",
  "upper-dells-boat-tour": "classic-upper",
  "upper-dells-scenic": "classic-upper",
};

export function resolveDellsRiverOutboundTarget(
  rawSlug: string,
): RiverOpsOutboundTarget | null {
  const normalized = decodeURIComponent(rawSlug || "").trim().toLowerCase();
  if (!normalized) return null;
  const canonicalSlug = SLUG_ALIASES[normalized] || normalized;
  return getRiverOpsOutboundTarget(canonicalSlug) || null;
}
