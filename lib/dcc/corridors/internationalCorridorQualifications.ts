/**
 * International Corridor Qualification & Routing Engine
 * - Corridor 1: Iceland — Keflavík Airport (KEF) → Vík (South Coast Route 1)
 * - Corridor 2: India — Delhi → Agra (Gatimaan / Vande Bharat Rail + Station Transfer vs. Yamuna Expressway)
 * - Corridor 3: China — Hong Kong → Macao (HZMB Bus / Cross-Boundary MPV vs. High-Speed Ferry)
 *
 * Enforces:
 * 1. Drive Reykjavík pickup policy reconciled with its published FAQ (`https://drivereykjavik.is/faq/`).
 * 2. Dated source (`verifiedOnDate` + `sourceUrl`) or explicit operator confirmation (`operatorConfirmedBy` + `verifiedOnDate`)
 *    required before publishing operator prices, permits, refund terms, or booking/WhatsApp links.
 * 3. Open operator/feed items queued in the existing Review Desk (`INTERNATIONAL_CORRIDOR_REVIEW_DESK_CANDIDATE_BASELINE`).
 * 4. Iceland road (`Vegagerðin DATEX II` / `IMO`) and Hong Kong checkpoint (`HK ImmD`) examples labeled as Samples everywhere.
 * 5. The 10% referral proposal kept strictly in `ICELAND_OPERATOR_OUTREACH_DRAFT` (`visibility: "private_outreach_only"`).
 */

import type { CompactTripRecheckCardModel } from "@/lib/dcc/sharedTripRecheck";
import {
  evaluateDcc412ItineraryRecheck,
  evaluateDelhiAgra20261210CorridorFixture,
  evaluateDelhiAgraRealTripRecheck,
  evaluateSyntheticDelhiAgraDcc412Test,
  type Dcc412CandidateDepartureInput,
  type Dcc412ItineraryRecheckResult,
} from "@/lib/dcc/sharedTripRecheck";
import {
  evaluateKefVikClosedReviewDeskFacts,
  evaluateResearchFactRecord,
  INTERNATIONAL_CORRIDOR_REVIEW_DESK_CANDIDATE_BASELINE,
  KEF_VIK_REVIEW_DESK_CLOSED_OPERATOR_EVIDENCE,
  type ApprovedFactFeedEvaluation,
  type EvaluatedResearchFact,
  type RawResearchDeskFactRow,
} from "@/lib/dcc/research/approvedFactsFeed";

// ============================================================================
// 0. Dated Source or Operator Confirmation Gate + Review Desk Integration
// ============================================================================

export interface DatedSourceOrOperatorConfirmationGate {
  fieldCategory:
    | "published_price"
    | "permit"
    | "refund_terms"
    | "booking_or_whatsapp_link"
    | "pickup_policy";
  verified: boolean;
  statusLabel:
    | "Verified (Dated Official Source)"
    | "Confirmed by Operator"
    | "Pending operator confirmation (Queued in Review Desk)";
  verifiedOnDate: string | null;
  sourceUrl: string | null;
  operatorConfirmedBy: string | null;
  reviewDeskFactId: string | null;
  publicDisplayValue: string;
}

export function verifyDatedSourceOrOperatorConfirmation(params: {
  fieldCategory: DatedSourceOrOperatorConfirmationGate["fieldCategory"];
  proposedValue: string | null | undefined;
  verifiedOnDate?: string | null;
  sourceUrl?: string | null;
  operatorConfirmedBy?: string | null;
  reviewDeskFactId?: string | null;
  pendingFallbackLabel: string;
}): DatedSourceOrOperatorConfirmationGate {
  const hasDatedSource = Boolean(
    params.verifiedOnDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(params.verifiedOnDate.trim()) &&
      params.sourceUrl &&
      /^https?:\/\//i.test(params.sourceUrl.trim()),
  );
  const hasOperatorConfirmation = Boolean(
    params.verifiedOnDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(params.verifiedOnDate.trim()) &&
      params.operatorConfirmedBy &&
      params.operatorConfirmedBy.trim().length > 0,
  );
  const verified = Boolean(
    params.proposedValue &&
      params.proposedValue.trim().length > 0 &&
      (hasDatedSource || hasOperatorConfirmation),
  );

  return {
    fieldCategory: params.fieldCategory,
    verified,
    statusLabel: hasOperatorConfirmation
      ? "Confirmed by Operator"
      : hasDatedSource
        ? "Verified (Dated Official Source)"
        : "Pending operator confirmation (Queued in Review Desk)",
    verifiedOnDate: verified ? params.verifiedOnDate!.trim() : null,
    sourceUrl: verified && params.sourceUrl ? params.sourceUrl.trim() : null,
    operatorConfirmedBy:
      verified && params.operatorConfirmedBy
        ? params.operatorConfirmedBy.trim()
        : null,
    reviewDeskFactId: params.reviewDeskFactId || null,
    publicDisplayValue: verified
      ? params.proposedValue!.trim()
      : params.pendingFallbackLabel,
  };
}

export function getReviewDeskItemsForInternationalCorridor(
  cluster:
    | "iceland-kef-vik"
    | "india-delhi-agra"
    | "china-hk-macao"
    | "peru-machu-picchu",
): RawResearchDeskFactRow[] {
  return INTERNATIONAL_CORRIDOR_REVIEW_DESK_CANDIDATE_BASELINE.filter(
    (row) => row.cluster === cluster,
  );
}

// ============================================================================
// 1. ICELAND: Keflavík Airport (KEF) → Vík (South Coast Route 1)
// ============================================================================

export interface IcelandSeparateTripBoundary {
  tripSlug: string;
  title: string;
  corridorDistinctReason: string;
  dedicatedRouteOrPlannedPath: string;
}

export const ICELAND_SEPARATE_TRIP_BOUNDARIES: IcelandSeparateTripBoundary[] = [
  {
    tripSlug: "reykjavik-domestic-airport-rkv",
    title: "Reykjavík Domestic Airport (RKV) Transfers & Eagle Air / Icelandair Domestic",
    corridorDistinctReason:
      "RKV sits in central Reykjavík (101) for domestic Westfjords/Akureyri/Hornafjörður flights — 50 km northeast of Keflavík International (KEF).",
    dedicatedRouteOrPlannedPath: "/iceland#rkv-domestic-separation",
  },
  {
    tripSlug: "golden-circle-day-loop",
    title: "Golden Circle (Þingvellir, Geysir, Gullfoss — Routes 36 / 365 / 35)",
    corridorDistinctReason:
      "Inland mountain-plateau loop via Mosfellsheiði (Route 36), distinct from the South Coast Ring Road (Route 1) across Hellisheiði to Vík.",
    dedicatedRouteOrPlannedPath: "/iceland#golden-circle-separation",
  },
  {
    tripSlug: "blue-lagoon-reykjanes-stopover",
    title: "Blue Lagoon (Grindavíkurvegur Route 43 — Reykjanes Peninsula)",
    corridorDistinctReason:
      "20-minute Reykjanes Peninsula transfer subject to Grindavík volcanic hazard zone closures and luggage-storage rules; not a South Coast Vík transfer.",
    dedicatedRouteOrPlannedPath: "/iceland#blue-lagoon-separation",
  },
  {
    tripSlug: "solheimajokull-katla-glacier-excursions",
    title: "Sólheimajökull & Katla Ice Cave Guided Glacier Excursions",
    corridorDistinctReason:
      "Specialized crampon/super-jeep glacier activity staging from Sólheimajökull parking lot or Vík basecamp, separate from point-to-point KEF → Vík highway transport.",
    dedicatedRouteOrPlannedPath: "/iceland#glacier-excursions-separation",
  },
];

export interface IcelandQualifiedOperatorProfile {
  operatorId: string;
  brandName: string;
  licensedLegalEntity: string;
  kennitalaOrLicenseNote: string;
  authorizedPermitAuthority: string;
  reviewDeskFactId: string;
  corridorScope: "KEF_TO_VIK_DIRECT_OR_VIA_REYKJAVIK";
  priceIskLabel: string;
  priceUsdReferenceNote: string;
  pricingVerificationGate: DatedSourceOrOperatorConfirmationGate;
  permitVerificationGate: DatedSourceOrOperatorConfirmationGate;
  refundTermsVerificationGate: DatedSourceOrOperatorConfirmationGate;
  bookingLinkVerificationGate: DatedSourceOrOperatorConfirmationGate;
  vehicleClasses: Array<{
    classId: string;
    name: string;
    maxPassengers: number;
    maxCheckedBags: number;
    maxCarryOnBags: number;
    winterStuddedTiresIncluded: boolean;
  }>;
  /**
   * Reconciled pickup policy distinguishing published FAQ rules from unconfirmed airport/transfer terms
   */
  faqPickupPolicyReconciliation: {
    publishedFaqRuleSummary: string;
    faqSourceUrl: string;
    faqVerifiedOnDate: string;
    privateKefArrivalPolicyStatus: "pending_operator_confirmation";
    reconciledSummary: string;
  };
  delayedFlightPickupPolicy: string;
  roadClosureAndRefundTerms: string;
  /**
   * Null when direct checkout/WhatsApp link is not yet confirmed with a dated source or operator sign-off
   */
  confirmedBookingOrQuoteUrl: string | null;
  officialWebsiteUrl: string;
  acceptedHandoffFields: string[];
  bookingAndRefundReportingMethod: string;
  verificationStatus: "verified_operator_pending_commercial_signoff";
  pricingCurrency: "ISK";
  publishedPriceScheduleIsk: Array<{
    vehicleClass: string;
    verificationStatus: "pending_operator_confirmation_in_review_desk";
    note: string;
  }>;
  directCheckoutStatus: "qualification_complete_pending_10pct_partner_agreement";
}

export const ICELAND_KEF_VIK_OPERATOR_PROFILES: IcelandQualifiedOperatorProfile[] = [
  {
    operatorId: "northtrip-iceland",
    brandName: "NorthTrip",
    licensedLegalEntity:
      "NorthTrip ehf. (Icelandic Tourist Board / Ferðamálastofa Authorized Tour Operator & Day-Tour Carrier)",
    kennitalaOrLicenseNote:
      "Ferðamálastofa (Icelandic Tourist Board) & Samgöngustofa commercial passenger transport registration — license number pending written operator confirmation in Review Desk (`mc-ice-northtrip-kef-vik-pricing-and-terms-20261107`).",
    authorizedPermitAuthority:
      "Ferðamálastofa (Icelandic Tourist Board) & Samgöngustofa (Icelandic Transport Authority)",
    reviewDeskFactId: "mc-ice-northtrip-kef-vik-pricing-and-terms-20261107",
    corridorScope: "KEF_TO_VIK_DIRECT_OR_VIA_REYKJAVIK",
    priceIskLabel:
      "Rate card in ISK pending operator confirmation / dated source (Queued in Review Desk)",
    priceUsdReferenceNote:
      "Published ISK tariff withheld until NorthTrip confirms dated KEF → Vík direct private transfer rate card in Review Desk.",
    pricingVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "published_price",
      proposedValue: null,
      reviewDeskFactId: "mc-ice-northtrip-kef-vik-pricing-and-terms-20261107",
      pendingFallbackLabel:
        "Pending operator confirmation / dated source in Review Desk (mc-ice-northtrip-kef-vik-pricing-and-terms-20261107)",
    }),
    permitVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "permit",
      proposedValue: null,
      reviewDeskFactId: "mc-ice-northtrip-kef-vik-pricing-and-terms-20261107",
      pendingFallbackLabel:
        "Ferðamálastofa / Samgöngustofa commercial license number pending written operator confirmation in Review Desk",
    }),
    refundTermsVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "refund_terms",
      proposedValue: null,
      reviewDeskFactId: "mc-ice-northtrip-kef-vik-pricing-and-terms-20261107",
      pendingFallbackLabel:
        "Vegagerðin Route 1 closure (Ófært / Lokað) refund & re-accommodation terms pending written operator confirmation in Review Desk",
    }),
    bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "booking_or_whatsapp_link",
      proposedValue: null,
      reviewDeskFactId: "mc-ice-northtrip-kef-vik-pricing-and-terms-20261107",
      pendingFallbackLabel:
        "Direct KEF → Vík checkout/quote link pending operator confirmation in Review Desk",
    }),
    vehicleClasses: [
      {
        classId: "iceland-4x4-suv",
        name: "Private 4x4 Winter SUV (Land Cruiser / Defender Class)",
        maxPassengers: 4,
        maxCheckedBags: 4,
        maxCarryOnBags: 4,
        winterStuddedTiresIncluded: true,
      },
      {
        classId: "iceland-mercedes-sprinter-4x4",
        name: "Private 4x4 Mercedes Sprinter Minibus",
        maxPassengers: 12,
        maxCheckedBags: 12,
        maxCarryOnBags: 12,
        winterStuddedTiresIncluded: true,
      },
    ],
    faqPickupPolicyReconciliation: {
      publishedFaqRuleSummary:
        "NorthTrip public tour pages list Reykjavík pickup coordination; direct KEF International Airport arrival monitoring and post-landing wait grace window for KEF → Vík private transfers require written operator confirmation.",
      faqSourceUrl: "https://northtrip.is/",
      faqVerifiedOnDate: "2026-11-07",
      privateKefArrivalPolicyStatus: "pending_operator_confirmation",
      reconciledSummary:
        "KEF post-landing wait window and delayed-flight staging rule are marked Pending operator confirmation in Review Desk (`mc-ice-northtrip-kef-vik-pricing-and-terms-20261107`).",
    },
    delayedFlightPickupPolicy:
      "Pending operator confirmation in Review Desk: KEF flight-arrival monitoring and post-customs wait window for direct KEF → Vík transfers must be confirmed in writing by NorthTrip before publishing as a guaranteed grace window.",
    roadClosureAndRefundTerms:
      "Pending operator confirmation in Review Desk: When Vegagerðin marks Route 1 (Hellisheiði or Seljalandsfoss–Vík) as Impassable (Ófært) or Closed (Lokað), refund vs. next-day re-accommodation terms require written operator confirmation.",
    confirmedBookingOrQuoteUrl: null,
    officialWebsiteUrl: "https://northtrip.is/",
    acceptedHandoffFields: [
      "origin",
      "destination",
      "date",
      "flight",
      "eta",
      "passengers",
      "luggage",
      "vehicle_class",
      "dcc_handoff_id",
      "utm_source",
    ],
    bookingAndRefundReportingMethod:
      "Pending partner sign-off (monthly CSV reconciliation + webhook/email confirmation carrying `dcc_handoff_id`).",
    verificationStatus: "verified_operator_pending_commercial_signoff",
    pricingCurrency: "ISK",
    publishedPriceScheduleIsk: [
      {
        vehicleClass: "Private 4x4 Winter SUV (1–4 Pax)",
        verificationStatus: "pending_operator_confirmation_in_review_desk",
        note: "ISK tariff queued in Review Desk (`mc-ice-northtrip-kef-vik-pricing-and-terms-20261107`)",
      },
    ],
    directCheckoutStatus:
      "qualification_complete_pending_10pct_partner_agreement",
  },
  {
    operatorId: "drive-reykjavik",
    brandName: "Drive Reykjavík",
    licensedLegalEntity:
      "Drive Reykjavík ehf. (Licensed Icelandic Private Transfer & Excursion Carrier)",
    kennitalaOrLicenseNote:
      "Registered Reykjavík passenger transport & tour operator under Samgöngustofa commercial operating permit — specific permit number queued in Review Desk (`mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107`).",
    authorizedPermitAuthority:
      "Samgöngustofa (Icelandic Transport Authority) & Ferðamálastofa",
    reviewDeskFactId: "mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107",
    corridorScope: "KEF_TO_VIK_DIRECT_OR_VIA_REYKJAVIK",
    priceIskLabel:
      "Rate card in ISK pending operator confirmation / dated source (Queued in Review Desk)",
    priceUsdReferenceNote:
      "Published ISK tariff withheld until Drive Reykjavík confirms dated KEF → Vík private transfer rate card in Review Desk.",
    pricingVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "published_price",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107",
      pendingFallbackLabel:
        "Pending operator confirmation / dated source in Review Desk (mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107)",
    }),
    permitVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "permit",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107",
      pendingFallbackLabel:
        "Samgöngustofa / Ferðamálastofa permit number pending written operator confirmation in Review Desk",
    }),
    refundTermsVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "refund_terms",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107",
      pendingFallbackLabel:
        "Route 1 road-closure refund & reschedule terms pending written operator confirmation in Review Desk",
    }),
    bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "booking_or_whatsapp_link",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107",
      pendingFallbackLabel:
        "Direct KEF → Vík checkout/quote link pending operator confirmation in Review Desk",
    }),
    vehicleClasses: [
      {
        classId: "drive-rvk-luxury-suv",
        name: "Private AWD Executive SUV (1–4 Pax)",
        maxPassengers: 4,
        maxCheckedBags: 4,
        maxCarryOnBags: 4,
        winterStuddedTiresIncluded: true,
      },
      {
        classId: "drive-rvk-mercedes-v-class",
        name: "Private Mercedes V-Class AWD Van (1–6 Pax)",
        maxPassengers: 6,
        maxCheckedBags: 6,
        maxCarryOnBags: 6,
        winterStuddedTiresIncluded: true,
      },
      {
        classId: "drive-rvk-minibus-16",
        name: "Private Touring Minibus (7–16 Pax)",
        maxPassengers: 16,
        maxCheckedBags: 16,
        maxCarryOnBags: 16,
        winterStuddedTiresIncluded: true,
      },
    ],
    faqPickupPolicyReconciliation: {
      publishedFaqRuleSummary:
        "Drive Reykjavík's published FAQ states that Reykjavík capital-area hotel and designated tour-bus-stop pickups begin 30 minutes prior to scheduled departure (`https://drivereykjavik.is/faq/`, checked 2026-11-07) and travelers should be ready at the pickup point when the 30-minute window opens.",
      faqSourceUrl: "https://drivereykjavik.is/faq/",
      faqVerifiedOnDate: "2026-11-07",
      privateKefArrivalPolicyStatus: "pending_operator_confirmation",
      reconciledSummary:
        "Reconciled with Drive Reykjavík FAQ: published FAQ covers the 30-minute Reykjavík hotel/bus-stop pickup window before tour departure, whereas private KEF International Airport arrival monitoring and post-landing wait windows for KEF → Vík transfers are not published as a self-serve FAQ rule and require written operator confirmation (queued in Review Desk `mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107`).",
    },
    delayedFlightPickupPolicy:
      "Reconciled with Drive Reykjavík FAQ (`https://drivereykjavik.is/faq/`, checked 2026-11-07): Reykjavík hotel and designated tour-bus-stop pickups begin 30 minutes before departure. Private KEF International Airport arrival monitoring and post-landing wait windows for KEF → Vík transfers are not published in the public FAQ and require written operator confirmation (queued in Review Desk).",
    roadClosureAndRefundTerms:
      "Pending operator confirmation in Review Desk: Route 1 road closure (Vegagerðin Lokað) or IMO Red/Orange wind warning refund/re-dispatch terms require written operator confirmation before publishing as a guaranteed policy.",
    confirmedBookingOrQuoteUrl: null,
    officialWebsiteUrl: "https://drivereykjavik.is/",
    acceptedHandoffFields: [
      "origin",
      "destination",
      "date",
      "flight",
      "eta",
      "passengers",
      "luggage",
      "vehicle_class",
      "dcc_handoff_id",
    ],
    bookingAndRefundReportingMethod:
      "Pending partner sign-off (operator booking reference + monthly confirmed/refunded ledger export).",
    verificationStatus: "verified_operator_pending_commercial_signoff",
    pricingCurrency: "ISK",
    publishedPriceScheduleIsk: [
      {
        vehicleClass: "Private AWD Executive SUV (1–4 Pax)",
        verificationStatus: "pending_operator_confirmation_in_review_desk",
        note: "ISK tariff queued in Review Desk (`mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107`)",
      },
    ],
    directCheckoutStatus:
      "qualification_complete_pending_10pct_partner_agreement",
  },
];

/**
 * Private B2B Outreach Draft — strictly private (`visibility: "private_outreach_only"`).
 * Never render the 10% referral proposal on public guide pages or public CTAs.
 */
export interface IcelandPartnerOutreachEmailDraft {
  visibility: "private_outreach_only";
  subject: string;
  proposedCommissionRatePercent: 10;
  proposedCommissionRatePct: 10;
  commissionTrigger: "Confirmed referred bookings (net of full weather/road-closure refunds)";
  recipientOperators: string[];
  questionsRequested: string[];
  bodyText: string;
  emailBodyText: string;
}

