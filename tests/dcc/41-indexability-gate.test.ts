import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { getGovernedRobotsTag, isInternalCanaryPath, proxy } from "@/proxy";
import { INDEXABLE_SURFACE_PATHS, isIndexableSurfacePath } from "@/src/data/indexable-surface";
import {
  INTERNAL_CANARY_ROUTES,
  PUBLICATION_COMPILER_VERSION,
  PUBLICATION_MANIFEST,
  PUBLICATION_POLICY_VERSION,
  evaluateCoordinatePublishability,
  evaluateGuideCategoryPublishability,
  evaluateGuidePublishability,
  evaluateTravelReferenceNodePublishability,
  getPublicationManifestEntry,
  listIndexablePublicationEntries,
} from "@/src/data/publication-manifest";
import { buildDccSitemapXml, listDccSitemapPaths } from "@/app/sitemap.xml/handler";
import { getAllTravelReferenceNodes } from "@/lib/dcc/travelReferenceCore";
import { DISCOVERABLE_LOCATIONS, isIndexableCoordinate } from "@/lib/dcc/locationDiscovery";
import { getPublishedDecisionGuide } from "@/src/data/published-decision-guides";
import { getDecisionCategory } from "@/src/data/decision-taxonomy";

test("governed document paths emit index-follow only when indexable", () => {
  for (const pathname of ["/", "/about", "/developers", ...INDEXABLE_SURFACE_PATHS.slice(0, 3)]) {
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(pathname), true);
    assert.equal(getGovernedRobotsTag(pathname), "index, follow");
  }
});

test("published swamp search entry pages emit index-follow rather than contradicting the sitemap", () => {
  for (const pathname of [
    "/guides",
    "/guides/category/new-orleans",
    "/new-orleans-swamp-tours",
    "/guides/new-orleans-airboat-vs-covered-swamp-boat",
    "/guides/new-orleans-swamp-tour-with-kids",
    "/guides/new-orleans-swamp-tour-pickup-vs-self-drive",
    "/guides/new-orleans-small-vs-large-airboat",
    "/guides/best-time-of-day-for-new-orleans-swamp-tour",
    "/guides/is-a-new-orleans-swamp-tour-worth-it",
  ]) {
    assert.equal(getGovernedRobotsTag(pathname), "index, follow", pathname);
  }
});

test("generic document surfaces emit noindex-nofollow when route governance does not expose them", () => {
  for (const pathname of [
    "/sedona/jeep-tours",
    "/new-orleans/swamp-tours",
    "/grand-canyon",
    "/hoover-dam",
    "/helicopter-tours",
    "/guides/not-a-published-guide",
    "/guides/category/not-a-category",
    "/admin",
    "/dashboard",
    "/location/29.95110/-90.07150",
  ]) {
    assert.equal(INDEXABLE_SURFACE_PATHS.includes(pathname), false);
    assert.equal(getGovernedRobotsTag(pathname), "noindex, nofollow");
  }
});

test("non-document paths and go redirects do not receive document robots governance", () => {
  for (const pathname of [
    "/api/public/network-feed",
    "/_next/static/app.js",
    "/favicon.ico",
    "/go/juneau/helicopter",
  ]) {
    assert.equal(getGovernedRobotsTag(pathname), null);
  }
});

