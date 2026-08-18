import type { IntentSeoLandingConfig } from "../components/IntentSeoLanding";

export type IntentSeoPage = {
  slug: string;
  title: string;
  description: string;
  config: IntentSeoLandingConfig;
};

export const INTENT_SEO_PAGES: IntentSeoPage[] = [
  {
    slug: "new-orleans-morning-tours",
    title: "New Orleans Morning Tours | Start the Day with a Plan",
    description: "Compare New Orleans tour options that can fit a morning plan, then confirm current departure times and availability with the operator.",
    config: {
      eyebrow: "Morning planning",
      title: "New Orleans tours to check for a morning plan",
      intro: "If you want to use the first half of the day well, start with the format you want and then confirm the operator's actual departure time. Morning availability changes by tour and date, so this page narrows the choices without promising a departure that may not be running.",
      decisionPoints: [
        "City sightseeing can be a practical first-day overview when a morning departure is offered.",
        "A daytime river cruise can work when its scheduled sailing fits your morning-to-midday window.",
        "Swamp trips require more total time because transportation and travel outside the city may be part of the day.",
        "If you have a hard lunch, checkout or cruise deadline, choose by total door-to-door time rather than tour duration alone."
      ],
      productSlugs: ["city-tour-of-new-orleans", "daytime-jazz-cruise", "covered-tour-boat", "ragin-cajun-airboat-options"],
      productHeading: "Morning-oriented options to check",
      productIntro: "These are useful starting points for a morning plan. Confirm the actual date, departure time, pickup arrangement and total duration during booking.",
      relatedLinks: [
        { href: "/guides/things-to-do-in-new-orleans-today", label: "Things to do today" },
        { href: "/guides/4-hours-in-new-orleans", label: "Only have about four hours" },
        { href: "/guides/new-orleans-tours-with-transportation", label: "Tours with transportation" }
      ]
    }
  },
  {
    slug: "new-orleans-afternoon-tours",
    title: "New Orleans Afternoon Tours | Plan the Rest of the Day",
    description: "Compare New Orleans afternoon tour formats including city, river, swamp and evening-friendly options, then check current operator times.",
    config: {
      eyebrow: "Afternoon planning",
      title: "New Orleans tours to check for an afternoon plan",
      intro: "An open afternoon can support anything from a city overview to a swamp trip or river experience, but the right choice depends on when you are actually free and what you need to be back for. Start with the decision, then verify the operator's live schedule.",
      decisionPoints: [
        "If dinner is fixed, work backward from the time you need to be back rather than the advertised activity length.",
        "Swamp and plantation experiences can consume more of the day because travel time matters.",
        "A city tour or river cruise may be easier to fit into a tighter afternoon window when a suitable departure is available.",
        "If your afternoon can roll into evening, compare daytime choices with tonight-oriented experiences before deciding."
      ],
      productSlugs: ["city-tour-of-new-orleans", "daytime-jazz-cruise", "covered-tour-boat", "craft-cocktail-walking-tour", "evening-jazz-cruise"],
      productHeading: "Afternoon and early-evening starting points",
      productIntro: "Use these to narrow the catalog, then confirm the exact departure and return timing with the tour operator.",
      relatedLinks: [
        { href: "/guides/new-orleans-tours-that-fit-before-dinner", label: "Tours before dinner" },
        { href: "/guides/new-orleans-tours-tonight", label: "Tours tonight" },
        { href: "/guides/best-new-orleans-tours-if-you-arrive-at-noon", label: "Arriving around noon" }
      ]
    }
  },
  {
    slug: "one-day-in-new-orleans-tours",
    title: "One Day in New Orleans | Tour Planning for a Single Day",
    description: "Plan one day in New Orleans by choosing one anchor experience, realistic travel time and a second activity only when the schedule supports it.",
    config: {
      eyebrow: "One-day planning",
      title: "How to choose tours when you have one day in New Orleans",
      intro: "With one day, the biggest mistake is trying to stack too many major experiences. Pick the one experience that matters most, account for transportation and transition time, and add a second activity only if the schedule genuinely fits.",
      decisionTitle: "Build the day around one anchor",
      decisionPoints: [
        "Choose a city overview if your priority is understanding New Orleans itself on a first visit.",
        "Choose a swamp experience if getting outside the city is the main reason you want a tour.",
        "Choose a river cruise if you want a defined experience that stays centered on the Mississippi River setting.",
        "Choose a combination product only when you are comfortable committing most of the day to structured touring."
      ],
      productSlugs: ["city-tour-of-new-orleans", "covered-tour-boat", "ragin-cajun-airboat-options", "daytime-jazz-cruise", "all-day-city-plantation-combo", "swamp-boat-oak-alley-combo"],
      productHeading: "Ways to anchor a one-day visit",
      productIntro: "These represent different ways to spend a meaningful share of one day. Confirm total duration, transportation and current schedules before stacking anything else around them.",
      relatedLinks: [
        { href: "/guides/first-time-new-orleans-tours", label: "First-time visitors" },
        { href: "/guides/4-hours-in-new-orleans", label: "Only have four hours" },
        { href: "/guides/things-to-do-before-a-cruise-new-orleans", label: "Before a cruise" }
      ],
      faq: [
        { question: "What should I prioritize with one day in New Orleans?", answer: "Choose one anchor based on what matters most to you: city context, the Mississippi River, the wetlands or a longer history-focused outing. Add a second timed experience only after the first tour's total travel and return window are clear." },
        { question: "Can I do a city tour and an evening jazz cruise in one day?", answer: "Often that is one of the cleaner two-experience combinations because the city tour can provide daytime context and the evening cruise can anchor the night. Confirm the exact departure and return times for your date before booking both." },
        { question: "Can I do a swamp tour and a plantation in one day?", answer: "Yes when you intentionally choose a coordinated combination or when separate schedules leave enough travel and transition time. Do not assume two standalone departures will connect cleanly." },
      ]
    }
  },
  {
    slug: "city-tour-vs-swamp-tour-new-orleans",
    title: "New Orleans City Tour vs Swamp Tour | Which Should You Choose?",
    description: "Compare a New Orleans city tour with a swamp tour based on setting, transportation, time commitment and what you want to learn or experience.",
    config: {
      eyebrow: "Tour-type decision",
      title: "City tour or swamp tour: which is the better fit for your New Orleans visit?",
      intro: "These are not substitutes for the same experience. A city tour is about understanding New Orleans neighborhoods and landmarks; a swamp tour takes you outside the city for a very different Louisiana setting. Your available time and transportation tolerance usually settle the decision.",
      decisionTitle: "The decision in plain English",
      decisionPoints: [
        "Choose a city tour when your priority is context for New Orleans itself, especially on a first visit.",
        "Choose a swamp tour when the bayou environment and boat experience are the main attraction for your group.",
        "City touring generally keeps you closer to the urban core; swamp touring requires travel outside central New Orleans.",
        "If you want both, compare a combination or plan them on separate blocks rather than assuming two standalone tours will connect cleanly."
      ],
      productSlugs: ["city-tour-of-new-orleans", "covered-tour-boat", "ragin-cajun-airboat-options", "swamp-bayou-tour"],
      productHeading: "Compare the actual formats",
      productIntro: "Review the city and swamp options below, then use current operator details for pickup, timing, vessel format and availability.",
      relatedLinks: [
        { href: "/city-tours", label: "City tours" },
        { href: "/swamp-tours", label: "Swamp tours" },
        { href: "/compare/covered-swamp-boat-vs-airboat", label: "Covered boat vs airboat" }
      ]
    }
  },
  {
    slug: "whitney-plantation-tour-from-new-orleans",
    title: "Whitney Plantation Tour from New Orleans | Transportation & Planning",
    description: "Plan a Whitney Plantation visit from New Orleans by comparing dedicated and combination tour options and confirming current transportation details.",
    config: {
      eyebrow: "Plantation planning",
      title: "Whitney Plantation tour options from New Orleans",
      intro: "A Whitney Plantation visit is an out-of-city commitment, so transportation and total day length matter as much as the site visit itself. Compare a dedicated Whitney option with combination products, then confirm pickup and schedule details with the operator.",
      decisionPoints: [
        "A dedicated Whitney tour is the cleaner choice when Whitney is the main priority of the day.",
        "A Whitney plus swamp combination can reduce separate planning but commits more of the day to organized touring.",
        "Do not assume every departure includes the same pickup zone or transportation arrangement.",
        "Use the operator's current itinerary to understand travel time, site time and return timing before booking another activity afterward."
      ],
      productSlugs: ["whitney-plantation-tour", "swamp-boat-whitney-combo"],
      productHeading: "Whitney-focused options",
      productIntro: "These products provide two different ways to structure the visit. Confirm transportation, pickup, admission inclusions, duration and availability during booking.",
      relatedLinks: [
        { href: "/plantation-tours", label: "Plantation tours" },
        { href: "/compare/whitney-vs-oak-alley", label: "Whitney vs Oak Alley" },
        { href: "/guides/new-orleans-plantation-and-swamp-tour", label: "Plantation + swamp combinations" }
      ]
    }
  },
  {
    slug: "oak-alley-plantation-tour-from-new-orleans",
    title: "Oak Alley Plantation Tour from New Orleans | Transportation & Combos",
    description: "Compare Oak Alley Plantation tour options from New Orleans, including dedicated and swamp combination formats, then confirm current pickup and timing.",
    config: {
      eyebrow: "Plantation planning",
      title: "Oak Alley Plantation tour options from New Orleans",
      intro: "Oak Alley is outside central New Orleans, so the practical choice is not just which property to visit but how you want the transportation and the rest of the day structured. Compare dedicated and combination formats before checking the live operator schedule.",
      decisionPoints: [
        "Choose a dedicated plantation format when Oak Alley is the main experience you want to prioritize.",
        "Choose a swamp combination when you intentionally want a longer structured day covering two different Louisiana experiences.",
        "Pickup locations, transportation arrangements and total duration can vary by product and departure.",
        "If you are choosing between plantations rather than tour formats, compare Oak Alley with Whitney or Laura before booking."
      ],
      productSlugs: ["oak-alley-or-laura-plantation-tour", "oak-alley-plantation-tour-grey-line", "swamp-boat-oak-alley-combo"],
      productHeading: "Oak Alley-oriented options",
      productIntro: "Compare the different formats, then confirm the operator's current property selection, transportation, pickup details, duration and availability.",
      relatedLinks: [
        { href: "/plantation-tours", label: "Plantation tours" },
        { href: "/compare/whitney-vs-oak-alley", label: "Whitney vs Oak Alley" },
        { href: "/plantation-tours/oak-alley-vs-laura", label: "Oak Alley vs Laura" }
      ]
    }
  },
  {
    slug: "daytime-vs-evening-jazz-cruise-new-orleans",
    title: "Daytime vs Evening Jazz Cruise in New Orleans | Compare the Fit",
    description: "Compare daytime and evening New Orleans jazz cruises by schedule fit, atmosphere and how each fits into the rest of your day.",
    config: {
      eyebrow: "River cruise decision",
      title: "Daytime or evening jazz cruise: which fits your New Orleans trip better?",
      intro: "The core decision is usually not which boat sounds better; it is when you want the river experience to sit in your day. A daytime sailing preserves the evening for other plans, while an evening cruise can become the centerpiece of the night. Exact sailings and meal options must be confirmed during booking.",
      decisionPoints: [
        "Choose daytime when you want to keep dinner and nightlife flexible afterward.",
        "Choose evening when you want the river cruise itself to anchor your nighttime plans.",
        "Meal inclusions and seating choices vary by product and booking option; do not assume every cruise includes food.",
        "Check boarding and departure times before pairing a cruise with another timed tour on the same day."
      ],
      productSlugs: ["daytime-jazz-cruise", "evening-jazz-cruise", "sunday-jazz-brunch-cruise", "city-of-new-orleans-riverboat-cruise"],
      productHeading: "River cruise options to compare",
      productIntro: "Start with daypart and format, then confirm the specific sailing, meal option, boarding time, pricing and availability with the operator.",
      relatedLinks: [
        { href: "/guides/new-orleans-tours-tonight", label: "Tours tonight" },
        { href: "/guides/new-orleans-afternoon-tours", label: "Afternoon tours" },
        { href: "/compare/natchez-vs-city-of-new-orleans-riverboat", label: "Compare riverboats" }
      ]
    }
  },
  {
    slug: "new-orleans-without-a-car",
    title: "New Orleans Tours Without a Car | What Is Easy to Book",
    description: "Choose New Orleans tours without a rental car by comparing walkable meeting points, included transportation and out-of-city experiences that offer shuttle options.",
    config: {
      eyebrow: "No-car planning",
      title: "New Orleans tours that make sense when you do not have a car",
      intro: "You do not need a rental car for many of the major New Orleans experiences, but the logistics are different by tour. Start by separating experiences you can reach on foot in the visitor core from out-of-city tours that need operator transportation or a shuttle option.",
      decisionTitle: "Choose by transportation burden, not just the tour name",
      decisionPoints: [
        "River cruises are often the simplest no-car option because you meet near the riverfront rather than traveling outside the city.",
        "A city tour can work well without a car when the operator provides the pickup or meeting arrangement for your departure.",
        "For swamp experiences, choose an option with operator transportation if you do not want to arrange your own ride outside New Orleans.",
        "Plantation and combination tours consume more total time, so confirm the meeting point, pickup arrangement and return window before planning another timed activity."
      ],
      productSlugs: ["city-tour-of-new-orleans", "daytime-jazz-cruise", "evening-jazz-cruise", "covered-tour-boat", "ragin-cajun-airboat-options", "whitney-plantation-tour"],
      productHeading: "No-car starting points",
      productIntro: "These options represent different transportation patterns. Confirm the current meeting point, shuttle or pickup details, departure time and return timing during booking.",
      relatedLinks: [
        { href: "/guides/new-orleans-tours-with-transportation", label: "Tours with transportation" },
        { href: "/guides/best-swamp-tour-with-transportation", label: "Swamp tours with transportation" },
        { href: "/guides/one-day-in-new-orleans-tours", label: "Planning one day" },
        { href: "/help-me-choose", label: "Help me choose" }
      ],
      faq: [
        { question: "Do I need a rental car for New Orleans tours?", answer: "No. Many city and river experiences can be reached without a rental car, while swamp and plantation trips may offer operator transportation. Confirm the current pickup or meeting point before booking." },
        { question: "Can I do a swamp tour without a car?", answer: "Yes when you select a swamp product that offers transportation or a shuttle option for your date. Check the current pickup location and total trip time during booking." },
        { question: "What should I check before booking without a car?", answer: "Confirm the exact meeting point or pickup zone, when you must be there, how long the full outing takes, and where you return before stacking another reservation afterward." }
      ]
    }
  },
  {
    slug: "jazz-cruise-dinner-or-sightseeing",
    title: "New Orleans Jazz Cruise: Dinner or Sightseeing? | How to Choose",
    description: "Compare dinner and sightseeing-only jazz cruise options in New Orleans, including schedule fit, meal commitment and what to confirm before booking.",
    config: {
      eyebrow: "River cruise decision",
      title: "Dinner or sightseeing-only jazz cruise: which option fits your night?",
      intro: "The evening jazz cruise can be booked in different formats, and the important decision is whether you want dinner to be part of the cruise or whether you would rather keep the boat focused on the river, skyline and live jazz. The current operator checkout separates sightseeing and dinner seating options, so choose the experience first and then the available time.",
      decisionTitle: "The trade-off is meal time versus flexibility",
      decisionPoints: [
        "Choose sightseeing-only when you want more flexibility to eat elsewhere before or after the cruise.",
        "Choose a dinner seating when you want the meal and cruise to function as one planned evening instead of coordinating two separate reservations.",
        "Dinner and sightseeing options can have different check-in or seating details even when they are tied to the same evening cruise product.",
        "If skyline views and deck time are your top priority, review the current seating and boarding details before deciding whether a meal is worth adding."
      ],
      productSlugs: ["evening-jazz-cruise", "daytime-jazz-cruise", "city-of-new-orleans-riverboat-cruise"],
      productHeading: "Cruise formats to compare",
      productIntro: "Start with the evening jazz cruise, then use the operator checkout to choose sightseeing-only, early dinner, late dinner or any currently offered variant. The exact sailing, menu, seating and price are controlled by the operator.",
      relatedLinks: [
        { href: "/guides/daytime-vs-evening-jazz-cruise-new-orleans", label: "Daytime vs evening jazz cruise" },
        { href: "/compare/natchez-vs-city-of-new-orleans-riverboat", label: "Compare the riverboats" },
        { href: "/guides/new-orleans-tours-tonight", label: "Tours tonight" },
        { href: "/riverboat-cruises", label: "All river cruises" }
      ],
      faq: [
        { question: "Do I have to buy dinner on a New Orleans jazz cruise?", answer: "No. The current evening jazz cruise inventory includes a sightseeing-only option as well as dinner seating variants. Choose the format that matches how you want to structure the evening." },
        { question: "Is dinner included in every jazz cruise ticket?", answer: "No. Meal inclusion depends on the specific booking variant. Read the selected FareHarbor option before checkout rather than assuming dinner is part of every ticket." },
        { question: "Should I eat before the jazz cruise instead?", answer: "That is often the cleaner choice if restaurant flexibility matters more than combining dinner and the cruise. If convenience matters more, a dinner seating can turn the cruise into the main event of the evening." }
      ]
    }
  }
];

export function getIntentSeoPage(slug: string): IntentSeoPage | undefined {
  return INTENT_SEO_PAGES.find((page) => page.slug === slug);
}
