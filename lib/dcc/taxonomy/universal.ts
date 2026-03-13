export type DccUniversalCategory = {
  key: string;
  label: string;
  group:
    | "nature"
    | "attractions"
    | "culture"
    | "entertainment"
    | "food"
    | "shopping"
    | "lodging"
    | "transport"
    | "experiences"
    | "urban";
};

export const DCC_UNIVERSAL_CATEGORIES: readonly DccUniversalCategory[] = [
  { key: "parks", label: "Parks", group: "nature" },
  { key: "national-parks", label: "National Parks", group: "nature" },
  { key: "trails", label: "Trails & Hiking", group: "nature" },
  { key: "beaches", label: "Beaches", group: "nature" },
  { key: "wildlife", label: "Wildlife Viewing", group: "nature" },
  { key: "landmarks", label: "Landmarks", group: "attractions" },
  { key: "theme-parks", label: "Theme Parks", group: "attractions" },
  { key: "zoos-aquariums", label: "Zoos & Aquariums", group: "attractions" },
  { key: "museums", label: "Museums", group: "culture" },
  { key: "historic-sites", label: "Historic Sites", group: "culture" },
  { key: "galleries", label: "Art Galleries", group: "culture" },
  { key: "concert-venues", label: "Concert Venues", group: "entertainment" },
  { key: "theaters", label: "Theaters", group: "entertainment" },
  { key: "nightlife", label: "Nightlife", group: "entertainment" },
  { key: "restaurants", label: "Restaurants", group: "food" },
  { key: "bars-breweries", label: "Bars & Breweries", group: "food" },
  { key: "cafes", label: "Cafes", group: "food" },
  { key: "shopping-districts", label: "Shopping Districts", group: "shopping" },
  { key: "markets", label: "Markets", group: "shopping" },
  { key: "hotels", label: "Hotels", group: "lodging" },
  { key: "resorts", label: "Resorts", group: "lodging" },
  { key: "vacation-rentals", label: "Vacation Rentals", group: "lodging" },
  { key: "airports", label: "Airports", group: "transport" },
  { key: "ports", label: "Ports & Ferries", group: "transport" },
  { key: "shuttles", label: "Shuttles & Transfers", group: "transport" },
  { key: "guided-tours", label: "Guided Tours", group: "experiences" },
  { key: "day-trips", label: "Day Trips", group: "experiences" },
  { key: "cruises", label: "Cruises", group: "experiences" },
  { key: "activities", label: "Activities", group: "experiences" },
  { key: "downtown", label: "Downtown", group: "urban" },
  { key: "waterfront", label: "Waterfront", group: "urban" },
  { key: "historic-district", label: "Historic District", group: "urban" },
  { key: "arts-district", label: "Arts District", group: "urban" },
];
