import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  NETWORK_NODE_REGISTRY,
  resolveNodeForRequest,
  type NetworkNodeId,
  type NetworkNodeResolutionReason,
} from "@/lib/network/nodes";

type RouteSource = "root-app" | "satellite-app";
type CurrentShell =
  | "dcc-root-chrome"
  | "dcc-root-suppressed-by-host-or-proxy"
  | "local-brand-shell"
  | "local-site-chrome"
  | "minimal-custom-layout"
  | "unknown";

export type NodeClassificationRoute = {
  routePath: string;
  projectApp: string;
  source: RouteSource;
  currentShell: CurrentShell;
  currentNode: NetworkNodeId | "unknown";
  shouldBeNode: NetworkNodeId;
  resolutionReason: NetworkNodeResolutionReason;
  dccChromeCorrect: boolean;
  brandShellNeeded: boolean;
  visualDrift: "none" | "possible" | "likely";
  notes: string[];
};

export type NodeClassificationDomain = {
  domain: string;
  nodeId: NetworkNodeId;
  displayName: string;
};

export type NodeClassificationReport = {
  version: "network-node-classification.v1";
  generatedAt: string;
  summary: {
    routeCount: number;
    domainCount: number;
    dccCoreRoutes: number;
    satelliteRoutes: number;
    legacyOrFallbackRoutes: number;
    satelliteRoutesLikelyInheritingDccChrome: number;
    fallbackRoutesLikelyInheritingDccChrome: number;
    dccRoutesNotUsingDccChrome: number;
  };
  domains: NodeClassificationDomain[];
  routes: NodeClassificationRoute[];
  findings: {
    dccPagesIncorrectlyThemed: NodeClassificationRoute[];
    satellitePagesInheritingDccChrome: NodeClassificationRoute[];
    fallbackRoutesNeedingNodeAssignment: NodeClassificationRoute[];
  };
};

const ROOT_APP = "app";
const APPS_ROOT = "apps";
const PAGE_FILE = "page.tsx";

function toPosix(value: string) {
  return value.split(path.sep).join("/");
}

function normalizeRoute(routePath: string) {
  if (!routePath || routePath === "/page.tsx") return "/";
  return routePath.length > 1 ? routePath.replace(/\/+$/, "") : "/";
}

function routePathFromPageFile(appRoot: string, filePath: string) {
  const relative = toPosix(path.relative(appRoot, filePath));
  const withoutPage = relative.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  return normalizeRoute(`/${withoutPage}`);
}

function walkPageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      files.push(...walkPageFiles(fullPath));
    } else if (entry.isFile() && entry.name === PAGE_FILE) {
      files.push(fullPath);
    }
  }

  return files;
}

function readIfExists(filePath: string) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function detectSatelliteLayoutShell(appName: string): CurrentShell {
  const layoutSource = readIfExists(path.join(process.cwd(), APPS_ROOT, appName, "app", "layout.tsx"));

  if (layoutSource.includes("SiteChrome")) return "local-site-chrome";
  if (layoutSource.includes("SiteHeader") || layoutSource.includes("SiteFooter") || layoutSource.includes("FooterContact")) {
    return "local-brand-shell";
  }
  if (layoutSource.includes("{children}")) return "minimal-custom-layout";
  return "unknown";
}

function currentShellForRootRoute(routePath: string): CurrentShell {
  if (routePath === "/new-orleans/tours") return "dcc-root-suppressed-by-host-or-proxy";
  if (routePath === "/sedona/jeep-tours") return "dcc-root-suppressed-by-host-or-proxy";
  return "dcc-root-chrome";
}

function currentNodeForShell(shell: CurrentShell, shouldBeNode: NetworkNodeId): NetworkNodeId | "unknown" {
  if (shell === "dcc-root-chrome") return "dcc";
  if (shell === "unknown") return "unknown";
  return shouldBeNode;
}

