export type AffiliateIntent =
  | "activities"
  | "stays"
  | "transfers"
  | "connectivity"
  | "insurance";

export type AffiliateSurface =
  | "city"
  | "attraction"
  | "guide"
  | "hotel"
  | "transport"
  | "tour"
  | "event";

export type AffiliateModuleDefinition = {
  id: string;
  label: string;
  description: string;
  intent: AffiliateIntent;
  allowedSurfaces: AffiliateSurface[];
  minPriority: number;
  suppressedOnTransactionalSurfaces: boolean;
};

export type AffiliateModuleContext = {
  surface: AffiliateSurface;
  priority?: number;
  isTransactional?: boolean;
};

const SUBTLE_AFFILIATE_MODULES: AffiliateModuleDefinition[] = [
  {
    id: "stays_nearby",
    label: "Nearby stays",
    description: "Use on city and guide pages when lodging intent already exists.",
    intent: "stays",
    allowedSurfaces: ["city", "attraction", "guide", "hotel"],
    minPriority: 30,
    suppressedOnTransactionalSurfaces: true,
  },
  {
    id: "airport_transfer",
    label: "Airport transfer options",
    description: "Use on city, hotel, and transport pages where arrival logistics are relevant.",
    intent: "transfers",
    allowedSurfaces: ["city", "guide", "hotel", "transport"],
    minPriority: 40,
    suppressedOnTransactionalSurfaces: true,
  },
  {
    id: "trip_esim",
    label: "Trip connectivity",
    description: "Use on international city and guide pages as a utility add-on.",
    intent: "connectivity",
    allowedSurfaces: ["city", "guide", "transport"],
    minPriority: 50,
    suppressedOnTransactionalSurfaces: true,
  },
  {
    id: "trip_protection",
    label: "Trip protection",
    description: "Use only on planning-heavy pages where insurance is contextually relevant.",
    intent: "insurance",
    allowedSurfaces: ["city", "guide", "transport"],
    minPriority: 60,
    suppressedOnTransactionalSurfaces: true,
  },
];

export function getSubtleAffiliateModules(
  context: AffiliateModuleContext
): AffiliateModuleDefinition[] {
  const priority = context.priority ?? 50;

  return SUBTLE_AFFILIATE_MODULES.filter((module) => {
    if (!module.allowedSurfaces.includes(context.surface)) return false;
    if (priority < module.minPriority) return false;
    if (context.isTransactional && module.suppressedOnTransactionalSurfaces) return false;
    return true;
  });
}
