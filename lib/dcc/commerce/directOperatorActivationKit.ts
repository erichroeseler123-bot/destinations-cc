/**
 * DCC Direct Operator 10% Activation Kit & Cruise Promenade Booking Sync
 *
 * Governance invariants:
 * - ZERO automatic outreach emails are ever dispatched (`AUTO_OUTREACH_DISPATCH_ENABLED = false`).
 *   Pitch kits are strictly copy-only templates surfaced in `/admin` for human operator review.
 * - Direct operator onboarding (`Route 2` 10% DCC-Sourced Direct / `Route 3` 5% Machine-Distributed)
 *   never alters DCC's deterministic fit evaluator (`influencesFitOrRanking: false`).
 * - `syncAuthorizedBookingToCruisePromenade` enforces a 1.8s timeout, Bearer service-secret auth,
 *   fail-safe error handling (never throws), and strict zero-PII payloads.
 */

export const AUTO_OUTREACH_DISPATCH_ENABLED = false as const;

export const DIRECT_OPERATOR_ONBOARDING_URL =
  "https://www.destinationcommandcenter.com/partners/direct-operators";

export const JUNEAU_TOURS_ONBOARDING_REFERENCE = {
  operatorId: "operator:juneau-tours-and-whale-watch",
  operatorName: "Juneau Tours & Whale Watch",
  canonicalProfileUrl:
    "https://www.lastfrontiershoreexcursions.com/operators/juneau-tours-and-whale-watch",
  canonicalSampleTourUrl:
    "https://www.lastfrontiershoreexcursions.com/tours/juneau-tours-and-whale-watch/auke-bay-whale-watch",
  bookingPlatform: "Rezgo (Read-Only XML Availability + Supplier-Hosted Checkout)",
  merchantOfRecord: "operator" as const,
  customerFundsCapturedByDcc: false as const,
  directCommissionPercent: 10 as const,
  machineOrPlannerCommissionPercent: 5 as const,
  settlementTrigger: "completed_non_refunded_bookings_only" as const,
  setupAndMonthlyFeeUsd: 0 as const,
  weatherAndCancellationFeePercent: 0 as const,
  operationalHighlights: [
    "Permanent $0 canonical operator profile and tour pages live on Last Frontier Shore Excursions.",
    "Read-only availability checks party-size fit and 2-hour gangway return buffers without exposing raw seat counts.",
    "Traveler clicks straight into Juneau Tours' own Rezgo checkout — Juneau Tours stays Merchant of Record and captures 100% of customer payment directly.",
    "10% commission invoiced only after completed, non-refunded tours ($0 owed on cancellations, refunds, or weather groundings).",
  ],
} as const;

export type DirectOperatorTargetMarket =
  | "Juneau, AK"
  | "New Orleans, LA"
  | "Colorado (I-70 / Red Rocks)";

export interface DirectOperatorPitchKit {
  id:
    | "coastal-helicopters-juneau"
    | "northstar-helicopters-juneau"
    | "ragin-cajun-airboat-nola"
    | "cajun-encounters-nola"
    | "peak-1-express-colorado";
  operatorName: string;
  destinationPort: DirectOperatorTargetMarket;
  corridorLabel: string;
  flagshipSkus: readonly string[];
  bookingSystem: string;
  proposedDirectRatePercent: 10;
  proposedMachineRatePercent: 5;
  setupFeeUsd: 0;
  cancellationAndWeatherFeePercent: 0;
  onboardingUrl: string;
  emailSubject: string;
  emailBody: string;
  autoSendForbidden: true;
}

