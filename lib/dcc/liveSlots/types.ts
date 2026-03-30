export type MarketKey = "new-orleans-swamp" | "juneau-heli";

export type LiveSlot = {
  slotId: string;
  itemId: string;
  startIso: string;
  displayTime: string;
  type: string;
  seatsLeft: number;
  bookHref: string;
  priceLabel?: string;
  flags?: string[];
};

export type LiveSignals = {
  headline?: string;
  weather?: string;
  urgency?: "low" | "medium" | "high";
  notes?: string[];
};

export type LiveSlotsResponse = {
  market: MarketKey;
  generatedAt: string;
  queryContext: {
    date?: string | null;
    windowHours?: number | null;
  };
  signals: LiveSignals;
  slots: LiveSlot[];
};

export type EngagementEvent = {
  site: string;
  market: MarketKey;
  page: string;
  action:
    | "page_view"
    | "date_selected"
    | "slots_loaded"
    | "slot_click"
    | "fallback_click"
    | "no_results";
  slotId?: string;
  itemId?: string;
  selectedDate?: string | null;
  meta?: Record<string, string | number | boolean | null | undefined>;
  occurredAt: string;
};
