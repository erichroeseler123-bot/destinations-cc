import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  APPROVED_PRODUCT_SLUGS,
  buildAttributedTourHref,
  buildFareHarborLightframeOptions,
  FAREHARBOR_SOURCES,
  getDefaultDetailSource,
  isFareHarborSource,
  resolveFareHarborSource,
} from "../../app/new-orleans/lib/fareHarborAttribution";
import {
  FAREHARBOR_ASN,
  getFareHarborUrl,
  STOREFRONT_PRODUCTS,
} from "../../app/new-orleans/tours/pageConfig";

const expectedDefaults = {
  "city-tour-of-new-orleans": "wtonot-detail-city",
  "oak-alley-or-laura-plantation-tour": "wtonot-detail-plantation",
  "covered-tour-boat": "wtonot-detail-covered",
  "ragin-cajun-airboat-options": "wtonot-detail-airboat",
  "all-day-city-plantation-combo": "wtonot-detail-city-plantation",
  "covered-boat-plantation-combo": "wtonot-detail-covered-plantation",
  "evening-jazz-cruise": "wtonot-tours",
  "daytime-jazz-cruise": "wtonot-tours",
  "sunday-jazz-brunch-cruise": "wtonot-tours",
  "oak-alley-plantation-tour-grey-line": "wtonot-tours",
  "whitney-plantation-tour": "wtonot-tours",
  "swamp-bayou-tour": "wtonot-tours",
  "small-airboat-swamp-adventure": "wtonot-tours",
  "large-airboat-swamp-adventure": "wtonot-tours",
  "swamp-boat-oak-alley-combo": "wtonot-tours",
  "swamp-boat-whitney-combo": "wtonot-tours",
  "cocktail-walking-tour": "wtonot-tours",
  "craft-cocktail-walking-tour": "wtonot-tours",
  "ghosts-spirits-walking-tour": "wtonot-tours",
  "city-cemetery-garden-district-tour": "wtonot-tours",
  "city-of-new-orleans-riverboat-cruise": "wtonot-tours",
} as const;

