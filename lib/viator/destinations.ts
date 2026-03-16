import fs from "fs";
import path from "path";
import cityAliases from "@/data/city-aliases.json";
import cityIndex from "@/data/cities/index.json";
import destinationsData from "@/data/destinations.json";
import usTopTourism from "@/data/cities/us-top-tourism.json";
import { slugify } from "@/lib/dcc/slug";
import { readViatorTaxonomyMeta, VIATOR_CACHE_FILES } from "@/lib/viator/cache";
import {
  ViatorDestinationCatalogSchema,
  ViatorDestinationOptionSchema,
  type ViatorDestinationCatalogRow,
  type ViatorDestinationOption,
} from "@/lib/viator/schema";

const ROOT = process.cwd();
const LEGACY_DESTINATIONS_PATH = path.join(ROOT, "data", "destinations.json");

type LegacyDestinationRow = {
  destinationId?: number;
  name?: string;
  type?: string;
  timeZone?: string;
  defaultCurrencyCode?: string;
};

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function normalizeLegacyRows(rows: LegacyDestinationRow[]): ViatorDestinationCatalogRow[] {
  const output: ViatorDestinationCatalogRow[] = [];
  for (const row of rows) {
    if (typeof row.destinationId !== "number" || typeof row.name !== "string" || row.name.trim().length === 0) {
      continue;
    }
    output.push({
      destinationId: row.destinationId,
      name: row.name,
      type: row.type || null,
      timeZone: row.timeZone || null,
      defaultCurrencyCode: row.defaultCurrencyCode || null,
      parentDestinationId: null,
      countryCode: null,
    });
  }
  return output;
}

function readNormalizedLiveRows(): ViatorDestinationCatalogRow[] {
  const raw = readJsonFile<unknown>(VIATOR_CACHE_FILES.destinations);
  if (!raw) return [];
  const parsed = ViatorDestinationCatalogSchema.safeParse(raw);
  return parsed.success ? parsed.data.destinations : [];
}

function readLegacyRows(): ViatorDestinationCatalogRow[] {
  const cached = readJsonFile<unknown>(LEGACY_DESTINATIONS_PATH);
  if (cached && typeof cached === "object" && Array.isArray((cached as { destinations?: unknown[] }).destinations)) {
    return normalizeLegacyRows((cached as { destinations?: LegacyDestinationRow[] }).destinations || []);
  }
  return normalizeLegacyRows((destinationsData as { destinations?: LegacyDestinationRow[] }).destinations || []);
}

function readDestinationRows(): ViatorDestinationCatalogRow[] {
  const live = readNormalizedLiveRows();
  if (live.length > 0) return live;

  const legacy = readLegacyRows();
  if (legacy.length > 0) return legacy;

  return [];
}

export function getCachedViatorDestinationRows(): ViatorDestinationCatalogRow[] {
  return readDestinationRows();
}

export function getViatorDestinationCatalogMeta() {
  return readViatorTaxonomyMeta();
}

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getViatorDestinationOptions(): ViatorDestinationOption[] {
  const destinationRows = readDestinationRows().filter(
    (row) => row.type === "CITY" && typeof row.name === "string"
  );
  const destinationBySlug = new Map(destinationRows.map((row) => [slugify(String(row.name || "")), row]));
  const cityIndexBySlug = new Map((cityIndex.cities || []).map((city) => [city.slug, city]));
  const tourismBySlug = new Map(usTopTourism.map((city) => [city.slug, city]));

  return Object.keys(cityAliases)
    .map((routeSlug) => {
      const cityIndexEntry = cityIndexBySlug.get(routeSlug);
      const tourismEntry = tourismBySlug.get(routeSlug);
      const cityName = cityIndexEntry?.name || tourismEntry?.name || titleCaseSlug(routeSlug);
      const destinationRow = destinationBySlug.get(slugify(cityName));
      const searchTerms = Array.from(
        new Set(
          [
            routeSlug,
            cityName,
            cityIndexEntry?.name,
            tourismEntry?.name,
            `${cityName} tours`,
            `${cityName} attractions`,
            cityIndexEntry?.state ? `${cityName}, ${cityIndexEntry.state}` : null,
          ]
            .filter((value): value is string => Boolean(value))
            .map((value) => value.trim())
        )
      );

      return ViatorDestinationOptionSchema.parse({
        routeSlug,
        cityName,
        state: cityIndexEntry?.state || tourismEntry?.state,
        country: tourismEntry?.country || "US",
        destinationId: destinationRow?.destinationId,
        timeZone: destinationRow?.timeZone || undefined,
        defaultCurrencyCode: destinationRow?.defaultCurrencyCode || undefined,
        searchTerms,
      });
    })
    .sort((a, b) => a.cityName.localeCompare(b.cityName));
}

export function searchViatorDestinationOptions(query: string, limit = 8): ViatorDestinationOption[] {
  const normalized = slugify(query);
  if (!normalized) return getViatorDestinationOptions().slice(0, limit);

  return getViatorDestinationOptions()
    .filter((option) => option.searchTerms.some((term) => slugify(term).includes(normalized)))
    .slice(0, limit);
}
