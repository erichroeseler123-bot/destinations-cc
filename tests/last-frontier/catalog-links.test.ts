import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AFFILIATE_CATALOG, matchCatalogExcursion } from "../../apps/last-frontier-shore-excursions/lib/affiliate/catalog";
import { buildAffiliateUrl } from "../../apps/last-frontier-shore-excursions/lib/affiliate/links";
import { DECISION_PAGES } from "../../apps/last-frontier-shore-excursions/lib/decisionPages";

const VERIFIED_PRODUCT_IDS = [
  "331813P1",
  "466119P3",
  "5857SHUTTLE",
  "6251SHOREXICEWALK",
  "62390P4",
  "110048P1",
  "5338PRTSGYCITY",
  "5338PRTSGYFULL",
  "10649P17",
  "6459PRTKTNMISTY",
  "472133P3",
  "445368P5",
  "472133P4",
  "64781P20",
  "14707P1",
] as const;

describe("Last Frontier Shore Excursions - Viator Direct Link Verification", () => {
  it("contains exactly 15 catalog items", () => {
    assert.equal(AFFILIATE_CATALOG.length, 15, "Catalog must contain exactly 15 tours");
  });

  it("every catalog entry is an exact Viator product with a verified productId", () => {
    const catalogProductIds = AFFILIATE_CATALOG.map((item) => item.productId);

    for (const expectedId of VERIFIED_PRODUCT_IDS) {
      assert.ok(
        catalogProductIds.includes(expectedId),
        `Missing verified product ID in catalog: ${expectedId}`
      );
    }

    for (const item of AFFILIATE_CATALOG) {
      assert.equal(item.source, "viator", `Item ${item.title} must have source 'viator'`);
      assert.equal(item.isExactProduct, true, `Item ${item.title} must have isExactProduct: true`);
      assert.ok(item.productId, `Item ${item.title} must have non-null productId`);
      assert.ok(
        VERIFIED_PRODUCT_IDS.includes(item.productId as any),
        `Item ${item.title} has unexpected productId: ${item.productId}`
      );
    }
  });

  it("no catalog item uses /searchResults/all or generic search", () => {
    for (const item of AFFILIATE_CATALOG) {
      assert.ok(
        !item.officialUrl.includes("searchResults"),
        `Item ${item.title} (${item.productId}) officialUrl contains searchResults: ${item.officialUrl}`
      );
      assert.ok(
        !item.officialUrl.includes("/s/?"),
        `Item ${item.title} (${item.productId}) officialUrl contains search params: ${item.officialUrl}`
      );
      assert.ok(
        item.officialUrl.startsWith("https://www.viator.com/tours/"),
        `Item ${item.title} (${item.productId}) must start with https://www.viator.com/tours/`
      );
      assert.ok(
        item.officialUrl.includes(item.productId!),
        `Item ${item.title} officialUrl must contain productId ${item.productId}: ${item.officialUrl}`
      );
    }
  });

  it("Juneau Musher's Camp (62390P4) accurately describes musher camp and removes helicopter claims", () => {
    const mushersCamp = AFFILIATE_CATALOG.find((item) => item.productId === "62390P4");
    assert.ok(mushersCamp, "Juneau Musher's Camp (62390P4) must exist in catalog");

    assert.ok(
      !mushersCamp.title.toLowerCase().includes("helicopter"),
      `Title must not claim helicopter: ${mushersCamp.title}`
    );
    assert.ok(
      !mushersCamp.description.toLowerCase().includes("helicopter"),
      `Description must not claim helicopter: ${mushersCamp.description}`
    );
    for (const step of mushersCamp.itinerary) {
      assert.ok(
        !step.toLowerCase().includes("helicopter") && !step.toLowerCase().includes("flight"),
        `Itinerary step must not claim helicopter/flight: ${step}`
      );
    }
    assert.ok(
      mushersCamp.tags.includes("mushers-camp") || mushersCamp.tags.includes("dog-sledding"),
      "Must have dog-sledding or mushers-camp tags"
    );
    assert.equal(
      mushersCamp.weatherSensitivity,
      "Low",
      "Ground-based musher camp should have Low weather sensitivity"
    );
  });

  it("all 15 generated affiliate URLs are direct product URLs with full tracking parameters", () => {
    for (const item of AFFILIATE_CATALOG) {
      const generatedUrl = buildAffiliateUrl(
        item.source,
        item.officialUrl,
        item.attributionCampaign,
        item.title,
        item.isExactProduct
      );

      const parsed = new URL(generatedUrl);

      // Verify not a search result URL
      assert.ok(
        !parsed.pathname.includes("searchResults"),
        `Generated URL for ${item.productId} must not be searchResults: ${generatedUrl}`
      );
      assert.ok(
        parsed.pathname.startsWith("/tours/"),
        `Generated URL for ${item.productId} must start with /tours/: ${generatedUrl}`
      );
      assert.ok(
        parsed.pathname.includes(item.productId!),
        `Generated URL path must include productId ${item.productId}: ${generatedUrl}`
      );

      // Verify tracking parameters
      assert.equal(
        parsed.searchParams.get("mcid"),
        "42383",
        `Missing or incorrect mcid in ${generatedUrl}`
      );
      assert.equal(
        parsed.searchParams.get("medium"),
        "link",
        `Missing or incorrect medium in ${generatedUrl}`
      );
      assert.ok(
        parsed.searchParams.get("campaign")?.startsWith("last-frontier-"),
        `Missing last-frontier- prefix in campaign for ${generatedUrl}`
      );
      assert.equal(
        parsed.searchParams.get("utm_source"),
        "lastfrontiershoreexcursions.com",
        `Missing or incorrect utm_source in ${generatedUrl}`
      );
      assert.equal(
        parsed.searchParams.get("utm_medium"),
        "affiliate",
        `Missing or incorrect utm_medium in ${generatedUrl}`
      );
      assert.ok(
        parsed.searchParams.get("utm_campaign")?.startsWith("last-frontier-"),
        `Missing last-frontier- prefix in utm_campaign for ${generatedUrl}`
      );

      // Verify PID is P00281144
      assert.equal(
        parsed.searchParams.get("pid"),
        "P00281144",
        `Expected pid=P00281144 in ${generatedUrl}`
      );
    }
  });

  it("port hubs with catalog tours produce direct product CTAs without generic search fallback", () => {
    const ports = ["juneau", "skagway", "ketchikan", "sitka", "icy-strait-point"] as const;
    for (const portSlug of ports) {
      const portExcursions = AFFILIATE_CATALOG.filter((item) => item.portSlug === portSlug);
      assert.ok(portExcursions.length > 0, `Port ${portSlug} must have catalog excursions`);

      const topExcursion = portExcursions[0];
      const primaryBrowseUrl = buildAffiliateUrl(
        topExcursion.source,
        topExcursion.officialUrl,
        topExcursion.attributionCampaign,
        topExcursion.title,
        topExcursion.isExactProduct
      );

      assert.ok(
        !primaryBrowseUrl.includes("searchResults"),
        `Port ${portSlug} primaryBrowseUrl contains searchResults: ${primaryBrowseUrl}`
      );
      assert.ok(
        primaryBrowseUrl.includes(topExcursion.productId!),
        `Port ${portSlug} primaryBrowseUrl must contain ${topExcursion.productId}`
      );
    }
  });

  it("activity pages matching catalog tours produce direct product CTAs without generic search fallback", () => {
    for (const item of AFFILIATE_CATALOG) {
      const activityTours = AFFILIATE_CATALOG.filter(
        (c) => c.portSlug === item.portSlug && c.activitySlug === item.activitySlug
      );
      assert.ok(activityTours.length > 0);

      const topActivityTour = activityTours[0];
      const primaryOutboundUrl = buildAffiliateUrl(
        topActivityTour.source,
        topActivityTour.officialUrl,
        topActivityTour.attributionCampaign,
        topActivityTour.title,
        topActivityTour.isExactProduct
      );

      assert.ok(
        !primaryOutboundUrl.includes("searchResults"),
        `Activity ${item.portSlug}/${item.activitySlug} outboundUrl contains searchResults: ${primaryOutboundUrl}`
      );
      assert.ok(
        primaryOutboundUrl.includes(topActivityTour.productId!),
        `Activity ${item.portSlug}/${item.activitySlug} outboundUrl must contain ${topActivityTour.productId}`
      );
    }
  });

  it("decision guides produce direct product CTAs without generic search fallback", () => {
    for (const guide of DECISION_PAGES) {
      for (const tour of guide.recommendedTours) {
        const matched = matchCatalogExcursion(tour.port, tour.name, tour.campaignTag);
        assert.ok(matched, `Must find catalog match for ${tour.name} in ${guide.slug}`);
        assert.equal(matched.isExactProduct, true);
        assert.ok(matched.productId);

        const outboundUrl = buildAffiliateUrl(
          matched.source,
          matched.officialUrl,
          matched.attributionCampaign,
          matched.title,
          matched.isExactProduct
        );

        assert.ok(
          !outboundUrl.includes("searchResults"),
          `Decision tour ${tour.name} in ${guide.slug} has searchResults in URL: ${outboundUrl}`
        );
        assert.ok(
          outboundUrl.includes(matched.productId!),
          `Decision tour ${tour.name} URL must contain productId ${matched.productId}`
        );
      }
    }
  });

  it("all 15 catalog items use verified exact canonical Viator URLs matching destination and product slug", () => {
    const VERIFIED_CANONICAL_URLS: Record<string, string> = {
      "331813P1": "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
      "466119P3": "https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Waterfall-and-Whale-Watching-Tour/d941-466119P3",
      "5857SHUTTLE": "https://www.viator.com/tours/Juneau/Round-Trip-Mendenhall-Glacier-Shuttle-Service/d941-5857SHUTTLE",
      "6251SHOREXICEWALK": "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
      "62390P4": "https://www.viator.com/tours/Juneau/Sled-Dog-Discovery-in-Juneau/d941-62390P4",
      "110048P1": "https://www.viator.com/tours/Juneau/Taku-Lodge-Feast-and-5-Glacier-Seaplane-Discovery/d941-110048P1",
      "5338PRTSGYCITY": "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
      "5338PRTSGYFULL": "https://www.viator.com/tours/Whitehorse/Skagway-Shore-Excursion-Full-Day-Tour-of-the-Yukon/d5420-5338PRTSGYFULL",
      "10649P17": "https://www.viator.com/tours/Skagway/Skagway-Historic-City-Tour-2-HRS/d943-10649P17",
      "6459PRTKTNMISTY": "https://www.viator.com/tours/Ketchikan/Ketchikan-Shore-Excursion-Misty-Fjords-National-Monument-Floatplane-Tour/d942-6459PRTKTNMISTY",
      "472133P3": "https://www.viator.com/tours/Ketchikan/Misty-Fjords-and-Wilderness-Explorer/d942-472133P3",
      "445368P5": "https://www.viator.com/tours/Ketchikan/Saxman-Native-Village-Ketchikan-Highlights-and-Lumberjack-Show/d942-445368P5",
      "472133P4": "https://www.viator.com/tours/Sitka/Whale-Watch-and-Sea-Otter-Quest/d4153-472133P4",
      "64781P20": "https://www.viator.com/tours/Sitka/Simply-Amazing-Sitka-Tour/d4153-64781P20",
      "14707P1": "https://www.viator.com/tours/Hoonah/Whale-Watch-Adventure/d26215-14707P1",
    };

    for (const item of AFFILIATE_CATALOG) {
      const expectedUrl = VERIFIED_CANONICAL_URLS[item.productId!];
      assert.ok(expectedUrl, `Missing expected canonical URL for ${item.productId}`);
      assert.equal(
        item.officialUrl,
        expectedUrl,
        `Item ${item.title} (${item.productId}) has officialUrl ${item.officialUrl}, expected ${expectedUrl}`
      );
    }
  });
});
