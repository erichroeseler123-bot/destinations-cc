import { PARR_OPERATOR } from "@/lib/parrOperator";

export const RED_ROCKS_AMPHITHEATRE_COORDS = {
  lat: 39.6654,
  lng: -105.2057,
  elevationFeet: 6450,
} as const;

export const RED_ROCKS_VENUE_FACTS = {
  venueName: "Red Rocks Park & Amphitheatre",
  elevationFeet: 6450,
  generalParkingFeeUsd: 0,
  lotsOpenBeforeDoorsHours: 2,
  generalPostShowPickupLocation: "Jurassic Lot by Entrance 2",
  overnightVehicleRule:
    "Overnight vehicles should be moved before 10:00 a.m. the next day.",
  parrOfferingSummary:
    "Party at Red Rocks currently offers private rides and publishes $399 for a Suburban up to 6 and $599 for a van up to 10, subject to availability.",
  parrSuburbanPriceUsd: 399,
  parrSuburbanMaxGuests: 6,
  parrVanPriceUsd: 599,
  parrVanMaxGuests: 10,
  parrSubjectToAvailability: true,
  officialGettingHereUrl:
    "https://www.redrocksonline.com/plan-your-visit/getting-here/",
} as const;

export interface RedRocksShowRecord {
  eventId: string;
  artist: string;
  supportActs?: string;
  date: string; // YYYY-MM-DD
  dateDisplay: string;
  venueDoorsLocal: string; // HH:mm (24h)
  venueDoorsDisplay: string; // e.g. "6:00 p.m."
  venueShowtimeLocal: string; // HH:mm (24h)
  venueShowtimeDisplay: string; // e.g. "7:15 p.m."
  parrListingTimeDisplay: string | null; // e.g. "7:00 p.m."
  officialEventUrl: string;
  parrPrivateBookingBaseUrl: string;
  timeSeparationNote: string;
  pickupDeadlineGuidance: string;
}

export const RED_ROCKS_MIKE_NOV_14_SHOW: RedRocksShowRecord = {
  eventId: "rr-2026-11-14-mike",
  artist: "mike.",
  supportActs: "with opening DJ set from Stevie Daniels",
  date: "2026-11-14",
  dateDisplay: "Saturday, Nov. 14, 2026",
  venueDoorsLocal: "18:00",
  venueDoorsDisplay: "6:00 p.m.",
  venueShowtimeLocal: "19:15",
  venueShowtimeDisplay: "7:15 p.m.",
  parrListingTimeDisplay: "7:00 p.m.",
  officialEventUrl: "https://www.redrocksonline.com/events/mike-1239116/",
  parrPrivateBookingBaseUrl:
    "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private",
  timeSeparationNote:
    "The venue lists doors at 6:00 p.m. and showtime at 7:15 p.m., while the Party at Red Rocks listing shows 7:00 p.m. DCC uses the official venue time and keeps show time and pickup time separate.",
  pickupDeadlineGuidance:
    "Get any pickup deadline and exact pickup window from the operator (Party at Red Rocks: 720-369-6292 or contact@partyatredrocks.com) based on where your group is staying.",
};

export const RED_ROCKS_FEATURED_SHOWS: RedRocksShowRecord[] = [
  RED_ROCKS_MIKE_NOV_14_SHOW,
];

export interface RedRocksStayingPlace {
  id: string;
  name: string;
  displayName: string;
  city: string | null;
  region: string | null;
  lat: number;
  lng: number;
  source: "preset" | "search" | "gps";
  straightLineMilesToRedRocks: number;
  straightLineDistanceLabel: string;
  estimatedPreShowDriveMinutes: {
    min: number;
    max: number;
    label: string;
  };
  corridorLabel: string;
}

