import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New Orleans Tours With Minimal Walking: Easier Options to Compare",
  description:
    "Compare New Orleans tours with less walking, including riverboats, vehicle sightseeing, and plantation options with current accessibility notes.",
  alternates: { canonical: "/guides/new-orleans-tours-with-minimal-walking" },
};

export default function MinimalWalkingGuide() {
  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20"><div className="mx-auto max-w-5xl"><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">Comfort-first decision guide</p><h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">New Orleans tours with minimal walking</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">If your main goal is reducing walking, look first at experiences where you can spend most of the time seated. But less walking does not automatically mean fully accessible — boarding, stairs, gravel, and transfer requirements still matter.</p><p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Operator facts last checked August 9, 2026</p></div></header>
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12 md:py-16">
        <section className="grid gap-6 md:grid-cols-3"><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Riverboat sightseeing</h2><p className="mt-4 text-[#ccc]">The 75-minute CITY riverboat offers indoor and outdoor seating and is listed as handicap accessible, with stairs required for the top deck.</p></div><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Vehicle sightseeing</h2><p className="mt-4 text-[#ccc]">For the checked City & Cemetery sightseeing format, guests with limited mobility may remain on the bus at stops. Some Garden District sidewalks are uneven if you do get off.</p></div><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Oak Alley</h2><p className="mt-4 text-[#ccc]">Oak Alley has paved paths and permits basic and motorized wheelchairs, but the second floor of the Big House requires 22 stairs; a video alternative is listed.</p></div></section>
        <section><h2 className="font-[var(--font-accent)] text-3xl font-bold">What to avoid assuming</h2><p className="mt-4 leading-relaxed text-[#ccc]">A short walking tour can still be harder than a longer seated tour. A plantation may have accessible main paths but inaccessible rooms. An airboat may involve little walking but still require passengers to board without staff assistance and is not listed as wheelchair accessible. Match the exact limitation to the operator details.</p></section>
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6"><h2 className="text-2xl font-bold">Need an accessible vehicle?</h2><p className="mt-4 text-[#ccc]">Gray Line currently asks guests to submit special accommodation requests at least 48 hours in advance so an accessible vehicle can be supplied when possible.</p></section>
        <section className="border-t border-[#333] pt-8"><h2 className="text-lg font-bold">Official sources checked</h2><div className="mt-4 flex flex-wrap gap-4 text-sm"><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/faqs/" target="_blank" rel="noopener noreferrer">Accessibility FAQ</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/riverboat-cruises/75-minute-city-of-new-orleans-riverboat-cruise/" target="_blank" rel="noopener noreferrer">CITY riverboat</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/plantation-tours/oak-alley-plantation-tour/" target="_blank" rel="noopener noreferrer">Oak Alley</a></div></section>
        <nav className="border-t border-[#333] pt-8 text-sm flex flex-wrap gap-5"><Link className="text-[#d4af37] underline" href="/guides/new-orleans-tours-limited-mobility">Limited mobility guide</Link><Link className="text-[#d4af37] underline" href="/guides/new-orleans-tours-for-grandparents-and-kids">Grandparents + kids</Link><Link className="text-[#d4af37] underline" href="/help-me-choose">Help Me Choose</Link></nav>
      </div>
    </article>
  );
}
