import { HELD_JEAN_LAFITTE_SLUG, isHeldProduct } from "../data/truthPolicy";

export type ProductBadgeType = 'urgency' | 'trust' | 'logistics' | 'concierge-pick';

export interface ProductBadge {
  type: ProductBadgeType;
  label: string;
}

export interface ViatorBookingVariant {
  label: string;
  offer: string;
  option?: string;
  departureTime?: string;
  placementId?: string;
  reselectionNote?: string;
}

export interface NolaFareHarborProduct {
  id: string;
  title: string;
  category: string;
  operatorName: string;
  description: string;
  bestFor?: string;
  imageUrl: string;
  imageAlt?: string;
  imagePresentation?: "standard" | "editorial";
  ctaLabel?: string;
  slug: string;
  relatedTourSlug: string;

  // Pricing — displayed on tour cards, sticky bar, and guide pages
  priceFrom?: number;
  priceUnit?: string; // "per person" | "per adult" | "per group"
  isFlatRate?: boolean;

  // Conversion badges — rendered on tour cards and category pages
  badges?: ProductBadge[];

  // Booking variants for multi-option products (FareHarbor operator metadata)
  bookingVariants?: {
    label: string;
    itemId: string;
    flowId: string;
    bookingUrl: string;
  }[];

  // Payable Viator Partner API v2 mapping (primary checkout while FareHarbor ASN is inactive)
  viatorProductCode?: string;
  viatorOptionCode?: string;
  viatorDepartureTime?: string;
  viatorPlacementId?: string;
  viatorReselectionNote?: string;
  viatorVariants?: ViatorBookingVariant[];
  fareharborAsnActive?: boolean;
  handoffLinkType?: "checkout_referral" | "affiliate_checkout";
  bookingChannelLabel?: string;

  // New optional detail fields for Step 4
  detailSummary?: string;
  bestFit?: string[];
  notIdealFor?: string[];
  childrenConsiderations?: string[];
  confirmedInclusions?: string[];
  bookingConfirmations?: string[];
  physicalFormat?: {
    walking?: string;
    riding?: string;
    seating?: string;
    exposure?: string;
  };
  logistics?: {
    meetingPoint?: string;
    pickup?: string;
    transportation?: string;
  };
  historicalContextNote?: string;

  companyShortname: string;
  itemId?: string;
  flowId?: string;

  detailPageTitle: string;
  metaDescription: string;
  durationLabel?: string;
  transportationSummary?: string;
  pickupSummary?: string;
  wikimediaId?: string;
  representativeCaption?: string;
  highlights?: string[];
  bookingNote?: string;
}

export const NEW_ORLEANS_ORIGIN = "https://www.welcometoneworleanstours.com";
export const NEW_ORLEANS_TOURS_PATH = "/new-orleans/tours";
export const FAREHARBOR_ASN = "aktourcenter";
export const WNO_FAREHARBOR_HANDOFF_LINK_TYPE = "checkout_referral" as const;
export const WNO_FAREHARBOR_BOOKING_CHANNEL_LABEL = "FareHarbor checkout referral" as const;

export function getProductHandoffLinkType(
  product: Pick<NolaFareHarborProduct, "slug" | "fareharborAsnActive" | "viatorProductCode" | "handoffLinkType">
): "checkout_referral" | "affiliate_checkout" {
  const canonical = STOREFRONT_PRODUCTS.find((p) => p.slug === product.slug) || product;
  if (canonical.handoffLinkType) return canonical.handoffLinkType;
  if (canonical.fareharborAsnActive !== true && canonical.viatorProductCode) {
    return "affiliate_checkout";
  }
  return WNO_FAREHARBOR_HANDOFF_LINK_TYPE;
}

export function getProductBookingChannelLabel(
  product: Pick<
    NolaFareHarborProduct,
    "slug" | "fareharborAsnActive" | "viatorProductCode" | "bookingChannelLabel"
  >
): string {
  const canonical = STOREFRONT_PRODUCTS.find((p) => p.slug === product.slug) || product;
  if (canonical.bookingChannelLabel) return canonical.bookingChannelLabel;
  if (canonical.fareharborAsnActive !== true && canonical.viatorProductCode) {
    return "Viator affiliate checkout";
  }
  return WNO_FAREHARBOR_BOOKING_CHANNEL_LABEL;
}

export const getFareHarborUrl = (
  companyShortname: string,
  itemId?: string | number,
  flowId?: string | number,
  refCode?: string,
) => {
  let url = `https://fareharbor.com/embeds/book/${companyShortname}/`;
  if (itemId) {
    url += `items/${itemId}/`;
  }
  const params = new URLSearchParams();
  params.append("asn", FAREHARBOR_ASN);
  if (flowId) {
    params.append("flow", String(flowId));
  }
  const resolvedRef =
    refCode ||
    (companyShortname === "ragincajuntours"
      ? String(itemId) === "590176"
        ? "wno-ragin-cajun-covered-boat"
        : String(itemId) === "228561" || String(itemId) === "228524" || String(itemId) === "448291"
          ? "wno-ragin-cajun-airboat-options"
          : String(itemId) === "603090"
            ? "wno-ragin-cajun-covered-plantation-combo"
            : undefined
      : undefined);
  if (resolvedRef) {
    params.append("ref", resolvedRef);
  }
  params.append("full-items", "yes");
  return `${url}?${params.toString()}`;
};

export function getDefaultWnoPlacementId(category?: string, slug?: string): string {
  if (
    slug === "louisiana-tour-company-swamp-tour-hotel-pickup" ||
    slug === "jeanlafitte-swamp-tour-with-hotel-pickup" ||
    category === "Swamp Tours" ||
    category === "Airboat Rides"
  ) {
    return "fp-wno-swamp-tours";
  }
  if (category === "Plantation Tours") return "fp-wno-plantation-tours";
  if (category === "River Cruises") return "fp-wno-riverboat-cruises";
  if (category === "Walking Tours") return "fp-wno-walking-tours";
  if (category === "Combo Tours") return "fp-wno-combo-tours";
  if (category === "City Tours") return "fp-wno-city-tours";
  return "fp-wno-swamp-tours";
}

export function buildPayableViatorClickHref(params: {
  offer: string;
  option?: string;
  placementId?: string;
  property?: string;
  date?: string;
  adults?: number | string;
  departureTime?: string;
  src?: string;
  isTest?: boolean;
}): string {
  const query = new URLSearchParams();
  const cleanOffer = params.offer.replace(/^dcc:tour:viator:/i, "");
  query.set("offer", cleanOffer);
  if (params.option) {
    query.set("option", params.option);
  }
  query.set("placementId", params.placementId || "fp-wno-swamp-tours");
  query.set("property", params.property || "hotel-monteleone-nola");
  if (params.date) {
    query.set("date", params.date);
  }
  query.set("adults", String(params.adults ?? 2));
  if (params.departureTime) {
    query.set("departureTime", params.departureTime);
  }
  if (params.src) {
    query.set("src", params.src);
  }
  if (params.isTest) {
    query.set("isTest", "true");
  }
  return `/api/v1/ads/click?${query.toString()}`;
}

export function getProductPrimaryBookingHref(
  product: Pick<
    NolaFareHarborProduct,
    | "slug"
    | "category"
    | "companyShortname"
    | "itemId"
    | "flowId"
    | "bookingVariants"
    | "viatorProductCode"
    | "viatorOptionCode"
    | "viatorDepartureTime"
    | "viatorPlacementId"
    | "fareharborAsnActive"
  >,
  overrides?: {
    date?: string;
    adults?: number | string;
    placementId?: string;
    src?: string;
    isTest?: boolean;
  },
): string {
  const canonical = STOREFRONT_PRODUCTS.find((p) => p.slug === product.slug) || product;
  if (canonical.slug === HELD_JEAN_LAFITTE_SLUG) {
    return "";
  }
  if (canonical.fareharborAsnActive !== true && canonical.viatorProductCode) {
    return buildPayableViatorClickHref({
      offer: canonical.viatorProductCode,
      option: canonical.viatorOptionCode,
      placementId:
        overrides?.placementId ||
        canonical.viatorPlacementId ||
        getDefaultWnoPlacementId(canonical.category, canonical.slug),
      property: "hotel-monteleone-nola",
      date: overrides?.date,
      adults: overrides?.adults ?? 2,
      departureTime: canonical.viatorDepartureTime,
      src: overrides?.src,
      isTest: overrides?.isTest,
    });
  }
  if (canonical.fareharborAsnActive === false) {
    return "";
  }
  return (
    canonical.bookingVariants?.[0]?.bookingUrl ||
    getFareHarborUrl(canonical.companyShortname, canonical.itemId, canonical.flowId)
  );
}

export interface ViatorCanonicalProductInfo {
  productCode: string;
  optionCode?: string;
  departureTime?: string;
  title: string;
  operatorName: string;
  destinationUrl: string;
  providerAccount: "P00306962";
}

const VIATOR_CANONICAL_PRODUCT_MAP: Record<
  string,
  Omit<ViatorCanonicalProductInfo, "providerAccount">
