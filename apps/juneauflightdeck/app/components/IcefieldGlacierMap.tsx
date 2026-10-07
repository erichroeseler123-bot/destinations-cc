"use client";

import React, { useState } from "react";
import Link from "next/link";

interface GlacierPoint {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  geo: string;
  operators: string;
  pricing: string[];
  note: string;
  primaryActionText: string;
  primaryActionHref: string;
  isDirectLink?: boolean;
}

const GLACIER_DATA: Record<string, GlacierPoint> = {
  mendenhall: {
    id: "mendenhall",
    category: "Geographic Glacier Location",
    title: "Mendenhall Glacier",
    subtitle: "Outlet glacier terminating into Mendenhall Lake • Primary ice walk & trek area",
    badge: "Geographic Location",
    badgeColor: "#38bdf8",
    geo: "13-mile valley glacier flowing from the Juneau Icefield. Primary landing zone for guided walks and ice treks. Note: Pilots and guides evaluate ice conditions and cloud ceilings daily; landing locations can adjust to alternate icefield zones (such as Lemon Creek or Herbert Glacier) for safety.",
    operators: "TEMSCO Helicopters (guided walks) & NorthStar Trekking (glacier walkabouts and ice treks).",
    pricing: [
      "TEMSCO Guided Walk: From $409 published base rate",
      "NorthStar 1-Hour Walkabout: From $499 published base rate (Ages 8+)",
      "NorthStar Level 1 Ice Trek: From $549 published base rate (2 hrs on ice · Ages 12+)",
    ],
    note: "💡 Most treks land on Mendenhall, but landing locations adjust with weather and glacier conditions. Taxes and operator fees calculated at checkout.",
    primaryActionText: "Check Mendenhall Walk on Viator →",
    primaryActionHref: "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api",
  },
  herbert: {
    id: "herbert",
    category: "Geographic Glacier Location & Seasonal Camps",
    title: "Herbert Glacier",
    subtitle: "Valley glacier northwest of Juneau • Landings & seasonal dog mushing camps",
    badge: "Geographic Location",
    badgeColor: "#ef4444",
    geo: "Large valley glacier terminating in the Herbert River. High alpine snowfield plateau hosts seasonal dog mushing camps from mid-May through August. Camp locations are approximate and relocated seasonally.",
    operators: "Coastal Helicopters (glacier landings & dog sledding) & TEMSCO Helicopters (dog sledding).",
    pricing: [
      "Coastal Icefield Landing: From $429 published base rate",
      "TEMSCO Glacier Dog Sledding: From $659 published base rate",
      "Coastal Herbert Dog Sled Tour: From $709 published base rate",
    ],
    note: "💡 Dog sledding camps are seasonal (mid-May through late August) on upper snowfields. Camp locations are approximate and adjust with snow conditions.",
    primaryActionText: "Book Herbert Dog Sled (FH 214810) ↗",
    primaryActionHref: "https://fareharbor.com/embeds/book/temscoair-juneau/items/214810/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes",
    isDirectLink: true,
  },
  norris: {
    id: "norris",
    category: "Geographic Glacier Location & Seasonal Camp",
    title: "Norris Glacier",
    subtitle: "Southeast Juneau Icefield • Approximate Summer Dog Sled Camp",
    badge: "Approximate Camp",
    badgeColor: "#a855f7",
    geo: "Located northwest of Taku Inlet with sweeping snowfields and jagged granite nunatak peaks. Hosts NorthStar's partner musher camp (mid-May to August).",
    operators: "NorthStar Trekking (flights depart from NorthStar Douglas Island base).",
    pricing: [
      "NorthStar Helicopter Glacier Dogsled Adventure: From $739 published base rate (FareHarbor item 115991 · Ages 2+)",
    ],
    note: "💡 Mushing camp location on Norris Glacier is approximate and seasonal. Excursions depart from NorthStar's Douglas Island base.",
    primaryActionText: "Book NorthStar Dogsled (FH 115991) ↗",
    primaryActionHref: "https://fareharbor.com/embeds/book/northstartrekking/items/115991/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes",
    isDirectLink: true,
  },
  taku: {
    id: "taku",
    category: "Geographic Glacier Location & Excursions",
    title: "Taku Glacier & Taku River Basin",
    subtitle: "Thickest icefield glacier • Distinct helicopter/airboat and seaplane lodge excursions",
    badge: "Geographic Location",
    badgeColor: "#10b981",
    geo: "The only advancing glacier in the Juneau Icefield; terminates into Taku Inlet southeast of Juneau. Two distinct wilderness excursions operate here across different aviation modes.",
    operators: "NorthStar Trekking (Helicopter & Airboat tour departing from Douglas Island) and Wings Airways (classic floatplane tour to Taku Glacier Lodge from downtown waterfront).",
    pricing: [
      "NorthStar Taku Glacier Helicopter & Airboat Adventure: From $688 published base rate (departs NorthStar Douglas base)",
      "Wings Airways Taku Glacier Lodge Feast & Flight: From $385–$415 published fare (classic de Havilland seaplane from downtown waterfront)",
    ],
    note: "💡 Two distinct Taku tours: NorthStar operates a helicopter + airboat adventure from Douglas Island; Wings Airways operates the historic dining seaplane tour to Taku Glacier Lodge.",
    primaryActionText: "Compare Helicopter Tours →",
    primaryActionHref: "/temsco-vs-coastal-vs-northstar-juneau#effort-comparison",
  },
  airport: {
    id: "airport",
    category: "Aviation Base Locations",
    title: "Juneau International Airport (JNU) Bases",
    subtitle: "TEMSCO Base, Coastal Base & NorthStar Trekking Base",
    badge: "Airport Bases",
    badgeColor: "#0284c7",
    geo: "North airport aviation corridor (~9 miles northwest of downtown). TEMSCO base is at 1650 Maplesden Way. Coastal base is at 8995 Alex Holden Way. NorthStar operates its Trekking Base at 1890 Renshaw Way for glacier walkabouts and ice treks.",
    operators: "TEMSCO (all Juneau tours), Coastal (all tours), and NorthStar (glacier trekking and walkabouts only).",
    pricing: [
      "NorthStar Treks: Depart from Airport Base (1890 Renshaw Way)",
      "Coastal Tours: Depart from Alex Holden Way base",
      "TEMSCO Tours: Depart from Maplesden Way base",
    ],
    note: "💡 Direct-booking cruise passengers should follow operator-specific pickup instructions rather than expecting universal ship gangway pickup.",
    primaryActionText: "See Pickup & Meeting Details →",
    primaryActionHref: "#cruise-timing-pickup",
  },
  douglas: {
    id: "douglas",
    category: "Aviation Base Locations",
    title: "NorthStar Douglas Island Heliport",
    subtitle: "6910 North Douglas Highway • Dedicated Dogsledding & Airboat Base",
    badge: "Douglas Island Base",
    badgeColor: "#a855f7",
    geo: "Located on North Douglas Island across Gastineau Channel. NorthStar Trekking operates this dedicated second heliport facility specifically for Norris Glacier dog sledding tours and Taku Glacier helicopter/airboat adventures.",
    operators: "NorthStar Trekking (dog sledding and airboat adventures).",
    pricing: [
      "NorthStar Dog Sledding on Norris Glacier: From $739 published base rate",
      "NorthStar Taku Glacier Helicopter & Airboat: From $688 published base rate",
    ],
    note: "💡 NorthStar operates two separate bases: Airport base for ice treks; Douglas Island heliport for dog sledding and airboat adventures.",
    primaryActionText: "Compare Dog Sledding Tours →",
    primaryActionHref: "#dog-sledding-options",
  },
  docks: {
    id: "docks",
    category: "Cruise Passenger Logistics",
    title: "Downtown Meeting Hub & Cruise Berths",
    subtitle: "Goldbelt Tramway (Mt. Roberts Tram) & Central Waterfront Meeting Points",
    badge: "Meeting Points",
    badgeColor: "#f59e0b",
    geo: "Cruise ships berth at AJ Dock (1 mi south), Franklin Dock, Steamship Wharf (CT), or Marine Park. Direct-booking passengers do not receive universal gangway pickup; operators utilize designated downtown meeting points:",
    operators: "NorthStar & Coastal direct-booking guests meet at Goldbelt Tramway (490 S Franklin St). TEMSCO coordinates pickup at a central downtown meeting location specified on confirmation.",
    pricing: [
      "NorthStar: Direct cruise guests meet at Goldbelt Tramway (490 S Franklin St)",
      "Coastal: Direct cruise guests meet at Goldbelt Tramway (1 hr before flight)",
      "TEMSCO: Central downtown meeting point (arrive 15 min prior to tour departure)",
    ],
    note: "💡 Important: Check your booking confirmation for your exact downtown meeting point rather than waiting at the ship gangway.",
    primaryActionText: "Review Port Timing Guide →",
    primaryActionHref: "#cruise-timing-pickup",
  },
};

