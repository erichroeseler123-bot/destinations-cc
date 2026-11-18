import React from "react";

export interface JuneauFlightDeckPlanningCalloutProps {
  heading?: string;
  contextLabel?: string;
  testId?: string;
}

export const JFD_GLACIER_WEATHER_URL =
  "https://juneauflightdeck.com/juneau-glacier-flight-weather";
export const JFD_WEIGHT_AND_SEATING_URL =
  "https://juneauflightdeck.com/juneau-helicopter-tour-weight-limits-and-seating";
export const JFD_CANCELED_BACKUP_URL =
  "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled";

export function JuneauFlightDeckPlanningCallout({
  heading = "Juneau Glacier Flightseeing Planning Guides",
  contextLabel = "Juneau Flight Deck · Aviation Planning Resource",
  testId = "juneau-flight-deck-planning-callout",
}: JuneauFlightDeckPlanningCalloutProps) {
  return (
    <aside className="lfse-jfd-callout" data-testid={testId}>
      <div className="lfse-jfd-callout-header">
        <span className="badge badge-safety">{contextLabel}</span>
        <h3>{heading}</h3>
        <p>
          Helicopter and floatplane departures across the Juneau Icefield depend on visual
          cloud ceilings, FAA passenger weight balance, and dock-to-heliport timing. Review
          dedicated Juneau aviation guides on{" "}
          <a
            href="https://juneauflightdeck.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Juneau Flight Deck ↗
          </a>{" "}
          before your port day:
        </p>
      </div>

      <div className="lfse-jfd-links-grid">
        <a
          href={JFD_GLACIER_WEATHER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="lfse-jfd-link-card"
        >
          <strong>Juneau VFR Ceiling &amp; FAA Weather-Cam Guide ↗</strong>
          <span>
            How cloud ceilings over Herbert, Mendenhall, Norris, and Taku Glaciers affect
            morning vs. afternoon flights.
          </span>
        </a>

        <a
          href={JFD_WEIGHT_AND_SEATING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="lfse-jfd-link-card"
        >
          <strong>Helicopter Weight Limits &amp; Seating Guide ↗</strong>
          <span>
            Compare 250–260 lb FAA weight-balance surcharge thresholds, scale check-in
            rules, and cabin seat assignments.
          </span>
        </a>

        <a
          href={JFD_CANCELED_BACKUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="lfse-jfd-link-card"
        >
          <strong>What to Do If Your Helicopter Tour Is Canceled ↗</strong>
          <span>
            Same-day Juneau weather-cancellation backup plan: Auke Bay whale boats,
            Mendenhall shuttles, and refund rules.
          </span>
        </a>
      </div>
    </aside>
  );
}
