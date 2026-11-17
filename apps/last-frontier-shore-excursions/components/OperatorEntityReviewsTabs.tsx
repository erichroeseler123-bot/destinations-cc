"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  OperatorEntityReviewRecord,
  TourEntityReviewRecord,
} from "../../../lib/dcc/shared/southeastAlaskaDirectoryContract";

interface TourReviewBundle {
  tourSlug: string;
  tourTitle: string;
  reviews: readonly TourEntityReviewRecord[];
}

interface OperatorEntityReviewsTabsProps {
  operatorName: string;
  operatorSlug: string;
  operatorReviews: readonly OperatorEntityReviewRecord[];
  tourReviewBundles: readonly TourReviewBundle[];
}

export function OperatorEntityReviewsTabs({
  operatorName,
  operatorSlug,
  operatorReviews,
  tourReviewBundles,
}: OperatorEntityReviewsTabsProps) {
  const [activeTab, setActiveTab] = useState<"operator" | "tours">("operator");
  const totalTourReviews = tourReviewBundles.reduce(
    (acc, b) => acc + b.reviews.length,
    0,
  );

  return (
    <div className="card" data-testid="entity-separated-reviews">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <span className="badge badge-safety">Entity-Separated Review Ledger</span>
          <h3 style={{ marginTop: 8, marginBottom: 4 }}>
            Company Operations vs. Individual Tour Feedback
          </h3>
          <p style={{ margin: 0, fontSize: 13.5 }}>
            Operator reviews cover {operatorName}&apos;s communication, safety culture, and
            cruise-pier pickup reliability. Individual tour reviews apply strictly to a
            specific excursion route.
          </p>
        </div>

        <div role="tablist" aria-label="Review entity scope" style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "operator"}
            onClick={() => setActiveTab("operator")}
            className={`chip ${activeTab === "operator" ? "active" : ""}`}
            style={{ border: "1px solid var(--line)", cursor: "pointer" }}
          >
            Operator Reviews ({operatorReviews.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "tours"}
            onClick={() => setActiveTab("tours")}
            className={`chip ${activeTab === "tours" ? "active" : ""}`}
            style={{ border: "1px solid var(--line)", cursor: "pointer" }}
          >
            Individual Tour Reviews ({totalTourReviews})
          </button>
        </div>
      </div>

      {activeTab === "operator" ? (
        operatorReviews.length > 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            {operatorReviews.map((rev) => (
              <div
                key={rev.reviewId}
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "#f8fbfb",
                  border: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    color: "var(--muted)",
                    marginBottom: 6,
                  }}
                >
                  <strong>{rev.reviewerDisplayName}</strong>
                  <span>{rev.sailingOrVisitMonth}</span>
                </div>
                <p style={{ margin: 0, color: "var(--ink)", fontSize: 14.5 }}>
                  {rev.communicationAndPickupSummary}
                </p>
                {rev.operatorReply && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      paddingLeft: 12,
                      borderLeft: "3px solid var(--forest)",
                      fontSize: 13.5,
                      color: "var(--deep)",
                    }}
                  >
                    <strong>{operatorName} response:</strong> {rev.operatorReply}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "#f8fbfb",
              border: "1px dashed var(--line)",
            }}
          >
            <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
              No verified first-party company reviews have been published for{" "}
              <strong>{operatorName}</strong> on Last Frontier yet. We never scrape or
              fabricate third-party star ratings, and Google review structured data stays
              disabled until verified first-party reviews exist.
            </p>
          </div>
        )
      ) : totalTourReviews > 0 ? (
        <div style={{ display: "grid", gap: 14 }}>
          {tourReviewBundles
            .filter((b) => b.reviews.length > 0)
            .map((bundle) => (
              <div
                key={bundle.tourSlug}
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "#f8fbfb",
                  border: "1px solid var(--line)",
                }}
              >
                <Link
                  href={`/tours/${operatorSlug}/${bundle.tourSlug}`}
                  style={{ fontWeight: 700, color: "var(--forest)", fontSize: 15 }}
                >
                  {bundle.tourTitle} →
                </Link>
                {bundle.reviews.map((rev) => (
                  <p
                    key={rev.reviewId}
                    style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ink)" }}
                  >
                    <strong>{rev.reviewerDisplayName}</strong> ({rev.sailingOrVisitMonth}):{" "}
                    {rev.experienceSummary}
                  </p>
                ))}
              </div>
            ))}
        </div>
      ) : (
        <div
          style={{
            padding: "16px",
            borderRadius: 12,
            background: "#f8fbfb",
            border: "1px dashed var(--line)",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
            Individual tour reviews are stored separately on each excursion record rather
            than blended into company-level ratings. Select any tour above to view its
            product details and verified schedule notes.
          </p>
        </div>
      )}
    </div>
  );
}
