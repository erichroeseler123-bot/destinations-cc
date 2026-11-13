import { getCruisePortDirectory, type CruisePortDirectoryEntry } from "@/lib/dcc/cruisePortDirectory";
import { getPortBySlug, type PortView } from "@/lib/dcc/ports";
import { getPortAuthorityConfig } from "@/src/data/port-authority-config";
import {
  MAPPED_CRUISE_PORT_EXCURSION_PROFILES,
  queryPortDayExcursionCatalog,
  resolveCruisePortExcursionProfile,
  TWO_HOUR_SHORTLIST_REQUIRED_BUFFER_MINUTES,
  type CruisePortExcursionProfile,
} from "@/lib/dcc/cruisePortExcursionCatalogEngine";

export const CRUISE_JOURNEY_INTELLIGENCE_SCHEMA = "dcc.cruise-journey-intelligence.v1" as const;
export const CANONICAL_CRUISE_RETURN_BUFFER_MINUTES = 120 as const;
export const CANONICAL_CRUISE_LEAD_RULE =
  "Available departures that match your port schedule" as const;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const SAFE_SLUG_RE = /^[a-z0-9-]+$/;
const SAFE_SHARE_CODE_RE = /^[a-zA-Z0-9_-]{6,32}$/;
const SAFE_JOURNEY_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

const TRUSTED_JOURNEY_CORS_ORIGIN_RE =
  /^https:\/\/(?:(?:www\.)?(?:cruisepromenade\.com|rollcallusa\.com|destinationcommandcenter\.com)|(?:cruisepromenade|roll-call(?:-usa)?|destinations(?:-cc)?)(?:-[a-z0-9-]+)?\.vercel\.app)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export type CruiseJourneyDockOrTender = "dock" | "tender" | "mixed";
export type CruiseExcursionBufferState =
  | "preferred"
  | "reduced_buffer"
  | "needs_verification";
export type CruiseExcursionBookingPathType = "commissionable" | "direct";

export interface OfficialPassportOrVisaLink {
  label: string;
  url: string;
  authority: string;
}

export interface CruiseSeasonalGuidance {
  region: string;
  month: number | null;
  weatherSummary: string;
  stormOrEnvironmentalWatch: string | null;
  wildlifeHighlights: string[];
  crowdingAndSchoolHolidayNote: string;
  officialPassportAndVisaLinks: OfficialPassportOrVisaLink[];
}

export interface MatchingExcursionPreviewItem {
  productCode: string;
  title: string;
  operatorName?: string;
  durationMinutes: number;
  priceFrom?: number;
  bufferState: CruiseExcursionBufferState;
  bookingPathType: CruiseExcursionBookingPathType;
}

export interface CruisePortIntelligence {
  portSlug: string;
  portName: string;
  dockOrTender: CruiseJourneyDockOrTender;
  berthSummary: string;
  distanceToTownSummary: string;
  currencyAndLanguage: string;
  recommendedReturnBufferMinutes: 120;
  replanUrl: string;
  portGuideUrl: string;
  matchingExcursionsCount: number;
  matchingExcursionsPreview: MatchingExcursionPreviewItem[];
}

export interface CruiseTurnaroundGuidance {
  homeportSlug: string;
  recommendedArrivalLead: string;
  airportTransferBufferNote: string;
  debarkFlightCutoffNote: string;
}

export interface CruiseEmergencyPlaybook {
  scenarioId: string;
  title: string;
  immediateSteps: string[];
  officialVerificationNote: string;
}

export interface CruiseJourneyIntelligenceResponse {
  ok: true;
  schema: "dcc.cruise-journey-intelligence.v1";
  generatedAt: string;
  returnBufferRuleMinutes: 120;
  leadRule: "Available departures that match your port schedule";
  seasonalGuidance: CruiseSeasonalGuidance;
  portIntelligence: CruisePortIntelligence | null;
  turnaroundGuidance: CruiseTurnaroundGuidance | null;
  emergencyAndChangePlaybooks: CruiseEmergencyPlaybook[];
}

export interface BuildCruiseJourneyIntelligenceParams {
  stage?: string | null;
  region?: string | null;
  month?: number | string | null;
  port?: string | null;
  homeport?: string | null;
  ship?: string | null;
  sailDate?: string | null;
  partySize?: number | string | null;
  shipArrival?: string | null;
  allAboard?: string | null;
}

export interface ResolvedCanonicalCruisePort {
  requestedSlug: string;
  canonicalSlug: string;
  directorySlug: string;
  name: string;
  area: string;
  country: string;
  directoryEntry: CruisePortDirectoryEntry | null;
  portView: PortView | null;
  excursionProfile: CruisePortExcursionProfile | null;
}

export function sanitizeNonPiiToken(raw: string | null | undefined, maxLen = 96): string {
  if (!raw) return "";
  const cleaned = String(raw)
    .replace(EMAIL_RE, "")
    .replace(PHONE_RE, "")
    .replace(/\b(?:cabin|stateroom|pnr|passport)\s*[:#-]?\s*[a-z0-9-]+/gi, "")
    .replace(/\bdcc_ctx_[a-z0-9_-]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, maxLen);
}

export function sanitizeJourneyId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed.startsWith("dcc_ctx_")) return null;
  if (EMAIL_RE.test(trimmed)) {
    EMAIL_RE.lastIndex = 0;
    return null;
  }
  return SAFE_JOURNEY_ID_RE.test(trimmed) ? trimmed : null;
}

export function sanitizeShareCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed.startsWith("dcc_ctx_")) return null;
  return SAFE_SHARE_CODE_RE.test(trimmed) ? trimmed : null;
}

export function isTrustedJourneyOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  return TRUSTED_JOURNEY_CORS_ORIGIN_RE.test(origin.trim());
}

