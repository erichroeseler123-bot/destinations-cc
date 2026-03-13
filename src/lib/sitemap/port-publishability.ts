import { PORT_AUTHORITY_CONFIG, type PortAuthorityConfig } from "@/src/data/port-authority-config";

type CoverageDecision = {
  included: boolean;
  reasons: string[];
};

export type PortPublishability = {
  portSlug: string;
  root: CoverageDecision;
  cruiseRoute: CoverageDecision;
};

function hasContentArray(value: unknown, min = 1): boolean {
  return Array.isArray(value) && value.length >= min;
}

function rootDecision(config: PortAuthorityConfig): CoverageDecision {
  const reasons: string[] = [];
  if (!config.updatedAt || Number.isNaN(Date.parse(config.updatedAt))) reasons.push("updated_at_invalid");
  if (config.refreshIntervalDays < 14) reasons.push("refresh_interval_lt_14");
  if (!hasContentArray(config.excursionCategories, 3)) reasons.push("excursion_categories_lt_3");
  if (!hasContentArray(config.knownFor, 4)) reasons.push("known_for_lt_4");
  if (!hasContentArray(config.nearbyZones, 3)) reasons.push("nearby_zones_lt_3");
  if (!hasContentArray(config.logistics, 3)) reasons.push("logistics_lt_3");
  if (!hasContentArray(config.faq, 3)) reasons.push("faq_lt_3");
  if (!hasContentArray(config.relatedLinks, 2)) reasons.push("related_links_lt_2");
  return { included: reasons.length === 0, reasons };
}

function cruiseRouteDecision(config: PortAuthorityConfig): CoverageDecision {
  const reasons: string[] = [];
  if (!config.cruisePortHref || !config.canonicalCruisePortSlug) reasons.push("missing_cruise_port_mapping");
  return { included: reasons.length === 0, reasons };
}

export function evaluatePortPublishability(portSlug: string, config: PortAuthorityConfig): PortPublishability {
  const root = rootDecision(config);
  const cruiseRoute = cruiseRouteDecision(config);
  if (!root.included) {
    cruiseRoute.included = false;
    cruiseRoute.reasons = ["port_not_publishable", ...cruiseRoute.reasons];
  }
  return { portSlug, root, cruiseRoute };
}

export function listPublishablePortAuthoritySlugs(): string[] {
  return Object.entries(PORT_AUTHORITY_CONFIG)
    .filter(([slug, config]) => evaluatePortPublishability(slug, config).root.included)
    .map(([slug]) => slug)
    .sort();
}

export function listPublishableCruisePortSlugs(): string[] {
  return Object.entries(PORT_AUTHORITY_CONFIG)
    .map(([slug, config]) => ({ slug, config, evalResult: evaluatePortPublishability(slug, config) }))
    .filter((row) => row.evalResult.cruiseRoute.included && row.config.canonicalCruisePortSlug)
    .map((row) => row.config.canonicalCruisePortSlug as string)
    .sort();
}
