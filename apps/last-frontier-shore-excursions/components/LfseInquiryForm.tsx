"use client";

import { useState, type FormEvent } from "react";

export function LfseInquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shipName, setShipName] = useState("");
  const [portDate, setPortDate] = useState("");
  const [portsOfCall, setPortsOfCall] = useState("Juneau, Skagway & Ketchikan");
  const [partySize, setPartySize] = useState("4");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmittedMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          shipName: shipName || undefined,
          portDate: portDate || undefined,
          portsOfCall,
          partySize: Number(partySize) || 2,
          notes: notes || undefined,
          sourcePage: "/contact",
          website,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setErrorMessage(
          json.error || "Unable to submit your inquiry right now. Please try again.",
        );
      } else {
        setSubmittedMessage(
          json.message ||
            "Inquiry received. Our Alaska planning desk will follow up with port-window feasibility notes and direct booking links.",
        );
        setNotes("");
      }
    } catch {
      setErrorMessage("Network error submitting inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginTop: 24 }}>
      <h2>Request Multi-Cabin &amp; Port Logistics Guidance</h2>
      <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: 18 }}>
        Last Frontier Shore Excursions is an independent Alaska excursion comparison and concierge guide — <strong>not a cruise line, tour operator, or merchant of record</strong>. We never collect payment or credit card details here; reservations are completed directly with the tour operator or verified booking partner.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          <span>Your Name *</span>
          <input
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Morgan"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #cbd5e1)" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          <span>Email Address *</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@example.com"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #cbd5e1)" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          <span>Phone (Optional)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(206) 555-0140"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #cbd5e1)" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          <span>Cruise Ship (Optional)</span>
          <input
            type="text"
            value={shipName}
            onChange={(e) => setShipName(e.target.value)}
            placeholder="e.g. Discovery Princess, Koningsdam"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #cbd5e1)" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          <span>Sail Date or First Port Date</span>
          <input
            type="date"
            value={portDate}
            onChange={(e) => setPortDate(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #cbd5e1)" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
          <span>Total Guests / Multi-Cabin Party Size *</span>
          <input
            type="number"
            min={1}
            max={120}
            required
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #cbd5e1)" }}
          />
        </label>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14, marginTop: 14 }}>
        <span>Alaska Ports of Call</span>
        <input
          type="text"
          value={portsOfCall}
          onChange={(e) => setPortsOfCall(e.target.value)}
          placeholder="Juneau, Skagway, Ketchikan, Sitka, Icy Strait Point"
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #cbd5e1)" }}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14, marginTop: 14 }}>
        <span>All-Aboard Windows, Mobility Notes &amp; Excursion Priorities</span>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Share dock arrival / all-aboard times, multi-cabin group coordination questions, or excursions you are comparing (whale watching, White Pass rail, glacier flightseeing, floatplanes)."
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line, #cbd5e1)" }}
        />
      </label>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        aria-hidden="true"
      />

      {errorMessage ? (
        <p role="alert" style={{ marginTop: 14, color: "#b91c1c", fontWeight: 600 }}>
          {errorMessage}
        </p>
      ) : null}

      {submittedMessage ? (
        <p role="status" style={{ marginTop: 14, color: "#0f766e", fontWeight: 600 }}>
          {submittedMessage}
        </p>
      ) : null}

      <div style={{ marginTop: 18 }}>
        <button
          type="submit"
          disabled={submitting}
          className="btn"
          style={{ cursor: submitting ? "wait" : "pointer" }}
        >
          {submitting ? "Submitting Inquiry..." : "Send Port Logistics Inquiry"}
        </button>
      </div>
    </form>
  );
}
