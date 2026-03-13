import fs from "fs";
import path from "path";

const SEED_JSON = path.join(process.cwd(), "data", "ports.seed.json");
const OUT_JSON  = path.join(process.cwd(), "data", "ports.generated.json");

function slugify(s){
  return String(s||"")
    .toLowerCase()
    .trim()
    .replace(/&/g,"and")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/(^-|-$)/g,"");
}

function readJson(p){ return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeJson(p, obj){ fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8"); }

const seed = readJson(SEED_JSON);
if (!Array.isArray(seed)) {
  throw new Error("data/ports.seed.json must be an array");
}

// Normalize + dedupe by slug
const map = new Map();
for (const raw of seed) {
  if (!raw) continue;
  const name = (raw.name || raw.title || "").trim();
  if (!name) continue;

  const area = (raw.area || raw.region || "Other").trim();
  const country = (raw.country || "").trim();
  const tags = Array.isArray(raw.tags) ? raw.tags : (raw.tags ? String(raw.tags).split(",").map(s=>s.trim()) : []);

  const slug = slugify(raw.slug || name);

  map.set(slug, {
    slug,
    name,
    area,
    country,
    tags: tags.filter(Boolean),
  });
}

const out = [...map.values()].sort((a,b)=>{
  const ag = (a.area||"").localeCompare(b.area||"");
  if (ag !== 0) return ag;
  return (a.name||"").localeCompare(b.name||"");
});

writeJson(OUT_JSON, out);
console.log(`✅ wrote ${OUT_JSON} (${out.length} ports)`);
