"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OctoOption, OctoProduct } from "@/lib/octo/types";

export default function OctoBookingPanel({ product }: { product: OctoProduct }) {
  const router = useRouter();
  const defaultOption = product.options[0];

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);
  const [submittingHold, setSubmittingHold] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check live availability
  const handleCheckAvailability = async () => {
    setLoadingAvail(true);
    setError(null);
    try {
      const res = await fetch("/api/octo/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierConnectionId: "conn_mock_alaska",
          productId: product.id,
          optionId: defaultOption.id,
          localDate: selectedDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch live availability");

      setAvailabilitySlots(data.slots || []);
      if (data.slots?.length > 0) {
        setSelectedSlotId(data.slots[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAvail(false);
    }
  };

  // Submit booking hold
  const handleCreateHold = async () => {
    if (!selectedSlotId) {
      setError("Please select an available departure time");
      return;
    }

    setSubmittingHold(true);
    setError(null);

    const unitItems = [
      { unitId: "unit_adult", quantity: adultCount },
      ...(childCount > 0 ? [{ unitId: "unit_child", quantity: childCount }] : []),
    ];

    try {
      const res = await fetch("/api/octo/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierConnectionId: "conn_mock_alaska",
          productId: product.id,
          optionId: defaultOption.id,
          availabilityId: selectedSlotId,
          expirationMinutes: 15, // Enforcing 15 min hold per OCTO spec
          unitItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create reservation hold");

      // Navigate to checkout review
      router.push(`/checkout/octo/${data.dccBookingId || data.uuid}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingHold(false);
    }
  };

  const adultPrice = defaultOption.units.find((u) => u.type === "ADULT")?.pricingFrom?.[0]?.retail ?? 17900;
  const childPrice = defaultOption.units.find((u) => u.type === "CHILD")?.pricingFrom?.[0]?.retail ?? 11900;
  const estimatedTotal = (adultCount * adultPrice + childCount * childPrice) / 100;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Live OCTO Engine
          </span>
          <p className="text-2xl font-black text-white">
            ${(adultPrice / 100).toFixed(2)}{" "}
            <span className="text-xs font-normal text-white/60">/ adult</span>
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
          5% DCC Take-Rate
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Date Picker */}
      <div className="mt-6 space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-white/70">
          Select Tour Date
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            min={today}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
          />
          <button
            onClick={handleCheckAvailability}
            disabled={loadingAvail}
            className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition disabled:opacity-50"
          >
            {loadingAvail ? "Checking..." : "Check"}
          </button>
        </div>
      </div>

      {/* Available Slots */}
      {availabilitySlots.length > 0 && (
        <div className="mt-5 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-white/70">
            Available Times
          </label>
          <div className="grid gap-2">
            {availabilitySlots.map((slot) => {
              const time = slot.localDateTimeStart.split("T")[1]?.slice(0, 5) || "Departure";
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    selectedSlotId === slot.id
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                      : "border-white/10 bg-black/20 text-white/80 hover:bg-white/5"
                  }`}
                >
                  <span>{time} Departure</span>
                  <span className="text-xs text-emerald-400">
                    {slot.vacancies ? `${slot.vacancies} seats left` : "Available"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Guest Quantities */}
      <div className="mt-6 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-white/70">
          Guests
        </label>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
          <div>
            <p className="text-sm font-bold text-white">Adult (13+)</p>
            <p className="text-xs text-white/50">${(adultPrice / 100).toFixed(2)} each</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
              className="h-8 w-8 rounded-lg bg-white/10 font-bold text-white hover:bg-white/20"
            >
              -
            </button>
            <span className="w-5 text-center font-mono font-bold text-white">{adultCount}</span>
            <button
              onClick={() => setAdultCount(adultCount + 1)}
              className="h-8 w-8 rounded-lg bg-white/10 font-bold text-white hover:bg-white/20"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
          <div>
            <p className="text-sm font-bold text-white">Child (3-12)</p>
            <p className="text-xs text-white/50">${(childPrice / 100).toFixed(2)} each</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setChildCount(Math.max(0, childCount - 1))}
              className="h-8 w-8 rounded-lg bg-white/10 font-bold text-white hover:bg-white/20"
            >
              -
            </button>
            <span className="w-5 text-center font-mono font-bold text-white">{childCount}</span>
            <button
              onClick={() => setChildCount(childCount + 1)}
              className="h-8 w-8 rounded-lg bg-white/10 font-bold text-white hover:bg-white/20"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Summary and Hold CTA */}
      <div className="mt-8 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Estimated Total:</span>
          <span className="text-xl font-black text-white">${estimatedTotal.toFixed(2)} USD</span>
        </div>
        <p className="mt-1 text-[11px] text-white/40">
          Hold reserves seats for 15 minutes before payment handoff.
        </p>

        <button
          onClick={handleCreateHold}
          disabled={submittingHold}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 py-3.5 text-center text-sm font-black text-black shadow-lg shadow-cyan-500/20 hover:opacity-95 transition disabled:opacity-50"
        >
          {submittingHold ? "Securing Hold with Operator..." : "Reserve Hold (15 Min Free) →"}
        </button>
      </div>
    </div>
  );
}
