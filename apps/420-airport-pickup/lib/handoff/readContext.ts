import type { HandoffContext } from "./types";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function readHandoffContext(input: Record<string, string | string[] | undefined>): HandoffContext {
  const rank = Number(first(input.rank));
  const decisionProduct = first(input.decision_product) || first(input.product_slug);
  const decisionOption = first(input.decision_option) || first(input.resolved_lane);
  const requestedLane = first(input.requested_lane);
  const resolvedLane = first(input.resolved_lane) || decisionOption;

  return {
    handoffId: first(input.dcc_handoff_id),
    sourcePage: first(input.source_page),
    decisionCorridor: first(input.decision_corridor),
    decisionCta: first(input.decision_cta),
    decisionAction: first(input.decision_action),
    decisionOption,
    decisionProduct,
    decisionEntry: first(input.decision_entry),
    decisionState: first(input.decision_state),
    requestedLane:
      requestedLane ||
      (decisionOption?.includes("private") ? "private-transfer" : undefined),
    resolvedLane,
    topic: first(input.topic),
    subtype: first(input.subtype),
    date: first(input.date),
    port: first(input.port),
    productSlug: decisionProduct,
    rank: Number.isFinite(rank) ? rank : undefined,
    widgetId: first(input.widget_id),
    widgetPlacement: first(input.widget_placement),
  };
}
