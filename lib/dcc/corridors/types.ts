export type DccSatelliteId =
  | "partyatredrocks"
  | "gosno"
  | "saveonthestrip"
  | "redrocksfastpass"
  | "welcometotheswamp"
  | "welcome-to-alaska";

export type CorridorRouteRole =
  | "hub"
  | "feeder"
  | "support"
  | "execution"
  | "execution_alias"
  | "redirect"
  | "deprecated";

export type CorridorRouteConfig = {
  route: string;
  role: CorridorRouteRole;
  target?: string;
  pageParamAlias?: string;
  notes?: string;
};

export type CorridorNavigationLink = {
  href: string;
  label: string;
};

export type CorridorDecisionCard = {
  href: string;
  title: string;
  body: string;
  label: string;
};

export type CorridorHandoffMode = "shared" | "private" | "plan" | "custom";

export type CorridorHandoffTarget = {
  id: string;
  href: string;
  mode: CorridorHandoffMode;
  notes?: string;
  satelliteId?: DccSatelliteId;
  venueSlug?: string;
  citySlug?: string;
  isCanonical?: boolean;
};

export type CorridorHandoffContract = {
  approvedParams: string[];
  forbiddenLegacyParams: string[];
  targets: CorridorHandoffTarget[];
};

export type CorridorCommandBinding = {
  corridorId: string;
  satelliteId?: DccSatelliteId;
  venueSlug?: string;
  citySlug?: string;
};

export type CorridorAuditPageConfig = {
  route: string;
  file: string;
  alias: string;
  role: "hub" | "feeder";
  expectedRegistryTarget: string;
  requiredUrlCtas: string[];
  requiredTelemetryCtas: string[];
  minParrCtaLinks: number;
  requireHubFallback: boolean;
};

export type CorridorAuditConfig = {
  pages: CorridorAuditPageConfig[];
  shellFile?: string;
};

export type CorridorManifest = {
  id: string;
  canonicalHubRoute: string;
  handoff: CorridorHandoffContract;
  command?: CorridorCommandBinding;
  relatedGuides: CorridorNavigationLink[];
  decisionCards: CorridorDecisionCard[];
  routes: CorridorRouteConfig[];
  audit?: CorridorAuditConfig;
};

export type AvailabilityTripStyleOption = {
  value: string;
  label: string;
};

export type AvailabilityChoiceHelpRule = {
  lane: string;
  title: string;
  body: string;
};

export type AvailabilityFaqItem = {
  question: string;
  answer: string;
};

export type AvailabilityLaneRule = {
  lane: string;
  includeTerms: string[];
  fitTag: string;
};

export type AvailabilityCorridorSearchInput = {
  corridor: string;
  date: string;
  partySize: number;
  tripStyle?: string;
};

export type AvailabilityCorridorOption = {
  id: string;
  vendor: "viator" | "travelpayouts";
  title: string;
  description: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  priceFrom: number | null;
  currency: string;
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  bookingUrl: string;
  cancellationSummary: string | null;
  rawTags: string[];
  source: "live_api" | "cache" | "catalog_fallback";
};

export type RankedAvailabilityCorridorOption = AvailabilityCorridorOption & {
  lane: string;
  fitTag: string;
  score: number;
};

export type AvailabilityCorridorInventoryResult = {
  options: AvailabilityCorridorOption[];
  source: "live_api" | "cache" | "catalog_fallback";
  fallbackReason: string | null;
  enabled: boolean;
};

export type AvailabilityCorridorConfig = {
  corridorId: string;
  route: string;
  place: {
    slug: string;
    name: string;
    citySlug?: string;
    currency?: string;
  };
  headline: string;
  subhead: string;
  searchLabel: string;
  tripStyles: AvailabilityTripStyleOption[];
  defaultTripStyle: string;
  defaultLane: string;
  laneRules: AvailabilityLaneRule[];
  choiceHelp: AvailabilityChoiceHelpRule[];
  faqs: AvailabilityFaqItem[];
  finalRecommendation: {
    headline: string;
    body: string;
    ctaLabel: string;
    defaultLane: string;
  };
};