export function buildJourneyCorsHeaders(origin: string | null | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-qa-test",
    Vary: "Origin",
  };
  if (origin && isTrustedJourneyOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin.trim();
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

function normalizeLookupSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EXPLICIT_CANONICAL_PORT_ALIASES: Record<
  string,
  { canonicalSlug: string; directorySlug: string; fallbackName?: string; fallbackArea?: string; fallbackCountry?: string }
> = {
  miami: {
    canonicalSlug: "miami",
    directorySlug: "portmiami",
    fallbackName: "PortMiami",
    fallbackArea: "Florida / Caribbean",
    fallbackCountry: "United States",
  },
  portmiami: {
    canonicalSlug: "portmiami",
    directorySlug: "portmiami",
    fallbackName: "PortMiami",
    fallbackArea: "Florida / Caribbean",
    fallbackCountry: "United States",
  },
  "port-of-miami": {
    canonicalSlug: "miami",
    directorySlug: "portmiami",
    fallbackName: "PortMiami",
    fallbackArea: "Florida / Caribbean",
    fallbackCountry: "United States",
  },
  "fort-lauderdale": {
    canonicalSlug: "port-everglades",
    directorySlug: "port-everglades",
    fallbackName: "Port Everglades (Fort Lauderdale)",
    fallbackArea: "Florida / Caribbean",
    fallbackCountry: "United States",
  },
  "grand-cayman": {
    canonicalSlug: "grand-cayman",
    directorySlug: "george-town-grand-cayman",
    fallbackName: "Grand Cayman (George Town)",
    fallbackArea: "Western Caribbean",
    fallbackCountry: "Cayman Islands",
  },
  "george-town-grand-cayman": {
    canonicalSlug: "george-town-grand-cayman",
    directorySlug: "george-town-grand-cayman",
    fallbackName: "George Town, Grand Cayman",
    fallbackArea: "Western Caribbean",
    fallbackCountry: "Cayman Islands",
  },
  maui: {
    canonicalSlug: "kahului",
    directorySlug: "kahului",
    fallbackName: "Kahului (Maui)",
    fallbackArea: "Hawaii",
    fallbackCountry: "United States",
  },
  "maui-kahului": {
    canonicalSlug: "kahului",
    directorySlug: "kahului",
    fallbackName: "Kahului (Maui)",
    fallbackArea: "Hawaii",
    fallbackCountry: "United States",
  },
  nola: {
    canonicalSlug: "new-orleans",
    directorySlug: "new-orleans",
    fallbackName: "Port of New Orleans",
    fallbackArea: "Gulf Coast",
    fallbackCountry: "United States",
  },
  "cozumel-mexico": {
    canonicalSlug: "cozumel",
    directorySlug: "cozumel",
    fallbackName: "Cozumel",
    fallbackArea: "Western Caribbean / Mexico",
    fallbackCountry: "Mexico",
  },
  "port-of-juneau": {
    canonicalSlug: "juneau",
    directorySlug: "juneau",
    fallbackName: "Juneau",
    fallbackArea: "Alaska",
    fallbackCountry: "United States",
  },
};

export function resolveCanonicalCruisePortForJourney(
  rawPortSlug: string | null | undefined,
): ResolvedCanonicalCruisePort | null {
  const cleaned = sanitizeNonPiiToken(rawPortSlug, 80);
  if (!cleaned) return null;
  const normalized = normalizeLookupSlug(cleaned);
  if (!normalized || !SAFE_SLUG_RE.test(normalized)) return null;

  const directory = getCruisePortDirectory();
  const directoryBySlug = new Map(directory.map((entry) => [entry.slug, entry]));

  const explicit = EXPLICIT_CANONICAL_PORT_ALIASES[normalized];
  if (explicit) {
    const dirEntry = directoryBySlug.get(explicit.directorySlug) ?? null;
    const portView =
      getPortBySlug(explicit.canonicalSlug) ??
      getPortBySlug(explicit.directorySlug) ??
      null;
    const excursionProfile =
      resolveCruisePortExcursionProfile(explicit.canonicalSlug) ??
      resolveCruisePortExcursionProfile(explicit.directorySlug);
    return {
      requestedSlug: normalized,
      canonicalSlug: explicit.canonicalSlug,
      directorySlug: explicit.directorySlug,
      name:
        excursionProfile?.portName ||
        dirEntry?.name ||
        portView?.name ||
        explicit.fallbackName ||
        explicit.canonicalSlug,
      area:
        dirEntry?.area ||
        portView?.area ||
        portView?.region ||
        explicit.fallbackArea ||
        "Cruise Port",
      country:
        excursionProfile?.country ||
        dirEntry?.country ||
        portView?.country ||
        explicit.fallbackCountry ||
        "Unknown",
      directoryEntry: dirEntry,
      portView,
      excursionProfile,
    };
  }

  const directDirEntry = directoryBySlug.get(normalized) ?? null;
  const mappedBatchProfile =
    MAPPED_CRUISE_PORT_EXCURSION_PROFILES.find((p) => p.portSlug === normalized) ?? null;
  const directPortView = getPortBySlug(normalized);

  let matchedDirEntry = directDirEntry;
  if (!matchedDirEntry && !mappedBatchProfile && !directPortView) {
    for (const entry of directory) {
      if (normalizeLookupSlug(entry.name) === normalized) {
        matchedDirEntry = entry;
        break;
      }
      if (
        Array.isArray(entry.aliases) &&
        entry.aliases.some((alias) => normalizeLookupSlug(alias) === normalized)
      ) {
        matchedDirEntry = entry;
        break;
      }
    }
  }

  if (!matchedDirEntry && !mappedBatchProfile && !directPortView) {
    return null;
  }

  const canonicalSlug =
    matchedDirEntry?.slug || mappedBatchProfile?.portSlug || directPortView!.slug;
  const excursionProfile = resolveCruisePortExcursionProfile(canonicalSlug);
  const portView = directPortView ?? getPortBySlug(canonicalSlug);

  return {
    requestedSlug: normalized,
    canonicalSlug,
    directorySlug: matchedDirEntry?.slug || canonicalSlug,
    name:
      matchedDirEntry?.name ||
      excursionProfile?.portName ||
      portView?.name ||
      canonicalSlug,
    area:
      matchedDirEntry?.area ||
      portView?.area ||
      portView?.region ||
      matchedDirEntry?.country ||
      "Cruise Region",
    country:
      matchedDirEntry?.country ||
      excursionProfile?.country ||
      portView?.country ||
      "International",
    directoryEntry: matchedDirEntry,
    portView,
    excursionProfile,
  };
}

type CanonicalCruiseRegion =
  | "caribbean"
  | "alaska"
  | "europe"
  | "bahamas"
  | "mexico"
  | "hawaii"
  | "new-england"
  | "transatlantic";

const US_PASSPORT_LINKS: OfficialPassportOrVisaLink[] = [
  {
    label: "U.S. State Department Cruise Ship Passengers Travel Guidance",
    url: "https://travel.state.gov/content/travel/en/international-travel/before-you-go/travelers-with-special-considerations/cruise-ship-passengers.html",
    authority: "U.S. Department of State (travel.state.gov)",
  },
  {
    label: "U.S. Customs and Border Protection Closed-Loop Cruise Document Rules (WHTI)",
    url: "https://www.cbp.gov/travel/us-citizens/western-hemisphere-travel-initiative",
    authority: "U.S. Customs and Border Protection (cbp.gov)",
  },
];

const CANADA_ETA_LINK: OfficialPassportOrVisaLink = {
  label: "Government of Canada Electronic Travel Authorization (eTA) & Cruise Entry",
  url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html",
  authority: "Immigration, Refugees and Citizenship Canada (canada.ca)",
};

const UK_ETA_LINK: OfficialPassportOrVisaLink = {
  label: "UK Electronic Travel Authorisation (ETA) Official Checker",
  url: "https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta",
  authority: "UK Home Office (gov.uk)",
};

const EU_ETIAS_LINK: OfficialPassportOrVisaLink = {
  label: "European Union ETIAS & Entry/Exit System (EES) Official Portal",
  url: "https://travel-europe.europa.eu/etias_en",
  authority: "European Union (travel-europe.europa.eu)",
};

export function normalizeCruiseRegion(
  rawRegion: string | null | undefined,
  port?: ResolvedCanonicalCruisePort | null,
): CanonicalCruiseRegion {
  const token = normalizeLookupSlug(sanitizeNonPiiToken(rawRegion, 64));
  if (token) {
    if (token === "alaska" || token.includes("inside-passage") || token.includes("gulf-of-alaska")) {
      return "alaska";
    }
    if (
      token === "europe" ||
      token.includes("mediterranean") ||
      token.includes("greek") ||
      token.includes("norwegian") ||
      token.includes("baltic") ||
      token.includes("british-isles") ||
      token.includes("iceland")
    ) {
      return "europe";
    }
    if (token === "bahamas" || token.includes("nassau") || token.includes("perfect-day")) {
      return "bahamas";
    }
    if (
      token === "mexico" ||
      token.includes("mexican-riviera") ||
      token.includes("baja") ||
      token.includes("yucatan")
    ) {
      return "mexico";
    }
    if (token === "hawaii" || token.includes("maui") || token.includes("oahu") || token.includes("kona")) {
      return "hawaii";
    }
    if (
      token === "new-england" ||
      token.includes("canada-new-england") ||
      token.includes("maritimes") ||
      token.includes("maine")
    ) {
      return "new-england";
    }
    if (token === "transatlantic" || token.includes("repositioning") || token.includes("crossing")) {
      return "transatlantic";
    }
    if (token.includes("caribbean")) {
      return "caribbean";
    }
  }

  if (port) {
    const portHint = `${port.canonicalSlug} ${port.area} ${port.country}`.toLowerCase();
    if (
      portHint.includes("alaska") ||
      ["juneau", "ketchikan", "skagway", "sitka", "seward", "whittier", "icystraitpoint", "vancouver", "seattle"].includes(
        port.canonicalSlug,
      )
    ) {
      return "alaska";
    }
    if (portHint.includes("bahamas") || ["nassau", "bimini", "freeport"].includes(port.canonicalSlug)) {
      return "bahamas";
    }
    if (
      portHint.includes("mexico") ||
      ["cozumel", "costa-maya", "progreso", "cabo-san-lucas", "puerto-vallarta", "mazatlan", "ensenada"].includes(
        port.canonicalSlug,
      )
    ) {
      return "mexico";
    }
    if (
      portHint.includes("hawaii") ||
      ["kahului", "honolulu", "kailua-kona", "hilo", "nawiliwili"].includes(port.canonicalSlug)
    ) {
      return "hawaii";
    }
    if (
      portHint.includes("new england") ||
      portHint.includes("nova scotia") ||
      portHint.includes("new brunswick") ||
      ["boston", "bar-harbor", "portland-maine", "halifax", "saint-john"].includes(port.canonicalSlug)
    ) {
      return "new-england";
    }
    if (
      portHint.includes("europe") ||
      portHint.includes("mediterranean") ||
      portHint.includes("greece") ||
      portHint.includes("italy") ||
      portHint.includes("spain") ||
      portHint.includes("iceland") ||
      portHint.includes("norway") ||
      portHint.includes("united kingdom")
    ) {
      return "europe";
    }
  }

  return "caribbean";
}

export function parseMonthParam(
  rawMonth: number | string | null | undefined,
  sailDate?: string | null,
): number | null {
  if (rawMonth !== null && rawMonth !== undefined && String(rawMonth).trim() !== "") {
    const parsed = Number(String(rawMonth).trim());
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 12) {
      return parsed;
    }
  }
  if (sailDate && /^\d{4}-(\d{2})-\d{2}$/.test(sailDate.trim())) {
    const monthPart = Number(sailDate.trim().slice(5, 7));
    if (monthPart >= 1 && monthPart <= 12) return monthPart;
  }
  return null;
}

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function buildSeasonalGuidance(
  region: CanonicalCruiseRegion,
  month: number | null,
): CruiseSeasonalGuidance {
  const mName = month ? MONTH_NAMES[month] : null;
  const isHurricaneWindow = month !== null && month >= 6 && month <= 11;
  const isPeakAtlanticHurricane = month !== null && month >= 8 && month <= 10;
  const isSpringBreak = month === 3 || month === 4;
  const isSummerSchoolBreak = month !== null && month >= 6 && month <= 8;
  const isHolidayPeak = month === 12 || month === 11;

  switch (region) {
    case "alaska": {
      const weatherSummary =
        month === 5
          ? "May brings crisp 50–60°F (10–16°C) coastal highs, 16–17 hours of daylight, lower rainfall than late summer, and lingering alpine snowpack that sharpens glacier scenery."
          : month === 6 || month === 7
            ? `${mName} delivers peak 18–19 hour subarctic daylight, 58–66°F (14–19°C) afternoons, and active marine feeding, though coastal mist and low cloud ceilings can pause flightseeing.`
            : month === 8
              ? "August features 55–63°F (13–17°C) highs, ~15.5 hours of daylight, peak salmon runs, and increasing Southeast Alaska rain showers requiring waterproof layers."
              : month === 9
                ? "September brings autumn tundra color, 48–56°F (9–13°C) temperatures, ~12.5–13.5 hours of daylight, dark skies for northern lights, and brisker Gulf of Alaska winds."
                : "Alaska's May–September cruise season spans 13–19 hours of daylight with cool 50–65°F coastal weather; pack layered rain gear because mountain ceilings shift hour by hour.";
      const stormOrEnvironmentalWatch =
        month === 7 || month === 8
          ? "Coastal fog ceilings frequently trigger helicopter glacier landing holds in Juneau/Skagway, and interior Alaska/BC wildfire smoke can occasionally drift into Lynn Canal; keep surface whale-watching or tram backups ready."
          : month === 9 || month === 10
            ? "Early autumn Gulf of Alaska low-pressure systems can increase swell and compress tender or dock clearance windows; confirm morning berth status on ship Wi-Fi."
            : "Mountain cloud ceilings and tide swings govern flightseeing and dock ramps; always carry a surface excursion backup and maintain a 120-minute return buffer.";
      const wildlifeHighlights =
        month === 5
          ? ["Migrating humpback whales arriving in Stephens Passage", "Orcas, sea otters, and harbor seals on ice floes", "Bald eagles and coastal black bears emerging along shorelines"]
          : month === 7 || month === 8
            ? ["Peak salmon runs drawing brown & black bears to coastal creeks", "Bubble-net feeding humpback whales in Auke Bay & Icy Strait", "Harbor seals pupping near tidewater glacier faces"]
            : ["Humpback whales & resident orca pods", "Bald eagles, sea otters, and Steller sea lions", "Tidewater glacier calving & temperate rainforest wildlife"];
      const crowdingAndSchoolHolidayNote = isSummerSchoolBreak
        ? `${mName} is peak multigenerational school-break season in Alaska—expect 4–5 ships in Juneau/Ketchikan simultaneously and book small-boat wildlife or helicopter seats early.`
        : "May and September shoulder sailings see fewer families and calmer pier queues, though smaller shoulder-season tour fleets still sell out fast.";
      return {
        region,
        month,
        weatherSummary,
        stormOrEnvironmentalWatch,
        wildlifeHighlights,
        crowdingAndSchoolHolidayNote,
        officialPassportAndVisaLinks: [...US_PASSPORT_LINKS, CANADA_ETA_LINK],
      };
    }

    case "europe": {
      const weatherSummary =
        month === 7 || month === 8
          ? `${mName} brings hot, dry 85–98°F (29–37°C) Mediterranean afternoons with 14–15 hours of daylight, while Northern Europe/Fjords remain pleasantly mild at 60–70°F (16–21°C).`
          : month === 4 || month === 5 || month === 9 || month === 10
            ? `${mName} offers ideal 65–78°F (18–26°C) sightseeing weather across Mediterranean ports and balanced 11.5–14.5 hour daylight with far less midday heat exhaustion.`
            : "European cruise conditions range from warm, sunlit April–October Mediterranean calls to long-daylight May–August Norwegian Fjord and Iceland itineraries.";
      const stormOrEnvironmentalWatch =
        month === 7 || month === 8
          ? "Extreme Mediterranean heatwaves affect unshaded archaeological sites (Rome, Athens, Ephesus), and seasonal Aegean Meltemi winds can delay or cancel tender operations at Santorini and Mykonos."
          : month !== null && (month >= 10 || month <= 3)
            ? "Autumn/winter Mediterranean mistral and Atlantic swells can force tender-to-dock itinerary swaps; monitor bridge announcements before booking non-refundable private drivers."
            : "Tender-heavy ports such as Santorini, Kotor, and Amalfi Coast calls face cable-car or boat bottlenecks; preserve at least a 120-minute return-to-pier buffer.";
      const wildlifeHighlights = [
        "Atlantic puffins & humpback whales on May–August Iceland and North Cape routes",
        "Striped & bottlenose dolphins in the Ligurian Sea and Strait of Gibraltar",
        "Mediterranean monk seal & loggerhead turtle conservation zones in the Ionian/Aegean",
      ];
      const crowdingAndSchoolHolidayNote =
        month === 8
          ? "August coincides with European summer holidays plus school vacation—port towns, Santorini cable cars, and Rome/Florence rail transfers run at maximum capacity."
          : isSummerSchoolBreak
            ? `${mName} brings heavy summer cruise and land-tour overlap; prioritize early morning departures that return 2+ hours before all-aboard.`
            : "April–May and September–October shoulder calls ease museum queues, though multi-ship call days still require pre-reserved timed-entry tickets.";
      return {
        region,
        month,
        weatherSummary,
        stormOrEnvironmentalWatch,
        wildlifeHighlights,
        crowdingAndSchoolHolidayNote,
        officialPassportAndVisaLinks: [
          US_PASSPORT_LINKS[0],
          EU_ETIAS_LINK,
          UK_ETA_LINK,
        ],
      };
    }

    case "bahamas": {
      const weatherSummary =
        month === 1 || month === 2
          ? `${mName} features sunny, comfortable 75–79°F (24–26°C) air temperatures (~10.5–11 hours of daylight), though shallow lagoon water can feel brisk (72–74°F) on windy cold-front days.`
          : isHurricaneWindow
            ? `${mName} is hot and humid at 86–90°F (30–32°C) with warm 82–85°F ocean water, brief afternoon tropical downpours, and ~12–13.5 hours of daylight.`
            : "The Bahamas enjoys warm 78–86°F (25–30°C) trade-wind weather year-round with clear turquoise visibility for reef snorkeling and private-island beach days.";
      const stormOrEnvironmentalWatch = isPeakAtlanticHurricane
        ? `Peak Atlantic hurricane season (${mName}): ships routinely re-sequence Nassau, Bimini, and private-island tender/pier calls around tropical waves—verify instant storm-cancellation refund terms.`
        : isHurricaneWindow
          ? "Atlantic hurricane season runs June 1–November 30; afternoon lightning cells and wind swells can pause private-island tenders or parasailing."
          : "Winter frontal winds (December–March) can occasionally create chop that cancels tender calls at CocoCay/Half Moon Cay/Great Stirrup Cay.";
      const wildlifeHighlights = [
        "Southern stingrays, nurse sharks, and green sea turtles over shallow Bahamian reefs",
        "Bottlenose dolphins & vibrant parrotfish along Nassau and Pearl Island coral gardens",
        "Migrating Atlantic spotted dolphins on Bimini and Berry Islands banks",
      ];
      const crowdingAndSchoolHolidayNote = isSpringBreak
        ? `${mName} is peak college and family Spring Break on 3- and 4-night Bahamas sailings—Nassau Bay Street and beach clubs fill early.`
        : isSummerSchoolBreak || isHolidayPeak
          ? "School holiday sailings bring high family occupancy and busy waterpark/cabana demand; lock in schedule-matched morning excursions."
          : "Outside school holidays, weekday Nassau calls still see 3–6 mega-ships at Prince George Wharf—allow extra walking time through the port plaza.";
      return {
        region,
        month,
        weatherSummary,
        stormOrEnvironmentalWatch,
        wildlifeHighlights,
        crowdingAndSchoolHolidayNote,
        officialPassportAndVisaLinks: US_PASSPORT_LINKS,
      };
    }

    case "mexico": {
      const weatherSummary = isHurricaneWindow
        ? `${mName} brings hot 86–92°F (30–33°C) coastal highs across Cozumel/Costa Maya and Pacific Mexico with warm ocean temperatures and afternoon convective showers.`
        : `${mName || "Dry-season"} sailing brings 78–85°F (26–29°C) sunshine, lower humidity, ~11–12.5 hours of daylight, and prime visibility on Mesoamerican Reef drift dives.`;
      const stormOrEnvironmentalWatch = isHurricaneWindow
        ? "June–November spans both Atlantic/Caribbean and Eastern Pacific hurricane seasons, plus seasonal sargassum seaweed along east-facing Yucatan beaches (west-side Cozumel beach clubs are typically clearer)."
        : "Strong 'El Norte' wind events in winter can briefly close Cozumel harbor to small snorkel boats or pause mainland ferry crossings to Playa del Carmen—avoid tight ferry excursions on short port calls.";
      const wildlifeHighlights =
        month !== null && (month === 12 || month <= 3)
          ? [
              "Humpback and gray whale calving/migration off Cabo San Lucas, Mazatlán & Puerto Vallarta (Dec–Mar)",
              "Eagle rays, splendid toadfish, and sea turtles along Cozumel's Palancar & Columbia reefs",
              "Flamingos and tropical birdlife near Progreso and Río Lagartos biosphere lagoons",
            ]
          : [
              "Hawksbill & green sea turtles nesting/foraging along Cozumel and Akumal reefs",
              "Whale sharks offshore Isla Mujeres/Cancún (June–Mid-September)",
              "Mesoamerican Barrier Reef coral gardens in Cozumel & Costa Maya",
            ];
      const crowdingAndSchoolHolidayNote =
        isSpringBreak || isHolidayPeak
          ? `${mName || "Holiday"} brings peak resort + multi-ship port volume in Cozumel (Puerta Maya, International Pier, Punta Langosta) and Cabo tender queues.`
          : "Even in shoulder months, Cozumel regularly hosts 4–7 ships across three piers—confirm which pier your ship uses before booking taxi-dependent tours.";
      return {
        region,
        month,
        weatherSummary,
        stormOrEnvironmentalWatch,
        wildlifeHighlights,
        crowdingAndSchoolHolidayNote,
        officialPassportAndVisaLinks: US_PASSPORT_LINKS,
      };
    }

    case "hawaii": {
      const isWhaleSeason = month !== null && (month === 12 || month <= 4);
      const weatherSummary =
        `${mName || "Year-round"} Hawaiian island cruising features 78–86°F (26–30°C) trade-wind highs, 11–13.5 hours of daylight, and microclimates ranging from lush windward waterfalls in Hilo/Kauai to sunny leeward Maui and Kona.`;
      const stormOrEnvironmentalWatch = isHurricaneWindow
        ? "Central Pacific hurricane season runs June 1–November 30; distant south or Kona swells can also impact tender landings at Kailua-Kona."
        : "Winter North Pacific swells (November–March) can increase harbor surge and tender transfer times at Kailua-Kona; verify 120-minute return buffers on Road to Hana or volcano drives.";
      const wildlifeHighlights = isWhaleSeason
        ? [
            "Peak North Pacific humpback whale mothers & calves in Maui's ʻAuʻau Channel (Dec–Apr)",
            "Hawaiian green sea turtles (honu) and spinner dolphins in Kona & Oahu bays",
            "Endemic Hawaiian honeycreepers and nēnē geese in Haleakalā & Hawaiʻi Volcanoes National Parks",
          ]
        : [
            "Hawaiian green sea turtles (honu) & reef manta rays along the Kona coast",
            "Spinner dolphins and vibrant coral endemic fish in Molokini & Kealakekua Bay",
            "Nēnē geese and volcanic crater ecosystems on Maui and Hawaiʻi Island",
          ];
      const crowdingAndSchoolHolidayNote =
        isSummerSchoolBreak || isHolidayPeak || isSpringBreak
          ? "Rental cars, Haleakalā sunrise/summit logistics, and Pearl Harbor or Maʻalaea Harbor boats book out weeks ahead during school holidays."
          : "Inter-island port days often include overnight calls, but final-day Road to Hana or Volcanoes National Park drives still require strict 2-hour all-aboard buffers.";
      return {
        region,
        month,
        weatherSummary,
        stormOrEnvironmentalWatch,
        wildlifeHighlights,
        crowdingAndSchoolHolidayNote,
        officialPassportAndVisaLinks: US_PASSPORT_LINKS,
      };
    }

    case "new-england": {
      const isFoliage = month === 9 || month === 10;
      const weatherSummary = isFoliage
        ? `${mName} brings crisp 52–66°F (11–19°C) coastal afternoons, ~11–12.5 hours of daylight, and peak autumn foliage across Maine, Nova Scotia, New Brunswick, and Québec.`
        : `${mName || "Summer/early-autumn"} Canada & New England sailings feature mild 65–76°F (18–24°C) harbor days, 14–15.5 hours of summer daylight, and cool evenings on deck.`;
      const stormOrEnvironmentalWatch = isFoliage
        ? "September–October post-tropical Atlantic cyclones and nor'easters can force tender cancellations at Bar Harbor/Newport or reroute Gulf of St. Lawrence calls."
        : "Dense morning marine fog in the Gulf of Maine and extreme Bay of Fundy tidal swings (Saint John/Halifax) can shift gangway and tender timing.";
      const wildlifeHighlights = [
        "Humpback, fin, and minke whales on Stellwagen Bank & Bay of Fundy feeding grounds",
        "Atlantic puffins (May–August) and harbor seals along Maine's rocky islands",
        "Bald eagles and coastal moose/osprey habitats in Acadia & Cape Breton",
      ];
      const crowdingAndSchoolHolidayNote = isFoliage
        ? "September–October foliage sailings attract peak leaf-peeping traffic in Acadia National Park, Peggy's Cove, and Old Québec—reserve timed shore transport early."
        : "July–August family vacation traffic fills Bar Harbor, Newport, and Portland waterfronts; stick to schedule-matched morning departures.";
      return {
        region,
        month,
        weatherSummary,
        stormOrEnvironmentalWatch,
        wildlifeHighlights,
        crowdingAndSchoolHolidayNote,
        officialPassportAndVisaLinks: [...US_PASSPORT_LINKS, CANADA_ETA_LINK],
      };
    }

    case "transatlantic": {
      const weatherSummary =
        month === 4 || month === 5
          ? `${mName} eastbound repositioning crossings transition from warm 75°F Florida/Caribbean skies to brisk 55–65°F (13–18°C) Azores and European spring weather, losing 1 hour on several sea-day nights.`
          : month === 10 || month === 11
            ? `${mName} westbound crossings gain 25-hour sea days heading toward warmer 75–82°F (24–28°C) Atlantic/Caribbean latitudes after cooler European embarkation.`
            : "Transatlantic crossings combine 5–8 consecutive open-ocean sea days with Atlantic island stops (Azores, Madeira, Canary Islands, or Bermuda).";
      const stormOrEnvironmentalWatch =
        month !== null && month >= 9 && month <= 11
          ? "Late-season tropical/subtropical lows in the central Atlantic and autumn Bay of Biscay swells can alter Azores/Madeira port calls."
          : "Open-ocean North Atlantic swells occasionally require course adjustments around mid-latitude lows; keep post-cruise airfare flexible or buffered.";
      const wildlifeHighlights = [
        "Sperm whales, fin whales, and common dolphins around the Azores archipelago",
        "Cory's shearwaters and pelagic seabirds following Gulf Stream fronts",
        "Loggerhead sea turtles and flying fish in subtropical mid-Atlantic waters",
      ];
      const crowdingAndSchoolHolidayNote =
        "Repositioning crossings skew quieter, longer, and adult-oriented with very few school-age crowds onboard, though Ponta Delgada and Funchal port fleets are limited when mega-ships call.";
      return {
        region,
        month,
        weatherSummary,
        stormOrEnvironmentalWatch,
        wildlifeHighlights,
        crowdingAndSchoolHolidayNote,
        officialPassportAndVisaLinks: [
          US_PASSPORT_LINKS[0],
          UK_ETA_LINK,
          EU_ETIAS_LINK,
        ],
      };
    }

    case "caribbean":
    default: {
      const weatherSummary = isHurricaneWindow
        ? `${mName} brings warm 85–90°F (29–32°C) Caribbean highs, 82–85°F sea temperatures, ~11.5–13 hours of daylight, and passing tropical showers.`
        : `${mName || "Dry-season"} Caribbean cruising delivers steady 80–86°F (27–30°C) trade winds, low rainfall, ~11–12 hours of daylight, and calm reef visibility.`;
      const stormOrEnvironmentalWatch = isPeakAtlanticHurricane
        ? `Peak Atlantic hurricane watch (${mName}): Eastern/Western Caribbean itineraries frequently swap direction to stay in calm water—only book independent excursions with automatic port-miss/itinerary-change refunds.`
        : isHurricaneWindow
          ? "Atlantic hurricane season runs June 1–November 30, and summer sargassum can affect windward beaches; verify tender backup plans at Grand Cayman and Belize."
          : "Trade-wind swells can occasionally shift Grand Cayman (George Town) tender spots or slow bridge/ferry traffic on St. Maarten and St. John transfers.";
      const wildlifeHighlights = [
        "Southern stingrays, hawksbill sea turtles, and nurse sharks on Caribbean coral reefs",
        "Humpback whales migrating past Samaná / Turks & Caicos / USVI (January–March)",
        "Tropical reef fish, frigatebirds, and mangrove ecosystems across Roatán, St. Thomas & Bonaire",
      ];
      const crowdingAndSchoolHolidayNote =
        isSpringBreak || isHolidayPeak || isSummerSchoolBreak
          ? `${mName || "Peak holiday"} school-break sailings bring 4–6 ships simultaneously into Cozumel, St. Thomas, and Nassau—book 2-hour-buffer morning departures early.`
          : "January–February and May/early-December offer strong weather-to-crowd balance, though popular catamaran and reef boats still sell out ahead of sailing.";
      return {
        region: "caribbean",
        month,
        weatherSummary,
        stormOrEnvironmentalWatch,
        wildlifeHighlights,
        crowdingAndSchoolHolidayNote,
        officialPassportAndVisaLinks: US_PASSPORT_LINKS,
      };
    }
  }
}

