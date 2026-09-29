"use client";

import React, { useState } from "react";
import Image from "next/image";
import { trackEvent } from "@/lib/analytics";

export interface AirboatTour {
  code: string;
  title: string;
  tagline: string;
  badge: string;
  categories: string[];
  isFeatured: boolean;
  startingPrice: number;
  priceUnit: string;
  rating: number;
  reviewCount: number;
  duration: string;
  vesselType: string;
  capacity: string;
  departure: string;
  transportation: string;
  cancellationText: string;
  cancellationType: "standard_24h" | "varies";
  image: string;
  editorialSummary: string;
  highlights: string[];
  viatorUrl: string;
}

const FEATURED_AIRBOAT_TOURS: AirboatTour[] = [
  {
    code: "6455NOLAAIR",
    title: "New Orleans Airboat Ride (Large Airboat)",
    tagline: "High-speed wetland glide across Barataria Basin bayous in a custom 15–30 passenger airboat",
    badge: "Most Popular • 5,200+ Reviews",
    categories: ["featured", "large", "transportation"],
    isFeatured: true,
    startingPrice: 59,
    priceUnit: "per person",
    rating: 4.71,
    reviewCount: 5210,
    duration: "1 Hour 45 Mins – 2 Hours on water (~4h with transport)",
    vesselType: "Large High-Powered Airboat",
    capacity: "15 to 30 Passengers",
    departure: "5145 Fleming Park Rd, Lafitte, LA or Hotel Pickup",
    transportation: "Optional Roundtrip Hotel Pickup Available",
    cancellationText: "Free cancellation up to 24 hours before departure",
    cancellationType: "standard_24h",
    image: "/images/wno/airboat-swamp-tour.webp",
    editorialSummary:
      "The quintessential high-speed Louisiana swamp experience. Powered by roaring Chevy 454 or 502 aircraft-propeller engines, this vessel glides over shallow marsh waters, lily pads, and mud flats where traditional outboard boats cannot venture. Led by seasoned local Cajun captains through the protected Barataria Basin.",
    highlights: [
      "Glides at speeds up to 35+ mph across open bays and narrow bayous",
      "Up-close encounters with native American alligators, egrets, and nutria",
      "Hearing protection headsets provided for all riders during high-speed runs",
      "Available as drive-out with free parking or with French Quarter hotel pickup"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Airboat-Ride/d675-6455NOLAAIR?pid=P00306962&mcid=42383&medium=link&campaign=wno-airboat-adventures-large&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-airboat-adventures"
  },
  {
    code: "6455P7",
    title: "Premium Small-Group Airboat Adventure (6–10 Passengers)",
    tagline: "High-agility, intimate airboat expedition reaching secluded, ultra-shallow bayou channels",
    badge: "Top Rated • 4.9★ Small Group",
    categories: ["featured", "small", "transportation"],
    isFeatured: true,
    startingPrice: 89,
    priceUnit: "per person",
    rating: 4.93,
    reviewCount: 30,
    duration: "1 Hour 45 Mins – 2 Hours on water (~4h with transport)",
    vesselType: "Custom Small Airboat",
    capacity: "6 to 10 Passengers",
    departure: "Lafitte, LA Dock or Downtown / FQ Hotel Pickup",
    transportation: "Roundtrip French Quarter / Downtown Hotel Pickup Available",
    cancellationText: "Free cancellation up to 24 hours before departure",
    cancellationType: "standard_24h",
    image: "/images/travel-markets/new-orleans/airboat-swamp.png",
    editorialSummary:
      "For travelers seeking the most thrilling and personal swamp encounter. Smaller hulls allow sharper turns, faster acceleration, and access to narrow cypress trails where larger boats cannot fit. With only 6 to 10 passengers on board, every guest gets direct interaction with the captain and prime 360-degree photography angles.",
    highlights: [
      "Accesses narrow bayou cuts and secluded alligator resting areas",
      "Small group size ensures unobstructed wildlife photography lines",
      "High maneuverability and exhilarating acceleration across tidal flats",
      "Includes noise-canceling hearing protection and captain commentary"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/Premium-New-Orleans-Airboat-Adventure/d675-6455P7?pid=P00306962&mcid=42383&medium=link&campaign=wno-airboat-adventures-premium&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-airboat-adventures"
  },
  {
    code: "6455P6",
    title: "Private New Orleans Airboat Adventure",
    tagline: "Exclusive private airboat charter and dedicated captain customized for your party",
    badge: "Private Charter • Custom Pacing",
    categories: ["featured", "private"],
    isFeatured: true,
    startingPrice: 450,
    priceUnit: "total per boat",
    rating: 4.2,
    reviewCount: 5,
    duration: "1 Hour 45 Mins – 2 Hours on water",
    vesselType: "Private Airboat Charter",
    capacity: "Private Party (Up to Boat Capacity)",
    departure: "5145 Fleming Park Rd, Lafitte, LA",
    transportation: "Self-Drive (Private Transport Inquire Upon Request)",
    cancellationText: "Free cancellation up to 24 hours before departure",
    cancellationType: "standard_24h",
    image: "/images/travel-markets/new-orleans/small-group-airboat.png",
    editorialSummary:
      "Reserve an entire high-speed airboat exclusively for your family, private travel party, or VIP group. Tailor the cruising speed, focus on serious wildlife photography, or linger at alligator habitats with undivided attention from a Coast Guard-certified Cajun captain. Includes private dock check-in and hearing protection for all riders.",
    highlights: [
      "Entire airboat reserved solely for your private travel group",
      "Customizable pacing for photography, wildlife study, or family speed preferences",
      "Dedicated Coast Guard-certified Cajun captain with personalized commentary",
      "Operates out of Lafitte private dock facilities with on-site amenities"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/Private-New-Orleans-Airboat-Adventure/d675-6455P6?pid=P00306962&mcid=42383&medium=link&campaign=wno-airboat-adventures-private&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-airboat-adventures"
  }
];

export default function AirboatAdventuresDirectory() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const displayedTours = FEATURED_AIRBOAT_TOURS.filter((tour) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "featured") return tour.isFeatured;
    return tour.categories.includes(selectedFilter);
  });

  const filterTabs = [
    { id: "all", label: "All Experiences", count: 3 },
    { id: "large", label: "Large Airboat (15–30)", count: 1 },
    { id: "small", label: "Small Airboat (6–10)", count: 1 },
    { id: "transportation", label: "With Hotel Pickup", count: 2 },
    { id: "private", label: "Private Charters", count: 1 },
  ];

  const handleBookingClick = (tour: AirboatTour) => {
    trackEvent("booking_cta_clicked", {
      operator: "Airboat Adventures",
      productCode: tour.code,
      title: tour.title,
      surface: "wno-airboat-directory",
      medium: "affiliate",
    });
    trackEvent("viator_outbound_clicked", {
      surface: "wno-airboat-directory",
      supplier: "Airboat Adventures",
      productCode: tour.code,
      url: tour.viatorUrl,
    });
  };

  return (
    <div className="w-full">
      {/* Category Filter Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#d4af37]/25 pb-4">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              data-airboat-filter
              data-active={selectedFilter === tab.id ? "true" : "false"}
              onClick={() => setSelectedFilter(tab.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                selectedFilter === tab.id
                  ? "bg-[#d4af37] text-[#080708] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  : "bg-[#16141a] text-[#fdfbf7]/80 hover:bg-[#201d26] hover:text-[#d4af37] border border-white/10"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <p className="text-xs font-medium text-white/60">
          Showing <span className="text-[#d4af37] font-bold">{displayedTours.length}</span> verified Airboat Adventures options
        </p>
      </div>

      {/* Tour Cards Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {displayedTours.map((tour) => (
          <article
            key={tour.code}
            data-testid="airboat-tour-card"
            data-tour-code={tour.code}
            className="flex flex-col h-full justify-between overflow-hidden rounded-xl border border-[#d4af37]/35 bg-[#121016] shadow-[0_8px_28px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#d4af37] hover:shadow-[0_12px_36px_rgba(212,175,55,0.25)]"
            style={{ backgroundColor: '#121016', background: '#121016' }}
          >
            <div className="flex flex-1 flex-col bg-[#121016]">
              {/* Card Image Header */}
              <div className="relative h-52 w-full shrink-0 overflow-hidden bg-black/60">
                <Image
                  src={tour.image}
                  alt={`${tour.title} on Louisiana swamp water`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121016] via-transparent to-black/40" />

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3">
                  <span className="inline-block rounded bg-[#d4af37] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#080708] shadow-md">
                    {tour.badge}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 rounded bg-[#0f2d1e]/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200 border border-emerald-400/40 backdrop-blur-sm">
                    🐊 Wild Basin
                  </span>
                </div>

                {/* Rating & Reviews on Image */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded bg-black/80 px-2.5 py-1 text-xs backdrop-blur-sm">
                  <span className="text-[#d4af37] font-bold">★ {tour.rating > 0 ? tour.rating.toFixed(2) : "5.0"}</span>
                  <span className="text-white/80">
                    ({tour.reviewCount > 0 ? `${tour.reviewCount.toLocaleString()} reviews` : "Verified Operator"})
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div data-airboat-card-body className="flex flex-1 flex-col justify-between p-6 bg-[#121016]">
                <div>
                  <h3
                    className="font-serif text-xl font-bold leading-snug text-[#fdfbf7] hover:text-[#d4af37] transition-colors min-h-[3.25rem] flex items-center"
                    style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
                  >
                    <a
                      href={tour.viatorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleBookingClick(tour)}
                      style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
                    >
                      {tour.title}
                    </a>
                  </h3>

                  {/* Logistics Badges */}
                  <div data-airboat-logistics className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-white/80">
                    <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 border border-white/15">
                      ⏱ {tour.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 border border-white/15">
                      🚤 {tour.capacity}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 border border-white/15">
                      📍 Lafitte, LA
                    </span>
                  </div>

                  {/* WNO Editorial Description */}
                  <p
                    className="mt-4 text-sm leading-relaxed text-[#fdfbf7]/85"
                    style={{ color: 'rgba(253, 251, 247, 0.85)', WebkitTextFillColor: 'rgba(253, 251, 247, 0.85)' }}
                  >
                    {tour.editorialSummary}
                  </p>
                </div>

                {/* Highlights */}
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Tour Highlights</p>
                  <ul data-airboat-highlights className="mt-2 space-y-2 text-xs">
                    {tour.highlights.slice(0, 3).map((hl, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="text-[#d4af37] font-bold shrink-0 mt-0.5">✔</span>
                        <span
                          className="text-[#fdfbf7] leading-relaxed"
                          style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
                        >
                          {hl}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Card Footer: Pricing & Booking CTA */}
            <div data-airboat-card-footer className="border-t border-[#d4af37]/25 bg-[#0b0a0e] p-6 shrink-0">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Starting Rate</span>
                  <p
                    className="text-2xl font-serif font-bold text-[#fdfbf7]"
                    style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
                  >
                    From ${tour.startingPrice} <span className="text-xs font-sans font-normal text-white/70">{tour.priceUnit}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] font-semibold ${tour.cancellationType === "standard_24h" ? "text-emerald-400" : "text-amber-300"}`}>
                    {tour.cancellationType === "standard_24h" ? "Free Cancellation" : "Policy Varies"}
                  </span>
                  <p className="text-[10px] text-white/60">
                    {tour.cancellationType === "standard_24h" ? "Up to 24h before" : "See checkout terms"}
                  </p>
                </div>
              </div>

              {/* Product-Level Cancellation Text */}
              <p className="mb-3 text-[11px] italic text-white/70">
                {tour.cancellationText}
              </p>

              <a
                href={tour.viatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleBookingClick(tour)}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b38f28] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#080708] shadow-[0_4px_14px_rgba(212,175,55,0.35)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_6px_20px_rgba(212,175,55,0.5)]"
              >
                <span>Check Dates & Book on Viator</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </a>

              <p className="mt-2 text-center text-[10px] text-white/50">
                Book securely on Viator • Live availability confirmed upon date selection
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Direct Operator Booking Notice & Pricing Disclaimer */}
      <div className="mt-8 rounded-lg border border-white/10 bg-[#121016] p-5 text-center">
        <p className="text-xs text-white/75 leading-relaxed">
          <strong className="text-white">Operator Transparency Notice:</strong> Airboat Adventures is based at 5145 Fleming Park Rd, Lafitte, LA 70067 and can also be reached directly at (504) 689-2005 or airboatadventures.com. Welcome to New Orleans Tours provides verified booking handoffs via Viator (Supplier ID: SUPPLIER-7eNlteakiwgCVdiaT3VQkg==) with instant digital confirmation, mobile boarding, and 24-hour free cancellation.
        </p>
        <p className="mt-2 text-[11px] text-white/50">
          *Starting rates reflect adult drive-out base pricing. Rates with roundtrip hotel transportation typically range from $89 to $119+ per person. Final rates and slot availability are confirmed upon date selection.
        </p>
      </div>
    </div>
  );
}