const ICELAND_OUTREACH_BODY_TEXT = `Subject: Partnership Inquiry: Keflavík Airport (KEF) → Vík Private Transfer Referrals from Destination Command Center

Hi [NorthTrip / Drive Reykjavík Team],

We run Destination Command Center (https://destinationcommandcenter.com), where travelers check real-time route feasibility, Vegagerðin DATEX II road segments, and Icelandic Met Office (Veðurstofa Íslands) wind/weather warnings before booking point-to-point transport in Iceland.

We are qualifying two licensed operators for our Keflavík International Airport (KEF) → Vík South Coast corridor (/routes/keflavik-to-vik) and would like to propose a 10% referral commission on confirmed referred bookings (net of weather or road-closure refunds).

To list your KEF → Vík private transfers as a confirmed option and move your open items out of our Review Desk, could you confirm:
1. Your licensed legal entity name, Kennitala, and Ferðamálastofa / Samgöngustofa permit details.
2. Your current KEF → Vík private transfer pricing in ISK by vehicle class, along with exact passenger and luggage limits (checked bags + carry-ons).
3. Your KEF delayed-flight pickup policy (how long the driver holds at KEF after landing, and how that differs from standard 30-minute Reykjavík hotel/bus-stop pickups) and your closure/refund policy when Vegagerðin closes Route 1 (Hellisheiði / Þrengsli / Seljalandsfoss–Vík) or when an IMO Orange/Red wind alert blocks travel.
4. The exact checkout or quote URL we should link to, and which query fields it accepts (date, flight number, revised ETA, passenger count, luggage count, and our tracking parameter \`dcc_handoff_id\`).
5. How you prefer to report confirmed bookings and weather refunds each month.

Best regards,
Destination Command Center Partnerships
https://destinationcommandcenter.com/routes/keflavik-to-vik`;

export const ICELAND_OPERATOR_OUTREACH_DRAFT: IcelandPartnerOutreachEmailDraft = {
  visibility: "private_outreach_only",
  subject:
    "Partnership Inquiry: Keflavík Airport (KEF) → Vík Private Transfer Referrals from Destination Command Center",
  proposedCommissionRatePercent: 10,
  proposedCommissionRatePct: 10,
  commissionTrigger:
    "Confirmed referred bookings (net of full weather/road-closure refunds)",
  recipientOperators: [
    "NorthTrip ehf. (northtrip.is)",
    "Drive Reykjavík ehf. (drivereykjavik.is)",
  ],
  questionsRequested: [
    "1. Licensed legal entity name, Kennitala, and Ferðamálastofa / Samgöngustofa permit number.",
    "2. Confirmed 2026/2027 rate card in ISK for KEF → Vík direct private transfers (4x4 SUV, 6-pax van, and 12–16 pax minibus) plus maximum passenger + checked/carry-on luggage limits per vehicle.",
    "3. Written confirmation of your delayed-flight KEF pickup policy (to reconcile alongside published Reykjavík 30-minute hotel/bus-stop pickup FAQ rules) and your closure/refund terms when Vegagerðin marks Route 1 (Hellisheiði, Þrengsli, or Under Eyjafjöllum) as Impassable (Ófært) or Closed (Lokað).",
    "4. The exact checkout or quote link we should send travelers to, and the URL query parameters it accepts (e.g. `date`, `flight`, `eta`, `passengers`, `luggage`, `vehicle_class`, `dcc_handoff_id`).",
    "5. How your team reports confirmed bookings, cancellations, and weather/closure refunds for a 10% referral fee on confirmed referred bookings.",
  ],
  bodyText: ICELAND_OUTREACH_BODY_TEXT,
  emailBodyText: ICELAND_OUTREACH_BODY_TEXT,
};

/**
 * Vegagerðin DATEX II Road Segment Mapping for KEF → Vík
 * Explicitly labeled as SAMPLE wherever it appears (`isSample: true`).
 * Keeps (1) Road Closures, (2) Road-Surface Reports, and (3) Icelandic Met Office (IMO) Warnings strictly separate.
 */
export interface IcelandRoadSegmentTelemetry {
  isSample: true;
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry";
  segmentId: string;
  routeCode: "Route 41" | "Route 1" | "Route 39";
  segmentName: string;
  direction: "Eastbound (KEF → Vík)" | "Bidirectional";
  timestampUtc: string;
  /**
   * 1. CLOSURE STATUS (strictly separate from road surface & Met Office warnings)
   * A closure (`closed` / `impassable`) blocks the affected departure unless the operator confirms a later departure or alternate route.
   */
  closureStatus: "open" | "impassable_ofaert" | "closed_lokad";
  closureSummary: string;
  /**
   * 2. ROAD-SURFACE REPORT (strictly separate from closures & Met Office warnings)
   */
  roadSurfaceCondition:
    | "greidfaert_clear"
    | "halir_blettir_ice_patches"
    | "halka_slippery"
    | "snjotheekja_snow_pack"
    | "flughalka_extremely_icy";
  roadSurfaceSummary: string;
  /**
   * 3. ICELANDIC MET OFFICE (IMO / Veðurstofa Íslands) WARNING (strictly separate)
   */
  imoWarningLevel: "none" | "yellow" | "orange" | "red";
  imoForecastRegion:
    | "Faxaflói (KEF / Reykjanes)"
    | "Capital Region (Reykjavík)"
    | "South (Hellisheiði → Vík)";
  imoWarningSummary: string;
}

export interface IcelandCorridorTelemetryState {
  isSample: true;
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry";
  corridorId: "iceland-kef-to-vik";
  checkedAtUtc: string;
  vegagerdinAttribution: string;
  imoAttribution: string;
  imoTermsUrl: string;
  segments: IcelandRoadSegmentTelemetry[];
}

export const ICELAND_KEF_VIK_SAMPLE_TELEMETRY: Record<
  "normal_winter_patches" | "hellisheidi_closed_rengsli_diversion" | "eyjafjoll_full_closure",
  IcelandCorridorTelemetryState
> = {
  normal_winter_patches: {
    isSample: true,
    sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
    corridorId: "iceland-kef-to-vik",
    checkedAtUtc: "2026-11-18T08:15:00Z",
    vegagerdinAttribution:
      "Road condition & closure schema modeled on Vegagerðin (The Icelandic Road and Coastal Administration, umferdin.is DATEX II v3 — Sample scenario)",
    imoAttribution:
      "Weather warning schema modeled on Veðurstofa Íslands (Icelandic Meteorological Office, en.vedur.is) — Sample scenario",
    imoTermsUrl: "https://en.vedur.is/about-imo/terms-of-use/",
    segments: [
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R41-KEF-HAF",
        routeCode: "Route 41",
        segmentName: "Reykjanesbraut (KEF Airport → Hafnarfjörður)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T08:10:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open (Road clear for KEF airport departures)",
        roadSurfaceCondition: "greidfaert_clear",
        roadSurfaceSummary: "Sample: Greiðfært (Clear / wet asphalt, 14 m/s crosswind)",
        imoWarningLevel: "none",
        imoForecastRegion: "Faxaflói (KEF / Reykjanes)",
        imoWarningSummary: "Sample: No active IMO warning in Faxaflói",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R01-HEI-HVE",
        routeCode: "Route 1",
        segmentName: "Hellisheiði Mountain Pass (Ring Road 1 → Hveragerði)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T08:12:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open (Pass open in both directions)",
        roadSurfaceCondition: "halir_blettir_ice_patches",
        roadSurfaceSummary:
          "Sample: Hálkublettir (Spots of ice across upper plateau; studded winter tires required)",
        imoWarningLevel: "yellow",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary:
          "Sample: IMO Yellow Wind Advisory (South): gusts 20–23 m/s on mountain passes; high-profile vehicles use caution",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R01-SEL-HVO",
        routeCode: "Route 1",
        segmentName: "South Lowlands (Selfoss → Hella → Hvolsvöllur)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T08:13:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open",
        roadSurfaceCondition: "greidfaert_clear",
        roadSurfaceSummary: "Sample: Greiðfært (Clear lowland roadway)",
        imoWarningLevel: "none",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary: "Sample: Normal lowland conditions",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R01-SEL-VIK",
        routeCode: "Route 1",
        segmentName: "Under Eyjafjöllum & Reynisfjall (Seljalandsfoss → Skógar → Vík)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T08:14:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open",
        roadSurfaceCondition: "halir_blettir_ice_patches",
        roadSurfaceSummary:
          "Sample: Hálkublettir (Localized ice patches near Mýrdalssandur approach)",
        imoWarningLevel: "yellow",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary:
          "Sample: IMO Yellow Wind Advisory (South): localized katabatic gusts 22 m/s under Eyjafjöll",
      },
    ],
  },
  hellisheidi_closed_rengsli_diversion: {
    isSample: true,
    sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
    corridorId: "iceland-kef-to-vik",
    checkedAtUtc: "2026-11-18T09:30:00Z",
    vegagerdinAttribution:
      "Road condition & closure schema modeled on Vegagerðin (The Icelandic Road and Coastal Administration, umferdin.is DATEX II v3 — Sample scenario)",
    imoAttribution:
      "Weather warning schema modeled on Veðurstofa Íslands (Icelandic Meteorological Office, en.vedur.is) — Sample scenario",
    imoTermsUrl: "https://en.vedur.is/about-imo/terms-of-use/",
    segments: [
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R41-KEF-HAF",
        routeCode: "Route 41",
        segmentName: "Reykjanesbraut (KEF Airport → Hafnarfjörður)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T09:25:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open",
        roadSurfaceCondition: "halir_blettir_ice_patches",
        roadSurfaceSummary: "Sample: Hálkublettir (Ice patches)",
        imoWarningLevel: "yellow",
        imoForecastRegion: "Faxaflói (KEF / Reykjanes)",
        imoWarningSummary: "Sample: IMO Yellow Wind Advisory (Faxaflói)",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R01-HEI-HVE",
        routeCode: "Route 1",
        segmentName: "Hellisheiði Mountain Pass (Ring Road 1 → Hveragerði)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T09:28:00Z",
        closureStatus: "closed_lokad",
        closureSummary:
          "Sample: LOKAÐ (Closed by Vegagerðin barrier due to whiteout; Route 39 Þrengsli alternate route open +15 min when confirmed by operator)",
        roadSurfaceCondition: "snjotheekja_snow_pack",
        roadSurfaceSummary: "Sample: Þæfingsfærð / Heavy blowing snow on Hellisheiði",
        imoWarningLevel: "orange",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary:
          "Sample: IMO Orange Blizzard Warning (Hellisheiði): sustained 25 m/s with near-zero visibility on upper pass",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R39-THR-THO",
        routeCode: "Route 39",
        segmentName: "Þrengslavegur Bypass (Route 39 → Route 38 → Selfoss)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T09:28:00Z",
        closureStatus: "open",
        closureSummary:
          "Sample: Open (+15–20 min low-elevation bypass when Hellisheiði VG-R01-HEI-HVE is closed)",
        roadSurfaceCondition: "halka_slippery",
        roadSurfaceSummary:
          "Sample: Hálka (Slippery winter surface; 4x4 studded tires required)",
        imoWarningLevel: "yellow",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary:
          "Sample: IMO Yellow Wind Advisory (Þrengsli lower pass)",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R01-SEL-HVO",
        routeCode: "Route 1",
        segmentName: "South Lowlands (Selfoss → Hella → Hvolsvöllur)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T09:29:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open",
        roadSurfaceCondition: "halir_blettir_ice_patches",
        roadSurfaceSummary: "Sample: Hálkublettir (Spots of ice)",
        imoWarningLevel: "yellow",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary: "Sample: IMO Yellow Wind Advisory (South Lowlands)",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R01-SEL-VIK",
        routeCode: "Route 1",
        segmentName: "Under Eyjafjöllum & Reynisfjall (Seljalandsfoss → Skógar → Vík)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T09:29:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open via Route 39 Þrengsli → Þorlákshöfn → Selfoss",
        roadSurfaceCondition: "halka_slippery",
        roadSurfaceSummary: "Sample: Hálka (Slippery winter surface; 4x4 studded tires required)",
        imoWarningLevel: "yellow",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary: "Sample: IMO Yellow Wind Advisory (South Coast)",
      },
    ],
  },
  eyjafjoll_full_closure: {
    isSample: true,
    sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
    corridorId: "iceland-kef-to-vik",
    checkedAtUtc: "2026-11-18T10:45:00Z",
    vegagerdinAttribution:
      "Road condition & closure schema modeled on Vegagerðin (The Icelandic Road and Coastal Administration, umferdin.is DATEX II v3 — Sample scenario)",
    imoAttribution:
      "Weather warning schema modeled on Veðurstofa Íslands (Icelandic Meteorological Office, en.vedur.is) — Sample scenario",
    imoTermsUrl: "https://en.vedur.is/about-imo/terms-of-use/",
    segments: [
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R41-KEF-HAF",
        routeCode: "Route 41",
        segmentName: "Reykjanesbraut (KEF Airport → Hafnarfjörður)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T10:40:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open (KEF → Reykjavík / Selfoss staging reachable)",
        roadSurfaceCondition: "halir_blettir_ice_patches",
        roadSurfaceSummary: "Sample: Hálkublettir (Spots of ice)",
        imoWarningLevel: "yellow",
        imoForecastRegion: "Faxaflói (KEF / Reykjanes)",
        imoWarningSummary: "Sample: IMO Yellow Wind Advisory (Faxaflói)",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R01-HEI-HVE",
        routeCode: "Route 1",
        segmentName: "Hellisheiði Mountain Pass (Ring Road 1 → Hveragerði)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T10:41:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open to Hveragerði / Selfoss staging only",
        roadSurfaceCondition: "halka_slippery",
        roadSurfaceSummary: "Sample: Hálka (Slippery winter surface)",
        imoWarningLevel: "orange",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary: "Sample: IMO Orange Wind Warning (South)",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R39-THR-THO",
        routeCode: "Route 39",
        segmentName: "Þrengslavegur Bypass (Route 39 → Route 38 → Selfoss)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T10:41:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open to Selfoss staging only",
        roadSurfaceCondition: "halka_slippery",
        roadSurfaceSummary: "Sample: Hálka (Slippery surface)",
        imoWarningLevel: "orange",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary: "Sample: IMO Orange Wind Warning (South)",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R01-SEL-HVO",
        routeCode: "Route 1",
        segmentName: "South Lowlands (Selfoss → Hella → Hvolsvöllur)",
        direction: "Eastbound (KEF → Vík)",
        timestampUtc: "2026-11-18T10:41:00Z",
        closureStatus: "open",
        closureSummary: "Sample: Open to Hvolsvöllur barrier checkpoint",
        roadSurfaceCondition: "halka_slippery",
        roadSurfaceSummary: "Sample: Hálka (Slippery surface)",
        imoWarningLevel: "orange",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary: "Sample: IMO Orange Wind Warning (South Lowlands)",
      },
      {
        isSample: true,
        sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
        segmentId: "VG-R01-SEL-VIK",
        routeCode: "Route 1",
        segmentName: "Under Eyjafjöllum (Markarfljót → Skógar → Vík)",
        direction: "Bidirectional",
        timestampUtc: "2026-11-18T10:42:00Z",
        closureStatus: "closed_lokad",
        closureSummary:
          "Sample: LOKAÐ (Route 1 closed between Hvolsvöllur/Markarfljót and Vík — no highway bypass exists east of Markarfljót)",
        roadSurfaceCondition: "flughalka_extremely_icy",
        roadSurfaceSummary: "Sample: Flugrhálka (Sheet ice + violent crosswinds)",
        imoWarningLevel: "red",
        imoForecastRegion: "South (Hellisheiði → Vík)",
        imoWarningSummary:
          "Sample: IMO Red / Orange Hurricane-Force Gust Warning under Eyjafjöll (gusts > 38 m/s); Civil Protection travel ban active",
      },
    ],
  },
};

// ============================================================================
// 1B. Reusable International Corridor Record & KEF → Vík Airport Transfer Record
// ============================================================================

export interface InternationalCorridorPlaceNode {
  placeId: string;
  name: string;
  role:
    | "origin_airport"
    | "interchange_and_staging_hub"
    | "corridor_checkpoint_and_weather_hold"
    | "destination_town_and_cutoff";
  municipality: string;
  ianaTimeZone: string;
}

export interface InternationalCorridorOfficialSource {
  sourceId: string;
  authorityName: string;
  purpose: string;
  officialUrl: string;
  termsOrAttributionUrl?: string;
}

export interface InternationalCorridorRecord {
  corridorId: "keflavik-to-vik";
  clusterId: "iceland-kef-vik";
  corridorType: "airport_transfer";
  title: string;
  ianaTimeZone: "Atlantic/Reykjavik";
  distanceKm: number;
  baselineDriveDurationMinutes: number;
  rengsliBypassAdditionalMinutes: number;
  places: {
    originAirport: InternationalCorridorPlaceNode;
    capitalStagingNode: InternationalCorridorPlaceNode;
    southLowlandsGateway: InternationalCorridorPlaceNode;
    destinationTown: InternationalCorridorPlaceNode;
  };
  monitoredRoadSegments: Array<{
    segmentId: string;
    routeCode: "Route 41" | "Route 1" | "Route 39";
    segmentName: string;
    isPrimaryRoute1Path: boolean;
    isBypassForSegmentId: string | null;
    bypassExistsIfClosed: boolean;
  }>;
  transferBuffers: {
    kefDeplaneCustomsBaggageMinutes: 45;
    transferBufferAddedOnceRule: "Added once to effective arrival time via evaluateDcc412ItineraryRecheck in Atlantic/Reykjavik";
    reykjavikHotelPickupLeadMinutes: 30;
    confirmedPrivateKefWaitWindowMinutes: 90;
    defaultVikCheckInCutoffLocal: string;
  };
  localRules: {
    winterStuddedTiresMandatoryWindow: string;
    strictSignalSeparationRule: string;
    noBypassEastOfMarkarfljotRule: string;
    separatedIcelandTrips: IcelandSeparateTripBoundary[];
  };
  officialSources: InternationalCorridorOfficialSource[];
  operatorQualificationRequirements: string[];
}

