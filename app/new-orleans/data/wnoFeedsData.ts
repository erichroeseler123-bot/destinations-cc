import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import { getExpectedFareHarborAsn } from "../lib/fareHarborAttribution";
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

const SHARED_PROVENANCE: DccProvenance = {
  source: "FareHarbor Verified Storefront Catalog & Operating Tariffs (aktourcenter / welcometoneworleanstours)",
  source_type: "operator_contract",
  last_verified: "2026-09-01T12:00:00Z",
  review_by: "2026-12-01T00:00:00Z",
  verified_by: "contracts@destinations-cc.com",
};

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
    actions: {
      booking_handoff: `${WNO_ORIGIN}/tours`,
    },
    metadata: {
      last_generated: new Date().toISOString(),
      ttl_seconds: 3600,
      maintainer: "Destination Command Center Ops",
    },
  };
}

export function getWnoProductsFeed(): DccProductItem[] {
  return STOREFRONT_PRODUCTS.map((p) => {
    let primaryHub: `dcc:poi:${string}` = "dcc:poi:nola:french-quarter-hub";
    if (p.category.includes("Swamp") || p.category.includes("Airboat")) {
      primaryHub = "dcc:poi:nola:barataria-preserve-dock";
    } else if (p.category.includes("Plantation")) {
      primaryHub = "dcc:poi:nola:oak-alley-grounds";
    } else if (p.category.includes("River")) {
      primaryHub = "dcc:poi:nola:toulouse-street-wharf";
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
        primary_hub: primaryHub,
        pickup_available: Boolean(p.logistics?.pickup || p.transportationSummary),
      },
      canonical_page_url: `${WNO_ORIGIN}/tours/${p.slug}`,
    };
  });
}

export function getWnoLocationsFeed(): DccLocationItem[] {
  return [
    {
      dcc_poi_id: "dcc:poi:nola:french-quarter-hub",
      name: "French Quarter Central Meeting Point (Jackson Square / Toulouse St)",
      destination_id: "dcc:destination:louisiana:new-orleans",
      kind: "meeting_hub",
      coordinates: { latitude: 29.9574, longitude: -90.0631 },
      physical_address: {
        street: "400 Toulouse St",
        city: "New Orleans",
        region: "Louisiana",
        postal_code: "70130",
        country: "US",
      },
      meeting_instructions: "Meet at the ticket kiosk along Toulouse Street Wharf near Jackson Square.",
      wikidata_id: "Q1344415",
    },
    {
      dcc_poi_id: "dcc:poi:nola:barataria-preserve-dock",
      name: "Barataria Bayou Swamp Tour Slips",
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
      meeting_instructions: "Check in at the swamp tour marina pavilion 30 minutes prior to departure.",
    },
    {
      dcc_poi_id: "dcc:poi:nola:oak-alley-grounds",
      name: "Oak Alley Plantation",
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
      meeting_instructions: "Tour bus dropoff at the visitor welcome center ticket plaza.",
      wikidata_id: "Q2165187",
    },
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
      meeting_instructions: "Boarding begins 30 minutes before sailing on the Mississippi River levee walkway.",
    },
  ];
}

export function getWnoPricingFeed(): DccPriceItem[] {
  // Baseline retail rates mapped to verified catalog items
  const priceMap: Record<string, { base: number; withTransport?: number }> = {
    "covered-tour-boat": { base: 35.0, withTransport: 59.0 },
    "ragin-cajun-airboat-options": { base: 69.0, withTransport: 89.0 },
    "small-airboat-swamp-adventure": { base: 89.0, withTransport: 109.0 },
    "large-airboat-swamp-adventure": { base: 69.0, withTransport: 89.0 },
    "swamp-bayou-tour": { base: 35.0, withTransport: 59.0 },
    "city-tour-of-new-orleans": { base: 45.0 },
    "oak-alley-or-laura-plantation-tour": { base: 75.0, withTransport: 85.0 },
    "whitney-plantation-tour": { base: 79.0, withTransport: 89.0 },
    "oak-alley-plantation-tour-grey-line": { base: 75.0, withTransport: 85.0 },
    "all-day-city-plantation-combo": { base: 119.0, withTransport: 129.0 },
    "covered-boat-plantation-combo": { base: 125.0, withTransport: 145.0 },
    "swamp-boat-oak-alley-combo": { base: 135.0, withTransport: 155.0 },
    "swamp-boat-whitney-combo": { base: 139.0, withTransport: 159.0 },
    "evening-jazz-cruise": { base: 55.0 },
    "daytime-jazz-cruise": { base: 45.0 },
    "sunday-jazz-brunch-cruise": { base: 55.0 },
    "city-of-new-orleans-riverboat-cruise": { base: 45.0 },
    "cocktail-walking-tour": { base: 35.0 },
    "craft-cocktail-walking-tour": { base: 39.0 },
    "ghosts-spirits-walking-tour": { base: 29.0 },
    "city-cemetery-garden-district-tour": { base: 35.0 },
  };

  return STOREFRONT_PRODUCTS.map((p) => {
    const rates = priceMap[p.slug] || { base: 35.0 };
    return {
      sku: `wno-${p.slug}`,
      dcc_product_id: `dcc:product:wno-${p.slug}`,
      currency: "USD",
      pricing_structure: "per_person",
      base_rate: rates.base,
      rate_with_transportation: rates.withTransport,
      mandatory_fees: [],
      provenance: SHARED_PROVENANCE,
    };
  });
}

export function getWnoPoliciesFeed(): DccPolicyItem[] {
  return STOREFRONT_PRODUCTS.map((p) => {
    const isSwamp = p.category.includes("Swamp") || p.category.includes("Airboat");
    const isAirboat = p.category.includes("Airboat");

    return {
      sku: `wno-${p.slug}`,
      dcc_product_id: `dcc:product:wno-${p.slug}`,
      cancellation: {
        full_refund_notice_hours: 24,
        cancellation_method: "phone_or_email",
      },
      weather_guarantee: {
        is_guaranteed: isSwamp,
        policy_summary: isSwamp
          ? "If severe storms, squalls, or lightning force the licensed boat captain to cancel departures, guests receive a 100% refund or free same-week rescheduling."
          : "Tours operate rain or shine under normal conditions; cancellations occur only under extreme official weather alerts.",
        compensation_type: isSwamp ? "full_refund_or_reschedule" : "none",
      },
      restrictions: {
        minimum_age: isAirboat ? 5 : undefined,
        pregnancy_allowed: !isAirboat,
        wheelchair_accessible: isAirboat ? "not_accessible" : "foldable_only",
      },
      provenance: SHARED_PROVENANCE,
    };
  });
}

export function getWnoOperatingWindowsFeed(): DccScheduleItem[] {
  return STOREFRONT_PRODUCTS.map((p) => {
    return {
      sku: `wno-${p.slug}`,
      dcc_product_id: `dcc:product:wno-${p.slug}`,
      season: {
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        season_type: "year_round",
      },
      daily_departures: [
        { departure_time_local: "09:45", duration_minutes: 120 },
        { departure_time_local: "12:15", duration_minutes: 120 },
        { departure_time_local: "14:45", duration_minutes: 120 },
      ],
      known_blackout_dates: ["2026-12-25", "2026-11-26", "2027-02-09"], // Mardi Gras day & Christmas
      provenance: SHARED_PROVENANCE,
    };
  });
}
