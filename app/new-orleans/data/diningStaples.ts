export type DiningStaple = {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  websiteUrl: string;
  fitTags: string[];
  whyItMatters: string;
  reservationNote: string;
  editorialLabel: "New Orleans Staple";
};

/**
 * Independent editorial listings. These are not paid Dining Partners and
 * generate no referral fee. Facts were reviewed against current official
 * restaurant sites on 2026-08-09.
 */
export const DINING_STAPLES: DiningStaple[] = [
  {
    id: "cafe-du-monde-french-market",
    name: "Café du Monde — French Market",
    neighborhood: "French Quarter / French Market",
    address: "800 Decatur Street, New Orleans, LA 70116",
    websiteUrl: "https://shop.cafedumonde.com/locations/",
    fitTags: ["Beignets", "Coffee", "First-time visitors", "Quick iconic stop"],
    whyItMatters: "The original French Market coffee stand dates to 1862 and remains one of the city's most recognizable beignet-and-café-au-lait stops.",
    reservationNote: "Coffee-stand format rather than a traditional reservation meal.",
    editorialLabel: "New Orleans Staple",
  },
  {
    id: "central-grocery",
    name: "Central Grocery & Deli",
    neighborhood: "French Quarter",
    address: "923 Decatur Street, New Orleans, LA 70116",
    websiteUrl: "https://centralgrocery.com/",
    fitTags: ["Muffuletta", "Casual lunch", "French Quarter", "Takeaway"],
    whyItMatters: "The family-run grocery was founded in 1906 and identifies itself as the home of the original muffuletta.",
    reservationNote: "Casual grocery/deli format; use current store hours rather than planning around a dinner reservation.",
    editorialLabel: "New Orleans Staple",
  },
  {
    id: "antoines",
    name: "Antoine's Restaurant",
    neighborhood: "French Quarter",
    address: "713 Saint Louis Street, New Orleans, LA 70130",
    websiteUrl: "https://antoines.com/",
    fitTags: ["Historic Creole", "Special occasion", "Classic dining", "Groups"],
    whyItMatters: "Operating since 1840, Antoine's describes itself as New Orleans' oldest restaurant and the birthplace of dishes including Oysters Rockefeller.",
    reservationNote: "Reservations are available; check the restaurant's current schedule and dining-room policies before going.",
    editorialLabel: "New Orleans Staple",
  },
  {
    id: "brennans",
    name: "Brennan's",
    neighborhood: "French Quarter",
    address: "417 Royal Street, New Orleans, LA 70130",
    websiteUrl: "https://www.brennansneworleans.com/",
    fitTags: ["Breakfast and brunch", "Creole", "Celebration meal", "French Quarter"],
    whyItMatters: "A French Quarter dining tradition since 1946, known for an elegant Creole experience and a strong breakfast/brunch identity.",
    reservationNote: "Reservations open 60 days in advance; the restaurant strongly recommends reserving and asks parties larger than six to call directly.",
    editorialLabel: "New Orleans Staple",
  },
  {
    id: "galatoires",
    name: "Galatoire's",
    neighborhood: "French Quarter",
    address: "209 Bourbon Street, New Orleans, LA 70130",
    websiteUrl: "https://www.galatoires.com/",
    fitTags: ["Classic Creole", "Friday lunch", "Traditional dining", "Special occasion"],
    whyItMatters: "Galatoire's has served traditional New Orleans dining on Bourbon Street since 1905 and remains especially known for its lively Friday lunch tradition.",
    reservationNote: "Dress requirements vary by service; jackets are required for gentlemen starting at 5 p.m. and all day Sunday according to the restaurant's current policy.",
    editorialLabel: "New Orleans Staple",
  },
  {
    id: "commanders-palace",
    name: "Commander's Palace",
    neighborhood: "Garden District",
    address: "1403 Washington Avenue, New Orleans, LA 70130",
    websiteUrl: "https://www.commanderspalace.com/",
    fitTags: ["Garden District", "Celebration meal", "Creole", "Dress-up dinner"],
    whyItMatters: "A longstanding Garden District destination with formal service, a strong Creole identity, and a major place in New Orleans restaurant culture.",
    reservationNote: "Reservations are available and the restaurant enforces a business-attire dress code; review current requirements before going.",
    editorialLabel: "New Orleans Staple",
  },
  {
    id: "acme-oyster-house",
    name: "Acme Oyster House — French Quarter",
    neighborhood: "French Quarter",
    address: "724 Iberville Street, New Orleans, LA 70130",
    websiteUrl: "https://acmeoyster.com/french-quarter-la/",
    fitTags: ["Oysters", "Casual seafood", "French Quarter", "Walk-in meal"],
    whyItMatters: "A French Quarter oyster house dating to 1910, especially associated with raw and chargrilled oysters and casual New Orleans seafood.",
    reservationNote: "Acme states that it does not accept reservations at any location; expect a walk-in format and possible wait.",
    editorialLabel: "New Orleans Staple",
  },
  {
    id: "dooky-chases",
    name: "Dooky Chase's Restaurant",
    neighborhood: "Tremé",
    address: "2301 Orleans Avenue, New Orleans, LA 70119",
    websiteUrl: "https://www.dookychaserestaurants.com/",
    fitTags: ["Creole", "Tremé", "Civil-rights history", "Lunch"],
    whyItMatters: "A historic family restaurant founded in 1941 with deep ties to New Orleans Creole food and civil-rights history.",
    reservationNote: "Reservations are highly recommended; current dinner service is limited to Friday and Saturday evenings, with lunch Tuesday through Friday.",
    editorialLabel: "New Orleans Staple",
  },
  {
    id: "parkway-bakery",
    name: "Parkway Bakery & Tavern",
    neighborhood: "Mid-City",
    address: "538 Hagan Avenue, New Orleans, LA 70119",
    websiteUrl: "https://parkwaypoorboys.com/",
    fitTags: ["Po-boys", "Casual lunch", "Mid-City", "Local institution"],
    whyItMatters: "Parkway traces its history to 1911 and is one of the city's enduring po-boy destinations.",
    reservationNote: "Casual counter-service/tavern-style stop; check the current operating days before making the trip.",
    editorialLabel: "New Orleans Staple",
  },
];

export const DINING_STAPLES_DISCLOSURE =
  "New Orleans Staple — included as independent editorial guidance. This restaurant is not shown here because it paid us, and we do not receive a referral fee from this listing.";

// Compatibility exports used by the current food page while preserving the
// canonical editorial data shape above.
export const NEW_ORLEANS_STAPLES = DINING_STAPLES.map((staple) => ({
  ...staple,
  planningNote: staple.reservationNote,
}));
export const STAPLE_DISCLOSURE = DINING_STAPLES_DISCLOSURE;
