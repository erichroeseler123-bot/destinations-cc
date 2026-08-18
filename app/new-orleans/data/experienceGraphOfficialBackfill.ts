import type { Fact, TimeRange, WnoExperienceGraphRecord } from "./experienceGraphV2";
import { TOUR_INTELLIGENCE } from "./tourIntelligence";

const REVIEWED_AT = "2026-08-17";

function operator<T>(value: T, note: string): Fact<T> {
  return { value, source: "operator", confidence: "verified", reviewedAt: REVIEWED_AT, note };
}

function editorial<T>(value: T, note?: string): Fact<T> {
  return { value, source: "editorial", confidence: "inferred", reviewedAt: REVIEWED_AT, note };
}

function unknown<T>(note = "Needs operator or authoritative source verification."): Fact<T> {
  return { value: null, source: "unknown", confidence: "unverified", reviewedAt: null, note };
}

function minutes(typical: number): TimeRange { return { min: null, typical, max: null }; }
function range(min: number | null, typical: number | null, max: number | null): TimeRange { return { min, typical, max }; }

function base(slug: string) {
  const intelligence = TOUR_INTELLIGENCE[slug];
  if (!intelligence) throw new Error(`Missing WNO tour intelligence for ${slug}`);
  return {
    slug,
    operator: intelligence.operator,
    experienceType: intelligence.experienceType,
    verificationStatus: "PARTIAL" as const,
  };
}

function blank(slug: string, format: WnoExperienceGraphRecord["format"]): WnoExperienceGraphRecord {
  const intelligence = TOUR_INTELLIGENCE[slug];
  return {
    ...base(slug),
    format,
    activityMinutes: unknown<TimeRange>(),
    doorToDoorWithPickupMinutes: unknown<TimeRange>(),
    doorToDoorSelfDriveMinutes: unknown<TimeRange>(),
    pickupFrenchQuarter: unknown<boolean>(),
    pickupCitywide: unknown<boolean>(),
    selfDriveAvailable: unknown<boolean>(),
    physicalIntensity: unknown<"low" | "moderate" | "high">(),
    shadeCoverage: unknown<"full" | "partial" | "none">(),
    heatExposure: unknown<"climate_controlled" | "shaded" | "exposed">(),
    rainExposure: unknown<"indoor" | "covered" | "exposed" | "mixed">(),
    noiseLevel: unknown<"quiet" | "moderate" | "loud">(),
    stairsRequired: unknown<boolean>(),
    bathroomAccess: unknown<"frequent" | "limited" | "none">(),
    minimumAge: unknown<number>(),
    maximumGroupSize: unknown<number>(),
    historyFocus: unknown<"slavery_centered" | "architecture_landscape" | "general" | "low">(),
    wildlifeLikelihood: unknown<"high" | "moderate" | "low">(),
    thrillIntensity: unknown<"calm" | "moderate" | "high">(),
    romanceIndex: unknown<"low" | "moderate" | "high">(),
    mealIncluded: unknown<boolean>(),
    alcoholEmphasis: unknown<boolean>(),
    bestFor: intelligence.decision.bestFor,
    avoidIf: [],
    tradeOff: null,
    alternativeSlug: null,
    constraints: [],
  };
}

