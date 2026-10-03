import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const WNO_PROJECT_ID = "prj_G4aMmGzfGoWKyVZ9wTgUPf5D7rrS";
const AIRPORT_420_PROJECT_ID = "prj_V8SeDn6xhYXvMSUestu5yT2hdbP0";
const cwd = process.cwd();

let root = "";
const rootResult = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  cwd,
  encoding: "utf8",
});

if (rootResult.status === 0 && rootResult.stdout && rootResult.stdout.trim()) {
  root = rootResult.stdout.trim();
} else if (fs.existsSync(path.join(cwd, "package.json")) && fs.existsSync(path.join(cwd, "apps"))) {
  root = cwd;
} else if (fs.existsSync(path.join(cwd, "../../package.json"))) {
  root = path.resolve(cwd, "../..");
} else {
  root = cwd;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: true,
    ...options,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}

let detectedProjectId = process.env.VERCEL_PROJECT_ID?.trim();
let detectedProjectName = process.env.VERCEL_PROJECT_NAME?.trim();

if (!detectedProjectId || !detectedProjectName) {
  try {
    const pjPaths = [
      path.join(root, ".vercel/project.json"),
      path.join(cwd, ".vercel/project.json")
    ];
    for (const p of pjPaths) {
      if (fs.existsSync(p)) {
        const pj = JSON.parse(fs.readFileSync(p, "utf8"));
        if (!detectedProjectId && pj.projectId) detectedProjectId = pj.projectId.trim();
        if (!detectedProjectName && pj.projectName) detectedProjectName = pj.projectName.trim();
      }
    }
  } catch (e) {
    // ignore
  }
}

console.log("[vercel-build-monorepo] Detected Project ID:", detectedProjectId, "| Name:", detectedProjectName);

if (detectedProjectId === WNO_PROJECT_ID || detectedProjectName === "welcometoneworleanstours") {
  run("pnpm", [
    "-w",
    "exec",
    "tsx",
    path.join(root, "scripts/test-wno-recommendations.ts"),
  ]);
  run(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "build"]);
  process.exit(0);
}

if (detectedProjectId === AIRPORT_420_PROJECT_ID || detectedProjectName === "420-airport-pickup") {
  console.log("Building 420-airport-pickup for Vercel...");
  const appDir = path.join(root, "apps/420-airport-pickup");
  const isWin = process.platform === "win32";
  run(isWin ? "npm.cmd" : "npm", ["run", "build"], { cwd: appDir });
  process.exit(0);
}

process.env.SKIP_ENV_CHECK = "1";

run("pnpm", ["run", "build"]);
