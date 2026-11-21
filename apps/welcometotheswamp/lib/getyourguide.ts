const DEFAULT_WTS_GYG_PARTNER_ID = "F2MMUUH";
const DEFAULT_WTS_GYG_AIRBOAT_TOUR_URL =
  "https://www.getyourguide.com/new-orleans-l375/new-orleans-airboat-swamp-adventure-t69191/";
const DEFAULT_WTS_GYG_BOAT_TOUR_URL =
  "https://www.getyourguide.com/new-orleans-l375/new-orleans-manchac-swamp-cruise-t20064/";

export function buildWtsGetYourGuideSearchHref(type: "airboat" | "boat", campaign: string): string {
  const partnerId =
    process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID?.trim() ||
    process.env.GETYOURGUIDE_PARTNER_ID?.trim() ||
    DEFAULT_WTS_GYG_PARTNER_ID;
  const baseUrl =
    type === "airboat"
      ? process.env.NEXT_PUBLIC_WTS_GYG_AIRBOAT_TOUR_URL?.trim() || DEFAULT_WTS_GYG_AIRBOAT_TOUR_URL
      : process.env.NEXT_PUBLIC_WTS_GYG_BOAT_TOUR_URL?.trim() || DEFAULT_WTS_GYG_BOAT_TOUR_URL;

  const normalized = new URL(baseUrl);
  normalized.searchParams.set("partner_id", partnerId);
  normalized.searchParams.set("cmp", campaign);
  return normalized.toString();
}

export function getWtsAvailabilityTourUrl(type: "airboat" | "boat"): string {
  return type === "airboat"
    ? process.env.NEXT_PUBLIC_WTS_GYG_AIRBOAT_TOUR_URL?.trim() || DEFAULT_WTS_GYG_AIRBOAT_TOUR_URL
    : process.env.NEXT_PUBLIC_WTS_GYG_BOAT_TOUR_URL?.trim() || DEFAULT_WTS_GYG_BOAT_TOUR_URL;
}
