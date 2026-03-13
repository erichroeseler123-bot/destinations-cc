import type { DccEdge, DccEdgeType } from "./schema";
import { isValidDccId } from "./ids";

const EDGE_TYPES = new Set<DccEdgeType>([
  "parent_of",
  "child_of",
  "contains",
  "contained_in",
  "near",
  "served_by",
  "serves",
  "connects_to",
  "route_from",
  "route_to",
  "operated_by",
  "offers",
  "belongs_to",
  "has_intent",
  "has_theme",
  "featured_in",
  "related_to",
  "same_as",
  "alias_of",
  "gateway_to",
  "departure_for",
  "arrival_for",
  "covers",
  "explains",
]);

export function isValidEdgeType(type: string): type is DccEdgeType {
  return EDGE_TYPES.has(type as DccEdgeType);
}

export function makeEdge(type: DccEdgeType, to: string, weight?: number | null): DccEdge {
  if (!isValidEdgeType(type)) {
    throw new Error(`Invalid edge type: ${type}`);
  }
  if (!isValidDccId(to)) {
    throw new Error(`Invalid edge target DCC ID: ${to}`);
  }
  return { type, to, weight: weight ?? null };
}

export function validateEdges(edges: DccEdge[]): string[] {
  const errors: string[] = [];
  for (const [i, edge] of (edges || []).entries()) {
    if (!isValidEdgeType(edge.type)) {
      errors.push(`edges[${i}] invalid type: ${edge.type}`);
    }
    if (!isValidDccId(edge.to)) {
      errors.push(`edges[${i}] invalid to: ${edge.to}`);
    }
  }
  return errors;
}
