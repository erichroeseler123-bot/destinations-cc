export type ProviderStatus = "live" | "onboarding" | "pending_contract" | "pending_inventory" | "inactive";

export interface SupportResponsibility {
  handledBy: "marketplace" | "provider" | "mixed";
  contactAvailability: string | null;
}

export interface CancellationSummary {
  deadline: string | null;
  refundResponsibility: "marketplace" | "provider" | "platform" | null;
}

export interface Provider {
  id: string;
  displayName: string;
  legalName: string | null;
  publicAttributionName: string;
  status: ProviderStatus;
  fareHarborShortname: string | null;
  bookingPlatform: string | null;
  supportResponsibility: SupportResponsibility;
  cancellationSummary: CancellationSummary;
  publicContactAvailability: string | null;
  productIds: string[];
  categoryIds: string[];
  onboardingChecklist: string[];
  verificationStatus: "verified" | "unverified" | "partial";
}

export interface SchemaEligibility {
  productSchema: boolean;
  faqSchema: boolean;
  collectionSchema: boolean;
}

export interface ImageAttribution {
  id: string;
  sourceUrl: string;
  author: string;
  authorUrl?: string;
  license: string;
  licenseUrl?: string;
}

export type ProductStatus = "draft" | "content_ready" | "booking_pending" | "live" | "paused";

export interface ProductBase {
  id: string;
  providerId: string | null;
  slug: string;
  title: string;
  shortTitle: string | null;
  operatorAttribution: string | null;
  categoryIds: string[];
  areaIds: string[];
  travelerFitTags: string[];
  duration: string | null;
  daypart: string | null;
  meetingPoint: string | null;
  hotelPickup: boolean | null;
  transportation: string | null;
  selfDrive: boolean | null;
  walkingLevel: string | null;
  indoorOutdoor: string | null;
  accessibilityNotes: string | null;
  ageRequirements: string | null;
  weatherPolicy: string | null;
  cancellationDeadline: string | null;
  refundResponsibility: string | null;
  bookingPlatform: string | null;
  fareHarborUrl: string | null;
  itemId: string | number | undefined;
  flowId: string | number | undefined;
  companyShortname: string;
  affiliateTracking: string | null;
  instantConfirmation: boolean | null;
  availabilitySource: string | null;
  supportResponsibility: SupportResponsibility | null;
  inclusions: string[];
  exclusions: string[];
  imageAttributionId: string | null;
  metadataImage: string | null;
  relatedProductIds: string[];
  schemaEligibility: SchemaEligibility | null;
  status: ProductStatus;
  isIndexable: boolean;
  isBookable: boolean;
}

export interface DraftProduct extends ProductBase {
  description: string | null; // Drafts might not be tied to FH fields
}

export interface LiveProductAdapter extends ProductBase {
  // Overrides to match what pageConfig needs for live rendering natively
  description: string;
  price: string;
  menuUrl: string;
  keywords: string[];
  imagePresentation: "editorial" | "photographic";
  imageUrl: string | null;
  imageAlt: string | null;
  detailPageTitle: string;
  metaDescription: string;
  bookingUrl: string;
  // Specific live overrides
  bestFor: string;
  status: "live";
  isIndexable: true;
  isBookable: true;
}

export interface Category {
  id: string;
  title: string;
  slug: string;
  parentCategoryId: string | null;
  priority: number;
  status: "live" | "draft";
  imageAttributionId: string | null;
}

export interface AreaRecord {
  id: string;
  title: string;
  slug: string;
  visitorSummary: string | null;
  whyVisitorsGo: string | null;
  relevantCategoryIds: string[];
  relevantLiveProductIds: string[];
  futureProductTypes: string[];
  planningConsiderations: string | null;
  imageAttributionIds: string[];
  commercialCtaTarget: string | null;
  relatedAreaIds: string[];
  status: "live" | "draft";
  isIndexable: boolean;
}

export type SeoPageVariant = "category" | "comparison" | "area" | "traveler-fit" | "guide";

