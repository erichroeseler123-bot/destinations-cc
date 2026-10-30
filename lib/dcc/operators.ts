import fs from "node:fs";
import path from "node:path";
import { appendViatorAttribution } from "@/lib/viator/links";

const ROOT = process.cwd();
const OPERATORS_DIR = path.join(ROOT, "data", "operators");

export const DCC_HOMEPAGE_OPERATOR_MESSAGE =
  "It’s time tour operators kept more of every booking. Connect your existing booking system to DCC through an authorized API. Our commission is 10% on completed direct bookings we generate.";

export const DCC_OPERATOR_PAGE_DIRECT_OFFER_MESSAGE =
  "Your tours are featured here through Viator. If you’d like bookings to go directly to your company, we can connect your booking API. Our proposed commission is 10% on completed direct bookings.";

export type TourOperatorRef = {
  slug: string;
  name?: string;
  city?: string;
  website?: string;
  phone?: string;
};

export type VerifiedOperatorViatorProduct = {
  productCode: string;
  title: string;
  status: "ACTIVE";
  supplierName: string;
  supplierReference: string;
  coverImageUrl: string;
  imageSourceType: "SUPPLIER_PROVIDED";
  canonicalViatorUrl: string;
  trackedViatorUrl: string;
  cancellationType: "STANDARD" | "CUSTOM";
  summary: string;
  verifiedAt: string;
};

export type DirectChannelPilotInfo = {
  pilotStatus: "first_direct_channel_pilot";
  pilotLabel: string;
  bookingSystem: "Rezdy Native REST API v1";
  workingCheckoutStatus: string;
  workingCheckoutUrl: string;
  wellKnownEndpointUrl: string;
  pilotScopeSummary: string;
  verificationChecklist: {
    operatorAuthorization: "verified" | "pending";
    providerApprovedApiAccess: "verified" | "pending";
    agreedCommercialTerms: "verified" | "pending_10_percent_direct_addendum";
    productMapping: "verified" | "in_progress";
    livePricesAndAvailability: "verified" | "in_progress";
    bookingAttributionAndOutcomeReporting: "verified" | "in_progress";
    cancellationAndReturnPolicyVerifiedSeparately: "verified" | "in_progress";
  };
};

export type OperatorManifest = {
  slug: string;
  name: string;
  city: string;
  stateOrRegion?: string;
  country?: string;
  founded?: string;
  specialties?: string[];
  website: string;
  phone?: string;
  verifiedBusinessEmail?: string;
  overview: string;
  areasServed?: string[];
  currentBookingChannel: "viator" | "direct_pilot";
  directPartnershipStatus: "not_enrolled_viator_channel" | "first_direct_channel_pilot";
  supplierReference?: string;
  detectedBookingSystem?: string;
  outreachStatus?: "pilot_candidate_ready_for_review" | "flagged_prior_15_percent_offer" | "direct_pilot";
  doNotAutoSendOutreach?: boolean;
  outreachNotes?: string;
  verifiedViatorProducts: VerifiedOperatorViatorProduct[];
  directPilot?: DirectChannelPilotInfo;
};

function buildOperatorViatorLink(slug: string, productCode: string, canonicalViatorUrl: string): string {
  return appendViatorAttribution(canonicalViatorUrl, {
    campaign: `dcc-operator-${slug}-${productCode.toLowerCase()}`,
    medium: "link",
    preserveExistingCampaign: false,
  });
}

