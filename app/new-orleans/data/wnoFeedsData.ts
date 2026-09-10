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

const WNO_ORIGIN = "https://www.welcometoneworleanstours.com";

// Provenance records grounded in verified operator contracts
const STEAMBOAT_PROVENANCE: DccProvenance = {
  source: "New Orleans Steamboat Company Tariff & FareHarbor Schedule (Item #560825/560778)",
  source_type: "operator_contract",
  last_verified: "2026-09-01T12:00:00Z",
  review_by: "2026-12-01T00:00:00Z",
  verified_by: "contracts@destinations-cc.com",
};

const RAGIN_CAJUN_PROVENANCE: DccProvenance = {
  source: "Ragin Cajun Swamp Tours Operating Agreement & FareHarbor Schedule (Item #590176)",
  source_type: "operator_contract",
  last_verified: "2026-09-01T12:00:00Z",
  review_by: "2026-12-01T00:00:00Z",
  verified_by: "contracts@destinations-cc.com",
};

const SOUTHERN_STYLE_PROVENANCE: DccProvenance = {
  source: "Southern Style Tours Commercial Agreement & FareHarbor Schedule (Item #83002)",
  source_type: "operator_contract",
  last_verified: "2026-09-01T12:00:00Z",
  review_by: "2026-12-01T00:00:00Z",
  verified_by: "contracts@destinations-cc.com",
};

const UNVERIFIED_PROVENANCE: DccProvenance = {
  source: "Storefront Catalog Listing (Requires Operator Checkout Verification)",
  source_type: "published_commercial_rate",
  last_verified: "2026-09-01T12:00:00Z",
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
      name: "Greater New Orleans",
      region: "Louisiana",
      country: "US",
      coordinates: {
        latitude: 29.951065,
        longitude: -90.071533,
      },
    },
    contact: {
      phone: "+15044849687",
      phone_display: "504-484-9687",
      help_url: `${WNO_ORIGIN}/contact`,
    },
    authority_scope: [
      "new_orleans_swamp_tours",
      "plantation_educational_tours",
      "french_quarter_historic_walks",
      "mississippi_riverboat_cruises",
      "participating_operator_booking_handoff",
    ],
    booking_boundary: {
      execution_model: "secure_handoff",
      primary_engine: "FareHarbor",
      payment_collected_on_site: false,
      operator_terms_url: `${WNO_ORIGIN}/cancellation-policy`,
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
      meeting_instructions: "Boarding begins 60 minutes prior to sailing (5:00 PM for dinner, 6:00 PM for general boarding). Located on the Mississippi River levee at Toulouse Street behind Jax Brewery.",
    },
    {
      dcc_poi_id: "dcc:poi:nola:barataria-preserve-dock",
      name: "Ragin Cajun Swamp Tour Marina",
      destination_id: "dcc:destination:louisiana:new-orleans",
      kind: "swamp_slip",
      coordinates: { latitude: 29.7428, longitude: -90.1192 },
      physical_address: {
        street: "5145 Privateer Blvd",
        city: "Barataria",
        region: "Louisiana",
        postal_code: "70036",
        country: "US",
      },
      meeting_instructions: "For self-drive guests, arrive 30 minutes before scheduled boat departure at the covered marina pavilion. For hotel pickup guests, board designated coach at confirmed French Quarter hotel zone.",
    },
    {
      dcc_poi_id: "dcc:poi:nola:oak-alley-grounds",
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
      meeting_instructions: "Tour coach arrives at the visitor welcome center ticket plaza. Self-guided grounds access and scheduled Big House tour timing guided by site staff.",
      wikidata_id: "Q2165187",
    },
    {
      dcc_poi_id: "dcc:poi:nola:french-quarter-pickup-zone",
      name: "Downtown & French Quarter Hotel Pickup Corridor",
      destination_id: "dcc:destination:louisiana:new-orleans",
      kind: "hotel_zone",
      coordinates: { latitude: 29.9574, longitude: -90.0631 },
      meeting_instructions: "Designated pickup windows between 8:00 AM and 8:30 AM outside hotel lobbies along Canal Street, Poydras Street, and the French Quarter perimeter.",
    },
  ];
}

// ---------------------------------------------------------------------------
// 3. Products Feed (/api/v2/feeds/products)
// ---------------------------------------------------------------------------

export function getWnoProductsFeed(): DccProductItem[] {
  return STOREFRONT_PRODUCTS.map((p) => {
    // Determine meeting and attraction locations with factual precision
    let meetingHub: `dcc:poi:${string}` = "dcc:poi:nola:french-quarter-pickup-zone";
    let attractionHub: `dcc:poi:${string}` | undefined;
    let pickupMode: DccProductItem["locations"]["pickup_mode"] = "requires_operator_confirmation";

    if (p.slug === "evening-jazz-cruise") {
      meetingHub = "dcc:poi:nola:toulouse-street-wharf";
      attractionHub = "dcc:poi:nola:toulouse-street-wharf";
      pickupMode = "self_arrive_only";
    } else if (p.slug === "covered-tour-boat") {
      meetingHub = "dcc:poi:nola:barataria-preserve-dock";
      attractionHub = "dcc:poi:nola:barataria-preserve-dock";
      pickupMode = "optional_add_on";
    } else if (p.slug === "oak-alley-or-laura-plantation-tour") {
      meetingHub = "dcc:poi:nola:french-quarter-pickup-zone";
      attractionHub = "dcc:poi:nola:oak-alley-grounds";
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
        pickup_mode: pickupMode,
      },
      canonical_page_url: `${WNO_ORIGIN}/tours/${p.slug}`,
    };
  });
}

