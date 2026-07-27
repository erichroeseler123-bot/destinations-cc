import test from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { getWtonotHostRewrite } from "../../proxy";

test("getWtonotHostRewrite - WTONOT host rules", async (t) => {
  const buildRequest = (host: string, pathname: string) => {
    return new NextRequest(`https://${host}${pathname}`, {
      headers: {
        host: host,
        "x-forwarded-host": host,
      },
    });
  };

  await t.test("allows /contact to pass through unchanged", () => {
    const req = buildRequest("welcometoneworleanstours.com", "/contact");
    const result = getWtonotHostRewrite(req);
    assert.ok(result);
    assert.strictEqual(result.pathname, "/contact");
  });

  await t.test("rewrites unsupported path to /not-found", () => {
    const req = buildRequest("welcometoneworleanstours.com", "/random-unknown-path");
    const result = getWtonotHostRewrite(req);
    assert.ok(result);
    assert.strictEqual(result.pathname, "/not-found");
  });

  await t.test("preserves existing / routing", () => {
    const req = buildRequest("welcometoneworleanstours.com", "/");
    const result = getWtonotHostRewrite(req);
    assert.ok(result);
    assert.strictEqual(result.pathname, "/new-orleans");
  });

  await t.test("preserves existing /tours routing", () => {
    const req = buildRequest("welcometoneworleanstours.com", "/tours");
    const result = getWtonotHostRewrite(req);
    assert.ok(result);
    assert.strictEqual(result.pathname, "/new-orleans/tours");
  });

  await t.test("preserves existing /tours/[slug] routing", () => {
    const req = buildRequest("welcometoneworleanstours.com", "/tours/city-tour-of-new-orleans");
    const result = getWtonotHostRewrite(req);
    assert.ok(result);
    assert.strictEqual(result.pathname, "/new-orleans/tours/city-tour-of-new-orleans");
  });

  await t.test("preserves existing category routing", () => {
    const req = buildRequest("welcometoneworleanstours.com", "/ghost-tours");
    const result = getWtonotHostRewrite(req);
    assert.ok(result);
    assert.strictEqual(result.pathname, "/new-orleans/marketplace-category/ghost-tours");
  });

  await t.test("preserves existing guide routing", () => {
    const req = buildRequest("welcometoneworleanstours.com", "/guides/weekend-trip");
    const result = getWtonotHostRewrite(req);
    assert.ok(result);
    assert.strictEqual(result.pathname, "/new-orleans/guides/weekend-trip");
  });

  await t.test("another satellite host is unaffected", () => {
    const req = buildRequest("lastfrontiershoreexcursions.com", "/contact");
    const result = getWtonotHostRewrite(req);
    assert.strictEqual(result, null);
  });
});
