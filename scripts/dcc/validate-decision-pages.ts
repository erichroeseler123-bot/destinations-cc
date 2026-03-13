import fs from "node:fs";
import path from "node:path";
import { DECISION_ENGINE_PAGES } from "@/src/data/decision-engine-pages";
import { DecisionEnginePageSchema } from "@/lib/dcc/decision/schema";

type Finding = {
  severity: "error" | "warn" | "info";
  code: string;
  message: string;
};

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "app");
const ALIASES_PATH = path.join(ROOT, "data", "city-aliases.json");
const TOP20_MIN_COVERAGE_RATIO = 0.25;

function parseIsoDate(value: string): Date | null {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const safeValue = dateOnly.test(value) ? `${value}T00:00:00Z` : value;
  const dt = new Date(safeValue);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function loadCityAliases(): Set<string> {
  const raw = fs.readFileSync(ALIASES_PATH, "utf8");
  const parsed = JSON.parse(raw) as Record<string, string>;
  return new Set(Object.keys(parsed));
}

function routeExistsViaDynamicFolders(parts: string[]): boolean {
  function walk(base: string, idx: number): boolean {
    if (idx === parts.length) {
      return fs.existsSync(path.join(base, "page.tsx"));
    }
    const segment = parts[idx];
    const exactDir = path.join(base, segment);
    if (fs.existsSync(exactDir) && walk(exactDir, idx + 1)) return true;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(base, { withFileTypes: true });
    } catch {
      return false;
    }
    const dynamicDirs = entries
      .filter((entry) => entry.isDirectory() && /^\[.+\]$/.test(entry.name))
      .map((entry) => path.join(base, entry.name));
    for (const dir of dynamicDirs) {
      if (walk(dir, idx + 1)) return true;
    }
    return false;
  }

  return walk(APP_DIR, 0);
}

function routeExists(href: string, cityAliases: Set<string>): boolean {
  const pure = href.split("?")[0].split("#")[0];
  if (!pure || pure === "/") return fs.existsSync(path.join(APP_DIR, "page.tsx"));
  const rel = pure.replace(/^\/+/, "").replace(/\/+$/, "");
  const parts = rel.split("/").filter(Boolean);
  if (parts.length === 0) return false;

  const direct = path.join(APP_DIR, rel, "page.tsx");
  if (fs.existsSync(direct)) return true;

  if (parts.length >= 1 && cityAliases.has(parts[0])) {
    if (parts.length === 1 && fs.existsSync(path.join(APP_DIR, "[city]", "page.tsx"))) return true;
    const tail = parts.slice(1);
    if (tail.length >= 1) {
      const dynamicSub = path.join(APP_DIR, "[city]", ...tail, "page.tsx");
      if (fs.existsSync(dynamicSub)) return true;
    }
  }

  if (routeExistsViaDynamicFolders(parts)) return true;

  return false;
}

function push(
  out: Finding[],
  severity: Finding["severity"],
  code: string,
  message: string
) {
  out.push({ severity, code, message });
}

