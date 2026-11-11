#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();

function fail(message) {
  console.error(`[ecosystem-release-gate] FAIL: ${message}`);
  process.exit(1);
}

// 1. Verify lib/dcc/shared/* has zero @neondatabase/serverless or node-only DB imports
const sharedDir = path.join(repoRoot, "lib", "dcc", "shared");
if (!fs.existsSync(sharedDir)) {
  fail("Missing lib/dcc/shared directory");
}
for (const fileName of [
  "envCompat.ts",
  "edgeContextAndPii.ts",
  "specialistInquiryClient.ts",
  "canonicalFitStatus.ts",
  "addToCruisePromenadeUrl.ts",
]) {
  const fullPath = path.join(sharedDir, fileName);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing shared module lib/dcc/shared/${fileName}`);
  }
  const source = fs.readFileSync(fullPath, "utf8");
  const forbiddenImportRe =
    /(?:import\s+[\s\S]*?from\s*|import\s*\(|require\s*\()\s*["'][^"']*(?:@neondatabase\/serverless|transactionalSubmissions|node:fs|["']fs["'])/;
  if (forbiddenImportRe.test(source)) {
    fail(
      `lib/dcc/shared/${fileName} must have zero @neondatabase/serverless, fs, or transactionalSubmissions imports`,
    );
  }
}

// 2. Verify scripts/vercel-ignore-monorepo.mjs tracks lib/dcc/shared/ and all 8 monorepo apps
const vercelIgnoreSource = fs.readFileSync(
  path.join(repoRoot, "scripts", "vercel-ignore-monorepo.mjs"),
  "utf8",
);
for (const token of [
  "lib/dcc/shared/",
  "last-frontier-shore-excursions",
  "french-quarter-orientation",
  "saveonthestrip",
  "welcometothedells",
  "welcometoneworleanstours",
  "juneauflightdeck",
  "welcometotheswamp",
  "420-airport-pickup",
]) {
  if (!vercelIgnoreSource.includes(token)) {
    fail(`scripts/vercel-ignore-monorepo.mjs missing '${token}'`);
  }
}

// 3. Execute TypeScript release-gate contract suite
console.log(
  "[ecosystem-release-gate] Running ecosystem coherence & contracts test suite...",
);
const result = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "--env-file-if-exists=.env.test.local",
    "--test",
    "tests/dcc/ecosystem-coherence-and-contracts.test.ts",
    "tests/dcc/north-star-control-center-and-graph.test.ts",
  ],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      DCC_DISABLE_NEON_COMMERCE: "1",
    },
  },
);

if (result.status !== 0) {
  fail(
    `Release-gate contract test suite exited with code ${result.status ?? 1}`,
  );
}

console.log("[ecosystem-release-gate] PASS: All ecosystem contracts verified.");