test("versioned publication manifest enforces explicit acceptance states, blocking reason codes, and evidence snapshot IDs", () => {
  assert.ok(PUBLICATION_MANIFEST.length > 0);
  const statesSeen = new Set<string>();

  for (const record of PUBLICATION_MANIFEST) {
    statesSeen.add(record.acceptanceState);
    assert.ok(record.route.startsWith("/"), `route must start with /: ${record.route}`);
    assert.ok(
      record.canonicalUrl.startsWith("https://destinationcommandcenter.com"),
      `canonicalUrl must use canonical DCC origin: ${record.canonicalUrl}`,
    );
    assert.equal(record.policyVersion, PUBLICATION_POLICY_VERSION);
    assert.equal(record.compilerVersion, PUBLICATION_COMPILER_VERSION);
    assert.match(record.materialChangeDate, /^\d{4}-\d{2}-\d{2}$/);

    if (record.acceptanceState === "public_indexable") {
      assert.equal(record.publicationState, "published");
      assert.equal(record.indexingState, "index_follow");
      assert.equal(record.lifecyclePolicy, "serve_200_index");
      assert.equal(record.includeInSitemap, true);
      assert.equal(record.robotsTag, "index, follow");
      assert.equal(record.blockingReasonCodes.length, 0, `${record.route} must have zero blocking reasons`);
      assert.ok(record.evidenceSnapshotId, `${record.route} must reference an evidenceSnapshotId`);
      assert.equal(getGovernedRobotsTag(record.route), "index, follow");
      assert.equal(isIndexableSurfacePath(record.route), true);
    } else {
      assert.equal(record.indexingState, "noindex_nofollow");
      assert.equal(record.includeInSitemap, false);
      assert.equal(record.robotsTag, "noindex, nofollow");
      assert.ok(
        record.blockingReasonCodes.length > 0,
        `${record.route} (${record.acceptanceState}) must declare blockingReasonCodes`,
      );
      assert.equal(getGovernedRobotsTag(record.route), "noindex, nofollow");
      assert.equal(isIndexableSurfacePath(record.route), false);
    }
  }

  for (const expectedState of [
    "public_indexable",
    "public_non_indexable",
    "internal_canary",
    "withdrawn_historical",
  ]) {
    assert.equal(
      statesSeen.has(expectedState),
      true,
      `PUBLICATION_MANIFEST must explicitly cover acceptance state ${expectedState}`,
    );
  }

  // Verify specific acceptance state examples
  const askEntry = getPublicationManifestEntry("/ask");
  assert.equal(askEntry?.acceptanceState, "public_non_indexable");
  assert.ok(askEntry?.blockingReasonCodes.includes("utility_or_interactive_surface"));

  const seasonalOperatorEntry = getPublicationManifestEntry("/operators/virgin-islands-ecotours");
  assert.equal(seasonalOperatorEntry?.acceptanceState, "public_non_indexable");
  assert.ok(seasonalOperatorEntry?.blockingReasonCodes.includes("missing_identity_resolution"));
  assert.ok(seasonalOperatorEntry?.blockingReasonCodes.includes("incomplete_operator_universe"));

  const canaryEntry = getPublicationManifestEntry("/internal/dashboard");
  assert.equal(canaryEntry?.acceptanceState, "internal_canary");
  assert.ok(canaryEntry?.blockingReasonCodes.includes("internal_canary_only"));

  const withdrawnEntry = getPublicationManifestEntry("/guides/juneau-glacier-landing-vs-scenic-flight");
  assert.equal(withdrawnEntry?.acceptanceState, "withdrawn_historical");
  assert.ok(withdrawnEntry?.blockingReasonCodes.includes("withdrawn_or_superseded"));
});

test("no DCC sitemap URL can ever return noindex from proxy robots governance", () => {
  const sitemapPaths = listDccSitemapPaths();
  const indexableEntries = listIndexablePublicationEntries();
  assert.equal(sitemapPaths.length, indexableEntries.length);

  const xml = buildDccSitemapXml();
  const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locMatches.length, sitemapPaths.length);

  for (const loc of locMatches) {
    const url = new URL(loc);
    const pathname = url.pathname || "/";
    const robotsTag = getGovernedRobotsTag(pathname);
    assert.equal(
      robotsTag,
      "index, follow",
      `Sitemap URL ${loc} (${pathname}) returned '${robotsTag}' instead of 'index, follow'`,
    );
    assert.doesNotMatch(
      robotsTag || "",
      /noindex/i,
      `Sitemap URL ${loc} must never return noindex`,
    );
    const manifestEntry = getPublicationManifestEntry(pathname);
    assert.ok(manifestEntry, `Sitemap path ${pathname} must exist in PUBLICATION_MANIFEST`);
    assert.equal(manifestEntry.acceptanceState, "public_indexable");
    assert.equal(manifestEntry.blockingReasonCodes.length, 0);
  }
});

