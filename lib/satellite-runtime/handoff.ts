import type { SatelliteContract, SatelliteDecisionContext, SatelliteHandoffContext } from "./types";

type HandoffSource = URL | URLSearchParams | Record<string, unknown>;

const FIELD_ALIASES: Record<keyof SatelliteDecisionContext | "dccHandoffId" | "source_url" | "destination_url", string[]> = {
  dccHandoffId: ["dccHandoffId", "dcc_handoff_id", "handoffId", "handoff_id"],
  decision_corridor: ["decision_corridor", "decisionCorridor", "corridor"],
  decision_action: ["decision_action", "decisionAction", "action"],
  decision_option: ["decision_option", "decisionOption", "option"],
  decision_product: ["decision_product", "decisionProduct", "product"],
  source_url: ["source_url", "sourceUrl", "source"],
  destination_url: ["destination_url", "destinationUrl", "destination"],
};

function entriesFromSource(source: HandoffSource): Record<string, unknown> {
  if (source instanceof URL) {
    return Object.fromEntries(source.searchParams.entries());
  }

  if (source instanceof URLSearchParams) {
    return Object.fromEntries(source.entries());
  }

  return source;
}

function readString(source: Record<string, unknown>, aliases: string[]): string | null {
  for (const key of aliases) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

export function normalizeDecisionContext(source: HandoffSource): SatelliteDecisionContext {
  const data = entriesFromSource(source);
  return {
    decision_corridor: readString(data, FIELD_ALIASES.decision_corridor),
    decision_action: readString(data, FIELD_ALIASES.decision_action),
    decision_option: readString(data, FIELD_ALIASES.decision_option),
    decision_product: readString(data, FIELD_ALIASES.decision_product),
  };
}

export function parseSatelliteHandoff(
  source: HandoffSource,
  contract: SatelliteContract,
  fallbackHandoffId: string,
): SatelliteHandoffContext {
  const data = entriesFromSource(source);
  const decision = normalizeDecisionContext(data);

  return {
    satelliteId: contract.satelliteId,
    brandId: contract.brandId,
    dccBaseUrl: contract.dccBaseUrl,
    dccHandoffId: readString(data, FIELD_ALIASES.dccHandoffId) || fallbackHandoffId,
    source_url: readString(data, FIELD_ALIASES.source_url),
    destination_url: readString(data, FIELD_ALIASES.destination_url),
    ...decision,
  };
}

export function toHandoffSearchParams(handoff: SatelliteHandoffContext): URLSearchParams {
  const params = new URLSearchParams();
  params.set("dcc_handoff_id", handoff.dccHandoffId);

  for (const key of ["decision_corridor", "decision_action", "decision_option", "decision_product"] as const) {
    const value = handoff[key];
    if (value) params.set(key, value);
  }

  if (handoff.source_url) params.set("source_url", handoff.source_url);
  if (handoff.destination_url) params.set("destination_url", handoff.destination_url);

  return params;
}
