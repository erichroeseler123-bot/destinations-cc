import type { Metadata } from "next";
import CityGuideStubPage from "@/app/components/dcc/CityGuideStubPage";
import { NEW_ORLEANS_GUIDE_PAGES } from "@/src/data/new-orleans-city-site";

const page = NEW_ORLEANS_GUIDE_PAGES.music;

export const metadata: Metadata = {
  title: "New Orleans Music Guide | Destination Command Center",
  description: page.description,
  keywords: [
    "new orleans music guide",
    "live music in new orleans",
    "new orleans jazz guide",
    "frenchmen street guide",
    "new orleans shows",
  ],
  alternates: { canonical: "/new-orleans/music" },
};

export default function NewOrleansMusicPage() {
  return (
    <CityGuideStubPage
      path="/new-orleans/music"
      cityHref="/new-orleans"
      cityName="New Orleans"
      title={page.title}
      description={page.description}
      highlights={page.highlights}
      primaryHref="/new-orleans/shows"
      primaryLabel="See New Orleans Shows"
      secondaryHref="/new-orleans"
      secondaryLabel="Back to New Orleans"
      tertiaryHref="/new-orleans/weekend-guide"
      tertiaryLabel="Weekend Guide"
    />
  );
}
