import assert from "node:assert";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FrenchQuarterBoothBonus from "../../app/new-orleans/components/FrenchQuarterBoothBonus";
import NewOrleansContactPage, {
  metadata as contactMetadata,
} from "../../app/new-orleans/contact/page";
import WelcomeStopPage, {
  metadata as conciergeMetadata,
} from "../../app/new-orleans/french-quarter-welcome-stop/page";
import { STOREFRONT_PRODUCTS } from "../../app/new-orleans/tours/pageConfig";

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

const APPROVED_PRODUCT_SLUGS = [
  "city-tour-of-new-orleans",
  "oak-alley-or-laura-plantation-tour",
  "covered-tour-boat",
  "ragin-cajun-airboat-options",
  "all-day-city-plantation-combo",
  "covered-boat-plantation-combo",
] as const;

const UNSUPPORTED_CUSTOMER_CLAIMS = [
  "welcome stop",
  "today's location",
  "today’s location",
  "coupon",
  "gift",
  "free drink",
  "meet for a drink",
  "hotel-bar",
  "walk-in",
  "storefront",
  "booth",
  "visitor center",
  "fixed hours",
  "guaranteed availability",
] as const;

function countOccurrences(haystack: string, needle: string) {
  return haystack.split(needle).length - 1;
}

function assertApprovedConciergeLanguage(markup: string) {
  const customerText = markup.toLowerCase();
  assert.match(customerText, /new orleans tour concierge/);
  assert.match(customerText, /schedule tour help/);
  assert.match(customerText, /arranged in advance/);
  assert.match(customerText, /availability varies/);

  for (const unsupportedClaim of UNSUPPORTED_CUSTOMER_CLAIMS) {
    assert.ok(
      !customerText.includes(unsupportedClaim),
      `rendered customer content must not contain "${unsupportedClaim}"`,
    );
  }
}

test("/tours is a compact six-product secondary catalog", async () => {
  const { default: OutpostConsole } = await import(
    "../../app/new-orleans/tours/OutpostConsole"
  );
  const markup = renderToStaticMarkup(React.createElement(OutpostConsole));

  assert.match(markup, /Browse New Orleans Tours/);
  assert.match(markup, /Help Me Choose/);
  assert.match(markup, /Schedule Tour Help/);
  assert.match(markup, /independent curated marketplace/i);
  assert.ok(!markup.includes('id="chooser"'), "the catalog must not embed the chooser");
  assert.ok(!markup.includes("Find a Tour"), "the catalog must not embed marketplace search");
  assert.ok(!/ghost|cemetery|future evening inventory/i.test(markup));

  assert.deepStrictEqual(
    STOREFRONT_PRODUCTS.map((product) => product.slug),
    APPROVED_PRODUCT_SLUGS,
  );

  for (const slug of APPROVED_PRODUCT_SLUGS) {
    assert.strictEqual(
      countOccurrences(markup, `href="/tours/${slug}"`),
      1,
      `${slug} must appear exactly once in the rendered catalog`,
    );
  }
});

test("concierge surfaces use the approved operational language", async () => {
  const { FooterNav } = await import(
    "../../app/new-orleans/components/MarketplaceNavigation"
  );
  const { default: OutpostConsole } = await import(
    "../../app/new-orleans/tours/OutpostConsole"
  );
  const catalog = renderToStaticMarkup(React.createElement(OutpostConsole));
  const contact = renderToStaticMarkup(React.createElement(NewOrleansContactPage));
  const concierge = renderToStaticMarkup(React.createElement(WelcomeStopPage));
  const footer = renderToStaticMarkup(React.createElement(FooterNav));

  for (const markup of [catalog, contact, concierge, footer]) {
    assertApprovedConciergeLanguage(markup);
  }

  for (const variant of ["prominent", "compact", "short", "oneline"] as const) {
    const markup = renderToStaticMarkup(
      React.createElement(FrenchQuarterBoothBonus, { variant }),
    );
    assert.match(markup.toLowerCase(), /new orleans tour concierge|tour concierge/);
    assert.match(markup.toLowerCase(), /arranged in advance/);
    assert.match(markup.toLowerCase(), /availability varies/);
  }
});

test("concierge metadata does not inherit generic DCC descriptions", () => {
  assert.match(String(contactMetadata.description), /New Orleans Tour Concierge/);
  assert.match(String(contactMetadata.openGraph?.description), /Tour Concierge/);
  assert.match(String(conciergeMetadata.description), /tour-planning conversation/i);
  assert.match(String(conciergeMetadata.openGraph?.description), /tour-planning help/i);
});

test("header exposes the correctly spaced accessible brand name", async () => {
  const { HeaderNav } = await import(
    "../../app/new-orleans/components/MarketplaceNavigation"
  );
  const markup = renderToStaticMarkup(React.createElement(HeaderNav));

  assert.match(markup, /aria-label="Welcome to New Orleans Tours"/);
  assert.match(markup, />Welcome to</);
  assert.match(markup, />New Orleans</);
  assert.match(markup, />Tours</);
});
