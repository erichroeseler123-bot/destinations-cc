import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New Orleans Tours Near the French Quarter: Easy Options Without a Car",
  description:
    "Compare New Orleans tours that start in or beside the French Quarter, including river cruises, walking tours, and transported swamp tours.",
  alternates: { canonical: "/guides/new-orleans-tours-near-french-quarter" },
};

export default function ToursNearFrenchQuarterGuide() {
  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">Location-first decision guide</p>
          <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">New Orleans tours near the French Quarter</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">If you are staying in the French Quarter and do not want to rent a car, start with experiences whose check-in point is already downtown. Several current Gray Line and New Orleans Steamboat Company products meet around the riverfront at Toulouse or Saint Louis Street.</p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Operator facts last checked August 9, 2026</p>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12 md:py-16">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">75-minute riverboat</h2><p className="mt-4 text-[#ccc]">The CITY of NEW ORLEANS sightseeing cruise currently meets at 101 Saint Louis Street and lists a 75-minute cruise with 30-minute-prior boarding.</p></div>
          <div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Ghosts & Spirits</h2><p className="mt-4 text-[#ccc]">The checked two-hour walking tour meets at 400 Toulouse Street and asks guests to arrive 15 minutes early.</p></div>
          <div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Craft cocktail walk</h2><p className="mt-4 text-[#ccc]">The checked 21+ cocktail walking tour also meets at 400 Toulouse Street and currently lasts two hours.</p></div>
        </section>
        <section><h2 className="font-[var(--font-accent)] text-3xl font-bold">Want a swamp without driving yourself?</h2><p className="mt-4 max-w-3xl leading-relaxed text-[#ccc]">The transported Swamp & Bayou tour currently departs from 400 Toulouse Street and includes round-trip transportation. That is very different from the self-drive flat-boat ticket in Lafitte, which meets at 5145 Fleming Road and specifically warns that Lyft and Uber do not service the area.</p></section>
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6"><h2 className="text-2xl font-bold">The practical rule</h2><p className="mt-4 text-[#ccc]">A tour can be geographically close to the French Quarter and still require early check-in. Compare the meeting point, boarding or check-in buffer, and total duration — not just the headline tour length.</p></section>
        <section className="border-t border-[#333] pt-8"><h2 className="text-lg font-bold">Official sources checked</h2><div className="mt-4 flex flex-wrap gap-4 text-sm"><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/riverboat-cruises/75-minute-city-of-new-orleans-riverboat-cruise/" target="_blank" rel="noopener noreferrer">CITY riverboat</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/ghosts-spirits/" target="_blank" rel="noopener noreferrer">Ghosts & Spirits</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/food-drinks-tours/new-orleans-craft-cocktail-walking-tour-2/" target="_blank" rel="noopener noreferrer">Craft cocktail tour</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/swamp-tours/swamp-bayou-tour/" target="_blank" rel="noopener noreferrer">Transported swamp tour</a></div></section>
        <nav className="border-t border-[#333] pt-8 text-sm flex flex-wrap gap-5"><Link className="text-[#d4af37] underline" href="/guides/new-orleans-swamp-tour-without-a-car">Swamp tours without a car</Link><Link className="text-[#d4af37] underline" href="/guides/best-new-orleans-tours-under-4-or-6-hours">Tours under 4 or 6 hours</Link><Link className="text-[#d4af37] underline" href="/help-me-choose">Help Me Choose</Link></nav>
      </div>
    </article>
  );
}
