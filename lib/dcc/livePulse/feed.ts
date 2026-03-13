import {
  deriveConfidenceLevel,
  isSignalActive,
  scoreLivePulseSignal,
} from "@/lib/dcc/livePulse/scorer";
import {
  buildSeedSignals,
  readRuntimeSignals,
  sweepExpiredSignals,
} from "@/lib/dcc/livePulse/store";
import type {
  LivePulseFeed,
  LivePulseFeedItem,
  LivePulseQuery,
  LivePulseSignal,
} from "@/lib/dcc/livePulse/types";

const CITY_SCOPE_INDEX: Record<
  string,
  {
    ports: string[];
    venues: string[];
    events: string[];
  }
> = {
  denver: {
    ports: [],
    venues: ["red-rocks-amphitheatre"],
    events: [],
  },
  juneau: {
    ports: ["juneau"],
    venues: [],
    events: [],
  },
};

function matchesVisibility(signal: LivePulseSignal, target: LivePulseQuery["target"]): boolean {
  switch (signal.visibilityScope) {
    case "entity-only":
      return target === "entity";
    case "city-feed":
      return target === "city-feed";
    case "next48-overlay":
      return target === "next48-overlay";
    default:
      return false;
  }
}

function matchesEntity(signal: LivePulseSignal, query: LivePulseQuery): boolean {
  if (query.entityType === "city" && (query.target === "city-feed" || query.target === "next48-overlay")) {
    if (signal.entityType === "city" && signal.entitySlug === query.entitySlug) return true;
    const cityScope = CITY_SCOPE_INDEX[query.entitySlug];
    if (!cityScope) return false;
    if (signal.entityType === "venue" && cityScope.venues.includes(signal.entitySlug)) return true;
    if (signal.entityType === "port" && cityScope.ports.includes(signal.entitySlug)) return true;
    if (signal.entityType === "event" && cityScope.events.includes(signal.entitySlug)) return true;
    return false;
  }
  return signal.entityType === query.entityType && signal.entitySlug === query.entitySlug;
}

export function queryActiveLivePulseSignals(query: LivePulseQuery, now = new Date()): LivePulseSignal[] {
  sweepExpiredSignals(now);
  const runtime = readRuntimeSignals();
  const seeded = buildSeedSignals(now);

  const combined = [...runtime, ...seeded];

  return combined.filter(
    (signal) =>
      matchesEntity(signal, query) &&
      matchesVisibility(signal, query.target) &&
      isSignalActive(signal, now)
  );
}

export function buildLivePulseFeed(query: LivePulseQuery, now = new Date()): LivePulseFeed {
  const activeSignals = queryActiveLivePulseSignals(query, now);

  const groups = new Map<string, LivePulseSignal[]>();
  for (const signal of activeSignals) {
    const key = signal.corroborationKey;
    const bucket = groups.get(key) || [];
    bucket.push(signal);
    groups.set(key, bucket);
  }

  const items: LivePulseFeedItem[] = [];
  for (const groupSignals of groups.values()) {
    const sorted = groupSignals
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const head = sorted[0];
    if (!head) continue;

    const corroborationCount = sorted.length;
    const score = scoreLivePulseSignal(head, corroborationCount, now);
    const confidence = deriveConfidenceLevel(head.trustTier, corroborationCount);

    items.push({
      id: head.id,
      entityType: head.entityType,
      entitySlug: head.entitySlug,
      title: head.title,
      signalType: head.signalType,
      category: head.category,
      location: head.location,
      startTime: head.startTime,
      endTime: head.endTime,
      description: head.description,
      imageUrl: head.imageUrl,
      linkUrl: head.linkUrl,
      visibilityScope: head.visibilityScope,
      actionHint: head.actionHint,
      trustTier: head.trustTier,
      sourceName: head.sourceName,
      score,
      confidence,
      corroborationCount,
      lastUpdated: head.createdAt,
      expiresAt: head.expiresAt,
    });
  }

  items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });

  const limit = query.limit || 8;

  return {
    entityType: query.entityType,
    entitySlug: query.entitySlug,
    generatedAt: now.toISOString(),
    totalSignals: activeSignals.length,
    items: items.slice(0, limit),
    diagnostics: {
      activeSignals: activeSignals.length,
      groupedSignals: items.length,
    },
  };
}
