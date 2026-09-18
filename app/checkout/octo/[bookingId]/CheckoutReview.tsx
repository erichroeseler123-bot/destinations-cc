"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { OctoBookingResult } from "@/lib/octo/types";

export default function CheckoutReview({
  booking,
  dccBookingId,
}: {
  booking: OctoBookingResult;
  dccBookingId: string;
}) {
  const [status, setStatus] = useState(booking.status);
  const [confirmedBooking, setConfirmedBooking] = useState<OctoBookingResult | null>(
    booking.status === "CONFIRMED" ? booking : null
  );

  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hold countdown calculation
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (!booking.utcHoldExpires || booking.status !== "ON_HOLD") return 0;
    const diff = new Date(booking.utcHoldExpires).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    if (status !== "ON_HOLD" || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setStatus("EXPIRED");
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, secondsRemaining]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  // Confirm booking
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !emailAddress) {
      setError("Please provide your full name and email address");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/octo/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: dccBookingId,
          contact: {
            fullName,
            emailAddress,
            phoneNumber,
          },
          payment: {
            provider: "supplier_hosted",
            status: "AUTHORIZED",
            amount: booking.totalPrice,
            currency: booking.currency,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to confirm reservation");

      setStatus("CONFIRMED");
      setConfirmedBooking(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel hold
  const handleCancel = async () => {
    if (!confirm("Are you sure you want to release this reservation hold?")) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/octo/bookings/${dccBookingId}`, { method: "DELETE" });
      setStatus("CANCELLED");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "CONFIRMED" && confirmedBooking) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.04] p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-300">
          ✓
        </div>
        <div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase text-emerald-300">
            Booking Confirmed
          </span>
          <h2 className="mt-3 text-3xl font-black text-white">You're Booked!</h2>
          <p className="mt-2 text-sm text-white/70">
            Confirmation reference: <span className="font-mono font-bold text-white">{dccBookingId}</span>
          </p>
        </div>

        {confirmedBooking.voucher && (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-black/50 p-6 text-left space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Digital Tour Voucher</p>
            <p className="text-2xl font-mono font-black text-white">
              {confirmedBooking.voucher.code}
            </p>
            <p className="text-xs text-white/60">
              {confirmedBooking.voucher.redemptionInstructions}
            </p>
            <div className="border-t border-white/10 pt-3 text-[11px] text-white/40">
              Direct Supplier Reference: {confirmedBooking.supplierReference || "APE-CONFIRMED"}
            </div>
          </div>
        )}

        <div className="text-xs text-white/50">
          A receipt and digital confirmation have been sent to{" "}
          <span className="font-semibold text-white">{emailAddress || "your email"}</span>.
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <Link
            href="/tours"
            className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
          >
            Explore More Tours
          </Link>
          <Link
            href="/octo"
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
          >
            View OCTO Ledger
          </Link>
        </div>
      </div>
    );
  }

  if (status === "EXPIRED") {
    return (
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/[0.04] p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Reservation Hold Expired</h2>
        <p className="text-sm text-white/60">
          The 15-minute hold on these tickets has expired and returned to available operator inventory.
        </p>
        <Link
          href="/tours"
          className="inline-block rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-black hover:bg-cyan-400 transition"
        >
          Return to Tour Catalog
        </Link>
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Reservation Cancelled</h2>
        <p className="text-sm text-white/60">This booking hold has been released.</p>
        <Link
          href="/tours"
          className="inline-block rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
        >
          Return to Tours
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left: Traveler Information Form (7 cols) */}
      <div className="lg:col-span-7">
        <form onSubmit={handleConfirm} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Lead Traveler Details</h2>
            <p className="mt-1 text-xs text-white/60">
              Required by the tour operator for reservation dispatch and safety manifest.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="sarah@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Mobile Phone (for day-of tour updates)
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 019-2834"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs text-white/60 space-y-1">
            <p className="font-bold text-white">Payment & Merchant-of-Record</p>
            <p>
              In accordance with DCC policy, this booking utilizes supplier-authorized handoff. DCC does not store credit
              card numbers on platform servers.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 py-3.5 text-sm font-black text-black shadow-lg shadow-cyan-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {isSubmitting ? "Confirming with Operator..." : "Complete & Confirm Booking →"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-xl border border-white/10 px-4 py-3.5 text-xs font-semibold text-white/60 hover:bg-white/5 transition disabled:opacity-50"
            >
              Cancel Hold
            </button>
          </div>
        </form>
      </div>

      {/* Right: Booking Summary & Hold Countdown (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Countdown Banner */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Reservation Hold Active
          </p>
          <p className="mt-1 text-3xl font-mono font-black text-white">
            {timeFormatted}
          </p>
          <p className="mt-1 text-[11px] text-amber-200/60">
            Seats reserved in operator reservation system
          </p>
        </div>

        {/* Order Breakdown */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">
            Reservation Summary
          </h3>
          <div className="space-y-2 border-b border-white/10 pb-4 text-sm">
            <div className="flex justify-between text-white">
              <span>DCC Booking ID</span>
              <span className="font-mono text-xs text-white/60">{dccBookingId}</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Ticket Items</span>
              <span className="font-mono text-white/80">{booking.unitItems?.length || 1} units</span>
            </div>
          </div>

          <div className="flex justify-between text-lg font-black text-white">
            <span>Total Gross Amount</span>
            <span>${Number(booking.totalPrice).toFixed(2)} {booking.currency}</span>
          </div>

          <div className="rounded-lg bg-black/40 p-3 text-[11px] text-white/50 space-y-1">
            <div className="flex justify-between">
              <span>Operator Share (95%):</span>
              <span>${(Number(booking.totalPrice) * 0.95).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-semibold">
              <span>DCC Platform Fee (5%):</span>
              <span>${(Number(booking.totalPrice) * 0.05).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
