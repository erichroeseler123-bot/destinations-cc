"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getCheckoutPricing,
  getCheckoutProduct,
  getCheckoutProductsForRoute,
  getCheckoutRouteConfig,
} from "@/lib/checkoutProducts";
import { buildParrPrivateRedRocksUrl, buildParrSharedRedRocksUrl } from "@/lib/dcc/contracts/dccParrBridge";

export default function BookPageClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const route = sp.get("route");
  const initialProduct = sp.get("product");
  const routeConfig = getCheckoutRouteConfig(route);
  const availableProducts = getCheckoutProductsForRoute(route);

  const [productKey, setProductKey] = useState<string>(initialProduct || routeConfig?.defaultProduct || "");
  const [date, setDate] = useState("");
  const [qty, setQty] = useState(1);
  const [partySize, setPartySize] = useState(2);
  const [pickup, setPickup] = useState(routeConfig?.defaultPickup || "");

  const product = useMemo(() => getCheckoutProduct(productKey), [productKey]);
  const pricing = useMemo(
    () => getCheckoutPricing(routeConfig?.key, productKey, qty),
    [productKey, qty, routeConfig?.key],
  );

  if (!routeConfig) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">
        <h1 className="text-3xl font-black">Booking</h1>
        <p className="mt-3 text-slate-600">
          This route is ready for supported checkout flows. Use <code>?route=argo</code> or a supported transport route.
        </p>
        <Link href="/" className="mt-6 inline-block text-blue-700">
          Back home
        </Link>
      </main>
    );
  }

  function continueToCheckout() {
    if (!routeConfig || !product || !date || !pickup.trim()) return;

    const qs = new URLSearchParams({
      route: routeConfig.key,
      product: product.key,
      date,
      qty: String(qty),
      partySize: String(product.kind === "private" ? partySize : qty),
      pickup,
      dropoff: routeConfig.defaultDropoff || "",
      pickupTime: "4:30 PM",
    });

    if (routeConfig.key === "parr-private") {
      router.push(buildParrPrivateRedRocksUrl(Object.fromEntries(qs.entries())));
      return;
    }

    if (routeConfig.key === "parr-shared") {
      router.push(buildParrSharedRedRocksUrl(Object.fromEntries(qs.entries())));
      return;
    }

    const checkoutUrl = new URL("/checkout", window.location.origin);
    for (const [key, value] of qs.entries()) {
      checkoutUrl.searchParams.set(key, value);
    }

    router.push(`${checkoutUrl.pathname}${checkoutUrl.search}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-900">
      <h1 className="text-3xl font-black">{routeConfig.title}</h1>
      <p className="mt-2 text-slate-600">{routeConfig.intro}</p>

      <div className="mt-8 grid gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-bold text-slate-700">Ride Type</label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {availableProducts.map((p) => {
              const active = productKey === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setProductKey(p.key);
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
          <div className={`grid gap-4 ${routeConfig.pickupMode === "freeform" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            <label className="block text-sm font-bold text-slate-700">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            {routeConfig.pickupMode === "select" ? (
              <label className="block text-sm font-bold text-slate-700">
                Pickup
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  {(routeConfig.pickupOptions || []).map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-sm font-bold text-slate-700">
                Pickup address
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Full pickup address"
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>
            )}

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

          {product?.kind === "private" ? (
            <label className="mt-4 block text-sm font-bold text-slate-700">
              Party size
              <input
                type="number"
                min={1}
                max={product.maxPassengers || 24}
                value={partySize}
                onChange={(e) =>
                  setPartySize(Math.min(product.maxPassengers || 24, Math.max(1, Number(e.target.value) || 1)))
                }
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
          ) : null}

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-600">Estimated total</div>
            <div className="text-2xl font-black">{pricing ? `$${(pricing.totalCents / 100).toFixed(2)}` : "$0.00"}</div>
            {pricing && pricing.remainingBalanceCents > 0 ? (
              <div className="mt-2 text-sm text-slate-600">
                Pay now: <span className="font-bold text-slate-900">${(pricing.amountDueNowCents / 100).toFixed(2)}</span>
                {" • "}
                Remaining later: <span className="font-bold text-slate-900">${(pricing.remainingBalanceCents / 100).toFixed(2)}</span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={continueToCheckout}
            disabled={!product || !date || !pickup.trim()}
            className="mt-5 min-h-11 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </main>
  );
}
