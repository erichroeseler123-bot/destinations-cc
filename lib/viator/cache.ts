import fs from "fs";
import path from "path";
import type { ViatorReview, ViatorTagCatalogItem } from "@/lib/viator/schema";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const REVIEWS_DIR = path.join(DATA_DIR, "viator-reviews");

export const VIATOR_CACHE_FILES = {
  destinations: path.join(DATA_DIR, "viator-destinations.json"),
  tags: path.join(DATA_DIR, "viator-tags.json"),
} as const;

function statFile(filePath: string) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      path: filePath,
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
    };
  } catch {
    return {
      exists: false,
      path: filePath,
      size: 0,
      updatedAt: null,
    };
  }
}

export function getViatorCacheFileStats() {
  return {
    destinations: statFile(VIATOR_CACHE_FILES.destinations),
    tags: statFile(VIATOR_CACHE_FILES.tags),
    reviewsDir: statFile(REVIEWS_DIR),
  };
}

export function getViatorReviewCachePath(productCode: string): string {
  return path.join(REVIEWS_DIR, `${productCode}.json`);
}

export function readViatorReviewCache(productCode: string): ViatorReview[] {
  try {
    return JSON.parse(fs.readFileSync(getViatorReviewCachePath(productCode), "utf8")) as ViatorReview[];
  } catch {
    return [];
  }
}

export function writeViatorReviewCache(productCode: string, reviews: ViatorReview[]): string {
  fs.mkdirSync(REVIEWS_DIR, { recursive: true });
  const filePath = getViatorReviewCachePath(productCode);
  fs.writeFileSync(filePath, `${JSON.stringify(reviews, null, 2)}\n`);
  return filePath;
}

export function writeViatorDestinationsCache(payload: unknown): string {
  fs.writeFileSync(VIATOR_CACHE_FILES.destinations, `${JSON.stringify(payload, null, 2)}\n`);
  return VIATOR_CACHE_FILES.destinations;
}

export function writeViatorTagsCache(payload: ViatorTagCatalogItem[]): string {
  fs.writeFileSync(VIATOR_CACHE_FILES.tags, `${JSON.stringify(payload, null, 2)}\n`);
  return VIATOR_CACHE_FILES.tags;
}
