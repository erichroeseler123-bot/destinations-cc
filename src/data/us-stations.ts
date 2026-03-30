export type StationSubtype = "train-station" | "bus-station";

export type StationAuthorityConfig = {
  slug: string;
  name: string;
  subtype: StationSubtype;
  operator?: string;
  cityName: string;
  citySlug?: string;
  state: string;
  country: string;
  summary: string;
  transferFocus: string;
  lat: number;
  lng: number;
  nearbyPortSlugs?: string[];
  nearbyCruisePortSlugs?: string[];
  nearbyVenueSlugs?: string[];
  knownFor: string[];
  faq: Array<{ question: string; answer: string }>;
  routeIdeas?: Array<{ label: string; href: string; note: string }>;
};

export const US_STATIONS: StationAuthorityConfig[] = [
  {
    slug: "denver-union-station",
    name: "Denver Union Station",
    subtype: "train-station",
    operator: "Amtrak and RTD Rail",
    cityName: "Denver",
    citySlug: "denver",
    state: "Colorado",
    country: "US",
    summary:
      "Denver’s main rail arrival anchor for downtown hotel staging, Amtrak arrivals, and transfer decisions into Red Rocks and other Front Range venues.",
    transferFocus:
      "Best used when the traveler is arriving by rail and needs to decide between downtown Denver, Red Rocks transport, or a venue-first movement plan.",
    lat: 39.7527,
    lng: -105.0007,
    nearbyVenueSlugs: ["red-rocks-amphitheatre", "ball-arena", "mission-ballroom"],
    knownFor: [
      "Amtrak arrivals into downtown Denver",
      "Union Station to Red Rocks planning",
      "Downtown hotel staging before event nights",
      "Transit-first concert routing",
    ],
    faq: [
      {
        question: "How should travelers think about Union Station to Red Rocks?",
        answer:
          "Treat it as a transfer decision, not a straight-line map check. Same-day timing, pickup strategy, and post-show ride certainty matter more than pure distance.",
      },
      {
        question: "Is Amtrak to downtown Denver a good fit for DCC planning?",
        answer:
          "Yes. Denver Union Station works well as a downtown anchor because it connects cleanly into hotels, city planning, and venue transport pages without forcing the traveler to solve everything at once.",
      },
      {
        question: "What is the best next step after Denver Union Station?",
        answer:
          "Usually the Denver city guide or the Red Rocks transportation layer, depending on whether the traveler is still shaping the trip or already solving event transport.",
      },
    ],
    routeIdeas: [
      {
        label: "Union Station to Red Rocks",
        href: "/transportation/venues/red-rocks-amphitheatre",
        note: "Best when the traveler already has a show plan and needs the venue move solved.",
      },
      {
        label: "Amtrak to downtown Denver",
        href: "/denver",
        note: "Best when the traveler is still choosing hotels, neighborhoods, and next-step city planning.",
      },
    ],
  },
  {
    slug: "union-station-bus-concourse",
    name: "Union Station Bus Concourse",
    subtype: "bus-station",
    operator: "RTD Bus",
    cityName: "Denver",
    citySlug: "denver",
    state: "Colorado",
    country: "US",
    summary:
      "Denver’s bus-side transit anchor for downtown arrivals and event routing where travelers need to connect from the transit core into hotels or venues.",
    transferFocus:
      "Best used when a traveler is arriving on a regional bus or using the bus concourse as the last organized transit anchor before a hotel or venue transfer.",
    lat: 39.7531,
    lng: -105.0009,
    nearbyVenueSlugs: ["red-rocks-amphitheatre", "ball-arena", "mission-ballroom"],
    knownFor: [
      "Downtown Denver transit arrivals",
      "Regional bus connectivity",
      "Last organized transit anchor before venue routing",
      "Red Rocks transfer comparison",
    ],
    faq: [
      {
        question: "Should DCC treat the Union Station bus side differently from Amtrak arrivals?",
        answer:
          "Yes. Bus arrivals often behave more like an urban transfer problem than a long-distance rail arrival, so the next step is usually hotel or venue routing rather than arrival recovery.",
      },
      {
        question: "What is the main DCC use for this bus-station page?",
        answer:
          "Use it to push travelers into the right downtown or Red Rocks planning page after the transit arrival is understood.",
      },
      {
        question: "Is the bus concourse useful for Red Rocks nights?",
        answer:
          "Yes, especially when the traveler is still deciding whether to keep using transit logic or move into a dedicated concert-transport plan.",
      },
    ],
    routeIdeas: [
      {
        label: "Bus concourse to Red Rocks",
        href: "/transportation/venues/red-rocks-amphitheatre",
        note: "Useful when the transit arrival is set but the venue move is still unresolved.",
      },
      {
        label: "Downtown Denver transfer planning",
        href: "/denver",
        note: "Best when the traveler still needs neighborhood, hotel, or same-day city routing.",
      },
    ],
  },
  {
    slug: "boulder-junction-station",
    name: "Boulder Junction Station",
    subtype: "train-station",
    operator: "RTD Rail and Bus",
    cityName: "Boulder",
    citySlug: "boulder",
    state: "Colorado",
    country: "US",
    summary:
      "North Boulder rail-and-bus transit anchor for downtown Boulder routing, campus-area arrivals, and venue planning that starts before a ride is booked.",
    transferFocus:
      "Best used for Boulder travelers who need to connect transit arrival logic into downtown Boulder, the Fox Theatre, or custom transport planning.",
    lat: 40.0259,
    lng: -105.2508,
    nearbyVenueSlugs: ["boulder-theater", "fox-theatre"],
    knownFor: [
      "Boulder transit arrivals",
      "Boulder Theater and Fox Theatre planning",
      "Downtown Boulder connection logic",
      "Guide-first arrival routing",
    ],
    faq: [
      {
        question: "Is Boulder Junction the right page for train-style arrivals into Boulder?",
        answer:
          "Yes. DCC uses it as a transit anchor for travelers who still need to choose between downtown Boulder, venue routing, and custom transport planning.",
      },
      {
        question: "What is the best next click after Boulder Junction?",
        answer:
          "Usually Boulder city planning or the specific venue transport page, depending on how locked the traveler already is on the night’s plan.",
      },
      {
        question: "Why does DCC keep Boulder transit pages guide-first?",
        answer:
          "Because Boulder demand is still narrower than Denver, so the highest-value move is accurate routing rather than pretending there is a huge dedicated ride network.",
      },
    ],
    routeIdeas: [
      {
        label: "Transit to downtown Boulder",
        href: "/boulder",
        note: "Best when the traveler still needs neighborhoods, food, and city-shape planning.",
      },
      {
        label: "Station to Boulder Theater",
        href: "/transportation/venues/boulder-theater",
        note: "Best when the venue is known and the transfer question is the real bottleneck.",
      },
    ],
  },
  {
    slug: "downtown-boulder-station",
    name: "Downtown Boulder Station",
    subtype: "bus-station",
    operator: "RTD Bus",
    cityName: "Boulder",
    citySlug: "boulder",
    state: "Colorado",
    country: "US",
    summary:
      "Downtown Boulder bus anchor for campus, theater, and nightlife routing where bus arrival context shapes the rest of the plan.",
    transferFocus:
      "Best used when the traveler is already arriving near the Pearl Street side of Boulder and needs the next venue or downtown move clarified fast.",
    lat: 40.0169,
    lng: -105.2781,
    nearbyVenueSlugs: ["boulder-theater", "fox-theatre"],
    knownFor: [
      "Pearl Street transit arrivals",
      "Boulder nightlife routing",
      "Venue-first downtown movement",
      "Guide-first bus planning",
    ],
    faq: [
      {
        question: "Why does DCC keep a bus-station page for downtown Boulder?",
        answer:
          "Because bus arrivals change the practical first move of the trip: hotel, venue, or downtown walking plan. That is a better planning surface than generic transit copy.",
      },
      {
        question: "Is Downtown Boulder Station better for venue nights than Boulder Junction?",
        answer:
          "Sometimes. It is usually stronger when the traveler is already arriving near the center of Boulder rather than from the rail side.",
      },
      {
        question: "What is the best next step after this page?",
        answer:
          "Usually the Boulder guide or a Boulder venue transport page, depending on how specific the evening already is.",
      },
    ],
    routeIdeas: [
      {
        label: "Bus to downtown Boulder",
        href: "/boulder",
        note: "Use this when the traveler is still shaping the rest of the day after arrival.",
      },
      {
        label: "Downtown Boulder to Fox Theatre",
        href: "/transportation/venues/fox-theatre",
        note: "Use this when the venue is fixed and the transfer is the main remaining question.",
      },
    ],
  },
  {
    slug: "miami-central-station",
    name: "MiamiCentral Station",
    subtype: "train-station",
    operator: "Brightline and local transit",
    cityName: "Miami",
    citySlug: "miami",
    state: "Florida",
    country: "US",
    summary:
      "Downtown Miami rail anchor for PortMiami staging, Brightline arrivals, and hotel-versus-port routing before embarkation.",
    transferFocus:
      "Best used when a traveler is arriving by rail into downtown Miami and needs to solve PortMiami, Brickell, or pre-cruise hotel positioning next.",
    lat: 25.7785,
    lng: -80.1956,
    nearbyPortSlugs: ["miami"],
    nearbyCruisePortSlugs: ["miami-usa"],
    knownFor: [
      "Brightline arrivals into Miami",
      "Downtown and Brickell staging",
      "PortMiami pre-cruise routing",
      "Train-to-port decision logic",
    ],
    faq: [
      {
        question: "How should DCC treat MiamiCentral for cruise travelers?",
        answer:
          "As a downtown staging decision, not just a train stop. The real issue is whether the traveler should go straight to port, stage in a hotel, or solve cruise timing first.",
      },
      {
        question: "Is MiamiCentral useful for PortMiami planning?",
        answer:
          "Yes. It is one of the clearest train-to-port planning anchors for travelers who are not flying into Miami.",
      },
      {
        question: "What is the best next click after MiamiCentral?",
        answer:
          "Usually the Miami guide or the PortMiami cruise-port page, depending on whether the traveler is still staging or already on embarkation logic.",
      },
    ],
    routeIdeas: [
      {
        label: "Train to downtown Miami",
        href: "/miami",
        note: "Best when the next decision is neighborhood or hotel positioning.",
      },
      {
        label: "MiamiCentral to PortMiami",
        href: "/cruises/port/miami-usa",
        note: "Best when embarkation timing and port movement are the real planning problem.",
      },
    ],
  },
  {
    slug: "miami-intermodal-center-bus-terminal",
    name: "Miami Intermodal Center Bus Terminal",
    subtype: "bus-station",
    operator: "Intercity and airport-side bus connections",
    cityName: "Miami",
    citySlug: "miami",
    state: "Florida",
    country: "US",
    summary:
      "Miami’s airport-side bus transit anchor for travelers comparing airport-adjacent arrivals against downtown and PortMiami staging.",
    transferFocus:
      "Best used for bus and airport-adjacent arrivals where the real question is whether to stage near the airport, downtown, or go port-first.",
    lat: 25.7955,
    lng: -80.2728,
    nearbyPortSlugs: ["miami"],
    nearbyCruisePortSlugs: ["miami-usa"],
    knownFor: [
      "Airport-adjacent bus arrivals",
      "Bus-station near PortMiami planning",
      "Miami staging comparisons",
      "Transfer-first cruise logic",
    ],
    faq: [
      {
        question: "Is this the right page for bus station near PortMiami planning?",
        answer:
          "Yes. DCC uses it for travelers whose arrival is bus-first or airport-adjacent and who still need to decide whether to route into downtown or solve the port move immediately.",
      },
      {
        question: "Why is this separate from MIA airport coverage?",
        answer:
          "Because airport and bus-side arrival behavior are not the same. The staging and transfer choices can differ even when the geography is close.",
      },
      {
        question: "What is the best next step after this bus-station page?",
        answer:
          "Usually the Miami guide, the PortMiami page, or the airport page, depending on whether the traveler is still comparing arrival strategies.",
      },
    ],
    routeIdeas: [
      {
        label: "Bus station near PortMiami",
        href: "/cruises/port/miami-usa",
        note: "Best when the traveler is already on cruise timing and transfer logic.",
      },
      {
        label: "Airport-adjacent Miami planning",
        href: "/airports/miami-international-airport",
        note: "Best when the traveler is still comparing airport and bus arrival options.",
      },
    ],
  },
  {
    slug: "seattle-king-street-station",
    name: "Seattle King Street Station",
    subtype: "train-station",
    operator: "Amtrak",
    cityName: "Seattle",
    citySlug: "seattle",
    state: "Washington",
    country: "US",
    summary:
      "Seattle rail arrival anchor for downtown staging and cruise-port movement before Alaska embarkation.",
    transferFocus:
      "Best used for rail arrivals into Seattle when the traveler still needs to decide between downtown hotel staging and direct cruise-port movement.",
    lat: 47.5984,
    lng: -122.3295,
    nearbyPortSlugs: ["seattle"],
    nearbyCruisePortSlugs: ["seattle-usa"],
    knownFor: [
      "Amtrak into Seattle",
      "Downtown staging before Alaska cruises",
      "Train-to-port routing",
      "Pre-embarkation buffer decisions",
    ],
    faq: [
      {
        question: "Why does DCC connect King Street Station to cruise planning?",
        answer:
          "Because Seattle rail arrivals often roll directly into Alaska cruise logistics, hotel staging, and port timing rather than ending at the station itself.",
      },
      {
        question: "What is the best next step after King Street Station?",
        answer:
          "Usually the Seattle city guide or the Seattle cruise-port page, depending on whether the traveler is still staging or already on embarkation logic.",
      },
      {
        question: "Should travelers go straight from the station to port?",
        answer:
          "Sometimes, but DCC treats that as a buffer-sensitive decision rather than a universal default.",
      },
    ],
    routeIdeas: [
      {
        label: "Train to downtown Seattle",
        href: "/seattle",
        note: "Best when the next decision is hotel placement or first-night staging.",
      },
      {
        label: "Station to Seattle cruise port",
        href: "/cruises/port/seattle-usa",
        note: "Best when the traveler is already solving embarkation timing.",
      },
    ],
  },
  {
    slug: "new-orleans-union-passenger-terminal",
    name: "New Orleans Union Passenger Terminal",
    subtype: "train-station",
    operator: "Amtrak",
    cityName: "New Orleans",
    citySlug: "new-orleans",
    state: "Louisiana",
    country: "US",
    summary:
      "New Orleans rail arrival anchor for French Quarter hotel staging, first-night routing, and itinerary cleanup after a long-distance arrival.",
    transferFocus:
      "Best used for Amtrak arrivals when the traveler still needs to translate a rail arrival into French Quarter, CBD, or neighborhood fit.",
    lat: 29.9478,
    lng: -90.078,
    knownFor: [
      "Amtrak into New Orleans",
      "French Quarter hotel staging",
      "Neighborhood-routing after arrival",
      "Arrival-first itinerary cleanup",
    ],
    faq: [
      {
        question: "Why does DCC treat the New Orleans rail terminal as a planning surface?",
        answer:
          "Because the first move into the Quarter, CBD, or another neighborhood often determines whether the first day works smoothly.",
      },
      {
        question: "What should travelers open after this station page?",
        answer:
          "Usually the New Orleans city guide, especially if they still need to decide where the trip should anchor.",
      },
      {
        question: "Is this page mostly for Amtrak arrivals?",
        answer:
          "Yes. It is meant for rail arrivals who still need the neighborhood and timing side of the trip clarified.",
      },
    ],
    routeIdeas: [
      {
        label: "Amtrak to downtown New Orleans",
        href: "/new-orleans/things-to-do",
        note: "Best when the traveler is still deciding what to prioritize after arrival.",
      },
      {
        label: "French Quarter arrival planning",
        href: "/new-orleans/weekend-guide",
        note: "Best when the first-night structure is the real decision problem.",
      },
    ],
  },
  {
    slug: "chicago-union-station",
    name: "Chicago Union Station",
    subtype: "train-station",
    operator: "Amtrak and Metra",
    cityName: "Chicago",
    citySlug: "chicago",
    state: "Illinois",
    country: "US",
    summary:
      "Chicago’s primary rail arrival anchor for downtown hotel staging, event routing, and city-center transfer decisions that start before attractions are chosen.",
    transferFocus:
      "Best used when the traveler is arriving by rail and still needs to decide how to route into downtown Chicago, sports, or same-day city planning.",
    lat: 41.8786,
    lng: -87.6405,
    knownFor: [
      "Rail arrivals into downtown Chicago",
      "City-center staging",
      "Sports and event-night timing",
      "Transit-first hotel planning",
    ],
    faq: [
      {
        question: "Why does DCC keep a Chicago Union Station page?",
        answer:
          "Because train arrivals often create a very different first decision set than air arrivals: downtown staging, hotel placement, and event timing all come first.",
      },
      {
        question: "What is the best next click after Chicago Union Station?",
        answer:
          "Usually the Chicago city guide or a same-day city surface, depending on how much of the trip is still open.",
      },
      {
        question: "Is this page mostly about transit or about trip planning?",
        answer:
          "Trip planning. The station is the arrival anchor, but DCC uses it to send the traveler into the right next planning surface.",
      },
    ],
    routeIdeas: [
      {
        label: "Train to downtown Chicago",
        href: "/chicago",
        note: "Best when the traveler still needs the city itself sorted before picking specifics.",
      },
      {
        label: "What is live in Chicago",
        href: "/chicago/now",
        note: "Best for same-day visitors trying to figure out what is worth doing next.",
      },
    ],
  },
  {
    slug: "south-strip-transit-terminal",
    name: "South Strip Transit Terminal",
    subtype: "bus-station",
    operator: "RTC",
    cityName: "Las Vegas",
    citySlug: "las-vegas",
    state: "Nevada",
    country: "US",
    summary:
      "Las Vegas bus-side arrival anchor for south-Strip routing, airport-adjacent comparisons, and first-night logistics where transit still shapes the plan.",
    transferFocus:
      "Best used when the traveler is arriving through bus/transit channels and still needs to decide how to route into the Strip, Downtown, or a specific venue plan.",
    lat: 36.0398,
    lng: -115.1717,
    knownFor: [
      "South Strip transit arrivals",
      "Bus-side Vegas arrival logic",
      "Airport-versus-transit comparisons",
      "Strip-first routing decisions",
    ],
    faq: [
      {
        question: "Why does DCC treat the South Strip terminal separately from LAS airport pages?",
        answer:
          "Because the traveler behavior is different. Bus and transit arrivals usually create a Strip routing problem, not an airport recovery problem.",
      },
      {
        question: "What is the best next step after this page?",
        answer:
          "Usually the Las Vegas guide or a Strip-focused page, depending on whether the traveler is still shaping the trip or already solving a specific arrival window.",
      },
      {
        question: "Is this mainly useful for hotel decisions?",
        answer:
          "Often yes, especially for travelers who want to avoid making the wrong first move after a transit arrival.",
      },
    ],
    routeIdeas: [
      {
        label: "Transit to the Strip",
        href: "/las-vegas-strip",
        note: "Best when the traveler needs to lock in the Strip side of the trip first.",
      },
      {
        label: "Las Vegas arrival planning",
        href: "/las-vegas",
        note: "Best when the first-night shape of the trip is still unsettled.",
      },
    ],
  },
];
