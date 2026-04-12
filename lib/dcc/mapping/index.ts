import type {
  DecisionDestinationInput,
  DecisionDestinationResult,
} from "@/lib/dcc/mapping/types";
import { mapRedRocksDecisionToDestination } from "@/lib/dcc/mapping/redRocks";
import { mapAlaskaDecisionToDestination } from "@/lib/dcc/mapping/alaska";

function looksLikeRedRocksCorridor(input: DecisionDestinationInput) {
  const text = [input.corridor, input.action, input.option, input.product]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes("red-rocks") || text.includes("red rocks");
}

function looksLikeAlaskaCorridor(input: DecisionDestinationInput) {
  const text = [input.corridor, input.action, input.option, input.product, input.sourcePage]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes("alaska") || text.includes("juneau") || text.includes("whale");
}

export function mapDecisionToDestination(
  input: DecisionDestinationInput,
): DecisionDestinationResult | null {
  if (looksLikeRedRocksCorridor(input)) {
    return mapRedRocksDecisionToDestination(input);
  }

  if (looksLikeAlaskaCorridor(input)) {
    return mapAlaskaDecisionToDestination(input);
  }

  return null;
}

export type {
  DecisionDestinationFit,
  DecisionDestinationInput,
  DecisionDestinationProvider,
  DecisionDestinationResult,
} from "@/lib/dcc/mapping/types";
