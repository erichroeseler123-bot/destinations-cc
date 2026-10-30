import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SeasonalOperatorPage from "../../app/operators/SeasonalOperatorPage";
import { NextRequest } from "next/server";
import {
  DCC_HOMEPAGE_OPERATOR_MESSAGE,
  DCC_OPERATOR_PAGE_DIRECT_OFFER_MESSAGE,
  FLAGGED_PRIOR_OUTREACH_OPERATORS,
  GOSNO_DIRECT_PILOT_MANIFEST,
  NATIVE_PROVIDER_API_PROFILES,
  VERIFIED_DCC_OPERATORS,
  SEASONAL_DCC_OPERATORS,
  auditPublishedOperatorsAgainstPreservedApi,
  evaluateGosnoPilotEvidence,
  generatePilotOutreachDraft,
  getOperatorManifest,
  listOperatorSlugs,
  listVerifiedOperators,
} from "../../lib/dcc/operators";
import { checkDccLiveAvailability } from "../../lib/dcc/internal/dccViatorAdapter";

test("Seasonal pages preserve supplier identity, disclose public evidence, and render exact product affiliate links", () => {
  const expectedSuppliers: Record<string, string> = {
    "virgin-islands-ecotours": "Virgin Islands Ecotours",
    "cruz-bay-watersports": "Cruz Bay Watersports",
    "bahamas-jet-boat": "Bahamas Jet Boat Ltd.",
    "jolly-pirates": "Jolly Pirates Sailing Cruises & Snorkeling",
    "kayaking-puerto-rico": "Kayaking Puerto Rico",
    "sea-spray-cruises": "Sea Spray Cruises Ltd.",
    "marlin-del-rey": "Marlin del Rey Catamaran Sailing Tours",
    "runners-adventures": "Runners Adventures",
    "cabo-blue": "Cabo Blue Boat",
    "body-glove-hawaii": "Body Glove Cruises",
  };
  assert.equal(SEASONAL_DCC_OPERATORS.length, 10);
  for (const operator of SEASONAL_DCC_OPERATORS) {
    assert.ok(listOperatorSlugs().includes(operator.slug));
    assert.equal(getOperatorManifest(operator.slug), operator);
    assert.equal(operator.verifiedViatorProducts.length, 0, "Public pages must not become preserved API evidence");
    assert.equal(operator.supplierReference, undefined, "A supplier reference must not be fabricated");
    assert.ok(operator.publicListings?.length);
    const markup = renderToStaticMarkup(createElement(SeasonalOperatorPage, { operator }));
    assert.match(markup, /selected list, not a complete catalog or a live availability check/);
    assert.match(markup, /No dated, like-for-like price comparison/);
    assert.doesNotMatch(markup, /Verified Viator API Catalog|Status: ACTIVE|api_version=2\.0/);
    assert.ok(markup.includes(`data-default-page-path="/operators/${operator.slug}"`));
    assert.ok(markup.includes(`/operators/onboarding?operator=${operator.slug}`));
    assert.ok((operator.sources || []).length >= 2);
    for (const product of operator.publicListings || []) {
      assert.equal(product.supplierName, expectedSuppliers[operator.slug]);
      const canonical = new URL(product.canonicalUrl);
      assert.equal(canonical.hostname, "www.viator.com");
      assert.ok(canonical.pathname.endsWith(`-${product.code}`));
      assert.ok(!canonical.pathname.includes("searchResults"));
      assert.ok(Number.isFinite(Date.parse(product.checkedAt)));
      assert.ok(markup.includes(`data-product-code="${product.code}"`));
      assert.ok(markup.includes(canonical.pathname));
    }
    assert.match(markup, /medium=link/);
    assert.match(markup, /rel="sponsored noopener noreferrer"/);
  }
  const publishedCodes = SEASONAL_DCC_OPERATORS.flatMap((operator) => operator.publicListings?.map((p) => p.code) || []);
  for (const wrongSupplierCode of ["6240P1", "17279P28", "24791P4", "342635P1"]) {
    assert.ok(!publishedCodes.includes(wrongSupplierCode), `${wrongSupplierCode} belongs to another supplier`);
  }
});
import {
  DELETE as deleteOnboardingRoute,
  GET as getOnboardingRoute,
  POST as postOnboardingRoute,
  validateOperatorOnboardingApplication,
} from "../../app/api/operators/onboarding/route";

