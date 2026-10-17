import type { Metadata } from "next";
import Link from "next/link";
import type { DellsCategoryItem } from "../components/DellsCategoryPage";

export const metadata: Metadata = {
  title: "Wisconsin Dells Boat Tours & Ducks | Compare the Classics",
  description:
    "Compare Wisconsin Dells boat tours, Original Wisconsin Ducks, Lower Dells vs. Upper Dells canyon walks, jet boats, Ghost Boat, and sunset cruises.",
  alternates: { canonical: "/boat-tours" },
};

const BOAT_TOUR_ITEMS: DellsCategoryItem[] = [
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

type RiverFitComparison = {
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

const BOAT_TOUR_FIT_GUIDE: RiverFitComparison[] = [
  {
    id: "upper-dells-scenic",
    title: "Upper Dells Scenic Boat Tour",
    badge: "Two signature shore landings",
    bestFor: "Visitors who want the Upper Dells scenery plus stops at Witches Gulch and Stand Rock.",
    ashoreWalks:
      "Two shore landings: Witches Gulch and Stand Rock, as listed by Dells Boat Tours.",
    splashThrill:
      "Scenic sightseeing cruise above the dam, rather than the high-speed jet boat format.",
    duration: "Approximately 2 hours, according to the operator's ticket page.",
    comfort:
      "The operator says passengers must leave wheelchairs at the dock and sit without assistance; dispatchers assist with loading and unloading. Confirm boarding and shore-walk requirements with the operator for your group's needs.",
    href: "/out/wisconsin-dells/classic-upper",
    cta: "Check Upper Dells tours",
  },
  {
    id: "lower-dells-scenic",
    title: "Lower Dells Scenic Cruise",
    badge: "One-hour scenic option",
    bestFor: "Visitors comparing a shorter scenic river trip with the two-hour Upper Dells tour.",
    ashoreWalks:
      "The operator describes a route below the dam past formations including Rocky Islands and Hawk's Bill. Confirm any boarding or shore-stop requirements directly.",
    splashThrill:
      "Scenic sightseeing cruise below the dam, rather than the high-speed jet boat format.",
    duration: "Approximately 1 hour, according to the operator's ticket page.",
    comfort:
      "The operator says passengers must leave wheelchairs at the dock and sit without assistance; dispatchers assist with loading and unloading. This is not a promise of step-free boarding.",
    href: "/out/wisconsin-dells/classic-upper",
    cta: "Check scenic tour times",
  },
  {
    id: "original-wisconsin-ducks",
    title: "Original Wisconsin Ducks",
    badge: "Classic land-to-water Duck",
    bestFor: "Visitors who want one sightseeing trip combining land and water in an amphibious vehicle.",
    ashoreWalks:
      "The published one-hour route combines Dells Scenic Park trails with the Wisconsin River, Dell Creek, and Lake Delton; it is a different format from the Upper Dells shore landings.",
    splashThrill:
      "Land-to-water Duck — an amphibious sightseeing route across trails, river, and lake.",
    duration: "Approximately 1 hour, according to Original Wisconsin Ducks.",
    comfort:
      "Original Wisconsin Ducks says passengers must leave wheelchairs at the dock and sit without assistance; dispatchers assist with loading and unloading. Confirm boarding requirements before choosing this vehicle.",
    href: "/out/wisconsin-dells/ducks-primary",
    cta: "Check Duck tickets",
  },
  {
    id: "jet-boat-adventures",
    title: "Jet Boat Adventures (Upper vs. Lower Dells)",
    badge: "High-speed wet thrill",
    bestFor:
      "Visitors who want high-speed turns and spray instead of the scenic cruise format; check current rider restrictions before booking.",
    ashoreWalks:
      "Upper Dells jet boat (~75 min) includes a Witches Gulch walk. The operator lists the Lower Dells jet boat (~50 min) as a separate river adventure; do not assume it includes the Upper Dells landing.",
    splashThrill:
      "High-splash jet boat — the operator describes spin-outs, slides, power stops, and river spray.",
    duration:
      "Approximately 50 minutes on Lower Dells or 75 minutes on Upper Dells (includes Witches Gulch), as listed on the product-specific ticket page.",
    comfort:
      "The operator's 2022 rider guide lists ages 4+ and says children age 3 and younger are not permitted. Confirm current rider restrictions and boarding needs with Jet Boat Adventures; the Upper Dells option also includes a shore walk.",
    href: "/out/wisconsin-dells/jet-boat-primary",
    cta: "Compare Upper & Lower jet boats",
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
            Compare the operator-published routes, approximate trip lengths, and boarding guidance below.
            Upper and Lower Dells are different river routes; Original Wisconsin Ducks combines land and water.
            Confirm current availability, rider restrictions, and accessibility requirements with the operator.
          </p>
        </div>

        <div className="mission-strip" aria-label="60-second river fit summary">
          <div>
            <strong>Want ashore canyon walks?</strong>
            <span>
              Choose the Upper Dells Scenic Boat Tour for both Witches Gulch and Stand Rock, or the
              75-minute Upper Dells Jet Boat for Witches Gulch with high-speed spins.
            </span>
          </div>
          <div>
            <strong>Comparing time and boarding needs?</strong>
            <span>
              Lower Dells Scenic Cruise and Original Wisconsin Ducks each run about 1 hour. Both operators say
              wheelchairs must remain at the dock and passengers must sit without assistance; dispatchers assist with
              loading and unloading. Confirm boarding needs directly rather than assuming either trip is step-free.
            </span>
          </div>
          <div>
            <strong>Want speed and spray?</strong>
            <span>
              Compare the 50-minute Lower Dells jet boat with the 75-minute Upper Dells option with a Witches Gulch
              shore walk. Check the operator's current rider restrictions before booking.
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

