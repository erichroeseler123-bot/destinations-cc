export type FeaturedTourProduct = {
  slug: string;
  title: string;
  description: string;
  query: string;
  section: string;
  cityKey: string;
};

export const FEATURED_TOUR_PRODUCTS: FeaturedTourProduct[] = [
  {
    slug: "vegas-pool-cabana-and-dayclub",
    title: "Vegas pool cabana and dayclub experiences",
    description: "Use this lane for pool-party upgrades, premium dayclub inventory, and resort pool cabana planning.",
    query: "las vegas pool cabana dayclub",
    section: "pools",
    cityKey: "las-vegas",
  },
  {
    slug: "vegas-pool-party-packages",
    title: "Vegas pool party packages",
    description: "Higher-energy pool inventory for weekend, bachelor, and group travel buyers.",
    query: "las vegas pool party package",
    section: "pools",
    cityKey: "las-vegas",
  },
  {
    slug: "miami-south-beach-water-activities",
    title: "South Beach water activities",
    description: "Beach-adjacent rentals and activity inventory for visitors who want to stay near the core Miami beach zone.",
    query: "south beach miami water activities",
    section: "beaches",
    cityKey: "miami",
  },
  {
    slug: "miami-biscayne-boat-and-beach",
    title: "Biscayne boat and beach experiences",
    description: "Boat-led and bay-led inventory that pairs naturally with Miami beach days.",
    query: "biscayne bay miami beach boat tour",
    section: "beaches",
    cityKey: "miami",
  },
];

export function getFeaturedTourProducts(cityKey: string, section: string) {
  return FEATURED_TOUR_PRODUCTS.filter((product) => product.cityKey === cityKey && product.section === section);
}
