import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";

// Allow plain Node `tsx --test` to import Next.js CSS Modules cleanly.
const cssClasses = {
  productCard: "productCard",
  productCardFallback: "productCardFallback",
  productCardContent: "productCardContent",
  productCardTitle: "productCardTitle",
  productCardOperator: "productCardOperator",
  productCardFit: "productCardFit",
  productCardDescription: "productCardDescription",
  productCardFooter: "productCardFooter",
  productCardCues: "productCardCues",
  productCardCue: "productCardCue",
  productCardActions: "productCardActions",
  productCardDetailCta: "productCardDetailCta",
  productCardCta: "productCardCta",
  productCardPreview: "productCardPreview",
  accentFont: "accentFont",
};
(Module as any)._extensions[".css"] = (mod: any) => {
  mod.exports = { ...cssClasses, default: cssClasses };
};

function extractHrefList(html: string): string[] {
  const hrefs: string[] = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    hrefs.push(match[1].replace(/&amp;/g, "&"));
  }
  return hrefs;
}

function extractJsonLdScripts(html: string): any[] {
  const scripts: any[] = [];
  for (const match of html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    scripts.push(JSON.parse(match[1]));
  }
  return scripts;
}

function stripTagsAndScripts(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

test("1. Decision 1 — normalizeWtnoTourPath, 308 permanent redirects (proxy + next.config), footer /privacy, and homepage discovery & attribution", async () => {
  const {
    normalizeWtnoTourPath,
    resolveHumanPlaceName,
    computeOperatorMonogramInitials,
  } = await import("../../app/new-orleans/lib/wtnoDirectoryHelpers");
  const { proxy: wnoProxy } = await import(
    "../../apps/welcometoneworleanstours/proxy"
  );
  const { default: wnoNextConfig } = await import(
    "../../apps/welcometoneworleanstours/next.config.mjs"
  );
  const { WnoPublicHeader, WnoPublicFooter } = await import(
    "../../apps/welcometoneworleanstours/app/components/WnoPublicShell"
  );
  const { default: WnoHomePage } = await import(
    "../../apps/welcometoneworleanstours/app/page"
  );

  // Helper normalization
  assert.equal(
    normalizeWtnoTourPath("/tours/oak-alley-plantation-tour"),
    "/tours/oak-alley-plantation-tour-grey-line",
  );
  assert.equal(
    normalizeWtnoTourPath("/tours/oak-alley-plantation-tour?src=area-guide#details"),
    "/tours/oak-alley-plantation-tour-grey-line?src=area-guide#details",
  );
  assert.equal(
    normalizeWtnoTourPath("/tours/city-tour-three-hour"),
    "/tours/city-tour-of-new-orleans",
  );
  assert.equal(
    normalizeWtnoTourPath("/tours/city-tour-three-hour/?date=2027-03-10"),
    "/tours/city-tour-of-new-orleans?date=2027-03-10",
  );
  assert.equal(
    normalizeWtnoTourPath("/tours/whitney-plantation-tour"),
    "/tours/whitney-plantation-tour",
  );

  assert.equal(resolveHumanPlaceName("/areas/jean-lafitte"), "Jean Lafitte & Barataria");
  assert.equal(computeOperatorMonogramInitials("New Orleans Steamboat Company"), "NO");

  // Proxy 308 redirects preserving query strings
  const oakReq = new NextRequest(
    "https://www.welcometoneworleanstours.com/tours/oak-alley-plantation-tour?date=2027-04-01&party_size=4",
  );
  const oakRes = await wnoProxy(oakReq);
  assert.equal(oakRes.status, 308);
  assert.equal(
    oakRes.headers.get("location"),
    "https://www.welcometoneworleanstours.com/tours/oak-alley-plantation-tour-grey-line?date=2027-04-01&party_size=4",
  );

  const cityReq = new NextRequest(
    "https://www.welcometoneworleanstours.com/tours/city-tour-three-hour?src=wno-area",
  );
  const cityRes = await wnoProxy(cityReq);
  assert.equal(cityRes.status, 308);
  assert.equal(
    cityRes.headers.get("location"),
    "https://www.welcometoneworleanstours.com/tours/city-tour-of-new-orleans?src=wno-area",
  );

  // next.config.mjs permanent redirects
  assert.equal(typeof wnoNextConfig.redirects, "function");
  const nextRedirects = await wnoNextConfig.redirects!();
  const oakCfg = nextRedirects.find(
    (r: any) => r.source === "/tours/oak-alley-plantation-tour",
  );
  const cityCfg = nextRedirects.find(
    (r: any) => r.source === "/tours/city-tour-three-hour",
  );
  assert.ok(oakCfg && oakCfg.permanent === true);
  assert.equal(oakCfg.destination, "/tours/oak-alley-plantation-tour-grey-line");
  assert.ok(cityCfg && cityCfg.permanent === true);
  assert.equal(cityCfg.destination, "/tours/city-tour-of-new-orleans");

  // Global Header & Footer accessibility + /privacy fix
  const headerHtml = renderToStaticMarkup(<WnoPublicHeader />);
  assert.match(
    headerHtml,
    /^<header[^>]*><a href="#wno-main-content" class="wno-skip">Skip to main content<\/a>/,
  );
  assert.ok(headerHtml.includes('aria-controls="wno-mobile-nav-drawer"'));
  assert.ok(headerHtml.includes('aria-expanded="false"'));
  assert.ok(headerHtml.includes('href="/areas"'));
  assert.ok(headerHtml.includes('href="/operators"'));

  const footerHtml = renderToStaticMarkup(<WnoPublicFooter />);
  const footerHrefs = extractHrefList(footerHtml);
  assert.ok(footerHrefs.includes("/privacy"));
  assert.ok(!footerHrefs.includes("/privacy-policy"));

  // Every header & footer link has visible text or aria-label
  for (const match of [
    ...headerHtml.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi),
    ...footerHtml.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi),
  ]) {
    const attrs = match[1];
    const innerText = match[2].replace(/<[^>]+>/g, "").trim();
    const hasAriaLabel = /aria-label="[^"]+"/i.test(attrs);
    assert.ok(
      innerText.length > 0 || hasAriaLabel,
      `Link missing accessible name: ${match[0]}`,
    );
  }

  // Homepage Steamboat Company fix + /areas & /operators discovery + preserved partner attributions
  const homeEl = await WnoHomePage({ searchParams: Promise.resolve({}) });
  const homeHtml = renderToStaticMarkup(homeEl);
  assert.ok(
    homeHtml.includes("Checkout via FareHarbor (New Orleans Steamboat Company)"),
  );
  assert.ok(!homeHtml.includes("Checkout via FareHarbor (Steamboat Natchez)"));
  const homeHrefs = extractHrefList(homeHtml);
  assert.ok(homeHrefs.includes("/areas"));
  assert.ok(homeHrefs.includes("/operators"));
  assert.ok(homeHtml.includes("src=wtonot-home"));
  assert.ok(homeHtml.includes("/go/commerce/handoff"));
  assert.ok(homeHtml.includes("F2MMUUH"));
  assert.ok(homeHtml.includes("P00058396") || homeHtml.includes("P00306962"));
});

