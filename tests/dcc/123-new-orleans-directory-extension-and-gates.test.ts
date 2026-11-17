import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import {
  DIRECTORY_CORE_CONTRACT_VERSION,
  NEW_ORLEANS_DIRECTORY_EXTENSION_VERSION,
  NEW_ORLEANS_DIRECTORY_SCHEMA_VERSION,
  UNCLAIMED_OPERATOR_PROFILE_NOTICE,
  evaluateNewOrleansTurnaroundAndFlightFit,
} from "@/lib/dcc/shared/newOrleansDirectoryExtensionContract";
import {
  NEW_ORLEANS_OPERATORS,
  NEW_ORLEANS_PLACES,
  NEW_ORLEANS_PRODUCTS,
  findNewOrleansOperatorBySlugOrAlias,
  findNewOrleansPlaceBySlug,
  getNewOrleansDirectorySnapshot,
} from "@/lib/dcc/shared/newOrleansDirectoryData";
import { clearStoredNewOrleansOperatorClaimsForTests } from "@/lib/dcc/new-orleans/operatorClaimsGovernance";
import {
  GET as getNolaDirectory,
  HEAD as headNolaDirectory,
} from "@/app/api/v1/new-orleans/directory/route";
import {
  GET as getNolaClaims,
  PATCH as patchNolaClaims,
  POST as postNolaClaim,
} from "@/app/api/v1/new-orleans/claims/route";
import { POST as postWnoOperatorClaim } from "../../apps/welcometoneworleanstours/app/api/operator-claims/route";
import { buildWtonotSitemapPaths } from "@/app/sitemap.xml/handler";
import { proxy as wnoProxy } from "../../apps/welcometoneworleanstours/proxy";

const ROOT = process.cwd();

test("1. Core & New Orleans extension versions, counts, and unconnected defaults", () => {
  const snapshot = getNewOrleansDirectorySnapshot();
  assert.equal(snapshot.coreContractVersion, "dcc.directory.core.v1");
  assert.equal(snapshot.coreContractVersion, DIRECTORY_CORE_CONTRACT_VERSION);
  assert.equal(snapshot.extensionVersion, "dcc.directory.ext.new-orleans.v1");
  assert.equal(snapshot.extensionVersion, NEW_ORLEANS_DIRECTORY_EXTENSION_VERSION);
  assert.equal(snapshot.schemaVersion, NEW_ORLEANS_DIRECTORY_SCHEMA_VERSION);

  assert.equal(snapshot.counts.placesTotal, 25);
  assert.equal(snapshot.counts.placesQualifiedIndexable, 16);
  assert.equal(snapshot.counts.placesHeldNoindex, 9);

  assert.equal(snapshot.counts.operatorsTotal, 17);
  assert.equal(snapshot.counts.operatorsQualifiedIndexable, 14);
  assert.equal(snapshot.counts.operatorsHeldNoindex, 3);

  // Safeguard: every New Orleans operator defaults to unconnected live availability & direct checkout
  assert.equal(snapshot.counts.operatorsLiveAvailabilityConnected, 0);
  assert.equal(snapshot.counts.operatorsDirectCheckoutConnected, 0);
  for (const entry of snapshot.operators) {
    assert.equal(entry.liveAvailabilityConnected, false);
    assert.equal(entry.directCheckoutConnected, false);
  }
});

