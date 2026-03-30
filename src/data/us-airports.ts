export type AirportAuthorityConfig = {
  slug: string;
  name: string;
  iata: string;
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
  knownFor: string[];
  faq: Array<{ question: string; answer: string }>;
};

export const US_AIRPORTS: AirportAuthorityConfig[] = [
  {
    slug: "harry-reid-international-airport",
    name: "Harry Reid International Airport",
    iata: "LAS",
    cityName: "Las Vegas",
    citySlug: "las-vegas",
    state: "Nevada",
    country: "US",
    summary:
      "Las Vegas airport hub for Strip arrivals, event weekends, and late-night hotel transfer decisions where ground timing matters more than map distance suggests.",
    transferFocus:
      "Best used for Strip transfer planning, event-night buffer decisions, and first-night arrival routing into hotels, venues, and transportation pages.",
    lat: 36.084,
    lng: -115.1537,
    knownFor: [
      "Strip arrival logistics",
      "Convention and event weekend surges",
      "Late-night arrivals with hotel check-in friction",
      "Fast airport-to-venue transfer planning",
    ],
    faq: [
      {
        question: "How close is Harry Reid International Airport to the Las Vegas Strip?",
        answer:
          "It is close in pure distance, but taxi, rideshare, rental-car, and event traffic can still change the real arrival time significantly.",
      },
      {
        question: "When should travelers leave extra buffer from LAS?",
        answer:
          "Leave extra buffer during convention peaks, major fight or concert weekends, and late-night arrivals when hotel and rideshare friction stack together.",
      },
      {
        question: "What is the main DCC use for the LAS airport page?",
        answer:
          "Use it to route into the right Las Vegas hotel, transportation, and event-planning pages instead of treating the airport as a standalone destination.",
      },
    ],
  },
  {
    slug: "denver-international-airport",
    name: "Denver International Airport",
    iata: "DEN",
    cityName: "Denver",
    citySlug: "denver",
    state: "Colorado",
    country: "US",
    summary:
      "Denver’s main airport anchor for mountain-transfer, Red Rocks, downtown hotel, and same-day timing decisions where corridor choice matters.",
    transferFocus:
      "Best used for airport-to-downtown, airport-to-Red Rocks, and airport-to-mountain corridor planning before a traveler commits to venue or ski transport.",
    lat: 39.8561,
    lng: -104.6737,
    knownFor: [
      "Mountain corridor starts",
      "Red Rocks arrival logistics",
      "Snow and weather disruption risk",
      "Longer transfer windows than first-time visitors expect",
    ],
    faq: [
      {
        question: "Is DEN close enough for a same-day Red Rocks plan?",
        answer:
          "Sometimes, but same-day plans depend on arrival time, bag timing, traffic, and event start. DCC treats it as a buffer-sensitive route, not a default yes.",
      },
      {
        question: "Why does DCC treat DEN as a planning hub instead of just an airport mention?",
        answer:
          "Because Denver arrivals often split between downtown, Red Rocks, and mountain corridors, and each one has very different transfer logic.",
      },
      {
        question: "What is the main trip-planning value of the DEN airport page?",
        answer:
          "It helps travelers decide whether to route into Denver, Red Rocks, or ski-transfer pages next based on timing and corridor fit.",
      },
    ],
  },
  {
    slug: "miami-international-airport",
    name: "Miami International Airport",
    iata: "MIA",
    cityName: "Miami",
    citySlug: "miami",
    state: "Florida",
    country: "US",
    summary:
      "Miami’s main airport gateway for cruise departures, downtown hotel staging, and airport-to-port transfer timing tied to PortMiami decisions.",
    transferFocus:
      "Best used for airport-to-PortMiami planning, pre-cruise hotel routing, and same-day embarkation buffer decisions.",
    lat: 25.7959,
    lng: -80.287,
    nearbyPortSlugs: ["miami"],
    nearbyCruisePortSlugs: ["miami-usa"],
    knownFor: [
      "PortMiami transfer decisions",
      "Same-day embarkation risk",
      "Downtown and Brickell hotel staging",
      "Cruise-heavy arrival patterns",
    ],
    faq: [
      {
        question: "Should travelers fly into MIA on embarkation day for a Miami cruise?",
        answer:
          "Sometimes, but DCC treats same-day airport-to-port plans as higher-risk than pre-cruise arrivals because small flight delays can break the whole chain.",
      },
      {
        question: "Why is MIA important to PortMiami pages?",
        answer:
          "Because the airport-to-port leg is often the real planning problem before the cruise even starts.",
      },
      {
        question: "What is the best next step after the MIA airport page?",
        answer:
          "Usually the Miami city page or the PortMiami page, depending on whether the traveler is solving arrival logistics or embarkation logistics.",
      },
    ],
  },
  {
    slug: "fort-lauderdale-hollywood-international-airport",
    name: "Fort Lauderdale-Hollywood International Airport",
    iata: "FLL",
    cityName: "Miami",
    citySlug: "miami",
    state: "Florida",
    country: "US",
    summary:
      "South Florida alternative airport for cruise travelers comparing MIA versus FLL and weighing transfer distance against airfare or hotel convenience.",
    transferFocus:
      "Best used when travelers need to compare South Florida airport options before choosing a cruise hotel or PortMiami transfer strategy.",
    lat: 26.0726,
    lng: -80.1527,
    nearbyPortSlugs: ["miami"],
    nearbyCruisePortSlugs: ["miami-usa"],
    knownFor: [
      "Alternative airport to MIA",
      "Cruise arrival tradeoffs",
      "South Florida hotel staging",
      "Transfer-distance versus fare-value decisions",
    ],
    faq: [
      {
        question: "Why would a traveler use FLL instead of MIA for a Miami cruise?",
        answer:
          "Usually for airfare, hotel, or airline preference, but the traveler still needs to account for the longer ground leg into the PortMiami side of the trip.",
      },
      {
        question: "Is FLL a direct substitute for MIA in DCC planning?",
        answer:
          "Not exactly. It is an alternative arrival strategy with different transfer and hotel tradeoffs.",
      },
      {
        question: "What does DCC want a traveler to compare here?",
        answer:
          "Compare the total arrival path, not just flight price: airport choice, hotel position, and transfer timing all matter.",
      },
    ],
  },
  {
    slug: "seattle-tacoma-international-airport",
    name: "Seattle-Tacoma International Airport",
    iata: "SEA",
    cityName: "Seattle",
    citySlug: "seattle",
    state: "Washington",
    country: "US",
    summary:
      "Seattle’s main airport gateway for Alaska cruise departures, downtown staging, and airport-to-port movement before embarkation.",
    transferFocus:
      "Best used for downtown Seattle hotel staging and airport-to-cruise-port transfer planning before Alaska embarkation.",
    lat: 47.4502,
    lng: -122.3088,
    nearbyPortSlugs: ["seattle"],
    nearbyCruisePortSlugs: ["seattle-usa"],
    knownFor: [
      "Alaska cruise embarkation arrivals",
      "Downtown hotel staging",
      "Airport-to-port buffer questions",
      "Flight timing before embarkation",
    ],
    faq: [
      {
        question: "What is the main planning use of SEA in DCC?",
        answer:
          "It helps travelers decide whether to go straight to port, stage in downtown Seattle, or add buffer before an Alaska cruise departure.",
      },
      {
        question: "Why does DCC connect SEA to cruise planning instead of just flights?",
        answer:
          "Because airport timing is often the biggest source of embarkation risk before the cruise even starts.",
      },
      {
        question: "What should a traveler open after the SEA airport page?",
        answer:
          "Usually Seattle city planning or Seattle cruise-port planning, depending on whether the next decision is hotel placement or embarkation timing.",
      },
    ],
  },
  {
    slug: "louis-armstrong-new-orleans-international-airport",
    name: "Louis Armstrong New Orleans International Airport",
    iata: "MSY",
    cityName: "New Orleans",
    citySlug: "new-orleans",
    state: "Louisiana",
    country: "US",
    summary:
      "New Orleans arrival hub for French Quarter hotel routing, food-and-music trip timing, and airport-to-neighborhood transfer planning.",
    transferFocus:
      "Best used for airport-to-French Quarter, airport-to-hotel, and first-night arrival decisions before a New Orleans itinerary firms up.",
    lat: 29.9934,
    lng: -90.258,
    knownFor: [
      "French Quarter arrival logistics",
      "Airport-to-neighborhood routing",
      "Check-in and nightlife timing",
      "Weekend arrival pressure",
    ],
    faq: [
      {
        question: "Why does DCC care about MSY beyond flight arrival?",
        answer:
          "Because the first transfer into the French Quarter or another neighborhood often shapes the whole first day in New Orleans.",
      },
      {
        question: "What is the main next step after the MSY page?",
        answer:
          "Usually the New Orleans city guide, especially if the traveler still needs to decide neighborhood fit and timing.",
      },
      {
        question: "Does MSY connect to cruise planning in DCC?",
        answer:
          "This first pass is mostly city-focused, but the same airport-to-hotel and airport-to-port logic can support cruise additions later.",
      },
    ],
  },
  {
    slug: "orlando-international-airport",
    name: "Orlando International Airport",
    iata: "MCO",
    cityName: "Orlando",
    citySlug: "orlando",
    state: "Florida",
    country: "US",
    summary:
      "Orlando’s main arrival hub for resort transfers, first-day itinerary shaping, and airport-to-attraction routing where distance can be deceptive.",
    transferFocus:
      "Best used for airport-to-hotel and airport-to-attraction timing before visitors lock themselves into a too-tight arrival day.",
    lat: 28.4312,
    lng: -81.3081,
    knownFor: [
      "Resort transfer timing",
      "Family arrival friction",
      "Theme-park hotel routing",
      "First-day overplanning risk",
    ],
    faq: [
      {
        question: "Why is MCO useful as a DCC planning page?",
        answer:
          "Because Orlando visitors often underestimate the timing between flight arrival, hotel check-in, and the first attraction commitment.",
      },
      {
        question: "What should the traveler compare after the MCO page?",
        answer:
          "Compare hotel placement, transportation, and the first major activity or park commitment before deciding what fits the day.",
      },
      {
        question: "Is the MCO page mainly about flights?",
        answer:
          "No. It is about what the airport arrival does to the rest of the trip.",
      },
    ],
  },
  {
    slug: "george-bush-intercontinental-airport",
    name: "George Bush Intercontinental Airport",
    iata: "IAH",
    cityName: "Galveston",
    state: "Texas",
    country: "US",
    summary:
      "Longer-haul Houston airport option for Galveston cruise travelers comparing airport choice, transfer length, and pre-cruise hotel strategy.",
    transferFocus:
      "Best used for Galveston embarkation planning when the real decision is how much buffer and transfer complexity to absorb before reaching the port.",
    lat: 29.9902,
    lng: -95.3368,
    nearbyPortSlugs: ["galveston"],
    nearbyCruisePortSlugs: ["galveston-usa"],
    knownFor: [
      "Galveston cruise transfer planning",
      "Longer ground leg than HOU",
      "Embarkation buffer questions",
      "Pre-cruise staging tradeoffs",
    ],
    faq: [
      {
        question: "Why would a traveler use IAH for Galveston instead of Hobby?",
        answer:
          "Usually because of airline or fare options, but the longer transfer path increases the need for realistic buffer planning.",
      },
      {
        question: "What does DCC want travelers to solve here?",
        answer:
          "Airport choice, hotel strategy, and total transfer risk into Galveston.",
      },
      {
        question: "What should the traveler click next after this airport page?",
        answer:
          "Usually the Galveston cruise-port page or Galveston embarkation planning pages.",
      },
    ],
  },
  {
    slug: "william-p-hobby-airport",
    name: "William P. Hobby Airport",
    iata: "HOU",
    cityName: "Galveston",
    state: "Texas",
    country: "US",
    summary:
      "Closer Houston airport option for Galveston cruise travelers weighing airport convenience against airfare and hotel strategy.",
    transferFocus:
      "Best used for Galveston airport comparison when the traveler wants to minimize ground friction into the port corridor.",
    lat: 29.6454,
    lng: -95.2789,
    nearbyPortSlugs: ["galveston"],
    nearbyCruisePortSlugs: ["galveston-usa"],
    knownFor: [
      "Closer Galveston cruise routing",
      "Simpler airport-to-port logic than IAH",
      "Fare-versus-transfer tradeoffs",
      "Pre-cruise convenience planning",
    ],
    faq: [
      {
        question: "Is HOU better than IAH for a Galveston cruise?",
        answer:
          "Often for transfer simplicity, but the best choice depends on airfare, arrival time, hotel plan, and how much ground-risk buffer the traveler needs.",
      },
      {
        question: "Why does DCC treat HOU as an arrival decision page?",
        answer:
          "Because airport choice can change the whole Galveston embarkation strategy before the cruise even starts.",
      },
      {
        question: "What is the next best click after the HOU airport page?",
        answer:
          "Usually the Galveston port or cruise-from-Galveston guide.",
      },
    ],
  },
  {
    slug: "juneau-international-airport",
    name: "Juneau International Airport",
    iata: "JNU",
    cityName: "Juneau",
    state: "Alaska",
    country: "US",
    summary:
      "Juneau arrival hub for independent Alaska planning, pre-cruise or post-cruise movement, and airport-to-port-or-city decisions.",
    transferFocus:
      "Best used for Juneau airport-to-port and Juneau airport-to-excursion planning when the traveler is stitching together Alaska movement manually.",
    lat: 58.3549,
    lng: -134.5763,
    nearbyPortSlugs: ["juneau"],
    nearbyCruisePortSlugs: ["juneau-alaska"],
    knownFor: [
      "Independent Alaska arrival planning",
      "Airport-to-port movement",
      "Juneau excursion timing",
      "Weather-sensitive Alaska logistics",
    ],
    faq: [
      {
        question: "Why does DCC connect JNU to the Juneau cruise-port layer?",
        answer:
          "Because independent Alaska travelers often need to understand both airport arrival timing and port-day movement at the same time.",
      },
      {
        question: "What is the best next click after the JNU page?",
        answer:
          "Usually the Juneau cruise-port page or a Juneau whale-watching / shore-excursion page.",
      },
      {
        question: "What makes JNU different from larger hub airports in DCC?",
        answer:
          "The Juneau page is less about airport sprawl and more about weather, timing, and stitching together a small but consequential Alaska movement chain.",
      },
    ],
  },
  {
    slug: "ketchikan-international-airport",
    name: "Ketchikan International Airport",
    iata: "KTN",
    cityName: "Ketchikan",
    state: "Alaska",
    country: "US",
    summary:
      "Ketchikan arrival hub for Alaska route planning where airport movement, ferry and water connections, and port timing need to be read together.",
    transferFocus:
      "Best used for Ketchikan airport-to-port and independent Alaska stop planning where simple map distance can hide real transfer steps.",
    lat: 55.3556,
    lng: -131.7137,
    nearbyPortSlugs: ["ketchikan"],
    nearbyCruisePortSlugs: ["ketchikan-alaska"],
    knownFor: [
      "Ketchikan port access planning",
      "Water-linked transfer logic",
      "Alaska route stitching",
      "Weather and timing sensitivity",
    ],
    faq: [
      {
        question: "Why is Ketchikan airport planning more nuanced than a normal airport arrival?",
        answer:
          "Because the transfer chain is part of the decision, not just the arrival time, and Alaska weather can make the timing more fragile.",
      },
      {
        question: "What is the main DCC use for the KTN page?",
        answer:
          "It helps travelers route into the right Ketchikan cruise-port and excursion context with realistic transfer expectations.",
      },
      {
        question: "What is the next best click after the KTN page?",
        answer:
          "Usually the Ketchikan cruise-port page or a Ketchikan shore-excursion planning page.",
      },
    ],
  },
];
