import fs from "fs";
import path from "path";
import type {
  PlaceBaseline,
  PlaceDelta,
  PlaceEvent,
  PlaceSnapshot,
  PlanetaryTimelineEntry,
} from "./schema";

const ROOT = process.cwd();
const MEMORY_ROOT = path.join(ROOT, "data", "memory");
const SNAPSHOT_DIR = path.join(MEMORY_ROOT, "snapshots");
const BASELINE_DIR = path.join(MEMORY_ROOT, "baselines");
const DELTA_DIR = path.join(MEMORY_ROOT, "deltas");
const EVENT_DIR = path.join(MEMORY_ROOT, "events");
const PLANETARY_DIR = path.join(MEMORY_ROOT, "planetary");

function safeReadJson<T>(fullPath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8")) as T;
  } catch {
    return null;
  }
}

function readJsonl<T>(fullPath: string): T[] {
  if (!fs.existsSync(fullPath)) return [];
  const lines = fs.readFileSync(fullPath, "utf8").split("\n");
  const out: T[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as T);
    } catch {
      // skip bad line
    }
  }
  return out;
}

export function getSnapshots(placeId: string, limit = 100): PlaceSnapshot[] {
  const fullPath = path.join(SNAPSHOT_DIR, `${placeId}.jsonl`);
  const rows = readJsonl<PlaceSnapshot>(fullPath)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return rows.slice(0, limit);
}

export function getLatestSnapshot(placeId: string): PlaceSnapshot | null {
  return getSnapshots(placeId, 1)[0] || null;
}

export function getBaseline(placeId: string): PlaceBaseline | null {
  return safeReadJson<PlaceBaseline>(path.join(BASELINE_DIR, `${placeId}.json`));
}

export function getDelta(placeId: string): PlaceDelta | null {
  return safeReadJson<PlaceDelta>(path.join(DELTA_DIR, `${placeId}.json`));
}

export function listBaselinePlaceIds(): string[] {
  const full = path.join(BASELINE_DIR, "index.json");
  const rows = safeReadJson<Array<{ place_id: string }>>(full) || [];
  return rows.map((x) => x.place_id);
}

export function listDeltaPlaceIds(): string[] {
  const full = path.join(DELTA_DIR, "index.json");
  const rows = safeReadJson<Array<{ place_id: string }>>(full) || [];
  return rows.map((x) => x.place_id);
}

export function getPlaceEvents(placeId: string, limit = 50): PlaceEvent[] {
  const fullPath = path.join(EVENT_DIR, `${placeId}.jsonl`);
  const rows = readJsonl<PlaceEvent>(fullPath)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return rows.slice(0, limit);
}

export function getLatestPlaceEvent(placeId: string): PlaceEvent | null {
  return getPlaceEvents(placeId, 1)[0] || null;
}

export function getPlanetaryEvents(limit = 500): PlanetaryTimelineEntry[] {
  const fullPath = path.join(PLANETARY_DIR, "events.jsonl");
  const rows = readJsonl<PlanetaryTimelineEntry>(fullPath)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return rows.slice(0, limit);
}

export function getEventIndex(): Array<{
  place_id: string;
  timestamp: string;
  event_type: string;
  severity: string;
  confidence: string;
}> {
  const full = path.join(EVENT_DIR, "index.json");
  return safeReadJson(full) || [];
}

export function getPlanetarySummary(): {
  generated_at: string;
  count: number;
  window_days: number;
  unique_places: number;
  by_place_counts: Record<string, number>;
} | null {
  const full = path.join(PLANETARY_DIR, "index.json");
  return safeReadJson(full);
}
