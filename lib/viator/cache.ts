import fs from "fs";
import path from "path";
import {
  ViatorDestinationCatalogSchema,
  ViatorTagCatalogSchema,
  type ViatorDestinationCatalog,
  type ViatorReview,
  type ViatorTagCatalog,
} from "@/lib/viator/schema";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const REVIEWS_DIR = path.join(DATA_DIR, "viator-reviews");

export const VIATOR_CACHE_FILES = {
  destinations: path.join(DATA_DIR, "viator-destinations.json"),
  tags: path.join(DATA_DIR, "viator-tags.json"),
  taxonomyMeta: path.join(DATA_DIR, "viator-taxonomy.meta.json"),
} as const;

export type ViatorTaxonomyMeta = {
  updatedAt: string;
  destinationsCount: number;
  tagsCount: number;
  source: "live" | "cache" | "fallback";
  accessTier: string;
};

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

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function ensureDataDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function getViatorCacheFileStats() {
  return {
    destinations: statFile(VIATOR_CACHE_FILES.destinations),
    tags: statFile(VIATOR_CACHE_FILES.tags),
    taxonomyMeta: statFile(VIATOR_CACHE_FILES.taxonomyMeta),
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

export function writeViatorDestinationsCache(payload: ViatorDestinationCatalog): string {
  ensureDataDir(VIATOR_CACHE_FILES.destinations);
  const normalized = ViatorDestinationCatalogSchema.parse(payload);
  fs.writeFileSync(VIATOR_CACHE_FILES.destinations, `${JSON.stringify(normalized, null, 2)}\n`);
  return VIATOR_CACHE_FILES.destinations;
}

export function writeViatorTagsCache(payload: ViatorTagCatalog): string {
  ensureDataDir(VIATOR_CACHE_FILES.tags);
  const normalized = ViatorTagCatalogSchema.parse(payload);
  fs.writeFileSync(VIATOR_CACHE_FILES.tags, `${JSON.stringify(normalized, null, 2)}\n`);
  return VIATOR_CACHE_FILES.tags;
}

export function readViatorTaxonomyMeta(): ViatorTaxonomyMeta | null {
  const raw = readJsonFile<Partial<ViatorTaxonomyMeta>>(VIATOR_CACHE_FILES.taxonomyMeta);
  if (!raw || typeof raw.updatedAt !== "string") return null;
  return {
    updatedAt: raw.updatedAt,
    destinationsCount: Number(raw.destinationsCount || 0),
    tagsCount: Number(raw.tagsCount || 0),
    source: raw.source === "live" || raw.source === "cache" || raw.source === "fallback" ? raw.source : "fallback",
    accessTier: typeof raw.accessTier === "string" && raw.accessTier ? raw.accessTier : "basic_access",
  };
}

export function writeViatorTaxonomyMeta(payload: ViatorTaxonomyMeta): string {
  ensureDataDir(VIATOR_CACHE_FILES.taxonomyMeta);
  fs.writeFileSync(VIATOR_CACHE_FILES.taxonomyMeta, `${JSON.stringify(payload, null, 2)}\n`);
  return VIATOR_CACHE_FILES.taxonomyMeta;
}

export function getViatorReviewsDir(): string {
  return REVIEWS_DIR;
}
