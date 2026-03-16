import fs from "node:fs";
import path from "node:path";

export type CityManifest = {
  slug: string;
  name: string;
  heroImage?: string;
  heroImageAlt?: string;
  heroImagePosition?: string;
  heroTint?: "warm" | "cool" | "emerald";
  timezone?: string;
  lat?: number;
  lng?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  hero?: {
    eyebrow?: string;
    title?: string;
    summary?: string;
    trustLine?: string;
    image?: {
      src: string;
      alt: string;
    };
    primaryCtaLabel?: string;
    primaryCtaHref?: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
  };
  tourCategories?: Array<{
    slug: string;
    title: string;
    description: string;
    icon?: string;
  }>;
  topAttractions?: Array<{
    slug: string;
    title: string;
    description?: string;
  }>;
  featuredTours?: {
    title?: string;
    description?: string;
    fallbackQueries?: string[];
  };
  planningLinks?: Array<{
    title: string;
    description: string;
    href: string;
  }>;
  faq?: Array<{
    q: string;
    a: string;
  }>;
};

export type CityRolloutEntry = {
  slug: string;
  name: string;
  state: string;
  country: string;
};

export type AttractionManifest = {
  citySlug: string;
  cityName: string;
  attractions: Array<{
    slug: string;
    name: string;
    type?: string;
    summary?: string;
    categories?: string[];
    priority?: number;
    featured?: boolean;
    heroImage?: {
      src: string;
      alt: string;
    };
    gallery?: Array<{
      src: string;
      alt: string;
    }>;
    heroTitle: string;
    heroSummary: string;
    trustLine?: string;
    about?: string;
    thingsToDo?: string[];
    visitorInfo?: Array<{ label: string; value: string }>;
    planningTips?: string[];
    experiencesIntro?: string;
    experiencesDescription?: string;
    experienceIntents?: Array<{ label: string; query: string; description: string }>;
    relatedAttractions?: Array<{ label: string; href: string }>;
    primaryToursHref?: string;
    thingsToDoHref?: string;
    schemaType?: "TouristAttraction" | "LandmarksOrHistoricalBuildings";
  }>;
};

export type CategoryManifest = {
  citySlug: string;
  cityName: string;
  categories: Array<{
    slug: string;
    title: string;
    description: string;
    intro?: string;
    bullets?: string[];
    intents?: Array<{ label: string; query: string; description: string }>;
  }>;
};

const ROOT = process.cwd();

function readJsonFile<T>(segments: string[]): T | null {
  const filePath = path.join(ROOT, ...segments);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

export function getCityManifest(citySlug: string): CityManifest | null {
  return readJsonFile<CityManifest>(["data", "cities", `${citySlug}.json`]);
}

export function getAttractionsManifest(citySlug: string): AttractionManifest | null {
  return readJsonFile<AttractionManifest>(["data", "attractions", `${citySlug}.json`]);
}

export function getCategoriesManifest(citySlug: string): CategoryManifest | null {
  return readJsonFile<CategoryManifest>(["data", "categories", `${citySlug}.json`]);
}

export function listManifestCitySlugs(): string[] {
  const dir = path.join(ROOT, "data", "cities");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/i, ""))
    .filter((slug) => slug !== "index")
    .sort();
}

export function getManifestAttraction(citySlug: string, slug: string) {
  return getAttractionsManifest(citySlug)?.attractions.find((item) => item.slug === slug) || null;
}

export function getManifestCategory(citySlug: string, slug: string) {
  return getCategoriesManifest(citySlug)?.categories.find((item) => item.slug === slug) || null;
}

export function getCityRolloutManifest(rolloutSlug: string): CityRolloutEntry[] {
  return readJsonFile<CityRolloutEntry[]>(["data", "cities", `${rolloutSlug}.json`]) || [];
}
