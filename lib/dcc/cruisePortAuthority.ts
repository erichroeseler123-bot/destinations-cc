export type DccCruiseMarketRole =
  | "homeport"
  | "port_of_call"
  | "pre_post_cruise_market"
  | "shore_excursion_market";

export type DccCruiseProviderMode = "needs_market_build";

export type DccCruiseCompletionStatus = "needs_domain";

export type DccCruiseTemplateStatus = "not_configured";

export type DccCruiseTelemetryEvent =
  | "landing_viewed"
  | "product_opened"
  | "detail_opened"
  | "handoff_clicked"
  | "provider_cta_clicked";

export interface DccCruisePortEntrypoint {
  id: string;
  portName: string;
  marketName: string;
  marketRoles: DccCruiseMarketRole[];
  placeId: string;
  marketId: string;
  dccAuthorityPath: string;
  suggestedPublicHost: string;
  travelMarketTemplateStatus: DccCruiseTemplateStatus;
  providerMode: DccCruiseProviderMode;
  completionStatus: DccCruiseCompletionStatus;
  passengerRankBasis: string;
  sourceLabel: string;
  sourceUrl: string;
  productLanes: string[];
  dccNotes: string[];
  expectedTelemetryEvents: DccCruiseTelemetryEvent[];
  nextRequiredAction: string;
}

export const CRUISE_PORT_TELEMETRY_EVENTS: DccCruiseTelemetryEvent[] = [
  "landing_viewed",
  "product_opened",
  "detail_opened",
  "handoff_clicked",
  "provider_cta_clicked",
];

