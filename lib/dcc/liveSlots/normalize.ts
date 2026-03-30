import { formatPriceLabel } from "./fareharbor";
import { MARKET_RULES } from "./marketRules";
import type { LiveSlot, MarketKey } from "./types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function shouldIncludeItem(market: MarketKey, rawTitle: string) {
  const title = String(rawTitle || "").trim();
  if (!title) return false;

  const rule = MARKET_RULES[market];
  const included = rule.includeTitlePatterns.some((pattern) => pattern.test(title));
  const excluded = rule.excludeTitlePatterns.some((pattern) => pattern.test(title));
  return included && !excluded;
}

export function normalizeSlot(args: {
  market: MarketKey;
  shortname: string;
  itemId: string | number;
  itemTitle: string;
  availabilityId: string | number;
  startIso: string;
  capacity?: number;
  bookedCount?: number;
  lowestRateCents?: number;
}): LiveSlot | null {
  if (!args.startIso) return null;

  const rule = MARKET_RULES[args.market];
  const type = rule.normalizeType(args.itemTitle);
  if (!type) return null;

  const seatsLeft = Math.max(0, (args.capacity || 0) - (args.bookedCount || 0));
  if (seatsLeft <= 0) return null;

  return {
    slotId: String(args.availabilityId),
    itemId: String(args.itemId),
    startIso: args.startIso,
    displayTime: formatTime(args.startIso),
    type,
    seatsLeft,
    bookHref: `https://fareharbor.com/embeds/book/${args.shortname}?availability=${args.availabilityId}`,
    priceLabel: formatPriceLabel(args.lowestRateCents),
  };
}
