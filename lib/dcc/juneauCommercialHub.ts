import { buildDccJuneauHelicopterGoUrl } from "@/lib/dcc/routing/middleware";

export type JuneauProviderType = "partner" | "affiliate_fallback" | "internal";

export type JuneauDecisionCard = {
  id: string;
  title: string;
  port: "Juneau";
  category: string;
  duration: string | null;
  price_from: string | null;
  rating: string | null;
  review_count: string | null;
  image: string | null;
  cruise_safe: "high" | "medium" | "depends";
  weather_risk: "low" | "medium" | "high" | "variable";
  return_to_ship_confidence: "high" | "medium" | "depends";
  provider_type: JuneauProviderType;
  cta_href: string;
  cta_label: string;
  decision_reason: string;
  fallback_reason: string | null;
  tags: string[];
};

const SOURCE_PAGE = "/juneau";
const CORRIDOR = "alaska-juneau";

function withDecisionParams(
  path: string,
  params: Record<string, string>,
) {
  const url = new URL(path, "https://www.destinationcommandcenter.com");

  url.searchParams.set("decision_corridor", CORRIDOR);
  url.searchParams.set("sourcePage", SOURCE_PAGE);
  url.searchParams.set("port", "juneau");

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  return `${url.pathname}${url.search}`;
}

export const juneauHelicopterHref = buildDccJuneauHelicopterGoUrl({
  port: "juneau",
  lane: "premium-helicopter",
  recommendationSlug: "juneau-commercial-hub-primary",
  sourcePage: SOURCE_PAGE,
  cta: "primary-helicopter",
  decision_corridor: CORRIDOR,
  decision_action: "open-juneau-helicopter-availability",
  decision_option: "premium-helicopter",
  decision_product: "juneau-icefield-helicopter",
  decision_state: "recommended",
});

export const juneauDecisionCards: JuneauDecisionCard[] = [
  {
    id: "helicopter-glacier-primary",
    title: "Helicopter glacier flight",
    port: "Juneau",
    category: "Helicopter / glacier",
    duration: null,
    price_from: null,
    rating: null,
    review_count: null,
    image: null,
    cruise_safe: "depends",
    weather_risk: "high",
    return_to_ship_confidence: "depends",
    provider_type: "partner",
    cta_href: juneauHelicopterHref,
    cta_label: "Open helicopter lane",
    decision_reason:
      "Best when the visitor wants the highest-impact Juneau memory and accepts weather sensitivity.",
    fallback_reason: null,
    tags: ["premium", "glacier", "flightseeing", "date-first"],
  },
  {
    id: "whale-watching-cruise-safe",
    title: "Whale watching",
    port: "Juneau",
    category: "Wildlife / water",
    duration: null,
    price_from: null,
    rating: null,
    review_count: null,
    image: null,
    cruise_safe: "high",
    weather_risk: "medium",
    return_to_ship_confidence: "medium",
    provider_type: "internal",
    cta_href: withDecisionParams("/juneau/whale-watching-tours", {
      topic: "whale-watching",
      context: "first-time",
      decision_action: "open-whale-decision",
      decision_option: "whale-watching",
      decision_product: "juneau-whale-watching",
      decision_state: "backup-or-primary",
    }),
    cta_label: "Open whale decision",
    decision_reason:
      "Best when weather risk, budget, or group comfort matters more than the premium glacier flight.",
    fallback_reason: "Use when helicopter weather, budget, or comfort fit is not right.",
    tags: ["wildlife", "cruise-day", "backup", "family-fit"],
  },
  {
    id: "mendenhall-land-fallback",
    title: "Mendenhall land plan",
    port: "Juneau",
    category: "Glacier / land",
    duration: null,
    price_from: null,
    rating: null,
    review_count: null,
    image: null,
    cruise_safe: "medium",
    weather_risk: "low",
    return_to_ship_confidence: "medium",
    provider_type: "internal",
    cta_href: withDecisionParams("/juneau/mendenhall", {
      decision_action: "open-mendenhall-land-plan",
      decision_option: "mendenhall-land-fallback",
      decision_product: "juneau-mendenhall-plan",
      decision_state: "fallback",
    }),
    cta_label: "Open Mendenhall plan",
    decision_reason:
      "Best when the visitor still wants glacier context without committing to the flight lane.",
    fallback_reason: "Use when flightseeing risk is too high or the port day needs a simpler land plan.",
    tags: ["glacier", "land-plan", "lower-weather-risk", "fallback"],
  },
  {
    id: "weather-backup",
    title: "Weather backup path",
    port: "Juneau",
    category: "Recovery / backup",
    duration: null,
    price_from: null,
    rating: null,
    review_count: null,
    image: null,
    cruise_safe: "high",
    weather_risk: "variable",
    return_to_ship_confidence: "medium",
    provider_type: "internal",
    cta_href: withDecisionParams("/juneau/what-to-do-if-helicopter-tour-canceled", {
      decision_action: "open-weather-backup",
      decision_option: "helicopter-weather-backup",
      decision_product: "juneau-weather-recovery",
      decision_state: "recovery",
    }),
    cta_label: "Open backup plan",
    decision_reason:
      "Best when the visitor already knows helicopter weather can break the plan and wants a recovery path.",
    fallback_reason: "Use after a flight cancellation or when weather confidence is weak.",
    tags: ["weather", "recovery", "whale-backup", "same-day"],
  },
  {
    id: "short-port-call",
    title: "Short port-call plan",
    port: "Juneau",
    category: "Cruise timing",
    duration: null,
    price_from: null,
    rating: null,
    review_count: null,
    image: null,
    cruise_safe: "high",
    weather_risk: "variable",
    return_to_ship_confidence: "high",
    provider_type: "internal",
    cta_href: withDecisionParams("/juneau/cruise-excursions-what-to-do", {
      decision_action: "open-short-port-call-plan",
      decision_option: "short-port-call",
      decision_product: "juneau-port-day-plan",
      decision_state: "timing-first",
    }),
    cta_label: "Open port-day plan",
    decision_reason:
      "Best when the real constraint is ship timing, transfer margin, or avoiding an overbuilt port day.",
    fallback_reason: "Use when the visitor has limited hours in port or needs the simplest safe shape.",
    tags: ["cruise-safe", "timing", "short-port-call", "planning"],
  },
];

export const juneauTrustSignals = [
  "Cruise-day planning",
  "Weather-aware fallbacks",
  "Port timing awareness",
  "Partner/fallback labels",
] as const;

export const juneauGuideLinks = [
  {
    href: "/juneau/helicopter-vs-whale-watching",
    label: "Helicopter vs whale watching",
  },
  {
    href: "/juneau/helicopter-tour-weather-risk",
    label: "Helicopter weather risk",
  },
  {
    href: "/juneau/whale-watching-worth-it",
    label: "Is whale watching worth it?",
  },
  {
    href: "/juneau/whale-watch-and-dogsled-same-day",
    label: "Whale watch and dogsled same day",
  },
] as const;
