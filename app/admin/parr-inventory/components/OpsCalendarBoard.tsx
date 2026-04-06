import Link from "next/link";
import type { OpsDayGroup } from "@/lib/parr/ops/types";
import OpsOrderCard from "./OpsOrderCard";

type Props = {
  days: OpsDayGroup[];
  selectedDate: string | null;
  baseParams: URLSearchParams;
  selectedOrderId?: string | null;
};

export default function OpsCalendarBoard({ days, selectedDate, baseParams, selectedOrderId }: Props) {
  const selectedDay = days.find((day) => day.date === selectedDate) || days[0] || null;

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Service days</div>
        <div className="mt-4 space-y-3">
          {days.map((day) => {
            const params = new URLSearchParams(baseParams);
            params.set("date", day.date);
            const active = selectedDay?.date === day.date;
            return (
              <Link
                key={day.date}
                href={`/admin/parr-inventory?${params.toString()}`}
                className={`block rounded-2xl border p-4 transition ${
                  active ? "border-orange-400/40 bg-orange-500/10" : "border-white/10 bg-black/20 hover:bg-white/10"
                }`}
              >
                <div className="font-semibold text-white">{day.label}</div>
                <div className="mt-2 text-sm text-zinc-300">
                  {day.totalOrders} orders • {day.confirmedSeats} confirmed seats
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
                  {day.departures.length} departures • {day.needsReviewCount} needs review
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      <section className="space-y-4">
        {selectedDay ? (
          <>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Selected day</div>
              <div className="mt-2 text-3xl font-black text-white">{selectedDay.label}</div>
              <div className="mt-2 text-sm text-zinc-300">
                {selectedDay.totalOrders} orders • {selectedDay.confirmedSeats} confirmed seats • {selectedDay.pendingSeats} pending seats
              </div>
            </div>

            {selectedDay.departures.map((departure) => (
              <section key={departure.key} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Departure block</div>
                    <div className="mt-2 text-2xl font-black text-white">{departure.label}</div>
                    <div className="mt-1 text-sm text-zinc-300">
                      {departure.pickupLabel || "No pickup set"} • {departure.totalOrders} orders
                    </div>
                  </div>
                  <div className="grid gap-2 text-right text-sm text-zinc-300">
                    <div>{departure.confirmedSeats} confirmed seats</div>
                    <div>{departure.pendingSeats} pending seats</div>
                    <div>{departure.needsReviewCount} needs review</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {departure.orders.map((order) => (
                    <OpsOrderCard
                      key={order.orderId}
                      order={order}
                      selected={selectedOrderId === order.orderId}
                      href={`/admin/parr-inventory?${(() => {
                        const params = new URLSearchParams(baseParams);
                        params.set("date", selectedDay.date);
                        params.set("order", order.orderId);
                        return params.toString();
                      })()}`}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-zinc-400">
            No scheduled PARR orders match the current filters.
          </div>
        )}
      </section>
    </div>
  );
}
