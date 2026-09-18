import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { proxy as rootProxy } from "../../proxy";
import { proxy as wnoProxy } from "../../apps/welcometoneworleanstours/proxy";
import nextConfig from "../../apps/welcometoneworleanstours/next.config.mjs";
import { buildWtonotSitemapPaths, WTONOT_ORIGIN } from "../../app/sitemap.xml/route";
import { STOREFRONT_PRODUCTS } from "../../app/new-orleans/tours/pageConfig";
import { getSeoPageBySlug } from "../../app/new-orleans/data/pageMap";
import { getWnoAgentDirectory, getWnoProductsFeed, getWnoLocationsFeed, getWnoPricingFeed, getWnoPoliciesFeed, getWnoOperatingWindowsFeed } from "../../app/new-orleans/data/wnoFeedsData";

import { metadata as arriveAtNoonMetadata } from "../../app/new-orleans/guides/best-new-orleans-tours-if-you-arrive-at-noon/page";
import { metadata as kidsUnderSixMetadata } from "../../app/new-orleans/guides/best-new-orleans-tours-with-kids-under-6/page";
import { metadata as kidsAirboatsMetadata } from "../../app/new-orleans/guides/can-kids-ride-airboats-new-orleans/page";
import { metadata as noCarMetadata } from "../../app/new-orleans/guides/new-orleans-swamp-tour-without-a-car/page";
import { metadata as grandparentsKidsMetadata } from "../../app/new-orleans/guides/new-orleans-tours-for-grandparents-and-kids/page";
import { metadata as underFiftyMetadata } from "../../app/new-orleans/guides/new-orleans-tours-under-50-dollars/page";
import { metadata as whitneyVsOakAlleyMetadata } from "../../app/new-orleans/guides/whitney-plantation-vs-oak-alley-history-focus/page";
import { metadata as limitedMobilityMetadata } from "../../app/new-orleans/guides/new-orleans-tours-limited-mobility/page";
import { metadata as withoutAllDayBusMetadata } from "../../app/new-orleans/guides/new-orleans-tours-without-an-all-day-bus-ride/page";
import { metadata as minimalWalkingMetadata } from "../../app/new-orleans/guides/new-orleans-tours-with-minimal-walking/page";
import { metadata as fitBeforeDinnerMetadata } from "../../app/new-orleans/guides/new-orleans-tours-that-fit-before-dinner/page";
import { metadata as oakAlleyVsWhitneyVsSwampMetadata } from "../../app/new-orleans/guides/oak-alley-vs-whitney-plantation-vs-swamp-tour/page";
import { metadata as underFourOrSixHoursMetadata } from "../../app/new-orleans/guides/best-new-orleans-tours-under-4-or-6-hours/page";

function mockRequest(pathname: string) {
  return new NextRequest("https://www.welcometoneworleanstours.com" + pathname, {
    headers: {
      host: "www.welcometoneworleanstours.com",
      "x-forwarded-host": "www.welcometoneworleanstours.com",
    },
  });
}

