import type { InitialUiState, ResolvedStateResult } from "./types";

export function applyConfidenceGate(
  resolved: ResolvedStateResult,
  baseState: InitialUiState,
  threshold = 0.6,
) {
  const confidentFields = new Map(
    Array.from(resolved.winners.entries()).filter(([, winner]) => winner.confidence >= threshold),
  );

  if (confidentFields.size === 0) {
    return {
      state: baseState,
      winners: confidentFields,
      downgraded: true,
    };
  }

  const state: InitialUiState = { ...baseState };
  for (const [key, winner] of Array.from(confidentFields.entries())) {
    state[key] = winner.value as never;
  }

  return {
    state,
    winners: confidentFields,
    downgraded: confidentFields.size !== resolved.winners.size,
  };
}

export function validateAirport420State(state: InitialUiState): InitialUiState {
  const next = { ...state };

  if (next.defaultCardSlug === "airport-red-rocks" && next.primaryCtaLabel === "Check pickup options") {
    next.primaryCtaLabel = "Check Red Rocks pickup options";
  }

  if (next.defaultCardSlug === "airport-dispensary" && next.primaryCtaLabel === "Check pickup options") {
    next.primaryCtaLabel = "Check dispensary-stop options";
  }

  if (next.defaultCardSlug === "airport-mountain" && next.primaryCtaLabel === "Check pickup options") {
    next.primaryCtaLabel = "Check mountain transfer options";
  }

  if (next.fitSignal === "event-transfer" && next.defaultCardSlug !== "airport-red-rocks") {
    next.defaultCardSlug = "airport-red-rocks";
  }

  if (next.fitSignal === "420-arrival" && next.defaultCardSlug !== "airport-dispensary") {
    next.defaultCardSlug = "airport-dispensary";
  }

  return next;
}