const sunday = blank("sunday-jazz-brunch-cruise", operator("river_cruise", "Gray Line currently publishes the Sunday Jazz Cruise with Brunch aboard Steamboat NATCHEZ."));
sunday.activityMinutes = operator(minutes(150), "Gray Line currently lists the brunch product at 2 hours 30 minutes.");
sunday.doorToDoorSelfDriveMinutes = operator(minutes(180), "Official duration is 2h30 and guests are instructed to allow extra check-in/boarding time; WNO uses 3 hours as a planning commitment, not a guaranteed return time.");
sunday.pickupFrenchQuarter = operator(false, "Official meeting point is 400 Toulouse Street rather than hotel pickup.");
sunday.pickupCitywide = operator(false, "Official product uses a fixed riverfront meeting point.");
sunday.selfDriveAvailable = operator(true, "Guests travel independently to the published meeting point.");
sunday.physicalIntensity = editorial("low");
sunday.shadeCoverage = operator("partial", "Official vessel experience includes indoor and outdoor areas.");
sunday.heatExposure = editorial("shaded");
sunday.rainExposure = editorial("mixed");
sunday.noiseLevel = editorial("moderate", "Live jazz and normal vessel/dining activity.");
sunday.minimumAge = operator(0, "Gray Line lists the product as all ages.");
sunday.historyFocus = editorial("general");
sunday.wildlifeLikelihood = editorial("low");
sunday.thrillIntensity = editorial("calm");
sunday.romanceIndex = editorial("moderate");
sunday.mealIncluded = operator(true, "Creole brunch buffet is included on the brunch product.");
sunday.alcoholEmphasis = operator(false, "Alcohol is available for purchase but is not the core experience.");
sunday.tradeOff = "Brunch and jazz make this an easy all-in-one Sunday plan, but the fixed cruise schedule gives you less flexibility than an untimed activity.";
sunday.alternativeSlug = "daytime-jazz-cruise";

const oak = blank("oak-alley-plantation-tour-grey-line", operator("plantation", "Gray Line currently publishes Oak Alley Plantation as a dedicated round-trip excursion."));
oak.activityMinutes = operator(minutes(325), "Gray Line currently lists the excursion at 5 hours 25 minutes.");
oak.doorToDoorWithPickupMinutes = operator(minutes(325), "This product is a 5h25 round trip from Gray Line's fixed New Orleans meeting point; this is not hotel pickup.");
oak.pickupFrenchQuarter = operator(false, "Official meeting point is 400 Toulouse Street.");
oak.pickupCitywide = operator(false, "Official product uses a fixed meeting point.");
oak.selfDriveAvailable = operator(false, "This WNO product is the Gray Line transportation-inclusive excursion, not standalone admission.");
oak.physicalIntensity = operator("moderate", "Gray Line says walking the grounds is integral to the experience.");
oak.rainExposure = editorial("mixed");
oak.heatExposure = editorial("exposed");
oak.noiseLevel = editorial("quiet");
oak.stairsRequired = operator(true, "When open, second-floor access in the Big House is by stairs only; a video alternative is described for guests unable to climb them.");
oak.minimumAge = operator(0, "Gray Line lists the Oak Alley excursion as all ages.");
oak.historyFocus = editorial("architecture_landscape", "Oak Alley interpretation includes both the iconic landscape/home and the complex history of free and enslaved former inhabitants.");
oak.wildlifeLikelihood = editorial("low");
oak.thrillIntensity = editorial("calm");
oak.romanceIndex = editorial("low");
oak.mealIncluded = editorial(false);
oak.alcoholEmphasis = editorial(false);
oak.tradeOff = "The iconic grounds and architecture are the draw; the outing still consumes more than five hours door to door from the New Orleans meeting point.";
oak.alternativeSlug = "whitney-plantation-tour";

