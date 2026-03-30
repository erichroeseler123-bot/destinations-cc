export const NAV_ITEMS = [
  { href: "/airboat-vs-boat", label: "Airboat vs Boat" },
  { href: "/with-kids", label: "With Kids" },
  { href: "/best-time", label: "Best Time" },
  { href: "/transportation", label: "Transportation" },
  { href: "/types", label: "Types" },
  { href: "/plan", label: "Plan Your Tour" },
] as const;

export const START_PATHS = [
  {
    title: "I want something exciting",
    summary: "Start with faster, louder airboat-style experiences if thrill matters more than comfort.",
    href: "/airboat-vs-boat",
  },
  {
    title: "I want something calm",
    summary: "Start with covered or larger boats if you want shade, easier conversation, and a less intense ride.",
    href: "/types",
  },
  {
    title: "I'm going with kids",
    summary: "Use the family lane first so you do not end up with too much noise, heat, or trip length.",
    href: "/with-kids",
  },
  {
    title: "I need pickup from New Orleans",
    summary: "Start with transport reality before operator branding. Pickup convenience can decide the whole experience.",
    href: "/transportation",
  },
  {
    title: "I want the best overall choice",
    summary: "Start with the safest default for first-timers, then narrow from there.",
    href: "/plan?intent=compare&topic=swamp-tours&subtype=types&context=first-time",
  },
  {
    title: "I need help comparing airboat vs boat",
    summary: "Use the choice page if the main question is comfort versus speed, not whether to go at all.",
    href: "/airboat-vs-boat",
  },
] as const;

export const TRUST_POINTS = [
  "Built to reduce decision friction, not dump endless listings on you",
  "Honest about tradeoffs like noise, weather, comfort, and transport",
  "Uses real booking-intent questions instead of generic travel fluff",
] as const;

export const HOME_FEATURES = [
  {
    title: "Airboat vs boat",
    copy: "Use this when the main question is speed and excitement versus comfort and conversation.",
    href: "/airboat-vs-boat",
  },
  {
    title: "Best for families",
    copy: "Narrow toward easier ride styles, better shade, and simpler logistics for mixed-age groups.",
    href: "/with-kids",
  },
  {
    title: "Best without a car",
    copy: "Figure out which tours still make sense when pickup or transfer simplicity matters most.",
    href: "/transportation",
  },
  {
    title: "Best overall first pick",
    copy: "If you want the safest strong default, start with the shortlist logic instead of the whole market.",
    href: "/plan?intent=compare&topic=swamp-tours&subtype=types&context=first-time",
  },
] as const;

export const DECISION_SHORTLISTS = [
  {
    id: "comfort",
    title: "Best if you want comfort",
    summary: "Look for covered or larger boats with calmer pacing and cleaner pickup logistics.",
    goodFor: "First-timers, older travelers, mixed groups, and anyone who does not want the ride itself to be the challenge.",
    avoidIf: "You want speed, noise, and a more intense experience.",
  },
  {
    id: "speed",
    title: "Best if you want speed",
    summary: "Airboat-style experiences are usually the right fit when excitement is the whole point.",
    goodFor: "Travelers who actively want a louder, faster, more thrilling ride.",
    avoidIf: "Comfort, shade, easy conversation, or young kids are the priority.",
  },
  {
    id: "families",
    title: "Best for families",
    summary: "Bias toward shorter, calmer, easier tours that still feel memorable without wearing everyone down.",
    goodFor: "Parents, grandparents, and mixed-age groups trying to keep the day manageable.",
    avoidIf: "The group specifically wants the most intense ride possible.",
  },
  {
    id: "pickup",
    title: "Best if you need pickup",
    summary: "When you do not have a car, transport convenience can matter more than small differences in tour branding.",
    goodFor: "Visitors staying in the French Quarter, CBD, or nearby hotels who want less friction.",
    avoidIf: "You are self-driving and can optimize for other factors instead.",
  },
] as const;

export const CORE_CLUSTERS = [
  {
    title: "Core decisions",
    items: [
      "Airboat vs boat tours",
      "Morning vs afternoon tours",
      "Best overall first pick",
      "Best without a car",
    ],
  },
  {
    title: "Expectation filters",
    items: [
      "What animals you might actually see",
      "How much weather changes the fit",
      "Mosquito and heat reality",
      "What first-time visitors usually underestimate",
    ],
  },
  {
    title: "Decision details",
    items: [
      "How long the whole outing really takes",
      "Where tours actually depart from",
      "How pickup and transfers work",
      "What changes for families and older travelers",
    ],
  },
  {
    title: "Best-for pages",
    items: [
      "Best for families",
      "Best for comfort",
      "Best for speed",
      "Best for pickup convenience",
    ],
  },
] as const;

export const PAGE_SUMMARIES = {
  "/": {
    title: "Welcome to the Swamp",
    summary:
      "Homepage and decision hub for figuring out which swamp tour is the best fit from New Orleans.",
  },
  "/start-here": {
    title: "Start Here",
    summary:
      "First-timer orientation for deciding whether a swamp tour fits the trip and which decision lane to start with.",
  },
  "/choose-the-right-tour": {
    title: "Choose the Right Tour",
    summary:
      "Decision page for airboat versus boat, comfort versus speed, family fit, and pickup-sensitive choices.",
  },
  "/plan": {
    title: "Plan",
    summary:
      "Canonical warm-transfer page that receives DCC context and turns it into a narrower WTS decision path.",
  },
  "/plan-your-day": {
    title: "Plan Your Day",
    summary:
      "Planning page for timing, weather, trip length, clothing, and how the tour fits the rest of a New Orleans day.",
  },
  "/what-its-like": {
    title: "What It's Like",
    summary:
      "Expectation-setting page focused on the factors that change whether a specific tour style will feel worth it.",
  },
  "/from-new-orleans": {
    title: "From New Orleans",
    summary:
      "Logistics page for pickup, no-car planning, transfer burden, and which tours fit city-based visitors best.",
  },
  "/live-options": {
    title: "Decision Shortlist",
    summary:
      "Shortlist page for comparing the strongest current swamp-tour fits after narrowing down the right lane.",
  },
} as const;
