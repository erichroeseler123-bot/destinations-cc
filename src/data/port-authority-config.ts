export type PortAuthorityLink = {
  label: string;
  href: string;
};

import type { RealityEvidenceItem } from "@/app/components/dcc/RealityEvidenceSection";

export type PortExcursionCategory = {
  label: string;
  viatorQuery?: string;
  viatorTourId?: string;
};

export type PortAuthorityConfig = {
  updatedAt: string;
  refreshIntervalDays: number;
  heroTitle?: string;
  summary: string;
  cruiseRelevance: string;
  tenderDock: string;
  excursionLength: string;
  nearbyTown: string;
  excursionCategories: PortExcursionCategory[];
  cruiseSeason: string;
  excursionCtaLabel?: string;
  excursionCtaHref?: string;
  transferCtaLabel?: string;
  transferCtaHref?: string;
  knownFor: string[];
  nearbyZones: string[];
  logistics: string[];
  realityCheckSummary?: string[];
  realityCheckEvidence?: RealityEvidenceItem[];
  faq: Array<{ question: string; answer: string }>;
  relatedLinks: PortAuthorityLink[];
  cruisePortHref?: string;
  canonicalCruisePortSlug?: string;
};

export type ResolvedPortAuthorityConfig = PortAuthorityConfig & {
  isFallback: boolean;
};

function toursHref(query: string): string {
  return `/tours?q=${encodeURIComponent(query)}`;
}

function category(label: string, viatorQuery?: string, viatorTourId?: string): PortExcursionCategory {
  return { label, viatorQuery, viatorTourId };
}

function baseLinks(portName: string): PortAuthorityLink[] {
  return [
    { label: `Browse ${portName} tours`, href: toursHref(`${portName} shore excursions`) },
    { label: "Cruise explorer", href: "/cruises" },
    { label: "Ports directory", href: "/ports" },
  ];
}

function evidence(
  title: string,
  url: string,
  source: string,
  whyItMatters: string,
  options?: {
    type?: RealityEvidenceItem["type"];
    timestamp?: string;
    tags?: string[];
  }
): RealityEvidenceItem {
  return {
    title,
    url,
    source,
    type: options?.type || "video",
    whyItMatters,
    timestamp: options?.timestamp,
    tags: options?.tags,
  };
}