test("Homepage copy stays calm, factual, and decision-focused without salesy hero offers", () => {
  const homePath = path.join(process.cwd(), "app/components/dcc/LocationFirstHomeFast.tsx");
  const homeSource = fs.readFileSync(homePath, "utf8");

  assert.match(homeSource, /Source-Backed Travel Decision Engine/);
  assert.match(homeSource, /source-backed travel decision engine/i);
  assert.match(homeSource, /without buying anything/i);
  assert.match(
    homeSource,
    /public transport, free activities, direct operator options, and marketplace options/i
  );

  assert.match(homeSource, /For tour operators/);
  assert.match(homeSource, /href="\/operators"/);

  assert.match(homeSource, /For Travelers/);
  assert.match(homeSource, /For Developers &amp; AI Systems/);

  assert.doesNotMatch(homeSource, /10% commission/i);
  assert.doesNotMatch(homeSource, /kept more of every booking/i);
  assert.doesNotMatch(homeSource, /act now/i);
  assert.doesNotMatch(homeSource, /20%\s*to\s*30%/i);
  assert.doesNotMatch(homeSource, /industry survival/i);
});

test("Operator partnership page (/operators) includes exact required message and governance disclosures", () => {
  assert.equal(
    DCC_HOMEPAGE_OPERATOR_MESSAGE,
    "It’s time tour operators kept more of every booking. Connect your existing booking system to DCC through an authorized API. Our commission is 10% on completed direct bookings we generate."
  );

  const operatorsPagePath = path.join(process.cwd(), "app/operators/page.tsx");
  const operatorsPageSource = fs.readFileSync(operatorsPagePath, "utf8");

  assert.match(operatorsPageSource, /DCC_HOMEPAGE_OPERATOR_MESSAGE/);
  assert.match(operatorsPageSource, /We Welcome Operators Worldwide/i);
  assert.match(operatorsPageSource, /can provide the initial booking channel/i);
  assert.match(
    operatorsPageSource,
    /explicit operator permission.*provider-approved API access.*signed commercial and settlement terms.*verified end-to-end integration/is
  );
  assert.match(operatorsPageSource, /Keep Your Existing Sales Channels/i);
  assert.match(
    operatorsPageSource,
    /Commission never determines traveler suitability or recommendation ranking/i
  );
  assert.match(operatorsPageSource, /Worldwide Eligibility vs\. Coverage/i);
});

