import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DCC_CANONICAL_RELATIONSHIP,
  DCC_THREE_PART_POSITIONING,
  getOrganizationSchema,
  getWebsiteSchema,
} from "../../src/data/site-identity";
import { DCC_PRODUCT_SCOPE } from "../../lib/dcc/productScope";

const ROOT = process.cwd();

test("DCC structured data defines stable @id and reciprocal hasPart -> Cruise Promenade without sameAs", () => {
  const org = getOrganizationSchema() as Record<string, unknown>;
  const site = getWebsiteSchema() as Record<string, unknown>;

  assert.equal(org["@id"], "https://destinationcommandcenter.com/#organization");
  assert.equal(site["@id"], "https://destinationcommandcenter.com/#website");
  assert.equal("sameAs" in org, false);
  assert.equal("sameAs" in site, false);

  const hasPart = site.hasPart as Array<Record<string, unknown>>;
  assert.ok(Array.isArray(hasPart));
  assert.ok(hasPart.some((p) => p["@id"] === "https://cruisepromenade.com/#website"));
  assert.ok(hasPart.some((p) => p["@id"] === "https://cruisepromenade.com/#app"));
  for (const part of hasPart) {
    assert.equal("sameAs" in part, false);
  }
});

test("DCC homepage, about page, llms.txt, agent.json, scope.json, and .well-known/dcc-site state canonical Cruise Promenade relationship", () => {
  assert.equal(
    DCC_PRODUCT_SCOPE.networkPositioning.relationshipStatement,
    DCC_CANONICAL_RELATIONSHIP,
  );
  assert.equal(
    DCC_PRODUCT_SCOPE.networkPositioning.threePartPositioning.dcc,
    DCC_THREE_PART_POSITIONING.dcc,
  );

  const files = [
    "app/components/dcc/LocationFirstHomeFast.tsx",
    "app/about/page.tsx",
    "app/llms.txt/route.ts",
    "app/agent.json/route.ts",
    "app/.well-known/dcc-site/route.ts",
  ];

  for (const rel of files) {
    const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
    assert.ok(
      src.includes(DCC_CANONICAL_RELATIONSHIP),
      `Expected canonical relationship statement in ${rel}`,
    );
    assert.ok(
      src.includes("https://cruisepromenade.com"),
      `Expected https://cruisepromenade.com link in ${rel}`,
    );
  }
});