test("2. Entity separation: Ragin' Cajun vs Airboat Adventures, Whitney/Oak Alley/Laura as museums, Steamboat Co vs vessels, Erato vs Julia, distinct basins", () => {
  // Ragin' Cajun Airboat Tours vs Airboat Adventures
  const ragin = findNewOrleansOperatorBySlugOrAlias("ragin-cajun-tours");
  const airboatAdv = findNewOrleansOperatorBySlugOrAlias("airboat-adventures");
  assert.ok(ragin);
  assert.ok(airboatAdv);
  assert.notEqual(ragin.operator.operatorId, airboatAdv.operator.operatorId);
  assert.ok(ragin.operator.separateFromOperatorIds?.includes("operator:airboat-adventures"));
  assert.ok(airboatAdv.operator.separateFromOperatorIds?.includes("operator:ragin-cajun-airboat-tours"));
  assert.match(ragin.operator.arrivalAndPickupSummary, /Luling/);
  assert.match(airboatAdv.operator.arrivalAndPickupSummary, /5145 Fleming Park Rd, Lafitte/);

  // Whitney, Oak Alley, Laura as distinct historic_site_or_museum entities (NOT bus operators)
  for (const slug of ["whitney-plantation", "oak-alley-plantation", "laura-plantation"]) {
    const placeEntry = findNewOrleansPlaceBySlug(slug);
    assert.ok(placeEntry, `Expected canonical place ${slug}`);
    assert.equal(placeEntry.gate.indexable, true);
    assert.equal(placeEntry.place.placeType, "historic_site_or_museum");
    assert.equal(placeEntry.place.historicSiteGovernance?.isTransportationTourOperator, false);
    assert.equal(
      placeEntry.place.historicSiteGovernance?.publicFramingPolicy,
      "historical_and_enslavement_education",
    );
    assert.ok(
      (placeEntry.place.historicSiteGovernance?.enslavementHistorySummary.length ?? 0) >= 80,
    );
    assert.equal(NEW_ORLEANS_OPERATORS.some((o) => o.slug === slug), false);
  }

  // New Orleans Steamboat Company vs Steamboat NATCHEZ & Riverboat CITY of NEW ORLEANS
  const steamboatCo = findNewOrleansOperatorBySlugOrAlias("new-orleans-steamboat-company");
  const natchezAlias = findNewOrleansOperatorBySlugOrAlias("steamboat-natchez");
  assert.ok(steamboatCo);
  assert.ok(natchezAlias);
  assert.equal(natchezAlias.matchedViaAlias, true);
  assert.equal(natchezAlias.canonicalSlug, "new-orleans-steamboat-company");
  assert.equal(steamboatCo.operator.operatedVessels?.length, 2);

  const natchezDaytime = NEW_ORLEANS_PRODUCTS.find(
    (p) => p.productSlug === "daytime-jazz-cruise",
  );
  const cityRiverboat = NEW_ORLEANS_PRODUCTS.find(
    (p) => p.productSlug === "city-of-new-orleans-riverboat-cruise",
  );
  assert.ok(natchezDaytime);
  assert.ok(cityRiverboat);
  assert.match(
    natchezDaytime.boardingLocationResolution.primaryBoardingWharfOrDock,
    /400 Toulouse St/,
  );
  assert.match(
    cityRiverboat.boardingLocationResolution.primaryBoardingWharfOrDock,
    /101 St\. Louis St/,
  );
  assert.match(
    cityRiverboat.boardingLocationResolution.companionOrAlternateBoardingRule || "",
    /400 Toulouse St/,
  );

  // Port NOLA Erato Street vs Julia Street Cruise Terminals
  const erato = findNewOrleansPlaceBySlug("erato-street-cruise-terminal");
  const julia = findNewOrleansPlaceBySlug("julia-street-cruise-terminal");
  assert.ok(erato && julia);
  assert.match(erato.place.cruiseTerminalLogistics?.streetAddress || "", /1100 Port of New Orleans Place/);
  assert.match(julia.place.cruiseTerminalLogistics?.streetAddress || "", /920 Port of New Orleans Place/);
  assert.match(julia.place.cruiseTerminalLogistics?.officialParkingFacility || "", /100 Poydras Garage/);
  assert.match(julia.place.cruiseTerminalLogistics?.parkingNotes || "", /Whale Lot/);

  // Distinct basins + traffic-qualified drive ranges (isGuarantee = false)
  for (const basinSlug of ["honey-island", "jean-lafitte", "manchac", "river-road", "msy-airport-corridor"]) {
    const basin = findNewOrleansPlaceBySlug(basinSlug);
    assert.ok(basin);
    assert.equal(basin.gate.indexable, true);
    assert.ok(basin.place.driveEstimateFromFrenchQuarter);
    assert.equal(basin.place.driveEstimateFromFrenchQuarter.isGuarantee, false);
  }
});

