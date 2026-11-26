import { spawnSync } from "node:child_process";

// Narrow Vercel ignore check scoped specifically to apps/saveonthestrip.
// Exit code semantics per Vercel:
//   0 = cancel/skip build (changes are unrelated to Save on the Strip)
//   1 = proceed with build (Save on the Strip or its shared runtime inputs changed)

const RELEVANT_PREFIXES = [
  "apps/saveonthestrip",
  "lib/dcc/shared",
  ".github/workflows/deploy-saveonthestrip.yml",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "scripts/vercel-build-monorepo.mjs",
];

function matchesPrefix(changedPath, prefix) {
  const clean = prefix.replace(/\/+$/, "");
  return changedPath === clean || changedPath.startsWith(`${clean}/`);
}

export function isRelevantToSaveOnTheStrip(changedPaths) {
  if (!Array.isArray(changedPaths) || changedPaths.length === 0) {
    return true;
  }
  return changedPaths.some((filePath) =>
    RELEVANT_PREFIXES.some((prefix) => matchesPrefix(filePath, prefix)),
  );
}

function hasCommit(rev) {
  if (!rev) return false;
  return (
    spawnSync("git", ["cat-file", "-e", `${rev}^{commit}`], {
      encoding: "utf8",
      stdio: "ignore",
    }).status === 0
  );
}

function tryFetchCommitOrBranch(target) {
  if (!target) return false;
  spawnSync("git", ["fetch", "--quiet", "--depth=50", "origin", target], {
    encoding: "utf8",
    stdio: "ignore",
    timeout: 8000,
  });
  return hasCommit(target === "main" ? "origin/main" : target);
}

function resolveChangedPaths(env = process.env) {
  const head = (env.VERCEL_GIT_COMMIT_SHA || "HEAD").trim();
  const prev = (env.VERCEL_GIT_PREVIOUS_SHA || "").trim();
  const branch = (env.VERCEL_GIT_COMMIT_REF || "").trim();

  // 1. If Vercel provides VERCEL_GIT_PREVIOUS_SHA, compare prev..head across shallow clones.
  if (/^[0-9a-f]{7,40}$/i.test(prev) && !/^0+$/.test(prev) && prev !== head) {
    if (!hasCommit(prev)) {
      tryFetchCommitOrBranch(prev);
    }
    if (hasCommit(prev)) {
      const diff = spawnSync("git", ["diff", "--name-only", prev, head], {
        encoding: "utf8",
      });
      if (diff.status === 0) {
        return diff.stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
      }
    }
  }

  // 2. On feature/PR branches without a previous deployed SHA, compare against origin/main
  // so multi-commit PRs that touched apps/saveonthestrip in an earlier commit still build.
  if (branch && branch !== "main") {
    if (hasCommit("origin/main") || tryFetchCommitOrBranch("main")) {
      const diff = spawnSync(
        "git",
        ["diff", "--name-only", "origin/main...HEAD"],
        { encoding: "utf8" },
      );
      if (diff.status === 0) {
        const lines = diff.stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        if (lines.length > 0) {
          return lines;
        }
      }
    }
  }

  // 3. Fallback to tip commit diff-tree (fail-open if git cannot evaluate).
  const single = spawnSync(
    "git",
    ["diff-tree", "--no-commit-id", "--name-only", "-r", "-m", head],
    { encoding: "utf8" },
  );
  if (single.status !== 0) {
    return null;
  }
  return single.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const isDirectRun =
  import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`;

if (isDirectRun) {
  if (process.env.FORCE_SOTS_BUILD === "1") {
    console.log("saveonthestrip: FORCE_SOTS_BUILD=1; continuing build.");
    process.exit(1);
  }

  const changedPaths = resolveChangedPaths();
  if (changedPaths === null) {
    console.warn(
      "saveonthestrip: could not evaluate git diff; failing open and building.",
    );
    process.exit(1);
  }

  if (!isRelevantToSaveOnTheStrip(changedPaths)) {
    console.log(
      "saveonthestrip: commit range does not touch apps/saveonthestrip or shared inputs; skipping deployment.",
    );
    process.exit(0);
  }

  console.log(
    "saveonthestrip: relevant change detected in apps/saveonthestrip or shared inputs; building.",
  );
  process.exit(1);
}
