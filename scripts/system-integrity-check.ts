import fs from "node:fs";

type Layer = "seo" | "decision" | "continuity" | "execution" | "checkout" | "telemetry" | "ops";

type HardDeployBlocker = {
  label: string;
  result: "PASS" | "FAIL";
  reason: string;
};

type UrlCheck = {
  label: string;
  url: string;
  kind: "public" | "checkout" | "telemetry" | "admin";
  layers: Layer[];
  sitemap?: boolean;
  cta?: {
    required?: boolean;
    allowedDomains?: string[];
    expectedPathIncludes?: string[];
    expectedParams?: string[];
    expectedAnyParam?: string[];
    expectedAnyParamValue?: Array<{ key: string; values: string[] }>;
    requireTargets?: Array<{
      label: string;
      pathIncludes: string;
      expectedParams?: string[];
      expectedAnyParamValue?: Array<{ key: string; values: string[] }>;
    }>;
  };
};

type FetchResult = {
  url: string;
  finalUrl: string;
  status: number;
  ok: boolean;
  headers: Headers;
  html: string;
  error?: string;
};

type Link = {
  href: string;
  text: string;
  absoluteUrl: string | null;
};

type PageRole = "dcc" | "chooser" | "operator" | "feastly" | "admin" | "internal" | "unknown";

type MetadataAudit = {
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
};

type SchemaAudit = {
  count: number;
  types: string[];
  issues: string[];
};

type Row = {
  label: string;
  url: string;
  status: string;
  noindex: "yes" | "no" | "n/a";
  sitemap: "yes" | "no" | "n/a";
  title: "yes" | "no" | "n/a";
  description: "yes" | "no" | "n/a";
  canonical: "yes" | "no" | "n/a";
  robots: "index" | "noindex" | "n/a";
  jsonLd: "yes" | "no" | "n/a";
  schemaValid: "yes" | "no" | "n/a";
  schemaTypes: string;
  schemaViolations: string;
  ctaFound: "yes" | "no" | "n/a";
  ctaTarget: string;
  params: "pass" | "fail" | "n/a";
  flowOpens: "yes" | "no" | "n/a";
  result: "PASS" | "FAIL";
  reason: string;
  layers: Layer[];
};

type RowDisplayResult = "PASS" | "FAIL" | "WARN";