export const VERIFIED_DCC_OPERATORS: OperatorManifest[] = [
  {
    slug: "coastal-helicopters",
    name: "Coastal Helicopters",
    city: "Juneau, Alaska",
    stateOrRegion: "Alaska",
    country: "United States",
    website: "https://coastalhelicopters.com/",
    phone: "+1 (907) 789-5600",
    verifiedBusinessEmail: "info@coastalhelicopters.com",
    overview:
      "Juneau helicopter flightseeing and guided Herbert Glacier / icefield landing operator operating from Juneau International Airport.",
    specialties: ["Glacier helicopter landings", "Guided icefield walks", "Juneau shore excursions"],
    areasServed: ["Juneau", "Juneau Icefield", "Herbert Glacier"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-VERIFIED-COASTAL-HELICOPTERS-6251",
    detectedBookingSystem: "Direct Operator Reservation System",
    outreachStatus: "flagged_prior_15_percent_offer",
    doNotAutoSendOutreach: true,
    outreachNotes:
      "Flagged for review: Coastal Helicopters previously received a separate email proposing 15%. Do not send duplicate automated outreach.",
    verifiedViatorProducts: [
      {
        productCode: "6251SHOREXICEWALK",
        title: "Juneau Shore Excursion Helicopter Tour and Guided Icefield Walk",
        status: "ACTIVE",
        supplierName: "Coastal Helicopters",
        supplierReference: "SUPPLIER-VERIFIED-COASTAL-HELICOPTERS-6251",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/0a/9b/c4/a1.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
        trackedViatorUrl: buildOperatorViatorLink(
          "coastal-helicopters",
          "6251SHOREXICEWALK",
          "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK"
        ),
        cancellationType: "CUSTOM",
        summary:
          "Helicopter flight over the Juneau Icefield with a guided glacier walk and round-trip port transportation. Confirm current departure times, passenger weight rules, and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
    ],
  },
  {
    slug: "cajun-encounters",
    name: "Cajun Encounters Tour Co.",
    city: "New Orleans, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://www.cajunencounters.com/",
    phone: "+1 (504) 834-1770",
    verifiedBusinessEmail: "info@cajunencounters.com",
    overview:
      "Operates guided flat-bottom boat tours through the Honey Island Swamp in Slidell, Louisiana, with self-drive and New Orleans shuttle options.",
    specialties: ["Honey Island Swamp boat tours", "Round-trip New Orleans hotel shuttle options"],
    areasServed: ["New Orleans", "Slidell", "Honey Island Swamp"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-Ls68Tv9wCH9YKPX1YdQD0g==",
    detectedBookingSystem: "Custom / Enterprise Booking System",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      {
        productCode: "6953SWAMP",
        title: "New Orleans Self-Transport Swamp and Bayou Boat Tour",
        status: "ACTIVE",
        supplierName: "Cajun Encounters Tour Co.",
        supplierReference: "SUPPLIER-Ls68Tv9wCH9YKPX1YdQD0g==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/07/38/cd/26.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour/d675-6953SWAMP",
        trackedViatorUrl: buildOperatorViatorLink(
          "cajun-encounters",
          "6953SWAMP",
          "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour/d675-6953SWAMP"
        ),
        cancellationType: "STANDARD",
        summary:
          "Guided boat excursion in the Honey Island Swamp for travelers driving themselves to the Slidell dock. Confirm current schedule, availability, and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
      {
        productCode: "6953SWAMPTRANS",
        title: "New Orleans Swamp and Bayou Boat Tour with Transportation",
        status: "ACTIVE",
        supplierName: "Cajun Encounters Tour Co.",
        supplierReference: "SUPPLIER-Ls68Tv9wCH9YKPX1YdQD0g==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/07/6f/d1/42.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour-With-Transport/d675-6953SWAMPTRANS",
        trackedViatorUrl: buildOperatorViatorLink(
          "cajun-encounters",
          "6953SWAMPTRANS",
          "https://www.viator.com/tours/New-Orleans/Honey-Island-Swamp-Tour-With-Transport/d675-6953SWAMPTRANS"
        ),
        cancellationType: "STANDARD",
        summary:
          "Honey Island Swamp boat tour including round-trip pickup from designated New Orleans locations. Confirm pickup points, departure windows, and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
    ],
  },
  {
    slug: "cajun-pride-swamp-tours",
    name: "Cajun Pride Swamp Tours",
    city: "LaPlace & New Orleans, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://www.cajunprideswamptours.com/",
    phone: "+1 (504) 467-0758",
    verifiedBusinessEmail: "res@cajunprideswamp.com",
    overview:
      "Operates covered swamp boat tours on a private wildlife refuge along the Manchac Bayou in LaPlace, with self-drive and New Orleans shuttle departures.",
    specialties: ["Manchac Bayou covered boat tours", "Swamp & plantation combinations"],
    areasServed: ["LaPlace", "Manchac Swamp", "New Orleans"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-ah695t/3pUZ5JxgMe0brVQ==",
    detectedBookingSystem: "FareHarbor",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      {
        productCode: "141126P1",
        title: "New Orleans Swamp Boat Tour",
        status: "ACTIVE",
        supplierName: "Cajun Pride Swamp Tours",
        supplierReference: "SUPPLIER-ah695t/3pUZ5JxgMe0brVQ==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/07/a3/03/60.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/Drive-Out-Swamp-Tour/d675-141126P1",
        trackedViatorUrl: buildOperatorViatorLink(
          "cajun-pride-swamp-tours",
          "141126P1",
          "https://www.viator.com/tours/New-Orleans/Drive-Out-Swamp-Tour/d675-141126P1"
        ),
        cancellationType: "STANDARD",
        summary:
          "Covered pontoon swamp boat tour departing from Frenier Road in LaPlace for self-drive visitors. Confirm departure times, availability, and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
      {
        productCode: "141126P2",
        title: "New Orleans Swamp Boat Tour with Shuttle Service",
        status: "ACTIVE",
        supplierName: "Cajun Pride Swamp Tours",
        supplierReference: "SUPPLIER-ah695t/3pUZ5JxgMe0brVQ==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/07/8f/4d/ac.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/Swamp-Tour-with-Transportation/d675-141126P2",
        trackedViatorUrl: buildOperatorViatorLink(
          "cajun-pride-swamp-tours",
          "141126P2",
          "https://www.viator.com/tours/New-Orleans/Swamp-Tour-with-Transportation/d675-141126P2"
        ),
        cancellationType: "STANDARD",
        summary:
          "Covered swamp boat outing in the Manchac Bayou with round-trip shuttle pickup from New Orleans. Confirm shuttle pickup times, availability, and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
    ],
  },
  {
    slug: "haunted-history-tours",
    name: "Haunted History Tours",
    city: "New Orleans, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://hauntedhistorytours.com/",
    phone: "+1 (504) 861-2727",
    verifiedBusinessEmail: "webmistress@hauntedhistorytours.com",
    overview:
      "Operates guided French Quarter ghost, vampire, voodoo, and cemetery walking tours, Garden District architecture walks, and evening haunted bus tours.",
    specialties: ["French Quarter ghost & vampire walks", "Nighttime cemetery bus tours", "Garden District walking tours"],
    areasServed: ["French Quarter", "Garden District", "New Orleans"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-xe2YbZ42ogLOrNtIzC5ybg==",
    detectedBookingSystem: "FareHarbor",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      {
        productCode: "3252_1",
        title: "New Orleans Haunted History Ghost Tour",
        status: "ACTIVE",
        supplierName: "Haunted History Tours",
        supplierReference: "SUPPLIER-xe2YbZ42ogLOrNtIzC5ybg==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/09/1c/20/c6.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Haunted-History-Ghost-Tour/d675-3252_1",
        trackedViatorUrl: buildOperatorViatorLink(
          "haunted-history-tours",
          "3252_1",
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Haunted-History-Ghost-Tour/d675-3252_1"
        ),
        cancellationType: "STANDARD",
        summary:
          "Guided walking tour covering documented hauntings and historic locations in the French Quarter. Confirm meeting point, evening departure times, and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
      {
        productCode: "3252_5",
        title: "New Orleans Vampire Walking Tour",
        status: "ACTIVE",
        supplierName: "Haunted History Tours",
        supplierReference: "SUPPLIER-xe2YbZ42ogLOrNtIzC5ybg==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/07/32/05/48.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Vampire-Tour/d675-3252_5",
        trackedViatorUrl: buildOperatorViatorLink(
          "haunted-history-tours",
          "3252_5",
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Vampire-Tour/d675-3252_5"
        ),
        cancellationType: "STANDARD",
        summary:
          "Evening walking tour through the French Quarter examining New Orleans vampire folklore and historic crime records. Confirm current schedule and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
      {
        productCode: "3252P9",
        title: "New Orleans Dead of Night Ghosts and Cemetery Bus Tour",
        status: "ACTIVE",
        supplierName: "Haunted History Tours",
        supplierReference: "SUPPLIER-xe2YbZ42ogLOrNtIzC5ybg==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/0c/02/91/e6.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/Dead-of-Night-Ghosts-and-Graveyard-Bus-Tour/d675-3252P9",
        trackedViatorUrl: buildOperatorViatorLink(
          "haunted-history-tours",
          "3252P9",
          "https://www.viator.com/tours/New-Orleans/Dead-of-Night-Ghosts-and-Graveyard-Bus-Tour/d675-3252P9"
        ),
        cancellationType: "STANDARD",
        summary:
          "Evening bus excursion visiting historic New Orleans neighborhoods and cemetery districts beyond the French Quarter walking core. Confirm departure times and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
    ],
  },
  {
    slug: "doctor-gumbo-tours",
    name: "Doctor Gumbo Tours",
    city: "New Orleans, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://doctorgumbo.com/",
    phone: "+1 (504) 451-5469",
    verifiedBusinessEmail: "doctorgumbo@doctorgumbo.com",
    overview:
      "Operates small-group culinary history and classic cocktail walking tours in the New Orleans French Quarter.",
    specialties: ["French Quarter food history walks", "Craft cocktail & bar history tours"],
    areasServed: ["French Quarter", "New Orleans"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-uhTuEGs0R00a22vvRVDMHg==",
    detectedBookingSystem: "FareHarbor",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      {
        productCode: "6484NOLAFOOD",
        title: "New Orleans Food and History Walking Tour",
        status: "ACTIVE",
        supplierName: "Doctor Gumbo Tours",
        supplierReference: "SUPPLIER-uhTuEGs0R00a22vvRVDMHg==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/06/73/13/25.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Food-and-History-Tour/d675-6484NOLAFOOD",
        trackedViatorUrl: buildOperatorViatorLink(
          "doctor-gumbo-tours",
          "6484NOLAFOOD",
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Food-and-History-Tour/d675-6484NOLAFOOD"
        ),
        cancellationType: "STANDARD",
        summary:
          "Guided French Quarter tasting walk visiting historic New Orleans restaurants and food landmarks. Confirm dietary notes, schedule, and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
      {
        productCode: "6484P3",
        title: "New Orleans Cocktail and Food History Tour",
        status: "ACTIVE",
        supplierName: "Doctor Gumbo Tours",
        supplierReference: "SUPPLIER-uhTuEGs0R00a22vvRVDMHg==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/12/78/57/b9.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/Combo-Cocktail-and-Food-History-Tour/d675-6484P3",
        trackedViatorUrl: buildOperatorViatorLink(
          "doctor-gumbo-tours",
          "6484P3",
          "https://www.viator.com/tours/New-Orleans/Combo-Cocktail-and-Food-History-Tour/d675-6484P3"
        ),
        cancellationType: "STANDARD",
        summary:
          "Combined French Quarter food tasting and cocktail history walking tour (ages 21+ with valid ID). Confirm departure times, availability, and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
      {
        productCode: "6484FRQCK",
        title: "New Orleans Cocktail History Walking Tour in the French Quarter",
        status: "ACTIVE",
        supplierName: "Doctor Gumbo Tours",
        supplierReference: "SUPPLIER-uhTuEGs0R00a22vvRVDMHg==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/07/2d/c6/11.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Cocktail-History-Walking-Tour-in-the-French-Quarter/d675-6484FRQCK",
        trackedViatorUrl: buildOperatorViatorLink(
          "doctor-gumbo-tours",
          "6484FRQCK",
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Cocktail-History-Walking-Tour-in-the-French-Quarter/d675-6484FRQCK"
        ),
        cancellationType: "STANDARD",
        summary:
          "Guided walking tour of classic French Quarter bars and cocktail origins (ages 21+ with valid ID). Confirm availability and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
    ],
  },
  {
    slug: "airboat-adventures",
    name: "Airboat Adventures",
    city: "Lafitte & New Orleans, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://airboatadventures.com/",
    phone: "+1 (504) 689-2005",
    verifiedBusinessEmail: "Info@AirboatAdventures.com",
    overview:
      "Operates small and large airboat and pontoon swamp tours in Jean Lafitte, Louisiana, with optional hotel pickup from downtown New Orleans.",
    specialties: ["Small-group airboat swamp tours", "Large airboat & pontoon swamp outings"],
    areasServed: ["Lafitte", "Jean Lafitte", "New Orleans"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-7eNlteakiwgCVdiaT3VQkg==",
    detectedBookingSystem: "Direct Website Checkout",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      {
        productCode: "6455NOLAAIR",
        title: "New Orleans Airboat Ride",
        status: "ACTIVE",
        supplierName: "Airboat Adventures",
        supplierReference: "SUPPLIER-7eNlteakiwgCVdiaT3VQkg==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/11/46/79/42.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Airboat-Ride/d675-6455NOLAAIR",
        trackedViatorUrl: buildOperatorViatorLink(
          "airboat-adventures",
          "6455NOLAAIR",
          "https://www.viator.com/tours/New-Orleans/New-Orleans-Airboat-Ride/d675-6455NOLAAIR"
        ),
        cancellationType: "STANDARD",
        summary:
          "Airboat swamp tour departing from Jean Lafitte with selectable boat size and transportation options. Confirm boat capacity, pickup option, and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
    ],
  },
  {
    slug: "new-orleans-kayak-swamp-tours",
    name: "New Orleans Kayak Swamp Tours",
    city: "New Orleans & Manchac, Louisiana",
    stateOrRegion: "Louisiana",
    country: "United States",
    website: "https://neworleanskayakswamptours.com/",
    phone: "+1 (504) 229-4867",
    verifiedBusinessEmail: "nolakayaktours@gmail.com",
    overview:
      "Operates guided small-group kayak tours through the Manchac Swamp and combination trips pairing kayaking with historic plantation visits.",
    specialties: ["Small-group swamp kayaking", "Kayak & Whitney Plantation combinations"],
    areasServed: ["Manchac Swamp", "New Orleans"],
    currentBookingChannel: "viator",
    directPartnershipStatus: "not_enrolled_viator_channel",
    supplierReference: "SUPPLIER-CN3etwHlngDFw8ce4fY4dQ==",
    detectedBookingSystem: "FareHarbor",
    outreachStatus: "pilot_candidate_ready_for_review",
    doNotAutoSendOutreach: true,
    verifiedViatorProducts: [
      {
        productCode: "22050P2",
        title: "Small-Group Manchac Swamp Kayak Tour",
        status: "ACTIVE",
        supplierName: "New Orleans Kayak Swamp Tours",
        supplierReference: "SUPPLIER-CN3etwHlngDFw8ce4fY4dQ==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/0a/ef/08/e7.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/Manchac-Mystic-Wildlife-Kayak-Tour/d675-22050P2",
        trackedViatorUrl: buildOperatorViatorLink(
          "new-orleans-kayak-swamp-tours",
          "22050P2",
          "https://www.viator.com/tours/New-Orleans/Manchac-Mystic-Wildlife-Kayak-Tour/d675-22050P2"
        ),
        cancellationType: "STANDARD",
        summary:
          "Guided paddle through the cypress waterways of Manchac Swamp with selectable self-drive or New Orleans pickup options. Confirm departure time and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
      {
        productCode: "22050P3",
        title: "Whitney Plantation and Manchac Swamp Kayak Tour Combo",
        status: "ACTIVE",
        supplierName: "New Orleans Kayak Swamp Tours",
        supplierReference: "SUPPLIER-CN3etwHlngDFw8ce4fY4dQ==",
        coverImageUrl:
          "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/0a/6b/df/0c.jpg",
        imageSourceType: "SUPPLIER_PROVIDED",
        canonicalViatorUrl:
          "https://www.viator.com/tours/New-Orleans/Whitney-Plantation-and-Manchac-Swamp-Kayak-Tour-Combo/d675-22050P3",
        trackedViatorUrl: buildOperatorViatorLink(
          "new-orleans-kayak-swamp-tours",
          "22050P3",
          "https://www.viator.com/tours/New-Orleans/Whitney-Plantation-and-Manchac-Swamp-Kayak-Tour-Combo/d675-22050P3"
        ),
        cancellationType: "STANDARD",
        summary:
          "Full-day outing combining a guided Manchac Swamp kayak tour with admission and transportation to Whitney Plantation. Confirm schedule, operating days, and live price on Viator.",
        verifiedAt: "2026-10-30",
      },
    ],
  },
];

export const GOSNO_DIRECT_PILOT_MANIFEST: OperatorManifest = {
  slug: "gosno",
  name: "GoSno",
  city: "Denver, Breckenridge & I-70 Corridor, Colorado",
  stateOrRegion: "Colorado",
  country: "United States",
  website: "https://gosno.co/",
  overview:
    "Mountain transportation, private shuttles, and airport connectivity across the Colorado I-70 corridor (Denver International Airport to Breckenridge, Vail, Keystone, and Copper Mountain) and Big Sky, Montana.",
  specialties: [
    "DEN to Breckenridge mountain transfers",
    "I-70 winter corridor private & shared shuttles",
    "Live /.well-known/dcc endpoint + Rezdy API checkout",
  ],
  areasServed: ["Denver International Airport (DEN)", "Breckenridge", "Vail", "I-70 Corridor", "Big Sky"],
  currentBookingChannel: "direct_pilot",
  directPartnershipStatus: "first_direct_channel_pilot",
  detectedBookingSystem: "Rezdy Native REST API v1",
  outreachStatus: "direct_pilot",
  doNotAutoSendOutreach: true,
  verifiedViatorProducts: [],
  directPilot: {
    pilotStatus: "first_direct_channel_pilot",
    pilotLabel: "First Direct-Channel Pilot (Rezdy API) — Separate from Working Checkout",
    bookingSystem: "Rezdy Native REST API v1",
    workingCheckoutStatus:
      "Operational: GoSno's Rezdy checkout on gosno.co and live /.well-known/dcc endpoint are active in production.",
    workingCheckoutUrl: "https://gosno.co/denver-to-breckenridge",
    wellKnownEndpointUrl: "https://gosno.co/.well-known/dcc",
    pilotScopeSummary:
      "GoSno serves as DCC's first direct-channel API pilot using its existing Rezdy REST API v1 integration. This direct-channel pilot evaluates DCC-side product mapping, live price/availability verification, and 10% direct-booking attribution separately from GoSno's existing working checkout on gosno.co.",
    verificationChecklist: {
      operatorAuthorization: "verified",
      providerApprovedApiAccess: "verified",
      agreedCommercialTerms: "pending_10_percent_direct_addendum",
      productMapping: "verified",
      livePricesAndAvailability: "verified",
      bookingAttributionAndOutcomeReporting: "in_progress",
      cancellationAndReturnPolicyVerifiedSeparately: "verified",
    },
  },
};

export type PriorOutreachFlaggedOperator = {
  name: string;
  city: string;
  website: string;
  priorProposal: "15% direct commission";
  doNotAutoSend: true;
  verifiedViatorPageSlug?: string;
  statusNote: string;
};

export const FLAGGED_PRIOR_OUTREACH_OPERATORS: PriorOutreachFlaggedOperator[] = [
  {
    name: "Coastal Helicopters",
    city: "Juneau, Alaska",
    website: "https://coastalhelicopters.com/",
    priorProposal: "15% direct commission",
    doNotAutoSend: true,
    verifiedViatorPageSlug: "coastal-helicopters",
    statusNote:
      "Already received a separate email proposing 15%. Has verified DCC page (/operators/coastal-helicopters) with active Viator product 6251SHOREXICEWALK. Flagged for manual review—do not auto-send.",
  },
  {
    name: "TEMSCO Helicopters",
    city: "Juneau, Alaska",
    website: "https://temscoair.com/",
    priorProposal: "15% direct commission",
    doNotAutoSend: true,
    statusNote:
      "Already received a separate email proposing 15%. No active Juneau Viator product verified through available API searches (retained as comparison search on JFD). Flagged for manual review—do not auto-send.",
  },
  {
    name: "NorthStar Trekking",
    city: "Juneau, Alaska",
    website: "https://northstartrekking.com/",
    priorProposal: "15% direct commission",
    doNotAutoSend: true,
    statusNote:
      "Already received a separate email proposing 15%. No active Juneau Viator product verified through available API searches (retained as comparison search on JFD). Flagged for manual review—do not auto-send.",
  },
];

export type NativeProviderApiSpec = {
  provider: string;
  protocolType: string;
  documentationUrl: string;
  authMechanism: string;
  catalogAndAvailabilityEndpoints: string;
  bookingAndAttributionNotes: string;
};

/**
 * Provider-specific API profiles based on actual provider documentation.
 * Do NOT assume FareHarbor, Bókun, Rezdy, and other native APIs all use OCTO endpoints.
 */
export const NATIVE_PROVIDER_API_PROFILES: NativeProviderApiSpec[] = [
  {
    provider: "Rezdy (Supplier / Agent REST API v1)",
    protocolType: "Native REST JSON (v1)",
    documentationUrl: "https://developers.rezdy.com/",
    authMechanism: "apiKey header / query parameter issued per authorized supplier/agent connection",
    catalogAndAvailabilityEndpoints:
      "GET /v1/products, GET /v1/availability?productCode=...&startTimeLocal=...&endTimeLocal=...",
    bookingAndAttributionNotes:
      "POST /v1/bookings with internal reference/reseller tracking; used by GoSno as DCC's first direct-channel pilot.",
  },
  {
    provider: "FareHarbor (External API v1)",
    protocolType: "Native REST JSON (External API v1 — NOT OCTO by default)",
    documentationUrl: "https://developer.fareharbor.com/api/external/v1/",
    authMechanism: "X-FareHarbor-API-App and X-FareHarbor-API-User headers with operator-authorized company shortname",
    catalogAndAvailabilityEndpoints:
      "GET /api/external/v1/companies/{shortname}/items/, GET .../items/{pk}/availabilities/date/{date}/",
    bookingAndAttributionNotes:
      "POST .../availabilities/{pk}/bookings/ with partner/affiliate voucher & note fields; requires explicit operator permission for the company shortname.",
  },
  {
    provider: "Bókun (REST API / Channel Inventory API)",
    protocolType: "Native REST JSON with HMAC-SHA1 request signing (separate from optional OCTO adapter)",
    documentationUrl: "https://docs.bokun.io/",
    authMechanism: "X-Bokun-Date, X-Bokun-AccessKey, and X-Bokun-Signature (HMAC-SHA1)",
    catalogAndAvailabilityEndpoints:
      "GET /activity.json/{id}, GET /activity.json/{id}/availabilities?start=...&end=...",
    bookingAndAttributionNotes:
      "POST /booking.json/activity-booking/reserve-and-confirm with externalBookingReference for commission settlement.",
  },
  {
    provider: "Ventrata / OCTO Core v1.2.0",
    protocolType: "OCTO Core REST JSON (for providers that explicitly implement OCTO)",
    documentationUrl: "https://docs.octo.travel/",
    authMechanism: "Authorization: Bearer <token> with Octo-Capabilities header",
    catalogAndAvailabilityEndpoints:
      "GET /suppliers, GET /products, POST /availability",
    bookingAndAttributionNotes:
      "POST /bookings (hold) and POST /bookings/{uuid}/confirm with resellerReference for outcome reporting.",
  },
];

function readOperatorFile(slug: string): OperatorManifest | null {
  const filePath = path.join(OPERATORS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as OperatorManifest;
  } catch {
    return null;
  }
}

export function listVerifiedOperators(): OperatorManifest[] {
  return VERIFIED_DCC_OPERATORS;
}

export function listOperatorSlugs(): string[] {
  const slugs = new Set<string>([
    ...VERIFIED_DCC_OPERATORS.map((op) => op.slug),
    GOSNO_DIRECT_PILOT_MANIFEST.slug,
  ]);
  return Array.from(slugs).sort();
}

export function getOperatorManifest(slug: string): OperatorManifest | null {
  if (slug === GOSNO_DIRECT_PILOT_MANIFEST.slug) {
    return GOSNO_DIRECT_PILOT_MANIFEST;
  }
  const verified = VERIFIED_DCC_OPERATORS.find((op) => op.slug === slug);
  if (verified) return verified;

  const fromDisk = readOperatorFile(slug);
  if (!fromDisk || !Array.isArray(fromDisk.verifiedViatorProducts)) return null;
  return { ...fromDisk, slug };
}

export function mergeOperatorRef(ref?: TourOperatorRef): TourOperatorRef | null {
  if (!ref?.slug) return null;
  const manifest = getOperatorManifest(ref.slug);
  if (!manifest) return ref;
  return {
    slug: ref.slug,
    name: ref.name || manifest.name,
    city: ref.city || manifest.city,
    website: ref.website || manifest.website,
    phone: ref.phone || manifest.phone,
  };
}

export function generatePilotOutreachDraft(operator: OperatorManifest): {
  canPrepareDraft: boolean;
  blockedReason?: string;
  recipientEmail?: string;
  pageUrl: string;
  subject: string;
  body: string;
} {
  const pageUrl = `https://www.destinationcommandcenter.com/operators/${operator.slug}`;
  if (operator.outreachStatus === "flagged_prior_15_percent_offer") {
    return {
      canPrepareDraft: false,
      blockedReason:
        "Flagged for review: operator previously received a separate email proposing 15% commission. Duplicate automated outreach is blocked.",
      recipientEmail: operator.verifiedBusinessEmail,
      pageUrl,
      subject: "",
      body: "",
    };
  }
  if (!operator.verifiedViatorProducts.length) {
    return {
      canPrepareDraft: false,
      blockedReason: "Operator does not have verified active Viator products on DCC.",
      recipientEmail: operator.verifiedBusinessEmail,
      pageUrl,
      subject: "",
      body: "",
    };
  }
  return {
    canPrepareDraft: true,
    recipientEmail: operator.verifiedBusinessEmail,
    pageUrl,
    subject: `${operator.name} tours on Destination Command Center`,
    body: `We’ve put together a page featuring your tours through Viator: ${pageUrl}. If you’d prefer bookings to go directly to your company, we can connect your booking API for a proposed 10% commission on completed direct bookings. Who handles API access and distribution partnerships?`,
  };
}
