import type { OpsOrder } from "@/lib/parr/ops/types";
import type { CheckoutProduct } from "@/lib/checkoutProducts";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-1 text-sm text-white">{value || "—"}</div>
    </div>
  );
}

export default function OpsOrderDrawer({
  order,
  nextPath,
  closeHref,
  productOptions,
  pickupOptions,
  routeAllowsFreeformPickup,
}: {
  order: OpsOrder;
  nextPath: string;
  closeHref: string;
  productOptions: CheckoutProduct[];
  pickupOptions: string[];
  routeAllowsFreeformPickup: boolean;
}) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-orange-300">Selected order</div>
          <div className="mt-2 text-2xl font-black text-white">{order.customerName || order.customerEmail || "Unknown rider"}</div>
        </div>
        <a href={closeHref} className="rounded-full border border-white/15 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10">
          Close
        </a>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <DetailRow label="Phone" value={order.customerPhone} />
        <DetailRow label="Email" value={order.customerEmail} />
        <DetailRow label="Service date" value={order.serviceDate} />
        <DetailRow label="Departure" value={order.departureLabel} />
        <DetailRow label="Pickup" value={order.pickupLabel} />
        <DetailRow label="Seats" value={String(order.seats)} />
        <DetailRow label="Order status" value={order.orderStatus.replace("_", " ")} />
        <DetailRow label="Payment status" value={order.paymentStatus} />
        <DetailRow label="Created" value={formatDateTime(order.createdAt)} />
        <DetailRow label="Order ID" value={order.orderId} />
        <DetailRow label="Booking reference" value={order.bookingReference} />
        <DetailRow label="Session key" value={order.sessionKey} />
        <DetailRow label="Route" value={order.route} />
        <DetailRow label="Product" value={order.productLabel} />
        <DetailRow label="Paid / Total" value={`${formatMoney(order.amountPaidCents)} / ${formatMoney(order.totalCents)}`} />
        <DetailRow label="Balance left" value={formatMoney(order.remainingBalanceCents)} />
      </div>

      <form action="/admin/parr-inventory/order/notes" method="post" className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input type="hidden" name="orderId" value={order.orderId} />
        <input type="hidden" name="next" value={nextPath} />
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Ops note</div>
        <textarea
          name="note"
          defaultValue={order.note || ""}
          rows={4}
          className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-zinc-500"
          placeholder="Add context, review reason, or follow-up notes."
        />
        <div className="text-xs text-zinc-500">
          Last updated: {formatDateTime(order.noteUpdatedAt)} {order.noteUpdatedBy ? `by ${order.noteUpdatedBy}` : ""}
        </div>
        <button type="submit" className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-black">
          Save note
        </button>
      </form>

      <form action="/admin/parr-inventory/order/status" method="post" className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input type="hidden" name="orderId" value={order.orderId} />
        <input type="hidden" name="next" value={nextPath} />
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Order actions</div>
        <textarea
          name="reason"
          rows={3}
          className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-zinc-500"
          placeholder="Cancel note or archive reason."
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="submit" name="action" value="cancel" className="min-h-11 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 text-sm font-semibold text-amber-100 hover:bg-amber-500/20">
            Cancel
          </button>
          <button type="submit" name="action" value="archive" className="min-h-11 rounded-xl border border-red-400/30 bg-red-500/10 px-4 text-sm font-semibold text-red-100 hover:bg-red-500/20">
            Archive
          </button>
        </div>
      </form>

      <form action="/admin/parr-inventory/order/payment" method="post" className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input type="hidden" name="orderId" value={order.orderId} />
        <input type="hidden" name="next" value={nextPath} />
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Payment workflow</div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Current payment state" value={order.paymentStatus} />
          <DetailRow label="Provider" value={order.paymentDetail} />
          <DetailRow label="Amount paid" value={formatMoney(order.amountPaidCents)} />
          <DetailRow label="Remaining" value={formatMoney(order.remainingBalanceCents)} />
        </div>

        <label className="block text-sm text-zinc-300">
          Payment action
          <select
            name="action"
            defaultValue="mark_manual_review"
            className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
          >
            <option value="mark_unpaid">Mark unpaid</option>
            <option value="mark_partial">Mark partial</option>
            <option value="mark_paid">Mark paid</option>
            <option value="mark_manual_review">Send to manual review</option>
          </select>
        </label>

        <label className="block text-sm text-zinc-300">
          Partial/manual paid amount
          <input
            type="number"
            min="0"
            step="0.01"
            name="amountPaidDollars"
            defaultValue={order.amountPaidCents ? (order.amountPaidCents / 100).toFixed(2) : ""}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Reason
          <textarea
            name="reason"
            rows={3}
            required
            className="mt-1 w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-zinc-500"
            placeholder="Explain why the payment state is changing."
          />
        </label>

        <button type="submit" className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-black">
          Save payment state
        </button>
      </form>

      <form action="/admin/parr-inventory/order/reassign" method="post" className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input type="hidden" name="orderId" value={order.orderId} />
        <input type="hidden" name="next" value={nextPath} />
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Reassign departure</div>

        <label className="block text-sm text-zinc-300">
          Service date
          <input
            type="date"
            name="date"
            required
            defaultValue={order.serviceDate || ""}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Product / departure lane
          <select
            name="product"
            defaultValue={order.productKey || ""}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
          >
            {productOptions.map((product) => (
              <option key={product.key} value={product.key}>
                {product.title}
              </option>
            ))}
          </select>
        </label>

        {routeAllowsFreeformPickup ? (
          <label className="block text-sm text-zinc-300">
            Pickup
            <input
              name="pickup"
              required
              defaultValue={order.pickupLabel || ""}
              className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
            />
          </label>
        ) : (
          <label className="block text-sm text-zinc-300">
            Pickup
            <select
              name="pickup"
              defaultValue={order.pickupLabel || pickupOptions[0] || ""}
              className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
            >
              {pickupOptions.map((pickup) => (
                <option key={pickup} value={pickup}>
                  {pickup}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-sm text-zinc-300">
          Pickup time
          <input
            name="pickupTime"
            defaultValue={order.source.pickupTime || ""}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
            placeholder="4:30 PM"
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Session key
          <input
            name="sessionKey"
            defaultValue={order.sessionKey || ""}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-white"
            placeholder="2026-04-18:golden"
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Move reason
          <textarea
            name="reason"
            rows={3}
            required
            className="mt-1 w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-zinc-500"
            placeholder="Explain why this booking is moving."
          />
        </label>

        <button type="submit" className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-black">
          Reassign booking
        </button>
      </form>

      <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Audit</div>
        {order.auditLog.length ? (
          <div className="space-y-3">
            {order.auditLog.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">
                <div className="font-semibold text-white">{entry.action.replaceAll("_", " ")}</div>
                <div className="mt-1">{formatDateTime(entry.at)} • {entry.actor}</div>
                {entry.detail ? <div className="mt-2 text-zinc-400">{entry.detail}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-400">No admin audit entries recorded yet.</div>
        )}
      </div>
    </aside>
  );
}
