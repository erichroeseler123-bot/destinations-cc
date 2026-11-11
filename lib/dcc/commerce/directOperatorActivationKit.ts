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

export interface DirectOperatorPitchKit {
  id:
    | "coastal-helicopters-juneau"
    | "northstar-helicopters-juneau"
    | "ragin-cajun-airboat-nola"
    | "cajun-encounters-nola";
  operatorName: string;
  destinationPort: "Juneau, AK" | "New Orleans, LA";
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

If you're open to connecting a tracked FareHarbor ASN or direct partner booking code for the 2027 Alaska cruise season, you can review our 1-page terms or drop your preferred checkout details here:
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

You can view our direct operator overview and share your preferred tracking parameter or reservation contact in 60 seconds here:
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

export function listDirectOperatorPitchKits(): readonly DirectOperatorPitchKit[] {
  return FLAGSHIP_DIRECT_OPERATOR_PITCH_KITS;
}

export function getDirectOperatorPitchKitById(
  id: string,
): DirectOperatorPitchKit | null {
  return (
    FLAGSHIP_DIRECT_OPERATOR_PITCH_KITS.find((kit) => kit.id === id) ?? null
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
