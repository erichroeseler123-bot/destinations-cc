export type DecisionDestinationProvider =
  | "viator"
  | "getyourguide"
  | "internal";

export type DecisionDestinationFit =
  | "exact_product"
  | "tight_shortlist"
  | "broad_fallback";

export type DecisionDestinationTargetKind =
  | "affiliate_search"
  | "affiliate_product"
  | "operator_flow"
  | "operator_checkout"
  | "edge_redirect";

export type DecisionDestinationInput = {
  sourcePage?: string;
  corridor?: string;
  cta?: string;
  action?: string;
  option?: string;
  product?: string;
  entryMode?: "dcc-first" | "flow-first" | "mixed";
  state?: "considering" | "chosen" | "continuing";
  destinationSurface?: "dcc" | "flow" | "operator";
  context?: string;
  constraints?: string[];
  providerPreference?: DecisionDestinationProvider | "auto";
};

export type DecisionDestinationResult = {
  provider: DecisionDestinationProvider;
  url: string;
  fit: DecisionDestinationFit;
  targetKind: DecisionDestinationTargetKind;
  operatorId?: string;
  routeKey: string;
  reason: string;
  campaign: string;
};
