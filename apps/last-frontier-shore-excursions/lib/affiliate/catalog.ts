import { NormalizedAffiliateExcursion, PortSlug } from "./types";

export const AFFILIATE_CATALOG: NormalizedAffiliateExcursion[] = [
  // ==========================================
  // JUNEAU (7 clusters)
  // ==========================================
  {
    source: "viator",
    productId: "331813P1",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Juneau/Whale-Watching-Adventure/d941-331813P1",
    provider: "Alaska Galore Tours",
    title: "Small-Group Juneau Whale Watching Cruise",
    description: "Intimate 14- to 20-passenger catamaran safari in Auke Bay and Favorite Channel. Features low-water vantage points, wrap-around exterior decks, and heated interior cabin.",
    duration: "3.5 hours",
    durationMinutes: 210,
    priceFrom: 189,
    priceLabel: "Typical from $189",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["8:30 AM", "10:30 AM", "1:00 PM", "3:30 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours before tour start for a full refund.",
    meetingPoint: "Mount Roberts Tramway Parking Plaza (Franklin Dock)",
    pickupDropoff: "Round-trip motorcoach transfer from Mount Roberts Tramway to Auke Bay Harbor included.",
    coordinates: { lat: 58.3845, lng: -134.6465 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 20 },
    ageRestrictions: "All ages welcome. Children under 2 ride free on lap.",
    accessibility: {
      wheelchairAccessible: false,
      mobilityNotes: "Requires walking down a floating harbor ramp. Step-in cabin threshold.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["whale-watching", "wildlife", "marine", "photography"],
    permittedImages: [
      { url: "/images/alaska/juneau-whale.jpg", caption: "Humpback whale tail fluke in Favorite Channel" },
    ],
    itinerary: [
      "Meet driver at Mount Roberts Tram Plaza",
      "25-minute scenic coach transit north to Auke Bay Harbor",
      "2-hour guided wildlife cruise tracking feeding humpbacks and sea lions",
      "Return coach to downtown Juneau cruise terminal",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (331813P1)",
    checkedAt: "2026-09-14",
    attributionCampaign: "juneau-whale-small-group",
    portSlug: "juneau",
    activitySlug: "whale-watching",
    weatherSensitivity: "Low",
    transferBufferMinutes: 20,
    planningMarginMinutes: 45,
  },
  {
    source: "viator",
    productId: "466119P3",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Juneau/Juneau-Whale-Watching-and-Mendenhall-Glacier-Tour/d941-466119P3",
    provider: "Juneau Tours & Whale Watch",
    title: "Juneau Whale Watching & Mendenhall Glacier Combo",
    description: "Complete Juneau overview combining a 2-hour Auke Bay whale search with 90 minutes of self-guided exploration at the Mendenhall Glacier Visitor Center and Nugget Falls trail.",
    duration: "5.5 hours",
    durationMinutes: 330,
    priceFrom: 225,
    priceLabel: "Typical from $225",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["8:30 AM", "11:30 AM", "1:30 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours before tour start for a full refund.",
    meetingPoint: "Mount Roberts Tram Plaza, Downtown Juneau",
    pickupDropoff: "Direct round-trip shuttle connecting pier, glacier recreation area, and harbor.",
    coordinates: { lat: 58.418, lng: -134.545 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 48 },
    ageRestrictions: "All ages. Suitable for multi-generational families.",
    accessibility: {
      wheelchairAccessible: true,
      mobilityNotes: "Paved trails and accessible buses. Nugget Falls gravel trail requires 1.5-mile walk.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["whale-watching", "glacier", "mendenhall", "combo"],
    permittedImages: [
      { url: "/images/alaska/mendenhall-glacier.jpg", caption: "Mendenhall Glacier and Nugget Falls waterfall" },
    ],
    itinerary: [
      "Meet downtown near cruise docks",
      "Transit to Auke Bay for 2-hour whale watch",
      "Coach transfer to Mendenhall Glacier Recreation Area (90-min stop)",
      "Return shuttle to cruise docks",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (466119P3)",
    checkedAt: "2026-09-14",
    attributionCampaign: "juneau-whale-mendenhall-combo",
    portSlug: "juneau",
    activitySlug: "mendenhall-glacier-tours",
    weatherSensitivity: "Low",
    transferBufferMinutes: 20,
    planningMarginMinutes: 45,
  },
  {
    source: "viator",
    productId: "5857SHUTTLE",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Shuttle/d941-5857SHUTTLE",
    provider: "Mendenhall Glacier Transport",
    title: "Mendenhall Glacier Express Round-Trip Shuttle",
    description: "Direct non-stop transportation between downtown cruise berths and the U.S. Forest Service Mendenhall Glacier Recreation Area. Includes park entry pass.",
    duration: "3.0 hours",
    durationMinutes: 180,
    priceFrom: 79,
    priceLabel: "Typical from $79",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior for a full refund.",
    meetingPoint: "Franklin Dock Parking Plaza / Mt Roberts Tramway",
    pickupDropoff: "Scheduled motorcoach departures every 30-60 minutes.",
    coordinates: { lat: 58.4177, lng: -134.545 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 55 },
    ageRestrictions: "All ages welcome.",
    accessibility: {
      wheelchairAccessible: true,
      mobilityNotes: "ADA lift bus available upon 48-hour advance request.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["mendenhall", "glacier", "shuttle", "budget-friendly"],
    permittedImages: [
      { url: "/images/alaska/mendenhall-visitor-center.jpg", caption: "Mendenhall Glacier Visitor Center view" },
    ],
    itinerary: [
      "Board coach downtown",
      "25-minute highway transit to Mendenhall Valley",
      "2 hours independent exploration of trails and visitor center",
      "Return transit to cruise ship docks",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (5857SHUTTLE)",
    checkedAt: "2026-09-14",
    attributionCampaign: "juneau-mendenhall-shuttle",
    portSlug: "juneau",
    activitySlug: "mendenhall-glacier-tours",
    weatherSensitivity: "Low",
    transferBufferMinutes: 15,
    planningMarginMinutes: 45,
  },
  {
    source: "viator",
    productId: "6251SHOREXICEWALK",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Juneau/Juneau-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
    provider: "Coastal Helicopters",
    title: "Juneau Shore Excursion: Helicopter Tour and Guided Icefield Walk",
    description: "Fly over the rugged crevasse fields of the Juneau Icefield before touching down on Herbert Glacier for an authentic 25-minute guided ice walk with mountaineering gear and overboots.",
    duration: "2.5 - 3.0 hours",
    durationMinutes: 165,
    priceFrom: 389,
    priceLabel: "Typical from $389",
    priceNote: "Verified partner listing rate; includes flight and guided ice walk",
    currency: "USD",
    scheduleLabel: "Frequent departures",
    datesAndTimeSlots: ["9:00 AM", "11:15 AM", "1:30 PM", "3:45 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 3 days in advance per Viator policy. 100% operator refund if flight is grounded due to cloud cover.",
    meetingPoint: "Cruise Ship Terminal / Mt. Roberts Tram Parking Area",
    pickupDropoff: "Round-trip shuttle between downtown Juneau cruise berths and heliport included.",
    coordinates: { lat: 58.3585, lng: -134.577 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 6 },
    ageRestrictions: "All ages. Weight limit policies apply (passengers 260+ lbs require surcharge or additional seat per FAA weight regulations).",
    accessibility: {
      wheelchairAccessible: false,
      mobilityNotes: "Walking on uneven glacier ice with provided overboots. ADA passenger lift available upon advance request.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["helicopter", "glacier", "aviation", "bucket-list", "coastal-helicopters"],
    permittedImages: [
      { url: "/images/alaska/juneau-heli-glacier.jpg", caption: "Helicopter landed on the Juneau Icefield" },
    ],
    itinerary: [
      "Pickup downtown near cruise ship berths and transit to heliport",
      "Safety briefing and gear fitting (glacier boots provided)",
      "30 minutes total flight time over icefalls and mountain spires",
      "25 minutes walking on Herbert Glacier ice with certified guide",
      "Return flight and downtown cruise dock transfer",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (6251SHOREXICEWALK)",
    checkedAt: "2026-09-14",
    attributionCampaign: "juneau-heli-glacier-walk",
    portSlug: "juneau",
    activitySlug: "helicopter-glacier-tours",
    weatherSensitivity: "High",
    transferBufferMinutes: 20,
    planningMarginMinutes: 45,
  },
  {
    source: "viator",
    productId: "62390P4",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Juneau/Juneau-Dog-Sledding-Discovery-and-Mushers-Camp/d941-62390P4",
    provider: "Juneau Sled Dog Adventures",
    title: "Juneau Sled Dog Discovery & Musher's Camp",
    description: "Travel by scenic shuttle along Gastineau Channel to a temperate rainforest musher camp in Sheep Creek Valley. Meet veteran Iditarod mushers, learn dog sledding traditions, experience an exhilarating wheeled summer dog-cart ride, and cuddle adorable husky puppies.",
    duration: "2.5 hours",
    durationMinutes: 150,
    priceFrom: 169,
    priceLabel: "Typical from $169",
    priceNote: "Verified partner listing rate; includes musher camp tour and dog-cart ride",
    currency: "USD",
    scheduleLabel: "Frequent departures",
    datesAndTimeSlots: ["9:00 AM", "11:30 AM", "1:30 PM", "3:30 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior for a full refund.",
    meetingPoint: "Mount Roberts Tram Parking Area / Downtown Juneau Cruise Berths",
    pickupDropoff: "Round-trip shuttle transfer between downtown Juneau cruise berths and Sheep Creek musher camp included.",
    coordinates: { lat: 58.281, lng: -134.335 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 24 },
    ageRestrictions: "All ages welcome. Very family-friendly.",
    accessibility: {
      wheelchairAccessible: true,
      mobilityNotes: "Camp paths are packed gravel; wheeled carts have step-in entry with staff assistance.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["dog-sledding", "mushers-camp", "iditarod", "puppies", "family-friendly"],
    permittedImages: [
      { url: "/images/alaska/glacier-dog-sled.jpg", caption: "Alaskan husky sled dog team at musher camp" },
    ],
    itinerary: [
      "Meet shuttle driver near downtown Juneau cruise berths",
      "Scenic 20-minute coach drive south along Gastineau Channel to Sheep Creek Valley",
      "Interactive presentation on Iditarod racing gear, nutrition, and sled dog endurance",
      "Exciting summer dog cart ride along rainforest trails behind an energetic husky team",
      "Puppy play time with future racing huskies and photo opportunities with mushers",
      "Return shuttle transfer to downtown Juneau cruise berths",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (62390P4)",
    checkedAt: "2026-09-14",
    attributionCampaign: "juneau-heli-dog-sledding",
    portSlug: "juneau",
    activitySlug: "dog-sledding",
    weatherSensitivity: "Low",
    transferBufferMinutes: 20,
    planningMarginMinutes: 45,
  },
  {
    source: "viator",
    productId: "110048P1",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Juneau/Taku-Glacier-Lodge-Flight-and-Feast/d941-110048P1",
    provider: "Wings Airways & Taku Glacier Lodge",
    title: "Taku Glacier Lodge Seaplane Flight & Salmon Feast",
    description: "Classic de Havilland Otter seaplane flight seeing 5 glaciers en route to historic 1923 Taku Lodge. Features wild Alaska King Salmon grilled over alderwood, wild black bears, and glacier river views.",
    duration: "3.5 hours",
    durationMinutes: 210,
    priceFrom: 395,
    priceLabel: "Typical from $395",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["9:00 AM", "12:00 PM", "3:00 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior. Provider-reported weather refund policy.",
    meetingPoint: "Wings Airways Floatplane Base, 2 Marine Way (Downtown Waterfront)",
    pickupDropoff: "Walking distance (5-10 mins) from Marine, Steamship, and Franklin Docks.",
    coordinates: { lat: 58.298, lng: -134.405 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 10 },
    ageRestrictions: "All ages. All forward-facing or window seating typically configured by operator.",
    accessibility: {
      wheelchairAccessible: false,
      mobilityNotes: "Must climb 3-step ladder into floatplane and walk 150 yards across wooden lodge boardwalks.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["seaplane", "flightseeing", "taku-lodge", "salmon-bake", "wildlife"],
    permittedImages: [
      { url: "/images/alaska/taku-lodge.jpg", caption: "Floatplane moored outside historic Taku Glacier Lodge" },
    ],
    itinerary: [
      "Check in at downtown floatplane dock on waterfront",
      "25-minute flightseeing over 5 icefield glaciers",
      "2 hours at historic lodge: alderwood salmon meal, nature walk, bear viewing",
      "Return seaplane flight to downtown Juneau waterfront dock",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (110048P1)",
    checkedAt: "2026-09-14",
    attributionCampaign: "juneau-taku-lodge-flight",
    portSlug: "juneau",
    activitySlug: "flightseeing",
    weatherSensitivity: "Moderate to High",
    transferBufferMinutes: 10,
    planningMarginMinutes: 45,
  },

  // ==========================================
  // SKAGWAY (5 clusters)
  // ==========================================
  {
    source: "viator",
    productId: "5338PRTSGYCITY",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Skagway/White-Pass-Summit-Rail-and-City-Tour/d943-5338PRTSGYCITY",
    provider: "White Pass & Yukon Route",
    title: "White Pass Summit Scenic Railway Excursion",
    description: "The classic 40-mile round-trip narrow-gauge rail journey climbing from sea level to 2,865 feet at the White Pass Summit. Cliffs, wooden trestles, Bridal Veil Falls, and vintage parlor cars.",
    duration: "2.75 hours",
    durationMinutes: 165,
    priceFrom: 145,
    priceLabel: "Typical from $145",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["8:15 AM", "12:45 PM", "4:30 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior.",
    meetingPoint: "Railroad Dock or Historic Skagway Train Depot (Broadway)",
    pickupDropoff: "Direct dockside train boarding alongside cruise ship at Railroad Dock.",
    coordinates: { lat: 59.458, lng: -135.313 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 75 },
    ageRestrictions: "All ages. Wheelchair lift cars available on select departures.",
    accessibility: {
      wheelchairAccessible: true,
      mobilityNotes: "Historic train cars have designated wheelchair tiedowns and accessible restrooms.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["railway", "white-pass", "train", "gold-rush", "scenic"],
    permittedImages: [
      { url: "/images/alaska/white-pass-train.jpg", caption: "White Pass steam train rounding mountain cliff trestle" },
    ],
    itinerary: [
      "Board train directly at Railroad Dock or downtown depot",
      "Climb through Skagway River gorge past Rocky Point and Glacier Station",
      "Pass over dramatic Dead Horse Gulch and wooden trestles",
      "Reach White Pass Summit (2,865 ft elevation) and return non-stop to dock",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (5338PRTSGYCITY)",
    checkedAt: "2026-09-14",
    attributionCampaign: "skagway-white-pass-summit-rail",
    portSlug: "skagway",
    activitySlug: "white-pass-railway-tours",
    weatherSensitivity: "Low",
    transferBufferMinutes: 10,
    planningMarginMinutes: 45,
  },
  {
    source: "viator",
    productId: "5338PRTSGYFULL",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Skagway/Yukon-Discovery-Tour/d943-5338PRTSGYFULL",
    provider: "Chilkoot Charters & Tours",
    title: "Bennett Lake & Yukon Suspension Bridge Rail-Bus Combo",
    description: "Take the White Pass train one-way up to Fraser, BC, then board a comfortable mini-coach into Canada's Yukon Territory. Visit Carcross Desert, Emerald Lake, and Tutshi Dog Sledding.",
    duration: "7.0 hours",
    durationMinutes: 420,
    priceFrom: 235,
    priceLabel: "Typical from $235",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["7:30 AM", "8:15 AM"],
    availabilityStatus: "limited",
    cancellationPolicy: "Free cancellation up to 24 hours prior. Valid passport required for Canadian border.",
    meetingPoint: "Broadway Dock or designated cruise ship pick-up point",
    pickupDropoff: "Round-trip pickup from all Skagway berths.",
    coordinates: { lat: 60.166, lng: -134.708 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 24 },
    ageRestrictions: "All ages with valid passports. US/Canadian visa rules apply.",
    accessibility: {
      wheelchairAccessible: false,
      mobilityNotes: "Small coach with step entry. Gravel paths at Canadian stops.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["yukon", "canada", "white-pass", "rail-and-bus", "dog-sledding"],
    permittedImages: [
      { url: "/images/alaska/yukon-emerald-lake.jpg", caption: "Emerald Lake turquoise waters in Yukon Territory" },
    ],
    itinerary: [
      "Board morning White Pass railway train to Fraser, BC",
      "Pass Canadian customs border crossing",
      "Travel Klondike Highway to Carcross and Emerald Lake",
      "Stop at Yukon Dog Camp and Suspension Bridge",
      "Return mini-coach drive down Klondike Highway directly to pier",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (5338PRTSGYFULL)",
    checkedAt: "2026-09-14",
    attributionCampaign: "skagway-yukon-rail-bus-combo",
    portSlug: "skagway",
    activitySlug: "yukon-excursions",
    weatherSensitivity: "Moderate",
    transferBufferMinutes: 15,
    planningMarginMinutes: 45,
  },
  {
    source: "viator",
    productId: "10649P17",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Skagway/Historic-Skagway-City-Tour/d943-10649P17",
    provider: "Skagway Street Car Company",
    title: "Historic Skagway Street Car & City Tour",
    description: "A theatrical 90-minute storytelling journey through historic Broadway, the Gold Rush Cemetery, and Reid Falls in a vintage 1927 yellow streetcar.",
    duration: "1.5 hours",
    durationMinutes: 90,
    priceFrom: 55,
    priceLabel: "Typical from $55",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["9:00 AM", "11:00 AM", "1:30 PM", "3:30 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior.",
    meetingPoint: "End of Broadway Dock / Downtown Waterfront",
    pickupDropoff: "Walking distance from all Skagway berths.",
    coordinates: { lat: 59.458, lng: -135.313 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 32 },
    ageRestrictions: "All ages. Very family-friendly.",
    accessibility: {
      wheelchairAccessible: false,
      mobilityNotes: "Streetcar has 3 steps to board. Flat walk at cemetery.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["history", "streetcar", "budget-friendly", "gold-rush", "short-duration"],
    permittedImages: [
      { url: "/images/alaska/skagway-streetcar.jpg", caption: "Vintage yellow streetcar on Broadway, Skagway" },
    ],
    itinerary: [
      "Board streetcar at historic dockside terminal",
      "Drive through Skagway Historic District hearing Soapy Smith tales",
      "Stop at Gold Rush Cemetery and short stroll to Reid Falls",
      "Scenic overlook stop at Skagway valley viewpoint",
      "Return downtown or to cruise docks",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (10649P17)",
    checkedAt: "2026-09-14",
    attributionCampaign: "skagway-street-car-city-tour",
    portSlug: "skagway",
    activitySlug: "gold-rush-tours",
    weatherSensitivity: "Low",
    transferBufferMinutes: 10,
    planningMarginMinutes: 45,
  },

  // ==========================================
  // KETCHIKAN (5 clusters)
  // ==========================================
  {
    source: "viator",
    productId: "6459PRTKTNMISTY",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Ketchikan/Misty-Fjords-Seaplane-Tour/d942-6459PRTKTNMISTY",
    provider: "Taquan Air / Island Wings",
    title: "Misty Fjords National Monument Floatplane Flight",
    description: "Fly deep into the 2.3-million-acre wilderness of Misty Fjords. Soar alongside 3,000-foot sheer granite sea cliffs, waterfall gorges, and land on a remote alpine fjord inlet.",
    duration: "2.0 hours",
    durationMinutes: 120,
    priceFrom: 349,
    priceLabel: "Typical from $349",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["8:00 AM", "10:15 AM", "12:30 PM", "2:45 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior. Provider-reported weather cancellation policy.",
    meetingPoint: "Ketchikan Visitors Bureau (Berth 2) or Ward Cove shuttle drop",
    pickupDropoff: "Transfer to waterfront floatplane dock included.",
    coordinates: { lat: 55.342, lng: -131.646 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 6 },
    ageRestrictions: "All ages. Headsets with pilot narration provided.",
    accessibility: {
      wheelchairAccessible: false,
      mobilityNotes: "Step-in boarding from dock float. Walking on plane pontoon during water landing.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["misty-fjords", "flightseeing", "floatplane", "bucket-list"],
    permittedImages: [
      { url: "/images/alaska/misty-fjords.jpg", caption: "Granite cliffs and waterfalls in Misty Fjords National Monument" },
    ],
    itinerary: [
      "Meet at downtown waterfront dock",
      "Take off from Tongass Narrows into mountain valleys",
      "Fly over Rudyerd Bay, New Eddystone Rock, and sheer fjord cliffs",
      "20-minute water landing on quiet fjord lake or bay",
      "Return flight to Ketchikan harbor",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (6459PRTKTNMISTY)",
    checkedAt: "2026-09-14",
    attributionCampaign: "ketchikan-misty-fjords-floatplane",
    portSlug: "ketchikan",
    activitySlug: "misty-fjords-tours",
    weatherSensitivity: "High",
    transferBufferMinutes: 15,
    planningMarginMinutes: 45,
  },
  {
    source: "viator",
    productId: "472133P3",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Ketchikan/Misty-Fjords-Wilderness-Explorer-Boat-Tour/d942-472133P3",
    provider: "Allen Marine Tours",
    title: "Misty Fjords Wilderness Cruise by High-Speed Catamaran",
    description: "Water-based voyage aboard a luxury high-speed catamaran directly into the heart of Misty Fjords. Heated interior cabin, outdoor viewing decks, and naturalist guide. Rain-safe option.",
    duration: "4.5 hours",
    durationMinutes: 270,
    priceFrom: 229,
    priceLabel: "Typical from $229",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["8:30 AM", "1:30 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior.",
    meetingPoint: "Berth 3 or Berth 4 Cruise Dock Promenade",
    pickupDropoff: "Direct boarding from downtown Ketchikan docks.",
    coordinates: { lat: 55.341, lng: -131.644 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 100 },
    ageRestrictions: "All ages. Restrooms, galley snacks, and heated seating on board.",
    accessibility: {
      wheelchairAccessible: true,
      mobilityNotes: "Vessel has ramp boarding and ADA-accessible lower viewing salon.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["misty-fjords", "boat-tour", "wildlife", "rain-safe", "catamaran"],
    permittedImages: [
      { url: "/images/alaska/allen-marine-catamaran.jpg", caption: "Allen Marine catamaran approaching New Eddystone Rock" },
    ],
    itinerary: [
      "Board high-speed catamaran directly at downtown berth",
      "Cruise through Behm Canal with bald eagle and seal viewing",
      "Enter Rudyerd Bay past 3,000-foot sheer granite walls",
      "Complimentary hot clam chowder and warm beverages served",
      "Return cruise directly to Ketchikan cruise dock",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (472133P3)",
    checkedAt: "2026-09-14",
    attributionCampaign: "ketchikan-misty-fjords-catamaran",
    portSlug: "ketchikan",
    activitySlug: "misty-fjords-tours",
    weatherSensitivity: "Low",
    transferBufferMinutes: 10,
    planningMarginMinutes: 45,
  },
  {
    source: "viator",
    productId: "445368P5",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Ketchikan/Saxman-Native-Village-Tour/d942-445368P5",
    provider: "Cape Fox Tours",
    title: "Saxman Native Village Totem Pole & Cultural Tour",
    description: "Visit Saxman Native Village to witness the world's largest collection of standing totem poles, live Tlingit clan house dancing, and active woodcarvers at the Carving Center.",
    duration: "2.5 hours",
    durationMinutes: 150,
    priceFrom: 85,
    priceLabel: "Typical from $85",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["9:00 AM", "11:30 AM", "2:00 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior.",
    meetingPoint: "Ketchikan Visitors Center, Berth 2",
    pickupDropoff: "Round-trip coach transfer from berths 1-4 and Ward Cove shuttle depot.",
    coordinates: { lat: 55.314, lng: -131.597 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 45 },
    ageRestrictions: "All ages welcome.",
    accessibility: {
      wheelchairAccessible: true,
      mobilityNotes: "Paved park paths with mild inclines. Clan house is fully accessible.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["totem-poles", "culture", "tlingit", "family-friendly", "budget-friendly"],
    permittedImages: [
      { url: "/images/alaska/saxman-totem.jpg", caption: "Carved cedar totem poles standing at Saxman Native Village" },
    ],
    itinerary: [
      "Coach transit south along the Tongass waterfront (15 mins)",
      "Guided tour of Beaver Clan House with traditional stories",
      "Walk the Totem Park examining historic memorial and mortuary poles",
      "Visit Nathan Jackson Carving Shed to watch master carvers at work",
      "Return coach to Ketchikan cruise dock",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (445368P5)",
    checkedAt: "2026-09-14",
    attributionCampaign: "ketchikan-saxman-native-village",
    portSlug: "ketchikan",
    activitySlug: "totem-and-cultural-tours",
    weatherSensitivity: "Low",
    transferBufferMinutes: 15,
    planningMarginMinutes: 45,
  },

  // ==========================================
  // SITKA (2 clusters)
  // ==========================================
  {
    source: "viator",
    productId: "472133P4",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Sitka/Sea-Otter-and-Wildlife-Quest/d944-472133P4",
    provider: "Allen Marine Tours",
    title: "Sitka Sound Sea Otter & Marine Wildlife Quest",
    description: "Navigate island-studded Sitka Sound aboard an expedition catamaran. High-probability marine wildlife encounters: rafts of sea otters, harbor seals, sea lions, and feeding humpback whales.",
    duration: "3.0 hours",
    durationMinutes: 180,
    priceFrom: 189,
    priceLabel: "Typical from $189",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["8:30 AM", "12:30 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior. Provider-reported sighting policy; check provider terms for sighting credits.",
    meetingPoint: "Sitka Sound Cruise Terminal (Old Sitka) or Crescent Harbor",
    pickupDropoff: "Departs directly from the Sitka Sound Cruise Terminal dock.",
    coordinates: { lat: 57.053, lng: -135.33 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 85 },
    ageRestrictions: "All ages. Enclosed heated salon with warm beverages included.",
    accessibility: {
      wheelchairAccessible: true,
      mobilityNotes: "Ramp boarding from dock directly to catamaran main salon.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["sea-otter", "wildlife", "marine", "sitka-sound", "whale-watching"],
    permittedImages: [
      { url: "/images/alaska/sitka-sea-otter.jpg", caption: "Sea otter floating on its back in Sitka Sound kelp beds" },
    ],
    itinerary: [
      "Board catamaran at Old Sitka Cruise Terminal",
      "Cruise the narrow passages around Middle and Kasiana Islands",
      "Encounter sea otter rafts wrapped in bull kelp beds",
      "Search for humpback whales in Eastern Channel",
      "Return directly to ship gangway dock",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (472133P4)",
    checkedAt: "2026-09-14",
    attributionCampaign: "sitka-sea-otter-wildlife-quest",
    portSlug: "sitka",
    activitySlug: "wildlife-and-historic-tours",
    weatherSensitivity: "Low",
    transferBufferMinutes: 15,
    planningMarginMinutes: 45,
  },
  {
    source: "viator",
    productId: "64781P20",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Sitka/Sitka-Raptor-Center-Tour/d944-64781P20",
    provider: "Sitka Tours & Heritage",
    title: "Alaska Raptor Center & Rainforest Sanctuary Walk",
    description: "Guided excursion visiting injured bald eagles at the renowned Alaska Raptor Center, followed by a rainforest walk among coastal totems in Sitka National Historical Park.",
    duration: "2.5 hours",
    durationMinutes: 150,
    priceFrom: 79,
    priceLabel: "Typical from $79",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["9:00 AM", "11:30 AM", "2:00 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior.",
    meetingPoint: "Harrigan Centennial Hall (Downtown Shuttle Drop)",
    pickupDropoff: "Coaches meet the continuous Old Sitka Terminal port shuttle at Centennial Hall.",
    coordinates: { lat: 57.049, lng: -135.319 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 36 },
    ageRestrictions: "All ages. Excellent for families and seniors.",
    accessibility: {
      wheelchairAccessible: true,
      mobilityNotes: "Paved pathways at Raptor Center; packed flat gravel loop in totem park.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["raptor-center", "bald-eagles", "rainforest", "totem-park", "history"],
    permittedImages: [
      { url: "/images/alaska/alaska-raptor-center.jpg", caption: "Rehabilitated bald eagle at the Alaska Raptor Center in Sitka" },
    ],
    itinerary: [
      "Meet tour guide at downtown Centennial Hall",
      "Short drive to the Alaska Raptor Center for eagle flight training clinic",
      "Guided walk through coastal temperate rainforest in Sitka National Historical Park",
      "View historic Tlingit fort site and standing totem poles along Indian River",
      "Return downtown with free time to explore St. Michael's Cathedral",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (64781P20)",
    checkedAt: "2026-09-14",
    attributionCampaign: "sitka-raptor-center-rainforest-walk",
    portSlug: "sitka",
    activitySlug: "wildlife-and-historic-tours",
    weatherSensitivity: "Low",
    transferBufferMinutes: 20,
    planningMarginMinutes: 45,
  },

  // ==========================================
  // ICY STRAIT POINT / HOONAH (1 cluster)
  // ==========================================
  {
    source: "viator",
    productId: "14707P1",
    isExactProduct: true,
    officialUrl: "https://www.viator.com/tours/Icy-Strait-Point/Icy-Strait-Whale-Watching-Tour/d22307-14707P1",
    provider: "Hoonah Travel Adventures",
    title: "Point Adolphus Premier Whale Watching from Icy Strait Point",
    description: "Cruise from Hoonah Harbor out to Point Adolphus—the most concentrated humpback whale feeding territory in all of Alaska, where nutrient-rich ocean currents meet Icy Strait.",
    duration: "3.5 hours",
    durationMinutes: 210,
    priceFrom: 185,
    priceLabel: "Typical from $185",
    priceNote: "Approximate editorial estimate; check current partner rates",
    currency: "USD",
    scheduleLabel: "Typical departures",
    datesAndTimeSlots: ["9:00 AM", "1:00 PM"],
    availabilityStatus: "available",
    cancellationPolicy: "Free cancellation up to 24 hours prior. Provider-reported wildlife sighting policy; check operator terms for credits.",
    meetingPoint: "Icy Strait Point Excursion Hub / Adventure Dock",
    pickupDropoff: "Walking distance from Wilderness Dock via Transporter Gondola.",
    coordinates: { lat: 58.204, lng: -135.452 },
    languages: ["English"],
    participantLimits: { maxGroupSize: 26 },
    ageRestrictions: "All ages welcome.",
    accessibility: {
      wheelchairAccessible: false,
      mobilityNotes: "Gangway descent down tidal harbor ramp. Step-up boat threshold.",
    },
    privateOrShared: "shared",
    mobileVoucher: true,
    tags: ["whale-watching", "point-adolphus", "marine", "wildlife", "bubble-net-feeding"],
    permittedImages: [
      { url: "/images/alaska/isp-whale-watch.jpg", caption: "Humpback whale breaching near Point Adolphus" },
    ],
    itinerary: [
      "Meet at ISP Excursion Hub",
      "Short shuttle or harbor walk to private charter slip",
      "2.5 hours on the water tracking active humpbacks and Steller sea lions",
      "Return directly to Icy Strait Point boardwalk terminal",
    ],
    sourceTimestamp: "2026-05-01T00:00:00Z",
    lastCheckedTimestamp: "2026-09-14T12:00:00Z",
    freshnessStatus: "cached",
    sourceLabel: "Verified Viator Product Listing (14707P1)",
    checkedAt: "2026-09-14",
    attributionCampaign: "isp-point-adolphus-whale-watch",
    portSlug: "icy-strait-point",
    activitySlug: "whale-and-wilderness-tours",
    weatherSensitivity: "Low",
    transferBufferMinutes: 15,
    planningMarginMinutes: 45,
  },
];

export function getAffiliateExcursion(productId: string): NormalizedAffiliateExcursion | undefined {
  return AFFILIATE_CATALOG.find((item) => item.productId === productId);
}

export function getExcursionsByPort(portSlug: PortSlug): NormalizedAffiliateExcursion[] {
  return AFFILIATE_CATALOG.filter((item) => item.portSlug === portSlug);
}

export function getExcursionsByActivity(portSlug: PortSlug, activitySlug: string): NormalizedAffiliateExcursion[] {
  return AFFILIATE_CATALOG.filter(
    (item) => item.portSlug === portSlug && item.activitySlug === activitySlug
  );
}

export function matchCatalogExcursion(
  port: string,
  name: string,
  campaignTag: string
): NormalizedAffiliateExcursion {
  // 1. Direct campaign match
  const directMatch = AFFILIATE_CATALOG.find(
    (c) =>
      c.attributionCampaign === campaignTag ||
      c.attributionCampaign.includes(campaignTag) ||
      campaignTag.includes(c.attributionCampaign)
  );
  if (directMatch) return directMatch;

  const portLower = port.toLowerCase();
  const tagLower = campaignTag.toLowerCase();
  const nameLower = name.toLowerCase();
  const portTours = AFFILIATE_CATALOG.filter((c) => c.portSlug.toLowerCase() === portLower);

  if (portLower === "juneau") {
    if (tagLower.includes("heli") || nameLower.includes("helicopter")) {
      return portTours.find((c) => c.productId === "6251SHOREXICEWALK") || portTours[0];
    }
    if (tagLower.includes("combo") || nameLower.includes("combo")) {
      return portTours.find((c) => c.productId === "466119P3") || portTours[0];
    }
    if (tagLower.includes("shuttle") || (nameLower.includes("shuttle") && !nameLower.includes("whale"))) {
      return portTours.find((c) => c.productId === "5857SHUTTLE") || portTours[0];
    }
    if (
      tagLower.includes("seaplane") ||
      tagLower.includes("flight") ||
      nameLower.includes("seaplane") ||
      nameLower.includes("lodge") ||
      nameLower.includes("feast")
    ) {
      return portTours.find((c) => c.productId === "110048P1") || portTours[0];
    }
    if (
      tagLower.includes("dog") ||
      tagLower.includes("musher") ||
      nameLower.includes("dog") ||
      nameLower.includes("sled")
    ) {
      return portTours.find((c) => c.productId === "62390P4") || portTours[0];
    }
    if (tagLower.includes("whale") || nameLower.includes("whale") || nameLower.includes("catamaran")) {
      return portTours.find((c) => c.productId === "331813P1") || portTours[0];
    }
  }

  if (portLower === "skagway") {
    if (tagLower.includes("yukon") || nameLower.includes("yukon") || nameLower.includes("bennett")) {
      return portTours.find((c) => c.productId === "5338PRTSGYFULL") || portTours[0];
    }
    if (
      tagLower.includes("street") ||
      tagLower.includes("city") ||
      nameLower.includes("street car") ||
      nameLower.includes("city")
    ) {
      return portTours.find((c) => c.productId === "10649P17") || portTours[0];
    }
    if (
      tagLower.includes("train") ||
      tagLower.includes("rail") ||
      nameLower.includes("railway") ||
      nameLower.includes("pass")
    ) {
      return portTours.find((c) => c.productId === "5338PRTSGYCITY") || portTours[0];
    }
  }

  if (portLower === "ketchikan") {
    if (
      tagLower.includes("saxman") ||
      tagLower.includes("totem") ||
      nameLower.includes("saxman") ||
      nameLower.includes("totem") ||
      nameLower.includes("rainforest")
    ) {
      return portTours.find((c) => c.productId === "445368P5") || portTours[0];
    }
    if (
      tagLower.includes("catamaran") ||
      tagLower.includes("cruise") ||
      tagLower.includes("boat") ||
      nameLower.includes("catamaran") ||
      nameLower.includes("cruise")
    ) {
      return portTours.find((c) => c.productId === "472133P3") || portTours[0];
    }
    if (
      tagLower.includes("misty") ||
      tagLower.includes("flight") ||
      tagLower.includes("seaplane") ||
      nameLower.includes("floatplane") ||
      nameLower.includes("flight")
    ) {
      return portTours.find((c) => c.productId === "6459PRTKTNMISTY") || portTours[0];
    }
  }

  if (portLower === "sitka") {
    if (tagLower.includes("raptor") || nameLower.includes("raptor")) {
      return portTours.find((c) => c.productId === "64781P20") || portTours[0];
    }
    if (
      tagLower.includes("otter") ||
      nameLower.includes("otter") ||
      nameLower.includes("whale") ||
      nameLower.includes("wildlife")
    ) {
      return portTours.find((c) => c.productId === "472133P4") || portTours[0];
    }
  }

  if (portLower === "icy-strait-point" || portLower.includes("icy") || portLower.includes("hoonah")) {
    return portTours.find((c) => c.productId === "14707P1") || portTours[0] || AFFILIATE_CATALOG[0];
  }

  return portTours[0] || AFFILIATE_CATALOG[0];
}
