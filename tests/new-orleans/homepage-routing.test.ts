import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { getWtonotHostRewrite } from "../../proxy";
import { NextRequest } from "next/server";

test("New Orleans flagship route truth", async (t) => {
  await t.test("proxy routes supported public-host paths and blocks internal paths", () => {
    const createReq = (pathname: string) => {
      const url = new URL(`https://welcometoneworleanstours.com${pathname}`);
      return new NextRequest(url);
    };

    let rewritten = getWtonotHostRewrite(createReq("/admin"));
    assert.strictEqual(rewritten?.pathname, "/not-found");

    rewritten = getWtonotHostRewrite(createReq("/new-orleans/tours"));
    assert.strictEqual(rewritten?.pathname, "/not-found");

    rewritten = getWtonotHostRewrite(createReq("/contact"));
    assert.strictEqual(rewritten?.pathname, "/new-orleans/contact");

    rewritten = getWtonotHostRewrite(createReq("/tours"));
    assert.strictEqual(rewritten?.pathname, "/new-orleans/tours");

    rewritten = getWtonotHostRewrite(createReq("/guides/things-to-do-in-new-orleans-today"));
    assert.strictEqual(rewritten?.pathname, "/new-orleans/guides/things-to-do-in-new-orleans-today");

    rewritten = getWtonotHostRewrite(createReq("/guides/new-orleans-tours-tonight"));
    assert.strictEqual(rewritten?.pathname, "/new-orleans/guides/new-orleans-tours-tonight");
  });

  await t.test("homepage uses the current recommendation flow and canonical guide family", () => {
    const pagePath = path.join(process.cwd(), "app", "new-orleans", "page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");

    assert.ok(content.includes('href="/tours"'), "Catalog CTA must reach /tours");
    assert.ok(content.includes('href="#chooser"'), "Help Me Choose must reach the homepage chooser");
    assert.ok(content.includes('id="chooser"'), "Chooser section must have id=chooser");
    assert.ok(content.includes("<NewOrleansRecommendationFlow />"), "Homepage must use the current recommendation flow");
    assert.ok(content.includes('href="/french-quarter-welcome-stop"'));
    assert.ok(content.includes('href: "/swamp-tours"'));
    assert.ok(content.includes('href: "/city-tours"'));
    assert.ok(content.includes('href: "/plantation-tours"'));
    assert.ok(content.includes('/guides/things-to-do-in-new-orleans-today'));
    assert.ok(content.includes('/guides/new-orleans-tours-tonight'));
    assert.ok(!content.includes("carefully verified for quality"));
  });

  await t.test("current six-question recommendation flow remains wired", () => {
    const flowPath = path.join(
      process.cwd(),
      "app",
      "new-orleans",
      "components",
      "NewOrleansRecommendationFlow.tsx",
    );
    const content = fs.readFileSync(flowPath, "utf-8");

    assert.ok(content.includes('"planningWindow"'));
    assert.ok(content.includes('"availableTime"'));
    assert.ok(content.includes('"transportation"'));
    assert.ok(content.includes('"groupStyle"'));
    assert.ok(content.includes('"mixedAges"'));
    assert.ok(content.includes('"historicalInterest"'));
    assert.ok(content.includes("evaluateRecommendation"));
    assert.ok(content.includes("RecommendationAnalyticsTracker"));
  });
});
