"use client";

import React, { useState, type FormEvent } from "react";
import { UNCLAIMED_LODGE_FACT_SHEET_NOTICE } from "../../../lib/dcc/shared/southeastAlaskaFishingLodgesContract";

interface LodgeParticipationPanelProps {
  lodgeSlug: string;
  lodgeName: string;
  operatorName: string;
  officialEmailDomain: string | null;
  officialPhone: string | null;
  identityClaimStatus:
    | "unclaimed"
    | "claim_pending_identity_review"
    | "identity_verified_operator";
}

export function LodgeParticipationPanel({
  lodgeSlug,
  lodgeName,
  operatorName,
  officialEmailDomain,
  officialPhone,
  identityClaimStatus,
}: LodgeParticipationPanelProps) {
  const [activeMode, setActiveMode] = useState<
    "none" | "factual_correction" | "lodge_profile_claim"
  >("none");
  const [contactName, setContactName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [targetClaimScope, setTargetClaimScope] = useState(
    "package_pricing_and_inclusions",
  );
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [details, setDetails] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [governanceSummary, setGovernanceSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function selectMode(mode: "factual_correction" | "lodge_profile_claim") {
    setActiveMode((prev) => (prev === mode ? "none" : mode));
    setSuccessMessage(null);
    setGovernanceSummary(null);
    setErrorMessage(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (activeMode === "none") return;

    setSubmitting(true);
    setSuccessMessage(null);
    setGovernanceSummary(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/fishing-lodge-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionType: activeMode,
          lodgeSlug,
          contactName,
          roleTitle:
            roleTitle ||
            (activeMode === "lodge_profile_claim"
              ? "Lodge Representative"
              : "Traveler / Public Researcher"),
          email,
          phone: phone || undefined,
          targetClaimScope,
          evidenceUrl: evidenceUrl || undefined,
          details,
          website: honeypot,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        identitySummary?: string | null;
        identityVerificationState?: string;
        submittedFactsVerificationState?: string;
        error?: string;
      };

      if (!res.ok || !json.ok) {
        setErrorMessage(
          json.error || "Unable to record submission right now. Please try again.",
        );
      } else {
        setSuccessMessage(
          json.message || "Submission recorded in the durable verification queue.",
        );
        setGovernanceSummary(
          json.identitySummary ||
            `Identity state: ${json.identityVerificationState || "n/a"} · Fact verification state: ${json.submittedFactsVerificationState || "quarantined_pending_steward_evidence_review"}.`,
        );
      }
    } catch {
      setErrorMessage("Network error submitting form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="corrections-and-claim"
      className="card"
      data-testid="lodge-participation-panel"
      style={{
        background: "#fffaf4",
        border: "1.5px solid var(--safety-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 700 }}>
          <span className="badge badge-warning">
            {identityClaimStatus === "identity_verified_operator"
              ? "Operator Identity Verified · Facts Independently Reviewed"
              : "Unclaimed Public Fact Sheet · $0 Free Inclusion"}
          </span>
          <h3 style={{ marginTop: 10, marginBottom: 8 }}>
            Spot an Outdated Rate, Transfer Rule, or Ownership Detail?
          </h3>
          <p style={{ marginBottom: 8, color: "var(--ink)", fontWeight: 600 }}>
            {UNCLAIMED_LODGE_FACT_SHEET_NOTICE}
          </p>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>
            <strong>Identity vs. Fact Verification Boundary:</strong> Claiming a lodge
            page ($0 forever) verifies business contact authority via{" "}
            {officialEmailDomain ? (
              <strong>@{officialEmailDomain}</strong>
            ) : (
              "company domain email"
            )}
            {officialPhone ? (
              <>
                {" "}
                or listed phone (<strong>{officialPhone}</strong>)
              </>
            ) : null}
            , <em>not</em> automatic approval of every field. All factual updates—whether
            submitted by a traveler or a verified operator—enter quarantine until backed
            by primary evidence.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            className="button secondary"
            onClick={() => selectMode("factual_correction")}
            aria-expanded={activeMode === "factual_correction"}
            data-testid="open-correction-form-btn"
            style={{ cursor: "pointer" }}
          >
            {activeMode === "factual_correction"
              ? "Close Correction Form"
              : "Suggest a Factual Correction"}
          </button>

          {identityClaimStatus !== "identity_verified_operator" && (
            <button
              type="button"
              className="button"
              onClick={() => selectMode("lodge_profile_claim")}
              aria-expanded={activeMode === "lodge_profile_claim"}
              data-testid="open-lodge-claim-form-btn"
              style={{ cursor: "pointer" }}
            >
              {activeMode === "lodge_profile_claim"
                ? "Close Claim Form"
                : "Claim Free Lodge Profile ($0)"}
            </button>
          )}
        </div>
      </div>

      {activeMode !== "none" && (
        <form
          onSubmit={handleSubmit}
          data-testid="lodge-participation-form"
          style={{
            marginTop: 20,
            paddingTop: 20,
            borderTop: "1px solid var(--line)",
          }}
        >
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0 }}
          />

          <h4 style={{ margin: "0 0 12px", color: "var(--deep)", fontSize: 16 }}>
            {activeMode === "lodge_profile_claim"
              ? `Claim Free Operator Identity for ${operatorName} (${lodgeName})`
              : `Submit a Quarantined Factual Correction for ${lodgeName}`}
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
              gap: 14,
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13.5 }}>
              <strong>Your Name *</strong>
              <input
                type="text"
                required
                minLength={2}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Alex Morgan"
                style={{
                  padding: "9px 11px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13.5 }}>
              <strong>
                {activeMode === "lodge_profile_claim"
                  ? `Role at ${operatorName} *`
                  : "Relationship (e.g. Past Guest, Staff, Local)"}
              </strong>
              <input
                type="text"
                required={activeMode === "lodge_profile_claim"}
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder={
                  activeMode === "lodge_profile_claim"
                    ? "Owner / Reservations Manager"
                    : "Lodge Manager or Traveler"
                }
                style={{
                  padding: "9px 11px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13.5 }}>
              <strong>
                Email Address *{" "}
                {activeMode === "lodge_profile_claim" && officialEmailDomain
                  ? `(@${officialEmailDomain} fastest)`
                  : ""}
              </strong>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  officialEmailDomain
                    ? `info@${officialEmailDomain}`
                    : "you@example.com"
                }
                style={{
                  padding: "9px 11px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                }}
              />
            </label>

            {activeMode === "lodge_profile_claim" ? (
              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13.5 }}>
                <strong>Business Phone (for callback check)</strong>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={officialPhone || "(907) 555-0100"}
                  style={{
                    padding: "9px 11px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                  }}
                />
              </label>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13.5 }}>
                <strong>Section to Update *</strong>
                <select
                  value={targetClaimScope}
                  onChange={(e) => setTargetClaimScope(e.target.value)}
                  style={{
                    padding: "9px 11px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: "#ffffff",
                  }}
                >
                  <option value="package_pricing_and_inclusions">
                    Package Rates, Season or Inclusions
                  </option>
                  <option value="access_and_baggage">
                    Gateway Transfers &amp; Baggage Limits
                  </option>
                  <option value="identity_and_roles">
                    Property, Operator or Seller Distinction
                  </option>
                  <option value="accommodation_and_capacity">
                    Rooms, Bathrooms, Group Size or Accessibility
                  </option>
                  <option value="fishing_and_regulations">
                    Boats, Fish Processing or License/Stamp Rules
                  </option>
                  <option value="non_fishing_options">
                    Non-Fishing &amp; Companion Options
                  </option>
                </select>
              </label>
            )}
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13.5 }}>
              <strong>Official Evidence URL (Recommended)</strong>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://example-lodge.com/2027-rates"
                style={{
                  padding: "9px 11px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13.5 }}>
              <strong>
                {activeMode === "lodge_profile_claim"
                  ? "Verification Notes or Initial Factual Updates (Quarantined Pending Review)"
                  : "Specific Factual Correction *"}
              </strong>
              <textarea
                rows={3}
                required={activeMode === "factual_correction"}
                minLength={activeMode === "factual_correction" ? 10 : undefined}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  activeMode === "lodge_profile_claim"
                    ? "Optional: share verification instructions or link to updated 2027 rate sheets (do not paste API keys)."
                    : "Describe the exact rate, date, transfer, or inclusion fact that needs updating..."
                }
                style={{
                  padding: "9px 11px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  fontFamily: "inherit",
                }}
              />
            </label>
          </div>

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="submit"
              className="button"
              disabled={submitting}
              data-testid="submit-lodge-participation-btn"
              style={{ border: "none", cursor: "pointer" }}
            >
              {submitting
                ? "Recording..."
                : activeMode === "lodge_profile_claim"
                  ? "Submit Free Profile Claim ($0)"
                  : "Submit Factual Correction"}
            </button>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
              No payment required · Do not include secret API keys.
            </span>
          </div>

          {errorMessage && (
            <p
              role="alert"
              data-testid="lodge-participation-error"
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#fdecec",
                color: "#8f1d1d",
                fontSize: 13.5,
              }}
            >
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <div
              role="status"
              data-testid="lodge-participation-success"
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: "#eef9f2",
                border: "1px solid #b5dec4",
                color: "#124d2b",
                fontSize: 13.5,
              }}
            >
              <strong style={{ display: "block", marginBottom: 4 }}>
                {successMessage}
              </strong>
              {governanceSummary && <span>{governanceSummary}</span>}
            </div>
          )}
        </form>
      )}
    </section>
  );
}
