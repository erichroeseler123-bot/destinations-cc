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
          verificationMethod: String(data.verificationMethod || "").replace(/10%/g, "direct"),
          verificationSummary: String(data.verificationSummary || "").replace(/10%\s*/g, ""),
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
      className="mt-12 rounded-2xl border border-[#1e1915]/15 bg-[#fffdf9] p-6 md:p-8 text-[#1e1915]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1915]/10 pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6220]">
            For Business Representatives · $0 Profile Claim
          </p>
          <h2 className="mt-1 font-serif text-2xl md:text-3xl font-bold text-[#163828]">
            Represent {operatorName}? Claim or update this profile ($0)
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span
            data-testid="operator-live-availability-badge"
            className="rounded-full border border-[#1e1915]/15 bg-[#faf6ee] px-3 py-1 font-semibold text-[#4a4138]"
          >
            Live Availability:{" "}
            {liveAvailabilityConnected ? "Connected" : "Not connected"}
          </span>
          <span
            data-testid="operator-direct-checkout-badge"
            className="rounded-full border border-[#1e1915]/15 bg-[#faf6ee] px-3 py-1 font-semibold text-[#4a4138]"
          >
            Direct Checkout:{" "}
            {directCheckoutConnected ? "Connected" : "Not connected"}
          </span>
        </div>
      </div>

      {claimStatus === "unclaimed" && (
        <p
          data-testid="unclaimed-operator-notice"
          className="mt-4 rounded-xl border border-[#b8893a]/40 bg-[#faf6ee] px-4 py-3 text-sm font-medium text-[#4a4138]"
        >
          {UNCLAIMED_OPERATOR_PROFILE_NOTICE}
        </p>
      )}

      <p className="mt-4 text-sm leading-relaxed text-[#4a4138]">
        Claiming your company page and keeping dock addresses, pickup windows, age rules, and
        accessibility notes accurate is completely free ($0). Optional direct booking integration
        (where your company remains Merchant of Record under a separate post-completion supplier
        agreement) stays inactive until domain or phone verification and explicit owner review.
      </p>

      <div
        data-testid="claim-vs-commercial-separation"
        className="mt-4 grid gap-3 md:grid-cols-2 text-xs"
      >
        <div className="rounded-xl border border-[#1e1915]/12 bg-[#faf6ee] p-4">
          <p className="font-bold uppercase tracking-wider text-[#163828]">
            Step 1 · Claim This Profile ($0 — Factual Control Only)
          </p>
          <p className="mt-1.5 leading-relaxed text-[#4a4138]">
            Verifies your business representative status so you can update dock addresses, boarding
            wharves, pickup rules, and accessibility details. Does <strong>not</strong> activate live
            API inventory, direct checkout, or any commercial fee.
          </p>
        </div>
        <div className="rounded-xl border border-[#1e1915]/12 bg-[#faf6ee] p-4">
          <p className="font-bold uppercase tracking-wider text-[#6b2737]">
            Step 2 · Optional Live Calendar &amp; Direct Supplier Checkout
          </p>
          <p className="mt-1.5 leading-relaxed text-[#4a4138]">
            Connecting FareHarbor or Rezgo live availability or supplier-hosted direct checkout (with
            your company as Merchant of Record) requires a separate owner-approved agreement and
            verified integration test.
          </p>
        </div>
      </div>

      {successData ? (
        <div
          data-testid="wno-operator-claim-confirmation"
          className="mt-6 rounded-xl border border-[#163828]/30 bg-[#f2f7f4] p-5 text-sm text-[#163828]"
        >
          <p className="font-bold">
            Claim saved for owner review ({successData.claimSubmissionId})
          </p>
          <p className="mt-2 leading-relaxed text-[#1e1915]">{successData.verificationSummary}</p>
          <p className="mt-2 text-xs text-[#4a4138]">
            Verification path: <code>{successData.verificationMethod}</code> · Live availability and
            direct supplier checkout remain inactive until owner confirmation.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a4138]">
              Your Name *
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g., Operations Manager"
              className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-3.5 py-2.5 text-sm text-[#1e1915]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a4138]">
              Role / Title
            </label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Owner, Captain, General Manager"
              className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-3.5 py-2.5 text-sm text-[#1e1915]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a4138]">
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
              className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-3.5 py-2.5 text-sm text-[#1e1915]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a4138]">
              Official Business Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(504) 555-0100"
              className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-3.5 py-2.5 text-sm text-[#1e1915]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="inline-flex items-start gap-2.5 text-sm text-[#4a4138]">
              <input
                type="checkbox"
                checked={requestDirectApi}
                onChange={(e) => setRequestDirectApi(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#163828]"
              />
              <span>
                Also request owner review for optional direct supplier-hosted checkout &amp; live
                availability (operator remains Merchant of Record under agreed post-completion
                settlement terms).
              </span>
            </label>
          </div>

          {requestDirectApi && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a4138]">
                Reservation Platform &amp; Public Account Shortname (Never paste secret API keys)
              </label>
              <input
                type="text"
                value={bookingHandle}
                onChange={(e) => setBookingHandle(e.target.value)}
                placeholder="e.g., FareHarbor shortname or Rezgo company domain"
                className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-3.5 py-2.5 text-sm text-[#1e1915]"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a4138]">
              Dock, Wharf, or Pickup Factual Updates (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share any dock address, check-in lead time, or accessibility updates..."
              className="mt-1.5 w-full rounded-xl border border-[#1e1915]/20 bg-[#faf6ee] px-3.5 py-2.5 text-sm text-[#1e1915]"
            />
          </div>

          {errorMsg && (
            <div className="md:col-span-2 rounded-xl border border-[#6b2737]/40 bg-[#6b2737]/10 px-4 py-2.5 text-xs font-medium text-[#6b2737]">
              {errorMsg}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="wno-dir-primary-btn rounded-full bg-[#163828] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#faf6ee] transition hover:bg-[#6b2737] disabled:opacity-60"
            >
              {submitting ? "Saving Claim..." : "Submit $0 Operator Profile Claim"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
