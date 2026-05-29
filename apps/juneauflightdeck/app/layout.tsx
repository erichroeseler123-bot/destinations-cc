import type { Metadata } from "next";
import { buildNetworkEntityGraph } from "@/lib/dcc/networkEntityJsonLd";
import PartnerAnalyticsScript from "./components/PartnerAnalyticsScript";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://juneauflightdeck.com"),
  title: {
    default: "Juneau Flight Deck",
    template: "%s | Juneau Flight Deck",
  },
  description:
    "Juneau glacier helicopter tours, whale-watching backups, weather-aware planning, and cruise-safe timing help.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Juneau Flight Deck",
    description:
      "Juneau glacier helicopter tours, whale-watching backups, and cruise-safe timing help.",
    url: "https://juneauflightdeck.com/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Flight Deck",
    description:
      "Find glacier helicopter tours, whale-watching backups, and cruise-safe timing help from Juneau and Skagway.",
  },
};

const siteJsonLd = buildNetworkEntityGraph({
  baseUrl: "https://juneauflightdeck.com",
  name: "Juneau Flight Deck",
  description:
    "Cruise-port storefront for Juneau and Skagway travelers comparing helicopter glacier tours and shore-day backups.",
  relationshipToDcc: "parentOrganization",
  service: {
    name: "Juneau excursion decision support",
    description:
      "A focused helicopter and shore-excursion planning storefront for cruise passengers at Juneau and Skagway.",
    areaServed: [
      { "@type": "City", name: "Juneau" },
      { "@type": "City", name: "Skagway" },
      { "@type": "AdministrativeArea", name: "Alaska" },
    ],
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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
