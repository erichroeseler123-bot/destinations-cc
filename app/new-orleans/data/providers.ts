import { Provider } from './types';

export const PROVIDERS: Record<string, Provider> = {
  "southern-style-tours": {
    id: "southern-style-tours",
    displayName: "Southern Style Tours",
    legalName: null,
    publicAttributionName: "Southern Style Tours",
    status: "live",
    fareHarborShortname: "southernstyletours",
    bookingPlatform: "fareharbor",
    supportResponsibility: { handledBy: "provider", contactAvailability: null },
    cancellationSummary: { deadline: null, refundResponsibility: "provider" },
    publicContactAvailability: null,
    productIds: ["southernstyle-city-tour", "southernstyle-plantation"],
    categoryIds: ["city-tours", "plantation-tours"],
    onboardingChecklist: [],
    verificationStatus: "verified"
  },
  "ragin-cajun-tours": {
    id: "ragin-cajun-tours",
    displayName: "Ragin Cajun Airboat Tours",
    legalName: null,
    publicAttributionName: "Ragin Cajun Tours",
    status: "live",
    fareHarborShortname: "ragincajunairboattours",
    bookingPlatform: "fareharbor",
    supportResponsibility: { handledBy: "provider", contactAvailability: null },
    cancellationSummary: { deadline: null, refundResponsibility: "provider" },
    publicContactAvailability: null,
    productIds: ["ragincajun-covered-boat", "ragincajun-airboat"],
    categoryIds: ["swamp-tours", "airboat-tours", "covered-swamp-boat-tours"],
    onboardingChecklist: [],
    verificationStatus: "verified"
  },
  "nola-ghost-riders": {
    id: "nola-ghost-riders",
    displayName: "NOLA Ghost Riders",
    legalName: null,
    publicAttributionName: "NOLA Ghost Riders",
    status: "pending_inventory",
    fareHarborShortname: null,
    bookingPlatform: null,
    supportResponsibility: { handledBy: "provider", contactAvailability: null },
    cancellationSummary: { deadline: null, refundResponsibility: null },
    publicContactAvailability: null,
    productIds: ["nola-ghost-riders-cemetery-bus", "nola-ghost-riders-haunted-history", "nola-ghost-riders-haunted-plantation"],
    categoryIds: ["ghost-tours", "cemetery-tours"],
    onboardingChecklist: [],
    verificationStatus: "partial"
  },
  "nosoc": {
    id: "nosoc",
    displayName: "New Orleans School of Cooking",
    legalName: null,
    publicAttributionName: "New Orleans School of Cooking",
    status: "pending_inventory",
    fareHarborShortname: null,
    bookingPlatform: null,
    supportResponsibility: { handledBy: "provider", contactAvailability: null },
    cancellationSummary: { deadline: null, refundResponsibility: null },
    publicContactAvailability: null,
    productIds: ["nosoc-demo", "nosoc-hands-on", "nosoc-lab"],
    categoryIds: ["cooking-classes", "food-tours"],
    onboardingChecklist: [],
    verificationStatus: "partial"
  }
};
