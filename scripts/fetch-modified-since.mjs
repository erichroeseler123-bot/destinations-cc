#!/usr/bin/env node

import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs/promises";
import fetch from "node-fetch";
import { fileURLToPath } from "node:url";

// Resolve project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// Load .env.local explicitly
dotenv.config({ path: path.join(ROOT, ".env.local") });

// Access API Key
const API_KEY = process.env.VIATOR_API_KEY;

if (!API_KEY) {
  console.error("❌ VIATOR_API_KEY missing");
  process.exit(1);
}

// Constants
const BASE_URL = "https://api.viator.com/partner/v2/products/modified-since";
const OUT_FILE = path.join(ROOT, "data/raw/product-codes.json");
const SINCE_TIMESTAMP = "2025-01-01T00:00:00Z"; // Adjust as needed, ISO-8601 format

// Helper functions
async function fetchModifiedSince() {
  const params = new URLSearchParams({
    count: "500",
    since: SINCE_TIMESTAMP,
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: {
      "Accept": "application/json; version=2.0",
      "exp-api-key": API_KEY,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} → ${text}`);
  }

  return response.json();
}

// Main
async function main() {
  console.log("Fetching modified products since", SINCE_TIMESTAMP);

  try {
    const json = await fetchModifiedSince();

    if (json.data) {
      const productCodes = json.data.map((p) => p.productCode);
      await fs.writeFile(OUT_FILE, JSON.stringify(productCodes, null, 2));
      console.log(`Saved ${productCodes.length} product codes to ${OUT_FILE}`);
    } else {
      console.error("❌ No data returned from Viator");
    }
  } catch (err) {
    console.error("🔥 Error:", err);
    process.exit(1);
  }
}

main();
