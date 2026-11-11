import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import {
  HELD_COMBO_SLUG,
  HELD_JEAN_LAFITTE_SLUG,
  isHeldProduct,
} from "@/app/new-orleans/data/truthPolicy";
import {
  getProductActiveBookingVariants,
  getProductPrimaryBookingHref,
  getProductViatorCanonicalInfo,
  STOREFRONT_PRODUCTS,
} from "@/app/new-orleans/tours/pageConfig";
import { normalizeFareHarborFallbackHref } from "@/app/new-orleans/lib/fareHarborAttribution";
import { buildWtonotSitemapPaths } from "@/app/sitemap.xml/handler";
import { GET as getDccGoOut } from "@/app/go/out/route";
import {
  getAllAlaskaShips,
  getTrackedTourUrl,
} from "../../apps/last-frontier-shore-excursions/lib/alaska-ships";
import { AFFILIATE_CATALOG } from "../../apps/last-frontier-shore-excursions/lib/affiliate/catalog";
import { GET as getJfdNextDepartures } from "../../apps/juneauflightdeck/app/api/next-departures/route";
import { isPendingConciergeReviewStatus } from "../../apps/juneauflightdeck/lib/waitlistStore";

const ROOT = process.cwd();

test("Safeguards 1a–1d & 2 (WNO): Jean Lafitte held, typo fixed, Ragin' Cajun attributed, schedule-uuid & dead 566794 removed", () => {
  assert.equal(isHeldProduct(HELD_COMBO_SLUG), true);
  assert.equal(isHeldProduct(HELD_JEAN_LAFITTE_SLUG), true);

  const jeanLafitteProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === HELD_JEAN_LAFITTE_SLUG);
  assert.ok(jeanLafitteProduct);
  assert.equal(getProductPrimaryBookingHref(jeanLafitteProduct), "");
  assert.equal(getProductViatorCanonicalInfo(jeanLafitteProduct).productCode, "");
  assert.equal(getProductViatorCanonicalInfo(jeanLafitteProduct).destinationUrl, "");
  assert.deepEqual(getProductActiveBookingVariants(jeanLafitteProduct), []);

  const ltcProduct = STOREFRONT_PRODUCTS.find(
    (p) => p.slug === "louisiana-tour-company-swamp-tour-hotel-pickup",
  );
  assert.ok(ltcProduct);
  const ltcInfo = getProductViatorCanonicalInfo(ltcProduct);
  assert.equal(ltcInfo.productCode, "15200P6");

  const pageConfigRaw = fs.readFileSync(
    path.join(ROOT, "app/new-orleans/tours/pageConfig.ts"),
    "utf8",
  );
  assert.ok(!pageConfigRaw.includes("WelcomeToNewOrelansTours"), "Misspelled Orelans ref must be eliminated");
  assert.ok(!pageConfigRaw.includes("schedule-uuid="), "Hardcoded schedule-uuid must be eliminated");
  assert.ok(!pageConfigRaw.includes("566794"), "Unscheduled 566794 variant must be removed");

  const stripped = normalizeFareHarborFallbackHref({
    href: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561547/?ref=WelcomeToNewOrelansTours&asn=welcometoneworleanstours&full-items=yes&flow=1220421&schedule-uuid=154cb35d-dbcd-4233-aef8-3bc8c48776b3",
    shortname: "neworleanssteamboatcompany",
    requestedAsn: "welcometoneworleanstours",
    productSlug: "small-airboat-swamp-adventure",
  });
  assert.ok(!stripped.includes("schedule-uuid"));
  assert.ok(stripped.includes("asn=welcometoneworleanstours"));
  assert.ok(stripped.includes("ref=WelcomeToNewOrleansTours"));

  const comparePageRaw = fs.readFileSync(
    path.join(ROOT, "app/new-orleans/compare/covered-swamp-boat-vs-airboat/page.tsx"),
    "utf8",
  );
  assert.ok(
    comparePageRaw.includes(
      "https://fareharbor.com/embeds/book/ragincajuntours/?asn=aktourcenter&flow=940162&ref=wno-ragin-cajun-airboat-options&full-items=yes",
    ),
    "Ragin' Cajun link on compare page must carry full FareHarbor attribution",
  );

  const sitemapPaths = buildWtonotSitemapPaths();
  assert.ok(!sitemapPaths.includes(`/tours/${HELD_JEAN_LAFITTE_SLUG}`));
  assert.ok(!sitemapPaths.includes(`/tours/${HELD_COMBO_SLUG}`));
});

test("Safeguards 1e, 1f & 2 (LFSE): Dog-sled vs wheeled-cart & Aleutian Ballad mismatches eliminated, victoria-bc retired", () => {
  const wheeledCamp = AFFILIATE_CATALOG.find((item) => item.productId === "62390P4");
  assert.ok(wheeledCamp);
  assert.equal(wheeledCamp.attributionCampaign, "juneau-wheeled-sled-dog-camp");
  assert.match(wheeledCamp.priceNote || "", /no helicopter flight/i);

  const heliDogsledUrl = getTrackedTourUrl(
    "Mendenhall Glacier Dog Sledding & Helicopter Flight",
    "Juneau",
    "koningsdam",
  );
  assert.ok(heliDogsledUrl);
  assert.ok(
    heliDogsledUrl.startsWith("https://juneauflightdeck.com/juneau-dogsled-helicopter-tours"),
    `Expected specialist JFD handoff, got ${heliDogsledUrl}`,
  );
  assert.ok(!heliDogsledUrl.includes("62390P4"));

  assert.equal(
    getTrackedTourUrl(
      "Bering Sea Crab Fishermen’s Tour aboard the Aleutian Ballad",
      "Ketchikan",
      "norwegian-jewel",
    ),
    null,
  );
  assert.equal(
    getTrackedTourUrl("Bering Sea Crab Fishermen’s Tour", "Ketchikan", "carnival-spirit"),
    null,
  );
  assert.equal(
    getTrackedTourUrl("Wilderness Sea Kayaking from Ward Cove", "Ketchikan", "norwegian-encore"),
    null,
  );

  for (const ship of getAllAlaskaShips()) {
    assert.equal("victoria-bc" in ship.ports, false, `Ship ${ship.slug} must not include victoria-bc`);
  }
});

