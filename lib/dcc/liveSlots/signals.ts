import type { LiveSignals, MarketKey } from "./types";

export async function buildSignals(market: MarketKey): Promise<LiveSignals> {
  if (market === "new-orleans-swamp") {
    return {
      headline: "Live swamp tour availability for the next 48 hours",
      urgency: "high",
      notes: ["Family-friendly options included when available."],
    };
  }

  return {
    headline: "Live helicopter tour availability for your selected date",
    urgency: "medium",
    notes: ["Helicopter tours are weather-sensitive and date-specific."],
  };
}
