import type { Metadata } from "next";
import DellsCategoryPage from "../components/DellsCategoryPage";

export const metadata: Metadata = {
  title: "Wisconsin Dells Waterparks | Indoor, Outdoor & Resort Planning",
  description: "Plan a Wisconsin Dells waterpark day by indoor vs outdoor, resort vs day-use, family fit, weather, and how much of the trip you want to spend in the water.",
  alternates: { canonical: "/waterparks" },
};

export default function Page() {
  return (
    <DellsCategoryPage
      eyebrow="Wisconsin Dells waterparks"
      title="Choose the waterpark role before you choose the waterpark."
      intro="A resort waterpark, a dedicated day-use park, an indoor weather backup, and an all-day outdoor park are different trip decisions. Start with what problem the waterpark needs to solve."
      items={[
        { title: "Staying at a waterpark resort", body: "If strong waterpark access is already included with your stay, use that value before adding another expensive all-day ticket.", href: "/families", cta: "Build the family plan" },
        { title: "Need an indoor weather-proof day", body: "Indoor waterparks are one of the easiest ways to protect a Dells trip from rain, cold, or an unstable forecast.", href: "/rainy-day", cta: "Plan for rain" },
        { title: "Want a full outdoor waterpark day", body: "Treat it as the anchor. Do not also schedule a major river tour, multiple Parkway attractions, and a long dinner drive unless your group genuinely wants a marathon.", href: "/parkway", cta: "Plan the Parkway area" },
        { title: "First trip to the Dells", body: "A waterpark is part of the modern Dells, but the river is what makes the destination unique. Balance one waterpark block with one signature local experience.", href: "/first-time", cta: "Open the first-time plan" },
        { title: "Adults or couples", body: "You may want less waterpark time and more river, dinner, resort, downtown, or nightlife time than a family itinerary would suggest.", href: "/adults", cta: "See the adult plan" },
        { title: "Research the broader destination", body: "Use Destination Command Center when you want the wider Wisconsin Dells picture before narrowing the day here.", href: "https://www.destinationcommandcenter.com/wisconsin-dells?utm_source=welcometothedells&utm_medium=referral&utm_campaign=dells-waterparks", cta: "Research Wisconsin Dells" },
      ]}
      note="Waterpark hours, admission rules, resort access, day passes, closures, and pricing can change. Confirm current details with the property before building the rest of the day around them."
    />
  );
}
