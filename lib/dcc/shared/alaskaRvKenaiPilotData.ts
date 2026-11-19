/**
 * Sourced Kenai Peninsula RV Pilot Dataset (`dcc.alaska-rv.v1`)
 *
 * Bounded Pilot: Fly-to-Anchorage, rent-an-RV, explore the Kenai Peninsula
 * (Anchorage, Seward, and Homer candidate bases, plus Girdwood/Cooper Landing/Soldotna
 * practical checkpoints and Whittier/Homer AMHS ferry carriage verification rules).
 *
 * Primary-source & authority retrieval date: 2026-11-19.
 * Unknown facts remain explicitly unknown (`null` / `'not_checked'` / unresolved ledger).
 */

import {
  ALASKA_RV_CONTRACT_VERSION,
  ALASKA_RV_PLANNER_INTEGRATION_CONTRACT_VERSION,
  type AlaskaRvActivityExperienceRecord,
  type AlaskaRvCampgroundRecord,
  type AlaskaRvEntryModeDescriptor,
  type AlaskaRvExistingToolComparison,
  type AlaskaRvFerryCorridorRuleRecord,
  type AlaskaRvHighwayCorridorRecord,
  type AlaskaRvPilotDayTemplate,
  type AlaskaRvPlaceRecord,
  type AlaskaRvPracticalServiceStopRecord,
  type AlaskaRvRentalOperatorRecord,
  type DccCpIndependentRvPlannerIntegrationSpec,
} from "./alaskaRvContract";

export const ALASKA_RV_PILOT_OBSERVED_AT = "2026-11-19" as const;

