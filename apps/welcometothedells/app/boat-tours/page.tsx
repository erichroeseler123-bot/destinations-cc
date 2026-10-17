import type { Metadata } from "next";
import Link from "next/link";
import type { DellsCategoryItem } from "../components/DellsCategoryPage";

export const metadata: Metadata = {
  title: "Wisconsin Dells Boat Tours & Ducks | Compare the Classics",
  description:
    "Compare Wisconsin Dells boat tours, Original Wisconsin Ducks, Lower Dells vs. Upper Dells canyon walks, jet boats, Ghost Boat, and sunset cruises.",
  alternates: { canonical: "/boat-tours" },
};

export const BOAT_TOUR_ITEMS: DellsCategoryItem[] = [
  {
    title: "Original Wisconsin Ducks",
    body: "The classic amphibious road-to-river experience and an easy first-timer answer.",
    href: "/out/wisconsin-dells/ducks-primary",
    cta: "Check Duck tickets",
  },
  {
    title: "Jet Boat Adventures",
    body: "A faster, wetter, higher-energy canyon run when the group wants the river to feel like an attraction.",
    href: "/out/wisconsin-dells/jet-boat-primary",
    cta: "Check jet boat times",
  },
  {
    title: "Upper Dells Scenic Boat Tour",
    body: "The slower sandstone-and-scenery version, including the classic Upper Dells experience.",
    href: "/out/wisconsin-dells/classic-upper",
    cta: "Check scenic boat tours",
  },
  {
    title: "Sunset Dinner Cruise",
    body: "A higher-commitment evening move when you want the river and dinner solved together.",
    href: "/out/wisconsin-dells/sunset-dinner",
    cta: "Check sunset departures",
  },
  {
    title: "Ghost Boat",
    body: "An after-dark canyon experience for groups that want atmosphere instead of another daytime attraction.",
    href: "/out/wisconsin-dells/ghost-boat",
    cta: "Check Ghost Boat times",
  },
  {
    title: "Not sure which river trip fits",
    body: "Start with the first-time plan if you need help balancing a river experience with the rest of the day.",
    href: "/first-time",
    cta: "Use the first-time plan",
  },
];

export type RiverFitComparison = {
  id: string;
  title: string;
  badge: string;
  bestFor: string;
  ashoreWalks: string;
  splashThrill: string;
  duration: string;
  comfort: string;
  href: string;
  cta: string;
};

