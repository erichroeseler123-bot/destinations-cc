import { DCC_SAFETY_PROFILES } from "./context/registry";
import {
  getDccSiteManifestV1,
  validateUrlFreeOfPersonalData,
  type DccPortfolioSiteId,
} from "./portfolioNetworkRegistry";
import {
  PARTNER_SHARE_LINKS,
  type PartnerRole,
  resolvePartnerAttributionFromParams,
} from "./partnerShareLinks";
import {
  DCC_TRAVELER_CONTEXT_PARAM,
  buildDccTravelerContextParam,
  readDccTravelerContextFromUrl,
  type DccTravelerContextV1,
} from "./travelerContext";
import { rfc8785Canonicalize, sha256HexFull } from "./machine/v03/rfc8785AndJws";

export type SharedMarketId = "new-orleans" | "juneau" | "red-rocks" | "gosno";

export interface MarketResponsibilityDccAuthority {
  canonicalHubPath: string;
  canonicalHubUrl: string;
  feederPaths: string[];
  primaryTravelerQuestions: string[];
  verifiedEvidenceSources: string[];
  evidenceEvaluatorSymbol: string;
  safetyProfileKey: keyof typeof DCC_SAFETY_PROFILES;
  safetyBufferFloorMinutes: number;
  safetyBufferSummary: string;
}

export interface MarketResponsibilityPartnerAndRecovery {
  partnerShareLinkIds: string[];
  supportedPartnerRoles: PartnerRole[];
  disruptionTriggerParams: string[];
  liveRecoveryEvaluatorSymbol: string;
  recoverySummary: string;
}

export interface MarketResponsibilityStorefrontSurface {
  primarySiteId: DccPortfolioSiteId;
  primaryStorefrontName: string;
  primaryStorefrontDomain: string;
  primaryStorefrontEntryUrl: string;
  secondaryStorefrontDomains: string[];
  continuityCookieName: string;
  acceptedUrlParams: string[];
  emittedFitBadges: string[];
  optionNarrowingAxes: string[];
}

export interface MarketResponsibilityCheckoutAndLedger {
  monetizationModel: "partner_commission" | "owned_operated";
  primaryBookingAuthority: string;
  secondaryBookingAuthority: string;
  activeDirectCheckoutOperatorIds: string[];
  activeStorefrontOfferCodes: string[];
  supports15MinuteHold: boolean;
  ledgerStageTracking: readonly [
    "dcc_visit",
    "storefront_referral",
    "booking_requested_or_hold",
    "confirmed_booking",
    "revenue_or_commission_settled",
  ];
}

export interface SecondPurchasePathSpec {
  id: string;
  label: string;
  relationship: "same_market_companion" | "cross_site_network";
  targetMarket: SharedMarketId | "cruise-ports";
  targetSiteId: DccPortfolioSiteId;
  targetDomain: string;
  baseUrl: string;
  whyItFitsNext: string;
  reusedTripFields: Array<
    | "contextId"
    | "date"
    | "partySize"
    | "pickupHub"
    | "shipName"
    | "berthCode"
    | "allAboard"
    | "skiBags"
    | "partnerId"
  >;
}

export interface SharedMarketTemplateConfig {
  marketId: SharedMarketId;
  marketLabel: string;
  corridorId: string;
  /** Responsibility 1: Public Authority & Demand Entry (DCC) */
  dccAuthority: MarketResponsibilityDccAuthority;
  /** Responsibility 2: Partner Referral & Dock/Weather Recovery */
  partnerAndRecovery: MarketResponsibilityPartnerAndRecovery;
  /** Responsibility 3: Specialist Storefront & Option Narrowing */
  storefrontSurface: MarketResponsibilityStorefrontSurface;
  /** Responsibility 4: Controlling Booking, Checkout Execution & Ledger Attribution */
  checkoutAndLedger: MarketResponsibilityCheckoutAndLedger;
  /** Responsibility 5: Cross-Site Portable Trip Details & Second-Purchase Continuation */
  secondPurchasePaths: SecondPurchasePathSpec[];
}

export const SHARED_MARKET_TEMPLATES: Record<
  SharedMarketId,
  SharedMarketTemplateConfig