export const FLAGSHIP_DIRECT_OPERATOR_PITCH_KITS: readonly DirectOperatorPitchKit[] =
  [
    {
      id: "coastal-helicopters-juneau",
      operatorName: "Coastal Helicopters",
      destinationPort: "Juneau, AK",
      corridorLabel: "Juneau Icefield Aviation & Cruise Berth Window Corridor",
      flagshipSkus: [
        "Herbert Glacier Dog Sled Tour",
        "Icefield Excursion / Guided Icefield Walk",
      ],
      bookingSystem: "FareHarbor / Direct Reservations",
      proposedDirectRatePercent: 10,
      proposedMachineRatePercent: 5,
      setupFeeUsd: 0,
      cancellationAndWeatherFeePercent: 0,
      onboardingUrl: DIRECT_OPERATOR_ONBOARDING_URL,
      emailSubject:
        "Juneau Flight Deck × Coastal Helicopters — Port-Window Verified Direct Referrals (10% Completed-Only, $0 Weather Grounding Fee)",
      emailBody: `Hi Coastal Helicopters Reservations & Partnerships Team,

I run Juneau Flight Deck (juneauflightdeck.com) and Destination Command Center (destinationcommandcenter.com), where we pre-screen Alaska cruise passengers against official CLAA berth times, tender buffers, Goldbelt Tramway shuttle cutoffs, and 250 lb+ cabin weight rules before sending them to book.

Right now, many cruise guests book your Icefield Walk and Herbert Glacier Dog Sled flights through high-fee OTAs (20%–30% commission). We'd love to establish a direct operator referral link with Coastal Helicopters on simple, operator-first terms:

• 10% referral commission ONLY on completed, flown direct bookings sourced from Juneau Flight Deck / DCC (5% on machine/planner-distributed handoffs).
• $0 setup fee, $0 monthly fee, and 0% commission on weather groundings, cloud-ceiling cancellations, holds, or unbooked searches.
• Coastal Helicopters remains Merchant of Record on your hosted checkout — guests pay Coastal directly under your published weight and weather policies.
• Commission-neutral fit engine: safety and ship-return buffers always govern what we recommend.

You can see this exact setup live today with Juneau Tours & Whale Watch on Last Frontier Shore Excursions (live port-day availability + direct supplier-hosted checkout where the operator stays Merchant of Record):
${JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl}

Your $0 Coastal Helicopters company profile is already live at https://www.lastfrontiershoreexcursions.com/operators/coastal-helicopters — and if you're open to connecting a tracked FareHarbor ASN or direct partner booking code for the 2027 Alaska cruise season, you can review our 1-page terms here:
${DIRECT_OPERATOR_ONBOARDING_URL}

Best regards,
Erich Roeseler
Founder, Juneau Flight Deck & Destination Command Center`,
      autoSendForbidden: true,
    },
    {
      id: "northstar-helicopters-juneau",
      operatorName: "NorthStar Helicopters",
      destinationPort: "Juneau, AK",
      corridorLabel: "Douglas Island Heliport & JNU Glacier Trekking Corridor",
      flagshipSkus: [
        "Norris Glacier Helicopter Dog Sled Adventure",
        "Taku Glacier Helicopter & Airboat Adventure",
        "Glacier Walkabout & Level 1/2 Ice Treks",
      ],
      bookingSystem: "Custom / Direct Reservations",
      proposedDirectRatePercent: 10,
      proposedMachineRatePercent: 5,
      setupFeeUsd: 0,
      cancellationAndWeatherFeePercent: 0,
      onboardingUrl: DIRECT_OPERATOR_ONBOARDING_URL,
      emailSubject:
        "Juneau Flight Deck × NorthStar Trekking — Direct Cruise-Verified Referrals for Norris Dog Sled & Taku Airboat (10% Flown-Only)",
      emailBody: `Hi NorthStar Trekking Partnerships Team,

I operate Juneau Flight Deck (juneauflightdeck.com) and Destination Command Center, an independent Alaska port-timing and aviation fit guide built specifically to match cruise passengers to the right glacier flight window and base logistics (distinguishing your Douglas Island Dog Sled / Taku Airboat heliport from your JNU Airport Trekking base, plus age and weight eligibility).

We are opening direct 2027 partner referrals for Juneau aviation operators as a clean alternative to 20%–30% OTA distribution:

• 10% referral fee strictly on completed, flown bookings sent directly from our specialist flight desk (5% on Cruise Promenade / planner-distributed links).
• 0% fee on weather cancellations, itinerary changes, or inquiries — if ceiling or wind scrubs a flight, you owe $0.
• NorthStar remains Merchant of Record on your own checkout and confirmation workflow.
• Fit and timing safety remain 100% independent of commission.

You can preview how this exact direct model works live today on our Juneau Tours & Whale Watch integration (read-only schedule fit + direct supplier-hosted checkout):
${JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl}

Your permanent $0 NorthStar Trekking profile is live at https://www.lastfrontiershoreexcursions.com/operators/northstar-trekking, and you can review the 1-page direct operator overview or share your preferred tracking setup here:
${DIRECT_OPERATOR_ONBOARDING_URL}

Warm regards,
Erich Roeseler
Juneau Flight Deck & Destination Command Center`,
      autoSendForbidden: true,
    },
    {
      id: "ragin-cajun-airboat-nola",
      operatorName: "Ragin' Cajun Airboat Tours",
      destinationPort: "New Orleans, LA",
      corridorLabel: "Port NOLA Turnaround & Small-Airboat Bayou Corridor",
      flagshipSkus: [
        "Small-Airboat Swamp Adventure (6–10 Passenger)",
        "Medium / Large Airboat Bayou Tour with Downtown Hotel Pickup",
      ],
      bookingSystem: "FareHarbor",
      proposedDirectRatePercent: 10,
      proposedMachineRatePercent: 5,
      setupFeeUsd: 0,
      cancellationAndWeatherFeePercent: 0,
      onboardingUrl: DIRECT_OPERATOR_ONBOARDING_URL,
      emailSubject:
        "Welcome to New Orleans Tours × Ragin' Cajun Airboat — Direct FareHarbor Partner Setup (10% Completed-Only)",
      emailBody: `Hi Ragin' Cajun Airboat Tours Team,

I run Welcome to New Orleans Tours (welcometoneworleanstours.com) and Destination Command Center. Our Port NOLA Cruise Turnaround Desk screens Carnival, Norwegian, and Royal Caribbean guests at Erato and Julia Street terminals so same-day embarkation passengers don't accidentally book tight regional transfers, while pre-cruise and hotel-stay guests are matched directly to small-airboat bayou departures.

We'd love to activate a direct FareHarbor partner connection with Ragin' Cajun Airboat Tours:

• 10% commission on completed direct bookings only (5% on Cruise Promenade group-planner links) — roughly half the cost of standard 20%–30% OTA channels.
• $0 setup fee, $0 monthly fee, and 0% on weather cancellations or refunds.
• Seamless FareHarbor ASN / hosted lightframe checkout — Ragin' Cajun stays Merchant of Record (or FareHarbor automated split).
• Honest Port NOLA luggage and highway-buffer screening before guests click to book.

You can review the direct operator structure and submit your FareHarbor shortname / item IDs here:
${DIRECT_OPERATOR_ONBOARDING_URL}

Best,
Erich Roeseler
Welcome to New Orleans Tours & Destination Command Center`,
      autoSendForbidden: true,
    },
    {
      id: "cajun-encounters-nola",
      operatorName: "Cajun Encounters Tour Company",
      destinationPort: "New Orleans, LA",
      corridorLabel: "Honey Island Swamp Hotel-Shuttle & Pre/Post-Cruise Corridor",
      flagshipSkus: [
        "Honey Island SwampCovered Boat Tour with French Quarter / CBD Hotel Shuttle",
        "VIP Small-Boat Honey Island Wildlife Excursion",
      ],
      bookingSystem: "FareHarbor / Rezdy / Custom",
      proposedDirectRatePercent: 10,
      proposedMachineRatePercent: 5,
      setupFeeUsd: 0,
      cancellationAndWeatherFeePercent: 0,
      onboardingUrl: DIRECT_OPERATOR_ONBOARDING_URL,
      emailSubject:
        "Welcome to New Orleans Tours × Cajun Encounters — Honey Island Pre-Cruise & Hotel-Shuttle Direct Referrals (10% Net)",
      emailBody: `Hi Cajun Encounters Partnerships Team,

I run Welcome to New Orleans Tours (welcometoneworleanstours.com) and Destination Command Center, where travelers planning French Quarter stays and Port NOLA pre/post-cruise days compare covered Honey Island swamp boats, pickup zones, and MSY airport/terminal timing buffers.

We are inviting flagship New Orleans operators into our 10% Direct Operator program:

• 10% referral commission on completed direct bookings only (5% on machine/group-planner distribution).
• $0 onboarding cost and 0% fee on weather cancellations, no-sale clicks, or refunded bookings.
• Cajun Encounters remains Merchant of Record on your hosted checkout with confirmed hotel-pickup stop mapping.
• Zero pay-to-rank bias — our Port NOLA timing calculator always protects guest return windows first.

Details and our self-serve intake form are live at:
${DIRECT_OPERATOR_ONBOARDING_URL}

Best regards,
Erich Roeseler
Welcome to New Orleans Tours & Destination Command Center`,
      autoSendForbidden: true,
    },
  ] as const;

