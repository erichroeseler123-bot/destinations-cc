import type { Metadata } from "next";
import DellsCategoryPage from "../components/DellsCategoryPage";

export const metadata: Metadata = {
  title: "Wisconsin Dells Boat Tours & Ducks | Compare the Classics",
  description: "Compare Wisconsin Dells boat tours, Original Wisconsin Ducks, jet boats, Ghost Boat, sunset cruises, and Upper Dells scenic tours.",
  alternates: { canonical: "/boat-tours" },
};

export default function Page() {
  return (
    <DellsCategoryPage
      eyebrow="Wisconsin Dells boat tours"
      title="The river is the reason the Dells is the Dells."
      intro="Choose by pace and mood. The controlled ticket links below lead to the current operator booking path; availability, times, prices, and final terms are confirmed there."
      items={[
        { title: "Original Wisconsin Ducks", body: "The classic amphibious road-to-river experience and an easy first-timer answer.", href: "/out/wisconsin-dells/ducks-primary", cta: "Check Duck tickets" },
        { title: "Jet Boat Adventures", body: "A faster, wetter, higher-energy canyon run when the group wants the river to feel like an attraction.", href: "/out/wisconsin-dells/jet-boat-primary", cta: "Check jet boat times" },
        { title: "Upper Dells Scenic Boat Tour", body: "The slower sandstone-and-scenery version, including the classic Upper Dells experience.", href: "/out/wisconsin-dells/classic-upper", cta: "Check scenic boat tours" },
        { title: "Sunset Dinner Cruise", body: "A higher-commitment evening move when you want the river and dinner solved together.", href: "/out/wisconsin-dells/sunset-dinner", cta: "Check sunset departures" },
        { title: "Ghost Boat", body: "An after-dark canyon experience for groups that want atmosphere instead of another daytime attraction.", href: "/out/wisconsin-dells/ghost-boat", cta: "Check Ghost Boat times" },
        { title: "Not sure which river trip fits", body: "Start with the first-time plan if you need help balancing a river experience with the rest of the day.", href: "/first-time", cta: "Use the first-time plan" },
      ]}
      note="Do not stack multiple major river experiences into one day unless that is the whole point of the trip. Pick the version that matches your group and leave room for downtown, food, and weather."
    />
  );
}
