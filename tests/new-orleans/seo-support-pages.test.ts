import test from "node:test";
import assert from "node:assert";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";

import {
  WTONOT_ORIGIN,
  WTONOT_SUPPORT_PATHS,
  buildDccSitemapXml,
  buildWtonotSitemapPaths,
} from "../../app/sitemap.xml/route";
import { buildRobotsTxt } from "../../app/robots.txt/route";
import { STOREFRONT_PRODUCTS } from "../../app/new-orleans/tours/pageConfig";
import { SEO_PAGES } from "../../app/new-orleans/data";
import { getWtonotHostRewrite } from "../../proxy";

import PrivacyPage from "../../app/new-orleans/privacy/page";
import TermsPage from "../../app/new-orleans/terms/page";
import CancellationPolicyPage from "../../app/new-orleans/cancellation-policy/page";
import AffiliateDisclosurePage from "../../app/new-orleans/affiliate-disclosure/page";
import AccessibilityPage from "../../app/new-orleans/accessibility/page";
import BookingHelpPage from "../../app/new-orleans/booking-help/page";
import FaqPage from "../../app/new-orleans/faq/page";
import AboutPage from "../../app/new-orleans/about/page";

const testRequire = createRequire(import.meta.url);
(testRequire as typeof testRequire & {
  extensions: Record<string, (module: { exports: unknown }) => void>;
}).extensions[".css"] = (module) => {
  module.exports = new Proxy(
    {},
    {
      get: (_target, property) =>
        property === "__esModule" ? false : String(property),
    },
  );
};

const SUPPORT_PAGE_COMPONENTS = [
  PrivacyPage,
  TermsPage,
  CancellationPolicyPage,
  AffiliateDisclosurePage,
  AccessibilityPage,
  BookingHelpPage,
  FaqPage,
  AboutPage,
];

function buildRequest(pathname: string) {
  return new NextRequest(`https://welcometoneworleanstours.com${pathname}`, {
    headers: {
      host: "welcometoneworleanstours.com",
      "x-forwarded-host": "welcometoneworleanstours.com",
    },
  });
}

test("New Orleans sitemap and support-page coverage", async (t) => {
  await t.test("sitemap contains every live storefront tour slug", () => {
    const paths = buildWtonotSitemapPaths();
    assert.strictEqual(STOREFRONT_PRODUCTS.length, 21);

    for (const product of STOREFRONT_PRODUCTS) {
      assert.ok(paths.includes(`/tours/${product.slug}`), `missing tour slug ${product.slug}`);
    }
  });

  await t.test("sitemap includes live indexable New Orleans SEO routes and support pages only once", () => {
    const paths = buildWtonotSitemapPaths();
    const unique = new Set(paths);
    assert.strictEqual(unique.size, paths.length, "sitemap paths must be unique");

    for (const page of Object.values(SEO_PAGES)) {
      if (page.status === "live" && page.isIndexable) {
        assert.ok(paths.includes(page.publicRoute), `missing live SEO route ${page.publicRoute}`);
      }
    }

    for (const path of WTONOT_SUPPORT_PATHS) {
      assert.ok(paths.includes(path), `missing support route ${path}`);
    }
  });

  await t.test("sitemap XML uses the New Orleans canonical host and excludes preview/local URLs", () => {
    const xml = buildDccSitemapXml(buildWtonotSitemapPaths(), WTONOT_ORIGIN);
    assert.match(xml, /https:\/\/welcometoneworleanstours\.com\/tours\/city-tour-of-new-orleans/);
    assert.doesNotMatch(xml, /localhost|127\.0\.0\.1|vercel\.app|preview|\/api\/|\/admin\//i);
  });

  await t.test("robots references the correct sitemap without blocking render assets", () => {
    const robots = buildRobotsTxt("welcometoneworleanstours.com");
    assert.match(robots, /Sitemap: https:\/\/welcometoneworleanstours\.com\/sitemap\.xml/);
    assert.match(robots, /Disallow: \/admin\//);
    assert.match(robots, /Disallow: \/api\//);
    assert.doesNotMatch(robots, /Disallow: \/_next\//);
  });
});

test("New Orleans support pages route and render", async (t) => {
  await t.test("support pages route through the New Orleans host rewrite", () => {
    for (const path of WTONOT_SUPPORT_PATHS) {
      const result = getWtonotHostRewrite(buildRequest(path));
      assert.ok(result, `missing rewrite for ${path}`);
      assert.strictEqual(result.pathname, `/new-orleans${path}`);
      assert.notStrictEqual(result.pathname, "/not-found");
    }
  });

  await t.test("support page components render customer-facing content", () => {
    for (const Page of SUPPORT_PAGE_COMPONENTS) {
      const markup = renderToStaticMarkup(React.createElement(Page));
      assert.match(markup, /Welcome to New Orleans Tours/);
      assert.match(markup, /help@welcometoneworleanstours\.com/);
      assert.match(markup, /504-484-9687/);
      assert.doesNotMatch(markup, /TODO|TBD|legal advice/i);
    }
  });

  await t.test("footer links resolve to support routes", async () => {
    const { FooterNav } = await import("../../app/new-orleans/components/MarketplaceNavigation");
    const markup = renderToStaticMarkup(React.createElement(FooterNav));

    for (const path of WTONOT_SUPPORT_PATHS.filter((path) => path !== "/contact")) {
      assert.match(markup, new RegExp(`href="${path}"`), `missing footer link ${path}`);
      const result = getWtonotHostRewrite(buildRequest(path));
      assert.strictEqual(result?.pathname, `/new-orleans${path}`);
    }
  });
});
