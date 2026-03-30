import { ROUTING_INTENTS, type RoutingIntent, type WarmTransferNode } from "../core";

export const WARM_TRANSFER_SUBTYPES = [
  "airboat",
  "bayou",
  "boat",
  "comfort",
  "speed",
  "families",
  "half-day",
  "pickup",
  "airboat-vs-boat",
  "best-time",
  "with-kids",
  "worth-it",
  "transportation",
  "types",
] as const;

export const WARM_TRANSFER_CONTEXTS = ["first-time", "kids", "no-car", "short-trip", "mixed-group"] as const;
export const WARM_TRANSFER_SOURCES = ["dcc", "wts"] as const;
export const WARM_TRANSFER_SOURCE_PAGES = [
  "/new-orleans/tours",
  "/new-orleans/swamp-tours",
  "/new-orleans/swamp-tours/airboat-vs-boat",
  "/new-orleans/swamp-tours/best-time",
  "/new-orleans/swamp-tours/wildlife",
  "/new-orleans/swamp-tours/with-kids",
  "/new-orleans/swamp-tours/worth-it",
  "/new-orleans/swamp-tours/transportation",
  "/new-orleans/swamp-tours/types",
  "/new-orleans/swamp-tours/airboat-vs-boat",
  "/new-orleans/swamp-tours/best-time",
  "/new-orleans/swamp-tours/with-kids",
  "/new-orleans/swamp-tours/worth-it",
  "/new-orleans/swamp-tours/transportation",
] as const;

export const WARM_TRANSFER_INTENTS = ROUTING_INTENTS;
export const WARM_TRANSFER_TOPICS = ["swamp-tours"] as const;

export type WarmTransferIntent = RoutingIntent;
export type WarmTransferTopic = (typeof WARM_TRANSFER_TOPICS)[number];
export type WarmTransferSubtype = (typeof WARM_TRANSFER_SUBTYPES)[number];
export type WarmTransferContext = (typeof WARM_TRANSFER_CONTEXTS)[number];
export type WarmTransferSource = (typeof WARM_TRANSFER_SOURCES)[number];
export type WarmTransferSourcePage = (typeof WARM_TRANSFER_SOURCE_PAGES)[number];

export type WarmTransferPacket = {
  intent: WarmTransferIntent;
  topic: WarmTransferTopic;
  subtype?: WarmTransferSubtype;
  context?: WarmTransferContext;
  source?: WarmTransferSource;
  sourcePage?: WarmTransferSourcePage;
};

export const SWAMP_WARM_TRANSFER_NODE = {
  id: "wt:swamp:plan",
  transferType: "warm-transfer",
  layer: "decision",
  intent: "compare",
  topic: "swamp-tours",
  sourceSystem: "dcc",
  sourcePath: "/new-orleans/swamp-tours",
  destinationSystem: "wts",
  destinationPath: "https://welcometotheswamp.com/plan",
  nextStepPath: "https://welcometotheswamp.com/live-options",
  canonicalIntakePath: "/plan",
  approvedTopic: "swamp-tours",
  approvedSubtypes: WARM_TRANSFER_SUBTYPES,
  approvedContexts: WARM_TRANSFER_CONTEXTS,
  approvedSourcePages: WARM_TRANSFER_SOURCE_PAGES,
  packetVersion: 1,
  notes:
    "WTS is the swamp-tour decision satellite. /plan is the canonical intake for DCC handoffs, shortlist logic, tradeoff explanation, and best-fit routing.",
} as const satisfies WarmTransferNode;

export const WARM_TRANSFER_NODES = [SWAMP_WARM_TRANSFER_NODE] as const satisfies readonly WarmTransferNode[];
