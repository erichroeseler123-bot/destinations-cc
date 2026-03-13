#!/usr/bin/env node
import { spawnSync } from "child_process";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    const value = next && !next.startsWith("--") ? next : "true";
    out[key] = value;
    if (value !== "true") i += 1;
  }
  return out;
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: "inherit" });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

const args = parseArgs(process.argv.slice(2));
if (!args.file) {
  console.error("Usage: node scripts/dcc/ingest-memory-pipeline.mjs --file <path-to-jsonl> [--dry-run]");
  process.exit(1);
}

const importArgs = ["run", "dcc:memory:import", "--", "--file", args.file];
if (args["dry-run"] === "true") importArgs.push("--dry-run");

run("npm", importArgs);
run("npm", ["run", "dcc:memory:baseline"]);
run("npm", ["run", "dcc:memory:delta"]);
run("npm", ["run", "dcc:memory:promote"]);
run("npm", ["run", "dcc:memory:planetary"]);

console.log("Memory ingest pipeline complete.");
