#!/usr/bin/env node

/* ======================================================
   Viator Ingest — Stable Production Version (2026)
   ====================================================== */

import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

/* ================= ROOT ================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

/* ================= ENV ================= */

dotenv.config({
  path: path.join(ROOT, ".env.local"),
});

const API_KEY = process.env.VIATOR_API_KEY;

if (!API_KEY) {
  console.error("❌ VIATOR_API_KEY missing");
  process.exit(1);
}

/* ================= CONFIG ================= */

const BASE = "https://api.viator.com/partner";
const ENDPOINT = "/products/search";

const DATA_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(DATA_DIR, "tours.json");

const PAGE_SIZE = 50;
const DELAY = 1000;

/* ================= DESTINATIONS ================= */

const DESTINATIONS = {
  "las-vegas": 684,
  "new-york": 239,
  "miami": 672,
  "denver": 614,
  "san-francisco": 249,
  "los-angeles": 645,
  "chicago": 606,
  "orlando": 648,
  "seattle": 704,
  "new-orleans": 289,
};

/* ================= HELPERS ================= */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/* ================= NORMALIZE ================= */

function normalize(p) {
  return {
    productCode: p.productCode,
    title: p.title,
    shortDescription: p.shortDescription || "",
    description: p.description || p.shortDescription || "",
    priceFrom: p.price?.fromPrice || null,
    currency: p.price?.currency || "USD",
    duration: p.duration || null,
    durationSeconds: p.durationInSeconds || null,
    image: p.images?.[0]?.source || p.thumbnailHiResURL || "",
    viatorUrl: p.webUrl,
    reviewCount: p.reviews?.total || 0,
    reviewRating: p.reviews?.average || null,
    destinationName: p.primaryDestination?.name || "",
    destinationId: p.primaryDestination?.id || null,
    lastUpdated: new Date().toISOString(),
  };
}

/* ================= FETCH ================= */
async function fetchPage(destId, page = 1) {
  const body = {
    filtering: {
      destination: String(destId),  // Destination as a string, like "684" for Las Vegas
    },
    paging: {  // Viator uses "paging" instead of "pagination"
      page: page,           // 1-based page number
      pageSize: PAGE_SIZE,  // 50 is the typical max per request
    },
    currency: "USD",
    sorting: {
      sortOrder: "DEFAULT",  // Default sorting (Viator’s recommended order)
      // Can also try "PRICE" for price-based sorting if needed
    },
    flags: ["FREE_CANCELLATION"], // Optional: Filter for tours with free cancellation
    topSellers: true,    // Optional: Prioritize top-selling tours
  };

  const res = await fetch(`${BASE}${ENDPOINT}`, {
    method: "POST",
    headers: {
      "Accept": "application/json;version=2.0",
      "Accept-Language": "en-US",
      "Content-Type": "application/json",
      "exp-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status} → ${errorText}`);
  }

  return res.json();
}


/* ================= INGEST ================= */

async function ingestCity(cityKey, destId) {
  console.log(`\n🌎 ${cityKey}`);

  let all = [];
  let page = 1;

  while (true) {
    console.log(`  → page ${page}`);

    const json = await fetchPage(destId, page);

    const batch = json.data || [];

    console.log(`    +${batch.length}`);

    all.push(...batch);

    // Stop when no more pages are available
    if (batch.length < PAGE_SIZE) break;
    if (json.paging?.totalPages && page >= json.paging.totalPages) break;

    page++;

    await sleep(DELAY);
  }

  return all.map(normalize);
}

/* ================= MAIN ================= */

async function main() {
  console.log("🚀 Starting Viator ingest");
  console.log("Key:", API_KEY.slice(0, 6) + "******");

  await ensureDir();

  const output = {};
  let total = 0;

  for (const [city, id] of Object.entries(DESTINATIONS)) {
    try {
      const tours = await ingestCity(city, id);

      if (tours.length) {
        output[city] = tours;
        total += tours.length;

        console.log(`  ✅ ${tours.length} tours`);
      } else {
        console.log("  ⚠️ No tours");
      }
    } catch (err) {
      console.error(`  ❌ ${city}:`, err.message);
    }
  }

  await fs.writeFile(
    OUT_FILE,
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );

  console.log("\n===============================");
  console.log("🏁 Ingest Complete");
  console.log("Cities:", Object.keys(output).length);
  console.log("Tours:", total);
  console.log("Saved:", OUT_FILE);
  console.log("===============================\n");
}

main().catch((err) => {
  console.error("🔥 Fatal:", err);
  process.exit(1);
});
