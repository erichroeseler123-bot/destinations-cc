import type { Metadata } from "next";
import { type AlaskaShipData } from "./alaskaCruiseFleet";

export interface MetadataMatrixParams {
  ship: AlaskaShipData;
  tourSlug?: "dog-sledding" | "glacier-landing" | "ice-trek" | "flightseeing" | "all";
  intent?: "sold-out" | "timing-safety" | "general";
}

export function buildShipWaitlistMetadata({
  ship,
  tourSlug = "all",
  intent = "sold-out",
}: MetadataMatrixParams): Metadata {
  const tourName =
    tourSlug === "dog-sledding"
      ? "Glacier Dog Sledding"
      : tourSlug === "ice-trek"
      ? "Glacier Ice Trek"
      : tourSlug === "flightseeing"
      ? "5-Glacier Scenic Flight"
      : "Helicopter Glacier Tour";

  const title = `${ship.shipName} Juneau Helicopter Tours & Excursions | Compare, Book & Availability Alerts`;
  
  const description = `Compare and book Juneau helicopter, glacier, and dog-sledding excursions for ${ship.shipName} (${ship.cruiseLine}). Includes port timing for ${ship.typicalScheduledBerth.split("(")[0].trim()}, operator comparisons, and sold-out availability alerts.`;

  const canonicalUrl = `https://juneauflightdeck.com/helicopter-waitlist/${ship.slug}`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Juneau Flight Deck",
      type: "website",
      images: [
        {
          url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 630,
          alt: `${ship.shipName} helicopter glacier tour in Juneau, Alaska`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function buildShipFaqSchema(ship: AlaskaShipData) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What happens if helicopter tours are sold out on ${ship.shipName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `When ${ship.shipName} shows sold out through the cruise line excursion desk, our 24/7 automated scanner monitors local FAA Part 135 operators (TEMSCO, Coastal, NorthStar) daily at 10:00 AM when cancellation drops occur. When an open seat drops, we alert or place a concierge courtesy hold under standard operator cancellation rules.`,
        },
      },
      {
        "@type": "Question",
        name: `Where does ${ship.shipName} dock in Juneau, and how does helicopter pickup work?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${ship.shipName} is typically scheduled at ${ship.typicalScheduledBerth} during its port hours (${ship.dockHours}), subject to CBJ harbor master assignment. Helicopter operators provide dedicated shuttles picking you up directly outside security gates, with a 15-minute transfer to the heliport and safe return before all-aboard.`,
        },
      },
      {
        "@type": "Question",
        name: `Can ${ship.shipName} passengers do glacier dog sledding in Skagway instead?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: ship.callsAtSkagway
            ? `If ${ship.shipName} calls at Skagway on your sailing, TEMSCO Skagway operates glacier dog camps on Denver Glacier with alternative departure times. Verify your sailing dates with your cruise itinerary.`
            : `Availability depends on your specific ship itinerary. Check your sailing schedule for Skagway calls.`,
        },
      },
    ],
  };
}
