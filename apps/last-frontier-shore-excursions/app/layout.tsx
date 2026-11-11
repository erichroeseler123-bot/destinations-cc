import type { Metadata } from "next";
import Link from "next/link";
import { PORTS } from "@/lib/ports";
import "./globals.css";

const SITE = "https://www.lastfrontiershoreexcursions.com";
const DESCRIPTION =
  "Compare cruise-safe Alaska shore excursions in Juneau, Skagway, Ketchikan, Sitka, and Icy Strait Point by port, ship-day timing, duration, and return-to-ship margins.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Last Frontier Shore Excursions | Cruise-Safe Alaska Shore Excursions",
    template: "%s | Last Frontier Shore Excursions",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Last Frontier Shore Excursions | Cruise-Safe Alaska Shore Excursions",
    description: DESCRIPTION,
    url: SITE,
    siteName: "Last Frontier Shore Excursions",
    type: "website",
    images: [
      {
        url: "/images/alaska/inside-passage-hero-generated.png",
        width: 1024,
        height: 426,
        alt: "Panoramic vista of a grand tidewater glacier flowing into the Alaska Inside Passage surrounded by snow-dusted mountains",
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

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        name: "Last Frontier Shore Excursions",
        url: SITE,
        description: DESCRIPTION,
        areaServed: PORTS.map((port) => `${port.name}, Alaska`),
        knowsAbout: [
          "Alaska shore excursions",
          "Alaska cruise ports",
          "Juneau whale watching",
          "Mendenhall Glacier tours",
          "White Pass Railway",
          "Misty Fjords floatplanes",
          "cruise port timing",
          "return to ship safety",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        name: "Last Frontier Shore Excursions",
        url: SITE,
        publisher: { "@id": `${SITE}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "ItemList",
        "@id": `${SITE}/#ports`,
        name: "Alaska cruise ports",
        itemListElement: PORTS.map((port, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${port.name} shore excursions`,
          url: `${SITE}/ports/${port.slug}`,
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLd />
        <header className="lfse-site-header">
          <div className="shell lfse-header-inner">
            <Link className="lfse-brand" href="/">
              <span className="lfse-brand-title">Last Frontier Shore Excursions</span>
              <span className="lfse-brand-sub">Alaska Port-Window Excursion Guide</span>
            </Link>
            <nav className="lfse-nav" aria-label="Primary navigation">
              <Link href="/#ports">Ports</Link>
              <Link href="/#calculator">Port Window Check</Link>
              <Link href="/tours">All Excursions</Link>
              <Link href="/cruise-ships">Cruise Ships</Link>
              <Link className="lfse-nav-cta" href="/contact">Group &amp; Custom Help</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="lfse-footer">
          <div className="shell">
            <div className="lfse-footer-top">
              <div style={{ maxWidth: 520 }}>
                <strong className="lfse-footer-title">Last Frontier Shore Excursions</strong>
                <p className="lfse-footer-copy">
                  Independent Alaska cruise-port comparison guide. Checkout, live seat inventory, meeting instructions, and cancellation terms are completed directly with each listed partner or operator.
                </p>
              </div>
              <nav className="lfse-footer-links" aria-label="Footer navigation">
                <Link href="/cruise-ships">Ships &amp; Port Windows</Link>
                <Link href="/tours">All Excursions</Link>
                <Link href="/decision/excursions-safe-for-cruise-ship-window">45-Minute Safety Rule</Link>
                <Link href="/about">About &amp; Disclosures</Link>
                <Link href="/contact">Group &amp; Custom Help</Link>
              </nav>
            </div>
            <div className="lfse-footer-bottom">
              <span>© {new Date().getFullYear()} Last Frontier Shore Excursions · Juneau, Skagway, Ketchikan, Sitka &amp; Icy Strait Point</span>
              <span>Not affiliated with any cruise line.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