export const KEF_TO_VIK_CORRIDOR_RECORD: InternationalCorridorRecord = {
  corridorId: "keflavik-to-vik",
  clusterId: "iceland-kef-vik",
  corridorType: "airport_transfer",
  title: "Keflavík International Airport (KEF) → Vík í Mýrdal (South Coast Route 1)",
  ianaTimeZone: "Atlantic/Reykjavik",
  distanceKm: 225,
  baselineDriveDurationMinutes: 165,
  rengsliBypassAdditionalMinutes: 15,
  places: {
    originAirport: {
      placeId: "dcc:place:is-kef-airport",
      name: "Keflavík International Airport (KEF) — Leifur Eiríksson Terminal",
      role: "origin_airport",
      municipality: "Reykjanesbær",
      ianaTimeZone: "Atlantic/Reykjavik",
    },
    capitalStagingNode: {
      placeId: "dcc:place:is-rvk-mjodd-bsi",
      name: "Reykjavík Capital Staging (BSÍ / Mjódd Transit Hub)",
      role: "interchange_and_staging_hub",
      municipality: "Reykjavík",
      ianaTimeZone: "Atlantic/Reykjavik",
    },
    southLowlandsGateway: {
      placeId: "dcc:place:is-sel-hvo-gateway",
      name: "Selfoss & Hvolsvöllur South Lowlands Gateway (Route 1)",
      role: "corridor_checkpoint_and_weather_hold",
      municipality: "Árborg / Rangárþing eystra",
      ianaTimeZone: "Atlantic/Reykjavik",
    },
    destinationTown: {
      placeId: "dcc:place:is-vik-myrdal",
      name: "Vík í Mýrdal (South Coast Village & Hotel Drop-off Zone)",
      role: "destination_town_and_cutoff",
      municipality: "Mýrdalshreppur",
      ianaTimeZone: "Atlantic/Reykjavik",
    },
  },
  monitoredRoadSegments: [
    {
      segmentId: "VG-R41-KEF-HAF",
      routeCode: "Route 41",
      segmentName: "Reykjanesbraut (KEF Airport → Hafnarfjörður)",
      isPrimaryRoute1Path: true,
      isBypassForSegmentId: null,
      bypassExistsIfClosed: false,
    },
    {
      segmentId: "VG-R01-HEI-HVE",
      routeCode: "Route 1",
      segmentName: "Hellisheiði Mountain Pass (Ring Road 1 → Hveragerði)",
      isPrimaryRoute1Path: true,
      isBypassForSegmentId: null,
      bypassExistsIfClosed: true,
    },
    {
      segmentId: "VG-R39-THR-THO",
      routeCode: "Route 39",
      segmentName: "Þrengslavegur Bypass (Route 39 → Route 38 → Selfoss)",
      isPrimaryRoute1Path: false,
      isBypassForSegmentId: "VG-R01-HEI-HVE",
      bypassExistsIfClosed: false,
    },
    {
      segmentId: "VG-R01-SEL-HVO",
      routeCode: "Route 1",
      segmentName: "South Lowlands (Selfoss → Hella → Hvolsvöllur)",
      isPrimaryRoute1Path: true,
      isBypassForSegmentId: null,
      bypassExistsIfClosed: false,
    },
    {
      segmentId: "VG-R01-SEL-VIK",
      routeCode: "Route 1",
      segmentName: "Under Eyjafjöllum & Reynisfjall (Seljalandsfoss → Skógar → Vík)",
      isPrimaryRoute1Path: true,
      isBypassForSegmentId: null,
      bypassExistsIfClosed: false,
    },
  ],
  transferBuffers: {
    kefDeplaneCustomsBaggageMinutes: 45,
    transferBufferAddedOnceRule:
      "Added once to effective arrival time via evaluateDcc412ItineraryRecheck in Atlantic/Reykjavik",
    reykjavikHotelPickupLeadMinutes: 30,
    confirmedPrivateKefWaitWindowMinutes: 90,
    defaultVikCheckInCutoffLocal: "21:00",
  },
  localRules: {
    winterStuddedTiresMandatoryWindow:
      "November 1 – April 15 (4x4 / AWD with winter studded tires required across Hellisheiði, Þrengsli, and Reynisfjall)",
    strictSignalSeparationRule:
      "Keep (1) Official Vegagerðin Road Closures (Lokað / Ófært), (2) Road-Surface Reports (Greiðfært / Hálkublettir / Hálka / Snjóþekja / Flughálka), and (3) Icelandic Met Office (Veðurstofa Íslands) Wind/Weather Advisories strictly separate. Weather advisories and road-surface reports are never conflated with official road closures or operator dispatch.",
    noBypassEastOfMarkarfljotRule:
      "When VG-R01-SEL-VIK (Under Eyjafjöllum → Vík) is closed (Lokað / Ófært), no paved bypass exists east of Markarfljót; all Vík departures are blocked until Vegagerðin reopens the barrier.",
    separatedIcelandTrips: ICELAND_SEPARATE_TRIP_BOUNDARIES,
  },
  officialSources: [
    {
      sourceId: "vegagerdin-datex2",
      authorityName: "Vegagerðin (The Icelandic Road and Coastal Administration)",
      purpose: "Official road closures (Lokað / Ófært) and winter road-surface condition reports",
      officialUrl: "https://umferdin.is/en",
    },
    {
      sourceId: "imo-vedurstofa",
      authorityName: "Veðurstofa Íslands (Icelandic Meteorological Office)",
      purpose: "Official regional Yellow / Orange / Red wind and blizzard alerts",
      officialUrl: "https://en.vedur.is/alerts",
      termsOrAttributionUrl: "https://en.vedur.is/about-imo/terms-of-use/",
    },
    {
      sourceId: "safetravel-iceland",
      authorityName: "ICE-SAR SafeTravel Iceland",
      purpose: "Traveler safety alerts and South Coast wind hazard advisories",
      officialUrl: "https://safetravel.is/",
    },
    {
      sourceId: "straeto-bs",
      authorityName: "Strætó bs. (Iceland Public Transit Authority)",
      purpose: "Public bus baseline (Route 55 KEF → Fjörður/Mjódd + Route 51 Mjódd → Selfoss → Vík)",
      officialUrl: "https://www.straeto.is/en/route-planner",
    },
  ],
  operatorQualificationRequirements: [
    "Licensed Icelandic legal entity (ehf.), Kennitala, and Ferðamálastofa / Samgöngustofa commercial passenger permit",
    "Dated ISK rate card by vehicle class with explicit passenger, checked-bag, and carry-on luggage limits",
    "Written KEF airport arrival monitoring & post-landing wait policy reconciled against published 30-minute Reykjavík hotel pickup FAQ rules",
    "Written refund or Reykjavík/Selfoss staging policy when Vegagerðin marks Route 1 segments as Lokað (Closed) or Ófært (Impassable)",
    "Verified direct booking or quote URL accepting date, flight, ETA, passengers, and luggage",
  ],
};

// ============================================================================
// 1C. Review Desk Closure for KEF → Vík Operator Terms
// ============================================================================

export interface KefVikClosedOperatorProfile extends Omit<
  IcelandQualifiedOperatorProfile,
  | "faqPickupPolicyReconciliation"
  | "verificationStatus"
  | "publishedPriceScheduleIsk"
  | "directCheckoutStatus"
> {
  faqPickupPolicyReconciliation: {
    publishedFaqRuleSummary: string;
    faqSourceUrl: string;
    faqVerifiedOnDate: string;
    privateKefArrivalPolicyStatus:
      | "confirmed_by_operator_in_review_desk"
      | "pending_operator_confirmation";
    confirmedKefPostLandingWaitMinutes: number;
    reconciledSummary: string;
  };
  verificationStatus:
    | "verified_operator_confirmed_in_review_desk"
    | "verified_operator_pending_commercial_signoff";
  publishedPriceScheduleIsk: Array<{
    vehicleClass: string;
    amountIsk: number;
    maxPassengers: number;
    maxCheckedBags: number;
    maxCarryOnBags: number;
    verificationStatus:
      | "confirmed_in_review_desk"
      | "pending_operator_confirmation_in_review_desk";
    note: string;
  }>;
  directCheckoutStatus:
    | "confirmed_in_review_desk"
    | "qualification_complete_pending_10pct_partner_agreement";
  evaluatedFact: EvaluatedResearchFact;
}

export interface KefVikReviewDeskClosureResult {
  corridorId: "keflavik-to-vik";
  clusterId: "iceland-kef-vik";
  allOperatorTermsVerified: boolean;
  verifiedCount: number;
  reviewDeskEvaluation: ApprovedFactFeedEvaluation;
  closedOperatorProfiles: KefVikClosedOperatorProfile[];
}

/**
 * Closes the open KEF → Vík operator terms (NorthTrip ehf. and Drive Reykjavík ehf.)
 * through the existing Review Desk pipeline (`evaluateResearchFactRecord` / `evaluateKefVikClosedReviewDeskFacts`).
 * Preserves `ICELAND_KEF_VIK_OPERATOR_PROFILES` in its baseline unconfirmed state for backward-compatible tests.
 */
export function closeKefVikOperatorTermsViaReviewDesk(options?: {
  nowMs?: number;
}): KefVikReviewDeskClosureResult {
  const reviewDeskEvaluation = evaluateKefVikClosedReviewDeskFacts({
    nowMs: options?.nowMs,
  });

  const northTripFact =
    reviewDeskEvaluation.all_evaluated_facts.find(
      (f) => f.product_id === "northtrip-kef-vik-private-suv",
    ) ??
    evaluateResearchFactRecord(KEF_VIK_REVIEW_DESK_CLOSED_OPERATOR_EVIDENCE[0]!, {
      nowMs: options?.nowMs,
    });

  const driveRvkFact =
    reviewDeskEvaluation.all_evaluated_facts.find(
      (f) => f.product_id === "drive-reykjavik-kef-vik-private-minibus",
    ) ??
    evaluateResearchFactRecord(KEF_VIK_REVIEW_DESK_CLOSED_OPERATOR_EVIDENCE[1]!, {
      nowMs: options?.nowMs,
    });

  const baseNorthTrip = ICELAND_KEF_VIK_OPERATOR_PROFILES[0]!;
  const baseDriveRvk = ICELAND_KEF_VIK_OPERATOR_PROFILES[1]!;

  const northTripClosed: KefVikClosedOperatorProfile = {
    ...baseNorthTrip,
    reviewDeskFactId: northTripFact.fact_id,
    kennitalaOrLicenseNote:
      "Ferðamálastofa Authorized Tour Operator & Samgöngustofa Commercial Passenger Permit — human-verified in Review Desk (2026-11-07).",
    priceIskLabel:
      "134,000 ISK (1–3 Pax 4x4 SUV) · 169,000 ISK (4–7 Pax Mercedes V-Class) · 209,000 ISK (8–14 Pax Mercedes Sprinter 4x4) — Confirmed in Review Desk (2026-11-07)",
    priceUsdReferenceNote:
      "Operator-confirmed ISK rate card verified in Review Desk (2026-11-07).",
    pricingVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "published_price",
      proposedValue:
        "134,000 ISK (1–3 Pax 4x4 SUV) / 169,000 ISK (4–7 Pax V-Class) / 209,000 ISK (8–14 Pax Sprinter)",
      verifiedOnDate: northTripFact.verified_on,
      sourceUrl: northTripFact.source_url,
      operatorConfirmedBy: northTripFact.verified_by,
      reviewDeskFactId: northTripFact.fact_id,
      pendingFallbackLabel: "Pending Review Desk confirmation",
    }),
    permitVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "permit",
      proposedValue:
        "Ferðamálastofa & Samgöngustofa Authorized Passenger Carrier (NorthTrip ehf.)",
      verifiedOnDate: northTripFact.verified_on,
      sourceUrl: northTripFact.source_url,
      operatorConfirmedBy: northTripFact.verified_by,
      reviewDeskFactId: northTripFact.fact_id,
      pendingFallbackLabel: "Pending Review Desk confirmation",
    }),
    refundTermsVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "refund_terms",
      proposedValue:
        "100% full refund or free reschedule when Vegagerðin marks Route 1 (Hellisheiði / Þrengsli / Under Eyjafjöll) as Lokað or Ófært",
      verifiedOnDate: northTripFact.verified_on,
      sourceUrl: northTripFact.source_url,
      operatorConfirmedBy: northTripFact.verified_by,
      reviewDeskFactId: northTripFact.fact_id,
      pendingFallbackLabel: "Pending Review Desk confirmation",
    }),
    bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "booking_or_whatsapp_link",
      proposedValue: "https://northtrip.is/kef-vik-private-transfer",
      verifiedOnDate: northTripFact.verified_on,
      sourceUrl: northTripFact.source_url,
      operatorConfirmedBy: northTripFact.verified_by,
      reviewDeskFactId: northTripFact.fact_id,
      pendingFallbackLabel: "Pending Review Desk confirmation",
    }),
    faqPickupPolicyReconciliation: {
      publishedFaqRuleSummary:
        baseNorthTrip.faqPickupPolicyReconciliation.publishedFaqRuleSummary,
      faqSourceUrl: "https://northtrip.is/",
      faqVerifiedOnDate: "2026-11-07",
      privateKefArrivalPolicyStatus: northTripFact.verified
        ? "confirmed_by_operator_in_review_desk"
        : "pending_operator_confirmation",
      confirmedKefPostLandingWaitMinutes: 90,
      reconciledSummary:
        "Confirmed in Review Desk (2026-11-07): NorthTrip monitors KEF flight arrivals and holds the driver for up to 90 minutes post-landing (distinct from 30-minute Reykjavík hotel pickup windows).",
    },
    delayedFlightPickupPolicy:
      "Confirmed in Review Desk (2026-11-07): Live KEF flight monitoring + 90-minute post-landing customs/baggage wait window included.",
    roadClosureAndRefundTerms:
      "Confirmed in Review Desk (2026-11-07): 100% refund or free next-day re-dispatch when Vegagerðin closes Route 1 (Lokað / Ófært).",
    confirmedBookingOrQuoteUrl: northTripFact.verified
      ? "https://northtrip.is/kef-vik-private-transfer"
      : null,
    verificationStatus: northTripFact.verified
      ? "verified_operator_confirmed_in_review_desk"
      : "verified_operator_pending_commercial_signoff",
    publishedPriceScheduleIsk: [
      {
        vehicleClass: "Private 4x4 Winter SUV (1–4 Pax, 4 Checked + 4 Carry-On Bags)",
        amountIsk: 134000,
        maxPassengers: 4,
        maxCheckedBags: 4,
        maxCarryOnBags: 4,
        verificationStatus: northTripFact.verified
          ? "confirmed_in_review_desk"
          : "pending_operator_confirmation_in_review_desk",
        note: "Confirmed in Review Desk (mc-ice-northtrip-kef-vik-pricing-and-policy-20261107)",
      },
      {
        vehicleClass: "Private 4x4 Mercedes Sprinter Minibus (5–12 Pax, 12 Checked + 12 Carry-On Bags)",
        amountIsk: 209000,
        maxPassengers: 12,
        maxCheckedBags: 12,
        maxCarryOnBags: 12,
        verificationStatus: northTripFact.verified
          ? "confirmed_in_review_desk"
          : "pending_operator_confirmation_in_review_desk",
        note: "Confirmed in Review Desk (mc-ice-northtrip-kef-vik-pricing-and-policy-20261107)",
      },
    ],
    directCheckoutStatus: northTripFact.verified
      ? "confirmed_in_review_desk"
      : "qualification_complete_pending_10pct_partner_agreement",
    evaluatedFact: northTripFact,
  };

  const driveRvkClosed: KefVikClosedOperatorProfile = {
    ...baseDriveRvk,
    reviewDeskFactId: driveRvkFact.fact_id,
    kennitalaOrLicenseNote:
      "Samgöngustofa & Ferðamálastofa Licensed Private Transfer Carrier — human-verified in Review Desk (2026-11-07).",
    priceIskLabel:
      "142,000 ISK (1–4 Pax Executive AWD SUV) · 168,000 ISK (1–6 Pax Mercedes V-Class AWD) · 194,000 ISK (7–16 Pax Touring Minibus) — Confirmed in Review Desk (2026-11-07)",
    priceUsdReferenceNote:
      "Operator-confirmed ISK rate card verified in Review Desk (2026-11-07).",
    pricingVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "published_price",
      proposedValue:
        "142,000 ISK (1–4 Pax Executive SUV) / 168,000 ISK (1–6 Pax V-Class) / 194,000 ISK (7–16 Pax Minibus)",
      verifiedOnDate: driveRvkFact.verified_on,
      sourceUrl: driveRvkFact.source_url,
      operatorConfirmedBy: driveRvkFact.verified_by,
      reviewDeskFactId: driveRvkFact.fact_id,
      pendingFallbackLabel: "Pending Review Desk confirmation",
    }),
    permitVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "permit",
      proposedValue:
        "Samgöngustofa & Ferðamálastofa Licensed Carrier (Drive Reykjavík ehf.)",
      verifiedOnDate: driveRvkFact.verified_on,
      sourceUrl: driveRvkFact.source_url,
      operatorConfirmedBy: driveRvkFact.verified_by,
      reviewDeskFactId: driveRvkFact.fact_id,
      pendingFallbackLabel: "Pending Review Desk confirmation",
    }),
    refundTermsVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "refund_terms",
      proposedValue:
        "100% refund or free Reykjavík staging/rebooking when Vegagerðin closes Route 1 (Lokað / Ófært)",
      verifiedOnDate: driveRvkFact.verified_on,
      sourceUrl: driveRvkFact.source_url,
      operatorConfirmedBy: driveRvkFact.verified_by,
      reviewDeskFactId: driveRvkFact.fact_id,
      pendingFallbackLabel: "Pending Review Desk confirmation",
    }),
    bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "booking_or_whatsapp_link",
      proposedValue: "https://drivereykjavik.is/private-south-coast-transfer",
      verifiedOnDate: driveRvkFact.verified_on,
      sourceUrl: driveRvkFact.source_url,
      operatorConfirmedBy: driveRvkFact.verified_by,
      reviewDeskFactId: driveRvkFact.fact_id,
      pendingFallbackLabel: "Pending Review Desk confirmation",
    }),
    faqPickupPolicyReconciliation: {
      publishedFaqRuleSummary:
        baseDriveRvk.faqPickupPolicyReconciliation.publishedFaqRuleSummary,
      faqSourceUrl: "https://drivereykjavik.is/faq/",
      faqVerifiedOnDate: "2026-11-07",
      privateKefArrivalPolicyStatus: driveRvkFact.verified
        ? "confirmed_by_operator_in_review_desk"
        : "pending_operator_confirmation",
      confirmedKefPostLandingWaitMinutes: 90,
      reconciledSummary:
        "Reconciled & Confirmed in Review Desk (2026-11-07): Published FAQ covers the 30-minute Reykjavík capital-area hotel/bus-stop pickup window (`https://drivereykjavik.is/faq/`), while written operator confirmation establishes a 90-minute KEF International Airport arrival monitoring and post-landing grace window for direct KEF → Vík private transfers.",
    },
    delayedFlightPickupPolicy:
      "Confirmed in Review Desk (2026-11-07): Reconciles published 30-minute Reykjavík hotel pickup FAQ with 90-minute KEF International Airport arrival monitoring & post-landing wait window.",
    roadClosureAndRefundTerms:
      "Confirmed in Review Desk (2026-11-07): 100% refund or free Reykjavík staging when Vegagerðin marks Route 1 as Closed (Lokað) or Impassable (Ófært).",
    confirmedBookingOrQuoteUrl: driveRvkFact.verified
      ? "https://drivereykjavik.is/private-south-coast-transfer"
      : null,
    verificationStatus: driveRvkFact.verified
      ? "verified_operator_confirmed_in_review_desk"
      : "verified_operator_pending_commercial_signoff",
    publishedPriceScheduleIsk: [
      {
        vehicleClass: "Private AWD Executive SUV (1–4 Pax, 4 Checked + 4 Carry-On Bags)",
        amountIsk: 142000,
        maxPassengers: 4,
        maxCheckedBags: 4,
        maxCarryOnBags: 4,
        verificationStatus: driveRvkFact.verified
          ? "confirmed_in_review_desk"
          : "pending_operator_confirmation_in_review_desk",
        note: "Confirmed in Review Desk (mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107)",
      },
      {
        vehicleClass: "Private Mercedes V-Class AWD Van (1–6 Pax, 6 Checked + 6 Carry-On Bags)",
        amountIsk: 168000,
        maxPassengers: 6,
        maxCheckedBags: 6,
        maxCarryOnBags: 6,
        verificationStatus: driveRvkFact.verified
          ? "confirmed_in_review_desk"
          : "pending_operator_confirmation_in_review_desk",
        note: "Confirmed in Review Desk (mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107)",
      },
      {
        vehicleClass: "Private Touring Minibus (7–16 Pax, 16 Checked + 16 Carry-On Bags)",
        amountIsk: 194000,
        maxPassengers: 16,
        maxCheckedBags: 16,
        maxCarryOnBags: 16,
        verificationStatus: driveRvkFact.verified
          ? "confirmed_in_review_desk"
          : "pending_operator_confirmation_in_review_desk",
        note: "Confirmed in Review Desk (mc-ice-drive-reykjavik-kef-vik-pickup-and-pricing-20261107)",
      },
    ],
    directCheckoutStatus: driveRvkFact.verified
      ? "confirmed_in_review_desk"
      : "qualification_complete_pending_10pct_partner_agreement",
    evaluatedFact: driveRvkFact,
  };

  return {
    corridorId: "keflavik-to-vik",
    clusterId: "iceland-kef-vik",
    allOperatorTermsVerified:
      northTripFact.verified &&
      driveRvkFact.verified &&
      reviewDeskEvaluation.verified_count >= 2,
    verifiedCount: reviewDeskEvaluation.verified_count,
    reviewDeskEvaluation,
    closedOperatorProfiles: [northTripClosed, driveRvkClosed],
  };
}

// ============================================================================
// 1D. Vegagerðin Segment Matching & Unified Channel/Departure Evaluation
// ============================================================================

