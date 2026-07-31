import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { getWtonotHostRewrite } from "../../proxy";
import { NextRequest } from "next/server";

test("New Orleans Homepage Action Corrections", async (t) => {
  await t.test("proxy.ts accurately routes New Orleans paths", () => {
    // Helper to create mock NextRequest
    const createReq = (pathname: string) => {
      const url = new URL(`https://welcometoneworleanstours.com${pathname}`);
      return new NextRequest(url);
    };

    // 1. unsupported public-host paths still use the not-found behavior
    let rewritten = getWtonotHostRewrite(createReq("/admin"));
    assert.strictEqual(rewritten?.pathname, "/not-found");

    rewritten = getWtonotHostRewrite(createReq("/new-orleans/tours"));
    assert.strictEqual(rewritten?.pathname, "/not-found");

    // 2. New Orleans contact CTA reaches New Orleans-specific content
    rewritten = getWtonotHostRewrite(createReq("/contact"));
    assert.strictEqual(rewritten?.pathname, "/new-orleans/contact");

    // 3. /tours routes to /new-orleans/tours
    rewritten = getWtonotHostRewrite(createReq("/tours"));
    assert.strictEqual(rewritten?.pathname, "/new-orleans/tours");
  });

  await t.test("page.tsx component renders correct hero and guide links", () => {
    const pagePath = path.join(process.cwd(), "app", "new-orleans", "page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");

    // hero Explore Tours uses `/tours`
    assert.ok(content.includes('href="/tours"'), "Explore Tours link must be /tours");
    // Help Me Choose reaches the homepage chooser without navigation failure
    assert.ok(content.includes('href="#chooser"'), "Help Me Choose must link to #chooser");
    assert.ok(content.includes('id="chooser"'), "Chooser must have id chooser");

    // every homepage guide href maps to an existing route
    assert.ok(content.includes('href="/swamp-tours/airboat-vs-covered-boat"'));
    assert.ok(content.includes('href="/guides/how-far-are-swamp-tours-from-new-orleans"'));
    assert.ok(content.includes('href="/swamp-tours/pickup-vs-self-drive"'));
    assert.ok(content.includes('href="/guides/how-long-does-a-swamp-tour-take"'));
  });

  await t.test("chooser routes and behaviors", () => {
    const chooserPath = path.join(process.cwd(), "app", "new-orleans", "components", "NewOrleansChooser.tsx");
    const content = fs.readFileSync(chooserPath, "utf-8");

    // City route is correct
    assert.ok(content.includes('setCategoryId("city-highlights")'));
    // Plantation route is correct
    assert.ok(content.includes('setCategoryId("plantations-history")'));
    // Swamp opens the secondary state
    assert.ok(content.includes('setView("guided-preferences")'));
    // Not Sure opens the guided flow
    assert.ok(content.includes('setView("guided-categories")'));
  });
});
