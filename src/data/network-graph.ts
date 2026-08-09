import { PUBLISHED_DECISION_GUIDES } from "@/src/data/published-decision-guides";
import { DECISION_CATEGORIES, relatedDecisionGuides } from "@/src/data/decision-taxonomy";

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

const VIBE_GUIDE_SLUGS = [
  "independent-cruise-port-driver-vs-bus-tour",
  "what-can-you-do-in-an-8-hour-cruise-port-day",
  "can-you-do-two-excursions-in-one-cruise-port-day",
  "when-is-it-better-not-to-book-a-cruise-excursion",
  "should-a-cruise-group-split-up-for-different-excursions",
] as const;

const VIBE_ISLANDS = [
  { slug: "st-thomas", label: "St. Thomas" },
  { slug: "st-croix", label: "St. Croix" },
  { slug: "st-john", label: "St. John" },
] as const;

function specialistIdForHref(href: string) {
  return SUITE_SITES.find((site) => href.startsWith(site.url))?.id ?? null;
}

const categoryNodes = DECISION_CATEGORIES.map((category) => ({
  id: `dcc:category:${category.slug}`,
  url: `https://www.destinationcommandcenter.com/guides/category/${category.slug}`,
  type: "research_category",
  label: category.label,
  promise: category.promise,
  scope: category.scope,
}));

const guideNodes = PUBLISHED_DECISION_GUIDES.map((guide) => ({
  id: `dcc:guide:${guide.slug}`,
  url: `https://www.destinationcommandcenter.com/guides/${guide.slug}`,
  type: "decision_guide",
  category: guide.category,
  title: guide.title,
  description: guide.description,
}));

const vibeBridgeNodes = [
  { id: "dcc:vibe:hub", url: "https://www.destinationcommandcenter.com/vibe-around", type: "commerce_research_bridge", label: "Vibe Around Decision Center", role: "catch uncertainty before driver selection" },
  ...VIBE_ISLANDS.map((island) => ({ id: `dcc:vibe:${island.slug}`, url: `https://www.destinationcommandcenter.com/vibe-around/${island.slug}`, type: "island_decision_endpoint", label: `${island.label} Vibe Around Decision Center`, role: "resolve port-day uncertainty while preserving Vibe context" })),
];

const hierarchyEdges = PUBLISHED_DECISION_GUIDES.map((guide) => ({ from: `dcc:category:${guide.category}`, to: `dcc:guide:${guide.slug}`, relation: "contains_decision" }));
const lateralEdges = PUBLISHED_DECISION_GUIDES.flatMap((guide) => relatedDecisionGuides(guide.slug, 4).map((related) => ({ from: `dcc:guide:${guide.slug}`, to: `dcc:guide:${related.slug}`, relation: related.category === guide.category ? "related_decision" : "cross_category_constraint" })));
const categoryBridgeEdges = DECISION_CATEGORIES.flatMap((category) => category.bridgeCategories.map((bridge) => ({ from: `dcc:category:${category.slug}`, to: `dcc:category:${bridge}`, relation: "traveler_constraint_bridge" })));
const vibeBridgeEdges = [
  { from: "vibe", to: "dcc:vibe:hub", relation: "research_when_not_transaction_ready" },
  ...VIBE_ISLANDS.flatMap((island) => [
    { from: "vibe", to: `dcc:vibe:${island.slug}`, relation: "island_research_entrypoint" },
    { from: "dcc:vibe:hub", to: `dcc:vibe:${island.slug}`, relation: "narrows_to_island_context" },
    ...VIBE_GUIDE_SLUGS.map((slug) => ({ from: `dcc:vibe:${island.slug}`, to: `dcc:guide:${slug}`, relation: "resolves_pre_booking_uncertainty" })),
  ]),
  ...VIBE_GUIDE_SLUGS.map((slug) => ({ from: `dcc:guide:${slug}`, to: "vibe", relation: "contextual_return_after_research" })),
];

export const NETWORK_GRAPH = {
  version: "2026-08-09-v4",
  principle: "UNDERSTAND -> CHOOSE -> BUY_OR_RESERVE -> PLAN",
  hub: "dcc",
  topology: {
    entry: "dcc:/guides",
    hierarchy: "hub -> category -> decision -> related decision -> specialist",
    rule: "A DCC page must answer the traveler problem before an outbound commercial handoff appears.",
    bidirectionalBridge: "commerce surface -> DCC uncertainty endpoint -> decision guide -> original commerce context",
  },
  sites: SUITE_SITES,
  researchNodes: [...categoryNodes, ...guideNodes, ...vibeBridgeNodes],
  hierarchyEdges,
  categoryBridgeEdges,
  lateralEdges,
  vibeBridgeEdges,
  guideEdges: PUBLISHED_DECISION_GUIDES.map((guide) => ({
    from: `dcc:guide:${guide.slug}`,
    to: specialistIdForHref(guide.nextStep.href),
    href: guide.nextStep.href,
    relation: "next_action_after_research",
    category: guide.category,
    title: guide.title,
  })),
} as const;
