import { spawnSync } from "node:child_process";

// Dedicated Vercel projects in this monorepo. Unknown projects fail open and build.
const projectPaths = {
  prj_7nY8notLHK8Fh5TkSwli9qXUDhxA: ["apps/juneauflightdeck"],
  prj_ZY5kkB2QvuIkvJWSGD9IZ0mvhBxx: ["apps/welcometotheswamp"],
  prj_V8SeDn6xhYXvMSUestu5yT2hdbP0: ["apps/420-airport-pickup"],
  prj_I9q7K5y6J7jbHWJ7QFVCE2GQW5T3: ["apps/welcometothedells"],
  prj_G4aMmGzfGoWKyVZ9wTgUPf5D7rrS: ["apps/welcometoneworleanstours"],
  prj_YfLWOIm1TuSgA6E8Je3TANQvoDfo: ["apps/frenchquarterorientation"],
};

const projectId = process.env.VERCEL_PROJECT_ID;
const relevantAppPaths = projectPaths[projectId];

// Vercel ignoreCommand semantics: 0 = skip deployment, 1 = continue building.
// Never suppress an unknown/core project.
if (!relevantAppPaths) {
  process.exit(1);
}

const base = process.env.VERCEL_GIT_PREVIOUS_SHA;
const head = process.env.VERCEL_GIT_COMMIT_SHA || "HEAD";

// If Vercel cannot give us a trustworthy comparison range, fail open and build.
if (!base) {
  process.exit(1);
}

const sharedBuildInputs = [
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
];

const relevantPaths = [...relevantAppPaths, ...sharedBuildInputs];
const result = spawnSync(
  "git",
  ["diff", "--quiet", `${base}...${head}`, "--", ...relevantPaths],
  { stdio: "inherit" },
);

if (result.status === 0) {
  console.log(
    `Vercel project ${projectId}: no changes under ${relevantAppPaths.join(", ")}; skipping deployment.`,
  );
  process.exit(0);
}

if (result.status === 1) {
  console.log(
    `Vercel project ${projectId}: relevant app or shared dependency change detected; building.`,
  );
  process.exit(1);
}

console.warn(`Vercel project ${projectId}: git diff could not be evaluated; building fail-open.`);
process.exit(1);
