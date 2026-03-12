import type { AttractionPillarConfig } from "@/app/components/dcc/AttractionPillarTemplate";

export const RED_ROCK_CANYON_PILLAR: AttractionPillarConfig = {
  slug: "red-rock-canyon",
  pageUrl: "https://destinationcommandcenter.com/red-rock-canyon",
  eyebrow: "DCC Attraction Pillar",
  title: "Red Rock Canyon tours, hiking, and Las Vegas route planning",
  description:
    "Red Rock Canyon is one of the easiest outdoor upgrades from Las Vegas. This pillar covers scenic loop planning, hiking and climbing intent, half-day tour fit, and when Red Rock beats bigger all-day desert products.",
  placeName: "Red Rock Canyon",
  gridTitle: "Best Red Rock Canyon booking lanes",
  gridDescription:
    "These links focus on Red Rock’s strongest booking categories: scenic loop tours, guided hikes, rock and canyon outings, and Vegas half-day desert inventory.",
  schemaType: "TouristAttraction",
  highlights: [
    {
      title: "Best for half-day outdoor time",
      body: "Red Rock Canyon usually beats longer desert products when the buyer wants real scenery without giving up the whole Vegas day.",
    },
    {
      title: "Best for active travelers",
      body: "This pillar can capture scenic-drive visitors, guided hikers, climbing-curious buyers, and travelers trying to break casino-heavy itineraries with a cleaner outdoor block.",
    },
    {
      title: "Best for local route fit",
      body: "Red Rock works because it is close enough to pair with dinner, a show, or a lighter evening plan instead of forcing an all-day commitment.",
    },
  ],
  tourFallbacks: [
    { label: "Red Rock Canyon tours from Las Vegas", query: "red rock canyon tour from las vegas" },
    { label: "Red Rock Canyon scenic loop tours", query: "red rock canyon scenic drive tour" },
    { label: "Red Rock Canyon guided hikes", query: "red rock canyon guided hike" },
    { label: "Red Rock Canyon rock climbing experiences", query: "red rock canyon rock climbing experience" },
    { label: "Las Vegas half-day desert tours", query: "las vegas half day desert tour" },
    { label: "Red Rock Canyon sunset tours", query: "red rock canyon sunset tour from las vegas" },
  ],
  sections: [
    {
      title: "From Las Vegas without burning the whole day",
      body: "Red Rock Canyon is strongest when buyers want an outdoor block that still leaves room for an evening show, dinner reservation, or Strip plan. That is why it deserves its own pillar instead of being buried inside generic day-trip copy.",
    },
    {
      title: "Scenic loop, hiking, and guided route fit",
      body: "Some visitors want a scenic-drive product, others want trail time, and others just need a guided desert answer that feels easier than self-driving. Keep those lanes separate so the page matches real search and booking behavior.",
    },
    {
      title: "Who should choose Red Rock over Grand Canyon",
      body: "Red Rock is the better answer when convenience matters more than bucket-list scale. It is closer, easier, and cleaner for travelers who already have packed Vegas evenings or shorter stays.",
    },
    {
      title: "How it fits the broader Vegas outdoor graph",
      body: "Red Rock should cross-link with Valley of Fire, Hoover Dam, and helicopter products. It sits inside the same Vegas desert ecosystem, but it solves a different time-budget problem.",
    },
  ],
  faq: [
    {
      q: "Is Red Rock Canyon worth doing from Las Vegas?",
      a: "Yes. Red Rock Canyon is one of the best-value outdoor blocks from Las Vegas because it delivers strong scenery without the longer transfer burden of a full canyon day trip.",
    },
    {
      q: "How long do Red Rock Canyon tours take?",
      a: "Many of the strongest products fit into a half-day window, which is exactly why Red Rock works well for visitors protecting the rest of a Vegas itinerary.",
    },
    {
      q: "Should I do Red Rock Canyon or Valley of Fire?",
      a: "Red Rock is usually the easier close-in option from Las Vegas. Valley of Fire feels more like a bigger desert outing and works better when the buyer wants a stronger daytime commitment.",
    },
  ],
  relatedLinks: [
    {
      href: "/vegas",
      title: "Back to Las Vegas hub",
      body: "Return to the main Vegas authority page for shows, nightlife, and broader route planning.",
    },
    {
      href: "/las-vegas/best-day-trips",
      title: "Best day trips from Las Vegas",
      body: "Use the commercial Vegas spoke if the buyer is still comparing Red Rock against Grand Canyon, Hoover Dam, and other desert routes.",
    },
    {
      href: "/valley-of-fire",
      title: "Valley of Fire pillar",
      body: "Cross-link directly because Red Rock and Valley of Fire are natural alternatives in the Vegas outdoor graph.",
    },
    {
      href: "/helicopter-tours",
      title: "Helicopter tours hub",
      body: "Use the premium aerial category when the buyer wants scenic value without ground routing.",
    },
  ],
  lastModified: "2026-03-12",
};