const CHECKS: UrlCheck[] = [
  {
    label: "DCC homepage",
    url: "https://www.destinationcommandcenter.com/",
    kind: "public",
    layers: ["seo", "decision"],
    sitemap: true,
    cta: { required: false },
  },
  {
    label: "DCC checkout",
    url: "https://www.destinationcommandcenter.com/checkout",
    kind: "checkout",
    layers: ["checkout", "execution"],
  },
  {
    label: "DCC 420 checkout",
    url: "https://www.destinationcommandcenter.com/checkout?route=airport-420-pickup&product=airport-dispensary&mode=420",
    kind: "checkout",
    layers: ["checkout", "continuity", "execution"],
  },
  {
    label: "DCC Mighty Argo",
    url: "https://www.destinationcommandcenter.com/mighty-argo-shuttle",
    kind: "public",
    layers: ["execution"],
    cta: { required: false },
  },
  {
    label: "DCC telemetry dashboard",
    url: "https://www.destinationcommandcenter.com/internal/telemetry",
    kind: "telemetry",
    layers: ["telemetry"],
  },
  {
    label: "DCC corridor events API",
    url: "https://www.destinationcommandcenter.com/api/internal/corridor-events",
    kind: "telemetry",
    layers: ["telemetry"],
  },

  {
    label: "PARR shuttles",
    url: "https://www.partyatredrocks.com/shuttles",
    kind: "public",
    layers: ["seo", "execution"],
    sitemap: true,
    cta: {
      required: true,
      allowedDomains: ["www.partyatredrocks.com", "partyatredrocks.com"],
      expectedPathIncludes: ["/book/"],
    },
  },
  {
    label: "PARR transportation",
    url: "https://www.partyatredrocks.com/red-rocks/transportation",
    kind: "public",
    layers: ["seo", "execution"],
    sitemap: true,
    cta: {
      required: true,
      allowedDomains: ["www.partyatredrocks.com", "partyatredrocks.com"],
      expectedPathIncludes: ["/book/"],
    },
  },
  {
    label: "PARR inventory admin",
    url: "https://www.partyatredrocks.com/admin/parr-inventory",
    kind: "admin",
    layers: ["ops"],
  },
  {
    label: "PARR Marriott West manager",
    url: "https://www.partyatredrocks.com/manager/marriott-west",
    kind: "admin",
    layers: ["ops"],
  },

  ...[
    "https://shuttleya.com/red-rocks-shuttle",
    "https://shuttleya.com/denver-to-red-rocks-shuttle",
    "https://shuttleya.com/red-rocks-private-transportation",
  ].map((url): UrlCheck => ({
    label: `Shuttleya ${new URL(url).pathname}`,
    url,
    kind: "public",
    layers: ["seo", "continuity", "execution"],
    sitemap: true,
    cta: {
      required: true,
      allowedDomains: ["shuttleya.com", "www.shuttleya.com"],
      expectedPathIncludes: ["/book/event-transport"],
      expectedParams: ["route", "ride_type", "operator"],
      expectedAnyParamValue: [
        { key: "route", values: ["red-rocks"] },
        { key: "operator", values: ["parr"] },
      ],
    },
  })),

  ...[
    "https://gosno.co/denver-to-breckenridge-shuttle",
    "https://gosno.co/denver-airport-to-breckenridge",
    "https://gosno.co/denver-to-vail-shuttle",
    "https://gosno.co/denver-airport-shuttle-to-ski-resorts",
  ].map((url): UrlCheck => ({
    label: `GoSno ${new URL(url).pathname}`,
    url,
    kind: "public",
    layers: ["seo", "continuity", "execution"],
    sitemap: true,
    cta: {
      required: true,
      allowedDomains: ["gosno.co", "www.gosno.co"],
      expectedPathIncludes: ["/book"],
      expectedAnyParam: ["route", "pickup", "dropoff"],
    },
  })),

  {
    label: "420 DEN pickup",
    url: "https://420friendlyairportpickup.com/denver-airport-420-friendly-pickup",
    kind: "public",
    layers: ["seo", "continuity", "execution"],
    sitemap: true,
    cta: {
      required: true,
      allowedDomains: ["www.destinationcommandcenter.com", "destinationcommandcenter.com", "420friendlyairportpickup.com"],
      expectedPathIncludes: ["/checkout"],
      expectedParams: ["product", "source_page", "decision_cta"],
      expectedAnyParamValue: [
        { key: "product", values: ["airport-dispensary"] },
        { key: "mode", values: ["420"] },
        { key: "package", values: ["420-friendly"] },
      ],
    },
  },
  {
    label: "420 airport transport",
    url: "https://420friendlyairportpickup.com/420-friendly-airport-transport-denver",
    kind: "public",
    layers: ["seo", "continuity", "execution"],
    sitemap: true,
    cta: {
      required: true,
      allowedDomains: ["www.destinationcommandcenter.com", "destinationcommandcenter.com", "420friendlyairportpickup.com"],
      expectedPathIncludes: ["/checkout"],
      expectedParams: ["product", "source_page", "decision_cta"],
      expectedAnyParamValue: [
        { key: "product", values: ["airport-dispensary"] },
        { key: "mode", values: ["420"] },
        { key: "package", values: ["420-friendly"] },
      ],
    },
  },

  ...[
    ["Feastly vacation rental", "https://feastlyspread.com/private-chef-for-vacation-rental"],
    ["Feastly bachelorette", "https://feastlyspread.com/private-chef-for-bachelorette-party"],
    ["Feastly dinner experience", "https://feastlyspread.com/private-chef-dinner-experience"],
  ].map(([label, url]): UrlCheck => ({
    label,
    url,
    kind: "public",
    layers: ["seo", "continuity", "execution"],
    sitemap: true,
    cta: {
      required: true,
      allowedDomains: ["feastlyspread.com", "www.feastlyspread.com"],
      requireTargets: [
        {
          label: "browse helpers",
          pathIncludes: "/locations",
          expectedParams: ["experience_type", "source_page", "cta"],
          expectedAnyParamValue: [{ key: "cta", values: ["browse_helpers"] }],
        },
        {
          label: "start matching",
          pathIncludes: "/book",
          expectedParams: ["experience_type", "source_page", "cta"],
          expectedAnyParamValue: [{ key: "cta", values: ["start_matching"] }],
        },
      ],
    },
  })),

  ...[
    "https://welcometotheswamp.com/best-swamp-tour-new-orleans",
    "https://welcometotheswamp.com/swamp-tours-new-orleans",
    "https://welcometotheswamp.com/airboat-swamp-tour-new-orleans",
    "https://welcometotheswamp.com/which-swamp-tour-should-i-choose",
    "https://juneauflightdeck.com/best-excursions-in-juneau",
    "https://juneauflightdeck.com/juneau-whale-watching-tours",
    "https://juneauflightdeck.com/helicopter-vs-whale-watching-juneau",
    "https://juneauflightdeck.com/what-to-do-in-juneau-cruise-port",
    "https://welcometoalaskatours.com/best-alaska-shore-excursions",
    "https://welcometoalaskatours.com/juneau-shore-excursions",
    "https://welcometoalaskatours.com/alaska-cruise-excursions",
    "https://welcometoalaskatours.com/welcome-to-alaska-tours",
    "https://welcometoneworleanstours.com/best-tours-in-new-orleans",
    "https://welcometoneworleanstours.com/new-orleans-walking-tours",
    "https://welcometoneworleanstours.com/ghost-tour-vs-history-tour-new-orleans",
    "https://welcometoneworleanstours.com/what-to-do-in-new-orleans-first-time",
  ].map((url): UrlCheck => ({
    label: `Chooser ${new URL(url).hostname}${new URL(url).pathname}`,
    url,
    kind: "public",
    layers: ["seo", "decision", "execution"],
    sitemap: true,
    cta: { required: true },
  })),
];

