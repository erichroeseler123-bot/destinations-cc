import fs from "fs";

const INP = "data/ports.seed.json";
const OUT = "data/ports.generated.json";

function readJson(p){ return JSON.parse(fs.readFileSync(p,"utf8")); }
function writeJson(p, obj){ fs.writeFileSync(p, JSON.stringify(obj,null,2)+"\n","utf8"); }

const seed = readJson(INP);
if (!Array.isArray(seed)) throw new Error(`${INP} must be an array`);

const map = new Map();
for (const p of seed) {
  if (!p?.slug || !p?.name) continue;
  map.set(p.slug, {
    slug: String(p.slug),
    name: String(p.name),
    area: String(p.area || "Other"),
    country: String(p.country || ""),
    tags: Array.isArray(p.tags) ? p.tags : [],
    passenger_volume: typeof p.passenger_volume === "number" ? p.passenger_volume : undefined,
  });
}

const out = [...map.values()].sort((a,b)=>{
  const ag = a.area.localeCompare(b.area);
  if (ag !== 0) return ag;
  return a.name.localeCompare(b.name);
});

writeJson(OUT, out);
console.log(`✅ wrote ${OUT} (${out.length} ports)`);
