export interface FirstPartyWidgetInstallation {
  id: string;
  siteName: string;
  pagePath: string;
  productionUrl: string;
  surface: string;
  defaultDestination: string;
  defaultPickupMode: string;
  status: "live_first_party";
}

export interface ObservedExternalWidgetEmbed {
  origin: string;
  refererUrl: string;
  propertySlug: string | null;
  surface: string | null;
  firstObservedAt: string;
  lastObservedAt: string;
  requestCount: number;
  verificationStatus: "unverified_observed_origin_only";
  verificationNote: string;
}

export interface ApprovedExternalPartnerPlacement {
  partnerId: string;
  partnerName: string;
  approvedDomain: string;
  placementUrl: string;
  propertySlug: string;
  surface: string;
  approvedAt: string;
  status: "verified_partner_live";
}

export interface WidgetPlacementReport {
  firstPartyInstallationsCount: number;
  firstPartyInstallations: FirstPartyWidgetInstallation[];
  observedExternalEmbedsCount: number;
  observedExternalEmbeds: ObservedExternalWidgetEmbed[];
  approvedExternalPartnerPlacementsCount: number;
  approvedExternalPartnerPlacements: ApprovedExternalPartnerPlacement[];
  verificationPolicy: string;
  externalInstallationPackage: {
    version: string;
    loaderScriptUrl: string;
    iframeEmbedUrlTemplate: string;
    supportedAttributes: string[];
  };
}

export const FIRST_PARTY_WIDGET_INSTALLATIONS: FirstPartyWidgetInstallation[] = [
  {
    id: "fp-dcc-tours-hub",
    siteName: "Destination Command Center",
    pagePath: "/tours",
    productionUrl: "https://www.destinationcommandcenter.com/tours",
    surface: "dcc_tours_hub",
    defaultDestination: "new-orleans",
    defaultPickupMode: "either",
    status: "live_first_party",
  },
  {
    id: "fp-dcc-nola-tours",
    siteName: "Destination Command Center / Welcome to New Orleans Tours",
    pagePath: "/new-orleans/tours",
    productionUrl: "https://www.destinationcommandcenter.com/new-orleans/tours",
    surface: "nola_food_music",
    defaultDestination: "new-orleans",
    defaultPickupMode: "hotel_pickup",
    status: "live_first_party",
  },
  {
    id: "fp-dcc-nola-swamp-tours",
    siteName: "Destination Command Center / Welcome to the Swamp",
    pagePath: "/new-orleans/swamp-tours",
    productionUrl: "https://www.destinationcommandcenter.com/new-orleans/swamp-tours",
    surface: "swamp_specialist",
    defaultDestination: "new-orleans",
    defaultPickupMode: "hotel_pickup",
    status: "live_first_party",
  },
  {
    id: "fp-dcc-juneau-tours",
    siteName: "Destination Command Center",
    pagePath: "/juneau/tours",
    productionUrl: "https://www.destinationcommandcenter.com/juneau/tours",
    surface: "cruise_port_concierge",
    defaultDestination: "juneau",
    defaultPickupMode: "pier_pickup",
    status: "live_first_party",
  },
  {
    id: "fp-dcc-port-juneau",
    siteName: "Destination Command Center Port Guide",
    pagePath: "/ports/juneau",
    productionUrl: "https://www.destinationcommandcenter.com/ports/juneau",
    surface: "cruise_port_concierge",
    defaultDestination: "juneau",
    defaultPickupMode: "pier_pickup",
    status: "live_first_party",
  },
  {
    id: "fp-dcc-port-ketchikan",
    siteName: "Destination Command Center Port Guide",
    pagePath: "/ports/ketchikan",
    productionUrl: "https://www.destinationcommandcenter.com/ports/ketchikan",
    surface: "cruise_port_concierge",
    defaultDestination: "ketchikan",
    defaultPickupMode: "pier_pickup",
    status: "live_first_party",
  },
  {
    id: "fp-dcc-port-skagway",
    siteName: "Destination Command Center Port Guide",
    pagePath: "/ports/skagway",
    productionUrl: "https://www.destinationcommandcenter.com/ports/skagway",
    surface: "cruise_port_concierge",
    defaultDestination: "skagway",
    defaultPickupMode: "pier_pickup",
    status: "live_first_party",
  },
  {
    id: "fp-dcc-port-cozumel",
    siteName: "Destination Command Center Port Guide",
    pagePath: "/ports/cozumel",
    productionUrl: "https://www.destinationcommandcenter.com/ports/cozumel",
    surface: "cruise_port_concierge",
    defaultDestination: "cozumel",
    defaultPickupMode: "pier_pickup",
    status: "live_first_party",
  },
  {
    id: "fp-cp-port-juneau",
    siteName: "Cruise Promenade",
    pagePath: "/ports/juneau",
    productionUrl: "https://cruisepromenade.com/ports/juneau",
    surface: "cruise_port_shortlist_matcher",
    defaultDestination: "juneau",
    defaultPickupMode: "pier_pickup",
    status: "live_first_party",
  },
  {
    id: "fp-cp-planner",
    siteName: "Cruise Promenade",
    pagePath: "/planner",
    productionUrl: "https://cruisepromenade.com/planner",
    surface: "cruise_itinerary_planner",
    defaultDestination: "juneau",
    defaultPickupMode: "pier_pickup",
    status: "live_first_party",
  },
];