const sitemapCache = new Map<string, Promise<string>>();
const targetCache = new Map<string, Promise<FetchResult>>();
const FETCH_TIMEOUT_MS = 15_000;
const DCC_ORIGIN = process.env.DCC_SYSTEM_CHECK_ORIGIN?.replace(/\/$/, "") || "https://www.destinationcommandcenter.com";
const REQUIRED_DEPLOY_ENV = [
  "DATABASE_URL",
  "SQUARE_ACCESS_TOKEN",
  "NEXT_PUBLIC_SQUARE_APP_ID",
  "NEXT_PUBLIC_SQUARE_LOCATION_ID",
  "FEASTLY_PAYMENT_CHECKOUT_URL",
  "INTERNAL_API_SECRET",
] as const;
const REQUIRED_TELEMETRY_EVENTS = [
  "shortlist_generated",
  "recommendation_clicked",
  "booking_opened",
  "booking_completed",
] as const;

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function domainOf(url: string): string {
  return new URL(url).origin;
}

function sitemapUrlFor(url: string): string {
  return `${domainOf(url)}/sitemap.xml`;
}

function pathSlug(url: string): string {
  const parsed = new URL(url);
  return parsed.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
}

function isUnrelatedHomepage(originalUrl: string, finalUrl: string): boolean {
  const original = new URL(originalUrl);
  const final = new URL(finalUrl);
  return original.pathname !== "/" && final.pathname === "/";
}

async function fetchPage(url: string, method: "GET" | "HEAD" = "GET"): Promise<FetchResult> {
  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "user-agent": "dcc-system-integrity-check/1.0",
      },
    });
    const html = method === "GET" ? await response.text().catch(() => "") : "";
    return {
      url,
      finalUrl: response.url,
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      html,
    };
  } catch (error) {
    return {
      url,
      finalUrl: url,
      status: 0,
      ok: false,
      headers: new Headers(),
      html: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchTarget(url: string): Promise<FetchResult> {
  const cached = targetCache.get(url);
  if (cached) return cached;
  const promise = fetchPage(url);
  targetCache.set(url, promise);
  return promise;
}

async function postJson(url: string, payload: unknown, headers: Record<string, string> = {}): Promise<FetchResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "content-type": "application/json",
        "user-agent": "dcc-system-integrity-check/1.0",
        ...headers,
      },
      body: JSON.stringify(payload),
    });
    const html = await response.text().catch(() => "");
    return {
      url,
      finalUrl: response.url,
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      html,
    };
  } catch (error) {
    return {
      url,
      finalUrl: url,
      status: 0,
      ok: false,
      headers: new Headers(),
      html: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchSitemap(url: string): Promise<string> {
  const sitemapUrl = sitemapUrlFor(url);
  const cached = sitemapCache.get(sitemapUrl);
  if (cached) return cached;
  const promise = fetch(sitemapUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": "dcc-system-integrity-check/1.0" },
  })
    .then((response) => (response.ok ? response.text() : ""))
    .catch(() => "");
  sitemapCache.set(sitemapUrl, promise);
  return promise;
}

function hasNoindex(result: FetchResult): boolean {
  const robotsHeader = result.headers.get("x-robots-tag") || "";
  if (robotsHeader.toLowerCase().includes("noindex")) return true;
  return /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(result.html);
}

function extractMetadata(html: string): MetadataAudit {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || null;
  const description =
    html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ||
    html.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i)?.[1] ||
    null;
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || null;
  const robots =
    html.match(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] ||
    html.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i)?.[1] ||
    null;
  return {
    title: title ? decodeHtml(title.replace(/\s+/g, " ").trim()) : null,
    description: description ? decodeHtml(description.trim()) : null,
    canonical: canonical ? decodeHtml(canonical.trim()) : null,
    robots: robots ? decodeHtml(robots.trim()) : null,
  };
}

function inferRole(check: UrlCheck): PageRole {
  if (check.kind === "admin") return "admin";
  if (check.kind === "telemetry" || check.kind === "checkout") return "internal";
  const host = new URL(check.url).hostname.replace(/^www\./, "");
  if (host === "destinationcommandcenter.com") return "dcc";
  if (["welcometotheswamp.com", "juneauflightdeck.com", "welcometoalaskatours.com", "welcometoneworleanstours.com"].includes(host)) {
    return "chooser";
  }
  if (["shuttleya.com", "gosno.co", "partyatredrocks.com", "420friendlyairportpickup.com"].includes(host)) return "operator";
  if (host === "feastlyspread.com") return "feastly";
  return "unknown";
}

function isPublicSeoCheck(check: UrlCheck): boolean {
  return check.kind === "public" && check.layers.includes("seo");
}

function schemaRequired(check: UrlCheck): boolean {
  if (!isPublicSeoCheck(check)) return false;
  const role = inferRole(check);
  const parsed = new URL(check.url);
  if (role === "dcc" && parsed.pathname === "/") return true;
  return role === "operator" || role === "feastly";
}

