import type { Metadata } from "next";
import DellsCategoryPage from "../components/DellsCategoryPage";

export const metadata: Metadata = {
  title: "Things to Do in Wisconsin Dells | What to Pick",
  description: "Choose what to do in Wisconsin Dells by the kind of day you want: boat tours, waterparks, family attractions, rainy-day activities, adult plans, and tonight options.",
  alternates: { canonical: "/things-to-do" },
};

export default function Page() {
  return (
    <DellsCategoryPage
      eyebrow="Wisconsin Dells things to do"
      title="Start with the kind of day you want—not a list of 100 attractions."
      intro="The Dells is easier when you choose one anchor first. Pick river scenery, waterparks, family energy, a weather-proof day, an adults-only plan, or something for tonight."
      items={[
        { title: "Boat tours & Ducks", body: "The sandstone river is the part of the Dells you cannot recreate in another family-entertainment town.", href: "/boat-tours", cta: "Compare river experiences" },
        { title: "Waterparks", body: "Indoor, outdoor, resort, and day-use waterparks solve very different trips. Start with how much of the day you want to spend in the water.", href: "/waterparks", cta: "Choose a waterpark plan" },
        { title: "Family activities", body: "Keep the day manageable with one big attraction and a few short, low-friction stops.", href: "/families", cta: "Open the family plan" },
        { title: "Rainy-day activities", body: "Indoor waterparks, shows, arcades, meals, and weather-proof attractions keep the trip moving when storms roll in.", href: "/rainy-day", cta: "Build a rainy-day plan" },
        { title: "Adults & couples", body: "River scenery, dinner, nightlife, downtown, scenic stops, and a slower resort pace work without kids in tow.", href: "/adults", cta: "Plan an adults-only Dells trip" },
        { title: "What to do tonight", body: "Dinner, Ghost Boat, downtown, neon, and after-dark options when you need a same-day answer.", href: "/tonight", cta: "See tonight's decision lane" },
      ]}
      note="The strongest Dells day usually has one major anchor, one easy secondary stop, and enough slack that traffic or weather does not wreck the plan."
    />
  );
}
