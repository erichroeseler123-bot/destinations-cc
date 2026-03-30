import type { SwampLane } from "@/lib/swampProducts";

export const WARM_TRANSFER_INTENTS = ["explore", "understand", "compare", "act"] as const;
export const WARM_TRANSFER_TOPICS = ["swamp-tours"] as const;
export const WARM_TRANSFER_SUBTYPES = [
  "airboat",
  "bayou",
  "boat",
  "comfort",
  "speed",
  "families",
  "half-day",
  "pickup",
  "airboat-vs-boat",
  "best-time",
  "with-kids",
  "worth-it",
  "transportation",
  "types",
] as const;
export const WARM_TRANSFER_CONTEXTS = ["first-time", "kids", "no-car", "short-trip", "mixed-group"] as const;
export const WARM_TRANSFER_SOURCES = ["dcc", "wts"] as const;
export const WARM_TRANSFER_SOURCE_PAGES = [
  "/new-orleans/tours",
  "/new-orleans/swamp-tours",
  "/new-orleans/swamp-tours/airboat-vs-boat",
  "/new-orleans/swamp-tours/best-time",
  "/new-orleans/swamp-tours/wildlife",
  "/new-orleans/swamp-tours/with-kids",
  "/new-orleans/swamp-tours/worth-it",
  "/new-orleans/swamp-tours/transportation",
  "/new-orleans/swamp-tours/types",
] as const;

export type WarmTransferIntent = (typeof WARM_TRANSFER_INTENTS)[number];
export type WarmTransferTopic = (typeof WARM_TRANSFER_TOPICS)[number];
export type WarmTransferSubtype = (typeof WARM_TRANSFER_SUBTYPES)[number];
export type WarmTransferContext = (typeof WARM_TRANSFER_CONTEXTS)[number];
export type WarmTransferSource = (typeof WARM_TRANSFER_SOURCES)[number];
export type WarmTransferSourcePage = (typeof WARM_TRANSFER_SOURCE_PAGES)[number];

export type WarmTransferPacket = {
  intent: WarmTransferIntent;
  topic: WarmTransferTopic;
  subtype: WarmTransferSubtype | null;
  context: WarmTransferContext | null;
  source: WarmTransferSource;
  sourcePage: WarmTransferSourcePage | null;
};

function takeFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asAllowed<T extends readonly string[]>(value: string | undefined, allowed: T): T[number] | null {
  if (!value) return null;
  return (allowed as readonly string[]).includes(value) ? (value as T[number]) : null;
}

export function isWarmTransferSourcePage(value: string): value is WarmTransferSourcePage {
  return WARM_TRANSFER_SOURCE_PAGES.includes(value as WarmTransferSourcePage);
}

export function parseWarmTransfer(searchParams: Record<string, string | string[] | undefined> | undefined): WarmTransferPacket {
  const intent = asAllowed(takeFirst(searchParams?.intent), WARM_TRANSFER_INTENTS) || "compare";
  const topic = asAllowed(takeFirst(searchParams?.topic), WARM_TRANSFER_TOPICS) || "swamp-tours";
  const subtype = asAllowed(takeFirst(searchParams?.subtype), WARM_TRANSFER_SUBTYPES);
  const context = asAllowed(takeFirst(searchParams?.context), WARM_TRANSFER_CONTEXTS);
  const source = asAllowed(takeFirst(searchParams?.source), WARM_TRANSFER_SOURCES) || "dcc";
  const sourcePage = asAllowed(takeFirst(searchParams?.sourcePage), WARM_TRANSFER_SOURCE_PAGES);

  return { intent, topic, subtype, context, source, sourcePage };
}

export function inferLaneFromTransfer(packet: WarmTransferPacket): SwampLane | null {
  if (packet.subtype === "airboat" || packet.subtype === "speed") return "speed";
  if (packet.subtype === "boat" || packet.subtype === "bayou" || packet.subtype === "comfort") return "comfort";
  if (packet.subtype === "families" || packet.subtype === "with-kids") return "families";
  if (packet.subtype === "pickup" || packet.subtype === "transportation") return "pickup";
  if (packet.subtype === "best-time" || packet.subtype === "worth-it" || packet.subtype === "types") return "comfort";
  if (packet.subtype === "airboat-vs-boat") return "comfort";
  if (packet.context === "kids") return "families";
  if (packet.context === "no-car") return "pickup";
  if (packet.context === "first-time" || packet.context === "mixed-group") return "comfort";
  return null;
}

export function getTransferHeadline(packet: WarmTransferPacket, lane: SwampLane | null) {
  if (packet.subtype === "airboat-vs-boat") {
    return {
      title: "You are deciding between speed and scenery before you compare real tour options.",
      intro: "This page keeps that choice warm by starting from the speed-versus-comfort question instead of dropping you into a generic swamp-tour list.",
    };
  }
  if (packet.subtype === "airboat") {
    return {
      title: "You are comparing airboat tours against calmer boat options.",
      intro: "This page starts from the assumption that the real question is speed versus comfort, not whether a swamp tour exists at all.",
    };
  }
  if (packet.subtype === "types") {
    return {
      title: "You are reducing swamp-tour overload into one usable decision lane.",
      intro: "This page turns a broad market into a simpler shortlist instead of making you compare every operator at once.",
    };
  }
  if (packet.subtype === "bayou" || packet.subtype === "boat") {
    return {
      title: "You are narrowing the calmer, scenery-first side of the swamp-tour market.",
      intro: "This page turns broad tour-type interest into a simpler lane decision before you compare current options.",
    };
  }
  if (packet.subtype === "families" || packet.subtype === "with-kids" || packet.context === "kids") {
    return {
      title: "You need a swamp tour that works for a family, not just the loudest listing.",
      intro: "This page narrows toward mixed-age fit, manageable duration, and lower-friction logistics before you review the shortlist.",
    };
  }
  if (packet.subtype === "pickup" || packet.subtype === "transportation" || packet.context === "no-car") {
    return {
      title: "You need a swamp tour that still works cleanly from New Orleans without a car.",
      intro: "Transport reality changes the best choice more than small differences in tour branding, so this page biases toward pickup-sensitive decisions first.",
    };
  }
  if (packet.subtype === "best-time") {
    return {
      title: "You are using timing to narrow the safest-fit swamp-tour options.",
      intro: "This page treats timing as a fit question, then surfaces the calmer default shortlist first instead of restarting broad research.",
    };
  }
  if (packet.subtype === "worth-it") {
    return {
      title: "You are pressure-testing whether the right swamp tour is worth part of the trip.",
      intro: "This page turns that skeptical question into a best-fit shortlist instead of leaving you stuck in yes-or-no debate.",
    };
  }
  if (lane === "comfort") {
    return {
      title: "You are in the safest default decision lane for first-timers.",
      intro: "This page starts with calmer, easier-fit options because most DCC visitors are still reducing risk before they book anything.",
    };
  }
  return {
    title: "Use this page to turn broad swamp-tour interest into a simpler decision.",
    intro: "The base page is indexable and useful on its own, but it gets better when DCC hands off what you were already comparing.",
  };
}
