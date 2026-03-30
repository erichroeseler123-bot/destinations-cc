import type { Next48EntityType } from "@/lib/dcc/next48/types";

export const NEXT48_SUPPORTED: Array<{ entityType: Next48EntityType; slug: string }> = [
  { entityType: "city", slug: "denver" },
  { entityType: "port", slug: "juneau" },
];

export function isSupportedNext48Entity(entityType: Next48EntityType, slug: string): boolean {
  return NEXT48_SUPPORTED.some((item) => item.entityType === entityType && item.slug === slug);
}
