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
        url: "/images/alaska/inside-passage-hero.jpg",
        width: 1920,
        height: 1200,
        alt: "Glaciated peaks and fjords of the Alaska Inside Passage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Last Frontier Shore Excursions",
    description: DESCRIPTION,
    images: ["/images/alaska/inside-passage-hero.jpg"],
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
        <header className="site-header shell">
          <Link className="brand" href="/">Last Frontier Shore Excursions</Link>
          <nav className="nav" aria-label="Primary navigation">
            <Link href="/ports/juneau">Juneau</Link>
            <Link href="/ports/skagway">Skagway</Link>
            <Link href="/ports/ketchikan">Ketchikan</Link>
            <Link href="/ports/sitka">Sitka</Link>
            <Link href="/ports/icy-strait-point">Icy Strait Point</Link>
            <Link href="/tours">All Tours</Link>
            <Link href="/decision/best-excursion-for-each-port">Decision Guides</Link>
            <Link href="/about">About</Link>
          </nav>
        </header>
        {children}
        <footer className="footer">
          <div className="shell">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
              <div>
                <strong>Last Frontier Shore Excursions</strong>
                <p style={{ maxWidth: 500, margin: "8px 0" }}>
                  Cruise-safe Alaska shore excursions, sorted by port and timing. Tour availability, live pricing, meeting points, and cancellation terms are controlled directly by the tour provider.
                </p>
              </div>
              <div>
                <strong>Quick Links</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  <Link href="/tours">Complete Tours Catalog</Link>
                  <Link href="/decision/best-excursion-for-each-port">Best Excursions by Port</Link>
                  <Link href="/decision/excursions-safe-for-cruise-ship-window">The 45-Minute Safety Rule</Link>
                  <Link href="/about">About, Affiliate & Booking Boundaries</Link>
                </div>
              </div>
            </div>
            <p style={{ marginTop: 24, fontSize: "13px" }}>
              © {new Date().getFullYear()} Last Frontier Shore Excursions. Independent Alaska cruise planning.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