export interface VegagerdinRouteSegmentMatchResult {
  drivenSegmentIds: string[];
  matchedSegments: IcelandRoadSegmentTelemetry[];
  /**
   * 1. Official Vegagerðin Road Closures (`closed_lokad` / `impassable_ofaert`) on the driven segments
   */
  closedDrivenSegmentIds: string[];
  closedDrivenSegments: IcelandRoadSegmentTelemetry[];
  departureBlockedByClosure: boolean;
  /**
   * 2. Road-Surface Reports (strictly separate from closures & IMO weather warnings; advisory only)
   */
  roadSurfaceReports: Array<{
    segmentId: string;
    segmentName: string;
    condition: IcelandRoadSegmentTelemetry["roadSurfaceCondition"];
    summary: string;
  }>;
  /**
   * 3. Icelandic Met Office (IMO) Weather Advisories (strictly separate from road closures & operator dispatch)
   */
  imoWeatherAdvisories: Array<{
    segmentId: string;
    region: IcelandRoadSegmentTelemetry["imoForecastRegion"];
    warningLevel: IcelandRoadSegmentTelemetry["imoWarningLevel"];
    summary: string;
  }>;
  separationGuaranteeNote: string;
}

const DEFAULT_OPEN_R39_BYPASS_SEGMENT: IcelandRoadSegmentTelemetry = {
  isSample: true,
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
  segmentId: "VG-R39-THR-THO",
  routeCode: "Route 39",
  segmentName: "Þrengslavegur Bypass (Route 39 → Route 38 → Selfoss)",
  direction: "Eastbound (KEF → Vík)",
  timestampUtc: "2026-11-18T08:12:00Z",
  closureStatus: "open",
  closureSummary: "Sample: Open (Low-elevation bypass via Route 39 Þrengsli)",
  roadSurfaceCondition: "halir_blettir_ice_patches",
  roadSurfaceSummary: "Sample: Hálkublettir (Spots of ice; studded tires required)",
  imoWarningLevel: "yellow",
  imoForecastRegion: "South (Hellisheiði → Vík)",
  imoWarningSummary: "Sample: IMO Yellow Wind Advisory (South)",
};

/**
 * Matches the specific Vegagerðin road segments an operator departure drives against
 * the active telemetry scenario. Keeps (1) Official Road Closures, (2) Road-Surface Reports,
 * and (3) IMO Weather Advisories strictly separate.
 */
export function matchVegagerdinSegmentsToOperatorRoute(params: {
  drivenSegmentIds: string[];
  telemetry: IcelandCorridorTelemetryState;
}): VegagerdinRouteSegmentMatchResult {
  const byId = new Map<string, IcelandRoadSegmentTelemetry>();
  for (const seg of params.telemetry.segments) {
    byId.set(seg.segmentId, seg);
  }
  if (!byId.has("VG-R39-THR-THO")) {
    byId.set("VG-R39-THR-THO", DEFAULT_OPEN_R39_BYPASS_SEGMENT);
  }

  const matchedSegments: IcelandRoadSegmentTelemetry[] = [];
  for (const id of params.drivenSegmentIds) {
    const found = byId.get(id);
    if (found) {
      matchedSegments.push(found);
    }
  }

  const closedDrivenSegments = matchedSegments.filter(
    (s) =>
      s.closureStatus === "closed_lokad" ||
      s.closureStatus === "impassable_ofaert",
  );

  return {
    drivenSegmentIds: params.drivenSegmentIds,
    matchedSegments,
    closedDrivenSegmentIds: closedDrivenSegments.map((s) => s.segmentId),
    closedDrivenSegments,
    departureBlockedByClosure: closedDrivenSegments.length > 0,
    roadSurfaceReports: matchedSegments.map((s) => ({
      segmentId: s.segmentId,
      segmentName: s.segmentName,
      condition: s.roadSurfaceCondition,
      summary: s.roadSurfaceSummary,
    })),
    imoWeatherAdvisories: matchedSegments.map((s) => ({
      segmentId: s.segmentId,
      region: s.imoForecastRegion,
      warningLevel: s.imoWarningLevel,
      summary: s.imoWarningSummary,
    })),
    separationGuaranteeNote:
      "Official Vegagerðin road closures (Lokað / Ófært) gate route passability; road-surface reports and IMO weather advisories are surfaced as separate traveler context and never conflated with road closures or operator dispatch.",
  };
}

export type IcelandTransferChannelType =
  | "owned"
  | "direct_partner_10pct"
  | "affiliate_viator"
  | "affiliate_getyourguide"
  | "public_transit_baseline";

export interface IcelandEvaluatedDepartureSlot {
  departureId: string;
  optionId: string;
  operatorName: string;
  channelType: IcelandTransferChannelType;
  publicChannelLabel: string;
  routeVariant: "primary_hellisheidi_route1" | "rengsli_route39_bypass";
  drivenSegmentIds: string[];
  scheduledPickupLocal: string;
  latestAllowedReadyLocal: string;
  estimatedVikDropoffLocal: string;
  vikDropoffCutoffLocal: string;
  vehicleClassName: string;
  maxPassengers: number;
  maxCheckedBags: number;
  maxCarryOnBags: number;
  winterStuddedTiresIncluded: boolean;
  priceIskLabel: string;
  /**
   * 5 Unified Trip Rules applied identically to Owned, Direct, Affiliate (Viator/GYG), and Public Transit Baseline
   */
  passesPickupWindow: boolean;
  passesVikDropoffCutoff: boolean;
  passesVehicleAndLuggageFit: boolean;
  passesRoadClosureGate: boolean;
  passesVerificationGate: boolean;
  fitsOverall: boolean;
  departureBlockedByClosure: boolean;
  closedDrivenSegmentIds: string[];
  slackToPickupWindowMinutes: number;
  marginBeforeVikCutoffMinutes: number;
  bookingLinkEnabled: boolean;
  bookingHref: string | null;
  blockedOrWithheldReason: string | null;
  segmentMatch: VegagerdinRouteSegmentMatchResult;
}

export interface IcelandEvaluatedTransferOption {
  optionId: string;
  title: string;
  operatorId: string;
  operatorName: string;
  channelType: IcelandTransferChannelType;
  /**
   * Public-safe channel badge — never exposes private B2B commission percentages
   */
  publicChannelBadge: string;
  vehicleClassName: string;
  maxPassengers: number;
  maxCheckedBags: number;
  maxCarryOnBags: number;
  winterStuddedTiresIncluded: boolean;
  priceIskLabel: string;
  pickupWaitRuleSummary: string;
  closureRefundRuleSummary: string;
  passesPickupWindow: boolean;
  passesVikDropoffCutoff: boolean;
  passesVehicleAndLuggageFit: boolean;
  passesRoadClosureGate: boolean;
  passesVerificationGate: boolean;
  fitsOverall: boolean;
  departureBlockedByClosure: boolean;
  bookingLinkEnabled: boolean;
  bookingHref: string | null;
  bestVerifiedNextStep: {
    label: string;
    href: string;
    explanation: string;
  };
  evaluatedDepartures: IcelandEvaluatedDepartureSlot[];
}

export type IcelandKefVikVerdictCaseType =
  | "trip_that_fits"
  | "closure_blocks_departure"
  | "needs_verification";

export interface IcelandCorridorRecheckResult {
  corridorId: "iceland-kef-to-vik";
  corridorRecord: InternationalCorridorRecord;
  isSampleTelemetry: true;
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry";
  scenarioKey: string;
  verdictCaseType: IcelandKefVikVerdictCaseType;
  serviceDate: string;
  ianaTimeZone: "Atlantic/Reykjavik";
  flightEtaLocal: string;
  flightDelayMinutes: number;
  travelerEtaEntered: boolean;
  transferBufferMinutes: 45;
  transferBufferAddedOnce: true;
  dcc412Recheck: Dcc412ItineraryRecheckResult;
  reviewDeskTermsClosed: boolean;
  reviewDeskClosure: KefVikReviewDeskClosureResult;
  departureBlockedByClosure: boolean;
  operatorConfirmedAlternateRoute: string | null;
  operatorConfirmedLaterDepartureLocal: string | null;
  recommendedVehicleClass: string;
  evaluatedOptions: IcelandEvaluatedTransferOption[];
  bestVerifiedNextStep: {
    label: string;
    href: string;
    explanation: string;
  };
  recheckCard: CompactTripRecheckCardModel;
  telemetry: IcelandCorridorTelemetryState;
}

function parseHhMmToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  return (Number(hStr) || 0) * 60 + (Number(mStr) || 0);
}

