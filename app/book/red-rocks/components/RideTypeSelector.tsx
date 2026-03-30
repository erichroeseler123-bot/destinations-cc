"use client";

import type { CheckoutProduct } from "@/lib/checkoutProducts";

type AvailabilityRow = {
  productKey: string;
  remaining: number;
  available: boolean;
};

type RideTypeSelectorProps = {
  products: CheckoutProduct[];
  selectedKey: string;
  onSelect: (key: string) => void;
  availability: AvailabilityRow[];
  loading?: boolean;
  statusMessage?: string | null;
};

function getAvailabilityTone(availabilityRow: AvailabilityRow | undefined, loading: boolean) {
  if (loading) return "text-sky-300";
  if (!availabilityRow) return "text-slate-400";
  if (!availabilityRow.available) return "text-red-300";
  if (availabilityRow.remaining <= 1) return "text-red-300";
  if (availabilityRow.remaining <= 2) return "text-orange-300";
  return "text-emerald-300";
}

export default function RideTypeSelector({
  products,
  selectedKey,
  onSelect,
  availability,
  loading = false,
  statusMessage,
}: RideTypeSelectorProps) {
  return (
    <div>
      {statusMessage ? (
        <div className="mb-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
          {statusMessage}
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {products.map((product) => {
          const active = product.key === selectedKey;
          const availabilityRow = availability.find((row) => row.productKey === product.key);
          const soldOut = availabilityRow ? !availabilityRow.available : false;
          const tone = getAvailabilityTone(availabilityRow, loading);

          return (
            <button
              key={product.key}
              type="button"
              onClick={() => onSelect(product.key)}
              className={`rounded-[24px] border p-5 text-left transition ${
                active
                  ? "border-orange-400 bg-orange-500/10 text-white"
                  : "border-white/10 bg-white/5 text-white hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-black">{product.title}</div>
                  <p className="mt-2 text-sm text-slate-300">{product.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black">${(product.priceCents / 100).toFixed(0)}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                    Up to {product.maxPassengers || 6}
                  </div>
                </div>
              </div>
              <div className={`mt-4 text-xs font-bold uppercase tracking-[0.16em] ${tone}`}>
                {loading
                  ? "Checking availability..."
                  : soldOut
                    ? "Sold out for this date"
                    : availabilityRow
                      ? availabilityRow.remaining <= 2
                        ? `Only ${availabilityRow.remaining} vehicle${availabilityRow.remaining === 1 ? "" : "s"} left`
                        : `${availabilityRow.remaining} vehicle${availabilityRow.remaining === 1 ? "" : "s"} left`
                      : "Select a date to check availability"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
