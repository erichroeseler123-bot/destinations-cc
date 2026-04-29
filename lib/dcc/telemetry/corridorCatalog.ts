export type CorridorFamily = "direct-execution" | "decision-engine" | "value-routing" | "marketplace";
export type CorridorStatus = "candidate" | "live" | "deprecated";
export type CorridorContinuityLevel = "state-execution" | "checkout-continuity";

export type CorridorCatalogEntry = {
  corridorId: string;
  corridorName: string;
  family: CorridorFamily;
  appPath: string;
  status: CorridorStatus;
  continuityLevel: CorridorContinuityLevel;
  patternFamily: "parr" | "jfd" | "swamp" | "sots" | "420" | "feastly";
};

export const LIVE_CORRIDOR_CATALOG: CorridorCatalogEntry[] = [
  {
    corridorId: "lastfrontier-alaska",
    corridorName: "Last Frontier Shore Excursions",
    family: "decision-engine",
    appPath: "external / lastfrontiershoreexcursions.com",
    status: "live",
    continuityLevel: "state-execution",
    patternFamily: "jfd",
  },
  {
    corridorId: "wta",
    corridorName: "Juneau Flight Deck",
    family: "decision-engine",
    appPath: "apps/juneauflightdeck",
    status: "live",
    continuityLevel: "state-execution",
    patternFamily: "jfd",
  },
  {
    corridorId: "sedona-jeep",
    corridorName: "Sedona Jeep Tours",
    family: "decision-engine",
    appPath: "apps/sedonajeep + app/sedona/jeep-tours",
    status: "live",
    continuityLevel: "state-execution",
    patternFamily: "jfd",
  },
  {
    corridorId: "lake-tahoe-activities",
    corridorName: "Lake Tahoe Activities",
    family: "decision-engine",
    appPath: "app/lake-tahoe/things-to-do",
    status: "live",
    continuityLevel: "state-execution",
    patternFamily: "jfd",
  },
  {
    corridorId: "welcometotheswamp",
    corridorName: "Welcome to the Swamp",
    family: "decision-engine",
    appPath: "apps/welcometotheswamp",
    status: "live",
    continuityLevel: "state-execution",
    patternFamily: "swamp",
  },
  {
    corridorId: "partyatredrocks",
    corridorName: "Party at Red Rocks",
    family: "direct-execution",
    appPath: "external / partyatredrocks",
    status: "live",
    continuityLevel: "checkout-continuity",
    patternFamily: "parr",
  },
  {
    corridorId: "lake-tahoe-transport",
    corridorName: "Lake Tahoe Transport",
    family: "direct-execution",
    appPath: "apps/laketahoe",
    status: "live",
    continuityLevel: "checkout-continuity",
    patternFamily: "parr",
  },
  {
    corridorId: "argo-day-transport",
    corridorName: "Mighty Argo Shuttle",
    family: "direct-execution",
    appPath: "app/mighty-argo-shuttle + external / shuttleya.com/book/argo-shuttle",
    status: "live",
    continuityLevel: "checkout-continuity",
    patternFamily: "420",
  },
  {
    corridorId: "airport-420-pickup",
    corridorName: "420 Airport Pickup",
    family: "direct-execution",
    appPath: "apps/420-airport-pickup",
    status: "live",
    continuityLevel: "checkout-continuity",
    patternFamily: "420",
  },
  {
    corridorId: "western-wisconsin",
    corridorName: "Western Wisconsin Weekend Trips",
    family: "decision-engine",
    appPath: "app/western-wisconsin",
    status: "live",
    continuityLevel: "state-execution",
    patternFamily: "jfd",
  },
  {
    corridorId: "denver-to-mountains",
    corridorName: "Denver to Mountains",
    family: "decision-engine",
    appPath: "app/denver-to-mountains",
    status: "live",
    continuityLevel: "state-execution",
    patternFamily: "jfd",
  },
  {
    corridorId: "feastly-dinner-night",
    corridorName: "Feastly Dinner Night",
    family: "marketplace",
    appPath: "external / feastlyspread.com",
    status: "live",
    continuityLevel: "checkout-continuity",
    patternFamily: "feastly",
  },
];

export function getCorridorCatalogEntry(corridorId: string) {
  return LIVE_CORRIDOR_CATALOG.find((entry) => entry.corridorId === corridorId) || null;
}
