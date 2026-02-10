#!/usr/bin/env node
/* Viator Destinations Fetch — Hierarchy Ready (2026) */

import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env.local") });

const API_KEY = process.env.VIATOR_API_KEY;
if (!API_KEY) {
  console.error("❌ VIATOR_API_KEY missing");
  process.exit(1);
}

const BASE = "https://api.viator.com/partner";
const DATA_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(DATA_DIR, "destinations.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function fetchDestinations() {
  console.log("🚀 Fetching Viator destinations...");
  const res = await fetch(`${BASE}/destinations`, {
    method: "GET",
    headers: {
      "exp-api-key": API_KEY,
      "Accept": "application/json;version=2.0",
      "Accept-Language": "en-US",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status} → ${errorText}`);
  }

  const data = await res.json();
  const destinations = data.destinations || [];

  if (!Array.isArray(destinations)) {
    console.error("Unexpected response format — no 'destinations' array");
    process.exit(1);
  }

  console.log(`Received ${destinations.length} destinations`);

  // Optional: Filter & log Denver/Las Vegas for quick validation
  const denver = destinations.find(d => d.name?.toLowerCase().includes("denver") || d.destinationId === 614);
  const vegas  = destinations.find(d => d.name?.toLowerCase().includes("las vegas") || d.destinationId === 684);

  console.log("\nDenver match:", denver ? JSON.stringify(denver, null, 2) : "Not found");
  console.log("Las Vegas match:", vegas ? JSON.stringify(vegas, null, 2) : "Not found");

  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2) + "\n");
  console.log(`Saved full response to ${OUT_FILE}`);
}

async function main() {
  await ensureDir();
  await fetchDestinations().catch(err => console.error("Error:", err.message));
}

main();
