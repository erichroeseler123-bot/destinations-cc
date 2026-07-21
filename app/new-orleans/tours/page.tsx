import type { Metadata } from "next";
import JsonLd from "@/app/components/dcc/JsonLd";
import OutpostConsole from "./OutpostConsole";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { NEW_ORLEANS_TOURS_PATH, METADATA, STOREFRONT_PRODUCTS } from "./pageConfig";

import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const origin = isWto ? "https://www.welcometoneworleanstours.com" : "https://destinationcommandcenter.com";

  return {
    title: METADATA.title,
    description: METADATA.description,
    keywords: METADATA.keywords,
    metadataBase: new URL(origin),
    alternates: { canonical: isWto ? "/" : NEW_ORLEANS_TOURS_PATH },
    openGraph: {
      title: METADATA.title,
      description: METADATA.description,
      url: isWto ? "/" : NEW_ORLEANS_TOURS_PATH,
      type: "website",
    },
  };
}

function JsonLdGraph() {
  const productItems = STOREFRONT_PRODUCTS.map((item) => ({
    name: item.title,
    description: item.description,
    url: `${NEW_ORLEANS_TOURS_PATH}#${item.id}`,
  }));

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          buildWebPageJsonLd({
            path: NEW_ORLEANS_TOURS_PATH,
            name: "Welcome To New Orleans Tours",
            description: METADATA.description,
            dateModified: "2026-06-29",
            isPartOfPath: "/new-orleans",
          }),
          buildBreadcrumbJsonLd([
            { name: "New Orleans", item: "/new-orleans" },
            { name: "Tours", item: NEW_ORLEANS_TOURS_PATH },
          ]),
          buildCollectionPageJsonLd({
            path: NEW_ORLEANS_TOURS_PATH,
            name: "Welcome To New Orleans Tours",
            description: METADATA.description,
            items: productItems,
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
