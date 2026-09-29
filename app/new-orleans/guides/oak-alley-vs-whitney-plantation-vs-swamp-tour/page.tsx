import type { Metadata } from "next";
import Link from "next/link";
import GeoDirectAnswerCard from "../../components/GeoDirectAnswerCard";
import { NOLA_GEO_FACTS } from "../../data/nolaGeoFacts";

const canonical = "https://www.welcometoneworleanstours.com/guides/oak-alley-vs-whitney-plantation-vs-swamp-tour";

export const metadata: Metadata = {
  title: "Oak Alley vs Whitney Plantation vs Swamp Tour: Which Should You Choose? (2026 Guide)",
  description:
    "Decide between Oak Alley Plantation, Whitney Plantation, a bayou swamp tour, or a full-day combo. Compare travel times from the French Quarter, history vs wildlife, and pricing.",
  alternates: { canonical },
  openGraph: {
    title: "Oak Alley vs Whitney Plantation vs Swamp Tour: Which to Choose?",
    description: "Compare New Orleans day trips: Oak Alley architecture, Whitney Plantation enslaved memorial, and Barataria swamp excursions.",
    url: canonical,
    type: "article",
  },
};

const comparisonRows = [
  {
    feature: "Primary Focus & Mood",
    oakAlley: "Iconic 300-year-old live oak canopy, antebellum Greek Revival architecture, and historic River Road grounds.",
    whitney: "The only museum in America exclusively dedicated to the enslaved experience, with memorials and historic slave cabins.",
    swampTour: "Wild Louisiana bayou nature, live alligator encounters, moss-draped cypress swamps, and Cajun cultural lore.",
    combo: "The ultimate full-day experience: authentic Manchac Swamp boat cruise + Oak Alley Plantation tour (7h 45m published duration).",
  },
  {
    feature: "Price (w/ Coach / Shuttle Transit)",
    oakAlley: "$89.00 flat rate per adult / $42.00 child ages 6–12 (Includes house admission + round-trip coach from 400 Toulouse St)",
    whitney: "$89.00 flat rate per adult / $42.00 child ages 6–12 (Includes museum admission + round-trip coach from 400 Toulouse St)",
    swampTour: "$60–$65 per adult (Covered boat w/ transit; $32 child) • $90–$120 (Airboat w/ transit)",
    combo: "$131.00 flat rate per adult / $69.00 child ages 6–12 (Oak Alley + Swamp Boat combination with coach transit)",
  },
  {
    feature: "Total Time Commitment",
    oakAlley: "5 to 5.5 hours round-trip (~1 hour drive each way + 2.5 hours on-site)",
    whitney: "5 to 5.5 hours round-trip (~1 hour drive each way + 2.5 hours on-site)",
    swampTour: "3.5 to 4 hours round-trip (~45 min drive each way + 1.5–2 hours on water)",
    combo: "7 hours 45 minutes published duration (actual departure and return schedule confirmed during checkout)",
  },
  {
    feature: "Driving Distance & Departure Point",
    oakAlley: "~53 miles west along River Road. Coach departs 400 Toulouse St (French Quarter).",
    whitney: "~51 miles west (Wallace, LA). Coach departs 400 Toulouse St (French Quarter).",
    swampTour: "~35 miles south (Barataria basin). Central coach or hotel shuttle transit included.",
    combo: "Coach departs 400 Toulouse St (French Quarter) with direct transfer between Manchac Swamp and River Road.",
  },
  {
    feature: "Family & Age Fit",
    oakAlley: "Great for all ages. Expansive lawns, shade trees, and easy walking paths.",
    whitney: "Best for adults and teens. Deeply poignant, reflective, and educational subject matter.",
    swampTour: "Outstanding for families (covered boat for all ages; airboat minimum age 5). High excitement seeing wild alligators.",
    combo: "Best for travelers who want to maximize a single day outside the city.",
  },
];

