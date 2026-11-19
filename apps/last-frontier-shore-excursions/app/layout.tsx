import type { Metadata } from "next";
import Link from "next/link";
import { LfseSiteHeader } from "@/components/LfseSiteHeader";
import { LfseAnalyticsBridge } from "@/components/LfseAnalyticsBridge";
import { getSoutheastAlaskaDirectorySnapshot } from "../../../lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";
import { LFSE_PUBLISHER_ORGANIZATION, LFSE_SITE_URL } from "@/lib/structuredData";
import "./globals.css";

const DESCRIPTION =
  "Compare Alaska shore excursions across Juneau, Skagway, Ketchikan, Sitka, Icy Strait Point, Hoonah, Haines, Wrangell, Petersburg, Klawock, Gustavus, and Glacier Bay by dock logistics, local operators, and 2-hour return buffers.";

export const metadata: Metadata = {
  metadataBase: new URL(LFSE_SITE_URL),
  title: {
    default: "Last Frontier Shore Excursions | Southeast Alaska Port & Excursion Guide",
    template: "%s | Last Frontier Shore Excursions",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Last Frontier Shore Excursions | Southeast Alaska Port & Excursion Guide",
    description: DESCRIPTION,
    url: LFSE_SITE_URL,
    siteName: "Last Frontier Shore Excursions",
    type: "website",
    images: [
      {
        url: "/images/alaska/inside-passage-hero-generated.png",
        width: 1600,
        height: 900,
        alt: "Sightseeing vessel cruising calm Alaska Inside Passage fjord waters surrounded by snow-dusted coastal peaks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Last Frontier Shore Excursions",
    description: DESCRIPTION,
    images: ["/images/alaska/inside-passage-hero-generated.png"],
  },
};

function SiteJsonLd() {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const verifiedPlaces = snapshot.places.filter(
    (entry) => entry.gate.indexable && entry.place.publicPortSlug,
  );

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...LFSE_PUBLISHER_ORGANIZATION,
        description: DESCRIPTION,
        areaServed: verifiedPlaces.map(({ place }) => `${place.name}, Alaska`),
        knowsAbout: [
          "Southeast Alaska shore excursions",
          "Alaska cruise ports and harbors",
          "Juneau whale watching and Mendenhall Glacier",
          "Juneau Icefield helicopter glacier tours",
          "White Pass & Yukon Route railway",
          "Misty Fjords floatplanes and catamarans",
          "Icy Strait Point and Hoonah excursions",
          "Glacier Bay scenic cruising rules",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${LFSE_SITE_URL}/#website`,
        name: "Last Frontier Shore Excursions",
        url: LFSE_SITE_URL,
        publisher: { "@id": `${LFSE_SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "ItemList",
        "@id": `${LFSE_SITE_URL}/#ports`,
        name: "Southeast Alaska cruise ports and communities",
        itemListElement: verifiedPlaces.map(({ place }, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: place.name,
          url: `${LFSE_SITE_URL}/ports/${place.publicPortSlug}`,
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#lfse-main-content" className="lfse-skip-link">
          Skip to main content
        </a>
        <SiteJsonLd />
        <LfseAnalyticsBridge />
        <LfseSiteHeader />
        <div id="lfse-main-content" tabIndex={-1}>
          {children}
        </div>
        <footer className="lfse-footer">
          <div className="shell">
            <div className="lfse-footer-top">
              <div style={{ maxWidth: 520 }}>
                <strong className="lfse-footer-title">Last Frontier Shore Excursions</strong>
                <p className="lfse-footer-copy">
                  Independent Southeast Alaska port, community, and excursion comparison
                  guide. Reservations, live seat inventory, meeting instructions, and
                  cancellation terms are completed directly with each listed local operator
                  or booking partner.
                </p>
              </div>
              <nav className="lfse-footer-links" aria-label="Footer navigation">
                <Link href="/southeast-alaska">Southeast Alaska</Link>
                <Link href="/southeast-alaska/fishing-lodges">Fishing Lodges</Link>
                <Link href="/ports">Ports &amp; Communities</Link>
                <Link href="/guides/weekend-in-juneau">Weekend in Juneau</Link>
                <Link href="/operators">Local Operators</Link>
                <Link href="/tours">Excursions</Link>
                <Link href="/cruise-ships">Cruise Ships</Link>
                <Link href="/decision/excursions-safe-for-cruise-ship-window">
                  2-Hour Return Standard
                </Link>
                <Link href="/about">About &amp; Disclosures</Link>
                <Link href="/contact">Contact</Link>
              </nav>
            </div>
            <div className="lfse-footer-bottom">
              <span>
                © {new Date().getFullYear()} Last Frontier Shore Excursions · Southeast
                Alaska Ports, Harbors &amp; Local Operators
              </span>
              <span>Independent planning guide · Not affiliated with any cruise line.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
