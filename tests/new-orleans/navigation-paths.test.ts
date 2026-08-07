import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { SEO_PAGES } from "../../app/new-orleans/data/pages";

test("New Orleans navigation paths", async (t) => {
  await t.test("global and catalog chooser actions use the standalone chooser route", () => {
    const navigation = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/components/MarketplaceNavigation.tsx"),
      "utf8",
    );
    const catalog = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/tours/OutpostConsole.tsx"),
      "utf8",
    );

    assert.strictEqual(
      navigation.match(/href="\/help-me-choose"/g)?.length,
      2,
      "desktop and mobile global navigation must link to /help-me-choose",
    );
    assert.match(catalog, /href="\/help-me-choose"/);
    assert.ok(!catalog.includes('href="/#chooser"'));
  });

  await t.test("the three core category CTAs browse the catalog instead of linking to themselves", () => {
    for (const pageId of ["city-tours", "swamp-tours", "plantation-tours"]) {
      const page = SEO_PAGES[pageId];
      assert.ok(page, `${pageId} must remain configured`);
      assert.strictEqual(page.topCta, "/tours");
      assert.notStrictEqual(page.topCta, page.publicRoute);
    }

    const renderer = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/components/SeoPageRenderer.tsx"),
      "utf8",
    );
    assert.match(renderer, /"Browse All Tours"/);
  });

  await t.test("New Orleans public TSX does not contain empty or no-op hrefs", () => {
    const root = path.join(process.cwd(), "app/new-orleans");
    const offenders: string[] = [];

    function visit(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          visit(fullPath);
          continue;
        }
        if (!entry.name.endsWith(".tsx")) continue;
        const content = fs.readFileSync(fullPath, "utf8");
        if (/href=\{\s*["']\s*["']\s*\}|href=["']\s*["']|href=\{\s*["']#["']\s*\}|href=["']#["']/.test(content)) {
          offenders.push(path.relative(process.cwd(), fullPath));
        }
      }
    }

    visit(root);
    assert.deepStrictEqual(offenders, []);
  });
});
