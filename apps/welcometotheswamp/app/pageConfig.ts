import type { NetworkCommercialPageConfig } from "@/app/components/network/types";
import { buildWtsGetYourGuideSearchHref } from "@/lib/getyourguide";
import { SITE_CONFIG } from "./site-config";

const products = SITE_CONFIG.swampFareHarborProducts;
const asn = SITE_CONFIG.fareharborSwampAsn;
const fhAirboatProduct = products?.find(p => p.type === "airboat");
const fhBoatProduct = products?.find(p => p.type === "boat");

const airboatHref = fhAirboatProduct && asn
  ? (fhAirboatProduct.itemId
      ? `https://fareharbor.com/embeds/book/${fhAirboatProduct.companyShortname}/items/${fhAirboatProduct.itemId}/?asn=${asn}&flow=${fhAirboatProduct.flowId || ""}`
      : `https://fareharbor.com/embeds/book/${fhAirboatProduct.companyShortname}/?asn=${asn}&flow=${fhAirboatProduct.flowId || ""}`)
  : buildWtsGetYourGuideSearchHref("airboat", "wts-storefront-airboat");

const boatHref = fhBoatProduct && asn
  ? (fhBoatProduct.itemId
      ? `https://fareharbor.com/embeds/book/${fhBoatProduct.companyShortname}/items/${fhBoatProduct.itemId}/?asn=${asn}&flow=${fhBoatProduct.flowId || ""}`
      : `https://fareharbor.com/embeds/book/${fhBoatProduct.companyShortname}/?asn=${asn}&flow=${fhBoatProduct.flowId || ""}`)
  : buildWtsGetYourGuideSearchHref("boat", "wts-storefront-covered-boat");

const airboatImage = {
  src: "/images/boat-chooser/airboat.png",
  alt: "An airboat crossing open swamp water",
};

const coveredBoatImage = {
  src: "/images/boat-chooser/covered-boat.png",
  alt: "A covered swamp tour boat moving through Louisiana marsh scenery",
};

const quietSwampImage = {
  src: "/images/boat-chooser/generic-swamp.jpg",
  alt: "Still Louisiana swamp water surrounded by cypress trees",
};

const smallGroupAirboatImage = {
  src: "/images/boat-chooser/small-group-airboat.png",
  alt: "Passengers on a small-group airboat swamp tour",
};

const swampBoatImage = {
  src: "/images/boat-chooser/swamp-boat.png",
  alt: "A swamp tour boat navigating the Louisiana bayou",
};

const hotelPickupSwampImage = {
  src: "/images/boat-chooser/hotel-pickup-swamp-boat.png",
  alt: "Swamp boat tour with hotel pickup service",
};

