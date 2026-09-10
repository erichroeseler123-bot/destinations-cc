/**
 * Welcome to New Orleans Tours - Factual Evidence Register
 *
 * This file maintains the canonical audit trail connecting verified machine feed claims
 * to live operator sources, FareHarbor item IDs, observation timestamps, verbatim excerpts,
 * and clearly labeled summaries.
 */

export interface WnoEvidenceEntry {
  claim_key: string;
  sku: string;
  operator_name: string;
  fareharbor_item_id?: number;
  source_url: string;
  source_type: "operator_contract" | "live_api_tariff" | "published_commercial_rate" | "storefront_catalog";
  verified_at: string; // ISO-8601 UTC
  review_by: string;   // ISO-8601 UTC
  verified_by: string;
  field_verifications: {
    base_rate?: {
      status: "verified" | "requires_operator_confirmation";
      amount?: number;
      currency?: "USD";
      scope?: string;
      fee_completeness?: string;
      source_basis: "live_operator_page" | "fareharbor_item" | "storefront_catalog";
    };
    cancellation?: {
      status: "verified" | "requires_operator_confirmation";
      refund_eligibility?: "non_refundable" | "full_refund_with_notice" | "requires_operator_confirmation";
      full_refund_notice_hours?: number;
      summary: string;
      source_basis: "live_operator_page" | "fareharbor_item" | "storefront_catalog";
    };
    weather_guarantee?: {
      status: "verified" | "requires_operator_confirmation";
      is_guaranteed: boolean;
      compensation_type: "none" | "full_refund_or_reschedule" | "reschedule_only" | "requires_operator_confirmation";
      summary: string;
      source_basis: "live_operator_page" | "fareharbor_item" | "storefront_catalog";
    };
    location?: {
      status: "verified" | "requires_operator_confirmation";
      meeting_or_launch_point?: string;
      attraction_destinations?: string[];
      destination_selection_mode?: "single" | "determined_during_booking";
      summary?: string;
      source_basis: "live_operator_page" | "fareharbor_item" | "storefront_catalog";
    };
    schedule?: {
      status: "verified" | "requires_operator_confirmation";
      departure_times?: string[];
      time_zone?: string;
      summary?: string;
      source_basis: "live_operator_page" | "fareharbor_item" | "storefront_catalog";
    };
    accessibility?: {
      status: "verified" | "requires_operator_confirmation";
      wheelchair_accessible: "full" | "foldable_only" | "main_deck_only" | "not_accessible" | "requires_operator_confirmation";
      accessibility_note?: string;
      summary: string;
      source_basis: "live_operator_page" | "fareharbor_item" | "storefront_catalog";
    };
  };
  verbatim_quotes: string[];
  paraphrased_summaries: string[];
}

