import { NextResponse } from "next/server";
import { getExperienceGraphGovernanceSummary } from "@/app/new-orleans/data/experienceGraphGovernance";
import { WNO_OPERATOR_ENTITIES } from "@/app/new-orleans/data/operatorRegistry";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORIGIN = "https://www.welcometoneworleanstours.com";

const HUBS = [
  "/city-tours",
  "/swamp-tours",
  "/riverboat-cruises",
  "/plantation-tours",
  "/food-tours",
  "/ghost-tours",
  "/garden-district-tours",
  "/jazz-music-tours",
] as const;

const COMPARISONS = [
  "/compare/covered-swamp-boat-vs-airboat",
  "/compare/whitney-vs-oak-alley",
] as const;

const TRUST_PATHS = ["/how-we-choose", "/affiliate-disclosure", "/about"] as const;
const LIVE_PATHS = ["/guides/things-to-do-in-new-orleans-today", "/guides/tonight", "/api/live-context"] as const;
const ACQUISITION_PATHS = ["/guides/new-orleans-without-a-car", "/guides/jazz-cruise-dinner-or-sightseeing"] as const;

async function fetchState(path: string) {
  try {
    const response = await fetch(`${ORIGIN}${path}${path.includes("?") ? "&" : "?"}completionAudit=${Date.now()}`, {
      cache: "no-store",
      headers: { "User-Agent": "WNO completion audit" },
    });
    const text = await response.text();
    return { path, status: response.status, ok: response.ok, text };
  } catch (error) {
    return { path, status: null, ok: false, text: "", error: error instanceof Error ? error.message : "fetch_failed" };
  }
}

function passIfAll(results: Array<{ ok: boolean }>) {
  return results.length > 0 && results.every((result) => result.ok);
}

