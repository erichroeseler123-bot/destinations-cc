#!/usr/bin/env node
/**
 * Canonical Machine-Readable Fleet Public-Route & Booking-Action Inventory Generator
 * (`scripts/governance/generate-fleet-route-inventory.mjs`)
 *
 * Read-only scanner across the 11 owned production properties + isolated partner metadata
 * for Welcome to Alaska Tours (`wta-rc-2026-11-10` via `git ls-tree -r origin/main`).
 *
 * Outputs `data/governance/public-route-inventory.v1.json`.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DCC_REPO_ROOT = path.resolve(__dirname, "../..");
const SCRATCH_ROOT = path.resolve(DCC_REPO_ROOT, "..");

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function walkFiles(dir, base = "") {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const results = [];
  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === ".git" ||
      entry.name === ".turbo" ||
      entry.name === ".swc"
    ) {
      continue;
    }
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, rel));
    } else if (entry.isFile()) {
      results.push(rel);
    }
  }
  return results;
}

/**
 * Convert a Next.js App Router relative file path (inside `app` or `src/app`)
 * into a canonical public URL route pattern.
 */
function appFileToRoutePattern(relPathInApp) {
  const parts = relPathInApp.split("/");
  const fileName = parts[parts.length - 1];
  const dirParts = parts
    .slice(0, -1)
    // Strip Next.js route groups `(group)` and parallel slots `@slot`
    .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")) && !seg.startsWith("@"));

  if (/^sitemap\.(tsx?|jsx?|mjs|js)$/.test(fileName)) {
    return "/" + [...dirParts, "sitemap.xml"].join("/");
  }
  if (/^robots\.(tsx?|jsx?|mjs|js)$/.test(fileName)) {
    return "/" + [...dirParts, "robots.txt"].join("/");
  }

  // page.tsx / page.jsx / route.ts / route.js
  if (dirParts.length === 0) {
    return "/";
  }
  return "/" + dirParts.join("/");
}

/**
 * Convert a Next.js Pages Router relative file path (inside `pages` or `src/pages`)
 * into a canonical URL route pattern.
 */
function pagesFileToRoutePattern(relPathInPages) {
  const withoutExt = relPathInPages.replace(/\.(tsx?|jsx?|mjs|js)$/, "");
  if (
    withoutExt === "_app" ||
    withoutExt === "_document" ||
    withoutExt === "_error" ||
    withoutExt === "404" ||
    withoutExt === "500"
  ) {
    return null;
  }
  if (withoutExt === "index") return "/";
  if (withoutExt.endsWith("/index")) {
    return "/" + withoutExt.slice(0, -"/index".length);
  }
  return "/" + withoutExt;
}

/**
 * Deterministically classify a discovered route into one of the 4 canonical North Star kinds
 * (`public_page`, `machine_contract`, `booking_or_handoff_action`, `order_lookup`),
 * returning `null` for internal/admin/cron/auth/non-public utility endpoints.
 */
