"use client";

import React, { useState } from "react";
import { TourCard } from "@/app/components/ViatorFeaturedTours";
import type { ViatorJuneauProduct } from "@/lib/viator/types";

const mockLoadedProduct: ViatorJuneauProduct = {
  id: "P-LOADED-01",
  productCode: "TEMSCO-GLACIER-WALK",
  title: "Mendenhall Glacier Helicopter Tour & Guided Walk",
  description: "Fly over the Juneau Icefield and touch down on Mendenhall Glacier for a guided walking exploration.",
  durationMinutes: 135,
  durationLabel: "2 hr 15 min",
  priceLabel: "from $379",
  priceFrom: 379,
  currency: "USD",
  imageUrl: "https://cdn.filestackcontent.com/GyqI6elSXKklaQiP9ULd",
  imageAlt: "TEMSCO Mendenhall Glacier helicopter landing in Juneau, Alaska",
  imageSource: "SUPPLIER_PROVIDED",
  supplierName: "TEMSCO Helicopters",
  rating: 4.9,
  reviewCount: 412,
  badges: ["Official Viator Option", "Top Rated"],
  cancellationPolicy: "Free cancellation available up to 24 hours prior",
  bookHref: "https://www.viator.com/tours/Juneau/product/TEMSCO-GLACIER-WALK?pid=P00058396&mcid=42383&medium=api",
  tourType: "glacier_landing",
  isLive: true,
  dataTimestamp: "2026-10-05T18:00:00Z",
};

const mockMissingPhotoProduct: ViatorJuneauProduct = {
  id: "P-MISSING-02",
  productCode: "COASTAL-ICEFIELD-TOUR",
  title: "Juneau Icefield Helicopter Flightseeing Excursion",
  description: "Panoramic aerial flight across towering granite peaks and deep crevasses of the Juneau Icefield.",
  durationMinutes: 90,
  durationLabel: "1 hr 30 min",
  priceLabel: "from $345",
  priceFrom: 345,
  currency: "USD",
  imageUrl: null, // Explicit missing photo from API
  imageAlt: "Coastal Helicopters Icefield Excursion",
  imageSource: "SUPPLIER_PROVIDED",
  supplierName: "Coastal Helicopters",
  rating: 4.8,
  reviewCount: 198,
  badges: ["Official Viator Option"],
  cancellationPolicy: "Free cancellation available up to 24 hours prior",
  bookHref: "https://www.viator.com/tours/Juneau/product/COASTAL-ICEFIELD-TOUR?pid=P00058396&mcid=42383&medium=api",
  tourType: "flightseeing",
  isLive: true,
  dataTimestamp: "2026-10-05T18:00:00Z",
};

const mockFailedPhotoProduct: ViatorJuneauProduct = {
  id: "P-FAILED-03",
  productCode: "NORTHSTAR-TREK-CLIMB",
  title: "Mendenhall Glacier Ice Trek & Technical Climb",
  description: "Helicopter transport directly to remote glacier terrain equipped with crampons and ice axes.",
  durationMinutes: 240,
  durationLabel: "4 hr",
  priceLabel: "from $599",
  priceFrom: 599,
  currency: "USD",
  imageUrl: "https://cdn.filestackcontent.com/nonexistent_404_fail_probe.jpg", // Broken image URL to trigger onError
  imageAlt: "NorthStar Trekking glacier climb",
  imageSource: "SUPPLIER_PROVIDED",
  supplierName: "NorthStar Trekking",
  rating: 5.0,
  reviewCount: 88,
  badges: ["Official Viator Option", "Adventure Certified"],
  cancellationPolicy: "Free cancellation available up to 24 hours prior",
  bookHref: "https://www.viator.com/tours/Juneau/product/NORTHSTAR-TREK-CLIMB?pid=P00058396&mcid=42383&medium=api",
  tourType: "ice_trek",
  isLive: true,
  dataTimestamp: "2026-10-05T18:00:00Z",
};

export default function PreviewCardsPage() {
  const [modalProduct, setModalProduct] = useState<string | null>(null);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#030d17",
        color: "#ffffff",
        padding: "48px 24px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <header style={{ marginBottom: "36px", textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#97d3ff" }}>
            Viator TourCard Visual Verification Harness
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "1rem" }}>
            Direct browser rendering of deployed <code>TourCard</code> components under three image states:
            loaded API image, missing API image (<code>null</code>), and failed/404 image (<code>onError</code>).
          </p>
        </header>

        <div
          id="verification-cards-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
          }}
        >
          {/* Card 1: Loaded Photo */}
          <section id="card-state-loaded">
            <div style={{ padding: "8px 0", color: "#60a5fa", fontWeight: 700, fontSize: "0.85rem" }}>
              TEST 1: LOADED PRODUCT PHOTO (TEMSCO)
            </div>
            <TourCard
              product={mockLoadedProduct}
              selectedDate="2027-06-15"
              passengerCount={2}
              onOpenReviews={() => setModalProduct(mockLoadedProduct.title)}
            />
          </section>

          {/* Card 2: Missing Photo */}
          <section id="card-state-missing">
            <div style={{ padding: "8px 0", color: "#f0b35b", fontWeight: 700, fontSize: "0.85rem" }}>
              TEST 2: MISSING PHOTO (COASTAL · imageUrl: null)
            </div>
            <TourCard
              product={mockMissingPhotoProduct}
              selectedDate="2027-06-15"
              passengerCount={2}
              onOpenReviews={() => setModalProduct(mockMissingPhotoProduct.title)}
            />
          </section>

          {/* Card 3: Failed / Broken Photo */}
          <section id="card-state-failed">
            <div style={{ padding: "8px 0", color: "#f87171", fontWeight: 700, fontSize: "0.85rem" }}>
              TEST 3: FAILED PHOTO (NORTHSTAR · 404 onError)
            </div>
            <TourCard
              product={mockFailedPhotoProduct}
              selectedDate="2027-06-15"
              passengerCount={2}
              onOpenReviews={() => setModalProduct(mockFailedPhotoProduct.title)}
            />
          </section>
        </div>

        {modalProduct && (
          <div style={{ marginTop: "24px", color: "#38bdf8", textAlign: "center" }}>
            Reviews triggered for: {modalProduct}
          </div>
        )}
      </div>
    </main>
  );
}
