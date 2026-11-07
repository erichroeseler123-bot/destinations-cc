import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildPartnerShareUrl,
  getPartnerShareLinksForMarket,
  PARTNER_SHARE_LINKS,
  resolvePartnerAttributionFromParams,
} from "../../lib/dcc/partnerShareLinks";
import {
  getDccNetworkDemandToRevenueReport,
  issueOpaqueClickAttribution,
  reconcilePartnerWebhookByClickId,
  recordFunnelVisitorSession,
  resetOpaqueAttributionLedgerForTests,
} from "../../lib/dcc/commerce/opaqueAttributionLedger";

test("1. Build on Search Console demand: Juneau short port-call and flight-canceled guides + New Orleans guides exist with storefront next steps", () => {
  const shortPortGuide = fs.readFileSync(
    path.join(
      process.cwd(),
      "app/juneau/cruise-excursions-what-to-do/page.tsx",
    ),
    "utf8",
  );
  assert.ok(shortPortGuide.includes("Which Juneau Tours Fit a Short Cruise Port Call?"));
  assert.ok(shortPortGuide.includes("331813P1"));
  assert.ok(shortPortGuide.includes("5857SHUTTLE"));
  assert.ok(shortPortGuide.includes("466119P3"));
  assert.ok(shortPortGuide.includes("lastfrontiershoreexcursions.com"));
  assert.ok(shortPortGuide.includes("juneauflightdeck.com"));

  const canceledFlightGuide = fs.readFileSync(
    path.join(
      process.cwd(),
      "app/juneau/what-to-do-if-helicopter-tour-canceled/page.tsx",
    ),
    "utf8",
  );
  assert.ok(
    canceledFlightGuide.includes(
      "What to Do When Your Juneau Helicopter Tour Is Canceled",
    ),
  );
  assert.ok(canceledFlightGuide.includes("evaluateJuneauBackupFlow"));
  assert.ok(canceledFlightGuide.includes("pajnMetar"));
  assert.ok(canceledFlightGuide.includes("juneauflightdeck.com/juneau-whale-watching-tours?flight_canceled=1"));

  const nolaToursPage = fs.readFileSync(
    path.join(process.cwd(), "app/new-orleans/tours/page.tsx"),
    "utf8",
  );
  assert.ok(nolaToursPage.includes("PartnerSharePlanningBar"));
  assert.ok(nolaToursPage.includes("welcometoneworleanstours.com"));
});

test("2. Partner shareable planning links cover hotel concierges, cruise planners, and flight operators and resolve attribution", () => {
  const roles = new Set(PARTNER_SHARE_LINKS.map((l) => l.partnerRole));
  assert.ok(roles.has("hotel_concierge"));
  assert.ok(roles.has("cruise_planner"));
  assert.ok(roles.has("flight_operator"));

  const nolaLinks = getPartnerShareLinksForMarket("new-orleans");
  const juneauLinks = getPartnerShareLinksForMarket("juneau");
  const redRocksLinks = getPartnerShareLinksForMarket("colorado-red-rocks");
  const mountainLinks = getPartnerShareLinksForMarket("colorado-mountain");

  assert.ok(nolaLinks.length >= 2);
  assert.ok(juneauLinks.length >= 2);
  assert.ok(redRocksLinks.length >= 1);
  assert.ok(mountainLinks.length >= 1);

  const builtUrl = buildPartnerShareUrl({
    dccPagePath: "/juneau/what-to-do-if-helicopter-tour-canceled",
    partnerId: "juneau-heli-dispatch",
    partnerRole: "flight_operator",
    extraParams: { flight_canceled: "1", cancel_ref: "wx-ceiling-hold" },
  });
  assert.ok(builtUrl.includes("partner=juneau-heli-dispatch"));
  assert.ok(builtUrl.includes("partner_role=flight_operator"));
  assert.ok(builtUrl.includes("src=dcc-partner-flight-operator%3Ajuneau-heli-dispatch"));

  const resolved = resolvePartnerAttributionFromParams({
    originatingPage: builtUrl,
  });
  assert.equal(resolved.partnerId, "juneau-heli-dispatch");
  assert.equal(resolved.partnerRole, "flight_operator");
  assert.equal(resolved.isPartnerAttributed, true);
});

test("3. Owned & operated Colorado businesses (Party at Red Rocks & GoSno) are integrated on DCC Red Rocks and Colorado mountain pages", () => {
  const redRocksPage = fs.readFileSync(
    path.join(process.cwd(), "app/red-rocks-transportation/page.tsx"),
    "utf8",
  );
  assert.ok(redRocksPage.includes('data-testid="dcc-red-rocks-authority-brief"'));
  assert.ok(
    redRocksPage.includes(
      "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared?src=dcc-authority-red-rocks",
    ),
  );
  assert.ok(
    redRocksPage.includes(
      "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private?src=dcc-authority-red-rocks",
    ),
  );
  assert.ok(redRocksPage.includes("PartnerSharePlanningBar"));

  const coloradoPage = fs.readFileSync(
    path.join(process.cwd(), "app/transportation/colorado/page.tsx"),
    "utf8",
  );
  assert.ok(coloradoPage.includes("https://gosno.co/vail"));
  assert.ok(coloradoPage.includes("https://gosno.co/breckenridge"));
  assert.ok(
    coloradoPage.includes(
      "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared?src=dcc-authority-colorado",
    ),
  );
  assert.ok(coloradoPage.includes("PartnerSharePlanningBar"));
});

