#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MEMORY_ROOT = path.join(ROOT, "data", "memory");
const SNAPSHOT_DIR = path.join(MEMORY_ROOT, "snapshots");
const BASELINE_DIR = path.join(MEMORY_ROOT, "baselines");
const DELTA_DIR = path.join(MEMORY_ROOT, "deltas");

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

function readJson(fullPath) {
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return null;
  }
}

function readJsonl(fullPath) {
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
  return out.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

function riskScore(s) {
  if (typeof s?.risk_score === "number") return s.risk_score;
  const map = { low: 1, moderate: 2, high: 3, severe: 4, unknown: 2 };
  return map[String(s?.risk_level || "unknown")] ?? 2;
}

function trendFromSnapshots(placeId, snaps) {
  if (!snaps.length) {
    return { place_id: placeId, window: "7d", direction: "insufficient_data", slope: null, sample_count: 0 };
  }
  const recent = snaps.slice(-7);
  if (recent.length < 3) {
    return { place_id: placeId, window: "7d", direction: "insufficient_data", slope: null, sample_count: recent.length };
  }
  const y = recent.map((s) => riskScore(s));
  const x = recent.map((_, i) => i + 1);
  const xAvg = x.reduce((a, b) => a + b, 0) / x.length;
  const yAvg = y.reduce((a, b) => a + b, 0) / y.length;
  const num = x.reduce((acc, xi, i) => acc + (xi - xAvg) * (y[i] - yAvg), 0);
  const den = x.reduce((acc, xi) => acc + (xi - xAvg) ** 2, 0) || 1;
  const slope = num / den;
  let direction = "stable";
  if (slope >= 0.2) direction = "degrading";
  else if (slope <= -0.2) direction = "improving";
  return { place_id: placeId, window: "7d", direction, slope, sample_count: recent.length };
}

ensureDir(DELTA_DIR);
const files = walkJsonl(SNAPSHOT_DIR);
const index = [];

for (const fullPath of files) {
  const placeId = path.basename(fullPath, ".jsonl");
  const snaps = readJsonl(fullPath);
  if (!snaps.length) continue;

  const latest = snaps[snaps.length - 1];
  const baseline = readJson(path.join(BASELINE_DIR, `${placeId}.json`));
  const nowScore = riskScore(latest);
  const trend = trendFromSnapshots(placeId, snaps);
  const reasons = [];

  let classification = "insufficient_data";
  let zScore = null;
  let baseScore = null;
  let sampleCount = 0;
  let windowDays = Number(process.env.DCC_MEMORY_WINDOW_DAYS || 30);

  if (baseline && baseline.sample_count >= 3) {
    sampleCount = baseline.sample_count;
    windowDays = baseline.window_days || windowDays;
    baseScore = baseline.metrics?.risk_score_mean ?? null;
    const sd = baseline.metrics?.risk_score_stddev ?? null;

    if (baseScore !== null && sd !== null && sd > 0) zScore = (nowScore - baseScore) / sd;

    const threshold = sd && sd > 0 ? Math.max(0.75, sd) : 1;
    if (baseScore !== null && nowScore >= baseScore + threshold) {
      classification = trend.direction === "improving" ? "abnormal" : "degrading";
      reasons.push("risk_above_baseline");
    } else if (baseScore !== null && nowScore <= baseScore - threshold) {
      classification = "improving";
      reasons.push("risk_below_baseline");
    } else {
      classification = trend.direction === "degrading" ? "degrading" : "normal";
      reasons.push("within_expected_range");
    }
  } else {
    classification = "insufficient_data";
    reasons.push("insufficient_baseline_samples");
  }

  const delta = {
    place_id: placeId,
    at: latest.timestamp || new Date().toISOString(),
    classification,
    baseline_window_days: windowDays,
    sample_count: sampleCount,
    risk_score_now: nowScore,
    risk_score_baseline: baseScore,
    z_score: zScore,
    reasons,
    trend,
  };

  fs.writeFileSync(path.join(DELTA_DIR, `${placeId}.json`), `${JSON.stringify(delta, null, 2)}\n`, "utf8");
  index.push({
    place_id: placeId,
    at: delta.at,
    classification: delta.classification,
    sample_count: delta.sample_count,
    risk_score_now: delta.risk_score_now,
    risk_score_baseline: delta.risk_score_baseline,
  });
}

index.sort((a, b) => a.place_id.localeCompare(b.place_id));
fs.writeFileSync(path.join(DELTA_DIR, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`Built ${index.length} memory delta classification(s).`);
