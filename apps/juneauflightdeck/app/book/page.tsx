import Link from "next/link";
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
  campaign?: string;
  receipt_id?: string;
  viator_code?: string;
  tour?: string;
  date?: string;
  departure?: string;
  time?: string;
  party_size?: string;
  passenger_weights_lbs?: string;
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
    searchParams.campaign || searchParams.ref,
  );

  const hasUrlHandoffAttempt = Boolean(
    resolvedHandoffId ||
      searchParams.handoff_id?.trim() ||
      searchParams.receipt_id?.trim() ||
      searchParams.viator_code?.trim() ||
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
  const parsedPassengerWeightsLbs =
    typeof searchParams.passenger_weights_lbs === "string" &&
    searchParams.passenger_weights_lbs.trim() !== ""
      ? searchParams.passenger_weights_lbs
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n) && n > 0)
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
        requestedViatorProductCode: searchParams.viator_code?.trim() || null,
        requestedDate: searchParams.date?.trim() || null,
        requestedDepartureId: searchParams.departure?.trim() || null,
        requestedDepartureTime: searchParams.time?.trim() || null,
        requestedPartySize:
          requestedPartySize !== null && Number.isFinite(requestedPartySize)
            ? requestedPartySize
            : null,
        passengerWeightsLbs: parsedPassengerWeightsLbs,
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
  const bookingProvider = authoritativeRevalidation?.bookingProvider ?? "viator";
  const viatorProductCode =
    authoritativeRevalidation?.viatorProductCode ??
    authoritativeHandoff?.viatorProductCode ??
    null;
  const viatorBookingUrl =
    authoritativeRevalidation?.viatorBookingUrl ??
    authoritativeHandoff?.checkoutBookingBinding?.viatorBookingUrl ??
    authoritativeHandoff?.outboundAffiliateUrl ??
    null;
  const viatorWorryFreeShoreExcursion =
    authoritativeRevalidation?.viatorWorryFreeShoreExcursion ??
    authoritativeHandoff?.checkoutBookingBinding?.viatorWorryFreeShoreExcursion ??
    null;
  const travelerReselectionRequirements =
    authoritativeRevalidation?.travelerReselectionRequirements ??
    authoritativeHandoff?.checkoutBookingBinding?.travelerReselectionRequirements ??
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
  const passengerWeightsLbs: number[] | null =
    authoritativeRevalidation?.checks?.priceAndSurcharge?.passengerWeightsLbs ?? null;
  const publishedGroupTotalConfirmed: boolean =
    authoritativeRevalidation?.checks?.priceAndSurcharge?.publishedGroupTotalConfirmed ===
    true;

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
      "Live seat inventory, departure time slot availability, and final fare are not established by DCC and remain unknown until confirmed in Viator.",
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
        bookingProvider,
        viatorProductCode,
        viatorBookingUrl: progressionAllowed ? viatorBookingUrl : null,
        viatorWorryFreeShoreExcursion,
        travelerReselectionRequirements,
        tourCode,
        intendedDate,
        departureId,
        departureTime,
        partySize,
        passengerWeightsLbs,
        maxSinglePassengerWeightLbs,
        publishedGroupTotalConfirmed,
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
              Specialist Referral Portal • Juneau Flight Deck → Viator
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              Juneau Helicopter Tour Referral &amp; Pre-Booking Review
            </h1>
            <p className="text-slate-600 mt-2">
              <strong>DCC evaluates tour suitability; Juneau Flight Deck explains the options; Viator handles the booking and applicable booking protections.</strong>{" "}
              Confirm final price and availability in Viator.
            </p>
          </div>

          {/* Role & Back-to-Ship Guarantee Disclosure Banner */}
          <div className="p-5 mb-8 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-900 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
              Back-to-Ship Protection &amp; Role Separation
            </div>
            <p className="text-sm text-slate-800 leading-relaxed">
              Qualifying Viator tours marked{" "}
              <strong>&ldquo;Worry-free Shore Excursion&rdquo;</strong> (such as{" "}
              <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                6251SHOREXICEWALK
              </code>
              , Viator Tag <code className="font-mono text-xs">367649</code>) are covered by{" "}
              <a
                href="https://www.viator.com/support/termsAndConditions"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-900 underline"
              >
                Viator Terms of Use Section 20 (&ldquo;Worry-free Shore Excursions&rdquo;)
              </a>{" "}
              when you provide accurate ship arrival/departure information to Viator, select a
              tour ending at least <strong>2 hours (120 minutes) before ship departure</strong>,
              and are not delayed by your own actions (up to{" "}
              <strong>US$1,000 per person</strong> next-port transport;{" "}
              <strong>14-day refund window</strong> if your ship misses or is delayed into port).{" "}
              <strong>
                DCC&apos;s cruise-timing buffer calculation evaluates schedule suitability only —
                DCC itself does not provide a back-to-ship guarantee.
              </strong>
            </p>
          </div>

          {hasUrlHandoffAttempt && (
            <div
              data-dcc-handoff-bound="true"
              data-handoff-verified={String(handoffVerifiedServerSide)}
              data-handoff-id={handoffId || ""}
              data-receipt-id={receiptId || ""}
              data-receipt-verified={String(receiptVerified)}
              data-booking-provider={bookingProvider}
              data-viator-product-code={viatorProductCode || ""}
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
                      ? "DCC Policy Handoff Revalidated — Confirm final price and availability in Viator"
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
                      Evaluated Tour &amp; Viator Product
                    </span>
                    <div className="text-base font-bold text-slate-900">
                      Viator {viatorProductCode || "Search Referral"}
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
                      Target Date, Planned Slot &amp; Published Tariff
                    </span>
                    <div className="text-base font-bold text-slate-900">
                      {intendedDate || "Unspecified Date"}{" "}
                      {departureTime ? `(Planned ${departureTime})` : ""}
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      {partySize ?? "?"} {partySize === 1 ? "Traveler" : "Travelers"}
                      {passengerWeightsLbs && passengerWeightsLbs.length > 0
                        ? ` • Weights: ${passengerWeightsLbs.join(", ")} lbs`
                        : maxSinglePassengerWeightLbs !== null
                          ? ` • Max weight: ${maxSinglePassengerWeightLbs} lbs`
                          : ""}
                    </div>
                    {publishedGroupTotalConfirmed &&
                    publishedPolicyRequiredTotalUsd !== null &&
                    publishedBasePerPersonUsd !== null ? (
                      <div className="text-xs text-slate-700 mt-1 font-semibold">
                        Published Policy Estimate: ${publishedPolicyRequiredTotalUsd.toFixed(2)}{" "}
                        USD (${publishedBasePerPersonUsd.toFixed(2)}/person base
                        {requiredWeightSurchargeUsd > 0
                          ? ` + $${requiredWeightSurchargeUsd.toFixed(2)} weight surcharge`
                          : ""}
                        )
                      </div>
                    ) : (
                      <div className="text-xs text-amber-900 mt-1 font-semibold">
                        Group total unconfirmed until all individual passenger weights are entered
                        and confirmed in Viator.
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase">
                      Provider Confirmation &amp; Live Inventory
                    </span>
                    <div className="text-sm font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded inline-block mt-0.5">
                      Confirm final price and availability in Viator
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Live seat count, departure time slot availability, and final fare are not
                      established by DCC; confirmed directly in Viator.
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
                  Select Date &amp; Times Manually
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
                    Calculated Safe Dock Return (DCC Suitability Check)
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

          {/* Viator Referral & Traveler Reselection Requirements */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {hasUrlHandoffAttempt
                ? "Viator Booking Referral & Traveler Selection Checklist"
                : "Juneau Helicopter Excursions — Book via Viator"}
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              {hasUrlHandoffAttempt
                ? "Your DCC-evaluated tour, date, and party parameters are preserved below. Confirm final price and availability in Viator."
                : "Compare Juneau Part 135 helicopter operators below and proceed to Viator to confirm final price, live departure time slots, and Section 20 Worry-free Shore Excursion terms."}
            </p>

            {/* Explicit disclosure of what transfers in the URL vs what must be reselected in Viator */}
            <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wide">
                What Transfers in the Viator Referral Link vs. What You Must Reselect in Viator
              </div>
              <p>
                <strong>Carried in Viator URL query parameters:</strong> Exact Viator product (
                <code className="font-mono">d941-6251SHOREXICEWALK</code>), affiliate attribution (
                <code className="font-mono">pid=P00058396</code>,{" "}
                <code className="font-mono">mcid=42383</code>,{" "}
                <code className="font-mono">medium=api</code>,{" "}
                <code className="font-mono">campaign=...__{handoffId || "<handoff_id>"}</code>),{" "}
                <code className="font-mono">startDate={intendedDate || "YYYY-MM-DD"}</code>, and{" "}
                <code className="font-mono">numTravelers={partySize ?? 2}</code>.
              </p>
              <p>
                <strong>Must be confirmed or reselected inside Viator&apos;s booking widget:</strong>{" "}
                (1) Verify your travel date and guest count in Viator&apos;s availability calendar,
                (2) select your specific departure time slot (ending at least 2 hours before ship
                departure for Section 20 Worry-free Shore Excursion coverage), (3) select the
                required passenger weight-tier option (
                <code className="font-mono">DEFAULT</code> 1–259 lbs,{" "}
                <code className="font-mono">TG1</code> 260–299 lbs half-seat surcharge, or{" "}
                <code className="font-mono">TG2</code> 300+ lbs second seat per{" "}
                <a
                  href="https://coastalhelicopters.com/faq/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  Coastal Helicopters FAQ
                </a>
                ), and (4) enter each traveler&apos;s individual clothed weight and cruise ship
                arrival/departure details at Viator checkout.
              </p>
            </div>

            {hasUrlHandoffAttempt ? (
              <div className="space-y-6">
                {handoffVerifiedServerSide && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">
                        Bound Viator Product &amp; Operator
                      </span>
                      <span className="font-bold text-slate-900">
                        Viator {viatorProductCode || "Search Referral"} ({tourCode})
                      </span>
                      {viatorWorryFreeShoreExcursion?.qualifiesForViatorWorryFreeGuarantee && (
                        <span className="block text-xs text-emerald-800 font-semibold mt-1">
                          ✓ Qualifies for Viator Worry-free Shore Excursion (Section 20, Tag 367649)
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">
                        Target Date &amp; Planned Window
                      </span>
                      <span className="font-bold text-slate-900">
                        {intendedDate} {departureTime ? `@ ${departureTime}` : ""}{" "}
                        {departureId ? `(${departureId})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">
                        Declared Party &amp; Weight
                      </span>
                      <span className="font-bold text-slate-900">
                        {partySize} {partySize === 1 ? "Traveler" : "Travelers"}
                        {passengerWeightsLbs && passengerWeightsLbs.length > 0
                          ? ` • Passenger weights: ${passengerWeightsLbs.join(", ")} lbs`
                          : maxSinglePassengerWeightLbs !== null
                            ? ` • Max single traveler weight: ${maxSinglePassengerWeightLbs} lbs`
                            : ""}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase">
                        Published Policy Estimate (Confirm Final Price in Viator)
                      </span>
                      <span className="font-bold text-slate-900">
                        {publishedGroupTotalConfirmed &&
                        publishedPolicyRequiredTotalUsd !== null &&
                        publishedBasePerPersonUsd !== null
                          ? `$${publishedPolicyRequiredTotalUsd.toFixed(2)} USD (${partySize} × $${publishedBasePerPersonUsd.toFixed(2)}${
                              requiredWeightSurchargeUsd > 0
                                ? ` + $${requiredWeightSurchargeUsd.toFixed(2)} weight surcharge`
                                : ""
                            })`
                          : "Confirm final price and availability in Viator"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-amber-800 uppercase">
                      Confirm final price and availability in Viator
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      Viator establishes live seat availability, exact departure time slot selection,
                      final price, and Section 20 Worry-free Shore Excursion coverage at checkout.
                    </p>
                  </div>

                  {progressionAllowed && viatorBookingUrl ? (
                    <a
                      href={viatorBookingUrl}
                      data-testid="viator-booking-cta"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-6 py-3 font-bold rounded-lg shadow bg-sky-700 hover:bg-sky-800 text-white transition text-center"
                    >
                      Confirm Final Price &amp; Availability in Viator ↗
                    </a>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span
                        data-testid="viator-booking-blocked"
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
                <div className="p-4 rounded-lg border border-emerald-300 bg-emerald-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-sky-700 uppercase">
                        Coastal Helicopters
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                        Worry-Free (§20)
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 mt-1">
                      Juneau Shore Excursion Helicopter Tour &amp; Guided Icefield Walk
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Viator <code className="font-mono">6251SHOREXICEWALK</code> • Published Base:
                      $459/person • 260–299 lb (+$150 TG1) / 300+ lb (TG2) tiers
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <a
                      href="https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-book-coastal-icefield"
                      data-testid="viator-direct-coastal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs font-bold px-4 py-2.5 rounded bg-sky-700 hover:bg-sky-800 text-white"
                    >
                      Confirm Final Price &amp; Availability in Viator ↗
                    </a>
                    <a
                      href="https://coastalhelicopters.com/tours/icefield-excursion/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-[11px] font-semibold text-slate-600 hover:underline"
                    >
                      Operator Policy Reference (Coastal Helicopters) ↗
                    </a>
                  </div>
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
                      Published Policy Base: $449/person • 250 lb weight surcharge (+$150) • Verify
                      Section 20 Worry-free badge on Viator listing
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <a
                      href="https://www.viator.com/searchResults/all?text=Juneau+Mendenhall+Glacier+helicopter+tour&pid=P00058396&mcid=42383&medium=api&campaign=jfd-book-temsco-search"
                      data-testid="viator-direct-temsco"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs font-bold px-4 py-2.5 rounded bg-sky-700 hover:bg-sky-800 text-white"
                    >
                      Search Mendenhall Helicopter Options on Viator ↗
                    </a>
                    <a
                      href="https://temscoair.com/tours/pilots-choice-exploration/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-[11px] font-semibold text-slate-600 hover:underline"
                    >
                      Operator Policy Reference (TEMSCO) ↗
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-sky-700 uppercase">
                      NorthStar Trekking
                    </div>
                    <div className="font-bold text-slate-900 mt-1">
                      Helicopter Glacier Walkabout (1 Hour on Ice)
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Published Policy Base: $499/person • 250 lb weight surcharge (+$150) • Min age
                      8 • Verify Section 20 Worry-free badge on Viator listing
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <a
                      href="https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Walkabout+helicopter&pid=P00058396&mcid=42383&medium=api&campaign=jfd-book-northstar-search"
                      data-testid="viator-direct-northstar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs font-bold px-4 py-2.5 rounded bg-sky-700 hover:bg-sky-800 text-white"
                    >
                      Search Glacier Walkabout Options on Viator ↗
                    </a>
                    <a
                      href="https://northstartrekking.com/treks/tours/helicopter-glacier-walkabout/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-[11px] font-semibold text-slate-600 hover:underline"
                    >
                      Operator Policy Reference (NorthStar) ↗
                    </a>
                  </div>
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


