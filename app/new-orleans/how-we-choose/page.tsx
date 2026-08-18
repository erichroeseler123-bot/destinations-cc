import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How We Choose New Orleans Tours | Verification & Recommendations",
  description: "See how Welcome to New Orleans Tours separates operator facts, live booking data, editorial judgment, recommendations, commissions, and unverified details.",
  alternates: { canonical: "/how-we-choose" },
};

const principles = [
  {
    title: "Operator facts stay operator facts",
    text: "Duration, age rules, pickup, accessibility, meeting points, vessel format, and other operating details are treated as factual only when WNO has a source for them. If we cannot support a field, the governed record stays unknown or unverified rather than being filled with a guess.",
  },
  {
    title: "Live checkout controls volatile details",
    text: "Prices, departure times, selected variants, current availability, cancellation terms, and same-day operating changes can move quickly. The participating operator's live booking path controls those details at the time of purchase.",
  },
  {
    title: "Editorial judgment is labeled as judgment",
    text: "Best-for, avoid-if, trade-off, pace, and comparative recommendations are WNO's decision guidance. They are kept separate from operator-supplied facts in the Experience Graph so an editorial opinion cannot masquerade as a verified operating claim.",
  },
  {
    title: "Hard constraints beat preference scoring",
    text: "When a verified restriction makes an experience inappropriate or ineligible for the visitor's answers, the chooser removes that experience before preference scoring. A high adventure preference cannot override an operator safety or age restriction.",
  },
  {
    title: "Time means the whole commitment when we know it",
    text: "WNO prefers verified door-to-door commitment over advertised activity duration when deciding whether something fits a visitor's schedule. If total time is not verified, we say so rather than claiming the experience fits tightly around another reservation.",
  },
  {
    title: "Commission does not make a fact true",
    text: "WNO may earn a commission from attributed bookings. Commercial relationships can determine what inventory is bookable through the site, but they do not change the verification status of a fact or override visitor-fit constraints in the recommendation logic.",
  },
];

export default function HowWeChoosePage() {
  return (
    <main className="min-h-screen bg-[#080708] text-[#fdfbf7]">
      <section className="border-b border-[#d4af37]/20 bg-[#110e14] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4af37]">Editorial & verification policy</p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">How Welcome to New Orleans Tours chooses, verifies, and recommends</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">The goal is not to crown one universal “best tour.” The goal is to help a visitor choose the experience that fits their group, time, transportation, interests, and real operating constraints—and to be explicit about what WNO knows versus what still needs confirmation.</p>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl grid gap-5 md:grid-cols-2">
          {principles.map((principle) => (
            <article key={principle.title} className="border border-white/10 bg-white/[0.03] p-6 md:p-7">
              <h2 className="font-serif text-2xl">{principle.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#d4af37]/20 bg-[#110e14] px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Our evidence model</p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Three different kinds of information</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="border border-white/10 p-5"><h3 className="font-bold">Verified / sourced fact</h3><p className="mt-2 text-sm leading-6 text-white/60">Supported by an operator, FareHarbor, or another identified authoritative record. The graph stores source and review date with the field.</p></div>
            <div className="border border-white/10 p-5"><h3 className="font-bold">Editorial assessment</h3><p className="mt-2 text-sm leading-6 text-white/60">WNO's interpretation of fit or trade-offs. Useful for choosing, but not represented as an operator statement.</p></div>
            <div className="border border-white/10 p-5"><h3 className="font-bold">Unknown / needs verification</h3><p className="mt-2 text-sm leading-6 text-white/60">A field we do not currently have enough evidence to publish as a fact. The site should tell you to confirm it rather than inventing a value.</p></div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">How a recommendation is made</p>
            <h2 className="mt-3 font-serif text-3xl">Eligibility first. Fit second.</h2>
            <ol className="mt-6 space-y-4 text-sm leading-7 text-white/65">
              <li><strong className="text-white">1. Remove known impossible choices.</strong> Verified age, health, time, and other hard constraints are applied before ranking.</li>
              <li><strong className="text-white">2. Check the time budget.</strong> Governed door-to-door time is preferred where available.</li>
              <li><strong className="text-white">3. Rank the remaining fit.</strong> Pace, history interest, transportation need, group composition, and relevant current context influence the order.</li>
              <li><strong className="text-white">4. Explain the result.</strong> The chooser can show why the recommendation won, its trade-off, and why a real alternative lost when the graph contains enough evidence.</li>
            </ol>
          </div>
          <aside className="border border-[#d4af37]/30 bg-[#151217] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Independent marketplace</p>
            <p className="mt-3 text-sm leading-7 text-white/65">Welcome to New Orleans Tours is not the tour operator for third-party experiences represented on the site. The operator is identified on the experience page and controls fulfillment.</p>
            <Link href="/affiliate-disclosure" className="mt-5 block text-sm font-bold text-[#d4af37] underline underline-offset-4">Affiliate disclosure →</Link>
            <Link href="/help-me-choose" className="mt-3 block text-sm font-bold text-[#d4af37] underline underline-offset-4">Try Help Me Choose →</Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
