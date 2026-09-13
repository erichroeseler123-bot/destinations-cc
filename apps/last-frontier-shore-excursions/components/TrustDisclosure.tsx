import React from "react";

export function TrustDisclosure({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p style={{ fontSize: "11px", color: "var(--muted)", margin: "8px 0 0", lineHeight: 1.4 }}>
        <strong>Affiliate Disclosure:</strong> Booking is completed with the listed provider or booking partner. Last Frontier may earn an affiliate commission at no extra cost to you.
      </p>
    );
  }

  return (
    <div className="card" style={{ background: "#f8fbfb", border: "1px solid #dbe7e8", padding: "16px", marginTop: "16px" }}>
      <p style={{ fontSize: "12px", color: "#485b63", margin: 0, lineHeight: 1.5 }}>
        <strong>Booking Disclosure & Partner Transparency:</strong> Booking is completed with the listed provider or booking partner. Last Frontier may earn an affiliate commission at no extra cost to you. Independent tour operators establish current departure schedules, live pricing, and cancellation terms on the booking partner platform.
      </p>
    </div>
  );
}
