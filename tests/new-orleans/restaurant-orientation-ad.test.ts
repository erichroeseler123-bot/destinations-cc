import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const restaurantSectionPages = [
  "app/new-orleans/food/page.tsx",
  "app/new-orleans/restaurant-partners/page.tsx",
];

test("restaurant section promotes the $5 French Quarter Orientation", async (t) => {
  await t.test("shared ad points to the owned orientation service", () => {
    const component = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/components/RestaurantOrientationAd.tsx"),
      "utf8",
    );
    assert.ok(component.includes("French Quarter Morning Orientation — $5"));
    assert.ok(component.includes("/guides/french-quarter-orientation"));
    assert.ok(component.includes("$5 per person"));
    assert.ok(component.includes("8:00 AM and 9:30 AM"));
    assert.ok(component.includes("Moonwalk beside Café Du Monde"));
    assert.ok(component.includes("Text to Reserve"));
  });

  for (const pagePath of restaurantSectionPages) {
    await t.test(`${pagePath} renders the shared orientation ad`, () => {
      const source = fs.readFileSync(path.join(process.cwd(), pagePath), "utf8");
      assert.ok(source.includes("RestaurantOrientationAd"), `${pagePath} must import the shared ad`);
      assert.ok(source.includes("<RestaurantOrientationAd />"), `${pagePath} must render the shared ad`);
    });
  }
});
