import { buildAffiliateUrl, buildDccHandoffAffiliateUrl } from "./affiliate/links";
import {
  findSoutheastAlaskaTourByOperatorAndSlug,
  resolveSoutheastAlaskaTourDirectRezgoHref,
} from "../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

export const WEEKEND_IN_JUNEAU_PATH = "/guides/weekend-in-juneau" as const;
export const WEEKEND_IN_JUNEAU_CANONICAL_URL =
  `https://www.lastfrontiershoreexcursions.com${WEEKEND_IN_JUNEAU_PATH}` as const;

export const WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO = "2026-11-19" as const;
export const WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG = "November 19, 2026" as const;

/**
 * Release gate: Preview remains excluded from search indexing until editorial sign-off
 * and Production promotion wiring (sitemap + internal discovery links) are authorized.
 */
export const WEEKEND_IN_JUNEAU_RELEASE_READY = false as const;

export type StayDurationKey = "2_full_days" | "3_full_days";
export type StayBaseKey = "downtown" | "valley_airport";

export interface BaseNeighborhoodSpec {
  key: StayBaseKey;
  label: string;
  shortLabel: string;
  corridorSummary: string;
  bestFor: string[];
  transportTradeoffs: string[];
  verifiedLodgingExamples: Array<{
    name: string;
    address: string;
    officialUrl: string;
    verifiedFeatures: string;
    practicalRestrictions: string;
    checkedDate: string;
  }>;
}

export interface ItineraryDayBlock {
  dayBadge: string;
  dayType: "arrival_departure" | "full_activity_day";
  title: string;
  weatherNote?: string;
  morning: string;
  afternoon: string;
  evening: string;
  downtownBaseTip: string;
  valleyBaseTip: string;
}

export interface ItineraryPlanSpec {
  key: StayDurationKey;
  tabLabel: string;
  nightsLabel: string;
  headline: string;
  framingNote: string;
  days: ItineraryDayBlock[];
}

export interface AdventureCardSpec {
  id: string;
  categoryLabel:
    | "Glacier Flightseeing"
    | "Whale Watching"
    | "Kayaking & Lake Paddling"
    | "Walking, Trails & Culture";
  title: string;
  operatorName: string;
  lfseOperatorPath?: string;
  lfseTourPath?: string;
  sellerLabel: string;
  channelType: "rezgo_direct" | "viator_partner" | "operator_direct_site" | "public_agency";
  commissionDisclosure: string;
  publishedFactSummary: string;
  restrictionsAndLogistics: string;
  applicableDateLabel: string;
  imageSrc: string;
  imageAlt: string;
  imageCredit: string;
  primaryCta?: {
    label: string;
    href: string;
    campaign: string;
    provider: string;
    productCode: string;
    isSellerHandoff: boolean;
  };
  secondaryLinks: Array<{
    label: string;
    href: string;
    kind: "lfse_internal" | "jfd_guide" | "official_source";
  }>;
}

export interface EveningSpotSpec {
  name: string;
  neighborhood: string;
  address: string;
  officialUrl: string;
  whatToExpect: string;
  verifiedHoursAndSeasonality: string;
  practicalNote: string;
  checkedDate: string;
}

export interface GettingAroundRow {
  corridor: string;
  distanceFromDowntown: string;
  walkableFromDowntown: string;
  practicalTransportOptions: string;
  verifiedConstraint: string;
}

export interface WeatherSwapRow {
  condition: string;
  whatPausesOrChanges: string;
  strongJuneauAlternatives: string;
  honestBoundary: string;
}

export interface WeekendSourceLedgerRow {
  claimId: string;
  operatorOrEntity: string;
  productOrScope: string;
  bookingChannel: string;
  applicableDate: string;
  verifiedSummary: string;
  officialSourceUrl: string;
}

