"use client";

import React from "react";
import {
  SITE_DESCRIPTION,
  BOOKING_ROLES,
  BOOKING_BENEFITS,
  BOOKING_FAQS,
} from "@/lib/sitePositioning";
import Link from "next/link";
import Image from "next/image";
import ViatorFeaturedTours from "./ViatorFeaturedTours";
import HelicopterArrival from "./HelicopterArrival";
import OperatorIdentityMark from "./OperatorIdentityMark";
import SourcesAndFreshness from "./SourcesAndFreshness";
import arrivalStyles from "./HelicopterArrival.module.css";
import { buildJfdViatorHandoffUrl } from "../../lib/viator/handoff";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
  VERIFIED_TARIFF_DATE_LONG,
} from "@/lib/verifiedOperatorPricing";

type PortSlug = "juneau" | "skagway";

export interface HelicopterDispatchBoardProps {
  portSlug?: PortSlug;
  sourcePage?: string;
  headline?: string;
  subhead?: string;
  primaryCtaLabel?: string;
  initialDate?: string | null;
  initialPassengerCount?: number | null;
}

export default function HelicopterDispatchBoard({
  portSlug = "juneau",
  sourcePage = "/",
  headline,
  subhead,
  primaryCtaLabel,
  initialDate = null,
  initialPassengerCount = null,
}: HelicopterDispatchBoardProps) {
  const isSkagway = portSlug === "skagway";
  const showArrivalHero =
    sourcePage === "/" ||
    sourcePage === "/helicopter" ||
    sourcePage === "/juneau/helicopter" ||
    sourcePage === "/skagway/helicopter";

  const defaultHeadline = isSkagway
    ? "Skagway & Juneau Corridor Glacier Flight Planning"
    : "Compare Juneau Helicopter & Glacier Excursions";

  const defaultSubhead = isSkagway
    ? "Planning an Inside Passage sailing calling at Skagway and Juneau? TEMSCO Helicopters operates Skagway glacier flights ($479 Discovery / $649 Dog Sledding base, as of November 18, 2026), while TEMSCO, Coastal, and NorthStar fly from Juneau."
    : SITE_DESCRIPTION;

  const defaultPrimaryCta = isSkagway ? "Compare Corridor Flights" : "Find Your Tour";

  const finalHeadline = headline || defaultHeadline;
  const finalSubhead = subhead || defaultSubhead;
  const finalPrimaryCta = primaryCtaLabel || defaultPrimaryCta;

  return (
    <div className="jfd-root">
      {/* 1. Concise Hero Section */}
      <section className={`jfd-concise-hero ${showArrivalHero ? arrivalStyles.hero : ""}`}>
        {showArrivalHero && (
          <>
            <Image
              src={
                isSkagway
                  ? "/images/portfolio/skagway-corridor.webp"
                  : "/images/juneau-helicopter-hero.jpg"
              }
              alt={
                isSkagway
                  ? "Historic Broadway Avenue false-front buildings beneath snow-capped peaks in Skagway, Alaska"
                  : "Flightseeing helicopter soaring above an expansive Alaska glacier valley and snow-capped peaks"
              }
              fill
              priority
              sizes="100vw"
              className={arrivalStyles.photo}
            />
            <div className={arrivalStyles.scrim} />
            {!isSkagway && <HelicopterArrival />}
            <a
              className={arrivalStyles.credit}
              href={
                isSkagway
                  ? "https://commons.wikimedia.org/wiki/File:Broadway_Avenue,_Skagway,_Alaska.jpg"
                  : "https://commons.wikimedia.org/wiki/File:Alaska_helicopter_ice.jpg"
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              {isSkagway
                ? "Photo: Jet Lowe (HAER / NPS) · Public Domain"
                : "Photo: Adamcain62 · CC BY-SA 4.0"}
            </a>
          </>
        )}
        <div className={showArrivalHero ? arrivalStyles.copy : undefined}>
          <div
            style={{
              display: "inline-block",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 10,
            }}
          >
            {isSkagway
              ? "Independent Skagway & Juneau Flight Guide"
              : "Independent Juneau Flight Guide & Concierge"}
          </div>
          <h1>{finalHeadline}</h1>
          <p className="jfd-concise-hero-subhead">{finalSubhead}</p>

          <div className="jfd-hero-actions-responsive">
            <a href="#tours" className="jfd-hero-btn-primary">
              {finalPrimaryCta} →
            </a>
            <Link href="/helicopter-waitlist" className="jfd-hero-btn-secondary">
              Sold-Out Tour Waitlist
            </Link>
          </div>

          <p style={{ fontSize: "0.85rem", lineHeight: 1.55, marginTop: 20 }}>{BOOKING_ROLES}</p>

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid var(--line)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px 24px",
              fontSize: "0.82rem",
              color: "var(--muted)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: "var(--accent)", fontWeight: 800 }}>✓</span>
              <span>
                <strong>Booking choices:</strong> Direct operator pages &amp; Viator partner links
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: "var(--ice)", fontWeight: 800 }}>✓</span>
              <span>
                <strong>Verified tariffs:</strong> As of {VERIFIED_TARIFF_DATE_LONG}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: "#86efac", fontWeight: 800 }}>✓</span>
              <span>
                <strong>Port planning:</strong> 2-hour return buffer before all-aboard
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Skagway Primary Operator Tariffs (when on /skagway/helicopter) */}
      {isSkagway && (
        <section
          aria-label="Skagway Verified Operator Tariffs"
          style={{
            width: "min(calc(100% - 32px), var(--content))",
            margin: "24px auto 0",
            padding: "22px 24px",
            borderRadius: 16,
            border: "1px solid rgba(125, 211, 252, 0.3)",
            background: "rgba(8, 28, 44, 0.88)",
            color: "#e0f2fe",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <OperatorIdentityMark operator="temsco" />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#ffffff" }}>
                Skagway Helicopter Tariffs — TEMSCO Helicopters (Verified {VERIFIED_TARIFF_DATE_LONG})
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#bae6fd" }}>
                Operated from the Skagway Waterfront Heliport (walkable from Skagway cruise docks).{" "}
                <a
                  href={LFSE_CANONICAL_LINKS.temsco}
                  style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
                >
                  TEMSCO profile on Last Frontier Shore Excursions ↗
                </a>{" "}
                ·{" "}
                <a
                  href={LFSE_CANONICAL_LINKS.skagwayPort}
                  style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
                >
                  Skagway Port Guide ↗
                </a>
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: 14,
              marginTop: 14,
            }}
          >
            <div
              style={{
                padding: "16px",
                borderRadius: 12,
                background: "rgba(4, 17, 27, 0.82)",
                border: "1px solid rgba(151, 211, 255, 0.2)",
              }}
            >
              <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#7dd3fc", textTransform: "uppercase" }}>
                Glacier Landing · 2h Total
              </div>
              <h3 style={{ margin: "4px 0 6px", fontSize: "1.02rem", color: "#fff" }}>
                Glacier Discovery by Helicopter
              </h3>
              <p style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 800, color: "#ffd596" }}>
                $479 per person (ages 2+), as of {VERIFIED_TARIFF_DATE_LONG}
              </p>
              <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                Qualifications: +$150 weight surcharge at 250+ lbs clothed; + Skagway tax &amp;
                fees. Direct cancel: 100% refund 48h+ prior; 100% weather cancellation refund.
              </p>
              <a
                href="https://temscoair.com/skagway-helicopter-tours/glacier-tours/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.8rem", fontWeight: 700, color: "#9ed9ff", textDecoration: "underline" }}
              >
                Official TEMSCO Skagway Glacier Tour Tariff ↗
              </a>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: 12,
                background: "rgba(4, 17, 27, 0.82)",
                border: "1px solid rgba(151, 211, 255, 0.2)",
              }}
            >
              <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#f0b35b", textTransform: "uppercase" }}>
                Seasonal Snow Camp · 2h Total (May–August)
              </div>
              <h3 style={{ margin: "4px 0 6px", fontSize: "1.02rem", color: "#fff" }}>
                Glacier Dog Sledding (Denver Glacier)
              </h3>
              <p style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 800, color: "#ffd596" }}>
                $649 per person (ages 2+), as of {VERIFIED_TARIFF_DATE_LONG}
              </p>
              <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                Qualifications: Seasonal snowpack window (May–August); +$150 weight surcharge at
                250+ lbs clothed; +$3 Skagway fee &amp; tax. Direct cancel: 100% refund 48h+ prior;
                100% weather refund.
              </p>
              <a
                href="https://temscoair.com/skagway-helicopter-tours/dog-sledding/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.8rem", fontWeight: 700, color: "#9ed9ff", textDecoration: "underline" }}
              >
                Official TEMSCO Skagway Dog Sledding Tariff ↗
              </a>
            </div>
          </div>

          <p style={{ margin: "14px 0 0", fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.55 }}>
            <strong>Corridor note:</strong> Coastal Helicopters and NorthStar Trekking operate
            exclusively out of Juneau. The Juneau Icefield catalog below lets Inside Passage
            travelers compare both ports side by side.
          </p>
        </section>
      )}

      <div id="tours">
        <ViatorFeaturedTours
          initialDate={initialDate}
          initialPassengerCount={initialPassengerCount}
          showHeader={false}
          headline={
            isSkagway
              ? "Juneau & Skagway Corridor Glacier Helicopter Reference"
              : "Juneau Glacier Helicopter Flights & Landings"
          }
          subhead={
            isSkagway
              ? "Compare Inside Passage glacier flights across Skagway (TEMSCO) and Juneau (TEMSCO, Coastal, NorthStar) with verified base tariffs as of November 18, 2026."
              : "Explore Juneau glacier landings, seasonal dog sledding camps, and ice treks with verified direct base tariffs as of November 18, 2026."
          }
        />
      </div>

      {/* 2. Core Planning Pillars + Verbatim 2-Hour Return Standard */}
      <section className="jfd-cards-section" aria-label="Core Planning Pillars">
        <div className="jfd-cards-grid">
          <div className="jfd-compact-card">
            <div>
              <div style={{ color: "var(--accent)", fontSize: "0.75rem", fontWeight: 800, marginBottom: 4 }}>
                01 · INDEPENDENT COMPARISON
              </div>
              <h2 className="jfd-compact-card-title">Compare All 3 Juneau Operators</h2>
              <p className="jfd-compact-card-body">
                Compare TEMSCO, Coastal Helicopters, and NorthStar Trekking side-by-side—including
                verified base rates (as of {VERIFIED_TARIFF_DATE_LONG}), weight surcharge tiers, and
                time on ice.
              </p>
            </div>
            <Link
              href="#operators"
              className="jfd-compact-card-action"
              aria-label="View operator specs for Juneau helicopter companies"
            >
              View operator specs &rarr;
            </Link>
          </div>

          <div className="jfd-compact-card">
            <div>
              <div style={{ color: "var(--ice)", fontSize: "0.75rem", fontWeight: 800, marginBottom: 4 }}>
                02 · PORT RETURN BUFFER
              </div>
              <h2 className="jfd-compact-card-title">2-Hour Return Planning Standard</h2>
              <p className="jfd-compact-card-body">
                {VERBATIM_TWO_HOUR_BUFFER_RULE} {TWO_HOUR_BUFFER_CLARIFICATION}
              </p>
            </div>
            <Link
              href="#how-it-works"
              className="jfd-compact-card-action"
              aria-label="Review how pickup and port timing works"
            >
              How pickup &amp; timing works &rarr;
            </Link>
          </div>

          <div className="jfd-compact-card">
            <div>
              <div style={{ color: "#86efac", fontSize: "0.75rem", fontWeight: 800, marginBottom: 4 }}>
                03 · WEATHER CONTINGENCY
              </div>
              <h2 className="jfd-compact-card-title">Weather-Day Backup Guidance</h2>
              <p className="jfd-compact-card-body">
                Mountain cloud ceilings can ground glacier flights even when downtown Juneau is dry.
                Review{" "}
                <Link href="/juneau-glacier-flight-weather" style={{ textDecoration: "underline", color: "#9ed9ff" }}>
                  FAA WeatherCams
                </Link>{" "}
                and sea-level{" "}
                <a
                  href={LFSE_CANONICAL_LINKS.juneauWhaleCategory}
                  style={{ textDecoration: "underline", color: "#9ed9ff" }}
                >
                  Juneau whale-watching backups ↗
                </a>{" "}
                in advance.
              </p>
            </div>
            <Link
              href={isSkagway ? "/skagway/helicopter" : "/juneau/what-to-do-if-helicopter-tour-canceled"}
              className="jfd-compact-card-action"
              aria-label="Backup options"
            >
              Explore backup options &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Operator Comparison Table */}
      <section id="operators" className="jfd-table-section">
        <div className="jfd-section-head">
          <h2>
            {isSkagway
              ? "Juneau & Skagway Helicopter Operators (Verified Nov 18, 2026)"
              : "Juneau Helicopter Operator Overview (Verified Nov 18, 2026)"}
          </h2>
          <p>
            Independent reference to the licensed FAA Part 135 helicopter operators serving cruise
            passengers. Base rates below are verified as of {VERIFIED_TARIFF_DATE_LONG} before
            municipal sales tax, port/landing fees, and clothed weight surcharges. Explore{" "}
            <a
              href={LFSE_CANONICAL_LINKS.juneauHelicopterCategory}
              style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
            >
              Last Frontier Shore Excursions&apos; Juneau Helicopter Directory ↗
            </a>{" "}
            and{" "}
            <a
              href={LFSE_CANONICAL_LINKS.juneauPort}
              style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
            >
              Juneau Port Guide ↗
            </a>
            .
          </p>
        </div>

        <div className="jfd-table-wrap">
          <table className="jfd-table">
            <thead>
              <tr>
                <th scope="col">Operator</th>
                <th scope="col">Verified Tariffs (as of Nov 18, 2026)</th>
                <th scope="col">Weight &amp; Tax Qualifications</th>
                <th scope="col">Base &amp; Canonical Profile</th>
                <th scope="col">Booking &amp; Policy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <OperatorIdentityMark operator="temsco" />
                    <div>
                      <span className="jfd-op-name">TEMSCO Helicopters</span>
                      <span className="jfd-op-sub">Juneau &amp; Skagway Part 135 Carrier</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        position: "relative",
                        width: 72,
                        height: 48,
                        borderRadius: 8,
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "1px solid var(--line)",
                        backgroundColor: "#061521",
                      }}
                    >
                      <Image
                        src="/images/tours/temsco-mendenhall-glacier-walk.jpg"
                        alt="TEMSCO helicopter landed on Mendenhall Glacier ice near Juneau, Alaska"
                        fill
                        sizes="72px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.86rem" }}>
                        Mendenhall Walk (2h 15m): $449 · Dog Sled (2h 45m, May–Aug): $759
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
                        Skagway Discovery (2h): $479 · Skagway Dog Sled (2h, May–Aug): $649
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--muted)", fontSize: "0.78rem", lineHeight: 1.45 }}>
                  Ages 2+ · +$150 weight surcharge at 250+ lbs clothed · + CBJ or Skagway tax &amp;
                  fees · 100% direct refund 48h+ prior
                </td>
                <td style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                  <div>JNU Airport (Maplesden Way) &amp; Skagway Heliport</div>
                  <a
                    href={LFSE_CANONICAL_LINKS.temsco}
                    style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
                  >
                    LFSE Operator Profile ↗
                  </a>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                    <a
                      href={buildJfdViatorHandoffUrl(
                        "https://www.viator.com/searchResults/all?text=Juneau+Mendenhall+Glacier+helicopter+tour&pid=P00058396&mcid=42383&medium=api&campaign=jfd-dispatch-temsco",
                        {
                          productCode: "juneau-temsco-helicopter-search",
                          campaign: "jfd-dispatch-temsco",
                          date: initialDate,
                          partySize: initialPassengerCount,
                        },
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-primary"
                      style={{ whiteSpace: "nowrap", fontSize: "0.82rem", padding: "6px 12px" }}
                      aria-label="Check TEMSCO Helicopter Flights on Viator"
                    >
                      Check on Viator ↗
                    </a>
                    <a
                      href="https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-card"
                      style={{ whiteSpace: "nowrap", fontSize: "0.76rem", padding: "4px 8px" }}
                      aria-label="TEMSCO Official Tariff Page"
                    >
                      Official Tariff ↗
                    </a>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <OperatorIdentityMark operator="coastal" />
                    <div>
                      <span className="jfd-op-name">Coastal Helicopters</span>
                      <span className="jfd-op-sub">Herbert Glacier · Viator 6251SHOREXICEWALK</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        position: "relative",
                        width: 72,
                        height: 48,
                        borderRadius: 8,
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "1px solid var(--line)",
                        backgroundColor: "#061521",
                      }}
                    >
                      <Image
                        src="/images/tours/coastal-icefield-landing.jpg"
                        alt="Herbert Glacier blue icefall in the Juneau Icefield, Alaska"
                        fill
                        sizes="72px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.86rem" }}>
                        Icefield Excursion (~2h 35m): $459 Standard (1–259 lbs)
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
                        Herbert Dog Sled (3h 15m, May–Aug): $769 Standard (1–259 lbs)
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--muted)", fontSize: "0.78rem", lineHeight: 1.45 }}>
                  Icefield: $609 (260–299 lbs) / $918 (300+ lbs, 2 seats) · Dog Sled: $919 / $1,538
                  tiers · + CBJ sales tax &amp; fees · 7+ days direct refund (24h on Viator)
                </td>
                <td style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                  <div>JNU Airport (Alex Holden Way)</div>
                  <a
                    href={LFSE_CANONICAL_LINKS.coastal}
                    style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
                  >
                    LFSE Operator Profile ↗
                  </a>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                    <a
                      href={buildJfdViatorHandoffUrl(
                        "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK?pid=P00058396&mcid=42383&medium=api&campaign=jfd-dispatch-coastal",
                        {
                          productCode: "6251SHOREXICEWALK",
                          campaign: "jfd-dispatch-coastal",
                          date: initialDate,
                          partySize: initialPassengerCount,
                        },
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-primary"
                      style={{ whiteSpace: "nowrap", fontSize: "0.82rem", padding: "6px 12px" }}
                      aria-label="Book Coastal Icefield Walk 6251SHOREXICEWALK on Viator"
                    >
                      Book on Viator (§20) ↗
                    </a>
                    <a
                      href="https://coastalhelicopters.com/tours/icefield-excursion/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-card"
                      style={{ whiteSpace: "nowrap", fontSize: "0.76rem", padding: "4px 8px" }}
                      aria-label="Coastal Helicopters Official Tariff Page"
                    >
                      Official Tariff ↗
                    </a>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <OperatorIdentityMark operator="northstar" />
                    <div>
                      <span className="jfd-op-name">NorthStar Trekking</span>
                      <span className="jfd-op-sub">Extended Ice Walkabouts &amp; Treks</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        position: "relative",
                        width: 72,
                        height: 48,
                        borderRadius: 8,
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "1px solid var(--line)",
                        backgroundColor: "#061521",
                      }}
                    >
                      <Image
                        src="/images/tours/northstar-glacier-ice-trek.jpg"
                        alt="Guided glacier hiker in crampons exploring sculpted blue glacier ice in Alaska"
                        fill
                        sizes="72px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.86rem" }}>
                        Walkabout (3h 15m, ages 8+): $539 · Trek (4h 15m, ages 12+): $599
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
                        Dog Sled Glacier Trek (3h 15m, May–Aug): $789
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--muted)", fontSize: "0.78rem", lineHeight: 1.45 }}>
                  +$250 weight surcharge at 250+ lbs clothed · + CBJ sales tax &amp; fees · Direct
                  cancel &gt;24h refunds minus 10% admin fee (&lt;24h non-refundable)
                </td>
                <td style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                  <div>Airport (treks) &amp; Douglas Island (dog sled)</div>
                  <a
                    href={LFSE_CANONICAL_LINKS.northstar}
                    style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
                  >
                    LFSE Operator Profile ↗
                  </a>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                    <a
                      href={buildJfdViatorHandoffUrl(
                        "https://www.viator.com/searchResults/all?text=Juneau+NorthStar+Glacier+Walkabout+helicopter&pid=P00058396&mcid=42383&medium=api&campaign=jfd-dispatch-northstar",
                        {
                          productCode: "juneau-northstar-helicopter-search",
                          campaign: "jfd-dispatch-northstar",
                          date: initialDate,
                          partySize: initialPassengerCount,
                        },
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-primary"
                      style={{ whiteSpace: "nowrap", fontSize: "0.82rem", padding: "6px 12px" }}
                      aria-label="Check NorthStar Glacier Treks on Viator"
                    >
                      Check on Viator ↗
                    </a>
                    <a
                      href="https://northstartrekking.com/adventures/helicopter-glacier-walkabout/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-card"
                      style={{ whiteSpace: "nowrap", fontSize: "0.76rem", padding: "4px 8px" }}
                      aria-label="NorthStar Trekking Official Tariff Page"
                    >
                      Official Tariff ↗
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {!isSkagway && (
        <section
          className="jfd-advantage-section"
          style={{ maxWidth: "var(--content)", margin: "0 auto 40px", padding: "0 20px" }}
        >
          <div className="jfd-section-head">
            <h2>Why plan with Juneau Flight Deck?</h2>
            <p>Independent comparison and port-buffer guidance before you reach checkout.</p>
          </div>
          <div className="jfd-steps-grid">
            {BOOKING_BENEFITS.map((benefit) => (
              <article className="jfd-step-card" key={benefit.title}>
                <h3 className="jfd-step-title">{benefit.title}</h3>
                <p className="jfd-step-desc">{benefit.description}</p>
                <Link href={benefit.href}>{benefit.label} →</Link>
              </article>
            ))}
          </div>
          <p style={{ lineHeight: 1.6, marginTop: 24 }}>{BOOKING_ROLES}</p>
          <Link href="/about">More about how Juneau Flight Deck works →</Link>
        </section>
      )}

      {/* 4. How It Works */}
      <section id="how-it-works" className="jfd-steps-section">
        <div className="jfd-section-head">
          <h2>How Port-Safe Flight Planning Works</h2>
          <p>
            {VERBATIM_TWO_HOUR_BUFFER_RULE} {TWO_HOUR_BUFFER_CLARIFICATION}
          </p>
        </div>

        <div className="jfd-steps-grid">
          <div className="jfd-step-card">
            <div className="jfd-step-number">STEP 01</div>
            <h3 className="jfd-step-title">Select Your Preferred Flight Style</h3>
            <p className="jfd-step-desc">
              Compare standard glacier walks (2h 15m–2h 35m), technical ice treks (3h 15m–4h 15m),
              and seasonal May–August snow-camp dog sledding across licensed operators.
            </p>
          </div>

          <div className="jfd-step-card">
            <div className="jfd-step-number">STEP 02</div>
            <h3 className="jfd-step-title">Separate Check-In, Return Buffer &amp; All-Aboard</h3>
            <p className="jfd-step-desc">
              Verify the operator&apos;s downtown meeting point, voluntary cancellation cutoff, and
              door-to-door return time so you are back at least two hours before your ship&apos;s
              published all-aboard deadline.
            </p>
          </div>

          <div className="jfd-step-card">
            <div className="jfd-step-number">STEP 03</div>
            <h3 className="jfd-step-title">Complete Checkout with the Provider</h3>
            <p className="jfd-step-desc">
              Follow the official operator or Viator partner link, enter clothed passenger weights
              and ship details accurately, review final tax/fee totals, and save the provider&apos;s
              confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* 4b. Weather Contingency Summary */}
      <section
        id="weather-mechanics"
        style={{
          width: "min(calc(100% - 32px), var(--content))",
          margin: "0 auto 48px",
        }}
      >
        <div
          style={{
            background: "rgba(3, 14, 23, 0.75)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg, 16px)",
            padding: "24px 28px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ maxWidth: 740 }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--accent, #f0b35b)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Weather Contingency &amp; Port-Day Backup
            </span>
            <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.6, color: "#e2e8f0" }}>
              If low ceilings cancel your helicopter flight, operators issue a 100% weather refund
              under their terms. Keep a sea-level backup in mind—such as{" "}
              <a
                href={LFSE_CANONICAL_LINKS.juneauWhaleCategory}
                style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
              >
                Auke Bay whale watching on Last Frontier Shore Excursions ↗
              </a>{" "}
              (including{" "}
              <a
                href={LFSE_CANONICAL_LINKS.juneauWhaleWatch}
                style={{ color: "#9ed9ff", textDecoration: "underline", fontWeight: 700 }}
              >
                Juneau Tours &amp; Whale Watch ↗
              </a>
              ).
            </p>
          </div>
          <Link
            href="/juneau/what-to-do-if-helicopter-tour-canceled"
            className="button button-secondary"
            style={{ fontSize: "0.85rem", padding: "10px 18px" }}
          >
            Weather Cancellation Guide &rarr;
          </Link>
        </div>
      </section>

      <section className="jfd-details-section" id="details-accordion">
        <div className="jfd-section-head">
          <h2>Planning with Juneau Flight Deck</h2>
        </div>
        <div className="jfd-details-wrap">
          {BOOKING_FAQS.map(({ question, answer }) => (
            <details className="jfd-details" key={question}>
              <summary className="jfd-summary">{question}</summary>
              <div className="jfd-details-content">
                <p>{answer}</p>
              </div>
            </details>
          ))}
        </div>
        <div
          style={{
            width: "min(calc(100% - 32px), var(--content))",
            margin: "20px auto 0",
          }}
        >
          <SourcesAndFreshness includeSkagway={isSkagway} />
        </div>
      </section>

      {/* 6. Primary Action Footer / Contact Callout */}
      <section
        style={{
          padding: "40px 20px",
          background: "var(--bg)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            width: "min(calc(100% - 32px), var(--content))",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.4rem",
                fontWeight: 900,
                margin: "0 0 6px",
                color: "var(--text)",
              }}
            >
              Ready to plan your {isSkagway ? "Skagway or Juneau" : "Juneau"} flight?
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
              Compare verified operator tariffs or ask our concierge desk for port-window help.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/helicopter" className="button button-primary">
              Browse Glacier Flights
            </Link>
            <Link href="/contact" className="button button-secondary">
              Ask Our Concierge
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
