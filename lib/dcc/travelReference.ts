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
  id: "juneau" | "red-rocks" | "denver-breckenridge";
  slug: string;
  canonicalPath: string;
  aliasPaths: string[];
  placeType: "coastal_capital_and_cruise_port" | "foothill_amphitheatre_and_park" | "alpine_interstate_corridor";
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
            "Even if flying domestically to Juneau, bring a valid U.S. Passport Book or Passport Card if there is any chance you will take a regional ferry or excursion that enters British Columbia or the Yukon.",
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
            passportAndDocuments: "Valid Passport Book + U.S. ESTA (or B1/B2 Visa) for U.S. entry; for Canada: Canadian eTA is required ONLY for visa-exempt foreign nationals arriving/transiting by AIR (e.g., flying into YVR), whereas sea/land entry (cruise calls at Victoria/Vancouver or Yukon rail/bus excursions) requires a valid passport for visa-exempt nationals or a Canadian Temporary Resident Visa (TRV) for visa-required nationals. (U.S. citizens and U.S. Lawful Permanent Residents are exempt from Canadian eTA.)",
            residenceContext: "International arrival or open-jaw U.S.–Canada air/sea itinerary",
            routingAndTransit: "Air arrival into Vancouver (YVR) vs. sea arrival at Victoria/Vancouver cruise ports or land excursions into British Columbia / Yukon",
            tripPurpose: "Tourism / Transit",
            dateAndValidityRule: "Applicable U.S. (ESTA/Visa) and Canadian (eTA for air arrival, or TRV for visa-required nationals) authorizations must be approved before embarkation.",
          },
          officialRequirementSummary:
            "Because Alaska cruises transit both U.S. ports (Juneau, Ketchikan, Skagway) and Canadian ports (Vancouver or Victoria), non-U.S. travelers must satisfy entry rules for BOTH countries—but Canadian document rules depend strictly on mode of entry (air vs. land/sea) and nationality.",
          dccPracticalExplanation:
            "Do not overgeneralize the Canadian eTA: (1) U.S. citizens and U.S. Green Card holders never need a Canadian eTA; (2) Visa-exempt foreign nationals (e.g., UK, EU, Australia) need a Canadian eTA ONLY if flying into or through a Canadian airport (such as flying into Vancouver to board a one-way cruise)—they do NOT need an eTA when entering Canada solely by cruise ship (sea) or on a Skagway/Juneau land excursion into the Yukon/BC, where a valid passport suffices; (3) Visa-required foreign nationals need a Canadian Temporary Resident Visa (TRV) for air, sea, OR land entry.",
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
              note: "Official IRCC rules showing eTA applies to air arrival/transit for visa-exempt foreign nationals, not land/sea arrival.",
            },
          ],
          citationIds: ["jun-cbp-whti", "jun-cbsa-entry"],
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
          baseUrl: "https://juneauflightdeck.com/best-excursions-in-juneau",
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
          baseUrl: "https://welcometoalaskatours.com/juneau-shore-excursions",
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
};

export function getAllTravelReferenceNodes(): TravelReferenceNode[] {
  return [
    TRAVEL_REFERENCE_NODES.juneau,
    TRAVEL_REFERENCE_NODES["red-rocks"],
    TRAVEL_REFERENCE_NODES["denver-breckenridge"],
  ];
}

export const listTravelReferenceNodes = getAllTravelReferenceNodes;

export function getTravelReferenceNodeById(id: TravelReferenceNode["id"]): TravelReferenceNode {
  return TRAVEL_REFERENCE_NODES[id];
}

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
