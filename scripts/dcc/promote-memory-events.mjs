#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MEMORY_ROOT = path.join(ROOT, "data", "memory");
const POLICY_PATH = path.join(MEMORY_ROOT, "policy.json");
const SNAPSHOT_DIR = path.join(MEMORY_ROOT, "snapshots");
const DELTA_DIR = path.join(MEMORY_ROOT, "deltas");
const EVENT_DIR = path.join(MEMORY_ROOT, "events");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function safeJson(fullPath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function readJsonl(fullPath) {
  if (!fs.existsSync(fullPath)) return [];
  const lines = fs.readFileSync(fullPath, "utf8").split("\n");
  const out = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // skip
    }
  }
  return out;
}

function appendJsonl(fullPath, item) {
  fs.appendFileSync(fullPath, `${JSON.stringify(item)}\n`, "utf8");
}

function getSeverity(delta) {
  if (delta.classification === "improving") return "low";
  const z = Math.abs(Number(delta.z_score ?? 0));
  if (z >= 2) return "severe";
  if (z >= 1.2) return "high";
  return "moderate";
}

function getConfidence(delta) {
  const n = Number(delta.sample_count || 0);
  const z = Math.abs(Number(delta.z_score ?? 0));
  if (n >= 20 && z >= 1.25) return "high";
  if (n >= 8) return "medium";
  return "low";
}

function eventTypeFor(delta) {
  if (delta.classification === "degrading") return "risk_degradation";
  if (delta.classification === "abnormal") return "risk_abnormal";
  if (delta.classification === "improving") return "risk_improvement";
  return null;
}

function titleFor(type, severity, placeId) {
  const short = placeId.replace(/^dcc:[^:]+:/, "");
  if (type === "risk_degradation") return `Risk degrading in ${short}`;
  if (type === "risk_abnormal") return `Abnormal risk shift in ${short}`;
  if (type === "risk_improvement") return `Conditions improving in ${short}`;
  return `Operational event in ${short}`;
}

function dedupeKey(placeId, type, severity, flags) {
  const sig = (flags || []).slice(0, 3).sort().join(",");
  return `${placeId}|${type}|${severity}|${sig}`;
}

function isWithinMinutes(tsA, tsB, minutes) {
  const a = Date.parse(tsA || "");
  const b = Date.parse(tsB || "");
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) <= minutes * 60 * 1000;
}

function hourBucket(iso) {
  const d = new Date(Date.parse(iso || ""));
  if (Number.isNaN(d.getTime())) return "unknown";
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

ensureDir(EVENT_DIR);

const policy = safeJson(POLICY_PATH, {
  promote: {
    emit_improving: false,
    zscore_threshold: 0.75,
    min_samples: 3,
    dedupe_window_minutes: {
      risk_degradation: 120,
      risk_abnormal: 120,
      risk_improvement: 360,
      transport_disruption: 90,
      human_pressure: 90,
    },
    max_events_per_place_per_hour: 4,
  },
});

const deltaIndex = safeJson(path.join(DELTA_DIR, "index.json"), []);
let promoted = 0;
let deduped = 0;
let skipped = 0;

const placeHourlyCounter = new Map();
const outputIndex = [];

for (const row of deltaIndex) {
  const placeId = row.place_id;
  const delta = safeJson(path.join(DELTA_DIR, `${placeId}.json`), null);
  if (!delta) {
    skipped += 1;
    continue;
  }

  const type = eventTypeFor(delta);
  if (!type) {
    skipped += 1;
    continue;
  }
  if (type === "risk_improvement" && !policy.promote.emit_improving) {
    skipped += 1;
    continue;
  }
  if (Number(delta.sample_count || 0) < Number(policy.promote.min_samples || 3)) {
    skipped += 1;
    continue;
  }
  if (Math.abs(Number(delta.z_score ?? 0)) < Number(policy.promote.zscore_threshold || 0.75)) {
    skipped += 1;
    continue;
  }

  const snapshots = readJsonl(path.join(SNAPSHOT_DIR, `${placeId}.jsonl`));
  const latest = snapshots.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)).slice(-1)[0] || null;
  const flags = Array.isArray(latest?.flags) ? latest.flags : [];
  const severity = getSeverity(delta);
  const confidence = getConfidence(delta);
  const timestamp = delta.at || latest?.timestamp || new Date().toISOString();
  const dk = dedupeKey(placeId, type, severity, flags);

  const placeEventPath = path.join(EVENT_DIR, `${placeId}.jsonl`);
  const priorEvents = readJsonl(placeEventPath);

  const windowMin =
    Number(policy.promote?.dedupe_window_minutes?.[type]) || 120;
  const dup = priorEvents.find((e) => e.dedupe_key === dk && isWithinMinutes(e.timestamp, timestamp, windowMin));
  if (dup) {
    deduped += 1;
    continue;
  }

  const hb = `${placeId}|${hourBucket(timestamp)}`;
  const count = placeHourlyCounter.get(hb) || 0;
  if (count >= Number(policy.promote.max_events_per_place_per_hour || 4)) {
    skipped += 1;
    continue;
  }
  placeHourlyCounter.set(hb, count + 1);

  const event = {
    place_id: placeId,
    timestamp,
    event_type: type,
    severity,
    title: titleFor(type, severity, placeId),
    signals: flags,
    confidence,
    source: ["memory_delta"],
    dedupe_key: dk,
    state_ref: {
      delta_at: delta.at || null,
      snapshot_at: latest?.timestamp || null,
    },
    meta: {
      classification: delta.classification,
      z_score: delta.z_score ?? null,
      sample_count: delta.sample_count ?? 0,
      reasons: delta.reasons || [],
    },
  };

  appendJsonl(placeEventPath, event);
  promoted += 1;
  outputIndex.push({
    place_id: placeId,
    timestamp,
    event_type: type,
    severity,
    confidence,
  });
}

outputIndex.sort((a, b) => {
  if (a.place_id !== b.place_id) return a.place_id.localeCompare(b.place_id);
  return Date.parse(b.timestamp) - Date.parse(a.timestamp);
});
fs.writeFileSync(path.join(EVENT_DIR, "index.json"), `${JSON.stringify(outputIndex, null, 2)}\n`, "utf8");

console.log(
  `Memory events promoted: ${promoted}, deduped: ${deduped}, skipped: ${skipped}.`,
);
