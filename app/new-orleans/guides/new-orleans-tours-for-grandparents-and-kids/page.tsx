import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best New Orleans Tours for Grandparents and Kids Together",
  description: "Compare New Orleans tours for mixed-age families using current age rules, walking, accessibility, noise, weather exposure, and duration.",
  alternates: { canonical: "/guides/new-orleans-tours-for-grandparents-and-kids" },
};

export default function GrandparentsKidsGuide() {
  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20"><div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">Mixed-age family guide</p>
        <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">New Orleans tours for grandparents and kids together</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">For a mixed-age group, start with the least restrictive person in the party — not the most adventurous. Covered swamp boats, river cruises, and vehicle-based sightseeing usually deserve a look before airboats or long walking tours.</p>
        <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Operator facts last checked August 9, 2026</p>
      </div></header>
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12 md:py-16">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Covered swamp boat</h2><p className="mt-4 text-[#ccc]">The checked Gray Line Swamp & Bayou boat is all ages. A covered boat also avoids the 5+ minimum, high noise, and medical restrictions listed for the checked airboats.</p></div>
          <div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">Riverboat cruise</h2><p className="mt-4 text-[#ccc]">The 75-minute CITY of NEW ORLEANS cruise is family-friendly, has indoor and outdoor seating, and the vessel is listed as handicap accessible except for top-deck stair access.</p></div>
          <div className="border border-[#333] bg-[#1a1a1a] p-6"><h2 className="text-2xl font-bold">City sightseeing</h2><p className="mt-4 text-[#ccc]">The checked City & Cemetery sightseeing tour is three hours. Guests with limited mobility may remain on the bus at stops, though some Garden District sidewalks are uneven.</p></div>
        </section>
        <section><h2 className="font-[var(--font-accent)] text-3xl font-bold">What changes the decision</h2><div className="mt-6 space-y-4 text-[#ccc]"><p><strong className="text-white">Young child:</strong> the checked airboats require age 5+; the covered swamp boat and riverboat options above are all ages.</p><p><strong className="text-white">Grandparent with mobility limits:</strong> avoid assuming a walking tour is easier just because it is shorter. Uneven sidewalks, gravel, stairs and boarding matter.</p><p><strong className="text-white">Noise or medical concerns:</strong> the checked airboats are loud and are not recommended for several neck, back, heart or pregnancy-related conditions.</p><p><strong className="text-white">Long day:</strong> plantation-and-swamp combinations can run 7 hours 45 minutes, which may be more day than a mixed-age group wants.</p></div></section>
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6"><h2 className="text-2xl font-bold">A simple rule</h2><p className="mt-4 text-[#ccc]">If one person needs a calmer pace, pick a format that is comfortable for them and let the more adventurous people add something else later. Do not force the entire family into the loudest or longest option.</p></section>
        <section className="border-t border-[#333] pt-8"><h2 className="text-lg font-bold">Official sources checked</h2><div className="mt-4 flex flex-wrap gap-4 text-sm"><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/" target="_blank" rel="noopener noreferrer">Airboat rules</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/swamp-tours/swamp-boat-cruise-oak-alley-plantation-tour-new-orleans/" target="_blank" rel="noopener noreferrer">Covered boat / accessibility</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/riverboat-cruises/75-minute-city-of-new-orleans-riverboat-cruise/" target="_blank" rel="noopener noreferrer">75-minute riverboat</a><a className="text-[#d4af37] underline" href="https://www.graylineneworleans.com/haunted-city-cemetery-tours/new-orleans-cemetery-sightseeing/" target="_blank" rel="noopener noreferrer">City sightseeing</a></div></section>
        <nav className="border-t border-[#333] pt-8 text-sm flex flex-wrap gap-5"><Link className="text-[#d4af37] underline" href="/guides/can-kids-ride-airboats-new-orleans">Kids and airboats</Link><Link className="text-[#d4af37] underline" href="/guides/new-orleans-tours-limited-mobility">Limited mobility guide</Link><Link className="text-[#d4af37] underline" href="/help-me-choose">Help Me Choose</Link></nav>
      </div>
    </article>
  );
}
