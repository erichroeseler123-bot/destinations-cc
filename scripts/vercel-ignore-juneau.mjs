import { spawnSync } from "node:child_process";

const JUNEAU_PROJECT_ID = "prj_7nY8notLHK8Fh5TkSwli9qXUDhxA";

// Other Vercel projects using this monorepo keep their existing behavior.
if (process.env.VERCEL_PROJECT_ID !== JUNEAU_PROJECT_ID) {
  process.exit(1);
}

const base = process.env.VERCEL_GIT_PREVIOUS_SHA;
const head = process.env.VERCEL_GIT_COMMIT_SHA || "HEAD";

// If Vercel cannot give us a trustworthy comparison range, fail open and build.
if (!base) {
  process.exit(1);
}

const juneauRelevantPaths = [
  "apps/juneauflightdeck",
  "app/juneau-flight-deck",
  "app/layout.tsx",
  "app/globals.css",
  "lib/getyourguide",
  "public",
  "middleware.ts",
  "next.config.mjs",
  "package.json",
  "pnpm-lock.yaml",
  "vercel.json",
  "scripts/vercel-ignore-juneau.mjs",
];

const result = spawnSync(
  "git",
  ["diff", "--quiet", `${base}...${head}`, "--", ...juneauRelevantPaths],
  { stdio: "inherit" },
);

// Vercel ignoreCommand semantics:
// 0 = skip this deployment, 1 = continue building.
if (result.status === 0) {
  console.log("Juneau Flight Deck: no Juneau-relevant changes; skipping deployment.");
  process.exit(0);
}

if (result.status === 1) {
  console.log("Juneau Flight Deck: relevant change detected; building.");
  process.exit(1);
}

console.warn("Juneau Flight Deck: git diff could not be evaluated; building fail-open.");
process.exit(1);
