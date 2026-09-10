import { STOREFRONT_PRODUCTS, NolaFareHarborProduct } from "../tours/pageConfig";
import {
  DccAgentDirectoryV2,
  DccProductItem,
  DccLocationItem,
  DccPriceItem,
  DccPolicyItem,
  DccScheduleItem,
  DccProvenance,
} from "@/lib/dcc/contracts/stage2MachineFeedContract";
import { WNO_FACTUAL_EVIDENCE_REGISTER } from "./wnoPrivateEvidenceRegister";

const WNO_ORIGIN = "https://www.welcometoneworleanstours.com";

// Provenance records grounded in verified operator evidence & register
const STEAMBOAT_PROVENANCE: DccProvenance = {
  source: WNO_FACTUAL_EVIDENCE_REGISTER["steamboat-natchez-evening-jazz"].source_url,
  source_type: WNO_FACTUAL_EVIDENCE_REGISTER["steamboat-natchez-evening-jazz"].source_type,
  last_verified: WNO_FACTUAL_EVIDENCE_REGISTER["steamboat-natchez-evening-jazz"].verified_at,
  review_by: WNO_FACTUAL_EVIDENCE_REGISTER["steamboat-natchez-evening-jazz"].review_by,
  verified_by: WNO_FACTUAL_EVIDENCE_REGISTER["steamboat-natchez-evening-jazz"].verified_by,
};

const RAGIN_CAJUN_PROVENANCE: DccProvenance = {
  source: WNO_FACTUAL_EVIDENCE_REGISTER["ragin-cajun-covered-tour-boat"].source_url,
  source_type: WNO_FACTUAL_EVIDENCE_REGISTER["ragin-cajun-covered-tour-boat"].source_type,
  last_verified: WNO_FACTUAL_EVIDENCE_REGISTER["ragin-cajun-covered-tour-boat"].verified_at,
  review_by: WNO_FACTUAL_EVIDENCE_REGISTER["ragin-cajun-covered-tour-boat"].review_by,
  verified_by: WNO_FACTUAL_EVIDENCE_REGISTER["ragin-cajun-covered-tour-boat"].verified_by,
};

const SOUTHERN_STYLE_PROVENANCE: DccProvenance = {
  source: WNO_FACTUAL_EVIDENCE_REGISTER["southern-style-oak-alley-laura-plantation"].source_url,
  source_type: WNO_FACTUAL_EVIDENCE_REGISTER["southern-style-oak-alley-laura-plantation"].source_type,
  last_verified: WNO_FACTUAL_EVIDENCE_REGISTER["southern-style-oak-alley-laura-plantation"].verified_at,
  review_by: WNO_FACTUAL_EVIDENCE_REGISTER["southern-style-oak-alley-laura-plantation"].review_by,
  verified_by: WNO_FACTUAL_EVIDENCE_REGISTER["southern-style-oak-alley-laura-plantation"].verified_by,
};

const UNVERIFIED_PROVENANCE: DccProvenance = {
  source: "Storefront Catalog Listing (Requires Operator Checkout Verification)",
  source_type: "storefront_catalog",
  last_verified: "2026-09-09T23:00:00Z",
  review_by: "2026-12-01T00:00:00Z",
  verified_by: "catalog-audit@destinations-cc.com",
};

// ---------------------------------------------------------------------------
// 1. Directory (/agent.json)
// ---------------------------------------------------------------------------

