"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  useViatorJuneauProducts,
  buildViatorBookingUrlWithPreferences,
  fetchViatorProductReviews,
} from "@/lib/viator/clientBridge";
import type {
  ViatorJuneauProduct,
  ViatorProductReviewsResponse,
  ViatorTravelerReview,
} from "@/lib/viator/types";

interface ViatorFeaturedToursProps {
  initialDate?: string | null;
  headline?: string;
  subhead?: string;
  className?: string;
}

const FILTER_TABS: Array<{ label: string; value: "all" | "glacier_landing" | "dog_sledding" | "ice_trek" }> = [
  { label: "All Helicopter Tours", value: "all" },
  { label: "Glacier Landings", value: "glacier_landing" },
  { label: "Glacier Dog Sledding", value: "dog_sledding" },
  { label: "Ice Trek & Climb", value: "ice_trek" },
];

export default function ViatorFeaturedTours({
  initialDate = null,
  headline = "Juneau Helicopter Excursions via Viator",
  subhead = "Compare glacier flights and dog sledding camps. Real-time departures and party availability are confirmed in the live Viator reservation calendar.",
  className = "",
}: ViatorFeaturedToursProps) {
  const [selectedTab, setSelectedTab] = useState<"all" | "glacier_landing" | "dog_sledding" | "ice_trek">("all");
  const [dateFilter, setDateFilter] = useState<string>(initialDate || "");
  const [passengerCount, setPassengerCount] = useState<number>(2);

  // Review modal state (client-fetched on demand; never in SSR HTML)
  const [activeReviewProduct, setActiveReviewProduct] = useState<ViatorJuneauProduct | null>(null);
  const [reviewsData, setReviewsData] = useState<ViatorProductReviewsResponse | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const { products, loading, error, isLive, status, snapshotTimestamp, attribution, browseHref } =
    useViatorJuneauProducts({
      date: dateFilter || undefined,
      passengerCount,
      tourType: selectedTab,
    });

  const handleOpenReviews = async (product: ViatorJuneauProduct) => {
    setActiveReviewProduct(product);
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const data = await fetchViatorProductReviews(product.productCode);
      setReviewsData(data);
    } catch {
      setReviewsError("Unable to load traveler reviews at this time.");
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleCloseReviews = () => {
    setActiveReviewProduct(null);
    setReviewsData(null);
    setReviewsError(null);
  };

  return (
    <section
      id="viator-featured-tours"
      className={`jfd-viator-section ${className}`}
      aria-label="Viator Featured Helicopter Excursions"
      style={{
        maxWidth: "var(--content, 1240px)",
        margin: "48px auto",
        padding: "0 20px",
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent, #f0b35b)",
            marginBottom: 8,
          }}
        >
          <span>Official Viator Partner</span>
          <span>·</span>
          <span>Tripadvisor Partner Network</span>
        </div>
        <h2
          style={{
            fontSize: "clamp(1.75rem, 3.5vw, 2.4rem)",
            fontWeight: 800,
            margin: "0 0 10px 0",
            color: "var(--text, #eef6fb)",
            letterSpacing: "-0.02em",
          }}
        >
          {headline}
        </h2>
        <p
          style={{
            maxWidth: 740,
            margin: "0 auto",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            color: "var(--muted, rgba(228, 239, 246, 0.78))",
          }}
        >
          {subhead}
        </p>

        {/* Live vs Snapshot Transparency Banner */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
            padding: "5px 14px",
            borderRadius: "var(--radius-md, 18px)",
            fontSize: "0.78rem",
            background: isLive ? "rgba(34, 197, 94, 0.12)" : "rgba(245, 158, 11, 0.12)",
            border: `1px solid ${isLive ? "rgba(34, 197, 94, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
            color: isLive ? "#86efac" : "#fcd34d",
          }}
        >
          <span>{isLive ? "🟢" : "ℹ️"}</span>
          <span>
            {isLive
              ? "Live Viator API Feed Active"
              : `Catalog snapshot (${snapshotTimestamp ? snapshotTimestamp.slice(0, 10) : "Oct 2026"}). Real-time prices & live departures are verified in the Viator booking calendar.`}
          </span>
        </div>

        {/* Date & Filter Toolbar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginTop: 20,
          }}
        >
          {/* Category Tabs */}
          <div
            role="tablist"
            aria-label="Tour Type Filter"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              background: "rgba(7, 24, 36, 0.75)",
              border: "1px solid var(--line, rgba(151, 211, 255, 0.15))",
              borderRadius: "var(--radius-md, 18px)",
              padding: 4,
            }}
          >
            {FILTER_TABS.map((tab) => {
              const active = selectedTab === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedTab(tab.value)}
                  style={{
                    border: "none",
                    background: active
                      ? "linear-gradient(135deg, #113854, #1b4d73)"
                      : "transparent",
                    color: active ? "#ffffff" : "var(--muted, rgba(228, 239, 246, 0.78))",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.85rem",
                    padding: "8px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Date Picker Filter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(7, 24, 36, 0.75)",
              border: "1px solid var(--line, rgba(151, 211, 255, 0.15))",
              borderRadius: "var(--radius-md, 18px)",
              padding: "6px 14px",
            }}
          >
            <label
              htmlFor="viator-port-date"
              style={{
                fontSize: "0.8rem",
                color: "var(--ice, #9ed9ff)",
                fontWeight: 600,
              }}
            >
              Port Date:
            </label>
            <input
              id="viator-port-date"
              type="date"
              value={dateFilter}
              min="2027-05-01"
              max="2027-09-30"
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontFamily: "inherit",
                cursor: "pointer",
                outline: "none",
              }}
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter("")}
                aria-label="Clear date filter"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Passenger Count Selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(7, 24, 36, 0.75)",
              border: "1px solid var(--line, rgba(151, 211, 255, 0.15))",
              borderRadius: "var(--radius-md, 18px)",
              padding: "6px 14px",
            }}
          >
            <label
              htmlFor="viator-passengers"
              style={{
                fontSize: "0.8rem",
                color: "var(--ice, #9ed9ff)",
                fontWeight: 600,
              }}
            >
              Travelers:
            </label>
            <select
              id="viator-passengers"
              value={passengerCount}
              onChange={(e) => setPassengerCount(parseInt(e.target.value, 10))}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontFamily: "inherit",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num} style={{ background: "#081c2a", color: "#ffffff" }}>
                  {num} {num === 1 ? "Guest" : "Guests"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Honest Availability Disclaimer */}
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--muted)",
            margin: "12px auto 0",
            maxWidth: 680,
          }}
        >
          *Selecting a cruise date and passenger count pre-fills your preferences. Exact departure time slots and live seating are confirmed in the official Viator booking calendar before reservation.
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 440,
                borderRadius: "var(--radius-lg, 24px)",
                background: "rgba(7, 24, 36, 0.5)",
                border: "1px solid var(--line, rgba(151, 211, 255, 0.15))",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      )}

      {/* Error Notice */}
      {error && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: 32,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-md, 18px)",
            color: "#fca5a5",
          }}
        >
          <p style={{ margin: "0 0 12px 0" }}>Unable to load live Viator inventory.</p>
          <a
            href={browseHref}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
            style={{ fontSize: "0.85rem" }}
          >
            Browse all Juneau tours directly on Viator →
          </a>
        </div>
      )}

      {/* Product Cards Grid */}
      {!loading && products.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {products.map((product) => (
            <TourCard
              key={product.id}
              product={product}
              selectedDate={dateFilter}
              passengerCount={passengerCount}
              onOpenReviews={() => handleOpenReviews(product)}
            />
          ))}
        </div>
      )}

      {/* Attribution Footer */}
      <div
        style={{
          marginTop: 36,
          padding: "16px 20px",
          background: "rgba(7, 24, 36, 0.6)",
          border: "1px solid var(--line, rgba(151, 211, 255, 0.15))",
          borderRadius: "var(--radius-md, 18px)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontSize: "0.82rem",
          color: "var(--muted, rgba(228, 239, 246, 0.78))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontWeight: 800,
              color: "#34d399",
              letterSpacing: "0.05em",
            }}
          >
            VIATOR · TRIPADVISOR
          </span>
          <span>
            {attribution?.notice ||
              "Total review count, ratings, and supplier photos provided via Viator Partner API."}
          </span>
        </div>

        <a
          href={browseHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--ice, #9ed9ff)",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>View all Juneau inventory on Viator</span>
          <span>&rarr;</span>
        </a>
      </div>

      {/* Review Modal (Phase 2 Protected Content - On Demand Only) */}
      {activeReviewProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Traveler reviews for ${activeReviewProduct.title}`}
          data-nosnippet="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
          }}
          onClick={handleCloseReviews}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 640,
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#081c2a",
              border: "1px solid var(--line, rgba(151, 211, 255, 0.2))",
              borderRadius: "var(--radius-lg, 24px)",
              padding: 24,
              color: "var(--text, #eef6fb)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                paddingBottom: 16,
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent)" }}>
                  Traveler Reviews &amp; Photos
                </div>
                <h3 style={{ margin: "4px 0 0 0", fontSize: "1.2rem", fontWeight: 800 }}>
                  {activeReviewProduct.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseReviews}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: "1.4rem",
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "16px 0" }}>
              {reviewsLoading && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                  Loading reviews and traveler photos...
                </div>
              )}

              {reviewsError && (
                <div style={{ color: "#fca5a5", textAlign: "center", padding: "20px 0" }}>
                  {reviewsError}
                </div>
              )}

              {!reviewsLoading && reviewsData && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {reviewsData.reviews.length === 0 ? (
                    <p style={{ color: "var(--muted)", textAlign: "center" }}>
                      No traveler reviews found for this excursion.
                    </p>
                  ) : (
                    reviewsData.reviews.map((rev) => (
                      <div
                        key={rev.reviewId}
                        style={{
                          background: "rgba(7, 24, 36, 0.6)",
                          border: "1px solid var(--line)",
                          borderRadius: 14,
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#fbbf24", fontWeight: 800 }}>
                              {"★".repeat(rev.rating)}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{rev.author}</span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                            {rev.publishedDate}
                          </span>
                        </div>

                        {rev.title && (
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 6 }}>
                            {rev.title}
                          </div>
                        )}

                        <p
                          style={{
                            fontSize: "0.88rem",
                            lineHeight: 1.55,
                            color: "var(--muted)",
                            margin: "0 0 12px 0",
                          }}
                        >
                          {rev.text}
                        </p>

                        {/* Traveler-submitted photos attached to review */}
                        {rev.travelerPhotos && rev.travelerPhotos.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "var(--ice)",
                                marginBottom: 6,
                              }}
                            >
                              Traveler Photo:
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              {rev.travelerPhotos.map((photo, pIdx) => (
                                <div
                                  key={pIdx}
                                  style={{
                                    position: "relative",
                                    width: 140,
                                    height: 95,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    border: "1px solid var(--line)",
                                  }}
                                >
                                  <Image
                                    src={photo.url}
                                    alt={photo.caption || "Traveler photo from Juneau excursion"}
                                    fill
                                    sizes="140px"
                                    style={{ objectFit: "cover" }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* Mandatory Review Attribution */}
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--muted)",
                      textAlign: "center",
                      paddingTop: 10,
                      borderTop: "1px solid var(--line)",
                    }}
                  >
                    {reviewsData.attribution}
                  </div>
                </div>
              )}
            </div>

            {/* Modal CTA */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                paddingTop: 16,
                borderTop: "1px solid var(--line)",
              }}
            >
              <a
                href={buildViatorBookingUrlWithPreferences(
                  activeReviewProduct.bookHref,
                  dateFilter,
                  passengerCount
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
                style={{ fontSize: "0.85rem", padding: "10px 18px" }}
              >
                Check Real-Time Availability on Viator &rarr;
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TourCard({
  product,
  selectedDate,
  passengerCount,
  onOpenReviews,
}: {
  product: ViatorJuneauProduct;
  selectedDate: string;
  passengerCount: number;
  onOpenReviews: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  // Preserve full API-returned URL with PID, MCID, etc., while safely appending date/pax preferences
  const finalBookingUrl = buildViatorBookingUrlWithPreferences(
    product.bookHref,
    selectedDate,
    passengerCount
  );

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
        border: "1px solid var(--line, rgba(151, 211, 255, 0.15))",
        borderRadius: "var(--radius-lg, 24px)",
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Supplier Photo Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 10",
          backgroundColor: "#061521",
          overflow: "hidden",
        }}
      >
        <Image
          src={
            imgError || !product.imageUrl
              ? "https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/07/90/5a/68.jpg"
              : product.imageUrl
          }
          alt={product.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{
            objectFit: "cover",
            transition: "transform 0.3s ease",
          }}
          onError={() => setImgError(true)}
        />

        {/* Badges Overlay */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            zIndex: 2,
          }}
        >
          {product.badges.slice(0, 1).map((badge, idx) => (
            <span
              key={idx}
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                padding: "4px 8px",
                borderRadius: 8,
                background: "rgba(4, 17, 27, 0.85)",
                backdropFilter: "blur(6px)",
                color: "var(--accent, #f0b35b)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Operator Tag */}
        {product.supplierName && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 12,
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 6,
              background: "rgba(4, 17, 27, 0.82)",
              color: "#ffffff",
              backdropFilter: "blur(4px)",
            }}
          >
            {product.supplierName}
          </div>
        )}
      </div>

      {/* Content Body */}
      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Rating and Reviews (Click opens protected reviews modal) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#fbbf24", fontWeight: 800 }}>★</span>
            <span style={{ fontWeight: 800, color: "#ffffff" }}>{product.rating.toFixed(1)}</span>
            <span style={{ color: "var(--muted, rgba(228, 239, 246, 0.78))" }}>
              ({product.reviewCount} reviews)
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenReviews}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--ice, #9ed9ff)",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Read reviews
          </button>
        </div>

        {/* Tour Title */}
        <h3
          style={{
            fontSize: "1.08rem",
            fontWeight: 800,
            lineHeight: 1.35,
            margin: "0 0 8px 0",
            color: "var(--text, #eef6fb)",
          }}
        >
          {product.title}
        </h3>

        {/* Description Snippet */}
        {product.description && (
          <p
            style={{
              fontSize: "0.88rem",
              lineHeight: 1.5,
              color: "var(--muted, rgba(228, 239, 246, 0.78))",
              margin: "0 0 14px 0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.description}
          </p>
        )}

        {/* Highlights: Duration & Policy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: "0.8rem",
            color: "var(--muted)",
            marginTop: "auto",
            paddingTop: 12,
            borderTop: "1px solid var(--line, rgba(151, 211, 255, 0.15))",
            marginBottom: 16,
          }}
        >
          {product.durationLabel && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>⏱</span>
              <span>{product.durationLabel} flight &amp; experience</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#86efac" }}>
            <span>✓</span>
            <span>{product.cancellationPolicy}</span>
          </div>
        </div>

        {/* Price & Booking Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--muted)" }}>
              {product.isLive ? "From" : "Ref. Rate"}
            </div>
            <div
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--accent-strong, #ffd596)",
              }}
            >
              {product.priceLabel || `$${product.priceFrom || 399}`}
            </div>
          </div>

          <a
            href={finalBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Check availability for ${product.title} on Viator`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: "var(--radius-md, 18px)",
              background: "linear-gradient(135deg, var(--accent, #f0b35b), #df9b3a)",
              color: "#082134",
              fontWeight: 800,
              fontSize: "0.85rem",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(240, 179, 91, 0.25)",
              transition: "transform 0.15s ease",
            }}
          >
            <span>
              {selectedDate ? `Check ${selectedDate.slice(5)} (${passengerCount}p)` : "Check Live Dates"}
            </span>
            <span>&rarr;</span>
          </a>
        </div>
      </div>
    </article>
  );
}
