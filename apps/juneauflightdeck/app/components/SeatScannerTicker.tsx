export default function SeatScannerTicker() {
  return (
    <div className="seat-scanner-ticker" role="note" aria-label="Juneau Flight Deck service mode">
      <div className="seat-scanner-badge">
        <span className="seat-scanner-label">HUMAN CONCIERGE REVIEW DESK</span>
      </div>
      <div className="seat-scanner-feed">
        <span className="seat-scanner-operator">FAA Part 135 Operators</span>
        <span className="seat-scanner-port">(Juneau &amp; Skagway)</span>
        <span className="seat-scanner-dot">·</span>
        <span className="seat-scanner-event">
          TEMSCO · Coastal Helicopters · NorthStar Trekking — manual port-window &amp; availability review
        </span>
      </div>
    </div>
  );
}
