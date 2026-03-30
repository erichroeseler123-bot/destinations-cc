import fs from "node:fs";
import path from "node:path";
import { REDIRECT_INTENT_REGISTRY, type RedirectIntentRecord } from "@/src/data/routing/redirect-intent-registry";


type Finding = {
  severity: "error" | "warn" | "info";
  code: string;
  message: string;
};

const ROOT = process.cwd();
const DCC_APP_DIR = path.join(ROOT, "app");
const WTS_APP_DIR = path.join(ROOT, "apps", "welcometotheswamp", "app");
const ALIASES_PATH = path.join(ROOT, "data", "city-aliases.json");

function push(out: Finding[], severity: Finding["severity"], code: string, message: string) {
  out.push({ severity, code, message });
}

function loadCityAliases(): Set<string> {
  const raw = fs.readFileSync(ALIASES_PATH, "utf8");
  const parsed = JSON.parse(raw) as Record<string, string>;
  return new Set(Object.keys(parsed));
}

function routeExistsViaDynamicFolders(baseDir: string, parts: string[]): boolean {
  function walk(base: string, idx: number): boolean {
    if (idx === parts.length) {
      return fs.existsSync(path.join(base, "page.tsx")) || fs.existsSync(path.join(base, "route.ts"));
    }
    const segment = parts[idx];
    const exactDir = path.join(base, segment);
    if (fs.existsSync(exactDir) && walk(exactDir, idx + 1)) return true;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(base, { withFileTypes: true });
    } catch {
      return false;
    }

    const dynamicDirs = entries
      .filter((entry) => entry.isDirectory() && /^\[.+\]$/.test(entry.name))
      .map((entry) => path.join(base, entry.name));

    for (const dir of dynamicDirs) {
      if (walk(dir, idx + 1)) return true;
    }
    return false;
  }

  return walk(baseDir, 0);
}

function routeExistsInDcc(href: string, cityAliases: Set<string>): boolean {
  const pure = href.split("?")[0].split("#")[0];
  if (!pure || pure === "/") return fs.existsSync(path.join(DCC_APP_DIR, "page.tsx"));

  const rel = pure.replace(/^\/+/, "").replace(/\/+$/, "");
  const parts = rel.split("/").filter(Boolean);
  if (parts.length === 0) return false;

  if (fs.existsSync(path.join(DCC_APP_DIR, rel, "page.tsx"))) return true;
  if (fs.existsSync(path.join(DCC_APP_DIR, rel, "route.ts"))) return true;

  if (parts.length >= 1 && cityAliases.has(parts[0])) {
    if (parts.length === 1 && fs.existsSync(path.join(DCC_APP_DIR, "[city]", "page.tsx"))) return true;
    const tail = parts.slice(1);
    if (tail.length >= 1) {
      if (fs.existsSync(path.join(DCC_APP_DIR, "[city]", ...tail, "page.tsx"))) return true;
      if (fs.existsSync(path.join(DCC_APP_DIR, "[city]", ...tail, "route.ts"))) return true;
    }
  }

  return routeExistsViaDynamicFolders(DCC_APP_DIR, parts);
}

function routeExistsInWts(href: string): boolean {
  const pure = href.split("?")[0].split("#")[0];
  if (!pure || pure === "/") return fs.existsSync(path.join(WTS_APP_DIR, "page.tsx"));
  const rel = pure.replace(/^\/+/, "").replace(/\/+$/, "");
  const parts = rel.split("/").filter(Boolean);
  if (parts.length === 0) return false;
  if (fs.existsSync(path.join(WTS_APP_DIR, rel, "page.tsx"))) return true;
  if (fs.existsSync(path.join(WTS_APP_DIR, rel, "route.ts"))) return true;
  return routeExistsViaDynamicFolders(WTS_APP_DIR, parts);
}

function validateRecord(record: RedirectIntentRecord, findings: Finding[], cityAliases: Set<string>, seenSources: Set<string>) {
  if (!record.sourcePath.startsWith("/")) {
    push(findings, "error", "routing.source_path_invalid", `sourcePath must start with / (${record.sourcePath}).`);
  }

  if (seenSources.has(record.sourcePath)) {
    push(findings, "error", "routing.duplicate_source", `Duplicate sourcePath ${record.sourcePath}.`);
  }
  seenSources.add(record.sourcePath);

  if (!record.destinationPath.startsWith("/")) {
    push(findings, "error", "routing.destination_path_invalid", `destinationPath must start with / (${record.destinationPath}).`);
  }

  if (record.destinationType === "dcc" && !routeExistsInDcc(record.destinationPath, cityAliases)) {
    push(findings, "error", "routing.destination_missing_dcc", `${record.sourcePath} targets missing DCC destination ${record.destinationPath}.`);
  }

  if (record.destinationType === "wts" && !routeExistsInWts(record.destinationPath)) {
    push(findings, "error", "routing.destination_missing_wts", `${record.sourcePath} targets missing WTS destination ${record.destinationPath}.`);
  }

  if (record.intentMatchScore <= 2) {
    push(findings, "warn", "routing.low_match_score", `${record.sourcePath} has low intent match score ${record.intentMatchScore} -> ${record.destinationPath}.`);
  }

  if (record.needsIntentUpgrade && record.intentMatchScore >= 4) {
    push(findings, "warn", "routing.intent_upgrade_conflict", `${record.sourcePath} is marked needsIntentUpgrade despite high match score ${record.intentMatchScore}.`);
  }

  if (record.nextStepExists === "no") {
    push(findings, "warn", "routing.no_next_step", `${record.sourcePath} lands on ${record.destinationPath} without a confirmed next-step path.`);
  }

  if (record.nextStepExists === "partial") {
    push(findings, "info", "routing.partial_next_step", `${record.sourcePath} lands on ${record.destinationPath} with only partial next-step coverage.`);
  }
}

function main() {
  const findings: Finding[] = [];
  const cityAliases = loadCityAliases();
  const seenSources = new Set<string>();

  for (const record of REDIRECT_INTENT_REGISTRY) {
    validateRecord(record, findings, cityAliases, seenSources);
  }

  const errors = findings.filter((item) => item.severity === "error");
  const warnings = findings.filter((item) => item.severity === "warn");
  const infos = findings.filter((item) => item.severity === "info");

  const summary = {
    ok: errors.length === 0,
    records: REDIRECT_INTENT_REGISTRY.length,
    errorsCount: errors.length,
    warningsCount: warnings.length,
    infosCount: infos.length,
    errors,
    warnings,
    infos,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (errors.length > 0) process.exit(1);
}

main();