const swamp = blank("swamp-bayou-tour", operator("covered_boat", "Gray Line currently describes a custom-built pontoon swamp boat reached by motorcoach from New Orleans."));
swamp.activityMinutes = operator(minutes(225), "Gray Line currently lists the transportation-inclusive tour at 3 hours 45 minutes.");
swamp.doorToDoorWithPickupMinutes = operator(minutes(225), "The 3h45 listing includes the operator's New Orleans transportation format from its meeting point, not hotel pickup.");
swamp.pickupFrenchQuarter = operator(false, "Official meeting point is 400 Toulouse Street.");
swamp.pickupCitywide = operator(false, "Official product uses a fixed New Orleans meeting point.");
swamp.selfDriveAvailable = unknown("Gray Line separately publishes a self-drive flat-boat product; this WNO slug represents the transportation-inclusive product.");
swamp.physicalIntensity = editorial("low");
swamp.shadeCoverage = operator("partial", "Gray Line describes its swamp boats as covered.");
swamp.heatExposure = editorial("shaded");
swamp.rainExposure = operator("covered", "Gray Line states swamp boats are covered and tours operate rain or shine except extreme weather.");
swamp.noiseLevel = editorial("moderate");
swamp.minimumAge = operator(0, "Gray Line lists this tour as all ages.");
swamp.historyFocus = editorial("low");
swamp.wildlifeLikelihood = unknown("Wildlife is a core subject of the tour, but sightings are variable and are not treated as guaranteed.");
swamp.thrillIntensity = editorial("calm");
swamp.romanceIndex = editorial("low");
swamp.mealIncluded = editorial(false);
swamp.alcoholEmphasis = editorial(false);
swamp.tradeOff = "This is the calmer, covered swamp format; choose an airboat instead if speed and adrenaline matter more than comfort.";
swamp.alternativeSlug = "small-airboat-swamp-adventure";

function airboat(slug: "small-airboat-swamp-adventure" | "large-airboat-swamp-adventure", capacity: TimeRange) {
  const rec = blank(slug, operator("airboat", `Gray Line currently publishes the ${slug.startsWith("small") ? "small" : "large"} airboat as a high-speed swamp experience.`));
  rec.activityMinutes = operator(minutes(225), "Gray Line currently lists the transportation-inclusive airboat product at 3 hours 45 minutes.");
  rec.doorToDoorWithPickupMinutes = operator(minutes(225), "The listed 3h45 product includes round-trip transportation from Gray Line's fixed New Orleans meeting point.");
  rec.pickupFrenchQuarter = operator(false, "Official meeting point is 400 Toulouse Street.");
  rec.pickupCitywide = operator(false, "Official product uses a fixed meeting point.");
  rec.selfDriveAvailable = unknown("Gray Line also publishes separate self-drive airboat products; this WNO slug represents the transportation-inclusive tour.");
  rec.physicalIntensity = editorial("low", "Riding-focused, but boarding and health restrictions matter.");
  rec.shadeCoverage = editorial("none");
  rec.heatExposure = editorial("exposed");
  rec.rainExposure = operator("exposed", "Gray Line warns guests they may get wet and may alter the tour in inclement weather.");
  rec.noiseLevel = editorial("loud");
  rec.minimumAge = operator(5, "Gray Line lists a minimum age of 5.");
  rec.maximumGroupSize = operator(capacity.max || 0, `Gray Line currently lists capacity as ${capacity.min}-${capacity.max} passengers.`);
  rec.historyFocus = editorial("low");
  rec.wildlifeLikelihood = unknown("Wildlife viewing is central but sightings remain variable.");
  rec.thrillIntensity = editorial("high");
  rec.romanceIndex = editorial("low");
  rec.mealIncluded = operator(false, "Gray Line states food and drinks are not included.");
  rec.alcoholEmphasis = editorial(false);
  rec.avoidIf = ["Anyone in the party is under 5", "Someone is pregnant", "Someone has neck or back problems", "Someone has a heart condition", "You need wheelchair or stroller accessibility"];
  rec.tradeOff = slug.startsWith("small") ? "The smaller boat gives a more intimate high-speed format at a higher price." : "The larger boat lowers the price but gives you a less intimate group format.";
  rec.alternativeSlug = slug.startsWith("small") ? "large-airboat-swamp-adventure" : "small-airboat-swamp-adventure";
  rec.constraints = [
    { key: "minimum_age", severity: "hard", label: "Age eligibility", reason: "Gray Line lists a minimum age of 5 for this airboat tour." },
    { key: "pregnancy", severity: "hard", label: "Pregnancy", reason: "Gray Line says the tour is not recommended for pregnant travelers." },
    { key: "neck_back", severity: "hard", label: "Neck/back conditions", reason: "Gray Line says the tour is not recommended for people with neck or back problems." },
    { key: "heart", severity: "hard", label: "Heart conditions", reason: "Gray Line says the tour is not recommended for people with heart conditions." },
  ];
  return rec;
}
const smallAirboat = airboat("small-airboat-swamp-adventure", range(6, null, 12));
const largeAirboat = airboat("large-airboat-swamp-adventure", range(15, null, 27));

