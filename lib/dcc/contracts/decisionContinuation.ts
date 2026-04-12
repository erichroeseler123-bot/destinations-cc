export type DccDecisionEntryMode = "dcc-first" | "flow-first" | "mixed";
export type DccDecisionState = "considering" | "chosen" | "continuing";
export type DccDecisionSurface = "dcc" | "flow" | "operator";
export type DccDecisionPolicy = "continue_without_reset" | "decision_support";

export type DccDecisionContinuationInput = {
  sourcePage: string;
  corridor: string;
  cta: string;
  action: string;
  option?: string;
  product?: string;
  entryMode: DccDecisionEntryMode;
  state?: DccDecisionState;
  sourceSurface?: DccDecisionSurface;
  destinationSurface?: DccDecisionSurface;
  policy?: DccDecisionPolicy;
};

export function buildDecisionContinuationParams(input: DccDecisionContinuationInput) {
  return {
    source_page: input.sourcePage,
    decision_state: input.state || "chosen",
    decision_surface: input.sourceSurface || "dcc",
    destination_surface: input.destinationSurface || "flow",
    decision_corridor: input.corridor,
    decision_cta: input.cta,
    decision_action: input.action,
    decision_entry: input.entryMode,
    decision_policy: input.policy || "continue_without_reset",
    ...(input.option ? { decision_option: input.option } : {}),
    ...(input.product ? { decision_product: input.product } : {}),
  };
}

export function buildDecisionContinuationUrl(baseUrl: string, input: DccDecisionContinuationInput) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(buildDecisionContinuationParams(input))) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}
