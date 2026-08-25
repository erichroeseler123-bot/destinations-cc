export type PortfolioStrategy =
  | "core_infrastructure"
  | "breakout_product"
  | "compound_commerce"
  | "operate"
  | "specialist"
  | "prepare"
  | "prove"
  | "review";

export type PortfolioNetworkRole =
  | "research_authority"
  | "specialist_commerce"
  | "specialist_experience"
  | "planning_tool"
  | "marketplace"
  | "transportation_commerce";

export type PortfolioSiteContract = {
  id: string;
  name: string;
  canonicalUrl: string | null;
  parentId?: string;
  networkRole: PortfolioNetworkRole;
  strategy: PortfolioStrategy;
  jobKey: string;
  job: string;
  owns: readonly string[];
  mustNotOwn: readonly string[];
  handoffRule: string;
};

/**
 * Portfolio governance contract.
 *
 * This registry answers one question that the generic network graph does not:
 * "What unique customer job is this property allowed to own?"
 *
 * Rules:
 * - A property may share infrastructure, data contracts, and telemetry with another property.
 * - A property may not silently expand into another property's customer job.
 * - Cross-site handoffs must continue the user's task; they are not a license for global link-network behavior.
 * - Commercial/operator properties own their transaction truth. DCC owns governed decision/location truth.
 */
