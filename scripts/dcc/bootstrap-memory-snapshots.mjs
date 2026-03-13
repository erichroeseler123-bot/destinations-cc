#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const REGISTRY_ROOT = path.join(ROOT, "data", "registry");
const SNAPSHOT_DIR = path.join(ROOT, "data", "memory", "snapshots");
const FORCE = process.argv.includes("--force");

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

function loadNodes() {
  const files = walkJsonl(REGISTRY_ROOT);
  const out = [];
  for (const fullPath of files) {
    const lines = fs.readFileSync(fullPath, "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const node = JSON.parse(line);
        out.push(node);
      } catch {
        // skip bad line
      }
    }
  }
  return out;
}

function hasSnapshots(fullPath) {
  if (!fs.existsSync(fullPath)) return false;
  return fs.readFileSync(fullPath, "utf8").trim().length > 0;
}

ensureDir(SNAPSHOT_DIR);

const nodes = loadNodes().filter((n) => typeof n?.id === "string");
const now = new Date().toISOString();
let written = 0;
let skipped = 0;

for (const node of nodes) {
  const fullPath = path.join(SNAPSHOT_DIR, `${node.id}.jsonl`);
  if (!FORCE && hasSnapshots(fullPath)) {
    skipped += 1;
    continue;
  }

  const snapshot = {
    place_id: node.id,
    timestamp: now,
    class: node.class,
    risk_level: "unknown",
    risk_score: 2,
    flags: [],
    motion_allowed: true,
    constraints_count: 0,
    human_signal: {
      volume_level: "unknown",
      sentiment_direction: "unknown",
    },
    transport_status: "unknown",
    source: "bootstrap_registry",
  };

  fs.writeFileSync(fullPath, `${JSON.stringify(snapshot)}\n`, "utf8");
  written += 1;
}

console.log(`Bootstrapped memory snapshots: written=${written}, skipped=${skipped}, force=${FORCE}.`);
