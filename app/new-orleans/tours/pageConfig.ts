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
    eyebrow: "New Orleans tours, swamp rides, and Quarter nights",
    title: "Book the New Orleans day that feels like a story.",
    summary:
      "Start with the classic swamp trip, add the right city backup, and keep the whole day easy for your group.",
    primaryCta: {
      label: "Book swamp pickup",
      href: swampDecisionHref,
      ariaLabel: "Compare New Orleans swamp tours with hotel pickup",
    },
    secondaryCta: {
      label: "See popular tours",
      href: "#what-to-book",
    },
    trustChips: ["Hotel pickup options", "Airboats and bayou rides", "Family and group picks", "French Quarter backups"],
    media: {
      eyebrow: "Classic first pick",
      title: "Start with the swamp, then build the night.",
      body:
        "Choose the ride style, check pickup fit, and leave room for food, music, ghosts, or a low-transfer Quarter plan.",
      image: swampDockImage,
      rows: [
        { label: "Best for", value: "First-timers, no-car groups, families" },
        { label: "Check first", value: "Pickup zone, boat style, weather" },
        { label: "Pair it with", value: "Food, music, ghost, Quarter walks" },
      ],
    },
  },
  trustStrip: {
    items: [
      {
        id: "hotel-pickup",
        label: "Pickup made easier",
        body: "Start with pickup if you are staying in the French Quarter, CBD, or nearby hotel zones.",
      },
      {
        id: "weather",
        label: "Real swamp energy",
        body: "Compare airboat speed against calmer bayou boats before choosing the main outdoor trip.",
      },
      {
        id: "family-group",
        label: "Group-fit picks",
        body: "Match families, couples, bachelor and bachelorette groups, reunions, and comfort needs.",
      },
      {
        id: "local-support",
        label: "Bad-weather backup",
        body: "Keep French Quarter, food, ghost, and shorter city tours ready when storms change the day.",
      },
    ],
  },
  decisionBlock: {
    eyebrow: "What should I book?",
    title: "Pick the headline tour, then keep the rest simple.",
    body:
      "If you want the classic outside-the-city experience, start with a swamp tour and decide whether hotel pickup matters. If your day is short or the weather is rough, keep the plan closer to the French Quarter.",
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
        "The low-friction classic: bayou scenery, boat time, and transportation handled before your day gets crowded.",
      category: "Swamp tours",
      destination: "wno",
      image: swampDockImage,
      tags: ["hotel pickup", "swamp tours", "first-time visitors"],
      cta: { label: "Book pickup tour", href: swampPickupHref },
      providerType: "partner_handoff",
      disclosure:
        "Pickup details continue on the swamp-tour booking path. Provider terms apply.",
      decisionReason: "Best for first-timers and no-car groups that want the signature swamp day without solving transport twice.",
    },
    {
      id: "airboat-tour",
      title: "Airboat Swamp Tour",
      subtitle:
        "Louder, faster, more wind-in-your-face. This is the high-energy swamp move when the group wants a ride.",
      category: "Airboat tours",
      destination: "wno",
      tags: ["airboat tours", "open-air ride", "boat type"],
      cta: { label: "Compare airboats", href: airboatDecisionHref },
      providerType: "partner_handoff",
      disclosure: "Airboats are not the right fit for every group. Compare boat style before booking.",
      decisionReason: "Best for travelers who want the ride to be part of the memory, not just the transportation.",
    },
    {
      id: "small-boat-swamp-tour",
      title: "Small Boat Swamp Tour",
      subtitle:
        "A calmer bayou day for families, mixed-age groups, wildlife watching, and anyone choosing comfort over speed.",
      category: "Swamp tours",
      destination: "wno",
      tags: ["family-friendly", "small boat", "wildlife"],
      cta: { label: "Compare boat styles", href: smallBoatDecisionHref },
      providerType: "partner_handoff",
      disclosure: "Covered or quieter boat options can be a better match when heat, rain, or younger travelers matter.",
      decisionReason: "Best when shade, pace, conversation, and easier group comfort matter more than speed.",
    },
    {
      id: "private-group-tour",
      title: "Private / Group Tour",
      subtitle:
        "For parties, reunions, team trips, and groups that need timing, pickup, or privacy to fit the day.",
      category: "Private groups",
      destination: "wno",
      tags: ["private groups", "custom timing", "fallback"],
      cta: {
        label: "Explore group tours",
        href: "/tours?city=new-orleans&q=private%20group%20tour%20new%20orleans&source_section=wno-featured-groups",
      },
      providerType: "affiliate_fallback",
      disclosure: "This is fallback marketplace coverage, not owned execution. Confirm group terms with the listed provider.",
      decisionReason: "Best when a public-tour schedule feels too tight or the group needs a cleaner meet-up plan.",
    },
    {
      id: "rainy-day-fallback",
      title: "Rainy-Day French Quarter Backup",
      subtitle:
        "Food, ghosts, history, music, and walkable Quarter options for stormy afternoons or short stays.",
      category: "Rainy-day options",
      destination: "wno",
      tags: ["rainy-day options", "French Quarter", "low transfer"],
      cta: { label: "Find backup ideas", href: "/new-orleans/things-to-do" },
      providerType: "affiliate_fallback",
      disclosure: "Use this when weather or travel time makes an outdoor swamp plan fragile.",
      decisionReason: "Best when the smart move is staying close, dry, and walkable instead of forcing another outdoor transfer.",
    },
  ],
  categoryGrid: {
    eyebrow: "More ways to play it",
    title: "Choose your New Orleans lane.",
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
