export const ROUTING_LAYERS = ["dcc", "decision", "checkout"] as const;
export const ROUTING_INTENTS = ["explore", "understand", "compare", "act"] as const;
export const ROUTING_SOURCE_SYSTEMS = ["dcc", "wts", "wta", "sots", "parr", "redirect"] as const;
export const DESTINATION_SYSTEMS = ["dcc", "wts", "wta", "sots", "parr"] as const;
export const REDIRECT_SOURCE_TYPES = ["legacy", "external", "search"] as const;
export const REDIRECT_STATUSES = [301, 302, 307, 308] as const;
export const NEXT_STEP_STATUSES = ["yes", "partial", "no"] as const;

export type RoutingLayer = (typeof ROUTING_LAYERS)[number];
export type RoutingIntent = (typeof ROUTING_INTENTS)[number];
export type RoutingSourceSystem = (typeof ROUTING_SOURCE_SYSTEMS)[number];
export type DestinationSystem = (typeof DESTINATION_SYSTEMS)[number];
export type RedirectSourceType = (typeof REDIRECT_SOURCE_TYPES)[number];
export type RedirectStatus = (typeof REDIRECT_STATUSES)[number];
export type NextStepStatus = (typeof NEXT_STEP_STATUSES)[number];

export type RoutingNode = {
  id: string;
  layer: RoutingLayer;
  intent: RoutingIntent;
  topic: string;
  subtype?: string;
  sourceSystem?: RoutingSourceSystem;
  sourcePath?: string;
  destinationSystem: DestinationSystem;
  destinationPath: string;
  nextStepPath?: string;
  notes?: string;
};

export type WarmTransferNode = RoutingNode & {
  transferType: "warm-transfer";
  approvedTopic: string;
  approvedSubtypes?: readonly string[];
  approvedContexts?: readonly string[];
  approvedSourcePages?: readonly string[];
  context?: string;
  sourcePage?: string;
  canonicalIntakePath?: string;
  packetVersion: 1;
};

export type RedirectNode = RoutingNode & {
  transferType: "redirect";
  sourceType: RedirectSourceType;
  redirectStatus: RedirectStatus;
  canonicalDestination: boolean;
  nextStepStatus: NextStepStatus;
  externalDemandNotes?: string;
};

export type LandingNode = RoutingNode & {
  transferType: "landing";
  intentMatchScore: 1 | 2 | 3 | 4 | 5;
  nextStepClarityScore: 1 | 2 | 3 | 4 | 5;
  needsRewrite: boolean;
  needsRedirect: boolean;
  needsDedicatedLandingPage: boolean;
  reviewedAt?: string;
};
