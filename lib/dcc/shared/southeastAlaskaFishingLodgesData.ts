/**
 * Canonical Southeast Alaska Fishing Lodges, Basecamps & Private Stays Dataset
 * (`lib/dcc/shared/southeastAlaskaFishingLodgesData.ts`).
 *
 * Reconciled Phase 1 Preview Collection: 16 properties total
 *   - 15 individual-room / cabin / DIY boat-and-lodging stays
 *   - 1 whole-lodge private-property stay (Boardwalk Lodge — services arranged separately)
 *
 * Primary-source subpages retrieved on 2026-11-19.
 * Held/gated/unretrieved candidates live strictly in `lib/dcc/alaska/fishingLodgesResearchQueue.ts`
 * and are never exposed in public API snapshots or traveler-facing listings.
 */

import { DIRECTORY_CORE_CONTRACT_VERSION } from "./regionalDirectoryCoreContract";
import {
  ALASKA_FISHING_LODGES_CONTRACT_VERSION,
  SOUTHEAST_ALASKA_LODGE_SUBREGION_LABELS,
  UNCLAIMED_LODGE_FACT_SHEET_NOTICE,
  createOfficialCitation,
  evaluateSoutheastAlaskaLodgePublicationGate,
  type LodgePublicationGateEvaluation,
  type SoutheastAlaskaFishingLodgeRecord,
} from "./southeastAlaskaFishingLodgesContract";

const RETRIEVED_DATE = "2026-11-19" as const;

const JUNEAU_GATEWAY_ECOSYSTEM_LINKS = [
  {
    label: "Weekend in Juneau: Where to Stay, Activities & Evenings",
    href: "/guides/weekend-in-juneau",
    surface: "lfse" as const,
    relationshipNote:
      "Plan pre- or post-lodge overnight buffer nights in Downtown Juneau or the Mendenhall Valley near JNU Airport.",
  },
  {
    label: "Juneau Port, Harbors & Local Operators",
    href: "/ports/juneau",
    surface: "lfse" as const,
    relationshipNote:
      "Review Statter Harbor (Auke Bay), Gastineau Channel docks, and verified Juneau marine & glacier operators.",
  },
  {
    label: "Juneau Flight Weather, VFR Ceilings & Backup Planning",
    href: "https://juneauflightdeck.com/juneau-glacier-flight-weather",
    surface: "jfd" as const,
    relationshipNote:
      "Understand Southeast Alaska cloud-ceiling weather holds before scheduling tight floatplane or helicopter connections.",
  },
  {
    label: "UnCruise Pre/Post-Cruise Juneau Helicopter Guide",
    href: "https://juneauflightdeck.com/guides/uncruise-juneau-helicopter-tours",
    surface: "jfd" as const,
    relationshipNote:
      "Coordinate Juneau Icefield helicopter treks around small-ship or lodge turnaround days.",
  },
  {
    label: "Cruise Alaska Without a Cruise Ship (Ferry + Commuter Air Guide)",
    href: "https://cruisepromenade.com/guides/cruise-alaska-without-a-cruise-ship",
    surface: "cp" as const,
    relationshipNote:
      "Connect a Juneau-area lodge stay with independent Lynn Canal ferry and commuter-plane town stops.",
  },
] as const;

