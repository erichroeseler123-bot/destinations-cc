// Shared public identity for pages, metadata, structured data, and discovery endpoints.
export const SITE_DESCRIPTION =
  "Juneau Flight Deck helps cruise passengers choose and book Juneau excursions with operator comparisons, glacier maps, pickup and port timing guidance, and help exploring weather alternatives.";

export const BOOKING_ROLES =
  "Choose your tour with Juneau Flight Deck, then complete your reservation through the operator booking page or Viator link shown. The named operator runs your tour; the selected booking provider handles payment, confirmation, and booking terms.";

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
    answer: "Juneau Flight Deck brings operator comparisons, an icefield map, cruise pickup and timing guidance, and planning help together so you can choose a tour that fits your group and port day. These benefits apply when tours are available; availability requests are an additional option for dates you cannot book online.",
  },
  {
    question: "Does every Juneau Flight Deck booking go through Viator?",
    answer: "No. Juneau Flight Deck includes direct operator booking pages, including FareHarbor pages, as well as Viator links. A link labeled Search on Viator opens search results; choose the specific product and review its terms before paying. The booking provider you select handles payment and confirmation.",
  },
  {
    question: "Who operates my tour and handles cancellations?",
    answer: "The named local operator runs your tour and determines flight safety and pickup arrangements. Payment, changes, and refunds follow the terms of your selected booking channel and tour. Contact the provider on your confirmation for reservation changes or urgent departure updates.",
  },
  {
    question: "Can I use Juneau Flight Deck if my tour is not sold out?",
    answer: "Yes. Start by comparing experiences and following the booking link for your chosen tour. Availability requests support dates with no suitable online option; they do not reserve seats or guarantee an opening.",
  },
] as const;
