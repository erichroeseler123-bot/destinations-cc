import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

test("New Orleans dinner + live event visitor loop", async (t) => {
  await t.test("publishes the three visitor event windows", () => {
    for (const file of [
      "app/new-orleans/whats-happening/page.tsx",
      "app/new-orleans/tonight/page.tsx",
      "app/new-orleans/this-weekend/page.tsx",
    ]) {
      assert.ok(fs.existsSync(path.join(process.cwd(), file)), `${file} should exist`);
      const source = read(file);
      assert.ok(source.includes('dynamic = "force-dynamic"'), `${file} should remain live/dynamic`);
      assert.ok(source.includes("LiveNightGuide"), `${file} should use the shared visitor guide`);
    }
  });

  await t.test("uses Ticketmaster as the broad New Orleans city feed", () => {
    const source = read("app/new-orleans/lib/liveEvents.ts");
    assert.ok(source.includes("ticketmasterAdapter.fetch"));
    assert.ok(source.includes("29.9511"));
    assert.ok(source.includes("-90.0715"));
    assert.ok(source.includes('timeZone: "America/Chicago"'));
  });

  await t.test("live event cards route visitors into dinner and tomorrow morning", () => {
    const source = read("app/new-orleans/components/LiveNightGuide.tsx");
    assert.ok(source.includes("Make a night of it"));
    assert.ok(source.includes("Find dinner before it"));
    assert.ok(source.includes("/new-orleans/food#new-orleans-staples"));
    assert.ok(source.includes("RestaurantOrientationAd"));
    assert.ok(source.includes("Browse evening-friendly tours"));
  });

  await t.test("restaurant guide sends diners into the live event loop", () => {
    const source = read("app/new-orleans/food/page.tsx");
    assert.ok(source.includes("Dinner + something"));
    assert.ok(source.includes("What’s happening after dinner?"));
    assert.ok(source.includes("/new-orleans/tonight"));
    assert.ok(source.includes("/new-orleans/this-weekend"));
    assert.ok(source.includes('id="new-orleans-staples"'));
  });

  await t.test("does not claim ticket pricing or availability is controlled by us", () => {
    const source = read("app/new-orleans/components/LiveNightGuide.tsx");
    assert.ok(source.includes("Event availability, start times, ticket prices, venue policies, and ticket terms are controlled by the event/ticket provider"));
  });
});