function appendPreviewQaFlag(url: string): string {
  if (process.env.VERCEL_ENV !== "production") {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}qa=1`;
  }
  return url;
}

function buildLfseViatorSellerHref(params: {
  officialViatorUrl: string;
  productCode: string;
  campaign: string;
}): string {
  const innerUrl = buildAffiliateUrl(
    "viator",
    params.officialViatorUrl,
    params.campaign,
    params.productCode,
    true,
  );
  const handoffUrl = buildDccHandoffAffiliateUrl({
    source: "viator",
    destinationUrl: innerUrl,
    productCode: params.productCode,
    campaign: params.campaign,
  });
  return appendPreviewQaFlag(handoffUrl);
}

function buildJuneauToursDirectRezgoSellerHref(
  tourSlug: "auke-bay-whale-watch" | "mendenhall-and-whale-combo" | "mendenhall-glacier-shuttle",
): string {
  const tour = findSoutheastAlaskaTourByOperatorAndSlug(
    "juneau-tours-and-whale-watch",
    tourSlug,
  );
  const fallback = "https://www.juneautours.com/";
  if (!tour) return fallback;
  const href = resolveSoutheastAlaskaTourDirectRezgoHref(tour, { partySize: 2 });
  if (!href) return fallback;
  return appendPreviewQaFlag(href);
}

export const WHY_STAY_IN_JUNEAU_PILLARS = [
  {
    kicker: "Roadless Capital Life",
    title: "An everyday Alaskan town—not a gated resort strip",
    body: "Surrounded by the Tongass National Forest, the Juneau Icefield, and Gastineau Channel, Alaska’s capital (~32,000 residents) has neighborhood bakeries, state museums, Tlingit, Haida, and Tsimshian cultural institutions, local breweries, and working small-boat harbors functioning year-round alongside visitor adventures.",
  },
  {
    kicker: "Mornings & Golden-Hour Evenings",
    title: "Access the trails and waterfront outside midday rush hours",
    body: "Staying overnight lets you hike out to Nugget Falls early in the morning, linger over dinner on Seward or Second Street, and walk the Gastineau Channel seawalk in long northern summer twilight after daytime excursion buses wind down.",
  },
  {
    kicker: "Room to Sequence Weather",
    title: "Two or three full days take single-afternoon pressure off the sky",
    body: "Coastal cloud ceilings and mountain winds change hour by hour in Southeast Alaska. Giving yourself two or three full days lets you schedule flightseeing early in your stay and enjoy marine wildlife, rainforest trails, or museums without squeezing everything into one five-hour window.",
  },
] as const;

export const JUNEAU_BASE_OPTIONS: readonly BaseNeighborhoodSpec[] = [
  {
    key: "downtown",
    label: "Base Option 1: Walkable Downtown Juneau",
    shortLabel: "Downtown Juneau Base",
    corridorSummary:
      "Historic Franklin, Seward, Second, and Whittier Streets along Gastineau Channel (~8.5–9 miles south of JNU Airport).",
    bestFor: [
      "Walking to dinner, breweries, coffee shops, Sealaska Heritage, and the Alaska State Museum without a car",
      "Walking directly to Wings Airways’ downtown floatplane dock (2 Marine Way) and central tour shuttle pickups (490 S. Franklin St.)",
      "Evening strolls along Marine Park, Historic Merchants Wharf, and Overstreet Park’s whale sculpture",
    ],
    transportTradeoffs: [
      "No rail or walk-in link from JNU Airport: plan a 15–20 minute taxi/rideshare (~8.5–9 miles) or Capital Transit bus on arrival and departure",
      "Hillside streets climb steeply above Front and Seward Streets; historic buildings often involve stairs and compact urban rooms",
      "Reaching Mendenhall Glacier (~12–13 miles) or Statter Harbor/Auke Bay (~12 miles) requires a tour shuttle, taxi, rental car, or public bus + walk",
    ],
    verifiedLodgingExamples: [
      {
        name: "Silverbow Inn Hotel & Suites",
        address: "120 Second St., Downtown Juneau, AK 99801",
        officialUrl: "https://silverbowinn.com/",
        verifiedFeatures:
          "Boutique downtown hotel blocks from the waterfront, museums, and restaurants; includes daily breakfast, 24/7 snack bar, roof-deck hot tub, fire pits, and In Bocca al Lupo dining room on the ground floor.",
        practicalRestrictions:
          "No hotel airport shuttle—plan a ~15–20 minute taxi/rideshare from JNU; confirm room stair/floor access when reserving.",
        checkedDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
      },
      {
        name: "The Historic Alaskan Hotel & Bar",
        address: "167 S. Franklin St., Downtown Juneau, AK 99801",
        officialUrl: "https://www.thealaskanhotel.com/",
        verifiedFeatures:
          "Opened in 1913 (oldest operating hotel in Alaska, National Register of Historic Places) in the heart of South Franklin Street.",
        practicalRestrictions:
          "21+ adult-only property attached to an active live-music bar; historic hillside building has NO elevator (expect 2+ flights of stairs from the lobby), no air conditioning, compact rooms, and half of guest rooms use code-locked shared hall bathrooms.",
        checkedDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
      },
    ],
  },
  {
    key: "valley_airport",
    label: "Base Option 2: Airport & Mendenhall Valley",
    shortLabel: "Airport / Valley Base",
    corridorSummary:
      "Glacier Highway & Airport Blvd corridor (~1–2 miles from JNU Airport, ~4 miles from Mendenhall Glacier & Auke Bay).",
    bestFor: [
      "Late-night JNU flight arrivals or early-morning departures with short airport transfers",
      "Proximity to JNU-area helicopter bases (TEMSCO, NorthStar, Coastal), Mendenhall Glacier trails, and Statter Harbor whale-watch docks",
      "Travelers renting a car or wanting suite kitchens, on-site laundry, and flat parking",
    ],
    transportTradeoffs: [
      "Downtown restaurants, museums, and waterfront walks are 8.5–9 miles away (15–20 minutes each way by rental car or taxi)",
      "Suburban highway layout along Glacier Highway—errands and dining outside your hotel typically require driving, transit, or a ride",
      "Many shore-excursion shuttles default to downtown pickup at 490 S. Franklin St. unless you book an operator that confirms Valley/hotel collection or drive yourself",
    ],
    verifiedLodgingExamples: [
      {
        name: "Frontier Suites Hotel in Juneau",
        address: "9400 Glacier Hwy, Juneau, AK 99801 (Mendenhall Valley)",
        officialUrl: "https://frontiersuites.com/",
        verifiedFeatures:
          "Non-smoking rooms and suites all equipped with full kitchens, on-site laundry, fitness center, and on-site restaurant, minutes from JNU Airport and Mendenhall Glacier.",
        practicalRestrictions:
          "Complimentary shuttle serves JNU Airport and the Alaska Marine Highway Ferry Terminal (4:00 a.m.–11:00 p.m. summer / 4:30 a.m.–10:30 p.m. winter; call 907-790-6600 on arrival)—does not provide complimentary evening shuttles to downtown Juneau.",
        checkedDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
      },
    ],
  },
] as const;

export const WEEKEND_ITINERARY_PLANS: readonly ItineraryPlanSpec[] = [
  {
    key: "2_full_days",
    tabLabel: "2 Full Days in Juneau (3 Nights)",
    nightsLabel: "3 nights · Arrival evening + 2 full activity days + Departure",
    headline: "Two Full Days: Icefield Flight, Humpback Whales, Mendenhall Trails & Downtown Evenings",
    framingNote:
      "Arrival and departure days are kept free of tight high-ticket excursions so delayed flights or airline bag-drop cutoffs never collide with glacier or marine bookings.",
    days: [
      {
        dayBadge: "Arrival Day (Day 0)",
        dayType: "arrival_departure",
        title: "Touch Down at JNU, Settle Into Your Base & Unwind on the Channel",
        morning:
          "Travel day into Juneau International Airport (JNU). Avoid booking non-refundable glacier or boat departures on your inbound flight day.",
        afternoon:
          "Check into your hotel, pick up rain layers/snacks, and—if arriving by mid-afternoon—walk the flat Gastineau Channel seawalk from Marine Park to Overstreet Park’s breaching humpback sculpture (Tahku).",
        evening:
          "Casual waterfront dinner at The Hangar on the Wharf (2 Marine Way, open until 9:00 p.m. Sun–Thu / 9:30 p.m. Fri–Sat) watching floatplanes taxi on the channel, or craft beer and pub fare at Devil’s Club Brewing (100 N. Franklin St., open until 9:00 p.m. Mon–Sat / 8:00 p.m. Sun).",
        downtownBaseTip:
          "Take a 15–20 min taxi/rideshare from JNU into downtown; once checked in, your evening walk and dinner are 2–8 minutes on foot.",
        valleyBaseTip:
          "Call Frontier Suites (907-790-6600) upon landing at JNU for the hotel shuttle (4:00 a.m.–11:00 p.m. summer), or pick up your JNU rental car before heading downtown for dinner.",
      },
      {
        dayBadge: "Full Day 1",
        dayType: "full_activity_day",
        title: "Morning Glacier Helicopter or Seaplane Flight + Afternoon Museums & Chef Dinner",
        weatherNote:
          "Scheduling your weather-sensitive flight on Full Day 1 gives you Full Day 2 to inquire about rescheduling if low ceilings ground morning aviation (never guaranteed, but impossible on a one-day stop).",
        morning:
          "Fly onto the Juneau Icefield: choose a 2h 15m–2h 35m glacier landing walk (TEMSCO or Coastal), NorthStar’s 3h 15m Walkabout / 4h 15m crampon Glacier Trek, or Wings Airways’ 3h 5-glacier floatplane & Taku Lodge feast from 2 Marine Way.",
        afternoon:
          "Explore Juneau’s cultural core at an unhurried pace: Sealaska Heritage Institute’s Walter Soboleff Building (105 S. Seward St.) and the Alaska State Museum (395 Whittier St., summer Tue–Sun 9:00 a.m.–4:30 p.m., Mon 1:00–4:30 p.m.; winter Tue–Sat 10:00 a.m.–4:00 p.m.).",
        evening:
          "Book a 6:30–7:30 p.m. table at Salt (200 Seward St., daily 5:00–9:00 p.m., reserve directly at 907-500-5000) or In Bocca al Lupo (120 Second St., Mon–Sat 5:00–9:00 p.m., closed Sundays).",
        downtownBaseTip:
          "Meet your helicopter shuttle 15 minutes early at Goldbelt Tram (490 S. Franklin St.)—or walk straight to Wings Airways at 2 Marine Way—and drop off daypacks at your hotel before dinner.",
        valleyBaseTip:
          "Confirm with NorthStar (907-790-4530) or TEMSCO (907-789-9501) whether Valley hotel pickup or direct airport-heliport check-in applies so you do not backtrack 9 miles downtown first.",
      },
      {
        dayBadge: "Full Day 2",
        dayType: "full_activity_day",
        title: "Auke Bay Humpback Whales + Mendenhall Glacier Trails & Quiet Twilight",
        morning:
          "Head out from Statter Harbor (Auke Bay) into Favorite Channel and Stephens Passage for a 3.5–4 hr humpback whale watch (Juneau Tours & Whale Watch direct Rezgo cruise or Harv & Marv’s 6- to 18-guest small boats).",
        afternoon:
          "Spend 2–3 unhurried hours at the USFS Mendenhall Glacier Recreation Area: walk the ~2-mile roundtrip gravel trail to Nugget Falls alongside Mendenhall Lake, scan Steep Creek’s boardwalks (July–Sept salmon/bear season), and visit the Visitor Center ($5 summer pass ages 16+ or America the Beautiful pass).",
        evening:
          "Grab local halibut or rockfish tacos at Deckhand Dave’s (139 S. Franklin St., seasonal) or dine along Seward Street, then walk across the Juneau-Douglas Bridge or out to Sandy Beach / Savikko Park on Douglas Island for evening views back toward Mount Juneau.",
        downtownBaseTip:
          "Use a whale + Mendenhall combo shuttle from 490 S. Franklin St. (or Juneau Tours’ Mendenhall Express Shuttle) so you avoid the 1.5-mile each-way walk from the public bus stop.",
        valleyBaseTip:
          "Auke Bay and Mendenhall Glacier are both within a 10-minute drive/taxi of Valley hotels—ideal for arriving at Nugget Falls Trail before 9:00 a.m. tour coaches.",
      },
      {
        dayBadge: "Departure Day",
        dayType: "arrival_departure",
        title: "Morning Coffee, Perseverance Trailhead Walk & Stress-Free JNU Departure",
        morning:
          "If flying out afternoon/evening, enjoy breakfast on Second or Seward Street and an easy out-and-back walk up historic Basin Road to the Perseverance Trailhead overlooking Gold Creek.",
        afternoon:
          "Collect stored bags from your hotel front desk and head to JNU Airport ~90–120 minutes before flight departure.",
        evening: "Outbound flight from JNU.",
        downtownBaseTip:
          "Ask your front desk to hold bags after morning checkout while you grab lunch downtown, then take a 15–20 minute taxi to JNU.",
        valleyBaseTip:
          "Store bags at the hotel or keep them in your rental car for a final stop at Mendenhall Overlook before returning your car at JNU.",
      },
    ],
  },
  {
    key: "3_full_days",
    tabLabel: "3 Full Days in Juneau (4 Nights)",
    nightsLabel: "4 nights · Arrival evening + 3 full activity days + Departure",
    headline: "Three Full Days: Add Guided Kayaking or Glacier Canoeing & True Weather Breathing Room",
    framingNote:
      "A third full day unlocks half-day/full-day human-powered paddling in Channel Islands State Marine Park or Mendenhall Lake—and gives your trip a genuine buffer day without rushing downtown meals.",
    days: [
      {
        dayBadge: "Arrival Day (Day 0)",
        dayType: "arrival_departure",
        title: "Arrive at JNU, Check In & Settle Along Gastineau Channel",
        morning: "Inbound commercial flight into Juneau (JNU)—keep arrival day unscheduled.",
        afternoon:
          "Check in, unpack rain shells and layers, and take an easy orientation walk through Downtown Juneau’s historic district and Marine Park.",
        evening:
          "Dinner on Historic Merchants Wharf at The Hangar on the Wharf (2 Marine Way) or pints and comfort food at Devil’s Club Brewing (100 N. Franklin St.).",
        downtownBaseTip:
          "Everything after your airport taxi is walkable within 5–10 minutes.",
        valleyBaseTip:
          "Use the hotel airport shuttle or pick up a rental car at JNU; stock your suite kitchen at Valley grocers for early adventure mornings.",
      },
      {
        dayBadge: "Full Day 1",
        dayType: "full_activity_day",
        title: "Juneau Icefield Helicopter Landing or Crampon Glacier Trek + Downtown Heritage",
        weatherNote:
          "Putting high-ceiling aviation on Full Day 1 maximizes flexibility across Full Days 2 and 3 if coastal fog or wind grounded morning flights.",
        morning:
          "Choose your icefield flight: TEMSCO Mendenhall Walk (2h 15m), Coastal Herbert Glacier Icefield Walk (~2h 35m), or NorthStar’s deeper 3h 15m Walkabout / 4h 15m Glacier Trek.",
        afternoon:
          "Lunch downtown, followed by Sealaska Heritage’s clan house & Northwest Coast art exhibits (105 S. Seward St.) and the Alaska State Museum (395 Whittier St.).",
        evening:
          "Dinner reservation at Salt (200 Seward St., daily 5:00–9:00 p.m., call 907-500-5000).",
        downtownBaseTip:
          "Meet downtown shuttles at 490 S. Franklin St. (note: upper Goldbelt Tram cars were temporarily closed for assessment as of Nov 19, 2026 while the Lower Terminal coffee/carving center remained open—check goldbelttram.com).",
        valleyBaseTip:
          "Coordinate Valley pickup with NorthStar or drive/taxi minutes to the airport heliports.",
      },
      {
        dayBadge: "Full Day 2",
        dayType: "full_activity_day",
        title: "Channel Islands Sea Kayaking or Mendenhall Lake Canoe & Rainforest Hike",
        morning:
          "Dedicate 5.5–6 hours on the water with a local guiding team: Above & Beyond Alaska’s Paddle with Whales Kayak Adventure in Channel Islands State Marine Park (6 hrs) or Mendenhall Glacier Canoe Paddle & Hike across Mendenhall Lake (5.5 hrs).",
        afternoon:
          "Return mid-afternoon for a hot shower or Silverbow rooftop soak, coffee, and local gallery browsing along Seward and Front Streets.",
        evening:
          "Handmade pasta, wood-fired pizza, and seasonal Alaska seafood specials at In Bocca al Lupo (120 Second St., Mon–Sat 5:00–9:00 p.m., closed Sundays).",
        downtownBaseTip:
          "Confirm downtown vs. valley meeting point on your guiding confirmation the afternoon prior.",
        valleyBaseTip:
          "Valley bases sit right beside Mendenhall Lake and Auke Bay launch corridors, trimming transit time after 5+ hours outdoors.",
      },
      {
        dayBadge: "Full Day 3",
        dayType: "full_activity_day",
        title: "Small-Boat Whale Watching + Mendenhall Trails or Taku Lodge Floatplane",
        morning:
          "Morning small-group whale watch out of Statter Harbor (Juneau Tours & Whale Watch or Harv & Marv’s 6- or 18-guest boats), or Gastineau Guiding’s 3.75-hr Whales & Wilderness independent booking.",
        afternoon:
          "Hike Nugget Falls & East Glacier Loop at Mendenhall Glacier Recreation Area—or take Wings Airways’ afternoon 3-hr 5-Glacier Seaplane & Taku Lodge alderwood salmon feast from 2 Marine Way.",
        evening:
          "Final evening walk out to Overstreet Park’s waterfront promenade or Douglas Island’s Sandy Beach to watch twilight settle over Gastineau Channel.",
        downtownBaseTip:
          "Walk straight from Wings Airways’ 2 Marine Way floatplane dock back to your hotel in under 10 minutes.",
        valleyBaseTip:
          "Park free at Mendenhall’s outer trail lots (Nugget Falls / East Glacier Loop) and enjoy quiet late-afternoon trails.",
      },
      {
        dayBadge: "Departure Day",
        dayType: "arrival_departure",
        title: "Easy Morning Trail Walk, Local Coffee & JNU Flight Home",
        morning:
          "Unhurried breakfast, packing, and optional morning walk along Gold Creek / Basin Road if flying out later in the day.",
        afternoon: "Transfer to JNU Airport for your return flight.",
        evening: "Depart Juneau.",
        downtownBaseTip:
          "Allow 20 minutes by taxi from Downtown to JNU plus standard TSA/bag-drop buffer.",
        valleyBaseTip:
          "5-minute shuttle or rental car drop-off at JNU.",
      },
    ],
  },
] as const;

export const WEEKEND_ADVENTURE_CARDS: readonly AdventureCardSpec[] = [
  {
    id: "juneau-tours-whale-direct",
    categoryLabel: "Whale Watching",
    title: "Auke Bay Whale Watch (or Whale + Mendenhall Combo)",
    operatorName: "Juneau Tours & Whale Watch",
    lfseOperatorPath: "/operators/juneau-tours-and-whale-watch",
    lfseTourPath: "/tours/juneau-tours-and-whale-watch/auke-bay-whale-watch",
    sellerLabel: "Direct Operator Checkout via Rezgo (Juneau Tours & Whale Watch)",
    channelType: "rezgo_direct",
    commissionDisclosure:
      "Authorized direct referral link (refid=dccjuneau10 via DCC /go/out). Outbound clicks are measured separately from completed bookings.",
    publishedFactSummary:
      "Operated by Juneau Tours & Whale Watch in Auke Bay / Favorite Channel. Direct website lists Mendenhall Express Shuttle from $65 (3 hrs, Apr–Sep, Rezgo #344494) and Whale Watch + Mendenhall Combo from $199 (Rezgo #32329), alongside standalone Auke Bay Whale Watch (#31703).",
    restrictionsAndLogistics:
      "Check-in downtown near Goldbelt Tram / Franklin Dock plaza with narrated coach transfer (~25–30 min) to Auke Bay boats; operates reliably in rain and low cloud ceilings that ground aircraft.",
    applicableDateLabel: `Checked ${WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG} (Apr–Sep seasonal schedule)`,
    imageSrc: "/images/alaska/whale-watching.jpg",
    imageAlt: "Humpback whale breaching in calm Southeast Alaska coastal channel waters",
    imageCredit: "Photo: National Park Service / Kaitlin Thoreson (Public Domain)",
    primaryCta: {
      label: "Check direct calendar (Juneau Tours)",
      href: buildJuneauToursDirectRezgoSellerHref("auke-bay-whale-watch"),
      campaign: "lfse-weekend-juneau-tours-whale-rezgo",
      provider: "rezgo",
      productCode: "31703",
      isSellerHandoff: true,
    },
    secondaryLinks: [
      {
        label: "Whale + Mendenhall Combo profile",
        href: "/tours/juneau-tours-and-whale-watch/mendenhall-and-whale-combo",
        kind: "lfse_internal",
      },
      {
        label: "Juneau Tours LFSE operator profile",
        href: "/operators/juneau-tours-and-whale-watch",
        kind: "lfse_internal",
      },
    ],
  },
  {
    id: "harv-and-marvs-small-boat-whale",
    categoryLabel: "Whale Watching",
    title: "Small-Boat Statter Harbor Whale Watching (6- & 18-Guest Vessels)",
    operatorName: "Harv & Marv’s Outback Alaska (plus Viator Small-Group Partner Option)",
    lfseOperatorPath: "/operators/harv-and-marvs",
    lfseTourPath: "/tours/harv-and-marvs/marvs-signature-whale-watch",
    sellerLabel:
      "Viator Partner Checkout (#331813P1 · Supplier: Alaska Galore Tours) or Harv & Marv’s Official Site",
    channelType: "viator_partner",
    commissionDisclosure:
      "Partner affiliate link on Viator (pid=P00281144, mcid=42383): completed Viator bookings may earn LFSE a partner commission at no extra cost. Direct links to harvandmarvs-juneau-whale-watching.com carry $0 assumed commission.",
    publishedFactSummary:
      "Harv & Marv’s direct website (checked Nov 19, 2026) lists 4-hr tours (~3 hrs on water incl. boarding + water-level Mendenhall photo stop): Marv’s Signature (up to 18 guests, from $179) and Harv’s Original (up to 6 guests, from $210). Alternatively, Viator #331813P1 offers a 3.5-hr 14–20 passenger Auke Bay catamaran safari.",
    restrictionsAndLogistics:
      "Requires walking down a floating Statter Harbor ramp and stepping over a cabin threshold; dress warmly for open-deck marine breezes even in July.",
    applicableDateLabel: `Harv & Marv’s direct checked ${WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG}; Viator #331813P1 partner listing`,
    imageSrc: "/images/alaska/juneau-whale.jpg",
    imageAlt: "Humpback whale breaching in Juneau coastal waters",
    imageCredit: "Photo: National Park Service / Kaitlin Thoreson (Public Domain)",
    primaryCta: {
      label: "Check small-group whale watch on Viator",
      href: buildLfseViatorSellerHref({
        officialViatorUrl:
          "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1",
        productCode: "331813P1",
        campaign: "weekend-in-juneau-whale-331813p1",
      }),
      campaign: "last-frontier-weekend-in-juneau-whale-331813p1",
      provider: "viator",
      productCode: "331813P1",
      isSellerHandoff: true,
    },
    secondaryLinks: [
      {
        label: "Harv & Marv’s LFSE operator profile",
        href: "/operators/harv-and-marvs",
        kind: "lfse_internal",
      },
      {
        label: "Harv & Marv’s official site ↗",
        href: "https://www.harvandmarvs-juneau-whale-watching.com/",
        kind: "official_source",
      },
    ],
  },
  {
    id: "juneau-icefield-helicopters",
    categoryLabel: "Glacier Flightseeing",
    title: "Juneau Icefield Helicopter Glacier Walks & Crampon Ice Treks",
    operatorName: "TEMSCO Helicopters · NorthStar Trekking · Coastal Helicopters",
    lfseOperatorPath: "/ports/juneau/helicopter-glacier-tours",
    sellerLabel:
      "Viator Partner Checkout (#6251SHOREXICEWALK · Operated by Coastal) + Direct Operator Profiles on JFD",
    channelType: "viator_partner",
    commissionDisclosure:
      "Viator #6251SHOREXICEWALK is an affiliate partner link (pid=P00281144). Juneau Flight Deck provides deeper independent 3-operator comparisons and direct TEMSCO/NorthStar handoffs ($0 direct commission).",
    publishedFactSummary:
      "Direct tariffs verified Nov 18–19, 2026 (+ CBJ tax/fees): TEMSCO Mendenhall Walk (2h 15m, $449, ages 2+, +$150 at 250+ lbs clothed); Coastal Herbert Glacier Walk (~2h 35m, $459 Standard 1–259 lbs / $609 260–299 lbs / $918 300+ lbs, no lap children; also sold on Viator #6251SHOREXICEWALK); NorthStar Walkabout (3h 15m, $539, ages 8+) & Glacier Trek (4h 15m, $599, ages 12+, +$250 at 250+ lbs clothed).",
    restrictionsAndLogistics:
      "No bags, purses, selfie sticks, or drones on aircraft (small base lockers only). Accurate clothed weights required for FAA Part 135 balance. Verify channel-specific pickup (downtown 490 S. Franklin vs. eligible hotels) and voluntary cancellation window before payment; 100% refund if operator cancels for weather.",
    applicableDateLabel: "Operator direct tariffs verified Nov 18–19, 2026 (May–Sept flight season)",
    imageSrc: "/images/alaska/juneau-heli-glacier.jpg",
    imageAlt: "Helicopter landed on blue ice in the Juneau Icefield, Alaska",
    imageCredit: "Photo: Gillfoto / Wikimedia Commons (CC BY-SA 4.0)",
    primaryCta: {
      label: "Check Coastal Icefield Walk on Viator",
      href: buildLfseViatorSellerHref({
        officialViatorUrl:
          "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
        productCode: "6251SHOREXICEWALK",
        campaign: "weekend-in-juneau-coastal-6251shorexicewalk",
      }),
      campaign: "last-frontier-weekend-in-juneau-coastal-6251shorexicewalk",
      provider: "viator",
      productCode: "6251SHOREXICEWALK",
      isSellerHandoff: true,
    },
    secondaryLinks: [
      {
        label: "Compare TEMSCO vs. Coastal vs. NorthStar on Juneau Flight Deck ↗",
        href: "https://juneauflightdeck.com/temsco-vs-coastal-vs-northstar-juneau",
        kind: "jfd_guide",
      },
      {
        label: "Weight Limits & Seating Guide (JFD) ↗",
        href: "https://juneauflightdeck.com/juneau-helicopter-tour-weight-limits-and-seating",
        kind: "jfd_guide",
      },
      {
        label: "Juneau VFR Weather & FAA Cams (JFD) ↗",
        href: "https://juneauflightdeck.com/juneau-glacier-flight-weather",
        kind: "jfd_guide",
      },
    ],
  },
  {
    id: "wings-airways-taku-seaplane",
    categoryLabel: "Glacier Flightseeing",
    title: "5-Glacier Downtown Floatplane & Historic Taku Glacier Lodge Feast",
    operatorName: "Wings Airways & Taku Glacier Lodge",
    lfseOperatorPath: "/operators/wings-airways",
    lfseTourPath: "/tours/wings-airways/taku-lodge-5-glacier-seaplane",
    sellerLabel:
      "Viator Partner Checkout (#110048P1 · Operated by Wings Airways) or Wings Airways Direct",
    channelType: "viator_partner",
    commissionDisclosure:
      "Viator #110048P1 is an affiliate partner link (pid=P00281144). Direct links to wingsairways.com carry $0 assumed affiliate commission.",
    publishedFactSummary:
      "Departs directly from Downtown Juneau’s waterfront seaplane dock (2 Marine Way)—a 5–10 minute walk from downtown hotels. Every guest gets a window seat over five Juneau Icefield glaciers (Norris, Taku, Hole-In-The-Wall, East & West Twin). Direct site (checked Nov 19, 2026) lists the 3-hr Taku Lodge Salmon Feast from $465–$510 and the 40-min 5-Glacier Exploration from $325–$370.",
    restrictionsAndLogistics:
      "Requires climbing a 3-step floatplane ladder and walking ~150 yards on wooden lodge boardwalks; wild black bears frequently visit the lodge grounds (follow guide food/trail instructions).",
    applicableDateLabel: `Wings Airways direct checked ${WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG}; Viator #110048P1 partner listing`,
    imageSrc: "/images/alaska/taku-lodge.jpg",
    imageAlt: "De Havilland Otter floatplane on Southeast Alaska waters",
    imageCredit: "Photo: Neal / Wikimedia Commons (CC BY-SA 2.0)",
    primaryCta: {
      label: "Check Taku Lodge Seaplane on Viator",
      href: buildLfseViatorSellerHref({
        officialViatorUrl:
          "https://www.viator.com/tours/Juneau/Taku-Lodge-Feast-and-5-Glacier-Seaplane-Discovery/d941-110048P1",
        productCode: "110048P1",
        campaign: "weekend-in-juneau-taku-110048p1",
      }),
      campaign: "last-frontier-weekend-in-juneau-taku-110048p1",
      provider: "viator",
      productCode: "110048P1",
      isSellerHandoff: true,
    },
    secondaryLinks: [
      {
        label: "Wings Airways LFSE profile",
        href: "/operators/wings-airways",
        kind: "lfse_internal",
      },
      {
        label: "Wings Airways official site ↗",
        href: "https://wingsairways.com/",
        kind: "official_source",
      },
    ],
  },
  {
    id: "above-and-beyond-kayak-canoe",
    categoryLabel: "Kayaking & Lake Paddling",
    title: "Channel Islands Sea Kayaking with Whales & Mendenhall Lake Glacier Canoe",
    operatorName: "Above & Beyond Alaska (plus Alaska Travel Adventures Float Option)",
    lfseOperatorPath: "/operators/alaska-travel-adventures",
    sellerLabel: "Direct Operator Website — Above & Beyond Alaska (beyondak.com)",
    channelType: "operator_direct_site",
    commissionDisclosure:
      "Direct editorial link to operator website (beyondak.com): $0 affiliate commission assumed; outbound clicks recorded separately from bookings.",
    publishedFactSummary:
      "Locally employee-owned in Juneau since 2002 (checked Nov 19, 2026): Paddle with Whales Kayak Adventure (6 hrs total, 6-passenger motorboat transfer to Channel Islands State Marine Park, easy–moderate, from $449 + tax direct) and Mendenhall Glacier Canoe Paddle & Hike (5.5 hrs total, moderate, from $349 + tax direct). For a gentler 3.5-hr guided raft option, see Alaska Travel Adventures’ Mendenhall Float Trip.",
    restrictionsAndLogistics:
      "5.5–6 hour active excursions suited to full stay days rather than arrival/departure days; outfitters provide rain gear and dry bags, while guests dress in non-cotton synthetic/wool base layers.",
    applicableDateLabel: `Verified on beyondak.com ${WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG} (2027 reservations open)`,
    imageSrc: "/images/alaska/mendenhall-glacier.jpg",
    imageAlt: "Mendenhall Glacier, lake waters, and Nugget Falls near Juneau, Alaska",
    imageCredit: "Photo: Diego Delso / Wikimedia Commons (CC BY-SA 4.0)",
    primaryCta: {
      label: "View guided paddles at Above & Beyond ↗",
      href: "https://beyondak.com/",
      campaign: "lfse-weekend-juneau-abak-direct",
      provider: "direct",
      productCode: "abak-kayak-canoe",
      isSellerHandoff: true,
    },
    secondaryLinks: [
      {
        label: "Mendenhall Scenic Float Trip (LFSE)",
        href: "/tours/alaska-travel-adventures/mendenhall-glacier-float-trip",
        kind: "lfse_internal",
      },
    ],
  },
  {
    id: "mendenhall-trails-gastineau-culture",
    categoryLabel: "Walking, Trails & Culture",
    title: "Mendenhall Trails, Guided Rainforest Hikes & Downtown Cultural Anchors",
    operatorName:
      "U.S. Forest Service · Gastineau Guiding · Juneau Tours Shuttle · State & Native Museums",
    lfseOperatorPath: "/operators/gastineau-guiding",
    sellerLabel:
      "Direct Shuttle via Rezgo (Juneau Tours #344494) or Self-Guided Public Lands & Museums",
    channelType: "rezgo_direct",
    commissionDisclosure:
      "Mendenhall Express Shuttle CTA uses Juneau Tours’ authorized Rezgo link (refid=dccjuneau10 via /go/out). Museum and public-land links are non-commercial.",
    publishedFactSummary:
      "Walk Nugget Falls (~2 mi roundtrip gravel trail), Steep Creek boardwalks, and East Glacier Loop at Mendenhall Glacier Recreation Area ($5 USFS summer Visitor Center/Photo Point pass May 1–Sep 30 for ages 16+ or America the Beautiful pass; outer trails open 6 a.m.–midnight). Prefer a naturalist? Gastineau Guiding (12–20 guests) offers Guide’s Choice Hike (4.5 hrs) and direct independent Whales & Wilderness bookings (3.75 hrs). Downtown, pair Sealaska Heritage (105 S. Seward St.) with the Alaska State Museum (395 Whittier St., $14 summer / $9 winter, 18 & under free).",
    restrictionsAndLogistics:
      "Tongass trails are black-bear habitat—stay on marked paths and keep food sealed. Important Goldbelt Tram update (checked Nov 19, 2026): upper Mount Roberts tram cars at 490 S. Franklin St. were temporarily closed for assessment while the Lower Terminal coffee, carving, and gallery space remained open—check goldbelttram.com for live reopening updates.",
    applicableDateLabel: `Checked ${WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_LONG}`,
    imageSrc: "/images/alaska/rainforest-hiking.jpg",
    imageAlt: "Moss-draped Tongass National Forest trail in Southeast Alaska",
    imageCredit: "Photo: U.S. Forest Service (Public Domain)",
    primaryCta: {
      label: "Check Mendenhall Express Shuttle (Juneau Tours)",
      href: buildJuneauToursDirectRezgoSellerHref("mendenhall-glacier-shuttle"),
      campaign: "lfse-weekend-juneau-mendenhall-shuttle-rezgo",
      provider: "rezgo",
      productCode: "344494",
      isSellerHandoff: true,
    },
    secondaryLinks: [
      {
        label: "Gastineau Guiding LFSE profile",
        href: "/operators/gastineau-guiding",
        kind: "lfse_internal",
      },
      {
        label: "Alaska State Museum ↗",
        href: "https://museums.alaska.gov/asm/asmhome.html",
        kind: "official_source",
      },
      {
        label: "Sealaska Heritage ↗",
        href: "https://sealaskaheritage.org/",
        kind: "official_source",
      },
    ],
  },
] as const;

