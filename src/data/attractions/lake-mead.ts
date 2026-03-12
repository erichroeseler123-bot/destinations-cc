import type { AttractionPillarConfig } from "@/app/components/dcc/AttractionPillarTemplate";

export const LAKE_MEAD_PILLAR: AttractionPillarConfig = {
  slug: "lake-mead",
  pageUrl: "https://destinationcommandcenter.com/lake-mead",
  eyebrow: "DCC Attraction Pillar",
  title: "Lake Mead tours, boating, and Las Vegas recreation planning",
  description:
    "Lake Mead is the water-recreation pillar inside the Las Vegas desert graph. This page covers boat tours, kayaking, Hoover Dam adjacency, and why Lake Mead solves a different trip-planning problem than canyon or city-only products.",
  placeName: "Lake Mead",
  gridTitle: "Best Lake Mead booking lanes",
  gridDescription:
    "These links focus on Lake Mead’s strongest booking categories: boat tours, kayak routes, Hoover Dam combos, water recreation, and Vegas outdoor day trips.",
  schemaType: "TouristAttraction",
  highlights: [
    {
      title: "Best for water-focused outdoor time",
      body: "Lake Mead breaks the all-desert pattern and gives Vegas buyers a water-recreation answer that feels different from canyon and casino planning.",
    },
    {
      title: "Best for activity variety",
      body: "This pillar can capture boat tours, kayaking, scenic recreation, and Hoover Dam combo behavior instead of forcing all water intent into generic outdoor copy.",
    },
    {
      title: "Best for cross-linking",
      body: "Lake Mead naturally connects to Hoover Dam, helicopter inventory, and broader Vegas day-trip planning, which makes it a strong graph node.",
    },
  ],
  tourFallbacks: [
    { label: "Lake Mead tours from Las Vegas", query: "lake mead tour from las vegas" },
    { label: "Lake Mead boat tours", query: "lake mead boat tour" },
    { label: "Lake Mead kayaking tours", query: "lake mead kayak tour" },
    { label: "Lake Mead and Hoover Dam tours", query: "lake mead hoover dam tour" },
    { label: "Lake Mead water activities", query: "lake mead water activities" },
    { label: "Las Vegas lake and desert day trips", query: "las vegas lake day trip" },
  ],
  sections: [
    {
      title: "From Las Vegas as a recreation day",
      body: "Lake Mead works best when the buyer wants outdoor time without making the whole day about deep-desert road mileage. It is a cleaner fit for recreation-led trips than many longer canyon routes.",
    },
    {
      title: "Boat tours, kayaking, and scenic water routes",
      body: "Some buyers want a boat product, some want paddling, and others want a softer scenic option that still feels outdoors-first. Those are different intents and should be expressed as separate Lake Mead lanes over time.",
    },
    {
      title: "How it fits with Hoover Dam",
      body: "Lake Mead and Hoover Dam should cross-link tightly because many travelers understand them as one geography and one day-trip choice. The page should help buyers decide whether they want engineering context, water recreation, or both.",
    },
    {
      title: "Why this matters in the Vegas graph",
      body: "Lake Mead gives the Vegas ecosystem a water-recreation pillar that balances the canyon and casino-heavy parts of the site. That helps both SEO breadth and real itinerary logic.",
    },
  ],
  faq: [
    {
      q: "Is Lake Mead worth visiting from Las Vegas?",
      a: "Yes. Lake Mead is one of the best outdoor alternatives to casino-heavy Vegas planning, especially for travelers who want boating, kayaking, or a softer scenic recreation day.",
    },
    {
      q: "Can I combine Lake Mead and Hoover Dam?",
      a: "Yes. Those two routes pair naturally because they sit in the same geography and often appeal to the same day-trip buyer.",
    },
    {
      q: "Is Lake Mead better than a canyon day trip?",
      a: "Lake Mead is better when the buyer wants recreation and water focus. Grand Canyon and Valley of Fire are stronger when the goal is a bigger landscape spectacle.",
    },
  ],
  relatedLinks: [
    {
      href: "/vegas",
      title: "Back to Las Vegas hub",
      body: "Return to the main Vegas authority page for broader planning across shows, nightlife, and outdoor routes.",
    },
    {
      href: "/hoover-dam",
      title: "Hoover Dam pillar",
      body: "Cross-link directly because Lake Mead and Hoover Dam often function as one combined decision in real Vegas trip planning.",
    },
    {
      href: "/helicopter-tours",
      title: "Helicopter tours hub",
      body: "Use the premium aerial category when the buyer wants scenic value without turning the day into a water-led route.",
    },
    {
      href: "/las-vegas/best-day-trips",
      title: "Best day trips from Las Vegas",
      body: "Use the Vegas spoke if the buyer is still comparing Lake Mead against the rest of the desert and canyon stack.",
    },
  ],
  lastModified: "2026-03-12",
};
