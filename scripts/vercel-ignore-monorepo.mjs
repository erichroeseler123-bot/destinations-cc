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
  prj_G4aMmGzfGoWKyVZ9wTgUPf5D7rrS: ["apps/welcometoneworleanstours"],
  prj_YfLWOIm1TuSgA6E8Je3TANQvoDfo: ["apps/frenchquarterorientation"],
};

const projectId = process.env.VERCEL_PROJECT_ID;
const relevantProjectPaths = projectPaths[projectId];

// Vercel ignoreCommand semantics: 0 = skip deployment, 1 = continue building.
if (!relevantProjectPaths) {
  process.exit(1);
}

const head = process.env.VERCEL_GIT_COMMIT_SHA || "HEAD";
const sharedBuildInputs = [
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
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
