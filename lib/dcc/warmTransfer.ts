import {
  SWAMP_WARM_TRANSFER_NODE,
  WARM_TRANSFER_CONTEXTS,
  WARM_TRANSFER_INTENTS,
  WARM_TRANSFER_SOURCE_PAGES,
  WARM_TRANSFER_SOURCES,
  WARM_TRANSFER_SUBTYPES,
  WARM_TRANSFER_TOPICS,
  type WarmTransferContext,
  type WarmTransferIntent,
  type WarmTransferPacket,
  type WarmTransferSource,
  type WarmTransferSourcePage,
  type WarmTransferSubtype,
  type WarmTransferTopic,
} from "@/src/data/routing/nodes/warmTransfers";
import {
  createWarmTransfer as createCanonicalWarmTransfer,
  type WarmTransfer as CanonicalWarmTransfer,
} from "@/lib/warm-transfer";

export {
  WARM_TRANSFER_CONTEXTS,
  WARM_TRANSFER_INTENTS,
  WARM_TRANSFER_SOURCE_PAGES,
  WARM_TRANSFER_SOURCES,
  WARM_TRANSFER_SUBTYPES,
  WARM_TRANSFER_TOPICS,
  type WarmTransferContext,
  type WarmTransferIntent,
  type WarmTransferPacket,
  type WarmTransferSource,
  type WarmTransferSourcePage,
  type WarmTransferSubtype,
  type WarmTransferTopic,
};

function isAllowedValue<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}

export function isWarmTransferSourcePage(value: string): value is WarmTransferSourcePage {
  return isAllowedValue(value, WARM_TRANSFER_SOURCE_PAGES);
}

export function createWarmTransferPacket(packet: WarmTransferPacket): WarmTransferPacket {
  const next: WarmTransferPacket = {
    intent: packet.intent,
    topic: packet.topic,
    source: packet.source || "dcc",
  };

  if (packet.subtype) next.subtype = packet.subtype;
  if (packet.context) next.context = packet.context;
  if (packet.sourcePage) {
    if (!isWarmTransferSourcePage(packet.sourcePage)) {
      throw new Error(`Invalid warm-transfer sourcePage: ${packet.sourcePage}`);
    }
    next.sourcePage = packet.sourcePage;
  }

  return next;
}

export function buildSwampPlanHref(packet: WarmTransferPacket) {
  const normalized = createWarmTransferPacket(packet);
  const params = new URLSearchParams({
    intent: normalized.intent,
    topic: normalized.topic,
    source: normalized.source || "dcc",
  });

  if (normalized.subtype) params.set("subtype", normalized.subtype);
  if (normalized.context) params.set("context", normalized.context);
  if (normalized.sourcePage) params.set("sourcePage", normalized.sourcePage);

  return `${SWAMP_WARM_TRANSFER_NODE.destinationPath}?${params.toString()}`;
}

function mapRoutingIntentToCanonicalIntent(intent: WarmTransferIntent): CanonicalWarmTransfer["intent"] {
  switch (intent) {
    case "understand":
      return "explore";
    case "act":
      return "book";
    default:
      return intent;
  }
}

export function createCanonicalDccWarmTransfer(
  packet: WarmTransferPacket & { sourcePage: string },
): CanonicalWarmTransfer {
  return createCanonicalWarmTransfer({
    source: packet.source || "dcc",
    intent: mapRoutingIntentToCanonicalIntent(packet.intent),
    topic: packet.topic === "swamp-tours" ? "swamp-tours" : "event",
    subtype: packet.subtype,
    sourcePage: packet.sourcePage,
  });
}