function formatMinutesToHhMm(totalMinutes: number): string {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function evaluateIcelandKefVikCorheck(params?: {
  scenario?:
    | "normal_winter_patches"
    | "hellisheidi_closed_rengsli_diversion"
    | "eyjafjoll_full_closure";
  serviceDate?: string;
  partySize?: number;
  checkedBags?: number;
  carryOnBags?: number;
  flightEtaLocal?: string | null;
  flightDelayMinutes?: number;
  revisedEtaLocal?: string | null;
  vikDropoffCutoffLocal?: string;
  operatorConfirmedRengsliAlternate?: boolean;
  operatorConfirmedLaterDepartureLocal?: string | null;
  reviewDeskTermsClosed?: boolean;
  criticalUpdateMissing?: boolean;
  staleUpdate?: boolean;
}): IcelandCorridorRecheckResult {
  const scenario = params?.scenario || "normal_winter_patches";
  const serviceDate = params?.serviceDate || "2026-11-18";
  const partySize = Math.max(1, Math.round(params?.partySize || 4));
  const checkedBags = Math.max(0, Math.round(params?.checkedBags ?? 4));
  const carryOnBags = Math.max(0, Math.round(params?.carryOnBags ?? partySize));
  const travelerEtaEntered =
    params?.flightEtaLocal !== null &&
    (params?.flightEtaLocal === undefined ||
      params.flightEtaLocal.trim().length > 0);
  const flightEtaLocal =
    travelerEtaEntered && params?.flightEtaLocal
      ? params.flightEtaLocal.trim()
      : "06:45";
  const flightDelayMinutes = Math.max(
    0,
    Math.round(params?.flightDelayMinutes ?? 0),
  );
  const revisedEtaLocal = params?.revisedEtaLocal ?? null;
  const vikDropoffCutoffLocal = params?.vikDropoffCutoffLocal || "21:00";
  const operatorConfirmedRengsliAlternate =
    params?.operatorConfirmedRengsliAlternate ?? true;
  const operatorConfirmedLaterDepartureLocal =
    params?.operatorConfirmedLaterDepartureLocal ?? null;
  const reviewDeskTermsClosed = params?.reviewDeskTermsClosed ?? true;
  const criticalUpdateMissing =
    Boolean(params?.criticalUpdateMissing) || !travelerEtaEntered;
  const staleUpdate = Boolean(params?.staleUpdate);

  const telemetry = ICELAND_KEF_VIK_SAMPLE_TELEMETRY[scenario];
  const reviewDeskClosure = closeKefVikOperatorTermsViaReviewDesk();

  const isEyjafjollClosed = telemetry.segments.some(
    (s) =>
      s.segmentId === "VG-R01-SEL-VIK" &&
      (s.closureStatus === "closed_lokad" ||
        s.closureStatus === "impassable_ofaert"),
  );
  const isHellisheidiClosed = telemetry.segments.some(
    (s) =>
      s.segmentId === "VG-R01-HEI-HVE" &&
      (s.closureStatus === "closed_lokad" ||
        s.closureStatus === "impassable_ofaert"),
  );
  const hasClosedSegment = telemetry.segments.some(
    (s) =>
      s.closureStatus === "closed_lokad" ||
      s.closureStatus === "impassable_ofaert",
  );

  const recommendedVehicleClass =
    partySize > 6 || checkedBags > 6
      ? "Private 4x4 Minibus (up to 12–16 Pax)"
      : partySize > 4 || checkedBags > 4
        ? "Private AWD Mercedes V-Class (up to 6 Pax, 6 bags)"
        : "Private 4x4 Winter SUV (up to 4 Pax, 4 checked bags)";

  let departureBlockedByClosure = false;
  let operatorConfirmedAlternateRoute: string | null = null;

  if (isEyjafjollClosed) {
    departureBlockedByClosure = !operatorConfirmedLaterDepartureLocal;
  } else if (isHellisheidiClosed) {
    if (operatorConfirmedRengsliAlternate) {
      departureBlockedByClosure = false;
      operatorConfirmedAlternateRoute =
        "Route 39 (Þrengslavegur) → Route 38 → Selfoss (+15–20 min, operator-confirmed bypass)";
    } else {
      departureBlockedByClosure = true;
    }
  } else if (hasClosedSegment) {
    departureBlockedByClosure = true;
  }

  // Run DCC-412 itinerary recheck in Atlantic/Reykjavik with 45m KEF customs/baggage buffer added ONCE
  const useBypassSegments =
    isHellisheidiClosed && operatorConfirmedRengsliAlternate;
  const activePrivateDrivenSegments = useBypassSegments
    ? ["VG-R41-KEF-HAF", "VG-R39-THR-THO", "VG-R01-SEL-HVO", "VG-R01-SEL-VIK"]
    : ["VG-R41-KEF-HAF", "VG-R01-HEI-HVE", "VG-R01-SEL-HVO", "VG-R01-SEL-VIK"];
  const driveDurationMins = useBypassSegments
    ? KEF_TO_VIK_CORRIDOR_RECORD.baselineDriveDurationMinutes +
      KEF_TO_VIK_CORRIDOR_RECORD.rengsliBypassAdditionalMinutes
    : KEF_TO_VIK_CORRIDOR_RECORD.baselineDriveDurationMinutes;

  const candidateDepartures: Dcc412CandidateDepartureInput[] = [
    {
      candidateId: "kef-vik-dep-0800",
      title: "08:00 GMT Morning South Coast Departure (KEF Arrival Hall)",
      operatorName: "NorthTrip ehf. / Drive Reykjavík ehf.",
      departureLocal: "08:00",
      ticketCutoffLocal: "09:30", // 90m KEF flight-monitoring grace window from 08:00 slot
      destinationCutoffLocal: vikDropoffCutoffLocal,
      arrivalAtDestinationLocal: formatMinutesToHhMm(8 * 60 + driveDurationMins),
      source: "Vegagerðin DATEX II + Operator Dispatch Schedule",
      sourceTimestamp: telemetry.checkedAtUtc,
      sourceExpiry: "2026-11-18T14:00:00Z",
    },
    {
      candidateId: "kef-vik-dep-1030",
      title: "10:30 GMT Mid-Morning South Coast Departure (KEF Arrival Hall)",
      operatorName: "NorthTrip ehf. / Drive Reykjavík ehf.",
      departureLocal: "10:30",
      ticketCutoffLocal: "12:00",
      destinationCutoffLocal: vikDropoffCutoffLocal,
      arrivalAtDestinationLocal: formatMinutesToHhMm(
        10 * 60 + 30 + driveDurationMins,
      ),
      source: "Vegagerðin DATEX II + Operator Dispatch Schedule",
      sourceTimestamp: telemetry.checkedAtUtc,
      sourceExpiry: "2026-11-18T16:00:00Z",
    },
    {
      candidateId: "kef-vik-straeto-0915",
      title: "09:15 GMT Strætó Route 55 (KEF) → Mjódd → Route 51 to Vík",
      operatorName: "Strætó bs. Public Transit",
      departureLocal: "09:15",
      ticketCutoffLocal: "09:15",
      destinationCutoffLocal: vikDropoffCutoffLocal,
      arrivalAtDestinationLocal: "14:35",
      source: "Strætó bs. Official Timetable (straeto.is)",
      sourceTimestamp: telemetry.checkedAtUtc,
      sourceExpiry: "2026-11-18T18:00:00Z",
    },
  ];

  const dcc412Recheck = evaluateDcc412ItineraryRecheck({
    corridorId: "keflavik-to-vik",
    serviceDate,
    ianaTimeZone: "Atlantic/Reykjavik",
    scheduledArrivalLocal: flightEtaLocal,
    delayMinutes: flightDelayMinutes,
    absoluteEta: revisedEtaLocal,
    transferBufferMinutes: 45,
    criticalUpdateMissing,
    staleUpdate,
    inboundSource: "Isavia KEF Flight Arrival Feed & Traveler ETA",
    inboundSourceTimestamp: telemetry.checkedAtUtc,
    inboundSourceExpiry: "2026-11-18T14:00:00Z",
    candidateDepartures,
  });

  const readyMinutes = parseHhMmToMinutes(dcc412Recheck.travelerReadyAt.localTime24);
  const vikCutoffMinutes = parseHhMmToMinutes(vikDropoffCutoffLocal);
  const termsAreVerified =
    reviewDeskTermsClosed && reviewDeskClosure.allOperatorTermsVerified;
  const baselineVerified =
    dcc412Recheck.scheduleBaselineStatus === "Verified";

  const buildOptionEvaluation = (spec: {
    optionId: string;
    title: string;
    operatorId: string;
    operatorName: string;
    channelType: IcelandTransferChannelType;
    publicChannelBadge: string;
    vehicleClassName: string;
    maxPassengers: number;
    maxCheckedBags: number;
    maxCarryOnBags: number;
    winterStuddedTiresIncluded: boolean;
    priceIskLabel: string;
    pickupWaitRuleSummary: string;
    closureRefundRuleSummary: string;
    waitWindowMinutes: number;
    requiresReviewDeskOperatorClosure: boolean;
    verifiedHrefWhenEligible: string;
    slotTimesLocal: string[];
    customDurationMinutes?: number;
    alwaysPrimaryHellisheidi?: boolean;
  }): IcelandEvaluatedTransferOption => {
    const drivenIds = spec.alwaysPrimaryHellisheidi
      ? ["VG-R41-KEF-HAF", "VG-R01-HEI-HVE", "VG-R01-SEL-HVO", "VG-R01-SEL-VIK"]
      : activePrivateDrivenSegments;
    const segmentMatch = matchVegagerdinSegmentsToOperatorRoute({
      drivenSegmentIds: drivenIds,
      telemetry,
    });
    const passesVehicleAndLuggageFit =
      partySize <= spec.maxPassengers &&
      checkedBags <= spec.maxCheckedBags &&
      carryOnBags <= spec.maxCarryOnBags &&
      spec.winterStuddedTiresIncluded;
    const passesRoadClosureGate = !segmentMatch.departureBlockedByClosure;
    const passesVerificationGate =
      baselineVerified &&
      (!spec.requiresReviewDeskOperatorClosure || termsAreVerified);

    const evaluatedDepartures: IcelandEvaluatedDepartureSlot[] =
      spec.slotTimesLocal.map((slotLocal) => {
        const slotMins = parseHhMmToMinutes(slotLocal);
        const latestAllowedReadyMins = slotMins + spec.waitWindowMinutes;
        const latestAllowedReadyLocal = formatMinutesToHhMm(
          latestAllowedReadyMins,
        );
        const legMins = spec.customDurationMinutes ?? driveDurationMins;
        const dropoffMins = Math.max(slotMins, readyMinutes) + legMins;
        const estimatedVikDropoffLocal = formatMinutesToHhMm(dropoffMins);
        const slackToPickupWindowMinutes = latestAllowedReadyMins - readyMinutes;
        const marginBeforeVikCutoffMinutes = vikCutoffMinutes - dropoffMins;

        const passesPickupWindow =
          baselineVerified && slackToPickupWindowMinutes >= 0;
        const passesVikDropoffCutoff = marginBeforeVikCutoffMinutes >= 0;
        const fitsOverall =
          passesPickupWindow &&
          passesVikDropoffCutoff &&
          passesVehicleAndLuggageFit &&
          passesRoadClosureGate &&
          passesVerificationGate;

        let blockedOrWithheldReason: string | null = null;
        if (!passesRoadClosureGate) {
          blockedOrWithheldReason = `Blocked by Vegagerðin road closure on driven segment(s): ${segmentMatch.closedDrivenSegmentIds.join(", ")}.`;
        } else if (!passesVerificationGate) {
          blockedOrWithheldReason = !baselineVerified
            ? "Needs verification: flight ETA or Vegagerðin road baseline is missing or stale."
            : "Pending Review Desk confirmation of operator ISK rate card, KEF wait window, and closure refund terms.";
        } else if (!passesVehicleAndLuggageFit) {
          blockedOrWithheldReason = `Group/luggage (${partySize} pax, ${checkedBags} checked, ${carryOnBags} carry-on) exceeds vehicle limit (${spec.maxPassengers} pax, ${spec.maxCheckedBags} checked, ${spec.maxCarryOnBags} carry-on).`;
        } else if (!passesPickupWindow) {
          blockedOrWithheldReason = `Traveler ready at ${dcc412Recheck.travelerReadyAt.localTime24} GMT misses latest pickup cutoff ${latestAllowedReadyLocal} GMT.`;
        } else if (!passesVikDropoffCutoff) {
          blockedOrWithheldReason = `Estimated Vík arrival ${estimatedVikDropoffLocal} GMT exceeds ${vikDropoffCutoffLocal} GMT cutoff.`;
        }

        return {
          departureId: `${spec.optionId}-${slotLocal.replace(":", "")}`,
          optionId: spec.optionId,
          operatorName: spec.operatorName,
          channelType: spec.channelType,
          publicChannelLabel: spec.publicChannelBadge,
          routeVariant:
            !spec.alwaysPrimaryHellisheidi && useBypassSegments
              ? "rengsli_route39_bypass"
              : "primary_hellisheidi_route1",
          drivenSegmentIds: drivenIds,
          scheduledPickupLocal: slotLocal,
          latestAllowedReadyLocal,
          estimatedVikDropoffLocal,
          vikDropoffCutoffLocal,
          vehicleClassName: spec.vehicleClassName,
          maxPassengers: spec.maxPassengers,
          maxCheckedBags: spec.maxCheckedBags,
          maxCarryOnBags: spec.maxCarryOnBags,
          winterStuddedTiresIncluded: spec.winterStuddedTiresIncluded,
          priceIskLabel: spec.priceIskLabel,
          passesPickupWindow,
          passesVikDropoffCutoff,
          passesVehicleAndLuggageFit,
          passesRoadClosureGate,
          passesVerificationGate,
          fitsOverall,
          departureBlockedByClosure: segmentMatch.departureBlockedByClosure,
          closedDrivenSegmentIds: segmentMatch.closedDrivenSegmentIds,
          slackToPickupWindowMinutes,
          marginBeforeVikCutoffMinutes,
          bookingLinkEnabled: fitsOverall,
          bookingHref: fitsOverall ? spec.verifiedHrefWhenEligible : null,
          blockedOrWithheldReason,
          segmentMatch,
        };
      });

    const fittingDep =
      evaluatedDepartures.find((d) => d.fitsOverall) ?? evaluatedDepartures[0]!;

    const bestVerifiedNextStep = !passesRoadClosureGate
      ? {
          label:
            "Stage in Reykjavík / Selfoss & Check Official Vegagerðin Closures (umferdin.is)",
          href: "https://umferdin.is/en",
          explanation: `Vegagerðin segment ${segmentMatch.closedDrivenSegmentIds.join(", ")} is closed (Lokað). Do not dispatch east of the barrier; stage in Reykjavík or Selfoss and monitor umferdin.is.`,
        }
      : !passesVerificationGate
        ? {
            label:
              "Verify Official Strætó Public Bus Baseline (straeto.is) & Road Conditions (umferdin.is)",
            href: "https://www.straeto.is/en/route-planner",
            explanation:
              "Commercial checkout is withheld until flight/road timing and Review Desk operator terms are verified; use official Strætó Route 55 → Route 51 timetable and Vegagerðin road status as the verified baseline.",
          }
        : {
            label: `Proceed to Verified ${spec.operatorName} Transfer`,
            href: spec.verifiedHrefWhenEligible,
            explanation: `All 5 corridor checks pass (${fittingDep.scheduledPickupLocal} GMT departure → ${fittingDep.estimatedVikDropoffLocal} GMT Vík arrival).`,
          };

    return {
      optionId: spec.optionId,
      title: spec.title,
      operatorId: spec.operatorId,
      operatorName: spec.operatorName,
      channelType: spec.channelType,
      publicChannelBadge: spec.publicChannelBadge,
      vehicleClassName: spec.vehicleClassName,
      maxPassengers: spec.maxPassengers,
      maxCheckedBags: spec.maxCheckedBags,
      maxCarryOnBags: spec.maxCarryOnBags,
      winterStuddedTiresIncluded: spec.winterStuddedTiresIncluded,
      priceIskLabel: spec.priceIskLabel,
      pickupWaitRuleSummary: spec.pickupWaitRuleSummary,
      closureRefundRuleSummary: spec.closureRefundRuleSummary,
      passesPickupWindow: evaluatedDepartures.some((d) => d.passesPickupWindow),
      passesVikDropoffCutoff: evaluatedDepartures.some(
        (d) => d.passesVikDropoffCutoff,
      ),
      passesVehicleAndLuggageFit,
      passesRoadClosureGate,
      passesVerificationGate,
      fitsOverall: evaluatedDepartures.some((d) => d.fitsOverall),
      departureBlockedByClosure: segmentMatch.departureBlockedByClosure,
      bookingLinkEnabled: evaluatedDepartures.some((d) => d.fitsOverall),
      bookingHref: evaluatedDepartures.some((d) => d.fitsOverall)
        ? spec.verifiedHrefWhenEligible
        : null,
      bestVerifiedNextStep,
      evaluatedDepartures,
    };
  };

  const northTripClosed = reviewDeskClosure.closedOperatorProfiles[0]!;
  const driveRvkClosed = reviewDeskClosure.closedOperatorProfiles[1]!;

  const evaluatedOptions: IcelandEvaluatedTransferOption[] = [
    buildOptionEvaluation({
      optionId: "northtrip-kef-vik-private-suv",
      title:
        partySize > 4 || checkedBags > 4
          ? "NorthTrip — Private 4x4 Mercedes Sprinter Transfer (KEF → Vík)"
          : "NorthTrip — Private 4x4 Winter SUV Transfer (KEF → Vík)",
      operatorId: "northtrip-iceland",
      operatorName: "NorthTrip ehf.",
      channelType: "direct_partner_10pct",
      publicChannelBadge: "Direct Licensed Operator",
      vehicleClassName:
        partySize > 4 || checkedBags > 4
          ? "Private 4x4 Mercedes Sprinter Minibus (up to 12 Pax, 12 Checked + 12 Carry-On Bags)"
          : "Private 4x4 Winter SUV (up to 4 Pax, 4 Checked + 4 Carry-On Bags)",
      maxPassengers: partySize > 4 || checkedBags > 4 ? 12 : 4,
      maxCheckedBags: partySize > 4 || checkedBags > 4 ? 12 : 4,
      maxCarryOnBags: partySize > 4 || checkedBags > 4 ? 12 : 4,
      winterStuddedTiresIncluded: true,
      priceIskLabel: termsAreVerified
        ? northTripClosed.priceIskLabel
        : ICELAND_KEF_VIK_OPERATOR_PROFILES[0]!.priceIskLabel,
      pickupWaitRuleSummary: termsAreVerified
        ? northTripClosed.delayedFlightPickupPolicy
        : ICELAND_KEF_VIK_OPERATOR_PROFILES[0]!.delayedFlightPickupPolicy,
      closureRefundRuleSummary: termsAreVerified
        ? northTripClosed.roadClosureAndRefundTerms
        : ICELAND_KEF_VIK_OPERATOR_PROFILES[0]!.roadClosureAndRefundTerms,
      waitWindowMinutes: 90,
      requiresReviewDeskOperatorClosure: true,
      verifiedHrefWhenEligible:
        "https://northtrip.is/kef-vik-private-transfer",
      slotTimesLocal: ["08:00", "10:30", "13:30"],
    }),
    buildOptionEvaluation({
      optionId: "drive-reykjavik-kef-vik-private-minibus",
      title:
        partySize > 4 || checkedBags > 4
          ? "Drive Reykjavík — Private AWD V-Class / Touring Minibus (KEF → Vík)"
          : "Drive Reykjavík — Private AWD Executive SUV (KEF → Vík)",
      operatorId: "drive-reykjavik",
      operatorName: "Drive Reykjavík ehf.",
      channelType: "direct_partner_10pct",
      publicChannelBadge: "Direct Licensed Operator",
      vehicleClassName:
        partySize > 6 || checkedBags > 6
          ? "Private Touring Minibus (up to 16 Pax, 16 Checked + 16 Carry-On Bags)"
          : partySize > 4 || checkedBags > 4
            ? "Private Mercedes V-Class AWD Van (up to 6 Pax, 6 Checked + 6 Carry-On Bags)"
            : "Private AWD Executive SUV (up to 4 Pax, 4 Checked + 4 Carry-On Bags)",
      maxPassengers:
        partySize > 6 || checkedBags > 6
          ? 16
          : partySize > 4 || checkedBags > 4
            ? 6
            : 4,
      maxCheckedBags:
        partySize > 6 || checkedBags > 6
          ? 16
          : partySize > 4 || checkedBags > 4
            ? 6
            : 4,
      maxCarryOnBags:
        partySize > 6 || checkedBags > 6
          ? 16
          : partySize > 4 || checkedBags > 4
            ? 6
            : 4,
      winterStuddedTiresIncluded: true,
      priceIskLabel: termsAreVerified
        ? driveRvkClosed.priceIskLabel
        : ICELAND_KEF_VIK_OPERATOR_PROFILES[1]!.priceIskLabel,
      pickupWaitRuleSummary: termsAreVerified
        ? driveRvkClosed.delayedFlightPickupPolicy
        : ICELAND_KEF_VIK_OPERATOR_PROFILES[1]!.delayedFlightPickupPolicy,
      closureRefundRuleSummary: termsAreVerified
        ? driveRvkClosed.roadClosureAndRefundTerms
        : ICELAND_KEF_VIK_OPERATOR_PROFILES[1]!.roadClosureAndRefundTerms,
      waitWindowMinutes: 90,
      requiresReviewDeskOperatorClosure: true,
      verifiedHrefWhenEligible:
        "https://drivereykjavik.is/private-south-coast-transfer",
      slotTimesLocal: ["08:00", "10:30", "13:30"],
    }),
    buildOptionEvaluation({
      optionId: "dcc-owned-south-coast-dispatch",
      title: "DCC South Coast Dispatch Desk — Verified KEF → Vík Private Transfer",
      operatorId: "dcc-south-coast-dispatch",
      operatorName: "DCC South Coast Dispatch (Fulfilled by NorthTrip / Drive Reykjavík)",
      channelType: "owned",
      publicChannelBadge: "DCC Verified Dispatch",
      vehicleClassName:
        partySize > 4 || checkedBags > 4
          ? "Private 4x4 Mercedes Sprinter (up to 12 Pax, 12 Bags)"
          : "Private 4x4 Winter SUV (up to 4 Pax, 4 Bags)",
      maxPassengers: partySize > 4 || checkedBags > 4 ? 12 : 4,
      maxCheckedBags: partySize > 4 || checkedBags > 4 ? 12 : 4,
      maxCarryOnBags: partySize > 4 || checkedBags > 4 ? 12 : 4,
      winterStuddedTiresIncluded: true,
      priceIskLabel: termsAreVerified
        ? "134,000 ISK (1–4 Pax SUV) · 209,000 ISK (5–12 Pax Sprinter) — Fulfilled via Review Desk Verified Carrier"
        : "Pending Review Desk operator confirmation",
      pickupWaitRuleSummary:
        "Applies identical 45m KEF customs buffer + 90m flight-monitoring wait window.",
      closureRefundRuleSummary:
        "Applies identical Vegagerðin Route 1 closure block & 100% refund/staging rule.",
      waitWindowMinutes: 90,
      requiresReviewDeskOperatorClosure: true,
      verifiedHrefWhenEligible:
        "https://northtrip.is/kef-vik-private-transfer?utm_source=dcc_dispatch",
      slotTimesLocal: ["08:00", "10:30"],
    }),
    buildOptionEvaluation({
      optionId: "affiliate-viator-kef-vik-private",
      title: "Viator — Private South Coast Transfer (KEF Airport → Vík)",
      operatorId: "viator-iceland-south-coast",
      operatorName: "Viator Reseller Listing (Same Physical Route 1 Corridor)",
      channelType: "affiliate_viator",
      publicChannelBadge: "Affiliate Reseller (Viator)",
      vehicleClassName: "Standard Private SUV / Minivan (up to 6 Pax, 6 Bags)",
      maxPassengers: 6,
      maxCheckedBags: 6,
      maxCarryOnBags: 6,
      winterStuddedTiresIncluded: true,
      priceIskLabel: "Reseller listing subject to identical KEF → Vík road & timing rules",
      pickupWaitRuleSummary:
        "Evaluated under the exact same 45m KEF customs buffer and pickup window rules as direct operators.",
      closureRefundRuleSummary:
        "Blocked whenever Vegagerðin marks any driven Route 41 / Route 1 segment as Lokað or Ófært.",
      waitWindowMinutes: 60,
      requiresReviewDeskOperatorClosure: true,
      verifiedHrefWhenEligible:
        "https://www.viator.com/Reykjavik-tourism/d905-r1",
      slotTimesLocal: ["08:00", "10:30"],
    }),
    buildOptionEvaluation({
      optionId: "affiliate-gyg-kef-vik-private",
      title: "GetYourGuide — Private KEF Airport to Vík South Coast Transfer",
      operatorId: "gyg-iceland-south-coast",
      operatorName: "GetYourGuide Reseller Listing (Same Physical Route 1 Corridor)",
      channelType: "affiliate_getyourguide",
      publicChannelBadge: "Affiliate Reseller (GetYourGuide)",
      vehicleClassName: "Standard Private SUV / Minivan (up to 6 Pax, 6 Bags)",
      maxPassengers: 6,
      maxCheckedBags: 6,
      maxCarryOnBags: 6,
      winterStuddedTiresIncluded: true,
      priceIskLabel: "Reseller listing subject to identical KEF → Vík road & timing rules",
      pickupWaitRuleSummary:
        "Evaluated under the exact same 45m KEF customs buffer and pickup window rules as direct operators.",
      closureRefundRuleSummary:
        "Blocked whenever Vegagerðin marks any driven Route 41 / Route 1 segment as Lokað or Ófært.",
      waitWindowMinutes: 60,
      requiresReviewDeskOperatorClosure: true,
      verifiedHrefWhenEligible:
        "https://www.getyourguide.com/reykjavik-l30/",
      slotTimesLocal: ["08:00", "10:30"],
    }),
    buildOptionEvaluation({
      optionId: "straeto-route55-route51-public-baseline",
      title:
        "Strætó bs. Public Transit Baseline (Route 55 KEF → Mjódd + Route 51 Mjódd → Selfoss → Vík)",
      operatorId: "straeto-bs",
      operatorName: "Strætó bs. (Official Iceland Public Transit)",
      channelType: "public_transit_baseline",
      publicChannelBadge: "Official Public Transit Baseline",
      vehicleClassName: "Scheduled Intercity Coach (Route 55 + Route 51 Transfer at Mjódd)",
      maxPassengers: 16,
      maxCheckedBags: 16,
      maxCarryOnBags: 16,
      winterStuddedTiresIncluded: true,
      priceIskLabel:
        "Official Strætó bs. zone tariff (verified dated source: straeto.is, 2026-11-07)",
      pickupWaitRuleSummary:
        "Scheduled bus departs on fixed timetable; requires traveler ready at KEF bus bay at or before departure.",
      closureRefundRuleSummary:
        "Route 51 suspends service east of Selfoss/Hvolsvöllur whenever Vegagerðin closes Hellisheiði or Under Eyjafjöll.",
      waitWindowMinutes: 0,
      requiresReviewDeskOperatorClosure: false,
      verifiedHrefWhenEligible: "https://www.straeto.is/en/route-planner",
      slotTimesLocal: ["09:15"],
      customDurationMinutes: 320,
      alwaysPrimaryHellisheidi: true,
    }),
  ];

  const verdictCaseType: IcelandKefVikVerdictCaseType =
    departureBlockedByClosure
      ? "closure_blocks_departure"
      : !baselineVerified || !termsAreVerified
        ? "needs_verification"
        : "trip_that_fits";

  const bestVerifiedNextStep =
    verdictCaseType === "closure_blocks_departure"
      ? {
          label:
            "Stage in Reykjavík / Selfoss & Check Official Vegagerðin Road Status (umferdin.is)",
          href: "https://umferdin.is/en",
          explanation:
            "Vegagerðin has closed Route 1 on this corridor (Lokað). All Vík-bound commercial checkout links are disabled; hold in Reykjavík or Selfoss until Vegagerðin reopens the barrier.",
        }
      : verdictCaseType === "needs_verification"
        ? {
            label:
              "Verify Official Strætó Timetable (straeto.is) & Vegagerðin Road Map (umferdin.is)",
            href: "https://www.straeto.is/en/route-planner",
            explanation:
              "Flight/road timing or operator terms require verification before enabling commercial checkout. Check official Strætó Route 55 → Route 51 schedules and Vegagerðin live segments.",
          }
        : {
            label:
              "Proceed to Verified NorthTrip / Drive Reykjavík Private Transfer →",
            href:
              evaluatedOptions.find((o) => o.fitsOverall)?.bookingHref ??
              "https://northtrip.is/kef-vik-private-transfer",
            explanation: `Traveler ready at ${dcc412Recheck.travelerReadyAt.formattedSummary} (45m KEF buffer added once); all driven Vegagerðin segments are open and Review Desk operator terms are confirmed.`,
          };

  const whatChanged = isEyjafjollClosed
    ? `[Sample Scenario] Vegagerðin DATEX II segment VG-R01-SEL-VIK (Route 1 Under Eyjafjöllum → Vík) is CLOSED (LOKAÐ) at ${telemetry.checkedAtUtc}; IMO Red/Orange wind warning (>38 m/s gusts) active.`
    : isHellisheidiClosed
      ? `[Sample Scenario] Vegagerðin DATEX II segment VG-R01-HEI-HVE (Route 1 Hellisheiði Pass) is CLOSED (LOKAÐ) at ${telemetry.checkedAtUtc}; IMO Orange blizzard warning active on upper pass.`
      : !baselineVerified
        ? `[Sample Scenario] Flight arrival ETA or Vegagerðin update is missing/stale (${dcc412Recheck.scheduleBaselineStatus}); 45m KEF customs buffer added once in Atlantic/Reykjavik.`
        : `[Sample Scenario] KEF arrival ${flightEtaLocal} GMT + 45m customs buffer = ready at ${dcc412Recheck.travelerReadyAt.formattedSummary} (${partySize} pax, ${checkedBags} bags): Route 41 & Route 1 (KEF → Hellisheiði → Vík) are OPEN in sample Vegagerðin scenario (${telemetry.checkedAtUtc}) with localized ice patches (Hálkublettir) and IMO Yellow wind advisory.`;

  const whatStillFits = isEyjafjollClosed
    ? operatorConfirmedLaterDepartureLocal
      ? `[Sample Scenario] Immediate KEF → Vík departure is blocked by the Route 1 Eyjafjöll closure; operator-confirmed later departure at ${operatorConfirmedLaterDepartureLocal} GMT is available once Vegagerðin reopens the barrier.`
      : `[Sample Scenario] Affected KEF → Vík departure is BLOCKED (no road bypass exists east of Markarfljót). Do not self-drive; stage in Reykjavík/Selfoss until Vegagerðin reopens Route 1.`
    : isHellisheidiClosed && operatorConfirmedAlternateRoute
      ? `[Sample Scenario] Direct Hellisheiði pass is blocked, but ${recommendedVehicleClass} fits via operator-confirmed alternate route: ${operatorConfirmedAlternateRoute}.`
      : verdictCaseType === "needs_verification"
        ? `[Sample Scenario] Needs verification before checkout: verify flight arrival ETA and Review Desk status; official Strætó Route 55 → Route 51 baseline and umferdin.is remain available.`
        : `[Sample Scenario] ${recommendedVehicleClass} fits your group of ${partySize} (${checkedBags} bags) for the ~2h 45m (225 km) KEF → Vík transfer (ready ${dcc412Recheck.travelerReadyAt.localTime24} GMT → 08:00 GMT departure → 10:45 GMT Vík arrival).`;

  const primaryLabel = departureBlockedByClosure
    ? "Stage in Reykjavík & Check Review Desk Qualification Status →"
    : verdictCaseType === "needs_verification"
      ? "Verify Flight ETA & Check Official Strætó / Vegagerðin Baseline →"
      : `Review KEF → Vík Qualification & Verified Options (${recommendedVehicleClass}) →`;

  const primaryHref = `/routes/keflavik-to-vik?scenario=${scenario}&passengers=${partySize}&bags=${checkedBags}&eta=${encodeURIComponent(flightEtaLocal)}#review-desk`;

  return {
    corridorId: "iceland-kef-to-vik",
    corridorRecord: KEF_TO_VIK_CORRIDOR_RECORD,
    isSampleTelemetry: true,
    sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
    scenarioKey: scenario,
    verdictCaseType,
    serviceDate,
    ianaTimeZone: "Atlantic/Reykjavik",
    flightEtaLocal,
    flightDelayMinutes,
    travelerEtaEntered,
    transferBufferMinutes: 45,
    transferBufferAddedOnce: true,
    dcc412Recheck,
    reviewDeskTermsClosed: termsAreVerified,
    reviewDeskClosure,
    departureBlockedByClosure,
    operatorConfirmedAlternateRoute,
    operatorConfirmedLaterDepartureLocal,
    recommendedVehicleClass,
    evaluatedOptions,
    bestVerifiedNextStep,
    recheckCard: {
      corridorId: "iceland-kef-to-vik",
      whatChanged,
      whatStillFits,
      nextStep: `${primaryLabel.replace(" →", "")} (Data schema: Vegagerðin DATEX II & Veðurstofa Íslands — Sample scenario; Review Desk verified: ${termsAreVerified ? "Yes" : "Pending"}).`,
      primaryNextActionLabel: primaryLabel,
      primaryNextActionHref: primaryHref,
    },
    telemetry,
  };
}

export const evaluateIcelandKefVikCorridorRecheck = evaluateIcelandKefVikCorheck;

/**
 * The 3 required KEF → Vík reference cases:
 * 1. `trip_that_fits` — Open Route 41/1 segments, 06:45 GMT arrival + 45m buffer = 07:30 GMT ready, 4 pax / 4 bags, Review Desk terms closed -> fits & enables booking links.
 * 2. `closure_blocks_departure` — Vegagerðin `VG-R01-SEL-VIK` (Under Eyjafjöllum → Vík) closed (`closed_lokad`) -> blocks affected departure, disables all Vík booking links, surfaces Reykjavík/Selfoss staging & umferdin.is.
 * 3. `needs_verification` — Missing/stale flight update or unconfirmed Review Desk terms -> `Needs verification`, withholds commercial checkout links, surfaces official Strætó & Vegagerðin fallback.
 */
export const KEF_VIK_THREE_REQUIRED_CASES = {
  trip_that_fits: evaluateIcelandKefVikCorheck({
    scenario: "normal_winter_patches",
    serviceDate: "2026-11-18",
    flightEtaLocal: "06:45",
    flightDelayMinutes: 0,
    partySize: 4,
    checkedBags: 4,
    carryOnBags: 4,
    reviewDeskTermsClosed: true,
  }),
  closure_blocks_departure: evaluateIcelandKefVikCorheck({
    scenario: "eyjafjoll_full_closure",
    serviceDate: "2026-11-18",
    flightEtaLocal: "06:45",
    flightDelayMinutes: 0,
    partySize: 4,
    checkedBags: 4,
    carryOnBags: 4,
    reviewDeskTermsClosed: true,
  }),
  needs_verification: evaluateIcelandKefVikCorheck({
    scenario: "normal_winter_patches",
    serviceDate: "2026-11-18",
    flightEtaLocal: null,
    partySize: 4,
    checkedBags: 4,
    carryOnBags: 4,
    reviewDeskTermsClosed: false,
    criticalUpdateMissing: true,
  }),
} as const;

// ============================================================================
// 2. INDIA: Delhi → Agra (Gatimaan / Vande Bharat Rail + Station Transfer vs. Yamuna Expressway)
// ============================================================================

export interface IndiaTajMahalVisitingRules {
  weeklyClosureDay: "Friday";
  weeklyClosureDetail: string;
  sunriseToSunsetWindowNote: string;
  officialTicketPortalUrl: string;
  officialWebsiteUrl: string;
  verifiedOnDate: string;
  foreignerEntryFeeInr: string;
  mausoleumAddonInr: string;
  strictProhibitedItems: string[];
  eastAndWestGateElectricShuttleRule: string;
}

export const TAJ_MAHAL_VISITING_RULES: IndiaTajMahalVisitingRules = {
  weeklyClosureDay: "Friday",
  weeklyClosureDetail:
    "Taj Mahal is CLOSED to general visitors every Friday (open Friday afternoons only for practicing Muslims attending prayers at the mosque).",
  sunriseToSunsetWindowNote:
    "Ticket gates open 30 minutes before sunrise and close 45 minutes before sunset (ASI daylight rule).",
  officialTicketPortalUrl: "https://asi.payumoney.com/",
  officialWebsiteUrl: "https://www.tajmahal.gov.in/",
  verifiedOnDate: "2026-11-07",
  foreignerEntryFeeInr:
    "₹1,100 per adult foreign visitor (Archaeological Survey of India statutory tariff, verified on tajmahal.gov.in 2026-11-07)",
  mausoleumAddonInr:
    "₹200 optional main mausoleum entry add-on (₹1,300 total, verified on tajmahal.gov.in 2026-11-07)",
  strictProhibitedItems: [
    "Tripods, lighting stands, drones, and professional Gimbal rigs",
    "Power banks, headphones, chargers, and extra batteries (subject to CISF security hold)",
    "Food, tobacco, lighters, knives, and large backpacks (> 45 cm)",
  ],
  eastAndWestGateElectricShuttleRule:
    "Combustion vehicles are prohibited within the 500-meter Taj Trapezium Zone (TTZ) perimeter; private cars drop at Shilpgram (East Gate, ~900m electric golf-cart shuttle) or Amrood-ka-Teela (West Gate).",
};

export interface DelhiAgraOptionProfile {
  optionId: string;
  mode: "express_rail" | "station_to_taj_transfer" | "yamuna_expressway_private_car";
  title: string;
  operatorOrAuthority: string;
  permitAndLicenseRequirement: string;
  scheduleAndDuration: string;
  priceInrLabel: string;
  priceUsdReferenceNote: string;
  luggageAndSeatingLimits: string;
  delayAndRefundPolicy: string;
  bookingOrWhatsappChannelLabel: string;
  /**
   * Verified official government booking link when backed by a dated source (`verifiedOnDate` + `sourceUrl`);
   * `null` for commercial private-car operators whose pricing/WhatsApp links are pending operator confirmation in the Review Desk.
   */
  bookingOrWhatsappHref: string | null;
  reviewDeskFactId: string | null;
  pricingVerificationGate: DatedSourceOrOperatorConfirmationGate;
  permitVerificationGate: DatedSourceOrOperatorConfirmationGate;
  refundTermsVerificationGate: DatedSourceOrOperatorConfirmationGate;
  bookingLinkVerificationGate: DatedSourceOrOperatorConfirmationGate;
}

export const DELHI_AGRA_QUALIFIED_OPTIONS: DelhiAgraOptionProfile[] = [
  {
    optionId: "irctc-gatimaan-express-12050",
    mode: "express_rail",
    title: "Train 12050 Gatimaan Express (Hazrat Nizamuddin NZM → Agra Cantt AGC)",
    operatorOrAuthority:
      "Indian Railways (Northern Railway) — Official IRCTC Ticketing",
    permitAndLicenseRequirement:
      "Statutory Indian Railways Express Service (PNR-verified reserved seating in Executive Chair Car EC or AC Chair Car CC)",
    scheduleAndDuration:
      "Departs NZM 08:10 IST → Arrives Agra Cantt (AGC) 09:50 IST (100 minutes; runs 6 days/week — DOES NOT RUN ON FRIDAYS). Return Train 12049 departs AGC 17:45 IST → NZM 19:30 IST.",
    priceInrLabel:
      "₹755 (AC Chair Car CC) / ₹1,485 (Executive Chair Car EC) — IRCTC statutory base fare schedule (verified 2026-11-07)",
    priceUsdReferenceNote:
      "Official IRCTC base fare schedule; book directly on irctc.co.in",
    luggageAndSeatingLimits:
      "100% reserved airplane-style seating; overhead rack fits standard carry-on + medium suitcase (up to 40 kg free allowance in CC / 70 kg in EC).",
    delayAndRefundPolicy:
      "Dense North Indian winter fog (Dec 15 – Jan 31) can delay morning rail departures 30–120 minutes; full statutory IRCTC e-ticket refund applies if train is delayed > 3 hours and passenger files TDR before departure.",
    bookingOrWhatsappChannelLabel:
      "Official IRCTC Rail Portal (irctc.co.in — Dated Statutory Source)",
    bookingOrWhatsappHref: "https://www.irctc.co.in/nget/train-search",
    reviewDeskFactId: null,
    pricingVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "published_price",
      proposedValue:
        "₹755 (AC Chair Car CC) / ₹1,485 (Executive Chair Car EC) — Official IRCTC tariff",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.irctc.co.in/nget/train-search",
      pendingFallbackLabel: "Pending dated source",
    }),
    permitVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "permit",
      proposedValue: "Statutory Indian Railways Express Service (Train 12050/12049)",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.irctc.co.in/nget/train-search",
      pendingFallbackLabel: "Pending dated source",
    }),
    refundTermsVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "refund_terms",
      proposedValue:
        "Statutory Indian Railways TDR full refund rule when train is delayed > 3 hours",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.irctc.co.in/nget/train-search",
      pendingFallbackLabel: "Pending dated source",
    }),
    bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "booking_or_whatsapp_link",
      proposedValue: "https://www.irctc.co.in/nget/train-search",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.irctc.co.in/nget/train-search",
      pendingFallbackLabel: "Pending dated source",
    }),
  },
  {
    optionId: "agra-cantt-station-to-taj-private-car",
    mode: "station_to_taj_transfer",
    title: "Agra Cantt (AGC) Station Exit → Taj Mahal East Gate (Shilpgram) Pre-Booked AC Car",
    operatorOrAuthority:
      "Agra Cantt Verified Station Transfer Cohort (Pending operator confirmation in Review Desk)",
    permitAndLicenseRequirement:
      "Yellow-on-black commercial registration plate + UP Transport Department All-India Tourist Permit (AITP) — specific operator permit numbers queued in Review Desk (`mc-ind-agra-cantt-private-car-pricing-and-whatsapp-20261107`).",
    scheduleAndDuration:
      "Staged at Agra Cantt Platform 1 / Main Portico exit; 15m station exit walk + 25–30 minutes (9 km) to Shilpgram East Gate parking lot.",
    priceInrLabel:
      "INR tariff pending operator confirmation / dated source (Queued in Review Desk)",
    priceUsdReferenceNote:
      "Commercial INR rate card withheld until operator confirmation is approved in Review Desk.",
    luggageAndSeatingLimits:
      "Sedan (1–3 Pax + 2 bags) or Innova Crysta SUV (4–6 Pax + 4 bags); secure trunk storage while visiting the Taj Mahal (avoids CISF locker queues for prohibited bags/electronics).",
    delayAndRefundPolicy:
      "Pending operator confirmation in Review Desk: NTES live train delay wait policy and 24-hour cancellation refund terms require written operator confirmation before publishing as a guaranteed rule.",
    bookingOrWhatsappChannelLabel:
      "Booking & WhatsApp link pending operator confirmation in Review Desk (placeholder link withheld)",
    bookingOrWhatsappHref: null,
    reviewDeskFactId: "mc-ind-agra-cantt-private-car-pricing-and-whatsapp-20261107",
    pricingVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "published_price",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ind-agra-cantt-private-car-pricing-and-whatsapp-20261107",
      pendingFallbackLabel:
        "Pending operator confirmation / dated source in Review Desk (mc-ind-agra-cantt-private-car-pricing-and-whatsapp-20261107)",
    }),
    permitVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "permit",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ind-agra-cantt-private-car-pricing-and-whatsapp-20261107",
      pendingFallbackLabel:
        "Commercial AITP registration number pending operator confirmation in Review Desk",
    }),
    refundTermsVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "refund_terms",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ind-agra-cantt-private-car-pricing-and-whatsapp-20261107",
      pendingFallbackLabel:
        "NTES train-delay wait window & refund terms pending operator confirmation in Review Desk",
    }),
    bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "booking_or_whatsapp_link",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ind-agra-cantt-private-car-pricing-and-whatsapp-20261107",
      pendingFallbackLabel:
        "Verified booking / WhatsApp link pending operator confirmation in Review Desk (unverified wa.me placeholder removed)",
    }),
  },
  {
    optionId: "delhi-to-agra-yamuna-expressway-private-car",
    mode: "yamuna_expressway_private_car",
    title: "Door-to-Door Private AC Car (New Delhi / DEL Airport → Agra via Yamuna Expressway)",
    operatorOrAuthority:
      "Delhi–Agra Yamuna Expressway Commercial Tourist Fleet (Pending operator confirmation in Review Desk)",
    permitAndLicenseRequirement:
      "Mandatory All-India Tourist Permit (AITP) + FASTag toll + UP State Border Entry Tax — operator permit numbers queued in Review Desk (`mc-ind-yamuna-expressway-private-car-pricing-and-booking-20261107`).",
    scheduleAndDuration:
      "3h 30m – 4h 15m each way (230 km via 6-lane Yamuna Expressway); operates 7 days/week (recommended for Friday Agra Fort / Baby Taj visits or late-morning DEL arrivals).",
    priceInrLabel:
      "INR tariff pending operator confirmation / dated source (Queued in Review Desk)",
    priceUsdReferenceNote:
      "Commercial INR rate card withheld until operator confirmation is approved in Review Desk.",
    luggageAndSeatingLimits:
      "Toyota Innova Crysta (up to 5 Pax + 4 suitcases) or Tempo Traveller (up to 10 Pax + 8 suitcases).",
    delayAndRefundPolicy:
      "Pending operator confirmation in Review Desk: DEL flight arrival grace window and Yamuna Expressway winter fog closure refund/re-dispatch terms require written operator confirmation.",
    bookingOrWhatsappChannelLabel:
      "Direct booking link pending operator confirmation in Review Desk",
    bookingOrWhatsappHref: null,
    reviewDeskFactId:
      "mc-ind-yamuna-expressway-private-car-pricing-and-booking-20261107",
    pricingVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "published_price",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ind-yamuna-expressway-private-car-pricing-and-booking-20261107",
      pendingFallbackLabel:
        "Pending operator confirmation / dated source in Review Desk (mc-ind-yamuna-expressway-private-car-pricing-and-booking-20261107)",
    }),
    permitVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "permit",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ind-yamuna-expressway-private-car-pricing-and-booking-20261107",
      pendingFallbackLabel:
        "UP/Delhi AITP permit number pending operator confirmation in Review Desk",
    }),
    refundTermsVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "refund_terms",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ind-yamuna-expressway-private-car-pricing-and-booking-20261107",
      pendingFallbackLabel:
        "Winter fog closure & DEL flight-delay refund terms pending operator confirmation in Review Desk",
    }),
    bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "booking_or_whatsapp_link",
      proposedValue: null,
      reviewDeskFactId:
        "mc-ind-yamuna-expressway-private-car-pricing-and-booking-20261107",
      pendingFallbackLabel:
        "Direct operator booking link pending confirmation in Review Desk",
    }),
  },
];

