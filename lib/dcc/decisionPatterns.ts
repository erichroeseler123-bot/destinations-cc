import {
  buildDecisionContinuationUrl,
  type DccDecisionContinuationInput,
} from "@/lib/dcc/contracts/decisionContinuation";

type DecisionPatternKey =
  | "RED_ROCKS_TRANSPORT"
  | "ARGO_SHUTTLE"
  | "AIRPORT_420_PICKUP"
  | "BRECKENRIDGE_TRANSPORT";

type DecisionPatternNetworkRole = "decision_to_execution" | "decision_to_action";

export const CANONICAL_CONTINUATION_FIELDS = [
  "source_page",
  "decision_corridor",
  "decision_cta",
  "decision_action",
  "decision_entry",
  "decision_state",
  "decision_policy",
  "decision_option",
  "decision_product",
  "dcc_handoff_id",
] as const;

export type DecisionPattern = {
  key: DecisionPatternKey;
  corridorId: string;
  label: string;
  canonicalDecisionPath: string;
  executionHost: string;
  executionPath: string;
  handoffParams: readonly string[];
  networkRole: DecisionPatternNetworkRole;
  telemetryKey: string;
  isDefault: boolean;
  action: string;
  option?: string;
  product?: string;
};

export const DECISION_PATTERNS = {
  RED_ROCKS_TRANSPORT: {
    key: "RED_ROCKS_TRANSPORT",
    corridorId: "partyatredrocks-private",
    label: "Red Rocks transport",
    canonicalDecisionPath: "/red-rocks-transportation",
    executionHost: "www.partyatredrocks.com",
    executionPath: "/book/red-rocks-amphitheatre/private",
    handoffParams: CANONICAL_CONTINUATION_FIELDS,
    networkRole: "decision_to_execution",
    telemetryKey: "red_rocks_transport",
    isDefault: true,
    action: "book_red_rocks_transport",
    option: "private-ride",
    product: "red-rocks-private",
  },
  ARGO_SHUTTLE: {
    key: "ARGO_SHUTTLE",
    corridorId: "argo-day-transport",
    label: "Mighty Argo shuttle",
    canonicalDecisionPath: "/mighty-argo-shuttle",
    executionHost: "shuttleya.com",
    executionPath: "/book/argo-shuttle",
    handoffParams: CANONICAL_CONTINUATION_FIELDS,
    networkRole: "decision_to_action",
    telemetryKey: "argo_shuttle",
    isDefault: true,
    action: "book_argo_shuttle",
    option: "argo-shuttle",
    product: "argo-seat",
  },
  AIRPORT_420_PICKUP: {
    key: "AIRPORT_420_PICKUP",
    corridorId: "airport-420-pickup",
    label: "420 airport pickup",
    canonicalDecisionPath: "/denver/weed-airport-pickup",
    executionHost: "420friendlyairportpickup.com",
    executionPath: "/",
    handoffParams: CANONICAL_CONTINUATION_FIELDS,
    networkRole: "decision_to_action",
    telemetryKey: "airport_420_pickup",
    isDefault: true,
    action: "book_transfer",
    option: "airport-pickup",
    product: "airport-pickup",
  },
  BRECKENRIDGE_TRANSPORT: {
    key: "BRECKENRIDGE_TRANSPORT",
    corridorId: "denver-to-breckenridge",
    label: "Breckenridge transport",
    canonicalDecisionPath: "/transportation/colorado/denver-to-breckenridge-without-a-car",
    executionHost: "gosno.co",
    executionPath: "/denver-to-breckenridge",
    handoffParams: CANONICAL_CONTINUATION_FIELDS,
    networkRole: "decision_to_execution",
    telemetryKey: "breckenridge_transport",
    isDefault: true,
    action: "operator_checkout",
    option: "breckenridge-transport",
    product: "breckenridge-ride",
  },
} as const satisfies Record<DecisionPatternKey, DecisionPattern>;

export function getDecisionPatterns(): DecisionPattern[] {
  return Object.values(DECISION_PATTERNS);
}

export function getDecisionPattern(key: DecisionPatternKey): DecisionPattern {
  return DECISION_PATTERNS[key];
}

export function getDecisionPatternExecutionUrl(pattern: DecisionPattern): string {
  return `https://${pattern.executionHost}${pattern.executionPath}`;
}

export function buildDecisionPatternExecutionUrl(
  pattern: DecisionPattern,
  input?: Omit<DccDecisionContinuationInput, "sourcePage" | "corridor" | "action" | "option" | "product"> & {
    sourcePage?: string;
  },
) {
  return buildDecisionContinuationUrl(getDecisionPatternExecutionUrl(pattern), {
    sourcePage: input?.sourcePage ?? pattern.canonicalDecisionPath,
    corridor: pattern.corridorId,
    cta: input?.cta ?? "primary",
    action: pattern.action,
    option: pattern.option,
    product: pattern.product,
    entryMode: input?.entryMode,
    state: input?.state,
    sourceSurface: input?.sourceSurface ?? "dcc",
    destinationSurface: input?.destinationSurface ?? "operator",
    policy: input?.policy ?? "continue_without_reset",
    context: input?.context,
    constraints: input?.constraints,
    handoff: input?.handoff,
  });
}
