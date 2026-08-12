import { listPlaceGraphSummaries, type PlaceDiscoveryCard } from "@/lib/dcc/graph/placeActionGraph";

export type TeleportActionFilter = "tours" | "cruises" | "transport" | "events";

export type TeleportQueryInput = {
  filters?: {
    hasActions?: TeleportActionFilter[];
    trend?: "improving" | "normal" | "degrading";
    provider?: string;
  };
  sort?: Array<"actionability" | "liveActivity" | "trend">;
  limit?: number;
};

export type TeleportResult = PlaceDiscoveryCard & {
  score: number;
  whySelected: string[];
};

function countActions(card: PlaceDiscoveryCard) {
  return Object.values(card.action_counts).reduce((sum, value) => sum + Number(value || 0), 0);
}

function scoreCard(card: PlaceDiscoveryCard, sort: NonNullable<TeleportQueryInput["sort"]>) {
  const actionability = countActions(card);
  const liveActivity = Number(card.action_counts.events || 0) + Number(card.latest_event ? 1 : 0);
  const trend = card.trend === "improving" ? 2 : card.trend === "degrading" ? 1 : 0;
  const values = { actionability, liveActivity, trend };
  return sort.reduce((score, key, index) => score + values[key] * (sort.length - index) * 100, 0);
}

export function teleportQuery(input: TeleportQueryInput = {}): TeleportResult[] {
  const filters = input.filters || {};
  const sort = input.sort?.length ? input.sort : ["actionability", "liveActivity", "trend"];
  const limit = Math.max(1, Math.min(input.limit || 12, 100));

  return listPlaceGraphSummaries(1000)
    .filter((card) => {
      if (filters.trend && card.trend !== filters.trend) return false;
      if (filters.provider) {
        const needle = filters.provider.toLowerCase();
        if (!card.top_providers.some((provider) => provider.toLowerCase().includes(needle))) return false;
      }
      if (filters.hasActions?.length) {
        for (const action of filters.hasActions) {
          if (Number(card.action_counts[action] || 0) <= 0) return false;
        }
      }
      return true;
    })
    .map((card) => {
      const whySelected: string[] = [];
      const totalActions = countActions(card);
      if (totalActions > 0) whySelected.push(`${totalActions} actionable graph signal${totalActions === 1 ? "" : "s"}`);
      if (card.latest_event) whySelected.push(`latest event: ${card.latest_event}`);
      if (card.trend && card.trend !== "normal") whySelected.push(`${card.trend} trend`);
      if (card.top_providers.length) whySelected.push(`${card.top_providers.length} provider source${card.top_providers.length === 1 ? "" : "s"}`);
      return { ...card, score: scoreCard(card, sort), whySelected };
    })
    .sort((a, b) => b.score - a.score || a.place_id.localeCompare(b.place_id))
    .slice(0, limit);
}
