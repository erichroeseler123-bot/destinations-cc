"use client";

import React, { useState } from "react";
import { TourCard } from "@/app/components/ViatorFeaturedTours";
import type { ViatorJuneauProduct } from "@/lib/viator/types";

const mockLoadedProduct: ViatorJuneauProduct = {
  id: "P-LOADED-01",
  productCode: "TEMSCO-GLACIER-WALK",
  title: "Mendenhall Glacier & Guided Walk",
  description:
    "Fly over the Juneau Icefield and touch down on Mendenhall Glacier for a guided walking exploration.",
  durationMinutes: 135,
  durationLabel: "2 hr 15 min",
  priceLabel: "$449 / person base (as of Nov 18, 2026)",
  priceFrom: 449,
  priceDisclaimer:
    "$449/person base (ages 2+), as of November 18, 2026; +$150 at 250+ lbs clothed + CBJ sales tax & fees.",
  currency: "USD",
  imageUrl: "/images/tours/temsco-mendenhall-glacier-walk.jpg",
  imageAlt: "TEMSCO Mendenhall Glacier helicopter landing in Juneau, Alaska",
  imageSource: "LOCAL_AUTHORITY",
  supplierName: "TEMSCO Helicopters",
  rating: null,
  reviewCount: null,
  badges: ["Verified Tariff (Nov 18, 2026)"],
  cancellationPolicy: "100% direct refund 48h+ prior; 100% weather refund",
  bookHref:
    "https://www.viator.com/searchResults/all?text=Juneau+Mendenhall+Glacier+helicopter+tour&pid=P00058396&mcid=42383&medium=api",
  tourType: "glacier_landing",
  isLive: false,
  dataTimestamp: "2026-11-18T12:00:00Z",
};

const mockMissingPhotoProduct: ViatorJuneauProduct = {
  id: "P-MISSING-02",
  productCode: "6251SHOREXICEWALK",
  title: "Coastal Helicopters Icefield Excursion & Herbert Glacier Landing",
  description:
    "Panoramic aerial flight across towering granite peaks and guided walk on Herbert Glacier.",
  durationMinutes: 155,
  durationLabel: "2 hr 35 min",
  priceLabel: "$459 Standard (as of Nov 18, 2026)",
  priceFrom: 459,
  priceDisclaimer:
    "$459 Standard (1–259 lbs), $609 (260–299 lbs), $918 (300+ lbs, 2 seats), as of November 18, 2026 + CBJ sales tax & fees.",
  currency: "USD",
  imageUrl: null,
  imageAlt: "Coastal Helicopters Icefield Excursion",
  imageSource: "LOCAL_AUTHORITY",
  supplierName: "Coastal Helicopters",
  rating: null,
  reviewCount: null,
  badges: ["Worry-Free Shore Excursion (§20)"],
  cancellationPolicy: "24h cancel on Viator (7+ days direct); 100% weather refund",
  bookHref:
    "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api",
  tourType: "glacier_landing",
  isLive: false,
  dataTimestamp: "2026-11-18T12:00:00Z",
};

const mockFailedPhotoProduct: ViatorJuneauProduct = {
  id: "P-FAILED-03",
  productCode: "NORTHSTAR-TREK",
  title: "NorthStar Helicopter Glacier Trek (2 Hours on Ice)",
  description:
    "Helicopter transport directly to Mendenhall Glacier terrain equipped with mountaineering boots and crampons.",
  durationMinutes: 255,
  durationLabel: "4 hr 15 min",
  priceLabel: "$599 / person base (as of Nov 18, 2026)",
  priceFrom: 599,
  priceDisclaimer:
    "$599/person base (ages 12+), as of November 18, 2026; +$250 at 250+ lbs clothed + CBJ sales tax & fees.",
  currency: "USD",
  imageUrl: "/images/nonexistent-fallback-probe.jpg",
  imageAlt: "NorthStar Trekking glacier trek",
  imageSource: "LOCAL_AUTHORITY",
  supplierName: "NorthStar Trekking",
  rating: null,
  reviewCount: null,
  badges: ["Ages 12+ Technical Trek"],
  cancellationPolicy: "Direct >24h refund minus 10% admin fee; full weather refund",
  bookHref:
    "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Trek+helicopter&pid=P00058396&mcid=42383&medium=api",
  tourType: "ice_trek",
  isLive: false,
  dataTimestamp: "2026-11-18T12:00:00Z",
};

export default function PreviewCardsPage() {
  const [modalProduct, setModalProduct] = useState<string | null>(null);

  return (
    <main
      id="main-content"
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
            TourCard Visual Verification Harness (Verified Nov 18, 2026)
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "1rem" }}>
            Visual test harness for <code>TourCard</code> image fallback states (loaded local asset,{" "}
            <code>null</code> image, and 404 <code>onError</code> fallback).
          </p>
        </header>

        <div
          id="verification-cards-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "28px",
          }}
        >
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
