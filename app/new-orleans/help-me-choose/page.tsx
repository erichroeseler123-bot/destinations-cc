import React from "react";
import NewOrleansRecommendationFlow from "../components/NewOrleansRecommendationFlow";
import CinematicPageHero from "../components/CinematicPageHero";
import ExpandedChooserEntry from "./ExpandedChooserEntry";

export const metadata = {
  title: "Help Me Choose | New Orleans Tours",
  description: "Choose from city tours, swamps, river cruises, plantations, cocktails, ghosts and full-day combinations—or answer a few simple questions for a recommendation.",
};

export default function HelpMeChoosePage() {
  return (
    <div className="bg-[#080708] text-[#fdfbf7] min-h-screen">
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
    </div>
  );
}
