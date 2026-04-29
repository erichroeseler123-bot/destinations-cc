#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const contractPath = path.join(root, "docs", "env-contract.json");
const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = (modeArg ? modeArg.split("=")[1] : "dev").toLowerCase();
const modeLevels = {
  build: new Set(["CRITICAL"]),
  dev: new Set(["CRITICAL", "LOCAL_SMOKE"]),
  smoke: new Set(["CRITICAL", "LOCAL_SMOKE"]),
  prod: new Set(["CRITICAL", "PROD_ONLY"]),
  all: new Set(["CRITICAL", "LOCAL_SMOKE", "PROD_ONLY"]),
};

const fallbackContract = {
  project: "DCC",
  description: "Embedded fallback used when docs/env-contract.json is excluded from the deploy bundle.",
  variables: [
    {
      name: "DATABASE_URL",
      type: "url",
      requirement: "CRITICAL",
      description: "Primary Postgres/Neon URL for DB-backed telemetry, orders, and EarthOS persistence.",
    },
    {
      name: "INTERNAL_API_SECRET",
      type: "secret",
      requirement: "CRITICAL",
      description: "Auth secret for internal APIs, corridor event smoke, and system checks.",
    },
    {
      name: "FEASTLY_PAYMENT_CHECKOUT_URL",
      type: "url",
      requirement: "LOCAL_SMOKE",
      description: "Feastly checkout continuation URL used by production readiness and local parity checks.",
    },
    {
      name: "DCC_RESEND_API_KEY",
      type: "secret",
      requirement: "LOCAL_SMOKE",
      description: "Central DCC Resend key for deploy email smoke and future control-plane mailer.",
    },
    {
      name: "RESEND_API_KEY",
      type: "secret",
      requirement: "PROD_ONLY",
      description: "App-level Resend key where code paths still read the generic provider name.",
    },
    {
      name: "DCC_SATELLITE_SECRET",
      type: "secret",
      requirement: "LOCAL_SMOKE",
      description: "Shared local/dev satellite bootstrap secret for runtime-kit parity.",
    },
    {
      name: "DCC_SATELLITE_WEBHOOK_TOKEN",
      type: "secret",
      requirement: "LOCAL_SMOKE",
      description: "Shared fallback webhook token for local satellite callback validation.",
    },
    {
      name: "DCC_SHUTTLEYA_WEBHOOK_TOKEN",
      type: "secret",
      requirement: "PROD_ONLY",
      description: "Scoped Shuttleya callback token for production blast-radius isolation.",
    },
    {
      name: "DCC_PARR_WEBHOOK_TOKEN",
      type: "secret",
      requirement: "PROD_ONLY",
      description: "Scoped PARR callback token for Red Rocks booking lifecycle events.",
    },
    {
      name: "NEXT_PUBLIC_SQUARE_APP_ID",
      type: "string",
      requirement: "LOCAL_SMOKE",
      description: "Public Square app identifier for payment smoke and system integrity checks.",
    },
    {
      name: "NEXT_PUBLIC_SQUARE_LOCATION_ID",
      type: "string",
      requirement: "LOCAL_SMOKE",
      description: "Public Square location identifier for payment smoke and system integrity checks.",
    },
    {
      name: "SQUARE_LOCATION_ID",
      type: "string",
      requirement: "PROD_ONLY",
      description: "Server-side Square location identifier for DCC-owned payment-capable paths.",
    },
    {
      name: "SQUARE_ACCESS_TOKEN",
      type: "secret",
      requirement: "PROD_ONLY",
      description: "Square server token for DCC-owned payment-capable paths.",
    },
    {
      name: "MAIL_FROM_DCC",
      type: "email_header",
      requirement: "PROD_ONLY",
      description: "DCC-branded sender identity for Mission Control email.",
    },
    {
      name: "EARTHOS_APPROVAL_TO",
      type: "email_list",
      requirement: "PROD_ONLY",
      description: "Comma-separated default recipients for EarthOS mission approvals.",
    },
  ],
};

if (process.env.SKIP_ENV_CHECK === "1") {
  console.log("env check skipped via SKIP_ENV_CHECK=1");
  process.exit(0);
}

function parseEnvFile(filePath) {
  const values = new Map();
  if (!fs.existsSync(filePath)) return values;
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2] || "";
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values.set(match[1], value);
  }
  return values;
}

function loadEnvValues() {
  const merged = new Map();
  for (const name of [".env", ".env.local", ".env.production.local"]) {
    for (const [key, value] of parseEnvFile(path.join(root, name))) {
      merged.set(key, value);
    }
  }
  for (const [key, value] of Object.entries(process.env)) {
    merged.set(key, value);
  }
  return merged;
}

function getContract() {
  if (!fs.existsSync(contractPath)) {
    console.warn("env check warning: docs/env-contract.json not found; using embedded DCC fallback contract.");
    return fallbackContract;
  }
  const parsed = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  if (!Array.isArray(parsed.variables)) {
    console.error("env check failed: docs/env-contract.json must include a variables array");
    process.exit(1);
  }
  return parsed;
}

const levels = modeLevels[mode];
if (!levels) {
  console.error(`env check failed: unknown mode "${mode}"`);
  process.exit(1);
}

const contract = getContract();
const env = loadEnvValues();
const example = parseEnvFile(path.join(root, ".env.example"));
const missingFromExample = contract.variables.map((item) => item.name).filter((name) => !example.has(name));
const missing = contract.variables.filter((item) => {
  if (!levels.has(item.requirement)) return false;
  const value = env.get(item.name);
  return typeof value !== "string" || value.trim() === "";
});

if (missingFromExample.length) {
  console.error("env check failed: .env.example is missing contract keys:");
  for (const name of missingFromExample) console.error(`- ${name}`);
  console.error("Check docs/env-wiring-plan.md");
  process.exit(1);
}

if (missing.length) {
  console.error(`env check failed for ${contract.project || "project"} (${mode} mode):`);
  for (const item of missing) {
    console.error(`- Missing ${item.name} [${item.requirement}] - ${item.description || "Check docs/env-wiring-plan.md"}`);
  }
  console.error("Check docs/env-wiring-plan.md");
  process.exit(1);
}

console.log(`env check passed for ${contract.project || "project"} (${mode} mode).`);