function classifyAppRoute(relPathInApp, routePattern) {
  const fileName = path.posix.basename(relPathInApp);
  const isPage = /^page\.(tsx?|jsx?)$/.test(fileName);
  const isMetadataFile = /^(sitemap|robots)\.(tsx?|jsx?|mjs|js)$/.test(fileName);
  const isRouteHandler = /^route\.(tsx?|jsx?|mjs|js)$/.test(fileName);

  if (!isPage && !isMetadataFile && !isRouteHandler) {
    return null;
  }

  // 1. Metadata & Machine Contracts (`sitemap`, `robots`, `.well-known`, `agent.json`, `llms*.txt`, `openapi.json`, `scope.json`, `network/graph.json`, `dcc-site-contract.schema.json`)
  if (isMetadataFile) {
    return "machine_contract";
  }

  if (isRouteHandler) {
    // Exclude workflow runtime internals before `.well-known` check
    if (routePattern.startsWith("/.well-known/workflow/")) {
      return null;
    }

    if (
      routePattern.startsWith("/.well-known/") ||
      routePattern === "/.well-known" ||
      routePattern.endsWith("/agent.json") ||
      routePattern === "/agent.json" ||
      routePattern.endsWith("/llms.txt") ||
      routePattern.endsWith("/llms-full.txt") ||
      routePattern === "/llms.txt" ||
      routePattern === "/llms-full.txt" ||
      routePattern.endsWith("/sitemap.xml") ||
      routePattern.endsWith("/locations-sitemap.xml") ||
      routePattern.endsWith("/robots.txt") ||
      routePattern === "/openapi.json" ||
      routePattern === "/scope.json" ||
      routePattern === "/dcc-site-contract.schema.json" ||
      routePattern === "/network/graph.json" ||
      routePattern.startsWith("/data/sports-") ||
      routePattern === "/api/v1/mcp" ||
      routePattern === "/api/v1/travel-graph/evaluate" ||
      routePattern === "/api/v1/applicability/evaluate" ||
      routePattern === "/api/v1/tours/catalog" ||
      routePattern === "/api/v1/tours/match"
    ) {
      return "machine_contract";
    }

    // Exclude internal/admin/cron/webhook/debug/auth/QR/media binary routes from public booking/machine inventory
    if (
      routePattern.startsWith("/admin/") ||
      routePattern.startsWith("/api/admin/") ||
      routePattern.includes("/admin") ||
      routePattern.startsWith("/api/internal/") ||
      routePattern.startsWith("/api/cron/") ||
      routePattern.startsWith("/api/auth/") ||
      routePattern.startsWith("/api/mock/") ||
      routePattern.includes("/webhooks/") ||
      routePattern.endsWith("/env-check") ||
      routePattern.startsWith("/manager/") ||
      routePattern.endsWith("/qr") ||
      routePattern.startsWith("/media/")
    ) {
      return null;
    }

    // Order lookup / receipt / trip status / signed receipt routes
    if (
      /^\/api\/orders\/\[[^\]]+\]$/.test(routePattern) ||
      routePattern === "/api/my-trips" ||
      routePattern === "/api/receipt" ||
      routePattern === "/api/pay-balance" ||
      routePattern === "/api/booking/[token]/cancel" ||
      routePattern === "/api/bookings/cancel" ||
      /^\/octo\/bookings\/\[[^\]]+\]$/.test(routePattern) ||
      /^\/api\/octo\/bookings\/\[[^\]]+\]$/.test(routePattern) ||
      routePattern.startsWith("/r/")
    ) {
      return "order_lookup";
    }

    // Established booking, checkout, handoff, quote, waitlist, or inquiry routes
    if (
      routePattern.startsWith("/go/") ||
      routePattern.startsWith("/out/") ||
      routePattern.startsWith("/handoff/") ||
      routePattern.startsWith("/pay") ||
      routePattern.startsWith("/octo/") ||
      routePattern.startsWith("/api/octo/") ||
      routePattern === "/api/orders/checkout" ||
      routePattern === "/api/square/create-payment" ||
      routePattern === "/api/square/pay-balance" ||
      routePattern === "/api/stripe/create-intent" ||
      routePattern === "/api/stripe/finalize" ||
      routePattern === "/api/checkout/promo" ||
      routePattern === "/api/quote" ||
      routePattern === "/api/somerset/quote" ||
      routePattern === "/api/availability" ||
      routePattern === "/api/availability/confirm" ||
      routePattern === "/api/transport/availability" ||
      routePattern === "/api/dcc/viator/availability" ||
      routePattern === "/api/dcc/viator/link" ||
      routePattern.startsWith("/api/big-sky/") ||
      routePattern.startsWith("/api/private/") ||
      routePattern.startsWith("/api/shared/") ||
      routePattern.startsWith("/api/fareharbor/") ||
      routePattern === "/api/booking-clicks" ||
      routePattern === "/api/dcc-handoff" ||
      routePattern === "/api/excursions/handoff" ||
      routePattern === "/api/group-inquiries" ||
      routePattern === "/api/inquiries" ||
      routePattern === "/api/help-request" ||
      routePattern === "/api/request-invite" ||
      routePattern.startsWith("/api/waitlist") ||
      routePattern.startsWith("/api/public/helicopter-watch") ||
      routePattern === "/api/operators/onboarding" ||
      routePattern === "/api/partners/direct-operators/apply" ||
      routePattern === "/api/cruise/hosted/[shareCode]/handoff" ||
      routePattern === "/api/v1/commerce/click-attribution" ||
      routePattern === "/api/v1/commerce/handoffs" ||
      routePattern === "/api/v1/commerce/handoffs/revalidate" ||
      routePattern === "/api/v1/commerce/outcomes" ||
      routePattern === "/api/v1/commerce/affiliates/wta" ||
      routePattern === "/api/affiliate/dcc-referral" ||
      routePattern === "/api/ask-dcc" ||
      routePattern === "/juneau/replan" ||
      routePattern === "/new-orleans/guides/tour-catalog"
    ) {
      return "booking_or_handoff_action";
    }

    // Legacy catch-all public content route handlers (e.g. GoSno /cripple-creek, DCC /cruise-ports/[marketSlug])
    if (!routePattern.startsWith("/api/") && routePattern !== "/favicon.ico") {
      return "public_page";
    }

    return null;
  }

  // Page routes (`page.tsx` / `page.jsx`)
  if (isPage) {
    // Exclude non-public admin/internal/manager pages
    if (
      routePattern === "/admin" ||
      routePattern.startsWith("/admin/") ||
      routePattern === "/internal" ||
      routePattern.startsWith("/internal/") ||
      routePattern.includes("/admin/") ||
      routePattern.endsWith("/internal-qa") ||
      routePattern.startsWith("/manager/")
    ) {
      return null;
    }

    // Customer-accessible order lookup / balance / confirmation routes
    if (
      routePattern === "/my-trips" ||
      routePattern.startsWith("/pay-balance/") ||
      routePattern === "/booking" ||
      routePattern.startsWith("/booking/") ||
      routePattern === "/checkout/octo/[bookingId]" ||
      routePattern === "/checkout/success" ||
      routePattern.endsWith("/shared/success")
    ) {
      return "order_lookup";
    }

    return "public_page";
  }

  return null;
}