function plantationSwampCombo(slug: "swamp-boat-oak-alley-combo" | "swamp-boat-whitney-combo", history: "slavery_centered" | "architecture_landscape") {
  const rec = blank(slug, operator("combination", `Gray Line currently publishes this as a swamp boat plus ${slug.includes("whitney") ? "Whitney" : "Oak Alley"} Plantation combination.`));
  rec.activityMinutes = operator(minutes(465), "Gray Line currently lists the full combination at 7 hours 45 minutes.");
  rec.doorToDoorWithPickupMinutes = operator(minutes(465), "The published 7h45 format begins at Gray Line's fixed New Orleans meeting point.");
  rec.pickupFrenchQuarter = operator(false, "Official meeting point is 400 Toulouse Street.");
  rec.pickupCitywide = operator(false, "Official combination uses a fixed meeting point.");
  rec.selfDriveAvailable = operator(false, "This WNO combination is sold as a transportation-inclusive excursion.");
  rec.physicalIntensity = editorial("moderate");
  rec.shadeCoverage = editorial("partial");
  rec.heatExposure = editorial("exposed");
  rec.rainExposure = operator("mixed", "Gray Line says the swamp boat is covered and operates in rain; plantation portions include outdoor grounds.");
  rec.noiseLevel = editorial("moderate");
  rec.minimumAge = operator(0, "Gray Line currently lists the combination as all ages.");
  rec.historyFocus = editorial(history);
  rec.wildlifeLikelihood = unknown("Wildlife sightings are variable and are not guaranteed.");
  rec.thrillIntensity = editorial("calm");
  rec.romanceIndex = editorial("low");
  rec.mealIncluded = editorial(false);
  rec.alcoholEmphasis = editorial(false);
  rec.avoidIf = ["You have less than a full day available"];
  rec.tradeOff = "You cover two major experience types in one booking, but the trade-off is an almost eight-hour commitment.";
  rec.alternativeSlug = slug.includes("whitney") ? "whitney-plantation-tour" : "oak-alley-plantation-tour-grey-line";
  return rec;
}
const oakSwamp = plantationSwampCombo("swamp-boat-oak-alley-combo", "architecture_landscape");
const whitneySwamp = plantationSwampCombo("swamp-boat-whitney-combo", "slavery_centered");

