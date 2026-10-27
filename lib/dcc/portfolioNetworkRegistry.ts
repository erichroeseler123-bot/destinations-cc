/**
 * Canonical DCC Portfolio Network Registry & Versioned Site Manifest (`dcc.site-manifest.v1`)
 *
 * Covers the 12 participating travel-commerce and planning properties:
 * 1. destinationcommandcenter.com
 * 2. cruisepromenade.com
 * 3. lastfrontiershoreexcursions.com
 * 4. juneauflightdeck.com
 * 5. welcometoneworleanstours.com
 * 6. welcometotheswamp.com
 * 7. vibearoundtown.com
 * 8. gosno.co
 * 9. feastlyspread.com
 * 10. brinkberry.com
 * 11. partyatredrocks.com
 * 12. 420friendlyairportpickup.com
 *
 * Explicitly excludes:
 * - rollcallusa.com (RollCall USA — kept outside the travel-commerce network)
 * - welcometoalaskatours.com / welcome-to-alaska (Welcome to Alaska Tours — excluded)
 *
 * Governance invariants:
 * - DecisionAuthorization remains in `shadow_only_no_side_effects`.
 * - No autonomous booking, no live DecisionAuthorization execution, no provider holds,
 *   no delegated payment capture, and no universal multi-provider checkout.
 * - Do not expose secrets, customer information, private evidence, or commission terms.
 */

export const DCC_SITE_MANIFEST_SCHEMA = "dcc.site-manifest.v1" as const;
export const DCC_SITE_MANIFEST_VERSION = "1.0.0" as const;

export type DccBookingAuthorityMode =
  | "direct_provider"
  | "fareharbor"
  | "rezdy"
  | "viator_affiliate"
  | "getyourguide_affiliate"
  | "request_only"
  | "inquiry_only";

export type DccContextSupportMode =
  | "private_trip_context"
  | "public_shared_plans"
  | "both";

export type DccPortfolioSiteId =
  | "destinationcommandcenter"
  | "cruisepromenade"
  | "lastfrontiershoreexcursions"
  | "juneauflightdeck"
  | "welcometoneworleanstours"
  | "welcometotheswamp"
  | "vibearoundtown"
  | "gosno"
  | "feastlyspread"
  | "brinkberry"
  | "partyatredrocks"
  | "420friendlyairportpickup";

export interface DccSiteRelationshipEdge {
  site_id: DccPortfolioSiteId | "approved_ai_concierge_partner";
  canonical_domain: string;
  journey_id: string;
  relationship_type: string;
  context_exchange: "opaque_dcc_ctx" | "sanitized_public_share_code";
}

export interface DccCommercialChannelManifest {
  channel_id: string;
  provider:
    | "direct_provider"
    | "fareharbor"
    | "rezdy"
    | "viator"
    | "getyourguide"
    | "square"
    | "request_only"
    | "inquiry_only";
  attribution_parameter: string;
  outcome_reporting:
    | "click_level_only"
    | "modified_since_poller"
    | "direct_checkout_boundary"
    | "request_or_inquiry_only";
  notes: string;
}

export interface DccSiteManifestV1 {
  schema: typeof DCC_SITE_MANIFEST_SCHEMA;
  version: typeof DCC_SITE_MANIFEST_VERSION;
  site_id: DccPortfolioSiteId;
  site_name: string;
  canonical_domains: readonly string[];
  aliases: readonly string[];
  consumer_role: string;
  dcc_universe_ids: readonly string[];
  accepted_context_fields: readonly string[];
  emitted_context_fields: readonly string[];
  booking_authority: {
    primary: DccBookingAuthorityMode;
    supported_authorities: readonly DccBookingAuthorityMode[];
    takes_direct_payment: boolean;
    autonomous_booking_enabled: false;
    decision_authorization_mode: "shadow_only_no_side_effects";
    universal_multi_provider_checkout: false;
    finality_statement: string;
  };
  natural_relationships: {
    inbound: readonly DccSiteRelationshipEdge[];
    outbound: readonly DccSiteRelationshipEdge[];
  };
  commercial_channels: readonly DccCommercialChannelManifest[];
  context_support: {
    mode: DccContextSupportMode;
    supports_private_trip_context: boolean;
    supports_public_shared_plans: boolean;
    cookie_name: string;
    cookie_flags: "Secure; HttpOnly; SameSite=Lax";
    strips_token_from_url: true;
    url_pii_forbidden: true;
    forbidden_url_fields: readonly string[];
  };
  privacy_and_security: {
    exposes_secrets: false;
    exposes_customer_information: false;
    exposes_private_evidence: false;
    exposes_commission_terms: false;
  };
  market_coverage?: {
    existing_booking_path_markets_count: number;
    coverage_request_markets_count: number;
    existing_booking_path_markets: readonly string[];
    coverage_request_markets: readonly string[];
  };
}

export interface DccExcludedPortfolioSite {
  site_id: "rollcallusa" | "welcometoalaskatours";
  site_name: string;
  canonical_domains: readonly string[];
  aliases: readonly string[];
  status: "excluded_outside_travel_commerce_network" | "excluded_from_portfolio_network";
  reason: string;
}

export const FORBIDDEN_URL_PII_FIELDS = [
  "name",
  "fullname",
  "first_name",
  "last_name",
  "passengername",
  "email",
  "phone",
  "weight",
  "weights",
  "passengerweight",
  "passengerweightlbs",
  "maxpassengerweightlbs",
  "accessibility",
  "mobilitynotes",
  "medicalnotes",
  "bookingref",
  "bookingreference",
  "confirmationnumber",
  "cabin",
  "cabinnumber",
  "stateroom",
  "stateroomnumber",
  "privatenotes",
  "internalnotes",
] as const;

export interface FeastlySpreadMarketDefinition {
  slug: string;
  name: string;
  state: string;
  status: "existing_booking_path" | "coverage_request_market";
  checkoutPath: string;
  hasExistingBookingPath: boolean;
  requiresCoverageInquiryOnly: boolean;
  disclosure: string;
}

