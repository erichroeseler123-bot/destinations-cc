"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ArgoLaunchAlertForm from "@/components/ArgoLaunchAlertForm";
import SquarePaymentForm from "./SquarePaymentForm";
import {
  getBalanceDueAt,
  getCheckoutPricing,
  getCheckoutProduct,
  getCheckoutRouteConfig,
} from "@/lib/checkoutProducts";
import { getSquareApplicationId, getSquareLocationId, isSquareConfigured } from "@/lib/squareConfig";

type CheckoutSnapshot = {
  route: string;
  productKey: string;
  title: string;
  date: string;
  qty: number;
  partySize: number;
  pickup: string;
  dropoff: string;
  pickupTime: string;
};

type CheckoutPageClientProps = {
  initialRoute: string | null;
  initialSnapshot: CheckoutSnapshot | null;
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

type AvailabilityResponse = {
  ok: boolean;
  availability?: Array<{
    productKey: string;
    total: number;
    booked: number;
    remaining: number;
    available: boolean;
  }>;
};

type CreateIntentResponse = {
  ok: boolean;
  mode?: string;
  paymentIntentId?: string;
  amountDueNowCents?: number;
  totalCents?: number;
  remainingBalanceCents?: number;
  error?: string;
};

type CheckoutStep = "review" | "details" | "customer" | "payment" | "confirmation";

const STEP_ORDER: CheckoutStep[] = ["review", "details", "customer", "payment", "confirmation"];
const PARR_SUPPORT_PHONE = "7203696292";
const PARR_SUPPORT_PHONE_DISPLAY = "720-369-6292";

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDueDate(value?: string | null) {
  if (!value) return "48 hours before service";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "48 hours before service";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatServiceDate(value: string) {
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

export default function CheckoutPageClient({
  initialRoute,
  initialSnapshot,
}: CheckoutPageClientProps) {
  const preloaded = useRef(false);
  const [step, setStep] = useState<CheckoutStep>("review");
  const [snapshot, setSnapshot] = useState<CheckoutSnapshot | null>(initialSnapshot);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [finalized, setFinalized] = useState<FinalizeResponse | null>(null);
  const [intent, setIntent] = useState<CreateIntentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingFleet, setRemainingFleet] = useState<number | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [finalizeBusy, setFinalizeBusy] = useState(false);

  const route = initialRoute;
  const routeConfig = getCheckoutRouteConfig(route);
  const squareConfigured = ["parr-private", "parr-shared"].includes(route || "") && isSquareConfigured();
  const paymentsEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === "true";
  const prelaunchMode = ["parr-private", "parr-shared"].includes(route || "")
    ? paymentsEnabled === false
    : process.env.NEXT_PUBLIC_ARGO_PRELAUNCH === "false" ? false : true;

  useEffect(() => {
    if (preloaded.current || !initialSnapshot) return;
    setSnapshot(initialSnapshot);
    preloaded.current = true;
  }, [initialSnapshot]);

  useEffect(() => {
    let cancelled = false;
    async function loadAvailability() {
      if (snapshot == null || ["parr-private", "parr-shared"].includes(snapshot.route) === false) return;
      try {
        const resp = await fetch(
          `/api/transport/availability?route=${encodeURIComponent(snapshot.route)}&date=${encodeURIComponent(snapshot.date)}`,
          { cache: "no-store" },
        );
        const data = (await resp.json()) as AvailabilityResponse;
        if (!resp.ok || !data.ok) return;
        const row = data.availability?.find((item) => item.productKey === snapshot.productKey);
        if (!cancelled) setRemainingFleet(typeof row?.remaining === "number" ? row.remaining : null);
      } catch {
        if (!cancelled) setRemainingFleet(null);
      }
    }
    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [snapshot]);

  const pricing = useMemo(() => {
    if (!snapshot) return null;
    return getCheckoutPricing(snapshot.route, snapshot.productKey, snapshot.qty);
  }, [snapshot]);

  const balanceDueAt = useMemo(() => {
    if (!snapshot || !routeConfig) return null;
    return getBalanceDueAt(snapshot.date, routeConfig.balanceDueHours);
  }, [routeConfig, snapshot]);
  const supportMessage = useMemo(
    () => buildSupportMessage(finalized?.orderId, snapshot?.title || "Party at Red Rocks ride"),
    [finalized?.orderId, snapshot?.title],
  );

  function nextStep() {
    if (!snapshot) return;
    if (step === "review") {
      setStep("details");
      return;
    }
    if (step === "details") {
      if (!snapshot.pickup.trim() || !snapshot.dropoff.trim()) {
        setError("Pickup and drop-off are required.");
        return;
      }
      setError(null);
      setStep("customer");
      return;
    }
    if (step === "customer") {
      if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
        setError("Name, email, and phone are required.");
        return;
      }
      setError(null);
      setStep("payment");
    }
  }

  function previousStep() {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex <= 0) return;
    setStep(STEP_ORDER[currentIndex - 1]);
  }

  async function createPaymentIntent() {
    if (snapshot == null) return;
    setCreateBusy(true);
    setError(null);

    try {
      const resp = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: snapshot.route,
          product: snapshot.productKey,
          qty: snapshot.qty,
          partySize: snapshot.partySize,
          date: snapshot.date,
          pickup: snapshot.pickup,
          customerEmail,
        }),
      });
      const data = (await resp.json()) as CreateIntentResponse;
      if (resp.ok === false || data.ok === false) {
        setError(data.error || "Unable to create payment intent.");
        return;
      }
      setIntent(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create payment intent.");
    } finally {
      setCreateBusy(false);
    }
  }

  async function finalizeBooking() {
    setFinalizeBusy(true);
    setError("This checkout path still needs a final order-writer. Use a Party at Red Rocks Square route for live bookings.");
    setFinalizeBusy(false);
  }

  if (!routeConfig) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">
        <h1 className="text-3xl font-black">Checkout</h1>
        <p className="mt-3 text-slate-600">
          No preload request found. Start from a supported booking flow to initialize checkout.
        </p>
        <Link href="/book?route=argo&product=argo-seat" className="mt-6 inline-block text-blue-700">
          Start booking
        </Link>
      </main>
    );
  }

  if (route === "parr-private") {
    return (
      <main className="min-h-screen bg-[#0d1117] px-4 py-6 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                Red Rocks Shuttle Checkout
              </p>
              <p className="mt-2 text-sm text-slate-300">Flat-rate ride with guaranteed return</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div className="font-semibold text-slate-200">PARR</div>
              <div>Private concert transport</div>
            </div>
          </div>

          {!snapshot || !pricing ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl">
              <h1 className="text-3xl font-black">Reserve My Ride</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                No booking snapshot is loaded yet. Start from the Party at Red Rocks booking flow so
                the ride, event date, pickup, and price are already filled in.
              </p>
              <Link
                href={routeConfig.backHref}
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-black uppercase tracking-[0.12em] text-slate-950"
              >
                Back to Party at Red Rocks
              </Link>
            </div>
          ) : finalized ? (
            <div className="rounded-[28px] border border-emerald-400/30 bg-emerald-500/10 p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                Booking Confirmed
              </p>
              <h1 className="mt-3 text-3xl font-black">Your ride is locked in.</h1>
              <p className="mt-3 max-w-2xl text-emerald-50/90">
                Confirmation is in. Your return after the show is included, and you can text support if
                pickup details need to be adjusted.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/88">
                  <div className="font-bold">Booking details</div>
                  <div className="mt-3">Order ID: {finalized.orderId || "Pending"}</div>
                  <div className="mt-1">Ride: {snapshot.title}</div>
                  <div className="mt-1">Date: {formatServiceDate(snapshot.date)}</div>
                  <div className="mt-1">Pickup: {snapshot.pickup}</div>
                  <div className="mt-1">Riders: {snapshot.partySize}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/88">
                  <div className="font-bold">Payment</div>
                  <div className="mt-3">Paid now: {formatMoney(finalized.amountPaidCents || pricing.amountDueNowCents)}</div>
                  <div className="mt-1">Remaining: {formatMoney(finalized.remainingBalanceCents || pricing.remainingBalanceCents)}</div>
                  <div className="mt-1">Due by: {formatDueDate(finalized.balanceDueAt || balanceDueAt)}</div>
                  <div className="mt-1">Status: {finalized.paymentStatus || "deposit_paid"}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`sms:${PARR_SUPPORT_PHONE}?&body=${encodeURIComponent(supportMessage)}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-black uppercase tracking-[0.12em] text-slate-950"
                >
                  Text Support
                </a>
                <a
                  href={`https://wa.me/1${PARR_SUPPORT_PHONE}?text=${encodeURIComponent(supportMessage)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 px-5 text-sm font-black uppercase tracking-[0.12em] text-white"
                >
                  WhatsApp
                </a>
                {(finalized.remainingBalanceCents || pricing.remainingBalanceCents) > 0 && finalized.orderId ? (
                  <Link
                    href={`/pay-balance/${encodeURIComponent(finalized.orderId)}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 px-5 text-sm font-black uppercase tracking-[0.12em] text-white"
                  >
                    Pay Remaining Balance
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="order-1 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl lg:order-1">
                <div className="max-w-2xl">
                  <h1 className="text-3xl font-black text-white">Reserve My Ride</h1>
                  <p className="mt-3 text-slate-300">
                    Autofill your contact info, confirm the deposit, and you&apos;re done. Your ride details are already loaded.
                  </p>
                </div>

                {prelaunchMode ? (
                  <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                    Payments are disabled in this environment.
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                    {error}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-5">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Contact</p>
                    <div className="mt-4 grid gap-4">
                      <label className="block text-sm font-bold text-white">
                        Full name
                        <input
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          autoComplete="name"
                          className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500"
                          placeholder="Your full name"
                        />
                      </label>
                      <label className="block text-sm font-bold text-white">
                        Email
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          autoComplete="email"
                          inputMode="email"
                          className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500"
                          placeholder="you@example.com"
                        />
                      </label>
                      <label className="block text-sm font-bold text-white">
                        Phone
                        <input
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          autoComplete="tel"
                          inputMode="tel"
                          className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-slate-500"
                          placeholder="(555) 555-5555"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Payment</p>
                    <div className="mt-3 text-sm text-slate-300">
                      Deposit due now: <span className="font-bold text-white">{formatMoney(pricing.amountDueNowCents)}</span>
                      {pricing.remainingBalanceCents > 0 ? (
                        <>
                          {" "}• Remaining later: <span className="font-bold text-white">{formatMoney(pricing.remainingBalanceCents)}</span>
                        </>
                      ) : null}
                    </div>

                    {squareConfigured ? (
                      <SquarePaymentForm
                        applicationId={getSquareApplicationId()}
                        locationId={getSquareLocationId()}
                        amountDollars={(pricing.amountDueNowCents / 100).toFixed(2)}
                        productTitle={snapshot.title}
                        route={snapshot.route}
                        productKey={snapshot.productKey}
                        date={snapshot.date}
                        qty={snapshot.qty}
                        partySize={snapshot.partySize}
                        pickup={snapshot.pickup}
                        dropoff={snapshot.dropoff}
                        pickupTime={snapshot.pickupTime}
                        customerName={customerName}
                        customerEmail={customerEmail}
                        customerPhone={customerPhone}
                        specialRequests=""
                        disabled={prelaunchMode || !customerName.trim() || !customerEmail.trim() || !customerPhone.trim()}
                        onSuccess={(data) => {
                          setError(null);
                          setFinalized(data);
                        }}
                        onError={(message) => {
                          setError(message || null);
                        }}
                      />
                    ) : (
                      <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                        Square checkout is not configured for this environment. Use the canonical booking page at <span className="font-bold text-white">/book/red-rocks</span> once payments are enabled.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <div>Your ride home is included</div>
                      <div>No surge pricing</div>
                      <div>Confirmation sent instantly</div>
                      <div>Need help? Text support available</div>
                    </div>
                    <p className="mt-4 text-xs uppercase tracking-[0.14em] text-slate-500">
                      Private Red Rocks transport
                    </p>
                  </div>
                </div>
              </section>

              <aside className="order-2 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl lg:order-2 lg:sticky lg:top-6 lg:self-start">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Booking Summary</p>
                <h2 className="mt-3 text-2xl font-black">{snapshot.title}</h2>
                <div className="mt-5 space-y-3 text-sm text-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Date</span>
                    <span className="text-right font-semibold">{formatServiceDate(snapshot.date)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Pickup</span>
                    <span className="text-right font-semibold">{snapshot.pickup}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Drop-off</span>
                    <span className="text-right font-semibold">{snapshot.dropoff}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Riders</span>
                    <span className="text-right font-semibold">{snapshot.partySize}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Total</span>
                    <span className="text-right text-xl font-black text-white">{formatMoney(pricing.totalCents)}</span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                  <div className="text-sm font-bold text-emerald-200">Guaranteed return included</div>
                  <div className="mt-2 text-sm text-emerald-50/85">
                    Flat price, one clean pickup plan, and your ride home after the show is built in.
                  </div>
                </div>

                <div className="mt-5 grid gap-2 text-sm text-slate-300">
                  <div>Flat price</div>
                  <div>Guaranteed ride home</div>
                  <div>Secure checkout</div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 text-slate-900">
      <h1 className="text-3xl font-black">{routeConfig.checkoutTitle}</h1>
      <p className="mt-2 text-slate-600">{routeConfig.checkoutIntro}</p>

      {prelaunchMode ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Prelaunch mode is on. Payments and order finalization are disabled until opening.
        </div>
      ) : null}

      {route === "parr-private" ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {squareConfigured
            ? "Deposit checkout is active for this private ride."
            : "Square is not configured yet on this environment. This page will fall back to the Stripe deposit flow."}
        </div>
      ) : null}

      {!snapshot || !pricing ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-700">
            Missing required params. Return to booking and choose product + date.
          </p>
          <Link href={routeConfig.backHref} className="mt-4 inline-block text-blue-700">
            {routeConfig.backLabel}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-5">
            {[
              ["1", "Review", "review"],
              ["2", "Details", "details"],
              ["3", "Customer", "customer"],
              ["4", "Payment", "payment"],
              ["5", "Confirm", "confirmation"],
            ].map(([index, label, key]) => {
              const active = step === key;
              const complete = STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(key as CheckoutStep);
              return (
                <div
                  key={key}
                  className={`rounded-xl border px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : complete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <div>{index}</div>
                  <div className="mt-1">{label}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            {step === "review" ? (
              <>
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Step 1</div>
                <h2 className="mt-2 text-2xl font-black">Review your ride and pricing</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <div><span className="font-bold">Service:</span> {snapshot.title}</div>
                    <div className="mt-2"><span className="font-bold">Date:</span> {snapshot.date}</div>
                    <div className="mt-2"><span className="font-bold">{snapshot.route === "parr-private" ? "Vehicles" : snapshot.route === "parr-shared" ? "Seats" : "Quantity"}:</span> {snapshot.qty}</div>
                    <div className="mt-2"><span className="font-bold">Party size:</span> {snapshot.partySize}</div>
                    {["parr-private", "parr-shared"].includes(snapshot.route) && remainingFleet !== null ? (
                      <div className="mt-2"><span className="font-bold">{snapshot.route === "parr-private" ? "Vehicles still open" : "Seats still open"}:</span> {remainingFleet}</div>
                    ) : null}
                  </div>
                  <div className="rounded-xl bg-slate-900 p-4 text-white">
                    <div className="text-sm uppercase tracking-[0.16em] text-white/60">Pricing</div>
                    <div className="mt-3 text-3xl font-black">{formatMoney(pricing.totalCents)}</div>
                    <div className="mt-4 grid gap-2 text-sm text-white/82">
                      <div><span className="font-bold text-white">Pay now:</span> {formatMoney(pricing.amountDueNowCents)} ({pricing.depositPercentage}%)</div>
                      <div><span className="font-bold text-white">Remaining:</span> {formatMoney(pricing.remainingBalanceCents)}</div>
                      {pricing.remainingBalanceCents > 0 ? (
                        <div><span className="font-bold text-white">Due by:</span> {formatDueDate(balanceDueAt)}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {step === "details" ? (
              <>
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Step 2</div>
                <h2 className="mt-2 text-2xl font-black">Pickup and trip details</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Pickup location
                    <input
                      type="text"
                      value={snapshot.pickup}
                      onChange={(e) => setSnapshot((current) => (current ? { ...current, pickup: e.target.value } : current))}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Drop-off
                    <input
                      type="text"
                      value={snapshot.dropoff}
                      onChange={(e) => setSnapshot((current) => (current ? { ...current, dropoff: e.target.value } : current))}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Pickup time
                    <input
                      type="text"
                      value={snapshot.pickupTime}
                      onChange={(e) => setSnapshot((current) => (current ? { ...current, pickupTime: e.target.value } : current))}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>
                </div>
                {snapshot.route === "parr-private" ? (
                  <label className="mt-4 block text-sm font-bold text-slate-700">
                    Notes for the driver
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={4}
                      placeholder="Liquor store stop, extra pickup notes, or other details."
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            {step === "customer" ? (
              <>
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Step 3</div>
                <h2 className="mt-2 text-2xl font-black">Customer information</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <label className="block text-sm font-bold text-slate-700">
                    Name
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Email
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Phone
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>
                </div>
              </>
            ) : null}

            {step === "payment" ? (
              <>
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Step 4</div>
                <h2 className="mt-2 text-2xl font-black">Pay deposit</h2>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div><span className="font-bold">Total:</span> {formatMoney(pricing.totalCents)}</div>
                  <div className="mt-1"><span className="font-bold">Deposit due now:</span> {formatMoney(pricing.amountDueNowCents)}</div>
                  <div className="mt-1"><span className="font-bold">Remaining balance:</span> {formatMoney(pricing.remainingBalanceCents)}</div>
                  {pricing.remainingBalanceCents > 0 ? (
                    <div className="mt-1"><span className="font-bold">Balance due:</span> {formatDueDate(balanceDueAt)}</div>
                  ) : null}
                </div>

                {squareConfigured && ["parr-private", "parr-shared"].includes(snapshot.route) ? (
                  <SquarePaymentForm
                    applicationId={getSquareApplicationId()}
                    locationId={getSquareLocationId()}
                    amountDollars={(pricing.amountDueNowCents / 100).toFixed(2)}
                    productTitle={snapshot.title}
                    route={snapshot.route}
                    productKey={snapshot.productKey}
                    date={snapshot.date}
                    qty={snapshot.qty}
                    partySize={snapshot.partySize}
                    pickup={snapshot.pickup}
                    dropoff={snapshot.dropoff}
                    pickupTime={snapshot.pickupTime}
                    customerName={customerName}
                    customerEmail={customerEmail}
                    customerPhone={customerPhone}
                    specialRequests={specialRequests}
                    disabled={prelaunchMode || !customerName.trim() || !customerEmail.trim() || !customerPhone.trim()}
                    onSuccess={(data) => {
                      setError(null);
                      setFinalized(data);
                      setStep("confirmation");
                    }}
                    onError={(message) => {
                      setError(message || null);
                    }}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={createPaymentIntent}
                      disabled={createBusy || prelaunchMode}
                      className="mt-5 min-h-11 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {prelaunchMode
                        ? "Payments disabled (prelaunch)"
                        : createBusy
                          ? "Creating deposit payment..."
                          : `Create Deposit Payment - ${formatMoney(pricing.amountDueNowCents)}`}
                    </button>

                    {intent?.paymentIntentId ? (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <div><span className="font-bold">PaymentIntent:</span> {intent.paymentIntentId}</div>
                        <div className="mt-1"><span className="font-bold">Mode:</span> {intent.mode || "unknown"}</div>
                        <div className="mt-1">Deposit amount: {formatMoney(intent.amountDueNowCents || pricing.amountDueNowCents)}</div>
                        <button
                          type="button"
                          onClick={finalizeBooking}
                          disabled={finalizeBusy || prelaunchMode}
                          className="mt-4 min-h-11 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {finalizeBusy ? "Finalizing..." : "Finalize Booking After Deposit"}
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </>
            ) : null}

            {step === "confirmation" ? (
              <>
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-600">Step 5</div>
                <h2 className="mt-2 text-2xl font-black">You&apos;re booked</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <div className="font-bold">Booking details</div>
                    <div className="mt-2">Order ID: {finalized?.orderId || "Pending"}</div>
                    <div className="mt-1">Service: {snapshot.title}</div>
                    <div className="mt-1">Date: {snapshot.date}</div>
                    <div className="mt-1">Pickup: {snapshot.pickup}</div>
                    <div className="mt-1">Drop-off: {snapshot.dropoff}</div>
                    <div className="mt-1">Pickup time: {snapshot.pickupTime}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
                    <div><span className="font-bold">Amount paid:</span> {formatMoney(finalized?.amountPaidCents || pricing.amountDueNowCents)}</div>
                    <div className="mt-1"><span className="font-bold">Remaining balance:</span> {formatMoney(finalized?.remainingBalanceCents || pricing.remainingBalanceCents)}</div>
                    <div className="mt-1"><span className="font-bold">Status:</span> {finalized?.paymentStatus || "deposit_paid"}</div>
                    <div className="mt-1"><span className="font-bold">Due date:</span> {formatDueDate(finalized?.balanceDueAt || balanceDueAt)}</div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={`sms:${PARR_SUPPORT_PHONE}?&body=${encodeURIComponent(supportMessage)}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                  >
                    Text us
                  </a>
                  <a
                    href={`https://wa.me/1${PARR_SUPPORT_PHONE}?text=${encodeURIComponent(supportMessage)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`data:text/calendar;charset=utf8,${encodeURIComponent(
                      `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${snapshot.title}
DTSTART:${snapshot.date.replaceAll("-", "")}T163000
DESCRIPTION:Pickup ${snapshot.pickup}
LOCATION:${snapshot.dropoff}
END:VEVENT
END:VCALENDAR`,
                    )}`}
                    download="booking.ics"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900"
                  >
                    Add to calendar
                  </a>
                  {(finalized?.remainingBalanceCents || pricing.remainingBalanceCents) > 0 && finalized?.orderId ? (
                    <Link
                      href={`/pay-balance/${encodeURIComponent(finalized.orderId)}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900"
                    >
                      Pay remaining balance
                    </Link>
                  ) : null}
                  <Link
                    href={routeConfig.backHref}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                  >
                    Back to booking page
                  </Link>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Need to update pickup or ask a question? Text or WhatsApp{" "}
                  <span className="font-bold text-slate-900">{PARR_SUPPORT_PHONE_DISPLAY}</span>.
                </p>
              </>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : null}

            {step !== "confirmation" ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {step !== "review" ? (
                  <button
                    type="button"
                    onClick={previousStep}
                    className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900"
                  >
                    Back
                  </button>
                ) : null}
                {step !== "payment" ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="min-h-11 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
                  >
                    Continue
                  </button>
                ) : null}
              </div>
            ) : null}

            {route === "argo" ? (
              <div className="mt-8">
                <ArgoLaunchAlertForm />
              </div>
            ) : null}
          </div>
        </>
      )}
    </main>
  );
}
