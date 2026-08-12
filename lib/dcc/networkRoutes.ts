import { buildViatorDestinationUrl, buildViatorSearchUrl } from "@/lib/viator/links";

export type NetworkRouteKind = "book" | "plan" | "explore" | "transport" | "cruise" | "affiliate";

export type NetworkRoute = {
  id: string;
  label: string;
  href: string;
  kind: NetworkRouteKind;
  reason: string;
  site: string;
  affiliate?: boolean;
};

const CITY_NETWORK_ROUTES: Record<string, NetworkRoute[]> = {
  "new-orleans": [
    { id: "wno-tours", label: "Browse New Orleans tours", href: "https://welcometoneworleanstours.com", kind: "book", reason: "When city research turns into a tour decision.", site: "Welcome to New Orleans Tours" },
    { id: "swamp", label: "Explore swamp experiences", href: "https://welcometotheswamp.com", kind: "explore", reason: "For travelers moving from city context toward Louisiana swamp experiences.", site: "Welcome to the Swamp" },
    { id: "french-quarter", label: "Orient yourself in the French Quarter", href: "https://frenchquarterorientation.com", kind: "plan", reason: "For a lighter-weight orientation before choosing what to do next.", site: "French Quarter Orientation" },
  ],
  juneau: [
    { id: "last-frontier", label: "Explore Juneau shore excursions", href: "https://lastfrontiershoreexcursions.com", kind: "book", reason: "For cruise visitors ready to turn Juneau research into an excursion choice.", site: "Last Frontier Shore Excursions" },
    { id: "flight-deck", label: "Explore Juneau flightseeing", href: "https://juneauflightdeck.com", kind: "explore", reason: "For travelers specifically interested in flightseeing and aerial experiences.", site: "Juneau Flight Deck" },
    { id: "cruise-planner", label: "Put Juneau into your cruise plan", href: "https://cruisepromenade.com", kind: "cruise", reason: "For cruise groups organizing the port day with the rest of the sailing.", site: "Cruise Promenade" },
  ],
  "wisconsin-dells": [
    { id: "dells", label: "Explore Wisconsin Dells", href: "https://welcometothedells.com", kind: "explore", reason: "For destination-specific planning, attractions and commercial options.", site: "Welcome to the Dells" },
  ],
  "las-vegas": [
    { id: "strip", label: "Explore Las Vegas deals and ideas", href: "https://saveonthestrip.com", kind: "explore", reason: "For visitors ready to move from city context into Las Vegas-specific planning.", site: "Save on the Strip" },
  ],
  denver: [
    { id: "gosno", label: "Plan private Colorado transportation", href: "https://gosno.co", kind: "transport", reason: "For airport and mountain-resort transportation planning from Denver.", site: "GoSno" },
    { id: "red-rocks", label: "Plan private Red Rocks transportation", href: "https://partyatredrocks.com", kind: "transport", reason: "For private transportation around a Red Rocks concert or event.", site: "Party at Red Rocks" },
    { id: "420-pickup", label: "Explore Denver airport pickup options", href: "https://420friendlyairportpickup.com", kind: "transport", reason: "For Denver airport transportation with a dispensary-stop planning angle.", site: "420 Friendly Airport Pickup" },
  ],
  miami: [
    { id: "cruise-planner", label: "Plan the cruise around your Miami departure", href: "https://cruisepromenade.com", kind: "cruise", reason: "For cruise travelers moving from Miami research into a shared sailing plan.", site: "Cruise Promenade" },
  ],
  seattle: [
    { id: "cruise-planner", label: "Put Seattle into your cruise plan", href: "https://cruisepromenade.com", kind: "cruise", reason: "For cruise travelers organizing embarkation or a port day with their group.", site: "Cruise Promenade" },
  ],
  "san-diego": [
    { id: "cruise-planner", label: "Put San Diego into your cruise plan", href: "https://cruisepromenade.com", kind: "cruise", reason: "For cruise travelers organizing the city around the rest of the sailing.", site: "Cruise Promenade" },
  ],
  tampa: [
    { id: "cruise-planner", label: "Plan the cruise around your Tampa departure", href: "https://cruisepromenade.com", kind: "cruise", reason: "For cruise groups turning Tampa research into a shared sailing plan.", site: "Cruise Promenade" },
  ],
};

export function getCityNetworkRoutes(citySlug: string) {
  return CITY_NETWORK_ROUTES[citySlug] || [];
}

export function getPrimaryCityNetworkRoute(citySlug: string) {
  return getCityNetworkRoutes(citySlug)[0] || null;
}

function hasOwnedCommercialRoute(routes: NetworkRoute[]) {
  return routes.some((route) => route.kind === "book" || route.kind === "explore");
}

export function buildViatorFallbackRoute(citySlug: string, cityName: string, intent?: string | null): NetworkRoute {
  const campaign = ["dcc", citySlug, intent || "city", "affiliate-fallback"].filter(Boolean).join("-");
  const query = intent && intent !== "lively"
    ? `${cityName} ${intent} tours and activities`
    : `${cityName} tours and activities`;
  return {
    id: `viator-${citySlug}-${intent || "city"}`,
    label: intent ? `Browse ${cityName} ${intent} experiences` : `Browse ${cityName} tours and activities`,
    href: intent
      ? buildViatorSearchUrl(query, { campaign, medium: "link" })
      : buildViatorDestinationUrl(cityName, { campaign, medium: "link" }),
    kind: "affiliate",
    reason: "Affiliate fallback when DCC does not have a stronger owned destination or booking path for this intent.",
    site: "Viator",
    affiliate: true,
  };
}

export function getCityNetworkRoutesWithAffiliate(citySlug: string, cityName: string, intent?: string | null) {
  const owned = getCityNetworkRoutes(citySlug);
  if (hasOwnedCommercialRoute(owned)) return owned;
  return [...owned, buildViatorFallbackRoute(citySlug, cityName, intent)];
}
