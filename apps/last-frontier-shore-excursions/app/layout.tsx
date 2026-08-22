import type { Metadata } from "next";
import Link from "next/link";
import { PORTS } from "@/lib/ports";
import "./globals.css";

const SITE = "https://lastfrontiershoreexcursions.com";
const DESCRIPTION =
  "Compare Alaska cruise shore excursions in Juneau, Skagway, Ketchikan, Sitka, and Icy Strait Point by experience, port-day fit, duration, and weather backup.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Last Frontier Shore Excursions | Alaska Cruise Port Tours",
    template: "%s | Last Frontier Shore Excursions",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Last Frontier Shore Excursions | Alaska Cruise Port Tours",
    description: DESCRIPTION,
    url: SITE,
    siteName: "Last Frontier Shore Excursions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Last Frontier Shore Excursions",
    description: DESCRIPTION,
  },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE}/#organization`,
        name: "Last Frontier Shore Excursions",
        url: SITE,
        description: DESCRIPTION,
        areaServed: PORTS.map((port) => `${port.name}, Alaska`),
        knowsAbout: [
          "Alaska shore excursions",
          "Alaska cruise ports",
          "Juneau shore excursions",
          "Skagway shore excursions",
          "Ketchikan shore excursions",
          "Sitka shore excursions",
          "Icy Strait Point shore excursions",
          "cruise port timing",
          "weather backup planning",
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
        <div className="shell site-header">
          <Link className="brand" href="/">Last Frontier Shore Excursions</Link>
          <nav className="nav" aria-label="Primary navigation">
            <Link href="/ports/juneau">Juneau</Link>
            <Link href="/ports/skagway">Skagway</Link>
            <Link href="/ports/ketchikan">Ketchikan</Link>
            <Link href="/ports/sitka">Sitka</Link>
            <Link href="/ports/icy-strait-point">Icy Strait Point</Link>
            <Link href="/about">About</Link>
          </nav>
        </div>
        {children}
        <footer className="footer">
          <div className="shell">
            <strong>Last Frontier Shore Excursions</strong>
            <p>Independent Alaska cruise-excursion planning and comparison. Tour availability, schedules, meeting points, and cancellation terms are controlled by the tour provider. Affiliate links may earn us a commission.</p>
            <p><Link href="/about">About, booking boundaries & affiliate transparency</Link></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
