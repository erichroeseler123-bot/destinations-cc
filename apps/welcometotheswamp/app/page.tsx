import type { Metadata } from "next";
import JsonLd from "@/app/components/JsonLd";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/jsonld";
import { SwampStorefrontPage } from "./StorefrontHomePage";
import { swampStorefrontConfig } from "./pageConfig";

export const pageIntent = "wts_storefront_home";

export const metadata: Metadata = {
  title: swampStorefrontConfig.metadata.title,
  description: swampStorefrontConfig.metadata.description,
  alternates: { canonical: "https://welcometotheswamp.com/" },
  openGraph: {
    title: swampStorefrontConfig.metadata.title,
    description: swampStorefrontConfig.metadata.description,
    url: "https://welcometotheswamp.com/",
    type: "website",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        path: "/",
        name: swampStorefrontConfig.metadata.title,
        description: swampStorefrontConfig.metadata.description,
      }),
      buildBreadcrumbJsonLd([{ name: "Welcome to the Swamp", item: "/" }]),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SwampStorefrontPage page={swampStorefrontConfig} />
    </>
  );
}
