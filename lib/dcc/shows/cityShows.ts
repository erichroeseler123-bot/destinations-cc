import { getCrossSiteVenue } from "@/lib/crossSiteMap";
import type { TicketmasterEvent } from "@/lib/dcc/providers/adapters/ticketmaster";
import denverVenuesJson from "@/data/cities/denver/venues.json";
import lasVegasVenuesJson from "@/data/cities/las-vegas/venues.json";
import newOrleansVenuesJson from "@/data/cities/new-orleans/venues.json";

function slugifyValue(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SHOW_VENUE_SLUG_ALIASES: Record<string, string> = {
  "red-rocks-amphitheater": "red-rocks-amphitheatre",
  "red-rocks-amphitheatre": "red-rocks-amphitheatre",
  "red-rocks-park-and-amphitheatre": "red-rocks-amphitheatre",
  "red-rocks-park-amphitheatre": "red-rocks-amphitheatre",
  "mission-ballroom": "mission-ballroom",
  "the-mission-ballroom": "mission-ballroom",
  "ball-arena": "ball-arena",
  "ball-arena-denver": "ball-arena",
  "fiddler-s-green-amphitheatre": "fiddlers-green-amphitheatre",
  "fiddlers-green-amphitheatre": "fiddlers-green-amphitheatre",
  "fiddlers-green-amphitheater": "fiddlers-green-amphitheatre",
  "fiddlers-green": "fiddlers-green-amphitheatre",
  "ogden-theatre": "ogden-theatre",
  "ogden-theater": "ogden-theatre",
  "gothic-theatre": "gothic-theatre",
  "gothic-theater": "gothic-theatre",
  "cervantes-masterpiece-ballroom": "cervantes-masterpiece",
  "cervantes-masterpiece": "cervantes-masterpiece",
  "cervantes-masterpiece-and-the-other-side": "cervantes-masterpiece",
  "cervantes": "cervantes-masterpiece",
  "bluebird-theater": "bluebird-theater",
  "bluebird-theatre": "bluebird-theater",
  "bluebird": "bluebird-theater",
  "summit-music-hall": "summit-music-hall",
  "summit": "summit-music-hall",
  "marquis-theater": "marquis-theater",
  "marquis-theatre": "marquis-theater",
  "marquis": "marquis-theater",
  "boulder-theater": "boulder-theater",
  "boulder-theatre": "boulder-theater",
  "boulder-theater-and-fox-theatre": "boulder-theater",
  "fox-theatre": "fox-theatre",
  "fox-theater": "fox-theatre",
  "fox-theatre-boulder": "fox-theatre",
  "fox-theater-boulder": "fox-theatre",
  "mishawaka-amphitheatre": "mishawaka-amphitheatre",
  "mishawaka-amphitheater": "mishawaka-amphitheatre",
  "the-mishawaka": "mishawaka-amphitheatre",
  sphere: "sphere",
  "sphere-las-vegas": "sphere",
  "t-mobile-arena": "t-mobile-arena",
  "mgm-grand-garden-arena": "mgm-grand-garden-arena",
  "house-of-blues-las-vegas": "house-of-blues-las-vegas",
  "brooklyn-bowl-las-vegas": "brooklyn-bowl-las-vegas",
  "virgin-theater": "virgin-theater",
  "virgin-hotels-las-vegas-theater": "virgin-theater",
  "smoothie-king-center": "smoothie-king-center",
  "saenger-theatre": "saenger-theatre",
  "saenger-theater": "saenger-theatre",
  "the-fillmore-new-orleans": "fillmore-new-orleans",
  "fillmore-new-orleans": "fillmore-new-orleans",
  tipitinas: "tipitinas",
  "tipitina-s": "tipitinas",
  "howlin-wolf": "howlin-wolf",
  "howlin-wolf-new-orleans": "howlin-wolf",
  "maple-leaf-bar": "maple-leaf-bar",
};

type CityShowVenue = {
  slug: string;
  name: string;
  city?: string;
  state?: string;
};

const CITY_SHOW_VENUES: Record<string, CityShowVenue[]> = {
  denver: denverVenuesJson.venues,
  "las-vegas": lasVegasVenuesJson.venues,
  "new-orleans": newOrleansVenuesJson.venues,
};

export function toCrossSiteVenueSlug(value: string | null | undefined) {
  const normalized = slugifyValue(value);
  const slug = SHOW_VENUE_SLUG_ALIASES[normalized] || normalized;
  return slug && getCrossSiteVenue(slug) ? slug : null;
}

export function resolveCrossSiteVenueSlug(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const slug = toCrossSiteVenueSlug(value);
    if (slug) return slug;
  }

  return null;
}

export function getCityShowVenue(cityKey: string, slug: string) {
  return CITY_SHOW_VENUES[cityKey]?.find((venue) => venue.slug === slug) ?? null;
}

export function resolveCityShowVenueSlug(
  cityKey: string,
  ...values: Array<string | null | undefined>
) {
  const venues = CITY_SHOW_VENUES[cityKey];
  if (!venues) return null;

  for (const value of values) {
    const normalized = slugifyValue(value);
    const slug = SHOW_VENUE_SLUG_ALIASES[normalized] || normalized;
    if (venues.some((venue) => venue.slug === slug)) {
      return slug;
    }
  }

  return null;
}

export function buildCityShowEventSlug(event: Pick<TicketmasterEvent, "id" | "name" | "start_date">) {
  const title = slugifyValue(event.name) || "event";
  const date = slugifyValue(event.start_date) || "date-tba";
  return `${title}-${date}--${event.id}`;
}

export function extractCityShowEventId(eventSlug: string) {
  const parts = eventSlug.split("--");
  return parts.length > 1 ? parts.at(-1) || null : null;
}

export function isEventWithinDays(
  startDate: string | null | undefined,
  days: number,
  now = new Date(),
) {
  if (!startDate) return false;
  const parsed = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + days);

  return parsed >= start && parsed <= end;
}
