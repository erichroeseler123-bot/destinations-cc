// Shared public identity for pages, metadata, structured data, and discovery endpoints.
export const SITE_DESCRIPTION =
  "Juneau Flight Deck helps cruise passengers choose and book Juneau excursions with operator comparisons, glacier maps, pickup and port timing guidance, and help exploring weather alternatives.";

export const BOOKING_ROLES =
  "DCC evaluates tour suitability; Juneau Flight Deck explains the options; Viator handles the booking and applicable booking protections. The named operator runs your tour, while Viator (or the selected operator channel) handles payment, confirmation, and reservation terms.";

export const BOOKING_BENEFITS = [
  {
    title: "Choose the right glacier experience",
    description: "Compare TEMSCO, Coastal, and NorthStar products by time on the ice, activity level, age rules, and included gear. Use the icefield map to understand the glacier locations before choosing a landing, walkabout, trek, or dog-sledding trip.",
    href: "/temsco-vs-coastal-vs-northstar-juneau#icefield-map",
    label: "Compare tours and explore the map",
  },
  {
    title: "Plan around your cruise port call",
    description: "Review provider-specific meeting points, transfer requirements, and return buffers alongside your ship's confirmed arrival and all-aboard times. Reconfirm final pickup instructions with your operator.",
    href: "/helicopter-waitlist",
    label: "Review cruise port timing",
  },
  {
    title: "Get help before and after choosing",
    description: "Ask our team about tour choices and port timing. If weather changes your plans, we can help you explore alternatives that fit the time you have left. Backup activities require a separate booking and depend on availability.",
    href: "/contact",
    label: "Ask Juneau Flight Deck",
  },
] as const;

export const BOOKING_FAQS = [
  {
    question: "Why book through Juneau Flight Deck?",
    answer: "Juneau Flight Deck brings operator comparisons, an icefield map, cruise pickup and timing guidance, and Viator booking links together so you can choose a tour that fits your group and port day. DCC evaluates tour suitability and calculates cruise timing buffers; Juneau Flight Deck explains the options; Viator handles the booking and applicable booking protections.",
  },
  {
    question: "How do Viator links and Worry-free Shore Excursion protections work?",
    answer: "Product-specific Viator links (such as Coastal Helicopters' Icefield Excursion, product code 6251SHOREXICEWALK) open the exact Viator tour listing, while links labeled Search on Viator open filtered search results where you should select the specific product and review its terms before paying. Only products expressly marked 'Worry-free Shore Excursion' on Viator (tagId 367649) qualify for Viator's back-to-ship protection under Viator Terms of Use Section 20 (https://www.viator.com/support/termsAndConditions), which requires accurate ship arrival/departure details, a minimum 2-hour buffer before ship departure, and contacting Viator directly if delayed (up to US$1,000 per person next-port transport). DCC's cruise-timing buffer calculation is an independent planning check and is not itself a back-to-ship guarantee.",
  },
  {
    question: "Who operates my tour and handles cancellations?",
    answer: "The named local operator runs your tour and determines flight safety and pickup arrangements. Payment, changes, and refunds follow the terms of Viator or the operator channel on your confirmation.",
  },
  {
    question: "Can I use Juneau Flight Deck if my tour is not sold out?",
    answer: "Yes. Start by comparing experiences and following the Viator booking link for your chosen tour. Availability requests support dates with no suitable online option; they do not reserve seats or guarantee an opening.",
  },
] as const;
