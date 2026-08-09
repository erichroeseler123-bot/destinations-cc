export type DecisionOpportunity = {
  id: string;
  category: "cruise" | "new-orleans" | "alaska" | "colorado" | "red-rocks" | "wisconsin" | "transportation";
  question: string;
  targetSite: string;
  freshness: "stable" | "verify_before_publish";
  status: "research_required";
};

// This queue is intentionally NOT rendered into public routes. A node graduates into
// PRE_SITE_GUIDES only after it has a useful standalone answer, verified time-sensitive
// facts where needed, a canonical destination, internal graph edges, and a legitimate
// specialist handoff. The queue lets DCC scale coverage without mass-publishing thin pages.
export const DECISION_OPPORTUNITY_QUEUE: DecisionOpportunity[] = [
  { id: "cruise-port-buffer", category: "cruise", question: "How much return-to-ship buffer should you leave on an independent excursion?", targetSite: "cruisepromenade.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "cruise-morning-vs-afternoon", category: "cruise", question: "Is a morning or afternoon shore excursion safer for a short port day?", targetSite: "cruisepromenade.com", freshness: "stable", status: "research_required" },
  { id: "cruise-two-excursions", category: "cruise", question: "Can you realistically do two excursions in one cruise port day?", targetSite: "cruisepromenade.com", freshness: "stable", status: "research_required" },
  { id: "cruise-tender-port", category: "cruise", question: "How does a tender port change your excursion planning?", targetSite: "cruisepromenade.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "cruise-group-split", category: "cruise", question: "Should a cruise group split up for different excursions and meet later?", targetSite: "cruisepromenade.com", freshness: "stable", status: "research_required" },
  { id: "cruise-no-excursion", category: "cruise", question: "When is it better not to book an excursion at all?", targetSite: "cruisepromenade.com", freshness: "stable", status: "research_required" },
  { id: "cruise-private-driver", category: "cruise", question: "When does a private local driver make more sense than a packaged shore excursion?", targetSite: "vibearoundtown.com", freshness: "stable", status: "research_required" },
  { id: "cruise-driver-group-size", category: "cruise", question: "What group sizes benefit most from a private cruise-port driver?", targetSite: "vibearoundtown.com", freshness: "stable", status: "research_required" },

  { id: "juneau-port-hours", category: "alaska", question: "How should you plan Juneau when your ship has a short port call?", targetSite: "lastfrontiershoreexcursions.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "juneau-mendenhall-whales", category: "alaska", question: "Can you combine Mendenhall Glacier and whale watching in one Juneau port day?", targetSite: "lastfrontiershoreexcursions.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "juneau-flight-landing-vs-view", category: "alaska", question: "Glacier landing or scenic flight only in Juneau: which is the better fit?", targetSite: "juneauflightdeck.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "juneau-flight-motion", category: "alaska", question: "What should motion-sensitive travelers know before a Juneau flightseeing tour?", targetSite: "juneauflightdeck.com", freshness: "stable", status: "research_required" },
  { id: "juneau-flight-mobility", category: "alaska", question: "How should limited mobility affect a Juneau helicopter-tour decision?", targetSite: "juneauflightdeck.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "skagway-white-pass-vs-private", category: "alaska", question: "White Pass train or private Skagway excursion: which fits your port day?", targetSite: "lastfrontiershoreexcursions.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "ketchikan-rain-plan", category: "alaska", question: "What should you book in Ketchikan if rain is likely?", targetSite: "welcometoalaskatours.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "alaska-independent-excursion", category: "alaska", question: "When is an independent Alaska shore excursion a good idea?", targetSite: "welcometoalaskatours.com", freshness: "stable", status: "research_required" },

  { id: "nola-city-vs-swamp", category: "new-orleans", question: "City tour or swamp tour on your first day in New Orleans?", targetSite: "welcometoneworleanstours.com", freshness: "stable", status: "research_required" },
  { id: "nola-plantation-vs-swamp", category: "new-orleans", question: "Plantation site or swamp tour: which should you prioritize with one free day?", targetSite: "welcometoneworleanstours.com", freshness: "stable", status: "research_required" },
  { id: "nola-river-cruise-day-vs-evening", category: "new-orleans", question: "Daytime or evening Mississippi River cruise: which fits your trip better?", targetSite: "welcometoneworleanstours.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "nola-ghost-tour-kids", category: "new-orleans", question: "Is a New Orleans ghost tour a good fit for kids?", targetSite: "welcometoneworleanstours.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "nola-first-night", category: "new-orleans", question: "What should a first-time visitor do on the first night in New Orleans?", targetSite: "frenchquarterorientation.com", freshness: "stable", status: "research_required" },
  { id: "nola-fq-safety-orientation", category: "new-orleans", question: "What should visitors understand about navigating the French Quarter before going out at night?", targetSite: "frenchquarterorientation.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "nola-swamp-pickup-vs-drive", category: "new-orleans", question: "Should you self-drive to a swamp tour or choose hotel pickup?", targetSite: "welcometotheswamp.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "nola-small-vs-large-airboat", category: "new-orleans", question: "Small airboat or large airboat: what changes the New Orleans swamp experience?", targetSite: "welcometotheswamp.com", freshness: "verify_before_publish", status: "research_required" },

  { id: "den-breck-transfer-vs-shuttle", category: "colorado", question: "DEN to Breckenridge: private transfer or shared shuttle?", targetSite: "gosno.co", freshness: "verify_before_publish", status: "research_required" },
  { id: "den-vail-winter-buffer", category: "colorado", question: "How much extra time should you allow from Vail to DEN in winter?", targetSite: "gosno.co", freshness: "verify_before_publish", status: "research_required" },
  { id: "den-beaver-creek-car", category: "colorado", question: "Do you need a rental car in Beaver Creek?", targetSite: "gosno.co", freshness: "stable", status: "research_required" },
  { id: "den-winter-park-car", category: "colorado", question: "Rental car or transfer to Winter Park from DEN?", targetSite: "gosno.co", freshness: "verify_before_publish", status: "research_required" },
  { id: "den-steamboat-transfer", category: "colorado", question: "What should you compare before booking DEN to Steamboat transportation?", targetSite: "gosno.co", freshness: "verify_before_publish", status: "research_required" },
  { id: "ski-gear-transport", category: "colorado", question: "How should ski gear and luggage change your airport-transfer decision?", targetSite: "gosno.co", freshness: "stable", status: "research_required" },
  { id: "family-mountain-transfer", category: "colorado", question: "What should families with children compare before booking a Colorado mountain transfer?", targetSite: "gosno.co", freshness: "verify_before_publish", status: "research_required" },

  { id: "red-rocks-shuttle-vs-rideshare", category: "red-rocks", question: "Red Rocks shuttle or rideshare: which is easier after the show?", targetSite: "partyatredrocks.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "red-rocks-parking-vs-shuttle", category: "red-rocks", question: "Drive and park or take a shuttle to Red Rocks?", targetSite: "partyatredrocks.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "red-rocks-group-transport", category: "red-rocks", question: "What is the best Red Rocks transportation setup for a group?", targetSite: "partyatredrocks.com", freshness: "stable", status: "research_required" },
  { id: "red-rocks-day-trip-time", category: "red-rocks", question: "How much time do you need for a daytime Red Rocks visit from Denver?", targetSite: "redrocksfastpass.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "red-rocks-pre-show", category: "red-rocks", question: "How early should you plan to arrive at Red Rocks before a concert?", targetSite: "partyatredrocks.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "red-rocks-after-show-downtown", category: "red-rocks", question: "What is the easiest way to get back to downtown Denver after Red Rocks?", targetSite: "partyatredrocks.com", freshness: "verify_before_publish", status: "research_required" },

  { id: "airport-private-vs-rideshare", category: "transportation", question: "Airport pickup: when is a private ride worth it over rideshare?", targetSite: "gosno.co", freshness: "stable", status: "research_required" },
  { id: "airport-group-ride", category: "transportation", question: "How does group size change the best airport transportation option?", targetSite: "gosno.co", freshness: "stable", status: "research_required" },
  { id: "airport-late-arrival", category: "transportation", question: "What should you prioritize when your flight arrives late at night?", targetSite: "gosno.co", freshness: "stable", status: "research_required" },
  { id: "airport-cannabis-stop", category: "transportation", question: "How should a legal cannabis stop fit into an airport pickup itinerary?", targetSite: "420friendlyairportpickup.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "event-transport-return", category: "transportation", question: "Why should you choose event transportation based on the return trip first?", targetSite: "partyatredrocks.com", freshness: "stable", status: "research_required" },
  { id: "shuttle-fixed-vs-flexible", category: "transportation", question: "Fixed shuttle or flexible ride: which works better for a timed attraction?", targetSite: "shuttleya.com", freshness: "verify_before_publish", status: "research_required" },

  { id: "dells-first-day", category: "wisconsin", question: "What should first-time visitors do on their first day in Wisconsin Dells?", targetSite: "welcometothedells.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "dells-rain-day", category: "wisconsin", question: "How should you plan a Wisconsin Dells day when the weather turns bad?", targetSite: "welcometothedells.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "dells-adults-vs-family", category: "wisconsin", question: "How should an adults trip to Wisconsin Dells differ from a family trip?", targetSite: "welcometothedells.com", freshness: "stable", status: "research_required" },
  { id: "dells-one-vs-two-days", category: "wisconsin", question: "Is one day enough for Wisconsin Dells, or should you stay two?", targetSite: "welcometothedells.com", freshness: "verify_before_publish", status: "research_required" },
  { id: "dells-large-group", category: "wisconsin", question: "How should a large group plan Wisconsin Dells without over-scheduling everyone?", targetSite: "welcometothedells.com", freshness: "stable", status: "research_required" },
];

export const DECISION_OPPORTUNITY_COUNTS = DECISION_OPPORTUNITY_QUEUE.reduce<Record<string, number>>((acc, item) => {
  acc[item.category] = (acc[item.category] ?? 0) + 1;
  return acc;
}, {});