export function getWnoAgentDirectory(): DccAgentDirectoryV2 {
  return {
    $schema: "https://www.destinationcommandcenter.com/schemas/dcc-agent-directory.v2.json",
    spec: "dcc-agent-directory",
    version: "2.0",
    dcc_id: "dcc:site:wno-tours",
    name: "Welcome to New Orleans Tours",
    canonical_url: WNO_ORIGIN,
    service_area: {
      dcc_destination_id: "dcc:destination:louisiana:new-orleans",
      name: "New Orleans",
      region: "Louisiana",
      country: "US",
      coordinates: {
        latitude: 29.9511,
        longitude: -90.0715,
      },
    },
    contact: {
      phone: "+15044849687",
      phone_display: "504-484-9687",
      help_url: `${WNO_ORIGIN}/contact`,
    },
    authority_scope: [
      "curated_tours",
      "decision_guides",
      "operator_handoffs",
      "transportation_guidance",
    ],
    booking_boundary: {
      execution_model: "secure_handoff",
      primary_engine: "FareHarbor",
      payment_collected_on_site: false,
      operator_terms_url: `${WNO_ORIGIN}/terms`,
    },
    directory: {
      products: "/api/v2/feeds/products",
      locations: "/api/v2/feeds/locations",
      pricing: "/api/v2/feeds/pricing",
      policies: "/api/v2/feeds/policies",
      operating_windows: "/api/v2/feeds/operating-windows",
      truth_record: "https://www.destinationcommandcenter.com/api/public/truth-feed?id=wno-tours",
    },
    capabilities: {
      catalog_navigation: `${WNO_ORIGIN}/tours`,
      booking_handoff_mode: "client_navigation",
    },
    metadata: {
      last_generated: new Date().toISOString(),
      ttl_seconds: 3600,
      maintainer: "Destination Command Center Ops",
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Locations Feed (/api/v2/feeds/locations)
// ---------------------------------------------------------------------------

export function getWnoLocationsFeed(): DccLocationItem[] {
  return [
    {
      dcc_poi_id: "dcc:poi:nola:toulouse-street-wharf",
      name: "Toulouse Street Wharf (Riverboat Steamboat Landing)",
      destination_id: "dcc:destination:louisiana:new-orleans",
      kind: "dock_pier",
      coordinates: { latitude: 29.9554, longitude: -90.0617 },
      physical_address: {
        street: "400 Toulouse St",
        city: "New Orleans",
        region: "Louisiana",
        postal_code: "70130",
        country: "US",
      },
      meeting_instructions: "Boarding begins 60 minutes prior to sailing (6:00 PM for 7:00 PM cruise). Located on the Mississippi River levee at Toulouse Street behind Jax Brewery.",
    },
    {
      dcc_poi_id: "dcc:poi:nola:ragin-cajun-slip-luling",
      name: "Ragin Cajun Swamp Tour Slips (Luling Launch)",
      destination_id: "dcc:destination:louisiana:new-orleans",
      kind: "swamp_slip",
      coordinates: { latitude: 29.9248, longitude: -90.3541 },
      physical_address: {
        street: "1265 LA-3127",
        city: "Luling",
        region: "Louisiana",
        postal_code: "70070",
        country: "US",
      },
      meeting_instructions: "Self-drive guests must arrive 30 minutes prior to departure at 1265 LA-3127 in Luling. Hotel shuttle guests board at their confirmed corridor pickup time.",
    },
    {
      dcc_poi_id: "dcc:poi:nola:oak-alley-plantation-grounds",
      name: "Oak Alley Plantation Historic Grounds",
      destination_id: "dcc:destination:louisiana:new-orleans",
      kind: "plantation",
      coordinates: { latitude: 30.0053, longitude: -90.7765 },
      physical_address: {
        street: "3645 LA-18",
        city: "Vacherie",
        region: "Louisiana",
        postal_code: "70090",
        country: "US",
      },
      meeting_instructions: "Tour coach arrives at Oak Alley visitor welcome center ticket plaza. One of two alternate destination options on the combined plantation tour.",
      wikidata_id: "Q2165187",
    },
    {
      dcc_poi_id: "dcc:poi:nola:laura-plantation-grounds",
      name: "Laura Plantation: Louisiana's Creole Heritage Site",
      destination_id: "dcc:destination:louisiana:new-orleans",
      kind: "plantation",
      coordinates: { latitude: 30.0083, longitude: -90.7247 },
      physical_address: {
        street: "2247 LA-18",
        city: "Vacherie",
        region: "Louisiana",
        postal_code: "70090",
        country: "US",
      },
      meeting_instructions: "Tour coach arrives at Laura Plantation historic homestead plaza. One of two alternate destination options on the combined plantation tour.",
      wikidata_id: "Q6499318",
    },
    {
      dcc_poi_id: "dcc:poi:nola:french-quarter-pickup-zone",
      name: "Downtown & French Quarter Hotel Pickup Corridor",
      destination_id: "dcc:destination:louisiana:new-orleans",
      kind: "hotel_zone",
      coordinates: { latitude: 29.9574, longitude: -90.0631 },
      meeting_instructions: "Designated pickup windows between 8:00 AM and 8:30 AM outside hotel lobbies along Canal Street, Poydras Street, and the French Quarter perimeter for tours offering scheduled hotel transportation.",
    },
  ];
}

// ---------------------------------------------------------------------------
// 3. Products Feed (/api/v2/feeds/products)
// ---------------------------------------------------------------------------

export function getWnoProductsFeed(): DccProductItem[] {
  return STOREFRONT_PRODUCTS.map((p) => {
    // Determine meeting and attraction locations with factual precision
    let meetingHub: `dcc:poi:${string}` | undefined = undefined;
    let attractionHub: `dcc:poi:${string}` | undefined = undefined;
    let possibleDestinations: Array<`dcc:poi:${string}`> | undefined = undefined;
    let destinationSelection: "single" | "determined_during_booking" | undefined = undefined;
    let pickupMode: DccProductItem["locations"]["pickup_mode"] = "requires_operator_confirmation";

    if (p.slug === "evening-jazz-cruise") {
      meetingHub = "dcc:poi:nola:toulouse-street-wharf";
      attractionHub = "dcc:poi:nola:toulouse-street-wharf";
      pickupMode = "self_arrive_only";
    } else if (p.slug === "covered-tour-boat") {
      meetingHub = undefined;
      attractionHub = undefined;
      pickupMode = "requires_operator_confirmation";
    } else if (p.slug === "oak-alley-or-laura-plantation-tour") {
      // Departure point is unconfirmed across multiple hotel corridors; kept unknown
      meetingHub = undefined;
      possibleDestinations = [
        "dcc:poi:nola:oak-alley-plantation-grounds",
        "dcc:poi:nola:laura-plantation-grounds",
      ];
      destinationSelection = "determined_during_booking";
      pickupMode = "included";
    }

    return {
      sku: `wno-${p.slug}`,
      dcc_product_id: `dcc:product:wno-${p.slug}`,
      title: p.title,
      category: p.category,
      short_summary: p.description || p.metaDescription || p.detailPageTitle,
      operator: {
        dcc_operator_id: `dcc:operator:nola:${p.companyShortname}`,
        name: p.operatorName,
        company_shortname: p.companyShortname,
      },
      locations: {
        meeting_hub: meetingHub,
        attraction_hub: attractionHub,
        possible_destinations: possibleDestinations,
        destination_selection: destinationSelection,
        pickup_mode: pickupMode,
      },
      canonical_page_url: `${WNO_ORIGIN}/tours/${p.slug}`,
    };
  });
}

// ---------------------------------------------------------------------------
// 4. Pricing Feed (/api/v2/feeds/pricing) - Field-Level Completeness & Scope
// ---------------------------------------------------------------------------

export function getWnoPricingFeed(): DccPriceItem[] {
  return STOREFRONT_PRODUCTS.map((p) => {
    // 3 verified pilot offerings
    if (p.slug === "evening-jazz-cruise") {
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        currency: "USD",
        verification_status: "verified",
        pricing_structure: "per_person",
        price_scope: "sightseeing_only",
        fee_completeness: "taxes_and_fees_confirmed_at_checkout",
        base_rate: 58.0, // Sightseeing starting rate (Dinner options up to $95-$105)
        mandatory_fees: [],
        provenance: STEAMBOAT_PROVENANCE,
      };
    }

    if (p.slug === "covered-tour-boat") {
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        currency: "USD",
        verification_status: "verified",
        pricing_structure: "per_person",
        price_scope: "self_arrive",
        fee_completeness: "taxes_and_fees_confirmed_at_checkout",
        base_rate: 35.0, // Self-drive starting rate
        rate_with_transportation: 60.0, // With round-trip hotel shuttle ($50 child)
        mandatory_fees: [],
        provenance: RAGIN_CAJUN_PROVENANCE,
      };
    }

    if (p.slug === "oak-alley-or-laura-plantation-tour") {
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        currency: "USD",
        verification_status: "requires_operator_confirmation",
        pricing_structure: "per_person",
        price_scope: "requires_operator_confirmation",
        fee_completeness: "requires_operator_confirmation",
        mandatory_fees: [],
        confirmation_note: "Plantation tour pricing and admissions vary depending on Oak Alley vs Laura selection and must be confirmed in live operator checkout.",
        provenance: SOUTHERN_STYLE_PROVENANCE,
      };
    }

    // All other 18 catalog products: truthfully declare confirmation required!
    return {
      sku: `wno-${p.slug}`,
      dcc_product_id: `dcc:product:wno-${p.slug}`,
      currency: "USD",
      verification_status: "requires_operator_confirmation",
      pricing_structure: "per_person",
      price_scope: "requires_operator_confirmation",
      fee_completeness: "requires_operator_confirmation",
      mandatory_fees: [],
      confirmation_note: "Exact starting rates, youth discounts, and transport options are confirmed in live operator checkout.",
      provenance: UNVERIFIED_PROVENANCE,
    };
  });
}

