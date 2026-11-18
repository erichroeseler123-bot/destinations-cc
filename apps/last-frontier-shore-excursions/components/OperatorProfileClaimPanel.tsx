"use client";

import { useState, type FormEvent } from "react";
import { UNCLAIMED_OPERATOR_PROFILE_NOTICE } from "../../../lib/dcc/shared/southeastAlaskaDirectoryContract";

interface OperatorProfileClaimPanelProps {
  operatorId: string;
  operatorSlug: string;
  operatorName: string;
  officialEmailDomain: string | null;
  officialPhone: string | null;
  bookingPlatform: string;
  claimStatus: "unclaimed" | "claim_pending_verification" | "claimed_verified";
}

export function OperatorProfileClaimPanel({
  operatorId,
  operatorSlug,
  operatorName,
  officialEmailDomain,
  officialPhone,
  bookingPlatform,
  claimStatus,
}: OperatorProfileClaimPanelProps) {
  const [open, setOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requestDirectApiConnection, setRequestDirectApiConnection] = useState(false);
  const [bookingSystemIdentifier, setBookingSystemIdentifier] = useState("");
  const [notes, setNotes] = useState("");
  const [websiteHoneypot, setWebsiteHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [verificationSummary, setVerificationSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setResultMessage(null);
    setVerificationSummary(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/operator-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId,
          operatorSlug,
          operatorName,
          contactName,
          roleTitle,
          email,
          phone: phone || undefined,
          requestDirectApiConnection,
          bookingSystemIdentifier: bookingSystemIdentifier || undefined,
          notes: notes || undefined,
          website: websiteHoneypot,
          sourcePage: `/operators/${operatorSlug}`,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        verificationSummary?: string;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setErrorMessage(
          json.error || "Unable to submit claim request right now. Please try again.",
        );
      } else {
        setResultMessage(
          json.message ||
            "Your free operator profile claim has been durably recorded for verification.",
        );
        setVerificationSummary(json.verificationSummary || null);
      }
    } catch {
      setErrorMessage("Network error submitting claim request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="claim-operator-profile"
      className="card"
      style={{
        background: claimStatus === "claimed_verified" ? "#eef9f2" : "#fffaf5",
        border:
          claimStatus === "claimed_verified"
            ? "1.5px solid #156d3a"
            : "1.5px solid var(--safety-border)",
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
        <div style={{ maxWidth: 740 }}>
          <span
            className={`badge ${
              claimStatus === "claimed_verified" ? "badge-safety" : "badge-warning"
            }`}
          >
            {claimStatus === "claimed_verified"
              ? "Verified Operator Workspace"
              : "Unclaimed Public Profile · $0 Free Listing"}
          </span>
          <p
            data-testid="operator-unclaimed-notice"
            style={{
              marginTop: 10,
              marginBottom: 8,
              fontWeight: 700,
              color: "var(--deep)",
              fontSize: "15.5px",
            }}
          >
            {claimStatus === "claimed_verified"
              ? `${operatorName} has verified ownership of this company profile.`
              : UNCLAIMED_OPERATOR_PROFILE_NOTICE}
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>
            Claiming a permanent company profile on Last Frontier Shore Excursions is{" "}
            <strong>$0 forever</strong>. Verified operators can update company background,
            licensed photos, tour details, accessibility notes, and review replies. Control
            is verified via{" "}
            {officialEmailDomain ? (
              <>
                an official <strong>@{officialEmailDomain}</strong> email
              </>
            ) : (
              "official company-domain email"
            )}
            {officialPhone ? (
              <>
                , listed phone (<strong>{officialPhone}</strong>),
              </>
            ) : (
              ", listed business phone,"
            )}{" "}
            or manual owner review.
          </p>
        </div>

        {claimStatus !== "claimed_verified" && (
          <button
            type="button"
            className="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            style={{ border: "none", cursor: "pointer" }}
          >
            {open ? "Close Claim Form" : "Claim this free operator profile"}
          </button>
        )}
      </div>

      {open && claimStatus !== "claimed_verified" && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 20,
            paddingTop: 20,
            borderTop: "1px solid var(--line)",
          }}
        >
          <input
            type="text"
            name="website"
            value={websiteHoneypot}
            onChange={(e) => setWebsiteHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0 }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5 }}>
              <strong>Your Name *</strong>
              <input
                type="text"
                required
                minLength={2}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jordan Miller"
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5 }}>
              <strong>Role at {operatorName} *</strong>
              <input
                type="text"
                required
                minLength={2}
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Owner / Operations Manager"
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5 }}>
              <strong>
                Business Email *{" "}
                {officialEmailDomain ? `(@${officialEmailDomain} fastest)` : ""}
              </strong>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  officialEmailDomain
                    ? `reservations@${officialEmailDomain}`
                    : "you@company.com"
                }
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5 }}>
              <strong>Business Phone (for callback verification)</strong>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={officialPhone || "(907) 555-0100"}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                }}
              />
            </label>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "14px 16px",
              borderRadius: 10,
              background: "#ffffff",
              border: "1px solid var(--line)",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={requestDirectApiConnection}
                onChange={(e) => setRequestDirectApiConnection(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong>
                  Optional: Request live availability &amp; direct booking connection (
                  {bookingPlatform})
                </strong>
                <span style={{ display: "block", color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                  Do not paste secret API keys here. Direct live-inventory status and
                  optional supplier-hosted direct checkout never self-activate;
                  they require separate credential setup and explicit owner approval.
                </span>
              </span>
            </label>

            {requestDirectApiConnection && (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 13.5,
                  marginTop: 12,
                }}
              >
                <strong>
                  Booking Platform Shortname or Account Handle (No API Secrets)
                </strong>
                <input
                  type="text"
                  value={bookingSystemIdentifier}
                  onChange={(e) => setBookingSystemIdentifier(e.target.value)}
                  placeholder="e.g. FareHarbor company shortname or Rezgo domain"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                  }}
                />
              </label>
            )}
          </div>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 13.5,
              marginTop: 14,
            }}
          >
            <strong>Profile Corrections, Missing Tours, or Verification Notes</strong>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Let us know any tour updates, dock pickup notes, or preferred verification contact window."
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                fontFamily: "inherit",
              }}
            />
          </label>

          <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>
            <strong>Governance Note:</strong> Verified cruise ship schedules, berth
            coordinates, and 2-hour pier-return buffer calculations are maintained by
            Destination Command Center; any schedule or dock discrepancy submitted here
            enters our verification queue for review.
          </p>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14 }}>
            <button
              type="submit"
              className="button"
              disabled={submitting}
              style={{ border: "none", cursor: submitting ? "wait" : "pointer" }}
            >
              {submitting ? "Saving Claim Request..." : "Submit Free Profile Claim"}
            </button>
          </div>

          {resultMessage && (
            <div
              role="status"
              style={{
                marginTop: 14,
                padding: "12px 16px",
                borderRadius: 10,
                background: "#e6f4ea",
                border: "1px solid #137333",
                color: "#137333",
                fontSize: 14,
              }}
            >
              <strong>{resultMessage}</strong>
              {verificationSummary && (
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#137333" }}>
                  {verificationSummary}
                </p>
              )}
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              style={{
                marginTop: 14,
                padding: "12px 16px",
                borderRadius: 10,
                background: "#fce8e6",
                border: "1px solid #c5221f",
                color: "#c5221f",
                fontSize: 14,
              }}
            >
              {errorMessage}
            </div>
          )}
        </form>
      )}
    </section>
  );
}