export const RED_ROCKS_STAYING_PRESETS: Array<{
  id: string;
  name: string;
  displayName: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
}> = [
  {
    id: "dcc-denver-union-station-lodo",
    name: "Downtown Denver (Union Station / LoDo)",
    displayName: "Union Station & LoDo, Denver, CO 80202",
    city: "Denver",
    region: "Colorado",
    lat: 39.7527,
    lng: -105.0002,
  },
  {
    id: "dcc-denver-sheraton-downtown",
    name: "Sheraton Denver Downtown (16th & Court)",
    displayName: "Sheraton Denver Downtown Hotel, 1550 Court Pl, Denver, CO 80202",
    city: "Denver",
    region: "Colorado",
    lat: 39.7422,
    lng: -104.9892,
  },
  {
    id: "dcc-denver-rino-five-points",
    name: "RiNo Art District / Five Points",
    displayName: "RiNo Art District, Larimer St, Denver, CO 80205",
    city: "Denver",
    region: "Colorado",
    lat: 39.7645,
    lng: -104.9794,
  },
  {
    id: "dcc-golden-downtown",
    name: "Golden Downtown / Foothills",
    displayName: "Downtown Golden, 12th St, Golden, CO 80401",
    city: "Golden",
    region: "Colorado",
    lat: 39.7555,
    lng: -105.2211,
  },
  {
    id: "dcc-morrison-lakewood-west",
    name: "Lakewood / Green Mountain / Morrison",
    displayName: "West Lakewood & Morrison Road Corridor, CO 80228",
    city: "Lakewood",
    region: "Colorado",
    lat: 39.6882,
    lng: -105.1531,
  },
  {
    id: "dcc-denver-tech-center",
    name: "Denver Tech Center (DTC)",
    displayName: "Denver Tech Center, Greenwood Village, CO 80111",
    city: "Greenwood Village",
    region: "Colorado",
    lat: 39.6172,
    lng: -104.8966,
  },
];

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function computeStraightLineMilesToRedRocks(
  lat: number,
  lng: number,
): number {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(RED_ROCKS_AMPHITHEATRE_COORDS.lat - lat);
  const dLng = toRadians(RED_ROCKS_AMPHITHEATRE_COORDS.lng - lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat)) *
      Math.cos(toRadians(RED_ROCKS_AMPHITHEATRE_COORDS.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusMiles * c * 10) / 10;
}

export function buildRedRocksStayingPlace(input: {
  id?: string;
  name: string;
  displayName?: string;
  city?: string | null;
  region?: string | null;
  lat: number;
  lng: number;
  source?: "preset" | "search" | "gps";
}): RedRocksStayingPlace {
  const straightLineMiles = computeStraightLineMilesToRedRocks(
    input.lat,
    input.lng,
  );
  // Pre-show canyon & highway drive estimate from straight-line distance
  const minMinutes = Math.max(12, Math.round(straightLineMiles * 1.85 + 8));
  const maxMinutes = Math.max(20, Math.round(straightLineMiles * 2.55 + 16));

  let corridorLabel = "Denver Metro → I-70 West / C-470 to Morrison";
  if (straightLineMiles <= 7.5) {
    corridorLabel = "West Metro / Golden / Morrison Foothills (CO-93 / Bear Creek)";
  } else if (input.lat < 39.65 && input.lng > -105.05) {
    corridorLabel = "South Metro / DTC → C-470 West to Morrison Exit";
  } else if (input.lat > 39.9) {
    corridorLabel = "Boulder / North Foothills → CO-93 South to Red Rocks";
  }

  return {
    id: input.id || `staying-${input.lat.toFixed(4)}-${input.lng.toFixed(4)}`,
    name: input.name,
    displayName: input.displayName || input.name,
    city: input.city ?? null,
    region: input.region ?? null,
    lat: input.lat,
    lng: input.lng,
    source: input.source || "preset",
    straightLineMilesToRedRocks: straightLineMiles,
    straightLineDistanceLabel: `${straightLineMiles.toFixed(1)} mi straight-line distance to Red Rocks Amphitheatre`,
    estimatedPreShowDriveMinutes: {
      min: minMinutes,
      max: maxMinutes,
      label: `${minMinutes}–${maxMinutes} min typical pre-show drive (via road network)`,
    },
    corridorLabel,
  };
}

