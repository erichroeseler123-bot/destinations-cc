import { STOREFRONT_PRODUCTS } from "../tours/pageConfig";
import { PRODUCT_IMAGES } from "../data/imageRegistry";

const ORIGIN = "https://welcometoneworleanstours.com";
const CATALOG_URL = `${ORIGIN}/tour-catalog.json`;

export const revalidate = 3600;

export function buildPublicTourCatalog() {
  return {
    schemaVersion: "1.1",
    name: "Welcome to New Orleans Tours public tour catalog",
    canonicalSite: ORIGIN,
    canonicalCatalogUrl: CATALOG_URL,
    role: "tour discovery, comparison, concierge assistance, and affiliate booking broker",
    bookingPlatform: "FareHarbor",
    generatedFrom: "live storefront registry",
    products: STOREFRONT_PRODUCTS.map((product) => {
      const image = PRODUCT_IMAGES[product.slug];
      const bookingVariants = product.bookingVariants?.map((variant) => ({
        label: variant.label,
        fareHarborItemId: variant.itemId,
        fareHarborFlowId: variant.flowId,
      })) ?? [];

      return {
        slug: product.slug,
        canonicalUrl: `${ORIGIN}/tours/${product.slug}`,
        title: product.title,
        category: product.category,
        description: product.description,
        bestFor: product.bestFor ?? null,
        operator: product.operatorName,
        broker: "Welcome to New Orleans Tours",
        bookingPlatform: "FareHarbor",
        fareHarborCompanyShortname: product.companyShortname,
        fareHarborItemId: product.itemId ?? null,
        fareHarborFlowId: product.flowId ?? null,
        bookingVariants,
        duration: product.durationLabel ?? null,
        transportation: product.transportationSummary ?? null,
        pickup: product.pickupSummary ?? null,
        decisionContext: {
          bestFit: product.bestFit ?? [],
          notIdealFor: product.notIdealFor ?? [],
          childrenConsiderations: product.childrenConsiderations ?? [],
          highlights: product.highlights ?? [],
          bookingConfirmations: product.bookingConfirmations ?? [],
          physicalFormat: product.physicalFormat ?? null,
          logistics: product.logistics ?? null,
          historicalContextNote: product.historicalContextNote ?? null,
        },
        image: image?.verifiedRights
          ? {
              url: image.url.startsWith("http") ? image.url : `${ORIGIN}${image.url}`,
              alt: image.alt,
              source: image.source,
              rightsStatus: image.rightsStatus ?? "approved",
            }
          : null,
      };
    }),
  };
}

export async function GET() {
  return Response.json(buildPublicTourCatalog(), {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "index, follow",
      "Link": `<${CATALOG_URL}>; rel=canonical`,
    },
  });
}
