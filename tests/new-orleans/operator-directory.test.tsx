import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { RESEARCHED_OPERATORS, getOperatorBooking } from "../../app/new-orleans/data/operatorDirectory";
import ResearchedOperatorProfile from "../../app/new-orleans/components/ResearchedOperatorProfile";
import OperatorsPage from "../../app/new-orleans/operators/page";
import { buildWtonotSitemapPaths } from "../../app/sitemap.xml/handler";
import { getWtonotHostRewrite } from "../../proxy";

test("researched operators have distinct profiles, official HTTPS links, and verified partner booking links", () => {
  assert.equal(RESEARCHED_OPERATORS.length, 6);
  assert.equal(new Set(RESEARCHED_OPERATORS.map((operator) => operator.slug)).size, 6);
  const paths = buildWtonotSitemapPaths();
  assert.ok(paths.includes("/operators"));
  for (const operator of RESEARCHED_OPERATORS) {
    assert.equal(new URL(operator.officialUrl).protocol, "https:");
    assert.ok(paths.includes(`/operators/${operator.slug}`));
    assert.ok(operator.products.length > 0);
    for (const product of operator.products) {
      const booking = getOperatorBooking(product, operator.slug);
      const url = new URL(booking.url);
      assert.equal(url.hostname, "www.viator.com");
      assert.equal(url.searchParams.get("pid"), "P00306962");
      assert.equal(url.searchParams.get("mcid"), "42383");
      assert.match(url.pathname, /d675-/);
    }
    const html = renderToStaticMarkup(<ResearchedOperatorProfile operator={operator} />);
    assert.ok(html.includes(operator.name));
    assert.ok(html.includes(operator.officialUrl));
    assert.match(html, /Check dates &amp; prices on Viator/);
    assert.match(html, /rel="sponsored noopener"/);
    const request = new NextRequest(`https://welcometoneworleanstours.com/operators/${operator.slug}`);
    assert.equal(getWtonotHostRewrite(request)?.pathname, `/new-orleans/operators/${operator.slug}`);
  }
});

test("directory includes existing operators and preserves existing tour links and explains partner booking", () => {
  const html = renderToStaticMarkup(<OperatorsPage />);
  for (const name of ["Southern Style Tours", "Airboat Adventures", "NOLA Ghost Riders", ...RESEARCHED_OPERATORS.map((operator) => operator.name)]) assert.ok(html.includes(name));
  assert.match(html, /each tour has its own reservation/);
  assert.ok(html.includes("/tours/airboat-adventures"));
  assert.ok(html.includes("/tours/nola-ghost-riders"));
  const script = html.match(/<script[^>]*>(.*?)<\/script>/)?.[1];
  const schema = JSON.parse(script!);
  assert.equal(schema["@type"], "ItemList");
  assert.equal(new Set(schema.itemListElement.map((item: { url: string }) => item.url)).size, schema.itemListElement.length);
  const request = new NextRequest("https://welcometoneworleanstours.com/operators");
  assert.equal(getWtonotHostRewrite(request)?.pathname, "/new-orleans/operators");
});

 test("configured FareHarbor booking takes priority over Viator fallback", () => {
  const product = RESEARCHED_OPERATORS[0].products[0];
  const fareHarborUrl = "https://fareharbor.com/embeds/book/example/items/1/?asn=aktourcenter";
  assert.deepEqual(getOperatorBooking({ ...product, fareHarborUrl }, "test"), { provider: "FareHarbor", url: fareHarborUrl });
});