test("publication manifest compiler dynamically derives route states from authoritative evidence and universe state", () => {
  // 1. TravelReferenceNode compiler demotes node routes when a citation is expired or withdrawn
  const juneauNode = getAllTravelReferenceNodes().find((n) => n.canonicalPath === "/juneau");
  assert.ok(juneauNode);
  const healthyNodeRecords = evaluateTravelReferenceNodePublishability(
    juneauNode,
    new Date("2026-04-10T00:00:00Z"),
  );
  assert.ok(healthyNodeRecords.every((r) => r.acceptanceState === "public_indexable"));

  const expiredNodeRecords = evaluateTravelReferenceNodePublishability(
    juneauNode,
    new Date("2028-01-01T00:00:00Z"),
  );
  assert.ok(expiredNodeRecords.every((r) => r.acceptanceState === "public_non_indexable"));
  assert.ok(
    expiredNodeRecords[0].blockingReasonCodes.includes("blocking_defect_unresolved"),
  );
  assert.ok(
    expiredNodeRecords[0].blockingReasonCodes.includes("unverified_evidence_snapshot"),
  );

  // 2. Guide compiler demotes guides when citations, unknowns, option universe, or identity resolution fail
  const baseGuide = getPublishedDecisionGuide("new-orleans-swamp-tour-with-kids");
  assert.ok(baseGuide);
  const healthyGuideRecord = evaluateGuidePublishability(baseGuide);
  assert.equal(healthyGuideRecord.acceptanceState, "public_indexable");

  const missingUnknownsRecord = evaluateGuidePublishability({
    ...baseGuide,
    assumptionsAndUnknowns: [],
  });
  assert.equal(missingUnknownsRecord.acceptanceState, "public_non_indexable");
  assert.ok(missingUnknownsRecord.blockingReasonCodes.includes("blocking_defect_unresolved"));

  const singleOptionRecord = evaluateGuidePublishability({
    ...baseGuide,
    optionComparison: baseGuide.optionComparison?.slice(0, 1),
  });
  assert.equal(singleOptionRecord.acceptanceState, "public_non_indexable");
  assert.ok(singleOptionRecord.blockingReasonCodes.includes("incomplete_operator_universe"));

  const unresolvedIdentityRecord = evaluateGuidePublishability({
    ...baseGuide,
    nextStep: {
      ...baseGuide.nextStep,
      href: "https://unregistered-example-domain.invalid/book",
    },
  });
  assert.equal(unresolvedIdentityRecord.acceptanceState, "public_non_indexable");
  assert.ok(unresolvedIdentityRecord.blockingReasonCodes.includes("missing_identity_resolution"));

  // 3. Category compiler requires >= 3 public_indexable guides in the category
  const nolaCategory = getDecisionCategory("new-orleans");
  assert.ok(nolaCategory);
  const thinCategoryRecord = evaluateGuideCategoryPublishability(nolaCategory, [healthyGuideRecord]);
  assert.equal(thinCategoryRecord.acceptanceState, "public_non_indexable");
  assert.ok(thinCategoryRecord.blockingReasonCodes.includes("corridor_unpromoted"));
});

test("raw /location/lat/lng coordinate routes are excluded from search indexing in favor of named place pages", () => {
  assert.equal(DISCOVERABLE_LOCATIONS.length, 16);
  for (const location of DISCOVERABLE_LOCATIONS) {
    assert.equal(isIndexableCoordinate(location.lat, location.lng), false);
    const compiled = evaluateCoordinatePublishability(location);
    assert.equal(compiled.acceptanceState, "public_non_indexable");
    assert.equal(compiled.includeInSitemap, false);
    assert.equal(getGovernedRobotsTag(compiled.route), "noindex, nofollow");
  }
});

test("all 15 internal canary routes are protected by 401 access control in proxy when unauthenticated", async () => {
  assert.equal(INTERNAL_CANARY_ROUTES.length, 15);
  for (const route of INTERNAL_CANARY_ROUTES) {
    assert.equal(isInternalCanaryPath(route), true, `${route} must be recognized as an internal canary path`);
    const req = new NextRequest(`https://destinationcommandcenter.com${route}`);
    const res = await proxy(req);
    assert.equal(res.status, 401, `Unauthenticated request to ${route} must return 401`);
    assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
  }
});
