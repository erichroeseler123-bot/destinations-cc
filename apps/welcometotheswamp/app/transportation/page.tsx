import type { Metadata } from "next";
import Link from "next/link";

const CANONICAL_URL = "https://welcometotheswamp.com/transportation";

export const metadata: Metadata = {
  title: "How to Get to a New Orleans Swamp Tour Without a Car",
  description:
    "Visiting New Orleans without a rental car? Learn how hotel shuttle pickups work, why relying on Uber to return from rural bayous is risky, and how much time to budget.",
  alternates: { canonical: CANONICAL_URL },
  openGraph: {
    title: "How to Get to a New Orleans Swamp Tour Without a Car",
    description:
      "Essential transportation advice for New Orleans swamp tours: why rideshares get stranded, how hotel shuttles work, and self-drive dock check-in.",
    url: CANONICAL_URL,
    type: "article",
  },
};

const transportationFaq = [
  {
    question: "Can you take an Uber or Lyft to a New Orleans swamp tour?",
    answer:
      "Getting an Uber or Lyft from the French Quarter or Downtown out to a swamp tour dock is generally easy, but getting a ride back to the city is notoriously difficult. Most swamp docks are located 35 to 50 minutes outside New Orleans in rural bayous with sparse cell coverage and few available drivers. If you don't have a rental car, booking a tour package that includes roundtrip shuttle transportation is much safer.",
  },
  {
    question: "Where do swamp tour shuttles pick up in New Orleans?",
    answer:
      "Most operators pick up from designated hotel clusters in the French Quarter, Downtown/Central Business District (CBD), and the Warehouse District. If you are staying at an Airbnb or boutique hotel, you will usually meet the shuttle at the nearest major hotel lobby.",
  },
  {
    question: "How long does a swamp tour take with hotel pickup included?",
    answer:
      "Plan on roughly 4 to 4.5 hours total door-to-door. This includes approximately 45 minutes of travel time in each direction, 15 to 30 minutes for dockside check-in and safety briefings, and a 90 to 100 minute guided boat tour.",
  },
  {
    question: "Is it worth renting a car just for a swamp tour?",
    answer:
      "Usually not. Parking in the French Quarter or Downtown is expensive ($40–$60 per day). Unless you are also planning a multi-day road trip to plantation homes, Cajun Country, or Baton Rouge, paying for a tour with roundtrip hotel transportation is typically cheaper and much simpler.",
  },
];

export default function TransportationPage() {
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
          Louisiana&apos;s best bayous are located 35 to 50 minutes outside downtown New Orleans. If you don&apos;t have a car, choosing the right transportation setup is the difference between a smooth morning and getting stranded out in the marsh.
        </p>
      </section>

      {/* The Rideshare Warning */}
      <section className="panel">
        <p className="eyebrow">Important travel warning</p>
        <article className="info-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <h2>Can you take an Uber or Lyft to a swamp tour?</h2>
          <p className="muted" style={{ marginBottom: "12px" }}>
            The short answer is: <strong>taking a rideshare there is easy, but getting back can ruin your day.</strong>
          </p>
          <p className="muted" style={{ marginBottom: "12px" }}>
            Swamp tour docks (in areas like Barataria, Jean Lafitte, Des Allemands, or Slidell) are located in rural wetlands. While a city rideshare driver will happily accept a \$40–\$60 fare from the French Quarter to drop you off, there are rarely active drivers waiting around rural parish docks when your boat returns 2 hours later.
          </p>
          <p className="muted">
            Couples and groups regularly find themselves stuck for over an hour trying to call an Uber with 1 bar of cell reception. If you don&apos;t have your own car, <strong>always book a tour package with hotel transportation included</strong>.
          </p>
        </article>
      </section>

      {/* Side by side: Self drive vs shuttle */}
      <section className="panel">
        <p className="eyebrow">Transportation options</p>
        <div className="stack-list">
          <article className="info-card">
            <h2>Option 1: Roundtrip Hotel Shuttle (Recommended for Most Visitors)</h2>
            <p className="muted" style={{ marginBottom: "12px" }}>
              Air-conditioned passenger vans and mini-buses pick you up right from or near your French Quarter, Downtown, or Warehouse District hotel.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <strong>Pros</strong>
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  Zero driving stress, no expensive French Quarter parking fees, guaranteed return ride immediately after your tour finishes.
                </p>
              </div>
              <div>
                <strong>Keep in mind</strong>
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  Total trip takes roughly 4 to 4.5 hours. Pickups start 45–60 minutes before departure time as the shuttle stops at a few designated hotel points.
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
                  Maximum schedule flexibility. You only pay for the boat tour (saving \$20–\$30 per person) and can combine the trip with a plantation visit or local seafood lunch.
                </p>
              </div>
              <div>
                <strong>Keep in mind</strong>
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  Must arrive at least 30 minutes before departure for check-in. Don&apos;t rent a car solely for this trip; downtown overnight parking will erase any ticket savings.
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
            Here is what a standard morning swamp tour looks like with hotel pickup:
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "6px" }}>
              <strong>8:30 AM – 8:50 AM:</strong> Shuttle pickup at your French Quarter / Downtown hotel
            </div>
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "6px" }}>
              <strong>9:00 AM – 9:45 AM:</strong> Scenic drive across the river out to the bayou
            </div>
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "6px" }}>
              <strong>10:00 AM – 11:40 AM:</strong> Guided swamp boat or airboat tour
            </div>
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "6px" }}>
              <strong>11:45 AM – 12:45 PM:</strong> Return ride back to your hotel, right in time for lunch
            </div>
          </div>
        </article>
      </section>

      {/* Next steps */}
      <section className="panel">
        <p className="eyebrow">Compare departures</p>
        <article className="info-card">
          <h2>Ready to pick a tour that includes transportation?</h2>
          <p className="muted" style={{ marginBottom: "16px" }}>
            Compare operators that offer verified French Quarter and Downtown hotel shuttle pickups alongside self-drive options.
          </p>
          <div className="cta-row">
            <Link className="button" href="/plan?intent=compare&topic=swamp-tours&subtype=transportation&context=no-car">
              See tours with hotel pickup →
            </Link>
            <Link className="button-secondary" href="/airboat-vs-boat">
              Airboat vs covered boat guide
            </Link>
            <Link className="button-secondary" href="/with-kids">
              Visiting with kids?
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
