export type DccDecisionEntryMode = "dcc-first" | "flow-first" | "mixed";
export type DccDecisionState = "considering" | "chosen" | "continuing";
export type DccDecisionSurface = "dcc" | "flow" | "operator";
export type DccDecisionPolicy = "continue_without_reset" | "decision_support";
export type DccExecutionTier =
  | "decision_hub"
  | "decision_surface"
  | "owned_execution"
  | "controlled_partner_execution"
  | "marketplace_fallback_inventory"
  | "traveler_self_execution_fallback";

export type DccDecisionContinuationInput = {
  sourcePage: string;
  corridor: string;
  cta: string;
  action: string;
  option?: string;
  product?: string;
  entryMode?: DccDecisionEntryMode;
  state?: DccDecisionState;
  sourceSurface?: DccDecisionSurface;
  destinationSurface?: DccDecisionSurface;
  policy?: DccDecisionPolicy;
  routeKey?: string;
  executionTier?: DccExecutionTier;
  sourceNetworkRole?: string;
  destinationNetworkRole?: string;
  experienceType?: string;
  continuityContract?: string;
  handoffId?: string;
  context?: string;
  constraints?: string[];
  handoff?: DccDecisionHandoffInput;
};

export type DccDecisionHandoffInput = {
  corridorId: string;
  recommendationId: string;
  handoffId: string;
  productId: string;
  departureTs: string;
  returnTs?: string;
  qty?: number | string;
  pickupLocationId?: string;
};

export function buildDecisionHandoffParams(input: DccDecisionHandoffInput) {
  return {
    c_id: input.corridorId,
    r_id: input.recommendationId,
    h_id: input.handoffId,
    pid: input.productId,
    dep_ts: input.departureTs,
    ...(input.returnTs ? { ret_ts: input.returnTs } : {}),
    ...(input.qty !== undefined && input.qty !== null ? { qty: String(input.qty) } : {}),
    ...(input.pickupLocationId ? { loc_id: input.pickupLocationId } : {}),
  };
}

export function buildDecisionContinuationParams(input: DccDecisionContinuationInput) {
  return {
    source_page: input.sourcePage,
    decision_state: input.state || "chosen",
    decision_surface: input.sourceSurface || "dcc",
    destination_surface: input.destinationSurface || "flow",
    decision_corridor: input.corridor,
    decision_cta: input.cta,
    decision_action: input.action,
    decision_entry: input.entryMode || "dcc-first",
    decision_policy: input.policy || "continue_without_reset",
    ...(input.routeKey ? { route_key: input.routeKey } : {}),
    ...(input.executionTier ? { execution_tier: input.executionTier } : {}),
    ...(input.sourceNetworkRole ? { source_network_role: input.sourceNetworkRole } : {}),
    ...(input.destinationNetworkRole ? { destination_network_role: input.destinationNetworkRole } : {}),
    ...(input.experienceType ? { experience_type: input.experienceType } : {}),
    ...(input.continuityContract ? { continuity_contract: input.continuityContract } : {}),
    ...(input.handoffId ? { dcc_handoff_id: input.handoffId } : {}),
    ...(input.option ? { decision_option: input.option } : {}),
    ...(input.product ? { decision_product: input.product } : {}),
    ...(input.handoff ? buildDecisionHandoffParams(input.handoff) : {}),
  };
}

export function buildDecisionContinuationUrl(baseUrl: string, input: DccDecisionContinuationInput) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(buildDecisionContinuationParams(input))) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}
