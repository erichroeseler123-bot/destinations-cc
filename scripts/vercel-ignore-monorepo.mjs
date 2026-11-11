import { spawnSync } from "node:child_process";

// Dedicated Vercel projects in this monorepo (keyed by VERCEL_PROJECT_ID and VERCEL_PROJECT_NAME).
// Each sub-app project builds only for changes to its app, its deployment workflow, or shared root inputs.
// Unknown/core projects fail open and build.
export const SUB_APP_PROJECT_PATHS = {
  "last-frontier-shore-excursions": "apps/last-frontier-shore-excursions",
  "french-quarter-orientation": "apps/frenchquarterorientation",
  saveonthestrip: "apps/saveonthestrip",
  welcometothedells: "apps/welcometothedells",
  welcometoneworleanstours: "apps/welcometoneworleanstours",
  juneauflightdeck: "apps/juneauflightdeck",
  welcometotheswamp: "apps/welcometotheswamp",
  "420-airport-pickup": "apps/420-airport-pickup",
};

export const ROOT_SHARED_PREFIXES = [
  "lib/dcc/shared/",
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "vercel.json",
  "scripts/vercel-build-monorepo.mjs",
];

const projectPathsByIdOrName = {
  prj_7nY8notLHK8Fh5TkSwli9qXUDhxA: [
    SUB_APP_PROJECT_PATHS.juneauflightdeck,
    ".github/workflows/deploy-juneauflightdeck.yml",
  ],
  juneauflightdeck: [
    SUB_APP_PROJECT_PATHS.juneauflightdeck,
    ".github/workflows/deploy-juneauflightdeck.yml",
  ],
  prj_ZY5kkB2QvuIkvJWSGD9IZ0mvhBxx: [
    SUB_APP_PROJECT_PATHS.welcometotheswamp,
    ".github/workflows/deploy-welcometotheswamp.yml",
  ],
  welcometotheswamp: [
    SUB_APP_PROJECT_PATHS.welcometotheswamp,
    ".github/workflows/deploy-welcometotheswamp.yml",
  ],
  prj_V8SeDn6xhYXvMSUestu5yT2hdbP0: [
    SUB_APP_PROJECT_PATHS["420-airport-pickup"],
    ".github/workflows/deploy-420-airport-pickup.yml",
  ],
  "420-airport-pickup": [
    SUB_APP_PROJECT_PATHS["420-airport-pickup"],
    ".github/workflows/deploy-420-airport-pickup.yml",
  ],
  prj_0JZvBdAanNlt4Xqj06SeSe8r2Kr5: [
    SUB_APP_PROJECT_PATHS.saveonthestrip,
    ".github/workflows/deploy-saveonthestrip.yml",
  ],
  saveonthestrip: [
    SUB_APP_PROJECT_PATHS.saveonthestrip,
    ".github/workflows/deploy-saveonthestrip.yml",
  ],
  prj_I9q7K5y6J7jbHWJ7QFVCE2GQW5T3: [SUB_APP_PROJECT_PATHS.welcometothedells],
  welcometothedells: [SUB_APP_PROJECT_PATHS.welcometothedells],
  prj_G4aMmGzfGoWKyVZ9wTgUPf5D7rrS: [
    SUB_APP_PROJECT_PATHS.welcometoneworleanstours,
    "app/new-orleans",
    "app/sitemap.xml",
    "lib/dcc",
  ],
  welcometoneworleanstours: [
    SUB_APP_PROJECT_PATHS.welcometoneworleanstours,
    "app/new-orleans",
    "app/sitemap.xml",
    "lib/dcc",
  ],
  prj_YfLWOIm1TuSgA6E8Je3TANQvoDfo: [
    SUB_APP_PROJECT_PATHS["french-quarter-orientation"],
  ],
  "french-quarter-orientation": [
    SUB_APP_PROJECT_PATHS["french-quarter-orientation"],
  ],
  prj_yDpBslt3bvKrvqNnzuQn684rLhAy: [
    SUB_APP_PROJECT_PATHS["last-frontier-shore-excursions"],
  ],
  "last-frontier-shore-excursions": [
    SUB_APP_PROJECT_PATHS["last-frontier-shore-excursions"],
  ],
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
  "destinations-cc",
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

function matchesPrefix(changedPath, prefix) {
  const cleanPrefix = prefix.replace(/\/+$/, "");
  return changedPath === cleanPrefix || changedPath.startsWith(`${cleanPrefix}/`);
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME) {
  const projectId = process.env.VERCEL_PROJECT_ID || "";
  const projectName = process.env.VERCEL_PROJECT_NAME || "";
  const projectKey = projectId || projectName;

  // Vercel ignoreCommand semantics: 0 = skip deployment, 1 = continue building.
  if (pausedLegacyProjects.has(projectId) || pausedLegacyProjects.has(projectName)) {
    if (process.env.FORCE_LEGACY_VERCEL_BUILD === "1") {
      console.log(`Vercel project ${projectKey}: forced legacy build requested; building.`);
      process.exit(1);
    }
    console.log(
      `Vercel project ${projectKey}: legacy/duplicate project paused by monorepo ignore policy; skipping deployment.`,
    );
    process.exit(0);
  }

  const relevantProjectPaths =
    projectPathsByIdOrName[projectId] || projectPathsByIdOrName[projectName];
  const isRootDccProject =
    rootDccProjects.has(projectId) || rootDccProjects.has(projectName);

  if (!relevantProjectPaths && !isRootDccProject) {
    process.exit(1);
  }

  const head = process.env.VERCEL_GIT_COMMIT_SHA || "HEAD";
  const prev = (process.env.VERCEL_GIT_PREVIOUS_SHA || "").trim();
  const hasValidPrev =
    /^[0-9a-f]{7,40}$/i.test(prev) &&
    !/^0+$/.test(prev) &&
    prev !== head &&
    spawnSync("git", ["cat-file", "-e", `${prev}^{commit}`], { encoding: "utf8" }).status === 0;

  const changed = hasValidPrev
    ? spawnSync("git", ["diff", "--name-only", prev, head], { encoding: "utf8" })
    : spawnSync("git", ["diff-tree", "--no-commit-id", "--name-only", "-r", "-m", head], {
        encoding: "utf8",
      });

  if (changed.status !== 0) {
    console.warn(`Vercel project ${projectKey}: changed-file list could not be evaluated; building fail-open.`);
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
        `Vercel root DCC project ${projectKey}: commit only touches isolated sub-apps or bridge tooling; skipping deployment.`,
      );
      process.exit(0);
    }
    console.log(
      `Vercel root DCC project ${projectKey}: core DCC or shared input change detected; building.`,
    );
    process.exit(1);
  }

  const relevant = changedPaths.some((changedPath) =>
    [...relevantProjectPaths, ...ROOT_SHARED_PREFIXES].some((prefix) =>
      matchesPrefix(changedPath, prefix),
    ),
  );

  if (!relevant) {
    console.log(
      `Vercel project ${projectKey}: current commit does not touch its app/workflow; skipping deployment.`,
    );
    process.exit(0);
  }

  console.log(
    `Vercel project ${projectKey}: relevant app, workflow, or shared dependency change detected; building.`,
  );
  process.exit(1);
}
