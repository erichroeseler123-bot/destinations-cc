import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "out",
  ".vercel",
]);

const ALLOWLIST_FILES = new Set([
  ".env.example",
]);

const PATTERNS = [
  { label: "OpenAI key", re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { label: "GitHub PAT", re: /\bghp_[A-Za-z0-9]{20,}\b/g },
  { label: "GitHub fine-grained PAT", re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { label: "Google API key", re: /\bAIza[0-9A-Za-z_-]{20,}\b/g },
  { label: "Mapbox public token", re: /\bpk\.[A-Za-z0-9._-]{30,}\b/g },
  { label: "Mapbox secret token", re: /\bsk\.[A-Za-z0-9._-]{30,}\b/g },
  { label: "Twilio SID", re: /\bAC[a-fA-F0-9]{32}\b/g },
  { label: "Generic high-entropy assignment", re: /\b(?:api[_-]?key|token|secret|password)\b\s*[:=]\s*["'][A-Za-z0-9_\-]{20,}["']/gi },
];

const TEXT_EXT = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md", ".txt", ".env", ".yml", ".yaml", ".sh",
]);

function listTrackedFiles() {
  try {
    const output = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
    return output
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((rel) => ({ rel, full: path.join(ROOT, rel) }));
  } catch {
    return [];
  }
}

function scanFile(full, rel) {
  let text = "";
  try {
    text = fs.readFileSync(full, "utf8");
  } catch {
    return [];
  }
  const findings = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const p of PATTERNS) {
      const m = line.match(p.re);
      if (m && m.length > 0) {
        findings.push({
          file: rel,
          line: i + 1,
          label: p.label,
        });
      }
    }
  }
  return findings;
}

const files = listTrackedFiles().filter((f) => {
  if (ALLOWLIST_FILES.has(f.rel)) return false;
  const parts = f.rel.split("/");
  if (parts.some((p) => IGNORE_DIRS.has(p))) return false;
  const ext = path.extname(f.rel).toLowerCase();
  const base = path.basename(f.rel);
  return TEXT_EXT.has(ext) || base.startsWith(".env");
});
const findings = files.flatMap((f) => scanFile(f.full, f.rel));

if (findings.length === 0) {
  console.log("Secrets scan passed.");
  process.exit(0);
}

console.error(`Secrets scan failed: ${findings.length} potential leak(s) found.`);
for (const finding of findings.slice(0, 50)) {
  console.error(`- ${finding.file}:${finding.line} [${finding.label}]`);
}
if (findings.length > 50) {
  console.error(`... and ${findings.length - 50} more`);
}
process.exit(1);