export const THREE_MARKET_DIRECT_OPERATOR_PITCH_KITS: readonly DirectOperatorPitchKit[] =
  [
    ...FLAGSHIP_DIRECT_OPERATOR_PITCH_KITS,
    {
      id: "peak-1-express-colorado",
      operatorName: "Peak 1 Express (Colorado Mountain Transportation)",
      destinationPort: "Colorado (I-70 / Red Rocks)",
      corridorLabel:
        "DEN Airport → Summit County / Vail I-70 Shared Shuttle & Charter Corridor",
      flagshipSkus: [
        "DEN Airport ↔ Breckenridge / Frisco / Keystone Shared Mountain Shuttle",
        "DEN Airport ↔ Vail / Beaver Creek Door-to-Door Transfer & Ski-Bag Service",
      ],
      bookingSystem: "FareHarbor / Rezdy / Direct API",
      proposedDirectRatePercent: 10,
      proposedMachineRatePercent: 5,
      setupFeeUsd: 0,
      cancellationAndWeatherFeePercent: 0,
      onboardingUrl: DIRECT_OPERATOR_ONBOARDING_URL,
      emailSubject:
        "Destination Command Center × Peak 1 Express — I-70 Ski-Bag & Flight-Buffer Verified Direct Referrals (10% Completed-Only)",
      emailBody: `Hi Peak 1 Express Partnerships & Reservations Team,

I run Destination Command Center (destinationcommandcenter.com/transportation/colorado), where winter travelers arriving at DEN compare I-70 shared shuttles vs. private SUVs by flight arrival window, ski/snowboard bag count, and CDOT traction-law conditions before booking.

We are connecting one direct API-bookable shared-shuttle partner in Colorado alongside our private SUV corridor on simple, operator-first terms:

• 10% referral commission strictly on completed, fulfilled rides booked via your connected API / hosted checkout (5% on machine/planner-distributed handoffs) — half the cost of 20%–30% OTA channels.
• $0 setup fee, $0 monthly fee, and 0% commission on I-70 road-closure refunds, flight cancellations, or unbooked availability checks.
• Peak 1 Express remains Merchant of Record for shared-shuttle inventory, live seat availability, and luggage rules.
• Commission-neutral fit engine: flight-arrival timing and ski-bag capacity rules govern every recommendation.

You can review our 1-page direct operator terms and start technical API/ASN review here:
${DIRECT_OPERATOR_ONBOARDING_URL}

Best regards,
Erich Roeseler
Founder, Destination Command Center`,
      autoSendForbidden: true,
    },
  ] as const;