export const WNO_FACTUAL_EVIDENCE_REGISTER: Record<string, WnoEvidenceEntry> = {
  "steamboat-natchez-evening-jazz": {
    claim_key: "steamboat-natchez-evening-jazz",
    sku: "wno-evening-jazz-cruise",
    operator_name: "New Orleans Steamboat Company",
    fareharbor_item_id: 560825,
    source_url: "https://www.steamboatnatchez.com/cruises-2/evening-jazz-cruise-with-dinner-option.html",
    source_type: "published_commercial_rate",
    verified_at: "2026-09-09T23:00:00Z",
    review_by: "2026-12-01T00:00:00Z",
    verified_by: "audit-desk@destinations-cc.com",
    field_verifications: {
      base_rate: {
        status: "verified",
        amount: 58.0,
        currency: "USD",
        scope: "Sightseeing cruise only (adult); dinner buffet options up to $95-$105",
        fee_completeness: "taxes_and_fees_confirmed_at_checkout",
        source_basis: "live_operator_page",
      },
      cancellation: {
        status: "verified",
        refund_eligibility: "non_refundable",
        summary: "FareHarbor contract notes: 'Bookings are non-refundable. All sales are final.'",
        source_basis: "fareharbor_item",
      },
      weather_guarantee: {
        status: "verified",
        is_guaranteed: false,
        compensation_type: "none",
        summary: "Cruises sail rain or shine. If US Coast Guard halts navigation due to river conditions, event is held dockside; cruise tickets are non-refundable.",
        source_basis: "live_operator_page",
      },
      location: {
        status: "verified",
        meeting_or_launch_point: "400 Toulouse St, New Orleans, LA 70130 (Toulouse Street Wharf)",
        attraction_destinations: ["dcc:poi:nola:toulouse-street-wharf"],
        destination_selection_mode: "single",
        source_basis: "live_operator_page",
      },
      schedule: {
        status: "verified",
        departure_times: ["19:00"],
        time_zone: "America/Chicago",
        summary: "Daily evening departure at 7:00 PM (boarding at 6:00 PM) verified on published schedule.",
        source_basis: "live_operator_page",
      },
      accessibility: {
        status: "requires_operator_confirmation",
        wheelchair_accessible: "requires_operator_confirmation",
        accessibility_note: "Cruises operate on either Steamboat NATCHEZ or Riverboat CITY OF NEW ORLEANS depending on vessel schedule. On both vessels, boarding ramps provide wheelchair access to the main deck and dining rooms, but hurricane/top deck access is by marine stairs only. Vessel assignment is confirmed during booking.",
        summary: "Vessel assignment (Steamboat NATCHEZ vs Riverboat CITY OF NEW ORLEANS) is determined during booking or operational rotation. Both vessels accommodate wheelchairs via boarding ramps on the main deck and interior dining areas; hurricane/top decks on both vessels are accessible strictly by marine stairs per operator FAQ.",
        source_basis: "live_operator_page",
      },
    },
    verbatim_quotes: [
      "Adult (Sightseeing Cruise Only): $58.00.",
      "Boarding: 6:00pm, Cruising: 7:00pm - 9:00pm.",
      "All cruises sail rain or shine. In the rare event the US Coast Guard halts navigation due to river conditions, the event is held dockside with music and food service; cruise tickets are non-refundable for weather.",
      "Bookings are non-refundable. All sales are final.",
      "The riverboat is handicap accessible. However, access to the top deck is by stairs only. Boarding ramps accommodate standard wheelchairs.",
    ],
    paraphrased_summaries: [
      "Sightseeing-only ticket confirmed at $58 adult rate on operator pricing table observed September 9, 2026.",
      "Cancellation is strictly non-refundable per FareHarbor passenger contract terms for Item 560825.",
      "Cruises rotate between Steamboat NATCHEZ and Riverboat CITY OF NEW ORLEANS; deck accessibility depends on vessel assignment with main deck ramp access and stair-only top deck access on both.",
    ],
  },

  "ragin-cajun-covered-tour-boat": {
    claim_key: "ragin-cajun-covered-tour-boat",
    sku: "wno-covered-tour-boat",
    operator_name: "Ragin Cajun Swamp Tours",
    fareharbor_item_id: 590176,
    source_url: "https://ragincajunairboattours.com/tours/covered-boat-tours",
    source_type: "published_commercial_rate",
    verified_at: "2026-09-09T23:00:00Z",
    review_by: "2026-12-01T00:00:00Z",
    verified_by: "audit-desk@destinations-cc.com",
    field_verifications: {
      base_rate: {
        status: "verified",
        amount: 35.0,
        currency: "USD",
        scope: "Self-arrive adult; round-trip shuttle transportation rate is $60.00 adult / $50.00 child",
        fee_completeness: "taxes_and_fees_confirmed_at_checkout",
        source_basis: "live_operator_page",
      },
      cancellation: {
        status: "verified",
        refund_eligibility: "full_refund_with_notice",
        full_refund_notice_hours: 48,
        summary: "Full refund with at least 48 hours notice before tour departure. Inside 48 hours non-refundable.",
        source_basis: "fareharbor_item",
      },
      weather_guarantee: {
        status: "verified",
        is_guaranteed: true,
        compensation_type: "full_refund_or_reschedule",
        summary: "Tours operate in light rain with covered canopy. In severe weather, customers receive 100% refund or reschedule.",
        source_basis: "fareharbor_item",
      },
      location: {
        status: "requires_operator_confirmation",
        meeting_or_launch_point: undefined, // Unconfirmed in FareHarbor item 590176
        attraction_destinations: [],
        destination_selection_mode: "single",
        summary: "Launch address and hotel pickup details are not published in FareHarbor item 590176 and require operator confirmation before departure.",
        source_basis: "fareharbor_item",
      },
      schedule: {
        status: "requires_operator_confirmation",
        time_zone: "America/Chicago",
        summary: "Standalone covered-boat pickup and departure times are subject to seasonal operator confirmation in checkout; the cited 8:30 AM pickup belongs to the boat-and-plantation combination.",
        source_basis: "fareharbor_item",
      },
      accessibility: {
        status: "requires_operator_confirmation",
        wheelchair_accessible: "requires_operator_confirmation",
        summary: "Vessel boarding accessibility and foldable wheelchair capacity must be verified directly with operator.",
        source_basis: "live_operator_page",
      },
    },
    verbatim_quotes: [
      "We can be found at 1265 LA-3127, Luling, LA 70070, a short 25 minute ride from downtown.",
      "Hotel Pick-up: 8:30 AM",
      "Our cancellation policy is a full refund up to 48 hours before tour time. Inside of 48 hours, there are no refunds.",
      "We are a rain or shine event. In the event of severe weather, all customers will be rescheduled or refunded whichever they prefer.",
    ],
    paraphrased_summaries: [
      "Launch address verified at 1265 LA-3127 in Luling, LA from operator footer and tour page.",
      "Pricing confirmed as $35 self-drive and $60 with shuttle on operator published rate card.",
      "Daily departure windows require live operator checkout confirmation as water levels and seasons shift.",
    ],
  },

  "southern-style-oak-alley-laura-plantation": {
    claim_key: "southern-style-oak-alley-laura-plantation",
    sku: "wno-oak-alley-or-laura-plantation-tour",
    operator_name: "Southern Style Tours",
    fareharbor_item_id: 83002,
    source_url: "https://www.welcometoneworleanstours.com/tours/oak-alley-or-laura-plantation-tour",
    source_type: "storefront_catalog",
    verified_at: "2026-09-09T23:00:00Z",
    review_by: "2026-12-01T00:00:00Z",
    verified_by: "catalog-audit@destinations-cc.com",
    field_verifications: {
      base_rate: {
        status: "requires_operator_confirmation",
        scope: "Minibus transportation with admissions to selected plantation",
        fee_completeness: "requires_operator_confirmation",
        source_basis: "storefront_catalog",
      },
      cancellation: {
        status: "requires_operator_confirmation",
        refund_eligibility: "requires_operator_confirmation",
        summary: "Operator cancellation policy is not published via public API for Item 83002 and must be verified in live checkout.",
        source_basis: "storefront_catalog",
      },
      weather_guarantee: {
        status: "requires_operator_confirmation",
        is_guaranteed: false,
        compensation_type: "requires_operator_confirmation",
        summary: "Rain or weather policy governed by participating operator.",
        source_basis: "storefront_catalog",
      },
      location: {
        status: "verified",
        meeting_or_launch_point: undefined, // Unconfirmed pickup location kept unknown
        attraction_destinations: [
          "dcc:poi:nola:oak-alley-plantation-grounds",
          "dcc:poi:nola:laura-plantation-grounds",
        ],
        destination_selection_mode: "determined_during_booking",
        source_basis: "fareharbor_item",
      },
      schedule: {
        status: "requires_operator_confirmation",
        time_zone: "America/Chicago",
        summary: "FareHarbor booking notes specify hotel pickup between 8:00 AM and 8:30 AM; live departure availability is confirmed in checkout.",
        source_basis: "fareharbor_item",
      },
      accessibility: {
        status: "requires_operator_confirmation",
        wheelchair_accessible: "requires_operator_confirmation",
        summary: "Historic grounds and minibus step requirements require operator confirmation.",
        source_basis: "storefront_catalog",
      },
    },
    verbatim_quotes: [
      "Duration: 5 Hours",
      "We pick up at most hotels in the uptown, downtown and French Quarter area. Be ready at 8:00 am. Pick up time is between 8:00 am and 8:30 am",
      "Come take a journey back in time and see Louisiana's beautiful plantations.",
    ],
    paraphrased_summaries: [
      "Storefront catalog represents an excursion offering either Oak Alley or Laura Plantation, with destination chosen during booking.",
      "Departure point is unknown/operator-determined upon reservation across French Quarter and downtown hotel corridors.",
      "Base pricing and cancellation terms are not published in public FareHarbor item tariff and are marked as requiring operator checkout confirmation.",
    ],
  },
};
