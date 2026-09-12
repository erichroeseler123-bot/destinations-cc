import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

test("denver-airport-pickup page meets all content and SEO requirements", () => {
  const pageSource = fs.readFileSync(
    path.join(TEST_DIR, "../app/denver-airport-pickup/page.tsx"),
    "utf8",
  );

  // Title & H1
  assert.match(pageSource, /title:\s*"420 Airport Pickup Denver \| Private DEN Airport Transportation"/);
  assert.match(pageSource, /<h1[^>]*>Denver Airport Pickup<\/h1>/);

  // Canonical
  assert.match(pageSource, /canonical:\s*"https:\/\/420friendlyairportpickup\.com\/denver-airport-pickup"/);

  // Primary CTA
  assert.match(pageSource, /Book Denver Airport Pickup/);

  // Phone number with tel: link
  assert.match(pageSource, /\(720\) 369-6292/);
  assert.match(pageSource, /tel:17203696292/);

  // Dedicated guide section
  assert.match(pageSource, /Where do I pick up arriving passengers at Denver Airport\?/);
  assert.match(pageSource, /Level 4/);
  assert.match(pageSource, /Level 5/);
  assert.match(pageSource, /Island 2/);
  assert.match(pageSource, /Level 6/);
  assert.match(pageSource, /Cell Phone/);

  // Operating authority & legal accuracy
  assert.match(pageSource, /CO PUC LL-03577/);
  assert.match(pageSource, /GoSno LLC/);

  // Strict competitor name exclusion
  assert.doesNotMatch(pageSource, /Freedom Cab/i);
  assert.doesNotMatch(pageSource, /Friendly Taxi/i);

  // Schema.org validation
  assert.match(pageSource, /"@type":\s*"LocalBusiness"/);
  assert.match(pageSource, /"@type":\s*"TaxiService"/);
  assert.match(pageSource, /"@type":\s*"FAQPage"/);
});
