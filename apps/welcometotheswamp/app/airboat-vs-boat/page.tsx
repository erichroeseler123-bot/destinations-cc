import type { Metadata } from "next";
import Link from "next/link";

const URL = "https://welcometotheswamp.com/airboat-vs-boat";

export const metadata: Metadata = {
  title: "Airboat vs Covered Swamp Boat in New Orleans | Which Tour Fits?",
  description:
    "Compare New Orleans airboat vs covered swamp boat tours by ride intensity, noise, weather exposure, family fit, transportation, and the kind of swamp experience you actually want.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Airboat vs Covered Swamp Boat in New Orleans",
    description:
      "A decision-first comparison of the two main New Orleans swamp-tour styles before you choose a tour.",
    url: URL,
    type: "article",
  },
};

const rows = [
  {
    question: "Ride style",
    airboat: "Faster, louder, open-air, and more ride-driven.",
    covered: "Slower, calmer, and easier to treat as a scenic bayou outing.",
  },
  {
    question: "Best reason to choose it",
    airboat: "The speed and open-air airboat experience are part of what you want to remember.",
    covered: "The wetland scenery, conversation, and easier pacing matter more than speed.",
  },
  {
    question: "Noise",
    airboat: "Expect a high-noise experience and follow the operator's hearing-protection and safety instructions.",
    covered: "Usually the easier choice when lower noise and conversation matter to the group.",
  },
  {
    question: "Weather exposure",
    airboat: "More exposed to sun, wind, rain, and operating-condition changes.",
    covered: "More shelter is typical, although it is still an outdoor swamp experience.",
  },
  {
    question: "Families and mixed groups",
    airboat: "Can be a great fit when everyone wants the intensity and meets the current operator rules.",
    covered: "The safer default for a mixed group when comfort and broad fit matter more than thrill.",
  },
  {
    question: "Wildlife",
    airboat: "Do not choose it because someone promised more wildlife. Sightings vary.",
    covered: "Do not choose it because someone promised more wildlife. Sightings vary.",
  },
  {
    question: "Pickup and logistics",
    airboat: "Compare the specific operator's meeting point, transportation option, total duration, and return plan.",
    covered: "Compare the specific operator's meeting point, transportation option, total duration, and return plan.",
  },
] as const;

const faq = [
  {
    question: "Is an airboat or covered swamp boat better for families?",
    answer:
      "A covered boat is usually the easier default for mixed-age or comfort-first groups. An airboat can be the better choice when everyone actively wants the faster, louder ride and meets the operator's current age, health, and boarding requirements.",
  },
  {
    question: "Will an airboat see more wildlife than a covered swamp boat?",
    answer:
      "No tour format can guarantee better wildlife sightings. Choose by ride style, group fit, weather exposure, and logistics rather than assuming one boat type guarantees more animals.",
  },
  {
    question: "Which swamp tour is better if the weather looks uncertain?",
    answer:
      "A covered boat generally gives you more shelter. Airboat operation can be more sensitive to conditions, so check the operator's current weather and substitution policy before leaving.",
  },
] as const;

export default function AirboatVsCoveredBoatPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main className="page-stack" data-page-intent="compare">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="hero-card hero-guide">
        <div className="router-head">
          <p className="eyebrow">New Orleans swamp tour comparison</p>
          <div className="intent-pill">Airboat vs covered boat</div>
        </div>
        <h1>Airboat vs covered swamp boat: which New Orleans tour fits you?</h1>
        <p className="lede">
          Choose the airboat when the faster, louder, open-air ride is part of the reason you are going. Choose the covered boat when you want a calmer, more sheltered swamp experience that is easier for a mixed group. Then compare the actual operator rules, pickup, duration, and weather terms before booking.
        </p>
      </section>

      <section className="panel">
        <p className="eyebrow">Fast answer</p>
        <div className="stack-list">
          <article className="info-card">
            <h2>Choose an airboat if the ride itself is the attraction.</h2>
            <p className="muted">Speed, noise, open-air exposure, and a more intense experience should be positives for your group—not surprises.</p>
          </article>
          <article className="info-card">
            <h2>Choose a covered swamp boat if the swamp itself is the attraction.</h2>
            <p className="muted">A steadier pace, more shelter, and easier mixed-group fit make the covered format the simpler default for many first-time visitors.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Side-by-side</p>
        <div className="stack-list">
          {rows.map((row) => (
            <article className="info-card" key={row.question}>
              <h2>{row.question}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <strong>Airboat</strong>
                  <p className="muted">{row.airboat}</p>
                </div>
                <div>
                  <strong>Covered swamp boat</strong>
                  <p className="muted">{row.covered}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Before you book</p>
        <article className="info-card">
          <h2>Boat type is only half the decision.</h2>
          <p className="muted">
            Check the exact operator's current age and boarding rules, total excursion duration, meeting point or transportation, weather policy, cancellation terms, and accessibility details. Those can matter more than the boat label once you narrow the ride style.
          </p>
          <div className="cta-row">
            <Link className="button" href="/plan?intent=compare&topic=swamp-tours&subtype=airboat-vs-boat&context=first-time">See the right shortlist →</Link>
            <Link className="button-secondary" href="/transportation">Compare pickup and transportation</Link>
            <Link className="button-secondary" href="/with-kids">Planning with kids?</Link>
          </div>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Quick answers</p>
        <div className="stack-list">
          {faq.map((item) => (
            <article className="info-card" key={item.question}>
              <h2>{item.question}</h2>
              <p className="muted">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