export const PORTFOLIO_SITE_CONTRACTS = [
  {
    id: "dcc",
    name: "Destination Command Center",
    canonicalUrl: "https://www.destinationcommandcenter.com",
    networkRole: "research_authority",
    strategy: "core_infrastructure",
    jobKey: "location_decision_intelligence",
    job: "Turn fragmented destination and live public signals into a governed recommendation, then route the traveler to the right specialist or operator.",
    owns: ["location_intelligence", "decision_routing", "network_truth", "machine_readable_context"],
    mustNotOwn: ["customer_checkout", "operator_inventory", "customer_payment", "private_trip_plans"],
    handoffRule: "Route only after DCC has reduced the travel decision; never replace the specialist's inventory or the operator's checkout.",
  },
  {
    id: "cp",
    name: "Cruise Promenade",
    canonicalUrl: "https://cruisepromenade.com",
    networkRole: "planning_tool",
    strategy: "breakout_product",
    jobKey: "private_shared_cruise_planning",
    job: "Give a cruise group one private, shareable daily plan for a specific sailing before and during the trip.",
    owns: ["sailing_templates", "private_group_plans", "share_links", "planner_permissions"],
    mustNotOwn: ["public_social_network", "general_destination_intelligence", "operator_inventory_truth", "transportation_checkout"],
    handoffRule: "Send a traveler to a destination specialist only when the handoff helps complete a day in the existing cruise plan; preserve sailing and port context.",
  },
  {
    id: "alaska",
    name: "Welcome to Alaska Tours",
    canonicalUrl: "https://welcometoalaskatours.com",
    networkRole: "specialist_commerce",
    strategy: "compound_commerce",
    jobKey: "alaska_excursion_choice",
    job: "Reduce Alaska excursion inventory to a small, explainable set of choices that fit the traveler's port, timing, group, mobility, and activity preferences.",
    owns: ["alaska_excursion_recommendations", "port_fit", "curated_alaska_inventory", "commerce_handoffs"],
    mustNotOwn: ["private_cruise_group_planning", "juneau_flightseeing_only", "global_location_intelligence", "operator_fulfillment"],
    handoffRule: "Accept resolved Alaska intent from DCC or Cruise Promenade and hand off to a real operator or approved booking channel without restarting the decision.",
  },
  {
    id: "wtonot",
    name: "Welcome to New Orleans Tours",
    canonicalUrl: "https://welcometoneworleanstours.com",
    networkRole: "specialist_commerce",
    strategy: "compound_commerce",
    jobKey: "new_orleans_experience_choice",
    job: "Help a New Orleans visitor choose the right bookable experience from a deliberately narrowed set based on timing, group fit, energy, weather, pickup, and mobility.",
    owns: ["new_orleans_experience_recommendations", "curated_new_orleans_inventory", "operator_handoffs", "commerce_choice"],
    mustNotOwn: ["french_quarter_first_hour_orientation", "swamp_only_decision_engine", "global_destination_intelligence", "operator_fulfillment"],
    handoffRule: "Receive a resolved New Orleans experience question and route to the best-fit operator; use FQO or WTS only when their narrower specialist job is the next task.",
  },
  {
    id: "fqo",
    name: "French Quarter Orientation",
    canonicalUrl: "https://frenchquarterorientation.com",
    networkRole: "specialist_experience",
    strategy: "specialist",
    jobKey: "french_quarter_first_hour_orientation",
    job: "Help a newly arrived French Quarter visitor understand where they are, establish a mental map and regroup point, and decide what to do first.",
    owns: ["first_hour_orientation", "french_quarter_mental_map", "regroup_guidance", "orientation_experience"],
    mustNotOwn: ["general_new_orleans_tour_catalog", "swamp_tour_choice", "global_destination_intelligence", "cruise_planning"],
    handoffRule: "After orientation is solved, hand broader tour and activity decisions to Welcome to New Orleans Tours instead of expanding this property into a general storefront.",
  },
  {
    id: "swamp",
    name: "Welcome to the Swamp",
    canonicalUrl: "https://welcometotheswamp.com",
    networkRole: "specialist_commerce",
    strategy: "specialist",
    jobKey: "new_orleans_swamp_choice",
    job: "Resolve the narrow New Orleans swamp-tour decision: ride style, boat size, family fit, timing, pickup or self-drive, and the best bookable next step.",
    owns: ["swamp_tour_choice", "swamp_ride_style", "swamp_transport_fit", "swamp_booking_handoff"],
    mustNotOwn: ["general_new_orleans_experience_catalog", "french_quarter_orientation", "global_destination_intelligence", "operator_fulfillment"],
    handoffRule: "Stay inside the swamp-tour problem; send broader New Orleans decisions back to WNO rather than adding unrelated experience inventory.",
  },
  {
    id: "jfd",
    name: "Juneau Flight Deck",
    canonicalUrl: "https://juneauflightdeck.com",
    networkRole: "specialist_commerce",
    strategy: "specialist",
    jobKey: "juneau_flightseeing_choice",
    job: "Help Juneau visitors compare and choose flightseeing and glacier-flight experiences with clear fit, timing, weather, and booking context.",
    owns: ["juneau_flightseeing_choice", "flightseeing_fit", "glacier_flight_context", "specialist_booking_handoff"],
    mustNotOwn: ["all_alaska_excursions", "private_cruise_group_planning", "global_destination_intelligence", "operator_fulfillment"],
    handoffRule: "Own flightseeing depth; return broader Alaska excursion questions to Welcome to Alaska Tours instead of duplicating its catalog.",
  },
  {
    id: "lfse",
    name: "Last Frontier Shore Excursions",
    canonicalUrl: "https://lastfrontiershoreexcursions.com",
    networkRole: "specialist_commerce",
    strategy: "review",
    jobKey: "alaska_shore_excursion_specialist",
    job: "Answer a narrower cruise-port shore-excursion question than Welcome to Alaska Tours; expand only where the property can provide materially distinct cruise-day utility.",
    owns: ["shore_excursion_context", "cruise_day_fit"],
    mustNotOwn: ["general_alaska_excursion_catalog", "private_cruise_group_planning", "juneau_flightseeing_depth", "global_destination_intelligence"],
    handoffRule: "Do not clone Welcome to Alaska Tours; if a route cannot provide distinct shore-day utility, consolidate the decision into the stronger Alaska property.",
  },
  {
    id: "dells",
    name: "Welcome to the Dells",
    canonicalUrl: "https://welcometothedells.com",
    networkRole: "specialist_commerce",
    strategy: "specialist",
    jobKey: "wisconsin_dells_activity_choice",
    job: "Help Wisconsin Dells visitors choose what to do for their actual group and conditions, including first visits, weather, adults, families, and same-day decisions.",
    owns: ["dells_activity_choice", "dells_group_fit", "dells_weather_fit", "dells_same_day_guidance"],
    mustNotOwn: ["general_midwest_travel", "transportation_checkout", "global_destination_intelligence", "cruise_planning"],
    handoffRule: "Stay focused on Wisconsin Dells decisions and approved booking paths; do not broaden into a generic regional travel portal.",
  },
  {
    id: "vibe",
    name: "Vibe Around Town",
    canonicalUrl: "https://vibearoundtown.com",
    networkRole: "marketplace",
    strategy: "prove",
    jobKey: "local_driver_private_tour_marketplace",
    job: "Match a traveler with a licensed local driver for a private, driver-priced tour or ride using request, acceptance, confirmation, and day-of coordination.",
    owns: ["driver_profiles", "driver_availability", "driver_pricing", "request_accept_confirm", "marketplace_reservations"],
    mustNotOwn: ["global_destination_intelligence", "generic_tour_catalog", "cruise_group_planning", "red_rocks_designated_driver_network"],
    handoffRule: "Receive traveler intent and destination context, but keep driver identity, availability, pricing, acceptance, and reservation truth inside the marketplace.",
  },
  {
    id: "gosno",
    name: "GoSno",
    canonicalUrl: "https://gosno.co",
    networkRole: "transportation_commerce",
    strategy: "operate",
    jobKey: "colorado_private_mountain_transport",
    job: "Sell and operate premium private airport-to-resort transportation in Colorado with authoritative route pricing, vehicle fit, availability, and booking rules.",
    owns: ["colorado_transfer_rates", "vehicle_fit", "booking_availability", "transport_fulfillment"],
    mustNotOwn: ["global_destination_intelligence", "generic_activity_recommendations", "cruise_planning", "red_rocks_designated_driver_network"],
    handoffRule: "Accept destination and corridor context from DCC, then own the transportation quote, availability, payment, and fulfillment truth.",
  },
  {
    id: "bigsky-gosno",
    name: "Big Sky GoSno",
    canonicalUrl: "https://bigsky.gosno.co",
    parentId: "gosno",
    networkRole: "transportation_commerce",
    strategy: "prepare",
    jobKey: "bzn_big_sky_private_transport",
    job: "Prepare and then operate the BZN-to-Big-Sky private transportation lane with Montana-specific pricing, airport requirements, availability, and operating truth.",
    owns: ["bzn_big_sky_rates", "montana_vehicle_fit", "montana_booking_readiness", "big_sky_transfer_context"],
    mustNotOwn: ["colorado_transfer_inventory", "global_destination_intelligence", "generic_big_sky_travel_guide", "activity_marketplace"],
    handoffRule: "Remain a GoSno child property and publish only operationally supportable Montana transportation claims; use DCC for broader destination intelligence.",
  },
  {
    id: "shuttleya",
    name: "ShuttleYa",
    canonicalUrl: "https://shuttleya.com",
    networkRole: "transportation_commerce",
    strategy: "prove",
    jobKey: "narrow_corridor_transport_action",
    job: "Turn a resolved transportation corridor into one low-friction action or booking path without becoming a duplicate general mountain-transport brand.",
    owns: ["corridor_action", "booking_handoff", "resolved_transport_state"],
    mustNotOwn: ["general_colorado_private_transport", "global_destination_intelligence", "generic_destination_content", "cruise_planning"],
    handoffRule: "Only accept corridors that have already been narrowed; preserve the incoming state and avoid competing with GoSno for the same generic job.",
  },
  {
    id: "parr",
    name: "Party at Red Rocks",
    canonicalUrl: "https://partyatredrocks.com",
    networkRole: "transportation_commerce",
    strategy: "operate",
    jobKey: "red_rocks_private_transport",
    job: "Sell and operate private Red Rocks transportation with clear vehicle choices, event logistics, waiting, and round-trip execution.",
    owns: ["red_rocks_private_transport", "vehicle_pricing", "event_transport_logistics", "private_transport_booking"],
    mustNotOwn: ["shared_seat_transport", "red_rocks_designated_driver_network", "global_destination_intelligence", "generic_concert_content"],
    handoffRule: "Own private transportation only; do not revive shared-seat offers or absorb the separate designated-driver product.",
  },
  {
    id: "rrdd",
    name: "Red Rocks Designated Driver",
    canonicalUrl: null,
    networkRole: "transportation_commerce",
    strategy: "prove",
    jobKey: "red_rocks_designated_driver_network",
    job: "Operate a distinct Red Rocks designated-driver network in which approved drivers publish their vehicle, availability, price, and upcoming trip schedule.",
    owns: ["designated_driver_profiles", "driver_availability", "driver_pricing", "designated_driver_trip_schedule"],
    mustNotOwn: ["red_rocks_private_transport", "shared_shuttle_inventory", "global_destination_intelligence", "generic_concert_content"],
    handoffRule: "Stay operationally distinct from Party at Red Rocks; a traveler should never have to infer whether they are booking private transport or a designated driver.",
  },
  {
    id: "rrfp",
    name: "Red Rocks Fast Pass",
    canonicalUrl: "https://redrocksfastpass.com",
    networkRole: "transportation_commerce",
    strategy: "review",
    jobKey: "red_rocks_selective_execution_lane",
    job: "Remain a selective Red Rocks execution lane only where its offer is materially different from Party at Red Rocks and Red Rocks Designated Driver.",
    owns: ["distinct_red_rocks_execution_offer"],
    mustNotOwn: ["duplicate_private_transport", "red_rocks_designated_driver_network", "global_destination_intelligence", "generic_concert_content"],
    handoffRule: "If the offer cannot remain clearly distinct from PARR and RRDD, consolidate or retire the overlapping route instead of manufacturing a third version of the same job.",
  },
  {
    id: "airport420",
    name: "420 Friendly Airport Pickup",
    canonicalUrl: "https://420friendlyairportpickup.com",
    networkRole: "transportation_commerce",
    strategy: "specialist",
    jobKey: "denver_420_airport_pickup",
    job: "Solve the narrow Denver airport-transfer use case for travelers who want a compliant dispensary-stop-friendly private pickup before continuing to their destination.",
    owns: ["420_transfer_choice", "dispensary_stop_context", "specialist_transport_handoff"],
    mustNotOwn: ["general_colorado_private_transport", "cannabis_marketplace", "global_destination_intelligence", "generic_denver_travel"],
    handoffRule: "Stay a narrow qualifying and handoff surface; use GoSno or the appropriate operator for the underlying transportation execution.",
  },
  {
    id: "vegas",
    name: "Save on the Strip",
    canonicalUrl: "https://saveonthestrip.com",
    networkRole: "specialist_commerce",
    strategy: "review",
    jobKey: "las_vegas_value_decisions",
    job: "Help Las Vegas visitors decide which paid Strip experiences are actually worth their money using comparison, tradeoffs, and transparent value guidance.",
    owns: ["vegas_value_comparison", "worth_it_guidance", "strip_purchase_decisions"],
    mustNotOwn: ["generic_vegas_directory", "global_destination_intelligence", "transportation_checkout", "cruise_planning"],
    handoffRule: "Expand only around value decisions; avoid becoming a generic Vegas catalog that duplicates DCC destination coverage.",
  },
] as const satisfies readonly PortfolioSiteContract[];

export type PortfolioSiteId = (typeof PORTFOLIO_SITE_CONTRACTS)[number]["id"];

export function getPortfolioSiteContract(id: string) {
  return PORTFOLIO_SITE_CONTRACTS.find((site) => site.id === id) ?? null;
}

export function portfolioSiteContractsByStrategy(strategy: PortfolioStrategy) {
  return PORTFOLIO_SITE_CONTRACTS.filter((site) => site.strategy === strategy);
}
