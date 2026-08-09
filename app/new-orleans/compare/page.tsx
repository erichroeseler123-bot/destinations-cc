import type { Metadata } from "next";
import Link from "next/link";
import { COMPARISON_OPPORTUNITIES } from "../data/comparisonRegistry";

export const metadata: Metadata = {
  title: "Compare New Orleans Tours Before You Book",
  description: "Practical New Orleans tour comparisons based on current operator details: plantation tours, swamp boats, airboats, river cruises and more.",
  alternates: { canonical: "/compare" },
};

const planningGuides = [
  {
    href: "/guides/new-orleans-swamp-tour-without-a-car",
    title: "New Orleans swamp tours without a car",
    description: "Which transported options actually work, where they meet, and why self-drive tickets are different.",
  },
  {
    href: "/guides/can-kids-ride-airboats-new-orleans",
    title: "Can kids ride airboats in New Orleans?",
    description: "Current age rules, small vs large boat capacity, medical restrictions, and the all-ages covered-boat alternative.",
  },
  {
    href: "/guides/whitney-plantation-vs-oak-alley-history-focus",
    title: "Whitney vs Oak Alley for history",
    description: "Choose based on slavery-history focus, house and grounds, walking, accessibility, and visitor amenities.",
  },
];

export default function CompareToursPage() {
  const ready = COMPARISON_OPPORTUNITIES.filter((item) => item.status === "READY_TO_PUBLISH");

  return (
    <div className="min-h-screen bg-[#151515] text-[#fdfbf7] px-6 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">Decision guides</p>
        <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">Compare New Orleans tours before you book</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#cccccc]">These guides focus on the differences that actually change a booking decision: time, transportation, age rules, walking, accessibility, weather exposure, tour format and historical focus. We use current operator information and show when facts were last checked.</p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {ready.map((item) => (
            <Link key={item.slug} href={`/compare/${item.slug}`} className="group border border-[#333] bg-[#1a1a1a] p-6 transition-colors hover:border-[#d4af37]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">Tour comparison</p>
              <h2 className="mt-3 font-[var(--font-accent)] text-2xl font-bold group-hover:text-[#d4af37]">{item.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-[#aaa]">{item.queryIntent}</p>
              <span className="mt-6 inline-block text-sm font-bold text-[#d4af37]">Read comparison →</span>
            </Link>
          ))}
        </div>

        <section className="mt-16 border-t border-[#333] pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Practical planning questions</p>
          <h2 className="mt-3 font-[var(--font-accent)] text-3xl font-bold">Start with the problem you actually need to solve</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-[#aaa]">These guides answer the questions that usually matter before somebody knows the exact tour name they want.</p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {planningGuides.map((guide) => (
              <Link key={guide.href} href={guide.href} className="group border border-[#333] bg-[#181818] p-6 transition-colors hover:border-[#d4af37]">
                <h3 className="font-[var(--font-accent)] text-xl font-bold group-hover:text-[#d4af37]">{guide.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#aaa]">{guide.description}</p>
                <span className="mt-5 inline-block text-sm font-bold text-[#d4af37]">Read guide →</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-12 border-t border-[#333] pt-8">
          <Link href="/tours" className="text-[#d4af37] underline underline-offset-4">Browse all bookable tours</Link>
        </div>
      </div>
    </div>
  );
}
