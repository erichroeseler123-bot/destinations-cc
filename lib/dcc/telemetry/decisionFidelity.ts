import type { DccCorridorEventRow } from "@/lib/db/schema";

export type DecisionFidelityMetrics = {
  corridorId: string;
  corridorName: string;
  planRendered: number;
  planAccepted: number;
  planModified: number;
  planAbandoned: number;
  checkoutStarted: number;
  checkoutCompleted: number;
  planAcceptanceRate: number | null;
  planModificationRate: number | null;
  planAbandonmentRate: number | null;
  checkoutStartRate: number | null;
  checkoutCompletionRate: number | null;
  averageTimeToCheckoutStartMs: number | null;
};

export type DecisionFidelityComparisonRow = {
  metric: string;
  argo: number | null;
  redRocks: number | null;
};

function ratio(numerator: number, denominator: number) {
  if (!denominator) return null;
  return numerator / denominator;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function metadataNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function buildDecisionFidelityMetricsFromEvents(
  corridorId: string,
  corridorName: string,
  events: DccCorridorEventRow[],
): DecisionFidelityMetrics {
  const planRendered = events.filter((event) => event.eventName === "plan_rendered");
  const planAccepted = events.filter((event) => event.eventName === "plan_accepted");
  const planModified = events.filter((event) => event.eventName === "plan_modified");
  const planAbandoned = events.filter((event) => event.eventName === "plan_abandoned");
  const checkoutStarted = events.filter((event) => event.eventName === "checkout_started");
  const checkoutCompleted = events.filter((event) => event.eventName === "checkout_completed");
  const timeToCheckoutValues = checkoutStarted
    .map((event) => metadataNumber(event.metadata?.time_to_checkout_start_ms))
    .filter((value): value is number => value !== null);

  return {
    corridorId,
    corridorName,
    planRendered: planRendered.length,
    planAccepted: planAccepted.length,
    planModified: planModified.length,
    planAbandoned: planAbandoned.length,
    checkoutStarted: checkoutStarted.length,
    checkoutCompleted: checkoutCompleted.length,
    planAcceptanceRate: ratio(planAccepted.length, planRendered.length),
    planModificationRate: ratio(planModified.length, planRendered.length),
    planAbandonmentRate: ratio(planAbandoned.length, planRendered.length),
    checkoutStartRate: ratio(checkoutStarted.length, planRendered.length),
    checkoutCompletionRate: ratio(checkoutCompleted.length, planRendered.length),
    averageTimeToCheckoutStartMs: average(timeToCheckoutValues),
  };
}

export function buildDecisionFidelityComparisonRows(
  argo: DecisionFidelityMetrics | null | undefined,
  redRocks: DecisionFidelityMetrics | null | undefined,
): DecisionFidelityComparisonRow[] {
  return [
    {
      metric: "plan_accepted_rate",
      argo: argo?.planAcceptanceRate ?? null,
      redRocks: redRocks?.planAcceptanceRate ?? null,
    },
    {
      metric: "plan_modified_rate",
      argo: argo?.planModificationRate ?? null,
      redRocks: redRocks?.planModificationRate ?? null,
    },
    {
      metric: "plan_abandoned_rate",
      argo: argo?.planAbandonmentRate ?? null,
      redRocks: redRocks?.planAbandonmentRate ?? null,
    },
    {
      metric: "checkout_started_rate",
      argo: argo?.checkoutStartRate ?? null,
      redRocks: redRocks?.checkoutStartRate ?? null,
    },
    {
      metric: "checkout_completed_rate",
      argo: argo?.checkoutCompletionRate ?? null,
      redRocks: redRocks?.checkoutCompletionRate ?? null,
    },
    {
      metric: "time_to_checkout_start_ms",
      argo: argo?.averageTimeToCheckoutStartMs ?? null,
      redRocks: redRocks?.averageTimeToCheckoutStartMs ?? null,
    },
  ];
}
