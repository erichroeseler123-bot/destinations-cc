import type { Metadata } from "next";
import Link from "next/link";
import { FAMILY_TOURS } from "../../lib/familyTours";
import { FactEvidence } from "../components/FamilyTourFacts";
import { getTodayNewOrleansDate } from "../../lib/timezone";
export const revalidate = 86400;

const CANONICAL_URL = "https://welcometotheswamp.com/transportation";

export const metadata: Metadata = {
  title: "How to Get to a New Orleans Swamp Tour Without a Car",
  description:
    "Compare New Orleans swamp tour hotel pickup and central departures, operator-specific rideshare warnings, total outing times and the booking details to confirm.",
  alternates: { canonical: CANONICAL_URL },
  openGraph: {
    title: "How to Get to a New Orleans Swamp Tour Without a Car",
    description:
      "Compare hotel pickup, central transport and self-drive products using sourced operator rules and total outing estimates.",
    url: CANONICAL_URL,
    type: "article",
  },
};

const transportationFaq = [
  {
    question: "Can you take an Uber or Lyft to a New Orleans swamp tour?",
    answer:
      "Check the exact dock before relying on rideshare. Airboat Adventures says cab and Uber/Lyft services are not available at its location; Louisiana Tour Company warns that a return ride may be difficult. Compare an operator’s round-trip transport option or confirm a separate return arrangement instead of assuming a one-way ride solves the trip.",
  },
  {
    question: "Where do swamp tour shuttles pick up in New Orleans?",
    answer:
      "Pickup rules vary by product. Cajun Encounters lists select French Quarter hotels and downtown visitor centers. Airboat Adventures excludes residential and Airbnb pickup. Gray Line’s reviewed large-airboat package departs from 400 Toulouse Street. Confirm your actual meeting point; do not assume any nearby hotel accepts pickups.",
  },
  {
    question: "How long does a swamp tour take with hotel pickup included?",
    answer:
      "The captured operator information differs: Cajun Encounters advises about 4–5 hours with transportation, Louisiana Tour Company lists about four hours for its pickup airboat variant, and Gray Line lists 3 hours 45 minutes from its central departure. Add meeting-point travel and a return buffer; none is a guaranteed door-to-door return time.",
  },
  {
    question: "Is it worth renting a car just for a swamp tour?",
    answer:
      "Compare the complete group transport quote against rental, fuel, parking and any child-seat costs. The better choice depends on party size, your hotel’s eligibility, the actual dock and any other driving plans. A lower drive-out ticket price alone does not establish a cheaper total day.",
  },
];

