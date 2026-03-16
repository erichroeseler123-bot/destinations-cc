import fs from "fs";
import path from "path";
import cityAliases from "@/data/city-aliases.json";
import cityIndex from "@/data/cities/index.json";
import destinationsData from "@/data/destinations.json";
import usTopTourism from "@/data/cities/us-top-tourism.json";
import { slugify } from "@/lib/dcc/slug";
import { ViatorDestinationOptionSchema, type ViatorDestinationOption } from "@/lib/viator/schema";

const ROOT = process.cwd();
const VIATOR_DESTINATIONS_CACHE_PATH = path.join(ROOT, "data", "viator-destinations.json");

type ViatorDestinationRow = {
  destinationId?: number;
  name?: string;
  type?: string;
  timeZone?: string;
  defaultCurrencyCode?: string;
};

function readDestinationRows(): ViatorDestinationRow[] {
  try {
    const cached = JSON.parse(fs.readFileSync(VIATOR_DESTINATIONS_CACHE_PATH, "utf8")) as unknown;
    if (cached && typeof cached === "object" && Array.isArray((cached as { destinations?: unknown[] }).destinations)) {
      return (cached as { destinations?: ViatorDestinationRow[] }).destinations || [];
    }
    if (Array.isArray(cached)) {
      return cached as ViatorDestinationRow[];
    }
  } catch {}

  return ((destinationsData as { destinations?: ViatorDestinationRow[] }).destinations || []);
}

export function getCachedViatorDestinationRows(): ViatorDestinationRow[] {
  return readDestinationRows();
}

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getViatorDestinationOptions(): ViatorDestinationOption[] {
  const destinationRows = readDestinationRows()
    .filter((row) => row.type === "CITY" && typeof row.name === "string");
  const destinationBySlug = new Map(
    destinationRows.map((row) => [slugify(String(row.name || "")), row])
  );
  const cityIndexBySlug = new Map((cityIndex.cities || []).map((city) => [city.slug, city]));
  const tourismBySlug = new Map(usTopTourism.map((city) => [city.slug, city]));

  return Object.keys(cityAliases)
    .map((routeSlug) => {
      const cityIndexEntry = cityIndexBySlug.get(routeSlug);
      const tourismEntry = tourismBySlug.get(routeSlug);
      const cityName =
        cityIndexEntry?.name || tourismEntry?.name || titleCaseSlug(routeSlug);
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
        timeZone: destinationRow?.timeZone,
        defaultCurrencyCode: destinationRow?.defaultCurrencyCode,
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
