import type { Metadata } from "next";
import PartnerAnalyticsScript from "./components/PartnerAnalyticsScript";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import DccNetworkBridge from "./components/DccNetworkBridge";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://juneauflightdeck.com"),
  title: {
    default: "Juneau Flight Deck",
    template: "%s | Juneau Flight Deck",
  },
  description:
    "Official Viator partner combining direct booking with local ground coordination for Juneau & Skagway helicopter glacier tours, sold-out seat monitoring, and weather backups.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Juneau Flight Deck | Alaska Helicopter & Glacier Tours",
    description:
      "Official Viator partner combining direct booking with local ground coordination for Alaska glacier flights, sold-out seat monitoring, and weather backups.",
    url: "https://juneauflightdeck.com/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Flight Deck | Alaska Helicopter & Glacier Tours",
    description:
      "Official Viator partner combining direct booking with local ground coordination for Alaska glacier flights, sold-out seat monitoring, and weather backups.",
  },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://juneauflightdeck.com/#organization",
      name: "Juneau Flight Deck",
      url: "https://juneauflightdeck.com",
      description:
        "Local Juneau shore excursion coordination service and official Viator partner. Combining online booking with local ground dispatch coordination, sold-out seat monitoring, and weather backups.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Juneau",
        addressRegion: "AK",
        addressCountry: "US",
      },
      areaServed: [
        { "@type": "City", name: "Juneau" },
        { "@type": "City", name: "Skagway" },
        { "@type": "AdministrativeArea", name: "Alaska" },
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://juneauflightdeck.com/#website",
      name: "Juneau Flight Deck",
      url: "https://juneauflightdeck.com",
      description:
        "Alaska glacier helicopter tour booking, sold-out availability watch, and weather backup coordination.",
      publisher: { "@id": "https://juneauflightdeck.com/#organization" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://juneauflightdeck.com/#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Juneau Flight Deck",
          item: "https://juneauflightdeck.com/",
        },
      ],
    },
    {
      "@type": "Service",
      "@id": "https://juneauflightdeck.com/#service-helicopter",
      name: "Juneau Helicopter Tour Booking & Availability Watch",
      url: "https://juneauflightdeck.com/helicopter",
      description:
        "Direct booking for TEMSCO, Coastal, and NorthStar glacier helicopter tours, automated waitlist seat monitoring, and weather contingency support.",
      provider: { "@id": "https://juneauflightdeck.com/#organization" },
      areaServed: [
        { "@type": "City", name: "Juneau" },
        { "@type": "City", name: "Skagway" },
        { "@type": "AdministrativeArea", name: "Alaska" },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Glacier Flight & Backup Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "FAA Part 135 Helicopter Glacier Flights",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Sold-Out Availability Watch & Risk-Free Seat Holds",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Weather Cancellation Rebooking & Whale Watching Pivots",
            },
          },
        ],
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DccNetworkBridge />
        <PartnerAnalyticsScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <div className="site-root">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
