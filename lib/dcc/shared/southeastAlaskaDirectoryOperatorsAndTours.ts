/**
 * Phase 1 — Canonical Southeast Alaska Operators, Tours, Category Comparisons,
 * Publication-Gate Evaluations & Held-Record Ledger
 * (`lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours.ts`).
 *
 * Primary-source verified on 2026-11-17.
 */

import {
  evaluateOperatorPublicationGate,
  evaluatePlacePublicationGate,
  evaluatePortCategoryPublicationGate,
  UNCLAIMED_OPERATOR_PROFILE_NOTICE,
  type EntityPublicationGateEvaluation,
  type OperatorIntegrationApprovalState,
  type PortCategoryComparisonContent,
  type SoutheastAlaskaCategoryDefinition,
  type SoutheastAlaskaOperatorRecord,
  type SoutheastAlaskaPlaceRecord,
  type SoutheastAlaskaTourProductRecord,
} from "./southeastAlaskaDirectoryContract";
import {
  SOUTHEAST_ALASKA_CATEGORIES,
  SOUTHEAST_ALASKA_PLACES,
} from "./southeastAlaskaDirectoryData";

const DEFAULT_UNCONNECTED_INTEGRATION: OperatorIntegrationApprovalState = {
  connectionRequestStatus: "not_requested",
  liveAvailabilityApprovedByOwner: false,
  directCheckoutApprovedByOwner: false,
  commercialTermsSigned10Pct: false,
  approvedAt: null,
  approvedBy: null,
  notes:
    "Public source-backed profile; live API availability and 10% supplier-hosted direct checkout require operator authorization and explicit owner approval.",
};