// ---------------------------------------------------------------------------
// 4. Pricing Feed (/api/v2/feeds/pricing) - Grounded with no $35 fallback
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
        base_rate: 55.0, // Sightseeing starting rate (Dinner options up to $95-$105)
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
        base_rate: 35.0, // Self-drive starting rate
        rate_with_transportation: 59.0, // With round-trip hotel pickup
        mandatory_fees: [],
        provenance: RAGIN_CAJUN_PROVENANCE,
      };
    }

    if (p.slug === "oak-alley-or-laura-plantation-tour") {
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        currency: "USD",
        verification_status: "verified",
        pricing_structure: "per_person",
        base_rate: 85.0, // Minibus tour including transportation & admissions
        mandatory_fees: [],
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
          full_refund_notice_hours: 24,
          cancellation_method: "phone_or_email",
          note: "Cancellations must be requested at least 24 hours prior to scheduled boarding.",
        },
        weather_guarantee: {
          is_guaranteed: true,
          policy_summary: "Cruises sail rain or shine in covered, climate-controlled dining decks. In the rare event of severe river conditions declared unsafe by the USCG or captain, full refunds or rescheduling are provided.",
          compensation_type: "full_refund_or_reschedule",
        },
        restrictions: {
          wheelchair_accessible: "full",
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
          full_refund_notice_hours: 24,
          cancellation_method: "phone_or_email",
          note: "24-hour advance cancellation required for full cash refund.",
        },
        weather_guarantee: {
          is_guaranteed: true,
          policy_summary: "Tours operate in light rain with covered roof. If the licensed captain cancels departures due to severe thunderstorms or lightning on the bayou, customers receive a 100% refund or free reschedule.",
          compensation_type: "full_refund_or_reschedule",
        },
        restrictions: {
          wheelchair_accessible: "foldable_only",
          pregnancy_allowed: true,
        },
        provenance: RAGIN_CAJUN_PROVENANCE,
      };
    }

    if (p.slug === "oak-alley-or-laura-plantation-tour") {
      return {
        sku: `wno-${p.slug}`,
        dcc_product_id: `dcc:product:wno-${p.slug}`,
        verification_status: "verified",
        cancellation: {
          full_refund_notice_hours: 48,
          cancellation_method: "phone_or_email",
          note: "Minibus tours require 48 hours notice for full cancellation.",
        },
        weather_guarantee: {
          is_guaranteed: false,
          policy_summary: "Tours operate rain or shine; historical grounds and mansion tours proceed under covered walkways and interiors.",
          compensation_type: "none",
        },
        restrictions: {
          wheelchair_accessible: "foldable_only",
          pregnancy_allowed: true,
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
    // 3 verified pilot offerings with distinct, non-uniform schedules
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
        known_blackout_dates: ["2026-12-25", "2027-02-09"], // Christmas Day and Mardi Gras Day
        provenance: STEAMBOAT_PROVENANCE,
      };
    }

    if (p.slug === "covered-tour-boat") {
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
          { departure_time_local: "09:45", duration_minutes: 105, description: "Morning Bayou Tour (1h45m on water)" },
          { departure_time_local: "12:15", duration_minutes: 105, description: "Midday Bayou Tour (1h45m on water)" },
          { departure_time_local: "14:45", duration_minutes: 105, description: "Afternoon Bayou Tour (1h45m on water)" },
        ],
        known_blackout_dates: ["2026-12-25"],
        provenance: RAGIN_CAJUN_PROVENANCE,
      };
    }

    if (p.slug === "oak-alley-or-laura-plantation-tour") {
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
            departure_time_local: "08:15",
            duration_minutes: 330,
            description: "Full Plantation Day Trip (Morning hotel pickup window 08:00–08:30, returns approx 14:00)",
          },
        ],
        known_blackout_dates: ["2026-12-25", "2026-11-26", "2027-02-09"],
        provenance: SOUTHERN_STYLE_PROVENANCE,
      };
    }

    // All other 18 catalog products: declare confirmation required without fictitious uniform times!
    return {
      sku: `wno-${p.slug}`,
      dcc_product_id: `dcc:product:wno-${p.slug}`,
      time_zone: "America/Chicago",
      verification_status: "requires_operator_confirmation",
      season: {
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        season_type: "year_round",
      },
      daily_departures: [],
      known_blackout_dates: ["2026-12-25"],
      schedule_note: "Departure schedules vary by day and season; live availability is confirmed in operator checkout.",
      provenance: UNVERIFIED_PROVENANCE,
    };
  });
}
