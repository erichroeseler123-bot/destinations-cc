export type CruiseTenderingTip = {
  title: string;
  body: string;
};

export type CruiseTenderingVideo = {
  title: string;
  href: string;
  source: string;
  whyItMatters: string;
};

export const CRUISE_TENDERING_TIPS: CruiseTenderingTip[] = [
  {
    title: "Do not chase the very first tender",
    body:
      "The first wave is usually the most crowded. If you are not on a ship-booked excursion or in a priority group, waiting 30 to 60 minutes often gives you a calmer breakfast, shorter queues, and a less compressed start to the day.",
  },
  {
    title: "Understand who gets priority first",
    body:
      "Ship-booked excursions, suite guests, loyalty tiers, and add-on priority products often board before general tender groups. If your day depends on early shore access, treat priority rules as part of the port plan, not as a surprise at the gangway.",
  },
  {
    title: "Get tender tickets early if your line uses them",
    body:
      "Many lines still use ticket or app-based queue systems. Watch the app, daily newsletter, and ship announcements closely so you do not miss your group release window.",
  },
  {
    title: "Treat motion as part of the transfer, not a small detail",
    body:
      "Tender boats can move more sharply than the ship, especially in wind or chop. If you are prone to seasickness, medicate early, use airflow, and pick seats with the least motion stress you can.",
  },
  {
    title: "Return well before the last tender",
    body:
      "The final return window is where the biggest lines and the most anxiety usually build. A 2 to 3 hour buffer is often the difference between a calm return and a pileup on the pier.",
  },
  {
    title: "Boarding gaps and steps matter",
    body:
      "Tendering is not neutral for mobility. Gaps, stairs, uneven movement, and wet surfaces make this a real accessibility and safety factor. Ask for crew assistance early and wear stable shoes.",
  },
  {
    title: "Independent plans still need tender buffer",
    body:
      "Private operators may understand port delays, but tender timing can still compress your usable shore window. Keep excursion plans simple if the port is weather-sensitive or the tender ride is central to the day.",
  },
];

export const CRUISE_TENDERING_VIDEOS: CruiseTenderingVideo[] = [
  {
    title: "Cruise Ship Tender Process for First Time Cruisers",
    href: "https://www.youtube.com/watch?v=F46v7Da59rE",
    source: "Cruise beginner walkthrough",
    whyItMatters:
      "Good visual baseline for how ticketing, boarding, and the basic transfer sequence usually work for first-timers.",
  },
  {
    title: "Everything You Need to Know About Tendering | Tender Boats & Ports",
    href: "https://www.youtube.com/watch?v=0pQHr0YGD2I",
    source: "Tendering explainer",
    whyItMatters:
      "Useful companion to DCC timing guidance because it shows how tickets, waits, mobility concerns, and return timing stack together in practice.",
  },
  {
    title: "Tender Ports Explained | How to Get Off the Ship Without Stress",
    href: "https://www.youtube.com/watch?v=_-K0IeArQZU",
    source: "Cruise logistics explainer",
    whyItMatters:
      "Strong practical reference for what to bring, when to return, and why the tender process can derail otherwise simple shore plans.",
  },
];

export const CRUISE_TENDERING_FAQ = [
  {
    question: "Should you try to get the first tender off the ship?",
    answer:
      "Usually only if you have an early priority group or an excursion that genuinely depends on it. For many travelers, waiting through the first rush is the calmer move.",
  },
  {
    question: "How early should you come back for the return tender?",
    answer:
      "A 2 to 3 hour buffer before the last tender is often the safer planning assumption, especially when weather or crowding can degrade operations.",
  },
  {
    question: "Is tendering a problem for travelers with mobility concerns?",
    answer:
      "It can be. Steps, gaps, motion, and changing dock conditions make tender ports more demanding than straightforward dockside calls.",
  },
];