function deriveDockOrTender(
  port: ResolvedCanonicalCruisePort,
  tenderDockNote: string,
): CruiseJourneyDockOrTender {
  const slug = port.canonicalSlug;
  if (
    [
      "santorini",
      "grand-cayman",
      "george-town-grand-cayman",
      "cabo-san-lucas",
      "belize-city",
      "kailua-kona",
      "bar-harbor",
      "villefranche",
      "kotor",
      "mykonos",
      "tender",
    ].includes(slug)
  ) {
    return slug === "mykonos" || slug === "kotor" ? "mixed" : "tender";
  }
  if (["juneau", "sitka", "ketchikan", "skagway", "lahaina"].includes(slug)) {
    return slug === "juneau" || slug === "ketchikan" ? "mixed" : "dock";
  }
  const profDock = port.excursionProfile?.dockOrTender;
  if (profDock === "tender") return "tender";
  const lower = tenderDockNote.toLowerCase();
  if (lower.includes("tender") && lower.includes("dock")) return "mixed";
  if (lower.includes("tender port") || lower.includes("usually tendered")) return "tender";
  if (profDock === "dock" || lower.includes("dock")) return "dock";
  return "mixed";
}

function deriveCurrencyAndLanguage(country: string, slug: string): string {
  const c = country.toLowerCase();
  if (
    c.includes("united states") ||
    c === "us" ||
    c.includes("puerto rico") ||
    c.includes("virgin islands") ||
    ["juneau", "ketchikan", "skagway", "seattle", "miami", "portmiami", "port-canaveral", "port-everglades", "new-orleans", "galveston", "san-juan", "st-thomas", "kahului", "tampa"].includes(slug)
  ) {
    return slug === "san-juan"
      ? "USD ($) · Spanish & English widely spoken"
      : "USD ($) · English";
  }
  if (c.includes("canada") || slug === "vancouver" || slug === "halifax" || slug === "victoria") {
    return "CAD ($; USD often accepted near pier with change in CAD) · English & French";
  }
  if (c.includes("mexico") || ["cozumel", "costa-maya", "progreso", "cabo-san-lucas", "puerto-vallarta"].includes(slug)) {
    return "MXN (Peso) & USD widely accepted in port zones · Spanish (English common in tourist zones)";
  }
  if (c.includes("bahamas") || slug === "nassau" || slug === "bimini") {
    return "BSD (Bahamian Dollar, pegged 1:1 with USD) & USD accepted everywhere · English";
  }
  if (c.includes("cayman") || slug.includes("grand-cayman")) {
    return "KYD (Cayman Islands Dollar) & USD accepted (change often in KYD) · English";
  }
  if (c.includes("honduras") || slug === "roatan") {
    return "HNL (Lempira) & crisp, untorn USD bills widely accepted · Spanish & English (Bay Islands)";
  }
  if (c.includes("iceland") || slug === "reykjavik") {
    return "ISK (Icelandic Króna; tap-to-pay cards universally accepted) · Icelandic & fluent English";
  }
  if (c.includes("united kingdom") || c.includes("scotland") || c.includes("england")) {
    return "GBP (£; contactless cards standard) · English";
  }
  if (c.includes("norway")) {
    return "NOK (Norwegian Krone; contactless cards preferred) · Norwegian & English";
  }
  if (
    c.includes("greece") ||
    c.includes("italy") ||
    c.includes("spain") ||
    c.includes("france") ||
    c.includes("portugal") ||
    c.includes("croatia") ||
    c.includes("malta") ||
    c.includes("germany") ||
    c.includes("netherlands")
  ) {
    return `EUR (€; cards widely accepted, carry small € coins/notes for shuttles & restrooms) · Local national language (${country}) & tourist English`;
  }
  return "Local currency & major contactless credit cards (USD acceptance varies outside pier plaza) · Local language & port-zone English";
}

