/**
 * Canonical public satellite registry + outbound link builder.
 *
 * This is the single source of truth for the intent-based links that connect
 * the public DCC surface to its satellite storefronts. Every outbound link is
 * built through `buildNetworkSatelliteHref` so that route/corridor context is
 * preserved on the handoff instead of leaking. CTAs must never bypass this.
 */

export type NetworkSatelliteId =
  | "juneauflightdeck"
  | "welcometotheswamp"
  | "gosno"
  | "partyatredrocks"
  | "shuttleya"
  | "welcometoneworleanstours"
  | "welcometoalaskatours"
  | "cruisepromenade"
  | "vibearoundtown"
  | "lastfrontiershoreexcursions"
  | "welcometothedells"
  | "frenchquarterorientation"
  | "saveonthestrip"
  | "airportpickup420";

export type NetworkRevenueMode = "owned_checkout" | "operator_handoff" | "partner_booking" | "lead_capture" | "planning" | "marketplace";

export type NetworkSatellite = {
  id: NetworkSatelliteId;
  name: string;
  origin: string;
  path: string;
  corridor: string;
  travelerProblem: string;
  decisionCompressed: string;
  fulfillment: string;
  revenueMode: NetworkRevenueMode;
};

export const DCC_SOURCE_SITE = "destination-command-center";
export const DCC_SOURCE_DOMAIN = "destinationcommandcenter.com";

