import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  UNCLAIMED_OPERATOR_PROFILE_NOTICE,
  isOperatorDirectCheckoutConnected,
  isOperatorLiveAvailabilityConnected,
} from "../../../lib/dcc/shared/southeastAlaskaDirectoryContract";
import {
  findSoutheastAlaskaOperatorBySlugOrAlias,
  findSoutheastAlaskaPlaceByPortSlug,
  findSoutheastAlaskaTourByOperatorAndSlug,
  getSoutheastAlaskaDirectorySnapshot,
  resolveSoutheastAlaskaTourDirectRezgoHref,
} from "../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";
import {
  buildAffiliateUrl,
  buildDccHandoffAffiliateUrl,
} from "../lib/affiliate/links";
import {
  DCC_ALASKA_DIRECTORY_API_URL,
  LFSE_SITE_URL,
  buildOperatorProfileJsonLd,
  buildOperatorsDirectoryJsonLd,
  buildPortCategoryJsonLd,
  buildPortDetailJsonLd,
  buildPortsDirectoryJsonLd,
  buildSoutheastAlaskaHubJsonLd,
  buildTourDetailJsonLd,
} from "../lib/structuredData";
import {
  STANDARDIZED_TWO_HOUR_PLANNING_NOTE,
  buildPortDetailH1,
  classifyDestinationType,
} from "../lib/directoryDisplay";
import { LfseSiteHeader } from "../components/LfseSiteHeader";
import { OperatorIdentityMark } from "../components/OperatorIdentityMark";
import {
  JFD_CANCELED_BACKUP_URL,
  JFD_GLACIER_WEATHER_URL,
  JFD_WEIGHT_AND_SEATING_URL,
  JuneauFlightDeckPlanningCallout,
} from "../components/JuneauFlightDeckPlanningCallout";
import { LfsePortsDirectoryClient } from "../components/LfsePortsDirectoryClient";
import { LfseOperatorsDirectoryClient } from "../components/LfseOperatorsDirectoryClient";
import sitemap from "../app/sitemap";

const LFSE_ROOT = path.join(
  process.cwd(),
  "apps",
  "last-frontier-shore-excursions",
);

function readLfseFile(relPath: string): string {
  return fs.readFileSync(path.join(LFSE_ROOT, relPath), "utf8");
}

test("Priority A.1: Homepage removes commercially held Aleutian Ballad showcase & links into all 12 ports, categories, and 21 operators", () => {
  const homeSrc = readLfseFile("app/page.tsx");
  assert.doesNotMatch(
    homeSrc,
    /held-ketchikan-crab-vessel|Aleutian Ballad|Bering Sea Crab|Commercially Held/i,
    "Homepage must not feature commercially held Aleutian Ballad showcase card",
  );
  assert.doesNotMatch(
    homeSrc,
    /Southeast Alaska Knowledge Graph/i,
    "Homepage must replace internal 'Knowledge Graph' phrasing with traveler-friendly copy",
  );
  assert.match(homeSrc, /href="\/southeast-alaska"/);
  assert.match(homeSrc, /href="\/ports"/);
  assert.match(homeSrc, /href="\/operators"/);
});

