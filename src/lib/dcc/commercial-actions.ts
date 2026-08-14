import type { CommercialActionConfig, DestinationConfig } from "@/src/data/destination-config-schema";

export type CommercialActionContext = {
  destinationId: string;
  pageKind?: string;
  placeId?: string;
  intent?: string;
};

function matchesAction(action: CommercialActionConfig, context: CommercialActionContext) {
  if (action.destinationIds?.length && !action.destinationIds.includes(context.destinationId)) return false;
  if (action.pageKinds?.length && (!context.pageKind || !action.pageKinds.includes(context.pageKind))) return false;
  if (action.placeIds?.length && (!context.placeId || !action.placeIds.includes(context.placeId))) return false;
  if (context.intent && action.intent !== context.intent) return false;
  return true;
}

export function resolveCommercialActions(config: DestinationConfig, context: CommercialActionContext) {
  return config.commercialActions
    .filter((action) => matchesAction(action, context))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, 2);
}