/**
 * Feastly Spread 18-Location Catalog:
 * - 2 Existing Booking Path Markets (`wisconsin-dells`, `door-county`) with existing booking paths (`/book?market=<slug>`)
 * - 16 Coverage-Request Markets with explicit coverage-request/inquiry routing (never implying live checkout or confirmed fulfillment)
 */
export const FEASTLY_SPREAD_MARKETS: readonly FeastlySpreadMarketDefinition[] = [
  {
    slug: "wisconsin-dells",
    name: "Wisconsin Dells, WI",
    state: "WI",
    status: "existing_booking_path",
    checkoutPath: "/book?market=wisconsin-dells",
    hasExistingBookingPath: true,
    requiresCoverageInquiryOnly: false,
    disclosure:
      "Existing booking path: FeastlySpread offers a published group catering booking path for Wisconsin Dells vacation rentals with explicit traveler confirmation.",
  },
  {
    slug: "door-county",
    name: "Door County, WI",
    state: "WI",
    status: "existing_booking_path",
    checkoutPath: "/book?market=door-county",
    hasExistingBookingPath: true,
    requiresCoverageInquiryOnly: false,
    disclosure:
      "Existing booking path: FeastlySpread offers a published group catering booking path for Door County vacation rentals with explicit traveler confirmation.",
  },
  {
    slug: "gatlinburg",
    name: "Gatlinburg / Pigeon Forge, TN",
    state: "TN",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=gatlinburg#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Gatlinburg / Pigeon Forge. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "lake-tahoe",
    name: "Lake Tahoe, CA/NV",
    state: "CA/NV",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=lake-tahoe#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Lake Tahoe. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "outer-banks",
    name: "Outer Banks, NC",
    state: "NC",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=outer-banks#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Outer Banks. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "destin-panama-city-beach",
    name: "Destin / Panama City Beach, FL",
    state: "FL",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=destin-panama-city-beach#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Destin / Panama City Beach. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "big-bear",
    name: "Big Bear Lake, CA",
    state: "CA",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=big-bear#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Big Bear Lake. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "branson",
    name: "Branson / Table Rock Lake, MO",
    state: "MO",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=branson#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Branson. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "broken-bow",
    name: "Broken Bow / Hochatown, OK",
    state: "OK",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=broken-bow#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Broken Bow. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "lake-of-the-ozarks",
    name: "Lake of the Ozarks, MO",
    state: "MO",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=lake-of-the-ozarks#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Lake of the Ozarks. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "scottsdale",
    name: "Scottsdale, AZ",
    state: "AZ",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=scottsdale#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Scottsdale. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "nashville",
    name: "Nashville, TN",
    state: "TN",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=nashville#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Nashville. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "hamptons",
    name: "The Hamptons, NY",
    state: "NY",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=hamptons#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in The Hamptons. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "lake-geneva",
    name: "Lake Geneva, WI",
    state: "WI",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=lake-geneva#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Lake Geneva. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "minocqua",
    name: "Minocqua / Northwoods, WI",
    state: "WI",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=minocqua#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Minocqua / Northwoods. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "gulf-shores",
    name: "Gulf Shores / Orange Beach, AL",
    state: "AL",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=gulf-shores#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Gulf Shores / Orange Beach. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "myrtle-beach",
    name: "Myrtle Beach, SC",
    state: "SC",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=myrtle-beach#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Myrtle Beach. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
  {
    slug: "park-city",
    name: "Park City, UT",
    state: "UT",
    status: "coverage_request_market",
    checkoutPath: "/locations?request_market=park-city#coverage-request",
    hasExistingBookingPath: false,
    requiresCoverageInquiryOnly: true,
    disclosure:
      "Coverage-request market only: an existing booking path is not available in Park City. Submitting a coverage request logs market demand and does not confirm catering fulfillment.",
  },
] as const;

export function resolveFeastlySpreadMarket(marketSlug: string): FeastlySpreadMarketDefinition | null {
  const normalized = marketSlug.trim().toLowerCase();
  return FEASTLY_SPREAD_MARKETS.find((m) => m.slug === normalized) || null;
}

export const DCC_EXCLUDED_PORTFOLIO_SITES: readonly DccExcludedPortfolioSite[] = [
  {
    site_id: "rollcallusa",
    site_name: "RollCall USA",
    canonical_domains: ["rollcallusa.com", "www.rollcallusa.com"],
    aliases: ["roll-call-usa", "rollcall-usa", "rollcall"],
    status: "excluded_outside_travel_commerce_network",
    reason: "RollCall USA is a civic directory property and is strictly excluded from the DCC travel-commerce network.",
  },
  {
    site_id: "welcometoalaskatours",
    site_name: "Welcome to Alaska Tours",
    canonical_domains: ["welcometoalaskatours.com", "www.welcometoalaskatours.com"],
    aliases: ["welcome-to-alaska", "welcome-to-alaska-tours", "wta-renderer", "wta-ui"],
    status: "excluded_from_portfolio_network",
    reason: "Welcome to Alaska Tours is explicitly excluded from the DCC portfolio network; Alaska shore excursion discovery routes through Last Frontier Shore Excursions and Juneau Flight Deck.",
  },
] as const;

export const DCC_PORTFOLIO_NETWORK_SITES: readonly DccSiteManifestV1[] = [
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "destinationcommandcenter",
    site_name: "Destination Command Center",
    canonical_domains: ["destinationcommandcenter.com", "www.destinationcommandcenter.com"],
    aliases: ["dcc", "destination-command-center", "dcc:site:destination-command-center"],
    consumer_role:
      "Canonical location intelligence graph, deterministic decision assurance engine, opaque trip-context authority, and portfolio commercial handoff router",
    dcc_universe_ids: [
      "univ:juneau-helicopter-tours:0.3.0",
      "univ:alaska-shore-excursions:0.3.0",
      "univ:new-orleans-city-tours:0.3.0",
      "univ:new-orleans-swamp-tours:0.3.0",
      "univ:colorado-mountain-transfers:0.3.0",
      "univ:red-rocks-concert-shuttle:0.3.0",
      "univ:denver-420-airport-transfers:0.3.0",
      "univ:cruise-port-private-drivers:0.3.0",
      "univ:vacation-rental-catering-spreads:0.3.0",
    ],
    accepted_context_fields: [
      "contextId",
      "sourceSite",
      "destination",
      "targetOwner",
      "targetIntent",
      "schedule.date",
      "schedule.arrival",
      "schedule.departure",
      "schedule.travelers",
      "schedule.shipOrVenue",
      "additionalPreferenceBufferMinutes",
    ],
    emitted_context_fields: [
      "contextId",
      "sourceSite",
      "destination",
      "targetOwner",
      "targetIntent",
      "timezone",
      "schedule.date",
      "schedule.arrival",
      "schedule.departure",
      "schedule.travelers",
      "schedule.shipOrVenue",
      "safetyConstraint.bufferMinutes",
      "safetyConstraint.latestSafeReturnDate",
      "safetyConstraint.latestSafeReturnTime",
      "safetyConstraint.midnightCrossed",
    ],
    booking_authority: {
      primary: "inquiry_only",
      supported_authorities: [
        "viator_affiliate",
        "getyourguide_affiliate",
        "fareharbor",
        "direct_provider",
        "inquiry_only",
      ],
      takes_direct_payment: false,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "Destination Command Center evaluates evidence-backed fit and issues opaque context or commercial handoffs; all bookings and payments are finalized on the controlling operator or provider surface.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "cruise-plan-to-dcc-assurance",
          relationship_type: "port_window_assurance",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "brinkberry",
          canonical_domain: "brinkberry.com",
          journey_id: "brinkberry-destination-context",
          relationship_type: "regional_event_and_stay_context",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "dcc-to-cruise-promenade",
          relationship_type: "cruise_hub_planning",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "lastfrontiershoreexcursions",
          canonical_domain: "lastfrontiershoreexcursions.com",
          journey_id: "alaska-port-excursions",
          relationship_type: "alaska_shore_excursion_routing",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "juneauflightdeck",
          canonical_domain: "juneauflightdeck.com",
          journey_id: "juneau-aviation-qualification",
          relationship_type: "juneau_helicopter_qualification",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "welcometoneworleanstours",
          canonical_domain: "welcometoneworleanstours.com",
          journey_id: "new-orleans-city-discovery",
          relationship_type: "new_orleans_tour_routing",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "welcometotheswamp",
          canonical_domain: "welcometotheswamp.com",
          journey_id: "new-orleans-swamp-discovery",
          relationship_type: "new_orleans_swamp_routing",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "gosno",
          canonical_domain: "gosno.co",
          journey_id: "ai-concierge-to-gosno-review",
          relationship_type: "prefilled_mountain_transfer_review",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "feastlyspread",
          canonical_domain: "feastlyspread.com",
          journey_id: "destination-context-to-feastly",
          relationship_type: "vacation_rental_catering_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "dcc-viator-affiliate",
        provider: "viator",
        attribution_parameter: "pid,mcid,campaign",
        outcome_reporting: "modified_since_poller",
        notes: "Viator affiliate attribution via documented pid/mcid/campaign parameters with optional /bookings/modified-since reconciliation.",
      },
      {
        channel_id: "dcc-gyg-affiliate",
        provider: "getyourguide",
        attribution_parameter: "partner_id,cmp",
        outcome_reporting: "click_level_only",
        notes: "GetYourGuide provides click-level attribution only via partner_id and cmp unless a documented provider reporting feed carries handoff_id.",
      },
      {
        channel_id: "dcc-fareharbor-affiliate",
        provider: "fareharbor",
        attribution_parameter: "asn,ref",
        outcome_reporting: "click_level_only",
        notes: "FareHarbor ASN referral via documented asn and ref parameters.",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "dcc_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "cruisepromenade",
    site_name: "Cruise Promenade",
    canonical_domains: ["cruisepromenade.com", "www.cruisepromenade.com"],
    aliases: ["cruise-promenade", "dcc:site:cruise-promenade"],
    consumer_role:
      "Cruise planning hub with distinct sanitized public shared plans (shareCode) and private opaque trip-context (context_id) port-day handoffs",
    dcc_universe_ids: [
      "univ:alaska-shore-excursions:0.3.0",
      "univ:juneau-helicopter-tours:0.3.0",
      "univ:new-orleans-city-tours:0.3.0",
      "univ:new-orleans-swamp-tours:0.3.0",
      "univ:cruise-port-private-drivers:0.3.0",
    ],
    accepted_context_fields: [
      "contextId",
      "shipSlug",
      "sailingDate",
      "portSlug",
      "portDate",
      "arrivalTime",
      "departureTime",
      "partySize",
    ],
    emitted_context_fields: [
      "contextId",
      "shipSlug",
      "sailingDate",
      "portSlug",
      "portDate",
      "arrivalTime",
      "departureTime",
      "partySize",
      "requirementFlags",
    ],
    booking_authority: {
      primary: "getyourguide_affiliate",
      supported_authorities: [
        "getyourguide_affiliate",
        "viator_affiliate",
        "fareharbor",
        "direct_provider",
      ],
      takes_direct_payment: false,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "Cruise Promenade is a cruise planning hub; excursion bookings and payments are finalized on the target operator or affiliate provider surface.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "destinationcommandcenter",
          canonical_domain: "destinationcommandcenter.com",
          journey_id: "dcc-to-cruise-promenade",
          relationship_type: "cruise_sailing_context",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "lastfrontiershoreexcursions",
          canonical_domain: "lastfrontiershoreexcursions.com",
          journey_id: "alaska-excursions-to-cruise-promenade",
          relationship_type: "multi_port_cruise_plan_return",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "juneauflightdeck",
          canonical_domain: "juneauflightdeck.com",
          journey_id: "juneau-flight-deck-to-cruise-promenade",
          relationship_type: "multi_port_cruise_plan_return",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "welcometoneworleanstours",
          canonical_domain: "welcometoneworleanstours.com",
          journey_id: "wno-to-cruise-promenade",
          relationship_type: "pre_post_cruise_port_plan_return",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "welcometotheswamp",
          canonical_domain: "welcometotheswamp.com",
          journey_id: "swamp-to-cruise-promenade",
          relationship_type: "pre_post_cruise_port_plan_return",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "lastfrontiershoreexcursions",
          canonical_domain: "lastfrontiershoreexcursions.com",
          journey_id: "cruise-promenade-to-last-frontier",
          relationship_type: "alaska_port_window_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "juneauflightdeck",
          canonical_domain: "juneauflightdeck.com",
          journey_id: "cruise-promenade-to-juneau-flight-deck",
          relationship_type: "juneau_aviation_window_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "welcometoneworleanstours",
          canonical_domain: "welcometoneworleanstours.com",
          journey_id: "cruise-promenade-to-wno",
          relationship_type: "new_orleans_port_day_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "welcometotheswamp",
          canonical_domain: "welcometotheswamp.com",
          journey_id: "cruise-promenade-to-swamp",
          relationship_type: "new_orleans_swamp_window_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "vibearoundtown",
          canonical_domain: "vibearoundtown.com",
          journey_id: "cruise-promenade-to-vibe-around",
          relationship_type: "supported_port_private_driver_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "cp-gyg-affiliate",
        provider: "getyourguide",
        attribution_parameter: "partner_id,cmp",
        outcome_reporting: "click_level_only",
        notes: "GetYourGuide integration provides click-level attribution only (partner_id=F2MMUUH + cmp); booking, revenue, and commission reconciliation remain unknown unless a documented provider reporting feed carries handoff_id.",
      },
      {
        channel_id: "cp-viator-affiliate",
        provider: "viator",
        attribution_parameter: "pid,mcid,campaign",
        outcome_reporting: "modified_since_poller",
        notes: "Viator affiliate deep-link parameters.",
      },
    ],
    context_support: {
      mode: "both",
      supports_private_trip_context: true,
      supports_public_shared_plans: true,
      cookie_name: "cp_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "lastfrontiershoreexcursions",
    site_name: "Last Frontier Shore Excursions",
    canonical_domains: ["lastfrontiershoreexcursions.com", "www.lastfrontiershoreexcursions.com"],
    aliases: ["lastfrontier", "last-frontier-shore-excursions", "dcc:site:last-frontier-shore-excursions"],
    consumer_role:
      "Southeast Alaska multi-port shore excursion comparison, port-window safety qualification, and provider/specialist handoff surface",
    dcc_universe_ids: [
      "univ:alaska-shore-excursions:0.3.0",
      "univ:juneau-helicopter-tours:0.3.0",
    ],
    accepted_context_fields: [
      "contextId",
      "portSlug",
      "date",
      "arrival",
      "departure",
      "partySize",
      "shipSlug",
      "bufferMinutes",
    ],
    emitted_context_fields: [
      "contextId",
      "portSlug",
      "date",
      "arrival",
      "departure",
      "partySize",
      "shipSlug",
      "targetIntent",
      "bufferMinutes",
    ],
    booking_authority: {
      primary: "viator_affiliate",
      supported_authorities: [
        "viator_affiliate",
        "getyourguide_affiliate",
        "fareharbor",
        "direct_provider",
      ],
      takes_direct_payment: false,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "Last Frontier Shore Excursions qualifies Alaska port timing and refers travelers to Juneau Flight Deck or external providers (Viator, GetYourGuide, FareHarbor) where checkout is finalized.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "cruise-promenade-to-last-frontier",
          relationship_type: "alaska_cruise_port_window",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "juneauflightdeck",
          canonical_domain: "juneauflightdeck.com",
          journey_id: "juneau-flight-deck-to-last-frontier",
          relationship_type: "multi_port_alaska_comparison",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "juneauflightdeck",
          canonical_domain: "juneauflightdeck.com",
          journey_id: "last-frontier-to-juneau-flight-deck",
          relationship_type: "juneau_helicopter_specialist_qualification",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "alaska-excursions-to-cruise-promenade",
          relationship_type: "return_to_cruise_planner",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "lfse-viator-affiliate",
        provider: "viator",
        attribution_parameter: "pid,mcid,campaign",
        outcome_reporting: "modified_since_poller",
        notes: "Viator affiliate account P00281144 with campaign handoff tracking.",
      },
      {
        channel_id: "lfse-gyg-affiliate",
        provider: "getyourguide",
        attribution_parameter: "partner_id,cmp",
        outcome_reporting: "click_level_only",
        notes: "GetYourGuide partner_id=F2MMUUH click-level attribution only.",
      },
      {
        channel_id: "lfse-fareharbor-affiliate",
        provider: "fareharbor",
        attribution_parameter: "asn,ref",
        outcome_reporting: "click_level_only",
        notes: "FareHarbor ASN referral via asn and ref parameters.",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "lfse_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "juneauflightdeck",
    site_name: "Juneau Flight Deck",
    canonical_domains: ["juneauflightdeck.com", "www.juneauflightdeck.com"],
    aliases: ["juneau-flight-deck", "jfd", "dcc:site:juneau-flight-deck"],
    consumer_role:
      "Specialist Juneau helicopter, glacier-landing, and floatplane qualification and operator/affiliate handoff surface",
    dcc_universe_ids: ["univ:juneau-helicopter-tours:0.3.0"],
    accepted_context_fields: [
      "contextId",
      "portSlug",
      "date",
      "arrival",
      "departure",
      "partySize",
      "shipSlug",
      "bufferMinutes",
    ],
    emitted_context_fields: [
      "contextId",
      "portSlug",
      "date",
      "partySize",
      "shipSlug",
      "bufferMinutes",
      "latestSafeReturnTime",
    ],
    booking_authority: {
      primary: "viator_affiliate",
      supported_authorities: [
        "viator_affiliate",
        "fareharbor",
        "direct_provider",
      ],
      takes_direct_payment: false,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "Juneau Flight Deck qualifies Juneau aviation windows and refers travelers to Part 135 operators or Viator/FareHarbor checkout where weight rules, weather dispatch, and payment are finalized.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "cruise-promenade-to-juneau-flight-deck",
          relationship_type: "juneau_port_aviation_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "lastfrontiershoreexcursions",
          canonical_domain: "lastfrontiershoreexcursions.com",
          journey_id: "last-frontier-to-juneau-flight-deck",
          relationship_type: "juneau_helicopter_qualification",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "lastfrontiershoreexcursions",
          canonical_domain: "lastfrontiershoreexcursions.com",
          journey_id: "juneau-flight-deck-to-last-frontier",
          relationship_type: "other_alaska_ports_comparison",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "juneau-flight-deck-to-cruise-promenade",
          relationship_type: "return_to_cruise_planner",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "jfd-viator-affiliate",
        provider: "viator",
        attribution_parameter: "pid,mcid,campaign",
        outcome_reporting: "modified_since_poller",
        notes: "Viator affiliate account P00058396 with campaign__handoffId tracking.",
      },
      {
        channel_id: "jfd-fareharbor-affiliate",
        provider: "fareharbor",
        attribution_parameter: "asn,ref",
        outcome_reporting: "click_level_only",
        notes: "FareHarbor ASN referral via asn and ref parameters.",
      },
      {
        channel_id: "jfd-direct-operator",
        provider: "direct_provider",
        attribution_parameter: "dcc_handoff_id,utm_campaign",
        outcome_reporting: "click_level_only",
        notes: "Direct Part 135 operator referral (e.g. TEMSCO, Coastal Helicopters).",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "jfd_checkout_session",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "welcometoneworleanstours",
    site_name: "Welcome to New Orleans Tours",
    canonical_domains: ["welcometoneworleanstours.com", "www.welcometoneworleanstours.com"],
    aliases: ["wno", "wno-tours", "dcc:site:wno-tours"],
    consumer_role:
      "New Orleans city tour, French Quarter walking tour, and cultural experience recommendation surface with natural bayou/swamp tour handoff",
    dcc_universe_ids: [
      "univ:new-orleans-city-tours:0.3.0",
      "univ:new-orleans-swamp-tours:0.3.0",
    ],
    accepted_context_fields: [
      "contextId",
      "portSlug",
      "date",
      "arrival",
      "departure",
      "partySize",
      "shipSlug",
    ],
    emitted_context_fields: [
      "contextId",
      "portSlug",
      "date",
      "partySize",
      "shipSlug",
      "targetIntent",
    ],
    booking_authority: {
      primary: "viator_affiliate",
      supported_authorities: [
        "viator_affiliate",
        "getyourguide_affiliate",
        "fareharbor",
        "rezdy",
        "direct_provider",
      ],
      takes_direct_payment: false,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "Welcome to New Orleans Tours curates New Orleans city experiences and refers travelers to Welcome to the Swamp or operator/affiliate checkouts where reservations are finalized.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "cruise-promenade-to-wno",
          relationship_type: "new_orleans_cruise_port_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "welcometotheswamp",
          canonical_domain: "welcometotheswamp.com",
          journey_id: "swamp-to-wno",
          relationship_type: "french_quarter_and_city_pairing",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "welcometotheswamp",
          canonical_domain: "welcometotheswamp.com",
          journey_id: "wno-to-swamp",
          relationship_type: "new_orleans_swamp_specialist_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "wno-to-cruise-promenade",
          relationship_type: "return_to_cruise_planner",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "wno-viator-affiliate",
        provider: "viator",
        attribution_parameter: "pid,mcid,campaign",
        outcome_reporting: "modified_since_poller",
        notes: "Viator affiliate P00058396 with campaign__handoffId tracking.",
      },
      {
        channel_id: "wno-gyg-affiliate",
        provider: "getyourguide",
        attribution_parameter: "partner_id,cmp",
        outcome_reporting: "click_level_only",
        notes: "GetYourGuide partner_id=F2MMUUH click-level attribution only.",
      },
      {
        channel_id: "wno-fareharbor-affiliate",
        provider: "fareharbor",
        attribution_parameter: "asn,ref",
        outcome_reporting: "click_level_only",
        notes: "FareHarbor ASN=aktourcenter referral.",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "wtno_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "welcometotheswamp",
    site_name: "Welcome to the Swamp",
    canonical_domains: ["welcometotheswamp.com", "www.welcometotheswamp.com"],
    aliases: ["welcome-to-the-swamp", "wts", "dcc:site:welcome-to-the-swamp"],
    consumer_role:
      "Specialist Louisiana bayou, airboat, and covered swamp-boat comparison, child-age/pickup qualification, and operator/affiliate handoff surface",
    dcc_universe_ids: ["univ:new-orleans-swamp-tours:0.3.0"],
    accepted_context_fields: [
      "contextId",
      "portSlug",
      "date",
      "arrival",
      "departure",
      "partySize",
      "shipSlug",
    ],
    emitted_context_fields: [
      "contextId",
      "portSlug",
      "date",
      "partySize",
      "targetIntent",
    ],
    booking_authority: {
      primary: "fareharbor",
      supported_authorities: [
        "fareharbor",
        "viator_affiliate",
        "getyourguide_affiliate",
        "rezdy",
        "direct_provider",
      ],
      takes_direct_payment: false,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "Welcome to the Swamp compares airboat and covered-boat departures and refers travelers to FareHarbor, Viator, GetYourGuide, or direct bayou operators where bookings are finalized.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "welcometoneworleanstours",
          canonical_domain: "welcometoneworleanstours.com",
          journey_id: "wno-to-swamp",
          relationship_type: "city_to_swamp_specialist_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "cruise-promenade-to-swamp",
          relationship_type: "new_orleans_port_swamp_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "welcometoneworleanstours",
          canonical_domain: "welcometoneworleanstours.com",
          journey_id: "swamp-to-wno",
          relationship_type: "return_to_new_orleans_city_tours",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "swamp-to-cruise-promenade",
          relationship_type: "return_to_cruise_planner",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "wts-fareharbor-affiliate",
        provider: "fareharbor",
        attribution_parameter: "asn,ref",
        outcome_reporting: "click_level_only",
        notes: "FareHarbor ASN=aktourcenter with ref__handoffId tracking.",
      },
      {
        channel_id: "wts-viator-affiliate",
        provider: "viator",
        attribution_parameter: "pid,mcid,campaign",
        outcome_reporting: "modified_since_poller",
        notes: "Viator affiliate P00058396 with campaign__handoffId tracking.",
      },
      {
        channel_id: "wts-gyg-affiliate",
        provider: "getyourguide",
        attribution_parameter: "partner_id,cmp",
        outcome_reporting: "click_level_only",
        notes: "GetYourGuide partner_id=F2MMUUH click-level attribution only.",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "wts_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "vibearoundtown",
    site_name: "Vibing Around Tour Co.",
    canonical_domains: ["vibearoundtown.com", "www.vibearoundtown.com"],
    aliases: ["vibe-around-town", "vibing-around", "dcc:site:vibe-around-town"],
    consumer_role:
      "Private local-driver request, driver-acceptance, and custom island/port excursion marketplace where supported",
    dcc_universe_ids: ["univ:cruise-port-private-drivers:0.3.0"],
    accepted_context_fields: [
      "contextId",
      "shipSlug",
      "sailingDate",
      "portSlug",
      "portDate",
      "arrivalTime",
      "departureTime",
      "partySize",
      "island",
    ],
    emitted_context_fields: [
      "contextId",
      "portSlug",
      "portDate",
      "partySize",
      "driverRequestState",
    ],
    booking_authority: {
      primary: "request_only",
      supported_authorities: ["request_only", "direct_provider"],
      takes_direct_payment: true,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "A reservation request on Vibing Around Tour Co. is not final until a local driver accepts; the traveler explicitly reviews and confirms on vibearoundtown.com.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "cruise-promenade-to-vibe-around",
          relationship_type: "supported_port_private_driver_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "cruisepromenade",
          canonical_domain: "cruisepromenade.com",
          journey_id: "vibe-around-to-cruise-promenade",
          relationship_type: "return_to_cruise_planner",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "vibe-driver-request",
        provider: "request_only",
        attribution_parameter: "dcc_handoff_id",
        outcome_reporting: "request_or_inquiry_only",
        notes: "Private driver request flow; reservation is contingent on explicit driver acceptance.",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "vat_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "gosno",
    site_name: "GoSno",
    canonical_domains: ["gosno.co", "www.gosno.co"],
    aliases: ["gosno-production", "bigsky-gosno", "dcc:site:gosno"],
    consumer_role:
      "Colorado and Big Sky private airport-to-mountain SUV transportation operator with prefilled proposed-trip review and human-confirmed Square checkout boundary",
    dcc_universe_ids: ["univ:colorado-mountain-transfers:0.3.0"],
    accepted_context_fields: [
      "contextId",
      "routeSlug",
      "serviceDate",
      "pickupTime",
      "partySize",
      "tripType",
      "partnerId",
    ],
    emitted_context_fields: [
      "contextId",
      "routeSlug",
      "serviceDate",
      "partySize",
      "quoteReviewState",
    ],
    booking_authority: {
      primary: "direct_provider",
      supported_authorities: ["direct_provider"],
      takes_direct_payment: true,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "AI or approved concierge partners may prefill a proposed trip on GoSno, but current price and availability are revalidated and the traveler must explicitly confirm through GoSno's existing checkout.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "approved_ai_concierge_partner",
          canonical_domain: "destinationcommandcenter.com",
          journey_id: "ai-concierge-to-gosno-review",
          relationship_type: "prefilled_proposed_trip_review",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "420friendlyairportpickup",
          canonical_domain: "420friendlyairportpickup.com",
          journey_id: "420-airport-to-gosno-mountain-transfer",
          relationship_type: "denver_airport_to_mountain_corridor",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "destinationcommandcenter",
          canonical_domain: "destinationcommandcenter.com",
          journey_id: "gosno-to-dcc-corridor",
          relationship_type: "colorado_corridor_intelligence",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "gosno-direct-square-checkout",
        provider: "square",
        attribution_parameter: "gosno_partner_ref,dcc_handoff_id",
        outcome_reporting: "direct_checkout_boundary",
        notes: "Approved partner cookie (gosno_partner_ref) records referral attribution only (no login, reporting, or payout privileges); payment and booking occur strictly at traveler-confirmed checkout.",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "gosno_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "feastlyspread",
    site_name: "FeastlySpread",
    canonical_domains: ["feastlyspread.com", "www.feastlyspread.com"],
    aliases: ["feastly", "feastly-spread", "v0-feastlyspread", "dcc:site:feastly-spread"],
    consumer_role:
      "Vacation-rental group catering spread platform distinguishing 2 existing booking path markets (Wisconsin Dells, Door County) from 16 coverage-request expansion markets",
    dcc_universe_ids: ["univ:vacation-rental-catering-spreads:0.3.0"],
    accepted_context_fields: [
      "contextId",
      "marketSlug",
      "serviceDate",
      "partySize",
      "propertyManagerRef",
    ],
    emitted_context_fields: [
      "contextId",
      "marketSlug",
      "marketStatus",
      "serviceDate",
      "partySize",
    ],
    booking_authority: {
      primary: "direct_provider",
      supported_authorities: ["direct_provider", "inquiry_only"],
      takes_direct_payment: true,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "Markets with an existing booking path (Wisconsin Dells, Door County) support direct package ordering on FeastlySpread; the 16 coverage-request markets accept non-binding market coverage inquiries only and never imply confirmed fulfillment.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "destinationcommandcenter",
          canonical_domain: "destinationcommandcenter.com",
          journey_id: "destination-context-to-feastly",
          relationship_type: "property_manager_or_destination_catering_context",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "brinkberry",
          canonical_domain: "brinkberry.com",
          journey_id: "brinkberry-to-feastly",
          relationship_type: "wisconsin_group_stay_catering_context",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "destinationcommandcenter",
          canonical_domain: "destinationcommandcenter.com",
          journey_id: "feastly-to-dcc",
          relationship_type: "destination_context_return",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "feastly-existing-booking-path-checkout",
        provider: "direct_provider",
        attribution_parameter: "dcc_handoff_id,market",
        outcome_reporting: "direct_checkout_boundary",
        notes: "Available only in markets with an existing booking path (wisconsin-dells, door-county).",
      },
      {
        channel_id: "feastly-coverage-request-inquiry",
        provider: "inquiry_only",
        attribution_parameter: "request_market,dcc_handoff_id",
        outcome_reporting: "request_or_inquiry_only",
        notes: "Used across all 16 coverage-request markets; records expansion demand only without taking payment or confirming fulfillment.",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "feastly_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
    market_coverage: {
      existing_booking_path_markets_count: 2,
      coverage_request_markets_count: 16,
      existing_booking_path_markets: FEASTLY_SPREAD_MARKETS.filter(
        (m) => m.status === "existing_booking_path"
      ).map((m) => m.slug),
      coverage_request_markets: FEASTLY_SPREAD_MARKETS.filter(
        (m) => m.status === "coverage_request_market"
      ).map((m) => m.slug),
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "brinkberry",
    site_name: "Brinkberry",
    canonical_domains: ["brinkberry.com", "www.brinkberry.com"],
    aliases: ["dcc:site:brinkberry"],
    consumer_role:
      "Regional events, group-stay, and concert discovery feeder surface connecting travelers to Party at Red Rocks and FeastlySpread where relevant",
    dcc_universe_ids: [
      "univ:red-rocks-concert-shuttle:0.3.0",
      "univ:vacation-rental-catering-spreads:0.3.0",
    ],
    accepted_context_fields: [
      "contextId",
      "destination",
      "eventDate",
      "partySize",
      "venueSlug",
    ],
    emitted_context_fields: [
      "contextId",
      "destination",
      "eventDate",
      "partySize",
      "venueSlug",
      "targetIntent",
    ],
    booking_authority: {
      primary: "inquiry_only",
      supported_authorities: ["inquiry_only", "direct_provider"],
      takes_direct_payment: false,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "Brinkberry is a discovery and trip-context feeder property; concert transportation or catering orders are finalized on the target operator surface.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "destinationcommandcenter",
          canonical_domain: "destinationcommandcenter.com",
          journey_id: "dcc-to-brinkberry",
          relationship_type: "regional_event_discovery",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "partyatredrocks",
          canonical_domain: "partyatredrocks.com",
          journey_id: "brinkberry-to-party-at-red-rocks",
          relationship_type: "red_rocks_concert_transportation_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "feastlyspread",
          canonical_domain: "feastlyspread.com",
          journey_id: "brinkberry-to-feastly",
          relationship_type: "group_stay_catering_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "brinkberry-parr-handoff",
        provider: "direct_provider",
        attribution_parameter: "dcc_handoff_id,utm_campaign",
        outcome_reporting: "click_level_only",
        notes: "Contextual handoff to Party at Red Rocks for Red Rocks concert nights.",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "brinkberry_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "partyatredrocks",
    site_name: "Party at Red Rocks",
    canonical_domains: ["partyatredrocks.com", "www.partyatredrocks.com"],
    aliases: ["parr", "party-at-red-rocks", "dcc:site:party-at-red-rocks"],
    consumer_role:
      "Red Rocks Amphitheatre concert transportation surface receiving event/date/party context from Brinkberry and DCC (strictly excluded from UI-less holds or autonomous booking pending inventory/payment authority audit)",
    dcc_universe_ids: ["univ:red-rocks-concert-shuttle:0.3.0"],
    accepted_context_fields: [
      "contextId",
      "eventDate",
      "partySize",
      "venueSlug",
      "pickupZone",
    ],
    emitted_context_fields: [
      "contextId",
      "eventDate",
      "partySize",
      "vehicleType",
    ],
    booking_authority: {
      primary: "direct_provider",
      supported_authorities: ["direct_provider"],
      takes_direct_payment: true,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "Party at Red Rocks accepts traveler-confirmed web reservations only; it is excluded from UI-less holds or agentic booking until inventory ownership, provider acceptance, payment, cancellation, and refund authority are audited.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "brinkberry",
          canonical_domain: "brinkberry.com",
          journey_id: "brinkberry-to-party-at-red-rocks",
          relationship_type: "red_rocks_concert_transportation_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
        {
          site_id: "destinationcommandcenter",
          canonical_domain: "destinationcommandcenter.com",
          journey_id: "dcc-to-party-at-red-rocks",
          relationship_type: "red_rocks_corridor_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "destinationcommandcenter",
          canonical_domain: "destinationcommandcenter.com",
          journey_id: "party-at-red-rocks-to-dcc",
          relationship_type: "red_rocks_venue_intelligence",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "parr-direct-checkout",
        provider: "direct_provider",
        attribution_parameter: "dcc_handoff_id,utm_campaign",
        outcome_reporting: "direct_checkout_boundary",
        notes: "Human-confirmed checkout on partyatredrocks.com; no UI-less holds or autonomous execution.",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "parr_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
  {
    schema: DCC_SITE_MANIFEST_SCHEMA,
    version: DCC_SITE_MANIFEST_VERSION,
    site_id: "420friendlyairportpickup",
    site_name: "420 Friendly Airport Pickup",
    canonical_domains: ["420friendlyairportpickup.com", "www.420friendlyairportpickup.com"],
    aliases: [
      "420-airport-pickup",
      "420-friendly-airport-pickup",
      "dcc:site:420-friendly-airport-pickup",
    ],
    consumer_role:
      "Colorado airport-transfer discovery property with optional dispensary-stop trip context routing into private mountain/city operator checkout",
    dcc_universe_ids: [
      "univ:denver-420-airport-transfers:0.3.0",
      "univ:colorado-mountain-transfers:0.3.0",
    ],
    accepted_context_fields: [
      "contextId",
      "airportCode",
      "destination",
      "serviceDate",
      "partySize",
      "dispensaryStopRequested",
    ],
    emitted_context_fields: [
      "contextId",
      "airportCode",
      "destination",
      "serviceDate",
      "partySize",
      "dispensaryStopRequested",
    ],
    booking_authority: {
      primary: "direct_provider",
      supported_authorities: ["direct_provider", "inquiry_only"],
      takes_direct_payment: false,
      autonomous_booking_enabled: false,
      decision_authorization_mode: "shadow_only_no_side_effects",
      universal_multi_provider_checkout: false,
      finality_statement:
        "420 Friendly Airport Pickup qualifies Denver/Colorado Springs airport transfer options with dispensary-stop context and routes travelers to operator checkout (such as GoSno) to finalize booking and payment.",
    },
    natural_relationships: {
      inbound: [
        {
          site_id: "destinationcommandcenter",
          canonical_domain: "destinationcommandcenter.com",
          journey_id: "dcc-to-420-airport-pickup",
          relationship_type: "denver_airport_transfer_discovery",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
      outbound: [
        {
          site_id: "gosno",
          canonical_domain: "gosno.co",
          journey_id: "420-airport-to-gosno-mountain-transfer",
          relationship_type: "private_suv_operator_handoff",
          context_exchange: "opaque_dcc_ctx",
        },
      ],
    },
    commercial_channels: [
      {
        channel_id: "420-to-gosno-operator-handoff",
        provider: "direct_provider",
        attribution_parameter: "dcc_handoff_id,utm_campaign",
        outcome_reporting: "direct_checkout_boundary",
        notes: "Routes qualified airport transfer context to GoSno checkout boundary.",
      },
    ],
    context_support: {
      mode: "private_trip_context",
      supports_private_trip_context: true,
      supports_public_shared_plans: false,
      cookie_name: "ap420_trip_ctx",
      cookie_flags: "Secure; HttpOnly; SameSite=Lax",
      strips_token_from_url: true,
      url_pii_forbidden: true,
      forbidden_url_fields: FORBIDDEN_URL_PII_FIELDS,
    },
    privacy_and_security: {
      exposes_secrets: false,
      exposes_customer_information: false,
      exposes_private_evidence: false,
      exposes_commission_terms: false,
    },
  },
] as const;

export function normalizeSiteIdentifier(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split(":")[0];
}

export function isExcludedPortfolioSite(siteIdOrDomain: string): boolean {
  if (!siteIdOrDomain) return false;
  const raw = siteIdOrDomain.trim().toLowerCase();
  const normalized = normalizeSiteIdentifier(siteIdOrDomain);
  return DCC_EXCLUDED_PORTFOLIO_SITES.some(
    (entry) =>
      entry.site_id === raw ||
      entry.site_id === normalized ||
      entry.canonical_domains.some((d) => d.toLowerCase() === raw || d.toLowerCase() === normalized) ||
      entry.aliases.some((a) => a.toLowerCase() === raw || a.toLowerCase() === normalized)
  );
}

export function getDccSiteManifestV1(siteIdOrDomain: string): DccSiteManifestV1 | null {
  if (!siteIdOrDomain || isExcludedPortfolioSite(siteIdOrDomain)) {
    return null;
  }
  const raw = siteIdOrDomain.trim().toLowerCase();
  const normalized = normalizeSiteIdentifier(siteIdOrDomain);
  return (
    DCC_PORTFOLIO_NETWORK_SITES.find(
      (site) =>
        site.site_id === raw ||
        site.site_id === normalized ||
        site.canonical_domains.some(
          (d) => d.toLowerCase() === raw || d.toLowerCase().replace(/^www\./, "") === normalized
        ) ||
        site.aliases.some((a) => a.toLowerCase() === raw || a.toLowerCase() === normalized)
    ) || null
  );
}

export function isParticipatingPortfolioSite(siteIdOrDomain: string): boolean {
  return getDccSiteManifestV1(siteIdOrDomain) !== null;
}

export function validateUrlFreeOfPersonalData(urlInput: string | URL): {
  valid: boolean;
  violatingParams: string[];
} {
  let url: URL;
  try {
    url = typeof urlInput === "string" ? new URL(urlInput, "https://destinationcommandcenter.com") : urlInput;
  } catch {
    return { valid: false, violatingParams: ["invalid_url"] };
  }

  const violatingParams: string[] = [];
  const forbiddenSet = new Set<string>(FORBIDDEN_URL_PII_FIELDS);
  for (const [key] of url.searchParams.entries()) {
    const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (forbiddenSet.has(normalizedKey) || forbiddenSet.has(key.trim().toLowerCase())) {
      violatingParams.push(key);
    }
  }

  return {
    valid: violatingParams.length === 0,
    violatingParams,
  };
}
