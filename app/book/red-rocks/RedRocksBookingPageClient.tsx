"use client";

import { useEffect, useMemo, useState } from "react";
import SquarePaymentForm from "@/app/checkout/SquarePaymentForm";
import ContactForm from "./components/ContactForm";
import BookingSummaryCard from "./components/BookingSummaryCard";
import PickupSelector from "./components/PickupSelector";
import RideTypeSelector from "./components/RideTypeSelector";
import {
  getBalanceDueAt,
  getCheckoutPricing,
  getCheckoutProductsForRoute,
  getCheckoutProduct,
} from "@/lib/checkoutProducts";
import { getSquareApplicationId, getSquareLocationId, isSquareConfigured } from "@/lib/squareConfig";

type AvailabilityRow = {
  productKey: string;
  total: number;
  booked: number;
  remaining: number;
  available: boolean;
};

type AvailabilityResponse = {
  ok: boolean;
  availability?: AvailabilityRow[];
  error?: string;
};

type FinalizeResponse = {
  ok: boolean;
  orderId?: string;
  paymentStatus?: string;
  totalCents?: number;
  amountPaidCents?: number;
  remainingBalanceCents?: number;
  balanceDueAt?: string;
  error?: string;
};

type ResultState = "idle" | "success" | "failure" | "needs-review";

type RedRocksBookingPageClientProps = {
  initialProductKey?: string;
  initialDate?: string;
  initialPickup?: string;
  initialPickupTime?: string;
  initialPartySize?: string;
};

