import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { STOREFRONT_PRODUCTS, getFareHarborUrl } from "../../app/new-orleans/tours/pageConfig";
import { normalizeFareHarborFallbackHref } from "../../app/new-orleans/lib/fareHarborAttribution";
import { generateCategorySchemaGraph } from "../../app/new-orleans/lib/structuredData";

test("Conversion Card Actions & Booking Integrity Suite", async (t) => {
  await t.test("1. All 21 storefront products have unique detail routes", () => {
    assert.strictEqual(STOREFRONT_PRODUCTS.length, 21);
    const slugs = new Set<string>();
    for (const product of STOREFRONT_PRODUCTS) {
      assert.ok(product.slug, `Product ${product.id} must have a valid slug`);
      assert.ok(!slugs.has(product.slug), `Duplicate storefront slug: ${product.slug}`);
      assert.ok(product.operatorName, `${product.slug} must identify its operator`);
      slugs.add(product.slug);
    }
  });

  await t.test("2. Exactly 18 products are direct-book and 3 are multi-variant", () => {
    const direct = STOREFRONT_PRODUCTS.filter((p) => {
      const variants = p.bookingVariants || [];
      return variants.length === 1 || (!variants.length && (p.itemId || p.flowId));
    });
    const multi = STOREFRONT_PRODUCTS.filter((p) => (p.bookingVariants || []).length > 1);
    assert.strictEqual(direct.length, 18);
    assert.strictEqual(multi.length, 3);
  });

  await t.test("3. Multi-variant products are the three river-cruise selectors", () => {
    const multiVariantSlugs = STOREFRONT_PRODUCTS
      .filter((p) => (p.bookingVariants || []).length > 1)
      .map((p) => p.slug)
      .sort();
    assert.deepStrictEqual(multiVariantSlugs, [
      "daytime-jazz-cruise",
      "evening-jazz-cruise",
      "sunday-jazz-brunch-cruise",
    ].sort());
  });

  await t.test("4. Every literal variant URL matches its declared item and flow", () => {
    for (const product of STOREFRONT_PRODUCTS) {
      for (const variant of product.bookingVariants || []) {
        const url = new URL(variant.bookingUrl);
        assert.ok(url.hostname.endsWith("fareharbor.com"), `${product.slug} must link to FareHarbor`);
        assert.ok(url.pathname.includes(`/items/${variant.itemId}/`), `${product.slug}/${variant.label} item mismatch`);
        assert.strictEqual(url.searchParams.get("flow"), variant.flowId, `${product.slug}/${variant.label} flow mismatch`);
      }
    }
  });

  await t.test("5. Every customer-facing checkout normalizes to the approved operator ASN", () => {
    for (const product of STOREFRONT_PRODUCTS) {
      const variants = product.bookingVariants || [];
      const hrefs = variants.length
        ? variants.map((variant) => variant.bookingUrl)
        : [getFareHarborUrl(product.companyShortname, product.itemId, product.flowId)];

      for (const href of hrefs) {
        const normalized = normalizeFareHarborFallbackHref({
          href,
          shortname: product.companyShortname,
          requestedAsn: new URL(href).searchParams.get("asn") || "",
        });
        const url = new URL(normalized);
        const expectedAsn = product.companyShortname === "neworleanssteamboatcompany"
          ? "welcometoneworleanstours"
          : "aktourcenter";
        assert.strictEqual(url.searchParams.get("asn"), expectedAsn, `${product.slug} ASN mismatch`);
        if (product.companyShortname === "neworleanssteamboatcompany") {
          assert.strictEqual(url.searchParams.get("ref"), "WelcomeToNewOrleansTours", `${product.slug} referral code mismatch`);
        }
      }
    }
  });

  await t.test("6. Sunday Jazz Brunch malformed raw ref is repaired before customer navigation", () => {
    const sunday = STOREFRONT_PRODUCTS.find((p) => p.slug === "sunday-jazz-brunch-cruise");
    assert.ok(sunday);
    assert.strictEqual(sunday.bookingVariants?.length, 3);
    for (const variant of sunday.bookingVariants || []) {
      const normalized = normalizeFareHarborFallbackHref({
        href: variant.bookingUrl,
        shortname: sunday.companyShortname,
        requestedAsn: "welcometoneworleanstours",
      });
      assert.strictEqual(new URL(normalized).searchParams.get("ref"), "WelcomeToNewOrleansTours");
    }
  });

  await t.test("7. Ghosts & Spirits keeps verified item 562250 / flow 1578708", () => {
    const ghosts = STOREFRONT_PRODUCTS.find((p) => p.slug === "ghosts-spirits-walking-tour");
    assert.ok(ghosts?.bookingVariants?.length);
    const variant = ghosts.bookingVariants![0];
    assert.strictEqual(variant.itemId, "562250");
    assert.strictEqual(variant.flowId, "1578708");
    assert.ok(variant.bookingUrl.includes("/items/562250/"));
  });

  await t.test("8. Catalog detail cues contain an explicit text separator", () => {
    const card = fs.readFileSync(path.join(process.cwd(), "app/new-orleans/components/ProductCard.tsx"), "utf8");
    assert.match(card, /index < cues\.length - 1 \? ' ' : null/);
  });

  await t.test("9. Mobile conversion bar is mounted globally but only activates on approved tour-detail paths", () => {
    const layout = fs.readFileSync(path.join(process.cwd(), "app/new-orleans/layout.tsx"), "utf8");
    const mount = fs.readFileSync(path.join(process.cwd(), "app/new-orleans/components/WnoMobileConversionMount.tsx"), "utf8");
    const bar = fs.readFileSync(path.join(process.cwd(), "app/new-orleans/components/StickyMobileBookingBar.tsx"), "utf8");

    assert.match(layout, /WnoMobileConversionMount/);
    assert.match(mount, /\^\\\/tours\\\/\(\[\^\/\]\+\)/);
    assert.match(mount, /isApprovedProductSlug/);
    assert.match(bar, /WTONOT-MOBILE-TOUR-CALL/);
    assert.match(bar, /mobile_sticky_bar/);
    assert.ok(!bar.includes('href={`#booking-variants`}'));
  });

  await t.test("10. Category schema resolves the visible storefront operator instead of Unknown", () => {
    const graph = generateCategorySchemaGraph({
      urlPath: "/riverboat-cruises",
      name: "New Orleans Riverboat Cruises",
      description: "Test",
      items: [{
        slug: "evening-jazz-cruise",
        name: "Evening Jazz Cruise",
        description: "Test",
        providerName: "Unknown",
      }],
    });
    const collection = graph["@graph"][0] as any;
    assert.strictEqual(collection.hasPart[0].provider.name, "New Orleans Steamboat Company");
    assert.notStrictEqual(collection.hasPart[0].provider.name, "Unknown");
  });
});