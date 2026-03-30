import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AttractionGuideTemplate from "@/app/components/dcc/AttractionGuideTemplate";
import TourCategoryGuidePage from "@/app/components/dcc/TourCategoryGuidePage";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import {
  getManifestAttraction,
  getManifestCategory,
  listManifestCitySlugs,
  getAttractionsManifest,
  getCategoriesManifest,
  getCityManifest,
} from "@/lib/dcc/manifests/cityExpansion";
import JsonLd from "@/app/components/dcc/JsonLd";
import {
  buildAttractionJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/dcc/jsonld";

type Params = { city: string; attraction: string };

export function generateStaticParams() {
  return listManifestCitySlugs().flatMap((city) => {
    const attractionParams = (getAttractionsManifest(city)?.attractions || []).map((entry) => ({
      city,
      attraction: entry.slug,
    }));
    const categoryParams = (getCategoriesManifest(city)?.categories || []).map((entry) => ({
      city,
      attraction: entry.slug,
    }));
    return [...attractionParams, ...categoryParams];
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city, attraction } = await params;
  const cityName = city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const category = getManifestCategory(city, attraction);
  if (category) {
    return {
      title: `${category.title} in ${cityName}`,
      description: category.description,
      keywords: [
        category.title,
        `${category.title} in ${cityName}`,
        `best ${category.title.toLowerCase()} in ${cityName}`,
      ],
      alternates: { canonical: `/${city}/${attraction}` },
      openGraph: {
        title: `${category.title} in ${cityName}`,
        description: category.description,
        url: `https://destinationcommandcenter.com/${city}/${attraction}`,
        type: "website",
      },
    };
  }
  const entry = getManifestAttraction(city, attraction);
  if (!entry) return { title: "Attraction Guide" };

  return {
    title: `${entry.name} Guide, Tours, and Things to Do | ${cityName}`,
    description: entry.heroSummary,
    keywords: [
      entry.name,
      `${entry.name} tours`,
      `${entry.name} things to do`,
      `${entry.name} ${cityName}`,
    ],
    alternates: { canonical: `/${city}/${entry.slug}` },
    openGraph: {
      title: `${entry.name} Guide | ${cityName}`,
      description: entry.heroSummary,
      url: `https://destinationcommandcenter.com/${city}/${entry.slug}`,
      type: "website",
    },
  };
}

export default async function AttractionGuidePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city, attraction } = await params;
  const cityManifest = getCityManifest(city);
  const time = cityManifest?.timezone
    ? {
        cityName: cityManifest.name,
        timezone: cityManifest.timezone,
      }
    : null;
  const weather = cityManifest?.coordinates
    ? {
        locationLabel: cityManifest.name,
        lat: cityManifest.coordinates.lat,
        lng: cityManifest.coordinates.lng,
      }
    : null;
  const category = getManifestCategory(city, attraction);
  if (category) {
    const viatorAction = await getViatorActionForPlace({
      slug: `${city}-${category.slug}`,
      name: category.title,
      citySlug: city,
    });

    return (
      <>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "@id": `https://destinationcommandcenter.com/${city}/${attraction}`,
                url: `https://destinationcommandcenter.com/${city}/${attraction}`,
                name: category.title,
                description: category.description,
              },
              buildBreadcrumbJsonLd([
                { name: "Home", item: "/" },
                {
                  name: city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
                  item: `/${city}`,
                },
                { name: category.title, item: `/${city}/${attraction}` },
              ]),
            ],
          }}
        />
        <TourCategoryGuidePage
          cityName={city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
          citySlug={city}
          title={category.title}
          description={category.description}
          intro={category.intro || category.description}
          bullets={category.bullets || []}
          intents={category.intents || []}
          inventoryTitle={category.inventoryTitle}
          filterTokens={category.filterTokens || []}
          products={viatorAction.products}
          weather={weather}
          heroImage={
            cityManifest?.heroImage
              ? {
                  src: cityManifest.heroImage,
                  alt: cityManifest.heroImageAlt || `${cityManifest.name} city guide hero image`,
                }
              : null
          }
        />
      </>
    );
  }

  const entry = getManifestAttraction(city, attraction);
  if (!entry) notFound();

  const outdoorTypes = new Set([
    "park",
    "beach",
    "nature-area",
    "coastline",
    "waterfront",
    "garden",
    "landmark",
    "historic-route",
    "pier",
    "historic-district",
    "district",
    "day-trip",
  ]);
  const outdoorCategories = new Set([
    "outdoor",
    "beach",
    "hiking",
    "scenic",
    "walks",
    "sightseeing",
    "boat-tours",
    "snorkeling",
    "surf",
    "sunset",
    "waterfront",
    "gardens",
  ]);
  const showAttractionWeather =
    Boolean(weather) &&
    (outdoorTypes.has(entry.type || "") ||
      (entry.categories || []).some((category) => outdoorCategories.has(category)));

  const viatorAction = await getViatorActionForPlace({
    slug: entry.slug,
    name: `${city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())} ${entry.name}`,
    citySlug: city,
  });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildAttractionJsonLd({
              path: `/${city}/${entry.slug}`,
              type: entry.schemaType,
              name: entry.name,
              description: entry.about || entry.heroSummary,
              containedInPath: `/${city}`,
              containedInName: cityManifest?.name || city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
              touristTypes: ["Leisure travelers", "First-time visitors", "Experience-focused travelers"],
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              {
                name: cityManifest?.name || city.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
                item: `/${city}`,
              },
              { name: entry.name, item: `/${city}/${entry.slug}` },
            ]),
          ],
        }}
      />
      <AttractionGuideTemplate
        entry={entry}
        products={viatorAction.products}
        time={time}
        weather={showAttractionWeather ? weather : null}
      />
    </>
  );
}