const faqs = [
  {
    question: "Which is better: Oak Alley or the Whitney Plantation?",
    answer:
      "Neither is universally 'better'—they offer completely different experiences. Choose Oak Alley if you want the iconic postcard photo of the 28 live oaks, antebellum architecture, and a traditional plantation house tour. Choose the Whitney Plantation if you want an educational, profoundly moving museum experience focused entirely on the history and voices of enslaved people.",
  },
  {
    question: "Can I do a swamp tour and a plantation tour on the same day?",
    answer:
      "Yes. Booking an organized full-day combination tour (swamp boat + Oak Alley) is one of the most popular day trips from New Orleans ($131 flat rate adult). The tour company handles coach transit between the French Quarter, the swamp basin, and River Road, saving you hours of transit time compared to separate bookings.",
  },
  {
    question: "Do you need a rental car to visit Oak Alley or the Whitney Plantation?",
    answer:
      "No. Booking an organized coach excursion departing conveniently from 400 Toulouse St in the French Quarter is significantly easier and cheaper than renting a car, paying gas, and navigating rural River Road highways.",
  },
  {
    question: "Is there enough time for dinner in New Orleans after a day trip?",
    answer:
      "Yes. Half-day swamp tours return to the city by 1:30 PM (morning departure) or 5:30 PM (afternoon departure). Full-day plantation and swamp combination tours typically return between 4:30 PM and 5:30 PM, leaving your evening completely open for dinner and jazz on Frenchmen Street.",
  },
];

