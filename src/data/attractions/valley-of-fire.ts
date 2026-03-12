import type { AttractionPillarConfig } from "@/app/components/dcc/AttractionPillarTemplate";

export const VALLEY_OF_FIRE_PILLAR: AttractionPillarConfig = {
  slug: "valley-of-fire",
  pageUrl: "https://destinationcommandcenter.com/valley-of-fire",
  eyebrow: "DCC Attraction Pillar",
  title: "Valley of Fire tours, routes, and Las Vegas day-trip planning",
  description:
    "Valley of Fire is one of the strongest desert day trips from Las Vegas. This pillar covers scenic routes, hiking and photo stops, ATV and combo inventory, and when Valley of Fire beats Red Rock or Hoover Dam for a full daytime block.",
  placeName: "Valley of Fire",
  gridTitle: "Best Valley of Fire booking lanes",
  gridDescription:
    "These links focus on Valley of Fire’s strongest booking categories: scenic state-park tours, hiking and photo routes, ATV and combo inventory, and Vegas desert day trips.",
  schemaType: "TouristAttraction",
  highlights: [
    {
      title: "Best for full desert scenery",
      body: "Valley of Fire works best when the buyer wants a more dramatic desert day than Red Rock without jumping all the way to Grand Canyon scale.",
    },
    {
      title: "Best for photo and landscape buyers",
      body: "This pillar can capture scenic-state-park intent, photography interest, guided hikes, and desert combo inventory from Las Vegas.",
    },
    {
      title: "Best for broader day-trip positioning",
      body: "Valley of Fire belongs in the same Las Vegas day-trip cluster as Hoover Dam, Red Rock, and helicopter products because buyers actively compare them.",
    },
  ],
  tourFallbacks: [
    { label: "Valley of Fire tours from Las Vegas", query: "valley of fire tour from las vegas" },
    { label: "Valley of Fire state park tours", query: "valley of fire state park tour" },
    { label: "Valley of Fire guided hikes", query: "valley of fire guided hike" },
    { label: "Valley of Fire photo tours", query: "valley of fire photography tour" },
    { label: "Valley of Fire ATV and desert combos", query: "valley of fire atv desert tour" },
    { label: "Las Vegas scenic desert day trips", query: "las vegas scenic desert day trip" },
  ],
  sections: [
    {
      title: "From Las Vegas as a dedicated daytime block",
      body: "Valley of Fire is usually a better answer than generic desert browsing because it feels like a real landscape destination, not just an extra stop. It belongs in a full day-trip comparison set, not buried under city-attractions copy.",
    },
    {
      title: "Scenic drives, hikes, and photo-first routes",
      body: "Some visitors want a scenic loop with easy stops, others want trail time, and others want a visual desert product for photography or celebration travel. That is why Valley of Fire should branch into multiple intent lanes instead of one flat attraction page.",
    },
    {
      title: "How it compares to Red Rock and Hoover Dam",
      body: "Valley of Fire is usually the more dramatic pure-desert answer than Red Rock, while Hoover Dam is the easier history-and-engineering route. The right choice depends on how much driving, hiking, and scenery commitment the buyer wants.",
    },
    {
      title: "Why this matters in the Vegas graph",
      body: "Valley of Fire strengthens the entire Vegas day-trip cluster. It gives the city a true landscape pillar between shorter close-in outdoor products and longer flagship canyon products.",
    },
  ],
  faq: [
    {
      q: "Is Valley of Fire worth doing from Las Vegas?",
      a: "Yes. Valley of Fire is one of the strongest scenic desert day trips from Las Vegas because the landscape payoff is high and the product fits naturally into guided half-day and full-day routes.",
    },
    {
      q: "How long does Valley of Fire take from Las Vegas?",
      a: "It usually works best as a protected daytime block rather than a quick add-on. That gives enough room for scenic stops, light hiking, and a cleaner route pace.",
    },
    {
      q: "Should I choose Valley of Fire or Red Rock Canyon?",
      a: "Choose Valley of Fire for a stronger all-day desert landscape feel. Choose Red Rock Canyon if you want a closer outdoor block that is easier to pair with the rest of a Vegas schedule.",
    },
  ],
  relatedLinks: [
    {
      href: "/vegas",
      title: "Back to Las Vegas hub",
      body: "Return to the city authority page for broader planning across shows, nightlife, and day-trip routing.",
    },
    {
      href: "/las-vegas/best-day-trips",
      title: "Best day trips from Las Vegas",
      body: "Use the Vegas spoke if the buyer is still comparing Valley of Fire against Grand Canyon, Hoover Dam, and Red Rock.",
    },
    {
      href: "/red-rock-canyon",
      title: "Red Rock Canyon pillar",
      body: "Cross-link directly because these two outdoor products answer similar questions with different time and scenery profiles.",
    },
    {
      href: "/hoover-dam",
      title: "Hoover Dam pillar",
      body: "Link into the easier engineering/history excursion when the buyer wants a simpler first day trip from Vegas.",
    },
  ],
  lastModified: "2026-03-12",
};
