import React from "react";
import NewOrleansRecommendationFlow from "../components/NewOrleansRecommendationFlow";
import ExpandedChooserEntry from "./ExpandedChooserEntry";

export const metadata = {
  title: "Help Me Choose | New Orleans Tours",
  description: "Choose from city tours, swamps, river cruises, plantations, cocktails, ghosts and full-day combinations—or answer a few simple questions for a recommendation.",
};

export default function HelpMeChoosePage() {
  return (
    <>
      <ExpandedChooserEntry />
      <div id="guided-planner" className="scroll-mt-20">
        <NewOrleansRecommendationFlow />
      </div>
    </>
  );
}
