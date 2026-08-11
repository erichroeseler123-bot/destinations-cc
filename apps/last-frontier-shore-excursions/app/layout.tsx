import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lastfrontiershoreexcursions.com"),
  title: "Last Frontier Shore Excursions | Alaska Cruise Port Tours",
  description: "Alaska shore excursions built around your time in port. Compare Juneau, Skagway, Ketchikan, Sitka, and Icy Strait Point tours by fit, time, and weather backup.",
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell site-header">
          <Link className="brand" href="/">Last Frontier Shore Excursions</Link>
          <nav className="nav" aria-label="Primary navigation">
            <Link href="/ports/juneau">Juneau</Link>
            <Link href="/ports/skagway">Skagway</Link>
            <Link href="/ports/ketchikan">Ketchikan</Link>
            <Link href="/ports/sitka">Sitka</Link>
            <Link href="/ports/icy-strait-point">Icy Strait Point</Link>
          </nav>
        </div>
        {children}
        <footer className="footer">
          <div className="shell">
            <strong>Last Frontier Shore Excursions</strong>
            <p>Independent Alaska cruise-excursion guide. Tour availability, schedules, meeting points, and cancellation terms are controlled by the tour provider. Affiliate links may earn us a commission.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