> = {
  "15200P1": {
    productCode: "15200P1",
    optionCode: "TG9",
    departureTime: "09:40",
    title: "New Orleans Large Airboat Swamp Tour",
    operatorName: "Louisiana Tour Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Large-Airboat-Swamp-Tour/d675-15200P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "15200P2": {
    productCode: "15200P2",
    title: "Large Airboat Swamp Tour with Transportation from New Orleans",
    operatorName: "Louisiana Tour Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Large-Airboat-Swamp-Tour-with-Hotel-Pickup/d675-15200P2?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "15200P3": {
    productCode: "15200P3",
    title: "New Orleans Small-Group Airboat Swamp Tour",
    operatorName: "Louisiana Tour Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Small-Group-Airboat-Swamp-Tour/d675-15200P3?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "15200P4": {
    productCode: "15200P4",
    title: "Small-Group Airboat Swamp Tour with Downtown New Orleans Pickup",
    operatorName: "Louisiana Tour Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Small-Group-Swamp-Tour-by-Airboat-With-Downtown-New-Orleans-Pickup/d675-15200P4?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "15200P5": {
    productCode: "15200P5",
    title: "New Orleans Swamp Tour Boat Adventure",
    operatorName: "Louisiana Tour Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Boat-Adventure/d675-15200P5?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "15200P6": {
    productCode: "15200P6",
    optionCode: "TG10",
    departureTime: "08:00",
    title: "New Orleans Swamp Tour Boat Adventure with Transportation",
    operatorName: "Louisiana Tour Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Boat-Adventure-With-Pickup/d675-15200P6?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "15200P7": {
    productCode: "15200P7",
    title: "New Orleans City Tour: French Quarter, Garden District & Cemetery",
    operatorName: "Louisiana Tour Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-City-Tour-Katrina-Garden-District-French-Quarter-Graveyard/d675-15200P7?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "15200P9": {
    productCode: "15200P9",
    title: "Oak Alley Plantation and Swamp Boat Tour from New Orleans",
    operatorName: "Louisiana Tour Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Combo-Oak-Alley-Plantation-and-Swamp-Boat-Tour/d675-15200P9?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "8013P1": {
    productCode: "8013P1",
    title: "City Tour of New Orleans with Pickup",
    operatorName: "Southern Style Tours",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Three-Hour-City-Tour-of-New-Orleans/d675-8013P1?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "8013P3": {
    productCode: "8013P3",
    title: "Oak Alley Plantation and New Orleans City Tour",
    operatorName: "Southern Style Tours",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Combo-Oak-Alley-Plantation-and-New-Orleans-City-Tour/d675-8013P3?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "8013P8": {
    productCode: "8013P8",
    title: "Oak Alley or Laura Plantation with Transportation From downtown",
    operatorName: "Southern Style Tours",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Oak-Alley-or-Laura-Plantation-Tour-from-New-Orleans/d675-8013P8?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780STEAMDIN": {
    productCode: "3780STEAMDIN",
    optionCode: "TG9",
    title: "New Orleans Steamboat Natchez Jazz Cruise with Dinner Option",
    operatorName: "New Orleans Steamboat Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Steamboat-Natchez-Jazz-Dinner-Cruise/d675-3780STEAMDIN?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780STEAM": {
    productCode: "3780STEAM",
    optionCode: "TG31",
    title: "New Orleans Steamboat Natchez Jazz Cruise",
    operatorName: "New Orleans Steamboat Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Steamboat-Natchez-Harbor-Cruise/d675-3780STEAM?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780STEAMBRU": {
    productCode: "3780STEAMBRU",
    title: "Jazz Brunch Cruise in New Orleans",
    operatorName: "New Orleans Steamboat Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Steamboat-Natchez-Jazz-Brunch-Cruise-in-New-Orleans/d675-3780STEAMBRU?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780OAK": {
    productCode: "3780OAK",
    title: "Oak Alley Plantation Tour with Transportation from New Orleans",
    operatorName: "Gray Line",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Tour-of-Oak-Alley-Plantation/d675-3780OAK?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780P41": {
    productCode: "3780P41",
    title: "Whitney Plantation Tour with Transportation from New Orleans",
    operatorName: "Gray Line",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Whitney-Plantation-Tour/d675-3780P41?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780SWAMP": {
    productCode: "3780SWAMP",
    optionCode: "10:45AM",
    title: "New Orleans Swamp and Bayou Alligator Tour",
    operatorName: "Gray Line",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Swamp-and-Bayou-Sightseeing-Tour-with-Boat-Ride-from-New-Orleans/d675-3780SWAMP?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780AIRBOAT": {
    productCode: "3780AIRBOAT",
    title: "Airboat Ride with Optional Transportation from New Orleans",
    operatorName: "Gray Line",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Airboat-Ride-with-Round-Trip-Transport-from-New-Orleans/d675-3780AIRBOAT?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780SWPL": {
    productCode: "3780SWPL",
    title: "Swamp Boat Ride and Oak Alley Plantation Tour from New Orleans",
    operatorName: "Gray Line",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Swamp-Boat-Ride-and-Southern-Plantation-Tour-from-New-Orleans/d675-3780SWPL?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780P91": {
    productCode: "3780P91",
    title: "Swamp Boat Ride and Whitney Plantation Tour from New Orleans",
    operatorName: "Gray Line",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Swamp-Boat-Ride-and-Whitney-Plantation-Tour-from-New-Orleans/d675-3780P91?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780ST": {
    productCode: "3780ST",
    title: "New Orleans Original Craft Cocktail Walking Tour",
    operatorName: "Gray Line",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Original-Cocktail-Walking-Tour/d675-3780ST?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780GHOSTS": {
    productCode: "3780GHOSTS",
    title: "French Quarter Ghosts and Spirits Tour with Augmented Reality",
    operatorName: "Gray Line",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Ghosts-and-Spirits-Walking-Tour/d675-3780GHOSTS?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780HAUNT": {
    productCode: "3780HAUNT",
    title: "New Orleans City and Cemetery Tour with Garden District Stroll",
    operatorName: "Gray Line",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Cemetery-and-Voodoo-Walking-Tour/d675-3780HAUNT?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "3780P45": {
    productCode: "3780P45",
    title: "New Orleans 75-Minute Riverboat Sightseeing Cruise",
    operatorName: "New Orleans Steamboat Company",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Mardi-Gras-Jazz-Brunch-Cruise/d675-3780P45?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "6953SWAMP": {
    productCode: "6953SWAMP",
    title: "New Orleans Self-Transport Swamp and Bayou Boat Tour",
    operatorName: "Cajun Encounters",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour/d675-6953SWAMP?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
  "6953SWAMPTRANS": {
    productCode: "6953SWAMPTRANS",
    title: "New Orleans Swamp and Bayou Boat Tour with Transportation",
    operatorName: "Cajun Encounters",
    destinationUrl:
      "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour-With-Transport/d675-6953SWAMPTRANS?mcid=42383&pid=P00306962&medium=api&api_version=2.0",
  },
};

export function getProductViatorCanonicalInfo(
  product: Pick<
    NolaFareHarborProduct,
    | "slug"
    | "title"
    | "operatorName"
    | "viatorProductCode"
    | "viatorOptionCode"
    | "viatorDepartureTime"
  >,
): ViatorCanonicalProductInfo {
  const canonical = STOREFRONT_PRODUCTS.find((p) => p.slug === product.slug) || product;
  if (canonical.slug === HELD_JEAN_LAFITTE_SLUG || !canonical.viatorProductCode) {
    return {
      productCode: "",
      title: canonical.title,
      operatorName: canonical.operatorName,
      destinationUrl: "",
      providerAccount: "P00306962",
    };
  }
  const code = canonical.viatorProductCode.trim().toUpperCase();
  const mapped = VIATOR_CANONICAL_PRODUCT_MAP[code];
  if (mapped) {
    return {
      ...mapped,
      optionCode: canonical.viatorOptionCode || mapped.optionCode,
      departureTime: canonical.viatorDepartureTime || mapped.departureTime,
      providerAccount: "P00306962",
    };
  }
  return {
    productCode: code,
    optionCode: canonical.viatorOptionCode,
    departureTime: canonical.viatorDepartureTime,
    title: canonical.title,
    operatorName: canonical.operatorName,
    destinationUrl: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(code)}&pid=P00306962&mcid=42383&medium=api&api_version=2.0`,
    providerAccount: "P00306962",
  };
}

export function getProductViatorReselectionNote(
  product: Pick<
    NolaFareHarborProduct,
    | "slug"
    | "title"
    | "viatorProductCode"
    | "viatorOptionCode"
    | "viatorReselectionNote"
    | "fareharborAsnActive"
  >,
  overrides?: {
    date?: string;
    adults?: number | string;
  },
): string | undefined {
  const canonical = STOREFRONT_PRODUCTS.find((p) => p.slug === product.slug) || product;
  if (canonical.fareharborAsnActive === true || !canonical.viatorProductCode) {
    return undefined;
  }
  const adultsCount = Number(overrides?.adults || 2);
  const guestLabel = `${adultsCount} ${adultsCount === 1 ? "guest" : "guests"}`;
  if (canonical.slug === "louisiana-tour-company-swamp-tour-hotel-pickup" && overrides?.date) {
    return `Viator opens to its default product screen — reselect your date (${overrides.date}), group size (${guestLabel}), and tour option (9:40 AM Tour w/ 8:00–8:30 AM Hotel Pickup · Option TG10) on Viator.`;
  }
  if (overrides?.date) {
    return `Viator opens to its default product screen — reselect your date (${overrides.date}), group size (${guestLabel})${canonical.viatorOptionCode ? `, and tour option (${canonical.viatorOptionCode})` : ", and tour option"} on Viator.`;
  }
  return (
    canonical.viatorReselectionNote ||
    `Viator opens to its default product screen — reselect your preferred date, group size${canonical.viatorOptionCode ? `, and tour option (${canonical.viatorOptionCode})` : ", and tour option"} on Viator.`
  );
}

export function getProductActiveBookingVariants(
  product: NolaFareHarborProduct,
  overrides?: {
    date?: string;
    adults?: number | string;
    placementId?: string;
    src?: string;
    isTest?: boolean;
  },
): {
  label: string;
  itemId: string;
  flowId: string;
  bookingUrl: string;
  isViator: boolean;
  handoffLinkType: "checkout_referral" | "affiliate_checkout";
  bookingChannelLabel: string;
  reselectionNote?: string;
}[] {
  const canonical = STOREFRONT_PRODUCTS.find((p) => p.slug === product.slug) || product;
  if (canonical.slug === HELD_JEAN_LAFITTE_SLUG) {
    return [];
  }
  if (canonical.fareharborAsnActive !== true && canonical.viatorProductCode) {
    if (canonical.viatorVariants && canonical.viatorVariants.length > 0) {
      return canonical.viatorVariants.map((v) => ({
        label: v.label,
        itemId: v.offer,
        flowId: v.option || "DEFAULT",
        bookingUrl: buildPayableViatorClickHref({
          offer: v.offer,
          option: v.option,
          placementId:
            overrides?.placementId ||
            v.placementId ||
            canonical.viatorPlacementId ||
            getDefaultWnoPlacementId(canonical.category, canonical.slug),
          property: "hotel-monteleone-nola",
          date: overrides?.date,
          adults: overrides?.adults ?? 2,
          departureTime: v.departureTime || canonical.viatorDepartureTime,
          src: overrides?.src,
          isTest: overrides?.isTest,
        }),
        isViator: true,
        handoffLinkType: "affiliate_checkout",
        bookingChannelLabel: "Viator affiliate checkout",
        reselectionNote: v.reselectionNote || getProductViatorReselectionNote(canonical, overrides),
      }));
    }
    return [
      {
        label: canonical.ctaLabel || "CHECK AVAILABILITY & RATES",
        itemId: canonical.viatorProductCode,
        flowId: canonical.viatorOptionCode || "DEFAULT",
        bookingUrl: getProductPrimaryBookingHref(canonical, overrides),
        isViator: true,
        handoffLinkType: "affiliate_checkout",
        bookingChannelLabel: "Viator affiliate checkout",
        reselectionNote: getProductViatorReselectionNote(canonical, overrides),
      },
    ];
  }
  if (canonical.bookingVariants && canonical.bookingVariants.length > 0) {
    return canonical.bookingVariants.map((v) => ({
      ...v,
      isViator: false,
      handoffLinkType: WNO_FAREHARBOR_HANDOFF_LINK_TYPE,
      bookingChannelLabel: WNO_FAREHARBOR_BOOKING_CHANNEL_LABEL,
    }));
  }
  return [
    {
      label: canonical.ctaLabel || "CHECK AVAILABILITY & RATES",
      itemId: canonical.itemId || canonical.id,
      flowId: canonical.flowId || "DEFAULT",
      bookingUrl: getFareHarborUrl(canonical.companyShortname, canonical.itemId, canonical.flowId),
      isViator: false,
      handoffLinkType: WNO_FAREHARBOR_HANDOFF_LINK_TYPE,
      bookingChannelLabel: WNO_FAREHARBOR_BOOKING_CHANNEL_LABEL,
    },
  ];
}

export const STOREFRONT_PRODUCTS: NolaFareHarborProduct[] = [
  {
    id: "southernstyle-city-tour",
    companyShortname: "southernstyletours",
    itemId: "51942",
    flowId: "4344",
    viatorProductCode: "8013P1",
    viatorPlacementId: "fp-wno-city-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "City Tour Of New Orleans",
    category: "City Tours",
    operatorName: "Southern Style Tours",
    description: "A comprehensive overview of New Orleans covering the French Quarter, Garden District, and more.",
    bestFor: "Best for first-time visitors",
    priceFrom: 50,
    priceUnit: "person",
    badges: [
      { type: "concierge-pick", label: "🏆 Concierge Pick" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    imageAlt: "French Quarter street in New Orleans",
    slug: "city-tour-of-new-orleans",
    relatedTourSlug: "oak-alley-or-laura-plantation-tour",
    detailPageTitle: "City Tour Of New Orleans | Welcome to New Orleans Tours",
    metaDescription: "A comprehensive overview of New Orleans covering the French Quarter, Garden District, and more. Best for first-time visitors.",
    durationLabel: "Duration varies by traffic and route. Check estimates during booking.",
    transportationSummary: "Minibus transportation",
    pickupSummary: "Pickup availability and zones are confirmed during booking.",
    highlights: [
      "French Quarter",
      "Tremé",
      "Esplanade Avenue",
      "Garden District",
      "Metairie Cemetery",
      "Warehouse District"
    ],
    detailSummary: "A broad city overview offered through Southern Style Tours.",
    bestFit: [
      "First-time visitors seeking a broad introduction",
      "Groups with roughly three hours available"
    ],
    notIdealFor: [
      "Those looking for deep dives into single historical sites",
      "Visitors wanting a highly active or outdoor-only experience"
    ],
    childrenConsiderations: [
      "Often a better match for groups prioritizing a calmer format."
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Current itinerary and route",
      "Exact schedule and departure time",
      "Transportation format",
      "Pickup availability and zones"
    ],
    physicalFormat: {
      riding: "A riding-focused city overview offered through the participating operator."
    },
    logistics: {
      transportation: "Transportation format and availability are confirmed during booking."
    },
  },
  {
    id: "southernstyle-plantation",
    companyShortname: "southernstyletours",
    itemId: "83002",
    flowId: "4344",
    viatorProductCode: "8013P8",
    viatorPlacementId: "fp-wno-plantation-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Oak Alley Or Laura Plantation Tour",
    category: "Plantation Tours",
    operatorName: "Southern Style Tours",
    description: "Journey outside the city to explore historic Louisiana plantations and learn their complex history.",
    bestFor: "Best for a longer day trip",
    priceFrom: 67,
    priceUnit: "person",
    badges: [
      { type: "logistics", label: "🚐 Transportation Included" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    imagePresentation: "editorial",
    slug: "oak-alley-or-laura-plantation-tour",
    relatedTourSlug: "city-tour-of-new-orleans",
    detailPageTitle: "Oak Alley Or Laura Plantation Tour | Welcome to New Orleans Tours",
    metaDescription: "Journey outside the city to explore historic Louisiana plantations and learn their complex history. Best for a longer day trip.",
    durationLabel: "Tour duration varies. Exact schedule confirmed during booking.",
    transportationSummary: "Minibus transportation",
    bookingNote: "Pickup and return timing may make the complete outing longer. The available plantation option, current itinerary and exact schedule are confirmed during booking.",
    highlights: [
      "History and architecture connected to either Oak Alley or Laura Plantation",
      "Historic grounds and gardens",
      "The lives of people connected to the plantation sites",
      "The history of slavery represented at these locations"
    ],
    wikimediaId: "oak-alley-front",
    representativeCaption: "Representative image: Oak Alley Plantation. Tour selection may include Oak Alley or Laura Plantation.",
    detailSummary: "A historic-site excursion to Oak Alley or Laura Plantation, with the selected site and current logistics confirmed during booking.",
    bestFit: [
      "Visitors interested in a historic-site excursion",
      "Visitors preparing for a longer outing outside the city"
    ],
    notIdealFor: [
      "Visitors with less than half a day available",
      "Those looking for a fast-paced or strictly outdoor nature experience"
    ],
    childrenConsiderations: [
      "Often a better match for older children or teens with historical interest. Verify child eligibility and age requirements in checkout."
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Available plantation options (Oak Alley or Laura)",
      "Exact schedule and departure time",
      "Transportation format",
      "Walking and standing requirements"
    ],
    physicalFormat: {
      walking: "Confirm the current format and participation requirements during booking.",
      riding: "Extended travel time to and from the sites"
    },
    logistics: {
      transportation: "Transportation and return timing are confirmed during booking."
    },
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The depth and focus of historical interpretation vary by site. We encourage visitors to review the selected plantation’s specific historical program and educational approach."
  },
  {
    id: "ragincajun-covered-boat",
    companyShortname: "ragincajuntours",
    itemId: "590176",
    flowId: "392449",
    viatorProductCode: "15200P5",
    viatorPlacementId: "fp-wno-swamp-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    viatorVariants: [
      {
        label: "CHECK SELF-DRIVE COVERED BOAT ($35/PERSON · VIATOR #15200P5)",
        offer: "15200P5",
        placementId: "fp-wno-swamp-tours",
      },
      {
        label: "CHECK WITH HOTEL PICKUP ($60/ADULT · OPTION TG10 · VIATOR #15200P6)",
        offer: "15200P6",
        option: "TG10",
        departureTime: "08:00",
        placementId: "fp-wno-swamp-tours",
      },
    ],
    title: "Covered Tour Boat",
    category: "Swamp Tours",
    operatorName: "Ragin Cajun Tours",
    description: "A covered tour-boat experience offered through Ragin Cajun Tours.",
    bestFor: "Covered tour boat",
    priceFrom: 35,
    priceUnit: "person",
    badges: [
      { type: "concierge-pick", label: "🏆 Concierge Pick" },
      { type: "logistics", label: "🚐 Pickup Available" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    imageAlt: "Covered tour boat in a Louisiana swamp",
    slug: "covered-tour-boat",
    relatedTourSlug: "ragin-cajun-airboat-options",
    detailPageTitle: "Covered Tour Boat Swamp Ride | Welcome to New Orleans Tours",
    metaDescription: "A covered tour-boat experience offered through Ragin Cajun Tours.",
    durationLabel: "Duration confirmed during booking.",
    transportationSummary: "Covered boat format",
    pickupSummary: "Transportation options are confirmed during booking.",
    highlights: [
      "A covered-boat format"
    ],
    detailSummary: "A covered tour-boat experience.",
    bestFit: [
      "Visitors seeking a relaxed, comfortable ride",
      "Groups wanting shade and a lower-intensity travel experience"
    ],
    notIdealFor: [
      "Those looking for high speeds or thrills"
    ],
    childrenConsiderations: [
      "Often a better match for groups prioritizing a calmer format. Verify child eligibility and age requirements in checkout."
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Exact departure time",
      "Meeting or transportation location",
      "Weather conditions and cancellation policy",
      "Accessibility and age policies"
    ],
    physicalFormat: {
      exposure: "Covered-boat format; exact vessel configuration is confirmed by the operator."
    },
    logistics: {
      transportation: "Transportation options are confirmed during booking."
    },
  },
  {
    id: "ragincajun-airboat",
    companyShortname: "ragincajuntours",
    itemId: "228561",
    flowId: "940162",
    viatorProductCode: "15200P1",
    viatorPlacementId: "fp-wno-swamp-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    bookingVariants: [
      {
        label: "Check dates and prices on FareHarbor — Large Airboat (Item 228561 · $65 self-drive / $90 with hotel pickup pre-tax estimate)",
        itemId: "228561",
        flowId: "940162",
        bookingUrl: "https://fareharbor.com/embeds/book/ragincajuntours/items/228561/?asn=aktourcenter&flow=940162&ref=wno-ragin-cajun-airboat-options&full-items=yes",
      },
      {
        label: "Check dates and prices on FareHarbor — Standard 10-Passenger Airboat (Item 228524 · $85 self-drive / $110 with hotel pickup pre-tax estimate)",
        itemId: "228524",
        flowId: "940162",
        bookingUrl: "https://fareharbor.com/embeds/book/ragincajuntours/items/228524/?asn=aktourcenter&flow=940162&ref=wno-ragin-cajun-airboat-options&full-items=yes",
      },
      {
        label: "Check dates and prices on FareHarbor — Premium Small 6-Passenger Airboat (Item 448291 · $95 self-drive / $120 with hotel pickup pre-tax estimate)",
        itemId: "448291",
        flowId: "940162",
        bookingUrl: "https://fareharbor.com/embeds/book/ragincajuntours/items/448291/?asn=aktourcenter&flow=940162&ref=wno-ragin-cajun-airboat-options&full-items=yes",
      },
    ],
    viatorVariants: [
      {
        label: "LARGE AIRBOAT · SELF-DRIVE ($65/PERSON · VIATOR #15200P1)",
        offer: "15200P1",
        placementId: "fp-wno-swamp-tours",
      },
      {
        label: "LARGE AIRBOAT · WITH HOTEL PICKUP ($90/PERSON · VIATOR #15200P2)",
        offer: "15200P2",
        placementId: "fp-wno-swamp-tours",
      },
      {
        label: "SMALL AIRBOAT · SELF-DRIVE ($89/PERSON · VIATOR #15200P3)",
        offer: "15200P3",
        placementId: "fp-wno-swamp-tours",
      },
      {
        label: "SMALL AIRBOAT · WITH HOTEL PICKUP ($115/PERSON · VIATOR #15200P4)",
        offer: "15200P4",
        placementId: "fp-wno-swamp-tours",
      },
    ],
    title: "Ragin Cajun Airboat Options",
    category: "Airboat Rides",
    operatorName: "Ragin Cajun Tours",
    description: "The faster, more adventurous, open-air swamp format.",
    bestFor: "Airboat options",
    priceFrom: 65,
    priceUnit: "person (pre-tax estimate)",
    badges: [
      { type: "urgency", label: "⚡ Likely to Sell Out" },
      { type: "logistics", label: "🚐 Pickup Available" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    imageAlt: "Airboat traveling through a Louisiana swamp",
    ctaLabel: "Check dates and prices on FareHarbor",
    slug: "ragin-cajun-airboat-options",
    relatedTourSlug: "covered-tour-boat",
    detailPageTitle: "Ragin Cajun Airboat Options | Welcome to New Orleans Tours",
    metaDescription: "Airboat tour options in the Louisiana swamp with Ragin Cajun Tours. Self-drive and French Quarter hotel pickup options available.",
    durationLabel: "Duration confirmed during booking.",
    transportationSummary: "Boat formats confirmed during booking.",
    pickupSummary: "Self-drive or round-trip hotel shuttle available. The operator lists two Luling, LA locations and provides the launch address with the booking; confirm the exact meeting point for item 228561 before displaying directions.",
    bookingNote: "Displayed rates are pre-tax estimates. When live inventory is unavailable, check dates and prices on FareHarbor. The operator lists two Luling locations and provides the launch address with the booking.",
    highlights: [
      "The operator describes the route as traveling through privately accessed swamp property"
    ],
    detailSummary: "Airboat options through private Louisiana bayous. Pre-tax estimate self-drive tour-only rates are $65 (large 16-passenger, item 228561), $85 (medium 10-passenger, item 228524), and $95 (small 6–10 passenger, item 448291) per rider before local taxes and fees. Pre-tax estimate round-trip French Quarter hotel shuttle packages are $90, $110, and $120 per rider respectively. The operator lists two Luling locations and provides the launch address with the booking — confirm the exact meeting point for item 228561 before displaying directions. Standard bookings require at least 48 hours notice for a full refund; inside 48 hours is non-refundable.",
    bestFit: [
      "Visitors looking for a fast, adventurous ride",
      "Those who prefer an open-air outdoor experience"
    ],
    notIdealFor: [
      "Groups wanting a quiet, relaxed, or shaded environment",
      "Visitors sensitive to loud noises"
    ],
    childrenConsiderations: [
      "Verify age minimums (ages 5+) and child eligibility directly in the operator checkout before booking."
    ],
    confirmedInclusions: [],
    bookingConfirmations: [
      "Confirm the exact meeting point for item 228561 before displaying directions (the operator lists two Luling locations and provides the launch address with the booking).",
      "Pre-tax estimates exclude applicable local taxes and booking fees; check dates and prices on FareHarbor.",
      "Weather conditions and 48-hour cancellation policy"
    ],
    physicalFormat: {
      riding: "Airboat ride",
      exposure: "Open-air exposure"
    },
    logistics: {
      meetingPoint: "Confirm the exact meeting point for item 228561 before displaying directions. The operator lists two Luling locations and provides the launch address with the booking.",
      transportation: "Transportation options confirmed during booking."
    },
  },
  {
    id: "southernstyle-city-plantation-combo",
    companyShortname: "southernstyletours",
    itemId: "51953",
    flowId: "4344",
    viatorProductCode: "8013P3",
    viatorPlacementId: "fp-wno-combo-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "All-Day City + Plantation",
    category: "Combo Tours",
    operatorName: "Southern Style Tours",
    description: "An 8-hour combination of a New Orleans city tour and either Oak Alley or Laura Plantation.",
    bestFor: "City and plantation in one day",
    priceFrom: 99,
    priceUnit: "person",
    badges: [
      { type: "logistics", label: "🚐 Pickup Included" },
      { type: "trust", label: "⏱️ Full Day" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    imageAlt: "French Quarter street in New Orleans",
    slug: "all-day-city-plantation-combo",
    relatedTourSlug: "oak-alley-or-laura-plantation-tour",
    detailPageTitle: "All-Day City + Plantation Combo | Welcome to New Orleans Tours",
    metaDescription: "Combine a New Orleans city tour with Oak Alley or Laura Plantation in an 8-hour experience operated by Southern Style Tours.",
    durationLabel: "8 hours",
    transportationSummary: "Morning pickup is included",
    pickupSummary: "The operator describes a morning pickup window of 8:00–8:30 a.m.",
    highlights: [
      "New Orleans city tour",
      "Oak Alley or Laura Plantation",
      "An 8-hour combined experience"
    ],
    detailSummary: "An 8-hour combination of a New Orleans city tour and either Oak Alley or Laura Plantation, with a morning pickup window described by the operator as 8:00–8:30 a.m.",
    bestFit: [
      "Visitors who want a city tour and plantation experience in one day",
      "Groups prepared for an 8-hour outing"
    ],
    notIdealFor: [
      "Visitors with less than a full day available",
      "Children younger than 4"
    ],
    childrenConsiderations: [
      "The operator lists this experience for ages 4 and older."
    ],
    confirmedInclusions: [
      "New Orleans city tour",
      "Oak Alley or Laura Plantation"
    ],
    bookingConfirmations: [
      "Available plantation option",
      "Live departure availability",
      "Current pickup details",
      "Current pricing"
    ],
    physicalFormat: {
      riding: "A combined city and plantation outing."
    },
    logistics: {
      pickup: "The operator describes a morning pickup window of 8:00–8:30 a.m.",
      transportation: "Transportation is part of the combined itinerary."
    },
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The depth and focus of historical interpretation vary by site. We encourage visitors to review the selected plantation’s specific historical program and educational approach."
  },
  {
    id: "ragincajun-covered-plantation-combo",
    companyShortname: "ragincajuntours",
    itemId: "603090",
    flowId: "392449",
    viatorProductCode: "15200P9",
    viatorPlacementId: "fp-wno-combo-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Covered Boat + Plantation",
    category: "Combo Tours",
    operatorName: "Ragin Cajun Airboat Tours",
    description: "A covered boat and plantation combination lasting approximately 7 hours.",
    bestFor: "Covered boat and plantation in one outing",
    priceFrom: 130,
    priceUnit: "person",
    badges: [
      { type: "logistics", label: "🚐 Transport Included" },
      { type: "trust", label: "⏱️ Full Day" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    imageAlt: "Covered tour boat in a Louisiana swamp",
    slug: "covered-boat-plantation-combo",
    relatedTourSlug: "covered-tour-boat",
    detailPageTitle: "Covered Boat + Plantation Combo | Welcome to New Orleans Tours",
    metaDescription: "Combine a covered boat tour with Oak Alley or Laura Plantation in an approximately 7-hour experience with transportation.",
    durationLabel: "Approximately 7 hours",
    transportationSummary: "Transportation and pickup included",
    pickupSummary: "Pickup is included as described by the operator.",
    highlights: [
      "Covered boat tour",
      "Oak Alley or Laura Plantation",
      "Transportation and pickup"
    ],
    detailSummary: "An approximately 7-hour combination of a covered boat tour and either Oak Alley or Laura Plantation, with transportation and pickup included as described by the operator.",
    bestFit: [
      "Visitors who want a covered boat tour and plantation experience in one outing",
      "Groups prepared for an approximately 7-hour experience"
    ],
    notIdealFor: [
      "Visitors with less than a full day available",
      "Children younger than 5"
    ],
    childrenConsiderations: [
      "The operator lists adult and child pricing types and an age minimum of 5."
    ],
    confirmedInclusions: [
      "Covered boat tour",
      "Oak Alley or Laura Plantation",
      "Transportation and pickup as described by the operator"
    ],
    bookingConfirmations: [
      "Available plantation option",
      "Live departure availability",
      "Current pickup details",
      "Adult and child pricing",
      "Current pricing"
    ],
    physicalFormat: {
      riding: "A covered boat and plantation combination."
    },
    logistics: {
      pickup: "Pickup is included as described by the operator.",
      transportation: "Transportation is included as described by the operator."
    },
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The depth and focus of historical interpretation vary by site. We encourage visitors to review the selected plantation’s specific historical program and educational approach."
  },
  {
    id: "louisiana-tour-company-swamp-tour-hotel-pickup",
    companyShortname: "ragincajuntours",
    itemId: "590176",
    flowId: "392449",
    viatorProductCode: "15200P6",
    viatorOptionCode: "TG10",
    viatorDepartureTime: "08:00",
    viatorPlacementId: "fp-wno-swamp-tours",
    fareharborAsnActive: false,
    viatorVariants: [
      {
        label: "CHOOSE DATE & PARTY SIZE ($60/ADULT · 9:40 AM TOUR / 8:00 AM PICKUP · TG10)",
        offer: "15200P6",
        option: "TG10",
        departureTime: "08:00",
        placementId: "fp-wno-swamp-tours",
      },
      {
        label: "12:10 PM TOUR (10:20 AM HOTEL PICKUP · OPTION TG9)",
        offer: "15200P6",
        option: "TG9",
        departureTime: "10:20",
        placementId: "fp-wno-swamp-tours",
      },
      {
        label: "2:10 PM TOUR (12:30 PM HOTEL PICKUP · OPTION TG8)",
        offer: "15200P6",
        option: "TG8",
        departureTime: "12:30",
        placementId: "fp-wno-swamp-tours",
      },
    ],
    title: "New Orleans Swamp Tour Boat Adventure with Hotel Pickup",
    category: "Swamp Tours",
    operatorName: "Louisiana Tour Company",
    description: "Covered bayou swamp boat excursion through the Barataria Bayou with confirmed round-trip French Quarter & Downtown hotel shuttle pickup (including Hotel Monteleone, 214 Royal St — pickup ref LOC-6eKJ+or5y8o99Qw0C8xWyGAjWJk3qp08H7OnT0MLhOs=).",
    bestFor: "French Quarter & Downtown hotel guests seeking door-to-door pickup ($120 total for 2 adults, $0 booking fee)",
    priceFrom: 60,
    priceUnit: "adult ($120.00 total for 2 adults · $0 booking fee)",
    isFlatRate: true,
    badges: [
      { type: "concierge-pick", label: "🏆 Concierge Pick · Verified Hotel Pickup" },
      { type: "logistics", label: "🚐 $120.00 Total for 2 Adults (Pickup Included)" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/hotel-pickup-swamp-boat.png",
    imageAlt: "Louisiana Tour Company covered swamp tour boat with French Quarter hotel pickup",
    slug: "louisiana-tour-company-swamp-tour-hotel-pickup",
    relatedTourSlug: "covered-tour-boat",
    detailPageTitle: "New Orleans Swamp Tour Boat Adventure with Hotel Pickup | Welcome to New Orleans Tours",
    metaDescription: "Book the New Orleans Swamp Tour Boat Adventure with round-trip French Quarter & Downtown hotel pickup ($60/adult · $120.00 total for 2 adults, including Hotel Monteleone at 214 Royal St).",
    durationLabel: "4 hours door-to-door (~1h 45m on the water)",
    transportationSummary: "Round-trip French Quarter & Downtown hotel shuttle pickup included",
    pickupSummary: "Confirmed pickup at Hotel Monteleone (214 Royal St) and 13+ French Quarter/CBD hotels. Windows: 8:00–8:30 AM (9:40 AM tour), 10:20–10:50 AM (12:10 PM tour), 12:30–1:00 PM (2:10 PM tour).",
    highlights: [
      "Confirmed door-to-door pickup at Hotel Monteleone (214 Royal St) & French Quarter/Downtown hotels",
      "Shaded, covered swamp boat through the Barataria Bayou (all ages welcome)",
      "All-in transparent pricing: $60.00/adult ($120.00 total for 2 adults, $0 booking fee)"
    ],
    detailSummary: "A 4-hour door-to-door covered bayou boat tour with confirmed round-trip French Quarter and Downtown hotel pickup operated by Louisiana Tour Company (product #15200P6). Total price for 2 adults is $120.00 ($60.00/adult, $0 booking fee).",
    bestFit: [
      "French Quarter and Downtown hotel guests (including Hotel Monteleone, 214 Royal St) wanting confirmed door-to-door pickup",
      "Families, seniors, and all-ages groups seeking a shaded, calm bayou boat cruise"
    ],
    notIdealFor: [
      "Visitors strictly seeking a high-speed open-air airboat ride"
    ],
    childrenConsiderations: [
      "All ages welcome on the covered swamp boat; Adult, Child (4–12), and Infant (0–3) tickets available."
    ],
    confirmedInclusions: [
      "Round-trip hotel shuttle pickup from Hotel Monteleone (214 Royal St) and participating French Quarter/Downtown hotels",
      "Guided covered swamp boat tour in the Barataria Bayou"
    ],
    bookingConfirmations: [
      "Departure & pickup window (e.g. TG10: 8:00–8:30 AM pickup for 9:40 AM tour; TG9: 10:20–10:50 AM pickup for 12:10 PM tour)",
      "Selected hotel pickup stop (Hotel Monteleone, 214 Royal St — LOC-6eKJ+or5y8o99Qw0C8xWyGAjWJk3qp08H7OnT0MLhOs=)",
      "Total checkout price ($120.00 for 2 adults, $0 booking fee)"
    ],
  },
  {
    id: "jeanlafitte-swamp-tour-with-hotel-pickup",
    companyShortname: "jeanlafitteswamptour",
    itemId: "763318",
    flowId: "no",
    fareharborAsnActive: false,
    title: "Jean Lafitte Swamp Tour with Hotel Pickup",
    category: "Swamp Tours",
    operatorName: "Jean Lafitte Swamp Tours",
    description: "Covered bayou swamp boat excursion through the Jean Lafitte National Historical Park & Preserve. Self-service partner checkout on this listing is temporarily held pending direct operator confirmation.",
    bestFor: "Families, all ages & French Quarter guests without a car",
    badges: [
      { type: "logistics", label: "⏳ Operator Verification Pending" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/hotel-pickup-swamp-boat.png",
    imageAlt: "Jean Lafitte covered swamp tour boat with hotel pickup from New Orleans",
    slug: "jeanlafitte-swamp-tour-with-hotel-pickup",
    relatedTourSlug: "louisiana-tour-company-swamp-tour-hotel-pickup",
    detailPageTitle: "Jean Lafitte Swamp Tour with Hotel Pickup | Checkout Pending Verification",
    metaDescription: "Direct Jean Lafitte Swamp Tours partner checkout and hotel-shuttle option mapping are temporarily held pending operator confirmation. Compare verified French Quarter hotel-pickup swamp boat options.",
    durationLabel: "Confirm current itinerary with operator",
    transportationSummary: "Hotel pickup availability & stops pending operator confirmation",
    pickupSummary: "Self-service checkout disabled until direct Jean Lafitte partner pickup mapping is confirmed. Call 504-484-9687 or compare verified hotel-pickup swamp boat options.",
    highlights: [
      "Covered swamp boat format in the Jean Lafitte bayou corridor",
      "Self-service checkout intentionally disabled until direct operator partner configuration is verified"
    ],
    detailSummary: "Covered bayou boat tour operated by Jean Lafitte Swamp Tours. Self-service checkout on this listing is temporarily held pending direct operator partner confirmation; compare verified hotel-pickup swamp boat options or call 504-484-9687.",
    bestFit: [
      "French Quarter and Downtown hotel guests comparing covered swamp boat options",
      "Families, seniors, and all-ages groups seeking a shaded, calm bayou cruise"
    ],
    notIdealFor: [
      "Visitors strictly seeking a high-speed open-air airboat ride"
    ],
    childrenConsiderations: [
      "All ages welcome on covered swamp boats; confirm current operator terms before booking."
    ],
    confirmedInclusions: [
      "Confirm current departure schedule, hotel shuttle stops, and inclusions directly before booking"
    ],
    bookingConfirmations: [
      "Current departure slot and hotel pickup stop",
      "Operator pricing, fees, and cancellation terms"
    ],
  },
  {
    id: "evening-jazz-cruise",
    companyShortname: "neworleanssteamboatcompany",
    viatorProductCode: "3780STEAMDIN",
    viatorOptionCode: "TG9",
    viatorPlacementId: "fp-wno-riverboat-cruises",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    viatorVariants: [
      {
        label: "CHECK SIGHTSEEING AVAILABILITY (OPTION TG9)",
        offer: "3780STEAMDIN",
        option: "TG9",
        placementId: "fp-wno-riverboat-cruises",
      },
      {
        label: "CHECK EARLY DINNER (6:00 PM · OPTION TG3)",
        offer: "3780STEAMDIN",
        option: "TG3",
        placementId: "fp-wno-riverboat-cruises",
      },
      {
        label: "CHECK LATE DINNER (7:45 PM · OPTION TG4)",
        offer: "3780STEAMDIN",
        option: "TG4",
        placementId: "fp-wno-riverboat-cruises",
      },
    ],
    title: "Evening Jazz Cruise",
    category: "River Cruises",
    operatorName: "New Orleans Steamboat Company",
    description: "Experience the Mississippi River at night with live jazz and stunning city views.",
    priceFrom: 58,
    priceUnit: "adult",
    isFlatRate: true,
    badges: [
      { type: "urgency", label: "⚡ Likely to Sell Out" },
      { type: "trust", label: "🎷 Live Jazz Quintet" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    slug: "evening-jazz-cruise",
    relatedTourSlug: "daytime-jazz-cruise",
    detailPageTitle: "Evening Jazz Cruise | Welcome to New Orleans Tours",
    metaDescription: "Experience the Mississippi River at night with live jazz. Choose from dinner seatings or sightseeing-only options.",
    detailSummary: "A classic evening steamboat cruise featuring live jazz and spectacular views of the New Orleans skyline.",
    bestFit: [
      "Visitors looking for a classic New Orleans evening on the river",
      "Couples and groups wanting live music and dining in one experience"
    ],
    notIdealFor: [
      "Those who prefer a fast-paced or highly active evening"
    ],
    childrenConsiderations: [
      "Children are welcome. Verify child pricing and seating options during checkout."
    ],
    bookingConfirmations: [
      "Selected seating time (Sightseeing, Early Dinner, Late Dinner)",
      "Exact departure time and boarding location",
      "Menu and inclusions"
    ],
    bookingVariants: [
      {
        label: "CHECK SIGHTSEEING AVAILABILITY",
        itemId: "560825",
        flowId: "1621291",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/560825/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621291"
      },
      {
        label: "CHECK EARLY DINNER (6:00 PM)",
        itemId: "560778",
        flowId: "1621291",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/560778/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621291"
      },
      {
        label: "CHECK LATE DINNER (7:45 PM)",
        itemId: "560822",
        flowId: "1621291",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/560822/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621291"
      },
      {
        label: "CHECK SEASONAL PARTY PACKAGE",
        itemId: "560827",
        flowId: "1621291",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/560827/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621291"
      }
    ]
  },
  {
    id: "daytime-jazz-cruise",
    companyShortname: "neworleanssteamboatcompany",
    viatorProductCode: "3780STEAM",
    viatorOptionCode: "TG31",
    viatorPlacementId: "fp-wno-riverboat-cruises",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    viatorVariants: [
      {
        label: "CHECK SIGHTSEEING AVAILABILITY (OPTION TG31)",
        offer: "3780STEAM",
        option: "TG31",
        placementId: "fp-wno-riverboat-cruises",
      },
      {
        label: "CHECK 11:00 AM LUNCH SEATING (OPTION TG12)",
        offer: "3780STEAM",
        option: "TG12",
        placementId: "fp-wno-riverboat-cruises",
      },
      {
        label: "CHECK 12:15 PM LUNCH SEATING (OPTION TG13)",
        offer: "3780STEAM",
        option: "TG13",
        placementId: "fp-wno-riverboat-cruises",
      },
      {
        label: "CHECK 2:00 PM LUNCH SEATING (OPTION TG24)",
        offer: "3780STEAM",
        option: "TG24",
        placementId: "fp-wno-riverboat-cruises",
      },
      {
        label: "CHECK 3:15 PM LUNCH SEATING (OPTION TG25)",
        offer: "3780STEAM",
        option: "TG25",
        placementId: "fp-wno-riverboat-cruises",
      },
    ],
    title: "Daytime Jazz Cruise",
    category: "River Cruises",
    operatorName: "New Orleans Steamboat Company",
    description: "Enjoy a relaxing daytime cruise on the Mississippi River with live jazz.",
    priceFrom: 44,
    priceUnit: "adult",
    isFlatRate: true,
    badges: [
      { type: "trust", label: "🎷 Duke Heitger Jazz" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    slug: "daytime-jazz-cruise",
    relatedTourSlug: "evening-jazz-cruise",
    detailPageTitle: "Daytime Jazz Cruise | Welcome to New Orleans Tours",
    metaDescription: "Enjoy a relaxing daytime cruise on the Mississippi River with live jazz. Multiple lunch seatings available.",
    detailSummary: "A daytime steamboat excursion on the Mississippi River, featuring live jazz and historical narration.",
    bestFit: [
      "Families and visitors looking for a daytime river activity",
      "Those who want to combine lunch and a tour"
    ],
    childrenConsiderations: [
      "Children are welcome. Verify child pricing and seating options during checkout."
    ],
    bookingConfirmations: [
      "Selected seating time (Sightseeing or Lunch)",
      "Exact departure time and boarding location"
    ],
    bookingVariants: [
      {
        label: "CHECK SIGHTSEEING AVAILABILITY",
        itemId: "561220",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561220/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      },
      {
        label: "CHECK 11:00 AM LUNCH SEATING",
        itemId: "561185",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561185/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      },
      {
        label: "CHECK 12:15 PM LUNCH SEATING",
        itemId: "561216",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561216/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      },
      {
        label: "CHECK 2:00 PM LUNCH SEATING",
        itemId: "566787",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/566787/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      },
      {
        label: "CHECK SEASONAL PARTY PACKAGE",
        itemId: "561392",
        flowId: "1621342",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561392/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621342"
      }
    ]
  },
  {
    id: "sunday-jazz-brunch-cruise",
    companyShortname: "neworleanssteamboatcompany",
    viatorProductCode: "3780STEAMBRU",
    viatorPlacementId: "fp-wno-riverboat-cruises",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    viatorVariants: [
      {
        label: "CHECK SUNDAY JAZZ BRUNCH AVAILABILITY (VIATOR #3780STEAMBRU)",
        offer: "3780STEAMBRU",
        placementId: "fp-wno-riverboat-cruises",
      },
      {
        label: "CHECK DAYTIME SIGHTSEEING AVAILABILITY (VIATOR #3780STEAM · TG31)",
        offer: "3780STEAM",
        option: "TG31",
        placementId: "fp-wno-riverboat-cruises",
      },
    ],
    title: "Sunday Jazz Brunch Cruise",
    category: "River Cruises",
    operatorName: "New Orleans Steamboat Company",
    description: "A festive Sunday morning on the river featuring a jazz brunch.",
    priceFrom: 44,
    priceUnit: "adult",
    isFlatRate: true,
    imageUrl: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    slug: "sunday-jazz-brunch-cruise",
    relatedTourSlug: "daytime-jazz-cruise",
    detailPageTitle: "Sunday Jazz Brunch Cruise | Welcome to New Orleans Tours",
    metaDescription: "A festive Sunday morning on the river featuring a jazz brunch. Choose from brunch seatings or sightseeing options.",
    detailSummary: "A traditional Sunday jazz brunch experience aboard a classic riverboat.",
    bestFit: [
      "Weekend visitors seeking a traditional New Orleans brunch experience"
    ],
    childrenConsiderations: [
      "Verify child pricing and availability during checkout."
    ],
    bookingConfirmations: [
      "Selected option (Sightseeing or Brunch)",
      "Departure time"
    ],
    bookingVariants: [
      {
        label: "CHECK SIGHTSEEING AVAILABILITY",
        itemId: "561369",
        flowId: "1621326",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561369/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621326"
      },
      {
        label: "CHECK BRUNCH AVAILABILITY",
        itemId: "561390",
        flowId: "1621326",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561390/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621326"
      },
      {
        label: "CHECK SEASONAL PARTY PACKAGE",
        itemId: "561403",
        flowId: "1621326",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561403/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621326"
      }
    ]
  },
  {
    id: "oak-alley-plantation-tour-grey-line",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "561477",
    flowId: "1578687",
    viatorProductCode: "3780OAK",
    viatorPlacementId: "fp-wno-plantation-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Oak Alley Plantation Tour",
    category: "Plantation Tours",
    operatorName: "Gray Line",
    description: "Explore the iconic Oak Alley Plantation with its famous canopy of southern live oak trees.",
    priceFrom: 89,
    priceUnit: "adult",
    isFlatRate: true,
    badges: [
      { type: "logistics", label: "🚐 Transportation Included" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "oak-alley-plantation-tour-grey-line",
    relatedTourSlug: "whitney-plantation-tour",
    detailPageTitle: "Oak Alley Plantation Tour by Gray Line | Welcome to New Orleans Tours",
    metaDescription: "Explore the iconic Oak Alley Plantation with its famous canopy of southern live oak trees on this Gray Line tour.",
    detailSummary: "A guided tour to Oak Alley Plantation operated by Gray Line. Published $89.00 flat rate per adult ($42.00 child ages 6–12) includes round-trip coach transportation from 400 Toulouse St. Bookings are non-refundable per Gray Line operator terms.",
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The depth and focus of historical interpretation vary by site. We encourage visitors to review the selected plantation’s specific historical program and educational approach.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "561477",
        flowId: "1578687",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561477/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1578687"
      }
    ]
  },
  {
    id: "whitney-plantation-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "561539",
    flowId: "1578687",
    viatorProductCode: "3780P41",
    viatorPlacementId: "fp-wno-plantation-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Whitney Plantation Tour",
    category: "Plantation Tours",
    operatorName: "Gray Line",
    description: "Visit the Whitney Plantation, dedicated entirely to understanding the facts of slavery in Louisiana.",
    priceFrom: 89,
    priceUnit: "adult",
    isFlatRate: true,
    badges: [
      { type: "logistics", label: "🚐 Transportation Included" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "whitney-plantation-tour",
    relatedTourSlug: "oak-alley-plantation-tour-grey-line",
    detailPageTitle: "Whitney Plantation Tour | Welcome to New Orleans Tours",
    metaDescription: "Visit the Whitney Plantation, dedicated entirely to understanding the facts of slavery in Louisiana.",
    detailSummary: "A guided visit to the Whitney Plantation, with an exclusive focus on the lives of enslaved people. Published $89.00 flat rate per adult ($42.00 child ages 6–12) includes round-trip coach transportation from 400 Toulouse St. Bookings are non-refundable per Gray Line operator terms.",
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor. The Whitney Plantation focuses exclusively on the history and experiences of the enslaved population.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "561539",
        flowId: "1578687",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561539/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1578687"
      }
    ]
  },
  {
    id: "swamp-bayou-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "561484",
    flowId: "1220421",
    viatorProductCode: "3780SWAMP",
    viatorOptionCode: "10:45AM",
    viatorPlacementId: "fp-wno-swamp-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Swamp & Bayou Tour",
    category: "Swamp Tours",
    operatorName: "Gray Line",
    description: "A classic boat tour exploring the Louisiana swamp and bayou ecosystem.",
    priceFrom: 65,
    priceUnit: "adult",
    isFlatRate: true,
    badges: [
      { type: "logistics", label: "🚐 Coach Transfer Included" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/covered-boat-swamp.png",
    slug: "swamp-bayou-tour",
    relatedTourSlug: "small-airboat-swamp-adventure",
    detailPageTitle: "Swamp & Bayou Tour | Welcome to New Orleans Tours",
    metaDescription: "A classic boat tour exploring the Louisiana swamp and bayou ecosystem with Gray Line.",
    detailSummary: "A guided covered-boat tour into Louisiana swamps and bayous. Published $65.00 flat rate per adult ($32 child ages 6–12) includes round-trip coach transportation from 400 Toulouse St. Bookings are non-refundable per Gray Line operator terms.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "561484",
        flowId: "1220421",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561484/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1220421"
      }
    ]
  },
  {
    id: "small-airboat-swamp-adventure",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "561547",
    flowId: "1220421",
    viatorProductCode: "3780AIRBOAT",
    viatorOptionCode: "TG3",
    viatorPlacementId: "fp-wno-swamp-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Small Airboat Swamp Adventure",
    category: "Airboat Rides",
    operatorName: "Gray Line",
    description: "An intimate and high-speed airboat ride through the Louisiana swamps.",
    priceFrom: 119,
    priceUnit: "person",
    isFlatRate: true,
    badges: [
      { type: "urgency", label: "⚡ Likely to Sell Out" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    slug: "small-airboat-swamp-adventure",
    relatedTourSlug: "large-airboat-swamp-adventure",
    detailPageTitle: "Small Airboat Swamp Adventure | Welcome to New Orleans Tours",
    metaDescription: "An intimate and high-speed airboat ride through the Louisiana swamps with Gray Line.",
    detailSummary: "An intimate 6–12 passenger high-speed airboat tour in the Louisiana bayou. Published $119.00 flat rate per rider includes round-trip coach transportation from 400 Toulouse St. Bookings are non-refundable per Gray Line operator terms.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "561547",
        flowId: "1220421",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561547/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1220421"
      }
    ]
  },
  {
    id: "large-airboat-swamp-adventure",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "562175",
    flowId: "1220421",
    viatorProductCode: "3780AIRBOAT",
    viatorOptionCode: "TG1",
    viatorPlacementId: "fp-wno-swamp-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Large Airboat Swamp Adventure",
    category: "Airboat Rides",
    operatorName: "Gray Line",
    description: "A fast-paced airboat ride on a larger vessel through the Louisiana swamps.",
    priceFrom: 90,
    priceUnit: "person",
    isFlatRate: true,
    imageUrl: "/images/travel-markets/new-orleans/airboat-swamp.png",
    slug: "large-airboat-swamp-adventure",
    relatedTourSlug: "small-airboat-swamp-adventure",
    detailPageTitle: "Large Airboat Swamp Adventure | Welcome to New Orleans Tours",
    metaDescription: "A fast-paced airboat ride on a larger vessel through the Louisiana swamps with Gray Line.",
    detailSummary: "A fast-paced 15–27 passenger airboat tour in the Louisiana bayou. Published $90.00 flat rate per rider includes round-trip coach transportation from 400 Toulouse St. Bookings are non-refundable per Gray Line operator terms.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "562175",
        flowId: "1220421",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/562175/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1220421"
      }
    ]
  },
  {
    id: "swamp-boat-oak-alley-combo",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "562191",
    flowId: "1220421",
    viatorProductCode: "3780SWPL",
    viatorPlacementId: "fp-wno-combo-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Swamp Boat and Oak Alley Combination",
    category: "Combo Tours",
    operatorName: "Gray Line",
    description: "Experience both a Louisiana swamp boat tour and the historic Oak Alley Plantation in one trip.",
    priceFrom: 131,
    priceUnit: "adult",
    isFlatRate: true,
    badges: [
      { type: "logistics", label: "🚐 Transportation Included" },
      { type: "trust", label: "⏱️ Full Day" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "swamp-boat-oak-alley-combo",
    relatedTourSlug: "swamp-boat-whitney-combo",
    detailPageTitle: "Swamp Boat and Oak Alley Combination | Welcome to New Orleans Tours",
    metaDescription: "Experience both a Louisiana swamp boat tour and the historic Oak Alley Plantation in one trip with Gray Line.",
    detailSummary: "A full-day combination tour featuring Oak Alley Plantation and a swamp boat ride. Published $131.00 flat rate per adult ($69.00 child ages 6–12) includes round-trip coach transportation from 400 Toulouse St. Bookings are non-refundable per Gray Line operator terms.",
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "562191",
        flowId: "1220421",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/562191/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1220421"
      }
    ]
  },
  {
    id: "swamp-boat-whitney-combo",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "670738",
    flowId: "1220421",
    viatorProductCode: "3780P91",
    viatorPlacementId: "fp-wno-combo-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Swamp Boat and Whitney Combination",
    category: "Combo Tours",
    operatorName: "Gray Line",
    description: "Experience both a Louisiana swamp boat tour and the historic Whitney Plantation.",
    priceFrom: 131,
    priceUnit: "adult",
    isFlatRate: true,
    badges: [
      { type: "logistics", label: "🚐 Transportation Included" },
      { type: "trust", label: "⏱️ Full Day" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "swamp-boat-whitney-combo",
    relatedTourSlug: "swamp-boat-oak-alley-combo",
    detailPageTitle: "Swamp Boat and Whitney Combination | Welcome to New Orleans Tours",
    metaDescription: "Experience both a Louisiana swamp boat tour and the historic Whitney Plantation with Gray Line.",
    detailSummary: "A full-day combination tour featuring Whitney Plantation and a swamp boat ride. Published $131.00 flat rate per adult ($69.00 child ages 6–12) includes round-trip coach transportation from 400 Toulouse St. Bookings are non-refundable per Gray Line operator terms.",
    historicalContextNote: "Plantation sites in Louisiana are inextricably connected to the history of slavery and forced labor.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "670738",
        flowId: "1220421",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/670738/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1220421"
      }
    ]
  },
  {
    id: "cocktail-walking-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "682856",
    flowId: "1578708",
    viatorProductCode: "3780ST",
    viatorOptionCode: "TG1",
    viatorPlacementId: "fp-wno-walking-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Cocktail Walking Tour",
    category: "Walking Tours",
    operatorName: "Gray Line",
    description: "A walking tour exploring New Orleans' historic cocktail culture.",
    priceFrom: 28,
    priceUnit: "person",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "cocktail-walking-tour",
    relatedTourSlug: "craft-cocktail-walking-tour",
    detailPageTitle: "Cocktail Walking Tour | Welcome to New Orleans Tours",
    metaDescription: "A walking tour exploring New Orleans' historic cocktail culture.",
    detailSummary: "A guided walking tour focusing on New Orleans' famous cocktails.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "682856",
        flowId: "1578708",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/682856/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1578708"
      }
    ]
  },
  {
    id: "craft-cocktail-walking-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "562204",
    flowId: "1578708",
    viatorProductCode: "3780ST",
    viatorOptionCode: "04PM",
    viatorPlacementId: "fp-wno-walking-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Craft Cocktail Walking Tour",
    category: "Walking Tours",
    operatorName: "Gray Line",
    description: "Discover the craft cocktail scene and history in the French Quarter.",
    priceFrom: 68,
    priceUnit: "person",
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "craft-cocktail-walking-tour",
    relatedTourSlug: "cocktail-walking-tour",
    detailPageTitle: "Craft Cocktail Walking Tour | Welcome to New Orleans Tours",
    metaDescription: "Discover the craft cocktail scene and history in the French Quarter.",
    detailSummary: "A guided walking tour focusing on craft cocktails and history.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "562204",
        flowId: "1578708",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/562204/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1578708"
      }
    ]
  },
  {
    id: "ghosts-spirits-walking-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "562250",
    flowId: "1578708",
    viatorProductCode: "3780GHOSTS",
    viatorPlacementId: "fp-wno-walking-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "Ghosts & Spirits Walking Tour",
    category: "Walking Tours",
    operatorName: "Gray Line",
    description: "An interactive evening walking tour through the haunted history of New Orleans.",
    priceFrom: 27,
    priceUnit: "person",
    badges: [
      { type: "urgency", label: "⚡ Popular Evenings" },
      { type: "trust", label: "🌙 After Dark" },
    ],
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "ghosts-spirits-walking-tour",
    relatedTourSlug: "craft-cocktail-walking-tour",
    detailPageTitle: "Ghosts & Spirits Walking Tour | Welcome to New Orleans Tours",
    metaDescription: "An interactive evening walking tour through the haunted history of New Orleans.",
    detailSummary: "A guided walking tour exploring the spooky side of the city.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "562250",
        flowId: "1578708",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/562250/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1578708"
      }
    ]
  },
  {
    id: "city-cemetery-garden-district-tour",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "564661",
    flowId: "1578708",
    viatorProductCode: "3780HAUNT",
    viatorPlacementId: "fp-wno-city-tours",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "City, Cemetery and Garden District Tour",
    category: "City Tours",
    operatorName: "Gray Line",
    description: "A comprehensive tour covering the city's highlights, historic cemeteries, and the Garden District.",
    priceFrom: 55,
    priceUnit: "adult",
    isFlatRate: true,
    imageUrl: "/images/travel-markets/new-orleans/french-quarter-street.jpg",
    slug: "city-cemetery-garden-district-tour",
    relatedTourSlug: "city-of-new-orleans-riverboat-cruise",
    detailPageTitle: "City, Cemetery and Garden District Tour | Welcome to New Orleans Tours",
    metaDescription: "A comprehensive tour covering the city's highlights, historic cemeteries, and the Garden District with Gray Line.",
    detailSummary: "A guided city overview including the Garden District and a cemetery stop.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "564661",
        flowId: "1578708",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/564661/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1578708"
      }
    ]
  },
  {
    id: "city-of-new-orleans-riverboat-cruise",
    companyShortname: "neworleanssteamboatcompany",
    itemId: "694782",
    flowId: "1621347",
    viatorProductCode: "3780P45",
    viatorPlacementId: "fp-wno-riverboat-cruises",
    fareharborAsnActive: true,
    handoffLinkType: "checkout_referral",
    bookingChannelLabel: "FareHarbor checkout referral",
    title: "CITY of NEW ORLEANS Riverboat Cruise",
    category: "River Cruises",
    operatorName: "New Orleans Steamboat Company",
    description: "A 75-minute riverboat cruise offering a quick and scenic tour of the Mississippi River.",
    priceFrom: 25.75,
    priceUnit: "adult",
    isFlatRate: true,
    imageUrl: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    slug: "city-of-new-orleans-riverboat-cruise",
    relatedTourSlug: "daytime-jazz-cruise",
    detailPageTitle: "75-Minute CITY of NEW ORLEANS Riverboat Cruise | Welcome to New Orleans Tours",
    metaDescription: "A 75-minute riverboat cruise offering a scenic tour of the Mississippi River with New Orleans Steamboat Company.",
    detailSummary: "A 75-minute riverboat cruise on the Mississippi. Published $25.75 flat rate per adult ($12.75 child ages 6–12, free under 6) departing from the Toulouse St. Wharf behind JAX Brewery. Bookings are non-refundable per operator policy.",
    bookingVariants: [
      {
        label: "CHECK AVAILABILITY",
        itemId: "694782",
        flowId: "1621347",
        bookingUrl: "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/694782/?ref=WelcomeToNewOrleansTours&asn=welcometoneworleanstours&full-items=yes&flow=1621347"
      }
    ]
  }
];

export interface ListingNode {
  id: string;
  name: string;
  category: string;
  location?: string;
  description?: string;
  menuUrl?: string;
  hours?: { open: number; close: number };
  verification_status?: string;
  rating?: number;
  reviewsCount?: number;
  price?: string | number;
  vibe?: string;
  logistics: Record<string, string>;
}

export const DIRECTORY_DATA: ListingNode[] = STOREFRONT_PRODUCTS.map(p => ({
  id: p.id,
  name: p.title,
  category: p.category.toLowerCase().includes("swamp") || p.category.toLowerCase().includes("airboat") ? "swamp" : "tours",
  description: p.description,
  verification_status: "verified_active",
  menuUrl: `/new-orleans/tours#${p.id}`,
  logistics: p.durationLabel ? { "Duration": p.durationLabel } as Record<string, string> : {} as Record<string, string>,
}));

export const METADATA = {
  title: "Browse New Orleans Tours | Welcome to New Orleans Tours",
  description: "Browse six current city, plantation, swamp, airboat, and full-day combination experiences from participating New Orleans operators.",
  keywords: ["new orleans tours", "new orleans city tour", "plantation tours new orleans", "cajun swamp tour", "airboat rides"]
};