// Approved external partner placements require an explicit partner agreement & domain allowlist.
// Referer or parentOrigin alone NEVER adds a record here.
export const APPROVED_EXTERNAL_PARTNER_PLACEMENTS: ApprovedExternalPartnerPlacement[] = [];

const observedExternalEmbedsMap = new Map<string, ObservedExternalWidgetEmbed>();

const FIRST_PARTY_HOST_PATTERNS = [
  /(^|\.)destinationcommandcenter\.com$/i,
  /(^|\.)cruisepromenade\.com$/i,
  /(^|\.)saveonthestrip\.com$/i,
  /(^|\.)redrocksshuttle\.com$/i,
  /(^|\.)gosno\.co$/i,
  /(^|\.)partyatredrocks\.com$/i,
  /(^|\.)welcometotheswamp\.com$/i,
  /(^|\.)welcometoneworleanstours\.com$/i,
  /(^|\.)welcometoalaskatours\.com$/i,
  /\.vercel\.app$/i,
  /^localhost$/i,
  /^127\.0\.0\.1$/i,
];

export function isFirstPartyHost(hostname: string): boolean {
  const clean = hostname.trim().toLowerCase();
  if (!clean) return true;
  return FIRST_PARTY_HOST_PATTERNS.some((rx) => rx.test(clean));
}

export function recordObservedWidgetOrigin(input: {
  referer?: string | null;
  parentOrigin?: string | null;
  propertySlug?: string | null;
  surface?: string | null;
}): void {
  const rawCandidate = input.parentOrigin?.trim() || input.referer?.trim() || "";
  if (!rawCandidate) return;

  try {
    const parsed = new URL(rawCandidate);
    if (isFirstPartyHost(parsed.hostname)) {
      return;
    }
    const originKey = parsed.origin.toLowerCase();
    const nowIso = new Date().toISOString();
    const existing = observedExternalEmbedsMap.get(originKey);
    if (existing) {
      existing.lastObservedAt = nowIso;
      existing.requestCount += 1;
      return;
    }
    observedExternalEmbedsMap.set(originKey, {
      origin: parsed.origin,
      refererUrl: rawCandidate,
      propertySlug: input.propertySlug ?? null,
      surface: input.surface ?? null,
      firstObservedAt: nowIso,
      lastObservedAt: nowIso,
      requestCount: 1,
      verificationStatus: "unverified_observed_origin_only",
      verificationNote:
        "Observed via HTTP Referer or parentOrigin header only; does not establish a verified external partner placement.",
    });
  } catch {
    // Ignore malformed referer/origin strings
  }
}

export function getWidgetPlacementReport(): WidgetPlacementReport {
  const observedList = Array.from(observedExternalEmbedsMap.values());
  return {
    firstPartyInstallationsCount: FIRST_PARTY_WIDGET_INSTALLATIONS.length,
    firstPartyInstallations: FIRST_PARTY_WIDGET_INSTALLATIONS,
    observedExternalEmbedsCount: observedList.length,
    observedExternalEmbeds: observedList,
    approvedExternalPartnerPlacementsCount: APPROVED_EXTERNAL_PARTNER_PLACEMENTS.length,
    approvedExternalPartnerPlacements: APPROVED_EXTERNAL_PARTNER_PLACEMENTS,
    verificationPolicy:
      "First-party installations, observed external embeds, and approved external partner placements are counted separately. HTTP Referer or parentOrigin headers alone never establish a verified external partnership.",
    externalInstallationPackage: {
      version: "2026.11.05",
      loaderScriptUrl:
        "https://www.destinationcommandcenter.com/embed/dcc-concierge-widget.js",
      iframeEmbedUrlTemplate:
        "https://www.destinationcommandcenter.com/embed/concierge?destination={destination}&property={property}&surface={surface}&pickupMode={pickupMode}",
      supportedAttributes: [
        "data-destination",
        "data-property",
        "data-surface",
        "data-pickup-mode",
        "data-ship-arrival",
        "data-ship-all-aboard",
        "data-berth-minutes",
        "data-category",
        "data-min-height",
      ],
    },
  };
}