function routeNotes(route: {
  routePath: string;
  source: RouteSource;
  shell: CurrentShell;
  shouldBeNode: NetworkNodeId;
  resolutionReason: NetworkNodeResolutionReason;
}) {
  const notes: string[] = [];

  if (route.resolutionReason === "fallback") {
    notes.push("Route resolves to marketplace-generic fallback and should receive an explicit node assignment.");
  }

  if (route.source === "root-app" && route.shell === "dcc-root-chrome" && route.shouldBeNode !== "dcc") {
    notes.push("Root app route currently inherits DCC chrome but resolves to a satellite/customer node.");
  }

  if (route.source === "root-app" && route.routePath === "/somerset-wi") {
    notes.push("Somerset host suppression exists in layout, but direct DCC path still uses root chrome.");
  }

  if (route.source === "satellite-app" && route.shell === "minimal-custom-layout") {
    notes.push("Standalone app has no detected shared local header/footer shell.");
  }

  return notes;
}

function classifyRootRoutes(): NodeClassificationRoute[] {
  const appRoot = path.join(process.cwd(), ROOT_APP);

  return walkPageFiles(appRoot).map((filePath) => {
    const routePath = routePathFromPageFile(appRoot, filePath);
    const resolution = resolveNodeForRequest({ pathname: routePath });
    const shell = currentShellForRootRoute(routePath);
    const currentNode = currentNodeForShell(shell, resolution.nodeId);
    const dccChromeCorrect = resolution.nodeId === "dcc" && shell === "dcc-root-chrome";
    const brandShellNeeded = resolution.nodeId !== "dcc" && shell === "dcc-root-chrome";
    const visualDrift = brandShellNeeded || resolution.reason === "fallback" ? "likely" : "none";

    return {
      routePath,
      projectApp: "destinations-cc",
      source: "root-app",
      currentShell: shell,
      currentNode,
      shouldBeNode: resolution.nodeId,
      resolutionReason: resolution.reason,
      dccChromeCorrect,
      brandShellNeeded,
      visualDrift,
      notes: routeNotes({
        routePath,
        source: "root-app",
        shell,
        shouldBeNode: resolution.nodeId,
        resolutionReason: resolution.reason,
      }),
    };
  });
}

function classifySatelliteAppRoutes(): NodeClassificationRoute[] {
  const appsRoot = path.join(process.cwd(), APPS_ROOT);
  if (!fs.existsSync(appsRoot)) return [];

  return fs.readdirSync(appsRoot, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory()) return [];
    const appName = entry.name;
    const appRoot = path.join(appsRoot, appName, "app");
    const pageFiles = walkPageFiles(appRoot);
    const shell = detectSatelliteLayoutShell(appName);
    const appDomain = NETWORK_NODE_REGISTRY.find((node) => {
      if (node.id === "dcc" || node.id === "marketplace-generic") return false;
      return node.domains.some((domain) => domain.replace(/^www\./, "").includes(appName.replace(/^welcome-to-/, "")));
    })?.domains[0];

    return pageFiles.map((filePath) => {
      const routePath = routePathFromPageFile(appRoot, filePath);
      const resolution = resolveNodeForRequest({ host: appDomain, pathname: routePath });
      const shouldBeNode = appDomain ? resolution.nodeId : resolveStandaloneAppNode(appName);
      const dccChromeCorrect = false;
      const brandShellNeeded = shell === "minimal-custom-layout" || shell === "unknown";
      const visualDrift = brandShellNeeded ? "possible" : "none";

      return {
        routePath,
        projectApp: `apps/${appName}`,
        source: "satellite-app",
        currentShell: shell,
        currentNode: shouldBeNode,
        shouldBeNode,
        resolutionReason: appDomain ? resolution.reason : "fallback",
        dccChromeCorrect,
        brandShellNeeded,
        visualDrift,
        notes: routeNotes({
          routePath,
          source: "satellite-app",
          shell,
          shouldBeNode,
          resolutionReason: appDomain ? resolution.reason : "fallback",
        }),
      };
    });
  });
}

function resolveStandaloneAppNode(appName: string): NetworkNodeId {
  const direct: Record<string, NetworkNodeId> = {
    gosno: "gosno",
    juneauflightdeck: "jfd",
    laketahoe: "lake-tahoe",
    redrocksfastpass: "redrocksfastpass",
    saveonthestrip: "saveonthestrip",
    sedonajeep: "sedona-jeep",
    shuttleya: "shuttleya",
    welcometoneworleanstours: "wtonot",
    welcometothedells: "dells",
    welcometotheswamp: "wts",
  };

  return direct[appName] || "marketplace-generic";
}

function buildDomains(): NodeClassificationDomain[] {
  return NETWORK_NODE_REGISTRY.flatMap((node) =>
    node.domains.map((domain) => ({
      domain,
      nodeId: node.id,
      displayName: node.displayName,
    })),
  );
}

