import { CITY_MONEY_LANES } from "@/src/data/city-money-lanes";
import type { CityAuthorityConfig } from "@/src/data/city-authority-config";

type CoverageDecision = {
  included: boolean;
  reasons: string[];
};

export type CityPublishability = {
  cityKey: string;
  root: CoverageDecision;
  routes: {
    tours: CoverageDecision;
    shows: CoverageDecision;
    attractions: CoverageDecision;
    "day-trips": CoverageDecision;
    helicopter: CoverageDecision;
  };
};

function hasContentArray(value: unknown, min = 1): boolean {
  return Array.isArray(value) && value.length >= min;
}

function hasKeyword(config: CityAuthorityConfig, word: string): boolean {
  const needle = word.toLowerCase();
  return config.keywords.some((k) => k.toLowerCase().includes(needle));
}

function hasPillarText(config: CityAuthorityConfig, word: string): boolean {
  const needle = word.toLowerCase();
  return config.pillars.some((p) => p.toLowerCase().includes(needle));
}

function rootDecision(config: CityAuthorityConfig): CoverageDecision {
  const reasons: string[] = [];
  if (!hasContentArray(config.keywords, 5)) reasons.push("keywords_lt_5");
  if (!hasContentArray(config.pillars, 3)) reasons.push("pillars_lt_3");
  if (!hasContentArray(config.faq, 3)) reasons.push("faq_lt_3");
  if (!hasContentArray(config.eventQueries, 4)) reasons.push("event_queries_lt_4");
  if (!hasContentArray(config.linkedPages, 2)) reasons.push("linked_pages_lt_2");
  return { included: reasons.length === 0, reasons };
}

function toursDecision(cityKey: string): CoverageDecision {
  const reasons: string[] = [];
  const lane = CITY_MONEY_LANES[cityKey];
  if (!lane) reasons.push("missing_money_lane");
  if (lane && !hasContentArray(lane.intents, 3)) reasons.push("money_lane_intents_lt_3");
  if (lane && !lane.primaryCtaHref.includes("/tours")) reasons.push("primary_cta_not_tours");
  return { included: reasons.length === 0, reasons };
}

function showsDecision(config: CityAuthorityConfig): CoverageDecision {
  const reasons: string[] = [];
  if (!hasContentArray(config.eventQueries, 4)) reasons.push("event_queries_lt_4");
  if (!hasContentArray(config.eventVenues, 3)) reasons.push("event_venues_lt_3");
  return { included: reasons.length === 0, reasons };
}

function attractionsDecision(config: CityAuthorityConfig): CoverageDecision {
  const reasons: string[] = [];
  if (!hasContentArray(config.pillars, 3)) reasons.push("pillars_lt_3");
  if (!hasContentArray(config.faq, 3)) reasons.push("faq_lt_3");
  return { included: reasons.length === 0, reasons };
}

function dayTripsDecision(config: CityAuthorityConfig): CoverageDecision {
  const hasSignal = hasKeyword(config, "day trip") || hasPillarText(config, "day trip");
  return { included: hasSignal, reasons: hasSignal ? [] : ["missing_day_trip_signal"] };
}

function helicopterDecision(cityKey: string, config: CityAuthorityConfig): CoverageDecision {
  if (hasKeyword(config, "helicopter") || hasPillarText(config, "helicopter")) {
    return { included: true, reasons: [] };
  }
  const lane = CITY_MONEY_LANES[cityKey];
  if (lane?.intents.some((intent) => intent.query.toLowerCase().includes("helicopter"))) {
    return { included: true, reasons: [] };
  }
  return { included: false, reasons: ["missing_helicopter_signal"] };
}

export function evaluateCityPublishability(
  cityKey: string,
  config: CityAuthorityConfig
): CityPublishability {
  const root = rootDecision(config);
  const routes = {
    tours: toursDecision(cityKey),
    shows: showsDecision(config),
    attractions: attractionsDecision(config),
    "day-trips": dayTripsDecision(config),
    helicopter: helicopterDecision(cityKey, config),
  };

  if (!root.included) {
    for (const route of Object.values(routes)) {
      route.included = false;
      route.reasons = ["city_not_publishable", ...route.reasons];
    }
  }

  return { cityKey, root, routes };
}
