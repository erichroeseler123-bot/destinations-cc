import type { Metadata } from "next";
import Link from "next/link";
import LiveNightGuide from "../../components/LiveNightGuide";

export const metadata: Metadata = {
  title: "What to Do in New Orleans Tonight | Live Events & Evening Tours",
  description:
    "See what is happening in New Orleans tonight, then pair live events with dinner, evening tours, and a quick chooser for your group and timing.",
  alternates: { canonical: "/guides/tonight" },
};

const faqs = [
  {
    question: "What are some good things to do in New Orleans at night?",
    answer:
      "Live music, an evening river cruise, a ghost or spirits walk, and a cocktail-focused outing are common evening formats. The best choice depends on your group, start time, walking tolerance, and how late you want to stay out.",
  },
  {
    question: "Is Frenchmen Street worth visiting at night?",
    answer:
      "Frenchmen Street can be a useful live-music anchor for an evening, but venue schedules and cover policies change. Check current event and venue details before building the rest of your night around a specific performance.",
  },
  {
    question: "What time do New Orleans jazz cruises leave?",
    answer:
      "Departure times vary by cruise, date, and operating schedule. Use the current operator booking path for the specific cruise to confirm tonight's departure time, boarding instructions, pricing, and availability.",
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

export default function TonightGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LiveNightGuide
        window="tonight"
        title="What can we do tonight?"
        eyebrow="Tonight in New Orleans"
        intro="Start with what is actually happening around town tonight, then build dinner and the rest of the evening around it."
      />
      <section className="border-t border-[#d4af37]/20 bg-[#0b090c] px-6 py-14 text-[#fdfbf7]">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Tonight, simplified</p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Quick answers before you head out</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-serif text-xl">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">{faq.answer}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/guides/things-to-do-in-new-orleans-today" className="border border-[#d4af37]/35 px-4 py-2 text-sm hover:border-[#d4af37]">Things to do today</Link>
            <Link href="/guides/where-to-eat" className="border border-[#d4af37]/35 px-4 py-2 text-sm hover:border-[#d4af37]">Where to eat</Link>
            <Link href="/help-me-choose" className="bg-[#d4af37] px-4 py-2 text-sm font-bold text-[#171717]">Help Me Choose</Link>
          </div>
        </div>
      </section>
    </>
  );
}