const PARR_SUPPORT_PHONE = "7203696292";
const PARR_SUPPORT_PHONE_DISPLAY = "720-369-6292";

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatServiceDate(value: string) {
  if (!value) return "Choose date";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildSupportMessage(orderId: string | undefined, title: string) {
  return `Hey - I need help with this booking:\nBooking ID: ${orderId || "pending"}\n${title}`;
}

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function RedRocksBookingPageClient({
  initialProductKey,
  initialDate,
  initialPickup,
  initialPickupTime,
  initialPartySize,
}: RedRocksBookingPageClientProps) {
  const products = useMemo(() => getCheckoutProductsForRoute("parr-private"), []);
  const defaultProductKey = products[0]?.key || "parr-suburban";

  const [productKey, setProductKey] = useState(
    initialProductKey && getCheckoutProduct(initialProductKey)?.route === "parr-private"
      ? initialProductKey
      : defaultProductKey,
  );
  const [date, setDate] = useState(initialDate || "");
  const [pickup, setPickup] = useState(initialPickup || "");
  const [pickupTime, setPickupTime] = useState(initialPickupTime || "4:30 PM");
  const [partySize, setPartySize] = useState(Math.max(1, Number(initialPartySize || "6")));
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [resultState, setResultState] = useState<ResultState>("idle");
  const [result, setResult] = useState<FinalizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const product = useMemo(() => getCheckoutProduct(productKey), [productKey]);
  const pricing = useMemo(() => getCheckoutPricing("parr-private", productKey, 1), [productKey]);
  const balanceDueAt = useMemo(() => getBalanceDueAt(date, 48), [date]);
  const squareConfigured = isSquareConfigured();
  const paymentsEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === "true";

  useEffect(() => {
    if (!product) return;
    setPartySize((current) => Math.min(Math.max(1, current), product.maxPassengers || 24));
  }, [product]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (!date) {
        setAvailability([]);
        return;
      }

      setLoadingAvailability(true);
      try {
        const resp = await fetch(`/api/transport/availability?route=parr-private&date=${encodeURIComponent(date)}`, {
          cache: "no-store",
        });
        const data = (await resp.json()) as AvailabilityResponse;
        if (!cancelled) {
          setAvailability(resp.ok && data.ok ? data.availability || [] : []);
        }
      } catch {
        if (!cancelled) setAvailability([]);
      } finally {
        if (!cancelled) setLoadingAvailability(false);
      }
    }

    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const selectedAvailability = availability.find((row) => row.productKey === productKey) || null;
  const remainingFleet = selectedAvailability ? selectedAvailability.remaining : null;
  const soldOut = selectedAvailability ? !selectedAvailability.available : false;
  const tripComplete = Boolean(product && date && pickup.trim());
  const contactComplete = Boolean(customerName.trim() && customerEmail.trim() && customerPhone.trim());
  const availabilityStatus =
    !date
      ? "Choose a date to see live availability."
      : loadingAvailability
        ? "Checking live availability..."
        : selectedAvailability
          ? soldOut
            ? "This ride is sold out for the selected date."
            : remainingFleet !== null && remainingFleet <= 2
              ? `Only ${remainingFleet} vehicle${remainingFleet === 1 ? "" : "s"} left for this date.`
              : "Availability confirmed for this date."
          : "Live availability unavailable right now.";
  const canPay =
    Boolean(product) &&
    Boolean(pricing) &&
    Boolean(date) &&
    Boolean(pickup.trim()) &&
    Boolean(customerName.trim()) &&
    Boolean(customerEmail.trim()) &&
    Boolean(customerPhone.trim()) &&
    !soldOut;
  const readinessLabel = canPay ? "Ready to pay" : "Finish details to unlock payment";

  const supportMessage = buildSupportMessage(result?.orderId, product?.title || "Party at Red Rocks ride");
  const earlyPriceLabel = pricing ? formatMoney(pricing.amountDueNowCents) : "$0.00";

  function resetAfterFailure() {
    setResultState("idle");
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-[#0d1117] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Party At Red Rocks</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Book Your Red Rocks Shuttle</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              Pick the ride, enter the essentials, pay securely, and get your confirmation.
            </p>
          </div>
          <div className="hidden rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-right lg:block">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Booking mode</div>
            <div className="mt-2 text-lg font-bold text-white">Private rides only</div>
          </div>
        </div>

        {resultState === "success" && result && product && pricing ? (
          <div className="rounded-[28px] border border-emerald-400/30 bg-emerald-500/10 p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Confirmed</p>
            <h2 className="mt-3 text-3xl font-black">Your Red Rocks ride is locked in.</h2>
            <p className="mt-3 max-w-2xl text-emerald-50/90">
              Deposit received. Your return after the show is included, and support is one text away if pickup details need to change.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/88">
                <div className="font-bold">Trip</div>
                <div className="mt-3">Order ID: {result.orderId || "Pending"}</div>
                <div className="mt-1">Ride: {product.title}</div>
                <div className="mt-1">Date: {formatServiceDate(date)}</div>
                <div className="mt-1">Pickup: {pickup}</div>
                <div className="mt-1">Pickup time: {pickupTime}</div>
                <div className="mt-1">Riders: {partySize}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/88">
                <div className="font-bold">Payment</div>
                <div className="mt-3">Paid now: {formatMoney(result.amountPaidCents || pricing.amountDueNowCents)}</div>
                <div className="mt-1">Remaining later: {formatMoney(result.remainingBalanceCents || pricing.remainingBalanceCents)}</div>
                <div className="mt-1">Due by: {result.balanceDueAt || balanceDueAt || "48 hours before service"}</div>
                <div className="mt-1">Status: {result.paymentStatus || "deposit_paid"}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`sms:${PARR_SUPPORT_PHONE}?&body=${encodeURIComponent(supportMessage)}`}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-black uppercase tracking-[0.12em] text-slate-950"
              >
                Text support
              </a>
              <button
                type="button"
                onClick={resetAfterFailure}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 px-5 text-sm font-black uppercase tracking-[0.12em] text-white"
              >
                Book another ride
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-2xl sm:p-6">
              {!paymentsEnabled ? (
                <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  Payments are disabled in this environment right now.
                </div>
              ) : null}

              {resultState === "failure" && error ? (
                <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              {resultState === "needs-review" ? (
                <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  Payment went through but this booking needs manual review. Text {PARR_SUPPORT_PHONE_DISPLAY} and we will resolve it quickly.
                </div>
              ) : null}

              <div className="grid gap-4">
                <section className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 ${tripComplete ? "scale-100 bg-emerald-500/15 text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,0.15)]" : "scale-[0.98] border border-white/10 bg-white/5 text-slate-300"}`}>
                      {tripComplete ? "✓ Trip set" : "Trip details"}
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 ${contactComplete ? "scale-100 bg-emerald-500/15 text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,0.15)]" : "scale-[0.98] border border-white/10 bg-white/5 text-slate-300"}`}>
                      {contactComplete ? "✓ Contact ready" : "Contact info"}
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 ${canPay ? "scale-100 bg-orange-500 text-slate-950 shadow-[0_0_0_1px_rgba(249,115,22,0.25)]" : "scale-[0.98] border border-white/10 bg-white/5 text-slate-300"}`}>
                      {readinessLabel}
                    </div>
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-300">Trip selection</p>
                  <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Pick your ride</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Choose the vehicle, date, and pickup.
                  </p>

                  <div className="mt-4">
                    <RideTypeSelector
                      products={products}
                      selectedKey={productKey}
                      onSelect={(key) => {
                        setProductKey(key);
                        setResultState("idle");
                        setError(null);
                      }}
                      availability={availability}
                      loading={loadingAvailability}
                      statusMessage={availabilityStatus}
                    />
                  </div>

                  <div className="mt-4 rounded-[24px] border border-orange-400/20 bg-gradient-to-r from-orange-500/12 to-amber-400/8 p-4">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300">Pay now</div>
                        <div className="mt-1 text-3xl font-black text-white">{earlyPriceLabel}</div>
                        <div className="mt-1 text-sm text-slate-300">Lock your vehicle with the deposit, then finish the rest later.</div>
                      </div>
                      <a
                        href="#payment-section"
                        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-slate-950"
                      >
                        Continue to payment
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="block text-sm font-bold text-white">
                      Concert date
                      <input
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                      />
                    </label>
                    <label className="block text-sm font-bold text-white">
                      Riders
                      <input
                        type="number"
                        min={1}
                        max={product?.maxPassengers || 24}
                        value={partySize}
                        onChange={(event) => setPartySize(Math.max(1, Number(event.target.value) || 1))}
                        className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                      />
                    </label>
                    <label className="block text-sm font-bold text-white md:col-span-2">
                      Pickup time
                      <input
                        value={pickupTime}
                        onChange={(event) => setPickupTime(event.target.value)}
                        placeholder="4:30 PM"
                        className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500"
                      />
                    </label>
                  </div>

                  <div className="mt-4">
                    <PickupSelector value={pickup} onChange={setPickup} />
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-300">Rider details</p>
                  <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Who should we contact?</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Autofill should do most of the work here.
                  </p>
                  <div className="mt-4">
                    <ContactForm
                      name={customerName}
                      email={customerEmail}
                      phone={customerPhone}
                      complete={contactComplete}
                      onNameChange={setCustomerName}
                      onEmailChange={setCustomerEmail}
                      onPhoneChange={(value) => setCustomerPhone(formatPhoneInput(value))}
                    />
                  </div>
                </section>

                <section id="payment-section" className="rounded-[28px] border border-white/10 bg-black/20 p-4 scroll-mt-24">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-300">Payment</p>
                  <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Pay deposit</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Reserve now to lock your vehicle. Vehicles are limited per show date.
                  </p>

                  <div className={`mt-4 rounded-2xl border p-4 text-sm ${canPay ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300"}`}>
                    <div className="font-bold">{readinessLabel}</div>
                    <div className="mt-1">
                      {canPay
                        ? "Your trip details and contact info are complete."
                        : "Add the trip details and contact info above to unlock payment."}
                    </div>
                  </div>

                  {soldOut ? (
                    <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                      That vehicle is no longer available for this date. Pick another ride or another date.
                    </div>
                  ) : pricing && product ? (
                    <SquarePaymentForm
                      applicationId={getSquareApplicationId()}
                      locationId={getSquareLocationId()}
                      amountDollars={(pricing.amountDueNowCents / 100).toFixed(2)}
                      productTitle={product.title}
                      route="parr-private"
                      productKey={product.key}
                      date={date}
                      qty={1}
                      partySize={partySize}
                      pickup={pickup}
                      dropoff="Red Rocks Amphitheatre"
                      pickupTime={pickupTime}
                      customerName={customerName}
                      customerEmail={customerEmail}
                      customerPhone={customerPhone}
                      specialRequests=""
                      disabled={!squareConfigured || !paymentsEnabled || !canPay}
                      onSuccess={(data) => {
                        if (!data.ok) {
                          setResultState("failure");
                          setError(data.error || "Payment failed.");
                          return;
                        }
                        if (data.paymentStatus === "needs_review") {
                          setResultState("needs-review");
                          setResult(data);
                          setError(null);
                          return;
                        }
                        setResult(data);
                        setResultState("success");
                        setError(null);
                      }}
                      onError={(message) => {
                        setResultState("failure");
                        setError(message || "Payment failed.");
                      }}
                    />
                  ) : (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      Choose your ride details first to unlock payment.
                    </div>
                  )}

                  {!squareConfigured ? (
                    <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                      Square is not configured in this environment yet.
                    </div>
                  ) : null}
                </section>

                <section className="rounded-[28px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-300">Trust</p>
                  <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <div>Fixed pricing</div>
                    <div>Guaranteed return included</div>
                    <div>Support by text at {PARR_SUPPORT_PHONE_DISPLAY}</div>
                    <div>Private Red Rocks concert transport</div>
                  </div>
                </section>
              </div>
            </section>

            <BookingSummaryCard
              title={product?.title || "Choose a ride"}
              date={date}
              pickup={pickup}
              pickupTime={pickupTime}
              partySize={partySize}
              totalCents={pricing?.totalCents || 0}
              depositCents={pricing?.amountDueNowCents || 0}
              remainingBalanceCents={pricing?.remainingBalanceCents || 0}
              remainingFleet={remainingFleet}
              paymentHref="#payment-section"
            />
          </div>
        )}

      </div>
    </main>
  );
}
