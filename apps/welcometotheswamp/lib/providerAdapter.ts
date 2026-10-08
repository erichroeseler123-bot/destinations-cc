/**
 * Provider Adapter Layer for Welcome to the Swamp.
 * Defines interfaces, operator catalog, and adapters for Viator,
 * GetYourGuide, and connected direct Louisiana airboat operators.
 */

export interface TourDeparture {
  id: string;
  provider: "viator" | "getyourguide" | "direct_operator";
  productCode: string;
  optionCode: string;
  operatorName: string;
  title: string;
  boatType: "small_airboat" | "large_airboat" | "covered_boat";
  transportation: "hotel_pickup" | "self_drive";
  departureTime: string;      // e.g. "12:00"
  departureTimeDisplay: string; // e.g. "12:00 PM"
  dockArrivalTimeDisplay: string; // e.g. "11:30 AM"
  pickupWindowDisplay?: string; // e.g. "10:30 AM - 10:45 AM"
  minChildAge: number;        // Age restriction for this vessel type
  maxPartySize: number;
  pricePerAdult: number;
  pricePerChild: number;
  totalPrice: number;
  currency: string;
  availabilityType: "live_inventory" | "scheduled_departure";
  availabilityStatusText: string; // e.g. "Live availability checked 10:15 AM CT" or "Scheduled departure—confirm seats"
  available: boolean;
  bookingUrl: string;
  checkedAt: string;
}

export interface ProviderCheckResult {
  providerName: string;
  status: "checked" | "unreachable" | "disabled";
  departures: TourDeparture[];
  error?: string;
}

export interface SearchParams {
  travelDate: string; // YYYY-MM-DD
  adults: number;
  childrenAges: number[];
  transportation: "hotel_pickup" | "self_drive" | "either";
  boatType?: "small_airboat" | "large_airboat" | "any";
  preferredTimeWindow?: "any" | "morning" | "afternoon";
}

/**
 * Standard airboat operator departures and specifications for the New Orleans basin.
 * Used for schedule evaluation and fallback direct booking links.
 */
export interface CuratedSwampTour {
  productCode: string;
  optionCode: string;
  operatorName: string;
  title: string;
  boatType: "small_airboat" | "large_airboat" | "covered_boat";
  transportation: "hotel_pickup" | "self_drive";
  departureTimes: string[]; // ["09:45", "12:00", "14:15", "16:30"]
  minChildAge: number;
  maxCapacity: number;
  pricePerAdult: number;
  pricePerChild: number;
  dockDriveMinutes: number;
  pickupLeadMinutes: number;
  bookingCutoffMinutes: number;
  bookingUrl: string;
}

export const CURATED_SWAMP_CATALOG: CuratedSwampTour[] = [
  {
    productCode: "RAGIN_CAJUN_SMALL_DRIVE",
    optionCode: "SMALL_DRIVE",
    operatorName: "Ragin Cajun Airboat Tours",
    title: "Standard Airboat Tour (Up to 10 Passengers) - Drive Yourself",
    boatType: "small_airboat",
    transportation: "self_drive",
    departureTimes: ["10:00", "12:00", "14:00", "16:00"],
    minChildAge: 5,
    maxCapacity: 10,
    pricePerAdult: 85,
    pricePerChild: 85,
    dockDriveMinutes: 35,
    pickupLeadMinutes: 0,
    bookingCutoffMinutes: 60,
    bookingUrl: "https://welcometotheswamp.com/tours/airboat-tour",
  },
  {
    productCode: "RAGIN_CAJUN_SMALL_PICKUP",
    optionCode: "SMALL_PICKUP",
    operatorName: "Ragin Cajun Airboat Tours",
    title: "Standard Airboat Tour (Up to 10 Passengers) - Hotel Pickup",
    boatType: "small_airboat",
    transportation: "hotel_pickup",
    departureTimes: ["10:00", "12:00", "14:00", "16:00"],
    minChildAge: 5,
    maxCapacity: 10,
    pricePerAdult: 110,
    pricePerChild: 110,
    dockDriveMinutes: 35,
    pickupLeadMinutes: 75,
    bookingCutoffMinutes: 120,
    bookingUrl: "https://welcometotheswamp.com/tours/airboat-tour",
  },
  {
    productCode: "AIRBOAT_ADV_LARGE_DRIVE",
    optionCode: "LARGE_DRIVE",
    operatorName: "Airboat Adventures",
    title: "Large Airboat Tour (15–30 Passengers) - Meet at Dock",
    boatType: "large_airboat",
    transportation: "self_drive",
    departureTimes: ["09:45", "12:00", "14:15", "16:30"],
    minChildAge: 2,
    maxCapacity: 25,
    pricePerAdult: 65,
    pricePerChild: 45,
    dockDriveMinutes: 40,
    pickupLeadMinutes: 0,
    bookingCutoffMinutes: 45,
    bookingUrl: "https://www.viator.com/tours/New-Orleans/New-Orleans-Airboat-Tour/d675-112604P2",
  },
  {
    productCode: "AIRBOAT_ADV_LARGE_PICKUP",
    optionCode: "LARGE_PICKUP",
    operatorName: "Airboat Adventures",
    title: "Large Airboat Tour with Downtown / French Quarter Pickup",
    boatType: "large_airboat",
    transportation: "hotel_pickup",
    departureTimes: ["09:45", "12:00", "14:15"],
    minChildAge: 2,
    maxCapacity: 25,
    pricePerAdult: 95,
    pricePerChild: 75,
    dockDriveMinutes: 40,
    pickupLeadMinutes: 80,
    bookingCutoffMinutes: 120,
    bookingUrl: "https://www.viator.com/tours/New-Orleans/New-Orleans-Airboat-Tour/d675-112604P2",
  },
  {
    productCode: "JEAN_LAFITTE_AIRBOAT_DRIVE",
    optionCode: "SMALL_DRIVE",
    operatorName: "Jean Lafitte Swamp & Airboat Tours",
    title: "Jean Lafitte High-Speed Airboat - Dock Check-in",
    boatType: "small_airboat",
    transportation: "self_drive",
    departureTimes: ["10:00", "12:15", "14:30"],
    minChildAge: 5,
    maxCapacity: 8,
    pricePerAdult: 99,
    pricePerChild: 89,
    dockDriveMinutes: 40,
    pickupLeadMinutes: 0,
    bookingCutoffMinutes: 60,
    bookingUrl: "https://www.viator.com/tours/New-Orleans/Airboat-Swamp-Tour-at-Jean-Lafitte-Historical-Park/d675-2244P1",
  },
];
