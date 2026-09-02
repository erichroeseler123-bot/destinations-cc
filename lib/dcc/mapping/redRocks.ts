import {
  buildParrPrivateRedRocksUrl,
} from "@/lib/dcc/contracts/dccParrBridge";
import { buildDecisionContinuationParams } from "@/lib/dcc/contracts/decisionContinuation";
import { buildDccDenver420AirportPickupGoUrl } from "@/lib/dcc/routing/middleware";
import type {
  DecisionDestinationInput,
  DecisionDestinationResult,
} from "@/lib/dcc/mapping/types";
import { buildViatorCampaignFromParts } from "@/lib/viator/links";

type SearchParamValue = string | string[] | undefined;

function normalizeText(input: DecisionDestinationInput) {
  return [
    input.corridor,
    input.cta,
    input.action,
    input.option,
    input.product,
    input.context,
    ...(input.constraints || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasWord(text: string, pattern: RegExp) {
  return pattern.test(text);
}

function buildCampaign(parts: Array<string | null | undefined>) {
  return buildViatorCampaignFromParts(parts);
}

function buildBaseParams(input: DecisionDestinationInput): Record<string, SearchParamValue> {
  const params = buildDecisionContinuationParams({
    sourcePage: input.sourcePage || "/red-rocks-transportation",
    corridor: input.corridor || "red-rocks-transport",
    cta: input.cta || "mapped-red-rocks-cta",
    action: input.action || "continue_red_rocks_booking",
    option: input.option,
    product: input.product,
    entryMode: input.entryMode || "dcc-first",
    state: input.state,
    destinationSurface: input.destinationSurface || "flow",
  });

  return {
    src: "dcc",
    ...params,
  };
}

function buildRedRocksCampaign(input: DecisionDestinationInput, lane: string) {
  return buildCampaign([
    "red-rocks",
    lane,
    input.sourcePage?.replace(/\//g, "-"),
    input.state || "considering",
  ]);
}

function buildPrivateDestination(input: DecisionDestinationInput): DecisionDestinationResult {
  const campaign = buildRedRocksCampaign(input, "private");
  return {
    provider: "internal",
    url: buildParrPrivateRedRocksUrl({
      ...buildBaseParams({
        ...input,
        action: "book_private_red_rocks_transport",
        option: "private",
        product: "parr-private",
        destinationSurface: "operator",
      }),
      decision_option: "private",
      decision_product: "parr-private",
      requested_lane: "private",
      resolved_lane: "parr-private",
      product_slug: "parr-private",
    }),
    fit: "exact_product",
    targetKind: "operator_checkout",
    operatorId: "partyatredrocks",
    routeKey: "red-rocks-private-operator",
    reason:
      "Party at Red Rocks currently offers private service only, so Red Rocks transport decisions continue into the current private operator lane.",
    campaign,
  };
}

export function mapRedRocksDecisionToDestination(
  input: DecisionDestinationInput,
): DecisionDestinationResult {
  const text = normalizeText(input);

  if (
    hasWord(text, /\b420\b/i) ||
    hasWord(text, /\bdispensary\b/i) ||
    hasWord(text, /\bairport\b/i)
  ) {
    const campaign = buildRedRocksCampaign(input, "airport-420");
    return {
      provider: "internal",
      url: buildDccDenver420AirportPickupGoUrl({
        sourcePage: input.sourcePage || "/red-rocks-transportation",
        topic: "red-rocks-airport-arrival",
        subtype: hasWord(text, /\b420\b|\bdispensary\b/i)
          ? "airport-to-dispensary"
          : "private",
        context: hasWord(text, /\b420\b|\bdispensary\b/i)
          ? "dispensary-stop"
          : "event-transfer",
        intent: "act",
      }),
      fit: "exact_product",
      targetKind: "edge_redirect",
      operatorId: "airport-420-pickup",
      routeKey: hasWord(text, /\b420\b|\bdispensary\b/i)
        ? "red-rocks-airport-dispensary"
        : "red-rocks-airport-transfer",
      reason:
        "The decision is already narrowed to an airport-arrival operator lane, so the mapper should continue straight into the 420 pickup flow.",
      campaign,
    };
  }

  return buildPrivateDestination(input);
}