function cocktail(slug: "cocktail-walking-tour" | "craft-cocktail-walking-tour", upgraded: boolean) {
  const rec = blank(slug, operator("walking", `Gray Line currently publishes this as a ${upgraded ? "2.5-hour upgraded " : "2-hour "}French Quarter craft cocktail walking tour.`));
  rec.activityMinutes = operator(minutes(upgraded ? 150 : 120), `Gray Line currently lists this variant at ${upgraded ? "2 hours 30 minutes" : "2 hours"}.`);
  rec.doorToDoorSelfDriveMinutes = operator(minutes(upgraded ? 165 : 135), "WNO planning commitment adds the operator-required 15-minute pre-tour check-in to the published tour duration.");
  rec.pickupFrenchQuarter = operator(false, "Official meeting point is 400 Toulouse Street and Gray Line encourages guests to walk there from downtown hotels.");
  rec.pickupCitywide = operator(false, "This is a walking tour with a fixed meeting point.");
  rec.selfDriveAvailable = operator(true, "Guests reach the meeting point independently.");
  rec.physicalIntensity = editorial("moderate");
  rec.shadeCoverage = editorial("partial");
  rec.heatExposure = editorial("exposed");
  rec.rainExposure = editorial("mixed");
  rec.noiseLevel = editorial("moderate");
  rec.minimumAge = operator(21, "Gray Line requires guests to be 21+.");
  rec.historyFocus = editorial("general");
  rec.wildlifeLikelihood = editorial("low");
  rec.thrillIntensity = editorial("calm");
  rec.romanceIndex = editorial("moderate");
  rec.mealIncluded = operator(false, "This is not a meal-included tour.");
  rec.alcoholEmphasis = operator(true, upgraded ? "Gray Line includes three full cocktails on the upgraded product." : "Gray Line includes one cocktail on the base product and offers additional cocktails for purchase.");
  rec.avoidIf = ["Anyone in the party is under 21", "You need a fully wheelchair-accessible route without alternate arrangements"];
  rec.tradeOff = upgraded ? "You get more included cocktails and a longer format, but the price and time commitment are higher." : "The shorter base version is cheaper and faster, but includes fewer drinks and less time at stops.";
  rec.alternativeSlug = upgraded ? "cocktail-walking-tour" : "craft-cocktail-walking-tour";
  rec.constraints = [{ key: "minimum_age", severity: "hard", label: "Age eligibility", reason: "Gray Line requires guests to be 21 or older for this cocktail tour." }];
  return rec;
}
const cocktailBase = cocktail("cocktail-walking-tour", false);
const cocktailUpgraded = cocktail("craft-cocktail-walking-tour", true);

const ghosts = blank("ghosts-spirits-walking-tour", operator("walking", "Gray Line currently publishes this as a two-hour French Quarter walking tour."));
ghosts.activityMinutes = operator(minutes(120), "Gray Line currently lists the tour at 2 hours.");
ghosts.doorToDoorSelfDriveMinutes = operator(minutes(135), "WNO planning commitment adds the operator-required 15-minute check-in.");
ghosts.pickupFrenchQuarter = operator(false, "Official meeting point is 400 Toulouse Street.");
ghosts.pickupCitywide = operator(false, "This is a walking tour with a fixed meeting point.");
ghosts.selfDriveAvailable = operator(true, "Guests reach the meeting point independently.");
ghosts.physicalIntensity = editorial("moderate");
ghosts.heatExposure = editorial("exposed");
ghosts.rainExposure = editorial("exposed");
ghosts.noiseLevel = editorial("moderate");
ghosts.minimumAge = operator(0, "Gray Line currently lists the tour as all ages; children must be accompanied by an adult.");
ghosts.historyFocus = editorial("general");
ghosts.wildlifeLikelihood = editorial("low");
ghosts.thrillIntensity = editorial("moderate");
ghosts.romanceIndex = editorial("low");
ghosts.mealIncluded = operator(false, "No meal is listed as included.");
ghosts.alcoholEmphasis = editorial(false);
ghosts.avoidIf = ["Uneven sidewalks and streets are a major mobility barrier for your group"];
ghosts.tradeOff = "The format is easy to fit into an evening, but it is still an outdoor walking tour on uneven historic streets.";
ghosts.alternativeSlug = "craft-cocktail-walking-tour";