test("3. Held-record governance, sitemap exclusions, and 308 legacy operator alias redirects", async () => {
  const snapshot = getNewOrleansDirectorySnapshot();
  const sitemapPaths = buildWtonotSitemapPaths();

  assert.ok(sitemapPaths.includes("/areas"));
  assert.ok(sitemapPaths.includes("/operators"));
  assert.ok(sitemapPaths.includes("/areas/honey-island"));
  assert.ok(sitemapPaths.includes("/areas/jean-lafitte"));
  assert.ok(sitemapPaths.includes("/areas/manchac"));
  assert.ok(sitemapPaths.includes("/areas/river-road"));
  assert.ok(sitemapPaths.includes("/areas/whitney-plantation"));
  assert.ok(sitemapPaths.includes("/areas/oak-alley-plantation"));
  assert.ok(sitemapPaths.includes("/areas/laura-plantation"));
  assert.ok(sitemapPaths.includes("/areas/erato-street-cruise-terminal"));
  assert.ok(sitemapPaths.includes("/areas/julia-street-cruise-terminal"));
  assert.ok(sitemapPaths.includes("/operators/airboat-adventures"));
  assert.ok(sitemapPaths.includes("/operators/ragin-cajun-tours"));
  assert.ok(sitemapPaths.includes("/operators/new-orleans-steamboat-company"));

  // Every held place, held operator, held area-category, and held SKU must be excluded from sitemap
  for (const held of snapshot.heldRecordsLedger) {
    if (held.publicPath) {
      assert.equal(
        sitemapPaths.includes(held.publicPath),
        false,
        `Held path ${held.publicPath} (${held.queue}) leaked into WNO sitemap`,
      );
    }
  }

  // Preserved legacy /tours/airboat-adventures and /tours/nola-ghost-riders remain in sitemap
  assert.ok(sitemapPaths.includes("/tours/airboat-adventures"));
  assert.ok(sitemapPaths.includes("/tours/nola-ghost-riders"));

  // WNO proxy 308 redirects for legacy operator aliases
  const aliasCases = [
    ["/operators/steamboat-natchez", "/operators/new-orleans-steamboat-company"],
    ["/operators/ragin-cajun-airboat-tours", "/operators/ragin-cajun-tours"],
    ["/operators/gray-line-new-orleans", "/operators/gray-line"],
  ] as const;

  for (const [fromPath, expectedTo] of aliasCases) {
    const res = await wnoProxy(
      new NextRequest(`https://www.welcometoneworleanstours.com${fromPath}`, {
        headers: { host: "www.welcometoneworleanstours.com" },
      }),
    );
    assert.equal(res.status, 308);
    assert.equal(
      res.headers.get("location"),
      `https://www.welcometoneworleanstours.com${expectedTo}`,
    );
  }
});

