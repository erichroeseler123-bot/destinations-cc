import Link from "next/link";
import type { OpsDayGroup } from "@/lib/parr/ops/types";

function customerLabel(name: string | null, email: string | null) {
  return name || email || "Unknown rider";
}

export default function OpsRunSheet({
  days,
  baseParams,
  selectedOrderId,
}: {
  days: OpsDayGroup[];
  baseParams: URLSearchParams;
  selectedOrderId?: string | null;
}) {
  return (
    <div className="space-y-6">
      {days.map((day) => (
        <section key={day.date} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl font-black text-white">{day.label}</div>
          <div className="mt-2 text-sm text-zinc-300">
            {day.departures.length} departures • {day.totalOrders} orders
          </div>

          <div className="mt-5 space-y-4">
            {day.departures.map((departure) => (
              <div key={departure.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-white">{departure.label}</div>
                    <div className="text-sm text-zinc-400">{departure.pickupLabel || "Needs routing"}</div>
                  </div>
                  <div className="text-sm text-zinc-300">
                    {departure.confirmedSeats} confirmed seats • {departure.pendingSeats} pending
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-zinc-400">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Customer</th>
                        <th className="px-3 py-2 font-semibold">Seats</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold">Payment</th>
                        <th className="px-3 py-2 font-semibold">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departure.orders.map((order) => (
                        <tr key={order.orderId} className={`border-b border-white/5 ${selectedOrderId === order.orderId ? "bg-orange-500/10" : ""}`}>
                          <td className="px-3 py-2 text-white">
                            <Link
                              href={`/admin/parr-inventory?${(() => {
                                const params = new URLSearchParams(baseParams);
                                params.set("view", "run-sheet");
                                params.set("date", day.date);
                                params.set("order", order.orderId);
                                return params.toString();
                              })()}`}
                              className="hover:text-orange-200"
                            >
                              {customerLabel(order.customerName, order.customerEmail)}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-zinc-300">{order.seats}</td>
                          <td className="px-3 py-2 text-zinc-300">{order.orderStatus.replace("_", " ")}</td>
                          <td className="px-3 py-2 text-zinc-300">{order.paymentStatus}</td>
                          <td className="px-3 py-2 text-zinc-300">{order.customerPhone || order.customerEmail || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
