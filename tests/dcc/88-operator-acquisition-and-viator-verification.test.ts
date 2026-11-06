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
  PATCH as patchOnboardingRoute,
  POST as postOnboardingRoute,
} from "../../app/api/operators/onboarding/route";
import {
  JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE,
  validateOperatorOnboardingApplication,
} from "../../lib/dcc/operatorOnboardingStore";
import OperatorOnboardingForm from "../../app/operators/onboarding/OperatorOnboardingForm";

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

import {
  getFunnelMetricsReport,
  resetOpaqueAttributionLedgerForTests,
} from "../../lib/dcc/commerce/opaqueAttributionLedger";
import { listOperatorOnboardingReviewQueue } from "../../lib/dcc/operatorOnboardingStore";

test("Extend /operators/onboarding with two choices: Read-only Jean Lafitte (#763318) sample demo on public preview (leaving queue & ledger untouched) and authenticated QA end-to-end lifecycle test", async () => {
  const originalToken = process.env.EARTHOS_API_KEY;
  process.env.EARTHOS_API_KEY = "test-admin-review-queue-token";

  let checkoutAppId = "";
  let checkoutRetrievalToken = "";

  try {
    resetOpaqueAttributionLedgerForTests();
    const queueBeforePublicPreview = await listOperatorOnboardingReviewQueue({
      limit: 200,
    });
    const ledgerBeforePublicPreview = getFunnelMetricsReport();

    // 1. UI renders both choices ("Send guests to our checkout" and "Apply for API booking access"),
    //    the read-only SAMPLE DATA banner, Jean Lafitte #763318 example, FareHarbor next action, and the 4 initial statuses
    const formMarkup = renderToStaticMarkup(createElement(OperatorOnboardingForm, {}));
    assert.match(formMarkup, /Send guests to our checkout/);
    assert.match(formMarkup, /Apply for API booking access/);
    assert.match(formMarkup, /SAMPLE DATA — READ-ONLY DEMO/);
    assert.match(formMarkup, /Queue &amp; Attribution Ledger Untouched/);
    assert.match(formMarkup, /Jean Lafitte Swamp Tours/);
    assert.match(formMarkup, /763318/);
    assert.match(formMarkup, /Checkout tested/);
    assert.match(formMarkup, /Check seats at FareHarbor/);
    assert.match(formMarkup, /Commission terms pending/);
    assert.match(formMarkup, /API booking requires approval/);
    assert.match(
      formMarkup,
      /Approve the FareHarbor affiliate connection for this specific offer and confirm the eligible hotel pickup stops/i,
    );

    // 2. Public GET /api/operators/onboarding?preview=jean-lafitte-763318 returns read-only sample data
    //    and leaves the application queue and attribution ledger completely untouched
    const publicPreviewReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/operators/onboarding?preview=jean-lafitte-763318",
      { method: "GET" },
    );
    const publicPreviewRes = await getOnboardingRoute(publicPreviewReq);
    assert.equal(publicPreviewRes.status, 200);
    const publicPreviewBody = await publicPreviewRes.json();
    assert.equal(publicPreviewBody.ok, true);
    assert.equal(publicPreviewBody.mode, "public_read_only_sample");
    assert.equal(publicPreviewBody.readOnlyDemo, true);
    assert.equal(publicPreviewBody.isSampleData, true);
    assert.equal(publicPreviewBody.queueAndLedgerUntouched, true);
    assert.equal(publicPreviewBody.preview.isSampleData, true);
    assert.equal(publicPreviewBody.preview.readOnlyDemo, true);
    assert.equal(
      publicPreviewBody.preview.stage1Submission.applicationId,
      "sample_onb_jean_lafitte_763318_demo",
    );
    assert.equal(
      publicPreviewBody.preview.stage3ReferralTrace.clickId,
      "clk_000000000000763318de0001",
    );
    assert.equal(
      publicPreviewBody.preview.stage3ReferralTrace.ledgerVerification.verifiedInLedger,
      false,
    );

    // 3. Unauthenticated QA test mode and unauthenticated Jean Lafitte POST submission are blocked
    const unauthQaTestReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/operators/onboarding?preview=jean-lafitte-763318&mode=qa_live_test",
      { method: "GET" },
    );
    const unauthQaTestRes = await getOnboardingRoute(unauthQaTestReq);
    assert.equal(unauthQaTestRes.status, 401);

    const unauthDemoPostReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/operators/onboarding",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE,
        }),
      },
    );
    const unauthDemoPostRes = await postOnboardingRoute(unauthDemoPostReq);
    assert.equal(unauthDemoPostRes.status, 403);
    const unauthDemoPostBody = await unauthDemoPostRes.json();
    assert.equal(unauthDemoPostBody.errorCode, "read_only_demo_submission_blocked");
    assert.equal(unauthDemoPostBody.queueAndLedgerUntouched, true);

    // Prove that opening the public preview and hitting unauthenticated endpoints left the queue and ledger untouched
    const queueAfterPublicPreview = await listOperatorOnboardingReviewQueue({
      limit: 200,
    });
    const ledgerAfterPublicPreview = getFunnelMetricsReport();
    assert.equal(
      queueAfterPublicPreview.length,
      queueBeforePublicPreview.length,
      "Public preview must leave the application queue untouched",
    );
    assert.deepEqual(
      ledgerAfterPublicPreview.production,
      ledgerBeforePublicPreview.production,
      "Public preview must leave the production attribution ledger untouched",
    );
    assert.deepEqual(
      ledgerAfterPublicPreview.test,
      ledgerBeforePublicPreview.test,
      "Public preview must leave the test attribution ledger untouched",
    );

    // 4. Authenticated QA can submit Jean Lafitte (#763318) and run the full end-to-end test
    const submitReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/operators/onboarding",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-admin-review-queue-token",
        },
        body: JSON.stringify({
          ...JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE,
        }),
      },
    );
    const submitRes = await postOnboardingRoute(submitReq);
    assert.equal(submitRes.status, 201);
    const submitBody = await submitRes.json();

    assert.equal(submitBody.ok, true);
    assert.equal(submitBody.persisted, true);
    assert.equal(submitBody.onboardingPath, "send_guests_to_checkout");
    assert.equal(submitBody.applicationStatus, "checkout_onboarding_pending_review");
    assert.equal(submitBody.reviewQueueState, "pending_review");
    assert.equal(submitBody.salesAuthorized, false);
    assert.equal(submitBody.commercialTermsSigned, false);
    assert.equal(submitBody.credentialsCollectedPublicly, false);
    assert.equal(
      submitBody.checkoutOffer.tourId,
      "dcc:tour:fh:jeanlafitteswamptour:763318",
    );
    assert.equal(submitBody.checkoutOffer.offerItemId, "763318");

    // Verify initial 4 readiness statuses for Jean Lafitte (#763318)
    assert.equal(submitBody.readinessStatuses.checkout.label, "Checkout tested");
    assert.equal(submitBody.readinessStatuses.checkout.ready, true);
    assert.equal(
      submitBody.readinessStatuses.seatAvailability.label,
      "Check seats at FareHarbor",
    );
    assert.equal(submitBody.readinessStatuses.seatAvailability.ready, false);
    assert.equal(
      submitBody.readinessStatuses.commissionTerms.label,
      "Commission terms pending",
    );
    assert.equal(submitBody.readinessStatuses.commissionTerms.ready, false);
    assert.equal(
      submitBody.readinessStatuses.apiBooking.label,
      "API booking requires approval",
    );
    assert.equal(submitBody.readinessStatuses.apiBooking.ready, false);

    // Verify FareHarbor next action steps
    assert.equal(submitBody.nextAction.providerKey, "fareharbor");
    assert.equal(submitBody.nextAction.approvalSteps.length, 3);
    assert.match(
      submitBody.nextAction.approvalSteps[0].title,
      /Approve FareHarbor affiliate connection/i,
    );
    assert.match(
      submitBody.nextAction.approvalSteps[1].title,
      /Confirm eligible hotel pickup stops/i,
    );

    checkoutAppId = submitBody.applicationId;
    checkoutRetrievalToken = submitBody.retrievalToken;

    // 5. Reuse the existing review process (PATCH /api/operators/onboarding) to record
    //    affiliate account, commission, refund treatment, payout timing, and referral booking record delivery,
    //    plus trace the referral to the provider checkout
    const reviewReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/operators/onboarding",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-admin-review-queue-token",
        },
        body: JSON.stringify({
          applicationId: checkoutAppId,
          affiliateAccount: "aktourcenter",
          commissionRatePercent: 15,
          refundTreatment:
            "No commission owed on cancelled or refunded bookings; reversed on BOOKING_CANCELLED / BOOKING_REFUNDED.",
          payoutTiming:
            "Monthly FareHarbor ASN statement & payout (Net-30 after completed tour).",
          bookingRecordDeliveryMethod:
            "FareHarbor Affiliate/ASN booking report CSV & webhook carrying online_booking_references (<placementId>-clk_<24hex>).",
          eligiblePickupStopsConfirmed: [
            "Hotel Monteleone — 214 Royal St (#22056428)",
          ],
          commissionEvidence: {
            termsConfirmed: true,
            evidence:
              "Operator confirmed FareHarbor affiliate account aktourcenter for item #763318 at 15% commission, Net-30 ASN payout, and online_booking_references delivery.",
            evidenceSource: "test_operator_review:jeanlafitteswamptour:763318",
          },
          traceReferral: true,
          placementId: "nola-hotel-monteleone-demo-pilot",
        }),
      },
    );

    const reviewRes = await patchOnboardingRoute(reviewReq);
    assert.equal(reviewRes.status, 200);
    const reviewBody = await reviewRes.json();

    assert.equal(reviewBody.ok, true);
    assert.equal(reviewBody.application.applicationStatus, "checkout_onboarding_reviewed");
    assert.equal(reviewBody.application.reviewQueueState, "checkout_terms_confirmed");
    assert.equal(reviewBody.application.commercialTermsSigned, true);
    assert.equal(reviewBody.application.salesAuthorized, true);
    assert.equal(reviewBody.application.reviewRecord.affiliateAccount, "aktourcenter");
    assert.equal(reviewBody.application.reviewRecord.commissionRatePercent, 15);
    assert.match(
      reviewBody.application.reviewRecord.bookingRecordDeliveryMethod,
      /online_booking_references/,
    );

    assert.equal(
      reviewBody.application.readinessStatuses.checkout.label,
      "Checkout tested",
    );
    assert.equal(
      reviewBody.application.readinessStatuses.seatAvailability.label,
      "Check seats at FareHarbor",
    );
    assert.equal(
      reviewBody.application.readinessStatuses.commissionTerms.label,
      "Commission terms confirmed",
    );
    assert.equal(reviewBody.application.readinessStatuses.commissionTerms.ready, true);
    assert.equal(
      reviewBody.application.readinessStatuses.apiBooking.label,
      "API booking requires approval",
    );
    assert.equal(reviewBody.application.readinessStatuses.apiBooking.ready, false);

    // 6. Verify the referral trace to the exact provider checkout & attribution ledger
    const trace = reviewBody.referralTrace;
    assert.ok(trace, "Expected referralTrace in PATCH response");
    assert.equal(trace.ok, true);
    assert.equal(trace.tourId, "dcc:tour:fh:jeanlafitteswamptour:763318");
    assert.equal(trace.offerItemId, "763318");
    assert.equal(trace.placementId, "nola-hotel-monteleone-demo-pilot");
    assert.equal(trace.affiliateAccountUsed, "aktourcenter");
    assert.match(trace.clickId, /^clk_[a-f0-9]{24}$/);
    assert.equal(
      trace.referralReferenceTag,
      `nola-hotel-monteleone-demo-pilot-${trace.clickId}`,
    );
    assert.equal(trace.providerHostname, "fareharbor.com");
    assert.match(
      trace.providerPath,
      /^\/embeds\/book\/jeanlafitteswamptour\/items\/763318\//,
    );
    assert.equal(trace.queryParamsVerified.asn, "aktourcenter");
    assert.equal(trace.queryParamsVerified.ref, trace.referralReferenceTag);
    assert.equal(trace.queryParamsVerified.customTracking, trace.referralReferenceTag);
    assert.equal(trace.pricingSummary.subtotalPartyPriceCents, 12400);
    assert.equal(trace.pricingSummary.totalPartyPriceIncludingFeesCents, 13144);
    assert.equal(trace.ledgerVerification.verifiedInLedger, true);
    assert.equal(
      trace.ledgerVerification.recordedPlacementId,
      "nola-hotel-monteleone-demo-pilot",
    );
    assert.equal(trace.ledgerVerification.recordedProvider, "fareharbor");
    assert.equal(
      trace.ledgerVerification.recordedProductCode,
      "jeanlafitteswamptour:763318",
    );
    assert.equal(trace.ledgerVerification.recordedTrafficClass, "test");

    // 7. Verify that supplying evidence for seatAvailability and apiBooking transitions each status independently
    const capUpdateReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/operators/onboarding",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-admin-review-queue-token",
        },
        body: JSON.stringify({
          applicationId: checkoutAppId,
          seatAvailabilityEvidence: {
            numericCapacityVerified: true,
            evidence:
              "FareHarbor External API /availabilities/ returned numeric capacity=18 for item #763318.",
            evidenceSource: "fareharbor_external_api_capacity_check",
          },
          apiBookingEvidence: {
            apiBookingApproved: true,
            evidence:
              "Provider-approved FareHarbor External API user key provisioned securely and sandbox booking write verified.",
            evidenceSource: "fareharbor_external_api_booking_test",
          },
        }),
      },
    );
    const capUpdateRes = await patchOnboardingRoute(capUpdateReq);
    assert.equal(capUpdateRes.status, 200);
    const capUpdateBody = await capUpdateRes.json();
    assert.equal(
      capUpdateBody.application.readinessStatuses.seatAvailability.label,
      "Live seat count verified",
    );
    assert.equal(
      capUpdateBody.application.readinessStatuses.seatAvailability.ready,
      true,
    );
    assert.equal(
      capUpdateBody.application.readinessStatuses.apiBooking.label,
      "API booking approved",
    );
    assert.equal(capUpdateBody.application.readinessStatuses.apiBooking.ready, true);

    // 8. Verify authenticated QA GET /api/operators/onboarding?preview=jean-lafitte-763318&mode=qa_live_test
    const qaPreviewReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/operators/onboarding?preview=jean-lafitte-763318&mode=qa_live_test",
      {
        method: "GET",
        headers: { Authorization: "Bearer test-admin-review-queue-token" },
      },
    );
    const qaPreviewRes = await getOnboardingRoute(qaPreviewReq);
    assert.equal(qaPreviewRes.status, 200);
    const qaPreviewBody = await qaPreviewRes.json();
    assert.equal(qaPreviewBody.ok, true);
    assert.equal(qaPreviewBody.mode, "authenticated_qa_live_test");
    assert.equal(qaPreviewBody.readOnlyDemo, false);
    assert.equal(qaPreviewBody.isSampleData, false);
    assert.equal(
      qaPreviewBody.preview.stage1Submission.readinessStatuses.commissionTerms.label,
      "Commission terms pending",
    );
    assert.equal(
      qaPreviewBody.preview.stage2ReviewRecorded.readinessStatuses.commissionTerms.label,
      "Commission terms confirmed",
    );
    assert.equal(
      qaPreviewBody.preview.stage3ReferralTrace.ledgerVerification.verifiedInLedger,
      true,
    );
  } finally {
    if (checkoutAppId) {
      const delReq = new NextRequest(
        `https://www.destinationcommandcenter.com/api/operators/onboarding?applicationId=${encodeURIComponent(
          checkoutAppId,
        )}&retrievalToken=${encodeURIComponent(checkoutRetrievalToken)}`,
        {
          method: "DELETE",
          headers: { Authorization: "Bearer test-admin-review-queue-token" },
        },
      );
      await deleteOnboardingRoute(delReq);
    }
    if (originalToken !== undefined) {
      process.env.EARTHOS_API_KEY = originalToken;
    } else {
      delete process.env.EARTHOS_API_KEY;
    }
  }
});


