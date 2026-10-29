import Link from "next/link";
import { cookies } from "next/headers";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { getOrCreateCheckoutSession, JFD_CHECKOUT_COOKIE_NAME } from "../../lib/dccContext";

interface BookPageSearchParams {
  ctx?: string;
  handoff_id?: string;
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
  quoted_price?: string;
  live_price?: string;
  available_seats?: string;
  departure_status?: string;
  requires_assisted_boarding?: string;
  carrying_drone?: string;
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

  const handoffId = searchParams.handoff_id?.trim() || null;
  const receiptId = searchParams.receipt_id?.trim() || null;
  const operatorShortname =
    searchParams.shortname?.trim() || searchParams.asn?.trim() || null;
  const fareharborItemId = searchParams.item?.trim() || null;
  const tourCode = searchParams.tour?.trim() || null;
  const intendedDate =
    searchParams.date?.trim() || contextData?.schedule?.date || null;
  const departureId = searchParams.departure?.trim() || null;
  const departureTime = searchParams.time?.trim() || null;
  const partySizeNum = searchParams.party_size
    ? Number(searchParams.party_size)
    : typeof contextData?.schedule?.travelers === "number"
      ? contextData.schedule.travelers
      : null;
  const maxWeightLbs = searchParams.max_weight_lbs
    ? Number(searchParams.max_weight_lbs)
    : null;
  const quotedPriceRaw = searchParams.quoted_price
    ? Number(searchParams.quoted_price)
    : null;

  const hasDccHandoffBinding = Boolean(
    handoffId || fareharborItemId || departureId || tourCode,
  );

  const catalogBasePerPersonUsd =
    tourCode === "jnu-heli-temsco-mendenhall"
      ? 419
      : tourCode === "jnu-heli-northstar-level1-trek"
        ? 529
        : 459;

  const effectivePartySize =
    partySizeNum && Number.isFinite(partySizeNum) && partySizeNum > 0 ? partySizeNum : 1;

  const quotedTotalUsd =
    quotedPriceRaw !== null && Number.isFinite(quotedPriceRaw)
      ? quotedPriceRaw >= catalogBasePerPersonUsd * effectivePartySize * 0.9 &&
        effectivePartySize > 1
        ? quotedPriceRaw
        : quotedPriceRaw * effectivePartySize
      : null;
  const quotedPerPersonUsd =
    quotedTotalUsd !== null
      ? Number((quotedTotalUsd / effectivePartySize).toFixed(2))
      : null;

  const livePerPersonUsd = searchParams.live_price
    ? Number(searchParams.live_price)
    : quotedPerPersonUsd ?? catalogBasePerPersonUsd;

  const requiredWeightSurchargeUsd =
    typeof maxWeightLbs === "number" && Number.isFinite(maxWeightLbs)
      ? tourCode === "jnu-heli-temsco-mendenhall"
        ? maxWeightLbs >= 250
          ? 179.5
          : 0
        : maxWeightLbs >= 300
          ? 459
          : maxWeightLbs >= 260
            ? 150
            : 0
      : 0;

  const liveRequiredTotalUsd = Number(
    (livePerPersonUsd * effectivePartySize + requiredWeightSurchargeUsd).toFixed(2),
  );

  const availableSeats = searchParams.available_seats
    ? Number(searchParams.available_seats)
    : 6;
  const departureStatus = (searchParams.departure_status || "OPEN").toUpperCase();
  const requiresAssistedBoarding = searchParams.requires_assisted_boarding === "true";
  const carryingDrone = searchParams.carrying_drone === "true";