export const PORT_AUTHORITY_CONFIG: Record<string, PortAuthorityConfig> = {
  santorini: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 120,
    heroTitle: "Santorini Cruise Port",
    summary:
      "A high-demand Aegean stop known for caldera views, cliffside towns, winery excursions, and boat days built around Oia and Fira.",
    cruiseRelevance:
      "Cruise travelers use Santorini for scenic viewpoints, village touring, winery stops, and sailing-heavy shore days.",
    tenderDock: "Tender port for most cruise calls; cable car and uphill transfer logistics matter.",
    excursionLength: "4 to 6 hours is the common planning window.",
    nearbyTown: "Fira is the main gateway; Oia is the signature excursion zone.",
    excursionCategories: [
      category("Oia and Fira touring", "Santorini Oia Fira shore excursion"),
      category("Catamaran cruises", "Santorini catamaran cruise from cruise port"),
      category("Winery visits", "Santorini winery tour"),
      category("Private drivers", "Santorini private shore excursion"),
    ],
    cruiseSeason: "Peak Mediterranean cruise demand runs roughly April through October.",
    knownFor: [
      "Caldera cliff views and postcard scenery",
      "Oia sunsets and village photo stops",
      "Half-day sailing and swimming itineraries",
      "Wine tastings built around volcanic soils",
      "Heavy same-day cruise visitor volume in peak season",
    ],
    nearbyZones: ["Fira", "Oia", "Imerovigli", "Perissa", "Akrotiri"],
    logistics: [
      "Tender timing can compress shore time on busy days.",
      "Cable car queues and upland transport delays are real peak-day bottlenecks.",
      "Private drivers and organized tours reduce coordination risk if you want Oia plus winery or beach stops.",
      "Leave buffer before all-aboard because downhill and tender return timing can stack late in the day.",
    ],
    faq: [
      {
        question: "Can you explore Santorini without a tour?",
        answer:
          "Yes, but self-planned days still depend on tender timing, cable car queues, and road congestion between Fira and Oia.",
      },
      {
        question: "Is Santorini usually tendered?",
        answer:
          "For most cruise calls, yes. That makes transfer timing more important than at straightforward dockside ports.",
      },
      {
        question: "What are the most common shore excursions in Santorini?",
        answer:
          "Oia and Fira touring, catamaran sailings, winery visits, and private island tours are the main cruise-driven categories.",
      },
    ],
    relatedLinks: baseLinks("Santorini"),
  },
  roatan: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 90,
    heroTitle: "Roatan Cruise Port",
    summary:
      "A Caribbean port built around reef access, beach clubs, zipline and wildlife stops, and easy half-day shore excursion packaging.",
    cruiseRelevance:
      "Roatan is a volume excursion port where travelers usually choose between reef water activities, beach days, island touring, or combo packages.",
    tenderDock: "Dock port for mainstream cruise traffic; excursion pickup flow is generally straightforward.",
    excursionLength: "3 to 6 hours covers most cruise-day excursions.",
    nearbyTown: "Mahogany Bay and West Bay anchor most cruise-day movement.",
    excursionCategories: [
      category("Snorkeling and diving", "Roatan snorkeling shore excursion"),
      category("Beach clubs", "Roatan beach break"),
      category("Zipline tours", "Roatan zipline tour"),
      category("Island drivers", "Roatan private island tour"),
    ],
    cruiseSeason: "Caribbean cruise demand runs year-round, with stronger winter volume.",
    knownFor: [
      "Barrier reef access and clear-water snorkeling",
      "West Bay beach demand",
      "Animal park and zipline combo tours",
      "Private driver days with multiple stop flexibility",
      "Cruise-focused beach and reef excursions with simple transfer patterns",
    ],
    nearbyZones: ["Mahogany Bay", "West Bay", "West End", "French Harbour", "Gumbalimba area"],
    logistics: [
      "Traffic can build between port zones and West Bay when multiple ships are in.",
      "Reef and beach excursions are weather-sensitive, so backup plans matter.",
      "Combo tours save time if you want beach plus sightseeing in one call.",
      "Keep return buffer because island road speed is slower than first-time visitors expect.",
    ],
    faq: [
      {
        question: "What is Roatan best known for on a cruise stop?",
        answer:
          "Roatan is best known for snorkeling, diving, beach clubs, zipline combos, and easy island touring.",
      },
      {
        question: "Do you need a tour in Roatan?",
        answer:
          "Not always, but tours or private drivers simplify beach transfers and multi-stop planning on ship days.",
      },
      {
        question: "How much time do you need for a Roatan shore excursion?",
        answer:
          "Most cruise travelers book in the 3 to 6 hour range depending on whether they want one beach stop or a combo day.",
      },
    ],
    relatedLinks: baseLinks("Roatan"),
  },
  nassau: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 90,
    heroTitle: "Nassau Cruise Port",
    summary:
      "A high-volume Bahamas port where travelers split between resort passes, city sightseeing, beach time, boat trips, and short transfer-friendly excursions.",
    cruiseRelevance:
      "Nassau works as a short-call cruise port with broad excursion inventory and high independent traveler traffic.",
    tenderDock: "Dock port with dense pedestrian and transfer activity near the cruise zone.",
    excursionLength: "2 to 5 hours is the common excursion band.",
    nearbyTown: "Downtown Nassau is the immediate cruise gateway.",
    excursionCategories: [
      category("Beach breaks", "Nassau beach break"),
      category("Boat trips", "Nassau snorkeling cruise"),
      category("Resort day passes", "Nassau resort day pass"),
      category("City highlights", "Nassau city tour"),
    ],
    cruiseSeason: "Bahamas demand is strongest in winter and spring but remains active year-round.",
    knownFor: [
      "Short-transfer cruise convenience",
      "Resort and beach club demand",
      "Harbor boat excursions and snorkeling",
      "Easy city-center walking access from port",
      "Heavy multi-ship crowding on peak days",
    ],
    nearbyZones: ["Downtown Nassau", "Cable Beach", "Paradise Island", "Junkanoo Beach", "Arawak Cay"],
    logistics: [
      "Nassau can feel crowded fast when several ships are in port.",
      "Independent beach or resort plans work best when you keep conservative return timing.",
      "Boat trips and snorkeling departures are efficient, but weather can shift day-of availability.",
      "Short port calls favor excursions with simple transportation and fixed re-entry timing.",
    ],
    realityCheckSummary: [
      "Downtown can feel saturated fast when several ships are in at once.",
      "Short calls reward simple transportation and fixed return timing more than over-ambitious beach hopping.",
      "Boat and snorkeling inventory looks easy on paper, but weather can still erase options on the day.",
    ],
    realityCheckEvidence: [
      evidence(
        "What I Wish I Knew Before Visiting Nassau on a Cruise",
        "https://www.youtube.com/watch?v=hOqmc0r-Kyg",
        "Independent cruiser footage",
        "Useful for setting expectations around port-area crowds, noise, and how quickly Nassau can feel saturated on heavy ship days.",
        { timestamp: "Starts around 0:34 for the busy port-area walkthrough.", tags: ["crowds", "logistics"] }
      ),
      evidence(
        "Nassau Ship Spotting & Port Thoughts (Carnival Liberty vlog, 2025)",
        "https://www.youtube.com/watch?v=Q13KVBEDK6Q",
        "Carnival Liberty traveler vlog",
        "Good visual proof for multi-ship crowding and why Nassau can feel compressed when several large ships land at once.",
        { timestamp: "Use around 5:50 for ship volume and 9:41 for the traveler take on Nassau.", tags: ["crowds", "port flow"] }
      ),
      evidence(
        "Princess Cays Tender Boat Ride Back (recent experience)",
        "https://www.youtube.com/watch?v=rfODaDntvFM",
        "Recent cruiser clip",
        "Not Nassau itself, but a strong nearby Bahamas tender reference when you want a visual example of tender return timing and boarding friction.",
        { tags: ["tendering", "timing"] }
      ),
    ],
    faq: [
      {
        question: "Can you explore Nassau on your own from the cruise port?",
        answer:
          "Yes. Nassau is one of the easier Caribbean ports for independent walking and short taxi-based days.",
      },
      {
        question: "What are the most popular excursions in Nassau?",
        answer:
          "Beach escapes, boat trips, resort passes, snorkeling, and short city tours are the main cruise patterns.",
      },
      {
        question: "Is Nassau a good port for a half-day excursion?",
        answer:
          "Yes. Nassau is well-suited to short, transfer-light excursions because the cruise zone is close to major visitor areas.",
      },
    ],
    relatedLinks: [
      ...baseLinks("Nassau"),
      { label: "Cruise schedule view", href: "/cruises/port/nassau-bahamas" },
    ],
    cruisePortHref: "/cruises/port/nassau-bahamas",
    canonicalCruisePortSlug: "nassau-bahamas",
  },
  cozumel: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 90,
    heroTitle: "Cozumel Cruise Port",
    summary:
      "One of the Caribbean's most established cruise ports, built around reef excursions, beach clubs, jeep outings, and ferry-linked mainland add-ons.",
    cruiseRelevance:
      "Cozumel is a shore excursion heavyweight with strong snorkeling, diving, beach, and private island touring demand.",
    tenderDock: "Dock port with multiple cruise piers and high excursion throughput.",
    excursionLength: "3 to 6 hours is the standard planning window.",
    nearbyTown: "San Miguel is the main urban anchor near the port zone.",
    excursionCategories: [
      category("Snorkeling and diving", "Cozumel snorkeling shore excursion"),
      category("Beach clubs", "Cozumel beach club"),
      category("Jeep tours", "Cozumel jeep tour"),
      category("Private island drivers", "Cozumel private shore excursion"),
    ],
    cruiseSeason: "Year-round Caribbean traffic, with high winter and spring cruise volume.",
    knownFor: [
      "Reef and marine excursion depth",
      "Beach club and all-inclusive day-pass inventory",
      "Beginner-friendly snorkeling and diving",
      "Flexible taxi and private-driver touring",
      "Large-scale cruise infrastructure with multiple ship days",
    ],
    nearbyZones: ["San Miguel", "Chankanaab area", "West coast beach clubs", "Punta Sur zone", "El Cedral"],
    logistics: [
      "Pier location affects transfer time, so excursion operators matter.",
      "Marine activities depend on wind and sea conditions.",
      "Private drivers are useful if you want beach plus local sightseeing in one day.",
      "Leave real buffer because pier security re-entry and taxi queues can slow late returns.",
    ],
    realityCheckSummary: [
      "Pier choice changes how easy the day feels, even when the island itself looks simple on a map.",
      "Beach clubs and reef trips can look interchangeable online, but wind and marine conditions change the quality fast.",
      "Late-day taxi and pier re-entry friction can compress independent plans more than first-timers expect.",
    ],
    realityCheckEvidence: [
      evidence(
        "Cozumel, Mexico Port Day - Star of the Seas Day 4",
        "https://www.youtube.com/watch?v=cGZVBRR4z0g",
        "Recent cruise vlog",
        "Shows what a typical independent Cozumel port day actually feels like, including arrival, movement off the pier, and how the day flows once you leave the cruise zone.",
        { tags: ["port flow", "independent day"] }
      ),
      evidence(
        "Cruise Shore Excursions: Are They Worth It?",
        "https://www.youtube.com/watch?v=E7HscEJwJRA",
        "Cruise planning video",
        "Useful when comparing cruise-line beach and snorkeling products against independent operators in a port where DIY planning is common.",
        { tags: ["excursions", "planning"] }
      ),
      evidence(
        "Cozumel cruise port map and visitor planning",
        "https://www.cozumelcruisetours.com/cozumel-cruise-port-map/",
        "Port planning reference",
        "Helps users understand how pier location affects taxi time and whether a beach club or downtown plan is actually close enough for a short call.",
        { type: "map", tags: ["map", "logistics"] }
      ),
    ],
    faq: [
      {
        question: "What is Cozumel best known for on cruise stops?",
        answer:
          "Cozumel is best known for snorkeling, diving, beach clubs, jeep tours, and straightforward private-driver touring.",
      },
      {
        question: "Can you do Cozumel without a booked excursion?",
        answer:
          "Yes, but booked excursions reduce coordination risk if you want reef activities or multi-stop plans.",
      },
      {
        question: "Are Cozumel shore excursions usually full-day?",
        answer:
          "Most cruise excursions are half-day to medium-length, typically around 3 to 6 hours.",
      },
    ],
    relatedLinks: [
      ...baseLinks("Cozumel"),
      { label: "Cruise schedule view", href: "/cruises/port/cozumel-mexico" },
    ],
    cruisePortHref: "/cruises/port/cozumel-mexico",
    canonicalCruisePortSlug: "cozumel-mexico",
  },
  juneau: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 60,
    heroTitle: "Juneau Cruise Port",
    summary:
      "A flagship Alaska cruise stop known for whale watching, glacier access, floatplane demand, and shore days that need weather and timing discipline.",
    cruiseRelevance:
      "Juneau is one of the highest-intent Alaska ports for premium wildlife, glacier, and flightseeing excursions.",
    tenderDock: "Primarily dockside cruise handling with organized transfer-heavy touring.",
    excursionLength: "3 to 6 hours is the core Alaska booking range.",
    nearbyTown: "Downtown Juneau is the immediate cruise gateway.",
    excursionCategories: [
      category("Whale watching", "Juneau whale watching"),
      category("Mendenhall combinations", "Juneau Mendenhall Glacier tour"),
      category("Flightseeing", "Juneau flightseeing"),
      category("Salmon and wildlife tours", "Juneau wildlife tour"),
    ],
    cruiseSeason: "Alaska cruise season is concentrated from roughly May through September.",
    knownFor: [
      "Whale watching and wildlife density",
      "Mendenhall Glacier demand",
      "High-value flightseeing inventory",
      "Weather-sensitive premium excursions",
      "Strong cruise traveler purchase intent versus simple wandering",
    ],
    nearbyZones: ["Downtown Juneau", "Mendenhall area", "Auke Bay", "Douglas", "Mount Roberts access"],
    logistics: [
      "Weather can directly affect whale, glacier, and flightseeing operations.",
      "Popular excursions can sell out early on peak ship days.",
      "Independent plans work, but transfer timing to Auke Bay or glacier areas needs attention.",
      "Alaska ports reward earlier booking and conservative all-aboard buffers.",
    ],
    realityCheckSummary: [
      "Wildlife and glacier operators can still miss the perfect day because Alaska weather changes fast.",
      "Premium excursion days often matter more than casual wandering, so sold-out inventory is a real risk.",
      "Transfer-heavy Juneau plans break down when people underestimate weather and buffer time.",
    ],
    realityCheckEvidence: [
      evidence(
        "Our Favorite Inside Passage Shore Excursions for 2025",
        "https://www.youtube.com/watch?v=SpapGwBn5kM",
        "Alaska cruise excursion roundup",
        "Strong cross-port visual reference for whale watching, Mendenhall, and flightseeing expectations when weather and excursion timing matter.",
        {
          timestamp: "Jump to 1:15 for whale watching, 2:06 for helicopter/dogsled, and 3:40 for White Pass rail context.",
          tags: ["weather", "wildlife", "excursions"],
        }
      ),
      evidence(
        "Must-Do Alaska Shore Excursions for 2025 Cruises",
        "https://www.youtube.com/watch?v=eeHUWn0AWcQ",
        "Recent Alaska cruise planning video",
        "Useful for comparing how much excursion variety Alaska ports actually offer and why early-booked wildlife or glacier products matter.",
        { tags: ["planning", "shore excursions"] }
      ),
    ],
    faq: [
      {
        question: "What are the best-known Juneau shore excursions?",
        answer:
          "Whale watching, Mendenhall Glacier combinations, flightseeing, and wildlife-focused tours are the main draw.",
      },
      {
        question: "Can you explore Juneau without a tour?",
        answer:
          "Yes, especially downtown, but the signature glacier and wildlife experiences usually require transport or a booked excursion.",
      },
      {
        question: "How much buffer should you keep in Juneau?",
        answer:
          "Keep meaningful buffer because Alaska weather and excursion transfer timing can shift more than travelers expect.",
      },
    ],
    relatedLinks: [
      ...baseLinks("Juneau"),
      { label: "Alaska guide", href: "/alaska" },
      { label: "Cruise schedule view", href: "/cruises/port/juneau-alaska" },
    ],
    cruisePortHref: "/cruises/port/juneau-alaska",
    canonicalCruisePortSlug: "juneau-alaska",
  },
  portmiami: {
    updatedAt: "2026-03-12",
    refreshIntervalDays: 60,
    heroTitle: "PortMiami Cruise Hub",
    summary:
      "A major cruise embarkation hub where terminal choice, traffic timing, staging discipline, and same-day transfer planning matter more than sightseeing.",
    cruiseRelevance:
      "PortMiami is a logistics-heavy cruise gateway. Travelers use it for embarkation flow, transfer timing, airport routing, hotel staging, and pre-cruise buffer decisions.",
    tenderDock: "Major dockside embarkation terminals with lane-specific traffic and staging pressure.",
    excursionLength: "PortMiami is usually about embarkation or disembarkation logistics, not a classic shore-excursion call.",
    nearbyTown: "Downtown Miami, Brickell, and Miami Beach are the main pre- and post-cruise anchors.",
    excursionCategories: [
      category("Port transfers", "PortMiami cruise transfer"),
      category("Pre-cruise Miami tours", "Miami pre cruise tour"),
      category("Airport to port routing", "Miami airport to PortMiami transfer"),
      category("Post-cruise sightseeing", "Miami post cruise tour"),
    ],
    cruiseSeason: "Cruise activity runs year-round, with winter and spring often feeling heaviest for traffic and same-day compression.",
    knownFor: [
      "Large embarkation volume and terminal complexity",
      "Airport, hotel, and rideshare staging decisions",
      "Traffic risk before all-aboard",
      "Strong pre- and post-cruise hotel demand",
      "Port-first logistics rather than sightseeing-first planning",
    ],
    nearbyZones: ["PortMiami terminals", "Downtown Miami", "Brickell", "Miami Beach", "MIA airport corridor"],
    logistics: [
      "Terminal choice changes how stressful rideshare and drop-off flow feels.",
      "Port traffic stacks fast on heavy embarkation mornings, so conservative arrival windows matter.",
      "Same-day airport to ship plans carry real risk if flight timing drifts.",
      "Hotel staging the night before is often the cleaner move when sailing volume is high.",
    ],
    realityCheckSummary: [
      "PortMiami is more about terminal logic and traffic than sightseeing glamor.",
      "Cruise-day traffic and terminal assignment create more friction than first-time visitors expect.",
      "Same-day airport arrivals still carry real failure risk even when the port itself looks close on a map.",
    ],
    realityCheckEvidence: [
      evidence(
        "Princess Cays Tender Process Walkthrough (Carnival Magic, recent sailing)",
        "https://www.youtube.com/watch?v=5n5nfWTXTJs",
        "TAP (Tonya, Alexis, & Pete)",
        "Useful cross-reference when PortMiami pages talk about tender-dependent itineraries and excursion boarding discipline in the Bahamas.",
        { timestamp: "Boarding starts around 1:41.", tags: ["tendering", "bahamas"] }
      ),
      evidence(
        "Demystifying Royal Caribbean Check-In & Tender Ports",
        "https://www.youtube.com/watch?v=K8ACq2Tx-0E",
        "Royal Caribbean traveler planning video",
        "Helpful for staging and pre-boarding expectations when travelers are trying to understand embarkation friction and tender-port sequencing.",
        { timestamp: "Use around 6:24 for the tender-port process discussion.", tags: ["embarkation", "staging"] }
      ),
      evidence(
        "The SHOCKING Truth About Cruise Excursions (Save Hundreds!)",
        "https://www.youtube.com/watch?v=iY-ejGBeajU",
        "Cruise excursion strategy video",
        "Good reality-check companion for DCC transfer and pre-booking advice when users are weighing ship excursions against independent planning.",
        { tags: ["planning", "independent"] }
      ),
    ],
    faq: [
      {
        question: "Should you arrive in Miami on sailing day?",
        answer:
          "It is possible, but PortMiami works best when you remove airline drift and traffic compression by staging the night before.",
      },
      {
        question: "What matters most at PortMiami?",
        answer:
          "Terminal assignment, airport or hotel transfer timing, traffic, and how much buffer you leave before embarkation cutoff.",
      },
      {
        question: "Is PortMiami mainly for sightseeing?",
        answer:
          "No. It is primarily a logistics hub, so the main planning value is routing and staging rather than destination touring.",
      },
    ],
    relatedLinks: [
      { label: "Browse Miami hotels", href: "/miami" },
      { label: "Cruise explorer", href: "/cruises" },
      { label: "Ports directory", href: "/ports" },
      { label: "Miami beaches", href: "/miami/beaches" },
    ],
  },
  ketchikan: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 60,
    heroTitle: "Ketchikan Cruise Port",
    summary:
      "An Alaska port with strong wildlife and adventure demand, known for floatplanes, bears, salmon-season interest, and compact town access near the cruise zone.",
    cruiseRelevance:
      "Ketchikan is a high-conversion Alaska stop for travelers choosing between wildlife, flightseeing, lumberjack-style attractions, and fishing experiences.",
    tenderDock: "Primarily dockside cruise handling with efficient town access.",
    excursionLength: "2.5 to 5 hours is the most common range.",
    nearbyTown: "Downtown Ketchikan and Creek Street are the core visitor zones.",
    excursionCategories: [
      category("Floatplane trips", "Ketchikan floatplane tour"),
      category("Bear and wildlife tours", "Ketchikan wildlife tour"),
      category("Fishing", "Ketchikan fishing excursion"),
      category("Misty Fjords excursions", "Ketchikan Misty Fjords tour"),
    ],
    cruiseSeason: "Alaska season runs mainly from May through September.",
    knownFor: [
      "Misty Fjords demand",
      "Floatplane and wildlife combinations",
      "Compact walkable cruise-town feel",
      "Fishing and salmon identity",
      "Strong excursion demand despite shorter port calls",
    ],
    nearbyZones: ["Downtown Ketchikan", "Creek Street", "Misty Fjords access", "Saxman", "Ward Cove corridor"],
    logistics: [
      "Ward Cove or alternate berth patterns can change transfer assumptions.",
      "Wildlife and flightseeing remain weather-sensitive.",
      "Shorter calls make sequencing important if you want both town time and a premium excursion.",
      "Book early for Misty Fjords and other limited-capacity tours.",
    ],
    realityCheckSummary: [
      "Ward Cove and alternate berth patterns can change what looks like a simple walkable day.",
      "Flightseeing and wildlife value can vanish fast when visibility or weather turns.",
      "Short calls make it harder to combine premium excursions with much downtown wandering.",
    ],
    realityCheckEvidence: [
      evidence(
        "Our Favorite Inside Passage Shore Excursions for 2025",
        "https://www.youtube.com/watch?v=SpapGwBn5kM",
        "Alaska cruise excursion roundup",
        "Useful Ketchikan planning reference for Misty Fjords and flightseeing expectations when deciding whether premium scenic inventory is worth the cost.",
        { timestamp: "Jump to 5:46 for Misty Fjords flightseeing context.", tags: ["weather", "flightseeing"] }
      ),
      evidence(
        "Ketchikan cruise port guide and berth context",
        "https://www.ketchikan.info/cruise-ships",
        "Local port planning reference",
        "Helps show how berth location can change transfer assumptions, especially when Ward Cove enters the route equation.",
        { type: "map", tags: ["berths", "logistics"] }
      ),
    ],
    faq: [
      {
        question: "What is Ketchikan best known for on cruise itineraries?",
        answer:
          "Ketchikan is known for Misty Fjords, floatplanes, bear viewing, fishing, and easy downtown access.",
      },
      {
        question: "Can you walk around Ketchikan from the port?",
        answer:
          "Usually yes for central areas, though exact transfer needs vary by berth setup.",
      },
      {
        question: "Which Ketchikan excursions need the most advance planning?",
        answer:
          "Floatplane, wildlife, and Misty Fjords products are the most time-sensitive to book.",
      },
    ],
    relatedLinks: [
      ...baseLinks("Ketchikan"),
      { label: "Alaska guide", href: "/alaska" },
      { label: "Cruise schedule view", href: "/cruises/port/ketchikan-alaska" },
    ],
    cruisePortHref: "/cruises/port/ketchikan-alaska",
    canonicalCruisePortSlug: "ketchikan-alaska",
  },
  skagway: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 60,
    heroTitle: "Skagway Cruise Port",
    summary:
      "A classic Alaska cruise stop centered on White Pass route demand, Gold Rush history, rail and scenic touring, and structured half-day excursion planning.",
    cruiseRelevance:
      "Skagway is one of the clearest excursion-led Alaska ports, with rail and scenic corridor products driving much of the demand.",
    tenderDock: "Dock port with easy access into the small historic core.",
    excursionLength: "3 to 5 hours covers most cruise-day bookings.",
    nearbyTown: "Historic downtown Skagway is the immediate port zone.",
    excursionCategories: [
      category("White Pass rail", "Skagway White Pass rail"),
      category("Scenic coach tours", "Skagway scenic tour"),
      category("History tours", "Skagway history tour"),
      category("Outdoor adventure", "Skagway adventure tour"),
    ],
    cruiseSeason: "Alaska demand is concentrated in the May to September season.",
    knownFor: [
      "White Pass and Yukon route demand",
      "Gold Rush history positioning",
      "Rail and coach combo products",
      "Compact town for easy post-tour walking",
      "High excursion relevance relative to casual wandering",
    ],
    nearbyZones: ["Historic downtown", "White Pass corridor", "Klondike points", "Scenic trailheads", "Harbor zone"],
    logistics: [
      "Rail and coach products run on fixed timing, so they are easier to plan than fully independent days.",
      "Weather and visibility affect scenic value even when operations run on time.",
      "Town access is simple, but premium excursion slots can tighten quickly on big ship days.",
      "Keep buffer if you mix structured touring with separate shopping or hiking plans.",
    ],
    realityCheckSummary: [
      "Skagway is easy to walk, but the high-value day still usually revolves around a structured rail or corridor excursion.",
      "Weather and visibility can flatten scenic value even when the train or coach runs on time.",
      "Big ship days can tighten the premium rail inventory faster than casual downtown time suggests.",
    ],
    realityCheckEvidence: [
      evidence(
        "Best Skagway Shore Excursions for Your Alaska Cruise (2025 Guide)",
        "https://www.youtube.com/watch?v=FrOkBjn2H5U",
        "Recent Skagway excursion guide",
        "Good visual reference for White Pass rail demand, Gold Rush framing, and how scenic products actually compare.",
        { tags: ["rail", "scenic", "planning"] }
      ),
      evidence(
        "Our Favorite Inside Passage Shore Excursions for 2025",
        "https://www.youtube.com/watch?v=SpapGwBn5kM",
        "Alaska cruise excursion roundup",
        "Useful cross-port proof for how often White Pass rail ends up as the default premium pick in Skagway.",
        { timestamp: "Jump to 3:40 for White Pass rail.", tags: ["rail", "excursions"] }
      ),
      evidence(
        "Klondike Highway and White Pass road conditions",
        "https://www.dot.state.ak.us/apps/wintermessage/",
        "Alaska DOT",
        "Road and weather context matters if travelers are comparing rail products with coach or private-driver alternatives.",
        { type: "official-notice", tags: ["weather", "conditions"] }
      ),
    ],
    faq: [
      {
        question: "What is the signature Skagway shore excursion?",
        answer:
          "White Pass rail and scenic corridor tours are the signature Skagway booking pattern.",
      },
      {
        question: "Is Skagway easy to explore on your own?",
        answer:
          "The town core is easy to explore independently, but the highest-value scenic experiences usually involve a tour or rail product.",
      },
      {
        question: "How long do most Skagway excursions take?",
        answer:
          "Most are in the 3 to 5 hour range, depending on whether they focus on rail, coach sightseeing, or outdoor activities.",
      },
    ],
    relatedLinks: [
      ...baseLinks("Skagway"),
      { label: "Alaska guide", href: "/alaska" },
      { label: "Cruise schedule view", href: "/cruises/port/skagway-alaska" },
    ],
    cruisePortHref: "/cruises/port/skagway-alaska",
    canonicalCruisePortSlug: "skagway-alaska",
  },
  whittier: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 60,
    heroTitle: "Whittier Cruise Port",
    summary:
      "A Southcentral Alaska gateway tied to glacier scenery, rail-and-road transfers, and pre- or post-cruise logistics more than walk-around port browsing.",
    cruiseRelevance:
      "Whittier matters because it is a transfer-heavy embarkation and scenic corridor port, not because it behaves like a casual downtown stop.",
    tenderDock: "Dock port with logistics shaped by road, tunnel, and rail timing.",
    excursionLength: "Transfer blocks and scenic add-ons usually run 2 to 5 hours.",
    nearbyTown: "Whittier itself is compact; Anchorage and Prince William Sound are the broader anchors.",
    excursionCategories: [
      category("Prince William Sound cruises", "Whittier glacier cruise"),
      category("Anchorage transfers", "Whittier to Anchorage transfer"),
      category("Wildlife and glacier tours", "Whittier wildlife tour"),
      category("Private transport", "Whittier private transfer"),
    ],
    cruiseSeason: "Alaska season runs mainly May through September.",
    knownFor: [
      "Prince William Sound access",
      "Embarkation and transfer logistics",
      "Tunnel timing constraints",
      "Glacier and wildlife day-cruise demand",
    ],
    nearbyZones: ["Whittier harbor", "Prince William Sound", "Portage corridor", "Anchorage transfer route"],
    logistics: [
      "Tunnel timing and transport schedules matter more here than generic port wandering.",
      "Whittier works best when transfers and excursions are planned as one sequence.",
      "Do not assume flexible taxi abundance on heavy embarkation days.",
    ],
    faq: [
      {
        question: "Is Whittier a walk-around cruise port?",
        answer:
          "Not really. It functions more as a logistics gateway and scenic departure point than a classic downtown port stop.",
      },
      {
        question: "What do travelers usually book from Whittier?",
        answer:
          "Transfers, Prince William Sound cruises, and glacier or wildlife add-ons are the main patterns.",
      },
      {
        question: "Do Whittier plans need extra buffer?",
        answer:
          "Yes. Tunnel, coach, rail, and embarkation timing can compound if you cut it too close.",
      },
    ],
    relatedLinks: [
      ...baseLinks("Whittier"),
      { label: "Alaska guide", href: "/alaska" },
    ],
  },
  "icy-strait-point": {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 60,
    heroTitle: "Icy Strait Point Cruise Port",
    summary:
      "An Alaska cruise stop built around wildlife, zipline, and low-friction excursion flow, with Hoonah access and a strong cruise-designed layout.",
    cruiseRelevance:
      "Icy Strait Point is excursion-first by design, making it a clean decision page for wildlife, whale watching, and adventure choices.",
    tenderDock: "Cruise-built docking and transfer system designed around shore excursion throughput.",
    excursionLength: "2.5 to 5 hours covers most activity patterns.",
    nearbyTown: "Hoonah is the nearby local town anchor.",
    excursionCategories: [
      category("Whale watching", "Icy Strait Point whale watching"),
      category("Zipline and adventure", "Icy Strait Point zipline"),
      category("Wildlife tours", "Icy Strait Point wildlife tour"),
      category("Cultural and local touring", "Hoonah tour"),
    ],
    cruiseSeason: "Alaska season runs mainly May through September.",
    knownFor: [
      "Whale watching strength",
      "Cruise-specific adventure infrastructure",
      "Hoonah access",
      "Simple excursion decision tree for cruise guests",
    ],
    nearbyZones: ["Icy Strait Point zone", "Hoonah", "Wildlife viewing areas", "Adventure park area"],
    logistics: [
      "This port is easier than many Alaska stops for ship-to-excursion flow.",
      "Weather still affects wildlife and visibility-dependent products.",
      "Adventure products can fill quickly on strong-volume calls.",
    ],
    faq: [
      {
        question: "What is Icy Strait Point best known for?",
        answer:
          "Whale watching, zipline and adventure options, and a cruise-focused layout that keeps excursion flow simple.",
      },
      {
        question: "Can you visit Hoonah from the port?",
        answer:
          "Yes. Hoonah is the main nearby local community tied into many cruise-day plans.",
      },
      {
        question: "Is Icy Strait Point a strong port for booked excursions?",
        answer:
          "Yes. It is one of the clearer excursion-led Alaska port calls.",
      },
    ],
    relatedLinks: [
      ...baseLinks("Icy Strait Point"),
      { label: "Alaska guide", href: "/alaska" },
    ],
  },
  "george-town-grand-cayman": {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 90,
    heroTitle: "Grand Cayman Cruise Port",
    summary:
      "A tender-based Caribbean stop centered on Stingray City demand, beach breaks, and short-transfer marine excursions.",
    cruiseRelevance:
      "Grand Cayman is one of the clearest excursion ports in the western Caribbean, especially for water-based bookings.",
    tenderDock: "Tender port; return timing discipline matters.",
    excursionLength: "3 to 5 hours covers most popular shore days.",
    nearbyTown: "George Town is the cruise gateway.",
    excursionCategories: [
      category("Stingray City trips", "Grand Cayman Stingray City excursion"),
      category("Beach breaks", "Grand Cayman beach break"),
      category("Snorkeling cruises", "Grand Cayman snorkeling cruise"),
      category("Island tours", "Grand Cayman island tour"),
    ],
    cruiseSeason: "Caribbean demand runs year-round, with strong winter and spring volume.",
    knownFor: [
      "Stingray City demand",
      "Tender timing sensitivity",
      "Clear-water marine excursions",
      "Easy beach and island tour combinations",
    ],
    nearbyZones: ["George Town", "Seven Mile Beach", "Stingray City routes", "West Bay"],
    logistics: [
      "Tender timing should shape every independent plan.",
      "Marine excursions are core inventory but remain weather-sensitive.",
      "Short calls work best with direct-transfer or operator-managed products.",
    ],
    faq: [
      {
        question: "Is Grand Cayman usually tendered?",
        answer:
          "Yes. That is one of the main operational constraints cruise travelers need to plan around.",
      },
      {
        question: "What is the signature excursion in Grand Cayman?",
        answer:
          "Stingray City remains the signature excursion pattern.",
      },
      {
        question: "Can you do a beach day from Grand Cayman port?",
        answer:
          "Yes, especially when you keep tender and return timing conservative.",
      },
    ],
    relatedLinks: baseLinks("Grand Cayman"),
  },
  castries: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 90,
    heroTitle: "St. Lucia Cruise Port",
    summary:
      "A Caribbean cruise stop built around Pitons scenery, rainforest and waterfall touring, catamaran days, and transfer-heavy sightseeing.",
    cruiseRelevance:
      "St. Lucia attracts travelers who want signature landscape value, not just a simple beach break.",
    tenderDock: "Dock port with excursion-heavy road and boat transfers.",
    excursionLength: "4 to 6 hours is the common planning range.",
    nearbyTown: "Castries is the primary cruise gateway.",
    excursionCategories: [
      category("Pitons and island tours", "St Lucia Pitons tour"),
      category("Catamaran cruises", "St Lucia catamaran cruise"),
      category("Rainforest and waterfall trips", "St Lucia waterfall tour"),
      category("Private drivers", "St Lucia private shore excursion"),
    ],
    cruiseSeason: "Caribbean demand remains active year-round, with stronger winter volume.",
    knownFor: [
      "Pitons-led excursion demand",
      "Longer scenic transfer patterns",
      "Boat and land combo days",
      "Rainforest and waterfall touring",
    ],
    nearbyZones: ["Castries", "Soufriere corridor", "Pitons area", "Marigot Bay"],
    logistics: [
      "Road travel can be slower than first-time visitors expect.",
      "Boat-based options often reduce road-time friction.",
      "This is a port where all-aboard buffer matters because scenic zones are spread out.",
    ],
    faq: [
      {
        question: "What is St. Lucia best known for on cruise itineraries?",
        answer:
          "Pitons views, scenic island tours, catamarans, and rainforest or waterfall combinations.",
      },
      {
        question: "Are St. Lucia excursions usually longer?",
        answer:
          "Yes. The island's biggest scenic rewards usually involve meaningful transfer time.",
      },
      {
        question: "Is a private driver useful in St. Lucia?",
        answer:
          "Often yes, especially if you want multiple scenic stops in one port call.",
      },
    ],
    relatedLinks: baseLinks("St. Lucia"),
  },
  bridgetown: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 90,
    heroTitle: "Barbados Cruise Port",
    summary:
      "A Barbados port that balances easy beach access with island touring, rum, coastal sightseeing, and marine excursion demand.",
    cruiseRelevance:
      "Barbados works for both low-friction beach days and fuller island circuits, making it a broad-intent cruise stop.",
    tenderDock: "Dock port with manageable transfer structure.",
    excursionLength: "3 to 5 hours is typical.",
    nearbyTown: "Bridgetown is the immediate port anchor.",
    excursionCategories: [
      category("Beach breaks", "Barbados beach break"),
      category("Island tours", "Barbados island tour"),
      category("Catamaran sailing", "Barbados catamaran cruise"),
      category("Rum and food stops", "Barbados rum tour"),
    ],
    cruiseSeason: "Caribbean demand is active year-round, with strongest winter cruise volume.",
    knownFor: [
      "Easy beach access",
      "Catamaran and swimming cruises",
      "Island interior touring",
      "Reliable half-day excursion structure",
    ],
    nearbyZones: ["Bridgetown", "Carlisle Bay", "West coast beaches", "Island interior viewpoints"],
    logistics: [
      "Barbados is easier than many Caribbean islands for simple half-day planning.",
      "Catamaran products are strong but weather-linked.",
      "Return timing is usually manageable if you avoid overpacking the day.",
    ],
    faq: [
      {
        question: "Is Barbados good for a beach day from port?",
        answer:
          "Yes. Barbados is one of the easier Caribbean ports for beach-focused cruise days.",
      },
      {
        question: "What are the top Barbados shore excursions?",
        answer:
          "Beach breaks, catamaran cruises, island tours, and rum-linked sightseeing are the main patterns.",
      },
      {
        question: "Do Barbados excursions need long transfers?",
        answer:
          "Not always. Many cruise-day options remain relatively efficient compared with more mountainous islands.",
      },
    ],
    relatedLinks: baseLinks("Barbados"),
  },
  mykonos: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 120,
    heroTitle: "Mykonos Cruise Port",
    summary:
      "A Greek island cruise stop centered on town wandering, beach access, scenic village energy, and Delos-linked cultural touring.",
    cruiseRelevance:
      "Mykonos works for both light independent exploration and more structured beach or Delos excursion planning.",
    tenderDock: "Port handling varies by berth and shuttle pattern; check same-day transfer flow.",
    excursionLength: "3 to 5 hours is the common planning window.",
    nearbyTown: "Mykonos Town is the main cruise-day anchor.",
    excursionCategories: [
      category("Mykonos Town touring", "Mykonos town tour"),
      category("Beach escapes", "Mykonos beach excursion"),
      category("Delos trips", "Mykonos Delos tour"),
      category("Private island drivers", "Mykonos private shore excursion"),
    ],
    cruiseSeason: "Mediterranean demand peaks from spring through early fall.",
    knownFor: [
      "Town ambiance and walkability",
      "Beach club and coastal day demand",
      "Delos cultural relevance",
      "Cruise-day crowd concentration in the main town zone",
    ],
    nearbyZones: ["Mykonos Town", "Delos route", "Psarou area", "Platis Gialos", "Ornos"],
    logistics: [
      "Shuttle and transfer patterns can matter depending on berth setup.",
      "Peak summer crowding changes how quickly independent plans move.",
      "Town-plus-beach combinations work best when transit friction is kept simple.",
    ],
    faq: [
      {
        question: "Can you explore Mykonos without a tour?",
        answer:
          "Yes, especially if your goal is town wandering, but beach and Delos plans benefit from cleaner transport coordination.",
      },
      {
        question: "What are the top Mykonos excursions?",
        answer:
          "Town tours, beach escapes, Delos trips, and private island touring are the main patterns.",
      },
      {
        question: "Is Mykonos a good short-call port?",
        answer:
          "Yes, if you keep the day focused and avoid stacking too many separate transfers.",
      },
    ],
    relatedLinks: baseLinks("Mykonos"),
  },
  barcelona: {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 120,
    heroTitle: "Barcelona Cruise Port",
    summary:
      "A major Mediterranean embarkation and call port that combines large-scale cruise infrastructure with deep city sightseeing demand.",
    cruiseRelevance:
      "Barcelona matters as both a cruise gateway and a shore excursion city where transport choices directly affect how much of the city you can actually use.",
    tenderDock: "Dock port with major terminal infrastructure and transfer dependency.",
    excursionLength: "Half-day city use usually lands in the 3 to 5 hour range.",
    nearbyTown: "Central Barcelona is the main target, not the terminal itself.",
    excursionCategories: [
      category("City highlights", "Barcelona shore excursion"),
      category("Gaudi touring", "Barcelona Gaudi tour"),
      category("Private drivers", "Barcelona private shore excursion"),
      category("Transfer-backed sightseeing", "Barcelona cruise transfer tour"),
    ],
    cruiseSeason: "Mediterranean demand peaks spring through fall, with year-round city value.",
    knownFor: [
      "Major embarkation scale",
      "High-value urban sightseeing",
      "Transfer-sensitive city access",
      "Strong pre- and post-cruise extension demand",
    ],
    nearbyZones: ["Cruise terminal zone", "Gothic Quarter", "Eixample", "La Rambla corridor", "Montjuic"],
    logistics: [
      "Barcelona is not a step-off-and-do-everything port; terminal transfer strategy matters.",
      "Embarkation and turnaround traffic can shape same-day mobility.",
      "Choose city plans with realistic transit assumptions instead of overpacking the day.",
    ],
    faq: [
      {
        question: "Can you explore Barcelona from the cruise port on your own?",
        answer:
          "Yes, but the terminal sits outside the core sightseeing grid, so transport planning still matters.",
      },
      {
        question: "What are the best Barcelona cruise excursions?",
        answer:
          "City highlights, Gaudi-focused touring, private shore excursions, and transfer-backed sightseeing are the main patterns.",
      },
      {
        question: "Is Barcelona mainly an embarkation port or excursion port?",
        answer:
          "It is both, which is why transfer timing and luggage or turnaround realities matter more than at smaller ports.",
      },
    ],
    relatedLinks: baseLinks("Barcelona"),
  },
  "cabo-san-lucas": {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 90,
    heroTitle: "Cabo San Lucas Cruise Port",
    summary:
      "A Baja cruise stop known for marine excursions, arch sightseeing, beach time, and an easy split between water activities and town browsing.",
    cruiseRelevance:
      "Cabo works best when travelers choose clearly between boat-heavy days and light independent wandering instead of trying to do everything.",
    tenderDock: "Tender port on many cruise calls; marine timing matters.",
    excursionLength: "3 to 5 hours is standard.",
    nearbyTown: "Cabo San Lucas marina and town are the core cruise zone.",
    excursionCategories: [
      category("Boat and arch tours", "Cabo San Lucas boat tour"),
      category("Beach breaks", "Cabo San Lucas beach break"),
      category("Snorkeling cruises", "Cabo snorkeling cruise"),
      category("Private drivers", "Cabo San Lucas private tour"),
    ],
    cruiseSeason: "Mexico and Pacific cruise demand is active through much of the year.",
    knownFor: [
      "Arch and marina sightseeing",
      "Tender timing sensitivity",
      "Strong marine excursion inventory",
      "Simple split between boat trips and beach or town use",
    ],
    nearbyZones: ["Marina", "Lands End route", "Medano Beach", "Downtown Cabo"],
    logistics: [
      "Tender timing shapes how much margin you actually have.",
      "Boat products are natural fits here because the cruise identity is marine-heavy.",
      "Independent beach or town time works best when paired with one main activity, not many.",
    ],
    faq: [
      {
        question: "Is Cabo San Lucas usually tendered?",
        answer:
          "Often yes, which makes timing discipline important.",
      },
      {
        question: "What are the top Cabo shore excursions?",
        answer:
          "Boat tours, arch sightseeing, snorkeling, beach breaks, and private touring are the main patterns.",
      },
      {
        question: "Can you walk around Cabo from the port zone?",
        answer:
          "Yes once ashore, but your actual available time depends on the tender process.",
      },
    ],
    relatedLinks: baseLinks("Cabo San Lucas"),
  },
  "puerto-vallarta": {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 90,
    heroTitle: "Puerto Vallarta Cruise Port",
    summary:
      "A Pacific Mexico cruise stop that balances city access, coastal scenery, beach options, and adventure or food-driven day touring.",
    cruiseRelevance:
      "Puerto Vallarta is a broader-intent port where travelers choose between relaxed city use, coastal excursions, and organized adventure days.",
    tenderDock: "Dock port with manageable access into the urban area.",
    excursionLength: "3 to 5 hours is typical.",
    nearbyTown: "Puerto Vallarta proper is the immediate cruise-day anchor.",
    excursionCategories: [
      category("City highlights", "Puerto Vallarta city tour"),
      category("Beach and coastal trips", "Puerto Vallarta beach excursion"),
      category("Adventure outings", "Puerto Vallarta adventure tour"),
      category("Food and local culture", "Puerto Vallarta food tour"),
    ],
    cruiseSeason: "Pacific Mexico demand remains active through much of the year.",
    knownFor: [
      "Balanced city-plus-excursion value",
      "Good independent exploration potential",
      "Adventure and coastal touring depth",
      "Short-transfer urban utility",
    ],
    nearbyZones: ["Malecon area", "Romantic Zone", "Coastal beach areas", "Marina district"],
    logistics: [
      "Puerto Vallarta is easier than many ports for flexible half-day planning.",
      "Adventure products still need conservative return timing if they run outside the urban core.",
      "If you want both city and coast, keep the sequence simple.",
    ],
    faq: [
      {
        question: "Can you explore Puerto Vallarta on your own from the port?",
        answer:
          "Yes. It is one of the more manageable ports for independent city-focused use.",
      },
      {
        question: "What are the top Puerto Vallarta excursions?",
        answer:
          "City highlights, beach and coastal trips, adventure outings, and food-led touring are the main categories.",
      },
      {
        question: "Is Puerto Vallarta better for a relaxed or structured shore day?",
        answer:
          "It works for both, but the best choice depends on whether you want urban wandering or a dedicated coastal/adventure product.",
      },
    ],
    relatedLinks: baseLinks("Puerto Vallarta"),
  },
};

