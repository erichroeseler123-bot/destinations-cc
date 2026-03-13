import type { AttractionPillarConfig } from "@/app/components/dcc/AttractionPillarTemplate";
import { buildLocalImageAsset } from "@/src/lib/media-resolver";
import { getFeaturedTourProductsAsViatorProducts } from "@/src/data/featured-tour-products";

export const HELICOPTER_TOURS_PILLAR: AttractionPillarConfig = {
  slug: "helicopter-tours",
  pageUrl: "https://destinationcommandcenter.com/helicopter-tours",
  eyebrow: "DCC Category Pillar",
  title: "Helicopter tours from Las Vegas, Grand Canyon, and Hoover Dam",
  description:
    "Helicopter tours deserve their own category hub because they are one of the highest-ticket, highest-intent travel products in the DCC graph. This page connects Vegas Strip flights, Grand Canyon scenic routes, Hoover Dam aerial options, and premium celebration inventory.",
  placeName: "Helicopter tours",
  gridTitle: "Best helicopter booking lanes",
  gridDescription:
    "These routes isolate the highest-converting helicopter categories: Las Vegas Strip flights, Grand Canyon scenic products, Hoover Dam aerial tours, and premium celebration inventory.",
  schemaType: "CollectionPage",
  heroImage: buildLocalImageAsset(
    "/images/helicopter-tours/hero.svg",
    "Helicopter tours over Las Vegas and canyon country concept artwork",
  ),
  gallery: [
    buildLocalImageAsset("/images/helicopter-tours/strip-flight.svg", "Las Vegas Strip helicopter flight concept artwork"),
    buildLocalImageAsset("/images/helicopter-tours/canyon-landing.svg", "Grand Canyon helicopter landing concept artwork"),
    buildLocalImageAsset("/images/helicopter-tours/hoover-aerial.svg", "Hoover Dam helicopter tour concept artwork"),
    buildLocalImageAsset("/images/helicopter-tours/sunset-flight.svg", "Sunset helicopter flight concept artwork"),
  ],
  highlights: [
    {
      title: "Best for premium spend",
      body: "Helicopter inventory is a high-ticket lane where buyers are usually optimizing for spectacle and time, not just the lowest price.",
    },
    {
      title: "Best for shorter stays",
      body: "These products compress big scenic value into a smaller time block than full overland day trips, which makes them ideal for tighter itineraries.",
    },
    {
      title: "Best for destination cross-links",
      body: "The category naturally bridges Las Vegas, Grand Canyon, and Hoover Dam, which makes it a strong pillar for internal graph density.",
    },
  ],
  realityCheckSummary: [
    "The cheapest helicopter product is not always the best fit if the real goal is city spectacle or canyon scale.",
    "Weather, visibility, and check-in timing can materially change the experience.",
    "Flight time and total time on the ground are not the same thing, especially for premium products.",
  ],
  realityCheckEvidence: [
    {
      title: "Las Vegas Strip helicopter night flight reality check",
      url: "https://www.youtube.com/watch?v=lH7sQm6f9Uk",
      source: "Recent traveler vlog",
      type: "video",
      whyItMatters:
        "Useful for understanding how much of the experience is check-in, loading, and actual city-flight time instead of assuming the whole block is air time.",
      tags: ["night flights", "timing", "city views"],
    },
    {
      title: "Grand Canyon helicopter landing experience from Las Vegas",
      url: "https://www.youtube.com/watch?v=8W0cXn4f2fY",
      source: "Traveler footage",
      type: "video",
      whyItMatters:
        "Shows the premium scenic version of the canyon day so buyers can compare it directly against coach products and shorter Strip flights.",
      tags: ["premium", "canyon", "landing"],
    },
    {
      title: "FAA weather and aviation conditions",
      url: "https://www.faa.gov/",
      source: "Official aviation source",
      type: "official-notice",
      whyItMatters:
        "Best used as a utility check when wind, visibility, or aviation conditions can change a helicopter day more than a standard bus excursion.",
      tags: ["weather", "official", "aviation"],
    },
  ],
  featuredProducts: getFeaturedTourProductsAsViatorProducts("las-vegas", "helicopter-tours"),
  productGuidance: [
    {
      title: "Best city spectacle",
      body: "Strip night flights are the cleanest first helicopter buy when the traveler wants maximum Vegas identity in a short block.",
    },
    {
      title: "Best scenic premium",
      body: "Grand Canyon helicopter routes are the strongest spend-up option when the buyer wants canyon scale without a full overland day.",
    },
    {
      title: "Best celebration route",
      body: "Sunset, VIP, and landing options work best for anniversary, proposal, and milestone-trip buyers.",
    },
  ],
  tourFallbacks: [
    { label: "Las Vegas Strip helicopter tours", query: "las vegas strip helicopter tour" },
    { label: "Grand Canyon helicopter tours", query: "grand canyon helicopter tour from las vegas" },
    { label: "Hoover Dam helicopter tours", query: "hoover dam helicopter tour" },
    { label: "Luxury helicopter flights from Las Vegas", query: "luxury helicopter tour las vegas" },
    { label: "Sunset and night helicopter rides", query: "las vegas sunset night helicopter ride" },
    { label: "Landing helicopter experiences", query: "grand canyon helicopter landing tour" },
  ],
  sections: [
    {
      title: "Las Vegas Strip flights",
      body: "The shortest-form commercial helicopter answer is usually the Strip flight: high spectacle, easier scheduling, and a cleaner pairing with dinner or a show than a full desert day.",
    },
    {
      title: "Grand Canyon helicopter products",
      body: "Grand Canyon aerial routes are the premium scenic answer. They matter because they convert buyers who want canyon scale without sacrificing an entire day to highway time.",
    },
    {
      title: "Hoover Dam and nearby aerial inventory",
      body: "Hoover Dam helicopter inventory is smaller than the canyon lane, but it matters because it gives the shorter excursion category a premium version instead of forcing every high-ticket buyer into the canyon branch.",
    },
    {
      title: "Category logic inside the DCC graph",
      body: "Helicopter tours should not live only inside city pages. They are a reusable category node that can connect cities, attractions, and premium booking behavior across the wider destination graph.",
    },
  ],
  faq: [
    {
      q: "Are helicopter tours worth it?",
      a: "Yes for the right buyer. Helicopter tours are usually strongest for shorter trips, premium budgets, and travelers who value cleaner logistics and bigger scenic payoff over road mileage.",
    },
    {
      q: "What is the best helicopter tour from Las Vegas?",
      a: "Strip flights are the easiest city spectacle product, while Grand Canyon helicopter routes are the strongest premium scenic product. The right answer depends on time, price tolerance, and whether the buyer wants city or canyon focus.",
    },
    {
      q: "Should I book helicopter tours in advance?",
      a: "Usually yes. Helicopter inventory is one of the cleaner premium upsells in the Vegas ecosystem, and the best departure windows often tighten faster than standard coach-tour inventory.",
    },
  ],
  relatedLinks: [
    {
      href: "/las-vegas/helicopter-tours",
      title: "Las Vegas helicopter spoke",
      body: "Use the city-specific helicopter hub for Strip-night and Vegas-origin aerial buyers.",
    },
    {
      href: "/grand-canyon",
      title: "Grand Canyon pillar",
      body: "The canyon pillar is the stronger authority page for buyers already focused on rim choice or Skywalk routes.",
    },
    {
      href: "/hoover-dam",
      title: "Hoover Dam pillar",
      body: "This connects the premium aerial lane back to a shorter, easier day-trip ecosystem.",
    },
    {
      href: "/vegas",
      title: "Back to Las Vegas hub",
      body: "Return to the city authority page for broader planning across shows, day trips, and route logic.",
    },
  ],
  lastModified: "2026-03-12",
};
