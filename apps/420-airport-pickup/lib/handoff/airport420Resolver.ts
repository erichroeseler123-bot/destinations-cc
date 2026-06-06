import type { HandoffContext, InitialUiState, ResolverRule } from "./types";

export const airport420BaseState: InitialUiState = {
  headline: "Private Denver airport pickup with optional dispensary stop",
  supportLine:
    "A premium Denver arrival plan with private SUVs, cleaner logistics, and one clear next step after landing.",
  arrivalConfirmationLine: "You’re in the right place for a premium Denver airport arrival.",
  primaryCtaLabel: "Check pickup options",
  urgency: "medium",
  defaultCardSlug: "airport-pickup",
  prioritizedCardSlugs: [
    "airport-pickup",
    "airport-dispensary",
    "airport-red-rocks",
    "airport-mountain",
  ],
  sortMode: "recommended",
};

export const airport420ResolverRules: ResolverRule[] = [
  {
    id: "airport420-red-rocks-explicit",
    match: (ctx: HandoffContext) =>
      (ctx.decisionCorridor || "").includes("red-rocks") ||
      (ctx.decisionOption || "").includes("red-rocks") ||
      (ctx.decisionProduct || "").includes("airport-red-rocks") ||
      (ctx.topic || "").includes("red-rocks-airport-arrival") ||
      (ctx.sourcePage || "").includes("red-rocks") ||
      (ctx.productSlug || "").includes("airport-red-rocks"),
    resolve: () => ({
      confidence: 0.93,
      reason: "Explicit Red Rocks arrival intent",
      patch: {
        headline: "Best Denver airport arrival option before Red Rocks",
        arrivalConfirmationLine:
          "You’re in the right place for a Denver arrival that keeps the Red Rocks plan clean.",
        primaryCtaLabel: "Check Red Rocks pickup options",
        defaultCardSlug: "airport-red-rocks",
        prioritizedCardSlugs: [
          "airport-red-rocks",
          "airport-pickup",
          "airport-dispensary",
          "airport-mountain",
        ],
        sortMode: "fit",
        fitSignal: "event-transfer",
        urgency: "high",
      },
    }),
  },
  {
    id: "airport420-cannabis",
    match: (ctx: HandoffContext) =>
      (ctx.decisionOption || "").includes("dispensary") ||
      (ctx.decisionProduct || "").includes("dispensary") ||
      (ctx.subtype || "").includes("420") ||
      (ctx.topic || "").includes("dispensary") ||
      (ctx.productSlug || "").includes("dispensary"),
    resolve: () => ({
      confidence: 0.95,
      reason: "Explicit dispensary-stop intent",
      patch: {
        headline: "Private Denver airport pickup with curated dispensary stop",
        arrivalConfirmationLine:
          "You’re in the right place if the arrival plan includes one clean dispensary stop.",
        primaryCtaLabel: "Check dispensary-stop options",
        defaultCardSlug: "airport-dispensary",
        prioritizedCardSlugs: [
          "airport-dispensary",
          "airport-pickup",
          "airport-red-rocks",
          "airport-mountain",
        ],
        sortMode: "fit",
        fitSignal: "420-arrival",
      },
    }),
  },
  {
    id: "airport420-mountain",
    match: (ctx: HandoffContext) =>
      (ctx.decisionCorridor || "").includes("mountain") ||
      (ctx.decisionOption || "").includes("mountain") ||
      (ctx.decisionProduct || "").includes("airport-mountain") ||
      (ctx.topic || "").includes("ski") ||
      (ctx.topic || "").includes("mountain") ||
      (ctx.resolvedLane || "").includes("mountain") ||
      (ctx.subtype || "").includes("mountain-route"),
    resolve: () => ({
      confidence: 0.9,
      reason: "Mountain transfer intent",
      patch: {
        headline: "Private Denver airport pickup for mountain-bound arrivals",
        arrivalConfirmationLine:
          "You’re in the right place for a private airport transfer before the mountain leg starts.",
        primaryCtaLabel: "Check mountain transfer options",
        defaultCardSlug: "airport-mountain",
        prioritizedCardSlugs: [
          "airport-mountain",
          "airport-pickup",
          "airport-dispensary",
          "airport-red-rocks",
        ],
        sortMode: "fit",
        fitSignal: "mountain-transfer",
      },
    }),
  },
  {
    id: "airport420-private-arrival-base",
    match: (ctx: HandoffContext) =>
      (ctx.decisionAction || "").includes("book") ||
      (ctx.decisionAction || "").includes("checkout") ||
      (ctx.decisionCorridor || "").includes("airport-420-pickup") ||
      (ctx.subtype || "").includes("private") ||
      (ctx.requestedLane || "").includes("private-transfer") ||
      (ctx.topic || "").includes("arrival"),
    resolve: () => ({
      confidence: 0.84,
      reason: "Broad private Denver arrival intent",
      patch: {
        headline: "Private Denver airport pickup with one clean arrival plan",
        arrivalConfirmationLine:
          "You’re in the right place for a clean private Denver airport arrival before the next leg starts.",
        supportLine:
          "Start with the cleanest broad airport-arrival plan first, then switch only if the route is explicitly Red Rocks, mountain-bound, or dispensary-first.",
        primaryCtaLabel: "Check airport pickup options",
        defaultCardSlug: "airport-pickup",
        prioritizedCardSlugs: [
          "airport-pickup",
          "airport-red-rocks",
          "airport-dispensary",
          "airport-mountain",
        ],
        sortMode: "recommended",
        fitSignal: "private-transfer",
      },
    }),
  },
  {
    id: "airport420-red-rocks-weak",
    match: (ctx: HandoffContext) =>
      (ctx.decisionOption || "").includes("event-transfer") ||
      (ctx.resolvedLane || "").includes("event-transfer") ||
      (ctx.topic || "").includes("concert"),
    resolve: () => ({
      confidence: 0.78,
      reason: "Broad event-transfer context without explicit Red Rocks signal",
      patch: {
        prioritizedCardSlugs: [
          "airport-pickup",
          "airport-red-rocks",
          "airport-dispensary",
          "airport-mountain",
        ],
        fitSignal: "event-transfer",
        urgency: "high",
      },
    }),
  },
  {
    id: "airport420-date-known",
    match: (ctx: HandoffContext) => Boolean(ctx.date),
    resolve: (ctx: HandoffContext) => ({
      confidence: 0.96,
      reason: "Known arrival date",
      patch: {
        prefilledDate: ctx.date,
      },
    }),
  },
];
