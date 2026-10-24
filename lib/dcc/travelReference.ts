import { eq } from "drizzle-orm";
import { earthosControlMapFindings } from "@/lib/db/schema";
import { getRequiredEarthosDb } from "@/lib/dcc/earthos/ensureEarthosSchema";

export type AuthorityType =
  | "official_rule"
  | "observation"
  | "forecast"
  | "dcc_interpretation"
  | "editorial_recommendation"
  | "official_resource_link";

export type IntegrationStatus =
  | "live_integrated"
  | "curated_verified"
  | "linked_official_resource";

export type EvidenceCitation = {
  id: string;
  claimSummary: string;
  sourceTitle: string;
  sourceUrl: string;
  issuingOrganization: string;
  authorityType: AuthorityType;
  integrationStatus: IntegrationStatus;
  geographicScope: string;
  applicableTravelerContext: string;
  publishedOrUpdatedDate: string | null;
  lastCheckedAt: string;
  verificationNote?: string;
};

export type EntryScenarioRule = {
  id: string;
  scenarioLabel: string;
  dependencies: {
    nationality: string;
    passportAndDocuments: string;
    residenceContext: string;
    routingAndTransit: string;
    tripPurpose: string;
    dateAndValidityRule: string;
  };
  officialRequirementSummary: string;
  dccPracticalExplanation: string;
  officialLinks: Array<{
    label: string;
    url: string;
    issuingOrganization: string;
    note: string;
  }>;
  citationIds: string[];
};

export type TransportModeGuide = {
  id: string;
  modeName: string;
  category: "air" | "marine_port" | "ferry" | "public_transit" | "shuttle_transfer" | "road_driving" | "rideshare_pedestrian";
  operatorOrAuthority: string;
  routeOrCoverage: string;
  scheduleAndStatusIntegration: "live_integrated" | "curated_with_official_link";
  whatWorksInPractice: string;
  practicalConstraints: string[];
  officialResourceUrl: string;
  officialResourceLabel: string;
  citationIds: string[];
};

export type SafetyHealthEmergencyItem = {
  id: string;
  category: "official_advisory" | "health_guidance" | "emergency_services" | "operational_boundary";
  title: string;
  issuingAuthority: string;
  authorityType: AuthorityType;
  integrationStatus: IntegrationStatus;
  summary: string;
  travelerAction: string;
  officialUrl: string;
  officialUrlLabel: string;
  citationIds: string[];
};

export type SeasonalityAndConstraintItem = {
  id: string;
  category: "seasonality" | "timing_window" | "accessibility" | "closure_or_restriction";
  title: string;
  windowOrScope: string;
  authorityType: AuthorityType;
  factualBasis: string;
  dccInterpretation: string;
  officialUrl?: string;
  officialUrlLabel?: string;
  citationIds: string[];
};

export type OperationalNonConflationNotice = {
  headline: string;
  weatherVsOperationsExplanation: string;
  missingOrExpiredDataRule: string;
  whatIsLiveIntegrated: string[];
  whatRequiresOfficialExternalCheck: Array<{
    capability: string;
    whyNotAutomated: string;
    officialSourceLabel: string;
    officialSourceUrl: string;
  }>;
};

export type SpecialistHandoffOption = {
  id: string;
  partnerName: string;
  partnerRole: "specialist_guide" | "transport_operator" | "excursion_specialist";
  integrationMode: "context_handoff_link" | "pilot_endpoint_plus_handoff";
  description: string;
  whenItHelps: string;
  noPurchaseRequiredNote: string;
  baseUrl: string;
  supportedContextParams: Array<"date" | "partySize" | "shipOrPort" | "pickupHub" | "direction">;
  defaultParams: Record<string, string>;
};

export type RelatedPlaceLink = {
  id: string;
  label: string;
  relationship:
    | "canonical_coordinate"
    | "secondary_coordinate"
    | "country"
    | "region"
    | "city"
    | "venue"
    | "port"
    | "airport"
    | "route_corridor";
  href: string;
  coordinate?: { lat: number; lng: number };
  summary: string;
};

export type TravelReferenceNode = {
  id: "juneau" | "red-rocks" | "denver-breckenridge" | "new-orleans" | "las-vegas";
  slug: string;
  canonicalPath: string;
  aliasPaths: string[];
  placeType:
    | "coastal_capital_and_cruise_port"
    | "foothill_amphitheatre_and_park"
    | "alpine_interstate_corridor"
    | "river_port_and_cultural_city"
    | "desert_resort_and_canyon_gateway";
  title: string;
  subtitle: string;
  heroSummary: string;
  primaryCoordinate: {
    lat: number;
    lng: number;
    label: string;
    canonicalLocationPath: string;
    canonicalApiPath: string;
  };
  secondaryCoordinates: Array<{
    lat: number;
    lng: number;
    label: string;
    elevationFt: number;
    canonicalLocationPath: string;
    canonicalApiPath: string;
    roleInPlace: string;
  }>;
  lastReviewedAt: string;
  coverageScopeStatement: string;
  atAGlance: Array<{
    label: string;
    value: string;
    authorityType: AuthorityType;
  }>;
  overviewAndContext: {
    sectionTitle: string;
    leadSummary: string;
    geographyAndTopography: string[];
    historyAndCulture: string[];
    localContextWhatItMeans: string[];
    citationIds: string[];
  };
  gettingThereAndAround: {
    sectionTitle: string;
    leadSummary: string;
    modes: TransportModeGuide[];
    keyDecisionTakeaway: string;
  };
  beforeYouGo: {
    sectionTitle: string;
    leadSummary: string;
    whyCoordinatesCannotAnswerEntry: string;
    entryScenarios: EntryScenarioRule[];
    safetyHealthAndEmergency: SafetyHealthEmergencyItem[];
  };
  timingSeasonalityAndAccess: {
    sectionTitle: string;
    leadSummary: string;
    items: SeasonalityAndConstraintItem[];
  };
  operationalBoundaries: OperationalNonConflationNotice;
  specialistHandoffs: {
    sectionTitle: string;
    leadSummary: string;
    contextControls: {
      supportsDate: boolean;
      supportsPartySize: boolean;
      customSelectorLabel?: string;
      customSelectorParam?: string;
      customSelectorOptions?: Array<{ value: string; label: string }>;
    };
    options: SpecialistHandoffOption[];
  };
  relationships: RelatedPlaceLink[];
  evidenceRegistry: EvidenceCitation[];
};

export type CapabilityTruthItem = {
  capability: string;
  category: "weather_atmospheric" | "hazards_water" | "infrastructure_aviation" | "venue_road_transit" | "booking_commerce";
  status: "live_integrated_global" | "live_integrated_us_regional" | "pilot_bounded_feed" | "official_link_only" | "not_integrated";
  actualImplementation: string;
  geographicScope: string;
  commonMisconceptionToAvoid: string;
  primarySources: string[];
};

export const DCC_CAPABILITY_TRUTH_MATRIX: CapabilityTruthItem[] = [
  {
    capability: "Current Weather, 12-Hour & 3-Day Forecast, Modeled Snow Depth",
    category: "weather_atmospheric",
    status: "live_integrated_global",
    actualImplementation:
      "Live HTTP integration via Open-Meteo Forecast API (/api/location/{lat}/{lng}). Returns current temperature, wind, precipitation, weather codes, and gridded model snow_depth.",
    geographicScope: "Global (any valid latitude/longitude coordinate)",
    commonMisconceptionToAvoid:
      "Gridded model snow_depth is an atmospheric model estimate at the coordinate grid cell, not an official ski-area mid-mountain stake or SNOTEL avalanche telemetry reading.",
    primarySources: ["Open-Meteo Forecast API (open-meteo.com)"],
  },
  {
    capability: "Air Quality (US AQI, PM2.5, PM10, Ozone, UV Index)",
    category: "weather_atmospheric",
    status: "live_integrated_global",
    actualImplementation:
      "Live HTTP integration via Open-Meteo / CAMS Air Quality API.",
    geographicScope: "Global gridded model coverage",
    commonMisconceptionToAvoid:
      "Model AQI reflects regional atmospheric dispersion and may lag localized canyon wildfire smoke pockets.",
    primarySources: ["Open-Meteo Air Quality API / Copernicus CAMS"],
  },
  {
    capability: "Official Weather Warnings & Forecast Narratives (NWS)",
    category: "hazards_water",
    status: "live_integrated_us_regional",
    actualImplementation:
      "Live HTTP integration via U.S. National Weather Service API (api.weather.gov/alerts/active and point forecast periods).",
    geographicScope: "United States and U.S. territories only",
    commonMisconceptionToAvoid:
      "Outside U.S. jurisdiction, NWS returns unavailable (not '0 alerts'). Even inside the U.S., 0 active weather alerts does not mean roads are open or a venue is operating.",
    primarySources: ["National Weather Service (api.weather.gov)"],
  },
  {
    capability: "Seismic Activity (Earthquakes) & Natural Hazard Events",
    category: "hazards_water",
    status: "live_integrated_global",
    actualImplementation:
      "Live HTTP integration via USGS Earthquake Hazards Program (500 km radius, past 7 days) and NASA EONET v3 open natural events.",
    geographicScope: "Global",
    commonMisconceptionToAvoid:
      "Reports cataloged geophysical events; does not replace local civil defense or tsunami evacuation sirens.",
    primarySources: ["USGS (earthquake.usgs.gov)", "NASA EONET (eonet.gsfc.nasa.gov)"],
  },
  {
    capability: "River Gauges (NWPS), Tides (CO-OPS), Marine Buoys (NDBC) & GloFAS River Discharge",
    category: "hazards_water",
    status: "live_integrated_us_regional",
    actualImplementation:
      "Live integration with NOAA NWPS river gauges (U.S.), NOAA CO-OPS tide stations (within 125 km, U.S. coasts), NOAA NDBC buoys (within 100 km), and Open-Meteo GloFAS/Marine models.",
    geographicScope: "U.S. watersheds/coasts for NOAA sensors; global coastal/river grid for Open-Meteo models",
    commonMisconceptionToAvoid:
      "River stage or wave height readings do not establish whether commercial rafting, Kayaking, or harbor tendering is permitted by local outfitters or the U.S. Coast Guard.",
    primarySources: ["NOAA NWPS (api.water.noaa.gov)", "NOAA Tides & Currents", "NOAA NDBC", "Open-Meteo Marine & Flood APIs"],
  },
  {
    capability: "Nearby Physical Infrastructure (Airports, Ferry Terminals, Transit Stops, Hospitals)",
    category: "infrastructure_aviation",
    status: "live_integrated_global",
    actualImplementation:
      "Live spatial query via OpenStreetMap Overpass API within 5 km of coordinate, plus NOAA/NWS Aviation Weather (aviationweather.gov) METAR/TAF for nearby ICAO airports.",
    geographicScope: "Global for OSM physical points; ICAO airports for METAR/TAF",
    commonMisconceptionToAvoid:
      "OSM identifies physical bus stops, rail stations, and ferry terminals—it does NOT ingest live transit schedules, bus headways, service alerts, or ferry sailing cancellations.",
    primarySources: ["OpenStreetMap Overpass API", "NOAA Aviation Weather Center (aviationweather.gov)"],
  },
  {
    capability: "Venue Lightning Holds, Concert Delays & Park Operating Status",
    category: "venue_road_transit",
    status: "official_link_only",
    actualImplementation:
      "NOT automated in DCC. DCC monitors NWS thunderstorm forecasts and weather codes, and links directly to official venue status channels.",
    geographicScope: "Venue-specific (e.g., Red Rocks Park & Amphitheatre)",
    commonMisconceptionToAvoid:
      "A thunderstorm forecast or lightning weather code is NOT a venue lightning hold. Only on-site venue management and municipal park authorities issue binding gate holds, shelter-in-place orders, or cancellations.",
    primarySources: ["Red Rocks Park & Amphitheatre / City and County of Denver (redrocksonline.com)"],
  },
  {
    capability: "Highway Traction Laws (Code 15), Chain Laws (Code 16) & Mountain Pass Closures",
    category: "venue_road_transit",
    status: "official_link_only",
    actualImplementation:
      "NOT automated in DCC. DCC explains statutory traction/chain requirements and links directly to CDOT COtrip for real-time highway restrictions.",
    geographicScope: "Colorado State Highways & I-70 Mountain Corridor",
    commonMisconceptionToAvoid:
      "Sub-freezing temperatures or modeled snowfall on a DCC coordinate page do NOT indicate whether CDOT has activated or lifted a Passenger Vehicle Traction Law or safety closure.",
    primarySources: ["Colorado Department of Transportation — COtrip (cotrip.org)"],
  },
  {
    capability: "Public Transit & Marine Ferry Schedules (RTD, Bustang, Summit Stage, Capital Transit, AMHS)",
    category: "venue_road_transit",
    status: "official_link_only",
    actualImplementation:
      "Curated route architecture and transfer rules paired with clearly labeled links to official operator schedules and rider alerts.",
    geographicScope: "Corridor-specific (Juneau/Alaska, Denver Metro, Summit County/I-70)",
    commonMisconceptionToAvoid:
      "DCC does not ingest GTFS-RT real-time vehicle positions or live dispatch cancellations. Always confirm departure times with the operating agency.",
    primarySources: ["Capital Transit Juneau", "Alaska Marine Highway System", "RTD Denver", "CDOT Bustang", "Summit Stage"],
  },
  {
    capability: "Entry, Visa, Passport & Border Crossing Rules",
    category: "venue_road_transit",
    status: "official_link_only",
    actualImplementation:
      "Structured dependency model organized by nationality, passport type, residence, transit/cruise routing, purpose, and dates, linking directly to U.S. CBP, U.S. State Dept, and Canada CBSA/IRCC.",
    geographicScope: "United States & Canada ports of entry",
    commonMisconceptionToAvoid:
      "Coordinates alone cannot determine entry eligibility. A U.S. citizen on a closed-loop Seattle cruise faces different document rules if they book a Skagway/Juneau excursion crossing into Canada.",
    primarySources: ["U.S. Customs and Border Protection (cbp.gov)", "U.S. Dept. of State (travel.state.gov)", "Canada CBSA / IRCC (canada.ca)"],
  },
  {
    capability: "Downstream Specialist Handoffs & OCTO Booking Connectivity",
    category: "booking_commerce",
    status: "pilot_bounded_feed",
    actualImplementation:
      "Two operator /.well-known/dcc feeds are registered (GoSno in CO Rockies, Vibe Around Town in USVI). Context-preserving link handoffs connect to specialist portals (Party at Red Rocks, Juneau Flight Deck, GoSno, Welcome to Alaska). OCTO Core v1.2 endpoints exist as a specification/onboarding layer; zero external OCTO suppliers are live-authorized in production.",
    geographicScope: "Specific partner corridors (Juneau, Red Rocks, I-70/Breckenridge, USVI)",
    commonMisconceptionToAvoid:
      "DCC is not a universal global OTA checkout engine. Where specialist handoffs exist, DCC forwards known trip context (date, party size, port/venue) without inventing parameters.",
    primarySources: ["DCC Endpoint Registry", "Party at Red Rocks", "Juneau Flight Deck", "GoSno"],
  },
];

