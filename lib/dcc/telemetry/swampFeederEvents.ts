export const SWAMP_FEEDER_ENTRY_PAGES = [
  "/new-orleans/swamp-tours/best-swamp-tours",
  "/new-orleans/swamp-tours/airboat-vs-boat",
  "/new-orleans/swamp-tours/which-tour-should-i-book",
  "/new-orleans/swamp-tours/worth-it",
  "/new-orleans/swamp-tours/transportation",
] as const;

export type SwampFeederEntryPage = (typeof SWAMP_FEEDER_ENTRY_PAGES)[number];

export const SWAMP_FEEDER_INTENT_TYPES = [
  "broad-comparison",
  "format-comparison",
  "chooser-shortcut",
  "objection-handling",
  "logistics",
] as const;

export type SwampFeederIntentType = (typeof SWAMP_FEEDER_INTENT_TYPES)[number];

export type SwampFeederSubtype =
  | "types"
  | "airboat-vs-boat"
  | "worth-it"
  | "transportation";

export type SwampFeederContext = "first-time" | "mixed-group" | "no-car";

export type SwampFeederTelemetryConfig = {
  entryPage: SwampFeederEntryPage;
  intentType: SwampFeederIntentType;
  action:
    | "start_swamp_tour_selection"
    | "compare_swamp_tours"
    | "shortcut_swamp_choice"
    | "validate_swamp_tour"
    | "choose_swamp_transport";
  subtype: SwampFeederSubtype;
  context: SwampFeederContext;
};

export type SwampFeederPageViewProps = {
  surface: "dcc";
  lane: "swamp";
  entry_page: SwampFeederEntryPage;
  corridor: "swamp-tours";
  page_type: "feeder";
  intent_type: SwampFeederIntentType;
  destination: "welcometotheswamp";
  destination_surface: "flow";
};

export type SwampFeederCtaClickProps = {
  surface: "dcc";
  lane: "swamp";
  entry_page: SwampFeederEntryPage;
  corridor: "swamp-tours";
  cta: "primary";
  action: SwampFeederTelemetryConfig["action"];
  topic: "swamp-tours";
  subtype: SwampFeederSubtype;
  context: SwampFeederContext;
  destination: "welcometotheswamp";
  destination_surface: "flow";
};

export function buildSwampFeederPageViewProps(
  config: SwampFeederTelemetryConfig,
): SwampFeederPageViewProps {
  return {
    surface: "dcc",
    lane: "swamp",
    entry_page: config.entryPage,
    corridor: "swamp-tours",
    page_type: "feeder",
    intent_type: config.intentType,
    destination: "welcometotheswamp",
    destination_surface: "flow",
  };
}

export function buildSwampFeederCtaClickProps(
  config: SwampFeederTelemetryConfig,
): SwampFeederCtaClickProps {
  return {
    surface: "dcc",
    lane: "swamp",
    entry_page: config.entryPage,
    corridor: "swamp-tours",
    cta: "primary",
    action: config.action,
    topic: "swamp-tours",
    subtype: config.subtype,
    context: config.context,
    destination: "welcometotheswamp",
    destination_surface: "flow",
  };
}