test("All published Viator operators and products match preserved Viator Partner API v2 responses (exact supplier reference, unmodified productUrl, verified destinations)", () => {
  assert.equal(
    DCC_OPERATOR_PAGE_DIRECT_OFFER_MESSAGE,
    "Your tours are featured here through Viator. If you’d like bookings to go directly to your company, we can connect your booking API. Our proposed commission is 10% on completed direct bookings."
  );

  // Run full audit against data/viator-operator-snapshots/preserved-operator-products-v2.json and data/viator-destinations.json
  const audit = auditPublishedOperatorsAgainstPreservedApi();
  assert.equal(audit.operatorCount, 7);
  assert.equal(audit.productCount, 14);

  const expectedSuppliers: Record<string, string> = {
    "coastal-helicopters": "SUPPLIER-XZgZhAmmclREedANtzgvJw==",
    "cajun-encounters": "SUPPLIER-Ls68Tv9wCH9YKPX1YdQD0g==",
    "cajun-pride-swamp-tours": "SUPPLIER-ah695t/3pUZ5JxgMe0brVQ==",
    "haunted-history-tours": "SUPPLIER-xe2YbZ42ogLOrNtIzC5ybg==",
    "doctor-gumbo-tours": "SUPPLIER-uhTuEGs0R00a22vvRVDMHg==",
    "airboat-adventures": "SUPPLIER-7eNlteakiwgCVdiaT3VQkg==",
    "new-orleans-kayak-swamp-tours": "SUPPLIER-CN3etwHlngDFw8ce4fY4dQ==",
  };

  const preservedSnapshot = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "data/viator-operator-snapshots/preserved-operator-products-v2.json"),
      "utf8"
    )
  );

  const viatorOperators = listVerifiedOperators();
  assert.equal(viatorOperators.length, 7);

  for (const op of viatorOperators) {
    assert.equal(op.currentBookingChannel, "viator");
    assert.equal(op.directPartnershipStatus, "not_enrolled_viator_channel");
    assert.equal(
      op.supplierReference,
      expectedSuppliers[op.slug],
      `${op.slug} must use exact Viator API supplier reference`
    );
    assert.notEqual(
      op.supplierReference,
      "SUPPLIER-VERIFIED-COASTAL-HELICOPTERS-6251",
      "Fabricated supplier reference must never appear"
    );

    for (const prod of op.verifiedViatorProducts) {
      const entry = preservedSnapshot.products.find(
        (item: any) => item.code === prod.productCode
      );
      assert.ok(entry && entry.data, `Missing preserved API snapshot for ${prod.productCode}`);
      const raw = entry.data;
      assert.equal(prod.status, "ACTIVE");
      assert.equal(prod.supplierName, raw.supplier.name);
      assert.equal(prod.supplierReference, raw.supplier.reference);
      assert.equal(prod.supplierReference, op.supplierReference);

      // Must preserve exact, unmodified productUrl returned by Viator's API
      assert.equal(prod.productUrl, raw.productUrl);
      assert.equal(prod.trackedViatorUrl, raw.productUrl);
      assert.match(prod.productUrl, /^https:\/\/www\.viator\.com\/tours\//);
      assert.match(prod.productUrl, /mcid=42383/);
      assert.match(prod.productUrl, /pid=P00306962/);
      assert.match(prod.productUrl, /medium=api/);
      assert.match(prod.productUrl, /api_version=2\.0/);

      // Must verify actual destination against Viator destination catalog
      if (op.slug === "coastal-helicopters") {
        assert.equal(prod.verifiedDestination.destinationId, 941);
        assert.equal(prod.verifiedDestination.name, "Juneau");
        assert.equal(prod.verifiedDestination.parentRegionName, "Alaska");
      } else {
        assert.equal(prod.verifiedDestination.destinationId, 675);
        assert.equal(prod.verifiedDestination.name, "New Orleans");
        assert.equal(prod.verifiedDestination.parentRegionName, "Louisiana");
      }
    }
  }

  // Verify Viator client supports documented ?campaign-value= parameter on GET /products/{code}
  const viatorClientSource = fs.readFileSync(
    path.join(process.cwd(), "lib/viator/client.ts"),
    "utf8"
  );
  assert.match(viatorClientSource, /campaign-value/);

  assert.equal(listOperatorSlugs().length, VERIFIED_DCC_OPERATORS.length + SEASONAL_DCC_OPERATORS.length + 1);
  assert.equal(getOperatorManifest("mendenhall-tours-co"), null);
  assert.equal(getOperatorManifest("northstar-heli-adventures"), null);
});

