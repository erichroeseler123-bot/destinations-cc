import type { Metadata } from "next";
import CityGuideStubPage from "@/app/components/dcc/CityGuideStubPage";
import { NEW_ORLEANS_GUIDE_PAGES } from "@/src/data/new-orleans-city-site";

const page = NEW_ORLEANS_GUIDE_PAGES["weekend-guide"];

export const metadata: Metadata = {
  title: "New Orleans Weekend Guide | What To Do, Where To Stay, and How To Plan",
  description: page.description,
  keywords: [
    "new orleans weekend guide",
    "weekend in new orleans",
    "what to do in new orleans this weekend",
    "new orleans itinerary",
    "new orleans weekend trip",
  ],
  alternates: { canonical: "/new-orleans/weekend-guide" },
};

export default function NewOrleansWeekendGuidePage() {
  return (
    <CityGuideStubPage
      path="/new-orleans/weekend-guide"
      cityHref="/new-orleans"
      cityName="New Orleans"
      title={page.title}
      description={page.description}
      highlights={page.highlights}
      primaryHref="/new-orleans/tours"
      primaryLabel="Browse Tours"
      secondaryHref="/new-orleans/now"
      secondaryLabel="See What’s Happening Now"
      tertiaryHref="/new-orleans/music"
      tertiaryLabel="Plan Music Nights"
    />
  );
}
