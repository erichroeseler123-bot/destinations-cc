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
            Cruise-Safe Timing Unverified · Partner Fallback Checkout Active
          </span>
        </div>

        <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: 860, marginBottom: 18 }}>
          Departures, durations, and published rates below reflect <strong>live operator availability</strong> normalized read-only through Destination Command Center from{" "}
          <strong>{feed.verifiedCompanyName || "Juneau Tours & Whale Watch"}</strong>
          {feed.checkedAt ? ` (checked ${feed.checkedAt})` : ""}.{" "}
          <strong>Not verified cruise-safe timing:</strong> operator booking cutoffs (for example, 2h prior to tour) apply only to ticket purchase and are never treated as DCC&apos;s 1:59:59+ cruise-return buffer. Exact meeting points, berth-transfer durations, operator return times, and dock pickup rules remain unconfirmed. Direct operator checkout remains disabled; matched listings route to our approved partner offers.
        </p>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {feed.tours.map((tour) => {
            const reducedBufferOptions = (tour.optionWindowAssessments || []).filter(
              (a) => a.status === "reduced_buffer_not_recommended" && a.upperBoundRemainingBufferHmsLabel,
            );
            const blockedDepartures = tour.blockedOutsideWindowDepartures || [];

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
                      {tour.durationLabel || (tour.durationMinutes ? `${tour.durationMinutes} min` : "Verify duration")} · Timing unverified
                    </span>
                    {tour.adultPriceUsd !== null && (
                      <strong style={{ color: "var(--forest)", fontSize: "15px" }}>
                        From ${tour.adultPriceUsd.toFixed(0)} {tour.currency}
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
                    {tour.departureTimes.length > 0 && (
                      <span className="chip">
                        Departures: {tour.departureTimes.slice(0, 4).join(", ")}
                      </span>
                    )}
                    {tour.availableSpots !== null && tour.dateChecked && (
                      <span className="chip">
                        {tour.availableSpots} spots ({tour.dateChecked})
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
                </div>

                {tour.trackedFallbackHref ? (
                  <a
                    href={tour.trackedFallbackHref}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    style={{
                      marginTop: 8,
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--forest)",
                      textDecoration: "underline",
                    }}
                  >
                    Check approved partner listing (#{tour.matchedViatorProductCode}) →
                  </a>
                ) : (
                  <span style={{ marginTop: 8, fontSize: "12px", color: "var(--muted)" }}>
                    Live operator availability preview · Direct booking held pending mapping verification
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