function format12HourDisplay(hhmm: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return hhmm;
  const hour24 = Number(match[1]);
  const mins = match[2];
  if (!Number.isFinite(hour24)) return hhmm;
  const period = hour24 >= 12 ? "p.m." : "a.m.";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${mins} ${period}`;
}

function formatDateDisplay(ymd: string): string {
  const parsed = new Date(`${ymd}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return ymd;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function resolveRedRocksShow(params?: {
  artist?: string | null;
  date?: string | null;
  event?: string | null;
  doors?: string | null;
  showtime?: string | null;
}): RedRocksShowRecord {
  const artistParam = params?.artist?.trim() || "";
  const dateParam = params?.date?.trim() || "";
  const eventParam = params?.event?.trim() || "";

  const isMikeNov14 =
    (!artistParam && !dateParam && !eventParam) ||
    eventParam.toLowerCase() === "rr-2026-11-14-mike" ||
    (artistParam.toLowerCase().replace(/\.$/, "") === "mike" &&
      (!dateParam || dateParam === "2026-11-14")) ||
    (dateParam === "2026-11-14" && !artistParam);

  if (isMikeNov14) {
    return RED_ROCKS_MIKE_NOV_14_SHOW;
  }

  const resolvedArtist = artistParam || "Selected Red Rocks Show";
  const resolvedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : "2026-11-14";
  const resolvedDoorsLocal = params?.doors?.trim() || "18:00";
  const resolvedShowtimeLocal = params?.showtime?.trim() || "19:15";
  const slugArtist = resolvedArtist
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    eventId: eventParam || `rr-${resolvedDate}-${slugArtist || "show"}`,
    artist: resolvedArtist,
    date: resolvedDate,
    dateDisplay: formatDateDisplay(resolvedDate),
    venueDoorsLocal: resolvedDoorsLocal,
    venueDoorsDisplay: format12HourDisplay(resolvedDoorsLocal),
    venueShowtimeLocal: resolvedShowtimeLocal,
    venueShowtimeDisplay: format12HourDisplay(resolvedShowtimeLocal),
    parrListingTimeDisplay: null,
    officialEventUrl: "https://www.redrocksonline.com/events/",
    parrPrivateBookingBaseUrl:
      "https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private",
    timeSeparationNote:
      "Show time and pickup time are separate. DCC displays the venue's doors and showtime; confirm your pickup deadline directly with the operator.",
    pickupDeadlineGuidance:
      "Get any pickup deadline and exact pickup window from the operator (Party at Red Rocks: 720-369-6292 or contact@partyatredrocks.com).",
  };
}

export interface RedRocksRideComparisonCard {
  modeId: "parking" | "rideshare" | "parr_private";
  title: string;
  badge: string;
  priceHeadline: string;
  perPersonLabel: string;
  availabilityNote: string;
  showTimeVsPickupNote: string;
  postShowPickupSummary: string;
  overnightOrLotRule: string;
  groupFitSummary: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  isExternalProviderHandoff: boolean;
}

export interface RedRocksHandoffFieldAudit {
  field: string;
  queryParam: string;
  valueSent: string;
  populatesOnArrival: boolean;
  behaviorOnPartyAtRedRocks: string;
}

export interface RedRocksRidePlanEvaluation {
  show: RedRocksShowRecord;
  staying: RedRocksStayingPlace;
  partySize: number;
  scheduleSeparation: {
    venueDoorsDisplay: string;
    venueShowtimeDisplay: string;
    parrListingTimeDisplay: string | null;
    usesVenueTime: true;
    showTimeAndPickupTimeSeparate: true;
    pickupDeadlineInstruction: string;
    explanation: string;
  };
  venueFacts: typeof RED_ROCKS_VENUE_FACTS;
  parrRecommendation: {
    vehicleType: "suburban" | "van" | "multi_vehicle";
    vehicleLabel: string;
    publishedPriceUsd: number;
    vehicleQty: number;
    maxCapacityPerVehicle: number;
    perPersonUsd: number;
    subjectToAvailability: true;
    summary: string;
  };
  comparisonCards: [
    RedRocksRideComparisonCard,
    RedRocksRideComparisonCard,
    RedRocksRideComparisonCard,
  ];
  handoff: {
    privateOverviewUrl: string;
    directVehicleOptionUrl: string;
    selectedShowAndDatePopulatedOnArrival: true;
    fieldsAudit: RedRocksHandoffFieldAudit[];
    operatorContact: {
      name: string;
      phone: string;
      email: string;
    };
  };
}