export default function PlantationVsSwampGuide() {
  const geoFact = NOLA_GEO_FACTS["oak-alley-vs-whitney"];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Oak Alley vs Whitney Plantation vs Swamp Tour: Which Should You Choose? (2026 Guide)",
    description: metadata.description,
    datePublished: "2026-09-09",
    dateModified: "2026-09-09",
    mainEntityOfPage: canonical,
    publisher: {
      "@type": "Organization",
      name: "Welcome to New Orleans Tours",
      url: "https://www.welcometoneworleanstours.com",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[#fcfaf6] text-[#171a1f] pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* HERO SECTION */}
      <section className="bg-[linear-gradient(135deg,#1f1a14_0%,#12100d_55%,#261f17_100%)] px-6 py-14 text-white sm:py-20 border-b border-[#3d3224]">
        <div className="mx-auto max-w-5xl">
          <Link href="/guides" className="text-xs font-bold uppercase tracking-wider text-[#d4af37] hover:underline inline-flex items-center gap-1.5 mb-4">
            ← All New Orleans Guides
          </Link>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e5c568]">
            New Orleans Day Trip Intelligence · 2026
          </div>
          <h1 className="mt-3 max-w-4xl font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-[#fff9ec]">
            Oak Alley vs. Whitney Plantation vs. Swamp Tour
          </h1>
          <p className="mt-5 max-w-3xl text-base sm:text-lg leading-relaxed text-[#dfd6c6]">
            Leaving the French Quarter for a day trip is a highlight of any New Orleans visit. But should you spend your time beneath Oak Alley’s 300-year-old trees, learning enslaved history at the Whitney Plantation, or spotting wild alligators in the bayou? Here is the honest side-by-side breakdown.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/plantation-tours"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#c9a86a] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#17130c] hover:bg-[#f3dfb3] transition-colors"
            >
              Compare Plantation Tours →
            </Link>
            <Link
              href="/swamp-tours"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#c9a86a] bg-black/30 px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#fff0c9] hover:bg-[#c9a86a]/15 transition-colors"
            >
              Compare Swamp Tours
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        {/* DIRECT ANSWER CARD TARGETED FOR AI OVERVIEWS */}
        <GeoDirectAnswerCard fact={geoFact} />

        {/* COMPARISON MATRIX TABLE */}
        <section className="mt-12 rounded-2xl border border-[#e2d5c0] bg-[#fffdf9] p-6 sm:p-8 shadow-[0_10px_30px_rgba(43,33,24,0.06)]">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b48535] mb-2">
            The Side-by-Side Tradeoff Matrix
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#171a1f] mb-6">
            Compare Your Options Beyond the City
          </h2>
          <p className="text-[#554b3f] mb-8 leading-relaxed text-sm sm:text-base">
            Review how the top day trips compare across driving time, budget, group format, and historical focus before you book.
          </p>

          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b-2 border-[#eee5d6] bg-[#fbf8f2]">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#796e60] w-[18%]">Trip Variable</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#825e1a] bg-[#fefaf0] w-[20%]">
                    Oak Alley Plantation
                  </th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#171a1f] w-[20%]">Whitney Plantation</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#2d5a27] w-[20%]">Barataria Swamp Tour</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#9a6714] bg-[#fcf6e8] w-[22%]">
                    Swamp + Oak Alley Combo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee5d6] text-sm">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#fcfaf5] transition-colors">
                    <td className="p-4 font-bold text-[#171a1f]">{row.feature}</td>
                    <td className="p-4 bg-[#fdf8ee] text-[#42341d] font-medium">{row.oakAlley}</td>
                    <td className="p-4 text-[#373129]">{row.whitney}</td>
                    <td className="p-4 text-[#203c1c] font-medium">{row.swampTour}</td>
                    <td className="p-4 bg-[#fcf6e8] text-[#5c3e0c] font-medium">{row.combo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* E-E-A-T LOCAL OPERATIONAL DEEP DIVES */}
        <section className="mt-12 space-y-10">
          <div className="rounded-2xl border border-[#e2d5c0] bg-[#fffdf9] p-6 sm:p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#171a1f] mb-4">
              Oak Alley vs. Whitney: The Real Distinction
            </h2>
            <div className="space-y-4 text-[#4a4135] leading-relaxed">
              <p>
                The primary difference between Louisiana’s two most visited River Road plantations is the <strong>story each site tells</strong>.
              </p>
              <p>
                <strong>Oak Alley</strong> focuses on traditional antebellum grandeur. Its centerpiece is the world-famous double row of 28 evenly spaced live oak trees planted around 1700, creating an 800-foot natural canopy leading from River Road to the classic Greek Revival Big House. Visitors take guided architectural tours of the mansion and can explore reconstructed slave quarters with historical markers detailing plantation life and sugar production.
              </p>
              <p>
                <strong>The Whitney Plantation</strong>, located just 5 miles downriver, offers a radically different perspective. It is the only plantation museum in the United States completely devoted to the lives, labor, and culture of the enslaved people. Visitors receive memorial lanyards with children's names, visit authentic 1840s slave cabins, view wall memorials etched with the names of 107,000 enslaved Louisianans, and hear recorded oral histories. It is widely praised as one of the most powerful and important historic sites in the American South.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2d5c0] bg-[#fffdf9] p-6 sm:p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#171a1f] mb-4">
              Why Swamp & Plantation Combos Are the Smartest Choice
            </h2>
            <div className="space-y-4 text-[#4a4135] leading-relaxed">
              <p>
                If your trip to New Orleans is 3 to 4 days long, dedicating two separate days to out-of-town trips eats up precious city exploration time.
              </p>
              <p>
                By booking an organized <strong>Swamp & Plantation Combination Tour</strong> ($131.00 flat rate per adult / $69.00 child ages 6–12), a single comfortable Gray Line coach departs 400 Toulouse St in the French Quarter for a published total duration of <strong>7 hours 45 minutes</strong>. The excursion features a guided boat cruise through <strong>Manchac Swamp</strong> to spot wild alligators and explore cypress bayous, followed by direct transfer to River Road for your guided Oak Alley tour. Specific departure and check-in times are confirmed during checkout, giving you the best of Louisiana history and nature in a single seamless day without needing a rental car.
              </p>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="mt-12 rounded-2xl border border-[#e2d5c0] bg-[#fffdf9] p-6 sm:p-8 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b48535] mb-2">Got Questions?</div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#171a1f] mb-6">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-[#eee5d6]">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-5">
                <h3 className="font-serif text-lg font-bold text-[#171a1f] mb-2">{faq.question}</h3>
                <p className="text-[#554b3f] leading-relaxed text-sm sm:text-base">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="mt-12 rounded-2xl bg-[linear-gradient(135deg,#231d16_0%,#15120d_100%)] p-8 text-white text-center sm:p-12 shadow-md border border-[#3e3425]">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight mb-4 text-[#fff6e4]">
            Ready to Plan Your New Orleans Day Trip?
          </h2>
          <p className="max-w-2xl mx-auto text-[#dfd4c3] mb-8 text-base sm:text-lg">
            Compare bookable swamp tours, plantation excursions, and combo packages with hotel transportation and live availability.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/plantation-tours"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#c9a86a] px-8 py-3 text-xs font-bold uppercase tracking-wider text-[#17130c] hover:bg-[#f3dfb3] transition-colors shadow-sm"
            >
              Explore Plantation Tours
            </Link>
            <Link
              href="/swamp-tours"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#c9a86a] bg-black/40 px-8 py-3 text-xs font-bold uppercase tracking-wider text-[#fff0c9] hover:bg-[#c9a86a]/20 transition-colors"
            >
              Explore Swamp Tours
            </Link>
            <Link
              href="/compare/whitney-vs-oak-alley"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-black/40 px-8 py-3 text-xs font-bold uppercase tracking-wider text-[#dfd4c3] hover:bg-white/10 transition-colors"
            >
              Whitney vs Oak Alley Comparison
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
