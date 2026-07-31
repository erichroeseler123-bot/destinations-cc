export const FAREHARBOR_SOURCES = {
  home: "wtonot-home",
  tours: "wtonot-tours",
  homeChooser: "wtonot-home-chooser",
  helpChooser: "wtonot-help-chooser",
  recommendation: "wtonot-recommendation",
  guide: "wtonot-guide",
  detailCity: "wtonot-detail-city",
  detailPlantation: "wtonot-detail-plantation",
  detailCovered: "wtonot-detail-covered",
  detailAirboat: "wtonot-detail-airboat",
  detailCityPlantation: "wtonot-detail-city-plantation",
  detailCoveredPlantation: "wtonot-detail-covered-plantation",
} as const;

export type FareHarborSource =
  (typeof FAREHARBOR_SOURCES)[keyof typeof FAREHARBOR_SOURCES];

export const APPROVED_PRODUCT_SLUGS = [
  "city-tour-of-new-orleans",
  "oak-alley-or-laura-plantation-tour",
  "covered-tour-boat",
  "ragin-cajun-airboat-options",
  "all-day-city-plantation-combo",
  "covered-boat-plantation-combo",
  "evening-jazz-cruise",
  "daytime-jazz-cruise",
  "sunday-jazz-brunch-cruise",
  "oak-alley-plantation-tour-grey-line",
  "whitney-plantation-tour",
  "swamp-bayou-tour",
  "small-airboat-swamp-adventure",
  "large-airboat-swamp-adventure",
  "swamp-boat-oak-alley-combo",
  "swamp-boat-whitney-combo",
  "cocktail-walking-tour",
  "craft-cocktail-walking-tour",
  "ghosts-spirits-walking-tour",
  "city-cemetery-garden-district-tour",
  "city-of-new-orleans-riverboat-cruise",
] as const;

export type ApprovedProductSlug = (typeof APPROVED_PRODUCT_SLUGS)[number];

const SOURCE_VALUES = new Set<string>(Object.values(FAREHARBOR_SOURCES));
const APPROVED_SLUG_VALUES = new Set<string>(APPROVED_PRODUCT_SLUGS);

const DEFAULT_DETAIL_SOURCE_BY_SLUG: Record<ApprovedProductSlug, FareHarborSource> = {
  "city-tour-of-new-orleans": FAREHARBOR_SOURCES.detailCity,
  "oak-alley-or-laura-plantation-tour": FAREHARBOR_SOURCES.detailPlantation,
  "covered-tour-boat": FAREHARBOR_SOURCES.detailCovered,
  "ragin-cajun-airboat-options": FAREHARBOR_SOURCES.detailAirboat,
  "all-day-city-plantation-combo": FAREHARBOR_SOURCES.detailCityPlantation,
  "covered-boat-plantation-combo": FAREHARBOR_SOURCES.detailCoveredPlantation,
  "evening-jazz-cruise": FAREHARBOR_SOURCES.tours,
  "daytime-jazz-cruise": FAREHARBOR_SOURCES.tours,
  "sunday-jazz-brunch-cruise": FAREHARBOR_SOURCES.tours,
  "oak-alley-plantation-tour-grey-line": FAREHARBOR_SOURCES.tours,
  "whitney-plantation-tour": FAREHARBOR_SOURCES.tours,
  "swamp-bayou-tour": FAREHARBOR_SOURCES.tours,
  "small-airboat-swamp-adventure": FAREHARBOR_SOURCES.tours,
  "large-airboat-swamp-adventure": FAREHARBOR_SOURCES.tours,
  "swamp-boat-oak-alley-combo": FAREHARBOR_SOURCES.tours,
  "swamp-boat-whitney-combo": FAREHARBOR_SOURCES.tours,
  "cocktail-walking-tour": FAREHARBOR_SOURCES.tours,
  "craft-cocktail-walking-tour": FAREHARBOR_SOURCES.tours,
  "ghosts-spirits-walking-tour": FAREHARBOR_SOURCES.tours,
  "city-cemetery-garden-district-tour": FAREHARBOR_SOURCES.tours,
  "city-of-new-orleans-riverboat-cruise": FAREHARBOR_SOURCES.tours,
};

const RECOMMENDATION_ONLY_SOURCES = new Set<FareHarborSource>([
  FAREHARBOR_SOURCES.homeChooser,
  FAREHARBOR_SOURCES.helpChooser,
  FAREHARBOR_SOURCES.recommendation,
]);

export function isFareHarborSource(value: unknown): value is FareHarborSource {
  return typeof value === "string" && SOURCE_VALUES.has(value);
}

export function isApprovedProductSlug(value: string): value is ApprovedProductSlug {
  return APPROVED_SLUG_VALUES.has(value);
}

export function getDefaultDetailSource(productSlug: ApprovedProductSlug): FareHarborSource {
  return DEFAULT_DETAIL_SOURCE_BY_SLUG[productSlug];
}

export function buildAttributedTourHref(
  productSlug: ApprovedProductSlug,
  source: FareHarborSource,
  recommended?: string,
): string {
  const params = new URLSearchParams();
  if (recommended) {
    params.set("recommended", recommended);
  }
  params.set("src", source);
  return `/tours/${productSlug}?${params.toString()}`;
}

export function resolveFareHarborSource({
  productSlug,
  requestedSource,
  hasValidRecommendation,
}: {
  productSlug: ApprovedProductSlug;
  requestedSource: unknown;
  hasValidRecommendation: boolean;
}): FareHarborSource {
  const fallback = getDefaultDetailSource(productSlug);
  if (!isFareHarborSource(requestedSource)) {
    return fallback;
  }
  if (RECOMMENDATION_ONLY_SOURCES.has(requestedSource) && !hasValidRecommendation) {
    return fallback;
  }
  return requestedSource;
}

export function buildFareHarborLightframeOptions({
  shortname,
  asn,
  itemId,
  flowId,
  source,
  scheduleUuid,
  fullItems,
}: {
  shortname: string;
  asn: string;
  itemId?: string | number;
  flowId?: string | number;
  source: FareHarborSource | string;
  scheduleUuid?: string;
  fullItems?: string;
}) {
  const options: {
    shortname: string;
    asn: string;
    ref: FareHarborSource | string;
    view?: { item: string };
    flow?: string;
    scheduleUuid?: string;
    fullItems?: string;
  } = {
    shortname,
    asn,
    ref: source,
  };

  if (itemId) {
    options.view = { item: String(itemId) };
  }
  if (flowId) {
    options.flow = String(flowId);
  }
  if (scheduleUuid) {
    options.scheduleUuid = scheduleUuid; // Note: if the widget doesn't use this, it doesn't hurt, but the fallback href preserves it.
  }
  if (fullItems) {
    options.fullItems = fullItems;
  }

  return options;
}
