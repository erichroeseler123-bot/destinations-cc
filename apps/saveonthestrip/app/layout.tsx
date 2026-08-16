import type { Metadata } from "next";
import Link from "next/link";
import DccPortfolioBridge from "@/app/components/DccPortfolioBridge";
import { SiteHeader } from "./components/SiteHeader";
import { WhatsLiveButton } from "./components/WhatsLiveButton";
import { SocialLinks } from "./components/SocialLinks";
import { getSameAs } from "../lib/socials";
import { SITE_CONFIG } from "./site-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Save On The Strip",
  description: "A faster way to decide what is actually worth your money in Las Vegas: tonight, shows, tours, free wins, hotel moves, and practical Strip planning.",
  alternates: { canonical: "https://saveonthestrip.com/" },
  openGraph: { title: "Save On The Strip", description: "Do not waste money in Vegas. Find the nights, outings, and free wins that are actually worth it.", url: "https://saveonthestrip.com/", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brandKey = SITE_CONFIG.socialBrandKey;
  const sameAs = getSameAs(brandKey);
  return (
    <html lang="en">
      <head><link rel="alternate" type="application/json" href="/agent.json" /><link rel="alternate" type="text/plain" href="/llms.txt" /></head>
      <body>
        <DccPortfolioBridge site="save-on-the-strip" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [{ "@type": "Organization", name: "Save On The Strip", url: "https://saveonthestrip.com/", sameAs, contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", telephone: "+1-702-530-3081", email: "contact@saveonthestrip.com", areaServed: "US" }] }, { "@type": "WebSite", name: "Save On The Strip", url: "https://saveonthestrip.com/", sameAs }] }) }} />
        <div className="shell">
          <SiteHeader />{children}<WhatsLiveButton />
          <footer className="site-footer">
            <div className="footer-grid">
              <div className="footer-block"><div className="eyebrow">Save On The Strip</div><p>A Vegas decision guide for people who would rather make one good choice than scroll through 200 bad ones.</p><SocialLinks brandKey={brandKey} mode="footer" showLabels className="mt-3" /></div>
              <div className="footer-block"><div className="eyebrow">Decide faster</div><div className="footer-links"><Link href="/tonight">What to do tonight</Link><Link href="/worth-it">What is worth it</Link><Link href="/under-100">Vegas under $100</Link><Link href="/near-your-hotel">Things near your hotel</Link><Link href="/four-hours-in-vegas">Four hours in Vegas</Link><Link href="/before-a-late-flight">Before a late flight</Link><Link href="/what-to-skip-in-las-vegas">What to skip</Link></div></div>
              <div className="footer-block"><div className="eyebrow">Compare before you spend</div><div className="footer-links"><Link href="/shows">Vegas shows</Link><Link href="/tours">Vegas tours</Link><Link href="/free-things">Free things to do</Link><Link href="/compare/sphere-vs-vegas-show">Sphere vs a Vegas show</Link><Link href="/compare/grand-canyon-vs-hoover-dam">Grand Canyon vs Hoover Dam</Link><Link href="/hotels">Vegas hotels</Link><Link href="/about">About</Link></div></div>
            </div>
            <div className="footer-bottom"><p>Prices, availability, schedules, and operator terms can change. Check the provider before purchase. Call <a href="tel:+17025303081">702-530-3081</a> or <a href="mailto:contact@saveonthestrip.com">email us</a>.</p><p>&copy; {new Date().getFullYear()} Save On The Strip</p></div>
          </footer>
        </div>
      </body>
    </html>
  );
}