const OWNED_PROPERTIES = [
  {
    propertyId: "destinations-cc",
    canonicalDomain: "destinationcommandcenter.com",
    ownership: "owned",
    repoRoot: DCC_REPO_ROOT,
    repoLabel: "dcc-track12-2026-11-11",
    appDirs: ["app"],
    pagesDirs: ["pages", "src/pages"],
  },
  {
    propertyId: "cruisepromenade",
    canonicalDomain: "cruisepromenade.com",
    ownership: "owned",
    repoRoot: path.join(SCRATCH_ROOT, "cp-pilot10-2026-11-11"),
    repoLabel: "cp-pilot10-2026-11-11",
    appDirs: ["src/app", "app"],
    pagesDirs: ["pages", "src/pages"],
  },
  {
    propertyId: "rollcallusa",
    canonicalDomain: "rollcallusa.com",
    ownership: "owned",
    repoRoot: path.join(SCRATCH_ROOT, "rc-cruise-2026-11-10"),
    repoLabel: "rc-cruise-2026-11-10",
    appDirs: ["src/app", "app"],
    pagesDirs: ["pages", "src/pages"],
  },
  {
    propertyId: "last-frontier-shore-excursions",
    canonicalDomain: "lastfrontiershoreexcursions.com",
    ownership: "owned",
    repoRoot: DCC_REPO_ROOT,
    repoLabel: "dcc-track12-2026-11-11/apps/last-frontier-shore-excursions",
    appDirs: ["apps/last-frontier-shore-excursions/app"],
    pagesDirs: ["apps/last-frontier-shore-excursions/pages"],
  },
  {
    propertyId: "juneauflightdeck",
    canonicalDomain: "juneauflightdeck.com",
    ownership: "owned",
    repoRoot: DCC_REPO_ROOT,
    repoLabel: "dcc-track12-2026-11-11/apps/juneauflightdeck",
    appDirs: ["apps/juneauflightdeck/app"],
    pagesDirs: ["apps/juneauflightdeck/pages"],
  },
  {
    propertyId: "welcometoneworleanstours",
    canonicalDomain: "welcometoneworleanstours.com",
    ownership: "owned",
    repoRoot: DCC_REPO_ROOT,
    repoLabel: "dcc-track12-2026-11-11/apps/welcometoneworleanstours",
    appDirs: ["apps/welcometoneworleanstours/app"],
    pagesDirs: ["apps/welcometoneworleanstours/pages"],
  },
  {
    propertyId: "welcometotheswamp",
    canonicalDomain: "welcometotheswamp.com",
    ownership: "owned",
    repoRoot: DCC_REPO_ROOT,
    repoLabel: "dcc-track12-2026-11-11/apps/welcometotheswamp",
    appDirs: ["apps/welcometotheswamp/app"],
    pagesDirs: ["apps/welcometotheswamp/pages"],
  },
  {
    propertyId: "welcometothedells",
    canonicalDomain: "welcometothedells.com",
    ownership: "owned",
    repoRoot: DCC_REPO_ROOT,
    repoLabel: "dcc-track12-2026-11-11/apps/welcometothedells",
    appDirs: ["apps/welcometothedells/app"],
    pagesDirs: ["apps/welcometothedells/pages"],
  },
  {
    propertyId: "saveonthestrip",
    canonicalDomain: "saveonthestrip.com",
    ownership: "owned",
    repoRoot: DCC_REPO_ROOT,
    repoLabel: "dcc-track12-2026-11-11/apps/saveonthestrip",
    appDirs: ["apps/saveonthestrip/app"],
    pagesDirs: ["apps/saveonthestrip/pages"],
  },
  {
    propertyId: "gosno",
    canonicalDomain: "gosno.co",
    ownership: "owned",
    repoRoot: path.join(SCRATCH_ROOT, "gosno-track12-2026-11-11"),
    repoLabel: "gosno-track12-2026-11-11",
    appDirs: ["src/app", "app"],
    pagesDirs: ["pages", "src/pages"],
  },
  {
    propertyId: "partyatredrocks",
    canonicalDomain: "partyatredrocks.com",
    ownership: "owned",
    repoRoot: path.join(SCRATCH_ROOT, "parr-track12-2026-11-11"),
    repoLabel: "parr-track12-2026-11-11",
    appDirs: ["app", "src/app"],
    pagesDirs: ["pages", "src/pages"],
  },
];

