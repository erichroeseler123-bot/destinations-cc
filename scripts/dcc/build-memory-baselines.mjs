#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MEMORY_ROOT = path.join(ROOT, "data", "memory");
const SNAPSHOT_DIR = path.join(MEMORY_ROOT, "snapshots");
const BASELINE_DIR = path.join(MEMORY_ROOT, "baselines");

const WINDOW_DAYS = Number(process.env.DCC_MEMORY_WINDOW_DAYS || 30);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function walkJsonl(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkJsonl(full, out);
    else if (e.isFile() && full.endsWith(".jsonl")) out.push(full);
  }
  return out;
}

function riskScore(s) {
  if (typeof s?.risk_score === "number") return s.risk_score;
  const map = { low: 1, moderate: 2, high: 3, severe: 4, unknown: 2 };
  return map[String(s?.risk_level || "unknown")] ?? 2;
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values, avg) {
  if (!values.length || avg === null) return null;
  const v = values.reduce((acc, x) => acc + (x - avg) ** 2, 0) / values.length;
  return Math.sqrt(v);
}

function readSnapshots(fullPath) {
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

function withinWindow(iso, nowMs, days) {
  const t = Date.parse(iso || "");
  if (Number.isNaN(t)) return false;
  return t >= nowMs - days * 24 * 60 * 60 * 1000 && t <= nowMs;
}

ensureDir(SNAPSHOT_DIR);
ensureDir(BASELINE_DIR);

const files = walkJsonl(SNAPSHOT_DIR);
const now = Date.now();
const index = [];

for (const fullPath of files) {
  const placeId = path.basename(fullPath, ".jsonl");
  const snapshots = readSnapshots(fullPath).filter((s) => withinWindow(s.timestamp, now, WINDOW_DAYS));
  if (!snapshots.length) continue;

  const scores = snapshots.map(riskScore);
  const avg = mean(scores);
  const sd = stddev(scores, avg);
  const p90 = percentile(scores, 0.9);

  const degradedCount = snapshots.filter((s) => {
    const t = String(s.transport_status || "unknown");
    return t === "degraded" || t === "disrupted";
  }).length;

  const negativeCount = snapshots.filter((s) => String(s?.human_signal?.sentiment_direction || "unknown") === "negative").length;

  const latestAt = snapshots
    .map((s) => s.timestamp)
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || null;

  const baseline = {
    place_id: placeId,
    window_days: WINDOW_DAYS,
    sample_count: snapshots.length,
    computed_at: new Date().toISOString(),
    metrics: {
      risk_score_mean: avg,
      risk_score_stddev: sd,
      risk_score_p90: p90,
      degraded_transport_rate: snapshots.length ? degradedCount / snapshots.length : null,
      negative_human_signal_rate: snapshots.length ? negativeCount / snapshots.length : null,
    },
    latest_snapshot_at: latestAt,
  };

  fs.writeFileSync(
    path.join(BASELINE_DIR, `${placeId}.json`),
    `${JSON.stringify(baseline, null, 2)}\n`,
    "utf8",
  );
  index.push({
    place_id: placeId,
    sample_count: baseline.sample_count,
    computed_at: baseline.computed_at,
    latest_snapshot_at: baseline.latest_snapshot_at,
  });
}

index.sort((a, b) => a.place_id.localeCompare(b.place_id));
fs.writeFileSync(path.join(BASELINE_DIR, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");

console.log(`Built ${index.length} memory baseline(s) from ${files.length} snapshot file(s).`);
