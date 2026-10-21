import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("DCC Location Snapshot Freshness & Coordinate Search Accessibility (#177)", async (t) => {
  await t.test("1. ServerLocationSnapshot compares freshUntil against current time before rendering Verified Fresh", () => {
    const pageSource = fs.readFileSync(
      path.join(process.cwd(), "app/location/[lat]/[lng]/page.tsx"),
      "utf8"
    );
    assert.match(pageSource, /const freshUntilMs = freshUntil \? new Date\(freshUntil\)\.getTime\(\) : Number\.NaN/);
    assert.match(pageSource, /freshUntilMs > Date\.now\(\)/);
    assert.match(pageSource, /Operational · Verified Fresh/);
    assert.match(pageSource, /Snapshot cached · See live feed below/);
  });

  await t.test("2. LocationFirstHomeFast exposes search landmark, aria-live disambiguation status, and h3 cards under h2", () => {
    const homeSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/dcc/LocationFirstHomeFast.tsx"),
      "utf8"
    );
    assert.match(homeSource, /role="search"/);
    assert.match(homeSource, /aria-label="Coordinate and venue search"/);
    assert.match(homeSource, /aria-live="polite"/);
    assert.match(homeSource, /role="status"/);
    assert.match(homeSource, /<h3 className="text-lg font-black text-white mt-3">Red Rocks Concert Amphitheatre<\/h3>/);
    assert.match(homeSource, /<h3 className="text-lg font-black text-white mt-3">Breckenridge & I-70 Corridor<\/h3>/);
    assert.match(homeSource, /<h3 className="text-lg font-black text-white mt-3">Clear Creek Whitewater Rafting<\/h3>/);
  });
});