test("Priority A.2: Regional Hub (/southeast-alaska), Ports (/ports), and Operators (/operators) remove held queues, internal jargon, raw route code strings, and 10% commission walls", () => {
  const hubSrc = readLfseFile("app/southeast-alaska/page.tsx");
  const portsSrc = readLfseFile("app/ports/page.tsx");
  const operatorsSrc = readLfseFile("app/operators/page.tsx");
  const operatorDetailSrc = readLfseFile("app/operators/[operatorSlug]/page.tsx");
  const claimPanelSrc = readLfseFile("components/OperatorProfileClaimPanel.tsx");

  // Regional hub checks
  assert.doesNotMatch(hubSrc, /coverage-ledger/i);
  assert.doesNotMatch(hubSrc, /Verified vs\. Held Coverage/i);
  assert.doesNotMatch(hubSrc, /heldPublicPlaces|heldOperators/);
  assert.doesNotMatch(hubSrc, /10%/);
  assert.doesNotMatch(hubSrc, /noindex/);
  // Must use clickable human link text rather than raw `>/ports/...<` code strings
  assert.doesNotMatch(hubSrc, />\s*\/ports\/[a-z-]+\s*</i);
  assert.match(hubSrc, /Sources and freshness/);

  // Ports hub checks
  assert.doesNotMatch(
    portsSrc,
    /Smaller Southeast Alaska Communities \(Unindexed Until Verified\)/i,
  );
  assert.doesNotMatch(portsSrc, /heldPlaces/);
  assert.doesNotMatch(portsSrc, /`noindex, follow`/);
  assert.doesNotMatch(portsSrc, /Southeast Alaska Knowledge Graph/i);
  assert.match(portsSrc, /Sources and freshness/);

  // Operators hub & profile checks
  assert.doesNotMatch(
    operatorsSrc,
    /Operators Held Pending Primary-Source Verification/i,
  );
  assert.doesNotMatch(operatorsSrc, /heldOperators|OperatorResearchQueue|Hold codes:/);
  assert.doesNotMatch(operatorsSrc, /10%/);
  assert.doesNotMatch(operatorDetailSrc, /10%\s+post-completion|10%\s+supplier/i);
  assert.doesNotMatch(claimPanelSrc, /10%/);
  assert.match(operatorsSrc, /Sources and freshness/);
  assert.match(operatorDetailSrc, /Sources and freshness/);
});

test("Priority A.3: SSR initial render of LfsePortsDirectoryClient (12 places) & LfseOperatorsDirectoryClient (21 operators) emits all verified links and zero held entities", () => {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const verifiedPlaces = snapshot.places.filter(
    (p) => p.gate.indexable && p.place.publicPortSlug,
  );
  const heldPlaceSlugs = snapshot.places
    .filter((p) => !p.gate.indexable && p.place.publicPortSlug)
    .map((p) => p.place.publicPortSlug!);

  assert.equal(verifiedPlaces.length, 12);
  assert.equal(heldPlaceSlugs.length, 6);

  const portItems = verifiedPlaces.map(({ place }) => {
    const t = classifyDestinationType(place);
    return {
      placeId: place.placeId,
      slug: place.publicPortSlug!,
      name: place.name,
      subRegionLabel: place.subRegionLabel,
      destinationTypeKey: t.key,
      destinationTypeLabel: t.label,
      heroImage: place.heroImage,
      heroImageAlt: place.heroImageAlt,
      heroImageCredit: place.heroImageCredit,
      hook: place.hook,
      typicalPortHours: place.typicalPortHours,
      facilitiesCount: place.docksAndAccessPoints.length,
      operatorsCount: 2,
      toursCount: 3,
      isScenicNonDisembarkation: place.placeType === "scenic_cruise_destination",
    };
  });

  // Verify all 5 destination type pills are represented across the 12 verified places
  const pillSet = new Set(portItems.map((i) => i.destinationTypeLabel));
  for (const expectedPill of [
    "Cruise Port Town",
    "Cruise Terminal",
    "Community & Harbor",
    "Scenic Cruising — Non-Disembarkation",
    "Gateway Community",
  ] as const) {
    assert.ok(pillSet.has(expectedPill), `Missing destination pill: ${expectedPill}`);
  }

  const portsHtml = renderToStaticMarkup(
    <LfsePortsDirectoryClient items={portItems} />,
  );
  assert.match(portsHtml, /Showing <strong>12<\/strong> of <strong>12<\/strong> verified destinations/);
  for (const item of portItems) {
    assert.match(
      portsHtml,
      new RegExp(`href="/ports/${item.slug}"`),
      `Initial SSR HTML on /ports must include /ports/${item.slug}`,
    );
  }
  for (const heldSlug of heldPlaceSlugs) {
    assert.doesNotMatch(
      portsHtml,
      new RegExp(`/ports/${heldSlug}\\b`),
      `Held place /ports/${heldSlug} must never render on /ports`,
    );
  }

  // Operators directory SSR check (all 21 verified operators, 0 held operators)
  const verifiedOperators = snapshot.operators.filter((o) => o.gate.indexable);
  const heldOperators = snapshot.operators.filter((o) => !o.gate.indexable);
  assert.equal(verifiedOperators.length, 21);
  assert.equal(heldOperators.length, 5);

  const operatorItems = verifiedOperators.map(
    ({ operator, liveAvailabilityConnected, directCheckoutConnected, tours }) => ({
      operatorId: operator.operatorId,
      slug: operator.slug,
      name: operator.name,
      tagline: operator.tagline,
      cruiseLogisticsSummary: operator.cruiseLogisticsSummary,
      heroImage: operator.heroImage,
      heroImageAlt: operator.heroImageAlt,
      heroImageCredit: operator.heroImageCredit,
      ports: operator.publicPortSlugs.map((s) => ({ slug: s, name: s })),
      categories: operator.categorySlugs.map((s) => ({ slug: s, label: s })),
      ownershipBadges: operator.verifiedOwnershipBadges.map((b) => b.label),
      liveDirectConnected: Boolean(
        liveAvailabilityConnected && directCheckoutConnected,
      ),
      activeToursCount: tours.filter((t) => !t.isCommerciallyHeld).length,
      yearEstablished: operator.yearEstablished ?? null,
    }),
  );

  const operatorsHtml = renderToStaticMarkup(
    <LfseOperatorsDirectoryClient
      items={operatorItems}
      portOptions={[{ slug: "juneau", name: "Juneau" }]}
      categoryOptions={[{ slug: "whale-watching", label: "Whale Watching" }]}
    />,
  );
  assert.match(
    operatorsHtml,
    /Showing <strong>21<\/strong> of <strong>21<\/strong> verified local operators/,
  );
  assert.match(operatorsHtml, /data-testid="operator-identity-mark"/);
  assert.match(operatorsHtml, /aria-hidden="true"/);

  for (const op of operatorItems) {
    assert.match(
      operatorsHtml,
      new RegExp(`href="/operators/${op.slug}"`),
      `Initial SSR HTML on /operators must include /operators/${op.slug}`,
    );
  }
  for (const heldOp of heldOperators) {
    assert.doesNotMatch(
      operatorsHtml,
      new RegExp(`/operators/${heldOp.operator.slug}\\b`),
      `Held operator ${heldOp.operator.slug} must never render on /operators`,
    );
  }
});