export const ALASKA_RV_ENTRY_MODES: readonly AlaskaRvEntryModeDescriptor[] = [
  {
    mode: "fly_and_rent_anc",
    title: "1. Fly In & Rent an RV in Anchorage (Bounded Pilot)",
    pilotSupportLevel: "full_interactive_pilot",
    summary:
      "Fly into Ted Stevens Anchorage International Airport (ANC), complete afternoon motorhome orientation and grocery provisioning in Anchorage, and loop the paved Seward and Sterling Highways across the Kenai Peninsula.",
    whoItFits:
      "Travelers with 8–12 days who want maximum time in coastal Alaska without spending 8–14 additional days driving round-trip through Canada.",
    keyOperationalRealities: [
      "Afternoon pickup appointments (typically 1:00 PM–5:00 PM; Great Alaskan Holidays orientations do not start after 5:15 PM) plus 1.5–2.5h grocery provisioning make Anchorage the realistic Night 1 stay.",
      "Morning return cutoffs (often 8:00 AM–10:00 AM with fuel/propane full) require staging back near Anchorage the evening before departure rather than driving 225 miles from Homer on return morning.",
      "Rental contracts enforce unpaved-road bans (e.g., McCarthy Rd, Dalton Hwy north of the Arctic Circle) independent of whether Alaska 511 shows those roads physically open.",
    ],
    deferredScopeBoundary: null,
    sources: [
      {
        label: "Travel Alaska — Tips for RV Travel in Alaska",
        url: "https://www.travelalaska.com/explore-alaska/articles/tips-rv-travel-alaska",
        sourceKind: "official_dmo_tourism",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
      {
        label: "Great Alaskan Holidays — Rental Policies & Fleet",
        url: "https://www.greatalaskanholidays.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
  },
  {
    mode: "drive_from_outside_ak",
    title: "2. Drive Your Own RV to Alaska from Outside Alaska",
    pilotSupportLevel: "documented_entry_mode_routing_deferred",
    summary:
      "Bring a traveler-owned motorhome, truck camper, fifth-wheel, or travel trailer north via the Alaska Highway or Cassiar Highway through British Columbia and Yukon into Alaska.",
    whoItFits:
      "Long-horizon travelers (typically 3–8+ weeks round-trip) bringing custom big rigs, fifth-wheels, or towed 'toad' vehicles.",
    keyOperationalRealities: [
      "Rental-company gravel road prohibitions do not apply to your own rig, but physical frost heaves, gravel construction zones, and Alaska 511 closures still govern every leg.",
      "Longer owned setups (35–45+ ft motorhomes or fifth-wheels plus towed vehicles) hit strict site-level length ceilings at public campgrounds like Seward Waterfront dry rows or USFS loops.",
      "Requires international U.S./Canada border documentation, spare-tire/windshield readiness, and wide-gap fuel planning across northern BC and Yukon.",
    ],
    deferredScopeBoundary:
      "Once inside Southcentral Alaska, you can switch this planner to 'Traveler-Owned RV' for the Kenai Peninsula loop today. Comprehensive multi-week Canada highway routing (Alaska Highway / Cassiar / Top of the World) and statewide Interior coverage are deferred.",
    sources: [
      {
        label: "Travel Alaska — Tips for RV Travel in Alaska",
        url: "https://www.travelalaska.com/explore-alaska/articles/tips-rv-travel-alaska",
        sourceKind: "official_dmo_tourism",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
      {
        label: "Alaska DOT&PF 511 Traveler Information",
        url: "https://511.alaska.gov/",
        sourceKind: "federal_or_state_agency",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
  },
  {
    mode: "ferry_plus_rv",
    title: "3. Combine an RV with the Alaska Marine Highway Ferry (AMHS)",
    pilotSupportLevel: "documented_entry_mode_routing_deferred",
    summary:
      "Carry an owned RV (or contractually authorized rental) aboard Alaska Marine Highway System vessels — either one-way from Bellingham/Prince Rupert or on Southcentral regional sailings out of Whittier or Homer.",
    whoItFits:
      "Travelers pairing coastal marine passages (Prince William Sound, Kodiak, or Inside Passage) with highway RV travel.",
    keyOperationalRealities: [
      "A passenger ticket NEVER reserves car-deck space: AMHS requires an explicit vehicle reservation priced by exact bumper-to-bumper length (including racks, spare tires, and hitches), height, and width (>8'6\" wide surcharges).",
      "Vehicles must check in 2–3 hours prior to sailing (3 hours at Bellingham and on Cross-Gulf sailings); propane valves must be shut off and tagged by crew.",
      "Car decks are locked underway — sleeping inside your RV is prohibited, and steep low-tide transfer ramps can scrape long rear motorhome overhangs.",
    ],
    deferredScopeBoundary:
      "Our planner and confirmation-import engine already validate AMHS vehicle carriage vs. passenger-only tickets, terminal check-in cutoffs, and dimensions. Full Inside Passage / Bellingham-to-Whittier multi-port ferry routing and post-April-2027 AMHS timetable ingestion remain deferred until official schedules publish.",
    sources: [
      {
        label: "Alaska Marine Highway System (AMHS) Official Portal",
        url: "https://dot.alaska.gov/amhs/index.shtml",
        sourceKind: "federal_or_state_agency",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
      {
        label: "Travel Alaska — Tips for RV Travel in Alaska",
        url: "https://www.travelalaska.com/explore-alaska/articles/tips-rv-travel-alaska",
        sourceKind: "official_dmo_tourism",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
  },
] as const;

export const ALASKA_RV_MARKET_LANDSCAPE: readonly AlaskaRvExistingToolComparison[] = [
  {
    toolName: "Travel Alaska Official RV Guidance",
    officialUrl: "https://www.travelalaska.com/explore-alaska/articles/tips-rv-travel-alaska",
    category: "official_alaska_authority",
    whatItDoesWell:
      "Establishes the three entry modes (fly & rent, drive north, ferry + RV), highlights rental gravel-road bans, AMHS propane/car-deck rules, and summer advance booking windows.",
    whatRemainsForTravelerToStitch:
      "Editorial overview only — does not hold a personalized day-by-day itinerary, site hookups, or booking confirmations.",
  },
  {
    toolName: "Alaska DOT&PF 511 & AMHS Official Portals",
    officialUrl: "https://511.alaska.gov/",
    category: "official_alaska_authority",
    whatItDoesWell:
      "Authoritative real-time highway closures, pilot-car construction delays, Anton Anderson (Whittier) tunnel schedules, and official AMHS ferry vehicle tariffs.",
    whatRemainsForTravelerToStitch:
      "Shows live physical highway status, not whether your rental contract allows that road or how delays impact campground check-in and tour shuttles.",
  },
  {
    toolName: "Recreation.gov & Municipal Campground Systems (Campspot)",
    officialUrl: "https://www.recreation.gov/camping/campgrounds/232213",
    category: "official_alaska_authority",
    whatItDoesWell:
      "Authoritative pad-by-pad reservations for USFS campgrounds (like Russian River) and municipal parks (like Seward Waterfront on Campspot).",
    whatRemainsForTravelerToStitch:
      "Each jurisdiction runs a separate portal; travelers still have to reconcile site hookups, dump stops, RV rental pickup windows, and marine tour shuttles across confirmations.",
  },
  {
    toolName: "RV LIFE Trip Wizard",
    officialUrl: "https://tripwizard.rvlife.com/",
    category: "rv_routing_and_campground_app",
    whatItDoesWell:
      "Dedicated RV-safe GPS routing for height/weight clearances, fuel-range circles, and North American campground mapping.",
    whatRemainsForTravelerToStitch:
      "We do NOT replace RV GPS routing; instead we hold Alaska-specific rental road restrictions, tour-operator RV shuttle rules, party RSVPs, and imported confirmations.",
  },
  {
    toolName: "Campendium / Roadtrippers & The Dyrt",
    officialUrl: "https://www.thedyrt.com/",
    category: "rv_routing_and_campground_app",
    whatItDoesWell:
      "Strong crowdsourced campground reviews, carrier cell-signal reports, public-land map layers, and offline campground lookup.",
    whatRemainsForTravelerToStitch:
      "Campground directories do not combine RV pickup/return appointments, AMHS vehicle-deck checks, Kenai Fjords cruise shuttles, and private confirmation imports in one shared party plan.",
  },
  {
    toolName: "iOverlander & The MILEPOST",
    officialUrl: "https://themilepost.com/",
    category: "highway_milepost_reference",
    whatItDoesWell:
      "The MILEPOST documents mile-by-mile highway junctions and pullouts; iOverlander crowdsources seasonal dump stations, water spigots, and boondocking pullouts.",
    whatRemainsForTravelerToStitch:
      "Reference logs and pins still need to be assembled into realistic travel days alongside confirmed reservations for your traveling party.",
  },
] as const;

export const ALASKA_RV_PILOT_PLACES: readonly AlaskaRvPlaceRecord[] = [
  {
    placeId: "dcc:place:us-ak-anchorage-ak:0001",
    slug: "anchorage",
    name: "Anchorage",
    regionLabel: "Anchorage Bowl",
    roleInPilot: "arrival_rental_gateway",
    cpPortDirectoryPath: "/ports/anchorage",
    coordinates: { latitude: 61.2181, longitude: -149.9003 },
    rvBasecampSummary:
      "Primary Alaska air arrival hub (ANC), home to the state's largest motorhome rental fleets, full-size supermarkets, and Night 1 / final-night staging campgrounds.",
    rvParkingAndTownNavigationNote:
      "Midtown/South Anchorage shopping centers have wide lots for provisioning; downtown street parking is tight for rigs over 24 ft.",
    recommendedBaseNightsRange: "1 night on arrival + 1 staging night before morning return",
    sources: [
      {
        label: "Travel Alaska — RV Travel Tips",
        url: "https://www.travelalaska.com/explore-alaska/articles/tips-rv-travel-alaska",
        sourceKind: "official_dmo_tourism",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    placeId: "dcc:place:us-ak-girdwood-ak:0001",
    slug: "girdwood-portage",
    name: "Girdwood & Portage Valley",
    regionLabel: "Turnagain Arm & Portage",
    roleInPilot: "corridor_checkpoint",
    cpPortDirectoryPath: null,
    coordinates: { latitude: 60.9425, longitude: -149.1664 },
    rvBasecampSummary:
      "Scenic Turnagain Arm midpoint (Mile 79–90 Seward Hwy) pairing wildlife viewing with the last reliable highway fuel/water/dump stop before climbing Turnagain Pass.",
    rvParkingAndTownNavigationNote:
      "Alaska Wildlife Conservation Center at Mile 79 accommodates oversized RVs easily; watch high winds and slow traffic along Turnagain Arm pullouts.",
    recommendedBaseNightsRange: "En-route stop (or optional 1-night stopover)",
    sources: [
      {
        label: "Alaska Wildlife Conservation Center — Visit",
        url: "https://alaskawildlife.org/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    placeId: "dcc:port:us-whittier:0001",
    slug: "whittier",
    name: "Whittier",
    regionLabel: "Prince William Sound Gateway",
    roleInPilot: "ferry_gateway",
    cpPortDirectoryPath: "/ports/whittier",
    coordinates: { latitude: 60.7746, longitude: -148.6838 },
    rvBasecampSummary:
      "Prince William Sound marine and AMHS Cross-Gulf / regional ferry terminal accessed via the single-lane Anton Anderson Memorial Tunnel.",
    rvParkingAndTownNavigationNote:
      "Tunnel alternates one-way rail and highway openings on a clocked schedule with strict height/width and propane rules — confirm tunnel & AMHS vehicle staging cutoffs before detouring.",
    recommendedBaseNightsRange: "Day excursion or timed AMHS ferry connection",
    sources: [
      {
        label: "Alaska Marine Highway System (AMHS)",
        url: "https://dot.alaska.gov/amhs/index.shtml",
        sourceKind: "federal_or_state_agency",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    placeId: "dcc:port:us-seward:0001",
    slug: "seward",
    name: "Seward",
    regionLabel: "Eastern Kenai Peninsula",
    roleInPilot: "candidate_base",
    cpPortDirectoryPath: "/ports/seward",
    coordinates: { latitude: 60.1042, longitude: -149.4422 },
    rvBasecampSummary:
      "Gateway to Kenai Fjords National Park marine glacier cruises, Exit Glacier, and Resurrection Bay waterfront camping.",
    rvParkingAndTownNavigationNote:
      "Keep your RV parked at your Seward campground and use tour-operator shuttles, bikes, or waterfront paths — Small Boat Harbor and downtown Railway Ave stalls are standard car size.",
    recommendedBaseNightsRange: "3 nights (2 full local days)",
    sources: [
      {
        label: "NPS — Kenai Fjords National Park (Exit Glacier Area)",
        url: "https://www.nps.gov/kefj/planyourvisit/exit-glacier-area.htm",
        sourceKind: "nps_or_usfs_federal",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    placeId: "dcc:place:us-ak-cooper-landing-ak:0001",
    slug: "cooper-landing",
    name: "Cooper Landing & Russian River",
    regionLabel: "Central Kenai Peninsula",
    roleInPilot: "corridor_checkpoint",
    cpPortDirectoryPath: null,
    coordinates: { latitude: 60.4906, longitude: -149.8294 },
    rvBasecampSummary:
      "Upper Kenai River turquoise canyon and Chugach National Forest dry-camping hub famous for sockeye salmon runs and drift-boat fishing.",
    rvParkingAndTownNavigationNote:
      "Expect narrow two-lane Sterling Highway shoulders, summer angler traffic, and mandatory hard-sided bear food storage in USFS campgrounds.",
    recommendedBaseNightsRange: "Scenic stopover or 1–2 night optional angler base",
    sources: [
      {
        label: "Recreation.gov — Russian River Campground (232213)",
        url: "https://www.recreation.gov/camping/campgrounds/232213",
        sourceKind: "nps_or_usfs_federal",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    placeId: "dcc:place:us-ak-soldotna-ak:0001",
    slug: "soldotna",
    name: "Soldotna",
    regionLabel: "Central Kenai Peninsula",
    roleInPilot: "corridor_checkpoint",
    cpPortDirectoryPath: null,
    coordinates: { latitude: 60.4878, longitude: -151.0583 },
    rvBasecampSummary:
      "Central Kenai Peninsula commercial service hub where Seward-to-Homer RVers restock groceries, top off fuel/propane, and dump holding tanks.",
    rvParkingAndTownNavigationNote:
      "Wide highway commercial lots along the Sterling and Kenai Spur Highways make mid-trip provisioning straightforward.",
    recommendedBaseNightsRange: "1–2 hour mid-corridor service & provisioning stop",
    sources: [
      {
        label: "Alaska DOT&PF 511 — Sterling Highway",
        url: "https://511.alaska.gov/",
        sourceKind: "federal_or_state_agency",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    placeId: "dcc:place:us-ak-homer-ak:0001",
    slug: "homer",
    name: "Homer & Homer Spit",
    regionLabel: "Southern Kenai & Kachemak Bay",
    roleInPilot: "candidate_base",
    cpPortDirectoryPath: "/ports/homer",
    coordinates: { latitude: 59.6425, longitude: -151.5483 },
    rvBasecampSummary:
      "Southern terminus of the paved Sterling Highway on Kachemak Bay, anchored by the 4.5-mile Homer Spit with beachfront RV camping, water taxis to Kachemak Bay State Park, halibut charters, and Southwest AMHS ferries.",
    rvParkingAndTownNavigationNote:
      "The Homer Spit gets congested in peak July — camp on the Spit to walk to harbor slips, or coordinate designated oversized harbor parking before boarding water taxis.",
    recommendedBaseNightsRange: "3 nights (2 full local days)",
    sources: [
      {
        label: "Homer Spit Campground — Site Types & Rules",
        url: "https://www.homerspitcampground.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
] as const;

export const ALASKA_RV_RENTAL_OPERATORS: readonly AlaskaRvRentalOperatorRecord[] = [
  {
    operatorId: "operator:great-alaskan-holidays",
    slug: "great-alaskan-holidays",
    name: "Great Alaskan Holidays",
    depotPlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    depotAddressLabel: "9101 Old Seward Hwy, Anchorage, AK",
    officialWebsite: "https://www.greatalaskanholidays.com/",
    bookingPlatform: "Direct Website",
    publicationStatus: "published_pilot",
    fleetClassesOffered: ["class_b_campervan", "class_c_motorhome"],
    typicalLengthRangeFeet: { min: 21, max: 32 },
    floorplanGuaranteePolicy:
      "Company-owned fleet; advertises guaranteed reserved floorplan (e.g., Winnebago Solis/Ekko vans and 22 ft–31+ ft Class C motorhomes).",
    airportShuttlePolicy:
      "Complimentary ANC airport courtesy shuttle between 7:00 AM and 5:00 PM (confirm after-hours arrival instructions directly).",
    pickupWindowPolicy:
      "Scheduled appointment slots; orientations do not start later than 5:15 PM.",
    mandatoryOrientationNote:
      "Mandatory ~45-minute chassis and coach orientation (advance online orientation video available).",
    returnCutoffPolicy:
      "Vacate motorhome with all belongings by the pre-selected return appointment slot; major credit card (not debit) required for damage deposit.",
    returnCleaningAndDumpPolicy:
      "On-site self-service return dump and fresh water at no dump fee; advertises no mandatory interior cleaning fee ('We do the cleaning').",
    gravelRoadPolicy: "selective_restricted_caution",
    prohibitedRoadCorridorNames: [
      "McCarthy Road (Chitina to Kennecott)",
      "Nabesna Road",
      "Dalton Highway north of the Arctic Circle / Prudhoe Bay",
      "Hatcher Pass unpaved Fishhook–Willow section",
      "Dempster Highway & Campbell Highway (Yukon)",
    ],
    cautionRestrictedRoadCorridorNames: [
      "Denali Highway (AK-8)",
      "Taylor Highway & Top of the World Highway",
      "Steese & Elliott Highways (<=25 mph & tire inspection rules)",
    ],
    canadaCrossBorderPolicy: "Verify current Yukon/BC travel rider on your specific rental contract.",
    unresolvedPolicies: [
      "Exact 2027 nightly seasonal rates, generator/mileage package tiers, and open return-slot inventory are not checked in static pilot data.",
    ],
    sources: [
      {
        label: "Great Alaskan Holidays — Official Fleet & Rental Policies",
        url: "https://www.greatalaskanholidays.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    operatorId: "operator:gonorth-car-rv-rental",
    slug: "gonorth-car-rv-rental",
    name: "GoNorth Car & RV Rental",
    depotPlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    depotAddressLabel: "Anchorage Station (Spenard area), Anchorage, AK",
    officialWebsite: "https://gonorth-alaska.com/",
    bookingPlatform: "Direct Website",
    publicationStatus: "published_pilot",
    fleetClassesOffered: ["truck_camper_4x4", "class_c_motorhome"],
    typicalLengthRangeFeet: { min: 19, max: 30 },
    floorplanGuaranteePolicy: "unknown",
    airportShuttlePolicy: "Verify current Anchorage airport transfer policy on booking confirmation.",
    pickupWindowPolicy: "Scheduled Anchorage station appointment; verify exact pickup hours on contract.",
    mandatoryOrientationNote: "In-person camper tie-down and systems walkthrough at pickup.",
    returnCutoffPolicy: "Scheduled return window per contract; verify fuel, propane, and gravel-cleaning terms.",
    returnCleaningAndDumpPolicy: "Verify current tank-dump and exterior mud/gravel cleaning requirements on contract.",
    gravelRoadPolicy: "gravel_permitted_subject_to_contract",
    prohibitedRoadCorridorNames: [
      "Unmaintained logging/mining trails or winter-only ice roads (verify exact exclusions on contract)",
    ],
    cautionRestrictedRoadCorridorNames: [
      "Dalton Highway, Denali Highway, and McCarthy Road — permitted on eligible 4x4 truck campers/rigs subject to speed, tire, and windshield/undercarriage insurance terms",
    ],
    canadaCrossBorderPolicy: "Permitted with advance notice on eligible fleet; confirm cross-border rider at booking.",
    unresolvedPolicies: [
      "Exact 2027 pickup/return clock cutoffs and undercarriage/windshield deductible tiers require per-vehicle contract verification.",
    ],
    sources: [
      {
        label: "GoNorth Car & RV Rental — Official Alaska Portal",
        url: "https://gonorth-alaska.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    operatorId: "operator:clippership-motorhome-rentals",
    slug: "clippership-motorhome-rentals",
    name: "Clippership Motorhome Rentals",
    depotPlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    depotAddressLabel: "5401 Old Seward Hwy, Anchorage, AK 99518",
    officialWebsite: "https://clippershipcamper.com/",
    bookingPlatform: "Direct Website",
    publicationStatus: "published_pilot",
    fleetClassesOffered: ["class_a_motorhome", "class_b_campervan", "class_c_motorhome"],
    typicalLengthRangeFeet: { min: 20, max: 32 },
    floorplanGuaranteePolicy: "unknown",
    airportShuttlePolicy: "Verify current ANC airport transfer arrangement when booking.",
    pickupWindowPolicy: "Scheduled Anchorage depot pickup; confirm exact afternoon window on reservation.",
    mandatoryOrientationNote: "Depot vehicle walkthrough prior to departure.",
    returnCutoffPolicy: "Morning return cutoff per contract; confirm fuel, propane, and dump rules.",
    returnCleaningAndDumpPolicy: "Confirm current interior cleaning and holding-tank dump fee schedule directly.",
    gravelRoadPolicy: "prohibited_paved_only",
    prohibitedRoadCorridorNames: [
      "Dalton Highway, Denali Highway, McCarthy Road, and unapproved gravel backroads (confirm full addendum on contract)",
    ],
    cautionRestrictedRoadCorridorNames: [
      "Construction gravel patches on paved state highways (slow speed required)",
    ],
    canadaCrossBorderPolicy: "Confirm Canada travel authorization at reservation.",
    unresolvedPolicies: [
      "Exact 2027 pickup/return clock windows and model-year tier pricing are not checked in static pilot data.",
    ],
    sources: [
      {
        label: "Clippership Motorhome Rentals — Official Website",
        url: "https://clippershipcamper.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    operatorId: "operator:cruise-america-anchorage",
    slug: "cruise-america-anchorage",
    name: "Cruise America — Anchorage",
    depotPlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    depotAddressLabel: "2230 Cinnabar Loop, Anchorage, AK 99507",
    officialWebsite: "https://www.cruiseamerica.com/rv-rental-locations/alaska/anchorage",
    bookingPlatform: "Direct Website",
    publicationStatus: "published_pilot",
    fleetClassesOffered: ["class_c_motorhome", "truck_camper_4x4"],
    typicalLengthRangeFeet: { min: 19, max: 30 },
    floorplanGuaranteePolicy:
      "Booked by size class (Compact 19 ft, Standard 25 ft, Large 30 ft); confirm availability of optional kitchen/bedding kits.",
    airportShuttlePolicy: "No complimentary airport shuttle typically assumed — plan taxi/rideshare to Cinnabar Loop and verify on confirmation.",
    pickupWindowPolicy: "Afternoon pickup by scheduled appointment (commonly 1:00 PM–4:00 PM; verify exact branch hours).",
    mandatoryOrientationNote: "Branch check-in and vehicle inspection required.",
    returnCutoffPolicy: "Morning return typically 9:00 AM–11:00 AM; late returns incur hourly fees.",
    returnCleaningAndDumpPolicy: "Holding tanks must be dumped and fuel/propane returned at contracted levels unless pre-paid/fee applies.",
    gravelRoadPolicy: "prohibited_paved_only",
    prohibitedRoadCorridorNames: [
      "Dalton Highway, Denali Highway, McCarthy Road, Nabesna Road, and unpaved/non-public roads per Cruise America rental terms",
    ],
    cautionRestrictedRoadCorridorNames: [
      "State highway construction zones",
    ],
    canadaCrossBorderPolicy: "Permitted between U.S. and Canada on authorized routes; verify one-way vs. round-trip fleet availability.",
    unresolvedPolicies: [
      "Per-mile charges, generator hourly charges, and linen/kitchen kit availability vary by 2027 quote.",
    ],
    sources: [
      {
        label: "Cruise America — Anchorage RV Rental Location",
        url: "https://www.cruiseamerica.com/rv-rental-locations/alaska/anchorage",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    operatorId: "operator:abc-motorhome-rentals",
    slug: "abc-motorhome-rentals",
    name: "ABC Motorhome & Car Rentals (Held — Source Timeout)",
    depotPlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    depotAddressLabel: "3875 Old International Airport Rd, Anchorage, AK",
    officialWebsite: "https://www.abcmotorhome.com/",
    bookingPlatform: "Direct Website",
    publicationStatus: "held_source_unreachable",
    fleetClassesOffered: ["class_c_motorhome"],
    typicalLengthRangeFeet: null,
    floorplanGuaranteePolicy: "unknown",
    airportShuttlePolicy: "unknown — direct primary website timed out during 2026-11-19 verification.",
    pickupWindowPolicy: "unknown",
    mandatoryOrientationNote: "unknown",
    returnCutoffPolicy: "unknown",
    returnCleaningAndDumpPolicy: "unknown",
    gravelRoadPolicy: "unknown",
    prohibitedRoadCorridorNames: [],
    cautionRestrictedRoadCorridorNames: [],
    canadaCrossBorderPolicy: "unknown",
    unresolvedPolicies: [
      "Primary website (abcmotorhome.com) timed out during automated HTTP check on 2026-11-19; held from active recommendation cards until direct primary-source retrieval succeeds.",
    ],
    explicitHoldReasons: ["PRIMARY_SOURCE_TIMEOUT_2026_11_19"],
    sources: [
      {
        label: "Travel Alaska — RV Travel Reference",
        url: "https://www.travelalaska.com/explore-alaska/articles/tips-rv-travel-alaska",
        sourceKind: "official_dmo_tourism",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: null,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
] as const;

export const ALASKA_RV_HIGHWAY_CORRIDORS: readonly AlaskaRvHighwayCorridorRecord[] = [
  {
    corridorId: "corridor:seward-hwy-anc-seward",
    name: "Seward Highway: Anchorage → Turnagain Arm → Seward",
    routeDesignations: ["AK-1", "AK-9"],
    originPlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    destinationPlaceId: "dcc:port:us-seward:0001",
    distanceMiles: 127,
    surfaceType: "paved_two_lane_mountain_coastal",
    estimatedPureDrivingHoursRange: "2.5–3.0 hours",
    realisticRvTravelDayHoursRange: "5.5–7.0 hours",
    rvTravelDayStopFactors: [
      "Beluga Point & Bird Point scenic pullouts along Turnagain Arm",
      "Alaska Wildlife Conservation Center (Mile 79, 1.5–2h stop with oversized RV parking)",
      "Girdwood Mile 90 fuel / potable water / dump check before Turnagain Pass",
      "Slow mountain climbs over Turnagain Pass and summer construction pilot cars",
    ],
    fuelAndServiceGapWarning:
      "Top off fuel in Anchorage or Girdwood (Mile 90). Tern Lake Junction (where AK-1 splits to Homer and AK-9 continues to Seward) has NO gas station.",
    standardRentalPermission: "permitted_paved_standard",
    rentalPermissionExplanation:
      "Fully paved National Scenic Byway permitted by all standard Anchorage motorhome rental operators.",
    physicalRoadOpenState: "not_checked_verify_511_live",
    officialPhysicalRoadStatusUrl: "https://511.alaska.gov/",
    physicalHazardsAndSeasonalNotes:
      "Two-lane coastal highway with occasional rockfall, summer paving pilot cars, and zero alternate road detour if closed by a crash — always check Alaska 511.",
    sources: [
      {
        label: "Alaska DOT&PF 511 — Seward Highway Live Conditions",
        url: "https://511.alaska.gov/",
        sourceKind: "federal_or_state_agency",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    corridorId: "corridor:seward-to-homer-via-sterling",
    name: "Seward & Sterling Highways: Seward → Cooper Landing → Soldotna → Homer",
    routeDesignations: ["AK-9", "AK-1"],
    originPlaceId: "dcc:port:us-seward:0001",
    destinationPlaceId: "dcc:place:us-ak-homer-ak:0001",
    distanceMiles: 172,
    surfaceType: "paved_two_lane_mountain_coastal",
    estimatedPureDrivingHoursRange: "3.5–4.0 hours",
    realisticRvTravelDayHoursRange: "6.5–8.0 hours",
    rvTravelDayStopFactors: [
      "Morning dump-station queue in Seward (if leaving a non-sewer municipal waterfront site)",
      "Winding 45-mph Kenai River / Cooper Landing canyon & combat-fishing shoulder congestion",
      "Mid-corridor grocery restock, fuel, and tank dump in Soldotna",
      "Baycrest Hill Kachemak Bay overlook before descending onto the Homer Spit",
    ],
    fuelAndServiceGapWarning:
      "Fuel in Seward before departing, then use Soldotna (major grocery, propane, fuel, and municipal dump hub) before continuing 75 miles south to Homer.",
    standardRentalPermission: "permitted_paved_standard",
    rentalPermissionExplanation:
      "Paved state highway permitted by all standard Anchorage RV rental contracts.",
    physicalRoadOpenState: "not_checked_verify_511_live",
    officialPhysicalRoadStatusUrl: "https://511.alaska.gov/",
    physicalHazardsAndSeasonalNotes:
      "Active multi-year Sterling Highway Cooper Landing bypass/widening construction zones can add 20–45m pilot-car waits; check 511.alaska.gov.",
    sources: [
      {
        label: "Alaska DOT&PF 511 — Sterling Highway Conditions",
        url: "https://511.alaska.gov/",
        sourceKind: "federal_or_state_agency",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    corridorId: "corridor:homer-to-anchorage-return",
    name: "Sterling & Seward Highways: Homer → Soldotna → Turnagain Arm → Anchorage",
    routeDesignations: ["AK-1"],
    originPlaceId: "dcc:place:us-ak-homer-ak:0001",
    destinationPlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    distanceMiles: 225,
    surfaceType: "paved_two_lane_mountain_coastal",
    estimatedPureDrivingHoursRange: "4.5–5.0 hours",
    realisticRvTravelDayHoursRange: "7.0–8.5 hours",
    rvTravelDayStopFactors: [
      "Full-day 225-mile return up two-lane Sterling & Seward Highways",
      "Weekend northbound Anchorage camper return traffic on Sunday afternoons",
      "Soldotna or Girdwood fuel & lunch stop",
      "Evening arrival in Anchorage so morning 8–10 AM RV return cutoff is never jeopardized",
    ],
    fuelAndServiceGapWarning:
      "Refuel in Homer or Soldotna and top off again in South Anchorage near your rental depot prior to morning return.",
    standardRentalPermission: "permitted_paved_standard",
    rentalPermissionExplanation:
      "Paved state highway permitted by all standard Anchorage RV rental contracts.",
    physicalRoadOpenState: "not_checked_verify_511_live",
    officialPhysicalRoadStatusUrl: "https://511.alaska.gov/",
    physicalHazardsAndSeasonalNotes:
      "Do NOT schedule this 225-mile drive on the same morning as a 9:00–10:00 AM rental return or midday ANC flight.",
    sources: [
      {
        label: "Alaska DOT&PF 511",
        url: "https://511.alaska.gov/",
        sourceKind: "federal_or_state_agency",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    corridorId: "corridor:mccarthy-road-contrast-example",
    name: "Contrast Guardrail: McCarthy Road (Chitina → Kennecott, Wrangell-St. Elias)",
    routeDesignations: ["McCarthy Rd"],
    originPlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    destinationPlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    distanceMiles: 60,
    surfaceType: "gravel_unpaved",
    estimatedPureDrivingHoursRange: "2.5–3.5 hours (60 gravel miles)",
    realisticRvTravelDayHoursRange: "5.0–7.0 hours (plus footbridge shuttle)",
    rvTravelDayStopFactors: [
      "Rough gravel railway bed with historic spikes, washboard, and one-lane bridges",
    ],
    fuelAndServiceGapWarning: "Zero RV fuel or tire repair services along the 60-mile gravel road.",
    standardRentalPermission: "prohibited_by_standard_rental_contracts",
    rentalPermissionExplanation:
      "Strictly PROHIBITED by Great Alaskan Holidays, Cruise America, and Clippership — voids damage coverage even when Alaska 511 marks the road physically open in summer.",
    physicalRoadOpenState: "not_checked_verify_511_live",
    officialPhysicalRoadStatusUrl: "https://511.alaska.gov/",
    physicalHazardsAndSeasonalNotes:
      "Included in contract to prove Separation #2: physical summer road opening on 511.alaska.gov does NOT grant rental contract permission.",
    sources: [
      {
        label: "Travel Alaska — RV Road Restrictions",
        url: "https://www.travelalaska.com/explore-alaska/articles/tips-rv-travel-alaska",
        sourceKind: "official_dmo_tourism",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
      {
        label: "Great Alaskan Holidays — Prohibited Roads Policy",
        url: "https://www.greatalaskanholidays.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
] as const;

export const ALASKA_RV_CAMPGROUNDS: readonly AlaskaRvCampgroundRecord[] = [
  {
    campgroundId: "campground:golden-nugget-rv-park-anc",
    slug: "golden-nugget-rv-park-anchorage",
    name: "Golden Nugget RV Park",
    placeId: "dcc:place:us-ak-anchorage-ak:0001",
    operatorType: "private_rv_park",
    addressOrMilepostLabel: "4100 DeBarr Rd, Anchorage, AK",
    officialBookingOrInfoUrl: "https://goldennuggetrvpark.com/",
    campgroundOperatingSeasonLabel: "Seasonal summer full-service operation (verify exact opening/closing dates)",
    reservationModel: "advance_online_recommended",
    reservationOpeningWindowNote: "Direct reservations via operator website or phone; book ahead for June–August.",
    liveSiteInventoryState: "not_checked",
    campgroundWideAmenities: {
      hasCentralDumpStation: true,
      centralDumpFeeNote: "Full sewer hookup at every site",
      hasPotableWaterFill: true,
      hasRestrooms: true,
      hasHotShowers: "coin_or_fee",
      hasLaundry: true,
      hasWifi: true,
      parkWideMaxRigLengthFeet: 45,
      bearFoodStorageRule: null,
    },
    siteTiers: [
      {
        siteTierId: "gn-pull-through-50a-fhu",
        label: "Pull-Through Full Hookup (30/50A + Water + Sewer)",
        padStyle: "pull_through",
        electricAmpOptions: [30, 50],
        waterAtSite: true,
        sewerAtSite: true,
        maxMotorhomeLengthFeet: 45,
        maxTrailerLengthFeet: 45,
        reservableOnline: true,
        siteSpecificRulesNote: "Limited count (~34 pull-throughs / ~25 50A sites across 215 total spaces) — Ideal Night 1 shakedown site to test RV water, shore power, and sewer.",
      },
      {
        siteTierId: "gn-back-in-30a-fhu",
        label: "Standard Back-In Full Hookup (30A + Water + Sewer)",
        padStyle: "back_in",
        electricAmpOptions: [30],
        waterAtSite: true,
        sewerAtSite: true,
        maxMotorhomeLengthFeet: 36,
        maxTrailerLengthFeet: 34,
        reservableOnline: true,
        siteSpecificRulesNote: "30A only (no 50A service on standard back-ins).",
      },
    ],
    rateGuidanceLabel: "Check operator site for current 2027 nightly tariff",
    rateFreshnessState: "seasonal_pattern_2027_unverified",
    rvAccessAndTowingNote: "Easy East Anchorage access off Glenn Hwy / Boniface Pkwy.",
    unresolvedCampgroundFacts: [
      "Exact 2027 nightly rates and real-time pull-through availability are not checked.",
    ],
    sources: [
      {
        label: "Golden Nugget RV Park — Official Website",
        url: "https://goldennuggetrvpark.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    campgroundId: "campground:centennial-camper-park-anc",
    slug: "centennial-camper-park-anchorage",
    name: "Centennial Camper Park (Municipality of Anchorage)",
    placeId: "dcc:place:us-ak-anchorage-ak:0001",
    operatorType: "municipal",
    addressOrMilepostLabel: "8400 Starview Dr (near Glenn Hwy / Muldoon), Anchorage, AK",
    officialBookingOrInfoUrl: "https://www.muni.org/Departments/parks/Pages/default.aspx",
    campgroundOperatingSeasonLabel: "Mid-May through mid-September (municipal seasonal operation)",
    reservationModel: "advance_online_required",
    reservationOpeningWindowNote: "Advance municipal reservation required (no drive-up first-come camping); 14-day cumulative seasonal cap.",
    liveSiteInventoryState: "not_checked",
    campgroundWideAmenities: {
      hasCentralDumpStation: true,
      centralDumpFeeNote: "Central dump station & potable water spigots on-site (NO water or sewer at individual pads)",
      hasPotableWaterFill: true,
      hasRestrooms: true,
      hasHotShowers: true,
      hasLaundry: false,
      hasWifi: true,
      parkWideMaxRigLengthFeet: 42,
      bearFoodStorageRule: "Strict municipal bear-attractant storage rules enforced near JBER/Chugach foothills.",
    },
    siteTiers: [
      {
        siteTierId: "centennial-pull-through-electric",
        label: "Pull-Through Electric-Only Site (20/30/50A · No Water/Sewer at Pad)",
        padStyle: "pull_through",
        electricAmpOptions: [20, 30, 50],
        waterAtSite: false,
        sewerAtSite: false,
        maxMotorhomeLengthFeet: 42,
        maxTrailerLengthFeet: 40,
        reservableOnline: true,
        siteSpecificRulesNote: "Fill fresh water tank at central spigot before pulling into pad.",
      },
      {
        siteTierId: "centennial-standard-dry",
        label: "Standard Wooded Dry RV Pad (No Hookups)",
        padStyle: "back_in",
        electricAmpOptions: [],
        waterAtSite: false,
        sewerAtSite: false,
        maxMotorhomeLengthFeet: 30,
        maxTrailerLengthFeet: 26,
        reservableOnline: true,
        siteSpecificRulesNote: "Tighter wooded turns; verify exact pad length when booking.",
      },
    ],
    rateGuidanceLabel: "Verify 2027 municipal campground fee schedule on Muni Parks portal",
    rateFreshnessState: "current_posted_guidance_2027_unverified",
    rvAccessAndTowingNote: "Wooded municipal alternative to private commercial RV parks.",
    unresolvedCampgroundFacts: [
      "Direct Centennial subpage path on muni.org returned 404 on 2026-11-19; linked to verified Municipality Parks & Recreation root — confirm 2027 ActiveNet reservation link before booking.",
    ],
    sources: [
      {
        label: "Municipality of Anchorage Parks & Recreation",
        url: "https://www.muni.org/Departments/parks/Pages/default.aspx",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    campgroundId: "campground:seward-waterfront-park",
    slug: "seward-municipal-waterfront-campground",
    name: "City of Seward Waterfront Park & Municipal Campgrounds",
    placeId: "dcc:port:us-seward:0001",
    operatorType: "municipal",
    addressOrMilepostLabel: "Ballaine Blvd along Resurrection Bay, Seward, AK",
    officialBookingOrInfoUrl: "https://www.campspot.com/book/seward-municipal-campgrounds",
    campgroundOperatingSeasonLabel: "Peak summer municipal operation (May–September)",
    reservationModel: "mixed_online_and_fcfs_loops",
    reservationOpeningWindowNote:
      "Reservable loops book online via Campspot (typically opening mid-January and selling out fast for July 4th & Silver Salmon Derby); Boulder, Forest Acres, and Spring Creek loops remain first-come kiosk only.",
    liveSiteInventoryState: "not_checked",
    campgroundWideAmenities: {
      hasCentralDumpStation: true,
      centralDumpFeeNote: "NO sewer hookups at any site — use paid municipal dump station at Ballaine Blvd & B St (opposite Marathon)",
      hasPotableWaterFill: true,
      hasRestrooms: true,
      hasHotShowers: "coin_or_fee",
      hasLaundry: false,
      hasWifi: "unknown",
      parkWideMaxRigLengthFeet: 45,
      bearFoodStorageRule: null,
    },
    siteTiers: [
      {
        siteTierId: "seward-waterfront-30a-water",
        label: "Waterfront Partial Hookup (30A Electric + Water · No Sewer)",
        padStyle: "back_in",
        electricAmpOptions: [30],
        waterAtSite: true,
        sewerAtSite: false,
        maxMotorhomeLengthFeet: 35,
        maxTrailerLengthFeet: 32,
        reservableOnline: true,
        siteSpecificRulesNote: "Check exact site length on Campspot listing (some oversized pads allow 40+ ft, many cap at 30–35 ft; falsifying rig type/length risks cancellation).",
      },
      {
        siteTierId: "seward-waterfront-dry",
        label: "Resurrection Bay Dry RV Site (No Hookups)",
        padStyle: "mixed_pads",
        electricAmpOptions: [],
        waterAtSite: false,
        sewerAtSite: false,
        maxMotorhomeLengthFeet: 40,
        maxTrailerLengthFeet: 35,
        reservableOnline: true,
        siteSpecificRulesNote: "Campervans and pop-ups are strictly prohibited in tent-only zones; towed vehicles may need side-street parking.",
      },
    ],
    rateGuidanceLabel: "Check Campspot for 2027 municipal nightly rates by site tier",
    rateFreshnessState: "current_posted_guidance_2027_unverified",
    rvAccessAndTowingNote:
      "Walkable/bikeable waterfront path to downtown & Small Boat Harbor; designated Major Marine Tours complimentary shuttle stop (reserve shuttle 24h prior).",
    unresolvedCampgroundFacts: [
      "Exact 2027 Campspot release date in January and per-pad foot limits must be verified on individual Campspot site listings.",
    ],
    sources: [
      {
        label: "Seward Municipal Campgrounds — Official Campspot Booking Portal",
        url: "https://www.campspot.com/book/seward-municipal-campgrounds",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    campgroundId: "campground:russian-river-campground",
    slug: "russian-river-campground-cooper-landing",
    name: "Russian River Campground (Chugach National Forest)",
    placeId: "dcc:place:us-ak-cooper-landing-ak:0001",
    operatorType: "federal_usfs_or_nps",
    addressOrMilepostLabel: "Mile 52.8 Sterling Hwy, Cooper Landing, AK",
    officialBookingOrInfoUrl: "https://www.recreation.gov/camping/campgrounds/232213",
    campgroundOperatingSeasonLabel: "Late May through early September (USFS seasonal)",
    reservationModel: "advance_online_recommended",
    reservationOpeningWindowNote: "6-month rolling window on Recreation.gov (Facility 232213).",
    liveSiteInventoryState: "not_checked",
    campgroundWideAmenities: {
      hasCentralDumpStation: true,
      centralDumpFeeNote: "Registered-camper dump station & loop water spigots; ZERO hookups at sites",
      hasPotableWaterFill: true,
      hasRestrooms: true,
      hasHotShowers: false,
      hasLaundry: false,
      hasWifi: false,
      parkWideMaxRigLengthFeet: 45,
      bearFoodStorageRule:
        "High brown/black bear activity during salmon runs: all food/attractants MUST be stored inside a hard-sided vehicle; temporary soft-sided restrictions may apply.",
    },
    siteTiers: [
      {
        siteTierId: "russian-river-dry-pad",
        label: "USFS Wooded Dry Pad (Zero Hookups · Verify Exact Pad Length)",
        padStyle: "back_in",
        electricAmpOptions: [],
        waterAtSite: false,
        sewerAtSite: false,
        maxMotorhomeLengthFeet: null,
        maxTrailerLengthFeet: null,
        reservableOnline: true,
        siteSpecificRulesNote:
          "Pad lengths and driveway grades vary sharply by loop/site on Recreation.gov (many fit 30–45 ft; select pads longer, some shorter) — never assume uniform length.",
      },
    ],
    rateGuidanceLabel: "Check Recreation.gov (Facility 232213) for 2027 federal nightly & day-use fees",
    rateFreshnessState: "current_posted_guidance_2027_unverified",
    rvAccessAndTowingNote: "Steep paved access road descending from Sterling Hwy; ideal for 10-day slower angler itinerary.",
    unresolvedCampgroundFacts: [
      "Per-pad length limits are site-specific on Recreation.gov (intentionally kept null in tier summary so planner requires site-specific confirmation).",
    ],
    sources: [
      {
        label: "Recreation.gov — Russian River Campground (Facility 232213)",
        url: "https://www.recreation.gov/camping/campgrounds/232213",
        sourceKind: "nps_or_usfs_federal",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    campgroundId: "campground:heritage-rv-park-homer",
    slug: "heritage-rv-park-homer-spit",
    name: "Heritage RV Park",
    placeId: "dcc:place:us-ak-homer-ak:0001",
    operatorType: "private_rv_park",
    SeparateFromCampgroundIds: ["campground:homer-spit-campground"],
    addressOrMilepostLabel: "3550 Homer Spit Rd (adjacent to Nick Dudiak Fishing Lagoon), Homer, AK",
    officialBookingOrInfoUrl: "https://alaskanheritagervpark.com/",
    campgroundOperatingSeasonLabel: "May through September seasonal operation",
    reservationModel: "advance_online_recommended",
    reservationOpeningWindowNote: "Direct online/phone reservations; beachfront sites book months ahead.",
    liveSiteInventoryState: "not_checked",
    campgroundWideAmenities: {
      hasCentralDumpStation: true,
      centralDumpFeeNote: "All 107 sites include direct sewer hookups at the pad",
      hasPotableWaterFill: true,
      hasRestrooms: true,
      hasHotShowers: true,
      hasLaundry: true,
      hasWifi: true,
      parkWideMaxRigLengthFeet: 70,
      bearFoodStorageRule: null,
    },
    siteTiers: [
      {
        siteTierId: "heritage-fhu-50a-big-rig",
        label: "Full Hookup Big-Rig Site (20/30/50A + City Water + Sewer)",
        padStyle: "pull_through",
        electricAmpOptions: [20, 30, 50],
        waterAtSite: true,
        sewerAtSite: true,
        maxMotorhomeLengthFeet: 70,
        maxTrailerLengthFeet: 70,
        reservableOnline: true,
        siteSpecificRulesNote: "Accommodates large Class A/C motorhomes with towed vehicles up to 70 ft.",
      },
    ],
    rateGuidanceLabel: "Check alaskanheritagervpark.com for 2027 waterfront vs. interior full-hookup rates",
    rateFreshnessState: "seasonal_pattern_2027_unverified",
    rvAccessAndTowingNote: "Separate private park from Homer Spit Campground and City of Homer Fishing Hole Campground.",
    unresolvedCampgroundFacts: [
      "2027 seasonal rate table and exact beachfront vs. lagoon-row availability are not checked.",
    ],
    sources: [
      {
        label: "Heritage RV Park — Official Homer Spit Website",
        url: "https://alaskanheritagervpark.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    campgroundId: "campground:homer-spit-campground",
    slug: "homer-spit-campground",
    name: "Homer Spit Campground",
    placeId: "dcc:place:us-ak-homer-ak:0001",
    operatorType: "private_rv_park",
    SeparateFromCampgroundIds: ["campground:heritage-rv-park-homer"],
    addressOrMilepostLabel: "Southern tip of Homer Spit (near Small Boat Harbor), Homer, AK",
    officialBookingOrInfoUrl: "https://www.homerspitcampground.com/",
    campgroundOperatingSeasonLabel: "May through September seasonal operation",
    reservationModel: "advance_online_recommended",
    reservationOpeningWindowNote:
      "Privately operated (distinct from City of Homer's first-come Fishing Hole & Mariner Park campgrounds).",
    liveSiteInventoryState: "not_checked",
    campgroundWideAmenities: {
      hasCentralDumpStation: true,
      centralDumpFeeNote: "On-site water fill & dump station for registered guests",
      hasPotableWaterFill: true,
      hasRestrooms: true,
      hasHotShowers: "coin_or_fee",
      hasLaundry: true,
      hasWifi: true,
      parkWideMaxRigLengthFeet: 40,
      bearFoodStorageRule: null,
    },
    siteTiers: [
      {
        siteTierId: "hsc-fhu-pull-through-40",
        label: "Full Hookup Pull-Through (Electric + Water + Sewer · Max 40 ft MH)",
        padStyle: "pull_through",
        electricAmpOptions: [30, 50],
        waterAtSite: true,
        sewerAtSite: true,
        maxMotorhomeLengthFeet: 40,
        maxTrailerLengthFeet: 34,
        reservableOnline: true,
        siteSpecificRulesNote: "Motorhomes up to 40 ft; trailers up to 34 ft.",
      },
      {
        siteTierId: "hsc-electric-only-36",
        label: "Beach View / Interior Electric-Only Row (No Water/Sewer at Pad)",
        padStyle: "back_in",
        electricAmpOptions: [30],
        waterAtSite: false,
        sewerAtSite: false,
        maxMotorhomeLengthFeet: 36,
        maxTrailerLengthFeet: 30,
        reservableOnline: true,
        siteSpecificRulesNote: "Electric only; use on-site guest water fill and dump station.",
      },
      {
        siteTierId: "hsc-dry-beach-30",
        label: "Beachfront Dry RV Site (Zero Hookups · Max 30 ft MH / 20 ft Trailer)",
        padStyle: "open_gravel_lot",
        electricAmpOptions: [],
        waterAtSite: false,
        sewerAtSite: false,
        maxMotorhomeLengthFeet: 30,
        maxTrailerLengthFeet: 20,
        reservableOnline: true,
        siteSpecificRulesNote:
          "Proves Separation #4: even though the park has 40 ft full-hookup pull-throughs, selecting a Dry Beach site caps motorhomes at 30 ft (trailers 20 ft) with zero hookups.",
      },
    ],
    rateGuidanceLabel: "Check homerspitcampground.com for 2027 row-specific nightly rates",
    rateFreshnessState: "seasonal_pattern_2027_unverified",
    rvAccessAndTowingNote: "Short walk to Homer Small Boat Harbor boardwalk & Mako's Water Taxi check-in.",
    unresolvedCampgroundFacts: [
      "Exact 2027 nightly rates and row-specific electrical amperage (30A vs 50A) should be verified on booking.",
    ],
    sources: [
      {
        label: "Homer Spit Campground — Official Website",
        url: "https://www.homerspitcampground.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
] as const;

export const ALASKA_RV_SERVICE_STOPS: readonly AlaskaRvPracticalServiceStopRecord[] = [
  {
    serviceStopId: "service:anchorage-south-provisioning-hub",
    name: "South Anchorage RV Provisioning, Fuel, Propane & Return Dump Corridor",
    placeId: "dcc:place:us-ak-anchorage-ak:0001",
    highwayLocationLabel: "Old Seward Hwy / Dimond Blvd / Abbott Rd, Anchorage",
    capabilities: [
      "grocery_provisioning",
      "fuel_gas_diesel",
      "propane_fill",
      "potable_water",
      "sanitation_dump",
    ],
    officialOrAuthorityUrl: "https://www.greatalaskanholidays.com/",
    bigRigManeuveringNote:
      "Major supermarkets and truck-friendly fuel islands near rental depots; Great Alaskan Holidays renters get free on-site return dump & water.",
    seasonalOperationAndHoseWarning:
      "Water spigots typically active mid-May through mid-September; keep dedicated drinking-water hose separate from black-tank rinse hose.",
    feeGuidanceNote: "Included at GAH depot for GAH renters; commercial dump fees vary elsewhere (~$10–$20).",
    unresolvedServiceFacts: [
      "Non-GAH renters (e.g., Cruise America) must confirm exact nearby commercial propane & dump hours on return morning.",
    ],
    sources: [
      {
        label: "Great Alaskan Holidays — Return & Facility Services",
        url: "https://www.greatalaskanholidays.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    serviceStopId: "service:girdwood-mile90-fuel-water-dump",
    name: "Girdwood Junction Service Stop (Mile 90 Seward Hwy)",
    placeId: "dcc:place:us-ak-girdwood-ak:0001",
    highwayLocationLabel: "Mile 90 Seward Hwy (Alyeska Hwy Junction), Girdwood",
    capabilities: ["fuel_gas_diesel", "potable_water", "sanitation_dump"],
    officialOrAuthorityUrl: "https://511.alaska.gov/",
    bigRigManeuveringNote:
      "Busy summer fuel plaza at Turnagain Arm's east end — pull wide around fuel islands during peak midday RV traffic.",
    seasonalOperationAndHoseWarning:
      "Last reliable fuel before Turnagain Pass (Tern Lake Junction 53 mi ahead has NO gas). Dump/rinse hoses can be intermittently out of service — carry your own non-potable rinse hose.",
    feeGuidanceNote: "Nominal seasonal dump fee reported (~$5–$10; confirm on-site).",
    unresolvedServiceFacts: [
      "Seasonal spigot/dump activation dates depend on spring freeze/thaw.",
    ],
    sources: [
      {
        label: "Travel Alaska — RV Fuel & Highway Planning",
        url: "https://www.travelalaska.com/explore-alaska/articles/tips-rv-travel-alaska",
        sourceKind: "official_dmo_tourism",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    serviceStopId: "service:seward-municipal-dump-water",
    name: "City of Seward Municipal RV Dump & Potable Water Station",
    placeId: "dcc:port:us-seward:0001",
    highwayLocationLabel: "Ballaine Blvd & B St (opposite Marathon Campground, near Small Boat Harbor), Seward",
    capabilities: ["sanitation_dump", "potable_water"],
    officialOrAuthorityUrl: "https://www.campspot.com/book/seward-municipal-campgrounds",
    bigRigManeuveringNote:
      "Expect morning queues between 8:30 AM and 11:00 AM on checkout days because Seward municipal campsites do not have individual sewer hookups.",
    seasonalOperationAndHoseWarning: "24/7 summer seasonal operation; winterized off-season.",
    feeGuidanceNote: "Paid municipal fee required (pay station on-site; verify current rate).",
    unresolvedServiceFacts: [
      "Exact 2027 municipal dump fee amount not verified in static pilot data.",
    ],
    sources: [
      {
        label: "Seward Municipal Campgrounds (Campspot Info)",
        url: "https://www.campspot.com/book/seward-municipal-campgrounds",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    serviceStopId: "service:soldotna-mid-peninsula-supply-dump",
    name: "Soldotna Mid-Peninsula Grocery, Fuel, Propane & Municipal Dump Hub",
    placeId: "dcc:place:us-ak-soldotna-ak:0001",
    highwayLocationLabel: "Sterling Hwy & Kenai Spur Hwy (Swiftwater Park / Sterling Hwy stations), Soldotna",
    capabilities: [
      "grocery_provisioning",
      "fuel_gas_diesel",
      "propane_fill",
      "potable_water",
      "sanitation_dump",
    ],
    officialOrAuthorityUrl: "https://511.alaska.gov/",
    bigRigManeuveringNote:
      "Primary mid-peninsula supermarket restock point between Seward and Homer; spacious commercial parking.",
    seasonalOperationAndHoseWarning:
      "Important truthfulness note: older RV blogs still list the Soldotna Fred Meyer dump station, which travelers report permanently closed — rely on municipal Swiftwater Park or active Sterling Hwy service stations and confirm seasonal status on arrival.",
    feeGuidanceNote: "Nominal municipal/station dump fee (~$8–$10 typical).",
    unresolvedServiceFacts: [
      "Confirm active 2027 summer hours at Swiftwater Park / Big John's Sterling Hwy station locally.",
    ],
    sources: [
      {
        label: "Travel Alaska — RV Travel Resources",
        url: "https://www.travelalaska.com/explore-alaska/articles/tips-rv-travel-alaska",
        sourceKind: "official_dmo_tourism",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    serviceStopId: "service:homer-spit-city-dump-water",
    name: "City of Homer Spit Sanitation Dump & Water Station",
    placeId: "dcc:place:us-ak-homer-ak:0001",
    highwayLocationLabel: "Homer Spit Rd near Fishing Hole Campground, Homer",
    capabilities: ["sanitation_dump", "potable_water"],
    officialOrAuthorityUrl: "https://www.homerspitcampground.com/",
    bigRigManeuveringNote:
      "Essential if dry-camping on Homer Spit beaches or City Fishing Hole / Mariner Park campgrounds; full-hookup guests at Heritage RV Park or Homer Spit Campground FHU rows dump at their pad.",
    seasonalOperationAndHoseWarning: "Summer seasonal operation (May–September).",
    feeGuidanceNote: "Paid city fee (~$15 typical; registered Homer Spit Campground guests have separate guest station).",
    unresolvedServiceFacts: [
      "Exact 2027 City of Homer sanitation fee requires harbor/campground sign confirmation.",
    ],
    sources: [
      {
        label: "Homer Spit Campground — Guest & Spit Facilities",
        url: "https://www.homerspitcampground.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
] as const;

export const ALASKA_RV_ACTIVITIES: readonly AlaskaRvActivityExperienceRecord[] = [
  {
    activityId: "activity:alaska-wildlife-conservation-center",
    slug: "alaska-wildlife-conservation-center",
    title: "Alaska Wildlife Conservation Center (Mile 79 Turnagain Arm)",
    operatorName: "Alaska Wildlife Conservation Center",
    placeId: "dcc:place:us-ak-girdwood-ak:0001",
    category: "wildlife_conservation_drive",
    officialUrl: "https://alaskawildlife.org/",
    typicalDurationMinutes: 105,
    checkInLeadMinutes: 0,
    rvParkingAndShuttlePolicy: {
      oversizedParkingAtVenue: "ample_pull_through",
      overnightRvParkingPermitted: false,
      shuttleAvailableFromCampgrounds: false,
      shuttleAdvanceReservationRule: null,
      practicalRvInstruction:
        "200-acre sanctuary right off Mile 79 Seward Hwy with dedicated oversized RV parking and a 1.5-mile loop — ideal mid-drive stop between Anchorage and Seward.",
    },
    priceGuidanceLabel: "Check alaskawildlife.org for current general admission rates",
    scheduleFreshnessState: "current_posted_guidance_2027_unverified",
    liveInventoryState: "not_checked",
    unresolvedActivityFacts: ["2027 summer hours and specialty walk-tour slots unverified."],
    sources: [
      {
        label: "Alaska Wildlife Conservation Center — Official Site",
        url: "https://alaskawildlife.org/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    activityId: "activity:major-marine-kenai-fjords-cruise",
    slug: "major-marine-kenai-fjords-cruise",
    title: "6-Hour or 7.5-Hour Kenai Fjords National Park Glacier & Wildlife Cruise",
    operatorName: "Major Marine Tours",
    placeId: "dcc:port:us-seward:0001",
    category: "marine_wildlife_glacier_cruise",
    officialUrl: "https://majormarine.com/",
    typicalDurationMinutes: 360,
    checkInLeadMinutes: 60,
    rvParkingAndShuttlePolicy: {
      oversizedParkingAtVenue: "limited_use_shuttle_or_walk",
      overnightRvParkingPermitted: false,
      shuttleAvailableFromCampgrounds: true,
      shuttleAdvanceReservationRule:
        "Call Major Marine Tours at least 24 hours in advance to reserve the complimentary Seward campground/RV park shuttle (generally unavailable for 8:00 AM departures).",
      practicalRvInstruction:
        "Leave your RV hooked up at Seward Waterfront Park or your local RV park and ride the reserved shuttle or walk the waterfront path — harbor pay lots are sized for standard passenger cars.",
    },
    priceGuidanceLabel: "Check majormarine.com for 2027 departure times and fares",
    scheduleFreshnessState: "seasonal_pattern_2027_unverified",
    liveInventoryState: "not_checked",
    unresolvedActivityFacts: [
      "Exact 2027 departure availability and participating RV park shuttle stop times require operator confirmation >=24h prior.",
    ],
    sources: [
      {
        label: "Major Marine Tours — Official Seward Cruises & Shuttle Info",
        url: "https://majormarine.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    activityId: "activity:exit-glacier-nature-center",
    slug: "exit-glacier-kenai-fjords-national-park",
    title: "Exit Glacier Overlook Trails & Nature Center (Kenai Fjords National Park)",
    operatorName: "National Park Service — Kenai Fjords National Park",
    placeId: "dcc:port:us-seward:0001",
    category: "national_park_glacier_walk",
    officialUrl: "https://www.nps.gov/kefj/planyourvisit/exit-glacier-area.htm",
    typicalDurationMinutes: 150,
    checkInLeadMinutes: 0,
    rvParkingAndShuttlePolicy: {
      oversizedParkingAtVenue: "tight_day_use_arrive_early",
      overnightRvParkingPermitted: false,
      shuttleAvailableFromCampgrounds: false,
      shuttleAdvanceReservationRule: null,
      practicalRvInstruction:
        "ZERO RV camping or overnight sleeping allowed in Kenai Fjords NP (walk-in tent sites only). Arrive before 9:00 AM or after 4:00 PM if driving a 28–32 ft motorhome, or unhook a toad/use a local Seward shuttle if driving a long Class A/trailer.",
    },
    priceGuidanceLabel: "Fee-free entrance area (verify current NPS day-use parking policies on nps.gov)",
    scheduleFreshnessState: "current_posted_guidance_2027_unverified",
    liveInventoryState: "not_checked",
    unresolvedActivityFacts: [
      "Seasonal spring opening of Herman Leirer Road depends on snowmelt (check NPS & Alaska 511 in May).",
    ],
    sources: [
      {
        label: "NPS — Exit Glacier Area Plan Your Visit",
        url: "https://www.nps.gov/kefj/planyourvisit/exit-glacier-area.htm",
        sourceKind: "nps_or_usfs_federal",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    activityId: "activity:alaska-sealife-center",
    slug: "alaska-sealife-center-seward",
    title: "Alaska SeaLife Center Marine Research & Wildlife Response Visit",
    operatorName: "Alaska SeaLife Center",
    placeId: "dcc:port:us-seward:0001",
    category: "marine_science_center",
    officialUrl: "https://www.alaskasealife.org/",
    typicalDurationMinutes: 120,
    checkInLeadMinutes: 15,
    rvParkingAndShuttlePolicy: {
      oversizedParkingAtVenue: "limited_use_shuttle_or_walk",
      overnightRvParkingPermitted: false,
      shuttleAvailableFromCampgrounds: false,
      shuttleAdvanceReservationRule: "Use Seward's free local summer shuttle or waterfront bike/walking trail from Waterfront Park.",
      practicalRvInstruction:
        "Downtown 301 Railway Ave streets are tight for 30-ft motorhomes — keep your rig at Seward Waterfront Park (~0.8–1.2 mi along the bay path) and walk or ride the local Seward shuttle.",
    },
    priceGuidanceLabel: "Check alaskasealife.org for timed admission & behind-the-scenes encounters",
    scheduleFreshnessState: "current_posted_guidance_2027_unverified",
    liveInventoryState: "not_checked",
    unresolvedActivityFacts: ["2027 summer hours and specialty encounter inventory not checked."],
    sources: [
      {
        label: "Alaska SeaLife Center — Official Website",
        url: "https://www.alaskasealife.org/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
  {
    activityId: "activity:makos-water-taxi-kachemak-bay",
    slug: "makos-water-taxi-grewingk-glacier-homer",
    title: "Kachemak Bay State Park Water Taxi — Grewingk Glacier Trail / Halibut Cove",
    operatorName: "Mako's Water Taxi",
    placeId: "dcc:place:us-ak-homer-ak:0001",
    category: "water_taxi_state_park",
    officialUrl: "https://makoswatertaxi.com/",
    typicalDurationMinutes: 360,
    checkInLeadMinutes: 45,
    rvParkingAndShuttlePolicy: {
      oversizedParkingAtVenue: "coordinate_harbor_lot",
      overnightRvParkingPermitted: false,
      shuttleAvailableFromCampgrounds: false,
      shuttleAdvanceReservationRule: null,
      practicalRvInstruction:
        "If camped at Homer Spit Campground or Heritage RV Park, walk or take a short local cab to the Small Boat Harbor office; if driving onto the Spit for the day, ask the office where oversized RV day parking is designated rather than pulling onto tight harbor ramp aprons.",
    },
    priceGuidanceLabel: "Check makoswatertaxi.com for round-trip Glacier Spit / Saddle Trail drop-off fares",
    scheduleFreshnessState: "seasonal_pattern_2027_unverified",
    liveInventoryState: "not_checked",
    unresolvedActivityFacts: ["Tide-dependent beach landing schedules vary daily — confirm exact boat times directly."],
    sources: [
      {
        label: "Mako's Water Taxi — Official Homer Spit Website",
        url: "https://makoswatertaxi.com/",
        sourceKind: "official_operator",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
] as const;

export const ALASKA_RV_FERRY_RULES: readonly AlaskaRvFerryCorridorRuleRecord[] = [
  {
    ferryRuleId: "ferry:amhs-southcentral-whittier-homer",
    operatorName: "Alaska Marine Highway System (AMHS)",
    officialBookingUrl: "https://dot.alaska.gov/amhs/index.shtml",
    corridorLabel: "AMHS Southcentral / Southwest / Cross-Gulf Vehicle Carriage (Whittier, Homer, Kodiak, Bellingham)",
    departureTerminalLabel: "Whittier or Homer AMHS Terminal (or Bellingham WA for Inside Passage entry)",
    arrivalTerminalLabel: "Chenega / Tatitlek / Cordova / Kodiak / Juneau (route-dependent)",
    vehicleCheckInCutoffMinutesPrior: 180,
    maxStandardWidthInches: 101,
    maxStandardHeightFeet: 13,
    propaneShutoffAndTagRequired: true,
    carDeckLockedWhileUnderway: true,
    tidalRampOverhangWarning:
      "Extreme Alaska tidal swings (up to 30–40 ft) create steep transfer-ramp angles at low tide — long rear motorhome overhangs and low-hanging plumbing can scrape.",
    publishedScheduleCoverageNote:
      "AMHS publishes summer schedules in seasonal releases; verify that your exact 2027 sailing date is open in OARS AND that both Rental Company ferry permission (if renting) and Reserved Vehicle Deck Footage are confirmed.",
    scheduleFreshnessState: "outside_published_coverage",
    liveSailingSpaceState: "not_checked",
    sources: [
      {
        label: "Alaska Marine Highway System (AMHS) Official Portal",
        url: "https://dot.alaska.gov/amhs/index.shtml",
        sourceKind: "federal_or_state_agency",
        checkedAt: ALASKA_RV_PILOT_OBSERVED_AT,
      },
    ],
    verifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    lastModifiedAt: ALASKA_RV_PILOT_OBSERVED_AT,
  },
] as const;

/**
 * Research-backed 9-Day / 8-Night Kenai Peninsula RV Example Itinerary:
 *   - Night 1: Anchorage (afternoon pickup, 45m orientation, grocery provisioning)
 *   - Nights 2–4: Seward (3 nights / 2 full days for Kenai Fjords cruise + Exit Glacier)
 *   - Nights 5–7: Homer (3 nights / 2 full days for Kachemak Bay water taxi + Spit/weather buffer)
 *   - Night 8: Anchorage return staging (so the 225-mile Homer->Anchorage drive never collides with an 8–10 AM return cutoff)
 *   - Day 9: Morning dump, fuel/propane top-off, depot return & ANC departure
 */
export const ALASKA_RV_RECOMMENDED_9D_EXAMPLE_DAYS: readonly AlaskaRvPilotDayTemplate[] = [
  {
    dayNumber: 1,
    dayRole: "arrival_pickup",
    title: "Fly to Anchorage (ANC), Afternoon RV Pickup, Orientation & Provisioning",
    basePlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    suggestedOvernightPlaceLabel: "Anchorage (Shakedown Night Near Rental Depot)",
    defaultConfirmationState: "tentative",
    corridorId: null,
    candidateCampgroundIds: [
      "campground:golden-nugget-rv-park-anc",
      "campground:centennial-camper-park-anc",
    ],
    defaultCampgroundId: "campground:golden-nugget-rv-park-anc",
    defaultSiteTierId: "gn-pull-through-50a-fhu",
    recommendedServiceStopIds: ["service:anchorage-south-provisioning-hub"],
    candidateActivityIds: [],
    realisticDayNarrative:
      "Land at ANC, take the courtesy shuttle or taxi to your Anchorage rental depot, complete the ~45-minute chassis/coach walkthrough, spend 2 hours provisioning groceries & bear spray, and test all hookups in Anchorage before driving mountain highways.",
    operationalChecklist: [
      "Confirm flight lands early enough for afternoon pickup slot (Great Alaskan Holidays orientations end at 5:15 PM).",
      "Bring a physical major credit card (not debit) for the rental security deposit hold.",
      "Measure/record exact bumper-to-bumper length, height, and width from the unit sticker before departing.",
    ],
  },
  {
    dayNumber: 2,
    dayRole: "drive_leg",
    title: "Anchorage → Turnagain Arm → Seward (127 mi Scenic Byway)",
    basePlaceId: "dcc:port:us-seward:0001",
    suggestedOvernightPlaceLabel: "Seward (Night 1 of 3)",
    defaultConfirmationState: "tentative",
    corridorId: "corridor:seward-hwy-anc-seward",
    candidateCampgroundIds: ["campground:seward-waterfront-park"],
    defaultCampgroundId: "campground:seward-waterfront-park",
    defaultSiteTierId: "seward-waterfront-30a-water",
    recommendedServiceStopIds: ["service:girdwood-mile90-fuel-water-dump"],
    candidateActivityIds: ["activity:alaska-wildlife-conservation-center"],
    realisticDayNarrative:
      "Pure highway driving is ~2.5–3h, but plan a realistic 5.5–7h RV travel day with Turnagain Arm beluga/sheep pullouts, Alaska Wildlife Conservation Center (Mile 79 oversized parking), a Girdwood Mile 90 fuel check, and afternoon setup on Resurrection Bay.",
    operationalChecklist: [
      "Check 511.alaska.gov before leaving Anchorage (Seward Hwy has no parallel road detour).",
      "Top off fuel at Girdwood Mile 90 — Tern Lake Junction has no gas station.",
      "Call Major Marine Tours >=24h ahead to lock in tomorrow's complimentary RV park shuttle.",
    ],
  },
  {
    dayNumber: 3,
    dayRole: "basecamp_stay",
    title: "Seward Base Day 1: Kenai Fjords National Park Cruise & Alaska SeaLife Center",
    basePlaceId: "dcc:port:us-seward:0001",
    suggestedOvernightPlaceLabel: "Seward (Night 2 of 3)",
    defaultConfirmationState: "tentative",
    corridorId: null,
    candidateCampgroundIds: ["campground:seward-waterfront-park"],
    defaultCampgroundId: "campground:seward-waterfront-park",
    defaultSiteTierId: "seward-waterfront-30a-water",
    recommendedServiceStopIds: [],
    candidateActivityIds: [
      "activity:major-marine-kenai-fjords-cruise",
      "activity:alaska-sealife-center",
    ],
    realisticDayNarrative:
      "Leave the RV leveled and plugged in at your Seward campsite. Ride the reserved Major Marine shuttle (or walk the bay path) for your 6-hour Kenai Fjords tidewater glacier & whale cruise, then visit the Alaska SeaLife Center downtown.",
    operationalChecklist: [
      "Check in 60 minutes prior to cruise departure.",
      "Conserve gray/black holding tank capacity if camped on a non-sewer municipal waterfront pad.",
    ],
  },
  {
    dayNumber: 4,
    dayRole: "basecamp_stay",
    title: "Seward Base Day 2: Exit Glacier (Kenai Fjords NP) & Harbor Exploration",
    basePlaceId: "dcc:port:us-seward:0001",
    suggestedOvernightPlaceLabel: "Seward (Night 3 of 3)",
    defaultConfirmationState: "tentative",
    corridorId: null,
    candidateCampgroundIds: ["campground:seward-waterfront-park"],
    defaultCampgroundId: "campground:seward-waterfront-park",
    defaultSiteTierId: "seward-waterfront-30a-water",
    recommendedServiceStopIds: [],
    candidateActivityIds: ["activity:exit-glacier-nature-center"],
    realisticDayNarrative:
      "Drive Herman Leirer Road early morning to beat day-use lot congestion at Exit Glacier Nature Center (remember: zero overnight RV parking allowed in the park), hike the Glacier Overlook trail, and return to Seward for a relaxed second full day.",
    operationalChecklist: [
      "Arrive at Exit Glacier before 9:00 AM if driving a 28–32 ft motorhome.",
      "Prep hoses for tomorrow morning's stop at the Seward B St municipal dump station.",
    ],
  },
  {
    dayNumber: 5,
    dayRole: "drive_leg",
    title: "Seward → Cooper Landing → Soldotna Supply Stop → Homer Spit (172 mi)",
    basePlaceId: "dcc:place:us-ak-homer-ak:0001",
    suggestedOvernightPlaceLabel: "Homer Spit (Night 1 of 3)",
    defaultConfirmationState: "tentative",
    corridorId: "corridor:seward-to-homer-via-sterling",
    candidateCampgroundIds: [
      "campground:heritage-rv-park-homer",
      "campground:homer-spit-campground",
    ],
    defaultCampgroundId: "campground:heritage-rv-park-homer",
    defaultSiteTierId: "heritage-fhu-50a-big-rig",
    recommendedServiceStopIds: [
      "service:seward-municipal-dump-water",
      "service:soldotna-mid-peninsula-supply-dump",
    ],
    candidateActivityIds: [],
    realisticDayNarrative:
      "Pure highway driving is ~3.5–4h, but budget a realistic 6.5–8h RV travel day: dump tanks at Seward's Ballaine & B St station, wind past Kenai Lake and Cooper Landing canyon, restock groceries & fuel in Soldotna, pause at Baycrest Hill overlook, and pull onto the Homer Spit.",
    operationalChecklist: [
      "Check 511.alaska.gov for Cooper Landing Sterling Hwy construction pilot-car delays.",
      "Verify your Homer Spit site tier matches your exact RV length and hookup needs (full hookup vs. 30 ft dry beach cap).",
    ],
  },
  {
    dayNumber: 6,
    dayRole: "basecamp_stay",
    title: "Homer Base Day 1: Kachemak Bay Water Taxi & Grewingk Glacier Trail",
    basePlaceId: "dcc:place:us-ak-homer-ak:0001",
    suggestedOvernightPlaceLabel: "Homer Spit (Night 2 of 3)",
    defaultConfirmationState: "tentative",
    corridorId: null,
    candidateCampgroundIds: [
      "campground:heritage-rv-park-homer",
      "campground:homer-spit-campground",
    ],
    defaultCampgroundId: "campground:heritage-rv-park-homer",
    defaultSiteTierId: "heritage-fhu-50a-big-rig",
    recommendedServiceStopIds: [],
    candidateActivityIds: ["activity:makos-water-taxi-kachemak-bay"],
    realisticDayNarrative:
      "Keep your RV parked at your Spit campsite and walk or taxi to the Small Boat Harbor to catch Mako's Water Taxi across Kachemak Bay for the Grewingk Glacier Lake / Saddle Trail hike or Halibut Cove.",
    operationalChecklist: [
      "Confirm tide-dependent drop-off and beach pick-up times with your water taxi captain.",
      "Do not pull oversized motorhomes onto tight harbor boat-launch aprons.",
    ],
  },
  {
    dayNumber: 7,
    dayRole: "basecamp_stay",
    title: "Homer Base Day 2: Kachemak Bay Weather Buffer, Spit Boardwalk & Coastal Center",
    basePlaceId: "dcc:place:us-ak-homer-ak:0001",
    suggestedOvernightPlaceLabel: "Homer Spit (Night 3 of 3)",
    defaultConfirmationState: "tentative",
    corridorId: null,
    candidateCampgroundIds: [
      "campground:heritage-rv-park-homer",
      "campground:homer-spit-campground",
    ],
    defaultCampgroundId: "campground:heritage-rv-park-homer",
    defaultSiteTierId: "heritage-fhu-50a-big-rig",
    recommendedServiceStopIds: ["service:homer-spit-city-dump-water"],
    candidateActivityIds: [],
    realisticDayNarrative:
      "Second full Homer day absorbs marine fog/wind rescheduling or lets your party split between halibut fishing, Bishop's Beach tidepooling, Alaska Islands & Ocean Visitor Center (oversized RV parking), and Old Town Homer.",
    operationalChecklist: [
      "If dry-camping on the Spit, dump holding tanks at the City of Homer Spit station or guest station before tomorrow's 225-mile drive.",
    ],
  },
  {
    dayNumber: 8,
    dayRole: "drive_leg",
    title: "Homer → Soldotna → Anchorage Return Staging (225 mi)",
    basePlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    suggestedOvernightPlaceLabel: "Anchorage (Pre-Return Staging Night)",
    defaultConfirmationState: "tentative",
    corridorId: "corridor:homer-to-anchorage-return",
    candidateCampgroundIds: [
      "campground:golden-nugget-rv-park-anc",
      "campground:centennial-camper-park-anc",
    ],
    defaultCampgroundId: "campground:golden-nugget-rv-park-anc",
    defaultSiteTierId: "gn-pull-through-50a-fhu",
    recommendedServiceStopIds: ["service:soldotna-mid-peninsula-supply-dump"],
    candidateActivityIds: [],
    realisticDayNarrative:
      "Drive the full 225 miles north from Homer to Anchorage today (4.5–5h pure highway, 7–8.5h realistic RV day) so summer construction or Turnagain Arm traffic never threatens tomorrow morning's rental return cutoff.",
    operationalChecklist: [
      "Pack suitcases and consolidate gear tonight at your Anchorage full-hookup site.",
      "Verify whether your rental contract requires interior sweeping, propane refill, or empty tanks before morning check-in.",
    ],
  },
  {
    dayNumber: 9,
    dayRole: "return_departure",
    title: "Morning Dump, Fuel/Propane Top-Off, Anchorage RV Return & ANC Flight",
    basePlaceId: "dcc:place:us-ak-anchorage-ak:0001",
    suggestedOvernightPlaceLabel: "Departing Anchorage (ANC) — No RV Overnight",
    defaultConfirmationState: "tentative",
    corridorId: null,
    candidateCampgroundIds: [],
    defaultCampgroundId: null,
    defaultSiteTierId: null,
    recommendedServiceStopIds: ["service:anchorage-south-provisioning-hub"],
    candidateActivityIds: [],
    realisticDayNarrative:
      "Top off unleaded fuel and propane near Old Seward Hwy, complete final tank dump (included free on-site for Great Alaskan Holidays renters), complete morning depot check-in by your scheduled slot, and transfer to ANC.",
    operationalChecklist: [
      "Vacate RV with all personal gear by your confirmed return cutoff (commonly 8:00–10:00 AM).",
      "Inspect roof/awnings/tires at check-in and retain final closed rental receipt.",
    ],
  },
] as const;

export const ALASKA_RV_UNRESOLVED_FACTS_LEDGER: readonly {
  id: string;
  scope: string;
  unresolvedFact: string;
  howSystemHandlesIt: string;
}[] = [
  {
    id: "UNRES-RV-ABC-01",
    scope: "ABC Motorhome & Car Rentals (abcmotorhome.com)",
    unresolvedFact:
      "Direct primary domain timed out during automated retrieval on 2026-11-19; current 2027 pickup/return hours, lot-sleep policy, and gravel exclusions could not be re-attested directly.",
    howSystemHandlesIt:
      "Held as `held_source_unreachable` with `null`/`unknown` policy fields; excluded from active verified operator defaults until direct primary-source check succeeds.",
  },
  {
    id: "UNRES-RV-MUNI-01",
    scope: "Municipality of Anchorage — Centennial Camper Park",
    unresolvedFact:
      "Legacy Centennial Camper Park URL on muni.org returned 404 on 2026-11-19; exact 2027 ActiveNet booking URL and nightly fee schedule were not verified.",
    howSystemHandlesIt:
      "Links cleanly to verified Municipality Parks root (`muni.org/Departments/parks`) and marks 2027 fee/reservation URL as `current_posted_guidance_2027_unverified`.",
  },
  {
    id: "UNRES-RV-RUSSIAN-01",
    scope: "Russian River Campground (Recreation.gov Facility 232213)",
    unresolvedFact:
      "Individual site pad lengths and driveway grades vary pad-by-pad across loops rather than sharing one uniform RV foot limit.",
    howSystemHandlesIt:
      "Keeps `maxMotorhomeLengthFeet: null` and returns `needs_confirmation` from `evaluateRvSiteCompatibility()` until the traveler's confirmed pad length is imported or entered.",
  },
  {
    id: "UNRES-RV-2027-RATES",
    scope: "2027 Seasonal Rates, Campspot January Release Date & Live Site/RV Inventory",
    unresolvedFact:
      "Real-time 2027 RV fleet availability, nightly tariffs, and exact Campspot/Recreation.gov site openings are not queried live.",
    howSystemHandlesIt:
      "Every record keeps `liveSiteInventoryState: 'not_checked'` and starts itinerary nights as `tentative` until the traveler imports or confirms a reservation.",
  },
  {
    id: "UNRES-RV-AMHS-2027",
    scope: "Alaska Marine Highway System (AMHS) Summer 2027 Schedule",
    unresolvedFact:
      "Summer 2027 AMHS vessel dates and vehicle deck space are outside static verified coverage until published in OARS.",
    howSystemHandlesIt:
      "Marks `scheduleFreshnessState: 'outside_published_coverage'` and blocks passenger-only tickets from counting as reserved RV deck space.",
  },
  {
    id: "UNRES-RV-SOLDOTNA-DUMP",
    scope: "Soldotna Seasonal Dump & Rinse Hose Availability",
    unresolvedFact:
      "Historic Fred Meyer dump station in Soldotna is reported closed by travelers, and seasonal water/rinse spigots along Seward/Sterling Hwys vary with spring freeze dates.",
    howSystemHandlesIt:
      "Explicitly warns against relying on the closed Fred Meyer listing and prompts travelers to carry a dedicated non-potable rinse hose.",
  },
] as const;

export const DCC_CP_ALASKA_RV_INTEGRATION_CONTRACT: DccCpIndependentRvPlannerIntegrationSpec = {
  contractVersion: ALASKA_RV_PLANNER_INTEGRATION_CONTRACT_VERSION,
  canonicalCatalogOwner: "dcc",
  privatePlannerOwner: "cruisepromenade",
  publicDiscoveryHome: "cruisepromenade",
  publicDiscoveryCanonicalPreviewPath: "/guides/alaska-rv-trip-planner",
  publicItineraryWorkspacePreviewPath: "/guides/alaska-rv-trip-planner/itinerary",
  requiresCruiseShipOrSailingRecord: false,
  createsSyntheticPhysicalSailingId: false,
  defaultRollCallSyncEnabled: false,
  supportedConfirmationCategories: [
    "rv_rental",
    "campground_reservation",
    "ferry_reservation",
    "activity",
    "flight",
    "accommodation",
  ],
  supportedItemConfirmationStates: [
    "tentative",
    "traveler_booked",
    "changed",
    "cancelled",
  ],
  privacyInvariants: [
    "Booking/confirmation numbers, emails, and phone numbers remain strictly in private owner storage (`PlannerActivity.confirmationNumber` / `privateOriginal`) and are stripped by `toSharedPlanner()` before `/p/[shareCode]` or `/p/[shareCode]/pack` projection.",
    "RollCallUSA sailing-room sync (`rollCallEnabled`) defaults to `false` and never transmits ship-free RV plans.",
    "Preview discovery and workspace routes emit `X-Robots-Tag: noindex, nofollow, noarchive` and stay excluded from Production sitemaps until explicit owner release.",
  ],
  uncruiseAndIndependentWorkstreamAlignment: [
    "Reuses the single CP `Planner` / `SharedPlanner` persistence, participation, lock/pack, and `/api/planners/[shareCode]/email-imports` pipeline — zero competing planner DB or fork.",
    "Adds additive `journeyKind: 'independent_rv'` + `independentRv` metadata while leaving `sailing` 100% intact for `cruise_sailing` and `expedition_sailing` (UnCruise).",
    "Shares the same non-overclaiming provenance model (`observedAt`, schedule freshness vs. live inventory `not_checked`, and unknown-stays-unknown evaluation).",
  ],
};

export function getAlaskaRvPilotSnapshot() {
  return {
    schemaVersion: ALASKA_RV_CONTRACT_VERSION,
    integrationContractVersion: ALASKA_RV_PLANNER_INTEGRATION_CONTRACT_VERSION,
    observedAt: ALASKA_RV_PILOT_OBSERVED_AT,
    entryModes: ALASKA_RV_ENTRY_MODES,
    marketLandscape: ALASKA_RV_MARKET_LANDSCAPE,
    places: ALASKA_RV_PILOT_PLACES,
    rentalOperators: ALASKA_RV_RENTAL_OPERATORS,
    corridors: ALASKA_RV_HIGHWAY_CORRIDORS,
    campgrounds: ALASKA_RV_CAMPGROUNDS,
    serviceStops: ALASKA_RV_SERVICE_STOPS,
    activities: ALASKA_RV_ACTIVITIES,
    ferryRules: ALASKA_RV_FERRY_RULES,
    recommended9DayItinerary: ALASKA_RV_RECOMMENDED_9D_EXAMPLE_DAYS,
    unresolvedFacts: ALASKA_RV_UNRESOLVED_FACTS_LEDGER,
    integrationContract: DCC_CP_ALASKA_RV_INTEGRATION_CONTRACT,
  };
}
