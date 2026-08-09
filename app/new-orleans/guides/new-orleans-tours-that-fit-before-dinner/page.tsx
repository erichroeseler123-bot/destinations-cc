import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New Orleans Tours That Fit Before Dinner: Shorter Afternoon Options",
  description:
    "Compare shorter New Orleans tours that can work before dinner, including riverboat, ghost, cocktail, and other compact formats with real check-in buffers.",
  alternates: { canonical: "/guides/new-orleans-tours-that-fit-before-dinner" },
};

export default function ToursBeforeDinnerGuide() {
  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20"><div className="mx-auto max-w-5xl"><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">Schedule-fit decision guide</p><h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">New Orleans tours that fit before dinner</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">If dinner is the fixed part of your evening, choose by the full time block — check-in, boarding, tour length, and travel back — not just the advertised duration. Shorter downtown formats are the easiest starting point.</p><p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Operator facts last checked August 9, 2026</p></div></header>
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12 md:py-16">
        <section className="grid gap-6 md:grid-cols-3"><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">75-minute riverboat</h2><p className="mt-4 text-[#ccc]">The CITY sightseeing cruise currently lists a 3:00 PM boarding and 3:30–4:45 PM cruise. The operator asks guests to arrive 30 minutes before cruising.</p></div><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Two-hour walking tour</h2><p className="mt-4 text-[#ccc]">Ghosts & Spirits is currently a two-hour format with 15-minute-prior check-in. Exact departure availability varies by date.</p></div><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Two-hour cocktail tour</h2><p className="mt-4 text-[#ccc]">The standard craft cocktail walk is also two hours with 15-minute-prior check-in and is restricted to guests 21+.</p></div></section>
        <section><h2 className="font-[var(--font-accent)] text-3xl font-bold">Do not schedule to the minute</h2><p className="mt-4 leading-relaxed text-[#ccc]">A tour ending at 4:45 does not mean a 5:00 dinner reservation is automatically safe. Boarding can take time, walking back can take time, and schedules can change. Build a real buffer between the listed finish and anything you cannot miss.</p></section>
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6"><h2 className="text-2xl font-bold">Avoid the long formats on a dinner day</h2><p className="mt-4 text-[#ccc]">The transported Swamp & Bayou tour currently lasts 3 hours 45 minutes, while Oak Alley is listed at 5 hours 25 minutes. Those can work on the right schedule, but they are not the first choices when dinner time is the hard deadline.</p></section>
        <section className="border-t border-[#333] pt-8"><h2 className="text-lg font-bold">Official sources checked</h2><div className="mt-4 flex flex-wrap gap-4 text-sm"><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/riverboat-cruises/75-minute-city-of-new-orleans-riverboat-cruise/" target="_blank" rel="noopener noreferrer">CITY riverboat</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/ghosts-spirits/" target="_blank" rel="noopener noreferrer">Ghosts & Spirits</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/food-drinks-tours/new-orleans-craft-cocktail-walking-tour-2/" target="_blank" rel="noopener noreferrer">Cocktail tour</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/swamp-tours/swamp-bayou-tour/" target="_blank" rel="noopener noreferrer">Swamp & Bayou</a></div></section>
        <nav className="border-t border-[#333] pt-8 text-sm flex flex-wrap gap-5"><Link className="text-[#d4af37] underline" href="/compare/best-new-orleans-tour-if-you-only-have-3-hours">Only have 3 hours?</Link><Link className="text-[#d4af37] underline" href="/guides/best-new-orleans-tours-if-you-arrive-at-noon">Arriving at noon</Link><Link className="text-[#d4af37] underline" href="/help-me-choose">Help Me Choose</Link></nav>
      </div>
    </article>
  );
}
