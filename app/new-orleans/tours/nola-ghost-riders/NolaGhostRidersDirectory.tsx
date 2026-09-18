"use client";

import React, { useState } from "react";
import Image from "next/image";

export interface GhostRiderTour {
  code: string;
  title: string;
  tagline: string;
  badge: string;
  categories: string[];
  isFeatured: boolean;
  startingPrice: number;
  rating: number;
  reviewCount: number;
  duration: string;
  format: string;
  departure: string;
  byob: boolean;
  cancellationText: string;
  cancellationType: "standard_24h" | "varies";
  image: string;
  editorialSummary: string;
  highlights: string[];
  viatorUrl: string;
}

const FEATURED_GHOSTRIDERS_TOURS: GhostRiderTour[] = [
  {
    code: "64332P4",
    title: "Cemetery and Ghost BYOB Bus Tour in New Orleans",
    tagline: "New Orleans' signature nighttime ghost bus tour with historic cemetery stops",
    badge: "Most Popular • 2,800+ Reviews",
    categories: ["featured", "ghost", "cemetery", "nighttime"],
    isFeatured: true,
    startingPrice: 30,
    rating: 4.49,
    reviewCount: 2836,
    duration: "2 Hours",
    format: "Climate-Controlled Bus • BYOB",
    departure: "French Quarter (1300 Decatur St)",
    byob: true,
    cancellationText: "Free cancellation up to 24 hours before departure",
    cancellationType: "standard_24h",
    image: "/images/wikimedia/originals/french-quarter-night.jpg",
    editorialSummary:
      "The undisputed flagship of New Orleans nighttime bus tours. Glide beyond the French Quarter into atmospheric cemeteries in an air-conditioned coach while master storytellers narrate yellow fever epidemics, unsolved crimes, and supernatural legends. Guests are welcome to bring their own adult beverages in non-glass containers.",
    highlights: [
      "Guided night walk through illuminated above-ground cemetery vaults",
      "BYOB permitted on board (cans and plastic cups welcome, no glass)",
      "Air-conditioned mini-coach avoids long humid walking stretches",
      "Visits iconic haunted sites across Mid-City and French Quarter borders"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/Night-Cemetery-and-Ghost-BYOB-Bus-Tour-in-New-Orleans/d675-64332P4?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-byob-bus&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders-byob-bus"
  },
  {
    code: "64332P13",
    title: "Destrehan Plantation Haunted Night Tour",
    tagline: "Exclusive after-dark lantern tour of Louisiana's oldest documented plantation home",
    badge: "Rare Night Access • Historic Estate",
    categories: ["featured", "ghost", "nighttime"],
    isFeatured: true,
    startingPrice: 69,
    rating: 4.62,
    reviewCount: 130,
    duration: "3 Hours (incl. transit)",
    format: "Estate Tour with Roundtrip Transport",
    departure: "Downtown & French Quarter Hotel Pickups",
    byob: false,
    cancellationText: "Free cancellation up to 24 hours before departure",
    cancellationType: "standard_24h",
    image: "/images/wikimedia/originals/oak-alley-front.jpg",
    editorialSummary:
      "A rare opportunity to explore an authentic 1787 River Road estate in the pitch dark. Unlike standard daytime plantation tours, this evening experience illuminates Destrehan's ancient live oaks, 1811 slave tribunal history, and verified supernatural occurrences by candlelight and lantern glow.",
    highlights: [
      "Roundtrip transport from New Orleans included in ticket",
      "Exclusive access inside the historic plantation manor after gates close to the public",
      "Haunting accounts of yellow fever quarantine victims and local folklore",
      "Small-group guided pacing across 200-year-old estate grounds"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/Destrehan-Plantation-Haunted-Night-Tour/d675-64332P13?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-destrehan-night&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders-destrehan-night"
  },
  {
    code: "64332P7",
    title: "New Orleans Cemetery and Paranormal Investigation Bus Tour",
    tagline: "Active ghost-hunting expedition equipped with real EMF meters and detection tools",
    badge: "Paranormal Gear Provided",
    categories: ["featured", "ghost", "cemetery", "nighttime"],
    isFeatured: true,
    startingPrice: 35,
    rating: 4.15,
    reviewCount: 99,
    duration: "2 Hours",
    format: "Interactive Bus Tour + Tool Scan",
    departure: "French Quarter Meeting Hub",
    byob: true,
    cancellationText: "Free cancellation up to 24 hours before departure",
    cancellationType: "standard_24h",
    image: "/images/wikimedia/originals/above-ground-tomb.jpg",
    editorialSummary:
      "Designed for travelers who want active ghost hunting rather than passive storytelling. After boarding the GhostRiders bus, every guest receives professional paranormal investigation gear—including EMF electromagnetic detectors and temperature sensors—to test energy spikes at documented burial sites.",
    highlights: [
      "Handheld EMF meters and spirit detection equipment provided for all participants",
      "Step-off cemetery stops to conduct live paranormal readings",
      "Combines scientific investigative methodology with New Orleans lore",
      "BYOB permitted on board between investigation stops"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/Night-Cemetery-and-Ghost-Hunt-Bus-Tour-Paranormal-Investigation/d675-64332P7?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-paranormal-hunt&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders-paranormal-hunt"
  },
  {
    code: "64332P3",
    title: "Haunted Drunken History Tour from New Orleans",
    tagline: "The highest-rated French Quarter walking pub crawl pairing dark lore with historic bars",
    badge: "Top Rated • 4.8★ Traveler Favorite",
    categories: ["featured", "walking", "nighttime", "ghost"],
    isFeatured: true,
    startingPrice: 24,
    rating: 4.81,
    reviewCount: 151,
    duration: "2 Hours",
    format: "Walking Pub Crawl (21+)",
    departure: "Heart of the French Quarter",
    byob: false,
    cancellationText: "Free cancellation up to 24 hours before departure",
    cancellationType: "standard_24h",
    image: "/images/wikimedia/originals/french-quarter-night.jpg",
    editorialSummary:
      "Boasting a stellar 4.81 rating, this spirited evening walk pairs New Orleans' grim history of duels, pirate betrayals, and infamous bordellos with drink stops at storied French Quarter watering holes. Guests can carry their beverages between stops thanks to New Orleans' open-container laws.",
    highlights: [
      "Stops at 3 to 4 historic taverns and courtyards with ghost reputations",
      "Focuses on scandalous true crime, eccentric historical figures, and occult legends",
      "Drink-in-hand pedestrian pace through the gaslit Vieux Carré",
      "Led by charismatic, licensed local guides with deep historical knowledge"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/Drunken-History-Tour-in-New-Orleans/d675-64332P3?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-drunken-history&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders-drunken-history"
  },
  {
    code: "64332P1",
    title: "Haunted Ghost and Paranormal Tour in New Orleans",
    tagline: "Classic walking exploration of French Quarter murders, hauntings, and voodoo lore",
    badge: "Best Value Ghost Walk",
    categories: ["featured", "ghost", "walking"],
    isFeatured: true,
    startingPrice: 15,
    rating: 4.47,
    reviewCount: 100,
    duration: "1.5 - 2 Hours",
    format: "Guided Walking Tour",
    departure: "Jackson Square Vicinity",
    byob: false,
    cancellationText: "Free cancellation up to 24 hours before departure",
    cancellationType: "standard_24h",
    image: "/images/wikimedia/originals/lalaurie-mansion-1906.jpg",
    editorialSummary:
      "An exceptional value for visitors wanting an authentic, comprehensive French Quarter ghost walk. You'll pause outside the Lalaurie Mansion of American Horror Story fame, hear about the Sultan's Palace massacre, and discover the supernatural heritage woven into New Orleans' oldest residential streets.",
    highlights: [
      "Unflinching historical breakdown of Madame Delphine Lalaurie and the Royal Street mansion",
      "Visits haunted hotels, convent grounds, and private Vieux Carré courtyards",
      "Family-friendly timing with age-appropriate historical framing",
      "Easy, flat walking pace covering roughly 1 mile of paved sidewalks"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/Haunted-Ghost-and-Paranormal-Tour-in-New-Orleans/d675-64332P1?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-french-quarter-walk&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders-french-quarter-walk"
  },
  {
    code: "64332P10",
    title: "New Orleans Haunted Ghost Tour: Explore The Paranormal",
    tagline: "A fast-paced twilight walk uncovering restless souls and urban legends",
    badge: "Twilight Walk • All Ages",
    categories: ["featured", "ghost", "walking"],
    isFeatured: true,
    startingPrice: 15,
    rating: 4.32,
    reviewCount: 28,
    duration: "1.5 Hours",
    format: "Walking Tour",
    departure: "French Quarter Hub",
    byob: false,
    cancellationText: "Free cancellation up to 24 hours before departure",
    cancellationType: "standard_24h",
    image: "/images/wikimedia/originals/lalaurie-mansion-1906.jpg",
    editorialSummary:
      "A punchy, atmospheric early-evening ghost walk designed for travelers who want supernatural storytelling without staying out past midnight. Features vetted historical archives and chilling firsthand accounts from hotel staff, cemetery caretakers, and neighborhood residents.",
    highlights: [
      "Ideal start time for dinner and evening theater plans",
      "Vampire legends, Voodoo folklore, and unexplained ghost sightings",
      "Interactive Q&A with enthusiastic local ghost historians",
      "Starts and finishes conveniently within the French Quarter core"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/Haunted-Ghost-Tour-Explore-The-Paranormal/d675-64332P10?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-explore-paranormal&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders-explore-paranormal"
  },
  {
    code: "64332P11",
    title: "Night Cemetery Insiders Bus Tour in New Orleans",
    tagline: "Focused study of above-ground crypts, mourning customs, and tomb architecture",
    badge: "Cemetery Deep-Dive • Mini-Coach",
    categories: ["featured", "cemetery", "nighttime"],
    isFeatured: true,
    startingPrice: 30,
    rating: 4.23,
    reviewCount: 22,
    duration: "2 Hours",
    format: "Mini-Coach Tour with Guided Strolls",
    departure: "Downtown / French Quarter Meeting Spot",
    byob: true,
    cancellationText: "Free cancellation up to 24 hours before departure",
    cancellationType: "standard_24h",
    image: "/images/wikimedia/originals/st-louis-cemetery-1-gates.jpg",
    editorialSummary:
      "While other tours emphasize theatrical spooks, the Cemetery Insiders tour focuses on the extraordinary architectural and cultural history of New Orleans' burial rituals. Discover why bodies are interred in above-ground ovens, the impact of the high water table, and how epidemic crises shaped New Orleans society.",
    highlights: [
      "In-depth analysis of Catholic, Protestant, and philanthropic society tombs",
      "Explains vault decomposition science, 1-year-and-a-day laws, and tomb reopening rituals",
      "Comfortable transit between multiple cemetery districts across Orleans Parish",
      "BYOB allowed on board the mini-coach"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/Cemetery-Insiders-Tour-With-Transportation/d675-64332P11?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-cemetery-insiders&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders-cemetery-insiders"
  }
];

const ADDITIONAL_GHOSTRIDERS_TOURS: GhostRiderTour[] = [
  {
    code: "64332P19",
    title: "Destrehan Plantation 1811 Slave Revolt Tour with Transportation",
    tagline: "Vital historical day tour examining the largest uprising of enslaved people in U.S. history",
    badge: "Specialty • Historic Heritage Tour",
    categories: ["history", "plantation"],
    isFeatured: false,
    startingPrice: 69,
    rating: 5.0,
    reviewCount: 0,
    duration: "4 Hours",
    format: "Daytime Guided Estate Excursion",
    departure: "Roundtrip New Orleans Transportation",
    byob: false,
    cancellationText: "Cancellation policy varies by experience (confirm during checkout)",
    cancellationType: "varies",
    image: "/images/wikimedia/originals/oak-alley-front.jpg",
    editorialSummary:
      "A profound, necessary journey into American civil rights and resistance history. Destrehan Plantation was the focal point of the 1811 German Coast Uprising. This tour uncovers original trial documentation, preserved slave quarters, and the courageous leadership of Charles Deslondes.",
    highlights: [
      "Dedicated focus on the 1811 German Coast slave revolt and its lasting aftermath",
      "Roundtrip executive coach transportation from downtown New Orleans",
      "Access to original Rost Home artifacts and authentic legacy exhibits",
      "Guided by knowledgeable docents dedicated to rigorous historical accuracy"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/The-1811-Slave-Revolt-at-Destrehan-Plantation/d675-64332P19?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-1811-revolt&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders-1811-revolt"
  },
  {
    code: "64332P6",
    title: "Paranormal Investigation Haunted Plantation With NOLACHILLS",
    tagline: "Late-night lockdown investigation at a historic plantation with professional ghost hunters",
    badge: "Specialty • Late-Night Lockdown",
    categories: ["ghost", "nighttime", "paranormal"],
    isFeatured: false,
    startingPrice: 99,
    rating: 5.0,
    reviewCount: 0,
    duration: "3.5 Hours",
    format: "Small-Group Deep Investigation",
    departure: "Transportation Included",
    byob: false,
    cancellationText: "Cancellation policy varies by experience (confirm during checkout)",
    cancellationType: "varies",
    image: "/images/wikimedia/originals/above-ground-tomb.jpg",
    editorialSummary:
      "For true paranormal enthusiasts. Join the veteran ghost investigators of NOLACHILLS for an after-hours lockdown investigation on private plantation grounds. Armed with audio recorders, infrared cameras, thermal sensors, and spirit boxes, you'll conduct multi-hour vigil sessions.",
    highlights: [
      "Extremely limited group sizes for maximum audio isolation and data integrity",
      "Hands-on access to professional-grade paranormal equipment",
      "Late-night hours when the historic grounds are entirely silent",
      "Includes debrief analysis of digital recordings and thermal anomalies"
    ],
    viatorUrl:
      "https://www.viator.com/tours/New-Orleans/BROTHEL-and-BORDELLO-SCANDALS-TOUR/d675-64332P6?pid=P00306962&mcid=42383&medium=link&campaign=wno-ghostriders-nolachills-lockdown&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-ghostriders-nolachills-lockdown"
  }
];

const ALL_TOURS = [...FEATURED_GHOSTRIDERS_TOURS, ...ADDITIONAL_GHOSTRIDERS_TOURS];

export default function NolaGhostRidersDirectory() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const displayedTours = ALL_TOURS.filter((tour) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "featured") return tour.isFeatured;
    return tour.categories.includes(selectedFilter);
  });

  const filterTabs = [
    { id: "all", label: "All Experiences", count: 9 },
    { id: "featured", label: "Featured Tours", count: 7 },
    { id: "nighttime", label: "Night Bus & BYOB", count: 4 },
    { id: "cemetery", label: "Cemetery Tours", count: 3 },
    { id: "ghost", label: "Ghost & Paranormal", count: 6 },
    { id: "walking", label: "Walking & Pub Crawls", count: 2 },
  ];

  return (
    <div className="w-full">
      {/* Category Filter Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#d4af37]/25 pb-4">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              data-ghost-filter
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
          Showing <span className="text-[#d4af37] font-bold">{displayedTours.length}</span> {selectedFilter === "all" ? "verified" : selectedFilter === "featured" ? "featured" : "matching"} experiences
        </p>
      </div>

      {/* Tour Cards Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {displayedTours.map((tour) => (
          <article
            key={tour.code}
            data-testid="ghost-tour-card"
            data-tour-code={tour.code}
            className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#d4af37]/35 bg-[#121016] shadow-[0_8px_28px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#d4af37] hover:shadow-[0_12px_36px_rgba(212,175,55,0.25)]"
          >
            <div>
              {/* Card Image Header */}
              <div className="relative h-52 w-full overflow-hidden bg-black/60">
                <Image
                  src={tour.image}
                  alt={tour.title}
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

                {tour.byob && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 rounded bg-[#3b185f]/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200 border border-purple-400/40 backdrop-blur-sm">
                      🍺 BYOB Friendly
                    </span>
                  </div>
                )}

                {/* Rating & Reviews on Image */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded bg-black/80 px-2.5 py-1 text-xs backdrop-blur-sm">
                  <span className="text-[#d4af37] font-bold">★ {tour.rating > 0 ? tour.rating.toFixed(2) : "5.0"}</span>
                  <span className="text-white/80">
                    ({tour.reviewCount > 0 ? `${tour.reviewCount.toLocaleString()} reviews` : "Verified Operator"})
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div data-ghost-card-body className="p-6 bg-[#121016]">
                <h3
                  className="font-serif text-xl font-bold leading-snug text-[#fdfbf7] hover:text-[#d4af37] transition-colors"
                  style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
                >
                  <a
                    href={tour.viatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
                  >
                    {tour.title}
                  </a>
                </h3>

                {/* Logistics Badges */}
                <div data-ghost-logistics className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-white/80">
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 border border-white/15">
                    ⏱ {tour.duration}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 border border-white/15">
                    🚌 {tour.format}
                  </span>
                </div>

                {/* WNO Editorial Description */}
                <p
                  className="mt-4 text-sm leading-relaxed text-[#fdfbf7]/85"
                  style={{ color: 'rgba(253, 251, 247, 0.85)', WebkitTextFillColor: 'rgba(253, 251, 247, 0.85)' }}
                >
                  {tour.editorialSummary}
                </p>

                {/* Inclusions / Highlights */}
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">Tour Highlights</p>
                  <ul data-ghost-highlights className="mt-2 space-y-2 text-xs">
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
            <div data-ghost-card-footer className="border-t border-[#d4af37]/25 bg-[#0b0a0e] p-6">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Verified Rate</span>
                  <p
                    className="text-2xl font-serif font-bold text-[#fdfbf7]"
                    style={{ color: '#fdfbf7', WebkitTextFillColor: '#fdfbf7' }}
                  >
                    From ${tour.startingPrice} <span className="text-xs font-sans font-normal text-white/70">per person</span>
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

      {/* Two-Layer Notice if in Featured Mode */}
      {selectedFilter === "featured" && (
        <div className="mt-12 rounded-lg border border-white/10 bg-[#14121a] p-6 text-center">
          <p className="font-serif text-lg font-bold text-[#fdfbf7]">
            Looking for specialty daytime heritage or late-night deep lockdowns?
          </p>
          <p className="mt-1 text-xs text-white/65">
            We also track NOLA GhostRiders&apos; 1811 Slave Revolt historical tour and the NOLACHILLS late-night plantation investigation.
          </p>
          <button
            onClick={() => setSelectedFilter("all")}
            className="mt-4 inline-flex items-center gap-2 rounded border border-[#d4af37]/60 bg-[#d4af37]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#d4af37] hover:bg-[#d4af37]/20 transition-colors"
          >
            <span>View All 9 GhostRiders Experiences</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Starting Price & Live Availability Disclaimer */}
      <div className="mt-8 border-t border-white/10 pt-4 text-center">
        <p className="text-[11px] text-white/50 max-w-2xl mx-auto leading-relaxed">
          *Starting prices shown reflect standard adult general admission from verified provider data. Final pricing, add-ons, youth rates, and live time slot availability vary by date and group size, and are confirmed directly when selecting dates on Viator.
        </p>
      </div>
    </div>
  );
}
