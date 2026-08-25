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

const cardStyle = { borderRadius: "18px" } as const;

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

      <div id="comparisons" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14 md:py-20">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Side-by-side decision help</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#fff8ec] sm:text-4xl">Pick the comparison that matches your decision</h2>
          <p className="mt-3 leading-7 text-[#cfc6ba]">These are compact reading cards on purpose. The headline, the actual decision, and the link should all be readable without squeezing text into decorative shapes.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {ready.map((item) => (
            <Link
              key={item.slug}
              href={`/compare/${item.slug}`}
              style={cardStyle}
              className="group relative min-h-[230px] overflow-hidden border border-[#d4af37]/30 bg-[linear-gradient(145deg,#18151a,#0d0b0e)] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-1 hover:border-[#d4af37] sm:p-8"
            >
              <div className="absolute inset-y-6 left-0 w-[3px] rounded-full bg-gradient-to-b from-[#e2bc48] via-[#b88727] to-transparent" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#e0b83e]">Tour comparison</p>
              <h2 className="mt-3 max-w-[34rem] text-[1.55rem] font-black leading-[1.12] tracking-[-0.02em] text-[#fff8ec] sm:text-[1.8rem]">
                {item.title}
              </h2>
              <p className="mt-4 max-w-[34rem] text-[0.98rem] leading-7 text-[#c9c0b5]">{item.queryIntent}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#e0b83e]">Read comparison <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>

        <section className="mt-16 border-t border-[#d4af37]/20 pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Practical planning questions</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#fff8ec]">Start with the problem you actually need to solve</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-[#bcb3a8]">These guides answer the questions that usually matter before somebody knows the exact tour name they want.</p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {planningGuides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                style={cardStyle}
                className="group border border-[#d4af37]/22 bg-[#111014] p-6 transition-all hover:-translate-y-1 hover:border-[#d4af37]"
              >
                <h3 className="text-xl font-black leading-snug text-[#fff8ec] group-hover:text-[#e0b83e]">{guide.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#bcb3a8]">{guide.description}</p>
                <span className="mt-5 inline-block text-sm font-bold text-[#d4af37]">Read guide →</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-12 border-t border-[#d4af37]/20 pt-8">
          <Link href="/tours" className="font-bold text-[#d4af37] underline underline-offset-4">Browse all bookable tours</Link>
        </div>
      </div>
    </div>
  );
}
