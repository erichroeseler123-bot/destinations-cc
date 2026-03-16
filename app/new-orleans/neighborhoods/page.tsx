import type { Metadata } from "next";
import CityGuideStubPage from "@/app/components/dcc/CityGuideStubPage";
import { NEW_ORLEANS_GUIDE_PAGES } from "@/src/data/new-orleans-city-site";

const page = NEW_ORLEANS_GUIDE_PAGES.neighborhoods;

export const metadata: Metadata = {
  title: "New Orleans Neighborhood Guide | Destination Command Center",
  description: page.description,
  alternates: { canonical: "/new-orleans/neighborhoods" },
};

export default function NewOrleansNeighborhoodsPage() {
  return (
    <CityGuideStubPage
      path="/new-orleans/neighborhoods"
      cityHref="/new-orleans"
      cityName="New Orleans"
      title={page.title}
      description={page.description}
      highlights={page.highlights}
      primaryHref="/new-orleans/things-to-do"
      primaryLabel="Explore Things to Do"
      secondaryHref="/new-orleans"
      secondaryLabel="Back to New Orleans"
    />
  );
}
