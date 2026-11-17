"use client";

import React, { useState } from "react";
import { UNCLAIMED_OPERATOR_PROFILE_NOTICE } from "@/lib/dcc/shared/newOrleansDirectoryExtensionContract";

interface WnoOperatorClaimPanelProps {
  operatorId: string;
  operatorSlug: string;
  operatorName: string;
  claimStatus: "unclaimed" | "claim_pending_verification" | "claimed_verified";
  officialEmailDomain: string | null;
  liveAvailabilityConnected: boolean;
  directCheckoutConnected: boolean;
}

export default function WnoOperatorClaimPanel({
  operatorId,
  operatorSlug,
  operatorName,
  claimStatus,
  officialEmailDomain,
  liveAvailabilityConnected,
  directCheckoutConnected,
}: WnoOperatorClaimPanelProps) {
  const [contactName, setContactName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requestDirectApi, setRequestDirectApi] = useState(false);
  const [bookingHandle, setBookingHandle] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    claimSubmissionId: string;
    verificationMethod: string;
    verificationSummary: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      operatorId,
      operatorSlug,
      contactName,
      roleTitle: roleTitle || "Owner / Operations Manager",
      email,
      phone: phone || null,
      requestDirectApiConnection: requestDirectApi,
      bookingSystemIdentifier: bookingHandle || null,
      notes: notes || null,
      sourcePage: `/operators/${operatorSlug}`,
    };

    try {
      let res = await fetch("/api/operator-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 404) {
        res = await fetch("/api/v1/new-orleans/claims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setErrorMsg(
          data?.error || "Unable to save operator claim right now. Please try again.",
        );
      } else {
        setSuccessData({
          claimSubmissionId: data.claimSubmissionId,
          verificationMethod: data.verificationMethod,
          verificationSummary: data.verificationSummary,
        });
      }
    } catch {
      setErrorMsg("Network error while saving claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="claim-operator-profile"
      data-testid="wno-operator-claim-panel"
      className="mt-12 rounded-xl border border-[#d4af37]/35 bg-[#120f16] p-6 md:p-8 text-[#fdfbf7]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">
            Operator Governance &amp; $0 Profile Claim
          </p>
          <h2 className="mt-1 font-serif text-2xl md:text-3xl">
            Represent {operatorName}? Claim or update this profile ($0)
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span
            data-testid="operator-live-availability-badge"
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-semibold text-white/85"
          >
            Live Availability Feed:{" "}
            {liveAvailabilityConnected ? "Connected" : "Not yet connected"}
          </span>
          <span
            data-testid="operator-direct-checkout-badge"
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-semibold text-white/85"
          >
            Direct Supplier Checkout:{" "}
            {directCheckoutConnected ? "Connected" : "Not yet connected"}
          </span>
        </div>
      </div>

      {claimStatus === "unclaimed" && (
        <p
          data-testid="unclaimed-operator-notice"
          className="mt-4 rounded-lg border border-amber-400/30 bg-amber-950/25 px-4 py-3 text-sm text-amber-100"
        >
          {UNCLAIMED_OPERATOR_PROFILE_NOTICE}
        </p>
      )}

      <p className="mt-4 text-sm leading-relaxed text-white/75">
        Claiming your company page and keeping dock addresses, pickup windows, age rules, and
        accessibility notes accurate is completely free ($0). Optional direct booking integration
        (where you remain Merchant of Record and settle an agreed 10% post-completion commission on
        completed non-refunded bookings) stays inactive until domain/phone verification and explicit
        owner review.
      </p>

      <div
        data-testid="claim-vs-commercial-separation"
        className="mt-4 grid gap-3 md:grid-cols-2 text-xs"
      >
        <div className="rounded-lg border border-white/15 bg-[#0a080d] p-4">
          <p className="font-bold uppercase tracking-wider text-[#d4af37]">
            Step 1 · Claim This Profile ($0 — Factual Control Only)
          </p>
          <p className="mt-1.5 leading-relaxed text-white/80">
            Verifies your business representative status so you can update dock addresses, boarding
            wharves, pickup rules, and accessibility details. Does <strong>not</strong> activate live
            API inventory, direct checkout, or any commercial fee.
          </p>
        </div>
        <div className="rounded-lg border border-white/15 bg-[#0a080d] p-4">
          <p className="font-bold uppercase tracking-wider text-white/90">
            Step 2 · Optional API Inventory, Direct Checkout &amp; Commercial Terms
          </p>
          <p className="mt-1.5 leading-relaxed text-white/80">
            Connecting Rezgo/FareHarbor live availability or supplier-hosted direct checkout (10%
            post-completion settlement with you as Merchant of Record) requires a separate
            owner-approved agreement and verified integration test.
          </p>
        </div>
      </div>

      {successData ? (
        <div
          data-testid="wno-operator-claim-confirmation"
          className="mt-6 rounded-lg border border-emerald-400/40 bg-emerald-950/30 p-5 text-sm text-emerald-100"
        >
          <p className="font-bold text-emerald-300">
            Claim saved for owner review ({successData.claimSubmissionId})
          </p>
          <p className="mt-2 leading-relaxed">{successData.verificationSummary}</p>
          <p className="mt-2 text-xs text-emerald-200/80">
            Verification path: <code>{successData.verificationMethod}</code> · Live availability and
            direct 10% checkout remain inactive until owner confirmation.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/80">
              Your Name *
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g., Operations Manager"
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#080708] px-3.5 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/80">
              Role / Title
            </label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Owner, Captain, General Manager"
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#080708] px-3.5 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/80">
              Business Email *{" "}
              {officialEmailDomain ? `(e.g., @${officialEmailDomain})` : ""}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                officialEmailDomain
                  ? `name@${officialEmailDomain}`
                  : "name@yourcompany.com"
              }
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#080708] px-3.5 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/80">
              Official Business Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(504) 555-0100"
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#080708] px-3.5 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="inline-flex items-start gap-2.5 text-sm text-white/85">
              <input
                type="checkbox"
                checked={requestDirectApi}
                onChange={(e) => setRequestDirectApi(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#d4af37]"
              />
              <span>
                Also request owner review for optional direct supplier-hosted checkout &amp; live
                availability (operator remains Merchant of Record; 10% post-completion invoicing).
              </span>
            </label>
          </div>

          {requestDirectApi && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/80">
                Reservation Platform &amp; Public Account Shortname (Never paste secret API keys)
              </label>
              <input
                type="text"
                value={bookingHandle}
                onChange={(e) => setBookingHandle(e.target.value)}
                placeholder="e.g., FareHarbor shortname or Rezgo company domain"
                className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#080708] px-3.5 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/80">
              Dock, Wharf, or Pickup Factual Updates (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share any dock address, check-in lead time, or accessibility updates..."
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-[#080708] px-3.5 py-2.5 text-sm text-white focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="md:col-span-2 rounded border border-rose-500/40 bg-rose-950/40 px-4 py-2.5 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#d4af37] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#080708] transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? "Saving Claim..." : "Submit $0 Operator Profile Claim"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
