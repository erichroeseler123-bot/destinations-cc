import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "./components/SiteHeader";
import { WhatsLiveButton } from "./components/WhatsLiveButton";
import { SocialLinks } from "./components/SocialLinks";
import { getSameAs } from "../lib/socials";
import { SITE_CONFIG } from "./site-config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Save On The Strip",
  description:
    "Vegas-first trip planning and deal routing across shows, tours, hotels, and Strip logistics, connected back to Destination Command Center.",
  alternates: { canonical: "https://saveonthestrip.com/" },
  openGraph: {
    title: "Save On The Strip",
    description:
      "Vegas-first trip planning across shows, tours, deals, and practical Strip planning.",
    url: "https://saveonthestrip.com/",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brandKey = SITE_CONFIG.socialBrandKey;
  const sameAs = getSameAs(brandKey);
  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/json" href="/agent.json" />
        <link rel="alternate" type="text/plain" href="/llms.txt" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "Save On The Strip",
                  url: "https://saveonthestrip.com/",
                  sameAs,
                  contactPoint: [
                    {
                      "@type": "ContactPoint",
                      contactType: "customer support",
                      telephone: "+1-702-530-3081",
                      email: "contact@saveonthestrip.com",
                      areaServed: "US",
                    },
                  ],
                },
                {
                  "@type": "WebSite",
                  name: "Save On The Strip",
                  url: "https://saveonthestrip.com/",
                  sameAs,
                },
              ],
            }),
          }}
        />
        <div className="shell">
          <SiteHeader />
          {children}
          <WhatsLiveButton />
          <footer className="site-footer">
            <div className="footer-grid">
              <div className="footer-block">
                <div className="eyebrow">Save On The Strip</div>
                <p>
                  A mobile-first Vegas guide built to help people choose better show nights, day
                  tours, hotel moves, and deal lanes without getting lost in junk pages.
                </p>
                <SocialLinks brandKey={brandKey} mode="footer" showLabels className="mt-3" />
              </div>

              <div className="footer-block">
                <div className="eyebrow">Popular pages</div>
                <div className="footer-links">
                  <Link href="/shows">Vegas shows</Link>
                  <Link href="/tours">Vegas tours</Link>
                  <Link href="/deals">Vegas deals</Link>
                  <Link href="/hotels">Vegas hotels</Link>
                  <Link href="/free-things">Free things to do</Link>
                  <Link href="/timeshares">Vegas timeshares</Link>
                  <Link href="/about">About this site</Link>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                  <Link href="/contact">Contact</Link>
                </div>
              </div>

              <div className="footer-block">
                <div className="eyebrow">Start with</div>
                <div className="footer-links">
                  <Link href="/shows/sphere">Sphere shows</Link>
                  <Link href="/deals">Free ticket pickup</Link>
                  <Link href="/hotels/rio-las-vegas-renovation-update">Rio hotel guide</Link>
                  <Link href="/hotels/hard-rock-las-vegas-construction-update">Hard Rock update</Link>
                  <Link href="/free-things">Free attractions</Link>
                  <Link href="/tours">Grand Canyon tours</Link>
                  <Link href="/tours">Hoover Dam tours</Link>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <p>
                Use Save On The Strip for practical Vegas planning, comparisons, and useful next
                steps. Call <a href="tel:+17025303081">702-530-3081</a> or{" "}
                <a href="mailto:contact@saveonthestrip.com">email us</a>.
              </p>
              <p>&copy; {new Date().getFullYear()} Save On The Strip</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
