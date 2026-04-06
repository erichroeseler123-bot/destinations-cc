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

export default function OpsOrdersTable({
  orders,
  baseParams,
  selectedOrderId,
}: {
  orders: OpsOrder[];
  baseParams: URLSearchParams;
  selectedOrderId?: string | null;
}) {
  return (
    <section className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-white/10 bg-black/30 text-zinc-300">
          <tr>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 font-semibold">Service day</th>
            <th className="px-4 py-3 font-semibold">Departure</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Payment</th>
            <th className="px-4 py-3 font-semibold">Seats</th>
            <th className="px-4 py-3 font-semibold">Total</th>
            <th className="px-4 py-3 font-semibold">Order ID</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.orderId} className={`border-b border-white/10 ${selectedOrderId === order.orderId ? "bg-orange-500/10" : ""}`}>
              <td className="px-4 py-3 text-zinc-300">{formatDateTime(order.createdAt)}</td>
              <td className="px-4 py-3 text-zinc-300">{order.serviceDate || "Unscheduled"}</td>
              <td className="px-4 py-3 text-zinc-300">{order.departureLabel}</td>
              <td className="px-4 py-3 text-zinc-300">
                <Link
                  href={`/admin/parr-inventory?${(() => {
                    const params = new URLSearchParams(baseParams);
                    params.set("view", "all-orders");
                    params.set("order", order.orderId);
                    return params.toString();
                  })()}`}
                  className="hover:text-orange-200"
                >
                  {order.customerName || order.customerEmail || "—"}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-300">{order.orderStatus.replace("_", " ")}</td>
              <td className="px-4 py-3 text-zinc-300">{order.paymentStatus}</td>
              <td className="px-4 py-3 text-zinc-300">{order.seats}</td>
              <td className="px-4 py-3 text-zinc-300">{formatMoney(order.totalCents)}</td>
              <td className="px-4 py-3 font-mono text-xs text-cyan-200">{order.orderId}</td>
            </tr>
          ))}
          {orders.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-zinc-400" colSpan={9}>
                No PARR orders match the current filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
