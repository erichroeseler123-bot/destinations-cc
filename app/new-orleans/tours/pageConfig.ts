import type { NetworkCommercialPageConfig } from "@/app/components/network/types";
import { buildSwampPlanHref } from "@/lib/dcc/warmTransfer";

export const NEW_ORLEANS_TOURS_PATH = "/new-orleans/tours";

const swampDecisionHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "comfort",
  context: "first-time",
  sourcePage: NEW_ORLEANS_TOURS_PATH,
});

const swampPickupHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "pickup",
  context: "no-car",
  sourcePage: NEW_ORLEANS_TOURS_PATH,
});

const airboatDecisionHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "airboat",
  context: "first-time",
  sourcePage: NEW_ORLEANS_TOURS_PATH,
});

const smallBoatDecisionHref = buildSwampPlanHref({
  intent: "compare",
  topic: "swamp-tours",
  subtype: "boat",
  context: "mixed-group",
  sourcePage: NEW_ORLEANS_TOURS_PATH,
});

// Source credit: Library of Congress / Wikimedia Commons. Context image only; not a specific provider photo.
const swampDockImage = {
  src: "/media/corridors/swamp-dock-pickup.webp",
  alt: "Boats staged at a Louisiana marsh dock for a swamp tour departure",
};

export const newOrleansToursPageConfig: NetworkCommercialPageConfig = {
  id: "wno-new-orleans-tours",
  path: NEW_ORLEANS_TOURS_PATH,
  metadata: {
    title: "New Orleans Tours | Swamp Tours, Airboats, Food Tours, Ghost Walks",
    description:
      "Choose New Orleans swamp tours, airboat tours, food tours, ghost walks, private group tours, family-friendly tours, and rainy-day options.",
    keywords: [
      "New Orleans tours",
      "New Orleans swamp tours",
      "New Orleans airboat tours",
      "hotel pickup swamp tour New Orleans",
      "family-friendly New Orleans tours",
      "private New Orleans tours",
    ],
  },
  hero: {
    eyebrow: "New Orleans tours and swamp trips",
    title: "Find your best New Orleans tour day.",
    summary:
      "Choose from swamp tours, airboat rides, hotel pickup options, private group trips, family-friendly ideas, and French Quarter backups without sorting through every listing first.",
    primaryCta: {
      label: "Book swamp pickup",
      href: swampDecisionHref,
      ariaLabel: "Compare New Orleans swamp tours with hotel pickup",
    },
    secondaryCta: {
      label: "Explore tour ideas",
      href: "#what-to-book",
    },
    trustChips: ["Hotel pickup options", "Swamp and bayou tours", "Family-friendly planning", "Rain-friendly backups"],
    media: {
      eyebrow: "Popular starting point",
      title: "Swamp tours are easier when pickup is solved first.",
      body:
        "Start with the tour style, who is going, and whether the group needs hotel pickup. Then choose the best next step before the day fills up.",
      image: swampDockImage,
      rows: [
        { label: "Best for", value: "First-time visitors, no-car groups, and families" },
        { label: "Plan around", value: "Pickup area, weather, timing, and boat style" },
        { label: "Also nearby", value: "Food, ghost, music, and French Quarter tours" },
      ],
    },
  },
  trustStrip: {
    items: [
      {
        id: "hotel-pickup",
        label: "Hotel pickup options",
        body: "Start with pickup if the group is staying in the French Quarter, CBD, or nearby hotel zones.",
      },
      {
        id: "weather",
        label: "Swamp and bayou tours",
        body: "Compare airboat energy against calmer boat styles before choosing the day’s main outdoor trip.",
      },
      {
        id: "family-group",
        label: "Family and group fit",
        body: "Match mixed ages, bachelor and bachelorette groups, reunions, and comfort needs to the right tour style.",
      },
      {
        id: "local-support",
        label: "Rain-friendly backups",
        body: "Keep French Quarter, food, ghost, and shorter city tours visible when weather makes the swamp plan fragile.",
      },
    ],
  },
  decisionBlock: {
    eyebrow: "What should I book?",
    title: "Start with the tour that fits your day.",
    body:
      "If you want the classic outside-the-city experience, start with a swamp tour and decide whether hotel pickup matters. If your day is short or the weather is rough, keep the plan closer to the French Quarter with food, ghost, history, or neighborhood tours.",
    recommendation:
      "Most visitors should choose one signature swamp or airboat tour, then add one easy city tour that does not create another long transfer.",
    supportPoints: ["hotel pickup", "boat style", "weather", "group size"],
    cta: {
      label: "Compare swamp pickup",
      href: swampDecisionHref,
    },
  },
  featuredCards: [
    {
      id: "swamp-hotel-pickup",
      title: "Swamp Tour With Hotel Pickup",
      subtitle:
        "The easiest way to add a Louisiana swamp day when you are staying in the French Quarter, CBD, or nearby hotel zones.",
      category: "Swamp tours",
      destination: "wno",
      image: swampDockImage,
      tags: ["hotel pickup", "swamp tours", "first-time visitors"],
      cta: { label: "Book pickup tour", href: swampPickupHref },
      providerType: "partner_handoff",
      disclosure:
        "Pickup details continue on the swamp-tour booking path. Provider terms apply.",
      decisionReason: "Choose this when transportation is the main thing standing between the group and a swamp tour.",
    },
    {
      id: "airboat-tour",
      title: "Airboat Swamp Tour",
      subtitle:
        "A faster, open-air ride for travelers who want more speed, sound, and open-water energy.",
      category: "Airboat tours",
      destination: "wno",
      tags: ["airboat tours", "open-air ride", "boat type"],
      cta: { label: "Learn airboat fit", href: airboatDecisionHref },
      providerType: "partner_handoff",
      disclosure: "Airboats are not the right fit for every group. Compare boat style before booking.",
      decisionReason: "Pick this when the group wants the high-energy ride, not the quietest or most covered option.",
    },
    {
      id: "small-boat-swamp-tour",
      title: "Small Boat Swamp Tour",
      subtitle:
        "A calmer swamp-tour style for families, mixed-age groups, wildlife viewing, and visitors who want comfort over speed.",
      category: "Swamp tours",
      destination: "wno",
      tags: ["family-friendly", "small boat", "wildlife"],
      cta: { label: "Compare boat styles", href: smallBoatDecisionHref },
      providerType: "partner_handoff",
      disclosure: "Covered or quieter boat options can be a better match when heat, rain, or younger travelers matter.",
      decisionReason: "Choose this when the group wants a smoother day and easier comfort.",
    },
    {
      id: "private-group-tour",
      title: "Private / Group Tour",
      subtitle:
        "For bachelor and bachelorette groups, reunions, team trips, and private parties that need better timing or pickup flexibility.",
      category: "Private groups",
      destination: "wno",
      tags: ["private groups", "custom timing", "fallback"],
      cta: {
        label: "Explore group tours",
        href: "/tours?city=new-orleans&q=private%20group%20tour%20new%20orleans&source_section=wno-featured-groups",
      },
      providerType: "affiliate_fallback",
      disclosure: "This is fallback marketplace coverage, not owned execution. Confirm group terms with the listed provider.",
      decisionReason: "Use this when a standard public-tour schedule is too rigid for the group.",
    },
    {
      id: "rainy-day-fallback",
      title: "Rainy-Day French Quarter Backup",
      subtitle:
        "A lower-transfer plan for short stays, stormy afternoons, and city-first visitors who want to stay near the Quarter.",
      category: "Rainy-day options",
      destination: "wno",
      tags: ["rainy-day options", "French Quarter", "low transfer"],
      cta: { label: "Find backup ideas", href: "/new-orleans/things-to-do" },
      providerType: "affiliate_fallback",
      disclosure: "Use this when weather or travel time makes an outdoor swamp plan fragile.",
      decisionReason: "Choose this when the best move is a walkable city tour, not another outdoor transfer.",
    },
  ],
  categoryGrid: {
    eyebrow: "Plan your day",
    title: "Browse by tour style.",
    body:
      "Start with the experience you want, then choose the booking path or guide that fits your timing, group, and weather.",
    items: [
      {
        id: "swamp-tours",
        title: "New Orleans swamp tours",
        body: "Start here for hotel pickup, boat style, timing, and whether the swamp trip fits your group.",
        cta: { label: "Compare swamp tours", href: swampDecisionHref },
        providerType: "partner_handoff",
      },
      {
        id: "airboat-tours",
        title: "Airboat tours",
        body: "Compare the faster open-air ride against calmer swamp boats before you book.",
        cta: { label: "Learn airboats", href: airboatDecisionHref },
        providerType: "partner_handoff",
      },
      {
        id: "family-friendly",
        title: "Family-friendly tours",
        body: "Use this for mixed ages, comfort needs, daytime timing, and plans that should stay easy.",
        cta: { label: "Open family guide", href: "/new-orleans/family-friendly" },
      },
      {
        id: "food-tours",
        title: "Food tours",
        body: "A city-first path for visitors who want classic dishes, neighborhoods, and a guided tasting route.",
        cta: { label: "Open food guide", href: "/new-orleans/food" },
      },
      {
        id: "french-quarter",
        title: "French Quarter tours",
        body: "The lower-transfer move for first-timers, short stays, history walks, and compact city context.",
        cta: { label: "Open Quarter context", href: "/new-orleans/neighborhoods" },
      },
      {
        id: "ghost-tours",
        title: "Ghost tours",
        body: "Night-walk inventory for groups that want atmosphere, stories, and French Quarter proximity.",
        cta: {
          label: "View fallback options",
          href: "/tours?city=new-orleans&q=new%20orleans%20ghost%20tour&source_section=wno-category-grid",
        },
        providerType: "affiliate_fallback",
      },
      {
        id: "cemetery-tours",
        title: "Cemetery tours",
        body: "Daytime walking tours where heat, access rules, distance, and timing matter.",
        cta: {
          label: "View fallback options",
          href: "/tours?city=new-orleans&q=new%20orleans%20cemetery%20tour&source_section=wno-category-grid",
        },
        providerType: "affiliate_fallback",
      },
      {
        id: "private-group",
        title: "Private and group tours",
        body: "Use when group size, pickup needs, or a custom plan matters more than a standard public tour.",
        cta: {
          label: "View group options",
          href: "/tours?city=new-orleans&q=private%20group%20tour%20new%20orleans&source_section=wno-category-grid",
        },
        providerType: "affiliate_fallback",
      },
      {
        id: "rainy-day",
        title: "Rainy-day options",
        body: "Backup ideas for indoor, covered, shorter, or easier-to-reschedule plans when weather turns.",
        cta: { label: "Find rain backups", href: "/new-orleans/things-to-do" },
      },
    ],
  },
  providerDisclosure: {
    providerType: "mixed",
    label: "Booking paths are labeled before you leave.",
    body:
      "Swamp-tour links may continue to Welcome to the Swamp. Broader tour links may open marketplace options. This page does not claim live availability, final prices, operator ratings, or guaranteed pickup.",
    allowedClaims: [
      "Compare New Orleans swamp tours and airboat tours",
      "Start with hotel pickup when transportation matters",
      "Find city-tour backups for weather or short stays",
      "See when a link opens a broader marketplace option",
    ],
    notClaimed: [
      "Final pickup zone and pickup window",
      "Final tour price and taxes",
      "Provider ratings and reviews",
      "Live availability on this page",
    ],
  },
  stickyMobileCta: {
    enabled: true,
    label: "Book swamp pickup",
    href: swampDecisionHref,
    disclosureLabel: "Provider terms apply.",
    providerType: "partner_handoff",
  },
  footer: {
    eyebrow: "Welcome to New Orleans Tours",
    body:
      "A mobile-first tour storefront for matching New Orleans visitors to swamp, airboat, city, family, private group, and rainy-day options.",
    links: [
      { label: "Swamp tours", href: "/new-orleans/swamp-tours" },
      { label: "Things to do", href: "/new-orleans/things-to-do" },
      { label: "Food guide", href: "/new-orleans/food" },
    ],
  },
};
