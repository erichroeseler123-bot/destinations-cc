export type BinaryDecisionChoice = {
  id: "standard-arrival" | "enhanced-420-arrival";
  title: string;
  body: string;
  bullets?: readonly string[];
  href: string;
  ctaLabel: string;
  ctaMode: "booking";
};

export type BinaryDecisionResult = {
  key: "standard-vs-420";
  layer: "act";
  eyebrow: string;
  title: string;
  summary: string;
  choices: readonly [BinaryDecisionChoice, BinaryDecisionChoice];
};

export function resolveStandardVs420Decision(input: {
  standardHref: string;
  enhanced420Href: string;
}): BinaryDecisionResult {
  return {
    key: "standard-vs-420",
    layer: "act",
    eyebrow: "Arrival options",
    title: "Choose the pickup that fits your arrival.",
    summary:
      "The main choice here is simple: do you want the fastest private ride from DEN, or do you want a 420-friendly arrival with the dispensary stop built into the route?",
    choices: [
      {
        id: "standard-arrival",
        title: "Standard private airport pickup",
        body:
          "Choose this when the goal is the fastest clean arrival from DEN to your drop-off without adding another stop to the route.",
        bullets: [
          "Fastest path from baggage claim to the city",
          "Best if the stop is optional or can wait until later",
          "Cleaner fit when the route priority is arrival speed",
        ],
        href: input.standardHref,
        ctaLabel: "Book Standard Pickup",
        ctaMode: "booking",
      },
      {
        id: "enhanced-420-arrival",
        title: "420-friendly pickup with dispensary stop",
        body:
          "Choose this when the curated stop is part of the arrival experience and you want it designed into the route before checkout starts.",
        bullets: [
          "Built-in dispensary stop instead of improvising after landing",
          "Stronger fit for visitors who want the Colorado-specific version of the arrival",
          "Best when the experience matters as much as the transfer",
        ],
        href: input.enhanced420Href,
        ctaLabel: "Book 420-Friendly Pickup",
        ctaMode: "booking",
      },
    ],
  };
}
