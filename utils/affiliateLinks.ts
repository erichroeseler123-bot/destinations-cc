type AnyTour = Record<string, any>;

function getViatorConfig() {
  const pid = process.env.NEXT_PUBLIC_VIATOR_PID || "";
  const mcid = process.env.NEXT_PUBLIC_VIATOR_MCID || "";
  const utmSource = process.env.NEXT_PUBLIC_VIATOR_UTM_SOURCE || "destinationcommandcenter";
  const utmMedium = process.env.NEXT_PUBLIC_VIATOR_UTM_MEDIUM || "affiliate";
  const utmCampaign = process.env.NEXT_PUBLIC_VIATOR_UTM_CAMPAIGN || "dcc-destination-lanes";
  return { pid, mcid, utmSource, utmMedium, utmCampaign };
}

export function hasViatorAffiliateConfig() {
  const { pid } = getViatorConfig();
  return pid.trim().length > 0;
}

function viatorTrackingParams() {
  const { pid, mcid, utmSource, utmMedium, utmCampaign } = getViatorConfig();
  const params = new URLSearchParams();
  if (pid) params.set("pid", pid);
  if (mcid) params.set("mcid", mcid);
  params.set("utm_source", utmSource);
  params.set("utm_medium", utmMedium);
  params.set("utm_campaign", utmCampaign);
  return params.toString();
}

export function buildViatorSearchLink(query: string) {
  const q = encodeURIComponent(query.trim() || "tours");
  const tracking = viatorTrackingParams();
  return tracking
    ? `https://www.viator.com/searchResults/all?text=${q}&${tracking}`
    : `https://www.viator.com/searchResults/all?text=${q}`;
}

export function buildViatorDestinationLink(cityName: string) {
  return buildViatorSearchLink(`${cityName} tours and activities`);
}

/**
 * Minimal Viator deep link builder.
 * Customize these fields to match your tours.json shape.
 */
export function buildViatorLink(tour: AnyTour) {
  // 1) If your data already includes a direct affiliate url, use it.
  const direct = tour.viatorUrl || tour.url || tour.affiliateUrl;
  if (direct && typeof direct === "string") return direct;

  // 2) Otherwise build a simple search URL from city + name
  const city = (tour.city || tour.cityName || tour.destination || "").toString();
  const name = (tour.name || tour.title || "").toString();

  const query = [city, name].filter(Boolean).join(" ").trim() || "tours";
  return buildViatorSearchLink(query);
}
