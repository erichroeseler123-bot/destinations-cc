export type SiteProductMapping = {
  internalId: string;
  viatorCode: string;
  siteId: "welcometotheswamp" | "welcometoneworleanstours" | "last-frontier-shore-excursions" | "welcometoalaskatours" | "cruisepromenade" | "dcc";
  destination: string;
  portSlug?: string;
  defaultCampaign: string;
  preferredInventoryTier: "viator_primary" | "viator_secondary" | "direct_operator";
};

export const DCC_VIATOR_PRODUCT_MAPPINGS: readonly SiteProductMapping[] = [
  // ==========================================
  // Welcome to the Swamp (WTS) - Primary
  // ==========================================
  {
    internalId: "airboat-swamp-tour",
    viatorCode: "3780AIRBOAT",
    siteId: "welcometotheswamp",
    destination: "New Orleans",
    defaultCampaign: "wts-plan-airboat",
    preferredInventoryTier: "viator_primary",
  },
  {
    internalId: "covered-boat-swamp-tour",
    viatorCode: "3780SWAMP",
    siteId: "welcometotheswamp",
    destination: "New Orleans",
    defaultCampaign: "wts-plan-covered-boat",
    preferredInventoryTier: "viator_primary",
  },
  {
    internalId: "swamp-tour-with-pickup",
    viatorCode: "6953SWAMPTRANS",
    siteId: "welcometotheswamp",
    destination: "New Orleans",
    defaultCampaign: "wts-plan-pickup",
    preferredInventoryTier: "viator_primary",
  },

  // ==========================================
  // Welcome to New Orleans Tours (WNO) - Secondary
  // ==========================================
  {
    internalId: "new-orleans-airboat",
    viatorCode: "3780AIRBOAT",
    siteId: "welcometoneworleanstours",
    destination: "New Orleans",
    defaultCampaign: "wno-comparison-airboat",
    preferredInventoryTier: "viator_secondary",
  },
  {
    internalId: "new-orleans-covered-swamp",
    viatorCode: "3780SWAMP",
    siteId: "welcometoneworleanstours",
    destination: "New Orleans",
    defaultCampaign: "wno-comparison-covered-swamp",
    preferredInventoryTier: "viator_secondary",
  },
  {
    internalId: "honey-island-swamp-pickup",
    viatorCode: "6953SWAMPTRANS",
    siteId: "welcometoneworleanstours",
    destination: "New Orleans",
    defaultCampaign: "wno-guide-pickup-swamp",
    preferredInventoryTier: "viator_secondary",
  },

  // ==========================================
  // Last Frontier Shore Excursions (LFSE)
  // ==========================================
  {
    internalId: "juneau-whale-small-group",
    viatorCode: "331813P1",
    siteId: "last-frontier-shore-excursions",
    destination: "Juneau",
    portSlug: "juneau",
    defaultCampaign: "last-frontier-juneau-whale-small-group",
    preferredInventoryTier: "viator_primary",
  },
  {
    internalId: "juneau-heli-glacier-walk",
    viatorCode: "6251SHOREXICEWALK",
    siteId: "last-frontier-shore-excursions",
    destination: "Juneau",
    portSlug: "juneau",
    defaultCampaign: "last-frontier-juneau-heli-glacier-walk",
    preferredInventoryTier: "viator_primary",
  },

  // ==========================================
  // Welcome to Alaska Tours (WAT)
  // ==========================================
  {
    internalId: "wat-juneau-whale-watching",
    viatorCode: "331813P1",
    siteId: "welcometoalaskatours",
    destination: "Juneau",
    portSlug: "juneau",
    defaultCampaign: "wat-juneau-discovery-whale",
    preferredInventoryTier: "viator_secondary",
  },

  // ==========================================
  // Cruise Promenade (CP) - Port Schedules
  // ==========================================
  {
    internalId: "cp-juneau-whale-port-day",
    viatorCode: "331813P1",
    siteId: "cruisepromenade",
    destination: "Juneau",
    portSlug: "juneau",
    defaultCampaign: "cp-juneau-whale-watch-port-day",
    preferredInventoryTier: "viator_primary",
  },
  {
    internalId: "cp-juneau-heli-glacier-port-day",
    viatorCode: "6251SHOREXICEWALK",
    siteId: "cruisepromenade",
    destination: "Juneau",
    portSlug: "juneau",
    defaultCampaign: "cp-juneau-heli-glacier-walk-port-day",
    preferredInventoryTier: "viator_primary",
  },
] as const;

export function resolveViatorCodeForSite(siteId: string, internalId: string): string | null {
  const match = DCC_VIATOR_PRODUCT_MAPPINGS.find(
    (m) => m.siteId === siteId && m.internalId === internalId
  );
  return match ? match.viatorCode : null;
}

export function resolveInternalIdForViatorCode(siteId: string, viatorCode: string): string | null {
  const match = DCC_VIATOR_PRODUCT_MAPPINGS.find(
    (m) => m.siteId === siteId && m.viatorCode === viatorCode
  );
  return match ? match.internalId : null;
}

export function getMappingsForSite(siteId: string): SiteProductMapping[] {
  return DCC_VIATOR_PRODUCT_MAPPINGS.filter((m) => m.siteId === siteId);
}