export const TRAVEL_REFERENCE_NODES: Record<TravelReferenceNode["id"], TravelReferenceNode> = {
  juneau: {
    id: "juneau",
    slug: "juneau",
    canonicalPath: "/juneau",
    aliasPaths: ["/ports/juneau", "/alaska"],
    placeType: "coastal_capital_and_cruise_port",
    title: "Juneau, Alaska — Destination & Cruise Port Reference",
    subtitle:
      "Roadless capital geography, downtown vs. Auke Bay port logistics, closed-loop vs. cross-border document rules, and live Gastineau Channel conditions.",
    heroSummary:
      "Juneau is the only U.S. state capital on the North American mainland with no road connection to the outside highway network. Every visitor arrives by sea or air, squeezed into a narrow shelf between the Gastineau Channel and the 1,500-square-mile Juneau Icefield. Good decisions here depend on understanding dock geometry, transfer distances to Mendenhall Valley and Auke Bay, rapidly shifting marine ceilings, and strict cruise all-aboard buffers.",
    primaryCoordinate: {
      lat: 58.3019,
      lng: -134.4197,
      label: "Juneau Downtown & Gastineau Channel, AK",
      canonicalLocationPath: "/location/58.30190/-134.41970",
      canonicalApiPath: "/api/location/58.30190/-134.41970",
    },
    secondaryCoordinates: [
      {
        lat: 58.2989,
        lng: -134.4053,
        label: "Juneau Cruise Ship Docks (AJ / Franklin / Marine Park)",
        elevationFt: 16,
        canonicalLocationPath: "/location/58.29890/-134.40530",
        canonicalApiPath: "/api/location/58.29890/-134.40530",
        roleInPlace: "Primary deep-water cruise berths and tender landings along South Franklin Street.",
      },
      {
        lat: 58.3831,
        lng: -134.6464,
        label: "Auke Bay Harbor & Statter Harbor (13 mi NW)",
        elevationFt: 22,
        canonicalLocationPath: "/location/58.38310/-134.64640",
        canonicalApiPath: "/api/location/58.38310/-134.64640",
        roleInPlace: "Departure basin for whale-watching vessels and the Alaska Marine Highway System ferry terminal.",
      },
      {
        lat: 58.4184,
        lng: -134.5466,
        label: "Mendenhall Glacier Visitor Center (USFS)",
        elevationFt: 85,
        canonicalLocationPath: "/location/58.41840/-134.54660",
        canonicalApiPath: "/api/location/58.41840/-134.54660",
        roleInPlace: "Tongass National Forest glacier viewpoint, Nugget Falls trailhead, and steep valley microclimate.",
      },
    ],
    lastReviewedAt: "2026-10-23",
    coverageScopeStatement:
      "Combines curated, source-attributed reference guidance for the City and Borough of Juneau with live NOAA/NWS, CO-OPS tide, PAJN aviation, and Open-Meteo coordinate feeds.",
    atAGlance: [
      {
        label: "External Road Access",
        value: "None (Air via JNU or Sea via Cruise / AMHS Ferry only)",
        authorityType: "official_rule",
      },
      {
        label: "Downtown to Mendenhall / Auke Bay",
        value: "12–13.5 miles via Egan Drive (20–30 min each way by road)",
        authorityType: "dcc_interpretation",
      },
      {
        label: "Cruise All-Aboard Buffer",
        value: "90 minutes base (60 min for downtown floatplane docks)",
        authorityType: "editorial_recommendation",
      },
      {
        label: "Time Zone",
        value: "Alaska Time (AKST UTC-9 / AKDT UTC-8)",
        authorityType: "official_rule",
      },
    ],
    overviewAndContext: {
      sectionTitle: "Overview, Geography, History & Local Context",
      leadSummary:
        "Understanding Juneau starts with its physical compression: there is no ring road, no interstate escape route, and no way to drive in from the rest of Alaska or Canada.",
      geographyAndTopography: [
        "Juneau occupies a steep, glacially carved corridor along the Gastineau Channel in the Alexander Archipelago of Southeast Alaska (part of the Tongass National Forest). Immediately east of downtown, Mount Juneau (3,576 ft) and Mount Roberts (3,819 ft) rise almost vertically from tidewater, trapping marine cloud decks from the Gulf of Alaska.",
        "Behind those coastal ridges lies the Juneau Icefield—roughly 1,500 square miles of interconnected ice feeding more than 30 valley glaciers, including Mendenhall Glacier (12 miles northwest of downtown) and Taku Glacier. Because the City and Borough of Juneau spans 3,255 square miles of ice, mountains, and water, local paved road mileage is limited primarily to the ~40-mile Glacier Highway / Egan Drive spine.",
      ],
      historyAndCulture: [
        "For millennia before European contact, the Auke (*Áak'w Kwáan*) and Taku (*T'aaqú Kwáan*) clans of the Lingít (Tlingit) nation stewarded these waters, naming the downtown creek basin *Dzantik'i Heeni* ('Base of the Flounder's Creek') for its abundant flatfish.",
        "In October 1880, Tlingit leader Kowee (*Kaawa.ée*) guided prospectors Joe Juneau and Richard Harris to gold-bearing quartz in Gold Creek, triggering an industrial hard-rock mining era anchored by the Alaska-Juneau (AJ) and Treadwell mines. Juneau replaced Sitka as Alaska's territorial capital in 1906 and remained the state capital upon statehood in 1959.",
        "Today, Juneau is a global center for Northwest Coast Indigenous art—celebrated by the Sealaska Heritage Institute at the Walter Soboleff Center downtown—alongside working commercial fisheries, state government, and seasonal cruise tourism.",
      ],
      localContextWhatItMeans: [
        "For travelers, Juneau's geography means every trip outside the historic downtown core requires a deliberate vehicle or boat transfer along Egan Drive. You cannot walk from the cruise ships to Mendenhall Glacier or Auke Bay whale-watching harbors.",
        "Microclimates vary sharply over 12 miles: downtown Docks A–F along South Franklin Street can be under a 1,200-foot drizzle ceiling while Auke Bay (sheltered to the northwest) has clear surface visibility for marine wildlife, or vice versa.",
      ],
      citationIds: ["jun-cbj-harbors", "jun-usfs-mendenhall", "jun-shi-heritage"],
    },
    gettingThereAndAround: {
      sectionTitle: "Getting There & Getting Around",
      leadSummary:
        "Because Juneau is roadless to the outside world, entry is strictly air or marine, and local movement splits into three zones: Downtown/South Franklin, Mendenhall Valley/Airport (9–12 mi NW), and Auke Bay/Out the Road (13+ mi NW).",
      modes: [
        {
          id: "jnu-airport",
          modeName: "Juneau International Airport (JNU / PAJN)",
          category: "air",
          operatorOrAuthority: "City and Borough of Juneau — Juneau International Airport",
          routeOrCoverage: "Located 8.5 miles northwest of downtown in the Mendenhall Valley; primary jet service via Alaska Airlines (Seattle, Anchorage, Sitka, Ketchikan, Petersburg, Wrangell) plus regional bush/floatplane operators.",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "DCC ingests live NOAA Aviation Weather (METAR/TAF) for PAJN to show ceiling, visibility, and wind conditions in the Mendenhall Valley. However, individual airline flight status and helicopter/floatplane dispatch decisions are made directly by carriers and FAA Part 135 operators.",
          practicalConstraints: [
            "Mountainous terrain requires specialized Required Navigation Performance (RNP) approaches originally pioneered at JNU.",
            "Helicopter glacier tour bases operate primarily from the airport perimeter (8.5 mi from cruise docks), requiring a 20-minute ground shuttle each way.",
          ],
          officialResourceUrl: "https://juneau.org/airport",
          officialResourceLabel: "Juneau International Airport (Official CBJ Portal)",
          citationIds: ["jun-airport-official", "jun-noaa-aviation"],
        },
        {
          id: "juneau-cruise-docks",
          modeName: "Downtown Cruise Berths & AJ Dock / Tender Landings",
          category: "marine_port",
          operatorOrAuthority: "City and Borough of Juneau Docks & Harbors + Private Terminal Operators",
          routeOrCoverage: "Four primary large-ship berths: Alaska Steamship (AS) & Columbia/Cruise Terminal (CTF) near Marine Park, South Franklin Dock (FKL), and AJ Dock (1.2 miles south of Marine Park), plus intermediate tender floats.",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "Passengers berthing at AS or CTF step directly onto the downtown seawalk next to the Goldbelt Tram and Marine Park kiosk Plaza. Passengers at AJ Dock are ~1.2 miles south along a gravel/industrial road and generally rely on a 5-minute shuttle loop to reach downtown.",
          practicalConstraints: [
            "Ships anchored in Gastineau Channel must tender passengers ashore; tendering adds 30–45 minutes of queue friction in each direction.",
            "Confirm which dock your ship is assigned to before setting independent excursion meeting times.",
          ],
          officialResourceUrl: "https://juneau.org/harbors/cruise-ship-information",
          officialResourceLabel: "CBJ Docks & Harbors Cruise Information",
          citationIds: ["jun-cbj-harbors"],
        },
        {
          id: "amhs-ferry",
          modeName: "Alaska Marine Highway System (AMHS State Ferry)",
          category: "ferry",
          operatorOrAuthority: "Alaska Department of Transportation & Public Facilities (DOT&PF)",
          routeOrCoverage: "Auke Bay Ferry Terminal (13.5 miles northwest of downtown Juneau) connecting Bellingham (WA), Prince Rupert (BC), Ketchikan, Sitka, Haines, Skagway, and Gustavus.",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "The Auke Bay terminal is NOT within walking distance of downtown Juneau or the cruise ship docks. Foot passengers and vehicle travelers must arrange taxi, rideshare, or local bus + 1.5-mile walk.",
          practicalConstraints: [
            "Vehicle check-in closes strictly 1 to 2 hours prior to scheduled sailing depending on route.",
            "Capital Transit buses stop approximately 1.5 miles east of the ferry terminal building; plan a direct taxi if carrying luggage.",
          ],
          officialResourceUrl: "https://dot.alaska.gov/amhs/",
          officialResourceLabel: "Alaska Marine Highway System Official Schedules",
          citationIds: ["jun-amhs-official"],
        },
        {
          id: "capital-transit-and-shuttles",
          modeName: "Capital Transit Public Bus vs. Dedicated Excursion Shuttles",
          category: "public_transit",
          operatorOrAuthority: "City and Borough of Juneau — Capital Transit & USFS Permitted Operators",
          routeOrCoverage: "Capital Transit Routes 3 & 4 connect the Downtown Transit Center to Mendenhall Valley and Auke Bay.",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "While Capital Transit is inexpensive ($2 exact cash fare), its closest Mendenhall Valley stop (Mendenhall Loop Rd & Glacier Spur Rd) leaves a 1.5-mile walk each way to the Mendenhall Glacier Visitor Center. Cruise passengers on a 5–7 hour call should use permitted glacier/whale-watching shuttles or taxis rather than relying on municipal bus + 3 miles of road walking.",
          practicalConstraints: [
            "USFS commercial visitor caps limit how many commercial shuttle seats are available at Mendenhall Glacier during peak mid-summer ship overlaps.",
            "Rideshare (Uber/Lyft) supply in Juneau is small and frequently saturates when 3–5 large cruise ships disembark simultaneously.",
          ],
          officialResourceUrl: "https://juneaucapitaltransit.org/",
          officialResourceLabel: "Capital Transit Official Routes & Schedules",
          citationIds: ["jun-capital-transit", "jun-usfs-mendenhall"],
        },
      ],
      keyDecisionTakeaway:
        "If you are in Juneau on a cruise port call (typically 5 to 8 hours ashore), treat transport and excursion selection as a single decision: pick one primary corridor (Auke Bay whale watching, Airport helicopter icefield landing, or Mendenhall Valley) with round-trip dock transport included, and maintain a strict 90-minute buffer before ship departure.",
    },
    beforeYouGo: {
      sectionTitle: "Before You Go: Entry Rules, Safety Advisories, Health & Emergency Context",
      leadSummary:
        "Juneau sits in the United States (Alaska), but almost all marine and regional air itineraries interact with Canadian waters, ports (Victoria/Vancouver), or the Yukon border (via Skagway/Haines).",
      whyCoordinatesCannotAnswerEntry:
        "A coordinate lookup at 58.3019°N, 134.4197°W only tells you that Juneau is in U.S. jurisdiction. It cannot determine what travel documents you need because entry legality depends on your nationality, passport type, country of residence, whether your trip is domestic air vs. a closed-loop U.S. cruise vs. a one-way Vancouver cruise, whether you take a cross-border excursion into Canada, and your travel dates.",
      entryScenarios: [
        {
          id: "jun-entry-domestic-air",
          scenarioLabel: "U.S. Citizens & Lawful Residents Flying Nonstop from U.S. Airports (e.g., Seattle or Anchorage)",
          dependencies: {
            nationality: "U.S. Citizen or U.S. Lawful Permanent Resident",
            passportAndDocuments: "REAL ID-compliant state driver's license, U.S. Passport Book, U.S. Passport Card, or DHS Trusted Traveler Card (Global Entry/NEXUS)",
            residenceContext: "Domestic United States travel without touching Canadian territory",
            routingAndTransit: "Direct flights between U.S. states (e.g., SEA–JNU or ANC–JNU)",
            tripPurpose: "Tourism, business, or personal travel",
            dateAndValidityRule: "TSA REAL ID enforcement is active at U.S. airport security checkpoints; ID must be valid through return flight.",
          },
          officialRequirementSummary:
            "No international border is crossed on direct flights between Seattle/Anchorage and Juneau, so TSA domestic identification rules (REAL ID or passport) apply.",
          dccPracticalExplanation:
            "If your trip may enter Canada, check the requirements for your nationality and residence status before departure. U.S. citizens should carry appropriate citizenship documents; a passport book also supports international air travel. U.S. lawful permanent residents should carry a valid passport from their country of nationality (or an equivalent acceptable travel document) plus a valid Green Card or equivalent proof of U.S. permanent residence.",
          officialLinks: [
            {
              label: "TSA Acceptable Identification at Checkpoints",
              url: "https://www.tsa.gov/travel/security-screening/identification",
              issuingOrganization: "U.S. Transportation Security Administration (TSA)",
              note: "Official domestic air ID and REAL ID enforcement requirements.",
            },
          ],
          citationIds: ["jun-cbp-whti"],
        },
        {
          id: "jun-entry-closed-loop-cruise",
          scenarioLabel: "U.S. Citizens on Closed-Loop Cruises (Round-Trip Seattle) vs. Cross-Border Excursions",
          dependencies: {
            nationality: "U.S. Citizen",
            passportAndDocuments: "U.S. Passport Book (strongly recommended), WHTI-compliant Passport Card/Enhanced Driver's License, or government photo ID + official birth certificate (closed-loop sea only)",
            residenceContext: "U.S. domestic embarkation/disembarkation with mandatory foreign port call (typically Victoria, BC)",
            routingAndTransit: "Round-trip U.S. port cruise (closed-loop) vs. adding a Yukon/BC land excursion or emergency air return from Canada",
            tripPurpose: "Cruise tourism",
            dateAndValidityRule: "Document must remain valid through completion of voyage.",
          },
          officialRequirementSummary:
            "Under the Western Hemisphere Travel Initiative (WHTI), U.S. citizens on closed-loop cruises beginning and ending at the same U.S. port may technically re-enter the U.S. by sea with a government photo ID and official birth certificate—HOWEVER, a Passport Book is required if you ever need to fly home from a Canadian port in an emergency, and WHTI-compliant border documents are required for any cross-border excursion into Canada (such as White Pass / Yukon routes during the same voyage).",
          dccPracticalExplanation:
            "Do not rely on birth-certificate-only closed-loop exceptions if your Alaska itinerary includes cross-border rail/highway excursions in nearby Skagway or if you want emergency air medical/travel flexibility through Vancouver or Whitehorse.",
          officialLinks: [
            {
              label: "U.S. CBP Western Hemisphere Travel Initiative (WHTI) & Cruise Rules",
              url: "https://www.cbp.gov/travel/us-citizens/western-hemisphere-travel-initiative",
              issuingOrganization: "U.S. Customs and Border Protection (CBP)",
              note: "Authoritative U.S. sea and land entry document requirements.",
            },
            {
              label: "Canada Border Services Agency (CBSA) — Visitors to Canada",
              url: "https://www.cbsa-asfc.gc.ca/travel-voyage/ivc-rnc-eng.html",
              issuingOrganization: "Canada Border Services Agency (CBSA)",
              note: "Canadian entry and admissibility rules (including Victoria port calls and Yukon border crossings).",
            },
          ],
          citationIds: ["jun-cbp-whti", "jun-cbsa-entry"],
        },
        {
          id: "jun-entry-international-oneway",
          scenarioLabel: "International Nationals & One-Way Vancouver–Alaska Cruise / Air-Sea Travelers",
          dependencies: {
            nationality: "Non-U.S. / Non-Canadian Nationals (Visa-Exempt vs. Visa-Required) & One-Way Vancouver Route Passengers",
            passportAndDocuments: "Valid passport and applicable U.S. entry documents for your nationality and status. For Canada, most visa-exempt foreign nationals need an eTA for air arrival/transit, but not land/sea entry. Eligible citizens of select visa-required countries may also use an eTA for air travel if they meet IRCC conditions; that air-only eligibility does not replace a visitor visa for cruise, rail, bus or car entry. U.S. citizens and lawful permanent residents are exempt from Canadian eTA requirements. U.S. permanent residents carry their nationality passport (or an equivalent acceptable travel document) plus a valid Green Card or equivalent proof of status.",
            residenceContext: "International arrival or open-jaw U.S.–Canada air/sea itinerary",
            routingAndTransit: "Air arrival into Vancouver (YVR) vs. sea arrival at Victoria/Vancouver cruise ports or land excursions into British Columbia / Yukon",
            tripPurpose: "Tourism / Transit",
            dateAndValidityRule: "Obtain applicable U.S. and Canadian authorizations before travel. Canadian eTA eligibility depends on nationality, residence/status, prior visa history and air routing; use the official IRCC checker and separately check any Canadian cruise or land entry.",
          },
          officialRequirementSummary:
            "Because Alaska cruises transit both U.S. ports (Juneau, Ketchikan, Skagway) and Canadian ports (Vancouver or Victoria), non-U.S. travelers must satisfy entry rules for BOTH countries—but Canadian document rules depend strictly on mode of entry (air vs. land/sea) and nationality.",
          dccPracticalExplanation:
            "Do not overgeneralize the Canadian eTA: (1) U.S. citizens and U.S. lawful permanent residents are exempt; permanent residents carry a valid nationality passport (or an equivalent acceptable travel document) plus a Green Card or equivalent valid proof of U.S. status. (2) Most visa-exempt foreign nationals need an eTA ONLY if flying into or through a Canadian airport; eTA is not required for their land/sea entry. (3) Eligible citizens of select visa-required countries may apply for an eTA for air travel if they meet IRCC conditions, including qualifying Canadian or U.S. visa history. This exception does not cover arrival by cruise ship, car, bus or train, for which a visitor visa remains required unless another exemption applies. Check each border crossing in your itinerary using the official IRCC tool.",
          officialLinks: [
            {
              label: "Official U.S. ESTA Application & Visa Waiver Info",
              url: "https://esta.cbp.dhs.gov/",
              issuingOrganization: "U.S. Customs and Border Protection (CBP)",
              note: "Official U.S. government ESTA portal.",
            },
            {
              label: "Government of Canada — Electronic Travel Authorization (eTA) Eligibility by Mode",
              url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html",
              issuingOrganization: "Immigration, Refugees and Citizenship Canada (IRCC)",
              note: "Official IRCC eTA eligibility, exemptions and air-entry requirements; land/sea requirements differ.",
            },
            {
              label: "IRCC — Check Whether You Need a Visa or eTA",
              url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/check-visa-eta.html",
              issuingOrganization: "Immigration, Refugees and Citizenship Canada (IRCC)",
              note: "Check nationality, residence status and travel mode for your actual itinerary.",
            },
            {
              label: "IRCC — Air-Only eTA Eligibility for Select Visa-Required Countries",
              url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta/eligibility/eta-x.html",
              issuingOrganization: "Immigration, Refugees and Citizenship Canada (IRCC)",
              note: "Eligibility conditions and the separate visitor-visa requirement for cruise and land entry.",
            },
            {
              label: "IRCC — Documents for U.S. Lawful Permanent Residents",
              url: "https://www.ircc.canada.ca/english/helpcentre/answer.asp?qnum=1053&top=23",
              issuingOrganization: "Immigration, Refugees and Citizenship Canada (IRCC)",
              note: "Nationality passport or equivalent travel document plus valid proof of U.S. permanent residence.",
            },
          ],
          citationIds: ["jun-cbp-whti", "jun-cbsa-entry", "jun-ircc-eta-air-exception", "jun-ircc-us-permanent-resident"],
        },
      ],
      safetyHealthAndEmergency: [
        {
          id: "jun-safety-glacial-marine",
          category: "official_advisory",
          title: "Glacial Ice, Outburst Floods (Jökulhlaup) & Cold-Water Marine Safety",
          issuingAuthority: "U.S. Forest Service (Tongass National Forest) & National Weather Service Juneau",
          authorityType: "official_rule",
          integrationStatus: "curated_verified",
          summary:
            "Mendenhall Lake and Gastineau Channel water temperatures remain near 38°F–48°F (3°C–9°C) even in July. Approaching calving glacier faces or entering sub-glacial ice caves is life-threatening due to sudden collapse. Additionally, Suicide Basin above Mendenhall Glacier periodically releases glacial lake outburst floods (typically late summer), which can trigger rapid Mendenhall River flood warnings.",
          travelerAction:
            "Stay on marked USFS trails at Mendenhall Glacier, never climb onto or under glacier termini without a permitted guide, and check live NWS Juneau hydrologic alerts in late summer.",
          officialUrl: "https://www.fs.usda.gov/recarea/tongass/recarea/?recid=78952",
          officialUrlLabel: "USFS Mendenhall Glacier Visitor Center Safety & Alerts",
          citationIds: ["jun-usfs-mendenhall", "jun-nws-live"],
        },
        {
          id: "jun-safety-wildlife",
          category: "official_advisory",
          title: "Black & Brown Bear Activity Along Steep Creek & Coastal Trails",
          issuingAuthority: "U.S. Forest Service & Alaska Department of Fish and Game",
          authorityType: "official_rule",
          integrationStatus: "curated_verified",
          summary:
            "From July through September, sockeye and coho salmon runs attract black bears (and occasionally brown bears) to Steep Creek right beside the Mendenhall Visitor Center boardwalks.",
          travelerAction:
            "Food, flavored beverages, and scented items are strictly prohibited on the Steep Creek elevated boardwalks during salmon season. Follow USFS ranger closures immediately.",
          officialUrl: "https://www.adfg.alaska.gov/index.cfm?adfg=livingwithbears.main",
          officialUrlLabel: "Alaska Dept. of Fish & Game Bear Safety Guidance",
          citationIds: ["jun-usfs-mendenhall"],
        },
        {
          id: "jun-health-emergency",
          category: "emergency_services",
          title: "Emergency Medical, Hospital & Coast Guard Search and Rescue",
          issuingAuthority: "Bartlett Regional Hospital / Capital City Fire/Rescue / USCG Sector Southeast Alaska",
          authorityType: "official_resource_link",
          integrationStatus: "linked_official_resource",
          summary:
            "Bartlett Regional Hospital (3260 Hospital Dr, Juneau, AK 99801; +1-907-796-8900) is the sole acute-care hospital in Juneau (located ~3.5 miles northwest of downtown off Egan Drive). Critical trauma or cardiac cases requiring tertiary care must be medevaced by air to Anchorage or Seattle.",
          travelerAction:
            "Dial 911 for land emergencies or VHF Channel 16 / USCG Sector Southeast Alaska (+1-907-463-2000) for marine emergencies. Travelers with complex medical needs should verify air-ambulance evacuation insurance before visiting roadless Alaska ports.",
          officialUrl: "https://www.bartletthospital.org/",
          officialUrlLabel: "Bartlett Regional Hospital (Official Emergency Info)",
          citationIds: ["jun-bartlett-hospital"],
        },
      ],
    },
    timingSeasonalityAndAccess: {
      sectionTitle: "Timing, Seasonality, Accessibility, Closures & Practical Constraints",
      leadSummary:
        "Juneau's operating rhythm changes dramatically between the May–September cruise window and the quiet, snow-heavy October–April off-season.",
      items: [
        {
          id: "jun-seasonality-cruise",
          category: "seasonality",
          title: "May–September Cruise Season & Wildlife Windows",
          windowOrScope: "Early May through mid-October",
          authorityType: "dcc_interpretation",
          factualBasis:
            "Daylight reaches ~18.5 hours around the June solstice. Humpback whales feed in Stephens Passage / Auke Bay from late April through October. Helicopter glacier dog-sledding camps on the Juneau Icefield typically operate mid-May through late August until surface snowpack thins.",
          dccInterpretation:
            "May and June offer the longest daylight, deepest snowpack for glacier dog-sledding, and slightly drier statistical averages; July and August bring peak salmon runs (and bear viewing at Steep Creek) alongside higher rainfall frequency; September brings dramatic fall tundra colors and northern lights potential on clear nights, but shorter daylight and higher storm risk.",
          citationIds: ["jun-usfs-mendenhall", "jun-nws-live"],
        },
        {
          id: "jun-timing-ship-overlap",
          category: "timing_window",
          title: "Multi-Ship Congestion & Return Buffer Discipline",
          windowOrScope: "11:00 AM – 3:30 PM Peak Port Overlap",
          authorityType: "editorial_recommendation",
          factualBasis:
            "Up to 5 large cruise vessels can berth/anchor in Juneau simultaneously, placing 12,000–16,000 passengers ashore along South Franklin Street and Egan Drive.",
          dccInterpretation:
            "DCC enforces a standard 90-minute pre-departure return buffer for Juneau port planning (60 minutes for downtown floatplane bases). Never schedule back-to-back independent tours that require crossing between Auke Bay and Downtown with less than 45 minutes of transition slack.",
          citationIds: ["jun-cbj-harbors"],
        },
        {
          id: "jun-accessibility",
          category: "accessibility",
          title: "Wheelchair & Limited-Mobility Access Across Docks, Tram & Glacier",
          windowOrScope: "Downtown Seawalk, Goldbelt Tram & Mendenhall Visitor Center",
          authorityType: "curated_verified" as unknown as AuthorityType,
          factualBasis:
            "The Mendenhall Glacier Visitor Center features an elevator, paved Photo Point trail, and wheelchair-accessible Steep Creek boardwalk. However, Juneau's up-to-23-foot tidal range means cruise ship gangways and Auke Bay small-boat harbor ramps become very steep at extreme low tide.",
          dccInterpretation:
            "Check live NOAA tide stage (integrated below) if someone in your party uses a mobility aid: boarding a whale-watching catamaran at Statter Harbor or a cruise gangway near minus-low tide requires navigating steeper ramp grades.",
          officialUrl: "https://www.fs.usda.gov/recarea/tongass/recarea/?recid=78952",
          officialUrlLabel: "USFS Mendenhall Accessibility Details",
          citationIds: ["jun-usfs-mendenhall", "jun-noaa-tides"],
        },
        {
          id: "jun-closures",
          category: "closure_or_restriction",
          title: "Mendenhall Visitor Center Hours & Commercial Permit Caps",
          windowOrScope: "May–Sept Daily (8:00 AM – 7:00 PM) vs. Winter Fri–Sun Hours",
          authorityType: "official_rule",
          factualBasis:
            "The U.S. Forest Service enforces seasonal visitor center hours and strict commercial transport allocation limits in the Mendenhall Glacier Recreation Area.",
          dccInterpretation:
            "Because commercial drop-off permits are capped, walk-up glacier shuttle tickets downtown frequently sell out by mid-morning on heavy ship days. Lock in glacier transport ahead of arrival or plan a coastal/downtown alternative.",
          officialUrl: "https://www.fs.usda.gov/recarea/tongass/recarea/?recid=78952",
          officialUrlLabel: "USFS Official Hours & Fee Schedule",
          citationIds: ["jun-usfs-mendenhall"],
        },
      ],
    },
    operationalBoundaries: {
      headline: "Live Conditions vs. Marine & Aviation Dispatch Authority",
      weatherVsOperationsExplanation:
        "DCC integrates live NOAA/NWS weather alerts, Open-Meteo atmospheric models, NOAA CO-OPS tide stages, and PAJN airport METAR/TAF aviation observations for Juneau. However, weather data on this page does NOT establish whether a helicopter icefield flight, floatplane tour, Goldbelt Tram, or whale-watching vessel is operating.",
      missingOrExpiredDataRule:
        "If any upstream NOAA, NWS, or aviation sensor is temporarily unreachable or expired, DCC marks that feed as 'Unavailable / Unverified'—never as '0 alerts' or 'All Clear'.",
      whatIsLiveIntegrated: [
        "U.S. National Weather Service (NWS Juneau) active marine/land warnings and point forecast periods",
        "NOAA CO-OPS Juneau tide station water levels and high/low predictions",
        "NOAA/NWS Aviation Weather Center live METAR & TAF for Juneau International Airport (PAJN)",
        "Open-Meteo current weather, 12-hour/3-day forecast, and GloFAS/Marine coastal models",
        "USGS 500 km earthquake feed and NOAA NWPS river gauges (including Mendenhall River when reported)",
      ],
      whatRequiresOfficialExternalCheck: [
        {
          capability: "Helicopter & Floatplane Weather Holds",
          whyNotAutomated:
            "FAA Part 135 operators make flight-by-flight go/no-go calls based on localized icefield ceiling cameras and pilot weather minimums, which can differ from PAJN runway METARs.",
          officialSourceLabel: "Confirm directly with your booked flightseeing operator or Juneau Flight Deck",
          officialSourceUrl: "https://juneauflightdeck.com",
        },
        {
          capability: "Cruise Ship Berth Assignment & Tender Status",
          whyNotAutomated:
            "Harbor berth swaps and captain tender suspensions depend on real-time harbor master and vessel bridge decisions.",
          officialSourceLabel: "CBJ Docks & Harbors Cruise Schedule",
          officialSourceUrl: "https://juneau.org/harbors/cruise-ship-information",
        },
        {
          capability: "Mendenhall Glacier Trail & Bear Closures",
          whyNotAutomated:
            "USFS rangers close sections of Steep Creek or lakeside trails dynamically for bear activity or high water.",
          officialSourceLabel: "USFS Tongass National Forest — Mendenhall Alerts",
          officialSourceUrl: "https://www.fs.usda.gov/recarea/tongass/recarea/?recid=78952",
        },
      ],
    },
    specialistHandoffs: {
      sectionTitle: "Specialist Guides & Context-Preserving Excursion Handoffs",
      leadSummary:
        "Once you understand how Juneau's geography, dock buffers, and weather ceilings work, you can either explore independently using the official resources above or carry your port-day context into DCC's Juneau excursion specialists.",
      contextControls: {
        supportsDate: true,
        supportsPartySize: true,
        customSelectorLabel: "Arrival Dock / Port Mode",
        customSelectorParam: "port_dock",
        customSelectorOptions: [
          { value: "downtown_berth", label: "Downtown Berth (AS / CTF / Franklin)" },
          { value: "aj_dock", label: "AJ Dock (1.2 mi South)" },
          { value: "tender_anchor", label: "Anchored / Tendering Ashore" },
          { value: "independent_air_ferry", label: "Independent Traveler (JNU / Ferry)" },
        ],
      },
      options: [
        {
          id: "handoff-juneau-flight-deck",
          partnerName: "Juneau Flight Deck",
          partnerRole: "excursion_specialist",
          integrationMode: "context_handoff_link",
          description:
            "Dedicated Juneau comparison specialist for helicopter glacier landings vs. Auke Bay whale watching, built around cruise-ship all-aboard windows and weather fallback logic.",
          whenItHelps:
            "Best when you want to compare helicopter icefield landings and whale-watching departures that fit your exact ship call window.",
          noPurchaseRequiredNote:
            "Carries your selected date and party size into the Juneau Flight Deck planner. No purchase is required to compare routes.",
          baseUrl: "https://juneauflightdeck.com/helicopter",
          supportedContextParams: ["date", "partySize", "shipOrPort"],
          defaultParams: {
            source_surface: "dcc_juneau_reference",
            destination: "juneau",
          },
        },
        {
          id: "handoff-welcome-to-alaska",
          partnerName: "Welcome to Alaska Tours",
          partnerRole: "specialist_guide",
          integrationMode: "context_handoff_link",
          description:
            "Multi-port Southeast Alaska shore-excursion guide covering Juneau, Skagway, and Ketchikan so you avoid booking duplicate glacier or wildlife tours across ports.",
          whenItHelps:
            "Best when deciding whether to do your glacier flight in Juneau vs. the White Pass railway in Skagway or floatplanes in Ketchikan.",
          noPurchaseRequiredNote:
            "Forwards your travel date and party context so you can compare multi-port tradeoffs.",
          baseUrl: "https://welcometoalaskatours.com/ports/juneau",
          supportedContextParams: ["date", "partySize", "shipOrPort"],
          defaultParams: {
            source_surface: "dcc_juneau_reference",
            port: "juneau",
          },
        },
      ],
    },
    relationships: [
      {
        id: "rel-jun-coord-primary",
        label: "Juneau Coordinate Intelligence (58.30190, -134.41970)",
        relationship: "canonical_coordinate",
        href: "/location/58.30190/-134.41970",
        coordinate: { lat: 58.3019, lng: -134.4197 },
        summary: "Full multi-source telemetry node for Downtown Juneau & Gastineau Channel.",
      },
      {
        id: "rel-jun-coord-port",
        label: "Juneau Cruise Docks Coordinate (58.29890, -134.40530)",
        relationship: "secondary_coordinate",
        href: "/location/58.29890/-134.40530",
        coordinate: { lat: 58.2989, lng: -134.4053 },
        summary: "Telemetry node anchored directly at South Franklin cruise ship berths.",
      },
      {
        id: "rel-jun-port",
        label: "Juneau Cruise Port Decision Node",
        relationship: "port",
        href: "/ports/juneau",
        summary: "Port-specific shore-day sequencing and berth-to-excursion routing.",
      },
      {
        id: "rel-jun-region-alaska",
        label: "Alaska Region & Multi-Port Hub",
        relationship: "region",
        href: "/alaska",
        summary: "Southeast Alaska regional hub linking Juneau, Skagway, and Ketchikan.",
      },
      {
        id: "rel-jun-ports-dir",
        label: "DCC Cruise Ports Directory",
        relationship: "port",
        href: "/ports",
        summary: "Compare Juneau against other North American embarkation and call ports.",
      },
    ],
    evidenceRegistry: [
      {
        id: "jun-ircc-eta-air-exception",
        claimSummary: "Conditional air-only eTA eligibility for citizens of select visa-required countries; separate visitor-visa rules for land and sea entry.",
        sourceTitle: "IRCC — Citizens from Some Visa-Required Countries",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta/eligibility/eta-x.html",
        issuingOrganization: "Immigration, Refugees and Citizenship Canada (IRCC)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Canadian airports and land/sea ports of entry",
        applicableTravelerContext: "Travelers from select visa-required countries considering air arrival plus Canadian cruise or land crossings",
        publishedOrUpdatedDate: null,
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-ircc-us-permanent-resident",
        claimSummary: "U.S. lawful permanent residents are eTA-exempt and carry their nationality passport or equivalent travel document plus valid proof of U.S. status.",
        sourceTitle: "IRCC — U.S. Lawful Permanent Resident Travel Documents",
        sourceUrl: "https://www.ircc.canada.ca/english/helpcentre/answer.asp?qnum=1053&top=23",
        issuingOrganization: "Immigration, Refugees and Citizenship Canada (IRCC)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Canada, all travel modes",
        applicableTravelerContext: "U.S. lawful permanent residents visiting Canada",
        publishedOrUpdatedDate: "2026-09-28",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-cbj-harbors",
        claimSummary: "Cruise dock locations (AS, CTF, Franklin, AJ Dock), harbor basin rules, and municipal port management.",
        sourceTitle: "City and Borough of Juneau — Docks & Harbors Cruise Ship Information",
        sourceUrl: "https://juneau.org/harbors/cruise-ship-information",
        issuingOrganization: "City and Borough of Juneau (CBJ Docks & Harbors)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Gastineau Channel & Auke Bay Harbors, Juneau, AK",
        applicableTravelerContext: "Cruise ship passengers and marine harbor users",
        publishedOrUpdatedDate: "2026-01-15",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-usfs-mendenhall",
        claimSummary: "Mendenhall Glacier Visitor Center operating hours, commercial shuttle caps, trail access, and Steep Creek bear safety rules.",
        sourceTitle: "Tongass National Forest — Mendenhall Glacier Visitor Center",
        sourceUrl: "https://www.fs.usda.gov/recarea/tongass/recarea/?recid=78952",
        issuingOrganization: "U.S. Forest Service (USDA)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Mendenhall Glacier Recreation Area, Juneau, AK",
        applicableTravelerContext: "All visitors to Mendenhall Glacier, Nugget Falls, and Steep Creek",
        publishedOrUpdatedDate: "2026-04-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-cbp-whti",
        claimSummary: "Western Hemisphere Travel Initiative (WHTI) document rules for closed-loop vs. open-loop cruises and land/sea re-entry.",
        sourceTitle: "U.S. CBP — Western Hemisphere Travel Initiative (WHTI)",
        sourceUrl: "https://www.cbp.gov/travel/us-citizens/western-hemisphere-travel-initiative",
        issuingOrganization: "U.S. Customs and Border Protection (Department of Homeland Security)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "United States Air, Land, and Sea Ports of Entry",
        applicableTravelerContext: "U.S. citizens and international travelers on Alaska cruises or cross-border excursions",
        publishedOrUpdatedDate: "2025-11-10",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-cbsa-entry",
        claimSummary: "Canadian admissibility and identification requirements for cruise port calls (Victoria/Vancouver) and Yukon highway/rail excursions.",
        sourceTitle: "Canada Border Services Agency — Travel and Identification Requirements",
        sourceUrl: "https://www.cbsa-asfc.gc.ca/travel-voyage/ivc-rnc-eng.html",
        issuingOrganization: "Canada Border Services Agency (CBSA) / IRCC",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Canadian Ports of Entry (British Columbia & Yukon)",
        applicableTravelerContext: "All travelers whose Alaska cruise or shore excursion enters Canadian jurisdiction",
        publishedOrUpdatedDate: "2026-02-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-amhs-official",
        claimSummary: "State ferry routes, Auke Bay terminal location (13.5 mi NW of downtown), and vehicle/foot check-in cutoffs.",
        sourceTitle: "Alaska Marine Highway System (AMHS) Official Portal",
        sourceUrl: "https://dot.alaska.gov/amhs/",
        issuingOrganization: "Alaska Department of Transportation & Public Facilities",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Inside Passage & Auke Bay Ferry Terminal, Juneau, AK",
        applicableTravelerContext: "Independent ferry travelers and vehicle passengers",
        publishedOrUpdatedDate: "2026-03-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-capital-transit",
        claimSummary: "Municipal bus routes between Downtown Juneau, Mendenhall Valley, and Auke Bay, including the 1.5-mile walk gap to Mendenhall Visitor Center.",
        sourceTitle: "Capital Transit — City and Borough of Juneau Public Transit",
        sourceUrl: "https://juneaucapitaltransit.org/",
        issuingOrganization: "City and Borough of Juneau — Capital Transit",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "City and Borough of Juneau Road System",
        applicableTravelerContext: "Independent travelers using municipal bus transit",
        publishedOrUpdatedDate: "2026-01-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-airport-official",
        claimSummary: "Juneau International Airport (JNU) passenger services, ground transport, and Mendenhall Valley location.",
        sourceTitle: "Juneau International Airport Official Website",
        sourceUrl: "https://juneau.org/airport",
        issuingOrganization: "City and Borough of Juneau",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Juneau International Airport (PAJN), AK",
        applicableTravelerContext: "Air travelers and airport-based helicopter tour guests",
        publishedOrUpdatedDate: "2026-01-10",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-shi-heritage",
        claimSummary: "Lingít (Tlingit), Haida, and Tsimshian cultural history of Dzantik'i Heeni (Juneau) and Northwest Coast arts.",
        sourceTitle: "Sealaska Heritage Institute — Walter Soboleff Center",
        sourceUrl: "https://www.sealaskaheritage.org/",
        issuingOrganization: "Sealaska Heritage Institute",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Juneau & Southeast Alaska Indigenous Homelands",
        applicableTravelerContext: "All visitors exploring Juneau's cultural and historical context",
        publishedOrUpdatedDate: null,
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-bartlett-hospital",
        claimSummary: "Acute-care hospital and 24/7 emergency department serving Juneau and northern Southeast Alaska.",
        sourceTitle: "Bartlett Regional Hospital — Emergency Services",
        sourceUrl: "https://www.bartletthospital.org/",
        issuingOrganization: "Bartlett Regional Hospital (CBJ Enterprise)",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Juneau & Northern Southeast Alaska",
        applicableTravelerContext: "All travelers requiring urgent or emergency medical care",
        publishedOrUpdatedDate: null,
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-nws-live",
        claimSummary: "Live point weather alerts, marine advisories, and Mendenhall flood watch feeds.",
        sourceTitle: "National Weather Service API (Juneau Forecast Office)",
        sourceUrl: "https://api.weather.gov",
        issuingOrganization: "National Oceanic and Atmospheric Administration (NOAA / NWS)",
        authorityType: "observation",
        integrationStatus: "live_integrated",
        geographicScope: "Juneau & Inside Passage Coordinates",
        applicableTravelerContext: "All travelers checking current warnings and 3-day forecasts",
        publishedOrUpdatedDate: "Live / Continuous",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-noaa-tides",
        claimSummary: "Live Gastineau Channel tide height and high/low predictions (Station 9452210).",
        sourceTitle: "NOAA CO-OPS Tides & Currents API",
        sourceUrl: "https://tidesandcurrents.noaa.gov/stationhome.html?id=9452210",
        issuingOrganization: "NOAA Center for Operational Oceanographic Products and Services",
        authorityType: "observation",
        integrationStatus: "live_integrated",
        geographicScope: "Juneau Harbor / Gastineau Channel (125 km radius)",
        applicableTravelerContext: "Marine excursion passengers and limited-mobility dock users",
        publishedOrUpdatedDate: "Live / Continuous",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "jun-noaa-aviation",
        claimSummary: "Live METAR surface observations and TAF terminal forecasts for PAJN (Juneau International Airport).",
        sourceTitle: "NOAA / NWS Aviation Weather Center API",
        sourceUrl: "https://aviationweather.gov/data/api/",
        issuingOrganization: "NOAA / NWS Aviation Weather Center",
        authorityType: "observation",
        integrationStatus: "live_integrated",
        geographicScope: "PAJN Airport & Mendenhall Valley",
        applicableTravelerContext: "Air travelers and flightseeing passengers assessing ceiling/visibility",
        publishedOrUpdatedDate: "Live / Continuous",
        lastCheckedAt: "2026-10-23",
      },
    ],
  },

  "red-rocks": {
    id: "red-rocks",
    slug: "red-rocks",
    canonicalPath: "/red-rocks",
    aliasPaths: ["/venues/red-rocks-amphitheatre", "/routes/denver-red-rocks"],
    placeType: "foothill_amphitheatre_and_park",
    title: "Red Rocks Park & Amphitheatre — Venue & Foothills Travel Reference",
    subtitle:
      "6,450-foot sandstone acoustics, Upper vs. Lower lot stair elevation, post-show egress bottlenecks, official entry rules, and live foothill weather vs. venue status.",
    heroSummary:
      "Owned and operated by the City and County of Denver 15 miles west of downtown in Morrison, Colorado, Red Rocks Park & Amphitheatre is both a free daytime mountain park and a 9,525-capacity open-air concert venue wedged between 300-foot Pennsylvanian sandstone monoliths. Visiting successfully requires understanding its 6,450-foot altitude, the absence of direct public rail/bus into the park, steep vertical climbs from lower lots, and why post-show egress—not arrival—is the primary failure point.",
    primaryCoordinate: {
      lat: 39.6654,
      lng: -105.2057,
      label: "Red Rocks Amphitheatre Stage & Seating Bowl, Morrison, CO",
      canonicalLocationPath: "/location/39.66540/-105.20570",
      canonicalApiPath: "/api/location/39.66540/-105.20570",
    },
    secondaryCoordinates: [
      {
        lat: 39.7392,
        lng: -104.9903,
        label: "Downtown Denver / Union Station Hub (15 mi East)",
        elevationFt: 5280,
        canonicalLocationPath: "/location/39.73920/-104.99030",
        canonicalApiPath: "/api/location/39.73920/-104.99030",
        roleInPlace: "Primary hotel, dining, and shuttle departure origin for Red Rocks visitors.",
      },
    ],
    lastReviewedAt: "2026-10-23",
    coverageScopeStatement:
      "Combines verified City and County of Denver / Red Rocks Park & Amphitheatre operational rules and foothill transport analysis with live NWS Boulder/Denver alerts and Open-Meteo coordinate telemetry.",
    atAGlance: [
      {
        label: "Elevation & Exposure",
        value: "6,450 ft (1,966 m) — Open-air bowl with no roof canopy",
        authorityType: "official_rule",
      },
      {
        label: "Distance from Downtown Denver",
        value: "~15 miles west (25–40 min baseline; 60–90+ min on show nights)",
        authorityType: "dcc_interpretation",
      },
      {
        label: "Direct Public Transit to Bowl",
        value: "None (Nearest RTD W-Line stop is ~6 miles away at Jeffco Gov Ctr)",
        authorityType: "official_rule",
      },
      {
        label: "Event-Day Bowl vs. Park Access",
        value: "Amphitheatre bowl & Visitor Center close early afternoon on event days (times vary); surrounding park trails remain open",
        authorityType: "official_rule",
      },
    ],
    overviewAndContext: {
      sectionTitle: "Overview, Geology, History & Local Context",
      leadSummary:
        "Red Rocks is uniquely governed: it sits inside Jefferson County near the town of Morrison, yet is legally part of the Denver Mountain Parks system owned and managed by the City and County of Denver.",
      geographyAndTopography: [
        "The amphitheatre is framed by three massive tilted slabs of the Fountain Formation—290-to-300-million-year-old red arkosic sandstone uplifted during the Laramide Orogeny where the Great Plains meet the Rocky Mountain Front Range.",
        "Ship Rock (south), Creation Rock (north), and Stage Rock (east) create the only naturally occurring, acoustically formed amphitheatre of its scale in the world. The seating bowl holds 9,525 people across 70 wide bench rows climbing nearly 200 vertical feet from the stage to the Upper Plaza at 6,450 feet above sea level.",
      ],
      historyAndCulture: [
        "Long before becoming a municipal park, the Red Rocks valley and Bear Creek corridor were seasonal camps and sacred gathering grounds for the Ute, Cheyenne, and Arapaho peoples.",
        "Early 20th-century promoter John Brisben Walker staged the first formal concerts among the rocks between 1906 and 1910. The City of Denver acquired the site in 1927, and architect Burnham Hoyt designed the permanent amphitheatre—built between 1936 and 1941 by the Civilian Conservation Corps (CCC) using hand-quarried stone and 90,000 square feet of flagstone.",
        "Designated a National Historic Landmark in 2015, Red Rocks hosts roughly 180–200 concerts, film nights, and fitness events each year between April and November while operating year-round as a public trail and geological park.",
      ],
      localContextWhatItMeans: [
        "Because the venue is carved into steep foothill canyons accessed by winding two-lane park roads (Alameda Parkway / Red Rocks Park Road from the north and Bear Creek / CO-74 from the south), traffic capacity is physically capped by canyon geometry.",
        "Where you park or get dropped off changes your physical exertion dramatically: Upper North Lot enters near Row 70 at the top of the bowl, whereas Lower South and Jurassic Lots require climbing 150 to 380+ stairs at 6,450 feet of elevation.",
      ],
      citationIds: ["rr-official-rules", "rr-parking-getting-here", "rr-denver-mountain-parks"],
    },
    gettingThereAndAround: {
      sectionTitle: "Getting There & Getting Around: Lots, Shuttles, Driving & Rideshare Realities",
      leadSummary:
        "There is no train or public bus into Red Rocks Park. Every concertgoer must choose between driving and parking in one of five tiered lots, riding a dedicated round-trip event shuttle from Denver/Golden, or using rideshare/private drop-off at designated lower perimeter zones.",
      modes: [
        {
          id: "rr-shuttle-transfer",
          modeName: "Dedicated Round-Trip Concert Shuttles (Denver / Golden Pickup Hubs)",
          category: "shuttle_transfer",
          operatorOrAuthority: "Permitted Commercial Operators (including Party at Red Rocks & Official Venue Partners)",
          routeOrCoverage: "Round-trip motorcoach and sprinter transfers between Downtown Denver (Union Station / Colfax / RiNo) or Golden and designated Red Rocks commercial loading zones.",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "For travelers staying in Denver without a car—or groups who want to avoid designated-driver duties and post-show rideshare surge—pre-booked round-trip shuttles eliminate the two hardest parts of Red Rocks: climbing from distant roadside overflow parking and waiting 60–90 minutes in the Jurassic Lot rideshare queue at 11:30 PM.",
          practicalConstraints: [
            "Shuttles depart post-show on a strict countdown (typically 30 minutes after the final encore); know which lot your operator stages in before the headliner ends.",
            "Commercial shuttle seats sell out early on multi-night EDM, jam-band, and weekend headliner runs.",
          ],
          officialResourceUrl: "https://www.redrocksonline.com/plan-your-visit/getting-here/",
          officialResourceLabel: "Red Rocks Official Getting Here & Shuttle Info",
          citationIds: ["rr-parking-getting-here"],
        },
        {
          id: "rr-driving-parking",
          modeName: "Self-Drive & Tiered Park Lots (Upper North, Upper South, Lower North, Lower South, Jurassic)",
          category: "road_driving",
          operatorOrAuthority: "City and County of Denver — Red Rocks Park Operations",
          routeOrCoverage: "Accessed via I-70 Exit 259 (Morrison Rd / CO-93 / Alameda Pkwy — Entrances 1, 2, 3) or C-470 to Morrison Exit (CO-8 / Bear Creek Ave — Entrance 4).",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "General parking in official Red Rocks lots is included with concert admission, and lots open 2 hours before doors. However, once Upper North and Upper South fill (often 90+ minutes before doors on sold-out nights), flaggers direct cars to Lower South, Jurassic Lot, or roadside shoulders—adding a steep 15-to-25-minute uphill hike at altitude.",
          practicalConstraints: [
            "Post-show vehicle exit from Upper lots can take 45–60 minutes as single-file canyon roads merge toward I-70 and C-470.",
            "Overnight vehicle parking is limited; cars left after show nights must be retrieved by mid-morning the next day per venue rules.",
          ],
          officialResourceUrl: "https://www.redrocksonline.com/plan-your-visit/getting-here/",
          officialResourceLabel: "Red Rocks Official Parking Map & Lot Guide",
          citationIds: ["rr-parking-getting-here"],
        },
        {
          id: "rr-rideshare",
          modeName: "Rideshare (Uber / Lyft) & Passenger Drop-Off / Pickup",
          category: "rideshare_pedestrian",
          operatorOrAuthority: "Red Rocks Traffic Control / Jefferson County Sheriff",
          routeOrCoverage: "Designated Rideshare Drop-Off & Post-Show Pickup at Jurassic Lot (near Entrance 2) and Lower South Lot.",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "Rideshare works smoothly for pre-show arrival, though you will still walk uphill or catch the park shuttle from Jurassic Lot. Post-show egress is where rideshare frequently fails: 2,000+ people request cars simultaneously in a canyon with constrained cell tower bandwidth and one-way police traffic closures.",
          practicalConstraints: [
            "Walking down dark two-lane highways (CO-74 or Alameda Pkwy) into Morrison town center to 'beat the surge' is dangerous—there are no continuous sidewalks or streetlamps outside park gates.",
            "If using rideshare, either leave 15 minutes before the final encore or budget 60–90 minutes of waiting in the Jurassic Lot queue with warm layers.",
          ],
          officialResourceUrl: "https://www.redrocksonline.com/plan-your-visit/getting-here/",
          officialResourceLabel: "Red Rocks Official Rideshare & Drop-Off Rules",
          citationIds: ["rr-parking-getting-here"],
        },
        {
          id: "rr-public-transit-reality",
          modeName: "RTD Public Transit (Why It Does Not Reach the Amphitheatre)",
          category: "public_transit",
          operatorOrAuthority: "Regional Transportation District (RTD Denver)",
          routeOrCoverage: "RTD W Line light rail terminates at Jefferson County Government Center–Golden Station (~6.2 miles north of Red Rocks).",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "First-time visitors often assume Denver's light rail reaches Red Rocks. It does not: the W Line ends in Golden, 6+ miles away with no connecting public bus into the park, and late-night W Line frequency drops significantly before concerts end.",
          practicalConstraints: [
            "Do not take the W Line to Jeffco Government Center late at night assuming an easy transfer back after a concert.",
          ],
          officialResourceUrl: "https://www.rtd-denver.com/",
          officialResourceLabel: "RTD Denver Official System Map & Schedules",
          citationIds: ["rr-rtd-denver"],
        },
      ],
      keyDecisionTakeaway:
        "Solve your post-show exit before you leave Denver. Either book a round-trip shuttle with guaranteed staging, or drive your own car with a sober driver and arrive 90 minutes before doors to secure an Upper or mid-level lot.",
    },
    beforeYouGo: {
      sectionTitle: "Before You Go: Venue Rules, Altitude Health, Weather Exposure & Emergency Info",
      leadSummary:
        "Red Rocks is an outdoor mountain venue at 6,450 feet where afternoon sun, sudden foothill downpours, and 30°F post-sunset temperature drops routinely occur on the same day.",
      whyCoordinatesCannotAnswerEntry:
        "For domestic visitors already in Colorado, visiting Red Rocks involves venue bag/security rules rather than international immigration—unless you are flying into Denver International Airport (DEN) from abroad. Coordinates cannot tell you whether your nationality requires a U.S. ESTA or visa to fly into DEN, nor can weather coordinates tell you whether a specific concert's security policy has added artist-specific restrictions.",
      entryScenarios: [
        {
          id: "rr-entry-venue-bag-rules",
          scenarioLabel: "Concert Ticket Holders: Official Red Rocks Bag, Container & Entry Policy",
          dependencies: {
            nationality: "All attendees (venue security policy applies equally)",
            passportAndDocuments: "AXS digital ticket in the Red Rocks / AXS app + valid government photo ID (21+ for alcohol service)",
            residenceContext: "Event admission at Red Rocks Amphitheatre gates",
            routingAndTransit: "Entry via Top Plaza, Upper North, Lower North, or South Ramp security checkpoints",
            tripPurpose: "Ticketed concert, film, or fitness event",
            dateAndValidityRule: "Rules enforced per current season policy; individual shows may enforce stricter artist mandates.",
          },
          officialRequirementSummary:
            "Red Rocks enforces a single-compartment bag rule (up to 13\" x 15\" x 8\"; multi-pocket backpacks are prohibited), allows factory-sealed non-alcoholic plastic beverages or empty reusable water bottles (32 oz or less, no glass), permits soft-sided coolers (10\" x 7\" x 7\" or smaller) with food/fruit cut into bite-sized pieces, and prohibits umbrellas, totems, hard coolers, weapons, and open marijuana/tobacco smoking in the seating bowl.",
          dccPracticalExplanation:
            "Do not bring a standard multi-zipper hiking backpack or an umbrella to a Red Rocks concert—security will send you back to your car or shuttle, which can cost 40 minutes of uphill/downhill walking. Pack a hooded waterproof rain shell instead of an umbrella.",
          officialLinks: [
            {
              label: "Red Rocks Permitted & Prohibited Items (Official Policy)",
              url: "https://www.redrocksonline.com/plan-your-visit/permitted-prohibited-items/",
              issuingOrganization: "City and County of Denver — Red Rocks Park & Amphitheatre",
              note: "Always verify before show night in case of event-specific updates.",
            },
          ],
          citationIds: ["rr-official-rules"],
        },
        {
          id: "rr-entry-international-den",
          scenarioLabel: "International Travelers Flying into Denver (DEN) for a Red Rocks Trip",
          dependencies: {
            nationality: "Canadian Citizens, Visa Waiver Program (VWP) Nationals, or Visa-Required Nationals",
            passportAndDocuments: "Valid Passport + ESTA (for VWP nationals) or B1/B2 Visitor Visa; Canadian citizens generally enter visa-exempt for tourism with valid passport",
            residenceContext: "International air arrival at Denver International Airport (DEN)",
            routingAndTransit: "Direct international flight to DEN or U.S. port-of-entry connection",
            tripPurpose: "Tourism / Concert Attendance",
            dateAndValidityRule: "Passport must be valid for duration of stay (or 6 months beyond stay for countries outside the 6-month club).",
          },
          officialRequirementSummary:
            "International visitors arriving at DEN clear U.S. Customs and Border Protection (CBP) under standard U.S. federal entry rules.",
          dccPracticalExplanation:
            "Once admitted to the United States at DEN, no further border checkpoints exist between Denver and Red Rocks, though foreign passports should be kept secure if used for 21+ age verification at venue concessions.",
          officialLinks: [
            {
              label: "U.S. Department of State — Visitor Visas & Visa Waiver Program",
              url: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html",
              issuingOrganization: "U.S. Department of State",
              note: "Official visa and ESTA eligibility by nationality.",
            },
          ],
          citationIds: ["jun-cbp-whti"],
        },
      ],
      safetyHealthAndEmergency: [
        {
          id: "rr-safety-lightning-boundary",
          category: "operational_boundary",
          title: "Thunderstorms, Hail & Official Venue Lightning Protocols",
          issuingAuthority: "Red Rocks Park & Amphitheatre Operations / National Weather Service Boulder",
          authorityType: "official_rule",
          integrationStatus: "curated_verified",
          summary:
            "Red Rocks is an open-air venue with no roof over the seating bowl. Concerts are rain-or-shine, but severe lightning, high winds, or hail within the venue safety radius can trigger an official delay or temporary evacuation to vehicles.",
          travelerAction:
            "Understand two critical facts: (1) An NWS thunderstorm forecast on DCC does NOT mean a show is delayed—only Red Rocks management issues holds via venue screens, PA announcements, and official social channels; (2) If you arrived by rideshare and a temporary vehicle-shelter hold is called, follow staff instructions to sheltered concourse/tunnel areas.",
          officialUrl: "https://www.redrocksonline.com/plan-your-visit/safety-and-medical/",
          officialUrlLabel: "Red Rocks Official Safety, Weather & Medical Policy",
          citationIds: ["rr-safety-medical", "rr-nws-live"],
        },
        {
          id: "rr-health-altitude-stairs",
          category: "health_guidance",
          title: "6,450-Foot Elevation, Stair Exertion & Alcohol/Hydration Dynamics",
          issuingAuthority: "CDC Yellow Book High-Altitude Guidance & Red Rocks Medical Team",
          authorityType: "official_resource_link",
          integrationStatus: "curated_verified",
          summary:
            "At 6,450 feet (nearly 2,000 meters), barometric pressure is ~20% lower than at sea level, arid foothill air accelerates dehydration, and climbing 200–380 stairs from lower lots significantly elevates heart rate for sea-level visitors.",
          travelerAction:
            "Bring an empty 32 oz reusable water bottle to fill at venue hydration stations inside the gates, pace alcohol intake on your first night in Colorado, and build extra time to climb the ramps slowly.",
          officialUrl: "https://wwwnc.cdc.gov/travel/yellowbook/2024/environmental-hazards-risks/high-elevation-travel-and-altitude-illness",
          officialUrlLabel: "CDC Yellow Book — High-Elevation Travel Guidance",
          citationIds: ["rr-cdc-altitude", "rr-safety-medical"],
        },
        {
          id: "rr-emergency-medical",
          category: "emergency_services",
          title: "On-Site First Aid Stations & Nearest Emergency Hospital",
          issuingAuthority: "Red Rocks Medical / West Metro Fire Rescue / CommonSpirit St. Anthony Hospital",
          authorityType: "official_resource_link",
          integrationStatus: "linked_official_resource",
          summary:
            "During ticketed events, Red Rocks staffs two dedicated First Aid stations: one at the Lower South Ramp (Stage Right) and one at the Upper Plaza (Top of the Bowl). The closest Level I trauma and emergency hospital is CommonSpirit St. Anthony Hospital in Lakewood (11600 W 2nd Pl, Lakewood, CO 80228; ~7.5 miles northeast via CO-470/US-6).",
          travelerAction:
            "Inside the venue, alert any uniformed guest services or security staff member or go to Upper Plaza / Stage Right First Aid. Outside venue gates or during daytime park hours, dial 911 (Jefferson County / West Metro Fire Rescue).",
          officialUrl: "https://www.redrocksonline.com/plan-your-visit/safety-and-medical/",
          officialUrlLabel: "Red Rocks Safety & Medical Locations",
          citationIds: ["rr-safety-medical"],
        },
      ],
    },
    timingSeasonalityAndAccess: {
      sectionTitle: "Timing, Seasonality, Accessibility, Closures & Practical Constraints",
      leadSummary:
        "Red Rocks Park (surrounding trails and roads, open 1 hour before sunrise to 1 hour after sunset) and the Red Rocks Amphitheatre seating bowl/Visitor Center have distinct operating rules on event days versus non-event days.",
      items: [
        {
          id: "rr-closure-event-day",
          category: "closure_or_restriction",
          title: "Event-Day Amphitheatre Bowl & Visitor Center Closure vs. Park Trail Access",
          windowOrScope: "All Concert & Ticketed Event Days (April–November + Winter Special Events)",
          authorityType: "official_rule",
          factualBasis:
            "On concert and ticketed event days, the Amphitheatre seating bowl and Visitor Center close to non-ticketed daytime visitors in the early afternoon (exact cutoff varies by event load-in and matinee schedule—often around 2:00 PM, and sometimes earlier) for soundcheck and security sweeps. Surrounding Red Rocks Park hiking trails and park roads generally remain open during standard park hours (1 hour before sunrise to 1 hour after sunset), though parking lots and traffic patterns transition to event operations.",
          dccInterpretation:
            "Do not assume either that the entire mountain park closes at 2:00 PM or that the seating bowl stays open all afternoon: if you want to enter the Amphitheatre bowl or Visitor Center without an event ticket, arrive in the morning (ideally before 12:00 PM) and verify the exact daily amphitheatre closure time on the official Red Rocks calendar before driving out.",
          officialUrl: "https://www.redrocksonline.com/plan-your-visit/hours-directions-maps/",
          officialUrlLabel: "Red Rocks Official Daily Hours & Event Closure Schedule",
          citationIds: ["rr-hours-closures"],
        },
        {
          id: "rr-accessibility-ada",
          category: "accessibility",
          title: "ADA Parking, Continuous Shuttle & Row 1 / Row 70 Accessible Seating",
          windowOrScope: "Upper South Lot & Upper North Lot ADA Zones",
          authorityType: "official_rule",
          factualBasis:
            "Red Rocks is historic and steep, but provides a dedicated ADA shuttle from the Upper South Lot to the Stage Right elevator entrance (serving Row 1–3 accessible seating), while the Upper North Lot provides flat-grade access to Row 70 accessible seating at the top plaza.",
          dccInterpretation:
            "Visitors with a valid state-issued disability placard or license plate should target the Upper South Lot (for Row 1–3 tickets and the ADA shuttle) or Upper North Lot (for Row 70 tickets) and arrive at least 90 minutes before doors.",
          officialUrl: "https://www.redrocksonline.com/plan-your-visit/accessibility/",
          officialUrlLabel: "Red Rocks Official Accessibility & ADA Shuttle Guide",
          citationIds: ["rr-accessibility"],
        },
        {
          id: "rr-seasonality-weather",
          category: "seasonality",
          title: "Spring Snows (April/May), Summer Monsoons (July/Aug) & Fall Chills (Oct/Nov)",
          windowOrScope: "April through November Concert Season",
          authorityType: "dcc_interpretation",
          factualBasis:
            "Morrison's 6,450-foot foothills regularly see late-spring snowstorms into May, afternoon convective thunderstorms during the July–August North American Monsoon, and sub-40°F nighttime winds in October and November.",
          dccInterpretation:
            "Never dress for Red Rocks based on Downtown Denver's 3:00 PM temperature. Expect the amphitheatre bowl to feel 15°F–25°F cooler by 10:30 PM once solar heating off the sandstone stops and down-canyon drainage winds pick up.",
          citationIds: ["rr-nws-live"],
        },
      ],
    },
    operationalBoundaries: {
      headline: "Live Foothill Weather vs. Official Venue Operating Status",
      weatherVsOperationsExplanation:
        "DCC integrates live Open-Meteo current conditions, hourly wind/precipitation forecasts, air quality, and U.S. National Weather Service warnings for the Red Rocks coordinate (39.66540, -105.20570). Crucially: weather forecasts and NWS alerts do NOT constitute an official Red Rocks lightning hold, gate delay, or cancellation.",
      missingOrExpiredDataRule:
        "If NWS or Open-Meteo feeds fail to respond or expire, DCC displays an explicit 'Feed Unavailable / Unverified' notice rather than implying clear skies or zero alerts.",
      whatIsLiveIntegrated: [
        "Open-Meteo current temperature, wind speed/gusts, precipitation probability, and 12-hour concert-window forecast at 6,450 ft",
        "U.S. National Weather Service (NWS Boulder/Denver) active severe thunderstorm, high wind, red flag, or winter weather warnings",
        "Open-Meteo / CAMS air quality (US AQI & PM2.5 wildfire smoke tracking)",
        "USGS 500 km seismic activity and NASA EONET natural event tracking",
      ],
      whatRequiresOfficialExternalCheck: [
        {
          capability: "Active Concert Lightning Holds, Gate Delays & Show Cancellations",
          whyNotAutomated:
            "Only Red Rocks Park & Amphitheatre management and show promoters issue binding operational holds based on on-site lightning detection networks.",
          officialSourceLabel: "Red Rocks Official Website & Show Status",
          officialSourceUrl: "https://www.redrocksonline.com/",
        },
        {
          capability: "Exact Daily Daytime Amphitheatre & Visitor Center Closure Time",
          whyNotAutomated:
            "While Red Rocks Park trails remain open (1 hour before sunrise to 1 hour after sunset), the Amphitheatre seating bowl and Visitor Center close early on event days at times that vary by production load-in and matinee schedules.",
          officialSourceLabel: "Red Rocks Official Hours & Calendar",
          officialSourceUrl: "https://www.redrocksonline.com/plan-your-visit/hours-directions-maps/",
        },
      ],
    },
    specialistHandoffs: {
      sectionTitle: "Specialist Transport Guides & Context-Preserving Shuttle Handoffs",
      leadSummary:
        "Whether you drive yourself using the lot strategy above or book a dedicated concert shuttle, resolve your return transport before heading into the foothills.",
      contextControls: {
        supportsDate: true,
        supportsPartySize: true,
        customSelectorLabel: "Preferred Denver / Golden Pickup Hub",
        customSelectorParam: "pickup_hub",
        customSelectorOptions: [
          { value: "denver_union_station", label: "Downtown Denver (Union Station / LoDo)" },
          { value: "denver_colfax_capitol", label: "Capitol Hill / Colfax Corridor" },
          { value: "golden_foothills", label: "Golden / West Metro Foothills" },
          { value: "private_suv_group", label: "Private Door-to-Door SUV / Sprinter" },
        ],
      },
      options: [
        {
          id: "handoff-parr-shuttles",
          partnerName: "Party at Red Rocks (PARR)",
          partnerRole: "transport_operator",
          integrationMode: "context_handoff_link",
          description:
            "Dedicated Red Rocks concert shuttle and private SUV/Sprinter operator with guaranteed post-show staging and Denver/Golden pickup hubs.",
          whenItHelps:
            "Best when you want to lock in round-trip concert transportation without risking post-show rideshare surge or long lower-lot walks.",
          noPurchaseRequiredNote:
            "Carries your date, party size, and pickup hub preference into Party at Red Rocks. Comparing schedules requires no purchase.",
          baseUrl: "https://www.partyatredrocks.com/shuttles",
          supportedContextParams: ["date", "partySize", "pickupHub"],
          defaultParams: {
            source_surface: "dcc_red_rocks_reference",
            venue: "red-rocks-amphitheatre",
          },
        },
        {
          id: "handoff-dcc-denver-red-rocks-route",
          partnerName: "DCC Denver ↔ Red Rocks Route Decision Guide",
          partnerRole: "specialist_guide",
          integrationMode: "context_handoff_link",
          description:
            "Internal DCC route breakdown comparing pre-show departure timing, C-470 vs. I-70 approach lanes, and post-show fallback plans.",
          whenItHelps:
            "Best when comparing self-drive timing against shared and private shuttle options.",
          noPurchaseRequiredNote: "Internal DCC reference guide—100% free planning resource.",
          baseUrl: "/routes/denver-red-rocks",
          supportedContextParams: ["date", "partySize"],
          defaultParams: {
            source_surface: "dcc_red_rocks_reference",
          },
        },
      ],
    },
    relationships: [
      {
        id: "rel-rr-coord-primary",
        label: "Red Rocks Coordinate Intelligence (39.66540, -105.20570)",
        relationship: "canonical_coordinate",
        href: "/location/39.66540/-105.20570",
        coordinate: { lat: 39.6654, lng: -105.2057 },
        summary: "Live 6,450-ft weather, wind, AQI, and NWS alert telemetry for Red Rocks Amphitheatre.",
      },
      {
        id: "rel-rr-venue-node",
        label: "Red Rocks Venue Decision Node",
        relationship: "venue",
        href: "/venues/red-rocks-amphitheatre",
        summary: "Structured venue decision matrix and show-night checklist.",
      },
      {
        id: "rel-rr-route-denver",
        label: "Denver ↔ Red Rocks Route Guide",
        relationship: "route_corridor",
        href: "/routes/denver-red-rocks",
        summary: "Ingress and egress route comparison from Downtown Denver to Morrison.",
      },
      {
        id: "rel-rr-city-denver",
        label: "Denver City Hub & Coordinate (39.73920, -104.99030)",
        relationship: "city",
        href: "/denver",
        coordinate: { lat: 39.7392, lng: -104.9903 },
        summary: "Base-city planning for Denver neighborhoods, hotels, and transit.",
      },
      {
        id: "rel-rr-corridor-breck",
        label: "Denver–Breckenridge I-70 Mountain Corridor",
        relationship: "route_corridor",
        href: "/routes/denver-breckenridge",
        summary: "Extend a Red Rocks trip west up I-70 across the Continental Divide to Breckenridge.",
      },
      {
        id: "rel-rr-region-co",
        label: "Colorado Region & Transportation Hub",
        relationship: "region",
        href: "/regions/colorado",
        summary: "Statewide Colorado corridor and mountain pass overview.",
      },
    ],
    evidenceRegistry: [
      {
        id: "rr-official-rules",
        claimSummary: "Single-compartment bag policy (13\"x15\"x8\"), permitted/prohibited items, 32 oz non-glass water container rule, and smoking ban.",
        sourceTitle: "Red Rocks Park & Amphitheatre — Permitted & Prohibited Items",
        sourceUrl: "https://www.redrocksonline.com/plan-your-visit/permitted-prohibited-items/",
        issuingOrganization: "City and County of Denver — Arts & Venues (Red Rocks)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Red Rocks Amphitheatre, 18300 W Alameda Pkwy, Morrison, CO",
        applicableTravelerContext: "All ticketed concert and event attendees",
        publishedOrUpdatedDate: "2026-03-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "rr-parking-getting-here",
        claimSummary: "Five parking lots (Upper North, Upper South, Lower North, Lower South, Jurassic), gate opening times, and designated rideshare pickup zones.",
        sourceTitle: "Red Rocks Park & Amphitheatre — Getting Here & Parking",
        sourceUrl: "https://www.redrocksonline.com/plan-your-visit/getting-here/",
        issuingOrganization: "City and County of Denver — Arts & Venues (Red Rocks)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Red Rocks Park Roads, Entrances 1–4, and Parking Lots",
        applicableTravelerContext: "Drivers, shuttle passengers, and rideshare users",
        publishedOrUpdatedDate: "2026-03-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "rr-hours-closures",
        claimSummary: "Park trail/road hours (1 hour before sunrise to 1 hour after sunset) vs. event-day early afternoon closure of the Amphitheatre seating bowl and Visitor Center.",
        sourceTitle: "Red Rocks Park & Amphitheatre — Hours, Directions & Maps",
        sourceUrl: "https://www.redrocksonline.com/plan-your-visit/hours-directions-maps/",
        issuingOrganization: "City and County of Denver — Arts & Venues (Red Rocks)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Red Rocks Park & Visitor Center, Morrison, CO",
        applicableTravelerContext: "Daytime park visitors, hikers, and sightseers",
        publishedOrUpdatedDate: "2026-03-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "rr-accessibility",
        claimSummary: "ADA parking in Upper South/Upper North lots, continuous ADA shuttle to Row 1 elevator, and Row 70 flat access.",
        sourceTitle: "Red Rocks Park & Amphitheatre — Accessibility",
        sourceUrl: "https://www.redrocksonline.com/plan-your-visit/accessibility/",
        issuingOrganization: "City and County of Denver — Arts & Venues (Red Rocks)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Red Rocks Amphitheatre Seating Bowl & Upper Lots",
        applicableTravelerContext: "Visitors with disabilities or limited mobility",
        publishedOrUpdatedDate: "2026-03-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "rr-safety-medical",
        claimSummary: "Rain-or-shine policy, severe weather shelter instructions, and First Aid stations at Upper Plaza and Stage Right.",
        sourceTitle: "Red Rocks Park & Amphitheatre — Safety & Medical",
        sourceUrl: "https://www.redrocksonline.com/plan-your-visit/safety-and-medical/",
        issuingOrganization: "City and County of Denver — Arts & Venues (Red Rocks)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Red Rocks Amphitheatre, Morrison, CO",
        applicableTravelerContext: "All event attendees",
        publishedOrUpdatedDate: "2026-03-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "rr-denver-mountain-parks",
        claimSummary: "Geological history of the Fountain Formation, CCC construction (1936–1941), and Denver Mountain Parks stewardship.",
        sourceTitle: "City and County of Denver — Denver Mountain Parks History",
        sourceUrl: "https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Parks-Recreation/Urban-Parks/Mountain-Parks",
        issuingOrganization: "City and County of Denver Parks & Recreation",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Denver Mountain Parks System, Jefferson County, CO",
        applicableTravelerContext: "Visitors exploring Red Rocks history, geology, and trails",
        publishedOrUpdatedDate: null,
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "rr-rtd-denver",
        claimSummary: "RTD W Line termination at Jefferson County Government Center–Golden Station (~6 miles north of Red Rocks with no bus connection into park).",
        sourceTitle: "RTD Denver — Rail & Bus System Map",
        sourceUrl: "https://www.rtd-denver.com/",
        issuingOrganization: "Regional Transportation District (RTD Denver)",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Denver Metro & Golden Transit Corridor",
        applicableTravelerContext: "Travelers evaluating public transit options to Red Rocks",
        publishedOrUpdatedDate: "2026-01-15",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "rr-cdc-altitude",
        claimSummary: "Physiological effects of moderate-to-high altitude (5,000–11,500+ ft), hydration needs, and acclimatization guidance.",
        sourceTitle: "CDC Yellow Book — High-Elevation Travel & Altitude Illness",
        sourceUrl: "https://wwwnc.cdc.gov/travel/yellowbook/2024/environmental-hazards-risks/high-elevation-travel-and-altitude-illness",
        issuingOrganization: "U.S. Centers for Disease Control and Prevention (CDC)",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Colorado Front Range (5,280–6,450 ft) & High Country",
        applicableTravelerContext: "Visitors arriving from low-elevation cities",
        publishedOrUpdatedDate: "2024-05-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "rr-nws-live",
        claimSummary: "Live point weather warnings, hourly wind/thunderstorm forecasts, and temperature drops at 39.6654°N, 105.2057°W.",
        sourceTitle: "National Weather Service (NWS Boulder) & Open-Meteo Coordinate Feed",
        sourceUrl: "https://api.weather.gov",
        issuingOrganization: "NOAA / National Weather Service & Open-Meteo",
        authorityType: "forecast",
        integrationStatus: "live_integrated",
        geographicScope: "Morrison / Red Rocks Foothills (39.66540, -105.20570)",
        applicableTravelerContext: "All Red Rocks visitors checking current and 72-hour weather",
        publishedOrUpdatedDate: "Live / Continuous",
        lastCheckedAt: "2026-10-23",
      },
    ],
  },

  "denver-breckenridge": {
    id: "denver-breckenridge",
    slug: "denver-breckenridge",
    canonicalPath: "/routes/denver-breckenridge",
    aliasPaths: ["/transportation/colorado", "/regions/colorado"],
    placeType: "alpine_interstate_corridor",
    title: "Denver to Breckenridge (I-70 Mountain Corridor) — Travel Reference",
    subtitle:
      "80–104 miles climbing from 5,280 ft to 11,158 ft across the Continental Divide: CDOT Traction & Chain Laws (Code 15/16), tunnel metering, Bustang/Summit Stage transit, altitude prep, and live dual-elevation telemetry.",
    heroSummary:
      "The Denver–Breckenridge corridor along Interstate 70 and Colorado Highway 9 is the primary artery between the Front Range (5,280 ft) and the Central Rockies, crossing the Continental Divide at the Eisenhower–Johnson Memorial Tunnel (11,158 ft) or Loveland Pass (11,990 ft) before descending to Breckenridge (9,600 ft). Travel time ranges from 1 hour 40 minutes in clear mid-week conditions to 4+ hours during weekend ski waves or winter traction-law closures. Preparing properly means checking statutory tire/traction rules, acclimatizing for 9,600+ feet, and choosing the right transport mode for your group and luggage.",
    primaryCoordinate: {
      lat: 39.4817,
      lng: -106.0384,
      label: "Breckenridge Base & Blue River Valley, CO (9,600 ft)",
      canonicalLocationPath: "/location/39.48170/-106.03840",
      canonicalApiPath: "/api/location/39.48170/-106.03840",
    },
    secondaryCoordinates: [
      {
        lat: 39.7392,
        lng: -104.9903,
        label: "Denver Origin Hub, CO (5,280 ft)",
        elevationFt: 5280,
        canonicalLocationPath: "/location/39.73920/-104.99030",
        canonicalApiPath: "/api/location/39.73920/-104.99030",
        roleInPlace: "Front Range urban origin (80 miles east of Breckenridge; 104 miles from DEN Airport).",
      },
      {
        lat: 39.6779,
        lng: -105.9056,
        label: "Eisenhower–Johnson Memorial Tunnel, CO (11,158 ft)",
        elevationFt: 11158,
        canonicalLocationPath: "/location/39.67790/-105.90560",
        canonicalApiPath: "/api/location/39.67790/-105.90560",
        roleInPlace: "Continental Divide I-70 tunnel apex and hazardous-materials Loveland Pass (11,990 ft) diversion point.",
      },
    ],
    lastReviewedAt: "2026-10-23",
    coverageScopeStatement:
      "Pairs statutory CDOT I-70 corridor regulations, high-altitude health guidance, and transit schedules with live dual-coordinate NWS/Open-Meteo telemetry at Denver (5,280 ft) and Breckenridge (9,600 ft), plus GoSno's registered DCC operator feed.",
    atAGlance: [
      {
        label: "Distance & Elevation Gain",
        value: "80 mi from Downtown Denver (104 mi from DEN) • Climbs from 5,280 ft to 11,158 ft at Tunnel",
        authorityType: "official_rule",
      },
      {
        label: "Statutory Winter Traction Window",
        value: "Sept 1 – May 31 on I-70 (MP 133 Dotsero to MP 259 Morrison) per Colorado Law",
        authorityType: "official_rule",
      },
      {
        label: "Breckenridge Town Elevation",
        value: "9,600 ft base (12,998 ft Peak 8 summit) — High altitude illness risk for unacclimatized visitors",
        authorityType: "official_resource_link",
      },
      {
        label: "Local Transit in Summit County",
        value: "Free year-round via Summit Stage & Breck Free Ride (no car required in town)",
        authorityType: "official_rule",
      },
    ],
    overviewAndContext: {
      sectionTitle: "Overview, Corridor Geography, History & Elevation Profile",
      leadSummary:
        "Few highway corridors in North America gain nearly 6,000 vertical feet in under 60 miles. Treating Denver-to-Breckenridge like an ordinary suburban interstate drive is the root cause of most winter spinouts, rental-car fines, and ruined arrival days.",
      geographyAndTopography: [
        "Leaving Downtown Denver (5,280 ft) or Denver International Airport (5,434 ft on the eastern plains), I-70 West enters the Front Range foothills at Morrison/Golden (MP 259), climbs steeply up Floyd Hill into Clear Creek Canyon past Idaho Springs and Georgetown, and ascends a continuous 6%–7% grade to the Eisenhower–Johnson Memorial Tunnel (EJMT) bored beneath the Continental Divide at 11,158 feet—the highest vehicular tunnel point on the U.S. Interstate system.",
        "Vehicles carrying hazardous materials—or all traffic when the tunnel is closed for maintenance or incidents—must detour over U.S. 6 across Loveland Pass (11,990 ft), an exposed alpine switchback above treeline. West of the Divide, I-70 descends into Summit County past Dillon Reservoir (9,017 ft) to Exit 203 (Frisco), where Colorado Highway 9 climbs 9 miles south along the Blue River Valley into Breckenridge (9,600 ft base, beneath the Tenmile Range and 14,265-foot Quandary Peak).",
      ],
      historyAndCulture: [
        "For centuries, the Ute peoples traveled seasonal high-country routes across these passes into the Blue River valley (*Nah-oon-kara*). During the 1859 Pike's Peak Gold Rush, prospectors established Breckenridge along the Blue River, transforming it into a major placer, hydraulic, and dredge mining district preserved today in the Breckenridge National Historic District.",
        "Before the Eisenhower Bore opened in 1973 (and the Johnson Bore in 1979), every traveler between Denver and Summit County had to cross the 11,990-foot crest of Loveland Pass. Breckenridge Ski Resort opened on Peak 8 in December 1961, turning a Victorian mining town into one of the most visited year-round alpine destinations in the Western Hemisphere.",
      ],
      localContextWhatItMeans: [
        "Because Denver sits on the semi-arid plains at 5,280 feet while the Eisenhower Tunnel sits at 11,158 feet, it is completely normal for Denver to be 58°F and sunny while the Continental Divide 55 miles west is experiencing a 15°F ground blizzard with active traction laws.",
        "Once inside Breckenridge, parking is paid and constrained, while the town's Breck Free Ride and county-wide Summit Stage buses are 100% fare-free—meaning many travelers are better off arriving by shuttle or bus than paying to park an under-equipped rental car.",
      ],
      citationIds: ["db-cdot-traction", "db-summit-stage", "db-breck-heritage"],
    },
    gettingThereAndAround: {
      sectionTitle: "Getting There & Getting Around: DEN Airport, Shuttles, Bustang, Rental Cars & Free Local Transit",
      leadSummary:
        "Travelers moving between Denver (DEN or Union Station) and Breckenridge have four practical modes. Your best choice depends on whether you need a car once in Summit County and whether your rental vehicle meets Colorado's winter tire rules.",
      modes: [
        {
          id: "db-mountain-shuttles",
          modeName: "Door-to-Door & Hub Mountain Shuttles (DEN Airport ↔ Breckenridge)",
          category: "shuttle_transfer",
          operatorOrAuthority: "Registered Mountain Transfer Operators (including GoSno, Epic Mountain Express, Summit Express)",
          routeOrCoverage: "Direct shared vans and private 4WD SUVs/Sprinters from Denver International Airport (DEN Level 5 Island 5 / commercial lanes) and Denver Union Station to Breckenridge lodging.",
          scheduleAndStatusIntegration: "live_integrated",
          whatWorksInPractice:
            "DCC integrates GoSno's live /.well-known/dcc operator feed for the Colorado Rockies bounding box and provides direct context handoffs. Professional mountain shuttles run winter-rated tires, carry commercial chains, and drop you directly at your Breckenridge lodge or the Breck Station gondola hub—eliminating rental car liability on icy passes.",
          practicalConstraints: [
            "Allow at least 45–60 minutes between scheduled domestic flight touchdown at DEN and shuttle departure to account for the automated train to Jeppesen Terminal and oversized ski/snowboard baggage claim.",
            "On return flights out of DEN during winter weekends, depart Breckenridge at least 4 to 4.5 hours before your flight's scheduled takeoff.",
          ],
          officialResourceUrl: "https://www.flydenver.com/parking-and-transportation/to-and-from/mountain-carriers/",
          officialResourceLabel: "DEN Airport Official Mountain Carriers Directory",
          citationIds: ["db-den-mountain-carriers", "db-gosno-feed"],
        },
        {
          id: "db-bustang-pegasus",
          modeName: "CDOT Bustang West Line & Pegasus Express Vans",
          category: "public_transit",
          operatorOrAuthority: "Colorado Department of Transportation (CDOT) — RideBustang",
          routeOrCoverage: "Denver Union Station (Gate B4 / Wewatta Pavilion) → Denver Federal Center → Idaho Springs → Frisco Transfer Center (with free 25-minute Summit Stage transfer to Breckenridge).",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "If you can reach Denver Union Station via RTD's A-Line commuter train from DEN Airport (37 minutes), CDOT's Bustang motorcoaches and smaller Pegasus express vans (which can use the I-70 Mountain Express Lanes) are a reliable, low-cost public transit option to Frisco Transfer Center, where free Summit Stage buses depart every 30 minutes to Breckenridge Station.",
          practicalConstraints: [
            "Bustang/Pegasus do NOT pick up directly at DEN Airport; you must take the RTD A-Line train from DEN to Denver Union Station first.",
            "Pegasus 11-passenger vans require advance seat reservations and have more compact luggage bays than full-size Bustang coaches.",
          ],
          officialResourceUrl: "https://ridebustang.com/",
          officialResourceLabel: "CDOT Bustang & Pegasus Official Schedules & Fares",
          citationIds: ["db-cdot-bustang"],
        },
        {
          id: "db-rental-car-driving",
          modeName: "Self-Drive & Rental Cars on I-70 West (Traction Law Reality)",
          category: "road_driving",
          operatorOrAuthority: "Colorado Department of Transportation (CDOT) & Colorado State Patrol",
          routeOrCoverage: "I-70 West from Denver (MP 259 Morrison) through Eisenhower Tunnel (MP 214) to Exit 203 (Frisco), then 9 miles south on CO-9 to Breckenridge.",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "Standard airport rental cars frequently come equipped with worn all-season fleet tires, and most major rental contracts prohibit installing tire chains. Under Colorado's mandatory Sept 1 – May 31 Traction Law, driving a 2WD rental car without M+S / 3PMSF winter-rated tires and a full 3/16-inch tread depth on I-70 is illegal and subjects drivers to heavy fines if they block traffic.",
          practicalConstraints: [
            "Eastbound and Westbound I-70 Mountain Express Lanes (tolled peak-period shoulder lanes between Empire and Veterans Memorial Tunnels) have strict hours, ExpressToll/license-plate billing, and prohibited weaving rules.",
            "During heavy snow or hazmat tunnel runs, traffic is held at Silverthorne (EB) and Georgetown/Hidden Valley (WB) for tunnel metering.",
          ],
          officialResourceUrl: "https://maps.cotrip.org/",
          officialResourceLabel: "CDOT COtrip Live Road Conditions, Cameras & Traction Alerts",
          citationIds: ["db-cdot-traction", "db-cdot-express-lanes"],
        },
        {
          id: "db-summit-stage-free-ride",
          modeName: "Summit Stage & Breck Free Ride (Free Local Mountain Transit)",
          category: "public_transit",
          operatorOrAuthority: "Summit County Government & Town of Breckenridge",
          routeOrCoverage: "100% fare-free local bus network linking Breckenridge Station (BreckConnect Gondola), Main Street, Peak 7/8/9, Frisco, Silverthorne, Dillon, Keystone, and Copper Mountain.",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "Once you arrive at Breckenridge Station, you do not need a car to reach ski bases, Main Street dining, or neighboring Summit County towns. Both Breck Free Ride and the county-wide Summit Stage are free to board with ski/snowboard racks.",
          practicalConstraints: [
            "Evening service frequency tapers after 10:30 PM–11:30 PM; verify the last bus time if dining in Frisco or Silverthorne.",
          ],
          officialResourceUrl: "https://www.summitcountyco.gov/586/Summit-Stage",
          officialResourceLabel: "Summit Stage & Breck Free Ride Official Schedules",
          citationIds: ["db-summit-stage"],
        },
      ],
      keyDecisionTakeaway:
        "Between September 1 and May 31, unless you are driving a confirmed AWD/4WD vehicle with verified 3/16-inch winter/M+S tread, take a mountain shuttle from DEN or Bustang from Union Station and use Summit County's free bus network once you arrive.",
    },
    beforeYouGo: {
      sectionTitle: "Before You Go: CDOT Traction Laws, Altitude Sickness Prevention & Emergency Info",
      leadSummary:
        "Two factors catch Denver–Breckenridge travelers off guard more than any others: Colorado's statutory winter traction laws on I-70 and rapid ascent from sea level to 9,600+ feet.",
      whyCoordinatesCannotAnswerEntry:
        "The Denver–Breckenridge corridor is an interstate domestic route within Colorado, so U.S. immigration rules only apply if you are flying internationally into Denver International Airport (DEN). However, highway legality along the corridor depends on vehicle drivetrain, tire rating, tread depth, and date (Sept 1 – May 31)—none of which can be inferred from a raw weather forecast.",
      entryScenarios: [
        {
          id: "db-entry-cdot-traction-law",
          scenarioLabel: "All Motorists on I-70 (Morrison MP 259 to Dotsero MP 133): Statutory Traction & Chain Laws",
          dependencies: {
            nationality: "All drivers regardless of state or country of license",
            passportAndDocuments: "Valid driver's license + vehicle meeting statutory Colorado Traction Law (Code 15) equipment standards",
            residenceContext: "Applies equally to rental cars, out-of-state visitors, and Colorado residents",
            routingAndTransit: "Interstate 70 between Mile Point 133 (Dotsero) and Mile Point 259 (Morrison), plus CO-9 during active winter advisories",
            tripPurpose: "All passenger and commercial highway travel",
            dateAndValidityRule: "Automatically in effect for all passenger vehicles from September 1 through May 31 (and whenever activated by CDOT during storms).",
          },
          officialRequirementSummary:
            "Under Colorado Statute (C.R.S. § 42-4-106), from September 1 to May 31 on I-70 between Morrison and Dotsero, ALL motorists must carry either: (1) 4WD or AWD vehicle with tires having at least 3/16-inch tread depth; OR (2) 2WD vehicle with winter tires (3PMSF) or Mud+Snow (M+S) all-weather tires having at least 3/16-inch tread depth; OR (3) chains or an approved traction device (like AutoSock) on board. Under severe blizzards, Code 16 (Passenger Vehicle Chain Law) requires every vehicle to physically install chains/traction devices. Fines start at $130+ and escalate above $650 if an non-compliant vehicle blocks a lane.",
          dccPracticalExplanation:
            "DCC's coordinate weather feed shows temperature and modeled snow depth, NOT active CDOT Code 15/16 status or safety closures. Before driving west of Golden, always check official CDOT COtrip alerts and physically inspect rental car tire sidewalls for the M+S or 3PMSF symbol and 3/16\" tread.",
          officialLinks: [
            {
              label: "CDOT Official Traction Law & Chain Law Requirements",
              url: "https://www.codot.gov/travel/winter-driving/tractionlaw",
              issuingOrganization: "Colorado Department of Transportation (CDOT)",
              note: "Statutory tire tread, AWD/4WD, and penalty rules for I-70.",
            },
            {
              label: "COtrip Live I-70 Road Conditions & Cameras",
              url: "https://maps.cotrip.org/",
              issuingOrganization: "Colorado Department of Transportation (CDOT)",
              note: "Official real-time highway closures, tunnel holds, and active traction alerts.",
            },
          ],
          citationIds: ["db-cdot-traction"],
        },
        {
          id: "db-entry-international-den",
          scenarioLabel: "International Ski & Mountain Visitors Arriving via Denver International Airport (DEN)",
          dependencies: {
            nationality: "International Nationals (Visa Waiver ESTA, Canadian, or B1/B2 Visa)",
            passportAndDocuments: "Valid Passport + ESTA/Visa for U.S. entry; International Driving Permit (IDP) recommended alongside home-country license if renting a vehicle",
            residenceContext: "International air arrival at DEN",
            routingAndTransit: "International arrival at DEN Level 5 -> Ground transfer along I-70 West",
            tripPurpose: "Tourism / Ski & Alpine Recreation",
            dateAndValidityRule: "Valid for authorized CBP admission period.",
          },
          officialRequirementSummary:
            "International arrivals clear U.S. Customs and Border Protection at DEN Jeppesen Terminal (Level 5 North) before accessing mountain carrier shuttles or rental car shuttles.",
          dccPracticalExplanation:
            "International travelers clearing CBP at DEN should allow 90 to 120 minutes between flight arrival and scheduled mountain shuttle departure.",
          officialLinks: [
            {
              label: "U.S. CBP — Know Before You Visit",
              url: "https://www.cbp.gov/travel/international-visitors",
              issuingOrganization: "U.S. Customs and Border Protection (CBP)",
              note: "Official international arrival procedures.",
            },
          ],
          citationIds: ["jun-cbp-whti", "db-den-mountain-carriers"],
        },
      ],
      safetyHealthAndEmergency: [
        {
          id: "db-health-altitude",
          category: "health_guidance",
          title: "Acute Mountain Sickness (AMS) Risk at 9,600–13,000 Feet",
          issuingAuthority: "CDC Yellow Book & Summit County Public Health",
          authorityType: "official_resource_link",
          integrationStatus: "curated_verified",
          summary:
            "Flying from sea level into Denver (5,280 ft) and driving immediately to sleep in Breckenridge (9,600 ft) places travelers in the CDC's high-elevation category where 20%–25% of unacclimatized visitors experience Acute Mountain Sickness (headache, nausea, insomnia, dizziness, fatigue) within 6–24 hours.",
          travelerAction:
            "Consider spending your first night in Denver (5,280 ft) to stage acclimatization, avoid heavy exertion and alcohol during your first 24–48 hours at 9,600 ft, hydrate steadily, and descend to lower elevation immediately if severe symptoms (confusion, ataxia, or resting breathlessness) develop.",
          officialUrl: "https://wwwnc.cdc.gov/travel/yellowbook/2024/environmental-hazards-risks/high-elevation-travel-and-altitude-illness",
          officialUrlLabel: "CDC Yellow Book — Altitude Illness Prevention & Treatment",
          citationIds: ["rr-cdc-altitude"],
        },
        {
          id: "db-safety-avalanche-backcountry",
          category: "official_advisory",
          title: "Backcountry Avalanche Danger & Loveland Pass / Tenmile Range Conditions",
          issuingAuthority: "Colorado Avalanche Information Center (CAIC)",
          authorityType: "official_resource_link",
          integrationStatus: "linked_official_resource",
          summary:
            "While in-bounds trails at Breckenridge Ski Resort are mitigated by ski patrol, sidecountry gates, Loveland Pass (US-6), and Tenmile Range trails sit in unmitigated Continental Divide snowpack prone to persistent slab avalanches.",
          travelerAction:
            "Never exit ski-area boundary gates or travel on Loveland Pass backcountry slopes without checking the daily CAIC forecast and carrying a transceiver, probe, and shovel.",
          officialUrl: "https://avalanche.state.co.us/",
          officialUrlLabel: "Colorado Avalanche Information Center (CAIC) Daily Forecast",
          citationIds: ["db-caic-avalanche"],
        },
        {
          id: "db-emergency-hospital",
          category: "emergency_services",
          title: "Summit County Emergency Care & St. Anthony Summit Hospital",
          issuingAuthority: "CommonSpirit St. Anthony Summit Hospital / Summit County 911",
          authorityType: "official_resource_link",
          integrationStatus: "linked_official_resource",
          summary:
            "CommonSpirit St. Anthony Summit Hospital in Frisco (340 Peak One Dr, Frisco, CO 80443; +1-970-668-3300, located at I-70 Exit 203 / CO-9, ~9 miles north of Breckenridge) is the primary Level III Trauma Center and 24/7 emergency department serving Summit County, alongside Breckenridge Medical Center at Peak 8/Main St during ski hours.",
          travelerAction:
            "Dial 911 for highway, medical, or mountain search-and-rescue emergencies (Summit County Rescue Group). Keep warm blankets, water, and a charged phone in your vehicle whenever crossing the Eisenhower Tunnel in winter.",
          officialUrl: "https://www.mountain.commonspirit.org/location/st-anthony-summit-hospital",
          officialUrlLabel: "St. Anthony Summit Hospital (Frisco, CO) Emergency Info",
          citationIds: ["db-summit-hospital"],
        },
      ],
    },
    timingSeasonalityAndAccess: {
      sectionTitle: "Timing, Seasonality, Tunnel Metering, Closures & Practical Constraints",
      leadSummary:
        "I-70 corridor travel times are governed by directional weekend waves and seasonal weather windows rather than simple mileage.",
      items: [
        {
          id: "db-timing-weekend-waves",
          category: "timing_window",
          title: "Weekend Peak Congestion & Eisenhower Tunnel Metering Windows",
          windowOrScope: "Westbound Fri 1:30–7:00 PM & Sat 5:30–10:00 AM • Eastbound Sun 1:30–7:30 PM",
          authorityType: "dcc_interpretation",
          factualBasis:
            "All four lanes of mountain resort traffic funnel into two westbound and two eastbound lanes through the Eisenhower–Johnson Memorial Tunnel and Twin Tunnels at Idaho Springs. During peak demand or snow removal, CDOT meters traffic at tunnel portals.",
          dccInterpretation:
            "Leaving Denver after 2:00 PM on Friday or leaving Breckenridge between 1:30 PM and 6:00 PM on Sunday routinely doubles travel time from 1h 45m to 3.5–4.5 hours. Either travel before 6:00 AM / after 7:00 PM on peak days, or book an evening dinner in Breckenridge/Idaho Springs on Sunday before heading east.",
          officialUrl: "https://www.codot.gov/travel/i70mountain",
          officialUrlLabel: "CDOT I-70 Mountain Corridor Travel Tips & Forecast",
          citationIds: ["db-cdot-express-lanes"],
        },
        {
          id: "db-seasonality-four-seasons",
          category: "seasonality",
          title: "Winter Ski Season (Nov–May), Mud Season (May/Oct) & Alpine Summer (June–Sept)",
          windowOrScope: "Year-Round Corridor Seasonality",
          authorityType: "dcc_interpretation",
          factualBasis:
            "Breckenridge Ski Resort typically operates from mid-November into May; high alpine passes and trails above 11,000 ft often hold snow until late June; July and August bring clear mornings followed by frequent 1:00–4:00 PM lightning storms above treeline.",
          dccInterpretation:
            "In late May and late October ('shoulder/mud season'), many high trails are snow-packed or muddy and some restaurants take seasonal breaks, though lodging rates drop sharply. In summer, start high-elevation hikes (like Quandary Peak) before dawn so you are below treeline by noon.",
          citationIds: ["db-nws-live"],
        },
        {
          id: "db-closures-loveland-vail",
          category: "closure_or_restriction",
          title: "Safety Closures at Georgetown, Silverthorne & Loveland Pass (US-6)",
          windowOrScope: "Active Winter Storms & Hazmat Tunnel Runs",
          authorityType: "official_rule",
          factualBasis:
            "At the top of every hour, the Eisenhower Tunnel briefly holds general traffic when hazmat trucks must pass through during Loveland Pass avalanche closures. During severe snow squalls, CDOT closes I-70 at Morrison (MP 259), Georgetown (MP 228), or Silverthorne (MP 205) for avalanche mitigation and tow recovery.",
          dccInterpretation:
            "Never follow consumer GPS apps onto unmaintained county forest roads when I-70 is closed—wait at Georgetown, Idaho Springs, or Silverthorne, and verify live status on CDOT COtrip.",
          officialUrl: "https://maps.cotrip.org/",
          officialUrlLabel: "CDOT COtrip Official Closure Map",
          citationIds: ["db-cdot-traction"],
        },
        {
          id: "db-accessibility-corridor",
          category: "accessibility",
          title: "Accessible Transit & Adaptive Recreation in Breckenridge",
          windowOrScope: "CDOT Bustang, Summit Stage & Breckenridge Outdoor Education Center (BOEC)",
          authorityType: "official_rule",
          factualBasis:
            "CDOT Bustang coaches, Summit Stage buses, Breck Free Ride buses, and the BreckConnect Gondola are ADA wheelchair-accessible. The Breckenridge Outdoor Education Center (BOEC) operates adaptive ski, snowboard, and summer programs.",
          dccInterpretation:
            "Travelers requiring wheelchair-accessible airport transfers from DEN should request an ADA-equipped vehicle at least 48 hours in advance when booking a mountain carrier or Bustang.",
          officialUrl: "https://www.boec.org/",
          officialUrlLabel: "Breckenridge Outdoor Education Center (BOEC) Adaptive Programs",
          citationIds: ["db-summit-stage", "db-cdot-bustang"],
        },
      ],
    },
    operationalBoundaries: {
      headline: "Live Dual-Elevation Weather vs. CDOT Highway Restrictions & Traction Law Status",
      weatherVsOperationsExplanation:
        "DCC integrates live weather, wind, air quality, and NWS alert telemetry at both ends of the corridor—Breckenridge (39.48170, -106.03840 at 9,600 ft) and Denver (39.73920, -104.99030 at 5,280 ft)—plus GoSno's registered operator feed. However, weather data and Open-Meteo model snow depth do NOT establish whether I-70 is open, whether CDOT Code 15/16 traction/chain laws are actively enforced on a specific milepost, or whether avalanche danger is safe.",
      missingOrExpiredDataRule:
        "Whenever an upstream weather, NWS, or operator endpoint is unreachable or past its fresh_until timestamp, DCC flags the feed as 'Unavailable / Stale'—never as 'All Clear'.",
      whatIsLiveIntegrated: [
        "Live Open-Meteo weather, wind, and modeled snow_depth at Breckenridge (9,600 ft) and Denver (5,280 ft)",
        "U.S. National Weather Service (NWS Boulder) active winter storm, blizzard, wind chill, and flood warnings across the Front Range and Summit County",
        "GoSno registered /.well-known/dcc operator feed for the Colorado Rockies corridor",
        "USGS earthquake feed and NOAA NWPS river gauges (Blue River & South Platte basins)",
      ],
      whatRequiresOfficialExternalCheck: [
        {
          capability: "Real-Time I-70 Lane Closures, Tunnel Holds & Active Traction/Chain Law Enforcement",
          whyNotAutomated:
            "CDOT activates and lifts Code 15/Code 16 restrictions and tunnel holds milepost-by-milepost via highway dynamic message signs and COtrip.",
          officialSourceLabel: "CDOT COtrip Official Live Map & Cameras",
          officialSourceUrl: "https://maps.cotrip.org/",
        },
        {
          capability: "Backcountry Avalanche Danger Ratings",
          whyNotAutomated:
            "Avalanche forecasts are published daily by zone and aspect/elevation band by state snow safety scientists.",
          officialSourceLabel: "Colorado Avalanche Information Center (CAIC)",
          officialSourceUrl: "https://avalanche.state.co.us/",
        },
        {
          capability: "Breckenridge Ski Resort Lift & Trail Opening Status",
          whyNotAutomated:
            "Upper-mountain lifts (Imperial Express, Peak 6/8) open and close dynamically based on ridge-top wind gusts and ski patrol avalanche mitigation.",
          officialSourceLabel: "Breckenridge Ski Resort Official Lift & Terrain Status",
          officialSourceUrl: "https://www.breckenridge.com/the-mountain/mountain-conditions/terrain-and-lift-status.aspx",
        },
      ],
    },
    specialistHandoffs: {
      sectionTitle: "Specialist Mountain Transfer Guides & Context-Preserving Handoffs",
      leadSummary:
        "Compare public transit (Bustang + Summit Stage), self-driving with winter-rated equipment, and direct mountain shuttles. When a shuttle fits best, carry your date, party size, and direction directly into GoSno.",
      contextControls: {
        supportsDate: true,
        supportsPartySize: true,
        customSelectorLabel: "Corridor Direction & Origin",
        customSelectorParam: "pickup",
        customSelectorOptions: [
          { value: "denver-airport", label: "DEN Airport → Breckenridge (Westbound)" },
          { value: "downtown-denver", label: "Downtown Denver → Breckenridge (Westbound)" },
          { value: "breckenridge-to-den", label: "Breckenridge → DEN Airport (Eastbound)" },
        ],
      },
      options: [
        {
          id: "handoff-gosno-breck",
          partnerName: "GoSno Mountain Transfers",
          partnerRole: "transport_operator",
          integrationMode: "pilot_endpoint_plus_handoff",
          description:
            "Registered DCC Colorado Rockies corridor operator providing shared and private winter-equipped transfers between DEN Airport, Denver, and Breckenridge.",
          whenItHelps:
            "Best when you want to bypass I-70 rental car traction-law liability and Breckenridge overnight parking costs.",
          noPurchaseRequiredNote:
            "Forwards your selected date, party size, and pickup origin to GoSno. Reference information on this page requires no purchase.",
          baseUrl: "https://gosno.co/denver-to-breckenridge-shuttle",
          supportedContextParams: ["date", "partySize", "direction"],
          defaultParams: {
            route: "denver-breckenridge",
            dropoff: "breckenridge",
            source_surface: "dcc_denver_breckenridge_reference",
          },
        },
        {
          id: "handoff-colorado-transport-hub",
          partnerName: "DCC Colorado Transportation & Corridor Hub",
          partnerRole: "specialist_guide",
          integrationMode: "context_handoff_link",
          description:
            "Internal DCC comparison across Colorado Front Range and I-70 mountain corridors (Breckenridge, Vail, Idaho Springs, Red Rocks).",
          whenItHelps:
            "Best when comparing multiple Colorado mountain towns or combining a Denver city stay with an alpine extension.",
          noPurchaseRequiredNote: "Internal DCC reference surface—no purchase required.",
          baseUrl: "/transportation/colorado",
          supportedContextParams: ["date", "partySize"],
          defaultParams: {
            source_surface: "dcc_denver_breckenridge_reference",
          },
        },
      ],
    },
    relationships: [
      {
        id: "rel-db-coord-breck",
        label: "Breckenridge Coordinate Intelligence (39.48170, -106.03840)",
        relationship: "canonical_coordinate",
        href: "/location/39.48170/-134.41970".includes("-134") ? "/location/39.48170/-106.03840" : "/location/39.48170/-106.03840",
        coordinate: { lat: 39.4817, lng: -106.0384 },
        summary: "Live 9,600-ft alpine telemetry node for Breckenridge & Blue River Valley.",
      },
      {
        id: "rel-db-coord-denver",
        label: "Denver Coordinate Intelligence (39.73920, -104.99030)",
        relationship: "secondary_coordinate",
        href: "/location/39.73920/-104.99030",
        coordinate: { lat: 39.7392, lng: -104.9903 },
        summary: "Live 5,280-ft origin telemetry node for Downtown Denver.",
      },
      {
        id: "rel-db-city-denver",
        label: "Denver City Hub & Decision Node",
        relationship: "city",
        href: "/denver",
        summary: "Denver base-city planning, neighborhoods, and transit connections.",
      },
      {
        id: "rel-db-region-co",
        label: "Colorado Region Authority Node",
        relationship: "region",
        href: "/regions/colorado",
        summary: "Regional guide connecting Denver, Red Rocks, Idaho Springs, and the I-70 High Country.",
      },
      {
        id: "rel-db-transport-co",
        label: "Colorado Transportation Hub",
        relationship: "route_corridor",
        href: "/transportation/colorado",
        summary: "Corridor transfer comparisons across Colorado mountain and venue routes.",
      },
      {
        id: "rel-db-venue-rr",
        label: "Red Rocks Park & Amphitheatre Reference",
        relationship: "venue",
        href: "/red-rocks",
        summary: "Located right at I-70 Exit 259 (Morrison) at the eastern gateway to the mountain corridor.",
      },
    ],
    evidenceRegistry: [
      {
        id: "db-cdot-traction",
        claimSummary: "Colorado Passenger Vehicle Traction Law (Code 15) mandatory Sept 1 – May 31 on I-70 (MP 133 Dotsero to MP 259 Morrison), 3/16-inch tread requirement, and Code 16 Chain Law rules.",
        sourceTitle: "CDOT — Passenger Vehicle Traction & Chain Laws",
        sourceUrl: "https://www.codot.gov/travel/winter-driving/tractionlaw",
        issuingOrganization: "Colorado Department of Transportation (CDOT)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Interstate 70 Mountain Corridor (MP 133 to MP 259), Colorado",
        applicableTravelerContext: "All passenger and commercial vehicles traveling I-70 West of Morrison",
        publishedOrUpdatedDate: "2025-09-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "db-cdot-express-lanes",
        claimSummary: "I-70 Mountain Express Lanes operating rules, weekend congestion patterns, and Eisenhower–Johnson Memorial Tunnel metering.",
        sourceTitle: "CDOT — I-70 Mountain Corridor Travel & Express Lanes",
        sourceUrl: "https://www.codot.gov/travel/i70mountain",
        issuingOrganization: "Colorado Department of Transportation (CDOT)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "I-70 Clear Creek & Summit Counties, CO",
        applicableTravelerContext: "All motorists traveling between Denver and Summit County",
        publishedOrUpdatedDate: "2025-11-15",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "db-cdot-bustang",
        claimSummary: "Bustang West Line and Pegasus Express van service from Denver Union Station to Frisco Transfer Center.",
        sourceTitle: "CDOT RideBustang — West Line & Pegasus Schedules",
        sourceUrl: "https://ridebustang.com/",
        issuingOrganization: "Colorado Department of Transportation (CDOT)",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Denver Union Station ↔ Frisco / Vail I-70 Corridor",
        applicableTravelerContext: "Transit travelers connecting from Denver to Summit County",
        publishedOrUpdatedDate: "2026-01-10",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "db-summit-stage",
        claimSummary: "100% fare-free county-wide bus service connecting Frisco Transfer Center, Breckenridge Station, Keystone, Copper, Dillon, and Silverthorne.",
        sourceTitle: "Summit County Government — Summit Stage Transit",
        sourceUrl: "https://www.summitcountyco.gov/586/Summit-Stage",
        issuingOrganization: "Summit County Government, Colorado",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Summit County & Town of Breckenridge, CO",
        applicableTravelerContext: "All visitors getting around Breckenridge and Summit County",
        publishedOrUpdatedDate: "2025-11-20",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "db-den-mountain-carriers",
        claimSummary: "Authorized commercial mountain shuttle carriers picking up at Denver International Airport (DEN Jeppesen Terminal Level 5).",
        sourceTitle: "Denver International Airport (DEN) — Mountain Carriers",
        sourceUrl: "https://www.flydenver.com/parking-and-transportation/to-and-from/mountain-carriers/",
        issuingOrganization: "City and County of Denver — Department of Aviation (DEN)",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Denver International Airport (DEN) to Colorado Mountain Resorts",
        applicableTravelerContext: "Air travelers transferring directly from DEN to Breckenridge",
        publishedOrUpdatedDate: "2026-02-01",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "db-caic-avalanche",
        claimSummary: "Daily backcountry avalanche danger ratings and snowpack advisories for the Front Range and Tenmile/Summit zones.",
        sourceTitle: "Colorado Avalanche Information Center (CAIC)",
        sourceUrl: "https://avalanche.state.co.us/",
        issuingOrganization: "Colorado Department of Natural Resources — CAIC",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Colorado High Country & Continental Divide Passes",
        applicableTravelerContext: "Backcountry skiers, winter hikers, and Loveland Pass travelers",
        publishedOrUpdatedDate: "Live / Daily",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "db-summit-hospital",
        claimSummary: "Level III Trauma Center and 24/7 emergency medical facility at I-70 Exit 203 / CO-9 in Frisco serving the Breckenridge corridor.",
        sourceTitle: "CommonSpirit St. Anthony Summit Hospital",
        sourceUrl: "https://www.mountain.commonspirit.org/location/st-anthony-summit-hospital",
        issuingOrganization: "CommonSpirit Health",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Summit County, CO (Frisco / Breckenridge)",
        applicableTravelerContext: "Travelers requiring urgent or emergency medical care in Summit County",
        publishedOrUpdatedDate: null,
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "db-breck-heritage",
        claimSummary: "Ute heritage, 1859 Blue River gold rush history, historic dredge mining, and Victorian historic district preservation.",
        sourceTitle: "Breckenridge History (Breckenridge Heritage Alliance)",
        sourceUrl: "https://breckhistory.org/",
        issuingOrganization: "Breckenridge Heritage Alliance / Town of Breckenridge",
        authorityType: "official_resource_link",
        integrationStatus: "linked_official_resource",
        geographicScope: "Town of Breckenridge & Upper Blue River Valley, CO",
        applicableTravelerContext: "Visitors exploring Breckenridge's cultural and mining heritage",
        publishedOrUpdatedDate: null,
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "db-gosno-feed",
        claimSummary: "Registered DCC Core v2 operator feed (gosno.co/.well-known/dcc) for Colorado Rockies transfer telemetry.",
        sourceTitle: "GoSno DCC Operator Endpoint",
        sourceUrl: "https://gosno.co/.well-known/dcc",
        issuingOrganization: "GoSno Mountain Transfers (via DCC Endpoint Registry)",
        authorityType: "observation",
        integrationStatus: "live_integrated",
        geographicScope: "Colorado Rockies Bounding Box (38.8°N–40.6°N, 107.2°W–104.5°W)",
        applicableTravelerContext: "Travelers checking operator feed status along I-70",
        publishedOrUpdatedDate: "Live / Continuous",
        lastCheckedAt: "2026-10-23",
      },
      {
        id: "db-nws-live",
        claimSummary: "Live point weather, wind, snow depth model, and NWS alerts for Breckenridge (39.48170, -106.03840) and Denver (39.73920, -104.99030).",
        sourceTitle: "National Weather Service (NWS Boulder) & Open-Meteo API",
        sourceUrl: "https://api.weather.gov",
        issuingOrganization: "NOAA / National Weather Service & Open-Meteo",
        authorityType: "forecast",
        integrationStatus: "live_integrated",
        geographicScope: "Denver (5,280 ft) and Breckenridge (9,600 ft)",
        applicableTravelerContext: "All corridor travelers comparing origin vs. destination conditions",
        publishedOrUpdatedDate: "Live / Continuous",
        lastCheckedAt: "2026-10-23",
      },
    ],
  },
  "new-orleans": {
    id: "new-orleans",
    slug: "new-orleans",
    canonicalPath: "/new-orleans",
    aliasPaths: ["/cities/new-orleans", "/ports/new-orleans", "/location/29.95110/-90.07150"],
    placeType: "river_port_and_cultural_city",
    title: "New Orleans, Louisiana — Travel Reference, River Port Logistics & Bayou Corridor Guide",
    subtitle:
      "French Quarter & Mississippi River Crescent • Port NOLA Erato/Julia Cruise Terminals • Barataria Basin & River Road Corridors",
    heroSummary:
      "New Orleans sits inside a sharp crescent of the lower Mississippi River between Lake Pontchartrain and the Barataria estuarine wetlands. Because the historic French Quarter and Warehouse District are compact while swamp preserves, River Road plantations, and Louis Armstrong International Airport (MSY) require 30-to-65-minute corridor transfers, good trip planning separates walkable neighborhood blocks from half-day excursion commitments and accounts for Gulf heat, tropical storms, and cruise embarkation windows.",
    primaryCoordinate: {
      lat: 29.9511,
      lng: -90.0715,
      label: "French Quarter / Jackson Square & Riverfront Core",
      canonicalLocationPath: "/location/29.95110/-90.07150",
      canonicalApiPath: "/api/location/29.95110/-90.07150",
    },
    secondaryCoordinates: [
      {
        lat: 29.9395,
        lng: -90.0617,
        label: "Port of New Orleans — Erato Street & Julia Street Cruise Terminals",
        elevationFt: 10,
        canonicalLocationPath: "/location/29.93950/-90.06170",
        canonicalApiPath: "/api/location/29.93950/-90.06170",
        roleInPlace:
          "Primary deep-draft cruise and riverboat embarkation corridor along the Warehouse District / Convention Center riverfront.",
      },
      {
        lat: 29.9934,
        lng: -90.258,
        label: "Louis Armstrong New Orleans International Airport (MSY / KMSY)",
        elevationFt: 4,
        canonicalLocationPath: "/location/29.99340/-90.25800",
        canonicalApiPath: "/api/location/29.99340/-90.25800",
        roleInPlace:
          "Primary commercial aviation gateway 11 miles west in Kenner; live METAR/TAF aviation observations and I-10 East transfer origin.",
      },
      {
        lat: 29.7544,
        lng: -90.1128,
        label: "Jean Lafitte / Barataria Basin Swamp & Bayou Corridor",
        elevationFt: 3,
        canonicalLocationPath: "/location/29.75440/-90.11280",
        canonicalApiPath: "/api/location/29.75440/-90.11280",
        roleInPlace:
          "Primary cypress-tupelo swamp and marsh boat-tour departure zone 35–45 minutes south across the Crescent City Connection.",
      },
    ],
    lastReviewedAt: "2026-10-24",
    coverageScopeStatement:
      "Integrates live NWS New Orleans/Baton Rouge (LIX) warnings, NOAA/NWPS lower Mississippi River gauge telemetry, KMSY airport METAR/TAF aviation observations, and Open-Meteo atmospheric & air-quality models. Streetcar service modifications, Port NOLA berth schedules, and festival street closures link to official municipal and port authorities.",
    atAGlance: [
      {
        label: "Geographic Setting",
        value: "Mississippi River crescent (mile 95 AHP) between Lake Pontchartrain and Barataria Basin (-2 ft to +15 ft natural levee)",
        authorityType: "observation",
      },
      {
        label: "Air & Cruise Gateways",
        value: "Louis Armstrong Intl Airport (MSY, 11 mi W) • Port NOLA Erato & Julia St Cruise Terminals",
        authorityType: "official_rule",
      },
      {
        label: "MSY Official Taxi Rule",
        value: "$36 flat rate (1–2 passengers) between MSY and Downtown / French Quarter ($15/person for 3+)",
        authorityType: "official_rule",
      },
      {
        label: "Key Weather & Water Factors",
        value: "May–Oct heat index & afternoon lightning • June–Nov Gulf tropical systems • Spring Mississippi River high water",
        authorityType: "forecast",
      },
    ],
    overviewAndContext: {
      sectionTitle: "Overview, Geography, History & Cultural Context",
      leadSummary:
        "Founded in 1718 on the naturally elevated alluvial ridge of the Mississippi River (Choctaw/Chitimacha Bulbancha, 'place of many tongues'), New Orleans evolved through French, Spanish, African, Afro-Caribbean, and American periods into one of North America's most distinct architectural, musical, and culinary capitals.",
      geographyAndTopography: [
        "Natural Levee vs. Interior Bowl: Historic neighborhoods like the French Quarter (Vieux Carré), Faubourg Marigny, and the lower Garden District sit on the higher natural river levee (10–15 feet above sea level), while mid-city basins sit below sea level and rely on giant drainage canals and pump stations.",
        "Three Distinct Excursion Corridors: (1) The walkable Riverfront / French Quarter / Warehouse District core; (2) The Barataria / Jean Lafitte cypress swamp and coastal marsh corridor 35–45 minutes south on the Westbank; and (3) The Great River Road historic plantation corridor 45–65 minutes upriver toward Wallace and Vacherie.",
      ],
      historyAndCulture: [
        "Birthplace of Jazz & Living Street Culture: Congo Square (inside Armstrong Park) and New Orleans Jazz National Historical Park preserve the African, Creole, and brass-band roots that shaped jazz. Second-line parades, Mardi Gras krewes, and neighborhood music rooms on Frenchmen Street remain active year-round community traditions.",
        "Creole, Cajun & River Port Heritage: New Orleans cuisine and architecture reflect three centuries of port trade across the Gulf and Caribbean, distinguishable from rural Acadiana (Cajun country) further west.",
      ],
      localContextWhatItMeans: [
        "Do Not Rent a Car for a French Quarter Stay: Overnight hotel parking in the French Quarter and CBD routinely costs $40–$55+ per night and narrow historic streets frequently close for pedestrian zones or parades. Use streetcars, walking, and hotel-pickup shuttles for swamp or plantation days.",
        "Covered Swamp Boat vs. Airboat Is a Real Group Decision: Covered pontoon boats offer shade, conversation-level narration, and no minimum height restrictions for young children or seniors, whereas high-speed airboats use aviation ear protection, run deeper into shallow marsh channels, and enforce strict minimum age/height and pregnancy safety rules.",
      ],
      citationIds: ["nola-nps-jazz", "nola-port-cruise", "nola-rta-transit"],
    },
    gettingThereAndAround: {
      sectionTitle: "Getting There & Getting Around: MSY Airport, Port NOLA, Streetcars & Bayou Transfers",
      leadSummary:
        "Most visitors arrive via Louis Armstrong New Orleans International Airport (MSY) or embark/disembark at the Port of New Orleans (Erato/Julia Street terminals). Within the historic core, walking and RTA streetcars handle short hops, while swamp and plantation excursions require dedicated highway transfers.",
      modes: [
        {
          id: "nola-mode-air-msy",
          modeName: "Louis Armstrong New Orleans International Airport (MSY) Transfers",
          category: "air",
          operatorOrAuthority: "New Orleans Aviation Board (NOAB) & City of New Orleans Taxicab Bureau",
          routeOrCoverage: "MSY North Terminal (Kenner) ↔ French Quarter / CBD / Cruise Terminals via I-10 East (11–14 miles, 20–35 min off-peak)",
          scheduleAndStatusIntegration: "live_integrated",
          whatWorksInPractice:
            "City ordinance sets a mandatory flat taxi rate of $36 for 1–2 passengers ($15 per passenger for 3–5 passengers) from MSY Baggage Claim Door 7 to anywhere in the French Quarter, CBD, or Erato/Julia cruise terminals west of Elysian Fields. Rideshare (Uber/Lyft) picks up outside Level 1 Baggage Claim Doors 7–11.",
          practicalConstraints: [
            "I-10 East bottlenecks heavily between Williams Blvd, Causeway Blvd, and the Claiborne/Poydras exits during weekday rush hours (7:30–9:00 AM, 4:00–6:30 PM) and on cruise embarkation mornings.",
            "Public transit option: RTA Airport Express Bus (Route E1 / 202) runs between MSY and the Downtown Walk-Up / Main Library hub for $1.25–$1.50, taking ~45 minutes.",
          ],
          officialResourceUrl: "https://flymsy.com/ground-transportation/",
          officialResourceLabel: "FlyMSY Official Ground Transportation & Flat Taxi Rates",
          citationIds: ["nola-msy-ground"],
        },
        {
          id: "nola-mode-cruise-port",
          modeName: "Port of New Orleans (Erato Street & Julia Street Cruise Terminals)",
          category: "marine_port",
          operatorOrAuthority: "Port of New Orleans (Port NOLA)",
          routeOrCoverage: "Erato Street Terminal (Carnival) & Julia Street Terminal (Norwegian, Royal Caribbean, Disney, American Cruise Lines) along Port of New Orleans Place",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "Both cruise terminals sit directly beside the Convention Center and Warehouse District, roughly 1 mile upriver from Canal Street and Jackson Square. Debarking cruise passengers with afternoon flights out of MSY can book half-day city or swamp excursions that include luggage hold and airport drop-off.",
          practicalConstraints: [
            "Do not try to walk from the French Quarter to the Julia/Erato cruise terminals with rolling luggage in summer heat; cobblestone crossings and railroad tracks along Convention Center Blvd require a short taxi or transfer.",
            "Lower Mississippi River high-water stages in spring can alter ship air-draft clearances under the Crescent City Connection and affect riverboat docking gates.",
          ],
          officialResourceUrl: "https://portnola.com/cruise",
          officialResourceLabel: "Port NOLA Official Cruise Terminal & Parking Guide",
          citationIds: ["nola-port-cruise"],
        },
        {
          id: "nola-mode-rta-streetcar",
          modeName: "RTA Historic Streetcars (St. Charles, Canal, Riverfront & Rampart) & Algiers Ferry",
          category: "public_transit",
          operatorOrAuthority: "New Orleans Regional Transit Authority (RTA)",
          routeOrCoverage: "St. Charles Line (Canal St ↔ Garden District ↔ Uptown/Carrollton), Canal Street Line (Riverfront ↔ Cemeteries/City Park), Riverfront Line (French Market ↔ Convention Center)",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "A 1-Day Jazzy Pass ($3.00 via the Le Pass app) covers unlimited streetcar and bus rides. The St. Charles Streetcar is the classic scenic link from Canal Street through the Warehouse District and Garden District.",
          practicalConstraints: [
            "Streetcars share lanes or neutral grounds and stop completely whenever Mardi Gras parades, second lines, or track maintenance occur; check RTA service alerts before relying on them for timed tour check-ins.",
          ],
          officialResourceUrl: "https://www.norta.com/ride-with-us/how-to-pay/jazzy-passes",
          officialResourceLabel: "New Orleans RTA Streetcar Maps & Jazzy Pass Fares",
          citationIds: ["nola-rta-transit"],
        },
        {
          id: "nola-mode-swamp-plantation-shuttles",
          modeName: "Hotel-Pickup Shuttles for Barataria Swamps & River Road Plantations",
          category: "shuttle_transfer",
          operatorOrAuthority: "Permitted Louisiana Tour & Charter Operators",
          routeOrCoverage: "French Quarter / CBD Pickup Zones ↔ Jean Lafitte / Lafitte (LA-45 South, 35–45 min) & Wallace / Vacherie Plantations (I-10 / LA-18 / LA-3127, 50–65 min)",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "Because narrow French Quarter streets prohibit full-size motorcoaches inside residential blocks, hotel-pickup shuttles collect guests at perimeter avenues (Canal St, Decatur St, Rampart St, Poydras St, Tchoupitoulas St) 60–90 minutes before boat or plantation tour time.",
          practicalConstraints: [
            "Rideshare (Uber/Lyft) will drop you off at rural swamp docks in Lafitte or plantations in Wallace/Vacherie, but return drivers are frequently unavailable in those rural parishes—always book round-trip shuttle transport or drive yourself.",
          ],
          officialResourceUrl: "https://www.nps.gov/jela/planyourvisit/directions.htm",
          officialResourceLabel: "NPS Jean Lafitte Barataria Preserve Directions",
          citationIds: ["nola-nps-jazz"],
        },
      ],
      keyDecisionTakeaway:
        "Use the $36 flat-rate taxi or rideshare from MSY into town, walk or use the $3 RTA Jazzy Pass between the French Quarter and Garden District, and always book round-trip shuttle pickup (never one-way rideshare) for Barataria swamp or River Road plantation excursions.",
    },
    beforeYouGo: {
      sectionTitle: "Before You Go: Entry Rules, Heat & Tropical Safety, Health & Emergency Information",
      leadSummary:
        "New Orleans is a domestic U.S. destination in Louisiana, but it is also a major international air arrival port (MSY) and Western Caribbean closed-loop/open-loop cruise homeport (Port NOLA). Entry requirements depend on traveler nationality, passport status, and whether your itinerary includes international sea ports.",
      whyCoordinatesCannotAnswerEntry:
        "Coordinates (29.95110, -90.07150) identify New Orleans in Louisiana, USA, but cannot determine whether a cruise passenger qualifies for U.S. CBP closed-loop Western Hemisphere Travel Initiative (WHTI) birth-certificate rules versus requiring a valid passport book or ESTA.",
      entryScenarios: [
        {
          id: "nola-entry-us-domestic",
          scenarioLabel: "U.S. Citizens & Lawful Permanent Residents (Domestic Air/Road Arrival)",
          dependencies: {
            nationality: "United States Citizen or U.S. Lawful Permanent Resident",
            passportAndDocuments: "REAL ID-compliant state driver's license, U.S. Passport, or DHS Trusted Traveler card for TSA airport checkpoints",
            residenceContext: "Domestic travel within the United States",
            routingAndTransit: "Direct domestic flight to MSY, Amtrak (Sunset Limited / Crescent / City of New Orleans), or interstate highway arrival",
            tripPurpose: "Tourism, business, or pre-cruise stay",
            dateAndValidityRule: "ID must be valid through date of domestic return flight",
          },
          officialRequirementSummary:
            "No passport or visa is required for domestic travel to New Orleans, though TSA requires REAL ID-compliant identification or an acceptable federal alternative (such as a U.S. passport) at airport security checkpoints.",
          dccPracticalExplanation:
            "If you are only visiting the city, bayous, and plantations, a REAL ID driver's license is sufficient. If you are boarding a cruise at Port NOLA, see the WHTI cruise rules below.",
          officialLinks: [
            {
              label: "TSA REAL ID Identification Requirements",
              url: "https://www.tsa.gov/real-id",
              issuingOrganization: "U.S. Transportation Security Administration (TSA)",
              note: "Official domestic air travel ID rules.",
            },
          ],
          citationIds: ["nola-cbp-entry"],
        },
        {
          id: "nola-entry-cruise-whti",
          scenarioLabel: "Port NOLA Western Caribbean & Mexico Cruise Passengers (Closed-Loop vs. Passport)",
          dependencies: {
            nationality: "U.S. Citizens vs. Foreign Nationals embarking at Port of New Orleans",
            passportAndDocuments: "U.S. Passport Book (strongly recommended) or WHTI-compliant proof of citizenship + government photo ID for eligible U.S. citizens on closed-loop sailings",
            residenceContext: "Applies to all passengers embarking at Erato Street or Julia Street Cruise Terminals",
            routingAndTransit: "Closed-loop cruise beginning and ending at Port of New Orleans vs. open-loop or emergency air return from Mexico/Central America",
            tripPurpose: "International cruise embarkation",
            dateAndValidityRule: "Passports should have at least 6 months validity beyond cruise completion",
          },
          officialRequirementSummary:
            "Under U.S. CBP Western Hemisphere Travel Initiative (WHTI) rules, U.S. citizens on a closed-loop cruise that begins and ends at the same U.S. port (New Orleans) may re-enter the U.S. with an original/certified U.S. birth certificate and government-issued photo ID, unless a specific foreign port or cruise line requires a passport book. However, a valid U.S. Passport Book is required if you must fly back to the U.S. from a foreign port in an emergency.",
          dccPracticalExplanation:
            "Non-U.S. citizens embarking at Port NOLA must carry a valid passport and multiple-entry U.S. visa or valid ESTA (plus any visas required by Cozumel, Costa Maya, Roatán, or Belize) so they can legally re-enter the United States upon disembarkation in New Orleans.",
          officialLinks: [
            {
              label: "U.S. CBP Western Hemisphere Travel Initiative (WHTI) Cruise Rules",
              url: "https://www.cbp.gov/travel/us-citizens/western-hemisphere-travel-initiative",
              issuingOrganization: "U.S. Customs and Border Protection (CBP)",
              note: "Official CBP documentary requirements for land and sea travel.",
            },
          ],
          citationIds: ["nola-cbp-entry", "nola-port-cruise"],
        },
        {
          id: "nola-entry-international-visitor",
          scenarioLabel: "International Visitors Arriving by Air or Sea",
          dependencies: {
            nationality: "Visa Waiver Program (VWP) nationals, Canadian citizens, or visa-required nationals",
            passportAndDocuments: "Valid machine-readable e-Passport + approved ESTA (for VWP nationals) or B-1/B-2 visitor visa",
            residenceContext: "Non-U.S. residents",
            routingAndTransit: "International arrival or domestic connection via U.S. port of entry",
            tripPurpose: "Tourism or conference attendance (up to 90 days under VWP)",
            dateAndValidityRule: "Apply for ESTA at least 72 hours prior to departure",
          },
          officialRequirementSummary:
            "International travelers from Visa Waiver Program countries must hold an approved ESTA before boarding air or sea carriers to the United States; other foreign nationals require a valid U.S. nonimmigrant visa.",
          dccPracticalExplanation:
            "Ensure your ESTA or U.S. visa remains valid through your entire stay, especially if combining a New Orleans stay with a Western Caribbean cruise that re-enters U.S. customs at Port NOLA.",
          officialLinks: [
            {
              label: "Official U.S. CBP ESTA Application Portal",
              url: "https://esta.cbp.dhs.gov/",
              issuingOrganization: "U.S. Customs and Border Protection (CBP)",
              note: "Official government ESTA portal ($21 fee).",
            },
          ],
          citationIds: ["nola-cbp-entry"],
        },
      ],
      safetyHealthAndEmergency: [
        {
          id: "nola-safety-heat-lightning",
          category: "health_guidance",
          title: "Subtropical Heat Index, Humidity & Bayou Lightning Safety",
          issuingAuthority: "National Weather Service (NWS New Orleans/Baton Rouge) & CDC",
          authorityType: "official_rule",
          integrationStatus: "live_integrated",
          summary:
            "From May through September, New Orleans heat indices routinely exceed 100°F–108°F (38°C–42°C) with high dew points, and afternoon convective thunderstorms produce dangerous cloud-to-ground lightning over open bayous and the Mississippi River.",
          travelerAction:
            "Book walking tours, cemetery visits, and open-air airboat tours for the first morning departure (8:00–10:00 AM). Carry electrolyte water and choose shaded covered swamp boats or indoor museum/historic-home blocks during peak afternoon heat.",
          officialUrl: "https://www.weather.gov/lix/",
          officialUrlLabel: "NWS New Orleans/Baton Rouge Active Advisories",
          citationIds: ["nola-nws-nhc"],
        },
        {
          id: "nola-safety-tropical-street-flood",
          category: "official_advisory",
          title: "Tropical Cyclone Season (June–November) & Heavy-Rain Street Flooding",
          issuingAuthority: "NOLA Ready (New Orleans Office of Homeland Security & Emergency Preparedness)",
          authorityType: "official_rule",
          integrationStatus: "linked_official_resource",
          summary:
            "Intense Gulf downpours (2+ inches per hour) can temporarily overwhelm municipal drainage pumps, causing localized street and underpass flooding in Mid-City, Broadmoor, and low-lying intersections even outside hurricane events.",
          travelerAction:
            "Never drive or walk through standing water under highway overpasses. Text NOLAREADY to 77295 or check ready.nola.gov during heavy rain or tropical watches.",
          officialUrl: "https://ready.nola.gov/",
          officialUrlLabel: "NOLA Ready Official Emergency & Street Flood Alerts",
          citationIds: ["nola-ready-emergency", "nola-nws-nhc"],
        },
        {
          id: "nola-emergency-medical",
          category: "emergency_services",
          title: "Emergency Services & Level I Trauma Care (University Medical Center)",
          issuingAuthority: "City of New Orleans EMS & University Medical Center New Orleans",
          authorityType: "official_resource_link",
          integrationStatus: "linked_official_resource",
          summary:
            "Dial 911 for police, fire, or medical emergencies. University Medical Center New Orleans (2000 Canal St, 1.5 miles from the French Quarter) is the region's Level I Trauma Center; Touro Infirmary serves Uptown/Garden District.",
          travelerAction:
            "In crowded festival corridors (Bourbon St, Frenchmen St, Mardi Gras routes), identify cross-street corners when calling 911 and stay on well-lit main thoroughfares after dark.",
          officialUrl: "https://ready.nola.gov/home/",
          officialUrlLabel: "City of New Orleans Public Safety Resources",
          citationIds: ["nola-ready-emergency"],
        },
      ],
    },
    timingSeasonalityAndAccess: {
      sectionTitle: "Timing, Seasonality, Accessibility & Festival Constraints",
      leadSummary:
        "New Orleans operates on a distinct seasonal rhythm shaped by Mardi Gras, Spring festival weekends (Jazz Fest, French Quarter Fest), summer Gulf weather, and autumn culinary/music months.",
      items: [
        {
          id: "nola-season-spring-fall",
          category: "seasonality",
          title: "Peak Festival Windows (Feb–May & Oct–Nov) vs. Summer Subtropical Season (June–Sept)",
          windowOrScope: "Mardi Gras, French Quarter Fest & Jazz Fest (Spring) • Oct–Nov Cool Season • June–Sept Heat/Storm Season",
          authorityType: "observation",
          factualBasis:
            "Spring (March–May) and Fall (October–November) offer comfortable 68°F–82°F temperatures and active alligator basking in the bayous, but coincide with peak hotel compression. Summer brings lower room rates and high alligator activity, paired with afternoon thunderstorms.",
          dccInterpretation:
            "In winter (December–February), when water temperatures drop below ~65°F, wild alligators enter brumation (dormancy) unless a warm sunny afternoon draws them onto banks—winter swamp tours remain scenic for cypress moss and birding, but wildlife expectations should be calibrated honestly.",
          citationIds: ["nola-nps-jazz", "nola-nws-nhc"],
        },
        {
          id: "nola-timing-excursion-windows",
          category: "timing_window",
          title: "Half-Day Swamp vs. Full-Day Plantation + Swamp Combo Timing",
          windowOrScope: "8:30 AM Morning Pickup Wave vs. 12:15 PM Afternoon Pickup Wave",
          authorityType: "editorial_recommendation",
          factualBasis:
            "A standalone Barataria swamp tour with hotel pickup takes ~3.75 to 4 hours door-to-door. A single River Road plantation tour (Oak Alley, Laura, or Whitney) takes ~4.5 to 5.5 hours. Combining both a plantation and a swamp tour requires an 8.5-to-9.5-hour full-day loop.",
          dccInterpretation:
            "If you have an evening jazz cruise (boarding at 6:00 PM at Toulouse St Wharf) or a 7:00 PM French Quarter dinner reservation, take the morning swamp or morning plantation departure so you are back at your hotel by 1:30–2:30 PM.",
          citationIds: ["nola-nps-jazz"],
        },
        {
          id: "nola-accessibility",
          category: "accessibility",
          title: "French Quarter Slate Sidewalks, Covered Swamp Boats vs. Airboats & Steamboat Ramps",
          windowOrScope: "Vieux Carré Historic District, Toulouse Street Wharf & Barataria Docks",
          authorityType: "official_rule",
          factualBasis:
            "Historic French Quarter banquettes (sidewalks) feature narrow passages and uneven 19th-century flagstone. At the swamp docks, covered tour boats feature flat gangway boarding and accessible seating, whereas small high-speed airboats require stepping over raised gunwales.",
          dccInterpretation:
            "Travelers using wheelchairs, walkers, or traveling with infants/toddlers under 48 inches tall or pregnant guests should book covered pontoon swamp boats and the Steamboat Natchez / Paddlewheeler Creole Queen (which have elevator/ramp access), rather than high-speed airboats.",
          officialUrl: "https://www.nps.gov/jela/planyourvisit/accessibility.htm",
          officialUrlLabel: "NPS Jean Lafitte Accessibility Information",
          citationIds: ["nola-nps-jazz"],
        },
        {
          id: "nola-closures-parades",
          category: "closure_or_restriction",
          title: "Mardi Gras & Festival Perimeter Closures",
          windowOrScope: "Two Weeks Preceding Fat Tuesday, French Quarter Fest (April), Jazz Fest (Late April/Early May)",
          authorityType: "official_rule",
          factualBasis:
            "During Mardi Gras parade rolls along St. Charles Avenue and Canal Street, the City of New Orleans closes cross-corridor vehicle traffic for hours before and after each krewe procession, and French Quarter vehicle entry is restricted to permitted residents/guests.",
          dccInterpretation:
            "During Carnival week, allow an extra 45–60 minutes to reach perimeter tour pickup zones on Rampart or Tchoupitoulas Street, and verify whether your hotel sits inside the St. Charles parade box.",
          officialUrl: "https://ready.nola.gov/mardi-gras/",
          officialUrlLabel: "NOLA Ready Official Parade Route & Closure Tracker",
          citationIds: ["nola-ready-emergency"],
        },
      ],
    },
    operationalBoundaries: {
      headline: "Live Conditions vs. Marine Coast Guard, Bayou Captain & Streetcar Dispatch Authority",
      weatherVsOperationsExplanation:
        "DCC integrates live NWS New Orleans/Baton Rouge weather warnings, NOAA lower Mississippi River stages, KMSY aviation METAR/TAF reports, and Open-Meteo atmospheric models. However, weather data on this page does NOT establish whether a Barataria airboat captain has called a lightning hold, whether the USCG has restricted Mississippi River vessel traffic for fog/high water, or whether RTA streetcars are detoured.",
      missingOrExpiredDataRule:
        "If any upstream NOAA, NWS, or aviation feed is unreachable or expired, DCC displays 'Unavailable / Unverified'—never '0 alerts' or 'All Clear'.",
      whatIsLiveIntegrated: [
        "U.S. National Weather Service (NWS LIX) active warnings, heat advisories, tropical statements, and point forecasts",
        "NOAA NWPS lower Mississippi River gauge observations when reported within corridor radius",
        "NOAA/NWS Aviation Weather Center live METAR & TAF for Louis Armstrong International Airport (KMSY)",
        "Open-Meteo current weather, 12-hour/3-day forecast, and EPA/CAMS Air Quality Index",
      ],
      whatRequiresOfficialExternalCheck: [
        {
          capability: "Swamp Airboat & Riverboat Lightning / Fog Holds",
          whyNotAutomated:
            "USCG-licensed captains suspend bayou departures and Mississippi riverboat sailings dynamically based on localized lightning within 10 miles or dense river fog.",
          officialSourceLabel: "Confirm directly with your booked operator or Welcome to New Orleans Tours",
          officialSourceUrl: "https://www.welcometoneworleanstours.com/tours",
        },
        {
          capability: "RTA Streetcar Detours & Parade Box Street Closures",
          whyNotAutomated:
            "NOPD and RTA adjust streetcar turnbacks and parade barricades in real time as crowds and krewes move.",
          officialSourceLabel: "NORTA Service Alerts & NOLA Ready Traffic Map",
          officialSourceUrl: "https://www.norta.com",
        },
      ],
    },
    specialistHandoffs: {
      sectionTitle: "Specialist Guides & Context-Preserving New Orleans Handoffs",
      leadSummary:
        "Use the reference sections above to decide between covered swamp boats vs. airboats, Oak Alley vs. Whitney Plantation, or morning vs. evening river cruises. When ready, carry your trip dates and group size into DCC's verified New Orleans specialist guides.",
      contextControls: {
        supportsDate: true,
        supportsPartySize: true,
        customSelectorLabel: "Primary Experience Focus",
        customSelectorParam: "focus",
        customSelectorOptions: [
          { value: "swamp_bayou", label: "Swamp & Bayou (Covered Boat vs. Airboat)" },
          { value: "plantation_history", label: "River Road Plantations (Whitney / Oak Alley / Laura)" },
          { value: "riverboat_jazz", label: "Mississippi Riverboat & Evening Jazz Cruise" },
          { value: "french_quarter_food", label: "French Quarter History, Food & Cocktail Walks" },
        ],
      },
      options: [
        {
          id: "handoff-wno-tours",
          partnerName: "Welcome to New Orleans Tours",
          partnerRole: "specialist_guide",
          integrationMode: "context_handoff_link",
          description:
            "Curated New Orleans storefront and local concierge guide comparing swamp boats, plantations, steamboat jazz cruises, and French Quarter walking tours with clear pickup-window rules.",
          whenItHelps:
            "Best when comparing full-day city/plantation combos, steamboat cruises, or multi-generational group options.",
          noPurchaseRequiredNote:
            "Carries your date and party size into the Welcome to New Orleans Tours catalog. Reference guidance remains complete without booking.",
          baseUrl: "https://www.welcometoneworleanstours.com/tours",
          supportedContextParams: ["date", "partySize"],
          defaultParams: {
            source_surface: "dcc_new_orleans_reference",
            destination: "new-orleans",
          },
        },
        {
          id: "handoff-wno-swamp",
          partnerName: "New Orleans Swamp & Airboat Specialist Guide",
          partnerRole: "excursion_specialist",
          integrationMode: "context_handoff_link",
          description:
            "Focused comparison of Barataria and Jean Lafitte covered pontoon boats versus small and large high-speed airboats, including hotel shuttle pickup timing.",
          whenItHelps:
            "Best when deciding between shaded covered boats (all ages) and high-speed airboats (minimum height/age rules).",
          noPurchaseRequiredNote:
            "Passes your travel window and party size directly into the swamp comparison view.",
          baseUrl: "https://www.welcometoneworleanstours.com/swamp-tours",
          supportedContextParams: ["date", "partySize"],
          defaultParams: {
            source_surface: "dcc_new_orleans_reference",
            category: "swamp-tours",
          },
        },
        {
          id: "handoff-wtts-planner",
          partnerName: "Welcome to the Swamp — Bayou Format Planner",
          partnerRole: "excursion_specialist",
          integrationMode: "context_handoff_link",
          description:
            "Dedicated swamp-vessel decision tool covering boat size, noise level, shade, wildlife viewing distance, and self-drive vs. hotel shuttle logistics.",
          whenItHelps:
            "Best when your group wants a dedicated breakdown of swamp ecosystems and vessel types before choosing a departure time.",
          noPurchaseRequiredNote:
            "No purchase required to use the bayou vessel comparison tool.",
          baseUrl: "https://welcometotheswamp.com/plan",
          supportedContextParams: ["date", "partySize"],
          defaultParams: {
            source_surface: "dcc_new_orleans_reference",
          },
        },
      ],
    },
    relationships: [
      {
        id: "rel-nola-coord-primary",
        label: "French Quarter / Jackson Square Coordinate (29.95110, -90.07150)",
        relationship: "canonical_coordinate",
        href: "/location/29.95110/-90.07150",
        coordinate: { lat: 29.9511, lng: -90.0715 },
        summary: "Canonical live telemetry page for Downtown New Orleans and the French Quarter river bend.",
      },
      {
        id: "rel-nola-port",
        label: "Port of New Orleans Cruise Hub",
        relationship: "port",
        href: "/ports/new-orleans",
        coordinate: { lat: 29.9395, lng: -90.0617 },
        summary: "DCC port reference for Erato Street and Julia Street cruise embarkation and pre/post-cruise logistics.",
      },
      {
        id: "rel-nola-city-node",
        label: "New Orleans City Node (/cities/new-orleans)",
        relationship: "city",
        href: "/cities/new-orleans",
        summary: "DCC city index entry connecting New Orleans neighborhoods, sports venues, and regional corridors.",
      },
      {
        id: "rel-nola-swamp-compare",
        label: "Covered Swamp Boat vs. Airboat Comparison",
        relationship: "route_corridor",
        href: "/new-orleans/compare/covered-swamp-boat-vs-airboat",
        summary: "Side-by-side operational comparison of Barataria covered boats vs. high-speed airboats.",
      },
    ],
    evidenceRegistry: [
      {
        id: "nola-port-cruise",
        claimSummary: "Port of New Orleans operates the Erato Street and Julia Street Cruise Terminals along the Mississippi River Warehouse District waterfront.",
        sourceTitle: "Port of New Orleans (Port NOLA) — Cruise Information & Terminals",
        sourceUrl: "https://portnola.com/cruise",
        issuingOrganization: "Port of New Orleans (Board of Commissioners of the Port of New Orleans)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Erato Street & Julia Street Cruise Terminals, New Orleans, LA",
        applicableTravelerContext: "Cruise passengers embarking or disembarking in New Orleans",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "nola-msy-ground",
        claimSummary: "City of New Orleans sets a regulated flat taxi fare of $36 for 1–2 passengers ($15/person for 3+) between MSY Airport and the French Quarter/CBD.",
        sourceTitle: "Louis Armstrong New Orleans International Airport — Ground Transportation",
        sourceUrl: "https://flymsy.com/ground-transportation/",
        issuingOrganization: "New Orleans Aviation Board (NOAB) / City of New Orleans",
        authorityType: "official_rule",
        integrationStatus: "curated_verified",
        geographicScope: "MSY Airport (Kenner) to New Orleans CBD, French Quarter, and Cruise Terminals",
        applicableTravelerContext: "Air travelers transferring between MSY and New Orleans hotels or cruise terminals",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "nola-rta-transit",
        claimSummary: "New Orleans Regional Transit Authority operates the St. Charles, Canal, Riverfront, and Rampart streetcar lines with $3.00 1-day Jazzy Passes.",
        sourceTitle: "New Orleans Regional Transit Authority (NORTA) — Fares, Passes & Schedules",
        sourceUrl: "https://www.norta.com/ride-with-us/how-to-pay/jazzy-passes",
        issuingOrganization: "New Orleans Regional Transit Authority (RTA)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Orleans Parish streetcar and bus network",
        applicableTravelerContext: "Visitors riding historic streetcars between Canal Street, French Quarter, and Garden District",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "nola-cbp-entry",
        claimSummary: "U.S. CBP Western Hemisphere Travel Initiative (WHTI) governs closed-loop cruise document rules at Port NOLA and ESTA/visa requirements for international arrivals.",
        sourceTitle: "U.S. Customs and Border Protection — Western Hemisphere Travel Initiative (WHTI)",
        sourceUrl: "https://www.cbp.gov/travel/us-citizens/western-hemisphere-travel-initiative",
        issuingOrganization: "U.S. Customs and Border Protection (DHS)",
        authorityType: "official_rule",
        integrationStatus: "curated_verified",
        geographicScope: "U.S. Air and Sea Ports of Entry (MSY & Port NOLA)",
        applicableTravelerContext: "Cruise passengers and international visitors entering or re-entering the United States at New Orleans",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "nola-nps-jazz",
        claimSummary: "Jean Lafitte National Historical Park and Preserve (Barataria Preserve & French Quarter Visitor Center) and New Orleans Jazz National Historical Park provide official cultural, natural, and accessibility guidance.",
        sourceTitle: "National Park Service — Jean Lafitte National Historical Park and Preserve",
        sourceUrl: "https://www.nps.gov/jela/index.htm",
        issuingOrganization: "U.S. National Park Service (Department of the Interior)",
        authorityType: "official_resource_link",
        integrationStatus: "curated_verified",
        geographicScope: "French Quarter Visitor Center (419 Decatur St) & Barataria Preserve (Marrero, LA)",
        applicableTravelerContext: "Visitors exploring Barataria wetlands, Mississippi delta ecology, and New Orleans cultural history",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "nola-nws-nhc",
        claimSummary: "Live weather alerts, heat-index advisories, tropical cyclone warnings, and atmospheric forecasts for New Orleans (29.95110, -90.07150).",
        sourceTitle: "National Weather Service New Orleans/Baton Rouge (LIX) & Open-Meteo API",
        sourceUrl: "https://www.weather.gov/lix/",
        issuingOrganization: "NOAA / National Weather Service & Open-Meteo",
        authorityType: "forecast",
        integrationStatus: "live_integrated",
        geographicScope: "Southeast Louisiana, Lake Pontchartrain, and Barataria Basin",
        applicableTravelerContext: "All travelers checking heat, lightning, and tropical weather conditions",
        publishedOrUpdatedDate: "Live / Continuous",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "nola-ready-emergency",
        claimSummary: "City of New Orleans Office of Homeland Security & Emergency Preparedness publishes official street-flooding alerts, tropical guidance, and parade traffic restrictions.",
        sourceTitle: "NOLA Ready — City of New Orleans Emergency Preparedness",
        sourceUrl: "https://ready.nola.gov/",
        issuingOrganization: "City of New Orleans Office of Homeland Security & Emergency Preparedness (NOHSEP)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "City of New Orleans (Orleans Parish)",
        applicableTravelerContext: "Visitors checking heavy-rain street flooding, parade box closures, and emergency alerts",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
    ],
  },
  "las-vegas": {
    id: "las-vegas",
    slug: "las-vegas",
    canonicalPath: "/vegas",
    aliasPaths: ["/cities/las-vegas", "/las-vegas-strip", "/location/36.11470/-115.17280"],
    placeType: "desert_resort_and_canyon_gateway",
    title: "Las Vegas, Nevada — Travel Reference, Strip & Desert Corridor Logistics Guide",
    subtitle:
      "Las Vegas Strip & Downtown Fremont • Harry Reid Airport (LAS) • Red Rock Canyon, Hoover Dam & Grand Canyon West Gateways",
    heroSummary:
      "Set in the Mojave Desert basin at 2,000–2,200 feet elevation and ringed by 11,900-foot Spring Mountains, Las Vegas combines a high-density 4.2-mile resort boulevard (the Las Vegas Strip), historic Downtown Fremont Street, and major federal public-land day-trip corridors (Red Rock Canyon, Hoover Dam/Lake Mead, and the Grand Canyon). Because resort blocks are deceptive in scale and desert temperatures swing from winter canyon winds to 110°F+ summer heat, smart trip planning pairs one timed desert excursion with one structured evening commitment.",
    primaryCoordinate: {
      lat: 36.1147,
      lng: -115.1728,
      label: "Las Vegas Strip Center (Bellagio / Flamingo Wash Corridor)",
      canonicalLocationPath: "/location/36.11470/-115.17280",
      canonicalApiPath: "/api/location/36.11470/-115.17280",
    },
    secondaryCoordinates: [
      {
        lat: 36.084,
        lng: -115.1537,
        label: "Harry Reid International Airport (LAS / KLAS)",
        elevationFt: 2181,
        canonicalLocationPath: "/location/36.08400/-115.15370",
        canonicalApiPath: "/api/location/36.08400/-115.15370",
        roleInPlace:
          "Primary aviation gateway 3 miles south of center Strip; live KLAS METAR/TAF wind and density-altitude observations for commercial and helicopter flights.",
      },
      {
        lat: 36.1358,
        lng: -115.4275,
        label: "Red Rock Canyon National Conservation Area (13-Mile Scenic Drive)",
        elevationFt: 3700,
        canonicalLocationPath: "/location/36.13580/-115.42750",
        canonicalApiPath: "/api/location/36.13580/-115.42750",
        roleInPlace:
          "BLM Aztec Sandstone conservation area 17 miles west via Charleston Blvd (NV-159); subject to seasonal timed-entry reservations Oct 1 – May 31.",
      },
      {
        lat: 36.0161,
        lng: -114.7377,
        label: "Hoover Dam & Black Canyon (US-93 / I-11 Corridor)",
        elevationFt: 1232,
        canonicalLocationPath: "/location/36.01610/-114.73770",
        canonicalApiPath: "/location/36.01610/-114.73770",
        roleInPlace:
          "U.S. Bureau of Reclamation dam and Lake Mead National Recreation Area gateway 35 miles southeast on the Nevada–Arizona border.",
      },
    ],
    lastReviewedAt: "2026-10-24",
    coverageScopeStatement:
      "Integrates live NWS Las Vegas (VEF) desert heat, wind, and flash-flood warnings, KLAS airport METAR/TAF aviation observations, USGS 500 km seismic telemetry, and Open-Meteo atmospheric & air-quality models. BLM Red Rock Canyon timed-entry reservations, Bureau of Reclamation Hoover Dam security rules, and RTC transit fares link to official federal and regional authorities.",
    atAGlance: [
      {
        label: "Geographic Setting",
        value: "Mojave Desert Las Vegas Valley (2,000–2,200 ft) bordered by Spring Mountains (11,916 ft) and Colorado River Black Canyon",
        authorityType: "observation",
      },
      {
        label: "Airport & Strip Scale",
        value: "Harry Reid Intl (LAS) is 2–4 miles from Strip resorts, but walking between adjacent Strip casinos takes 15–25 minutes",
        authorityType: "observation",
      },
      {
        label: "Red Rock Timed Entry Rule",
        value: "Mandatory Recreation.gov timed-entry reservation required Oct 1 – May 31 (8:00 AM – 5:00 PM) for the 13-mile Scenic Drive",
        authorityType: "official_rule",
      },
      {
        label: "Grand Canyon Rim Distance",
        value: "Grand Canyon West (Hualapai Nation / Skywalk) is ~2.5 hrs drive (125 mi); NPS South Rim is ~4.5 hrs drive (280 mi) each way",
        authorityType: "observation",
      },
    ],
    overviewAndContext: {
      sectionTitle: "Overview, Desert Geography, History & Corridor Scale",
      leadSummary:
        "Anchored by natural desert artesian springs on ancestral Nuwuvi (Southern Paiute) land, Las Vegas grew from a 1905 railroad town and 1931 Hoover Dam construction hub into the entertainment and convention capital of the Mojave Desert.",
      geographyAndTopography: [
        "Deceptive Boulevard Scale: Las Vegas Boulevard South ('The Strip', situated mostly in unincorporated Clark County / Paradise rather than the City of Las Vegas) stretches 4.2 miles from Mandalay Bay to The STRAT. Because mega-resorts sit hundreds of yards back from the curb and intersections use elevated pedestrian bridges, walking 'two resorts over' often equals 0.7 to 1.2 miles.",
        "Three Distinct Day-Trip Directions: (1) West 25–30 minutes to Red Rock Canyon (3,700–4,800 ft) or 45 minutes to Mt. Charleston (7,500–8,500 ft alpine relief); (2) Southeast 40–45 minutes via I-11 to Hoover Dam and Lake Mead, continuing to Grand Canyon West (2.5 hours) or NPS South Rim (4.5 hours); and (3) Northeast 60 minutes via I-15 to Valley of Fire State Park.",
      ],
      historyAndCulture: [
        "Hoover Dam, Mid-Century Neon & Modern Arena District: Downtown's Fremont Street, the Neon Museum, the Mob Museum, and the Atomic Museum document how federal water/power engineering and mid-century resort architecture shaped modern Southern Nevada.",
        "Show Residencies & Sports Megaprojects: T-Mobile Arena, Allegiant Stadium, Sphere, and flagship resort theaters create synchronized 6:30–8:00 PM pre-show and 10:00–11:30 PM post-show traffic waves across the entire corridor.",
      ],
      localContextWhatItMeans: [
        "Grand Canyon West vs. South Rim Is the #1 Day-Trip Distinction: Grand Canyon West (125 miles from Vegas, operated by the Hualapai Tribe) is the home of the glass Skywalk and helicopter canyon-floor landings, fitting a 7-to-9-hour day trip. Grand Canyon National Park's South Rim (280 miles from Vegas) requires a 13-to-15-hour round-trip coach day or a fixed-wing/helicopter air tour.",
        "Rideshare Never Picks Up at the Front Valet Curb on the Strip: Every major Strip resort routes Uber and Lyft to a designated parking-garage level or back-of-house rideshare lounge, which can be a 7-to-12-minute indoor walk from the casino floor.",
      ],
      citationIds: ["lv-las-airport", "lv-blm-redrock", "lv-usbr-hoover"],
    },
    gettingThereAndAround: {
      sectionTitle: "Getting There & Getting Around: LAS Airport Terminals, Strip Monorail/Deuce & Desert Transfers",
      leadSummary:
        "Harry Reid International Airport (LAS) sits immediately adjacent to the south end of the Strip, making airport arrival fast—provided you know whether your airline uses Terminal 1 or Terminal 3 and how Strip resort pickups work.",
      modes: [
        {
          id: "lv-mode-air-las",
          modeName: "Harry Reid International Airport (LAS) — Terminal 1 vs. Terminal 3 & Zone Taxis",
          category: "air",
          operatorOrAuthority: "Clark County Department of Aviation & Nevada Taxicab Authority",
          routeOrCoverage: "LAS Terminal 1 (A/B/C/D Gates) & Terminal 3 (E Gates + International) ↔ Las Vegas Strip (2–6 miles, 10–25 min) & Downtown (9 miles)",
          scheduleAndStatusIntegration: "live_integrated",
          whatWorksInPractice:
            "Nevada Taxicab Authority enforces fixed zone taxi fares from LAS to the Strip (Zone 1 South Strip, Zone 2 Mid-Strip, Zone 3 North Strip), eliminating route-padding concerns. Rideshare picks up on Level 2M of the Terminal 1 Parking Garage and Valet Level of the Terminal 3 Garage.",
          practicalConstraints: [
            "Terminal 1 and Terminal 3 are physically separate buildings on opposite sides of the airport; verify your airline's terminal before departure.",
            "High desert winds (35+ kt gusts) or extreme afternoon density altitude (110°F+) can trigger FAA ground delays at KLAS and pause helicopter Strip/Grand Canyon flights.",
          ],
          officialResourceUrl: "https://www.harryreidairport.com/Transportation",
          officialResourceLabel: "Harry Reid International Airport Official Ground Transportation",
          citationIds: ["lv-las-airport", "lv-nws-vegas"],
        },
        {
          id: "lv-mode-strip-transit",
          modeName: "Las Vegas Monorail, RTC Deuce Bus & Resort Trams",
          category: "public_transit",
          operatorOrAuthority: "Las Vegas Monorail (LVCVA) & Regional Transportation Commission of Southern Nevada (RTC)",
          routeOrCoverage: "East-side Strip Monorail (MGM Grand ↔ SAHARA, 7 stations) • RTC Deuce 24/7 Double-Decker Bus (South Strip Transit Terminal ↔ Strip ↔ Downtown Fremont)",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "The Las Vegas Monorail runs behind the east side of the Strip every 4–8 minutes (bypassing boulevard traffic completely), while free west-side resort trams connect Mandalay Bay–Luxor–Excalibur and Park MGM–Aria–Bellagio. The RTC Deuce bus is the only single-seat transit link running the full length of the Strip into Downtown Fremont.",
          practicalConstraints: [
            "Monorail stations sit at the rear of east-side casino properties (a 5–10 minute walk through the resort from Las Vegas Blvd).",
          ],
          officialResourceUrl: "https://www.rtcsnv.com/ways-to-travel/fares-passes/",
          officialResourceLabel: "RTC Southern Nevada Transit Passes & Deuce Route Guide",
          citationIds: ["lv-rtc-monorail"],
        },
        {
          id: "lv-mode-canyon-dam-transfers",
          modeName: "Red Rock Canyon, Hoover Dam & Grand Canyon Tour Transfers",
          category: "shuttle_transfer",
          operatorOrAuthority: "Permitted Commercial Tour Operators, BLM & U.S. Bureau of Reclamation",
          routeOrCoverage: "Strip Resort Tour Bus Plazas ↔ Red Rock Canyon (17 mi W), Hoover Dam (35 mi SE), Valley of Fire (55 mi NE), Grand Canyon West (125 mi SE)",
          scheduleAndStatusIntegration: "curated_with_official_link",
          whatWorksInPractice:
            "Guided day-trip coaches and small-group SUVs pick up at designated Strip resort tour lobbies between 6:00 AM and 8:00 AM, handling BLM/Hualapai/National Park entry permits and avoiding the need to reserve an individual timed-entry vehicle pass.",
          practicalConstraints: [
            "Self-driving to Red Rock Canyon's 13-mile Scenic Drive between October 1 and May 31 (8:00 AM – 5:00 PM) requires a mandatory timed-entry reservation on Recreation.gov; cell service inside Red Rock Canyon is weak, so download passes offline.",
            "Rideshare (Uber/Lyft) should NEVER be used for one-way drop-offs at Red Rock Canyon or Valley of Fire because cell reception and return pickups at trailheads are unreliable.",
          ],
          officialResourceUrl: "https://www.blm.gov/programs/national-conservation-lands/nevada/red-rock-canyon",
          officialResourceLabel: "BLM Red Rock Canyon Official Timed-Entry & Visitor Guide",
          citationIds: ["lv-blm-redrock", "lv-usbr-hoover"],
        },
      ],
      keyDecisionTakeaway:
        "Use regulated flat-zone taxis or garage rideshare from LAS, combine east-side Monorail and west-side free trams to save steps on the Strip, and book guided round-trip transport (or a rental car with an offline Recreation.gov pass) rather than rideshare for Red Rock Canyon, Hoover Dam, or Valley of Fire.",
    },
    beforeYouGo: {
      sectionTitle: "Before You Go: Entry Rules, Mojave Desert Heat & Monsoon Safety, Health & Emergency Information",
      leadSummary:
        "Las Vegas welcomes both domestic U.S. travelers and direct international arrivals via Harry Reid Airport Terminal 3. Outdoor desert safety—dehydration, extreme summer heat, and monsoon flash floods—requires year-round awareness.",
      whyCoordinatesCannotAnswerEntry:
        "Coordinates (36.11470, -115.17280) locate the Las Vegas Strip in Nevada, USA, but cannot determine a traveler's nationality, passport validity, ESTA status for Terminal 3 international arrivals, or age eligibility (21+ for Nevada gaming floors and nightclubs).",
      entryScenarios: [
        {
          id: "lv-entry-us-domestic",
          scenarioLabel: "U.S. Citizens & Lawful Permanent Residents (Domestic Arrival)",
          dependencies: {
            nationality: "United States Citizen or U.S. Lawful Permanent Resident",
            passportAndDocuments: "REAL ID-compliant driver's license, state ID, or U.S. Passport for TSA checkpoints and 21+ casino/nightclub age verification",
            residenceContext: "Domestic U.S. travel",
            routingAndTransit: "Domestic flight to LAS or highway arrival via I-15 / I-11",
            tripPurpose: "Tourism, conventions, or live events",
            dateAndValidityRule: "Unexpired government photo ID required at all times for 21+ gaming and club entry",
          },
          officialRequirementSummary:
            "No visa or passport is required for domestic U.S. arrivals, though TSA requires REAL ID-compliant identification (or a U.S. passport) at airport security checkpoints. Under Nevada Gaming Control Board regulations, guests must be 21+ with valid government photo ID to linger on casino gaming floors or enter nightclubs/dayclubs.",
          dccPracticalExplanation:
            "Even if you are over 40, Las Vegas dayclubs, nightclubs, and sportsbooks strictly scan physical, unexpired government photo IDs at the door—digital photos of an ID on your phone are not accepted.",
          officialLinks: [
            {
              label: "TSA REAL ID Official Requirements",
              url: "https://www.tsa.gov/real-id",
              issuingOrganization: "U.S. Transportation Security Administration (TSA)",
              note: "Official domestic air checkpoint identification requirements.",
            },
          ],
          citationIds: ["lv-cbp-entry"],
        },
        {
          id: "lv-entry-international-t3",
          scenarioLabel: "International Visitors Arriving at LAS Terminal 3 or Connecting via U.S. Hubs",
          dependencies: {
            nationality: "Visa Waiver Program (VWP) citizens, Canadian citizens, or visa-required nationals",
            passportAndDocuments: "Valid e-Passport + approved ESTA (for VWP citizens) or B-1/B-2 U.S. visitor visa",
            residenceContext: "International residents",
            routingAndTransit: "Direct international arrival into LAS Terminal 3 CBP facility or domestic connection",
            tripPurpose: "Tourism, conference/trade show attendance (up to 90 days on ESTA)",
            dateAndValidityRule: "ESTA must be approved at least 72 hours before boarding",
          },
          officialRequirementSummary:
            "International travelers from Visa Waiver Program countries must hold an approved Electronic System for Travel Authorization (ESTA) and a valid machine-readable e-Passport; visa-required nationals must hold a valid U.S. nonimmigrant visa.",
          dccPracticalExplanation:
            "International visitors planning to visit Vegas nightclubs or bars should carry their physical passport (or a secondary government driver's license alongside a passport copy where accepted), as foreign national ID cards are often declined by venue scanners.",
          officialLinks: [
            {
              label: "Official U.S. CBP ESTA Application Portal",
              url: "https://esta.cbp.dhs.gov/",
              issuingOrganization: "U.S. Customs and Border Protection (CBP)",
              note: "Official U.S. Department of Homeland Security ESTA portal.",
            },
          ],
          citationIds: ["lv-cbp-entry"],
        },
      ],
      safetyHealthAndEmergency: [
        {
          id: "lv-safety-extreme-heat",
          category: "health_guidance",
          title: "Mojave Desert Extreme Heat (May–September) & Rapid Dehydration",
          issuingAuthority: "National Weather Service Las Vegas (VEF) & Southern Nevada Health District",
          authorityType: "official_rule",
          integrationStatus: "live_integrated",
          summary:
            "Summer afternoon highs in the Las Vegas Valley regularly reach 105°F–117°F (41°C–47°C) with single-digit relative humidity, and lower-elevation canyons (Hoover Dam, Lake Mead, Valley of Fire) run 5°F–8°F hotter than the Strip.",
          travelerAction:
            "Because dry desert air evaporates sweat instantly, travelers lose 1–1.5 liters of water per hour outdoors without feeling damp. Schedule desert hikes or Hoover Dam walks before 9:30 AM in summer; Valley of Fire and Lake Mead close exposed trails completely from mid-May through September.",
          officialUrl: "https://www.weather.gov/vef/",
          officialUrlLabel: "NWS Las Vegas Active Heat & Weather Warnings",
          citationIds: ["lv-nws-vegas", "lv-blm-redrock"],
        },
        {
          id: "lv-safety-monsoon-flash-flood",
          category: "official_advisory",
          title: "Summer Monsoon Flash Flooding (July–September) in Desert Washes & Strip Channels",
          issuingAuthority: "National Weather Service Las Vegas & Clark County Regional Flood Control District",
          authorityType: "official_rule",
          integrationStatus: "live_integrated",
          summary:
            "Summer monsoon thunderstorms over the Spring Mountains send fast-moving flash floods through desert slot canyons and down the Flamingo Wash directly beneath the center Strip (near Caesars, Bellagio, and The LINQ).",
          travelerAction:
            "Never enter desert washes or slot canyons when thunderstorms are forecast anywhere in the watershed, and avoid flooded low-water road crossings.",
          officialUrl: "https://www.weather.gov/vef/",
          officialUrlLabel: "NWS Las Vegas Flash Flood & Radar Portal",
          citationIds: ["lv-nws-vegas"],
        },
        {
          id: "lv-emergency-services",
          category: "emergency_services",
          title: "Emergency Services & Level I Trauma Care (UMC Southern Nevada)",
          issuingAuthority: "Las Vegas Metropolitan Police Department (LVMPD) & University Medical Center of Southern Nevada",
          authorityType: "official_resource_link",
          integrationStatus: "linked_official_resource",
          summary:
            "Dial 911 for emergencies on the Strip, Downtown, or surrounding highways. University Medical Center (UMC, 1800 W Charleston Blvd) is Nevada's Level I Trauma Center and Burn Care facility; Sunrise Hospital serves the east side of the Strip.",
          travelerAction:
            "Inside large Strip casino complexes, notify resort security immediately alongside calling 911 so security can escort paramedics directly to the correct hotel tower elevator or floor.",
          officialUrl: "https://www.umcsn.com/",
          officialUrlLabel: "University Medical Center of Southern Nevada",
          citationIds: ["lv-nws-vegas"],
        },
      ],
    },
    timingSeasonalityAndAccess: {
      sectionTitle: "Timing, Seasonality, Accessibility & Federal Site Rules",
      leadSummary:
        "Las Vegas operates 365 days a year, but desert outdoor access, pool seasons, and major convention/sports weeks shift the practical rules of a trip.",
      items: [
        {
          id: "lv-season-desert-vs-pool",
          category: "seasonality",
          title: "Prime Desert Hiking Season (Oct–April) vs. Pool & Dayclub Season (March–October)",
          windowOrScope: "Oct–April (60°F–80°F Desert Hiking) • May–Sept (100°F–115°F Pool & Indoor Season)",
          authorityType: "observation",
          factualBasis:
            "October through April offers ideal temperatures for Red Rock Canyon, Valley of Fire, and Hoover Dam walking tours, while many resort pool decks reduce hours or close non-heated pools between November and February.",
          dccInterpretation:
            "In winter (Dec–Feb), desert mornings at Red Rock Canyon or Grand Canyon West can drop into the 30s°F with brisk winds—pack a windproof layer even if you are staying on the Strip.",
          citationIds: ["lv-blm-redrock", "lv-nws-vegas"],
        },
        {
          id: "lv-closure-redrock-timed-entry",
          category: "closure_or_restriction",
          title: "Red Rock Canyon Mandatory Timed-Entry Season (October 1 – May 31)",
          windowOrScope: "Daily 8:00 AM – 5:00 PM from October 1 through May 31",
          authorityType: "official_rule",
          factualBasis:
            "The Bureau of Land Management requires a timed-entry reservation via Recreation.gov (in addition to the standard park entrance fee or America the Beautiful pass) for all personal vehicles entering the 13-mile Scenic Drive between 8:00 AM and 5:00 PM from October 1 through May 31.",
          dccInterpretation:
            "If timed-entry slots are sold out for your self-drive window, booking a permitted guided tour or e-bike/Jeep excursion includes commercial entry authorization.",
          officialUrl: "https://www.blm.gov/programs/national-conservation-lands/nevada/red-rock-canyon",
          officialUrlLabel: "BLM Red Rock Canyon Timed Entry Rules",
          citationIds: ["lv-blm-redrock"],
        },
        {
          id: "lv-closure-hoover-security",
          category: "closure_or_restriction",
          title: "Hoover Dam Security Checkpoint & Powerplant Tour Rules",
          windowOrScope: "US-93 / NV-172 Hoover Dam Access Road & Visitor Center (9:00 AM – 5:00 PM)",
          authorityType: "official_rule",
          factualBasis:
            "All vehicles driving onto the Hoover Dam crest road pass through a U.S. Bureau of Reclamation police inspection checkpoint; luggage, large backpacks, weapons, and drones are strictly prohibited inside the Hoover Dam Visitor Center and guided Powerplant/Dam tours.",
          dccInterpretation:
            "Never bring airport luggage on a self-drive stop at the Hoover Dam Visitor Center unless it remains locked in your vehicle trunk during security inspection; guided tours cannot be reserved online in advance for the inner-dam chambers and are sold first-come, first-served on site (or bundled via permitted tour operators).",
          officialUrl: "https://www.usbr.gov/lc/hooverdam/service/visit.html",
          officialUrlLabel: "U.S. Bureau of Reclamation Hoover Dam Visitor Guidelines",
          citationIds: ["lv-usbr-hoover"],
        },
        {
          id: "lv-accessibility-strip",
          category: "accessibility",
          title: "Strip Pedestrian Overpass Elevators, Mobility Scooter Access & Canyon Viewpoints",
          windowOrScope: "Las Vegas Blvd Overpasses, Resort Trams, Hoover Dam & Grand Canyon West",
          authorityType: "official_rule",
          factualBasis:
            "Clark County maintains public elevators at Strip pedestrian bridges, and the Las Vegas Monorail, RTC Deuce, Hoover Dam Visitor Center, and Grand Canyon West Skywalk are wheelchair accessible.",
          dccInterpretation:
            "Because single Strip pedestrian-bridge elevator outages can add a 15-minute detour, travelers using mobility scooters or wheelchairs should allow 30–40 minutes when crossing between major Strip intersections prior to a timed 7:00 PM or 9:30 PM residency show.",
          citationIds: ["lv-rtc-monorail", "lv-usbr-hoover"],
        },
      ],
    },
    operationalBoundaries: {
      headline: "Live Conditions vs. FAA Helicopter Dispatch, BLM Trail Closures & Venue Box Offices",
      weatherVsOperationsExplanation:
        "DCC integrates live NWS Las Vegas heat/wind/flood warnings, KLAS airport METAR/TAF aviation observations, USGS seismic data, and Open-Meteo atmospheric models. However, weather data on this page does NOT establish whether a Grand Canyon helicopter operator is holding flights for canyon turbulence, whether BLM has closed Red Rock Scenic Drive for capacity, or whether a Strip residency show has seats remaining.",
      missingOrExpiredDataRule:
        "If any upstream NOAA, NWS, FAA, or USGS feed is unreachable or expired, DCC displays 'Unavailable / Unverified'—never '0 alerts' or 'All Clear'.",
      whatIsLiveIntegrated: [
        "U.S. National Weather Service (NWS Las Vegas) active warnings, Extreme Heat Warnings, Flash Flood Warnings, and point forecasts",
        "NOAA/NWS Aviation Weather Center live METAR & TAF for Harry Reid International Airport (KLAS)",
        "Open-Meteo current weather, 12-hour/3-day forecast, and EPA/CAMS Air Quality Index",
        "USGS 500 km earthquake feed",
      ],
      whatRequiresOfficialExternalCheck: [
        {
          capability: "Grand Canyon & Strip Helicopter Wind Holds",
          whyNotAutomated:
            "FAA Part 135 helicopter operators hold flights dynamically when Mojave or Colorado River canyon gusts exceed aircraft limits (typically 30–35+ knots).",
          officialSourceLabel: "Confirm directly with your flight operator or Save On The Strip",
          officialSourceUrl: "https://saveonthestrip.com/tours",
        },
        {
          capability: "Red Rock Canyon Timed-Entry Slot Availability",
          whyNotAutomated:
            "Recreation.gov timed-entry quotas update dynamically as vehicles book or cancel.",
          officialSourceLabel: "BLM / Recreation.gov Red Rock Scenic Drive",
          officialSourceUrl: "https://www.blm.gov/programs/national-conservation-lands/nevada/red-rock-canyon",
        },
      ],
    },
    specialistHandoffs: {
      sectionTitle: "Specialist Guides & Context-Preserving Las Vegas Handoffs",
      leadSummary:
        "Once you have mapped out whether your group wants Grand Canyon West vs. South Rim, Hoover Dam express vs. full-day, or a Strip show night, carry your dates and party size into DCC's verified Las Vegas specialists.",
      contextControls: {
        supportsDate: true,
        supportsPartySize: true,
        customSelectorLabel: "Trip Window / Priority",
        customSelectorParam: "focus",
        customSelectorOptions: [
          { value: "shows_night", label: "Strip Shows, Residencies & Sphere" },
          { value: "grand_canyon_heli", label: "Grand Canyon Helicopter & Skywalk" },
          { value: "hoover_dam_halfday", label: "Hoover Dam Express / Half-Day" },
          { value: "red_rock_valley", label: "Red Rock Canyon & Valley of Fire" },
        ],
      },
      options: [
        {
          id: "handoff-sots-shows",
          partnerName: "Save On The Strip — Shows & Residency Guide",
          partnerRole: "specialist_guide",
          integrationMode: "context_handoff_link",
          description:
            "Dedicated Las Vegas show-night comparison covering Cirque du Soleil, Sphere, magic, comedy, and headliner residencies by resort zone and curtain time.",
          whenItHelps:
            "Best when matching a 7:00 PM or 9:30 PM show to your hotel's Strip zone so you avoid cross-corridor gridlock.",
          noPurchaseRequiredNote:
            "Carries your date and group size into the Save On The Strip show guide. No purchase required.",
          baseUrl: "https://saveonthestrip.com/shows",
          supportedContextParams: ["date", "partySize"],
          defaultParams: {
            source_surface: "dcc_vegas_reference",
            destination: "las-vegas",
          },
        },
        {
          id: "handoff-sots-tours",
          partnerName: "Save On The Strip — Canyon, Dam & Helicopter Planner",
          partnerRole: "excursion_specialist",
          integrationMode: "context_handoff_link",
          description:
            "Compares Grand Canyon West vs. South Rim coaches, canyon-floor helicopter landings, Strip night flights, and Hoover Dam half-day tours.",
          whenItHelps:
            "Best when deciding how much of your day to commit to the desert while protecting your evening show or dinner reservation.",
          noPurchaseRequiredNote:
            "Passes your date and group size directly into the Las Vegas tour comparison view.",
          baseUrl: "https://saveonthestrip.com/tours",
          supportedContextParams: ["date", "partySize"],
          defaultParams: {
            source_surface: "dcc_vegas_reference",
            destination: "las-vegas",
          },
        },
        {
          id: "handoff-dcc-vegas-day-trips",
          partnerName: "DCC Las Vegas Day-Trip Decision Guide",
          partnerRole: "specialist_guide",
          integrationMode: "context_handoff_link",
          description:
            "Internal DCC route comparison for Grand Canyon, Hoover Dam, Red Rock Canyon, Valley of Fire, and Antelope Canyon drive times and trade-offs.",
          whenItHelps:
            "Best when comparing self-drive versus guided coach/helicopter logistics before leaving the Strip.",
          noPurchaseRequiredNote:
            "Internal DCC reference guide; no purchase required.",
          baseUrl: "/las-vegas/best-day-trips",
          supportedContextParams: ["date", "partySize"],
          defaultParams: {
            source_surface: "dcc_vegas_reference",
          },
        },
      ],
    },
    relationships: [
      {
        id: "rel-lv-coord-primary",
        label: "Las Vegas Strip Center Coordinate (36.11470, -115.17280)",
        relationship: "canonical_coordinate",
        href: "/location/36.11470/-115.17280",
        coordinate: { lat: 36.1147, lng: -115.1728 },
        summary: "Canonical live telemetry page for the Las Vegas Strip.",
      },
      {
        id: "rel-lv-strip-guide",
        label: "Las Vegas Strip District Guide (/las-vegas-strip)",
        relationship: "city",
        href: "/las-vegas-strip",
        summary: "Detailed resort-cluster and pedestrian routing guide along Las Vegas Boulevard.",
      },
      {
        id: "rel-lv-red-rock",
        label: "Red Rock Canyon Guide (/red-rock-canyon)",
        relationship: "region",
        href: "/red-rock-canyon",
        coordinate: { lat: 36.1358, lng: -115.4275 },
        summary: "Half-day desert conservation area guide 17 miles west of the Strip.",
      },
      {
        id: "rel-lv-hoover-dam",
        label: "Hoover Dam Guide (/hoover-dam)",
        relationship: "venue",
        href: "/hoover-dam",
        coordinate: { lat: 36.0161, lng: -114.7377 },
        summary: "Black Canyon engineering landmark and Lake Mead gateway 35 miles southeast.",
      },
      {
        id: "rel-lv-grand-canyon",
        label: "Grand Canyon from Las Vegas Guide (/grand-canyon)",
        relationship: "region",
        href: "/grand-canyon",
        summary: "West Rim (Skywalk) vs. South Rim (National Park) route and helicopter comparison.",
      },
    ],
    evidenceRegistry: [
      {
        id: "lv-las-airport",
        claimSummary: "Harry Reid International Airport (LAS) operates Terminal 1 and Terminal 3 with designated garage rideshare zones and Nevada Taxicab Authority Strip fare zones.",
        sourceTitle: "Harry Reid International Airport — Ground Transportation & Terminals",
        sourceUrl: "https://www.harryreidairport.com/Transportation",
        issuingOrganization: "Clark County Department of Aviation",
        authorityType: "official_rule",
        integrationStatus: "curated_verified",
        geographicScope: "Harry Reid International Airport (LAS), Paradise / Clark County, NV",
        applicableTravelerContext: "Air travelers arriving at or departing from Las Vegas",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "lv-rtc-monorail",
        claimSummary: "RTC of Southern Nevada operates the 24-hour Deuce bus along the Strip and Downtown Fremont; the Las Vegas Monorail connects 7 east-side Strip stations.",
        sourceTitle: "Regional Transportation Commission of Southern Nevada (RTC) — Fares & Deuce Transit Guide",
        sourceUrl: "https://www.rtcsnv.com/ways-to-travel/fares-passes/",
        issuingOrganization: "Regional Transportation Commission of Southern Nevada (RTC)",
        authorityType: "official_rule",
        integrationStatus: "linked_official_resource",
        geographicScope: "Las Vegas Strip & Downtown Las Vegas",
        applicableTravelerContext: "Visitors using public transit along Las Vegas Boulevard and Fremont Street",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "lv-blm-redrock",
        claimSummary: "Bureau of Land Management requires timed-entry reservations on Recreation.gov for vehicles entering the Red Rock Canyon 13-mile Scenic Drive between 8:00 AM and 5:00 PM from October 1 through May 31.",
        sourceTitle: "Bureau of Land Management — Red Rock Canyon National Conservation Area",
        sourceUrl: "https://www.blm.gov/programs/national-conservation-lands/nevada/red-rock-canyon",
        issuingOrganization: "U.S. Bureau of Land Management (Department of the Interior)",
        authorityType: "official_rule",
        integrationStatus: "curated_verified",
        geographicScope: "Red Rock Canyon National Conservation Area, Clark County, NV",
        applicableTravelerContext: "Self-drive visitors and hikers visiting Red Rock Canyon",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "lv-usbr-hoover",
        claimSummary: "U.S. Bureau of Reclamation enforces vehicle security checkpoints on Hoover Dam access roads and prohibits luggage, large bags, and drones inside the Visitor Center and Dam/Powerplant tours.",
        sourceTitle: "U.S. Bureau of Reclamation — Hoover Dam Visiting & Security Guidelines",
        sourceUrl: "https://www.usbr.gov/lc/hooverdam/service/visit.html",
        issuingOrganization: "U.S. Bureau of Reclamation (Department of the Interior)",
        authorityType: "official_rule",
        integrationStatus: "curated_verified",
        geographicScope: "Hoover Dam, NV/AZ Border",
        applicableTravelerContext: "Visitors driving to or touring Hoover Dam",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "lv-cbp-entry",
        claimSummary: "U.S. Customs and Border Protection ESTA/visa rules for Terminal 3 international arrivals and TSA REAL ID requirements for domestic flights.",
        sourceTitle: "U.S. Customs and Border Protection — ESTA & International Visitor Requirements",
        sourceUrl: "https://www.cbp.gov/travel/international-visitors/esta",
        issuingOrganization: "U.S. Customs and Border Protection (DHS)",
        authorityType: "official_rule",
        integrationStatus: "curated_verified",
        geographicScope: "Harry Reid International Airport (LAS) Terminal 3 & U.S. Ports of Entry",
        applicableTravelerContext: "International and domestic air travelers visiting Las Vegas",
        publishedOrUpdatedDate: "2026",
        lastCheckedAt: "2026-10-24",
      },
      {
        id: "lv-nws-vegas",
        claimSummary: "Live Mojave Desert weather alerts, Extreme Heat Warnings, Flash Flood Warnings, KLAS aviation observations, and 3-day forecasts for Las Vegas (36.11470, -115.17280).",
        sourceTitle: "National Weather Service Las Vegas (VEF) & Open-Meteo API",
        sourceUrl: "https://www.weather.gov/vef/",
        issuingOrganization: "NOAA / National Weather Service & Open-Meteo",
        authorityType: "forecast",
        integrationStatus: "live_integrated",
        geographicScope: "Las Vegas Valley, Spring Mountains, and Lake Mead / Black Canyon",
        applicableTravelerContext: "All travelers checking heat, wind, and monsoon flash-flood conditions",
        publishedOrUpdatedDate: "Live / Continuous",
        lastCheckedAt: "2026-10-24",
      },
    ],
  },
};

export type EarthosEnvironmentScope = "production" | "nonprod";

export function resolveEarthosEnvironmentScope(): EarthosEnvironmentScope {
  const explicit = (
    process.env.DCC_EARTHOS_ENV ||
    process.env.DCC_ENVIRONMENT_SCOPE ||
    ""
  )
    .trim()
    .toLowerCase();
  if (explicit === "production") return "production";
  if (
    explicit === "nonprod" ||
    explicit === "preview" ||
    explicit === "development" ||
    explicit === "test"
  ) {
    return "nonprod";
  }
  if (process.env.VERCEL_ENV?.trim().toLowerCase() === "production") {
    return "production";
  }
  return "nonprod";
}

export type PublishedReferenceNodeOverride = {
  nodeId: TravelReferenceNode["id"];
  environmentScope?: EarthosEnvironmentScope;
  updatedAt: string;
  appliedTaskId: string | null;
  appliedBy: string;
  clearedAt?: string;
  clearedBy?: string;
  lastReviewedAt?: string;
  specialistHandoffBaseUrls?: Record<string, string>;
  evidenceReviews?: Record<
    string,
    {
      lastCheckedAt: string;
      publishedOrUpdatedDate?: string | null;
      verificationNote?: string;
      reviewedBy: string;
      reviewedSourceUrl: string;
    }
  >;
  relationshipHrefs?: Record<string, string>;
};

export function buildReferenceOverrideFindingId(
  nodeId: TravelReferenceNode["id"],
  scope: EarthosEnvironmentScope = resolveEarthosEnvironmentScope(),
): string {
  return `control-map:travel-reference-override:${scope}:${nodeId}`;
}

export function buildLegacyReferenceOverrideFindingId(nodeId: TravelReferenceNode["id"]): string {
  return `control-map:travel-reference-override:${nodeId}`;
}

const DISALLOWED_PRODUCTION_TEST_URLS = new Set([
  "https://juneauflightdeck.com/juneau-helicopters",
  "https://juneauflightdeck.com/best-excursions-in-juneau",
  "https://welcometoalaskatours.com/juneau/cruise-port",
  "https://welcometoalaskatours.com/juneau-shore-excursions",
  "/juneau-helicopters",
  "/juneau/cruise-port",
]);

export async function readPublishedReferenceNodeOverrideFromDb(
  id: TravelReferenceNode["id"],
  scope: EarthosEnvironmentScope = resolveEarthosEnvironmentScope(),
): Promise<PublishedReferenceNodeOverride | null> {
  const db = await getRequiredEarthosDb();

  const rows = await db
    .select()
    .from(earthosControlMapFindings)
    .where(eq(earthosControlMapFindings.findingId, buildReferenceOverrideFindingId(id, scope)))
    .limit(1);

  const row = rows[0];
  if (!row || row.status !== "applied" || !row.metadata) {
    return null;
  }

  const override = row.metadata as unknown as PublishedReferenceNodeOverride;
  if (scope === "production") {
    if (override.environmentScope !== "production") {
      return null;
    }
    if (/seed|test|regression/i.test(override.appliedBy || "")) {
      return null;
    }
    const handoffUrls = Object.values(override.specialistHandoffBaseUrls || {});
    if (handoffUrls.some((u) => DISALLOWED_PRODUCTION_TEST_URLS.has(u.trim()))) {
      return null;
    }
  }

  return override;
}

export function applyPublishedReferenceNodeOverride(
  baseNode: TravelReferenceNode,
  override: PublishedReferenceNodeOverride | null,
): TravelReferenceNode {
  if (!override) return baseNode;
  const cloned: TravelReferenceNode = structuredClone(baseNode);

  if (override.lastReviewedAt) {
    cloned.lastReviewedAt = override.lastReviewedAt;
  }

  if (override.specialistHandoffBaseUrls) {
    for (const [handoffId, baseUrl] of Object.entries(override.specialistHandoffBaseUrls)) {
      const option = cloned.specialistHandoffs.options.find((opt) => opt.id === handoffId);
      if (option) {
        option.baseUrl = baseUrl;
      }
    }
  }

  if (override.evidenceReviews) {
    for (const [citationId, review] of Object.entries(override.evidenceReviews)) {
      const citation = cloned.evidenceRegistry.find((cit) => cit.id === citationId);
      if (citation) {
        citation.lastCheckedAt = review.lastCheckedAt;
        if (review.publishedOrUpdatedDate !== undefined) {
          citation.publishedOrUpdatedDate = review.publishedOrUpdatedDate;
        }
        if (review.verificationNote) {
          citation.verificationNote = review.verificationNote;
        }
      }
    }
  }

  if (override.relationshipHrefs) {
    for (const [relId, href] of Object.entries(override.relationshipHrefs)) {
      const rel = cloned.relationships.find((r) => r.id === relId);
      if (rel) {
        rel.href = href;
      }
    }
  }

  return cloned;
}

export function getBaseTravelReferenceNodeById(id: TravelReferenceNode["id"]): TravelReferenceNode {
  return TRAVEL_REFERENCE_NODES[id];
}

export function getTravelReferenceNodeById(id: TravelReferenceNode["id"]): TravelReferenceNode {
  return TRAVEL_REFERENCE_NODES[id];
}

export async function getPublishedTravelReferenceNodeById(
  id: TravelReferenceNode["id"],
): Promise<TravelReferenceNode> {
  const override = await readPublishedReferenceNodeOverrideFromDb(id);
  return applyPublishedReferenceNodeOverride(TRAVEL_REFERENCE_NODES[id], override);
}

export function getAllTravelReferenceNodes(): TravelReferenceNode[] {
  return [
    TRAVEL_REFERENCE_NODES.juneau,
    TRAVEL_REFERENCE_NODES["red-rocks"],
    TRAVEL_REFERENCE_NODES["denver-breckenridge"],
    TRAVEL_REFERENCE_NODES["new-orleans"],
    TRAVEL_REFERENCE_NODES["las-vegas"],
  ];
}

export async function getAllPublishedTravelReferenceNodes(): Promise<TravelReferenceNode[]> {
  return Promise.all([
    getPublishedTravelReferenceNodeById("juneau"),
    getPublishedTravelReferenceNodeById("red-rocks"),
    getPublishedTravelReferenceNodeById("denver-breckenridge"),
    getPublishedTravelReferenceNodeById("new-orleans"),
    getPublishedTravelReferenceNodeById("las-vegas"),
  ]);
}

export const listTravelReferenceNodes = getAllTravelReferenceNodes;

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type CoordinateReferenceMatch = {
  primaryNode: TravelReferenceNode;
  relatedNodes: TravelReferenceNode[];
  distanceKm: number;
  matchedAnchorLabel: string;
  matchType: "exact_anchor" | "nearby_corridor";
};

/**
 * Connects any coordinate page (/location/[lat]/[lng]) or API call (/api/location/[lat]/[lng])
 * to the applicable Destination Travel Reference node(s) when within geographic range.
 */
export function resolveTravelReferenceForCoordinate(
  lat: number,
  lng: number,
): CoordinateReferenceMatch | null {
  const candidates: Array<{
    node: TravelReferenceNode;
    distKm: number;
    anchorLabel: string;
  }> = [];

  for (const node of getAllTravelReferenceNodes()) {
    const primaryDist = haversineDistanceKm(
      lat,
      lng,
      node.primaryCoordinate.lat,
      node.primaryCoordinate.lng,
    );
    candidates.push({
      node,
      distKm: primaryDist,
      anchorLabel: node.primaryCoordinate.label,
    });

    for (const sec of node.secondaryCoordinates) {
      const secDist = haversineDistanceKm(lat, lng, sec.lat, sec.lng);
      candidates.push({
        node,
        distKm: secDist,
        anchorLabel: sec.label,
      });
    }
  }

  candidates.sort((a, b) => a.distKm - b.distKm);
  const best = candidates[0];
  if (!best || best.distKm > 35) {
    return null;
  }

  const relatedMap = new Map<string, TravelReferenceNode>();
  for (const cand of candidates) {
    if (cand.distKm <= 50 && cand.node.id !== best.node.id) {
      relatedMap.set(cand.node.id, cand.node);
    }
  }

  return {
    primaryNode: best.node,
    relatedNodes: [...relatedMap.values()],
    distanceKm: Number(best.distKm.toFixed(2)),
    matchedAnchorLabel: best.anchorLabel,
    matchType: best.distKm <= 2 ? "exact_anchor" : "nearby_corridor",
  };
}