export const BOAT_TOUR_FIT_GUIDE: RiverFitComparison[] = [
  {
    id: "upper-dells-scenic",
    title: "Upper Dells Scenic Boat Tour",
    badge: "Only route with canyon walks",
    bestFor: "First-time visitors who want to walk inside the signature sandstone slot canyons.",
    ashoreWalks:
      "Yes — two exclusive shore landings with boardwalk walks through Witches Gulch and up to Stand Rock (site of the famous dog leap).",
    splashThrill:
      "Calm scenic cruise — dry, relaxed double-decker riverboat above the Kilbourn Dam with open upper and covered lower decks.",
    duration: "~2 hours total (budget 2.5 hours with downtown parking and boarding).",
    comfort:
      "Smooth boat ride for kids and seniors, but shore stops include narrow canyon steps at Witches Gulch and a steep incline at Stand Rock (strollers remain on the boat during walks).",
    href: "/out/wisconsin-dells/classic-upper",
    cta: "Check Upper Dells tours",
  },
  {
    id: "lower-dells-scenic",
    title: "Lower Dells Scenic Cruise",
    badge: "Easiest seated comfort",
    bestFor: "Seniors, low-mobility groups, and travelers wanting calm river bluffs in half the time.",
    ashoreWalks:
      "No shore walks — stays 100% on the water below the dam past Rocky Islands and wide sculpted sandstone cliffs.",
    splashThrill:
      "Calm scenic cruise — dry, gentle sightseeing on wider river channels without dock transfers.",
    duration: "~1 hour total (easy to fit before lunch or a downtown Broadway walk).",
    comfort:
      "Highest kid, senior, and mobility comfort — board once and stay seated with zero canyon stairs or trail bounce.",
    href: "/out/wisconsin-dells/classic-upper",
    cta: "Check scenic tour times",
  },
  {
    id: "original-wisconsin-ducks",
    title: "Original Wisconsin Ducks",
    badge: "Classic land-to-water Duck",
    bestFor: "Families and first-timers who want an amphibious trail-and-river adventure without shore hikes.",
    ashoreWalks:
      "No canyon walks — continuous ride across shaded wilderness trails, Dell Creek, Lake Delton, and the Lower Wisconsin River.",
    splashThrill:
      "Land-to-water Duck — moderate forest-trail bounce plus a fun, mostly dry splashdown into the river and lake.",
    duration: "~1 hour total (frequent departures along Wisconsin Dells Parkway with on-site lot parking).",
    comfort:
      "Great all-ages crowd-pleaser with zero walking once aboard, though guests must climb steep ladder-style steps to board the WWII-style amphibious vehicle.",
    href: "/out/wisconsin-dells/ducks-primary",
    cta: "Check Duck tickets",
  },
  {
    id: "jet-boat-adventures",
    title: "Jet Boat Adventures",
    badge: "High-speed wet thrill",
    bestFor: "Teens, adults, and thrill-seekers who want fast canyon spins instead of a slow narrated cruise.",
    ashoreWalks:
      "No shore walks — nonstop high-speed river run past the sandstone formations.",
    splashThrill:
      "High-splash jet boat — power stops, 360-degree spins, and heavy river spray (expect to get wet).",
    duration: "~50 minutes on the water (allow 20–30 extra minutes to dry off afterward).",
    comfort:
      "40-inch minimum height requirement; skip for toddlers, expectant mothers, or anyone avoiding hard turns and cold spray.",
    href: "/out/wisconsin-dells/jet-boat-primary",
    cta: "Check jet boat times",
  },
];