export const swampStorefrontConfig: NetworkCommercialPageConfig = {
  id: "wts-home",
  path: "/",
  metadata: {
    title: "Welcome to the Swamp | New Orleans Swamp Tours",
    description:
      "Choose the New Orleans swamp tour that fits your day: airboats, calmer covered boats, hotel pickup, family-friendly timing, and weather-smart backup plans.",
    keywords: [
      "New Orleans swamp tours",
      "New Orleans airboat tours",
      "swamp tour with pickup",
      "family swamp tour New Orleans",
    ],
  },
  hero: {
    eyebrow: "New Orleans swamp tours",
    title: "Find the swamp tour that fits your day.",
    summary:
      "Airboat thrill ride, calmer bayou cruise, hotel pickup, or a family-friendly first swamp trip. Start with the feel you want, then book with the right partner.",
    primaryCta: {
      label: "Book an airboat tour",
      href: airboatHref,
      external: true,
      ariaLabel: "Check current New Orleans airboat swamp tour options",
    },
    secondaryCta: {
      label: "Compare boat styles",
      href: "/airboat-vs-boat",
    },
    trustChips: ["Airboat and covered boat picks", "Pickup-aware planning", "Family-fit guidance", "Weather-smart backups"],
    media: {
      eyebrow: "Most popular first choice",
      title: "Airboat if you want the ride. Covered boat if you want the bayou.",
      body:
        "The right tour depends on noise, shade, pickup, group age, and how much of the day you want to spend outside the city.",
      image: quietSwampImage,
      rows: [
        { label: "Thrill", value: "Airboat" },
        { label: "Comfort", value: "Covered boat" },
        { label: "Easy start", value: "Pickup options" },
      ],
    },
  },
  trustStrip: {
    items: [
      {
        id: "pickup",
        label: "Pickup-aware",
        body: "Start with transport if you are staying in the French Quarter, CBD, or a nearby hotel.",
      },
      {
        id: "boat-style",
        label: "Choose the ride feel",
        body: "Compare airboat speed with calmer covered boats before opening the booking page.",
      },
      {
        id: "family-fit",
        label: "Group-fit planning",
        body: "Good for families, couples, bachelorette groups, reunions, and mixed-age trips.",
      },
      {
        id: "weather",
        label: "Weather reality",
        body: "Know when shade, rain, heat, and timing should push you toward a different tour style.",
      },
    ],
  },
  decisionBlock: {
    eyebrow: "Quick chooser",
    title: "Pick the tour by feel, not by a wall of listings.",
    body:
      "If the group wants excitement, start with an airboat. If comfort, shade, or easy conversation matters more, start with a covered boat. If nobody wants to solve transport, make pickup the first filter.",
    recommendation:
      "Most first-time visitors should choose one signature swamp tour and keep the rest of the day easy.",
    supportPoints: ["airboat vs covered boat", "hotel pickup", "kids and mixed ages", "heat and rain"],
    cta: {
      label: "Use the tour chooser",
      href: "/airboat-vs-boat",
    },
  },
  featuredCards: [
    {
      id: "airboat",
      title: "Airboat Swamp Tour",
      subtitle:
        "Fast, open-air, loud in the fun way, and best when the ride itself is the memory.",
      category: "Most exciting",
      destination: "wts",
      image: undefined,
      tags: ["open-air ride", "high energy", "check current price"],
      cta: { label: "Book airboat", href: airboatHref, external: true },
      providerType: "affiliate_fallback",
      disclosure: "Current pricing, times, pickup notes, and provider terms continue on the booking page.",
      decisionReason: "Best for travelers who want speed, spray, and a more cinematic swamp ride.",
    },
    {
      id: "covered-boat",
      title: "Covered Boat Swamp Tour",
      subtitle:
        "A calmer bayou ride with more shade, easier conversation, and a better fit for mixed groups.",
      category: "Most comfortable",
      destination: "wts",
      image: undefined,
      tags: ["shade", "families", "wildlife pace"],
      cta: { label: "Compare covered boats", href: boatHref, external: true },
      providerType: "affiliate_fallback",
      disclosure: "Confirm boat type, departure point, pickup, and weather terms with the listed provider.",
      decisionReason: "Best when comfort, shade, and group conversation matter more than speed.",
    },
    {
      id: "pickup",
      title: "Swamp Tour With Pickup",
      subtitle:
        "The cleaner no-car choice for visitors staying around the Quarter, CBD, or hotel zones.",
      category: "Easiest logistics",
      destination: "wts",
      image: undefined,
      tags: ["hotel pickup", "no car", "first-timers"],
      cta: { label: "Check pickup tours", href: "/transportation" },
      providerType: "partner_handoff",
      disclosure: "Pickup varies by provider and hotel zone. Confirm the exact meeting point before booking.",
      decisionReason: "Best when avoiding a rental car or rideshare puzzle matters more than chasing every option.",
    },
    {
      id: "families",
      title: "Family-Friendly Swamp Tour",
      subtitle:
        "A lower-stress plan for kids, grandparents, mixed ages, heat, and shorter attention spans.",
      category: "Best for groups",
      destination: "wts",
      image: undefined,
      tags: ["kids", "mixed ages", "shade first"],
      cta: { label: "Plan with kids", href: "/with-kids" },
      providerType: "partner_handoff",
      disclosure: "Use this as fit guidance; final age rules and safety terms come from the provider.",
      decisionReason: "Best when the goal is a good day for everyone, not the loudest possible ride.",
    },
  ],
  categoryGrid: {
    eyebrow: "Plan the swamp day",
    title: "Choose the thing that actually matters.",
    body:
      "Speed, comfort, pickup, family fit, and timing change the whole experience. Start with the right lane.",
    items: [
      {
        id: "airboat-vs-boat",
        title: "Airboat vs covered boat",
        body: "The main decision: exciting open-air ride or calmer shaded bayou cruise.",
        cta: { label: "Compare styles", href: "/airboat-vs-boat" },
        providerType: "partner_handoff",
      },
      {
        id: "pickup",
        title: "Pickup from New Orleans",
        body: "Use this when transportation convenience decides whether the swamp trip is worth it.",
        cta: { label: "Check pickup fit", href: "/transportation" },
        providerType: "partner_handoff",
      },
      {
        id: "families",
        title: "Going with kids",
        body: "Choose shade, pacing, and tour length before you choose a flashy title.",
        cta: { label: "Open family guide", href: "/with-kids" },
        providerType: "partner_handoff",
      },
      {
        id: "best-time",
        title: "Best time to go",
        body: "Heat, rain, and group energy change whether morning or afternoon makes sense.",
        cta: { label: "Plan timing", href: "/best-time" },
        providerType: "partner_handoff",
      },
    ],
  },
  providerDisclosure: {
    providerType: "affiliate_fallback",
    label: "How booking works",
    body:
      "Welcome to the Swamp helps you choose the right tour style, then sends you to partner or marketplace booking pages for live prices, current availability, pickup rules, cancellation terms, and provider-specific details.",
    allowedClaims: [
      "We can explain tour-style tradeoffs.",
      "We can send you to current booking options.",
      "We can flag pickup, weather, and family-fit questions.",
    ],
    notClaimed: [
      "We do not claim live availability on this page.",
      "We do not operate every tour shown by partners.",
      "We do not promise wildlife sightings, weather, or pickup eligibility.",
    ],
  },
  stickyMobileCta: {
    enabled: true,
    label: "Book airboat",
    href: airboatHref,
    external: true,
    providerType: "affiliate_fallback",
    disclosureLabel: "Current terms continue on booking page",
  },
  footer: {
    eyebrow: "Welcome to the Swamp",
    body:
      "A focused New Orleans swamp-tour storefront for choosing the ride style, pickup plan, and booking path that fits your day.",
    links: [
      { label: "Airboat vs boat", href: "/airboat-vs-boat" },
      { label: "With kids", href: "/with-kids" },
      { label: "Transportation", href: "/transportation" },
    ],
  },
};
