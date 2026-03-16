import fs from "fs";
import { VIATOR_CACHE_FILES } from "@/lib/viator/cache";
import { ViatorTagCatalogSchema, type ViatorTagCatalogItem } from "@/lib/viator/schema";

export type ViatorTagDisplayPolicy = "frontend" | "backend_only" | "unsupported";

export type ViatorTagDefinition = {
  tagId: number;
  label: string;
  policy: ViatorTagDisplayPolicy;
  kind:
    | "category"
    | "feature"
    | "participant"
    | "occasion"
    | "timeframe"
    | "distinction"
    | "merchandising"
    | "compliance";
  query?: string;
};

const VIATOR_TAG_DEFINITIONS: ViatorTagDefinition[] = [
  { tagId: 12026, label: "Helicopter Tours", policy: "frontend", kind: "category", query: "helicopter tours" },
  { tagId: 13018, label: "Bike Tours", policy: "frontend", kind: "category", query: "bike tours" },
  { tagId: 21765, label: "Shows", policy: "frontend", kind: "category", query: "shows" },
  { tagId: 12074, label: "Skip the Line", policy: "frontend", kind: "feature", query: "skip the line tickets" },
  { tagId: 12118, label: "Free Shuttle or Taxi Services", policy: "frontend", kind: "feature", query: "free shuttle tours" },
  { tagId: 11919, label: "Kid-Friendly", policy: "frontend", kind: "participant", query: "kid friendly tours" },
  { tagId: 18884, label: "Adults Only", policy: "frontend", kind: "participant", query: "adults only tours" },
  { tagId: 20222, label: "LGBT Friendly Tours", policy: "frontend", kind: "participant", query: "lgbt friendly tours" },
  { tagId: 11892, label: "Christmas", policy: "frontend", kind: "occasion", query: "christmas tours" },
  { tagId: 11893, label: "Halloween", policy: "frontend", kind: "occasion", query: "halloween tours" },
  { tagId: 21583, label: "Chinese New Year", policy: "frontend", kind: "occasion", query: "chinese new year tours" },
  { tagId: 13121, label: "Afternoon Tea", policy: "frontend", kind: "timeframe", query: "afternoon tea tours" },
  { tagId: 11922, label: "Multi-day Tours", policy: "frontend", kind: "timeframe", query: "multi day tours" },
  { tagId: 18953, label: "Evening Entertainment", policy: "frontend", kind: "timeframe", query: "evening entertainment" },
  { tagId: 11940, label: "Once in a Lifetime", policy: "frontend", kind: "distinction", query: "once in a lifetime tours" },
  { tagId: 21074, label: "Unique Experiences", policy: "frontend", kind: "distinction", query: "unique experiences" },
  { tagId: 367655, label: "Viator Experience Award 2025", policy: "frontend", kind: "distinction", query: "award winning tours" },
  { tagId: 367652, label: "Top Product", policy: "backend_only", kind: "merchandising" },
  { tagId: 22143, label: "Best Conversion", policy: "backend_only", kind: "merchandising" },
  { tagId: 367653, label: "Low Supplier Cancellation Rate", policy: "backend_only", kind: "merchandising" },
  { tagId: 367654, label: "Low Last Minute Supplier Cancellation Rate", policy: "backend_only", kind: "merchandising" },
  { tagId: 21972, label: "Excellent Quality", policy: "backend_only", kind: "merchandising" },
  { tagId: 22083, label: "Likely to Sell Out", policy: "backend_only", kind: "merchandising" },
  { tagId: 367661, label: "Short Term Availability", policy: "backend_only", kind: "merchandising" },
  { tagId: 21592, label: "Seasonal", policy: "frontend", kind: "occasion", query: "seasonal tours" },
  { tagId: 367651, label: "DSA Non-compliant", policy: "backend_only", kind: "compliance" },
  { tagId: 367650, label: "Additional Fees", policy: "backend_only", kind: "compliance" },
  { tagId: 367649, label: "Worry-Free Shore Excursion", policy: "unsupported", kind: "merchandising" },
  { tagId: 5184, label: "Budget", policy: "unsupported", kind: "merchandising" },
  { tagId: 22098, label: "Best Seller", policy: "unsupported", kind: "merchandising" },
  { tagId: 21859, label: "Best Seller", policy: "unsupported", kind: "merchandising" },
  { tagId: 6226, label: "Best Value", policy: "unsupported", kind: "merchandising" },
  { tagId: 21873, label: "Best Seller", policy: "unsupported", kind: "merchandising" },
  { tagId: 21971, label: "Viator Plus", policy: "unsupported", kind: "merchandising" },
  { tagId: 22211, label: "Featured New", policy: "unsupported", kind: "merchandising" },
];

const TAGS_BY_ID = new Map(VIATOR_TAG_DEFINITIONS.map((tag) => [tag.tagId, tag]));

function readTagCatalog(): ViatorTagCatalogItem[] {
  try {
    const cached = JSON.parse(fs.readFileSync(VIATOR_CACHE_FILES.tags, "utf8")) as unknown;
    const parsed = ViatorTagCatalogSchema.safeParse(Array.isArray(cached) ? { tags: cached } : cached);
    return parsed.success ? parsed.data.tags : [];
  } catch {
    return [];
  }
}

export function getViatorTagDefinition(tagId: number): ViatorTagDefinition | null {
  return TAGS_BY_ID.get(tagId) || null;
}

export function normalizeViatorTagIds(values: Array<number | string | null | undefined>): number[] {
  const normalized = values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));
  return Array.from(new Set(normalized));
}

export function getViatorFrontendTagDefinitions(): ViatorTagDefinition[] {
  return VIATOR_TAG_DEFINITIONS.filter((tag) => tag.policy === "frontend");
}

export function getViatorFrontendCategoryTags(): ViatorTagDefinition[] {
  return getViatorFrontendTagDefinitions().filter(
    (tag) => tag.kind === "category" || tag.kind === "feature" || tag.kind === "distinction"
  );
}

export function getDisplayableViatorTags(tagIds: Array<number | string | null | undefined>): ViatorTagDefinition[] {
  return normalizeViatorTagIds(tagIds)
    .map((tagId) => getViatorTagDefinition(tagId))
    .filter((tag): tag is ViatorTagDefinition => Boolean(tag && tag.policy === "frontend"));
}

export function scoreViatorMerchandisingSignals(tagIds: Array<number | string | null | undefined>): number {
  let score = 0;
  for (const tagId of normalizeViatorTagIds(tagIds)) {
    if (tagId === 367652) score += 4;
    if (tagId === 22143) score += 3;
    if (tagId === 367653) score += 3;
    if (tagId === 367654) score += 2;
    if (tagId === 21972) score += 3;
    if (tagId === 22083) score += 1;
  }
  return score;
}

export function getCachedViatorTagCatalog(): ViatorTagCatalogItem[] {
  return readTagCatalog();
}

export function getViatorPolicyTagDefinitions(): ViatorTagDefinition[] {
  return VIATOR_TAG_DEFINITIONS;
}