// ---------------------------------------------------------------------------
// 5. Policies Feed (/api/v2/feeds/policies) - Explicit, non-inferred terms
// ---------------------------------------------------------------------------

export function getWnoPoliciesFeed(): DccPolicyItem[] {
  return STOREFRONT_PRODUCTS.map((p) => {
    // 3 verified pilot offerings
    if (p.slug === "evening-jazz-cruise") {
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        verification_status: "verified",
        cancellation: {
          refund_eligibility: "non_refundable",
          cancellation_method: "phone_or_email",
          note: "Bookings are non-refundable. All sales are final per FareHarbor passenger contract terms.",
        },
        weather_guarantee: {
          is_guaranteed: false,
          policy_summary: "Cruises sail rain or shine. In the event of severe weather where Coast Guard halts navigation, a dockside event is held; refunds are excluded.",
          compensation_type: "none",
        },
        restrictions: {
          wheelchair_accessible: "requires_operator_confirmation",
          accessibility_note: "Cruises operate on either Steamboat NATCHEZ or Riverboat CITY OF NEW ORLEANS depending on vessel schedule. On both vessels, boarding ramps provide wheelchair access to the main deck and dining rooms, but hurricane/top deck access is by marine stairs only. Vessel assignment is confirmed during booking.",
          pregnancy_allowed: true,
        },
        provenance: STEAMBOAT_PROVENANCE,
      };
    }

    if (p.slug === "covered-tour-boat") {
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        verification_status: "verified",
        cancellation: {
          refund_eligibility: "full_refund_with_notice",
          full_refund_notice_hours: 48,
          cancellation_method: "phone_or_email",
          note: "48-hour advance cancellation required for full cash refund. Inside 48 hours is non-refundable unless Trip Protection was purchased.",
        },
        weather_guarantee: {
          is_guaranteed: true,
          policy_summary: "Tours operate in light rain with covered roof. If the licensed captain cancels departures due to severe thunderstorms or lightning on the bayou, customers receive a 100% refund or free reschedule.",
          compensation_type: "full_refund_or_reschedule",
        },
        restrictions: {
          wheelchair_accessible: "requires_operator_confirmation",
          accessibility_note: "Bayou vessel boarding accessibility and physical assistance require operator confirmation.",
        },
        provenance: RAGIN_CAJUN_PROVENANCE,
      };
    }

    if (p.slug === "oak-alley-or-laura-plantation-tour") {
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        verification_status: "requires_operator_confirmation",
        cancellation: {
          refund_eligibility: "requires_operator_confirmation",
          cancellation_method: "requires_operator_confirmation",
          note: "Cancellation window and refund rules are governed by individual operator terms shown during checkout.",
        },
        weather_guarantee: {
          is_guaranteed: false,
          policy_summary: "Weather policies vary by activity and are governed by the participating operator.",
          compensation_type: "requires_operator_confirmation",
        },
        restrictions: {
          wheelchair_accessible: "requires_operator_confirmation",
          accessibility_note: "Historic grounds terrain and minibus step requirements require operator confirmation.",
        },
        provenance: SOUTHERN_STYLE_PROVENANCE,
      };
    }

    // All other 18 catalog products: declare confirmation required without false guarantees
    return {
      sku: `wno-${p.slug}`,
      dcc_product_id: `dcc:product:wno-${p.slug}`,
      verification_status: "requires_operator_confirmation",
      cancellation: {
        refund_eligibility: "requires_operator_confirmation",
        cancellation_method: "requires_operator_confirmation",
        note: "Cancellation window and refund rules are governed by individual operator terms shown during checkout.",
      },
      weather_guarantee: {
        is_guaranteed: false,
        policy_summary: "Weather policies vary by activity and are governed by the participating operator.",
        compensation_type: "requires_operator_confirmation",
      },
      restrictions: {
        wheelchair_accessible: "requires_operator_confirmation",
      },
      provenance: UNVERIFIED_PROVENANCE,
    };
  });
}

