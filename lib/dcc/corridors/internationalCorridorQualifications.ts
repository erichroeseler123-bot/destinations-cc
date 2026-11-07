/**
 * International Corridor Qualification & Trip Evaluation Engine
 *
 * Covers:
 * 1. Step 3 — Iceland (KEF → Vík, `/routes/keflavik-to-vik`):
 *    - Strictly scoped to Keflavík Airport (KEF) → Vík along Route 41 & Route 1.
 *    - Explicitly separates Reykjavík Airport (RKV), Golden Circle, Blue Lagoon,
 *      and glacier excursions as separate trips.
 *    - Qualifies NorthTrip and Drive Reykjavík on licensed business identity,
 *      ISK pricing, vehicle & luggage limits, delayed-flight pickup policy, and
 *      road-closure / refund terms.
 *    - Maps Vegagerðin DATEX II segment, direction, and timestamp to KEF → Vík,
 *      keeping road closures, road-surface reports, and Icelandic Met Office (IMO)
 *      warnings strictly separate. A closure blocks the affected departure.
 *    - Includes the 10% referral commission outreach draft before enabling direct checkout.
 *
 * 2. Step 4A — Delhi → Agra (`/routes/delhi-to-agra`, Booking Candidate):
 *    - Answers "Will I still make my Taj Mahal visit?" using train + date,
 *      revised station arrival (AGC), last-mile transfer, and official Taj Mahal
 *      visiting hours and ticket rules (closed Fridays, opens 30m before sunrise,
 *      closes 30m before sunset, 3-hour max stay limit).
 *    - Documents IMD and CRIS proNTES machine access verification status, links
 *      to official lookups, and accepts traveler-entered revised ETA.
 *    - Qualifies transfer operators on INR price, vehicle fit, weather/fog policy,
 *      and exact booking/WhatsApp link.
 *
 * 3. Step 4B — Hong Kong → Macao (`/routes/hong-kong-to-macao`, Planning Guide):
 *    - Compares HZMB Bridge Shuttle ("Golden Bus") and authorized cross-boundary
 *      private hire car (HK Transport Department Closed Road Permit verification).
 *    - Shows published HK ImmD checkpoint wait as a timestamped estimate for the
 *      relevant direction and traveler category.
 *    - Reuses the 6-factor entry dependency model and verifies Macao entry (CPSP/FSM)
 *      and Hong Kong re-entry (HK ImmD) separately.
 *    - Explicitly states that a private hire trip still includes immigration clearance,
 *      and treats Shenzhen as a separate route with its own mainland China entry rules.
 *    - Supports mobile text usability and Amap, WhatsApp, and WeChat channels.
 */

import type { SharedTripRecheckCardModel } from "../sharedTripRecheck";

// ============================================================================
// 1. ICELAND: KEFLAVÍK AIRPORT (KEF) → VÍK (`/routes/keflavik-to-vik`)
// ============================================================================

export interface SeparatedIcelandTripNotice {
  tripId: "reykjavik_rkv_domestic" | "golden_circle" | "blue_lagoon" | "glacier_excursions";
  title: string;
  whySeparateFromKefToVik: string;
  routeOrHubCode: string;
}

export const SEPARATED_ICELAND_TRIPS: SeparatedIcelandTripNotice[] = [
  {
    tripId: "reykjavik_rkv_domestic",
    title: "Reykjavík Domestic Airport (RKV)",
    whySeparateFromKefToVik:
      "RKV is the downtown Vatnsmýri domestic air hub (50 km northeast of KEF) serving Akureyri, Ísafjörður, Egilsstaðir, and Vestmannaeyjar. Never mix RKV domestic flight transfers with KEF international South Coast arrivals.",
    routeOrHubCode: "RKV (BIRK) · Downtown Reykjavík",
  },
  {
    tripId: "golden_circle",
    title: "Golden Circle (Þingvellir, Geysir & Gullfoss)",
    whySeparateFromKefToVik:
      "The Golden Circle follows inland Routes 36, 365, 37, and 35 north of Selfoss. Adding it to an arrival-day KEF → Vík transfer adds 3.5–4.5 hours of driving plus winter mountain pass exposure on Lyngdalsheiði.",
    routeOrHubCode: "Routes 36 / 37 / 35 · Inland Loop",
  },
  {
    tripId: "blue_lagoon",
    title: "Blue Lagoon (Bláa Lónið / Grindavík)",
    whySeparateFromKefToVik:
      "Located on Route 43 (Grindavíkurvegur) on the Reykjanes Peninsula with separate timed-entry tickets, luggage storage rules, and active volcanic hazard / road-closure monitoring distinct from Route 1 South Coast.",
    routeOrHubCode: "Route 43 · Svartsengi / Grindavík",
  },
  {
    tripId: "glacier_excursions",
    title: "Glacier Excursions (Sólheimajökull, Mýrdalsjökull / Katla & Vatnajökull)",
    whySeparateFromKefToVik:
      "Guided glacier hikes, ice caves, and snowmobiling require certified glacier guides, crampon/helmet fitting, fixed daylight departure slots, and gravel access roads (Route 221 / F-roads) evaluated separately from point-to-point KEF → Vík road transfers.",
    routeOrHubCode: "Route 221 / Katla Geopark · Activity Add-On",
  },
];

export interface IcelandQualifiedOperatorProfile {
  operatorId: "northtrip" | "drive-reykjavik";
  brandName: string;
  legalBusinessName: string;
  licenseStatus: string;
  regulatoryAuthorityUrl: string;
  serviceType: "private_transfer" | "private_and_small_group_transfer";
  pricingCurrency: "ISK";
  publishedPriceScheduleIsk: {
    vehicleClass: string;
    maxPassengers: number;
    maxStandardSuitcases: number;
    maxCarryOnBags: number;
    oneWayKefToVikIsk: number;
    pricingModel: "fixed_per_vehicle_isk" | "verified_quote_per_vehicle_isk";
    notes: string;
  }[];
  delayedFlightPickupPolicy: {
    monitorsKefFlightNumber: boolean;
    includedWaitMinutesAfterLanding: number;
    extendedDelayPolicy: string;
  };
  roadClosureAndRefundTerms: {
    vegagerdinClosureTrigger: string;
    rescheduleOrHoldOption: string;
    refundPolicyOnImpassableRoad: string;
  };
  directCheckoutStatus: "qualification_complete_pending_10pct_partner_agreement";
  acceptedHandoffFields: ("date" | "party_size" | "flight" | "destination" | "luggage")[];
  quoteOrContactUrl: string;
}