export const JUNEAU_EVENING_SPOTS: readonly EveningSpotSpec[] = [
  {
    name: "Salt",
    neighborhood: "Downtown Juneau",
    address: "200 Seward St., Juneau, AK 99801",
    officialUrl: "https://www.saltalaska.com/",
    whatToExpect:
      "Upscale-casual Alaskan seafood, butcher-cut steaks, local produce, and Juneau’s deepest wine and scotch list.",
    verifiedHoursAndSeasonality:
      "Dinner daily 5:00 p.m.–9:00 p.m. (breakfast daily from 6:00 a.m.).",
    practicalNote:
      "Third-party reservation apps are not used—call (907) 500-5000 directly to reserve a table (walk-ins welcome as space allows).",
    checkedDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
  },
  {
    name: "In Bocca al Lupo",
    neighborhood: "Downtown Juneau (Silverbow Inn ground floor)",
    address: "120 Second St., Juneau, AK 99801",
    officialUrl: "https://www.inboccaallupoak.com/",
    whatToExpect:
      "James Beard–recognized Alaskan kitchen telling Southeast Alaska’s wild salmon, local produce, Filipino, and Native culinary stories through handmade pasta and wood-fired pizza.",
    verifiedHoursAndSeasonality:
      "Dinner Monday–Saturday 5:00 p.m.–9:00 p.m. · Closed Sundays.",
    practicalNote:
      "Relaxed Alaskan dress code; plan around the Sunday closure when mapping a Fri–Sun weekend.",
    checkedDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
  },
  {
    name: "The Hangar on the Wharf",
    neighborhood: "Downtown Waterfront (Historic Merchants Wharf)",
    address: "2 Marine Way, Juneau, AK 99801",
    officialUrl: "https://www.hangaronthewharf.com/",
    whatToExpect:
      "Housed in a 1932 floatplane hangar right over Gastineau Channel—halibut, Alaskan king crab, chowder, and wide windows watching seaplanes and workboats.",
    verifiedHoursAndSeasonality:
      "Sunday–Thursday 11:00 a.m.–9:00 p.m. · Friday–Saturday 11:00 a.m.–9:30 p.m.",
    practicalNote:
      "Ideal arrival-night table (+1 907-586-5018), steps from Wings Airways’ floatplane dock and Marine Park.",
    checkedDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
  },
  {
    name: "Devil’s Club Brewing Company",
    neighborhood: "Downtown Historic District",
    address: "100 N. Franklin St., Juneau, AK 99801",
    officialUrl: "https://www.devilsclubbrewing.com/",
    whatToExpect:
      "Locally founded downtown taproom, cidery, and kitchen a block from the State Capitol and Alaska State Museum.",
    verifiedHoursAndSeasonality:
      "Monday–Saturday 11:00 a.m.–9:00 p.m. · Sunday 11:00 a.m.–8:00 p.m.",
    practicalNote:
      "Easy unreserved evening stop after an afternoon hike or whale watch; call (907) 523-BREW for current taproom events.",
    checkedDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
  },
  {
    name: "Deckhand Dave’s Fish Tacos (Seasonal) & Waterfront Seawalk",
    neighborhood: "South Franklin & Overstreet Park Waterfront",
    address: "139 S. Franklin St. → Marine Park → Overstreet Park",
    officialUrl: "https://www.deckhanddaves.com/",
    whatToExpect:
      "Locally caught Alaskan fish tacos, halibut chowder, and Alaskan oysters outdoors downtown, paired with a flat waterfront walk north to Overstreet Park’s life-size bronze whale fountain (Tahku).",
    verifiedHoursAndSeasonality:
      "Published seasonal hours: Mon–Thu 10:30 a.m.–9:00 p.m., Fri–Sat 11:00 a.m.–10:00 p.m., Sun 11:00 a.m.–8:00 p.m. (confirm spring–autumn seasonal opening dates if visiting off-peak).",
    practicalNote:
      "While some summer ships stay docked into late evening, foot traffic thins markedly north of Merchants Wharf toward Overstreet Park and across the bridge at Sandy Beach on Douglas Island.",
    checkedDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
  },
] as const;

