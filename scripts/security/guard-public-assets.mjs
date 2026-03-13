import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");

const FORBIDDEN_BASENAME = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".gitignore",
  "vercel.json",
];

const FORBIDDEN_SEGMENTS = new Set([".vercel"]);
const FORBIDDEN_EXTENSIONS = [".local"];
const FORBIDDEN_HTML_EXPORTS = [
  "index.html",
  "about.html",
  "booking.html",
  "contact.html",
  "faq.html",
  "pricing.html",
  "schedule.html",
  "sitemap.html",
];

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    out.push(full);
  }
  return out;
}

function isForbidden(rel) {
  const normalized = rel.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const base = parts[parts.length - 1];
  const lowerBase = base.toLowerCase();

  if (parts.some((p) => FORBIDDEN_SEGMENTS.has(p.toLowerCase()))) {
    return "contains forbidden directory segment (.vercel)";
  }

  if (FORBIDDEN_BASENAME.includes(lowerBase)) {
    return `forbidden filename (${base})`;
  }

  if (FORBIDDEN_EXTENSIONS.some((ext) => lowerBase.endsWith(ext))) {
    return `forbidden extension (${path.extname(base) || base})`;
  }

  if (FORBIDDEN_HTML_EXPORTS.includes(lowerBase)) {
    return `legacy exported html file (${base})`;
  }

  return null;
}

if (!fs.existsSync(PUBLIC_DIR)) {
  console.log("Public asset guard passed (no public directory).");
  process.exit(0);
}

const files = walk(PUBLIC_DIR);
const violations = [];

for (const full of files) {
  const rel = path.relative(ROOT, full);
  const reason = isForbidden(rel);
  if (reason) violations.push({ file: rel, reason });
}

if (violations.length === 0) {
  console.log("Public asset guard passed.");
  process.exit(0);
}

console.error(`Public asset guard failed: ${violations.length} violation(s).`);
for (const v of violations) {
  console.error(`- ${v.file} (${v.reason})`);
}
process.exit(1);
