import { SITE_DESCRIPTION } from "@/lib/sitePositioning";
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
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Juneau Flight Deck | Alaska Cruise Excursions & Helicopter Tours",
    description: SITE_DESCRIPTION,
    url: "https://juneauflightdeck.com/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Flight Deck | Alaska Cruise Excursions & Helicopter Tours",
    description: SITE_DESCRIPTION,
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
      description: SITE_DESCRIPTION,
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
      description: SITE_DESCRIPTION,
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
      description: SITE_DESCRIPTION,
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
              name: "Availability Requests for Unavailable Dates",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Weather Alternative Planning Guidance",
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