export const GETTING_AROUND_JUNEAU_ROWS: readonly GettingAroundRow[] = [
  {
    corridor: "Downtown Juneau Core (Franklin, Seward, Second, Whittier & Marine Way)",
    distanceFromDowntown: "0 – 0.8 miles",
    walkableFromDowntown: "Yes — 5 to 15 min on foot",
    practicalTransportOptions:
      "Walk everywhere between downtown hotels, restaurants, museums, 2 Marine Way floatplanes, and 490 S. Franklin St. tour shuttles.",
    verifiedConstraint:
      "Streets above Seward/Front climb hillside grades and wooden stairs; bring grippy waterproof shoes.",
  },
  {
    corridor: "Perseverance Trailhead (Basin Road / Gold Creek)",
    distanceFromDowntown: "~1.0 mile uphill from Downtown",
    walkableFromDowntown: "Yes — ~20–25 min walk",
    practicalTransportOptions:
      "Walk up Gold St. / Basin Rd. right from downtown hotels for rainforest canyon and waterfall views without needing a car.",
    verifiedConstraint:
      "Narrow historic road approach to trailhead; check trail conditions in early spring snowmelt.",
  },
  {
    corridor: "Juneau International Airport (JNU) & Airport Heliports",
    distanceFromDowntown: "~8.5 – 9 miles north",
    walkableFromDowntown: "No — vehicle transfer required",
    practicalTransportOptions:
      "15–20 min taxi/rideshare, JNU rental car, Valley hotel airport shuttle (e.g., Frontier Suites), Capital Transit Route 6 / Express ($2 adult exact cash or Token Transit app), or included helicopter operator shuttle.",
    verifiedConstraint:
      "Confirm whether your helicopter ticket expects downtown shuttle check-in (490 S. Franklin St.) or direct base arrival.",
  },
  {
    corridor: "Mendenhall Glacier Recreation Area & Visitor Center",
    distanceFromDowntown: "~12 – 13 miles north",
    walkableFromDowntown: "No — shuttle, car, or taxi recommended",
    practicalTransportOptions:
      "20–25 min via Juneau Tours Mendenhall Express Shuttle, rental car, or taxi. Capital Transit Routes 3 & 4 ($2.00 General / $1.00 Youth exact cash or Token Transit) serve the Valley.",
    verifiedConstraint:
      "Capital Transit buses DO NOT stop at the Visitor Center—the nearest stop (Dredge Lake Rd / Glacier Spur Rd) requires a 1.5-mile (~30-minute) walk each way (3 miles roundtrip).",
  },
  {
    corridor: "Statter Harbor / Auke Bay (Whale-Watch & Kayak Docks)",
    distanceFromDowntown: "~12 miles north",
    walkableFromDowntown: "No — shuttle, car, or taxi required",
    practicalTransportOptions:
      "20–25 min via operator coach transfer from downtown, rental car (pay-and-display harbor parking), or taxi.",
    verifiedConstraint:
      "Check whether your chosen whale or kayak ticket includes roundtrip downtown coach transfer or meets dockside at Statter Harbor.",
  },
] as const;