const garden = blank("city-cemetery-garden-district-tour", operator("bus_tour", "Gray Line currently publishes a three-hour motorcoach city/cemetery tour with a guided Garden District stroll."));
garden.activityMinutes = operator(minutes(180), "Gray Line currently lists the tour at 3 hours.");
garden.doorToDoorSelfDriveMinutes = operator(minutes(195), "WNO planning commitment adds the operator-required 15-minute check-in.");
garden.pickupFrenchQuarter = operator(false, "Official meeting point is 400 Toulouse Street.");
garden.pickupCitywide = operator(false, "Official tour uses a fixed meeting point.");
garden.selfDriveAvailable = operator(true, "Guests reach the meeting point independently before boarding the tour vehicle.");
garden.physicalIntensity = editorial("moderate", "Bus sightseeing is combined with a guided Garden District walk.");
garden.shadeCoverage = editorial("partial");
garden.heatExposure = editorial("shaded");
garden.rainExposure = editorial("mixed");
garden.noiseLevel = editorial("quiet");
garden.bathroomAccess = operator("frequent", "Gray Line identifies a wheelchair-accessible bathroom at the City Park Cafe du Monde stop.");
garden.minimumAge = operator(6, "Gray Line currently lists the tour for ages 6+.");
garden.historyFocus = editorial("general");
garden.wildlifeLikelihood = editorial("low");
garden.thrillIntensity = editorial("calm");
garden.romanceIndex = editorial("moderate");
garden.mealIncluded = operator(false, "Food and drinks are not included.");
garden.alcoholEmphasis = editorial(false);
garden.avoidIf = ["Your group cannot manage uneven Garden District sidewalks and does not want to remain on the bus for that stop"];
garden.tradeOff = "You get broad city context plus a real Garden District walk, but the three-hour format covers a lot of ground rather than going deep in one neighborhood.";
garden.alternativeSlug = "city-tour-of-new-orleans";

const cityRiverboat = blank("city-of-new-orleans-riverboat-cruise", operator("river_cruise", "Gray Line publishes CITY of NEW ORLEANS sightseeing cruises with live narration and indoor/outdoor seating."));
cityRiverboat.activityMinutes = operator(minutes(75), "The WNO official-facts registry records the 75-minute CITY of NEW ORLEANS sightseeing product.");
cityRiverboat.doorToDoorSelfDriveMinutes = operator(minutes(105), "Official guidance asks guests to arrive 30 minutes before the 75-minute cruise.");
cityRiverboat.pickupFrenchQuarter = operator(false, "Official meeting point is 101 Saint Louis Street rather than hotel pickup.");
cityRiverboat.pickupCitywide = operator(false, "This product uses a fixed riverfront meeting point.");
cityRiverboat.selfDriveAvailable = operator(true, "Guests reach the published meeting point independently.");
cityRiverboat.physicalIntensity = editorial("low");
cityRiverboat.shadeCoverage = operator("partial", "Official product describes indoor and outdoor seating.");
cityRiverboat.heatExposure = editorial("shaded");
cityRiverboat.rainExposure = editorial("mixed");
cityRiverboat.noiseLevel = editorial("moderate");
cityRiverboat.stairsRequired = operator(true, "The official WNO fact registry notes top-deck access by stairs only.");
cityRiverboat.minimumAge = operator(0, "Current Gray Line CITY of NEW ORLEANS cruise products are listed as all ages.");
cityRiverboat.historyFocus = editorial("general");
cityRiverboat.wildlifeLikelihood = editorial("low");
cityRiverboat.thrillIntensity = editorial("calm");
cityRiverboat.romanceIndex = editorial("moderate");
cityRiverboat.mealIncluded = editorial(false);
cityRiverboat.alcoholEmphasis = editorial(false);
cityRiverboat.tradeOff = "This is the shortest river option in the storefront, which makes it easy to schedule but less immersive than the longer jazz cruises.";
cityRiverboat.alternativeSlug = "daytime-jazz-cruise";

