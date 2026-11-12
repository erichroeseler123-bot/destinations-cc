import React from "react";
import type { LfseJuneauNormalizedFeedResult } from "../lib/dccJuneauSupplierFeed";

interface JuneauNormalizedSupplierFeedSectionProps {
  feed: LfseJuneauNormalizedFeedResult;
}

export function JuneauNormalizedSupplierFeedSection({
  feed,
}: JuneauNormalizedSupplierFeedSectionProps) {
  if (!feed.ok || feed.tours.length === 0) {
    // Graceful fallback: when Rezgo is unavailable or returns 0 matching options,
    // Last Frontier continues operating cleanly with its approved Viator offers.
    return null;
  }

  return (
    <section
      className="section"
      data-testid="lfse-juneau-normalized-supplier-feed"
      style={{
        background: "#ffffff",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        padding: "32px 0",
      }}
    >
      <div className="shell">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <p className="eyebrow" style={{ color: "var(--muted)", marginBottom: 4 }}>
              DCC Normalized Supplier Feed · Live Operator Availability Only
            </p>
            <h2 style={{ margin: 0, fontSize: "22px" }}>
              {feed.verifiedCompanyName || "Juneau Tours & Whale Watch"} — Live Operator Availability
            </h2>
          </div>
          <span className="badge badge-warning">
            Needs Verification · Cruise-Safe Timing Unverified · Partner Fallback Checkout Active
          </span>
        </div>

        <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: 880, marginBottom: 18 }}>
          Departures, per-option seat counts, durations, and published rates below reflect{" "}
          <strong>live operator availability</strong> normalized read-only through Destination Command Center from{" "}
          <strong>{feed.verifiedCompanyName || "Juneau Tours & Whale Watch"}</strong>
          {feed.verifiedRezgoDomain ? ` (${feed.verifiedRezgoDomain})` : ""}
          {feed.dateChecked ? ` for service date ${feed.dateChecked}` : ""}
          {feed.checkedAt ? ` · Last checked ${feed.checkedAt}` : ""}.{" "}
          <strong>Needs verification (not verified cruise-safe timing):</strong> operator booking cutoffs (for example, 2h prior to tour) apply only to ticket purchase and are never treated as our{" "}
          <strong>1:59:59+ (2-hour) minimum recommended cruise-return buffer</strong>. Exact meeting points, berth-transfer durations, operator return times, and dock pickup rules remain unconfirmed. Direct Rezgo checkout remains disabled; matched listings route to our approved partner offers.
        </p>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {feed.tours.map((tour) => {
            const reducedBufferOptions = (tour.optionWindowAssessments || []).filter(
              (a) => a.status === "reduced_buffer_not_recommended" && a.upperBoundRemainingBufferHmsLabel,
            );
            const blockedDepartures = tour.blockedOutsideWindowDepartures || [];
            const depOptions = tour.departureOptions || [];
            const effectiveServiceDate = tour.serviceDate ?? tour.dateChecked ?? feed.dateChecked;
            const effectiveCheckedAt = tour.checkedAt ?? feed.checkedAt;
            const allOptionsBlocked =
              depOptions.length > 0 &&
              depOptions.every((opt) => opt.windowAssessment?.blockedForSailingWindow === true);

            return (
              <article
                className="card"
                key={`${tour.normalizedTourId}-${tour.optionName || "default"}`}
                style={{
                  background: "#f8fbfb",
                  border: "1px solid var(--line)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span className="badge badge-warning">
                      {tour.durationLabel || (tour.durationMinutes ? `${tour.durationMinutes} min` : "Verify duration")} · Needs verification
                    </span>
                    {tour.adultPriceUsd !== null && (
                      <strong style={{ color: "var(--forest)", fontSize: "15px" }}>
                        From ${tour.adultPriceUsd.toFixed(0)} {tour.currency}
                        {tour.childPriceUsd !== null ? ` · Child $${tour.childPriceUsd.toFixed(0)}` : ""}
                      </strong>
                    )}
                  </div>

                  <h3 style={{ fontSize: "17px", marginTop: 4, marginBottom: 6 }}>{tour.title}</h3>
                  {tour.optionName && (
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--deep)", margin: "0 0 8px" }}>
                      Option: {tour.optionName}
                    </p>
                  )}

                  <div className="chips" style={{ marginBottom: 10 }}>
                    {tour.rezgoCom && (
                      <span className="chip">
                        COM {tour.rezgoCom}
                      </span>
                    )}
                    {effectiveServiceDate && (
                      <span className="chip">
                        Service date: {effectiveServiceDate}
                      </span>
                    )}
                    {tour.departureTimes.length > 0 && (
                      <span className="chip">
                        Departures: {tour.departureTimes.slice(0, 4).join(", ")}
                      </span>
                    )}
                    {tour.availableSpots !== null && effectiveServiceDate && (
                      <span className="chip">
                        {tour.availableSpots} spots ({effectiveServiceDate})
                      </span>
                    )}
                    {typeof tour.supplierBookingCutoffHours === "number" && (
                      <span className="chip">
                        Supplier booking cutoff: {tour.supplierBookingCutoffHours}h (not ship buffer)
                      </span>
                    )}
                    {tour.matchedViatorProductCode && (
                      <span className="chip">
                        Partner Ref: #{tour.matchedViatorProductCode}
                      </span>
                    )}
                  </div>

                  {depOptions.length > 0 && (
                    <div
                      style={{
                        borderTop: "1px solid var(--line)",
                        paddingTop: 8,
                        marginBottom: 10,
                        fontSize: "12px",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: 4, color: "var(--deep)" }}>
                        Per-Departure Options (Live Read-Only Feed):
                      </strong>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
                        {depOptions.map((opt) => {
                          const isBlocked = Boolean(opt.windowAssessment?.blockedForSailingWindow);
                          const isReduced =
                            opt.windowAssessment?.status === "reduced_buffer_not_recommended";
                          return (
                            <li
                              key={opt.uid}
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                                gap: 6,
                                padding: "4px 6px",
                                borderRadius: 6,
                                background: isBlocked ? "#fef2f2" : "#ffffff",
                                border: "1px solid var(--line)",
                              }}
                            >
                              <span>
                                <strong>{opt.departureTime || opt.optionName || "Departure"}</strong>{" "}
                                <span style={{ color: "var(--muted)" }}>(UID {opt.uid})</span>
                                {opt.availableSpots !== null ? ` · ${opt.availableSpots} seats` : ""}
                              </span>
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: isBlocked
                                    ? "#9e2323"
                                    : isReduced
                                      ? "#875c00"
                                      : "var(--muted)",
                                }}
                              >
                                {isBlocked
                                  ? "Outside sailing window — blocked"
                                  : isReduced && opt.windowAssessment?.upperBoundRemainingBufferHmsLabel
                                    ? `Reduced buffer (${opt.windowAssessment.upperBoundRemainingBufferHmsLabel} remaining) — not recommended`
                                    : "Needs verification"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {reducedBufferOptions.length > 0 && (
                    <p style={{ fontSize: "12px", color: "#875c00", margin: "0 0 6px" }}>
                      Reduced buffer (not recommended):{" "}
                      {reducedBufferOptions
                        .map(
                          (opt) =>
                            `${opt.departureTime} (${opt.upperBoundRemainingBufferHmsLabel} max before all-aboard)`,
                        )
                        .join("; ")}
                    </p>
                  )}
                  {blockedDepartures.length > 0 && (
                    <p style={{ fontSize: "12px", color: "#9e2323", margin: "0 0 6px" }}>
                      Outside ship window: {blockedDepartures.join(", ")}
                    </p>
                  )}
                  {effectiveCheckedAt && (
                    <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0 6px" }}>
                      Last checked: {effectiveCheckedAt}
                    </p>
                  )}
                </div>

                <div>
                  {tour.bookingProviderIdentity?.checkoutDisclosure && (
                    <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0 6px" }}>
                      {tour.bookingProviderIdentity.checkoutDisclosure}
                    </p>
                  )}
                  {allOptionsBlocked ? (
                    <span style={{ display: "inline-block", marginTop: 4, fontSize: "12px", fontWeight: 700, color: "#9e2323" }}>
                      Blocked — Outside Sailing Window
                    </span>
                  ) : tour.trackedFallbackHref ? (
                    <a
                      href={tour.trackedFallbackHref}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: 4,
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--forest)",
                        textDecoration: "underline",
                      }}
                    >
                      Check approved partner listing (#{tour.matchedViatorProductCode}) →
                    </a>
                  ) : (
                    <span style={{ display: "inline-block", marginTop: 4, fontSize: "12px", color: "var(--muted)" }}>
                      Live operator availability preview · Direct booking held pending mapping verification
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