export const WEATHER_FLEXIBILITY_ROWS: readonly WeatherSwapRow[] = [
  {
    condition: "Low cloud ceilings or gusty winds over the Juneau Icefield",
    whatPausesOrChanges:
      "FAA Part 135 VFR helicopters and floatplanes may hold or cancel upper-glacier landings (decisions are often made within ~1 hour of departure).",
    strongJuneauAlternatives:
      "Auke Bay humpback whale boats operate beneath the cloud deck on sheltered channels; Mendenhall’s Nugget Falls & rainforest trails shine in mist; Alaska State Museum & Sealaska Heritage fill an afternoon indoors.",
    honestBoundary:
      "Operators provide a 100% refund when they cancel for weather, and staying multiple days gives you time to ask about open seats tomorrow—but neither flyable weather nor replacement seat inventory is ever guaranteed.",
  },
  {
    condition: "Steady Southeast Alaska coastal rain with calm channels",
    whatPausesOrChanges:
      "Exposed alpine ridges feel chilly and slick; visibility on high peaks narrows.",
    strongJuneauAlternatives:
      "Heated-cabin whale-watch catamarans, Mendenhall Lake canoeing or Channel Islands sea kayaking in outfitted rain gear, Perseverance Trail under rainforest canopy, and cozy taproom/wharf lunches.",
    honestBoundary:
      "Waterproof hooded shell, rain pants or quick-dry hiking trousers, and non-cotton layers turn Juneau rain from a disruption into normal Tongass weather.",
  },
  {
    condition: "Crisp high-ceiling break in the clouds",
    whatPausesOrChanges:
      "Same-day helicopter and floatplane seats fill fast when cruise ships are in port.",
    strongJuneauAlternatives:
      "Keep your pre-booked Day 1 glacier flight locked in, walk out to Photo Point and Nugget Falls for clear Mendenhall icefall views, and linger on Gastineau Channel’s seawalk through late sunset.",
    honestBoundary:
      "Book high-demand summer flights (especially small-group treks and May–Aug glacier dog sledding) well ahead of arrival rather than counting on walk-up openings.",
  },
] as const;