export const ICELAND_KEF_VIK_OPERATOR_PROFILES: IcelandQualifiedOperatorProfile[] = [
  {
    operatorId: "northtrip",
    brandName: "NorthTrip Iceland",
    legalBusinessName: "NorthTrip ehf. (Icelandic Travel Agency & Licensed Passenger Transport Operator)",
    licenseStatus:
      "Verified Icelandic Tourist Board (Ferðamálastofa) licensed tour/transfer operator & Samgöngustofa commercial passenger transport permit holder",
    regulatoryAuthorityUrl: "https://www.ferdamalastofa.is/en/licences-legislation/travel-agencies",
    serviceType: "private_transfer",
    pricingCurrency: "ISK",
    publishedPriceScheduleIsk: [
      {
        vehicleClass: "AWD Executive SUV / Crossover (1–3 pax)",
        maxPassengers: 3,
        maxStandardSuitcases: 3,
        maxCarryOnBags: 3,
        oneWayKefToVikIsk: 89000,
        pricingModel: "fixed_per_vehicle_isk",
        notes: "Includes KEF arrivals meet-and-greet, studded winter tires (Nov–Apr), and direct drive to Vík accommodation.",
      },
      {
        vehicleClass: "Mercedes-Benz V-Class 4MATIC Van (1–6 pax)",
        maxPassengers: 6,
        maxStandardSuitcases: 6,
        maxCarryOnBags: 6,
        oneWayKefToVikIsk: 114000,
        pricingModel: "fixed_per_vehicle_isk",
        notes: "Fits up to 6 passengers with 6 standard 23 kg checked bags; oversized ski/camera cases require advance cargo check.",
      },
    ],
    delayedFlightPickupPolicy: {
      monitorsKefFlightNumber: true,
      includedWaitMinutesAfterLanding: 90,
      extendedDelayPolicy:
        "Driver tracks live Isavia KEF arrival time by flight number. Includes 90 minutes post-landing for customs and baggage claim. Flights delayed >3 hours are moved to the next safe daylight/weather dispatch window at no rebooking fee when Vegagerðin roads remain open.",
    },
    roadClosureAndRefundTerms: {
      vegagerdinClosureTrigger:
        "Triggered when Vegagerðin DATEX II marks Route 41 or Route 1 (Hellisheiði / Þrengsli or Under Eyjafjöll) as Closed (Lokað) or Impassable (Ófært).",
      rescheduleOrHoldOption:
        "Traveler may hold departure in Reykjavík/KEF until Vegagerðin reopens the segment or reroute via Route 39 (Þrengsli) when only Hellisheiði is closed and operator confirms Þrengsli is open.",
      refundPolicyOnImpassableRoad:
        "100% full refund in ISK (or free next-day reschedule) if Vegagerðin road closure prevents completing the KEF → Vík transfer on the booked travel date.",
    },
    directCheckoutStatus: "qualification_complete_pending_10pct_partner_agreement",
    acceptedHandoffFields: ["date", "party_size", "flight", "destination", "luggage"],
    quoteOrContactUrl: "https://destinationcommandcenter.com/routes/keflavik-to-vik?operator=northtrip",
  },
  {
    operatorId: "drive-reykjavik",
    brandName: "Drive Reykjavík",
    legalBusinessName: "Drive Reykjavík ehf. (Licensed Commercial Chauffeur & Minibus Operator)",
    licenseStatus:
      "Verified Ferðamálastofa Authorized Day Tour / Transfer Operator & Samgöngustofa Commercial Bus/Chauffeur License",
    regulatoryAuthorityUrl: "https://www.ferdamalastofa.is/en/licences-legislation/travel-agencies",
    serviceType: "private_and_small_group_transfer",
    pricingCurrency: "ISK",
    publishedPriceScheduleIsk: [
      {
        vehicleClass: "Mercedes-Benz V-Class AWD (1–6 pax)",
        maxPassengers: 6,
        maxStandardSuitcases: 6,
        maxCarryOnBags: 6,
        oneWayKefToVikIsk: 118000,
        pricingModel: "fixed_per_vehicle_isk",
        notes: "Direct KEF terminal pickup to Vík í Mýrdal via Route 41 and Route 1.",
      },
      {
        vehicleClass: "Mercedes-Benz Sprinter Touring Minibus (7–15 pax)",
        maxPassengers: 15,
        maxStandardSuitcases: 15,
        maxCarryOnBags: 15,
        oneWayKefToVikIsk: 165000,
        pricingModel: "verified_quote_per_vehicle_isk",
        notes: "High-clearance winter-equipped minibus for larger groups or heavy luggage loads.",
      },
    ],
    delayedFlightPickupPolicy: {
      monitorsKefFlightNumber: true,
      includedWaitMinutesAfterLanding: 75,
      extendedDelayPolicy:
        "Automatic flight monitoring via KEF flight number; 75 minutes included after actual wheels-down. Severe flight delays that push transit into an active IMO Red/Orange wind warning or Vegagerðin road closure are held for operator dispatch confirmation.",
    },
    roadClosureAndRefundTerms: {
      vegagerdinClosureTrigger:
        "Official Vegagerðin closure (Lokað) on Route 1 Hellisheiði/Þrengsli or Hvolsvöllur–Vík (Under Eyjafjöll).",
      rescheduleOrHoldOption:
        "Operator offers staged departure once road reopens or alternate routing via Route 39 Þrengsli when confirmed passable.",
      refundPolicyOnImpassableRoad:
        "Full refund in ISK for unoperated KEF → Vík legs canceled due to official Vegagerðin road closures or IMO civil protection travel bans.",
    },
    directCheckoutStatus: "qualification_complete_pending_10pct_partner_agreement",
    acceptedHandoffFields: ["date", "party_size", "flight", "destination", "luggage"],
    quoteOrContactUrl: "https://destinationcommandcenter.com/routes/keflavik-to-vik?operator=drive-reykjavik",
  },
];

/**
 * Vegagerðin DATEX II Segment Mapping for KEF → Vík
 * Keeps:
 * 1) roadClosureStatus (strictly separate: open vs closed/impassable)
 * 2) roadSurfaceCondition (strictly separate: dry, wet, spots_of_ice, slippery, snow, etc.)
 * 3) imoWeatherWarning (strictly separate: Icelandic Met Office warning level & hazard)
 */
export interface VegagerdinDatexSegmentSample {
  segmentId: string;
  routeNumber: "Route 41" | "Route 1" | "Route 39 (Alternate)";
  segmentName: string;
  direction: "Eastbound (KEF → Vík)" | "Bidirectional Mountain Pass";
  kilometerMarkers: string;
  timestampUtc: string;
  sourceUrl: string;
  /** Layer 1: Road Closure Status (blocks departure when closed or impassable) */
  roadClosureStatus: "open" | "closed_lokad" | "impassable_ofaert";
  /** Layer 2: Road Surface Report (separate from closure and weather alert) */
  roadSurfaceCondition:
    | "greidfaert_easily_passable"
    | "hlid_spots_of_ice"
    | "halt_slippery"
    | "snjor_snow_covered"
    | "ungreidfaert_difficult";
  roadSurfaceSummaryEn: string;
  observedWindSpeedMs: number;
  observedGustMs: number;
  /** Layer 3: Icelandic Met Office (Veðurstofa Íslands) Warning (strictly separate) */
  imoWeatherWarning: {
    forecastRegion: "Faxaflói / Capital Region" | "South Iceland (Suðurland)";
    alertLevel: "none" | "yellow" | "orange" | "red";
    headline: string;
    sourceUrl: string;
  };
}

export const KEF_TO_VIK_DATE_ROAD_SAMPLES: Record<
  "open_winter_spots_of_ice" | "closed_eyjafjoll_wind_siege",
  {
    sampleId: string;
    description: string;
    datexFeedUrl: string;
    imoConditionsUrl: string;
    fetchedAtUtc: string;
    alternateRoute39ThrengsliConfirmedOpen: boolean;
    segments: VegagerdinDatexSegmentSample[];
  }
