import type { Metadata } from "next";
import JsonLd from "@/app/components/dcc/JsonLd";
import OutpostConsole from "./OutpostConsole";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { NEW_ORLEANS_TOURS_PATH, METADATA, CATEGORIES } from "./pageConfig";

export const metadata: Metadata = {
  title: METADATA.title,
  description: METADATA.description,
  keywords: METADATA.keywords,
  alternates: { canonical: NEW_ORLEANS_TOURS_PATH },
  openGraph: {
    title: METADATA.title,
    description: METADATA.description,
    url: NEW_ORLEANS_TOURS_PATH,
    type: "website",
  },
};

function JsonLdGraph() {
  const categoryItems = CATEGORIES.slice(1).map((item) => ({
    name: item.label,
    description: `Browse tours under the ${item.label} category in New Orleans.`,
    url: `${NEW_ORLEANS_TOURS_PATH}?category=${item.id}`,
  }));

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          buildWebPageJsonLd({
            path: NEW_ORLEANS_TOURS_PATH,
            name: "New Orleans Tours Outpost",
            description:
              "Public New Orleans tours Outpost dashboard for swamp airboats, haunted ghosts, creole food walks, and paddlewheels.",
            dateModified: "2026-06-29",
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
              "Outpost telemetry category lanes for New Orleans tours and visitor experiences.",
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
      <OutpostConsole />
    </>
  );
}