  const blockingReasons: string[] = [];
  if (hasDccHandoffBinding) {
    if (
      !operatorShortname ||
      !fareharborItemId ||
      !tourCode ||
      !intendedDate ||
      !departureId ||
      !departureTime ||
      !partySizeNum ||
      partySizeNum <= 0
    ) {
      blockingReasons.push("INCOMPLETE_BOOKABLE_DEPARTURE_BINDING_BLOCKS_PROGRESSION");
    }
    if (
      quotedPerPersonUsd !== null &&
      Math.abs(livePerPersonUsd - quotedPerPersonUsd) > 0.01
    ) {
      blockingReasons.push("LIVE_OPERATOR_PRICE_DRIFT_BLOCKS_PROGRESSION");
    }
    if (
      requiredWeightSurchargeUsd > 0 &&
      quotedTotalUsd !== null &&
      liveRequiredTotalUsd > quotedTotalUsd + 0.01
    ) {
      blockingReasons.push("UNQUOTED_WEIGHT_SURCHARGE_AT_CHECKIN_BLOCKS_PROGRESSION");
    }
    if (departureStatus !== "OPEN") {
      blockingReasons.push(`DEPARTURE_STATUS_${departureStatus}_BLOCKS_PROGRESSION`);
    }
    if (partySizeNum && availableSeats < partySizeNum) {
      blockingReasons.push("DEPARTURE_INSUFFICIENT_SEATS_BLOCKS_PROGRESSION");
    }
    if (intendedDate) {
      const m = /^\d{4}-(\d{2})-\d{2}/.exec(intendedDate);
      const month = m ? Number(m[1]) : NaN;
      if (!Number.isFinite(month) || month < 5 || month > 9) {
        blockingReasons.push("OUTSIDE_MAY_SEPTEMBER_OPERATING_SEASON_BLOCKS_PROGRESSION");
      }
    }
    if (requiresAssistedBoarding) {
      blockingReasons.push("ASSISTED_BOARDING_NOT_PERMITTED_BLOCKS_PROGRESSION");
    }
    if (carryingDrone) {
      blockingReasons.push("PROHIBITED_ITEM_DRONE_BLOCKS_PROGRESSION");
    }
  }

  const progressionAllowed = hasDccHandoffBinding ? blockingReasons.length === 0 : true;
  const revalidationStatus = progressionAllowed ? "passed" : "blocked";

