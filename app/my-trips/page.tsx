"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface VoucherData {
  code: string;
  barcode?: string;
  url?: string;
  instructions?: string;
}

interface TripBooking {
  bookingId: string;
  bookingUuid: string;
  productId: string;
  productTitle: string;
  optionId: string;
  optionTitle?: string;
  availabilityId: string;
  operatorSlug: string;
  operatorName: string;
  status: string;
  eventDate?: string;
  eventTime?: string;
  price: number;
  currency: string;
  unitItems: Array<{ unitId: string; quantity: number }>;
  voucher?: VoucherData;
  meetingPoint?: string;
  cancellationPolicy?: string;
}

interface TripOrder {
  orderId: string;
  status: string;
  createdAt: string;
  totalPrice: number;
  currency: string;
  paymentId?: string;
  paymentStatus: string;
  items: TripBooking[];
}

interface TravelerProfile {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
}

export default function MyTripsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TravelerProfile | null>(null);
  const [orders, setOrders] = useState<TripOrder[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);

  // Auth Form State
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [challengeSent, setChallengeSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Check existing session
  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/my-trips");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.traveler) {
          setProfile(data.traveler);
          setOrders(data.orders || []);
          setActiveCount(data.activeTripsCount || 0);
          setPastCount(data.pastTripsCount || 0);
        }
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      console.error("Failed to load trips:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setSubmittingAuth(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const res = await fetch("/api/auth/traveler/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send code");
      }

      setChallengeSent(true);
      setAuthMessage(data.message || "Check your email for the verification code.");
      if (data.devOtpCode) {
        setOtpInput(data.devOtpCode);
      }
    } catch (err: any) {
      setAuthError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmittingAuth(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpInput.trim()) return;

    setSubmittingAuth(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/auth/traveler/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, code: otpInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid verification code");
      }

      setChallengeSent(false);
      setOtpInput("");
      await fetchTrips();
    } catch (err: any) {
      setAuthError(err.message || "Invalid verification code. Please check and try again.");
    } finally {
      setSubmittingAuth(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/traveler/logout", { method: "POST" });
    } finally {
      setProfile(null);
      setOrders([]);
      setChallengeSent(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Loading your traveler profile & trips...</p>
      </div>
    );
  }

  // Unauthenticated: Passwordless Sign In
  if (!profile) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
              DCC Traveler Portal
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Access My Trips</h1>
            <p className="text-slate-600 text-sm mt-1">
              Sign in with your email to view your confirmed bookings, vouchers, and multi-operator itineraries.
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {authError}
            </div>
          )}

          {authMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl">
              {authMessage}
            </div>
          )}

          {!challengeSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="traveler@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={submittingAuth || !emailInput.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-150 disabled:opacity-50"
              >
                {submittingAuth ? "Sending code..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center tracking-widest text-lg font-mono font-bold text-slate-900 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Sent to <strong className="text-slate-700">{emailInput}</strong>
                </p>
              </div>
              <button
                type="submit"
                disabled={submittingAuth || !otpInput.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-150 disabled:opacity-50"
              >
                {submittingAuth ? "Verifying..." : "Verify & View My Trips"}
              </button>
              <button
                type="button"
                onClick={() => setChallengeSent(false)}
                className="w-full py-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition"
              >
                Use a different email
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Direct Booking Note:</strong> Only bookings confirmed directly through Destination Command Center appear in this portal. Third-party referrals (Viator, FareHarbor, GetYourGuide) are serviced directly through their respective booking sites.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6">
      {/* Traveler Profile Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {profile.fullName || "My Trips"}
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
              Traveler Profile
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {profile.email} • Traveler ID: <span className="font-mono text-xs text-slate-500">{profile.id}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase">Active Bookings</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase">Past Tours</p>
          <p className="text-3xl font-bold text-slate-700 mt-1">{pastCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase">Master DCC Orders</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{orders.length}</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Your DCC Orders & Digital Vouchers</h2>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-600 font-medium">You don&apos;t have any active DCC bookings yet.</p>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              When you book authorized operator experiences through DCC, your itinerary and digital vouchers will appear here.
            </p>
            <Link
              href="/"
              className="inline-flex px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Explore Destinations
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900 text-sm">{order.orderId}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        order.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Order Date: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total Charged</p>
                  <p className="text-base font-bold text-slate-900">
                    ${order.totalPrice.toFixed(2)} {order.currency}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-slate-100 p-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{item.productTitle}</h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              item.status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.status === "CANCELLED"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Operator: <span className="font-semibold text-slate-800">{item.operatorName}</span>
                        </p>
                        {item.eventDate && (
                          <p className="text-sm text-slate-600">
                            Service Date: <span className="font-medium text-slate-800">{item.eventDate}</span>
                            {item.eventTime && ` at ${item.eventTime}`}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 font-mono">
                          DCC Booking ID: {item.bookingId}
                        </p>
                      </div>

                      {/* Digital Voucher Card */}
                      {item.voucher && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:w-80">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Digital Voucher
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded">
                              Authorized
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center font-mono font-bold text-lg text-slate-900 tracking-wider">
                            {item.voucher.code}
                          </div>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            {item.voucher.instructions || "Present this digital code upon arrival to the tour operator."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Single DCC Order Payment: {order.paymentId || "Captured"}</span>
                <span>Direct Supplier Settlement: Pending service completion</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* External Referral Disclaimer */}
      <div className="mt-12 bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-blue-900 mb-1">Direct Operator Network vs. External Referrals</h4>
        <p className="text-xs text-blue-800 leading-relaxed">
          Destination Command Center operates a direct booking layer with authorized local operators. Only bookings confirmed directly through DCC appear in My Trips. Third-party referral clickouts (e.g. Viator, FareHarbor, GetYourGuide) are transacted and serviced externally by those platforms and will not appear in this portal.
        </p>
      </div>
    </div>
  );
}
