export type DurableDistrict = {
  slug: string;
  name: string;
  center: { lat: number; lng: number };
  radius_m: number;
  vibe_tags: string[];
};

export const DURABLE_DISTRICTS: Record<string, DurableDistrict[]> = {
  boston: [
    { slug: "downtown-waterfront", name: "Downtown & Waterfront", center: { lat: 42.3573, lng: -71.0544 }, radius_m: 1500, vibe_tags: ["historic", "waterfront", "tourism"] },
    { slug: "back-bay", name: "Back Bay", center: { lat: 42.3503, lng: -71.0810 }, radius_m: 1500, vibe_tags: ["shopping", "restaurants", "architecture"] },
    { slug: "fenway", name: "Fenway", center: { lat: 42.3458, lng: -71.0972 }, radius_m: 1450, vibe_tags: ["sports", "nightlife", "music"] },
  ],
  branson: [
    { slug: "highway-76-strip", name: "Highway 76 Strip", center: { lat: 36.6401, lng: -93.2760 }, radius_m: 2300, vibe_tags: ["shows", "family", "attractions"] },
    { slug: "branson-landing", name: "Branson Landing & Downtown", center: { lat: 36.6440, lng: -93.2164 }, radius_m: 1500, vibe_tags: ["shopping", "waterfront", "restaurants"] },
    { slug: "table-rock", name: "Table Rock Area", center: { lat: 36.5948, lng: -93.3106 }, radius_m: 2800, vibe_tags: ["lake", "outdoors", "scenic"] },
  ],
  honolulu: [
    { slug: "waikiki", name: "Waikiki", center: { lat: 21.2793, lng: -157.8294 }, radius_m: 2200, vibe_tags: ["beach", "nightlife", "tourism"] },
    { slug: "downtown-honolulu", name: "Downtown Honolulu", center: { lat: 21.3069, lng: -157.8583 }, radius_m: 1600, vibe_tags: ["historic", "civic", "business"] },
    { slug: "ala-moana-kakaako", name: "Ala Moana & Kakaʻako", center: { lat: 21.2920, lng: -157.8516 }, radius_m: 2200, vibe_tags: ["shopping", "food", "waterfront"] },
  ],
  "los-angeles": [
    { slug: "downtown-la", name: "Downtown LA", center: { lat: 34.0467, lng: -118.2503 }, radius_m: 3000, vibe_tags: ["events", "food", "culture"] },
    { slug: "hollywood", name: "Hollywood", center: { lat: 34.1016, lng: -118.3269 }, radius_m: 2800, vibe_tags: ["entertainment", "nightlife", "tourism"] },
    { slug: "venice-santa-monica", name: "Venice & Santa Monica", center: { lat: 34.0092, lng: -118.4896 }, radius_m: 4200, vibe_tags: ["beach", "walking", "nightlife"] },
  ],
  orlando: [
    { slug: "downtown-orlando", name: "Downtown Orlando", center: { lat: 28.5410, lng: -81.3790 }, radius_m: 2200, vibe_tags: ["events", "nightlife", "local"] },
    { slug: "international-drive", name: "International Drive", center: { lat: 28.4426, lng: -81.4703 }, radius_m: 4200, vibe_tags: ["attractions", "restaurants", "tourism"] },
    { slug: "lake-buena-vista", name: "Lake Buena Vista", center: { lat: 28.3772, lng: -81.5707 }, radius_m: 6500, vibe_tags: ["resorts", "family", "theme-parks"] },
  ],
  phoenix: [
    { slug: "downtown-phoenix", name: "Downtown Phoenix", center: { lat: 33.4484, lng: -112.0740 }, radius_m: 2600, vibe_tags: ["sports", "events", "restaurants"] },
    { slug: "roosevelt-row", name: "Roosevelt Row", center: { lat: 33.4580, lng: -112.0691 }, radius_m: 1500, vibe_tags: ["arts", "nightlife", "food"] },
    { slug: "biltmore-arcadia", name: "Biltmore & Arcadia", center: { lat: 33.5105, lng: -112.0270 }, radius_m: 4200, vibe_tags: ["resorts", "shopping", "restaurants"] },
  ],
  "pigeon-forge": [
    { slug: "parkway-north", name: "Parkway North", center: { lat: 35.8094, lng: -83.5742 }, radius_m: 2400, vibe_tags: ["family", "attractions", "shows"] },
    { slug: "the-island", name: "The Island Area", center: { lat: 35.8011, lng: -83.5714 }, radius_m: 1500, vibe_tags: ["shopping", "rides", "restaurants"] },
    { slug: "dollywood-area", name: "Dollywood Area", center: { lat: 35.7951, lng: -83.5312 }, radius_m: 3000, vibe_tags: ["theme-park", "family", "shows"] },
  ],
  portland: [
    { slug: "downtown-portland", name: "Downtown Portland", center: { lat: 45.5175, lng: -122.6801 }, radius_m: 2200, vibe_tags: ["culture", "restaurants", "walking"] },
    { slug: "pearl-district", name: "Pearl District", center: { lat: 45.5290, lng: -122.6816 }, radius_m: 1600, vibe_tags: ["galleries", "shopping", "food"] },
    { slug: "central-eastside", name: "Central Eastside", center: { lat: 45.5170, lng: -122.6560 }, radius_m: 2400, vibe_tags: ["nightlife", "food", "local"] },
  ],
  "salt-lake-city": [
    { slug: "downtown-slc", name: "Downtown Salt Lake City", center: { lat: 40.7608, lng: -111.8910 }, radius_m: 2500, vibe_tags: ["events", "convention", "dining"] },
    { slug: "granary-district", name: "Granary District", center: { lat: 40.7518, lng: -111.9033 }, radius_m: 1800, vibe_tags: ["breweries", "arts", "local"] },
    { slug: "sugar-house", name: "Sugar House", center: { lat: 40.7200, lng: -111.8580 }, radius_m: 2600, vibe_tags: ["restaurants", "shopping", "local"] },
  ],
  "san-antonio": [
    { slug: "river-walk", name: "River Walk & Downtown", center: { lat: 29.4241, lng: -98.4936 }, radius_m: 2200, vibe_tags: ["historic", "restaurants", "tourism"] },
    { slug: "pearl", name: "Pearl District", center: { lat: 29.4426, lng: -98.4794 }, radius_m: 1500, vibe_tags: ["food", "shopping", "local"] },
    { slug: "southtown", name: "Southtown", center: { lat: 29.4114, lng: -98.4930 }, radius_m: 1800, vibe_tags: ["arts", "nightlife", "restaurants"] },
  ],
  "san-diego": [
    { slug: "gaslamp", name: "Gaslamp Quarter", center: { lat: 32.7117, lng: -117.1601 }, radius_m: 1500, vibe_tags: ["nightlife", "events", "restaurants"] },
    { slug: "little-italy", name: "Little Italy", center: { lat: 32.7227, lng: -117.1686 }, radius_m: 1400, vibe_tags: ["food", "walking", "local"] },
    { slug: "mission-beach-pacific-beach", name: "Mission Beach & Pacific Beach", center: { lat: 32.7890, lng: -117.2480 }, radius_m: 3600, vibe_tags: ["beach", "nightlife", "water"] },
  ],
  "san-francisco": [
    { slug: "union-square", name: "Union Square & Downtown", center: { lat: 37.7879, lng: -122.4075 }, radius_m: 1900, vibe_tags: ["shopping", "theater", "tourism"] },
    { slug: "fishermans-wharf", name: "Fisherman’s Wharf", center: { lat: 37.8080, lng: -122.4177 }, radius_m: 1900, vibe_tags: ["waterfront", "tourism", "food"] },
    { slug: "mission", name: "Mission District", center: { lat: 37.7599, lng: -122.4148 }, radius_m: 2600, vibe_tags: ["food", "nightlife", "local"] },
  ],
  scottsdale: [
    { slug: "old-town", name: "Old Town Scottsdale", center: { lat: 33.4942, lng: -111.9261 }, radius_m: 2200, vibe_tags: ["nightlife", "shopping", "restaurants"] },
    { slug: "waterfront-fashion-square", name: "Waterfront & Fashion Square", center: { lat: 33.5020, lng: -111.9293 }, radius_m: 1700, vibe_tags: ["shopping", "dining", "resorts"] },
    { slug: "mcdowell-sonoran", name: "McDowell Sonoran Area", center: { lat: 33.6208, lng: -111.8746 }, radius_m: 6500, vibe_tags: ["outdoors", "hiking", "scenic"] },
  ],
  seattle: [
    { slug: "downtown-pike-place", name: "Downtown & Pike Place", center: { lat: 47.6097, lng: -122.3422 }, radius_m: 2200, vibe_tags: ["market", "waterfront", "tourism"] },
    { slug: "capitol-hill", name: "Capitol Hill", center: { lat: 47.6231, lng: -122.3165 }, radius_m: 2200, vibe_tags: ["nightlife", "food", "music"] },
    { slug: "seattle-center", name: "Seattle Center & Uptown", center: { lat: 47.6205, lng: -122.3493 }, radius_m: 1800, vibe_tags: ["events", "attractions", "culture"] },
  ],
  tampa: [
    { slug: "downtown-water-street", name: "Downtown & Water Street", center: { lat: 27.9475, lng: -82.4530 }, radius_m: 2200, vibe_tags: ["sports", "events", "waterfront"] },
    { slug: "ybor-city", name: "Ybor City", center: { lat: 27.9606, lng: -82.4403 }, radius_m: 1900, vibe_tags: ["nightlife", "historic", "food"] },
    { slug: "channel-district", name: "Channel District", center: { lat: 27.9440, lng: -82.4470 }, radius_m: 1700, vibe_tags: ["cruise", "aquarium", "restaurants"] },
  ],
  "washington-dc": [
    { slug: "national-mall", name: "National Mall", center: { lat: 38.8895, lng: -77.0353 }, radius_m: 2800, vibe_tags: ["museums", "monuments", "tourism"] },
    { slug: "penn-quarter", name: "Penn Quarter & Chinatown", center: { lat: 38.8998, lng: -77.0219 }, radius_m: 1800, vibe_tags: ["events", "restaurants", "culture"] },
    { slug: "dupont-logan", name: "Dupont & Logan Circle", center: { lat: 38.9106, lng: -77.0370 }, radius_m: 2600, vibe_tags: ["nightlife", "restaurants", "local"] },
  ],
  "wisconsin-dells": [
    { slug: "downtown-dells", name: "Downtown Wisconsin Dells", center: { lat: 43.6275, lng: -89.7709 }, radius_m: 1700, vibe_tags: ["walking", "shops", "attractions"] },
    { slug: "wisconsin-dells-parkway", name: "Wisconsin Dells Parkway", center: { lat: 43.5978, lng: -89.7931 }, radius_m: 4200, vibe_tags: ["waterparks", "family", "restaurants"] },
    { slug: "lake-delton", name: "Lake Delton", center: { lat: 43.5944, lng: -89.7937 }, radius_m: 3200, vibe_tags: ["water", "resorts", "family"] },
  ],
  juneau: [
    { slug: "downtown-juneau", name: "Downtown Juneau", center: { lat: 58.3019, lng: -134.4197 }, radius_m: 1900, vibe_tags: ["cruise", "historic", "shopping"] },
    { slug: "mendenhall-valley", name: "Mendenhall Valley", center: { lat: 58.3727, lng: -134.5818 }, radius_m: 5000, vibe_tags: ["glacier", "outdoors", "scenic"] },
    { slug: "douglas", name: "Douglas", center: { lat: 58.2756, lng: -134.3898 }, radius_m: 3000, vibe_tags: ["local", "waterfront", "scenic"] },
  ],
};