> = {
  "new-orleans": {
    marketId: "new-orleans",
    marketLabel: "New Orleans (Swamp, Bayou, Plantation & French Quarter)",
    corridorId: "new-orleans-swamp-tours",
    dccAuthority: {
      canonicalHubPath: "/new-orleans/swamp-tours",
      canonicalHubUrl:
        "https://www.destinationcommandcenter.com/new-orleans/swamp-tours",
      feederPaths: [
        "/new-orleans/tours",
        "/new-orleans/swamp-tours/airboat-vs-boat",
        "/new-orleans/swamp-tours/transportation",
        "/new-orleans/swamp-tours/best-time",
        "/new-orleans/swamp-tours/with-kids",
        "/new-orleans/swamp-tours/worth-it",
      ],
      primaryTravelerQuestions: [
        "Airboat vs. covered bayou boat for my group and mobility?",
        "Which swamp or plantation tour includes French Quarter hotel pickup vs. self-drive?",
        "Can we fit a bayou or city tour before our Port of New Orleans cruise embarkation/debarkation cutoff?",
      ],
      verifiedEvidenceSources: [
        "NWS New Orleans/Baton Rouge (LIX) flood warnings & Barataria/Jean Lafitte USGS gauge water levels",
        "French Quarter / CBD hotel shuttle pickup radius vs. Marrero / Lafitte / Manchac drive-time table",
        "Port of New Orleans Erato/Julia Street terminal transfer buffer (45m floor)",
      ],
      evidenceEvaluatorSymbol: "evaluateNolaBayouConditions",
      safetyProfileKey: "new-orleans",
      safetyBufferFloorMinutes: DCC_SAFETY_PROFILES["new-orleans"].defaultBufferMinutes,
      safetyBufferSummary:
        "45-minute French Quarter / Port of New Orleans embarkation & pickup return buffer floor.",
    },
    partnerAndRecovery: {
      partnerShareLinkIds: PARTNER_SHARE_LINKS.filter(
        (l) => l.market === "new-orleans",
      ).map((l) => l.id),
      supportedPartnerRoles: ["hotel_concierge", "cruise_planner"],
      disruptionTriggerParams: ["flood_check", "basin", "partner", "partner_role"],
      liveRecoveryEvaluatorSymbol: "evaluateNolaBayouConditions",
      recoverySummary:
        "Flags affected Barataria/Atchafalaya/Honey Island bayou departures under NWS LIX flood advisories and pivots guests to covered flat-bottom vessels or French Quarter city/plantation departures.",
    },
    storefrontSurface: {
      primarySiteId: "welcometoneworleanstours",
      primaryStorefrontName: "Welcome to New Orleans Tours (WNO)",
      primaryStorefrontDomain: "www.welcometoneworleanstours.com",
      primaryStorefrontEntryUrl:
        "https://www.welcometoneworleanstours.com/swamp-tours",
      secondaryStorefrontDomains: [
        "www.welcometotheswamp.com",
        "www.cruisepromenade.com",
      ],
      continuityCookieName:
        getDccSiteManifestV1("welcometoneworleanstours")!.context_support.cookie_name,
      acceptedUrlParams: [
        "ctx",
        "dcc_ctx",
        "date",
        "party_size",
        "adults",
        "pickup",
        "pickupHub",
        "ship",
        "berth",
        "all_aboard",
        "partner",
        "partner_role",
        "completed_leg",
        "purchase_step",
      ],
      emittedFitBadges: [
        "Fits cruise window",
        "Confirm ship timing",
        "Operator check required — NWS flood / water-level advisory",
        "French Quarter Hotel Pickup Included",
      ],
      optionNarrowingAxes: [
        "Vessel type (covered flat-bottom boat vs. small/large high-speed airboat)",
        "Pickup logistics (French Quarter shuttle vs. self-drive)",
        "Port of New Orleans embarkation/debarkation window",
      ],
    },
    checkoutAndLedger: {
      monetizationModel: "partner_commission",
      primaryBookingAuthority: "FAREHARBOR_ASN_EMBED",
      secondaryBookingAuthority: "VIATOR_PARTNER_CHECKOUT",
      activeDirectCheckoutOperatorIds: [
        "gray-line-new-orleans",
        "ragin-cajun-tours",
        "southern-style-tours",
      ],
      activeStorefrontOfferCodes: [
        "15200P6",
        "swamp-bayou-tour",
        "covered-tour-boat",
        "ragin-cajun-airboat-options",
        "city-tour-of-new-orleans",
        "oak-alley-or-laura-plantation-tour",
        "evening-jazz-cruise",
      ],
      supports15MinuteHold: true,
      ledgerStageTracking: [
        "dcc_visit",
        "storefront_referral",
        "booking_requested_or_hold",
        "confirmed_booking",
        "revenue_or_commission_settled",
      ],
    },
    secondPurchasePaths: [
      {
        id: "nola-second-plantation-or-city",
        label: "Add Oak Alley Plantation or French Quarter City Tour (Purchase #2)",
        relationship: "same_market_companion",
        targetMarket: "new-orleans",
        targetSiteId: "welcometoneworleanstours",
        targetDomain: "www.welcometoneworleanstours.com",
        baseUrl:
          "https://www.welcometoneworleanstours.com/tours/oak-alley-or-laura-plantation-tour",
        whyItFitsNext:
          "Reuses your New Orleans date, party size, and French Quarter hotel pickup so you can pair a morning swamp tour with a plantation or city tour.",
        reusedTripFields: ["contextId", "date", "partySize", "pickupHub", "partnerId"],
      },
      {
        id: "nola-second-evening-jazz-cruise",
        label: "Add Steamboat Natchez Evening Jazz Cruise (Purchase #2)",
        relationship: "same_market_companion",
        targetMarket: "new-orleans",
        targetSiteId: "welcometoneworleanstours",
        targetDomain: "www.welcometoneworleanstours.com",
        baseUrl:
          "https://www.welcometoneworleanstours.com/tours/evening-jazz-cruise",
        whyItFitsNext:
          "Carries your date and party size into an evening Mississippi River jazz cruise after your daytime bayou or city tour returns.",
        reusedTripFields: ["contextId", "date", "partySize", "pickupHub", "partnerId"],
      },
      {
        id: "nola-second-cruise-promenade-port-plan",
        label: "Continue to Cruise Promenade Port Schedule & Gangway Planner",
        relationship: "cross_site_network",
        targetMarket: "cruise-ports",
        targetSiteId: "cruisepromenade",
        targetDomain: "www.cruisepromenade.com",
        baseUrl: "https://www.cruisepromenade.com/ports/new-orleans",
        whyItFitsNext:
          "Carries your ship, date, and party size into the multi-port cruise planner for the rest of your sailing.",
        reusedTripFields: [
          "contextId",
          "date",
          "partySize",
          "shipName",
          "berthCode",
          "allAboard",
        ],
      },
    ],
  },

  juneau: {
    marketId: "juneau",
    marketLabel: "Juneau, Alaska (Whale Deck, Helicopter Glacier & Port Window)",
    corridorId: "juneau-shore-excursions",
    dccAuthority: {
      canonicalHubPath: "/juneau/whale-watching-tours",
      canonicalHubUrl:
        "https://www.destinationcommandcenter.com/juneau/whale-watching-tours",
      feederPaths: [
        "/juneau/cruise-excursions-what-to-do",
        "/juneau/what-to-do-if-helicopter-tour-canceled",
        "/cruises/port/juneau-alaska",
      ],
      primaryTravelerQuestions: [
        "Which Juneau whale-watching or glacier tour fits a short 5–6 hour cruise port call with AJ Dock / Franklin Dock shuttle transfers?",
        "What should we book right now when our Juneau helicopter glacier landing is canceled for ceiling/visibility?",
        "How much gangway return buffer is required before our ship's confirmed all-aboard cutoff?",
      ],
      verifiedEvidenceSources: [
        "Published CLAA Juneau port-call calendar + ship-confirmed all-aboard cutoff",
        "Berth-specific transfer math (AJ Dock / Franklin Dock shuttle vs. CT/AS downtown walk + 25m Auke Bay transfer)",
        "Live PAJN (Juneau International Airport) METAR ceiling & visibility observations",
      ],
      evidenceEvaluatorSymbol: "evaluateCruiseTimingWindow",
      safetyProfileKey: "juneau",
      safetyBufferFloorMinutes: DCC_SAFETY_PROFILES.juneau.defaultBufferMinutes,
      safetyBufferSummary:
        "60–90 minute DCC gangway return buffer enforced against CLAA schedule and ship-confirmed all-aboard time.",
    },
    partnerAndRecovery: {
      partnerShareLinkIds: PARTNER_SHARE_LINKS.filter(
        (l) => l.market === "juneau",
      ).map((l) => l.id),
      supportedPartnerRoles: ["cruise_planner", "flight_operator"],
      disruptionTriggerParams: [
        "flight_canceled",
        "cancel_ref",
        "ship",
        "berth",
        "claa_arrival",
        "all_aboard",
      ],
      liveRecoveryEvaluatorSymbol: "evaluateJuneauBackupFlow",
      recoverySummary:
        "Opens the instant Auke Bay Whale Deck backup flow when a traveler selects 'My flight was canceled' (?flight_canceled=1) or a flight desk shares a tracked cancellation link (?cancel_ref=...), preserving ship berth and all-aboard timing.",
    },
    storefrontSurface: {
      primarySiteId: "juneauflightdeck",
      primaryStorefrontName: "Juneau Flight Deck & Alaska Shore Excursions",
      primaryStorefrontDomain: "www.juneauflightdeck.com",
      primaryStorefrontEntryUrl:
        "https://www.juneauflightdeck.com/juneau-whale-watching-tours",
      secondaryStorefrontDomains: [
        "www.lastfrontiershoreexcursions.com",
        "www.cruisepromenade.com",
      ],
      continuityCookieName:
        getDccSiteManifestV1("juneauflightdeck")!.context_support.cookie_name,
      acceptedUrlParams: [
        "ctx",
        "dcc_ctx",
        "date",
        "party_size",
        "adults",
        "ship",
        "berth",
        "claa_arrival",
        "claa_departure",
        "all_aboard",
        "flight_canceled",
        "cancel_ref",
        "partner",
        "partner_role",
        "completed_leg",
        "purchase_step",
      ],
      emittedFitBadges: [
        "Fits cruise window",
        "Confirm ship timing",
        "Outside safe buffer",
        "Booking requested",
        "provider-confirmed seats remaining",
      ],
      optionNarrowingAxes: [
        "Cruise berth transfer math (CT, AS, FKL, AJD)",
        "Confirmed all-aboard cutoff + 60–90m safety buffer",
        "Same-day PAJN weather backup eligibility (surface catamaran vs. VFR helicopter)",
      ],
    },
    checkoutAndLedger: {
      monetizationModel: "partner_commission",
      primaryBookingAuthority: "VIATOR_APPROVED_CHECKOUT",
      secondaryBookingAuthority: "REZGO_TRACKED_CHECKOUT_OR_SEAT_BLOCK",
      activeDirectCheckoutOperatorIds: [
        "alaska-galore-whale-331813P1",
        "juneau-tours-whale-watch",
      ],
      activeStorefrontOfferCodes: [
        "331813P1",
        "466119P3",
        "5857SHUTTLE",
        "juneau-tours-whale-watch",
      ],
      supports15MinuteHold: true,
      ledgerStageTracking: [
        "dcc_visit",
        "storefront_referral",
        "booking_requested_or_hold",
        "confirmed_booking",
        "revenue_or_commission_settled",
      ],
    },
    secondPurchasePaths: [
      {
        id: "juneau-second-mendenhall-shuttle-or-combo",
        label: "Add Mendenhall Glacier Express or Auke Bay Combo (Purchase #2)",
        relationship: "same_market_companion",
        targetMarket: "juneau",
        targetSiteId: "juneauflightdeck",
        targetDomain: "www.juneauflightdeck.com",
        baseUrl:
          "https://www.juneauflightdeck.com/juneau-whale-watching-tours",
        whyItFitsNext:
          "Reuses your ship name, berth code, confirmed all-aboard time, and party size so you can add a glacier shuttle or backup surface departure within your port call.",
        reusedTripFields: [
          "contextId",
          "date",
          "partySize",
          "shipName",
          "berthCode",
          "allAboard",
          "partnerId",
        ],
      },
      {
        id: "juneau-second-alaska-storefront",
        label: "Compare Ketchikan & Skagway Port Excursions on Last Frontier",
        relationship: "cross_site_network",
        targetMarket: "juneau",
        targetSiteId: "lastfrontiershoreexcursions",
        targetDomain: "www.lastfrontiershoreexcursions.com",
        baseUrl:
          "https://www.lastfrontiershoreexcursions.com/juneau-whale-watching-tours",
        whyItFitsNext:
          "Carries your cruise ship and party size across the Alaska storefront for companion port days.",
        reusedTripFields: [
          "contextId",
          "date",
          "partySize",
          "shipName",
          "berthCode",
          "allAboard",
        ],
      },
      {
        id: "juneau-second-cruise-promenade",
        label: "Open Full Alaska Sailing Port Window on Cruise Promenade",
        relationship: "cross_site_network",
        targetMarket: "cruise-ports",
        targetSiteId: "cruisepromenade",
        targetDomain: "www.cruisepromenade.com",
        baseUrl: "https://www.cruisepromenade.com/ports/juneau-alaska",
        whyItFitsNext:
          "Keeps your ship berth and all-aboard window attached while checking other ports on your itinerary.",
        reusedTripFields: [
          "contextId",
          "date",
          "partySize",
          "shipName",
          "berthCode",
          "allAboard",
        ],
      },
    ],
  },

  "red-rocks": {
    marketId: "red-rocks",
    marketLabel: "Red Rocks Amphitheatre (Owned & Operated Concert Transport)",
    corridorId: "red-rocks-transportation",
    dccAuthority: {
      canonicalHubPath: "/red-rocks-transportation",
      canonicalHubUrl:
        "https://www.destinationcommandcenter.com/red-rocks-transportation",
      feederPaths: [
        "/red-rocks-shuttle-vs-uber",
        "/red-rocks-parking",
        "/how-to-get-to-red-rocks-without-a-car",
        "/best-way-to-leave-red-rocks",
        "/red-rocks-tailgating-rules",
      ],
      primaryTravelerQuestions: [
        "Why does Uber/Lyft surge and strand concertgoers at the Jurassic Lot after encore at Red Rocks?",
        "Which Denver / Golden pickup hub guarantees a return seat after the show?",
        "When should we choose a per-seat round-trip shuttle vs. a private Suburban/Sprinter with Upper North Lot access?",
      ],
      verifiedEvidenceSources: [
        "City of Denver Red Rocks Amphitheatre post-encore rideshare lot rules (Jurassic Lot / Lot 2 hike vs. Upper North / Top Circle)",
        "Pre-doors departure buffer (60m minimum before doors/opener)",
        "Guaranteed round-trip seat allocation by Denver/Golden pickup hub",
      ],
      evidenceEvaluatorSymbol: "RED_ROCKS_CORRIDOR_CONFIG",
      safetyProfileKey: "morrison",
      safetyBufferFloorMinutes:
        DCC_SAFETY_PROFILES.morrison.defaultBufferMinutes,
      safetyBufferSummary:
        "60-minute pre-doors arrival buffer plus guaranteed post-encore return staging.",
    },
    partnerAndRecovery: {
      partnerShareLinkIds: PARTNER_SHARE_LINKS.filter(
        (l) => l.market === "colorado-red-rocks",
      ).map((l) => l.id),
      supportedPartnerRoles: ["hotel_concierge"],
      disruptionTriggerParams: ["pickupHub", "event", "artist", "partner", "partner_role"],
      liveRecoveryEvaluatorSymbol: "buildParrHandoffUrl",
      recoverySummary:
        "Allows Denver/Golden hotel concierges to pre-select the nearest pickup hub and show date so guests avoid post-encore rideshare stranding.",
    },
    storefrontSurface: {
      primarySiteId: "partyatredrocks",
      primaryStorefrontName: "Party at Red Rocks (PARR — Owned & Operated)",
      primaryStorefrontDomain: "www.partyatredrocks.com",
      primaryStorefrontEntryUrl: "https://www.partyatredrocks.com/book",
      secondaryStorefrontDomains: ["www.gosno.co"],
      continuityCookieName:
        getDccSiteManifestV1("partyatredrocks")!.context_support.cookie_name,
      acceptedUrlParams: [
        "ctx",
        "dcc_ctx",
        "date",
        "party_size",
        "partySize",
        "qty",
        "pickup",
        "pickupHub",
        "event",
        "artist",
        "venue",
        "partner",
        "partner_role",
        "completed_leg",
        "purchase_step",
      ],
      emittedFitBadges: [
        "Guaranteed Post-Encore Return Seat",
        "60m Pre-Doors Arrival Buffer",
        "Owned & Operated Fleet",
      ],
      optionNarrowingAxes: [
        "Denver downtown vs. Golden pickup hub",
        "Shared per-seat round-trip shuttle ($59) vs. Private SUV/Sprinter charter",
        "Add-on 420-friendly airport pickup or next-day Colorado mountain transfer",
      ],
    },
    checkoutAndLedger: {
      monetizationModel: "owned_operated",
      primaryBookingAuthority: "PARR_STRIPE_DIRECT_CHECKOUT",
      secondaryBookingAuthority: "DCC_V03_OWNED_FLEET_RESERVATION",
      activeDirectCheckoutOperatorIds: ["party-at-red-rocks"],
      activeStorefrontOfferCodes: [
        "parr-shared-shuttle-59",
        "parr-private-suv",
        "parr-sprinter-14",
        "parr-420-airport-pickup",
      ],
      supports15MinuteHold: true,
      ledgerStageTracking: [
        "dcc_visit",
        "storefront_referral",
        "booking_requested_or_hold",
        "confirmed_booking",
        "revenue_or_commission_settled",
      ],
    },
    secondPurchasePaths: [
      {
        id: "red-rocks-second-gosno-mountain-transfer",
        label: "Extend Trip to Vail / Breckenridge / Keystone on GoSno (Purchase #2)",
        relationship: "cross_site_network",
        targetMarket: "gosno",
        targetSiteId: "gosno",
        targetDomain: "www.gosno.co",
        baseUrl: "https://www.gosno.co/book",
        whyItFitsNext:
          "Carries your group size, Colorado travel date, and Denver pickup details directly into GoSno so you can add an I-70 mountain resort transfer without re-entering your trip.",
        reusedTripFields: ["contextId", "date", "partySize", "pickupHub", "partnerId"],
      },
      {
        id: "red-rocks-second-420-airport-pickup",
        label: "Add DEN Airport Pickup + Dispensary Stop on Party at Red Rocks (Purchase #2)",
        relationship: "same_market_companion",
        targetMarket: "red-rocks",
        targetSiteId: "partyatredrocks",
        targetDomain: "www.partyatredrocks.com",
        baseUrl: "https://www.partyatredrocks.com/420-friendly-airport-pickup",
        whyItFitsNext:
          "Reuses your party size and arrival date to add a private Denver International Airport (DEN) pickup before your concert night.",
        reusedTripFields: ["contextId", "date", "partySize", "pickupHub", "partnerId"],
      },
    ],
  },

  gosno: {
    marketId: "gosno",
    marketLabel: "Colorado I-70 Mountain Corridor (GoSno — Owned & Operated)",
    corridorId: "denver-to-mountains",
    dccAuthority: {
      canonicalHubPath: "/transportation/colorado",
      canonicalHubUrl:
        "https://www.destinationcommandcenter.com/transportation/colorado",
      feederPaths: [
        "/transportation/denver-to-vail-shuttle-vs-private-suv",
        "/transportation/denver-to-breckenridge-transportation",
        "/transportation/i-70-traction-law-what-travelers-need-to-know",
      ],
      primaryTravelerQuestions: [
        "How do we get from DEN or Downtown Denver to Vail, Breckenridge, Keystone, or Beaver Creek without renting a 2WD car in an I-70 winter storm?",
        "How many passengers + 180cm ski/snowboard bags actually fit in a 4WD SUV vs. a 14-passenger AWD Sprinter?",
        "Can we stop for groceries & alpine acclimation on the way up I-70?",
      ],
      verifiedEvidenceSources: [
        "CDOT Passenger Vehicle Traction Law (Code 15) & Chain Law (Code 16) compliance rules",
        "Real cargo volume math (passengers + full-length 180cm ski/board bags + checked luggage)",
        "120-minute Eisenhower-Johnson Memorial Tunnel / Vail Pass winter storm & return flight safety buffer",
      ],
      evidenceEvaluatorSymbol: "DENVER_TO_MOUNTAINS_CORRIDOR_CONFIG",
      safetyProfileKey: "vail",
      safetyBufferFloorMinutes:
        DCC_SAFETY_PROFILES.vail.defaultBufferMinutes,
      safetyBufferSummary:
        "120-minute I-70 winter storm & DEN departure check-in buffer floor with AWD/4WD Code 15 compliance.",
    },
    partnerAndRecovery: {
      partnerShareLinkIds: PARTNER_SHARE_LINKS.filter(
        (l) => l.market === "colorado-mountain",
      ).map((l) => l.id),
      supportedPartnerRoles: ["hotel_concierge"],
      disruptionTriggerParams: [
        "ski_bags",
        "origin",
        "destination",
        "vehicleClass",
        "partner",
        "partner_role",
      ],
      liveRecoveryEvaluatorSymbol: "buildGoSnoHandoffUrl",
      recoverySummary:
        "Lets Vail, Breckenridge, and Beaver Creek lodge concierges send guests a pre-sized AWD transfer link when rental cars lack winter traction equipment or ski-bag capacity.",
    },
    storefrontSurface: {
      primarySiteId: "gosno",
      primaryStorefrontName: "GoSno Mountain Transport (Owned & Operated)",
      primaryStorefrontDomain: "www.gosno.co",
      primaryStorefrontEntryUrl: "https://www.gosno.co/book",
      secondaryStorefrontDomains: ["www.partyatredrocks.com"],
      continuityCookieName:
        getDccSiteManifestV1("gosno")!.context_support.cookie_name,
      acceptedUrlParams: [
        "ctx",
        "dcc_ctx",
        "date",
        "party_size",
        "partySize",
        "passengers",
        "passengerCount",
        "pickup",
        "pickupHub",
        "origin",
        "destination",
        "ski_bags",
        "vehicleClass",
        "partner",
        "partner_role",
        "completed_leg",
        "purchase_step",
      ],
      emittedFitBadges: [
        "CDOT Code 15 AWD/4WD Compliant",
        "120m I-70 Winter Corridor Buffer",
        "Full-Length Ski & Board Cargo Verified",
      ],
      optionNarrowingAxes: [
        "Passenger count + full-length ski/snowboard bag count (1–5 pax SUV vs. 6–14 pax AWD Sprinter)",
        "Origin (DEN Airport vs. Denver Union Station / Downtown Hotel) to Resort (Vail, Breckenridge, Keystone, Beaver Creek)",
        "Included grocery & acclimation stop in Morrison/Golden/Frisco",
      ],
    },
    checkoutAndLedger: {
      monetizationModel: "owned_operated",
      primaryBookingAuthority: "GOSNO_STRIPE_DIRECT_CHECKOUT",
      secondaryBookingAuthority: "DCC_V03_OWNED_FLEET_RESERVATION",
      activeDirectCheckoutOperatorIds: ["gosno-mountain-transfer"],
      activeStorefrontOfferCodes: [
        "gosno-private-suv-vail",
        "gosno-private-suv-breck",
        "gosno-awd-sprinter-14",
      ],
      supports15MinuteHold: true,
      ledgerStageTracking: [
        "dcc_visit",
        "storefront_referral",
        "booking_requested_or_hold",
        "confirmed_booking",
        "revenue_or_commission_settled",
      ],
    },
    secondPurchasePaths: [
      {
        id: "gosno-second-red-rocks-shuttle",
        label: "Add Party at Red Rocks Concert Night Shuttle (Purchase #2)",
        relationship: "cross_site_network",
        targetMarket: "red-rocks",
        targetSiteId: "partyatredrocks",
        targetDomain: "www.partyatredrocks.com",
        baseUrl: "https://www.partyatredrocks.com/book",
        whyItFitsNext:
          "Carries your group size, Colorado dates, and Denver hub into Party at Red Rocks so your group can add a concert night before or after the mountains without re-entering trip details.",
        reusedTripFields: ["contextId", "date", "partySize", "pickupHub", "partnerId"],
      },
      {
        id: "gosno-second-return-den-transfer",
        label: "Book Return Resort-to-DEN Airport Transfer on GoSno (Purchase #2)",
        relationship: "same_market_companion",
        targetMarket: "gosno",
        targetSiteId: "gosno",
        targetDomain: "www.gosno.co",
        baseUrl: "https://www.gosno.co/book?leg=return-to-den",
        whyItFitsNext:
          "Reuses your passenger count, ski-bag count, and resort location to lock your return transfer to DEN with the 120-minute I-70 buffer.",
        reusedTripFields: [
          "contextId",
          "date",
          "partySize",
          "pickupHub",
          "skiBags",
          "partnerId",
        ],
      },
    ],
  },
};

