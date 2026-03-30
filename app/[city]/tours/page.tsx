export const dynamicParams = false;

import type { Metadata } from "next";
import aliases from "@/data/city-aliases.json";
import CityToursPageContent from "@/app/components/dcc/CityToursPageContent";
import { getCityManifest } from "@/lib/dcc/manifests/cityExpansion";
import { getCityAuthorityConfig } from "@/src/data/city-authority-config";
import { resolveCanonicalCityKey } from "@/src/data/city-aliases";

type Params = { city: string };

export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
}

function titleCase(s: string) {
  return s
    .split(/[\s-]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city } = await params;
  const cityKey = resolveCanonicalCityKey(city);
  const cityName = titleCase(cityKey);
  const manifest = getCityManifest(cityKey);
  const config = getCityAuthorityConfig(cityKey);

  const description =
    manifest?.featuredTours?.description ||
    config?.seoDescription ||
    `Compare tours, activities, and bookable things to do in ${cityName}, with category guides and guided experience ideas.`;

  return {
    title: `${cityName} Tours, Activities, and Things to Do`,
    description,
    keywords: [
      `${cityName} tours`,
      `${cityName} activities`,
      `things to do in ${cityName}`,
      `${cityName} guided tours`,
    ],
    alternates: { canonical: `/${cityKey}/tours` },
    openGraph: {
      title: `${cityName} Tours, Activities, and Things to Do`,
      description,
      url: `https://destinationcommandcenter.com/${cityKey}/tours`,
      type: "website",
    },
  };
}

export default async function CityToursPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  return <CityToursPageContent cityKey={resolveCanonicalCityKey(city)} />;
}
