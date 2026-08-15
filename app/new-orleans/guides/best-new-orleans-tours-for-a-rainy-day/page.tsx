import type { Metadata } from "next";
import Link from "next/link";

const FAQS = [
  {
    question: "What New Orleans tour is best on a rainy day?",
    answer: "Start with formats that reduce weather exposure, such as a covered swamp boat or a riverboat with indoor seating. Then confirm the specific operator's current departure and weather policy because severe conditions can still change or cancel service.",
  },
  {
    question: "Do New Orleans swamp tours run in the rain?",
    answer: "Some covered swamp tours are marketed as operating rain or shine, but lightning, flooding, wind and other severe conditions can still affect departures. Re-check the operator before leaving for the meeting point.",
  },
  {
    question: "Is an airboat a good rainy-day choice?",
    answer: "Airboats are open-air and are more weather-exposed than covered boats. The checked operator says poor weather can shorten, postpone or substitute an airboat departure, so a covered format is the safer planning default when rain risk is high.",
  },
];

export const metadata: Metadata = {
  title: "New Orleans Rainy Day Ideas | Tours That Work Better in Rain",
  description: "Compare New Orleans rainy-day tour options using current operator weather policies, covered-boat details, indoor seating, and walking exposure.",
  alternates: { canonical: "/guides/best-new-orleans-tours-for-a-rainy-day" },
};

export default function RainyDayGuide() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">Weather decision guide</p>
          <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">New Orleans rainy-day ideas that still make sense</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">Rain does not automatically cancel a New Orleans tour, but it changes which format is comfortable. Covered swamp boats and riverboats with indoor seating are stronger starting points than exposed airboats or walking-heavy itineraries.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/help-me-choose" className="bg-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#151515]">Help Me Choose</Link><Link href="/guides/things-to-do-in-new-orleans-today" className="border border-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#d4af37]">See today's options</Link></div>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Weather policies last checked August 9, 2026</p>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12 md:py-16">
        <section className="grid gap-6 md:grid-cols-3"><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Covered swamp boat</h2><p className="mt-4 text-[#ccc]">Gray Line says its swamp tours operate rain or shine and covered swamp boats make touring in rain possible. Extreme weather can still cancel or change operations.</p></div><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Riverboat cruise</h2><p className="mt-4 text-[#ccc]">The checked CITY of NEW ORLEANS sightseeing cruise has indoor and outdoor seating, so a rainy day does not mean the entire experience must be outside.</p></div><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Airboat</h2><p className="mt-4 text-[#ccc]">Airboats are open-air. The operator warns guests they may get wet and says bad weather can shorten, postpone, or substitute the tour with a covered boat.</p></div></section>
        <section><h2 className="font-[var(--font-accent)] text-3xl font-bold">Rainy-day tradeoffs</h2><div className="mt-6 space-y-4 text-[#ccc]"><p><strong className="text-white">Walking tours:</strong> two hours can sound short, but uneven sidewalks and steady rain can make them feel much longer.</p><p><strong className="text-white">Plantations:</strong> some exhibits are indoors, but grounds and walking remain part of the experience.</p><p><strong className="text-white">Covered does not mean weather-proof:</strong> lightning, flooding, wind, or other severe conditions can still affect departures.</p></div></section>
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6"><h2 className="text-2xl font-bold">Best planning move</h2><p className="mt-4 text-[#ccc]">Choose the format with the least weather exposure, then re-check the exact operator departure before leaving your hotel. Do not assume “rain or shine” means every departure will operate unchanged.</p></section>
        <section className="border-y border-[#333] py-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Quick answers</p><h2 className="mt-3 font-[var(--font-accent)] text-3xl font-bold">Planning around rain</h2><div className="mt-7 grid gap-5 md:grid-cols-3">{FAQS.map((item) => <article key={item.question} className="border border-[#333] bg-[#1a1a1a] p-5"><h3 className="text-xl font-bold">{item.question}</h3><p className="mt-3 text-sm leading-6 text-[#ccc]">{item.answer}</p></article>)}</div></section>
        <section className="border-t border-[#333] pt-8"><h2 className="text-lg font-bold">Official sources checked</h2><div className="mt-4 flex flex-wrap gap-4 text-sm"><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/swamp-tours/swamp-boat-cruise-oak-alley-plantation-tour-new-orleans/" target="_blank" rel="noopener noreferrer">Covered swamp boat weather policy</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/swamp-tours/small-airboat-swamp-adventure-tour/" target="_blank" rel="noopener noreferrer">Airboat weather policy</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/riverboat-cruises/75-minute-city-of-new-orleans-riverboat-cruise/" target="_blank" rel="noopener noreferrer">Riverboat seating</a></div></section>
        <nav className="border-t border-[#333] pt-8 text-sm flex flex-wrap gap-5"><Link className="text-[#d4af37] underline" href="/compare/covered-swamp-boat-vs-airboat">Covered boat vs airboat</Link><Link className="text-[#d4af37] underline" href="/guides/new-orleans-tours-limited-mobility">Limited mobility</Link><Link className="text-[#d4af37] underline" href="/guides/things-to-do-in-new-orleans-today">Things to do today</Link><Link className="text-[#d4af37] underline" href="/guides/tonight">What to do tonight</Link><Link className="text-[#d4af37] underline" href="/help-me-choose">Help Me Choose</Link></nav>
      </div>
    </article>
  );
}
