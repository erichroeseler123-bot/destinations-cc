import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DESCRIPTION, BOOKING_ROLES, BOOKING_BENEFITS, BOOKING_FAQS } from "@/lib/sitePositioning";

export const metadata: Metadata = {
  title: "Why Book with Juneau Flight Deck?",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "https://juneauflightdeck.com/about" },
};

export default function AboutPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BOOKING_FAQS.map(({ question, answer }) => ({
      "@type": "Question", name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  return (
    <main className="page-shell static-page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="static-page-card">
        <p className="eyebrow">Why choose Juneau Flight Deck</p>
        <h1 className="static-page-title">A tour that fits your group, your ship, and your Juneau day.</h1>
        <p className="chooser-trust-line">{SITE_DESCRIPTION}</p>
        <p>Start with us whether you are ready to book a glacier landing, a longer ice walk, dog sledding, or whale watching. We bring the choices and cruise planning details together, with help when you have questions.</p>
        <div style={{ display: "grid", gap: 20, margin: "28px 0" }}>
          {BOOKING_BENEFITS.map((benefit) => (
            <section key={benefit.title}>
              <h2>{benefit.title}</h2>
              <p>{benefit.description}</p>
              <Link href={benefit.href}>{benefit.label} →</Link>
            </section>
          ))}
        </div>
        <h2>Choose your tour here. Know who handles your reservation.</h2>
        <p>{BOOKING_ROLES}</p>
        <p>Compare the final price, inclusions, restrictions, pickup details, and cancellation policy on the specific booking page. Terms can differ between direct operator bookings and third-party channels.</p>
        <p>Juneau Flight Deck is an independent excursion booking and comparison service. It is separate from Alaska Fish &amp; Chips Company at the Flight Deck restaurant at Merchants Wharf.</p>
        <h2>If your date has no suitable online option</h2>
        <p>You can submit an availability request with your ship, port date, and party size. This is an additional planning service; it does not hold a seat or guarantee an opening. Confirm any departure with the booking provider before paying.</p>
        <h2>Questions about booking with us</h2>
        {BOOKING_FAQS.map(({ question, answer }) => (
          <section key={question}><h3>{question}</h3><p>{answer}</p></section>
        ))}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <Link href="/helicopter" className="primary-cta">Find Your Tour</Link>
          <Link href="/contact" className="button button-secondary">Ask Our Team</Link>
        </div>
      </section>
    </main>
  );
}