  const checkoutBindingPayload = hasDccHandoffBinding
    ? {
        handoffId,
        receiptId,
        operatorShortname,
        fareharborItemId,
        tourCode,
        intendedDate,
        departureId,
        departureTime,
        partySize: partySizeNum,
        maxSinglePassengerWeightLbs: maxWeightLbs,
        quotedPerPersonUsd,
        quotedTotalUsd,
        livePerPersonUsd,
        requiredWeightSurchargeUsd,
        liveRequiredTotalUsd,
        availableSeats,
        departureStatus,
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
                __html: JSON.stringify(checkoutBindingPayload),
              }}
            />
          )}

          <div className="mb-8">
            <span className="text-xs font-bold tracking-widest text-sky-600 uppercase">
              Direct Merchant Booking • Juneau Flight Deck
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              Confirm Your Glacier Helicopter Flight
            </h1>
            <p className="text-slate-600 mt-2">
              Flights are scheduled with recommended port safety buffers prior to ship departure.
            </p>
          </div>

          {hasDccHandoffBinding && (
            <div
              data-dcc-handoff-bound="true"
              data-handoff-id={handoffId || ""}
              data-receipt-id={receiptId || ""}
              data-fareharbor-shortname={operatorShortname || ""}
              data-fareharbor-item={fareharborItemId || ""}
              data-tour-code={tourCode || ""}
              data-intended-date={intendedDate || ""}
              data-departure-id={departureId || ""}
              data-departure-time={departureTime || ""}
              data-party-size={partySizeNum !== null ? String(partySizeNum) : ""}
              data-revalidation-status={revalidationStatus}
              data-progression-allowed={String(progressionAllowed)}
              className={`p-6 mb-8 rounded-xl border shadow-sm ${
                progressionAllowed
                  ? "bg-emerald-50 border-emerald-200 text-slate-900"
                  : "bg-rose-50 border-rose-300 text-rose-950"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      progressionAllowed ? "bg-emerald-600" : "bg-rose-600"
                    }`}
                  />
                  <span className="font-bold text-sm tracking-wide uppercase">
                    {progressionAllowed
                      ? "DCC Verified Departure & Pre-Commitment Revalidation Passed"
                      : "Pre-Booking Revalidation Gate Blocked Progression"}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-700">
                  Handoff: {handoffId || "unlinked"} • Receipt: {receiptId || "unlinked"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">
                    Operator & FareHarbor Item
                  </span>
                  <div className="text-base font-bold text-slate-900">
                    {operatorShortname || "unspecified"} • Item #{fareharborItemId || "N/A"}
                  </div>
                  <div className="text-xs text-slate-600 font-mono">{tourCode || "N/A"}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">
                    Bookable Departure Slot
                  </span>
                  <div className="text-base font-bold text-slate-900">
                    {intendedDate || "Unspecified Date"} @ {departureTime || "TBD"}
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    Slot ID: {departureId || "unspecified"} ({departureStatus} • {availableSeats} seats open)
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">
                    Travelers & Revalidated Fare
                  </span>
                  <div className="text-base font-bold text-slate-900">
                    {partySizeNum ?? "Unspecified"}{" "}
                    {partySizeNum === 1 ? "Traveler" : "Travelers"} • ${liveRequiredTotalUsd.toFixed(2)} USD
                  </div>
                  <div className="text-xs text-slate-600">
                    ${livePerPersonUsd.toFixed(2)}/person
                    {maxWeightLbs !== null ? ` • Max weight ${maxWeightLbs} lbs` : ""}
                  </div>
                </div>
              </div>

              {!progressionAllowed && (
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
                    Port Timeline Verified
                  </span>
                </div>
                <span className="text-xs font-mono text-sky-800">
                  Ref: {contextData.contextId.slice(0, 16)}...
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">Port Date</span>
                  <div className="text-base font-bold text-slate-900">{contextData.schedule.date}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">Party Size</span>
                  <div className="text-base font-bold text-slate-900">
                    {contextData.schedule.travelers} {contextData.schedule.travelers === 1 ? "Traveler" : "Travelers"}
                  </div>
                </div>
                {contextData.schedule.shipOrVenue && (
                  <div>
                    <span className="text-slate-500 text-xs font-semibold uppercase">Cruise Ship</span>
                    <div className="text-base font-bold text-slate-900">{contextData.schedule.shipOrVenue}</div>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">Calculated Safe Dock Return</span>
                  <div className="text-base font-bold text-emerald-800">
                    Latest Safe Return: {contextData.safetyConstraint.latestSafeReturnTime || "TBD"} (
                    {contextData.safetyConstraint.bufferMinutes}m Alaska Buffer)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Direct Checkout Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Passenger Details</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Traveler Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (Port Day Contact)</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bound Flight Departure</label>
                  <select
                    defaultValue={departureId || "dep-coastal-1330"}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {departureId && departureTime && (
                      <option value={departureId}>
                        {departureTime} ({departureId} • Item #{fareharborItemId || "4012"} •{" "}
                        {intendedDate || "Selected Date"})
                      </option>
                    )}
                    <option value="dep-coastal-0930">09:30 (Morning Glacier)</option>
                    <option value="dep-coastal-1145">11:45 (Midday Sun)</option>
                    <option value="dep-coastal-1330">13:30 (Afternoon Icefield Excursion)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500">Pricing — live rate confirmed by operator before charge</span>
                  <div className="text-xl font-bold text-slate-900">
                    {hasDccHandoffBinding
                      ? `$${liveRequiredTotalUsd.toFixed(2)} USD (${partySizeNum ?? 1} ${
                          partySizeNum === 1 ? "Traveler" : "Travelers"
                        } @ $${livePerPersonUsd.toFixed(2)}/ea)`
                      : "Pricing finalized upon flight slot selection"}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Final departure slot, passenger weights, and live fare confirmed prior to charge.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!progressionAllowed}
                  className={`px-6 py-3 font-bold rounded-lg shadow transition ${
                    progressionAllowed
                      ? "bg-sky-700 hover:bg-sky-800 text-white"
                      : "bg-slate-300 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  {progressionAllowed
                    ? "Review reservation details"
                    : "Booking Blocked by Revalidation Gate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
