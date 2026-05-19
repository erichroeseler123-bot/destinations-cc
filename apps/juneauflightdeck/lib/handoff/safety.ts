import type { InitialUiState, ResolvedStateResult } from "./types";

export function applyConfidenceGate(
  resolved: ResolvedStateResult,
  baseState: InitialUiState,
  threshold = 0.6,
) {
  const winners = new Map(
    Array.from(resolved.winners.entries()).filter(([, winner]) => winner.confidence >= threshold),
  );

  if (winners.size === 0) {
    return {
      state: baseState,
      winners,
      downgraded: true,
    };
  }

  const state: InitialUiState = { ...baseState };
  for (const [key, winner] of Array.from(winners.entries())) {
    state[key] = winner.value as never;
  }

  return {
    state,
    winners,
    downgraded: winners.size !== resolved.winners.size,
  };
}

export function validateJfdState(state: InitialUiState): InitialUiState {
  const next = { ...state };

  if (!next.defaultCardSlug) next.defaultCardSlug = "glacier-landing";
  if (!next.prioritizedCardSlugs?.length) {
    next.prioritizedCardSlugs = ["glacier-landing", "icefield-explorer", "dogsled-combo"];
  }
  if (!next.sortMode) next.sortMode = "fit";

  return next;
}