function summarizeRoutes(routes) {
  const counts = {
    total: routes.length,
    public_page: 0,
    machine_contract: 0,
    booking_or_handoff_action: 0,
    order_lookup: 0,
  };
  for (const r of routes) {
    counts[r.kind] = (counts[r.kind] || 0) + 1;
  }
  return counts;
}

function scanOwnedProperty(prop) {
  const routes = [];
  const seenKeys = new Set();

  for (const appDirRel of prop.appDirs) {
    const absAppDir = path.join(prop.repoRoot, appDirRel);
    if (!fs.existsSync(absAppDir)) continue;
    const files = walkFiles(absAppDir);
    for (const relInApp of files) {
      const routePattern = appFileToRoutePattern(relInApp);
      const kind = classifyAppRoute(relInApp, routePattern);
      if (!kind) continue;
      const sourceFile = `${toPosix(appDirRel)}/${relInApp}`;
      const dedupeKey = `${kind}:${routePattern}:${sourceFile}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);
      routes.push({
        routePattern,
        sourceFile,
        kind,
      });
    }
  }

  for (const pagesDirRel of prop.pagesDirs) {
    const absPagesDir = path.join(prop.repoRoot, pagesDirRel);
    if (!fs.existsSync(absPagesDir)) continue;
    const files = walkFiles(absPagesDir);
    for (const relInPages of files) {
      if (!/\.(tsx?|jsx?)$/.test(relInPages)) continue;
      const routePattern = pagesFileToRoutePattern(relInPages);
      if (!routePattern) continue;
      const kind = routePattern.startsWith("/api/")
        ? classifyAppRoute(`${relInPages.replace(/\.(tsx?|jsx?)$/, "")}/route.ts`, routePattern)
        : "public_page";
      if (!kind) continue;
      const sourceFile = `${toPosix(pagesDirRel)}/${relInPages}`;
      const dedupeKey = `${kind}:${routePattern}:${sourceFile}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);
      routes.push({
        routePattern,
        sourceFile,
        kind,
      });
    }
  }

  // Also check static public machine contracts (`public/robots.txt`, `public/sitemap.xml`, `public/.well-known/*`, `public/llms.txt`) if not already covered by App Router
  const subAppPrefix = prop.appDirs[0].endsWith("/app") && prop.appDirs[0].startsWith("apps/")
    ? prop.appDirs[0].slice(0, -"/app".length)
    : "";
  const pubDirRel = subAppPrefix ? `${subAppPrefix}/public` : "public";
  const absPubDir = path.join(prop.repoRoot, pubDirRel);
  if (fs.existsSync(absPubDir)) {
    const pubFiles = walkFiles(absPubDir);
    for (const relPub of pubFiles) {
      if (
        relPub === "robots.txt" ||
        relPub === "sitemap.xml" ||
        relPub === "big-sky-sitemap.xml" ||
        relPub === "llms.txt" ||
        relPub === "agent.json" ||
        relPub.startsWith(".well-known/")
      ) {
        const routePattern = `/${relPub}`;
        const alreadyCovered = routes.some(
          (r) => r.routePattern === routePattern && r.kind === "machine_contract",
        );
        if (!alreadyCovered) {
          routes.push({
            routePattern,
            sourceFile: `${pubDirRel}/${relPub}`,
            kind: "machine_contract",
          });
        }
      }
    }
  }

  routes.sort((a, b) =>
    a.routePattern.localeCompare(b.routePattern) || a.sourceFile.localeCompare(b.sourceFile),
  );

  return {
    propertyId: prop.propertyId,
    canonicalDomain: prop.canonicalDomain,
    ownership: prop.ownership,
    repoLabel: prop.repoLabel,
    consolidationRedirectsForbiddenWithoutAgreement: true,
    counts: summarizeRoutes(routes),
    routes,
  };
}

