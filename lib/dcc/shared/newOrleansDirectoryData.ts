/**
 * Canonical New Orleans Regional Directory & Knowledge Graph Dataset
 * (`lib/dcc/shared/newOrleansDirectoryData.ts`).
 *
 * Implements `dcc.directory.ext.new-orleans.v1` on top of frozen
 * `dcc.directory.core.v1` with strict primary-source provenance, traffic-qualified
 * drive ranges, distinct wetland basins, historic-site/museum entity separation,
 * operator-vs-vessel separation, product-level wharf resolution, separate Port NOLA
 * terminals, and fail-closed publication gates.
 */

import {
  DIRECTORY_CORE_CONTRACT_VERSION,
  normalizeProductDepartureSlots,
  type DirectoryCategoryDefinition,
  type OperatorIntegrationApprovalState,
} from "@/lib/dcc/shared/regionalDirectoryCoreContract";
import {
  NEW_ORLEANS_DIRECTORY_EXTENSION_VERSION,
  NEW_ORLEANS_DIRECTORY_SCHEMA_VERSION,
  evaluateNewOrleansAreaCategoryPublicationGate,
  evaluateNewOrleansOperatorPublicationGate,
  evaluateNewOrleansPlacePublicationGate,
  isOperatorDirectCheckoutConnected,
  isOperatorLiveAvailabilityConnected,
  type NewOrleansAreaCategoryComparison,
  type NewOrleansOperatorRecord,
  type NewOrleansPlaceRecord,
  type NewOrleansProductRecord,
} from "@/lib/dcc/shared/newOrleansDirectoryExtensionContract";

const VERIFIED_DATE = "2026-11-17";
const MODIFIED_ISO = "2026-11-17T14:00:00Z";

function createDefaultUnconnectedApprovalState(
  notes: string,
): OperatorIntegrationApprovalState {
  return {
    connectionRequestStatus: "not_requested",
    liveAvailabilityApprovedByOwner: false,
    directCheckoutApprovedByOwner: false,
    commercialTermsSigned10Pct: false,
    settlementMode: null,
    commissionEarnedOn: null,
    publicAttributionParam: null,
    liveFeedVerificationStatus: "unconnected",
    approvedAt: null,
    approvedBy: null,
    notes,
  };
}

// ============================================================================
// 1. CANONICAL EXCURSION CATEGORIES
// ============================================================================

export const NEW_ORLEANS_CATEGORIES: readonly DirectoryCategoryDefinition[] = [
  {
    categorySlug: "swamp-and-airboat-tours",
    name: "Swamp Boats, Airboats & Bayou Kayaking",
    shortLabel: "Swamp & Airboat",
    summary:
      "Compare open high-speed airboats, shaded covered pontoon swamp boats, and guided cypress-swamp kayaking across Honey Island, Jean Lafitte / Barataria, Bayou Gauche, and Manchac.",
    image: "/images/portfolio/louisiana-airboat-marsh.webp",
    imageAlt: "Open airboat skimming across marsh channels near New Orleans",
    imageCredit: "Welcome to New Orleans Tours rights-cleared portfolio library",
  },
  {
    categorySlug: "riverboat-cruises",
    name: "Mississippi Riverboats & Live Jazz Cruises",
    shortLabel: "Riverboats",
    summary:
      "Daytime harbor jazz cruises, evening dinner jazz sailings, and Sunday jazz brunch voyages departing the French Quarter riverfront wharves.",
    image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    imageAlt: "Steamboat NATCHEZ sternwheel paddlewheeler on the Mississippi River",
    imageCredit: "Wikimedia Commons / WNO rights-cleared New Orleans archive",
  },
  {
    categorySlug: "river-road-history-excursions",
    name: "River Road Slavery Museums & Historic Estates",
    shortLabel: "River Road History",
    summary:
      "Round-trip motorcoach and small-bus historical excursions from New Orleans to Whitney Plantation, Laura Plantation, and Oak Alley Plantation along the Great River Road.",
    image: "/images/portfolio/whitney-plantation.webp",
    imageAlt: "Historic structures and grounds at Whitney Plantation in Wallace, Louisiana",
    imageCredit: "Welcome to New Orleans Tours rights-cleared portfolio library",
  },
  {
    categorySlug: "ghost-vampire-and-history-walks",
    name: "French Quarter Ghost, Vampire & Cemetery History Tours",
    shortLabel: "Ghost & History Walks",
    summary:
      "Licensed historian- and storyteller-led evening walks and cemetery bus tours examining Vieux Carré colonial history, folklore, Voodoo traditions, and burial architecture.",
    image: "/images/portfolio/royal-street-balconies.webp",
    imageAlt: "Wrought-iron balconies in the New Orleans French Quarter at dusk",
    imageCredit: "Welcome to New Orleans Tours rights-cleared portfolio library",
  },
  {
    categorySlug: "food-and-cocktail-walks",
    name: "Creole Culinary & Classic Cocktail History Walks",
    shortLabel: "Food & Cocktails",
    summary:
      "Guided French Quarter tasting walks exploring Creole culinary history, gumbo and praline traditions, and historic New Orleans apothecary and cocktail lounges.",
    image: "/images/portfolio/classic-cocktails-nola.webp",
    imageAlt: "Classic New Orleans Sazerac and French Quarter cocktail service",
    imageCredit: "Welcome to New Orleans Tours rights-cleared portfolio library",
  },
  {
    categorySlug: "city-and-garden-district-sightseeing",
    name: "City Sightseeing, Katrina Recovery & Garden District Tours",
    shortLabel: "City & Garden District",
    summary:
      "Narrated motorcoach, hotel-pickup minibus, hop-on hop-off double-decker, and Garden District walking tours covering 300 years of New Orleans neighborhood geography.",
    image: "/images/portfolio/garden-district-mansion.webp",
    imageAlt: "Historic Greek Revival residence shaded by live oaks in the Garden District",
    imageCredit: "Welcome to New Orleans Tours rights-cleared portfolio library",
  },
];

// ============================================================================
// 2. CANONICAL PLACES (16 QUALIFIED + 9 HELD = 25 PLACES)
// ============================================================================