export function evaluateRedRocksRidePlan(input: {
  show?: RedRocksShowRecord;
  staying?: RedRocksStayingPlace;
  partySize?: number;
}): RedRocksRidePlanEvaluation {
  const show = input.show || RED_ROCKS_MIKE_NOV_14_SHOW;
  const staying =
    input.staying ||
    buildRedRocksStayingPlace({
      ...RED_ROCKS_STAYING_PRESETS[0],
      source: "preset",
    });
  const partySize = Math.max(1, Math.min(20, Math.round(input.partySize || 6)));

  // Determine Party at Red Rocks private vehicle fit
  const isSuburbanFit = partySize <= 6;
  const isSingleVanFit = partySize > 6 && partySize <= 10;
  const vehicleType: "suburban" | "van" | "multi_vehicle" = isSuburbanFit
    ? "suburban"
    : isSingleVanFit
      ? "van"
      : "multi_vehicle";

  const vehicleQty = partySize <= 10 ? 1 : Math.ceil(partySize / 10);
  const publishedPriceUsd = isSuburbanFit
    ? RED_ROCKS_VENUE_FACTS.parrSuburbanPriceUsd
    : isSingleVanFit
      ? RED_ROCKS_VENUE_FACTS.parrVanPriceUsd
      : RED_ROCKS_VENUE_FACTS.parrVanPriceUsd * vehicleQty;
  const maxCapacityPerVehicle = isSuburbanFit ? 6 : 10;
  const perPersonUsd = Math.round((publishedPriceUsd / partySize) * 100) / 100;

  const vehicleLabel = isSuburbanFit
    ? "Private Suburban (up to 6)"
    : isSingleVanFit
      ? "Private Van (up to 10)"
      : `${vehicleQty} Private Vans (up to ${vehicleQty * 10})`;

  const optionSlug = isSuburbanFit ? "suv" : "van";

  // Build tracked handoff URLs to Party at Red Rocks
  const buildHandoffParams = () => {
    const sp = new URLSearchParams();
    sp.set("artist", show.artist);
    sp.set("date", show.date);
    sp.set("event", show.eventId);
    sp.set("qty", String(vehicleQty));
    sp.set("partySize", String(partySize));
    sp.set("guests", String(partySize));
    sp.set("vehicle", isSuburbanFit ? "suburban" : "van");
    sp.set("staying", staying.name);
    sp.set("doors", show.venueDoorsLocal);
    sp.set("showtime", show.venueShowtimeLocal);
    sp.set("src", "dcc-red-rocks-ride-planner");
    sp.set("utm_source", "destinationcommandcenter");
    sp.set("utm_medium", "referral");
    sp.set("utm_campaign", "red-rocks-ride-planner");
    return sp.toString();
  };

  const queryString = buildHandoffParams();
  const privateOverviewUrl = `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private?${queryString}`;
  const directVehicleOptionUrl = `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private/${optionSlug}?${queryString}`;

  const fieldsAudit: RedRocksHandoffFieldAudit[] = [
    {
      field: "Selected Show (Artist)",
      queryParam: "artist",
      valueSent: show.artist,
      populatesOnArrival: true,
      behaviorOnPartyAtRedRocks:
        'Populates the "Selected Night" banner on arrival (e.g. "mike. · Saturday, November 14, 2026") and attaches to Rezdy booking telemetry.',
    },
    {
      field: "Concert Date",
      queryParam: "date",
      valueSent: show.date,
      populatesOnArrival: true,
      behaviorOnPartyAtRedRocks:
        'Populates the formatted date in the "Selected Night" banner on arrival and attaches to Rezdy booking telemetry.',
    },
    {
      field: "Vehicle Quantity",
      queryParam: "qty",
      valueSent: String(vehicleQty),
      populatesOnArrival: true,
      behaviorOnPartyAtRedRocks:
        "Populates vehicleQty on the Party at Red Rocks private booking page.",
    },
    {
      field: "Event Identifier",
      queryParam: "event",
      valueSent: show.eventId,
      populatesOnArrival: true,
      behaviorOnPartyAtRedRocks:
        "Captured in the booking_opened analytics payload on arrival.",
    },
    {
      field: "Group Size & Vehicle Tier",
      queryParam: "partySize / guests / vehicle",
      valueSent: `${partySize} guests (${isSuburbanFit ? "Suburban $399 up to 6" : "Van $599 up to 10"})`,
      populatesOnArrival: false,
      behaviorOnPartyAtRedRocks: isSuburbanFit
        ? "The /private landing page displays Step 1: Private Suburban ($399 up to 6) by default; guest details are entered in the Rezdy checkout form."
        : "The /private overview page highlights Step 1 ($399 Suburban) with a +$200 Van Upgrade link to /private/van ($599 up to 10). Using the direct /private/van link opens the $599 10-Passenger Van checkout directly.",
    },
    {
      field: "Where the Group Is Staying (Pickup Location)",
      queryParam: "staying",
      valueSent: staying.name,
      populatesOnArrival: false,
      behaviorOnPartyAtRedRocks:
        "Does not pre-fill a form input on arrival; enter your pickup address in the Rezdy checkout form and confirm pickup deadline with the operator.",
    },
    {
      field: "Venue Show Time vs. Pickup Time",
      queryParam: "doors / showtime",
      valueSent: `Doors ${show.venueDoorsDisplay} · Showtime ${show.venueShowtimeDisplay}`,
      populatesOnArrival: false,
      behaviorOnPartyAtRedRocks:
        "Show time and pickup time are kept separate. Confirm your exact pickup time and deadline directly with Party at Red Rocks.",
    },
  ];

  const carsNeededForParking = partySize <= 5 ? 1 : Math.ceil(partySize / 5);
  const ridesharesNeeded = partySize <= 6 ? 1 : Math.ceil(partySize / 6);

  const parkingCard: RedRocksRideComparisonCard = {
    modeId: "parking",
    title: "Drive & Park at Red Rocks",
    badge: "Self-Drive · Sober Driver Required",
    priceHeadline: "$0 general parking",
    perPersonLabel:
      carsNeededForParking === 1
        ? "1 personal/rental vehicle + fuel"
        : `${carsNeededForParking} vehicles needed for ${partySize} guests`,
    availabilityNote:
      "Official lots open 2 hours before doors; Upper lots fill 60–90+ min before doors.",
    showTimeVsPickupNote: `Venue Doors ${show.venueDoorsDisplay} · Showtime ${show.venueShowtimeDisplay}. Plan to leave ${staying.name} (${staying.straightLineDistanceLabel}; ${staying.estimatedPreShowDriveMinutes.label}) by 4:00–4:30 p.m. for Upper lots.`,
    postShowPickupSummary:
      "35–60 minute single-lane canyon exit from park lots after the encore.",
    overnightOrLotRule:
      "Venue rule: overnight vehicles should be moved before 10:00 a.m. the next day.",
    groupFitSummary:
      carsNeededForParking === 1
        ? `Fits ${partySize} guests in 1 car if you have a committed sober driver.`
        : `A group of ${partySize} typically requires ${carsNeededForParking} cars and ${carsNeededForParking} sober drivers (or a large personal SUV/van).`,
    bullets: [
      `${staying.straightLineDistanceLabel} (${staying.estimatedPreShowDriveMinutes.label}).`,
      "Lower South & Jurassic lots require climbing 150–380+ stairs at 6,450 ft elevation if Upper lots are full.",
      "Overnight vehicles should be moved before 10:00 a.m. the next day.",
    ],
    ctaLabel: "Official Red Rocks Parking & Lot Rules ↗",
    ctaHref: RED_ROCKS_VENUE_FACTS.officialGettingHereUrl,
    isExternalProviderHandoff: false,
  };

  const rideshareCard: RedRocksRideComparisonCard = {
    modeId: "rideshare",
    title: "Rideshare (Uber / Lyft)",
    badge: "Post-Show Pickup at Jurassic Lot by Entrance 2",
    priceHeadline:
      ridesharesNeeded === 1
        ? "~$115–$205+ est. round-trip"
        : `~$${115 * ridesharesNeeded}–$${205 * ridesharesNeeded}+ (${ridesharesNeeded} vehicles)`,
    perPersonLabel:
      ridesharesNeeded === 1
        ? `1 ${partySize >= 4 ? "UberXL / Lyft XL" : "rideshare"} vehicle (~$${Math.round(160 / partySize)}/person est.)`
        : `Group of ${partySize} must split into ${ridesharesNeeded} separate rideshares`,
    availabilityNote:
      "On-demand app dispatch; no guaranteed return vehicle after the encore.",
    showTimeVsPickupNote: `Venue Doors ${show.venueDoorsDisplay} · Showtime ${show.venueShowtimeDisplay}. Request outbound ride from ${staying.name} ${staying.estimatedPreShowDriveMinutes.max + 20} min before your target gate arrival.`,
    postShowPickupSummary:
      "Venue puts general post-show pickup at Jurassic Lot by Entrance 2 (Upper North & Top Circle are closed to post-show rideshare pickup).",
    overnightOrLotRule:
      "Expect a steep downhill walk to Jurassic Lot by Entrance 2 and a 60–90+ minute post-encore wait queue.",
    groupFitSummary:
      partySize <= 6
        ? `A group of ${partySize} fits in 1 UberXL (max 6 passengers), but faces post-show surge and the Jurassic Lot by Entrance 2 queue.`
        : `A group of ${partySize} exceeds the 6-passenger UberXL limit and must split into ${ridesharesNeeded} vehicles in the Jurassic Lot by Entrance 2 queue.`,
    bullets: [
      "General post-show pickup is at Jurassic Lot by Entrance 2.",
      "No on-site vehicle during the concert to store coolers or shelter during weather holds.",
      partySize > 6
        ? `Group of ${partySize} cannot ride together in a single standard UberXL.`
        : "Heavy post-encore cell congestion and $85–$160+ surge pricing per car.",
    ],
    ctaLabel: "Official Post-Show Pickup Map (Entrance 2) ↗",
    ctaHref: RED_ROCKS_VENUE_FACTS.officialGettingHereUrl,
    isExternalProviderHandoff: false,
  };

  const parrCard: RedRocksRideComparisonCard = {
    modeId: "parr_private",
    title: "Party at Red Rocks — Private Tailgate & Ride",
    badge: isSuburbanFit
      ? "Recommended for Up to 6 · Private Suburban"
      : "Recommended for 7–10 · Private Van",
    priceHeadline: isSuburbanFit
      ? "$399 Suburban (up to 6)"
      : isSingleVanFit
        ? "$599 Van (up to 10)"
        : `$${publishedPriceUsd} (${vehicleQty} Vans)`,
    perPersonLabel: `$${perPersonUsd.toFixed(2)}/person for ${partySize} guests · Subject to availability`,
    availabilityNote:
      "Party at Red Rocks currently offers private rides and publishes $399 for a Suburban up to 6 and $599 for a van up to 10, subject to availability.",
    showTimeVsPickupNote: `Venue time: Doors ${show.venueDoorsDisplay} · Showtime ${show.venueShowtimeDisplay}${show.parrListingTimeDisplay ? ` (Party at Red Rocks listing shows ${show.parrListingTimeDisplay})` : ""}. Keep show time and pickup time separate—get any pickup deadline from the operator.`,
    postShowPickupSummary:
      "Dedicated private vehicle waits on-site through the encore, bypassing the general rideshare queue at Jurassic Lot by Entrance 2.",
    overnightOrLotRule:
      "Includes private pickup from where your group is staying, pre-show tailgate time, cooler storage during the show, and direct ride home.",
    groupFitSummary: isSuburbanFit
      ? `Your group of ${partySize} fits in 1 Private Suburban ($399 up to 6, subject to availability).`
      : isSingleVanFit
        ? `Your group of ${partySize} exceeds the 6-seat Suburban limit and fits in 1 Private Van ($599 up to 10, subject to availability).`
        : `Your group of ${partySize} requires ${vehicleQty} private vehicles (subject to availability).`,
    bullets: [
      `Published rate: ${isSuburbanFit ? "$399 for a Suburban up to 6" : "$599 for a van up to 10"}, subject to availability ($399 Suburban up to 6 / $599 van up to 10).`,
      `Show time (Doors ${show.venueDoorsDisplay} · Showtime ${show.venueShowtimeDisplay}) and pickup time are separate—get any pickup deadline from the operator.`,
      `Handoff carries ${show.artist} (${show.date}) into Party at Red Rocks' Selected Night banner.`,
    ],
    ctaLabel: isSuburbanFit
      ? `Book Private Suburban ($399 up to 6) →`
      : `Book Private Van ($599 up to 10) →`,
    ctaHref: privateOverviewUrl,
    secondaryCtaLabel: isSuburbanFit
      ? "Open Direct Suburban Checkout (/private/suv) ↗"
      : "Open Direct $599 Van Checkout (/private/van) ↗",
    secondaryCtaHref: directVehicleOptionUrl,
    isExternalProviderHandoff: true,
  };

  return {
    show,
    staying,
    partySize,
    scheduleSeparation: {
      venueDoorsDisplay: show.venueDoorsDisplay,
      venueShowtimeDisplay: show.venueShowtimeDisplay,
      parrListingTimeDisplay: show.parrListingTimeDisplay,
      usesVenueTime: true,
      showTimeAndPickupTimeSeparate: true,
      pickupDeadlineInstruction: show.pickupDeadlineGuidance,
      explanation: show.timeSeparationNote,
    },
    venueFacts: RED_ROCKS_VENUE_FACTS,
    parrRecommendation: {
      vehicleType,
      vehicleLabel,
      publishedPriceUsd,
      vehicleQty,
      maxCapacityPerVehicle,
      perPersonUsd,
      subjectToAvailability: true,
      summary: `Party at Red Rocks currently offers private rides and publishes $399 for a Suburban up to 6 and $599 for a van up to 10, subject to availability. For ${partySize} guests staying near ${staying.name}, ${vehicleLabel} is $${publishedPriceUsd} ($${perPersonUsd.toFixed(2)}/person).`,
    },
    comparisonCards: [parkingCard, rideshareCard, parrCard],
    handoff: {
      privateOverviewUrl,
      directVehicleOptionUrl,
      selectedShowAndDatePopulatedOnArrival: true,
      fieldsAudit,
      operatorContact: {
        name: PARR_OPERATOR.name,
        phone: PARR_OPERATOR.supportPhone,
        email: PARR_OPERATOR.supportEmail,
      },
    },
  };
}

