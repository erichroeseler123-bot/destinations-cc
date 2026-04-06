import Link from "next/link";
import type { OpsOrder } from "@/lib/parr/ops/types";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusTone(status: OpsOrder["orderStatus"]) {
  if (status === "confirmed") return "bg-emerald-500/15 text-emerald-200";
  if (status === "pending_payment") return "bg-amber-500/15 text-amber-200";
  if (status === "needs_review") return "bg-red-500/15 text-red-200";
  return "bg-zinc-700/40 text-zinc-200";
}

function paymentTone(status: OpsOrder["paymentStatus"]) {
  if (status === "paid") return "bg-emerald-500/15 text-emerald-200";
  if (status === "partial") return "bg-amber-500/15 text-amber-200";
  if (status === "manual_review" || status === "disputed") return "bg-orange-500/15 text-orange-200";
  if (status === "unpaid") return "bg-red-500/15 text-red-200";
  return "bg-zinc-700/40 text-zinc-200";
}

export default function OpsOrderCard({ order, href, selected }: { order: OpsOrder; href?: string; selected?: boolean }) {
  const content = (
    <article className={`rounded-3xl border p-4 ${selected ? "border-orange-400/40 bg-orange-500/10" : "border-white/10 bg-black/20"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-white">{order.customerName || order.customerEmail || "Unknown rider"}</div>
          <div className="mt-1 text-sm text-zinc-400">
            {order.customerPhone || "No phone"} • {order.customerEmail || "No email"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
          <span className={`rounded-full px-3 py-1 ${statusTone(order.orderStatus)}`}>{order.orderStatus.replace("_", " ")}</span>
          <span className={`rounded-full px-3 py-1 ${paymentTone(order.paymentStatus)}`}>{order.paymentStatus}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-zinc-300 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Departure</div>
          <div className="mt-1 text-white">{order.departureLabel}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Pickup</div>
          <div className="mt-1 text-white">{order.pickupLabel || "Needs routing"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Seats</div>
          <div className="mt-1 text-white">{order.seats}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Product</div>
          <div className="mt-1 text-white">{order.productLabel}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-zinc-300 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Order ID</div>
          <div className="mt-1 font-mono text-xs text-cyan-200">{order.orderId}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Created</div>
          <div className="mt-1 text-white">{formatDateTime(order.createdAt)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Paid / Total</div>
          <div className="mt-1 text-white">
            {formatMoney(order.amountPaidCents)} / {formatMoney(order.totalCents)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Balance left</div>
          <div className="mt-1 text-white">{formatMoney(order.remainingBalanceCents)}</div>
        </div>
      </div>
    </article>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </Link>
  );
}
