import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.resolve(ROOT, "../..");

dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(WORKSPACE_ROOT, ".env.local") });

const API_KEY = process.env.VIATOR_API_KEY?.trim().replace(/^["']|["']$/g, "");

if (!API_KEY) {
  console.error("❌ VIATOR_API_KEY is not set in .env.local.");
  process.exit(1);
}

console.log("========================================================================");
console.log("🚀 SYNCING VIATOR CREDENTIALS, FETCHING SNAPSHOTS & UPDATING CATALOG");
console.log("========================================================================\n");

// 1. Sync key to Vercel Production and Preview
console.log("1️⃣ Syncing VIATOR_API_KEY to Vercel Production & Preview environments...");
try {
  execSync(`cmd /c npx vercel env add VIATOR_API_KEY production --value "${API_KEY}" --yes --force`, {
    cwd: ROOT,
    stdio: "inherit",
  });
  execSync(`cmd /c npx vercel env add VIATOR_API_KEY preview --value "${API_KEY}" --yes --force`, {
    cwd: ROOT,
    stdio: "inherit",
  });
  console.log("✅ Successfully synced VIATOR_API_KEY to Vercel.\n");
} catch (err) {
  console.warn("⚠️ Note on Vercel env sync:", err.message);
}

// 2. Fetch authenticated product snapshots
console.log("2️⃣ Fetching product snapshots from Viator Partner API...");
try {
  execSync(`node "${path.join(__dirname, "fetch-viator-product-snapshots.mjs")}"`, {
    cwd: WORKSPACE_ROOT,
    stdio: "inherit",
  });
} catch (err) {
  console.error("❌ Failed to fetch product snapshots:", err.message);
  process.exit(1);
}

// 3. Update catalog.ts with cover images (using imageSource === 'SUPPLIER_PROVIDED' and isCover === true)
console.log("\n3️⃣ Updating catalog.ts with verified supplier images and details...");
try {
  execSync(`node "${path.join(__dirname, "update-catalog-from-snapshots.mjs")}"`, {
    cwd: ROOT,
    stdio: "inherit",
  });
} catch (err) {
  console.error("❌ Failed to update catalog:", err.message);
  process.exit(1);
}

// 4. Run verification comparison
console.log("\n4️⃣ Verifying catalog against API snapshots...");
try {
  execSync(`node "${path.join(__dirname, "compare-catalog-to-snapshots.mjs")}"`, {
    cwd: ROOT,
    stdio: "inherit",
  });
} catch (err) {
  console.error("❌ Comparison script encountered an issue:", err.message);
}

console.log("\n🎉 Ready for build, deployment, and live verification!");
