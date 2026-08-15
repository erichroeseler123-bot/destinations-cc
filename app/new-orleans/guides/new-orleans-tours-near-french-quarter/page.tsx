import type { Metadata } from "next";
import Link from "next/link";

const FAQS = [
  {
    question: "What New Orleans walking tours start near the French Quarter?",
    answer: "The current catalog includes French Quarter-oriented cocktail and ghosts-and-spirits walking experiences, while other nearby options include riverfront cruises and transported tours that check in downtown. Confirm the exact meeting point and arrival time during booking.",
  },
  {
    question: "Do I need a car for tours near the French Quarter?",
    answer: "Not for many central walking and riverfront experiences. Some out-of-city tours also offer transported versions from downtown, but self-drive products can meet far outside the French Quarter, so check the specific booking option before choosing.",
  },
  {
    question: "How early should I arrive for a French Quarter tour?",
    answer: "Arrival and boarding buffers vary. Some walking tours request early check-in and river cruises may begin boarding well before departure. Use the current operator instructions rather than assuming the advertised start time is the time to arrive.",
  },
];

export const metadata: Metadata = {
  title: "French Quarter Walking Tours & Nearby New Orleans Tours | Easy Without a Car",
  description:
    "Compare French Quarter walking tours and nearby New Orleans experiences, including cocktails, ghosts, river cruises, and transported swamp tours.",
  alternates: { canonical: "/guides/new-orleans-tours-near-french-quarter" },
};

export default function ToursNearFrenchQuarterGuide() {
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
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">French Quarter walking & nearby tours</p>
          <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">French Quarter walking tours and easy nearby New Orleans options</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">If you are staying in the French Quarter and do not want to rent a car, start with experiences whose check-in point is already downtown. Walking tours, riverfront experiences and some transported regional tours can all fit that strategy, but their arrival buffers and total time commitments differ.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/help-me-choose" className="bg-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#151515]">Help Me Choose</Link><Link href="/food-tours" className="border border-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#d4af37]">Food & cocktails</Link><Link href="/ghost-tours" className="border border-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#d4af37]">Ghost tours</Link></div>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Operator facts last checked August 9, 2026</p>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12 md:py-16">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Riverfront cruise</h2><p className="mt-4 text-[#ccc]">The checked CITY of NEW ORLEANS sightseeing cruise meets at 101 Saint Louis Street and lists a 75-minute cruise with boarding before departure.</p></div>
          <div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Ghosts & Spirits walk</h2><p className="mt-4 text-[#ccc]">The checked two-hour walking tour meets at 400 Toulouse Street and asks guests to arrive before the published start time.</p></div>
          <div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Craft cocktail walk</h2><p className="mt-4 text-[#ccc]">The checked 21+ cocktail walking tour also meets at 400 Toulouse Street and currently lasts two hours.</p></div>
        </section>
        <section><h2 className="font-[var(--font-accent)] text-3xl font-bold">Want a swamp without driving yourself?</h2><p className="mt-4 max-w-3xl leading-relaxed text-[#ccc]">The transported Swamp & Bayou tour currently departs from 400 Toulouse Street and includes round-trip transportation. That is very different from self-drive swamp inventory that meets outside the city, so choose the exact transportation format rather than assuming every swamp ticket starts downtown.</p></section>
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6"><h2 className="text-2xl font-bold">The practical rule</h2><p className="mt-4 text-[#ccc]">A tour can be geographically close to the French Quarter and still require early check-in. Compare the meeting point, boarding or check-in buffer, walking exposure and total duration — not just the headline tour length.</p></section>
        <section className="border-y border-[#333] py-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Quick answers</p><h2 className="mt-3 font-[var(--font-accent)] text-3xl font-bold">Planning from the French Quarter</h2><div className="mt-7 grid gap-5 md:grid-cols-3">{FAQS.map((item) => <article key={item.question} className="border border-[#333] bg-[#1a1a1a] p-5"><h3 className="text-xl font-bold">{item.question}</h3><p className="mt-3 text-sm leading-6 text-[#ccc]">{item.answer}</p></article>)}</div></section>
        <section className="border-t border-[#333] pt-8"><h2 className="text-lg font-bold">Official sources checked</h2><div className="mt-4 flex flex-wrap gap-4 text-sm"><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/riverboat-cruises/75-minute-city-of-new-orleans-riverboat-cruise/" target="_blank" rel="noopener noreferrer">CITY riverboat</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/ghosts-spirits/" target="_blank" rel="noopener noreferrer">Ghosts & Spirits</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/food-drinks-tours/new-orleans-craft-cocktail-walking-tour-2/" target="_blank" rel="noopener noreferrer">Craft cocktail tour</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/swamp-tours/swamp-bayou-tour/" target="_blank" rel="noopener noreferrer">Transported swamp tour</a></div></section>
        <nav className="border-t border-[#333] pt-8 text-sm flex flex-wrap gap-5"><Link className="text-[#d4af37] underline" href="/food-tours">Food & cocktail tours</Link><Link className="text-[#d4af37] underline" href="/ghost-tours">Ghost tours</Link><Link className="text-[#d4af37] underline" href="/guides/new-orleans-swamp-tour-without-a-car">Swamp tours without a car</Link><Link className="text-[#d4af37] underline" href="/guides/things-to-do-in-new-orleans-today">Things to do today</Link><Link className="text-[#d4af37] underline" href="/guides/tonight">What to do tonight</Link><Link className="text-[#d4af37] underline" href="/help-me-choose">Help Me Choose</Link></nav>
      </div>
    </article>
  );
}
