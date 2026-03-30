"use client";

import Link from "next/link";
import { buildParrPrivateRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";
import { useEffect, useState } from "react";
import { getSquareApplicationId, getSquareLocationId, isSquareConfigured } from "@/lib/squareConfig";
import SquareBalancePaymentForm from "./SquareBalancePaymentForm";

type StoredOrder = {
  orderId: string;
  productTitle?: string;
  date?: string;
  pickup?: string | null;
  dropoff?: string | null;
  balanceDueAt?: string | null;
  status?: string;
  customer?: {
    email?: string | null;
  };
  pricing?: {
    totalCents?: number;
    amountPaidCents?: number;
    remainingBalanceCents?: number;
  };
  payment?: {
    provider?: string;
  };
};

type OrderResponse = {
  ok: boolean;
  order?: StoredOrder;
  error?: string;
};

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

function formatMoney(cents?: number) {
  return `$${((cents || 0) / 100).toFixed(2)}`;
}

function formatDueDate(value?: string | null) {
  if (!value) return "48 hours before service";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const PARR_SUPPORT_PHONE = "7203696292";
const PARR_SUPPORT_PHONE_DISPLAY = "720-369-6292";

export default function PayBalanceClient({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BalanceResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      try {
        const resp = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const data = (await resp.json()) as OrderResponse;
        if (!resp.ok || !data.ok || !data.order) {
          if (!cancelled) setError(data.error || "Order not found.");
          return;
        }
        if (!cancelled) setOrder(data.order);
      } catch {
        if (!cancelled) setError("Network error loading order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return <main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">Loading balance...</main>;
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">
        <h1 className="text-3xl font-black">Pay balance</h1>
        <p className="mt-3 text-slate-600">{error || "Order not found."}</p>
      </main>
    );
  }

  const totalCents = result?.totalCents ?? order.pricing?.totalCents ?? 0;
  const amountPaidCents = result?.amountPaidCents ?? order.pricing?.amountPaidCents ?? 0;
  const remainingBalanceCents = result?.remainingBalanceCents ?? order.pricing?.remainingBalanceCents ?? 0;
  const paidInFull = (result?.paymentStatus || order.status) === "paid_in_full" || remainingBalanceCents <= 0;
  const squareConfigured = isSquareConfigured();
  const supportMessage = `Hey - I need help with booking ${order.orderId} for ${order.productTitle || "this ride"}.`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 text-slate-900">
      <h1 className="text-3xl font-black">Pay remaining balance</h1>
      <p className="mt-2 text-slate-600">Finish this booking without starting over.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div><span className="font-bold">Order ID:</span> {order.orderId}</div>
          <div className="mt-2"><span className="font-bold">Service:</span> {order.productTitle || "Booking"}</div>
          <div className="mt-2"><span className="font-bold">Date:</span> {order.date || "Unknown"}</div>
          <div className="mt-2"><span className="font-bold">Pickup:</span> {order.pickup || "Unknown"}</div>
          <div className="mt-2"><span className="font-bold">Drop-off:</span> {order.dropoff || "Unknown"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-sm text-white">
          <div><span className="font-bold">Total:</span> {formatMoney(totalCents)}</div>
          <div className="mt-2"><span className="font-bold">Already paid:</span> {formatMoney(amountPaidCents)}</div>
          <div className="mt-2"><span className="font-bold">Remaining:</span> {formatMoney(remainingBalanceCents)}</div>
          <div className="mt-2"><span className="font-bold">Status:</span> {result?.paymentStatus || order.status || "deposit_paid"}</div>
          {remainingBalanceCents > 0 ? (
            <div className="mt-2"><span className="font-bold">Due by:</span> {formatDueDate(result?.balanceDueAt || order.balanceDueAt)}</div>
          ) : null}
        </div>
      </div>

      {paidInFull ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          This order is fully paid. No remaining balance is due.
        </div>
      ) : squareConfigured ? (
        <SquareBalancePaymentForm
          applicationId={getSquareApplicationId()}
          locationId={getSquareLocationId()}
          orderId={order.orderId}
          amountDollars={(remainingBalanceCents / 100).toFixed(2)}
          onSuccess={(nextResult) => {
            setError(null);
            setResult(nextResult);
          }}
          onError={(message) => {
            setError(message || null);
          }}
        />
      ) : (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Balance payment is not configured on this environment yet.
        </div>
      )}

      {result?.paymentStatus === "paid_in_full" ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Final payment received. Your booking is now paid in full.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`sms:${PARR_SUPPORT_PHONE}?&body=${encodeURIComponent(supportMessage)}`}
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900"
        >
          Text us
        </a>
        <a
          href={`https://wa.me/1${PARR_SUPPORT_PHONE}?text=${encodeURIComponent(supportMessage)}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900"
        >
          WhatsApp
        </a>
        <Link href={buildParrPrivateRedRocksUrl({ product: "parr-suburban" })} className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
          Back to booking
        </Link>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Need to update pickup details or ask a question? Text or WhatsApp{" "}
        <span className="font-bold text-slate-900">{PARR_SUPPORT_PHONE_DISPLAY}</span> and include booking ID{" "}
        <span className="font-bold text-slate-900">{order.orderId}</span>.
      </p>
    </main>
  );
}
