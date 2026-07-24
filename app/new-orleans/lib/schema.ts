import { NEW_ORLEANS_ORIGIN } from "../tours/pageConfig";
import { PRODUCT_IMAGES } from "../data/imageRegistry";

export function generateProductSchemaGraph({
  slug,
  name,
  description,
  providerName,
}: {
  slug: string;
  name: string;
  description: string;
  providerName: string;
}) {
  const url = `${NEW_ORLEANS_ORIGIN}/tours/${slug}`;
  const imageObj = PRODUCT_IMAGES[slug];
  const imageUrl = (imageObj && imageObj.verifiedRights) ? `${NEW_ORLEANS_ORIGIN}${imageObj.url}` : undefined;

  const provider = {
    "@type": "Organization",
    name: providerName,
  };

  const broker = {
    "@type": "Organization",
    name: "Welcome to New Orleans Tours",
    url: NEW_ORLEANS_ORIGIN,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: name,
        description: description,
        url: url,
        ...(imageUrl && { image: imageUrl }),
        provider: provider,
        broker: broker,
      },
      {
        "@type": "TouristTrip",
        "@id": `${url}#trip`,
        name: name,
        description: description,
        url: url,
        ...(imageUrl && { image: imageUrl }),
        provider: provider,
        broker: broker,
        itemOffered: {
          "@id": `${url}#service`
        }
      }
    ]
  };
}

export function generateCategorySchemaGraph({
  urlPath,
  name,
  description,
  items,
}: {
  urlPath: string;
  name: string;
  description: string;
  items: { slug: string; name: string; description: string; providerName: string; }[];
}) {
  const url = `${NEW_ORLEANS_ORIGIN}${urlPath}`;

  const hasPart = items.map(item => ({
    "@type": "TouristTrip",
    name: item.name,
    description: item.description,
    url: `${NEW_ORLEANS_ORIGIN}/tours/${item.slug}`,
    provider: {
      "@type": "Organization",
      name: item.providerName
    },
    broker: {
      "@type": "Organization",
      name: "Welcome to New Orleans Tours",
      url: NEW_ORLEANS_ORIGIN,
    }
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url: url,
        name: name,
        description: description,
        hasPart: hasPart
      }
    ]
  };
}