export default function IcefieldGlacierMap() {
  const [activePoint, setActivePoint] = useState<string>("mendenhall");
  const [filter, setFilter] = useState<"all" | "landing" | "dogsled" | "docks">("all");

  const point = GLACIER_DATA[activePoint] || GLACIER_DATA.mendenhall;

  return (
    <div
      style={{
        background: "var(--panel, #0f172a)",
        border: "1px solid var(--line, #334155)",
        borderRadius: "var(--radius-lg, 16px)",
        padding: "24px",
        marginBottom: "36px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          borderBottom: "1px solid var(--line, #334155)",
          paddingBottom: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "var(--accent, #f0b35b)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Geographic Reference • Juneau Icefield Map
          </span>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 900, color: "#ffffff", margin: "4px 0" }}>
            Where the Glaciers, Heliports &amp; Dog Camps Actually Are
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--muted, #94a3b8)", margin: 0 }}>
            Visual map of the 1,500 sq mi Juneau Icefield showing flight routes, landing sites, and cruise dock buffers.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setFilter("all")}
            style={{
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontWeight: 700,
              borderRadius: 6,
              border: "1px solid",
              borderColor: filter === "all" ? "#38bdf8" : "#334155",
              background: filter === "all" ? "rgba(56, 189, 248, 0.2)" : "rgba(15, 23, 42, 0.6)",
              color: filter === "all" ? "#38bdf8" : "#cbd5e1",
              cursor: "pointer",
            }}
          >
            Show All
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("landing");
              setActivePoint("mendenhall");
            }}
            style={{
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontWeight: 700,
              borderRadius: 6,
              border: "1px solid",
              borderColor: filter === "landing" ? "#38bdf8" : "#334155",
              background: filter === "landing" ? "rgba(56, 189, 248, 0.2)" : "rgba(15, 23, 42, 0.6)",
              color: filter === "landing" ? "#38bdf8" : "#cbd5e1",
              cursor: "pointer",
            }}
          >
            🧊 Glacier Landings
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("dogsled");
              setActivePoint("herbert");
            }}
            style={{
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontWeight: 700,
              borderRadius: 6,
              border: "1px solid",
              borderColor: filter === "dogsled" ? "#38bdf8" : "#334155",
              background: filter === "dogsled" ? "rgba(56, 189, 248, 0.2)" : "rgba(15, 23, 42, 0.6)",
              color: filter === "dogsled" ? "#38bdf8" : "#cbd5e1",
              cursor: "pointer",
            }}
          >
            🐕 Dog Sled Camps
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("docks");
              setActivePoint("docks");
            }}
            style={{
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontWeight: 700,
              borderRadius: 6,
              border: "1px solid",
              borderColor: filter === "docks" ? "#38bdf8" : "#334155",
              background: filter === "docks" ? "rgba(56, 189, 248, 0.2)" : "rgba(15, 23, 42, 0.6)",
              color: filter === "docks" ? "#38bdf8" : "#cbd5e1",
              cursor: "pointer",
            }}
          >
            🚢 Bases &amp; Meeting Points
          </button>
        </div>
      </div>

      {/* SVG Map Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 10",
          borderRadius: 12,
          overflow: "hidden",
          background: "linear-gradient(180deg, #061524 0%, #091f33 60%, #040e17 100%)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          marginBottom: 16,
        }}
      >
        <svg
          viewBox="0 0 1000 650"
          style={{ width: "100%", height: "100%", display: "block" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="icefieldGradMap" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="glacierFlowGradMap" x1="0%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
            </linearGradient>

            <linearGradient id="waterGradMap" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#082f49" />
              <stop offset="100%" stopColor="#031926" />
            </linearGradient>
          </defs>

          {/* Waterways */}
          <g opacity="0.9">
            {/* Lynn Canal / Favorite Channel (NW) */}
            <path d="M 0 0 L 220 0 L 160 320 L 80 440 L 0 500 Z" fill="url(#waterGradMap)" />
            {/* Gastineau Channel (separating Douglas Island from Mainland Juneau) */}
            <path d="M 120 450 Q 240 480 340 520 L 390 560 L 460 650 L 380 650 L 280 570 L 100 480 Z" fill="url(#waterGradMap)" />
            {/* Taku Inlet (SE) */}
            <path d="M 680 650 Q 720 540 760 480 Q 820 460 880 450 L 920 650 Z" fill="url(#waterGradMap)" opacity="0.85" />
          </g>

          {/* Douglas Island Landmass */}
          <g>
            <path
              d="M 100 480 Q 200 510 270 560 L 250 650 L 0 650 L 0 530 Z"
              fill="#0a1e28"
              stroke="#164e63"
              strokeWidth="1.5"
            />
            <text x="140" y="590" fill="#64748b" fontSize="12" fontWeight="700" letterSpacing="1" opacity="0.8">
              DOUGLAS ISLAND
            </text>
          </g>

          {/* Mainland Juneau & Coast Mountains */}
          <path
            d="M 160 0 Q 300 120 400 80 Q 600 50 850 0 L 1000 0 L 1000 650 L 920 650 Q 880 440 750 480 Q 680 540 650 650 L 460 650 Q 380 550 320 510 Q 180 460 160 0 Z"
            fill="#0c2430"
            stroke="#164e63"
            strokeWidth="1.5"
          />

          {/* THE JUNEAU ICEFIELD MAIN MASS */}
          <g>
            <path
              d="M 320 40 Q 460 20 620 30 Q 820 60 900 120 Q 950 200 920 310 Q 850 380 780 340 Q 720 300 660 320 Q 560 280 480 270 Q 400 240 330 200 Q 280 140 320 40 Z"
              fill="url(#icefieldGradMap)"
              stroke="#e0f2fe"
              strokeWidth="2"
              opacity="0.85"
            />
            {/* Glacial crevasse texture */}
            <path d="M 400 80 Q 480 120 580 90 Q 680 110 780 80" stroke="#0284c7" strokeWidth="1.5" fill="none" opacity="0.4" />
            <path d="M 450 140 Q 560 170 660 130 Q 760 160 840 140" stroke="#0284c7" strokeWidth="1.5" fill="none" opacity="0.4" />
            <path d="M 500 200 Q 620 230 720 190 Q 820 220 880 200" stroke="#0284c7" strokeWidth="1.5" fill="none" opacity="0.4" />
            <text x="610" y="140" fill="#0c4a6e" fontSize="16" fontWeight="900" letterSpacing="4" textAnchor="middle" opacity="0.75">
              JUNEAU ICEFIELD
            </text>
            <text x="610" y="160" fill="#0369a1" fontSize="11" fontWeight="700" letterSpacing="2" textAnchor="middle" opacity="0.8">
              (1,500 SQ MILES • ELEVATION 3,500–7,000 FT)
            </text>
          </g>

          {/* Herbert Glacier (Geographic Location) */}
          <g
            style={{ cursor: "pointer" }}
            onClick={() => setActivePoint("herbert")}
          >
            <path
              d="M 330 110 Q 260 140 220 190 Q 180 230 190 260 Q 220 270 250 240 Q 290 190 350 160 Z"
              fill="url(#glacierFlowGradMap)"
              stroke={activePoint === "herbert" ? "#facc15" : "#38bdf8"}
              strokeWidth={activePoint === "herbert" ? "3.5" : "2"}
            />
            <text x="180" y="215" fill="#e0f2fe" fontSize="12" fontWeight="800" textAnchor="end">
              HERBERT GLACIER
            </text>
            <text x="180" y="230" fill="#94a3b8" fontSize="9.5" fontWeight="600" textAnchor="end">
              (Geographic Glacier Location)
            </text>
            <text x="180" y="245" fill="#38bdf8" fontSize="10" fontWeight="600" textAnchor="end">
              Coastal Landing ($429) &amp; Dog Sleds ($659–$709)
            </text>
          </g>

          {/* Mendenhall Glacier (Geographic Location) */}
          <g
            style={{ cursor: "pointer" }}
            onClick={() => setActivePoint("mendenhall")}
          >
            <path
              d="M 440 250 Q 400 300 370 350 Q 350 400 360 430 Q 385 435 400 395 Q 430 345 470 280 Z"
              fill="url(#glacierFlowGradMap)"
              stroke={activePoint === "mendenhall" ? "#facc15" : "#38bdf8"}
              strokeWidth={activePoint === "mendenhall" ? "4" : "2.5"}
            />
            <ellipse cx="365" cy="442" rx="20" ry="12" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="440" y="375" fill="#ffffff" fontSize="13" fontWeight="900">
              MENDENHALL GLACIER
            </text>
            <text x="440" y="390" fill="#94a3b8" fontSize="9.5" fontWeight="600">
              (Geographic Glacier Location · Conditions Dictate Ice Site)
            </text>
            <text x="440" y="405" fill="#38bdf8" fontSize="10" fontWeight="700">
              TEMSCO Walk ($409) · NorthStar Walkabout ($499) · Trek ($549)
            </text>
          </g>

          {/* Taku Glacier (Geographic Location) */}
          <g
            style={{ cursor: "pointer" }}
            onClick={() => setActivePoint("taku")}
          >
            <path
              d="M 750 310 Q 770 370 780 430 Q 790 470 820 480 Q 840 450 820 410 Q 800 360 780 300 Z"
              fill="url(#glacierFlowGradMap)"
              stroke={activePoint === "taku" ? "#facc15" : "#38bdf8"}
              strokeWidth={activePoint === "taku" ? "3.5" : "2.5"}
            />
            <text x="840" y="425" fill="#ffffff" fontSize="13" fontWeight="900">
              TAKU GLACIER
            </text>
            <text x="840" y="440" fill="#94a3b8" fontSize="9.5" fontWeight="600">
              (Geographic Glacier Location)
            </text>
            <text x="840" y="455" fill="#f0b35b" fontSize="10" fontWeight="700">
              NorthStar Airboat Tour · Wings Airways Seaplane Lodge
            </text>
          </g>

          {/* Norris Glacier (Geographic Location) */}
          <g
            style={{ cursor: "pointer" }}
            onClick={() => setActivePoint("norris")}
          >
            <path
              d="M 680 330 Q 670 390 660 440 Q 685 450 700 420 Q 710 380 715 330 Z"
              fill="url(#glacierFlowGradMap)"
              stroke={activePoint === "norris" ? "#facc15" : "#38bdf8"}
              strokeWidth={activePoint === "norris" ? "3.5" : "2"}
            />
            <text x="635" y="430" fill="#e0f2fe" fontSize="12" fontWeight="800" textAnchor="end">
              NORRIS GLACIER
            </text>
            <text x="635" y="445" fill="#94a3b8" fontSize="9.5" fontWeight="600" textAnchor="end">
              (Geographic Glacier Location)
            </text>
            <text x="635" y="460" fill="#38bdf8" fontSize="10" fontWeight="600" textAnchor="end">
              NorthStar Dogsled Camp ($739 · Approx. Camp)
            </text>
          </g>

          {/* Illustrative Flight Corridors (Weather & FAA Dependent) */}
          <g opacity="0.8">
            <path d="M 310 470 Q 330 440 375 380" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6,6" />
            <path d="M 310 470 Q 230 400 230 230" fill="none" stroke="#f0b35b" strokeWidth="2" strokeDasharray="6,6" />
            <path d="M 230 520 Q 450 510 680 400" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="6,6" />
            <path d="M 230 520 Q 520 540 810 470" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6,6" />
            <path d="M 390 560 Q 560 590 810 510" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" />
          </g>

          {/* Corridor Legend Label */}
          <text x="500" y="490" fill="#94a3b8" fontSize="9.5" fontStyle="italic" textAnchor="middle" opacity="0.85">
            Illustrative flight corridors (weather, cloud ceiling &amp; FAA dependent; actual flight paths vary)
          </text>

          {/* Airport Bases (Mainland) */}
          <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("airport")}>
            <circle cx="310" cy="470" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="310" cy="470" r="6" fill="#ffffff" />
            <rect x="210" y="430" width="190" height="34" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="305" y="444" fill="#ffffff" fontSize="10.5" fontWeight="800" textAnchor="middle">
              🚁 AIRPORT BASES (JNU)
            </text>
            <text x="305" y="458" fill="#94a3b8" fontSize="8.5" fontWeight="600" textAnchor="middle">
              TEMSCO • Coastal • NorthStar Treks
            </text>
          </g>

          {/* NorthStar Douglas Island Base */}
          <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("douglas")}>
            <circle cx="230" cy="520" r="13" fill="#a855f7" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="230" cy="520" r="5" fill="#ffffff" />
            <rect x="135" y="538" width="180" height="34" rx="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
            <text x="225" y="552" fill="#ffffff" fontSize="10" fontWeight="800" textAnchor="middle">
              🚁 DOUGLAS HELIPORT (NorthStar)
            </text>
            <text x="225" y="565" fill="#cbd5e1" fontSize="8.5" textAnchor="middle">
              Dog Sledding &amp; Airboat Tours Base
            </text>
          </g>

          {/* Downtown Meeting Hub / Goldbelt Tramway & Cruise Docks */}
          <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("docks")}>
            <circle cx="390" cy="570" r="14" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="390" cy="570" r="6" fill="#ffffff" />
            <rect x="300" y="590" width="195" height="46" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="397" y="604" fill="#ffffff" fontSize="10.5" fontWeight="800" textAnchor="middle">
              📍 GOLDBELT TRAMWAY &amp; DOCKS
            </text>
            <text x="397" y="618" fill="#cbd5e1" fontSize="8.5" textAnchor="middle">
              Direct-Booking Meeting Hub (490 S Franklin)
            </text>
            <text x="397" y="630" fill="#f59e0b" fontSize="8" fontWeight="700" textAnchor="middle">
              Operator Shuttles to Airport &amp; Douglas
            </text>
          </g>

          {/* Herbert Dog Camp Pin (Approximate Seasonal Camp) */}
          {(filter === "all" || filter === "dogsled" || filter === "landing") && (
            <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("herbert")}>
              <circle cx="230" cy="230" r="13" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
              <text x="230" y="235" fontSize="11" textAnchor="middle">🐕</text>
              <rect x="150" y="250" width="160" height="20" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1" opacity="0.9" />
              <text x="230" y="263" fill="#fca5a5" fontSize="8.5" fontWeight="700" textAnchor="middle">
                Herbert Camp (Approx. Seasonal)
              </text>
            </g>
          )}

          {/* Mendenhall Pin (Geographic Location) */}
          {(filter === "all" || filter === "landing") && (
            <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("mendenhall")}>
              <circle cx="375" cy="380" r="13" fill="#06b6d4" stroke="#ffffff" strokeWidth="2.5" />
              <text x="375" y="385" fontSize="11" textAnchor="middle">🧊</text>
            </g>
          )}

          {/* Norris Dog Camp Pin (Approximate Seasonal Camp) */}
          {(filter === "all" || filter === "dogsled") && (
            <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("norris")}>
              <circle cx="680" cy="400" r="13" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2.5" />
              <text x="680" y="405" fontSize="11" textAnchor="middle">🐕</text>
              <rect x="600" y="365" width="160" height="20" rx="4" fill="#0f172a" stroke="#8b5cf6" strokeWidth="1" opacity="0.9" />
              <text x="680" y="378" fill="#d8b4fe" fontSize="8.5" fontWeight="700" textAnchor="middle">
                Norris Camp (Approx. Seasonal)
              </text>
            </g>
          )}

          {/* Taku Pin */}
          {(filter === "all" || filter === "landing") && (
            <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("taku")}>
              <circle cx="810" cy="510" r="11" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              <text x="810" y="515" fontSize="10" textAnchor="middle">🛩️</text>
            </g>
          )}
        </svg>
      </div>

      {/* Dynamic Detail Card */}
      <div
        style={{
          background: "#0c121e",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 10,
            borderBottom: "1px solid #1e293b",
            paddingBottom: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color: point.badgeColor,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {point.category}
            </span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", margin: "2px 0" }}>
              {point.title}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: 0 }}>{point.subtitle}</p>
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 20,
              background: "rgba(255, 255, 255, 0.08)",
              color: point.badgeColor,
              border: `1px solid ${point.badgeColor}40`,
            }}
          >
            {point.badge}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
            fontSize: "0.82rem",
            marginBottom: 14,
          }}
        >
          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 12, borderRadius: 8 }}>
            <strong style={{ color: "#cbd5e1", display: "block", marginBottom: 4 }}>📍 Geography:</strong>
            <span style={{ color: "#94a3b8", lineHeight: 1.5 }}>{point.geo}</span>
          </div>
          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 12, borderRadius: 8 }}>
            <strong style={{ color: "#cbd5e1", display: "block", marginBottom: 4 }}>🚁 Operators Flying Here:</strong>
            <span style={{ color: "#94a3b8", lineHeight: 1.5 }}>{point.operators}</span>
          </div>
          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 12, borderRadius: 8 }}>
            <strong style={{ color: "#cbd5e1", display: "block", marginBottom: 4 }}>💵 Published Excursions:</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: 16, color: "#94a3b8", lineHeight: 1.5 }}>
              {point.pricing.map((pr, i) => (
                <li key={i}>{pr}</li>
              ))}
            </ul>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            borderTop: "1px solid #1e293b",
            paddingTop: 10,
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#fcd34d", fontWeight: 500 }}>
            {point.note}
          </span>
          {point.isDirectLink ? (
            <a
              href={point.primaryActionHref}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
            >
              {point.primaryActionText}
            </a>
          ) : point.primaryActionHref.startsWith("http") ? (
            <a
              href={point.primaryActionHref}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
            >
              {point.primaryActionText}
            </a>
          ) : (
            <Link
              href={point.primaryActionHref}
              className="button button-primary"
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
            >
              {point.primaryActionText}
            </Link>
          )}
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #1e293b", fontSize: "0.75rem", color: "#64748b", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
        <span>
          Checked on <strong>October 7, 2026</strong> against official sources:{" "}
          <a href="https://temscoair.com/juneau-faq/" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8", textDecoration: "underline" }}>TEMSCO FAQ</a> •{" "}
          <a href="https://coastalhelicopters.com/tours/" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8", textDecoration: "underline" }}>Coastal Tours</a> •{" "}
          <a href="https://northstartrekking.com/faqs/" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8", textDecoration: "underline" }}>NorthStar FAQ</a> •{" "}
          <a href="https://wingsairways.com/world-of-wings-airways/" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8", textDecoration: "underline" }}>Wings Airways</a>
        </span>
        <span>Landing locations adjust with daily ice and weather conditions</span>
      </div>
    </div>
  );
}
