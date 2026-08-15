import React from "react";
import Link from "next/link";
import NewOrleansRecommendationFlow from "../components/NewOrleansRecommendationFlow";
import CinematicPageHero from "../components/CinematicPageHero";
import ChooserExitBriefPrompt from "../components/ChooserExitBriefPrompt";
import ExpandedChooserEntry from "./ExpandedChooserEntry";

export const metadata = {
  title: "Help Me Choose | New Orleans Tours",
  description: "Choose from city tours, swamps, river cruises, plantations, cocktails, ghosts and full-day combinations—or answer a few simple questions for a recommendation.",
};

export default function HelpMeChoosePage() {
  return (
    <div className="bg-[#080708] text-[#fdfbf7] min-h-screen">
      <ChooserExitBriefPrompt />
      <CinematicPageHero
        eyebrow="Your New Orleans decision desk"
        title="Tell us what kind of day you want"
        script="we'll narrow it down"
        intro="Start with the experience that sounds closest, or answer a few traveler questions. We use timing, transportation, group fit and practical constraints to narrow the choices instead of forcing you through a giant catalog."
        image="/images/new-orleans/hero-french-quarter-balcony.jpg"
        actions={[
          { href: "#experience-types", label: "Browse by Mood", detail: "Start with what sounds good", primary: true },
          { href: "#guided-planner", label: "Guided Planner", detail: "Answer a few questions" },
          { href: "tel:+15044849687", label: "Ask a Person", detail: "504-484-9687" },
        ]}
      />
      <div id="experience-types" className="scroll-mt-24">
        <ExpandedChooserEntry />
      </div>
      <div id="guided-planner" className="scroll-mt-20 border-t border-[#d4af37]/20">
        <NewOrleansRecommendationFlow />
      </div>
      <section className="border-t border-[#d4af37]/20 bg-[#111014] px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="border border-[#d4af37]/30 bg-[#171419] p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Prefer a human?</p>
            <h2 className="mt-2 text-3xl font-[var(--font-accent)] font-bold">We’ll come to you when available</h2>
            <p className="mt-3 text-sm leading-6 text-[#bbb0a1]">If you’re already in New Orleans and want in-person help sorting out the day, call or text the Concierge Desk. We’ll confirm whether a visit is available and arrange the location and timing directly.</p>
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