// ============================================================================
// Separate Event Tracking for Ride Comparison vs. Provider Click
// ============================================================================

export type RedRocksPlannerTelemetryEventName =
  | "red_rocks_ride_comparison"
  | "red_rocks_provider_click";

export interface RedRocksPlannerTelemetryEvent {
  eventId: string;
  eventName: RedRocksPlannerTelemetryEventName;
  timestampIso: string;
  artist: string;
  date: string;
  showEventId: string;
  venueDoors: string;
  venueShowtime: string;
  stayingLocation: string;
  stayingLat: number;
  stayingLng: number;
  straightLineMiles: number;
  partySize: number;
  recommendedVehicle: "suburban" | "van" | "multi_vehicle";
  publishedPriceUsd: number;
  targetUrl?: string;
  targetSurface?: "private_overview" | "direct_vehicle_option";
}

const plannerTelemetryRingBuffer: RedRocksPlannerTelemetryEvent[] = [];

export function getRecordedRedRocksPlannerEvents(): RedRocksPlannerTelemetryEvent[] {
  return [...plannerTelemetryRingBuffer];
}

export function clearRecordedRedRocksPlannerEvents(): void {
  plannerTelemetryRingBuffer.length = 0;
}

function dispatchBrowserAnalytics(event: RedRocksPlannerTelemetryEvent): void {
  if (typeof window === "undefined") return;
  try {
    const win = window as unknown as {
      gtag?: (
        command: string,
        action: string,
        params: Record<string, unknown>,
      ) => void;
      dataLayer?: Array<Record<string, unknown>>;
    };
    win.gtag?.("event", event.eventName, { ...event });
    if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event: event.eventName, ...event });
    }
    if (event.eventName === "red_rocks_provider_click") {
      void fetch("/api/internal/parr-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "red_rocks_provider_click",
          page: "/red-rocks",
          cta: event.targetSurface || "private_overview",
          destinationUrl: event.targetUrl || "",
          timestamp: event.timestampIso,
          artist: event.artist,
          date: event.date,
          partySize: event.partySize,
          stayingLocation: event.stayingLocation,
          recommendedVehicle: event.recommendedVehicle,
          publishedPriceUsd: event.publishedPriceUsd,
        }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking telemetry
  }
}

