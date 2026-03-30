export const WARM_TRANSFER_SOURCES = ["dcc", "wts", "wta"] as const;
export const WARM_TRANSFER_INTENTS = ["compare", "book", "plan", "explore"] as const;
export const WARM_TRANSFER_TOPICS = ["transport", "swamp-tours", "helicopter", "event"] as const;
export const WARM_TRANSFER_BUDGET_BANDS = ["low", "mid", "high"] as const;

export type WarmTransferSource = (typeof WARM_TRANSFER_SOURCES)[number];
export type WarmTransferIntent = (typeof WARM_TRANSFER_INTENTS)[number];
export type WarmTransferTopic = (typeof WARM_TRANSFER_TOPICS)[number];
export type WarmTransferBudgetBand = (typeof WARM_TRANSFER_BUDGET_BANDS)[number];

export type WarmTransfer = {
  source: WarmTransferSource;
  intent: WarmTransferIntent;
  topic: WarmTransferTopic;
  subtype?: string;
  city?: string;
  venue?: string;
  eventId?: string;
  partySize?: number;
  budgetBand?: WarmTransferBudgetBand;
  timeWindow?: string;
  shortlist?: string[];
  recommended?: string;
  sourcePage: string;
};

export function createWarmTransfer(transfer: WarmTransfer): WarmTransfer {
  const next: WarmTransfer = {
    source: transfer.source,
    intent: transfer.intent,
    topic: transfer.topic,
    sourcePage: transfer.sourcePage,
  };

  if (transfer.subtype) next.subtype = transfer.subtype;
  if (transfer.city) next.city = transfer.city;
  if (transfer.venue) next.venue = transfer.venue;
  if (transfer.eventId) next.eventId = transfer.eventId;
  if (typeof transfer.partySize === "number") next.partySize = transfer.partySize;
  if (transfer.budgetBand) next.budgetBand = transfer.budgetBand;
  if (transfer.timeWindow) next.timeWindow = transfer.timeWindow;
  if (transfer.shortlist?.length) next.shortlist = [...transfer.shortlist];
  if (transfer.recommended) next.recommended = transfer.recommended;

  return next;
}

export function refineWarmTransfer(
  transfer: WarmTransfer,
  updates: Partial<Omit<WarmTransfer, "source" | "sourcePage">>,
): WarmTransfer {
  return createWarmTransfer({
    ...transfer,
    ...updates,
    shortlist: updates.shortlist ?? transfer.shortlist,
  });
}

export function toWarmTransferSearchParams(transfer: WarmTransfer) {
  const params = new URLSearchParams({
    source: transfer.source,
    intent: transfer.intent,
    topic: transfer.topic,
    sourcePage: transfer.sourcePage,
  });

  if (transfer.subtype) params.set("subtype", transfer.subtype);
  if (transfer.city) params.set("city", transfer.city);
  if (transfer.venue) params.set("venue", transfer.venue);
  if (transfer.eventId) params.set("eventId", transfer.eventId);
  if (typeof transfer.partySize === "number") params.set("partySize", String(transfer.partySize));
  if (transfer.budgetBand) params.set("budgetBand", transfer.budgetBand);
  if (transfer.timeWindow) params.set("timeWindow", transfer.timeWindow);
  if (transfer.recommended) params.set("recommended", transfer.recommended);
  for (const item of transfer.shortlist ?? []) params.append("shortlist", item);

  return params;
}