export interface PortableNetworkTripDetails {
  /** Always begins with `dcc_ctx_` */
  contextId: string;
  originMarket: SharedMarketId;
  date: string;
  partySize: number;
  pickupHub: string | null;
  destinationResortOrVenue: string | null;
  shipName: string | null;
  berthCode: string | null;
  claaArrivalLocal: string | null;
  confirmedAllAboardLocal: string | null;
  skiBagsCount: number | null;
  flightCanceled: boolean;
  operatorCancelRef: string | null;
  partnerId: string | null;
  partnerRole: PartnerRole | null;
  completedLegs: string[];
  purchaseStep: number;
}

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | string
  | null
  | undefined;

function getParam(input: SearchParamsInput, key: string): string | undefined {
  if (!input) return undefined;
  if (typeof input === "string") {
    const sp = new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
    const val = sp.get(key);
    return val && val.trim() ? val.trim() : undefined;
  }
  if (input instanceof URLSearchParams) {
    const val = input.get(key);
    return val && val.trim() ? val.trim() : undefined;
  }
  const raw = input[key];
  if (Array.isArray(raw)) {
    return raw[0] && raw[0].trim() ? raw[0].trim() : undefined;
  }
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function getParamList(input: SearchParamsInput, key: string): string[] {
  if (!input) return [];
  let rawValues: string[] = [];
  if (typeof input === "string") {
    const sp = new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
    rawValues = sp.getAll(key);
  } else if (input instanceof URLSearchParams) {
    rawValues = input.getAll(key);
  } else {
    const raw = input[key];
    if (Array.isArray(raw)) rawValues = raw;
    else if (typeof raw === "string") rawValues = [raw];
  }
  return rawValues
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Extracts and normalizes portable trip details from any market's URL query parameters
 * or `dcc_ctx` base64url envelope, minting a deterministic `dcc_ctx_...` token if none was supplied.
 */
export function extractPortableTripDetailsFromSearchParams(
  searchParams: SearchParamsInput,
  defaults?: {
    market?: SharedMarketId;
    defaultDate?: string;
    defaultPartySize?: number;
    defaultPickupHub?: string | null;
    defaultDestination?: string | null;
    defaultShipName?: string | null;
    defaultBerthCode?: string | null;
    defaultAllAboard?: string | null;
  },
): PortableNetworkTripDetails {
  const originMarket: SharedMarketId = defaults?.market ?? "new-orleans";

  // Check if a base64url `dcc_ctx` envelope was passed
  let decodedTravelerCtx: DccTravelerContextV1 | null = null;
  const rawDccCtxB64 = getParam(searchParams, DCC_TRAVELER_CONTEXT_PARAM);
  if (rawDccCtxB64) {
    decodedTravelerCtx = readDccTravelerContextFromUrl(
      `?${DCC_TRAVELER_CONTEXT_PARAM}=${encodeURIComponent(rawDccCtxB64)}`,
    );
  }

  const rawDate =
    getParam(searchParams, "date") ||
    (typeof decodedTravelerCtx?.destinationExtensions?.date === "string"
      ? decodedTravelerCtx.destinationExtensions.date
      : undefined) ||
    defaults?.defaultDate ||
    "2026-06-18";

  const rawPartyStr =
    getParam(searchParams, "party_size") ||
    getParam(searchParams, "partySize") ||
    getParam(searchParams, "adults") ||
    getParam(searchParams, "qty") ||
    getParam(searchParams, "passengers") ||
    getParam(searchParams, "passengerCount");
  const parsedParty = rawPartyStr ? Number(rawPartyStr) : NaN;
  const partySize =
    Number.isFinite(parsedParty) && parsedParty >= 1 && parsedParty <= 50
      ? Math.round(parsedParty)
      : decodedTravelerCtx?.group?.total ||
        decodedTravelerCtx?.group?.adults ||
        defaults?.defaultPartySize ||
        2;

  const pickupHub =
    getParam(searchParams, "pickupHub") ||
    getParam(searchParams, "pickup") ||
    getParam(searchParams, "origin") ||
    (typeof decodedTravelerCtx?.destinationExtensions?.pickupHub === "string"
      ? decodedTravelerCtx.destinationExtensions.pickupHub
      : undefined) ||
    defaults?.defaultPickupHub ||
    null;

  const destinationResortOrVenue =
    getParam(searchParams, "destination") ||
    getParam(searchParams, "venue") ||
    getParam(searchParams, "event") ||
    (typeof decodedTravelerCtx?.destinationExtensions?.destination === "string"
      ? decodedTravelerCtx.destinationExtensions.destination
      : undefined) ||
    defaults?.defaultDestination ||
    null;

  const shipName =
    getParam(searchParams, "ship") ||
    (typeof decodedTravelerCtx?.destinationExtensions?.shipName === "string"
      ? decodedTravelerCtx.destinationExtensions.shipName
      : undefined) ||
    defaults?.defaultShipName ||
    null;

  const berthCode =
    getParam(searchParams, "berth") ||
    (typeof decodedTravelerCtx?.destinationExtensions?.berthCode === "string"
      ? decodedTravelerCtx.destinationExtensions.berthCode
      : undefined) ||
    defaults?.defaultBerthCode ||
    null;

  const claaArrivalLocal =
    getParam(searchParams, "claa_arrival") ||
    decodedTravelerCtx?.availableWindow?.start ||
    null;

  const confirmedAllAboardLocal =
    getParam(searchParams, "all_aboard") ||
    decodedTravelerCtx?.availableWindow?.end ||
    defaults?.defaultAllAboard ||
    null;

  const rawSkiBags = getParam(searchParams, "ski_bags");
  const parsedSkiBags = rawSkiBags !== undefined ? Number(rawSkiBags) : NaN;
  const skiBagsCount =
    Number.isFinite(parsedSkiBags) && parsedSkiBags >= 0 && parsedSkiBags <= 30
      ? Math.round(parsedSkiBags)
      : typeof decodedTravelerCtx?.destinationExtensions?.skiBagsCount === "number"
        ? (decodedTravelerCtx.destinationExtensions.skiBagsCount as number)
        : null;

  const rawFlightCanceled = getParam(searchParams, "flight_canceled");
  const flightCanceled =
    rawFlightCanceled === "1" ||
    rawFlightCanceled === "true" ||
    rawFlightCanceled === "yes" ||
    Boolean(getParam(searchParams, "cancel_ref"));

  const operatorCancelRef = getParam(searchParams, "cancel_ref") || null;

  const partnerAttr = resolvePartnerAttributionFromParams({
    partner: getParam(searchParams, "partner"),
    partnerRole: getParam(searchParams, "partner_role"),
    trafficSource: getParam(searchParams, "src"),
    cancelRef: operatorCancelRef,
  });

  const completedLegs = getParamList(searchParams, "completed_leg");
  const rawStep = Number(getParam(searchParams, "purchase_step"));
  const purchaseStep =
    Number.isFinite(rawStep) && rawStep >= 1 && rawStep <= 10
      ? Math.round(rawStep)
      : completedLegs.length > 0
        ? completedLegs.length + 1
        : 1;

  const rawCtx = getParam(searchParams, "ctx");
  const contextId =
    rawCtx && rawCtx.startsWith("dcc_ctx_")
      ? rawCtx
      : decodedTravelerCtx?.source?.handoffId?.startsWith("dcc_ctx_")
        ? decodedTravelerCtx.source.handoffId
        : `dcc_ctx_${originMarket.replace(/[^a-z0-9]/g, "")}_${sha256HexFull(
            rfc8785Canonicalize({
              originMarket,
              date: rawDate,
              partySize,
              pickupHub,
              shipName,
              berthCode,
            }),
          ).slice(0, 14)}`;

  return {
    contextId,
    originMarket,
    date: rawDate,
    partySize,
    pickupHub,
    destinationResortOrVenue,
    shipName,
    berthCode,
    claaArrivalLocal,
    confirmedAllAboardLocal,
    skiBagsCount,
    flightCanceled,
    operatorCancelRef,
    partnerId: partnerAttr.partnerId,
    partnerRole: partnerAttr.partnerRole,
    completedLegs,
    purchaseStep,
  };
}

/**
 * Builds a sanitized `DccTravelerContextV1` object from `PortableNetworkTripDetails`
 * so the existing `dcc_ctx` base64url reader works seamlessly across every site.
 */
export function buildPortableDccTravelerContextV1(
  trip: PortableNetworkTripDetails,
  targetMarket?: SharedMarketId | "cruise-ports",
): DccTravelerContextV1 {
  const market = targetMarket ?? trip.originMarket;
  return {
    version: 1,
    destination: market,
    travelerType: trip.shipName ? "cruise" : "hotel",
    availableWindow:
      trip.claaArrivalLocal || trip.confirmedAllAboardLocal
        ? {
            start: trip.claaArrivalLocal || undefined,
            end: trip.confirmedAllAboardLocal || undefined,
          }
        : undefined,
    group: {
      adults: trip.partySize,
      total: trip.partySize,
    },
    source: {
      property: "dcc",
      surface: `shared-market-template:${trip.originMarket}`,
      handoffId: trip.contextId,
    },
    destinationExtensions: {
      date: trip.date,
      pickupHub: trip.pickupHub,
      destination: trip.destinationResortOrVenue,
      shipName: trip.shipName,
      berthCode: trip.berthCode,
      skiBagsCount: trip.skiBagsCount,
      completedLegs: trip.completedLegs,
      purchaseStep: trip.purchaseStep,
      partnerId: trip.partnerId,
    },
  };
}

/**
 * Projects portable trip details onto any DCC or storefront URL, automatically setting:
 * - Canonical `ctx` (`dcc_ctx_...`), `date`, `party_size`, `purchase_step`, `completed_leg`
 * - Target-storefront parameter aliases (`partySize`/`qty`/`pickupHub` for PARR; `passengers`/`passengerCount`/`ski_bags`/`vehicleClass` for GoSno; `adults`/`ship`/`berth`/`all_aboard` for WNO & Juneau)
 * - Base64url `dcc_ctx` parameter for `readDccTravelerContextFromUrl`
 * - Guaranteed zero PII (`validateUrlFreeOfPersonalData`)
 */
export function appendPortableTripDetailsToUrl(
  baseUrl: string,
  trip: PortableNetworkTripDetails,
  options?: {
    targetMarket?: SharedMarketId | "cruise-ports";
    advancePurchaseStep?: boolean;
    markLegCompleted?: string;
    includeBase64DccCtx?: boolean;
  },
): string {
  const url = new URL(baseUrl, "https://www.destinationcommandcenter.com");
  const host = url.hostname.toLowerCase();

  const nextCompletedLegs = [...trip.completedLegs];
  if (
    options?.markLegCompleted &&
    !nextCompletedLegs.includes(options.markLegCompleted)
  ) {
    nextCompletedLegs.push(options.markLegCompleted);
  }
  const nextStep = options?.advancePurchaseStep
    ? Math.max(trip.purchaseStep + 1, nextCompletedLegs.length + 1)
    : trip.purchaseStep;

  url.searchParams.set("ctx", trip.contextId);
  url.searchParams.set("date", trip.date);
  url.searchParams.set("party_size", String(trip.partySize));
  url.searchParams.set("purchase_step", String(nextStep));

  if (nextCompletedLegs.length > 0) {
    url.searchParams.set("completed_leg", nextCompletedLegs.join(","));
  }

  // Host/market-specific parameter aliases so the receiving storefront pre-populates without re-entry
  const isParr =
    host.includes("partyatredrocks.com") || options?.targetMarket === "red-rocks";
  const isGoSno = host.includes("gosno.co") || options?.targetMarket === "gosno";
  const isCruiseOrPort =
    host.includes("juneauflightdeck.com") ||
    host.includes("lastfrontiershoreexcursions.com") ||
    host.includes("welcometoneworleanstours.com") ||
    host.includes("welcometotheswamp.com") ||
    host.includes("cruisepromenade.com") ||
    options?.targetMarket === "juneau" ||
    options?.targetMarket === "new-orleans" ||
    options?.targetMarket === "cruise-ports";

  if (isParr) {
    url.searchParams.set("partySize", String(trip.partySize));
    url.searchParams.set("qty", String(trip.partySize));
    if (trip.pickupHub) {
      url.searchParams.set("pickupHub", trip.pickupHub);
    }
  }

  if (isGoSno) {
    url.searchParams.set("partySize", String(trip.partySize));
    url.searchParams.set("passengers", String(trip.partySize));
    url.searchParams.set("passengerCount", String(trip.partySize));
    if (trip.pickupHub) {
      url.searchParams.set("origin", trip.pickupHub);
    }
    if (trip.destinationResortOrVenue) {
      url.searchParams.set("destination", trip.destinationResortOrVenue);
    }
    if (trip.skiBagsCount !== null) {
      url.searchParams.set("ski_bags", String(trip.skiBagsCount));
    }
    url.searchParams.set(
      "vehicleClass",
      trip.partySize > 5 || (trip.skiBagsCount ?? 0) > 5
        ? "awd-sprinter-14"
        : "private-4wd-suv",
    );
  }

  if (isCruiseOrPort) {
    url.searchParams.set("adults", String(trip.partySize));
    if (trip.pickupHub) {
      url.searchParams.set("pickup", trip.pickupHub);
    }
    if (trip.shipName) {
      url.searchParams.set("ship", trip.shipName);
    }
    if (trip.berthCode) {
      url.searchParams.set("berth", trip.berthCode);
    }
    if (trip.claaArrivalLocal) {
      url.searchParams.set("claa_arrival", trip.claaArrivalLocal);
    }
    if (trip.confirmedAllAboardLocal) {
      url.searchParams.set("all_aboard", trip.confirmedAllAboardLocal);
    }
    if (trip.flightCanceled) {
      url.searchParams.set("flight_canceled", "1");
    }
    if (trip.operatorCancelRef) {
      url.searchParams.set("cancel_ref", trip.operatorCancelRef);
    }
  }

  if (trip.partnerId) {
    url.searchParams.set("partner", trip.partnerId);
  }
  if (trip.partnerRole) {
    url.searchParams.set("partner_role", trip.partnerRole);
  }

  if (options?.includeBase64DccCtx !== false) {
    const encodedCtx = buildDccTravelerContextParam(
      buildPortableDccTravelerContextV1(
        {
          ...trip,
          completedLegs: nextCompletedLegs,
          purchaseStep: nextStep,
        },
        options?.targetMarket,
      ),
    );
    if (encodedCtx) {
      url.searchParams.set(DCC_TRAVELER_CONTEXT_PARAM, encodedCtx);
    }
  }

  const finalUrl = url.toString();
  const piiValidation = validateUrlFreeOfPersonalData(finalUrl);
  if (!piiValidation.valid) {
    throw new Error(
      `Portable URL failed zero-PII validation; forbidden fields: ${piiValidation.violatingParams.join(", ")}`,
    );
  }

  return finalUrl;
}

export interface HydratedSecondPurchaseRecommendation extends SecondPurchasePathSpec {
  portableHref: string;
}

/**
 * Builds ready-to-click Purchase #2 links for a traveler in `currentMarket`,
 * carrying their `dcc_ctx_`, date, party size, pickup/ship, and completed leg forward.
 */
export function buildSecondPurchaseRecommendations(
  currentMarket: SharedMarketId,
  trip: PortableNetworkTripDetails,
): HydratedSecondPurchaseRecommendation[] {
  const template = SHARED_MARKET_TEMPLATES[currentMarket];
  return template.secondPurchasePaths.map((spec) => ({
    ...spec,
    portableHref: appendPortableTripDetailsToUrl(spec.baseUrl, trip, {
      targetMarket: spec.targetMarket,
      advancePurchaseStep: true,
      markLegCompleted: currentMarket,
      includeBase64DccCtx: true,
    }),
  }));
}