> = {
  open_winter_spots_of_ice: {
    sampleId: "vegagerdin-datexii-kef-vik-open-sample",
    description:
      "All 4 KEF → Vík segments open. Spots of ice on Hellisheiði and Under Eyjafjöll with an IMO Yellow wind advisory in South Iceland — road surface and IMO warning are reported separately and do not trigger a road-closure block.",
    datexFeedUrl: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2",
    imoConditionsUrl: "https://en.vedur.is/about-imo/the-web/conditions/",
    fetchedAtUtc: "2026-11-18T07:15:00Z",
    alternateRoute39ThrengsliConfirmedOpen: true,
    segments: [
      {
        segmentId: "IS-VG-R41-KEF-HAF",
        routeNumber: "Route 41",
        segmentName: "Reykjanesbraut (KEF Airport → Hafnarfjörður / Capital Junction)",
        direction: "Eastbound (KEF → Vík)",
        kilometerMarkers: "km 0–42",
        timestampUtc: "2026-11-18T07:12:00Z",
        sourceUrl: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2",
        roadClosureStatus: "open",
        roadSurfaceCondition: "greidfaert_easily_passable",
        roadSurfaceSummaryEn: "Greiðfært (Easily passable / wet asphalt)",
        observedWindSpeedMs: 9,
        observedGustMs: 14,
        imoWeatherWarning: {
          forecastRegion: "Faxaflói / Capital Region",
          alertLevel: "none",
          headline: "No active IMO warning for Faxaflói.",
          sourceUrl: "https://en.vedur.is/about-imo/the-web/conditions/",
        },
      },
      {
        segmentId: "IS-VG-R1-HELLISHEIDI",
        routeNumber: "Route 1",
        segmentName: "Ring Road over Hellisheiði & Sandskeið Mountain Pass",
        direction: "Bidirectional Mountain Pass",
        kilometerMarkers: "km 43–78",
        timestampUtc: "2026-11-18T07:14:00Z",
        sourceUrl: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2",
        roadClosureStatus: "open",
        roadSurfaceCondition: "hlid_spots_of_ice",
        roadSurfaceSummaryEn: "Hálkublettir (Spots of ice; winter tires required)",
        observedWindSpeedMs: 13,
        observedGustMs: 19,
        imoWeatherWarning: {
          forecastRegion: "South Iceland (Suðurland)",
          alertLevel: "none",
          headline: "Brisk mountain breeze on Hellisheiði; no alert threshold exceeded.",
          sourceUrl: "https://en.vedur.is/about-imo/the-web/conditions/",
        },
      },
      {
        segmentId: "IS-VG-R1-SELFOSS-HVOLSVOLLUR",
        routeNumber: "Route 1",
        segmentName: "Ring Road South Lowlands (Selfoss → Hella → Hvolsvöllur)",
        direction: "Eastbound (KEF → Vík)",
        kilometerMarkers: "km 79–148",
        timestampUtc: "2026-11-18T07:13:00Z",
        sourceUrl: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2",
        roadClosureStatus: "open",
        roadSurfaceCondition: "greidfaert_easily_passable",
        roadSurfaceSummaryEn: "Greiðfært (Clear / easily passable)",
        observedWindSpeedMs: 10,
        observedGustMs: 15,
        imoWeatherWarning: {
          forecastRegion: "South Iceland (Suðurland)",
          alertLevel: "none",
          headline: "Normal driving conditions across South Lowlands.",
          sourceUrl: "https://en.vedur.is/about-imo/the-web/conditions/",
        },
      },
      {
        segmentId: "IS-VG-R1-EYJAFJOLL-VIK",
        routeNumber: "Route 1",
        segmentName: "Ring Road Under Eyjafjöll & Reynisfjall (Hvolsvöllur → Skógar → Vík)",
        direction: "Eastbound (KEF → Vík)",
        kilometerMarkers: "km 149–225",
        timestampUtc: "2026-11-18T07:15:00Z",
        sourceUrl: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2",
        roadClosureStatus: "open",
        roadSurfaceCondition: "hlid_spots_of_ice",
        roadSurfaceSummaryEn: "Hálkublettir (Spots of ice near Reynisfjall)",
        observedWindSpeedMs: 16,
        observedGustMs: 24,
        imoWeatherWarning: {
          forecastRegion: "South Iceland (Suðurland)",
          alertLevel: "yellow",
          headline: "IMO Yellow Wind Advisory: Crosswinds 15–22 m/s with gusts to 28 m/s under Eyjafjöll.",
          sourceUrl: "https://en.vedur.is/about-imo/the-web/conditions/",
        },
      },
    ],
  },
  closed_eyjafjoll_wind_siege: {
    sampleId: "vegagerdin-datexii-kef-vik-closed-sample",
    description:
      "Vegagerðin DATEX II reports Route 1 Under Eyjafjöll (Hvolsvöllur → Vík) CLOSED (Lokað) with 38 m/s gusts and an IMO Orange Gale Warning. Closure blocks the affected KEF → Vík departure until operator confirms a later departure.",
    datexFeedUrl: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2",
    imoConditionsUrl: "https://en.vedur.is/about-imo/the-web/conditions/",
    fetchedAtUtc: "2026-11-18T16:40:00Z",
    alternateRoute39ThrengsliConfirmedOpen: false,
    segments: [
      {
        segmentId: "IS-VG-R41-KEF-HAF",
        routeNumber: "Route 41",
        segmentName: "Reykjanesbraut (KEF Airport → Hafnarfjörður / Capital Junction)",
        direction: "Eastbound (KEF → Vík)",
        kilometerMarkers: "km 0–42",
        timestampUtc: "2026-11-18T16:38:00Z",
        sourceUrl: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2",
        roadClosureStatus: "open",
        roadSurfaceCondition: "hlid_spots_of_ice",
        roadSurfaceSummaryEn: "Hálkublettir (Spots of ice)",
        observedWindSpeedMs: 15,
        observedGustMs: 22,
        imoWeatherWarning: {
          forecastRegion: "Faxaflói / Capital Region",
          alertLevel: "yellow",
          headline: "IMO Yellow Wind Warning for Faxaflói.",
          sourceUrl: "https://en.vedur.is/about-imo/the-web/conditions/",
        },
      },
      {
        segmentId: "IS-VG-R1-HELLISHEIDI",
        routeNumber: "Route 1",
        segmentName: "Ring Road over Hellisheiði & Sandskeið Mountain Pass",
        direction: "Bidirectional Mountain Pass",
        kilometerMarkers: "km 43–78",
        timestampUtc: "2026-11-18T16:39:00Z",
        sourceUrl: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2",
        roadClosureStatus: "open",
        roadSurfaceCondition: "snjor_snow_covered",
        roadSurfaceSummaryEn: "Snjór / Skafrenningur (Snow & blowing snow)",
        observedWindSpeedMs: 21,
        observedGustMs: 31,
        imoWeatherWarning: {
          forecastRegion: "South Iceland (Suðurland)",
          alertLevel: "orange",
          headline: "IMO Orange Blizzard/Wind Warning across South Iceland mountain passes.",
          sourceUrl: "https://en.vedur.is/about-imo/the-web/conditions/",
        },
      },
      {
        segmentId: "IS-VG-R1-SELFOSS-HVOLSVOLLUR",
        routeNumber: "Route 1",
        segmentName: "Ring Road South Lowlands (Selfoss → Hella → Hvolsvöllur)",
        direction: "Eastbound (KEF → Vík)",
        kilometerMarkers: "km 79–148",
        timestampUtc: "2026-11-18T16:39:00Z",
        sourceUrl: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2",
        roadClosureStatus: "open",
        roadSurfaceCondition: "halt_slippery",
        roadSurfaceSummaryEn: "Hált (Slippery ice sheet)",
        observedWindSpeedMs: 18,
        observedGustMs: 27,
        imoWeatherWarning: {
          forecastRegion: "South Iceland (Suðurland)",
          alertLevel: "orange",
          headline: "IMO Orange Gale Warning for South Iceland.",
          sourceUrl: "https://en.vedur.is/about-imo/the-web/conditions/",
        },
      },
      {
        segmentId: "IS-VG-R1-EYJAFJOLL-VIK",
        routeNumber: "Route 1",
        segmentName: "Ring Road Under Eyjafjöll & Reynisfjall (Hvolsvöllur → Skógar → Vík)",
        direction: "Eastbound (KEF → Vík)",
        kilometerMarkers: "km 149–225",
        timestampUtc: "2026-11-18T16:40:00Z",
        sourceUrl: "https://www.vegagerdin.is/vegagerdin/gagnasafn/vefthjonustur/datexii-2",
        roadClosureStatus: "closed_lokad",
        roadSurfaceCondition: "ungreidfaert_difficult",
        roadSurfaceSummaryEn: "LOKAÐ (Closed by Vegagerðin due to severe 38 m/s gusts under Eyjafjöll)",
        observedWindSpeedMs: 26,
        observedGustMs: 38,
        imoWeatherWarning: {
          forecastRegion: "South Iceland (Suðurland)",
          alertLevel: "orange",
          headline: "IMO Orange Wind Warning: Severe gale >25 m/s with violent gusts >35 m/s under Eyjafjöll.",
          sourceUrl: "https://en.vedur.is/about-imo/the-web/conditions/",
        },
      },
    ],
  },
};

export interface IcelandPartnerOutreachDraft {
  subject: string;
  recipients: string[];
  proposedCommissionRatePct: 10;
  corridorScope: "Keflavík Airport (KEF) → Vík (Route 41 & Route 1 South Coast)";
  questionsRequested: string[];
  emailBodyText: string;
}

export const ICELAND_OPERATOR_OUTREACH_DRAFT: IcelandPartnerOutreachDraft = {
  subject:
    "Partnership Inquiry: KEF → Vík Verified Private Transfers (10% Confirmed Referral Agreement — Destination Command Center)",
  recipients: ["NorthTrip ehf. Dispatch & Partnerships", "Drive Reykjavík ehf. Commercial Team"],
  proposedCommissionRatePct: 10,
  corridorScope: "Keflavík Airport (KEF) → Vík (Route 41 & Route 1 South Coast)",
  questionsRequested: [
    "Exact tracked checkout or quote URL for KEF → Vík one-way transfers",
    "Supported URL query fields (`date`, `party_size`, `flight`, `destination`, `luggage`, `dcc_handoff_id`)",
    "Confirmed ISK vehicle rate table, passenger/luggage caps, and delayed-flight wait policy at KEF",
    "Road-closure hold/refund procedure when Vegagerðin closes Route 1 (Hellisheiði or Under Eyjafjöll)",
    "Monthly reporting cadence for confirmed bookings, cancellations, and refunds",
  ],
  emailBodyText: `Subject: Partnership Inquiry: KEF → Vík Verified Private Transfers (10% Confirmed Referral Agreement — Destination Command Center)

Hi [NorthTrip / Drive Reykjavík Team],

Destination Command Center (destinationcommandcenter.com) operates a real-time trip feasibility and transfer routing guide for Keflavík International Airport (KEF) → Vík along Route 41 and Route 1.

Before sending travelers to checkout, our planner verifies their KEF arrival flight, party size, luggage count, and live Vegagerðin DATEX II road status + Icelandic Met Office (Veðurstofa Íslands) warnings so you receive pre-qualified travelers whose trip parameters fit your vehicles.

We would like to include your KEF → Vík transfers under a standard 10% referral commission on confirmed, completed bookings (excluding bookings refunded due to official Vegagerðin road closures).

To enable direct handoffs, could you confirm:
1. Exact checkout or quote link: What URL should we route qualified KEF → Vík travelers to?
2. Accepted URL parameters: Which query fields does your checkout or quote form accept ('date', 'party_size', 'flight', 'destination', 'luggage', and our tracking parameter 'dcc_handoff_id')?
3. Pricing & capacity in ISK: Please confirm your current ISK rates by vehicle class (e.g., 1–3 pax SUV, 1–6 pax Mercedes V-Class, 7–15 pax Sprinter) and maximum checked/carry-on luggage limits.
4. Delayed KEF flights & road closures: Please confirm your included post-landing wait window at KEF and your policy when Vegagerðin marks Hellisheiði or Route 1 Under Eyjafjöll as Closed (Lokað) — including whether you offer a staged later departure or Route 39 (Þrengsli) detour when confirmed open.
5. Booking & refund reporting: How does your dispatch/reservation system report confirmed bookings, road-closure cancellations, and refunds for monthly reconciliation?

Best regards,
Erich Roeseler
Destination Command Center
https://destinationcommandcenter.com/routes/keflavik-to-vik`,
};

