import { withWorkflow } from "workflow/next";
import { buildCitySatelliteRedirects, buildSatelliteRedirects } from "./src/data/edge-routing-rules.mjs";
import { buildRuntimeRedirects } from "./src/data/runtime-redirects.mjs";
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHECKED_BUILD_INPUT_PATHS = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.mjs",
  "drizzle.config.ts",
  "vercel.json",
  "postcss.config.js",
  "tailwind.config.js",
  "eslint.config.mjs",
  ".eslintrc.json",
  ".npmrc",
  ".nvmrc",
  "proxy.ts",
  "city-aliases.ts",
  "canonicalize.mjs",
  "validate.mjs",
  "verify.mjs",
  "drizzle",
  "scripts",
  "app",
  "components",
  "config",
  "data",
  "lib",
  "src",
  "types",
  "utils",
  "workflows",
  "public",
  "styles",
  "tests",
];

function sha256HexNode(bufOrStr) {
  return crypto.createHash("sha256").update(bufOrStr).digest("hex");
}

function canonicalizeJsonValueNode(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonicalizeJsonValueNode(item)).join(",") + "]";
  }
  const keys = Object.keys(value).sort();
  const pairs = [];
  for (const k of keys) {
    if (value[k] !== undefined) {
      pairs.push(JSON.stringify(k) + ":" + canonicalizeJsonValueNode(value[k]));
    }
  }
  return "{" + pairs.join(",") + "}";
}

function readNormalizedTextBytes(filePath) {
  const raw = fs.readFileSync(filePath);
  if (raw.includes(0)) return raw;
  return Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
}

