import type { Metadata } from "next";
import Link from "next/link";
import CinematicPageHero from "../components/CinematicPageHero";
import { COMPARISON_OPPORTUNITIES } from "../data/comparisonRegistry";

export const metadata: Metadata = {
  title: "Compare New Orleans Tours Before You Book",
  description: "Practical New Orleans tour comparisons based on current operator details: plantation tours, swamp boats, airboats, river cruises and more.",
  alternates: { canonical: "/compare" },
};

const planningGuides = [
  { href: "/guides/new-orleans-swamp-tour-without-a-car", title: "New Orleans swamp tours without a car", description: "Which transported options actually work, where they meet, and why self-drive tickets are different." },
  { href: "/guides/can-kids-ride-airboats-new-orleans", title: "Can kids ride airboats in New Orleans?", description: "Current age rules, small vs large boat capacity, medical restrictions, and the all-ages covered-boat alternative." },
  { href: "/guides/whitney-plantation-vs-oak-alley-history-focus", title: "Whitney vs Oak Alley for history", description: "Choose based on slavery-history focus, house and grounds, walking, accessibility, and visitor amenities." },
  { href: "/guides/new-orleans-tours-for-grandparents-and-kids", title: "Tours for grandparents and kids together", description: "Mixed-age choices based on age rules, noise, walking, accessibility, and how long the day really is." },
  { href: "/guides/new-orleans-tours-limited-mobility", title: "New Orleans tours for limited mobility", description: "Compare buses, riverboats, plantations, walking, stairs, gravel, wheelchair rules, and advance accommodation requests." },
  { href: "/guides/best-new-orleans-tours-if-you-arrive-at-noon", title: "Best tours if you arrive at noon", description: "Afternoon options with realistic check-in and travel buffers instead of pretending arrival time equals free time." },
  { href: "/guides/best-new-orleans-tours-for-a-rainy-day", title: "Best New Orleans tours for a rainy day", description: "Covered boats, indoor seating, airboat weather exposure, and what rain-or-shine policies actually mean." },
  { href: "/guides/best-new-orleans-tours-under-4-or-6-hours", title: "Best tours under 4 or 6 hours", description: "Compare real scheduled durations from 75 minutes through roughly five and a half hours." },
  { href: "/guides/new-orleans-tours-without-an-all-day-bus-ride", title: "Tours without spending all day on a bus", description: "Shorter city, river, walking, and swamp choices for visitors who do not want a seven- or eight-hour excursion day." },
  { href: "/guides/new-orleans-tours-near-french-quarter", title: "Tours near the French Quarter", description: "Compare downtown meeting points, walking tours, river cruises, and transported swamp options when you do not want a car." },
  { href: "/guides/best-new-orleans-tours-with-kids-under-6", title: "Best tours with kids under 6", description: "Age rules, total outing time, noise, seating, and all-ages alternatives for families with toddlers and preschoolers." },
  { href: "/guides/new-orleans-tours-with-minimal-walking", title: "Tours with minimal walking", description: "Seated river, vehicle, and plantation options with the stairs, boarding, pavement, and wheelchair details that still matter." },
  { href: "/guides/new-orleans-tours-under-50-dollars", title: "New Orleans tours under $50", description: "Current budget examples with the transportation, age, and time tradeoffs that can make a cheap ticket more complicated." },
  { href: "/guides/new-orleans-tours-that-fit-before-dinner", title: "Tours that fit before dinner", description: "Shorter afternoon formats with realistic check-in, boarding, finish-time, and travel buffers before a dinner reservation." },
];

export default function CompareToursPage() {
  const ready = COMPARISON_OPPORTUNITIES.filter((item) => item.status === "READY_TO_PUBLISH");

  return (
    <div className="min-h-screen bg-[#080708] text-[#fdfbf7]">
      <CinematicPageHero
        eyebrow="Decision guides"
        title="Compare New Orleans tours before you book"
        script="know the difference"
        intro="Focus on the differences that actually change a booking decision: time, transportation, age rules, walking, accessibility, weather exposure, tour format and historical focus."
        image="/images/wikimedia/originals/oak-alley-front.jpg"
        actions={[
          { href: "#comparisons", label: "See Comparisons", detail: "Side-by-side decision help", primary: true },
          { href: "/help-me-choose", label: "Help Me Choose", detail: "Let us narrow the field" },
          { href: "tel:+15044849687", label: "Ask the Desk", detail: "504-484-9687" },
        ]}
      />

      <div id="comparisons" className="mx-auto max-w-5xl px-6 py-14 md:py-20 scroll-mt-24">
        <div className="grid gap-6 md:grid-cols-2">
          {ready.map((item) => (
            <Link key={item.slug} href={`/compare/${item.slug}`} className="group relative overflow-hidden border border-[#d4af37]/28 bg-[linear-gradient(145deg,#171419,#0b0a0c)] p-7 shadow-xl shadow-black/20 transition-all hover:-translate-y-1 hover:border-[#d4af37]">
              <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-[#d4af37] via-[#d4af37]/30 to-transparent" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">Tour comparison</p>
              <h2 className="mt-3 font-[var(--font-accent)] text-2xl font-bold group-hover:text-[#e3b74a]">{item.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-[#b8afa2]">{item.queryIntent}</p>
              <span className="mt-6 inline-block text-sm font-bold text-[#d4af37]">Read comparison →</span>
            </Link>
          ))}
        </div>

        <section className="mt-16 border-t border-[#d4af37]/20 pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Practical planning questions</p>
          <h2 className="mt-3 font-[var(--font-accent)] text-3xl font-bold">Start with the problem you actually need to solve</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-[#aaa]">These guides answer the questions that usually matter before somebody knows the exact tour name they want.</p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {planningGuides.map((guide) => (
              <Link key={guide.href} href={guide.href} className="group border border-[#d4af37]/22 bg-[#111014] p-6 transition-all hover:-translate-y-1 hover:border-[#d4af37]">
                <h3 className="font-[var(--font-accent)] text-xl font-bold group-hover:text-[#d4af37]">{guide.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#aaa]">{guide.description}</p>
                <span className="mt-5 inline-block text-sm font-bold text-[#d4af37]">Read guide →</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-12 border-t border-[#d4af37]/20 pt-8"><Link href="/tours" className="text-[#d4af37] underline underline-offset-4">Browse all bookable tours</Link></div>
      </div>
    </div>
  );
}
