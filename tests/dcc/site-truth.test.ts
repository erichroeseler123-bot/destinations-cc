import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { DCC_SITE_TRUTH, getDccSiteTruth } from "../../lib/dcc/siteTruth";
import { DCC_PORTFOLIO_SITES } from "../../lib/dcc/portfolioRegistry";

const repo = process.cwd();

function read(path: string) {
  return readFileSync(resolve(repo, path), "utf8");
}

test("portfolio truth uses unique IDs, DCC IDs and canonical URLs", () => {
  const ids = DCC_SITE_TRUTH.map((record) => record.id);
  const dccIds = DCC_SITE_TRUTH.map((record) => record.dcc_id);
  const urls = DCC_SITE_TRUTH.map((record) => record.url);

  assert.equal(new Set(ids).size, ids.length, "duplicate portfolio site id");
  assert.equal(new Set(dccIds).size, dccIds.length, "duplicate DCC site id");
  assert.equal(new Set(urls).size, urls.length, "duplicate canonical site URL");

  for (const record of DCC_SITE_TRUTH) {
    assert.match(record.dcc_id, /^dcc:site:[a-z0-9-]+$/);
    assert.match(record.provenance.last_verified, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(record.authority.length > 0, `${record.id} needs an authority boundary`);
    assert.ok(record.role.length > 0, `${record.id} needs a public role`);
  }
});

test("portfolio directory is derived from the canonical truth records", () => {
  assert.equal(DCC_PORTFOLIO_SITES.length, DCC_SITE_TRUTH.length);
  for (const record of DCC_SITE_TRUTH) {
    const directoryRecord = DCC_PORTFOLIO_SITES.find((site) => site.id === record.id);
    assert.ok(directoryRecord, `missing portfolio directory record for ${record.id}`);
    assert.equal(directoryRecord?.status.state, record.status.state);
    assert.equal(directoryRecord?.provenance.last_verified, record.provenance.last_verified);
  }
});

test("Big Sky opening announcement cannot be mistaken for live service", () => {
  const bigSky = getDccSiteTruth("bigsky-gosno");
  assert.ok(bigSky);
  assert.equal(bigSky.status.state, "prelaunch");
  assert.equal(bigSky.status.effective_from, "2026-11-15");
  assert.equal(bigSky.public_claims?.first_service_date, "2026-11-15");
});

test("ShuttleYa truth keeps the retired Argo service retired everywhere", () => {
  const shuttleya = getDccSiteTruth("shuttleya");
  assert.ok(shuttleya);
  assert.equal(shuttleya.booking?.takes_payment, false);
  assert.equal(shuttleya.public_claims?.operates_vehicles, false);
  assert.equal(shuttleya.public_claims?.direct_transportation_checkout, false);
  assert.equal(shuttleya.public_claims?.denver_to_mighty_argo_scheduled_shuttle, "retired_not_operating");

  const surfaces = [
    "lib/dcc/shuttleyaTruth.ts",
    "app/shuttleya/page.tsx",
    "app/shuttleya/agent.json/route.ts",
    "app/shuttleya/llms.txt/route.ts",
    "apps/shuttleya/lib/siteTruth.ts",
    "apps/shuttleya/app/page.tsx",
    "apps/shuttleya/app/agent.json/route.ts",
    "apps/shuttleya/app/llms.txt/route.ts",
  ];

  const forbidden = [
    "Initiate $35 Checkout",
    "Book Your Seat Now",
    "STATUS: ACTIVE",
    "9AM Shuttle to Mighty Argo Cable Car",
  ];

  for (const path of surfaces) {
    const source = read(path);
    for (const phrase of forbidden) {
      assert.equal(source.includes(phrase), false, `${path} contains retired-service CTA: ${phrase}`);
    }
  }

  assert.ok(read("app/shuttleya/page.tsx").includes("SHUTTLEYA_ROOT_TRUTH"));
  assert.ok(read("app/shuttleya/agent.json/route.ts").includes("SHUTTLEYA_ROOT_TRUTH"));
  assert.ok(read("app/shuttleya/llms.txt/route.ts").includes("SHUTTLEYA_ROOT_TRUTH"));
  assert.ok(read("apps/shuttleya/app/page.tsx").includes("SHUTTLEYA_TRUTH"));
  assert.ok(read("apps/shuttleya/app/agent.json/route.ts").includes("SHUTTLEYA_TRUTH"));
  assert.ok(read("apps/shuttleya/app/llms.txt/route.ts").includes("SHUTTLEYA_TRUTH"));
});
