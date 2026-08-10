import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New Orleans Travel Hub",
  description: "Timing-first New Orleans authority page connected to the New Orleans specialist booking layer.",
  alternates: { canonical: "/new-orleans" },
};

const WNO = "https://welcometoneworleanstours.com";

const DECISION_PATHS = [
  ["Need something now", `${WNO}/things-to-do-in-new-orleans-today`, "Things to do in New Orleans today"],
  ["Tonight", `${WNO}/new-orleans-tours-tonight`, "Tours and experiences for tonight"],
  ["Short visit", `${WNO}/4-hours-in-new-orleans`, "What fits if you only have about four hours"],
  ["First visit", `${WNO}/first-time-new-orleans-tours`, "Good starting points for first-time visitors"],
  ["Families", `${WNO}/new-orleans-tours-for-families`, "Tour formats to compare for families"],
  ["Transportation", `${WNO}/new-orleans-tours-with-transportation`, "Tours where transportation is part of the decision"],
  ["Before a cruise", `${WNO}/things-to-do-before-a-cruise-new-orleans`, "Ideas that fit before embarkation"],
  ["After a cruise", `${WNO}/things-to-do-after-a-cruise-new-orleans`, "Ideas that fit after disembarkation"],
] as const;

export default function NewOrleansPage() {
  return (
    <main>
      <div className="wrap" style={{ display: "grid", gap: 16 }}>
        <p className="badge">DCC Destination Layer</p>
        <h1>New Orleans</h1>
        <p>Start with the constraint you actually have—time, group, transportation, or cruise timing—then move into the New Orleans specialist storefront when you are ready to compare bookable experiences.</p>

        <div className="grid grid-2">
          {DECISION_PATHS.map(([eyebrow, href, label]) => (
            <a className="card" key={href} href={href}>
              <strong>{eyebrow}</strong>
              <div>{label} ↗</div>
            </a>
          ))}
        </div>

        <div className="card" style={{ marginTop: 8 }}>
          <strong>Want the full decision map?</strong>
          <p>Welcome to New Orleans Tours groups the major buying decisions in one place instead of forcing you through a giant attraction list.</p>
          <a href={`${WNO}/high-intent-tours`}>Open the New Orleans tour decision hub ↗</a>
        </div>

        <div className="grid grid-2" style={{ marginTop: 8 }}>
          <Link className="card" href="/french-quarter-orientation">French Quarter Orientation Research</Link>
          <Link className="card" href="/new-orleans-swamp-tours">Swamp Tour Research</Link>
          <Link className="card" href="/cruises">Cruises Layer</Link>
          <Link className="card" href="/guides/category/new-orleans">New Orleans Decision Guides</Link>
        </div>
      </div>
    </main>
  );
}
