import type { Metadata } from "next";
import CityGuideStubPage from "@/app/components/dcc/CityGuideStubPage";
import { NEW_ORLEANS_GUIDE_PAGES } from "@/src/data/new-orleans-city-site";

const page = NEW_ORLEANS_GUIDE_PAGES["family-friendly"];

export const metadata: Metadata = {
  title: "Family-Friendly New Orleans | Destination Command Center",
  description: page.description,
  alternates: { canonical: "/new-orleans/family-friendly" },
};

export default function NewOrleansFamilyFriendlyPage() {
  return (
    <CityGuideStubPage
      path="/new-orleans/family-friendly"
      cityHref="/new-orleans"
      cityName="New Orleans"
      title={page.title}
      description={page.description}
      highlights={page.highlights}
      primaryHref="/new-orleans/tours"
      primaryLabel="Browse Family Activities"
      secondaryHref="/new-orleans"
      secondaryLabel="Back to New Orleans"
    />
  );
}
