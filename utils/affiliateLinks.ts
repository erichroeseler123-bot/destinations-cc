type AnyTour = Record<string, any>;

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

  const q = encodeURIComponent([city, name].filter(Boolean).join(" ").trim() || "tours");

  // If you have your Viator PID / mcid etc, append them here.
  // Example: &pid=P00281144&mcid=42383
  return `https://www.viator.com/searchResults/all?text=${q}`;
}
