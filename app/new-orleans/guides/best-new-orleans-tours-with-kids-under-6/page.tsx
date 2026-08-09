import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best New Orleans Tours With Kids Under 6: What Actually Fits",
  description:
    "Compare New Orleans tours for families with children under 6 using current age rules, duration, noise, walking, and transportation details.",
  alternates: { canonical: "/guides/best-new-orleans-tours-with-kids-under-6" },
};

export default function KidsUnderSixGuide() {
  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20"><div className="mx-auto max-w-5xl"><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">Young-family decision guide</p><h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">Best New Orleans tours with kids under 6</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">For young kids, the first filter is age eligibility. The checked Gray Line airboats require age 5+, while the covered Swamp & Bayou tour and the 75-minute CITY riverboat are currently listed for all ages.</p><p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Operator facts last checked August 9, 2026</p></div></header>
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12 md:py-16">
        <section className="grid gap-6 md:grid-cols-3"><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">75-minute riverboat</h2><p className="mt-4 text-[#ccc]">All ages, short duration, indoor and outdoor seating, snack bar, and narration. That makes it one of the simplest checked options for a family with a toddler or preschooler.</p></div><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Covered swamp boat</h2><p className="mt-4 text-[#ccc]">The transported Swamp & Bayou pontoon tour is listed for all ages and lasts 3 hours 45 minutes including transportation from downtown.</p></div><div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Airboat</h2><p className="mt-4 text-[#ccc]">The checked small and large airboats require guests to be at least 5. They are louder, more exposed, and have additional medical and accessibility restrictions.</p></div></section>
        <section><h2 className="font-[var(--font-accent)] text-3xl font-bold">All-ages does not always mean easy</h2><p className="mt-4 leading-relaxed text-[#ccc]">A two-hour walking tour may allow young children but still mean two hours on uneven French Quarter streets. A three-hour-plus transported tour may be easier physically but harder for nap schedules. For children under 6, age rule, restroom access, shade or indoor seating, total outing time, and the ability to leave early matter more than the marketing label.</p></section>
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6"><h2 className="text-2xl font-bold">If the youngest child is under 5</h2><p className="mt-4 text-[#ccc]">Remove the checked airboats from the shortlist first. Then compare a short river cruise with an all-ages covered swamp boat based on how much total time your family wants to commit.</p></section>
        <section className="border-t border-[#333] pt-8"><h2 className="text-lg font-bold">Official sources checked</h2><div className="mt-4 flex flex-wrap gap-4 text-sm"><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/riverboat-cruises/75-minute-city-of-new-orleans-riverboat-cruise/" target="_blank" rel="noopener noreferrer">CITY riverboat</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/swamp-tours/swamp-bayou-tour/" target="_blank" rel="noopener noreferrer">Covered swamp boat</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/" target="_blank" rel="noopener noreferrer">Large airboat</a></div></section>
        <nav className="border-t border-[#333] pt-8 text-sm flex flex-wrap gap-5"><Link className="text-[#d4af37] underline" href="/guides/can-kids-ride-airboats-new-orleans">Kids and airboats</Link><Link className="text-[#d4af37] underline" href="/guides/new-orleans-tours-for-grandparents-and-kids">Grandparents + kids</Link><Link className="text-[#d4af37] underline" href="/help-me-choose">Help Me Choose</Link></nav>
      </div>
    </article>
  );
}
