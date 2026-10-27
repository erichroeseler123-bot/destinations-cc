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

function hashFilesDeterministic(baseDir, relPaths) {
  const hash = crypto.createHash("sha256");
  let count = 0;
  for (const rel of [...relPaths].sort()) {
    const full = path.join(baseDir, rel);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      hash.update(`${rel}\0`);
      hash.update(fs.readFileSync(full));
      hash.update("\0");
      count += 1;
    }
  }
  return count > 0 ? hash.digest("hex") : "unavailable";
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

function resolveBuildProvenanceEnv() {
  let gitCommit =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GITHUB_SHA?.trim() ||
    "";
  let gitBranch =
    process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
    process.env.GITHUB_REF_NAME?.trim() ||
    "";
  let dirtySourceStatus = "unknown";
  let sourceInspectionAvailable = "false";
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
    const existingBuildInputs = CHECKED_BUILD_INPUT_PATHS.filter((relPath) =>
      fs.existsSync(path.join(__dirname, relPath)),
    );
    const statusLines = execSync(
      `git status --porcelain --untracked-files=no -- ${existingBuildInputs.join(" ")}`,
      {
        cwd: __dirname,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    )
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(
        (l) =>
          l.length > 0 &&
          !/^D\s+(legacy_vault|scratch|data\/sources\/geonames|\.open-next|\.wrangler)\//.test(l),
      );
    dirtySourceStatus = statusLines.length === 0 ? "clean" : "dirty";
    sourceInspectionAvailable = "true";
  } catch {
    dirtySourceStatus = "unknown";
    sourceInspectionAvailable = "false";
  }

  let dependencyLockHash = "unavailable";
  let rootConfigHash = "unavailable";
  let migrationsHash = "unavailable";
  let scriptsHash = "unavailable";
  try {
    const lockPath = path.join(__dirname, "package-lock.json");
    if (fs.existsSync(lockPath)) {
      dependencyLockHash = crypto
        .createHash("sha256")
        .update(fs.readFileSync(lockPath))
        .digest("hex");
    }
    rootConfigHash = hashFilesDeterministic(__dirname, [
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
    ]);
    migrationsHash = hashFilesDeterministic(
      __dirname,
      listFilesRecursiveRel(__dirname, "drizzle"),
    );
    scriptsHash = hashFilesDeterministic(
      __dirname,
      listFilesRecursiveRel(__dirname, "scripts/dcc"),
    );
  } catch {
    // ignore
  }

  const buildTime = new Date().toISOString();
  const buildId = `build-${gitCommit ? gitCommit.slice(0, 12) : Date.now()}`;
  return {
    DCC_BUILD_GIT_COMMIT: gitCommit || "unknown",
    DCC_BUILD_GIT_BRANCH: gitBranch || "unknown",
    DCC_BUILD_DIRTY_STATUS: dirtySourceStatus,
    DCC_BUILD_SOURCE_INSPECTION_AVAILABLE: sourceInspectionAvailable,
    DCC_BUILD_CHECKED_INPUTS: CHECKED_BUILD_INPUT_PATHS.join(","),
    DCC_BUILD_LOCK_HASH: dependencyLockHash || "unavailable",
    DCC_BUILD_ROOT_CONFIG_HASH: rootConfigHash || "unavailable",
    DCC_BUILD_MIGRATIONS_HASH: migrationsHash || "unavailable",
    DCC_BUILD_SCRIPTS_HASH: scriptsHash || "unavailable",
    DCC_BUILD_TIME: buildTime,
    DCC_BUILD_ID: buildId,
  };
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