export const DCC_CRUISE_PORT_ENTRYPOINTS: DccCruisePortEntrypoint[] = [
  {
    id: "port-canaveral-orlando",
    portName: "Port Canaveral / Orlando",
    marketName: "Port Canaveral Cruise Desk",
    marketRoles: ["homeport", "pre_post_cruise_market", "shore_excursion_market"],
    placeId: "port-canaveral-orlando-fl",
    marketId: "port-canaveral-orlando-cruise-market",
    dccAuthorityPath: "/dcc/cruise-ports/port-canaveral-orlando",
    suggestedPublicHost: "portcanaveralcruisedesk.com",
    travelMarketTemplateStatus: "not_configured",
    providerMode: "needs_market_build",
    completionStatus: "needs_domain",
    passengerRankBasis:
      "Selected as a top global cruise homeport with 2025 passenger volume reported around 8.6 million.",
    sourceLabel: "Public cruise-port passenger-volume reference",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_busiest_cruise_ports_by_passengers",
    productLanes: [
      "Kennedy Space Center",
      "Orlando theme park transfers / pre-post cruise",
      "Airboat / wildlife",
      "Beach / Cocoa Beach",
      "Transportation and timing buffer",
      "Family pre-cruise planning",
    ],
    dccNotes: [
      "DCC classifies this as a high-volume cruise homeport and Orlando pre/post-cruise market.",
      "Primary traveler problem: choosing a family pre-cruise plan, excursion, or transfer without missing embarkation.",
      "Market implementation requires approved images, real inventory, provider URLs, and working detail routes before live launch.",
    ],
    expectedTelemetryEvents: CRUISE_PORT_TELEMETRY_EVENTS,
    nextRequiredAction:
      "Create TravelMarketTemplate host config, approved Port Canaveral/Orlando images, and real provider inventory for Kennedy Space Center, transfers, airboat, beach, and timing-buffer lanes.",
  },
  {
    id: "portmiami",
    portName: "PortMiami",
    marketName: "PortMiami Cruise Desk",
    marketRoles: ["homeport", "pre_post_cruise_market", "shore_excursion_market"],
    placeId: "portmiami-fl",
    marketId: "portmiami-cruise-market",
    dccAuthorityPath: "/dcc/cruise-ports/portmiami",
    suggestedPublicHost: "portmiamicruisedesk.com",
    travelMarketTemplateStatus: "not_configured",
    providerMode: "needs_market_build",
    completionStatus: "needs_domain",
    passengerRankBasis:
      "Selected as a top global cruise homeport with 2025 passenger volume reported around 8.56 million.",
    sourceLabel: "Public PortMiami passenger-volume reference",
    sourceUrl:
      "https://nypost.com/2026/01/27/business/msc-group-opens-100-million-cruise-headquarters-in-miami-as-industry-giant-expands-operations/",
    productLanes: [
      "Miami city tour",
      "Everglades airboat",
      "Biscayne Bay boat tour",
      "South Beach / Art Deco",
      "Airport / cruise transfer context",
      "Pre/post-cruise hotel timing",
    ],
    dccNotes: [
      "DCC classifies this as a high-volume homeport and pre/post-cruise decision market.",
      "Primary traveler problem: fitting Miami tours, airport timing, hotel timing, and cruise transfer logistics into a short window.",
      "Market implementation requires approved images, real inventory, provider URLs, and working detail routes before live launch.",
    ],
    expectedTelemetryEvents: CRUISE_PORT_TELEMETRY_EVENTS,
    nextRequiredAction:
      "Create TravelMarketTemplate host config, approved Miami images, and real provider inventory for city, Everglades, Biscayne Bay, South Beach, transfer, and hotel-timing lanes.",
  },
  {
    id: "nassau",
    portName: "Nassau",
    marketName: "Nassau Cruise Desk",
    marketRoles: ["port_of_call", "shore_excursion_market"],
    placeId: "nassau-bahamas",
    marketId: "nassau-cruise-market",
    dccAuthorityPath: "/dcc/cruise-ports/nassau",
    suggestedPublicHost: "nassaucruisedesk.com",
    travelMarketTemplateStatus: "not_configured",
    providerMode: "needs_market_build",
    completionStatus: "needs_domain",
    passengerRankBasis:
      "Selected as one of the busiest Caribbean cruise ports with 2025 passenger volume reported above 6 million.",
    sourceLabel: "Public cruise-port passenger-volume reference",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_busiest_cruise_ports_by_passengers",
    productLanes: [
      "Atlantis / Paradise Island",
      "Blue Lagoon / beach day",
      "Snorkeling / boat tours",
      "City / history",
      "Food / culture",
      "Cruise pier walking/taxi timing",
    ],
    dccNotes: [
      "DCC classifies this as a high-volume port-of-call shore-excursion market.",
      "Primary traveler problem: choosing a beach, boat, Atlantis, history, or food/culture plan that fits pier return timing.",
      "Market implementation requires approved images, real inventory, provider URLs, and working detail routes before live launch.",
    ],
    expectedTelemetryEvents: CRUISE_PORT_TELEMETRY_EVENTS,
    nextRequiredAction:
      "Create TravelMarketTemplate host config, approved Nassau images, and real provider inventory for Atlantis, Blue Lagoon, snorkeling, history, food/culture, and pier-timing lanes.",
  },
  {
    id: "port-everglades-fort-lauderdale",
    portName: "Port Everglades / Fort Lauderdale",
    marketName: "Port Everglades Cruise Desk",
    marketRoles: ["homeport", "pre_post_cruise_market", "shore_excursion_market"],
    placeId: "port-everglades-fort-lauderdale-fl",
    marketId: "port-everglades-fort-lauderdale-cruise-market",
    dccAuthorityPath: "/dcc/cruise-ports/port-everglades-fort-lauderdale",
    suggestedPublicHost: "portevergladescruisedesk.com",
    travelMarketTemplateStatus: "not_configured",
    providerMode: "needs_market_build",
    completionStatus: "needs_domain",
    passengerRankBasis:
      "Selected as a major Florida cruise homeport with 2025 passenger volume reported around 4.77 million.",
    sourceLabel: "Public Port Everglades passenger-volume reference",
    sourceUrl: "https://en.wikipedia.org/wiki/Port_Everglades",
    productLanes: [
      "Everglades airboat",
      "Fort Lauderdale water taxi / canal tours",
      "Beach / Las Olas",
      "Airport/cruise timing",
      "Pre/post-cruise day plans",
    ],
    dccNotes: [
      "DCC classifies this as a high-volume South Florida homeport and pre/post-cruise market.",
      "Primary traveler problem: choosing a short Fort Lauderdale or Everglades plan around airport, hotel, and ship timing.",
      "Market implementation requires approved images, real inventory, provider URLs, and working detail routes before live launch.",
    ],
    expectedTelemetryEvents: CRUISE_PORT_TELEMETRY_EVENTS,
    nextRequiredAction:
      "Create TravelMarketTemplate host config, approved Fort Lauderdale images, and real provider inventory for Everglades, water taxi, canals, beach, Las Olas, and timing lanes.",
  },
  {
    id: "cozumel",
    portName: "Cozumel",
    marketName: "Cozumel Cruise Desk",
    marketRoles: ["port_of_call", "shore_excursion_market"],
    placeId: "cozumel-mexico",
    marketId: "cozumel-cruise-market",
    dccAuthorityPath: "/dcc/cruise-ports/cozumel",
    suggestedPublicHost: "cozumelcruisedesk.com",
    travelMarketTemplateStatus: "not_configured",
    providerMode: "needs_market_build",
    completionStatus: "needs_domain",
    passengerRankBasis:
      "Selected as one of the busiest Caribbean cruise ports with 2025 passenger volume reported around 4.73 million.",
    sourceLabel: "Public cruise-port passenger-volume reference",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_busiest_cruise_ports_by_passengers",
    productLanes: [
      "Snorkeling / reefs",
      "Beach clubs",
      "Mayan ruins / Tulum or San Gervasio where appropriate",
      "ATV/jeep/island tours",
      "Tequila/food/culture",
      "Cruise pier timing and return buffer",
    ],
    dccNotes: [
      "DCC classifies this as a high-volume port-of-call shore-excursion market.",
      "Primary traveler problem: choosing a reef, beach club, ruins, island, or food/culture plan without missing pier return time.",
      "Market implementation requires approved images, real inventory, provider URLs, and working detail routes before live launch.",
    ],
    expectedTelemetryEvents: CRUISE_PORT_TELEMETRY_EVENTS,
    nextRequiredAction:
      "Create TravelMarketTemplate host config, approved Cozumel images, and real provider inventory for reef, beach club, ruins, ATV/jeep, food/culture, and pier-timing lanes.",
  },
];

export function listDccCruisePortEntrypoints(): DccCruisePortEntrypoint[] {
  return DCC_CRUISE_PORT_ENTRYPOINTS;
}

export function findDccCruisePortEntrypoint(
  marketId: string,
): DccCruisePortEntrypoint | null {
  return DCC_CRUISE_PORT_ENTRYPOINTS.find((entrypoint) => entrypoint.id === marketId) ?? null;
}
