"use client";

import { FormEvent, useState } from "react";

type Props = {
  initialCompanyName?: string;
  initialWebsite?: string;
  initialDestinations?: string;
  initialBookingSystem?: string;
};

export default function OperatorOnboardingForm({
  initialCompanyName = "",
  initialWebsite = "",
  initialDestinations = "",
  initialBookingSystem = "Rezdy Native REST API v1",
}: Props) {
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState(initialWebsite);
  const [destinations, setDestinations] = useState(initialDestinations);
  const [bookingSystem, setBookingSystem] = useState(initialBookingSystem);
  const [apiDocumentationUrl, setApiDocumentationUrl] = useState("https://developers.rezdy.com/");
  const [authorizedApiAccessAvailable, setAuthorizedApiAccessAvailable] = useState(true);
  const [operatorPermissionConfirmed, setOperatorPermissionConfirmed] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);

  function handleBookingSystemChange(value: string) {
    setBookingSystem(value);
    if (value.includes("Rezdy")) {
      setApiDocumentationUrl("https://developers.rezdy.com/");
    } else if (value.includes("FareHarbor")) {
      setApiDocumentationUrl("https://developer.fareharbor.com/api/external/v1/");
    } else if (value.includes("Bókun")) {
      setApiDocumentationUrl("https://docs.bokun.io/");
    } else if (value.includes("OCTO") || value.includes("Ventrata")) {
      setApiDocumentationUrl("https://docs.octo.travel/");
    } else if (value === "no_api") {
      setApiDocumentationUrl("");
      setAuthorizedApiAccessAvailable(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/operators/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          contactEmail,
          website,
          destinations,
          bookingSystem,
          apiDocumentationUrl,
          authorizedApiAccessAvailable,
          operatorPermissionConfirmed,
          notes,
        }),
      });
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setResult({ ok: false, message: err?.message || "Failed to submit onboarding application." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs leading-6 text-amber-100">
        <strong>Security &amp; Commercial Notice:</strong> Do <strong>not</strong> enter API keys, tokens, or secrets in this form or send them by email. Credentials are arranged securely after technical review and signed commercial terms. Submitting this application does not automatically authorize sales; existing verified Viator listings remain active on Viator until a direct integration passes all verification gates.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5" htmlFor="onb-company">
            Company Name *
          </label>
          <input
            id="onb-company"
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Cajun Pride Swamp Tours"
            className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5" htmlFor="onb-website">
            Official Company Website *
          </label>
          <input
            id="onb-website"
            type="url"
            required
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5" htmlFor="onb-contact-name">
            Contact Name &amp; Role *
          </label>
          <input
            id="onb-contact-name"
            type="text"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Name / Distribution or API Lead"
            className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5" htmlFor="onb-contact-email">
            Business Email *
          </label>
          <input
            id="onb-contact-email"
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5" htmlFor="onb-destinations">
            Destinations Served *
          </label>
          <input
            id="onb-destinations"
            type="text"
            required
            value={destinations}
            onChange={(e) => setDestinations(e.target.value)}
            placeholder="e.g., New Orleans, LA; Juneau, AK; Worldwide"
            className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5" htmlFor="onb-system">
            Booking System *
          </label>
          <select
            id="onb-system"
            value={bookingSystem}
            onChange={(e) => handleBookingSystemChange(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            <option value="Rezdy Native REST API v1">Rezdy (Native REST API v1)</option>
            <option value="FareHarbor External API v1">FareHarbor (External API v1)</option>
            <option value="Bókun REST API">Bókun (Native REST API)</option>
            <option value="Ventrata / OCTO Core v1.2">Ventrata / OCTO Core v1.2</option>
            <option value="TourCMS Native / OCTO API">TourCMS (Palisis)</option>
            <option value="Custom Operator REST API">Custom Operator REST API</option>
            <option value="no_api">No API Access Available (Continue via Viator)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5" htmlFor="onb-api-docs">
          API Documentation URL / Specification Reference {bookingSystem !== "no_api" ? "*" : "(Optional if No API)"}
        </label>
        <input
          id="onb-api-docs"
          type="url"
          required={bookingSystem !== "no_api" && authorizedApiAccessAvailable}
          value={apiDocumentationUrl}
          onChange={(e) => setApiDocumentationUrl(e.target.value)}
          placeholder="https://developers.rezdy.com/ or provider API specification URL"
          className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/80">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={authorizedApiAccessAvailable}
            onChange={(e) => setAuthorizedApiAccessAvailable(e.target.checked)}
            className="mt-1"
          />
          <span>
            <strong>Authorized API Access Confirmation:</strong> Our company has (or can authorize) provider-approved API access for our booking system. (Direct partnerships are API-only; without an API connection, we cannot switch bookings to direct and existing verified listings can continue through Viator.)
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={operatorPermissionConfirmed}
            onChange={(e) => setOperatorPermissionConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span>
            <strong>Commercial Terms Separation:</strong> I understand the proposed 10% commission on completed direct bookings is separate from signed commercial and settlement terms, and that submitting this form does not authorize sales until commercial terms are signed and technical verification passes.
          </span>
        </label>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5" htmlFor="onb-notes">
          Notes on Product Catalog or Policies (Do NOT include API keys or secrets)
        </label>
        <textarea
          id="onb-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes on tour codes, seasonal operating windows, or cancellation/cruise-return policies…"
          className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-cyan-400 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300 transition disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit Operator Onboarding Application"}
      </button>

      {result ? (
        <div
          role="status"
          className={`rounded-2xl border p-5 text-xs leading-6 ${
            result.ok
              ? "border-emerald-400/40 bg-emerald-950/30 text-emerald-100"
              : "border-rose-400/40 bg-rose-950/30 text-rose-100"
          }`}
        >
          <p className="font-bold text-sm">
            {result.ok
              ? `Status: ${result.applicationStatus}`
              : `Submission Error (${result.errorCode || "error"})`}
          </p>
          <p className="mt-1">{result.message || result.commercialTermsNote}</p>
          {result.credentialArrangementNote ? (
            <p className="mt-1 text-white/75">{result.credentialArrangementNote}</p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
