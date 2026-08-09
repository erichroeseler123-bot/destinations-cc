import { PRE_SITE_GUIDES } from "@/src/data/pre-site-guides";

export const SUITE_SITES = [
  { id: "dcc", name: "Destination Command Center", url: "https://www.destinationcommandcenter.com", role: "research_authority" },
  { id: "wtonot", name: "Welcome to New Orleans Tours", url: "https://welcometoneworleanstours.com", role: "specialist_commerce" },
  { id: "alaska", name: "Welcome to Alaska Tours", url: "https://welcometoalaskatours.com", role: "specialist_commerce" },
  { id: "swamp", name: "Welcome to the Swamp", url: "https://welcometotheswamp.com", role: "specialist_commerce" },
  { id: "lfse", name: "Last Frontier Shore Excursions", url: "https://lastfrontiershoreexcursions.com", role: "specialist_commerce" },
  { id: "jfd", name: "Juneau Flight Deck", url: "https://juneauflightdeck.com", role: "specialist_commerce" },
  { id: "dells", name: "Welcome to the Dells", url: "https://welcometothedells.com", role: "specialist_commerce" },
  { id: "fqo", name: "French Quarter Orientation", url: "https://frenchquarterorientation.com", role: "specialist_experience" },
  { id: "cp", name: "Cruise Promenade", url: "https://cruisepromenade.com", role: "planning_tool" },
  { id: "vibe", name: "Vibe Around Town", url: "https://vibearoundtown.com", role: "marketplace" },
  { id: "gosno", name: "GoSno", url: "https://gosno.co", role: "transportation_commerce" },
  { id: "shuttleya", name: "ShuttleYa", url: "https://shuttleya.com", role: "transportation_commerce" },
  { id: "parr", name: "Party at Red Rocks", url: "https://partyatredrocks.com", role: "transportation_commerce" },
  { id: "rrfp", name: "Red Rocks Fast Pass", url: "https://redrocksfastpass.com", role: "transportation_commerce" },
  { id: "airport420", name: "420 Friendly Airport Pickup", url: "https://420friendlyairportpickup.com", role: "transportation_commerce" },
] as const;

function specialistIdForHref(href: string) {
  return SUITE_SITES.find((site) => href.startsWith(site.url))?.id ?? null;
}

export const NETWORK_GRAPH = {
  version: "2026-08-09",
  principle: "UNDERSTAND -> CHOOSE -> BUY_OR_RESERVE -> PLAN",
  hub: "dcc",
  sites: SUITE_SITES,
  guideEdges: PRE_SITE_GUIDES.map((guide) => ({
    from: `dcc:/guides/${guide.slug}`,
    to: specialistIdForHref(guide.nextStep.href),
    href: guide.nextStep.href,
    relation: "next_action_after_research",
    category: guide.category,
    title: guide.title,
  })),
} as const;
