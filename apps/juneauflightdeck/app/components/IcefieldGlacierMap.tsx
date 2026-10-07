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
    category: "Featured Glacier Landing & Treks",
    title: "Mendenhall Glacier",
    subtitle: "Terminates into Mendenhall Lake • 8–12 min helicopter flight from Juneau Airport",
    badge: "Ice Walks & Treks",
    badgeColor: "#38bdf8",
    geo: "13 miles long; drops from the Juneau Icefield down to 100 ft elevation. Closest glacier to airport heliports.",
    operators: "TEMSCO Helicopters & NorthStar Trekking. Departures every 30–45 mins.",
    pricing: [
      "TEMSCO Guided Walk: From $409 base (~$442 at checkout)",
      "NorthStar 1-Hour Walkabout: From $499 base (~$539 at checkout · Ages 8+)",
      "NorthStar Level 1 Ice Trek: From $549 base (~$593 at checkout · 2 hrs on ice)",
    ],
    note: "💡 Best for first-time flyers, families with kids (ages 2+), and active hikers wanting 1 to 2 hours exploring deep ice features.",
    primaryActionText: "Check Mendenhall Walk on Viator →",
    primaryActionHref: "https://www.viator.com/searchResults/all?text=Juneau+TEMSCO+Helicopters&pid=P00058396&mcid=42383&medium=api",
  },
  herbert: {
    id: "herbert",
    category: "Scenic Landing & Summer Dog Camps",
    title: "Herbert Glacier",
    subtitle: "Northwest outlet of the icefield • 12–15 min scenic flight via Lynn Canal coast",
    badge: "Landings & Dog Sledding",
    badgeColor: "#ef4444",
    geo: "Large, dramatic valley glacier terminating in the Herbert River. High alpine snowfields host active summer dog camps at 3,500 ft elevation.",
    operators: "TEMSCO Helicopters & Coastal Helicopters.",
    pricing: [
      "Coastal Icefield Landing: From $429 base (~$463 at checkout)",
      "TEMSCO Glacier Dog Sledding: From $659 base (~$712 at checkout)",
      "Coastal Herbert Dog Sled Tour: From $709 base (~$766 at checkout)",
    ],
    note: "💡 Houses 100+ Alaskan huskies mid-May through late August; quiet, pristine alpine snowfields away from Mendenhall crowds.",
    primaryActionText: "Book Herbert Dog Sled (FH 214810) ↗",
    primaryActionHref: "https://fareharbor.com/embeds/book/temscoair-juneau/items/214810/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes",
    isDirectLink: true,
  },
  norris: {
    id: "norris",
    category: "Alpine Dog Sledding Excursion",
    title: "Norris Glacier",
    subtitle: "Southeast Juneau Icefield • Flown by NorthStar Trekking",
    badge: "Glacier Dog Sledding",
    badgeColor: "#a855f7",
    geo: "Located west of Taku Inlet with sweeping snowfields and jagged granite nunatak peaks.",
    operators: "NorthStar Trekking partner musher camp.",
    pricing: [
      "NorthStar Helicopter Glacier Dogsled Adventure: From $739 base (~$798 at checkout · FareHarbor item 115991)",
    ],
    note: "💡 Small-group mushing adventure with veteran Iditarod partners; ages 2+ welcome on the sled.",
    primaryActionText: "Book NorthStar Dogsled (FH 115991) ↗",
    primaryActionHref: "https://fareharbor.com/embeds/book/northstartrekking/items/115991/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes",
    isDirectLink: true,
  },
  taku: {
    id: "taku",
    category: "Deepest Icefield Glacier & Historic Lodge",
    title: "Taku Glacier & Taku Glacier Lodge",
    subtitle: "Largest icefield glacier (over 4,000 ft thick) • Flown via de Havilland Otter seaplanes",
    badge: "Seaplane & Wilderness Feast",
    badgeColor: "#10b981",
    geo: "The only advancing glacier in the Juneau Icefield; terminates directly into Taku Inlet southeast of Juneau.",
    operators: "Wings Airways operates classic floatplane tours from downtown Juneau waterfront to Taku Lodge.",
    pricing: [
      "Taku Glacier Lodge Flight & Feast: ~$385–$415 seaplane tour (Wings Airways)",
      "NorthStar Taku Glacier Airboat Combo: $688 base",
    ],
    note: "💡 Note: Taku Glacier Lodge is an iconic seaplane dining tour operated by Wings Airways, not a commercial helicopter landing.",
    primaryActionText: "Compare Helicopter Tours →",
    primaryActionHref: "/temsco-vs-coastal-vs-northstar-juneau#effort-comparison",
  },
  airport: {
    id: "airport",
    category: "Commercial Heliport Operations",
    title: "Juneau International Airport (JNU) Heliports",
    subtitle: "North Airport Ramp & Industrial Heliport • 9 miles northwest of downtown cruise docks",
    badge: "Flight Departure Base",
    badgeColor: "#0284c7",
    geo: "Primary operating bases for TEMSCO Helicopters, Coastal Helicopters, and NorthStar Trekking.",
    operators: "All 3 licensed FAA Part 135 commercial helicopter operators depart from this area.",
    pricing: [
      "Complimentary round-trip shuttles included from all 4 cruise berths (15–20 min transit)",
    ],
    note: "💡 Allow 60–90 minutes buffer time after ship docking before your scheduled flight departure.",
    primaryActionText: "See Port Dock Buffers →",
    primaryActionHref: "#cruise-timing-pickup",
  },
  docks: {
    id: "docks",
    category: "Cruise Ship Terminals",
    title: "Downtown Juneau Cruise Ship Berths",
    subtitle: "AJ Dock • Franklin Dock • Steamship Wharf (CT) • Marine Park",
    badge: "Port Logistics",
    badgeColor: "#f59e0b",
    geo: "All 4 berths sit along Gastineau Channel. AJ Dock is 1.0 mile south with dedicated gate vans; CT & Franklin are in downtown core.",
    operators: "Marked shuttle vans pick up passengers curbside at each security gate exit.",
    pricing: [
      "Complimentary ground transfers included in all helicopter excursion tickets",
    ],
    note: "💡 Port Rule: Select flights returning to dock at least 60–90 minutes before ship All Aboard time.",
    primaryActionText: "Alaska Cruise Fleet Waitlist →",
    primaryActionHref: "/helicopter-waitlist",
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
            🚢 Docks &amp; Heliports
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
            {/* Gastineau Channel */}
            <path d="M 120 450 Q 240 480 340 520 L 390 560 L 460 650 L 380 650 L 280 570 L 100 480 Z" fill="url(#waterGradMap)" />
            {/* Taku Inlet (SE) */}
            <path d="M 680 650 Q 720 540 760 480 Q 820 460 880 450 L 920 650 Z" fill="url(#waterGradMap)" opacity="0.85" />
          </g>

          {/* Mountains & Land Base */}
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

          {/* Herbert Glacier */}
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
            <text x="180" y="220" fill="#e0f2fe" fontSize="12" fontWeight="800" textAnchor="end">
              HERBERT GLACIER
            </text>
            <text x="180" y="235" fill="#38bdf8" fontSize="10" fontWeight="600" textAnchor="end">
              Landing ($429) &amp; Dog Sled ($659–$709)
            </text>
          </g>

          {/* Mendenhall Glacier */}
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
            <text x="440" y="380" fill="#ffffff" fontSize="13" fontWeight="900">
              MENDENHALL GLACIER
            </text>
            <text x="440" y="396" fill="#38bdf8" fontSize="10" fontWeight="700">
              Walk ($409) · Walkabout ($499) · Trek ($549)
            </text>
          </g>

          {/* Taku Glacier */}
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
            <text x="840" y="430" fill="#ffffff" fontSize="13" fontWeight="900">
              TAKU GLACIER
            </text>
            <text x="840" y="446" fill="#f0b35b" fontSize="10" fontWeight="700">
              Largest Glacier • Taku Lodge Seaplanes
            </text>
          </g>

          {/* Norris Glacier */}
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
            <text x="635" y="435" fill="#e0f2fe" fontSize="12" fontWeight="800" textAnchor="end">
              NORRIS GLACIER
            </text>
            <text x="635" y="450" fill="#38bdf8" fontSize="10" fontWeight="600" textAnchor="end">
              NorthStar Dog Sled Camp ($739)
            </text>
          </g>

          {/* Flight Routes */}
          <g opacity="0.8">
            <path d="M 310 470 Q 330 440 375 380" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="6,6" />
            <path d="M 310 470 Q 230 400 230 230" fill="none" stroke="#f0b35b" strokeWidth="2.5" strokeDasharray="6,6" />
            <path d="M 310 470 Q 480 490 680 400" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="6,6" />
            <path d="M 390 560 Q 560 590 810 510" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" />
          </g>

          {/* Heliport Base */}
          <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("airport")}>
            <circle cx="310" cy="470" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="310" cy="470" r="6" fill="#ffffff" />
            <rect x="230" y="490" width="160" height="34" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="310" y="504" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle">
              🚁 JUNEAU AIRPORT HELIPORTS
            </text>
            <text x="310" y="518" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle">
              TEMSCO • Coastal • NorthStar Bases
            </text>
          </g>

          {/* Cruise Docks */}
          <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("docks")}>
            <circle cx="390" cy="560" r="14" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="390" cy="560" r="6" fill="#ffffff" />
            <rect x="320" y="580" width="160" height="46" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="400" y="594" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle">
              🚢 CRUISE SHIP BERTHS
            </text>
            <text x="400" y="608" fill="#cbd5e1" fontSize="9" textAnchor="middle">
              AJ Dock • Franklin • CT • Marine Park
            </text>
            <text x="400" y="620" fill="#f59e0b" fontSize="8.5" fontWeight="700" textAnchor="middle">
              Free 15-20 min Shuttle to Heliport
            </text>
          </g>

          {/* Pins */}
          {(filter === "all" || filter === "dogsled" || filter === "landing") && (
            <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("herbert")}>
              <circle cx="230" cy="230" r="13" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
              <text x="230" y="235" fontSize="11" textAnchor="middle">🐕</text>
            </g>
          )}

          {(filter === "all" || filter === "landing") && (
            <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("mendenhall")}>
              <circle cx="375" cy="380" r="13" fill="#06b6d4" stroke="#ffffff" strokeWidth="2.5" />
              <text x="375" y="385" fontSize="11" textAnchor="middle">🧊</text>
            </g>
          )}

          {(filter === "all" || filter === "dogsled") && (
            <g style={{ cursor: "pointer" }} onClick={() => setActivePoint("norris")}>
              <circle cx="680" cy="400" r="13" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2.5" />
              <text x="680" y="405" fontSize="11" textAnchor="middle">🐕</text>
            </g>
          )}

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
    </div>
  );
}
