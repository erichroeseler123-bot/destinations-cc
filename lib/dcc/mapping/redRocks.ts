import {
  buildParrPrivateRedRocksUrl,
  buildParrSharedRedRocksUrl,
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

  if (
    hasWord(text, /\bprivate\b/i) ||
    hasWord(text, /\bgroup\b/i) ||
    (input.constraints || []).some((constraint) =>
      ["group", "large-group", "private"].includes(constraint.toLowerCase()),
    )
  ) {
    const campaign = buildRedRocksCampaign(input, "private");
    return {
      provider: "internal",
      url: buildParrPrivateRedRocksUrl({
        ...buildBaseParams({
          ...input,
          action: input.action || "book_private_red_rocks_transport",
          option: input.option || "private",
          product: input.product || "parr-suburban",
          destinationSurface: "operator",
        }),
      }),
      fit: "exact_product",
      targetKind: "operator_checkout",
      operatorId: "partyatredrocks",
      routeKey: "red-rocks-private-operator",
      reason:
        "The group already needs a private Red Rocks operator lane, so the mapper should continue into the PARR private booking path.",
      campaign,
    };
  }

  const campaign = buildRedRocksCampaign(input, "shared");
  return {
    provider: "internal",
    url: buildParrSharedRedRocksUrl({
      ...buildBaseParams({
        ...input,
        action: input.action || "book_shared_red_rocks_shuttle",
        option: input.option || "shuttle",
        product: input.product || "shared-red-rocks-shuttle-seat",
        destinationSurface: "operator",
      }),
    }),
    fit: "exact_product",
    targetKind: "operator_checkout",
    operatorId: "partyatredrocks",
    routeKey: "red-rocks-shared-operator",
    reason:
      "The decision is already narrowed to the shared shuttle lane, so the mapper should continue into the PARR shared booking flow instead of reopening transport comparison.",
    campaign,
  };
}
