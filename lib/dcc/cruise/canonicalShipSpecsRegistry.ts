/**
 * Authoritative DCC Canonical Ship Specification & Provenance Registry (73 vessels).
 * Synchronized 1:1 with Cruise Promenade /cruise-ships/[shipSlug] visible facts and JSON-LD.
 * Contains editorial vessel summaries and verified official fleet source references only;
 * zero unlicensed deck plans or proprietary cruise-line media are stored or reproduced.
 */

export interface CanonicalDccShipFieldProvenanceEntry {
  sourceAuthority: 'cruise_line_first_party' | 'dcc_editorial_synthesis' | 'licensed_visual_manifest';
  sourceUrl: string | null;
  usageRights: 'facts_only_rewritten_editorial' | 'dcc_original_editorial' | 'licensed_cc_or_public_domain_visual';
  verifiedAtIso: string;
}

export interface CanonicalDccShipRecord {
  shipId: string;
  shipSlug: string;
  shipName: string;
  cruiseLine: string;
  canonicalLineCode: string | null;
  inCuratedFleet: boolean;
  shipClass: string | null;
  passengerCapacity: number | null;
  debutYear: number | null;
  homeports: string[];
  specSourceUrl: string | null;
  specSourceName: string | null;
  specVerifiedAt: string;
  containsDeckPlansOrProprietaryMedia: false;
  summaryDescription: string;
  dockAndTimingGuidance: string;
  isIndexable: boolean;
  robotsDirective: 'index, follow' | 'noindex, follow';
  holdReasonCodes: string[];
  upcomingPhysicalSailingCount: number;
  upcomingHostedSailingCount: number;
  fieldProvenance: {
    shipIdentity: CanonicalDccShipFieldProvenanceEntry;
    vesselHardwareSpecs: CanonicalDccShipFieldProvenanceEntry;
    homeports: CanonicalDccShipFieldProvenanceEntry;
    editorialSummaryAndDockGuidance: CanonicalDccShipFieldProvenanceEntry;
    heroVisualAsset: CanonicalDccShipFieldProvenanceEntry;
  };
}