export async function buildPortIntelligence(params: {
  port: ResolvedCanonicalCruisePort;
  sailDate?: string | null;
  ship?: string | null;
  partySize?: number;
  shipArrival?: string | null;
  allAboard?: string | null;
}): Promise<CruisePortIntelligence> {
  const { port } = params;
  const authorityConfig = getPortAuthorityConfig({
    slug: port.directorySlug,
    name: port.name,
    area: port.area,
    country: port.country,
  });

  const profile = port.excursionProfile;
  const dockOrTender = deriveDockOrTender(port, authorityConfig.tenderDock);

  const berthSummary = profile
    ? `${profile.defaultPierName} (${profile.defaultPierAddress}). ${authorityConfig.tenderDock}`
    : authorityConfig.tenderDock;

  const distanceToTownSummary = profile
    ? `${authorityConfig.nearbyTown} Typical pier-to-meeting transfer baseline: ~${profile.defaultOneWayPierTransferMinutes} min one-way.`
    : authorityConfig.nearbyTown;

  const currencyAndLanguage = deriveCurrencyAndLanguage(port.country, port.canonicalSlug);

  let matchingExcursionsCount = 0;
  let matchingExcursionsPreview: MatchingExcursionPreviewItem[] = [];

  if (profile) {
    const arrivalTime =
      params.shipArrival && /^\d{1,2}:\d{2}$/.test(params.shipArrival.trim())
        ? params.shipArrival.trim()
        : profile.defaultShipArrivalTime || "08:00";
    const allAboardTime =
      params.allAboard && /^\d{1,2}:\d{2}$/.test(params.allAboard.trim())
        ? params.allAboard.trim()
        : profile.defaultShipAllAboardTime || "16:30";

    const catalog = await queryPortDayExcursionCatalog({
      portSlug: profile.portSlug,
      viewMode: "browse_all",
      shipArrivalTime: arrivalTime,
      shipAllAboardTime: allAboardTime,
      sailingDate:
        params.sailDate && /^\d{4}-\d{2}-\d{2}$/.test(params.sailDate.trim())
          ? params.sailDate.trim()
          : profile.defaultSailingDate,
      partySize: params.partySize || 2,
      ship: params.ship || undefined,
      limit: 24,
      offset: 0,
    });

    if (catalog && catalog.tours.length > 0) {
      const candidateTours = catalog.tours.filter(
        (tour) => tour.timeFit.status !== "runs_too_late",
      );

      const mapped = candidateTours.map((tour): MatchingExcursionPreviewItem & { _rank: number } => {
        const bufferMins = tour.timeFit.bufferBeforeAllAboardMinutes;
        const qualifies2h =
          tour.timeFit.status === "fits" &&
          (tour.timeFit.twoHourShortlist?.qualifies === true ||
            (bufferMins !== null && bufferMins >= CANONICAL_CRUISE_RETURN_BUFFER_MINUTES));

        const bufferState: CruiseExcursionBufferState = qualifies2h
          ? "preferred"
          : tour.timeFit.status === "fits"
            ? "reduced_buffer"
            : "needs_verification";

        const rank =
          bufferState === "preferred" ? 0 : bufferState === "reduced_buffer" ? 1 : 2;

        return {
          _rank: rank,
          productCode: tour.productCode || tour.tourId,
          title: tour.title,
          ...(tour.operatorName ? { operatorName: tour.operatorName } : {}),
          durationMinutes: tour.durationMinutes ?? 180,
          ...(tour.fromPriceUsd !== null && tour.fromPriceUsd !== undefined
            ? { priceFrom: tour.fromPriceUsd }
            : {}),
          bufferState,
          bookingPathType:
            tour.provider === "operator_direct" ? "direct" : "commissionable",
        };
      });

      mapped.sort((a, b) => a._rank - b._rank);
      matchingExcursionsCount =
        catalog.summary.fitsSailingCountOnPage > 0
          ? catalog.summary.fitsSailingCountOnPage
          : mapped.length;
      matchingExcursionsPreview = mapped.slice(0, 6).map(({ _rank: _unused, ...item }) => item);
    }
  }

  return {
    portSlug: port.canonicalSlug,
    portName: port.name,
    dockOrTender,
    berthSummary,
    distanceToTownSummary,
    currencyAndLanguage,
    recommendedReturnBufferMinutes: CANONICAL_CRUISE_RETURN_BUFFER_MINUTES,
    replanUrl: `https://destinationcommandcenter.com/ports/${port.canonicalSlug}/replan`,
    portGuideUrl: `https://destinationcommandcenter.com/ports/${port.canonicalSlug}`,
    matchingExcursionsCount,
    matchingExcursionsPreview,
  };
}