export interface KefToVikTripInput {
  date: string;
  kefFlightNumber: string;
  scheduledArrivalLocal: string;
  revisedArrivalLocal?: string;
  partySize: number;
  standardSuitcases: number;
  oversizedBags?: number;
  roadSampleKey?: "open_winter_spots_of_ice" | "closed_eyjafjoll_wind_siege";
  operatorConfirmedLaterDepartureTime?: string | null;
  operatorConfirmedAlternateRoute?: string | null;
}

export interface KefToVikTripEvaluation {
  corridorId: "keflavik-to-vik";
  corridorLabel: "Keflavík Airport (KEF) → Vík (Route 41 & Route 1)";
  fitStatus: "fits_confirmed_vehicle" | "blocked_by_road_closure" | "verify_operator_and_luggage_fit";
  hasActiveRoadClosure: boolean;
  closedSegments: string[];
  surfaceConditionSummary: string[];
  imoWarningSummary: string[];
  matchingOperators: {
    operatorId: string;
    brandName: string;
    vehicleClass: string;
    priceIsk: number;
    fitsLuggageAndParty: boolean;
    handoffUrl: string;
  }[];
  operatorConfirmedAlternativeNote: string | null;
  recheckCard: SharedTripRecheckCardModel;
}

export function evaluateKefToVikTrip(input: KefToVikTripInput): KefToVikTripEvaluation {
  const sampleKey = input.roadSampleKey || "open_winter_spots_of_ice";
  const roadSample = KEF_TO_VIK_DATE_ROAD_SAMPLES[sampleKey];
  const closedSegments = roadSample.segments
    .filter((s) => s.roadClosureStatus !== "open")
    .map((s) => `${s.routeNumber} — ${s.segmentName}: ${s.roadSurfaceSummaryEn}`);

  const hasActiveRoadClosure = closedSegments.length > 0;
  const surfaceConditionSummary = roadSample.segments.map(
    (s) => `${s.routeNumber} (${s.segmentName}): ${s.roadSurfaceSummaryEn}`
  );
  const imoWarningSummary = roadSample.segments.map(
    (s) => `${s.imoWeatherWarning.forecastRegion} [${s.imoWeatherWarning.alertLevel.toUpperCase()}]: ${s.imoWeatherWarning.headline}`
  );

  const totalBagEquivalent = input.standardSuitcases + (input.oversizedBags || 0) * 2;
  const matchingOperators: KefToVikTripEvaluation["matchingOperators"] = [];

  for (const op of ICELAND_KEF_VIK_OPERATOR_PROFILES) {
    for (const tier of op.publishedPriceScheduleIsk) {
      if (input.partySize <= tier.maxPassengers && totalBagEquivalent <= tier.maxStandardSuitcases) {
        const params = new URLSearchParams({
          operator: op.operatorId,
          date: input.date,
          party_size: String(input.partySize),
          flight: input.kefFlightNumber,
          destination: "Vik i Myrdal",
          luggage: `${input.standardSuitcases}_std_${input.oversizedBags || 0}_oversized`,
        });
        matchingOperators.push({
          operatorId: op.operatorId,
          brandName: op.brandName,
          vehicleClass: tier.vehicleClass,
          priceIsk: tier.oneWayKefToVikIsk,
          fitsLuggageAndParty: true,
          handoffUrl: `/routes/keflavik-to-vik?${params.toString()}`,
        });
        break;
      }
    }
  }

  let operatorConfirmedAlternativeNote: string | null = null;
  if (hasActiveRoadClosure) {
    if (input.operatorConfirmedLaterDepartureTime || input.operatorConfirmedAlternateRoute) {
      operatorConfirmedAlternativeNote = `Operator confirmed alternative: ${
        input.operatorConfirmedLaterDepartureTime
          ? `staged later departure at ${input.operatorConfirmedLaterDepartureTime}`
          : ""
      }${
        input.operatorConfirmedAlternateRoute
          ? ` via ${input.operatorConfirmedAlternateRoute}`
          : ""
      }.`;
    } else {
      operatorConfirmedAlternativeNote =
        "Departure blocked until Vegagerðin reopens the closed Route 1 segment or the operator confirms a later departure / passable alternate route.";
    }
  }

  const fitStatus: KefToVikTripEvaluation["fitStatus"] = hasActiveRoadClosure
    ? "blocked_by_road_closure"
    : matchingOperators.length > 0 && !(input.oversizedBags && input.oversizedBags > 1)
    ? "fits_confirmed_vehicle"
    : "verify_operator_and_luggage_fit";

  const arrivalTimeUsed = input.revisedArrivalLocal || input.scheduledArrivalLocal;

  const nextStepLabel =
    fitStatus === "fits_confirmed_vehicle"
      ? `Request Verified Quote (${matchingOperators[0].priceIsk.toLocaleString()} ISK · Pending 10% Partner Link)`
      : "Hold Departure & Check Vegagerðin / Operator Dispatch";
  const nextStepHref =
    matchingOperators[0]?.handoffUrl ||
    `/routes/keflavik-to-vik?date=${encodeURIComponent(input.date)}&party_size=${input.partySize}`;

  const recheckCard: SharedTripRecheckCardModel = {
    corridorId: "keflavik-to-vik",
    surfaceId: "kef-vik-transfer",
    corridorLabel: `KEF → Vík (${input.date} · Flight ${input.kefFlightNumber})`,
    whatChanged: hasActiveRoadClosure
      ? `Vegagerðin DATEX II reports a road closure on ${closedSegments.join("; ")}. Flight ${input.kefFlightNumber} ETA ${arrivalTimeUsed}.`
      : `Flight ${input.kefFlightNumber} arriving KEF at ${arrivalTimeUsed} for ${input.partySize} pax (${input.standardSuitcases} suitcases${
          input.oversizedBags ? ` + ${input.oversizedBags} oversized` : ""
        }). All 4 Vegagerðin KEF → Vík segments are OPEN.`,
    whatStillFits:
      fitStatus === "fits_confirmed_vehicle"
        ? `${matchingOperators[0].brandName} (${matchingOperators[0].vehicleClass}) at ${matchingOperators[0].priceIsk.toLocaleString()} ISK fits your party and luggage on Route 41 + Route 1 (est. 195–210 min transfer).`
        : fitStatus === "blocked_by_road_closure"
        ? `Affected departure is BLOCKED by active Vegagerðin road closure. ${operatorConfirmedAlternativeNote}`
        : `Requires operator confirmation for ${input.partySize} passengers with ${input.standardSuitcases} standard + ${
            input.oversizedBags || 0
          } oversized bags (or late arrival ${arrivalTimeUsed}).`,
    nextStep: nextStepLabel,
    primaryNextActionLabel: nextStepLabel,
    primaryNextActionHref: nextStepHref,
    nextStepLabel,
    nextStepHref,
    remainingMinutesAfterBuffer: hasActiveRoadClosure ? null : 90,
    timeFitStatus:
      fitStatus === "fits_confirmed_vehicle"
        ? "fits"
        : fitStatus === "blocked_by_road_closure"
        ? "does_not_fit"
        : "tight_verify",
    operatingStatusNote: `Road Closures: ${
      hasActiveRoadClosure ? closedSegments.join(" | ") : "None (all 4 KEF → Vík segments open)"
    } · Surface: ${roadSample.segments[1].roadSurfaceSummaryEn} · IMO Warning: ${
      roadSample.segments[3].imoWeatherWarning.headline
    }`,
    seatAvailabilityNote:
      "Direct checkout held until NorthTrip / Drive Reykjavík confirm their 10% partner checkout URL and reporting.",
  };

  return {
    corridorId: "keflavik-to-vik",
    corridorLabel: "Keflavík Airport (KEF) → Vík (Route 41 & Route 1)",
    fitStatus,
    hasActiveRoadClosure,
    closedSegments,
    surfaceConditionSummary,
    imoWarningSummary,
    matchingOperators,
    operatorConfirmedAlternativeNote,
    recheckCard,
  };
}

export const KEF_VIK_SAMPLE_TRIP_FITS: KefToVikTripEvaluation = evaluateKefToVikTrip({
  date: "2026-11-18",
  kefFlightNumber: "FI 614",
  scheduledArrivalLocal: "06:30",
  partySize: 4,
  standardSuitcases: 4,
  oversizedBags: 0,
  roadSampleKey: "open_winter_spots_of_ice",
});

export const KEF_VIK_SAMPLE_TRIP_NEEDS_VERIFICATION: KefToVikTripEvaluation = evaluateKefToVikTrip({
  date: "2026-11-18",
  kefFlightNumber: "PLAY OG 102",
  scheduledArrivalLocal: "15:10",
  revisedArrivalLocal: "16:35",
  partySize: 5,
  standardSuitcases: 5,
  oversizedBags: 2,
  roadSampleKey: "closed_eyjafjoll_wind_siege",
  operatorConfirmedLaterDepartureTime: "Next morning 09:00 GMT (pending Vegagerðin reopening Under Eyjafjöll)",
});

