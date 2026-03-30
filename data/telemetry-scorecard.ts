export const TELEMETRY_LAYERS = ["understand", "choose", "act"] as const;

export type TelemetryLayer = (typeof TELEMETRY_LAYERS)[number];

export type TelemetryScorecardEntry = {
  layer: TelemetryLayer;
  metric: string;
  question: string;
  primaryEvent: string;
};

export const telemetryScorecard: readonly TelemetryScorecardEntry[] = [
  {
    layer: "understand",
    metric: "Entry rate",
    question: "Are we getting qualified traffic into the system?",
    primaryEvent: "entry",
  },
  {
    layer: "understand",
    metric: "Forward rate",
    question: "Do users move from understanding into a decision surface?",
    primaryEvent: "forward_click",
  },
  {
    layer: "choose",
    metric: "Shortlist exposure",
    question: "Did we actually give the user a constrained set of options?",
    primaryEvent: "shortlist_impression",
  },
  {
    layer: "choose",
    metric: "Click-forward rate",
    question: "Did the user choose and continue?",
    primaryEvent: "shortlist_click",
  },
  {
    layer: "act",
    metric: "Checkout start",
    question: "Did the user commit to execution?",
    primaryEvent: "checkout_start",
  },
  {
    layer: "act",
    metric: "Completion rate",
    question: "Did the system convert certainty into revenue?",
    primaryEvent: "purchase_complete",
  },
] as const;
