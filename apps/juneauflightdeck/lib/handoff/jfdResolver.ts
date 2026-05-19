import type { HandoffContext, InitialUiState, ResolverRule } from "./types";

export const jfdBaseState: InitialUiState = {
  headline: "Choose the Juneau tour that fits your cruise day.",
  supportLine: "Premium glacier-flight options narrowed to the strongest cruise-day fit first.",
  arrivalConfirmationLine: "You’re in the right place for Juneau helicopter tours on a cruise-day schedule.",
  primaryCtaLabel: "Choose my tour",
  urgency: "medium",
  defaultCardSlug: "glacier-landing",
  prioritizedCardSlugs: ["glacier-landing", "icefield-explorer", "dogsled-combo"],
  sortMode: "fit",
  fitSignal: "cruise-day",
};

export const jfdResolverRules: ResolverRule[] = [
  {
    id: "jfd-cruise-port",
    match: (context: HandoffContext) =>
      context.decisionCorridor === "juneau_glacier_whale_cruise_excursion" ||
      context.topic === "juneau-helicopter-tours",
    resolve: () => ({
      confidence: 0.92,
      reason: "Explicit Juneau helicopter cruise-day handoff",
      patch: {
        headline: "Best Juneau helicopter tours for your cruise day",
        supportLine: "Premium glacier-flight options narrowed to the strongest cruise-day fit first.",
        arrivalConfirmationLine:
          "You’re in the right place for Juneau helicopter tours on a cruise-day schedule.",
        primaryCtaLabel: "Check your date",
        urgency: "high",
        defaultCardSlug: "glacier-landing",
        prioritizedCardSlugs: ["glacier-landing", "icefield-explorer", "dogsled-combo"],
        sortMode: "fit",
        fitSignal: "cruise-day",
      },
    }),
  },
  {
    id: "jfd-date-known",
    match: (context: HandoffContext) => Boolean(context.date),
    resolve: (context: HandoffContext) => ({
      confidence: 0.96,
      reason: "Valid cruise date supplied",
      patch: {
        prefilledDate: context.date,
      },
    }),
  },
  {
    id: "jfd-explicit-product",
    match: (context: HandoffContext) => Boolean(context.productSlug || context.decisionProduct),
    resolve: (context: HandoffContext) => ({
      confidence: 0.95,
      reason: "Specific product slug supplied",
      patch: {
        defaultCardSlug: context.productSlug || context.decisionProduct,
      },
    }),
  },
];