export interface SeoPageRecord {
  id: string;
  publicRoute: string;
  variant: SeoPageVariant;
  pageIntent: string | null;
  canonicalRoute: string | null;
  heroEyebrow: string | null;
  heroTitle: string;
  heroSubtitle: string | null;
  openingAnswer: string | null;
  topCta: string | null;
  secondaryCta: string | null;
  whoItIsFor: string | null;
  whoShouldChooseSomethingElse: string | null;
  decisionFactors: string[];
  comparisonColumns: ComparisonColumn[];
  comparisonRows: ComparisonRow[];
  recommendedChoiceGuidance: string | null;
  planningConsiderations: string | null;
  transportationNotes: string | null;
  durationNotes: string | null;
  ageNotes: string | null;
  mobilityNotes: string | null;
  weatherNotes: string | null;
  itineraryCombinations: string[];
  liveProductIds: string[];
  futureProductCategoryIds: string[];
  relatedPageIds: string[];
  relatedAreaIds: string[];
  disclosure: string | null;
  faqs: SeoFaq[];
  metadata: SeoMetadata | null;
  schemaEligibility: SchemaEligibility | null;
  visualMood: string | null;
  imageAttributionIds: string[];
  status: "live" | "draft";
  isIndexable: boolean;
}

export interface ComparisonPage extends SeoPageRecord {
  variant: "comparison";
}
export interface TravelerFitPage extends SeoPageRecord {
  variant: "traveler-fit";
}
export interface GuidePage extends SeoPageRecord {
  variant: "guide";
}

export interface DayPlan {
  id: string;
  title: string;
  slug: string;
  travelerFit: string | null;
  morningExperience: string | null;
  afternoonExperience: string | null;
  eveningExperience: string | null;
  timingNotes: string | null;
  transportationNotes: string | null;
  productIds: string[];
  categoryIds: string[];
  separateCheckoutDisclosure: string | null;
  status: "live" | "draft";
  isIndexable: boolean;
}

export interface FilterDefinition {
  id: string;
  label: string;
  type: "category" | "duration" | "daypart" | "pickup" | "self-drive" | "indoor-outdoor" | "family-friendly" | "adults-only" | "walking-level" | "private-group" | "weather-suitability" | "cruise-passenger" | "instant-confirmation";
  options: { label: string; value: string }[];
}

export interface KeywordCluster {
  id: string;
  cluster: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string | null;
  monthlyVolume: number | null;
  difficulty: number | null;
  averageCpc: number | null;
  serpFeatures: string[];
  topDomains: string[];
  otaDominance: string | null;
  operatorDominance: string | null;
  tourismAuthorityDominance: string | null;
  matchingProvider: string | null;
  matchingProduct: string | null;
  commercialValue: string | null;
  rankingAttainability: string | null;
  canonicalRoute: string | null;
  pageType: string | null;
  priority: number | null;
  source: string | null;
  lastVerified: string | null;
  targetLiveRoute: string | null;
  status: "active" | "draft";
}

export interface ComparisonColumn {
  id: string;
  header: string;
}

export interface ComparisonRow {
  label: string;
  values: string[];
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoMetadata {
  title: string;
  description: string;
  canonicalRoute: string;
  robots: string;
  openGraphTitle: string;
  openGraphUrl: string;
  twitterTitle: string;
}

export interface SearchIndexEntry {
  id: string;
  type: string;
  title: string;
  url: string;
  keywords: string[];
  categoryIds: string[];
  areaIds: string[];
  operatorName: string | null;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface ActiveFilter {
  id: string;
  field: string;
  label: string;
  value: string;
}

export interface CategoryCardProps {
  category: Category;
  productCount: number;
}

export interface ProductCardProps {
  product: LiveProductAdapter;
}

export interface ProviderBadgeProps {
  provider: Provider;
}

export interface RelatedExperience {
  product: LiveProductAdapter;
}

export interface ComparisonLink {
  href: string;
  label: string;
}

export interface TravelerFitLink {
  href: string;
  label: string;
}

export interface AreaLink {
  href: string;
  label: string;
}
