import type { NextStepStatus, RedirectSourceType, RoutingIntent } from "@/src/data/routing/core";
import { LANDING_NODES } from "@/src/data/routing/nodes/landings";
import { REDIRECT_NODES } from "@/src/data/routing/nodes/redirects";

export type RoutingSourceType = RedirectSourceType;
export type RoutingDestinationType = "dcc" | "wts" | "parr";

export type RedirectIntentRecord = {
  sourcePath: string;
  sourceType: RoutingSourceType;
  detectedIntent: RoutingIntent;
  destinationPath: string;
  destinationType: RoutingDestinationType;
  intentMatchScore: 1 | 2 | 3 | 4 | 5;
  needsIntentUpgrade: boolean;
  nextStepExists: NextStepStatus;
  notes: string;
};

const landingBySourcePath = new Map(LANDING_NODES.map((node) => [node.sourcePath, node] as const));

export const REDIRECT_INTENT_REGISTRY: RedirectIntentRecord[] = REDIRECT_NODES.map((node) => {
  const landing = landingBySourcePath.get(node.sourcePath);
  if (!landing) {
    throw new Error(`Missing landing node for redirect ${node.id} (${node.sourcePath}).`);
  }


  return {
    sourcePath: node.sourcePath || "",
    sourceType: node.sourceType,
    detectedIntent: node.intent,
    destinationPath: node.destinationPath,
    destinationType: node.destinationSystem,
    intentMatchScore: landing.intentMatchScore,
    needsIntentUpgrade: landing.needsRewrite,
    nextStepExists: node.nextStepStatus,
    notes: node.notes || landing.notes || "",
  };
});