test("Priority A.4: Fixed /ports/glacier-bay H1, verbatim 2-hour planning standard, unclaimed operator notice, and intact held noindex banners", () => {
  const glacierBay = findSoutheastAlaskaPlaceByPortSlug("glacier-bay");
  assert.ok(glacierBay);
  const h1 = buildPortDetailH1(glacierBay.place);
  assert.equal(
    h1,
    "Glacier Bay National Park — Scenic Cruising (Non-Disembarkation) Guide",
  );
  // Ensure `(Scenic Cruising)` or `Scenic Cruising` is NOT doubled
  assert.equal((h1.match(/Scenic Cruising/g) || []).length, 1);
  assert.equal((h1.match(/National Park/g) || []).length, 1);

  // Verbatim 2-hour planning standard
  assert.equal(
    STANDARDIZED_TWO_HOUR_PLANNING_NOTE,
    "Cruise Promenade and the DCC network recommend planning for tours that return at least two hours before all-aboard.",
  );
  const portDetailSrc = readLfseFile("app/ports/[slug]/page.tsx");
  assert.match(portDetailSrc, /STANDARDIZED_TWO_HOUR_PLANNING_NOTE/);
  assert.match(portDetailSrc, /not an operator\s+return guarantee or a cruise-line rule/i);
  assert.match(portDetailSrc, /operator check-in deadline/i);
  assert.match(portDetailSrc, /cancellation cutoff/i);
  assert.match(portDetailSrc, /data-testid="place-last-verified"/);
  assert.match(portDetailSrc, /data-testid="held-place-noindex-banner"/);

  // Category, operator, and tour held banners remain intact on direct unindexed URLs
  assert.match(
    readLfseFile("app/ports/[slug]/[categorySlug]/page.tsx"),
    /data-testid="consolidated-category-noindex-banner"/,
  );
  assert.match(
    readLfseFile("app/operators/[operatorSlug]/page.tsx"),
    /data-testid="held-operator-noindex-banner"/,
  );
  assert.match(
    readLfseFile("app/operators/[operatorSlug]/page.tsx"),
    /data-testid="operator-integration-status-card"/,
  );
  assert.match(
    readLfseFile("app/operators/[operatorSlug]/page.tsx"),
    /data-testid="operator-last-verified"/,
  );
  assert.match(
    readLfseFile("app/tours/[operatorSlug]/[tourSlug]/page.tsx"),
    /data-testid="held-tour-noindex-banner"/,
  );
  assert.equal(
    UNCLAIMED_OPERATOR_PROFILE_NOTICE,
    "Independent source-backed profile. This company has not yet claimed or verified this page.",
  );

  // Sitemap invariant: 158 entries (157 directory/ship/decision + /guides/weekend-in-juneau) and 0 held URLs
  const sitemapEntries = sitemap();
  assert.equal(sitemapEntries.length, 158);
  const sitemapUrls = sitemapEntries.map((e) => e.url);
  assert.ok(
    sitemapUrls.includes(
      "https://www.lastfrontiershoreexcursions.com/guides/weekend-in-juneau",
    ),
  );
  assert.equal(
    sitemapUrls.some((u) =>
      /\/ports\/(metlakatla|pelican|elfin-cove|tenakee-springs|kake|craig)|\/operators\/island-wings-air-service|aleutian-ballad|\/ports\/wrangell\/river-and-glacier-jetboats/i.test(
        u,
      ),
    ),
    false,
    "Sitemap must never include held places, held operators, held categories, or Aleutian Ballad",
  );
});

