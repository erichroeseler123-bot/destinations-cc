import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PROD_ORIGIN = "https://www.welcometoneworleanstours.com";

const REQUIRED_ROOT_PATHS = [
  "/",
  "/guides",
  "/tours",
  "/help-me-choose",
  "/compare",
  "/french-quarter-welcome-stop",
] as const;

const INTENT_TILE_PATHS = [
  "/city-tours",
  "/swamp-tours",
  "/riverboat-cruises",
  "/plantation-tours",
  "/food-tours",
  "/ghost-tours",
] as const;

type TourAuditConfig = {
  slug: string;
  itemId?: string;
  flowId?: string;
  variantCount?: number;
  expectedAsn: "aktourcenter" | "welcometoneworleanstours";
  expectedRef?: string;
};

const TOURS: TourAuditConfig[] = [
  { slug: "city-tour-of-new-orleans", itemId: "51942", flowId: "4344", expectedAsn: "aktourcenter" },
  { slug: "oak-alley-or-laura-plantation-tour", itemId: "83002", flowId: "4344", expectedAsn: "aktourcenter" },
  { slug: "covered-tour-boat", itemId: "590176", flowId: "392449", expectedAsn: "aktourcenter" },
  { slug: "ragin-cajun-airboat-options", flowId: "940162", expectedAsn: "aktourcenter" },
  { slug: "all-day-city-plantation-combo", itemId: "51953", flowId: "4344", expectedAsn: "aktourcenter" },
  { slug: "covered-boat-plantation-combo", itemId: "603090", flowId: "392449", expectedAsn: "aktourcenter" },
  { slug: "evening-jazz-cruise", variantCount: 4, expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "daytime-jazz-cruise", variantCount: 6, expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "sunday-jazz-brunch-cruise", variantCount: 3, expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "oak-alley-plantation-tour-grey-line", itemId: "561477", flowId: "1578687", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "whitney-plantation-tour", itemId: "561539", flowId: "1578687", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "swamp-bayou-tour", itemId: "561484", flowId: "1220421", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "small-airboat-swamp-adventure", itemId: "561547", flowId: "1220421", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "large-airboat-swamp-adventure", itemId: "562175", flowId: "1220421", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "swamp-boat-oak-alley-combo", itemId: "562191", flowId: "1220421", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "swamp-boat-whitney-combo", itemId: "670738", flowId: "1220421", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "cocktail-walking-tour", itemId: "682856", flowId: "1578708", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "craft-cocktail-walking-tour", itemId: "562204", flowId: "1578708", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "ghosts-spirits-walking-tour", itemId: "562250", flowId: "1578708", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "city-cemetery-garden-district-tour", itemId: "564661", flowId: "1578708", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
  { slug: "city-of-new-orleans-riverboat-cruise", itemId: "694782", flowId: "1621347", expectedAsn: "welcometoneworleanstours", expectedRef: "WelcomeToNewOrleansTours" },
];

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
}

function extractFareHarborLinks(html: string) {
  const out = new Set<string>();
  for (const match of html.matchAll(/href=["']([^"']*fareharbor\.com\/embeds\/book\/[^"']+)["']/gi)) {
    out.add(decodeHtml(match[1]));
  }
  return [...out];
}

function mappingOk(config: TourAuditConfig, html: string, links: string[]) {
  if (config.itemId && !html.includes(`/items/${config.itemId}/`)) return false;
  if (!config.itemId && config.flowId) {
    const hasFlow = html.includes(`flow=${config.flowId}`) || html.includes(`flow%3D${config.flowId}`);
    if (!hasFlow) return false;
  }
  if (config.variantCount && links.length < config.variantCount) return false;
  return true;
}

function attributionOk(config: TourAuditConfig, links: string[]) {
  if (!links.length) return false;
  return links.every((href) => {
    try {
      const url = new URL(href);
      if (url.searchParams.get("asn") !== config.expectedAsn) return false;
      if (config.expectedRef && url.searchParams.get("ref") !== config.expectedRef) return false;
      return true;
    } catch {
      return false;
    }
  });
}

async function fetchPath(path: string) {
  try {
    const response = await fetch(`${PROD_ORIGIN}${path}${path.includes("?") ? "&" : "?"}audit=${Date.now()}`, {
      cache: "no-store",
      headers: { "User-Agent": "WNO production audit" },
    });
    const text = await response.text();
    return { path, status: response.status, ok: response.ok, text };
  } catch (error) {
    return { path, status: null, ok: false, text: "", error: error instanceof Error ? error.message : "fetch_failed" };
  }
}

export async function GET() {
  const startedAt = Date.now();
  const sitemapResponse = await fetch(`${PROD_ORIGIN}/sitemap.xml?audit=${startedAt}`, { cache: "no-store" });
  const sitemapXml = sitemapResponse.ok ? await sitemapResponse.text() : "";
  const guidePaths = [...sitemapXml.matchAll(/<loc>https:\/\/www\.welcometoneworleanstours\.com(\/guides\/[^<]+)<\/loc>/g)]
    .map((match) => match[1])
    .filter((path) => path !== "/guides/internal-qa");

  const routePaths = [...new Set([...REQUIRED_ROOT_PATHS, ...INTENT_TILE_PATHS, ...guidePaths])];
  const routeResults = await Promise.all(routePaths.map(fetchPath));

  const tourResults = await Promise.all(
    TOURS.map(async (config) => {
      const result = await fetchPath(`/tours/${config.slug}`);
      const links = extractFareHarborLinks(result.text);
      const mapping = result.ok && mappingOk(config, result.text, links);
      const attribution = result.ok && attributionOk(config, links);
      return {
        slug: config.slug,
        status: result.status,
        routeOk: result.ok,
        fareHarborLinks: links.length,
        mappingOk: mapping,
        attributionOk: attribution,
        expectedAsn: config.expectedAsn,
        expectedRef: config.expectedRef ?? null,
        pass: Boolean(result.ok && links.length > 0 && mapping && attribution),
      };
    }),
  );

  const routeFailures = routeResults.filter((result) => !result.ok).map(({ path, status, error }) => ({ path, status, error }));
  const tourFailures = tourResults.filter((result) => !result.pass);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    productionOrigin: PROD_ORIGIN,
    durationMs: Date.now() - startedAt,
    sitemap: { ok: sitemapResponse.ok, status: sitemapResponse.status, indexedGuidesChecked: guidePaths.length },
    routes: {
      checked: routeResults.length,
      passed: routeResults.length - routeFailures.length,
      failed: routeFailures.length,
      failures: routeFailures,
    },
    bookingAudit: {
      checked: tourResults.length,
      passed: tourResults.length - tourFailures.length,
      failed: tourFailures.length,
      failures: tourFailures,
      results: tourResults,
    },
    commission: {
      verified: false,
      note: "Affiliate ASN/ref correctness is verified from live booking URLs here. The commercial commission percentage itself is account-side FareHarbor data and is not exposed by the public booking links.",
    },
    pass: sitemapResponse.ok && routeFailures.length === 0 && tourFailures.length === 0,
  }, { headers: { "Cache-Control": "no-store" } });
}