export function trackRedRocksRideComparison(
  plan: RedRocksRidePlanEvaluation,
): RedRocksPlannerTelemetryEvent {
  const evt: RedRocksPlannerTelemetryEvent = {
    eventId: `rr_cmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    eventName: "red_rocks_ride_comparison",
    timestampIso: new Date().toISOString(),
    artist: plan.show.artist,
    date: plan.show.date,
    showEventId: plan.show.eventId,
    venueDoors: plan.show.venueDoorsDisplay,
    venueShowtime: plan.show.venueShowtimeDisplay,
    stayingLocation: plan.staying.name,
    stayingLat: plan.staying.lat,
    stayingLng: plan.staying.lng,
    straightLineMiles: plan.staying.straightLineMilesToRedRocks,
    partySize: plan.partySize,
    recommendedVehicle: plan.parrRecommendation.vehicleType,
    publishedPriceUsd: plan.parrRecommendation.publishedPriceUsd,
  };
  plannerTelemetryRingBuffer.push(evt);
  if (plannerTelemetryRingBuffer.length > 200) {
    plannerTelemetryRingBuffer.shift();
  }
  dispatchBrowserAnalytics(evt);
  return evt;
}

export function trackRedRocksProviderClick(
  plan: RedRocksRidePlanEvaluation,
  targetSurface: "private_overview" | "direct_vehicle_option" = "private_overview",
): RedRocksPlannerTelemetryEvent {
  const targetUrl =
    targetSurface === "direct_vehicle_option"
      ? plan.handoff.directVehicleOptionUrl
      : plan.handoff.privateOverviewUrl;

  const evt: RedRocksPlannerTelemetryEvent = {
    eventId: `rr_clk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    eventName: "red_rocks_provider_click",
    timestampIso: new Date().toISOString(),
    artist: plan.show.artist,
    date: plan.show.date,
    showEventId: plan.show.eventId,
    venueDoors: plan.show.venueDoorsDisplay,
    venueShowtime: plan.show.venueShowtimeDisplay,
    stayingLocation: plan.staying.name,
    stayingLat: plan.staying.lat,
    stayingLng: plan.staying.lng,
    straightLineMiles: plan.staying.straightLineMilesToRedRocks,
    partySize: plan.partySize,
    recommendedVehicle: plan.parrRecommendation.vehicleType,
    publishedPriceUsd: plan.parrRecommendation.publishedPriceUsd,
    targetUrl,
    targetSurface,
  };
  plannerTelemetryRingBuffer.push(evt);
  if (plannerTelemetryRingBuffer.length > 200) {
    plannerTelemetryRingBuffer.shift();
  }
  dispatchBrowserAnalytics(evt);
  return evt;
}
