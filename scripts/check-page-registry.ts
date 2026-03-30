import fs from "node:fs";
import path from "node:path";
import { pageRegistry, type PageOwner } from "@/data/page-registry";

const ROOT = process.cwd();
const PAGE_FILE_NAMES = new Set(["page.tsx", "page.ts"]);
const APP_SYSTEMS = [
  {
    system: "main",
    root: path.join(ROOT, "app"),
    owners: new Set<PageOwner>(["dcc", "parr", "internal"]),
  },
  {
    system: "wts",
    root: path.join(ROOT, "apps", "welcometotheswamp", "app"),
    owners: new Set<PageOwner>(["wts"]),
  },
] as const;

type Severity = "error" | "warn";

type Finding = {
  severity: Severity;
  code: string;
  message: string;
};

type LiveRoute = {
  system: (typeof APP_SYSTEMS)[number]["system"];
  path: string;
};

function toPosix(value: string) {
  return value.split(path.sep).join("/");
}

function shouldIgnoreSegment(segment: string) {
  return segment === "api" || segment.startsWith("(") || segment.startsWith("@");
}

function filePathToRoute(baseDir: string, filePath: string) {
  const relative = toPosix(path.relative(baseDir, filePath));
  const directory = path.posix.dirname(relative);
  const segments = directory === "." ? [] : directory.split("/").filter(Boolean).filter((segment) => !shouldIgnoreSegment(segment));
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function walkPages(dir: string, out: string[]) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "api") continue;
      walkPages(fullPath, out);
      continue;
    }
    if (PAGE_FILE_NAMES.has(entry.name)) {
      out.push(fullPath);
    }
  }
}

function collectLiveRoutes() {
  const liveRoutes: LiveRoute[] = [];

  for (const appSystem of APP_SYSTEMS) {
    const files: string[] = [];
    walkPages(appSystem.root, files);
    for (const filePath of files) {
      liveRoutes.push({ system: appSystem.system, path: filePathToRoute(appSystem.root, filePath) });
    }
  }

  return liveRoutes;
}

function ownerMatchesSystem(owner: PageOwner, system: LiveRoute["system"]) {
  const appSystem = APP_SYSTEMS.find((candidate) => candidate.system === system);
  return appSystem ? appSystem.owners.has(owner) : false;
}

function push(out: Finding[], severity: Severity, code: string, message: string) {
  out.push({ severity, code, message });
}

function main() {
  const findings: Finding[] = [];
  const liveRoutes = collectLiveRoutes();
  const liveRouteSet = new Set(liveRoutes.map((route) => `${route.system}:${route.path}`));

  for (const route of liveRoutes) {
    const matches = pageRegistry.filter((entry) => entry.path === route.path && ownerMatchesSystem(entry.owner, route.system));
    if (matches.length === 0) {
      push(findings, "error", "registry.route_missing", `Live route ${route.path} in ${route.system} has no page-registry entry.`);
    }
    if (matches.length > 1) {
      push(findings, "error", "registry.duplicate_classification", `Live route ${route.path} in ${route.system} matches ${matches.length} page-registry entries.`);
    }
  }

  for (const entry of pageRegistry) {
    const systems = APP_SYSTEMS.filter((candidate) => candidate.owners.has(entry.owner));
    const existsInAnySystem = systems.some((appSystem) => liveRouteSet.has(`${appSystem.system}:${entry.path}`));

    if (entry.status === "kill") {
      if (existsInAnySystem) {
        push(findings, "warn", "registry.kill_still_live", `Route ${entry.path} for owner ${entry.owner} is marked kill but still exists live.`);
      }
      continue;
    }

    if (!existsInAnySystem) {
      push(findings, "warn", "registry.entry_without_route", `Registry entry ${entry.path} for owner ${entry.owner} does not resolve to a shipped page route.`);
    }
  }

  const errors = findings.filter((item) => item.severity === "error");
  const warnings = findings.filter((item) => item.severity === "warn");
  const reviewCount = pageRegistry.filter((entry) => entry.status === "review").length;
  const scannerSeedCount = pageRegistry.filter((entry) => entry.discoveredFrom === "scanner").length;

  const summary = {
    ok: errors.length === 0,
    liveRoutes: liveRoutes.length,
    registryEntries: pageRegistry.length,
    reviewCount,
    scannerSeedCount,
    errors,
    warnings,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (errors.length > 0) process.exit(1);
}

main();