function scanWtaPartnerGitTree() {
  const wtaRepoRoot = path.join(SCRATCH_ROOT, "wta-rc-2026-11-10");
  const gitOut = execSync("git ls-tree -r origin/main --name-only", {
    cwd: wtaRepoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const treeCommit = execSync("git rev-parse origin/main", {
    cwd: wtaRepoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

  const allFiles = gitOut
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();

  const routes = [];
  for (const filePath of allFiles) {
    if (!filePath.startsWith("app/")) continue;
    const relInApp = filePath.slice("app/".length);
    const routePattern = appFileToRoutePattern(relInApp);
    const kind = classifyAppRoute(relInApp, routePattern);
    if (!kind) continue;
    routes.push({
      routePattern,
      sourceFile: filePath,
      kind,
    });
  }

  routes.sort((a, b) =>
    a.routePattern.localeCompare(b.routePattern) || a.sourceFile.localeCompare(b.sourceFile),
  );

  return {
    propertyId: "welcometoalaskatours",
    canonicalDomain: "welcometoalaskatours.com",
    ownership: "independent_partner",
    isOwnedByDcc: false,
    consumerTrafficLinkingAllowed: false,
    consolidationRedirectsForbiddenWithoutAgreement: true,
    repoLabel: "wta-rc-2026-11-10",
    gitRef: "origin/main",
    gitCommit: treeCommit,
    counts: summarizeRoutes(routes),
    routes,
  };
}

export function generateFleetRouteInventory() {
  const ownedRecords = OWNED_PROPERTIES.map((prop) => scanOwnedProperty(prop));
  const wtaPartnerRecord = scanWtaPartnerGitTree();
  const allProperties = [...ownedRecords, wtaPartnerRecord];

  const fleetTotals = {
    ownedPropertyCount: ownedRecords.length,
    isolatedPartnerPropertyCount: 1,
    totalPropertiesRecorded: allProperties.length,
    ownedRoutesTotal: 0,
    ownedPublicPages: 0,
    ownedMachineContracts: 0,
    ownedBookingOrHandoffActions: 0,
    ownedOrderLookupRoutes: 0,
    partnerIsolatedRoutesTotal: wtaPartnerRecord.counts.total,
    grandTotalRecordedRoutes: 0,
  };

  for (const rec of ownedRecords) {
    fleetTotals.ownedRoutesTotal += rec.counts.total;
    fleetTotals.ownedPublicPages += rec.counts.public_page;
    fleetTotals.ownedMachineContracts += rec.counts.machine_contract;
    fleetTotals.ownedBookingOrHandoffActions += rec.counts.booking_or_handoff_action;
    fleetTotals.ownedOrderLookupRoutes += rec.counts.order_lookup;
  }
  fleetTotals.grandTotalRecordedRoutes =
    fleetTotals.ownedRoutesTotal + fleetTotals.partnerIsolatedRoutesTotal;

  return {
    schemaVersion: "public-route-inventory.v1",
    authorityDocument: "NORTH_STAR_VISION.md",
    lockedDate: "2026-11-11",
    policy: {
      noPublicPageDeletionAllowed: true,
      destructiveRedirectsForbiddenWithoutOwnerApproval: true,
      wtaConsolidationRedirectsForbiddenWithoutPartnerAgreement: true,
    },
    fleetTotals,
    properties: allProperties,
  };
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  const inventory = generateFleetRouteInventory();
  const outPath = path.join(DCC_REPO_ROOT, "data/governance/public-route-inventory.v1.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(inventory, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
  for (const prop of inventory.properties) {
    console.log(
      `  ${prop.propertyId} (${prop.ownership}): total=${prop.counts.total} [public_page=${prop.counts.public_page}, machine_contract=${prop.counts.machine_contract}, booking_or_handoff_action=${prop.counts.booking_or_handoff_action}, order_lookup=${prop.counts.order_lookup}]`,
    );
  }
  console.log("Fleet totals:", JSON.stringify(inventory.fleetTotals));
}
