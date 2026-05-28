import type { Metadata } from "next";
import JsonLd from "@/app/components/dcc/JsonLd";
import { NetworkCommercialPage } from "@/app/components/network/NetworkCommercialPage";
import { networkThemes } from "@/app/components/network/themes";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { NEW_ORLEANS_TOURS_PATH, newOrleansToursPageConfig } from "./pageConfig";

export const metadata: Metadata = {
  title: newOrleansToursPageConfig.metadata.title,
  description: newOrleansToursPageConfig.metadata.description,
  keywords: newOrleansToursPageConfig.metadata.keywords,
  alternates: { canonical: NEW_ORLEANS_TOURS_PATH },
  openGraph: {
    title: newOrleansToursPageConfig.metadata.title,
    description: newOrleansToursPageConfig.metadata.description,
    url: NEW_ORLEANS_TOURS_PATH,
    type: "website",
  },
};

function JsonLdGraph() {
  const categoryItems = newOrleansToursPageConfig.categoryGrid?.items.map((item) => ({
    name: item.title,
    description: item.body,
    url: item.cta.href,
  })) || [];

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          buildWebPageJsonLd({
            path: NEW_ORLEANS_TOURS_PATH,
            name: "New Orleans Tours",
            description:
              "Public New Orleans tours landing page for swamp tours, airboat tours, hotel pickup, family-friendly tours, private groups, and rainy-day options.",
            dateModified: "2026-05-28",
            isPartOfPath: "/new-orleans",
          }),
          buildBreadcrumbJsonLd([
            { name: "New Orleans", item: "/new-orleans" },
            { name: "Tours", item: NEW_ORLEANS_TOURS_PATH },
          ]),
          buildCollectionPageJsonLd({
            path: NEW_ORLEANS_TOURS_PATH,
            name: "New Orleans tour categories",
            description:
              "Commercial category lanes for New Orleans tours and visitor experiences.",
            items: categoryItems,
          }),
        ],
      }}
    />
  );
}

export default function NewOrleansToursPage() {
  return (
    <>
      <JsonLdGraph />
      <NetworkCommercialPage theme={networkThemes.wno} page={newOrleansToursPageConfig} />
    </>
  );
}