export default function Page() {
  return (
    <main style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <section className="section-shell">
        <div className="section-heading">
          <p className="eyebrow">Wisconsin Dells boat tours</p>
          <h1 style={{ fontSize: "clamp(2rem, 7vw, 6.4rem)", overflowWrap: "break-word" }}>
            The river is the reason the Dells is the Dells.
          </h1>
          <p>
            Choose by pace and mood. The controlled ticket links below lead to the current operator booking path;
            availability, times, prices, and final terms are confirmed there.
          </p>
          <div className="hero-actions" style={{ marginTop: 18 }}>
            <a className="secondary-button" href="#fit-guide" style={{ maxWidth: "100%", textAlign: "center" }}>
              Jump to 60-Second Fit Guide
            </a>
          </div>
        </div>

        <div className="action-grid">
          {BOAT_TOUR_ITEMS.map((item) => (
            <article className="action-card" key={item.title} style={{ minWidth: 0, maxWidth: "100%" }}>
              <h2 style={{ overflowWrap: "break-word" }}>{item.title}</h2>
              <p>{item.body}</p>
              <Link className="text-button" href={item.href} style={{ maxWidth: "100%", textAlign: "center" }}>
                {item.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="support-band" style={{ marginTop: 28 }}>
          <div>
            <p className="eyebrow">Planning note</p>
            <p>
              Do not stack multiple major river experiences into one day unless that is the whole point of the trip.
              Pick the version that matches your group and leave room for downtown, food, and weather.
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell" id="fit-guide" aria-labelledby="fit-guide-heading">
        <div className="section-heading">
          <p className="eyebrow">Local river decision matrix</p>
          <h2
            id="fit-guide-heading"
            style={{ fontSize: "clamp(1.65rem, 4vw, 3.2rem)", overflowWrap: "break-word" }}
          >
            Upper Dells vs. Lower Dells vs. Original Wisconsin Ducks: 60-Second Fit Guide
          </h2>
          <p>
            The Kilbourn Dam divides the Wisconsin River into two distinct sightseeing zones, and only the Upper Dells
            boat tour goes ashore inside the narrow sandstone canyons. Compare shore walks, splash level, total time,
            and mobility comfort before booking.
          </p>
        </div>

        <div className="mission-strip" aria-label="60-second river fit summary">
          <div>
            <strong>Want ashore canyon walks?</strong>
            <span>
              Choose the Upper Dells Scenic Boat Tour—the only route that docks for Witches Gulch and Stand Rock.
            </span>
          </div>
          <div>
            <strong>Want 1 hour or zero stairs?</strong>
            <span>
              Pick Lower Dells for a calm seated cruise or Original Wisconsin Ducks for a land-to-water trail splash.
            </span>
          </div>
          <div>
            <strong>Want speed and spray?</strong>
            <span>
              Book Jet Boat Adventures for 50 minutes of fast canyon spins and power stops where getting wet is part of
              the ride.
            </span>
          </div>
        </div>

        <div className="action-grid" style={{ marginTop: 16 }}>
          {BOAT_TOUR_FIT_GUIDE.map((option) => (
            <article
              className="action-card"
              key={option.id}
              style={{ minWidth: 0, maxWidth: "100%", justifyContent: "space-between" }}
            >
              <div style={{ minWidth: 0, maxWidth: "100%" }}>
                <span className="card-chip" style={{ maxWidth: "100%", overflowWrap: "break-word" }}>
                  {option.badge}
                </span>
                <h3 style={{ overflowWrap: "break-word" }}>{option.title}</h3>
                <p>{option.bestFor}</p>
                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 10,
                    margin: "14px 0 18px",
                    minWidth: 0,
                    maxWidth: "100%",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      padding: 12,
                      minWidth: 0,
                      maxWidth: "100%",
                    }}
                  >
                    <dt
                      style={{
                        color: "var(--sandstone)",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Ashore canyon walks
                    </dt>
                    <dd style={{ margin: 0, color: "var(--paper)", lineHeight: 1.5, overflowWrap: "break-word" }}>
                      {option.ashoreWalks}
                    </dd>
                  </div>
                  <div
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      padding: 12,
                      minWidth: 0,
                      maxWidth: "100%",
                    }}
                  >
                    <dt
                      style={{
                        color: "var(--sandstone)",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Splash & thrill level
                    </dt>
                    <dd style={{ margin: 0, color: "var(--paper)", lineHeight: 1.5, overflowWrap: "break-word" }}>
                      {option.splashThrill}
                    </dd>
                  </div>
                  <div
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      padding: 12,
                      minWidth: 0,
                      maxWidth: "100%",
                    }}
                  >
                    <dt
                      style={{
                        color: "var(--sandstone)",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Typical duration
                    </dt>
                    <dd style={{ margin: 0, color: "var(--paper)", lineHeight: 1.5, overflowWrap: "break-word" }}>
                      {option.duration}
                    </dd>
                  </div>
                  <div
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      padding: 12,
                      minWidth: 0,
                      maxWidth: "100%",
                    }}
                  >
                    <dt
                      style={{
                        color: "var(--sandstone)",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Kid, senior & mobility comfort
                    </dt>
                    <dd style={{ margin: 0, color: "var(--paper)", lineHeight: 1.5, overflowWrap: "break-word" }}>
                      {option.comfort}
                    </dd>
                  </div>
                </dl>
              </div>
              <Link className="text-button" href={option.href} style={{ maxWidth: "100%", textAlign: "center" }}>
                {option.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="hero-actions" style={{ marginTop: 24 }}>
          <Link className="secondary-button" href="/">
            Back to the Dells planner
          </Link>
        </div>
      </section>
    </main>
  );
}

