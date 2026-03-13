#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MEMORY_ROOT = path.join(ROOT, "data", "memory");
const SNAPSHOT_DIR = path.join(MEMORY_ROOT, "snapshots");

const POINTS = Number(process.env.DCC_MEMORY_SYNTH_POINTS || 14); // 14 samples
const STEP_HOURS = Number(process.env.DCC_MEMORY_SYNTH_STEP_HOURS || 12); // over ~7 days
const FORCE = process.argv.includes("--force");

function hashStr(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function riskLevel(score) {
  if (score >= 4) return "severe";
  if (score >= 3) return "high";
  if (score >= 2) return "moderate";
  return "low";
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function listSnapshotFiles() {
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];
  return fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => path.join(SNAPSHOT_DIR, f));
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
  return out;
}

function hasSynthetic(rows) {
  return rows.some((r) => String(r?.source || "").startsWith("synthetic_history_v1"));
}

function makeSeries(placeId) {
  const h = hashStr(placeId);
  const now = Date.now();
  const out = [];
  const base = 1.6 + (h % 9) / 10; // 1.6 .. 2.4
  const mode = h % 5; // deterministic pattern

  for (let i = POINTS; i >= 1; i -= 1) {
    const ts = new Date(now - i * STEP_HOURS * 60 * 60 * 1000).toISOString();
    let score = base + ((h >> (i % 16)) % 5 - 2) * 0.08;
    let flags = [];
    let transport = "normal";
    let sentiment = "neutral";

    // Modes create meaningful trends.
    if (mode === 0) {
      // Degrading
      score += (POINTS - i) * 0.12;
      if (i <= 3) {
        flags = ["WIND_EXPOSURE", "MARINE_ADVISORY_ACTIVE"];
        transport = "degraded";
        sentiment = "negative";
      }
    } else if (mode === 1) {
      // Abnormal latest spike
      if (i <= 2) {
        score += 1.4;
        flags = ["TRANSPORT_DISRUPTION", "HUMAN_PRESSURE_SPIKE"];
        transport = "disrupted";
        sentiment = "negative";
      }
    } else if (mode === 2) {
      // Improving trend
      score += (i - POINTS) * 0.1;
      if (i <= 3) {
        flags = ["RECOVERY_SIGNAL"];
        sentiment = "positive";
      }
    } else if (mode === 3) {
      // Stable with elevated pressure occasionally
      if (i % 5 === 0) {
        score += 0.5;
        flags = ["HUMAN_PRESSURE_ELEVATED"];
        sentiment = "negative";
      }
    } else {
      // Mostly normal
      if (i % 7 === 0) flags = ["MINOR_WEATHER_VARIANCE"];
    }

    score = Math.max(1, Math.min(4, Number(score.toFixed(2))));

    out.push({
      place_id: placeId,
      timestamp: ts,
      risk_level: riskLevel(score),
      risk_score: score,
      flags,
      motion_allowed: score < 3.2,
      constraints_count: flags.length,
      human_signal: {
        volume_level: flags.length ? "elevated" : "normal",
        sentiment_direction: sentiment,
      },
      transport_status: transport,
      source: "synthetic_history_v1",
    });
  }

  return out;
}

ensureDir(SNAPSHOT_DIR);
const files = listSnapshotFiles();
let writtenFiles = 0;
let skippedFiles = 0;
let rowsAdded = 0;

for (const fullPath of files) {
  const placeId = path.basename(fullPath, ".jsonl");
  const rows = readJsonl(fullPath);

  if (!FORCE && hasSynthetic(rows)) {
    skippedFiles += 1;
    continue;
  }

  const synthetic = makeSeries(placeId);
  fs.appendFileSync(
    fullPath,
    synthetic.map((x) => JSON.stringify(x)).join("\n") + "\n",
    "utf8",
  );
  writtenFiles += 1;
  rowsAdded += synthetic.length;
}

console.log(
  `Synthetic memory history: files_updated=${writtenFiles}, files_skipped=${skippedFiles}, rows_added=${rowsAdded}, force=${FORCE}.`,
);
