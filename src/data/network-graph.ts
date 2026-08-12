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
  { id: "vegas", name: "Save on the Strip", url: "https://saveonthestrip.com", role: "specialist_commerce" },
] as const;

function specialistIdForHref(href: string) {
  return SUITE_SITES.find((site) => href.startsWith(site.url))?.id ?? null;
}

const categoryNodes = DECISION_CATEGORIES.map((category) => ({ id: `dcc:category:${category.slug}`, url: `https://www.destinationcommandcenter.com/guides/category/${category.slug}`, type: "research_category", label: category.label, promise: category.promise, scope: category.scope }));
const guideNodes = PUBLISHED_DECISION_GUIDES.map((guide) => ({ id: `dcc:guide:${guide.slug}`, url: `https://www.destinationcommandcenter.com/guides/${guide.slug}`, type: "decision_guide", category: guide.category, title: guide.title, description: guide.description }));

const frenchQuarterGuideSlugs = new Set(["how-to-get-oriented-in-the-french-quarter-first-hour","french-quarter-bourbon-street-vs-royal-street-first-visit","how-not-to-get-lost-in-french-quarter-new-orleans","new-orleans-french-quarter-first-day-mistakes","is-a-french-quarter-orientation-worth-it","french-quarter-group-meeting-point-strategy"]);
const swampGuideSlugs = new Set(["new-orleans-airboat-vs-covered-swamp-boat","new-orleans-swamp-tour-with-kids","new-orleans-swamp-tour-pickup-vs-self-drive","new-orleans-small-vs-large-airboat","best-time-of-day-for-new-orleans-swamp-tour","is-a-new-orleans-swamp-tour-worth-it"]);
const shuttleyaGuideSlugs = new Set(["denver-to-idaho-springs-without-driving","is-mighty-argo-worth-a-half-day-from-denver","drive-vs-shuttle-denver-to-idaho-springs","how-much-time-for-idaho-springs-day-trip-from-denver","what-if-i70-closes-on-denver-day-trip"]);

const preSiteHubNodes = [
  { id: "dcc:pre-site:french-quarter-orientation", url: "https://www.destinationcommandcenter.com/french-quarter-orientation", type: "pre_site_decision_center", specialist: "fqo", category: "new-orleans", label: "French Quarter Orientation Decision Center", purpose: "Resolve first-hour, navigation, regrouping, and orientation-fit questions before the specialist experience." },
  { id: "dcc:pre-site:new-orleans-swamp-tours", url: "https://www.destinationcommandcenter.com/new-orleans-swamp-tours", type: "pre_site_decision_center", specialist: "swamp", category: "new-orleans", label: "New Orleans Swamp Tour Decision Center", purpose: "Resolve worth-it, ride-style, family-fit, timing, boat-size, and transportation questions before the swamp storefront." },
  { id: "dcc:pre-site:shuttleya", url: "https://www.destinationcommandcenter.com/shuttleya", type: "pre_site_decision_center", specialist: "shuttleya", category: "colorado", label: "Denver to Idaho Springs Shuttle Decision Center", purpose: "Resolve trip-fit, drive-versus-shuttle, timing, return-plan, and I-70 questions before the direct ShuttleYa service page." },
];

const hierarchyEdges = PUBLISHED_DECISION_GUIDES.map((guide) => ({ from: `dcc:category:${guide.category}`, to: `dcc:guide:${guide.slug}`, relation: "contains_decision" }));
const lateralEdges = PUBLISHED_DECISION_GUIDES.flatMap((guide) => relatedDecisionGuides(guide.slug, 4).map((related) => ({ from: `dcc:guide:${guide.slug}`, to: `dcc:guide:${related.slug}`, relation: related.category === guide.category ? "related_decision" : "cross_category_constraint" })));
const categoryBridgeEdges = DECISION_CATEGORIES.flatMap((category) => category.bridgeCategories.map((bridge) => ({ from: `dcc:category:${category.slug}`, to: `dcc:category:${bridge}`, relation: "traveler_constraint_bridge" })));
const preSiteHubEdges = [
  { from: "dcc:category:new-orleans", to: "dcc:pre-site:french-quarter-orientation", relation: "specialist_research_lane" },
  ...PUBLISHED_DECISION_GUIDES.filter((guide) => frenchQuarterGuideSlugs.has(guide.slug)).map((guide) => ({ from: "dcc:pre-site:french-quarter-orientation", to: `dcc:guide:${guide.slug}`, relation: "contains_specialist_decision" })),
  { from: "dcc:pre-site:french-quarter-orientation", to: "fqo", relation: "resolved_research_handoff" },
  { from: "dcc:category:new-orleans", to: "dcc:pre-site:new-orleans-swamp-tours", relation: "specialist_research_lane" },
  ...PUBLISHED_DECISION_GUIDES.filter((guide) => swampGuideSlugs.has(guide.slug)).map((guide) => ({ from: "dcc:pre-site:new-orleans-swamp-tours", to: `dcc:guide:${guide.slug}`, relation: "contains_specialist_decision" })),
  { from: "dcc:pre-site:new-orleans-swamp-tours", to: "swamp", relation: "resolved_research_handoff" },
  { from: "dcc:category:colorado", to: "dcc:pre-site:shuttleya", relation: "specialist_research_lane" },
  { from: "dcc:category:transportation", to: "dcc:pre-site:shuttleya", relation: "specialist_research_lane" },
  ...PUBLISHED_DECISION_GUIDES.filter((guide) => shuttleyaGuideSlugs.has(guide.slug)).map((guide) => ({ from: "dcc:pre-site:shuttleya", to: `dcc:guide:${guide.slug}`, relation: "contains_specialist_decision" })),
  { from: "dcc:pre-site:shuttleya", to: "shuttleya", relation: "resolved_research_handoff" },
];

export const NETWORK_GRAPH = {
  version: "2026-08-12-v7",
  principle: "UNDERSTAND -> CHOOSE -> BUY_OR_RESERVE -> PLAN",
  hub: "dcc",
  topology: { entry: "dcc:/guides", hierarchy: "hub -> category -> pre-site decision center -> decision -> related decision -> specialist", rule: "A DCC page must answer the traveler problem before an outbound commercial handoff appears." },
  sites: SUITE_SITES,
  researchNodes: [...categoryNodes, ...preSiteHubNodes, ...guideNodes], hierarchyEdges, preSiteHubEdges, categoryBridgeEdges, lateralEdges,
  guideEdges: PUBLISHED_DECISION_GUIDES.map((guide) => ({ from: `dcc:guide:${guide.slug}`, to: specialistIdForHref(guide.nextStep.href), href: guide.nextStep.href, relation: "next_action_after_research", category: guide.category, title: guide.title })),
} as const;
