import type { Metadata } from "next";
import { LandingTracker } from "../components/LandingTracker";
import { JetBoatPromos } from "../components/lounge/JetBoatPromos";
import { FEASTLY_DELLS_URL, SITE_URL } from "@/lib/content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "The Lounge | Welcome to the Dells",
  description:
    "The Lounge is the Sunday-paper section of Welcome to the Dells: supper clubs, neon, after-hours moves, and river ads woven into local texture.",
  alternates: {
    canonical: `${SITE_URL}/lounge`,
  },
};

const COLUMNS = [
  {
    eyebrow: "The Rental-House Move",
    title: "The best dinner in the Dells may be the one that never enters the strip.",
    body:
      "For big groups, the insider move is not another waitlist. It is a Feastly breakfast or dinner drop at the rental before the night splits into three cars and two bad compromises.",
  },
  {
    eyebrow: "Neon Watch",
    title: "The small signs are the real map.",
    body:
      "Wisconsin Dells still explains itself through motel signs, fudge windows, old attraction fronts, and hand-painted promises. The Lounge keeps those signals visible because they tell you where the independent Dells is still breathing.",
  },
  {
    eyebrow: "After Hours",
    title: "When the loud part of the day ends, stop trying to extend it.",
    body:
      "After hours is not another attraction hunt. It is food, a short walk, one bar, or a calm drive out of the core. If the group is tired, the adult move is to simplify the night before tomorrow's plan gets damaged.",
  },
];

export default function LoungePage() {
  return (
    <main className="lounge-page">
      <LandingTracker source="lounge" />
      <header className="lounge-masthead">
        <div>
          <p>Sunday Section</p>
          <h1>The Lounge</h1>
          <span>Welcome to the Dells</span>
        </div>
        <aside>
          <strong>Vol. 1</strong>
          <span>Supper Clubs • Neon • After Hours • River Ops</span>
        </aside>
      </header>

      <section className="lounge-lead">
        <p className="lounge-kicker">Homage and Heritage</p>
        <h2>The Dells is not one clean brand. That is the point.</h2>
        <p>
          The Lounge is where the roadside mish-mash gets treated with respect: the group-house dinner move,
          the signs, the after-dark decision, and the river ads that have always
          lived inside the local paper.
        </p>
      </section>

      <section className="lounge-grid">
        <article className="lounge-feature">
          <p className="lounge-kicker">Lead Column</p>
          <h2>Supper clubs are logistics, not nostalgia.</h2>
          <p>
            In the Dells, a good dinner plan is a pressure valve. A tired family or rental-house group
            does not need another top-ten list; it needs a way to stop the day from fragmenting into cars,
            waits, and argument. The supper-club idea matters because it changes the tempo.
          </p>
          <p>
            The rule is simple: if the day has already used up the group, do not ask the group to make a
            complex evening decision. Either commit to one circuit, or bring the Lounge back to the house.
          </p>
        </article>

        <div className="lounge-columns">
          {COLUMNS.map((column) => (
            <article className="lounge-column" key={column.eyebrow}>
              <p className="lounge-kicker">{column.eyebrow}</p>
              <h3>{column.title}</h3>
              <p>{column.body}</p>
            </article>
          ))}
        </div>

        <JetBoatPromos />
      </section>

      <footer className="lounge-footer">
        <a href="/">Return to the Front Page</a>
        <a href={`${FEASTLY_DELLS_URL}?utm_source=welcometothedells&utm_medium=satellite&utm_campaign=dells-lounge-feastly-classified`}>
          Bring dinner to the rental
        </a>
        <a href="https://www.destinationcommandcenter.com/wisconsin-dells?utm_source=welcometothedells&utm_medium=satellite&utm_campaign=dells-lounge-dcc">
          Open DCC Dells Intel
        </a>
      </footer>
    </main>
  );
}
