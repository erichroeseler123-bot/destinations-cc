import type { AttractionPillarConfig } from "@/app/components/dcc/AttractionPillarTemplate";

export const LAS_VEGAS_STRIP_PILLAR: AttractionPillarConfig = {
  slug: "las-vegas-strip",
  pageUrl: "https://destinationcommandcenter.com/las-vegas-strip",
  eyebrow: "DCC Attraction Pillar",
  title: "Las Vegas Strip hotels, attractions, and nightlife planning",
  description:
    "The Las Vegas Strip is its own planning ecosystem. This pillar covers flagship resorts, attraction density, nightlife routing, and how to structure the Strip so it supports the rest of a Vegas itinerary instead of overwhelming it.",
  placeName: "Las Vegas Strip",
  gridTitle: "Best Las Vegas Strip booking lanes",
  gridDescription:
    "These links focus on the Strip’s strongest commercial categories: flagship attractions, resort experiences, nightlife, observation products, and short-format sightseeing.",
  schemaType: "TouristAttraction",
  highlights: [
    {
      title: "Best for first-time Vegas planning",
      body: "The Strip is the main decision surface for most Vegas buyers because it combines resort choices, attractions, restaurants, nightlife, and show routing in one corridor.",
    },
    {
      title: "Best for cluster-based planning",
      body: "This pillar should help buyers think in Strip clusters rather than one-off attractions: resort zones, night routing, hotel choice, and attraction density.",
    },
    {
      title: "Best for commercial intent",
      body: "The Strip supports a dense mix of monetizable inventory: observation products, resort experiences, night tours, helicopter flights, attractions, and nightlife.",
    },
  ],
  tourFallbacks: [
    { label: "Las Vegas Strip tours", query: "las vegas strip tour" },
    { label: "Las Vegas Strip attractions", query: "las vegas strip attractions" },
    { label: "Las Vegas Strip nightlife experiences", query: "las vegas strip nightlife experience" },
    { label: "Las Vegas observation and skyline rides", query: "las vegas observation wheel skyline ride" },
    { label: "Las Vegas resort experiences", query: "las vegas resort experience" },
    { label: "Las Vegas night sightseeing tours", query: "las vegas night sightseeing tour" },
  ],
  sections: [
    {
      title: "Hotels, anchor resorts, and Strip zones",
      body: "The Strip is easier to understand when it is broken into anchor resort clusters and energy profiles rather than one endless corridor. Buyers care about where they sleep because it shapes the entire trip’s transfer friction.",
    },
    {
      title: "Attractions and short-format sightseeing",
      body: "Some visitors want big-ticket attractions, others want easy observation products, and others just want a sightseeing layer to pair with dinner or a show. Those should be treated as commercial sublanes, not generic things-to-do text.",
    },
    {
      title: "Nightlife and evening routing",
      body: "The Strip is also the city’s strongest nightlife and evening-planning node. This page should clarify whether the buyer wants clubs, lounges, a single iconic show, or a more relaxed resort night.",
    },
    {
      title: "Why the Strip should be a standalone pillar",
      body: "Vegas is too big to flatten into one page. The Strip deserves its own authority node because it carries enough search demand, inventory depth, and itinerary influence to act like a destination inside the destination.",
    },
  ],
  faq: [
    {
      q: "What is the best part of the Las Vegas Strip to stay on?",
      a: "It depends on whether the buyer prioritizes flagship resorts, nightlife access, or easier movement. The middle Strip usually gives first-timers the cleanest overall access to the main Vegas experience.",
    },
    {
      q: "Is the Las Vegas Strip walkable?",
      a: "Parts of it are, but the Strip is longer and slower-moving than many first-time visitors expect. Good planning still matters because resort-to-resort movement takes time.",
    },
    {
      q: "Should I plan my whole Vegas trip around the Strip?",
      a: "Usually no. The Strip should anchor the trip, but the strongest Vegas itineraries still leave room for Fremont, a desert day trip, or one outdoor block.",
    },
  ],
  relatedLinks: [
    {
      href: "/vegas",
      title: "Back to Las Vegas hub",
      body: "Return to the city authority page for the wider Vegas route plan across day trips, shows, and nightlife.",
    },
    {
      href: "/las-vegas/shows",
      title: "Las Vegas shows hub",
      body: "Jump into the live-performance lane for residencies, comedy, magic, and other Strip-night inventory.",
    },
    {
      href: "/helicopter-tours",
      title: "Helicopter tours hub",
      body: "Use the aerial category when the buyer wants a premium Strip-night spectacle instead of another ground attraction.",
    },
    {
      href: "/las-vegas/best-day-trips",
      title: "Best day trips from Las Vegas",
      body: "Cross-link to the desert and canyon spoke so Strip-first planners can still break the trip up with one strong daytime escape.",
    },
    {
      href: "/hotels-near/fountains-of-bellagio",
      title: "Hotels near Fountains of Bellagio",
      body: "Use the relationship page when Bellagio fountains are the real anchor and the lodging decision is about walkability and central Strip access.",
    },
    {
      href: "/hotels-near/caesars-palace-casino",
      title: "Hotels near Caesars Palace Casino",
      body: "Compare nearby mid-Strip stays when Caesars is the anchor and hotel choice is still open.",
    },
    {
      href: "/hotels-near/wynn-casino",
      title: "Hotels near Wynn Casino",
      body: "Branch into north Strip stay planning when the trip is clustering around Wynn, Encore, and luxury-night routing.",
    },
  ],
  lastModified: "2026-03-12",
};