function inspectNextConfigPlatformTransformation(baseDir) {
  const diskPath = path.join(baseDir, "next.config.mjs");
  const vercelBackup = path.join(baseDir, "next.config.__vercel_builder_backup__.mjs");
  let effectiveOnDiskSha256 = "unknown";
  let diskText = "";
  try {
    if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
      const normDisk = readNormalizedTextBytes(diskPath);
      effectiveOnDiskSha256 = sha256HexNode(normDisk);
      diskText = normDisk.toString("utf8");
    }
  } catch {
    // ignore
  }
  try {
    const headBlob = execSync("git show HEAD:next.config.mjs", {
      cwd: baseDir,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const headNorm = Buffer.from(headBlob.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    const committedSha256 = sha256HexNode(headNorm);
    if (effectiveOnDiskSha256 !== "unknown" && effectiveOnDiskSha256 === committedSha256) {
      return {
        path: "next.config.mjs",
        status: "clean_unmodified",
        transformationValidated: true,
        committedSha256,
        effectiveSourceSha256: committedSha256,
        effectiveOnDiskSha256,
        disclosedModification: null,
      };
    }
    if (fs.existsSync(vercelBackup) && fs.statSync(vercelBackup).isFile()) {
      const backupNorm = readNormalizedTextBytes(vercelBackup);
      const backupSha256 = sha256HexNode(backupNorm);
      const wrapperImportsBackup = diskText.includes("next.config.__vercel_builder_backup__");
      if (backupSha256 === committedSha256 && wrapperImportsBackup) {
        return {
          path: "next.config.mjs",
          status: "validated_platform_transformation",
          transformationValidated: true,
          committedSha256,
          effectiveSourceSha256: backupSha256,
          effectiveOnDiskSha256,
          disclosedModification: "vercel_builder_backup_wrapper_rewrite",
        };
      }
    }
    return {
      path: "next.config.mjs",
      status: "unvalidated_modification_dirty",
      transformationValidated: false,
      committedSha256,
      effectiveSourceSha256: effectiveOnDiskSha256,
      effectiveOnDiskSha256,
      disclosedModification: "unvalidated_next_config_modification",
    };
  } catch {
    return {
      path: "next.config.mjs",
      status: "unknown",
      transformationValidated: false,
      committedSha256: "unknown",
      effectiveSourceSha256: effectiveOnDiskSha256,
      effectiveOnDiskSha256,
      disclosedModification: "verification_unavailable",
    };
  }
}

function inspectVercelJsonPlatformTransformation(baseDir, liveHead) {
  const diskPath = path.join(baseDir, "vercel.json");
  let effectiveOnDiskSha256 = "unknown";
  let diskText = null;
  try {
    if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
      const normDisk = readNormalizedTextBytes(diskPath);
      effectiveOnDiskSha256 = sha256HexNode(normDisk);
      diskText = normDisk.toString("utf8");
    }
  } catch {
    // ignore
  }
  try {
    const headBlob = execSync("git show HEAD:vercel.json", {
      cwd: baseDir,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const headNorm = Buffer.from(headBlob.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    const headText = headNorm.toString("utf8");
    const committedSha256 = sha256HexNode(headNorm);
    if (diskText === null || effectiveOnDiskSha256 === "unknown") {
      return {
        path: "vercel.json",
        status: "unknown",
        transformationValidated: false,
        committedSha256,
        effectiveOnDiskSha256: "unknown",
        canonicalContentSha256: null,
        committedMatchesCanonicalContent: false,
        disclosedModification: "disk_vercel_json_unavailable",
      };
    }
    let headParsed;
    let diskParsed;
    let headCanonical = null;
    let diskCanonical = null;
    try {
      headParsed = JSON.parse(headText);
      headCanonical = canonicalizeJsonValueNode(headParsed);
    } catch {
      // ignore
    }
    try {
      diskParsed = JSON.parse(diskText);
      diskCanonical = canonicalizeJsonValueNode(diskParsed);
    } catch {
      // ignore
    }
    const canonicalContentSha256 = diskCanonical ? sha256HexNode(diskCanonical) : null;
    const committedMatchesCanonicalContent = Boolean(
      headCanonical !== null && diskCanonical !== null && headCanonical === diskCanonical,
    );

    if (effectiveOnDiskSha256 === committedSha256) {
      return {
        path: "vercel.json",
        status: "clean_unmodified",
        transformationValidated: true,
        committedSha256,
        effectiveOnDiskSha256,
        canonicalContentSha256,
        committedMatchesCanonicalContent: true,
        disclosedModification: null,
      };
    }

    const vercelEnvMatches =
      process.env.VERCEL === "1" &&
      Boolean(process.env.VERCEL_GIT_COMMIT_SHA?.trim()) &&
      (!liveHead || process.env.VERCEL_GIT_COMMIT_SHA.trim() === liveHead);

    const expectedMinified =
      headParsed !== undefined ? JSON.stringify(headParsed) : null;
    const matchesExpectedVercelMinification = Boolean(
      expectedMinified !== null &&
        committedMatchesCanonicalContent &&
        (diskText === expectedMinified || diskText === `${expectedMinified}\n`),
    );

    if (vercelEnvMatches && matchesExpectedVercelMinification) {
      return {
        path: "vercel.json",
        status: "validated_platform_transformation",
        transformationValidated: true,
        committedSha256,
        effectiveOnDiskSha256,
        canonicalContentSha256,
        committedMatchesCanonicalContent: true,
        disclosedModification: "vercel_container_lossless_json_minify_newline",
      };
    }

    const disclosedModification = committedMatchesCanonicalContent
      ? "unvalidated_non_platform_formatting_modification"
      : `unvalidated_effective_config_modification:committedCanonical=${headCanonical ? sha256HexNode(headCanonical).slice(0, 12) : "invalid_json"},effectiveCanonical=${canonicalContentSha256 ? canonicalContentSha256.slice(0, 12) : "invalid_json"}`;

    return {
      path: "vercel.json",
      status: "unvalidated_modification_dirty",
      transformationValidated: false,
      committedSha256,
      effectiveOnDiskSha256,
      canonicalContentSha256,
      committedMatchesCanonicalContent,
      disclosedModification,
    };
  } catch {
    return {
      path: "vercel.json",
      status: "unknown",
      transformationValidated: false,
      committedSha256: "unknown",
      effectiveOnDiskSha256,
      canonicalContentSha256: null,
      committedMatchesCanonicalContent: false,
      disclosedModification: "verification_unavailable",
    };
  }
}

function resolveEffectiveNextConfigPath(baseDir) {
  const nextCheck = inspectNextConfigPlatformTransformation(baseDir);
  if (nextCheck.status === "validated_platform_transformation") {
    return path.join(baseDir, "next.config.__vercel_builder_backup__.mjs");
  }
  return path.join(baseDir, "next.config.mjs");
}

function isStatusLineCleanAgainstHead(baseDir, line, liveHead) {
  if (/^D\s+"?(legacy_vault|scratch|data\/sources\/geonames|\.open-next|\.wrangler)\//.test(line)) {
    return true;
  }
  const match = line.match(/^[MT]+\s+(.+)$/);
  if (!match) {
    return false;
  }
  const relPath = match[1].trim().replace(/^"|"$/g, "");
  if (relPath === "next.config.mjs") {
    return inspectNextConfigPlatformTransformation(baseDir).transformationValidated;
  }
  if (relPath === "vercel.json") {
    return inspectVercelJsonPlatformTransformation(baseDir, liveHead).transformationValidated;
  }
  try {
    const diskPath = path.join(baseDir, relPath);
    if (!fs.existsSync(diskPath) || !fs.statSync(diskPath).isFile()) {
      return false;
    }
    const diskDigest = sha256HexNode(readNormalizedTextBytes(diskPath));
    const headBlob = execSync(`git show HEAD:${relPath}`, {
      cwd: baseDir,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const headNormalized = headBlob.includes(0)
      ? headBlob
      : Buffer.from(headBlob.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    return diskDigest === sha256HexNode(headNormalized);
  } catch {
    return false;
  }
}

function hashEffectiveFilesDeterministic(baseDir, relPaths) {
  const pieces = [];
  for (const rel of [...relPaths].sort()) {
    const full =
      rel === "next.config.mjs"
        ? resolveEffectiveNextConfigPath(baseDir)
        : path.join(baseDir, rel);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      const fileDigest = sha256HexNode(readNormalizedTextBytes(full));
      pieces.push(`${rel}:${fileDigest}`);
    }
  }
  return pieces.length > 0 ? sha256HexNode(pieces.join("\n")) : "unknown";
}

function hashCommittedHeadFilesDeterministic(baseDir, relPaths) {
  const pieces = [];
  for (const rel of [...relPaths].sort()) {
    const full = path.join(baseDir, rel);
    if (!fs.existsSync(full)) continue;
    try {
      const headBlob = execSync(`git show HEAD:${rel}`, {
        cwd: baseDir,
        stdio: ["ignore", "pipe", "ignore"],
      });
      const headNormalized = headBlob.includes(0)
        ? headBlob
        : Buffer.from(headBlob.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
      pieces.push(`${rel}:${sha256HexNode(headNormalized)}`);
    } catch {
      return "unknown";
    }
  }
  return pieces.length > 0 ? sha256HexNode(pieces.join("\n")) : "unknown";
}

function listFilesRecursiveRel(baseDir, subDir) {
  const target = path.join(baseDir, subDir);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) return [];
  const results = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        results.push(path.relative(baseDir, full).replace(/\\/g, "/"));
      }
    }
  };
  walk(target);
  return results;
}

const ROOT_CONFIG_INPUT_FILES = [
  "package.json",
  "tsconfig.json",
  "next.config.mjs",
  "drizzle.config.ts",
  "vercel.json",
  "postcss.config.js",
  "tailwind.config.js",
  "eslint.config.mjs",
  ".eslintrc.json",
  ".npmrc",
  ".nvmrc",
  "proxy.ts",
  "city-aliases.ts",
  "canonicalize.mjs",
  "validate.mjs",
  "verify.mjs",
];

function resolveBuildProvenanceEnv() {
  if (process.env.DCC_BUILD_PROVENANCE_CACHED === "1") {
    return {
      DCC_BUILD_GIT_COMMIT: process.env.DCC_BUILD_GIT_COMMIT || "unknown",
      DCC_BUILD_GIT_BRANCH: process.env.DCC_BUILD_GIT_BRANCH || "unknown",
      DCC_BUILD_DIRTY_STATUS: process.env.DCC_BUILD_DIRTY_STATUS || "unknown",
      DCC_BUILD_SOURCE_INSPECTION_AVAILABLE:
        process.env.DCC_BUILD_SOURCE_INSPECTION_AVAILABLE || "false",
      DCC_BUILD_MODIFIED_INPUTS: process.env.DCC_BUILD_MODIFIED_INPUTS || "null",
      DCC_BUILD_VERCEL_JSON_PROVENANCE:
        process.env.DCC_BUILD_VERCEL_JSON_PROVENANCE || "null",
      DCC_BUILD_NEXT_CONFIG_PROVENANCE:
        process.env.DCC_BUILD_NEXT_CONFIG_PROVENANCE || "null",
      DCC_BUILD_CHECKED_INPUTS:
        process.env.DCC_BUILD_CHECKED_INPUTS || CHECKED_BUILD_INPUT_PATHS.join(","),
      DCC_BUILD_LOCK_HASH: process.env.DCC_BUILD_LOCK_HASH || "unknown",
      DCC_BUILD_COMMITTED_ROOT_CONFIG_HASH:
        process.env.DCC_BUILD_COMMITTED_ROOT_CONFIG_HASH || "unknown",
      DCC_BUILD_EFFECTIVE_ROOT_CONFIG_HASH:
        process.env.DCC_BUILD_EFFECTIVE_ROOT_CONFIG_HASH || "unknown",
      DCC_BUILD_ROOT_CONFIG_HASH:
        process.env.DCC_BUILD_ROOT_CONFIG_HASH || "unknown",
      DCC_BUILD_MIGRATIONS_HASH: process.env.DCC_BUILD_MIGRATIONS_HASH || "unknown",
      DCC_BUILD_SCRIPTS_HASH: process.env.DCC_BUILD_SCRIPTS_HASH || "unknown",
      DCC_BUILD_TIME: process.env.DCC_BUILD_TIME || new Date().toISOString(),
      DCC_BUILD_ID: process.env.DCC_BUILD_ID || `build-${Date.now()}`,
    };
  }

  let gitCommit =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.DCC_BUILD_GIT_COMMIT?.trim() ||
    process.env.GITHUB_SHA?.trim() ||
    "";
  let gitBranch =
    process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
    process.env.DCC_BUILD_GIT_BRANCH?.trim() ||
    process.env.GITHUB_REF_NAME?.trim() ||
    "";
  let dirtySourceStatus = "unknown";
  let sourceInspectionAvailable = "false";
  let modifiedBuildInputs = null;
  let vercelJsonProvenance = null;
  let nextConfigProvenance = null;
  try {
    const liveHead = execSync("git rev-parse HEAD", {
      cwd: __dirname,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!gitCommit && liveHead) {
      gitCommit = liveHead;
    }
    if (!gitBranch) {
      gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd: __dirname,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    }
    vercelJsonProvenance = inspectVercelJsonPlatformTransformation(__dirname, liveHead);
    nextConfigProvenance = inspectNextConfigPlatformTransformation(__dirname);
    const existingBuildInputs = CHECKED_BUILD_INPUT_PATHS.filter((relPath) =>
      fs.existsSync(path.join(__dirname, relPath)),
    );
    const rawStatusLines = execSync(
      `git status --porcelain --untracked-files=no -- ${existingBuildInputs.join(" ")}`,
      {
        cwd: __dirname,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    )
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const dirtyLines = rawStatusLines.filter(
      (l) => !isStatusLineCleanAgainstHead(__dirname, l, liveHead),
    );
    modifiedBuildInputs = dirtyLines.map((l) =>
      l.replace(/^[A-Z?]+\s+/, "").trim().replace(/^"|"$/g, ""),
    );
    dirtySourceStatus = dirtyLines.length === 0 ? "clean" : "dirty";
    sourceInspectionAvailable = "true";
  } catch {
    dirtySourceStatus = "unknown";
    sourceInspectionAvailable = "false";
    modifiedBuildInputs = null;
    vercelJsonProvenance = inspectVercelJsonPlatformTransformation(__dirname);
    nextConfigProvenance = inspectNextConfigPlatformTransformation(__dirname);
  }

  let dependencyLockHash = process.env.DCC_BUILD_LOCK_HASH?.trim() || "unknown";
  let committedRootConfigHash =
    process.env.DCC_BUILD_COMMITTED_ROOT_CONFIG_HASH?.trim() || "unknown";
  let effectiveRootConfigHash =
    process.env.DCC_BUILD_EFFECTIVE_ROOT_CONFIG_HASH?.trim() || "unknown";
  let rootConfigHash = process.env.DCC_BUILD_ROOT_CONFIG_HASH?.trim() || "unknown";
  let migrationsHash = process.env.DCC_BUILD_MIGRATIONS_HASH?.trim() || "unknown";
  let scriptsHash = process.env.DCC_BUILD_SCRIPTS_HASH?.trim() || "unknown";
  try {
    const lockPath = path.join(__dirname, "package-lock.json");
    if (fs.existsSync(lockPath)) {
      dependencyLockHash = sha256HexNode(readNormalizedTextBytes(lockPath));
    }
    const computedCommittedRoot = hashCommittedHeadFilesDeterministic(
      __dirname,
      ROOT_CONFIG_INPUT_FILES,
    );
    if (computedCommittedRoot !== "unknown") {
      committedRootConfigHash = computedCommittedRoot;
    }
    const computedEffectiveRoot = hashEffectiveFilesDeterministic(
      __dirname,
      ROOT_CONFIG_INPUT_FILES,
    );
    if (computedEffectiveRoot !== "unknown") {
      effectiveRootConfigHash = computedEffectiveRoot;
      rootConfigHash = computedEffectiveRoot;
    }
    const computedMigrations = hashEffectiveFilesDeterministic(
      __dirname,
      listFilesRecursiveRel(__dirname, "drizzle"),
    );
    if (computedMigrations !== "unknown") {
      migrationsHash = computedMigrations;
    }
    const computedScripts = hashEffectiveFilesDeterministic(
      __dirname,
      listFilesRecursiveRel(__dirname, "scripts/dcc"),
    );
    if (computedScripts !== "unknown") {
      scriptsHash = computedScripts;
    }
  } catch {
    // ignore
  }

  const buildTime = new Date().toISOString();
  const buildId = `build-${gitCommit ? gitCommit.slice(0, 12) : Date.now()}`;
  const resolved = {
    DCC_BUILD_GIT_COMMIT: gitCommit || "unknown",
    DCC_BUILD_GIT_BRANCH: gitBranch || "unknown",
    DCC_BUILD_DIRTY_STATUS: dirtySourceStatus,
    DCC_BUILD_SOURCE_INSPECTION_AVAILABLE: sourceInspectionAvailable,
    DCC_BUILD_MODIFIED_INPUTS: JSON.stringify(modifiedBuildInputs),
    DCC_BUILD_VERCEL_JSON_PROVENANCE: JSON.stringify(vercelJsonProvenance),
    DCC_BUILD_NEXT_CONFIG_PROVENANCE: JSON.stringify(nextConfigProvenance),
    DCC_BUILD_CHECKED_INPUTS: CHECKED_BUILD_INPUT_PATHS.join(","),
    DCC_BUILD_LOCK_HASH: dependencyLockHash || "unknown",
    DCC_BUILD_COMMITTED_ROOT_CONFIG_HASH: committedRootConfigHash || "unknown",
    DCC_BUILD_EFFECTIVE_ROOT_CONFIG_HASH: effectiveRootConfigHash || "unknown",
    DCC_BUILD_ROOT_CONFIG_HASH: rootConfigHash || "unknown",
    DCC_BUILD_MIGRATIONS_HASH: migrationsHash || "unknown",
    DCC_BUILD_SCRIPTS_HASH: scriptsHash || "unknown",
    DCC_BUILD_TIME: buildTime,
    DCC_BUILD_ID: buildId,
    ...(process.env.DCC_CI_VERIFIED_COMMIT_SHA?.trim()
      ? { DCC_CI_VERIFIED_COMMIT_SHA: process.env.DCC_CI_VERIFIED_COMMIT_SHA.trim() }
      : {}),
    ...(process.env.DCC_CI_VERIFIED_RUN_ID?.trim()
      ? { DCC_CI_VERIFIED_RUN_ID: process.env.DCC_CI_VERIFIED_RUN_ID.trim() }
      : {}),
    ...(process.env.DCC_CI_VERIFIED_LOCK_HASH?.trim()
      ? { DCC_CI_VERIFIED_LOCK_HASH: process.env.DCC_CI_VERIFIED_LOCK_HASH.trim() }
      : {}),
  };
  for (const [k, v] of Object.entries(resolved)) {
    process.env[k] = v;
  }
  process.env.DCC_BUILD_PROVENANCE_CACHED = "1";
  console.log(
    `[dcc-build-provenance] commit=${resolved.DCC_BUILD_GIT_COMMIT.slice(0, 12)} dirty=${dirtySourceStatus} modified=${resolved.DCC_BUILD_MODIFIED_INPUTS} committedRootConfig=${resolved.DCC_BUILD_COMMITTED_ROOT_CONFIG_HASH.slice(0, 12)} effectiveRootConfig=${resolved.DCC_BUILD_EFFECTIVE_ROOT_CONFIG_HASH.slice(0, 12)} vercelJsonStatus=${vercelJsonProvenance?.status ?? "unknown"}`,
  );
  return resolved;
}

const buildProvenanceEnv = resolveBuildProvenanceEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: buildProvenanceEnv,
  turbopack: {
    root: __dirname,
  },
  outputFileTracingIncludes: {
    "/juneau": ["./data/viator-reviews/**/*"],
    "/ports/juneau": ["./data/viator-reviews/**/*"],
    "/alaska": ["./data/viator-reviews/**/*"],
    "/api/location/[lat]/[lng]": ["./data/viator-reviews/**/*"],
  },
  outputFileTracingExcludes: {
    "*": [
      "./scratch/**/*",
      "./apps/**/*",
      "./assets/raw/**/*",
      "./public/images/**/*",
      "./data/memory/snapshots/**/*",
      "./docs/**/*",
      "./tests/**/*",
      "./legacy_vault/**/*",
      "./*.log",
      "./tsconfig.tsbuildinfo",
    ],
    "/**": [
      "./scratch/**/*",
      "./apps/**/*",
      "./assets/raw/**/*",
      "./public/images/**/*",
      "./data/memory/snapshots/**/*",
      "./docs/**/*",
      "./tests/**/*",
      "./legacy_vault/**/*",
      "./*.log",
      "./tsconfig.tsbuildinfo",
    ],
  },
  generateBuildId: async () => {
    return buildProvenanceEnv.DCC_BUILD_ID;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.viator.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/internal/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const travelMarketCruiseDeskBase = "https://dcc-v1-cut-clean.vercel.app/dcc/cruise-ports";

    return {
      beforeFiles: [
        {
          source: "/dcc/cruise-ports/port-canaveral-orlando",
          destination: `${travelMarketCruiseDeskBase}/port-canaveral-orlando`,
        },
        {
          source: "/dcc/cruise-ports/port-canaveral-orlando/:path*",
          destination: `${travelMarketCruiseDeskBase}/port-canaveral-orlando/:path*`,
        },
        {
          source: "/dcc/cruise-ports/portmiami",
          destination: `${travelMarketCruiseDeskBase}/portmiami`,
        },
        {
          source: "/dcc/cruise-ports/portmiami/:path*",
          destination: `${travelMarketCruiseDeskBase}/portmiami/:path*`,
        },
        {
          source: "/dcc/cruise-ports/nassau",
          destination: `${travelMarketCruiseDeskBase}/nassau`,
        },
        {
          source: "/dcc/cruise-ports/nassau/:path*",
          destination: `${travelMarketCruiseDeskBase}/nassau/:path*`,
        },
        {
          source: "/dcc/cruise-ports/port-everglades-fort-lauderdale",
          destination: `${travelMarketCruiseDeskBase}/port-everglades-fort-lauderdale`,
        },
        {
          source: "/dcc/cruise-ports/port-everglades-fort-lauderdale/:path*",
          destination: `${travelMarketCruiseDeskBase}/port-everglades-fort-lauderdale/:path*`,
        },
      ],
    };
  },
  async redirects() {
    const satelliteRedirects = buildSatelliteRedirects();
    const citySatelliteRedirects = buildCitySatelliteRedirects();
    const runtimeRedirects = buildRuntimeRedirects();
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.welcometoneworleanstours.com" }],
        destination: "https://welcometoneworleanstours.com/:path*",
        permanent: true,
      },
      ...satelliteRedirects,
      ...citySatelliteRedirects,
      ...runtimeRedirects,
      {
        source: "/concert-shuttles",
        destination: "/transportation",
        permanent: false,
      },
      {
        source: "/.env",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/env",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/config.js",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/config.json",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/__env.js",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/@vite/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/wp-admin/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/wp-login/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/wp-content/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/phpmyadmin/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/.git/:path*",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/vegas/shows",
        destination: "/las-vegas/shows",
        permanent: false,
      },
      {
        source: "/vegas/shows/:path*",
        destination: "/las-vegas/shows/:path*",
        permanent: false,
      },
      {
        source: "/vegas/tours",
        destination: "/las-vegas/tours",
        permanent: false,
      },
      {
        source: "/vegas/tours/:path*",
        destination: "/las-vegas/tours/:path*",
        permanent: false,
      },
      {
        source: "/vegas/attractions",
        destination: "/las-vegas/attractions",
        permanent: false,
      },
      {
        source: "/vegas/attractions/:path*",
        destination: "/las-vegas/attractions/:path*",
        permanent: false,
      },
      {
        source: "/vegas/day-trips",
        destination: "/las-vegas/day-trips",
        permanent: false,
      },
      {
        source: "/vegas/day-trips/:path*",
        destination: "/las-vegas/day-trips/:path*",
        permanent: false,
      },
      {
        source: "/vegas/helicopter",
        destination: "/las-vegas/helicopter",
        permanent: false,
      },
      {
        source: "/vegas/helicopter/:path*",
        destination: "/las-vegas/helicopter/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv",
        destination: "/vegas",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/shows",
        destination: "/las-vegas/shows",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/shows/:path*",
        destination: "/las-vegas/shows/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/tours",
        destination: "/las-vegas/tours",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/tours/:path*",
        destination: "/las-vegas/tours/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/attractions",
        destination: "/las-vegas/attractions",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/attractions/:path*",
        destination: "/las-vegas/attractions/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/day-trips",
        destination: "/las-vegas/day-trips",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/day-trips/:path*",
        destination: "/las-vegas/day-trips/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/helicopter",
        destination: "/las-vegas/helicopter",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/helicopter/:path*",
        destination: "/las-vegas/helicopter/:path*",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/helicopter-tours",
        destination: "/las-vegas/helicopter-tours",
        permanent: false,
      },
      {
        source: "/las-vegas-nv/helicopter-tours/:path*",
        destination: "/las-vegas/helicopter-tours/:path*",
        permanent: false,
      },
      {
        source: "/:city/:lane(cruises|events|transport)",
        destination: "/nodes/:city?alive=:lane",
        permanent: false,
      },
    ];
  },
};
export default withWorkflow(nextConfig);
