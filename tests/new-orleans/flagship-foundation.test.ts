import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("WNO flagship foundation ownership", async (t) => {
  await t.test("schema has one canonical builder module", () => {
    const canonical = read("app/new-orleans/lib/structuredData.ts");
    const legacy = read("app/new-orleans/lib/schema.ts");
    const renderer = read("app/new-orleans/components/StructuredData.tsx");

    assert.ok(canonical.includes('WNO_ORGANIZATION_ID'));
    assert.ok(canonical.includes('WNO_WEBSITE_ID'));
    assert.ok(canonical.includes('generateProductSchemaGraph'));
    assert.ok(canonical.includes('generateCategorySchemaGraph'));

    assert.ok(legacy.includes('from "./structuredData"'));
    assert.ok(!legacy.includes('"@context"'));

    assert.ok(renderer.includes('WNO_ORGANIZATION_ID'));
    assert.ok(renderer.includes('WNO_WEBSITE_ID'));
    assert.ok(renderer.includes('from "../lib/structuredData"'));
  });

  await t.test("managed phone links emit one canonical phone_click", () => {
    const phone = read("app/new-orleans/components/PhoneCta.tsx");
    const tracker = read("app/new-orleans/components/WnoFunnelTracker.tsx");

    assert.ok(phone.includes('trackEvent("phone_click")'));
    assert.ok(phone.includes('data-wno-managed-click="phone"'));
    assert.ok(phone.includes('sendWnoTelemetry'));
    assert.ok(!phone.includes('trackEvent("phone_cta_clicked")'));

    assert.ok(tracker.includes('if (anchor.dataset.wnoManagedClick) return;'));
    assert.ok(tracker.includes('href.startsWith("tel:")'));
    assert.ok(tracker.includes('return "phone_click"'));
  });

  await t.test("draft category hubs are not promoted from the homepage", () => {
    const homepage = read("app/new-orleans/page.tsx");

    assert.ok(homepage.includes('/tours#river-cruises'));
    assert.ok(homepage.includes('buildAttributedTourHref("craft-cocktail-walking-tour"'));
    assert.ok(homepage.includes('buildAttributedTourHref("ghosts-spirits-walking-tour"'));
    assert.ok(!homepage.includes('href: "/riverboat-cruises"'));
    assert.ok(!homepage.includes('href: "/food-tours"'));
    assert.ok(!homepage.includes('href: "/ghost-tours"'));
  });
});
