import fs from "node:fs";
import path from "node:path";
import { pageRegistry } from "@/data/page-registry";
import { buildParrSharedRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

const ROOT = process.cwd();
const CANONICAL_SHARED_URL = "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared";

type Severity = "error" | "warn";

type Finding = {
  severity: Severity;
  code: string;
  message: string;
};

type ClusterPageConfig = {
  route: string;
  file: string;
  alias: string;
  role: "hub" | "feeder";
  expectedRegistryTarget: string;
  requiredUrlCtas: string[];
  requiredTelemetryCtas: string[];
  minParrCtaLinks: number;
  requireHubFallback: boolean;
};

const RED_ROCKS_CLUSTER = {
  id: "redRocksTransport",
  hubRoute: "/red-rocks-transportation",
  pages: [
    {
      route: "/red-rocks-transportation",
      file: "app/red-rocks-transportation/page.tsx",
      alias: "rr-transportation",
      role: "hub",
      expectedRegistryTarget: CANONICAL_SHARED_URL,
      requiredUrlCtas: ["primary", "notice-primary"],
      requiredTelemetryCtas: ["notice-primary"],
      minParrCtaLinks: 1,
      requireHubFallback: false,
    },
    {
      route: "/red-rocks-shuttle-vs-uber",
      file: "app/red-rocks-shuttle-vs-uber/page.tsx",
      alias: "rr-shuttle-vs-uber",
      role: "feeder",
      expectedRegistryTarget: "/red-rocks-transportation",
      requiredUrlCtas: ["primary", "recommendation-primary"],
      requiredTelemetryCtas: ["primary", "recommendation-primary"],
      minParrCtaLinks: 2,
      requireHubFallback: true,
    },
    {
      route: "/how-to-get-to-red-rocks-without-parking-hassle",
      file: "app/how-to-get-to-red-rocks-without-parking-hassle/page.tsx",
      alias: "rr-no-parking",
      role: "feeder",
      expectedRegistryTarget: "/red-rocks-transportation",
      requiredUrlCtas: ["primary", "recommendation-primary"],
      requiredTelemetryCtas: ["primary", "recommendation-primary"],
      minParrCtaLinks: 2,
      requireHubFallback: true,
    },
    {
      route: "/best-way-to-leave-red-rocks",
      file: "app/best-way-to-leave-red-rocks/page.tsx",
      alias: "rr-leave",
      role: "feeder",
      expectedRegistryTarget: "/red-rocks-transportation",
      requiredUrlCtas: ["primary", "recommendation-primary"],
      requiredTelemetryCtas: ["primary", "recommendation-primary"],
      minParrCtaLinks: 2,
      requireHubFallback: true,
    },
  ] satisfies ClusterPageConfig[],
};

function push(findings: Finding[], severity: Severity, code: string, message: string) {
  findings.push({ severity, code, message });
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function countMatches(content: string, pattern: RegExp) {
  return [...content.matchAll(pattern)].length;
}

function getRegistryEntry(route: string) {
  return pageRegistry.find((entry) => entry.path === route);
}

function validateRegistry(config: ClusterPageConfig, findings: Finding[]) {
  const entry = getRegistryEntry(config.route);
  if (!entry) {
    push(findings, "error", "cluster.registry_missing", `${config.route} is missing from pageRegistry.`);
    return;
  }

  if (entry.owner !== "dcc" || entry.layer !== "understand" || entry.surface !== "authority") {
    push(findings, "error", "cluster.registry_shape", `${config.route} must be a DCC understand authority surface.`);
  }

  if (entry.clusterRole !== config.role) {
    push(findings, "error", "cluster.registry_role", `${config.route} must declare clusterRole=${config.role}.`);
  }

  const target = config.role === "hub" ? entry.canonicalTarget : entry.handoffTarget;
  if (target !== config.expectedRegistryTarget) {
    push(findings, "error", "cluster.registry_target", `${config.route} should resolve to ${config.expectedRegistryTarget} in pageRegistry, found ${target ?? "null"}.`);
  }

  if (config.role === "feeder" && entry.canonicalTarget !== RED_ROCKS_CLUSTER.hubRoute) {
    push(findings, "error", "cluster.registry_feeder_canonical", `${config.route} should canonicalize to ${RED_ROCKS_CLUSTER.hubRoute} in pageRegistry.`);
  }
}

function validateBridge(config: ClusterPageConfig, findings: Finding[]) {
  for (const cta of config.requiredUrlCtas) {
    const url = new URL(buildParrSharedRedRocksUrl({ sourcePage: config.route, cta }));
    if (url.origin + url.pathname !== CANONICAL_SHARED_URL) {
      push(findings, "error", "cluster.bridge_path", `${config.route} cta=${cta} does not build the canonical shared PARR path.`);
    }
    if (url.searchParams.get("src") !== "dcc") {
      push(findings, "error", "cluster.bridge_src", `${config.route} cta=${cta} is missing src=dcc.`);
    }
    if (url.searchParams.get("page") !== config.alias) {
      push(findings, "error", "cluster.bridge_page", `${config.route} cta=${cta} should emit page=${config.alias}.`);
    }
    if (url.searchParams.get("cta") !== cta) {
      push(findings, "error", "cluster.bridge_cta", `${config.route} cta=${cta} did not preserve the expected CTA label.`);
    }
    for (const forbidden of ["source", "source_page", "sourcePage", "intent", "topic", "subtype", "product"]) {
      if (url.searchParams.has(forbidden)) {
        push(findings, "error", "cluster.bridge_forbidden_param", `${config.route} cta=${cta} leaked forbidden param ${forbidden}.`);
      }
    }
  }
}

function validatePageFile(config: ClusterPageConfig, findings: Finding[]) {
  const fullPath = path.join(ROOT, config.file);
  if (!fs.existsSync(fullPath)) {
    push(findings, "error", "cluster.page_missing", `${config.file} does not exist.`);
    return;
  }

  const content = read(config.file);

  if (!content.includes("import ParrCtaLink")) {
    push(findings, "error", "cluster.parr_cta_missing", `${config.file} must use ParrCtaLink.`);
  }

  if (content.includes("buildParrPrivateRedRocksUrl") || content.includes("/book/red-rocks-amphitheatre/private")) {
    push(findings, "error", "cluster.private_act_path", `${config.file} exposes a private Red Rocks act path.`);
  }

  if (content.includes('intent: "book"') || content.includes('topic: "transport"') || content.includes("subtype:")) {
    push(findings, "error", "cluster.legacy_contract", `${config.file} still uses the old semantic handoff params.`);
  }

  if (countMatches(content, /<a\s+[^>]*href=\{(?:sharedBookingHref|recommendationBookingHref|buildParrSharedRedRocksUrl)/g) > 0) {
    push(findings, "error", "cluster.raw_booking_anchor", `${config.file} still contains a raw booking anchor instead of ParrCtaLink.`);
  }

  const builtUrlBlocks = [...content.matchAll(/buildParrSharedRedRocksUrl\((\{[\s\S]*?\})\)/g)].map((match) => match[1]);
  for (const cta of config.requiredUrlCtas) {
    const hasCta = builtUrlBlocks.some((block) => block.includes(`cta: "${cta}"`));
    if (!hasCta) {
      push(findings, "error", "cluster.cta_builder_missing", `${config.file} is missing buildParrSharedRedRocksUrl(... cta: "${cta}").`);
    }
  }

  const wrongSourcePage = builtUrlBlocks.some((block) => {
    if (block.includes("sourcePage: PAGE_PATH")) return false;
    const literal = block.match(/sourcePage:\s*"([^"]+)"/);
    return literal ? literal[1] !== config.route : true;
  });
  if (wrongSourcePage) {
    push(findings, "error", "cluster.source_page_mismatch", `${config.file} builds a Red Rocks PARR URL with the wrong sourcePage.`);
  }

  const telemetryCtas = new Set([...content.matchAll(/cta="([^"]+)"/g)].map((match) => match[1]));
  for (const cta of config.requiredTelemetryCtas) {
    if (!telemetryCtas.has(cta)) {
      push(findings, "error", "cluster.telemetry_cta_missing", `${config.file} is missing ParrCtaLink telemetry label ${cta}.`);
    }
  }

  const parrCtaLinks = countMatches(content, /<ParrCtaLink/g);
  if (parrCtaLinks < config.minParrCtaLinks) {
    push(findings, "error", "cluster.primary_act_count", `${config.file} should expose at least ${config.minParrCtaLinks} ParrCtaLink surfaces, found ${parrCtaLinks}.`);
  }

  if (config.role === "feeder" && config.requireHubFallback) {
    const hubFallbackCount = countMatches(content, /href="\/red-rocks-transportation"/g);
    if (hubFallbackCount < 2) {
      push(findings, "error", "cluster.hub_fallback_missing", `${config.file} should route fallback CTA surfaces back to /red-rocks-transportation.`);
    }
  }
}

function validateAuthorityShell(findings: Finding[]) {
  const file = "app/components/dcc/RedRocksAuthorityPage.tsx";
  const content = read(file);

  if (!content.includes("import ParrCtaLink")) {
    push(findings, "error", "cluster.shell_parr_cta_missing", `${file} must use ParrCtaLink for Red Rocks primary actions.`);
  }
  if (content.includes("RideOptionsCard")) {
    push(findings, "error", "cluster.shell_mixed_surface", `${file} still renders RideOptionsCard, which reintroduces mixed act state.`);
  }
  if (content.includes("book shared or private transport")) {
    push(findings, "error", "cluster.shell_mixed_copy", `${file} still describes mixed shared/private act behavior.`);
  }
  if (!content.includes('cta="sidebar-primary"')) {
    push(findings, "error", "cluster.shell_sidebar_missing", `${file} is missing the sidebar primary ParrCtaLink.`);
  }
}

function validateCruiseDecisionCluster(findings: Finding[]) {
  const hub = getRegistryEntry("/cruises");
  const satellite = getRegistryEntry("/cruises/fit");

  if (!hub) {
    push(findings, "error", "cruise.registry_missing_hub", "/cruises is missing from pageRegistry.");
  } else {
    if (hub.layer !== "understand" || hub.owner !== "dcc" || hub.surface !== "authority") {
      push(findings, "error", "cruise.registry_shape_hub", "/cruises must be a DCC understand authority surface.");
    }
    if (hub.clusterRole !== "hub") {
      push(findings, "error", "cruise.registry_role_hub", "/cruises must declare clusterRole=hub.");
    }
    if (hub.cluster !== "cruise-fit") {
      push(findings, "error", "cruise.registry_cluster_hub", "/cruises must declare cluster=cruise-fit.");
    }
    if (hub.handoffTarget !== "/cruises/fit") {
      push(findings, "error", "cruise.registry_handoff_hub", "/cruises must hand off to /cruises/fit.");
    }
  }

  if (!satellite) {
    push(findings, "error", "cruise.registry_missing_satellite", "/cruises/fit is missing from pageRegistry.");
  } else {
    if (satellite.layer !== "choose" || satellite.owner !== "dcc" || satellite.surface !== "authority") {
      push(findings, "error", "cruise.registry_shape_satellite", "/cruises/fit must be a DCC choose authority surface.");
    }
    if (satellite.clusterRole !== "satellite") {
      push(findings, "error", "cruise.registry_role_satellite", "/cruises/fit must declare clusterRole=satellite.");
    }
    if (satellite.cluster !== "cruise-fit") {
      push(findings, "error", "cruise.registry_cluster_satellite", "/cruises/fit must declare cluster=cruise-fit.");
    }
  }

  const hubPage = read("app/cruises/page.tsx");
  const fitPage = read("app/cruises/fit/page.tsx");

  if (!hubPage.includes('href="/cruises/fit"')) {
    push(findings, "error", "cruise.hub_missing_handoff", "app/cruises/page.tsx must link to /cruises/fit.");
  }
  if (hubPage.includes("/book") || hubPage.includes("/checkout")) {
    push(findings, "error", "cruise.hub_illegal_act", "app/cruises/page.tsx should not include booking or checkout links while cruise execution is not owned.");
  }
  if (fitPage.includes("/book") || fitPage.includes("/checkout")) {
    push(findings, "error", "cruise.satellite_illegal_act", "app/cruises/fit/page.tsx should stop at decision and not link to booking or checkout.");
  }
}

function main() {
  const findings: Finding[] = [];

  for (const page of RED_ROCKS_CLUSTER.pages) {
    validateRegistry(page, findings);
    validateBridge(page, findings);
    validatePageFile(page, findings);
  }

  validateAuthorityShell(findings);
  validateCruiseDecisionCluster(findings);

  const errors = findings.filter((item) => item.severity === "error");
  const warnings = findings.filter((item) => item.severity === "warn");
  const summary = {
    ok: errors.length === 0,
    clusters: [RED_ROCKS_CLUSTER.id, "cruiseFit"],
    errors,
    warnings,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
