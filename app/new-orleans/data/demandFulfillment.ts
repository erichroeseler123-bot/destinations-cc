import { NEW_ORLEANS_SEARCH_DEMAND, type SearchDemandFamily } from "./searchDemandTaxonomy";
import { TOUR_KNOWLEDGE, type FulfillmentSource, type TourKnowledge } from "./tourKnowledge";

export type DemandFulfillment = {
  family: SearchDemandFamily;
  matchedTours: TourKnowledge[];
  matchedSources: FulfillmentSource[];
  commercialReady: boolean;
  editorialAllowed: boolean;
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/**
 * Returns fulfillment truth for every researched search-demand family.
 *
 * A family is commercially ready only when at least one real tour is mapped
 * to it. This is intentionally stricter than simply having a keyword in the
 * taxonomy. Affiliate inventory can be added later by enriching TOUR_KNOWLEDGE
 * with Viator/GetYourGuide/direct products; no page logic should bypass this
 * resolver and claim bookability independently.
 */
export const DEMAND_FULFILLMENT: DemandFulfillment[] = NEW_ORLEANS_SEARCH_DEMAND.map((family) => {
  const matchedTours = TOUR_KNOWLEDGE.filter((tour) => tour.searchDemandIds.includes(family.id));
  const matchedSources = unique(matchedTours.map((tour) => tour.fulfillmentSource));

  return {
    family,
    matchedTours,
    matchedSources,
    commercialReady: matchedTours.length > 0,
    editorialAllowed: true,
  };
});

export const DEMAND_FULFILLMENT_BY_ID: Record<string, DemandFulfillment> = Object.fromEntries(
  DEMAND_FULFILLMENT.map((entry) => [entry.family.id, entry]),
);

export function getDemandFulfillment(id: string): DemandFulfillment | undefined {
  return DEMAND_FULFILLMENT_BY_ID[id];
}

export function getCommercialDemandFamilies(): DemandFulfillment[] {
  return DEMAND_FULFILLMENT.filter((entry) => entry.commercialReady);
}

export function getUnmatchedDemandFamilies(): DemandFulfillment[] {
  return DEMAND_FULFILLMENT.filter((entry) => !entry.commercialReady);
}