const southernPlantation = blank("oak-alley-or-laura-plantation-tour", operator("plantation", "Southern Style currently publishes a transported Oak Alley-or-Laura Plantation tour from New Orleans."));
southernPlantation.activityMinutes = operator(minutes(240), "Southern Style describes the plantation visit as a 4-hour tour.");
southernPlantation.doorToDoorWithPickupMinutes = operator(minutes(330), "Southern Style currently publishes pickup at 8:00 a.m. and return around 1:30 p.m.; this is the complete planning commitment WNO uses.");
southernPlantation.pickupFrenchQuarter = unknown("Hotel pickup is part of Southern Style's operating model, but the exact eligible boundary is not explicit on the current plantation page.");
southernPlantation.pickupCitywide = unknown("Exact hotel-pickup geography still needs verification.");
southernPlantation.selfDriveAvailable = operator(false, "This WNO product represents Southern Style's transported New Orleans excursion rather than standalone plantation admission.");
southernPlantation.physicalIntensity = editorial("moderate");
southernPlantation.heatExposure = editorial("exposed");
southernPlantation.rainExposure = editorial("mixed");
southernPlantation.noiseLevel = editorial("quiet");
southernPlantation.minimumAge = unknown("Southern Style publishes child pricing but no current minimum age on the public plantation page.");
southernPlantation.historyFocus = editorial("general", "The selected site may be Oak Alley or Laura, so WNO does not assign one narrower interpretation focus to both.");
southernPlantation.wildlifeLikelihood = editorial("low");
southernPlantation.thrillIntensity = editorial("calm");
southernPlantation.romanceIndex = editorial("low");
southernPlantation.mealIncluded = unknown();
southernPlantation.alcoholEmphasis = editorial(false);
southernPlantation.avoidIf = ["You have less than about five and a half hours available", "You need the exact plantation known before checkout"];
southernPlantation.tradeOff = "You get transportation and a historic-site excursion in one booking, but the selected plantation and complete outing consume most of a day block.";
southernPlantation.alternativeSlug = "whitney-plantation-tour";

const southernCombo = blank("all-day-city-plantation-combo", operator("combination", "Southern Style currently publishes combo tours that let guests pick two among its city, plantation, swamp and other tour options."));
southernCombo.activityMinutes = unknown("Southern Style's current combo page says the two tours may be taken on the same day or separate days; it does not publish one authoritative fixed 8-hour duration.");
southernCombo.doorToDoorWithPickupMinutes = unknown("Current operator page does not publish one fixed total commitment for the combo.");
southernCombo.pickupFrenchQuarter = unknown("Southern Style describes hotel pickup for its component tours, but the combo page does not define a single pickup boundary.");
southernCombo.pickupCitywide = unknown();
southernCombo.selfDriveAvailable = operator(false, "The current combo page describes hotel pickup and enclosed air-conditioned bus transportation for transported components.");
southernCombo.physicalIntensity = editorial("moderate");
southernCombo.heatExposure = editorial("shaded");
southernCombo.rainExposure = editorial("mixed");
southernCombo.noiseLevel = editorial("quiet");
southernCombo.minimumAge = unknown("The current combo page does not publish one universal minimum age for all possible pairings.");
southernCombo.historyFocus = editorial("general");
southernCombo.wildlifeLikelihood = unknown("Depends on the selected second component.");
southernCombo.thrillIntensity = editorial("calm");
southernCombo.romanceIndex = editorial("low");
southernCombo.mealIncluded = unknown();
southernCombo.alcoholEmphasis = editorial(false);
southernCombo.avoidIf = ["You need a short, fixed-duration itinerary", "You need the exact two included experiences preselected before booking"];
southernCombo.tradeOff = "The flexibility to choose two experiences is useful, but there is no single current operator-published duration that safely represents every pairing.";
southernCombo.alternativeSlug = "oak-alley-or-laura-plantation-tour";

export const WNO_OFFICIAL_GRAPH_BACKFILL: Record<string, WnoExperienceGraphRecord> = {
  "sunday-jazz-brunch-cruise": sunday,
  "oak-alley-plantation-tour-grey-line": oak,
  "swamp-bayou-tour": swamp,
  "small-airboat-swamp-adventure": smallAirboat,
  "large-airboat-swamp-adventure": largeAirboat,
  "swamp-boat-oak-alley-combo": oakSwamp,
  "swamp-boat-whitney-combo": whitneySwamp,
  "cocktail-walking-tour": cocktailBase,
  "craft-cocktail-walking-tour": cocktailUpgraded,
  "ghosts-spirits-walking-tour": ghosts,
  "city-cemetery-garden-district-tour": garden,
  "city-of-new-orleans-riverboat-cruise": cityRiverboat,
  "oak-alley-or-laura-plantation-tour": southernPlantation,
  "all-day-city-plantation-combo": southernCombo,
};
