import React from "react";
import { SeoPageRecord, LiveProductAdapter, DraftProduct } from "../data/types";
import { getProductById } from "../data/index";
import {
  WNO_ORGANIZATION_ID,
  WNO_ORIGIN,
  WNO_WEBSITE_ID,
} from "../lib/structuredData";

function buildProductSchema(product: LiveProductAdapter | DraftProduct) {
  if (product.status !== "live" || !product.schemaEligibility?.productSchema) return null;
  const liveProduct = product as LiveProductAdapter;
  const isPlantation = liveProduct.categoryIds.includes("plantation-tours");

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: liveProduct.title,
    description: liveProduct.description,
    image: isPlantation
      ? undefined
      : liveProduct.imageUrl
        ? `${WNO_ORIGIN}${liveProduct.imageUrl}`
        : undefined,
    brand: liveProduct.operatorAttribution
      ? {
          "@type": "Brand",
          name: liveProduct.operatorAttribution,
        }
      : { "@id": WNO_ORGANIZATION_ID },
  };
}

export default function StructuredData({ page }: { page: SeoPageRecord }) {
  const schemas: Record<string, unknown>[] = [];

  schemas.push({
    "@context": "https://schema.org",
    "@type": page.variant === "category" ? "CollectionPage" : "WebPage",
    name: page.heroTitle,
    description: page.openingAnswer || "",
    url: page.canonicalRoute,
    isPartOf: { "@id": WNO_WEBSITE_ID },
    publisher: { "@id": WNO_ORGANIZATION_ID },
  });

  page.liveProductIds.forEach((id: string) => {
    const product = getProductById(id);
    if (!product) return;
    const productSchema = buildProductSchema(product);
    if (productSchema) schemas.push(productSchema);
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}
