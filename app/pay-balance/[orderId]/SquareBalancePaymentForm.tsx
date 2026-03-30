"use client";

import { useEffect, useRef, useState } from "react";

type BalanceResult = {
  ok: boolean;
  orderId?: string;
  paymentStatus?: string;
  totalCents?: number;
  amountPaidCents?: number;
  remainingBalanceCents?: number;
  balanceDueAt?: string | null;
  error?: string;
};

type Props = {
  applicationId: string;
  locationId: string;
  orderId: string;
  amountDollars: string;
  disabled?: boolean;
  onSuccess: (result: BalanceResult) => void;
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

export default function SquareBalancePaymentForm(props: Props) {
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
        await card.attach("#square-balance-card-container");
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
        currencyCode: "USD",
        intent: "CHARGE",
      });

      if (tokenResult.status !== "OK" || !tokenResult.token) {
        const firstError = tokenResult.errors?.[0]?.message || "Square tokenization failed.";
        props.onError(firstError);
        return;
      }

      const resp = await fetch("/api/square/pay-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: props.orderId,
          sourceId: tokenResult.token,
        }),
      });

      const data = (await resp.json()) as BalanceResult;
      if (!resp.ok || !data.ok) {
        props.onError(data.error || "Square balance payment failed.");
        return;
      }

      props.onSuccess(data);
    } catch (error) {
      props.onError(error instanceof Error ? error.message : "Network error during balance payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-base font-black text-emerald-700">Pay remaining balance securely</div>
      <p className="mt-1 text-sm text-slate-600">
        Finish this booking now with card, Apple Pay, or Google Pay if available on your device.
      </p>
      <div id="square-balance-card-container" className="mt-4 min-h-28 rounded-xl border border-slate-300 bg-white p-3" />
      <button
        type="button"
        onClick={submitPayment}
        disabled={!ready || busy || props.disabled}
        className="mt-4 min-h-11 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {!ready ? "Loading payment form..." : busy ? `Paying $${props.amountDollars}...` : `Pay Remaining Balance - $${props.amountDollars}`}
      </button>
    </div>
  );
}
