import React from "react";
import Link from "next/link";
import NewOrleansRecommendationFlow from "../components/NewOrleansRecommendationFlow";
import GraphChooserExplanation from "../components/GraphChooserExplanation";
import CinematicPageHero from "../components/CinematicPageHero";
import ChooserExitBriefPrompt from "../components/ChooserExitBriefPrompt";
import ExpandedChooserEntry from "./ExpandedChooserEntry";

export const metadata = {
  title: "Help Me Choose a New Orleans Tour | Personalized Recommendations",
  description: "Tell us when you're going, who is in your group, the pace you want, transportation needs and practical constraints. We'll recommend the best-fit New Orleans experience and a backup.",
};

const DECISION_FACTORS = [
  {
    label: "When",
    title: "Today, tomorrow, or a bigger day?",
    text: "We use your planning window and how much time you actually have so a good tour does not become a bad schedule.",
  },
  {
    label: "Who",
    title: "Couple, family, mixed ages, or group?",
    text: "Group fit changes the answer. We account for children, mixed ages and restrictions that matter for certain formats.",
  },
  {
    label: "Energy",
    title: "Relaxed, balanced, or adventurous?",
    text: "A covered swamp boat, an airboat, a city tour and an evening walking tour are very different days even when all are well reviewed.",
  },
  {
    label: "Constraints",
    title: "Pickup, weather, exposure and eligibility",
    text: "The recommendation engine uses transportation needs plus live local context and known experience constraints instead of ranking by popularity alone.",
  },
] as const;

export default function HelpMeChoosePage() {
  return (
    <div className="bg-[#080708] text-[#fdfbf7] min-h-screen">
      <ChooserExitBriefPrompt />
      <CinematicPageHero
        eyebrow="Your New Orleans decision desk"
        title="Tell us what kind of New Orleans day you want"
        script="we'll narrow it down"
        intro="Answer a few traveler questions and we’ll make a best-fit recommendation, explain why it fits, surface cautions and show a backup. We use timing, transportation, group fit, live context and practical constraints instead of forcing you through a giant catalog."
        image="/images/new-orleans/hero-french-quarter-balcony.jpg"
        actions={[
          { href: "#guided-planner", label: "Get My Recommendation", detail: "Answer a few questions", primary: true },
          { href: "#experience-types", label: "Browse by Mood", detail: "Start with an experience type" },
          { href: "tel:+15044849687", label: "Ask a Person", detail: "504-484-9687" },
        ]}
      />

      <section className="border-b border-[#d4af37]/20 bg-[#111014] px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">What changes the recommendation</p>
            <h2 className="mt-2 text-3xl font-[var(--font-accent)] font-bold md:text-4xl">The best tour is the one that fits your day.</h2>
            <p className="mt-3 text-sm leading-6 text-[#bbb0a1]">The chooser is built around four decision dimensions. It can also use current local context when that helps distinguish between otherwise good options.</p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {DECISION_FACTORS.map((factor) => (
              <div key={factor.label} className="border border-[#d4af37]/25 bg-[#171419] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4af37]">{factor.label}</p>
                <h3 className="mt-2 text-lg font-bold text-[#fdfbf7]">{factor.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#aaa096]">{factor.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="guided-planner" className="scroll-mt-20 border-b border-[#d4af37]/20">
        <NewOrleansRecommendationFlow />
        <GraphChooserExplanation />
      </div>

      <div id="experience-types" className="scroll-mt-24">
        <ExpandedChooserEntry />
      </div>

      <section className="border-t border-[#d4af37]/20 bg-[#111014] px-6 py-12">
        <div className="mx-auto mb-8 max-w-5xl border border-[#d4af37]/20 bg-[#0d0c0f] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">What you get</p>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div><strong className="block text-white">Best choice</strong><span className="text-sm text-[#aaa096]">The strongest fit from the currently supported options.</span></div>
            <div><strong className="block text-white">Why it fits</strong><span className="text-sm text-[#aaa096]">The traveler and practical signals that drove the recommendation.</span></div>
            <div><strong className="block text-white">Cautions & tradeoffs</strong><span className="text-sm text-[#aaa096]">What to know before choosing it.</span></div>
            <div><strong className="block text-white">Backup choice</strong><span className="text-sm text-[#aaa096]">A second fit when the first option is not right or available.</span></div>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="border border-[#d4af37]/30 bg-[#171419] p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Prefer a human?</p>
            <h2 className="mt-2 text-3xl font-[var(--font-accent)] font-bold">We’ll help you sort out the day</h2>
            <p className="mt-3 text-sm leading-6 text-[#bbb0a1]">If you’re already in New Orleans and want help comparing the choices, call or text the Concierge Desk. We can help with timing, transportation, group fit and what to verify before booking.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row"><a href="tel:+15044849687" className="bg-[#d4af37] px-5 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#151515]">Call 504-484-9687</a><a href="sms:+15044849687" className="border border-[#d4af37] px-5 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#d4af37]">Text the desk</a></div>
          </div>
          <div className="border border-[#d4af37]/30 bg-[#171419] p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Morning shortcut</p>
            <h2 className="mt-2 text-3xl font-[var(--font-accent)] font-bold">$5 French Quarter Orientation</h2>
            <p className="mt-3 text-sm leading-6 text-[#bbb0a1]">30 minutes at 8:00 AM or 9:30 AM daily at the Moonwalk by Café Du Monde. Look for the yellow umbrella and leave with a clearer plan for the rest of the day.</p>
            <Link href="/guides/french-quarter-orientation" className="mt-5 inline-block border border-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#d4af37]">See orientation details</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
