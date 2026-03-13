#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MEMORY_ROOT = path.join(ROOT, "data", "memory");
const POLICY_PATH = path.join(MEMORY_ROOT, "policy.json");
const EVENT_DIR = path.join(MEMORY_ROOT, "events");
const PLANETARY_DIR = path.join(MEMORY_ROOT, "planetary");

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

function walkEventFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkEventFiles(full, out);
    else if (e.isFile() && full.endsWith(".jsonl")) out.push(full);
  }
  return out;
}

function hourBucket(iso) {
  const d = new Date(Date.parse(iso || ""));
  if (Number.isNaN(d.getTime())) return "unknown";
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

function sevScore(sev) {
  if (sev === "severe") return 4;
  if (sev === "high") return 3;
  if (sev === "moderate") return 2;
  return 1;
}

function confScore(c) {
  if (c === "high") return 3;
  if (c === "medium") return 2;
  return 1;
}

const policy = safeJson(POLICY_PATH, {
  planetary: {
    window_days: 30,
    max_events_per_hour_per_type: 200,
  },
});

ensureDir(PLANETARY_DIR);

const files = walkEventFiles(EVENT_DIR).filter((f) => !f.endsWith("index.jsonl"));
const now = Date.now();
const maxAgeMs = Number(policy.planetary?.window_days || 30) * 24 * 60 * 60 * 1000;
const maxPerBucket = Number(policy.planetary?.max_events_per_hour_per_type || 200);

const all = [];
for (const fullPath of files) {
  for (const ev of readJsonl(fullPath)) {
    const ts = Date.parse(ev.timestamp || "");
    if (Number.isNaN(ts)) continue;
    if (ts < now - maxAgeMs) continue;
    all.push(ev);
  }
}

const grouped = new Map();
for (const ev of all) {
  const key = `${hourBucket(ev.timestamp)}|${ev.event_type}`;
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key).push(ev);
}

const selected = [];
for (const events of grouped.values()) {
  events.sort((a, b) => {
    const ds = sevScore(b.severity) - sevScore(a.severity);
    if (ds !== 0) return ds;
    const dc = confScore(b.confidence) - confScore(a.confidence);
    if (dc !== 0) return dc;
    return Date.parse(b.timestamp) - Date.parse(a.timestamp);
  });
  selected.push(...events.slice(0, maxPerBucket));
}

selected.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

const timeline = selected.map((ev, idx) => ({
  id: `planetary:${idx + 1}`,
  ...ev,
}));

const byPlace = {};
for (const ev of timeline) {
  if (!byPlace[ev.place_id]) byPlace[ev.place_id] = 0;
  byPlace[ev.place_id] += 1;
}

fs.writeFileSync(
  path.join(PLANETARY_DIR, "events.jsonl"),
  timeline.map((x) => JSON.stringify(x)).join("\n") + (timeline.length ? "\n" : ""),
  "utf8",
);
fs.writeFileSync(
  path.join(PLANETARY_DIR, "index.json"),
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      count: timeline.length,
      window_days: policy.planetary?.window_days || 30,
      unique_places: Object.keys(byPlace).length,
      by_place_counts: byPlace,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `Built planetary timeline: ${timeline.length} event(s), ${Object.keys(byPlace).length} place(s).`,
);