export function buildNodeClassificationReport(generatedAt = new Date().toISOString()): NodeClassificationReport {
  const routes = [...classifyRootRoutes(), ...classifySatelliteAppRoutes()].sort((a, b) =>
    `${a.projectApp}:${a.routePath}`.localeCompare(`${b.projectApp}:${b.routePath}`),
  );
  const domains = buildDomains().sort((a, b) => a.domain.localeCompare(b.domain));
  const dccPagesIncorrectlyThemed = routes.filter((route) => route.shouldBeNode === "dcc" && route.currentShell !== "dcc-root-chrome");
  const fallbackRoutesNeedingNodeAssignment = routes.filter((route) => route.resolutionReason === "fallback");
  const satellitePagesInheritingDccChrome = routes.filter(
    (route) =>
      route.shouldBeNode !== "dcc" &&
      route.shouldBeNode !== "marketplace-generic" &&
      route.currentShell === "dcc-root-chrome",
  );
  const fallbackPagesInheritingDccChrome = fallbackRoutesNeedingNodeAssignment.filter(
    (route) => route.currentShell === "dcc-root-chrome",
  );

  return {
    version: "network-node-classification.v1",
    generatedAt,
    summary: {
      routeCount: routes.length,
      domainCount: domains.length,
      dccCoreRoutes: routes.filter((route) => route.shouldBeNode === "dcc").length,
      satelliteRoutes: routes.filter((route) => route.shouldBeNode !== "dcc" && route.shouldBeNode !== "marketplace-generic").length,
      legacyOrFallbackRoutes: fallbackRoutesNeedingNodeAssignment.length,
      satelliteRoutesLikelyInheritingDccChrome: satellitePagesInheritingDccChrome.length,
      fallbackRoutesLikelyInheritingDccChrome: fallbackPagesInheritingDccChrome.length,
      dccRoutesNotUsingDccChrome: dccPagesIncorrectlyThemed.length,
    },
    domains,
    routes,
    findings: {
      dccPagesIncorrectlyThemed,
      satellitePagesInheritingDccChrome,
      fallbackRoutesNeedingNodeAssignment,
    },
  };
}

function toMarkdown(report: NodeClassificationReport) {
  const rows = report.routes
    .map((route) =>
      [
        route.projectApp,
        route.routePath,
        route.currentShell,
        route.currentNode,
        route.shouldBeNode,
        route.dccChromeCorrect ? "yes" : "no",
        route.brandShellNeeded ? "yes" : "no",
        route.visualDrift,
      ].join(" | "),
    )
    .join("\n");

  return [
    "# Network Node Classification",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Routes: ${report.summary.routeCount}`,
    `- Domains: ${report.summary.domainCount}`,
    `- DCC core routes: ${report.summary.dccCoreRoutes}`,
    `- Satellite/customer routes: ${report.summary.satelliteRoutes}`,
    `- Legacy/fallback routes needing node assignment: ${report.summary.legacyOrFallbackRoutes}`,
    `- Satellite routes likely inheriting DCC chrome: ${report.summary.satelliteRoutesLikelyInheritingDccChrome}`,
    `- Fallback routes likely inheriting DCC chrome: ${report.summary.fallbackRoutesLikelyInheritingDccChrome}`,
    "",
    "## Routes",
    "",
    "Project | Route | Current shell | Current node | Should-be node | DCC chrome correct | BrandShell needed | Drift",
    "--- | --- | --- | --- | --- | --- | --- | ---",
    rows,
    "",
  ].join("\n");
}

function main() {
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);
  const report = buildNodeClassificationReport();
  const outDirArg = rawArgs.find((arg) => arg.startsWith("--out-dir="));

  if (outDirArg) {
    const outDir = path.resolve(process.cwd(), outDirArg.replace("--out-dir=", ""));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "node-classification.v1.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
    fs.writeFileSync(path.join(outDir, "node-classification.v1.md"), toMarkdown(report), "utf8");
    console.log(
      JSON.stringify(
        {
          ok: true,
          output: {
            json: path.join(outDir, "node-classification.v1.json"),
            markdown: path.join(outDir, "node-classification.v1.md"),
          },
          summary: report.summary,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (args.has("--markdown")) {
    console.log(toMarkdown(report));
    return;
  }

  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