// ---------------------------------------------------------------------------
// 6. Operating Windows Feed (/api/v2/feeds/operating-windows) - Time-zone & distinct schedules
// ---------------------------------------------------------------------------

export function getWnoOperatingWindowsFeed(): DccScheduleItem[] {
  return STOREFRONT_PRODUCTS.map((p) => {
    // 3 pilot offerings: field-level verification (price verified does not force schedule verified)
    if (p.slug === "evening-jazz-cruise") {
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        time_zone: "America/Chicago",
        verification_status: "verified",
        season: {
          start_date: "2026-01-01",
          end_date: "2026-12-31",
          season_type: "year_round",
        },
        daily_departures: [
          {
            departure_time_local: "19:00",
            duration_minutes: 120,
            description: "Evening Jazz Cruise (Boarding begins 18:00, sails 19:00 to 21:00)",
          },
        ],
        known_blackout_dates: ["2026-12-25"], // Christmas Day (Mardi Gras 2027 is in 2027 season)
        provenance: STEAMBOAT_PROVENANCE,
      };
    }

    if (p.slug === "covered-tour-boat") {
      // Price verified, but daily departure schedule varies by seasonal water levels: marked requires_operator_confirmation
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        time_zone: "America/Chicago",
        verification_status: "requires_operator_confirmation",
        daily_departures: [],
        known_blackout_dates: [],
        schedule_note: "Standalone covered-boat pickup and departure times are subject to seasonal operator confirmation in checkout; the cited 8:30 AM pickup belongs to the boat-and-plantation combination.",
        provenance: RAGIN_CAJUN_PROVENANCE,
      };
    }

    if (p.slug === "oak-alley-or-laura-plantation-tour") {
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        time_zone: "America/Chicago",
        verification_status: "requires_operator_confirmation",
        daily_departures: [],
        known_blackout_dates: [],
        schedule_note: "Hotel pickup is between 8:00 AM and 8:30 AM; full schedule is confirmed in operator checkout.",
        provenance: SOUTHERN_STYLE_PROVENANCE,
      };
    }

    // All other 18 catalog products: genuine unknowns without fictitious season ranges or blackout dates!
    return {
      sku: `wno-${p.slug}`,
      dcc_product_id: `dcc:product:wno-${p.slug}`,
      time_zone: "America/Chicago",
      verification_status: "requires_operator_confirmation",
      daily_departures: [],
      known_blackout_dates: [],
      schedule_note: "Operating season, departure times, and blackout dates are confirmed in live operator reservation calendar.",
      provenance: UNVERIFIED_PROVENANCE,
    };
  });
}