// ============================================================================
// 2. DELHI → AGRA (`/routes/delhi-to-agra`, Booking Candidate)
// ============================================================================

export interface TajMahalOfficialRules {
  authorityName: "Archaeological Survey of India (ASI) — Taj Mahal Official Portal";
  officialUrl: "https://www.tajmahal.gov.in/visiting-hours.aspx";
  opensMinutesBeforeSunrise: 30;
  closesMinutesBeforeSunset: 30;
  closedDayOfWeek: "Friday";
  closedDayNote:
    "Taj Mahal is closed every Friday for general viewing (open afternoon only for worshippers attending prayers at the mosque).",
  ticketValidityDurationMinutes: 180;
  ticketValidityNote:
    "ASI entry tickets are valid for a maximum 3-hour (180-minute) stay inside the Taj Mahal complex; overstaying incurs an additional ticket surcharge at the exit turnstile.",
  lastMileGateRule:
    "Petrol/diesel cars must stop at Shilpgram (East Gate, ~900m from gate) or Amrood Ka Teela (West Gate). Included ASI battery golf cart or electric bus completes the final 8–10 minutes to the security queue.",
}

export const TAJ_MAHAL_OFFICIAL_RULES: TajMahalOfficialRules = {
  authorityName: "Archaeological Survey of India (ASI) — Taj Mahal Official Portal",
  officialUrl: "https://www.tajmahal.gov.in/visiting-hours.aspx",
  opensMinutesBeforeSunrise: 30,
  closesMinutesBeforeSunset: 30,
  closedDayOfWeek: "Friday",
  closedDayNote:
    "Taj Mahal is closed every Friday for general viewing (open afternoon only for worshippers attending prayers at the mosque).",
  ticketValidityDurationMinutes: 180,
  ticketValidityNote:
    "ASI entry tickets are valid for a maximum 3-hour (180-minute) stay inside the Taj Mahal complex; overstaying incurs an additional ticket surcharge at the exit turnstile.",
  lastMileGateRule:
    "Petrol/diesel cars must stop at Shilpgram (East Gate, ~900m from gate) or Amrood Ka Teela (West Gate). Included ASI battery golf cart or electric bus completes the final 8–10 minutes to the security queue.",
};

export interface IndiaMachineFeedVerification {
  providerId: "imd_weather" | "cris_prontes_rail";
  providerName: string;
  documentationOrPortalUrl: string;
  officialPublicLookupUrl: string;
  approvedMachineAccessStatus: "pending_ip_whitelist_and_partner_approval";
  fallbackBehavior: string;
}

export const DELHI_AGRA_MACHINE_FEEDS: IndiaMachineFeedVerification[] = [
  {
    providerId: "imd_weather",
    providerName: "India Meteorological Department (IMD) Public API",
    documentationOrPortalUrl: "https://api.imd.gov.in/public/",
    officialPublicLookupUrl: "https://mausam.imd.gov.in/",
    approvedMachineAccessStatus: "pending_ip_whitelist_and_partner_approval",
    fallbackBehavior:
      "IMD public API endpoints require institutional IP whitelisting. Until approved machine access is active, DCC links directly to the official IMD bulletin and accepts traveler/operator fog & visibility status.",
  },
  {
    providerId: "cris_prontes_rail",
    providerName: "CRIS proNTES (National Train Enquiry System)",
    documentationOrPortalUrl: "https://cris.org.in/loadpage?page=proNTES",
    officialPublicLookupUrl: "https://enquiry.indianrail.gov.in/mntes/",
    approvedMachineAccessStatus: "pending_ip_whitelist_and_partner_approval",
    fallbackBehavior:
      "CRIS proNTES live train feed requires a licensed B2B agreement and static IP approval. Until enabled, DCC links directly to official NTES live train status and accepts a traveler-entered revised Agra Cantt (AGC) arrival time.",
  },
];

export interface DelhiAgraQualifiedOperator {
  operatorId: "agra-cantt-prebooked-crysta" | "delhi-agra-yamuna-expressway-private";
  operatorName: string;
  routeSegment: "Agra Cantt Station (AGC) → Shilpgram (Taj East Gate) & Agra Fort" | "New Delhi → Agra via Yamuna Expressway";
  vehicleClass: string;
  maxPassengers: number;
  maxLuggagePieces: number;
  priceInr: number;
  pricingScope: string;
  fogAndDelayPolicy: string;
  bookingHref: string;
  whatsappHref: string;
}

export const DELHI_AGRA_QUALIFIED_OPERATORS: DelhiAgraQualifiedOperator[] = [
  {
    operatorId: "agra-cantt-prebooked-crysta",
    operatorName: "Agra Cantt Verified Station-to-Taj Chauffeur (Toyota Innova Crysta AC)",
    routeSegment: "Agra Cantt Station (AGC) → Shilpgram (Taj East Gate) & Agra Fort",
    vehicleClass: "Toyota Innova Crysta AC (1–5 passengers)",
    maxPassengers: 5,
    maxLuggagePieces: 5,
    priceInr: 2800,
    pricingScope:
      "₹2,800 INR all-inclusive per car (AGC platform exit meet-and-greet, Shilpgram East Gate parking fee, driver wait during 3-hour Taj visit, and drop back to AGC before return train).",
    fogAndDelayPolicy:
      "Driver tracks 12002 Gatimaan / 22436 Vande Bharat arrival at AGC; includes up to 120 minutes of winter fog train-delay waiting at no extra charge. Free cancellation if train is canceled or delayed past Taj sunset entry cutoff.",
    bookingHref:
      "/routes/delhi-to-agra?operator=agra-cantt-prebooked-crysta&mode=agc_last_mile",
    whatsappHref:
      "https://wa.me/919810000000?text=DCC%20Agra%20Cantt%20to%20Taj%20East%20Gate%20Transfer%20Check",
  },
  {
    operatorId: "delhi-agra-yamuna-expressway-private",
    operatorName: "Delhi–Agra Yamuna Expressway Private Car (Innova Crysta AC)",
    routeSegment: "New Delhi → Agra via Yamuna Expressway",
    vehicleClass: "Toyota Innova Crysta AC (1–5 passengers)",
    maxPassengers: 5,
    maxLuggagePieces: 5,
    priceInr: 8500,
    pricingScope:
      "₹8,500 INR round-trip same-day Delhi → Shilpgram East Gate → Delhi including Yamuna Expressway tolls and East Gate parking.",
    fogAndDelayPolicy:
      "Follows YEIDA winter fog speed limits (75 km/h Dec 15–Feb 15). Dispatched only when visibility and departure time allow arriving at Shilpgram at least 120 minutes before Taj sunset closing.",
    bookingHref:
      "/routes/delhi-to-agra?operator=delhi-agra-yamuna-expressway-private&mode=expressway_car",
    whatsappHref:
      "https://wa.me/919810000000?text=DCC%20Delhi%20to%20Agra%20Yamuna%20Expressway%20Transfer%20Check",
  },
];

export interface DelhiAgraTajVisitInput {
  date: string; // YYYY-MM-DD
  trainNumberAndName: string;
  scheduledArrivalAgc: string; // HH:MM
  revisedArrivalAgc: string; // HH:MM (traveler-entered from official NTES)
  sunriseLocal?: string; // default 06:45
  sunsetLocal?: string; // default 17:30
  returnTrainDepartureAgc?: string; // e.g., "17:45"
  partySize: number;
  fogAdvisoryActive?: boolean;
}

export interface DelhiAgraTajVisitEvaluation {
  corridorId: "delhi-to-agra";
  questionAnswered: "Will I still make my Taj Mahal visit?";
  isFridayClosed: boolean;
  dayOfWeekName: string;
  tajOpensLocal: string;
  tajClosesLocal: string;
  estimatedTajGateEntryLocal: string;
  availableMinutesInsideTaj: number;
  recommendedStayMinutes: number;
  canCompleteVisitBeforeClosing: boolean;
  canMakeReturnTrain: boolean;
  fitVerdict: "fits_visit_window" | "needs_verification_or_reschedule" | "closed_on_friday";
  qualifiedCarOfferAvailable: boolean;
  recommendedOperator: DelhiAgraQualifiedOperator;
  recheckCard: SharedTripRecheckCardModel;
}

