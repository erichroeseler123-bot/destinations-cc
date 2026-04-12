import { buildDccJuneauHelicopterGoUrl } from "@/lib/dcc/routing/middleware";
import type {
  DecisionDestinationInput,
  DecisionDestinationResult,
} from "@/lib/dcc/mapping/types";
import { buildViatorCampaignFromParts } from "@/lib/viator/links";

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

function buildAlaskaCampaign(input: DecisionDestinationInput, lane: string) {
  return buildCampaign([
    "alaska",
    lane,
    input.sourcePage?.replace(/\//g, "-"),
    input.state || "considering",
  ]);
}

function buildJuneauWhaleHref(context: string) {
  const params = new URLSearchParams({
    topic: "whale-watching",
    port: "juneau",
    context,
  });
  return `/juneau/whale-watching-tours?${params.toString()}`;
}

export function mapAlaskaDecisionToDestination(
  input: DecisionDestinationInput,
): DecisionDestinationResult {
  const text = normalizeText(input);

  if (
    hasWord(text, /\bhelicopter\b/i) ||
    hasWord(text, /\bglacier\b/i) ||
    hasWord(text, /\bpremium\b/i)
  ) {
    const campaign = buildAlaskaCampaign(input, "juneau-helicopter");
    return {
      provider: "internal",
      url: buildDccJuneauHelicopterGoUrl({
        port: "juneau",
        lane: "premium-helicopter",
        recommendationSlug: "mapper-helicopter",
        sourcePage: input.sourcePage || "/alaska/helicopter-glacier-tour-worth-it",
      }),
      fit: "exact_product",
      targetKind: "edge_redirect",
      operatorId: "wta",
      routeKey: "alaska-juneau-helicopter",
      reason:
        "Premium helicopter intent is already resolved, so the mapper should continue into the Juneau helicopter execution lane instead of reopening glacier comparison.",
      campaign,
    };
  }

  const whaleContext =
    input.context === "budget" || input.context === "premium" || input.context === "timing"
      ? input.context
      : "first-time";
  const campaign = buildAlaskaCampaign(input, `juneau-whale-${whaleContext}`);
  return {
    provider: "internal",
    url: buildJuneauWhaleHref(whaleContext),
    fit: "tight_shortlist",
    targetKind: "operator_flow",
    operatorId: "wta",
    routeKey: `alaska-juneau-whale-${whaleContext}`,
    reason:
      "Whale intent is already narrowed enough to continue into the Juneau whale lane without restarting the Alaska port decision.",
    campaign,
  };
}