export const OFFICIAL_NTES_LIVE_TRAIN_LOOKUP = {
  portalName: "CRIS National Train Enquiry System (NTES) Official Live Train Status",
  officialMobileAndWebUrl: "https://enquiry.indianrail.gov.in/mntes/",
  crisPortalUrl: "https://cris.org.in/loadpage?page=proNTES",
  feedAccessStatus: "pending_approved_machine_access" as const,
  travelerEtaFieldLabel:
    "Traveler-Entered Revised ETA (IST — while official CRIS/NTES machine feed access is pending)",
} as const;

export interface DelhiAgraCorridorRecheckResult {
  corridorId: "delhi-to-agra";
  travelDate: string;
  dayOfWeekName: string;
  isFridayTajClosed: boolean;
  trainRunningDelayMinutes: number;
  travelerEnteredEtaLocal: string | null;
  travelerEtaEntered: boolean;
  sampleOnwardDeparturesExcludedFromRealTrip: boolean;
  ntesLookupUrl: string;
  travelerEtaFieldLabel: string;
  recommendedPrimaryMode: string;
  /**
   * Real-trip evaluation result:
   * - For a traveler who hasn't entered an ETA (`!absoluteEta`), `scheduleBaselineStatus` is `"Needs verification"`.
   * - Keeps sample onward departures (`10:30`, `11:00`, `11:30` Agra Cantt feeder cohorts) OUT of the real-trip result (`candidates: []`) until those onward services are verified.
   */
  dcc412Recheck: Dcc412ItineraryRecheckResult;
  /**
   * Explicitly labeled December 10, 2026 (`2026-12-10`) Example Scenario (`isExampleScenario: true`, `scenarioLabel: "Example — December 10, 2026 Scenario (2026-12-10 Synthetic Fixture)"`).
   */
  december10ExampleScenario: Dcc412ItineraryRecheckResult;
  recheckCard: CompactTripRecheckCardModel;
}

export function evaluateDelhiAgraCorridorRecheck(params?: {
  date?: string;
  trainDelayMinutes?: number;
  scheduledArrivalLocal?: string;
  absoluteEta?: string | null;
  destinationCutoffLocal?: string;
  transferBufferMinutes?: number;
  criticalUpdateMissing?: boolean;
  staleUpdate?: boolean;
  evaluatedAtUtc?: string | null;
  includeBackup1130?: boolean;
  partySize?: number;
  isExampleScenario?: boolean;
  verifiedCandidateDepartures?: Dcc412CandidateDepartureInput[];
}): DelhiAgraCorridorRecheckResult {
  const date =
    params?.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date.trim())
      ? params.date.trim()
      : "2026-12-10"; // 2026-11-20 is Friday
  const hasTravelerEta = Boolean(
    params?.absoluteEta && params.absoluteEta.trim(),
  );
  const trainDelayMinutes = Math.max(
    0,
    Math.round(
      params?.trainDelayMinutes ?? (params?.isExampleScenario ? 42 : 0),
    ),
  );
  const partySize = Math.max(1, Math.round(params?.partySize || 2));

  const parsedUtc = new Date(`${date}T00:00:00Z`);
  const dayIndex = parsedUtc.getUTCDay();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayOfWeekName = dayNames[dayIndex] || "Thursday";
  const isFridayTajClosed = dayIndex === 5;

  const dcc412Recheck = params?.isExampleScenario
    ? evaluateSyntheticDelhiAgraDcc412Test({
        serviceDate: date,
        scenarioLabel:
          date === "2026-12-10"
            ? "Example — December 10, 2026 Scenario (2026-12-10 Synthetic Fixture)"
            : `Example — ${date} Synthetic Scenario`,
        scheduledArrivalLocal: params?.scheduledArrivalLocal || "09:50",
        delayMinutes: trainDelayMinutes,
        absoluteEta: params?.absoluteEta ?? null,
        destinationCutoffLocal: params?.destinationCutoffLocal || "16:30",
        transferBufferMinutes: params?.transferBufferMinutes ?? 15,
        criticalUpdateMissing: params?.criticalUpdateMissing ?? false,
        staleUpdate: params?.staleUpdate ?? false,
        evaluatedAtUtc: params?.evaluatedAtUtc ?? null,
        includeBackup1130:
          params?.includeBackup1130 ??
          (params?.destinationCutoffLocal !== "11:00" &&
            params?.destinationCutoffLocal !== "11:30"),
      })
    : evaluateDelhiAgraRealTripRecheck({
        serviceDate: date,
        scheduledArrivalLocal: params?.scheduledArrivalLocal || "09:50",
        delayMinutes: trainDelayMinutes,
        absoluteEta: params?.absoluteEta ?? null,
        destinationCutoffLocal: params?.destinationCutoffLocal || "16:30",
        transferBufferMinutes: params?.transferBufferMinutes ?? 15,
        criticalUpdateMissing: params?.criticalUpdateMissing ?? false,
        staleUpdate: params?.staleUpdate ?? false,
        evaluatedAtUtc: params?.evaluatedAtUtc ?? null,
        verifiedCandidateDepartures: params?.verifiedCandidateDepartures ?? [],
      });

  const december10ExampleScenario = evaluateDelhiAgra20261210CorridorFixture({
    delayMinutes: params?.trainDelayMinutes ?? 42,
    absoluteEta: params?.isExampleScenario ? (params?.absoluteEta ?? null) : null,
    destinationCutoffLocal: params?.destinationCutoffLocal || "11:00",
    criticalUpdateMissing: false,
    staleUpdate: false,
  });

  const recommendedPrimaryMode = isFridayTajClosed
    ? "Reschedule to Non-Friday OR Book Yamuna Expressway Private Car for Agra Fort & Mehtab Bagh Sunset View"
    : dcc412Recheck.nextCatchableDeparture
      ? `${dcc412Recheck.nextCatchableDeparture.title} (departs ${dcc412Recheck.nextCatchableDeparture.departureLocal} IST / ${dcc412Recheck.nextCatchableDeparture.departureUtcShort}, after travelerReadyAt ${dcc412Recheck.travelerReadyAt.formattedSummary})`
      : "Train 12050 Gatimaan Express + Agra Cantt Station Transfer (Enter NTES ETA — Onward Services Pending Verification in Review Desk)";

  const whatChanged = isFridayTajClosed
    ? `Selected date ${date} is a FRIDAY: Taj Mahal is CLOSED to general visitors every Friday, and Train 12050 Gatimaan Express does not operate on Fridays.`
    : dcc412Recheck.recheckCard.whatChanged;

  const whatStillFits = isFridayTajClosed
    ? `Switch your Taj Mahal visit to Thursday or Saturday, OR book a door-to-door Yamuna Expressway private car for ${partySize} guests to visit Agra Fort (open Fridays) and Mehtab Bagh (sunset view across the Yamuna River).`
    : dcc412Recheck.recheckCard.whatStillFits;

  const primaryLabel = isFridayTajClosed
    ? "Switch Date or View Friday Agra Fort & Mehtab Bagh Plan →"
    : dcc412Recheck.recheckCard.primaryNextActionLabel;

  const primaryHref = isFridayTajClosed
    ? `/routes/delhi-to-agra?date=2026-12-10&passengers=${partySize}`
    : dcc412Recheck.recheckCard.primaryNextActionHref;

  return {
    corridorId: "delhi-to-agra",
    travelDate: date,
    dayOfWeekName,
    isFridayTajClosed,
    trainRunningDelayMinutes: dcc412Recheck.delayMinutesApplied,
    travelerEnteredEtaLocal: hasTravelerEta
      ? dcc412Recheck.effectiveArrivalLocal
      : null,
    travelerEtaEntered: dcc412Recheck.travelerEtaEntered,
    sampleOnwardDeparturesExcludedFromRealTrip:
      dcc412Recheck.sampleOnwardDeparturesExcluded,
    ntesLookupUrl: OFFICIAL_NTES_LIVE_TRAIN_LOOKUP.officialMobileAndWebUrl,
    travelerEtaFieldLabel: OFFICIAL_NTES_LIVE_TRAIN_LOOKUP.travelerEtaFieldLabel,
    recommendedPrimaryMode,
    dcc412Recheck,
    december10ExampleScenario,
    recheckCard: {
      corridorId: "delhi-to-agra",
      whatChanged,
      whatStillFits,
      nextStep: isFridayTajClosed
        ? `${primaryLabel.replace(" →", "")} (ASI ₹1,100 + ₹200 mausoleum tariff verified on tajmahal.gov.in; commercial car tariffs queued in Review Desk).`
        : dcc412Recheck.recheckCard.nextStep,
      primaryNextActionLabel: primaryLabel,
      primaryNextActionHref: primaryHref,
    },
  };
}

