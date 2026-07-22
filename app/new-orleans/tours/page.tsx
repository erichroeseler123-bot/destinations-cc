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
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const origin = isWto ? "https://www.welcometoneworleanstours.com" : "https://destinationcommandcenter.com";

  const canonical = isWto ? "/" : NEW_ORLEANS_TOURS_PATH;

  return {
    applicationName: "Welcome to New Orleans Tours",
    title: METADATA.title,
    description: METADATA.description,
    keywords: METADATA.keywords,
    metadataBase: new URL(origin),
    alternates: { canonical },
    openGraph: {
      siteName: "Welcome to New Orleans Tours",
      title: METADATA.title,
      description: METADATA.description,
      url: canonical,
      type: "website",
      images: [
        {
          url: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
          width: 1200,
          height: 630,
          alt: "Welcome to New Orleans Tours",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: METADATA.title,
      description: METADATA.description,
      images: ["/images/travel-markets/new-orleans/french-quarter-street.jpg"],
    },
  };
}

export default async function NewOrleansToursPage() {
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";

  const basePath = isWto ? "" : NEW_ORLEANS_TOURS_PATH;

  const productItems = STOREFRONT_PRODUCTS.map((item) => ({
    name: item.title,
    description: item.description,
    url: `${basePath}/tours/${item.slug}`,
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildWebPageJsonLd({
              path: isWto ? "/" : NEW_ORLEANS_TOURS_PATH,
              name: "Welcome To New Orleans Tours",
              description: METADATA.description,
              isPartOfPath: isWto ? undefined : "/new-orleans",
            }),
            buildBreadcrumbJsonLd(
              isWto
                ? [ { name: "New Orleans Tours", item: "/" } ]
                : [
                    { name: "New Orleans", item: "/new-orleans" },
                    { name: "Tours", item: NEW_ORLEANS_TOURS_PATH },
                  ]
            ),
            buildCollectionPageJsonLd({
              path: isWto ? "/" : NEW_ORLEANS_TOURS_PATH,
              name: "Welcome To New Orleans Tours",
              description: METADATA.description,
              items: productItems,
            }),
          ],
        }}
      />
      <OutpostConsole />
    </>
  );
}
