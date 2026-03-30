import fs from "node:fs";
import path from "node:path";
import { pageRegistry, type PageLayer, type PageOwner, type PageRegistryEntry } from "@/data/page-registry";

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, "data", "page-registry.ts");
const PAGE_FILE_NAMES = new Set(["page.tsx", "page.ts"]);
const APP_SYSTEMS = [
  {
    system: "main",
    root: path.join(ROOT, "app"),
    owner: null,
  },
  {
    system: "wts",
    root: path.join(ROOT, "apps", "welcometotheswamp", "app"),
    owner: "wts" as const,
  },
] as const;

type SeededRoute = {
  system: (typeof APP_SYSTEMS)[number]["system"];
  path: `/${string}`;
  owner: PageOwner;
  layer: PageLayer;
};

function toPosix(value: string) {
  return value.split(path.sep).join("/");
}

function shouldIgnoreSegment(segment: string) {
  return segment === "api" || segment.startsWith("(") || segment.startsWith("@");
}

function filePathToRoute(baseDir: string, filePath: string): `/${string}` {
  const relative = toPosix(path.relative(baseDir, filePath));
  const directory = path.posix.dirname(relative);
  const segments = directory === "." ? [] : directory.split("/").filter(Boolean).filter((segment) => !shouldIgnoreSegment(segment));
  return (segments.length === 0 ? "/" : `/${segments.join("/")}`) as `/${string}`;
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

function inferOwner(system: SeededRoute["system"], routePath: string): PageOwner {
  if (system === "wts") return "wts";
  if (routePath.startsWith("/admin") || routePath.startsWith("/internal")) return "internal";
  if (routePath.startsWith("/book") || routePath.startsWith("/checkout") || routePath.startsWith("/pay-balance")) return "parr";
  return "dcc";
}

function inferLayer(owner: PageOwner, routePath: string): PageLayer {
  if (owner === "internal") return "ops";
  if (owner === "parr") return "act";
  if (routePath === "/plan") return "choose";
  return "unclassified";
}

function collectRoutes() {
  const routes: SeededRoute[] = [];
  for (const appSystem of APP_SYSTEMS) {
    const files: string[] = [];
    walkPages(appSystem.root, files);
    for (const filePath of files) {
      const routePath = filePathToRoute(appSystem.root, filePath);
      const owner = inferOwner(appSystem.system, routePath);
      routes.push({
        system: appSystem.system,
        path: routePath,
        owner,
        layer: inferLayer(owner, routePath),
      });
    }
  }
  return routes;
}

function toEntry(route: SeededRoute): PageRegistryEntry {
  return {
    path: route.path,
    layer: route.layer,
    owner: route.owner,
    status: "review",
    discoveredFrom: "scanner",
    successMetric: null,
    handoffTarget: null,
    surface: null,
    justification: "auto-seeded from route scan",
    notes: `auto-seeded from ${route.system} route scan`,
    reviewOwner: null,
    lastReviewedAt: null,
  };
}

function sortEntries(entries: PageRegistryEntry[]) {
  return [...entries].sort((a, b) => {
    if (a.owner !== b.owner) return a.owner.localeCompare(b.owner);
    return a.path.localeCompare(b.path);
  });
}

function serializeEntry(entry: PageRegistryEntry) {
  const lines: string[] = ["  {"];
  lines.push(`    path: ${JSON.stringify(entry.path)},`);
  lines.push(`    layer: ${JSON.stringify(entry.layer)},`);
  lines.push(`    owner: ${JSON.stringify(entry.owner)},`);
  lines.push(`    status: ${JSON.stringify(entry.status)},`);
  lines.push(`    discoveredFrom: ${JSON.stringify(entry.discoveredFrom)},`);
  lines.push(`    successMetric: ${entry.successMetric === null || entry.successMetric === undefined ? "null" : JSON.stringify(entry.successMetric)},`);
  lines.push(`    handoffTarget: ${entry.handoffTarget === null || entry.handoffTarget === undefined ? "null" : JSON.stringify(entry.handoffTarget)},`);
  lines.push(`    surface: ${entry.surface === null || entry.surface === undefined ? "null" : JSON.stringify(entry.surface)},`);
  if (entry.canonicalOf?.length) {
    lines.push(`    canonicalOf: [${entry.canonicalOf.map((item) => JSON.stringify(item)).join(", ")}],`);
  }
  lines.push(`    justification: ${JSON.stringify(entry.justification || "auto-seeded from route scan")},`);
  if (entry.notes) lines.push(`    notes: ${JSON.stringify(entry.notes)},`);
  lines.push(`    reviewOwner: ${entry.reviewOwner === null || entry.reviewOwner === undefined ? "null" : JSON.stringify(entry.reviewOwner)},`);
  lines.push(`    lastReviewedAt: ${entry.lastReviewedAt === null || entry.lastReviewedAt === undefined ? "null" : JSON.stringify(entry.lastReviewedAt)},`);
  lines.push("  },");
  return lines.join("\n");
}

function render(entries: PageRegistryEntry[]) {
  const body = sortEntries(entries).map(serializeEntry).join("\n");
  return `export const PAGE_LAYERS = ["understand", "choose", "act", "ops", "unclassified"] as const;
export const PAGE_OWNERS = ["dcc", "wts", "wta", "parr", "internal"] as const;
export const PAGE_STATUSES = ["canonical", "keep", "review", "redirect_pending", "kill"] as const;
export const PAGE_SURFACES = ["authority", "monetized", null] as const;
export const PAGE_DISCOVERED_FROM = ["manual", "scanner"] as const;

export type PageLayer = (typeof PAGE_LAYERS)[number];
export type PageOwner = (typeof PAGE_OWNERS)[number];
export type PageStatus = (typeof PAGE_STATUSES)[number];
export type PageSurface = (typeof PAGE_SURFACES)[number];
export type PageDiscoveredFrom = (typeof PAGE_DISCOVERED_FROM)[number];

export type PageRegistryEntry = {
  path: \`/\${string}\`;
  layer: PageLayer;
  owner: PageOwner;
  status: PageStatus;
  discoveredFrom: PageDiscoveredFrom;
  successMetric?: string | null;
  handoffTarget?: \`/\${string}\` | \`\${"https://" | "http://"}\${string}\` | null;
  surface?: PageSurface;
  justification?: string;
  canonicalOf?: readonly \`/\${string}\`[];
  notes?: string;
  reviewOwner?: string | null;
  lastReviewedAt?: string | null;
};

function definePageRegistry<const T extends readonly PageRegistryEntry[]>(entries: T) {
  return entries;
}

export const pageRegistry: readonly PageRegistryEntry[] = definePageRegistry([
${body}
] as const);

export function getPageRegistryEntry(path: string, owner?: PageOwner) {
  return pageRegistry.find((entry) => entry.path === path && (!owner || entry.owner === owner)) ?? null;
}

export function getPageRegistryByStatus(status: PageStatus) {
  return pageRegistry.filter((entry) => entry.status === status);
}

export function getPageRegistryByLayer(layer: PageLayer) {
  return pageRegistry.filter((entry) => entry.layer === layer);
}
`;
}

function main() {
  const existing = [...pageRegistry];
  const seen = new Set(existing.map((entry) => `${entry.owner}:${entry.path}`));
  const additions: PageRegistryEntry[] = [];

  for (const route of collectRoutes()) {
    const key = `${route.owner}:${route.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    additions.push(toEntry(route));
  }

  const merged = [...existing, ...additions];
  fs.writeFileSync(REGISTRY_PATH, render(merged), "utf8");

  const summary = {
    added: additions.length,
    total: merged.length,
    scannerSeedCount: merged.filter((entry) => entry.discoveredFrom === "scanner").length,
    reviewCount: merged.filter((entry) => entry.status === "review").length,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main();