const HOMEPORT_TURNAROUND_PROFILES: Record<string, CruiseTurnaroundGuidance> = {
  miami: {
    homeportSlug: "miami",
    recommendedArrivalLead:
      "Fly into MIA or FLL the afternoon/evening before sailing (1 night pre-cruise hotel strongly recommended; never book a tight morning-of flight during summer storm or winter de-icing seasons).",
    airportTransferBufferNote:
      "MIA to PortMiami is ~20–35 min via tunnel (allow 60–75 min from FLL via I-95); target terminal arrival inside your assigned check-in window and at least 2 hours before final embarkation cutoff.",
    debarkFlightCutoffNote:
      "Book return flights from MIA no earlier than 11:30 AM (12:30 PM+ from FLL) to allow US CBP facial-biometric clearance and tunnel congestion when 5–8 ships debark simultaneously.",
  },
  "port-canaveral": {
    homeportSlug: "port-canaveral",
    recommendedArrivalLead:
      "Arrive in Orlando (MCO) or Cocoa Beach/Cape Canaveral 1 day prior—Port Canaveral sits 45–55 miles east of MCO along SR-528 (Beachline Expressway), where a single bridge or causeway incident can stall traffic.",
    airportTransferBufferNote:
      "Allow 60–90 min door-to-terminal from MCO (45 min from MLB); confirm whether your ship uses North Side (CT-1/CT-3/CT-5/CT-6/CT-8/CT-10) before boarding shared shuttles.",
    debarkFlightCutoffNote:
      "Schedule MCO return flights for 12:30 PM or later (45–60 min highway transfer + MCO TSA security queues, which regularly exceed 35–50 minutes on weekend turnaround mornings).",
  },
  "port-everglades": {
    homeportSlug: "port-everglades",
    recommendedArrivalLead:
      "Arrive in Fort Lauderdale 1 day ahead when flying; even though FLL sits just 2–3 miles from Port Everglades, airline delays remain the #1 cause of missed embarkation.",
    airportTransferBufferNote:
      "FLL to Port Everglades takes 10–20 min (allow 45–70 min from MIA) plus port security checkpoint ID inspection at Eller Drive / 17th Street Causeway.",
    debarkFlightCutoffNote:
      "Book FLL flights 11:00 AM or later (12:30 PM+ from MIA); mega-ship weekend turnarounds create heavy taxi/rideshare and FLL bag-drop queues between 8:00 AM and 10:30 AM.",
  },
  "new-orleans": {
    homeportSlug: "new-orleans",
    recommendedArrivalLead:
      "Arrive in New Orleans at least 1 day early—especially during Mardi Gras, Jazz Fest, French Quarter Fest, or Saints home weekends when downtown street closures lock up Convention Center Blvd.",
    airportTransferBufferNote:
      "MSY Airport to Erato Street or Julia Street Cruise Terminal runs 25–45 min on I-10 (allow 75+ min during parade or festival weekends).",
    debarkFlightCutoffNote:
      "Book MSY return flights 12:00 PM or later; Mississippi River fog can occasionally delay ships ascending Pilottown/Southwest Pass into downtown berths.",
  },
  seattle: {
    homeportSlug: "seattle",
    recommendedArrivalLead:
      "Arrive in Seattle 1 day before sailing to buffer cross-country flights and verify whether your ship uses Bell Street Pier 66 (downtown) or Smith Cove Cruise Terminal Pier 91 (north of Elliott Bay).",
    airportTransferBufferNote:
      "SEA Airport to Pier 66 takes 25–45 min; SEA to Pier 91 takes 35–60 min via I-5/Mercer or SR-99 tunnel—double-check pier number so your rideshare does not drop at the wrong terminal.",
    debarkFlightCutoffNote:
      "Schedule SEA return flights 12:00 PM or later (use Port Valet luggage program when eligible to send checked bags straight from your stateroom to SEA).",
  },
  vancouver: {
    homeportSlug: "vancouver",
    recommendedArrivalLead:
      "Arrive in Vancouver (YVR) 1 day prior with passport + Canada eTA (if required); Alaska departures from Canada Place clear U.S. CBP Preclearance inside the cruise terminal before boarding!",
    airportTransferBufferNote:
      "YVR to Waterfront Station / Canada Place is 26 min via SkyTrain Canada Line (no traffic risk) or 30–50 min by taxi; budget an extra 45–60 min inside Canada Place for dual security + U.S. CBP Preclearance.",
    debarkFlightCutoffNote:
      "Book YVR flights into the U.S. for 12:30 PM or later so you have full margin for Canada CBSA arrival, SkyTrain/road transfer, and YVR U.S. Preclearance queues.",
  },
  galveston: {
    homeportSlug: "galveston",
    recommendedArrivalLead:
      "Fly into Houston Hobby (HOU) or Bush Intercontinental (IAH) 1 day before embarkation—Galveston Island is 42 miles from HOU and 70 miles from IAH across the I-45 Gulf Freeway & Causeway.",
    airportTransferBufferNote:
      "Allow 50–75 min from HOU and 85–115 min from IAH to Galveston Terminals 10/25/28; pre-book transfers because island rideshare supply drops sharply on turnaround mornings.",
    debarkFlightCutoffNote:
      "Book HOU flights 12:30 PM+ and IAH flights 1:30 PM+ (winter/spring Galveston Bay sea fog can hold ship channel entry by several hours).",
  },
  "san-juan": {
    homeportSlug: "san-juan",
    recommendedArrivalLead:
      "Fly into Luis Muñoz Marín Airport (SJU) 1 day early so mainland flight connections never jeopardize Southern Caribbean embarkation.",
    airportTransferBufferNote:
      "SJU to Old San Juan Pier 4 or Pan American Pier (Isla Grande) is 15–30 min by regulated taxi—confirm whether your ship embarks at Pan American Pier (most turnaround sailings) vs Old San Juan (mostly transit calls).",
    debarkFlightCutoffNote:
      "Schedule SJU return flights 11:30 AM or later, and remember all mainland-bound bags must pass the mandatory USDA agricultural X-ray inspection BEFORE airline bag drop at SJU!",
  },
};

