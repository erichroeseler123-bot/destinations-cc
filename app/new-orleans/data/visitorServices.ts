export type VisitorServiceType =
  | "orientation"
  | "tour-selection-help"
  | "booking-assistance";

export type VisitorService = {
  id: string;
  title: string;
  type: VisitorServiceType;
  description: string;
  route: string;
  phone?: string;
  bookable: boolean;
  humanDelivered: boolean;
  primaryOutcome: string;
};

/**
 * WNO is not only a catalog of third-party tours. These are owned visitor-help
 * services and should be treated as first-class parts of the site identity,
 * navigation, recommendation system, structured data, and AI-readable output.
 */
export const VISITOR_SERVICES: VisitorService[] = [
  {
    id: "french-quarter-orientation",
    title: "French Quarter Orientation",
    type: "orientation",
    description:
      "A bookable New Orleans orientation that helps visitors get their bearings and make better choices about the rest of their time in the city.",
    route: "/french-quarter-welcome-stop",
    bookable: true,
    humanDelivered: true,
    primaryOutcome: "Understand the city and leave with a clearer plan.",
  },
  {
    id: "human-tour-selection-help",
    title: "Human Help Choosing a Tour",
    type: "tour-selection-help",
    description:
      "A visitor can talk with a person about timing, group needs, interests, and tour tradeoffs instead of choosing from a catalog alone.",
    route: "/help-me-choose",
    phone: "504-484-9687",
    bookable: false,
    humanDelivered: true,
    primaryOutcome: "Narrow the tour choices to the best fit for the visitor or group.",
  },
  {
    id: "booking-assistance",
    title: "Tour Booking Assistance",
    type: "booking-assistance",
    description:
      "Human help connecting a visitor's decision to an appropriate real booking path through participating inventory.",
    route: "/contact",
    phone: "504-484-9687",
    bookable: false,
    humanDelivered: true,
    primaryOutcome: "Turn a visitor decision into a real, appropriate booking path.",
  },
];

export const VISITOR_SERVICES_BY_ID: Record<string, VisitorService> = Object.fromEntries(
  VISITOR_SERVICES.map((service) => [service.id, service]),
);
