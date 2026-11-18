import {
  TWO_HOUR_BUFFER_CLARIFICATION,
  VERBATIM_TWO_HOUR_BUFFER_RULE,
} from "./verifiedOperatorPricing";

// Shared public identity for pages, metadata, structured data, and discovery endpoints.
export const SITE_DESCRIPTION =
  "Juneau Flight Deck is an independent Juneau flightseeing education, weather-guidance, and concierge planning guide—helping cruise passengers compare licensed helicopter operators, check port-day timing, and review weather backup options.";

export const BOOKING_ROLES =
  "Juneau Flight Deck is an independent planning guide and concierge desk, not an aircraft operator or FAA Part 135 air carrier. Flights are operated by the named local carriers (TEMSCO Helicopters, Coastal Helicopters, or NorthStar Trekking), while Viator or the selected direct operator checkout handles payment, confirmation, and reservation terms.";

export const BOOKING_BENEFITS = [
  {
    title: "Choose the right glacier experience",
    description:
      "Compare TEMSCO, Coastal, and NorthStar tours by time on the ice, physical effort, minimum age rules, clothed weight thresholds, and included glacier gear before choosing a landing, walkabout, trek, or seasonal dog-sledding flight.",
    href: "/temsco-vs-coastal-vs-northstar-juneau#icefield-map",
    label: "Compare tours and explore the map",
  },
  {
    title: "Plan around your cruise port call",
    description: `${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
    href: "/helicopter-waitlist",
    label: "Review cruise port timing",
  },
  {
    title: "Check mountain weather and backup options",
    description:
      "Review live FAA mountain-pass WeatherCams before departure, and explore sea-level alternatives if low cloud ceilings ground upper-icefield flights. Backup activities require a separate booking and depend on open capacity.",
    href: "/juneau-glacier-flight-weather",
    label: "Check Juneau flight weather cams",
  },
] as const;

export const BOOKING_FAQS = [
  {
    question: "What is Juneau Flight Deck, and who operates the flights?",
    answer:
      "Juneau Flight Deck is an independent flightseeing education, weather-guidance, and concierge planning site—not an FAA Part 135 helicopter operator. Every Juneau glacier helicopter tour is flown by one of three licensed commercial operators (TEMSCO Helicopters, Coastal Helicopters, or NorthStar Trekking), and reservations are completed on Viator or the operator's direct checkout.",
  },
  {
    question: "How do Viator links and Worry-free Shore Excursion protections work?",
    answer:
      "Product-specific Viator links (such as Coastal Helicopters' Icefield Excursion, product code 6251SHOREXICEWALK) open the exact Viator tour listing, while links labeled Search on Viator open filtered search results where you select the specific product and review its terms before paying. Only products expressly marked 'Worry-free Shore Excursion' on Viator (tagId 367649) qualify for Viator's back-to-ship protection under Viator Terms of Use Section 20 (https://www.viator.com/support/termsAndConditions), which requires accurate ship arrival/departure details, a minimum 2-hour buffer before ship departure, and contacting Viator directly if delayed (up to US$1,000 per person next-port transport). Independent return-buffer planning on Juneau Flight Deck is a planning recommendation and is not itself a back-to-ship guarantee.",
  },
  {
    question: "What return buffer should cruise passengers plan before all-aboard?",
    answer: `${VERBATIM_TWO_HOUR_BUFFER_RULE} ${TWO_HOUR_BUFFER_CLARIFICATION}`,
  },
  {
    question: "Can I use Juneau Flight Deck if my cruise line says helicopter tours are sold out?",
    answer:
      "Yes. Cruise lines contract fixed seat blocks that can sell out while direct operator or partner calendars still hold separate allocations. You can compare independent booking links directly or submit a free concierge availability request—requests do not hold a seat or guarantee an opening.",
  },
] as const;