export const NEW_ORLEANS_PLACES: readonly NewOrleansPlaceRecord[] = [
  // --- URBAN NEIGHBORHOODS & RIVERFRONT ---
  {
    placeId: "place:french-quarter",
    publicPlaceSlug: "french-quarter",
    hasPublicDirectoryPage: true,
    name: "French Quarter (Vieux Carré)",
    subRegionLabel: "Historic Core · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    neverAliasOrRedirectToSlugs: ["mississippi-riverfront", "marigny", "treme"],
    heroImage: "/images/portfolio/royal-street-balconies.webp",
    heroImageAlt: "Cast-iron galleries along Royal Street in the French Quarter",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "The walkable 1718 colonial grid where walking tours meet and out-of-town swamp and River Road shuttles stage commercial hotel pickups.",
    overview:
      "Stretching from Canal Street to Esplanade Avenue between North Rampart Street and the Mississippi River, the French Quarter (Vieux Carré) anchors almost every visitor itinerary in New Orleans. Walking tours assemble at specific street corners and courtyards—never at residential doors—while motorcoach and minibus operators use designated Canal Street, Decatur Street, and perimeter commercial hotel loading zones because large buses are restricted inside narrow interior Quarter blocks.",
    accessAndTransitSummary:
      "Walkable end-to-end in 20–25 minutes (13 blocks river-to-Rampart by 11 blocks Canal-to-Esplanade), served by the Riverfront, Canal, and Rampart/St. Claude RTA streetcar lines.",
    pickupAndArrivalNotes:
      "Commercial hotel pickups apply to licensed hotels only—Airbnbs and residential rentals must walk to the nearest approved hotel or central ticket office (such as 400 Toulouse St). Arrive 15–20 minutes early for walking tours.",
    weatherOrSeasonalAdvice:
      "Afternoon thunderstorms are common May–September; French Quarter festivals, Mardi Gras parades, and French Quarter Fest close interior streets to vehicles and shift shuttle boarding to Canal, Basin, or Poydras.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:fq-jackson-square-st-peter",
        name: "723 St. Peter St / Jackson Square Perimeter",
        facilityKind: "meeting_point" as never,
        latitude: 29.9581,
        longitude: -90.0637,
        precisionTier: "meeting_point",
        transitOrWalkNotes: "2 blocks from Decatur St & Riverfront streetcar stop; pedestrian mall around Jackson Square.",
        additionalTransferMinutesEachWay: 0,
      },
      {
        locationId: "mp:fq-rampart-voodoo-lounge",
        name: "718 N. Rampart St (Armstrong Park Border)",
        facilityKind: "venue_check_in",
        latitude: 29.9609,
        longitude: -90.0672,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "Directly across North Rampart Street from Louis Armstrong Park and Congo Square.",
        additionalTransferMinutesEachWay: 0,
      },
      {
        locationId: "mp:fq-chartres-bienville",
        name: "316 Chartres St & 730 Bienville St Culinary Meeting Corridor",
        facilityKind: "hotel_or_downtown_plaza",
        latitude: 29.9548,
        longitude: -90.0669,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "3 blocks upriver from Jackson Square, 2 blocks off Canal Street.",
        additionalTransferMinutesEachWay: 0,
      },
    ],
    officialLocalSources: [
      {
        label: "New Orleans & Company — Official French Quarter Neighborhood Guide",
        url: "https://www.neworleans.com/plan/neighborhoods/french-quarter/",
        sourceKind: "official_dmo_tourism",
        checkedAt: VERIFIED_DATE,
      },
      {
        label: "Vieux Carré Commission — City of New Orleans Historic Preservation",
        url: "https://nola.gov/next/vcc/home/",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:mississippi-riverfront",
        targetPublicSlug: "mississippi-riverfront",
        targetName: "Mississippi Riverfront & Wharves",
        targetPlaceType: "riverfront_wharf_or_dock",
        relationship: "adjacent_neighborhood_or_riverfront",
        distanceOrTransitSummary: "Immediate riverfront edge across Decatur St & floodwall gates",
        geographicExplanation: "Toulouse Street Wharf (400 Toulouse St) and St. Louis / Lower Bienville Wharf (101 St. Louis St) sit directly along Woldenberg Park on the Quarter's river edge.",
      },
      {
        targetPlaceId: "place:treme",
        targetPublicSlug: "treme",
        targetName: "Tremé & Congo Square",
        targetPlaceType: "urban_neighborhood",
        relationship: "adjacent_neighborhood_or_riverfront",
        distanceOrTransitSummary: "Directly across North Rampart Street",
        geographicExplanation: "Louis Armstrong Park and Congo Square begin immediately across N. Rampart St from the French Quarter.",
      },
    ],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:mississippi-riverfront",
    publicPlaceSlug: "mississippi-riverfront",
    hasPublicDirectoryPage: true,
    name: "Mississippi Riverfront & French Quarter Wharves",
    subRegionLabel: "Toulouse St & St. Louis St Wharves · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "riverfront_wharf_or_dock",
    neverAliasOrRedirectToSlugs: [
      "french-quarter",
      "erato-street-cruise-terminal",
      "julia-street-cruise-terminal",
    ],
    heroImage: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    heroImageAlt: "Steamboat NATCHEZ docked along the Mississippi Riverfront in New Orleans",
    heroImageCredit: "Wikimedia Commons / WNO rights-cleared archive",
    hook: "Home to the Toulouse Street Wharf (400 Toulouse St) and companion St. Louis Street / Lower Bienville Wharf (101 St. Louis St) along Woldenberg Park—distinct from the deep-water ocean cruise terminals upriver.",
    overview:
      "The French Quarter Mississippi Riverfront spans Woldenberg Riverfront Park from Canal Street downriver toward Esplanade Avenue. Excursion riverboats—not ocean cruise ships—board here. Crucially, Steamboat NATCHEZ and Riverboat CITY of NEW ORLEANS are operated by New Orleans Steamboat Company from the Lighthouse Ticket Office at 400 Toulouse Street, but they do not always share the exact same gangway: when both vessels operate simultaneously, Steamboat NATCHEZ boards at Toulouse Street Wharf (400 Toulouse St) while Riverboat CITY of NEW ORLEANS boards roughly two blocks upriver at the St. Louis Street / Lower Bienville Wharf (101 St. Louis St). Ocean-going Carnival, Norwegian, and Royal Caribbean ships dock further upriver at Erato Street and Julia Street Cruise Terminals.",
    accessAndTransitSummary:
      "Accessible on foot via Toulouse St, St. Peter St, Conti St, or Bienville St pedestrian crossings over the riverfront tracks, or via the RTA Riverfront Streetcar.",
    pickupAndArrivalNotes:
      "Check in 30–45 minutes prior to riverboat departure (45 minutes for Gray Line motorcoach tours departing the 400 Toulouse St Lighthouse Ticket Office). Always confirm whether your sailing boards at 400 Toulouse St or 101 St. Louis St.",
    weatherOrSeasonalAdvice:
      "High Mississippi River stage or dense river fog can adjust sailing routes or boarding ramps; riverboats have climate-controlled interior decks plus open-air viewing promenades.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:toulouse-street-wharf-400",
        name: "Toulouse Street Wharf & Gray Line Lighthouse Ticket Office (400 Toulouse St)",
        facilityKind: "harbor_ramp",
        latitude: 29.9554,
        longitude: -90.0623,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "Behind JAX Brewery at Toulouse St & the Mississippi River; primary Steamboat NATCHEZ berth and central ticket box office.",
        additionalTransferMinutesEachWay: 0,
      },
      {
        locationId: "mp:st-louis-bienville-wharf-101",
        name: "St. Louis Street / Lower Bienville Wharf (101 St. Louis St)",
        facilityKind: "harbor_ramp",
        latitude: 29.9537,
        longitude: -90.0635,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "2 blocks upriver from Toulouse Wharf along Woldenberg Riverfront Park; companion berth for Riverboat CITY of NEW ORLEANS when NATCHEZ is in port.",
        additionalTransferMinutesEachWay: 4,
      },
    ],
    officialLocalSources: [
      {
        label: "New Orleans Steamboat Company — Steamboat NATCHEZ & Riverboat CITY of NEW ORLEANS Directions",
        url: "https://www.steamboatnatchez.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
      {
        label: "Audubon Nature Institute — Woldenberg Riverfront Park",
        url: "https://audubonnatureinstitute.org/woldenberg-park",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:julia-street-cruise-terminal",
        targetPublicSlug: "julia-street-cruise-terminal",
        targetName: "Julia Street Cruise Terminal",
        targetPlaceType: "cruise_turnaround_terminal",
        relationship: "turnaround_transfer_link",
        distanceOrTransitSummary: "0.9 miles upriver (~18-minute Riverwalk stroll or 6–10 min taxi)",
        geographicExplanation: "Excursion paddlewheelers dock at Toulouse/St. Louis Wharves in the Quarter; ocean cruise ships dock upriver beyond Canal Street at Julia and Erato Terminals.",
      },
    ],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:garden-district",
    publicPlaceSlug: "garden-district",
    hasPublicDirectoryPage: true,
    name: "Garden District",
    subRegionLabel: "St. Charles Streetcar Corridor · Uptown / Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    neverAliasOrRedirectToSlugs: ["french-quarter", "warehouse-district"],
    heroImage: "/images/portfolio/garden-district-mansion.webp",
    heroImageAlt: "Greek Revival architecture and live oaks in the New Orleans Garden District",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "19th-century Greek Revival and Italianate mansions, oak-canopied sidewalks, and historic Lafayette Cemetery No. 1 perimeter walks along the St. Charles Streetcar line.",
    overview:
      "Developed beginning in 1832 as part of the formerly separate City of Lafayette, the Garden District spans St. Charles Avenue to Magazine Street between Jackson Avenue and Louisiana Avenue. Guided walking tours examine antebellum and postbellum residential architecture, drainage and burial engineering outside Lafayette Cemetery No. 1 (note: interior municipal access to Lafayette Cemetery No. 1 has been subject to City of New Orleans restoration closures—verify current gate status before assuming interior entry), and Magazine Street merchant blocks.",
    accessAndTransitSummary:
      "20–30 minutes from Canal Street aboard the historic St. Charles Streetcar ($1.25 exact fare or Jazzy Pass), or 10–18 minutes by rideshare/taxi depending on Lee Circle and I-10 ramp traffic.",
    pickupAndArrivalNotes:
      "Walking tours typically meet near 1400 Washington Avenue (at Prytania Street) rather than providing hotel shuttles. Wear supportive closed-toe walking shoes for uneven oak-root brick and slate sidewalks.",
    weatherOrSeasonalAdvice:
      "Live-oak canopies offer partial shade, but summer humidity remains high; Mardi Gras Uptown parade days (the week prior to Fat Tuesday) close St. Charles Avenue to streetcars and cross-traffic.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:gd-washington-prytania",
        name: "Washington Ave & Prytania St (1400 Washington Ave)",
        facilityKind: "hotel_or_downtown_plaza",
        latitude: 29.9288,
        longitude: -90.0846,
        precisionTier: "meeting_point",
        transitOrWalkNotes: "1 block riverside of the St. Charles Ave & Washington Ave streetcar stop.",
        additionalTransferMinutesEachWay: 22,
      },
    ],
    officialLocalSources: [
      {
        label: "New Orleans & Company — Official Garden District Guide",
        url: "https://www.neworleans.com/plan/neighborhoods/uptown-garden-district/",
        sourceKind: "official_dmo_tourism",
        checkedAt: VERIFIED_DATE,
      },
      {
        label: "New Orleans Regional Transit Authority (RTA) — St. Charles Streetcar Route 12",
        url: "https://www.norta.com/",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:warehouse-district",
        targetPublicSlug: "warehouse-district",
        targetName: "Warehouse / Arts District",
        targetPlaceType: "urban_neighborhood",
        relationship: "adjacent_neighborhood_or_riverfront",
        distanceOrTransitSummary: "1.2 miles downriver along St. Charles Ave / Magazine St",
        geographicExplanation: "Sits immediately between the Garden District/Lower Garden District and Canal Street.",
      },
    ],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:warehouse-district",
    publicPlaceSlug: "warehouse-district",
    hasPublicDirectoryPage: true,
    name: "Warehouse / Arts District",
    subRegionLabel: "Museums, Convention Center & Cruise Gateway · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    neverAliasOrRedirectToSlugs: ["erato-street-cruise-terminal", "julia-street-cruise-terminal"],
    heroImage: "/images/portfolio/classic-cocktails-nola.webp",
    heroImageAlt: "Restored brick warehouse district streetscape in New Orleans",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Converted 19th-century brick coffee and cotton warehouses housing the National WWII Museum, Julia Street galleries, convention hotels, and immediate access to Port NOLA cruise terminals.",
    overview:
      "Located upriver from Poydras Street to the Pontchartrain Expressway (US-90B), the Warehouse / Arts District bridges Downtown convention hotels, the National WWII Museum campus, and the Port of New Orleans riverfront terminals. Most commercial hotels along Convention Center Boulevard, Tchoupitoulas Street, Julia Street, and Poydras Street are eligible for swamp and River Road shuttle pickups, making this the most practical pre- and post-cruise base in New Orleans.",
    accessAndTransitSummary:
      "5–12 minutes by taxi/rideshare from the French Quarter or walkable in 15–20 minutes from Canal Street; directly borders Julia Street and Erato Street Cruise Terminals.",
    pickupAndArrivalNotes:
      "Out-of-town tour shuttles frequently pick up Warehouse District guests first or last on the Downtown loop (60–75 minutes before dock check-in).",
    weatherOrSeasonalAdvice:
      "Major Ernest N. Morial Convention Center events and Saints home games increase Poydras, Convention Center Blvd, and Tchoupitoulas traffic.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:warehouse-julia-magazine",
        name: "Higgins Hotel / National WWII Museum Perimeter (Andrew Higgins Dr & Magazine St)",
        facilityKind: "pickup_zone",
        latitude: 29.9431,
        longitude: -90.0704,
        precisionTier: "meeting_point",
        transitOrWalkNotes: "Central Warehouse District stop along Hop-On Hop-Off and hotel shuttle corridors.",
        additionalTransferMinutesEachWay: 8,
      },
    ],
    officialLocalSources: [
      {
        label: "New Orleans & Company — Arts / Warehouse District Guide",
        url: "https://www.neworleans.com/plan/neighborhoods/arts-warehouse-district/",
        sourceKind: "official_dmo_tourism",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:erato-street-cruise-terminal",
        targetPublicSlug: "erato-street-cruise-terminal",
        targetName: "Erato Street Cruise Terminal",
        targetPlaceType: "cruise_turnaround_terminal",
        relationship: "turnaround_transfer_link",
        distanceOrTransitSummary: "0.4–0.6 miles along Tchoupitoulas / Henderson loop",
        geographicExplanation: "Carnival's Erato Street terminal sits on the riverfront edge of the Warehouse District.",
      },
      {
        targetPlaceId: "place:julia-street-cruise-terminal",
        targetPublicSlug: "julia-street-cruise-terminal",
        targetName: "Julia Street Cruise Terminal",
        targetPlaceType: "cruise_turnaround_terminal",
        relationship: "turnaround_transfer_link",
        distanceOrTransitSummary: "Immediate riverfront edge at Julia St & Convention Center Blvd",
        geographicExplanation: "NCL and Royal Caribbean's Julia Street terminal adjoins the Riverwalk and Warehouse District.",
      },
    ],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:marigny",
    publicPlaceSlug: "marigny",
    hasPublicDirectoryPage: true,
    name: "Faubourg Marigny",
    subRegionLabel: "Esplanade Ave & Live Music Border · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    neverAliasOrRedirectToSlugs: ["french-quarter"],
    heroImage: "/images/portfolio/nola-jazz-music.webp",
    heroImageAlt: "Brass and jazz musicians performing in New Orleans",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "One of New Orleans' earliest downriver Creole suburbs, famed for Creole cottages and the Frenchmen Street live-jazz corridor just past Esplanade Avenue.",
    overview:
      "Subdivided starting in 1805 from Bernard de Marigny's plantation immediately downriver from Esplanade Avenue, Faubourg Marigny blends colorful Creole cottages and shotgun houses with the dense 500–600 blocks of Frenchmen Street. While evening live-music club hopping centers here, daytime city sightseeing buses pass along Esplanade Avenue and Elysian Fields, whereas out-of-town swamp shuttles rarely enter residential Marigny blocks—travelers staying in Marigny inns typically walk across Esplanade Avenue to a French Quarter pickup point.",
    accessAndTransitSummary:
      "Immediate walk across Esplanade Avenue from the lower French Quarter (French Market / Old U.S. Mint) or via the Rampart/St. Claude streetcar corridor.",
    pickupAndArrivalNotes:
      "Verify pickup eligibility before booking hotel-shuttle swamp or River Road tours; small Marigny guesthouses usually use a French Quarter border meeting point.",
    weatherOrSeasonalAdvice:
      "Evening pedestrian crowds peak Thursday–Sunday along Frenchmen Street; carry cash for band tips and check venue age minimums (many clubs are 21+ at night).",
    meetingAndAccessPoints: [
      {
        locationId: "mp:marigny-esplanade-frenchmen",
        name: "Esplanade Ave & Frenchmen St Triangle",
        facilityKind: "hotel_or_downtown_plaza",
        latitude: 29.9624,
        longitude: -90.0578,
        precisionTier: "gate_or_plaza",
        transitOrWalkNotes: "1 block downriver from the Old U.S. Mint / Riverfront Streetcar terminus.",
        additionalTransferMinutesEachWay: 8,
      },
    ],
    officialLocalSources: [
      {
        label: "New Orleans & Company — Marigny & Bywater Official Guide",
        url: "https://www.neworleans.com/plan/neighborhoods/marigny-bywater/",
        sourceKind: "official_dmo_tourism",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:french-quarter",
        targetPublicSlug: "french-quarter",
        targetName: "French Quarter",
        targetPlaceType: "urban_neighborhood",
        relationship: "adjacent_neighborhood_or_riverfront",
        distanceOrTransitSummary: "Across Esplanade Avenue",
        geographicExplanation: "Esplanade Avenue forms the historic boundary between the Vieux Carré and Faubourg Marigny.",
      },
    ],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:treme",
    publicPlaceSlug: "treme",
    hasPublicDirectoryPage: true,
    name: "Tremé & Congo Square",
    subRegionLabel: "African American Heritage & Brass Band Birthplace · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    neverAliasOrRedirectToSlugs: ["french-quarter"],
    heroImage: "/images/portfolio/nola-jazz-music.webp",
    heroImageAlt: "New Orleans brass band heritage near Tremé and Louis Armstrong Park",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Widely recognized as the oldest surviving free Black neighborhood in the United States, anchored by Congo Square, Louis Armstrong Park, and St. Augustine Church.",
    overview:
      "Immediately lakeside of the French Quarter across North Rampart Street, Faubourg Tremé preserves foundational sites of African diasporic music, mutual-aid benevolent societies, brass-band second lines, and civil-rights activism. Congo Square inside Louis Armstrong Park was the historic gathering ground where enslaved and free people of African descent preserved West and Central African drumming, dance, and market traditions that shaped New Orleans jazz and rhythm. City sightseeing and walking tours visit the Armstrong Park / Basin Street Station edge respectful of active residential blocks.",
    accessAndTransitSummary:
      "Directly across North Rampart Street from the French Quarter; Basin St Station Visitor Information Center sits at 501 Basin St.",
    pickupAndArrivalNotes:
      "Hop-on hop-off buses, St. Louis Cemetery No. 1 regulated entry tours, and cultural walks stage at Basin St Station (501 Basin St) or 718 N. Rampart St.",
    weatherOrSeasonalAdvice:
      "Louis Armstrong Park gates operate on posted municipal daylight hours; Sunday afternoon drum circles in Congo Square are community cultural gatherings.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:treme-basin-st-station",
        name: "Basin St Station Visitor Center (501 Basin St)",
        facilityKind: "transit_station",
        latitude: 29.9593,
        longitude: -90.0715,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "1 block lakeside of N. Rampart St behind St. Louis Cemetery No. 1.",
        additionalTransferMinutesEachWay: 5,
      },
    ],
    officialLocalSources: [
      {
        label: "New Orleans & Company — Historic Tremé Neighborhood Guide",
        url: "https://www.neworleans.com/plan/neighborhoods/treme/",
        sourceKind: "official_dmo_tourism",
        checkedAt: VERIFIED_DATE,
      },
      {
        label: "National Park Service — New Orleans Jazz National Historical Park",
        url: "https://www.nps.gov/jazz/index.htm",
        sourceKind: "federal_or_state_agency",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:french-quarter",
        targetPublicSlug: "french-quarter",
        targetName: "French Quarter",
        targetPlaceType: "urban_neighborhood",
        relationship: "adjacent_neighborhood_or_riverfront",
        distanceOrTransitSummary: "Across North Rampart Street",
        geographicExplanation: "North Rampart Street separates the French Quarter from Louis Armstrong Park and Tremé.",
      },
    ],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- THREE DISTINCT WETLAND / SWAMP BASINS ---
  {
    placeId: "place:honey-island",
    publicPlaceSlug: "honey-island",
    hasPublicDirectoryPage: true,
    name: "Honey Island Swamp & Slidell (Pearl River Basin)",
    subRegionLabel: "Slidell · St. Tammany Parish (Northeast via I-10 Twin Span)",
    parishOrJurisdiction: "St. Tammany Parish",
    placeType: "bayou_or_wetland_corridor",
    neverAliasOrRedirectToSlugs: ["jean-lafitte", "manchac"],
    heroImage: "/images/portfolio/nola-covered-swamp-boat.webp",
    heroImageAlt: "Covered swamp tour boat gliding through cypress trees in Honey Island Swamp",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "A semi-wild riverine tupelo-cypress swamp northeast of Lake Pontchartrain along the West Pearl River in Slidell—completely distinct from Jean Lafitte / Barataria south of the city and Manchac to the northwest.",
    overview:
      "Located in St. Tammany Parish across the five-mile I-10 Twin Span Bridge over eastern Lake Pontchartrain, Honey Island Swamp sits between the East and West Pearl Rivers near the Mississippi state line. Much of the surrounding Pearl River Wildlife Management Area is protected river-bottom hardwood and bald-cypress wetland. Operators here—most notably Cajun Encounters on US-90 (Old Spanish Trail) and guided kayak outfitters—emphasize narrow shaded bayou channels, covered flat-bottomed swamp boats that welcome all ages, and coordinated motorcoach hotel shuttles from Downtown New Orleans.",
    accessAndTransitSummary:
      "Northeast of New Orleans via I-10 East across the Lake Pontchartrain Twin Span Bridge to Slidell (US-90 East / Old Spanish Trail). Do not rely on return Uber/Lyft from rural Hwy 90 boat launches.",
    pickupAndArrivalNotes:
      "Self-drive guests check in 30 minutes before launch at the operator's Slidell dock (e.g., 55345 US-90). Hotel shuttle riders board 75–90 minutes prior at designated French Quarter/Downtown commercial hotels.",
    weatherOrSeasonalAdvice:
      "Pearl River water levels fluctuate with upstream rainfall; covered boats provide overhead sun/light-rain shelter, though lightning pauses water operations.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:honey-island-us90-slidell",
        name: "US-90 West Pearl River Launch Corridor (55345 US-90, Slidell, LA 70461)",
        facilityKind: "harbor_ramp",
        latitude: 30.2335,
        longitude: -89.6624,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "Self-drive parking on US-90 East in Slidell or operator round-trip shuttle from New Orleans hotels.",
        additionalTransferMinutesEachWay: 45,
      },
    ],
    officialLocalSources: [
      {
        label: "Louisiana Department of Wildlife & Fisheries — Pearl River Wildlife Management Area",
        url: "https://www.wlf.louisiana.gov/page/pearl-river",
        sourceKind: "federal_or_state_agency",
        checkedAt: VERIFIED_DATE,
      },
      {
        label: "Visit The Northshore — Official St. Tammany Parish Honey Island Swamp Guide",
        url: "https://www.visitthenorthshore.com/",
        sourceKind: "official_dmo_tourism",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:jean-lafitte",
        targetPublicSlug: "jean-lafitte",
        targetName: "Jean Lafitte / Barataria Basin",
        targetPlaceType: "bayou_or_wetland_corridor",
        relationship: "separate_wetland_basin_do_not_conflate",
        distanceOrTransitSummary: "Opposite direction (~55–65 miles apart across metro New Orleans)",
        geographicExplanation: "Honey Island lies northeast of Lake Pontchartrain in Slidell; Jean Lafitte / Barataria lies south of the Mississippi River on the Westbank.",
      },
      {
        targetPlaceId: "place:manchac",
        targetPublicSlug: "manchac",
        targetName: "Manchac Swamp / LaPlace",
        targetPlaceType: "bayou_or_wetland_corridor",
        relationship: "separate_wetland_basin_do_not_conflate",
        distanceOrTransitSummary: "Opposite side of Lake Pontchartrain (~60 miles apart)",
        geographicExplanation: "Manchac sits northwest of New Orleans along the I-55 / I-10 isthmus between Lakes Pontchartrain and Maurepas.",
      },
    ],
    driveEstimateFromFrenchQuarter: {
      originLabel: "French Quarter / Canal Street",
      distanceMilesMin: 35,
      distanceMilesMax: 38,
      typicalMinutesMin: 35,
      typicalMinutesMax: 55,
      peakTrafficMinutesMax: 75,
      primaryRouteSummary: "I-10 East across the Lake Pontchartrain Twin Span Bridge -> Slidell Exit 261 / US-190 -> US-90 East",
      trafficQualificationNote:
        "Planning estimate only (not a guarantee): I-10 East high-rise bridge congestion, afternoon rush hour, or Twin Span wind/accident delays can push transfers to 60–75 minutes.",
      rideshareReturnAvailability: "none_rely_on_shuttle_or_car",
      isGuarantee: false,
      sourceCitation: {
        label: "Cajun Encounters Official Directions & LDWF Pearl River Access",
        url: "https://www.cajunencounters.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    },
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:jean-lafitte",
    publicPlaceSlug: "jean-lafitte",
    hasPublicDirectoryPage: true,
    name: "Jean Lafitte, Barataria Basin & Westbank Bayous",
    subRegionLabel: "Marrero, Lafitte & Luling · Jefferson & St. Charles Parishes (South / Westbank)",
    parishOrJurisdiction: "Jefferson Parish & adjacent St. Charles Parish Westbank",
    placeType: "bayou_or_wetland_corridor",
    neverAliasOrRedirectToSlugs: ["honey-island", "manchac"],
    heroImage: "/images/portfolio/jean-lafitte-bayou.webp",
    heroImageAlt: "Spanish moss and cypress bayou channels in the Jean Lafitte Barataria Basin",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "The closest coastal marsh, tidal bayou, and cypress wetland basin south and west of New Orleans across the Crescent City Connection—home to distinct private docks in Marrero, Lafitte, and Bayou Gauche / Luling.",
    overview:
      "South of the Mississippi River on the Westbank, the Barataria Basin and adjacent Bayou Gauche / Luling wetlands host the highest concentration of both high-speed airboats and covered swamp boats near New Orleans. Travelers must distinguish four separate physical addresses here: (1) the federal National Park Service Barataria Preserve Visitor Center & boardwalk trails at 6588 Barataria Blvd in Marrero (where motorized airboats are prohibited inside federal wilderness channels); (2) Jean Lafitte Swamp Tour's covered-boat dock at 6601 Leo Kerner Lafitte Pkwy in Marrero; (3) Louisiana Tour Company's dock at 9706 Barataria Blvd in Marrero; and (4) Airboat Adventures' private marsh dock further south at 5145 Fleming Park Rd in Lafitte—plus Ragin' Cajun Airboat Tours' completely separate Westbank facilities west along US-90 in Luling / Bayou Gauche (St. Charles Parish).",
    accessAndTransitSummary:
      "Cross the Mississippi River via US-90B (Crescent City Connection bridge) onto the Westbank Expressway, continuing south via Barataria Blvd (LA-45) / Leo Kerner Lafitte Pkwy for Marrero & Lafitte, or west via US-90 toward Luling.",
    pickupAndArrivalNotes:
      "Never enter 'Jean Lafitte Swamp' generically into GPS—use the exact street address on your operator's confirmation. Outbound Uber/Lyft from Downtown often reaches Marrero/Lafitte, but return pickups from rural Lafitte or Luling docks are unreliable; book the hotel shuttle option if you do not have a rental car.",
    weatherOrSeasonalAdvice:
      "Open-air airboats are exposed to wind, sun, and rain squalls and enforce a strict 5-year-old minimum age and no-pregnancy safety rule; covered pontoon boats offer shade and welcome all ages.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:lafitte-fleming-park-5145",
        name: "Airboat Adventures Dock (5145 Fleming Park Rd, Lafitte, LA 70067)",
        facilityKind: "harbor_ramp",
        latitude: 29.7405,
        longitude: -90.1238,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "26–29 miles south of Downtown via US-90B & LA-45 / Jean Lafitte Blvd; free on-site self-drive parking.",
        additionalTransferMinutesEachWay: 42,
      },
      {
        locationId: "mp:marrero-barataria-9706",
        name: "Louisiana Tour Company Dock (9706 Barataria Blvd, Marrero, LA 70072)",
        facilityKind: "harbor_ramp",
        latitude: 29.7768,
        longitude: -90.1112,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "22–25 miles south of the French Quarter along LA-45 in Crown Point / Marrero.",
        additionalTransferMinutesEachWay: 38,
      },
      {
        locationId: "mp:marrero-leo-kerner-6601",
        name: "Jean Lafitte Swamp Tour Dock (6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072)",
        facilityKind: "harbor_ramp",
        latitude: 29.8112,
        longitude: -90.0987,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "15–18 miles south of Downtown; distinct from the federal NPS Visitor Center at 6588 Barataria Blvd.",
        additionalTransferMinutesEachWay: 32,
      },
      {
        locationId: "mp:luling-us90-10090",
        name: "Ragin' Cajun Airboat & Covered Boat Docks (10090 US-90 & 1265 LA-3127, Luling, LA 70070)",
        facilityKind: "harbor_ramp",
        latitude: 29.8825,
        longitude: -90.3712,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "20–23 miles west on the Westbank via US-90 W in St. Charles Parish (separate from Lafitte / Barataria).",
        additionalTransferMinutesEachWay: 35,
      },
    ],
    officialLocalSources: [
      {
        label: "National Park Service — Jean Lafitte National Historical Park and Preserve (Barataria Preserve)",
        url: "https://www.nps.gov/jela/planyourvisit/barataria-preserve.htm",
        sourceKind: "federal_or_state_agency",
        checkedAt: VERIFIED_DATE,
      },
      {
        label: "Visit Jefferson Parish — Official Jean Lafitte & Barataria Basin Guide",
        url: "https://www.visitjeffersonparish.com/",
        sourceKind: "official_dmo_tourism",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:honey-island",
        targetPublicSlug: "honey-island",
        targetName: "Honey Island Swamp / Slidell",
        targetPlaceType: "bayou_or_wetland_corridor",
        relationship: "separate_wetland_basin_do_not_conflate",
        distanceOrTransitSummary: "Northeast of Lake Pontchartrain in Slidell (~55–65 mi away)",
        geographicExplanation: "Jean Lafitte / Barataria is south of the Mississippi River; Honey Island is northeast across Lake Pontchartrain.",
      },
      {
        targetPlaceId: "place:manchac",
        targetPublicSlug: "manchac",
        targetName: "Manchac Swamp / LaPlace",
        targetPlaceType: "bayou_or_wetland_corridor",
        relationship: "separate_wetland_basin_do_not_conflate",
        distanceOrTransitSummary: "Northwest in St. John the Baptist Parish (~40 mi away)",
        geographicExplanation: "Manchac borders Lake Maurepas off I-10 West / I-55 North.",
      },
    ],
    driveEstimateFromFrenchQuarter: {
      originLabel: "French Quarter / Port NOLA Terminals",
      distanceMilesMin: 16,
      distanceMilesMax: 29,
      typicalMinutesMin: 25,
      typicalMinutesMax: 55,
      peakTrafficMinutesMax: 75,
      primaryRouteSummary:
        "US-90B West (Crescent City Connection) -> Westbank Expy -> LA-45 / Barataria Blvd (Marrero & Lafitte) OR US-90 West (Luling)",
      trafficQualificationNote:
        "Planning estimate only (not a guarantee): Crescent City Connection bridge backups, Belle Chasse / Barataria drawbridges, and afternoon commuter traffic regularly add 15–25 minutes.",
      rideshareReturnAvailability: "limited_outbound_unreliable_return",
      isGuarantee: false,
      sourceCitation: {
        label: "NPS Barataria Preserve & Visit Jefferson Parish Directions",
        url: "https://www.nps.gov/jela/planyourvisit/directions.htm",
        sourceKind: "federal_or_state_agency",
        checkedAt: VERIFIED_DATE,
      },
    },
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:manchac",
    publicPlaceSlug: "manchac",
    hasPublicDirectoryPage: true,
    name: "Manchac Swamp & Frenier (LaPlace)",
    subRegionLabel: "LaPlace & Manchac Pass · St. John the Baptist Parish (Northwest via I-10 W)",
    parishOrJurisdiction: "St. John the Baptist Parish",
    placeType: "bayou_or_wetland_corridor",
    neverAliasOrRedirectToSlugs: ["honey-island", "jean-lafitte", "river-road"],
    heroImage: "/images/portfolio/bayou-alligator-tour.webp",
    heroImageAlt: "Cypress knees and still bayou waters in Manchac Swamp near LaPlace, Louisiana",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "A cypress-tupelo wetland isthmus between Lake Pontchartrain and Lake Maurepas northwest of New Orleans—conveniently positioned near the River Road corridor for half-day covered swamp boat and kayak outings.",
    overview:
      "Stretching across the historic Frenier shoreline and Manchac Pass between Lake Pontchartrain and Lake Maurepas, Manchac Swamp lies northwest of New Orleans past the Bonnet Carré Spillway along I-10 West and I-55 North. Operators here include Cajun Pride Swamp Tours on a private wildlife refuge off Frenier Road in LaPlace and guided paddling outfitters launching along Ruddock Canal / Manchac Pass. Because LaPlace sits right at the eastern gateway to St. John and St. James Parish River Road sites, Manchac is also the primary wetland basin paired with Oak Alley, Laura, or Whitney historical excursions.",
    accessAndTransitSummary:
      "Northwest from Downtown New Orleans via I-10 West across the Bonnet Carré Spillway bridge to Exit 209 (I-55 North / US-51 / Frenier Rd).",
    pickupAndArrivalNotes:
      "Self-drivers park free at 110 Frenier Rd (Cajun Pride) or designated Ruddock / Manchac kayak launches; return rideshares are virtually unavailable at rural Frenier / Ruddock ramps, so book shuttle-included options without a car.",
    weatherOrSeasonalAdvice:
      "Crossing the 11-mile Bonnet Carré Spillway elevated I-10 bridge can slow during heavy rain, fog, or holiday westbound traffic toward Baton Rouge.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:manchac-frenier-110",
        name: "Frenier Road Private Refuge Dock (110 Frenier Rd, LaPlace, LA 70068)",
        facilityKind: "harbor_ramp",
        latitude: 30.1046,
        longitude: -90.4278,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "Off US-51 / I-10 Exit 209 in LaPlace; free self-drive parking or scheduled New Orleans hotel shuttle.",
        additionalTransferMinutesEachWay: 42,
      },
      {
        locationId: "mp:manchac-ruddock-kayak",
        name: "Manchac / Ruddock Historic Canal Kayak Launch (US-51 off I-55 Exit 7)",
        facilityKind: "harbor_ramp",
        latitude: 30.1931,
        longitude: -90.4316,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "Guided kayak put-in beneath elevated I-55 corridor along Manchac Pass wetlands.",
        additionalTransferMinutesEachWay: 45,
      },
    ],
    officialLocalSources: [
      {
        label: "Louisiana Department of Wildlife & Fisheries — Joyce & Manchac Wildlife Management Areas",
        url: "https://www.wlf.louisiana.gov/page/manchac",
        sourceKind: "federal_or_state_agency",
        checkedAt: VERIFIED_DATE,
      },
      {
        label: "Louisiana's River Parishes Tourist Commission — Manchac & Frenier Corridor",
        url: "https://lariverparishes.com/",
        sourceKind: "official_dmo_tourism",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:river-road",
        targetPublicSlug: "river-road",
        targetName: "Great River Road Historic Sites Corridor",
        targetPlaceType: "river_road_heritage_corridor",
        relationship: "turnaround_transfer_link",
        distanceOrTransitSummary: "20–30 minutes west via US-51 / I-10 / Veterans Memorial Bridge (LA-3213)",
        geographicExplanation: "LaPlace and Manchac sit near the Veterans Memorial Bridge crossing to Wallace and Vacherie on West Bank LA-18.",
      },
      {
        targetPlaceId: "place:honey-island",
        targetPublicSlug: "honey-island",
        targetName: "Honey Island Swamp / Slidell",
        targetPlaceType: "bayou_or_wetland_corridor",
        relationship: "separate_wetland_basin_do_not_conflate",
        distanceOrTransitSummary: "Opposite side of Lake Pontchartrain (~60 mi east)",
        geographicExplanation: "Manchac is northwest of Lake Pontchartrain; Honey Island is northeast in Slidell.",
      },
    ],
    driveEstimateFromFrenchQuarter: {
      originLabel: "French Quarter / Downtown Hotels",
      distanceMilesMin: 30,
      distanceMilesMax: 38,
      typicalMinutesMin: 35,
      typicalMinutesMax: 55,
      peakTrafficMinutesMax: 80,
      primaryRouteSummary: "I-10 West past MSY Airport & Bonnet Carré Spillway -> Exit 209 (US-51 / I-55 North) -> Frenier Rd / Manchac",
      trafficQualificationNote:
        "Planning estimate only (not a guarantee): I-10 West airport merges and Bonnet Carré Spillway bridge incidents can extend one-way travel to 65–80 minutes.",
      rideshareReturnAvailability: "none_rely_on_shuttle_or_car",
      isGuarantee: false,
      sourceCitation: {
        label: "Cajun Pride Swamp Tours & River Parishes Official Directions",
        url: "https://www.cajunprideswamptours.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    },
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- RIVER ROAD CORRIDOR + 3 DISTINCT HISTORIC SITES / MUSEUMS ---
  {
    placeId: "place:river-road",
    publicPlaceSlug: "river-road",
    hasPublicDirectoryPage: true,
    name: "Great River Road Historic Sites & Slavery Museums",
    subRegionLabel: "Wallace & Vacherie (LA-18) · St. Charles, St. John the Baptist & St. James Parishes",
    parishOrJurisdiction: "Louisiana River Parishes (St. Charles, St. John the Baptist & St. James)",
    placeType: "river_road_heritage_corridor",
    neverAliasOrRedirectToSlugs: [
      "whitney-plantation",
      "oak-alley-plantation",
      "laura-plantation",
    ],
    heroImage: "/images/portfolio/whitney-plantation.webp",
    heroImageAlt: "Historic buildings along Louisiana's River Road corridor",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "A 45-to-80-minute upriver historical corridor along LA-18 and LA-44 where independent museums and preserved sugar estates document the lives of enslaved people and Creole/antebellum history.",
    overview:
      "Upstream from New Orleans along both banks of the Mississippi River, the Great River Road (LA-18 on the West Bank, LA-44 on the East Bank) was one of the wealthiest and most brutal slaveholding sugar- and indigo-producing regions in North America. Welcome to New Orleans Tours treats these sites as serious historical museums and memorial landscapes—never as generic entertainment. Crucially, historic sites such as Whitney Plantation, Oak Alley Plantation, and Laura Plantation are independent museums/foundations that conduct on-site historical interpretation; round-trip buses and minibuses from New Orleans are operated separately by licensed transportation companies (such as Gray Line New Orleans, Cajun Encounters, and Southern Style Tours).",
    accessAndTransitSummary:
      "45–80 minutes each way from Downtown New Orleans via I-10 West to I-310 South (Hale Boggs Bridge) -> LA-3127 -> LA-18 West (River Road) for Wallace and Vacherie.",
    pickupAndArrivalNotes:
      "There is NO reliable Uber or Lyft service for return trips from Wallace or Vacherie (LA-18). Visitors without a rental car should book a round-trip motorcoach or hotel-pickup minibus excursion that bundles site admission.",
    weatherOrSeasonalAdvice:
      "Site tours involve 60–90 minutes of outdoor walking across gravel, grass, and historic stairs in open Louisiana heat or rain; carry water, sun protection, and respectful attire.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:river-road-la18-wallace-vacherie",
        name: "LA-18 West Bank Heritage Corridor (Wallace to Vacherie, LA)",
        facilityKind: "venue_check_in",
        latitude: 30.0052,
        longitude: -90.6928,
        precisionTier: "terminal_or_facility",
        transitOrWalkNotes: "Connects Whitney Plantation (5099 LA-18), Laura Plantation (2247 LA-18), and Oak Alley Plantation (3645 LA-18).",
        additionalTransferMinutesEachWay: 65,
      },
    ],
    officialLocalSources: [
      {
        label: "Louisiana's River Parishes Tourist Commission — Historic River Road Overview",
        url: "https://lariverparishes.com/",
        sourceKind: "official_dmo_tourism",
        checkedAt: VERIFIED_DATE,
      },
      {
        label: "Whitney Plantation Museum — History & Educational Mission",
        url: "https://www.whitneyplantation.org/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:whitney-plantation",
        targetPublicSlug: "whitney-plantation",
        targetName: "Whitney Plantation Museum",
        targetPlaceType: "historic_site_or_museum",
        relationship: "historic_site_within_river_road_corridor",
        distanceOrTransitSummary: "5099 LA-18, Wallace, LA (~50–70 min from French Quarter)",
        geographicExplanation: "Non-profit museum dedicated exclusively to the history of slavery and the enslaved people of Louisiana.",
      },
      {
        targetPlaceId: "place:laura-plantation",
        targetPublicSlug: "laura-plantation",
        targetName: "Laura Plantation (Creole Heritage Site)",
        targetPlaceType: "historic_site_or_museum",
        relationship: "historic_site_within_river_road_corridor",
        distanceOrTransitSummary: "2247 LA-18, Vacherie, LA (~55–75 min from French Quarter)",
        geographicExplanation: "1805 Creole sugar estate interpreting four generations of free and enslaved women, men, and children.",
      },
      {
        targetPlaceId: "place:oak-alley-plantation",
        targetPublicSlug: "oak-alley-plantation",
        targetName: "Oak Alley Plantation (National Historic Landmark)",
        targetPlaceType: "historic_site_or_museum",
        relationship: "historic_site_within_river_road_corridor",
        distanceOrTransitSummary: "3645 LA-18, Vacherie, LA (~60–80 min from French Quarter)",
        geographicExplanation: "501(c)(3) National Historic Landmark interpreting both its antebellum Big House/live-oak landscape and the Slavery at Oak Alley quarters exhibit.",
      },
    ],
    driveEstimateFromFrenchQuarter: {
      originLabel: "French Quarter / Downtown New Orleans",
      distanceMilesMin: 46,
      distanceMilesMax: 60,
      typicalMinutesMin: 50,
      typicalMinutesMax: 80,
      peakTrafficMinutesMax: 105,
      primaryRouteSummary: "I-10 West -> Exit 220 (I-310 South across Hale Boggs Bridge) -> Exit 6 (LA-3127 North) -> LA-18 (Great River Road)",
      trafficQualificationNote:
        "Planning estimate only (not a guarantee): I-10 West airport traffic, Spillway or Hale Boggs Bridge construction, and two-lane LA-18 agricultural crossings can extend one-way travel to 85–105 minutes.",
      rideshareReturnAvailability: "none_rely_on_shuttle_or_car",
      isGuarantee: false,
      sourceCitation: {
        label: "Louisiana's River Parishes & Whitney/Oak Alley Official Directions",
        url: "https://www.whitneyplantation.org/plan-your-visit/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    },
    historicSiteGovernance: {
      legalEntityName: "Great River Road Independent Museums & Historic Foundations",
      taxOrHeritageDesignation: "Louisiana Great River Road National Scenic Byway & National Register Historic Sites",
      physicalStreetAddress: "LA-18 & LA-44 Corridor, Wallace & Vacherie, LA",
      officialSiteWebsite: "https://lariverparishes.com/",
      officialSitePhone: "(985) 359-2562",
      enslavementHistorySummary:
        "River Road sugar and indigo estates operated through chattel slavery from the French and Spanish colonial eras through 1865. Visitors should choose among Whitney, Laura, and Oak Alley based on historical focus—with Whitney Plantation dedicated exclusively to the lives, labor, resistance, and memorials of enslaved people.",
      publicFramingPolicy: "historical_and_enslavement_education",
      isTransportationTourOperator: false,
    },
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:whitney-plantation",
    publicPlaceSlug: "whitney-plantation",
    hasPublicDirectoryPage: true,
    name: "Whitney Plantation Museum",
    subRegionLabel: "5099 LA-18, Wallace · St. John the Baptist Parish",
    parishOrJurisdiction: "St. John the Baptist Parish",
    placeType: "historic_site_or_museum",
    neverAliasOrRedirectToSlugs: ["river-road", "oak-alley-plantation", "laura-plantation"],
    heroImage: "/images/portfolio/whitney-plantation.webp",
    heroImageAlt: "Historic church and memorial grounds at Whitney Plantation in Wallace, Louisiana",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "A 501(c)(3) non-profit museum dedicated exclusively to understanding the history of slavery in Louisiana (1752–1865) through the first-person perspectives and memorials of the people enslaved here.",
    overview:
      "Located on the West Bank of the Mississippi River in Wallace, Louisiana (formerly Habitation Haydel, established in 1752), Whitney Plantation opened in 2014 as the only plantation museum in Louisiana with an exclusive focus on slavery. Operated by The Whitney Institute 501(c)(3), the 90-minute self-guided audio tour and scheduled guided walks lead visitors through original French Creole slave cabins, the 1790 Spanish Creole Big House, Antioch Baptist Church, the Wall of Honor, the Field of Angels memorial to enslaved children, and exhibits on the 1811 German Coast Uprising. Whitney Plantation is a museum entity—not a New Orleans bus operator—so visitors without a car book licensed round-trip transportation from New Orleans that includes museum admission.",
    accessAndTransitSummary:
      "46–50 miles west of Downtown New Orleans via I-10 W -> I-310 S -> LA-3127 -> LA-18 in Wallace, LA.",
    pickupAndArrivalNotes:
      "Whitney Plantation is closed on Tuesdays (verify seasonal holiday schedules on whitneyplantation.org). Zero return Uber/Lyft coverage exists in rural Wallace—use a rental car or round-trip New Orleans shuttle excursion.",
    weatherOrSeasonalAdvice:
      "Almost the entire museum route is outdoors across open memorials and gravel paths; bring water, sun protection, and allow emotional and historical reflection time.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:whitney-visitor-center-5099",
        name: "Whitney Plantation Visitor Center (5099 LA-18, Wallace, LA 70049)",
        facilityKind: "venue_check_in",
        latitude: 30.0419,
        longitude: -90.6461,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "On-site museum check-in for audio/guided tours; motorcoach parking lot for Gray Line, Cajun Encounters, and Southern Style excursions.",
        additionalTransferMinutesEachWay: 60,
      },
    ],
    officialLocalSources: [
      {
        label: "Whitney Plantation Official Museum Website (The Whitney Institute)",
        url: "https://www.whitneyplantation.org/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
      {
        label: "National Park Service — Habitation Haydel (Whitney Plantation) National Register Record",
        url: "https://www.whitneyplantation.org/history/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:river-road",
        targetPublicSlug: "river-road",
        targetName: "Great River Road Corridor",
        targetPlaceType: "river_road_heritage_corridor",
        relationship: "historic_site_within_river_road_corridor",
        distanceOrTransitSummary: "Easternmost of the three major West Bank LA-18 museums",
        geographicExplanation: "Located in Wallace, ~8 minutes east of Laura Plantation and ~14 minutes east of Oak Alley along LA-18.",
      },
    ],
    driveEstimateFromFrenchQuarter: {
      originLabel: "French Quarter / Downtown New Orleans",
      distanceMilesMin: 46,
      distanceMilesMax: 50,
      typicalMinutesMin: 50,
      typicalMinutesMax: 70,
      peakTrafficMinutesMax: 95,
      primaryRouteSummary: "I-10 West -> Exit 220 (I-310 South) -> Exit 6 (LA-3127 North) -> Right onto LA-3213 -> Left onto LA-18 to 5099 LA-18",
      trafficQualificationNote:
        "Planning estimate only (not a guarantee): traffic on I-10 West past MSY Airport and the Bonnet Carré Spillway frequently adds 15–25 minutes.",
      rideshareReturnAvailability: "none_rely_on_shuttle_or_car",
      isGuarantee: false,
      sourceCitation: {
        label: "Whitney Plantation — Plan Your Visit & Directions",
        url: "https://www.whitneyplantation.org/plan-your-visit/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    },
    historicSiteGovernance: {
      legalEntityName: "The Whitney Institute (Whitney Plantation)",
      taxOrHeritageDesignation: "501(c)(3) Non-Profit Museum · National Register of Historic Places",
      physicalStreetAddress: "5099 LA-18, Wallace, LA 70049",
      officialSiteWebsite: "https://www.whitneyplantation.org/",
      officialSitePhone: "(225) 265-3300",
      enslavementHistorySummary:
        "Dedicated exclusively to the history and legacies of slavery in Louisiana from 1752 to 1865, preserving WPA Federal Writers' Project first-person narratives, original slave cabins, and memorials naming the people enslaved on the Haydel sugar, indigo, and rice estate.",
      publicFramingPolicy: "historical_and_enslavement_education",
      isTransportationTourOperator: false,
    },
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:oak-alley-plantation",
    publicPlaceSlug: "oak-alley-plantation",
    hasPublicDirectoryPage: true,
    name: "Oak Alley Plantation (Historic Landmark & Foundation)",
    subRegionLabel: "3645 LA-18, Vacherie · St. James Parish",
    parishOrJurisdiction: "St. James Parish",
    placeType: "historic_site_or_museum",
    neverAliasOrRedirectToSlugs: ["river-road", "whitney-plantation", "laura-plantation"],
    heroImage: "/images/portfolio/destrehan-plantation.webp",
    heroImageAlt: "Live oak canopy along Louisiana's historic River Road",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "A 501(c)(3) National Historic Landmark in Vacherie known for its double row of 28 centuries-old live oaks, 1839 Greek Revival Big House, and reconstructed Slavery at Oak Alley exhibit.",
    overview:
      "Situated on LA-18 in Vacherie (St. James Parish) and stewarded by the non-profit Oak Alley Foundation since 1976, Oak Alley encompasses a 25-acre historic complex on a former 19th-century sugarcane plantation established by Jacques Telesphore Roman. Visitors explore the quarter-mile canopy of 28 southern live oaks, guided interpretation inside the Big House, the Sugarcane Theatre, and the permanent 'Slavery at Oak Alley' exhibit housed in six reconstructed slave cabins documenting the names, medical care, daily labor, and post-Emancipation lives of the more than 200 individuals enslaved on the estate—including Antoine, the enslaved horticulturist who successfully grafted the Centennial pecan. Oak Alley Foundation is a historic site entity, not a bus company; round-trip excursions from New Orleans are run by licensed tour operators.",
    accessAndTransitSummary:
      "55–60 miles west of Downtown New Orleans via I-10 W -> I-310 S -> LA-3127 N -> LA-18 in Vacherie, LA.",
    pickupAndArrivalNotes:
      "Self-drivers purchase timed Big House & grounds admission directly; travelers without a car should reserve a round-trip motorcoach or hotel-pickup tour from New Orleans because return rideshares do not serve Vacherie.",
    weatherOrSeasonalAdvice:
      "Walking between the West Gate, Slavery at Oak Alley cabins, Big House, and river levee spans spacious outdoor grounds—allow at least 2 to 2.5 hours on site.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:oak-alley-ticket-gate-3645",
        name: "Oak Alley Plantation Ticket Entrance (3645 LA-18, Vacherie, LA 70090)",
        facilityKind: "venue_check_in",
        latitude: 30.0042,
        longitude: -90.7762,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "Dedicated bus drop-off and visitor parking off LA-18 / LA-3127 connector in Vacherie.",
        additionalTransferMinutesEachWay: 70,
      },
    ],
    officialLocalSources: [
      {
        label: "Oak Alley Foundation — Official Historic Site & Slavery Database",
        url: "https://www.oakalleyplantation.org/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:laura-plantation",
        targetPublicSlug: "laura-plantation",
        targetName: "Laura Plantation",
        targetPlaceType: "historic_site_or_museum",
        relationship: "historic_site_within_river_road_corridor",
        distanceOrTransitSummary: "3.8 miles east along LA-18 (~6 minutes by vehicle)",
        geographicExplanation: "Oak Alley and Laura sit minutes apart in Vacherie, offering contrasting Anglo-American Greek Revival vs. French Creole historical lenses.",
      },
      {
        targetPlaceId: "place:whitney-plantation",
        targetPublicSlug: "whitney-plantation",
        targetName: "Whitney Plantation Museum",
        targetPlaceType: "historic_site_or_museum",
        relationship: "historic_site_within_river_road_corridor",
        distanceOrTransitSummary: "9.5 miles east along LA-18 (~14 minutes by vehicle)",
        geographicExplanation: "Frequently paired on full-day two-site historical excursions from New Orleans.",
      },
    ],
    driveEstimateFromFrenchQuarter: {
      originLabel: "French Quarter / Downtown New Orleans",
      distanceMilesMin: 55,
      distanceMilesMax: 60,
      typicalMinutesMin: 60,
      typicalMinutesMax: 80,
      peakTrafficMinutesMax: 105,
      primaryRouteSummary: "I-10 West -> Exit 220 (I-310 South) -> Exit 6 (LA-3127 North ~21 mi) -> Right on LA-20 -> Left on LA-18 to 3645 LA-18",
      trafficQualificationNote:
        "Planning estimate only (not a guarantee): allow 70–95+ minutes during weekday afternoon I-10 return traffic or inclement weather on the Spillway and Hale Boggs bridges.",
      rideshareReturnAvailability: "none_rely_on_shuttle_or_car",
      isGuarantee: false,
      sourceCitation: {
        label: "Oak Alley Foundation — Hours, Location & Directions",
        url: "https://www.oakalleyplantation.org/plan-your-visit",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    },
    historicSiteGovernance: {
      legalEntityName: "Oak Alley Foundation",
      taxOrHeritageDesignation: "501(c)(3) Non-Profit Trust · National Historic Landmark",
      physicalStreetAddress: "3645 LA-18, Vacherie, LA 70090",
      officialSiteWebsite: "https://www.oakalleyplantation.org/",
      officialSitePhone: "(225) 265-2151",
      enslavementHistorySummary:
        "Maintains the permanent Slavery at Oak Alley exhibit in six reconstructed quarters and a public Slavery Database documenting over 200 enslaved women, men, and children whose forced labor built and sustained the Roman sugar estate.",
      publicFramingPolicy: "historical_and_enslavement_education",
      isTransportationTourOperator: false,
    },
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:laura-plantation",
    publicPlaceSlug: "laura-plantation",
    hasPublicDirectoryPage: true,
    name: "Laura Plantation (Louisiana's Creole Heritage Site)",
    subRegionLabel: "2247 LA-18, Vacherie · St. James Parish",
    parishOrJurisdiction: "St. James Parish",
    placeType: "historic_site_or_museum",
    neverAliasOrRedirectToSlugs: ["river-road", "whitney-plantation", "oak-alley-plantation"],
    heroImage: "/images/portfolio/laura-plantation.webp",
    heroImageAlt: "Raised colorful French Creole manor house at Laura Plantation in Vacherie, Louisiana",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "An 1805 French Creole sugar estate preserving 12 National Register structures—including original 1840s slave cabins—and biography-driven guided tours grounded in archival records.",
    overview:
      "Established in 1805 as Habitation Duparc on LA-18 in Vacherie, Laura Plantation stands apart from Anglo-American Greek Revival mansions through its raised briquette-entre-poteaux French Creole architecture and 5,000+ pages of French and U.S. National Archives documentation, alongside Laura Locoul Gore's memoir. Docent-led guided walks cover the Maison Principale, kitchen gardens, original 1840s double slave cabins where West African 'Compair Lapin' (Br'er Rabbit) folktales were recorded in the 1870s, and the permanent exhibit 'From the Big House to the Quarters: Slavery on Laura Plantation' detailing the biographies of enslaved Senegambian, Congolese, and Creole families. Laura Plantation operates on-site guided museum tours only—round-trip New Orleans transport is provided by licensed bus operators.",
    accessAndTransitSummary:
      "50–53 miles west of Downtown New Orleans via I-10 W -> I-310 S -> LA-3127 N -> LA-18 in Vacherie, LA.",
    pickupAndArrivalNotes:
      "Entry to the historic buildings is by scheduled guided tour only; no return Uber/Lyft exists in Vacherie, so visitors without a car should book an attributed New Orleans shuttle package.",
    weatherOrSeasonalAdvice:
      "Guided tours walk outdoors between the visitor center, Big House, gardens, and 1840s quarters and climb historic stairs.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:laura-visitor-center-2247",
        name: "Laura Plantation Visitor Center (2247 LA-18, Vacherie, LA 70090)",
        facilityKind: "venue_check_in",
        latitude: 30.0086,
        longitude: -90.7254,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "On-site check-in and exhibit hall on LA-18 between Wallace and Oak Alley.",
        additionalTransferMinutesEachWay: 65,
      },
    ],
    officialLocalSources: [
      {
        label: "Laura Plantation — Official Creole Heritage Site & Slavery Exhibit",
        url: "https://www.lauraplantation.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:oak-alley-plantation",
        targetPublicSlug: "oak-alley-plantation",
        targetName: "Oak Alley Plantation",
        targetPlaceType: "historic_site_or_museum",
        relationship: "historic_site_within_river_road_corridor",
        distanceOrTransitSummary: "3.8 miles west along LA-18 (~6 min drive)",
        geographicExplanation: "Located along the same Vacherie stretch of LA-18.",
      },
    ],
    driveEstimateFromFrenchQuarter: {
      originLabel: "French Quarter / Downtown New Orleans",
      distanceMilesMin: 50,
      distanceMilesMax: 53,
      typicalMinutesMin: 55,
      typicalMinutesMax: 75,
      peakTrafficMinutesMax: 100,
      primaryRouteSummary: "I-10 West -> Exit 220 (I-310 South) -> Exit 6 (LA-3127 North) -> Veterans Memorial Bridge connector / LA-18 to 2247 LA-18",
      trafficQualificationNote:
        "Planning estimate only (not a guarantee): allow extra margin for I-10 West airport/Spillway slowdowns and timed guided-tour start windows.",
      rideshareReturnAvailability: "none_rely_on_shuttle_or_car",
      isGuarantee: false,
      sourceCitation: {
        label: "Laura Plantation — Directions & Hours",
        url: "https://www.lauraplantation.com/plan-your-visit/directions",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    },
    historicSiteGovernance: {
      legalEntityName: "Laura: A Creole Plantation",
      taxOrHeritageDesignation: "Louisiana's Official Creole Heritage Site · 12 National Register Buildings",
      physicalStreetAddress: "2247 LA-18, Vacherie, LA 70090",
      officialSiteWebsite: "https://www.lauraplantation.com/",
      officialSitePhone: "(225) 265-7690",
      enslavementHistorySummary:
        "Preserves original 1840s slave cabins and the 'From the Big House to the Quarters: Slavery on Laura Plantation' exhibit interpreting four generations of named enslaved Creole and West African individuals and the oral tradition of Compair Lapin.",
      publicFramingPolicy: "historical_and_enslavement_education",
      isTransportationTourOperator: false,
    },
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- TWO SEPARATE PORT NOLA CRUISE TERMINALS + MSY AIRPORT ---
  {
    placeId: "place:erato-street-cruise-terminal",
    publicPlaceSlug: "erato-street-cruise-terminal",
    hasPublicDirectoryPage: true,
    name: "Erato Street Cruise Terminal (Port NOLA)",
    subRegionLabel: "1100 Port of New Orleans Place · Carnival Homeport",
    parishOrJurisdiction: "Port of New Orleans (Orleans Parish)",
    placeType: "cruise_turnaround_terminal",
    neverAliasOrRedirectToSlugs: ["julia-street-cruise-terminal", "mississippi-riverfront"],
    heroImage: "/images/portfolio/riverboat-city-of-nola.webp",
    heroImageAlt: "Mississippi Riverfront upriver approach near Port of New Orleans",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Port NOLA's Carnival Cruise Line terminal at 1100 Port of New Orleans Place with an attached 4-story rooftop parking garage—distinct in address, parking, and traffic entry from Julia Street Cruise Terminal next door.",
    overview:
      "Operated by the Port of New Orleans (Port NOLA) at 1100 Port of New Orleans Place, Erato Street Cruise Terminal serves year-round Carnival Cruise Line Western Caribbean and Bahamas sailings. Unlike Julia Street Terminal downriver, Erato features an integrated 1,000+ space covered parking garage directly above the check-in and luggage-drop levels. Turnaround-day excursion planning requires strict attention to luggage: swamp airboats, walking tours, and standard hotel shuttles cannot hold full-size suitcases, so embarkation/debarkation travelers must either drop bags with Erato porters (typically opening ~10:00 AM on sailing days), use hotel bell storage, or book a motorcoach post-cruise city/airport transfer.",
    accessAndTransitSummary:
      "5–12 minutes by taxi/rideshare from French Quarter and Downtown hotels; indoor pedestrian connection via the Outlet Collection at Riverwalk / Hilton New Orleans Riverside.",
    pickupAndArrivalNotes:
      "Port NOLA enforces a strict one-way vehicle entry loop: from I-10 take Exit 234A (US-90B W / Pontchartrain Expy) -> Exit 11C (Tchoupitoulas / South Peters) -> Right on Tchoupitoulas -> Left on Henderson St -> Left onto Port of New Orleans Place. Allow a minimum 2-hour buffer before your ship's final boarding cutoff.",
    weatherOrSeasonalAdvice:
      "Turnaround mornings (8:00 AM–12:30 PM) create heavy taxi/porter queues along Port of New Orleans Place; Saints Sunday home games and Convention Center expos add 15–25 minutes.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:port-nola-erato-1100",
        name: "Erato Street Cruise Terminal Drop-Off & Porter Curb (1100 Port of New Orleans Place)",
        facilityKind: "terminal_gate",
        latitude: 29.9389,
        longitude: -90.0612,
        precisionTier: "terminal_or_facility",
        transitOrWalkNotes: "Enter exclusively via Tchoupitoulas St -> Henderson St -> Port of New Orleans Place.",
        additionalTransferMinutesEachWay: 12,
      },
    ],
    officialLocalSources: [
      {
        label: "Port of New Orleans (Port NOLA) — Official Cruise Parking & Terminal Directions",
        url: "https://portnola.com/cruise/parking-and-directions",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:julia-street-cruise-terminal",
        targetPublicSlug: "julia-street-cruise-terminal",
        targetName: "Julia Street Cruise Terminal",
        targetPlaceType: "cruise_turnaround_terminal",
        relationship: "separate_cruise_terminal_do_not_conflate",
        distanceOrTransitSummary: "Adjacent upriver/downriver complex (920 vs. 1100 Port of New Orleans Place)",
        geographicExplanation: "Erato (1100 Port of New Orleans Place) serves Carnival with an attached rooftop garage; Julia (920 Port of New Orleans Place) serves NCL & Royal Caribbean and parks off-site at 100 Poydras Garage.",
      },
      {
        targetPlaceId: "place:msy-airport-corridor",
        targetPublicSlug: "msy-airport-corridor",
        targetName: "Louis Armstrong International Airport (MSY)",
        targetPlaceType: "airport_transfer_corridor",
        relationship: "turnaround_transfer_link",
        distanceOrTransitSummary: "15 miles west via US-90B & I-10 W (25–45 min typical)",
        geographicExplanation: "Allow at least 2.5 hours between tour completion, baggage claim, and domestic MSY flight departure.",
      },
    ],
    driveEstimateFromFrenchQuarter: null,
    cruiseTerminalLogistics: {
      terminalCode: "erato_street",
      streetAddress: "1100 Port of New Orleans Place, New Orleans, LA 70130",
      primaryCruiseLines: ["Carnival Cruise Line"],
      officialParkingFacility: "Erato Street Cruise Terminal Attached 4-Story Garage (1100 Port of New Orleans Place)",
      parkingNotes:
        "Covered drive-in garage directly atop the terminal with elevator access to check-in; standard height clearance ~7'6\" (oversized clearance ~8'4\" on Level 1).",
      dropOffRoutingNotes:
        "Mandatory Port NOLA loop: Tchoupitoulas St -> Left on Henderson St -> Left on Port of New Orleans Place.",
      luggageStorageNotes:
        "Cruise porters accept tagged embarkation bags on sailing mornings; debarking passengers with afternoon MSY flights should use hotel bell storage, Advance Check-In luggage services, or motorcoach transfers before joining any tour.",
    },
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:julia-street-cruise-terminal",
    publicPlaceSlug: "julia-street-cruise-terminal",
    hasPublicDirectoryPage: true,
    name: "Julia Street Cruise Terminal (Port NOLA)",
    subRegionLabel: "920 Port of New Orleans Place · Norwegian & Royal Caribbean Homeport",
    parishOrJurisdiction: "Port of New Orleans (Orleans Parish)",
    placeType: "cruise_turnaround_terminal",
    neverAliasOrRedirectToSlugs: ["erato-street-cruise-terminal", "mississippi-riverfront"],
    heroImage: "/images/portfolio/riverboat-city-of-nola.webp",
    heroImageAlt: "Port of New Orleans riverfront near Julia Street and Riverwalk",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Port NOLA's Norwegian Cruise Line and Royal Caribbean terminal at 920 Port of New Orleans Place adjoining the Riverwalk—with official cruise parking at 100 Poydras Garage rather than an on-top garage.",
    overview:
      "Located at 920 Port of New Orleans Place directly connected to The Outlet Collection at Riverwalk, Julia Street Cruise Terminal serves Norwegian Cruise Line, Royal Caribbean International, and select luxury/river vessels. Travelers driving in must note Port NOLA's current parking structure: unlike Erato Street Terminal, Julia Street Terminal does not have a rooftop garage, and the legacy Hilton 'Whale Lot' is retired from cruise parking—official Port NOLA parking for Julia Street sailings operates at the 100 Poydras Garage (100 Poydras St) with complimentary cruise shuttle service (drop luggage with porters first or follow Port NOLA's posted Poydras shuttle instructions).",
    accessAndTransitSummary:
      "Walkable from Canal Street / Hilton Riverside through the Riverwalk mall, or 5–10 minutes by taxi/rideshare from French Quarter and Warehouse District hotels.",
    pickupAndArrivalNotes:
      "Verify whether your ship docks at Julia Street (920 Port of New Orleans Place) or Erato Street (1100 Port of New Orleans Place) before ordering a taxi or booking parking. Store all suitcases before joining French Quarter walks, riverboats, or swamp shuttles.",
    weatherOrSeasonalAdvice:
      "Dual-ship Sunday turnaround mornings generate heavy congestion at Convention Center Blvd, Julia St, and Poydras St between 8:00 AM and 1:00 PM.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:port-nola-julia-920",
        name: "Julia Street Cruise Terminal Curb & Riverwalk Concourse (920 Port of New Orleans Place)",
        facilityKind: "terminal_gate",
        latitude: 29.9429,
        longitude: -90.0619,
        precisionTier: "terminal_or_facility",
        transitOrWalkNotes: "Adjoins The Outlet Collection at Riverwalk and Ernest N. Morial Convention Center Hall A.",
        additionalTransferMinutesEachWay: 10,
      },
      {
        locationId: "mp:port-nola-100-poydras-garage",
        name: "Port NOLA Julia St Official Off-Site Parking — 100 Poydras Garage (100 Poydras St)",
        facilityKind: "transit_station",
        latitude: 29.9486,
        longitude: -90.0647,
        precisionTier: "exact_entrance_or_berth",
        transitOrWalkNotes: "Official Port NOLA shuttle-served garage for Julia Street Cruise Terminal (replaces retired Whale Lot).",
        additionalTransferMinutesEachWay: 12,
      },
    ],
    officialLocalSources: [
      {
        label: "Port of New Orleans (Port NOLA) — Julia Street Cruise Terminal & 100 Poydras Parking",
        url: "https://portnola.com/cruise/parking-and-directions",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:erato-street-cruise-terminal",
        targetPublicSlug: "erato-street-cruise-terminal",
        targetName: "Erato Street Cruise Terminal",
        targetPlaceType: "cruise_turnaround_terminal",
        relationship: "separate_cruise_terminal_do_not_conflate",
        distanceOrTransitSummary: "Adjacent upriver complex at 1100 Port of New Orleans Place",
        geographicExplanation: "Julia serves NCL & Royal Caribbean (parking at 100 Poydras Garage); Erato serves Carnival (rooftop garage on site).",
      },
      {
        targetPlaceId: "place:mississippi-riverfront",
        targetPublicSlug: "mississippi-riverfront",
        targetName: "Toulouse & St. Louis Street Riverboat Wharves",
        targetPlaceType: "riverfront_wharf_or_dock",
        relationship: "turnaround_transfer_link",
        distanceOrTransitSummary: "0.9 miles downriver along the Riverwalk / Woldenberg Park",
        geographicExplanation: "Steamboat NATCHEZ and Riverboat CITY of NEW ORLEANS board downriver in the French Quarter—never at Julia Street Cruise Terminal.",
      },
    ],
    driveEstimateFromFrenchQuarter: null,
    cruiseTerminalLogistics: {
      terminalCode: "julia_street",
      streetAddress: "920 Port of New Orleans Place, New Orleans, LA 70130",
      primaryCruiseLines: ["Norwegian Cruise Line", "Royal Caribbean International"],
      officialParkingFacility: "100 Poydras Garage (100 Poydras St, New Orleans, LA 70130) with Port NOLA Cruise Shuttle",
      parkingNotes:
        "Official Port NOLA parking for Julia Street is at 100 Poydras Garage; the legacy Hilton Whale Lot is permanently retired from cruise parking.",
      dropOffRoutingNotes:
        "Follow Port NOLA directional signage via Tchoupitoulas St -> Henderson St -> Port of New Orleans Place for terminal curb luggage drop.",
      luggageStorageNotes:
        "Never bring full-size cruise suitcases to French Quarter walking tours or swamp docks; store bags first with porters, hotel bell desks, or luggage storage.",
    },
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeId: "place:msy-airport-corridor",
    publicPlaceSlug: "msy-airport-corridor",
    hasPublicDirectoryPage: true,
    name: "Louis Armstrong New Orleans International Airport (MSY) Corridor",
    subRegionLabel: "1 Terminal Dr, Kenner · Jefferson Parish (I-10 West Exit 221)",
    parishOrJurisdiction: "Jefferson Parish (City of Kenner / Aviation Board)",
    placeType: "airport_transfer_corridor",
    neverAliasOrRedirectToSlugs: ["french-quarter", "erato-street-cruise-terminal", "julia-street-cruise-terminal"],
    heroImage: "/images/portfolio/dcc-hero-corridor.webp",
    heroImageAlt: "New Orleans regional highway and river transit corridor",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "The North Terminal air gateway at 1 Terminal Drive in Kenner—14–16 miles west of the French Quarter and Port NOLA along I-10, shaping arrival-day and post-cruise departure tour cutoffs.",
    overview:
      "Opened in its consolidated North Terminal facility off I-10 Exit 221 (Loyola Drive) in Kenner, Louis Armstrong New Orleans International Airport (MSY) sits directly between Downtown New Orleans to the east and the Manchac / River Road corridors to the west. Because rental-car return shuttles operate from the South Campus (~10–15 minutes by airport shuttle bus from the North Terminal) and I-10 East/West experiences frequent Metairie and Causeway bottlenecks, travelers flying out on debarkation day should only book morning excursions if their domestic flight departs at 3:30 PM or later (5:00 PM+ for full swamp or River Road outings).",
    accessAndTransitSummary:
      "14–16 miles west of the French Quarter and Port NOLA via I-10 West to Exit 221 (Loyola Dr / Terminal Dr); flat-rate regulated taxis, rideshare pickup zones, and RTA E2 Airport Express bus.",
    pickupAndArrivalNotes:
      "Tour operators do not pick up at MSY terminal curbs unless explicitly booked on a dedicated post-cruise city + airport drop-off coach; transfer to your Downtown hotel or luggage storage first.",
    weatherOrSeasonalAdvice:
      "Monday post-festival mornings (Jazz Fest, Mardi Gras, Super Bowl/ Sugar Bowl) and Sunday cruise debarkation waves create longer TSA lines—add 30 extra minutes.",
    meetingAndAccessPoints: [
      {
        locationId: "mp:msy-north-terminal-1",
        name: "MSY North Terminal Departures & Ground Transportation (1 Terminal Dr, Kenner, LA 70062)",
        facilityKind: "transit_station",
        latitude: 29.9934,
        longitude: -90.2580,
        precisionTier: "terminal_or_facility",
        transitOrWalkNotes: "Level 1 Ground Transportation for taxis, shuttles, and rideshare; Rental Car Center requires shuttle to South Campus.",
        additionalTransferMinutesEachWay: 30,
      },
    ],
    officialLocalSources: [
      {
        label: "FlyMSY — Louis Armstrong New Orleans International Airport Ground Transportation & Parking",
        url: "https://flymsy.com/ground-transportation/",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: VERIFIED_DATE,
      },
    ],
    relationships: [
      {
        targetPlaceId: "place:erato-street-cruise-terminal",
        targetPublicSlug: "erato-street-cruise-terminal",
        targetName: "Erato Street Cruise Terminal",
        targetPlaceType: "cruise_turnaround_terminal",
        relationship: "turnaround_transfer_link",
        distanceOrTransitSummary: "15 miles east via I-10 E & US-90B (~25–45 min)",
        geographicExplanation: "Primary cruise-to-air turnaround corridor.",
      },
      {
        targetPlaceId: "place:manchac",
        targetPublicSlug: "manchac",
        targetName: "Manchac Swamp / LaPlace",
        targetPlaceType: "bayou_or_wetland_corridor",
        relationship: "turnaround_transfer_link",
        distanceOrTransitSummary: "18 miles west via I-10 W across Bonnet Carré Spillway (~22–30 min)",
        geographicExplanation: "Self-drivers with rental cars often visit Manchac or Whitney Plantation en route to afternoon/evening MSY flights.",
      },
    ],
    driveEstimateFromFrenchQuarter: {
      originLabel: "French Quarter / Port NOLA Cruise Terminals",
      distanceMilesMin: 14,
      distanceMilesMax: 16,
      typicalMinutesMin: 22,
      typicalMinutesMax: 38,
      peakTrafficMinutesMax: 65,
      primaryRouteSummary: "I-10 West through Metairie & Kenner -> Exit 221 (Loyola Dr) -> 1 Terminal Dr",
      trafficQualificationNote:
        "Planning estimate only (not a guarantee): Metairie Causeway Blvd merges, I-10 construction, or heavy rain regularly stretch airport transfers to 45–65 minutes.",
      rideshareReturnAvailability: "reliable",
      isGuarantee: false,
      sourceCitation: {
        label: "FlyMSY Official Directions & Ground Transit Guide",
        url: "https://flymsy.com/directions/",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: VERIFIED_DATE,
      },
    },
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- 9 HELD DRAFT PLACES (HeldPlaceQueue — noindex, follow, excluded from sitemaps & nav) ---
  {
    placeId: "place:bywater",
    publicPlaceSlug: "bywater",
    hasPublicDirectoryPage: true,
    name: "Bywater",
    subRegionLabel: "Downriver Arts & Crescent Park District · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    heroImage: "/images/portfolio/nola-jazz-music.webp",
    heroImageAlt: "Historic New Orleans neighborhood streetscape",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Downriver neighborhood past Press Street rail tracks; held from public directory indexing pending verified local tour meeting points.",
    overview: "Draft neighborhood entity held in HeldPlaceQueue until verified local operator departure points and municipal facility records are confirmed.",
    accessAndTransitSummary: "Downriver of Faubourg Marigny along Chartres, Royal, and St. Claude.",
    pickupAndArrivalNotes: "Pending verification of commercial tour meeting points.",
    weatherOrSeasonalAdvice: "Check seasonal Crescent Park pedestrian bridge hours.",
    meetingAndAccessPoints: [],
    officialLocalSources: [],
    relationships: [],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in HeldPlaceQueue: fewer than 1 verified tour meeting point and operator roster in Bywater.",
    ],
  },
  {
    placeId: "place:bourbon-street",
    publicPlaceSlug: "bourbon-street",
    hasPublicDirectoryPage: true,
    name: "Bourbon Street Micro-Corridor",
    subRegionLabel: "Upper Vieux Carré Entertainment Strip · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    heroImage: "/images/portfolio/royal-street-balconies.webp",
    heroImageAlt: "French Quarter balcony architecture",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Micro-corridor inside the French Quarter; held from standalone indexing to avoid thin duplicate overlap with /areas/french-quarter.",
    overview: "Held in HeldPlaceQueue because Bourbon Street walking logistics are consolidated inside the canonical French Quarter neighborhood hub until distinct micro-corridor safety/pedestrian-mall hours are verified.",
    accessAndTransitSummary: "Pedestrianized nightly inside the French Quarter.",
    pickupAndArrivalNotes: "Motorcoaches never pick up directly on Bourbon Street.",
    weatherOrSeasonalAdvice: "Evening pedestrian mall closures apply.",
    meetingAndAccessPoints: [],
    officialLocalSources: [],
    relationships: [],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in HeldPlaceQueue: consolidated under canonical /areas/french-quarter to prevent thin micro-street duplication.",
    ],
  },
  {
    placeId: "place:frenchmen-street",
    publicPlaceSlug: "frenchmen-street",
    hasPublicDirectoryPage: true,
    name: "Frenchmen Street Live Music Micro-Corridor",
    subRegionLabel: "500–600 Frenchmen St · Faubourg Marigny",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    heroImage: "/images/portfolio/nola-jazz-music.webp",
    heroImageAlt: "Live brass and jazz music in New Orleans",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Two-block live-music micro-corridor inside Faubourg Marigny; held from standalone indexing while consolidated under /areas/marigny.",
    overview: "Held in HeldPlaceQueue until verified guided evening music-tour operator roster and club entry policies are independently confirmed.",
    accessAndTransitSummary: "Located at the Esplanade Ave edge of Faubourg Marigny.",
    pickupAndArrivalNotes: "Consolidated within /areas/marigny.",
    weatherOrSeasonalAdvice: "Peak crowds Thursday–Sunday nights.",
    meetingAndAccessPoints: [],
    officialLocalSources: [],
    relationships: [],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in HeldPlaceQueue: consolidated under /areas/marigny until dedicated guided music-walk operator roster is verified.",
    ],
  },
  {
    placeId: "place:st-louis-cemetery",
    publicPlaceSlug: "st-louis-cemetery",
    hasPublicDirectoryPage: true,
    name: "St. Louis Cemetery No. 1 Regulated Precinct",
    subRegionLabel: "Basin St · Archdiocese Regulated Entry",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "historic_site_or_museum",
    heroImage: "/images/portfolio/royal-street-balconies.webp",
    heroImageAlt: "Historic New Orleans architecture",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Archdiocese-regulated cemetery precinct; held in HeldPlaceQueue pending current official Cemetery Tours New Orleans kiosk hours and entry fee verification.",
    overview: "Held in HeldPlaceQueue pending primary-source verification of current Archdiocese of New Orleans / Cemetery Tours New Orleans exclusive interior guide licensing vs. exterior perimeter tours.",
    accessAndTransitSummary: "Adjacent to Basin St Station (501 Basin St).",
    pickupAndArrivalNotes: "Interior access requires official Archdiocese-authorized tour ticket.",
    weatherOrSeasonalAdvice: "Open daytime hours only.",
    meetingAndAccessPoints: [],
    officialLocalSources: [],
    relationships: [],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in HeldPlaceQueue: awaiting primary-source Archdiocese interior-access schedule and ticket-office verification.",
    ],
  },
  {
    placeId: "place:city-park",
    publicPlaceSlug: "city-park",
    hasPublicDirectoryPage: true,
    name: "New Orleans City Park & Bayou St. John",
    subRegionLabel: "Mid-City / Esplanade Ridge · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    heroImage: "/images/portfolio/garden-district-mansion.webp",
    heroImageAlt: "Live oaks in New Orleans",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "1,300-acre urban park and sculpture garden; held from public directory indexing until dedicated park/kayak tour meeting points are verified.",
    overview: "Held in HeldPlaceQueue while City Park stopover notes remain covered inside narrated city sightseeing bus itineraries.",
    accessAndTransitSummary: "Reached via Canal Streetcar — City Park/Museum branch or Esplanade Ave.",
    pickupAndArrivalNotes: "City bus tours pause near Morning Call / Café Du Monde City Park.",
    weatherOrSeasonalAdvice: "Open year-round.",
    meetingAndAccessPoints: [],
    officialLocalSources: [],
    relationships: [],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in HeldPlaceQueue: standalone park operator directory not yet populated with verified departure points.",
    ],
  },
  {
    placeId: "place:lake-pontchartrain",
    publicPlaceSlug: "lake-pontchartrain",
    hasPublicDirectoryPage: true,
    name: "Lake Pontchartrain Lakefront",
    subRegionLabel: "Lakeshore Dr & New Canal Lighthouse · Orleans/Jefferson Parish",
    parishOrJurisdiction: "Orleans & Jefferson Parishes",
    placeType: "riverfront_wharf_or_dock",
    heroImage: "/images/portfolio/riverboat-city-of-nola.webp",
    heroImageAlt: "Waterfront scene in New Orleans",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Estuary lakefront and Katrina levee engineering stop; held in HeldPlaceQueue until sailing/charter operator berths are verified.",
    overview: "Held in HeldPlaceQueue pending primary-source verification of West End Marina charter operators.",
    accessAndTransitSummary: "6 miles north of Downtown New Orleans.",
    pickupAndArrivalNotes: "Visited as a narrated stop on Katrina Recovery & City sightseeing buses.",
    weatherOrSeasonalAdvice: "Exposed open-water wind conditions.",
    meetingAndAccessPoints: [],
    officialLocalSources: [],
    relationships: [],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in HeldPlaceQueue: West End Marina sailing/fishing charter operators pending primary-source verification.",
    ],
  },
  {
    placeId: "place:uptown",
    publicPlaceSlug: "uptown",
    hasPublicDirectoryPage: true,
    name: "Uptown & Audubon Corridor",
    subRegionLabel: "Upper St. Charles Ave · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    heroImage: "/images/portfolio/garden-district-mansion.webp",
    heroImageAlt: "Historic Uptown New Orleans oaks and homes",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Audubon Park and university corridor upriver from Napoleon Avenue; held pending standalone walking/architecture tour verification.",
    overview: "Held in HeldPlaceQueue while Garden District & St. Charles Streetcar logistics are served on canonical /areas/garden-district.",
    accessAndTransitSummary: "St. Charles Streetcar upriver beyond Louisiana Ave.",
    pickupAndArrivalNotes: "Pending verified Uptown-specific tour meeting points.",
    weatherOrSeasonalAdvice: "Tree-lined residential avenues.",
    meetingAndAccessPoints: [],
    officialLocalSources: [],
    relationships: [],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in HeldPlaceQueue: awaiting verified standalone Uptown walking/culinary operator departures distinct from Garden District.",
    ],
  },
  {
    placeId: "place:magazine-street",
    publicPlaceSlug: "magazine-street",
    hasPublicDirectoryPage: true,
    name: "Magazine Street Merchant Corridor",
    subRegionLabel: "Six-Mile Retail & Culinary Spine · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    heroImage: "/images/portfolio/classic-cocktails-nola.webp",
    heroImageAlt: "New Orleans culinary and cocktail corridor",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Six-mile shopping and dining corridor; held in HeldPlaceQueue pending verified Magazine Street food-tour meeting points.",
    overview: "Held in HeldPlaceQueue until verified culinary/boutique walking tour meeting points along Magazine Street are confirmed.",
    accessAndTransitSummary: "RTA Route 11 Magazine bus from Canal Street.",
    pickupAndArrivalNotes: "Pending verified operator check-in locations.",
    weatherOrSeasonalAdvice: "Year-round daytime merchant hours.",
    meetingAndAccessPoints: [],
    officialLocalSources: [],
    relationships: [],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in HeldPlaceQueue: Magazine Street culinary walking operators pending primary-source verification.",
    ],
  },
  {
    placeId: "place:central-business-district",
    publicPlaceSlug: "central-business-district",
    hasPublicDirectoryPage: true,
    name: "Central Business District (CBD / Poydras)",
    subRegionLabel: "Canal St to Poydras St Commercial Hotel Core · Orleans Parish",
    parishOrJurisdiction: "Orleans Parish",
    placeType: "urban_neighborhood",
    heroImage: "/images/portfolio/royal-street-balconies.webp",
    heroImageAlt: "Downtown New Orleans historic streetscape",
    heroImageCredit: "WNO rights-cleared portfolio library",
    hook: "Major commercial hotel pickup zone upriver of Canal Street; held from standalone indexing until CBD architecture/history walk meeting points are verified.",
    overview: "Held in HeldPlaceQueue while hotel shuttle logistics are documented on /areas/french-quarter and /areas/warehouse-district.",
    accessAndTransitSummary: "Loyola/Rampart and Canal streetcar lines.",
    pickupAndArrivalNotes: "Major commercial hotels on Canal, Poydras, and Carondelet qualify for swamp/River Road shuttle pickup.",
    weatherOrSeasonalAdvice: "Saints game days impact Poydras Street traffic around Caesars Superdome.",
    meetingAndAccessPoints: [],
    officialLocalSources: [],
    relationships: [],
    driveEstimateFromFrenchQuarter: null,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in HeldPlaceQueue: standalone CBD tour departures pending verification beyond hotel shuttle pickup stops.",
    ],
  },
];

