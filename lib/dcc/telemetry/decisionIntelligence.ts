export type DecisionEventLike = {
  corridorId: string;
  eventName: string;
  sourcePage: string | null;
  targetPath: string | null;
  clickedProductSlug: string | null;
  routeTarget?: string | null;
  metadata: Record<string, unknown>;
};

export const DECISION_VIEW_EVENT_NAMES = new Set([
  "landing_viewed",
  "verdict_shown",
]);

export const DECISION_ACCEPTANCE_EVENT_NAMES = new Set([
  "product_opened",
  "cta_clicked_primary",
  "operator_cta_clicked",
]);

export function metadataString(event: DecisionEventLike, key: string) {
  const value = event.metadata?.[key];
  return typeof value === "string" ? value : "";
}

export function isUpwardEscapeEvent(event: DecisionEventLike) {
  return event.eventName === "hub_selected" || metadataString(event, "decision_action") === "hub_selected";
}

export function isSidewaysEscapeEvent(event: DecisionEventLike) {
  return (
    event.eventName === "sideways_lane_selected" ||
    metadataString(event, "decision_action") === "sideways_lane_selected"
  );
}

export function isDecisionAcceptanceEvent(event: DecisionEventLike) {
  return DECISION_ACCEPTANCE_EVENT_NAMES.has(event.eventName) && !isUpwardEscapeEvent(event) && !isSidewaysEscapeEvent(event);
}

export function hasDecisionRouteContext(event: DecisionEventLike) {
  return Boolean(
    event.targetPath ||
      event.clickedProductSlug ||
      event.routeTarget ||
      metadataString(event, "target_path") ||
      metadataString(event, "target_url") ||
      metadataString(event, "route_target") ||
      metadataString(event, "route_key"),
  );
}

export function countDecisionAttempts(events: DecisionEventLike[]) {
  return events.filter((event) => DECISION_VIEW_EVENT_NAMES.has(event.eventName)).length;
}

export function countAcceptedVerdicts(events: DecisionEventLike[]) {
  return events.filter(isDecisionAcceptanceEvent).length;
}

export function countRoutingLeaks(events: DecisionEventLike[]) {
  return events.filter((event) => isDecisionAcceptanceEvent(event) && !hasDecisionRouteContext(event)).length;
}