export const NETWORK_SATELLITES: Record<NetworkSatelliteId, NetworkSatellite> = {
  juneauflightdeck: {
    id: "juneauflightdeck", name: "Juneau Flight Deck", origin: "https://juneauflightdeck.com", path: "/", corridor: "juneau-flightseeing",
    travelerProblem: "Cruise travelers need to decide whether flightseeing fits their port day and what to do if weather disrupts it.",
    decisionCompressed: "Flight format, ship timing, weather exposure, and backup plan.", fulfillment: "Partner flightseeing and excursion booking paths.", revenueMode: "partner_booking",
  },
  welcometotheswamp: {
    id: "welcometotheswamp", name: "Welcome to the Swamp", origin: "https://welcometotheswamp.com", path: "/", corridor: "new-orleans-orientation-and-tours",
    travelerProblem: "New Orleans visitors need a simple starting point before choosing the rest of their trip.",
    decisionCompressed: "Orientation first, then the experience category that fits the visitor.", fulfillment: "Orientation product and partner tour booking paths.", revenueMode: "partner_booking",
  },
  gosno: {
    id: "gosno", name: "GoSno", origin: "https://gosno.co", path: "/", corridor: "colorado-mountain-transfer",
    travelerProblem: "Travelers need reliable private transportation between Colorado airports and mountain destinations.",
    decisionCompressed: "Route, date, group size, vehicle, and whether online booking is available.", fulfillment: "GoSno private transportation operations.", revenueMode: "owned_checkout",
  },
  partyatredrocks: {
    id: "partyatredrocks", name: "Party at Red Rocks", origin: "https://www.partyatredrocks.com", path: "/", corridor: "red-rocks-private-transport",
    travelerProblem: "Groups need a private ride to Red Rocks without parking, driving, or post-show exit friction.",
    decisionCompressed: "Private SUV or private van based on group size and pickup plan.", fulfillment: "Party at Red Rocks private transportation.", revenueMode: "owned_checkout",
  },
  shuttleya: {
    id: "shuttleya", name: "ShuttleYa", origin: "https://shuttleya.com", path: "/", corridor: "argo-day-transport",
    travelerProblem: "Day-trip travelers need the specific Denver-to-Argo Cable Car shuttle product.",
    decisionCompressed: "Whether the scheduled Argo round trip fits the day plan.", fulfillment: "ShuttleYa Argo shuttle reservations.", revenueMode: "owned_checkout",
  },
  welcometoneworleanstours: {
    id: "welcometoneworleanstours", name: "Welcome to New Orleans Tours", origin: "https://www.welcometoneworleanstours.com", path: "/", corridor: "new-orleans-tour-decision",
    travelerProblem: "Visitors need to choose the right New Orleans experience without sorting through a giant undifferentiated catalog.",
    decisionCompressed: "Group fit, duration, mobility, pickup, weather, and experience style.", fulfillment: "Partner/operator booking paths after recommendation.", revenueMode: "partner_booking",
  },
  welcometoalaskatours: {
    id: "welcometoalaskatours", name: "Welcome to Alaska Tours", origin: "https://welcometoalaskatours.com", path: "/", corridor: "alaska-tour-booking",
    travelerProblem: "Alaska travelers and cruise guests need structured excursion inventory with timing and destination context.",
    decisionCompressed: "Port, date, tour type, timing, and booking fit.", fulfillment: "Alaska partner/operator booking paths.", revenueMode: "partner_booking",
  },
  cruisepromenade: {
    id: "cruisepromenade", name: "Cruise Promenade", origin: "https://cruisepromenade.com", path: "/", corridor: "cruise-group-planning",
    travelerProblem: "Cruise groups already have a group chat but still need one shared daily plan.",
    decisionCompressed: "Sailing, port day, group plan, timing, and what belongs on the shared itinerary.", fulfillment: "Private shared cruise planner and downstream experience discovery.", revenueMode: "planning",
  },
  vibearoundtown: {
    id: "vibearoundtown", name: "Vibe Around Town", origin: "https://www.vibearoundtown.com", path: "/", corridor: "local-driver-marketplace",
    travelerProblem: "Cruise visitors want to choose a licensed local person and private ride rather than a rigid bus excursion.",
    decisionCompressed: "Port date/time, available driver, vehicle, group fit, style, and driver-set fare.", fulfillment: "Driver reservation-request marketplace.", revenueMode: "marketplace",
  },
  lastfrontiershoreexcursions: {
    id: "lastfrontiershoreexcursions", name: "Last Frontier Shore Excursions", origin: "https://www.lastfrontiershoreexcursions.com", path: "/", corridor: "alaska-shore-excursion-discovery",
    travelerProblem: "Cruise guests need Alaska port-day excursion ideas organized around real cruise-day constraints.",
    decisionCompressed: "Port, available time, weather sensitivity, and excursion type.", fulfillment: "Affiliate/partner excursion handoffs.", revenueMode: "partner_booking",
  },
  welcometothedells: {
    id: "welcometothedells", name: "Welcome to the Dells", origin: "https://welcometothedells.com", path: "/", corridor: "wisconsin-dells-discovery",
    travelerProblem: "Wisconsin Dells visitors need a useful way to shape a family, adults, or group trip before choosing attractions.",
    decisionCompressed: "Trip type, timing, attraction category, and current local context.", fulfillment: "Destination discovery and partner booking paths.", revenueMode: "partner_booking",
  },
  frenchquarterorientation: {
    id: "frenchquarterorientation", name: "French Quarter Orientation", origin: "https://frenchquarterorientation.com", path: "/", corridor: "new-orleans-orientation",
    travelerProblem: "First-time New Orleans visitors want a fast orientation before spending the rest of the day.",
    decisionCompressed: "Get oriented first, then choose the next experience.", fulfillment: "Orientation and downstream New Orleans experience handoffs.", revenueMode: "lead_capture",
  },
  saveonthestrip: {
    id: "saveonthestrip", name: "Save on the Strip", origin: "https://saveonthestrip.com", path: "/", corridor: "las-vegas-decision-discovery",
    travelerProblem: "Las Vegas visitors need to compare what is worth doing, when, and at what total friction/cost.",
    decisionCompressed: "Attraction/show category, timing, transportation, fees, and fit.", fulfillment: "Affiliate/partner attraction and experience handoffs.", revenueMode: "partner_booking",
  },
  airportpickup420: {
    id: "airportpickup420", name: "420 Friendly Airport Pickup", origin: "https://420friendlyairportpickup.com", path: "/", corridor: "denver-420-private-transfer",
    travelerProblem: "21+ Denver visitors want private airport transportation with a dispensary-stop-friendly trip plan.",
    decisionCompressed: "Airport route, destination, private vehicle, and optional stop context.", fulfillment: "Private transportation handoff into the Colorado operating lane.", revenueMode: "lead_capture",
  },
};

export type NetworkSatelliteHandoffContext = {
  sourcePage: string;
  action: string;
  cta: string;
  product?: string;
  routeTarget?: string;
  revenueStage?: "intent" | "handoff_viewed" | "booking_started";
};

export function buildNetworkSatelliteHref(satelliteId: NetworkSatelliteId, context: NetworkSatelliteHandoffContext): string {
  const satellite = NETWORK_SATELLITES[satelliteId];
  const url = new URL(satellite.path, satellite.origin);
  const params: Record<string, string> = {
    src: "dcc", source_site: DCC_SOURCE_SITE, source_domain: DCC_SOURCE_DOMAIN, source_page: context.sourcePage,
    decision_corridor: satellite.corridor, decision_action: context.action, decision_cta: context.cta, provider: satellite.id,
    route_target: context.routeTarget || "satellite", revenue_mode: satellite.revenueMode, revenue_stage: context.revenueStage || "intent",
    ...(context.product ? { decision_product: context.product } : {}),
  };
  for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, value);
  return url.toString();
}

export function listNetworkSatellites(): NetworkSatellite[] {
  return Object.values(NETWORK_SATELLITES);
}
