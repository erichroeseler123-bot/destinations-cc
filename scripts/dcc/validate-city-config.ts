import fs from "node:fs";
import path from "node:path";
import { CITY_AUTHORITY_CONFIG } from "@/src/data/city-authority-config";
import { CITY_MONEY_LANES } from "@/src/data/city-money-lanes";

type Finding = {
  severity: "error" | "warn" | "info";
  code: string;
  message: string;
};

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "app");
const ALIASES_PATH = path.join(ROOT, "data", "city-aliases.json");

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;
}

function nonEmptyArray<T>(value: T[] | undefined | null): boolean {
  return Array.isArray(value) && value.length > 0;
}

function isValidRouteHref(href: string): boolean {
  return /^\/[^\s]*$/.test(href);
}

function isValidOgImage(value: string): boolean {
  return /^\/[^\s]+\.(png|jpe?g|webp|avif|svg)$/i.test(value) || /^https?:\/\/\S+$/i.test(value);
}

function parseIsoDate(value: string): Date | null {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function routeExists(href: string, cityAliases: Set<string>): boolean {
  const pure = href.split("?")[0].split("#")[0];
  if (!pure || pure === "/") return fs.existsSync(path.join(APP_DIR, "page.tsx"));
  const rel = pure.replace(/^\/+/, "").replace(/\/+$/, "");
  const parts = rel.split("/").filter(Boolean);

  const direct = path.join(APP_DIR, rel, "page.tsx");
  if (fs.existsSync(direct)) return true;

  // Support dynamic city routes: /{city}, /{city}/tours, /{city}/shows, etc.
  if (parts.length >= 1 && cityAliases.has(parts[0])) {
    if (parts.length === 1 && fs.existsSync(path.join(APP_DIR, "[city]", "page.tsx"))) return true;
    const tail = parts.slice(1);
    if (tail.length >= 1) {
      const dynamicSub = path.join(APP_DIR, "[city]", ...tail, "page.tsx");
      if (fs.existsSync(dynamicSub)) return true;
    }
  }

  return false;
}

function loadCityAliases(): Set<string> {
  const raw = fs.readFileSync(ALIASES_PATH, "utf8");
  const parsed = JSON.parse(raw) as Record<string, string>;
  return new Set(Object.keys(parsed));
}

function push(
  out: Finding[],
  severity: Finding["severity"],
  code: string,
  message: string
) {
  out.push({ severity, code, message });
}

function validateAuthorityConfig(cityAliases: Set<string>, findings: Finding[]) {
  const authorityEntries = Object.entries(CITY_AUTHORITY_CONFIG);
  const cityKeySeen = new Set<string>();

  for (const [key, cfg] of authorityEntries) {
    if (cityKeySeen.has(cfg.cityKey)) {
      push(findings, "error", "authority.duplicate_city_key", `Duplicate authority cityKey "${cfg.cityKey}".`);
    }
    cityKeySeen.add(cfg.cityKey);

    if (cfg.cityKey !== key) {
      push(findings, "error", "authority.key_mismatch", `Authority key "${key}" does not match cityKey "${cfg.cityKey}".`);
    }
    if (!cityAliases.has(key)) {
      push(findings, "error", "authority.missing_alias", `Authority city "${key}" is not in data/city-aliases.json.`);
    }

    const requiredStringFields: Array<[string, string]> = [
      ["seoTitle", cfg.seoTitle],
      ["seoDescription", cfg.seoDescription],
      ["heroTitle", cfg.heroTitle],
      ["heroDescription", cfg.heroDescription],
      ["trustLine", cfg.trustLine],
      ["cityName", cfg.cityName],
      ["canonicalPath", cfg.canonicalPath],
      ["openGraphImage", cfg.openGraphImage],
      ["updatedAt", cfg.updatedAt],
    ];
    for (const [field, value] of requiredStringFields) {
      if (!nonEmpty(value)) {
        push(findings, "error", "authority.required_field", `Authority "${key}" missing required field "${field}".`);
      }
    }

    const requiredArrayFields: Array<[string, unknown[]]> = [
      ["keywords", cfg.keywords],
      ["pillars", cfg.pillars],
      ["eventVenues", cfg.eventVenues],
      ["eventQueries", cfg.eventQueries],
      ["festivals", cfg.festivals],
      ["faq", cfg.faq],
      ["linkedPages", cfg.linkedPages],
    ];
    for (const [field, arr] of requiredArrayFields) {
      if (!nonEmptyArray(arr)) {
        push(findings, "error", "authority.required_array", `Authority "${key}" requires a non-empty "${field}" array.`);
      }
    }

    if (!cfg.canonicalPath.startsWith(`/${key}`)) {
      push(findings, "error", "authority.canonical_mismatch", `Authority "${key}" canonicalPath "${cfg.canonicalPath}" should start with "/${key}".`);
    }
    if (!isValidRouteHref(cfg.canonicalPath)) {
      push(findings, "error", "authority.canonical_syntax", `Authority "${key}" canonicalPath "${cfg.canonicalPath}" is not a valid route.`);
    }
    if (!isValidOgImage(cfg.openGraphImage)) {
      push(findings, "error", "authority.og_image_syntax", `Authority "${key}" openGraphImage "${cfg.openGraphImage}" must be an absolute URL or site-relative image path.`);
    }
    if (cfg.openGraphImage === "/og-image.jpg") {
      push(findings, "warn", "authority.generic_og_image", `Authority "${key}" uses generic openGraphImage "/og-image.jpg".`);
    }

    if (!Number.isFinite(cfg.refreshIntervalDays) || cfg.refreshIntervalDays <= 0) {
      push(findings, "error", "authority.refresh_interval_invalid", `Authority "${key}" refreshIntervalDays must be a positive number.`);
    }
    const updatedAtDate = parseIsoDate(cfg.updatedAt);
    if (!updatedAtDate) {
      push(findings, "error", "authority.updated_at_invalid", `Authority "${key}" updatedAt "${cfg.updatedAt}" is not a valid ISO date.`);
    } else {
      const ageDays = Math.floor((Date.now() - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24));
      if (ageDays > cfg.refreshIntervalDays) {
        push(
          findings,
          "warn",
          "authority.stale_config",
          `Authority "${key}" is stale (${ageDays} days old > refreshIntervalDays=${cfg.refreshIntervalDays}).`
        );
      }
    }

    if ((cfg.keywords?.length || 0) < 5) {
      push(findings, "error", "authority.minimum_keywords", `Authority "${key}" requires at least 5 keywords.`);
    }
    if ((cfg.faq?.length || 0) < 3) {
      push(findings, "error", "authority.minimum_faq", `Authority "${key}" requires at least 3 FAQ entries.`);
    }
    if ((cfg.eventQueries?.length || 0) < 4) {
      push(findings, "error", "authority.minimum_event_queries", `Authority "${key}" requires at least 4 event queries.`);
    }
    if ((cfg.pillars?.length || 0) < 3) {
      push(findings, "error", "authority.minimum_pillars", `Authority "${key}" requires at least 3 pillars.`);
    }

    for (const [idx, item] of cfg.eventQueries.entries()) {
      if (!nonEmpty(item.label) || !nonEmpty(item.query)) {
        push(findings, "error", "authority.event_query_shape", `Authority "${key}" eventQueries[${idx}] must include label + query.`);
      }
    }

    for (const [idx, item] of cfg.faq.entries()) {
      if (!nonEmpty(item.q) || !nonEmpty(item.a)) {
        push(findings, "error", "authority.faq_shape", `Authority "${key}" faq[${idx}] must include q + a.`);
      }
    }

    for (const item of cfg.linkedPages) {
      if (!nonEmpty(item.label) || !nonEmpty(item.href)) {
        push(findings, "error", "authority.link_shape", `Authority "${key}" linkedPages entries require label + href.`);
        continue;
      }
      if (!isValidRouteHref(item.href)) {
        push(findings, "error", "authority.link_syntax", `Authority "${key}" linked href "${item.href}" is not a valid route.`);
        continue;
      }
      if (!routeExists(item.href, cityAliases)) {
        push(findings, "warn", "authority.link_missing_route", `Authority "${key}" linked href "${item.href}" has no direct app route file.`);
      }
    }

    const linkedHrefs = new Set(cfg.linkedPages.map((x) => x.href));
    for (const requiredHref of ["/cruises", "/national-parks"]) {
      if (!linkedHrefs.has(requiredHref)) {
        push(findings, "error", "authority.required_link_missing", `Authority "${key}" must include linked page "${requiredHref}".`);
      }
    }
  }
}

function validateMoneyLanes(cityAliases: Set<string>, findings: Finding[]) {
  const moneyEntries = Object.entries(CITY_MONEY_LANES);
  const cityKeySeen = new Set<string>();

  for (const [key, cfg] of moneyEntries) {
    if (cityKeySeen.has(cfg.cityKey)) {
      push(findings, "error", "money.duplicate_city_key", `Duplicate money-lane cityKey "${cfg.cityKey}".`);
    }
    cityKeySeen.add(cfg.cityKey);

    if (cfg.cityKey !== key) {
      push(findings, "error", "money.key_mismatch", `Money-lane key "${key}" does not match cityKey "${cfg.cityKey}".`);
    }
    if (!cityAliases.has(key)) {
      push(findings, "error", "money.missing_alias", `Money-lane city "${key}" is not in data/city-aliases.json.`);
    }

    const requiredStringFields: Array<[string, string]> = [
      ["cityName", cfg.cityName],
      ["sectionTitle", cfg.sectionTitle],
      ["sectionDescription", cfg.sectionDescription],
      ["trustLine", cfg.trustLine],
      ["primaryCtaLabel", cfg.primaryCtaLabel],
      ["primaryCtaHref", cfg.primaryCtaHref],
      ["secondaryCtaLabel", cfg.secondaryCtaLabel],
      ["secondaryCtaHref", cfg.secondaryCtaHref],
    ];
    for (const [field, value] of requiredStringFields) {
      if (!nonEmpty(value)) {
        push(findings, "error", "money.required_field", `Money-lane "${key}" missing required field "${field}".`);
      }
    }

    if (!nonEmptyArray(cfg.intents)) {
      push(findings, "error", "money.required_intents", `Money-lane "${key}" requires at least one intent.`);
    }
    for (const [idx, intent] of cfg.intents.entries()) {
      if (!nonEmpty(intent.label) || !nonEmpty(intent.query)) {
        push(findings, "error", "money.intent_shape", `Money-lane "${key}" intents[${idx}] must include label + query.`);
      }
    }

    for (const href of [cfg.primaryCtaHref, cfg.secondaryCtaHref]) {
      if (!isValidRouteHref(href)) {
        push(findings, "error", "money.cta_syntax", `Money-lane "${key}" CTA href "${href}" is not a valid route.`);
        continue;
      }
      if (!routeExists(href, cityAliases)) {
        push(findings, "warn", "money.cta_missing_route", `Money-lane "${key}" CTA href "${href}" has no direct app route file.`);
      }
    }
  }
}

function validateCrossConfig(findings: Finding[]) {
  const authorityKeys = new Set(Object.keys(CITY_AUTHORITY_CONFIG));
  const moneyKeys = new Set(Object.keys(CITY_MONEY_LANES));

  for (const key of authorityKeys) {
    if (!moneyKeys.has(key)) {
      push(findings, "error", "cross.missing_money_lane", `Authority city "${key}" does not have a matching money-lane config.`);
    }
  }
  for (const key of moneyKeys) {
    if (!authorityKeys.has(key)) {
      push(findings, "warn", "cross.unpaired_money_lane", `Money-lane city "${key}" has no matching authority config (transition or standalone city page).`);
    }
  }
}

function main() {
  const findings: Finding[] = [];
  const aliases = loadCityAliases();

  validateAuthorityConfig(aliases, findings);
  validateMoneyLanes(aliases, findings);
  validateCrossConfig(findings);

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");

  const summary = {
    ok: errors.length === 0,
    authority_count: Object.keys(CITY_AUTHORITY_CONFIG).length,
    money_lane_count: Object.keys(CITY_MONEY_LANES).length,
    alias_count: aliases.size,
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
