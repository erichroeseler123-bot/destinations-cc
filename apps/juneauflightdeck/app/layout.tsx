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
      "@type": "Organization",
      "@id": "https://juneauflightdeck.com/#organization",
      name: "Juneau Flight Deck",
      url: "https://juneauflightdeck.com",
      description:
        "Independent Juneau flightseeing weather-education, cruise port-buffer, and concierge planning guide. Juneau Flight Deck is an independent editorial and concierge resource and is not an aircraft owner or FAA Part 135 air carrier.",
      areaServed: [
        { "@type": "City", name: "Juneau" },
        { "@type": "City", name: "Skagway" },
        { "@type": "AdministrativeArea", name: "Alaska" },
      ],
      knowsAbout: [
        "Juneau glacier helicopter tour comparisons",
        "Juneau Airport (PAJN) and FAA WeatherCams visibility",
        "Cruise ship port return-buffer planning",
        "Juneau weather backup shore excursions",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://juneauflightdeck.com/#website",
      name: "Juneau Flight Deck",
      url: "https://juneauflightdeck.com",
      description: SITE_DESCRIPTION,
      inLanguage: "en-US",
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
