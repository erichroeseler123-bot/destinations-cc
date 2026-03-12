import type { AttractionPillarConfig } from "@/app/components/dcc/AttractionPillarTemplate";
import { buildLocalImageAsset } from "@/src/lib/media-resolver";

export const HOOVER_DAM_PILLAR: AttractionPillarConfig = {
  slug: "hoover-dam",
  pageUrl: "https://destinationcommandcenter.com/hoover-dam",
  eyebrow: "DCC Attraction Pillar",
  title: "Hoover Dam tours, history, and Las Vegas visitor planning",
  description:
    "Hoover Dam is one of the cleanest first day-trip decisions from Las Vegas. This pillar covers history, engineering appeal, visitor routing, combo-tour logic, and why it often converts better than bigger but harder desert products.",
  placeName: "Hoover Dam",
  gridTitle: "Best Hoover Dam booking lanes",
  gridDescription:
    "These links focus on Hoover Dam’s strongest commercial patterns: express half-day routes, combo day trips, engineering/history tours, and helicopter add-ons from Las Vegas.",
  schemaType: "LandmarksOrHistoricalBuildings",
  heroImage: buildLocalImageAsset("/images/hoover-dam/hero.svg", "Hoover Dam and Black Canyon concept artwork"),
  gallery: [
    buildLocalImageAsset("/images/hoover-dam/engineering.svg", "Hoover Dam engineering concept artwork"),
    buildLocalImageAsset("/images/hoover-dam/lake-mead.svg", "Lake Mead and Hoover Dam concept artwork"),
    buildLocalImageAsset("/images/hoover-dam/visitor-route.svg", "Hoover Dam visitor route concept artwork"),
    buildLocalImageAsset("/images/hoover-dam/aerial.svg", "Hoover Dam aerial tour concept artwork"),
  ],
  highlights: [
    {
      title: "Best for one-day efficiency",
      body: "Hoover Dam is usually the easiest major excursion from Las Vegas because the transit burden is lighter than full canyon routes.",
    },
    {
      title: "Best for history plus engineering",
      body: "This pillar can capture both sightseeing intent and deeper history/engineering curiosity, which gives it more authority value than a simple attraction card.",
    },
    {
      title: "Best for combo products",
      body: "Hoover Dam pairs naturally with Grand Canyon and Lake Mead inventory, which makes it a strong cross-linking node in the Vegas trip graph.",
    },
  ],
  tourFallbacks: [
    { label: "Hoover Dam tours from Las Vegas", query: "hoover dam tour from las vegas" },
    { label: "Hoover Dam express half-day tours", query: "hoover dam express half day tour" },
    { label: "Hoover Dam and Grand Canyon combo tours", query: "hoover dam grand canyon combo tour" },
    { label: "Hoover Dam helicopter tours", query: "hoover dam helicopter tour from las vegas" },
    { label: "Lake Mead and Hoover Dam tours", query: "lake mead hoover dam tour" },
    { label: "Hoover Dam history and engineering tours", query: "hoover dam engineering history tour" },
  ],
  sections: [
    {
      title: "Driving from Las Vegas",
      body: "Hoover Dam wins because it is close enough to protect the rest of the itinerary. That makes it one of the strongest first-tour decisions for buyers who still want the evening open.",
    },
    {
      title: "History and engineering authority",
      body: "Unlike many simple sightseeing stops, Hoover Dam has a real authority layer: New Deal history, engineering scale, and Lake Mead context. That makes it worth treating as a pillar, not just a supporting stop.",
    },
    {
      title: "Visitor guide and route fit",
      body: "The page should answer whether the buyer wants a quick express route, a fuller visitor-center style experience, or a combo product that packages Hoover Dam inside a bigger desert day.",
    },
    {
      title: "Lake Mead and combo inventory",
      body: "Hoover Dam is stronger when it links to adjacent intent: Lake Mead, Grand Canyon combo routes, and helicopter upgrades. Those are not side notes; they are core booking behaviors.",
    },
  ],
  faq: [
    {
      q: "Is Hoover Dam worth doing from Las Vegas?",
      a: "Yes. Hoover Dam is one of the easiest high-signal day trips from Las Vegas because travel time is shorter and the product fits cleanly around the rest of the itinerary.",
    },
    {
      q: "How long does a Hoover Dam tour take?",
      a: "Express products are usually the cleanest fit for shorter stays, while combo routes take longer and work better when the day is dedicated primarily to desert sightseeing.",
    },
    {
      q: "Should I do Hoover Dam or Grand Canyon first?",
      a: "Hoover Dam is usually the easier first excursion from Las Vegas. Grand Canyon is bigger as a scenic commitment, but it costs more time and requires stronger schedule protection.",
    },
  ],
  relatedLinks: [
    {
      href: "/vegas",
      title: "Back to Las Vegas hub",
      body: "Return to the city authority page for shows, tours, and broader itinerary planning.",
    },
    {
      href: "/las-vegas/best-day-trips",
      title: "Best day trips from Las Vegas",
      body: "Use the Vegas spoke if the buyer is still comparing Hoover Dam against Grand Canyon, Valley of Fire, or Red Rock.",
    },
    {
      href: "/grand-canyon",
      title: "Grand Canyon pillar",
      body: "Cross-link directly because the two products often overlap in package and combo-tour demand.",
    },
    {
      href: "/helicopter-tours",
      title: "Helicopter tours hub",
      body: "Jump into the premium aerial category when the buyer wants a higher-ticket scenic version of the route.",
    },
  ],
  lastModified: "2026-03-12",
};