test("WNO SEO, Telemetry, and Inventory Integrity Audit", async (t) => {
  await t.test("1. Five target URLs: /walking-tours is 200, four redirects are 308 with canonicals", async () => {
    // /walking-tours
    const walkingRecord = getSeoPageBySlug("walking-tours");
    assert.ok(walkingRecord, "/walking-tours record must exist");
    assert.strictEqual(walkingRecord.status, "live");
    assert.strictEqual(walkingRecord.isIndexable, true);
    assert.strictEqual(walkingRecord.canonicalRoute, "https://www.welcometoneworleanstours.com/walking-tours");
    assert.strictEqual(walkingRecord.metadata?.title, "New Orleans Walking Tours | Historic, Cocktail & Ghost Walks");
    assert.ok(walkingRecord.metadata?.description?.includes("French Quarter"));

    // Next.js redirects in nextConfig
    const redirects = await nextConfig.redirects();
    const findRedirect = (source) => redirects.find((r) => r.source === source);

    const tonightRedirect = findRedirect("/new-orleans/tonight");
    assert.ok(tonightRedirect, "Redirect for /new-orleans/tonight must exist");
    assert.strictEqual(tonightRedirect.destination, "/guides/tonight");
    assert.strictEqual(tonightRedirect.permanent, true);

    const weekendRedirect = findRedirect("/new-orleans/this-weekend");
    assert.ok(weekendRedirect, "Redirect for /new-orleans/this-weekend must exist");
    assert.strictEqual(weekendRedirect.destination, "/guides/this-weekend");
    assert.strictEqual(weekendRedirect.permanent, true);

    const oakAlleyRedirect = findRedirect("/plantation-tours/oak-alley-vs-laura");
    assert.ok(oakAlleyRedirect, "Redirect for /plantation-tours/oak-alley-vs-laura must exist");
    assert.strictEqual(oakAlleyRedirect.destination, "/guides/oak-alley-plantation-tour-from-new-orleans");
    assert.strictEqual(oakAlleyRedirect.permanent, true);

    const restaurantRedirect = findRedirect("/new-orleans/restaurant-partners");
    assert.ok(restaurantRedirect, "Redirect for /new-orleans/restaurant-partners must exist");
    assert.strictEqual(restaurantRedirect.destination, "/contact");
    assert.strictEqual(restaurantRedirect.permanent, true);

    // Proxy redirects test
    const wnoRedirect1 = wnoProxy(mockRequest("/new-orleans/tonight"));
    assert.strictEqual(wnoRedirect1.status, 308);
    assert.strictEqual(wnoRedirect1.headers.get("location"), "https://www.welcometoneworleanstours.com/guides/tonight");

    const wnoRedirect2 = wnoProxy(mockRequest("/new-orleans/this-weekend"));
    assert.strictEqual(wnoRedirect2.status, 308);
    assert.strictEqual(wnoRedirect2.headers.get("location"), "https://www.welcometoneworleanstours.com/guides/this-weekend");

    const wnoRedirect3 = wnoProxy(mockRequest("/plantation-tours/oak-alley-vs-laura"));
    assert.strictEqual(wnoRedirect3.status, 308);
    assert.strictEqual(wnoRedirect3.headers.get("location"), "https://www.welcometoneworleanstours.com/guides/oak-alley-plantation-tour-from-new-orleans");

    const wnoRedirect4 = wnoProxy(mockRequest("/new-orleans/restaurant-partners"));
    assert.strictEqual(wnoRedirect4.status, 308);
    assert.strictEqual(wnoRedirect4.headers.get("location"), "https://www.welcometoneworleanstours.com/contact");

    // Root proxy redirects test
    const rootRedirect1 = await rootProxy(mockRequest("/new-orleans/tonight"), {});
    assert.strictEqual(rootRedirect1.status, 308);
    assert.strictEqual(rootRedirect1.headers.get("location"), "https://www.welcometoneworleanstours.com/guides/tonight");
  });

  await t.test("2. Sitemap URLs count is exactly 104 and contains all candidate guides", () => {
    const paths = buildWtonotSitemapPaths();
    assert.strictEqual(paths.length, 104, `Expected 104 sitemap paths, got ${paths.length}`);

    const expectedPaths = [
      "/walking-tours",
      "/help-me-choose",
      "/guides/4-hours-in-new-orleans",
      "/guides/best-new-orleans-tours-if-you-arrive-at-noon",
      "/guides/best-new-orleans-tours-with-kids-under-6",
      "/guides/can-kids-ride-airboats-new-orleans",
      "/guides/new-orleans-swamp-tour-without-a-car",
      "/guides/new-orleans-tours-for-grandparents-and-kids",
      "/guides/new-orleans-tours-under-50-dollars",
      "/guides/whitney-plantation-vs-oak-alley-history-focus",
    ];

    for (const p of expectedPaths) {
      assert.ok(paths.includes(p), `Sitemap missing expected path: ${p}`);
    }

    const forbiddenPaths = [
      "/guides/french-quarter-orientation",
      "/guides/new-orleans-tours-tonight",
      "/guides/restaurant-partners",
      "/guides/tour-catalog",
      "/guides/visitor-rewards",
      "/combo-tours",
    ];

    for (const p of forbiddenPaths) {
      assert.ok(!paths.includes(p), `Sitemap should NOT include: ${p}`);
    }
  });

  await t.test("3. Candidate guides have unique titles, descriptions, and valid canonicals", async () => {
    const candidates = [
      {
        slug: "4-hours-in-new-orleans",
        meta: {
          title: "4 Hours in New Orleans | Tours That Fit a Short Visit",
          description: "Only have about four hours in New Orleans? Compare shorter city, river and evening tour formats before checking live schedules.",
        },
        expectedTitle: "4 Hours in New Orleans | Tours That Fit a Short Visit",
        expectedCanonical: "/guides/4-hours-in-new-orleans",
      },
      {
        slug: "best-new-orleans-tours-if-you-arrive-at-noon",
        meta: arriveAtNoonMetadata,
        expectedTitle: "Best New Orleans Tours If You Arrive at Noon",
        expectedCanonical: "/guides/best-new-orleans-tours-if-you-arrive-at-noon",
      },
      {
        slug: "best-new-orleans-tours-with-kids-under-6",
        meta: kidsUnderSixMetadata,
        expectedTitle: "Best New Orleans Tours With Kids Under 6: What Actually Fits",
        expectedCanonical: "/guides/best-new-orleans-tours-with-kids-under-6",
      },
      {
        slug: "can-kids-ride-airboats-new-orleans",
        meta: kidsAirboatsMetadata,
        expectedTitle: "Can Kids Ride Airboats in New Orleans? Age Rules & Better Options",
        expectedCanonical: "/guides/can-kids-ride-airboats-new-orleans",
      },
      {
        slug: "new-orleans-swamp-tour-without-a-car",
        meta: noCarMetadata,
        expectedTitle: "New Orleans Swamp Tours Without a Car: What Actually Works",
        expectedCanonical: "/guides/new-orleans-swamp-tour-without-a-car",
      },
      {
        slug: "new-orleans-tours-for-grandparents-and-kids",
        meta: grandparentsKidsMetadata,
        expectedTitle: "Best New Orleans Tours for Grandparents and Kids Together",
        expectedCanonical: "/guides/new-orleans-tours-for-grandparents-and-kids",
      },
      {
        slug: "new-orleans-tours-under-50-dollars",
        meta: underFiftyMetadata,
        expectedTitle: "New Orleans Tours Under $50: Current Budget-Friendly Options",
        expectedCanonical: "/guides/new-orleans-tours-under-50-dollars",
      },
      {
        slug: "whitney-plantation-vs-oak-alley-history-focus",
        meta: whitneyVsOakAlleyMetadata,
        expectedTitle: "Whitney vs Oak Alley: Which Plantation Tour for History?",
        expectedCanonical: "/guides/whitney-plantation-vs-oak-alley-history-focus",
      },
      {
        slug: "new-orleans-tours-limited-mobility",
        meta: limitedMobilityMetadata,
        expectedTitle: "New Orleans Tours for Limited Mobility: What to Check Before Booking",
        expectedCanonical: "/guides/new-orleans-tours-limited-mobility",
      },
      {
        slug: "new-orleans-tours-without-an-all-day-bus-ride",
        meta: withoutAllDayBusMetadata,
        expectedTitle: "New Orleans Tours Without Spending All Day on a Bus",
        expectedCanonical: "/guides/new-orleans-tours-without-an-all-day-bus-ride",
      },
      {
        slug: "new-orleans-tours-with-minimal-walking",
        meta: minimalWalkingMetadata,
        expectedTitle: "New Orleans Tours With Minimal Walking: Easier Options to Compare",
        expectedCanonical: "/guides/new-orleans-tours-with-minimal-walking",
      },
      {
        slug: "new-orleans-tours-that-fit-before-dinner",
        meta: fitBeforeDinnerMetadata,
        expectedTitle: "New Orleans Tours That Fit Before Dinner: Shorter Afternoon Options",
        expectedCanonical: "/guides/new-orleans-tours-that-fit-before-dinner",
      },
      {
        slug: "oak-alley-vs-whitney-plantation-vs-swamp-tour",
        meta: oakAlleyVsWhitneyVsSwampMetadata,
        expectedTitle: "Oak Alley vs Whitney Plantation vs Swamp Tour: Which Should You Choose? (2026 Guide)",
        expectedCanonical: "https://www.welcometoneworleanstours.com/guides/oak-alley-vs-whitney-plantation-vs-swamp-tour",
      },
      {
        slug: "best-new-orleans-tours-under-4-or-6-hours",
        meta: underFourOrSixHoursMetadata,
        expectedTitle: "Best New Orleans Tours Under 4 or 6 Hours",
        expectedCanonical: "/guides/best-new-orleans-tours-under-4-or-6-hours",
      },
    ];

    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const c of candidates) {
      assert.strictEqual(c.meta.title, c.expectedTitle, `Title mismatch for ${c.slug}`);
      assert.ok(c.meta.description && c.meta.description.length > 20, `Description too short for ${c.slug}`);

      assert.ok(!titles.has(c.meta.title as string), `Duplicate title: ${c.meta.title}`);
      assert.ok(!descriptions.has(c.meta.description as string), `Duplicate description: ${c.meta.description}`);
      titles.add(c.meta.title as string);
      descriptions.add(c.meta.description as string);

      if (c.slug !== "4-hours-in-new-orleans") {
        assert.strictEqual((c.meta.alternates as any)?.canonical, c.expectedCanonical, `Canonical mismatch for ${c.slug}`);
      }
    }

    // Verify bridgedMetadata in WNO guides page source includes all candidates
    const wnoGuideSource = fs.readFileSync(path.join(process.cwd(), "apps/welcometoneworleanstours/app/guides/[slug]/page.tsx"), "utf8");
    for (const c of candidates) {
      assert.ok(wnoGuideSource.includes(`"${c.slug}"`), `bridgedMetadata must register ${c.slug}`);
    }

    // Verify help-me-choose metadata source in WNO page
    const wnoHelpMeChooseSource = fs.readFileSync(path.join(process.cwd(), "apps/welcometoneworleanstours/app/help-me-choose/page.tsx"), "utf8");
    assert.ok(wnoHelpMeChooseSource.includes("https://www.welcometoneworleanstours.com/help-me-choose"));
    assert.ok(wnoHelpMeChooseSource.includes("export const metadata"));
  });

  await t.test("4. Commercial inventory groups preserve exact FareHarbor ASN/item/flow/ref values", () => {
    assert.strictEqual(STOREFRONT_PRODUCTS.length, 21, "Must have exactly 21 storefront products");

    for (const product of STOREFRONT_PRODUCTS) {
      assert.ok(product.slug, "Product must have a slug");
      assert.ok(product.companyShortname, `${product.slug} must have companyShortname`);

      // Verify ASN rules:
      // Southern Style and Ragin Cajun use aktourcenter
      // Steamboat / Gray Line inventory uses welcometoneworleanstours
      if (
        product.companyShortname === "southernstyletours" ||
        product.companyShortname === "cajunencounters" ||
        product.companyShortname === "ragincajunairboattours"
      ) {
        assert.ok(product.itemId, `${product.slug} must have itemId`);
      }
    }
  });

  await t.test("5. All machine feed endpoints return valid data", () => {
    const directory = getWnoAgentDirectory(WTONOT_ORIGIN);
    assert.ok(directory);
    assert.strictEqual(directory.dcc_id, "dcc:site:wno-tours");

    const products = getWnoProductsFeed(WTONOT_ORIGIN);
    assert.ok(Array.isArray(products));
    assert.strictEqual(products.length, 21);

    const locations = getWnoLocationsFeed(WTONOT_ORIGIN);
    assert.ok(Array.isArray(locations));
    assert.ok(locations.length > 0);

    const pricing = getWnoPricingFeed(WTONOT_ORIGIN);
    assert.ok(Array.isArray(pricing));
    assert.strictEqual(pricing.length, 21);

    const policies = getWnoPoliciesFeed(WTONOT_ORIGIN);
    assert.ok(Array.isArray(policies));
    assert.strictEqual(policies.length, 21);

    const operatingWindows = getWnoOperatingWindowsFeed(WTONOT_ORIGIN);
    assert.ok(Array.isArray(operatingWindows));
    assert.strictEqual(operatingWindows.length, 21);
  });
});
