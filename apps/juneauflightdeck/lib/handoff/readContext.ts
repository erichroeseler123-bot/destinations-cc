import type { HandoffContext } from "./types";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function readHandoffContext(
  input: Record<string, string | string[] | undefined>,
): HandoffContext {
  const rank = Number(first(input.rank));
  const date = first(input.date);
  const decisionCorridor = first(input.decision_corridor) || first(input.topic);
  const decisionProduct = first(input.decision_product) || first(input.product_slug);
  const decisionOption = first(input.decision_option) || first(input.resolved_lane);

  return {
    handoffId: first(input.dcc_handoff_id) || first(input.handoff_id),
    sourcePage: first(input.source_page) || first(input.src_page),
    decisionCorridor,
    decisionCta: first(input.decision_cta),
    decisionAction: first(input.decision_action),
    decisionOption,
    decisionProduct,
    decisionEntry: first(input.decision_entry),
    decisionState: first(input.decision_state),
    requestedLane: first(input.requested_lane) || "premium-helicopter",
    resolvedLane: first(input.resolved_lane) || decisionOption || "glacier-landing",
    topic: first(input.topic) || "juneau-helicopter-tours",
    subtype: first(input.subtype) || "cruise-port",
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    port: first(input.port),
    productSlug: decisionProduct || "glacier-landing",
    continuationLabel: first(input.continuation_label) || "glacier landing shortlist",
    rank: Number.isFinite(rank) ? rank : undefined,
    widgetId: first(input.widget_id),
    widgetPlacement: first(input.widget_placement),
  };
}
