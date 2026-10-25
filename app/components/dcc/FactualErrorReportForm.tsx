"use client";

import { useState, type FormEvent } from "react";

export type FactualErrorCitationChoice = {
  id: string;
  label: string;
};

export default function FactualErrorReportForm({
  defaultPagePath = "/juneau",
  nodeId = null,
  citationChoices = [],
  compact = false,
}: {
  defaultPagePath?: string;
  nodeId?: string | null;
  citationChoices?: FactualErrorCitationChoice[];
  compact?: boolean;
}) {
  const [pagePath, setPagePath] = useState(defaultPagePath);
  const [citationId, setCitationId] = useState("");
  const [disputedClaim, setDisputedClaim] = useState("");
  const [explanation, setExplanation] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultState, setResultState] = useState<{
    ok: boolean;
    reportId?: string;
    findingId?: string;
    message: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setResultState(null);

    try {
      const res = await fetch("/api/public/factual-error-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pagePath,
          nodeId,
          citationId: citationId || null,
          disputedClaim,
          explanation,
          sourceUrl: sourceUrl || null,
          contactInfo: contactInfo || null,
          websiteUrl: websiteUrl || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setResultState({
          ok: false,
          message:
            data.message ||
            "Could not record report. Please check that the disputed claim and explanation are filled in.",
        });
      } else {
        setResultState({
          ok: true,
          reportId: data.reportId,
          findingId: data.findingId,
          message: `Recorded in the DCC review queue (${data.reportId}). Our reference maintenance workflow will verify the disputed claim against the primary source.`,
        });
        setDisputedClaim("");
        setExplanation("");
        setSourceUrl("");
      }
    } catch {
      setResultState({
        ok: false,
        message: "Network error while submitting report. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-zinc-950/80 p-4 text-xs text-zinc-200"
      data-dcc-factual-error-form="true"
      data-default-page-path={defaultPagePath}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-300">
            Report a Factual Discrepancy
          </span>
          <p className="mt-1 text-zinc-300">
            Spot an outdated fare, schedule change, transfer time, or broken citation? Submit it directly to the DCC reference review queue.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-zinc-400">
          POST /api/public/factual-error-report
        </span>
      </div>

      <div className={`mt-3 grid gap-3 ${compact ? " sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        <label className="block">
          <span className="text-[11px] font-semibold text-zinc-300">Page Path *</span>
          <input
            type="text"
            name="pagePath"
            required
            value={pagePath}
            onChange={(e) => setPagePath(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-white"
          />
        </label>

        {citationChoices.length > 0 ? (
          <label className="block">
            <span className="text-[11px] font-semibold text-zinc-300">
              Specific Citation (Optional)
            </span>
            <select
              name="citationId"
              value={citationId}
              onChange={(e) => setCitationId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="">General page claim / option</option>
              {citationChoices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  [{choice.id}] {choice.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block">
          <span className="text-[11px] font-semibold text-zinc-300">
            Disputed Claim (5–400 chars) *
          </span>
          <input
            type="text"
            name="disputedClaim"
            required
            minLength={5}
            maxLength={400}
            placeholder="e.g., Mendenhall day-use fee or Route 3 timing"
            value={disputedClaim}
            onChange={(e) => setDisputedClaim(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-[11px] font-semibold text-zinc-300">
            What changed or needs correction? (10–2,500 chars) *
          </span>
          <textarea
            name="explanation"
            required
            minLength={10}
            maxLength={2500}
            rows={2}
            placeholder="Describe what you observed and how it differs from the published statement..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-zinc-300">
            Supporting Source URL (Optional)
          </span>
          <input
            type="url"
            name="sourceUrl"
            placeholder="https://..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-zinc-300">
            Optional Contact (Email or Note)
          </span>
          <input
            type="text"
            name="contactInfo"
            maxLength={200}
            placeholder="Optional if you want a follow-up"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
          />
        </label>
      </div>

      {/* Honeypot field for automated bots */}
      <div className="sr-only" aria-hidden="true">
        <label>
          Leave this field blank
          <input
            type="text"
            name="websiteUrl"
            tabIndex={-1}
            autoComplete="off"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-lg border border-amber-400/40 bg-amber-500/20 px-3.5 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-500/30 disabled:opacity-50"
        >
          {submitting ? "Recording Report..." : "Submit Factual-Error Report"}
        </button>

        {resultState ? (
          <div
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              resultState.ok
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border-rose-400/40 bg-rose-500/15 text-rose-100"
            }`}
            data-factual-error-submit-status={resultState.ok ? "persisted" : "error"}
            data-factual-error-report-id={resultState.reportId || ""}
          >
            {resultState.message}
          </div>
        ) : null}
      </div>
    </form>
  );
}
