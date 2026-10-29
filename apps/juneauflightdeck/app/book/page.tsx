import Link from "next/link";
import Script from "next/script";
import { cookies } from "next/headers";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import {
  extractHandoffIdFromQueryOrRef,
  getOrCreateCheckoutSession,
  JFD_CHECKOUT_COOKIE_NAME,
  loadAuthoritativeDccHandoffForCheckout,
  safeJsonSerializeForScriptTag,
} from "../../lib/dccContext";

interface BookPageSearchParams {
  ctx?: string;
  handoff_id?: string;
  ref?: string;
  receipt_id?: string;
  asn?: string;
  shortname?: string;
  item?: string;
  tour?: string;
  date?: string;
  departure?: string;
  time?: string;
  party_size?: string;
  max_weight_lbs?: string;
  youngest_age_years?: string;
  requires_assisted_boarding?: string;
  can_walk_one_hour?: string;
  carrying_drone?: string;
  carrying_selfie_stick?: string;
  carrying_bags_on_flight?: string;
  has_service_animal?: string;
  accept_weight_surcharge?: string;
}

interface BookPageProps {
  searchParams: Promise<BookPageSearchParams>;
}

export const dynamic = "force-dynamic";

export default async function BookPage(props: BookPageProps) {
  const searchParams = await Promise.resolve(props.searchParams);
  const contextId = searchParams.ctx?.trim();
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(JFD_CHECKOUT_COOKIE_NAME)?.value;

  let contextData: any = null;
  let contextError: { code: string; message: string; status?: number } | null = null;

  if (contextId) {
    const sessionResult = await getOrCreateCheckoutSession(contextId, existingSessionId);
    if (sessionResult.success && sessionResult.data) {
      contextData = sessionResult.data;
    } else {
      contextError = {
        code: sessionResult.errorCode || "REDEEM_ERROR",
        message: sessionResult.message || "Failed to redeem travel context.",
        status: sessionResult.statusCode,
      };
    }
  }

  const resolvedHandoffId = extractHandoffIdFromQueryOrRef(
    searchParams.handoff_id,
    searchParams.ref,
  );

  const hasUrlHandoffAttempt = Boolean(
    resolvedHandoffId ||
      searchParams.handoff_id?.trim() ||
      searchParams.receipt_id?.trim() ||
      searchParams.item?.trim() ||
      searchParams.departure?.trim() ||
      searchParams.tour?.trim(),
  );

  const requestedPartySize =
    searchParams.party_size !== undefined && searchParams.party_size.trim() !== ""
      ? Number(searchParams.party_size)
      : null;
  const declaredWeightLbs =
    searchParams.max_weight_lbs !== undefined && searchParams.max_weight_lbs.trim() !== ""
      ? Number(searchParams.max_weight_lbs)
      : null;
  const declaredYoungestAge =
    searchParams.youngest_age_years !== undefined &&
    searchParams.youngest_age_years.trim() !== ""
      ? Number(searchParams.youngest_age_years)
      : null;

  let handoffVerifiedServerSide = false;
  let authoritativeHandoff: Record<string, any> | null = null;
  let authoritativeRevalidation: Record<string, any> | null = null;
  let handoffLoadError: { code: string; message: string } | null = null;

  if (hasUrlHandoffAttempt) {
    if (!resolvedHandoffId) {
      handoffLoadError = {
        code: "MISSING_AUTHORITATIVE_HANDOFF_ID_BLOCKS_PROGRESSION",
        message:
          "Booking parameters in the URL cannot be trusted without a valid DCC handoff_id verified server-side.",
      };
    } else {
      const loadResult = await loadAuthoritativeDccHandoffForCheckout({
        handoffId: resolvedHandoffId,
        requestedReceiptId: searchParams.receipt_id?.trim() || null,
        requestedTourCode: searchParams.tour?.trim() || null,
        requestedFareharborItemId: searchParams.item?.trim() || null,
        requestedDate: searchParams.date?.trim() || null,
        requestedDepartureId: searchParams.departure?.trim() || null,
        requestedDepartureTime: searchParams.time?.trim() || null,
        requestedPartySize:
          requestedPartySize !== null && Number.isFinite(requestedPartySize)
            ? requestedPartySize
            : null,
        declaredMaxSinglePassengerWeightLbs:
          declaredWeightLbs !== null && Number.isFinite(declaredWeightLbs)
            ? declaredWeightLbs
            : null,
        declaredYoungestPassengerAgeYears:
          declaredYoungestAge !== null && Number.isFinite(declaredYoungestAge)
            ? declaredYoungestAge
            : null,
        requiresAssistedAircraftBoarding:
          searchParams.requires_assisted_boarding === "true"
            ? true
            : searchParams.requires_assisted_boarding === "false"
              ? false
              : null,
        canWalkUnassistedOneHourUnevenTerrain:
          searchParams.can_walk_one_hour === "true"
            ? true
            : searchParams.can_walk_one_hour === "false"
              ? false
              : null,
        carryingDrone:
          searchParams.carrying_drone === "true"
            ? true
            : searchParams.carrying_drone === "false"
              ? false
              : null,
        carryingSelfieStickOrExtension:
          searchParams.carrying_selfie_stick === "true"
            ? true
            : searchParams.carrying_selfie_stick === "false"
              ? false
              : null,
        carryingBagsOrPursesOnFlight:
          searchParams.carrying_bags_on_flight === "true"
            ? true
            : searchParams.carrying_bags_on_flight === "false"
              ? false
              : null,
        hasServiceAnimal:
          searchParams.has_service_animal === "true"
            ? true
            : searchParams.has_service_animal === "false"
              ? false
              : null,
        travelerAcceptedWeightSurcharge:
          searchParams.accept_weight_surcharge === "true" ? true : null,
      });

      if (loadResult.found && loadResult.handoff && loadResult.revalidation) {
        handoffVerifiedServerSide = true;
        authoritativeHandoff = loadResult.handoff;
        authoritativeRevalidation = loadResult.revalidation;
      } else {
        handoffLoadError = {
          code:
            loadResult.errorCode || "AUTHORITATIVE_HANDOFF_NOT_FOUND_BLOCKS_PROGRESSION",
          message:
            loadResult.message ||
            "Authoritative handoff record could not be loaded from DCC.",
        };
      }
    }
  }

  // All displayed handoff values come strictly from the server-verified DCC handoff & revalidation record
  const handoffId = authoritativeRevalidation?.handoffId ?? resolvedHandoffId ?? null;
  const receiptId = authoritativeRevalidation?.receiptId ?? null;
  const receiptVerified = authoritativeRevalidation?.receiptVerified === true;
  const operatorShortname = authoritativeRevalidation?.fareharborShortname ?? null;
  const fareharborItemId = authoritativeRevalidation?.fareharborItemId ?? null;
  const fareharborDirectEmbedUrl =
    authoritativeRevalidation?.fareharborDirectEmbedUrl ??
    authoritativeHandoff?.checkoutBookingBinding?.fareharborDirectEmbedUrl ??
    null;
  const tourCode = authoritativeRevalidation?.productCode ?? null;
  const intendedDate =
    authoritativeRevalidation?.intendedDate ?? contextData?.schedule?.date ?? null;
  const departureId = authoritativeRevalidation?.intendedDepartureId ?? null;
  const departureTime = authoritativeRevalidation?.intendedDepartureTime ?? null;
  const partySize =
    typeof authoritativeRevalidation?.partySize === "number"
      ? authoritativeRevalidation.partySize
      : typeof contextData?.schedule?.travelers === "number"
        ? contextData.schedule.travelers
        : null;
  const maxSinglePassengerWeightLbs =
    authoritativeRevalidation?.checks?.passengerConstraints?.maxSinglePassengerWeightLbs ??
    null;

  const publishedBasePerPersonUsd: number | null =
    authoritativeRevalidation?.checks?.priceAndSurcharge?.publishedBasePerPersonUsd ??
    null;
  const requiredWeightSurchargeUsd: number =
    authoritativeRevalidation?.checks?.priceAndSurcharge?.requiredWeightSurchargeUsd ?? 0;
  const publishedPolicyRequiredTotalUsd: number | null =
    authoritativeRevalidation?.checks?.priceAndSurcharge
      ?.publishedPolicyRequiredTotalUsd ?? null;
  const quotedPerPersonUsd: number | null =
    authoritativeRevalidation?.checks?.priceAndSurcharge?.quotedPerPersonUsd ?? null;
  const quotedTotalUsd: number | null =
    authoritativeRevalidation?.checks?.priceAndSurcharge?.quotedTotalUsd ?? null;

  const providerConfirmation = authoritativeRevalidation?.providerConfirmation ?? {
    status: "unknown_until_authenticated_provider_response",
    liveAvailabilityStatus: "unknown",
    liveAvailableSeats: null,
    liveOperatorPricePerPersonUsd: null,
    authenticatedOutcomeId: null,
    requiresProviderConfirmationAtCheckout: true,
    explanation:
      "Live seat inventory, departure dispatch status, and final operator fare are not established by DCC and remain unknown until confirmed by an authenticated FareHarbor response.",
  };

  const versionedPolicySource = authoritativeRevalidation?.versionedPolicySource ?? null;

  const blockingReasons: string[] = handoffVerifiedServerSide
    ? (authoritativeRevalidation?.blockingReasons ?? [])
    : handoffLoadError
      ? [handoffLoadError.code]
      : [];

  const progressionAllowed = hasUrlHandoffAttempt
    ? handoffVerifiedServerSide &&
      authoritativeRevalidation?.progressionAllowed === true &&
      blockingReasons.length === 0
    : true;

  const revalidationStatus = progressionAllowed ? "passed" : "blocked";

  const checkoutBindingPayload = hasUrlHandoffAttempt
    ? {
        handoffId,
        handoffVerifiedServerSide,
        receiptId,
        receiptVerified,
        operatorShortname,
        fareharborItemId,
        fareharborDirectEmbedUrl: progressionAllowed ? fareharborDirectEmbedUrl : null,
        tourCode,
        intendedDate,
        departureId,
        departureTime,
        partySize,
        maxSinglePassengerWeightLbs,
        quotedPerPersonUsd,
        quotedTotalUsd,
        publishedBasePerPersonUsd,
        requiredWeightSurchargeUsd,
        publishedPolicyRequiredTotalUsd,
        versionedPolicySource,
        providerConfirmation,
        progressionAllowed,
        revalidationStatus,
        blockingReasons,
      }
    : null;

  return (
    <div className="site-shell-wrapper">
      <Script
        src="https://fareharbor.com/embeds/api/v1/?autolightframe=yes"
        strategy="afterInteractive"
      />
      <SiteHeader />
      <main className="site-main py-10">
        <div className="site-shell max-w-4xl mx-auto px-4">
          {checkoutBindingPayload && (
            <script
              id="dcc-checkout-binding"
              type="application/json"
              dangerouslySetInnerHTML={{
                __html: safeJsonSerializeForScriptTag(checkoutBindingPayload),
              }}
            />
          )}

          <div className="mb-8">
            <span className="text-xs font-bold tracking-widest text-sky-600 uppercase">
              Specialist Booking Portal • Juneau Flight Deck
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              Juneau Helicopter Tour Checkout Handoff
            </h1>
            <p className="text-slate-600 mt-2">
              DCC evaluates published operator policies and cruise port buffers. Final seat
              inventory, departure dispatch, and live fare are confirmed directly by the
              operator via FareHarbor.
            </p>
          </div>

          {hasUrlHandoffAttempt && (
            <div
              data-dcc-handoff-bound="true"
              data-handoff-verified={String(handoffVerifiedServerSide)}
              data-handoff-id={handoffId || ""}
              data-receipt-id={receiptId || ""}
              data-receipt-verified={String(receiptVerified)}
              data-fareharbor-shortname={operatorShortname || ""}
              data-fareharbor-item={fareharborItemId || ""}
              data-tour-code={tourCode || ""}
              data-intended-date={intendedDate || ""}
              data-departure-id={departureId || ""}
              data-departure-time={departureTime || ""}
              data-party-size={partySize !== null ? String(partySize) : ""}
              data-provider-confirmation-status={providerConfirmation.status}
              data-live-availability-status={providerConfirmation.liveAvailabilityStatus}
              data-revalidation-status={revalidationStatus}
              data-progression-allowed={String(progressionAllowed)}
              className={`p-6 mb-8 rounded-xl border shadow-sm ${
                progressionAllowed
                  ? "bg-slate-50 border-slate-300 text-slate-900"
                  : "bg-rose-50 border-rose-300 text-rose-950"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      progressionAllowed ? "bg-sky-600" : "bg-rose-600"
                    }`}
                  />
                  <span className="font-bold text-sm tracking-wide uppercase">
                    {progressionAllowed
                      ? "DCC Policy Handoff Revalidated — Live Fare & Seat Availability Confirmed in FareHarbor"
                      : "Pre-Booking Policy & Handoff Revalidation Gate Blocked Progression"}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-700">
                  Handoff: {handoffId || "unverified"} • Receipt:{" "}
                  {receiptId ? `${receiptId} (${receiptVerified ? "verified" : "unverified"})` : "none"}
                </span>
              </div>

              {handoffVerifiedServerSide ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase">
                      Operator & FareHarbor Item
                    </span>
                    <div className="text-base font-bold text-slate-900">
                      {operatorShortname || "unspecified"} • Item #{fareharborItemId || "N/A"}
                    </div>
                    <div className="text-xs text-slate-600 font-mono">{tourCode || "N/A"}</div>
                    {versionedPolicySource?.universeId && (
                      <div className="text-xs text-slate-500 mt-1">
                        Policy: {versionedPolicySource.universeId}@
                        {versionedPolicySource.universeVersion}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase">
                      Target Date, Slot & Published Tariff
                    </span>
                    <div className="text-base font-bold text-slate-900">
                      {intendedDate || "Unspecified Date"} @ {departureTime || "TBD"}
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      Target Slot: {departureId || "unspecified"} • {partySize ?? "?"}{" "}
                      {partySize === 1 ? "Traveler" : "Travelers"}
                    </div>
                    {publishedPolicyRequiredTotalUsd !== null &&
                      publishedBasePerPersonUsd !== null && (
                        <div className="text-xs text-slate-700 mt-1 font-semibold">
                          Published Policy Tariff: ${publishedPolicyRequiredTotalUsd.toFixed(2)}{" "}
                          USD (${publishedBasePerPersonUsd.toFixed(2)}/person base
                          {requiredWeightSurchargeUsd > 0
                            ? ` + $${requiredWeightSurchargeUsd.toFixed(2)} weight surcharge`
                            : ""}
                          )
                        </div>
                      )}
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase">
                      Provider Confirmation & Live Inventory
                    </span>
                    <div className="text-sm font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded inline-block mt-0.5">
                      Status: UNKNOWN UNTIL FAREHARBOR CHECKOUT
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Live seat count, departure dispatch status, and final operator fare are
                      not established by DCC; confirmed directly by FareHarbor.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-rose-900">
                  {handoffLoadError?.message ||
                    "Authoritative handoff record could not be verified with DCC."}
                </div>
              )}

              {!progressionAllowed && blockingReasons.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-rose-100 border border-rose-300 text-xs font-mono text-rose-900">
                  Blocking Reasons: {blockingReasons.join(", ")}
                </div>
              )}
            </div>
          )}

          {contextError && (
            <div className="p-4 mb-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
              <div className="font-bold">
                {contextError.status === 410
                  ? "Booking Context Expired (15-minute TTL)"
                  : contextError.status === 409
                    ? "Booking Session Already Active"
                    : "Context Notice"}
              </div>
              <p className="text-sm mt-1">{contextError.message}</p>
              <div className="mt-3">
                <Link
                  href="/helicopter"
                  className="inline-block text-xs font-semibold px-3 py-1.5 bg-amber-800 text-white rounded hover:bg-amber-900"
                >
                  Select Date & Times Manually
                </Link>
              </div>
            </div>
          )}

          {contextData && (
            <div className="p-6 mb-8 rounded-xl bg-sky-50 border border-sky-200 text-slate-900 shadow-sm">
              <div className="flex items-center justify-between border-b border-sky-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-sky-950 text-sm tracking-wide uppercase">
                    Port Timeline Context Loaded
                  </span>
                </div>
                <span className="text-xs font-mono text-sky-800">
                  Ref: {contextData.contextId.slice(0, 16)}...
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">
                    Port Date
                  </span>
                  <div className="text-base font-bold text-slate-900">
                    {contextData.schedule.date}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">
                    Party Size
                  </span>
                  <div className="text-base font-bold text-slate-900">
                    {contextData.schedule.travelers}{" "}
                    {contextData.schedule.travelers === 1 ? "Traveler" : "Travelers"}
                  </div>
                </div>
                {contextData.schedule.shipOrVenue && (
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase">
                      Cruise Ship
                    </span>
                    <div className="text-base font-bold text-slate-900">
                      {contextData.schedule.shipOrVenue}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">
                    Calculated Safe Dock Return
                  </span>
                  <div className="text-base font-bold text-emerald-800">
                    Latest Safe Return:{" "}
                    {contextData.safetyConstraint.latestSafeReturnTime || "TBD"} (
                    {contextData.safetyConstraint.bufferMinutes}m Alaska Buffer)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Authoritative FareHarbor Lightframe & Direct Booking Action */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {hasUrlHandoffAttempt
                ? "Operator Reservation Handoff (FareHarbor)"
                : "Select a Permitted Juneau Helicopter Operator (FareHarbor)"}
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              {hasUrlHandoffAttempt
                ? "Your evaluated tour, target date, departure slot, and party parameters are bound below. Proceeding opens the operator's FareHarbor booking calendar where live seat availability and final fare are confirmed prior to payment."
                : "Choose one of the three USFS Tongass National Forest permitted Juneau helicopter operators below to open live FareHarbor availability and checkout."}
            </p>

            {hasUrlHandoffAttempt ? (
              <div className="space-y-6">
                {handoffVerifiedServerSide && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">
                        Bound Operator & Item
                      </span>
                      <span className="font-bold text-slate-900">
                        {operatorShortname} • FareHarbor Item #{fareharborItemId} ({tourCode})
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">
                        Target Date & Departure
                      </span>
                      <span className="font-bold text-slate-900">
                        {intendedDate} @ {departureTime} ({departureId})
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">
                        Declared Party & Weight
                      </span>
                      <span className="font-bold text-slate-900">
                        {partySize} {partySize === 1 ? "Traveler" : "Travelers"}
                        {maxSinglePassengerWeightLbs !== null
                          ? ` • Max single traveler weight: ${maxSinglePassengerWeightLbs} lbs`
                          : ""}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">
                        Published Policy Tariff (Before Live Operator Check)
                      </span>
                      <span className="font-bold text-slate-900">
                        {publishedPolicyRequiredTotalUsd !== null &&
                        publishedBasePerPersonUsd !== null
                          ? `$${publishedPolicyRequiredTotalUsd.toFixed(2)} USD (${partySize} × $${publishedBasePerPersonUsd.toFixed(2)}${
                              requiredWeightSurchargeUsd > 0
                                ? ` + $${requiredWeightSurchargeUsd.toFixed(2)} weight surcharge`
                                : ""
                            })`
                          : "Confirmed in FareHarbor"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-amber-800 uppercase">
                      Provider Confirmation Status: UNKNOWN
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      FareHarbor establishes live seat availability, exact departure opening,
                      and final total before any payment commitment.
                    </p>
                  </div>

                  {progressionAllowed && fareharborDirectEmbedUrl ? (
                    <a
                      href={fareharborDirectEmbedUrl}
                      data-testid="fareharbor-booking-cta"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-6 py-3 font-bold rounded-lg shadow bg-sky-700 hover:bg-sky-800 text-white transition text-center"
                    >
                      Continue to FareHarbor Live Availability &amp; Checkout ↗
                    </a>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span
                        data-testid="fareharbor-booking-blocked"
                        className="px-5 py-2.5 font-bold rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-sm"
                      >
                        Booking Handoff Blocked by Revalidation Gate
                      </span>
                      <Link
                        href="/helicopter"
                        className="text-xs font-semibold text-sky-700 hover:underline"
                      >
                        Return to Helicopter Comparison →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-sky-700 uppercase">
                      Coastal Helicopters
                    </div>
                    <div className="font-bold text-slate-900 mt-1">
                      Icefield Excursion &amp; Glacier Walk
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Published Policy Base: $459/person • 260 lb / 300 lb weight surcharge tiers
                    </div>
                  </div>
                  <a
                    href="https://fareharbor.com/embeds/book/coastalhelicopters/items/4012/?asn=welcometoalaskatours&ref=juneauflightdeck-direct&full-items=yes"
                    data-testid="fareharbor-direct-coastal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-center text-xs font-bold px-4 py-2.5 rounded bg-sky-700 hover:bg-sky-800 text-white"
                  >
                    Check Coastal Availability on FareHarbor ↗
                  </a>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-sky-700 uppercase">
                      TEMSCO Helicopters
                    </div>
                    <div className="font-bold text-slate-900 mt-1">
                      Mendenhall Glacier &amp; Guided Walk
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Published Policy Base: $449/person • 250 lb weight surcharge (+$150)
                    </div>
                  </div>
                  <a
                    href="https://fareharbor.com/embeds/book/temscoair-juneau/items/214803/?asn=welcometoalaskatours&ref=juneauflightdeck-direct&full-items=yes"
                    data-testid="fareharbor-direct-temsco"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-center text-xs font-bold px-4 py-2.5 rounded bg-sky-700 hover:bg-sky-800 text-white"
                  >
                    Check TEMSCO Availability on FareHarbor ↗
                  </a>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-sky-700 uppercase">
                      NorthStar Trekking
                    </div>
                    <div className="font-bold text-slate-900 mt-1">
                      Helicopter Glacier Walkabout
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Published Policy Base: $499/person • 250 lb weight surcharge (+$150) • Min age 8
                    </div>
                  </div>
                  <a
                    href="https://fareharbor.com/embeds/book/northstartrekking/items/88310/?asn=welcometoalaskatours&ref=juneauflightdeck-direct&full-items=yes"
                    data-testid="fareharbor-direct-northstar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-center text-xs font-bold px-4 py-2.5 rounded bg-sky-700 hover:bg-sky-800 text-white"
                  >
                    Check NorthStar Availability on FareHarbor ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

