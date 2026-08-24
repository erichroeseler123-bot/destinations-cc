export type DccServiceState = "active" | "prelaunch" | "seasonal" | "retired" | "unknown";

export type DccTruthProvenance = {
  kind: "declared_by_site" | "dcc_curated" | "operator_supplied" | "public_source";
  last_verified: string;
  note?: string;
};

export type DccPortfolioTruthRecord = {
  dcc_id: `dcc:site:${string}`;
  id: string;
  name: string;
  url: string;
  type: string;
  role: string;
  authority: readonly string[];
  status: {
    state: DccServiceState;
    effective_from?: string;
    effective_until?: string;
    note?: string;
  };
  provenance: DccTruthProvenance;
  booking?: {
    authority: "site" | "operator" | "provider" | "driver" | "none";
    takes_payment?: boolean;
    finality?: string;
  };
  public_claims?: Record<string, string | number | boolean | readonly string[]>;
};

const VERIFIED = "2026-08-24";

/**
 * Canonical public portfolio facts.
 *
 * Rules:
 * - Keep only facts the property itself declares or DCC can safely verify.
 * - Do not infer ownership, live availability, pricing, guarantees, or operating status.
 * - Time-sensitive facts must carry an explicit status/effective date or live authority boundary.
 */
export const DCC_SITE_TRUTH: readonly DccPortfolioTruthRecord[] = [
  {
    dcc_id: "dcc:site:destination-command-center",
    id: "destination-command-center",
    name: "Destination Command Center",
    url: "https://www.destinationcommandcenter.com",
    type: "location_intelligence_graph",
    role: "canonical portfolio directory and coordinate-native public context layer",
    authority: ["coordinate_identity", "public_location_context", "portfolio_relationships"],
    status: { state: "active" },
    provenance: { kind: "dcc_curated", last_verified: VERIFIED },
    booking: { authority: "none", takes_payment: false },
    public_claims: {
      mighty_argo_scheduled_transportation: "retired_not_operating",
      mighty_argo_direct_checkout: false,
    },
  },
  {
    dcc_id: "dcc:site:cruise-promenade",
    id: "cruise-promenade",
    name: "Cruise Promenade",
    url: "https://cruisepromenade.com",
    type: "cruise_group_planner",
    role: "shared private cruise-group planning property",
    authority: ["cruise_planning", "ship_and_sailing_context", "shared_private_plans"],
    status: { state: "active" },
    provenance: {
      kind: "declared_by_site",
      last_verified: VERIFIED,
      note: "Do not infer a live third-party cruise-data API relationship from attribution language alone.",
    },
  },
  {
    dcc_id: "dcc:site:vibe-around-town",
    id: "vibe-around-town",
    name: "Vibe Around Town",
    url: "https://vibearoundtown.com",
    type: "private_local_driver_marketplace",
    role: "local-driver request, acceptance and reservation marketplace",
    authority: ["driver_profiles", "vehicle_profiles", "request_and_accept_booking_state"],
    status: { state: "active" },
    provenance: { kind: "declared_by_site", last_verified: VERIFIED },
    booking: {
      authority: "driver",
      takes_payment: true,
      finality: "A reservation request is not final until the driver accepts; the site may collect the published reservation fee.",
    },
  },
  {
    dcc_id: "dcc:site:wno-tours",
    id: "wno-tours",
    name: "Welcome to New Orleans Tours",
    url: "https://www.welcometoneworleanstours.com",
    type: "tour_recommendation_service",
    role: "New Orleans tour recommendation and operator-handoff property",
    authority: ["tour_recommendations", "tour_decision_guides", "participating_operator_handoffs"],
    status: { state: "active" },
    provenance: { kind: "declared_by_site", last_verified: VERIFIED },
    booking: { authority: "provider" },
  },
  {
    dcc_id: "dcc:site:gosno",
    id: "gosno",
    name: "GoSno",
    url: "https://gosno.co",
    type: "private_mountain_transportation",
    role: "Colorado private airport-to-mountain transportation operator",
    authority: ["service_routes", "published_transfer_pricing", "vehicle_service_options"],
    status: { state: "active" },
    provenance: { kind: "operator_supplied", last_verified: VERIFIED },
    booking: { authority: "site", takes_payment: true },
  },
  {
    dcc_id: "dcc:site:bigsky-gosno",
    id: "bigsky-gosno",
    name: "Big Sky GoSno",
    url: "https://bigsky.gosno.co",
    type: "private_mountain_transportation",
    role: "announced BZN to Big Sky private transportation service",
    authority: ["big_sky_service_information", "published_transfer_pricing", "site_booking_state"],
    status: {
      state: "prelaunch",
      effective_from: "2026-11-15",
      note: "Opening is announced; do not infer live availability from the announcement alone.",
    },
    provenance: { kind: "operator_supplied", last_verified: VERIFIED },
    booking: { authority: "site" },
    public_claims: {
      one_way_usd: 299,
      round_trip_usd: 548,
      first_service_date: "2026-11-15",
      vehicle: "private full-size Chevrolet Suburban",
    },
  },
  {
    dcc_id: "dcc:site:party-at-red-rocks",
    id: "party-at-red-rocks",
    name: "Party at Red Rocks",
    url: "https://www.partyatredrocks.com",
    type: "private_red_rocks_transportation",
    role: "private Red Rocks concert transportation operator",
    authority: ["red_rocks_private_transportation", "published_vehicle_pricing", "site_booking_state"],
    status: { state: "active" },
    provenance: { kind: "operator_supplied", last_verified: VERIFIED },
    booking: { authority: "site", takes_payment: true },
    public_claims: {
      shared_seat_service: false,
      suburban_usd: 399,
      van_usd: 599,
    },
  },
  {
    dcc_id: "dcc:site:save-on-the-strip",
    id: "save-on-the-strip",
    name: "Save On The Strip",
    url: "https://saveonthestrip.com",
    type: "las_vegas_travel_planning",
    role: "Las Vegas planning and decision-support property",
    authority: ["las_vegas_destination_content"],
    status: { state: "active" },
    provenance: { kind: "declared_by_site", last_verified: VERIFIED },
  },
  {
    dcc_id: "dcc:site:welcome-to-the-swamp",
    id: "welcome-to-the-swamp",
    name: "Welcome to the Swamp",
    url: "https://welcometotheswamp.com",
    type: "swamp_tour_discovery",
    role: "New Orleans swamp-tour discovery and decision-support property",
    authority: ["swamp_tour_discovery", "new_orleans_swamp_experience_context"],
    status: { state: "active" },
    provenance: {
      kind: "declared_by_site",
      last_verified: VERIFIED,
      note: "French Quarter orientation is a separate property and must not be represented as the current Swamp product.",
    },
    booking: { authority: "provider" },
  },
  {
    dcc_id: "dcc:site:juneau-flight-deck",
    id: "juneau-flight-deck",
    name: "Juneau Flight Deck",
    url: "https://juneauflightdeck.com",
    type: "juneau_excursion_discovery",
    role: "specialist Juneau flightseeing decision surface",
    authority: ["juneau_excursion_context"],
    status: { state: "active" },
    provenance: { kind: "declared_by_site", last_verified: VERIFIED },
    booking: { authority: "provider" },
  },
  {
    dcc_id: "dcc:site:last-frontier-shore-excursions",
    id: "last-frontier-shore-excursions",
    name: "Last Frontier Shore Excursions",
    url: "https://lastfrontiershoreexcursions.com",
    type: "alaska_shore_excursion_discovery",
    role: "Alaska cruise-port excursion decision and provider-handoff property",
    authority: ["alaska_shore_excursion_content"],
    status: { state: "active" },
    provenance: { kind: "declared_by_site", last_verified: VERIFIED },
    booking: { authority: "provider" },
  },
  {
    dcc_id: "dcc:site:welcome-to-alaska-tours",
    id: "welcome-to-alaska-tours",
    name: "Welcome to Alaska Tours",
    url: "https://www.welcometoalaskatours.com",
    type: "alaska_excursion_shopping",
    role: "Alaska excursion catalog, calendar and checkout property",
    authority: ["excursion_catalog", "tour_calendar", "site_checkout_state"],
    status: { state: "active" },
    provenance: {
      kind: "declared_by_site",
      last_verified: VERIFIED,
      note: "Do not infer ownership or control relationships from shared links, inventory, phone numbers, or operator references.",
    },
    booking: { authority: "site", takes_payment: true },
  },
  {
    dcc_id: "dcc:site:welcome-to-the-dells",
    id: "welcome-to-the-dells",
    name: "Welcome to the Dells",
    url: "https://welcometothedells.com",
    type: "wisconsin_dells_destination_planning",
    role: "Wisconsin Dells consumer planning and decision-support property",
    authority: ["wisconsin_dells_destination_content"],
    status: { state: "active" },
    provenance: { kind: "declared_by_site", last_verified: VERIFIED },
    booking: { authority: "provider" },
  },
  {
    dcc_id: "dcc:site:french-quarter-orientation",
    id: "french-quarter-orientation",
    name: "French Quarter Orientation",
    url: "https://frenchquarterorientation.com",
    type: "new_orleans_orientation_guide",
    role: "French Quarter orientation property",
    authority: ["french_quarter_orientation_content"],
    status: { state: "active" },
    provenance: { kind: "declared_by_site", last_verified: VERIFIED },
  },
  {
    dcc_id: "dcc:site:shuttleya",
    id: "shuttleya",
    name: "ShuttleYa",
    url: "https://shuttleya.com",
    type: "transportation_discovery",
    role: "transportation discovery and operator-routing property; not a carrier",
    authority: ["transportation_discovery_content"],
    status: { state: "active" },
    provenance: { kind: "declared_by_site", last_verified: VERIFIED },
    booking: {
      authority: "operator",
      takes_payment: false,
      finality: "The listed transportation provider controls live service, price, availability, pickup instructions, payment, restrictions and cancellation terms.",
    },
    public_claims: {
      operates_vehicles: false,
      direct_transportation_checkout: false,
      denver_to_mighty_argo_scheduled_shuttle: "retired_not_operating",
    },
  },
  {
    dcc_id: "dcc:site:420-friendly-airport-pickup",
    id: "420-friendly-airport-pickup",
    name: "420 Friendly Airport Pickup",
    url: "https://420friendlyairportpickup.com",
    type: "private_airport_transportation_discovery",
    role: "airport-transfer discovery property with dispensary-stop trip context",
    authority: ["airport_transfer_content", "dispensary_stop_trip_context"],
    status: { state: "active" },
    provenance: { kind: "declared_by_site", last_verified: VERIFIED },
    booking: { authority: "operator" },
  },
] as const;

export function getDccSiteTruth(idOrDccId: string) {
  return DCC_SITE_TRUTH.find((record) => record.id === idOrDccId || record.dcc_id === idOrDccId);
}