export function listDirectOperatorPitchKits(): readonly DirectOperatorPitchKit[] {
  return FLAGSHIP_DIRECT_OPERATOR_PITCH_KITS;
}

export interface SoutheastAlaskaOperatorOnboardingPitch {
  id: string;
  operatorSlug: string;
  operatorName: string;
  portsLabel: string;
  bookingPlatform: string;
  canonicalProfileUrl: string;
  referenceExampleUrl: string;
  emailSubject: string;
  emailBody: string;
  autoSendForbidden: true;
}

export const SOUTHEAST_ALASKA_OPERATOR_ONBOARDING_KITS: readonly SoutheastAlaskaOperatorOnboardingPitch[] =
  [
    {
      id: "seak-harv-and-marvs",
      operatorSlug: "harv-and-marvs",
      operatorName: "Harv & Marv's Outback Alaska",
      portsLabel: "Juneau (Auke Bay Small-Boat Whale Watching)",
      bookingPlatform: "FareHarbor",
      canonicalProfileUrl:
        "https://www.lastfrontiershoreexcursions.com/operators/harv-and-marvs",
      referenceExampleUrl: JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl,
      emailSubject:
        "Harv & Marv's Free Company Profile on Last Frontier + Optional 10% Direct Checkout (Juneau Tours Example)",
      emailBody: `Hi Harv & Marv's Team,

We published your free, source-backed company profile on Last Frontier Shore Excursions so cruise guests can check your 6- and 18-passenger boat options, Goldbelt Tramway pickup rules, and 2-hour all-aboard return buffers in one place:
https://www.lastfrontiershoreexcursions.com/operators/harv-and-marvs

Claiming and updating your profile is permanently $0. If you'd ever like to connect live FareHarbor availability and direct supplier-hosted checkout (instead of 20%–30% OTA commissions), you can see how our live integration works today with Juneau Tours & Whale Watch:
${JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl}

How the optional direct connection works:
• Guests book and pay directly on your own FareHarbor checkout — Harv & Marv's stays Merchant of Record and keeps 100% of customer funds at booking.
• 10% commission invoiced only after completed, non-refunded tours ($0 setup, $0 monthly, and 0% on cancellations, weather scrubs, or refunds).
• Raw seat counts stay hidden publicly while cruise timing buffers protect your dockside schedule.

You can claim your free profile on the page above or review the optional 10% direct connection details here:
${DIRECT_OPERATOR_ONBOARDING_URL}

Best regards,
Erich Roeseler
Last Frontier Shore Excursions & Destination Command Center`,
      autoSendForbidden: true,
    },
    {
      id: "seak-allen-marine-tours",
      operatorSlug: "allen-marine-tours",
      operatorName: "Allen Marine Tours",
      portsLabel: "Sitka & Ketchikan",
      bookingPlatform: "Direct / OCTO / API",
      canonicalProfileUrl:
        "https://www.lastfrontiershoreexcursions.com/operators/allen-marine-tours",
      referenceExampleUrl: JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl,
      emailSubject:
        "Allen Marine's Free Southeast Alaska Profile + Direct Supplier-Hosted Checkout Example",
      emailBody: `Hi Allen Marine Partnerships Team,

We maintain a permanent $0 company profile for Allen Marine Tours across Sitka and Ketchikan on Last Frontier Shore Excursions — highlighting your Alaskan-built catamarans, Sitka Sound and Ward Cove shuttle buffers, and ADA cabin accessibility:
https://www.lastfrontiershoreexcursions.com/operators/allen-marine-tours

Your profile is free to claim and verify anytime. When you're evaluating direct distribution alternatives to 20%–30% OTA marketplaces for independent cruise guests, you can inspect our live direct setup with Juneau Tours & Whale Watch here:
${JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl}

• Allen Marine remains Merchant of Record on your own hosted checkout and captures customer payment directly.
• 10% referral fee strictly on completed, non-refunded excursions (5% on Cruise Promenade group-planner referrals; $0 on cancellations or missed port calls).

Overview & optional direct intake:
${DIRECT_OPERATOR_ONBOARDING_URL}

Warm regards,
Erich Roeseler
Last Frontier Shore Excursions & Destination Command Center`,
      autoSendForbidden: true,
    },
    {
      id: "seak-alaska-x",
      operatorSlug: "alaska-x",
      operatorName: "Alaska X (Alaska Excursions)",
      portsLabel: "Skagway, Juneau & Haines",
      bookingPlatform: "Direct Reservations / API",
      canonicalProfileUrl:
        "https://www.lastfrontiershoreexcursions.com/operators/alaska-x",
      referenceExampleUrl: JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl,
      emailSubject:
        "Alaska X Free Operator Profile (Skagway, Juneau & Haines) + Live Direct Checkout Example",
      emailBody: `Hi Alaska X Partnerships Team,

We published your free, primary-source verified operator profile covering Skagway, Juneau, and Haines on Last Frontier Shore Excursions (including Skagway dock pickup logistics and 2-hour ship return buffers):
https://www.lastfrontiershoreexcursions.com/operators/alaska-x

Claiming and keeping your company profile updated is 100% free ($0). If you'd also like to connect read-only live availability and supplier-hosted direct checkout on simple 10% completed-booking terms, here is our live working example with Juneau Tours & Whale Watch:
${JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl}

• Alaska X stays Merchant of Record and collects guest payment directly.
• 10% invoiced post-completion on fulfilled, non-refunded bookings only ($0 on weather cancellations or refunds).

Details are available anytime at:
${DIRECT_OPERATOR_ONBOARDING_URL}

Best regards,
Erich Roeseler
Last Frontier Shore Excursions & Destination Command Center`,
      autoSendForbidden: true,
    },
    {
      id: "seak-taquan-air",
      operatorSlug: "taquan-air",
      operatorName: "Taquan Air",
      portsLabel: "Ketchikan (Misty Fjords Floatplanes)",
      bookingPlatform: "Direct / FareHarbor",
      canonicalProfileUrl:
        "https://www.lastfrontiershoreexcursions.com/operators/taquan-air",
      referenceExampleUrl: JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl,
      emailSubject:
        "Taquan Air Free Ketchikan Operator Profile + $0-Weather-Fee Direct Referral Option",
      emailBody: `Hi Taquan Air Reservations & Partnerships Team,

Your permanent $0 company profile is live on Last Frontier Shore Excursions — documenting your Downtown Ketchikan Harbor floatplane base, Ward Cove 30-minute shuttle margin, and Misty Fjords flightseeing logistics:
https://www.lastfrontiershoreexcursions.com/operators/taquan-air

You can claim and verify your profile at no cost anytime. If you're open to connecting direct cruise-timed referrals where Taquan Air stays Merchant of Record and pays 0% on weather groundings, you can see our live integration model on Juneau Tours & Whale Watch here:
${JUNEAU_TOURS_ONBOARDING_REFERENCE.canonicalProfileUrl}

• 10% commission strictly on completed, flown bookings ($0 setup, $0 monthly, $0 on ceiling/weather cancellations or refunds).
• Guests pay Taquan Air directly on your hosted checkout.

More details here whenever helpful:
${DIRECT_OPERATOR_ONBOARDING_URL}

Best regards,
Erich Roeseler
Last Frontier Shore Excursions & Destination Command Center`,
      autoSendForbidden: true,
    },
  ] as const;

