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
  evaluateSyntheticDelhiAgraDcc412Test,
  type Dcc412ItineraryRecheckResult,
} from "@/lib/dcc/sharedTripRecheck";
import {
  INTERNATIONAL_CORRIDOR_REVIEW_DESK_CANDIDATE_BASELINE,
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
  cluster: "iceland-kef-vik" | "india-delhi-agra" | "china-hk-macao",
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

export interface IcelandCorridorRecheckResult {
  corridorId: "iceland-kef-to-vik";
  isSampleTelemetry: true;
  sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry";
  scenarioKey: string;
  departureBlockedByClosure: boolean;
  operatorConfirmedAlternateRoute: string | null;
  operatorConfirmedLaterDepartureLocal: string | null;
  recommendedVehicleClass: string;
  recheckCard: CompactTripRecheckCardModel;
  telemetry: IcelandCorridorTelemetryState;
}

export function evaluateIcelandKefVikCorheck(params?: {
  scenario?:
    | "normal_winter_patches"
    | "hellisheidi_closed_rengsli_diversion"
    | "eyjafjoll_full_closure";
  partySize?: number;
  checkedBags?: number;
  flightEtaLocal?: string;
  operatorConfirmedRengsliAlternate?: boolean;
  operatorConfirmedLaterDepartureLocal?: string | null;
}): IcelandCorridorRecheckResult {
  const scenario = params?.scenario || "normal_winter_patches";
  const partySize = Math.max(1, Math.round(params?.partySize || 4));
  const checkedBags = Math.max(0, Math.round(params?.checkedBags ?? 4));
  const flightEtaLocal = params?.flightEtaLocal || "06:45";
  const operatorConfirmedRengsliAlternate =
    params?.operatorConfirmedRengsliAlternate ?? true;
  const operatorConfirmedLaterDepartureLocal =
    params?.operatorConfirmedLaterDepartureLocal ?? null;

  const telemetry = ICELAND_KEF_VIK_SAMPLE_TELEMETRY[scenario];
  const hasClosedSegment = telemetry.segments.some(
    (s) =>
      s.closureStatus === "closed_lokad" ||
      s.closureStatus === "impassable_ofaert",
  );

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

  const whatChanged = isEyjafjollClosed
    ? `[Sample Scenario] Vegagerðin DATEX II segment VG-R01-SEL-VIK (Route 1 Under Eyjafjöllum → Vík) is CLOSED (LOKAÐ) at ${telemetry.checkedAtUtc}; IMO Red/Orange wind warning (>38 m/s gusts) active.`
    : isHellisheidiClosed
      ? `[Sample Scenario] Vegagerðin DATEX II segment VG-R01-HEI-HVE (Route 1 Hellisheiði Pass) is CLOSED (LOKAÐ) at ${telemetry.checkedAtUtc}; IMO Orange blizzard warning active on upper pass.`
      : `[Sample Scenario] KEF arrival ${flightEtaLocal} GMT (${partySize} pax, ${checkedBags} bags): Route 41 & Route 1 (KEF → Hellisheiði → Vík) are OPEN in sample Vegagerðin scenario (${telemetry.checkedAtUtc}) with localized ice patches (Hálkublettir) and IMO Yellow wind advisory.`;

  const whatStillFits = isEyjafjollClosed
    ? operatorConfirmedLaterDepartureLocal
      ? `[Sample Scenario] Immediate KEF → Vík departure is blocked by the Route 1 Eyjafjöll closure; operator-confirmed later departure at ${operatorConfirmedLaterDepartureLocal} GMT is available once Vegagerðin reopens the barrier.`
      : `[Sample Scenario] Affected KEF → Vík departure is BLOCKED (no road bypass exists east of Markarfljót). Do not self-drive; stage in Reykjavík/Selfoss until Vegagerðin reopens Route 1.`
    : isHellisheidiClosed && operatorConfirmedAlternateRoute
      ? `[Sample Scenario] Direct Hellisheiði pass is blocked, but ${recommendedVehicleClass} fits via operator-confirmed alternate route: ${operatorConfirmedAlternateRoute}.`
      : `[Sample Scenario] ${recommendedVehicleClass} fits your group of ${partySize} (${checkedBags} bags) for the ~2h 45m (225 km) KEF → Vík transfer (ISK pricing & KEF wait policy pending operator confirmation in Review Desk).`;

  const primaryLabel = departureBlockedByClosure
    ? "Stage in Reykjavík & Check Review Desk Qualification Status →"
    : `Review KEF → Vík Qualification & Open Review Desk Items (${recommendedVehicleClass}) →`;

  const primaryHref = `/routes/keflavik-to-vik?scenario=${scenario}&passengers=${partySize}&bags=${checkedBags}&eta=${encodeURIComponent(flightEtaLocal)}#review-desk`;

  return {
    corridorId: "iceland-kef-to-vik",
    isSampleTelemetry: true,
    sampleLabel: "Sample — Illustrative Scenario, Not Live Telemetry",
    scenarioKey: scenario,
    departureBlockedByClosure,
    operatorConfirmedAlternateRoute,
    operatorConfirmedLaterDepartureLocal,
    recommendedVehicleClass,
    recheckCard: {
      corridorId: "iceland-kef-to-vik",
      whatChanged,
      whatStillFits,
      nextStep: `${primaryLabel.replace(" →", "")} (Data schema: Vegagerðin DATEX II & Veðurstofa Íslands — Sample scenario; commercial terms queued in Review Desk).`,
      primaryNextActionLabel: primaryLabel,
      primaryNextActionHref: primaryHref,
    },
    telemetry,
  };
}

export const evaluateIcelandKefVikCorridorRecheck = evaluateIcelandKefVikCorheck;

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

export interface DelhiAgraCorridorRecheckResult {
  corridorId: "delhi-to-agra";
  travelDate: string;
  dayOfWeekName: string;
  isFridayTajClosed: boolean;
  trainRunningDelayMinutes: number;
  recommendedPrimaryMode: string;
  dcc412Recheck: Dcc412ItineraryRecheckResult;
  recheckCard: CompactTripRecheckCardModel;
}

export function evaluateDelhiAgraCorridorRecheck(params?: {
  date?: string;
  trainDelayMinutes?: number;
  scheduledArrivalLocal?: string;
  transferBufferMinutes?: number;
  criticalUpdateMissing?: boolean;
  partySize?: number;
}): DelhiAgraCorridorRecheckResult {
  const date =
    params?.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date.trim())
      ? params.date.trim()
      : "2026-11-18"; // Wednesday default; 2026-11-20 is Friday
  const trainDelayMinutes = Math.max(
    0,
    Math.round(params?.trainDelayMinutes ?? 42),
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
  const dayOfWeekName = dayNames[dayIndex] || "Wednesday";
  const isFridayTajClosed = dayIndex === 5;

  const dcc412Recheck = evaluateSyntheticDelhiAgraDcc412Test({
    serviceDate: date,
    scheduledArrivalLocal: params?.scheduledArrivalLocal || "09:50",
    delayMinutes: trainDelayMinutes,
    transferBufferMinutes: params?.transferBufferMinutes ?? 15,
    criticalUpdateMissing: params?.criticalUpdateMissing ?? false,
  });

  const recommendedPrimaryMode = isFridayTajClosed
    ? "Reschedule to Non-Friday OR Book Yamuna Expressway Private Car for Agra Fort & Mehtab Bagh Sunset View"
    : dcc412Recheck.nextCatchableDeparture
      ? `${dcc412Recheck.nextCatchableDeparture.title} (departs ${dcc412Recheck.nextCatchableDeparture.departureLocal} IST / ${dcc412Recheck.nextCatchableDeparture.departureUtcShort}, after travelerReadyAt ${dcc412Recheck.travelerReadyAt.formattedSummary})`
      : "Train 12050 Gatimaan Express + Agra Cantt Station Transfer";

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
    ? `/routes/delhi-to-agra?date=2026-11-19&passengers=${partySize}`
    : dcc412Recheck.recheckCard.primaryNextActionHref;

  return {
    corridorId: "delhi-to-agra",
    travelDate: date,
    dayOfWeekName,
    isFridayTajClosed,
    trainRunningDelayMinutes: trainDelayMinutes,
    recommendedPrimaryMode,
    dcc412Recheck,
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
    trainDelayMinutes: delayMinutes,
    partySize: input.partySize || 2,
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
  date: "2026-11-18",
  scheduledArrivalAgc: "09:50",
  revisedArrivalAgc: "10:32",
  partySize: 2,
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

