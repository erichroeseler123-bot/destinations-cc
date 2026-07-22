import { STOREFRONT_PRODUCTS } from '../tours/pageConfig';
import { DRAFT_PRODUCTS } from './draftProducts';

import { CATEGORIES } from './categories';
import { AREAS } from './areas';
import { SEO_PAGES } from './pages';
import type { LiveProductAdapter, DraftProduct, SeoPageRecord, Provider, Category, AreaRecord, KeywordCluster } from './types';

export type { LiveProductAdapter, DraftProduct, SeoPageRecord, Provider, Category, AreaRecord, KeywordCluster };
export { CATEGORIES, AREAS, SEO_PAGES, DRAFT_PRODUCTS };

const LIVE_PRODUCTS: LiveProductAdapter[] = STOREFRONT_PRODUCTS.map(p => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  shortTitle: p.title,
  operatorAttribution: p.operatorName,
  providerId: null,
  status: "live" as const,
  isIndexable: true,
  isBookable: true,
  description: p.description,
  imageUrl: p.imageUrl,
  imageAlt: (p as any).imageAlt || null,
  categoryIds: [],
  areaIds: [],
  travelerFitTags: [],
  duration: null,
  daypart: null,
  meetingPoint: null,
  hotelPickup: null,
  transportation: null,
  selfDrive: null,
  walkingLevel: null,
  indoorOutdoor: null,
  accessibilityNotes: null,
  ageRequirements: null,
  weatherPolicy: null,
  cancellationDeadline: null,
  refundResponsibility: null,
  fareHarborUrl: null,
  itemId: p.itemId,
  flowId: p.flowId,
  companyShortname: p.companyShortname,
  affiliateTracking: (p as any).affiliateTracking || null,
  instantConfirmation: null,
  availabilitySource: null,
  supportResponsibility: null,
  inclusions: [],
  exclusions: [],
  imageAttributionId: null,
  metadataImage: null,
  relatedProductIds: [],
  schemaEligibility: { productSchema: true, faqSchema: false, collectionSchema: false },
  price: (p as any).price || null,
  menuUrl: (p as any).menuUrl || null,
  keywords: (p as any).keywords || [],
  imagePresentation: (p as any).imagePresentation || null,
    publicAttributionName: (p as any).publicAttributionName || null,
  detailPageTitle: (p as any).detailPageTitle || null,
  metaDescription: (p as any).metaDescription || null,
  bookingUrl: (p as any).bookingUrl || null,
  bestFor: (p as any).bestFor || null,
  bookingPlatform: (p as any).bookingPlatform || null

}));

export const ALL_PRODUCTS: (LiveProductAdapter | DraftProduct)[] = [...LIVE_PRODUCTS, ...Object.values(DRAFT_PRODUCTS)];

export function getProductById(id: string): LiveProductAdapter | DraftProduct | undefined {
  return ALL_PRODUCTS.find(p => p.id === id);
}

export * from "./providers";
export * from "./draftProducts";
export * from "./dayPlans";
export * from "./keywords";

export const FEATURE_FLAG_MY_TRIP = false;
