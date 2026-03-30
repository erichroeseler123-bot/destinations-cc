import type { Metadata } from "next";
import CityGuideStubPage from "@/app/components/dcc/CityGuideStubPage";
import { NEW_ORLEANS_GUIDE_PAGES } from "@/src/data/new-orleans-city-site";

const page = NEW_ORLEANS_GUIDE_PAGES["things-to-do"];

export const metadata: Metadata = {
  title: "Things to Do in New Orleans | Destination Command Center",
  description: page.description,
  keywords: [
    "things to do in new orleans",
    "best things to do in new orleans",
    "new orleans attractions",
    "new orleans itinerary",
    "new orleans first time guide",
  ],
  alternates: { canonical: "/new-orleans/things-to-do" },
};

export default function NewOrleansThingsToDoPage() {
  return (
    <CityGuideStubPage
      path="/new-orleans/things-to-do"
      cityHref="/new-orleans"
      cityName="New Orleans"
      title={page.title}
      description={page.description}
      highlights={page.highlights}
      primaryHref="/new-orleans/tours"
      primaryLabel="Browse Tours"
      secondaryHref="/new-orleans"
      secondaryLabel="Back to New Orleans"
      tertiaryHref="/new-orleans/neighborhoods"
      tertiaryLabel="Neighborhood Guide"
    />
  );
}