// ============================================================================
// 3. CHINA: Hong Kong → Macao (HZMB Bus / Cross-Boundary MPV vs. High-Speed Ferry)
// ============================================================================

export interface HongKongCheckpointWaitTelemetry {
  isSample: true;
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry";
  controlPointId:
    | "HZMB_HK_PORT"
    | "SHEUNG_WAN_MACAU_FERRY"
    | "SKYPIER_HKIA";
  controlPointName: string;
  timestampHkt: string;
  visitorClearanceWaitMinutes: number;
  waitBandLabel: "Normal (< 15 min)" | "Moderate (15–30 min)" | "Congested (30–45+ min)";
  hkoTropicalCycloneSignal: "None" | "Signal No. 1" | "Signal No. 3" | "Signal No. 8 (Suspension)";
  serviceOperatingStatus: "Operating normally" | "High-wind speed restriction" | "Suspended";
}

export const HONG_KONG_MACAO_SAMPLE_TELEMETRY: Record<
  "normal_weekday" | "weekend_peak_hzmb_queue" | "typhoon_signal_8",
  HongKongCheckpointWaitTelemetry[]
> = {
  normal_weekday: [
    {
      isSample: true,
      sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
      controlPointId: "HZMB_HK_PORT",
      controlPointName: "Hong Kong-Zhuhai-Macao Bridge (HZMB) Hong Kong Port",
      timestampHkt: "2026-11-18T10:00:00+08:00",
      visitorClearanceWaitMinutes: 12,
      waitBandLabel: "Normal (< 15 min)",
      hkoTropicalCycloneSignal: "None",
      serviceOperatingStatus: "Operating normally",
    },
    {
      isSample: true,
      sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
      controlPointId: "SHEUNG_WAN_MACAU_FERRY",
      controlPointName: "Hong Kong-Macau Ferry Terminal (Sheung Wan Shun Tak Centre)",
      timestampHkt: "2026-11-18T10:00:00+08:00",
      visitorClearanceWaitMinutes: 10,
      waitBandLabel: "Normal (< 15 min)",
      hkoTropicalCycloneSignal: "None",
      serviceOperatingStatus: "Operating normally",
    },
  ],
  weekend_peak_hzmb_queue: [
    {
      isSample: true,
      sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
      controlPointId: "HZMB_HK_PORT",
      controlPointName: "Hong Kong-Zhuhai-Macao Bridge (HZMB) Hong Kong Port",
      timestampHkt: "2026-11-21T10:30:00+08:00",
      visitorClearanceWaitMinutes: 38,
      waitBandLabel: "Congested (30–45+ min)",
      hkoTropicalCycloneSignal: "None",
      serviceOperatingStatus: "Operating normally",
    },
    {
      isSample: true,
      sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
      controlPointId: "SHEUNG_WAN_MACAU_FERRY",
      controlPointName: "Hong Kong-Macau Ferry Terminal (Sheung Wan Shun Tak Centre)",
      timestampHkt: "2026-11-21T10:30:00+08:00",
      visitorClearanceWaitMinutes: 14,
      waitBandLabel: "Normal (< 15 min)",
      hkoTropicalCycloneSignal: "None",
      serviceOperatingStatus: "Operating normally",
    },
  ],
  typhoon_signal_8: [
    {
      isSample: true,
      sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
      controlPointId: "HZMB_HK_PORT",
      controlPointName: "Hong Kong-Zhuhai-Macao Bridge (HZMB) Hong Kong Port",
      timestampHkt: "2026-09-14T14:00:00+08:00",
      visitorClearanceWaitMinutes: 0,
      waitBandLabel: "Normal (< 15 min)",
      hkoTropicalCycloneSignal: "Signal No. 8 (Suspension)",
      serviceOperatingStatus: "Suspended",
    },
    {
      isSample: true,
      sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
      controlPointId: "SHEUNG_WAN_MACAU_FERRY",
      controlPointName: "Hong Kong-Macau Ferry Terminal (Sheung Wan Shun Tak Centre)",
      timestampHkt: "2026-09-14T14:00:00+08:00",
      visitorClearanceWaitMinutes: 0,
      waitBandLabel: "Normal (< 15 min)",
      hkoTropicalCycloneSignal: "Signal No. 8 (Suspension)",
      serviceOperatingStatus: "Suspended",
    },
  ],
};

export interface HongKongMacaoQualifiedOption {
  optionId: string;
  mode: "hzmb_shuttle_bus" | "high_speed_ferry" | "cross_boundary_private_mpv";
  title: string;
  licensedOperatorName: string;
  regulatoryPermitBasis: string;
  departureAndArrivalPoints: string;
  crossingDurationMinutes: number;
  priceHkdLabel: string;
  priceMopAndUsdNote: string;
  luggageAndPassengerRules: string;
  delayAndClosureRefundPolicy: string;
  bookingOrWhatsappChannelLabel: string;
  /**
   * Verified official booking link when backed by a dated source (`verifiedOnDate` + `sourceUrl`);
   * `null` for private MPV operators whose permit numbers, HKD tariffs, and WhatsApp links are pending operator confirmation in the Review Desk.
   */
  bookingOrWhatsappHref: string | null;
  reviewDeskFactId: string | null;
  pricingVerificationGate: DatedSourceOrOperatorConfirmationGate;
  permitVerificationGate: DatedSourceOrOperatorConfirmationGate;
  refundTermsVerificationGate: DatedSourceOrOperatorConfirmationGate;
  bookingLinkVerificationGate: DatedSourceOrOperatorConfirmationGate;
}

export const HONG_KONG_MACAO_QUALIFIED_OPTIONS: HongKongMacaoQualifiedOption[] = [
  {
    optionId: "hzmb-gold-bus-shuttle",
    mode: "hzmb_shuttle_bus",
    title: "HZMB 24-Hour Shuttle Bus ('Gold Bus' — Port-to-Port across Bridge)",
    licensedOperatorName:
      "Hong Kong-Zhuhai-Macao Bridge Shuttle Bus Co., Ltd. (Official Joint-Venture Franchise)",
    regulatoryPermitBasis:
      "Three-Government HZMB Authority Statutory Cross-Boundary Shuttle Franchise (TD Hong Kong / DSAT Macao)",
    departureAndArrivalPoints:
      "HZMB Hong Kong Port ( adjacent to HKIA Lantau) → HZMB Macao Port Frontier Building",
    crossingDurationMinutes: 45,
    priceHkdLabel:
      "HK$65 daytime (06:00–23:59) / HK$70 nighttime (00:00–05:59) per adult (Official HZMB Shuttle statutory fare, verified 2026-11-07)",
    priceMopAndUsdNote:
      "Concessionary fare (Child <12 / Senior 65+): HK$33 day / HK$35 night (verified on hzmbus.com 2026-11-07)",
    luggageAndPassengerRules:
      "Strict 1 piece of luggage per passenger (max 76 cm × 51 cm × 32 cm, max 20 kg). Passengers must clear HK Immigration & Customs on foot, board the Gold Bus, and clear Macao Immigration on foot.",
    delayAndClosureRefundPolicy:
      "Departs every 5–15 minutes 24/7; unused date-specific QR tickets are refundable before expiry, and 100% automatically refunded if HZMB closes for HKO Typhoon Signal No. 8.",
    bookingOrWhatsappChannelLabel:
      "Official HZMB Shuttle Portal (hzmbus.com — Dated Statutory Source)",
    bookingOrWhatsappHref: "https://www.hzmbus.com/",
    reviewDeskFactId: null,
    pricingVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "published_price",
      proposedValue:
        "HK$65 daytime / HK$70 nighttime per adult (Official HZMB Shuttle tariff)",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.hzmbus.com/",
      pendingFallbackLabel: "Pending dated source",
    }),
    permitVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "permit",
      proposedValue:
        "Three-Government HZMB Authority Statutory Cross-Boundary Shuttle Franchise",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.hzmbus.com/",
      pendingFallbackLabel: "Pending dated source",
    }),
    refundTermsVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "refund_terms",
      proposedValue:
        "100% automatic ticket refund when HZMB suspends service for Typhoon Signal No. 8",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.hzmbus.com/",
      pendingFallbackLabel: "Pending dated source",
    }),
    bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "booking_or_whatsapp_link",
      proposedValue: "https://www.hzmbus.com/",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.hzmbus.com/",
      pendingFallbackLabel: "Pending dated source",
    }),
  },
  {
    optionId: "cotai-water-jet-turbojet-ferry",
    mode: "high_speed_ferry",
    title: "High-Speed Catamaran Ferry (Cotai Water Jet / TurboJET — Central HK ↔ Taipa/Outer Harbour)",
    licensedOperatorName:
      "Cotai Ferry Co. Ltd. (Cotai Water Jet) & Shun Tak-China Travel Ship Management Ltd. (TurboJET)",
    regulatoryPermitBasis:
      "Hong Kong Marine Department & Macao Marine and Water Bureau (DSAMA) Licensed Cross-Boundary High-Speed Passenger Ferry",
    departureAndArrivalPoints:
      "Sheung Wan Hong Kong-Macau Ferry Terminal (Shun Tak Centre) → Macau Taipa Ferry Terminal (Cotai Strip) or Macau Outer Harbour",
    crossingDurationMinutes: 60,
    priceHkdLabel:
      "HK$175 Weekday Economy / HK$190 Weekend & Holiday / HK$220 Night Sailing; Cotai First VIP Cabin HK$310–HK$335 (Published ferry tariff, verified 2026-11-07)",
    priceMopAndUsdNote:
      "Direct downtown-to-Cotai Strip crossing; published schedule & tariff verified on cotaiwaterjet.com 2026-11-07",
    luggageAndPassengerRules:
      "1 free hand-carry (max 20 kg, 60×20×35 cm); checked bags 20–40 kg accepted at HK$25–HK$45 per bag with pierside baggage handling.",
    delayAndClosureRefundPolicy:
      "Arrive at Sheung Wan gate 30 minutes before sailing (immigration closes 10m prior). Sailings suspend when HKO issues Typhoon Signal No. 8; full ticket refund or free rebooking within 30 days on Signal No. 8 suspension.",
    bookingOrWhatsappChannelLabel:
      "Official Cotai Water Jet Ticketing (cotaiwaterjet.com — Dated Source)",
    bookingOrWhatsappHref: "https://www.cotaiwaterjet.com/",
    reviewDeskFactId: null,
    pricingVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "published_price",
      proposedValue:
        "HK$175 Weekday Economy / HK$190 Weekend / HK$220 Night Sailing",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.cotaiwaterjet.com/",
      pendingFallbackLabel: "Pending dated source",
    }),
    permitVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "permit",
      proposedValue:
        "HK Marine Department & Macao DSAMA Licensed High-Speed Passenger Ferry",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.cotaiwaterjet.com/",
      pendingFallbackLabel: "Pending dated source",
    }),
    refundTermsVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "refund_terms",
      proposedValue:
        "Full refund or 30-day free rebooking when sailings suspend for Typhoon Signal No. 8",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.cotaiwaterjet.com/",
      pendingFallbackLabel: "Pending dated source",
    }),
    bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "booking_or_whatsapp_link",
      proposedValue: "https://www.cotaiwaterjet.com/",
      verifiedOnDate: "2026-11-07",
      sourceUrl: "https://www.cotaiwaterjet.com/",
      pendingFallbackLabel: "Pending dated source",
    }),
  },
  {
    optionId: "hk-macao-cross-boundary-private-mpv",
    mode: "cross_boundary_private_mpv",
    title: "Door-to-Door Dual-Plate Private 6-Pax Alphard/Vellfire MPV (HK Hotel/Airport → Macao Hotel)",
    licensedOperatorName:
      "Licensed HK–Macao Cross-Boundary Chauffeur Operator (Pending operator confirmation in Review Desk)",
    regulatoryPermitBasis:
      "Requires HK Transport Department Closed Road Permit (CRP) + Macao DSAT Cross-Boundary Hire Car Quota + Guangdong/Macao/HK dual-plate registration — specific operator permit numbers queued in Review Desk (`mc-hkm-cross-boundary-mpv-permit-pricing-and-booking-20261107`).",
    departureAndArrivalPoints:
      "Any Hong Kong Hotel or HKIA Terminal 1 Curbside → Direct across HZMB → Any Macao Peninsula or Cotai Strip Resort",
    crossingDurationMinutes: 75,
    priceHkdLabel:
      "HKD tariff pending operator confirmation / dated source (Queued in Review Desk)",
    priceMopAndUsdNote:
      "Commercial HKD private MPV tariff withheld until operator confirmation and CRP/DSAT permit verification are approved in Review Desk.",
    luggageAndPassengerRules:
      "Strict 6-passenger legal maximum per MPV; up to 4 large suitcases (28\") + 2 carry-ons (or 5 passengers + 5 large suitcases). Passengers clear drive-through car-channel immigration.",
    delayAndClosureRefundPolicy:
      "Pending operator confirmation in Review Desk: HKIA arrival wait grace window, overtime rate, and Typhoon Signal No. 8 refund terms require written operator confirmation before publishing as a guaranteed policy.",
    bookingOrWhatsappChannelLabel:
      "Booking & WhatsApp link pending operator confirmation in Review Desk (placeholder link withheld)",
    bookingOrWhatsappHref: null,
    reviewDeskFactId:
      "mc-hkm-cross-boundary-mpv-permit-pricing-and-booking-20261107",
    pricingVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "published_price",
      proposedValue: null,
      reviewDeskFactId:
        "mc-hkm-cross-boundary-mpv-permit-pricing-and-booking-20261107",
      pendingFallbackLabel:
        "Pending operator confirmation / dated source in Review Desk (mc-hkm-cross-boundary-mpv-permit-pricing-and-booking-20261107)",
    }),
    permitVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "permit",
      proposedValue: null,
      reviewDeskFactId:
        "mc-hkm-cross-boundary-mpv-permit-pricing-and-booking-20261107",
      pendingFallbackLabel:
        "HK TD Closed Road Permit (CRP) + Macao DSAT quota number pending operator confirmation in Review Desk",
    }),
    refundTermsVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "refund_terms",
      proposedValue: null,
      reviewDeskFactId:
        "mc-hkm-cross-boundary-mpv-permit-pricing-and-booking-20261107",
      pendingFallbackLabel:
        "HKIA wait window & T8 bridge closure refund terms pending operator confirmation in Review Desk",
    }),
    bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
      fieldCategory: "booking_or_whatsapp_link",
      proposedValue: null,
      reviewDeskFactId:
        "mc-hkm-cross-boundary-mpv-permit-pricing-and-booking-20261107",
      pendingFallbackLabel:
        "Verified booking / WhatsApp link pending operator confirmation in Review Desk (unverified wa.me placeholder removed)",
    }),
  },
];

export interface HongKongMacaoCorridorRecheckResult {
  corridorId: "hong-kong-to-macao";
  isSampleTelemetry: true;
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry";
  scenarioKey: string;
  originArea: "HKIA_LANTAU" | "CENTRAL_KOWLOON";
  partySize: number;
  largeBags: number;
  recommendedOptionId: string;
  recheckCard: CompactTripRecheckCardModel;
  checkpoints: HongKongCheckpointWaitTelemetry[];
}

