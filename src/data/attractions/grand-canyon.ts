import type { AttractionPillarConfig } from "@/app/components/dcc/AttractionPillarTemplate";

export const GRAND_CANYON_PILLAR: AttractionPillarConfig = {
  slug: "grand-canyon",
  pageUrl: "https://destinationcommandcenter.com/grand-canyon",
  eyebrow: "DCC Attraction Pillar",
  title: "Grand Canyon tours, rims, and Las Vegas route planning",
  description:
    "Grand Canyon is not one trip. This pillar is for the big decisions: West Rim vs South Rim, visiting from Las Vegas, helicopter upgrades, Skywalk demand, and which route actually fits a real schedule.",
  placeName: "Grand Canyon",
  gridTitle: "Best Grand Canyon booking lanes",
  gridDescription:
    "These links focus on the highest-intent Grand Canyon categories: West Rim tours, South Rim day trips, Skywalk routes, and helicopter upgrades from Las Vegas.",
  schemaType: "TouristAttraction",
  heroImage: {
    src: "/images/grand-canyon/hero.svg",
    alt: "Grand Canyon sunrise panorama concept artwork",
  },
  gallery: [
    {
      src: "/images/grand-canyon/west-rim.svg",
      alt: "Grand Canyon West Rim concept artwork",
    },
    {
      src: "/images/grand-canyon/south-rim.svg",
      alt: "Grand Canyon South Rim concept artwork",
    },
    {
      src: "/images/grand-canyon/skywalk.svg",
      alt: "Grand Canyon Skywalk concept artwork",
    },
    {
      src: "/images/grand-canyon/helicopter.svg",
      alt: "Grand Canyon helicopter tour concept artwork",
    },
  ],
  highlights: [
    {
      title: "Best for first-timers",
      body: "West Rim usually wins for simpler Las Vegas routing, while South Rim fits buyers who care more about classic canyon scale than shorter transfer time.",
    },
    {
      title: "Best for premium spend",
      body: "Helicopter and landing products convert best when time matters more than road mileage and the buyer already wants a scenic anchor.",
    },
    {
      title: "Best for authority depth",
      body: "Grand Canyon supports separate subclusters around rims, Skywalk, helicopter products, rafting, and Vegas-origin day-trip planning.",
    },
  ],
  tourFallbacks: [
    { label: "Grand Canyon tours from Las Vegas", query: "grand canyon tour from las vegas" },
    { label: "Grand Canyon West Rim tours", query: "grand canyon west rim tour" },
    { label: "Grand Canyon South Rim day trips", query: "grand canyon south rim day tour" },
    { label: "Grand Canyon helicopter tours", query: "grand canyon helicopter tour from las vegas" },
    { label: "Grand Canyon Skywalk tours", query: "grand canyon skywalk tour from las vegas" },
    { label: "Grand Canyon rafting and adventure tours", query: "grand canyon rafting and adventure tour" },
  ],
  sections: [
    {
      title: "West Rim vs South Rim",
      body: "West Rim is the cleaner Vegas-origin commercial product because transfer time is shorter and Skywalk inventory is easier to package. South Rim carries more classic canyon authority but requires a bigger time commitment.",
    },
    {
      title: "Visiting from Las Vegas",
      body: "For Vegas buyers, Grand Canyon is a day-trip ecosystem, not one attraction. The practical question is how much road time, departure discipline, and evening recovery your itinerary can tolerate.",
    },
    {
      title: "Helicopter, bus, and combo decisions",
      body: "Helicopter products are usually the cleanest premium upsell. Bus and coach routes fit value buyers better. Combo products work when the buyer wants Skywalk or Hoover Dam wrapped into one commercial day.",
    },
    {
      title: "Skywalk, viewpoints, and route fit",
      body: "Skywalk belongs in the West Rim branch, while classic viewpoints and longer scenic commitment lean South Rim. Keep those intent lanes separate so the page answers real booking questions instead of mixing every canyon query together.",
    },
  ],
  faq: [
    {
      q: "What is the best Grand Canyon tour from Las Vegas?",
      a: "The best route depends on time budget and product type. West Rim is usually the easiest commercial day trip from Las Vegas, while helicopter products work best for shorter stays and higher budgets.",
    },
    {
      q: "Is Grand Canyon a day trip from Las Vegas?",
      a: "Yes, but only if the itinerary protects a full day block. Grand Canyon is one of the strongest Vegas day-trip categories precisely because buyers plan around it as the main daytime commitment.",
    },
    {
      q: "Should I choose West Rim or South Rim?",
      a: "West Rim usually fits Vegas-origin convenience better. South Rim is the stronger scenic and classic-national-park answer when the buyer accepts a longer day.",
    },
  ],
  relatedLinks: [
    {
      href: "/vegas",
      title: "Back to Las Vegas hub",
      body: "Return to the city authority page for shows, nightlife, and the broader Vegas route plan.",
    },
    {
      href: "/las-vegas/best-day-trips",
      title: "Best day trips from Las Vegas",
      body: "Use the commercial Vegas spoke if the buyer is still comparing Grand Canyon against Hoover Dam and other desert routes.",
    },
    {
      href: "/helicopter-tours",
      title: "Helicopter tours hub",
      body: "Jump to the higher-ticket aerial category when the buyer already wants premium scenic inventory.",
    },
    {
      href: "/hoover-dam",
      title: "Hoover Dam pillar",
      body: "Grand Canyon and Hoover Dam overlap heavily in combo itineraries and should cross-link directly.",
    },
    {
      href: "/national-parks/grand-canyon",
      title: "Grand Canyon national park guide",
      body: "Use the national-parks route for a more park-first authority angle instead of a Vegas-origin commercial one.",
    },
  ],
  lastModified: "2026-03-12",
};
