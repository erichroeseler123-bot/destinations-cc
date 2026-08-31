import type { Metadata } from "next";
import HelicopterDispatchBoard from "./components/HelicopterDispatchBoard";

export const metadata: Metadata = {
  title: "Juneau Helicopter & Glacier Tours | Cruise-Safe Alaska Excursions",
  description:
    "Compare Juneau helicopter glacier tours, Mendenhall scenery, whale-watching backups, and cruise-safe timing before opening provider booking pages.",
  alternates: { canonical: "https://juneauflightdeck.com/" },
  openGraph: {
    title: "Juneau Helicopter & Glacier Tours",
    description:
      "Compare glacier flights, Mendenhall scenery, whale-watching backups, and cruise-safe timing for a Juneau shore day.",
    url: "https://juneauflightdeck.com/",
    type: "website",
  },
};

const CP =
  "https://cruisepromenade.com/?utm_source=juneauflightdeck&utm_medium=referral&utm_campaign=alaska_cruise_planning";

export default function HomePage() {
  return (
    <>
      <HelicopterDispatchBoard portSlug="juneau" sourcePage="/" />
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
              opacity: 0.7,
            }}
          >
            Planning more than Juneau?
          </div>
          <h2 style={{ margin: "8px 0", fontSize: "clamp(24px,4vw,36px)" }}>
            Put the whole cruise in one shared plan.
          </h2>
          <p style={{ margin: "0 0 16px", lineHeight: 1.6, maxWidth: 760 }}>
            Cruise Promenade gives your group one private cruise planner for port days,
            booked activities and the plans everyone needs to see.
          </p>
          <a
            href={CP}
            style={{
              display: "inline-block",
              padding: "12px 16px",
              borderRadius: 10,
              background: "#11293d",
              color: "white",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Plan the whole cruise →
          </a>
        </div>
      </section>
    </>
  );
}
