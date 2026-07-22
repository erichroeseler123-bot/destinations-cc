import React from 'react';
import { SeoPageRecord, LiveProductAdapter, DraftProduct } from '../data/types';
import { getProductById } from '../data/index';

function buildProductSchema(product: LiveProductAdapter | DraftProduct) {
  if (product.status !== "live" || !product.schemaEligibility?.productSchema) return null;
  const liveProduct = product as LiveProductAdapter;

  const isPlantation = liveProduct.categoryIds.includes("plantation-tours");

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": liveProduct.title,
    "description": liveProduct.description,
    "image": isPlantation ? undefined : (liveProduct.imageUrl ? `https://www.welcometoneworleanstours.com${liveProduct.imageUrl}` : undefined),
    "brand": {
      "@type": "Brand",
      "name": liveProduct.operatorAttribution || "Welcome to New Orleans Tours"
    }
  };
}

export default function StructuredData({ page }: { page: SeoPageRecord }) {
  const schemas: Record<string, unknown>[] = [];

  const webpage = {
    "@context": "https://schema.org",
    "@type": page.variant === "category" ? "CollectionPage" : "WebPage",
    "name": page.heroTitle,
    "description": page.openingAnswer || "",
    "url": page.canonicalRoute
  };
  schemas.push(webpage);

  page.liveProductIds.forEach((id: string) => {
    const prod = getProductById(id);
    if (prod) {
      const prodSchema = buildProductSchema(prod);
      if (prodSchema) schemas.push(prodSchema);
    }
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}
