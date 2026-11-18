import React from "react";
import {
  LFSE_CANONICAL_LINKS,
  TWO_HOUR_BUFFER_CLARIFICATION,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
  VERIFIED_TARIFF_DATE_LONG,
} from "@/lib/verifiedOperatorPricing";

export interface SourcesAndFreshnessProps {
  tone?: "dark" | "light";
  includeSkagway?: boolean;
  children?: React.ReactNode;
}

/**
 * Calm, expandable "Sources and freshness" disclosure citing primary aviation
 * weather feeds, official operator tariff pages (verified November 18, 2026),
 * and DCC regional directory verification.
 */
export default function SourcesAndFreshness({
  tone = "dark",
  includeSkagway = false,
  children,
}: SourcesAndFreshnessProps) {
  const isLight = tone === "light";

  return (
    <details
      style={{
        marginTop: 28,
        borderRadius: 14,
        border: isLight
          ? "1px solid #d5e3ef"
          : "1px solid rgba(151, 211, 255, 0.2)",
        background: isLight ? "#ffffff" : "rgba(7, 24, 36, 0.72)",
        color: isLight ? "#334155" : "rgba(228, 239, 246, 0.85)",
        padding: "14px 18px",
        fontSize: "0.84rem",
        lineHeight: 1.6,
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          fontWeight: 800,
          color: isLight ? "#071626" : "#e0f2fe",
          fontSize: "0.88rem",
          userSelect: "none",
        }}
      >
        Sources and freshness (verified {VERIFIED_TARIFF_DATE_LONG})
      </summary>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {children}

        <p style={{ margin: 0 }}>
          <strong>Independent Guide Disclosure:</strong> Juneau Flight Deck is an
          independent flightseeing education, weather-guidance, and concierge
          planning site. We do not own or operate aircraft and are not an FAA Part
          135 air carrier. Flights are operated by the named licensed carriers.
        </p>

        <p style={{ margin: 0 }}>
          <strong>Operator Tariffs &amp; Policies (verified {VERIFIED_TARIFF_DATE_LONG}):</strong>{" "}
          Published direct base prices, clothed weight-balance thresholds, seasonal
          snowpack windows, and cancellation rules were verified directly against{" "}
          <a
            href="https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isLight ? "#0369a1" : "#9ed9ff",
              textDecoration: "underline",
            }}
          >
            TEMSCO Helicopters (Juneau)
          </a>
          {includeSkagway && (
            <>
              ,{" "}
              <a
                href="https://temscoair.com/skagway-helicopter-tours/glacier-tours/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: isLight ? "#0369a1" : "#9ed9ff",
                  textDecoration: "underline",
                }}
              >
                TEMSCO Helicopters (Skagway)
              </a>
            </>
          )}
          ,{" "}
          <a
            href="https://coastalhelicopters.com/tours/icefield-excursion/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isLight ? "#0369a1" : "#9ed9ff",
              textDecoration: "underline",
            }}
          >
            Coastal Helicopters
          </a>
          ,{" "}
          <a
            href="https://northstartrekking.com/adventures/helicopter-glacier-walkabout/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isLight ? "#0369a1" : "#9ed9ff",
              textDecoration: "underline",
            }}
          >
            NorthStar Trekking
          </a>
          , and{" "}
          <a
            href="https://wingsairways.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isLight ? "#0369a1" : "#9ed9ff",
              textDecoration: "underline",
            }}
          >
            Wings Airways
          </a>
          . Final taxes, fees, and live seat availability are confirmed on the
          selected booking page at checkout.
        </p>

        <p style={{ margin: 0 }}>
          <strong>Aviation Weather &amp; Regulatory Context:</strong> Mountain-pass
          camera imagery and surface observations reference{" "}
          <a
            href="https://weathercams.faa.gov"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isLight ? "#0369a1" : "#9ed9ff",
              textDecoration: "underline",
            }}
          >
            FAA WeatherCams (weathercams.faa.gov)
          </a>
          , National Weather Service Juneau (<code>PAJN</code>) observations, and
          eCFR 14 CFR Part 135 Visual Flight Rules. Weather observations are
          supplemental context only—only the operating pilot and flight dispatcher
          make go/no-go decisions.
        </p>

        <p style={{ margin: 0 }}>
          <strong>Port Return Planning &amp; Regional Directory:</strong>{" "}
          {VERBATIM_TWO_HOUR_BUFFER_RULE} {TWO_HOUR_BUFFER_CLARIFICATION} Canonical
          Alaska operator and port profiles are maintained in the Destination
          Command Center (DCC) regional network at{" "}
          <a
            href={LFSE_CANONICAL_LINKS.juneauHelicopterTours}
            style={{
              color: isLight ? "#0369a1" : "#9ed9ff",
              textDecoration: "underline",
            }}
          >
            Last Frontier Shore Excursions (Juneau Helicopter Directory ↗)
          </a>
          .
        </p>
      </div>
    </details>
  );
}