test("4. Unified Demand-to-Revenue report tracks visits, partner referrals, storefront handoffs, confirmed bookings, and revenue by market and DCC page", () => {
  resetOpaqueAttributionLedgerForTests();

  // 1) Hotel concierge sends a guest to New Orleans swamp tours
  recordFunnelVisitorSession({
    visitorId: "vis_prod_nola_concierge_01",
    sourcePage:
      "/new-orleans/swamp-tours?partner=fq-hotel-concierge&partner_role=hotel_concierge&src=dcc-partner-hotel-concierge:fq-hotel-concierge",
    surface: "dcc",
    isTest: false,
  });

  const nolaClick = issueOpaqueClickAttribution({
    decisionReceiptId: "rcpt:sha256:prod_nola_01",
    recommendedOperatorId: "louisiana-tour-company",
    recommendedOperatorName: "Louisiana Tour Company",
    evidenceVersion: "2026.11.07",
    originatingSite: "destinationcommandcenter.com",
    originatingPage:
      "/new-orleans/swamp-tours?partner=fq-hotel-concierge&partner_role=hotel_concierge",
    trafficSource: "dcc-partner-hotel-concierge:fq-hotel-concierge",
    surface: "dcc",
    provider: "viator",
    productCode: "15200P6",
    productDestinationUrl:
      "https://www.viator.com/tours/New-Orleans/Swamp/d675-15200P6",
    isTest: false,
  });

  reconcilePartnerWebhookByClickId({
    clickId: nolaClick.clickId,
    provider: "viator",
    providerBookingRef: "BR-NOLA-PROD-9001",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 120.0,
    estimatedCommissionUsd: 9.6,
    paidCommissionUsd: 9.6,
    isTest: false,
  });

  // 2) Denver hotel concierge sends a guest to Red Rocks transportation -> Party at Red Rocks owned shuttle booking
  recordFunnelVisitorSession({
    visitorId: "vis_prod_parr_concierge_01",
    sourcePage:
      "/red-rocks-transportation?partner=denver-hotel-concierge&partner_role=hotel_concierge&src=dcc-partner-hotel-concierge:denver-hotel-concierge",
    surface: "dcc",
    isTest: false,
  });

  const parrClick = issueOpaqueClickAttribution({
    decisionReceiptId: "rcpt:sha256:prod_parr_01",
    recommendedOperatorId: "party-at-red-rocks",
    recommendedOperatorName: "Party at Red Rocks",
    evidenceVersion: "2026.11.07",
    originatingSite: "destinationcommandcenter.com",
    originatingPage:
      "/red-rocks-transportation?partner=denver-hotel-concierge&partner_role=hotel_concierge",
    trafficSource: "dcc-partner-hotel-concierge:denver-hotel-concierge",
    surface: "dcc",
    provider: "internal",
    productCode: "parr-shared-shuttle-2pax",
    productDestinationUrl:
      "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared",
    isTest: false,
  });

  reconcilePartnerWebhookByClickId({
    clickId: parrClick.clickId,
    provider: "internal",
    providerBookingRef: "PARR-CONF-7001",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 130.0,
    estimatedCommissionUsd: 130.0,
    paidCommissionUsd: 130.0,
    isTest: false,
  });

  const report = getDccNetworkDemandToRevenueReport();
  assert.equal(report.byMarket.length, 4);
  assert.ok(report.byDccPage.length >= 10);
  assert.ok(report.diagnostics.whatToGrowNext.length >= 4);
  assert.ok(report.diagnostics.whereTravelersGetStuck.length >= 3);

  const nolaMarket = report.byMarket.find((m) => m.marketId === "new-orleans");
  assert.ok(nolaMarket);
  assert.equal(nolaMarket.confirmedBookings, 1);
  assert.equal(nolaMarket.grossRevenueUsd, 120.0);
  assert.equal(nolaMarket.settledCommissionUsd, 9.6);

  const redRocksMarket = report.byMarket.find(
    (m) => m.marketId === "colorado-red-rocks",
  );
  assert.ok(redRocksMarket);
  assert.equal(redRocksMarket.confirmedBookings, 1);
  assert.equal(redRocksMarket.grossRevenueUsd, 130.0);

  const fqPartner = report.byPartner.find(
    (p) => p.partnerId === "fq-hotel-concierge",
  );
  assert.ok(fqPartner);
  assert.equal(fqPartner.productionVisits, 1);
  assert.equal(fqPartner.storefrontReferrals, 1);
  assert.equal(fqPartner.confirmedBookings, 1);
  assert.equal(fqPartner.grossRevenueUsd, 120.0);

  const denverPartner = report.byPartner.find(
    (p) => p.partnerId === "denver-hotel-concierge",
  );
  assert.ok(denverPartner);
  assert.equal(denverPartner.productionVisits, 1);
  assert.equal(denverPartner.storefrontReferrals, 1);
  assert.equal(denverPartner.confirmedBookings, 1);
  assert.equal(denverPartner.grossRevenueUsd, 130.0);

  resetOpaqueAttributionLedgerForTests();
});
