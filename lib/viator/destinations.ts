import cityAliases from "@/data/city-aliases.json";
import cityIndex from "@/data/cities/index.json";
import destinationsData from "@/data/destinations.json";
import usTopTourism from "@/data/cities/us-top-tourism.json";
import { slugify } from "@/lib/dcc/slug";

export type ViatorDestinationOption = {
  routeSlug: string;
  cityName: string;
  state?: string;
  country?: string;
  destinationId?: number;
  timeZone?: string;
  defaultCurrencyCode?: string;
};

type ViatorDestinationRow = {
  destinationId?: number;
  name?: string;
  type?: string;
  timeZone?: string;
  defaultCurrencyCode?: string;
};

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getViatorDestinationOptions(): ViatorDestinationOption[] {
  const destinationRows = ((destinationsData as { destinations?: ViatorDestinationRow[] }).destinations || [])
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

      return {
        routeSlug,
        cityName,
        state: cityIndexEntry?.state || tourismEntry?.state,
        country: tourismEntry?.country || "US",
        destinationId: destinationRow?.destinationId,
        timeZone: destinationRow?.timeZone,
        defaultCurrencyCode: destinationRow?.defaultCurrencyCode,
      };
    })
    .sort((a, b) => a.cityName.localeCompare(b.cityName));
}