test("FareHarbor Lightframe attribution", async (t) => {
  await t.test("uses a closed source vocabulary and product-specific defaults", () => {
    for (const slug of APPROVED_PRODUCT_SLUGS) {
      assert.strictEqual(getDefaultDetailSource(slug), expectedDefaults[slug]);
    }

    assert.strictEqual(isFareHarborSource("wtonot-home"), true);
    assert.strictEqual(isFareHarborSource("customer@example.com"), false);
    assert.strictEqual(isFareHarborSource("wtonot-home?customer=1"), false);
    assert.strictEqual(isFareHarborSource("arbitrary-user-input"), false);
  });

  await t.test("propagates approved internal sources deterministically", () => {
    assert.strictEqual(
      buildAttributedTourHref(
        "city-tour-of-new-orleans",
        FAREHARBOR_SOURCES.home,
      ),
      "/tours/city-tour-of-new-orleans?src=wtonot-home",
    );
    assert.strictEqual(
      buildAttributedTourHref(
        "covered-tour-boat",
        FAREHARBOR_SOURCES.homeChooser,
        "swamp-calm",
      ),
      "/tours/covered-tour-boat?recommended=swamp-calm&src=wtonot-home-chooser",
    );
  });

  await t.test("accepts chooser sources only for valid recommendation context", () => {
    assert.strictEqual(
      resolveFareHarborSource({
        productSlug: "covered-tour-boat",
        requestedSource: FAREHARBOR_SOURCES.homeChooser,
        hasValidRecommendation: true,
      }),
      FAREHARBOR_SOURCES.homeChooser,
    );
    assert.strictEqual(
      resolveFareHarborSource({
        productSlug: "covered-tour-boat",
        requestedSource: FAREHARBOR_SOURCES.helpChooser,
        hasValidRecommendation: false,
      }),
      FAREHARBOR_SOURCES.detailCovered,
    );
    assert.strictEqual(
      resolveFareHarborSource({
        productSlug: "city-tour-of-new-orleans",
        requestedSource: FAREHARBOR_SOURCES.recommendation,
        hasValidRecommendation: true,
      }),
      FAREHARBOR_SOURCES.recommendation,
    );
    assert.strictEqual(
      resolveFareHarborSource({
        productSlug: "city-tour-of-new-orleans",
        requestedSource: FAREHARBOR_SOURCES.recommendation,
        hasValidRecommendation: false,
      }),
      FAREHARBOR_SOURCES.detailCity,
    );
    assert.strictEqual(
      resolveFareHarborSource({
        productSlug: "city-tour-of-new-orleans",
        requestedSource: "uncontrolled-source",
        hasValidRecommendation: true,
      }),
      FAREHARBOR_SOURCES.detailCity,
    );
  });

  await t.test("passes only validated source data to FH.open options", () => {
    assert.deepStrictEqual(
      buildFareHarborLightframeOptions({
        shortname: "southernstyletours",
        asn: FAREHARBOR_ASN,
        itemId: "51942",
        flowId: "4344",
        source: FAREHARBOR_SOURCES.home,
      }),
      {
        shortname: "southernstyletours",
        asn: "aktourcenter",
        ref: "wtonot-home",
        view: { item: "51942" },
        flow: "4344",
      },
    );

  });

  await t.test("keeps all six raw fallback URLs byte-for-byte unchanged", () => {
    const expected = [
      "https://fareharbor.com/embeds/book/southernstyletours/items/51942/?asn=aktourcenter&flow=4344&full-items=yes",
      "https://fareharbor.com/embeds/book/southernstyletours/items/83002/?asn=aktourcenter&flow=4344&full-items=yes",
      "https://fareharbor.com/embeds/book/ragincajuntours/items/590176/?asn=aktourcenter&flow=392449&full-items=yes",
      "https://fareharbor.com/embeds/book/ragincajuntours/?asn=aktourcenter&flow=940162&full-items=yes",
      "https://fareharbor.com/embeds/book/southernstyletours/items/51953/?asn=aktourcenter&flow=4344&full-items=yes",
      "https://fareharbor.com/embeds/book/ragincajuntours/items/603090/?asn=aktourcenter&flow=392449&full-items=yes",
    ];
    const actual = STOREFRONT_PRODUCTS.slice(0, 6).map((product) =>
      getFareHarborUrl(product.companyShortname, product.itemId, product.flowId),
    );
    assert.deepStrictEqual(actual, expected);
    assert.ok(actual.every((url) => !url.includes("src=") && !url.includes("ref=")));
  });

  await t.test("wires homepage, catalog, chooser, guide, and detail sources", () => {
    const read = (relativePath: string) =>
      fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

    assert.match(
      read("app/new-orleans/page.tsx"),
      /attributionSource=\{FAREHARBOR_SOURCES\.home\}/,
    );
    assert.match(
      read("app/new-orleans/components/ProductCard.tsx"),
      /attributionSource = FAREHARBOR_SOURCES\.guide/,
    );

    const chooser = read("app/new-orleans/components/NewOrleansChooser.tsx");
    assert.match(chooser, /FAREHARBOR_SOURCES\.homeChooser/);
    assert.match(chooser, /FAREHARBOR_SOURCES\.helpChooser/);
    assert.match(chooser, /buildAttributedTourHref\(product\.slug, attributionSource, contextId\)/);

    const detailPage = read("app/new-orleans/tours/[slug]/page.tsx");
    assert.match(detailPage, /resolveFareHarborSource\(\{/);
    assert.match(detailPage, /hasValidRecommendation: Boolean\(recommendationExplanation\)/);
  });

  await t.test("preserves existing booking analytics event names", () => {
    const bookingButton = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/components/FareHarborBookingButton.tsx"),
      "utf8",
    );
    const detailAction = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/tours/[slug]/TourDetailBookingAction.tsx"),
      "utf8",
    );

    for (const eventName of [
      "fareharbor_cta_seen",
      "fareharbor_cta_clicked",
      "fareharbor_direct_fallback_used",
      "fareharbor_script_failed",
      "fareharbor_open_attempted",
      "fareharbor_open_succeeded",
    ]) {
      assert.ok(bookingButton.includes(`"${eventName}"`));
    }
    assert.ok(detailAction.includes('"tour_detail_booking_selected"'));
    assert.ok(detailAction.includes('"fareharbor_checkout_opened"'));
  });
});
