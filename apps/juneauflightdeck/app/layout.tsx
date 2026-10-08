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
    "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Juneau Flight Deck | Alaska Cruise Excursions & Helicopter Tours",
    description:
      "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans.",
    url: "https://juneauflightdeck.com/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Flight Deck | Alaska Cruise Excursions & Helicopter Tours",
    description:
      "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans.",
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
        "Juneau Flight Deck helps Alaska cruise passengers compare and book helicopter, glacier, dog-sledding, and whale-watching excursions. We provide operator comparisons and cruise-port timing guidance, waitlists for sold-out tours, and alternatives when weather disrupts plans. Tours are operated by the named local providers.",
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
        "Compare and book Alaska cruise excursions: Juneau helicopter glacier tours, dog sledding, whale watching backups, and sold-out tour waitlists.",
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
      name: "Juneau Helicopter & Shore Excursion Booking & Comparison",
      url: "https://juneauflightdeck.com/helicopter",
      description:
        "Compare and book Juneau and Skagway helicopter glacier tours, dog sledding, and whale-watching excursions with port timing guidance, sold-out alerts, and weather alternatives.",
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