export async function GET() {
  const startedAt = Date.now();
  const graph = getExperienceGraphGovernanceSummary();
  const operatorPaths = WNO_OPERATOR_ENTITIES.map((operator) => `/operators/${operator.slug}`);

  const [productionAudit, sitemap, ...routeResults] = await Promise.all([
    fetchState("/api/internal/wno-production-audit"),
    fetchState("/sitemap.xml"),
    ...[...HUBS, ...COMPARISONS, ...TRUST_PATHS, ...LIVE_PATHS, ...ACQUISITION_PATHS, ...operatorPaths].map(fetchState),
  ]);

  const byPath = new Map(routeResults.map((result) => [result.path, result]));
  const hubResults = HUBS.map((path) => byPath.get(path)!).filter(Boolean);
  const comparisonResults = COMPARISONS.map((path) => byPath.get(path)!).filter(Boolean);
  const trustResults = TRUST_PATHS.map((path) => byPath.get(path)!).filter(Boolean);
  const liveResults = LIVE_PATHS.map((path) => byPath.get(path)!).filter(Boolean);
  const acquisitionResults = ACQUISITION_PATHS.map((path) => byPath.get(path)!).filter(Boolean);
  const operatorResults = operatorPaths.map((path) => byPath.get(path)!).filter(Boolean);

  let production: any = null;
  try { production = JSON.parse(productionAudit.text); } catch {}
  let liveContext: any = null;
  try { liveContext = JSON.parse(byPath.get("/api/live-context")?.text || "null"); } catch {}

  const sitemapHasTrust = sitemap.text.includes(`${ORIGIN}/how-we-choose`);
  const sitemapHasOperators = operatorPaths.every((path) => sitemap.text.includes(`${ORIGIN}${path}`));
  const todayHtml = byPath.get("/guides/things-to-do-in-new-orleans-today")?.text || "";
  const tonightHtml = byPath.get("/guides/tonight")?.text || "";
  const comparisonsStructured = comparisonResults.every((result) => /<table|Comparison|Choose/i.test(result.text));

  const checkpoints = [
    {
      id: 1,
      name: "Experience Graph governance",
      status: graph.total === 21 ? "pass" : "fail",
      proof: { governed: graph.total, publishable: graph.publishable, needsVerification: graph.needsVerification },
      note: "Pass means all 21 are governed. It does not mean every field is verified; unknown values remain explicitly unverified.",
    },
    {
      id: 2,
      name: "Authoritative inventory verification",
      status: graph.needsVerification === 0 ? "pass" : "partial",
      proof: { publishable: graph.publishable, needsVerification: graph.needsVerification, slugsNeedingVerification: graph.slugsNeedingVerification },
      note: "Detailed source verification is still incomplete while governed records remain NEEDS_VERIFICATION.",
    },
    {
      id: 3,
      name: "Help Me Choose constraint solver",
      status: "partial",
      proof: { route: "/help-me-choose", hardAirboatEligibility: true, governedTimeGate: true },
      note: "Hard airboat eligibility and governed time gates are implemented. Persona/browser regression verification remains a separate QA proof.",
    },
    {
      id: 4,
      name: "Eight commercial decision hubs",
      status: passIfAll(hubResults) ? "pass" : "fail",
      proof: hubResults.map(({ path, status, ok }) => ({ path, status, ok })),
    },
    {
      id: 5,
      name: "Experience dossier tour pages",
      status: production?.bookingAudit?.passed === 21 ? "partial" : "fail",
      proof: { liveBookingPagesPassing: production?.bookingAudit?.passed ?? 0, governedDossierLogistics: true },
      note: "All 21 booking pages pass and share the governed dossier logistics block; detailed source verification is incomplete on records still marked unverified.",
    },
    {
      id: 6,
      name: "Structured comparison layer",
      status: passIfAll(comparisonResults) && comparisonsStructured ? "pass" : "fail",
      proof: comparisonResults.map(({ path, status, ok }) => ({ path, status, ok })),
    },
    {
      id: 7,
      name: "Canonical high-intent planning layer",
      status: production?.sitemap?.ok && production?.routes?.failed === 0 ? "partial" : "fail",
      proof: { sitemapOk: production?.sitemap?.ok ?? false, indexedGuidesChecked: production?.sitemap?.indexedGuidesChecked ?? 0, routeFailures: production?.routes?.failed ?? null },
      note: "Route/index coverage is verified; duplicate-title/thin-content crawl still needs a dedicated SEO crawl proof.",
    },
    {
      id: 8,
      name: "Today / Tonight live products",
      status: passIfAll(liveResults) && liveContext?.period && liveContext?.rainRisk ? "partial" : "fail",
      proof: { liveRoutes: liveResults.map(({ path, status, ok }) => ({ path, status, ok })), period: liveContext?.period ?? null, rainRisk: liveContext?.rainRisk ?? null, heatRisk: liveContext?.heatRisk ?? null },
      note: "Today is daypart/weather-aware and Tonight has a live event feed. Authorized live FareHarbor availability/cutoff suppression is not yet available.",
    },
    {
      id: 9,
      name: "Time-budget system",
      status: "partial",
      proof: { governedDoorToDoorPreferred: true, hardTimeExclusionImplemented: true },
      note: "Verified door-to-door time now wins in chooser eligibility. Remaining unverified products cannot yet provide complete 21-product door-to-door coverage.",
    },
    {
      id: 10,
      name: "Location intelligence",
      status: "partial",
      proof: { frenchQuarterOrientation: true, gardenDistrictHub: byPath.get("/garden-district-tours")?.ok ?? false },
      note: "Location-aware surfaces exist, but a dedicated reachability/map audit is still required before this checkpoint is green.",
    },
    {
      id: 11,
      name: "Public operator entity layer",
      status: passIfAll(operatorResults) && operatorResults.length > 0 ? "pass" : "fail",
      proof: { operators: WNO_OPERATOR_ENTITIES.map((operator) => ({ slug: operator.slug, name: operator.name, products: operator.products.length })), routes: operatorResults.map(({ path, status, ok }) => ({ path, status, ok })) },
    },
    {
      id: 12,
      name: "Trust and provenance",
      status: passIfAll(trustResults) && sitemapHasTrust ? "pass" : "fail",
      proof: { routes: trustResults.map(({ path, status, ok }) => ({ path, status, ok })), howWeChooseInSitemap: sitemapHasTrust },
    },
    {
      id: 13,
      name: "Technical SEO",
      status: "partial",
      proof: { sitemapOk: sitemap.ok, trustIndexed: sitemapHasTrust, operatorsIndexed: sitemapHasOperators },
      note: "Canonical/sitemap architecture is active; duplicate title, missing-H1, structured-data validation and crawl-level checks remain to be proven.",
    },
    {
      id: 14,
      name: "Decision-driven internal linking",
      status: "partial",
      proof: { operatorLinksFromDossiers: true, howWeChooseLinksFromDossiers: true },
      note: "Decision links are present across hubs, comparisons and dossiers; orphan/money-page graph audit remains to be run.",
    },
    {
      id: 15,
      name: "Informational imagery",
      status: "manual",
      proof: null,
      note: "Requires asset-level uniqueness, dimensions, byte-size and rendered-context audit.",
    },
    {
      id: 16,
      name: "Funnel instrumentation",
      status: "partial",
      proof: { dccTelemetryRoute: true, chooserEvents: true, bookingClickEvents: true, distributionSourceParameter: true },
      note: "Code path is wired and persisted to DCC telemetry. External analytics/GA4 end-to-end receipt still requires account-side proof.",
    },
    {
      id: 17,
      name: "Acquisition loop",
      status: passIfAll(acquisitionResults) ? "partial" : "fail",
      proof: { decisionPages: acquisitionResults.map(({ path, status, ok }) => ({ path, status, ok })), sourceTrackingReady: true },
      note: "Acquisition pages and source tagging exist; active channel traffic is an operating metric, not a code-only pass.",
    },
    {
      id: 18,
      name: "Distribution system",
      status: "manual",
      proof: null,
      note: "Subscriber/send history and physical/partner distribution require operating evidence outside the public app.",
    },
    {
      id: 19,
      name: "Production QA gate",
      status: production?.pass === true ? "partial" : "fail",
      proof: { productionAuditPass: production?.pass ?? false, routes: production?.routes ?? null, bookingAudit: production?.bookingAudit ? { checked: production.bookingAudit.checked, passed: production.bookingAudit.passed, failed: production.bookingAudit.failed } : null },
      note: "Current route and booking audit passes. Lighthouse threshold and seven-day runtime-error proof remain separate requirements.",
    },
  ];

  const counts = checkpoints.reduce((acc, checkpoint) => {
    acc[checkpoint.status] = (acc[checkpoint.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    definition: "A pass is granted only when the evidence this endpoint can verify is complete. Partial/manual statuses are intentionally not promoted to pass.",
    counts,
    checkpoints,
  }, { headers: { "Cache-Control": "no-store" } });
}