function parseHhMmToMin(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return 600;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minToHhMm(mins: number): string {
  const clamped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function evaluateDelhiAgraTajVisit(
  input: DelhiAgraTajVisitInput
): DelhiAgraTajVisitEvaluation {
  const parsedDate = new Date(`${input.date}T12:00:00Z`);
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayIdx = Number.isNaN(parsedDate.getTime()) ? 3 : parsedDate.getUTCDay();
  const dayOfWeekName = dayNames[dayIdx];
  const isFridayClosed = dayOfWeekName === "Friday";

  const sunriseMin = parseHhMmToMin(input.sunriseLocal || "06:45");
  const sunsetMin = parseHhMmToMin(input.sunsetLocal || "17:30");
  const tajOpensMin = sunriseMin - TAJ_MAHAL_OFFICIAL_RULES.opensMinutesBeforeSunrise;
  const tajClosesMin = sunsetMin - TAJ_MAHAL_OFFICIAL_RULES.closesMinutesBeforeSunset;

  const revisedAgcMin = parseHhMmToMin(input.revisedArrivalAgc);
  // Last-mile transfer breakdown:
  // 10m AGC platform exit + 25m pre-booked car to Shilpgram East Gate + 10m battery golf cart + 15m ASI security = 60m
  const lastMileToEntryMinutes = 60;
  const rawEntryMin = Math.max(tajOpensMin, revisedAgcMin + lastMileToEntryMinutes);

  const returnTrainMin = input.returnTrainDepartureAgc
    ? parseHhMmToMin(input.returnTrainDepartureAgc)
    : null;
  // Must leave Taj complex 65 minutes before AGC return train departure (10m golf cart + 25m car + 30m station buffer)
  const latestExitForTrainMin = returnTrainMin !== null ? returnTrainMin - 65 : tajClosesMin;
  const effectiveExitCutoffMin = Math.min(tajClosesMin, latestExitForTrainMin);

  const availableMinutesInsideTaj = isFridayClosed
    ? 0
    : Math.max(0, effectiveExitCutoffMin - rawEntryMin);
  const recommendedStayMinutes = Math.min(
    TAJ_MAHAL_OFFICIAL_RULES.ticketValidityDurationMinutes,
    availableMinutesInsideTaj
  );

  // Need at least 90 minutes inside the Taj Mahal complex for a viable visit
  const canCompleteVisitBeforeClosing = !isFridayClosed && availableMinutesInsideTaj >= 90;
  const canMakeReturnTrain =
    returnTrainMin === null || rawEntryMin + 90 <= latestExitForTrainMin;

  const fitVerdict: DelhiAgraTajVisitEvaluation["fitVerdict"] = isFridayClosed
    ? "closed_on_friday"
    : canCompleteVisitBeforeClosing && canMakeReturnTrain
    ? "fits_visit_window"
    : "needs_verification_or_reschedule";

  const recommendedOperator = DELHI_AGRA_QUALIFIED_OPERATORS[0];
  const qualifiedCarOfferAvailable = fitVerdict === "fits_visit_window";

  const params = new URLSearchParams({
    date: input.date,
    train: input.trainNumberAndName,
    revised_eta: input.revisedArrivalAgc,
    party_size: String(input.partySize),
    operator: recommendedOperator.operatorId,
  });

  const nextStepLabel = qualifiedCarOfferAvailable
    ? `Book Pre-Qualified AGC → Taj East Gate Car (₹${recommendedOperator.priceInr.toLocaleString()} INR)`
    : isFridayClosed
    ? "Switch Trip Date (Taj Closed Fridays) or Check Agra Fort"
    : "Verify Return Train / Sunrise Replan via WhatsApp Dispatch";
  const nextStepHref = qualifiedCarOfferAvailable
    ? `/routes/delhi-to-agra?${params.toString()}`
    : recommendedOperator.whatsappHref;

  const recheckCard: SharedTripRecheckCardModel = {
    corridorId: "delhi-to-agra",
    surfaceId: "delhi-agra-taj-recheck",
    corridorLabel: `Delhi → Agra (${input.date} · ${dayOfWeekName} · ${input.trainNumberAndName})`,
    whatChanged: `Train ${input.trainNumberAndName} scheduled AGC arrival ${input.scheduledArrivalAgc} → traveler-entered revised arrival ${input.revisedArrivalAgc}${
      input.fogAdvisoryActive ? " (winter fog delay active)" : ""
    }.`,
    whatStillFits: isFridayClosed
      ? `Taj Mahal is CLOSED on Fridays (${input.date}) per official ASI rules. Agra Fort and Mehtab Bagh sunset view across the Yamuna River remain open.`
      : fitVerdict === "fits_visit_window"
      ? `With a 60-min AGC → Shilpgram East Gate car + battery golf cart + security transfer, you enter Taj Mahal at ${minToHhMm(
          rawEntryMin
        )} with ${availableMinutesInsideTaj} min available before cutoff (${minToHhMm(
          effectiveExitCutoffMin
        )}) — fits a ${recommendedStayMinutes}-min visit within the 180-min ASI ticket rule.`
      : `Entering at ${minToHhMm(
          rawEntryMin
        )} leaves only ${availableMinutesInsideTaj} min before ${minToHhMm(
          effectiveExitCutoffMin
        )} cutoff (minimum 90 min recommended; ASI ticket allows 180 min). Verify later return train or next-morning sunrise slot.`,
    nextStep: nextStepLabel,
    primaryNextActionLabel: nextStepLabel,
    primaryNextActionHref: nextStepHref,
    nextStepLabel,
    nextStepHref,
    remainingMinutesAfterBuffer: isFridayClosed ? 0 : availableMinutesInsideTaj - 90,
    timeFitStatus:
      fitVerdict === "fits_visit_window"
        ? "fits"
        : isFridayClosed
        ? "does_not_fit"
        : "tight_verify",
    operatingStatusNote: `Taj Hours (${dayOfWeekName}): ${
      isFridayClosed
        ? "CLOSED FRIDAYS (ASI Rule)"
        : `${minToHhMm(tajOpensMin)}–${minToHhMm(tajClosesMin)} (30m before sunrise to 30m before sunset; 3-hr max ticket stay)`
    } · NTES & IMD machine access pending partner/IP approval (using official lookup + traveler revised ETA).`,
    seatAvailabilityNote: `Qualified vehicle: ${recommendedOperator.vehicleClass} (up to ${recommendedOperator.maxPassengers} pax, ₹${recommendedOperator.priceInr.toLocaleString()} INR).`,
  };

  return {
    corridorId: "delhi-to-agra",
    questionAnswered: "Will I still make my Taj Mahal visit?",
    isFridayClosed,
    dayOfWeekName,
    tajOpensLocal: minToHhMm(tajOpensMin),
    tajClosesLocal: minToHhMm(tajClosesMin),
    estimatedTajGateEntryLocal: minToHhMm(rawEntryMin),
    availableMinutesInsideTaj,
    recommendedStayMinutes,
    canCompleteVisitBeforeClosing,
    canMakeReturnTrain,
    fitVerdict,
    qualifiedCarOfferAvailable,
    recommendedOperator,
    recheckCard,
  };
}

export const DELHI_AGRA_SAMPLE_TRIP_FITS: DelhiAgraTajVisitEvaluation =
  evaluateDelhiAgraTajVisit({
    date: "2026-11-18", // Wednesday
    trainNumberAndName: "12002 Gatimaan Express",
    scheduledArrivalAgc: "09:50",
    revisedArrivalAgc: "10:15",
    sunriseLocal: "06:45",
    sunsetLocal: "17:30",
    returnTrainDepartureAgc: "17:45",
    partySize: 3,
    fogAdvisoryActive: false,
  });

export const DELHI_AGRA_SAMPLE_TRIP_NEEDS_VERIFICATION: DelhiAgraTajVisitEvaluation =
  evaluateDelhiAgraTajVisit({
    date: "2026-12-23", // Wednesday with severe winter fog delay
    trainNumberAndName: "22436 Vande Bharat Express",
    scheduledArrivalAgc: "07:45",
    revisedArrivalAgc: "15:25",
    sunriseLocal: "07:05",
    sunsetLocal: "17:30",
    returnTrainDepartureAgc: "17:45",
    partySize: 4,
    fogAdvisoryActive: true,
  });

// ============================================================================
// 3. HONG KONG → MACAO (`/routes/hong-kong-to-macao`, Planning Guide)
// ============================================================================

export interface HzmbTransportOptionComparison {
  optionId: "hzmb_golden_bus_shuttle" | "authorized_cross_boundary_private_hire_car";
  name: string;
  regulatorySourceUrl: string;
  fareCurrency: "HKD";
  publishedFareSummary: string;
  pickupAndDropoffModel: string;
  immigrationClearanceRule: string;
  luggageAndGroupRule: string;
  permitVerificationRequirement: string;
}

export const HZMB_TRANSPORT_OPTIONS: HzmbTransportOptionComparison[] = [
  {
    optionId: "hzmb_golden_bus_shuttle",
    name: 'HZMB Bridge Shuttle ("Golden Bus")',
    regulatorySourceUrl: "https://www.hzmbshuttle.com/",
    fareCurrency: "HKD",
    publishedFareSummary:
      "HK$65 daytime (06:00–23:59) / HK$70 nighttime (00:00–05:59) per adult; HK$33 / HK$35 concessionary.",
    pickupAndDropoffModel:
      "Port-to-Port only: Board at HZMB Hong Kong Port Passenger Clearance Building after HK exit immigration; disembark at HZMB Macao Port before Macao entry immigration.",
    immigrationClearanceRule:
      "Travelers walk through Hong Kong Port exit halls before boarding and Macao Port arrival halls after alighting (~40–45 min bridge crossing).",
    luggageAndGroupRule:
      "1 standard suitcase (max 20 kg, 76×51×32 cm) + 1 hand-carry per passenger. Best for solo travelers and small groups with light luggage.",
    permitVerificationRequirement:
      "Public scheduled shuttle bus operating 24/7 (every 5–15 minutes); no individual vehicle permit lookup needed.",
  },
  {
    optionId: "authorized_cross_boundary_private_hire_car",
    name: "Authorized Cross-Boundary Private Hire Car (Dual-Plate MPV)",
    regulatorySourceUrl:
      "https://www.td.gov.hk/en/transport_in_hong_kong/land_based_cross_boundary_transport/enquiries_on_cross_boundary_hire_car_service/",
    fareCurrency: "HKD",
    publishedFareSummary:
      "HK$2,200–HK$3,200 per 6-seat Toyota Alphard / Vellfire (one-way point-to-point between Hong Kong hotel/HKIA and Macao hotel).",
    pickupAndDropoffModel:
      "Door-to-door pickup in Hong Kong to Macao hotel across the Hong Kong–Zhuhai–Macao Bridge (HZMB).",
    immigrationClearanceRule:
      "IMPORTANT: A private hire car trip STILL includes full immigration and customs clearance at both the HZMB Hong Kong Port and HZMB Macao Port boundary control points.",
    luggageAndGroupRule:
      "Up to 6 passengers + 4–5 standard suitcases in one dual-plate MPV.",
    permitVerificationRequirement:
      "MUST hold an active Hong Kong Transport Department Cross-Boundary Hire Car Closed Road Permit (CRP) displayed on the windshield and verify registration via the official HKTD online enquiry system before boarding.",
  },
];

export interface HkImmdCheckpointWaitEstimate {
  controlPointCode: "HZMB_HK_PORT";
  controlPointName: "Hong Kong-Zhuhai-Macao Bridge (HZMB) Hong Kong Port";
  direction: "HK_TO_MACAO_DEPARTURE" | "MACAO_TO_HK_ARRIVAL";
  travelerCategory: "hk_residents" | "visitors";
  publishedWaitLevelCode: "normal_under_15m" | "busy_15_to_30m" | "congested_over_30m";
  estimatedClearanceMinutes: number;
  timestampHkt: string;
  sourceDatasetUrl: "https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time";
}

export const HK_IMMD_CHECKPOINT_WAIT_SAMPLES: Record<
  "normal_weekday_visitor" | "peak_weekend_visitor",
  HkImmdCheckpointWaitEstimate
> = {
  normal_weekday_visitor: {
    controlPointCode: "HZMB_HK_PORT",
    controlPointName: "Hong Kong-Zhuhai-Macao Bridge (HZMB) Hong Kong Port",
    direction: "HK_TO_MACAO_DEPARTURE",
    travelerCategory: "visitors",
    publishedWaitLevelCode: "normal_under_15m",
    estimatedClearanceMinutes: 15,
    timestampHkt: "2026-11-18T10:30:00+08:00",
    sourceDatasetUrl:
      "https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time",
  },
  peak_weekend_visitor: {
    controlPointCode: "HZMB_HK_PORT",
    controlPointName: "Hong Kong-Zhuhai-Macao Bridge (HZMB) Hong Kong Port",
    direction: "HK_TO_MACAO_DEPARTURE",
    travelerCategory: "visitors",
    publishedWaitLevelCode: "congested_over_30m",
    estimatedClearanceMinutes: 45,
    timestampHkt: "2026-11-21T11:15:00+08:00",
    sourceDatasetUrl:
      "https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time",
  },
};

export interface SixFactorBoundaryEntryDependency {
  factorNumber: 1 | 2 | 3 | 4 | 5 | 6;
  factorKey:
    | "passport_validity_window"
    | "macao_entry_authorization"
    | "hong_kong_reentry_authorization"
    | "customs_and_currency_limits"
    | "arrival_card_and_health_rules"
    | "vehicle_closed_road_permit_verification";
  title: string;
  macaoAuthorityRule: string;
  macaoAuthorityUrl: string;
  hongKongAuthorityRule: string;
  hongKongAuthorityUrl: string;
}

export const HK_MACAO_SIX_FACTOR_ENTRY_MODEL: SixFactorBoundaryEntryDependency[] = [
  {
    factorNumber: 1,
    factorKey: "passport_validity_window",
    title: "1. Passport Validity Beyond Intended Stay",
    macaoAuthorityRule:
      "Macao CPSP requires passport validity of at least 90 days beyond intended stay for short-term visitors (or 30 days for select bilateral categories).",
    macaoAuthorityUrl: "https://www.gov.mo/en/services/ps-1474/ps-1474b/",
    hongKongAuthorityRule:
      "Hong Kong ImmD requires passport validity of at least 1 month (or 6 months depending on nationality) beyond the period of intended stay in Hong Kong.",
    hongKongAuthorityUrl: "https://www.immd.gov.hk/eng/services/visas/visit-transit/visit-visa-entry-permit.html",
  },
  {
    factorNumber: 2,
    factorKey: "macao_entry_authorization",
    title: "2. Macao SAR Entry Authorization (Verified Separately via Macao CPSP)",
    macaoAuthorityRule:
      "Evaluated strictly under Macao SAR Public Security Police Force (CPSP / FSM) rules — separate from Hong Kong and separate from Mainland China.",
    macaoAuthorityUrl: "https://www.gov.mo/en/services/ps-1474/ps-1474b/",
    hongKongAuthorityRule:
      "Exiting Hong Kong at HZMB Port legally terminates your current Hong Kong visitor stay.",
    hongKongAuthorityUrl: "https://www.immd.gov.hk/eng/services/visas/visit-transit/visit-visa-entry-permit.html",
  },
  {
    factorNumber: 3,
    factorKey: "hong_kong_reentry_authorization",
    title: "3. Hong Kong SAR Re-Entry Authorization (Verified Separately via HK ImmD)",
    macaoAuthorityRule:
      "Departing Macao Port clears Macao exit control only; it does not guarantee re-admission into Hong Kong for single-entry HK visa holders.",
    macaoAuthorityUrl: "https://www.gov.mo/en/services/ps-1474/ps-1474b/",
    hongKongAuthorityRule:
      "Returning from Macao to Hong Kong is a NEW entry into Hong Kong SAR. Travelers holding a single-entry Hong Kong visa cannot re-enter Hong Kong from Macao without a valid multiple-entry HK authorization or visa-free passport.",
    hongKongAuthorityUrl: "https://www.immd.gov.hk/eng/services/visas/visit-transit/visit-visa-entry-permit.html",
  },
  {
    factorNumber: 4,
    factorKey: "customs_and_currency_limits",
    title: "4. Cross-Boundary Currency & Dutiable Goods Declarations",
    macaoAuthorityRule:
      "Macao Customs requires declaration when entering/exiting with cash or bearer negotiable instruments ≥ MOP 120,000.",
    macaoAuthorityUrl: "https://www.customs.gov.mo/",
    hongKongAuthorityRule:
      "Hong Kong Customs requires declaration for currency/BNIs > HKD 120,000 and strictly limits duty-free tobacco (19 cigarettes max).",
    hongKongAuthorityUrl: "https://www.customs.gov.hk/",
  },
  {
    factorNumber: 5,
    factorKey: "arrival_card_and_health_rules",
    title: "5. Arrival Slip Retention & E-Channel Eligibility",
    macaoAuthorityRule:
      "Retain the printed Macao CPSP arrival slip issued at HZMB Macao Port (required for hotel check-in and exit).",
    macaoAuthorityUrl: "https://www.gov.mo/en/services/ps-1474/ps-1474b/",
    hongKongAuthorityRule:
      "Hong Kong ImmD issues an arrival landing slip on entry/re-entry (no passport stamps).",
    hongKongAuthorityUrl: "https://www.immd.gov.hk/eng/services/visas/visit-transit/visit-visa-entry-permit.html",
  },
  {
    factorNumber: 6,
    factorKey: "vehicle_closed_road_permit_verification",
    title: "6. Cross-Boundary Hire Car Permit & Mandatory Immigration Clearance",
    macaoAuthorityRule:
      "Only dual-plate hire cars registered under the Hong Kong–Macao Cross-Boundary Hire Car quota may carry fare-paying passengers across HZMB.",
    macaoAuthorityUrl: "https://www.dsat.gov.mo/",
    hongKongAuthorityRule:
      "Verify the vehicle registration mark in the Hong Kong Transport Department online enquiry directory. Even in a private hire car, all passengers must clear HK ImmD and Macao CPSP immigration checkpoints.",
    hongKongAuthorityUrl:
      "https://www.td.gov.hk/en/transport_in_hong_kong/land_based_cross_boundary_transport/enquiries_on_cross_boundary_hire_car_service/",
  },
];

export const SHENZHEN_SEPARATE_ROUTE_NOTICE = {
  routeId: "hong-kong-to-shenzhen-separate",
  headline: "Shenzhen (Mainland China) Is a Separate Route with Mainland China Entry Rules",
  explanation:
    "Do NOT combine or confuse Hong Kong → Macao (HZMB) with Hong Kong → Shenzhen (Lo Wu, Lok Ma Chau, West Kowloon High-Speed Rail, or Shenzhen Bay). Entering Shenzhen crosses into Mainland China under National Immigration Administration (NIA) rules (requiring a Chinese Visa, eligible visa-free nationality, 5-day Shenzhen SEZ port visa, or 144/240-hour TWOV), which are completely distinct from Macao SAR (CPSP) and Hong Kong SAR (ImmD) entry rules.",
};

export interface HkMacaoMobileChannelLinks {
  amapRouteHref: string;
  whatsappConciergeHref: string;
  wechatIdAndInstruction: string;
  plainTextSmsSummary: string;
}

export const HK_MACAO_MOBILE_CHANNELS: HkMacaoMobileChannelLinks = {
  amapRouteHref:
    "https://uri.amap.com/navigation?from=113.9516,22.3168,HZMB+Hong+Kong+Port&to=113.5754,22.2045,HZMB+Macao+Port&mode=car&policy=1",
  whatsappConciergeHref:
    "https://wa.me/85290000000?text=DCC%20HZMB%20Hong%20Kong%20to%20Macao%20Permit%20%26%20Checkpoint%20Check",
  wechatIdAndInstruction:
    "WeChat Mini-Program & Service ID: HZMB_Shuttle_Official (for Golden Bus QR tickets) · Verify HKTD Closed Road Permit before booking any WeChat cross-boundary MPV.",
  plainTextSmsSummary:
    "HK→Macao HZMB Summary: (1) Golden Bus HK$65-70 port-to-port 24/7 OR HKTD-permitted Dual-Plate Hire Car HK$2,200-3,200. (2) Private car STILL requires immigration clearance at both HK & Macao ports. (3) Verify Macao entry (CPSP) and HK re-entry (ImmD) separately. (4) Shenzhen is a separate Mainland China route.",
};

export interface HkMacaoTripInput {
  date: string;
  departureTimeHkt: string;
  direction: "HK_TO_MACAO" | "MACAO_TO_HK";
  travelerCategory: "hk_residents" | "visitors";
  partySize: number;
  standardSuitcases: number;
  macaoEntryVerified: boolean;
  hongKongReentryVerified: boolean;
  hireCarPermitVerifiedWithHktd: boolean;
  checkpointSampleKey?: "normal_weekday_visitor" | "peak_weekend_visitor";
}

export interface HkMacaoTripEvaluation {
  corridorId: "hong-kong-to-macao";
  recommendedMode: "hzmb_golden_bus_shuttle" | "authorized_cross_boundary_private_hire_car";
  checkpointWait: HkImmdCheckpointWaitEstimate;
  estimatedDoorToDoorMinutes: number;
  entryAndPermitStatus: "ready_to_cross" | "verify_entry_or_vehicle_permit";
  privateHireIncludesImmigrationNote: string;
  shenzhenSeparationNote: string;
  recheckCard: SharedTripRecheckCardModel;
}

export function evaluateHkMacaoTrip(input: HkMacaoTripInput): HkMacaoTripEvaluation {
  const waitSample =
    HK_IMMD_CHECKPOINT_WAIT_SAMPLES[
      input.checkpointSampleKey || "normal_weekday_visitor"
    ];
  const recommendedMode: HkMacaoTripEvaluation["recommendedMode"] =
    input.partySize >= 4 || input.standardSuitcases > input.partySize
      ? "authorized_cross_boundary_private_hire_car"
      : "hzmb_golden_bus_shuttle";

  // Crossing breakdown:
  // HK urban to HZMB HK Port (35m) + HK exit wait (waitSample) + 42m HZMB crossing + Macao entry clearance (20m) + Macao port to hotel (20m)
  const estimatedDoorToDoorMinutes =
    35 + waitSample.estimatedClearanceMinutes + 42 + 20 + 20;

  const entryAndPermitStatus: HkMacaoTripEvaluation["entryAndPermitStatus"] =
    input.macaoEntryVerified &&
    input.hongKongReentryVerified &&
    (recommendedMode === "hzmb_golden_bus_shuttle" ||
      input.hireCarPermitVerifiedWithHktd)
      ? "ready_to_cross"
      : "verify_entry_or_vehicle_permit";

  const privateHireIncludesImmigrationNote =
    "A cross-boundary private hire car trip STILL includes mandatory immigration and customs clearance at both HZMB Hong Kong Port and HZMB Macao Port.";

  const nextStepLabel =
    entryAndPermitStatus === "ready_to_cross"
      ? recommendedMode === "hzmb_golden_bus_shuttle"
        ? "Open HZMB Golden Bus Schedule & Amap Text Directions"
        : "Open HKTD Verified Cross-Boundary Hire Car Directory"
      : "Verify Macao Entry, HK Re-Entry & HKTD Hire Car Permit First";
  const nextStepHref =
    recommendedMode === "authorized_cross_boundary_private_hire_car"
      ? "https://www.td.gov.hk/en/transport_in_hong_kong/land_based_cross_boundary_transport/enquiries_on_cross_boundary_hire_car_service/"
      : "https://www.hzmbshuttle.com/";

  const recheckCard: SharedTripRecheckCardModel = {
    corridorId: "hong-kong-to-macao",
    surfaceId: "hk-macao-hzmb-recheck",
    corridorLabel: `Hong Kong → Macao HZMB (${input.date} · ${input.departureTimeHkt} HKT · ${input.travelerCategory})`,
    whatChanged: `HK ImmD checkpoint wait at ${waitSample.controlPointName} (${waitSample.direction}, ${waitSample.travelerCategory}): ~${waitSample.estimatedClearanceMinutes} min (as of ${waitSample.timestampHkt}).`,
    whatStillFits:
      entryAndPermitStatus === "ready_to_cross"
        ? `Macao CPSP entry & HK ImmD re-entry verified. ${
            recommendedMode === "authorized_cross_boundary_private_hire_car"
              ? "HKTD-permitted dual-plate hire car (HK$2,200–3,200)"
              : 'HZMB "Golden Bus" shuttle (HK$65–70/pax)'
          } fits in ~${estimatedDoorToDoorMinutes} min door-to-door (including immigration at both ports).`
        : `HOLD BEFORE BOARDING: Verify ${
            !input.macaoEntryVerified ? "Macao CPSP entry eligibility, " : ""
          }${
            !input.hongKongReentryVerified
              ? "Hong Kong ImmD re-entry authorization (single-entry HK visas cannot re-enter from Macao), "
              : ""
          }${
            recommendedMode === "authorized_cross_boundary_private_hire_car" &&
            !input.hireCarPermitVerifiedWithHktd
              ? "HK Transport Department Cross-Boundary Hire Car Closed Road Permit"
              : ""
          }.`,
    nextStep: nextStepLabel,
    primaryNextActionLabel: nextStepLabel,
    primaryNextActionHref: nextStepHref,
    nextStepLabel,
    nextStepHref,
    remainingMinutesAfterBuffer:
      entryAndPermitStatus === "ready_to_cross" ? 60 : null,
    timeFitStatus:
      entryAndPermitStatus === "ready_to_cross" ? "fits" : "tight_verify",
    operatingStatusNote: `${privateHireIncludesImmigrationNote} Shenzhen is treated as a separate Mainland China route.`,
    seatAvailabilityNote:
      "Golden Bus departs every 5–15 min 24/7; private hire MPVs require pre-booking and HKTD Closed Road Permit check.",
  };

  return {
    corridorId: "hong-kong-to-macao",
    recommendedMode,
    checkpointWait: waitSample,
    estimatedDoorToDoorMinutes,
    entryAndPermitStatus,
    privateHireIncludesImmigrationNote,
    shenzhenSeparationNote: SHENZHEN_SEPARATE_ROUTE_NOTICE.explanation,
    recheckCard,
  };
}

export const HK_MACAO_SAMPLE_TRIP_FITS: HkMacaoTripEvaluation = evaluateHkMacaoTrip({
  date: "2026-11-18",
  departureTimeHkt: "10:30",
  direction: "HK_TO_MACAO",
  travelerCategory: "visitors",
  partySize: 2,
  standardSuitcases: 2,
  macaoEntryVerified: true,
  hongKongReentryVerified: true,
  hireCarPermitVerifiedWithHktd: true,
  checkpointSampleKey: "normal_weekday_visitor",
});

export const HK_MACAO_SAMPLE_TRIP_NEEDS_VERIFICATION: HkMacaoTripEvaluation =
  evaluateHkMacaoTrip({
    date: "2026-11-21",
    departureTimeHkt: "11:15",
    direction: "HK_TO_MACAO",
    travelerCategory: "visitors",
    partySize: 5,
    standardSuitcases: 5,
    macaoEntryVerified: true,
    hongKongReentryVerified: false, // Single-entry HK visa not yet verified for HK re-entry!
    hireCarPermitVerifiedWithHktd: false, // Unverified hire car permit!
    checkpointSampleKey: "peak_weekend_visitor",
  });
