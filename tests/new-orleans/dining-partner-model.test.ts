import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  ACTIVE_DINING_PARTNERS,
  DEFAULT_SEATED_GUEST_FEE_USD,
  DINING_DISCLOSURE,
  DINING_PARTNERS,
  buildDiningReferralUrl,
  type DiningPartner,
} from "../../app/new-orleans/data/diningPartners";
import {
  DINING_STAPLES,
  DINING_STAPLES_DISCLOSURE,
} from "../../app/new-orleans/data/diningStaples";

test("New Orleans dining partner referral MVP", async (t) => {
  await t.test("uses the $5 confirmed-seated-guest pilot fee", () => {
    assert.strictEqual(DEFAULT_SEATED_GUEST_FEE_USD, 5);
  });

  await t.test("does not publish fake restaurant partners", () => {
    assert.deepStrictEqual(DINING_PARTNERS, []);
    assert.deepStrictEqual(ACTIVE_DINING_PARTNERS, []);
  });

  await t.test("only active partners can appear publicly", () => {
    assert.ok(ACTIVE_DINING_PARTNERS.every((partner) => partner.status === "active"));
  });

  await t.test("adds partner and source attribution to reservation links", () => {
    const partner: DiningPartner = {
      id: "test-restaurant",
      name: "Test Restaurant",
      status: "active",
      neighborhood: "French Quarter",
      cuisineTags: ["Creole"],
      fitTags: ["Dinner"],
      reservationUrl: "https://reservations.example.com/book?existing=1",
      referralCode: "wtono-test-001",
      seatedGuestFeeUsd: 5,
      disclosure: DINING_DISCLOSURE,
    };

    const href = buildDiningReferralUrl(partner, "food-page");
    assert.ok(href);
    const url = new URL(href!);
    assert.strictEqual(url.searchParams.get("existing"), "1");
    assert.strictEqual(url.searchParams.get("wtono_ref"), "wtono-test-001");
    assert.strictEqual(url.searchParams.get("wtono_src"), "food-page");
  });

  await t.test("publishes a substantive independent staple layer", () => {
    assert.strictEqual(DINING_STAPLES.length, 9);
    const names = DINING_STAPLES.map((restaurant) => restaurant.name);
    for (const required of [
      "Café du Monde — French Market",
      "Central Grocery & Deli",
      "Antoine's Restaurant",
      "Brennan's",
      "Galatoire's",
      "Commander's Palace",
      "Acme Oyster House — French Quarter",
      "Dooky Chase's Restaurant",
      "Parkway Bakery & Tavern",
    ]) {
      assert.ok(names.includes(required), `Missing staple: ${required}`);
    }
    assert.ok(DINING_STAPLES.every((restaurant) => restaurant.editorialLabel === "New Orleans Staple"));
    assert.ok(DINING_STAPLES.every((restaurant) => restaurant.websiteUrl.startsWith("https://")));
    assert.match(DINING_STAPLES_DISCLOSURE, /not shown here because it paid us/i);
    assert.match(DINING_STAPLES_DISCLOSURE, /do not receive a referral fee/i);
  });

  await t.test("food page clearly separates free staples from paid partners", () => {
    const foodPage = fs.readFileSync(path.join(process.cwd(), "app/new-orleans/food/page.tsx"), "utf8");
    assert.ok(foodPage.includes("Where should we eat?"));
    assert.ok(foodPage.includes("504-484-9687"));
    assert.ok(foodPage.includes("New Orleans staples"));
    assert.ok(foodPage.includes("Not sponsored"));
    assert.ok(foodPage.includes("No paid Dining Partners yet."));
    assert.ok(foodPage.includes("DINING_STAPLES_DISCLOSURE"));
    assert.ok(foodPage.includes("/new-orleans/restaurant-partners"));
  });

  await t.test("partner page defines confirmed-seated-only billing", () => {
    const page = fs.readFileSync(path.join(process.cwd(), "app/new-orleans/restaurant-partners/page.tsx"), "utf8");
    assert.ok(page.includes("per confirmed seated guest"));
    assert.ok(page.includes("Only confirmed seated guests are billable"));
    assert.ok(page.includes("$0"));
  });
});
