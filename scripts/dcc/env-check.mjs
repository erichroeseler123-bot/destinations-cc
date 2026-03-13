import fs from "fs";
import path from "path";
import {
  CANONICAL_ENV_VARS,
  LEGACY_ENV_ALIASES,
  canonicalEnvNames,
  canonicalEnvNameSet,
  clientEnvNames,
  serverEnvNames,
} from "./env-contract.mjs";

const ROOT = process.cwd();
const EXAMPLE_PATH = path.join(ROOT, ".env.example");
const LOCAL_PATH = path.join(ROOT, ".env.local");
const STRUCTURE_ONLY = process.argv.includes("--structure-only");
const OPTIONAL_EMPTY_KEYS = new Set(
  CANONICAL_ENV_VARS.filter((entry) => entry.optional).map((entry) => entry.name)
);
const PLACEHOLDER_PATTERNS = [/your-/i, /replace-me/i, /example\.com/i];

function parseEnvFile(filePath) {
  const map = new Map();
  if (!fs.existsSync(filePath)) return map;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2] || "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

function printSection(title, rows) {
  console.log(title);
  if (!rows.length) {
    console.log("(none)");
  } else {
    for (const r of rows) console.log(r);
  }
  console.log("");
}

function describeLegacyKey(name) {
  const alias = LEGACY_ENV_ALIASES[name];
  if (!alias) return name;
  const replacement = alias.replacement ? ` -> ${alias.replacement}` : "";
  return `${name}${replacement} (${alias.reason})`;
}

function hasPlaceholderValue(value) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(String(value || "")));
}

if (!fs.existsSync(EXAMPLE_PATH)) {
  console.error("env check failed: .env.example not found");
  process.exit(1);
}

if (!fs.existsSync(LOCAL_PATH)) {
  console.error("env check failed: .env.local not found");
  process.exit(1);
}

const example = parseEnvFile(EXAMPLE_PATH);
const local = parseEnvFile(LOCAL_PATH);

const exampleKeys = [...example.keys()].sort();
const localKeys = [...local.keys()].sort();

const missingFromExample = canonicalEnvNames.filter((k) => !example.has(k));
const unexpectedInExample = exampleKeys.filter((k) => !canonicalEnvNameSet.has(k));
const missingFromLocal = canonicalEnvNames.filter((k) => !local.has(k));
const unexpectedInLocal = localKeys.filter((k) => !canonicalEnvNameSet.has(k));
const legacyInExample = unexpectedInExample.filter((k) => Boolean(LEGACY_ENV_ALIASES[k]));
const legacyInLocal = unexpectedInLocal.filter((k) => Boolean(LEGACY_ENV_ALIASES[k]));
const empty = canonicalEnvNames.filter((k) => local.has(k) && String(local.get(k)).trim() === "");
const emptyOptional = empty.filter((k) => OPTIONAL_EMPTY_KEYS.has(k));
const emptyRequired = empty.filter((k) => !OPTIONAL_EMPTY_KEYS.has(k));
const placeholdersInLocal = canonicalEnvNames.filter((k) => local.has(k) && hasPlaceholderValue(local.get(k)));

printSection("CANONICAL_SERVER_ONLY", serverEnvNames);
printSection("CANONICAL_CLIENT_EXPOSED", clientEnvNames);
printSection("MISSING_FROM_EXAMPLE", missingFromExample);
printSection("UNEXPECTED_IN_EXAMPLE", unexpectedInExample);
printSection("LEGACY_ALIASES_IN_EXAMPLE", legacyInExample.map(describeLegacyKey));
printSection("MISSING_FROM_LOCAL", missingFromLocal);
printSection("UNEXPECTED_IN_LOCAL", unexpectedInLocal);
printSection("LEGACY_ALIASES_IN_LOCAL", legacyInLocal.map(describeLegacyKey));
printSection("EMPTY_OPTIONAL", emptyOptional);
printSection("EMPTY_REQUIRED", emptyRequired);
printSection("PLACEHOLDER_VALUES_IN_LOCAL", placeholdersInLocal);

if (missingFromExample.length > 0 || unexpectedInExample.length > 0) {
  console.error("env check failed: .env.example does not match the canonical contract");
  process.exit(1);
}

if (missingFromLocal.length > 0) {
  console.error("env check failed: missing canonical keys in .env.local");
  process.exit(1);
}

if (legacyInLocal.length > 0) {
  console.error("env check failed: legacy aliases are still present in .env.local");
  process.exit(1);
}

if (!STRUCTURE_ONLY && emptyRequired.length > 0) {
  console.error("env check failed: required keys are empty in .env.local");
  process.exit(1);
}

if (!STRUCTURE_ONLY && placeholdersInLocal.length > 0) {
  console.error("env check failed: placeholder values are still present in .env.local");
  process.exit(1);
}

console.log(`env check passed${STRUCTURE_ONLY ? " (structure-only mode)" : ""}.`);