test("GoSno profile accurately describes private transfers (never shared shuttles), supplies real captured storefront evidence, and marks DCC-side pilot checks pending", () => {
  const gosno = getOperatorManifest("gosno")!;
  assert.ok(gosno);
  assert.equal(gosno.currentBookingChannel, "direct_pilot");

  // Must state private transfers and NEVER advertise "private & shared shuttles"
  const combinedProfileText = [
    gosno.overview,
    ...(gosno.specialties || []),
    gosno.directPilot?.pilotScopeSummary || "",
    gosno.directPilot?.workingCheckoutStatus || "",
  ].join(" ");

  assert.match(combinedProfileText, /100% private transfers/i);
  assert.doesNotMatch(combinedProfileText, /private\s*&\s*shared/i);

  // Real captured request/response evidence from gosno.co
  const evidence = evaluateGosnoPilotEvidence();
  assert.equal(evidence.wellKnownStatus, 200);
  assert.equal(evidence.legalName, "GoSno LLC");
  assert.equal(evidence.operatingAuthority, "CO PUC LL-03577");
  assert.equal(evidence.routesCatalogStatus, 200);
  assert.equal(evidence.publishedPrivateSuvRouteCount, 9);
  assert.equal(evidence.sampleRouteMapping.routeId, "DEN-BRECKENRIDGE");
  assert.equal(evidence.sampleRouteMapping.rezdyProductCode, "P7477S");
  assert.equal(evidence.sampleRouteMapping.vehicleClass, "suv");
  assert.equal(evidence.sampleRouteMapping.priceFormatted, "$399.00");
  assert.equal(evidence.availabilityProbeStatus, 200);
  assert.equal(evidence.availabilityProbeResult.date, "2026-12-15");
  assert.equal(evidence.availabilityProbeResult.suvAvailable, false);
  assert.equal(evidence.availabilityProbeResult.vanQuoteOnly, true);

  // All 7 DCC-side pilot checklist items are explicitly marked "pending"
  const checklist = gosno.directPilot!.verificationChecklist;
  assert.equal(checklist.operatorAuthorization, "pending");
  assert.equal(checklist.providerApprovedApiAccess, "pending");
  assert.equal(checklist.agreedCommercialTerms, "pending");
  assert.equal(checklist.productMapping, "pending");
  assert.equal(checklist.livePricesAndAvailability, "pending");
  assert.equal(checklist.bookingAttributionAndOutcomeReporting, "pending");
  assert.equal(checklist.cancellationAndReturnPolicyVerifiedSeparately, "pending");
});

