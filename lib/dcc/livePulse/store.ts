import fs from "node:fs";
import path from "node:path";
import { LIVE_PULSE_SIGNAL_CATALOG, type LivePulseCreateInput, type LivePulseSignal } from "@/lib/dcc/livePulse/types";
import { defaultEndTime } from "@/lib/dcc/livePulse/scorer";
import { LIVE_PULSE_SEED_ITEMS } from "@/src/data/live-pulse-seed";

type RuntimeStore = {
  version: number;
  posts: LivePulseSignal[];
};

const ROOT = process.cwd();
const STORE_PATH = path.join(ROOT, "data", "live-pulse", "runtime.json");

const MAX_NOTE_LEN = 140;

function ensureStore(): RuntimeStore {
  if (!fs.existsSync(STORE_PATH)) {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    const initial: RuntimeStore = { version: 1, posts: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const parsed = JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as RuntimeStore;
  return {
    version: 1,
    posts: Array.isArray(parsed.posts) ? parsed.posts : [],
  };
}

function saveStore(store: RuntimeStore): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2) + "\n");
}

function toTitle(signalType: LivePulseCreateInput["signalType"], location: string): string {
  const label = LIVE_PULSE_SIGNAL_CATALOG[signalType].label;
  return `${label} at ${location}`;
}

function toDescription(signalType: LivePulseCreateInput["signalType"], note?: string): string {
  const base = LIVE_PULSE_SIGNAL_CATALOG[signalType].defaultActionHint;
  if (!note) return base;
  const trimmed = note.trim().slice(0, MAX_NOTE_LEN);
  return `${trimmed} ${base}`.trim();
}

function toCorroborationKey(input: Pick<LivePulseCreateInput, "entityType" | "entitySlug" | "signalType" | "location">): string {
  return `${input.entityType}:${input.entitySlug}:${input.signalType}:${input.location.toLowerCase().trim()}`;
}

export function buildLivePulseSignal(input: LivePulseCreateInput, now: Date): LivePulseSignal {
  const createdAt = now;
  const endTime = defaultEndTime(createdAt, input.signalType);
  const cappedEnd = new Date(Math.min(endTime.getTime(), createdAt.getTime() + 2 * 60 * 60 * 1000));

  const catalog = LIVE_PULSE_SIGNAL_CATALOG[input.signalType];

  return {
    id: `pulse-${createdAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    entityType: input.entityType,
    entitySlug: input.entitySlug,
    title: toTitle(input.signalType, input.location),
    signalType: input.signalType,
    category: catalog.category,
    location: input.location.trim(),
    startTime: createdAt.toISOString(),
    endTime: cappedEnd.toISOString(),
    description: toDescription(input.signalType, input.note),
    note: input.note?.trim().slice(0, MAX_NOTE_LEN) || undefined,
    imageUrl: input.imageUrl,
    linkUrl: input.linkUrl,
    visibilityScope: input.visibilityScope,
    actionHint: input.actionHint?.trim() || catalog.defaultActionHint,
    trustTier: input.trustTier,
    sourceName: input.sourceName,
    reporterId: input.reporterId,
    corroborationKey: toCorroborationKey(input),
    createdAt: createdAt.toISOString(),
    expiresAt: cappedEnd.toISOString(),
    status: "active",
  };
}

export function readRuntimeSignals(): LivePulseSignal[] {
  return ensureStore().posts;
}

export function writeRuntimeSignals(posts: LivePulseSignal[]): void {
  saveStore({ version: 1, posts });
}

export function insertRuntimeSignal(signal: LivePulseSignal): LivePulseSignal {
  const store = ensureStore();
  store.posts.unshift(signal);
  saveStore(store);
  return signal;
}

export function buildSeedSignals(now: Date): LivePulseSignal[] {
  return LIVE_PULSE_SEED_ITEMS.map((seed) => {
    const start = new Date(now.getTime() + seed.startsInMinutes * 60 * 1000);
    return buildLivePulseSignal(
      {
        entityType: seed.entityType,
        entitySlug: seed.entitySlug,
        signalType: seed.signalType,
        location: seed.location,
        visibilityScope: seed.visibilityScope,
        trustTier: seed.trustTier,
        sourceName: seed.sourceName,
        reporterId: seed.reporterId,
        note: seed.note,
        imageUrl: seed.imageUrl,
        linkUrl: seed.linkUrl,
        actionHint: seed.actionHint,
      },
      start
    );
  });
}

export function sweepExpiredSignals(now: Date): {
  updated: number;
  expired: number;
  active: number;
} {
  const posts = readRuntimeSignals();
  let expired = 0;

  const updated = posts.map((post) => {
    if (post.status !== "active") return post;
    if (new Date(post.expiresAt).getTime() <= now.getTime()) {
      expired += 1;
      return { ...post, status: "expired" as const };
    }
    return post;
  });

  writeRuntimeSignals(updated);

  return {
    updated: updated.length,
    expired,
    active: updated.filter((item) => item.status === "active").length,
  };
}
