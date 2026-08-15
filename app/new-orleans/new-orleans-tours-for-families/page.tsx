import Link from "next/link";
import IntentTourPage from "../components/IntentTourPage";

export const metadata = {
  title: "New Orleans With Kids | Family-Friendly Tour Planning",
  description:
    "Plan New Orleans with kids using family-friendly tour formats, weather and walking considerations, age-rule reminders, and a chooser that narrows options for your group.",
  alternates: { canonical: "/guides/new-orleans-tours-for-families" },
};

const faqs = [
  {
    question: "Is New Orleans good for kids?",
    answer:
      "It can be, especially when you plan around pace, heat, walking, nap windows, and age-appropriate activities. Shorter city overviews, covered boat formats, and daytime river experiences can be easier starting points for many families.",
  },
  {
    question: "What New Orleans tours are kid friendly?",
    answer:
      "Kid fit depends on ages, duration, noise, weather exposure, walking, and operator rules. A riding-focused city tour, covered swamp boat, or daytime river cruise can be easier to evaluate first, then confirm age and participation requirements during booking.",
  },
  {
    question: "Can you take a baby on a New Orleans swamp tour?",
    answer:
      "Age and child-participation rules vary by operator and vessel type. Do not assume a baby is eligible for a particular swamp or airboat trip; confirm the current rule directly in the operator booking flow before purchasing.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <IntentTourPage
        eyebrow="New Orleans with family"
        title="New Orleans with kids without the stress"
        intro="The right family plan usually comes down to pace, time available, riding versus walking, weather exposure and the ages in your group. Start with a few formats that are easier to evaluate, then confirm the details that matter for your family before booking."
        decisionTitle="Pick the format before the attraction"
        decisionPoints={[
          "A riding-focused city overview can be easier for groups that want context without spending the whole outing on foot.",
          "A covered swamp boat can be a calmer format for families prioritizing shade and lower-intensity sightseeing.",
          "For younger travelers, verify age rules, child eligibility and any car-seat or participation requirements directly during booking.",
          "Long plantation or combination outings make more sense for families comfortable committing most of a day."
        ]}
        productSlugs={["city-tour-of-new-orleans", "covered-tour-boat", "daytime-jazz-cruise", "oak-alley-or-laura-plantation-tour"]}
        relatedLinks={[
          { href: "/help-me-choose", label: "Help me choose for my group" },
          { href: "/things-to-do-in-new-orleans-today", label: "Things to do today" },
          { href: "/guides/best-new-orleans-tours-for-a-rainy-day", label: "Rainy-day options" },
          { href: "/guides/best-new-orleans-tours-with-kids-under-6", label: "Traveling with kids under 6" }
        ]}
      />
      <section className="border-t border-[var(--nola-border)] bg-[var(--nola-bg-charcoal)] px-6 pb-16 pt-12 text-[var(--nola-ivory)]">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--nola-gold)]">Family planning FAQ</p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">A few things to check before you book</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] p-5">
                <h3 className="font-serif text-xl">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--nola-text-muted)]">{faq.answer}</p>
              </article>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/help-me-choose" className="inline-block bg-[var(--nola-gold)] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#171717]">Find the best fit for my family</Link>
          </div>
        </div>
      </section>
    </>
  );
}