test("Priority C: Juneau Tours & Whale Watch Rezgo IDs (31703, 32329, 344494, 141714, held 342080), refid=dccjuneau10, Viator P00281144 (mcid=42383), and GYG F2MMUUH remain 100% intact", () => {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const connectedOps = snapshot.operators.filter(
    (o) =>
      isOperatorLiveAvailabilityConnected(o.operator) ||
      isOperatorDirectCheckoutConnected(o.operator),
  );
  assert.equal(connectedOps.length, 1);
  assert.equal(connectedOps[0]?.operator.slug, "juneau-tours-and-whale-watch");

  for (const [slug, rezgoCom, viatorCode] of [
    ["auke-bay-whale-watch", "31703", "5857P23"],
    ["mendenhall-and-whale-combo", "32329", "5857P22"],
    ["mendenhall-glacier-shuttle", "344494", "5857SHUTTLE"],
  ] as const) {
    const tour = findSoutheastAlaskaTourByOperatorAndSlug(
      "juneau-tours-and-whale-watch",
      slug,
    );
    assert.ok(tour);
    assert.equal(tour.authorizedSupplierBinding?.supplierItemCode, rezgoCom);
    assert.equal(tour.authorizedSupplierBinding?.matchedPartnerProductCode, viatorCode);
    assert.equal(tour.authorizedSupplierBinding?.publicRefId, "dccjuneau10");

    const wrapperHref = resolveSoutheastAlaskaTourDirectRezgoHref(tour, {
      serviceDate: "2027-07-15",
      partySize: 4,
    });
    assert.ok(wrapperHref);
    const outerWrapper = new URL(wrapperHref);
    assert.equal(outerWrapper.pathname, "/go/out");
    assert.equal(
      outerWrapper.searchParams.get("originatingSite"),
      "lastfrontiershoreexcursions.com",
    );
    const innerTarget = outerWrapper.searchParams.get("u");
    assert.ok(innerTarget);
    const parsedInner = new URL(innerTarget);
    assert.equal(parsedInner.origin, "https://juneauwhalewatch.rezgo.com");
    assert.equal(parsedInner.searchParams.get("refid"), "dccjuneau10");
    assert.equal(parsedInner.searchParams.get("adult_num"), "4");
  }

  // Verify feed mapping files preserve 141714 / 5857P31 and held 342080
  const dccRezgoSrc = fs.readFileSync(
    path.join(process.cwd(), "lib/dcc/liveSlots/rezgoReadOnly.ts"),
    "utf8",
  );
  const lfseRezgoFeedSrc = readLfseFile("lib/dccJuneauSupplierFeed.ts");
  assert.match(dccRezgoSrc, /141714/);
  assert.match(lfseRezgoFeedSrc, /5857P31/);
  assert.match(lfseRezgoFeedSrc, /342080/);

  // Verify Viator and GetYourGuide affiliate attribution
  const viatorUrl = buildAffiliateUrl(
    "viator",
    "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
    "juneau-whale-small-group",
    "Small-Group Juneau Whale Watching Cruise",
    true,
  );
  const parsedViator = new URL(viatorUrl);
  assert.equal(parsedViator.searchParams.get("pid"), "P00281144");
  assert.equal(parsedViator.searchParams.get("mcid"), "42383");

  const handoffViator = buildDccHandoffAffiliateUrl({
    source: "viator",
    destinationUrl: viatorUrl,
    productCode: "331813P1",
    campaign: "juneau-whale-small-group",
  });
  assert.match(
    handoffViator,
    /^https:\/\/www\.destinationcommandcenter\.com\/go\/commerce\/handoff\?/,
  );

  const gygUrl = buildAffiliateUrl(
    "getyourguide",
    "https://www.getyourguide.com/juneau-l941/sample-tour-t12345/",
    "juneau-sample",
    "Sample Tour",
    true,
  );
  assert.equal(new URL(gygUrl).searchParams.get("partner_id"), "F2MMUUH");
});