export const SOUTHEAST_ALASKA_FISHING_LODGES_CANDIDATES: readonly SoutheastAlaskaFishingLodgeRecord[] = [
  // =========================================================================
  // 1. PYBUS POINT LODGE (Pybus Bay, Admiralty Island — Gateway: Juneau)
  // =========================================================================
  {
    lodgeId: "lodge:pybus-point-lodge",
    slug: "pybus-point-lodge",
    displayName: "Pybus Point Lodge",
    subRegion: "juneau_admiralty_stephens_passage",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "Remote southern Admiralty Island resort reached by included charter floatplane from Juneau, pairing guided saltwater/freshwater fishing with custom wildlife and glacier excursions.",
    accommodation: {
      accommodationId: "accommodation:pybus-point-lodge",
      propertyName: "Pybus Point Lodge",
      propertyKind: "remote_wilderness_lodge",
      actualLocationLabel: "Pybus Bay, Southern Admiralty Island National Monument",
      streetOrPostalAddress: null,
      gatewayPlaceId: "place:community:juneau",
      gatewayPublicPortSlug: "juneau",
      gatewayLabel: "Juneau (JNU)",
      communityPlaceId: null,
      coordinates: {
        latitude: 57.3089,
        longitude: -134.1434,
        precisionBasis: "published_on_official_site",
        coordinateNote: "Published on official /all-inclusive page (N 57.3089°, W 134.1434°).",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Pybus Point Lodge operates the physical Admiralty Island resort, fleet, dining room, and direct package sales.",
      roomAndCabinSummary:
        "Renovated standard studio-style rooms (4 individual beds, 1 bath) and deluxe private rooms (king, two twins, or two doubles, private bath, thermostat fireplace; private balcony options), plus whole-building rentals for larger groups.",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "no",
      mealProvisionSummary:
        "Full-service chef-prepared meals, fresh catch preparation, unlimited snacks, and sodas included.",
      maxConcurrentGuests: null,
      groupSizeGuidanceNote:
        "Accommodates couples, families (studio rooms fit 2 adults + up to 2 children), fishing groups of 3–4 per room, and corporate groups; total resort guest cap not stated on retrieved pages.",
      childrenAndYouthNote:
        "Family stays explicitly welcomed on /lodging; child rate discounts not disclosed on retrieved pages.",
      documentedAccessibilityNote:
        "Not disclosed on retrieved official pages — confirm floatplane dock ramp, cabin steps, and boat boarding directly with lodge.",
    },
    operatingCompany: {
      operatorId: "operator:pybus-point-lodge",
      legalOrDisplayName: "Pybus Point Lodge",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://www.pybus.com/",
      officialEmailDomain: "pybus.com",
      officialPhone: "(435) 412-4286",
      ownershipOrHistorySummary:
        "Operates at the southern edge of Admiralty Island National Monument; corporate ownership structure not detailed on retrieved pages.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Pybus Point Lodge Reservations",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://www.pybus.com/all-inclusive",
      primaryCtaLabel: "Check availability",
      bookingMechanismSummary:
        "Direct online inquiry / availability check and phone/text reservations via (435) 412-4286.",
    },
    partnerServices: [
      {
        serviceRole: "charter_or_commuter_air_carrier",
        providerName: "Chartered Floatplane Carrier (Arranged by Pybus Point Lodge)",
        arrangementType: "arranged_by_lodge_included",
        details:
          "Round-trip charter floatplane between Juneau and Pybus Bay is arranged and included in the all-inclusive package.",
        officialUrl: "https://www.pybus.com/rates",
      },
    ],
    packages: [
      {
        packageId: "pkg:pybus-point-lodge:4-full-days-all-inclusive",
        lodgeSlug: "pybus-point-lodge",
        packageName: "4 Full Days All-Inclusive Package",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel: "Summer season (peak fishing noted July–August; confirm exact 2027 dates)",
        nights: null,
        fishingDays: 4,
        durationSummaryLabel: "4 full days (exact night count & arrival schedule confirmed at booking)",
        occupancyAndSharingBasis:
          "Displayed as '$8,800 per person**' on /all-inclusive; exact occupancy tier and footnote terms must be confirmed on quote.",
        priceState: "published_undated_current_rate",
        priceAmountUsd: 8800,
        priceDisplayLabel: "$8,800 / person**",
        taxTreatment: "unknown",
        taxDetailNote:
          "Retrieved /all-inclusive and /rates pages show '$8,800 per person**' without expanding tax/fee footnote inline; confirm tax and occupancy terms before booking.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Live date openings are not verified here — check directly with Pybus Point Lodge.",
        verifiedInclusions: [
          "Charter floatplane between Juneau and Pybus Point Lodge",
          "Renovated rooms with private bathrooms and daily maid service",
          "USCG-certified guide (8 hours/day) on custom 33'–42' fishing vessels",
          "Motorized 18'–22' skiffs, kayaks, and paddleboards for guest use",
          "High-quality saltwater/freshwater tackle, Grundens rain gear, and deck boots",
          "Guided whale watching, wildlife tours (brown bear, eagles, seals), and glacier tours",
          "Made-to-order gourmet meals, snacks, and sodas",
          "Fish filleting, vacuum-sealing, flash-freezing, and fish transportation back to Juneau",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Commercial flights & Juneau pre/post hotel nights",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Package begins with the charter floatplane in Juneau ('Meet us in Juneau').",
            sourceUrl: "https://www.pybus.com/all-inclusive",
          },
          {
            itemLabel: "Alaska fishing license, stamps, taxes & crew gratuities",
            chargeStatus: "unknown_confirm_with_seller",
            publishedAmountNote: null,
            scopeAndRuleNote: "Confirm ADF&G license/stamp handling, footnote '**' conditions, alcohol policy, and gratuities directly.",
            sourceUrl: "https://www.pybus.com/rates",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://www.pybus.com/all-inclusive",
        sourceUrl: "https://www.pybus.com/all-inclusive",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater", "freshwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary:
        "Custom-built 33'–42' guided fishing boats (8 hrs/day USCG captain), twin-hull touring vessel, plus motorized 18'–22' guest skiffs; rods, reels, jigs, fly gear, Grundens rainwear, and boots provided.",
      targetSpeciesSummary: "Pacific halibut, salmon species, freshwater stream species.",
      seasonalRunNote: "Official lodging page notes peak fishing dates in July and August.",
      fishProcessingAndBoxesSummary:
        "Filleting, vacuum-sealing, flash-freezing, and fish transportation back to Juneau are explicitly included.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Sportfishing License & Applicable Stamps",
          applicableActivityAndDateScope: "All saltwater & freshwater anglers",
          provisionStatus: "unknown",
          detail: "Inclusion vs. separate purchase not stated on retrieved summary pages — confirm with lodge.",
          sourceUrl: null,
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:pybus-point-lodge:1",
        gatewayAirportIata: "JNU",
        gatewayPlaceId: "place:community:juneau",
        gatewayPortSlug: "juneau",
        legTitle: "Juneau (JNU) ↔ Pybus Bay Charter Floatplane",
        transferMode: "charter_or_scheduled_floatplane",
        carrierOrDockName: "Lodge-arranged charter floatplane from Juneau",
        durationLabel: "Not stated on retrieved text (scenic seaplane transfer)",
        provisionStatus: "included_in_published_package",
        transportOperationState: "lodge_operated_or_chartered_transfer",
        publishedTransferRateNote: "Included in all-inclusive package (including fish transport back to Juneau).",
        scopedBaggageAndFreightRule: {
          disclosed: false,
          ruleSummary: "Exact per-passenger floatplane baggage pound limit not disclosed on retrieved pages — confirm before packing.",
          applicableServiceScope: "Charter floatplane leg between Juneau and Pybus Bay",
          sourceUrl: null,
        },
        reportingAndOvernightBufferNote:
          "Confirm Juneau arrival cutoff and whether an overnight hotel buffer in Juneau prior to floatplane departure is required.",
        sourceUrl: "https://www.pybus.com/rates",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "documented_on_official_site",
        summary: "Kayaks, paddleboards, and motorized 18'–22' skiffs provided for guest use.",
      },
      guidedNonFishingExcursions: {
        status: "custom_boat_wildlife_or_glacier_options",
        summary:
          "Includes guided whale watching, wildlife tours (brown bears, eagles, seals, sea lions, orcas), secluded waterfalls, and guided Sawyer / Tracy Arm glacier day trips.",
      },
      simultaneousNonAnglerActivitiesProven: "yes",
      simultaneousNonAnglerExplanation:
        "Official /all-inclusive and /rates pages explicitly bundle guided whale, wildlife, and glacier excursions alongside fishing; confirm whether mixed groups split across separate boats or customize one shared group boat.",
      contextualEcosystemLinks: JUNEAU_GATEWAY_ECOSYSTEM_LINKS,
    },
    visualRepresentation: {
      imagePath: "/images/alaska/inside-passage-hero.jpg",
      imageAlt: "Forested Inside Passage fjord waters and snow-dusted peaks in Southeast Alaska",
      imageCredit: "CC BY-SA 4.0 · DJ Cane",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "PYBUS-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19 (season year not stated inline)",
        claimSummary:
          "Lists '4 full days · Everything included · $8,800 per person**' and coordinates N 57.3089°, W 134.1434° on southern Admiralty Island.",
        source: createOfficialCitation("Pybus Point Lodge — All-Inclusive Vacation", "https://www.pybus.com/all-inclusive"),
        unresolvedOrConflictNote: "Footnote '**' terms, exact night count, and tax treatment require confirmation during booking.",
      },
      {
        claimId: "PYBUS-02",
        scope: "access_and_baggage",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms charter floatplane from Juneau, 33'–42' fishing boats, 8 hr/day USCG guide, 18'–22' skiffs, kayaks/paddleboards, guided whale/wildlife/glacier tours, and fish transport to Juneau.",
        source: createOfficialCitation("Pybus Point Lodge — Rates & Inclusions", "https://www.pybus.com/rates"),
      },
      {
        claimId: "PYBUS-03",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents renovated standard studio rooms (4 beds, 1 bath), deluxe rooms (private bath, fireplace, optional balcony), and whole-building group rentals.",
        source: createOfficialCitation("Pybus Point Lodge — Luxury Lodging", "https://www.pybus.com/lodging"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Confirm 2027 rate sheet, night count on the 4-full-day package, and details of the '**' pricing footnote.",
      "Confirm floatplane personal baggage weight limit and whether mixed anglers/non-anglers split onto separate daily boats.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 2. FAVORITE BAY LODGE (Kootznoowoo Inlet / Angoon — Gateway: Juneau)
  // =========================================================================
  {
    lodgeId: "lodge:favorite-bay-lodge",
    slug: "favorite-bay-lodge",
    displayName: "Favorite Bay Lodge",
    subRegion: "juneau_admiralty_stephens_passage",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "Intimate 10-room, 20-guest wilderness lodge on Admiralty Island's Kootznoowoo Inlet with published 2026 all-inclusive rates including roundtrip Juneau floatplane and 100 lbs fish freight.",
    accommodation: {
      accommodationId: "accommodation:favorite-bay-lodge",
      propertyName: "Favorite Bay Lodge",
      propertyKind: "remote_wilderness_lodge",
      actualLocationLabel: "Favorite Bay / Kootznoowoo Inlet, Admiralty Island (Angoon, AK)",
      streetOrPostalAddress: "PO Box 149, Angoon, AK 99820",
      gatewayPlaceId: "place:community:juneau",
      gatewayPublicPortSlug: "juneau",
      gatewayLabel: "Juneau (JNU)",
      communityPlaceId: null,
      coordinates: {
        latitude: 57.4889,
        longitude: -134.5622,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Approximate Favorite Bay / Angoon inlet anchor; exact dock coordinates not published on retrieved text.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Favorite Bay Lodge operates the 10-room Admiralty Island lodge, guided fleet, and direct reservations under a USFS Tongass National Forest Special Use Permit.",
      roomAndCabinSummary:
        "10 guest rooms limited to 20 total guests; each room features native cedar/mahogany finishes, two double beds, and a private en-suite bathroom with soaking tub.",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "no",
      mealProvisionSummary:
        "Full breakfast, shore or lodge lunch, appetizers, 4-course gourmet dinner, snacks, soft drinks, juices, and mixers included (3% discount for check/cash payment).",
      maxConcurrentGuests: 20,
      groupSizeGuidanceNote: "Capped at 20 guests across 10 rooms; custom group rates offered for 10+ guests.",
      childrenAndYouthNote: "Family travel welcomed on /lodge; youth discount tiers not disclosed on retrieved pages.",
      documentedAccessibilityNote:
        "Loft-level rooms noted for several named rooms (Bear Room, Sea Lion Room); mobility/ADA boarding details not disclosed on retrieved pages.",
    },
    operatingCompany: {
      operatorId: "operator:favorite-bay-lodge",
      legalOrDisplayName: "Favorite Bay Lodge",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://favoritebay.com/",
      officialEmailDomain: "favoritebay.com",
      officialPhone: "(866) 788-3344",
      ownershipOrHistorySummary:
        "Built by founders Dana and Ryan Durand (operating since 2001); operates under Special Use Permit with the U.S. Forest Service, Tongass National Forest.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Favorite Bay Lodge Reservations",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://favoritebay.com/whats-included",
      primaryCtaLabel: "Check availability",
      bookingMechanismSummary:
        "Direct availability inquiry, email (reservations@favoritebay.com), phone (866-788-3344), or text (831-215-2440).",
    },
    partnerServices: [
      {
        serviceRole: "charter_or_commuter_air_carrier",
        providerName: "Roundtrip Juneau Floatplane Transfer (Included by Lodge)",
        arrangementType: "arranged_by_lodge_included",
        details: "Roundtrip floatplane between Juneau and Favorite Bay plus 100 lbs of fish freight to Juneau included.",
        officialUrl: "https://favoritebay.com/whats-included",
      },
    ],
    packages: [
      {
        packageId: "pkg:favorite-bay-lodge:3n-2d-2026",
        lodgeSlug: "favorite-bay-lodge",
        packageName: "2 Days / 3 Nights All-Inclusive",
        applicableSeason: "2026",
        applicableDatesLabel: "June – August (2026 published rate table; 15% off June 15–July 6, 2026 special)",
        nights: 3,
        fishingDays: 2,
        durationSummaryLabel: "3 nights / 2 days",
        occupancyAndSharingBasis: "Per person, double occupancy (single supplement available)",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 7490,
        priceDisplayLabel: "$7,490 / person (2026 rate)",
        taxTreatment: "unknown",
        taxDetailNote: "Page states 'No hidden travel fees'; confirm local Angoon/borough tax treatment and 2027 tariff updates.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Check current 2026/2027 dates directly with Favorite Bay Lodge.",
        verifiedInclusions: [
          "Roundtrip floatplane transfer from Juneau",
          "Private room with two double beds and en-suite soaking-tub bath",
          "All gourmet meals, shore/lodge lunches, appetizers, soft drinks, and mixers",
          "Daily guided fishing in protected Kootznoowoo Inlet waters (15 min from dock)",
          "Rods, reels, tackle, premium rain gear, and boots",
          "Kayaks and wildlife excursions",
          "Fish processing and 100 lbs fish freight back to Juneau",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "2027 season rate adjustment",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Retrieved /whats-included table is labeled '2026 All-Inclusive Rates' — confirm 2027 rate schedule.",
            sourceUrl: "https://favoritebay.com/whats-included",
          },
          {
            itemLabel: "ADF&G fishing license, stamps, alcohol & gratuities",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Mixers are included; confirm alcohol, ADF&G license/stamp purchase, single supplement, and gratuities.",
            sourceUrl: "https://favoritebay.com/whats-included",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://favoritebay.com/whats-included",
        sourceUrl: "https://favoritebay.com/whats-included",
        retrievedAt: RETRIEVED_DATE,
      },
      {
        packageId: "pkg:favorite-bay-lodge:4n-3d-2026",
        lodgeSlug: "favorite-bay-lodge",
        packageName: "3 Days / 4 Nights All-Inclusive",
        applicableSeason: "2026",
        applicableDatesLabel: "June – August (2026 published rate table)",
        nights: 4,
        fishingDays: 3,
        durationSummaryLabel: "4 nights / 3 days",
        occupancyAndSharingBasis: "Per person, double occupancy (single supplement available)",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 8780,
        priceDisplayLabel: "$8,780 / person (2026 rate)",
        taxTreatment: "unknown",
        taxDetailNote: "Confirm local tax treatment and 2027 rate updates.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Check dates directly with Favorite Bay Lodge.",
        verifiedInclusions: [
          "Roundtrip floatplane from Juneau + 100 lbs fish freight to Juneau",
          "4 nights private room & bath, all gourmet meals, non-alcoholic drinks & mixers",
          "3 days guided fishing, all tackle/rain gear/boots, kayaks & wildlife excursions",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "2027 season rate & ADF&G license/gratuities",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Confirm 2027 pricing, ADF&G license/stamps, single supplement, and crew tips.",
            sourceUrl: "https://favoritebay.com/whats-included",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://favoritebay.com/whats-included",
        sourceUrl: "https://favoritebay.com/whats-included",
        retrievedAt: RETRIEVED_DATE,
      },
      {
        packageId: "pkg:favorite-bay-lodge:5n-4d-2026",
        lodgeSlug: "favorite-bay-lodge",
        packageName: "4 Days / 5 Nights All-Inclusive",
        applicableSeason: "2026",
        applicableDatesLabel: "June – August (2026 published rate table; 6N/5D also published at $11,350/pp)",
        nights: 5,
        fishingDays: 4,
        durationSummaryLabel: "5 nights / 4 days",
        occupancyAndSharingBasis: "Per person, double occupancy (custom group rates for 10+)",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 10070,
        priceDisplayLabel: "$10,070 / person (2026 rate)",
        taxTreatment: "unknown",
        taxDetailNote: "3% discount noted for payments made by check or cash.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Check dates directly with Favorite Bay Lodge.",
        verifiedInclusions: [
          "Roundtrip floatplane from Juneau + 100 lbs fish freight to Juneau",
          "5 nights private room & bath, all gourmet meals, non-alcoholic drinks & mixers",
          "4 days guided fishing, all tackle/rain gear/boots, kayaks & wildlife excursions",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "2027 season rate & ADF&G license/gratuities",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Confirm 2027 pricing, ADF&G license/stamps, single supplement, and crew tips.",
            sourceUrl: "https://favoritebay.com/whats-included",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://favoritebay.com/whats-included",
        sourceUrl: "https://favoritebay.com/whats-included",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater", "freshwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary:
        "USCG-certified local guides fishing protected Kootznoowoo Inlet waters ~15 minutes from the lodge door; rods, reels, tackle, premium rain gear, and boots included.",
      targetSpeciesSummary: "All five Pacific salmon species, Pacific halibut, and Dolly Varden.",
      seasonalRunNote: "Operating window published as June – August on /whats-included.",
      fishProcessingAndBoxesSummary:
        "Fish processing and up to 100 lbs of fish freight back to Juneau included in every package.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Sportfishing License & Stamps",
          applicableActivityAndDateScope: "June–August guided fishing",
          provisionStatus: "unknown",
          detail: "Confirm whether ADF&G licenses/stamps are purchased prior to arrival or on site.",
          sourceUrl: null,
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:favorite-bay-lodge:1",
        gatewayAirportIata: "JNU",
        gatewayPlaceId: "place:community:juneau",
        gatewayPortSlug: "juneau",
        legTitle: "Juneau (JNU) ↔ Favorite Bay Roundtrip Floatplane",
        transferMode: "charter_or_scheduled_floatplane",
        carrierOrDockName: "Lodge-coordinated floatplane from Juneau",
        durationLabel: "Scenic floatplane flight to Kootznoowoo Inlet",
        provisionStatus: "included_in_published_package",
        transportOperationState: "lodge_operated_or_chartered_transfer",
        publishedTransferRateNote: "Included in package rate (including 100 lbs outbound fish freight to Juneau).",
        scopedBaggageAndFreightRule: {
          disclosed: true,
          ruleSummary: "100 lbs outbound fish freight to Juneau included; inbound personal luggage pound cap not stated on retrieved pages.",
          applicableServiceScope: "Juneau ↔ Favorite Bay floatplane leg",
          sourceUrl: "https://favoritebay.com/whats-included",
        },
        reportingAndOvernightBufferNote:
          "Confirm Juneau flight departure hour and recommended pre-stay overnight buffer in Juneau.",
        sourceUrl: "https://favoritebay.com/whats-included",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "documented_on_official_site",
        summary: "Kayaks included on calm Kootznoowoo Inlet waters.",
      },
      guidedNonFishingExcursions: {
        status: "custom_boat_wildlife_or_glacier_options",
        summary: "Wildlife excursions explicitly included in package list alongside kayaking and gourmet dining.",
      },
      simultaneousNonAnglerActivitiesProven: "unknown",
      simultaneousNonAnglerExplanation:
        "Wildlife excursions and kayaks are included in packages, but retrieved pages do not specify whether non-anglers have a separate dedicated guide/boat while companions fish — confirm with reservations.",
      contextualEcosystemLinks: JUNEAU_GATEWAY_ECOSYSTEM_LINKS,
    },
    visualRepresentation: {
      imagePath: "/images/portfolio/alaska-floatplane.webp",
      imageAlt: "Turbine floatplane on calm coastal Alaska fjord waters",
      imageCredit: "CC BY-SA 2.0 · Neal",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "FAVBAY-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "2026 Season (June – August)",
        claimSummary:
          "Publishes 2026 double-occupancy all-inclusive rates ($7,490 2D/3N, $8,780 3D/4N, $10,070 4D/5N, $11,350 5D/6N), roundtrip Juneau floatplane, kayaks, wildlife excursions, and 100 lbs fish freight to Juneau.",
        source: createOfficialCitation("Favorite Bay Lodge — What's Included & 2026 Rates", "https://favoritebay.com/whats-included"),
      },
      {
        claimId: "FAVBAY-02",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms 10 wildlife-named rooms with two double beds and private en-suite soaking-tub bathrooms.",
        source: createOfficialCitation("Favorite Bay Lodge — The Lodge", "https://favoritebay.com/lodge"),
      },
      {
        claimId: "FAVBAY-03",
        scope: "identity_and_roles",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms 20-guest capacity cap, Angoon employment ties, and operation under USFS Tongass National Forest Special Use Permit.",
        source: createOfficialCitation("Favorite Bay Lodge — About Us", "https://favoritebay.com/about"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Confirm 2027 package tariff updates (retrieved rate table is labeled 2026).",
      "Confirm inbound personal luggage weight cap on the floatplane and whether mixed parties split boats for simultaneous wildlife/kayak outings.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 3. WHALER'S COVE LODGE (Killisnoo Island / Angoon — Gateway: Juneau)
  // =========================================================================
  {
    lodgeId: "lodge:whalers-cove-lodge",
    slug: "whalers-cove-lodge",
    displayName: "Whaler's Cove Lodge",
    subRegion: "juneau_admiralty_stephens_passage",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "Family-operated Killisnoo Island lodge near Angoon (capped at 32 guests) publishing both 2027 and 2028 guided salt/freshwater, kayak-fishing, and eco-tour package rates with Ward Air or Goldbelt transfers from Juneau.",
    accommodation: {
      accommodationId: "accommodation:whalers-cove-lodge",
      propertyName: "Whaler's Cove Lodge",
      propertyKind: "remote_wilderness_lodge",
      actualLocationLabel: "Killisnoo Island (near Angoon & Admiralty Island National Monument)",
      streetOrPostalAddress: null,
      gatewayPlaceId: "place:community:juneau",
      gatewayPublicPortSlug: "juneau",
      gatewayLabel: "Juneau (JNU)",
      communityPlaceId: null,
      coordinates: {
        latitude: 57.4694,
        longitude: -134.5719,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Killisnoo Harbor / Angoon channel anchor.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Whaler's Cove Lodge operates the Killisnoo Harbor lodge, custom aluminum vessel fleet, fish processing plant, and phone reservation desk directly (no online cart).",
      roomAndCabinSummary:
        "Rooms, beach cabins (2–8 guests), and Sitkoh Bay duplex king suites with private bathrooms and daily housekeeping; no room-tier surcharges.",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "no",
      mealProvisionSummary:
        "Family-style hot breakfast, morning build-your-own lunch buffet, hot/cold appetizers, gourmet dinners, soft drinks, coffee/tea, and beverage mixing station included.",
      maxConcurrentGuests: 32,
      groupSizeGuidanceNote: "Total guest occupancy capped at 32 guests; predetermined arrival/departure dates coordinated with Juneau aircraft/vessels.",
      childrenAndYouthNote: "Not separately tiered on retrieved 2027/2028 rate pages — confirm youth policies by phone.",
      documentedAccessibilityNote:
        "Official /accommodations/ page documents an adjoining 'disability friendly' bathroom in the 4-bedroom Bay Cabin; dock ramp, boat, and floatplane mobility requirements must be confirmed by phone.",
    },
    operatingCompany: {
      operatorId: "operator:whalers-cove-lodge",
      legalOrDisplayName: "Whaler's Cove Lodge",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://www.whalerscovelodge.com/",
      officialEmailDomain: "whalerscovelodge.com",
      officialPhone: "(866) 731-5145",
      ownershipOrHistorySummary:
        "Family-owned and operated for 44 years on Killisnoo Island overlooking Admiralty Island National Monument.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Whaler's Cove Lodge Reservations",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://www.whalerscovelodge.com/2027-rates-availability/",
      primaryCtaLabel: "Check availability",
      bookingMechanismSummary:
        "Explicitly states no online booking engine is used due to remote flight/vessel logistics; reservations handled directly by phone at 1-866-731-5145.",
    },
    partnerServices: [
      {
        serviceRole: "charter_or_commuter_air_carrier",
        providerName: "Ward Air (wardair.com)",
        arrangementType: "arranged_by_lodge_included",
        details: "Floatplane transfer between Juneau and Killisnoo Island (50 lbs inbound/outbound personal luggage per person included).",
        officialUrl: "https://www.wardair.com/",
      },
      {
        serviceRole: "marine_transfer_carrier",
        providerName: "Goldbelt Transportation Catamaran",
        arrangementType: "arranged_by_lodge_included",
        details: "Alternative catamaran marine transfer option arranged by lodge between Juneau and Killisnoo Island.",
        officialUrl: "https://www.whalerscovelodge.com/fishing-packages-and-pricing/",
      },
    ],
    packages: [
      {
        packageId: "pkg:whalers-cove-lodge:3d-3n-2027",
        lodgeSlug: "whalers-cove-lodge",
        packageName: "3 Full Fishing Days / 3 Nights All-Inclusive (2027)",
        applicableSeason: "2027",
        applicableDatesLabel: "Predetermined Wed/Sat arrival windows (July – August 2027; 2028 rate $5,925 + tax)",
        nights: 3,
        fishingDays: 3,
        durationSummaryLabel: "3 nights / 3 full fishing days",
        occupancyAndSharingBasis: "Per person, double occupancy",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 5643,
        priceDisplayLabel: "$5,643 / person + tax",
        taxTreatment: "plus_tax",
        taxDetailNote: "Published as '$5,643 Per Person + tax' (exact local tax percentage confirmed on invoice).",
        remainingAvailabilityState: "static_page_note_only_unverified_live",
        availabilityNote:
          "Operator page posts periodic manual space notes (e.g., 'Only 8 Spaces Left' on select July/Aug 2027 dates), not a live inventory feed — call 1-866-731-5145 to verify.",
        verifiedInclusions: [
          "Floatplane via Ward Air (50 lbs personal luggage) or catamaran via Goldbelt Transportation from Juneau",
          "3 nights lodging with private bathroom (no room-category upcharges) and daily housekeeping",
          "3 full days guided saltwater/freshwater/kayak fishing or eco-tours with USCG captains",
          "All fishing tackle, bait, fuel, ice, gourmet meals, snacks, non-alcoholic drinks & mixers",
          "Commercial vacuum packaging, flash-freezing, and up to two 50 lb (100 lbs total) airline-approved wet-lock boxes",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Local taxes, Juneau pre-trip hotel night & airfare to Juneau",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Guests are asked to arrive in Juneau the night before Day 1 morning transport to Killisnoo Island.",
            sourceUrl: "https://www.whalerscovelodge.com/2027-rates-availability/",
          },
          {
            itemLabel: "ADF&G fishing license/stamps, alcohol, FedEx shipping & gratuities",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Boxes travel as checked airline baggage or can be delivered to FedEx (FedEx shipping charges separate).",
            sourceUrl: "https://www.whalerscovelodge.com/fishing-packages-and-pricing/",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://www.whalerscovelodge.com/2027-rates-availability/",
        sourceUrl: "https://www.whalerscovelodge.com/2027-rates-availability/",
        retrievedAt: RETRIEVED_DATE,
      },
      {
        packageId: "pkg:whalers-cove-lodge:4d-4n-2027",
        lodgeSlug: "whalers-cove-lodge",
        packageName: "4 Full Fishing Days / 4 Nights All-Inclusive (2027)",
        applicableSeason: "2027",
        applicableDatesLabel: "Predetermined Tue/Sat arrival windows (July – August 2027; 7D/7N also published at $13,383 + tax; 2028 4D/4N $8,300 + tax)",
        nights: 4,
        fishingDays: 4,
        durationSummaryLabel: "4 nights / 4 full fishing days",
        occupancyAndSharingBasis: "Per person, double occupancy",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 7740,
        priceDisplayLabel: "$7,740 / person + tax",
        taxTreatment: "plus_tax",
        taxDetailNote: "Published as '$7,740 Per Person + tax'.",
        remainingAvailabilityState: "static_page_note_only_unverified_live",
        availabilityNote: "Static space notes posted on page; call 1-866-731-5145 to confirm current openings.",
        verifiedInclusions: [
          "Juneau ↔ Killisnoo transfer via Ward Air floatplane (50 lbs personal luggage) or Goldbelt catamaran",
          "4 nights lodging, all meals/mixers, 4 full days guided fishing/eco-tours, all gear/bait/fuel",
          "Up to two 50 lb (100 lbs total) vacuum-packed, flash-frozen airline-approved wet-lock fish boxes",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Taxes, pre-night Juneau hotel, ADF&G license/stamps, alcohol & gratuities",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Arrive in Juneau the night prior to Day 1 morning departure.",
            sourceUrl: "https://www.whalerscovelodge.com/2027-rates-availability/",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://www.whalerscovelodge.com/2027-rates-availability/",
        sourceUrl: "https://www.whalerscovelodge.com/2027-rates-availability/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater", "freshwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary:
        "Custom-built aluminum vessels with USCG-licensed captains just 10 minutes from calm Chatham Strait/Killisnoo waters, plus guided freshwater stream and kayak-fishing options.",
      targetSpeciesSummary: "Pacific halibut, silver (coho) and king salmon, sablefish (black cod), and freshwater species.",
      seasonalRunNote: "Published 2027/2028 trip calendars span July and August (confirm June/September custom windows by phone).",
      fishProcessingAndBoxesSummary:
        "Daily custom filleting, commercial vacuum-packing, flash-freezing, and wet-lock airline boxes included: up to 2 × 50 lb boxes (100 lbs) on 3D/4D packages and 3 × 50 lb boxes (150 lbs) on 7D packages.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Sportfishing License & King/Halibut Stamps",
          applicableActivityAndDateScope: "All guided fishing guests",
          provisionStatus: "extra_charge_quote_required",
          detail: "Separate Fishing Licenses resource linked on rate page; confirm exact 2027 stamp requirements with lodge.",
          sourceUrl: "https://www.whalerscovelodge.com/2027-rates-availability/",
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:whalers-cove-lodge:1",
        gatewayAirportIata: "JNU",
        gatewayPlaceId: "place:community:juneau",
        gatewayPortSlug: "juneau",
        legTitle: "Juneau (JNU) ↔ Killisnoo Island via Ward Air Floatplane or Goldbelt Catamaran",
        transferMode: "charter_or_scheduled_floatplane",
        carrierOrDockName: "Ward Air (floatplane) or Goldbelt Transportation (catamaran)",
        durationLabel: "First-thing Day 1 morning transfer from Juneau",
        provisionStatus: "included_in_published_package",
        transportOperationState: "lodge_operated_or_chartered_transfer",
        publishedTransferRateNote: "Included in 3D, 4D, and 7D package rates.",
        scopedBaggageAndFreightRule: {
          disclosed: true,
          ruleSummary:
            "50 lbs inbound and outbound personal luggage per person on Ward Air floatplane; outbound fish boxes up to 2 × 50 lbs (3D/4D) or 3 × 50 lbs (7D) included.",
          applicableServiceScope: "Ward Air floatplane / Goldbelt catamaran Lodge Transfer",
          sourceUrl: "https://www.whalerscovelodge.com/fishing-packages-and-pricing/",
        },
        reportingAndOvernightBufferNote:
          "Official rate page instructs guests to arrive in Juneau the night before Day 1 so morning transport delivers a full first day of fishing.",
        sourceUrl: "https://www.whalerscovelodge.com/2027-rates-availability/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Kayak fishing and eco-tours are offered as guided programs; unguided loaner boat policy not stated on retrieved pages.",
      },
      guidedNonFishingExcursions: {
        status: "custom_boat_wildlife_or_glacier_options",
        summary: "Packages explicitly cover 'Eco, Salt and Fresh Water Fishing, Boat Based Guided Packages' with dedicated /eco-tours/ offerings.",
      },
      simultaneousNonAnglerActivitiesProven: "unknown",
      simultaneousNonAnglerExplanation:
        "Eco-tours are explicitly part of the boat-based program, but confirm by phone whether a 4-person party shares one private boat or splits across fishing and eco-tour vessels.",
      contextualEcosystemLinks: JUNEAU_GATEWAY_ECOSYSTEM_LINKS,
    },
    visualRepresentation: {
      imagePath: "/images/alaska/juneau-whale.jpg",
      imageAlt: "Humpback whale breaching in Southeast Alaska Inside Passage waters",
      imageCredit: "Public domain · NPS / Kaitlin Thoreson",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "WCL-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "2027 Season (and 2028 Season)",
        claimSummary:
          "Publishes 2027 double-occupancy guided rates ($5,643 3D/3N, $7,740 4D/4N, $13,383 7D/7N + tax), 32-guest occupancy cap, phone-only booking model, and night-before Juneau arrival instruction.",
        source: createOfficialCitation("Whaler's Cove Lodge — 2027 Rates & Availability", "https://www.whalerscovelodge.com/2027-rates-availability/"),
      },
      {
        claimId: "WCL-02",
        scope: "access_and_baggage",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms Ward Air floatplane (50 lbs inbound/outbound personal luggage) or Goldbelt Transportation catamaran, plus 2 × 50 lb (3D/4D) or 3 × 50 lb (7D) airline-approved wet-lock fish boxes.",
        source: createOfficialCitation("Whaler's Cove Lodge — Packages & What's Included", "https://www.whalerscovelodge.com/fishing-packages-and-pricing/"),
      },
      {
        claimId: "WCL-03",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents rooms, duplex suites, and 4BR/2BA Bay Cabin featuring an adjoining 'disability friendly' bathroom.",
        source: createOfficialCitation("Whaler's Cove Lodge — Accommodations", "https://www.whalerscovelodge.com/accommodations/"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Confirm boat-sharing vs. private-boat allocation for a party of 4 and whether 2 anglers + 2 eco-tour guests split boats.",
      "Confirm exact local tax rate and single-room supplement if uneven occupancy is needed.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 4. SHELTER LODGE (Shelter Island — Gateway: Juneau / Statter Harbor Auke Bay)
  // =========================================================================
  {
    lodgeId: "lodge:shelter-lodge",
    slug: "shelter-lodge",
    displayName: "Shelter Lodge",
    subRegion: "juneau_admiralty_stephens_passage",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "Yamada family-operated lodge on Shelter Island (20-minute included boat ride from Juneau's Auke Bay Harbor) with transparent, tax-included 2027 package rates.",
    accommodation: {
      accommodationId: "accommodation:shelter-lodge",
      propertyName: "Shelter Lodge",
      propertyKind: "remote_wilderness_lodge",
      actualLocationLabel: "Shelter Island (Stephens Passage / Favorite Channel, 20 min by boat from Auke Bay)",
      streetOrPostalAddress: "P.O. Box 210064, Auke Bay, AK 99821",
      gatewayPlaceId: "place:community:juneau",
      gatewayPublicPortSlug: "juneau",
      gatewayLabel: "Juneau · Auke Bay Harbor (JNU)",
      communityPlaceId: "place:harbor:statter-harbor-auke-bay",
      coordinates: {
        latitude: 58.418,
        longitude: -134.852,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Shelter Island / Favorite Channel anchor (departs Auke Bay Harbor 58.3845, -134.6465).",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Shelter Lodge (opened 1982 by Richard Yamada) operates the Shelter Island lodge, cabin cruisers, and direct reservations.",
      roomAndCabinSummary:
        "Heated lodge guest rooms accommodating double, triple, or quadruple occupancy, each with a private bathroom and daily maid service (named rooms include King Crab, Coho Suite, Halibut, Black Cod, etc.).",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "no",
      mealProvisionSummary:
        "6:00 a.m. continental & 6:30 a.m. hot buffet breakfast, bento boat lunches, 6:00 p.m. Hawaiian-style pupus/sashimi appetizers, and 6:30 p.m. dinners included (soft drinks and alcohol excluded).",
      maxConcurrentGuests: null,
      groupSizeGuidanceNote: "Rooms support 2 to 4 guests; total concurrent lodge guest cap not stated on retrieved pages.",
      childrenAndYouthNote:
        "Published 2027 Youth tier (ages 15 & under) saves $100 per person ($5,150 total on 5N/4D; $3,750 total on 4N/3D).",
      documentedAccessibilityNote:
        "Not disclosed on retrieved pages — confirm Auke Bay harbor float ramp, boat step-aboard, and Shelter Island trail/stairs directly.",
    },
    operatingCompany: {
      operatorId: "operator:shelter-lodge",
      legalOrDisplayName: "Shelter Lodge",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://shelterlodge.com/",
      officialEmailDomain: "shelterlodge.com",
      officialPhone: "(808) 551-1993",
      ownershipOrHistorySummary:
        "Opened in 1982 by Richard Yamada and operated with Jackie Yamada and lodge manager Capt. Kenji Yamada.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Shelter Lodge",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://shelterlodge.com/rates/",
      primaryCtaLabel: "Check availability",
      bookingMechanismSummary:
        "Direct phone/email booking ($1,000/person deposit due within 2 weeks of reservation; non-refundable final payment due Jan 31 / Feb 28 / Mar 31 by tour date).",
    },
    partnerServices: [],
    packages: [
      {
        packageId: "pkg:shelter-lodge:5n-4d-2027",
        lodgeSlug: "shelter-lodge",
        packageName: "5 Nights / 4 Days Fishing Package (2027)",
        applicableSeason: "2027",
        applicableDatesLabel: "2027 Summer Season (Returning Guest Adult $5,150 total; Youth 15 & under $5,150 new / $5,050 returning)",
        nights: 5,
        fishingDays: 4,
        durationSummaryLabel: "5 nights / 4 fishing days",
        occupancyAndSharingBasis: "Per person (rooms accommodate double, triple, or quadruple occupancy; confirm anglers-per-boat assignment)",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 5250,
        priceDisplayLabel: "$5,250.00 / adult (CBJ tax included)",
        taxTreatment: "tax_included",
        taxDetailNote:
          "Explicitly itemized on /rates/: $4,946.32 base + $303.68 City & Borough of Juneau sales & room tax = $5,250.00 total.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Contact Shelter Lodge at (808) 551-1993 to verify open 2027 dates.",
        verifiedInclusions: [
          "Round-trip boat transportation between Juneau (Auke Bay Harbor) and Shelter Island",
          "5 nights lodge accommodations with private bathroom and daily maid service",
          "All meals at the lodge (breakfast, bento lunches, pupus/sashimi, dinner; coffee/tea/cocoa)",
          "4 days guided fishing from cabin cruisers + spot shrimp and Dungeness crab pot pulls",
          "Use of fishing equipment, tackle, rain gear, and rubber boots",
          "Fish cleaning, vacuum packing, freezing, and airline-approved wax-coated fish boxes",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "ADF&G Fishing License & King Salmon Stamp",
            chargeStatus: "published_rate_separate",
            publishedAmountNote: "License: 3-day $30 / 7-day $45 · King Stamp: 1-day $15 / 3-day $30 / 7-day $45 (available at lodge)",
            scopeAndRuleNote: "Published on /rates/; verify any current-year ADF&G nonresident fee adjustments.",
            sourceUrl: "https://shelterlodge.com/rates/",
          },
          {
            itemLabel: "Soft drinks, alcoholic beverages, en-route Juneau hotels/meals, airport overnight freezer storage & airline bag fees",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Explicitly listed under 'Packages Do Not Include' on /rates/, along with tips and trip insurance.",
            sourceUrl: "https://shelterlodge.com/rates/",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://shelterlodge.com/rates/",
        sourceUrl: "https://shelterlodge.com/rates/",
        retrievedAt: RETRIEVED_DATE,
      },
      {
        packageId: "pkg:shelter-lodge:4n-3d-black-cod-2027",
        lodgeSlug: "shelter-lodge",
        packageName: "4 Nights / 3 Days Fishing Package — Black Cod Special (2027)",
        applicableSeason: "2027",
        applicableDatesLabel: "2027 Black Cod Special window (Returning Adult $3,750; Youth 15 & under $3,750 new / $3,650 returning)",
        nights: 4,
        fishingDays: 3,
        durationSummaryLabel: "4 nights / 3 fishing days",
        occupancyAndSharingBasis: "Per person (double/triple/quad room occupancy)",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 3850,
        priceDisplayLabel: "$3,850.00 / adult (CBJ tax included)",
        taxTreatment: "tax_included",
        taxDetailNote: "Itemized on /rates/: $3,627.30 base + $222.70 CBJ sales & room tax = $3,850.00 total.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Contact Shelter Lodge directly for 2027 Black Cod Special dates.",
        verifiedInclusions: [
          "Round-trip boat transfer from Juneau (Auke Bay Harbor)",
          "4 nights lodging, all lodge meals, 3 days guided cabin-cruiser fishing, rain gear/boots, tackle, vacuum packing & waxed fish boxes",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "ADF&G license/stamps, soft drinks, alcohol, airport freezer storage, airline bag fees & tips",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Excluded per /rates/.",
            sourceUrl: "https://shelterlodge.com/rates/",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://shelterlodge.com/rates/",
        sourceUrl: "https://shelterlodge.com/rates/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary:
        "Guided saltwater fishing from cabin cruisers with all rods, tackle, rain gear, and rubber boots supplied; includes dropping pots for Alaskan spot shrimp and Dungeness crab.",
      targetSpeciesSummary: "All 5 Pacific salmon species (king, silver, chum, pink, sockeye), Pacific halibut, black cod (butterfish), and rockfish.",
      seasonalRunNote: "Official /fish-runs/ page details king peak May–June, chum/pink peak July–mid-Aug, silver (coho) peak late July–Sep.",
      fishProcessingAndBoxesSummary:
        "Fish cleaning, vacuum packing, freezing, and airline-approved wax-coated fish boxes included (airport overnight freezer storage and airline baggage fees excluded).",
      scopedRequirements: [
        {
          requirementName: "ADF&G Fishing License & King Salmon Stamp",
          applicableActivityAndDateScope: "All anglers (sold at lodge)",
          provisionStatus: "extra_charge_published",
          detail: "Excluded from package rate; available for purchase at the lodge.",
          sourceUrl: "https://shelterlodge.com/rates/",
        },
        {
          requirementName: "Charter Halibut Regulations / Stamp",
          applicableActivityAndDateScope: "2027 guided halibut fishing",
          provisionStatus: "unknown",
          detail: "Charter halibut stamp handling is not explicitly mentioned on /rates/ — confirm 2027 rule with lodge.",
          sourceUrl: null,
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:shelter-lodge:1",
        gatewayAirportIata: "JNU",
        gatewayPlaceId: "place:community:juneau",
        gatewayPortSlug: "juneau",
        legTitle: "Juneau Auke Bay Harbor ↔ Shelter Island Boat Transfer",
        transferMode: "lodge_boat_or_catamaran",
        carrierOrDockName: "Shelter Lodge boat from Auke Bay Harbor (Statter Harbor)",
        durationLabel: "20-minute boat ride",
        provisionStatus: "included_in_published_package",
        transportOperationState: "lodge_operated_or_chartered_transfer",
        publishedTransferRateNote: "Round-trip boat transfer from Juneau to Shelter Lodge included (ground taxi from JNU Airport to Auke Bay not mentioned — confirm pickup).",
        scopedBaggageAndFreightRule: {
          disclosed: false,
          ruleSummary: "Boat transfer eliminates floatplane weight caps, though exact per-guest bag count and Auke Bay pickup time are not stated on retrieved pages.",
          applicableServiceScope: "Auke Bay Harbor ↔ Shelter Island boat transfer",
          sourceUrl: "https://shelterlodge.com/lodging/",
        },
        reportingAndOvernightBufferNote:
          "En-route Juneau hotel stays and meals are excluded; confirm boat departure hour from Auke Bay before booking flights.",
        sourceUrl: "https://shelterlodge.com/lodging/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Kayaks or unguided skiffs are not listed on retrieved Shelter Lodge pages.",
      },
      guidedNonFishingExcursions: {
        status: "not_disclosed_on_retrieved_source",
        summary:
          "Humpback whale bubble-net viewing and Inside Passage sightseeing occur from the fishing cabin cruisers; separate non-fishing day tours are not listed.",
      },
      simultaneousNonAnglerActivitiesProven: "no",
      simultaneousNonAnglerExplanation:
        "Packages are sold as guided cabin-cruiser fishing stays; travelers wanting dedicated kayaking or glacier trekking can pair Juneau days before/after the Shelter Island stay.",
      contextualEcosystemLinks: JUNEAU_GATEWAY_ECOSYSTEM_LINKS,
    },
    visualRepresentation: {
      imagePath: "/images/alaska/whale-watching.jpg",
      imageAlt: "Humpback whale in Favorite Channel / Inside Passage waters near Juneau",
      imageCredit: "Public domain · NPS / Kaitlin Thoreson",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "SHELTER-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "2027 Season",
        claimSummary:
          "Publishes 2027 CBJ-tax-included rates ($5,250.00 5N/4D adult; $3,850.00 4N/3D Black Cod Special), Youth (<=15) & Returning Guest rates, inclusions, exclusions, and non-refundable payment schedule.",
        source: createOfficialCitation("Shelter Lodge — 2027 Rates & Information", "https://shelterlodge.com/rates/"),
      },
      {
        claimId: "SHELTER-02",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms 20-minute boat transfer from Auke Bay Harbor in Juneau and private-bath guest rooms for double, triple, or quad occupancy.",
        source: createOfficialCitation("Shelter Lodge — Lodging", "https://shelterlodge.com/lodging/"),
      },
      {
        claimId: "SHELTER-03",
        scope: "identity_and_roles",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents Yamada family operation since 1982 and seasonal salmon run calendar.",
        source: createOfficialCitation("Shelter Lodge — About Us", "https://shelterlodge.com/about-us/"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Confirm JNU Airport ↔ Auke Bay Harbor ground taxi/van coordination and boat departure clock times.",
      "Confirm maximum anglers per cabin cruiser and whether private-boat exclusivity is offered for a group of 4.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 5. GLACIER BAY'S BEAR TRACK INN (Gustavus — Gateway: Gustavus / Juneau)
  // =========================================================================
  {
    lodgeId: "lodge:bear-track-inn",
    slug: "bear-track-inn",
    displayName: "Glacier Bay's Bear Track Inn",
    subRegion: "gustavus_glacier_bay_icy_strait",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "modular_lodging_plus_separate_charters",
    headlineSummary:
      "14-room handcrafted log lodge in Gustavus where lodging, gourmet meals, and local Gustavus shuttles are bundled nightly while sportfishing charters, Glacier Bay tours, and glacier kayaking are priced separately per guest.",
    accommodation: {
      accommodationId: "accommodation:bear-track-inn",
      propertyName: "Glacier Bay's Bear Track Inn",
      propertyKind: "remote_wilderness_lodge",
      actualLocationLabel: "Gustavus, Alaska (Icy Strait / Gateway to Glacier Bay National Park)",
      streetOrPostalAddress: "5021 Rink Creek Rd, Gustavus, AK 99826",
      gatewayPlaceId: "place:community:gustavus",
      gatewayPublicPortSlug: "gustavus",
      gatewayLabel: "Gustavus (GST) via Juneau (JNU)",
      communityPlaceId: "place:community:gustavus",
      coordinates: {
        latitude: 58.4133,
        longitude: -135.7049,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Rink Creek / Gustavus gateway anchor near Bartlett Cove.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Bear Track Inn operates the 14-room log lodge, dining room, and local Gustavus transfers, and coordinates third-party/partner sportfishing, Glacier Bay, whale, and kayak excursions.",
      roomAndCabinSummary:
        "14 spacious log guest rooms (~270 sq ft), each with private bathroom and two queen beds (plus one accessible room with two full beds).",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "no",
      mealProvisionSummary:
        "All breakfasts, lunches, and gourmet dinners included in nightly room rates; beer and wine excluded.",
      maxConcurrentGuests: null,
      groupSizeGuidanceNote: "14 rooms with two queen beds each; group and activity-package discounts available by inquiry.",
      childrenAndYouthNote: "Family-owned and family-welcoming; child rate adjustments not specified on retrieved /rates/ page.",
      documentedAccessibilityNote:
        "Official /our-rooms/ page documents an Accessible Room with two full-size beds; confirm boat/kayak partner accessibility separately.",
    },
    operatingCompany: {
      operatorId: "operator:bear-track-inn",
      legalOrDisplayName: "Glacier Bay's Bear Track Inn",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://beartrackinn.com/",
      officialEmailDomain: "beartrackinn.com",
      officialPhone: "(907) 697-3017",
      ownershipOrHistorySummary:
        "Family-owned and operated in Gustavus since 1997 (U.S. reservations line also listed at 316-734-7731).",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Bear Track Inn Reservations",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://beartrackinn.com/rates/",
      primaryCtaLabel: "Check availability",
      bookingMechanismSummary:
        "Online 'Check Availability' / 'Request Information' forms or direct phone booking at (907) 697-3017 / (316) 734-7731.",
    },
    partnerServices: [
      {
        serviceRole: "charter_or_commuter_air_carrier",
        providerName: "Juneau ↔ Gustavus Commuter Air Carriers (Booked via Bear Track Inn or Direct)",
        arrangementType: "arranged_by_lodge_extra_or_pass_through",
        details:
          "Bear Track Inn offers to book Juneau–Gustavus commuter flights at $200/person per flight (one-way) with a strict 50 lb luggage allowance.",
        officialUrl: "https://beartrackinn.com/rates/",
      },
      {
        serviceRole: "gateway_non_fishing_excursions",
        providerName: "Gustavus / Bartlett Cove Sportfishing, Glacier Bay, Whale & Kayak Operators",
        arrangementType: "arranged_by_lodge_extra_or_pass_through",
        details:
          "Activities (sportfishing, Glacier Bay National Park tours, whale watching, kayaking) are booked à la carte or in custom activity packages; local Gustavus ground shuttles are included when booked through the Inn.",
        officialUrl: "https://beartrackinn.com/activities/",
      },
    ],
    packages: [
      {
        packageId: "pkg:bear-track-inn:nightly-lodging-meals-base",
        lodgeSlug: "bear-track-inn",
        packageName: "Nightly Lodging, Meals & Local Gustavus Shuttle Base (Activities Separate)",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel: "Summer season (Meadow View from $520/pp/nt; Water View from $570/pp/nt; /rooms/water-view/ notes 2024 reference — confirm 2027 rate)",
        nights: 1,
        fishingDays: null,
        durationSummaryLabel: "Per night (custom multi-night stay; activities priced separately)",
        occupancyAndSharingBasis: "Per person, per night, based on double occupancy",
        priceState: "published_starting_from_rate",
        priceAmountUsd: 520,
        priceDisplayLabel: "From $520 / person / night (meals incl.; activities extra)",
        taxTreatment: "plus_tax",
        taxDetailNote: "Explicitly excludes city taxes and fuel surcharge.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Check room and charter availability directly with Bear Track Inn.",
        verifiedInclusions: [
          "Handcrafted log guest room with private bath",
          "All meals at the lodge",
          "Ground transportation around Gustavus to activities booked through Bear Track Inn",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Juneau ↔ Gustavus Commuter Air",
            chargeStatus: "published_rate_separate",
            publishedAmountNote: "$200 / person per flight ($400 roundtrip) via Inn carriers (50 lb luggage cap)",
            scopeAndRuleNote: "Alternatively fly seasonal Alaska Airlines JNU–GST jet or ride AMHS ferry from Auke Bay.",
            sourceUrl: "https://beartrackinn.com/rates/",
          },
          {
            itemLabel: "Sportfishing charters, Glacier Bay boat tour, whale watching & glacier kayaking",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote:
              "Priced separately — allows 2 anglers to book fishing days while 2 companions book Glacier Bay/kayak tours without paying angler boat rates.",
            sourceUrl: "https://beartrackinn.com/rates/",
          },
          {
            itemLabel: "City taxes, fuel surcharge, beer/wine, ADF&G licenses, fish shipping & gratuities",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: "Suggested gratuity guide: $150–$250 per room per night (double occupancy)",
            scopeAndRuleNote: "Explicitly listed on /rates/.",
            sourceUrl: "https://beartrackinn.com/rates/",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://beartrackinn.com/rates/",
        sourceUrl: "https://beartrackinn.com/rates/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater", "freshwater"],
      guidingMode: "charters_booked_separately",
      vesselsAndEquipmentSummary:
        "Guided Icy Strait / Cross Sound halibut and salmon charters arranged through Bear Track Inn (vessel size, max anglers, and private vs. shared charter pricing quoted per booking).",
      targetSpeciesSummary: "Pacific halibut, salmon, and local stream species.",
      seasonalRunNote: "Summer operating season.",
      fishProcessingAndBoxesSummary:
        "Fish processing and airline box/freight terms are not detailed on retrieved /rates/ page — confirm charter processor fees and 50 lb commuter plane freight rules before booking.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Sportfishing License, King Stamp & Charter Halibut Rules",
          applicableActivityAndDateScope: "Guests booking guided fishing days",
          provisionStatus: "extra_charge_quote_required",
          detail: "Required only for party members participating in fishing days.",
          sourceUrl: null,
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:bear-track-inn:1",
        gatewayAirportIata: "GST",
        gatewayPlaceId: "place:community:gustavus",
        gatewayPortSlug: "gustavus",
        legTitle: "Juneau (JNU) ↔ Gustavus (GST) Commuter Plane + Inn Courtesy Transfer",
        transferMode: "wheeled_commuter_aircraft",
        carrierOrDockName: "Juneau–Gustavus commuter carriers (or seasonal Alaska Airlines / AMHS ferry)",
        durationLabel: "~25–30 min flight from Juneau (packages from Haines & Skagway also available)",
        provisionStatus: "extra_charge_published",
        transportOperationState: "scheduled_third_party_carrier_corridor",
        publishedTransferRateNote: "$200 / person per flight via Bear Track Inn carriers; local Gustavus transfers included.",
        scopedBaggageAndFreightRule: {
          disclosed: true,
          ruleSummary: "Strict 50 lb luggage allowance per guest on commuter planes between Juneau and Gustavus.",
          applicableServiceScope: "Juneau ↔ Gustavus commuter aircraft leg",
          sourceUrl: "https://beartrackinn.com/rates/",
        },
        reportingAndOvernightBufferNote:
          "Plan for the 50 lb commuter-plane bag cap if returning to Juneau with frozen fish boxes (or fly seasonal Alaska Airlines jet during peak summer window).",
        sourceUrl: "https://beartrackinn.com/rates/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "documented_on_official_site",
        summary: "Loaner rain gear and bicycles mentioned on homepage.",
      },
      guidedNonFishingExcursions: {
        status: "modular_booked_separately",
        summary:
          "Guided Glacier Bay National Park tours, Icy Strait whale watching, and glacier sea kayaking booked through the Inn with local ground transfers included.",
      },
      simultaneousNonAnglerActivitiesProven: "yes",
      simultaneousNonAnglerExplanation:
        "Because rooms + meals are unbundled from daily excursions ('Choose Your Own Itinerary'), anglers and non-anglers in the same group can book completely independent daily activities.",
      contextualEcosystemLinks: [
        {
          label: "Gustavus Gateway & Bartlett Cove Logistics",
          href: "/ports/gustavus",
          surface: "lfse",
          relationshipNote: "Understand Gustavus airport, ferry dock, and Bartlett Cove National Park access.",
        },
        {
          label: "Glacier Bay National Park Scenic Cruising vs. Land Visits",
          href: "/ports/glacier-bay",
          surface: "lfse",
          relationshipNote: "Why staying in Gustavus differs from large-ship scenic-only days.",
        },
        ...JUNEAU_GATEWAY_ECOSYSTEM_LINKS.slice(0, 1),
        ...JUNEAU_GATEWAY_ECOSYSTEM_LINKS.slice(4),
      ],
    },
    visualRepresentation: {
      imagePath: "/images/alaska/allen-marine-catamaran.jpg",
      imageAlt: "Tour vessel in Glacier Bay National Park and Preserve near Gustavus",
      imageCredit: "Public domain · National Park Service",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "BTI-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19 (confirm 2027 nightly tariff)",
        claimSummary:
          "Publishes nightly double-occupancy lodging+meals+local shuttle rates starting at $520/pp (Meadow View) and $570/pp (Water View), $200/pp one-way Juneau commuter flight, 50 lb luggage cap, and explicit exclusions (taxes, fuel surcharge, activities, beer/wine, tips).",
        source: createOfficialCitation("Bear Track Inn — Rates", "https://beartrackinn.com/rates/"),
      },
      {
        claimId: "BTI-02",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms 14 log guest rooms with private baths, including an accessible room with two full-size beds.",
        source: createOfficialCitation("Bear Track Inn — Rooms", "https://beartrackinn.com/our-rooms/"),
      },
      {
        claimId: "BTI-03",
        scope: "non_fishing_options",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents modular 'Choose Your Own Itinerary' offerings across sportfishing, Glacier Bay tours, whale watching, and glacier kayaking.",
        source: createOfficialCitation("Bear Track Inn — Activities", "https://beartrackinn.com/activities/"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Request current 2027 room + activity-package quote (including exact per-person sportfishing charter, fish processing, and Glacier Bay kayak pricing).",
      "Confirm how frozen fish boxes are handled against the 50 lb Juneau–Gustavus commuter aircraft luggage cap.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 6. GLACIER BAY COUNTRY INN (Gustavus — Gateway: Gustavus / Juneau)
  // =========================================================================
  {
    lodgeId: "lodge:glacier-bay-country-inn",
    slug: "glacier-bay-country-inn",
    displayName: "Glacier Bay Country Inn",
    subRegion: "gustavus_glacier_bay_icy_strait",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "160-acre Gustavus rainforest lodge and private cabin property offering dedicated Fishing Packages, Glacier Bay Adventure Packages, and split Combo Fishing + Adventure itineraries.",
    accommodation: {
      accommodationId: "accommodation:glacier-bay-country-inn",
      propertyName: "Glacier Bay Country Inn",
      propertyKind: "remote_wilderness_lodge",
      actualLocationLabel: "Gustavus, Alaska (160-acre homestead near Glacier Bay National Park)",
      streetOrPostalAddress: null,
      gatewayPlaceId: "place:community:gustavus",
      gatewayPublicPortSlug: "gustavus",
      gatewayLabel: "Gustavus (GST) via Juneau (JNU)",
      communityPlaceId: "place:community:gustavus",
      coordinates: {
        latitude: 58.4265,
        longitude: -135.7485,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Gustavus homestead road corridor anchor.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Glacier Bay Country Inn operates the 5-room main lodge, 5 private cabins, chef-led dining room, and custom Fishing/Adventure/Combo packages.",
      roomAndCabinSummary:
        "5 guest rooms in the main lodge (~2 guests each) plus 5 private cabins (2–4 guests each) and a two-bedroom suite; private bathrooms documented on /alaska-fishing/; 2,000 sq ft rec & theater room.",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "no",
      mealProvisionSummary: "All chef-prepared meals are included in the lodging price.",
      maxConcurrentGuests: null,
      groupSizeGuidanceNote: "5 lodge rooms + 5 cabins (2–4 guests/cabin) + 2BR suite; corporate retreats and private groups supported.",
      childrenAndYouthNote: "Cabins explicitly noted as well suited for families of 2–4.",
      documentedAccessibilityNote: "Not disclosed on retrieved pages — confirm lodge stairs and cabin entry access by phone.",
    },
    operatingCompany: {
      operatorId: "operator:glacier-bay-country-inn",
      legalOrDisplayName: "Glacier Bay Country Inn",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://glacierbayalaska.com/",
      officialEmailDomain: "glacierbayalaska.com",
      officialPhone: "(907) 697-2288",
      ownershipOrHistorySummary: "Operating in Gustavus for 30+ years on 160 acres near Glacier Bay National Park.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Glacier Bay Country Inn",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://glacierbayalaska.com/rates-and-packages/",
      primaryCtaLabel: "Request a quote",
      bookingMechanismSummary: "Custom trip builder, online inquiry, or phone consultation at (907) 697-2288.",
    },
    partnerServices: [],
    packages: [
      {
        packageId: "pkg:glacier-bay-country-inn:combo-fishing-adventure",
        lodgeSlug: "glacier-bay-country-inn",
        packageName: "Fishing, Adventure & Combo Packages (3, 4, 5 & 7 Nights)",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel:
          "Named packages: 3N/2D, 4N/3D & 5N/4D Saltwater or Salt+Fresh Fishing; 3N/4N/5N Adventure; 3N, 4N, 5N & 7N Fishing + Adventure Combos",
        nights: 5,
        fishingDays: null,
        durationSummaryLabel: "3, 4, 5, or 7 nights (Combo Fishing + Adventure or pure Fishing)",
        occupancyAndSharingBasis: "Confirmed per room/cabin selection and customized itinerary",
        priceState: "quote_required",
        priceAmountUsd: null,
        priceDisplayLabel: "Request a quote (package rates not inline on overview HTML)",
        taxTreatment: "unknown",
        taxDetailNote: "Confirm Gustavus city tax, package inclusions, and transfer pricing on quote.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Advance reservations strongly recommended on /alaska-adventure/; call (907) 697-2288.",
        verifiedInclusions: [
          "Private lodge room or cabin with private bathroom",
          "All chef-prepared meals in the main lodge dining room",
          "Customized combination of guided Icy Strait saltwater/freshwater fishing and Glacier Bay / whale / kayak adventures",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Package dollar tariff, air/ferry transfers to Gustavus, licenses, fish shipping & tips",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Request itemized package sheet from Glacier Bay Country Inn for your exact dates and angler/non-angler split.",
            sourceUrl: "https://glacierbayalaska.com/rates-and-packages/",
          },
        ],
        ctaLabel: "Request a quote",
        ctaUrl: "https://glacierbayalaska.com/rates-and-packages/",
        sourceUrl: "https://glacierbayalaska.com/rates-and-packages/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater", "freshwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary:
        "Inside-waters Icy Strait / Glacier Bay area saltwater big-game fishing (<20 minutes run to grounds) plus freshwater salmon, Dolly Varden, steelhead, and cutthroat trips.",
      targetSpeciesSummary: "Halibut, salmon, Dolly Varden, steelhead, and cutthroat trout.",
      seasonalRunNote: "Summer operating season — confirm run timing for target species at booking.",
      fishProcessingAndBoxesSummary: "Confirm fish box pound limits and air-freight handling out of GST/JNU on quote.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Sportfishing License & Applicable Stamps",
          applicableActivityAndDateScope: "Fishing package days",
          provisionStatus: "unknown",
          detail: "Confirm license and charter halibut stamp inclusion on itemized quote.",
          sourceUrl: null,
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:glacier-bay-country-inn:1",
        gatewayAirportIata: "GST",
        gatewayPlaceId: "place:community:gustavus",
        gatewayPortSlug: "gustavus",
        legTitle: "Juneau (JNU) ↔ Gustavus (GST) Air or AMHS Ferry Arrival",
        transferMode: "wheeled_commuter_aircraft",
        carrierOrDockName: "Gustavus Airport (Alaska Seaplanes / seasonal Alaska Airlines) or AMHS Gustavus Dock",
        durationLabel: "~25–30 min flight from Juneau",
        provisionStatus: "unknown",
        transportOperationState: "scheduled_third_party_carrier_corridor",
        publishedTransferRateNote: "Confirm whether local GST airport/dock pickup and JNU–GST airfare are bundled in your selected package tier.",
        scopedBaggageAndFreightRule: {
          disclosed: false,
          ruleSummary: "Carrier-dependent (commuter flights out of JNU enforce 50 lb checked / 0 cabin carry-on rules per Alaska Seaplanes policy).",
          applicableServiceScope: "Juneau ↔ Gustavus flight leg",
          sourceUrl: null,
        },
        reportingAndOvernightBufferNote: "Confirm flight connection buffers in Juneau with lodge planning desk.",
        sourceUrl: "https://glacierbayalaska.com/rates-and-packages/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "documented_on_official_site",
        summary: "On-property hiking trails and bicycles across 160 acres.",
      },
      guidedNonFishingExcursions: {
        status: "dedicated_lodge_naturalist_or_eco_program",
        summary:
          "Dedicated Adventure & Combo packages covering Glacier Bay National Park tours, Point Adolphus whale watching, flightseeing, and four kayaking options (Wilderness Isles, Kayaking with Whales, McBride Glacier, Bartlett Cove).",
      },
      simultaneousNonAnglerActivitiesProven: "yes",
      simultaneousNonAnglerExplanation:
        "Explicitly sells separate Fishing Packages, Adventure Packages, and Combo Fishing + Adventure Packages so mixed groups can customize fishing vs. kayaking/park days.",
      contextualEcosystemLinks: [
        {
          label: "Gustavus Community & Bartlett Cove Guide",
          href: "/ports/gustavus",
          surface: "lfse",
          relationshipNote: "Compare Gustavus harbor, airport, and National Park access points.",
        },
        {
          label: "Glacier Bay National Park Guide",
          href: "/ports/glacier-bay",
          surface: "lfse",
          relationshipNote: "Understand Park Service vessel rules and Bartlett Cove vs. cruise transit.",
        },
        ...JUNEAU_GATEWAY_ECOSYSTEM_LINKS.slice(4),
      ],
    },
    visualRepresentation: {
      imagePath: "/images/alaska/isp-whale-watch.jpg",
      imageAlt: "Humpback whale surfacing in Icy Strait feeding waters near Point Adolphus",
      imageCredit: "Public domain · NOAA / National Marine Sanctuaries",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "GBCI-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Lists 3N/4N/5N Fishing Packages, 3N/4N/5N Glacier Bay Adventure Packages, and 3N/4N/5N/7N Fishing + Adventure Combo Packages plus four named kayaking trips.",
        source: createOfficialCitation("Glacier Bay Country Inn — Rates & Packages", "https://glacierbayalaska.com/rates-and-packages/"),
      },
      {
        claimId: "GBCI-02",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms 160-acre Gustavus property, 5 main-lodge rooms, 5 private cabins (2–4 guests each), private bathrooms, and all chef-prepared meals included.",
        source: createOfficialCitation("Glacier Bay Country Inn — Lodge & Property", "https://glacierbayalaska.com/lodging-and-amenities/lodge/"),
      },
      {
        claimId: "GBCI-03",
        scope: "non_fishing_options",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents <20-minute saltwater run times alongside Glacier Bay tours, Point Adolphus whale watching, kayaking, hiking, and flightseeing.",
        source: createOfficialCitation("Glacier Bay Country Inn — Alaska Adventure", "https://glacierbayalaska.com/alaska-adventure/"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Request current 2027 per-person rates for your exact Combo or Fishing + Adventure split.",
      "Confirm whether Juneau–Gustavus flights, fish processing/boxes, and GST airport transfers are bundled or itemized separately.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 7. TANAKU LODGE (Elfin Cove — Gateway: Juneau)
  // =========================================================================
  {
    lodgeId: "lodge:tanaku-lodge",
    slug: "tanaku-lodge",
    displayName: "Tanaku Lodge",
    subRegion: "elfin_cove_cross_sound",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "28-guest boardwalk fishing lodge at the mouth of Cross Sound in Elfin Cove offering 3-night and 6-night guided packages (quote by phone; Juneau–Elfin Cove transport and fish freight excluded).",
    accommodation: {
      accommodationId: "accommodation:tanaku-lodge",
      propertyName: "Tanaku Lodge",
      propertyKind: "boardwalk_cove_lodge",
      actualLocationLabel: "Elfin Cove, Northwest Chichagof Island (Cross Sound)",
      streetOrPostalAddress: "1 Tanaku Dr. (P.O. Box 72), Elfin Cove, AK 99825",
      gatewayPlaceId: "place:community:juneau",
      gatewayPublicPortSlug: "juneau",
      gatewayLabel: "Juneau (JNU) → Elfin Cove",
      communityPlaceId: "place:community:elfin-cove",
      coordinates: {
        latitude: 58.1942,
        longitude: -136.3458,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Elfin Cove inner boardwalk harbor anchor.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation: "Tanaku Lodge operates the Elfin Cove main lodge, cabins, 7-boat fleet, and direct phone reservations.",
      roomAndCabinSummary:
        "Hosts up to 28 guests across the main cedar-and-pine lodge and private cabins; each suite has two full-sized beds and either a private bathroom or a bathroom shared only among guests in the same group; hot tub on site.",
      bathroomConfiguration: "private_or_group_shared_documented",
      guestKitchenOrSelfCaterAccess: "no",
      mealProvisionSummary:
        "Hearty breakfasts, packed boat lunches, 3-course dinners, and complimentary dinner wine and beer included (hard liquor excluded).",
      maxConcurrentGuests: 28,
      groupSizeGuidanceNote: "Up to 28 concurrent guests; custom group and corporate retreat rates available.",
      childrenAndYouthNote: "Not separately specified on retrieved pages.",
      documentedAccessibilityNote:
        "Elfin Cove is a remote boardwalk harbor accessed by floatplane dock; mobility accommodations not disclosed on retrieved pages.",
    },
    operatingCompany: {
      operatorId: "operator:tanaku-lodge",
      legalOrDisplayName: "Tanaku Lodge",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://www.tanakulodge.com/",
      officialEmailDomain: "tanakulodge.com",
      officialPhone: "(907) 419-9956",
      ownershipOrHistorySummary: "Long-established boardwalk lodge in Elfin Cove on northwestern Chichagof Island.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Tanaku Lodge",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://www.tanakulodge.com/rates",
      primaryCtaLabel: "Request a quote",
      bookingMechanismSummary:
        "Call (907) 419-9956 or email info@tanakulodge.com for pricing and dates (payments non-refundable unless spot is rebooked).",
    },
    partnerServices: [
      {
        serviceRole: "charter_or_commuter_air_carrier",
        providerName: "Juneau ↔ Elfin Cove Seaplane Carrier (Paid Separately)",
        arrangementType: "arranged_separately_by_guest_or_group",
        details: "Transportation between Juneau and Elfin Cove and fish freight charges are explicitly excluded from base lodge rates.",
        officialUrl: "https://www.tanakulodge.com/rates",
      },
    ],
    packages: [
      {
        packageId: "pkg:tanaku-lodge:5d-6n-and-3d-3n",
        lodgeSlug: "tanaku-lodge",
        packageName: "5 Days / 6 Nights or 3 Days / 3 Nights Guided Fishing",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel: "3 Days / 3 Nights & 5 Days / 6 Nights packages (custom group trips available)",
        nights: 6,
        fishingDays: 5,
        durationSummaryLabel: "6 nights / 5 days (or 3 nights / 3 days)",
        occupancyAndSharingBasis: "Shared lodging with private or same-group bathroom; call (907) 419-9956 for rate quote",
        priceState: "quote_required",
        priceAmountUsd: null,
        priceDisplayLabel: "Call for pricing · (907) 419-9956",
        taxTreatment: "unknown",
        taxDetailNote: "Confirm tax treatment when requesting quote.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Contact Tanaku Lodge directly by phone or email.",
        verifiedInclusions: [
          "Lodge/cabin accommodations (private or same-group shared bath) and hot tub access",
          "All meals plus complimentary wine and beer with dinner",
          "Guided fishing aboard Tanaku fleet with rain gear, tackle, bait, and lures",
          "Fish packaging for your flight home",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Transportation between Juneau and Elfin Cove + Fish Freight Charges",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote:
              "Explicitly excluded on /rates — budget separately for round-trip Juneau floatplane, outbound fish freight, and any Juneau weather-delay hotel/meals.",
            sourceUrl: "https://www.tanakulodge.com/rates",
          },
          {
            itemLabel: "ADF&G fishing license, hard liquor & crew gratuities",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Explicitly listed under 'Not Included' on /rates.",
            sourceUrl: "https://www.tanakulodge.com/rates",
          },
        ],
        ctaLabel: "Request a quote",
        ctaUrl: "https://www.tanakulodge.com/rates",
        sourceUrl: "https://www.tanakulodge.com/rates",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary:
        "7 named vessels listed on /our-boats (Ocean Rogue, Ocean Quest, Ocean Legacy, Ocean Seeker, Reel Song, Whaler, The Journey); rain gear, rods, tackle, bait, and lures included.",
      targetSpeciesSummary: "Cross Sound & outer Chichagof saltwater salmon, halibut, and bottomfish.",
      seasonalRunNote: "Summer season — confirm target-species dates by phone.",
      fishProcessingAndBoxesSummary: "Fish packaging for flight home is included; floatplane fish freight charges are excluded.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Sportfishing License & Applicable Stamps",
          applicableActivityAndDateScope: "All guided fishing days",
          provisionStatus: "extra_charge_quote_required",
          detail: "Must be purchased via ADF&G website prior to fishing.",
          sourceUrl: "https://www.tanakulodge.com/rates",
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:tanaku-lodge:1",
        gatewayAirportIata: "JNU",
        gatewayPlaceId: "place:community:juneau",
        gatewayPortSlug: "juneau",
        legTitle: "Juneau (JNU) ↔ Elfin Cove Seaplane Transfer (Excluded from Base Rate)",
        transferMode: "charter_or_scheduled_floatplane",
        carrierOrDockName: "Juneau ↔ Elfin Cove floatplane carrier (e.g. Alaska Seaplanes)",
        durationLabel: "~45 minutes scenic flight from Juneau",
        provisionStatus: "extra_charge_quote_required",
        transportOperationState: "scheduled_third_party_carrier_corridor",
        publishedTransferRateNote: "Not included in Tanaku Lodge package rate; fish freight charges also separate.",
        scopedBaggageAndFreightRule: {
          disclosed: true,
          ruleSummary:
            "Fish freight charges are billed separately by the air carrier; standard Alaska Seaplanes scheduled flights enforce 50 lb checked / 0 cabin carry-on rules.",
          applicableServiceScope: "Juneau ↔ Elfin Cove floatplane leg",
          sourceUrl: "https://www.tanakulodge.com/rates",
        },
        reportingAndOvernightBufferNote:
          "Official /rates page explicitly notes any Juneau hotel/meals needed for weather-related flight delays are guest responsibility — build buffer time in Juneau.",
        sourceUrl: "https://www.tanakulodge.com/rates",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Kayaks are not mentioned on retrieved Tanaku pages; wooden Elfin Cove boardwalk and lodge hot tub on site.",
      },
      guidedNonFishingExcursions: {
        status: "custom_boat_wildlife_or_glacier_options",
        summary: "Site menu includes a dedicated Glacier Bay National Park page alongside Cross Sound fishing.",
      },
      simultaneousNonAnglerActivitiesProven: "unknown",
      simultaneousNonAnglerExplanation:
        "Confirm directly with Tanaku Lodge whether non-angling companions can arrange Glacier Bay sightseeing without chartering a full separate fishing vessel.",
      contextualEcosystemLinks: JUNEAU_GATEWAY_ECOSYSTEM_LINKS,
    },
    visualRepresentation: {
      imagePath: "/images/alaska/taku-lodge.jpg",
      imageAlt: "De Havilland Otter floatplane docked on Southeast Alaska coastal waters",
      imageCredit: "CC BY-SA 2.0 · Neal",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "TANAKU-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms 5D/6N and 3D/3N packages ('Call for pricing 907-419-9956'), included gear/packaging, and explicit exclusions (Juneau–Elfin Cove transport, fish freight, license, hard liquor, tips, Juneau weather-delay hotel/meals).",
        source: createOfficialCitation("Tanaku Lodge — Rates", "https://www.tanakulodge.com/rates"),
      },
      {
        claimId: "TANAKU-02",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms 28-guest capacity, private or same-group shared bathrooms, rain gear/equipment, all meals, and complimentary wine & beer with dinner.",
        source: createOfficialCitation("Tanaku Lodge — All Inclusive", "https://www.tanakulodge.com/all-inclusive"),
      },
      {
        claimId: "TANAKU-03",
        scope: "fishing_and_regulations",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary: "Lists the 7 vessels in the Tanaku fleet at 1 Tanaku Dr., Elfin Cove.",
        source: createOfficialCitation("Tanaku Lodge — Our Boats", "https://www.tanakulodge.com/our-boats"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Call (907) 419-9956 for 2027 3D/3N vs. 5D/6N package quotes and anglers-per-boat ratios.",
      "Budget separately for round-trip Juneau ↔ Elfin Cove floatplane fares, fish freight, and a Juneau weather-buffer hotel night.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 8. ELFIN COVE RESORT (Elfin Cove — Gateway: Juneau)
  // =========================================================================
  {
    lodgeId: "lodge:elfin-cove-resort",
    slug: "elfin-cove-resort",
    displayName: "Elfin Cove Resort",
    subRegion: "elfin_cove_cross_sound",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "Multi-building Elfin Cove boardwalk resort (16 private-bath rooms, up to 40 guests, incorporating the former Fishmasters Inn) with published package rates that include round-trip Alaska Seaplanes flights from Juneau.",
    accommodation: {
      accommodationId: "accommodation:elfin-cove-resort",
      propertyName: "Elfin Cove Resort (4 Buildings incl. Beach House & Former Fishmasters Inn)",
      propertyKind: "boardwalk_cove_lodge",
      actualLocationLabel: "Elfin Cove, Northern Chichagof Island (85 miles west of Juneau)",
      streetOrPostalAddress: "Off-season mail: PO Box 33484, Juneau, AK 99803",
      gatewayPlaceId: "place:community:juneau",
      gatewayPublicPortSlug: "juneau",
      gatewayLabel: "Juneau (JNU) → Elfin Cove",
      communityPlaceId: "place:community:elfin-cove",
      coordinates: {
        latitude: 58.195,
        longitude: -136.347,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Elfin Cove boardwalk harbor anchor.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Elfin Cove Resort operates all four lodge buildings (including the historic 6-room former Fishmasters Inn building), guided fleet, and direct reservations.",
      roomAndCabinSummary:
        "4 buildings housing 16 guest rooms (up to 40 guests total): Main Building (5 rooms + dining/common area), Chalet (2 rooms + deck), Beach House (3 rooms, 3 baths, sleeps up to 6), and former Fishmasters Inn (6 rooms + kitchen/loft). Every room has a private bathroom.",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "unknown",
      mealProvisionSummary: "Full-service dining, snacks, and all non-alcoholic beverages included.",
      maxConcurrentGuests: 40,
      groupSizeGuidanceNote: "Accommodates solo/shared guests, private 6-guest Beach House groups, and full-resort groups up to 40.",
      childrenAndYouthNote: "Family gatherings welcomed; separate child rate tiers not listed on /packages/.",
      documentedAccessibilityNote:
        "Car-free boardwalk cove with multi-story cedar buildings; mobility access details not disclosed on retrieved pages.",
    },
    operatingCompany: {
      operatorId: "operator:elfin-cove-resort",
      legalOrDisplayName: "Elfin Cove Resort",
      existingLfseOperatorSlug: null,
      legacyOrBuildingAliases: ["fishmasters-inn"],
      officialWebsite: "https://elfincoveresort.com/",
      officialEmailDomain: null,
      officialPhone: "(888) 922-3474",
      ownershipOrHistorySummary:
        "27+ years in operation; official /our-story/ documents incorporation of the former Fishmasters Inn 4-story cedar building into the 4-building resort.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Elfin Cove Resort",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://elfincoveresort.com/packages/",
      primaryCtaLabel: "Check availability",
      bookingMechanismSummary:
        "Online reservation request or toll-free phone 1-888-922-3474 / 907-239-2209 ($1,000 non-refundable deposit; 5.5% credit-card convenience fee).",
    },
    partnerServices: [
      {
        serviceRole: "charter_or_commuter_air_carrier",
        providerName: "Alaska Seaplanes (Juneau Airport Seaplane Wing)",
        arrangementType: "arranged_by_lodge_included",
        details: "Round-trip ~45-minute floatplane between JNU Airport (Alaska Seaplanes wing) and Elfin Cove is booked and included by the resort.",
        officialUrl: "https://elfincoveresort.com/explore/getting-here/",
      },
    ],
    packages: [
      {
        packageId: "pkg:elfin-cove-resort:goldrush-5n-4d",
        lodgeSlug: "elfin-cove-resort",
        packageName: "Goldrush Package — 6 Days / 5 Nights / 4 Full Fishing Days",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel: "May – summer trip blocks (Beach House 6D/5N private-building upgrade: $6,795/pp)",
        nights: 5,
        fishingDays: 4,
        durationSummaryLabel: "5 nights / 4 full fishing days (6 travel days)",
        occupancyAndSharingBasis: "Per person, double or shared occupancy",
        priceState: "published_undated_current_rate",
        priceAmountUsd: 6295,
        priceDisplayLabel: "$6,295 / person",
        taxTreatment: "unknown",
        taxDetailNote: "Confirm local tax treatment; 5.5% convenience fee applies to credit-card payments.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Call 1-888-922-3474 to verify open trip dates.",
        verifiedInclusions: [
          "Round-trip ~45m Alaska Seaplanes floatplane transportation from Juneau (booked by resort)",
          "5 nights lodging with private bathroom, full-service dining, snacks & non-alcoholic beverages",
          "4 full days guided fishing with all tackle, bait, boots, and rain gear",
          "Fish processing up to two 50 lb boxes (100 lbs total)",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Floatplane freight over 50 lbs & fish processing over 100 lbs",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote:
              "Explicitly excluded on /packages/: 'Fish processing over 100lbs and Freight charges on Float Plane over 50 lbs' are extra.",
            sourceUrl: "https://elfincoveresort.com/packages/",
          },
          {
            itemLabel: "ADF&G Fishing License, King Stamp & Daily Charter Halibut Stamps",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Explicitly listed under 'What's Not Included' alongside alcohol, gratuities, and 5.5% card fee.",
            sourceUrl: "https://elfincoveresort.com/packages/",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://elfincoveresort.com/packages/",
        sourceUrl: "https://elfincoveresort.com/packages/",
        retrievedAt: RETRIEVED_DATE,
      },
      {
        packageId: "pkg:elfin-cove-resort:24karat-4n-3d",
        lodgeSlug: "elfin-cove-resort",
        packageName: "24Karat Package — 5 Days / 4 Nights / 3 Full Fishing Days",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel: "Also published: Prospector 4D/3N/2F ($5,095/pp) & Quick Claim 3D/2N/1F ($3,595/pp select dates)",
        nights: 4,
        fishingDays: 3,
        durationSummaryLabel: "4 nights / 3 full fishing days (5 travel days)",
        occupancyAndSharingBasis: "Per person, double or shared occupancy",
        priceState: "published_undated_current_rate",
        priceAmountUsd: 5695,
        priceDisplayLabel: "$5,695 / person",
        taxTreatment: "unknown",
        taxDetailNote: "5.5% convenience fee on credit-card payments.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Call 1-888-922-3474 for current season dates.",
        verifiedInclusions: [
          "Round-trip Juneau floatplane, 4 nights private-bath lodging, meals, 3 full days guided fishing, gear & up to 100 lbs fish processing",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Floatplane freight >50 lbs, processing >100 lbs, AK license/King/Halibut stamps, alcohol & tips",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Explicitly excluded on /packages/.",
            sourceUrl: "https://elfincoveresort.com/packages/",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://elfincoveresort.com/packages/",
        sourceUrl: "https://elfincoveresort.com/packages/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater", "freshwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary: "Professional guided fishing in Cross Sound / outer Chichagof waters plus freshwater options; all tackle, bait, boots, and rain gear included.",
      targetSpeciesSummary: "Saltwater salmon, halibut, bottomfish, and freshwater species.",
      seasonalRunNote: "Trip blocks start May 11 through summer.",
      fishProcessingAndBoxesSummary: "Includes fish processing up to 2 × 50 lb boxes (100 lbs); processing >100 lbs and floatplane freight >50 lbs billed extra.",
      scopedRequirements: [
        {
          requirementName: "Daily Charter Halibut Stamps, AK License & King Stamp",
          applicableActivityAndDateScope: "All guided fishing packages",
          provisionStatus: "extra_charge_quote_required",
          detail: "Explicitly listed under 'What's Not Included' on /packages/.",
          sourceUrl: "https://elfincoveresort.com/packages/",
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:elfin-cove-resort:1",
        gatewayAirportIata: "JNU",
        gatewayPlaceId: "place:community:juneau",
        gatewayPortSlug: "juneau",
        legTitle: "Juneau Airport (Alaska Seaplanes Wing) ↔ Elfin Cove Floatplane",
        transferMode: "charter_or_scheduled_floatplane",
        carrierOrDockName: "Alaska Seaplanes (walk from JNU main terminal to Alaska Seaplanes wing)",
        durationLabel: "~45 minutes",
        provisionStatus: "included_in_published_package",
        transportOperationState: "scheduled_third_party_carrier_corridor",
        publishedTransferRateNote: "Included in Goldrush, 24Karat, Prospector & Quick Claim packages ($575 RT on select-date Daily Nugget lodging rate).",
        scopedBaggageAndFreightRule: {
          disclosed: true,
          ruleSummary: "Floatplane freight charges over 50 lbs are excluded and billed separately.",
          applicableServiceScope: "Alaska Seaplanes Juneau ↔ Elfin Cove leg",
          sourceUrl: "https://elfincoveresort.com/packages/",
        },
        reportingAndOvernightBufferNote:
          "Alaska Seaplanes enforces a 30-minute pre-departure check-in cutoff at JNU; confirm connection buffer with resort.",
        sourceUrl: "https://elfincoveresort.com/explore/getting-here/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Our Story notes beaches within kayaking distance and boardwalk trails, without stating whether loaner kayaks are included.",
      },
      guidedNonFishingExcursions: {
        status: "custom_boat_wildlife_or_glacier_options",
        summary: "Mentions George Island WWII gun-site hikes, White Sulfur Springs boat trips, Brady Glacier views, and Glacier Bay proximity.",
      },
      simultaneousNonAnglerActivitiesProven: "unknown",
      simultaneousNonAnglerExplanation:
        "Confirm directly whether non-anglers have dedicated guided outings or Daily Nugget lodging-only rates while companions fish.",
      contextualEcosystemLinks: JUNEAU_GATEWAY_ECOSYSTEM_LINKS,
    },
    visualRepresentation: {
      imagePath: "/images/alaska/icy-strait-point-wilderness.jpg",
      imageAlt: "Coastal rainforest and Chichagof Island shoreline along Icy Strait",
      imageCredit: "CC BY-SA 4.0 · Enrico Blasutto",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "ECR-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19 (confirm applicable year for posted rates)",
        claimSummary:
          "Publishes Goldrush ($6,295 6D/5N), Beach House ($6,795 6D/5N), 24Karat ($5,695 5D/4N), Prospector ($5,095 4D/3N), Quick Claim ($3,595 3D/2N), included Juneau flight, and >50 lb floatplane freight / Charter Halibut Stamp exclusions.",
        source: createOfficialCitation("Elfin Cove Resort — Packages", "https://elfincoveresort.com/packages/"),
      },
      {
        claimId: "ECR-02",
        scope: "access_and_baggage",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms ~45-minute Alaska Seaplanes floatplane transfer from Juneau International Airport is booked and included by the resort.",
        source: createOfficialCitation("Elfin Cove Resort — Getting Here", "https://elfincoveresort.com/explore/getting-here/"),
      },
      {
        claimId: "ECR-03",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents 4 buildings (16 private-bath rooms, up to 40 guests), including the former Fishmasters Inn building.",
        source: createOfficialCitation("Elfin Cove Resort — Our Story", "https://elfincoveresort.com/our-story/"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Confirm whether posted package dollar amounts apply to 2027 bookings and how many anglers share each boat.",
      "Plan for floatplane freight charges above 50 lbs when flying fish boxes back to Juneau.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 9. WATERFALL RESORT (Prince of Wales Island — Gateway: Ketchikan)
  // =========================================================================
  {
    lodgeId: "lodge:waterfall-resort",
    slug: "waterfall-resort",
    displayName: "Waterfall Resort Alaska",
    subRegion: "prince_of_wales_island",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "Historic 1912 salmon cannery resort across 52 acres on western Prince of Wales Island, reached by included Ketchikan floatplane with heated 26-foot cabin cruisers (4 guests/boat standard) and on-site Alaska Airlines check-in.",
    accommodation: {
      accommodationId: "accommodation:waterfall-resort",
      propertyName: "Waterfall Resort (52-Acre Historic 1912 Cannery Campus)",
      propertyKind: "historic_cannery_resort",
      actualLocationLabel: "Western Prince of Wales Island (accessible only by air and sea from Ketchikan)",
      streetOrPostalAddress: null,
      gatewayPlaceId: "place:community:ketchikan",
      gatewayPublicPortSlug: "ketchikan",
      gatewayLabel: "Ketchikan (KTN)",
      communityPlaceId: "place:community:craig",
      coordinates: {
        latitude: 55.2972,
        longitude: -133.2428,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Ulloa Channel / Waterfall cannery bay anchor on western Prince of Wales Island.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Waterfall Resort operates the 52-acre resort, cabin-cruiser fleet, fish plant, and direct reservations (no unverified cross-property ownership claim asserted here).",
      roomAndCabinSummary:
        "Historic Boardwalk Cabins and oceanfront Lodge Rooms (standard double occupancy; +$450/guest/night single supplement), plus Egg House Suites (2-guest min) and Tongass Townhouses (4-guest min).",
      bathroomConfiguration: "unknown",
      guestKitchenOrSelfCaterAccess: "no",
      mealProvisionSummary:
        "All hearty Alaska-style meals in the Dining Room plus wine with dinner included; Lagoon Saloon bar charges extra.",
      maxConcurrentGuests: 92,
      groupSizeGuidanceNote: "Hosts individuals, couples, families, and corporate/nonprofit events for groups of up to 92 guests.",
      childrenAndYouthNote: "All-season family vacations promoted; specific child rate percentages not listed on retrieved /rates text.",
      documentedAccessibilityNote:
        "Boardwalk cannery campus accessed by floatplane dock; specific ADA room/boat details not disclosed on retrieved pages.",
    },
    operatingCompany: {
      operatorId: "operator:waterfall-resort",
      legalOrDisplayName: "Waterfall Resort Alaska",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://www.waterfallresort.com/",
      officialEmailDomain: "waterfallresort.com",
      officialPhone: "(800) 544-5125",
      ownershipOrHistorySummary:
        "Historic 1912 salmon cannery operating as a sport-fishing resort with a 1:1 staff-to-guest ratio.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Waterfall Resort Reservations",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://www.waterfallresort.com/rates/2027-rates-specials",
      primaryCtaLabel: "Check availability",
      bookingMechanismSummary:
        "Online date/availability selector, quote request form, or phone reservations at 800-544-5125.",
    },
    partnerServices: [
      {
        serviceRole: "charter_or_commuter_air_carrier",
        providerName: "Ketchikan ↔ Waterfall Resort Floatplane + On-Site Alaska Airlines Check-In",
        arrangementType: "arranged_by_lodge_included",
        details:
          "Includes KTN Airport ground-crew meet & greet, round-trip floatplane to Waterfall Resort, and on-site Alaska Airlines departure-day check-in.",
        officialUrl: "https://www.waterfallresort.com/rates",
      },
    ],
    packages: [
      {
        packageId: "pkg:waterfall-resort:2027-all-inclusive",
        lodgeSlug: "waterfall-resort",
        packageName: "2027 All-Inclusive Guided Sport-Fishing Package (June – September)",
        applicableSeason: "2027",
        applicableDatesLabel: "June – September 2027 (date-specific rates returned via online calendar or quote)",
        nights: null,
        fishingDays: null,
        durationSummaryLabel: "Multi-night stay (fly in morning, fish afternoon; exact nights selected at booking)",
        occupancyAndSharingBasis:
          "Per person, double occupancy in Lodge Room or Boardwalk Cabin, fishing 4 guests per 26-foot boat (+$450/nt single supplement; paid upgrades for 3, 2, or 1 guest/boat)",
        priceState: "quote_required",
        priceAmountUsd: null,
        priceDisplayLabel: "Date-dependent 2027 rate · Request quote / check calendar",
        taxTreatment: "unknown",
        taxDetailNote: "Base package rate varies by selected 2027 dates and room/boat upgrades.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Check date-specific 2027 openings directly on waterfallresort.com or via 800-544-5125.",
        verifiedInclusions: [
          "Ground-crew assistance at Ketchikan International Airport (KTN) and round-trip floatplane to Waterfall Resort",
          "Lodging in historic Boardwalk Cabin or oceanfront Lodge Room with Wi-Fi and daily housekeeping",
          "All meals including wine with dinner",
          "Guided sport fishing on heated 26-foot cabin cruiser (4 guests/boat standard) with rods, reels & all-weather gear",
          "Professional fish trimming, vacuum-packing, fish boxes, and on-site Alaska Airlines departure check-in",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Single room supplement & private boat exclusivity upgrades",
            chargeStatus: "published_rate_separate",
            publishedAmountNote: "+$450 / guest / night single supplement; 3-, 2-, or 1-guest/boat exclusivity quoted by availability",
            scopeAndRuleNote: "Published on /rates (Suite and 4-guest Tongass Townhouse upgrades also available).",
            sourceUrl: "https://www.waterfallresort.com/rates",
          },
          {
            itemLabel: "Commercial airfare, airline baggage fees, ADF&G license, King Stamp, Bonus Halibut Tags, bar, massage & tips",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Explicitly listed as excluded on /rates.",
            sourceUrl: "https://www.waterfallresort.com/rates",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://www.waterfallresort.com/rates/2027-rates-specials",
        sourceUrl: "https://www.waterfallresort.com/rates",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary:
        "Heated 26-foot cabin cruisers (standard 4 anglers/boat; optional 3/2/1 exclusivity upgrades) with all rods, reels, and all-weather gear included.",
      targetSpeciesSummary: "Wild king and silver salmon, Pacific halibut, lingcod, and 20+ sport-fish species.",
      seasonalRunNote: "2027 season runs June through September ('Claim Your King' highlighted in June).",
      fishProcessingAndBoxesSummary:
        "Professional trimming, vacuum-packing, fish boxes, and on-site Alaska Airlines check-in included; airline checked baggage fees extra.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Sportfishing License, King Salmon Stamp & Optional Bonus Halibut Tags",
          applicableActivityAndDateScope: "June – September 2027 guided saltwater fishing",
          provisionStatus: "extra_charge_quote_required",
          detail: "Licenses and King Stamp excluded; homepage notes optional Bonus Halibut Tags to expand halibut retention.",
          sourceUrl: "https://www.waterfallresort.com/rates",
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:waterfall-resort:1",
        gatewayAirportIata: "KTN",
        gatewayPlaceId: "place:community:ketchikan",
        gatewayPortSlug: "ketchikan",
        legTitle: "Ketchikan International Airport (KTN) ↔ Waterfall Resort Floatplane",
        transferMode: "charter_or_scheduled_floatplane",
        carrierOrDockName: "Resort-coordinated floatplane + KTN ground crew",
        durationLabel: "Short floatplane flight (fly in morning, fish afternoon)",
        provisionStatus: "included_in_published_package",
        transportOperationState: "lodge_operated_or_chartered_transfer",
        publishedTransferRateNote: "Included in standard package pricing.",
        scopedBaggageAndFreightRule: {
          disclosed: false,
          ruleSummary: "Floatplane personal luggage limit not stated on retrieved /rates text; commercial airline baggage fees are excluded.",
          applicableServiceScope: "KTN ↔ Waterfall floatplane & Alaska Airlines departure check-in",
          sourceUrl: "https://www.waterfallresort.com/rates",
        },
        reportingAndOvernightBufferNote:
          "Homepage notes guests can fly from Seattle (90m to KTN) in the morning and fish the same afternoon — confirm qualifying flight arrival cutoff.",
        sourceUrl: "https://www.waterfallresort.com/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Kayaks are not listed on retrieved pages; property spans 52 acres with coastal trails and historic cannery boardwalks.",
      },
      guidedNonFishingExcursions: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Wildlife sightings (whales, otters, bears, eagles) occur on the water and grounds; separate non-fishing guided boats are not documented.",
      },
      simultaneousNonAnglerActivitiesProven: "no",
      simultaneousNonAnglerExplanation:
        "Waterfall is a dedicated sport-fishing resort; travelers seeking full-day non-fishing excursions can pair Ketchikan Misty Fjords or cultural days before/after the stay.",
      contextualEcosystemLinks: [
        {
          label: "Ketchikan Port, Harbors & Misty Fjords Operators",
          href: "/ports/ketchikan",
          surface: "lfse",
          relationshipNote: "Compare Ketchikan floatplane (Taquan Air), catamaran, and totem excursions before/after your resort flight.",
        },
        {
          label: "Misty Fjords Floatplanes & Catamarans in Ketchikan",
          href: "/ports/ketchikan/misty-fjords-tours",
          surface: "lfse",
          relationshipNote: "Side-by-side Ketchikan Misty Fjords options for pre/post lodge days.",
        },
        {
          label: "Klawock & Prince of Wales Island Cultural Context",
          href: "/ports/klawock",
          surface: "lfse",
          relationshipNote: "Explore Prince of Wales Island Tlingit and Haida totem heritage.",
        },
      ],
    },
    visualRepresentation: {
      imagePath: "/images/alaska/misty-fjords.jpg",
      imageAlt: "Southern Southeast Alaska fjord cliffs and forested waterways near Ketchikan",
      imageCredit: "CC BY-SA 4.0 · Ulises Icardi",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "WF-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "2027 Season (June – September)",
        claimSummary:
          "Documents 2027 double-occupancy 4-guests/boat pricing structure, +$450/nt single supplement, boat exclusivity upgrades, included KTN floatplane & Alaska Air check-in, and explicit exclusions.",
        source: createOfficialCitation("Waterfall Resort — Season Rates & Upgrades", "https://www.waterfallresort.com/rates"),
      },
      {
        claimId: "WF-02",
        scope: "identity_and_roles",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms 52-acre historic 1912 salmon cannery site on Prince of Wales Island and morning-arrival / afternoon-fishing schedule from Ketchikan.",
        source: createOfficialCitation("Waterfall Resort — Official Homepage", "https://www.waterfallresort.com/"),
      },
      {
        claimId: "WF-03",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary: "Notes group capacity up to 92 guests for events and 1:1 staff-to-guest ratio.",
        source: createOfficialCitation("Waterfall Resort — Nonprofit & Group Events", "https://www.waterfallresort.com/rates/nonprofit-fundraising"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Request exact 2027 per-person rate for your target June–September dates (note: a party of 4 fills one standard 4-guest boat with zero boat-exclusivity surcharge).",
      "Confirm floatplane personal luggage weight allowance from KTN.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 10. ALASKA'S KINGFISHER LODGE (Craig, POW Island — Distinct from Sitka!)
  // =========================================================================
  {
    lodgeId: "lodge:alaska-kingfisher-lodge-craig",
    slug: "alaska-kingfisher-lodge-craig",
    displayName: "Alaska's Kingfisher Lodge (Craig)",
    subRegion: "prince_of_wales_island",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "Haydu family-owned lodge on Port St. Nicholas near Craig (4 private apartment units for 3–18 guests, private un-mixed group boats) with published 2027 rates that include the $20/day Charter Halibut Stamp.",
    accommodation: {
      accommodationId: "accommodation:alaska-kingfisher-lodge-craig",
      propertyName: "Alaska's Kingfisher Lodge (Port St. Nicholas)",
      propertyKind: "remote_wilderness_lodge",
      actualLocationLabel: "Port St. Nicholas near Craig, Prince of Wales Island (8 miles from Klawock Airport)",
      streetOrPostalAddress: "P.O. Box 1043, Craig, AK 99921",
      gatewayPlaceId: "place:community:klawock",
      gatewayPublicPortSlug: "klawock",
      gatewayLabel: "Ketchikan (KTN) → Klawock (AKW) / Craig",
      communityPlaceId: "place:community:craig",
      coordinates: {
        latitude: 55.4667,
        longitude: -133.1167,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Port St. Nicholas / Craig outer-coast anchor on Prince of Wales Island.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Kingfisher Charters & Lodge, LLC (Haydu family) owns and operates the 4-unit Port St. Nicholas lodge, custom 32' × 11' aluminum boats, and reservations.",
      roomAndCabinSummary:
        "4 private apartment-style units (>4,500 sq ft total) accommodating 3 to 18 total lodge guests; each unit has a living room, stocked private kitchen, private dining room, double bedrooms, and private bathrooms (200 ft from private boat dock).",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "yes",
      mealProvisionSummary:
        "Make-your-own stocked breakfast in your private unit kitchen (eggs, bacon, waffles, sweet breads), packed boat lunches, and chef-prepared dinners (incl. steak & Dungeness crab night + fresh catch) served in your private dining area.",
      maxConcurrentGuests: 18,
      groupSizeGuidanceNote:
        "Accommodates groups of 3 to 18 guests; groups are housed in their own private unit and never mixed with other parties on boats.",
      childrenAndYouthNote: "Family-run atmosphere; separate youth rate tiers not listed on /rates/.",
      documentedAccessibilityNote:
        "200-foot walk from lodging to private dock; 34-inch freeboard walk-around boats; specific ADA accommodations not disclosed.",
    },
    operatingCompany: {
      operatorId: "operator:alaska-kingfisher-lodge-craig",
      legalOrDisplayName: "Kingfisher Charters & Lodge, LLC (Craig)",
      existingLfseOperatorSlug: null,
      separateFromOperatorIds: ["operator:kingfisher-charters-sitka"],
      separationDisambiguationNote:
        "Strictly separate business in Craig, Prince of Wales Island (alaskakingfisherlodge.com, est. 1994 by the Haydu family) — never confuse with Kingfisher Charters & Lodge in Sitka (kingfishercharters.co) or Kingfisher Lodge in Montana.",
      officialWebsite: "https://alaskakingfisherlodge.com/",
      officialEmailDomain: "alaskakingfisherlodge.com",
      officialPhone: "(907) 826-3350",
      ownershipOrHistorySummary:
        "Built beginning in 1993 and family-operated since 1994 by Charles, Jeanette, and the Haydu family near Craig.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Kingfisher Charters & Lodge, LLC",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://alaskakingfisherlodge.com/rates/",
      primaryCtaLabel: "Check availability",
      bookingMechanismSummary: "Direct phone (907) 826-3350 or email info@alaskakingfisherlodge.com.",
    },
    partnerServices: [
      {
        serviceRole: "charter_or_commuter_air_carrier",
        providerName: "Island Air Express (Cessna Caravan) or Taquan Air (Beaver Floatplane)",
        existingLfseOperatorSlug: "taquan-air",
        arrangementType: "arranged_by_lodge_extra_or_pass_through",
        details:
          "~30-minute flight between Ketchikan (KTN) and Klawock (AKW) + 8-mile lodge van pickup; see flagged official conflict between /rates/ (airfare NOT included) and /how-to-get-here/ (included).",
        officialUrl: "https://alaskakingfisherlodge.com/how-to-get-here/",
      },
    ],
    packages: [
      {
        packageId: "pkg:alaska-kingfisher-craig:4n-3d-early-2027",
        lodgeSlug: "alaska-kingfisher-lodge-craig",
        packageName: "4 Nights Lodging / 3 Days Fishing — Early Summer (May 29 – July 13, 2027)",
        applicableSeason: "2027",
        applicableDatesLabel: "May 29 – July 13, 2027 ($3,550/pp for 6/boat · $3,750 for 5 · $3,950 for 4 · $4,550 for 3; Extra day +$1,200/pp)",
        nights: 4,
        fishingDays: 3,
        durationSummaryLabel: "4 nights / 3 fishing days (up to 10 hrs/day on water)",
        occupancyAndSharingBasis: "Shown at 4 guests per private group boat ($3,950/pp); groups are never mixed",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 3950,
        priceDisplayLabel: "$3,950 / person (4/boat · May 29–Jul 13, 2027)",
        taxTreatment: "unknown",
        taxDetailNote: "Confirm local Craig/Klawock tax treatment when booking.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Contact (907) 826-3350 or info@alaskakingfisherlodge.com for 2027 dates.",
        verifiedInclusions: [
          "4 nights in a private group apartment unit + 8-mile van transfer from Klawock",
          "Stocked self-serve breakfast kitchen, boat lunches, private-dining dinners, water & soft drinks",
          "3 days guided fishing (up to 10 hours/day, private boat for your group) with rain gear, boots, tackle & bait",
          "2026+ Charter Halibut Stamp ($20/day) explicitly included",
          "Filleting, vacuum packing, walk-in freezing, and 2 airline-approved waxed fish boxes per guest",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Round-trip Ketchikan (KTN) ↔ Klawock (AKW) Airfare (Conflicting Official Pages!)",
            chargeStatus: "conflicting_official_pages_confirm",
            publishedAmountNote: null,
            scopeAndRuleNote:
              "CONFLICT FLAGGED: /rates/ ('2027 Rates') explicitly states 'Airfare from KIA not included in this price' (Island Air Express), whereas /how-to-get-here/ states 'Transportation to and from Ketchikan is provided in the package price'. Confirm current 2027 policy before booking.",
            sourceUrl: "https://alaskakingfisherlodge.com/rates/",
          },
          {
            itemLabel: "ADF&G Fishing License, King Salmon Stamps, Alcohol & Gratuities",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: "Customary crew gratuity noted at ~15% of package price",
            scopeAndRuleNote: "Explicitly listed under 'Not Included' on /rates/.",
            sourceUrl: "https://alaskakingfisherlodge.com/rates/",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://alaskakingfisherlodge.com/rates/",
        sourceUrl: "https://alaskakingfisherlodge.com/rates/",
        retrievedAt: RETRIEVED_DATE,
      },
      {
        packageId: "pkg:alaska-kingfisher-craig:4n-3d-peak-2027",
        lodgeSlug: "alaska-kingfisher-lodge-craig",
        packageName: "4 Nights Lodging / 3 Days Fishing — Peak Coho & King (July 14 – Sep 4, 2027)",
        applicableSeason: "2027",
        applicableDatesLabel: "July 14 – September 4, 2027 ($3,850/pp for 6/boat · $4,050 for 5 · $4,250 for 4 · $4,850 for 3; Extra full day +$1,200/pp, half day +$900/pp)",
        nights: 4,
        fishingDays: 3,
        durationSummaryLabel: "4 nights / 3 fishing days (add extra day for +$1,200/pp)",
        occupancyAndSharingBasis: "Shown at 4 guests per private group boat ($4,250/pp); un-mixed private boat",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 4250,
        priceDisplayLabel: "$4,250 / person (4/boat · Jul 14–Sep 4, 2027)",
        taxTreatment: "unknown",
        taxDetailNote: "Confirm local tax treatment when booking.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Contact (907) 826-3350 for July–September 2027 dates.",
        verifiedInclusions: [
          "Private group apartment unit, all meals/soft drinks, up to 10h/day un-mixed guided fishing, rain gear/boots/tackle/bait, $20/day Halibut Stamp, vacuum packing & 2 waxed fish boxes",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "KTN ↔ Klawock airfare (confirm /rates/ vs. /how-to-get-here/ conflict), AK license, King stamps, alcohol & ~15% tips",
            chargeStatus: "conflicting_official_pages_confirm",
            publishedAmountNote: "Extra full fishing day +$1,200/person; half day +$900/person",
            scopeAndRuleNote: "Confirm 2027 KTN–AKW flight charge directly with Jeanette / Haydu family.",
            sourceUrl: "https://alaskakingfisherlodge.com/rates/",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://alaskakingfisherlodge.com/rates/",
        sourceUrl: "https://alaskakingfisherlodge.com/rates/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary:
        "Custom 32' × 11' welded-aluminum walk-around offshore boats (twin 250hp 4-stroke outboards, heated cabin, air-ride seating, marine head, up to 6 anglers, groups never mixed).",
      targetSpeciesSummary: "King salmon, silver (coho) salmon, Pacific halibut, lingcod, and pelagic rockfish.",
      seasonalRunNote: "Published 2027 season May 29 – September 4.",
      fishProcessingAndBoxesSummary:
        "Immediate filleting, vacuum packing, walk-in freezing, and 2 airline-approved waxed fish boxes per guest included.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Charter Halibut Stamp ($20/day starting 2026)",
          applicableActivityAndDateScope: "2026–2027 guided halibut fishing",
          provisionStatus: "included_in_published_package",
          detail: "Explicitly included in package price on /rates/.",
          sourceUrl: "https://alaskakingfisherlodge.com/rates/",
        },
        {
          requirementName: "ADF&G Sportfishing License & King Salmon Stamp",
          applicableActivityAndDateScope: "All anglers",
          provisionStatus: "extra_charge_quote_required",
          detail: "Excluded from package price; purchase online prior to arrival.",
          sourceUrl: "https://alaskakingfisherlodge.com/rates/",
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:alaska-kingfisher-craig:1",
        gatewayAirportIata: "AKW",
        gatewayPlaceId: "place:community:klawock",
        gatewayPortSlug: "klawock",
        legTitle: "Ketchikan (KTN) ↔ Klawock (AKW) Air or IFA Ferry + 8-Mile Lodge Van",
        transferMode: "wheeled_commuter_aircraft",
        carrierOrDockName: "Island Air Express (Cessna Caravan) or Taquan Air (Beaver floatplane) + Lodge Van",
        durationLabel: "~30-minute flight from KTN + 8-mile van drive to Port St. Nicholas",
        provisionStatus: "conflicting_official_pages_confirm",
        transportOperationState: "conflicting_official_transfer_pages",
        publishedTransferRateNote:
          "CONFLICT: /rates/ ('2027 Rates') says KTN–AKW airfare is NOT included; /how-to-get-here/ says Ketchikan transport IS included — verify with lodge.",
        scopedBaggageAndFreightRule: {
          disclosed: false,
          ruleSummary: "Exact Island Air Express / Taquan Air personal bag weight cap not stated on lodge pages (rates note airlines allow 1 carry-on + 2 fish boxes on mainline return).",
          applicableServiceScope: "KTN ↔ AKW commuter flight & mainline return",
          sourceUrl: "https://alaskakingfisherlodge.com/rates/",
        },
        reportingAndOvernightBufferNote: "Lodge coordinates Klawock flight booking upon reservation unless guest requests Inter-Island Ferry (IFA).",
        sourceUrl: "https://alaskakingfisherlodge.com/how-to-get-here/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Kayaks or non-fishing gear are not documented on retrieved pages.",
      },
      guidedNonFishingExcursions: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Dedicated outer-coast offshore fishing program (up to 10 hours/day on the water).",
      },
      simultaneousNonAnglerActivitiesProven: "no",
      simultaneousNonAnglerExplanation:
        "Pricing is structured per angler per boat (3 to 6 guests/boat); Klawock Totem Park is a nearby road stop on Prince of Wales Island.",
      contextualEcosystemLinks: [
        {
          label: "Klawock & Prince of Wales Island Totem Heritage",
          href: "/ports/klawock",
          surface: "lfse",
          relationshipNote: "Explore Klawock Totem Park just north of Craig on Prince of Wales Island.",
        },
        {
          label: "Taquan Air Operator Profile (Ketchikan Floatplane Hub)",
          href: "/operators/taquan-air",
          surface: "lfse",
          relationshipNote: "Verified LFSE profile for Taquan Air, one of the KTN floatplane carriers named by the lodge.",
        },
        {
          label: "Ketchikan Gateway Guide",
          href: "/ports/ketchikan",
          surface: "lfse",
          relationshipNote: "Plan Ketchikan arrival/departure logistics.",
        },
      ],
    },
    visualRepresentation: {
      imagePath: "/images/alaska/native-culture-totem.jpg",
      imageAlt: "Coastal totem heritage in southern Southeast Alaska",
      imageCredit: "CC BY 3.0 · Jerzy Strzelecki",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "AKL-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "2027 Season (May 29 – Sep 4, 2027)",
        claimSummary:
          "Publishes 2027 4N/3D rates by boat occupancy ($3,550–$4,550 early; $3,850–$4,850 peak), +$1,200 extra day, included $20/day Halibut Stamp (2026+), un-mixed private boats, and states KIA airfare is not included.",
        source: createOfficialCitation("Alaska's Kingfisher Lodge — 2027 Rates", "https://alaskakingfisherlodge.com/rates/"),
        unresolvedOrConflictNote: "Conflicts with /how-to-get-here/ regarding whether KTN–Klawock airfare is included.",
      },
      {
        claimId: "AKL-02",
        scope: "access_and_baggage",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents ~30-minute Island Air Express (Caravan) or Taquan Air (Beaver) flights from KTN plus IFA ferry alternative, but states Ketchikan transport is included (conflicting with /rates/).",
        source: createOfficialCitation("Alaska's Kingfisher Lodge — How To Get Here", "https://alaskakingfisherlodge.com/how-to-get-here/"),
        unresolvedOrConflictNote: "Confirm 2027 KTN–AKW airfare inclusion directly with lodge.",
      },
      {
        claimId: "AKL-03",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms 4 private apartment units accommodating 3–18 guests with stocked kitchens, private bathrooms, and private dining rooms, plus custom 32' × 11' offshore vessels.",
        source: createOfficialCitation("Alaska's Kingfisher Lodge — The Lodge", "https://alaskakingfisherlodge.com/lodge/"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Verify directly with Jeanette / Haydu family whether 2027 packages exclude KTN ↔ Klawock flights (as stated on /rates/) or include them (as stated on /how-to-get-here/).",
      "Confirm Island Air Express baggage weight limits if carrying 2 waxed fish boxes back to KTN.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 11. CLOVER PASS RESORT (Clover Passage — Gateway: Ketchikan)
  // =========================================================================
  {
    lodgeId: "lodge:clover-pass-resort",
    slug: "clover-pass-resort",
    displayName: "Clover Pass Resort",
    subRegion: "ketchikan_revillagigedo_behm_canal",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "self_guided_or_hybrid_lodge",
    headlineSummary:
      "Road-accessible Ketchikan fishing resort (since 1951) with tax-included custom nightly packages (~$465/night self-guided skiff or ~$550/day guided add-on) and zero minimum stay.",
    accommodation: {
      accommodationId: "accommodation:clover-pass-resort",
      propertyName: "Clover Pass Resort",
      propertyKind: "road_accessible_fishing_resort",
      actualLocationLabel: "Clover Passage, North of Ketchikan (Revillagigedo Island road system)",
      streetOrPostalAddress: null,
      gatewayPlaceId: "place:community:ketchikan",
      gatewayPublicPortSlug: "ketchikan",
      gatewayLabel: "Ketchikan (KTN)",
      communityPlaceId: "place:community:ketchikan",
      coordinates: {
        latitude: 55.4739,
        longitude: -131.7944,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Clover Passage marina anchor north of Ketchikan.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Clover Pass Resort (footer copyright 'ASE Resorts') sells custom guided and self-guided stays directly. Note: while a toll-free reservation line is shared with another Ketchikan lodge, shared contact numbers alone do not establish common legal ownership.",
      roomAndCabinSummary:
        "Resort lodging included in nightly package rates; specific room/cabin layouts and bathroom configurations were not retrievable on 2026-11-19 because /the-lodges/ returned HTTP 404.",
      bathroomConfiguration: "unknown",
      guestKitchenOrSelfCaterAccess: "unknown",
      mealProvisionSummary: "All meals are included in package rates (alcoholic beverages excluded).",
      maxConcurrentGuests: null,
      groupSizeGuidanceNote: "No minimum or maximum length of stay; custom party quotes via 888-564-4525 or 907-247-2234.",
      childrenAndYouthNote: "Not disclosed on retrieved /rates/ page.",
      documentedAccessibilityNote: "Not disclosed on retrieved pages — confirm lodge room entry and marina dock ramp by phone.",
    },
    operatingCompany: {
      operatorId: "operator:clover-pass-resort",
      legalOrDisplayName: "Clover Pass Resort (ASE Resorts footer)",
      existingLfseOperatorSlug: null,
      separationDisambiguationNote:
        "Shares toll-free reservation line 888-564-4525 and 'ASE Resorts' footer template with The Cedars Lodge; shared contact numbers or site templates alone never establish common corporate ownership.",
      officialWebsite: "https://cloverpassresort.com/",
      officialEmailDomain: "cloverpassresort.com",
      officialPhone: "(907) 247-2234",
      ownershipOrHistorySummary:
        "Meta description notes operation since 1951; site footer displays 'Copyright 2026 | ASE Resorts'. No broader corporate ownership assertions made beyond retrieved text.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Clover Pass Resort Reservations",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://cloverpassresort.com/rates/",
      primaryCtaLabel: "Request a quote",
      bookingMechanismSummary:
        "Custom length-of-stay packages quoted by phone at 907-247-2234 / 888-564-4525 or online custom-package form.",
    },
    partnerServices: [],
    packages: [
      {
        packageId: "pkg:clover-pass-resort:self-guided-custom-nightly",
        lodgeSlug: "clover-pass-resort",
        packageName: "Custom Self-Guided Skiff, Lodging & Meals Package (No Min Stay)",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel: "Choose any number of days and nights (upgrade to 20' covered boat or add guided days at ~$550/pp/day)",
        nights: 1,
        fishingDays: 1,
        durationSummaryLabel: "Per night (no minimum or maximum stay)",
        occupancyAndSharingBasis: "Per person, per night (confirm exact occupancy basis on custom quote)",
        priceState: "published_starting_from_rate",
        priceAmountUsd: 465,
        priceDisplayLabel: "~$465 / person / night (local & state taxes included)",
        taxTreatment: "tax_included",
        taxDetailNote: "Official /rates/ explicitly includes 'Local and state bed and sales taxes'.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Call 907-247-2234 or 888-564-4525 for custom dates.",
        verifiedInclusions: [
          "Transportation between Ketchikan International Airport (KTN) and Clover Pass Resort",
          "Lodging, all meals, and local & state bed and sales taxes",
          "14' Livingston skiff (option to upgrade to 20' covered boat) + local-waters e-class orientation",
          "All bait, tackle, and rain gear",
          "Filleting, vacuum packaging, and boxing of entire catch",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Optional Guided Fishing Days or 20' Covered Boat Upgrade",
            chargeStatus: "published_rate_separate",
            publishedAmountNote: "Guided fishing typically ~$550 / person / day (general custom packages noted from $495/night)",
            scopeAndRuleNote: "Guests frequently book a guide for Day 1–2 and fish self-guided on remaining days.",
            sourceUrl: "https://cloverpassresort.com/rates/",
          },
          {
            itemLabel: "ADF&G Fishing Licenses, Alcoholic Beverages & Gratuities",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Explicitly listed under 'Rates Do Not Include' on /rates/.",
            sourceUrl: "https://cloverpassresort.com/rates/",
          },
        ],
        ctaLabel: "Request a quote",
        ctaUrl: "https://cloverpassresort.com/rates/",
        sourceUrl: "https://cloverpassresort.com/rates/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater"],
      guidingMode: "hybrid_guided_and_self_guided",
      vesselsAndEquipmentSummary:
        "14' Livingston skiff with e-class orientation included in self-guided stays; optional upgrade to 20' covered boat or full-day guided charters (~$550/pp/day); bait, tackle, and rain gear included.",
      targetSpeciesSummary: "Ketchikan salmon and halibut.",
      seasonalRunNote: "Summer season — confirm exact opening/closing months by phone.",
      fishProcessingAndBoxesSummary: "Filleting, vacuum packaging, and boxing of entire catch included.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Sportfishing License & Applicable Stamps",
          applicableActivityAndDateScope: "Guided and self-guided anglers (note: unguided skiff days vs. guided charter days follow different halibut bag rules)",
          provisionStatus: "extra_charge_quote_required",
          detail: "Fishing licenses excluded; confirm Charter Halibut Stamp handling if adding guided days.",
          sourceUrl: "https://cloverpassresort.com/rates/",
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:clover-pass-resort:1",
        gatewayAirportIata: "KTN",
        gatewayPlaceId: "place:community:ketchikan",
        gatewayPortSlug: "ketchikan",
        legTitle: "Ketchikan International Airport (KTN) ↔ Clover Pass Resort Ground/Airport Transfer",
        transferMode: "road_or_courtesy_van",
        carrierOrDockName: "Included Resort Transfer from KTN (airport ferry + North Tongass Hwy)",
        durationLabel: "Road-system transfer north of Ketchikan (no floatplane required)",
        provisionStatus: "included_in_published_package",
        transportOperationState: "road_or_local_courtesy_shuttle",
        publishedTransferRateNote: "Included in all package rates.",
        scopedBaggageAndFreightRule: {
          disclosed: false,
          ruleSummary: "Standard commercial airline baggage limits apply (no small-aircraft floatplane weight bottleneck).",
          applicableServiceScope: "KTN ground transfer",
          sourceUrl: "https://cloverpassresort.com/rates/",
        },
        reportingAndOvernightBufferNote: "Confirm KTN airport ferry pickup coordination when submitting flight times.",
        sourceUrl: "https://cloverpassresort.com/rates/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Kayaks are not listed on retrieved pages.",
      },
      guidedNonFishingExcursions: {
        status: "not_disclosed_on_retrieved_source",
        summary:
          "Because Clover Pass sits on Ketchikan's road system with flexible custom stay lengths, non-anglers can access independent Ketchikan Misty Fjords and cultural tours.",
      },
      simultaneousNonAnglerActivitiesProven: "unknown",
      simultaneousNonAnglerExplanation:
        "Confirm whether non-fishing companions can book lodging+meals without the skiff/guide component while anglers fish.",
      contextualEcosystemLinks: [
        {
          label: "Ketchikan Port, Misty Fjords & Totem Excursions",
          href: "/ports/ketchikan",
          surface: "lfse",
          relationshipNote: "Road-connected Ketchikan excursions (Taquan Air, Allen Marine, Cape Fox Tours) for non-fishing days.",
        },
        {
          label: "Saxman Native Village & Cultural Tours",
          href: "/ports/ketchikan/cultural-and-totem-tours",
          surface: "lfse",
          relationshipNote: "Verified local cultural tours accessible on Ketchikan's road system.",
        },
      ],
    },
    visualRepresentation: {
      imagePath: "/images/alaska/ketchikan-creek-street.jpg",
      imageAlt: "Waterfront boardwalk and coastal spruce forest in Ketchikan, Alaska",
      imageCredit: "CC BY-SA 4.0 · Diego Delso",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "CPR-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Publishes custom nightly packages with no min/max stay (~$465/pp/nt self-guided 14' skiff, starting at $495/nt custom, ~$550/pp/day guided), including KTN transfers, all meals, processing/boxing, and local/state taxes.",
        source: createOfficialCitation("Clover Pass Resort — Custom Fishing Package Rates", "https://cloverpassresort.com/rates/"),
      },
      {
        claimId: "CPR-02",
        scope: "identity_and_roles",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary: "Confirms Clover Pass Resort operation since 1951 in Ketchikan and direct line 907-247-2234.",
        source: createOfficialCitation("Clover Pass Resort — Official Homepage", "https://cloverpassresort.com/"),
      },
      {
        claimId: "CPR-03",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Verified that /the-lodges/ link in site menu returned 404 on 2026-11-19 (with 'ASE Resorts' footer); room/bathroom specifics kept explicitly 'unknown' pending direct confirmation.",
        source: createOfficialCitation("Clover Pass Resort — Rates & Included Lodging", "https://cloverpassresort.com/rates/"),
        unresolvedOrConflictNote: "/the-lodges/ and /our-story/ menu links returned HTTP 404 on 2026-11-19.",
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Confirm 2027 nightly rates, 20' covered boat upgrade fee, and room/bathroom configuration directly (since /the-lodges/ was 404 on retrieval).",
      "Ask whether non-angling companions qualify for a lodging-and-meals-only nightly rate.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 12. YES BAY LODGE (Yes Bay / Behm Canal — Gateway: Ketchikan)
  // =========================================================================
  {
    lodgeId: "lodge:yes-bay-lodge",
    slug: "yes-bay-lodge",
    displayName: "Yes Bay Lodge",
    subRegion: "ketchikan_revillagigedo_behm_canal",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "Fly-in Tongass National Forest fishing lodge north of Ketchikan offering guided saltwater and freshwater fishing, eco-tours, guided rainforest hikes, and watersports (pricing by direct quote).",
    accommodation: {
      accommodationId: "accommodation:yes-bay-lodge",
      propertyName: "Yes Bay Lodge",
      propertyKind: "remote_wilderness_lodge",
      actualLocationLabel: "Yes Bay, Tongass National Forest (Behm Canal north of Ketchikan)",
      streetOrPostalAddress: null,
      gatewayPlaceId: "place:community:ketchikan",
      gatewayPublicPortSlug: "ketchikan",
      gatewayLabel: "Ketchikan (KTN)",
      communityPlaceId: null,
      coordinates: {
        latitude: 55.9156,
        longitude: -131.7972,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Yes Bay / West Behm Canal anchor in Tongass National Forest.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation: "Yes Bay Lodge operates the remote lodge, vessels, and direct booking inquiries.",
      roomAndCabinSummary: "All-inclusive lodge accommodations; exact room counts and bathroom configurations are not detailed in retrieved HTML.",
      bathroomConfiguration: "unknown",
      guestKitchenOrSelfCaterAccess: "unknown",
      mealProvisionSummary: "All-inclusive culinary program referenced on /all-inclusive/.",
      maxConcurrentGuests: null,
      groupSizeGuidanceNote: "Supports individual bookings and group events (confirm boat party size and lodge capacity by phone).",
      childrenAndYouthNote: "Not disclosed on retrieved pages.",
      documentedAccessibilityNote: "Seaplane-accessed Tongass lodge; mobility details not disclosed on retrieved pages.",
    },
    operatingCompany: {
      operatorId: "operator:yes-bay-lodge",
      legalOrDisplayName: "Yes Bay Lodge",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://yesbay.com/",
      officialEmailDomain: "yesbay.com",
      officialPhone: "(907) 617-6841",
      ownershipOrHistorySummary: "Long-operating remote fishing lodge in Yes Bay within the Tongass National Forest.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Yes Bay Lodge",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://yesbay.com/all-inclusive/",
      primaryCtaLabel: "Request a quote",
      bookingMechanismSummary: "Direct 'Book Now' inquiry portal or phone call at 907-617-6841.",
    },
    partnerServices: [],
    packages: [
      {
        packageId: "pkg:yes-bay-lodge:all-inclusive-custom",
        lodgeSlug: "yes-bay-lodge",
        packageName: "All-Inclusive Saltwater & Freshwater Fishing Stay",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel: "Summer season (package lengths and 2027 dollar rates provided by quote)",
        nights: null,
        fishingDays: null,
        durationSummaryLabel: "Multi-day stay (confirm nights & fishing days on quote)",
        occupancyAndSharingBasis: "Homepage meta notes personalized guides and private boats; confirm exact boat/room occupancy on quote",
        priceState: "quote_required",
        priceAmountUsd: null,
        priceDisplayLabel: "Request a quote · (907) 617-6841",
        taxTreatment: "unknown",
        taxDetailNote: "Confirm taxes, seaplane inclusion, and license/stamp handling on itemized quote.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Call 907-617-6841 to verify open 2027 dates.",
        verifiedInclusions: [
          "Lodge accommodations and meals",
          "Guided saltwater & freshwater fishing (10 minutes from bay's mouth per homepage meta)",
          "Use of rain gear and rubber boots (explicitly confirmed on /lodge-guests/)",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Package tariff, seaplane transfer terms, ADF&G licenses/stamps & gratuities",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Retrieved pages do not publish dollar rates inline — request written package sheet.",
            sourceUrl: "https://yesbay.com/all-inclusive/",
          },
        ],
        ctaLabel: "Request a quote",
        ctaUrl: "https://yesbay.com/all-inclusive/",
        sourceUrl: "https://yesbay.com/all-inclusive/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater", "freshwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary: "Guided saltwater and freshwater fishing with rain gear and rubber boots included.",
      targetSpeciesSummary: "Salmon and Pacific halibut.",
      seasonalRunNote: "Summer operating season (50°F–75°F packing guidance on /lodge-guests/).",
      fishProcessingAndBoxesSummary:
        "Guest planning guide (/lodge-guests/) advises packing light because guests typically fly home with a 25–50 lb airline-approved wet-lock fish box.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Sportfishing License & Stamps",
          applicableActivityAndDateScope: "Saltwater & freshwater fishing",
          provisionStatus: "unknown",
          detail: "Confirm license and stamp handling with lodge.",
          sourceUrl: null,
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:yes-bay-lodge:1",
        gatewayAirportIata: "KTN",
        gatewayPlaceId: "place:community:ketchikan",
        gatewayPortSlug: "ketchikan",
        legTitle: "Ketchikan (KTN) ↔ Yes Bay Seaplane Transfer",
        transferMode: "charter_or_scheduled_floatplane",
        carrierOrDockName: "Seaplane transfer from Ketchikan (dedicated /seaplane-2/ menu item)",
        durationLabel: "Seaplane flight north of Ketchikan to Yes Bay",
        provisionStatus: "unknown",
        transportOperationState: "lodge_operated_or_chartered_transfer",
        publishedTransferRateNote: "Confirm whether round-trip Ketchikan seaplane transfer is bundled in all package tiers.",
        scopedBaggageAndFreightRule: {
          disclosed: true,
          ruleSummary: "Official /lodge-guests/ guide recommends keeping luggage to one small suitcase/duffel bag alongside a 25–50 lb wet-lock fish box.",
          applicableServiceScope: "Seaplane & return airline travel",
          sourceUrl: "https://yesbay.com/lodge-guests/",
        },
        reportingAndOvernightBufferNote: "Confirm KTN arrival timing for seaplane transfer.",
        sourceUrl: "https://yesbay.com/lodge-guests/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "documented_on_official_site",
        summary: "Site navigation includes dedicated Watersports, Guided Hikes, and Eco-Tours sections.",
      },
      guidedNonFishingExcursions: {
        status: "custom_boat_wildlife_or_glacier_options",
        summary: "Official /eco-tours/ highlights Tongass rainforest hikes, wildlife, birding, and watersports.",
      },
      simultaneousNonAnglerActivitiesProven: "unknown",
      simultaneousNonAnglerExplanation:
        "Eco-tours, guided hikes, and watersports are offered, but confirm whether non-anglers have dedicated daily guides while companions fish.",
      contextualEcosystemLinks: [
        {
          label: "Ketchikan Gateway & Misty Fjords Guide",
          href: "/ports/ketchikan",
          surface: "lfse",
          relationshipNote: "Coordinate Ketchikan gateway stays and floatplane sightseeing.",
        },
      ],
    },
    visualRepresentation: {
      imagePath: "/images/alaska/wildlife-bear.jpg",
      imageAlt: "Coastal black bear along Tongass National Forest shoreline in Southeast Alaska",
      imageCredit: "Public domain · U.S. Forest Service",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "YBL-01",
        scope: "identity_and_roles",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary: "Confirms all-inclusive saltwater & freshwater fishing positioning in Yes Bay (907-617-6841).",
        source: createOfficialCitation("Yes Bay Lodge — Homepage", "https://yesbay.com/"),
      },
      {
        claimId: "YBL-02",
        scope: "access_and_baggage",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms rain gear & rubber boots are included in package price, recommends one small duffel bag, and notes typical 25–50 lb airline-approved wet-lock fish box.",
        source: createOfficialCitation("Yes Bay Lodge — Vacation Planning Guide", "https://yesbay.com/lodge-guests/"),
      },
      {
        claimId: "YBL-03",
        scope: "non_fishing_options",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary: "Documents Tongass National Forest setting alongside Eco-Tours, Guided Hikes, and Watersports offerings.",
        source: createOfficialCitation("Yes Bay Lodge — Eco-Tours", "https://yesbay.com/eco-tours/"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Request current 2027 package rates, night/day durations, and written inclusions (including seaplane transfer & fish box count).",
      "Confirm room/bathroom layout and private-boat assignment for a group of 4.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 13. BARANOF WILDERNESS LODGE (Warm Springs Bay — Gateway: Sitka & Juneau)
  // =========================================================================
  {
    lodgeId: "lodge:baranof-wilderness-lodge",
    slug: "baranof-wilderness-lodge",
    displayName: "Baranof Wilderness Lodge",
    subRegion: "sitka_baranof_island",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "all_inclusive_guided_lodge",
    headlineSummary:
      "Hydro-powered Warm Springs Bay lodge on eastern Baranof Island (Mike & Sally Trotter) featuring natural waterfall hot springs, a staff Marine Biologist Wildlife Program, and published 5-night packages including Juneau/Sitka floatplane transfers.",
    accommodation: {
      accommodationId: "accommodation:baranof-wilderness-lodge",
      propertyName: "Baranof Wilderness Lodge (Warm Springs Bay) & Kelp Bay Base Camp",
      propertyKind: "remote_wilderness_lodge",
      actualLocationLabel: "Warm Springs Bay, East Side of Baranof Island (Chatham Strait)",
      streetOrPostalAddress: null,
      gatewayPlaceId: "place:community:sitka",
      gatewayPublicPortSlug: "sitka",
      gatewayLabel: "Sitka (SIT) & Juneau (JNU)",
      communityPlaceId: null,
      coordinates: {
        latitude: 57.0889,
        longitude: -134.8342,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Warm Springs Bay / Sadie Creek anchor on eastern Baranof Island.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Baranof Wilderness Lodge & Beyond Boundaries Expeditions (Mike & Sally Trotter) operate the Warm Springs Bay lodge and Kelp Bay Wilderness Base Camp under USFS Tongass National Forest Special Use Permit.",
      roomAndCabinSummary:
        "Guest cabins and lodge rooms with pine paneling, 24-hour Sadie Creek hydroelectricity, and private bathrooms (flush toilets, hot showers); redwood forest hot tub, deck hot tub, plus short hike to natural Warm Springs Bay hot-spring pools.",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "no",
      mealProvisionSummary:
        "Family-style gourmet meals, fresh bread/appetizers, wine list, and beer explicitly included in package rates.",
      maxConcurrentGuests: null,
      groupSizeGuidanceNote: "Monday and Saturday transfer days; total guest cap not stated on retrieved pages.",
      childrenAndYouthNote: "Official /our-wildlife-program/ highlights Naturalist outings 'for nature buffs and children of all ages'.",
      documentedAccessibilityNote:
        "Floatplane dock arrival and boardwalk forest trails; specific mobility accommodations not disclosed on retrieved pages.",
    },
    operatingCompany: {
      operatorId: "operator:baranof-wilderness-lodge",
      legalOrDisplayName: "Baranof Wilderness Lodge & Beyond Boundaries Expeditions",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://flyfishalaska.com/",
      officialEmailDomain: "flyfishalaska.com",
      officialPhone: "(907) 738-9039",
      ownershipOrHistorySummary:
        "Operated by Mike and Sally Trotter (three decades in Alaska outfitting) under USFS Tongass National Forest Special Use Permit.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Baranof Wilderness Lodge",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://flyfishalaska.com/baranof-wilderness-lodge-rates/",
      primaryCtaLabel: "Check availability",
      bookingMechanismSummary: "Direct phone reservations at (907) 738-9039 or online contact form (Monday & Saturday transfer days).",
    },
    partnerServices: [],
    packages: [
      {
        packageId: "pkg:baranof-wilderness-lodge:5n-peak",
        lodgeSlug: "baranof-wilderness-lodge",
        packageName: "Warm Springs Bay Lodge — 5.5 Days / 5 Nights All-Inclusive",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel:
          "May – October (Peak summer $7,850/pp; May Kings & Sep 12–Oct Silvers $7,350/pp; Kelp Bay Base Camp Jun–Sep $7,350/pp — all +6% Sitka sales tax; Mon/Sat transfers)",
        nights: 5,
        fishingDays: 5,
        durationSummaryLabel: "5 nights / 5.5 days (Monday or Saturday transfer days)",
        occupancyAndSharingBasis: "Per person (confirm single-occupancy policy and boat party size by phone)",
        priceState: "published_undated_current_rate",
        priceAmountUsd: 7850,
        priceDisplayLabel: "$7,850 / person + 6% Sitka tax ($7,350 May/late-Sep)",
        taxTreatment: "plus_tax",
        taxDetailNote:
          "Published as '+6% City of Sitka Sales Tax' (municipal rents and user fees are stated as included).",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Call (907) 738-9039 to verify Monday/Saturday transfer openings.",
        verifiedInclusions: [
          "Round-trip air transportation between Juneau, Baranof (Warm Springs Bay), and Sitka",
          "5 nights private-bath cabin/lodge accommodations, hot tubs & access to natural Warm Springs Bay pools",
          "Gourmet family-style meals, appetizers, wine list, and beer",
          "Guided saltwater & freshwater fishing (24' Cuddy Cab cruisers & 16' skiffs) with fly/spin rods, tackle & bait",
          "Staff Biologist / Marine Educator Wildlife Program outings (kayaking, marine mammal cruises, lake hikes)",
          "Applicable municipal rents and user fees",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "6% City of Sitka Sales Tax",
            chargeStatus: "published_rate_separate",
            publishedAmountNote: "+6% City of Sitka Sales Tax (~$471 on $7,850 package)",
            scopeAndRuleNote: "Explicitly itemized on /baranof-wilderness-lodge-rates/.",
            sourceUrl: "https://flyfishalaska.com/baranof-wilderness-lodge-rates/",
          },
          {
            itemLabel: "ADF&G fishing license/stamps, fish box freight terms & gratuities",
            chargeStatus: "unknown_confirm_with_seller",
            publishedAmountNote: null,
            scopeAndRuleNote: "Confirm ADF&G license/stamp purchase, fish vacuum-pack/box pound limits, and crew gratuity guidance.",
            sourceUrl: "https://flyfishalaska.com/baranof-wilderness-lodge-rates/",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://flyfishalaska.com/baranof-wilderness-lodge-rates/",
        sourceUrl: "https://flyfishalaska.com/baranof-wilderness-lodge-rates/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater", "freshwater"],
      guidingMode: "guided_only",
      vesselsAndEquipmentSummary:
        "USCG-licensed 24-foot Cuddy Cab cruisers (GPS, sonar, Raytheon radar) and 16-foot aluminum skiffs, plus stream/lake walk-and-wade; all saltwater tackle/bait plus freshwater fly and spinning rods/custom flies provided.",
      targetSpeciesSummary:
        "All 5 Pacific salmon species, Pacific halibut, rockfish, Dolly Varden, cutthroat trout, and rainbow trout.",
      seasonalRunNote: "May – October season (May King & mid-Sep–Oct Silver specials).",
      fishProcessingAndBoxesSummary: "Confirm vacuum-packing and floatplane fish-box weight limits into Sitka/Juneau when booking.",
      scopedRequirements: [
        {
          requirementName: "ADF&G Sportfishing License & Applicable Stamps",
          applicableActivityAndDateScope: "May – October saltwater & freshwater fishing",
          provisionStatus: "unknown",
          detail: "Not itemized on /baranof-wilderness-lodge-rates/ — confirm prior to arrival.",
          sourceUrl: null,
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:baranof-wilderness-lodge:1",
        gatewayAirportIata: "SIT",
        gatewayPlaceId: "place:community:sitka",
        gatewayPortSlug: "sitka",
        legTitle: "Juneau (JNU) / Sitka (SIT) ↔ Warm Springs Bay Floatplane (Mon & Sat)",
        transferMode: "charter_or_scheduled_floatplane",
        carrierOrDockName: "Lodge-coordinated floatplane to Warm Springs Bay lodge dock",
        durationLabel: "Short scenic floatplane ride across Baranof Island from Sitka (or from Juneau)",
        provisionStatus: "included_in_published_package",
        transportOperationState: "lodge_operated_or_chartered_transfer",
        publishedTransferRateNote: "Round-trip transportation between Juneau, Baranof, and Sitka included (Monday & Saturday transfer days).",
        scopedBaggageAndFreightRule: {
          disclosed: false,
          ruleSummary: "Floatplane personal luggage and fish-box weight limits not disclosed on retrieved pages — confirm before travel.",
          applicableServiceScope: "Juneau / Sitka ↔ Warm Springs Bay floatplane leg",
          sourceUrl: "https://flyfishalaska.com/baranof-wilderness-lodge-rates/",
        },
        reportingAndOvernightBufferNote:
          "Because transfers run strictly on Mondays and Saturdays between Juneau, Baranof, and Sitka, lodge stays can bridge a Juneau-to-Sitka itinerary!",
        sourceUrl: "https://flyfishalaska.com/baranof-wilderness-lodge-rates/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "documented_on_official_site",
        summary: "Redwood & deck hot tubs, boardwalk trails to Baranof & Sadie Lakes, and natural Warm Springs Bay waterfall hot pools.",
      },
      guidedNonFishingExcursions: {
        status: "dedicated_lodge_naturalist_or_eco_program",
        summary:
          "Staff Biologist / Marine Educator leads half- and full-day outings: Yasha Island whale/sea-lion rookery cruises, guided tidepool kayaking, clamming/crabbing, and Sadie/Baranof Lake hikes.",
      },
      simultaneousNonAnglerActivitiesProven: "yes",
      simultaneousNonAnglerExplanation:
        "Official /our-lodge/ and /our-wildlife-program/ explicitly state guests pick their daily adventure (salt/fresh fishing or staff Marine Educator wildlife/kayak/hike outings).",
      contextualEcosystemLinks: [
        {
          label: "Sitka Port, Sound Wildlife & Local Operators",
          href: "/ports/sitka",
          surface: "lfse",
          relationshipNote: "Plan Sitka pre- or post-lodge wildlife, Raptor Center, and harbor days.",
        },
        {
          label: "Sitka Small-Boat & Catamaran Wildlife Cruises",
          href: "/ports/sitka/whale-and-wildlife-boat-tours",
          surface: "lfse",
          relationshipNote: "Compare Gallant Adventures and Allen Marine tours in Sitka Sound.",
        },
        ...JUNEAU_GATEWAY_ECOSYSTEM_LINKS.slice(0, 1),
      ],
    },
    visualRepresentation: {
      imagePath: "/images/alaska/rainforest-hiking.jpg",
      imageAlt: "Old-growth Tongass National Forest trail in Southeast Alaska",
      imageCredit: "Public domain · U.S. Forest Service",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "BWL-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19 (confirm 2027 tariff confirmation)",
        claimSummary:
          "Publishes 5.5D/5N rates ($7,850 peak; $7,350 May/late-Sep & Kelp Bay Base Camp) + 6% Sitka sales tax, Monday/Saturday transfers, included Juneau–Baranof–Sitka air transport, meals, wine, and beer.",
        source: createOfficialCitation("Baranof Wilderness Lodge — Rates", "https://flyfishalaska.com/baranof-wilderness-lodge-rates/"),
      },
      {
        claimId: "BWL-02",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms private-bath cabins/rooms, 24-hour Sadie Creek hydroelectricity, two hot tubs, and nearby natural Warm Springs Bay waterfall pools.",
        source: createOfficialCitation("Baranof Wilderness Lodge — Our Lodge", "https://flyfishalaska.com/our-lodge/"),
      },
      {
        claimId: "BWL-03",
        scope: "non_fishing_options",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents staff Biologist/Marine Educator program offering Yasha Island marine mammal cruises, tidepool kayaking, and lake boardwalk hikes.",
        source: createOfficialCitation("Baranof Wilderness Lodge — Wildlife Program", "https://flyfishalaska.com/our-wildlife-program/"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Confirm whether posted $7,850 / $7,350 + 6% Sitka tax rates apply unchanged for 2027 dates.",
      "Confirm floatplane baggage limits and fish vacuum-packing / box freight terms.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 14. FISH BARANOF — DIY BOAT RENTALS & LONGLINER LODGE PACKAGES (Sitka)
  //     (Explicit separation of Package Seller vs. Physical Accommodation!)
  // =========================================================================
  {
    lodgeId: "lodge:fish-baranof-sitka",
    slug: "fish-baranof-sitka",
    displayName: "Fish Baranof (with Longliner Lodge & Suites)",
    subRegion: "sitka_baranof_island",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "diy_boat_rental_with_lodging_partner",
    headlineSummary:
      "Self-guided Sitka saltwater boat-rental and custom package coordinator operating inside waterfront Longliner Lodge & Suites (485 Katlian St) for experienced boaters who want DIY 21-foot Hewescraft fishing and unguided halibut bag rules.",
    accommodation: {
      accommodationId: "accommodation:longliner-lodge-and-suites-sitka",
      propertyName: "Longliner Lodge & Suites",
      propertyKind: "waterfront_hotel_and_suites",
      actualLocationLabel: "Sitka Waterfront (8-min walk from downtown Sitka; 5-min drive from SIT Airport)",
      streetOrPostalAddress: "485 Katlian Street, Sitka, AK 99835",
      gatewayPlaceId: "place:community:sitka",
      gatewayPublicPortSlug: "sitka",
      gatewayLabel: "Sitka (SIT)",
      communityPlaceId: "place:community:sitka",
      coordinates: {
        latitude: 57.0531,
        longitude: -135.3412,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Katlian Street waterfront harbor corridor in Sitka.",
      },
      relationshipToPackageSeller: "common_individual_owner_documented_on_official_site",
      relationshipExplanation:
        "You book boats and custom stay packages through Fish Baranof (office at 485 Katlian St), while your room is at Longliner Lodge & Suites at the same waterfront address (Fish Baranof owner Joel Martin also owns Longliner Lodge & Suites).",
      roomAndCabinSummary:
        "14 year-round waterfront rooms and suites at Longliner Lodge & Suites (queen/queen, queen/twin, studio apartment with 3 queens + 1 twin + full kitchen + balcony, and 1,200 sq ft Master Suite); all rooms include fridge, microwave, coffee maker, and free laundry access.",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "yes",
      mealProvisionSummary:
        "Meals are NOT bundled by default: select suites include full kitchens, seasonal on-site Galley Restaurant & Bar is on property, and downtown Sitka restaurants are an 8-minute walk away.",
      maxConcurrentGuests: null,
      groupSizeGuidanceNote: "21-foot Hewescraft rental boats hold a strict maximum of 4 anglers per boat; hotel houses 14 rooms/suites.",
      childrenAndYouthNote: "Family suites available at Longliner Lodge; boat operators must have big-water boating skill and experience.",
      documentedAccessibilityNote:
        "In-town waterfront hotel with seasonal airport shuttle; room/dock ADA specifics not disclosed on retrieved pages.",
    },
    operatingCompany: {
      operatorId: "operator:fish-baranof",
      legalOrDisplayName: "Fish Baranof",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://fishbaranof.com/",
      officialEmailDomain: null,
      officialPhone: "(907) 738-9090",
      ownershipOrHistorySummary:
        "Sitka self-guided boat-rental operator owned by Joel Martin, who also acquired Longliner Lodge & Suites (485 Katlian St) per official homepage notice.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Fish Baranof (Joel Martin)",
      sellerRole: "boat_rental_and_package_coordinator",
      officialBookingOrInquiryUrl: "https://fishbaranof.com/sitka-boat-rentals/",
      primaryCtaLabel: "Request a quote",
      bookingMechanismSummary:
        "Contact Joel at 907-738-9090 or fishbaranof@gmail.com for custom boat + Longliner Lodge pricing ($500 non-refundable deposit by check; 50% due Jan 15; balance 60 days prior).",
    },
    partnerServices: [
      {
        serviceRole: "gateway_non_fishing_excursions",
        providerName: "Independent Sitka Sound Wildlife & Sea Otter Operators (e.g., Gallant Adventures / Allen Marine)",
        existingLfseOperatorSlug: "gallant-adventures",
        arrangementType: "contextual_gateway_option",
        details:
          "Because accommodations sit an 8-minute walk from downtown Sitka / Crescent Harbor, non-angling companions can independently book Sitka Sound wildlife cruises, Sitka National Historical Park walks, or the Alaska Raptor Center.",
        officialUrl: "https://www.lastfrontiershoreexcursions.com/ports/sitka",
      },
    ],
    packages: [
      {
        packageId: "pkg:fish-baranof:diy-21ft-hewescraft-lodging",
        lodgeSlug: "fish-baranof-sitka",
        packageName: "Custom Self-Guided 21' Hewescraft Boat Rental + Longliner Lodge Package",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel: "May – summer Sitka saltwater season (custom boat + lodging quotes by phone)",
        nights: null,
        fishingDays: null,
        durationSummaryLabel: "Custom multi-day boat rental + Longliner Lodge stay",
        occupancyAndSharingBasis: "Maximum 4 anglers per 21-foot Hewescraft boat; room type selected at Longliner Lodge & Suites",
        priceState: "quote_required",
        priceAmountUsd: null,
        priceDisplayLabel: "Request a quote · (907) 738-9090",
        taxTreatment: "plus_tax",
        taxDetailNote: "Official /sitka-boat-rentals/ explicitly states 'Sales tax is not included.'",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Contact Joel at 907-738-9090 for boat and Longliner room availability.",
        verifiedInclusions: [
          "21-foot Hewescraft rental boat (max 4 anglers) with downriggers, GPS, VHF, depth finder, charts & safety gear",
          "Fishing rods, reels, and base tackle for up to 4 anglers",
          "Waterfront room or kitchen suite at Longliner Lodge & Suites (when booked as a custom lodging package) + seasonal SIT airport shuttle",
          "Access to on-site fish processing facility at 485 Katlian St",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Boat Fuel Refill, Bait, Extra Tackle, Sales Tax & ADF&G Licenses",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote:
              "Explicitly excluded on /sitka-boat-rentals/: boats start full and MUST be returned with a full tank of fuel and before 4:00 p.m. daily unless authorized; bait, sales tax, airfare, and licenses are excluded.",
            sourceUrl: "https://fishbaranof.com/sitka-boat-rentals/",
          },
          {
            itemLabel: "Meals & Fish Processing / Box Fees",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Self-cater in Longliner kitchen suites or dine at seasonal Galley Restaurant / downtown Sitka; confirm per-pound processing/box fees.",
            sourceUrl: "https://fishbaranof.com/",
          },
        ],
        ctaLabel: "Request a quote",
        ctaUrl: "https://fishbaranof.com/sitka-boat-rentals/",
        sourceUrl: "https://fishbaranof.com/sitka-boat-rentals/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater"],
      guidingMode: "self_guided_boats",
      vesselsAndEquipmentSummary:
        "Self-guided 21-foot Hewescraft aluminum boats (max 4 anglers) equipped with GPS, depth finder, VHF, downriggers, safety gear, and rods/tackle for 4; boats must return before 4:00 p.m. daily unless authorized.",
      targetSpeciesSummary: "King and silver salmon, Pacific halibut, lingcod, pelagic rockfish (black/dusky), and deepwater black cod.",
      seasonalRunNote: "Season starts in May (king salmon & late-May halibut) through summer silver salmon.",
      fishProcessingAndBoxesSummary: "On-site fish processing at 485 Katlian St; confirm per-pound vacuum-pack and fish-box pricing on quote.",
      scopedRequirements: [
        {
          requirementName: "Big-Water Boat-Driving Experience & 4:00 p.m. Return Rule",
          applicableActivityAndDateScope: "All Fish Baranof self-guided boat rentals in Sitka Sound / open Pacific edge",
          provisionStatus: "arranged_separately_by_guest_or_group",
          detail: "Official rental terms require operator boating safety and big-water boat-handling experience.",
          sourceUrl: "https://fishbaranof.com/sitka-boat-rentals/",
        },
        {
          requirementName: "Unguided (Non-Charter) ADF&G / IPHC Halibut Retention Rules + Sport License",
          applicableActivityAndDateScope: "Self-guided (unguided) Sitka anglers — verify current-season ADF&G/IPHC rules",
          provisionStatus: "extra_charge_quote_required",
          detail:
            "Because rentals are unguided, anglers follow unguided sport halibut bag rules (historically 2/day any size, no charter reverse-slot or Monday charter closure) rather than charter rules; ADF&G license & King stamp required.",
          sourceUrl: "https://fishbaranof.com/alaska-boat-rentals/",
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:fish-baranof-sitka:1",
        gatewayAirportIata: "SIT",
        gatewayPlaceId: "place:community:sitka",
        gatewayPortSlug: "sitka",
        legTitle: "Sitka Rocky Gutierrez Airport (SIT) → Longliner Lodge & Suites (5-Min Drive)",
        transferMode: "road_or_courtesy_van",
        carrierOrDockName: "Longliner Lodge seasonal free airport shuttle or 5-minute taxi from SIT",
        durationLabel: "5-minute drive from SIT Airport; 8-minute walk to downtown Sitka",
        provisionStatus: "included_in_published_package",
        transportOperationState: "road_or_local_courtesy_shuttle",
        publishedTransferRateNote: "Seasonal complimentary SIT airport shuttle documented on /sitka-lodging/.",
        scopedBaggageAndFreightRule: {
          disclosed: false,
          ruleSummary: "Mainline Alaska Airlines jet service into SIT (standard airline checked-baggage rules for fish boxes; no floatplane transfer needed).",
          applicableServiceScope: "Alaska Airlines SIT jet service & hotel shuttle",
          sourceUrl: "https://fishbaranof.com/sitka-lodging/",
        },
        reportingAndOvernightBufferNote: "Direct jet access into SIT simplifies arrival and frozen fish-box departure.",
        sourceUrl: "https://fishbaranof.com/sitka-lodging/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Fish Baranof does not rent kayaks on retrieved pages.",
      },
      guidedNonFishingExcursions: {
        status: "not_disclosed_on_retrieved_source",
        summary:
          "Fish Baranof does not run guided non-fishing tours itself, but staying in-town at Longliner Lodge places non-anglers an 8-minute walk from downtown Sitka attractions and harbor wildlife boats.",
      },
      simultaneousNonAnglerActivitiesProven: "no",
      simultaneousNonAnglerExplanation:
        "Fish Baranof provides unguided fishing boats only (no lodge-operated non-angler tours); however, because Longliner Lodge is an 8-minute walk from downtown Sitka, companions can book independent Sitka Sound wildlife or kayaking operators separately.",
      contextualEcosystemLinks: [
        {
          label: "Sitka Port, Crescent Harbor & Wildlife Operators",
          href: "/ports/sitka",
          surface: "lfse",
          relationshipNote: "Independent Sitka Sound wildlife tours and town walks 8 minutes from Longliner Lodge.",
        },
        {
          label: "Gallant Adventures (6-Guest Sitka Sound Wildlife Profile)",
          href: "/operators/gallant-adventures",
          surface: "lfse",
          relationshipNote: "Verified local Sitka marine wildlife operator for non-angling companions.",
        },
        {
          label: "Allen Marine Sitka Sea Otter & Wildlife Quest",
          href: "/operators/allen-marine-tours",
          surface: "lfse",
          relationshipNote: "Expedition catamaran wildlife option in Sitka Sound.",
        },
      ],
    },
    visualRepresentation: {
      imagePath: "/images/alaska/sitka-sound.jpg",
      imageAlt: "Forested islands and mountain peaks across Sitka Sound, Alaska",
      imageCredit: "CC BY-SA 2.0 · David Baron",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "FB-01",
        scope: "identity_and_roles",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents that Fish Baranof's office moved inside Longliner Lodge & Suites (485 Katlian St) after Fish Baranof owner Joel Martin purchased Longliner Lodge & Suites.",
        source: createOfficialCitation("Fish Baranof — Official Homepage", "https://fishbaranof.com/"),
      },
      {
        claimId: "FB-02",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Details Longliner Lodge & Suites' 14 year-round rooms/suites, select full kitchens, seasonal free SIT airport shuttle, laundry, seasonal Galley Restaurant, and 8-min walk to downtown Sitka.",
        source: createOfficialCitation("Fish Baranof — Sitka Lodging (Longliner Lodge)", "https://fishbaranof.com/sitka-lodging/"),
      },
      {
        claimId: "FB-03",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents 21-ft Hewescraft rentals (max 4 anglers), $500 non-refundable check deposit, 4:00 p.m. daily boat return, full-tank fuel return rule, and exclusions (sales tax, airfare, bait, license).",
        source: createOfficialCitation("Fish Baranof — Sitka Boat Rentals", "https://fishbaranof.com/sitka-boat-rentals/"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Request itemized quote separating 21' Hewescraft boat-rental days, Longliner room/suite rate, and per-pound fish processing.",
      "Verify current-season ADF&G / IPHC Area 2C unguided halibut and king salmon bag limits prior to departure.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 15. ROCKY POINT RESORT (Wrangell Narrows / Mitkof Island — Gateway: Petersburg)
  // =========================================================================
  {
    lodgeId: "lodge:rocky-point-resort",
    slug: "rocky-point-resort",
    displayName: "Rocky Point Resort",
    subRegion: "petersburg_wrangell_narrows",
    stayFormat: "individual_rooms_or_cabins",
    operationArchetype: "self_guided_or_hybrid_lodge",
    headlineSummary:
      "Fourth-generation family-operated cabin resort on protected Wrangell Narrows near Petersburg with published 2026 packages ($930–$3,255/pp) including a 16' skiff with unlimited gas/bait, meals, transfers, and optional +$265/day guided charter upgrades.",
    accommodation: {
      accommodationId: "accommodation:rocky-point-resort",
      propertyName: "Rocky Point Resort",
      propertyKind: "cabin_resort",
      actualLocationLabel: "Midway down Wrangell Narrows (~1 mile from Blind River hatchery), Mitkof Island, Petersburg, AK",
      streetOrPostalAddress: "P.O. Box 1251, Petersburg, AK 99833",
      gatewayPlaceId: "place:community:petersburg",
      gatewayPublicPortSlug: "petersburg",
      gatewayLabel: "Petersburg (PSG)",
      communityPlaceId: "place:community:petersburg",
      coordinates: {
        latitude: 56.6625,
        longitude: -132.9417,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Blind Slough / Wrangell Narrows anchor on Mitkof Island south of Petersburg.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Rocky Point Resort (40 years in operation, 4th-generation family business) owns and operates the cabins, main dining lodge, 16' skiffs, 26'/32' charter vessels, and reservations.",
      roomAndCabinSummary:
        "Private 2-bedroom cabins (two bunks per bedroom, living room, oil heater, boot dryers, mini-fridge, covered porch) with private bathroom and unlimited on-demand hot water, Wi-Fi, and client laundry access.",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "no",
      mealProvisionSummary:
        "3 family-style meals daily in the main lodge (seafood, sourdough baking, Norwegian pastries) plus packed boat sandwiches and 24/7 cookies/coffee included.",
      maxConcurrentGuests: null,
      groupSizeGuidanceNote: "2-bedroom cabins hold 4 bunks each; fleet includes skiffs plus two 26' and three 32' enclosed charter boats.",
      childrenAndYouthNote: "Family-friendly environment; separate child discount not listed on /prices.",
      documentedAccessibilityNote:
        "Official homepage explicitly states the resort 'Is handicapped accessible' — confirm specific cabin ramp, dock slope, and skiff/cruiser boarding details with Mike or Jenny.",
    },
    operatingCompany: {
      operatorId: "operator:rocky-point-resort",
      legalOrDisplayName: "Rocky Point Resort",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://www.rockypointresortak.com/",
      officialEmailDomain: null,
      officialPhone: "(907) 518-0594",
      ownershipOrHistorySummary:
        "Locally family-owned and operated for 40 years on Wrangell Narrows (seasonal lodge phone May 31 – Sep 3: 907-772-4405; year-round cell: 907-518-0594).",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Rocky Point Resort (Mike & Jenny)",
      sellerRole: "direct_lodge_operator",
      officialBookingOrInquiryUrl: "https://www.rockypointresortak.com/prices",
      primaryCtaLabel: "Check availability",
      bookingMechanismSummary:
        "First-come, first-served via phone (907-518-0594 / 907-772-4405) or email fishhawk@ak.net (50% deposit holds space; 3% credit-card surcharge).",
    },
    partnerServices: [],
    packages: [
      {
        packageId: "pkg:rocky-point-resort:5n-6d-2026",
        lodgeSlug: "rocky-point-resort",
        packageName: "5 Nights / 6 Days Self-Guided Skiff Package (2026 Rate Scale)",
        applicableSeason: "2026",
        applicableDatesLabel:
          "May 31 – Sep 3 season (Full 2026 scale: 2N/3D $930 · 3N/4D $1,395 · 4N/5D $1,860 · 5N/6D $2,325 · 6N/7D $2,790 · 7N/8D $3,255 per person)",
        nights: 5,
        fishingDays: 6,
        durationSummaryLabel: "5 nights / 6 days (2N to 7N packages published)",
        occupancyAndSharingBasis: "Per person (cabins have 2 bedrooms / 4 bunks; confirm minimum cabin/skiff occupancy)",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 2325,
        priceDisplayLabel: "$2,325 / person + Petersburg tax (5N/6D · 2026 scale)",
        taxTreatment: "plus_tax",
        taxDetailNote:
          "Explicitly itemized on /prices: +6% sales tax on first $1,200 ($72 cap) + $4.88 per person per day bed tax (3% surcharge if paying by credit card).",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "First-come, first-served by phone (907-518-0594) or email.",
        verifiedInclusions: [
          "Round-trip transportation between Petersburg Airport (PSG) or AMHS Ferry Terminal and Rocky Point Resort",
          "Private 2-bedroom cabin with bathroom, boot dryers, Wi-Fi, and daily fresh towels",
          "3 meals daily plus snacks, Norwegian pastries, and packed boat lunches",
          "16-foot welded aluminum skiff (40hp 4-stroke Yamaha) with unlimited gas, bait, lures, and halibut/salmon rods + Day-1 orientation",
          "Rain gear and rubber boots",
          "Daily fish cleaning, wrapping, and -20°F walk-in blast freezing",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Optional Guided Charter Days, Covered Boat Upgrade & GAF Halibut Permits",
            chargeStatus: "published_rate_separate",
            publishedAmountNote:
              "Fully guided (26'/32' cabin cruiser): +$265/pp/day · Covered self-guided boat: $425–$450/boat/day · GAF halibut permit: $300/fish",
            scopeAndRuleNote: "Published on /prices and /boats_guides.",
            sourceUrl: "https://www.rockypointresortak.com/prices",
          },
          {
            itemLabel: "50 lb Fish Boxes, ADF&G License, King Stamp, Petersburg Tax & Air/Ferry to PSG",
            chargeStatus: "published_rate_separate",
            publishedAmountNote:
              "50# fish box: $10 uninsulated / $15 insulated · License ($20–$80) · King Stamp ($10–$50) · $72 max sales tax + $4.88/day bed tax",
            scopeAndRuleNote: "Explicitly itemized on /prices (confirm 2027 rate updates).",
            sourceUrl: "https://www.rockypointresortak.com/prices",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://www.rockypointresortak.com/prices",
        sourceUrl: "https://www.rockypointresortak.com/prices",
        retrievedAt: RETRIEVED_DATE,
      },
      {
        packageId: "pkg:rocky-point-resort:4n-5d-2026",
        lodgeSlug: "rocky-point-resort",
        packageName: "4 Nights / 5 Days Self-Guided Skiff Package (2026 Rate Scale)",
        applicableSeason: "2026",
        applicableDatesLabel: "May 31 – Sep 3 season (3N/4D also published at $1,395/pp)",
        nights: 4,
        fishingDays: 5,
        durationSummaryLabel: "4 nights / 5 days",
        occupancyAndSharingBasis: "Per person",
        priceState: "published_dated_season_rate",
        priceAmountUsd: 1860,
        priceDisplayLabel: "$1,860 / person + Petersburg tax (4N/5D · 2026 scale)",
        taxTreatment: "plus_tax",
        taxDetailNote: "+6% sales tax on first $1,200 ($72) + $4.88/pp/day bed tax.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Contact Mike or Jenny directly.",
        verifiedInclusions: [
          "PSG airport/ferry transfers, cabin, 3 meals/day, 16' skiff + unlimited fuel/bait/gear, rain gear/boots, daily processing & -20°F blast freezing",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Guided upgrade (+$265/pp/day), fish boxes ($10–$15), AK license/King stamp, tax & travel to Petersburg",
            chargeStatus: "published_rate_separate",
            publishedAmountNote: "See /prices itemization",
            scopeAndRuleNote: "Confirm 2027 rate sheet when booking.",
            sourceUrl: "https://www.rockypointresortak.com/prices",
          },
        ],
        ctaLabel: "Check availability",
        ctaUrl: "https://www.rockypointresortak.com/prices",
        sourceUrl: "https://www.rockypointresortak.com/prices",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater"],
      guidingMode: "hybrid_guided_and_self_guided",
      vesselsAndEquipmentSummary:
        "Protected Wrangell Narrows waters (~1 mile from Blind River hatchery): 16' welded aluminum skiffs (40hp Yamaha, GPS/depth sounder, unlimited fuel & bait) included; two 26' and three 32' enclosed cabin cruisers (with marine heads) available for guided upgrades (+$265/pp/day).",
      targetSpeciesSummary: "King and coho (silver) salmon, Pacific halibut, and bottomfish.",
      seasonalRunNote: "Operating window listed as May 31 – September 3.",
      fishProcessingAndBoxesSummary:
        "Daily filleting, wrapping, and two -20°F walk-in blast freezers included; 50 lb fish boxes sold at $10 (uninsulated) or $15 (insulated).",
      scopedRequirements: [
        {
          requirementName: "Self-Guided vs. Guided Halibut Bag Limits & Optional $300 GAF Permit",
          applicableActivityAndDateScope: "Area 2C halibut fishing (self-guided skiff days vs. guided charter days)",
          provisionStatus: "extra_charge_published",
          detail:
            "Official /prices notes self-guided trips retain 2 halibut/day any size, while guided trips follow Area 2C reverse-slot & Tuesday closure rules unless purchasing a $300/fish GAF permit (verify 2027 IPHC rules).",
          sourceUrl: "https://www.rockypointresortak.com/prices",
        },
        {
          requirementName: "ADF&G Sportfishing License & King Salmon Stamp",
          applicableActivityAndDateScope: "All anglers",
          provisionStatus: "extra_charge_published",
          detail: "Excluded ($20–$80 license; $10–$50 King stamp depending on duration).",
          sourceUrl: "https://www.rockypointresortak.com/prices",
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:rocky-point-resort:1",
        gatewayAirportIata: "PSG",
        gatewayPlaceId: "place:community:petersburg",
        gatewayPortSlug: "petersburg",
        legTitle: "Petersburg James A. Johnson Airport (PSG) or AMHS Ferry ↔ Resort Transfer",
        transferMode: "road_or_courtesy_van",
        carrierOrDockName: "Included Rocky Point Resort pickup from PSG Airport (Alaska Airlines Milk Run) or AMHS Ferry Terminal",
        durationLabel: "Mitkof Highway transfer south from Petersburg",
        provisionStatus: "included_in_published_package",
        transportOperationState: "road_or_local_courtesy_shuttle",
        publishedTransferRateNote: "Included in package price.",
        scopedBaggageAndFreightRule: {
          disclosed: false,
          ruleSummary: "Alaska Airlines jet service into PSG (standard airline checked-baggage rules) or AMHS walk-on/vehicle ferry.",
          applicableServiceScope: "PSG jet or AMHS ferry arrival",
          sourceUrl: "https://www.rockypointresortak.com/prices",
        },
        reportingAndOvernightBufferNote: "Coordinate Alaska Airlines Flight 64/65 or AMHS arrival time directly with Mike or Jenny.",
        sourceUrl: "https://www.rockypointresortak.com/prices",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "not_disclosed_on_retrieved_source",
        summary: "Kayaks are not listed on retrieved pages; included 16' skiff can be used to explore protected Wrangell Narrows waters.",
      },
      guidedNonFishingExcursions: {
        status: "custom_boat_wildlife_or_glacier_options",
        summary:
          "Official /boats_guides page explicitly states the 26' and 32' enclosed cabin cruisers 'may be chartered for sight-seeing, whale watching or glacier tours' (e.g., Frederick Sound & LeConte Glacier).",
      },
      simultaneousNonAnglerActivitiesProven: "unknown",
      simultaneousNonAnglerExplanation:
        "Sightseeing/whale/glacier boat charters are offered on the 26'/32' vessels, and Petersburg/Wrangell operators run LeConte Glacier & Anan Bear tours; confirm per-person charter pricing for split groups.",
      contextualEcosystemLinks: [
        {
          label: "Petersburg Port, Harbors & LeConte Glacier Cruises",
          href: "/ports/petersburg",
          surface: "lfse",
          relationshipNote: "Explore Petersburg harbors and Seek Alaska Tours' Frederick Sound / LeConte Bay excursions.",
        },
        {
          label: "Seek Alaska Tours (Petersburg Whale & LeConte Glacier Profile)",
          href: "/operators/seek-alaska",
          surface: "lfse",
          relationshipNote: "Verified local Petersburg operator for LeConte Glacier and Frederick Sound humpback trips.",
        },
        {
          label: "Wrangell, Stikine River & Anan Bear Observatory",
          href: "/ports/wrangell",
          surface: "lfse",
          relationshipNote: "Neighboring Central Inside Passage stop for Muddy Water Adventures' Anan Bear & Stikine jetboats.",
        },
        {
          label: "Cruise Alaska Without a Cruise Ship (AMHS Ferry Context)",
          href: "https://cruisepromenade.com/guides/cruise-alaska-without-a-cruise-ship",
          surface: "cp",
          relationshipNote: "Understand Alaska Marine Highway ferry schedule windows and walk-on policies.",
        },
      ],
    },
    visualRepresentation: {
      imagePath: "/images/alaska/sitka-sea-otter.jpg",
      imageAlt: "Marine wildlife in calm Southeast Alaska Inside Passage waters",
      imageCredit: "CC BY 2.0 · gailhampshire",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "RPR-01",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "2026 Season (May 31 – Sep 3)",
        claimSummary:
          "Publishes 2N–7N per-person rates ($930 to $3,255), +$265/pp/day guided upgrade, $425–$450 covered boat upgrade, $300 GAF halibut option, Petersburg tax formula, $10/$15 fish boxes, and included PSG airport/ferry transfers.",
        source: createOfficialCitation("Rocky Point Resort — Prices", "https://www.rockypointresortak.com/prices"),
      },
      {
        claimId: "RPR-02",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents 2-bedroom, 4-bunk cabins with private bathrooms, unlimited hot water, boot dryers, family-style meals, and homepage 'handicapped accessible' statement.",
        source: createOfficialCitation("Rocky Point Resort — Accommodations", "https://www.rockypointresortak.com/accommodations"),
      },
      {
        claimId: "RPR-03",
        scope: "non_fishing_options",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms 16' Yamaha skiffs plus two 26' and three 32' enclosed cruisers available for guided fishing or sightseeing, whale watching, and glacier charters.",
        source: createOfficialCitation("Rocky Point Resort — Boats & Guides", "https://www.rockypointresortak.com/boats_guides"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Confirm 2027 rate adjustments and 2027 Area 2C guided halibut regulations with Mike or Jenny.",
      "Confirm specific cabin/dock ramp accessibility details if traveling with a wheelchair user.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },

  // =========================================================================
  // 16. ALASKA'S BOARDWALK LODGE (Thorne Bay, POW Island)
  //     (Separately labeled Whole-Lodge Private Property Stay — NOT a shared
  //      per-person all-inclusive guided package!)
  // =========================================================================
  {
    lodgeId: "lodge:boardwalk-lodge",
    slug: "boardwalk-lodge",
    displayName: "Alaska's Boardwalk Lodge (Whole-Lodge Private Stay)",
    subRegion: "prince_of_wales_island",
    stayFormat: "whole_lodge_private_property",
    operationArchetype: "whole_property_private_stay_services_separate",
    headlineSummary:
      "Exclusive whole-property waterfront lodge booking in Thorne Bay on Prince of Wales Island (one private group up to 60 guests; on-site manager, kitchen & fly-fishing room included; chef, independent guides, housekeeping & boat access arranged separately).",
    accommodation: {
      accommodationId: "accommodation:boardwalk-lodge-thorne-bay",
      propertyName: "Alaska's Boardwalk Lodge",
      propertyKind: "remote_wilderness_lodge",
      actualLocationLabel: "Cook's Cove, Thorne Bay, Eastern Prince of Wales Island",
      streetOrPostalAddress: "1 Cook's Cove, Thorne Bay, AK 99919",
      gatewayPlaceId: "place:community:ketchikan",
      gatewayPublicPortSlug: "ketchikan",
      gatewayLabel: "Ketchikan (KTN) → Thorne Bay, Prince of Wales Island",
      communityPlaceId: "place:community:klawock",
      coordinates: {
        latitude: 55.6872,
        longitude: -132.5222,
        precisionBasis: "verified_community_or_harbor_anchor",
        coordinateNote: "Thorne Bay / Cook's Cove waterfront anchor on eastern Prince of Wales Island.",
      },
      relationshipToPackageSeller: "same_operating_business",
      relationshipExplanation:
        "Boardwalk Lodge rents the entire property privately to one group directly through the owners; chef/catering, independent fishing guides, housekeeping, and boat access for qualified groups are arranged separately.",
      roomAndCabinSummary:
        "Exclusive group use of Standard Rooms (bedroom + private bath), Boardwalk Suites, Aurora great room, dock, fly-fishing room, and full kitchen/dining facilities (connected by a 300-yard boardwalk).",
      bathroomConfiguration: "private_ensuite_documented",
      guestKitchenOrSelfCaterAccess: "yes",
      mealProvisionSummary:
        "Kitchen and dining facilities are included for self-catering, or groups may separately arrange a private chef / independent cook.",
      maxConcurrentGuests: 60,
      groupSizeGuidanceNote:
        "Accommodates 1 private group up to 60 guests (rooming confirmed by owners). Official pages note groups of 10–40 are 'an especially good fit' and typical stays run 10–14 days, while the official /contact-us/ inquiry form accepts group sizes of 1–12, 13–30, or 31–60 guests and stay lengths from 3–5 nights to 14+ nights (explicitly noting it is not a shared per-person fishing package).",
      childrenAndYouthNote: "Multi-generational private family gatherings and holiday retreats are explicitly promoted.",
      documentedAccessibilityNote:
        "Official /lodge/ page advises discussing mobility needs and room layout with the owners prior to confirming a stay (property spans a 300-yard boardwalk).",
    },
    operatingCompany: {
      operatorId: "operator:boardwalk-lodge",
      legalOrDisplayName: "Alaska's Boardwalk Lodge",
      existingLfseOperatorSlug: null,
      officialWebsite: "https://www.boardwalklodge.com/",
      officialEmailDomain: "boardwalklodge.com",
      officialPhone: null,
      ownershipOrHistorySummary:
        "Built in 1990 at Cook's Cove, Thorne Bay; currently operated directly by the owners as a year-round private whole-lodge stay.",
      identityClaimStatus: "unclaimed",
    },
    packageSeller: {
      sellerName: "Boardwalk Lodge Owners (Private Stay Inquiry)",
      sellerRole: "property_owners_direct_inquiry",
      officialBookingOrInquiryUrl: "https://www.boardwalklodge.com/contact-us/",
      primaryCtaLabel: "Request a quote",
      bookingMechanismSummary:
        "Owner inquiry form on /contact-us/ followed by a direct planning call, custom agreement, invoice, and wire deposit.",
    },
    partnerServices: [
      {
        serviceRole: "independent_fishing_guides",
        providerName: "Independent Saltwater & Freshwater Guides (Optional Arrangement)",
        arrangementType: "arranged_separately_by_guest_or_group",
        details:
          "Official /lodge/ page states: 'Guides and housekeeping are optional arrangements, confirmed to suit your stay. Boat access is available to qualified groups, with details confirmed on the call with the owners.'",
        officialUrl: "https://www.boardwalklodge.com/lodge/",
      },
      {
        serviceRole: "chef_catering_or_housekeeping",
        providerName: "Independent Chef / Cook & Housekeeping Services",
        arrangementType: "arranged_separately_by_guest_or_group",
        details: "Groups may self-cater using the lodge kitchen or arrange an independent chef/cook and housekeeping separately.",
        officialUrl: "https://www.boardwalklodge.com/lodge/",
      },
    ],
    packages: [
      {
        packageId: "pkg:boardwalk-lodge:whole-property-private-stay",
        lodgeSlug: "boardwalk-lodge",
        packageName: "Private Whole-Lodge Exclusive Property Stay (Services Arranged Separately)",
        applicableSeason: "season_not_stated_on_source",
        applicableDatesLabel:
          "Available year-round by inquiry (typical stays 10–14 days; inquiry selector offers 3–5, 5–7, 7–10, 10–14, and 14+ nights)",
        nights: null,
        fishingDays: null,
        durationSummaryLabel: "Whole-lodge buyout (3–5 to 14+ nights by owner inquiry; 10–14 days typical)",
        occupancyAndSharingBasis:
          "Exclusive whole-lodge booking for ONE private group (up to 60 guests; 10–40 noted as ideal fit; inquiry form starts at 1–12 guests — NOT a shared per-person package)",
        priceState: "quote_required",
        priceAmountUsd: null,
        priceDisplayLabel: "Whole-lodge quote by owner inquiry (budget selector: <$50k to $150k+)",
        taxTreatment: "unknown",
        taxDetailNote: "Custom whole-property invoice and wire deposit agreed directly with owners.",
        remainingAvailabilityState: "not_checked_contact_official_channel",
        availabilityNote: "Dates, rooming capacity, and optional services are confirmed individually with the owners.",
        verifiedInclusions: [
          "Exclusive single-group use of the entire lodge, guest rooms/suites (private baths), dock, and common spaces",
          "On-site property manager for property support",
          "Kitchen and dining facilities for self-catering",
          "Fly-fishing room and fishing gear access",
        ],
        knownExclusionsAndAdditionalCharges: [
          {
            itemLabel: "Independent Fishing Guides, Boat Access Qualification, Chef/Catering & Housekeeping",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote:
              "Explicitly separate from base property use: self-cater or arrange a chef, independent guides, and housekeeping separately; boat access available only to qualified groups after owner call.",
            sourceUrl: "https://www.boardwalklodge.com/lodge/",
          },
          {
            itemLabel: "Transportation to Thorne Bay, Provisioning/Groceries, Fish Processing & Licenses",
            chargeStatus: "excluded_quote_or_purchase_required",
            publishedAmountNote: null,
            scopeAndRuleNote: "Confirmed individually during owner planning call.",
            sourceUrl: "https://www.boardwalklodge.com/contact-us/",
          },
        ],
        ctaLabel: "Request a quote",
        ctaUrl: "https://www.boardwalklodge.com/contact-us/",
        sourceUrl: "https://www.boardwalklodge.com/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    fishingProgram: {
      waterTypes: ["saltwater", "freshwater"],
      guidingMode: "independent_guides_arranged_separately",
      vesselsAndEquipmentSummary:
        "Fly-fishing room and gear access included with property stay; boat access is available to qualified groups (confirmed on owner call) and independent saltwater/freshwater guides are arranged separately.",
      targetSpeciesSummary: "Prince of Wales Island salmon, halibut, black cod, steelhead, and trout.",
      seasonalRunNote: "Available year-round (summer salmon/halibut, spring/fall steelhead, and winter holiday retreats).",
      fishProcessingAndBoxesSummary: "Confirm current fish-processing and cold-storage arrangements directly with the owners.",
      scopedRequirements: [
        {
          requirementName: "Boat Qualification & Separate Independent Guide Arrangements + ADF&G Licenses",
          applicableActivityAndDateScope: "Private-stay groups planning saltwater boating or guided fishing",
          provisionStatus: "arranged_separately_by_guest_or_group",
          detail: "Boat access requires owner qualification call; independent guides and ADF&G licenses/stamps are arranged separately.",
          sourceUrl: "https://www.boardwalklodge.com/lodge/",
        },
      ],
    },
    accessConnections: [
      {
        connectionId: "access:boardwalk-lodge:1",
        gatewayAirportIata: "KTN",
        gatewayPlaceId: "place:community:ketchikan",
        gatewayPortSlug: "ketchikan",
        legTitle: "Ketchikan (KTN) → Thorne Bay (Prince of Wales Island) Air or Ferry/Road Arrival",
        transferMode: "charter_or_scheduled_floatplane",
        carrierOrDockName: "Floatplane (~30 min from Ketchikan per /alaska-lodge-info/) or KTN→Hollis IFA ferry + POW road",
        durationLabel: "~30 minutes by floatplane from Ketchikan",
        provisionStatus: "arranged_separately_by_guest_or_group",
        transportOperationState: "scheduled_third_party_carrier_corridor",
        publishedTransferRateNote: "Travel to Thorne Bay is coordinated around your group's private stay; not bundled as a per-person charter.",
        scopedBaggageAndFreightRule: {
          disclosed: false,
          ruleSummary: "Depends on chosen floatplane carrier vs. Inter-Island Ferry / road provisioning.",
          applicableServiceScope: "Ketchikan ↔ Thorne Bay arrival",
          sourceUrl: "https://www.boardwalklodge.com/alaska-lodge-info/",
        },
        reportingAndOvernightBufferNote: "Coordinate group arrival windows and food provisioning with the owners prior to booking transport.",
        sourceUrl: "https://www.boardwalklodge.com/",
        retrievedAt: RETRIEVED_DATE,
      },
    ],
    nonFishingContext: {
      onSiteUnguidedEquipment: {
        status: "documented_on_official_site",
        summary: "Exclusive private use of waterfront dock, Aurora great room, kitchen, and Prince of Wales Island base.",
      },
      guidedNonFishingExcursions: {
        status: "arranged_separately_by_group",
        summary:
          "Because one private group controls the entire property and agenda, fishing and non-fishing family/company members share the base on their own schedule.",
      },
      simultaneousNonAnglerActivitiesProven: "yes",
      simultaneousNonAnglerExplanation:
        "Whole-lodge private stay explicitly supports mixed-interest families, company retreats, and non-fishing guests without per-angler package charges (any guided tours are arranged separately).",
      contextualEcosystemLinks: [
        {
          label: "Ketchikan Gateway Guide",
          href: "/ports/ketchikan",
          surface: "lfse",
          relationshipNote: "Gateway flight and ferry connections through Ketchikan.",
        },
        {
          label: "Klawock & Prince of Wales Island Guide",
          href: "/ports/klawock",
          surface: "lfse",
          relationshipNote: "Prince of Wales Island road-system context.",
        },
      ],
    },
    visualRepresentation: {
      imagePath: "/images/portfolio/ketchikan-fishing-vessel.webp",
      imageAlt: "Southeast Alaska coastal harbor and forested Prince of Wales Island waters",
      imageCredit: "CC0 1.0 Public Domain · Bernard Spragg. NZ",
      isActualPropertyPhoto: false,
      visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.",
    },
    claimEvidence: [
      {
        claimId: "BWLK-01",
        scope: "identity_and_roles",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms private whole-lodge stay for one group (up to 60 guests; 10–40 especially good fit; 10–14 days typical) with on-site manager, kitchen, and fly-fishing room included, while chef, independent guides, and housekeeping are arranged separately.",
        source: createOfficialCitation("Boardwalk Lodge — Private Whole-Lodge Stays", "https://www.boardwalklodge.com/"),
        unresolvedOrConflictNote:
          "Legacy /alaska-lodge-info/ and /why-boardwalk-lodge/ subpages still contain historical Orvis full-service lodge prose, whereas current homepage, /lodge/, /alaska-lodge-buyout/, and /contact-us/ govern the current private-property-only model.",
      },
      {
        claimId: "BWLK-02",
        scope: "accommodation_and_capacity",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Documents Standard Rooms and Boardwalk Suites with private bathrooms, boat access for qualified groups confirmed on owner call, and optional separate guide/cook/housekeeping arrangements.",
        source: createOfficialCitation("Boardwalk Lodge — The Lodge", "https://www.boardwalklodge.com/lodge/"),
      },
      {
        claimId: "BWLK-03",
        scope: "package_pricing_and_inclusions",
        verificationStatus: "sourced_from_official_page",
        applicableSeasonOrDate: "Retrieved 2026-11-19",
        claimSummary:
          "Confirms address (1 Cook's Cove, Thorne Bay, AK 99919), inquiry group-size selector (1–12, 13–30, 31–60), stay-length selector (3–5 to 14+ nights), budget brackets (<$50k to $150k+), and note that shared per-person packages are not offered.",
        source: createOfficialCitation("Boardwalk Lodge — Inquire About a Private Stay", "https://www.boardwalklodge.com/contact-us/"),
      },
    ],
    unresolvedQuestionsForTraveler: [
      "Discuss exact whole-property rate, room count, boat-access qualification, and referrals for independent Thorne Bay guides/cooks on the owner inquiry call.",
    ],
    verifiedAt: RETRIEVED_DATE,
    lastModifiedAt: RETRIEVED_DATE,
  },
];

// ============================================================================
// PUBLIC SNAPSHOT & LOOKUP SELECTORS (HELD RECORDS STRICTLY EXCLUDED)
// ============================================================================

export interface EvaluatedSoutheastAlaskaFishingLodge {
  lodge: SoutheastAlaskaFishingLodgeRecord;
  gate: LodgePublicationGateEvaluation;
}

export function getPublishedSoutheastAlaskaFishingLodges(): EvaluatedSoutheastAlaskaFishingLodge[] {
  return SOUTHEAST_ALASKA_FISHING_LODGES_CANDIDATES.map((lodge) => ({
    lodge,
    gate: evaluateSoutheastAlaskaLodgePublicationGate(lodge),
  })).filter((entry) => entry.gate.publishableInPreviewDirectory);
}

export function findPublishedSoutheastAlaskaFishingLodgeBySlug(
  slug: string,
): EvaluatedSoutheastAlaskaFishingLodge | null {
  const normalized = slug.trim().toLowerCase();
  return (
    getPublishedSoutheastAlaskaFishingLodges().find(
      (entry) => entry.lodge.slug === normalized,
    ) ?? null
  );
}

export function getPublicSoutheastAlaskaFishingLodgesSnapshot() {
  const published = getPublishedSoutheastAlaskaFishingLodges();
  const individualStaysCount = published.filter(
    (e) => e.lodge.stayFormat === "individual_rooms_or_cabins",
  ).length;
  const wholeLodgeStaysCount = published.filter(
    (e) => e.lodge.stayFormat === "whole_lodge_private_property",
  ).length;

  return {
    schemaVersion: ALASKA_FISHING_LODGES_CONTRACT_VERSION,
    coreContractVersion: DIRECTORY_CORE_CONTRACT_VERSION,
    generatedAt: "2026-11-19T15:00:00Z",
    region: {
      regionId: "region:southeast-alaska",
      name: "Southeast Alaska",
      directoryPath: "/southeast-alaska/fishing-lodges",
      unclaimedNotice: UNCLAIMED_LODGE_FACT_SHEET_NOTICE,
      subregionLabels: SOUTHEAST_ALASKA_LODGE_SUBREGION_LABELS,
    },
    counts: {
      totalPublishedProperties: published.length,
      individualRoomOrCabinProperties: individualStaysCount,
      wholeLodgePrivateProperties: wholeLodgeStaysCount,
    },
    lodges: published.map((entry) => entry.lodge),
  };
}