function titleFromPortName(name: string): string {
  const normalized = name.replace(/^Port of\s+/i, "").trim();
  return `${normalized} Cruise Port`;
}

function regionLabel(port: { area?: string; region?: string; country?: string }): string {
  return port.area || port.region || port.country || "Cruise region";
}

export function getPortAuthorityConfig(port: {
  slug: string;
  name: string;
  area?: string;
  region?: string;
  country?: string;
}): ResolvedPortAuthorityConfig {
  const configured = PORT_AUTHORITY_CONFIG[port.slug];
  if (configured) return { ...configured, isFallback: false };

  const portName = port.name.replace(/^Port of\s+/i, "").trim();
  const region = regionLabel(port);

  return {
    updatedAt: "2026-03-11",
    refreshIntervalDays: 30,
    heroTitle: titleFromPortName(port.name),
    summary: `${portName} is in the port authority layer, but the full destination brief is still being expanded.`,
    cruiseRelevance: `Use the cruise explorer for live sailing context while this ${portName} authority page is still being filled out.`,
    tenderDock: "Port handling details are still being enriched.",
    excursionLength: "Check live cruise schedules and leave conservative buffer until port-specific notes are published.",
    nearbyTown: `${portName} cruise zone and surrounding visitor areas.`,
    excursionCategories: [
      category("Shore excursions", `${portName} shore excursions`),
      category("Port transfers", `${portName} cruise transfer`),
      category("Top things to do", `${portName} top things to do`),
    ],
    cruiseSeason: `Cruise season detail for ${region} is still being enriched.`,
    knownFor: [
      "Port timing and transfer decisions",
      "Shore excursion research before booking",
      "Cruise-day routing and return buffer planning",
    ],
    nearbyZones: [`${portName} cruise zone`, "Nearby visitor district", "Transfer pickup area"],
    logistics: [
      "Port-specific logistics are still loading; use the linked cruise view for current schedule context.",
      "Keep conservative buffer before all-aboard until this port note set is fully enriched.",
    ],
    faq: [
      {
        question: `Is this ${portName} page fully built yet?`,
        answer:
          "Not yet. The full authority brief is still being expanded, so use the cruise explorer and linked tour results in the meantime.",
      },
      {
        question: `Can you still browse excursions for ${portName}?`,
        answer:
          "Yes. You can still jump into shore excursion and transfer discovery while the authority content layer is being completed.",
      },
      {
        question: `Where should you go for live cruise context for ${portName}?`,
        answer:
          "Use the cruise explorer and any linked cruise-port schedule route if available.",
      },
    ],
    relatedLinks: [
      { label: "Cruise explorer", href: "/cruises" },
      { label: "Ports directory", href: "/ports" },
      { label: `Browse ${portName} tours`, href: toursHref(`${portName} shore excursions`) },
    ],
    isFallback: true,
  };
}