test("Priority D: Juneau Flight Deck contextual external <a href> deep links render with all 3 target guides and never use Next <Link> across origins", () => {
  const calloutHtml = renderToStaticMarkup(<JuneauFlightDeckPlanningCallout />);
  assert.match(calloutHtml, new RegExp(`<a[^>]+href="${JFD_GLACIER_WEATHER_URL}"`));
  assert.match(calloutHtml, new RegExp(`<a[^>]+href="${JFD_WEIGHT_AND_SEATING_URL}"`));
  assert.match(calloutHtml, new RegExp(`<a[^>]+href="${JFD_CANCELED_BACKUP_URL}"`));

  // Ensure JuneauFlightDeckPlanningCallout is wired into /ports/juneau, /ports/juneau/helicopter-glacier-tours, /operators/[operatorSlug], and /tours/[operatorSlug]/[tourSlug]
  for (const relFile of [
    "app/ports/[slug]/page.tsx",
    "app/ports/[slug]/[categorySlug]/page.tsx",
    "app/operators/[operatorSlug]/page.tsx",
    "app/tours/[operatorSlug]/[tourSlug]/page.tsx",
  ]) {
    const src = readLfseFile(relFile);
    assert.match(
      src,
      /JuneauFlightDeckPlanningCallout/,
      `${relFile} must mount JuneauFlightDeckPlanningCallout`,
    );
    assert.doesNotMatch(
      src,
      /<Link[^>]+href=["']https:\/\/juneauflightdeck\.com/i,
      `${relFile} must never use Next <Link> for cross-origin juneauflightdeck.com URLs`,
    );
  }
});

test("Priority E & F: Skip-link, compact mobile header drawer, neutral monogram, JSON-LD shapes across all 7 directory routes, and 100% SOURCES.md coverage for all 31 images", () => {
  const layoutSrc = readLfseFile("app/layout.tsx");
  assert.match(
    layoutSrc,
    /<a href="#lfse-main-content" className="lfse-skip-link">\s*Skip to main content\s*<\/a>/,
  );
  assert.match(layoutSrc, /<div id="lfse-main-content" tabIndex=\{-1\}>/);
  // Ensure layout does NOT wrap {children} in a second <main>
  assert.doesNotMatch(layoutSrc, /<main[^>]*>\s*\{children\}\s*<\/main>/);

  const headerHtml = renderToStaticMarkup(<LfseSiteHeader />);
  assert.match(headerHtml, /aria-expanded="false"/);
  assert.match(headerHtml, /aria-controls="lfse-mobile-nav-drawer"/);
  for (const navHref of [
    "/southeast-alaska",
    "/ports",
    "/operators",
    "/tours",
    "/cruise-ships",
    "/about",
    "/contact",
  ]) {
    assert.match(headerHtml, new RegExp(`href="${navHref}"`));
  }

  const monogramHtml = renderToStaticMarkup(
    <OperatorIdentityMark name="Harv & Marv's Outback Alaska" />,
  );
  assert.match(monogramHtml, /aria-hidden="true"/);
  assert.match(monogramHtml, />HM</);

  // JSON-LD shape validation across all 7 directory page types
  const schemas = [
    buildSoutheastAlaskaHubJsonLd(),
    buildPortsDirectoryJsonLd(),
    buildPortDetailJsonLd({
      slug: "juneau",
      name: "Juneau",
      hook: "Alaska's roadless capital city.",
      overview: "Gastineau Channel port.",
      lastModifiedAt: "2026-11-17",
    }),
    buildPortCategoryJsonLd({
      portSlug: "juneau",
      portName: "Juneau",
      categorySlug: "helicopter-glacier-tours",
      categoryShortLabel: "Helicopter & Icefield",
      pageName: "Juneau Helicopter Glacier Tours",
      description: "Compare Juneau FAA Part 135 helicopter operators.",
      lastModifiedAt: "2026-11-17",
    }),
    buildOperatorsDirectoryJsonLd([
      { slug: "harv-and-marvs", name: "Harv & Marv's Outback Alaska" },
    ]),
    buildOperatorProfileJsonLd({
      slug: "temsco-helicopters",
      name: "TEMSCO Helicopters",
      tagline: "Juneau and Skagway glacier helicopter flights.",
      companyOverview: "Founded in 1958.",
      officialWebsite: "https://temscoair.com/",
      officialPhone: "(907) 789-9501",
      servedPlaceNames: ["Juneau", "Skagway"],
      lastModifiedAt: "2026-11-17",
    }),
    buildTourDetailJsonLd({
      operatorSlug: "juneau-tours-and-whale-watch",
      operatorName: "Juneau Tours & Whale Watch",
      operatorOfficialWebsite: "https://www.juneautours.com/",
      tourSlug: "auke-bay-whale-watch",
      tourTitle: "Auke Bay Whale Watch",
      summary: "Guided humpback whale tour.",
      portSlug: "juneau",
      portName: "Juneau",
      lastModifiedAt: "2026-11-17",
    }),
  ];

  for (const schema of schemas) {
    const raw = JSON.stringify(schema);
    assert.match(raw, new RegExp(DCC_ALASKA_DIRECTORY_API_URL.replace(/\//g, "\\/")));
    assert.match(raw, new RegExp(LFSE_SITE_URL.replace(/\//g, "\\/")));
    assert.doesNotMatch(
      raw,
      /"logo"|"aggregateRating"|"review"|"offers"|"priceRange"|"parentOrganization"/i,
    );
    assert.ok(
      schema["@graph"].some((n) => n["@type"] === "BreadcrumbList"),
      "Every directory JSON-LD graph must include a BreadcrumbList",
    );
  }

  const operatorSchema = schemas[5]!;
  const profileNode = operatorSchema["@graph"].find(
    (n) => n["@type"] === "ProfilePage",
  );
  assert.ok(profileNode, "Operator profile JSON-LD must use ProfilePage");
  const localBizNode = operatorSchema["@graph"].find(
    (n) => Array.isArray(n["@type"]) && n["@type"].includes("LocalBusiness"),
  ) as Record<string, unknown> | undefined;
  assert.ok(localBizNode, "Operator profile JSON-LD must include LocalBusiness mainEntity");
  assert.equal(localBizNode.url, "https://temscoair.com/");
  assert.deepEqual(localBizNode.sameAs, ["https://temscoair.com/"]);
  assert.equal("logo" in localBizNode, false);

  // 100% SOURCES.md coverage across all 31 image files in public/images/**
  const imagesDir = path.join(LFSE_ROOT, "public", "images");
  const alaskaSources = readLfseFile("public/images/alaska/SOURCES.md");
  const masterSources = readLfseFile("public/images/SOURCES.md");

  const imageFiles: string[] = [];
  function walkImages(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkImages(full);
      } else if (/\.(png|jpg|jpeg|webp|svg|avif)$/i.test(entry.name)) {
        imageFiles.push(path.relative(imagesDir, full).replace(/\\/g, "/"));
      }
    }
  }
  walkImages(imagesDir);

  assert.equal(
    imageFiles.length,
    31,
    `Expected exactly 31 image files in LFSE public/images, found ${imageFiles.length}`,
  );

  for (const relImg of imageFiles) {
    const baseName = path.basename(relImg);
    assert.ok(
      masterSources.includes(relImg),
      `Master public/images/SOURCES.md is missing provenance row for ${relImg}`,
    );
    assert.ok(
      alaskaSources.includes(baseName),
      `public/images/alaska/SOURCES.md is missing provenance row for ${baseName}`,
    );
  }
});
