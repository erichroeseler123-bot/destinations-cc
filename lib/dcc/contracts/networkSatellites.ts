/**
 * Canonical public satellite registry + outbound link builder.
 *
 * This is the single source of truth for the intent-based links that connect
 * the public DCC surface to its satellite storefronts. Every outbound link is
 * built through `buildNetworkSatelliteHref` so that route/corridor context is
 * preserved on the handoff instead of leaking. CTAs must never bypass this.
 *
 * The param contract intentionally carries the full decision + revenue context:
 *   decision_corridor, source_site, source_domain, decision_action,
 *   decision_cta, decision_product, provider, route_target,
 *   revenue_mode, revenue_stage
 */

export type NetworkSatelliteId =
  | "juneauflightdeck"
  | "welcometotheswamp"
  | "gosno"
  | "partyatredrocks"
  | "shuttleya";

export type NetworkRevenueMode = "owned_checkout" | "operator_handoff" | "partner_booking" | "lead_capture";

export type NetworkSatellite = {
  id: NetworkSatelliteId;
  /** Public brand name shown to travelers. */
  name: string;
  /** Canonical satellite origin (no trailing slash). */
  origin: string;
  /** Default landing path on the satellite. */
  path: string;
  /** The corridor this satellite owns, in the decision-continuation vocabulary. */
  corridor: string;
  /** One-line traveler problem this lane solves. */
  travelerProblem: string;
  /** The decision DCC compresses before the handoff. */
  decisionCompressed: string;
  /** Where fulfillment actually happens once the traveler accepts the lane. */
  fulfillment: string;
  /** How money is made on this lane. */
  revenueMode: NetworkRevenueMode;
};

export const DCC_SOURCE_SITE = "destination-command-center";
export const DCC_SOURCE_DOMAIN = "destinationcommandcenter.com";

/**
 * Active, publicly linkable satellites. Only satellites with a real canonical
 * domain in the codebase are listed here. Dells / Feastly are intentionally
 * omitted until a canonical surface exists, to avoid broken or speculative links.
 */
export const NETWORK_SATELLITES: Record<NetworkSatelliteId, NetworkSatellite> = {
  juneauflightdeck: {
    id: "juneauflightdeck",
    name: "Juneau Flight Deck",
    origin: "https://juneauflightdeck.com",
    path: "/",
    corridor: "juneau-port-excursion",
    travelerProblem:
      "Cruise travelers have a fixed port window and need to know what they can safely book before the ship leaves.",
    decisionCompressed:
      "What fits inside the port window, and what happens to the booking if weather cancels it.",
    fulfillment: "Viator and Rezdy excursion inventory, plus direct operators.",
    revenueMode: "partner_booking",
  },
  welcometotheswamp: {
    id: "welcometotheswamp",
    name: "Welcome to the Swamp",
    origin: "https://welcometotheswamp.com",
    path: "/",
    corridor: "new-orleans-swamp-tour",
    travelerProblem:
      "New Orleans visitors face a wall of near-identical swamp tours and cannot tell which one fits them.",
    decisionCompressed:
      "Pickup vs self-drive, airboat vs pontoon, and which tour matches the group before booking.",
    fulfillment: "FareHarbor, Viator, and Rezdy operator inventory.",
    revenueMode: "operator_handoff",
  },
  gosno: {
    id: "gosno",
    name: "GoSno",
    origin: "https://gosno.co",
    path: "/",
    corridor: "colorado-mountain-transfer",
    travelerProblem:
      "Travelers heading from Denver into the mountains underestimate the transfer and pick the wrong way up.",
    decisionCompressed:
      "Shared shuttle vs private transfer for the specific resort, date, and group size.",
    fulfillment: "GoSno transfer operators and direct booking.",
    revenueMode: "operator_handoff",
  },
  partyatredrocks: {
    id: "partyatredrocks",
    name: "Party at Red Rocks",
    origin: "https://www.partyatredrocks.com",
    path: "/",
    corridor: "red-rocks-transport",
    travelerProblem:
      "The hard part of a Red Rocks show is not the venue, it is getting in and back out without a parking disaster.",
    decisionCompressed:
      "Shared shuttle vs private ride based on group size and whether everyone is on one plan.",
    fulfillment: "Party at Red Rocks owned checkout and shuttle operators.",
    revenueMode: "owned_checkout",
  },
  shuttleya: {
    id: "shuttleya",
    name: "Shuttleya",
    origin: "https://shuttleya.com",
    path: "/",
    corridor: "argo-day-transport",
    travelerProblem:
      "Day-trip travelers need a reserved seat on a specific departure, not a vague ride-share gamble.",
    decisionCompressed:
      "Which departure window and seat reservation fits the day plan.",
    fulfillment: "Shuttleya reservations and direct operators.",
    revenueMode: "operator_handoff",
  },
};

export type NetworkSatelliteHandoffContext = {
  /** The public DCC page the traveler is leaving from, e.g. "/". */
  sourcePage: string;
  /** Stable action id for this lane, e.g. "open_juneau_port_excursion_lane". */
  action: string;
  /** The CTA identifier, e.g. "homepage-network-juneau". */
  cta: string;
  /** Optional product/lane slug being routed to. */
  product?: string;
  /** Where this handoff lands, e.g. "satellite" or "operator". */
  routeTarget?: string;
  /** Revenue stage of this handoff. */
  revenueStage?: "intent" | "handoff_viewed" | "booking_started";
};

/**
 * Build an outbound satellite href that preserves the full decision + revenue
 * context. Use this for every public DCC -> satellite link so telemetry is
 * never dropped and CTAs never bypass route context.
 */
export function buildNetworkSatelliteHref(
  satelliteId: NetworkSatelliteId,
  context: NetworkSatelliteHandoffContext
): string {
  const satellite = NETWORK_SATELLITES[satelliteId];
  const url = new URL(satellite.path, satellite.origin);

  const params: Record<string, string> = {
    src: "dcc",
    source_site: DCC_SOURCE_SITE,
    source_domain: DCC_SOURCE_DOMAIN,
    source_page: context.sourcePage,
    decision_corridor: satellite.corridor,
    decision_action: context.action,
    decision_cta: context.cta,
    provider: satellite.id,
    route_target: context.routeTarget || "satellite",
    revenue_mode: satellite.revenueMode,
    revenue_stage: context.revenueStage || "intent",
    ...(context.product ? { decision_product: context.product } : {}),
  };

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  return url.toString();
}

export function listNetworkSatellites(): NetworkSatellite[] {
  return Object.values(NETWORK_SATELLITES);
}