export const PRINTABLE_QUICK_CONTACTS = [
  { label: "Capital Transit Bus Info", detail: "(907) 789-6901 · $2.00 adult exact cash / Token Transit app" },
  { label: "Alaska State Museum", detail: "395 Whittier St. · (907) 465-2901" },
  { label: "Sealaska Heritage (Walter Soboleff Bldg)", detail: "105 S. Seward St. · Downtown" },
  { label: "Salt (Dinner Reservations)", detail: "200 Seward St. · (907) 500-5000 (direct phone only)" },
  { label: "In Bocca al Lupo", detail: "120 Second St. · Mon–Sat 5–9 p.m. (closed Sun)" },
  { label: "The Hangar on the Wharf", detail: "2 Marine Way · (907) 586-5018" },
  { label: "Juneau Tours & Whale Watch", detail: "(907) 621-6502 · Auke Bay & Mendenhall Shuttle" },
  { label: "TEMSCO / NorthStar / Wings Airways", detail: "TEMSCO (907) 789-9501 · NorthStar (907) 790-4530 · Wings 2 Marine Way" },
] as const;

export const WEEKEND_CLAIM_SOURCE_LEDGER: readonly WeekendSourceLedgerRow[] = [
  {
    claimId: "JNU-STAY-01",
    operatorOrEntity: "Silverbow Inn Hotel & Suites",
    productOrScope: "Downtown Juneau boutique lodging (120 Second St.)",
    bookingChannel: "Official hotel site (silverbowinn.com — non-affiliate)",
    applicableDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
    verifiedSummary:
      "Includes breakfast, 24/7 snack bar, roof-deck hot tub & fire pits, and ground-floor In Bocca al Lupo restaurant in walkable downtown Juneau.",
    officialSourceUrl: "https://silverbowinn.com/",
  },
  {
    claimId: "JNU-STAY-02",
    operatorOrEntity: "The Historic Alaskan Hotel & Bar",
    productOrScope: "Historic 1913 downtown lodging (167 S. Franklin St.)",
    bookingChannel: "Official hotel site (thealaskanhotel.com — non-affiliate)",
    applicableDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
    verifiedSummary:
      "21+ adult establishment attached to active bar; historic hillside building has no elevator (2+ flights of stairs), no AC, and half of rooms use code-locked shared hall bathrooms.",
    officialSourceUrl: "https://www.thealaskanhotel.com/",
  },
  {
    claimId: "JNU-STAY-03",
    operatorOrEntity: "Frontier Suites Hotel in Juneau",
    productOrScope: "Mendenhall Valley / JNU Airport suite lodging (9400 Glacier Hwy)",
    bookingChannel: "Official hotel site (frontiersuites.com — non-affiliate)",
    applicableDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
    verifiedSummary:
      "All rooms/suites include full kitchens, on-site laundry, and complimentary JNU Airport & AMHS Ferry Terminal shuttle (4:00 a.m.–11:00 p.m. summer / 4:30 a.m.–10:30 p.m. winter; call 907-790-6600).",
    officialSourceUrl: "https://frontiersuites.com/",
  },
  {
    claimId: "JNU-TRANS-01",
    operatorOrEntity: "Capital Transit (City & Borough of Juneau)",
    productOrScope: "Routes 1, 3, 4, 6, 8 & 9 public bus fares & Mendenhall stop",
    bookingChannel: "Exact cash fare on board or Token Transit app",
    applicableDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
    verifiedSummary:
      "$2.00 General (19+), $1.00 Youth (6–18), Free (5 & under); buses stop at Dredge Lake Rd / Glacier Spur Rd requiring a 1.5-mile (~30-min) walk each way to Mendenhall Visitor Center.",
    officialSourceUrl: "https://juneaucapitaltransit.org/fares/",
  },
  {
    claimId: "JNU-DINE-01",
    operatorOrEntity: "Salt · In Bocca al Lupo · Hangar on the Wharf · Devil’s Club · Deckhand Dave’s",
    productOrScope: "Downtown Juneau dinner & taproom hours",
    bookingChannel: "Direct restaurant walk-in / direct phone reservation",
    applicableDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
    verifiedSummary:
      "Salt daily 5–9 p.m. (direct phone 907-500-5000 only); In Bocca al Lupo Mon–Sat 5–9 p.m. (closed Sun); Hangar Sun–Thu 11 a.m.–9 p.m. / Fri–Sat 11 a.m.–9:30 p.m.; Devil’s Club Mon–Sat 11 a.m.–9 p.m. / Sun 11 a.m.–8 p.m.; Deckhand Dave’s seasonal.",
    officialSourceUrl: "https://www.saltalaska.com/",
  },
  {
    claimId: "JNU-WHALE-01",
    operatorOrEntity: "Juneau Tours & Whale Watch · Harv & Marv’s · Alaska Galore Tours",
    productOrScope: "Auke Bay / Favorite Channel whale watching & Mendenhall shuttle",
    bookingChannel: "Rezgo Direct (#31703, #32329, #344494, refid=dccjuneau10) & Viator (#331813P1)",
    applicableDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
    verifiedSummary:
      "Juneau Tours direct site lists Mendenhall Shuttle from $65 (3h) & Whale+Glacier Combo from $199; Harv & Marv’s direct lists 18-guest from $179 & 6-guest from $210 (4h); Viator #331813P1 3.5h small-group catamaran.",
    officialSourceUrl: "https://www.juneautours.com/",
  },
  {
    claimId: "JNU-AIR-01",
    operatorOrEntity: "TEMSCO · NorthStar · Coastal · Wings Airways",
    productOrScope: "Juneau Icefield helicopters & 2 Marine Way 5-glacier floatplanes",
    bookingChannel: "Viator (#6251SHOREXICEWALK, #110048P1) + Direct operator profiles via JFD",
    applicableDate: "2026-11-18 / 2026-11-19",
    verifiedSummary:
      "TEMSCO Walk $449 (2h 15m), Coastal Walk $459 Standard (~2h 35m), NorthStar Walkabout $539 (3h 15m) / Trek $599 (4h 15m), Wings Taku Lodge Feast $465–$510 direct (3h from 2 Marine Way); 100% weather-cancel refund.",
    officialSourceUrl: "https://wingsairways.com/",
  },
  {
    claimId: "JNU-KAYAK-01",
    operatorOrEntity: "Above & Beyond Alaska · U.S. Forest Service · Goldbelt Tram · State Museum",
    productOrScope: "Guided kayaking/canoeing, Mendenhall trails, cultural museums & tram status",
    bookingChannel: "Direct operator (beyondak.com) & public agencies",
    applicableDate: WEEKEND_IN_JUNEAU_RETRIEVAL_DATE_ISO,
    verifiedSummary:
      "ABAK Channel Islands Whale Kayak (6h, from $449+tax) & Mendenhall Canoe+Hike (5.5h, from $349+tax); USFS $5 summer Visitor Center pass (16+); Alaska State Museum $14 summer / $9 winter (18 & under free); Goldbelt upper tram temporarily closed for assessment as of Nov 19, 2026 (Lower Terminal open).",
    officialSourceUrl: "https://beyondak.com/",
  },
] as const;
