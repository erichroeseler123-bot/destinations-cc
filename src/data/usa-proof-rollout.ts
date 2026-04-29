export type RolloutScope =
  | "root"
  | "welcometotheswamp"
  | "juneauflightdeck"
  | "redrocksfastpass"
  | "shuttleya";

export type RolloutSurface = {
  scope: RolloutScope;
  path: string;
  label: string;
  corridorId?: string;
  notes?: string;
};

function createSurface(
  scope: RolloutScope,
  path: string,
  label: string,
  corridorId?: string,
  notes?: string,
): RolloutSurface {
  return { scope, path, label, corridorId, notes };
}

export const USA_PROOF_PROMOTED_SURFACES: readonly RolloutSurface[] = [
  createSurface("root", "/western-wisconsin", "Western Wisconsin Weekend Trips", "western-wisconsin"),
  createSurface("root", "/new-orleans/swamp-tours", "New Orleans Swamp Tours", "welcometotheswamp"),
  createSurface("root", "/juneau/whale-watching-tours", "Juneau Whale Watching Tours", "wta"),
  createSurface("root", "/sedona/jeep-tours", "Sedona Jeep Tours", "sedona-jeep"),
  createSurface("root", "/lake-tahoe/things-to-do", "Lake Tahoe Activities", "lake-tahoe-activities"),
  createSurface("root", "/red-rocks-transportation", "Red Rocks Transport", "partyatredrocks"),
  createSurface("root", "/denver/weed-airport-pickup", "Denver Weed Airport Pickup", "airport-420-pickup"),
  createSurface("root", "/juneau/helicopter-tours", "Juneau Helicopter Tours", "wta"),
] as const;

export const USA_PROOF_INDEXABLE_SURFACES: readonly RolloutSurface[] = [
  createSurface(
    "root",
    "/western-wisconsin/best-weekend-trip-from-twin-cities",
    "Best Weekend Trip From Twin Cities",
    "western-wisconsin",
  ),
  createSurface(
    "root",
    "/western-wisconsin/eau-claire-vs-la-crosse",
    "Eau Claire vs La Crosse",
    "western-wisconsin",
  ),
  createSurface(
    "root",
    "/western-wisconsin/best-fall-getaway",
    "Best Fall Getaway",
    "western-wisconsin",
  ),
  createSurface("root", "/denver-to-mountains", "Denver to Mountains", "denver-to-mountains"),
  createSurface("root", "/best-mountain-town-from-denver", "Best Mountain Town From Denver", "denver-to-mountains"),
  createSurface("root", "/breckenridge-vs-vail", "Breckenridge vs Vail", "denver-to-mountains"),
  createSurface(
    "root",
    "/best-day-trip-from-denver-mountains",
    "Best Day Trip From Denver Mountains",
    "denver-to-mountains",
  ),
  createSurface("root", "/estes-park-vs-idaho-springs", "Estes Park vs Idaho Springs", "denver-to-mountains"),
  createSurface("root", "/mighty-argo-shuttle", "Mighty Argo Shuttle", "argo-day-transport"),
  createSurface("welcometotheswamp", "/plan", "Plan", "welcometotheswamp"),
  createSurface("welcometotheswamp", "/airboat-vs-boat", "Airboat vs Boat", "welcometotheswamp"),
  createSurface("welcometotheswamp", "/with-kids", "With Kids", "welcometotheswamp"),
  createSurface("welcometotheswamp", "/best-time", "Best Time", "welcometotheswamp"),
  createSurface("welcometotheswamp", "/worth-it", "Worth It", "welcometotheswamp"),
  createSurface("welcometotheswamp", "/transportation", "Transportation", "welcometotheswamp"),
  createSurface("juneauflightdeck", "/tours/helicopter-glacier-landing", "Helicopter Glacier Landing", "wta"),
  createSurface("juneauflightdeck", "/tours/icefield-flightseeing", "Icefield Flightseeing", "wta"),
] as const;

export const USA_PROOF_LIVE_UNPROMOTED_SURFACES: readonly RolloutSurface[] = [
  createSurface("root", "/book", "Root book utility"),
  createSurface("root", "/checkout", "Root checkout utility"),
  createSurface("root", "/track", "Root tracking utility"),
  createSurface("root", "/red-rocks/status", "Red Rocks status utility"),
  createSurface("welcometotheswamp", "/choose-the-right-tour", "Choose the Right Tour alias"),
  createSurface("welcometotheswamp", "/live-options", "Live Options alias"),
  createSurface("welcometotheswamp", "/start-here", "Start Here alias"),
  createSurface("welcometotheswamp", "/from-new-orleans", "From New Orleans alias"),
  createSurface("welcometotheswamp", "/plan-your-day", "Plan Your Day alias"),
  createSurface("welcometotheswamp", "/what-its-like", "What It's Like alias"),
  createSurface("redrocksfastpass", "/checkout", "Fast Pass checkout utility"),
  createSurface("redrocksfastpass", "/handoff/dcc", "Fast Pass DCC handoff utility"),
  createSurface("redrocksfastpass", "/handoff/partner/partyatredrocks", "Fast Pass partner handoff utility"),
  createSurface("redrocksfastpass", "/handoff/return", "Fast Pass return utility"),
] as const;

export const USA_PROOF_MEASURE_FIRST_SURFACES: readonly RolloutSurface[] = [
  createSurface("root", "/western-wisconsin", "Western Wisconsin Weekend Trips", "western-wisconsin"),
  createSurface(
    "root",
    "/western-wisconsin/eau-claire-vs-la-crosse",
    "Eau Claire vs La Crosse",
    "western-wisconsin",
  ),
  createSurface(
    "root",
    "/western-wisconsin/best-weekend-trip-from-twin-cities",
    "Best Weekend Trip From Twin Cities",
    "western-wisconsin",
  ),
  createSurface("root", "/new-orleans/swamp-tours", "New Orleans Swamp Tours", "welcometotheswamp"),
  createSurface("welcometotheswamp", "/airboat-vs-boat", "Airboat vs Boat", "welcometotheswamp"),
  createSurface("welcometotheswamp", "/with-kids", "With Kids", "welcometotheswamp"),
  createSurface("root", "/juneau/whale-watching-tours", "Juneau Whale Watching Tours", "wta"),
  createSurface("juneauflightdeck", "/", "Juneau Flight Deck", "wta"),
  createSurface("root", "/sedona/jeep-tours", "Sedona Jeep Tours", "sedona-jeep"),
  createSurface("root", "/lake-tahoe/things-to-do", "Lake Tahoe Activities", "lake-tahoe-activities"),
  createSurface("root", "/mighty-argo-shuttle", "Mighty Argo Shuttle", "argo-day-transport"),
] as const;

export const USA_PROOF_MEASURE_FIRST_CORRIDOR_IDS = Array.from(
  new Set(
    USA_PROOF_MEASURE_FIRST_SURFACES.map((surface) => surface.corridorId).filter(
      (value): value is string => Boolean(value),
    ),
  ),
);

export const USA_PROOF_MEASURE_FIRST_ROOT_PATHS = Array.from(
  new Set(
    USA_PROOF_MEASURE_FIRST_SURFACES.filter((surface) => surface.scope === "root").map(
      (surface) => surface.path,
    ),
  ),
);
