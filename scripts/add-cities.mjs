#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = process.cwd();

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function usage() {
  die(
    `Usage:
  npm run add-cities -- <csv-file>

Example:
  npm run add-cities -- data/us-top-cities.csv
`
  );
}

const args = process.argv.slice(2);

if (args.length < 1) usage();

const csvPath = path.resolve(ROOT, args[0]);

if (!fs.existsSync(csvPath)) {
  die(`CSV file not found: ${csvPath}`);
}

const raw = fs.readFileSync(csvPath, "utf8").trim();

if (!raw) die("CSV file is empty");

const lines = raw.split("\n").filter(Boolean);

console.log(`\n📄 Loading ${lines.length} rows from ${csvPath}\n`);

let success = 0;
let skipped = 0;
let failed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (!line) continue;

  const parts = line.split(",").map((s) => s.trim());

  if (parts.length < 2) {
    console.warn(`⚠️  Skipping malformed line ${i + 1}: ${line}`);
    skipped++;
    continue;
  }

  const [city, region] = parts;

  console.log(`➡️  Adding: ${city}, ${region}`);

  const result = spawnSync(
    "npm",
    ["run", "add-city", "--", city, region],
    {
      stdio: "pipe",
      encoding: "utf8",
    }
  );

  if (result.status === 0) {
    console.log("   ✅ Success\n");
    success++;
  } else {
    if (result.stderr.includes("already exists")) {
      console.log("   ⚠️  Already exists (skipped)\n");
      skipped++;
    } else {
      console.error("   ❌ Failed");
      console.error(result.stderr);
      failed++;
    }
  }
}

console.log("=================================");
console.log("🏁 Batch Import Complete");
console.log("=================================");
console.log(`✅ Added:   ${success}`);
console.log(`⚠️ Skipped: ${skipped}`);
console.log(`❌ Failed:  ${failed}`);
console.log("");

if (failed > 0) {
  process.exit(1);
}
