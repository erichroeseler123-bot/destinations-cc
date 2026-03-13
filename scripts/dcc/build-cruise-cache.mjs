import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CRUISES_DIR = path.join(ROOT, "data", "cruises");
const ACTION_DIR = path.join(ROOT, "data", "action");
const OUT = path.join(ACTION_DIR, "cruise.sailings.cache.json");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function normalize(raw, sourceName) {
  if (Array.isArray(raw)) {
    return raw.map((row) => ({ ...row, source: row.source || sourceName }));
  }
  if (raw && typeof raw === "object" && Array.isArray(raw.cruises)) {
    return raw.cruises.map((row) => ({ ...row, source: row.source || sourceName }));
  }
  return [];
}

function main() {
  fs.mkdirSync(ACTION_DIR, { recursive: true });
  if (!fs.existsSync(CRUISES_DIR)) fs.mkdirSync(CRUISES_DIR, { recursive: true });

  const files = fs
    .readdirSync(CRUISES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const sailings = [];
  for (const file of files) {
    const raw = readJson(path.join(CRUISES_DIR, file));
    sailings.push(...normalize(raw, file));
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source: "cruise_catalog_json",
        sailings,
      },
      null,
      2
    ) + "\n"
  );

  console.log(`Built cruise cache: ${OUT}`);
  console.log(`Input files: ${files.length}`);
  console.log(`Sailings: ${sailings.length}`);
}

main();
