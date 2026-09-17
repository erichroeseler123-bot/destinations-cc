import test from "node:test";
import assert from "node:assert/strict";
import { getExcursionsByActivity } from "../../apps/last-frontier-shore-excursions/lib/affiliate/catalog";
import { buildAffiliateUrl, buildViatorSearchUrl } from "../../apps/last-frontier-shore-excursions/lib/affiliate/links";

test("LFSE Juneau helicopter-glacier-tours uses direct verified Viator product listing", () => {
  const excursions = getExcursionsByActivity("juneau", "helicopter-glacier-tours");
  assert.ok(excursions.length > 0, "Expected at least one excursion for Juneau helicopter-glacier-tours");

  const heliTour = excursions[0];
  assert.equal(heliTour.source, "viator");
  assert.equal(heliTour.productId, "6251SHOREXICEWALK");
  assert.equal(heliTour.isExactProduct, true);
  assert.equal(heliTour.provider, "Coastal Helicopters");
  assert.notEqual(heliTour.provider, "Temsco Helicopters", "Viator 6251SHOREXICEWALK must be mapped to Coastal Helicopters, not Temsco");
  assert.equal(
    heliTour.officialUrl,
    "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK"
  );
  assert.ok(!heliTour.officialUrl.includes("searchResults"), "Specific product officialUrl must never be a searchResults URL");
});

test("LFSE product CTAs generate direct product URLs with intact affiliate tracking", () => {
  const excursions = getExcursionsByActivity("juneau", "helicopter-glacier-tours");
  const heliTour = excursions[0];

  const affiliateUrl = buildAffiliateUrl(
    heliTour.source,
    heliTour.officialUrl,
    heliTour.attributionCampaign,
    heliTour.title,
    heliTour.isExactProduct
  );

  const parsed = new URL(affiliateUrl);

  // Direct product path verification
  assert.equal(parsed.origin, "https://www.viator.com");
  assert.ok(
    parsed.pathname.includes("/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK"),
    `Expected direct product path with 6251SHOREXICEWALK, got ${parsed.pathname}`
  );
  assert.ok(!parsed.pathname.includes("searchResults"), "Must not route to searchResults");

  // Tracking parameters intact
  assert.equal(parsed.searchParams.get("mcid"), "42383");
  assert.equal(parsed.searchParams.get("medium"), "link");
  assert.equal(parsed.searchParams.get("campaign"), "last-frontier-juneau-heli-glacier-walk");
  assert.equal(parsed.searchParams.get("utm_source"), "lastfrontiershoreexcursions.com");
  assert.equal(parsed.searchParams.get("utm_medium"), "affiliate");
  assert.equal(parsed.searchParams.get("utm_campaign"), "last-frontier-juneau-heli-glacier-walk");
});

test("Hero, Card, and Table CTA contracts for Juneau helicopter tour", () => {
  const excursions = getExcursionsByActivity("juneau", "helicopter-glacier-tours");
  const heliTour = excursions[0];

  // 1. Hero CTA contract
  const hasExactProduct = Boolean(heliTour.isExactProduct && heliTour.productId);
  assert.equal(hasExactProduct, true);
  const heroCtaText = hasExactProduct
    ? "Check live tour options & availability →"
    : "Browse more tours on Viator →";
  assert.equal(heroCtaText, "Check live tour options & availability →");

  const heroUrl = buildAffiliateUrl(
    heliTour.source,
    heliTour.officialUrl,
    heliTour.attributionCampaign,
    heliTour.title,
    heliTour.isExactProduct
  );
  assert.ok(heroUrl.includes("6251SHOREXICEWALK"), "Hero CTA must point to 6251SHOREXICEWALK");
  assert.ok(!heroUrl.includes("searchResults"), "Hero CTA must not point to search");

  // 2. Product Card CTA contract
  const partnerName = heliTour.source === "viator" ? "Viator" : "GetYourGuide";
  const cardCtaLabel = heliTour.isExactProduct && heliTour.productId
    ? `Check Availability on ${partnerName} →`
    : `Browse more tours on ${partnerName} →`;
  assert.equal(cardCtaLabel, "Check Availability on Viator →");

  const cardUrl = buildAffiliateUrl(
    heliTour.source,
    heliTour.officialUrl,
    heliTour.attributionCampaign,
    heliTour.title,
    heliTour.isExactProduct
  );
  assert.ok(cardUrl.includes("6251SHOREXICEWALK"), "Card CTA must point to 6251SHOREXICEWALK");
  assert.ok(!cardUrl.includes("searchResults"), "Card CTA must not point to search");

  // 3. Comparison Table CTA contract
  const tableCtaText = heliTour.isExactProduct && heliTour.productId
    ? `Check on ${partnerName}`
    : `Browse more tours →`;
  assert.equal(tableCtaText, "Check on Viator");

  const tableUrl = buildAffiliateUrl(
    heliTour.source,
    heliTour.officialUrl,
    heliTour.attributionCampaign,
    heliTour.title,
    heliTour.isExactProduct
  );
  assert.ok(tableUrl.includes("6251SHOREXICEWALK"), "Table CTA must point to 6251SHOREXICEWALK");
  assert.ok(!tableUrl.includes("searchResults"), "Table CTA must not point to search");
});

test("Generic Viator search is reserved only for explicit browse-more fallback", () => {
  const fallbackUrl = buildViatorSearchUrl("Juneau Alaska Helicopter Glacier Landing", "helicopter-glacier-tours-browse-more");
  const parsed = new URL(fallbackUrl);

  assert.equal(parsed.pathname, "/searchResults/all");
  assert.equal(parsed.searchParams.get("text"), "Juneau Alaska Helicopter Glacier Landing");
  assert.equal(parsed.searchParams.get("mcid"), "42383");
  assert.equal(parsed.searchParams.get("medium"), "link");
  assert.equal(parsed.searchParams.get("campaign"), "last-frontier-helicopter-glacier-tours-browse-more");
});