export default function TransportationPage() {
  const asOf = getTodayNewOrleansDate();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: transportationFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main className="page-stack" data-page-intent="compare">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="hero-card hero-guide">
        <div className="router-head">
          <p className="eyebrow">Bayou Logistics Guide</p>
          <div className="intent-pill">No-Car Planning</div>
        </div>
        <h1>How do you get to a New Orleans swamp tour without renting a car?</h1>
        <p className="lede">
          Choose a product that offers hotel transportation or a central departure you can reach, then confirm the exact meeting point, full outing time and return arrangement. Hotel pickup is not included in every ticket, and a rental address may not qualify. Compare the actual product before booking.
        </p>
      </section>

      {/* The Rideshare Warning */}
      <section className="panel">
        <p className="eyebrow">Important travel warning</p>
        <article className="info-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <h2>Can you take an Uber or Lyft to a swamp tour?</h2>
          <p className="muted" style={{ marginBottom: "12px" }}>
            The practical answer: <strong>confirm return transport at the exact dock before relying on a one-way rideshare.</strong>
          </p>
          <p className="muted" style={{ marginBottom: "12px" }}>
            Airboat Adventures explicitly warns that cab and Uber/Lyft services are not available at its location. Louisiana Tour Company warns that getting a return ride can be difficult. These are operator-specific warnings; check the dock and product you will actually book.
          </p>
          <p className="muted">
            A hotel-transport option or central coach departure can address a no-car plan, but your meeting point and return arrangements still need confirmation. Review the <Link href="/with-kids#published-rules">published product-level transport rules</Link> rather than assuming all swamp tours operate the same way.
          </p>
          <p><a href="https://airboatadventures.com/swamp-tours/" target="_blank" rel="noopener noreferrer">Airboat Adventures transport warning</a> · <a href="https://louisianaswamp.com/swamp-tours/airboat-swamp-tour/" target="_blank" rel="noopener noreferrer">Louisiana Tour Company return-ride warning</a>. Source checks: October 21, 2026.</p>
        </article>
      </section>

      {/* Side by side: Self drive vs shuttle */}
      <section className="panel">
        <p className="eyebrow">Transportation options</p>
        <div className="stack-list">
          <article className="info-card">
            <h2>Option 1: Roundtrip Hotel Shuttle (Recommended for Most Visitors)</h2>
            <p className="muted" style={{ marginBottom: "12px" }}>
              Some products offer a hotel-transport add-on and others include transport in the selected variant. Coverage is operator-specific; an Airbnb or residential address is not automatically eligible.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <strong>Pros</strong>
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  The operator arranges the selected round-trip transport service. Confirm its meeting point, return drop-off and timing instead of assuming an immediate return.
                </p>
              </div>
              <div>
                <strong>Keep in mind</strong>
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  Published total durations and pickup windows differ. Check the sourced product examples below and the instructions for your actual departure.
                </p>
              </div>
            </div>
          </article>

          <article className="info-card">
            <h2>Option 2: Self-Drive to the Dock</h2>
            <p className="muted" style={{ marginBottom: "12px" }}>
              Ideal if you already have a personal vehicle or a rental car for a broader Louisiana road trip.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <strong>Pros</strong>
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  A drive-out ticket may reduce the operator’s transport charge, but compare the total cost of the vehicle, parking, fuel and any child seats. Confirm the actual dock address.
                </p>
              </div>
              <div>
                <strong>Keep in mind</strong>
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  Follow the selected operator’s check-in instructions; lead times differ. Include return travel and any parking requirements in your day plan.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Timeline breakdown */}
      <section className="panel">
        <p className="eyebrow">Trip timing</p>
        <article className="info-card">
          <h2>How much total time should you budget?</h2>
          <p className="muted" style={{ marginBottom: "16px" }}>
            There is no universal pickup-to-return schedule. These captured operator estimates apply to the listed products; exact departure times, transport coverage and return arrangements still need confirmation.
          </p>
          <div className="stack-list">
            {FAMILY_TOURS.filter(t => ["ce-original", "ltc-large-pickup", "gray-large"].includes(t.id)).map(t => <div key={t.id}>
              <h3>{t.operator} — {t.name}</h3>
              <FactEvidence fact={t.facts.pickup} asOf={asOf}/>
              <FactEvidence fact={t.facts.totalMinutes} asOf={asOf}/>
              <p><Link href={`/with-kids#compare-${t.id}`}>Review this product’s full rules and sources →</Link></p>
            </div>)}
          </div>
        </article>
      </section>

      {/* Next steps */}
      <section className="panel">
        <p className="eyebrow">Compare departures</p>
        <article className="info-card">
          <h2>Ready to pick a tour that includes transportation?</h2>
          <p className="muted" style={{ marginBottom: "16px" }}>
            Compare hotel-transport and central-departure products, then confirm pickup eligibility, child rules and your return deadline for the selected option.
          </p>
          <div className="cta-row">
            <Link className="button" href="/plan?intent=compare&topic=swamp-tours&subtype=transportation&context=no-car">
              See tours with hotel pickup →
            </Link>
            <Link className="button-secondary" href="/airboat-vs-boat">
              Airboat vs covered boat guide
            </Link>
            <Link className="button-secondary" href="/with-kids">
              Compare child restrictions and pickup rules
            </Link>
          </div>
        </article>
      </section>

      {/* FAQ section */}
      <section className="panel">
        <p className="eyebrow">Common questions</p>
        <div className="stack-list">
          {transportationFaq.map((item) => (
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