test("Operator onboarding durably saves applications, verifies post-write read-back retrieval, and protects the private review queue", async () => {
  const originalToken = process.env.EARTHOS_API_KEY;
  process.env.EARTHOS_API_KEY = "test-admin-review-queue-token";

  let createdAppId = "";
  let retrievalToken = "";
  try {
    // 1. Rejects secret fields
    const withSecret = validateOperatorOnboardingApplication({
      companyName: "Example Tours",
      contactName: "Jane Doe",
      contactEmail: "jane@example.com",
      website: "https://example.com",
      destinations: "Juneau, AK",
      bookingSystem: "FareHarbor",
      apiDocumentationUrl: "https://developer.fareharbor.com/",
      authorizedApiAccessAvailable: true,
      operatorPermissionConfirmed: true,
      apiKey: "secret-123",
    });
    assert.equal(withSecret.ok, false);
    if (!withSecret.ok) {
      assert.equal(withSecret.errorCode, "public_secret_submission_forbidden");
    }

    // 2. Submit a valid onboarding application via POST /api/operators/onboarding
    const postReq = new NextRequest("https://www.destinationcommandcenter.com/api/operators/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Cajun Pride Swamp Tours (Test Persistence)",
        contactName: "Operations Team",
        contactEmail: "res@cajunprideswamp.com",
        website: "https://www.cajunprideswamptours.com/",
        destinations: "LaPlace & New Orleans, LA",
        bookingSystem: "FareHarbor External API v1",
        apiDocumentationUrl: "https://developer.fareharbor.com/api/external/v1/",
        authorizedApiAccessAvailable: true,
        operatorPermissionConfirmed: true,
        notes: "Automated persistence & retrieval verification test",
      }),
    });

    const postRes = await postOnboardingRoute(postReq);
    assert.equal(postRes.status, 201);
    const postBody = await postRes.json();

    assert.equal(postBody.ok, true);
    assert.equal(postBody.persisted, true);
    assert.match(postBody.applicationId, /^dcc_onb_/);
    assert.ok(typeof postBody.retrievalToken === "string" && postBody.retrievalToken.length >= 32);
    assert.equal(postBody.applicationStatus, "application_received_pending_review");
    assert.equal(postBody.reviewQueueState, "pending_review");
    assert.equal(postBody.salesAuthorized, false);
    assert.equal(postBody.commercialTermsSigned, false);

    createdAppId = postBody.applicationId;
    retrievalToken = postBody.retrievalToken;

    // 3. Prove the saved application can be retrieved afterward using applicationId + retrievalToken
    const getApplicantReq = new NextRequest(
      `https://www.destinationcommandcenter.com/api/operators/onboarding?applicationId=${encodeURIComponent(
        createdAppId
      )}&retrievalToken=${encodeURIComponent(retrievalToken)}`,
      { method: "GET" }
    );
    const getApplicantRes = await getOnboardingRoute(getApplicantReq);
    assert.equal(getApplicantRes.status, 200);
    const retrievedBody = await getApplicantRes.json();

    assert.equal(retrievedBody.ok, true);
    assert.equal(retrievedBody.application.applicationId, createdAppId);
    assert.equal(
      retrievedBody.application.submitted.companyName,
      "Cajun Pride Swamp Tours (Test Persistence)"
    );
    assert.equal(
      retrievedBody.application.submitted.contactEmail,
      "res@cajunprideswamp.com"
    );
    assert.equal(retrievedBody.application.reviewQueueState, "pending_review");
    assert.equal(retrievedBody.application.salesAuthorized, false);
    assert.equal(retrievedBody.application.commercialTermsSigned, false);
    assert.equal("retrievalTokenHash" in retrievedBody.application, false);

    // 4. Rejects unauthenticated retrieval with wrong token
    const badTokenReq = new NextRequest(
      `https://www.destinationcommandcenter.com/api/operators/onboarding?applicationId=${encodeURIComponent(
        createdAppId
      )}&retrievalToken=wrong-token`,
      { method: "GET" }
    );
    const badTokenRes = await getOnboardingRoute(badTokenReq);
    assert.equal(badTokenRes.status, 401);

    // 5. Rejects unauthenticated access to private review queue
    const unauthQueueReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/operators/onboarding",
      { method: "GET" }
    );
    const unauthQueueRes = await getOnboardingRoute(unauthQueueReq);
    assert.equal(unauthQueueRes.status, 401);

    // 6. Authenticated reviewer can list the private review queue and see the persisted application
    const adminQueueReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/operators/onboarding",
      {
        method: "GET",
        headers: { Authorization: "Bearer test-admin-review-queue-token" },
      }
    );
    const adminQueueRes = await getOnboardingRoute(adminQueueReq);
    assert.equal(adminQueueRes.status, 200);
    const adminQueueBody = await adminQueueRes.json();
    assert.equal(adminQueueBody.ok, true);
    assert.ok(
      adminQueueBody.reviewQueue.some((item: any) => item.applicationId === createdAppId),
      "Persisted application must appear in private review queue"
    );
  } finally {
    if (createdAppId) {
      const delReq = new NextRequest(
        `https://www.destinationcommandcenter.com/api/operators/onboarding?applicationId=${encodeURIComponent(
          createdAppId
        )}&retrievalToken=${encodeURIComponent(retrievalToken)}`,
        {
          method: "DELETE",
          headers: { Authorization: "Bearer test-admin-review-queue-token" },
        }
      );
      const delRes = await deleteOnboardingRoute(delReq);
      assert.equal(delRes.status, 200);
    }
    if (originalToken !== undefined) {
      process.env.EARTHOS_API_KEY = originalToken;
    } else {
      delete process.env.EARTHOS_API_KEY;
    }
  }
});

