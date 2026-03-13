export type CruiseShoreExcursionRegion = {
  title: string;
  summary: string;
  picks: Array<{
    title: string;
    body: string;
  }>;
};

export type CruiseShoreExcursionDecision = {
  title: string;
  body: string;
};

export type CruiseShoreExcursionVideo = {
  title: string;
  href: string;
  source: string;
  whyItMatters: string;
};

export const CRUISE_SHORE_EXCURSION_REGIONS: CruiseShoreExcursionRegion[] = [
  {
    title: "Alaska",
    summary:
      "Alaska shore days are strongest when you book around wildlife, glacier access, or scenic transport, and weakest when you underestimate weather or sellout risk.",
    picks: [
      {
        title: "Mendenhall Glacier and whale watching from Juneau",
        body:
          "Still one of the highest-signal Alaska combinations because it covers both wildlife and glacier demand in one day. Treat motion, rain, and timing buffers as part of the plan.",
      },
      {
        title: "White Pass Scenic Railway from Skagway",
        body:
          "Excellent value when you want dramatic scenery without a physically demanding day. This is one of the most reliable Alaska excursion picks for mixed-age groups.",
      },
      {
        title: "Helicopter or dog-sledding upgrades",
        body:
          "These are the memorable Alaska splurge options, but they are weather-sensitive and sell out early. Book early or hold a realistic backup.",
      },
    ],
  },
  {
    title: "Caribbean",
    summary:
      "The Caribbean is where shore excursions most often split between easy beach days, reef/water activities, and one marquee cultural stop. Crowd management matters as much as the attraction itself.",
    picks: [
      {
        title: "Stingray City and snorkeling from Grand Cayman",
        body:
          "A classic family-friendly excursion that still works, but it can feel crowded. The value comes from timing, operator size, and how tightly the day is staged around tender logistics.",
      },
      {
        title: "Reef snorkeling or diving from Cozumel",
        body:
          "Cozumel remains one of the strongest snorkeling and diving ports in the region. Smaller-group operators usually improve the day materially if you care about time in the water.",
      },
      {
        title: "Chacchoben ruins from Costa Maya",
        body:
          "A better culture/history pick than many travelers expect. Guides matter here, and heat management matters more than people think.",
      },
    ],
  },
  {
    title: "Europe and Mediterranean",
    summary:
      "Europe rewards excursions that solve transport friction. The wrong plan burns hours between ship, coach, and city gates before the real day begins.",
    picks: [
      {
        title: "Rome highlights from Civitavecchia",
        body:
          "Worth doing only if you respect the transit burden. Skip-the-line access and managed transport are often the reason a Rome day works at all.",
      },
      {
        title: "Acropolis and Plaka from Athens",
        body:
          "High-value history day if you start early and manage heat exposure. This is stronger with a guide than as a rushed self-assembled day for most cruisers.",
      },
      {
        title: "Santorini caldera or wine-focused shore days",
        body:
          "Still one of the best ports for scenery plus local flavor, but crowd timing and cable-car pressure can degrade the experience quickly.",
      },
    ],
  },
  {
    title: "Other standout long-haul and canal days",
    summary:
      "These are the once-in-the-itinerary shore days where logistics and physical demands matter more than impulse browsing.",
    picks: [
      {
        title: "Panama Canal overland or partial-transit options",
        body:
          "These work when you want infrastructure context and a deeper day than a simple port wander. Expect long hours and staged transport.",
      },
      {
        title: "Machu Picchu overland extensions",
        body:
          "Exceptional, but physically demanding and usually expensive. Treat altitude, transit fatigue, and schedule rigidity as core planning factors.",
      },
    ],
  },
];

export const CRUISE_SHORE_EXCURSION_DECISIONS: CruiseShoreExcursionDecision[] = [
  {
    title: "Choose ship-booked for tender ports and long inland transfers",
    body:
      "When the day depends on getting off the ship early or traveling far inland, the ship-booked option is often paying for operational simplicity, not just convenience.",
  },
  {
    title: "Choose independent for smaller groups and easier beach or reef days",
    body:
      "Independent operators tend to win when the activity is simple, close to port, and improved by a smaller group size or more flexible timing.",
  },
  {
    title: "Book high-demand excursions months ahead",
    body:
      "Alaska helicopters, premium wildlife days, and narrow-capacity small-group tours often sell out long before sailing. Treat them like core itinerary pieces, not last-minute extras.",
  },
  {
    title: "Use recent reviews and weather patterns as part of the decision",
    body:
      "The best excursion on paper can underperform because of seasonal visibility, sea state, crowding, or changed operator quality. Check fresh signals before locking it in.",
  },
];

export const CRUISE_SHORE_EXCURSION_FAQ = [
  {
    question: "Should you book shore excursions through the cruise line or independently?",
    answer:
      "Use the cruise line for tender-heavy, timing-sensitive, or long-distance days where return protection matters most. Use reputable independent operators for simpler days when smaller groups or lower pricing improve the experience.",
  },
  {
    question: "How early should you book the most popular shore excursions?",
    answer:
      "For Alaska, helicopters, rail, and limited-capacity wildlife products, 3 to 6 months ahead is a safer planning window. Simpler Caribbean beach days can usually wait longer.",
  },
  {
    question: "What makes a shore excursion feel overrated?",
    answer:
      "The usual failure modes are crowd compression, too much bus time, weak guide quality, and unrealistic expectations about how much usable shore time you actually have.",
  },
];

export const CRUISE_SHORE_EXCURSION_VIDEOS: CruiseShoreExcursionVideo[] = [
  {
    title: "Top 10 Most Popular Shore Excursions Of 2025",
    href: "https://www.youtube.com/watch?v=Q2LzKtirR_E",
    source: "CruiseHols",
    whyItMatters:
      "Useful macro view of what travelers are actually booking, with enough context to compare popularity against practical value.",
  },
  {
    title: "Our Best & Worst Cruises of 2025",
    href: "https://www.youtube.com/watch?v=iuWmEhzpR-I",
    source: "Recent cruiser recap",
    whyItMatters:
      "Helpful because it shows which excursions actually felt worth the time and money after the trip, not only at the booking stage.",
  },
  {
    title: "Best Skagway Shore Excursions for Your Alaska Cruise",
    href: "https://www.youtube.com/watch?v=FrOkBjn2H5U",
    source: "Alaska port guide",
    whyItMatters:
      "Good Alaska-specific reality check for rail, scenery, and what a flagship excursion day in Skagway really looks like.",
  },
];