// ============================================================================
// 3. CANONICAL OPERATORS (14 QUALIFIED + 3 HELD = 17 OPERATORS)
//    ALL DEFAULT TO liveAvailabilityConnected: false & directCheckoutConnected: false
// ============================================================================

export const NEW_ORLEANS_OPERATORS: readonly NewOrleansOperatorRecord[] = [
  {
    operatorId: "operator:new-orleans-steamboat-company",
    slug: "new-orleans-steamboat-company",
    legacyCompanyAliases: ["steamboat-natchez"],
    name: "New Orleans Steamboat Company",
    tagline: "Operating authentic sternwheel Steamboat NATCHEZ and companion Riverboat CITY of NEW ORLEANS from the French Quarter riverfront",
    headquartersCommunityId: "place:mississippi-riverfront",
    servedPlaceIds: [
      "place:mississippi-riverfront",
      "place:french-quarter",
      "place:erato-street-cruise-terminal",
      "place:julia-street-cruise-terminal",
    ],
    publicPlaceSlugs: ["mississippi-riverfront", "french-quarter"],
    categorySlugs: ["riverboat-cruises"],
    verifiedOwnershipBadges: [
      {
        tag: "mississippi_river_vessel_operator",
        label: "Mississippi River Steamboat Operator",
        evidenceSummary:
          "Founded in 1974; operates the steam-powered sternwheeler Steamboat NATCHEZ (launched 1975) and companion Riverboat CITY of NEW ORLEANS from the French Quarter riverfront.",
        sourceUrl: "https://www.steamboatnatchez.com/about-us",
      },
      {
        tag: "locally_owned",
        label: "New Orleans Hospitality Family Operator",
        evidenceSummary:
          "New Orleans-headquartered operator anchored at the Toulouse Street Wharf Lighthouse Ticket Office (400 Toulouse St).",
        sourceUrl: "https://www.steamboatnatchez.com/",
      },
    ],
    companyOverview:
      "New Orleans Steamboat Company is the maritime operating company behind both the steam-powered sternwheel paddlewheeler Steamboat NATCHEZ and its companion vessel, the Riverboat CITY of NEW ORLEANS. Separating the operating company from its two vessels matters directly to travelers: while all walk-up ticketing is managed at the Lighthouse Ticket Office at 400 Toulouse Street behind JAX Brewery, boarding wharf assignments are resolved at the individual product and departure level depending on whether one or both vessels are sailing simultaneously.",
    arrivalAndPickupSummary:
      "Check in 30–45 minutes before departure at the Lighthouse Ticket Office (400 Toulouse St, New Orleans, LA 70130). Steamboat NATCHEZ boards directly at Toulouse Street Wharf (400 Toulouse St); Riverboat CITY of NEW ORLEANS boards either ~2 blocks upriver at the St. Louis Street / Lower Bienville Wharf (101 St. Louis St along Woldenberg Park) when both boats sail concurrently, or at 400 Toulouse St when substituting for NATCHEZ.",
    officialWebsite: "https://www.steamboatnatchez.com/",
    officialEmailDomain: "steamboatnatchez.com",
    officialPhone: "(504) 569-1401",
    yearEstablished: 1974,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "neworleanssteamboatcompany",
    accessibilityAndMobilityNotes:
      "Main climate-controlled dining decks and riverfront gangways accommodate standard wheelchairs and walkers, though high or low Mississippi River stages can steepen gangway angles; upper observation decks use stairs/elevator depending on vessel.",
    participantPolicies:
      "All ages welcome; cruise-only and Creole meal-inclusive tickets must be selected prior to boarding; no full-size cruise suitcases permitted aboard.",
    heroImage: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    heroImageAlt: "Steamboat NATCHEZ paddlewheeler cruising the Mississippi River past the French Quarter",
    heroImageCredit: "Wikimedia Commons / WNO rights-cleared archive",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Attributed FareHarbor referral (asn=welcometoneworleanstours) and Viator product links active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    operatedVessels: [
      {
        vesselId: "vessel:steamboat-natchez",
        vesselName: "Steamboat NATCHEZ",
        vesselType: "True Steam-Powered Sternwheel Paddlewheeler",
        propulsionAndHullSummary:
          "1925 steam engines driving a 25-ton white-oak & steel sternwheel, 32-note steam calliope, engine-room viewing, and multi-deck open promenades.",
        primaryWharfName: "Toulouse Street Wharf",
        primaryWharfAddress: "400 Toulouse St, New Orleans, LA 70130",
        companionOrSubstituteWharfRule:
          "Primary berth at 400 Toulouse St behind JAX Brewery; during annual USCG inspection/layup, Riverboat CITY of NEW ORLEANS sails scheduled jazz cruises from 400 Toulouse St.",
      },
      {
        vesselId: "vessel:riverboat-city-of-new-orleans",
        vesselName: "Riverboat CITY of NEW ORLEANS",
        vesselType: "Multi-Deck Authentic Mississippi Riverboat",
        propulsionAndHullSummary:
          "Modernized multi-deck riverboat with climate-controlled dining salons, panoramic windows, and open-air top observation deck.",
        primaryWharfName: "St. Louis Street / Lower Bienville Street Wharf",
        primaryWharfAddress: "101 St. Louis St, New Orleans, LA 70130",
        companionOrSubstituteWharfRule:
          "Tickets at 400 Toulouse St; boards ~2 blocks upriver at 101 St. Louis St along Woldenberg Park when Steamboat NATCHEZ occupies Toulouse Wharf simultaneously, or at 400 Toulouse St when sailing solo.",
      },
    ],
    meetingRules: [
      {
        placeId: "place:mississippi-riverfront",
        meetingAreaName: "Lighthouse Ticket Office — 400 Toulouse St & St. Louis Wharf (101 St. Louis St)",
        pickupProvided: false,
        meetingPointInstructions:
          "Report to 400 Toulouse St (behind JAX Brewery) 30–45 minutes prior to sailing to verify your boarding gangway (400 Toulouse St vs. 101 St. Louis St).",
        addedBufferMinutesEachWay: 15,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Steamboat NATCHEZ — Official Cruise Schedules & Toulouse Street Wharf",
        url: "https://www.steamboatnatchez.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
      {
        label: "Riverboat CITY of NEW ORLEANS — Official Vessel & Boarding Guide",
        url: "https://www.steamboatnatchez.com/riverboat-city-of-new-orleans",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:gray-line",
    slug: "gray-line",
    legacyCompanyAliases: ["gray-line-new-orleans"],
    name: "Gray Line New Orleans",
    tagline: "Lighthouse Ticket Office motorcoach city sightseeing, Katrina recovery, swamp airboat/boat transfers, and River Road historical excursions",
    headquartersCommunityId: "place:french-quarter",
    servedPlaceIds: [
      "place:french-quarter",
      "place:mississippi-riverfront",
      "place:garden-district",
      "place:warehouse-district",
      "place:jean-lafitte",
      "place:honey-island",
      "place:river-road",
      "place:whitney-plantation",
      "place:oak-alley-plantation",
      "place:laura-plantation",
    ],
    publicPlaceSlugs: [
      "french-quarter",
      "mississippi-riverfront",
      "garden-district",
      "warehouse-district",
      "jean-lafitte",
      "honey-island",
      "river-road",
      "whitney-plantation",
      "oak-alley-plantation",
      "laura-plantation",
    ],
    categorySlugs: [
      "city-and-garden-district-sightseeing",
      "river-road-history-excursions",
      "swamp-and-airboat-tours",
      "ghost-vampire-and-history-walks",
    ],
    verifiedOwnershipBadges: [
      {
        tag: "historic_utility_or_heritage_operator",
        label: "Centennial New Orleans Sightseeing Carrier (Est. 1924)",
        evidenceSummary:
          "Operating guided New Orleans sightseeing motorcoaches since 1924 from the French Quarter riverfront Lighthouse Ticket Office at 400 Toulouse St.",
        sourceUrl: "https://www.graylineneworleans.com/",
      },
    ],
    companyOverview:
      "Operating in New Orleans since 1924 and headquartered at the Lighthouse Ticket Office (400 Toulouse Street) alongside sister company New Orleans Steamboat Company, Gray Line New Orleans runs climate-controlled full-size sightseeing motorcoaches and licensed French Quarter walking tours. Its fleet provides narrated Hurricane Katrina recovery and city architecture tours, round-trip transportation packages to Whitney Plantation, Oak Alley Plantation, and Laura Plantation along the Great River Road, and bundled swamp/airboat transfers.",
    arrivalAndPickupSummary:
      "Most motorcoach excursions check in 30–45 minutes prior to departure at the Gray Line Lighthouse Ticket Office (400 Toulouse St, behind JAX Brewery), with select River Road and swamp departures offering scheduled Downtown hotel pickups.",
    officialWebsite: "https://www.graylineneworleans.com/",
    officialEmailDomain: "graylineneworleans.com",
    officialPhone: "(504) 569-1401",
    yearEstablished: 1924,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "neworleanssteamboatcompany",
    accessibilityAndMobilityNotes:
      "Lift-equipped motorcoaches are available with advance notice (48+ hours recommended); walking tours traverse historic uneven Vieux Carré and Garden District sidewalks.",
    participantPolicies:
      "Airboat transfer packages enforce a 5-year-old minimum age and prohibit riders who are pregnant or have back/neck injuries; covered swamp boats and city/River Road coaches welcome all ages.",
    heroImage: "/images/portfolio/garden-district-mansion.webp",
    heroImageAlt: "Historic New Orleans neighborhood along Gray Line sightseeing route",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Attributed FareHarbor (asn=welcometoneworleanstours) and Viator links active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:french-quarter",
        meetingAreaName: "Gray Line Lighthouse Ticket Office (400 Toulouse St)",
        pickupProvided: true,
        meetingPointInstructions:
          "Check in at 400 Toulouse St (Toulouse St & the Mississippi River) 30 minutes prior unless a confirmed Downtown hotel pickup time is printed on your voucher.",
        addedBufferMinutesEachWay: 20,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Gray Line New Orleans — Official Tours & Lighthouse Ticket Office",
        url: "https://www.graylineneworleans.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:ragin-cajun-airboat-tours",
    slug: "ragin-cajun-tours",
    legacyCompanyAliases: ["ragin-cajun-airboat-tours"],
    separateFromOperatorIds: ["operator:airboat-adventures"],
    separationGovernanceNote:
      "Ragin' Cajun Airboat Tours (10090 US-90 & 1265 LA-3127, Luling / Bayou Gauche, LA, St. Charles Parish; Capt. Randy Young) is a completely separate company and dock facility from Airboat Adventures (5145 Fleming Park Rd, Lafitte, LA, Barataria Basin). Never merge their listings, docks, or reviews.",
    name: "Ragin' Cajun Airboat Tours",
    tagline: "Small 6-passenger, 10-passenger, private airboat, and covered pontoon swamp tours in Bayou Gauche / Luling, Louisiana",
    headquartersCommunityId: "place:jean-lafitte",
    servedPlaceIds: ["place:jean-lafitte", "place:french-quarter", "place:warehouse-district"],
    publicPlaceSlugs: ["jean-lafitte", "french-quarter", "warehouse-district"],
    categorySlugs: ["swamp-and-airboat-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "cajun_captain_owned",
        label: "Local Captain-Owned Bayou Operator",
        evidenceSummary:
          "Founded and operated by USCG-licensed Captain Randy Young out of Luling / Bayou Gauche in St. Charles Parish.",
        sourceUrl: "https://ragincajunairboattours.com/",
      },
      {
        tag: "independent_small_group",
        label: "Small-Hull 6- & 10-Passenger Airboat Fleet",
        evidenceSummary:
          "Specializes in agile 6-passenger and 10-passenger custom airboats alongside shaded covered swamp boats.",
        sourceUrl: "https://ragincajunairboattours.com/",
      },
    ],
    companyOverview:
      "Owned and operated by Captain Randy Young in Luling / Bayou Gauche (St. Charles Parish on the Westbank, ~20–23 miles west of Downtown New Orleans via US-90), Ragin' Cajun Airboat Tours runs custom 6-passenger small airboats, 10-passenger mid-size airboats, private airboat charters, and shaded covered swamp boats. Crucially, Ragin' Cajun operates two distinct Luling docks—10090 US-90 for airboats and 1265 LA-3127 for covered boats—and is an entirely independent company from Airboat Adventures in Lafitte.",
    arrivalAndPickupSummary:
      "Self-drivers must check whether their ticket specifies the Airboat Dock (10090 US-90, Luling, LA 70070) or Covered Boat Dock (1265 LA-3127, Luling, LA 70070) and arrive 30 minutes early. Optional round-trip Downtown/French Quarter commercial hotel shuttle pickup begins ~60–75 minutes before launch.",
    officialWebsite: "https://ragincajunairboattours.com/",
    officialEmailDomain: "ragincajunairboattours.com",
    officialPhone: "(504) 436-8000",
    yearEstablished: null,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "ragincajuntours",
    accessibilityAndMobilityNotes:
      "Covered pontoon boats accommodate folding mobility aids with dock assistance; high-speed open airboats require stepping over gunwales onto tiered seats and are not wheelchair-accessible.",
    participantPolicies:
      "Airboats require riders to be at least 5 years old (or 48 inches tall per vessel safety rules) and prohibit pregnant guests and riders with neck/back injuries; covered pontoon boats welcome all ages including toddlers.",
    heroImage: "/images/portfolio/louisiana-airboat-marsh.webp",
    heroImageAlt: "Ragin' Cajun small airboat exploring Louisiana marsh channels",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Attributed FareHarbor referral (shortname=ragincajuntours, asn=aktourcenter) active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:jean-lafitte",
        meetingAreaName: "Luling Airboat Dock (10090 US-90) & Covered Boat Dock (1265 LA-3127)",
        pickupProvided: true,
        meetingPointInstructions:
          "Self-drive to the exact Luling dock printed on your confirmation 30 minutes prior, or select the hotel-pickup option from Downtown/French Quarter commercial hotels.",
        addedBufferMinutesEachWay: 35,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Ragin' Cajun Airboat Tours — Official Fleet, Docks & Policies",
        url: "https://ragincajunairboattours.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:airboat-adventures",
    slug: "airboat-adventures",
    separateFromOperatorIds: ["operator:ragin-cajun-airboat-tours"],
    separationGovernanceNote:
      "Airboat Adventures, LLC (5145 Fleming Park Rd, Lafitte, LA 70067, Barataria Basin) is a completely separate company and dock facility from Ragin' Cajun Airboat Tours (Luling / Bayou Gauche, LA). Never conflate their vessels, docks, or booking links.",
    name: "Airboat Adventures",
    tagline: "Small 6–10 passenger, large 15–30 passenger, and private high-speed airboat excursions on Bayou Barataria in Lafitte, Louisiana",
    headquartersCommunityId: "place:jean-lafitte",
    servedPlaceIds: ["place:jean-lafitte", "place:french-quarter", "place:warehouse-district"],
    publicPlaceSlugs: ["jean-lafitte", "french-quarter", "warehouse-district"],
    categorySlugs: ["swamp-and-airboat-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Lafitte / Barataria Basin Airboat Operator",
        evidenceSummary:
          "Operates custom aluminum small and stadium-seating airboats from its dedicated Lafitte, LA dock facility at 5145 Fleming Park Road.",
        sourceUrl: "https://airboatadventures.com/",
      },
    ],
    companyOverview:
      "Based at 5145 Fleming Park Road in Lafitte, Louisiana along the Barataria Basin (~26–29 miles south of Downtown New Orleans), Airboat Adventures, LLC operates both intimate 6–10 passenger small airboats and 15–30 passenger stadium-seating large airboats, plus private airboat charters. Powered by high-output marine/aircraft-propeller drivetrains, its USCG-licensed local captains navigate tidal marshes, cypress bayous, and shallow mudflats inaccessible to deep-draft boats. Airboat Adventures is completely distinct from Ragin' Cajun Airboat Tours in Luling.",
    arrivalAndPickupSummary:
      "Self-drivers check in 30 minutes prior at 5145 Fleming Park Rd, Lafitte, LA 70067 (free on-site parking, gift shop, and restrooms). Optional round-trip shuttle pickups operate from commercial Downtown and French Quarter hotels ~75 minutes before boat time (no Airbnb/residential pickups).",
    officialWebsite: "https://airboatadventures.com/",
    officialEmailDomain: "airboatadventures.com",
    officialPhone: "(504) 689-2005",
    yearEstablished: null,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    viatorSupplierNote: "SUPPLIER-7eNlteakiwgCVdiaT3VQkg==",
    accessibilityAndMobilityNotes:
      "Dock facility and gift shop are ground-level accessible; boarding open airboats requires stepping into tiered seats—call (504) 689-2005 ahead for transfer assistance questions.",
    participantPolicies:
      "Minimum age 5 years old; pregnant travelers and guests with neck or back conditions are prohibited from riding airboats; hearing-protection headsets provided to all passengers.",
    heroImage: "/images/wno/airboat-swamp-tour.webp",
    heroImageAlt: "Airboat Adventures high-speed airboat gliding across Barataria Basin marsh",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Verified Viator exact-product handoffs (6455NOLAAIR, 6455P7, 6455P6) active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:jean-lafitte",
        meetingAreaName: "Airboat Adventures Lafitte Dock (5145 Fleming Park Rd, Lafitte, LA 70067)",
        pickupProvided: true,
        meetingPointInstructions:
          "Drive out to 5145 Fleming Park Rd, Lafitte, LA 30 minutes before launch, or select the hotel-pickup fare for commercial Downtown/French Quarter hotel shuttle service.",
        addedBufferMinutesEachWay: 45,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Airboat Adventures — Official Lafitte Dock, Fleet & FAQ",
        url: "https://airboatadventures.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:cajun-encounters",
    slug: "cajun-encounters",
    name: "Cajun Encounters Tour Company",
    tagline: "Covered flat-bottomed Honey Island Swamp boat tours in Slidell plus narrated New Orleans city, ghost, and River Road motorcoach excursions",
    headquartersCommunityId: "place:honey-island",
    servedPlaceIds: [
      "place:honey-island",
      "place:french-quarter",
      "place:warehouse-district",
      "place:river-road",
      "place:oak-alley-plantation",
      "place:laura-plantation",
    ],
    publicPlaceSlugs: [
      "honey-island",
      "french-quarter",
      "warehouse-district",
      "river-road",
      "oak-alley-plantation",
      "laura-plantation",
    ],
    categorySlugs: [
      "swamp-and-airboat-tours",
      "city-and-garden-district-sightseeing",
      "river-road-history-excursions",
    ],
    verifiedOwnershipBadges: [
      {
        tag: "regional_operator",
        label: "Honey Island & Metro Sightseeing Fleet",
        evidenceSummary:
          "Operates custom 22-passenger flat-bottomed covered swamp boats on US-90 in Slidell and coordinated hotel-pickup motorcoaches from New Orleans.",
        sourceUrl: "https://www.cajunencounters.com/",
      },
    ],
    companyOverview:
      "Cajun Encounters Tour Company operates covered, open-sided 22-passenger flat-bottomed swamp boats inside the Honey Island Swamp wetland system in Slidell (55345 US-90) alongside narrated New Orleans city/cemetery bus tours and River Road historical excursions. Its quiet outboard-powered swamp boats allow captains to navigate narrow West Pearl River channels without ear protection and accommodate families with young children under 5 who cannot board high-speed airboats.",
    arrivalAndPickupSummary:
      "Drive-out swamp guests check in 30 minutes prior at 55345 US-90, Slidell, LA 70461 (~35–55 minutes northeast of the French Quarter via the I-10 Twin Span). Hotel-shuttle swamp and River Road guests are picked up at designated Downtown/French Quarter commercial hotels 75–90 minutes prior.",
    officialWebsite: "https://www.cajunencounters.com/",
    officialEmailDomain: "cajunencounters.com",
    officialPhone: "(504) 834-1770",
    yearEstablished: 1998,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "cajunencounters",
    accessibilityAndMobilityNotes:
      "Covered flat-bottomed boats feature stable walk-aboard docks; call (504) 834-1770 in advance if traveling with a non-folding wheelchair or motorized scooter.",
    participantPolicies:
      "Honey Island covered swamp boats welcome all ages (infants and toddlers permitted); choose exact with-transportation vs. self-drive SKU at checkout.",
    heroImage: "/images/portfolio/nola-covered-swamp-boat.webp",
    heroImageAlt: "Covered flat-bottomed swamp tour boat in Honey Island Swamp",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Verified Viator (6953SWAMP, 6953SWAMPTRANS) and FareHarbor referral links active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:honey-island",
        meetingAreaName: "Honey Island Marina — 55345 US-90, Slidell, LA 70461",
        pickupProvided: true,
        meetingPointInstructions:
          "Self-drive to 55345 US-90 in Slidell 30 minutes prior, or reserve the explicitly labeled 'With Transportation' option for Downtown/FQ hotel pickup.",
        addedBufferMinutesEachWay: 45,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Cajun Encounters — Official Honey Island Swamp & City Tours",
        url: "https://www.cajunencounters.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:cajun-pride-swamp-tours",
    slug: "cajun-pride-swamp-tours",
    name: "Cajun Pride Swamp Tours",
    tagline: "Covered pontoon swamp boat excursions on a private wildlife refuge in Manchac Swamp (LaPlace, LA) plus River Road combinations",
    headquartersCommunityId: "place:manchac",
    servedPlaceIds: [
      "place:manchac",
      "place:french-quarter",
      "place:warehouse-district",
      "place:river-road",
      "place:oak-alley-plantation",
      "place:laura-plantation",
    ],
    publicPlaceSlugs: [
      "manchac",
      "french-quarter",
      "warehouse-district",
      "river-road",
      "oak-alley-plantation",
      "laura-plantation",
    ],
    categorySlugs: ["swamp-and-airboat-tours", "river-road-history-excursions"],
    verifiedOwnershipBadges: [
      {
        tag: "family_owned",
        label: "Private Manchac Refuge Operator",
        evidenceSummary:
          "Operates covered swamp boats on a private Manchac wildlife refuge off Frenier Road in LaPlace with Cajun captains.",
        sourceUrl: "https://www.cajunprideswamptours.com/",
      },
    ],
    companyOverview:
      "Located at 110 Frenier Road in LaPlace, Louisiana along the Manchac Swamp corridor between Lakes Pontchartrain and Maurepas (~35–55 minutes northwest of New Orleans via I-10 West), Cajun Pride Swamp Tours operates covered, shaded pontoon swamp boats inside a private wildlife refuge where tour boat traffic is limited to its own fleet. Because LaPlace sits right at the River Parishes gateway, Cajun Pride is a practical choice both for family-friendly covered swamp outings and for combined Manchac + River Road historical days.",
    arrivalAndPickupSummary:
      "Drive-out guests check in 20–30 minutes early at 110 Frenier Rd, LaPlace, LA 70068 (free parking). Shuttle-included tickets pick up from Downtown/French Quarter commercial hotels ~75 minutes before departure.",
    officialWebsite: "https://www.cajunprideswamptours.com/tours/swamp-tours",
    officialEmailDomain: "cajunprideswamptours.com",
    officialPhone: "(504) 467-0758",
    yearEstablished: 1991,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    accessibilityAndMobilityNotes:
      "Covered pontoon vessels feature flat-deck entry ramps and shaded bench seating suitable for seniors and multi-generational groups.",
    participantPolicies:
      "All ages welcome on covered pontoon boats; verify drive-out vs. hotel-shuttle ticket option before completing checkout.",
    heroImage: "/images/portfolio/bayou-alligator-tour.webp",
    heroImageAlt: "Covered swamp tour boat in cypress bayou waters near Manchac",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Verified Viator exact-product links (141126P1, 141126P2) active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:manchac",
        meetingAreaName: "Cajun Pride Manchac Dock — 110 Frenier Rd, LaPlace, LA 70068",
        pickupProvided: true,
        meetingPointInstructions:
          "Take I-10 West to Exit 209 (US-51 / Frenier Rd) for self-drive check-in, or select the shuttle-included SKU from Downtown New Orleans.",
        addedBufferMinutesEachWay: 45,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Cajun Pride Swamp Tours — Official Manchac Swamp Tours & Directions",
        url: "https://www.cajunprideswamptours.com/tours/swamp-tours",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:jean-lafitte-swamp-tours",
    slug: "jean-lafitte-swamp-tours",
    name: "Jean Lafitte Swamp Tour",
    tagline: "Shaded covered barge-style bayou boats departing Leo Kerner Lafitte Pkwy adjacent to the Barataria Preserve in Marrero, LA",
    headquartersCommunityId: "place:jean-lafitte",
    servedPlaceIds: ["place:jean-lafitte", "place:french-quarter"],
    publicPlaceSlugs: ["jean-lafitte", "french-quarter"],
    categorySlugs: ["swamp-and-airboat-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Barataria Corridor Covered-Boat Specialist",
        evidenceSummary:
          "Operates shaded, flat-bottomed covered swamp boats out of 6601 Leo Kerner Lafitte Pkwy in Marrero along Bayou Barataria.",
        sourceUrl: "https://www.jeanlafitteswamptour.com/",
      },
    ],
    companyOverview:
      "Departing from 6601 Leo Kerner Lafitte Parkway in Marrero, Louisiana (~15–18 miles south of Downtown New Orleans across the Crescent City Connection), Jean Lafitte Swamp Tour operates shaded, USCG-inspected covered swamp boats through moss-draped cypress bayous bordering the Jean Lafitte National Historical Park and Preserve. Note: its commercial boat dock is separate from the federal NPS Barataria Preserve Visitor Center & walking trails at 6588 Barataria Blvd, and on WNO its self-drive covered boat tour is active while its separate hotel-pickup SKU remains held pending operator shuttle confirmation.",
    arrivalAndPickupSummary:
      "Self-drivers check in 30 minutes prior at 6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072. Do not navigate to the federal NPS Visitor Center on Barataria Blvd for boat check-in.",
    officialWebsite: "https://www.jeanlafitteswamptour.com/",
    officialEmailDomain: "jeanlafitteswamptour.com",
    officialPhone: "(504) 689-4186",
    yearEstablished: null,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "jeanlafitteswamptour",
    accessibilityAndMobilityNotes:
      "Shaded covered pontoon boats have level boarding and onboard restroom facilities on larger vessels.",
    participantPolicies:
      "All ages welcome on covered swamp boats; hotel-shuttle variant (`jeanlafitte-swamp-tour-with-hotel-pickup`) is currently held pending direct operator shuttle verification.",
    heroImage: "/images/portfolio/jean-lafitte-bayou.webp",
    heroImageAlt: "Shaded cypress bayou along the Jean Lafitte Barataria corridor",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Drive-out covered swamp boat verified; hotel-pickup SKU held in HeldTourSkuQueue; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:jean-lafitte",
        meetingAreaName: "Jean Lafitte Swamp Tour Dock — 6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072",
        pickupProvided: false,
        meetingPointInstructions:
          "Self-drive check-in 30 minutes prior at 6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072 (separate from NPS Visitor Center).",
        addedBufferMinutesEachWay: 35,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Jean Lafitte Swamp Tour — Official Marrero Dock & Schedule",
        url: "https://www.jeanlafitteswamptour.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:louisiana-tour-company",
    slug: "louisiana-tour-company",
    name: "Louisiana Tour Company",
    tagline: "16-passenger large stadium airboats, 6-passenger small airboats, and covered swamp boats from 9706 Barataria Blvd in Marrero, LA",
    headquartersCommunityId: "place:jean-lafitte",
    servedPlaceIds: ["place:jean-lafitte", "place:french-quarter", "place:warehouse-district"],
    publicPlaceSlugs: ["jean-lafitte", "french-quarter", "warehouse-district"],
    categorySlugs: ["swamp-and-airboat-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Crown Point / Barataria Multi-Vessel Fleet",
        evidenceSummary:
          "Operates large 16-passenger stadium airboats, small 6–10 passenger airboats, and covered tour boats from 9706 Barataria Blvd in Marrero / Crown Point.",
        sourceUrl: "https://www.louisianaswamp.com/",
      },
    ],
    companyOverview:
      "Operating out of 9706 Barataria Boulevard in Marrero / Crown Point, Louisiana (~22–25 miles south of the French Quarter along LA-45), Louisiana Tour Company runs a multi-vessel Barataria fleet spanning 16-passenger stadium-seating large airboats (`15200P1`), 6-to-10 passenger small airboats, and shaded covered swamp boats (`15200P6` hotel-pickup option). That single-dock fleet mix makes it easy for mixed-preference groups to compare self-drive dock rates against Downtown hotel-pickup shuttles.",
    arrivalAndPickupSummary:
      "Self-drive SKUs (such as 16-passenger Large Airboat `15200P1`) check in 30 minutes prior at 9706 Barataria Blvd, Marrero, LA 70072. Hotel-pickup SKUs (such as `15200P6`) pick up at Downtown and French Quarter commercial hotels ~75 minutes before boat launch.",
    officialWebsite: "https://www.louisianaswamp.com/",
    officialEmailDomain: "louisianaswamp.com",
    officialPhone: "(504) 689-3599",
    yearEstablished: null,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "louisianatourcompany",
    accessibilityAndMobilityNotes:
      "Covered tour boats offer gentler step-aboard access; open airboats require stepping into elevated stadium seats and are not wheelchair-accessible.",
    participantPolicies:
      "Airboats require minimum age 5 and prohibit pregnant guests and individuals with neck/back injuries; covered swamp boats welcome all ages.",
    heroImage: "/images/wno/small-boat-swamp-tour.webp",
    heroImageAlt: "Louisiana Tour Company airboat and bayou channel in Marrero",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Verified Viator (`15200P1`, `15200P6`) and FareHarbor referral links active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:jean-lafitte",
        meetingAreaName: "Louisiana Tour Company Dock — 9706 Barataria Blvd, Marrero, LA 70072",
        pickupProvided: true,
        meetingPointInstructions:
          "Self-drive SKUs meet at 9706 Barataria Blvd, Marrero, LA 70072 30 minutes prior; hotel-shuttle SKUs pick up from commercial Downtown/FQ hotels.",
        addedBufferMinutesEachWay: 40,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Louisiana Tour Company — Official Barataria Swamp & Airboat Tours",
        url: "https://www.louisianaswamp.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:southern-style-tours",
    slug: "southern-style-tours",
    name: "Southern Style Tours",
    tagline: "Small-bus 13–25 passenger hotel-pickup New Orleans city tours and River Road historical excursions to Whitney, Oak Alley, and Laura",
    headquartersCommunityId: "place:french-quarter",
    servedPlaceIds: [
      "place:french-quarter",
      "place:garden-district",
      "place:warehouse-district",
      "place:treme",
      "place:river-road",
      "place:whitney-plantation",
      "place:oak-alley-plantation",
      "place:laura-plantation",
      "place:jean-lafitte",
    ],
    publicPlaceSlugs: [
      "french-quarter",
      "garden-district",
      "warehouse-district",
      "treme",
      "river-road",
      "whitney-plantation",
      "oak-alley-plantation",
      "laura-plantation",
      "jean-lafitte",
    ],
    categorySlugs: [
      "city-and-garden-district-sightseeing",
      "river-road-history-excursions",
      "swamp-and-airboat-tours",
    ],
    verifiedOwnershipBadges: [
      {
        tag: "independent_small_group",
        label: "Small-Bus Direct Hotel-Pickup Operator",
        evidenceSummary:
          "Operates 13-to-25 passenger air-conditioned minibuses with direct curb pickup at Downtown and French Quarter hotels.",
        sourceUrl: "https://southernstyletours.com/",
      },
    ],
    companyOverview:
      "Southern Style Tours is a locally operated New Orleans minibus excursion company specializing in 13-to-25 passenger air-conditioned coaches rather than 55-passenger highway buses. Because it has no walk-up dock, every departure revolves around direct hotel-lobby curb pickup across Downtown, the French Quarter, and the Warehouse District—covering 3-hour city/cemetery/Garden District overview tours and round-trip River Road historical excursions to Oak Alley Plantation, Whitney Plantation, and Laura Plantation.",
    arrivalAndPickupSummary:
      "Direct commercial hotel pickup across the French Quarter, CBD, and Warehouse District (pickup window typically opens 30–45 minutes before departure; no walk-up ticket booth).",
    officialWebsite: "https://southernstyletours.com/",
    officialEmailDomain: "southernstyletours.com",
    officialPhone: "(504) 568-1998",
    yearEstablished: null,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "southernstyletours",
    accessibilityAndMobilityNotes:
      "Minibuses require climbing 2–3 front entry steps; collapsible walkers and strollers can be stored, and city tours minimize extended continuous walking.",
    participantPolicies:
      "All ages welcome on city and River Road minibus tours; bundled airboat combos enforce the standard 5-year-old airboat minimum age.",
    heroImage: "/images/portfolio/whitney-plantation.webp",
    heroImageAlt: "Historic River Road destination served by Southern Style Tours from New Orleans",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Attributed FareHarbor (shortname=southernstyletours, asn=aktourcenter) and Viator (`8013P1`) links active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:french-quarter",
        meetingAreaName: "Direct French Quarter, CBD & Warehouse District Hotel Pickup",
        pickupProvided: true,
        meetingPointInstructions:
          "Provide your commercial Downtown/French Quarter hotel name during checkout; guests at vacation rentals meet at the nearest approved commercial hotel.",
        addedBufferMinutesEachWay: 25,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Southern Style Tours — Official New Orleans City & Plantation Minibus Excursions",
        url: "https://southernstyletours.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:haunted-history-tours",
    slug: "haunted-history-tours",
    name: "Haunted History Tours",
    tagline: "Licensed French Quarter ghost, vampire, Voodoo, Garden District, and nocturnal bus tours operating nightly since 1995",
    headquartersCommunityId: "place:french-quarter",
    servedPlaceIds: ["place:french-quarter", "place:garden-district", "place:treme"],
    publicPlaceSlugs: ["french-quarter", "garden-district", "treme"],
    categorySlugs: [
      "ghost-vampire-and-history-walks",
      "city-and-garden-district-sightseeing",
    ],
    verifiedOwnershipBadges: [
      {
        tag: "licensed_french_quarter_walking_company",
        label: "Established Vieux Carré Walking Operator (Est. 1995)",
        evidenceSummary:
          "Founded in 1995 by Sidney Smith; operates City of New Orleans-licensed tour guides across distinct French Quarter and Garden District routes.",
        sourceUrl: "https://hauntedhistorytours.com/",
      },
    ],
    companyOverview:
      "Founded in 1995, Haunted History Tours is one of New Orleans' longest-running City-licensed walking and bus tour companies. Rather than blending every topic into a single generic walk, it separates its French Quarter Ghost/Haunted History Tour (meeting near 723 St. Peter Street / Rev. Zombie's), its Vampire Tour (meeting at the gates of St. Louis Cathedral), its Voodoo history walk, its daytime Garden District architectural/cemetery-perimeter walk (meeting at 1400 Washington Ave), and its Dead of Night haunted bus tour.",
    arrivalAndPickupSummary:
      "No hotel pickup—each tour meets at a specific street address printed on your confirmation (most commonly 723 St. Peter St, Jackson Square / St. Louis Cathedral, or 1400 Washington Ave in the Garden District) 15 minutes before start time.",
    officialWebsite: "https://hauntedhistorytours.com/our-tours/",
    officialEmailDomain: "hauntedhistorytours.com",
    officialPhone: "(504) 861-2727",
    yearEstablished: 1995,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    accessibilityAndMobilityNotes:
      "Walking tours cover ~1 to 1.25 miles over 2 hours on historic brick and slate French Quarter or Garden District sidewalks; wheelchair users can participate with curb-cut routing.",
    participantPolicies:
      "Standard ghost, vampire, and Garden District walks welcome families (parental discretion for dark historical violence); 21+ Haunted Pub Crawl requires valid government photo ID.",
    heroImage: "/images/portfolio/royal-street-balconies.webp",
    heroImageAlt: "French Quarter wrought-iron balconies along Haunted History Tours evening route",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Verified Viator (`3252_1`, `3252_5`) partner links active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:french-quarter",
        meetingAreaName: "723 St. Peter St & St. Louis Cathedral Gates (Jackson Square)",
        pickupProvided: false,
        meetingPointInstructions:
          "Verify your exact French Quarter meeting spot (723 St. Peter St vs. St. Louis Cathedral front gates) and check in 15 minutes early.",
        addedBufferMinutesEachWay: 10,
      },
      {
        placeId: "place:garden-district",
        meetingAreaName: "1400 Washington Ave (at Prytania St)",
        pickupProvided: false,
        meetingPointInstructions:
          "Garden District tours meet at 1400 Washington Ave—allow 25–30 minutes via St. Charles Streetcar from Canal St.",
        addedBufferMinutesEachWay: 25,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Haunted History Tours — Official Tour Lineup & Meeting Locations",
        url: "https://hauntedhistorytours.com/our-tours/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:french-quarter-phantoms",
    slug: "french-quarter-phantoms",
    name: "French Quarter Phantoms",
    tagline: "Master storyteller ghost & vampire, Tremé history, Garden District, and true-crime walking tours departing 718 N. Rampart St",
    headquartersCommunityId: "place:french-quarter",
    servedPlaceIds: ["place:french-quarter", "place:treme", "place:garden-district"],
    publicPlaceSlugs: ["french-quarter", "treme", "garden-district"],
    categorySlugs: ["ghost-vampire-and-history-walks"],
    verifiedOwnershipBadges: [
      {
        tag: "licensed_french_quarter_walking_company",
        label: "Licensed French Quarter & Tremé Historian Guides",
        evidenceSummary:
          "Operates small-group licensed walking tours from its dedicated check-in hub at The Voodoo Lounge (718 N. Rampart St) across from Louis Armstrong Park.",
        sourceUrl: "https://www.frenchquarterphantoms.com/",
      },
    ],
    companyOverview:
      "French Quarter Phantoms operates historian- and master-storyteller-led walking tours anchored at The Voodoo Lounge (718 North Rampart Street, directly across from Louis Armstrong Park and Congo Square). Its lineup spans its signature Ghost & Vampire Walking Tour, Tremé African American & Jazz Heritage walks, Saints & Sinners true-crime/red-light history walks, and daytime Garden District tours—keeping group sizes capped per City of New Orleans Vieux Carré tour-guide regulations.",
    arrivalAndPickupSummary:
      "French Quarter evening and Tremé walks check in 15 minutes prior at The Voodoo Lounge, 718 N. Rampart St, New Orleans, LA 70116 (corner of Orleans Ave across from Armstrong Park). No hotel pickup.",
    officialWebsite: "https://www.frenchquarterphantoms.com/",
    officialEmailDomain: "frenchquarterphantoms.com",
    officialPhone: "(504) 666-8300",
    yearEstablished: null,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    accessibilityAndMobilityNotes:
      "Approximately 1 mile of leisurely walking with frequent storytelling stops across flat French Quarter blocks.",
    participantPolicies:
      "Ghost & Vampire Tour welcomes ages 6+; Saints & Sinners and cocktail/pub variants require guests to be 21+ with valid ID.",
    heroImage: "/images/portfolio/royal-street-balconies.webp",
    heroImageAlt: "Historic French Quarter street corner at dusk",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Verified Viator product links active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:french-quarter",
        meetingAreaName: "The Voodoo Lounge — 718 N. Rampart St, New Orleans, LA 70116",
        pickupProvided: false,
        meetingPointInstructions:
          "Check in inside/outside 718 N. Rampart St (across from Louis Armstrong Park) 15 minutes before scheduled departure.",
        addedBufferMinutesEachWay: 10,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "French Quarter Phantoms — Official Tours & 718 N. Rampart St Check-In",
        url: "https://www.frenchquarterphantoms.com/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:doctor-gumbo-tours",
    slug: "doctor-gumbo-tours",
    name: "Doctor Gumbo Tours",
    tagline: "French Quarter Creole food-history tasting walks and historic craft-cocktail tours led by licensed local culinary guides",
    headquartersCommunityId: "place:french-quarter",
    servedPlaceIds: ["place:french-quarter"],
    publicPlaceSlugs: ["french-quarter"],
    categorySlugs: ["food-and-cocktail-walks"],
    verifiedOwnershipBadges: [
      {
        tag: "independent_small_group",
        label: "Small-Group Culinary & Cocktail Historian",
        evidenceSummary:
          "Locally founded French Quarter culinary and cocktail history walking operator partnering with classic Creole kitchens and historic bars.",
        sourceUrl: "https://www.doctorgumbo.com/",
      },
    ],
    companyOverview:
      "Doctor Gumbo Tours leads small-group French Quarter culinary and cocktail history walks that pair multi-stop tastings with serious historical context—covering West African, French, Spanish, Sicilian, and Creole foodways alongside 19th-century apothecary bitters, the Sazerac, the Ramos Gin Fizz, and Hurricane history. Its lineup includes the New Orleans Food History Tour, the Cocktail History Tour, and a combined Food & Cocktail History outing.",
    arrivalAndPickupSummary:
      "Walk-up French Quarter meeting points (typically 316 Chartres St for Food History/Combo tours and Patrick's Bar Vin at 730 Bienville St for Cocktail History—always confirm exact restaurant/bar address on your voucher) 15 minutes prior.",
    officialWebsite: "https://doctorgumbo.com/tours/",
    officialEmailDomain: "doctorgumbo.com",
    officialPhone: "(504) 473-4823",
    yearEstablished: 2012,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    accessibilityAndMobilityNotes:
      "Covers ~1 to 1.5 miles over 3 hours with seated/standing tasting stops inside historic French Quarter restaurants and courtyards.",
    participantPolicies:
      "Cocktail History and Combo Food & Cocktail tours strictly require all participants to be 21+ with valid government photo ID; contact operator prior to booking for severe shellfish/nut/gluten allergies.",
    heroImage: "/images/portfolio/classic-cocktails-nola.webp",
    heroImageAlt: "Historic French Quarter cocktail and culinary tasting stop",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Verified Viator (`6484NOLAFOOD`, `6484P3`) partner links active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:french-quarter",
        meetingAreaName: "316 Chartres St & 730 Bienville St (French Quarter)",
        pickupProvided: false,
        meetingPointInstructions:
          "Meet your guide 15 minutes before departure at the exact Chartres St or Bienville St venue listed on your booking confirmation.",
        addedBufferMinutesEachWay: 10,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "Doctor Gumbo Tours — Official Culinary & Cocktail Walking Tours",
        url: "https://doctorgumbo.com/tours/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:city-sightseeing-new-orleans",
    slug: "city-sightseeing-new-orleans",
    name: "City Sightseeing New Orleans",
    tagline: "Open-top double-decker Hop-On Hop-Off sightseeing loop connecting the French Quarter, Tremé, Warehouse District, and Garden District",
    headquartersCommunityId: "place:french-quarter",
    servedPlaceIds: [
      "place:french-quarter",
      "place:treme",
      "place:warehouse-district",
      "place:garden-district",
      "place:marigny",
    ],
    publicPlaceSlugs: [
      "french-quarter",
      "treme",
      "warehouse-district",
      "garden-district",
      "marigny",
    ],
    categorySlugs: ["city-and-garden-district-sightseeing"],
    verifiedOwnershipBadges: [
      {
        tag: "regional_operator",
        label: "Live-Guided Open-Top Double-Decker Loop",
        evidenceSummary:
          "Operates 18-stop Hop-On Hop-Off open-top sightseeing buses anchored at Basin St Station (501 Basin St) and Jackson Square (Stop 5).",
        sourceUrl: "https://citysightseeingneworleans.com/tours/hop-on-hop-off/",
      },
    ],
    companyOverview:
      "City Sightseeing New Orleans operates open-top red double-decker Hop-On Hop-Off buses on a continuous ~2-hour city loop linking 18 stops across Jackson Square / French Market, Basin St Station (Tremé), Canal Street, Harrah's / Riverfront, the National WWII Museum & Warehouse District, Magazine Street / Garden District, and Mardi Gras World. Multi-day tickets include guided French Quarter and Garden District walking tour add-ons.",
    arrivalAndPickupSummary:
      "Board at any official Hop-On Hop-Off stop (primary ticket desks at Stop 1 Basin St Station, 501 Basin St, and Stop 5 Jackson Square at Decatur & St. Peter); buses circulate ~every 30 minutes between 9:30 AM and 4:00 PM.",
    officialWebsite: "https://citysightseeingneworleans.com/tours/hop-on-hop-off/",
    officialEmailDomain: "citysightseeingneworleans.com",
    officialPhone: "(504) 207-6200",
    yearEstablished: null,
    socialLinks: {},
    bookingPlatform: "Direct Website",
    accessibilityAndMobilityNotes:
      "Lower air-conditioned deck is wheelchair-accessible via hydraulic ramp; upper open-air deck requires climbing an interior staircase. Full cruise suitcases are not permitted on board.",
    participantPolicies:
      "1-day, 2-day, and 3-day passes available; note final full-loop departure is typically ~4:00 PM.",
    heroImage: "/images/portfolio/garden-district-mansion.webp",
    heroImageAlt: "New Orleans historic avenue along Hop-On Hop-Off route",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Verified Viator (`5694NOHOHO`) partner link active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:french-quarter",
        meetingAreaName: "Stop 5 Jackson Square (Decatur St) & Stop 1 Basin St Station (501 Basin St)",
        pickupProvided: false,
        meetingPointInstructions:
          "Redeem mobile/printed voucher at Stop 1 (501 Basin St), Stop 5 (Jackson Square), or directly with stop staff at any of the 18 route stops.",
        addedBufferMinutesEachWay: 10,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "City Sightseeing New Orleans — Official Hop-On Hop-Off Route Map & Hours",
        url: "https://citysightseeingneworleans.com/tours/hop-on-hop-off/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    operatorId: "operator:new-orleans-kayak-swamp-tours",
    slug: "new-orleans-kayak-swamp-tours",
    name: "New Orleans Kayak Swamp Tours",
    tagline: "Eco-guided small-group cypress swamp kayaking in Manchac Pass / Ruddock Canal and Honey Island wetlands",
    headquartersCommunityId: "place:manchac",
    servedPlaceIds: ["place:manchac", "place:honey-island", "place:french-quarter"],
    publicPlaceSlugs: ["manchac", "honey-island", "french-quarter"],
    categorySlugs: ["swamp-and-airboat-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "independent_small_group",
        label: "Zero-Motor Eco-Kayak Bayou Outfitter",
        evidenceSummary:
          "Leads silent, human-powered guided kayak paddles through Manchac Mystic Waterway and Pearl River / Honey Island cypress channels.",
        sourceUrl: "https://neworleanskayakswamptours.com/tours/",
      },
    ],
    companyOverview:
      "New Orleans Kayak Swamp Tours offers a human-powered eco-alternative to motorized airboats and pontoon boats, guiding small groups in stable single and tandem sit-inside/sit-on-top kayaks beneath ancient bald cypress canopies in the Manchac Mystic Waterway (Ruddock / LaPlace) and Honey Island Swamp. Because there is no engine noise, paddlers move quietly past wading egrets, turtles, and basking alligators at a calm conversational pace.",
    arrivalAndPickupSummary:
      "Self-drive paddlers meet directly at the Manchac / Ruddock launch (off I-55 Exit 7 / US-51) or Honey Island launch 15–20 minutes prior; shuttle-included bookings meet at a central French Quarter/Marigny van pickup point ~60 minutes before launch.",
    officialWebsite: "https://neworleanskayakswamptours.com/tours/",
    officialEmailDomain: "neworleanskayakswamptours.com",
    officialPhone: "(504) 571-9990",
    yearEstablished: 2012,
    socialLinks: {},
    bookingPlatform: "Peek Pro",
    accessibilityAndMobilityNotes:
      "Active paddling experience (~2 hours on calm flatwater); guests must be able to sit upright and paddle independently or in a tandem kayak.",
    participantPolicies:
      "Minimum age and per-seat weight limits apply (tandem kayaks typically accommodate children ages 6+ with an adult); wear clothes and shoes that can get splashed.",
    heroImage: "/images/portfolio/jean-lafitte-bayou.webp",
    heroImageAlt: "Calm moss-draped cypress bayou channel ideal for guided swamp kayaking",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Verified Viator (`22050P2`) partner link active; direct 10% supplier-MoR live feed not yet connected.",
    ),
    meetingRules: [
      {
        placeId: "place:manchac",
        meetingAreaName: "Manchac / Ruddock Canal Launch & Central French Quarter Van Pickup",
        pickupProvided: true,
        meetingPointInstructions:
          "Confirm whether your ticket includes central French Quarter van transportation or meets self-drive at the Ruddock / Manchac boat launch.",
        addedBufferMinutesEachWay: 45,
      },
    ],
    operatorReviews: [],
    sources: [
      {
        label: "New Orleans Kayak Swamp Tours — Official Tours & Launch Logistics",
        url: "https://neworleanskayakswamptours.com/tours/",
        sourceKind: "official_operator",
        checkedAt: VERIFIED_DATE,
      },
    ],
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- 3 HELD OPERATORS (OperatorResearchQueue — noindex, follow, excluded from sitemaps & nav) ---
  {
    operatorId: "operator:nola-ghost-riders",
    slug: "nola-ghost-riders",
    name: "NOLA Ghost Riders",
    tagline: "French Quarter paranormal and carriage/specialty evening outings (canonical profile held pending direct operator verification)",
    headquartersCommunityId: "place:french-quarter",
    servedPlaceIds: ["place:french-quarter"],
    publicPlaceSlugs: ["french-quarter"],
    categorySlugs: ["ghost-vampire-and-history-walks"],
    verifiedOwnershipBadges: [],
    companyOverview:
      "Canonical operator profile held in OperatorResearchQueue pending primary-source verification of direct operator company phone, corporate domain, and exact French Quarter check-in stand coordinates. Existing legacy partner tour collection at /tours/nola-ghost-riders remains preserved.",
    arrivalAndPickupSummary:
      "Held pending direct operator confirmation of current French Quarter meeting stand and check-in window.",
    officialWebsite: null,
    officialEmailDomain: null,
    officialPhone: null,
    yearEstablished: null,
    socialLinks: {},
    bookingPlatform: "Unverified",
    accessibilityAndMobilityNotes: "Pending direct operator verification.",
    participantPolicies: "Pending direct operator verification.",
    heroImage: "/images/portfolio/royal-street-balconies.webp",
    heroImageAlt: "French Quarter evening streetscape",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Held in OperatorResearchQueue; legacy /tours/nola-ghost-riders route preserved.",
    ),
    meetingRules: [],
    operatorReviews: [],
    sources: [],
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in OperatorResearchQueue: missing verified direct official website/phone and verified street check-in coordinates (legacy /tours/nola-ghost-riders preserved).",
    ],
  },
  {
    operatorId: "operator:creole-queen-paddlewheeler",
    slug: "creole-queen-paddlewheeler",
    name: "Paddlewheeler Creole Queen (New Orleans Paddlewheels)",
    tagline: "Poydras Street Wharf riverboat cruises to Chalmette Battlefield (held pending current berth & NPS shore-stop verification)",
    headquartersCommunityId: "place:mississippi-riverfront",
    servedPlaceIds: ["place:mississippi-riverfront"],
    publicPlaceSlugs: ["mississippi-riverfront"],
    categorySlugs: ["riverboat-cruises"],
    verifiedOwnershipBadges: [],
    companyOverview:
      "Held in OperatorResearchQueue until Poydras Street / Spanish Plaza Wharf construction access alongside Riverwalk and current Chalmette Battlefield disembarkation schedules are re-verified from primary sources.",
    arrivalAndPickupSummary:
      "Pending primary-source verification of Spanish Plaza / Poydras Wharf pedestrian approach.",
    officialWebsite: "https://www.creolequeen.com/",
    officialEmailDomain: "creolequeen.com",
    officialPhone: null,
    yearEstablished: null,
    socialLinks: {},
    bookingPlatform: "Unverified",
    accessibilityAndMobilityNotes: "Pending verification.",
    participantPolicies: "Pending verification.",
    heroImage: "/images/portfolio/riverboat-city-of-nola.webp",
    heroImageAlt: "Mississippi Riverfront paddlewheeler",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Held in OperatorResearchQueue pending Spanish Plaza wharf & product verification.",
    ),
    meetingRules: [],
    operatorReviews: [],
    sources: [],
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in OperatorResearchQueue: awaiting verified non-held product SKUs and Spanish Plaza / Poydras Wharf gangway confirmation.",
    ],
  },
  {
    operatorId: "operator:beyond-the-bayou-tours",
    slug: "beyond-the-bayou-tours",
    name: "Beyond the Bayou Tours",
    tagline: "Small-group wetland and cultural day trips from New Orleans (held pending current product & pickup zone verification)",
    headquartersCommunityId: "place:french-quarter",
    servedPlaceIds: ["place:french-quarter"],
    publicPlaceSlugs: ["french-quarter"],
    categorySlugs: ["swamp-and-airboat-tours", "river-road-history-excursions"],
    verifiedOwnershipBadges: [],
    companyOverview:
      "Held in OperatorResearchQueue pending primary-source verification of current seasonal departure calendar, van capacity, and exact hotel pickup boundaries.",
    arrivalAndPickupSummary: "Pending primary-source pickup verification.",
    officialWebsite: null,
    officialEmailDomain: null,
    officialPhone: null,
    yearEstablished: null,
    socialLinks: {},
    bookingPlatform: "Unverified",
    accessibilityAndMobilityNotes: "Pending verification.",
    participantPolicies: "Pending verification.",
    heroImage: "/images/portfolio/jean-lafitte-bayou.webp",
    heroImageAlt: "Louisiana bayou scenery",
    heroImageCredit: "WNO rights-cleared portfolio library",
    claimStatus: "unclaimed",
    integrationApproval: createDefaultUnconnectedApprovalState(
      "Held in OperatorResearchQueue pending primary-source verification.",
    ),
    meetingRules: [],
    operatorReviews: [],
    sources: [],
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
    explicitHoldReasons: [
      "Held in OperatorResearchQueue: missing verified official contact domain, active non-held SKU mapping, and pickup zone confirmation.",
    ],
  },
];

