import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  DCC_HOMEPAGE_OPERATOR_MESSAGE,
  DCC_OPERATOR_PAGE_DIRECT_OFFER_MESSAGE,
  FLAGGED_PRIOR_OUTREACH_OPERATORS,
  GOSNO_DIRECT_PILOT_MANIFEST,
  NATIVE_PROVIDER_API_PROFILES,
  VERIFIED_DCC_OPERATORS,
  generatePilotOutreachDraft,
  getOperatorManifest,
  listOperatorSlugs,
  listVerifiedOperators,
} from "../../lib/dcc/operators";
import { checkDccLiveAvailability } from "../../lib/dcc/internal/dccViatorAdapter";
import { validateOperatorOnboardingApplication } from "../../app/api/operators/onboarding/route";

test("Homepage copy stays calm, factual, and decision-focused without salesy hero offers", () => {
  const homePath = path.join(process.cwd(), "app/components/dcc/LocationFirstHomeFast.tsx");
  const homeSource = fs.readFileSync(homePath, "utf8");

  // Leads with source-backed travel decision engine, constraints, evidence, and no-purchase usability
  assert.match(homeSource, /Source-Backed Travel Decision Engine/);
  assert.match(homeSource, /source-backed travel decision engine/i);
  assert.match(homeSource, /without buying anything/i);
  assert.match(homeSource, /public transport, free activities, direct operator options, and marketplace options/i);

  // Modest "For tour operators" link to /operators
  assert.match(homeSource, /For tour operators/);
  assert.match(homeSource, /href="\/operators"/);

  // Three audiences have clear paths (Travelers, Developers & AI Systems, Tour operators)
  assert.match(homeSource, /For Travelers/);
  assert.match(homeSource, /For Developers &amp; AI Systems/);

  // Must NOT put the 10% offer, "act now", commission comparisons, or industry-survival messaging on homepage
  assert.doesNotMatch(homeSource, /10% commission/i);
  assert.doesNotMatch(homeSource, /kept more of every booking/i);
  assert.doesNotMatch(homeSource, /act now/i);
  assert.doesNotMatch(homeSource, /20%\s*to\s*30%/i);
  assert.doesNotMatch(homeSource, /industry survival/i);
});

test("Operator partnership page (/operators) includes exact required message and all governance disclosures", () => {
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
  assert.match(operatorsPageSource, /First Direct-Channel Pilot/i);
});

test("Individual operator pages include exact 10% direct partnership offer and verified ACTIVE Viator products", () => {
  assert.equal(
    DCC_OPERATOR_PAGE_DIRECT_OFFER_MESSAGE,
    "Your tours are featured here through Viator. If you’d like bookings to go directly to your company, we can connect your booking API. Our proposed commission is 10% on completed direct bookings."
  );

  const viatorOperators = listVerifiedOperators();
  assert.equal(viatorOperators.length, 7);

  for (const op of viatorOperators) {
    assert.equal(op.currentBookingChannel, "viator");
    assert.equal(op.directPartnershipStatus, "not_enrolled_viator_channel");
    assert.match(op.supplierReference || "", /^SUPPLIER-/);
    assert.ok(op.verifiedViatorProducts.length >= 1, `${op.name} must have at least 1 verified product`);

    for (const prod of op.verifiedViatorProducts) {
      assert.equal(prod.status, "ACTIVE");
      assert.equal(prod.supplierReference, op.supplierReference);
      assert.equal(prod.imageSourceType, "SUPPLIER_PROVIDED");
      assert.match(prod.coverImageUrl, /^https:\/\/media-cdn\.tripadvisor\.com\//);
      assert.match(prod.trackedViatorUrl, new RegExp(prod.productCode));
      assert.match(prod.trackedViatorUrl, /pid=P00(306962|280995)/);
      assert.match(prod.trackedViatorUrl, /mcid=42383/);
    }
  }

  // GoSno pilot is explicitly separated from its working production checkout
  assert.equal(GOSNO_DIRECT_PILOT_MANIFEST.currentBookingChannel, "direct_pilot");
  assert.equal(GOSNO_DIRECT_PILOT_MANIFEST.directPilot?.bookingSystem, "Rezdy Native REST API v1");
  assert.equal(
    GOSNO_DIRECT_PILOT_MANIFEST.directPilot?.workingCheckoutUrl,
    "https://gosno.co/denver-to-breckenridge"
  );
  assert.equal(
    GOSNO_DIRECT_PILOT_MANIFEST.directPilot?.wellKnownEndpointUrl,
    "https://gosno.co/.well-known/dcc"
  );

  assert.equal(listOperatorSlugs().length, VERIFIED_DCC_OPERATORS.length + 1);
  assert.ok(getOperatorManifest("coastal-helicopters"));
  assert.ok(getOperatorManifest("cajun-pride-swamp-tours"));
  assert.ok(getOperatorManifest("gosno"));
  assert.equal(getOperatorManifest("mendenhall-tours-co"), null);
  assert.equal(getOperatorManifest("northstar-heli-adventures"), null);
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

test("Operator onboarding validation enforces API-only rule, rejects secret fields, and keeps salesAuthorized false", () => {
  // Rejects secret fields
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

  // Enforces API-only partnership when no API is available
  const withoutApi = validateOperatorOnboardingApplication({
    companyName: "Example Tours",
    contactName: "Jane Doe",
    contactEmail: "jane@example.com",
    website: "https://example.com",
    destinations: "Juneau, AK",
    bookingSystem: "no_api",
    apiDocumentationUrl: "",
    authorizedApiAccessAvailable: false,
    operatorPermissionConfirmed: true,
  });
  assert.equal(withoutApi.ok, true);
  if (withoutApi.ok && "applicationStatus" in withoutApi) {
    assert.equal(withoutApi.applicationStatus, "api_required_keep_viator_channel");
    assert.equal(withoutApi.salesAuthorized, false);
    assert.equal(withoutApi.commercialTermsSigned, false);
  }

  // Accepts valid application and keeps salesAuthorized false until review + integration verification
  const valid = validateOperatorOnboardingApplication({
    companyName: "Cajun Pride Swamp Tours",
    contactName: "Operations Team",
    contactEmail: "res@cajunprideswamp.com",
    website: "https://www.cajunprideswamptours.com/",
    destinations: "LaPlace & New Orleans, LA",
    bookingSystem: "FareHarbor",
    apiDocumentationUrl: "https://developer.fareharbor.com/api/external/v1/",
    authorizedApiAccessAvailable: true,
    operatorPermissionConfirmed: true,
  });
  assert.equal(valid.ok, true);
  if (valid.ok && "requiredVerificationGatesBeforeCutover" in valid) {
    assert.equal(valid.applicationStatus, "application_received_pending_review");
    assert.equal(valid.salesAuthorized, false);
    assert.equal(valid.commercialTermsSigned, false);
    assert.equal(valid.credentialsCollectedPublicly, false);
    assert.equal(valid.proposedCommissionPercent, 10);
    assert.equal(valid.requiredVerificationGatesBeforeCutover.length, 7);
  }
});

test("Viator live availability adapter never reports 401/403 or missing API key as sold-out inventory", async () => {
  const originalKey = process.env.VIATOR_API_KEY;
  const originalAlt1 = process.env.VIATOR_API;
  const originalAlt2 = process.env.VIATOR_KEY;
  const originalFetch = global.fetch;

  try {
    // 1. Missing API key returns available: null and availabilityStatus: "unconfigured"
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

    // 2. Viator 401 unauthorized returns available: null and availabilityStatus: "auth_error" (NEVER available: false)
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
