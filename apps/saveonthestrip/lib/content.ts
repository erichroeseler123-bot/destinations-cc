import type { VegasTour } from "@/lib/fareharbor";
import type { VegasShow } from "@/lib/ticketmaster";
import type { VegasMarketplaceShow } from "@/lib/seatgeek";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getVegasShowSlug(show: VegasShow) {
  return slugify(show.name);
}

export function getSeatGeekShowSlug(show: VegasMarketplaceShow) {
  return slugify(show.title);
}

export function getVegasTourSlug(tour: VegasTour) {
  return tour.slug || slugify(tour.name);
}
