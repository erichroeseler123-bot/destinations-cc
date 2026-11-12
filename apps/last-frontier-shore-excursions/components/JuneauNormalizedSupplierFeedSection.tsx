import type { LfseJuneauNormalizedFeedResult } from "@/lib/dccJuneauSupplierFeed";

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
              DCC Normalized Supplier Feed · Read-Only Schedule Sync
            </p>
            <h2 style={{ margin: 0, fontSize: "22px" }}>
              {feed.verifiedCompanyName || "Juneau Tours & Whale Watch"} — Verified Operator Schedule
            </h2>
          </div>
          <span
            style={{
              background: "#eef6f7",
              border: "1px solid #bcd4d8",
              borderRadius: "999px",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--deep)",
            }}
          >
            Read-Only via DCC · Partner Fallback Checkout Active
          </span>
        </div>

        <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: 820, marginBottom: 18 }}>
          Tour options, durations, and published rates below are normalized securely through Destination Command Center from{" "}
          <strong>{feed.verifiedCompanyName || "Juneau Tours & Whale Watch"}</strong>. Direct operator checkout remains disabled pending final product-mapping and written commission sign-off; booking links route through our presently approved partner listings where matched.
        </p>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {feed.tours.map((tour) => (
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
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <span className="badge badge-safety">
                    {tour.durationLabel || (tour.durationMinutes ? `${tour.durationMinutes} min` : "Verify duration")}
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
                  {tour.matchedViatorProductCode && (
                    <span className="chip">
                      Partner Ref: #{tour.matchedViatorProductCode}
                    </span>
                  )}
                </div>
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
                  Read-only schedule preview · Direct booking held pending mapping verification
                </span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