function normalizeSchemaTypes(value: unknown): string[] {
  const types: string[] = [];
  if (Array.isArray(value)) {
    for (const item of value) types.push(...normalizeSchemaTypes(item));
    return types;
  }
  if (!value || typeof value !== "object") return types;
  const record = value as Record<string, unknown>;
  const typeValue = record["@type"];
  if (typeof typeValue === "string") types.push(typeValue);
  if (Array.isArray(typeValue)) {
    for (const type of typeValue) {
      if (typeof type === "string") types.push(type);
    }
  }
  types.push(...normalizeSchemaTypes(record["@graph"]));
  return types;
}

function walkSchema(value: unknown, visitor: (key: string, value: unknown) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) walkSchema(item, visitor);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    visitor(key, child);
    walkSchema(child, visitor);
  }
}

function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = [];
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const raw = decodeHtml((match[1] || "").trim());
    if (raw) blocks.push(raw);
  }
  return blocks;
}

function auditSchema(check: UrlCheck, result: FetchResult): SchemaAudit {
  const role = inferRole(check);
  const blocks = extractJsonLdBlocks(result.html);
  const issues: string[] = [];
  const types: string[] = [];

  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block);
    } catch (error) {
      issues.push(`invalid JSON-LD: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    types.push(...normalizeSchemaTypes(parsed));

    walkSchema(parsed, (key, value) => {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey === "aggregaterating" || normalizedKey === "review") {
        issues.push(`forbidden schema field ${key}`);
      }
      if (normalizedKey === "ratingvalue" || normalizedKey === "reviewrating" || normalizedKey === "reviewcount") {
        issues.push(`forbidden rating field ${key}`);
      }
      if ((role === "chooser" || role === "dcc" || role === "feastly") && normalizedKey === "price") {
        issues.push("Offer price present on non-operator surface");
      }
      if ((role === "chooser" || role === "dcc") && normalizedKey === "offers" && value) {
        issues.push("Offer schema present on decision/chooser surface");
      }
      if (role === "chooser" && normalizedKey === "provider" && value) {
        issues.push("chooser page uses Service provider schema");
      }
    });
  }

  const uniqueTypes = unique(types);
  const operatorOnlyTypes = new Set(["LocalBusiness", "Service", "TransportationService", "TaxiService", "TravelAgency", "Restaurant", "FoodService"]);
  if (role === "chooser") {
    for (const type of uniqueTypes) {
      if (operatorOnlyTypes.has(type)) issues.push(`chooser page uses operator schema type ${type}`);
    }
  }

  if (schemaRequired(check) && result.status === 200 && blocks.length === 0) {
    issues.push("missing required JSON-LD schema");
  }

  if (role === "admin" && result.status === 200 && blocks.length) {
    issues.push("admin route exposes JSON-LD schema");
  }

  return {
    count: blocks.length,
    types: uniqueTypes,
    issues: unique(issues),
  };
}

function auditMetadata(check: UrlCheck, result: FetchResult): { metadata: MetadataAudit; issues: string[] } {
  const metadata = extractMetadata(result.html);
  const issues: string[] = [];
  if (!isPublicSeoCheck(check) || result.status !== 200) {
    return { metadata, issues };
  }

  if (!metadata.title) issues.push("missing title");
  if (!metadata.description) issues.push("missing meta description");
  if (!metadata.canonical) issues.push("missing canonical");

  if (metadata.canonical) {
    try {
      const canonical = new URL(metadata.canonical, result.finalUrl || check.url);
      const current = new URL(result.finalUrl || check.url);
      if (canonical.hostname !== current.hostname) {
        issues.push(`canonical host mismatch ${canonical.hostname}`);
      }
      if (canonical.pathname.replace(/\/+$/, "") !== current.pathname.replace(/\/+$/, "")) {
        issues.push(`canonical path mismatch ${canonical.pathname}`);
      }
    } catch {
      issues.push("invalid canonical URL");
    }
  }

  return { metadata, issues };
}

function extractLinks(html: string, baseUrl: string): Link[] {
  const links: Link[] = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html))) {
    const attrs = match[1] || "";
    const body = match[2] || "";
    const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = decodeHtml(hrefMatch[1]);
    const text = decodeHtml(body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    let absoluteUrl: string | null = null;
    try {
      absoluteUrl = new URL(href, baseUrl).toString();
    } catch {
      absoluteUrl = null;
    }
    links.push({ href, text, absoluteUrl });
  }
  return links;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function isMeaningfulHref(href: string): boolean {
  const normalized = href.trim();
  if (!normalized || normalized === "#" || normalized === "/") return false;
  if (normalized.startsWith("#")) return false;
  if (/^(mailto|tel|javascript):/i.test(normalized)) return false;
  return true;
}

function hostMatches(url: URL, allowedDomains?: string[]): boolean {
  if (!allowedDomains?.length) return true;
  return allowedDomains.includes(url.hostname);
}

function pathMatches(url: URL, expectedPathIncludes?: string[]): boolean {
  if (!expectedPathIncludes?.length) return true;
  return expectedPathIncludes.some((value) => url.pathname.includes(value));
}

function paramsPass(url: URL, cta: NonNullable<UrlCheck["cta"]>, target?: NonNullable<NonNullable<UrlCheck["cta"]>["requireTargets"]>[number]): string[] {
  const reasons: string[] = [];
  const expectedParams = target?.expectedParams || cta.expectedParams || [];
  for (const param of expectedParams) {
    if (!url.searchParams.has(param)) reasons.push(`missing param ${param}`);
  }

  const anyParam = cta.expectedAnyParam || [];
  if (anyParam.length && !anyParam.some((param) => url.searchParams.has(param))) {
    reasons.push(`missing one of params ${anyParam.join("|")}`);
  }

  const expectedAnyParamValue = target?.expectedAnyParamValue || cta.expectedAnyParamValue || [];
  for (const rule of expectedAnyParamValue) {
    const value = url.searchParams.get(rule.key);
    if (!value || !rule.values.includes(value)) {
      reasons.push(`missing ${rule.key}=${rule.values.join("|")}`);
    }
  }

  return reasons;
}

function chooseCtaLink(check: UrlCheck, links: Link[]): Link | null {
  const cta = check.cta;
  const candidates = links.filter((link) => isMeaningfulHref(link.href) && link.absoluteUrl);
  if (!candidates.length) return null;
  if (!cta) return candidates[0] || null;

  return (
    candidates.find((link) => {
      if (!link.absoluteUrl) return false;
      const url = new URL(link.absoluteUrl);
      return hostMatches(url, cta.allowedDomains) && pathMatches(url, cta.expectedPathIncludes) && paramsPass(url, cta).length === 0;
    }) ||
    candidates.find((link) => {
      if (!link.absoluteUrl) return false;
      const url = new URL(link.absoluteUrl);
      return hostMatches(url, cta.allowedDomains) && pathMatches(url, cta.expectedPathIncludes);
    }) ||
    candidates.find((link) => /book|reserve|choose|compare|find|checkout|tour|helper|shuttle/i.test(`${link.text} ${link.href}`)) ||
    candidates[0] ||
    null
  );
}

async function checkCtaTarget(check: UrlCheck, result: FetchResult, links: Link[]): Promise<{
  ctaFound: "yes" | "no" | "n/a";
  ctaTarget: string;
  params: "pass" | "fail" | "n/a";
  flowOpens: "yes" | "no" | "n/a";
  reasons: string[];
}> {
  if (!check.cta?.required) {
    return { ctaFound: "n/a", ctaTarget: "n/a", params: "n/a", flowOpens: "n/a", reasons: [] };
  }

  const meaningful = links.filter((link) => isMeaningfulHref(link.href));
  if (!meaningful.length) {
    return { ctaFound: "no", ctaTarget: "none", params: "n/a", flowOpens: "n/a", reasons: ["no hrefs found"] };
  }

  if (check.cta.requireTargets?.length) {
    const ctaConfig = check.cta;
    const reasons: string[] = [];
    const targets: string[] = [];
    let allFlowsOpen = true;
    let allParamsPass = true;
    for (const required of check.cta.requireTargets) {
      const link = meaningful.find((candidate) => {
        if (!candidate.absoluteUrl) return false;
        const url = new URL(candidate.absoluteUrl);
        return hostMatches(url, check.cta?.allowedDomains) && url.pathname.includes(required.pathIncludes);
      });
      const strongerLink =
        meaningful.find((candidate) => {
          if (!candidate.absoluteUrl) return false;
          const url = new URL(candidate.absoluteUrl);
          return (
            hostMatches(url, ctaConfig.allowedDomains) &&
            url.pathname.includes(required.pathIncludes) &&
            paramsPass(url, ctaConfig, required).length === 0
          );
        }) || link;
      if (!strongerLink?.absoluteUrl) {
        reasons.push(`missing CTA target ${required.label}`);
        allFlowsOpen = false;
        allParamsPass = false;
        continue;
      }
      const parsed = new URL(strongerLink.absoluteUrl);
      targets.push(strongerLink.absoluteUrl);
      const paramReasons = paramsPass(parsed, check.cta, required);
      if (paramReasons.length) {
        allParamsPass = false;
        reasons.push(`${required.label}: ${paramReasons.join(", ")}`);
      }
      const targetResult = await fetchTarget(strongerLink.absoluteUrl);
      if ([404, 500].includes(targetResult.status) || isUnrelatedHomepage(strongerLink.absoluteUrl, targetResult.finalUrl)) {
        allFlowsOpen = false;
        reasons.push(`${required.label}: target status=${targetResult.status} final=${targetResult.finalUrl}`);
      }
      if (/payment|square|stripe|card|checkout/i.test(targetResult.html)) {
        console.log(`MANUAL PAYMENT REQUIRED: ${strongerLink.absoluteUrl}`);
      }
    }
    return {
      ctaFound: targets.length ? "yes" : "no",
      ctaTarget: targets.join(" | ") || "none",
      params: allParamsPass ? "pass" : "fail",
      flowOpens: allFlowsOpen ? "yes" : "no",
      reasons,
    };
  }

  const primary = chooseCtaLink(check, links);
  if (!primary?.absoluteUrl) {
    return { ctaFound: "no", ctaTarget: "none", params: "n/a", flowOpens: "n/a", reasons: ["no valid CTA href found"] };
  }

  const primaryUrl = new URL(primary.absoluteUrl);
  const reasons: string[] = [];
  if (primary.href === "#" || primary.href === "/") reasons.push(`bad primary CTA href ${primary.href}`);
  if (!hostMatches(primaryUrl, check.cta.allowedDomains)) reasons.push(`wrong CTA domain ${primaryUrl.hostname}`);
  if (!pathMatches(primaryUrl, check.cta.expectedPathIncludes)) reasons.push(`wrong CTA path ${primaryUrl.pathname}`);

  const paramReasons = paramsPass(primaryUrl, check.cta);
  reasons.push(...paramReasons);

  const targetResult = await fetchTarget(primary.absoluteUrl);
  let flowOpens: "yes" | "no" = "yes";
  if ([404, 500].includes(targetResult.status) || isUnrelatedHomepage(primary.absoluteUrl, targetResult.finalUrl)) {
    flowOpens = "no";
    reasons.push(`target status=${targetResult.status} final=${targetResult.finalUrl}`);
  }
  if (/payment|square|stripe|card|checkout/i.test(targetResult.html)) {
    console.log(`MANUAL PAYMENT REQUIRED: ${primary.absoluteUrl}`);
  }

  return {
    ctaFound: "yes",
    ctaTarget: primary.absoluteUrl,
    params: paramReasons.length ? "fail" : "pass",
    flowOpens,
    reasons,
  };
}

async function checkSitemap(check: UrlCheck): Promise<"yes" | "no" | "n/a"> {
  if (!check.sitemap) return "n/a";
  const sitemap = await fetchSitemap(check.url);
  if (!sitemap) return "no";
  const slug = pathSlug(check.url);
  return sitemap.includes(slug) ? "yes" : "no";
}

async function assertAdminNotInSitemap(check: UrlCheck, reasons: string[]): Promise<void> {
  const sitemap = await fetchSitemap(check.url);
  const slug = pathSlug(check.url);
  if (sitemap && sitemap.includes(slug)) {
    reasons.push("admin route appears in sitemap");
  }
}

async function runCheck(check: UrlCheck): Promise<Row> {
  const result = await fetchPage(check.url);
  const reasons: string[] = [];
  const noindex = result.status !== 0 ? (hasNoindex(result) ? "yes" : "no") : "n/a";
  const links = extractLinks(result.html, result.finalUrl || check.url);
  const metadataAudit = auditMetadata(check, result);
  const schemaAudit = auditSchema(check, result);
  let sitemap = await checkSitemap(check);

  if (result.error) reasons.push(result.error);
  if (result.status === 0) reasons.push("fetch failed");
  if (result.status === 404) reasons.push("404");
  if (result.status === 500) reasons.push("500");
  if (isUnrelatedHomepage(check.url, result.finalUrl)) reasons.push(`redirected to homepage ${result.finalUrl}`);

  if (check.kind === "public") {
    if (result.status !== 200) reasons.push(`public page status ${result.status}, expected 200`);
    if ((check.layers.includes("seo") || check.layers.includes("decision")) && noindex === "yes") reasons.push("public page has noindex");
    if (check.sitemap && sitemap !== "yes") reasons.push("missing from sitemap");
    reasons.push(...metadataAudit.issues);
    reasons.push(...schemaAudit.issues);
  }

  if (check.kind === "checkout") {
    if (result.status >= 500 || result.status === 404 || result.status === 0) reasons.push(`checkout unavailable status ${result.status}`);
  }

  if (check.kind === "telemetry") {
    if (result.status >= 500 || result.status === 0) reasons.push(`telemetry unavailable status ${result.status}`);
    if (schemaAudit.count) reasons.push("internal route exposes JSON-LD schema");
  }

  if (check.kind === "admin") {
    sitemap = "n/a";
    if ([404, 500, 0].includes(result.status)) reasons.push(`admin unavailable status ${result.status}`);
    await assertAdminNotInSitemap(check, reasons);
    if (result.status === 200 && noindex !== "yes") reasons.push("admin route is 200 without noindex");
    reasons.push(...schemaAudit.issues);
  }

  const cta = await checkCtaTarget(check, result, links);
  reasons.push(...cta.reasons);

  const row: Row = {
    label: check.label,
    url: check.url,
    status: `${result.status}${result.finalUrl !== check.url ? ` -> ${result.finalUrl}` : ""}`,
    noindex,
    sitemap,
    title: isPublicSeoCheck(check) ? (metadataAudit.metadata.title ? "yes" : "no") : "n/a",
    description: isPublicSeoCheck(check) ? (metadataAudit.metadata.description ? "yes" : "no") : "n/a",
    canonical: isPublicSeoCheck(check) ? (metadataAudit.metadata.canonical ? "yes" : "no") : "n/a",
    robots: noindex === "yes" ? "noindex" : result.status === 0 ? "n/a" : "index",
    jsonLd: check.kind === "checkout" ? "n/a" : schemaAudit.count ? "yes" : "no",
    schemaValid: check.kind === "checkout" ? "n/a" : schemaAudit.issues.length ? "no" : "yes",
    schemaTypes: schemaAudit.count ? schemaAudit.types.join(", ") || `${schemaAudit.count} JSON-LD block(s)` : "none",
    schemaViolations: schemaAudit.issues.join("; ") || "-",
    ctaFound: cta.ctaFound,
    ctaTarget: cta.ctaTarget,
    params: cta.params,
    flowOpens: cta.flowOpens,
    result: reasons.length ? "FAIL" : "PASS",
    reason: reasons.join("; ") || "-",
    layers: check.layers,
  };
  return row;
}

function printRow(row: Row): void {
  console.log(`\n${displayResultForRow(row)} ${row.label}`);
  console.log(`  url: ${row.url}`);
  console.log(`  status: ${row.status}`);
  console.log(`  robots: ${row.robots}`);
  console.log(`  sitemap: ${row.sitemap}`);
  console.log(`  title: ${row.title}`);
  console.log(`  description: ${row.description}`);
  console.log(`  canonical: ${row.canonical}`);
  console.log(`  jsonLd: ${row.jsonLd}`);
  console.log(`  schemaValid: ${row.schemaValid}`);
  console.log(`  schemaTypes: ${row.schemaTypes}`);
  console.log(`  schemaViolations: ${row.schemaViolations}`);
  console.log(`  CTA found: ${row.ctaFound}`);
  console.log(`  CTA target: ${row.ctaTarget}`);
  console.log(`  params: ${row.params}`);
  console.log(`  flow opens: ${row.flowOpens}`);
  console.log(`  reason: ${row.reason}`);
}

function isDccCriticalRow(row: Row): boolean {
  return new URL(row.url).hostname.replace(/^www\./, "") === "destinationcommandcenter.com";
}

function displayResultForRow(row: Row): RowDisplayResult {
  if (row.result === "PASS") return "PASS";
  return isDccCriticalRow(row) ? "FAIL" : "WARN";
}

function printHardBlocker(blocker: HardDeployBlocker): void {
  console.log(`\n${blocker.result} ${blocker.label}`);
  console.log(`  reason: ${blocker.reason}`);
}

function checkRequiredEnv(): HardDeployBlocker {
  const missing = REQUIRED_DEPLOY_ENV.filter((name) => !process.env[name]?.trim());
  return {
    label: "Required deploy environment",
    result: missing.length ? "FAIL" : "PASS",
    reason: missing.length ? `missing ${missing.join(", ")}` : "all required deploy env vars are present",
  };
}

function checkInternalApiSourceLock(): HardDeployBlocker {
  const proxySource = fs.readFileSync("proxy.ts", "utf8");
  const authSource = fs.readFileSync("lib/api/internalAuth.ts", "utf8");
  const issues: string[] = [];

  if (!proxySource.includes('pathname.startsWith("/api/internal/")')) {
    issues.push("proxy does not guard /api/internal/*");
  }
  if (!proxySource.includes("INTERNAL_API_SECRET")) {
    issues.push("proxy guard does not require INTERNAL_API_SECRET");
  }
  if (
    !proxySource.includes('pathname === "/api/internal/satellite-handoffs/events"') ||
    !proxySource.includes("x-dcc-satellite-token")
  ) {
    issues.push("satellite webhook token exception is missing");
  }
  if (/if\s*\([^)]*!cronSecret[^)]*\)\s*return\s+true/.test(authSource) || /return\s+true\s*;/.test(authSource)) {
    issues.push("internal auth helper contains fail-open return");
  }
  if (!/if\s*\(\s*!internalSecret\s*\)\s*return\s+false/.test(authSource)) {
    issues.push("internal auth helper does not fail closed when INTERNAL_API_SECRET is missing");
  }

  return {
    label: "Internal API fail-closed source lock",
    result: issues.length ? "FAIL" : "PASS",
    reason: issues.join("; ") || "all /api/internal/* traffic is guarded by INTERNAL_API_SECRET",
  };
}

async function checkTelemetryIntegrity(): Promise<HardDeployBlocker> {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) {
    return {
      label: "Telemetry and payment completion smoke",
      result: "FAIL",
      reason: "INTERNAL_API_SECRET is missing; cannot post authenticated telemetry smoke events",
    };
  }

  const sessionId = `smoke_${Date.now()}`;
  const url = `${DCC_ORIGIN}/api/internal/corridor-events`;
  const failures: string[] = [];

  for (const eventName of REQUIRED_TELEMETRY_EVENTS) {
    const result = await postJson(
      url,
      {
        corridor_id: "welcometotheswamp",
        event_name: eventName,
        occurred_at: new Date().toISOString(),
        session_id: sessionId,
        handoff_id: `${sessionId}_${eventName}`,
        source_page: "/system-integrity-check",
        target_path: "/deploy-blocker-smoke",
        metadata: {
          test: true,
          smoke: true,
          deploy_blocker: true,
        },
      },
      { "x-internal-secret": secret },
    );

    if (!result.ok) {
      failures.push(`${eventName} status=${result.status}${result.error ? ` ${result.error}` : ""}`);
    }
  }

  return {
    label: "Telemetry and payment completion smoke",
    result: failures.length ? "FAIL" : "PASS",
    reason: failures.length
      ? failures.join("; ")
      : `accepted ${REQUIRED_TELEMETRY_EVENTS.join(", ")} including booking_completed`,
  };
}

async function checkDeployEmail(): Promise<HardDeployBlocker> {
  const apiKey = process.env.DCC_RESEND_API_KEY?.trim();
  const to = process.env.DEPLOY_TEST_EMAIL_TO?.trim();
  const from = process.env.DEPLOY_TEST_EMAIL_FROM?.trim() || process.env.PRESS_FROM_EMAIL?.trim();
  const issues: string[] = [];
  if (!apiKey) issues.push("missing DCC_RESEND_API_KEY");
  if (!to) issues.push("missing DEPLOY_TEST_EMAIL_TO");
  if (!from) issues.push("missing DEPLOY_TEST_EMAIL_FROM or PRESS_FROM_EMAIL");
  if (issues.length) {
    return {
      label: "Deploy test email",
      result: "FAIL",
      reason: issues.join("; "),
    };
  }

  const result = await postJson(
    "https://api.resend.com/emails",
    {
      from,
      to,
      subject: `DCC deploy email check ${new Date().toISOString()}`,
      html: "<p>DCC deploy blocker email verification.</p>",
    },
    { Authorization: `Bearer ${apiKey}` },
  );

  if (!result.ok) {
    return {
      label: "Deploy test email",
      result: "FAIL",
      reason: `Resend returned status=${result.status}${result.html ? ` body=${result.html.slice(0, 240)}` : ""}`,
    };
  }

  return {
    label: "Deploy test email",
    result: "PASS",
    reason: "provider accepted deploy verification email",
  };
}

async function runHardDeployBlockers(): Promise<HardDeployBlocker[]> {
  return [
    checkRequiredEnv(),
    checkInternalApiSourceLock(),
    await checkTelemetryIntegrity(),
    await checkDeployEmail(),
  ];
}

async function main() {
  console.log("SYSTEM INTEGRITY REPORT");
  console.log(`Started: ${new Date().toISOString()}`);

  const hardBlockers = await runHardDeployBlockers();

  const rows: Row[] = [];
  for (const check of CHECKS) {
    rows.push(await runCheck(check));
  }

  console.log("\nHARD DEPLOY BLOCKERS");
  for (const blocker of hardBlockers) printHardBlocker(blocker);

  for (const row of rows) printRow(row);

  const dccRows = rows.filter(isDccCriticalRow);
  const networkRows = rows.filter((row) => !isDccCriticalRow(row));

  const layerPass = new Map<Layer, boolean>();
  const layers: Layer[] = ["seo", "decision", "continuity", "execution", "checkout", "telemetry", "ops"];
  for (const layer of layers) {
    layerPass.set(
      layer,
      dccRows.filter((row) => row.layers.includes(layer)).every((row) => row.result === "PASS"),
    );
  }

  const dccRouteFailures = dccRows.filter((row) => row.result === "FAIL");
  const networkWarnings = networkRows.filter((row) => row.result === "FAIL");
  const hardFailures = hardBlockers.filter((blocker) => blocker.result === "FAIL");

  console.log("\nSUMMARY");
  console.log(`HARD DEPLOY BLOCKERS: ${hardFailures.length ? "FAIL" : "PASS"}`);
  console.log(`DCC ROUTES: ${dccRouteFailures.length ? "FAIL" : "PASS"}`);
  console.log(`SEO: ${layerPass.get("seo") ? "PASS" : "FAIL"}`);
  console.log(`DECISION: ${layerPass.get("decision") ? "PASS" : "FAIL"}`);
  console.log(`CONTINUITY: ${layerPass.get("continuity") ? "PASS" : "FAIL"}`);
  console.log(`EXECUTION: ${layerPass.get("execution") ? "PASS" : "FAIL"}`);
  console.log(`CHECKOUT: ${layerPass.get("checkout") ? "PASS" : "FAIL"}`);
  console.log(`TELEMETRY: ${layerPass.get("telemetry") ? "PASS" : "FAIL"}`);
  console.log(`OPS: ${layerPass.get("ops") ? "PASS" : "FAIL"}`);
  console.log(`NETWORK HYGIENE: ${networkWarnings.length ? "WARN" : "PASS"}`);

  if (networkWarnings.length) {
    console.log("\nNETWORK HYGIENE WARNINGS");
    for (const warning of networkWarnings) {
      console.log(`- ${warning.label}: ${warning.reason}`);
    }
  }

  if (dccRouteFailures.length || hardFailures.length) {
    console.log("\nDCC DEPLOY BLOCKED");
    console.log("Blockers:");
    for (const blocker of hardFailures) {
      console.log(`- ${blocker.label}: ${blocker.reason}`);
    }
    for (const blocker of dccRouteFailures) {
      console.log(`- ${blocker.label}: ${blocker.reason}`);
    }
    process.exit(1);
  } else {
    console.log("\nDCC DEPLOY ALLOWED");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("SYSTEM INTEGRITY CHECK CRASHED");
  console.error(error);
  process.exit(1);
});
