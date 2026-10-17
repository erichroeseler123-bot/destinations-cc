import { spawnSync } from "node:child_process";

// Dedicated Vercel projects in this monorepo. Each project builds only for
// changes to its app, its own deployment workflow, or shared package inputs.
// Unknown/core projects fail open and build.
const projectPaths = {
  prj_7nY8notLHK8Fh5TkSwli9qXUDhxA: [
    "apps/juneauflightdeck",
    ".github/workflows/deploy-juneauflightdeck.yml",
  ],
  prj_ZY5kkB2QvuIkvJWSGD9IZ0mvhBxx: [
    "apps/welcometotheswamp",
    ".github/workflows/deploy-welcometotheswamp.yml",
  ],
  prj_V8SeDn6xhYXvMSUestu5yT2hdbP0: [
    "apps/420-airport-pickup",
    ".github/workflows/deploy-420-airport-pickup.yml",
  ],
  prj_0JZvBdAanNlt4Xqj06SeSe8r2Kr5: [
    "apps/saveonthestrip",
    ".github/workflows/deploy-saveonthestrip.yml",
  ],
  prj_I9q7K5y6J7jbHWJ7QFVCE2GQW5T3: ["apps/welcometothedells"],
  prj_G4aMmGzfGoWKyVZ9wTgUPf5D7rrS: [
    "apps/welcometoneworleanstours",
    "app/new-orleans",
    "app/sitemap.xml",
    "lib/dcc",
  ],
  prj_YfLWOIm1TuSgA6E8Je3TANQvoDfo: ["apps/frenchquarterorientation"],
};

// Paused legacy or duplicate Vercel projects connected to this repository.
// They skip automatic builds unless FORCE_LEGACY_VERCEL_BUILD=1 is explicitly set.
const pausedLegacyProjects = new Set([
  "prj_oQ2rVFKzFL8FnDgpUMt3X0M3KrU3", // web
  "prj_luX9tL1gnzWWmlz6qagw4H0rCiyC", // dcc-v1-cut-clean
  "prj_cYimEOSswbpWc5DSvY4by4btqrg0", // destinations-cc-wnlu
]);

// Root DCC projects that build from repository root (/).
// They skip deployment when a commit only modifies isolated apps/* (excluding
// apps/*/lib/route-governance.* imported by src/data/system-inventory.ts),
// sub-app deployment workflows, or tools/ag-bridge/*.
const rootDccProjects = new Set([
  "prj_pqvFn6jtJbbVgv1UsAsg3KtMl26s", // destinations-cc
  "prj_u5YgZvGuXLTdhbTehOTOGbkBUCpX", // dcc-v2-monolith
]);

const standaloneOnlyRootSkipPrefixes = [
  "apps/",
  "tools/ag-bridge/",
  ".github/workflows/deploy-juneauflightdeck.yml",
  ".github/workflows/deploy-welcometotheswamp.yml",
  ".github/workflows/deploy-420-airport-pickup.yml",
  ".github/workflows/deploy-saveonthestrip.yml",
];

function isStandaloneOnlyForRootDcc(changedPath) {
  if (/^apps\/[^/]+\/lib\/route-governance(?:\.[a-z0-9]+)?$/i.test(changedPath)) {
    return false;
  }
  return standaloneOnlyRootSkipPrefixes.some((prefix) =>
    prefix.endsWith("/") ? changedPath.startsWith(prefix) : changedPath === prefix,
  );
}

const projectId = process.env.VERCEL_PROJECT_ID;

// Vercel ignoreCommand semantics: 0 = skip deployment, 1 = continue building.
if (pausedLegacyProjects.has(projectId)) {
  if (process.env.FORCE_LEGACY_VERCEL_BUILD === "1") {
    console.log(`Vercel project ${projectId}: forced legacy build requested; building.`);
    process.exit(1);
  }
  console.log(
    `Vercel project ${projectId}: legacy/duplicate project paused by monorepo ignore policy; skipping deployment.`,
  );
  process.exit(0);
}

const relevantProjectPaths = projectPaths[projectId];
const isRootDccProject = rootDccProjects.has(projectId);

if (!relevantProjectPaths && !isRootDccProject) {
  process.exit(1);
}

const head = process.env.VERCEL_GIT_COMMIT_SHA || "HEAD";
const sharedBuildInputs = [
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "vercel.json",
  "scripts/vercel-build-monorepo.mjs",
];

const changed = spawnSync(
  "git",
  ["diff-tree", "--no-commit-id", "--name-only", "-r", "-m", head],
  { encoding: "utf8" },
);

if (changed.status !== 0) {
  console.warn(`Vercel project ${projectId}: changed-file list could not be evaluated; building fail-open.`);
  process.exit(1);
}

const changedPaths = changed.stdout
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean);

if (changedPaths.length === 0) {
  process.exit(1);
}

if (isRootDccProject) {
  const onlyStandaloneChanges = changedPaths.every(isStandaloneOnlyForRootDcc);
  if (onlyStandaloneChanges) {
    console.log(
      `Vercel root DCC project ${projectId}: commit only touches isolated sub-apps or bridge tooling; skipping deployment.`,
    );
    process.exit(0);
  }
  console.log(
    `Vercel root DCC project ${projectId}: core DCC or shared input change detected; building.`,
  );
  process.exit(1);
}

const relevant = changedPaths.some((changedPath) =>
  [...relevantProjectPaths, ...sharedBuildInputs].some(
    (prefix) => changedPath === prefix || changedPath.startsWith(`${prefix}/`),
  ),
);

if (!relevant) {
  console.log(
    `Vercel project ${projectId}: current commit does not touch its app/workflow; skipping deployment.`,
  );
  process.exit(0);
}

console.log(
  `Vercel project ${projectId}: relevant app, workflow, or shared dependency change detected; building.`,
);
process.exit(1);