function validatePages(findings: Finding[]) {
  const cityAliases = loadCityAliases();
  const seenPaths = new Set<string>();
  const requiredPaths = new Set([
    "/venues/red-rocks-amphitheatre",
    "/ports/juneau",
    "/cities/denver",
    "/attractions/mendenhall-glacier",
    "/routes/denver-red-rocks",
  ]);
  const top20PriorityPaths = [
    "/venues/red-rocks-amphitheatre",
    "/ports/juneau",
    "/cities/denver",
    "/attractions/mendenhall-glacier",
    "/routes/denver-red-rocks",
    "/las-vegas",
    "/new-orleans",
    "/miami",
    "/vegas",
    "/alaska",
    "/ports/nassau",
    "/ports/cozumel",
    "/ports/roatan",
    "/cruises/shore-excursions",
    "/cruises/tendering",
    "/regions/colorado",
    "/mighty-argo",
    "/mighty-argo-shuttle",
    "/national-parks",
    "/sports",
  ];
  const presentPaths = new Set<string>();

  for (const page of DECISION_ENGINE_PAGES) {
    const parsed = DecisionEnginePageSchema.safeParse(page);
    if (!parsed.success) {
      push(findings, "error", "decision.schema", `Invalid decision page "${page.id}": ${parsed.error.issues[0]?.message || "schema error"}`);
      continue;
    }

    if (seenPaths.has(page.canonicalPath)) {
      push(findings, "error", "decision.duplicate_path", `Duplicate canonicalPath "${page.canonicalPath}".`);
    }
    seenPaths.add(page.canonicalPath);

    presentPaths.add(page.canonicalPath);

    if (!routeExists(page.canonicalPath, cityAliases)) {
      push(findings, "error", "decision.page_route_missing", `${page.id} canonicalPath "${page.canonicalPath}" has no matching app route.`);
    }

    for (const link of page.hero.quickLinks) {
      if (!routeExists(link.href, cityAliases)) {
        push(findings, "error", "decision.hero_link_route_missing", `${page.id} hero quickLink "${link.href}" has no matching app route.`);
      }
    }

    const sectionLinks = [
      ...page.nearbyThings,
      ...page.relatedExperiences,
      ...page.whatToDo
        .map((item) => item.href)
        .filter((href): href is string => Boolean(href))
        .map((href) => ({ label: href, href })),
    ];

    for (const link of sectionLinks) {
      if (!routeExists(link.href, cityAliases)) {
        push(findings, "error", "decision.section_route_missing", `${page.id} linked route "${link.href}" has no matching app route.`);
      }
    }

    for (const action of page.authorityActions) {
      if (action.kind === "internal" && !routeExists(action.href, cityAliases)) {
        push(findings, "error", "decision.authority_action_route_missing", `${page.id} internal authority action "${action.href}" has no matching app route.`);
      }
    }

    for (const action of page.executionCtas) {
      if (action.kind === "internal" && !routeExists(action.href, cityAliases)) {
        push(findings, "error", "decision.execution_cta_route_missing", `${page.id} internal execution CTA "${action.href}" has no matching app route.`);
      }
    }

    const updatedAt = parseIsoDate(page.freshness.updatedAt);
    if (!updatedAt) {
      push(findings, "error", "decision.invalid_updated_at", `${page.id} has invalid freshness.updatedAt "${page.freshness.updatedAt}".`);
      continue;
    }
    const ageDays = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays > page.freshness.refreshIntervalDays) {
      push(
        findings,
        "warn",
        "decision.stale",
        `${page.id} is stale (${ageDays} days old > refreshIntervalDays=${page.freshness.refreshIntervalDays}).`
      );
    }

    if ((page.faq?.length || 0) < 4) {
      push(findings, "error", "decision.minimum_faq", `${page.id} requires at least 4 FAQ entries.`);
    }
    if ((page.insiderTips?.length || 0) < 3) {
      push(findings, "error", "decision.minimum_insider_tips", `${page.id} requires at least 3 insider tips.`);
    }
    if ((page.commonMistakes?.length || 0) < 3) {
      push(findings, "error", "decision.minimum_common_mistakes", `${page.id} requires at least 3 common mistakes.`);
    }
    if ((page.relatedExperiences?.length || 0) < 3) {
      push(findings, "error", "decision.minimum_related_experiences", `${page.id} requires at least 3 related experiences.`);
    }
    if (!page.relatedExperiences.some((item) => item.graphLinked)) {
      push(findings, "error", "decision.graph_link_required", `${page.id} requires at least one graph-linked related experience.`);
    }

    const internalAuthorityActions = page.authorityActions.filter((action) => action.kind === "internal").length;
    if (internalAuthorityActions < 2) {
      push(findings, "error", "decision.authority_action_internal_min", `${page.id} requires at least 2 internal authority actions.`);
    }
    if (page.authorityActions[0]?.kind !== "internal") {
      push(findings, "error", "decision.primary_authority_action_internal", `${page.id} first authority action must be internal to keep authority-first sequencing.`);
    }
    if (!page.executionCtas.length) {
      push(findings, "error", "decision.execution_cta_missing", `${page.id} requires at least one execution CTA.`);
    }
  }

  for (const path of requiredPaths) {
    if (!presentPaths.has(path)) {
      push(findings, "error", "decision.required_path_missing", `Required priority page missing from decision contract: "${path}".`);
    }
  }

  const coveredTop20 = top20PriorityPaths.filter((path) => presentPaths.has(path)).length;
  const top20CoverageRatio = coveredTop20 / top20PriorityPaths.length;
  if (top20CoverageRatio < TOP20_MIN_COVERAGE_RATIO) {
    push(
      findings,
      "error",
      "decision.top20_coverage_low",
      `Top-20 coverage too low (${coveredTop20}/${top20PriorityPaths.length} = ${(top20CoverageRatio * 100).toFixed(1)}%). Minimum is ${(TOP20_MIN_COVERAGE_RATIO * 100).toFixed(1)}%.`
    );
  } else {
    push(
      findings,
      "info",
      "decision.top20_coverage_ok",
      `Top-20 coverage ${coveredTop20}/${top20PriorityPaths.length} = ${(top20CoverageRatio * 100).toFixed(1)}%.`
    );
  }
}

function main() {
  const findings: Finding[] = [];
  validatePages(findings);

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");

  const summary = {
    ok: errors.length === 0,
    decision_page_count: DECISION_ENGINE_PAGES.length,
    errors_count: errors.length,
    warnings_count: warnings.length,
    infos_count: infos.length,
    errors,
    warnings,
    infos,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (errors.length > 0) process.exit(1);
}

main();
