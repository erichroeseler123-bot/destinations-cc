/**
 * Vegas Tour Ingestion Script
 * DCC Pipeline v1
 *
 * Usage:
 *   node scripts/ingest-vegas.js
 */

import fs from "fs";
import path from "path";

const OUTPUT = "data/vegas.tours.json";

/* ----------------------------------
   Source Data (Seed / Placeholder)
   Later: Replace with Viator API
---------------------------------- */

const RAW_TOURS = [
  {
    id: "gc-west-rim",
    name: "Grand Canyon West Rim Day Trip",
    provider: "Viator",
    duration: "12 hours",
    price_from: 129,
    rating: 4.7,
    reviews: 18432,
    tags: ["grand-canyon", "hoover-dam", "bus-tour"],
    booking_url:
      "https://www.viator.com/tours/Las-Vegas/Grand-Canyon-West-Rim-Day-Trip/d684-12345",
  },

  {
    id: "strip-helicopter",
    name: "Las Vegas Strip Helicopter Night Flight",
    provider: "Viator",
    duration: "15 minutes",
    price_from: 99,
    rating: 4.9,
    reviews: 11209,
    tags: ["helicopter", "strip", "night"],
    booking_url:
      "https://www.viator.com/tours/Las-Vegas/Las-Vegas-Strip-Helicopter-Flight/d684-54321",
  },

  {
    id: "antelope-canyon",
    name: "Antelope Canyon & Horseshoe Bend Tour",
    provider: "Viator",
    duration: "14 hours",
    price_from: 149,
    rating: 4.8,
    reviews: 9821,
    tags: ["antelope-canyon", "horseshoe-bend", "photography"],
    booking_url:
      "https://www.viator.com/tours/Las-Vegas/Antelope-Canyon-Tour/d684-99999",
  },
];

/* ----------------------------------
   Normalizer
---------------------------------- */

function normalize(tour) {
  return {
    id: tour.id,
    name: tour.name,
    provider: tour.provider,
    duration: tour.duration,
    price_from: Number(tour.price_from),
    rating: Number(tour.rating),
    reviews: Number(tour.reviews),
    tags: tour.tags || [],
    booking_url: tour.booking_url,

    dcc: {
      node: "las-vegas",
      category: "tours",
      ingested_at: new Date().toISOString(),
      version: "1.0",
    },
  };
}

/* ----------------------------------
   Pipeline
---------------------------------- */

function run() {
  console.log("🔄 Ingesting Vegas tours...");

  const normalized = RAW_TOURS.map(normalize);

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(normalized, null, 2),
    "utf8"
  );

  console.log(`✅ Wrote ${normalized.length} tours → ${OUTPUT}`);
}

run();
