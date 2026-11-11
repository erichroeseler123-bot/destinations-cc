"use client";

import { useState, type FormEvent } from "react";

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; referenceId: string; message: string }
  | { kind: "error"; error: string };

export default function DellsInquiryForm() {
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ kind: "submitting" });

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      inquiryType: String(data.get("inquiryType") || "group_planning").trim(),
      partySize: String(data.get("partySize") || "").trim(),
      dates: String(data.get("dates") || "").trim(),
      contextTitle: String(data.get("contextTitle") || "").trim(),
      message: String(data.get("message") || "").trim(),
      sourcePath: "/contact",
    };

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json().catch(() => null)) as {
        ok?: boolean;
        referenceId?: string;
        message?: string;
        error?: string;
      } | null;

      if (!response.ok || !json?.ok) {
        setState({
          kind: "error",
          error:
            json?.error ||
            "We could not record your inquiry right now. Please check your details and try again.",
        });
        return;
      }

      form.reset();
      setState({
        kind: "success",
        referenceId: json.referenceId || "WTD-INQ",
        message:
          json.message ||
          "Thank you! Your inquiry has been logged with our Wisconsin Dells planning desk.",
      });
    } catch {
      setState({
        kind: "error",
        error: "Network error submitting inquiry. Please try again shortly.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <label htmlFor="wtd-name" style={{ fontWeight: 600 }}>
          Your Name *
        </label>
        <input
          id="wtd-name"
          name="name"
          type="text"
          required
          placeholder="Jordan Miller"
          style={{ padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #64748b" }}
        />
      </div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <label htmlFor="wtd-email" style={{ fontWeight: 600 }}>
            Email Address *
          </label>
          <input
            id="wtd-email"
            name="email"
            type="email"
            required
            placeholder="jordan@example.com"
            style={{ padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #64748b" }}
          />
        </div>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <label htmlFor="wtd-phone" style={{ fontWeight: 600 }}>
            Phone (optional)
          </label>
          <input
            id="wtd-phone"
            name="phone"
            type="tel"
            placeholder="(608) 555-0199"
            style={{ padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #64748b" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <label htmlFor="wtd-type" style={{ fontWeight: 600 }}>
            Planning Topic
          </label>
          <select
            id="wtd-type"
            name="inquiryType"
            defaultValue="group_planning"
            style={{ padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #64748b" }}
          >
            <option value="group_planning">Group / Multi-Family Planning</option>
            <option value="activity_booking">River Boat / Ducks Timing</option>
            <option value="resort_help">Downtown vs. Parkway vs. Lake Delton Fit</option>
            <option value="operator_listing">Local Operator / Listing Question</option>
            <option value="general">General Wisconsin Dells Question</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <label htmlFor="wtd-party" style={{ fontWeight: 600 }}>
            Group Size
          </label>
          <input
            id="wtd-party"
            name="partySize"
            type="number"
            min={1}
            max={200}
            placeholder="8"
            style={{ padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #64748b" }}
          />
        </div>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <label htmlFor="wtd-dates" style={{ fontWeight: 600 }}>
            Target Dates
          </label>
          <input
            id="wtd-dates"
            name="dates"
            type="text"
            placeholder="July 18–20, 2026"
            style={{ padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #64748b" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.35rem" }}>
        <label htmlFor="wtd-context" style={{ fontWeight: 600 }}>
          Specific Activity or Area (optional)
        </label>
        <input
          id="wtd-context"
          name="contextTitle"
          type="text"
          placeholder="Upper Dells Boat Tour + Lake Delton rental house dinner"
          style={{ padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #64748b" }}
        />
      </div>

      <div style={{ display: "grid", gap: "0.35rem" }}>
        <label htmlFor="wtd-message" style={{ fontWeight: 600 }}>
          Trip Details &amp; Questions *
        </label>
        <textarea
          id="wtd-message"
          name="message"
          required
          rows={4}
          placeholder="Tell us ages in the group, where you are staying, and what you are trying to fit into your day..."
          style={{ padding: "0.65rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #64748b" }}
        />
      </div>

      <button
        type="submit"
        disabled={state.kind === "submitting"}
        style={{
          padding: "0.8rem 1.25rem",
          borderRadius: "0.5rem",
          border: "none",
          fontWeight: 700,
          cursor: state.kind === "submitting" ? "wait" : "pointer",
          background: "#d49a55",
          color: "#15120e",
          justifySelf: "start",
        }}
      >
        {state.kind === "submitting" ? "Sending Inquiry..." : "Send to Dells Planning Desk"}
      </button>

      {state.kind === "success" && (
        <div
          role="status"
          style={{
            padding: "0.9rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #10b981",
          }}
        >
          <strong>Inquiry logged ({state.referenceId}).</strong> {state.message}
        </div>
      )}

      {state.kind === "error" && (
        <div
          role="alert"
          style={{
            padding: "0.9rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #ef4444",
          }}
        >
          {state.error}
        </div>
      )}
    </form>
  );
}
