import { spawnSync } from "node:child_process";
import path from "node:path";

import fs from "node:fs";

const WNO_PROJECT_ID = "prj_G4aMmGzfGoWKyVZ9wTgUPf5D7rrS";
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
    ...options,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}

if (process.env.VERCEL_PROJECT_ID === WNO_PROJECT_ID) {
  run("pnpm", [
    "-w",
    "exec",
    "tsx",
    path.join(root, "scripts/test-wno-recommendations.ts"),
  ]);
  run(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "build"]);
  process.exit(0);
}

run("pnpm", ["run", "build"]);
