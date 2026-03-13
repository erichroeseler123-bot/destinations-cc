#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SNAPSHOT_DIR = path.join(ROOT, "data", "memory", "snapshots");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    const value = next && !next.startsWith("--") ? next : "true";
    out[key] = value;
    if (value !== "true") i += 1;
  }
  return out;
}

function usage() {
  console.error(
    [
      "Usage:",
      "  node scripts/dcc/import-memory-snapshots.mjs --file <path-to-jsonl> [options]",
      "",
      "Options:",
      "  --source <name>              default: imported_batch",
      "  --dry-run                    validate and report only",
      "",
      "Accepted input fields per JSONL row:",
      "  place_id | placeId | id (required)",
      "  timestamp (optional, defaults to now)",
      "  risk_level | riskLevel",
      "  risk_score | riskScore",
      "  flags (array or comma-separated string)",
      "  motion_allowed | motionAllowed",
      "  constraints_count | constraintsCount",
      "  human_signal { volume_level, sentiment_direction }",
      "  human_volume | humanVolume",
      "  human_sentiment | humanSentiment",
      "  transport_status | transportStatus",
      "  source",
    ].join("\n"),
  );
}

function normalizeRiskLevel(input) {
  const v = String(input || "").toLowerCase();
  if (["low", "moderate", "high", "severe", "unknown"].includes(v)) return v;
  return "unknown";
}

function normalizeTransport(input) {
  const v = String(input || "").toLowerCase();
  if (["normal", "degraded", "disrupted", "unknown"].includes(v)) return v;
  return "unknown";
}

function boolOrDefault(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function normalizeFlags(value) {
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeRow(raw, defaultSource) {
  const placeId = raw.place_id || raw.placeId || raw.id;
  if (!placeId) return null;

  const flags = normalizeFlags(raw.flags);

  const hs = raw.human_signal || {};
  const volume =
    hs.volume_level || raw.human_volume || raw.humanVolume || "unknown";
  const sentiment =
    hs.sentiment_direction || raw.human_sentiment || raw.humanSentiment || "unknown";

  const riskScoreRaw = raw.risk_score ?? raw.riskScore;
  const riskScore =
    riskScoreRaw === undefined || riskScoreRaw === null || riskScoreRaw === ""
      ? null
      : Number(riskScoreRaw);

  return {
    place_id: String(placeId),
    timestamp: raw.timestamp || new Date().toISOString(),
    risk_level: normalizeRiskLevel(raw.risk_level ?? raw.riskLevel),
    risk_score: Number.isFinite(riskScore) ? riskScore : null,
    flags,
    motion_allowed: boolOrDefault(raw.motion_allowed ?? raw.motionAllowed, true),
    constraints_count:
      raw.constraints_count ?? raw.constraintsCount ?? flags.length ?? 0,
    human_signal: {
      volume_level: String(volume || "unknown"),
      sentiment_direction: String(sentiment || "unknown"),
    },
    transport_status: normalizeTransport(raw.transport_status ?? raw.transportStatus),
    source: raw.source || defaultSource,
  };
}

function dedupeKey(s) {
  const flags = (s.flags || []).slice().sort().join(",");
  return [
    s.timestamp || "",
    s.risk_level || "",
    s.risk_score ?? "",
    s.transport_status || "",
    flags,
    s.source || "",
  ].join("|");
}

function readExistingKeys(fullPath) {
  const set = new Set();
  if (!fs.existsSync(fullPath)) return set;
  const lines = fs.readFileSync(fullPath, "utf8").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      set.add(dedupeKey(row));
    } catch {
      // skip bad historical row
    }
  }
  return set;
}

const args = parseArgs(process.argv.slice(2));
if (!args.file) {
  usage();
  process.exit(1);
}

const importPath = path.isAbsolute(args.file)
  ? args.file
  : path.join(ROOT, args.file);

if (!fs.existsSync(importPath)) {
  console.error(`Input file not found: ${importPath}`);
  process.exit(1);
}

const dryRun = args["dry-run"] === "true";
const defaultSource = args.source || "imported_batch";

ensureDir(SNAPSHOT_DIR);

const lines = fs.readFileSync(importPath, "utf8").split("\n");
let total = 0;
let parsed = 0;
let invalid = 0;
let appended = 0;
let deduped = 0;
const perPlace = new Map();
const placeKeys = new Map();

for (const line of lines) {
  if (!line.trim()) continue;
  total += 1;
  let raw;
  try {
    raw = JSON.parse(line);
  } catch {
    invalid += 1;
    continue;
  }

  const snap = normalizeRow(raw, defaultSource);
  if (!snap) {
    invalid += 1;
    continue;
  }
  parsed += 1;

  const fullPath = path.join(SNAPSHOT_DIR, `${snap.place_id}.jsonl`);
  if (!placeKeys.has(snap.place_id)) {
    placeKeys.set(snap.place_id, readExistingKeys(fullPath));
  }
  const keySet = placeKeys.get(snap.place_id);
  const key = dedupeKey(snap);

  if (keySet.has(key)) {
    deduped += 1;
    continue;
  }

  keySet.add(key);
  if (!dryRun) {
    fs.appendFileSync(fullPath, `${JSON.stringify(snap)}\n`, "utf8");
  }
  appended += 1;
  perPlace.set(snap.place_id, (perPlace.get(snap.place_id) || 0) + 1);
}

const placeSummary = Array.from(perPlace.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([place, count]) => `${place}:${count}`)
  .join(", ");

console.log(
  `Memory import ${dryRun ? "(dry-run)" : ""}: total=${total}, parsed=${parsed}, invalid=${invalid}, appended=${appended}, deduped=${deduped}, places=${perPlace.size}.`,
);
if (placeSummary) {
  console.log(`Top places: ${placeSummary}`);
}