// ============================================================================
// 4. CANONICAL TOUR PRODUCTS (28 QUALIFIED + 2 HELD = 30 PRODUCTS)
// ============================================================================

interface RawNewOrleansProductSeed
  extends Omit<NewOrleansProductRecord, "departures" | "productReviews"> {}

const RAW_NEW_ORLEANS_PRODUCTS: readonly RawNewOrleansProductSeed[] = [
  // --- NEW ORLEANS STEAMBOAT COMPANY (VESSEL-SEPARATED BOARDING RESOLUTION) ---
  {
    productId: "product:nosc:daytime-jazz-cruise",
    productSlug: "daytime-jazz-cruise",
    wnoPublicTourPath: "/tours/daytime-jazz-cruise",
    operatorId: "operator:new-orleans-steamboat-company",
    operatorSlug: "new-orleans-steamboat-company",
    operatorName: "New Orleans Steamboat Company",
    primaryPlaceId: "place:mississippi-riverfront",
    placeSlug: "mississippi-riverfront",
    categorySlug: "riverboat-cruises",
    title: "Steamboat NATCHEZ Daytime Harbor Jazz Cruise",
    summary:
      "Two-hour narrated Mississippi River harbor cruise aboard the authentic steam-powered sternwheeler Steamboat NATCHEZ featuring live Duke Hebert / Steamboat Stompers jazz, steam calliope concert, engine-room access, and optional Creole lunch.",
    durationLabel: "2 hours (check in 30–45m prior)",
    durationMinutes: 120,
    typicalDepartureTimes: ["11:30", "14:30"],
    fromPriceUsd: 43.5,
    priceDisplayLabel: "From $43.50 per adult (cruise-only; lunch optional)",
    meetingPoint: "Toulouse Street Wharf — 400 Toulouse St, New Orleans, LA 70130",
    pickupIncluded: false,
    pickupDetails: "Walk-up French Quarter riverfront check-in behind JAX Brewery.",
    accessibilityNotes: "Main dining deck and gangway accommodate standard wheelchairs; river stage affects ramp slope.",
    participantRestrictions: "All ages welcome; store cruise luggage prior to boarding.",
    image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    imageAlt: "Steamboat NATCHEZ cruising the Mississippi River harbor",
    imageCredit: "Wikimedia Commons / WNO archive",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "5250NATCHEZ",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Steamboat-Natchez-Daytime-Jazz-Cruise/d675-5250NATCHEZ",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561538/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&full-items=yes",
    fareharborAsn: "welcometoneworleanstours",
    officialProductUrl: "https://www.steamboatnatchez.com/daytime-jazz-cruises",
    attributionCampaign: "wno-daytime-jazz-cruise",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      vesselId: "vessel:steamboat-natchez",
      vesselName: "Steamboat NATCHEZ",
      ticketOfficeAddress: "400 Toulouse St, New Orleans, LA 70130 (Lighthouse Ticket Office)",
      primaryBoardingWharfOrDock:
        "Toulouse Street Wharf (behind JAX Brewery), 400 Toulouse St, New Orleans, LA 70130",
      companionOrAlternateBoardingRule:
        "During scheduled annual USCG maintenance of Steamboat NATCHEZ, sister vessel Riverboat CITY of NEW ORLEANS operates this sailing from 400 Toulouse St.",
      checkInLeadMinutes: 30,
      voucherConfirmationRule:
        "Verify vessel and gangway signage at the 400 Toulouse St Lighthouse Ticket Office 30 minutes before calliope concert and boarding.",
      sourceUrl: "https://www.steamboatnatchez.com/daytime-jazz-cruises",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "True steam-powered sternwheel paddlewheeler (Steamboat NATCHEZ)",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:nosc:evening-jazz-cruise",
    productSlug: "evening-jazz-cruise",
    wnoPublicTourPath: "/tours/evening-jazz-cruise",
    operatorId: "operator:new-orleans-steamboat-company",
    operatorSlug: "new-orleans-steamboat-company",
    operatorName: "New Orleans Steamboat Company",
    primaryPlaceId: "place:mississippi-riverfront",
    placeSlug: "mississippi-riverfront",
    categorySlug: "riverboat-cruises",
    title: "Steamboat NATCHEZ Evening Jazz Cruise",
    summary:
      "Two-hour twilight and night Mississippi River cruise aboard Steamboat NATCHEZ with live Dukes of Dixieland jazz, skyline views, and optional Creole buffet dinner seating.",
    durationLabel: "2 hours (boarding at 6:00 PM, sails 7:00–9:00 PM)",
    durationMinutes: 120,
    typicalDepartureTimes: ["19:00"],
    fromPriceUsd: 59,
    priceDisplayLabel: "From $59 per adult (cruise-only; dinner seating optional)",
    meetingPoint: "Toulouse Street Wharf — 400 Toulouse St, New Orleans, LA 70130",
    pickupIncluded: false,
    pickupDetails: "Walk-up boarding at Toulouse Street Wharf behind JAX Brewery.",
    accessibilityNotes: "Climate-controlled interior dining decks and open promenade decks.",
    participantRestrictions: "All ages welcome; select early or second dinner seating if adding dinner.",
    image: "/images/travel-markets/new-orleans/steamboat-natchez.jpg",
    imageAlt: "Steamboat NATCHEZ evening jazz cruise on the Mississippi River",
    imageCredit: "Wikimedia Commons / WNO archive",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "5250DINNER",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Steamboat-Natchez-Evening-Jazz-Cruise/d675-5250DINNER",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561540/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&full-items=yes",
    fareharborAsn: "welcometoneworleanstours",
    officialProductUrl: "https://www.steamboatnatchez.com/dinner-jazz-cruises",
    attributionCampaign: "wno-evening-jazz-cruise",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      vesselId: "vessel:steamboat-natchez",
      vesselName: "Steamboat NATCHEZ",
      ticketOfficeAddress: "400 Toulouse St, New Orleans, LA 70130 (Lighthouse Ticket Office)",
      primaryBoardingWharfOrDock:
        "Toulouse Street Wharf, 400 Toulouse St, New Orleans, LA 70130",
      companionOrAlternateBoardingRule:
        "During annual Steamboat NATCHEZ USCG layup, Riverboat CITY of NEW ORLEANS operates the evening dinner jazz schedule from 400 Toulouse St.",
      checkInLeadMinutes: 45,
      voucherConfirmationRule:
        "Check in by 6:00 PM at 400 Toulouse St for early dinner seating and calliope boarding.",
      sourceUrl: "https://www.steamboatnatchez.com/dinner-jazz-cruises",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "True steam-powered sternwheel paddlewheeler (Steamboat NATCHEZ)",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:nosc:sunday-jazz-brunch-cruise",
    productSlug: "sunday-jazz-brunch-cruise",
    wnoPublicTourPath: "/tours/sunday-jazz-brunch-cruise",
    operatorId: "operator:new-orleans-steamboat-company",
    operatorSlug: "new-orleans-steamboat-company",
    operatorName: "New Orleans Steamboat Company",
    primaryPlaceId: "place:mississippi-riverfront",
    placeSlug: "mississippi-riverfront",
    categorySlug: "riverboat-cruises",
    title: "Sunday Jazz Brunch Cruise on the Mississippi",
    summary:
      "Two-hour Sunday Mississippi River harbor cruise pairing live traditional New Orleans jazz with a Creole brunch buffet.",
    durationLabel: "2 hours (Sundays at 11:30 AM & 2:30 PM)",
    durationMinutes: 120,
    typicalDepartureTimes: ["11:30", "14:30"],
    fromPriceUsd: 68,
    priceDisplayLabel: "From $68 per adult",
    meetingPoint: "Toulouse Street Wharf — 400 Toulouse St, New Orleans, LA 70130",
    pickupIncluded: false,
    pickupDetails: "Walk-up French Quarter riverfront check-in.",
    accessibilityNotes: "Indoor air-conditioned brunch salon plus open viewing decks.",
    participantRestrictions: "Operates Sundays only.",
    image: "/images/portfolio/riverboat-city-of-nola.webp",
    imageAlt: "Sunday jazz brunch paddlewheeler on the New Orleans riverfront",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "5250BRUNCH",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Sunday-Jazz-Brunch-on-the-Steamboat-Natchez/d675-5250BRUNCH",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561539/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&full-items=yes",
    fareharborAsn: "welcometoneworleanstours",
    officialProductUrl: "https://www.steamboatnatchez.com/sunday-jazz-brunch",
    attributionCampaign: "wno-sunday-jazz-brunch-cruise",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      vesselId: "vessel:steamboat-natchez",
      vesselName: "Steamboat NATCHEZ / Companion Riverboat Assignment",
      ticketOfficeAddress: "400 Toulouse St, New Orleans, LA 70130",
      primaryBoardingWharfOrDock:
        "Toulouse Street Wharf, 400 Toulouse St, New Orleans, LA 70130",
      companionOrAlternateBoardingRule:
        "If assigned to companion Riverboat CITY of NEW ORLEANS while Steamboat NATCHEZ occupies Toulouse Wharf simultaneously, boarding shifts ~2 blocks upriver to 101 St. Louis St.",
      checkInLeadMinutes: 35,
      voucherConfirmationRule:
        "Confirm vessel name and wharf gate at the 400 Toulouse St Lighthouse Ticket Office prior to boarding.",
      sourceUrl: "https://www.steamboatnatchez.com/sunday-jazz-brunch",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Sternwheel Mississippi Paddlewheeler",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:nosc:city-of-new-orleans-riverboat-cruise",
    productSlug: "city-of-new-orleans-riverboat-cruise",
    wnoPublicTourPath: "/tours/city-of-new-orleans-riverboat-cruise",
    operatorId: "operator:new-orleans-steamboat-company",
    operatorSlug: "new-orleans-steamboat-company",
    operatorName: "New Orleans Steamboat Company",
    primaryPlaceId: "place:mississippi-riverfront",
    placeSlug: "mississippi-riverfront",
    categorySlug: "riverboat-cruises",
    title: "Riverboat CITY of NEW ORLEANS Harbor & Dinner Jazz Cruise",
    summary:
      "Mississippi River jazz cruise aboard New Orleans Steamboat Company's companion vessel Riverboat CITY of NEW ORLEANS—featuring panoramic climate-controlled salons, live jazz, and distinct companion-berth boarding rules.",
    durationLabel: "2 hours",
    durationMinutes: 120,
    typicalDepartureTimes: ["11:30", "14:30", "19:00"],
    fromPriceUsd: 43.5,
    priceDisplayLabel: "From $43.50 per adult",
    meetingPoint:
      "Ticket Office: 400 Toulouse St · Companion Boarding Wharf: 101 St. Louis St (or 400 Toulouse St when substituting)",
    pickupIncluded: false,
    pickupDetails:
      "Walk-up check-in at 400 Toulouse St; do not assume identical gangway as Steamboat NATCHEZ when both vessels sail simultaneously.",
    accessibilityNotes: "Modernized riverboat salons and elevator/ramp access.",
    participantRestrictions: "All ages welcome; confirm exact wharf gate on departure day.",
    image: "/images/portfolio/riverboat-city-of-nola.webp",
    imageAlt: "Riverboat CITY of NEW ORLEANS docked on the French Quarter riverfront",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "official_operator_website",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&full-items=yes",
    fareharborAsn: "welcometoneworleanstours",
    officialProductUrl: "https://www.steamboatnatchez.com/riverboat-city-of-new-orleans",
    attributionCampaign: "wno-city-of-new-orleans-riverboat-cruise",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      vesselId: "vessel:riverboat-city-of-new-orleans",
      vesselName: "Riverboat CITY of NEW ORLEANS",
      ticketOfficeAddress: "400 Toulouse St, New Orleans, LA 70130 (Lighthouse Ticket Office)",
      primaryBoardingWharfOrDock:
        "St. Louis Street / Lower Bienville Street Wharf, 101 St. Louis St, New Orleans, LA 70130 (~2 blocks upriver along Woldenberg Park when Steamboat NATCHEZ occupies Toulouse Wharf)",
      companionOrAlternateBoardingRule:
        "Boards directly at Toulouse Street Wharf (400 Toulouse St) when sailing in place of Steamboat NATCHEZ on single-vessel schedules; always check your departure voucher and the 400 Toulouse St Lighthouse Ticket Office.",
      checkInLeadMinutes: 35,
      voucherConfirmationRule:
        "Mandatory product-level check: confirm 101 St. Louis St vs. 400 Toulouse St gangway on your confirmation or with Lighthouse Ticket Office staff.",
      sourceUrl: "https://www.steamboatnatchez.com/riverboat-city-of-new-orleans",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Multi-deck authentic riverboat (Riverboat CITY of NEW ORLEANS)",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- GRAY LINE NEW ORLEANS ---
  {
    productId: "product:gray-line:city-tour-of-new-orleans",
    productSlug: "city-tour-of-new-orleans",
    wnoPublicTourPath: "/tours/city-tour-of-new-orleans",
    operatorId: "operator:gray-line",
    operatorSlug: "gray-line",
    operatorName: "Gray Line New Orleans",
    primaryPlaceId: "place:french-quarter",
    placeSlug: "french-quarter",
    categorySlug: "city-and-garden-district-sightseeing",
    title: "Super City Tour of New Orleans & Katrina Recovery",
    summary:
      "Two-hour-plus narrated motorcoach overview covering the French Quarter perimeter, Esplanade Avenue, cemetery stopover, City Park, Lake Pontchartrain Katrina levee engineering, and St. Charles Avenue / Garden District.",
    durationLabel: "2 hours 15 mins",
    durationMinutes: 135,
    typicalDepartureTimes: ["10:00", "13:00"],
    fromPriceUsd: 49,
    priceDisplayLabel: "From $49 per adult",
    meetingPoint: "Gray Line Lighthouse Ticket Office — 400 Toulouse St, New Orleans, LA 70130",
    pickupIncluded: false,
    pickupDetails: "Check in 30 minutes prior at 400 Toulouse St behind JAX Brewery.",
    accessibilityNotes: "Climate-controlled motorcoach with minimal required walking.",
    participantRestrictions: "All ages welcome.",
    image: "/images/portfolio/garden-district-mansion.webp",
    imageAlt: "Garden District mansions along Gray Line New Orleans motorcoach route",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "5250SUPER",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Super-City-Tour/d675-5250SUPER",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561551/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&full-items=yes",
    fareharborAsn: "welcometoneworleanstours",
    officialProductUrl: "https://www.graylineneworleans.com/all-tours/city-tours",
    attributionCampaign: "wno-city-tour-of-new-orleans",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "400 Toulouse St, New Orleans, LA 70130",
      primaryBoardingWharfOrDock:
        "Gray Line Motorcoach Loading Zone — 400 Toulouse St, New Orleans, LA 70130",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Check in at the Lighthouse Ticket Office 30 minutes before coach departure.",
      sourceUrl: "https://www.graylineneworleans.com/all-tours/city-tours",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Climate-controlled highway sightseeing motorcoach",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: true,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:gray-line:whitney-plantation-tour",
    productSlug: "whitney-plantation-tour",
    wnoPublicTourPath: "/tours/whitney-plantation-tour",
    operatorId: "operator:gray-line",
    operatorSlug: "gray-line",
    operatorName: "Gray Line New Orleans",
    primaryPlaceId: "place:whitney-plantation",
    placeSlug: "whitney-plantation",
    categorySlug: "river-road-history-excursions",
    visitedHistoricSiteIds: ["place:whitney-plantation"],
    title: "Whitney Plantation Museum Round-Trip Excursion from New Orleans",
    summary:
      "Half-day round-trip motorcoach transportation from the French Quarter with admission to Whitney Plantation in Wallace, LA—the 501(c)(3) museum dedicated exclusively to the lives and memorials of enslaved people in Louisiana.",
    durationLabel: "5 hours 30 mins door-to-door",
    durationMinutes: 330,
    typicalDepartureTimes: ["08:30", "12:00"],
    fromPriceUsd: 82,
    priceDisplayLabel: "From $82 per adult (includes museum admission & round-trip coach)",
    meetingPoint: "400 Toulouse St Lighthouse Ticket Office or confirmed Downtown hotel pickup",
    pickupIncluded: true,
    pickupDetails: "Check voucher for 400 Toulouse St boarding vs. scheduled Downtown hotel pickup.",
    accessibilityNotes: "Outdoor walking across gravel and historic memorials; audio-guide headsets included.",
    participantRestrictions: "Closed Tuesdays; respectful museum conduct required.",
    image: "/images/portfolio/whitney-plantation.webp",
    imageAlt: "Whitney Plantation Museum grounds in Wallace, Louisiana",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "5250WHITNEY",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Whitney-Plantation-Tour-from-New-Orleans/d675-5250WHITNEY",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561563/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&full-items=yes",
    fareharborAsn: "welcometoneworleanstours",
    officialProductUrl: "https://www.graylineneworleans.com/all-tours/plantation-tours",
    attributionCampaign: "wno-whitney-plantation-tour",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "400 Toulouse St, New Orleans, LA 70130",
      primaryBoardingWharfOrDock:
        "Gray Line Lighthouse Ticket Office — 400 Toulouse St (plus select Downtown hotel pickup stops)",
      companionOrAlternateBoardingRule:
        "Destination museum admission is operated on site by The Whitney Institute (5099 LA-18, Wallace, LA).",
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Confirm exact pickup hotel or 400 Toulouse St departure time on voucher.",
      sourceUrl: "https://www.graylineneworleans.com/all-tours/plantation-tours",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Round-trip highway motorcoach + on-site museum audio/guided walk",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:gray-line:oak-alley-plantation-tour",
    productSlug: "oak-alley-plantation-tour",
    wnoPublicTourPath: "/tours/oak-alley-plantation-tour",
    operatorId: "operator:gray-line",
    operatorSlug: "gray-line",
    operatorName: "Gray Line New Orleans",
    primaryPlaceId: "place:oak-alley-plantation",
    placeSlug: "oak-alley-plantation",
    categorySlug: "river-road-history-excursions",
    visitedHistoricSiteIds: ["place:oak-alley-plantation"],
    title: "Oak Alley Plantation Round-Trip Historical Excursion",
    summary:
      "Round-trip narrated motorcoach excursion from New Orleans to Oak Alley Plantation in Vacherie, including guided Big House entry, the 28-oak allée, and self-guided time at the Slavery at Oak Alley reconstructed quarters exhibit.",
    durationLabel: "5 hours 30 mins door-to-door",
    durationMinutes: 330,
    typicalDepartureTimes: ["08:30", "12:15"],
    fromPriceUsd: 82,
    priceDisplayLabel: "From $82 per adult (includes site admission & round-trip coach)",
    meetingPoint: "400 Toulouse St Lighthouse Ticket Office or confirmed Downtown hotel pickup",
    pickupIncluded: true,
    pickupDetails: "400 Toulouse St check-in or scheduled Downtown hotel shuttle.",
    accessibilityNotes: "Spacious outdoor grounds; Big House upper floor involves stairs.",
    participantRestrictions: "All ages welcome.",
    image: "/images/portfolio/destrehan-plantation.webp",
    imageAlt: "Historic live-oak avenue along Louisiana's River Road",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "5250OAKALLEY",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Oak-Alley-Plantation-Tour/d675-5250OAKALLEY",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561561/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&full-items=yes",
    fareharborAsn: "welcometoneworleanstours",
    officialProductUrl: "https://www.graylineneworleans.com/all-tours/plantation-tours",
    attributionCampaign: "wno-oak-alley-plantation-tour",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "400 Toulouse St, New Orleans, LA 70130",
      primaryBoardingWharfOrDock:
        "Gray Line Lighthouse Ticket Office — 400 Toulouse St (plus select Downtown hotel pickup stops)",
      companionOrAlternateBoardingRule:
        "Destination historic site is stewarded on site by Oak Alley Foundation (3645 LA-18, Vacherie, LA).",
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Confirm hotel pickup window vs. 400 Toulouse St departure on voucher.",
      sourceUrl: "https://www.graylineneworleans.com/all-tours/plantation-tours",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Round-trip highway motorcoach + Oak Alley Foundation site admission",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:gray-line:small-airboat-swamp-adventure",
    productSlug: "small-airboat-swamp-adventure",
    wnoPublicTourPath: "/tours/small-airboat-swamp-adventure",
    operatorId: "operator:gray-line",
    operatorSlug: "gray-line",
    operatorName: "Gray Line New Orleans",
    primaryPlaceId: "place:jean-lafitte",
    placeSlug: "jean-lafitte",
    categorySlug: "swamp-and-airboat-tours",
    title: "Small-Group Airboat Swamp Adventure with Hotel Pickup",
    summary:
      "High-agility small airboat swamp excursion bundled with round-trip French Quarter / Downtown hotel shuttle coordination through Gray Line New Orleans.",
    durationLabel: "3 hours 45 mins door-to-door (~1h 45m on water)",
    durationMinutes: 225,
    typicalDepartureTimes: ["08:30", "10:30", "13:00", "15:00"],
    fromPriceUsd: 112,
    priceDisplayLabel: "From $112 per person (with transport)",
    meetingPoint: "Downtown / French Quarter commercial hotel pickup or self-drive dock option",
    pickupIncluded: true,
    pickupDetails: "Commercial hotel lobby pickup ~75 minutes before scheduled launch.",
    accessibilityNotes: "Open-air small airboat; requires unassisted step-aboard.",
    participantRestrictions: "Minimum age 5 years old; no pregnant riders or neck/back injuries.",
    image: "/images/portfolio/louisiana-airboat-marsh.webp",
    imageAlt: "Small airboat gliding through Louisiana marsh channels",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "official_operator_website",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561547/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&full-items=yes",
    fareharborAsn: "welcometoneworleanstours",
    officialProductUrl: "https://www.graylineneworleans.com/all-tours/swamp-tours",
    attributionCampaign: "wno-small-airboat-swamp-adventure",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "400 Toulouse St, New Orleans, LA 70130",
      primaryBoardingWharfOrDock:
        "Scheduled Downtown/French Quarter commercial hotel shuttle to partner Westbank airboat dock",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Confirm hotel pickup window or exact drive-out dock address on confirmation.",
      sourceUrl: "https://www.graylineneworleans.com/all-tours/swamp-tours",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "6–10 passenger high-speed small airboat",
    minimumAgeYears: 5,
    airboatNoiseAndHealthAdvisory:
      "High-noise open-air propeller ride (headsets provided); minimum age 5, no pregnancy or neck/back injuries.",
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:gray-line:ghosts-spirits-walking-tour",
    productSlug: "ghosts-spirits-walking-tour",
    wnoPublicTourPath: "/tours/ghosts-spirits-walking-tour",
    operatorId: "operator:gray-line",
    operatorSlug: "gray-line",
    operatorName: "Gray Line New Orleans",
    primaryPlaceId: "place:french-quarter",
    placeSlug: "french-quarter",
    categorySlug: "ghost-vampire-and-history-walks",
    title: "French Quarter Ghosts & Spirits Walking Tour",
    summary:
      "Two-hour evening historian-led Vieux Carré walking tour exploring documented colonial tragedies, yellow-fever history, Voodoo historical figures, and haunted French Quarter landmarks.",
    durationLabel: "2 hours",
    durationMinutes: 120,
    typicalDepartureTimes: ["17:00", "20:00"],
    fromPriceUsd: 32,
    priceDisplayLabel: "From $32 per adult",
    meetingPoint: "Gray Line Lighthouse Ticket Office — 400 Toulouse St, New Orleans, LA 70130",
    pickupIncluded: false,
    pickupDetails: "Walk-up French Quarter meeting point at 400 Toulouse St.",
    accessibilityNotes: "~1.2 miles leisurely walking on historic French Quarter sidewalks.",
    participantRestrictions: "Family-friendly historical storytelling (recommended ages 6+).",
    image: "/images/portfolio/royal-street-balconies.webp",
    imageAlt: "French Quarter balcony streetlights on evening ghost walk",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "official_operator_website",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/items/561556/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&full-items=yes",
    fareharborAsn: "welcometoneworleanstours",
    officialProductUrl: "https://www.graylineneworleans.com/all-tours/walking-tours",
    attributionCampaign: "wno-ghosts-spirits-walking-tour",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "400 Toulouse St, New Orleans, LA 70130",
      primaryBoardingWharfOrDock: "400 Toulouse St Lighthouse Ticket Office courtyard",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Check in 15 minutes prior at 400 Toulouse St.",
      sourceUrl: "https://www.graylineneworleans.com/all-tours/walking-tours",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Guided walking tour (no vehicle)",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:gray-line:cocktail-walking-tour",
    productSlug: "cocktail-walking-tour",
    wnoPublicTourPath: "/tours/cocktail-walking-tour",
    operatorId: "operator:gray-line",
    operatorSlug: "gray-line",
    operatorName: "Gray Line New Orleans",
    primaryPlaceId: "place:french-quarter",
    placeSlug: "french-quarter",
    categorySlug: "food-and-cocktail-walks",
    title: "French Quarter Classic Cocktail History Walking Tour",
    summary:
      "Guided 2.5-hour walk visiting historic French Quarter bars and courtyards tracing the origins of Peychaud's bitters, the Sazerac, Pimm's Cup, and Grasshopper.",
    durationLabel: "2 hours 30 mins",
    durationMinutes: 150,
    typicalDepartureTimes: ["16:00"],
    fromPriceUsd: 39,
    priceDisplayLabel: "From $39 per adult (drinks purchased or included per selected fare)",
    meetingPoint: "400 Toulouse St, New Orleans, LA 70130",
    pickupIncluded: false,
    pickupDetails: "Walk-up French Quarter check-in.",
    accessibilityNotes: "Easy ~1-mile flat walk between Quarter lounges.",
    participantRestrictions: "Strictly 21+ with valid government-issued photo ID.",
    image: "/images/portfolio/classic-cocktails-nola.webp",
    imageAlt: "Classic French Quarter cocktail service",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "official_operator_website",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/neworleanssteamboatcompany/?asn=welcometoneworleanstours&ref=WelcomeToNewOrleansTours&full-items=yes",
    fareharborAsn: "welcometoneworleanstours",
    officialProductUrl: "https://www.graylineneworleans.com/all-tours/walking-tours",
    attributionCampaign: "wno-cocktail-walking-tour",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "400 Toulouse St, New Orleans, LA 70130",
      primaryBoardingWharfOrDock: "400 Toulouse St Lighthouse Ticket Office",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Bring physical government photo ID (21+ mandatory).",
      sourceUrl: "https://www.graylineneworleans.com/all-tours/walking-tours",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Guided 21+ cocktail history walk",
    minimumAgeYears: 21,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- RAGIN' CAJUN AIRBOAT TOURS (SEPARATE FROM AIRBOAT ADVENTURES) ---
  {
    productId: "product:ragin-cajun:airboat-options",
    productSlug: "ragin-cajun-airboat-options",
    wnoPublicTourPath: "/tours/ragin-cajun-airboat-options",
    operatorId: "operator:ragin-cajun-airboat-tours",
    operatorSlug: "ragin-cajun-tours",
    operatorName: "Ragin' Cajun Airboat Tours",
    primaryPlaceId: "place:jean-lafitte",
    placeSlug: "jean-lafitte",
    categorySlug: "swamp-and-airboat-tours",
    title: "Ragin' Cajun Small 6-Passenger & 10-Passenger Airboat Swamp Tour",
    summary:
      "High-speed Bayou Gauche / Luling airboat excursion led by Capt. Randy Young's crew in 6-passenger or 10-passenger custom airboats—completely distinct from Airboat Adventures in Lafitte.",
    durationLabel: "1h 45m on water (~3h 45m with hotel pickup)",
    durationMinutes: 105,
    typicalDepartureTimes: ["09:45", "12:00", "14:00", "16:00"],
    fromPriceUsd: 79,
    priceDisplayLabel: "From $79 per person (self-drive; hotel shuttle option available)",
    meetingPoint: "10090 US-90, Luling, LA 70070 (or Downtown/French Quarter hotel pickup)",
    pickupIncluded: true,
    pickupDetails: "Self-drive to 10090 US-90 in Luling 30m prior, or select hotel-shuttle variant.",
    accessibilityNotes: "Open-air small airboat; requires stepping over hull gunwale.",
    participantRestrictions: "Minimum age 5 years old; no pregnant riders or neck/back injuries.",
    image: "/images/portfolio/louisiana-airboat-marsh.webp",
    imageAlt: "Ragin' Cajun small airboat in Luling / Bayou Gauche wetlands",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "official_operator_website",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/ragincajuntours/items/228561/?asn=aktourcenter&flow=940162&ref=wno-ragin-cajun-airboat-options&full-items=yes",
    fareharborAsn: "aktourcenter",
    officialProductUrl: "https://ragincajunairboattours.com/",
    attributionCampaign: "wno-ragin-cajun-airboat-options",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "10090 US-90, Luling, LA 70070",
      primaryBoardingWharfOrDock:
        "Ragin' Cajun Airboat Dock — 10090 US-90, Luling, LA 70070 (St. Charles Parish)",
      companionOrAlternateBoardingRule:
        "Distinct from Ragin' Cajun's Covered Boat Dock at 1265 LA-3127 in Luling and completely unrelated to Airboat Adventures at 5145 Fleming Park Rd in Lafitte.",
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Verify 10090 US-90 Luling Airboat Dock (or hotel pickup time) on confirmation.",
      sourceUrl: "https://ragincajunairboattours.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "6-passenger or 10-passenger open airboat",
    minimumAgeYears: 5,
    airboatNoiseAndHealthAdvisory:
      "High-noise aircraft-propeller airboat (hearing protection provided); age 5+ only, no pregnancy.",
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:ragin-cajun:covered-tour-boat",
    productSlug: "covered-tour-boat",
    wnoPublicTourPath: "/tours/covered-tour-boat",
    operatorId: "operator:ragin-cajun-airboat-tours",
    operatorSlug: "ragin-cajun-tours",
    operatorName: "Ragin' Cajun Airboat Tours",
    primaryPlaceId: "place:jean-lafitte",
    placeSlug: "jean-lafitte",
    categorySlug: "swamp-and-airboat-tours",
    title: "Ragin' Cajun Covered Swamp Boat Tour (All Ages)",
    summary:
      "Calm, shaded covered pontoon swamp boat tour through cypress bayous near Luling—welcoming toddlers, seniors, and mixed-age families who want wetland wildlife without airboat speed or noise.",
    durationLabel: "1h 45m on water (~3h 30m with hotel pickup)",
    durationMinutes: 105,
    typicalDepartureTimes: ["10:00", "12:15", "14:15"],
    fromPriceUsd: 45,
    priceDisplayLabel: "From $45 per adult (self-drive; hotel pickup available)",
    meetingPoint: "1265 LA-3127, Luling, LA 70070 (Covered Boat Dock) or hotel pickup",
    pickupIncluded: true,
    pickupDetails: "Check in 30m prior at 1265 LA-3127, Luling, LA or choose hotel shuttle.",
    accessibilityNotes: "Shaded flat-deck covered pontoon boat.",
    participantRestrictions: "All ages welcome including children under 5.",
    image: "/images/portfolio/nola-covered-swamp-boat.webp",
    imageAlt: "Shaded covered swamp boat gliding gently along cypress bayou",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "official_operator_website",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/ragincajuntours/items/590176/?asn=aktourcenter&ref=wno-ragin-cajun-covered-boat&full-items=yes",
    fareharborAsn: "aktourcenter",
    officialProductUrl: "https://ragincajunairboattours.com/",
    attributionCampaign: "wno-ragin-cajun-covered-boat",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "1265 LA-3127, Luling, LA 70070",
      primaryBoardingWharfOrDock:
        "Ragin' Cajun Covered Boat Dock — 1265 LA-3127, Luling, LA 70070",
      companionOrAlternateBoardingRule:
        "Note: Covered Boat Dock (1265 LA-3127) is a different Luling launch from the Airboat Dock (10090 US-90).",
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Confirm 1265 LA-3127 Luling Covered Boat Dock address before driving out.",
      sourceUrl: "https://ragincajunairboattours.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Shaded covered pontoon swamp boat",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- AIRBOAT ADVENTURES (LAFITTE, LA — SEPARATE FROM RAGIN' CAJUN) ---
  {
    productId: "product:airboat-adventures:large-airboat-6455nolaair",
    productSlug: "airboat-adventures-large-airboat",
    wnoPublicTourPath: "/tours/airboat-adventures",
    operatorId: "operator:airboat-adventures",
    operatorSlug: "airboat-adventures",
    operatorName: "Airboat Adventures",
    primaryPlaceId: "place:jean-lafitte",
    placeSlug: "jean-lafitte",
    categorySlug: "swamp-and-airboat-tours",
    title: "Airboat Adventures Large Airboat Ride (15–30 Passengers)",
    summary:
      "High-speed Barataria Basin marsh and cypress-bayou airboat ride departing 5145 Fleming Park Rd in Lafitte, LA aboard a 15–30 passenger stadium-seating airboat with optional hotel shuttle.",
    durationLabel: "1h 45m–2h on water (~4h with hotel pickup)",
    durationMinutes: 110,
    typicalDepartureTimes: ["09:45", "12:00", "14:00", "16:00"],
    fromPriceUsd: 59,
    priceDisplayLabel: "From $59 per person (drive-out; hotel pickup option available)",
    meetingPoint: "5145 Fleming Park Rd, Lafitte, LA 70067 (or commercial hotel pickup)",
    pickupIncluded: true,
    pickupDetails: "Drive-out check-in 30m prior at 5145 Fleming Park Rd or round-trip hotel van (~75m prior).",
    accessibilityNotes: "Stadium-tiered open airboat; hearing protection headsets included.",
    participantRestrictions: "Minimum age 5 years old; no pregnant riders or neck/back injuries.",
    image: "/images/wno/airboat-swamp-tour.webp",
    imageAlt: "Airboat Adventures large stadium airboat in Lafitte, Louisiana",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "6455NOLAAIR",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Airboat-Ride/d675-6455NOLAAIR?pid=P00306962&mcid=42383&medium=link&campaign=wno-airboat-adventures-large&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-airboat-adventures",
    officialProductUrl: "https://airboatadventures.com/",
    attributionCampaign: "wno-airboat-adventures-large",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "5145 Fleming Park Rd, Lafitte, LA 70067",
      primaryBoardingWharfOrDock:
        "Airboat Adventures Private Marsh Dock — 5145 Fleming Park Rd, Lafitte, LA 70067",
      companionOrAlternateBoardingRule:
        "Completely separate dock and company from Ragin' Cajun Airboat Tours in Luling and Louisiana Tour Company in Marrero.",
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Select 'With Pickup' vs. 'Drive-Out' fare option on Viator checkout.",
      sourceUrl: "https://airboatadventures.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "15–30 passenger stadium-seating large airboat",
    minimumAgeYears: 5,
    airboatNoiseAndHealthAdvisory:
      "Open-air high-noise aircraft-propeller craft; age 5+ minimum, no pregnancy.",
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:airboat-adventures:premium-small-6455p7",
    productSlug: "airboat-adventures-small-group",
    wnoPublicTourPath: "/tours/airboat-adventures",
    operatorId: "operator:airboat-adventures",
    operatorSlug: "airboat-adventures",
    operatorName: "Airboat Adventures",
    primaryPlaceId: "place:jean-lafitte",
    placeSlug: "jean-lafitte",
    categorySlug: "swamp-and-airboat-tours",
    title: "Airboat Adventures Premium Small-Group Airboat (6–10 Passengers)",
    summary:
      "Intimate 6–10 passenger high-agility airboat excursion out of Lafitte, LA reaching narrow Barataria bayou cuts and shallow tidal flats.",
    durationLabel: "1h 45m–2h on water (~4h with hotel pickup)",
    durationMinutes: 110,
    typicalDepartureTimes: ["09:45", "12:00", "14:00", "16:00"],
    fromPriceUsd: 89,
    priceDisplayLabel: "From $89 per person",
    meetingPoint: "5145 Fleming Park Rd, Lafitte, LA 70067 (or commercial hotel pickup)",
    pickupIncluded: true,
    pickupDetails: "Drive-out check-in 30m prior or optional Downtown/FQ hotel shuttle.",
    accessibilityNotes: "6–10 passenger open aluminum airboat.",
    participantRestrictions: "Minimum age 5 years old; no pregnant riders or neck/back injuries.",
    image: "/images/portfolio/louisiana-airboat-marsh.webp",
    imageAlt: "Small-group 6-to-10 passenger airboat in Barataria wetlands",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "6455P7",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Premium-New-Orleans-Airboat-Adventure/d675-6455P7?pid=P00306962&mcid=42383&medium=link&campaign=wno-airboat-adventures-premium&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-airboat-adventures",
    officialProductUrl: "https://airboatadventures.com/",
    attributionCampaign: "wno-airboat-adventures-premium",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "5145 Fleming Park Rd, Lafitte, LA 70067",
      primaryBoardingWharfOrDock:
        "Airboat Adventures Private Marsh Dock — 5145 Fleming Park Rd, Lafitte, LA 70067",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Confirm drive-out vs. hotel-pickup option before completing Viator checkout.",
      sourceUrl: "https://airboatadventures.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "6–10 passenger custom small airboat",
    minimumAgeYears: 5,
    airboatNoiseAndHealthAdvisory: "Minimum age 5; no pregnancy or neck/back injuries.",
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:airboat-adventures:private-charter-6455p6",
    productSlug: "airboat-adventures-private-charter",
    wnoPublicTourPath: "/tours/airboat-adventures",
    operatorId: "operator:airboat-adventures",
    operatorSlug: "airboat-adventures",
    operatorName: "Airboat Adventures",
    primaryPlaceId: "place:jean-lafitte",
    placeSlug: "jean-lafitte",
    categorySlug: "swamp-and-airboat-tours",
    title: "Private New Orleans Airboat Charter (Airboat Adventures)",
    summary:
      "Exclusive private airboat charter and dedicated Cajun captain departing 5145 Fleming Park Rd in Lafitte, LA for custom photography or private family pacing.",
    durationLabel: "1h 45m–2h on water",
    durationMinutes: 110,
    typicalDepartureTimes: ["09:45", "12:00", "14:00"],
    fromPriceUsd: 450,
    priceDisplayLabel: "From $450 per private boat",
    meetingPoint: "5145 Fleming Park Rd, Lafitte, LA 70067",
    pickupIncluded: false,
    pickupDetails: "Self-drive to Lafitte dock (private transport by special arrangement).",
    accessibilityNotes: "Private open airboat.",
    participantRestrictions: "Minimum age 5 years old; no pregnant riders.",
    image: "/images/portfolio/bayou-alligator-tour.webp",
    imageAlt: "Private airboat charter in Barataria Basin",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "6455P6",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Private-New-Orleans-Airboat-Adventure/d675-6455P6?pid=P00306962&mcid=42383&medium=link&campaign=wno-airboat-adventures-private&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-airboat-adventures",
    officialProductUrl: "https://airboatadventures.com/",
    attributionCampaign: "wno-airboat-adventures-private",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "5145 Fleming Park Rd, Lafitte, LA 70067",
      primaryBoardingWharfOrDock:
        "Airboat Adventures Private Marsh Dock — 5145 Fleming Park Rd, Lafitte, LA 70067",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Check in 30 minutes prior at 5145 Fleming Park Rd, Lafitte.",
      sourceUrl: "https://airboatadventures.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Private high-speed airboat charter",
    minimumAgeYears: 5,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- CAJUN ENCOUNTERS (HONEY ISLAND / SLIDELL + RIVER ROAD) ---
  {
    productId: "product:cajun-encounters:honey-island-drive-out",
    productSlug: "cajun-encounters-honey-island-swamp-boat",
    wnoPublicTourPath: "/operators/cajun-encounters",
    operatorId: "operator:cajun-encounters",
    operatorSlug: "cajun-encounters",
    operatorName: "Cajun Encounters Tour Company",
    primaryPlaceId: "place:honey-island",
    placeSlug: "honey-island",
    categorySlug: "swamp-and-airboat-tours",
    title: "Honey Island Swamp Covered Boat Tour (Self-Drive Slidell)",
    summary:
      "Two-hour guided covered flat-bottomed swamp boat tour through the Honey Island Swamp wetland channels in Slidell—quiet, shaded, and open to all ages.",
    durationLabel: "2 hours on water",
    durationMinutes: 120,
    typicalDepartureTimes: ["09:30", "11:45", "14:15", "16:15"],
    fromPriceUsd: 35,
    priceDisplayLabel: "From $35 per adult (self-drive)",
    meetingPoint: "55345 US-90, Slidell, LA 70461",
    pickupIncluded: false,
    pickupDetails: "Self-drive check-in 30 minutes early in Slidell.",
    accessibilityNotes: "Covered flat-bottomed 22-passenger swamp boat.",
    participantRestrictions: "All ages welcome.",
    image: "/images/portfolio/nola-covered-swamp-boat.webp",
    imageAlt: "Cajun Encounters covered swamp boat in Honey Island Swamp",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "6953SWAMP",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour/d675-6953SWAMP?pid=P00306962&mcid=42383&medium=link&campaign=wno-operator-cajun-encounters&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-operator-cajun-encounters",
    officialProductUrl: "https://www.cajunencounters.com/tours/swamp-tour/",
    attributionCampaign: "wno-operator-cajun-encounters",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "55345 US-90, Slidell, LA 70461",
      primaryBoardingWharfOrDock: "Cajun Encounters Honey Island Dock — 55345 US-90, Slidell, LA 70461",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Self-drive SKU—no hotel pickup unless you select 6953SWAMPTRANS.",
      sourceUrl: "https://www.cajunencounters.com/tours/swamp-tour/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "22-passenger covered flat-bottomed swamp boat",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:cajun-encounters:honey-island-with-transport",
    productSlug: "cajun-encounters-honey-island-with-transport",
    wnoPublicTourPath: "/operators/cajun-encounters",
    operatorId: "operator:cajun-encounters",
    operatorSlug: "cajun-encounters",
    operatorName: "Cajun Encounters Tour Company",
    primaryPlaceId: "place:honey-island",
    placeSlug: "honey-island",
    categorySlug: "swamp-and-airboat-tours",
    title: "Honey Island Swamp Covered Boat Tour with New Orleans Hotel Pickup",
    summary:
      "Round-trip narrated shuttle from Downtown/French Quarter commercial hotels across Lake Pontchartrain to Slidell for a 2-hour covered Honey Island Swamp boat tour.",
    durationLabel: "4 hours 15 mins door-to-door",
    durationMinutes: 255,
    typicalDepartureTimes: ["08:00", "10:15", "12:45"],
    fromPriceUsd: 65,
    priceDisplayLabel: "From $65 per adult (includes hotel shuttle)",
    meetingPoint: "Designated French Quarter & Downtown commercial hotel pickup",
    pickupIncluded: true,
    pickupDetails: "Round-trip bus pickup from commercial Downtown/FQ hotels ~80m before boat launch.",
    accessibilityNotes: "Shuttle bus + covered flat-bottomed swamp boat.",
    participantRestrictions: "All ages welcome; commercial hotel lobbies only.",
    image: "/images/portfolio/nola-covered-swamp-boat.webp",
    imageAlt: "Honey Island Swamp covered boat tour with New Orleans transportation",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "6953SWAMPTRANS",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour-With-Transport/d675-6953SWAMPTRANS?pid=P00306962&mcid=42383&medium=link&campaign=wno-operator-cajun-encounters&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-operator-cajun-encounters",
    officialProductUrl: "https://www.cajunencounters.com/tours/swamp-tour/",
    attributionCampaign: "wno-operator-cajun-encounters",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "55345 US-90, Slidell, LA 70461",
      primaryBoardingWharfOrDock:
        "Downtown/FQ Hotel Shuttle -> Cajun Encounters Honey Island Dock (55345 US-90, Slidell)",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Select your commercial hotel pickup stop during Viator checkout.",
      sourceUrl: "https://www.cajunencounters.com/tours/swamp-tour/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Round-trip hotel bus + 22-passenger covered swamp boat",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- CAJUN PRIDE SWAMP TOURS (MANCHAC / LAPLACE) ---
  {
    productId: "product:cajun-pride:manchac-drive-out",
    productSlug: "cajun-pride-manchac-swamp-boat",
    wnoPublicTourPath: "/operators/cajun-pride-swamp-tours",
    operatorId: "operator:cajun-pride-swamp-tours",
    operatorSlug: "cajun-pride-swamp-tours",
    operatorName: "Cajun Pride Swamp Tours",
    primaryPlaceId: "place:manchac",
    placeSlug: "manchac",
    categorySlug: "swamp-and-airboat-tours",
    title: "Manchac Private Wildlife Refuge Covered Swamp Boat Tour (Self-Drive)",
    summary:
      "95-minute covered pontoon swamp boat excursion through Cajun Pride's private Manchac Swamp wildlife refuge off Frenier Rd in LaPlace.",
    durationLabel: "1 hour 35 mins on water",
    durationMinutes: 95,
    typicalDepartureTimes: ["09:30", "12:00", "14:15", "16:15"],
    fromPriceUsd: 32,
    priceDisplayLabel: "From $32 per adult (self-drive)",
    meetingPoint: "110 Frenier Rd, LaPlace, LA 70068",
    pickupIncluded: false,
    pickupDetails: "Self-drive check-in 20–30 minutes early off I-10 Exit 209.",
    accessibilityNotes: "Flat-deck covered pontoon boat with shaded seating.",
    participantRestrictions: "All ages welcome.",
    image: "/images/portfolio/bayou-alligator-tour.webp",
    imageAlt: "Cajun Pride covered swamp boat in Manchac Swamp",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "141126P1",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Drive-Out-Swamp-Tour/d675-141126P1?pid=P00306962&mcid=42383&medium=link&campaign=wno-operator-cajun-pride-swamp-tours&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-operator-cajun-pride-swamp-tours",
    officialProductUrl: "https://www.cajunprideswamptours.com/tours/swamp-tours",
    attributionCampaign: "wno-operator-cajun-pride-swamp-tours",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "110 Frenier Rd, LaPlace, LA 70068",
      primaryBoardingWharfOrDock: "Cajun Pride Private Refuge Dock — 110 Frenier Rd, LaPlace, LA 70068",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 25,
      voucherConfirmationRule: "Self-drive SKU—select 141126P2 if you need New Orleans hotel shuttle transport.",
      sourceUrl: "https://www.cajunprideswamptours.com/tours/swamp-tours",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Covered pontoon swamp boat",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:cajun-pride:manchac-with-transport",
    productSlug: "cajun-pride-manchac-with-transport",
    wnoPublicTourPath: "/operators/cajun-pride-swamp-tours",
    operatorId: "operator:cajun-pride-swamp-tours",
    operatorSlug: "cajun-pride-swamp-tours",
    operatorName: "Cajun Pride Swamp Tours",
    primaryPlaceId: "place:manchac",
    placeSlug: "manchac",
    categorySlug: "swamp-and-airboat-tours",
    title: "Manchac Swamp Covered Boat Tour with New Orleans Shuttle",
    summary:
      "Round-trip shuttle transfer from Downtown/French Quarter hotels across the Bonnet Carré Spillway to Cajun Pride's private Manchac wildlife refuge.",
    durationLabel: "3 hours 45 mins door-to-door",
    durationMinutes: 225,
    typicalDepartureTimes: ["08:15", "10:45", "13:00"],
    fromPriceUsd: 62,
    priceDisplayLabel: "From $62 per adult (includes hotel shuttle)",
    meetingPoint: "Downtown / French Quarter commercial hotel pickup",
    pickupIncluded: true,
    pickupDetails: "Commercial hotel pickup ~75 minutes before boat time.",
    accessibilityNotes: "Shuttle + flat-deck covered pontoon swamp boat.",
    participantRestrictions: "All ages welcome.",
    image: "/images/portfolio/bayou-alligator-tour.webp",
    imageAlt: "Manchac Swamp covered tour boat with shuttle from New Orleans",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "141126P2",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Swamp-Tour-with-Transportation/d675-141126P2?pid=P00306962&mcid=42383&medium=link&campaign=wno-operator-cajun-pride-swamp-tours&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-operator-cajun-pride-swamp-tours",
    officialProductUrl: "https://www.cajunprideswamptours.com/tours/swamp-tours",
    attributionCampaign: "wno-operator-cajun-pride-swamp-tours",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "110 Frenier Rd, LaPlace, LA 70068",
      primaryBoardingWharfOrDock:
        "Downtown/FQ Hotel Shuttle -> Cajun Pride Private Refuge Dock (110 Frenier Rd, LaPlace)",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Confirm hotel pickup stop during Viator checkout.",
      sourceUrl: "https://www.cajunprideswamptours.com/tours/swamp-tours",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Round-trip hotel shuttle + covered pontoon swamp boat",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- LOUISIANA TOUR COMPANY & JEAN LAFITTE SWAMP TOURS ---
  {
    productId: "product:ltc:large-airboat-15200p1",
    productSlug: "large-airboat-swamp-adventure",
    wnoPublicTourPath: "/tours/large-airboat-swamp-adventure",
    operatorId: "operator:louisiana-tour-company",
    operatorSlug: "louisiana-tour-company",
    operatorName: "Louisiana Tour Company",
    primaryPlaceId: "place:jean-lafitte",
    placeSlug: "jean-lafitte",
    categorySlug: "swamp-and-airboat-tours",
    title: "16-Passenger Large Airboat Swamp Tour (9706 Barataria Blvd)",
    summary:
      "1h 40m stadium-seating 16-passenger airboat tour departing 9706 Barataria Blvd in Marrero / Crown Point—suited for groups of 7–16 wanting a single airboat hull.",
    durationLabel: "1 hour 40 mins on water (check in 30m prior)",
    durationMinutes: 100,
    typicalDepartureTimes: ["09:40", "12:10", "14:10", "16:15"],
    fromPriceUsd: 65,
    priceDisplayLabel: "From $65 per adult (self-drive)",
    meetingPoint: "9706 Barataria Blvd, Marrero, LA 70072",
    pickupIncluded: false,
    pickupDetails: "Self-drive / rideshare to 9706 Barataria Blvd; for hotel pickup choose 15200P6.",
    accessibilityNotes: "Stadium-seating open airboat.",
    participantRestrictions: "Minimum age 5; no pregnant riders or neck/back injuries.",
    image: "/images/wno/airboat-swamp-tour.webp",
    imageAlt: "16-passenger stadium airboat on Barataria bayou",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "15200P1",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Large-Airboat-Swamp-Tour/d675-15200P1",
    officialProductUrl: "https://www.louisianaswamp.com/",
    attributionCampaign: "wno-large-airboat-swamp-adventure",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "9706 Barataria Blvd, Marrero, LA 70072",
      primaryBoardingWharfOrDock:
        "Louisiana Tour Company Dock — 9706 Barataria Blvd, Marrero, LA 70072",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Self-drive SKU—arrive 30m early at 9706 Barataria Blvd.",
      sourceUrl: "https://www.louisianaswamp.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "16-passenger stadium-seating airboat",
    minimumAgeYears: 5,
    airboatNoiseAndHealthAdvisory: "Minimum age 5; no pregnancy or neck/back injuries.",
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:ltc:swamp-tour-hotel-pickup-15200p6",
    productSlug: "louisiana-tour-company-swamp-tour-hotel-pickup",
    wnoPublicTourPath: "/tours/louisiana-tour-company-swamp-tour-hotel-pickup",
    operatorId: "operator:louisiana-tour-company",
    operatorSlug: "louisiana-tour-company",
    operatorName: "Louisiana Tour Company",
    primaryPlaceId: "place:jean-lafitte",
    placeSlug: "jean-lafitte",
    categorySlug: "swamp-and-airboat-tours",
    title: "Barataria Swamp Boat & Airboat Tour with Downtown Hotel Pickup",
    summary:
      "3h 45m door-to-door Barataria wetland excursion including round-trip commercial hotel pickup from Downtown New Orleans and the French Quarter.",
    durationLabel: "3 hours 45 mins door-to-door",
    durationMinutes: 225,
    typicalDepartureTimes: ["08:00", "10:15", "12:15"],
    fromPriceUsd: 79,
    priceDisplayLabel: "From $79 per adult (includes hotel pickup)",
    meetingPoint: "Downtown / French Quarter commercial hotel pickup",
    pickupIncluded: true,
    pickupDetails: "Round-trip shuttle from commercial Downtown/FQ hotels to 9706 Barataria Blvd.",
    accessibilityNotes: "Select covered swamp boat option at checkout for all-ages / gentler boarding.",
    participantRestrictions: "Airboat option enforces age 5+ minimum; covered boat welcomes all ages.",
    image: "/images/wno/small-boat-swamp-tour.webp",
    imageAlt: "Louisiana Tour Company swamp tour with hotel pickup",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "15200P6",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Swamp-Tour-Adventure/d675-15200P6",
    officialProductUrl: "https://www.louisianaswamp.com/",
    attributionCampaign: "wno-ltc-hotel-pickup",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "9706 Barataria Blvd, Marrero, LA 70072",
      primaryBoardingWharfOrDock:
        "Downtown/FQ Hotel Pickup -> Louisiana Tour Company Dock (9706 Barataria Blvd, Marrero)",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Confirm hotel pickup time and boat type (covered vs. airboat) on voucher.",
      sourceUrl: "https://www.louisianaswamp.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Hotel shuttle + covered swamp boat or small airboat",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:jlst:drive-out-covered-boat",
    productSlug: "jean-lafitte-covered-swamp-boat-drive-out",
    wnoPublicTourPath: "/operators/jean-lafitte-swamp-tours",
    operatorId: "operator:jean-lafitte-swamp-tours",
    operatorSlug: "jean-lafitte-swamp-tours",
    operatorName: "Jean Lafitte Swamp Tour",
    primaryPlaceId: "place:jean-lafitte",
    placeSlug: "jean-lafitte",
    categorySlug: "swamp-and-airboat-tours",
    title: "Jean Lafitte Covered Bayou Swamp Boat Tour (Self-Drive Marrero)",
    summary:
      "90-minute shaded covered barge-style swamp tour departing 6601 Leo Kerner Lafitte Pkwy in Marrero along cypress bayous bordering the Barataria Preserve.",
    durationLabel: "1 hour 30 mins on water",
    durationMinutes: 90,
    typicalDepartureTimes: ["10:00", "12:00", "14:00"],
    fromPriceUsd: 36,
    priceDisplayLabel: "From $36 per adult (self-drive)",
    meetingPoint: "6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072",
    pickupIncluded: false,
    pickupDetails: "Self-drive only (hotel-pickup SKU remains held pending operator shuttle confirmation).",
    accessibilityNotes: "Shaded flat-deck covered bayou boat.",
    participantRestrictions: "All ages welcome.",
    image: "/images/portfolio/jean-lafitte-bayou.webp",
    imageAlt: "Covered bayou tour boat along Jean Lafitte corridor",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.jeanlafitteswamptour.com/",
    attributionCampaign: "wno-jlst-drive-out",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072",
      primaryBoardingWharfOrDock:
        "Jean Lafitte Swamp Tour Dock — 6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072",
      companionOrAlternateBoardingRule:
        "Separate from the federal NPS Barataria Preserve Visitor Center at 6588 Barataria Blvd.",
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Navigate specifically to 6601 Leo Kerner Lafitte Pkwy, Marrero.",
      sourceUrl: "https://www.jeanlafitteswamptour.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Covered flat-bottomed swamp boat",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- SOUTHERN STYLE TOURS ---
  {
    productId: "product:southern-style:city-tour-three-hour",
    productSlug: "city-tour-three-hour",
    wnoPublicTourPath: "/tours/city-tour-three-hour",
    operatorId: "operator:southern-style-tours",
    operatorSlug: "southern-style-tours",
    operatorName: "Southern Style Tours",
    primaryPlaceId: "place:french-quarter",
    placeSlug: "french-quarter",
    categorySlug: "city-and-garden-district-sightseeing",
    title: "3-Hour Small-Bus New Orleans City, Cemetery & Garden District Tour",
    summary:
      "Three-hour 13–25 passenger minibus sightseeing tour with direct Downtown/French Quarter hotel pickup covering Treme, Esplanade Ave, historic cemetery architecture, City Park beignet stop, Lake Pontchartrain, and the Garden District.",
    durationLabel: "3 hours (with hotel pickup)",
    durationMinutes: 180,
    typicalDepartureTimes: ["09:00", "13:00"],
    fromPriceUsd: 50,
    priceDisplayLabel: "From $50 per adult (includes hotel pickup)",
    meetingPoint: "Direct French Quarter, CBD & Warehouse District commercial hotel pickup",
    pickupIncluded: true,
    pickupDetails: "Minibus picks up directly at your commercial hotel curb 30–40m before start.",
    accessibilityNotes: "2–3 minibus steps; short optional photo/beignet stops.",
    participantRestrictions: "All ages welcome.",
    image: "/images/portfolio/garden-district-mansion.webp",
    imageAlt: "Historic New Orleans avenue visited on 3-hour minibus tour",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "8013P1",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Three-Hour-City-Tour-of-New-Orleans/d675-8013P1",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/southernstyletours/items/16614/?asn=aktourcenter&full-items=yes",
    fareharborAsn: "aktourcenter",
    officialProductUrl: "https://southernstyletours.com/",
    attributionCampaign: "wno-city-tour-three-hour",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "Commercial hotel pickup only (no walk-up booth)",
      primaryBoardingWharfOrDock:
        "Assigned Downtown, French Quarter, or Warehouse District hotel lobby curb",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Provide hotel name at checkout and confirm exact pickup window with Southern Style Tours.",
      sourceUrl: "https://southernstyletours.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "13–25 passenger air-conditioned minibus",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:southern-style:oak-alley-and-whitney-or-laura",
    productSlug: "oak-alley-and-laura-or-whitney-minibus",
    wnoPublicTourPath: "/operators/southern-style-tours",
    operatorId: "operator:southern-style-tours",
    operatorSlug: "southern-style-tours",
    operatorName: "Southern Style Tours",
    primaryPlaceId: "place:river-road",
    placeSlug: "river-road",
    categorySlug: "river-road-history-excursions",
    visitedHistoricSiteIds: [
      "place:whitney-plantation",
      "place:oak-alley-plantation",
      "place:laura-plantation",
    ],
    title: "Small-Bus River Road Historical Excursion (Whitney, Laura or Oak Alley)",
    summary:
      "Direct hotel-pickup minibus excursion along LA-18 pairing single-site or dual-site admission at Whitney Plantation, Laura Plantation, or Oak Alley Plantation with narrated historical context.",
    durationLabel: "5.5 to 8.5 hours depending on 1-site vs. 2-site selection",
    durationMinutes: 360,
    typicalDepartureTimes: ["08:15", "11:45"],
    fromPriceUsd: 85,
    priceDisplayLabel: "From $85 per adult (includes admission & hotel pickup)",
    meetingPoint: "Direct French Quarter / Downtown commercial hotel pickup",
    pickupIncluded: true,
    pickupDetails: "Hotel lobby curb pickup in 13–25 passenger minibus.",
    accessibilityNotes: "Outdoor walking at historic sites; Whitney closed Tuesdays.",
    participantRestrictions: "All ages welcome.",
    image: "/images/portfolio/laura-plantation.webp",
    imageAlt: "Laura Plantation historic Creole manor on River Road",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "official_operator_website",
    fareharborDirectUrl:
      "https://fareharbor.com/embeds/book/southernstyletours/?asn=aktourcenter&full-items=yes",
    fareharborAsn: "aktourcenter",
    officialProductUrl: "https://southernstyletours.com/",
    attributionCampaign: "wno-southern-style-river-road",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "Commercial hotel pickup only",
      primaryBoardingWharfOrDock:
        "Downtown / French Quarter commercial hotel curb -> LA-18 historic site entrance(s)",
      companionOrAlternateBoardingRule:
        "On-site historical interpretation is operated independently by Whitney Plantation, Laura Plantation, and Oak Alley Foundation.",
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Verify selected historic site(s) and Tuesday Whitney closure before booking.",
      sourceUrl: "https://southernstyletours.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "13–25 passenger minibus + museum admission",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:cajun-encounters:oak-alley-laura-river-road",
    productSlug: "cajun-encounters-river-road-plantation-bus",
    wnoPublicTourPath: "/operators/cajun-encounters",
    operatorId: "operator:cajun-encounters",
    operatorSlug: "cajun-encounters",
    operatorName: "Cajun Encounters Tour Company",
    primaryPlaceId: "place:river-road",
    placeSlug: "river-road",
    categorySlug: "river-road-history-excursions",
    visitedHistoricSiteIds: [
      "place:oak-alley-plantation",
      "place:laura-plantation",
    ],
    title: "Oak Alley & Laura Creole Heritage Motorcoach Excursion with Hotel Pickup",
    summary:
      "Round-trip Cajun Encounters motorcoach transfer from Downtown/French Quarter hotels to Vacherie along LA-18 with timed guided admission at Laura Plantation or Oak Alley Plantation.",
    durationLabel: "5 hours 30 mins door-to-door",
    durationMinutes: 330,
    typicalDepartureTimes: ["08:30", "12:00"],
    fromPriceUsd: 82,
    priceDisplayLabel: "From $82 per adult (includes hotel shuttle & site entry)",
    meetingPoint: "Designated Downtown & French Quarter commercial hotel pickup",
    pickupIncluded: true,
    pickupDetails: "Commercial hotel pickup ~45–60m prior to highway departure.",
    accessibilityNotes: "Motorcoach + outdoor guided walking on historic estate grounds.",
    participantRestrictions: "All ages welcome.",
    image: "/images/portfolio/laura-plantation.webp",
    imageAlt: "Laura Plantation Creole architecture in Vacherie, Louisiana",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.cajunencounters.com/tours/plantation-tours/",
    attributionCampaign: "wno-cajun-encounters-river-road",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "Downtown/French Quarter hotel pickup loop",
      primaryBoardingWharfOrDock:
        "Confirmed commercial hotel pickup stop -> LA-18 Vacherie Visitor Center",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Confirm selected site (Oak Alley vs. Laura) and hotel pickup stop on confirmation.",
      sourceUrl: "https://www.cajunencounters.com/tours/plantation-tours/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Climate-controlled sightseeing coach + museum entry",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- HAUNTED HISTORY, FRENCH QUARTER PHANTOMS, DOCTOR GUMBO, CITY SIGHTSEEING, KAYAK ---
  {
    productId: "product:haunted-history:ghost-tour-3252-1",
    productSlug: "haunted-history-french-quarter-ghost-walk",
    wnoPublicTourPath: "/operators/haunted-history-tours",
    operatorId: "operator:haunted-history-tours",
    operatorSlug: "haunted-history-tours",
    operatorName: "Haunted History Tours",
    primaryPlaceId: "place:french-quarter",
    placeSlug: "french-quarter",
    categorySlug: "ghost-vampire-and-history-walks",
    title: "Haunted History French Quarter Ghost Tour",
    summary:
      "Two-hour licensed evening walking tour examining documented French Quarter haunts, LaLaurie Mansion history, and Vieux Carré legends.",
    durationLabel: "2 hours",
    durationMinutes: 120,
    typicalDepartureTimes: ["17:00", "19:15", "20:00"],
    fromPriceUsd: 30,
    priceDisplayLabel: "From $30 per person",
    meetingPoint: "723 St. Peter St, New Orleans, LA 70116",
    pickupIncluded: false,
    pickupDetails: "Walk-up French Quarter meeting point near Jackson Square.",
    accessibilityNotes: "~1 mile flat walking with storytelling stops.",
    participantRestrictions: "All ages welcome (parental guidance for dark historical themes).",
    image: "/images/portfolio/royal-street-balconies.webp",
    imageAlt: "French Quarter evening streetscape on Haunted History Ghost Tour",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "3252_1",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Haunted-History-Ghost-Tour/d675-3252_1?pid=P00306962&mcid=42383&medium=link&campaign=wno-operator-haunted-history-tours&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-operator-haunted-history-tours",
    officialProductUrl: "https://hauntedhistorytours.com/our-tours/",
    attributionCampaign: "wno-operator-haunted-history-tours",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "723 St. Peter St, New Orleans, LA 70116",
      primaryBoardingWharfOrDock: "723 St. Peter St (Rev. Zombie's Voodoo Shop courtyard/front)",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Confirm 723 St. Peter St meeting location on your confirmation.",
      sourceUrl: "https://hauntedhistorytours.com/our-tours/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Guided French Quarter walking tour",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:haunted-history:vampire-tour-3252-5",
    productSlug: "haunted-history-vampire-walk",
    wnoPublicTourPath: "/operators/haunted-history-tours",
    operatorId: "operator:haunted-history-tours",
    operatorSlug: "haunted-history-tours",
    operatorName: "Haunted History Tours",
    primaryPlaceId: "place:french-quarter",
    placeSlug: "french-quarter",
    categorySlug: "ghost-vampire-and-history-walks",
    title: "New Orleans Vampire Folklore & History Walking Tour",
    summary:
      "Evening walking tour through the French Quarter exploring casket-girls lore, literary vampire sites, and nocturnal tavern stops.",
    durationLabel: "2 hours",
    durationMinutes: 120,
    typicalDepartureTimes: ["20:00"],
    fromPriceUsd: 30,
    priceDisplayLabel: "From $30 per person",
    meetingPoint: "Front gates of St. Louis Cathedral / Jackson Square (Chartres St)",
    pickupIncluded: false,
    pickupDetails: "Walk-up Jackson Square meeting point.",
    accessibilityNotes: "~1 mile flat walking.",
    participantRestrictions: "Bring valid ID if purchasing optional tavern drinks.",
    image: "/images/portfolio/royal-street-balconies.webp",
    imageAlt: "French Quarter Jackson Square evening walk",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "3252_5",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Vampire-Tour/d675-3252_5?pid=P00306962&mcid=42383&medium=link&campaign=wno-operator-haunted-history-tours&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-operator-haunted-history-tours",
    officialProductUrl: "https://hauntedhistorytours.com/our-tours/",
    attributionCampaign: "wno-operator-haunted-history-tours",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "723 St. Peter St, New Orleans, LA 70116",
      primaryBoardingWharfOrDock: "St. Louis Cathedral Front Gates — 615 Pere Antoine Alley / Jackson Square",
      companionOrAlternateBoardingRule:
        "Note: Vampire Tour meets at St. Louis Cathedral gates rather than 723 St. Peter St—always check your voucher.",
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Check exact Jackson Square / St. Peter meeting pin on voucher.",
      sourceUrl: "https://hauntedhistorytours.com/our-tours/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Guided French Quarter walking tour",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:fqp:ghost-and-vampire-walk",
    productSlug: "french-quarter-phantoms-ghost-vampire-walk",
    wnoPublicTourPath: "/operators/french-quarter-phantoms",
    operatorId: "operator:french-quarter-phantoms",
    operatorSlug: "french-quarter-phantoms",
    operatorName: "French Quarter Phantoms",
    primaryPlaceId: "place:french-quarter",
    placeSlug: "french-quarter",
    categorySlug: "ghost-vampire-and-history-walks",
    title: "Ghost & Vampire Walking Tour of the French Quarter",
    summary:
      "1h 45m master-storyteller evening walk departing 718 N. Rampart St through the lower and central Vieux Carré.",
    durationLabel: "1 hour 45 mins",
    durationMinutes: 105,
    typicalDepartureTimes: ["18:00", "20:00"],
    fromPriceUsd: 29,
    priceDisplayLabel: "From $29 per person",
    meetingPoint: "The Voodoo Lounge — 718 N. Rampart St, New Orleans, LA 70116",
    pickupIncluded: false,
    pickupDetails: "Walk-up check-in 15m prior across from Louis Armstrong Park.",
    accessibilityNotes: "~1 mile flat French Quarter sidewalks.",
    participantRestrictions: "Recommended ages 6+; bring photo ID for optional 21+ bar stop.",
    image: "/images/portfolio/royal-street-balconies.webp",
    imageAlt: "French Quarter evening lanterns along Rampart and Royal",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.frenchquarterphantoms.com/ghost-and-vampire-tour",
    attributionCampaign: "wno-french-quarter-phantoms",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "718 N. Rampart St, New Orleans, LA 70116",
      primaryBoardingWharfOrDock: "The Voodoo Lounge — 718 N. Rampart St (at Orleans Ave)",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Check in 15 minutes early at 718 N. Rampart St.",
      sourceUrl: "https://www.frenchquarterphantoms.com/ghost-and-vampire-tour",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Guided French Quarter walking tour",
    minimumAgeYears: 6,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:doctor-gumbo:food-history-walk",
    productSlug: "doctor-gumbo-food-history-tour",
    wnoPublicTourPath: "/operators/doctor-gumbo-tours",
    operatorId: "operator:doctor-gumbo-tours",
    operatorSlug: "doctor-gumbo-tours",
    operatorName: "Doctor Gumbo Tours",
    primaryPlaceId: "place:french-quarter",
    placeSlug: "french-quarter",
    categorySlug: "food-and-cocktail-walks",
    title: "New Orleans Food & History Tasting Walk",
    summary:
      "Three-hour guided culinary history walk visiting 5–6 classic French Quarter food stops (gumbo, brisket/po-boys, muffuletta, pralines, and hot sauce tastings).",
    durationLabel: "3 hours",
    durationMinutes: 180,
    typicalDepartureTimes: ["13:30"],
    fromPriceUsd: 79,
    priceDisplayLabel: "From $79 per person (food tastings included)",
    meetingPoint: "316 Chartres St, New Orleans, LA 70130",
    pickupIncluded: false,
    pickupDetails: "Walk-up French Quarter meeting point.",
    accessibilityNotes: "~1.2 miles walking with indoor tasting stops.",
    participantRestrictions: "Notify operator ahead of booking for dietary allergies.",
    image: "/images/portfolio/classic-cocktails-nola.webp",
    imageAlt: "French Quarter culinary and history tasting stop",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "6484NOLAFOOD",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/New-Orleans-Food-and-History-Tour/d675-6484NOLAFOOD?pid=P00306962&mcid=42383&medium=link&campaign=wno-operator-doctor-gumbo-tours&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-operator-doctor-gumbo-tours",
    officialProductUrl: "https://doctorgumbo.com/tours/",
    attributionCampaign: "wno-operator-doctor-gumbo-tours",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "316 Chartres St, New Orleans, LA 70130",
      primaryBoardingWharfOrDock: "316 Chartres St (SoBou / Chartres meeting stop — verify on voucher)",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "Confirm exact Chartres St restaurant meeting address on voucher.",
      sourceUrl: "https://doctorgumbo.com/tours/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Guided culinary tasting walk",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:doctor-gumbo:combo-cocktail-food-walk",
    productSlug: "doctor-gumbo-combo-cocktail-food-tour",
    wnoPublicTourPath: "/operators/doctor-gumbo-tours",
    operatorId: "operator:doctor-gumbo-tours",
    operatorSlug: "doctor-gumbo-tours",
    operatorName: "Doctor Gumbo Tours",
    primaryPlaceId: "place:french-quarter",
    placeSlug: "french-quarter",
    categorySlug: "food-and-cocktail-walks",
    title: "Combo Cocktail & Food History Walking Tour (21+)",
    summary:
      "3.5-to-4-hour French Quarter culinary and craft-cocktail tour pairing classic Creole dishes with full-sized historic New Orleans cocktails.",
    durationLabel: "3 hours 30 mins",
    durationMinutes: 210,
    typicalDepartureTimes: ["14:00"],
    fromPriceUsd: 135,
    priceDisplayLabel: "From $135 per adult (food + craft cocktails included)",
    meetingPoint: "316 Chartres St / 730 Bienville St, New Orleans, LA 70130",
    pickupIncluded: false,
    pickupDetails: "Walk-up French Quarter meeting point.",
    accessibilityNotes: "~1.3 miles walking across flat Quarter blocks.",
    participantRestrictions: "Strictly 21+ with valid physical government photo ID.",
    image: "/images/portfolio/classic-cocktails-nola.webp",
    imageAlt: "Craft cocktails and Creole cuisine in the French Quarter",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "6484P3",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Combo-Cocktail-and-Food-History-Tour/d675-6484P3?pid=P00306962&mcid=42383&medium=link&campaign=wno-operator-doctor-gumbo-tours&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-operator-doctor-gumbo-tours",
    officialProductUrl: "https://doctorgumbo.com/tours/",
    attributionCampaign: "wno-operator-doctor-gumbo-tours",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "316 Chartres St, New Orleans, LA 70130",
      primaryBoardingWharfOrDock: "316 Chartres St / 730 Bienville St (verify exact start bar on voucher)",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 15,
      voucherConfirmationRule: "21+ photo ID mandatory; confirm starting venue on voucher.",
      sourceUrl: "https://doctorgumbo.com/tours/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Guided 21+ culinary & cocktail walk",
    minimumAgeYears: 21,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:city-sightseeing:hop-on-hop-off-5694nohoho",
    productSlug: "city-sightseeing-hop-on-hop-off",
    wnoPublicTourPath: "/operators/city-sightseeing-new-orleans",
    operatorId: "operator:city-sightseeing-new-orleans",
    operatorSlug: "city-sightseeing-new-orleans",
    operatorName: "City Sightseeing New Orleans",
    primaryPlaceId: "place:french-quarter",
    placeSlug: "french-quarter",
    categorySlug: "city-and-garden-district-sightseeing",
    title: "New Orleans Open-Top Hop-On Hop-Off Sightseeing Pass (18 Stops)",
    summary:
      "Live-guided open-top double-decker sightseeing loop connecting Jackson Square, French Market, Tremé / Basin St Station, WWII Museum, Warehouse District, and Garden District (~30m headway).",
    durationLabel: "2-hour full loop (1-, 2-, or 3-day unlimited pass)",
    durationMinutes: 120,
    typicalDepartureTimes: ["09:30", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"],
    fromPriceUsd: 44,
    priceDisplayLabel: "From $44 per adult (1-day pass)",
    meetingPoint: "Stop 5 Jackson Square (Decatur St) or Stop 1 Basin St Station (501 Basin St)",
    pickupIncluded: false,
    pickupDetails: "Board at any of the 18 official route stops between 9:30 AM and 4:00 PM.",
    accessibilityNotes: "Lower deck wheelchair-accessible; upper deck open-air via stairs.",
    participantRestrictions: "All ages welcome; no full-size cruise suitcases on buses.",
    image: "/images/portfolio/garden-district-mansion.webp",
    imageAlt: "New Orleans avenue stops along Hop-On Hop-Off bus loop",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "5694NOHOHO",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/City-Sightseeing-New-Orleans-Hop-On-Hop-Off-Tour/d675-5694NOHOHO?pid=P00306962&mcid=42383&medium=link&campaign=wno-operator-city-sightseeing-new-orleans&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-operator-city-sightseeing-new-orleans",
    officialProductUrl: "https://citysightseeingneworleans.com/tours/hop-on-hop-off/",
    attributionCampaign: "wno-operator-city-sightseeing-new-orleans",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "501 Basin St, New Orleans, LA 70112 (Basin St Station)",
      primaryBoardingWharfOrDock:
        "Any of 18 official stops (primary desks at Stop 1 Basin St Station & Stop 5 Jackson Square)",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 10,
      voucherConfirmationRule: "Check final full-loop departure (~4:00 PM) and parade-day route detours.",
      sourceUrl: "https://citysightseeingneworleans.com/tours/hop-on-hop-off/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Open-top double-decker sightseeing bus",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:nola-kayak:manchac-wildlife-kayak-22050p2",
    productSlug: "manchac-wildlife-kayak-tour",
    wnoPublicTourPath: "/operators/new-orleans-kayak-swamp-tours",
    operatorId: "operator:new-orleans-kayak-swamp-tours",
    operatorSlug: "new-orleans-kayak-swamp-tours",
    operatorName: "New Orleans Kayak Swamp Tours",
    primaryPlaceId: "place:manchac",
    placeSlug: "manchac",
    categorySlug: "swamp-and-airboat-tours",
    title: "Manchac Mystic Waterway Guided Swamp Kayak Tour",
    summary:
      "Two-hour silent guided flatwater kayak paddle beneath bald-cypress canopy in the Manchac / Ruddock wetland corridor—with optional French Quarter van shuttle.",
    durationLabel: "2 hours on water (~3h 45m with shuttle)",
    durationMinutes: 120,
    typicalDepartureTimes: ["09:00", "11:30", "14:00"],
    fromPriceUsd: 69,
    priceDisplayLabel: "From $69 per person (self-drive; shuttle option available)",
    meetingPoint: "Manchac / Ruddock Launch (US-51 off I-55 Exit 7) or FQ van pickup",
    pickupIncluded: true,
    pickupDetails: "Select 'With Transportation' for central French Quarter pickup or self-drive to Ruddock launch.",
    accessibilityNotes: "Requires active flatwater paddling in single or tandem kayak.",
    participantRestrictions: "Ages 6+ (minors accompanied by adult); per-seat weight limits apply.",
    image: "/images/portfolio/jean-lafitte-bayou.webp",
    imageAlt: "Silent cypress bayou waterway for guided swamp kayaking",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "22050P2",
    viatorOfficialUrl:
      "https://www.viator.com/tours/New-Orleans/Manchac-Mystic-Wildlife-Kayak-Tour/d675-22050P2?pid=P00306962&mcid=42383&medium=link&campaign=wno-operator-new-orleans-kayak-swamp-tours&utm_source=welcometoneworleanstours.com&utm_medium=affiliate&utm_campaign=wno-operator-new-orleans-kayak-swamp-tours",
    officialProductUrl: "https://neworleanskayakswamptours.com/tours/",
    attributionCampaign: "wno-operator-new-orleans-kayak-swamp-tours",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "Manchac / Ruddock Canal Launch, LaPlace, LA",
      primaryBoardingWharfOrDock:
        "Ruddock Historic Canal Kayak Put-In (off I-55 Exit 7 / US-51) or central FQ shuttle stop",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 20,
      voucherConfirmationRule: "Confirm self-drive launch pin vs. French Quarter van pickup address on voucher.",
      sourceUrl: "https://neworleanskayakswamptours.com/tours/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Single & tandem eco-tour kayaks",
    minimumAgeYears: 6,
    luggageCompatibleForTurnaround: false,
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },

  // --- 2 HELD TOUR SKUS (HeldTourSkuQueue — excluded from sitemaps & active checkout) ---
  {
    productId: "product:jlst:held-hotel-pickup",
    productSlug: "jeanlafitte-swamp-tour-with-hotel-pickup",
    wnoPublicTourPath: "/tours/jeanlafitte-swamp-tour-with-hotel-pickup",
    operatorId: "operator:jean-lafitte-swamp-tours",
    operatorSlug: "jean-lafitte-swamp-tours",
    operatorName: "Jean Lafitte Swamp Tour",
    primaryPlaceId: "place:jean-lafitte",
    placeSlug: "jean-lafitte",
    categorySlug: "swamp-and-airboat-tours",
    title: "Jean Lafitte Swamp Tour with Hotel Pickup (Held Pending Shuttle Verification)",
    summary:
      "Held in HeldTourSkuQueue: direct hotel-shuttle variant and partner checkout mapping are paused pending direct operator confirmation.",
    durationLabel: "3 hours 30 mins",
    durationMinutes: 210,
    typicalDepartureTimes: ["09:00"],
    fromPriceUsd: null,
    priceDisplayLabel: "Checkout paused pending operator verification",
    meetingPoint: "Pending shuttle stop verification",
    pickupIncluded: true,
    pickupDetails: "Held pending confirmation.",
    accessibilityNotes: "Covered swamp boat.",
    participantRestrictions: "Held pending verification.",
    image: "/images/portfolio/jean-lafitte-bayou.webp",
    imageAlt: "Jean Lafitte swamp bayou",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "held_pending_verification",
    officialProductUrl: "https://www.jeanlafitteswamptour.com/",
    attributionCampaign: "wno-held-jeanlafitte-pickup",
    isCommerciallyHeld: true,
    commercialHoldReason:
      "Held in HeldTourSkuQueue: partner hotel-shuttle SKU mapping paused until direct operator shuttle confirmation (`truthPolicy.ts`).",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "6601 Leo Kerner Lafitte Pkwy, Marrero, LA 70072",
      primaryBoardingWharfOrDock: "Held pending hotel-shuttle route verification",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Booking disabled until verified.",
      sourceUrl: "https://www.jeanlafitteswamptour.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Covered swamp boat (held SKU)",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    productId: "product:ragin-cajun:held-covered-plantation-combo",
    productSlug: "covered-boat-plantation-combo",
    wnoPublicTourPath: "/tours/covered-boat-plantation-combo",
    operatorId: "operator:ragin-cajun-airboat-tours",
    operatorSlug: "ragin-cajun-tours",
    operatorName: "Ragin' Cajun Airboat Tours",
    primaryPlaceId: "place:river-road",
    placeSlug: "river-road",
    categorySlug: "river-road-history-excursions",
    title: "Covered Swamp Boat + Plantation Combination (Held Pending Schedule Verification)",
    summary:
      "Held in HeldTourSkuQueue: combined covered-boat and River Road site transfer schedule is paused pending current operator verification.",
    durationLabel: "7 hours 30 mins",
    durationMinutes: 450,
    typicalDepartureTimes: ["08:30"],
    fromPriceUsd: null,
    priceDisplayLabel: "Checkout paused pending operator verification",
    meetingPoint: "Pending combo transfer verification",
    pickupIncluded: true,
    pickupDetails: "Held pending confirmation.",
    accessibilityNotes: "Covered boat + historic estate walk.",
    participantRestrictions: "Held pending verification.",
    image: "/images/portfolio/whitney-plantation.webp",
    imageAlt: "River Road and bayou combination",
    imageCredit: "WNO rights-cleared portfolio library",
    bookingChannel: "held_pending_verification",
    officialProductUrl: "https://ragincajunairboattours.com/",
    attributionCampaign: "wno-held-combo",
    isCommerciallyHeld: true,
    commercialHoldReason:
      "Held in HeldTourSkuQueue: covered-boat + River Road combo schedule & FareHarbor item confirmation pending (`truthPolicy.ts`).",
    boardingLocationResolution: {
      resolutionScope: "product_and_departure_level",
      ticketOfficeAddress: "1265 LA-3127, Luling, LA 70070",
      primaryBoardingWharfOrDock: "Held pending combo transfer verification",
      companionOrAlternateBoardingRule: null,
      checkInLeadMinutes: 30,
      voucherConfirmationRule: "Booking disabled until verified.",
      sourceUrl: "https://ragincajunairboattours.com/",
      verifiedAt: VERIFIED_DATE,
    },
    vesselTypeSummary: "Covered swamp boat + River Road transfer (held SKU)",
    minimumAgeYears: null,
    luggageCompatibleForTurnaround: false,
    verifiedAt: null,
    lastModifiedAt: MODIFIED_ISO,
  },
];

export const NEW_ORLEANS_PRODUCTS: readonly NewOrleansProductRecord[] =
  RAW_NEW_ORLEANS_PRODUCTS.map((seed) => ({
    ...seed,
    departures: normalizeProductDepartureSlots({
      productId: seed.productId,
      typicalDepartureTimes: seed.typicalDepartureTimes,
      durationMinutes: seed.durationMinutes,
      pickupAvailable: seed.pickupIncluded,
      meetingPointId: null,
    }),
    productReviews: [],
  }));

// ============================================================================
// 5. AREA-CATEGORY COMPARISON INTERSECTIONS (3-PART GATE ENFORCED)
// ============================================================================

export const NEW_ORLEANS_AREA_CATEGORY_COMPARISONS: readonly NewOrleansAreaCategoryComparison[] = [
  {
    placeSlug: "jean-lafitte",
    areaName: "Jean Lafitte, Barataria & Westbank Bayous",
    categorySlug: "swamp-and-airboat-tours",
    categoryName: "Swamp Boats, Airboats & Bayou Kayaking",
    h1: "Jean Lafitte & Westbank Swamp Tours: Airboats vs. Covered Boats by Dock",
    title: "Jean Lafitte & Barataria Swamp Tours Comparison | Airboat vs Covered Boat",
    metaDescription:
      "Compare verified Westbank swamp operators across Lafitte (Airboat Adventures), Marrero (Louisiana Tour Company, Jean Lafitte Swamp Tour), and Luling (Ragin' Cajun) by boat size, age rules, and pickup.",
    comparisonIntro:
      "The Westbank Barataria and Bayou Gauche wetlands offer four completely distinct commercial dock facilities south and west of the Crescent City Connection. Choosing well requires matching vessel hull (6-passenger small airboat, 16–30 passenger stadium airboat, or all-ages shaded covered boat) and confirming whether you need a Downtown hotel shuttle.",
    keyDifferencesBullets: [
      "Airboat Adventures (5145 Fleming Park Rd, Lafitte) vs. Ragin' Cajun Airboat Tours (10090 US-90 & 1265 LA-3127, Luling) are completely separate companies in different parishes—never confuse their docks.",
      "Louisiana Tour Company (9706 Barataria Blvd, Marrero) operates 16-passenger stadium airboats (`15200P1` self-drive) alongside hotel-pickup swamp packages (`15200P6`).",
      "Families with children under 5, infants, or pregnant travelers must choose a shaded covered swamp boat (Ragin' Cajun Covered Boat or Jean Lafitte Swamp Tour), as all open airboats enforce a strict age-5+ minimum.",
    ],
    arrivalAndTimingGuidance:
      "Allow 30–55 minutes from the French Quarter (up to 75 minutes in bridge traffic) and check in 30 minutes prior. Do not rely on return Uber/Lyft from rural Lafitte or Luling docks.",
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeSlug: "manchac",
    areaName: "Manchac Swamp & Frenier (LaPlace)",
    categorySlug: "swamp-and-airboat-tours",
    categoryName: "Swamp Boats, Airboats & Bayou Kayaking",
    h1: "Manchac Swamp Tours (LaPlace): Covered Refuge Boats vs. Guided Bayou Kayaking",
    title: "Manchac Swamp Tours & Kayaking Comparison | LaPlace, LA",
    metaDescription:
      "Compare covered pontoon swamp boat tours at Cajun Pride's private refuge in LaPlace against silent guided cypress kayaking in Manchac Pass.",
    comparisonIntro:
      "Northwest of New Orleans off I-10 West and I-55, Manchac Swamp offers calmer, shaded cypress-tupelo experiences without high-noise airboat traffic—led by Cajun Pride Swamp Tours on its private Frenier wildlife refuge and New Orleans Kayak Swamp Tours in the Manchac Mystic Waterway.",
    keyDifferencesBullets: [
      "Cajun Pride Swamp Tours (110 Frenier Rd) runs all-ages covered pontoon boats with both self-drive (`141126P1`) and New Orleans hotel-shuttle (`141126P2`) options.",
      "New Orleans Kayak Swamp Tours (`22050P2`) provides an active, engine-free flatwater paddle beneath ancient cypress canopy for ages 6+.",
      "Both operators sit past the Bonnet Carré Spillway—convenient for pairing with self-drive River Road visits or afternoon MSY rental-car returns.",
    ],
    arrivalAndTimingGuidance:
      "Allow 35–55 minutes from Downtown New Orleans via I-10 West (up to 80 minutes if Spillway bridge traffic slows); return rideshares are unavailable at Frenier and Ruddock ramps.",
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeSlug: "river-road",
    areaName: "Great River Road Historic Sites & Slavery Museums",
    categorySlug: "river-road-history-excursions",
    categoryName: "River Road Slavery Museums & Historic Estates",
    h1: "River Road Historical Excursions: Whitney, Laura & Oak Alley Transportation Comparison",
    title: "River Road Museum & Plantation Tours from New Orleans | Whitney, Laura & Oak Alley",
    metaDescription:
      "Compare round-trip New Orleans transportation operators (Gray Line, Southern Style Tours, Cajun Encounters) serving Whitney Plantation, Laura Plantation, and Oak Alley.",
    comparisonIntro:
      "Whitney Plantation, Laura Plantation, and Oak Alley Plantation are independent historic sites and non-profit museums along LA-18—not bus companies. Visitors without a car choose first by historical focus and second by licensed New Orleans transportation format (full-size motorcoach vs. 13–25 passenger hotel-pickup minibus).",
    keyDifferencesBullets: [
      "Whitney Plantation (Wallace, LA; closed Tuesdays) is a 501(c)(3) museum dedicated exclusively to the lives, labor, and memorials of enslaved people in Louisiana (1752–1865).",
      "Laura Plantation (Vacherie, LA) interprets 4 generations of Creole and enslaved history across 12 National Register buildings including 1840s slave cabins; Oak Alley interprets its 28-oak landscape, Big House, and Slavery at Oak Alley quarters.",
      "Southern Style Tours picks up directly at commercial hotels in 13–25 passenger minibuses; Gray Line checks in at 400 Toulouse St (plus select hotel stops); Cajun Encounters runs coordinated hotel-shuttle coaches.",
    ],
    arrivalAndTimingGuidance:
      "Allow 5.5 hours door-to-door for single-site excursions and 8–9 hours for two-site days; there is zero return Uber/Lyft coverage in Wallace or Vacherie.",
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeSlug: "french-quarter",
    areaName: "French Quarter (Vieux Carré)",
    categorySlug: "ghost-vampire-and-history-walks",
    categoryName: "French Quarter Ghost, Vampire & Cemetery History Tours",
    h1: "French Quarter Ghost, Vampire & History Walking Tours: Operator & Meeting-Point Comparison",
    title: "French Quarter Ghost & History Walking Tours | Licensed Operators Compared",
    metaDescription:
      "Compare licensed French Quarter evening walking operators—Haunted History Tours, French Quarter Phantoms, and Gray Line—by historical focus and exact Vieux Carré meeting point.",
    comparisonIntro:
      "City of New Orleans ordinances cap French Quarter walking tour group sizes and license guides individually, yet each operator anchors at a different corner of the Quarter and emphasizes different historical material—from documented colonial fires and yellow-fever epidemics to vampire folklore.",
    keyDifferencesBullets: [
      "Haunted History Tours separates its Ghost Walk (723 St. Peter St) from its Vampire Walk (St. Louis Cathedral front gates).",
      "French Quarter Phantoms checks in at The Voodoo Lounge (718 N. Rampart St across from Louis Armstrong Park) for its 1h 45m Ghost & Vampire walk.",
      "Gray Line New Orleans departs from the riverfront Lighthouse Ticket Office at 400 Toulouse St behind JAX Brewery.",
    ],
    arrivalAndTimingGuidance:
      "No evening walking tour offers hotel pickup—leave 15–20 minutes after dinner to walk to your exact St. Peter, Rampart, Jackson Square, or Toulouse St check-in address.",
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeSlug: "french-quarter",
    areaName: "French Quarter (Vieux Carré)",
    categorySlug: "food-and-cocktail-walks",
    categoryName: "Creole Culinary & Classic Cocktail History Walks",
    h1: "French Quarter Culinary & Craft Cocktail Walking Tours Compared",
    title: "French Quarter Food & Cocktail History Tours | Doctor Gumbo & Gray Line",
    metaDescription:
      "Compare afternoon Creole food tasting walks and 21+ classic New Orleans cocktail history tours in the French Quarter.",
    comparisonIntro:
      "French Quarter culinary and cocktail walks divide sharply between daytime multi-kitchen food history tastings, 2.5-hour classic cocktail history walks, and full 3.5-hour food-plus-cocktail combinations.",
    keyDifferencesBullets: [
      "Doctor Gumbo's Food & History Walk (`6484NOLAFOOD`, 3 hours) focuses on 5–6 Creole culinary stops, while its Combo Cocktail & Food Tour (`6484P3`, 21+) includes full craft cocktails.",
      "Gray Line's Classic Cocktail Walking Tour (2.5 hours from 400 Toulouse St, 21+) focuses specifically on historic French Quarter bars and apothecary cocktail history.",
      "All alcohol-inclusive walks strictly enforce physical 21+ government photo ID checks at every historic lounge.",
    ],
    arrivalAndTimingGuidance:
      "Eat a light breakfast before afternoon tasting walks, notify the operator ahead of booking for shellfish/nut/gluten allergies, and arrive 15 minutes early.",
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
  {
    placeSlug: "french-quarter",
    areaName: "French Quarter (Vieux Carré)",
    categorySlug: "city-and-garden-district-sightseeing",
    categoryName: "City Sightseeing, Katrina Recovery & Garden District Tours",
    h1: "New Orleans City Sightseeing Tours: Motorcoach vs. Small Minibus vs. Hop-On Hop-Off",
    title: "New Orleans City Tours Compared | Gray Line, Southern Style & Hop-On Hop-Off",
    metaDescription:
      "Compare narrated 2-to-3 hour New Orleans city tours (Gray Line Super City, Southern Style hotel-pickup minibus) against 18-stop open-top Hop-On Hop-Off passes.",
    comparisonIntro:
      "Three distinct formats depart from or pick up inside the French Quarter to cover neighborhoods beyond walking range—City Park, Lake Pontchartrain Katrina levees, Esplanade Ridge, and the Garden District.",
    keyDifferencesBullets: [
      "Southern Style Tours (`8013P1`, 3 hours) uses 13–25 passenger minibuses with direct commercial hotel curb pickup and a City Park beignet stop.",
      "Gray Line's Super City Tour (`5250SUPER`, 2h 15m) departs 400 Toulouse St in a full-size highway motorcoach.",
      "City Sightseeing New Orleans (`5694NOHOHO`) runs an 18-stop open-top double-decker loop (~30-minute frequency until ~4:00 PM) so you can step off at the WWII Museum or Garden District at your own pace.",
    ],
    arrivalAndTimingGuidance:
      "For cruise turnaround mornings, confirm luggage storage before boarding—only pre-arranged motorcoach transfers can hold full suitcases under-bay.",
    verifiedAt: VERIFIED_DATE,
    lastModifiedAt: MODIFIED_ISO,
  },
];

// ============================================================================
// 6. MANDATORY INVARIANT ASSERTIONS & DIRECTORY SNAPSHOT BUILDER
// ============================================================================

export function assertMandatoryNewOrleansInvariants(): void {
  // 1. Every New Orleans operator must default to liveAvailabilityConnected=false & directCheckoutConnected=false
  for (const op of NEW_ORLEANS_OPERATORS) {
    if (isOperatorLiveAvailabilityConnected(op) || isOperatorDirectCheckoutConnected(op)) {
      throw new Error(
        `[NOLA Invariant Violation] Operator ${op.operatorId} cannot report liveAvailabilityConnected or directCheckoutConnected without verified direct supplier authorization.`,
      );
    }
  }

  // 2. Ragin' Cajun Airboat Tours and Airboat Adventures must remain strictly separate
  const ragin = NEW_ORLEANS_OPERATORS.find(
    (o) => o.operatorId === "operator:ragin-cajun-airboat-tours",
  );
  const airboatAdv = NEW_ORLEANS_OPERATORS.find(
    (o) => o.operatorId === "operator:airboat-adventures",
  );
  if (
    !ragin ||
    !airboatAdv ||
    ragin.slug === airboatAdv.slug ||
    !ragin.separateFromOperatorIds?.includes("operator:airboat-adventures") ||
    !airboatAdv.separateFromOperatorIds?.includes("operator:ragin-cajun-airboat-tours")
  ) {
    throw new Error(
      "[NOLA Invariant Violation] Ragin' Cajun Airboat Tours and Airboat Adventures must remain strictly separate canonical operators.",
    );
  }

  // 3. Whitney, Oak Alley, and Laura must be historic_site_or_museum places, never operators
  for (const historicSlug of [
    "whitney-plantation",
    "oak-alley-plantation",
    "laura-plantation",
  ]) {
    const site = NEW_ORLEANS_PLACES.find((p) => p.publicPlaceSlug === historicSlug);
    if (
      !site ||
      site.placeType !== "historic_site_or_museum" ||
      site.historicSiteGovernance?.isTransportationTourOperator !== false
    ) {
      throw new Error(
        `[NOLA Invariant Violation] ${historicSlug} must be modeled as historic_site_or_museum with isTransportationTourOperator=false.`,
      );
    }
    if (NEW_ORLEANS_OPERATORS.some((o) => o.slug === historicSlug)) {
      throw new Error(
        `[NOLA Invariant Violation] Historic site ${historicSlug} must not be modeled as a transportation operator.`,
      );
    }
  }

  // 4. Steamboat Company vs. NATCHEZ & CITY of NEW ORLEANS boarding wharf resolution
  const steamboatCo = NEW_ORLEANS_OPERATORS.find(
    (o) => o.operatorId === "operator:new-orleans-steamboat-company",
  );
  const natchezProd = NEW_ORLEANS_PRODUCTS.find(
    (p) => p.productSlug === "daytime-jazz-cruise",
  );
  const cityRiverboatProd = NEW_ORLEANS_PRODUCTS.find(
    (p) => p.productSlug === "city-of-new-orleans-riverboat-cruise",
  );
  if (
    !steamboatCo ||
    (steamboatCo.operatedVessels?.length ?? 0) < 2 ||
    !natchezProd?.boardingLocationResolution.primaryBoardingWharfOrDock.includes("400 Toulouse") ||
    !cityRiverboatProd?.boardingLocationResolution.primaryBoardingWharfOrDock.includes("101 St. Louis")
  ) {
    throw new Error(
      "[NOLA Invariant Violation] New Orleans Steamboat Company must distinguish Steamboat NATCHEZ (400 Toulouse St) from Riverboat CITY of NEW ORLEANS (101 St. Louis St companion berth).",
    );
  }

  // 5. Erato Street and Julia Street Cruise Terminals must remain separate
  const erato = NEW_ORLEANS_PLACES.find(
    (p) => p.publicPlaceSlug === "erato-street-cruise-terminal",
  );
  const julia = NEW_ORLEANS_PLACES.find(
    (p) => p.publicPlaceSlug === "julia-street-cruise-terminal",
  );
  if (
    !erato ||
    !julia ||
    erato.placeId === julia.placeId ||
    !erato.neverAliasOrRedirectToSlugs?.includes("julia-street-cruise-terminal") ||
    !julia.neverAliasOrRedirectToSlugs?.includes("erato-street-cruise-terminal")
  ) {
    throw new Error(
      "[NOLA Invariant Violation] Erato Street and Julia Street Cruise Terminals must remain separate canonical places.",
    );
  }

  // 6. Honey Island, Jean Lafitte, Manchac, and River Road must remain distinct
  const requiredBasins = ["honey-island", "jean-lafitte", "manchac", "river-road"];
  for (const slug of requiredBasins) {
    if (!NEW_ORLEANS_PLACES.some((p) => p.publicPlaceSlug === slug)) {
      throw new Error(`[NOLA Invariant Violation] Missing distinct canonical place ${slug}.`);
    }
  }

  // 7. All corridor drive estimates must have isGuarantee === false
  for (const place of NEW_ORLEANS_PLACES) {
    if (
      place.driveEstimateFromFrenchQuarter &&
      place.driveEstimateFromFrenchQuarter.isGuarantee !== false
    ) {
      throw new Error(
        `[NOLA Invariant Violation] Drive estimate on ${place.placeId} must set isGuarantee=false.`,
      );
    }
  }
}

assertMandatoryNewOrleansInvariants();

export interface HeldRecordLedgerEntry {
  queue:
    | "HeldPlaceQueue"
    | "OperatorResearchQueue"
    | "HeldAreaCategoryQueue"
    | "HeldTourSkuQueue";
  entityId: string;
  publicPath: string | null;
  robotsDirective: "noindex, follow";
  holdReasonCodes: readonly string[];
  holdDetails: readonly string[];
}

export function findNewOrleansPlaceBySlug(
  slug: string,
): {
  place: NewOrleansPlaceRecord;
  gate: ReturnType<typeof evaluateNewOrleansPlacePublicationGate>;
} | null {
  const normalized = slug.trim().toLowerCase();
  const place = NEW_ORLEANS_PLACES.find(
    (p) => p.publicPlaceSlug?.toLowerCase() === normalized,
  );
  if (!place) return null;
  return { place, gate: evaluateNewOrleansPlacePublicationGate(place) };
}

export function findNewOrleansOperatorBySlugOrAlias(
  slugOrAlias: string,
): {
  operator: NewOrleansOperatorRecord;
  matchedViaAlias: boolean;
  canonicalSlug: string;
  products: NewOrleansProductRecord[];
  gate: ReturnType<typeof evaluateNewOrleansOperatorPublicationGate>;
} | null {
  const normalized = slugOrAlias
    .trim()
    .toLowerCase()
    .replace(/^operator:/, "");
  const operator = NEW_ORLEANS_OPERATORS.find(
    (op) =>
      op.slug.toLowerCase() === normalized ||
      op.operatorId.toLowerCase() === `operator:${normalized}` ||
      op.legacyCompanyAliases?.some((a) => a.toLowerCase() === normalized),
  );
  if (!operator) return null;
  const products = NEW_ORLEANS_PRODUCTS.filter(
    (p) => p.operatorId === operator.operatorId,
  );
  const gate = evaluateNewOrleansOperatorPublicationGate(operator, products);
  return {
    operator,
    matchedViaAlias: operator.slug.toLowerCase() !== normalized,
    canonicalSlug: operator.slug,
    products,
    gate,
  };
}

export function findNewOrleansCanonicalOperatorForProductSlug(
  productSlug: string,
): {
  operator: NewOrleansOperatorRecord;
  product: NewOrleansProductRecord | null;
  primaryPlace: NewOrleansPlaceRecord | null;
} | null {
  const normalized = productSlug.trim().toLowerCase();
  const product =
    NEW_ORLEANS_PRODUCTS.find((p) => p.productSlug.toLowerCase() === normalized) ||
    null;
  if (!product) return null;
  const operator =
    NEW_ORLEANS_OPERATORS.find((o) => o.operatorId === product.operatorId) || null;
  if (!operator) return null;
  const primaryPlace =
    NEW_ORLEANS_PLACES.find((pl) => pl.placeId === product.primaryPlaceId) || null;
  return { operator, product, primaryPlace };
}

export function getNewOrleansDirectorySnapshot() {
  assertMandatoryNewOrleansInvariants();

  const evaluatedPlaces = NEW_ORLEANS_PLACES.map((place) => ({
    place,
    gate: evaluateNewOrleansPlacePublicationGate(place),
  }));

  const evaluatedOperators = NEW_ORLEANS_OPERATORS.map((operator) => {
    const products = NEW_ORLEANS_PRODUCTS.filter(
      (p) => p.operatorId === operator.operatorId,
    );
    const gate = evaluateNewOrleansOperatorPublicationGate(operator, products);
    return {
      operator,
      products,
      liveAvailabilityConnected: isOperatorLiveAvailabilityConnected(operator),
      directCheckoutConnected: isOperatorDirectCheckoutConnected(operator),
      gate,
    };
  });

  const qualifiedOperatorIdSet = new Set(
    evaluatedOperators.filter((o) => o.gate.indexable).map((o) => o.operator.operatorId),
  );

  const qualifiedPlaces = evaluatedPlaces.filter((p) => p.gate.indexable);

  // Evaluate candidate area x category intersections across qualified places that have >= 1 active product
  const areaCategories: Array<{
    areaSlug: string;
    areaName: string;
    category: DirectoryCategoryDefinition;
    comparison: NewOrleansAreaCategoryComparison | null;
    operatorCount: number;
    productCount: number;
    gate: ReturnType<typeof evaluateNewOrleansAreaCategoryPublicationGate>;
  }> = [];

  for (const { place } of qualifiedPlaces) {
    const areaSlug = place.publicPlaceSlug!;
    for (const category of NEW_ORLEANS_CATEGORIES) {
      const matchingProducts = NEW_ORLEANS_PRODUCTS.filter(
        (prod) =>
          !prod.isCommerciallyHeld &&
          Boolean(prod.verifiedAt) &&
          qualifiedOperatorIdSet.has(prod.operatorId) &&
          prod.categorySlug === category.categorySlug &&
          (prod.placeSlug === areaSlug ||
            prod.visitedHistoricSiteIds?.includes(place.placeId)),
      );
      const comparison =
        NEW_ORLEANS_AREA_CATEGORY_COMPARISONS.find(
          (c) =>
            c.placeSlug === areaSlug && c.categorySlug === category.categorySlug,
        ) || null;

      if (matchingProducts.length === 0 && !comparison) {
        continue;
      }

      const distinctOpIds = Array.from(
        new Set(matchingProducts.map((p) => p.operatorId)),
      );
      const gate = evaluateNewOrleansAreaCategoryPublicationGate({
        areaSlug,
        categorySlug: category.categorySlug,
        comparison,
        qualifiedOperatorIds: distinctOpIds,
        qualifiedProducts: matchingProducts,
      });

      areaCategories.push({
        areaSlug,
        areaName: place.name,
        category,
        comparison,
        operatorCount: distinctOpIds.length,
        productCount: matchingProducts.length,
        gate,
      });
    }
  }

  const heldRecordsLedger: HeldRecordLedgerEntry[] = [];

  for (const entry of evaluatedPlaces) {
    if (!entry.gate.indexable) {
      heldRecordsLedger.push({
        queue: "HeldPlaceQueue",
        entityId: entry.place.placeId,
        publicPath: entry.gate.publicPath,
        robotsDirective: "noindex, follow",
        holdReasonCodes: entry.gate.holdReasonCodes,
        holdDetails: entry.gate.holdDetails,
      });
    }
  }

  for (const entry of evaluatedOperators) {
    if (!entry.gate.indexable) {
      heldRecordsLedger.push({
        queue: "OperatorResearchQueue",
        entityId: entry.operator.operatorId,
        publicPath: entry.gate.publicPath,
        robotsDirective: "noindex, follow",
        holdReasonCodes: entry.gate.holdReasonCodes,
        holdDetails: entry.gate.holdDetails,
      });
    }
  }

  for (const entry of areaCategories) {
    if (!entry.gate.indexable) {
      heldRecordsLedger.push({
        queue: "HeldAreaCategoryQueue",
        entityId: entry.gate.entityId,
        publicPath: entry.gate.publicPath,
        robotsDirective: "noindex, follow",
        holdReasonCodes: entry.gate.holdReasonCodes,
        holdDetails: entry.gate.holdDetails,
      });
    }
  }

  for (const prod of NEW_ORLEANS_PRODUCTS) {
    if (prod.isCommerciallyHeld || !prod.verifiedAt) {
      heldRecordsLedger.push({
        queue: "HeldTourSkuQueue",
        entityId: prod.productId,
        publicPath: prod.wnoPublicTourPath,
        robotsDirective: "noindex, follow",
        holdReasonCodes: ["EXPLICIT_RESEARCH_QUEUE_HOLD"],
        holdDetails: [
          prod.commercialHoldReason ||
            "Held pending primary-source SKU and pickup verification.",
        ],
      });
    }
  }

  const qualifiedProducts = NEW_ORLEANS_PRODUCTS.filter(
    (p) =>
      !p.isCommerciallyHeld &&
      Boolean(p.verifiedAt) &&
      qualifiedOperatorIdSet.has(p.operatorId),
  );
  const heldProducts = NEW_ORLEANS_PRODUCTS.filter(
    (p) => p.isCommerciallyHeld || !p.verifiedAt || !qualifiedOperatorIdSet.has(p.operatorId),
  );

  return {
    schemaVersion: NEW_ORLEANS_DIRECTORY_SCHEMA_VERSION,
    coreContractVersion: DIRECTORY_CORE_CONTRACT_VERSION,
    extensionVersion: NEW_ORLEANS_DIRECTORY_EXTENSION_VERSION,
    generatedAt: MODIFIED_ISO,
    region: {
      regionId: "region:greater-new-orleans-and-river-parishes",
      name: "Greater New Orleans, Wetland Basins & Great River Road",
      canonicalPublicHost: "https://www.welcometoneworleanstours.com",
      specialistSwampSurfaceHost: "https://welcometotheswamp.com",
      authorityHost: "https://destinationcommandcenter.com",
    },
    counts: {
      placesTotal: evaluatedPlaces.length,
      placesQualifiedIndexable: evaluatedPlaces.filter((p) => p.gate.indexable).length,
      placesHeldNoindex: evaluatedPlaces.filter((p) => !p.gate.indexable).length,
      operatorsTotal: evaluatedOperators.length,
      operatorsQualifiedIndexable: evaluatedOperators.filter((o) => o.gate.indexable).length,
      operatorsHeldNoindex: evaluatedOperators.filter((o) => !o.gate.indexable).length,
      operatorsLiveAvailabilityConnected: evaluatedOperators.filter(
        (o) => o.liveAvailabilityConnected,
      ).length,
      operatorsDirectCheckoutConnected: evaluatedOperators.filter(
        (o) => o.directCheckoutConnected,
      ).length,
      productsTotal: NEW_ORLEANS_PRODUCTS.length,
      productsQualifiedActive: qualifiedProducts.length,
      productsHeld: heldProducts.length,
      areaCategoriesEvaluated: areaCategories.length,
      areaCategoriesQualifiedIndexable: areaCategories.filter((a) => a.gate.indexable).length,
      areaCategoriesHeldConsolidated: areaCategories.filter((a) => !a.gate.indexable).length,
      heldLedgerTotal: heldRecordsLedger.length,
    },
    places: evaluatedPlaces,
    categories: NEW_ORLEANS_CATEGORIES,
    operators: evaluatedOperators,
    areaCategories,
    heldRecordsLedger,
  };
}

export function listQualifiedWnoCanonicalDirectoryPaths(): string[] {
  const snapshot = getNewOrleansDirectorySnapshot();
  const paths: string[] = ["/areas", "/operators"];
  for (const entry of snapshot.places) {
    if (entry.gate.indexable && entry.gate.publicPath) {
      paths.push(entry.gate.publicPath);
    }
  }
  for (const entry of snapshot.operators) {
    if (entry.gate.indexable && entry.gate.publicPath) {
      paths.push(entry.gate.publicPath);
    }
  }
  return Array.from(new Set(paths));
}
