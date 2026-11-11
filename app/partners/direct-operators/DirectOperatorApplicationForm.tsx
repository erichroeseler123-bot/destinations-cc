"use client";

import { useState } from "react";

export default function DirectOperatorApplicationForm() {
  const [operatorName, setOperatorName] = useState("");
  const [destinationPort, setDestinationPort] = useState("");
  const [bookingSystem, setBookingSystem] = useState("FareHarbor");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [applicationId, setApplicationId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitState("submitting");

    try {
      const res = await fetch("/api/partners/direct-operators/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorName,
          destinationPort,
          bookingSystem,
          contactName,
          contactEmail,
          websiteUrl: websiteUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        applicationId?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(
          data.error || "Unable to submit application right now.",
        );
      }
      setApplicationId(data.applicationId || "");
      setSubmitState("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to submit application.",
      );
      setSubmitState("error");
    }
  };

  if (submitState === "success") {
    return (
      <div
        data-testid="direct-operator-application-success"
        className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-emerald-100"
      >
        <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
          Application Logged · Pending Human Commercial Review
        </div>
        <h3 className="mt-2 text-xl font-black text-white">
          Thank you — your direct operator application is in review.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">
          Reference ID: <code className="font-mono">{applicationId}</code>. No
          live routing or checkout changes occur automatically; our partnerships
          desk will verify product mapping, cancellation/weather terms, and
          hosted checkout attribution with you directly before activation.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="direct-operator-application-form"
      className="space-y-4 rounded-2xl border border-white/15 bg-white/[0.04] p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
          <span>Operator Name *</span>
          <input
            type="text"
            required
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            placeholder="e.g., Coastal Helicopters"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm font-normal normal-case text-white"
          />
        </label>

        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
          <span>Destination / Market *</span>
          <input
            type="text"
            required
            value={destinationPort}
            onChange={(e) => setDestinationPort(e.target.value)}
            placeholder="e.g., Juneau, AK · New Orleans, LA · Colorado (I-70 / Red Rocks)"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm font-normal normal-case text-white"
          />
        </label>

        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
          <span>Booking System *</span>
          <select
            value={bookingSystem}
            onChange={(e) => setBookingSystem(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm font-normal normal-case text-white"
          >
            <option value="FareHarbor">FareHarbor</option>
            <option value="Rezgo">Rezgo</option>
            <option value="Rezdy">Rezdy</option>
            <option value="Custom">Custom / Direct Hosted Checkout</option>
            <option value="OCTO">OCTO / Ventrata / Bokun</option>
          </select>
        </label>

        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
          <span>Existing Website / Checkout URL (Optional)</span>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm font-normal normal-case text-white"
          />
        </label>

        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
          <span>Contact Name *</span>
          <input
            type="text"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Your full name"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm font-normal normal-case text-white"
          />
        </label>

        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
          <span>Contact Email *</span>
          <input
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="partnerships@youroperator.com"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm font-normal normal-case text-white"
          />
        </label>
      </div>

      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
        <span>Flagship Tours, Port Pickup Notes, or ASN Details (Optional)</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Share flagship SKUs, cruise berth shuttle cutoffs, or FareHarbor shortname (do NOT paste API keys or secrets here)."
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-zinc-900 px-3.5 py-2.5 text-sm font-normal normal-case text-white"
        />
      </label>

      {submitState === "error" && errorMsg ? (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-xs font-semibold text-rose-200">
          {errorMsg}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-zinc-400">
          Security policy: Never submit API keys or passwords through public
          forms. Submissions enter <code>pending_review</code> for human
          verification.
        </p>
        <button
          type="submit"
          disabled={submitState === "submitting"}
          className="rounded-xl border border-emerald-400/50 bg-emerald-500/20 px-5 py-2.5 text-sm font-black text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50"
        >
          {submitState === "submitting"
            ? "Submitting..."
            : "Apply for 10% Direct Operator Program →"}
        </button>
      </div>
    </form>
  );
}