test("Juneau operators who received prior 15% proposal are flagged doNotAutoSend and blocked from auto outreach", () => {
  assert.equal(FLAGGED_PRIOR_OUTREACH_OPERATORS.length, 3);
  const names = FLAGGED_PRIOR_OUTREACH_OPERATORS.map((o) => o.name);
  assert.deepEqual(names, [
    "Coastal Helicopters",
    "TEMSCO Helicopters",
    "NorthStar Trekking",
  ]);
  for (const flagged of FLAGGED_PRIOR_OUTREACH_OPERATORS) {
    assert.equal(flagged.priorProposal, "15% direct commission");
    assert.equal(flagged.doNotAutoSend, true);
  }

  const coastal = getOperatorManifest("coastal-helicopters")!;
  const coastalDraft = generatePilotOutreachDraft(coastal);
  assert.equal(coastalDraft.canPrepareDraft, false);
  assert.match(coastalDraft.blockedReason || "", /previously received a separate email proposing 15%/i);

  const cajunPride = getOperatorManifest("cajun-pride-swamp-tours")!;
  const cajunDraft = generatePilotOutreachDraft(cajunPride);
  assert.equal(cajunDraft.canPrepareDraft, true);
  assert.match(cajunDraft.body, /10% commission on completed direct bookings/);
});

test("Native provider API profiles document real provider APIs without claiming universal compatibility", () => {
  const providers = NATIVE_PROVIDER_API_PROFILES.map((p) => p.provider);
  assert.ok(providers.some((s) => s.includes("Rezdy")));
  assert.ok(providers.some((s) => s.includes("FareHarbor")));
  assert.ok(providers.some((s) => s.includes("Bókun")));
  assert.ok(providers.some((s) => s.includes("Ventrata")));
});

test("Viator live availability adapter never reports 401/403 or missing API key as sold-out inventory", async () => {
  const originalKey = process.env.VIATOR_API_KEY;
  const originalAlt1 = process.env.VIATOR_API;
  const originalAlt2 = process.env.VIATOR_KEY;
  const originalFetch = global.fetch;

  try {
    delete process.env.VIATOR_API_KEY;
    delete process.env.VIATOR_API;
    delete process.env.VIATOR_KEY;

    const unconfiguredResult = await checkDccLiveAvailability({
      siteId: "juneau-flight-deck",
      internalProductId: "jfd-juneau-heli-glacier-walk",
      bookingDate: "2026-11-15",
      adultCount: 2,
    });
    assert.equal(unconfiguredResult.available, null);
    assert.equal(unconfiguredResult.availabilityStatus, "unconfigured");

    process.env.VIATOR_API_KEY = "invalid-test-key";
    global.fetch = async () =>
      new Response(JSON.stringify({ message: "Invalid API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });

    const authErrorResult = await checkDccLiveAvailability({
      siteId: "juneau-flight-deck",
      internalProductId: "jfd-juneau-heli-glacier-walk",
      bookingDate: "2026-11-15",
      adultCount: 2,
    });
    assert.equal(authErrorResult.available, null);
    assert.equal(authErrorResult.availabilityStatus, "auth_error");
    assert.equal(authErrorResult.errorCode, "viator_auth_failed");
  } finally {
    if (originalKey !== undefined) process.env.VIATOR_API_KEY = originalKey;
    else delete process.env.VIATOR_API_KEY;
    if (originalAlt1 !== undefined) process.env.VIATOR_API = originalAlt1;
    else delete process.env.VIATOR_API;
    if (originalAlt2 !== undefined) process.env.VIATOR_KEY = originalAlt2;
    else delete process.env.VIATOR_KEY;
    global.fetch = originalFetch;
  }
});