export const SOUTHEAST_ALASKA_OPERATORS: readonly SoutheastAlaskaOperatorRecord[] = [
  // 1. HARV & MARV'S OUTBACK ALASKA (Juneau)
  {
    operatorId: "operator:harv-and-marvs",
    slug: "harv-and-marvs",
    legacyCompanyAliases: ["alaska-galore-juneau-whale-watching", "harvandmarvs"],
    name: "Harv & Marv's Outback Alaska",
    tagline: "Small-boat 6- to 18-guest and modern catamaran Auke Bay whale watching with direct ramp pickup at all 4 Juneau docks.",
    headquartersCommunityId: "place:community:juneau",
    servedPlaceIds: ["place:community:juneau", "place:harbor:statter-harbor-auke-bay"],
    publicPortSlugs: ["juneau"],
    categorySlugs: ["whale-watching"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Locally Owned in Juneau",
        evidenceSummary: "Founded in 2005 in Juneau and locally owned alongside sister companies Juneau Lighthouse Tours and Alaska Galore Tours.",
        sourceUrl: "https://www.harvandmarvs-juneau-whale-watching.com/about-us/",
      },
      {
        tag: "independent_small_boat",
        label: "Small-Group 6- & 18-Guest Fleet",
        evidenceSummary: "Operates 6-passenger custom boats and 18-passenger naturalist catamarans out of Statter Harbor.",
        sourceUrl: "https://www.harvandmarvs-juneau-whale-watching.com/tours/marvs-signature-whale-watch/",
      },
    ],
    companyOverview:
      "Founded in Juneau in 2005, Harv & Marv's Outback Alaska specializes in longer-on-the-water (~3 hours marine time, 4 hours dock-to-dock) humpback whale watching departing Don D. Statter Harbor in Auke Bay, pairing intimate 6-passenger custom vessels and 18-passenger naturalist catamarans with a water-view photo stop toward Mendenhall Glacier.",
    cruiseLogisticsSummary:
      "Dock representatives meet cruise guests directly at the top of the gangway ramp at all four Juneau docks—including AJ Dock, South Franklin, Cruise Terminal, and Alaska Steamship—15 minutes before tour time for a 25-minute narrated shuttle to Statter Harbor.",
    officialWebsite: "https://www.harvandmarvs-juneau-whale-watching.com/",
    officialEmailDomain: "alaskagalore.com",
    officialPhone: "(877) 794-2537",
    yearEstablished: 2005,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "alaska-galore-juneau-whale-watching",
    dockPickupRules: [
      {
        placeId: "place:community:juneau",
        dockOrTerminalName: "All 4 Juneau Cruise Docks (AJ, Franklin, Cruise Terminal, Alaska Steamship)",
        pickupProvided: true,
        meetingPointInstructions: "Meet Harv & Marv's Dock Representative at the top of your ship's dock ramp 15 minutes before tour time.",
        addedBufferMinutesEachWay: 0,
      },
    ],
    accessibilityAndMobilityNotes:
      "Vans and boats are not wheelchair accessible (3 steps to board boat and ~300-yard harbor walk plus tidal ramp); collapsible wheelchairs/scooters under 50 lbs accepted with advance notice.",
    weightAndAgePolicies:
      "All ages welcome (infants 0–24 months free on public tours, though USCG counts every infant toward total passenger capacity).",
    heroImage: "/images/alaska/juneau-whale.jpg",
    heroImageAlt: "Humpback whale surfacing in Auke Bay near Juneau",
    heroImageCredit: "Public domain · NPS / Kaitlin Thoreson",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Harv & Marv's Outback Alaska — Official Website & FAQs",
        url: "https://www.harvandmarvs-juneau-whale-watching.com/faq/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 2. JUNEAU TOURS & WHALE WATCH (Juneau)
  {
    operatorId: "operator:juneau-tours-and-whale-watch",
    slug: "juneau-tours-and-whale-watch",
    legacyCompanyAliases: ["juneau-tours-whale-watch", "dolphintours"],
    name: "Juneau Tours & Whale Watch",
    tagline: "Alaskan-owned operator offering dock-to-dock Auke Bay whale watching, permitted Mendenhall Glacier shuttles, and combo tours from Goldbelt Tramway.",
    headquartersCommunityId: "place:community:juneau",
    servedPlaceIds: ["place:community:juneau", "place:harbor:statter-harbor-auke-bay"],
    publicPortSlugs: ["juneau"],
    categorySlugs: ["whale-watching", "mendenhall-glacier-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Alaskan Family-Owned Since 1998",
        evidenceSummary: "Founded in Juneau in 1998 by Sky Bonnell and managed with sister Serene Hutchinson.",
        sourceUrl: "https://www.juneautours.com/our-company/",
      },
    ],
    companyOverview:
      "Started in 1998 in Juneau, Juneau Tours & Whale Watch is one of Southeast Alaska's largest independent family-operated shore excursion companies, running heated custom whale-watching vessels out of Auke Bay, USFS-permitted Mendenhall Glacier Visitor Center shuttles, and downtown glacier trolleys.",
    cruiseLogisticsSummary:
      "Guests check in 15 minutes early at 490–492 S. Franklin St directly beneath the Goldbelt Tramway cables (AJ Dock ships ride the complimentary 10–15 minute port shuttle to the Tramway). Backed by a No Port–No Pay refund policy and return-to-ship guarantee.",
    officialWebsite: "https://www.juneautours.com/",
    officialEmailDomain: "juneautours.com",
    officialPhone: "(907) 621-6502",
    yearEstablished: 1998,
    socialLinks: {
      facebook: "https://www.facebook.com/JuneauToursAndWhaleWatch/",
    },
    bookingPlatform: "Rezgo",
    rezgoDomain: "juneautours.rezgo.com",
    dockPickupRules: [
      {
        placeId: "place:community:juneau",
        dockOrTerminalName: "Goldbelt Tramway Plaza (492 S. Franklin St)",
        pickupProvided: true,
        meetingPointInstructions: "Meet staff in blue hats and white safety vests beneath the Goldbelt Tramway cables 15 minutes prior to departure (AJ Dock guests take free port shuttle to Tramway).",
        addedBufferMinutesEachWay: 10,
      },
    ],
    accessibilityAndMobilityNotes:
      "Whale boats feature enclosed heated cabins and onboard restrooms; ADA lift bus accommodations on Mendenhall shuttles require 48-hour advance notice via (907) 621-6502.",
    weightAndAgePolicies:
      "All ages welcome across whale watching, Mendenhall shuttle, and trolley departures.",
    heroImage: "/images/alaska/mendenhall-visitor-center.jpg",
    heroImageAlt: "Mendenhall Glacier Visitor Center overlook in Juneau",
    heroImageCredit: "Public domain · U.S. Forest Service",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Juneau Tours & Whale Watch — Official Company & FAQs",
        url: "https://www.juneautours.com/f-a-q/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 3. COASTAL HELICOPTERS (Juneau)
  {
    operatorId: "operator:coastal-helicopters",
    slug: "coastal-helicopters",
    legacyCompanyAliases: ["coastalhelicopters"],
    name: "Coastal Helicopters",
    tagline: "Juneau-based FAA Part 135 helicopter operator landing on Herbert Glacier for guided ice walks and alpine husky dog sledding.",
    headquartersCommunityId: "place:community:juneau",
    servedPlaceIds: ["place:community:juneau"],
    publicPortSlugs: ["juneau"],
    categorySlugs: ["helicopter-glacier-tours", "dog-sledding-and-glacier-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Juneau-Based Since 1988",
        evidenceSummary: "Formed in Juneau in 1988; operates exclusively out of Juneau under USFS Tongass National Forest Special Use Permit.",
        sourceUrl: "https://coastalhelicopters.com/about/",
      },
    ],
    companyOverview:
      "Operating exclusively out of Juneau International Airport since 1988 with a 13-helicopter fleet, Coastal Helicopters flies small-group scenic landings and Alaska Icefield Expeditions summer dog-sledding excursions onto Herbert Glacier on the Juneau Icefield. (For live Juneau ceiling advisories and flight-desk concierge help, see specialist partner Juneau Flight Deck.)",
    cruiseLogisticsSummary:
      "Complimentary round-trip shuttle picks up street-side at the Goldbelt Tram Building (490 S. Franklin St) beneath the tram cables. Requires at least a 45-minute post-arrival and pre-departure ship buffer; 100% refund if weather grounds flights.",
    officialWebsite: "https://coastalhelicopters.com/",
    officialEmailDomain: "coastalhelicopters.com",
    officialPhone: "(907) 789-5610",
    yearEstablished: 1988,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "coastalhelicopters",
    dockPickupRules: [
      {
        placeId: "place:community:juneau",
        dockOrTerminalName: "Goldbelt Tram Building (490 S. Franklin St)",
        pickupProvided: true,
        meetingPointInstructions: "Street-side pickup beneath the Goldbelt Tramway cables; AJ Dock guests take port shuttle to Tramway first.",
        addedBufferMinutesEachWay: 10,
      },
    ],
    accessibilityAndMobilityNotes:
      "Guests must enter and exit the helicopter unassisted and walk on uneven glacier ice with supplied overboots; no service animals permitted due to cabin and exit-door safety regulations.",
    weightAndAgePolicies:
      "All ages (no lap infants—every guest requires a paid seat). FAA weight tiers weighed at check-in: 1–259 lbs Standard, 260–299 lbs Standard Plus (+$150), 300+ lbs Premium (2 seats).",
    heroImage: "/images/alaska/juneau-heli-glacier.jpg",
    heroImageAlt: "Helicopter landed on blue glacier ice on the Juneau Icefield",
    heroImageCredit: "CC BY-SA 2.0 · Robert Raines",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Coastal Helicopters — Official Tours & Weight/Pickup FAQs",
        url: "https://coastalhelicopters.com/faq/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 4. NORTHSTAR TREKKING (Juneau)
  {
    operatorId: "operator:northstar-trekking",
    slug: "northstar-trekking",
    legacyCompanyAliases: ["northstartrekking"],
    name: "NorthStar Trekking",
    tagline: "Juneau glacier trekking, crampon ice walks, Norris Glacier dog sledding, and Taku Glacier airboat adventures.",
    headquartersCommunityId: "place:community:juneau",
    servedPlaceIds: ["place:community:juneau"],
    publicPortSlugs: ["juneau"],
    categorySlugs: ["helicopter-glacier-tours", "dog-sledding-and-glacier-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Founded in Juneau in 1998",
        evidenceSummary: "Founded in Juneau in 1998 by glacier-trekking pioneer Bob Engelbrecht with bases at Juneau Airport and North Douglas Island.",
        sourceUrl: "https://northstartrekking.com/about/",
      },
    ],
    companyOverview:
      "Founded in Juneau in 1998, NorthStar Trekking (NorthStar Helicopters) pairs A-Star 350 flightseeing with technical and interpretive guided glacier hikes (1 to 3 hours on the ice with mountaineering boots, crampons, and outerwear supplied), plus Norris Glacier snow dog sledding and Taku Glacier helicopter-airboat combos from its private Douglas Island heliport.",
    cruiseLogisticsSummary:
      "Direct cruise bookings include round-trip van pickup at the Goldbelt Tramway downtown (book departures at least 60 minutes after ship arrival).",
    officialWebsite: "https://northstartrekking.com/",
    officialEmailDomain: "northstartrekking.com",
    officialPhone: "(907) 790-4530",
    yearEstablished: 1998,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "northstartrekking",
    dockPickupRules: [
      {
        placeId: "place:community:juneau",
        dockOrTerminalName: "Goldbelt Tramway Downtown",
        pickupProvided: true,
        meetingPointInstructions: "NorthStar van pickup at Goldbelt Tramway plaza; schedule at least 1 hour after ship arrival.",
        addedBufferMinutesEachWay: 10,
      },
    ],
    accessibilityAndMobilityNotes:
      "Staff cannot lift guests into helicopters; treks require 1–2 hours of unassisted walking on uneven glacial ice. No bags, purses, selfie sticks, or drones on aircraft (free base lockers provided).",
    weightAndAgePolicies:
      "Minimum ages strictly enforced: Dogsled 2+, Taku Airboat 7+, Walkabout 8+, Glacier Trek 12+. Guests weighing 250+ lbs (clothed) incur a $150–$250 weight-balance surcharge at booking.",
    heroImage: "/images/alaska/glacier-flightseeing.jpg",
    heroImageAlt: "Guided glacier helicopter landing on the Juneau Icefield",
    heroImageCredit: "CC BY-SA 2.0 · Robert Raines",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "NorthStar Trekking — Official Adventures & FAQs",
        url: "https://northstartrekking.com/faqs/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 5. TEMSCO HELICOPTERS (Juneau & Skagway)
  {
    operatorId: "operator:temsco-helicopters",
    slug: "temsco-helicopters",
    legacyCompanyAliases: ["temscoair-juneau", "temscoair-skagway", "temsco-summercamp-juneau"],
    name: "TEMSCO Helicopters",
    tagline: "Historic 1958 Alaska aviation operator running Mendenhall Glacier & Denver Glacier helicopter landings and snow dog camps in Juneau and Skagway.",
    headquartersCommunityId: "place:community:ketchikan",
    servedPlaceIds: ["place:community:juneau", "place:community:skagway"],
    publicPortSlugs: ["juneau", "skagway"],
    categorySlugs: ["helicopter-glacier-tours", "dog-sledding-and-glacier-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "regional_alaska_operator",
        label: "Founded in Southeast Alaska (1958)",
        evidenceSummary: "Founded in Ketchikan in 1958 by Alaska aviation pioneer Ken Eichner with dedicated cruise flightseeing bases in Juneau and Skagway.",
        sourceUrl: "https://temscoair.com/about/",
      },
    ],
    companyOverview:
      "Founded in Southeast Alaska in 1958, TEMSCO Helicopters operates dedicated shore-excursion flight bases in both Juneau (1650 Maplesden Way — Mendenhall Glacier walks, Pilot's Choice landings, and snow dog sledding) and Skagway (101 Terminal Way waterfront heliport — Chilkat/Meade glacier walks and Denver Glacier sled-dog camp).",
    cruiseLogisticsSummary:
      "In Juneau, TEMSCO provides complimentary round-trip transfers from downtown cruise meeting points. In Skagway, guests walk (<1 mile) or ride the $3 SMART shuttle to the waterfront heliport at 101 Terminal Way, and TEMSCO provides return drop-off after the flight.",
    officialWebsite: "https://temscoair.com/",
    officialEmailDomain: "temscoair.com",
    officialPhone: "(907) 789-9501",
    yearEstablished: 1958,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "temscoair-juneau",
    dockPickupRules: [
      {
        placeId: "place:community:juneau",
        dockOrTerminalName: "Downtown Juneau Central Cruise Meeting Point",
        pickupProvided: true,
        meetingPointInstructions: "Complimentary round-trip shuttle transfer to 1650 Maplesden Way heliport; arrive 15 minutes early.",
        addedBufferMinutesEachWay: 10,
      },
      {
        placeId: "place:community:skagway",
        dockOrTerminalName: "Skagway Waterfront Heliport (101 Terminal Way)",
        pickupProvided: false,
        meetingPointInstructions: "Walk (~10–18 mins) or take $3 SMART bus to 101 Terminal Way waterfront heliport; return drop-off to ship/town included.",
        addedBufferMinutesEachWay: 15,
      },
    ],
    accessibilityAndMobilityNotes:
      "Rated Moderate (~200-ft walk on snow/ice with supplied NEOS overboots and 2 steps into aircraft). No bags, tablets, selfie sticks, drones, or water bottles onboard (free lockers at base).",
    weightAndAgePolicies:
      "All ages (children under 2 require reserved seat). Passengers weighing 250+ lbs (clothed) pay a $150 weight-balance surcharge at booking.",
    heroImage: "/images/alaska/juneau-heli-glacier.jpg",
    heroImageAlt: "TEMSCO helicopter glacier excursion in Southeast Alaska",
    heroImageCredit: "CC BY-SA 2.0 · Robert Raines",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "TEMSCO Helicopters — Official Q&A, Juneau & Skagway Tours",
        url: "https://temscoair.com/q-a/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 6. ALASKA TRAVEL ADVENTURES (Strictly Separate from Gastineau Guiding!)
  {
    operatorId: "operator:alaska-travel-adventures",
    slug: "alaska-travel-adventures",
    legacyCompanyAliases: ["aktraveladventures"],
    separateFromOperatorIds: ["operator:gastineau-guiding"],
    separationGovernanceNote:
      "Strictly separate company founded in 1978 (9085 Glacier Hwy Suite 301, alaskatraveladventures.com); never merge or alias with Gastineau Guiding (founded 1994, stepintoalaska.com).",
    name: "Alaska Travel Adventures",
    tagline: "Locally owned since 1978 running Mendenhall River floats, Gold Creek Salmon Bake & whale combos in Juneau, Liarsville in Skagway, and Jeep-canoe safaris in Ketchikan.",
    headquartersCommunityId: "place:community:juneau",
    servedPlaceIds: [
      "place:community:juneau",
      "place:community:skagway",
      "place:community:ketchikan",
      "place:community:sitka",
    ],
    publicPortSlugs: ["juneau", "skagway", "ketchikan", "sitka"],
    categorySlugs: ["whale-watching", "mendenhall-glacier-tours", "cultural-and-totem-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Locally Owned & Headquartered in Juneau (1978)",
        evidenceSummary: "Founded in 1978 and headquartered at 9085 Glacier Hwy Suite 301, Juneau, AK.",
        sourceUrl: "https://www.alaskatraveladventures.com/about",
      },
    ],
    companyOverview:
      "Founded in 1978 and headquartered in Juneau, Alaska Travel Adventures operates classic multi-port shore excursions across Juneau, Skagway, Ketchikan, and Sitka—including the Gold Creek Salmon Bake, Mendenhall Glacier River Float, Auke Bay jet-boat whale combos, Skagway's Liarsville Gold Rush Trail Camp, and Ketchikan's Backcountry Jeep & Canoe Safari.",
    cruiseLogisticsSummary:
      "Provides coordinated motorcoach pickup from designated cruise pier shuttle zones in Juneau, Skagway, and Ketchikan with a return-to-ship guarantee.",
    officialWebsite: "https://www.alaskatraveladventures.com/",
    officialEmailDomain: "alaskatraveladventures.com",
    officialPhone: "(800) 323-5757",
    yearEstablished: 1978,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "aktraveladventures",
    dockPickupRules: [
      {
        placeId: "place:community:juneau",
        dockOrTerminalName: "Designated Juneau Cruise Pier Shuttle Zone",
        pickupProvided: true,
        meetingPointInstructions: "Round-trip motorcoach transfer from cruise terminal shuttle zone; courtesy return buses run frequently from Gold Creek Salmon Bake.",
        addedBufferMinutesEachWay: 10,
      },
      {
        placeId: "place:community:skagway",
        dockOrTerminalName: "Skagway Cruise Pier Shuttle Area",
        pickupProvided: true,
        meetingPointInstructions: "Round-trip motorcoach pickup to Liarsville camp.",
        addedBufferMinutesEachWay: 10,
      },
    ],
    accessibilityAndMobilityNotes:
      "Gold Creek Salmon Bake and Liarsville feature packed-gravel forest boardwalks accessible to folding wheelchairs; Mendenhall River Float and Jeep/Canoe safaris require active step-in entry.",
    weightAndAgePolicies:
      "Mendenhall Glacier Float Trip requires minimum 50 lbs weight for life-jacket fit; Ketchikan Jeep & Canoe requires Ages 5+ and valid driver's license to drive.",
    heroImage: "/images/alaska/mendenhall-glacier.jpg",
    heroImageAlt: "Mendenhall Lake and Glacier near Juneau",
    heroImageCredit: "CC BY-SA 4.0 · Gillfoto",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Alaska Travel Adventures — Official Multi-Port Catalog",
        url: "https://www.alaskatraveladventures.com/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 7. GASTINEAU GUIDING (Strictly Separate from Alaska Travel Adventures!)
  {
    operatorId: "operator:gastineau-guiding",
    slug: "gastineau-guiding",
    separateFromOperatorIds: ["operator:alaska-travel-adventures"],
    separationGovernanceNote:
      "Strictly separate family-owned company founded in 1994 by Bob Janes & Dawn Wolfe (1330 Eastaugh Way, stepintoalaska.com); never merge or alias with Alaska Travel Adventures.",
    name: "Gastineau Guiding Company",
    tagline: "Family-owned Juneau small-group naturalist hikes, citizen-science whale safaris, and Mendenhall photo excursions.",
    headquartersCommunityId: "place:community:juneau",
    servedPlaceIds: ["place:community:juneau", "place:harbor:statter-harbor-auke-bay"],
    publicPortSlugs: ["juneau"],
    categorySlugs: ["whale-watching", "mendenhall-glacier-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Family-Owned in Juneau Since 1994",
        evidenceSummary: "Founded in 1994 by third-generation Alaskans Bob Janes and Dawn Wolfe at 1330 Eastaugh Way, Juneau.",
        sourceUrl: "https://stepintoalaska.com/our-story/",
      },
    ],
    companyOverview:
      "Founded in 1994 by third-generation Alaskans Bob Janes and Dawn Wolfe, Gastineau Guiding Company leads small-group naturalist and photography shore excursions in Juneau (capped at 12 to 20 guests), pairing custom hinged-window whale boats with USFS-permitted Mendenhall rainforest hikes and citizen-science fluke identification.",
    cruiseLogisticsSummary:
      "Direct-booked Whales & Wilderness departures meet downtown at Elizabeth Peratrovich Plaza (15 minutes prior), while ship-portal departures meet on-pier; backed by Gastineau Guiding's Worry-Free Return-to-Ship Guarantee.",
    officialWebsite: "https://stepintoalaska.com/",
    officialEmailDomain: "stepintoalaska.com",
    officialPhone: "(907) 586-8231",
    yearEstablished: 1994,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    dockPickupRules: [
      {
        placeId: "place:community:juneau",
        dockOrTerminalName: "Elizabeth Peratrovich Plaza (Direct) / Cruise Pier (Ship Portal)",
        pickupProvided: true,
        meetingPointInstructions: "Direct online bookings meet at Elizabeth Peratrovich Plaza downtown 15 minutes early; ship-booked tours meet guides in black jackets on pier.",
        addedBufferMinutesEachWay: 10,
      },
    ],
    accessibilityAndMobilityNotes:
      "Boats and rainforest trails are not wheelchair or stroller accessible (bus steps and tidal harbor ramps); call (907) 586-8231 at least 48 hours ahead to discuss mobility accommodations.",
    weightAndAgePolicies:
      "Max 20 guests on whale tours, max 14 on Photo Safari (not recommended under age 5), max 12 on strenuous Guide's Choice Hike.",
    heroImage: "/images/alaska/rainforest-hiking.jpg",
    heroImageAlt: "Tongass National Forest trail near Juneau",
    heroImageCredit: "Public domain · U.S. Forest Service",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Gastineau Guiding (Step Into Alaska) — Official FAQs & Story",
        url: "https://stepintoalaska.com/frequently-asked-questions/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 8. WINGS AIRWAYS & TAKU GLACIER LODGE (Juneau)
  {
    operatorId: "operator:wings-airways",
    slug: "wings-airways",
    legacyCompanyAliases: ["wingsairways"],
    name: "Wings Airways & Taku Glacier Lodge",
    tagline: "DeHavilland Otter floatplane flights from downtown Juneau's waterfront over 5 Juneau Icefield glaciers to historic 1923 Taku Lodge.",
    headquartersCommunityId: "place:community:juneau",
    servedPlaceIds: ["place:community:juneau"],
    publicPortSlugs: ["juneau"],
    categorySlugs: ["helicopter-glacier-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Downtown Juneau Seaplane Operator",
        evidenceSummary: "Operates classic DeHavilland Turbine Otter floatplanes from 2 Marine Way on the downtown Juneau waterfront.",
        sourceUrl: "https://wingsairways.com/",
      },
    ],
    companyOverview:
      "Departing right from the downtown Juneau waterfront at 2 Marine Way, Wings Airways flies 10-passenger DeHavilland Turbine Otter floatplanes with guaranteed window seats over five Juneau Icefield glaciers and lands on the Taku River at historic 1923 Taku Glacier Lodge for wild alderwood-grilled salmon.",
    cruiseLogisticsSummary:
      "Check-in at 2 Marine Way (Merchants Wharf) is a flat 5-to-10-minute walk from Alaska Steamship, Cruise Ship Terminal, and South Franklin docks (AJ Dock guests take the 10-minute shuttle to downtown).",
    officialWebsite: "https://wingsairways.com/",
    officialEmailDomain: "wingsairways.com",
    officialPhone: "(907) 586-6275",
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "wingsairways",
    dockPickupRules: [
      {
        placeId: "place:community:juneau",
        dockOrTerminalName: "2 Marine Way Floatplane Dock (Merchants Wharf)",
        pickupProvided: false,
        meetingPointInstructions: "5–10 minute flat walk along downtown seawalk from AS, CT, and FKL berths (15m shuttle from AJ Dock).",
        addedBufferMinutesEachWay: 8,
      },
    ],
    accessibilityAndMobilityNotes:
      "Requires climbing a 3-step ladder onto floatplane pontoons and walking ~150 yards on wooden lodge paths.",
    weightAndAgePolicies:
      "All ages welcome; every passenger receives an individual window seat and headset narration.",
    heroImage: "/images/alaska/taku-lodge.jpg",
    heroImageAlt: "DeHavilland Otter floatplane in Southeast Alaska",
    heroImageCredit: "Verified Last Frontier Alaska Archive",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Wings Airways — Official Seaplane & Taku Lodge Flights",
        url: "https://wingsairways.com/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 9. WHALES OF XUNAA (Hoonah — Independent Local 6-Pax Boat!)
  {
    operatorId: "operator:whales-of-xunaa",
    slug: "whales-of-xunaa",
    name: "Whales of Xunaa",
    tagline: "Locally owned 6-passenger Safeboat whale watching out of Hoonah Boat Harbor with courtesy pickup at Icy Strait Point Excursion Hub.",
    headquartersCommunityId: "place:community:hoonah",
    servedPlaceIds: ["place:community:hoonah", "place:cruise_terminal:icy-strait-point"],
    publicPortSlugs: ["hoonah", "icy-strait-point"],
    categorySlugs: ["whale-watching"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Locally Owned in Hoonah",
        evidenceSummary: "Owned and operated in Hoonah (272 Marine Way) by Captain Paul and Mary.",
        sourceUrl: "https://www.whalesofxunaa.com/",
      },
      {
        tag: "independent_small_boat",
        label: "Max 6 Guests Aboard 27-ft Safeboat Orca",
        evidenceSummary: "Capped at 6 passengers total aboard heated former Alaska State Trooper Safeboat.",
        sourceUrl: "https://www.whalesofxunaa.com/",
      },
    ],
    companyOverview:
      "Based at 272 Marine Way directly across from Hoonah Boat Harbor (~1.4 miles from Icy Strait Point), Whales of Xunaa is a locally owned Hoonah family operation led by Captain Paul—a veteran mariner with nearly 40 years at sea—taking a maximum of 6 guests into Point Adolphus and Icy Strait aboard the heated 27-foot Safeboat Orca.",
    cruiseLogisticsSummary:
      "Includes complimentary van pickup from the designated Tour Excursions Hub at Icy Strait Point (check in 15 minutes early), or meet directly at the yellow-with-red-roof office at 272 Marine Way in Hoonah.",
    officialWebsite: "https://www.whalesofxunaa.com/",
    officialEmailDomain: "whalesofxunaa.com",
    officialPhone: "(907) 321-5501",
    socialLinks: {},
    bookingPlatform: "Direct Website",
    dockPickupRules: [
      {
        placeId: "place:cruise_terminal:icy-strait-point",
        dockOrTerminalName: "Icy Strait Point Tour Excursions Hub",
        pickupProvided: true,
        meetingPointInstructions: "Exit Adventure Center Door #2 (or ride free Transporter Gondola from Wilderness Landing) to Excursion Hub 15 minutes before departure.",
        addedBufferMinutesEachWay: 10,
      },
      {
        placeId: "place:community:hoonah",
        dockOrTerminalName: "272 Marine Way / Hoonah Boat Harbor",
        pickupProvided: false,
        meetingPointInstructions: "Direct check-in across from Hoonah Boat Harbor next to local brewery.",
        addedBufferMinutesEachWay: 0,
      },
    ],
    accessibilityAndMobilityNotes:
      "27-foot Safeboat features a heated cabin and covered aft deck; call (907) 321-5501 before booking if anyone in your party has mobility limitations.",
    weightAndAgePolicies:
      "Strictly capped at 6 passengers total—including babies/infants on laps—per USCG regulations.",
    heroImage: "/images/alaska/isp-whale-watch.jpg",
    heroImageAlt: "Humpback whale feeding near Point Adolphus off Hoonah",
    heroImageCredit: "Public domain · NOAA",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Whales of Xunaa — Official Hoonah Website",
        url: "https://www.whalesofxunaa.com/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 10. GLACIER WIND CHARTERS (Hoonah — Independent Local 13-Pax Catamarans!)
  {
    operatorId: "operator:glacier-wind-charters",
    slug: "glacier-wind-charters",
    legacyCompanyAliases: ["g-wind"],
    name: "Glacier Wind Charters",
    tagline: "Hoonah family-owned since 1995 operating 13-passenger custom catamarans Apogee and Glacier Wind to Point Adolphus.",
    headquartersCommunityId: "place:community:hoonah",
    servedPlaceIds: ["place:community:hoonah", "place:cruise_terminal:icy-strait-point"],
    publicPortSlugs: ["hoonah", "icy-strait-point"],
    categorySlugs: ["whale-watching"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Hoonah Family-Owned Since 1995",
        evidenceSummary: "Owned and operated in Hoonah (304 Harbor Dr) by the McConnell family since 1995.",
        sourceUrl: "https://www.g-wind.com/about-us/",
      },
      {
        tag: "independent_small_boat",
        label: "Max 13 Guests Aboard Custom Catamarans",
        evidenceSummary: "Custom walk-around heated aluminum catamarans Apogee and Glacier Wind capped at 13 guests.",
        sourceUrl: "https://www.g-wind.com/our-boats/",
      },
    ],
    companyOverview:
      "Operated in Hoonah since 1995 by Captain Shawn and Teresa McConnell and their sons, Glacier Wind Charters runs 3-hour small-group humpback whale and wildlife excursions out of Hoonah Boat Harbor (304 Harbor Dr) aboard custom 13-passenger walk-around catamarans equipped with heated cabins, flushing restrooms, and underwater hydrophones.",
    cruiseLogisticsSummary:
      "Meets cruise guests 10 minutes prior to tour time at the Icy Strait Point Excursion Hub for a 5-minute courtesy van transfer to Hoonah Boat Harbor and drops back at ISP afterward (or lets you stay in Hoonah to walk the Sea Walk back).",
    officialWebsite: "https://www.g-wind.com/",
    officialEmailDomain: "g-wind.com",
    officialPhone: "(907) 978-9651",
    yearEstablished: 1995,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "g-wind",
    dockPickupRules: [
      {
        placeId: "place:cruise_terminal:icy-strait-point",
        dockOrTerminalName: "Icy Strait Point Excursion Hub",
        pickupProvided: true,
        meetingPointInstructions: "Walk through Adventure Center Door #2 (or take free Transporter Gondola from Wilderness Landing) to Excursion Hub 10 minutes before tour time.",
        addedBufferMinutesEachWay: 10,
      },
    ],
    accessibilityAndMobilityNotes:
      "Not wheelchair or scooter accessible (requires ~500-yard walk to Excursion Hub, van entry, and tidal harbor ramp).",
    weightAndAgePolicies:
      "Ages 9+ on shared public departures (minimum age may be waived when reserving all 13 spaces privately).",
    heroImage: "/images/alaska/whale-watching.jpg",
    heroImageAlt: "Humpback whale breaching in Icy Strait",
    heroImageCredit: "Public domain · NPS / Kaitlin Thoreson",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Glacier Wind Charters — Official Hoonah Tours & FAQs",
        url: "https://www.g-wind.com/faq/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 11. ICY STRAIT WHALE ADVENTURES (Hoonah — Independent Local Operator #3!)
  {
    operatorId: "operator:icy-strait-whale-adventures",
    slug: "icy-strait-whale-adventures",
    legacyCompanyAliases: ["icystraitwhaleadventures"],
    name: "Icy Strait Whale Adventures",
    tagline: "Locally operated Hoonah whale-watching and coastal brown bear excursions departing Hoonah Harbor with Icy Strait Point pickup.",
    headquartersCommunityId: "place:community:hoonah",
    servedPlaceIds: ["place:community:hoonah", "place:cruise_terminal:icy-strait-point"],
    publicPortSlugs: ["hoonah", "icy-strait-point"],
    categorySlugs: ["whale-watching"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Locally Operated in Hoonah",
        evidenceSummary: "Hoonah-based captains and local guides sharing Tlingit Haa Aaní coastal waters.",
        sourceUrl: "https://icystraitwhaleadventures.com/",
      },
    ],
    companyOverview:
      "Rooted in Hoonah with captains and guides raised on local Chichagof Island waters, Icy Strait Whale Adventures operates 2.5-hour Point Adolphus whale-watching cruises on 22-passenger custom small-group vessels, 49-passenger catamarans, and 6-guest private charters, plus small-van Chichagof brown bear searches.",
    cruiseLogisticsSummary:
      "Meets cruise travelers at the Icy Strait Point Excursion Hub (via Adventure Center Door #2 or Transporter Gondola) for shuttle transfer to Hoonah Boat Harbor and guaranteed return to port.",
    officialWebsite: "https://icystraitwhaleadventures.com/",
    officialEmailDomain: "icystraitwhaleadventures.com",
    officialPhone: "(907) 723-7447",
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "icystraitwhaleadventures",
    dockPickupRules: [
      {
        placeId: "place:cruise_terminal:icy-strait-point",
        dockOrTerminalName: "Icy Strait Point Excursion Hub",
        pickupProvided: true,
        meetingPointInstructions: "Meet guide at ISP Excursion Hub near Adventure Center Door #2 for shuttle transfer to Hoonah Harbor.",
        addedBufferMinutesEachWay: 10,
      },
    ],
    accessibilityAndMobilityNotes:
      "Boats are not wheelchair accessible inside cabins, though foldable wheelchairs can be stowed on the aft deck or dock if guests can board with captain assistance.",
    weightAndAgePolicies:
      "Suitable for all ages; child fares offered.",
    heroImage: "/images/alaska/isp-whale-watch.jpg",
    heroImageAlt: "Whale watching off Point Adolphus and Hoonah",
    heroImageCredit: "Public domain · NOAA",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Icy Strait Whale Adventures — Official Hoonah Catalog",
        url: "https://icystraitwhaleadventures.com/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 12. ICY STRAIT POINT ADVENTURES / HUNA TOTEM CORPORATION (Icy Strait Point)
  {
    operatorId: "operator:icy-strait-point-adventures",
    slug: "icy-strait-point-adventures",
    name: "Icy Strait Point Adventures (Huna Totem Corporation)",
    tagline: "100% Alaska Native-owned Cannery Point destination operator of the World's Largest ZipRider, SkyGlider Gondola, and on-pier excursions.",
    headquartersCommunityId: "place:community:hoonah",
    servedPlaceIds: ["place:cruise_terminal:icy-strait-point"],
    publicPortSlugs: ["icy-strait-point"],
    categorySlugs: ["gondola-and-zipline", "cultural-and-totem-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "alaska_native_corporation_owned",
        label: "100% Alaska Native Owned (Huna Totem Corp)",
        evidenceSummary: "Owned and operated by Huna Totem Corporation representing Xunaa Káawu (Huna Tlingit) shareholders.",
        sourceUrl: "https://hunatotem.com/investments/",
      },
    ],
    companyOverview:
      "Owned by Huna Totem Corporation at 108 Cannery Road, Icy Strait Point Adventures operates the on-site aerial gondolas, the 5,495-foot six-cable ZipRider descending Hoonah Mountain, ADA-accessible Mountain Top Forest Tram tours, and Tlingit cultural programming directly at Ocean and Wilderness Landings.",
    cruiseLogisticsSummary:
      "Departs directly on-site from Ocean Landing and Wilderness Landing (connected by the free 5-minute Transporter Gondola); most official ISP excursions are reserved through your cruise line's shore-excursion portal.",
    officialWebsite: "https://icystraitpoint.com/",
    officialEmailDomain: "icystraitpoint.com",
    officialPhone: "(800) 979-3866",
    yearEstablished: 2004,
    socialLinks: {},
    bookingPlatform: "Direct Website",
    dockPickupRules: [
      {
        placeId: "place:cruise_terminal:icy-strait-point",
        dockOrTerminalName: "Ocean Landing & Wilderness Landing On-Site",
        pickupProvided: true,
        meetingPointInstructions: "On-site departure right off Ocean Landing or Wilderness Landing via free Transporter Gondola.",
        addedBufferMinutesEachWay: 5,
      },
    ],
    accessibilityAndMobilityNotes:
      "Boardwalks, gondolas, CareCarts, and the Mountain Top Forest Tram are ADA accessible.",
    weightAndAgePolicies:
      "World's Largest ZipRider requires rider weight between 75 lbs and 275 lbs.",
    heroImage: "/images/alaska/icy-strait-point-wilderness.jpg",
    heroImageAlt: "Icy Strait Point cannery and mountain gondola",
    heroImageCredit: "CC BY-SA 4.0 · Enrico Blasutto",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Icy Strait Point — Official Excursions & ZipRider",
        url: "https://icystraitpoint.com/excursions/worlds-largest-ziprider/",
        sourceKind: "tribal_or_native_corp",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 13. TAQUAN AIR (Ketchikan)
  {
    operatorId: "operator:taquan-air",
    slug: "taquan-air",
    legacyCompanyAliases: ["taquanair"],
    name: "Taquan Air",
    tagline: "Ketchikan floatplane air carrier flying DeHavilland Beaver and Otter excursions into Misty Fjords National Monument and Tongass bear observatories.",
    headquartersCommunityId: "place:community:ketchikan",
    servedPlaceIds: ["place:community:ketchikan"],
    publicPortSlugs: ["ketchikan"],
    categorySlugs: ["misty-fjords-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Locally Owned in Ketchikan (45+ Years)",
        evidenceSummary: "Established in Ketchikan at 4085 Tongass Ave (Adventure Green Alaska certified; affiliate Kawanti Adventures owned by Brien Salazar).",
        sourceUrl: "https://taquanair.com/about/",
      },
    ],
    companyOverview:
      "Operating for over 45 years from its waterfront floatplane terminal at 4085 Tongass Avenue in Ketchikan, Taquan Air flies classic DeHavilland Beaver and Turbine Otter floatplanes into Misty Fjords National Monument (including alpine lake/fjord water landings) and permitted USFS black and brown bear viewing platforms.",
    cruiseLogisticsSummary:
      "IMPORTANT DOCK RULE: Direct independent bookings include shuttle pickup ONLY from Downtown Ketchikan Berth 2 (at the Rain Gauge near 'The Rock' statue, 10 minutes prior). Guests docked at Ward Cove (~5.5–7 miles north) must take the free 20-minute Ward Cove shuttle to Downtown Berth 4 first (budget 35–45 minutes extra) or take a taxi directly to 4085 Tongass Ave.",
    officialWebsite: "https://taquanair.com/",
    officialEmailDomain: "taquanair.com",
    officialPhone: "(907) 225-8800",
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "taquanair",
    dockPickupRules: [
      {
        placeId: "place:community:ketchikan",
        dockOrTerminalName: "Downtown Ketchikan Berth 2 (Rain Gauge near The Rock)",
        pickupProvided: true,
        meetingPointInstructions: "Meet shuttle at Berth 2 Rain Gauge 10 minutes before tour time. No independent pickup at Ward Cove (take free Ward Cove shuttle to Berth 4 early).",
        addedBufferMinutesEachWay: 15,
      },
    ],
    accessibilityAndMobilityNotes:
      "Waterfront terminal has extended non-skid float ramps, though aircraft boarding requires stepping onto pontoons and climbing cabin steps; strict no-bag policy onboard (free terminal storage).",
    weightAndAgePolicies:
      "FAA weight-and-balance manifest required: guests weighing 250+ lbs (clothed) may incur a $150–$168 operator surcharge.",
    heroImage: "/images/alaska/misty-fjords.jpg",
    heroImageAlt: "Floatplane territory in Misty Fjords National Monument",
    heroImageCredit: "Public domain · U.S. Forest Service",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Taquan Air — Official Misty Fjords Tours & FAQs",
        url: "https://taquanair.com/faq/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 14. ALLEN MARINE TOURS (Sitka & Ketchikan)
  {
    operatorId: "operator:allen-marine-tours",
    slug: "allen-marine-tours",
    legacyCompanyAliases: ["allen-marine"],
    name: "Allen Marine Tours",
    tagline: "Alaskan-built expedition catamarans operating Sitka Sound sea otter & whale quests and Ketchikan Misty Fjords cruises.",
    headquartersCommunityId: "place:community:sitka",
    servedPlaceIds: [
      "place:community:sitka",
      "place:cruise_terminal:sitka-sound-cruise-terminal",
      "place:community:ketchikan",
    ],
    publicPortSlugs: ["sitka", "ketchikan"],
    categorySlugs: ["whale-and-wildlife-boat-tours", "misty-fjords-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "regional_alaska_operator",
        label: "Sitka-Headquartered Alaskan Shipbuilder & Operator",
        evidenceSummary: "Designs, builds (Allen Marine Inc. shipyard in Sitka), and operates custom aluminum sightseeing catamarans across Southeast Alaska.",
        sourceUrl: "https://allenmarinetours.com/",
      },
    ],
    companyOverview:
      "Headquartered in Sitka where it builds its own custom waterjet catamarans, Allen Marine Tours runs naturalist-guided marine wildlife quests in Sitka Sound (sea otters, humpbacks, Steller sea lions) and rain-safe high-speed fjord voyages into Misty Fjords National Monument from Ketchikan.",
    cruiseLogisticsSummary:
      "Boards right at Sitka Sound Cruise Terminal in Sitka and downtown cruise berths in Ketchikan with heated ADA-accessible main cabins.",
    officialWebsite: "https://allenmarinetours.com/",
    officialEmailDomain: "allenmarinetours.com",
    officialPhone: "(907) 747-8100",
    socialLinks: {},
    bookingPlatform: "Direct Website",
    dockPickupRules: [
      {
        placeId: "place:community:sitka",
        dockOrTerminalName: "Sitka Sound Cruise Terminal & Crescent Harbor",
        pickupProvided: true,
        meetingPointInstructions: "Direct dockside catamaran boarding at Sitka Sound Cruise Terminal.",
        addedBufferMinutesEachWay: 5,
      },
      {
        placeId: "place:community:ketchikan",
        dockOrTerminalName: "Downtown Ketchikan Berths 3–4",
        pickupProvided: true,
        meetingPointInstructions: "Direct waterfront catamaran boarding downtown (Ward Cove guests allow 30m shuttle transfer).",
        addedBufferMinutesEachWay: 10,
      },
    ],
    accessibilityAndMobilityNotes:
      "Ramp boarding and ADA-accessible heated lower observation salons with restrooms.",
    weightAndAgePolicies:
      "All ages welcome; family- and senior-friendly enclosed catamarans.",
    heroImage: "/images/alaska/allen-marine-catamaran.jpg",
    heroImageAlt: "High-speed sightseeing catamaran in Southeast Alaska fjords",
    heroImageCredit: "CC BY-SA 4.0 · Verified Alaska Archive",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Allen Marine Tours — Official Southeast Alaska Excursions",
        url: "https://allenmarinetours.com/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 15. CAPE FOX TOURS (Ketchikan)
  {
    operatorId: "operator:cape-fox-tours",
    slug: "cape-fox-tours",
    name: "Cape Fox Tours",
    tagline: "Alaska Native village corporation operator of cultural clan house, carving shed, and standing totem tours at Saxman Native Village near Ketchikan.",
    headquartersCommunityId: "place:community:ketchikan",
    servedPlaceIds: ["place:community:ketchikan"],
    publicPortSlugs: ["ketchikan"],
    categorySlugs: ["cultural-and-totem-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "alaska_native_corporation_owned",
        label: "Alaska Native Owned (Cape Fox Corporation · Saxman)",
        evidenceSummary: "Tourism arm of Cape Fox Corporation representing the Saaḵ’w Kwáan Tlingit village of Saxman.",
        sourceUrl: "https://www.capefoxtours.com/",
      },
    ],
    companyOverview:
      "Owned by Cape Fox Corporation for the Tlingit village of Saxman just south of Ketchikan, Cape Fox Tours leads authentic cultural visits to Saxman Native Village's standing totem park, Beaver Clan House traditional song and dance, and active master woodcarving center.",
    cruiseLogisticsSummary:
      "Includes round-trip coach transfers from Downtown Ketchikan Berth 2 Visitors Center (Ward Cove passengers ride the free 20-minute shuttle to Berth 4 first unless booked on a ship coach).",
    officialWebsite: "https://www.capefoxtours.com/",
    officialEmailDomain: "capefoxtours.com",
    officialPhone: "(907) 225-4846",
    socialLinks: {},
    bookingPlatform: "Direct Website",
    dockPickupRules: [
      {
        placeId: "place:community:ketchikan",
        dockOrTerminalName: "Downtown Ketchikan Berth 2 Visitors Center",
        pickupProvided: true,
        meetingPointInstructions: "15-minute coastal coach transfer south along Tongass Hwy to Saxman Native Village.",
        addedBufferMinutesEachWay: 15,
      },
    ],
    accessibilityAndMobilityNotes:
      "Paved totem park walkways and wheelchair-accessible Beaver Clan House.",
    weightAndAgePolicies:
      "All ages welcome.",
    heroImage: "/images/alaska/saxman-totem.jpg",
    heroImageAlt: "Standing carved cedar totem poles at Saxman Native Village",
    heroImageCredit: "Public domain · USDA",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Cape Fox Tours — Official Saxman Cultural Excursions",
        url: "https://www.capefoxtours.com/",
        sourceKind: "tribal_or_native_corp",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 16. ALASKA X (Skagway + Juneau & Haines)
  {
    operatorId: "operator:alaska-x",
    slug: "alaska-x",
    name: "Alaska X (Alaska Excursions)",
    tagline: "Locally owned in Skagway since 1991 operating Grizzly Falls Ziplining, Dyea Musher's Camp, Davidson Glacier canoe safaris, and Chilkoot horseback rides.",
    headquartersCommunityId: "place:community:skagway",
    servedPlaceIds: [
      "place:community:skagway",
      "place:community:juneau",
      "place:community:haines",
    ],
    publicPortSlugs: ["skagway", "juneau", "haines"],
    categorySlugs: ["dog-sledding-and-glacier-tours", "gondola-and-zipline"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Locally Owned in Skagway Since 1991",
        evidenceSummary: "Founded in Skagway in 1991 by Southeast Alaska native Robert Murphy (Mile 2 Klondike Hwy).",
        sourceUrl: "https://www.alaskax.com/Home/About",
      },
    ],
    companyOverview:
      "Founded in Skagway in 1991 by Robert Murphy, Alaska X (Alaska Excursions) runs flagship outdoor adventures out of historic Dyea and Lynn Canal—including 4x4 Unimog climbs to Musher's Camp husky cart rides, the Grizzly Falls canopy zipline course, 6-hour Glacier Point Wilderness canoe safaris to Davidson Glacier, and Chilkoot horseback rides, plus Douglas Island sled-dog camps in Juneau.",
    cruiseLogisticsSummary:
      "Meets cruise passengers directly at their Skagway, Juneau, or Haines cruise dock pickup zone with round-trip transportation and return-to-ship scheduling built around each ship call.",
    officialWebsite: "https://www.alaskax.com/",
    officialEmailDomain: "alaskax.com",
    officialPhone: "(907) 983-4444",
    yearEstablished: 1991,
    socialLinks: {},
    bookingPlatform: "Direct Website",
    dockPickupRules: [
      {
        placeId: "place:community:skagway",
        dockOrTerminalName: "All Skagway Cruise Docks (Broadway, Ore, Railroad Shuttle/Tender Drop)",
        pickupProvided: true,
        meetingPointInstructions: "Round-trip transportation from your Skagway cruise dock security/shuttle greeting zone.",
        addedBufferMinutesEachWay: 10,
      },
    ],
    accessibilityAndMobilityNotes:
      "Musher's Camp tours accommodate manually collapsible wheelchairs if guests can transfer and manage ~10 steps; Glacier Point Canoe, Zipline, and Horseback tours are not wheelchair accessible.",
    weightAndAgePolicies:
      "Children 2 & under free on lap at Musher's Camp; Chilkoot Horseback requires <250 lbs and height >=4'10\" (58 in.); Grizzly Falls Zipline requires closed-toe shoes (typical 50–265 lbs harness range).",
    heroImage: "/images/alaska/glacier-dog-sled.jpg",
    heroImageAlt: "Alaskan husky sled dog team at musher camp",
    heroImageCredit: "Verified Last Frontier Alaska Archive",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Alaska X — Official About & Cruise Dock FAQs",
        url: "https://www.alaskax.com/TravelTips/FAQ",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 17. WHITE PASS & YUKON ROUTE RAILWAY (Skagway)
  {
    operatorId: "operator:white-pass-and-yukon-route",
    slug: "white-pass-and-yukon-route",
    name: "White Pass & Yukon Route Railway",
    tagline: "Historic 1898 narrow-gauge mountain railroad boarding dockside in Skagway for 2,865-foot White Pass Summit climbs.",
    headquartersCommunityId: "place:community:skagway",
    servedPlaceIds: ["place:community:skagway"],
    publicPortSlugs: ["skagway"],
    categorySlugs: ["rail-and-yukon-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "historic_rail_or_utility_operator",
        label: "International Historic Civil Engineering Landmark (1898)",
        evidenceSummary: "Built during the 1898 Klondike Gold Rush climbing 2,865 feet in 20 miles from Skagway.",
        sourceUrl: "https://wpyr.com/",
      },
    ],
    companyOverview:
      "Constructed in 1898 during the Klondike Gold Rush, the narrow-gauge White Pass & Yukon Route climbs cliff-hanging grades, tunnels, and trestles from sea level in Skagway to 2,865 feet at White Pass Summit along the Canadian border.",
    cruiseLogisticsSummary:
      "Trains board right on the pier alongside ships at Skagway's docks or at the downtown Broadway Depot with wheelchair-lift parlor cars available.",
    officialWebsite: "https://wpyr.com/",
    officialEmailDomain: "wpyr.com",
    officialPhone: "(800) 343-7373",
    yearEstablished: 1898,
    socialLinks: {},
    bookingPlatform: "Direct Website",
    dockPickupRules: [
      {
        placeId: "place:community:skagway",
        dockOrTerminalName: "Railroad / Broadway Dockside Track & Downtown Depot",
        pickupProvided: true,
        meetingPointInstructions: "Direct dockside rail boarding or short walk to downtown Skagway depot.",
        addedBufferMinutesEachWay: 5,
      },
    ],
    accessibilityAndMobilityNotes:
      "ADA wheelchair-lift vintage parlor cars and accessible onboard restrooms available on Summit Excursion departures.",
    weightAndAgePolicies:
      "All ages; Summit round-trip stays onboard without disembarking in Canada, while Fraser/Bennett combinations require a valid passport.",
    heroImage: "/images/alaska/white-pass-train.jpg",
    heroImageAlt: "White Pass & Yukon Route train in Skagway mountains",
    heroImageCredit: "CC BY-SA 4.0 · Diego Delso",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "White Pass & Yukon Route — Official Excursions",
        url: "https://wpyr.com/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 18. GALLANT ADVENTURES (Sitka ONLY — Confirmed Sole Port!)
  {
    operatorId: "operator:gallant-adventures",
    slug: "gallant-adventures",
    legacyCompanyAliases: ["gallantadventuresalaska"],
    name: "Gallant Adventures",
    tagline: "Owner-operated 6-passenger Sitka Sound wildlife, whale, and St. Lazaria seabird boat tours with Capt. Paul Davis out of Crescent Harbor.",
    headquartersCommunityId: "place:community:sitka",
    servedPlaceIds: ["place:community:sitka"],
    publicPortSlugs: ["sitka"],
    categorySlugs: ["whale-and-wildlife-boat-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Owner-Operated in Sitka (Capt. Paul Davis)",
        evidenceSummary: "Operated exclusively in Sitka Sound by 100-ton Master Captain & Alaska field geologist Paul Davis.",
        sourceUrl: "https://www.gallantadventures.com/about",
      },
      {
        tag: "independent_small_boat",
        label: "Max 6 Guests Aboard Heated M/V Double G",
        evidenceSummary: "Heated welded-aluminum 6-passenger cabin cruiser M/V Double G with 360-degree windows.",
        sourceUrl: "https://www.gallantadventures.com/tours",
      },
    ],
    companyOverview:
      "Operated exclusively in Sitka by 100-ton Master Captain and field geologist Paul Davis (30,000+ hours captaining Sitka waters), Gallant Adventures leads intimate 3-hour and 5-hour marine wildlife voyages for up to 6 guests aboard the heated aluminum cabin cruiser M/V Double G—tracking humpbacks, sea otters, brown bears, and St. Lazaria Island puffin cliffs.",
    cruiseLogisticsSummary:
      "Meets on the marina side of Harrigan Centennial Hall adjacent to Crescent Harbor (330 Harbor Drive, Sitka). Cruise guests docked 5–6 miles north at Sitka Sound Cruise Terminal ride the free 10–15 minute port shuttle (reserve time slot at sitkadock.com), which drops off right at Harrigan Centennial Hall.",
    officialWebsite: "https://www.gallantadventures.com/",
    officialEmailDomain: "gallantadventures.com",
    officialPhone: "(907) 738-2855",
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "gallantadventuresalaska",
    dockPickupRules: [
      {
        placeId: "place:community:sitka",
        dockOrTerminalName: "Harrigan Centennial Hall / Crescent Harbor Marina Ramp (330 Harbor Dr)",
        pickupProvided: false,
        meetingPointInstructions: "Take free Sitka Sound Cruise Terminal shuttle (sitkadock.com) directly to Harrigan Centennial Hall (330 Harbor Dr), or tender directly to Crescent Harbor.",
        addedBufferMinutesEachWay: 20,
      },
    ],
    accessibilityAndMobilityNotes:
      "6-passenger cabin cruiser accessed via Crescent Harbor float ramp without wheelchair lift; call/text Capt. Paul at (907) 738-2855 prior to booking to discuss mobility device stowage and cabin transfer.",
    weightAndAgePolicies:
      "Maximum 6 passengers per USCG vessel limit; public per-seat and private full-boat options offered.",
    heroImage: "/images/alaska/sitka-sea-otter.jpg",
    heroImageAlt: "Sea otter in Sitka Sound kelp forest",
    heroImageCredit: "Public domain · USFWS",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Gallant Adventures — Official Sitka Sound Tours & Meeting Map",
        url: "https://www.gallantadventures.com/maps",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
      {
        label: "Visit Sitka — Official Local Operator Listing",
        url: "https://visitsitka.org/",
        sourceKind: "official_dmo_tourism",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 19. RAINBOW GLACIER ADVENTURES (Haines & Skagway)
  {
    operatorId: "operator:rainbow-glacier-adventures",
    slug: "rainbow-glacier-adventures",
    legacyCompanyAliases: ["joeordonez"],
    name: "Rainbow Glacier Adventures",
    tagline: "Locally owned in Haines since 1992 leading Chilkoot Lake bear/wildlife viewing, Chilkat Eagle Preserve floats, and Skagway Fast-Ferry & Yukon tours.",
    headquartersCommunityId: "place:community:haines",
    servedPlaceIds: ["place:community:haines", "place:community:skagway"],
    publicPortSlugs: ["haines", "skagway"],
    categorySlugs: ["wildlife-and-eagle-tours", "rail-and-yukon-tours"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Locally Owned in Haines Since 1992",
        evidenceSummary: "Owned and operated since 1992 by Haines resident naturalist and author Joe Ordóñez.",
        sourceUrl: "https://tourhaines.com/about-joe-ordonez/",
      },
    ],
    companyOverview:
      "Founded in Haines in 1992 by resident naturalist and Alaska guide author Joe Ordóñez, Rainbow Glacier Adventures leads small-group (avg 6–8, max 14) Chilkoot Lake wildlife/bear spotting tours, calm scenic floats through the Chilkat Bald Eagle Preserve, photography safaris, and White Pass/Yukon Suspension Bridge road trips.",
    cruiseLogisticsSummary:
      "Meets Haines cruise guests right outside Port Chilkoot Dock security, AND meets Skagway cruise guests at 7:30 AM at their specific Skagway berth (with round-trip 45-minute Haines-Skagway Fast Ferry tickets and lunch included on 6.5-hour Haines tours).",
    officialWebsite: "https://tourhaines.com/",
    officialEmailDomain: "tourhaines.com",
    officialPhone: "(907) 766-3576",
    yearEstablished: 1992,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "joeordonez",
    dockPickupRules: [
      {
        placeId: "place:community:haines",
        dockOrTerminalName: "Port Chilkoot Cruise Dock (Haines)",
        pickupProvided: true,
        meetingPointInstructions: "Guide meets guests immediately outside Port Chilkoot Dock security holding Rainbow Glacier Adventures sign.",
        addedBufferMinutesEachWay: 5,
      },
      {
        placeId: "place:community:skagway",
        dockOrTerminalName: "Skagway Piers (7:30 AM Meeting for 8:00 AM Fast Ferry)",
        pickupProvided: true,
        meetingPointInstructions: "Meets at Broadway/Ore pier end, Railroad Forward tender ramp, or Railroad Aft shuttle drop-off (allow 30m for Railroad Dock tender/shuttle).",
        addedBufferMinutesEachWay: 20,
      },
    ],
    accessibilityAndMobilityNotes:
      "11-to-14-passenger vans do not have wheelchair lifts, and the Haines-Skagway Fast Ferry cannot carry motorized scooters/electric wheelchairs.",
    weightAndAgePolicies:
      "Chilkat Bald Eagle Preserve Rafting requires minimum age 7; Yukon Suspension Bridge tour requires a valid passport for all guests; drones prohibited.",
    heroImage: "/images/alaska/rainforest-hiking.jpg",
    heroImageAlt: "Chilkat and Chilkoot wilderness near Haines, Alaska",
    heroImageCredit: "Public domain · U.S. Forest Service",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Rainbow Glacier Adventures — Official Port Chilkoot & Skagway Ferry FAQs",
        url: "https://tourhaines.com/frequently-asked-questions/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 20. MUDDY WATER ADVENTURES (Wrangell)
  {
    operatorId: "operator:muddy-water-adventures",
    slug: "muddy-water-adventures",
    legacyCompanyAliases: ["muddywateradventures"],
    name: "Muddy Water Adventures",
    tagline: "Lifelong-Wrangell-owned heated jet-boat expeditions to Anan Bear Observatory, LeConte Glacier, and the Stikine River ~150 ft from Wrangell City Dock.",
    headquartersCommunityId: "place:community:wrangell",
    servedPlaceIds: ["place:community:wrangell"],
    publicPortSlugs: ["wrangell"],
    categorySlugs: ["river-and-glacier-jetboats"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Locally Owned in Wrangell Since 2016",
        evidenceSummary: "Owned and operated by lifelong Wrangell resident and USCG Captain Zach Taylor.",
        sourceUrl: "https://muddywateradventures.com/",
      },
      {
        tag: "independent_small_boat",
        label: "Covered Heated Custom Aluminum Jet Boats",
        evidenceSummary: "Small-group shallow-draft jet boats built for Stikine River sloughs and LeConte icebergs.",
        sourceUrl: "https://muddywateradventures.com/",
      },
    ],
    companyOverview:
      "Founded in 2016 by lifelong Wrangell resident Captain Zach Taylor, Muddy Water Adventures runs covered, heated aluminum jet-boat excursions right from downtown Wrangell into the Stikine-LeConte Wilderness (Shakes Glacier), tide-dependent LeConte Glacier iceberg fields, and permitted USFS Anan Creek black and brown bear viewing.",
    cruiseLogisticsSummary:
      "Check-in office at the southern end of the Stikine Inn sits ~150 feet from Wrangell City Dock; cruise-day departures are timed directly around each visiting ship's arrival and all-aboard schedule.",
    officialWebsite: "https://muddywateradventures.com/",
    officialEmailDomain: "muddywateradventures.com",
    officialPhone: "(907) 305-0206",
    yearEstablished: 2016,
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "muddywateradventures",
    dockPickupRules: [
      {
        placeId: "place:community:wrangell",
        dockOrTerminalName: "Wrangell City Dock / Stikine Inn Office (~150 ft walk)",
        pickupProvided: false,
        meetingPointInstructions: "Walk ~150 feet from Wrangell City Dock gangway to Muddy Water Adventures flags at the south end of Stikine Inn.",
        addedBufferMinutesEachWay: 3,
      },
    ],
    accessibilityAndMobilityNotes:
      "Jet boats are not ADA-certified, though minor mobility assistance can often be arranged in advance via (907) 305-0206 (note: Anan Bear Observatory involves a 0.5-mile trail with stairs).",
    weightAndAgePolicies:
      "Peak Anan Bear Observatory permits (July 5–Aug 25) are strictly capped by the US Forest Service and included in guided tour bookings.",
    heroImage: "/images/alaska/wildlife-bear.jpg",
    heroImageAlt: "Bear viewing along salmon creek in Tongass National Forest",
    heroImageCredit: "Public domain · U.S. Forest Service",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Muddy Water Adventures — Official Wrangell Jet-Boat Tours",
        url: "https://muddywateradventures.com/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
      {
        label: "Travel Wrangell — Official Local Visitor Authority",
        url: "https://travelwrangell.com/",
        sourceKind: "official_dmo_tourism",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // 21. SEEK ALASKA TOURS (Petersburg — Official Domain seekak.com!)
  {
    operatorId: "operator:seek-alaska",
    slug: "seek-alaska",
    legacyCompanyAliases: ["seekalaskatours"],
    name: "Seek Alaska Tours",
    tagline: "5th-generation Alaskan family-owned Petersburg excursions to LeConte Glacier and Frederick Sound whales aboard 13-passenger P/V Point Retreat.",
    headquartersCommunityId: "place:community:petersburg",
    servedPlaceIds: ["place:community:petersburg"],
    publicPortSlugs: ["petersburg"],
    categorySlugs: ["whale-watching", "river-and-glacier-jetboats"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "5th-Generation Alaskan Family Owned (Petersburg)",
        evidenceSummary: "Owned and operated in Petersburg by 5th-generation Alaskan Captain Rob Schwartz (Seek Alaska, LLC).",
        sourceUrl: "https://www.seekak.com/",
      },
      {
        tag: "independent_small_boat",
        label: "Max 13 Guests Aboard Heated P/V Point Retreat",
        evidenceSummary: "USCG-inspected touring vessel P/V Point Retreat with heated booth cabin, restroom, and hydrophone.",
        sourceUrl: "https://www.seekak.com/point-retreat",
      },
    ],
    companyOverview:
      "Operated out of Petersburg by fifth-generation Alaskan Captain Rob Schwartz alongside Captain Dan Cardenas and Colleen Schwartz, Seek Alaska Tours (seekak.com) runs 4-hour LeConte Bay tidewater glacier voyages ('Ice, Ice, Baby'), 6-hour Frederick Sound hydrophone whale expeditions ('Whiskers & Whales'), and private 13-guest charters aboard P/V Point Retreat.",
    cruiseLogisticsSummary:
      "Departs from Petersburg's contiguous downtown municipal harbors (walkable from the small-ship Drive Down Facility). Because Petersburg harbor slips rotate dynamically, exact North/Middle/South Harbor ramp instructions are confirmed directly upon FareHarbor booking or via (907) 518-0265.",
    officialWebsite: "https://www.seekak.com/",
    officialEmailDomain: "seekak.com",
    officialPhone: "(907) 518-0265",
    socialLinks: {},
    bookingPlatform: "FareHarbor",
    fareharborShortname: "seekalaskatours",
    dockPickupRules: [
      {
        placeId: "place:community:petersburg",
        dockOrTerminalName: "Petersburg Downtown Municipal Harbors (Slip Confirmed on Booking)",
        pickupProvided: false,
        meetingPointInstructions: "Walkable from downtown Petersburg & small-ship Drive Down Facility; exact North/Middle/South Harbor float confirmed by Captain Rob (907-518-0265) upon booking.",
        addedBufferMinutesEachWay: 8,
      },
    ],
    accessibilityAndMobilityNotes:
      "P/V Point Retreat features a roomy heated cabin, elevated booth seating, and onboard restroom, accessed via tidal municipal harbor ramps (contact captain before booking regarding mobility needs; no public ADA policy posted).",
    weightAndAgePolicies:
      "1 to 13 passengers max; shared per-person departures require a 4-passenger minimum (full refund if minimum not met).",
    heroImage: "/images/alaska/inside-passage-hero.jpg",
    heroImageAlt: "Frederick Sound and LeConte Bay waters near Petersburg, Alaska",
    heroImageCredit: "CC BY-SA 4.0 · DJ Cane",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [
      {
        label: "Seek Alaska Tours — Official Website & P/V Point Retreat Specs",
        url: "https://www.seekak.com/point-retreat",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
      {
        label: "Port of Petersburg — Municipal Harbors Guide",
        url: "https://www.petersburg.org/port-of-petersburg",
        sourceKind: "official_dmo_tourism",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // =========================================================================
  // HELD OPERATORS IN DCC RESEARCH QUEUE (`held_noindex`)
  // =========================================================================
  {
    operatorId: "operator:bering-sea-crab-fishermens-tour",
    slug: "bering-sea-crab-fishermens-tour",
    name: "Bering Sea Crab Fishermen's Tour (Aleutian Ballad)",
    tagline: "Ketchikan commercial crabbing demonstration aboard the Aleutian Ballad — currently held pending Ward Cove shuttle & partner sign-off.",
    headquartersCommunityId: "place:community:ketchikan",
    servedPlaceIds: ["place:community:ketchikan"],
    publicPortSlugs: ["ketchikan"],
    categorySlugs: ["whale-and-wildlife-boat-tours"],
    verifiedOwnershipBadges: [],
    companyOverview:
      "Operates the amphitheater-seated commercial crab vessel Aleutian Ballad in Ketchikan; profile and self-service checkout remain held pending Ward Cove shuttle buffer and partner attribution sign-off.",
    cruiseLogisticsSummary:
      "Held pending seasonal Ward Cove vs. downtown Ketchikan pier-window confirmation.",
    officialWebsite: "https://56degreesnorth.com/",
    officialEmailDomain: "56degreesnorth.com",
    officialPhone: null,
    socialLinks: {},
    bookingPlatform: "Unverified",
    dockPickupRules: [],
    accessibilityAndMobilityNotes: "Pending verification.",
    weightAndAgePolicies: "Pending verification.",
    heroImage: "/images/portfolio/ketchikan-fishing-vessel.webp",
    heroImageAlt: "Commercial fishing vessel in Ketchikan waters",
    heroImageCredit: "Last Frontier Archive",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [],
    verifiedAt: null,
    lastModifiedAt: "2026-11-17",
    explicitHoldReasons: [
      "Commercially held SKU (aleutian-ballad in HELD_COMMERCIAL_SKUS): awaiting current-season Ward Cove shuttle buffer verification and owner partner-portal sign-off.",
    ],
  },
  {
    operatorId: "operator:island-wings-air-service",
    slug: "island-wings-air-service",
    name: "Island Wings Air Service",
    tagline: "Ketchikan floatplane operator — held in research queue pending standalone direct schedule, weight policy, and Ward Cove pickup verification.",
    headquartersCommunityId: "place:community:ketchikan",
    servedPlaceIds: ["place:community:ketchikan"],
    publicPortSlugs: ["ketchikan"],
    categorySlugs: ["misty-fjords-tours"],
    verifiedOwnershipBadges: [],
    companyOverview:
      "Ketchikan floatplane operator held in DCC's OperatorResearchQueue while separating standalone direct schedule and pickup policies from shared Viator umbrella SKU 6459PRTKTNMISTY.",
    cruiseLogisticsSummary: "Pending direct primary-source pickup verification.",
    officialWebsite: "https://www.islandwings.com/",
    officialEmailDomain: "islandwings.com",
    officialPhone: null,
    socialLinks: {},
    bookingPlatform: "Unverified",
    dockPickupRules: [],
    accessibilityAndMobilityNotes: "Pending verification.",
    weightAndAgePolicies: "Pending verification.",
    heroImage: "/images/alaska/misty-fjords.jpg",
    heroImageAlt: "Misty Fjords floatplane country",
    heroImageCredit: "Public domain · USFS",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [],
    verifiedAt: null,
    lastModifiedAt: "2026-11-17",
    explicitHoldReasons: [
      "Held per DCC channel-equivalence rule: standalone Island Wings direct tours, weight surcharges, and Ward Cove vs. downtown pickup rules must be verified independently of shared Viator reseller SKU 6459PRTKTNMISTY.",
    ],
  },
  {
    operatorId: "operator:juneau-sled-dog-summer-camp-reseller",
    slug: "juneau-sled-dog-summer-camp-reseller",
    name: "Juneau Sled Dog Adventures (Viator Reseller Listing)",
    tagline: "Held reseller brand record pending verification of underlying Sheep Creek camp legal operator identity.",
    headquartersCommunityId: "place:community:juneau",
    servedPlaceIds: ["place:community:juneau"],
    publicPortSlugs: ["juneau"],
    categorySlugs: ["dog-sledding-and-glacier-tours"],
    verifiedOwnershipBadges: [],
    companyOverview:
      "Held in DCC's OperatorResearchQueue because Viator SKU 62390P4 uses a generic marketplace title without a verified standalone official company domain separate from Gold Rush Dog Tours / Sheep Creek operators.",
    cruiseLogisticsSummary: "Pending legal entity verification.",
    officialWebsite: null,
    officialEmailDomain: null,
    officialPhone: null,
    socialLinks: {},
    bookingPlatform: "Unverified",
    dockPickupRules: [],
    accessibilityAndMobilityNotes: "Pending verification.",
    weightAndAgePolicies: "Pending verification.",
    heroImage: "/images/alaska/glacier-dog-sled.jpg",
    heroImageAlt: "Summer sled dog camp",
    heroImageCredit: "Last Frontier Archive",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [],
    verifiedAt: null,
    lastModifiedAt: "2026-11-17",
    explicitHoldReasons: [
      "Reseller brand ambiguity: held from /operators/* indexing until underlying Sheep Creek camp legal operator domain and direct contact are primary-source confirmed.",
    ],
  },
  {
    operatorId: "operator:spirit-of-alaska-gustavus",
    slug: "spirit-of-alaska-gustavus",
    name: "Gustavus & Bartlett Cove Kayak Outfitters (Research Queue)",
    tagline: "Held pending current-season Gustavus / Bartlett Cove guided kayak & charter primary-source verification.",
    headquartersCommunityId: "place:community:gustavus",
    servedPlaceIds: ["place:community:gustavus"],
    publicPortSlugs: ["gustavus"],
    categorySlugs: ["whale-watching"],
    verifiedOwnershipBadges: [],
    companyOverview:
      "Held in DCC's OperatorResearchQueue while verifying current-season independent Gustavus kayak and small-boat charter schedules for fly-in and AMHS ferry visitors.",
    cruiseLogisticsSummary: "Gustavus operators serve fly-in/ferry visitors only (large cruise ships do not disembark in Glacier Bay).",
    officialWebsite: null,
    officialEmailDomain: null,
    officialPhone: null,
    socialLinks: {},
    bookingPlatform: "Unverified",
    dockPickupRules: [],
    accessibilityAndMobilityNotes: "Pending verification.",
    weightAndAgePolicies: "Pending verification.",
    heroImage: "/images/alaska/inside-passage-hero.jpg",
    heroImageAlt: "Bartlett Cove waters",
    heroImageCredit: "CC BY-SA 4.0 · DJ Cane",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [],
    verifiedAt: null,
    lastModifiedAt: "2026-11-17",
    explicitHoldReasons: [
      "Held in OperatorResearchQueue until official website, current-season schedule, and Bartlett Cove vs. Gustavus Dock meeting points are verified.",
    ],
  },
  {
    operatorId: "operator:prince-of-wales-independent-charters",
    slug: "prince-of-wales-independent-charters",
    name: "Prince of Wales Independent Marine Charters (Research Queue)",
    tagline: "Held pending verification of non-ship-exclusive Klawock and Craig harbor operators.",
    headquartersCommunityId: "place:community:klawock",
    servedPlaceIds: ["place:community:klawock"],
    publicPortSlugs: ["klawock"],
    categorySlugs: ["cultural-and-totem-tours"],
    verifiedOwnershipBadges: [],
    companyOverview:
      "Held in DCC's OperatorResearchQueue while separating cruise-line-exclusive Klawock Island excursions from independently bookable Klawock and Craig charter captains.",
    cruiseLogisticsSummary: "Pending tender-buffer verification.",
    officialWebsite: null,
    officialEmailDomain: null,
    officialPhone: null,
    socialLinks: {},
    bookingPlatform: "Unverified",
    dockPickupRules: [],
    accessibilityAndMobilityNotes: "Pending verification.",
    weightAndAgePolicies: "Pending verification.",
    heroImage: "/images/alaska/native-culture-totem.jpg",
    heroImageAlt: "Prince of Wales totem heritage",
    heroImageCredit: "Public domain · USDA",
    claimStatus: "unclaimed",
    integrationApproval: DEFAULT_UNCONNECTED_INTEGRATION,
    operatorReviews: [],
    sources: [],
    verifiedAt: null,
    lastModifiedAt: "2026-11-17",
    explicitHoldReasons: [
      "Held in OperatorResearchQueue pending primary-source verification of independent Klawock/Craig harbor operators and tender return buffers.",
    ],
  },
] as const;

export const SOUTHEAST_ALASKA_TOURS: readonly SoutheastAlaskaTourProductRecord[] = [
  // ================= JUNEAU WHALE WATCHING (4 distinct operators, 6 products) =================
  {
    tourId: "tour:harv-and-marvs:marvs-signature-whale-watch",
    tourSlug: "marvs-signature-whale-watch",
    legacyRouteAliases: [{ company: "alaska-galore-juneau-whale-watching", item: "331813P1" }],
    operatorId: "operator:harv-and-marvs",
    operatorSlug: "harv-and-marvs",
    operatorName: "Harv & Marv's Outback Alaska",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "whale-watching",
    legacyPortActivityHref: "/juneau/whale-watching",
    title: "Marv's Signature 18-Guest Whale Watch",
    summary:
      "4-hour dock-to-dock excursion (~3 hours on the water out of Statter Harbor) capped at 18 guests with both a captain and onboard naturalist, heated cabin, restroom, two viewing decks, and Mendenhall Glacier water-view stop.",
    durationLabel: "4.0 hours (3h on water)",
    durationMinutes: 240,
    typicalDepartureTimes: ["08:30 AM", "10:30 AM", "01:00 PM"],
    fromPriceUsd: 179,
    priceDisplayLabel: "From $179 / person",
    meetingPoint: "Top of your ship's dock ramp (all 4 Juneau docks including AJ Dock)",
    cruisePickupIncluded: true,
    pickupDetails: "Complimentary 25-minute narrated shuttle from all 4 Juneau cruise docks to Statter Harbor.",
    transferBufferMinutesEachWay: 0,
    recommendedMinPortHours: 6.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "3 steps to board boat; collapsible wheelchairs <50 lbs accepted with advance notice.",
    weightOrAgeRestrictions: "All ages welcome (infants 0–24m free; count toward 18-pax USCG cap).",
    image: "/images/alaska/juneau-whale.jpg",
    imageAlt: "Humpback whale in Auke Bay on small-group catamaran",
    imageCredit: "Public domain · NPS",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "331813P1",
    viatorOfficialUrl: "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
    officialProductUrl: "https://www.harvandmarvs-juneau-whale-watching.com/tours/marvs-signature-whale-watch/",
    attributionCampaign: "seak-harv-marvs-signature",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:harv-and-marvs:harvs-original-6-guest-whale-watch",
    tourSlug: "harvs-original-6-guest-whale-watch",
    operatorId: "operator:harv-and-marvs",
    operatorSlug: "harv-and-marvs",
    operatorName: "Harv & Marv's Outback Alaska",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "whale-watching",
    legacyPortActivityHref: "/juneau/whale-watching",
    title: "Harv's Original Max-6-Guest Whale Watch",
    summary:
      "Intimate 6-passenger custom boat whale watch out of Statter Harbor (~3 hours on the water, 4 hours total) with heated cabin, onboard restroom, hydrophone, and direct ramp pickup at all 4 Juneau cruise docks.",
    durationLabel: "4.0 hours (max 6 guests)",
    durationMinutes: 240,
    typicalDepartureTimes: ["08:00 AM", "12:15 PM"],
    fromPriceUsd: 210,
    priceDisplayLabel: "From $210 / person",
    meetingPoint: "Top of your ship's dock ramp (AJ, Franklin, CT, or AS Dock)",
    cruisePickupIncluded: true,
    pickupDetails: "Direct dock-ramp shuttle included.",
    transferBufferMinutesEachWay: 0,
    recommendedMinPortHours: 6.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Not wheelchair accessible; 3 steps onto 6-passenger vessel.",
    weightOrAgeRestrictions: "All ages; max 6 guests total per USCG rules.",
    image: "/images/alaska/whale-watching.jpg",
    imageAlt: "Small-boat humpback whale watching near Juneau",
    imageCredit: "Public domain · NPS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.harvandmarvs-juneau-whale-watching.com/tours/harvs-exclusive-public-whale-tour/",
    attributionCampaign: "seak-harvs-original-6pax",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:juneau-tours-and-whale-watch:auke-bay-whale-watch",
    tourSlug: "auke-bay-whale-watch",
    operatorId: "operator:juneau-tours-and-whale-watch",
    operatorSlug: "juneau-tours-and-whale-watch",
    operatorName: "Juneau Tours & Whale Watch",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "whale-watching",
    legacyPortActivityHref: "/juneau/whale-watching",
    title: "Juneau Auke Bay Whale Watching Cruise",
    summary:
      "3.5-hour dock-to-dock excursion (2 hours on the water in Auke Bay & Favorite Channel + narrated transfers from 492 S. Franklin St) aboard heated custom viewing boats with 100% whale sighting guarantee.",
    durationLabel: "3.5 hours dock-to-dock",
    durationMinutes: 210,
    typicalDepartureTimes: ["09:00 AM", "11:30 AM", "02:00 PM"],
    fromPriceUsd: 155,
    priceDisplayLabel: "From $155 / person",
    meetingPoint: "Goldbelt Tramway Plaza (492 S. Franklin St)",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip coach from Goldbelt Tramway included (AJ Dock guests take 10m port shuttle).",
    transferBufferMinutesEachWay: 5,
    recommendedMinPortHours: 6,
    weatherSensitivity: "Low",
    accessibilityNotes: "Heated cabin and onboard restroom; call ahead regarding coach/boat steps.",
    weightOrAgeRestrictions: "All ages welcome.",
    image: "/images/alaska/juneau-whale.jpg",
    imageAlt: "Auke Bay whale watching cruise",
    imageCredit: "Public domain · NPS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.juneautours.com/juneau-whale-watch-tour/",
    attributionCampaign: "seak-juneau-tours-whale",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:juneau-tours-and-whale-watch:mendenhall-and-whale-combo",
    tourSlug: "mendenhall-and-whale-combo",
    legacyRouteAliases: [{ company: "dolphintours", item: "466119P3" }],
    operatorId: "operator:juneau-tours-and-whale-watch",
    operatorSlug: "juneau-tours-and-whale-watch",
    operatorName: "Juneau Tours & Whale Watch",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "mendenhall-glacier-tours",
    secondaryCategorySlugs: ["whale-watching"],
    legacyPortActivityHref: "/juneau/mendenhall-glacier-tours",
    title: "Juneau Whale Watch & Mendenhall Glacier Combo",
    summary:
      "5-hour dock-to-dock combination pairing 2 hours at USFS Mendenhall Glacier Recreation Area (Nugget Falls & Visitor Center) with a naturalist-guided Auke Bay whale-watching cruise.",
    durationLabel: "5.0 hours dock-to-dock",
    durationMinutes: 300,
    typicalDepartureTimes: ["08:30 AM", "11:30 AM", "01:30 PM"],
    fromPriceUsd: 199,
    priceDisplayLabel: "From $199 / person",
    meetingPoint: "Goldbelt Tramway Plaza (492 S. Franklin St)",
    cruisePickupIncluded: true,
    pickupDetails: "Coordinated transfers between downtown docks, Mendenhall Glacier, and Auke Bay.",
    transferBufferMinutesEachWay: 5,
    recommendedMinPortHours: 7.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Paved Photo Point path; Nugget Falls is a 2-mile round-trip gravel walk.",
    weightOrAgeRestrictions: "All ages welcome.",
    image: "/images/alaska/mendenhall-glacier.jpg",
    imageAlt: "Mendenhall Glacier and Nugget Falls near Juneau",
    imageCredit: "CC BY-SA 4.0 · Gillfoto",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.juneautours.com/mendenhall-glacier-juneau-whale-watching-combo-tour/",
    attributionCampaign: "seak-juneau-tours-combo",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:juneau-tours-and-whale-watch:mendenhall-glacier-shuttle",
    tourSlug: "mendenhall-glacier-shuttle",
    operatorId: "operator:juneau-tours-and-whale-watch",
    operatorSlug: "juneau-tours-and-whale-watch",
    operatorName: "Juneau Tours & Whale Watch",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "mendenhall-glacier-tours",
    legacyPortActivityHref: "/juneau/mendenhall-glacier-tours",
    title: "Mendenhall Glacier Express Round-Trip Shuttle",
    summary:
      "USFS-permitted direct round-trip motorcoach shuttle from 492 S. Franklin St to Mendenhall Glacier Visitor Center with ~2 hours for Nugget Falls and overlooks (park admission included).",
    durationLabel: "3.0 hours dock-to-dock",
    durationMinutes: 180,
    typicalDepartureTimes: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM"],
    fromPriceUsd: 79,
    priceDisplayLabel: "From $79 / person",
    meetingPoint: "Goldbelt Tramway Plaza (492 S. Franklin St)",
    cruisePickupIncluded: true,
    pickupDetails: "Direct coach from downtown tramway plaza.",
    transferBufferMinutesEachWay: 5,
    recommendedMinPortHours: 5.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "ADA lift bus available with 48-hour advance request.",
    weightOrAgeRestrictions: "All ages welcome.",
    image: "/images/alaska/mendenhall-visitor-center.jpg",
    imageAlt: "Mendenhall Glacier Visitor Center",
    imageCredit: "Public domain · USFS",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "5857SHUTTLE",
    viatorOfficialUrl: "https://www.viator.com/tours/Juneau/Round-Trip-Mendenhall-Glacier-Shuttle-Service/d941-5857SHUTTLE",
    officialProductUrl: "https://www.juneautours.com/mendenhall-glacier-shuttle-tour/",
    attributionCampaign: "juneau-mendenhall-shuttle",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:gastineau-guiding:whales-and-wilderness-exploration",
    tourSlug: "whales-and-wilderness-exploration",
    operatorId: "operator:gastineau-guiding",
    operatorSlug: "gastineau-guiding",
    operatorName: "Gastineau Guiding Company",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "whale-watching",
    legacyPortActivityHref: "/juneau/whale-watching",
    title: "Whales & Wilderness Small-Group Exploration",
    summary:
      "3.75-hour naturalist-led whale watch capped at 20 guests aboard custom hinged-window vessels with onboard restroom and $100 cash-back humpback guarantee.",
    durationLabel: "3.75 hours (max 20 guests)",
    durationMinutes: 225,
    typicalDepartureTimes: ["08:30 AM", "01:00 PM"],
    fromPriceUsd: 189,
    priceDisplayLabel: "Check live direct fare",
    meetingPoint: "Elizabeth Peratrovich Plaza (Downtown Juneau)",
    cruisePickupIncluded: true,
    pickupDetails: "Walkable downtown plaza check-in with guided bus transfer to Auke Bay.",
    transferBufferMinutesEachWay: 8,
    recommendedMinPortHours: 6.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Not wheelchair accessible; bus steps and tidal harbor ramp.",
    weightOrAgeRestrictions: "Max 20 guests.",
    image: "/images/alaska/juneau-whale.jpg",
    imageAlt: "Small-group naturalist whale watch in Juneau",
    imageCredit: "Public domain · NPS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://stepintoalaska.com/tour/whales-wilderness/",
    attributionCampaign: "seak-gastineau-whales-wilderness",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:gastineau-guiding:whales-glaciers-and-rainforest-trails",
    tourSlug: "whales-glaciers-and-rainforest-trails",
    operatorId: "operator:gastineau-guiding",
    operatorSlug: "gastineau-guiding",
    operatorName: "Gastineau Guiding Company",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "mendenhall-glacier-tours",
    secondaryCategorySlugs: ["whale-watching"],
    legacyPortActivityHref: "/juneau/mendenhall-glacier-tours",
    title: "Whales, Glaciers & Rainforest Trails (Max 20)",
    summary:
      "5-hour small-group combination pairing a guided USFS Mendenhall rainforest trail walk with a guaranteed humpback whale safari—staying with the same naturalist guide dock-to-dock.",
    durationLabel: "5.0 hours (max 20 guests)",
    durationMinutes: 300,
    typicalDepartureTimes: ["08:15 AM", "12:30 PM"],
    fromPriceUsd: null,
    priceDisplayLabel: "Check cruise/operator schedule",
    meetingPoint: "Juneau Cruise Pier / Downtown Plaza",
    cruisePickupIncluded: true,
    pickupDetails: "Dock-to-dock guided transit included.",
    transferBufferMinutesEachWay: 5,
    recommendedMinPortHours: 7.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Includes ~1-hour forest trail walk on packed gravel.",
    weightOrAgeRestrictions: "Max 20 guests.",
    image: "/images/alaska/rainforest-hiking.jpg",
    imageAlt: "Guided rainforest trail near Mendenhall Glacier",
    imageCredit: "Public domain · USFS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://stepintoalaska.com/tour/whales-glaciers-rainforest-trails/",
    attributionCampaign: "seak-gastineau-whales-glaciers",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:alaska-travel-adventures:best-of-juneau",
    tourSlug: "best-of-juneau",
    legacyRouteAliases: [{ company: "aktraveladventures", item: "best-of-juneau" }],
    operatorId: "operator:alaska-travel-adventures",
    operatorSlug: "alaska-travel-adventures",
    operatorName: "Alaska Travel Adventures",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "whale-watching",
    secondaryCategorySlugs: ["mendenhall-glacier-tours"],
    legacyPortActivityHref: "/juneau/whale-watching",
    title: "Best of Juneau: Whale Watch, Mendenhall Glacier & Gold Creek Salmon Bake",
    summary:
      "6.25-hour triple-highlight Juneau excursion combining Mendenhall Glacier & Visitor Center, a 48-passenger Auke Bay whale watch, and an alderwood-grilled Gold Creek Salmon Bake.",
    durationLabel: "6.25 hours",
    durationMinutes: 375,
    typicalDepartureTimes: ["08:30 AM", "12:00 PM"],
    fromPriceUsd: 279,
    priceDisplayLabel: "From $279 adult / $199 child",
    meetingPoint: "Designated Juneau Cruise Pier Shuttle Area",
    cruisePickupIncluded: true,
    pickupDetails: "Coordinated motorcoach transfers with flexible Salmon Bake return shuttles.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 9,
    weatherSensitivity: "Low",
    accessibilityNotes: "Heated dining domes and enclosed jet boat.",
    weightOrAgeRestrictions: "All ages welcome.",
    image: "/images/alaska/juneau-mendenhall.jpg",
    imageAlt: "Mendenhall Glacier and Juneau coastal scenery",
    imageCredit: "CC BY-SA 4.0 · Gillfoto",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.alaskatraveladventures.com/juneau/best-of-juneau",
    attributionCampaign: "seak-ata-best-of-juneau",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:alaska-travel-adventures:mendenhall-glacier-float-trip",
    tourSlug: "mendenhall-glacier-float-trip",
    operatorId: "operator:alaska-travel-adventures",
    operatorSlug: "alaska-travel-adventures",
    operatorName: "Alaska Travel Adventures",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "mendenhall-glacier-tours",
    legacyPortActivityHref: "/juneau/mendenhall-glacier-tours",
    title: "Mendenhall Glacier Scenic & Mild Whitewater Float Trip",
    summary:
      "3.5-hour guided raft excursion launching on iceberg-dotted Mendenhall Lake and floating 5 miles down the Mendenhall River (up to Class II–III stretches) with rain gear, boots, and riverside snack.",
    durationLabel: "3.5 hours (2h on water)",
    durationMinutes: 210,
    typicalDepartureTimes: ["09:00 AM", "01:30 PM"],
    fromPriceUsd: 209,
    priceDisplayLabel: "From $209 adult / $156 child",
    meetingPoint: "Juneau Cruise Pier Shuttle Zone",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip motorcoach from downtown Juneau cruise docks.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 6,
    weatherSensitivity: "Low",
    accessibilityNotes: "Requires stepping over inflated raft tubes.",
    weightOrAgeRestrictions: "Minimum weight 50 lbs for PFD fit.",
    image: "/images/alaska/mendenhall-glacier.jpg",
    imageAlt: "Mendenhall Lake and glacier terminus",
    imageCredit: "CC BY-SA 4.0 · Gillfoto",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.alaskatraveladventures.com/juneau/mendenhall-glacier-float-trip",
    attributionCampaign: "seak-ata-mendenhall-float",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // ================= JUNEAU HELICOPTER & FLIGHTSEEING (4 operators, 7 products) =================
  {
    tourId: "tour:coastal-helicopters:herbert-glacier-icefield-excursion",
    tourSlug: "herbert-glacier-icefield-excursion",
    legacyRouteAliases: [{ company: "coastalhelicopters", item: "413056" }],
    operatorId: "operator:coastal-helicopters",
    operatorSlug: "coastal-helicopters",
    operatorName: "Coastal Helicopters",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "helicopter-glacier-tours",
    legacyPortActivityHref: "/juneau/helicopter-glacier-tours",
    title: "Herbert Glacier Helicopter Icefield Excursion",
    summary:
      "2h 35m total experience featuring 25–30 minutes of Juneau Icefield flightseeing and a 35–40 minute guided walk on Herbert Glacier with traction overboots and downtown tramway transfers.",
    durationLabel: "2h 35m dock-to-dock",
    durationMinutes: 155,
    typicalDepartureTimes: ["09:00 AM", "11:15 AM", "01:30 PM", "03:45 PM"],
    fromPriceUsd: 459,
    priceDisplayLabel: "From $459 Standard (direct) / Partner listing from $389",
    meetingPoint: "Goldbelt Tram Building (490 S. Franklin St)",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip shuttle between 490 S. Franklin St and Juneau Airport heliport.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 5.5,
    weatherSensitivity: "High",
    accessibilityNotes: "Unassisted aircraft boarding required; no service animals per FAA exit rules.",
    weightOrAgeRestrictions: "All ages (paid seat required); 260–299 lbs +$150, 300+ lbs 2 seats.",
    image: "/images/alaska/juneau-heli-glacier.jpg",
    imageAlt: "Helicopter on Herbert Glacier in Juneau",
    imageCredit: "CC BY-SA 2.0 · Robert Raines",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "6251SHOREXICEWALK",
    viatorOfficialUrl: "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
    officialProductUrl: "https://coastalhelicopters.com/tours/icefield-excursion/",
    attributionCampaign: "juneau-heli-glacier-walk",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:coastal-helicopters:herbert-glacier-dog-sledding",
    tourSlug: "herbert-glacier-dog-sledding",
    operatorId: "operator:coastal-helicopters",
    operatorSlug: "coastal-helicopters",
    operatorName: "Coastal Helicopters",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "helicopter-glacier-tours",
    secondaryCategorySlugs: ["dog-sledding-and-glacier-tours"],
    legacyPortActivityHref: "/juneau/dog-sledding",
    title: "Herbert Glacier Helicopter & Snow Dog Sledding",
    summary:
      "3h 15m excursion flying onto Alaska Icefield Expeditions' summer snow camp on Herbert Glacier for 70–80 minutes on the snow including a ~45-minute husky dog-sled ride.",
    durationLabel: "3h 15m dock-to-dock",
    durationMinutes: 195,
    typicalDepartureTimes: ["08:45 AM", "11:30 AM", "02:15 PM"],
    fromPriceUsd: 769,
    priceDisplayLabel: "From $769 Standard",
    meetingPoint: "Goldbelt Tram Building (490 S. Franklin St)",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip shuttle from downtown Juneau.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 6,
    weatherSensitivity: "High",
    accessibilityNotes: "Walking on snow at high-elevation glacier camp.",
    weightOrAgeRestrictions: "260–299 lbs +$150; 300+ lbs 2 seats.",
    image: "/images/alaska/glacier-dog-sled.jpg",
    imageAlt: "Glacier snow dog sledding camp near Juneau",
    imageCredit: "Last Frontier Archive",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://coastalhelicopters.com/tours/dog-sled-tours/",
    attributionCampaign: "seak-coastal-dogsled",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:northstar-trekking:helicopter-glacier-walkabout",
    tourSlug: "helicopter-glacier-walkabout",
    legacyRouteAliases: [{ company: "northstartrekking", item: "405050" }],
    operatorId: "operator:northstar-trekking",
    operatorSlug: "northstar-trekking",
    operatorName: "NorthStar Trekking",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "helicopter-glacier-tours",
    legacyPortActivityHref: "/juneau/helicopter-glacier-tours",
    title: "Helicopter Glacier Walkabout (1-Hour Guided Ice Walk)",
    summary:
      "3.25-hour total excursion featuring 30 minutes of A-Star 350 flightseeing and a full 1-hour interpretive glacier walk equipped with mountaineering boots, crampons, and rain outerwear (1:6 guide ratio).",
    durationLabel: "3.25 hours (1h on ice)",
    durationMinutes: 195,
    typicalDepartureTimes: ["09:00 AM", "11:45 AM", "02:30 PM"],
    fromPriceUsd: 539,
    priceDisplayLabel: "From $539 / person",
    meetingPoint: "Goldbelt Tramway Downtown",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip NorthStar van from Goldbelt Tramway.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 6,
    weatherSensitivity: "High",
    accessibilityNotes: "1 hour unassisted walking on uneven glacial ice; no bags allowed onboard.",
    weightOrAgeRestrictions: "Ages 8+; 250+ lbs clothed weight surcharge ($250).",
    image: "/images/alaska/glacier-flightseeing.jpg",
    imageAlt: "Guided crampon walk on Juneau Icefield",
    imageCredit: "CC BY-SA 2.0 · Robert Raines",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://northstartrekking.com/adventures/helicopter-glacier-walkabout/",
    attributionCampaign: "seak-northstar-walkabout",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:northstar-trekking:helicopter-glacier-trek",
    tourSlug: "helicopter-glacier-trek",
    operatorId: "operator:northstar-trekking",
    operatorSlug: "northstar-trekking",
    operatorName: "NorthStar Trekking",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "helicopter-glacier-tours",
    legacyPortActivityHref: "/juneau/helicopter-glacier-tours",
    title: "Extended 2-Hour Helicopter Glacier Trek",
    summary:
      "4.25-hour signature glacier trekking expedition featuring 2 full hours of crampon, helmet, and ice-axe hiking across remote blue crevasses and moulins on the Juneau Icefield.",
    durationLabel: "4.25 hours (2h on ice)",
    durationMinutes: 255,
    typicalDepartureTimes: ["08:45 AM", "01:15 PM"],
    fromPriceUsd: 599,
    priceDisplayLabel: "From $599 / person",
    meetingPoint: "Goldbelt Tramway Downtown",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip van from downtown Juneau.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 7,
    weatherSensitivity: "High",
    accessibilityNotes: "Moderate-strenuous 2-hour glacier hike.",
    weightOrAgeRestrictions: "Ages 12+; 250+ lbs surcharge ($150–$250).",
    image: "/images/alaska/juneau-heli-glacier.jpg",
    imageAlt: "Technical glacier trekking near Juneau",
    imageCredit: "CC BY-SA 2.0 · Robert Raines",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://northstartrekking.com/adventures/helicopter-glacier-trek/",
    attributionCampaign: "seak-northstar-trek",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:temsco-helicopters:mendenhall-glacier-and-guided-walk",
    tourSlug: "mendenhall-glacier-and-guided-walk",
    legacyRouteAliases: [{ company: "temscoair-juneau", item: "mendenhall-glacier" }],
    operatorId: "operator:temsco-helicopters",
    operatorSlug: "temsco-helicopters",
    operatorName: "TEMSCO Helicopters",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "helicopter-glacier-tours",
    legacyPortActivityHref: "/juneau/helicopter-glacier-tours",
    title: "Mendenhall Glacier Helicopter & Guided Ice Walk",
    summary:
      "2h 15m Juneau helicopter excursion over Mendenhall Towers and Tongass rainforest with a 20–25 minute guided walk directly on Mendenhall Glacier (NEOS traction overboots & downtown shuttle included).",
    durationLabel: "2h 15m dock-to-dock",
    durationMinutes: 135,
    typicalDepartureTimes: ["08:30 AM", "10:45 AM", "01:15 PM", "03:30 PM"],
    fromPriceUsd: 449,
    priceDisplayLabel: "From $449 / person",
    meetingPoint: "Downtown Juneau Central Cruise Meeting Point",
    cruisePickupIncluded: true,
    pickupDetails: "Complimentary round-trip transfer to 1650 Maplesden Way heliport.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 5,
    weatherSensitivity: "High",
    accessibilityNotes: "~200-ft walk on ice with overboots; no bags or service animals onboard.",
    weightOrAgeRestrictions: "All ages (250+ lbs clothed incurs +$150 surcharge).",
    image: "/images/alaska/glacier-flightseeing.jpg",
    imageAlt: "TEMSCO helicopter flight over Mendenhall Glacier",
    imageCredit: "CC BY-SA 2.0 · Robert Raines",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
    attributionCampaign: "seak-temsco-mendenhall-heli",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:temsco-helicopters:juneau-mendenhall-dog-sledding",
    tourSlug: "juneau-mendenhall-dog-sledding",
    operatorId: "operator:temsco-helicopters",
    operatorSlug: "temsco-helicopters",
    operatorName: "TEMSCO Helicopters",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "helicopter-glacier-tours",
    secondaryCategorySlugs: ["dog-sledding-and-glacier-tours"],
    legacyPortActivityHref: "/juneau/dog-sledding",
    title: "Dog Sledding on Mendenhall Glacier by Helicopter",
    summary:
      "2h 45m flightseeing and real-snow husky mushing excursion landing at TEMSCO's high-elevation Mendenhall Glacier dog camp for 1 hour on snow plus puppy visits.",
    durationLabel: "2h 45m dock-to-dock",
    durationMinutes: 165,
    typicalDepartureTimes: ["09:00 AM", "12:00 PM", "02:30 PM"],
    fromPriceUsd: 759,
    priceDisplayLabel: "From $759 / person",
    meetingPoint: "Downtown Juneau Central Cruise Meeting Point",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip shuttle included.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 5.5,
    weatherSensitivity: "High",
    accessibilityNotes: "Snow camp walking; NEOS overboots supplied.",
    weightOrAgeRestrictions: "Ages 2+; 250+ lbs surcharge (+$150).",
    image: "/images/alaska/glacier-dog-sled.jpg",
    imageAlt: "Mendenhall Glacier snow dog sledding camp",
    imageCredit: "Last Frontier Archive",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://temscoair.com/juneau-helicopter-tours/dog-sled/",
    attributionCampaign: "seak-temsco-juneau-dogsled",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:wings-airways:taku-lodge-5-glacier-seaplane",
    tourSlug: "taku-lodge-5-glacier-seaplane",
    legacyRouteAliases: [{ company: "wingsairways", item: "110048P1" }],
    operatorId: "operator:wings-airways",
    operatorSlug: "wings-airways",
    operatorName: "Wings Airways & Taku Glacier Lodge",
    primaryPlaceId: "place:community:juneau",
    portSlug: "juneau",
    categorySlug: "helicopter-glacier-tours",
    legacyPortActivityHref: "/juneau/flightseeing",
    title: "Taku Glacier Lodge Feast & 5-Glacier Seaplane Discovery",
    summary:
      "3.5-hour DeHavilland Otter floatplane flight from downtown Juneau's waterfront over 5 glaciers to historic 1923 Taku Lodge for wild alderwood-grilled King salmon.",
    durationLabel: "3.5 hours",
    durationMinutes: 210,
    typicalDepartureTimes: ["09:00 AM", "12:00 PM", "03:00 PM"],
    fromPriceUsd: 395,
    priceDisplayLabel: "Typical from $395 / person",
    meetingPoint: "Wings Airways Dock, 2 Marine Way (Downtown Waterfront)",
    cruisePickupIncluded: false,
    pickupDetails: "5–10 minute walk from downtown berths (15m shuttle from AJ Dock).",
    transferBufferMinutesEachWay: 8,
    recommendedMinPortHours: 6,
    weatherSensitivity: "High",
    accessibilityNotes: "3-step floatplane ladder and wooden lodge trails.",
    weightOrAgeRestrictions: "All ages; window seat for every guest.",
    image: "/images/alaska/taku-lodge.jpg",
    imageAlt: "DeHavilland Otter seaplane at Taku Glacier Lodge",
    imageCredit: "Last Frontier Archive",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "110048P1",
    viatorOfficialUrl: "https://www.viator.com/tours/Juneau/Taku-Lodge-Feast-and-5-Glacier-Seaplane-Discovery/d941-110048P1",
    officialProductUrl: "https://wingsairways.com/",
    attributionCampaign: "juneau-taku-lodge-flight",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // ================= HOONAH WHALE WATCHING (3 distinct operators, 4 products!) =================
  {
    tourId: "tour:whales-of-xunaa:orca-6-guest-whale-watch",
    tourSlug: "orca-6-guest-whale-watch",
    operatorId: "operator:whales-of-xunaa",
    operatorSlug: "whales-of-xunaa",
    operatorName: "Whales of Xunaa",
    primaryPlaceId: "place:community:hoonah",
    portSlug: "hoonah",
    categorySlug: "whale-watching",
    title: "Small-Boat 6-Passenger Point Adolphus Whale Watch (Safeboat Orca)",
    summary:
      "Intimate max-6-passenger humpback whale watch out of Hoonah Boat Harbor aboard the heated 27-ft Safeboat Orca with Captain Paul, including courtesy van pickup at Icy Strait Point Excursion Hub.",
    durationLabel: "~3.0 hours (max 6 guests)",
    durationMinutes: 180,
    typicalDepartureTimes: ["09:00 AM", "01:00 PM"],
    fromPriceUsd: 205,
    priceDisplayLabel: "$205 + Hoonah tax ($218.32)",
    meetingPoint: "Icy Strait Point Excursion Hub or 272 Marine Way, Hoonah",
    cruisePickupIncluded: true,
    pickupDetails: "5-minute courtesy van pickup from ISP Excursion Hub to Hoonah Boat Harbor.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 5.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "27-ft Safeboat with heated cabin; call (907) 321-5501 regarding mobility needs.",
    weightOrAgeRestrictions: "Max 6 guests total including infants on laps.",
    image: "/images/alaska/isp-whale-watch.jpg",
    imageAlt: "Point Adolphus humpback whale off Hoonah",
    imageCredit: "Public domain · NOAA",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.whalesofxunaa.com/",
    attributionCampaign: "seak-whales-of-xunaa-6pax",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:glacier-wind-charters:13-guest-catamaran-whale-watch",
    tourSlug: "13-guest-catamaran-whale-watch",
    operatorId: "operator:glacier-wind-charters",
    operatorSlug: "glacier-wind-charters",
    operatorName: "Glacier Wind Charters",
    primaryPlaceId: "place:community:hoonah",
    portSlug: "hoonah",
    categorySlug: "whale-watching",
    title: "Icy Strait 13-Guest Catamaran Whale Watching & Wildlife Tour",
    summary:
      "3-hour uncrowded whale watch out of Hoonah Boat Harbor (max 13 guests) aboard custom walk-around aluminum catamarans Apogee or Glacier Wind with hydrophone, heated cabin, restroom, and ISP Excursion Hub van transfer.",
    durationLabel: "3.0 hours (max 13 guests)",
    durationMinutes: 180,
    typicalDepartureTimes: ["08:30 AM", "12:30 PM"],
    fromPriceUsd: 229,
    priceDisplayLabel: "From $229 / person",
    meetingPoint: "Icy Strait Point Excursion Hub (10m prior)",
    cruisePickupIncluded: true,
    pickupDetails: "5-minute van transfer from ISP Excursion Hub to 304 Harbor Dr, Hoonah.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 5.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Not wheelchair or scooter accessible (~500-yd ISP walk + tidal ramp).",
    weightOrAgeRestrictions: "Ages 9+ on shared tours (waivable on 13-seat private buyout).",
    image: "/images/alaska/whale-watching.jpg",
    imageAlt: "Humpback whale breaching in Icy Strait",
    imageCredit: "Public domain · NPS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.g-wind.com/whale-watching-and-wildlife-excursion/",
    attributionCampaign: "seak-glacier-wind-13pax",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:icy-strait-whale-adventures:small-group-whale-adventure",
    tourSlug: "small-group-whale-adventure",
    operatorId: "operator:icy-strait-whale-adventures",
    operatorSlug: "icy-strait-whale-adventures",
    operatorName: "Icy Strait Whale Adventures",
    primaryPlaceId: "place:community:hoonah",
    portSlug: "hoonah",
    categorySlug: "whale-watching",
    legacyPortActivityHref: "/icy-strait-point/whale-and-wilderness-tours",
    title: "Point Adolphus Small-Group Whale Adventure",
    summary:
      "2.5-hour Point Adolphus humpback whale watch departing Hoonah Boat Harbor with local Tlingit-community captains on custom 22-passenger small-group boats or 49-guest catamarans, including ISP Excursion Hub shuttle.",
    durationLabel: "2.5 hours",
    durationMinutes: 150,
    typicalDepartureTimes: ["09:00 AM", "01:00 PM"],
    fromPriceUsd: 185,
    priceDisplayLabel: "From $185 / person",
    meetingPoint: "Icy Strait Point Excursion Hub",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip shuttle between ISP Excursion Hub and Hoonah Harbor.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Foldable wheelchairs can be stowed on aft deck if guest steps aboard with assistance.",
    weightOrAgeRestrictions: "All ages welcome.",
    image: "/images/alaska/isp-whale-watch.jpg",
    imageAlt: "Whale watching off Hoonah and Point Adolphus",
    imageCredit: "Public domain · NOAA",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "14707P1",
    viatorOfficialUrl: "https://www.viator.com/tours/Hoonah/Whale-Watch-Adventure/d26215-14707P1",
    officialProductUrl: "https://icystraitwhaleadventures.com/tour/whale-adventure/",
    attributionCampaign: "isp-point-adolphus-whale-watch",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:icy-strait-whale-adventures:exclusive-6-guest-charter",
    tourSlug: "exclusive-6-guest-charter",
    operatorId: "operator:icy-strait-whale-adventures",
    operatorSlug: "icy-strait-whale-adventures",
    operatorName: "Icy Strait Whale Adventures",
    primaryPlaceId: "place:community:hoonah",
    portSlug: "hoonah",
    categorySlug: "whale-watching",
    title: "Exclusive Private 6-Guest Hoonah Whale Charter",
    summary:
      "2.5-hour private family/group whale charter out of Hoonah Boat Harbor for up to 6 guests with ISP Excursion Hub pickup.",
    durationLabel: "2.5 hours (private up to 6)",
    durationMinutes: 150,
    typicalDepartureTimes: ["09:30 AM", "01:30 PM"],
    fromPriceUsd: null,
    priceDisplayLabel: "Check private charter rate",
    meetingPoint: "Icy Strait Point Excursion Hub",
    cruisePickupIncluded: true,
    pickupDetails: "ISP Excursion Hub van pickup included.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Step-on small yacht boarding.",
    weightOrAgeRestrictions: "Up to 6 guests.",
    image: "/images/alaska/whale-watching.jpg",
    imageAlt: "Private whale charter in Icy Strait",
    imageCredit: "Public domain · NPS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://icystraitwhaleadventures.com/tour/exclusive-whale-watching/",
    attributionCampaign: "seak-iswa-private-6pax",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // ================= ICY STRAIT POINT ON-SITE TOURS =================
  {
    tourId: "tour:icy-strait-point-adventures:worlds-largest-ziprider",
    tourSlug: "worlds-largest-ziprider",
    operatorId: "operator:icy-strait-point-adventures",
    operatorSlug: "icy-strait-point-adventures",
    operatorName: "Icy Strait Point Adventures (Huna Totem Corporation)",
    primaryPlaceId: "place:cruise_terminal:icy-strait-point",
    portSlug: "icy-strait-point",
    categorySlug: "gondola-and-zipline",
    title: "Scenic SkyGlider Gondola & World's Largest ZipRider",
    summary:
      "Ascend 1,500+ feet up Hoonah Mountain by red SkyGlider gondola and race side-by-side down six 5,495-foot cables (1,330-ft vertical drop at up to 60 mph) landing on the beach at Cannery Point.",
    durationLabel: "1.5 hours",
    durationMinutes: 90,
    typicalDepartureTimes: ["09:00 AM", "11:00 AM", "01:30 PM", "03:00 PM"],
    fromPriceUsd: null,
    priceDisplayLabel: "Booked via cruise line / ISP portal",
    meetingPoint: "Wilderness Landing / SkyGlider Gondola Base",
    cruisePickupIncluded: true,
    pickupDetails: "On-site at Icy Strait Point (free Transporter Gondola from Ocean Landing).",
    transferBufferMinutesEachWay: 5,
    recommendedMinPortHours: 4,
    weatherSensitivity: "Moderate",
    accessibilityNotes: "Requires short stair climb at launch tower.",
    weightOrAgeRestrictions: "Rider weight strictly 75 to 275 lbs.",
    image: "/images/alaska/icy-strait-point-wilderness.jpg",
    imageAlt: "Icy Strait Point mountain backdrop and cannery shore",
    imageCredit: "CC BY-SA 4.0 · Enrico Blasutto",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://icystraitpoint.com/excursions/worlds-largest-ziprider/",
    attributionCampaign: "seak-isp-ziprider",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:icy-strait-point-adventures:mountain-top-forest-tram",
    tourSlug: "mountain-top-forest-tram",
    operatorId: "operator:icy-strait-point-adventures",
    operatorSlug: "icy-strait-point-adventures",
    operatorName: "Icy Strait Point Adventures (Huna Totem Corporation)",
    primaryPlaceId: "place:cruise_terminal:icy-strait-point",
    portSlug: "icy-strait-point",
    categorySlug: "gondola-and-zipline",
    title: "SkyGlider Gondola & ADA Mountain Top Forest Tram",
    summary:
      "1.5-hour ADA-accessible ascent up Hoonah Mountain by SkyGlider Gondola followed by a 6-mile narrated open-air forest tram ride through old-growth Sitka spruce and hemlock.",
    durationLabel: "1.5 hours (ADA Accessible)",
    durationMinutes: 90,
    typicalDepartureTimes: ["09:30 AM", "12:00 PM", "02:00 PM"],
    fromPriceUsd: null,
    priceDisplayLabel: "Booked via cruise line / ISP portal",
    meetingPoint: "SkyGlider Gondola Base (Wilderness Landing)",
    cruisePickupIncluded: true,
    pickupDetails: "On-site at Icy Strait Point.",
    transferBufferMinutesEachWay: 5,
    recommendedMinPortHours: 4,
    weatherSensitivity: "Low",
    accessibilityNotes: "Explicitly ADA accessible gondola and mountain tram.",
    weightOrAgeRestrictions: "All ages welcome.",
    image: "/images/alaska/rainforest-hiking.jpg",
    imageAlt: "Old-growth rainforest canopy on Chichagof Island",
    imageCredit: "Public domain · USFS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://icystraitpoint.com/excursions/mountain-top-forest-excursions/",
    attributionCampaign: "seak-isp-forest-tram",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // ================= KETCHIKAN MISTY FJORDS & CULTURE =================
  {
    tourId: "tour:taquan-air:misty-fjords-floatplane-flightseeing",
    tourSlug: "misty-fjords-floatplane-flightseeing",
    legacyRouteAliases: [{ company: "taquanair", item: "392949" }],
    operatorId: "operator:taquan-air",
    operatorSlug: "taquan-air",
    operatorName: "Taquan Air",
    primaryPlaceId: "place:community:ketchikan",
    portSlug: "ketchikan",
    categorySlug: "misty-fjords-tours",
    legacyPortActivityHref: "/ketchikan/misty-fjords-tours",
    title: "Misty Fjords National Monument Floatplane Flightseeing",
    summary:
      "1.75-hour excursion (60-minute DeHavilland Beaver/Otter flight) over 3,000-foot granite cliffs, alpine lakes, and New Eddystone Rock with remote fjord/lake water landing.",
    durationLabel: "1.75 hours (60m flight)",
    durationMinutes: 105,
    typicalDepartureTimes: ["08:00 AM", "10:15 AM", "12:30 PM", "02:45 PM"],
    fromPriceUsd: 329,
    priceDisplayLabel: "From $329 direct / Partner from $349",
    meetingPoint: "Downtown Ketchikan Berth 2 Rain Gauge (No Ward Cove direct pickup)",
    cruisePickupIncluded: true,
    pickupDetails: "Direct pickup at Berth 2 Rain Gauge 10m prior; Ward Cove ships must take free 20m shuttle to Berth 4 early.",
    transferBufferMinutesEachWay: 15,
    recommendedMinPortHours: 5,
    weatherSensitivity: "High",
    accessibilityNotes: "Step-on pontoon boarding; strict no-bag policy onboard.",
    weightOrAgeRestrictions: "250+ lbs clothed weight may incur $168 balance surcharge.",
    image: "/images/alaska/misty-fjords.jpg",
    imageAlt: "Misty Fjords granite cliffs near Ketchikan",
    imageCredit: "Public domain · USFS",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "6459PRTKTNMISTY",
    viatorOfficialUrl: "https://www.viator.com/tours/Ketchikan/Ketchikan-Shore-Excursion-Misty-Fjords-National-Monument-Floatplane-Tour/d942-6459PRTKTNMISTY",
    officialProductUrl: "https://taquanair.com/tours/misty-fjords-flightseeing/",
    attributionCampaign: "ketchikan-misty-fjords-floatplane",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:taquan-air:private-custom-misty-fjords-charter",
    tourSlug: "private-custom-misty-fjords-charter",
    operatorId: "operator:taquan-air",
    operatorSlug: "taquan-air",
    operatorName: "Taquan Air",
    primaryPlaceId: "place:community:ketchikan",
    portSlug: "ketchikan",
    categorySlug: "misty-fjords-tours",
    title: "Private Chartered DeHavilland Floatplane Flightseeing",
    summary:
      "Customizable 1-to-3-hour private DeHavilland Beaver or Otter charter from Ketchikan across Misty Fjords National Monument and Revillagigedo Island.",
    durationLabel: "2.0 hours customizable",
    durationMinutes: 120,
    typicalDepartureTimes: ["09:00 AM", "01:00 PM"],
    fromPriceUsd: null,
    priceDisplayLabel: "Call (907) 225-8800 for charter quote",
    meetingPoint: "4085 Tongass Ave / Berth 2 Rain Gauge",
    cruisePickupIncluded: true,
    pickupDetails: "Downtown Berth 2 pickup included.",
    transferBufferMinutesEachWay: 15,
    recommendedMinPortHours: 5.5,
    weatherSensitivity: "High",
    accessibilityNotes: "Step-on floatplane boarding.",
    weightOrAgeRestrictions: "Aircraft payload limits apply.",
    image: "/images/portfolio/alaska-floatplane.webp",
    imageAlt: "Alaska floatplane charter",
    imageCredit: "Last Frontier Archive",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://taquanair.com/tours/private-custom-floatplane-flightseeing/",
    attributionCampaign: "seak-taquan-private-floatplane",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:allen-marine-tours:ketchikan-misty-fjords-catamaran",
    tourSlug: "ketchikan-misty-fjords-catamaran",
    operatorId: "operator:allen-marine-tours",
    operatorSlug: "allen-marine-tours",
    operatorName: "Allen Marine Tours",
    primaryPlaceId: "place:community:ketchikan",
    portSlug: "ketchikan",
    categorySlug: "misty-fjords-tours",
    legacyPortActivityHref: "/ketchikan/misty-fjords-tours",
    title: "Misty Fjords Wilderness Cruise by High-Speed Catamaran",
    summary:
      "4.5-hour rain-safe water voyage aboard a heated expedition catamaran through Behm Canal and Rudyerd Bay's 3,000-ft granite walls with naturalist narration.",
    durationLabel: "4.5 hours",
    durationMinutes: 270,
    typicalDepartureTimes: ["08:30 AM", "01:30 PM"],
    fromPriceUsd: 229,
    priceDisplayLabel: "Typical from $229 / person",
    meetingPoint: "Downtown Ketchikan Berths 3–4",
    cruisePickupIncluded: true,
    pickupDetails: "Direct downtown pier boarding (Ward Cove guests add 30m shuttle transfer).",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 7,
    weatherSensitivity: "Low",
    accessibilityNotes: "Ramp boarding and ADA-accessible main salon.",
    weightOrAgeRestrictions: "All ages welcome.",
    image: "/images/alaska/allen-marine-catamaran.jpg",
    imageAlt: "High-speed catamaran cruising Misty Fjords",
    imageCredit: "CC BY-SA 4.0 · Verified Alaska Archive",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "472133P3",
    viatorOfficialUrl: "https://www.viator.com/tours/Ketchikan/Misty-Fjords-and-Wilderness-Explorer/d942-472133P3",
    officialProductUrl: "https://allenmarinetours.com/",
    attributionCampaign: "ketchikan-misty-fjords-catamaran",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:cape-fox-tours:saxman-native-village-totem-park",
    tourSlug: "saxman-native-village-totem-park",
    operatorId: "operator:cape-fox-tours",
    operatorSlug: "cape-fox-tours",
    operatorName: "Cape Fox Tours",
    primaryPlaceId: "place:community:ketchikan",
    portSlug: "ketchikan",
    categorySlug: "cultural-and-totem-tours",
    legacyPortActivityHref: "/ketchikan/totem-and-cultural-tours",
    title: "Saxman Native Village Totem Pole & Clan House Cultural Tour",
    summary:
      "2.5-hour Tlingit cultural visit to Saxman Native Village featuring standing cedar totems, Beaver Clan House song and dance, and the active master carving shed.",
    durationLabel: "2.5 hours",
    durationMinutes: 150,
    typicalDepartureTimes: ["09:00 AM", "11:30 AM", "02:00 PM"],
    fromPriceUsd: 85,
    priceDisplayLabel: "Typical from $85 / person",
    meetingPoint: "Ketchikan Visitors Center, Berth 2",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip coach from Berth 2 (Ward Cove guests use free shuttle to Berth 4).",
    transferBufferMinutesEachWay: 15,
    recommendedMinPortHours: 5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Wheelchair-accessible Clan House and paved totem paths.",
    weightOrAgeRestrictions: "All ages welcome.",
    image: "/images/alaska/saxman-totem.jpg",
    imageAlt: "Saxman Native Village totem poles",
    imageCredit: "Public domain · USDA",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "445368P5",
    viatorOfficialUrl: "https://www.viator.com/tours/Ketchikan/Saxman-Native-Village-Ketchikan-Highlights-and-Lumberjack-Show/d942-445368P5",
    officialProductUrl: "https://www.capefoxtours.com/",
    attributionCampaign: "ketchikan-saxman-native-village",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // ================= SKAGWAY DOG SLEDDING, GLACIERS & RAIL =================
  {
    tourId: "tour:alaska-x:skagway-mushers-camp-sled-dog",
    tourSlug: "skagway-mushers-camp-sled-dog",
    operatorId: "operator:alaska-x",
    operatorSlug: "alaska-x",
    operatorName: "Alaska X (Alaska Excursions)",
    primaryPlaceId: "place:community:skagway",
    portSlug: "skagway",
    categorySlug: "dog-sledding-and-glacier-tours",
    title: "Musher's Camp & Sled Dog Adventure in Skagway",
    summary:
      "3h 15m Dyea rainforest excursion featuring a 4x4 Unimog climb, 1-mile wheeled summer sled ride behind 16 Alaskan Huskies, kennel talk, and puppy socialization.",
    durationLabel: "3h 15m",
    durationMinutes: 195,
    typicalDepartureTimes: ["08:30 AM", "10:30 AM", "01:00 PM"],
    fromPriceUsd: 200,
    priceDisplayLabel: "From $199.99 / person",
    meetingPoint: "Skagway Cruise Ship Dock Pickup Zone",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip pier transportation included.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 6,
    weatherSensitivity: "Low",
    accessibilityNotes: "Accommodates collapsible wheelchairs if guest can transfer and climb ~10 steps.",
    weightOrAgeRestrictions: "All ages (2 & under free on lap).",
    image: "/images/alaska/glacier-dog-sled.jpg",
    imageAlt: "Alaskan husky sled dog team",
    imageCredit: "Last Frontier Archive",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.alaskax.com/Home/Tours?tourId=6",
    attributionCampaign: "seak-alaskax-mushers-camp",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:alaska-x:glacier-point-wilderness-safari",
    tourSlug: "glacier-point-wilderness-safari",
    operatorId: "operator:alaska-x",
    operatorSlug: "alaska-x",
    operatorName: "Alaska X (Alaska Excursions)",
    primaryPlaceId: "place:community:skagway",
    portSlug: "skagway",
    categorySlug: "dog-sledding-and-glacier-tours",
    title: "Glacier Point Wilderness Canoe Safari (Davidson Glacier)",
    summary:
      "6-hour expedition from Skagway combining a 75-minute Lynn Canal fjord cruise, rainforest walk, and 31-foot voyager canoe paddle to the face of Davidson Glacier (picnic lunch & gear included).",
    durationLabel: "6.0 hours",
    durationMinutes: 360,
    typicalDepartureTimes: ["08:00 AM", "12:00 PM"],
    fromPriceUsd: 350,
    priceDisplayLabel: "From $349.99 / person",
    meetingPoint: "Skagway Cruise Ship Dock Pickup Zone",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip pier pickup included.",
    transferBufferMinutesEachWay: 10,
    recommendedMinPortHours: 8.5,
    weatherSensitivity: "Moderate",
    accessibilityNotes: "Moderate activity; 0.25–1 mile beach/moraine walking + canoe paddling.",
    weightOrAgeRestrictions: "Active participation required.",
    image: "/images/alaska/inside-passage-hero.jpg",
    imageAlt: "Lynn Canal glacier fjord near Skagway",
    imageCredit: "CC BY-SA 4.0 · DJ Cane",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.alaskax.com/Home/Tours?tourId=1",
    attributionCampaign: "seak-alaskax-glacier-point",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:temsco-helicopters:skagway-glacier-discovery",
    tourSlug: "skagway-glacier-discovery",
    legacyRouteAliases: [{ company: "temscoair-skagway", item: "213556" }],
    operatorId: "operator:temsco-helicopters",
    operatorSlug: "temsco-helicopters",
    operatorName: "TEMSCO Helicopters",
    primaryPlaceId: "place:community:skagway",
    portSlug: "skagway",
    categorySlug: "dog-sledding-and-glacier-tours",
    secondaryCategorySlugs: ["helicopter-glacier-tours"],
    title: "Skagway Glacier Discovery by Helicopter (40m Flight + 40m Walk)",
    summary:
      "2-hour helicopter glacier excursion lifting off from Skagway's waterfront heliport over Chilkat, Ferebee, or Meade Glaciers with a 40-minute guided ice walk.",
    durationLabel: "2.0 hours",
    durationMinutes: 120,
    typicalDepartureTimes: ["09:00 AM", "11:30 AM", "02:00 PM"],
    fromPriceUsd: 479,
    priceDisplayLabel: "From $479 / person",
    meetingPoint: "101 Terminal Way Waterfront Heliport, Skagway",
    cruisePickupIncluded: false,
    pickupDetails: "Walk or take $3 SMART shuttle to 101 Terminal Way; return drop-off included.",
    transferBufferMinutesEachWay: 15,
    recommendedMinPortHours: 5,
    weatherSensitivity: "High",
    accessibilityNotes: "~200-ft walk on glacial ice with supplied NEOS overboots.",
    weightOrAgeRestrictions: "Ages 2+; 250+ lbs surcharge (+$150).",
    image: "/images/alaska/glacier-flightseeing.jpg",
    imageAlt: "Skagway glacier helicopter flight",
    imageCredit: "CC BY-SA 2.0 · Robert Raines",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://temscoair.com/skagway-helicopter-tours/glacier-tours/",
    attributionCampaign: "seak-temsco-skagway-glacier",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:temsco-helicopters:skagway-denver-glacier-dogsled",
    tourSlug: "skagway-denver-glacier-dogsled",
    legacyRouteAliases: [{ company: "temscoair-skagway", item: "213561" }],
    operatorId: "operator:temsco-helicopters",
    operatorSlug: "temsco-helicopters",
    operatorName: "TEMSCO Helicopters",
    primaryPlaceId: "place:community:skagway",
    portSlug: "skagway",
    categorySlug: "dog-sledding-and-glacier-tours",
    secondaryCategorySlugs: ["helicopter-glacier-tours"],
    title: "Denver Glacier Helicopter & Sled Dog Camp Demonstration",
    summary:
      "2-hour flight over Taiya Inlet to Denver Glacier snow camp for a 1-hour Iditarod musher presentation, husky demonstration, and puppy visit.",
    durationLabel: "2.0 hours",
    durationMinutes: 120,
    typicalDepartureTimes: ["09:30 AM", "12:15 PM", "02:45 PM"],
    fromPriceUsd: 649,
    priceDisplayLabel: "From $649 / person",
    meetingPoint: "101 Terminal Way Waterfront Heliport, Skagway",
    cruisePickupIncluded: false,
    pickupDetails: "Walk or $3 SMART bus outbound; return drop-off included.",
    transferBufferMinutesEachWay: 15,
    recommendedMinPortHours: 5,
    weatherSensitivity: "High",
    accessibilityNotes: "Snow camp walking; demonstration format (no sled riding on Skagway camp).",
    weightOrAgeRestrictions: "Ages 2+; 250+ lbs surcharge (+$150).",
    image: "/images/alaska/glacier-dog-sled.jpg",
    imageAlt: "Denver Glacier sled dog camp near Skagway",
    imageCredit: "Last Frontier Archive",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://temscoair.com/skagway-helicopter-tours/dog-sledding/",
    attributionCampaign: "seak-temsco-skagway-dogsled",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:white-pass-and-yukon-route:summit-scenic-excursion",
    tourSlug: "summit-scenic-excursion",
    operatorId: "operator:white-pass-and-yukon-route",
    operatorSlug: "white-pass-and-yukon-route",
    operatorName: "White Pass & Yukon Route Railway",
    primaryPlaceId: "place:community:skagway",
    portSlug: "skagway",
    categorySlug: "rail-and-yukon-tours",
    legacyPortActivityHref: "/skagway/white-pass-railway-tours",
    title: "White Pass Summit Scenic Railway Excursion",
    summary:
      "Classic 40-mile round-trip narrow-gauge rail journey climbing 2,865 feet to White Pass Summit past Bridal Veil Falls and Dead Horse Gulch.",
    durationLabel: "2.75 hours",
    durationMinutes: 165,
    typicalDepartureTimes: ["08:15 AM", "12:45 PM", "04:30 PM"],
    fromPriceUsd: 145,
    priceDisplayLabel: "Typical from $145 / person",
    meetingPoint: "Skagway Railroad / Broadway Dock or Downtown Depot",
    cruisePickupIncluded: true,
    pickupDetails: "Direct dockside train boarding.",
    transferBufferMinutesEachWay: 5,
    recommendedMinPortHours: 5.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Wheelchair lift cars available.",
    weightOrAgeRestrictions: "All ages; no passport required when staying onboard round-trip.",
    image: "/images/alaska/white-pass-train.jpg",
    imageAlt: "White Pass Summit narrow-gauge train",
    imageCredit: "CC BY-SA 4.0 · Diego Delso",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "5338PRTSGYCITY",
    viatorOfficialUrl: "https://www.viator.com/tours/Skagway/Skagway-Shore-Excursion-White-Pass-Summit-and-Skagway-City-Tour/d943-5338PRTSGYCITY",
    officialProductUrl: "https://wpyr.com/",
    attributionCampaign: "skagway-white-pass-summit-rail",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:rainbow-glacier-adventures:yukon-suspension-bridge-summit",
    tourSlug: "yukon-suspension-bridge-summit",
    operatorId: "operator:rainbow-glacier-adventures",
    operatorSlug: "rainbow-glacier-adventures",
    operatorName: "Rainbow Glacier Adventures",
    primaryPlaceId: "place:community:skagway",
    portSlug: "skagway",
    categorySlug: "rail-and-yukon-tours",
    legacyPortActivityHref: "/skagway/yukon-excursions",
    title: "White Pass Summit & Yukon Suspension Bridge Small-Group Tour",
    summary:
      "3-hour small-group Klondike Highway drive from Skagway over White Pass Summit into British Columbia to walk the Yukon Suspension Bridge above Tutshi River rapids.",
    durationLabel: "3.0 hours (passport required)",
    durationMinutes: 180,
    typicalDepartureTimes: ["09:00 AM", "01:00 PM"],
    fromPriceUsd: 133,
    priceDisplayLabel: "From $133 / person",
    meetingPoint: "Skagway Cruise Pier Greeting Area",
    cruisePickupIncluded: true,
    pickupDetails: "Round-trip pickup at Skagway docks.",
    transferBufferMinutesEachWay: 15,
    recommendedMinPortHours: 5.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "11-to-14-passenger van without wheelchair lift.",
    weightOrAgeRestrictions: "Valid passport required for US/Canadian border crossing.",
    image: "/images/alaska/yukon-emerald-lake.jpg",
    imageAlt: "Klondike Highway and Yukon scenery",
    imageCredit: "Verified Last Frontier Archive",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://tourhaines.com/white-pass-summit-and-suspension-bridge-tour/",
    attributionCampaign: "seak-rga-yukon-bridge",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // ================= SITKA WHALE & WILDLIFE BOATS (2 operators, 3 products!) =================
  {
    tourId: "tour:gallant-adventures:sitka-3hr-wildlife-boat-tour",
    tourSlug: "sitka-3hr-wildlife-boat-tour",
    legacyRouteAliases: [{ company: "gallantadventuresalaska", item: "229933" }],
    operatorId: "operator:gallant-adventures",
    operatorSlug: "gallant-adventures",
    operatorName: "Gallant Adventures",
    primaryPlaceId: "place:community:sitka",
    portSlug: "sitka",
    categorySlug: "whale-and-wildlife-boat-tours",
    legacyPortActivityHref: "/sitka/wildlife-and-historic-tours",
    title: "3-Hour Sitka Sound 6-Guest Wildlife & Whale Boat Tour",
    summary:
      "Small-group 3-hour wildlife voyage for up to 6 guests aboard the heated aluminum cruiser M/V Double G with Capt. Paul Davis—spotting sea otters, humpbacks, brown bears, and seabirds.",
    durationLabel: "3.0 hours (max 6 guests)",
    durationMinutes: 180,
    typicalDepartureTimes: ["08:30 AM", "12:30 PM"],
    fromPriceUsd: 169,
    priceDisplayLabel: "$169 / person + Sitka tax",
    meetingPoint: "Marina Side of Harrigan Centennial Hall (330 Harbor Dr, Sitka)",
    cruisePickupIncluded: false,
    pickupDetails: "Take free 10–15m Sitka Sound Cruise Terminal shuttle (sitkadock.com) directly to 330 Harbor Dr.",
    transferBufferMinutesEachWay: 20,
    recommendedMinPortHours: 6,
    weatherSensitivity: "Low",
    accessibilityNotes: "6-passenger cabin cruiser accessed via harbor ramp; call (907) 738-2855 for mobility inquiries.",
    weightOrAgeRestrictions: "Max 6 passengers.",
    image: "/images/alaska/sitka-sea-otter.jpg",
    imageAlt: "Sea otter in Sitka Sound",
    imageCredit: "Public domain · USFWS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.gallantadventures.com/tours/3hr-boat-tour",
    attributionCampaign: "seak-gallant-sitka-3hr",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:gallant-adventures:sitka-5hr-st-lazaria-wildlife-tour",
    tourSlug: "sitka-5hr-st-lazaria-wildlife-tour",
    legacyRouteAliases: [{ company: "gallantadventuresalaska", item: "229946" }],
    operatorId: "operator:gallant-adventures",
    operatorSlug: "gallant-adventures",
    operatorName: "Gallant Adventures",
    primaryPlaceId: "place:community:sitka",
    portSlug: "sitka",
    categorySlug: "whale-and-wildlife-boat-tours",
    legacyPortActivityHref: "/sitka/wildlife-and-historic-tours",
    title: "Extended 5-Hour Sitka Sound & St. Lazaria Seabird Refuge Tour",
    summary:
      "5-hour deep Sitka Sound exploration for up to 6 guests aboard M/V Double G reaching outer whale grounds and St. Lazaria Island National Wildlife Refuge puffin cliffs.",
    durationLabel: "5.0 hours (max 6 guests)",
    durationMinutes: 300,
    typicalDepartureTimes: ["08:30 AM"],
    fromPriceUsd: 255,
    priceDisplayLabel: "$255 / person + Sitka tax",
    meetingPoint: "Marina Side of Harrigan Centennial Hall (330 Harbor Dr, Sitka)",
    cruisePickupIncluded: false,
    pickupDetails: "Free Sitka Sound Cruise Terminal shuttle drops right at 330 Harbor Dr.",
    transferBufferMinutesEachWay: 20,
    recommendedMinPortHours: 8,
    weatherSensitivity: "Moderate",
    accessibilityNotes: "Harbor float ramp boarding; contact Capt. Paul ahead for mobility questions.",
    weightOrAgeRestrictions: "Max 6 passengers.",
    image: "/images/alaska/sitka-sound.jpg",
    imageAlt: "Sitka Sound islands and Crescent Harbor",
    imageCredit: "CC BY-SA 4.0 · Joe Mabel",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.gallantadventures.com/tours/5hr-boat-tour",
    attributionCampaign: "seak-gallant-sitka-5hr",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:allen-marine-tours:sitka-sea-otter-wildlife-quest",
    tourSlug: "sitka-sea-otter-wildlife-quest",
    operatorId: "operator:allen-marine-tours",
    operatorSlug: "allen-marine-tours",
    operatorName: "Allen Marine Tours",
    primaryPlaceId: "place:community:sitka",
    portSlug: "sitka",
    categorySlug: "whale-and-wildlife-boat-tours",
    legacyPortActivityHref: "/sitka/wildlife-and-historic-tours",
    title: "Sitka Sound Sea Otter & Marine Wildlife Catamaran Quest",
    summary:
      "3-hour naturalist-guided expedition catamaran voyage directly from Sitka Sound Cruise Terminal through kelp forests for sea otters, humpback whales, and coastal wildlife.",
    durationLabel: "3.0 hours",
    durationMinutes: 180,
    typicalDepartureTimes: ["08:30 AM", "12:30 PM"],
    fromPriceUsd: 189,
    priceDisplayLabel: "Typical from $189 / person",
    meetingPoint: "Sitka Sound Cruise Terminal Dock",
    cruisePickupIncluded: true,
    pickupDetails: "Direct dockside catamaran boarding at Sitka Sound Cruise Terminal.",
    transferBufferMinutesEachWay: 5,
    recommendedMinPortHours: 5.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "ADA-accessible ramp and heated lower viewing cabin.",
    weightOrAgeRestrictions: "All ages welcome.",
    image: "/images/alaska/sitka-sea-otter.jpg",
    imageAlt: "Sea otter floating in Sitka Sound",
    imageCredit: "Public domain · USFWS",
    bookingChannel: "viator_exact_product",
    viatorProductCode: "472133P4",
    viatorOfficialUrl: "https://www.viator.com/tours/Sitka/Whale-Watch-and-Sea-Otter-Quest/d4153-472133P4",
    officialProductUrl: "https://allenmarinetours.com/",
    attributionCampaign: "sitka-sea-otter-wildlife-quest",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // ================= HAINES TOURS (Rainbow Glacier Adventures — 1 operator, 2 products -> category stays in /ports/haines!) =================
  {
    tourId: "tour:rainbow-glacier-adventures:chilkoot-lake-nature-wildlife",
    tourSlug: "chilkoot-lake-nature-wildlife",
    operatorId: "operator:rainbow-glacier-adventures",
    operatorSlug: "rainbow-glacier-adventures",
    operatorName: "Rainbow Glacier Adventures",
    primaryPlaceId: "place:community:haines",
    portSlug: "haines",
    categorySlug: "wildlife-and-eagle-tours",
    title: "Chilkoot Lake Nature, Eagle & Bear Spotting Tour",
    summary:
      "4-hour small-group naturalist tour from Haines Port Chilkoot Dock (or 6.5h from Skagway including Fast Ferry & lunch) exploring Chilkoot River salmon runs, coastal brown bears, and bald eagles with spotting scopes.",
    durationLabel: "4.0h Haines / 6.5h from Skagway",
    durationMinutes: 240,
    typicalDepartureTimes: ["08:30 AM", "01:00 PM"],
    fromPriceUsd: 156,
    priceDisplayLabel: "$156 from Haines / $273 from Skagway w/ Fast Ferry",
    meetingPoint: "Outside Port Chilkoot Dock Security (or 7:30 AM Skagway pier)",
    cruisePickupIncluded: true,
    pickupDetails: "Direct Port Chilkoot Dock pickup in Haines; 7:30 AM Skagway pier transfer to Fast Ferry.",
    transferBufferMinutesEachWay: 5,
    recommendedMinPortHours: 6.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "11–14 passenger van without wheelchair lift.",
    weightOrAgeRestrictions: "All ages welcome.",
    image: "/images/alaska/wildlife-bear.jpg",
    imageAlt: "Bear foraging along coastal Alaska stream",
    imageCredit: "Public domain · USFS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://tourhaines.com/tours/chilkoot-nature-tour/",
    attributionCampaign: "seak-rga-chilkoot-lake",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:rainbow-glacier-adventures:chilkat-eagle-preserve-rafting",
    tourSlug: "chilkat-eagle-preserve-rafting",
    operatorId: "operator:rainbow-glacier-adventures",
    operatorSlug: "rainbow-glacier-adventures",
    operatorName: "Rainbow Glacier Adventures",
    primaryPlaceId: "place:community:haines",
    portSlug: "haines",
    categorySlug: "wildlife-and-eagle-tours",
    title: "Chilkat Bald Eagle Preserve Scenic River Float",
    summary:
      "4-hour calm, no-whitewater guided raft float through the 48,000-acre Alaska Chilkat Bald Eagle Preserve from Haines (or 6.5h from Skagway w/ Fast Ferry & lunch).",
    durationLabel: "4.0h Haines / 6.5h from Skagway",
    durationMinutes: 240,
    typicalDepartureTimes: ["08:30 AM", "12:30 PM"],
    fromPriceUsd: 184,
    priceDisplayLabel: "$184 from Haines / $299 from Skagway w/ Fast Ferry",
    meetingPoint: "Outside Port Chilkoot Dock Security",
    cruisePickupIncluded: true,
    pickupDetails: "Port Chilkoot Dock pickup included.",
    transferBufferMinutesEachWay: 5,
    recommendedMinPortHours: 6.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Calm river float; requires stepping into inflatable raft.",
    weightOrAgeRestrictions: "Minimum age 7 years.",
    image: "/images/alaska/rainforest-hiking.jpg",
    imageAlt: "Chilkat Valley river corridor near Haines",
    imageCredit: "Public domain · USFS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://tourhaines.com/tours/chilkat-bald-eagle-preserve-rafting/",
    attributionCampaign: "seak-rga-chilkat-rafting",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // ================= WRANGELL TOURS (Muddy Water Adventures — 1 operator, 3 products) =================
  {
    tourId: "tour:muddy-water-adventures:anan-bear-observatory-jetboat",
    tourSlug: "anan-bear-observatory-jetboat",
    operatorId: "operator:muddy-water-adventures",
    operatorSlug: "muddy-water-adventures",
    operatorName: "Muddy Water Adventures",
    primaryPlaceId: "place:community:wrangell",
    portSlug: "wrangell",
    categorySlug: "river-and-glacier-jetboats",
    title: "Anan Bear & Wildlife Observatory Jet-Boat Excursion",
    summary:
      "5.5-hour covered jet-boat expedition from downtown Wrangell to Tongass National Forest's Anan Creek (restricted USFS permit included during peak July–Aug season) where both black and brown bears feed on pink salmon.",
    durationLabel: "5 to 6 hours",
    durationMinutes: 330,
    typicalDepartureTimes: ["08:00 AM", "09:00 AM"],
    fromPriceUsd: 400,
    priceDisplayLabel: "From $400+ / person (USFS permit included)",
    meetingPoint: "Stikine Inn South End (~150 ft from Wrangell City Dock)",
    cruisePickupIncluded: false,
    pickupDetails: "2-minute flat walk (~150 ft) off Wrangell City Dock.",
    transferBufferMinutesEachWay: 3,
    recommendedMinPortHours: 8,
    weatherSensitivity: "Low",
    accessibilityNotes: "Includes 0.5-mile forest boardwalk/trail walk with stairs.",
    weightOrAgeRestrictions: "Peak USFS permits limited daily July 5–Aug 25.",
    image: "/images/alaska/wildlife-bear.jpg",
    imageAlt: "Bear along Anan salmon creek near Wrangell",
    imageCredit: "Public domain · USFS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://muddywateradventures.com/",
    attributionCampaign: "seak-muddywater-anan-bears",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:muddy-water-adventures:stikine-river-shakes-glacier",
    tourSlug: "stikine-river-shakes-glacier",
    operatorId: "operator:muddy-water-adventures",
    operatorSlug: "muddy-water-adventures",
    operatorName: "Muddy Water Adventures",
    primaryPlaceId: "place:community:wrangell",
    portSlug: "wrangell",
    categorySlug: "river-and-glacier-jetboats",
    title: "Stikine River & Shakes Glacier Wilderness Jet-Boat Tour",
    summary:
      "3.5-hour heated jet-boat expedition up North America's fastest free-flowing navigable river into the Stikine-LeConte Wilderness and Shakes Lake icebergs.",
    durationLabel: "3.5 hours (cruise-timed)",
    durationMinutes: 210,
    typicalDepartureTimes: ["08:30 AM", "01:00 PM"],
    fromPriceUsd: 280,
    priceDisplayLabel: "From $280 / person",
    meetingPoint: "Stikine Inn South End (~150 ft from Wrangell City Dock)",
    cruisePickupIncluded: false,
    pickupDetails: "~150-ft walk from Wrangell City Dock.",
    transferBufferMinutesEachWay: 3,
    recommendedMinPortHours: 6,
    weatherSensitivity: "Low",
    accessibilityNotes: "Heated covered jet boat; contact +1 (907) 305-0206 for mobility assistance.",
    weightOrAgeRestrictions: "Scheduled to visiting ship hours.",
    image: "/images/alaska/inside-passage-hero.jpg",
    imageAlt: "Stikine-LeConte glacial waters",
    imageCredit: "CC BY-SA 4.0 · DJ Cane",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://muddywateradventures.com/",
    attributionCampaign: "seak-muddywater-stikine",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:muddy-water-adventures:wrangell-leconte-glacier-jetboat",
    tourSlug: "wrangell-leconte-glacier-jetboat",
    operatorId: "operator:muddy-water-adventures",
    operatorSlug: "muddy-water-adventures",
    operatorName: "Muddy Water Adventures",
    primaryPlaceId: "place:community:wrangell",
    portSlug: "wrangell",
    categorySlug: "river-and-glacier-jetboats",
    title: "LeConte Glacier Half-Day Jet-Boat Sightseeing",
    summary:
      "3.5-to-4-hour tide-timed jet-boat voyage from Wrangell across Dry Strait into LeConte Bay to view North America's southernmost tidewater glacier and harbor seals.",
    durationLabel: "3.5 to 4.0 hours",
    durationMinutes: 225,
    typicalDepartureTimes: ["09:00 AM", "01:00 PM"],
    fromPriceUsd: 280,
    priceDisplayLabel: "From $280 / person",
    meetingPoint: "Stikine Inn South End (~150 ft from Wrangell City Dock)",
    cruisePickupIncluded: false,
    pickupDetails: "~150-ft walk from Wrangell City Dock.",
    transferBufferMinutesEachWay: 3,
    recommendedMinPortHours: 6.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Covered heated aluminum jet boat.",
    weightOrAgeRestrictions: "Tide-dependent departure windows.",
    image: "/images/alaska/mendenhall-glacier.jpg",
    imageAlt: "Tidewater glacier ice in Southeast Alaska",
    imageCredit: "CC BY-SA 4.0 · Gillfoto",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://muddywateradventures.com/",
    attributionCampaign: "seak-muddywater-leconte",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // ================= PETERSBURG TOURS (Seek Alaska — 1 operator, 2 products) =================
  {
    tourId: "tour:seek-alaska:ice-ice-baby-leconte-glacier",
    tourSlug: "ice-ice-baby-leconte-glacier",
    operatorId: "operator:seek-alaska",
    operatorSlug: "seek-alaska",
    operatorName: "Seek Alaska Tours",
    primaryPlaceId: "place:community:petersburg",
    portSlug: "petersburg",
    categorySlug: "river-and-glacier-jetboats",
    title: "\"Ice, Ice, Baby\" Half-Day LeConte Glacier Tour",
    summary:
      "4-hour voyage from Petersburg aboard the 13-passenger heated P/V Point Retreat (~24 miles into LeConte Bay fjord) among sculptured icebergs, harbor seals, Tlingit petroglyphs, and views of Devil's Thumb.",
    durationLabel: "4.0 hours (4–13 guests)",
    durationMinutes: 240,
    typicalDepartureTimes: ["08:30 AM", "01:00 PM"],
    fromPriceUsd: 250,
    priceDisplayLabel: "$250 / person + tax",
    meetingPoint: "Petersburg Downtown Municipal Harbors (Slip confirmed on booking)",
    cruisePickupIncluded: false,
    pickupDetails: "Walkable from Petersburg small-ship Drive Down Facility; exact slip confirmed by Capt. Rob (907-518-0265).",
    transferBufferMinutesEachWay: 8,
    recommendedMinPortHours: 6.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Heated booth cabin & restroom onboard; tidal municipal harbor ramp.",
    weightOrAgeRestrictions: "4-guest minimum on shared tours (full refund if not met); 13 max.",
    image: "/images/alaska/inside-passage-hero.jpg",
    imageAlt: "LeConte Bay fjord icebergs near Petersburg",
    imageCredit: "CC BY-SA 4.0 · DJ Cane",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.seekak.com/glacier-tours-alaska",
    attributionCampaign: "seak-seek-alaska-leconte",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    tourId: "tour:seek-alaska:whiskers-and-whales-frederick-sound",
    tourSlug: "whiskers-and-whales-frederick-sound",
    operatorId: "operator:seek-alaska",
    operatorSlug: "seek-alaska",
    operatorName: "Seek Alaska Tours",
    primaryPlaceId: "place:community:petersburg",
    portSlug: "petersburg",
    categorySlug: "whale-watching",
    title: "Whiskers & Whales Full-Day Frederick Sound Expedition",
    summary:
      "6-hour, ~100-mile marine wildlife voyage from Petersburg through Frederick Sound and Stephens Passage aboard 13-passenger P/V Point Retreat with underwater hydrophone for humpback and orca vocalizations.",
    durationLabel: "6.0 hours (4–13 guests)",
    durationMinutes: 360,
    typicalDepartureTimes: ["08:30 AM"],
    fromPriceUsd: 350,
    priceDisplayLabel: "$350 / person + tax",
    meetingPoint: "Petersburg Downtown Municipal Harbors (Slip confirmed on booking)",
    cruisePickupIncluded: false,
    pickupDetails: "Walkable from downtown Petersburg harbors.",
    transferBufferMinutesEachWay: 8,
    recommendedMinPortHours: 8.5,
    weatherSensitivity: "Low",
    accessibilityNotes: "Heated cabin, booth seating, and onboard restroom.",
    weightOrAgeRestrictions: "4–13 passengers (or $3,200 private full-boat charter).",
    image: "/images/alaska/whale-watching.jpg",
    imageAlt: "Frederick Sound humpback whale watching from Petersburg",
    imageCredit: "Public domain · NPS",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://www.seekak.com/point-retreat",
    attributionCampaign: "seak-seek-alaska-whales",
    tourReviews: [],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },

  // ================= COMMERCIALLY HELD PRODUCT (Aleutian Ballad) =================
  {
    tourId: "tour:bering-sea-crab-fishermens-tour:aleutian-ballad",
    tourSlug: "aleutian-ballad",
    operatorId: "operator:bering-sea-crab-fishermens-tour",
    operatorSlug: "bering-sea-crab-fishermens-tour",
    operatorName: "Bering Sea Crab Fishermen's Tour (Aleutian Ballad)",
    primaryPlaceId: "place:community:ketchikan",
    portSlug: "ketchikan",
    categorySlug: "whale-and-wildlife-boat-tours",
    title: "Bering Sea Crab Fishermen's Tour (Aleutian Ballad) — Held",
    summary:
      "Commercially held Ketchikan excursion pending Ward Cove shuttle buffer confirmation and owner partner-portal attribution sign-off.",
    durationLabel: "3.0 hours (Held)",
    durationMinutes: 180,
    typicalDepartureTimes: [],
    fromPriceUsd: null,
    priceDisplayLabel: "Held pending verification",
    meetingPoint: "Ketchikan Waterfront (Held)",
    cruisePickupIncluded: false,
    pickupDetails: "Held pending Ward Cove shuttle verification.",
    transferBufferMinutesEachWay: 30,
    recommendedMinPortHours: 6,
    weatherSensitivity: "Low",
    accessibilityNotes: "Amphitheater deck seating.",
    weightOrAgeRestrictions: "Pending verification.",
    image: "/images/portfolio/ketchikan-fishing-vessel.webp",
    imageAlt: "Commercial crabbing vessel in Ketchikan",
    imageCredit: "Last Frontier Archive",
    bookingChannel: "held_pending_verification",
    officialProductUrl: "https://56degreesnorth.com/",
    attributionCampaign: "held-aleutian-ballad",
    isCommerciallyHeld: true,
    commercialHoldReason:
      "Held per HELD_COMMERCIAL_SKUS pending Ward Cove shuttle buffer math and owner GetYourGuide/Viator portal attribution verification.",
    tourReviews: [],
    verifiedAt: null,
    lastModifiedAt: "2026-11-17",
  },
] as const;

export const PORT_CATEGORY_COMPARISONS: readonly PortCategoryComparisonContent[] = [
  {
    portSlug: "juneau",
    categorySlug: "whale-watching",
    h1: "Juneau Whale Watching Operators & Tours Compared",
    title: "Juneau Whale Watching Directory | Compare 6-Guest Boats, Catamarans & Combos",
    metaDescription:
      "Compare verified Juneau whale watching operators side-by-side: Harv & Marv's (6–18 pax, all-4-dock pickup), Juneau Tours & Whale Watch, Gastineau Guiding, and Alaska Travel Adventures.",
    comparisonIntro:
      "Juneau whale watching departs Don D. Statter Harbor in Auke Bay (~12 miles / 25–30 minutes northwest of downtown cruise berths). Choosing the right operator comes down to three real operational differences: vessel group cap (6-passenger custom boats vs. 18–20 guest naturalist boats vs. 48-guest catamarans), whether your ship docks ~1 mile south at AJ Dock, and whether you want standalone water time (~3 hours on water) or a 5-to-6.25-hour Mendenhall Glacier / Gold Creek Salmon Bake combination.",
    keyDifferencesBullets: [
      "Smallest group sizes & AJ Dock ramp pickup: Harv & Marv's Outback Alaska picks up directly at the top of the ramp at all 4 Juneau docks (including AJ Dock) and offers 6-guest (Harv's Original) and 18-guest (Marv's Signature) departures with ~3 hours on the water.",
      "Streamlined Tramway plaza combos: Juneau Tours & Whale Watch stages directly beneath the Goldbelt Tramway cables (492 S. Franklin St) for 3.5-hour standalone cruises and 5-hour Mendenhall Glacier combos.",
      "Single-guide naturalist & citizen-science focus: Gastineau Guiding caps boats at 14–20 guests with hinged viewing windows and keeps you with the same naturalist guide dock-to-dock.",
      "Full-day salmon bake pairing: Alaska Travel Adventures pairs a 48-passenger Auke Bay jet boat with Mendenhall Glacier and the all-you-can-eat Gold Creek Salmon Bake (6.25h).",
    ],
    dockAndTimingGuidance:
      "Allow at least 6 to 6.5 hours in port for standalone whale watching (3.5–4h dock-to-dock + 2-hour all-aboard buffer) and 7.5 to 9 hours for Mendenhall or Salmon Bake combos. Ships at AJ Dock without direct ramp pickup must add 15 minutes each way for the port shuttle to 492 S. Franklin St.",
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    portSlug: "juneau",
    categorySlug: "helicopter-glacier-tours",
    h1: "Juneau Helicopter Glacier Operators & Flights Compared",
    title: "Juneau Helicopter & Icefield Tours | Coastal, NorthStar, TEMSCO & Wings Airways",
    metaDescription:
      "Compare Juneau's verified FAA Part 135 glacier flight operators: Coastal Helicopters (Herbert Glacier), NorthStar Trekking (1–2h crampon treks), TEMSCO (Mendenhall), and Wings Airways seaplanes.",
    comparisonIntro:
      "Four verified Juneau aviation operators fly cruise passengers onto or above the 1,500-square-mile Juneau Icefield, and each holds distinct USFS glacier landing zones, weight-surcharge thresholds, and minimum-age rules. Comparing those operational policies upfront prevents check-in surprises.",
    keyDifferencesBullets: [
      "Herbert Glacier walks & snow dog sledding (All Ages): Coastal Helicopters lands on Herbert Glacier (2h 35m walk or 3h 15m dog sledding) with tiered seat classes starting at 260+ lbs (no lap children).",
      "Extended technical crampon glacier treks (Ages 8+ / 12+): NorthStar Trekking outfits guests with mountaineering boots, crampons, and outerwear for 1-hour Walkabouts (8+) and 2-hour Glacier Treks (12+); 250+ lbs weight surcharge applies.",
      "Mendenhall Glacier landings (All Ages): TEMSCO Helicopters lands directly on Mendenhall Glacier (2h 15m) and Mendenhall snow dog camp (2h 45m) with a +$150 surcharge at 250+ lbs.",
      "Floatplane alternative from downtown waterfront: Wings Airways departs 2 Marine Way (5–10 min walk from downtown berths) in 10-seat DeHavilland Otters to historic 1923 Taku Glacier Lodge.",
    ],
    dockAndTimingGuidance:
      "All helicopter operators refund 100% when low ceilings or high winds ground flights. Schedule morning departures when possible so you still have afternoon backup time for Mendenhall Valley or whale watching if clouds close the icefield.",
    juneauFlightDeckNote:
      "Need live Juneau ceiling guidance or custom multi-seat flightseeing coordination? Visit our specialist aviation desk at https://juneauflightdeck.com for weather-ceiling education and flight-desk concierge handoffs.",
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    portSlug: "juneau",
    categorySlug: "mendenhall-glacier-tours",
    h1: "Mendenhall Glacier Shuttles, River Floats & Guided Walks Compared",
    title: "Mendenhall Glacier Tours from Juneau Cruise Port | Compare USFS-Permitted Options",
    metaDescription:
      "Compare USFS-permitted Mendenhall Glacier excursions from Juneau cruise docks: express visitor-center shuttles, 5-mile river floats, and naturalist whale-glacier combos.",
    comparisonIntro:
      "Because the U.S. Forest Service caps commercial visitor permits at Mendenhall Glacier Recreation Area (13 miles northwest of downtown Juneau) and public transit drops passengers 1.5 miles from the Visitor Center, booking a permitted operator ensures guaranteed return transit before all-aboard.",
    keyDifferencesBullets: [
      "Direct independent trail time: Juneau Tours & Whale Watch's 3-hour Mendenhall Express Shuttle includes USFS entry and ~2 hours for Nugget Falls and Photo Point.",
      "On-the-water river perspective: Alaska Travel Adventures' 3.5-hour Mendenhall Glacier Float Trip launches on Mendenhall Lake and rafts 5 miles down the Mendenhall River (min 50 lbs).",
      "Guided rainforest naturalist combos: Gastineau Guiding and Juneau Tours pair Mendenhall trails with Auke Bay humpback whale watching in a single 5-hour dock-to-dock window.",
    ],
    dockAndTimingGuidance:
      "Standalone shuttles and river floats fit 5.5-to-6-hour Juneau calls comfortably with a 2-hour all-aboard buffer; whale-and-glacier combos require at least a 7.5-hour port window.",
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    portSlug: "hoonah",
    categorySlug: "whale-watching",
    h1: "Hoonah Independent Whale Watching Captains & Small Boats Compared",
    title: "Hoonah Whale Watching Directory | Whales of Xunaa, Glacier Wind & Icy Strait Whale Adventures",
    metaDescription:
      "Compare independent locally owned Hoonah whale watching operators departing Hoonah Boat Harbor to Point Adolphus—all with courtesy pickup at Icy Strait Point's Excursion Hub.",
    comparisonIntro:
      "While cruise ships berth ~1.5 miles northeast at Icy Strait Point, neighboring Hoonah's municipal boat harbor (George Hall Harbor) is home to independent family-owned captains heading straight to Point Adolphus—Alaska's most concentrated summer humpback feeding ground. All three verified Hoonah operators pick up cruise passengers at Icy Strait Point's outdoor Excursion Hub (5-minute van transfer).",
    keyDifferencesBullets: [
      "Ultra-intimate 6-passenger Safeboat: Whales of Xunaa (Capt. Paul, 272 Marine Way) carries at most 6 guests total (including infants) aboard the heated 27-ft Safeboat Orca.",
      "Uncrowded 13-passenger walk-around catamarans: Glacier Wind Charters (McConnell family since 1995, 304 Harbor Dr) runs 3-hour hydrophone tours aboard Apogee and Glacier Wind (Ages 9+ on shared trips, or private 13-seat buyout).",
      "All-ages 22-guest custom boats & 6-guest private charters: Icy Strait Whale Adventures runs 2.5-hour Point Adolphus trips welcoming all ages and stowing foldable wheelchairs on the aft deck.",
    ],
    dockAndTimingGuidance:
      "From Ocean Landing, walk through Adventure Center Door #2 (~8–10 mins) to the Excursion Hub; from Wilderness Landing, ride the free 5-minute green Transporter Gondola first, then walk ~5 minutes to the Excursion Hub. Afterward, ask your driver to drop you in downtown Hoonah if you have 45+ spare minutes before your 2-hour buffer to stroll the flat 1.5-mile shoreline Sea Walk back to the ship.",
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    portSlug: "ketchikan",
    categorySlug: "misty-fjords-tours",
    h1: "Ketchikan Misty Fjords Floatplanes vs. Catamarans Compared",
    title: "Misty Fjords Tours from Ketchikan | Taquan Air Floatplanes vs. Allen Marine Catamarans",
    metaDescription:
      "Compare Misty Fjords National Monument excursions by air and sea from Ketchikan—including critical Downtown Berth 2 vs. Ward Cove shuttle rules.",
    comparisonIntro:
      "Misty Fjords National Monument's 3,000-foot sheer granite cliffs lie east of Ketchikan across Behm Canal and can be experienced either from the air with a remote fjord pontoon landing or from water level aboard a heated high-speed catamaran.",
    keyDifferencesBullets: [
      "Fastest port-window footprint & aerial lake landing: Taquan Air's 1.75-hour floatplane tour (60m flight) fits shorter 5-hour Ketchikan calls, subject to mountain visibility and FAA 250+ lb weight-balance rules.",
      "Rain-proof water-level alternative: Allen Marine's 4.5-hour heated high-speed catamaran cruises into Rudyerd Bay with ADA-accessible indoor salons even when low clouds ground floatplanes.",
      "Critical Ward Cove pickup distinction: Taquan Air's direct shuttle meets ONLY downtown at the Berth 2 Rain Gauge—so ships berthed ~5.5–7 miles north at Ward Cove must ride the free 20-minute shuttle to Berth 4 early.",
    ],
    dockAndTimingGuidance:
      "If your ship docks at Ward Cove on a short 6-hour Ketchikan call (e.g., 7:00 AM–1:15 PM), favor 1.75-hour floatplanes over 4.5-hour boat cruises so round-trip Ward Cove shuttle transfers still preserve your 2-hour all-aboard buffer.",
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    portSlug: "skagway",
    categorySlug: "dog-sledding-and-glacier-tours",
    h1: "Skagway Sled Dog Camps, Helicopter Landings & Glacier Safaris Compared",
    title: "Skagway Dog Sledding & Glacier Tours | Compare TEMSCO Helicopters & Alaska X",
    metaDescription:
      "Compare Skagway's glacier and sled-dog excursions: TEMSCO waterfront helicopter landings on Denver/Meade Glaciers vs. Alaska X Dyea Musher's Camp & Davidson Glacier canoe safaris.",
    comparisonIntro:
      "Skagway travelers choosing between snow glaciers and husky camps have two verified local operators offering three completely different formats: waterfront helicopter landings onto high-alpine ice, rain-proof wheeled husky sled rides in Dyea's rainforest, and boat-plus-canoe expeditions to Davidson Glacier.",
    keyDifferencesBullets: [
      "Real alpine glacier ice & snow camp in 2 hours: TEMSCO Helicopters lifts off from 101 Terminal Way for 40-minute guided glacier walks ($479) and Denver Glacier husky camp visits ($649; demonstration format rather than sled riding).",
      "Wheeled husky sled ride in Dyea rainforest: Alaska X's 3h 15m Musher's Camp climbs by 4x4 Unimog for a 1-mile wheeled sled ride pulled by 16 Huskies plus puppy time—operating rain or shine.",
      "Water-level glacier approach: Alaska X's 6-hour Glacier Point Wilderness Safari cruises Lynn Canal and paddles 31-foot voyager canoes up to Davidson Glacier.",
    ],
    dockAndTimingGuidance:
      "Ships berthed at Railroad Forward (tender) or Railroad Aft (shuttle) should budget 25–30 minutes to clear the pier rockslide zone before walking or taking the $3 SMART bus to TEMSCO's 101 Terminal Way heliport.",
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
  {
    portSlug: "sitka",
    categorySlug: "whale-and-wildlife-boat-tours",
    h1: "Sitka Sound Small-Boat vs. Catamaran Wildlife Tours Compared",
    title: "Sitka Whale & Sea Otter Boat Tours | Gallant Adventures (6-Pax) vs. Allen Marine",
    metaDescription:
      "Compare Sitka Sound marine wildlife excursions: Capt. Paul Davis's 6-passenger M/V Double G from Crescent Harbor vs. Allen Marine's ADA catamaran from Sitka Sound Terminal.",
    comparisonIntro:
      "Sitka Sound's island-sheltered kelp forests and outer Pacific swells support one of Alaska's richest concentrations of sea otters, humpback whales, and nesting puffins—with a clear choice between an intimate 6-guest owner-captained cruiser downtown and a spacious expedition catamaran boarding right at the cruise terminal.",
    keyDifferencesBullets: [
      "Owner-captained 6-passenger custom routing: Gallant Adventures (Capt. Paul Davis) departs Crescent Harbor downtown (330 Harbor Dr) for 3-hour Sitka Sound ($169) and 5-hour St. Lazaria puffin-cliff ($255) runs.",
      "Direct terminal boarding & ADA cabin comfort: Allen Marine Tours boards right at Sitka Sound Cruise Terminal (Halibut Point) with ramp access, heated observation decks, and zero shuttle required.",
      "Outer-island St. Lazaria seabird cliffs vs. sheltered kelp-forest routing: Gallant's 5-hour run pushes out to volcanic St. Lazaria National Wildlife Refuge for tufted puffins on longer ship calls, whereas 3-hour inner Sitka Sound trips stay in calmer island-protected channels.",
    ],
    dockAndTimingGuidance:
      "If docked at Sitka Sound Cruise Terminal and booked with Gallant Adventures at Crescent Harbor (330 Harbor Dr), reserve an early free shuttle slot at sitkadock.com (~10–15 minute ride) so you arrive downtown comfortably ahead of check-in.",
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  },
] as const;

export function assertMandatorySoutheastAlaskaInvariants(): void {
  const hoonah = SOUTHEAST_ALASKA_PLACES.find((p) => p.publicPortSlug === "hoonah");
  const isp = SOUTHEAST_ALASKA_PLACES.find(
    (p) => p.publicPortSlug === "icy-strait-point",
  );
  if (!hoonah || !isp || hoonah.placeId === isp.placeId) {
    throw new Error("Invariant violation: Hoonah and Icy Strait Point must be distinct canonical entities.");
  }
  if (hoonah.placeType !== "community" || isp.placeType !== "cruise_terminal") {
    throw new Error("Invariant violation: Hoonah must be modeled as community and Icy Strait Point as cruise_terminal.");
  }

  const gustavus = SOUTHEAST_ALASKA_PLACES.find((p) => p.publicPortSlug === "gustavus");
  const glacierBay = SOUTHEAST_ALASKA_PLACES.find(
    (p) => p.publicPortSlug === "glacier-bay",
  );
  if (!gustavus || !glacierBay || gustavus.placeId === glacierBay.placeId) {
    throw new Error("Invariant violation: Gustavus and Glacier Bay must be distinct canonical entities.");
  }
  if (
    glacierBay.placeType !== "scenic_cruise_destination" ||
    glacierBay.largeCruiseShipDisembarkationAllowed !== false
  ) {
    throw new Error("Invariant violation: Glacier Bay must be scenic_cruise_destination with largeCruiseShipDisembarkationAllowed=false.");
  }

  const ata = SOUTHEAST_ALASKA_OPERATORS.find(
    (o) => o.operatorId === "operator:alaska-travel-adventures",
  );
  const gastineau = SOUTHEAST_ALASKA_OPERATORS.find(
    (o) => o.operatorId === "operator:gastineau-guiding",
  );
  if (!ata || !gastineau || ata.slug === gastineau.slug) {
    throw new Error("Invariant violation: Alaska Travel Adventures and Gastineau Guiding must remain strictly separate canonical entities.");
  }

  const gallant = SOUTHEAST_ALASKA_OPERATORS.find(
    (o) => o.operatorId === "operator:gallant-adventures",
  );
  if (!gallant || gallant.publicPortSlugs.join(",") !== "sitka") {
    throw new Error("Invariant violation: Gallant Adventures must be associated strictly with Sitka unless another port is primary-source verified.");
  }

  const seek = SOUTHEAST_ALASKA_OPERATORS.find(
    (o) => o.operatorId === "operator:seek-alaska",
  );
  if (!seek || !seek.publicPortSlugs.includes("petersburg")) {
    throw new Error("Invariant violation: Seek Alaska must be associated with Petersburg.");
  }
}

assertMandatorySoutheastAlaskaInvariants();

export interface PortCategoryEvaluatedBundle {
  portSlug: string;
  portName: string;
  category: SoutheastAlaskaCategoryDefinition;
  comparison: PortCategoryComparisonContent | null;
  qualifiedOperators: SoutheastAlaskaOperatorRecord[];
  qualifiedTours: SoutheastAlaskaTourProductRecord[];
  gate: EntityPublicationGateEvaluation;
}

export interface SoutheastAlaskaHeldRecordEntry {
  queueType: "HeldPlaceQueue" | "OperatorResearchQueue" | "HeldPortCategoryQueue" | "HeldTourSkuQueue";
  entityId: string;
  name: string;
  publicPath: string | null;
  robotsDirective: "noindex, follow";
  holdReasonCodes: readonly string[];
  holdDetails: readonly string[];
}

export interface SoutheastAlaskaDirectorySnapshot {
  schemaVersion: "dcc.se-alaska.directory.v1";
  generatedAt: string;
  region: {
    regionId: "region:southeast-alaska";
    name: "Southeast Alaska";
    canonicalPublicHubUrl: "https://www.lastfrontiershoreexcursions.com/southeast-alaska";
    juneauFlightDeckBoundaryNote: string;
    unclaimedProfileDisclosure: typeof UNCLAIMED_OPERATOR_PROFILE_NOTICE;
  };
  counts: {
    totalPlacesModeled: number;
    indexablePublicPlacePages: number;
    heldPlacePages: number;
    totalOperatorsModeled: number;
    indexableOperatorProfiles: number;
    heldOperatorsInResearchQueue: number;
    liveAvailabilityConnectedOperators: number;
    directCheckoutConnectedOperators: number;
    totalToursModeled: number;
    verifiedActiveTours: number;
    commerciallyHeldTours: number;
    evaluatedPortCategoryIntersections: number;
    indexablePortCategoryPages: number;
    heldPortCategoryIntersections: number;
  };
  places: Array<{
    place: SoutheastAlaskaPlaceRecord;
    gate: EntityPublicationGateEvaluation;
  }>;
  categories: readonly SoutheastAlaskaCategoryDefinition[];
  operators: Array<{
    operator: SoutheastAlaskaOperatorRecord;
    tours: SoutheastAlaskaTourProductRecord[];
    gate: EntityPublicationGateEvaluation;
  }>;
  tours: readonly SoutheastAlaskaTourProductRecord[];
  portCategories: PortCategoryEvaluatedBundle[];
  heldRecordsLedger: SoutheastAlaskaHeldRecordEntry[];
}

export function getSoutheastAlaskaDirectorySnapshot(): SoutheastAlaskaDirectorySnapshot {
  assertMandatorySoutheastAlaskaInvariants();

  const evaluatedPlaces = SOUTHEAST_ALASKA_PLACES.map((place) => ({
    place,
    gate: evaluatePlacePublicationGate(place),
  }));

  const evaluatedOperators = SOUTHEAST_ALASKA_OPERATORS.map((operator) => {
    const tours = SOUTHEAST_ALASKA_TOURS.filter(
      (t) => t.operatorId === operator.operatorId,
    );
    return {
      operator,
      tours,
      gate: evaluateOperatorPublicationGate(operator, tours),
    };
  });

  const indexableOperatorIds = new Set(
    evaluatedOperators.filter((o) => o.gate.indexable).map((o) => o.operator.operatorId),
  );

  // Evaluate every port x category where either a tour exists OR comparison content exists
  const publicPlaces = evaluatedPlaces.filter((p) => p.place.hasPublicDirectoryPage && p.place.publicPortSlug);
  const portCategories: PortCategoryEvaluatedBundle[] = [];

  for (const { place } of publicPlaces) {
    const portSlug = place.publicPortSlug!;
    for (const category of SOUTHEAST_ALASKA_CATEGORIES) {
      const matchingTours = SOUTHEAST_ALASKA_TOURS.filter(
        (t) =>
          t.portSlug === portSlug &&
          (t.categorySlug === category.categorySlug ||
            t.secondaryCategorySlugs?.includes(category.categorySlug)) &&
          !t.isCommerciallyHeld &&
          indexableOperatorIds.has(t.operatorId),
      );
      const comparison =
        PORT_CATEGORY_COMPARISONS.find(
          (c) => c.portSlug === portSlug && c.categorySlug === category.categorySlug,
        ) || null;

      if (matchingTours.length === 0 && !comparison) {
        continue;
      }

      const qualifiedOperatorIds = Array.from(
        new Set(matchingTours.map((t) => t.operatorId)),
      );
      const qualifiedOperators = evaluatedOperators
        .filter((o) => qualifiedOperatorIds.includes(o.operator.operatorId))
        .map((o) => o.operator);

      const gate = evaluatePortCategoryPublicationGate({
        portSlug,
        categorySlug: category.categorySlug,
        comparison,
        qualifiedOperatorIdsForPortCategory: qualifiedOperatorIds,
        qualifiedProductsForPortCategory: matchingTours,
      });

      portCategories.push({
        portSlug,
        portName: place.name,
        category,
        comparison,
        qualifiedOperators,
        qualifiedTours: matchingTours,
        gate,
      });
    }
  }

  const heldRecordsLedger: SoutheastAlaskaHeldRecordEntry[] = [];

  for (const { place, gate } of evaluatedPlaces) {
    if (place.hasPublicDirectoryPage && !gate.indexable) {
      heldRecordsLedger.push({
        queueType: "HeldPlaceQueue",
        entityId: place.placeId,
        name: place.name,
        publicPath: gate.publicPath,
        robotsDirective: "noindex, follow",
        holdReasonCodes: gate.holdReasonCodes,
        holdDetails: gate.holdDetails,
      });
    }
  }

  for (const { operator, gate } of evaluatedOperators) {
    if (!gate.indexable) {
      heldRecordsLedger.push({
        queueType: "OperatorResearchQueue",
        entityId: operator.operatorId,
        name: operator.name,
        publicPath: gate.publicPath,
        robotsDirective: "noindex, follow",
        holdReasonCodes: gate.holdReasonCodes,
        holdDetails: gate.holdDetails,
      });
    }
  }

  for (const pc of portCategories) {
    if (!pc.gate.indexable) {
      heldRecordsLedger.push({
        queueType: "HeldPortCategoryQueue",
        entityId: pc.gate.entityId,
        name: `${pc.portName} — ${pc.category.shortLabel}`,
        publicPath: pc.gate.publicPath,
        robotsDirective: "noindex, follow",
        holdReasonCodes: pc.gate.holdReasonCodes,
        holdDetails: pc.gate.holdDetails,
      });
    }
  }

  for (const tour of SOUTHEAST_ALASKA_TOURS) {
    if (tour.isCommerciallyHeld) {
      heldRecordsLedger.push({
        queueType: "HeldTourSkuQueue",
        entityId: tour.tourId,
        name: tour.title,
        publicPath: `/tours/${tour.operatorSlug}/${tour.tourSlug}`,
        robotsDirective: "noindex, follow",
        holdReasonCodes: ["EXPLICIT_RESEARCH_QUEUE_HOLD"],
        holdDetails: [tour.commercialHoldReason || "Commercially held pending owner sign-off."],
      });
    }
  }

  const verifiedActiveTours = SOUTHEAST_ALASKA_TOURS.filter(
    (t) => Boolean(t.verifiedAt) && !t.isCommerciallyHeld,
  );
  const commerciallyHeldTours = SOUTHEAST_ALASKA_TOURS.filter(
    (t) => Boolean(t.isCommerciallyHeld),
  );

  return {
    schemaVersion: "dcc.se-alaska.directory.v1",
    generatedAt: "2026-11-17T11:00:00Z",
    region: {
      regionId: "region:southeast-alaska",
      name: "Southeast Alaska",
      canonicalPublicHubUrl:
        "https://www.lastfrontiershoreexcursions.com/southeast-alaska",
      juneauFlightDeckBoundaryNote:
        "Last Frontier Shore Excursions owns canonical Southeast Alaska operator profiles (/operators/[operatorSlug]); Juneau Flight Deck (juneauflightdeck.com) owns Juneau flight-ceiling weather guidance, flightseeing education, and concierge handoffs, linking contextually to Last Frontier operator pages.",
      unclaimedProfileDisclosure: UNCLAIMED_OPERATOR_PROFILE_NOTICE,
    },
    counts: {
      totalPlacesModeled: evaluatedPlaces.length,
      indexablePublicPlacePages: evaluatedPlaces.filter((p) => p.gate.indexable).length,
      heldPlacePages: evaluatedPlaces.filter(
        (p) => p.place.hasPublicDirectoryPage && !p.gate.indexable,
      ).length,
      totalOperatorsModeled: evaluatedOperators.length,
      indexableOperatorProfiles: evaluatedOperators.filter((o) => o.gate.indexable)
        .length,
      heldOperatorsInResearchQueue: evaluatedOperators.filter((o) => !o.gate.indexable)
        .length,
      liveAvailabilityConnectedOperators: 0,
      directCheckoutConnectedOperators: 0,
      totalToursModeled: SOUTHEAST_ALASKA_TOURS.length,
      verifiedActiveTours: verifiedActiveTours.length,
      commerciallyHeldTours: commerciallyHeldTours.length,
      evaluatedPortCategoryIntersections: portCategories.length,
      indexablePortCategoryPages: portCategories.filter((c) => c.gate.indexable)
        .length,
      heldPortCategoryIntersections: portCategories.filter((c) => !c.gate.indexable)
        .length,
    },
    places: evaluatedPlaces,
    categories: SOUTHEAST_ALASKA_CATEGORIES,
    operators: evaluatedOperators,
    tours: SOUTHEAST_ALASKA_TOURS,
    portCategories,
    heldRecordsLedger,
  };
}

export function findSoutheastAlaskaPlaceByPortSlug(portSlug: string) {
  const normalized = portSlug.trim().toLowerCase();
  const snap = getSoutheastAlaskaDirectorySnapshot();
  return (
    snap.places.find(
      (entry) => entry.place.publicPortSlug === normalized,
    ) || null
  );
}

export function findSoutheastAlaskaOperatorBySlugOrAlias(slugOrAlias: string) {
  const normalized = slugOrAlias.trim().toLowerCase();
  const snap = getSoutheastAlaskaDirectorySnapshot();
  return (
    snap.operators.find(
      (entry) =>
        entry.operator.slug === normalized ||
        entry.operator.legacyCompanyAliases?.some(
          (a) => a.toLowerCase() === normalized,
        ),
    ) || null
  );
}

export function findSoutheastAlaskaTourByOperatorAndSlug(
  operatorOrCompany: string,
  tourSlugOrItem: string,
) {
  const opNorm = operatorOrCompany.trim().toLowerCase();
  const itemNorm = tourSlugOrItem.trim().toLowerCase();
  return (
    SOUTHEAST_ALASKA_TOURS.find(
      (t) =>
        (t.operatorSlug === opNorm && t.tourSlug === itemNorm) ||
        t.legacyRouteAliases?.some(
          (alias) =>
            alias.company.toLowerCase() === opNorm &&
            alias.item.toLowerCase() === itemNorm,
        ),
    ) || null
  );
}

export function findEvaluatedPortCategory(portSlug: string, categorySlug: string) {
  const p = portSlug.trim().toLowerCase();
  const c = categorySlug.trim().toLowerCase();
  const snap = getSoutheastAlaskaDirectorySnapshot();
  return (
    snap.portCategories.find(
      (entry) => entry.portSlug === p && entry.category.categorySlug === c,
    ) || null
  );
}