const HOMEPORT_ALIAS_TO_CANONICAL: Record<string, string> = {
  miami: "miami",
  portmiami: "miami",
  "port-of-miami": "miami",
  "port-canaveral": "port-canaveral",
  "cape-canaveral": "port-canaveral",
  orlando: "port-canaveral",
  "port-everglades": "port-everglades",
  "fort-lauderdale": "port-everglades",
  "new-orleans": "new-orleans",
  nola: "new-orleans",
  seattle: "seattle",
  vancouver: "vancouver",
  galveston: "galveston",
  "san-juan": "san-juan",
};

const OTHER_KNOWN_HOMEPORTS = new Set([
  "tampa",
  "los-angeles",
  "san-pedro",
  "long-beach",
  "manhattan-cruise-terminal",
  "new-york",
  "cape-liberty",
  "bayonne",
  "baltimore",
  "boston",
  "jacksonville",
  "norfolk",
  "honolulu",
  "seward",
  "whittier",
  "southampton",
  "barcelona",
  "civitavecchia",
  "rome",
  "piraeus",
  "athens",
  "reykjavik",
]);

export function resolveTurnaroundGuidance(params: {
  homeportRaw?: string | null;
  port?: ResolvedCanonicalCruisePort | null;
  stage?: string | null;
}): CruiseTurnaroundGuidance | null {
  const stageNorm = normalizeLookupSlug(sanitizeNonPiiToken(params.stage, 48));
  const isTurnaroundStage =
    stageNorm.includes("embark") ||
    stageNorm.includes("debark") ||
    stageNorm.includes("disembark") ||
    stageNorm.includes("turnaround") ||
    stageNorm.includes("travel-to-port") ||
    stageNorm.includes("booked") ||
    stageNorm.includes("pre-cruise") ||
    stageNorm.includes("post-cruise");

  const candidateRaw =
    sanitizeNonPiiToken(params.homeportRaw, 64) ||
    params.port?.requestedSlug ||
    params.port?.canonicalSlug ||
    "";
  const candidateSlug = normalizeLookupSlug(candidateRaw);

  const mappedHomeport = HOMEPORT_ALIAS_TO_CANONICAL[candidateSlug];
  if (mappedHomeport && HOMEPORT_TURNAROUND_PROFILES[mappedHomeport]) {
    return HOMEPORT_TURNAROUND_PROFILES[mappedHomeport];
  }

  if (
    (candidateSlug && OTHER_KNOWN_HOMEPORTS.has(candidateSlug)) ||
    isTurnaroundStage
  ) {
    const homeportSlug = candidateSlug || "general-homeport";
    return {
      homeportSlug,
      recommendedArrivalLead:
        "Arrive in your embarkation metro area at least 1 day before sailing (2 days ahead for international long-haul flights) so airline delays or missed connections cannot forfeit embarkation.",
      airportTransferBufferNote:
        "Allow 60–90 minutes from hotel/airport to cruise terminal and plan to cross terminal security inside your assigned arrival window—at least 2 hours prior to final manifest cutoff.",
      debarkFlightCutoffNote:
        "Book domestic return flights no earlier than 12:00 PM (1:30 PM+ for international flights or terminals >30 miles from the airport) to absorb customs clearance and morning transfer queues.",
    };
  }

  return null;
}

