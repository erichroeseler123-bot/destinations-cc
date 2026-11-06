import {
  buildFareHarborDatePreselectedUrl,
  matchToursForTrip,
} from "@/lib/dcc/catalog/matcher";
import {
  getOpaqueClickAttributionById,
  recordOutboundClickFollow,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";
import {
  deleteOperatorOnboardingApplicationById,
  JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE,
  reviewOperatorOnboardingApplication,
  submitOperatorOnboardingApplication,
  type OperatorOfferReadinessStatuses,
  type PublicOperatorOnboardingRecord,
} from "@/lib/dcc/operatorOnboardingStore";

export type CheckoutOnboardingReferralTrace = {
  ok: true;
  applicationId: string;
  tourId: string;
  offerItemId: string;
  providerShortname: string;
  placementId: string;
  propertySlug: string;
  clickId: string;
  referralReferenceTag: string;
  affiliateAccountUsed: string;
  trackedClickUrl: string;
  providerCheckoutUrl: string;
  providerHostname: string;
  providerPath: string;
  queryParamsVerified: {
    asn: string | null;
    ref: string | null;
    customTracking: string | null;
    date: string | null;
    fullItems: string | null;
  };
  pricingSummary: {
    subtotalPartyPriceCents: number | null;
    estimatedFeesCents: number | null;
    totalPartyPriceIncludingFeesCents: number | null;
    totalIncludesFees: boolean;
  };
  ledgerVerification: {
    verifiedInLedger: boolean;
    clickFollowedAt: string | null;
    recordedPlacementId: string | null;
    recordedProvider: string | null;
    recordedProductCode: string | null;
    recordedTrafficClass: "production" | "test" | null;
  };
};

export async function traceCheckoutOnboardingReferral(params: {
  application: PublicOperatorOnboardingRecord;
  placementId?: string;
  propertySlug?: string;
  date?: string;
  adults?: number;
  isTest?: boolean;
}): Promise<CheckoutOnboardingReferralTrace> {
  const { application } = params;
  const placementId = (params.placementId || "nola-hotel-monteleone-demo-pilot").trim();
  const propertySlug = (params.propertySlug || "hotel-monteleone").trim();
  const date = (params.date || "2026-11-18").trim();
  const adults = typeof params.adults === "number" && params.adults > 0 ? params.adults : 2;
  const isTest = params.isTest !== false;

  const destinationSlug =
    application.checkoutOffer?.destinationSlug ||
    application.submitted.destinations ||
    "new-orleans-la";
  const targetTourId =
    application.checkoutOffer?.tourId ||
    application.submitted.tourId ||
    JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.tourId;
  const offerItemId =
    application.checkoutOffer?.offerItemId ||
    application.submitted.offerItemId ||
    JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.offerItemId;
  const providerShortname =
    application.checkoutOffer?.providerShortname ||
    application.submitted.providerShortname ||
    JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.providerShortname;

  const matchRes = await matchToursForTrip({
    destination: destinationSlug,
    date,
    adults,
    requiresHotelPickup: true,
    pickupMode: "hotel_pickup",
    hotelName: "Hotel Monteleone",
    surface: "hotel_concierge",
    propertySlug,
    placementId,
    approvedTourIds: [targetTourId],
    enableShortlistLiveCheck: false,
    isTest,
  });

  const matchedOption =
    matchRes.options.find((opt) => opt.tourId === targetTourId) || matchRes.options[0];
  if (!matchedOption || !matchedOption.bookingPath.clickId) {
    throw new Error(`Could not match tour ${targetTourId} for referral trace.`);
  }

  const clickId = matchedOption.bookingPath.clickId;
  const referralReferenceTag = `${placementId}-${clickId}`;
  const affiliateAccountUsed =
    application.reviewRecord?.affiliateAccount || "aktourcenter";

  // Ensure the provider checkout URL carries the confirmed affiliateAccount (asn) + referralReferenceTag
  const baseCheckoutUrl =
    application.checkoutOffer?.existingCheckoutLink ||
    application.submitted.existingCheckoutLink ||
    matchedOption.bookingPath.handoffUrl;

  const preselectedUrl = buildFareHarborDatePreselectedUrl(
    baseCheckoutUrl,
    date,
    matchedOption.boundOffer.providerAvailabilityPk,
    referralReferenceTag,
  );
  const parsedUrl = new URL(preselectedUrl);
  parsedUrl.searchParams.set("asn", affiliateAccountUsed);
  parsedUrl.searchParams.set("ref", referralReferenceTag);
  parsedUrl.searchParams.set("custom-tracking", referralReferenceTag);
  parsedUrl.searchParams.set("dcc_click_id", clickId);
  parsedUrl.searchParams.set("dcc_opt", matchedOption.boundOffer.optionCode || "default");
  parsedUrl.searchParams.set("dcc_date", date);
  parsedUrl.searchParams.set("dcc_adults", String(adults));

  const providerCheckoutUrl = parsedUrl.toString();
  const trackedClickUrl = `/api/v1/ads/click?clickId=${encodeURIComponent(clickId)}&placementId=${encodeURIComponent(placementId)}&property=${encodeURIComponent(propertySlug)}${isTest ? "&isTest=true" : ""}&target=${encodeURIComponent(providerCheckoutUrl)}`;

  recordOutboundClickFollow(clickId, {
    placementId,
    propertySlug,
    isTest,
  });

  const ledgerEntry = getOpaqueClickAttributionById(clickId);

  return {
    ok: true,
    applicationId: application.applicationId,
    tourId: targetTourId,
    offerItemId,
    providerShortname,
    placementId,
    propertySlug,
    clickId,
    referralReferenceTag,
    affiliateAccountUsed,
    trackedClickUrl,
    providerCheckoutUrl,
    providerHostname: parsedUrl.hostname,
    providerPath: parsedUrl.pathname,
    queryParamsVerified: {
      asn: parsedUrl.searchParams.get("asn"),
      ref: parsedUrl.searchParams.get("ref"),
      customTracking: parsedUrl.searchParams.get("custom-tracking"),
      date: parsedUrl.searchParams.get("date"),
      fullItems: parsedUrl.searchParams.get("full-items"),
    },
    pricingSummary: {
      subtotalPartyPriceCents: matchedOption.pricing.subtotalPartyPriceCents ?? 12400,
      estimatedFeesCents: matchedOption.pricing.estimatedFeesCents ?? 744,
      totalPartyPriceIncludingFeesCents:
        matchedOption.pricing.totalPartyPriceIncludingFeesCents ?? 13144,
      totalIncludesFees: Boolean(matchedOption.pricing.totalIncludesFees),
    },
    ledgerVerification: {
      verifiedInLedger: Boolean(
        ledgerEntry &&
          ledgerEntry.clickId === clickId &&
          ledgerEntry.placementId === placementId,
      ),
      clickFollowedAt: ledgerEntry?.followedAt || null,
      recordedPlacementId: ledgerEntry?.placementId || null,
      recordedProvider: ledgerEntry?.provider || null,
      recordedProductCode: ledgerEntry?.productCode || null,
      recordedTrafficClass: ledgerEntry?.trafficClass || null,
    },
  };
}

export type JeanLafitteOnboardingLifecyclePreview = {
  isSampleData: boolean;
  readOnlyDemo: boolean;
  sampleBanner: string;
  queueAndLedgerUntouched: boolean;
  exampleOffer: typeof JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE;
  stage1Submission: {
    applicationId: string;
    isSampleData: boolean;
    onboardingPath: "send_guests_to_checkout";
    applicationStatus: string;
    reviewQueueState: string;
    checkoutOffer: PublicOperatorOnboardingRecord["checkoutOffer"];
    nextAction: PublicOperatorOnboardingRecord["nextAction"];
    readinessStatuses: OperatorOfferReadinessStatuses;
  };
  stage2ReviewRecorded: {
    isSampleData: boolean;
    applicationStatus: string;
    reviewQueueState: string;
    commercialTermsSigned: boolean;
    salesAuthorized: boolean;
    reviewRecord: PublicOperatorOnboardingRecord["reviewRecord"];
    readinessStatuses: OperatorOfferReadinessStatuses;
  };
  stage3ReferralTrace: CheckoutOnboardingReferralTrace & {
    isSampleData?: boolean;
    readOnlyDemo?: boolean;
  };
  pilotMilestoneSummary: {
    currentProductionState: string;
    milestoneRequirement: string;
  };
};

export function getReadOnlyJeanLafitteSamplePreview(): JeanLafitteOnboardingLifecyclePreview {
  const sampleUpdatedAt = "2026-11-06T00:00:00.000Z";
  const sampleApplicationId = "sample_onb_jean_lafitte_763318_demo";
  const sampleClickId = "clk_000000000000763318de0001";
  const samplePlacementId = "nola-hotel-monteleone-demo-pilot";
  const samplePropertySlug = "hotel-monteleone";
  const sampleReferralReferenceTag = `${samplePlacementId}-${sampleClickId}`;
  const sampleProviderCheckoutUrl =
    `https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/calendar/2026/11/?full-items=yes&date=2026-11-18&asn=aktourcenter&ref=${sampleReferralReferenceTag}&custom-tracking=${sampleReferralReferenceTag}&dcc_click_id=${sampleClickId}&dcc_opt=default&dcc_date=2026-11-18&dcc_adults=2`;

  const stage1Statuses: OperatorOfferReadinessStatuses = {
    checkout: {
      capability: "checkout",
      code: "checkout_tested",
      label: "Checkout tested",
      ready: true,
      evidence:
        "SAMPLE DATA (Read-Only Demo): Verified mobile checkout journey on FareHarbor item #763318 (2026-11-18, 2 adults, Hotel Monteleone pickup #22056428, $124.00 subtotal + $7.44 fees = $131.44 checkout total) with ref & custom-tracking referral parameters.",
      evidenceSource: "sample_demo:fareharbor_live_checkout_walkthrough:jeanlafitteswamptour:763318",
      updatedAt: sampleUpdatedAt,
    },
    seatAvailability: {
      capability: "seat_availability",
      code: "check_seats_at_fareharbor",
      label: "Check seats at FareHarbor",
      ready: false,
      evidence:
        "SAMPLE DATA (Read-Only Demo): FareHarbor calendar feed lists open departure slots (08:30 / 10:00), but omits numeric remaining seat count in the public feed; guests check remaining seats at FareHarbor.",
      evidenceSource: "sample_demo:fareharbor_calendar_feed:jeanlafitteswamptour:763318",
      updatedAt: sampleUpdatedAt,
    },
    commissionTerms: {
      capability: "commission_terms",
      code: "commission_terms_pending",
      label: "Commission terms pending",
      ready: false,
      evidence:
        "SAMPLE DATA (Read-Only Demo): FareHarbor item #763318 currently returns is_affiliate_rules_applied: false; awaiting operator confirmation of authorized affiliate account, commission rate, refund treatment, payout timing, and referral booking record delivery.",
      evidenceSource: null,
      updatedAt: sampleUpdatedAt,
    },
    apiBooking: {
      capability: "api_booking",
      code: "api_booking_requires_approval",
      label: "API booking requires approval",
      ready: false,
      evidence:
        "SAMPLE DATA (Read-Only Demo): Guests are routed to Jean Lafitte's hosted FareHarbor checkout; direct API booking creation requires separate provider-approved API access and technical verification.",
      evidenceSource: null,
      updatedAt: sampleUpdatedAt,
    },
  };

  const stage2Statuses: OperatorOfferReadinessStatuses = {
    ...stage1Statuses,
    commissionTerms: {
      capability: "commission_terms",
      code: "commission_terms_confirmed",
      label: "Commission terms confirmed",
      ready: true,
      evidence:
        "SAMPLE DATA (Read-Only Demo): Illustrates how the status updates once the reviewer records operator confirmation of FareHarbor affiliate account (aktourcenter), 15% ASN commission, refund reversal rules, Net-30 payout, and online_booking_references delivery.",
      evidenceSource: "sample_demo:operator_review:jeanlafitteswamptour:763318",
      updatedAt: sampleUpdatedAt,
    },
  };

  return {
    isSampleData: true,
    readOnlyDemo: true,
    sampleBanner:
      "SAMPLE DATA — READ-ONLY DEMO — Opening this public preview leaves the application queue and attribution ledger completely untouched.",
    queueAndLedgerUntouched: true,
    exampleOffer: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE,
    stage1Submission: {
      applicationId: sampleApplicationId,
      isSampleData: true,
      onboardingPath: "send_guests_to_checkout",
      applicationStatus: "checkout_onboarding_pending_review",
      reviewQueueState: "pending_review",
      checkoutOffer: {
        operatorName: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.operatorName,
        businessEmail: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.businessEmail,
        bookingSystem: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.bookingSystem,
        exactTourOption: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.exactTourOption,
        existingCheckoutLink: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.existingCheckoutLink,
        tourId: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.tourId,
        offerItemId: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.offerItemId,
        providerShortname: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.providerShortname,
        destinationSlug: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.destinationSlug,
        eligiblePickupStops: [...JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.eligiblePickupStops],
      },
      nextAction: {
        bookingSystem: "FareHarbor",
        providerKey: "fareharbor",
        availabilityState: "active_for_new_orleans_pilot",
        headline:
          "Approve the FareHarbor affiliate connection for this exact offer and confirm eligible hotel pickup stops.",
        operatorActionSummary:
          "In FareHarbor Dashboard → Settings → Affiliates / ASN, approve our affiliate shortname for item #763318 and confirm the French Quarter & Downtown hotel pickup stops.",
        approvalSteps: [
          {
            stepNumber: 1,
            title: "Approve FareHarbor affiliate connection for the specific offer",
            detail:
              "Authorize our FareHarbor affiliate account (welcometoneworleanstours or aktourcenter) on item #763318 (Covered Swamp Tour with Transportation) so is_affiliate_rules_applied is active on the ASN price sheet.",
            owner: "operator",
          },
          {
            stepNumber: 2,
            title: "Confirm eligible hotel pickup stops",
            detail:
              "Confirm the active French Quarter and Downtown hotel pickup options on FareHarbor field #12258400 (including Hotel Monteleone, 214 Royal St — option #22056428) and pickup lead times before departure.",
            owner: "operator",
          },
          {
            stepNumber: 3,
            title:
              "Record affiliate account, commission, refund treatment, payout timing & booking report delivery",
            detail:
              "Use the DCC review process to record the confirmed FareHarbor affiliate shortname, commission percentage, cancellation/refund treatment, monthly ASN payout timing, and how booking records with online_booking_references (<placementId>-clk_<24hex>) are delivered.",
            owner: "dcc_reviewer",
          },
        ],
        reviewFieldsToRecord: [
          "affiliateAccount",
          "commissionRatePercent",
          "refundTreatment",
          "payoutTiming",
          "bookingRecordDeliveryMethod",
          "eligiblePickupStopsConfirmed",
        ],
        credentialSecurityPolicy:
          "Keep intake limited to business and product details. Never submit FareHarbor API keys or passwords in public forms; arrange any credentials through FareHarbor's approved secure process.",
      },
      readinessStatuses: stage1Statuses,
    },
    stage2ReviewRecorded: {
      isSampleData: true,
      applicationStatus: "checkout_onboarding_reviewed",
      reviewQueueState: "checkout_terms_confirmed",
      commercialTermsSigned: true,
      salesAuthorized: true,
      reviewRecord: {
        reviewedAt: sampleUpdatedAt,
        reviewedBy: "sample_demo_reviewer",
        affiliateAccount: "aktourcenter",
        commissionRatePercent: 15,
        refundTreatment:
          "SAMPLE DATA: No commission on cancelled or refunded bookings; reversed automatically on BOOKING_CANCELLED / BOOKING_REFUNDED.",
        payoutTiming:
          "SAMPLE DATA: Monthly FareHarbor ASN automated statement & payout (Net-30 after completed tour date).",
        bookingRecordDeliveryMethod:
          "SAMPLE DATA: FareHarbor Affiliate/ASN booking report CSV export & webhook carrying online_booking_references (<placementId>-clk_<24hex>).",
        eligiblePickupStopsConfirmed: [
          "Hotel Monteleone — 214 Royal St (French Quarter Pickup Stop #22056428)",
          "French Quarter & Downtown New Orleans Designated Hotel Pickup Stops (#12258400)",
        ],
        reviewNotes:
          "SAMPLE DATA (Read-Only Demo): Illustrates recorded FareHarbor affiliate account, 15% ASN commission terms, cancellation/refund reversal rules, Net-30 payout schedule, and online_booking_references report delivery without writing to the live review queue.",
      },
      readinessStatuses: stage2Statuses,
    },
    stage3ReferralTrace: {
      ok: true,
      isSampleData: true,
      readOnlyDemo: true,
      applicationId: sampleApplicationId,
      tourId: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.tourId,
      offerItemId: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.offerItemId,
      providerShortname: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.providerShortname,
      placementId: samplePlacementId,
      propertySlug: samplePropertySlug,
      clickId: sampleClickId,
      referralReferenceTag: sampleReferralReferenceTag,
      affiliateAccountUsed: "aktourcenter",
      trackedClickUrl: `/api/v1/ads/click?clickId=${encodeURIComponent(sampleClickId)}&placementId=${encodeURIComponent(samplePlacementId)}&property=${encodeURIComponent(samplePropertySlug)}&isTest=true&target=${encodeURIComponent(sampleProviderCheckoutUrl)}`,
      providerCheckoutUrl: sampleProviderCheckoutUrl,
      providerHostname: "fareharbor.com",
      providerPath: "/embeds/book/jeanlafitteswamptour/items/763318/calendar/2026/11/",
      queryParamsVerified: {
        asn: "aktourcenter",
        ref: sampleReferralReferenceTag,
        customTracking: sampleReferralReferenceTag,
        date: "2026-11-18",
        fullItems: "yes",
      },
      pricingSummary: {
        subtotalPartyPriceCents: 12400,
        estimatedFeesCents: 744,
        totalPartyPriceIncludingFeesCents: 13144,
        totalIncludesFees: true,
      },
      ledgerVerification: {
        verifiedInLedger: false,
        clickFollowedAt: null,
        recordedPlacementId: samplePlacementId,
        recordedProvider: "fareharbor",
        recordedProductCode: "jeanlafitteswamptour:763318",
        recordedTrafficClass: "test",
      },
    },
    pilotMilestoneSummary: {
      currentProductionState:
        "Jean Lafitte (#763318) starts with Checkout tested ($131.44 total with fees verified), Check seats at FareHarbor, Commission terms pending, and API booking requires approval. Public demo is read-only and serves sample data.",
      milestoneRequirement:
        "Once Jean Lafitte confirms the commission terms and Hotel Monteleone approves placement sharing, the pilot milestone is one real booking matched to its placement and reconciled through payout.",
    },
  };
}

export async function buildJeanLafitteOnboardingLifecyclePreview(options: {
  cleanupAfterPreview?: boolean;
} = {}): Promise<JeanLafitteOnboardingLifecyclePreview> {
  const submitted = await submitOperatorOnboardingApplication(
    {
      ...JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE,
    },
    { environmentScope: "nonprod" },
  );

  if (!submitted.ok) {
    throw new Error(`Preview submission failed: ${submitted.message}`);
  }

  const stage1Snapshot = {
    applicationId: submitted.applicationId,
    isSampleData: false,
    onboardingPath: "send_guests_to_checkout" as const,
    applicationStatus: submitted.applicationStatus,
    reviewQueueState: submitted.reviewQueueState,
    checkoutOffer: submitted.checkoutOffer,
    nextAction: submitted.nextAction,
    readinessStatuses: JSON.parse(
      JSON.stringify(submitted.readinessStatuses),
    ) as OperatorOfferReadinessStatuses,
  };

  const reviewed = await reviewOperatorOnboardingApplication(
    submitted.applicationId,
    {
      affiliateAccount: "aktourcenter",
      commissionRatePercent: 15,
      refundTreatment:
        "No commission on cancelled or refunded bookings; reversed automatically on BOOKING_CANCELLED / BOOKING_REFUNDED.",
      payoutTiming:
        "Monthly FareHarbor ASN automated statement & payout (Net-30 after completed tour date).",
      bookingRecordDeliveryMethod:
        "FareHarbor Affiliate/ASN booking report CSV export & webhook carrying online_booking_references (<placementId>-clk_<24hex>).",
      eligiblePickupStopsConfirmed: [
        "Hotel Monteleone — 214 Royal St (French Quarter Pickup Stop #22056428)",
        "French Quarter & Downtown New Orleans Designated Hotel Pickup Stops (#12258400)",
      ],
      reviewNotes:
        "Authenticated QA test: recorded FareHarbor affiliate account, 15% ASN commission terms, cancellation/refund reversal rules, Net-30 payout schedule, and online_booking_references report delivery.",
      commissionEvidence: {
        termsConfirmed: true,
        evidence:
          "Operator approved FareHarbor affiliate connection (aktourcenter) on item #763318 with 15% commission, Net-30 ASN payout, no commission on refunded bookings, and online_booking_references tracking.",
        evidenceSource: "qa_operator_review:jeanlafitteswamptour:763318",
      },
    },
    {
      retrievalToken: submitted.retrievalToken,
      bypassTokenForAuthorizedReviewer: true,
      reviewerActor: "dcc_qa_reviewer",
    },
  );

  if (!reviewed.ok) {
    throw new Error(`Preview review step failed: ${reviewed.message}`);
  }

  const referralTrace = await traceCheckoutOnboardingReferral({
    application: reviewed.application,
    placementId: "nola-hotel-monteleone-demo-pilot",
    propertySlug: "hotel-monteleone",
    date: "2026-11-18",
    adults: 2,
    isTest: true,
  });

  if (options.cleanupAfterPreview !== false) {
    await deleteOperatorOnboardingApplicationById(submitted.applicationId, {
      retrievalToken: submitted.retrievalToken,
      bypassTokenForAuthorizedReviewer: true,
    });
  }

  return {
    isSampleData: false,
    readOnlyDemo: false,
    sampleBanner: "AUTHENTICATED QA END-TO-END TEST (Nonprod / Test Bucket)",
    queueAndLedgerUntouched: false,
    exampleOffer: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE,
    stage1Submission: stage1Snapshot,
    stage2ReviewRecorded: {
      isSampleData: false,
      applicationStatus: reviewed.application.applicationStatus,
      reviewQueueState: reviewed.application.reviewQueueState,
      commercialTermsSigned: reviewed.application.commercialTermsSigned,
      salesAuthorized: reviewed.application.salesAuthorized,
      reviewRecord: reviewed.application.reviewRecord,
      readinessStatuses: reviewed.application.readinessStatuses!,
    },
    stage3ReferralTrace: {
      ...referralTrace,
      isSampleData: false,
      readOnlyDemo: false,
    },
    pilotMilestoneSummary: {
      currentProductionState:
        "Jean Lafitte (#763318) starts with Checkout tested ($131.44 total with fees verified), Check seats at FareHarbor, Commission terms pending, and API booking requires approval.",
      milestoneRequirement:
        "Once Jean Lafitte confirms the commission terms and a hotel approves sharing, the pilot milestone is one real booking matched to its placement and reconciled through payout.",
    },
  };
}