test("4. DCC /api/v1/new-orleans/directory machine endpoint & conditional ETag 304 cache", async () => {
  const res = await getNolaDirectory(
    new NextRequest("https://destinationcommandcenter.com/api/v1/new-orleans/directory"),
  );
  assert.equal(res.status, 200);
  const etag = res.headers.get("etag");
  assert.ok(etag && etag.startsWith('"nola-'));
  assert.equal(res.headers.get("x-dcc-nola-schema"), "dcc.new-orleans.directory.v1");

  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.coreContractVersion, "dcc.directory.core.v1");
  assert.equal(body.extensionVersion, "dcc.directory.ext.new-orleans.v1");
  assert.equal(body.counts.placesQualifiedIndexable, 16);
  assert.equal(body.counts.operatorsQualifiedIndexable, 14);
  assert.equal(body.counts.operatorsLiveAvailabilityConnected, 0);
  assert.equal(body.counts.operatorsDirectCheckoutConnected, 0);

  // Conditional If-None-Match -> 304 Not Modified
  const cachedRes = await getNolaDirectory(
    new NextRequest("https://destinationcommandcenter.com/api/v1/new-orleans/directory", {
      headers: { "If-None-Match": etag! },
    }),
  );
  assert.equal(cachedRes.status, 304);

  // HEAD request
  const headRes = await headNolaDirectory(
    new NextRequest("https://destinationcommandcenter.com/api/v1/new-orleans/directory"),
  );
  assert.equal(headRes.status, 200);
  assert.equal(headRes.headers.get("etag"), etag);

  // includeHeld=0 filters out all held records
  const publicOnlyRes = await getNolaDirectory(
    new NextRequest(
      "https://destinationcommandcenter.com/api/v1/new-orleans/directory?includeHeld=0",
    ),
  );
  const publicBody = await publicOnlyRes.json();
  assert.equal(publicBody.places.length, 16);
  assert.equal(publicBody.operators.length, 14);
  assert.deepEqual(publicBody.heldRecordsLedger, []);
});

test("5. Operator claims durability, business-control verification, secret rejection & 401 owner auth", async () => {
  clearStoredNewOrleansOperatorClaimsForTests();

  // Unauthenticated GET & PATCH must return 401
  const unauthGet = await getNolaClaims(
    new Request("https://destinationcommandcenter.com/api/v1/new-orleans/claims"),
  );
  assert.equal(unauthGet.status, 401);

  const unauthPatch = await patchNolaClaims(
    new Request("https://destinationcommandcenter.com/api/v1/new-orleans/claims", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimSubmissionId: "test", decision: "verify_claim_only" }),
    }),
  );
  assert.equal(unauthPatch.status, 401);

  // Reject raw secret API keys
  const secretAttempt = await postNolaClaim(
    new Request("https://destinationcommandcenter.com/api/v1/new-orleans/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operatorSlug: "ragin-cajun-tours",
        contactName: "[TEST] Capt Randy",
        email: "info@ragincajunairboattours.com",
        bookingSystemIdentifier: "sk_live_987654321secret",
        isTest: true,
      }),
    }),
  );
  assert.equal(secretAttempt.status, 400);

  // Reject claiming Whitney Plantation museum as a transportation operator
  const museumClaimAttempt = await postNolaClaim(
    new Request("https://destinationcommandcenter.com/api/v1/new-orleans/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operatorSlug: "whitney-plantation",
        contactName: "[TEST] Museum Staff",
        email: "info@whitneyplantation.org",
        isTest: true,
      }),
    }),
  );
  assert.equal(museumClaimAttempt.status, 400);

  // Valid domain-matched claim saves durably while keeping live/direct checkout FALSE and sending zero automatic notifications
  const validClaimRes = await postWnoOperatorClaim(
    new Request("https://www.welcometoneworleanstours.com/api/operator-claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operatorSlug: "airboat-adventures",
        contactName: "[TEST] Lafitte Dispatch",
        roleTitle: "Operations Manager",
        email: "dispatch@airboatadventures.com",
        phone: "(504) 689-2005",
        requestDirectApiConnection: true,
        bookingSystemIdentifier: "FareHarbor: airboatadventures",
        notes: "[TEST] Preview gate claim verification",
        isTest: true,
      }),
    }),
  );
  assert.equal(validClaimRes.status, 201);
  const validBody = await validClaimRes.json();
  assert.equal(validBody.ok, true);
  assert.match(validBody.claimSubmissionId, /^nolaclaim_/);
  assert.equal(validBody.durablePersisted, true);
  assert.equal(validBody.verificationMethod, "official_company_domain_email");
  assert.equal(validBody.liveAvailabilityActive, false);
  assert.equal(validBody.directCheckout10PctActive, false);
  assert.equal(validBody.automaticNotificationsSent, false);

  // Confirm claim surfaces in the authenticated DCC owner inbox even with convenience emails disabled
  const { getUnifiedOperatorInbox } = await import("@/lib/dcc/operatorInbox");
  const inbox = await getUnifiedOperatorInbox({ view: "all" });
  const matchedInboxItem = inbox.items.find(
    (item) => item.sourceId === validBody.claimSubmissionId,
  );
  assert.ok(
    matchedInboxItem,
    "New Orleans operator claim must appear in the authenticated DCC owner inbox",
  );
  assert.equal(matchedInboxItem.contact.name, "[TEST] Lafitte Dispatch");
  assert.equal(matchedInboxItem.contact.company, "Airboat Adventures");
  assert.equal(matchedInboxItem.notificationStatus, "durable_storage_only");
  assert.equal(matchedInboxItem.classification, "test");

  const genuineOnlyInbox = await getUnifiedOperatorInbox({ view: "genuine" });
  assert.equal(
    genuineOnlyInbox.items.some((item) => item.sourceId === validBody.claimSubmissionId),
    false,
    "Synthetic [TEST] claim must not inflate genuine owner inbox counts",
  );
});

