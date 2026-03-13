export type NationalParkActivity = {
  label: string;
  query: string;
};

export type NationalParkLink = {
  label: string;
  href: string;
};

export type NationalParkAddress = {
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
};

export type NationalParkGeo = {
  latitude: number;
  longitude: number;
};

export type NationalParkAuthorityConfig = {
  slug: string;
  name: string;
  state: string;
  region: string;
  heroSummary: string;
  cruiseRelevance: string;
  bestTime: string;
  driveSignal: string;
  topActivities: NationalParkActivity[];
  knownForBullets: string[];
  logisticsNotes: string[];
  faq: Array<{ question: string; answer: string }>;
  geo: NationalParkGeo;
  address: NationalParkAddress;
  nearbyLinks: NationalParkLink[];
  mapX: string;
  mapY: string;
  updatedAt: string;
};

export const NATIONAL_PARKS_AUTHORITY_CONFIG: Record<string, NationalParkAuthorityConfig> = {
  "rocky-mountain": {
    slug: "rocky-mountain",
    name: "Rocky Mountain National Park",
    state: "CO",
    region: "Colorado Front Range",
    heroSummary:
      "A high-intent Colorado park for alpine drives, bear lake hikes, timed-entry planning, and day trips paired with Denver or Red Rocks travel.",
    cruiseRelevance:
      "Not a cruise stop, but a strong land-extension park for Denver-based travelers who already think in route timing and logistics windows.",
    bestTime: "June through September for full alpine access; shoulder season works if you avoid high-elevation assumptions.",
    driveSignal: "Strong Denver pairing with early-start timing and traffic-sensitive return planning.",
    topActivities: [
      { label: "Guided Rocky Mountain tours", query: "Rocky Mountain National Park guided tour" },
      { label: "Bear Lake hikes", query: "Bear Lake Rocky Mountain National Park tour" },
      { label: "Estes Park day trips", query: "Estes Park day trip" },
      { label: "Wildlife and scenic drives", query: "Rocky Mountain National Park scenic drive tour" },
    ],
    knownForBullets: [
      "Trail Ridge Road and high-alpine scenery",
      "Bear Lake corridor demand",
      "Timed-entry planning pressure in peak season",
      "Denver and Estes Park day-trip pairing",
    ],
    logisticsNotes: [
      "Timed-entry rules can decide whether the day works at all, so verify access assumptions before committing.",
      "Afternoon weather and parking pressure both reward early starts.",
      "This park works best when the day has one main hike or scenic objective instead of too many stops.",
    ],
    faq: [
      {
        question: "Can you do Rocky Mountain as a day trip from Denver?",
        answer:
          "Yes, but the day works best when you start early, account for timed-entry requirements, and avoid overpacking multiple trail zones.",
      },
      {
        question: "What is Rocky Mountain National Park best known for?",
        answer:
          "Alpine drives, mountain views, wildlife spotting, and hike-heavy planning around Bear Lake and Trail Ridge Road.",
      },
      {
        question: "When is the easiest time to visit Rocky Mountain?",
        answer:
          "Shoulder season can be simpler, but summer gives the fullest access if you handle entry timing and crowds correctly.",
      },
    ],
    geo: { latitude: 40.3428, longitude: -105.6836 },
    address: {
      addressLocality: "Estes Park",
      addressRegion: "Colorado",
      addressCountry: "US",
    },
    nearbyLinks: [
      { label: "Denver authority page", href: "/denver" },
      { label: "National parks hub", href: "/national-parks" },
      { label: "Argo shuttle layer", href: "/mighty-argo-shuttle" },
    ],
    mapX: "58%",
    mapY: "40%",
    updatedAt: "2026-03-11",
  },
  zion: {
    slug: "zion",
    name: "Zion National Park",
    state: "UT",
    region: "Southwest Utah",
    heroSummary:
      "A demand-heavy Utah park where shuttle systems, canyon crowding, and hike choice matter more than broad sightseeing checklists.",
    cruiseRelevance:
      "Useful as a route-minded land park for travelers who already respond to timing, transport, and controlled-access planning.",
    bestTime: "Spring and fall are the easiest broad windows; summer requires earlier starts and heat discipline.",
    driveSignal: "Works best when paired with Springdale and one primary canyon objective.",
    topActivities: [
      { label: "Guided Zion hikes", query: "Zion National Park guided hike" },
      { label: "Canyon scenic tours", query: "Zion canyon scenic tour" },
      { label: "Springdale day plans", query: "Springdale Utah day trip" },
      { label: "Private Zion transport", query: "Zion private tour" },
    ],
    knownForBullets: [
      "Narrows and Angels Landing demand",
      "Shuttle-dependent canyon planning",
      "Heat and crowd management",
      "Springdale gateway logistics",
    ],
    logisticsNotes: [
      "Zion fails fastest when visitors underestimate shuttle timing and walking distance.",
      "Heat turns average-looking hikes into real constraints in summer.",
      "Choose one signature objective instead of trying to cover the full canyon in one day.",
    ],
    faq: [
      {
        question: "Do you need the Zion shuttle?",
        answer:
          "For the main canyon in key periods, yes. That makes timing part of the trip architecture, not a small detail.",
      },
      {
        question: "What is Zion best known for?",
        answer:
          "Zion is best known for canyon hiking, big walls, Narrows demand, and tightly structured access in high season.",
      },
      {
        question: "Is one day enough for Zion?",
        answer:
          "One day can work if the plan is narrow and realistic. It usually fails when people stack too many trail ambitions.",
      },
    ],
    geo: { latitude: 37.2982, longitude: -113.0263 },
    address: {
      addressLocality: "Springdale",
      addressRegion: "Utah",
      addressCountry: "US",
    },
    nearbyLinks: [
      { label: "National parks hub", href: "/national-parks" },
      { label: "Las Vegas authority page", href: "/vegas" },
      { label: "Tours hub", href: "/tours" },
    ],
    mapX: "45%",
    mapY: "53%",
    updatedAt: "2026-03-11",
  },
  "grand-canyon": {
    slug: "grand-canyon",
    name: "Grand Canyon National Park",
    state: "AZ",
    region: "Northern Arizona",
    heroSummary:
      "A flagship park where rim choice, tour structure, and travel time matter more than broad bucket-list language.",
    cruiseRelevance:
      "No cruise tie-in, but it behaves like a high-intent authority page because visitors need a hard decision on route, rim, and tour style.",
    bestTime: "Spring and fall are the easiest broad windows; summer needs heat planning and stronger route control.",
    driveSignal: "Choose South Rim, West Rim, or aerial product first. That single decision changes the whole day.",
    topActivities: [
      { label: "South Rim day tours", query: "Grand Canyon South Rim day tour" },
      { label: "Helicopter flights", query: "Grand Canyon helicopter tour" },
      { label: "Scenic overlook tours", query: "Grand Canyon scenic tour" },
      { label: "Private canyon transport", query: "Grand Canyon private tour" },
    ],
    knownForBullets: [
      "South Rim versus West Rim decision pressure",
      "Helicopter and scenic flight demand",
      "Long transfer realities from Las Vegas or Phoenix routes",
      "Heat and return-time discipline",
    ],
    logisticsNotes: [
      "Visitors often waste time by not locking the correct rim before booking anything else.",
      "Long-drive day trips need less ambition, not more.",
      "Flight and helicopter products are the cleanest way to compress distance if budget allows.",
    ],
    faq: [
      {
        question: "What is the biggest Grand Canyon planning mistake?",
        answer:
          "Confusing the rims and building a plan around the wrong one. Route choice comes before everything else.",
      },
      {
        question: "Is the Grand Canyon a day trip?",
        answer:
          "Yes, but only if the day is structured around one rim and realistic transfer time.",
      },
      {
        question: "What are the best Grand Canyon tours?",
        answer:
          "South Rim day tours, helicopter flights, scenic overlook routes, and private transport-backed plans are the strongest categories.",
      },
    ],
    geo: { latitude: 36.1069, longitude: -112.1129 },
    address: {
      addressLocality: "Grand Canyon Village",
      addressRegion: "Arizona",
      addressCountry: "US",
    },
    nearbyLinks: [
      { label: "Las Vegas authority page", href: "/vegas" },
      { label: "National parks hub", href: "/national-parks" },
      { label: "Tours hub", href: "/tours" },
    ],
    mapX: "43%",
    mapY: "61%",
    updatedAt: "2026-03-11",
  },
  yellowstone: {
    slug: "yellowstone",
    name: "Yellowstone National Park",
    state: "WY",
    region: "Wyoming and Montana gateway zone",
    heroSummary:
      "A large-format park where wildlife, geyser basins, and internal driving distances force a real route decision before the day starts.",
    cruiseRelevance:
      "No cruise tie-in, but it has the same routing complexity as a port day because distances and stop choices control the experience.",
    bestTime: "Late spring through early fall for the broadest access, with shoulder season offering fewer crowds.",
    driveSignal: "Yellowstone works best when the day is built around one basin or loop instead of trying to clear the entire park.",
    topActivities: [
      { label: "Yellowstone wildlife tours", query: "Yellowstone wildlife tour" },
      { label: "Old Faithful and geyser tours", query: "Yellowstone geyser basin tour" },
      { label: "Private Yellowstone drivers", query: "Yellowstone private tour" },
      { label: "Lamar Valley day plans", query: "Lamar Valley wildlife tour" },
    ],
    knownForBullets: [
      "Old Faithful and geyser basin demand",
      "Wildlife viewing in Hayden and Lamar corridors",
      "Massive internal driving distances",
      "Best-value days built around one clear route spine",
    ],
    logisticsNotes: [
      "Yellowstone punishes vague plans because distances absorb more time than first-time visitors expect.",
      "Wildlife and thermal areas are better when the day is route-led instead of stop-led.",
      "Entry point and overnight base change the right itinerary completely.",
    ],
    faq: [
      {
        question: "Can you see Yellowstone in one day?",
        answer:
          "Only a piece of it. The right move is choosing one high-signal zone rather than pretending the whole park fits in a single day.",
      },
      {
        question: "What is Yellowstone best known for?",
        answer:
          "Geysers, thermal areas, wildlife, and unusually large park geography that requires disciplined routing.",
      },
      {
        question: "Should you book a tour in Yellowstone?",
        answer:
          "Tours can be strong when you want wildlife timing, photography support, or a simpler basin-focused day without self-driving decisions.",
      },
    ],
    geo: { latitude: 44.428, longitude: -110.5885 },
    address: {
      addressLocality: "Yellowstone National Park",
      addressRegion: "Wyoming",
      addressCountry: "US",
    },
    nearbyLinks: [
      { label: "National parks hub", href: "/national-parks" },
      { label: "Tours hub", href: "/tours" },
      { label: "Alaska authority page", href: "/alaska" },
    ],
    mapX: "49%",
    mapY: "31%",
    updatedAt: "2026-03-11",
  },
  yosemite: {
    slug: "yosemite",
    name: "Yosemite National Park",
    state: "CA",
    region: "Sierra Nevada",
    heroSummary:
      "A premium California park where valley access, waterfall timing, and lodging or transfer strategy shape the actual trip value.",
    cruiseRelevance:
      "Not cruise-linked, but a classic authority page because access, route congestion, and seasonal waterfall expectations matter a lot.",
    bestTime: "Late spring for waterfalls, summer for broad access, and fall for easier movement with lower water flow.",
    driveSignal: "Pick Yosemite Valley, Glacier Point, or a high-country priority first. Mixed plans usually collapse under traffic and distance.",
    topActivities: [
      { label: "Yosemite Valley tours", query: "Yosemite Valley guided tour" },
      { label: "Waterfall sightseeing", query: "Yosemite waterfall tour" },
      { label: "Private Yosemite day trips", query: "Yosemite private day trip" },
      { label: "Scenic photography tours", query: "Yosemite photography tour" },
    ],
    knownForBullets: [
      "Yosemite Valley crowd concentration",
      "Waterfall timing and seasonal expectations",
      "Long transfer and gate-line realities",
      "Photography-heavy demand",
    ],
    logisticsNotes: [
      "Valley time disappears quickly if you arrive late.",
      "Yosemite is best when expectations match the season; waterfall intensity changes a lot.",
      "One defined area beats trying to cross the whole park in a day.",
    ],
    faq: [
      {
        question: "When is Yosemite most impressive?",
        answer:
          "Late spring is strongest for waterfalls, but the best season depends on whether you care more about water, access, or lighter crowds.",
      },
      {
        question: "Can Yosemite be done as a day trip?",
        answer:
          "Yes, but the day must be scoped tightly and start early or the park will feel more like traffic than scenery.",
      },
      {
        question: "What are the best Yosemite activities?",
        answer:
          "Valley tours, waterfall-focused sightseeing, scenic photography, and guided day trips remain the strongest categories.",
      },
    ],
    geo: { latitude: 37.8651, longitude: -119.5383 },
    address: {
      addressLocality: "Yosemite Valley",
      addressRegion: "California",
      addressCountry: "US",
    },
    nearbyLinks: [
      { label: "National parks hub", href: "/national-parks" },
      { label: "Tours hub", href: "/tours" },
      { label: "San Francisco port", href: "/ports/san-francisco" },
    ],
    mapX: "20%",
    mapY: "49%",
    updatedAt: "2026-03-11",
  },
  glacier: {
    slug: "glacier",
    name: "Glacier National Park",
    state: "MT",
    region: "Northwest Montana",
    heroSummary:
      "A high-signal mountain park for Going-to-the-Sun Road planning, glacier scenery, and route windows shaped by seasonal access.",
    cruiseRelevance:
      "No cruise tie-in, but it is logistics-heavy in the same way because open roads, seasonal timing, and route length dictate the day.",
    bestTime: "Summer offers the broadest access; shoulder season requires more caution around road assumptions.",
    driveSignal: "Going-to-the-Sun Road is the main structuring decision, not a casual add-on.",
    topActivities: [
      { label: "Going-to-the-Sun tours", query: "Going-to-the-Sun Road tour" },
      { label: "Glacier scenic tours", query: "Glacier National Park scenic tour" },
      { label: "Private park transport", query: "Glacier National Park private tour" },
      { label: "Wildlife and lake routes", query: "Glacier National Park wildlife tour" },
    ],
    knownForBullets: [
      "Going-to-the-Sun Road demand",
      "Seasonal access volatility",
      "Big-scenery driving value",
      "Structured touring over casual wandering",
    ],
    logisticsNotes: [
      "Road openings and park access rules can invalidate a plan fast.",
      "This park is more route-based than stop-based; choose the drive spine first.",
      "Wildfire smoke and weather can alter scenic value even when access technically exists.",
    ],
    faq: [
      {
        question: "What is Glacier National Park best known for?",
        answer:
          "Glacier is best known for Going-to-the-Sun Road, mountain scenery, and a short true-access season.",
      },
      {
        question: "Is Glacier hard to plan?",
        answer:
          "It can be if you assume full access too early or too late in the season. Road status changes everything.",
      },
      {
        question: "What are the best Glacier tours?",
        answer:
          "Scenic road tours, private transport-backed sightseeing, and wildlife-focused day plans are the strongest categories.",
      },
    ],
    geo: { latitude: 48.7596, longitude: -113.787 },
    address: {
      addressLocality: "West Glacier",
      addressRegion: "Montana",
      addressCountry: "US",
    },
    nearbyLinks: [
      { label: "National parks hub", href: "/national-parks" },
      { label: "Tours hub", href: "/tours" },
      { label: "Alaska authority page", href: "/alaska" },
    ],
    mapX: "33%",
    mapY: "22%",
    updatedAt: "2026-03-11",
  },
  acadia: {
    slug: "acadia",
    name: "Acadia National Park",
    state: "ME",
    region: "Coastal Maine",
    heroSummary:
      "A coastal park where sunrise demand, Bar Harbor pairings, and park-loop access shape a compact but high-value day.",
    cruiseRelevance:
      "Acadia has the cleanest cruise-adjacent logic in this group because Bar Harbor and coastal itineraries create strong overlap with port-style planning.",
    bestTime: "Late spring through fall, with shoulder season often giving the best balance of access and crowd pressure.",
    driveSignal: "Acadia works best when treated as a Bar Harbor plus park-loop decision instead of a broad Maine road trip day.",
    topActivities: [
      { label: "Acadia scenic tours", query: "Acadia National Park scenic tour" },
      { label: "Bar Harbor pairings", query: "Bar Harbor Acadia tour" },
      { label: "Cadillac Mountain day plans", query: "Cadillac Mountain tour" },
      { label: "Private coastal guides", query: "Acadia private tour" },
    ],
    knownForBullets: [
      "Bar Harbor and Acadia pairing",
      "Cadillac Mountain demand",
      "Compact but crowded scenic routing",
      "Strong shoulder-season value",
    ],
    logisticsNotes: [
      "Acadia is compact, but that does not mean friction-free on busy days.",
      "Parking and traffic still matter around the most famous viewpoints.",
      "The best days combine one scenic route, one viewpoint, and a clean Bar Harbor plan.",
    ],
    faq: [
      {
        question: "Is Acadia easy to pair with Bar Harbor?",
        answer:
          "Yes. That is one of the strongest reasons the park works well as a compact authority page and day-plan destination.",
      },
      {
        question: "What is Acadia best known for?",
        answer:
          "Acadia is best known for coastal scenery, Cadillac Mountain, park-loop drives, and Bar Harbor proximity.",
      },
      {
        question: "Do you need a tour in Acadia?",
        answer:
          "Not always, but tours help when you want a cleaner scenic circuit and less parking friction.",
      },
    ],
    geo: { latitude: 44.3386, longitude: -68.2733 },
    address: {
      addressLocality: "Bar Harbor",
      addressRegion: "Maine",
      addressCountry: "US",
    },
    nearbyLinks: [
      { label: "National parks hub", href: "/national-parks" },
      { label: "Cruise explorer", href: "/cruises" },
      { label: "Tours hub", href: "/tours" },
    ],
    mapX: "86%",
    mapY: "24%",
    updatedAt: "2026-03-11",
  },
  "great-smoky-mountains": {
    slug: "great-smoky-mountains",
    name: "Great Smoky Mountains National Park",
    state: "TN",
    region: "Tennessee and North Carolina",
    heroSummary:
      "A high-volume Appalachian park where scenic drives, Gatlinburg pairings, and family-first route planning beat generic hiking overload.",
    cruiseRelevance:
      "No cruise tie-in, but it is a classic route-minded destination where gateway town choice decides the feel of the trip.",
    bestTime: "Spring and fall are the cleanest broad windows, with fall foliage driving some of the heaviest demand.",
    driveSignal: "Best when paired tightly with Gatlinburg, Pigeon Forge, or one mountain route objective.",
    topActivities: [
      { label: "Scenic drive tours", query: "Great Smoky Mountains scenic tour" },
      { label: "Gatlinburg day plans", query: "Gatlinburg Smoky Mountains tour" },
      { label: "Wildlife and nature routes", query: "Great Smoky Mountains wildlife tour" },
      { label: "Private mountain guides", query: "Smoky Mountains private tour" },
    ],
    knownForBullets: [
      "Family-friendly scenic planning",
      "Fall foliage demand",
      "Gatlinburg and Pigeon Forge gateway logic",
      "Drive-heavy value rather than alpine route structure",
    ],
    logisticsNotes: [
      "Traffic volume is the main penalty for a vague plan.",
      "This park works best when you decide whether the day is scenic, hike-led, or town-paired.",
      "Peak foliage periods require more time discipline than visitors expect.",
    ],
    faq: [
      {
        question: "What is Great Smoky Mountains National Park best known for?",
        answer:
          "It is best known for scenic mountain routes, family-friendly planning, fall foliage, and Gatlinburg access.",
      },
      {
        question: "Can you do Smokies with kids?",
        answer:
          "Yes. It is one of the most flexible parks for family-first route planning if you keep the day simple.",
      },
      {
        question: "Do you need a guide in the Smokies?",
        answer:
          "Not always, but a guided route can help if you want cleaner wildlife, scenic, or day-structure decisions.",
      },
    ],
    geo: { latitude: 35.6118, longitude: -83.4895 },
    address: {
      addressLocality: "Gatlinburg",
      addressRegion: "Tennessee",
      addressCountry: "US",
    },
    nearbyLinks: [
      { label: "National parks hub", href: "/national-parks" },
      { label: "Tours hub", href: "/tours" },
      { label: "New Orleans authority page", href: "/new-orleans" },
    ],
    mapX: "67%",
    mapY: "57%",
    updatedAt: "2026-03-11",
  },
  olympic: {
    slug: "olympic",
    name: "Olympic National Park",
    state: "WA",
    region: "Olympic Peninsula",
    heroSummary:
      "A broad Washington park where coast, rainforest, and mountain zones compete for the same day, making route discipline the real differentiator.",
    cruiseRelevance:
      "Strongly route-based, similar to a complicated port day: one great zone beats trying to sample the whole peninsula at once.",
    bestTime: "Late spring through early fall is the broadest window, with shoulder season often offering cleaner movement.",
    driveSignal: "Olympic is a choose-one-zone park unless you are staying overnight.",
    topActivities: [
      { label: "Olympic scenic tours", query: "Olympic National Park scenic tour" },
      { label: "Rainforest routes", query: "Olympic National Park rainforest tour" },
      { label: "Hurricane Ridge plans", query: "Hurricane Ridge tour" },
      { label: "Coastal park day trips", query: "Olympic coast day tour" },
    ],
    knownForBullets: [
      "Multiple ecosystems in one park",
      "Peninsula drive-time complexity",
      "Rainforest, coast, and mountain tradeoffs",
      "Best-value days built around one zone",
    ],
    logisticsNotes: [
      "Olympic gets worse when you try to touch all three major ecosystems in one day.",
      "Choose coast, rainforest, or ridge first, then build the rest around that.",
      "Weather and visibility can make one zone stronger than another on a given day.",
    ],
    faq: [
      {
        question: "Can you do Olympic National Park in one day?",
        answer:
          "Only partially. The right move is choosing a single zone and treating the rest as future return value.",
      },
      {
        question: "What is Olympic best known for?",
        answer:
          "Olympic is best known for rainforest, coastline, mountain views, and unusual ecosystem variety.",
      },
      {
        question: "What are the best Olympic activities?",
        answer:
          "Scenic tours, rainforest routes, Hurricane Ridge plans, and coastal-focused day trips are the strongest categories.",
      },
    ],
    geo: { latitude: 47.8021, longitude: -123.6044 },
    address: {
      addressLocality: "Port Angeles",
      addressRegion: "Washington",
      addressCountry: "US",
    },
    nearbyLinks: [
      { label: "Seattle port authority page", href: "/ports/seattle" },
      { label: "National parks hub", href: "/national-parks" },
      { label: "Cruise explorer", href: "/cruises" },
    ],
    mapX: "12%",
    mapY: "17%",
    updatedAt: "2026-03-11",
  },
  denali: {
    slug: "denali",
    name: "Denali National Park",
    state: "AK",
    region: "Interior Alaska",
    heroSummary:
      "A landmark Alaska park where weather, scale, and limited-access park transit matter more than casual sightseeing assumptions.",
    cruiseRelevance:
      "This is the strongest cruise-adjacent park in the set because Alaska visitors often pair it with broader route and extension planning.",
    bestTime: "Summer is the main access season, with visibility and wildlife still varying heavily by day.",
    driveSignal: "Denali is a transit and route-discipline park. Clear conditions and the right tour structure matter more than speed.",
    topActivities: [
      { label: "Denali natural history tours", query: "Denali natural history tour" },
      { label: "Wildlife and tundra routes", query: "Denali wildlife tour" },
      { label: "Flightseeing", query: "Denali flightseeing" },
      { label: "Alaska park extensions", query: "Denali day trip" },
    ],
    knownForBullets: [
      "Weather-dependent mountain visibility",
      "Bus and transit-style internal access",
      "Wildlife and tundra touring",
      "High-value Alaska extension planning",
    ],
    logisticsNotes: [
      "Visibility of the mountain is never guaranteed, so build the day around more than one visual hope.",
      "Internal park movement is structured; this is not a drive-anywhere park experience.",
      "Flightseeing is the cleanest premium option when the weather allows it.",
    ],
    faq: [
      {
        question: "Can you see Denali in one day?",
        answer:
          "You can experience it in one day, but the result depends heavily on weather, tour structure, and how much internal access you book.",
      },
      {
        question: "What is Denali best known for?",
        answer:
          "Denali is best known for Alaska scale, wildlife touring, mountain visibility, and structured transit into the park.",
      },
      {
        question: "Should you book a tour in Denali?",
        answer:
          "Usually yes. Structured transport and guided access make the day far cleaner than ad hoc planning.",
      },
    ],
    geo: { latitude: 63.1148, longitude: -151.1926 },
    address: {
      addressLocality: "Denali Park",
      addressRegion: "Alaska",
      addressCountry: "US",
    },
    nearbyLinks: [
      { label: "Alaska authority page", href: "/alaska" },
      { label: "National parks hub", href: "/national-parks" },
      { label: "Cruise explorer", href: "/cruises" },
    ],
    mapX: "18%",
    mapY: "20%",
    updatedAt: "2026-03-11",
  },
};

export function listNationalParkSlugs(): string[] {
  return Object.keys(NATIONAL_PARKS_AUTHORITY_CONFIG).sort();
}

export function getNationalParkBySlug(slug: string): NationalParkAuthorityConfig | null {
  return NATIONAL_PARKS_AUTHORITY_CONFIG[slug] || null;
}
