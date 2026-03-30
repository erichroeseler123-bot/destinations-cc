"use client";

import { useEffect, useRef, useState } from "react";

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

type SquarePaymentFormProps = {
  applicationId: string;
  locationId: string;
  amountDollars: string;
  productTitle: string;
  route: string;
  productKey: string;
  date: string;
  qty: number;
  partySize: number;
  pickup: string;
  dropoff: string;
  pickupTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests: string;
  disabled?: boolean;
  onSuccess: (result: FinalizeResponse) => void;
  onError: (message: string) => void;
};

type SquareCard = {
  attach: (selector: string) => Promise<void>;
  destroy?: () => Promise<void>;
  tokenize: (verificationDetails?: unknown) => Promise<{ status: string; token?: string; errors?: Array<{ message?: string }> }>;
};

declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId: string) => Promise<{
        card: () => Promise<SquareCard>;
      }>;
    };
  }
}

const SQUARE_JS_URL = "https://web.squarecdn.com/v1/square.js";

function loadSquareScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Square) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SQUARE_JS_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Square JS failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SQUARE_JS_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Square JS failed to load."));
    document.head.appendChild(script);
  });
}

export default function SquarePaymentForm(props: SquarePaymentFormProps) {
  const cardRef = useRef<SquareCard | null>(null);
  const initializedRef = useRef(false);
  const onErrorRef = useRef(props.onError);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    onErrorRef.current = props.onError;
  }, [props.onError]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (initializedRef.current) return;
      try {
        await loadSquareScript();
        if (!window.Square) throw new Error("Square JS unavailable.");
        const payments = await window.Square.payments(props.applicationId, props.locationId);
        const card = await payments.card();
        await card.attach("#square-card-container");
        cardRef.current = card;
        initializedRef.current = true;
        if (!cancelled) setReady(true);
      } catch (error) {
        if (!cancelled) {
          onErrorRef.current(error instanceof Error ? error.message : "Unable to load Square payment form.");
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
      void cardRef.current?.destroy?.();
      cardRef.current = null;
      initializedRef.current = false;
    };
  }, [props.applicationId, props.locationId]);

  async function submitPayment() {
    if (!cardRef.current || props.disabled) return;
    setBusy(true);
    props.onError("");

    try {
      const tokenResult = await cardRef.current.tokenize({
        amount: props.amountDollars,
        billingContact: {
          familyName: props.customerName.split(" ").slice(1).join(" ") || props.customerName,
          givenName: props.customerName.split(" ")[0] || props.customerName,
          email: props.customerEmail,
          phone: props.customerPhone,
        },
        currencyCode: "USD",
        intent: "CHARGE",
      });

      if (tokenResult.status !== "OK" || !tokenResult.token) {
        const firstError = tokenResult.errors?.[0]?.message || "Square tokenization failed.";
        props.onError(firstError);
        return;
      }

      const resp = await fetch("/api/square/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: props.route,
          product: props.productKey,
          date: props.date,
          qty: props.qty,
          partySize: props.partySize,
          pickup: props.pickup,
          dropoff: props.dropoff,
          pickupTime: props.pickupTime,
          customerName: props.customerName,
          customerEmail: props.customerEmail,
          customerPhone: props.customerPhone,
          specialRequests: props.specialRequests,
          sourceId: tokenResult.token,
        }),
      });

      const data = (await resp.json()) as FinalizeResponse;
      if (!resp.ok || !data.ok) {
        props.onError(data.error || "Square payment failed.");
        return;
      }

      props.onSuccess(data);
    } catch (error) {
      props.onError(error instanceof Error ? error.message : "Network error during Square payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-[24px] border border-white/10 bg-gradient-to-b from-white to-slate-100 p-5 text-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">
        Secure checkout
      </div>
      <div className="mt-3 text-xl font-black text-slate-950">Lock your ride now</div>
      <p className="mt-1 text-sm text-slate-600">
        Apple Pay, Google Pay, and cards all work here. The amount due now is charged immediately and your confirmation is created after payment succeeds.
      </p>
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-emerald-900">Due now</span>
          <span className="text-2xl font-black text-emerald-900">${props.amountDollars}</span>
        </div>
      </div>
      <div id="square-card-container" className="mt-4 min-h-28 rounded-2xl border border-slate-300 bg-white p-3" />
      <button
        type="button"
        onClick={submitPayment}
        disabled={!ready || busy || props.disabled}
        className="mt-4 min-h-12 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
      >
        {!ready
          ? "Loading payment form..."
          : busy
            ? `Charging $${props.amountDollars}...`
            : `Pay ${props.amountDollars} now`}
      </button>
      <div className="mt-3 text-center text-xs text-slate-500">
        Secure payment powered by Square
      </div>
    </div>
  );
}