test("6. Welcome to the Swamp links upward to WNO canonical profiles without duplicating /operators", () => {
  const wtsOperatorsDir = path.join(ROOT, "apps/welcometotheswamp/app/operators");
  assert.equal(
    fs.existsSync(wtsOperatorsDir),
    false,
    "Welcome to the Swamp must NOT create duplicate /operators routes",
  );

  const wtsHomeSrc = fs.readFileSync(
    path.join(ROOT, "apps/welcometotheswamp/app/page.tsx"),
    "utf8",
  );
  assert.match(wtsHomeSrc, /\/operators\/ragin-cajun-tours/);
  assert.match(wtsHomeSrc, /\/operators\/airboat-adventures/);
  assert.match(wtsHomeSrc, /\/areas\/honey-island/);
  assert.match(wtsHomeSrc, /\/areas\/jean-lafitte/);
  assert.match(wtsHomeSrc, /\/areas\/manchac/);
  assert.match(wtsHomeSrc, /P00058396/);
  assert.match(wtsHomeSrc, /aktourcenter/);

  const wtsCompareSrc = fs.readFileSync(
    path.join(ROOT, "apps/welcometotheswamp/app/airboat-vs-boat/page.tsx"),
    "utf8",
  );
  assert.match(
    wtsCompareSrc,
    /https:\/\/www\.welcometoneworleanstours\.com\/operators\/ragin-cajun-tours/,
  );
  assert.match(
    wtsCompareSrc,
    /https:\/\/www\.welcometoneworleanstours\.com\/operators\/airboat-adventures/,
  );

  assert.equal(
    UNCLAIMED_OPERATOR_PROFILE_NOTICE,
    "Independent source-backed profile. This company has not yet claimed or verified this page.",
  );

  // Port NOLA & MSY timing-fit calculator checks
  const luggageBlocked = evaluateNewOrleansTurnaroundAndFlightFit({
    scenario: "post_cruise_debarkation_before_msy_flight",
    availableWindowMinutes: 480,
    productDurationMinutes: 110,
    outboundTransferMinutesMax: 45,
    hasUnstoredLuggage: true,
    luggageCompatibleForTurnaround: false,
  });
  assert.equal(luggageBlocked.status, "not_recommended");

  const storedBagsFits = evaluateNewOrleansTurnaroundAndFlightFit({
    scenario: "post_cruise_debarkation_before_msy_flight",
    availableWindowMinutes: 420,
    productDurationMinutes: 120,
    outboundTransferMinutesMax: 35,
    hasUnstoredLuggage: false,
    luggageCompatibleForTurnaround: false,
  });
  assert.equal(storedBagsFits.status, "fits_with_buffer");
});
