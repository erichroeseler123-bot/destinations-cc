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
    eyebrow: "New Orleans tours & swamp rides",
    title: "New Orleans tours, swamp rides, and local experiences.",
    summary:
      "Compare real bookable New Orleans tour options — from airboats and covered swamp boats to city tours and pickup-friendly experiences — then book directly through FareHarbor provider links.",
    primaryCta: {
      label: "Browse Tours",
      href: "/plan",
      ariaLabel: "Check current New Orleans and swamp tour options",
    },
    secondaryCta: {
      label: "Compare Options",
      href: "/airboat-vs-boat",
    },
    trustChips: ["Curated FareHarbor picks", "French Quarter pickup notes", "Group & family-fit guidance", "Direct provider checkouts"],
    media: {
      eyebrow: "Featured New Orleans tours",
      title: "Airboats, Shaded Shaded Boats, and City Sightseeing",
      body:
        "Choose the ride style, pickup convenience, or sightseeing pace that fits your day.",
      image: quietSwampImage,
      rows: [
        { label: "Tours", value: "Airboat & Shaded" },
        { label: "Sightseeing", value: "City & Landmarks" },
        { label: "Convenience", value: "Quarter Pickup" },
      ],
    },
  },
  trustStrip: {
    items: [
      {
        id: "curated",
        label: "Curated lineup",
        body: "Real local operators selected for safety, guide quality, and positive traveler reviews.",
      },
      {
        id: "boat-style",
        label: "Compare the ride",
        body: "Easily compare high-energy open airboats with calm, shaded covered pontoon swamp boats.",
      },
      {
        id: "city-sightseeing",
        label: "Explore the city",
        body: "Sightseeing tours through historic New Orleans neighborhoods with professional local guides.",
      },
      {
        id: "pickup",
        label: "Pickup convenience",
        body: "Identify options offering hotel pickup service from the French Quarter and CBD hotel zones.",
      },
    ],
  },
  decisionBlock: {
    eyebrow: "Quick chooser",
    title: "Pick the experience that fits your group feel.",
    body:
      "If you want speed and open marsh thrills, go with an airboat. If shade, comfort, or conversation is key, choose a covered pontoon boat. If you want city sightseeing, choose a city van/bus tour.",
    recommendation:
      "First-time visitors should combine a swamp tour with a city overview to experience both local nature and history.",
    supportPoints: ["airboats vs covered boats", "city tour options", "hotel pickups", "private charters"],
    cta: {
      label: "Use the tour chooser",
      href: "/airboat-vs-boat",
    },
  },
  featuredCards: [
    {
      id: "ragincajun-airboat",
      title: "Airboat Tour",
      subtitle: "Ragin Cajun Tours",
      category: "Airboat Tour",
      destination: "wts",
      image: undefined,
      tags: [],
      cta: { label: "View Dates & Details", href: "/tours/airboat-tour" },
      providerType: "affiliate_fallback",
      disclosure: "Fast, open-air swamp ride for travelers who want the most action and wind-in-your-face energy.",
    },
    {
      id: "ragincajun-covered-boat",
      title: "Covered Swamp Boat",
      subtitle: "Ragin Cajun Tours",
      category: "Swamp Boat Tour",
      destination: "wts",
      image: undefined,
      tags: [],
      cta: { label: "View Dates & Details", href: "/tours/covered-swamp-boat" },
      providerType: "affiliate_fallback",
      disclosure: "A calmer swamp ride with shade and easier conversation, good for families and laid-back groups.",
    },
    {
      id: "ragincajun-private-boat",
      title: "Private Covered Tour",
      subtitle: "Ragin Cajun Tours",
      category: "Private Tour",
      destination: "wts",
      image: undefined,
      tags: [],
      cta: { label: "View Dates & Details", href: "/tours/private-covered-tour" },
      providerType: "affiliate_fallback",
      disclosure: "A private swamp option for groups that want more control over timing, space, and pace.",
    },
    {
      id: "southernstyle-swamp",
      title: "Plantation Tour",
      subtitle: "Southern Style Tours",
      category: "Plantation Tour",
      destination: "wts",
      image: undefined,
      tags: [],
      cta: { label: "View Dates & Details", href: "/tours/plantation-tour" },
      providerType: "affiliate_fallback",
      disclosure: "A history-focused tour outside the city for visitors who want to see more of Louisiana beyond New Orleans.",
    },
    {
      id: "southernstyle-city-tour",
      title: "City Tour",
      subtitle: "Southern Style Tours",
      category: "City Tour",
      destination: "wts",
      image: undefined,
      tags: [],
      cta: { label: "View Dates & Details", href: "/tours/city-tour" },
      providerType: "affiliate_fallback",
      disclosure: "A simple New Orleans overview for first-time visitors who want the city layout before or after other tours.",
    },
  ],
  categoryGrid: {
    eyebrow: "Browse by experience",
    title: "Choose the tour type that fits your day.",
    body:
      "From high-energy open-air rides to guided city historical tours, choose your pace.",
    items: [
      {
        id: "airboats",
        title: "Airboat Tours",
        body: "Compare speed, noise, and open-air ride options on high-speed boats.",
        cta: { label: "Compare airboats", href: "/airboat-vs-boat" },
        providerType: "affiliate_fallback",
      },
      {
        id: "swamp-boats",
        title: "Swamp Boat Tours",
        body: "Calmer, shaded bayou cruises with cypress scenery and Spanish moss.",
        cta: { label: "Compare swamp boats", href: "/airboat-vs-boat" },
        providerType: "affiliate_fallback",
      },
      {
        id: "private-tours",
        title: "Private Tours",
        body: "Private airboats and covered swamp boats for custom family and friend groups.",
        cta: { label: "Plan private tour", href: "/plan" },
        providerType: "affiliate_fallback",
      },
      {
        id: "city-tours",
        title: "City Tours",
        body: "Explore the French Quarter, Garden District, and New Orleans history.",
        cta: { label: "Browse city tours", href: "/plan" },
        providerType: "affiliate_fallback",
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