test("Safeguards 1g & 4 (JFD): Simulated departures & automated scanning claims replaced with Human Concierge Review", async () => {
  assert.equal(isPendingConciergeReviewStatus("concierge_review"), true);
  assert.equal(isPendingConciergeReviewStatus("active_scanning"), true);
  assert.equal(isPendingConciergeReviewStatus("contact_pending"), false);

  const res = await getJfdNextDepartures(
    new Request("https://juneauflightdeck.com/api/next-departures?date=2027-06-14&after=09:00&travelers=2"),
  );
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.checkedOperators, 0);
  assert.equal(body.scannerOperational, false);
  assert.equal(body.mode, "concierge_review");
  assert.deepEqual(body.departures, []);

  const jfdFilesToAudit = [
    "apps/juneauflightdeck/app/components/SeatScannerTicker.tsx",
    "apps/juneauflightdeck/app/components/NextHelicopterFinder.tsx",
    "apps/juneauflightdeck/app/components/LiveSeatDropsBadge.tsx",
    "apps/juneauflightdeck/app/components/HelicopterDispatchBoard.tsx",
    "apps/juneauflightdeck/app/components/HelicopterWaitlistForm.tsx",
    "apps/juneauflightdeck/app/helicopter-waitlist/page.tsx",
    "apps/juneauflightdeck/app/helicopter-waitlist/[shipSlug]/page.tsx",
    "apps/juneauflightdeck/app/dispatch/page.tsx",
    "apps/juneauflightdeck/app/faq/page.tsx",
  ];

  const bannedPhrases = [
    "24/7 HELICOPTER SEAT SCANNER",
    "Claimed 2 glacier landing seats",
    "24/7 automated helicopter cancellation seat scanner",
    "Run 10:00 AM Sweep Now",
    "Targeted 10:00 AM Scan Strategy",
    "Join 10 AM Seat Watch",
    "before your tour is even canceled",
  ];

  for (const relPath of jfdFilesToAudit) {
    const src = fs.readFileSync(path.join(ROOT, relPath), "utf8");
    for (const phrase of bannedPhrases) {
      assert.ok(!src.includes(phrase), `Banned simulated/scanner claim '${phrase}' found in ${relPath}`);
    }
  }
});

test("Safeguard 3 & DCC /go/out: Affiliate identifiers frozen and specialist outbound allowlist enforced", async () => {
  // Verify frozen affiliate identifiers remain present in their canonical source files
  assert.match(
    fs.readFileSync(path.join(ROOT, "apps/juneauflightdeck/app/page.tsx"), "utf8"),
    /P00058396/,
  );
  assert.match(
    fs.readFileSync(path.join(ROOT, "app/new-orleans/tours/pageConfig.ts"), "utf8"),
    /P00306962/,
  );
  assert.match(
    fs.readFileSync(path.join(ROOT, "apps/last-frontier-shore-excursions/lib/affiliate/links.ts"), "utf8"),
    /P00281144/,
  );
  assert.match(
    fs.readFileSync(path.join(ROOT, "apps/last-frontier-shore-excursions/lib/affiliate/links.ts"), "utf8"),
    /F2MMUUH/,
  );
  assert.match(
    fs.readFileSync(path.join(ROOT, "apps/last-frontier-shore-excursions/app/page.tsx"), "utf8"),
    /welcometoalaskatours/,
  );
  assert.ok(
    STOREFRONT_PRODUCTS.some((p) =>
      p.bookingVariants?.some((v) => v.bookingUrl.includes("asn=aktourcenter")),
    ),
  );
  assert.ok(
    STOREFRONT_PRODUCTS.some((p) =>
      p.bookingVariants?.some((v) => v.bookingUrl.includes("asn=welcometoneworleanstours")),
    ),
  );
  assert.match(
    fs.readFileSync(path.join(ROOT, "app/new-orleans/lib/fareHarborAttribution.ts"), "utf8"),
    /wtonot-tours/,
  );

  // DCC /go/out allows WNO, JFD, LFSE and blocks WTA (403)
  const wnoRes = await getDccGoOut(
    new NextRequest(
      "https://www.destinationcommandcenter.com/go/out?url=https%3A%2F%2Fwww.welcometoneworleanstours.com%2Fguides%2Fthings-to-do-before-a-cruise-new-orleans&mode=json",
    ),
  );
  assert.equal(wnoRes.status, 200);

  const wtaRes = await getDccGoOut(
    new NextRequest(
      "https://www.destinationcommandcenter.com/go/out?url=https%3A%2F%2Fwelcometoalaskatours.com%2Fports%2Fjuneau&mode=json",
    ),
  );
  assert.equal(wtaRes.status, 403);
});
