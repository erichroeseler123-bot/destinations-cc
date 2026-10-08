import type { Metadata } from "next";
import HelicopterDispatchBoard from "./components/HelicopterDispatchBoard";

export const metadata: Metadata = {
  title: {
    absolute: "Juneau Helicopter Tours & Glacier Excursions | Compare & Book | Juneau Flight Deck",
  },
  description:
    "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.",
  alternates: { canonical: "https://juneauflightdeck.com/" },
  openGraph: {
    title: "Juneau Helicopter Tours & Glacier Excursions | Compare & Book | Juneau Flight Deck",
    description:
      "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans.",
    url: "https://juneauflightdeck.com/",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Helicopter Tours & Glacier Excursions | Compare & Book",
    description:
      "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans.",
  },
};

const CP =
  "https://cruisepromenade.com/?utm_source=juneauflightdeck&utm_medium=referral&utm_campaign=alaska_cruise_planning";

export default function HomePage() {
  return (
    <main id="main-content">
      <HelicopterDispatchBoard
        portSlug="juneau"
        sourcePage="/"
        headline="Compare & Book Juneau Helicopter & Glacier Excursions"
        subhead="Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers."
        primaryCtaLabel="Find Your Tour"
      />
      <section
        aria-label="Plan the rest of your cruise"
        style={{ maxWidth: 1120, margin: "0 auto 52px", padding: "0 20px" }}
      >
        <div
          style={{
            border: "1px solid rgba(17,41,61,.18)",
            borderRadius: 18,
            padding: "24px 26px",
            background: "#f5f8fa",
            color: "#11293d",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "#334155",
            }}
          >
            Planning more than Juneau?
          </div>
          <h2 style={{ margin: "8px 0", fontSize: "clamp(24px,4vw,36px)" }}>
            Put the whole cruise in one shared plan.
          </h2>
          <p style={{ margin: "0 0 16px", lineHeight: 1.6, maxWidth: 760, color: "#1e293b" }}>
            Cruise Promenade gives your group one private cruise planner for port days,
            booked activities and the plans everyone needs to see.
          </p>
          <a
            href={CP}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Plan the whole cruise on Cruise Promenade (opens in new tab)"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: 10,
              background: "#11293d",
              color: "#ffffff",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Plan the whole cruise →
          </a>
        </div>
      </section>
    </main>
  );
}
