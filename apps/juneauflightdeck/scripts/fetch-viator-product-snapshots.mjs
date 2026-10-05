import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.resolve(ROOT, "../..");

// Load env files in order of priority
dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });
dotenv.config({ path: path.join(WORKSPACE_ROOT, ".env.current") });
dotenv.config({ path: path.join(WORKSPACE_ROOT, ".env.local") });

const API_KEY = (process.env.VIATOR_API_KEY || process.env.VIATOR_API)?.trim().replace(/^["']|["']$/g, "");
const API_BASE = process.env.VIATOR_API_BASE || "https://api.viator.com/partner";

const PRODUCT_CODES = ["10423P1", "10423P2", "25488P1", "3129P1"];
const OUTPUT_DIR = path.join(ROOT, "data", "viator", "products");

if (!API_KEY) {
  console.error("❌ Error: VIATOR_API_KEY environment variable is not defined or is empty.");
  console.error("Please configure an active Viator Partner API Key in .env.local or .env.current.");
  process.exit(1);
}

console.log(`🔑 Using API Key: ${API_KEY.slice(0, 4)}...${API_KEY.slice(-4)} (length: ${API_KEY.length})`);
console.log(`🌐 Base URL: ${API_BASE}`);

async function fetchProduct(code) {
  const url = `${API_BASE}/products/${code}`;
  console.log(`\n📡 Fetching ${url} ...`);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "exp-api-key": API_KEY,
      "Accept": "application/json;version=2.0",
      "Accept-Language": "en-US",
    },
  });

  const bodyText = await res.text();
  let json;
  try {
    json = JSON.parse(bodyText);
  } catch (err) {
    console.error(`❌ Failed to parse JSON response for ${code}: ${err.message}`);
    return { code, ok: false, status: res.status, error: bodyText.slice(0, 300) };
  }

  if (!res.ok) {
    console.error(`❌ API returned HTTP ${res.status}:`, json);
    return { code, ok: false, status: res.status, error: json };
  }

  console.log(`✅ Success for ${code} (HTTP ${res.status}):`);
  console.log(`   Title: ${json.title}`);
  console.log(`   Supplier: ${json.supplier?.name || "N/A"}`);
  console.log(`   Image count: ${json.images?.length || 0}`);

  const cover = (json.images || []).find(img => img.imageSource === "SUPPLIER_PROVIDED" && img.isCover === true)
    || (json.images || []).find(img => img.isCover === true)
    || (json.images || []).find(img => img.imageSource === "SUPPLIER_PROVIDED")
    || (json.images || [])[0];

  if (cover?.variants) {
    const v720 = cover.variants.find(v => v.width === 720 || v.height === 480) || cover.variants[0];
    console.log(`   Selected Cover Image: isCover=${cover.isCover}, source=${cover.imageSource}`);
    console.log(`   URL: ${v720?.url}`);
  }

  return { code, ok: true, status: res.status, data: json, selectedCover: cover };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const results = [];
  for (const code of PRODUCT_CODES) {
    const res = await fetchProduct(code);
    results.push(res);

    if (res.ok && res.data) {
      // Save authenticated response without credentials
      const filePath = path.join(OUTPUT_DIR, `${code}.json`);
      await fs.writeFile(filePath, JSON.stringify(res.data, null, 2), "utf8");
      console.log(`   💾 Saved sanitized response to ${filePath}`);
    }
  }

  const allSuccess = results.every(r => r.ok);
  if (!allSuccess) {
    console.error("\n❌ One or more product requests failed.");
    process.exit(1);
  }

  console.log("\n🎉 All 4 product snapshots successfully retrieved and saved!");
}

main().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