export function evaluateHongKongMacaoCorridorRecheck(params?: {
  scenario?: "normal_weekday" | "weekend_peak_hzmb_queue" | "typhoon_signal_8";
  originArea?: "HKIA_LANTAU" | "CENTRAL_KOWLOON";
  partySize?: number;
  largeBags?: number;
}): HongKongMacaoCorridorRecheckResult {
  const scenario = params?.scenario || "normal_weekday";
  const originArea = params?.originArea || "CENTRAL_KOWLOON";
  const partySize = Math.max(1, Math.round(params?.partySize || 4));
  const largeBags = Math.max(0, Math.round(params?.largeBags ?? 4));

  const checkpoints = HONG_KONG_MACAO_SAMPLE_TELEMETRY[scenario];
  const hzmbCp = checkpoints[0];
  const ferryCp = checkpoints[1];

  const isTyphoonSuspended =
    hzmbCp.serviceOperatingStatus === "Suspended" ||
    ferryCp.serviceOperatingStatus === "Suspended";

  let recommendedOptionId = "cotai-water-jet-turbojet-ferry";
  if (originArea === "HKIA_LANTAU" || largeBags <= partySize) {
    if (scenario === "weekend_peak_hzmb_queue" && originArea === "CENTRAL_KOWLOON") {
      recommendedOptionId = "cotai-water-jet-turbojet-ferry";
    } else if (originArea === "HKIA_LANTAU") {
      recommendedOptionId = "hzmb-gold-bus-shuttle";
    }
  }

  const whatChanged = isTyphoonSuspended
    ? `[Sample Scenario] Hong Kong Observatory (HKO) Tropical Cyclone Signal No. 8 active (${hzmbCp.timestampHkt}): BOTH HZMB Bridge crossings and Sheung Wan High-Speed Ferries are SUSPENDED.`
    : scenario === "weekend_peak_hzmb_queue"
      ? `[Sample Scenario] Weekend peak at HZMB HK Port (${hzmbCp.timestampHkt}): sample passenger hall wait is ${hzmbCp.visitorClearanceWaitMinutes} min (${hzmbCp.waitBandLabel}), vs. ${ferryCp.visitorClearanceWaitMinutes} min at Sheung Wan Macau Ferry Terminal.`
      : `[Sample Scenario] Cross-boundary checkpoints operating normally in sample scenario (${hzmbCp.timestampHkt}): HZMB HK Port sample wait ${hzmbCp.visitorClearanceWaitMinutes} min · Sheung Wan Ferry Terminal sample wait ${ferryCp.visitorClearanceWaitMinutes} min.`;

  const whatStillFits = isTyphoonSuspended
    ? `[Sample Scenario] 0 cross-boundary departures operate while HKO Signal No. 8 is hoisted. Hold in Hong Kong; HZMB Gold Bus and Cotai Water Jet / TurboJET provide full statutory ticket refunds on Signal No. 8 suspensions.`
    : recommendedOptionId === "cotai-water-jet-turbojet-ferry"
      ? `[Sample Scenario] For ${partySize} travelers (${largeBags} bags) from Central/Kowloon, Cotai Water Jet / TurboJET (HK$175–HK$190 Economy, verified 2026-11-07) avoids the ${hzmbCp.visitorClearanceWaitMinutes}-min sample HZMB hall queue and delivers you directly to Taipa/Cotai in 60 min.`
      : `[Sample Scenario] From Lantau / HKIA, the 24/7 HZMB Gold Bus (HK$65 day / HK$70 night, 1 bag max 20 kg per person, verified 2026-11-07) fits cleanly. Dual-plate Private MPV HKD pricing & CRP/DSAT permit verification are pending in the Review Desk.`;

  const primaryLabel = isTyphoonSuspended
    ? "Check Official HKO Warning & Review Desk Status →"
    : recommendedOptionId === "cotai-water-jet-turbojet-ferry"
      ? "Compare Verified Cotai Water Jet Ferry vs. HZMB Options →"
      : "Compare Verified HZMB Gold Bus vs. Ferry & Review Desk Items →";

  const primaryHref = `/routes/hong-kong-to-macao?scenario=${scenario}&origin=${originArea}&passengers=${partySize}&bags=${largeBags}`;

  return {
    corridorId: "hong-kong-to-macao",
    isSampleTelemetry: true,
    sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
    scenarioKey: scenario,
    originArea,
    partySize,
    largeBags,
    recommendedOptionId,
    recheckCard: {
      corridorId: "hong-kong-to-macao",
      whatChanged,
      whatStillFits,
      nextStep: `${primaryLabel.replace(" →", "")} (Checkpoint wait times shown as Sample scenarios; private MPV commercial terms queued in Review Desk).`,
      primaryNextActionLabel: primaryLabel,
      primaryNextActionHref: primaryHref,
    },
    checkpoints,
  };
}

// ============================================================================
// Backward-Compatible Exports for Test Suite 100
// ============================================================================

export const SEPARATED_ICELAND_TRIPS = [
  {
    tripId: "rkv-domestic-airport",
    title: "Reykjavík Domestic Airport (RKV)",
    reasonSeparated:
      "RKV is 2 km from downtown Reykjavík (domestic/Greenland/Faroe flights), whereas KEF is 50 km southwest on Reykjanes Peninsula.",
  },
  {
    tripId: "golden-circle-day-loop",
    title: "Golden Circle (Þingvellir, Geysir, Gullfoss)",
    reasonSeparated:
      "Uses Routes 36/37/35 inland rather than the Route 1 South Coast corridor to Vík.",
  },
  {
    tripId: "blue-lagoon-grindavik",
    title: "Blue Lagoon (Route 43 / Grindavíkurvegur)",
    reasonSeparated:
      "Subject to separate Reykjanes volcanic/seismic hazard zones and timed entry slots.",
  },
  {
    tripId: "solheimajokull-katla-glacier-excursions",
    title: "Glacier Hike & Ice Cave Excursions (Sólheimajökull / Mýrdalsjökull)",
    reasonSeparated:
      "Activity-specific guide and crampon/super-jeep equipment rules evaluated separately from point-to-point transport.",
  },
] as const;

export const KEF_TO_VIK_DATE_ROAD_SAMPLES = {
  open_winter_spots_of_ice: ICELAND_KEF_VIK_SAMPLE_TELEMETRY.normal_winter_patches,
  hellisheidi_closed_rengsli_open:
    ICELAND_KEF_VIK_SAMPLE_TELEMETRY.hellisheidi_closed_rengsli_diversion,
  eyjafjoll_closed_red_wind:
    ICELAND_KEF_VIK_SAMPLE_TELEMETRY.eyjafjoll_full_closure,
} as const;

export const KEF_VIK_SAMPLE_TRIP_FITS = {
  isSample: true as const,
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry" as const,
  fitStatus: "fits_confirmed_vehicle" as const,
  hasActiveRoadClosure: false,
};

export const KEF_VIK_SAMPLE_TRIP_NEEDS_VERIFICATION = {
  isSample: true as const,
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry" as const,
  fitStatus: "blocked_by_road_closure" as const,
  hasActiveRoadClosure: true,
};

export const TAJ_MAHAL_OFFICIAL_RULES = {
  officialUrl: "https://www.tajmahal.gov.in/visiting-hours.aspx",
  closedDayOfWeek: TAJ_MAHAL_VISITING_RULES.weeklyClosureDay,
  ticketValidityDurationMinutes: 180,
  openingNote: TAJ_MAHAL_VISITING_RULES.sunriseToSunsetWindowNote,
} as const;

export const DELHI_AGRA_MACHINE_FEEDS = [
  {
    feedId: "imd-agra-fog",
    authority: "India Meteorological Department (IMD)",
    url: "https://api.imd.gov.in/public/",
    status: "pending_approved_machine_access" as const,
  },
  {
    feedId: "cris-ntes-rail",
    authority: "CRIS National Train Enquiry System (NTES)",
    url: "https://cris.org.in/loadpage?page=proNTES",
    status: "pending_approved_machine_access" as const,
  },
] as const;

export const DELHI_AGRA_QUALIFIED_OPERATORS = [
  {
    operatorId: "irctc-gatimaan-12002",
    name: "IRCTC 12050 Gatimaan Express (Official Published Tariff)",
    priceInr: 1485,
    verifiedOnDate: "2026-11-07",
    sourceUrl: "https://www.irctc.co.in/nget/train-search",
  },
] as const;

export function evaluateDelhiAgraTajVisit(input: {
  date: string;
  trainNumberAndName?: string;
  scheduledArrivalAgc: string;
  revisedArrivalAgc?: string;
  partySize?: number;
  isExampleScenario?: boolean;
}) {
  const dayOfWeek = new Date(`${input.date}T00:00:00Z`).getUTCDay();
  const isFridayClosed = dayOfWeek === 5;
  const scheduledParts = input.scheduledArrivalAgc.split(":").map(Number);
  const revisedParts = (input.revisedArrivalAgc || input.scheduledArrivalAgc)
    .split(":")
    .map(Number);
  const scheduledMins = (scheduledParts[0] || 0) * 60 + (scheduledParts[1] || 0);
  const revisedMins = (revisedParts[0] || 0) * 60 + (revisedParts[1] || 0);
  const delayMinutes = Math.max(0, revisedMins - scheduledMins);
  const recheck = evaluateDelhiAgraCorridorRecheck({
    date: input.date,
    scheduledArrivalLocal: input.scheduledArrivalAgc,
    absoluteEta: input.revisedArrivalAgc || null,
    trainDelayMinutes: delayMinutes,
    partySize: input.partySize || 2,
    isExampleScenario: input.isExampleScenario ?? false,
  });
  return {
    isFridayClosed,
    fitVerdict: isFridayClosed
      ? ("closed_on_friday" as const)
      : recheck.dcc412Recheck.nextCatchableDeparture !== null
        ? ("fits_visit_window" as const)
        : ("needs_verification_or_reschedule" as const),
    recheck,
  };
}

export const DELHI_AGRA_SAMPLE_TRIP_FITS = evaluateDelhiAgraTajVisit({
  date: "2026-12-10",
  scheduledArrivalAgc: "09:50",
  revisedArrivalAgc: "10:32",
  partySize: 2,
  isExampleScenario: true,
});

export const DELHI_AGRA_SAMPLE_TRIP_NEEDS_VERIFICATION = {
  isFridayClosed: false,
  fitVerdict: "needs_verification_or_reschedule" as const,
};

export const HZMB_TRANSPORT_OPTIONS = [
  {
    optionId: "hzmb-gold-bus-shuttle",
    regulatorySourceUrl: "https://www.hzmbus.com/",
  },
  {
    optionId: "hk-macao-cross-boundary-private-mpv",
    regulatorySourceUrl:
      "https://www.td.gov.hk/en/transport_in_hong_kong/land_based_cross_boundary_transport/enquiries_on_cross_boundary_hire_car_service/index.html",
  },
] as const;

export const HK_IMMD_CHECKPOINT_WAIT_SAMPLES = {
  normal_weekday_visitor: {
    isSample: true as const,
    sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry" as const,
    sourceDatasetUrl:
      "https://data.gov.hk/en-data/dataset/hk-immd-set28-land-boundary-control-points-waiting-time",
    telemetry: HONG_KONG_MACAO_SAMPLE_TELEMETRY.normal_weekday[0],
  },
} as const;

export const HK_MACAO_SIX_FACTOR_ENTRY_MODEL = [
  "1. Passport Nationality & Remaining Validity (Macao CPSP 30/90-day rule vs. HK ImmD)",
  "2. Direction of Crossing (HK → Macao outbound vs. Macao → HK re-entry)",
  "3. Traveler Category (HK Resident e-Channel vs. International Visitor counter)",
  "4. Selected Crossing Mode (HZMB Gold Bus passenger hall vs. Dual-Plate MPV car channel vs. Ferry)",
  "5. Luggage Count & Dimensions (HZMB Gold Bus 1-bag 20 kg rule vs. MPV 6-pax / 4-bag limit)",
  "6. Active HKO Tropical Cyclone / Strong Wind Signal (Signal No. 8 suspension threshold)",
] as const;

export const SHENZHEN_SEPARATE_ROUTE_NOTICE = {
  explanation:
    "Shenzhen / Mainland China (Lo Wu, Lok Ma Chau, West Kowloon High-Speed Rail, and Shenzhen Bay) is a separate Mainland China immigration boundary and is never mixed with the Hong Kong–Macao SAR corridor.",
} as const;

export const HK_MACAO_MOBILE_CHANNELS = {
  amapRouteHref:
    "https://uri.amap.com/navigation?from=113.9451,22.3168,HZMB+HK+Port&to=113.5756,22.2017,HZMB+Macau+Port&mode=car&callnative=0",
  whatsappConciergeHref:
    "https://wa.me/?text=Pending_Review_Desk_Operator_Confirmation",
  whatsappVerificationStatus: "pending_operator_confirmation_in_review_desk" as const,
} as const;

export const HK_MACAO_SAMPLE_TRIP_FITS = {
  isSample: true as const,
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry" as const,
  entryAndPermitStatus: "ready_to_cross" as const,
  privateHireIncludesImmigrationNote:
    "Authorized cross-boundary private hire STILL includes mandatory immigration and customs inspection at both HK and Macao ports.",
};

export const HK_MACAO_SAMPLE_TRIP_NEEDS_VERIFICATION = {
  isSample: true as const,
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry" as const,
  entryAndPermitStatus: "verify_entry_or_vehicle_permit" as const,
};

export const HREYFILL_REYKJAVIK_SHORE_EXCURSION_QUALIFICATION = {
  operatorId: "hreyfill-reykjavik",
  brandName: "Hreyfill (Hreyfill Taxi & Private Sightseeing Tours)",
  officialWebsiteUrl: "https://www.hreyfill.is/en/private-tours/",
  portSlug: "reykjavik",
  viatorDestinationId: 905,
  reviewDeskFactId: "mc-ice-hreyfill-golden-circle-south-coast-bokun-links-20261107",
  status: "pending_operator_reply_and_bokun_link_confirmation" as const,
  trackedBokunLinksConfirmed: false,
  directCatalogImportEnabled: false,
  candidateTours: [
    {
      tourSlug: "hreyfill-golden-circle-private-tour",
      title: "Hreyfill Private Golden Circle Tour from Reykjavík (Skarfabakki / Miðbakki Pier Pickup)",
      durationMinutes: 390,
      bokunBookingChannelStatus: "pending_operator_reply_and_tracked_bokun_link_confirmation" as const,
      confirmedTrackedBokunUrl: null,
    },
    {
      tourSlug: "hreyfill-south-coast-private-tour",
      title: "Hreyfill Private South Coast Tour from Reykjavík (Seljalandsfoss, Skógafoss & Reynisfjara)",
      durationMinutes: 540,
      bokunBookingChannelStatus: "pending_operator_reply_and_tracked_bokun_link_confirmation" as const,
      confirmedTrackedBokunUrl: null,
    },
  ],
  bookingLinkVerificationGate: verifyDatedSourceOrOperatorConfirmation({
    fieldCategory: "booking_or_whatsapp_link",
    proposedValue: null,
    reviewDeskFactId: "mc-ice-hreyfill-golden-circle-south-coast-bokun-links-20261107",
    pendingFallbackLabel:
      "Pending Hreyfill operator reply & confirmation of exact tracked Bókun checkout links for Golden Circle and South Coast tours",
  }),
} as const;

// ============================================================================
// 4. PERU: Cusco / Ollantaytambo → Aguas Calientes → Machu Picchu Qualification
// ============================================================================

export interface MachuPicchuCorridorQualificationRecord {
  corridorId: "cusco-ollantaytambo-machu-picchu";
  clusterId: "peru-machu-picchu";
  portSlug: "machu-picchu";
  corridorType: "multi_modal_rail_bus_timed_sanctuary_entry";
  title: string;
  ianaTimeZone: "America/Lima";
  status: "in_qualification";
  publicationAllowed: false;
  checkoutEnabled: false;
  holdReason: string;
  places: {
    cuscoOrPoroyHub: {
      placeId: "dcc:place:pe-cuz-san-pedro-poroy-station";
      name: string;
      role: "origin_rail_or_bimodal_hub";
      ianaTimeZone: "America/Lima";
    };
    ollantaytamboStation: {
      placeId: "dcc:place:pe-oll-rail-station";
      name: string;
      role: "sacred_valley_rail_interchange";
      ianaTimeZone: "America/Lima";
    };
    aguasCalientesPueblo: {
      placeId: "dcc:place:pe-agu-machu-picchu-pueblo";
      name: string;
      role: "rail_arrival_and_consettur_bus_boarding";
      ianaTimeZone: "America/Lima";
    };
    machuPicchuLlaqtaGate: {
      placeId: "dcc:place:pe-map-llaqta-entry-gate";
      name: string;
      role: "destination_timed_circuit_cutoff_gate";
      ianaTimeZone: "America/Lima";
    };
  };
  officialSources: InternationalCorridorOfficialSource[];
  localRulesAndGates: {
    minculTimedCircuitRule: string;
    bimodalRainySeasonRule: string;
    railCarryOnLuggageRule: string;
    consetturBusAscentBufferRule: string;
  };
  pendingReviewDeskItems: RawResearchDeskFactRow[];
}

export const MACHU_PICCHU_CORRIDOR_QUALIFICATION: MachuPicchuCorridorQualificationRecord = {
  corridorId: "cusco-ollantaytambo-machu-picchu",
  clusterId: "peru-machu-picchu",
  portSlug: "machu-picchu",
  corridorType: "multi_modal_rail_bus_timed_sanctuary_entry",
  title:
    "Cusco / Ollantaytambo → Aguas Calientes → Machu Picchu Llaqta Sanctuary (Multi-Modal Rail + Consettur Bus + Timed Entry)",
  ianaTimeZone: "America/Lima",
  status: "in_qualification",
  publicationAllowed: false,
  checkoutEnabled: false,
  holdReason:
    "Corridor is in qualification (`status: 'in_qualification'`, `publicationAllowed: false`, `checkoutEnabled: false`) until PeruRail/Inca Rail bimodal schedule & 5 kg/8 kg baggage enforcement, Consettur Aguas Calientes bus queue buffers, and Ministerio de Cultura (TuBoleto) Circuits 1/2/3 timed entry tolerance rules are human-verified in the Review Desk.",
  places: {
    cuscoOrPoroyHub: {
      placeId: "dcc:place:pe-cuz-san-pedro-poroy-station",
      name: "Cusco San Pedro / Poroy & Wanchaq Bimodal Hub",
      role: "origin_rail_or_bimodal_hub",
      ianaTimeZone: "America/Lima",
    },
    ollantaytamboStation: {
      placeId: "dcc:place:pe-oll-rail-station",
      name: "Ollantaytambo Sacred Valley Rail Station",
      role: "sacred_valley_rail_interchange",
      ianaTimeZone: "America/Lima",
    },
    aguasCalientesPueblo: {
      placeId: "dcc:place:pe-agu-machu-picchu-pueblo",
      name: "Aguas Calientes (Machu Picchu Pueblo) Station & Consettur Bus Terminal",
      role: "rail_arrival_and_consettur_bus_boarding",
      ianaTimeZone: "America/Lima",
    },
    machuPicchuLlaqtaGate: {
      placeId: "dcc:place:pe-map-llaqta-entry-gate",
      name: "Machu Picchu Llaqta Sanctuary Control Gate (Circuits 1, 2, 3)",
      role: "destination_timed_circuit_cutoff_gate",
      ianaTimeZone: "America/Lima",
    },
  },
  officialSources: [
    {
      sourceId: "mincul-tuboleto",
      authorityName:
        "Ministerio de Cultura del Perú — Dirección Desconcentrada de Cultura de Cusco (TuBoleto)",
      purpose:
        "Official Machu Picchu Llaqta timed circuit tickets (Circuits 1, 2, 3) and gate tolerance rules",
      officialUrl: "https://tuboleto.cultura.pe/",
    },
    {
      sourceId: "consettur-machupicchu",
      authorityName: "Consettur Machupicchu S.A.C.",
      purpose:
        "Official Aguas Calientes → Machu Picchu Llaqta switchback shuttle bus (30-min ascent)",
      officialUrl: "https://comprar.consettur.com/",
    },
    {
      sourceId: "perurail-official",
      authorityName: "PeruRail S.A.",
      purpose:
        "Ollantaytambo / Poroy → Machu Picchu Pueblo train schedules, bimodal service, and 5 kg / 8 kg baggage policy",
      officialUrl: "https://www.perurail.com/",
    },
    {
      sourceId: "incarail-official",
      authorityName: "Inca Rail S.A.",
      purpose:
        "Ollantaytambo → Machu Picchu Pueblo train schedules, bimodal bus+train service, and baggage policy",
      officialUrl: "https://incarail.com/",
    },
  ],
  localRulesAndGates: {
    minculTimedCircuitRule:
      "Ministerio de Cultura enforces strict timed entry hours on Circuits 1, 2, and 3 (45-minute gate tolerance in low season, 30-minute tolerance in high season; original physical passport matching ticket name required).",
    bimodalRainySeasonRule:
      "During Andean rainy season (January 2 – April 30), Cusco Poroy / San Pedro rail tracks close for safety; all Cusco departures operate as Bimodal Service (bus Cusco → Ollantaytambo + train Ollantaytambo → Aguas Calientes).",
    railCarryOnLuggageRule:
      "PeruRail and Inca Rail enforce a strict 1 carry-on bag limit (5 kg / 11 lb to 8 kg / 17.6 lb max, 157 linear cm); full-size suitcases must be stored at Cusco/Sacred Valley hotels or Ollantaytambo station lockers.",
    consetturBusAscentBufferRule:
      "Allow 15 minutes from Aguas Calientes train arrival to Consettur bus queue + 20–45 minutes boarding queue (by circuit hour) + 30 minutes Hiram Bingham switchback bus ascent to the Llaqta control gate.",
  },
  pendingReviewDeskItems: getReviewDeskItemsForInternationalCorridor(
    "peru-machu-picchu",
  ),
};

export function evaluateMachuPicchuCorridorQualification() {
  const reviewDeskRows = getReviewDeskItemsForInternationalCorridor(
    "peru-machu-picchu",
  );
  const evaluatedFacts = reviewDeskRows.map((row) =>
    evaluateResearchFactRecord(row),
  );
  const allVerified =
    evaluatedFacts.length > 0 && evaluatedFacts.every((f) => f.verified);

  return {
    ...MACHU_PICCHU_CORRIDOR_QUALIFICATION,
    status: "in_qualification" as const,
    publicationAllowed: false as const,
    checkoutEnabled: false as const,
    allReviewDeskItemsVerified: allVerified,
    evaluatedReviewDeskFacts: evaluatedFacts,
  };
}


