import fs from "fs";

const TSV = "data/ports.seed.tsv";
const OUT = "data/ports.seed.json";

function slugify(s){
  return String(s||"")
    .toLowerCase()
    .trim()
    .replace(/&/g,"and")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/(^-|-$)/g,"");
}

const lines = fs.readFileSync(TSV,"utf8")
  .split(/\r?\n/)
  .map(l=>l.trim())
  .filter(l=>l && !l.startsWith("#"));

const items = [];
for (const line of lines) {
  const cols = line.split("\t");
  const name = (cols[0]||"").trim();
  const area = (cols[1]||"Other").trim();
  const country = (cols[2]||"").trim();
  const slug = (cols[3]||"").trim();
  const tagsRaw = (cols[4]||"").trim();

  if (!name) continue;

  items.push({
    name,
    area,
    country,
    slug: slug ? slugify(slug) : slugify(name),
    tags: tagsRaw ? tagsRaw.split(",").map(s=>s.trim()).filter(Boolean) : []
  });
}

// dedupe by slug (last wins)
const map = new Map();
for (const it of items) map.set(it.slug, it);

const out = [...map.values()].sort((a,b)=>{
  const ag = a.area.localeCompare(b.area);
  if (ag !== 0) return ag;
  return a.name.localeCompare(b.name);
});

fs.writeFileSync(OUT, JSON.stringify(out,null,2)+"\n","utf8");
console.log(`✅ wrote ${OUT} (${out.length} ports)`);
