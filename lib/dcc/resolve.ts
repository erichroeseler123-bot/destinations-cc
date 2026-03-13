import type { DccNode } from "./schema";
import { isValidDccId, normalizeSlug } from "./ids";
import { getNodeById, getNodeBySlug, getNodesByAlias } from "./registry";

export function resolveNode(input: string): DccNode | null {
  const query = String(input || "").trim();
  if (!query) return null;

  if (isValidDccId(query)) {
    return getNodeById(query);
  }

  const slug = normalizeSlug(query);
  const fromSlug = getNodeBySlug(slug);
  if (fromSlug) return fromSlug;

  const byAlias = getNodesByAlias(slug);
  return byAlias[0] || null;
}
