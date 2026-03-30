import type { Metadata } from "next";
import CityGuideStubPage from "@/app/components/dcc/CityGuideStubPage";
import { NEW_ORLEANS_GUIDE_PAGES } from "@/src/data/new-orleans-city-site";

const page = NEW_ORLEANS_GUIDE_PAGES.food;

export const metadata: Metadata = {
  title: "New Orleans Food Guide | Destination Command Center",
  description: page.description,
  keywords: [
    "new orleans food guide",
    "what to eat in new orleans",
    "new orleans food tours",
    "best food in new orleans",
    "new orleans restaurants guide",
  ],
  alternates: { canonical: "/new-orleans/food" },
};

export default function NewOrleansFoodPage() {
  return (
    <CityGuideStubPage
      path="/new-orleans/food"
      cityHref="/new-orleans"
      cityName="New Orleans"
      title={page.title}
      description={page.description}
      highlights={page.highlights}
      primaryHref="/new-orleans/tours"
      primaryLabel="Browse Food Tours"
      secondaryHref="/new-orleans"
      secondaryLabel="Back to New Orleans"
      tertiaryHref="/new-orleans/things-to-do"
      tertiaryLabel="Things to Do"
    />
  );
}
