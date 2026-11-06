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
  exampleOffer: typeof JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE;
  stage1Submission: {
    applicationId: string;
    onboardingPath: "send_guests_to_checkout";
    applicationStatus: string;
    reviewQueueState: string;
    checkoutOffer: PublicOperatorOnboardingRecord["checkoutOffer"];
    nextAction: PublicOperatorOnboardingRecord["nextAction"];
    readinessStatuses: OperatorOfferReadinessStatuses;
  };
  stage2ReviewRecorded: {
    applicationStatus: string;
    reviewQueueState: string;
    commercialTermsSigned: boolean;
    salesAuthorized: boolean;
    reviewRecord: PublicOperatorOnboardingRecord["reviewRecord"];
    readinessStatuses: OperatorOfferReadinessStatuses;
  };
  stage3ReferralTrace: CheckoutOnboardingReferralTrace;
  pilotMilestoneSummary: {
    currentProductionState: string;
    milestoneRequirement: string;
  };
};

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
        "Preview demonstration: recorded FareHarbor affiliate account, 15% ASN commission terms, cancellation/refund reversal rules, Net-30 payout schedule, and online_booking_references report delivery.",
      commissionEvidence: {
        termsConfirmed: true,
        evidence:
          "Operator approved FareHarbor affiliate connection (aktourcenter) on item #763318 with 15% commission, Net-30 ASN payout, no commission on refunded bookings, and online_booking_references tracking.",
        evidenceSource: "preview_operator_review:jeanlafitteswamptour:763318",
      },
    },
    {
      retrievalToken: submitted.retrievalToken,
      bypassTokenForAuthorizedReviewer: true,
      reviewerActor: "dcc_pilot_reviewer",
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
    exampleOffer: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE,
    stage1Submission: stage1Snapshot,
    stage2ReviewRecorded: {
      applicationStatus: reviewed.application.applicationStatus,
      reviewQueueState: reviewed.application.reviewQueueState,
      commercialTermsSigned: reviewed.application.commercialTermsSigned,
      salesAuthorized: reviewed.application.salesAuthorized,
      reviewRecord: reviewed.application.reviewRecord,
      readinessStatuses: reviewed.application.readinessStatuses!,
    },
    stage3ReferralTrace: referralTrace,
    pilotMilestoneSummary: {
      currentProductionState:
        "Jean Lafitte (#763318) starts with Checkout tested ($131.44 total with fees verified), Check seats at FareHarbor, Commission terms pending, and API booking requires approval.",
      milestoneRequirement:
        "Once Jean Lafitte confirms the commission terms and a hotel approves sharing, the pilot milestone is one real booking matched to its placement and reconciled through payout.",
    },
  };
}
