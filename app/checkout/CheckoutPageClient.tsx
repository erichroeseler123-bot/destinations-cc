"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getArgoProduct } from "@/lib/argoProducts";
import ArgoLaunchAlertForm from "@/components/ArgoLaunchAlertForm";

type CheckoutSnapshot = {
  productKey: string;
  title: string;
  date: string;
  qty: number;
  pickup: string;
  priceCents: number;
};

type CreateIntentResponse = {
  ok: boolean;
  mode?: "mock" | "live";
  paymentIntentId?: string;
  clientSecret?: string | null;
  message?: string;
  error?: string;
};

type FinalizeResponse = {
  ok: boolean;
  orderId?: string;
  paymentStatus?: string;
  error?: string;
};

export default function CheckoutPageClient() {
  const prelaunchMode = process.env.NEXT_PUBLIC_ARGO_PRELAUNCH !== "false";
  const sp = useSearchParams();
  const preloaded = useRef(false);
  const [snapshot, setSnapshot] = useState<CheckoutSnapshot | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [intent, setIntent] = useState<CreateIntentResponse | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [finalized, setFinalized] = useState<FinalizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const route = sp.get("route");
  const isArgo = route === "argo";

  useEffect(() => {
    if (preloaded.current) return;
    if (!isArgo) return;

    const productKey = sp.get("product");
    const date = sp.get("date");
    const qty = Math.max(1, Number(sp.get("qty") || "1"));
    const pickup = sp.get("pickup") || "Denver";

    const product = getArgoProduct(productKey);
    if (!product || !date) return;

    setSnapshot({
      productKey: product.key,
      title: product.title,
      date,
      qty: Math.min(qty, product.maxQty),
      pickup,
      priceCents: product.priceCents,
    });

    preloaded.current = true;
  }, [isArgo, sp]);

  const total = useMemo(() => {
    if (!snapshot) return 0;
    return (snapshot.priceCents * snapshot.qty) / 100;
  }, [snapshot]);

  async function createPaymentIntent() {
    if (prelaunchMode) return;
    if (!snapshot) return;
    setCreateBusy(true);
    setError(null);
    setIntent(null);
    setFinalized(null);

    try {
      const resp = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: snapshot.priceCents * snapshot.qty,
          currency: "usd",
          route: "argo",
          product: snapshot.productKey,
          qty: snapshot.qty,
          date: snapshot.date,
          pickup: snapshot.pickup,
          customerEmail,
        }),
      });

      const data = (await resp.json()) as CreateIntentResponse;
      if (!resp.ok || !data.ok) {
        setError(data.error || "Unable to create PaymentIntent.");
        return;
      }

      setIntent(data);
    } catch {
      setError("Network error creating PaymentIntent.");
    } finally {
      setCreateBusy(false);
    }
  }

  async function finalizeBooking() {
    if (prelaunchMode) return;
    if (!snapshot || !intent?.paymentIntentId) return;
    setFinalizeBusy(true);
    setError(null);

    try {
      const resp = await fetch("/api/stripe/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: "argo",
          product: snapshot.productKey,
          date: snapshot.date,
          qty: snapshot.qty,
          pickup: snapshot.pickup,
          customerName,
          customerEmail,
          customerPhone,
          paymentIntentId: intent.paymentIntentId,
        }),
      });

      const data = (await resp.json()) as FinalizeResponse;
      if (!resp.ok || !data.ok) {
        setError(data.error || "Finalize failed.");
        return;
      }
      setFinalized(data);
    } catch {
      setError("Network error finalizing booking.");
    } finally {
      setFinalizeBusy(false);
    }
  }

  if (!isArgo) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">
        <h1 className="text-3xl font-black">Checkout</h1>
        <p className="mt-3 text-slate-600">
          No preload request found. Start from the Argo booking flow to initialize checkout.
        </p>
        <Link href="/book?route=argo&product=argo-seat" className="mt-6 inline-block text-blue-700">
          Start Argo booking
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-900">
      <h1 className="text-3xl font-black">Checkout</h1>
      <p className="mt-2 text-slate-600">
        Argo booking preload is active. Review this cart snapshot before payment wiring.
      </p>
      {prelaunchMode ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Prelaunch mode is on. Payments and order finalization are disabled until opening.
        </div>
      ) : null}

      {!snapshot ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-700">
            Missing required params. Return to booking and choose product + date.
          </p>
          <Link href="/book?route=argo&product=argo-seat" className="mt-4 inline-block text-blue-700">
            Back to booking
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid gap-2 text-sm text-slate-700">
            <div>
              <span className="font-bold">Product:</span> {snapshot.title}
            </div>
            <div>
              <span className="font-bold">Date:</span> {snapshot.date}
            </div>
            <div>
              <span className="font-bold">Pickup:</span> {snapshot.pickup}
            </div>
            <div>
              <span className="font-bold">Quantity:</span> {snapshot.qty}
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-600">Estimated total</div>
            <div className="text-2xl font-black">${total.toFixed(2)}</div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
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

          <button
            type="button"
            onClick={createPaymentIntent}
            disabled={createBusy || prelaunchMode}
            className="mt-5 min-h-11 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {prelaunchMode
              ? "Payments disabled (prelaunch)"
              : createBusy
                ? "Creating PaymentIntent..."
                : "Create Stripe PaymentIntent"}
          </button>

          {intent?.paymentIntentId ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div>
                <span className="font-bold">PaymentIntent:</span> {intent.paymentIntentId}
              </div>
              <div className="mt-1">
                <span className="font-bold">Mode:</span> {intent.mode || "unknown"}
              </div>
              {intent.message ? <div className="mt-1">{intent.message}</div> : null}
              {intent.mode === "live" ? (
                <div className="mt-1 text-slate-600">
                  Complete payment using your Stripe client flow, then finalize booking.
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={finalizeBooking}
            disabled={!intent?.paymentIntentId || finalizeBusy || prelaunchMode}
            className="mt-4 min-h-11 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {prelaunchMode ? "Finalization disabled (prelaunch)" : finalizeBusy ? "Finalizing..." : "Finalize Booking"}
          </button>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}

          {finalized?.ok && finalized.orderId ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="font-bold">Booking confirmed</div>
              <div className="mt-1">Order ID: {finalized.orderId}</div>
              <div className="mt-1">Payment status: {finalized.paymentStatus}</div>
            </div>
          ) : null}

          {prelaunchMode ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-800">Want first access when bookings open?</div>
              <p className="mt-1 text-sm text-slate-600">Join the Argo launch alert list.</p>
              <div className="mt-3">
                <ArgoLaunchAlertForm source="checkout-prelaunch" compact />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
