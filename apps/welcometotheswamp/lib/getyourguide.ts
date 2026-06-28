export function buildWtsGetYourGuideSearchHref(type: "airboat" | "boat", campaign: string): string {
  const partnerId = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || process.env.GETYOURGUIDE_PARTNER_ID || "";
  const baseUrl = type === "airboat" 
    ? process.env.NEXT_PUBLIC_WTS_GYG_AIRBOAT_TOUR_URL || "" 
    : process.env.NEXT_PUBLIC_WTS_GYG_BOAT_TOUR_URL || "";
  
  const normalized = new URL(baseUrl || "https://www.getyourguide.com");
  normalized.searchParams.set("partner_id", partnerId);
  normalized.searchParams.set("cmp", campaign);
  return normalized.toString();
}

export function getWtsAvailabilityTourUrl(type: "airboat" | "boat"): string {
  return type === "airboat"
    ? process.env.NEXT_PUBLIC_WTS_GYG_AIRBOAT_TOUR_URL || ""
    : process.env.NEXT_PUBLIC_WTS_GYG_BOAT_TOUR_URL || "";
}