export const STEP_31_EMERGENCY_AND_CHANGE_PLAYBOOKS: CruiseEmergencyPlaybook[] = [
  {
    scenarioId: "flight_delay",
    title: "Inbound Flight Delay or Cancellation Before Embarkation",
    immediateSteps: [
      "Contact your airline immediately via app AND airport gate desk to request same-day rerouting to the nearest co-terminal airport (e.g., FLL/MIA, HOU/IAH, EWR/JFK/LGA).",
      "Call your cruise line's Day-of-Sailing Emergency Travel Desk (printed on your boarding pass / eDocs) before scheduled departure so port operations logs your updated ETA.",
      "Keep all boarding passes, delay notices, and meal/transport receipts for travel-insurance trip-delay or missed-connection reimbursement.",
      "Do not check bags onto a dubious tight connection if carry-on routing gets you onto an earlier departure.",
    ],
    officialVerificationNote:
      "Final manifest cutoffs are governed by U.S. CBP / port-state rules (typically 60–90 minutes before sail-away); only the cruise line's emergency desk can confirm whether boarding remains open.",
  },
  {
    scenarioId: "missed_embarkation",
    title: "Missed Ship Embarkation at Homeport",
    immediateSteps: [
      "Report immediately to the cruise line's pier port agent at the terminal before leaving the port complex, and call the cruise line's 24/7 Emergency Operations number.",
      "Ask the cruise line explicitly whether downline boarding at the next port of call is legally permitted on your itinerary (Passenger Vessel Services Act / cabotage laws restrict U.S.-to-U.S. downline joins without a distant foreign port).",
      "Verify that every traveler carries a valid Passport Book (birth certificates used on closed-loop sailings are NOT valid to fly internationally to meet a ship).",
      "Notify your travel insurer's 24/7 assistance hotline before purchasing downline flights and hotels.",
    ],
    officialVerificationNote:
      "Downline embarkation requires explicit written clearance from the cruise line's compliance desk and local immigration authorities—never fly to the next port without confirmation.",
  },
  {
    scenarioId: "tender_or_port_cancellation",
    title: "Skipped Port, Weather Diversion, or Delayed Tender Clearance",
    immediateSteps: [
      "Open the low-bandwidth DCC Port Replan view (/ports/<slug>/replan) on ship Wi-Fi to recalculate shortened arrival/all-aboard windows against the 120-minute return buffer.",
      "Check your independent tour voucher for the operator's 'No Port, No Pay' / skipped-port automatic refund clause and message the operator via WhatsApp/email with the bridge announcement time.",
      "If tender queues delay shore arrival past your tour's check-in cutoff, pivot immediately to later schedule-matched departures or walkable near-pier options.",
      "Save a screenshot of the ship's daily program / app itinerary update if travel insurance port-cancellation coverage applies.",
    ],
    officialVerificationNote:
      "Ship-sponsored excursions cancel automatically onboard; independent operators require prompt notice when a port call is shortened rather than skipped outright.",
  },
  {
    scenarioId: "late_tour_return",
    title: "Independent Excursion Running Behind Toward All-Aboard",
    immediateSteps: [
      "Alert your tour driver/guide immediately if projected pier arrival drops below a 60-minute margin before all-aboard and request direct return to the cruise terminal.",
      "Call the Port Agent phone number listed on your ship's daily newsletter / port guide (snap a photo of this number before stepping off the gangway at every port!).",
      "Keep your physical Passport Book (or photo + ship SeaPass/Medallion card and government ID) plus a credit card on your person whenever ashore.",
      "Use regulated port taxis or alternate direct road/rail routes if tour transport breaks down—do not wait for a replacement tour bus when all-aboard is under 90 minutes away.",
    ],
    officialVerificationNote:
      "DCC recommends a 120-minute return-to-pier buffer on independent tours because ships are not obligated to hold departure for non-ship excursions—always carry the Port Agent's local number.",
  },
  {
    scenarioId: "lost_luggage",
    title: "Delayed or Lost Airline Bag Before Cruise Departure",
    immediateSteps: [
      "File a Property Irregularity Report (PIR) at the airline baggage service office BEFORE exiting the airport and obtain the WorldTracer tracking number.",
      "Give the airline your cruise line name, ship name, port agent address, AND full port-by-port itinerary dates so the bag can be forwarded to the pier or next legal port of call.",
      "Report the WorldTracer file number to Guest Services immediately upon boarding—shipboard Guest Services coordinates directly with port agents at upcoming stops.",
      "Purchase essential clothing/toiletries keeping itemized receipts for airline Montreal Convention / DOT liability and travel insurance baggage-delay claims.",
    ],
    officialVerificationNote:
      "Always pack prescription medications, passports, boarding docs, CPAP/medical devices, and 2 days of essentials in your personal carry-on—never hand medications to pier porters.",
  },
  {
    scenarioId: "medical_or_insurance",
    title: "Onboard or Ashore Medical Emergency & Travel Insurance Activation",
    immediateSteps: [
      "For onboard emergencies, dial the ship's emergency medical number immediately to reach the onboard Medical Center; ashore, call local emergency services AND notify the ship's Port Agent.",
      "Call your travel insurance 24/7 emergency medical/evacuation assistance line as soon as the patient is stabilized so their medical team coordinates hospital guarantees of payment and medevac logistics.",
      "Note that shipboard Medical Centers charge to your onboard account (or require upfront payment) and most domestic health plans/Medicare do not cover foreign waters directly—request itemized medical records and receipts before disembarking.",
      "If medically disembarked in a foreign port, ask Guest Services to retrieve passports from the stateroom safe and coordinate port-agent clearance with local immigration.",
    ],
    officialVerificationNote:
      "Verify medical evacuation coverage limits (especially for remote Alaska, transoceanic, or island itineraries) and carry your insurer's 24/7 international collect/direct phone number offline.",
  },
];

export async function buildCruiseJourneyIntelligence(
  params: BuildCruiseJourneyIntelligenceParams,
): Promise<CruiseJourneyIntelligenceResponse> {
  const cleanStage = sanitizeNonPiiToken(params.stage, 48) || null;
  const cleanShip = sanitizeNonPiiToken(params.ship, 100) || null;
  const cleanSailDate =
    params.sailDate && /^\d{4}-\d{2}-\d{2}$/.test(params.sailDate.trim())
      ? params.sailDate.trim()
      : null;

  const rawParty =
    params.partySize !== null && params.partySize !== undefined
      ? Number(String(params.partySize).trim())
      : 2;
  const partySize =
    Number.isFinite(rawParty) && rawParty >= 1 && rawParty <= 50
      ? Math.round(rawParty)
      : 2;

  const resolvedPort = params.port
    ? resolveCanonicalCruisePortForJourney(params.port)
    : null;

  const region = normalizeCruiseRegion(params.region, resolvedPort);
  const month = parseMonthParam(params.month, cleanSailDate);

  const seasonalGuidance = buildSeasonalGuidance(region, month);
  const portIntelligence = resolvedPort
    ? await buildPortIntelligence({
        port: resolvedPort,
        sailDate: cleanSailDate,
        ship: cleanShip,
        partySize,
        shipArrival: params.shipArrival,
        allAboard: params.allAboard,
      })
    : null;

  const turnaroundGuidance = resolveTurnaroundGuidance({
    homeportRaw: params.homeport,
    port: resolvedPort,
    stage: cleanStage,
  });

  return {
    ok: true,
    schema: CRUISE_JOURNEY_INTELLIGENCE_SCHEMA,
    generatedAt: new Date().toISOString(),
    returnBufferRuleMinutes: CANONICAL_CRUISE_RETURN_BUFFER_MINUTES,
    leadRule: CANONICAL_CRUISE_LEAD_RULE,
    seasonalGuidance,
    portIntelligence,
    turnaroundGuidance,
    emergencyAndChangePlaybooks: STEP_31_EMERGENCY_AND_CHANGE_PLAYBOOKS,
  };
}

export interface PortReplanWalkableOption {
  title: string;
  zone: string;
  roundTripMinutesNote: string;
  whySafeUnderShortenedWindow: string;
}

export interface PortReplanEvaluation {
  ok: true;
  schema: "dcc.port-replan.v1";
  checkedAtIso: string;
  coldFirstLoadBudgetBytes: 51200;
  returnBufferRuleMinutes: 120;
  leadRule: "Available departures that match your port schedule";
  portSlug: string;
  portName: string;
  area: string;
  country: string;
  dockOrTender: CruiseJourneyDockOrTender;
  berthSummary: string;
  distanceToTownSummary: string;
  currencyAndLanguage: string;
  schedule: {
    ship: string;
    portDate: string;
    arrivalTime: string;
    allAboardTime: string;
    partySize: number;
    disruptionMode: "normal" | "late_docking" | "tender_delay" | "weather_cancel";
    usablePortMinutes: number | null;
    recommendedBackByPierTime: string | null;
  };
  backupPlanSummary: {
    headline: string;
    detail: string;
    immediateActions: string[];
  };
  walkableNearPierOptions: PortReplanWalkableOption[];
  matchingExcursionsCount: number;
  matchingExcursionsPreview: MatchingExcursionPreviewItem[];
  emergencyReturnChecklist: string[];
  links: {
    portGuideUrl: string;
    replanUrl: string;
    cruisePromenadeReturnUrl: string;
    cruisePromenadeReturnLabel: string;
    dccHandoffUrl: string;
  };
}

function parseHhMmToMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null;
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function minutesToHhMm(total: number): string {
  const clamped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function buildPortReplanEvaluation(params: {
  port: ResolvedCanonicalCruisePort;
  searchParams: URLSearchParams;
}): Promise<PortReplanEvaluation> {
  const { port, searchParams } = params;
  const authorityConfig = getPortAuthorityConfig({
    slug: port.directorySlug,
    name: port.name,
    area: port.area,
    country: port.country,
  });

  const ship =
    sanitizeNonPiiToken(
      searchParams.get("ship") || searchParams.get("cruise_ship"),
      80,
    ) || "Your Cruise Ship";

  const rawDate = sanitizeNonPiiToken(
    searchParams.get("date") ||
      searchParams.get("port_date") ||
      searchParams.get("sailDate") ||
      searchParams.get("sailing_date"),
    16,
  );
  const portDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : port.excursionProfile?.defaultSailingDate || "2026-11-15";

  const rawArrival = sanitizeNonPiiToken(
    searchParams.get("arrival") ||
      searchParams.get("shipArrival") ||
      searchParams.get("shipArrivalTime"),
    10,
  );
  const arrivalTime = /^\d{1,2}:\d{2}$/.test(rawArrival)
    ? rawArrival
    : port.excursionProfile?.defaultShipArrivalTime || "08:00";

  const rawAllAboard = sanitizeNonPiiToken(
    searchParams.get("all_aboard") ||
      searchParams.get("allAboard") ||
      searchParams.get("shipAllAboardTime"),
    10,
  );
  const allAboardTime = /^\d{1,2}:\d{2}$/.test(rawAllAboard)
    ? rawAllAboard
    : port.excursionProfile?.defaultShipAllAboardTime || "16:30";

  const rawParty = Number(
    searchParams.get("party_size") || searchParams.get("partySize") || "2",
  );
  const partySize =
    Number.isFinite(rawParty) && rawParty >= 1 && rawParty <= 24
      ? Math.round(rawParty)
      : 2;

  const rawDisruption = sanitizeNonPiiToken(
    searchParams.get("disruption") || searchParams.get("reason"),
    32,
  ).toLowerCase();
  const disruptionMode: PortReplanEvaluation["schedule"]["disruptionMode"] =
    rawDisruption === "late_docking" || rawDisruption === "late"
      ? "late_docking"
      : rawDisruption === "tender_delay" || rawDisruption === "tender"
        ? "tender_delay"
        : rawDisruption === "weather_cancel" ||
            rawDisruption === "weather" ||
            searchParams.get("flight_canceled") === "1"
          ? "weather_cancel"
          : "normal";

  const arrivalMins = parseHhMmToMinutes(arrivalTime);
  const allAboardMins = parseHhMmToMinutes(allAboardTime);
  const usablePortMinutes =
    arrivalMins !== null && allAboardMins !== null && allAboardMins > arrivalMins
      ? allAboardMins - arrivalMins
      : null;
  const recommendedBackByPierTime =
    allAboardMins !== null
      ? minutesToHhMm(allAboardMins - TWO_HOUR_SHORTLIST_REQUIRED_BUFFER_MINUTES)
      : null;

  const portIntel = await buildPortIntelligence({
    port,
    sailDate: portDate,
    ship: ship === "Your Cruise Ship" ? null : ship,
    partySize,
    shipArrival: arrivalTime,
    allAboard: allAboardTime,
  });

  const journeyId = sanitizeJourneyId(
    searchParams.get("journey_id") || searchParams.get("journeyId"),
  );
  const shareCode = sanitizeShareCode(
    searchParams.get("shareCode") || searchParams.get("share_code"),
  );
  const qaTest = searchParams.get("qa_test") === "1";
  const rawReturnOrigin = (searchParams.get("return_origin") || "").trim().replace(/\/+$/, "");
  const cpOrigin = /^https:\/\/cruisepromenade(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(rawReturnOrigin)
    ? rawReturnOrigin
    : "https://cruisepromenade.com";

  const cpUrl = shareCode
    ? new URL(`${cpOrigin}/p/${encodeURIComponent(shareCode)}`)
    : new URL(`${cpOrigin}/journey`);
  if (!shareCode) {
    cpUrl.searchParams.set("stage", "in_port");
    cpUrl.searchParams.set("port", port.canonicalSlug);
    if (ship && ship !== "Your Cruise Ship") cpUrl.searchParams.set("ship", ship);
    cpUrl.searchParams.set("sailDate", portDate);
  }
  if (journeyId) cpUrl.searchParams.set("journey_id", journeyId);
  if (qaTest) cpUrl.searchParams.set("qa_test", "1");

  const handoffUrl = new URL("https://destinationcommandcenter.com/go/dcc-to-cruise-promenade");
  handoffUrl.searchParams.set("port", port.canonicalSlug);
  handoffUrl.searchParams.set("port_date", portDate);
  handoffUrl.searchParams.set("party_size", String(partySize));
  handoffUrl.searchParams.set("stage", "in_port");
  handoffUrl.searchParams.set("shipArrival", arrivalTime);
  handoffUrl.searchParams.set("allAboard", allAboardTime);
  if (ship && ship !== "Your Cruise Ship") handoffUrl.searchParams.set("ship", ship);
  if (journeyId) handoffUrl.searchParams.set("journey_id", journeyId);
  if (qaTest) handoffUrl.searchParams.set("qa_test", "1");

  const walkableZones =
    authorityConfig.nearbyZones.length > 0
      ? authorityConfig.nearbyZones.slice(0, 3)
      : [`${port.name} Waterfront Plaza`, "Main Town Center", "Harbor Promenade"];

  const walkableNearPierOptions: PortReplanWalkableOption[] = walkableZones.map(
    (zone, idx) => ({
      title:
        idx === 0
          ? `${zone} Self-Paced Pier Walk & Local Cafés`
          : idx === 1
            ? `${zone} Cultural & Shopping Loop`
            : `${zone} Flexible Harbor / Scenic Stop`,
      zone,
      roundTripMinutesNote:
        portIntel.dockOrTender === "tender"
          ? "15–30 min walk from tender landing + allow 40 min return tender queue"
          : "10–25 min walk or short regulated port shuttle from gangway",
      whySafeUnderShortenedWindow:
        "Zero fixed departure cutoff and self-controlled turnaround so you can be back at the pier 120+ minutes before all-aboard.",
    }),
  );

  const backupHeadline =
    disruptionMode === "late_docking"
      ? `Late Docking Backup Plan — Target Pier Return by ${recommendedBackByPierTime || "2h Before All-Aboard"}`
      : disruptionMode === "tender_delay"
        ? `Tender Queue Delay Plan — Prioritize 2h+ Buffer Departures & Near-Landing Zones`
        : disruptionMode === "weather_cancel"
          ? `Weather Cancellation Pivot — Surface & Walkable ${port.name} Backups`
          : `${CANONICAL_CRUISE_LEAD_RULE} (${port.name})`;

  const backupDetail =
    usablePortMinutes !== null && usablePortMinutes < 300
      ? `Compressed ${usablePortMinutes}-minute port window (${arrivalTime}–${allAboardTime}). Skip long inland transfers and stick strictly to departures returning by ${recommendedBackByPierTime} or walkable near-pier loops.`
      : `Port window ${arrivalTime}–${allAboardTime}${usablePortMinutes ? ` (${usablePortMinutes} min total)` : ""}. Target return to pier by ${recommendedBackByPierTime || "2 hours before all-aboard"} to preserve DCC's 120-minute buffer.`;

  return {
    ok: true,
    schema: "dcc.port-replan.v1",
    checkedAtIso: new Date().toISOString(),
    coldFirstLoadBudgetBytes: 51200,
    returnBufferRuleMinutes: CANONICAL_CRUISE_RETURN_BUFFER_MINUTES,
    leadRule: CANONICAL_CRUISE_LEAD_RULE,
    portSlug: port.canonicalSlug,
    portName: port.name,
    area: port.area,
    country: port.country,
    dockOrTender: portIntel.dockOrTender,
    berthSummary: portIntel.berthSummary,
    distanceToTownSummary: portIntel.distanceToTownSummary,
    currencyAndLanguage: portIntel.currencyAndLanguage,
    schedule: {
      ship,
      portDate,
      arrivalTime,
      allAboardTime,
      partySize,
      disruptionMode,
      usablePortMinutes,
      recommendedBackByPierTime,
    },
    backupPlanSummary: {
      headline: backupHeadline,
      detail: backupDetail,
      immediateActions: [
        `Confirm today's posted ship all-aboard cutoff (${allAboardTime}) at the gangway sign—ship time rules over shore clocks.`,
        `Prioritize departures back at the pier by ${recommendedBackByPierTime || "120+ minutes before all-aboard"} (2-hour return buffer).`,
        disruptionMode === "tender_delay" || portIntel.dockOrTender !== "dock"
          ? "Account for afternoon return tender queues (30–45 min) before the final tender boat cutoff."
          : "Verify your exact pier/terminal gate name with port security before boarding any local taxi.",
      ],
    },
    walkableNearPierOptions,
    matchingExcursionsCount: portIntel.matchingExcursionsCount,
    matchingExcursionsPreview: portIntel.matchingExcursionsPreview,
    emergencyReturnChecklist: [
      "Photograph your ship's Daily Program Port Agent phone number & pier address before leaving the gangway.",
      "Keep ship card, government photo ID / Passport Book, and one physical payment card on you.",
      "Keep your phone on airplane-mode clock lock if ship time differs from local port time zone.",
      `Head back toward the pier no later than ${recommendedBackByPierTime || "2 hours before all-aboard"}—if delayed below a 60-minute margin, call the Port Agent immediately.`,
    ],
    links: {
      portGuideUrl: `/ports/${port.canonicalSlug}`,
      replanUrl: `/ports/${port.canonicalSlug}/replan`,
      cruisePromenadeReturnUrl: cpUrl.toString(),
      cruisePromenadeReturnLabel: shareCode
        ? `Return to Group Board (${shareCode}) on Cruise Promenade →`
        : "Return to Cruise Promenade Port-Day Journey →",
      dccHandoffUrl: handoffUrl.toString(),
    },
  };
}