export const CANONICAL_DCC_SHIPS: readonly CanonicalDccShipRecord[] = [
  {
    "shipId": "ship:adventure-of-the-seas",
    "shipSlug": "adventure-of-the-seas",
    "shipName": "Adventure of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Voyager Class",
    "passengerCapacity": 3114,
    "debutYear": 2001,
    "homeports": [
      "Port Canaveral, FL",
      "Fort Lauderdale, FL"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/adventure-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Adventure of the Seas is a Voyager-class Royal Caribbean ocean ship sailing Eastern, Southern, and Western Caribbean itineraries from Florida turnaround ports.",
    "dockAndTimingGuidance": "Voyager-class Caribbean calls typically dock pierside at Nassau, Puerto Plata, Cozumel, and St. Croix; budget a 2-hour return buffer before posted all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/adventure-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/adventure-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/adventure-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/adventure-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Adventure_of_the_Seas_ship_(cropped).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:allure-of-the-seas",
    "shipSlug": "allure-of-the-seas",
    "shipName": "Allure of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Oasis Class",
    "passengerCapacity": 5484,
    "debutYear": 2010,
    "homeports": [
      "Fort Lauderdale, FL",
      "Miami, FL",
      "Galveston, TX"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/allure-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Allure of the Seas is an Oasis-class Royal Caribbean flagship hosting both scheduled Caribbean departures and full-ship music and LGBTQ+ charters.",
    "dockAndTimingGuidance": "Oasis-class guest volume creates peak gangway queues 45–60 minutes after arrival and before all-aboard; plan independent shore returns at least 2 hours before departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/allure-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/allure-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/allure-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/allure-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Allure_of_the_Seas,_docked_at_Nassau_Cruise_Port,_Bahamas_(March_14,_2024)_01.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:amadeus-aurea",
    "shipSlug": "amadeus-aurea",
    "shipName": "Amadeus Aurea",
    "cruiseLine": "Amadeus River Cruises",
    "canonicalLineCode": "amadeus",
    "inCuratedFleet": false,
    "shipClass": null,
    "passengerCapacity": 158,
    "debutYear": 2026,
    "homeports": [
      "Basel, Switzerland",
      "Amsterdam, Netherlands"
    ],
    "specSourceUrl": null,
    "specSourceName": null,
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Amadeus Aurea is a European boutique river vessel chartered for Rhine and Danube hosted river voyages.",
    "dockAndTimingGuidance": "European riverboat moorings can raft alongside sister vessels and shift with river water levels; confirm gangway location directly onboard.",
    "isIndexable": false,
    "robotsDirective": "noindex, follow",
    "holdReasonCodes": [
      "unverified_ship_facts"
    ],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kopenhagen_(DK),_Nyhavn_--_2017_--_1538.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:brilliant-lady",
    "shipSlug": "brilliant-lady",
    "shipName": "Brilliant Lady",
    "cruiseLine": "Virgin Voyages",
    "canonicalLineCode": "vv",
    "inCuratedFleet": false,
    "shipClass": "Lady Ships Class (18+)",
    "passengerCapacity": 2770,
    "debutYear": 2025,
    "homeports": [
      "Miami, FL",
      "Los Angeles, CA",
      "Seattle, WA",
      "New York, NY"
    ],
    "specSourceUrl": "https://www.virginvoyages.com/ships/brilliant-lady",
    "specSourceName": "Virgin Voyages Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Brilliant Lady is Virgin Voyages’ fourth adults-only Lady-class ocean ship, engineered with Panama Canal transit dimensions for North American, Alaska, and Caribbean routes.",
    "dockAndTimingGuidance": "Virgin Voyages itineraries frequently feature late-evening or overnight port stays; verify exact Sailors all-aboard times onboard and keep a 2-hour pier buffer.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 2,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/brilliant-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/brilliant-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/brilliant-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.virginvoyages.com/ships/brilliant-lady",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Brilliant_Lady_in_Prince_Rupert,_BC.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-breeze",
    "shipSlug": "carnival-breeze",
    "shipName": "Carnival Breeze",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": false,
    "shipClass": "Dream Class",
    "passengerCapacity": 3690,
    "debutYear": 2012,
    "homeports": [
      "Galveston, TX"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships/carnival-breeze",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Carnival Breeze is a Dream-class Carnival ocean ship homeported in Galveston for 4-, 5-, and 7-night Western Caribbean voyages to Cozumel, Montego Bay, and Grand Cayman.",
    "dockAndTimingGuidance": "Galveston Pier 25 turnarounds and Grand Cayman tender operations require extra transfer time; maintain a 2-hour pre-departure pier buffer.",
    "isIndexable": false,
    "robotsDirective": "noindex, follow",
    "holdReasonCodes": [
      "no_upcoming_sailings_or_port_guides",
      "orphan_ship_page",
      "thin_placeholder_ship_page"
    ],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-breeze",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-breeze",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-breeze",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-breeze",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Carnival_Breeze_(ship,_2011)_001_(cropped).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-celebration",
    "shipSlug": "carnival-celebration",
    "shipName": "Carnival Celebration",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": true,
    "shipClass": "Excel Class",
    "passengerCapacity": 5282,
    "debutYear": 2022,
    "homeports": [
      "Miami, FL"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Carnival Celebration is an Excel-class mega-liner powered by LNG, offering the BOLT rollercoaster and vibrant Caribbean itineraries.",
    "dockAndTimingGuidance": "For independent shore excursions from Carnival Celebration, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/a-beach-with-palm-trees-and-the-ocean-in-the-background-Ox_6M68VqfQ",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-conquest",
    "shipSlug": "carnival-conquest",
    "shipName": "Carnival Conquest",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": false,
    "shipClass": "Conquest Class",
    "passengerCapacity": 2980,
    "debutYear": 2002,
    "homeports": [
      "Miami, FL"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships/carnival-conquest",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Carnival Conquest is a Conquest-class Carnival vessel operating short Bahamas, Key West, and Half Moon Cay / Celebration Key getaways from PortMiami.",
    "dockAndTimingGuidance": "Bahamas private-destination calls may use tender or lagoon shuttle transfers depending on berth assignment; allow 2 hours before ship departure on independent tours.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 4,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-conquest",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-conquest",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-conquest",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-conquest",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:USA-2016-Puerto_Rico-San_Juan-Castillo_San_Felipe_del_Morro_(and_lighthouse)_03.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-glory",
    "shipSlug": "carnival-glory",
    "shipName": "Carnival Glory",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": false,
    "shipClass": "Conquest Class",
    "passengerCapacity": 2980,
    "debutYear": 2003,
    "homeports": [
      "Port Canaveral, FL"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships/carnival-glory",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Carnival Glory is a Conquest-class Carnival ship sailing Bahamas and Caribbean voyages from Port Canaveral alongside themed charter sailings.",
    "dockAndTimingGuidance": "Allow at least 2 hours before posted ship departure when returning from Nassau or Bimini independent shore activities.",
    "isIndexable": false,
    "robotsDirective": "noindex, follow",
    "holdReasonCodes": [
      "no_upcoming_sailings_or_port_guides",
      "orphan_ship_page",
      "thin_placeholder_ship_page"
    ],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-glory",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-glory",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-glory",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-glory",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Carnival_Glory_Cruise_Ship_in_PortMiami_Florida.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-horizon",
    "shipSlug": "carnival-horizon",
    "shipName": "Carnival Horizon",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": false,
    "shipClass": "Vista Class",
    "passengerCapacity": 3960,
    "debutYear": 2018,
    "homeports": [
      "Miami, FL"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships/carnival-horizon",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Carnival Horizon is a Vista-class Carnival ocean liner sailing Southern and Western Caribbean itineraries from PortMiami, including full-ship music charters.",
    "dockAndTimingGuidance": "Southern Caribbean ports (Aruba, Curaçao, La Romana) dock at dedicated deep-water piers; keep a 2-hour return margin before all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-horizon",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-horizon",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-horizon",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-horizon",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Carnival_Horizon_of_the_coast_of_Grand_Turk_(cropped).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-jubilee",
    "shipSlug": "carnival-jubilee",
    "shipName": "Carnival Jubilee",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": false,
    "shipClass": "Excel Class",
    "passengerCapacity": 5362,
    "debutYear": 2023,
    "homeports": [
      "Galveston, TX"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships/carnival-jubilee",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Carnival Jubilee is an LNG-powered Excel-class flagship homeported year-round in Galveston for Western Caribbean calls at Cozumel, Costa Maya, and Roatán.",
    "dockAndTimingGuidance": "Cozumel Puerta Maya and Mahogany Bay Roatán piers handle high Excel-class guest throughput; return to the pier gate at least 2 hours prior to departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 3,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-jubilee",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-jubilee",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-jubilee",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-jubilee",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/a-beach-with-palm-trees-and-the-ocean-in-the-background-Ox_6M68VqfQ",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-liberty",
    "shipSlug": "carnival-liberty",
    "shipName": "Carnival Liberty",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": false,
    "shipClass": "Conquest Class",
    "passengerCapacity": 2974,
    "debutYear": 2005,
    "homeports": [
      "New Orleans, LA"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships/carnival-liberty",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Carnival Liberty sails Western Caribbean and Bahamas itineraries down the Mississippi River from the Port of New Orleans Erato Street Cruise Terminal.",
    "dockAndTimingGuidance": "New Orleans turnaround mornings experience downtown riverfront traffic; in Cozumel, Belize, and Montego Bay, plan a 2-hour return cushion.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-liberty",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-liberty",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-liberty",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-liberty",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Mississippi_River_-_New_Orleans.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-panorama",
    "shipSlug": "carnival-panorama",
    "shipName": "Carnival Panorama",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": true,
    "shipClass": "Vista Class",
    "passengerCapacity": 4008,
    "debutYear": 2019,
    "homeports": [
      "Long Beach, CA"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Carnival Panorama sails year-round 7-day Mexican Riviera cruises from Long Beach, offering the SkyRide, WaterWorks, and vibrant Pacific sailings.",
    "dockAndTimingGuidance": "For independent shore excursions from Carnival Panorama, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:A_Postcard_From_Cabo_San_Lucas_(56014870).jpeg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-spirit",
    "shipSlug": "carnival-spirit",
    "shipName": "Carnival Spirit",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": true,
    "shipClass": "Spirit Class",
    "passengerCapacity": 2124,
    "debutYear": 2001,
    "homeports": [
      "Seattle, WA"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "A classic Spirit-class ship offering family-friendly 7-day roundtrip Alaska sailings from Seattle.",
    "dockAndTimingGuidance": "For independent shore excursions from Carnival Spirit, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 2,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/snow-capped-mountains-and-a-glacier-fill-the-landscape-r3nRotY8cQw",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-valor",
    "shipSlug": "carnival-valor",
    "shipName": "Carnival Valor",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": false,
    "shipClass": "Conquest Class",
    "passengerCapacity": 2980,
    "debutYear": 2004,
    "homeports": [
      "New Orleans, LA"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships/carnival-valor",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Carnival Valor operates 4- and 5-night Western Caribbean sailings from New Orleans to Cozumel and Progreso, serving both leisure groups and hosted conferences.",
    "dockAndTimingGuidance": "Progreso’s 4-mile causeway pier requires shuttle transit into town; build shuttle time into a 2-hour pre-departure pier buffer.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 5,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-valor",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-valor",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-valor",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-valor",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Mississippi_River_-_New_Orleans.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:carnival-venezia",
    "shipSlug": "carnival-venezia",
    "shipName": "Carnival Venezia",
    "cruiseLine": "Carnival Cruise Line",
    "canonicalLineCode": "ccl",
    "inCuratedFleet": false,
    "shipClass": "Venice Class (Carnival Fun Italian Style)",
    "passengerCapacity": 4090,
    "debutYear": 2019,
    "homeports": [
      "New York, NY",
      "Port Canaveral, FL"
    ],
    "specSourceUrl": "https://www.carnival.com/cruise-ships/carnival-venezia",
    "specSourceName": "Carnival Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Carnival Venezia blends Italian architectural piazzas with Carnival fleet amenities on Bermuda, Eastern Caribbean, and Bahamas voyages from Manhattan and Port Canaveral.",
    "dockAndTimingGuidance": "Manhattan Cruise Terminal Pier 88 and Royal Naval Dockyard Bermuda require structured transit timing; maintain a 2-hour pier-return buffer.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-venezia",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-venezia",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-venezia",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.carnival.com/cruise-ships/carnival-venezia",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Carnival_Venezia_-_03.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:celebrity-apex",
    "shipSlug": "celebrity-apex",
    "shipName": "Celebrity Apex",
    "cruiseLine": "Celebrity Cruises",
    "canonicalLineCode": "cel",
    "inCuratedFleet": false,
    "shipClass": "Edge Class",
    "passengerCapacity": 2910,
    "debutYear": 2020,
    "homeports": [
      "Port Canaveral, FL",
      "Southampton, UK",
      "Fort Lauderdale, FL"
    ],
    "specSourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-apex",
    "specSourceName": "Celebrity Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Celebrity Apex is an Edge-class Celebrity vessel featuring the cantilevered Magic Carpet tender platform across Caribbean, Norwegian Fjords, and Northern Europe itineraries.",
    "dockAndTimingGuidance": "Edge-class Magic Carpet tender operations speed ashore transfers in tender ports, though independent shore excursions should still target a 2-hour return margin.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-apex",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-apex",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-apex",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-apex",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celebrity_APEX_IMO_9838383_P_Stockholm_15-07-2022.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:celebrity-ascent",
    "shipSlug": "celebrity-ascent",
    "shipName": "Celebrity Ascent",
    "cruiseLine": "Celebrity Cruises",
    "canonicalLineCode": "cel",
    "inCuratedFleet": false,
    "shipClass": "Edge Class",
    "passengerCapacity": 3260,
    "debutYear": 2023,
    "homeports": [
      "Fort Lauderdale, FL",
      "Barcelona, Spain",
      "Rome (Civitavecchia), Italy"
    ],
    "specSourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-ascent",
    "specSourceName": "Celebrity Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Celebrity Ascent is a fourth-generation Edge-class Celebrity flagship sailing Mediterranean summer voyages and Eastern/Southern Caribbean winter seasons from Port Everglades.",
    "dockAndTimingGuidance": "Mediterranean gateway ports such as Civitavecchia and Livorno involve long rail/highway transfers inland; always preserve at least a 2-hour buffer before all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-ascent",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-ascent",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-ascent",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-ascent",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celebrity_Ascent_St._John%27s_20251205_3.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:celebrity-beyond",
    "shipSlug": "celebrity-beyond",
    "shipName": "Celebrity Beyond",
    "cruiseLine": "Celebrity Cruises",
    "canonicalLineCode": "cel",
    "inCuratedFleet": true,
    "shipClass": "Edge Class",
    "passengerCapacity": 3260,
    "debutYear": 2022,
    "homeports": [
      "Fort Lauderdale, FL",
      "Miami, FL"
    ],
    "specSourceUrl": "https://www.celebritycruises.com/cruise-ships",
    "specSourceName": "Celebrity Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Celebrity Beyond elevates modern luxury at sea with the Magic Carpet cantilevered platform, Sunset Bar, and World Class dining.",
    "dockAndTimingGuidance": "For independent shore excursions from Celebrity Beyond, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 4,
    "upcomingHostedSailingCount": 4,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celebrity_BEYOND_La_Rochelle.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:celebrity-constellation",
    "shipSlug": "celebrity-constellation",
    "shipName": "Celebrity Constellation",
    "cruiseLine": "Celebrity Cruises",
    "canonicalLineCode": "cel",
    "inCuratedFleet": false,
    "shipClass": "Millennium Class",
    "passengerCapacity": 2184,
    "debutYear": 2002,
    "homeports": [
      "Tampa, FL",
      "Rome (Civitavecchia), Italy",
      "Ravenna, Italy"
    ],
    "specSourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-constellation",
    "specSourceName": "Celebrity Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Celebrity Constellation is a mid-sized Millennium-class ship favored for Adriatic, Mediterranean, and Western Caribbean itineraries as well as European full-ship charters.",
    "dockAndTimingGuidance": "Mid-sized draft allows Celebrity Constellation into classic Mediterranean harbors; verify tender vs. berth assignments per port and maintain a 2-hour return margin.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-constellation",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-constellation",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-constellation",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-constellation",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celebrity_Constellation_Palma_2019-10-29_7.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:celebrity-edge",
    "shipSlug": "celebrity-edge",
    "shipName": "Celebrity Edge",
    "cruiseLine": "Celebrity Cruises",
    "canonicalLineCode": "cel",
    "inCuratedFleet": false,
    "shipClass": "Edge Class",
    "passengerCapacity": 2918,
    "debutYear": 2018,
    "homeports": [
      "Seattle, WA",
      "Vancouver, BC",
      "Honolulu, HI",
      "Sydney, Australia"
    ],
    "specSourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-edge",
    "specSourceName": "Celebrity Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Celebrity Edge introduced Celebrity’s outward-facing Edge-class design and sails Alaska Dawes Glacier, Hawaii, South Pacific, and Australia/New Zealand itineraries.",
    "dockAndTimingGuidance": "In Juneau (AJ Dock / downtown shuttle) and tender ports like Kona or Maui, factor shuttle queues into a 2-hour return buffer before all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 4,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-edge",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-edge",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-edge",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-edge",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celebrity_Edge_leaving_Port_Everglades_in_Fort_Lauderdale,_Florida.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:celebrity-equinox",
    "shipSlug": "celebrity-equinox",
    "shipName": "Celebrity Equinox",
    "cruiseLine": "Celebrity Cruises",
    "canonicalLineCode": "cel",
    "inCuratedFleet": false,
    "shipClass": "Solstice Class",
    "passengerCapacity": 2852,
    "debutYear": 2009,
    "homeports": [
      "Barcelona, Spain",
      "Port Canaveral, FL",
      "Buenos Aires, Argentina"
    ],
    "specSourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-equinox",
    "specSourceName": "Celebrity Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Celebrity Equinox is a Solstice-class ocean liner featuring a real-grass Lawn Club deck across Mediterranean, Iberian, South American, and Caribbean voyages.",
    "dockAndTimingGuidance": "Port Vell / Moll Adossat in Barcelona and Mediterranean tender ports require shuttle clearance; plan to reach the terminal 2 hours ahead of departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 2,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-equinox",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-equinox",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-equinox",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-equinox",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:MS_Celebrity_Equinox_R02.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:celebrity-reflection",
    "shipSlug": "celebrity-reflection",
    "shipName": "Celebrity Reflection",
    "cruiseLine": "Celebrity Cruises",
    "canonicalLineCode": "cel",
    "inCuratedFleet": false,
    "shipClass": "Solstice Class",
    "passengerCapacity": 3046,
    "debutYear": 2012,
    "homeports": [
      "Fort Lauderdale, FL"
    ],
    "specSourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-reflection",
    "specSourceName": "Celebrity Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Celebrity Reflection is the largest Solstice-class Celebrity ship, operating Bahamas, Key West, Bimini, and Caribbean sailings plus full-ship music festival charters from Fort Lauderdale.",
    "dockAndTimingGuidance": "In Key West, Nassau, and Resorts World Bimini, tram and pier walkways take 15–20 minutes; keep a 2-hour return margin before posted departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 2,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-reflection",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-reflection",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-reflection",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-reflection",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celebrity_Reflection_cruise_ship_in_Santorini,_Greece_001.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:celebrity-silhouette",
    "shipSlug": "celebrity-silhouette",
    "shipName": "Celebrity Silhouette",
    "cruiseLine": "Celebrity Cruises",
    "canonicalLineCode": "cel",
    "inCuratedFleet": false,
    "shipClass": "Solstice Class",
    "passengerCapacity": 2902,
    "debutYear": 2011,
    "homeports": [
      "Fort Lauderdale, FL",
      "Boston, MA",
      "Reykjavík, Iceland"
    ],
    "specSourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-silhouette",
    "specSourceName": "Celebrity Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Celebrity Silhouette is a modernized Solstice-class ship serving Southern Caribbean, Bermuda, Iceland, and flagship StarVista LIVE concert charter departures from Fort Lauderdale.",
    "dockAndTimingGuidance": "Full-ship charter turnarounds at Port Everglades Terminal 25/29 move briskly, while port days in Curaçao, Aruba, and Cozumel warrant a 2-hour pier buffer.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 5,
    "upcomingHostedSailingCount": 5,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-silhouette",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-silhouette",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-silhouette",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-silhouette",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celebrity_Silhouette_in_Valletta_02.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:celebrity-solstice",
    "shipSlug": "celebrity-solstice",
    "shipName": "Celebrity Solstice",
    "cruiseLine": "Celebrity Cruises",
    "canonicalLineCode": "cel",
    "inCuratedFleet": true,
    "shipClass": "Solstice Class",
    "passengerCapacity": 2852,
    "debutYear": 2008,
    "homeports": [
      "Vancouver, BC",
      "Seattle, WA"
    ],
    "specSourceUrl": "https://www.celebritycruises.com/cruise-ships",
    "specSourceName": "Celebrity Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Features the real glass lawn club and modern luxury spaces for classic Alaska fjord expeditions.",
    "dockAndTimingGuidance": "For independent shore excursions from Celebrity Solstice, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 2,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celebrity_Solstice_in_Port_Melbourne,_Australia_Dec_2012_(02).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:celebrity-summit",
    "shipSlug": "celebrity-summit",
    "shipName": "Celebrity Summit",
    "cruiseLine": "Celebrity Cruises",
    "canonicalLineCode": "cel",
    "inCuratedFleet": false,
    "shipClass": "Millennium Class",
    "passengerCapacity": 2218,
    "debutYear": 2001,
    "homeports": [
      "Fort Lauderdale, FL",
      "Miami, FL",
      "Vancouver, BC",
      "Seward, AK"
    ],
    "specSourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-summit",
    "specSourceName": "Celebrity Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Celebrity Summit is an intimate 2,218-guest Millennium-class vessel renowned for Entertainment Cruise Productions jazz/soul charters, Alaska glacier routes, and Caribbean voyages.",
    "dockAndTimingGuidance": "Its 2,200-guest scale speeds gangway clearance compared with mega-ships, yet independent port tours should still return 2 hours before all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 11,
    "upcomingHostedSailingCount": 11,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-summit",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-summit",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-summit",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.celebritycruises.com/cruise-ships/celebrity-summit",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celebrity_Summit-DSC_0134w.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:discovery-princess",
    "shipSlug": "discovery-princess",
    "shipName": "Discovery Princess",
    "cruiseLine": "Princess Cruises",
    "canonicalLineCode": "pcl",
    "inCuratedFleet": true,
    "shipClass": "Royal Class",
    "passengerCapacity": 3660,
    "debutYear": 2022,
    "homeports": [
      "Seattle, WA"
    ],
    "specSourceUrl": "https://www.princess.com/ships-and-experience/ships",
    "specSourceName": "Princess Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "The newest Royal-class ship in Princess Cruises’ Alaska fleet, designed for Inside Passage voyages.",
    "dockAndTimingGuidance": "For independent shore excursions from Discovery Princess, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 2,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Discovery_Princess_(cropped).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:disney-dream",
    "shipSlug": "disney-dream",
    "shipName": "Disney Dream",
    "cruiseLine": "Disney Cruise Line",
    "canonicalLineCode": "dcl",
    "inCuratedFleet": true,
    "shipClass": "Dream Class",
    "passengerCapacity": 2500,
    "debutYear": 2011,
    "homeports": [
      "Fort Lauderdale, FL",
      "Port Canaveral, FL"
    ],
    "specSourceUrl": "https://disneycruise.disney.go.com/ships/",
    "specSourceName": "Disney Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Disney Dream delivers iconic Disney entertainment, the AquaDuck water coaster, and enchanting family sailings to the Bahamas and Caribbean.",
    "dockAndTimingGuidance": "For independent shore excursions from Disney Dream, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://disneycruise.disney.go.com/ships/",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://disneycruise.disney.go.com/ships/",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://disneycruise.disney.go.com/ships/",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://disneycruise.disney.go.com/ships/",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/white-boat-on-sea-under-blue-sky-during-daytime-WlP9h7kDRLo",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:disney-wonder",
    "shipSlug": "disney-wonder",
    "shipName": "Disney Wonder",
    "cruiseLine": "Disney Cruise Line",
    "canonicalLineCode": "dcl",
    "inCuratedFleet": true,
    "shipClass": "Magic Class",
    "passengerCapacity": 2713,
    "debutYear": 1999,
    "homeports": [
      "Vancouver, BC"
    ],
    "specSourceUrl": "https://disneycruise.disney.go.com/ships/",
    "specSourceName": "Disney Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Dedicated to Vancouver-based 7-night Alaska sailings featuring family-oriented port logistics.",
    "dockAndTimingGuidance": "For independent shore excursions from Disney Wonder, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://disneycruise.disney.go.com/ships/",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://disneycruise.disney.go.com/ships/",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://disneycruise.disney.go.com/ships/",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://disneycruise.disney.go.com/ships/",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/snow-capped-mountains-and-a-glacier-fill-the-landscape-r3nRotY8cQw",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:eurodam",
    "shipSlug": "eurodam",
    "shipName": "Eurodam",
    "cruiseLine": "Holland America Line",
    "canonicalLineCode": "hal",
    "inCuratedFleet": false,
    "shipClass": "Signature Class",
    "passengerCapacity": 2104,
    "debutYear": 2008,
    "homeports": [
      "Fort Lauderdale, FL",
      "Seattle, WA"
    ],
    "specSourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/eurodam",
    "specSourceName": "Holland America Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Holland America Line’s Signature-class Eurodam pairs classic promenade decks and Music Walk venues across Glacier Bay Alaska seasons and Caribbean music/LGBTQ+ charters.",
    "dockAndTimingGuidance": "In Half Moon Cay (tender) and Alaska ports like Juneau and Sitka, factor tender/shuttle windows into a conservative 2-hour pre-departure return buffer.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 10,
    "upcomingHostedSailingCount": 7,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/eurodam",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/eurodam",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/eurodam",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/eurodam",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Holland_America_Eurodam_at_Half_Moon_Cay.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:freedom-of-the-seas",
    "shipSlug": "freedom-of-the-seas",
    "shipName": "Freedom of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Freedom Class",
    "passengerCapacity": 3926,
    "debutYear": 2006,
    "homeports": [
      "Miami, FL",
      "Fort Lauderdale, FL"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/freedom-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Freedom of the Seas is an amplified Freedom-class Royal Caribbean ship operating short and weeklong Caribbean/Bahamas voyages and multi-stage rock and metal charters from Miami.",
    "dockAndTimingGuidance": "PortMiami Terminal A/G turnarounds and Caribbean calls at Nassau, Labadee, Grand Turk, and Falmouth warrant a 2-hour pier-return buffer.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/freedom-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/freedom-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/freedom-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/freedom-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Freedom_of_the_Seas_at_Port_Miami_(March_15,_2024).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:harmony-of-the-seas",
    "shipSlug": "harmony-of-the-seas",
    "shipName": "Harmony of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Oasis Class",
    "passengerCapacity": 5479,
    "debutYear": 2016,
    "homeports": [
      "Galveston, TX",
      "Port Canaveral, FL",
      "Barcelona, Spain"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/harmony-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Harmony of the Seas is an Oasis-class Royal Caribbean ship featuring seven distinct neighborhoods across Western Caribbean, Bahamas, and seasonal Mediterranean deployments.",
    "dockAndTimingGuidance": "Allow extra walking time along long deep-water piers in Cozumel, Roatán, and Costa Maya and return at least 2 hours before ship departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 2,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/harmony-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/harmony-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/harmony-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/harmony-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Harmony_of_the_Seas_im_Hafen_von_Philipsburg.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:icon-of-the-seas",
    "shipSlug": "icon-of-the-seas",
    "shipName": "Icon of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": true,
    "shipClass": "Icon Class",
    "passengerCapacity": 5610,
    "debutYear": 2024,
    "homeports": [
      "Miami, FL"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Icon of the Seas is Royal Caribbean revolutionary flagship, introducing Category 6 waterpark and sailing year-round 7-night Eastern and Western Caribbean voyages.",
    "dockAndTimingGuidance": "For independent shore excursions from Icon of the Seas, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 7,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Icon_of_the_Seas_(kahunapulej).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:independence-of-the-seas",
    "shipSlug": "independence-of-the-seas",
    "shipName": "Independence of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Freedom Class",
    "passengerCapacity": 3858,
    "debutYear": 2008,
    "homeports": [
      "Miami, FL",
      "Southampton, UK"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/independence-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Independence of the Seas is a Freedom-class Royal Caribbean liner sailing Eastern and Western Caribbean itineraries from Miami and Northern Europe seasons from Southampton.",
    "dockAndTimingGuidance": "Whether docking at Charlotte Amalie, San Juan, or Cozumel, plan independent shore excursions to finish at the pier 2 hours before all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 2,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/independence-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/independence-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/independence-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/independence-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Independence_of_the_Seas_at_Port_Miami_(March_15,_2024).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:koningsdam",
    "shipSlug": "koningsdam",
    "shipName": "Koningsdam",
    "cruiseLine": "Holland America Line",
    "canonicalLineCode": "hal",
    "inCuratedFleet": true,
    "shipClass": "Pinnacle Class",
    "passengerCapacity": 2650,
    "debutYear": 2016,
    "homeports": [
      "Vancouver, BC"
    ],
    "specSourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships",
    "specSourceName": "Holland America Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "The flagship of Holland America’s Vancouver fleet, known for high-end dining, classical music venues, and classic 7-day Inside Passage roundtrips.",
    "dockAndTimingGuidance": "For independent shore excursions from Koningsdam, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 6,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Koningsdam_(ship,_2016)_015.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:lagoon-420-catamaran-dalmatia",
    "shipSlug": "lagoon-420-catamaran-dalmatia",
    "shipName": "Lagoon 420 Catamaran Dalmatia",
    "cruiseLine": "GaySail Catamaran & Yacht Fleet",
    "canonicalLineCode": "gaysail",
    "inCuratedFleet": false,
    "shipClass": null,
    "passengerCapacity": 10,
    "debutYear": null,
    "homeports": [
      "Split, Croatia"
    ],
    "specSourceUrl": null,
    "specSourceName": null,
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Boutique 42-foot sailing catamaran chartered by GaySail for small-group Dalmatian Coast island-hopping voyages from Split.",
    "dockAndTimingGuidance": "Small-yacht skipper routes adjust daily to Adriatic winds and marina berths rather than fixed commercial cruise-pier schedules.",
    "isIndexable": false,
    "robotsDirective": "noindex, follow",
    "holdReasonCodes": [
      "unverified_ship_facts"
    ],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/white-and-blue-concrete-buildings-near-sea-1533105079780",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:lagoon-520-catamaran-phuket",
    "shipSlug": "lagoon-520-catamaran-phuket",
    "shipName": "Lagoon 520 Catamaran Phuket",
    "cruiseLine": "GaySail Catamaran & Yacht Fleet",
    "canonicalLineCode": "gaysail",
    "inCuratedFleet": false,
    "shipClass": null,
    "passengerCapacity": 12,
    "debutYear": null,
    "homeports": [
      "Phuket, Thailand"
    ],
    "specSourceUrl": null,
    "specSourceName": null,
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Boutique 52-foot sailing catamaran chartered by GaySail for Andaman Sea and Phi Phi / Phang Nga Bay island voyages from Phuket.",
    "dockAndTimingGuidance": "Catamaran beach landings use dinghy transfers timed by the skipper around Andaman tide states.",
    "isIndexable": false,
    "robotsDirective": "noindex, follow",
    "holdReasonCodes": [
      "unverified_ship_facts"
    ],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/1503899036084-c55cdd92da26",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:liberty-of-the-seas",
    "shipSlug": "liberty-of-the-seas",
    "shipName": "Liberty of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Freedom Class",
    "passengerCapacity": 3634,
    "debutYear": 2007,
    "homeports": [
      "Galveston, TX",
      "Cape Liberty (Bayonne), NJ",
      "Fort Lauderdale, FL"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/liberty-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Liberty of the Seas is a Freedom-class Royal Caribbean vessel sailing Bermuda, Canada/New England, Bahamas, and Western Caribbean itineraries.",
    "dockAndTimingGuidance": "At Royal Naval Dockyard (Bermuda) and Halifax/Saint John calls, account for ferry or regional road traffic and maintain a 2-hour return buffer.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 3,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/liberty-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/liberty-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/liberty-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/liberty-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/a-beach-with-palm-trees-and-the-ocean-in-the-background-Ox_6M68VqfQ",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:mariner-of-the-seas",
    "shipSlug": "mariner-of-the-seas",
    "shipName": "Mariner of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Voyager Class",
    "passengerCapacity": 3344,
    "debutYear": 2003,
    "homeports": [
      "Galveston, TX",
      "New Orleans, LA"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/mariner-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Mariner of the Seas is a Voyager-class Royal Caribbean ship operating Western Caribbean voyages and themed festival charters from Texas and Gulf Coast homeports.",
    "dockAndTimingGuidance": "Galveston Pier 10 and Cozumel International Pier calls run smoothly when independent groups target a 2-hour pier-return cushion.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 3,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/mariner-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/mariner-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/mariner-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/mariner-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Mariner_of_the_Seas_cruise_ship.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:mein-schiff-2",
    "shipSlug": "mein-schiff-2",
    "shipName": "Mein Schiff 2",
    "cruiseLine": "TUI Cruises (Mein Schiff)",
    "canonicalLineCode": "tui",
    "inCuratedFleet": false,
    "shipClass": "Neue Mein Schiff Class",
    "passengerCapacity": 2894,
    "debutYear": 2019,
    "homeports": [
      "Palma de Mallorca, Spain",
      "Las Palmas, Gran Canaria"
    ],
    "specSourceUrl": "https://www.meinschiff.com/de/flotte/mein-schiff-2",
    "specSourceName": "TUI Cruises (Mein Schiff) Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Mein Schiff 2 is TUI Cruises’ German-speaking premium resort ship sailing Western Mediterranean, Canary Islands, and official cruise-line-produced Rainbow Cruise voyages.",
    "dockAndTimingGuidance": "Western Mediterranean ports (Palma, Marseille, Corsica, Civitavecchia) often use port shuttle buses from commercial quays; keep a 2-hour return buffer.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.meinschiff.com/de/flotte/mein-schiff-2",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.meinschiff.com/de/flotte/mein-schiff-2",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.meinschiff.com/de/flotte/mein-schiff-2",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.meinschiff.com/de/flotte/mein-schiff-2",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/white-and-blue-concrete-buildings-near-sea-1533105079780",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:msc-poesia",
    "shipSlug": "msc-poesia",
    "shipName": "MSC Poesia",
    "cruiseLine": "MSC Cruises",
    "canonicalLineCode": "msc",
    "inCuratedFleet": false,
    "shipClass": "Musica Class",
    "passengerCapacity": 2550,
    "debutYear": 2008,
    "homeports": [
      "Seattle, WA",
      "Miami, FL",
      "Warnemünde, Germany"
    ],
    "specSourceUrl": "https://www.msccruises.com/int/our-cruises/ships/msc-poesia",
    "specSourceName": "MSC Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "MSC Poesia is a Musica-class MSC ocean liner deployed across Northern Europe, Alaska, Panama Canal, and European full-ship electronic music charters.",
    "dockAndTimingGuidance": "European charter calls and Baltic/Mediterranean ports require passport/port-pass checks at pier gates; return to the terminal at least 2 hours before departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships/msc-poesia",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships/msc-poesia",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships/msc-poesia",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships/msc-poesia",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:MSC_Poesia_near_Copenhagen,_20220618_1828_7372.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:msc-seashore",
    "shipSlug": "msc-seashore",
    "shipName": "MSC Seashore",
    "cruiseLine": "MSC Cruises",
    "canonicalLineCode": "msc",
    "inCuratedFleet": true,
    "shipClass": "Seaside EVO Class",
    "passengerCapacity": 5632,
    "debutYear": 2021,
    "homeports": [
      "Port Canaveral, FL",
      "Miami, FL"
    ],
    "specSourceUrl": "https://www.msccruises.com/int/our-cruises/ships",
    "specSourceName": "MSC Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "MSC Seashore brings glamorous modern Mediterranean design, expansive oceanfront promenades, and high-frequency sailings to the Bahamas and Western Caribbean.",
    "dockAndTimingGuidance": "For independent shore excursions from MSC Seashore, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:USA-2016-Puerto_Rico-San_Juan-Castillo_San_Felipe_del_Morro_(and_lighthouse)_03.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:msc-world-america",
    "shipSlug": "msc-world-america",
    "shipName": "MSC World America",
    "cruiseLine": "MSC Cruises",
    "canonicalLineCode": "msc",
    "inCuratedFleet": true,
    "shipClass": "World Class",
    "passengerCapacity": 6762,
    "debutYear": 2025,
    "homeports": [
      "Miami, FL"
    ],
    "specSourceUrl": "https://www.msccruises.com/int/our-cruises/ships",
    "specSourceName": "MSC Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "MSC World America is a state-of-the-art LNG-powered mega-liner sailing from PortMiami with immersive district neighborhoods and stops at Ocean Cay.",
    "dockAndTimingGuidance": "For independent shore excursions from MSC World America, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.msccruises.com/int/our-cruises/ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:MSC_World_America_(cropped).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:navigator-of-the-seas",
    "shipSlug": "navigator-of-the-seas",
    "shipName": "Navigator of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Voyager Class",
    "passengerCapacity": 3386,
    "debutYear": 2002,
    "homeports": [
      "Los Angeles (San Pedro), CA"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/navigator-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Navigator of the Seas is Royal Caribbean’s West Coast Voyager-class ship sailing Catalina Island, Ensenada, Cabo San Lucas, Mazatlán, and Puerto Vallarta from Los Angeles.",
    "dockAndTimingGuidance": "Cabo San Lucas and Catalina Island (Avalon) are tender ports where return boat queues build in the afternoon; board return tenders at least 2 hours before departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/navigator-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/navigator-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/navigator-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/navigator-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Navigator_of_the_Seas_(ship,_2002)_Departs_San_Pedro_(Port_of_Los_Angeles),_California_(December_2025).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:nieuw-statendam",
    "shipSlug": "nieuw-statendam",
    "shipName": "Nieuw Statendam",
    "cruiseLine": "Holland America Line",
    "canonicalLineCode": "hal",
    "inCuratedFleet": false,
    "shipClass": "Pinnacle Class",
    "passengerCapacity": 2666,
    "debutYear": 2018,
    "homeports": [
      "Fort Lauderdale, FL",
      "Rotterdam, Netherlands"
    ],
    "specSourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/nieuw-statendam",
    "specSourceName": "Holland America Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Nieuw Statendam is a Pinnacle-class Holland America Line ship built around live-music venues (Rolling Stone Rock Room, B.B. King’s Blues Club) across Europe and the Caribbean.",
    "dockAndTimingGuidance": "Northern European fjord/harbor berths and Caribbean calls both follow strict pilot departure slots; maintain a 2-hour return margin before all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/nieuw-statendam",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/nieuw-statendam",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/nieuw-statendam",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/nieuw-statendam",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:NIEUW_STATENDAM_(49895575701).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-bliss",
    "shipSlug": "norwegian-bliss",
    "shipName": "Norwegian Bliss",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": true,
    "shipClass": "Breakaway Plus Class",
    "passengerCapacity": 4004,
    "debutYear": 2018,
    "homeports": [
      "Seattle, WA"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Custom-built for Alaska cruising with a 20,000-sq-ft Observation Lounge and outdoor viewing decks.",
    "dockAndTimingGuidance": "For independent shore excursions from Norwegian Bliss, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/snow-capped-mountains-and-a-glacier-fill-the-landscape-r3nRotY8cQw",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-breakaway",
    "shipSlug": "norwegian-breakaway",
    "shipName": "Norwegian Breakaway",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": false,
    "shipClass": "Breakaway Class",
    "passengerCapacity": 3963,
    "debutYear": 2013,
    "homeports": [
      "New York, NY",
      "Boston, MA",
      "Miami, FL",
      "New Orleans, LA"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships/norwegian-breakaway",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Norwegian Breakaway features a quarter-mile oceanfront Waterfront promenade and sails Caribbean, Bermuda, Canada/New England, and Mediterranean itineraries.",
    "dockAndTimingGuidance": "Large Breakaway-class passenger loads mean peak tender/shuttle demand at Great Stirrup Cay and Harvest Caye; target a 2-hour return cushion on independent port days.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 5,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-breakaway",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-breakaway",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-breakaway",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-breakaway",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Norwegian_Cruise_Line%27s_Norwegian_Breakaway_departs_Manhattan_and_heads_south_down_the_Hudson_River._(30917575650).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-encore",
    "shipSlug": "norwegian-encore",
    "shipName": "Norwegian Encore",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": true,
    "shipClass": "Breakaway Plus Class",
    "passengerCapacity": 3998,
    "debutYear": 2019,
    "homeports": [
      "Seattle, WA"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "The flagship of NCL’s Alaska fleet, featuring the Observation Lounge, race track, and Seattle roundtrips.",
    "dockAndTimingGuidance": "For independent shore excursions from Norwegian Encore, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/snow-capped-mountains-and-a-glacier-fill-the-landscape-r3nRotY8cQw",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-epic",
    "shipSlug": "norwegian-epic",
    "shipName": "Norwegian Epic",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": false,
    "shipClass": "Epic Class",
    "passengerCapacity": 4100,
    "debutYear": 2010,
    "homeports": [
      "San Juan, PR",
      "Rome (Civitavecchia), Italy",
      "Port Canaveral, FL"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships/norwegian-epic",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Norwegian Epic is a high-entertainment Norwegian liner with dedicated solo Studio staterooms sailing port-intensive Southern Caribbean routes from San Juan and Mediterranean summers.",
    "dockAndTimingGuidance": "Port-intensive Southern Caribbean weeks visit a new island almost daily; confirm local vs. ship time and return to the pier 2 hours prior to departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-epic",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-epic",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-epic",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-epic",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Norwegian_Cruise_Line%27s_Norwegian_Epic_at_anchor_in_Cannes_bay,_July_2018.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-escape",
    "shipSlug": "norwegian-escape",
    "shipName": "Norwegian Escape",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": false,
    "shipClass": "Breakaway Plus Class",
    "passengerCapacity": 4266,
    "debutYear": 2015,
    "homeports": [
      "New Orleans, LA",
      "Miami, FL",
      "Port Canaveral, FL"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships/norwegian-escape",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Norwegian Escape is a Breakaway Plus-class ship sailing Western and Eastern Caribbean itineraries from New Orleans, Miami, and Port Canaveral.",
    "dockAndTimingGuidance": "At Costa Maya, Cozumel, Roatán, and Harvest Caye, allow extra walking time down multi-berth piers and return 2 hours before departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-escape",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-escape",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-escape",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-escape",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:2023-03-04_01_NORWEGIAN_ESCAPE_-_IMO_9677076_-_Port_Canaveral_FL_USA.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-jade",
    "shipSlug": "norwegian-jade",
    "shipName": "Norwegian Jade",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": false,
    "shipClass": "Jewel Class",
    "passengerCapacity": 2402,
    "debutYear": 2006,
    "homeports": [
      "Tampa, FL",
      "Miami, FL",
      "Whittier, AK",
      "San Diego, CA"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships/norwegian-jade",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Norwegian Jade is a versatile 2,402-guest Jewel-class ship favored for Sixthman music festival charters as well as Alaska, Panama Canal, and Mexican Riviera voyages.",
    "dockAndTimingGuidance": "Mid-sized Jewel-class dimensions enable central harbor berthing and smooth charter gangway flow; keep a 2-hour pier buffer on all independent shore excursions.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-jade",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-jade",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-jade",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-jade",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Norwegian_Jade_(ship,_2006)_IMO_9304057;_in_Split,_2011-10-10;_(4).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-jewel",
    "shipSlug": "norwegian-jewel",
    "shipName": "Norwegian Jewel",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": true,
    "shipClass": "Jewel Class",
    "passengerCapacity": 2376,
    "debutYear": 2005,
    "homeports": [
      "Seattle, WA",
      "Vancouver, BC",
      "Seward, AK"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "The Norwegian Jewel is a mid-sized Alaska favorite offering classic Inside Passage and Gulf of Alaska itineraries.",
    "dockAndTimingGuidance": "For independent shore excursions from Norwegian Jewel, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 12,
    "upcomingHostedSailingCount": 14,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Norwegian_Jewel_Georgetown.JPG",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-joy",
    "shipSlug": "norwegian-joy",
    "shipName": "Norwegian Joy",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": false,
    "shipClass": "Breakaway Plus Class",
    "passengerCapacity": 3804,
    "debutYear": 2017,
    "homeports": [
      "Miami, FL",
      "Port Canaveral, FL",
      "Seattle, WA",
      "Los Angeles, CA"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships/norwegian-joy",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Norwegian Joy is a Breakaway Plus-class ship featuring an expansive Observation Lounge across Alaska Inside Passage seasons, Panama Canal transits, and major Miami music charters.",
    "dockAndTimingGuidance": "In Ward Cove (Ketchikan) and Icy Strait Point, account for shuttle/gondola transit times and maintain a 2-hour return buffer before all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 3,
    "upcomingHostedSailingCount": 3,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-joy",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-joy",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-joy",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-joy",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:NCL_Norwegian_Joy.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-luna",
    "shipSlug": "norwegian-luna",
    "shipName": "Norwegian Luna",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": false,
    "shipClass": "Prima Plus Class",
    "passengerCapacity": 3565,
    "debutYear": 2026,
    "homeports": [
      "Miami, FL"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships/norwegian-luna",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Norwegian Luna is Norwegian Cruise Line’s Prima Plus-class sister ship to Norwegian Aqua, sailing round-trip Caribbean and Bahamas itineraries from PortMiami.",
    "dockAndTimingGuidance": "PortMiami Terminal B (The Pearl of Miami) and calls at Puerto Plata, St. Thomas, and Tortola dock pierside; preserve a 2-hour pre-departure pier buffer.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-luna",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-luna",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-luna",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-luna",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:LunaMiamiApr252006.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-pearl",
    "shipSlug": "norwegian-pearl",
    "shipName": "Norwegian Pearl",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": false,
    "shipClass": "Jewel Class",
    "passengerCapacity": 2394,
    "debutYear": 2006,
    "homeports": [
      "Miami, FL",
      "Boston, MA",
      "Athens (Piraeus), Greece"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships/norwegian-pearl",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Norwegian Pearl is the iconic Jewel-class home of Sixthman live-music charters from Miami—featuring a tiered pool-deck concert stage—plus Mediterranean and Bermuda seasons.",
    "dockAndTimingGuidance": "On festival charter port days (Cozumel, Costa Maya, Nassau, Great Stirrup Cay), check late-night concert schedules alongside a 2-hour return margin before sail-away.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-pearl",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-pearl",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-pearl",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-pearl",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Norwegian_Pearl_Cruise_Ship_of_Norwegian_Cruise_Line_in_PortMiami_Florida.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-star",
    "shipSlug": "norwegian-star",
    "shipName": "Norwegian Star",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": false,
    "shipClass": "Dawn Class",
    "passengerCapacity": 2348,
    "debutYear": 2001,
    "homeports": [
      "Tampa, FL",
      "Lisbon, Portugal",
      "Southampton, UK",
      "Buenos Aires, Argentina"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships/norwegian-star",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Norwegian Star is a classic 2,348-guest Dawn-class ship sailing destination-intensive Iberian, British Isles, Iceland, South American, and Western Caribbean routes.",
    "dockAndTimingGuidance": "Tender ports in the British Isles, Iceland, and Western Caribbean depend on tidal and weather windows; plan independent returns 2 hours ahead of departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-star",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-star",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-star",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships/norwegian-star",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kopenhagen_(DK),_Nyhavn_--_2017_--_1538.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:norwegian-viva",
    "shipSlug": "norwegian-viva",
    "shipName": "Norwegian Viva",
    "cruiseLine": "Norwegian Cruise Line",
    "canonicalLineCode": "ncl",
    "inCuratedFleet": true,
    "shipClass": "Prima Class",
    "passengerCapacity": 3219,
    "debutYear": 2023,
    "homeports": [
      "San Juan, PR",
      "Miami, FL",
      "Galveston, TX"
    ],
    "specSourceUrl": "https://www.ncl.com/cruise-ships",
    "specSourceName": "Norwegian Cruise Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Norwegian Viva is NCL cutting-edge Prima-class vessel featuring Ocean Boulevard wrap-around promenade and upscale contemporary design.",
    "dockAndTimingGuidance": "For independent shore excursions from Norwegian Viva, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.ncl.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/a-view-of-a-bay-with-boats-in-the-water-ZBIBsFg6SaM",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:oasis-of-the-seas",
    "shipSlug": "oasis-of-the-seas",
    "shipName": "Oasis of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Oasis Class",
    "passengerCapacity": 5606,
    "debutYear": 2009,
    "homeports": [
      "Fort Lauderdale, FL",
      "Cape Liberty (Bayonne), NJ"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/oasis-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Oasis of the Seas pioneered Royal Caribbean’s split-superstructure Oasis class and sails Southern/Eastern Caribbean voyages, Bahamas routes, and full-ship charters.",
    "dockAndTimingGuidance": "With 5,600+ guests onboard, allow extra gangway and security screening time by returning to the port gate at least 2 hours before departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/oasis-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/oasis-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/oasis-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/oasis-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Oasis_of_the_Seas_Departs_Port_Canaveral_(September_2026).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:pure-amazon",
    "shipSlug": "pure-amazon",
    "shipName": "Pure Amazon",
    "cruiseLine": "Abercrombie & Kent",
    "canonicalLineCode": "ak",
    "inCuratedFleet": false,
    "shipClass": null,
    "passengerCapacity": 22,
    "debutYear": 2025,
    "homeports": [
      "Iquitos, Peru"
    ],
    "specSourceUrl": null,
    "specSourceName": null,
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Pure Amazon is Abercrombie & Kent’s boutique 22-guest expedition riverboat navigating the Pacaya-Samiria National Reserve in the Peruvian Amazon.",
    "dockAndTimingGuidance": "All skiff excursions in the Amazon headwaters are naturalist-escorted directly from the expedition riverboat.",
    "isIndexable": false,
    "robotsDirective": "noindex, follow",
    "holdReasonCodes": [
      "unverified_ship_facts"
    ],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:A_Postcard_From_Cabo_San_Lucas_(56014870).jpeg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:quantum-of-the-seas",
    "shipSlug": "quantum-of-the-seas",
    "shipName": "Quantum of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": true,
    "shipClass": "Quantum Class",
    "passengerCapacity": 4180,
    "debutYear": 2014,
    "homeports": [
      "Seattle, WA"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Features the North Star observation capsule and expansive indoor viewing spaces for Seattle-based Alaska sailings.",
    "dockAndTimingGuidance": "For independent shore excursions from Quantum of the Seas, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/snow-capped-mountains-and-a-glacier-fill-the-landscape-r3nRotY8cQw",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:resilient-lady",
    "shipSlug": "resilient-lady",
    "shipName": "Resilient Lady",
    "cruiseLine": "Virgin Voyages",
    "canonicalLineCode": "vv",
    "inCuratedFleet": false,
    "shipClass": "Lady Ships Class (18+)",
    "passengerCapacity": 2770,
    "debutYear": 2023,
    "homeports": [
      "San Juan, PR",
      "Athens (Piraeus), Greece",
      "Miami, FL"
    ],
    "specSourceUrl": "https://www.virginvoyages.com/ships/resilient-lady",
    "specSourceName": "Virgin Voyages Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Resilient Lady is Virgin Voyages’ adults-only Lady-class vessel sailing Greek Isles, Adriatic, and Southern Caribbean itineraries from San Juan and Miami.",
    "dockAndTimingGuidance": "Greek island tender calls (Mykonos, Santorini) and Old San Juan Pier 4 turnarounds require buffer awareness; target a 2-hour pier-return cushion.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/resilient-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/resilient-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/resilient-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.virginvoyages.com/ships/resilient-lady",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Virgin_Voyages_Resilient_Lady.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:rhapsody-of-the-seas",
    "shipSlug": "rhapsody-of-the-seas",
    "shipName": "Rhapsody of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Vision Class",
    "passengerCapacity": 2040,
    "debutYear": 1997,
    "homeports": [
      "San Juan, PR",
      "Tampa, FL"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/rhapsody-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Rhapsody of the Seas is a sunlit Vision-class Royal Caribbean ship accessing smaller Southern Caribbean and Central American ports from San Juan and Tampa.",
    "dockAndTimingGuidance": "Smaller Vision-class berthing reaches downtown piers in St. Croix, St. Kitts, and Barbados; keep a standard 2-hour return margin before all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/rhapsody-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/rhapsody-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/rhapsody-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/rhapsody-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Rhapsody_of_the_Seas_moored_at_quay_in_Port_of_Rhodes_27_August_2023.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:ruby-princess",
    "shipSlug": "ruby-princess",
    "shipName": "Ruby Princess",
    "cruiseLine": "Princess Cruises",
    "canonicalLineCode": "pcl",
    "inCuratedFleet": false,
    "shipClass": "Crown Class",
    "passengerCapacity": 3080,
    "debutYear": 2008,
    "homeports": [
      "San Francisco, CA",
      "Vancouver, BC"
    ],
    "specSourceUrl": "https://www.princess.com/ships-and-experience/ships/ru-ruby-princess",
    "specSourceName": "Princess Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Ruby Princess sails round-trip from San Francisco’s Pier 27 to Alaska, Hawaii, Mexico, and the California Coast without domestic flights for Bay Area travelers.",
    "dockAndTimingGuidance": "Embarcadero Pier 27 in San Francisco and tender calls in Santa Barbara, Cabo San Lucas, or Sitka require a 2-hour return cushion before departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships/ru-ruby-princess",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships/ru-ruby-princess",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships/ru-ruby-princess",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships/ru-ruby-princess",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ruby_Princess_(ship,_2008)_IMO_9378462;_in_Split,_2011-10-17_(2).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:scarlet-lady",
    "shipSlug": "scarlet-lady",
    "shipName": "Scarlet Lady",
    "cruiseLine": "Virgin Voyages",
    "canonicalLineCode": "vv",
    "inCuratedFleet": false,
    "shipClass": "Lady Ships Class (18+)",
    "passengerCapacity": 2770,
    "debutYear": 2021,
    "homeports": [
      "Miami, FL",
      "Barcelona, Spain",
      "Portsmouth, UK"
    ],
    "specSourceUrl": "https://www.virginvoyages.com/ships/scarlet-lady",
    "specSourceName": "Virgin Voyages Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Scarlet Lady is Virgin Voyages’ inaugural 18+ flagship sailing Miami–Key West–Bimini voyages, Mediterranean summers, and full-ship LGBTQ+ and music charters.",
    "dockAndTimingGuidance": "Terminal V at PortMiami and Beach Club at Bimini tram transfers run on dedicated schedules; return to the ship 2 hours ahead of departure on independent tours.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 4,
    "upcomingHostedSailingCount": 4,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/scarlet-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/scarlet-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/scarlet-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.virginvoyages.com/ships/scarlet-lady",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Scarlet_Lady_in_Liverpool_February_2020.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:ss-elisabeth",
    "shipSlug": "ss-elisabeth",
    "shipName": "S.S. Elisabeth",
    "cruiseLine": "Uniworld Boutique River Cruises",
    "canonicalLineCode": "uniworld",
    "inCuratedFleet": false,
    "shipClass": null,
    "passengerCapacity": 110,
    "debutYear": 2025,
    "homeports": [
      "Basel, Switzerland",
      "Amsterdam, Netherlands"
    ],
    "specSourceUrl": null,
    "specSourceName": null,
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "S.S. Elisabeth is a Uniworld Super Ship riverboat operating luxury Rhine River charters and hosted river programs.",
    "dockAndTimingGuidance": "Rhine riverfront quays in Cologne, Rüdesheim, and Breisach moor near historic town centers; verify exact rafted-berth departure times onboard.",
    "isIndexable": false,
    "robotsDirective": "noindex, follow",
    "holdReasonCodes": [
      "unverified_ship_facts"
    ],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kopenhagen_(DK),_Nyhavn_--_2017_--_1538.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:star-explorer",
    "shipSlug": "star-explorer",
    "shipName": "Star Explorer",
    "cruiseLine": "Windstar Cruises",
    "canonicalLineCode": "windstar",
    "inCuratedFleet": false,
    "shipClass": null,
    "passengerCapacity": 224,
    "debutYear": 2027,
    "homeports": [
      "Athens (Piraeus), Greece",
      "Barcelona, Spain"
    ],
    "specSourceUrl": null,
    "specSourceName": null,
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Star Explorer is Windstar Cruises’ all-suite motor yacht scheduled to enter Mediterranean and European small-harbor service.",
    "dockAndTimingGuidance": "Small-ship motor yachts access inner harbors and tender anchorages unavailable to large ocean liners; check daily tender schedules onboard.",
    "isIndexable": false,
    "robotsDirective": "noindex, follow",
    "holdReasonCodes": [
      "unverified_ship_facts"
    ],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/white-and-blue-concrete-buildings-near-sea-1533105079780",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:star-of-the-seas",
    "shipSlug": "star-of-the-seas",
    "shipName": "Star of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Icon Class",
    "passengerCapacity": 5610,
    "debutYear": 2025,
    "homeports": [
      "Port Canaveral, FL"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/star-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Star of the Seas is Royal Caribbean’s second Icon-class mega-ship, sailing 7-night Eastern and Western Caribbean itineraries from Port Canaveral including Perfect Day at CocoCay.",
    "dockAndTimingGuidance": "Icon-class passenger scale makes early return essential at St. Thomas, St. Maarten, Cozumel, and Roatán—target the pier gate 2 hours before departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/star-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/star-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/star-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/star-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:USA-2016-Puerto_Rico-San_Juan-Castillo_San_Felipe_del_Morro_(and_lighthouse)_03.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:star-princess",
    "shipSlug": "star-princess",
    "shipName": "Star Princess",
    "cruiseLine": "Princess Cruises",
    "canonicalLineCode": "pcl",
    "inCuratedFleet": false,
    "shipClass": "Sphere Class",
    "passengerCapacity": 4300,
    "debutYear": 2025,
    "homeports": [
      "Fort Lauderdale, FL",
      "Seattle, WA"
    ],
    "specSourceUrl": "https://www.princess.com/ships-and-experience/ships/st-star-princess",
    "specSourceName": "Princess Cruises Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Star Princess is Princess Cruises’ second LNG-powered Sphere-class flagship featuring The Dome and Piazza across Caribbean winter and Alaska Inside Passage summer seasons.",
    "dockAndTimingGuidance": "In Ketchikan, Juneau, and Skagway as well as Caribbean ports, plan independent excursions to wrap up at least 2 hours prior to all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 3,
    "upcomingHostedSailingCount": 0,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships/st-star-princess",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships/st-star-princess",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships/st-star-princess",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.princess.com/ships-and-experience/ships/st-star-princess",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Roca_de_New_Eddystone,_famoso_islote_de_referencia_en_el_fiordo_Misty._Monumento_Nacional_de_Alaska..jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:symphony-of-the-seas",
    "shipSlug": "symphony-of-the-seas",
    "shipName": "Symphony of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": true,
    "shipClass": "Oasis Class",
    "passengerCapacity": 5518,
    "debutYear": 2018,
    "homeports": [
      "Miami, FL",
      "Port Canaveral, FL",
      "Galveston, TX"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Symphony of the Seas is an Oasis-class marvel with 7 neighborhood zones sailing premier Western and Eastern Caribbean itineraries.",
    "dockAndTimingGuidance": "For independent shore excursions from Symphony of the Seas, Cruise Promenade applies a conservative 2-hour (120-minute) pier-return buffer ahead of posted all-aboard times across all port calls.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 7,
    "upcomingHostedSailingCount": 4,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:SymphonyOfTheSeas_(cropped_3-2).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:valiant-lady",
    "shipSlug": "valiant-lady",
    "shipName": "Valiant Lady",
    "cruiseLine": "Virgin Voyages",
    "canonicalLineCode": "vv",
    "inCuratedFleet": false,
    "shipClass": "Lady Ships Class (18+)",
    "passengerCapacity": 2770,
    "debutYear": 2022,
    "homeports": [
      "Miami, FL",
      "San Juan, PR"
    ],
    "specSourceUrl": "https://www.virginvoyages.com/ships/valiant-lady",
    "specSourceName": "Virgin Voyages Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Valiant Lady is Virgin Voyages’ adults-only Lady-class ship operating Dominican Daze, Western Caribbean Charm, and Southern Caribbean routes from Miami and San Juan.",
    "dockAndTimingGuidance": "At Taino Bay (Puerto Plata), Roatán, and Bimini, verify ship vs. local island time and maintain a 2-hour pier-return buffer.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/valiant-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/valiant-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.virginvoyages.com/ships/valiant-lady",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.virginvoyages.com/ships/valiant-lady",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Valiant_Lady_no_peirao_da_Coru%C3%B1a_1.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:voyager-of-the-seas",
    "shipSlug": "voyager-of-the-seas",
    "shipName": "Voyager of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Voyager Class",
    "passengerCapacity": 3602,
    "debutYear": 1999,
    "homeports": [
      "Port Canaveral, FL",
      "Brisbane, Australia",
      "Ravenna, Italy"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/voyager-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Voyager of the Seas launched Royal Caribbean’s Royal Promenade concept and sails Caribbean, Mediterranean, and South Pacific itineraries.",
    "dockAndTimingGuidance": "Allow 2 hours before posted ship departure when coordinating independent group shore excursions across Caribbean or South Pacific ports.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 2,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/voyager-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/voyager-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/voyager-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/voyager-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Voyager_of_the_Seas_Costa_Maya_2023.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:westerdam",
    "shipSlug": "westerdam",
    "shipName": "Westerdam",
    "cruiseLine": "Holland America Line",
    "canonicalLineCode": "hal",
    "inCuratedFleet": false,
    "shipClass": "Vista Class",
    "passengerCapacity": 1964,
    "debutYear": 2004,
    "homeports": [
      "Seattle, WA",
      "Yokohama (Tokyo), Japan",
      "Singapore"
    ],
    "specSourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/westerdam",
    "specSourceName": "Holland America Line Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Holland America Line’s Vista-class Westerdam carries 1,964 guests on scenic Alaska Hubbard Glacier / Glacier Bay voyages and extended Asia-Pacific seasons.",
    "dockAndTimingGuidance": "Asian commercial container/cruise terminals (Yokohama, Kobe, Busan) and Alaska tender ports require shuttle buffer time; return 2 hours before all-aboard.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/westerdam",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/westerdam",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/westerdam",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.hollandamerica.com/en/us/cruise-ships/westerdam",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Westerdam_in_Canada_2022.jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:wind-star",
    "shipSlug": "wind-star",
    "shipName": "Wind Star",
    "cruiseLine": "Windstar Cruises",
    "canonicalLineCode": "windstar",
    "inCuratedFleet": false,
    "shipClass": null,
    "passengerCapacity": 148,
    "debutYear": 1986,
    "homeports": [
      "Papeete, Tahiti"
    ],
    "specSourceUrl": null,
    "specSourceName": null,
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Wind Star is Windstar Cruises’ four-masted 148-guest motor-sailing yacht operating French Polynesia lagoon voyages across Tahiti, Moorea, and Bora Bora.",
    "dockAndTimingGuidance": "Polynesian motu and lagoon calls rely on yacht tender launches; confirm final tender return times before heading ashore.",
    "isIndexable": false,
    "robotsDirective": "noindex, follow",
    "holdReasonCodes": [
      "unverified_ship_facts"
    ],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/1503899036084-c55cdd92da26",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:wonder-of-the-seas",
    "shipSlug": "wonder-of-the-seas",
    "shipName": "Wonder of the Seas",
    "cruiseLine": "Royal Caribbean",
    "canonicalLineCode": "rccl",
    "inCuratedFleet": false,
    "shipClass": "Oasis Class",
    "passengerCapacity": 5734,
    "debutYear": 2022,
    "homeports": [
      "Miami, FL",
      "Port Canaveral, FL"
    ],
    "specSourceUrl": "https://www.royalcaribbean.com/cruise-ships/wonder-of-the-seas",
    "specSourceName": "Royal Caribbean Official Fleet Specification",
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "Wonder of the Seas is an eight-neighborhood Oasis-class Royal Caribbean ship operating Bahamas and Caribbean itineraries from Miami and Port Canaveral.",
    "dockAndTimingGuidance": "Account for Oasis-class pier length and security lines at Nassau and Perfect Day at CocoCay; return to the gangway 2 hours before departure.",
    "isIndexable": true,
    "robotsDirective": "index, follow",
    "holdReasonCodes": [],
    "upcomingPhysicalSailingCount": 1,
    "upcomingHostedSailingCount": 1,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/wonder-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/wonder-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "cruise_line_first_party",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/wonder-of-the-seas",
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": "https://www.royalcaribbean.com/cruise-ships/wonder-of-the-seas",
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Wonder_of_the_Seas_in_M%C3%A1laga_Port_01_(cropped).jpg",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  },
  {
    "shipId": "ship:world-traveller",
    "shipSlug": "world-traveller",
    "shipName": "World Traveller",
    "cruiseLine": "Atlas Ocean Voyages",
    "canonicalLineCode": "atlas",
    "inCuratedFleet": false,
    "shipClass": null,
    "passengerCapacity": 198,
    "debutYear": 2022,
    "homeports": [
      "Ushuaia, Argentina",
      "CivitaVecchia, Italy"
    ],
    "specSourceUrl": null,
    "specSourceName": null,
    "specVerifiedAt": "2026-11-16T16:00:00Z",
    "containsDeckPlansOrProprietaryMedia": false,
    "summaryDescription": "World Traveller is Atlas Ocean Voyages’ polar-class expedition yacht operating Antarctica, Mediterranean, and boutique hosted charter expeditions.",
    "dockAndTimingGuidance": "Polar Zodiac landings and expedition anchorages are governed by IAATO and weather protocols managed by the onboard expedition team.",
    "isIndexable": false,
    "robotsDirective": "noindex, follow",
    "holdReasonCodes": [
      "unverified_ship_facts"
    ],
    "upcomingPhysicalSailingCount": 0,
    "upcomingHostedSailingCount": 2,
    "fieldProvenance": {
      "shipIdentity": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "vesselHardwareSpecs": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "homeports": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "facts_only_rewritten_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "editorialSummaryAndDockGuidance": {
        "sourceAuthority": "dcc_editorial_synthesis",
        "sourceUrl": null,
        "usageRights": "dcc_original_editorial",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      },
      "heroVisualAsset": {
        "sourceAuthority": "licensed_visual_manifest",
        "sourceUrl": "https://unsplash.com/photos/white-and-blue-concrete-buildings-near-sea-1533105079780",
        "usageRights": "licensed_cc_or_public_domain_visual",
        "verifiedAtIso": "2026-11-16T16:00:00Z"
      }
    }
  }
];

export function getDccCanonicalShipBySlug(shipSlug: string): CanonicalDccShipRecord | null {
  const normalized = shipSlug.trim().toLowerCase();
  return CANONICAL_DCC_SHIPS.find((s) => s.shipSlug === normalized) ?? null;
}

export function getDccCanonicalShipsSummary() {
  const indexableCount = CANONICAL_DCC_SHIPS.filter((s) => s.isIndexable).length;
  const noindexCount = CANONICAL_DCC_SHIPS.length - indexableCount;
  const enrichedIndexableCount = CANONICAL_DCC_SHIPS.filter((s) => !s.inCuratedFleet && s.isIndexable).length;
  return {
    totalCanonicalShips: CANONICAL_DCC_SHIPS.length,
    curatedFleetIndexableCount: CANONICAL_DCC_SHIPS.filter((s) => s.inCuratedFleet && s.isIndexable).length,
    enrichedSupplementalIndexableCount: enrichedIndexableCount,
    totalIndexableCount: indexableCount,
    noindexHeldCount: noindexCount,
    deckPlansOrProprietaryMediaCount: 0 as const,
    specVerifiedAt: '2026-11-16T16:00:00Z',
  };
}