test("2. Warm directory SSR completeness, deduplication, zero held/obsolete links, and held route noindex contracts", async () => {
  const { default: wnoSitemap } = await import(
    "../../apps/welcometoneworleanstours/app/sitemap"
  );
  const { default: AreasPage } = await import(
    "../../app/new-orleans/areas/page"
  );
  const {
    default: AreaDetailPage,
    generateMetadata: generateAreaMetadata,
  } = await import("../../app/new-orleans/areas/[slug]/page");
  const {
    default: AreaCategoryPage,
    generateMetadata: generateAreaCategoryMetadata,
  } = await import("../../app/new-orleans/areas/[slug]/[categorySlug]/page");
  const { default: OperatorsPage } = await import(
    "../../app/new-orleans/operators/page"
  );
  const {
    default: OperatorDetailPage,
    generateMetadata: generateOperatorMetadata,
  } = await import("../../app/new-orleans/operators/[slug]/page");
  const { generateMetadata: generateWnoTourMetadata } = await import(
    "../../apps/welcometoneworleanstours/app/tours/[slug]/page"
  );
  const { getNewOrleansDirectorySnapshot } = await import(
    "../../lib/dcc/shared/newOrleansDirectoryData"
  );
  const { UNCLAIMED_OPERATOR_PROFILE_NOTICE } = await import(
    "../../lib/dcc/shared/newOrleansDirectoryExtensionContract"
  );

  const snapshot = getNewOrleansDirectorySnapshot();
  const heldPaths = new Set(
    snapshot.heldRecordsLedger
      .map((entry) => entry.publicPath)
      .filter((p): p is string => Boolean(p)),
  );
  heldPaths.add("/tours/covered-boat-plantation-combo");
  heldPaths.add("/tours/jeanlafitte-swamp-tour-with-hotel-pickup");

  const obsoleteTourPaths = new Set([
    "/tours/oak-alley-plantation-tour",
    "/tours/city-tour-three-hour",
  ]);

  // Sitemap excludes all held and obsolete paths
  const sitemapEntries = wnoSitemap();
  for (const item of sitemapEntries) {
    const pathname = new URL(item.url).pathname;
    assert.ok(!heldPaths.has(pathname), `Held path leaked into sitemap: ${pathname}`);
    assert.ok(
      !obsoleteTourPaths.has(pathname),
      `Obsolete path leaked into sitemap: ${pathname}`,
    );
  }

  // /areas SSR renders all 16 qualified places with heroImage, warm surface, and zero held links
  const areasHtml = renderToStaticMarkup(<AreasPage />);
  assert.ok(areasHtml.includes('data-wno-surface="directory-warm"'));
  assert.ok(!areasHtml.includes('data-wno-surface="directory-dark"'));
  assert.ok(areasHtml.includes("All (16)"));

  const qualifiedPlaces = snapshot.places.filter((p) => p.gate.indexable);
  assert.equal(qualifiedPlaces.length, 16);
  for (const { place } of qualifiedPlaces) {
    assert.ok(areasHtml.includes(`/areas/${place.publicPlaceSlug}`));
    assert.ok(areasHtml.includes(place.heroImage));
  }
  for (const href of extractHrefList(areasHtml)) {
    const cleanPath = href.split(/[?#]/)[0];
    assert.ok(!heldPaths.has(cleanPath), `/areas linked to held path: ${cleanPath}`);
    assert.ok(
      !obsoleteTourPaths.has(cleanPath),
      `/areas linked to obsolete path: ${cleanPath}`,
    );
  }

  // /operators SSR renders all 14 qualified operators with heroImage + OperatorIdentityMark, deduplicated, zero held links
  const operatorsHtml = renderToStaticMarkup(<OperatorsPage />);
  assert.ok(operatorsHtml.includes('data-wno-surface="directory-warm"'));
  assert.ok(!operatorsHtml.includes('data-wno-surface="directory-dark"'));
  assert.ok(operatorsHtml.includes('data-testid="operator-identity-mark"'));

  const qualifiedOperators = snapshot.operators.filter((o) => o.gate.indexable);
  assert.equal(qualifiedOperators.length, 14);
  for (const { operator } of qualifiedOperators) {
    assert.ok(
      operatorsHtml.includes(
        `data-testid="operator-directory-card-${operator.slug}"`,
      ),
    );
    assert.ok(operatorsHtml.includes(operator.heroImage));
  }
  const cajunCardMatches = operatorsHtml.match(
    /data-testid="operator-directory-card-cajun-encounters"/g,
  );
  assert.equal(cajunCardMatches?.length, 1);

  for (const href of extractHrefList(operatorsHtml)) {
    const cleanPath = href.split(/[?#]/)[0];
    assert.ok(
      !heldPaths.has(cleanPath),
      `/operators linked to held path: ${cleanPath}`,
    );
    assert.ok(
      !obsoleteTourPaths.has(cleanPath),
      `/operators linked to obsolete path: ${cleanPath}`,
    );
  }

  // Check sample area pages
  for (const areaSlug of [
    "french-quarter",
    "msy-airport-corridor",
    "river-road",
    "erato-street-cruise-terminal",
  ]) {
    const el = await AreaDetailPage({ params: Promise.resolve({ slug: areaSlug }) });
    const html = renderToStaticMarkup(el);
    assert.ok(html.includes('data-wno-surface="directory-warm"'));
    assert.ok(html.includes('data-testid="sources-and-freshness-disclosure"'));
    assert.ok(!/Departure Area:\s*\/areas\//i.test(stripTagsAndScripts(html)));
    for (const href of extractHrefList(html)) {
      const cleanPath = href.split(/[?#]/)[0];
      assert.ok(
        !heldPaths.has(cleanPath),
        `/areas/${areaSlug} linked to held path: ${cleanPath}`,
      );
      assert.ok(
        !obsoleteTourPaths.has(cleanPath),
        `/areas/${areaSlug} linked to obsolete tour path: ${cleanPath}`,
      );
    }
  }

  // Check operator detail pages
  for (const opSlug of [
    "gray-line",
    "new-orleans-steamboat-company",
    "ragin-cajun-tours",
    "cajun-encounters",
  ]) {
    const el = await OperatorDetailPage({ params: Promise.resolve({ slug: opSlug }) });
    const html = renderToStaticMarkup(el);
    assert.ok(html.includes('data-wno-surface="directory-warm"'));
    assert.ok(html.includes('data-testid="operator-canonical-products-matrix"'));
    assert.ok(html.includes('data-testid="sources-and-freshness-disclosure"'));
    assert.ok(html.includes(UNCLAIMED_OPERATOR_PROFILE_NOTICE));
    assert.ok(
      !/\/areas\/[a-z0-9-]+/i.test(stripTagsAndScripts(html)),
      `Raw /areas/ slug exposed in visible text on /operators/${opSlug}`,
    );
    for (const href of extractHrefList(html)) {
      const cleanPath = href.split(/[?#]/)[0];
      assert.ok(
        !heldPaths.has(cleanPath),
        `/operators/${opSlug} linked to held path: ${cleanPath}`,
      );
      assert.ok(
        !obsoleteTourPaths.has(cleanPath),
        `/operators/${opSlug} linked to obsolete tour path: ${cleanPath}`,
      );
    }
  }

  // Held routes emit robots index:false and preserve held data-testid banners
  const heldOpMeta = await generateOperatorMetadata({
    params: Promise.resolve({ slug: "nola-ghost-riders" }),
  });
  assert.deepEqual(heldOpMeta.robots, { index: false, follow: true });
  const heldOpHtml = renderToStaticMarkup(
    await OperatorDetailPage({ params: Promise.resolve({ slug: "nola-ghost-riders" }) }),
  );
  assert.ok(heldOpHtml.includes('data-testid="held-operator-noindex-banner"'));

  const heldPlaceEntry = snapshot.places.find(
    (p) => !p.gate.indexable && Boolean(p.place.publicPlaceSlug),
  );
  if (heldPlaceEntry?.place.publicPlaceSlug) {
    const heldPlaceMeta = await generateAreaMetadata({
      params: Promise.resolve({ slug: heldPlaceEntry.place.publicPlaceSlug }),
    });
    assert.deepEqual(heldPlaceMeta.robots, { index: false, follow: true });
    const heldPlaceHtml = renderToStaticMarkup(
      await AreaDetailPage({
        params: Promise.resolve({ slug: heldPlaceEntry.place.publicPlaceSlug }),
      }),
    );
    assert.ok(heldPlaceHtml.includes('data-testid="held-place-noindex-banner"'));
  }

  const heldAreaCatEntry = snapshot.areaCategories.find((ac) => !ac.gate.indexable);
  if (heldAreaCatEntry) {
    const heldAcMeta = await generateAreaCategoryMetadata({
      params: Promise.resolve({
        slug: heldAreaCatEntry.areaSlug,
        categorySlug: heldAreaCatEntry.category.categorySlug,
      }),
    });
    assert.deepEqual(heldAcMeta.robots, { index: false, follow: true });
    const heldAcHtml = renderToStaticMarkup(
      await AreaCategoryPage({
        params: Promise.resolve({
          slug: heldAreaCatEntry.areaSlug,
          categorySlug: heldAreaCatEntry.category.categorySlug,
        }),
      }),
    );
    assert.ok(heldAcHtml.includes('data-testid="held-area-category-banner"'));
  }

  const heldComboMeta = await generateWnoTourMetadata({
    params: Promise.resolve({ slug: "covered-boat-plantation-combo" }),
    searchParams: Promise.resolve({}),
  });
  assert.deepEqual(heldComboMeta.robots, { index: false, follow: true });
});

test("3. Zero leaked internal jargon (pid=, Item 228561, 10%, Held counts) in traveler prose while preserving affiliate hrefs", async () => {
  const { default: AreasPage } = await import(
    "../../app/new-orleans/areas/page"
  );
  const { default: OperatorsPage } = await import(
    "../../app/new-orleans/operators/page"
  );
  const { default: OperatorDetailPage } = await import(
    "../../app/new-orleans/operators/[slug]/page"
  );
  const { default: LargeAirboat15200P1CheckCard } = await import(
    "../../app/new-orleans/tours/[slug]/LargeAirboat15200P1CheckCard"
  );

  const areasText = stripTagsAndScripts(renderToStaticMarkup(<AreasPage />));
  const operatorsText = stripTagsAndScripts(renderToStaticMarkup(<OperatorsPage />));
  const opDetailHtml = renderToStaticMarkup(
    await OperatorDetailPage({ params: Promise.resolve({ slug: "cajun-encounters" }) }),
  );
  const opDetailText = stripTagsAndScripts(opDetailHtml);
  const airboatCardHtml = renderToStaticMarkup(
    <LargeAirboat15200P1CheckCard
      siteDomain="welcometoneworleanstours.com"
      initialDate="2027-05-15"
      initialPartySize={8}
      initialOptionCode="TG9"
    />,
  );
  const airboatCardText = stripTagsAndScripts(airboatCardHtml);

  for (const visibleText of [
    areasText,
    operatorsText,
    opDetailText,
    airboatCardText,
  ]) {
    assert.ok(
      !/pid=/i.test(visibleText),
      `Exposed pid= in visible text: ${visibleText.slice(0, 180)}`,
    );
    assert.ok(
      !/item\s*228561/i.test(visibleText),
      "Exposed item 228561 in visible text",
    );
    assert.ok(
      !/\b10%\b/.test(visibleText),
      "Exposed 10% commission jargon in visible text",
    );
    assert.ok(!/Draft Micro-Areas Held/i.test(visibleText));
    assert.ok(!/Unverified Operators Held Out of Sitemaps/i.test(visibleText));
    assert.ok(!/Canonical Place Directory/i.test(visibleText));
  }

  // Underlying commercial bindings remain 100% intact
  assert.ok(opDetailHtml.includes("pid=P00306962"));
  assert.ok(opDetailHtml.includes("mcid=42383"));
  assert.ok(airboatCardHtml.includes("account=P00306962"));
  assert.ok(airboatCardHtml.includes("d675-15200P1"));
});

test("4. Priority F — Rich JSON-LD across /areas, /areas/[slug], /areas/[slug]/[categorySlug], /operators, and /operators/[slug]", async () => {
  const { DCC_NOLA_DIRECTORY_API_URL } = await import(
    "../../app/new-orleans/lib/structuredData"
  );
  const { default: AreasPage } = await import(
    "../../app/new-orleans/areas/page"
  );
  const { default: AreaDetailPage } = await import(
    "../../app/new-orleans/areas/[slug]/page"
  );
  const { default: AreaCategoryPage } = await import(
    "../../app/new-orleans/areas/[slug]/[categorySlug]/page"
  );
  const { default: OperatorsPage } = await import(
    "../../app/new-orleans/operators/page"
  );
  const { default: OperatorDetailPage } = await import(
    "../../app/new-orleans/operators/[slug]/page"
  );
  const { getNewOrleansDirectorySnapshot } = await import(
    "../../lib/dcc/shared/newOrleansDirectoryData"
  );

  // /areas
  const areasScripts = extractJsonLdScripts(renderToStaticMarkup(<AreasPage />));
  assert.equal(areasScripts.length, 1);
  const areasGraph = areasScripts[0]["@graph"];
  assert.ok(Array.isArray(areasGraph));
  const areasCollection = areasGraph.find(
    (n: any) => n["@type"] === "CollectionPage",
  );
  const areasBreadcrumb = areasGraph.find(
    (n: any) => n["@type"] === "BreadcrumbList",
  );
  assert.ok(areasCollection);
  assert.ok(areasBreadcrumb);
  assert.equal(areasCollection.isBasedOn, DCC_NOLA_DIRECTORY_API_URL);
  assert.equal(areasCollection.publisher.name, "Welcome to New Orleans Tours");

  // /areas/[slug]
  const areaDetailScripts = extractJsonLdScripts(
    renderToStaticMarkup(
      await AreaDetailPage({ params: Promise.resolve({ slug: "honey-island" }) }),
    ),
  );
  assert.ok(areaDetailScripts.length >= 1);
  const areaDetailGraph = areaDetailScripts[0]["@graph"];
  const placeNode = areaDetailGraph.find(
    (n: any) =>
      Array.isArray(n["@type"]) &&
      n["@type"].includes("TouristDestination") &&
      n["@type"].includes("Place"),
  );
  assert.ok(placeNode);
  assert.equal(placeNode.isBasedOn, DCC_NOLA_DIRECTORY_API_URL);
  assert.equal(placeNode.subjectOf.publisher.name, "Welcome to New Orleans Tours");

  // /areas/[slug]/[categorySlug]
  const snapshot = getNewOrleansDirectorySnapshot();
  const qualifiedAc = snapshot.areaCategories.find((ac) => ac.gate.indexable)!;
  const acScripts = extractJsonLdScripts(
    renderToStaticMarkup(
      await AreaCategoryPage({
        params: Promise.resolve({
          slug: qualifiedAc.areaSlug,
          categorySlug: qualifiedAc.category.categorySlug,
        }),
      }),
    ),
  );
  assert.equal(acScripts.length, 1);
  const acCollection = acScripts[0]["@graph"].find(
    (n: any) => n["@type"] === "CollectionPage",
  );
  assert.ok(acCollection);
  assert.equal(acCollection.isBasedOn, DCC_NOLA_DIRECTORY_API_URL);

  // /operators: FIRST script MUST be ItemList; SECOND script has CollectionPage + BreadcrumbList
  const operatorsScripts = extractJsonLdScripts(
    renderToStaticMarkup(<OperatorsPage />),
  );
  assert.equal(operatorsScripts.length, 2);
  assert.equal(operatorsScripts[0]["@type"], "ItemList");
  assert.equal(operatorsScripts[0].itemListElement.length, 14);
  const opCollection = operatorsScripts[1]["@graph"].find(
    (n: any) => n["@type"] === "CollectionPage",
  );
  const opBreadcrumb = operatorsScripts[1]["@graph"].find(
    (n: any) => n["@type"] === "BreadcrumbList",
  );
  assert.ok(opCollection);
  assert.ok(opBreadcrumb);
  assert.equal(opCollection.isBasedOn, DCC_NOLA_DIRECTORY_API_URL);

  // /operators/[slug]: ProfilePage + LocalBusiness with sameAs, NO logo/aggregateRating/review/offers
  const opProfileScripts = extractJsonLdScripts(
    renderToStaticMarkup(
      await OperatorDetailPage({
        params: Promise.resolve({ slug: "new-orleans-steamboat-company" }),
      }),
    ),
  );
  assert.equal(opProfileScripts.length, 1);
  const profilePage = opProfileScripts[0]["@graph"].find(
    (n: any) => n["@type"] === "ProfilePage",
  );
  assert.ok(profilePage);
  assert.equal(profilePage.isBasedOn, DCC_NOLA_DIRECTORY_API_URL);
  assert.equal(profilePage.publisher.name, "Welcome to New Orleans Tours");
  const mainEntity = profilePage.mainEntity;
  assert.equal(mainEntity["@type"], "LocalBusiness");
  assert.ok(Array.isArray(mainEntity.sameAs) && mainEntity.sameAs.length === 1);
  assert.equal(mainEntity.logo, undefined);
  assert.equal(mainEntity.aggregateRating, undefined);
  assert.equal(mainEntity.review, undefined);
  assert.equal(mainEntity.offers, undefined);
});

test("5. 100% local image provenance coverage in apps/welcometoneworleanstours/public/images/SOURCES.md", () => {
  const publicDir = path.join(
    process.cwd(),
    "apps",
    "welcometoneworleanstours",
    "public",
  );
  const imagesDir = path.join(publicDir, "images");
  const sourcesMdPath = path.join(imagesDir, "SOURCES.md");
  const wnoSourcesMdPath = path.join(imagesDir, "wno", "SOURCES.md");
  const msyCorridorImgPath = path.join(
    imagesDir,
    "portfolio",
    "dcc-hero-corridor.webp",
  );

  assert.ok(fs.existsSync(sourcesMdPath), "Root images/SOURCES.md must exist");
  assert.ok(fs.existsSync(wnoSourcesMdPath), "images/wno/SOURCES.md must exist");
  assert.ok(
    fs.existsSync(msyCorridorImgPath) &&
      fs.statSync(msyCorridorImgPath).size > 10_000,
    "MSY corridor image dcc-hero-corridor.webp must exist and be non-empty",
  );

  const sourcesContent = fs.readFileSync(sourcesMdPath, "utf8");
  const imageFiles: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(jpg|jpeg|png|webp|svg|avif)$/i.test(entry.name)) {
        const relPublicPath =
          "/" + path.relative(publicDir, fullPath).replace(/\\/g, "/");
        imageFiles.push(relPublicPath);
      }
    }
  }

  walk(imagesDir);
  assert.ok(
    imageFiles.length >= 35,
    `Expected at least 35 images, found ${imageFiles.length}`,
  );

  for (const publicImgPath of imageFiles) {
    assert.ok(
      sourcesContent.includes(publicImgPath),
      `Missing provenance entry in SOURCES.md for ${publicImgPath}`,
    );
  }
});
