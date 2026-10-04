"use client";

import { useEffect, useState } from "react";

const RECENT_ACTIVITY = [
  { operator: "TEMSCO Helicopters", port: "Juneau", event: "Checked live schedule", time: "18s ago", status: "ok" },
  { operator: "Coastal Helicopters", port: "Juneau", event: "Claimed 2 glacier landing seats", time: "3m ago", status: "claimed" },
  { operator: "NorthStar Trekking", port: "Juneau", event: "Checked ice trek slots", time: "42s ago", status: "ok" },
  { operator: "TEMSCO Skagway", port: "Skagway", event: "Checked Chilkat flights", time: "1m ago", status: "ok" },
  { operator: "Herbert Glacier Camp", port: "Juneau", event: "Claimed 1 dog sledding slot", time: "14m ago", status: "claimed" },
];

export default function SeatScannerTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % RECENT_ACTIVITY.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const active = RECENT_ACTIVITY[index];

  return (
    <div className="seat-scanner-ticker" role="status" aria-live="polite">
      <div className="seat-scanner-badge">
        <span className="seat-scanner-pulse" aria-hidden="true" />
        <span className="seat-scanner-label">24/7 HELICOPTER SEAT SCANNER: ACTIVE</span>
      </div>
      <div className="seat-scanner-feed">
        <span className="seat-scanner-operator">{active.operator}</span>
        <span className="seat-scanner-port">({active.port})</span>
        <span className="seat-scanner-dot">·</span>
        <span className={`seat-scanner-event ${active.status === "claimed" ? "text-accent-gold" : ""}`}>
          {active.event}
        </span>
        <span className="seat-scanner-time">{active.time}</span>
      </div>
    </div>
  );
}