export function listThreeMarketDirectOperatorPitchKits(): readonly DirectOperatorPitchKit[] {
  return THREE_MARKET_DIRECT_OPERATOR_PITCH_KITS;
}

export function getDirectOperatorPitchKitById(
  id: string,
): DirectOperatorPitchKit | null {
  return (
    THREE_MARKET_DIRECT_OPERATOR_PITCH_KITS.find((kit) => kit.id === id) ?? null
  );
}

export interface SyncAuthorizedBookingToCruisePromenadeParams {
  shareCode: string;
  bookingRef: string;
  provider: string;
  productCode?: string | null;
  status?: string | null;
  bookedDate?: string | null;
  partySize?: number | null;
  cpBaseUrl?: string | null;
  serviceSecret?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface SyncAuthorizedBookingToCruisePromenadeResult {
  ok: boolean;
  synced: boolean;
  shareCode: string;
  skippedReason?: string;
  httpStatus?: number;
  targetUrl?: string;
  zeroPiiPayload?: {
    bookingRef: string;
    provider: string;
    productCode: string | null;
    status: string;
    bookedDate: string | null;
    partySize: number | null;
    source: "dcc_reconcile_sync";
    syncedAt: string;
  };
  error?: string;
}

const VALID_SHARE_CODE_RE = /^[A-Za-z0-9_-]{3,64}$/;

/**
 * Notifies Cruise Promenade (`POST /api/planners/[shareCode]/sync-booking-status`)
 * when an authorized booking outcome is reconciled in DCC.
 *
 * Guarantees:
 * - Bearer auth via `DCC_CP_SERVICE_SECRET`
 * - Hard `1800ms` (`1.8s`) timeout
 * - Strict zero-PII payload (never sends guest name, email, phone, or raw provider PII)
 * - Fail-safe: never throws even if Cruise Promenade is offline or unconfigured
 */
export async function syncAuthorizedBookingToCruisePromenade(
  params: SyncAuthorizedBookingToCruisePromenadeParams,
): Promise<SyncAuthorizedBookingToCruisePromenadeResult> {
  const shareCode = (params.shareCode || "").trim();
  const bookingRef = (params.bookingRef || "").trim();
  const provider = (params.provider || "viator").trim().toLowerCase();

  if (!shareCode || !VALID_SHARE_CODE_RE.test(shareCode)) {
    return {
      ok: false,
      synced: false,
      shareCode,
      skippedReason: "invalid_share_code",
    };
  }

  if (!bookingRef) {
    return {
      ok: false,
      synced: false,
      shareCode,
      skippedReason: "missing_booking_ref",
    };
  }

  const secret = (
    params.serviceSecret ??
    process.env.DCC_CP_SERVICE_SECRET ??
    ""
  ).trim();

  if (!secret) {
    return {
      ok: false,
      synced: false,
      shareCode,
      skippedReason: "missing_dcc_cp_service_secret",
    };
  }

  const rawCpBase = (
    params.cpBaseUrl ||
    process.env.CRUISE_PROMENADE_BASE_URL ||
    "https://cruisepromenade.com"
  )
    .trim()
    .replace(/\/+$/, "");

  const targetUrl = `${rawCpBase}/api/planners/${encodeURIComponent(shareCode)}/sync-booking-status`;
  const effectiveTimeoutMs = Math.min(
    Math.max(Number(params.timeoutMs) || 1800, 100),
    1800,
  );

  const zeroPiiPayload = {
    bookingRef,
    provider,
    productCode: params.productCode?.trim() || null,
    status: (params.status || "confirmed").trim().toLowerCase(),
    bookedDate: params.bookedDate?.trim() || null,
    partySize:
      typeof params.partySize === "number" && Number.isFinite(params.partySize)
        ? params.partySize
        : null,
    source: "dcc_reconcile_sync" as const,
    syncedAt: new Date().toISOString(),
  };

  const fetchFn = params.fetchImpl || globalThis.fetch;

  try {
    const response = await fetchFn(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(zeroPiiPayload),
      cache: "no-store",
      signal: AbortSignal.timeout(effectiveTimeoutMs),
    });

    if (!response.ok) {
      return {
        ok: false,
        synced: false,
        shareCode,
        httpStatus: response.status,
        targetUrl,
        zeroPiiPayload,
        error: `CP sync returned HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      synced: true,
      shareCode,
      httpStatus: response.status,
      targetUrl,
      zeroPiiPayload,
    };
  } catch (err) {
    return {
      ok: false,
      synced: false,
      shareCode,
      targetUrl,
      zeroPiiPayload,
      error: err instanceof Error ? err.message : "cp_sync_network_or_timeout_error",
    };
  }
}
