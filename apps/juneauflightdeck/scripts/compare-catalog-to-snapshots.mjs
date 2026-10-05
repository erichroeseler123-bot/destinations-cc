import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const SNAPSHOTS_DIR = path.join(ROOT, "data", "viator", "products");
const CATALOG_PATH = path.join(ROOT, "lib", "viator", "catalog.ts");

const PRODUCT_CODES = ["10423P1", "10423P2", "25488P1", "3129P1"];

export function extractSupplierCoverImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;

  // 1. Prioritize SUPPLIER_PROVIDED with isCover: true
  let cover = images.find(img => img.imageSource === "SUPPLIER_PROVIDED" && img.isCover === true);

  // 2. Fall back to any image with isCover: true
  if (!cover) {
    cover = images.find(img => img.isCover === true);
  }

  // 3. Fall back to any SUPPLIER_PROVIDED image
  if (!cover) {
    cover = images.find(img => img.imageSource === "SUPPLIER_PROVIDED");
  }

  // 4. Fall back to first image in array
  if (!cover) {
    cover = images[0];
  }

  const variants = cover?.variants || [];
  const variant = variants.find(v => v.width === 720 || v.height === 480) || variants[0];

  return {
    url: variant?.url || null,
    caption: cover?.caption || null,
    imageSource: cover?.imageSource || "SUPPLIER_PROVIDED",
    isCover: cover?.isCover ?? false,
  };
}

async function main() {
  console.log("========================================================================");
  console.log("🔍 COMPARING VIATOR API SNAPSHOTS AGAINST CATALOG.TS (IMAGE SELECTION BY isCover)");
  console.log("========================================================================\n");

  const catalogContent = await fs.readFile(CATALOG_PATH, "utf8");

  for (const code of PRODUCT_CODES) {
    const snapshotPath = path.join(SNAPSHOTS_DIR, `${code}.json`);
    let snapshot;
    try {
      snapshot = JSON.parse(await fs.readFile(snapshotPath, "utf8"));
    } catch {
      console.log(`⚠️ Snapshot file not found for ${code}: ${snapshotPath}`);
      continue;
    }

    const apiTitle = snapshot.title;
    const apiSupplier = snapshot.supplier?.name || "N/A";
    const coverImageInfo = extractSupplierCoverImage(snapshot.images);
    const apiImgUrl = coverImageInfo?.url || "N/A";

    console.log(`📌 Product Code: [${code}]`);
    console.log(`   API Title:        ${apiTitle}`);
    console.log(`   API Supplier:     ${apiSupplier}`);
    console.log(`   Selected Cover:   isCover=${coverImageInfo?.isCover}, source=${coverImageInfo?.imageSource}`);
    console.log(`   API Image URL:    ${apiImgUrl}`);

    // Check occurrences in catalog.ts
    const hasCode = catalogContent.includes(`productCode: "${code}"`) || catalogContent.includes(`id: "${code}"`);
    const hasSupplier = catalogContent.includes(apiSupplier);
    const hasImg = apiImgUrl !== "N/A" && catalogContent.includes(apiImgUrl);

    console.log(`   Catalog Code Match:     ${hasCode ? "✅ MATCH" : "❌ MISMATCH"}`);
    console.log(`   Catalog Supplier Match: ${hasSupplier ? "✅ MATCH" : "⚠️ CHECK"}`);
    console.log(`   Catalog Image Match:    ${hasImg ? "✅ MATCH" : "⚠️ CHECK"}`);
    console.log("");
  }
}

main().catch(console.error);
