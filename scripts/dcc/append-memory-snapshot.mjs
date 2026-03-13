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
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "true";
    out[key] = value;
    if (value !== "true") i += 1;
  }
  return out;
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

function usage() {
  console.error(
    [
      "Usage:",
      "  node scripts/dcc/append-memory-snapshot.mjs --place <dcc_id> [options]",
      "",
      "Options:",
      "  --timestamp <iso>",
      "  --risk-level <low|moderate|high|severe|unknown>",
      "  --risk-score <number>",
      "  --flags <comma,separated,flags>",
      "  --motion-allowed <true|false>",
      "  --constraints-count <number>",
      "  --human-volume <low|normal|elevated|high|unknown>",
      "  --human-sentiment <positive|neutral|negative|unknown>",
      "  --transport <normal|degraded|disrupted|unknown>",
      "  --source <string>",
      "",
      "Example:",
      "  node scripts/dcc/append-memory-snapshot.mjs --place dcc:place:us-ak-juneau:0001 --risk-level high --risk-score 3.4 --flags WIND_EXPOSURE,MARINE_ADVISORY_ACTIVE --transport degraded --human-sentiment negative --source router_v1",
    ].join("\n"),
  );
}

const args = parseArgs(process.argv.slice(2));
const placeId = args.place;

if (!placeId) {
  usage();
  process.exit(1);
}

ensureDir(SNAPSHOT_DIR);

const flags = String(args.flags || "")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

const snapshot = {
  place_id: String(placeId),
  timestamp: args.timestamp || new Date().toISOString(),
  risk_level: normalizeRiskLevel(args["risk-level"]),
  risk_score:
    args["risk-score"] !== undefined ? Number(args["risk-score"]) : null,
  flags,
  motion_allowed:
    args["motion-allowed"] === undefined
      ? true
      : String(args["motion-allowed"]).toLowerCase() === "true",
  constraints_count:
    args["constraints-count"] !== undefined
      ? Number(args["constraints-count"])
      : flags.length,
  human_signal: {
    volume_level: args["human-volume"] || "unknown",
    sentiment_direction: args["human-sentiment"] || "unknown",
  },
  transport_status: normalizeTransport(args.transport),
  source: args.source || "manual_append",
};

const fullPath = path.join(SNAPSHOT_DIR, `${placeId}.jsonl`);
fs.appendFileSync(fullPath, `${JSON.stringify(snapshot)}\n`, "utf8");

console.log(`Appended memory snapshot for ${placeId}.`);
