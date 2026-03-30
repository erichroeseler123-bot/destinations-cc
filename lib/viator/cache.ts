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
const BOOKING_QUESTIONS_DIR = path.join(DATA_DIR, "viator-booking-questions");
const LOCATIONS_DIR = path.join(DATA_DIR, "viator-locations");

export const VIATOR_CACHE_FILES = {
  destinations: path.join(DATA_DIR, "viator-destinations.json"),
  tags: path.join(DATA_DIR, "viator-tags.json"),
  taxonomyMeta: path.join(DATA_DIR, "viator-taxonomy.meta.json"),
  exchangeRates: path.join(DATA_DIR, "viator-exchange-rates.json"),
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

export function getViatorBookingQuestionsCachePath(productCode: string): string {
  return path.join(BOOKING_QUESTIONS_DIR, `${productCode}.json`);
}

export function readViatorBookingQuestionsCache(productCode: string): unknown[] {
  try {
    return JSON.parse(fs.readFileSync(getViatorBookingQuestionsCachePath(productCode), "utf8")) as unknown[];
  } catch {
    return [];
  }
}

export function writeViatorBookingQuestionsCache(productCode: string, questions: unknown[]): string {
  fs.mkdirSync(BOOKING_QUESTIONS_DIR, { recursive: true });
  const filePath = getViatorBookingQuestionsCachePath(productCode);
  fs.writeFileSync(filePath, `${JSON.stringify(questions, null, 2)}\n`);
  return filePath;
}

export function getViatorBookingQuestionsDir(): string {
  return BOOKING_QUESTIONS_DIR;
}

export function getViatorLocationCachePath(reference: string): string {
  return path.join(LOCATIONS_DIR, `${reference}.json`);
}

export function readViatorLocationCache(reference: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(getViatorLocationCachePath(reference), "utf8")) as unknown;
  } catch {
    return null;
  }
}

export function writeViatorLocationCache(reference: string, payload: unknown): string {
  fs.mkdirSync(LOCATIONS_DIR, { recursive: true });
  const filePath = getViatorLocationCachePath(reference);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  return filePath;
}

export function getViatorLocationsDir(): string {
  return LOCATIONS_DIR;
}

export function readViatorExchangeRatesCache(): unknown | null {
  return readJsonFile<unknown>(VIATOR_CACHE_FILES.exchangeRates);
}

export function writeViatorExchangeRatesCache(payload: unknown): string {
  ensureDataDir(VIATOR_CACHE_FILES.exchangeRates);
  fs.writeFileSync(VIATOR_CACHE_FILES.exchangeRates, `${JSON.stringify(payload, null, 2)}\n`);
  return VIATOR_CACHE_FILES.exchangeRates;
}
