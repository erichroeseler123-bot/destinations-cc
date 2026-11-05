export type HotelConciergePropertyConfig = {
  propertySlug: string;
  propertyName: string;
  destinationSlug: string;
  earthosDestinationNodeId: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  defaultRequiresHotelPickup: boolean;
  approvedTourIds: string[];
  approvedCategories: string[];
  conciergeDeskNote: string;
  isDemoPreset?: boolean;
  demoStatusLabel?: string;
  defaultPlacementId?: string;
};

export const HOTEL_CONCIERGE_CONFIGS: Record<string, HotelConciergePropertyConfig> = {
  "hotel-monteleone-nola": {
    propertySlug: "hotel-monteleone-nola",
    propertyName: "Hotel Monteleone — French Quarter (Demo Preset)",
    destinationSlug: "new-orleans",
    earthosDestinationNodeId: "earthos:node:us-la-new-orleans",
    neighborhood: "French Quarter — Royal Street",
    address: "214 Royal St, New Orleans, LA 70130",
    lat: 29.9542,
    lng: -90.0681,
    defaultRequiresHotelPickup: true,
    isDemoPreset: true,
    demoStatusLabel: "DEMO PRESET — Pending Hotel Approval",
    defaultPlacementId: "nola-hotel-monteleone-demo-pilot",
    approvedTourIds: [
      "dcc:tour:fh:jeanlafitteswamptour:763318",
      "dcc:tour:viator:6953SWAMPTRANS",
      "dcc:tour:viator:3780AIRBOAT",
      "dcc:tour:viator:3780SWAMP",
      "dcc:tour:viator:3780STEAM",
      "dcc:tour:viator:6455NOLAAIR",
    ],
    approvedCategories: [
      "Swamp & Bayou",
      "Music & Riverboat Cruises",
      "Ghost, History & Walking",
      "Food, Drink & Culture",
    ],
    conciergeDeskNote:
      "DEMO PRESET (Pending Hotel Approval): Royal Street shuttle pickup zone is directly outside main lobby doors (214 Royal St — FareHarbor pickup option #22056428); Toulouse Street Wharf is within a 6-minute walk.",
  },
  "roosevelt-new-orleans": {
    propertySlug: "roosevelt-new-orleans",
    propertyName: "The Roosevelt New Orleans (CBD / French Quarter Edge)",
    destinationSlug: "new-orleans",
    earthosDestinationNodeId: "earthos:node:us-la-new-orleans",
    neighborhood: "Central Business District",
    address: "130 Roosevelt Way, New Orleans, LA 70112",
    lat: 29.9549,
    lng: -90.0725,
    defaultRequiresHotelPickup: true,
    approvedTourIds: [
      "dcc:tour:viator:6953SWAMPTRANS",
      "dcc:tour:viator:3780AIRBOAT",
      "dcc:tour:viator:3780SWAMP",
      "dcc:tour:viator:3780STEAM",
      "dcc:tour:viator:6455NOLAAIR",
    ],
    approvedCategories: ["Swamp & Bayou", "Music & Riverboat Cruises"],
    conciergeDeskNote:
      "Motorcoach tour pickups board at the Baronne Street porte-cochere.",
  },
  "omni-riverfront-nola": {
    propertySlug: "omni-riverfront-nola",
    propertyName: "Omni Riverfront Hotel (Warehouse District / Cruise Port)",
    destinationSlug: "new-orleans",
    earthosDestinationNodeId: "earthos:node:us-la-new-orleans",
    neighborhood: "Warehouse / Arts District (Adjacent to Erato Cruise Terminal)",
    address: "701 Convention Center Blvd, New Orleans, LA 70130",
    lat: 29.9421,
    lng: -90.0637,
    defaultRequiresHotelPickup: true,
    approvedTourIds: [
      "dcc:tour:viator:6953SWAMPTRANS",
      "dcc:tour:viator:3780SWAMP",
      "dcc:tour:viator:3780AIRBOAT",
      "dcc:tour:viator:3780STEAM",
      "dcc:tour:viator:6455NOLAAIR",
    ],
    approvedCategories: ["Swamp & Bayou", "Music & Riverboat Cruises", "Guided Sightseeing & Excursions"],
    conciergeDeskNote:
      "Ideal for pre- and post-cruise guests; 0.3 km from Port of New Orleans Erato/Julia Street terminals.",
  },
  "baranof-hotel-juneau": {
    propertySlug: "baranof-hotel-juneau",
    propertyName: "The Westmark Baranof Hotel (Downtown Juneau)",
    destinationSlug: "juneau",
    earthosDestinationNodeId: "earthos:node:us-ak-juneau",
    neighborhood: "Downtown Juneau",
    address: "127 N Franklin St, Juneau, AK 99801",
    lat: 58.3014,
    lng: -134.4079,
    defaultRequiresHotelPickup: true,
    approvedTourIds: [
      "dcc:tour:fh:temscoair-juneau:2934",
      "dcc:tour:fh:coastalhelicopters:24563",
      "dcc:tour:fh:northstartrekking:46624",
      "dcc:tour:viator:331813P1",
      "dcc:tour:viator:6251SHOREXICEWALK",
    ],
    approvedCategories: [
      "Helicopter & Flightseeing",
      "Whale Watching & Marine Wildlife",
      "Glacier & Adventure",
    ],
    conciergeDeskNote:
      "Heliport vans pick up at Franklin Street / downtown dock transfer zone.",
  },
  "maven-hotel-denver": {
    propertySlug: "maven-hotel-denver",
    propertyName: "The Maven Hotel at Dairy Block (LoDo Denver)",
    destinationSlug: "denver-colorado",
    earthosDestinationNodeId: "earthos:node:us-co-denver",
    neighborhood: "LoDo / Union Station District",
    address: "1850 Wazee St, Denver, CO 80202",
    lat: 39.7549,
    lng: -104.9968,
    defaultRequiresHotelPickup: false,
    approvedTourIds: [
      "dcc:tour:gosno:den-winter-park-suv",
      "dcc:tour:gosno:den-winter-park-van",
      "dcc:tour:gosno:den-breckenridge-suv",
      "dcc:tour:gosno:den-vail-suv",
      "dcc:tour:parr:rr-parr-private-suburban-6pax",
      "dcc:tour:parr:rr-parr-private-van-10pax",
    ],
    approvedCategories: ["Mountain & Venue Transfers", "Guided Sightseeing & Excursions"],
    conciergeDeskNote:
      "Door-to-door private SUV and passenger van pickup available for GoSno ski resort transfers and Party at Red Rocks private concert charters.",
  },
};

export function getHotelConciergeConfig(propertySlug?: string | null): HotelConciergePropertyConfig {
  if (propertySlug && HOTEL_CONCIERGE_CONFIGS[propertySlug]) {
    return HOTEL_CONCIERGE_CONFIGS[propertySlug];
  }
  return HOTEL_CONCIERGE_CONFIGS["hotel-monteleone-nola"];
}
