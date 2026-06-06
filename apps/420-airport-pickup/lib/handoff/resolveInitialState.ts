import type { InitialUiState, ResolvedField, ResolvedStateResult, ResolverRule } from "./types";

export function resolveInitialState<PageModel>(
  context: Parameters<ResolverRule<PageModel>["match"]>[0],
  baseState: InitialUiState,
  rules: ResolverRule<PageModel>[],
  model?: PageModel,
): ResolvedStateResult {
  const winners = new Map<keyof InitialUiState, ResolvedField>();

  for (const rule of rules) {
    if (!rule.match(context, model)) continue;
    const result = rule.resolve(context, model);

    for (const [key, value] of Object.entries(result.patch) as Array<[keyof InitialUiState, unknown]>) {
      if (value === undefined) continue;
      const current = winners.get(key);
      if (!current || result.confidence > current.confidence) {
        winners.set(key, {
          value,
          confidence: result.confidence,
          ruleId: rule.id,
          reason: result.reason,
        });
      }
    }
  }

  const state: InitialUiState = { ...baseState };
  for (const [key, winner] of Array.from(winners.entries())) {
    state[key] = winner.value as never;
  }

  return { state, winners };
}
