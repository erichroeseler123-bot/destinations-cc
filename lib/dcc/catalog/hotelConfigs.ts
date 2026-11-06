export type OperatorHotelPickupRule = {
  operatorCode: string;
  operatorName: string;
  tourIds: string[];
  publishedPickupWindowLeadMinutes: number;
  roundTripShuttleFeePerPersonUsd: number;
  pickupWindowRuleSummary: string;
  namedStopForProperty: string | null;
  pickupStatusForProperty: "confirmed_named_stop" | "unconfirmed";
  sourceUrl: string;
  checkedOn: string;
};

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
  unconfirmedPickupTourIds?: string[];
  approvedCategories: string[];
  conciergeDeskNote: string;
  isDemoPreset?: boolean;
  demoStatusLabel?: string;
  placementApprovalStatus?:
    | "approved_production"
    | "pending_operator_terms_and_hotel_approval"
    | "unconfirmed_pickup_stop";
  operatorTermsApproved?: boolean;
  hotelPlacementApproved?: boolean;
  operatorPickupProfiles?: Record<string, OperatorHotelPickupRule>;
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
    demoStatusLabel: "DEMO PRESET — Pending Operator Terms & Hotel Approval",
    placementApprovalStatus: "pending_operator_terms_and_hotel_approval",
    operatorTermsApproved: false,
    hotelPlacementApproved: false,
    defaultPlacementId: "nola-hotel-monteleone-demo-pilot",
    approvedTourIds: [
      "dcc:tour:viator:15200P6",
      "dcc:tour:viator:6953SWAMPTRANS",
      "dcc:tour:viator:6455NOLAAIR",
      "dcc:tour:fh:jeanlafitteswamptour:763318",
      "dcc:tour:viator:3780AIRBOAT",
      "dcc:tour:viator:3780SWAMP",
      "dcc:tour:viator:3780STEAM",
    ],
    approvedCategories: [
      "Swamp & Bayou",
      "Music & Riverboat Cruises",
      "Ghost, History & Walking",
      "Food, Drink & Culture",
    ],
    operatorPickupProfiles: {
      "airboat-adventures": {
        operatorCode: "airboat-adventures",
        operatorName: "Airboat Adventures",
        tourIds: ["dcc:tour:viator:6455NOLAAIR"],
        publishedPickupWindowLeadMinutes: 75,
        roundTripShuttleFeePerPersonUsd: 30,
        pickupWindowRuleSummary:
          "Airboat Adventures published pickup window begins 1 hour and 15 minutes (75 minutes) prior to tour time; guests must wait outside 214 Royal St for the entire pickup window (+$30/person roundtrip). Recorded strictly separately from Jean Lafitte.",
        namedStopForProperty: "Monteleone — 214 Royal St",
        pickupStatusForProperty: "confirmed_named_stop",
        sourceUrl: "https://airboatadventures.com/pickup-locations/",
        checkedOn: "2026-11-06",
      },
      "jean-lafitte-swamp-tours": {
        operatorCode: "jeanlafitteswamptour",
        operatorName: "Jean Lafitte Swamp Tours",
        tourIds: ["dcc:tour:fh:jeanlafitteswamptour:763318"],
        publishedPickupWindowLeadMinutes: 45,
        roundTripShuttleFeePerPersonUsd: 30,
        pickupWindowRuleSummary:
          "Jean Lafitte Swamp Tour (FareHarbor item 763318, pickup option #22056428) uses a 45-minute pre-tour hotel shuttle pickup allowance at 214 Royal St (+$30/person roundtrip; FareHarbor ASN commission pending operator activation). Recorded strictly separately from Airboat Adventures.",
        namedStopForProperty:
          "Hotel Monteleone (214 Royal St, French Quarter — FareHarbor Option #22056428)",
        pickupStatusForProperty: "confirmed_named_stop",
        sourceUrl:
          "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/?asn=aktourcenter&full-items=yes",
        checkedOn: "2026-11-06",
      },
    },
    conciergeDeskNote:
      "DEMO PRESET (Pending Actual Operator Terms & Hotel Approval): Royal Street shuttle pickup zone is outside 214 Royal St. Airboat Adventures (6455NOLAAIR) pickup window begins 75 minutes prior to tour time; Jean Lafitte Swamp Tour (763318, FareHarbor option #22056428) uses a separate 45-minute pre-tour pickup schedule.",
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
      "dcc:tour:viator:15200P6",
      "dcc:tour:viator:6953SWAMPTRANS",
      "dcc:tour:viator:3780AIRBOAT",
      "dcc:tour:viator:3780SWAMP",
      "dcc:tour:viator:3780STEAM",
      "dcc:tour:viator:6455NOLAAIR",
    ],
    approvedCategories: ["Swamp & Bayou", "Music & Riverboat Cruises"],
    operatorPickupProfiles: {
      "airboat-adventures": {
        operatorCode: "airboat-adventures",
        operatorName: "Airboat Adventures",
        tourIds: ["dcc:tour:viator:6455NOLAAIR"],
        publishedPickupWindowLeadMinutes: 75,
        roundTripShuttleFeePerPersonUsd: 30,
        pickupWindowRuleSummary:
          "Airboat Adventures published pickup window begins 75 minutes prior to tour time at 'Roosevelt — 123 Baronne St' (+$30/person roundtrip).",
        namedStopForProperty: "Roosevelt — 123 Baronne St",
        pickupStatusForProperty: "confirmed_named_stop",
        sourceUrl: "https://airboatadventures.com/pickup-locations/",
        checkedOn: "2026-11-06",
      },
    },
    conciergeDeskNote:
      "Motorcoach tour pickups board at the Baronne Street porte-cochere (123 Baronne St; Airboat Adventures pickup window begins 75 minutes before tour time).",
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
    placementApprovalStatus: "unconfirmed_pickup_stop",
    approvedTourIds: [
      "dcc:tour:viator:15200P6",
      "dcc:tour:viator:6953SWAMPTRANS",
      "dcc:tour:viator:3780SWAMP",
      "dcc:tour:viator:3780AIRBOAT",
      "dcc:tour:viator:3780STEAM",
    ],
    unconfirmedPickupTourIds: [
      "dcc:tour:viator:6455NOLAAIR",
      "dcc:tour:fh:jeanlafitteswamptour:763318",
    ],
    approvedCategories: ["Swamp & Bayou", "Music & Riverboat Cruises", "Guided Sightseeing & Excursions"],
    operatorPickupProfiles: {
      "airboat-adventures": {
        operatorCode: "airboat-adventures",
        operatorName: "Airboat Adventures",
        tourIds: ["dcc:tour:viator:6455NOLAAIR"],
        publishedPickupWindowLeadMinutes: 75,
        roundTripShuttleFeePerPersonUsd: 30,
        pickupWindowRuleSummary:
          "Omni Riverfront (701 Convention Center Blvd) is NOT named on Airboat Adventures' published pickup list; pickup remains unconfirmed until the operator names the applicable stop.",
        namedStopForProperty: null,
        pickupStatusForProperty: "unconfirmed",
        sourceUrl: "https://airboatadventures.com/pickup-locations/",
        checkedOn: "2026-11-06",
      },
      "jean-lafitte-swamp-tours": {
        operatorCode: "jeanlafitteswamptour",
        operatorName: "Jean Lafitte Swamp Tours",
        tourIds: ["dcc:tour:fh:jeanlafitteswamptour:763318"],
        publishedPickupWindowLeadMinutes: 45,
        roundTripShuttleFeePerPersonUsd: 30,
        pickupWindowRuleSummary:
          "Omni Riverfront pickup is unconfirmed for Jean Lafitte 763318 until the operator names the applicable Warehouse District stop.",
        namedStopForProperty: null,
        pickupStatusForProperty: "unconfirmed",
        sourceUrl:
          "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/?asn=aktourcenter&full-items=yes",
        checkedOn: "2026-11-06",
      },
    },
    conciergeDeskNote:
      "0.3 km from Port of New Orleans Erato/Julia Street terminals. Omni Riverfront pickup for Airboat Adventures (6455NOLAAIR) and Jean Lafitte (763318) is left UNCONFIRMED until the operator names the applicable stop.",
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
