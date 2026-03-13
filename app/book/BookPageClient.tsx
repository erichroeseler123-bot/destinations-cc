"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getArgoProduct } from "@/lib/argoProducts";

export default function BookPageClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const route = sp.get("route");
  const initialProduct = sp.get("product");
  const forcedArgo = route === "argo";

  const [productKey, setProductKey] = useState<string>(initialProduct || "argo-seat");
  const [date, setDate] = useState("");
  const [qty, setQty] = useState(1);
  const [pickup, setPickup] = useState("Denver");

  const product = useMemo(() => getArgoProduct(productKey), [productKey]);

  if (!forcedArgo) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">
        <h1 className="text-3xl font-black">Booking</h1>
        <p className="mt-3 text-slate-600">
          This route is ready for Argo booking. Use <code>?route=argo</code>.
        </p>
        <Link href="/mighty-argo-shuttle" className="mt-6 inline-block text-blue-700">
          Back to Argo page
        </Link>
      </main>
    );
  }

  function continueToCheckout() {
    if (!product || !date) return;

    const qs = new URLSearchParams({
      product: product.key,
      date,
      qty: String(qty),
      pickup,
      route: "argo",
      title: product.title,
      priceCents: String(product.priceCents),
    });

    router.push(`/checkout?${qs.toString()}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-900">
      <h1 className="text-3xl font-black">Book Argo Shuttle</h1>
      <p className="mt-2 text-slate-600">
        Choose your ride, date, and quantity, then continue to secure checkout.
      </p>

      <div className="mt-8 grid gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-bold text-slate-700">Ride Type</label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {["argo-seat", "argo-suv"].map((key) => {
              const p = getArgoProduct(key)!;
              const active = productKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setProductKey(key);
                    if (p.kind === "private") setQty(1);
                  }}
                  className={`rounded-2xl border p-4 text-left ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                >
                  <div className="text-lg font-black">{p.title}</div>
                  <div className="mt-1 text-sm">
                    ${(p.priceCents / 100).toFixed(2)}
                    {p.kind === "seat" ? " per person" : " total"}
                  </div>
                  <div className="mt-2 text-sm opacity-90">{p.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-bold text-slate-700">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Pickup
              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option>Denver</option>
                <option>Union Station</option>
                <option>Downtown Hotel</option>
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              {product?.kind === "seat" ? "Seats" : "Vehicles"}
              <input
                type="number"
                min={1}
                max={product?.maxQty || 1}
                value={qty}
                onChange={(e) =>
                  setQty(Math.min(product?.maxQty || 1, Math.max(1, Number(e.target.value) || 1)))
                }
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-600">Estimated total</div>
            <div className="text-2xl font-black">
              ${product ? ((product.priceCents * qty) / 100).toFixed(2) : "0.00"}
            </div>
          </div>

          <button
            type="button"
            onClick={continueToCheckout}
            disabled={!product || !date}
            className="mt-5 min-h-11 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </main>
  );
}
