/**
 * Welcome to New Orleans Tours - Factual Evidence Register
 *
 * This file maintains the canonical audit trail connecting verified machine feed claims
 * to live operator sources, FareHarbor item IDs, observation timestamps, and verified text.
 */

export interface WnoEvidenceEntry {
  claim_key: string;
  sku: string;
  operator_name: string;
  fareharbor_item_id?: number;
  source_url: string;
  source_type: "operator_contract" | "live_api_tariff" | "published_commercial_rate";
  verified_at: string;
  review_by: string;
  verified_by: string;
  verified_facts: {
    base_rate?: number;
    rate_with_transportation?: number;
    cancellation_notice_hours?: number;
    cancellation_policy_summary?: string;
    weather_guarantee?: boolean;
    weather_terms_summary?: string;
    dock_or_departure_location?: string;
    schedule_departures?: string[];
  };
  exact_source_quote: string;
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
    verified_facts: {
      base_rate: 58.0, // Adult Sightseeing Only
      cancellation_notice_hours: 24,
      cancellation_policy_summary: "Cancellations must be requested at least 24 hours prior to scheduled cruise departure for refund.",
      weather_guarantee: false, // Cruises sail rain or shine; dockside event if severe river conditions halt navigation; no refunds for rain/river conditions
      weather_terms_summary: "We cruise rain or shine. In the event of severe weather where Coast Guard halts navigation, a dockside event is held; refunds are excluded.",
      dock_or_departure_location: "400 Toulouse St, New Orleans, LA 70130 (Toulouse Street Wharf behind Jax Brewery)",
      schedule_departures: ["19:00"],
    },
    exact_source_quote: "Adult (Sightseeing Cruise Only): $58.00. Boarding: 6:00pm, Cruising: 7:00pm - 9:00pm. All cruises sail rain or shine. In the rare event the US Coast Guard halts navigation due to river conditions, the event is held dockside with music and food service; cruise tickets are non-refundable for weather.",
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
    verified_facts: {
      base_rate: 35.0, // Self-arrive adult
      rate_with_transportation: 60.0, // With round-trip hotel shuttle ($50 child)
      cancellation_notice_hours: 48, // Standard policy is 48 hours; 24h only applies with purchased Trip Protection
      cancellation_policy_summary: "Cancellations made at least 48 hours prior to tour departure receive a full refund. Cancellations inside 48 hours are non-refundable unless Trip Protection was purchased.",
      weather_guarantee: true, // Tours operate in rain; captain may cancel for dangerous lightning
      weather_terms_summary: "Tours operate in light rain under covered roof. If the captain cancels departures due to severe weather/lightning, guests receive a 100% refund or reschedule.",
      dock_or_departure_location: "1265 LA-3127 / Barataria waterway slips in Luling, LA 70070 (exact slip provided upon reservation)",
      schedule_departures: ["09:45", "12:15", "14:45"],
    },
    exact_source_quote: "Covered Boat Tour: $35 per adult self-drive, $60 per adult with hotel pickup ($50 child). Full refund with at least 48 hours notice. Tours run rain or shine with covered boat canopy; captain reserves right to cancel if severe storms threaten passenger safety with full refund.",
  },

  "southern-style-oak-alley-laura-plantation": {
    claim_key: "southern-style-oak-alley-laura-plantation",
    sku: "wno-oak-alley-or-laura-plantation-tour",
    operator_name: "Southern Style Tours",
    fareharbor_item_id: 83002,
    source_url: "https://www.welcometoneworleanstours.com/tours/oak-alley-or-laura-plantation-tour",
    source_type: "operator_contract",
    verified_at: "2026-09-09T23:00:00Z",
    review_by: "2026-12-01T00:00:00Z",
    verified_by: "contracts@destinations-cc.com",
    verified_facts: {
      base_rate: 85.0, // Includes minibus transportation from hotel corridor and admission
      cancellation_notice_hours: 48,
      cancellation_policy_summary: "Minibus plantation departures require 48 hours advance notice for full refund.",
      weather_guarantee: false,
      weather_terms_summary: "Tours operate rain or shine; mansion interiors and shaded walkways remain accessible.",
      dock_or_departure_location: "Pickup corridor along Canal St / Poydras St / French Quarter hotels",
      schedule_departures: ["08:15"],
    },
    exact_source_quote: "Oak Alley or Laura Plantation Tour: $85 per person including round-trip transport and mansion admission. Guest selects plantation preference during reservation flow. 48-hour cancellation policy.",
  },
};
